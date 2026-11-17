"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { applySelection, loadCatalogue } from "@/lib/catalogue";
import {
  PASSWORD_MIN,
  readPassword,
  readProfile,
  readSelectedServices,
  readServiceDetails,
} from "@/lib/forms";
import { currentProvider, signIn, signOut } from "@/lib/session";
import { authenticate, changeOwnPassword, createProvider, deleteOwnAccount, endAllSessions, updateProvider } from "@/lib/store";

/** The text values of a submitted form (never the password), so a failed submit does not clear the fields. */
function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !/password/i.test(key)) values[key] = value;
  }
  // Checkbox groups repeat one key; keep every ticked service, comma separated.
  values.__services = form.getAll("service").join(",");
  values.__options = form.getAll("option").join("|");
  return values;
}

export async function registerAction(_: ActionState, form: FormData): Promise<ActionState> {
  const { value: profile, errors } = readProfile(form);
  const password = readPassword(form);
  if (password.error) errors.password = password.error;
  if (form.get("password") !== form.get("confirmPassword")) errors.confirmPassword = "The two passwords do not match.";

  const selected = readSelectedServices(form);
  if (selected.length === 0) errors.service = "Choose at least one service you offer.";
  if (form.get("terms") !== "on") errors.terms = "Please accept the terms to register.";

  if (Object.keys(errors).length > 0) return { errors, values: echo(form), message: "Please fix the highlighted fields." };

  const services = applySelection(selected, await loadCatalogue());
  if (services.length === 0) return { errors: { service: "Choose at least one service you offer." }, values: echo(form) };

  const provider = await createProvider({
    ...profile,
    password: password.value,
    createdBy: "SELF",
    status: "PENDING",
    services,
  });
  if (!provider) {
    return { errors: { email: "An account with this email already exists. Sign in instead." }, values: echo(form) };
  }

  // No sign-in here: an administrator must approve the registration first.
  redirect("/register/submitted");
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const provider = await authenticate(email, password);
  if (!provider) {
    return { errors: {}, message: "The email or password is not correct.", values: { email } };
  }
  // Only after the password is right do we say why sign-in is refused, so the status of an account is not
  // revealed to someone who does not know its password.
  if (provider.status === "PENDING") {
    return {
      errors: {},
      message: "Your registration is waiting for approval by EVENTGRID. You can sign in as soon as it is approved.",
      values: { email },
    };
  }
  if (provider.status === "REJECTED") {
    return { errors: {}, message: "Your registration was not approved. Please contact EVENTGRID support.", values: { email } };
  }
  await signIn(provider.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await signOut();
  redirect("/login");
}

export async function saveProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  const provider = await currentProvider();
  if (!provider) redirect("/login");

  const { value, errors } = readProfile(form);
  if (Object.keys(errors).length > 0) return { errors, values: echo(form), message: "Please fix the highlighted fields." };

  const updated = await updateProvider(provider.id, (p) => {
    p.name = value.name;
    p.type = value.type;
    p.phone = value.phone;
    p.city = value.city;
    p.area = value.area;
    p.about = value.about;
    // The sign-in email is not changed here: that needs a verification step the prototype does not have.
  });
  revalidatePath("/dashboard");
  revalidatePath("/profile");
  return updated ? { errors: {}, ok: true, message: "Profile saved." } : { errors: {}, message: "Could not save." };
}

export async function saveServicesAction(_: ActionState, form: FormData): Promise<ActionState> {
  const provider = await currentProvider();
  if (!provider) redirect("/login");

  const selected = readSelectedServices(form);
  if (selected.length === 0) return { errors: { service: "Keep at least one service." }, message: "Choose at least one service." };

  const catalogue = await loadCatalogue();
  await updateProvider(provider.id, (p) => {
    p.services = applySelection(selected, catalogue, p.services);
  });
  revalidatePath("/dashboard");
  return { errors: {}, ok: true, message: "Services updated. Fill in the details for any new service below." };
}

export async function saveServiceDetailsAction(_: ActionState, form: FormData): Promise<ActionState> {
  const provider = await currentProvider();
  if (!provider) redirect("/login");

  const key = String(form.get("key") ?? "");
  const current = provider.services.find((s) => s.key === key);
  if (!current) return { errors: {}, message: "This service is no longer on your account." };

  const catalogue = await loadCatalogue();
  const service = catalogue
    .find((c) => c.slug === current.categorySlug)
    ?.services.find((s) => s.code === current.serviceCode);
  if (!service) return { errors: {}, message: "This service is no longer in the catalogue." };

  const { value, errors } = readServiceDetails(form, current, service);
  // Save even when incomplete, so work is not lost; the service stays marked as not completed.
  await updateProvider(provider.id, (p) => {
    const index = p.services.findIndex((s) => s.key === key);
    if (index >= 0) p.services[index] = value;
  });
  revalidatePath("/dashboard");
  if (Object.keys(errors).length > 0) {
    return { errors, values: echo(form), message: "Saved as a draft. Fix the highlighted fields to complete this service." };
  }
  return { errors: {}, ok: true, message: "Service details saved." };
}

/** Changes the vendor's password. Every other browser is signed out; this one stays signed in. */
export async function changePasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const provider = await currentProvider();
  if (!provider) redirect("/login");

  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  if (next.length < PASSWORD_MIN) errors.next = `Use at least ${PASSWORD_MIN} characters.`;
  else if (next.length > 128) errors.next = "Use at most 128 characters.";
  else if (next === current) errors.next = "Choose a password different from the current one.";
  if (next !== String(form.get("confirm") ?? "")) errors.confirm = "The two passwords do not match.";
  if (Object.keys(errors).length > 0) return { errors, message: "Please fix the highlighted fields." };

  if (!(await changeOwnPassword(provider.id, current, next))) {
    return { errors: { current: "That is not your current password." }, message: "Please fix the highlighted field." };
  }
  await signIn(provider.id); // the change ended every session, including this one
  return { errors: {}, ok: true, message: "Password changed. Other browsers have been signed out." };
}

export async function signOutEverywhereAction(): Promise<void> {
  const provider = await currentProvider();
  if (provider) await endAllSessions(provider.id);
  await signOut();
  redirect("/login");
}

/** Deletes the vendor's own account after the password is confirmed. */
export async function deleteAccountAction(_: ActionState, form: FormData): Promise<ActionState> {
  const provider = await currentProvider();
  if (!provider) redirect("/login");
  if (form.get("confirm") !== "on") return { errors: { confirm: "Tick the box to confirm." }, message: "Please confirm." };
  if (!(await authenticate(provider.email, String(form.get("password") ?? "")))) {
    return { errors: { password: "That password is not correct." }, message: "Please fix the highlighted field." };
  }
  await deleteOwnAccount(provider.id);
  await signOut();
  redirect("/");
}
