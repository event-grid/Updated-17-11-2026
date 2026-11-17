"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ActionState } from "@/lib/action-state";
import { changePassword, saveDisplayName } from "@/lib/admin-account";
import { adminSignIn, adminSignOut, isAdmin, startAdminSession } from "@/lib/admin-session";
import { applySelection, loadCatalogue } from "@/lib/catalogue";
import { PASSWORD_MIN, readPassword, readProfile, readSelectedServices } from "@/lib/forms";
import { attempt, commissionApi, customersApi } from "@/lib/backend";
import { SECTION_KEYS, cleanUrl, readSettings, writeSettings } from "@/lib/settings";
import { createProvider, deleteProvider, setProviderPassword, updateProvider, type ApprovalStatus } from "@/lib/store";

function echo(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !/password/i.test(key)) values[key] = value;
  }
  values.__services = form.getAll("service").join(",");
  return values;
}

export async function adminLoginAction(_: ActionState, form: FormData): Promise<ActionState> {
  const ok = await adminSignIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!ok) return { errors: {}, message: "The email or password is not correct.", values: { email: String(form.get("email") ?? "") } };
  redirect("/");
}

export async function adminLogoutAction(): Promise<void> {
  await adminSignOut();
  redirect("/login");
}

/** The administrator creates a provider account. It is approved at once; the provider fills in service details. */
export async function createProviderAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");

  const { value: profile, errors } = readProfile(form);
  const password = readPassword(form, "password");
  if (password.error) errors.password = password.error;
  const selected = readSelectedServices(form);
  if (selected.length === 0) errors.service = "Choose at least one service for this provider.";
  if (Object.keys(errors).length > 0) return { errors, values: echo(form), message: "Please fix the highlighted fields." };

  const services = applySelection(selected, await loadCatalogue());
  const provider = await createProvider({
    ...profile,
    password: password.value,
    createdBy: "ADMIN",
    status: form.get("approved") === "on" ? "APPROVED" : "PENDING",
    services,
  });
  if (!provider) return { errors: { email: "A vendor with this email already exists." }, values: echo(form) };

  revalidatePath("/");
  revalidatePath("/vendors");
  redirect(`/vendors/${provider.id}`);
}

export async function setStatusAction(id: string, status: ApprovalStatus): Promise<void> {
  if (!(await isAdmin())) redirect("/login");
  if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) return;
  await updateProvider(id, (p) => {
    p.status = status;
  });
  revalidatePath("/");
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
}

/** The administrator edits a provider's profile. The sign-in email stays as it is. */
export async function updateProviderAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const { value, errors } = readProfile(form);
  if (Object.keys(errors).length > 0) return { errors, values: echo(form), message: "Please fix the highlighted fields." };
  const updated = await updateProvider(id, (p) => {
    p.name = value.name;
    p.type = value.type;
    p.phone = value.phone;
    p.city = value.city;
    p.area = value.area;
    p.about = value.about;
  });
  if (!updated) return { errors: {}, message: "This vendor no longer exists." };
  revalidatePath("/");
  revalidatePath("/vendors");
  revalidatePath(`/vendors/${id}`);
  return { errors: {}, ok: true, message: "Vendor saved." };
}

/** Sets a new temporary password for a provider and signs them out everywhere. */
export async function resetProviderPasswordAction(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const password = readPassword(form, "password");
  if (password.error) return { errors: { password: password.error }, message: "Please fix the highlighted fields." };
  const ok = await setProviderPassword(id, password.value);
  return ok
    ? { errors: {}, ok: true, message: "Password changed. The vendor is signed out and must use the new password." }
    : { errors: {}, message: "This vendor no longer exists." };
}

export async function deleteProviderAction(id: string): Promise<void> {
  if (!(await isAdmin())) redirect("/login");
  await deleteProvider(id);
  revalidatePath("/");
  revalidatePath("/vendors");
  redirect("/vendors");
}

/** Suspends or reactivates a customer in the backend. Returns an error message, or null on success. */
export async function setCustomerStatusAction(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<string | null> {
  if (!(await isAdmin())) redirect("/login");
  const result = await attempt(() => customersApi().setCustomerStatus({ id, adminCustomerStatusChange: { status } }));
  revalidatePath("/customers");
  revalidatePath("/");
  return result.ok ? null : result.message;
}

/** Saves the website-wide settings the customer site reads. */
export async function saveSettingsAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const errors: Record<string, string> = {};

  const announcementText = text("announcementText");
  if (announcementText.length > 160) errors.announcementText = "Keep the announcement under 160 characters.";

  const social = {
    instagram: cleanUrl(text("instagram")),
    facebook: cleanUrl(text("facebook")),
    youtube: cleanUrl(text("youtube")),
    x: cleanUrl(text("x")),
  };
  for (const key of Object.keys(social) as (keyof typeof social)[]) {
    if (text(key) && !social[key]) errors[key] = "Enter a web address such as https://instagram.com/yourname.";
  }

  const email = text("email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  const phone = text("phone");
  if (phone && !/^[0-9]{10}$/.test(phone)) errors.phone = "Enter exactly 10 digits, numbers only (or leave it empty).";
  const address = text("address");
  if (address.length > 300) errors.address = "Keep the address under 300 characters.";

  const values = { announcementText, announcementEnabled: form.get("announcementEnabled") === "on" ? "on" : "", ...Object.fromEntries(SECTION_KEYS.map((key) => [`section-${key}`, form.get(`section-${key}`) === "on" ? "on" : ""])), ...Object.fromEntries(["instagram", "facebook", "youtube", "x", "email", "phone", "address"].map((k) => [k, text(k)])) };
  if (Object.keys(errors).length > 0) return { errors, values, message: "Please fix the highlighted fields." };

  const current = await readSettings();
  await writeSettings({
    ...current,
    announcement: { enabled: form.get("announcementEnabled") === "on", text: announcementText },
    social,
    contact: { email, phone, address },
    sections: Object.fromEntries(SECTION_KEYS.map((key) => [key, form.get(`section-${key}`) === "on"])) as typeof current.sections,
  });
  revalidatePath("/site");
  return { errors: {}, ok: true, message: "Website settings saved. The website shows them within a second." };
}

/** Sets the commission the platform keeps from each booked package. Applies to bookings made from now on. */
export async function setCommissionAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const raw = String(form.get("ratePercent") ?? "").trim();
  const percent = Number(raw);
  const errors: Record<string, string> = {};
  if (!raw || !Number.isFinite(percent)) errors.ratePercent = "Enter a percentage, for example 5 or 7.5.";
  else if (percent < 0 || percent > 30) errors.ratePercent = "The commission must be between 0% and 30%.";
  else if (!/^\d+(\.\d{1,2})?$/.test(raw)) errors.ratePercent = "Use at most 2 decimals, for example 7.25.";
  if (Object.keys(errors).length > 0) return { errors, values: { ratePercent: raw }, message: "Please fix the highlighted field." };

  const result = await attempt(() => commissionApi().setCommission({ commissionRateChange: { ratePercent: percent } }));
  revalidatePath("/commission");
  revalidatePath("/");
  if (!result.ok) return { errors: {}, values: { ratePercent: raw }, message: result.message };
  return {
    errors: {},
    ok: true,
    values: { ratePercent: String(result.data.ratePercent) },
    message: `Commission is now ${result.data.ratePercent}%. It applies to bookings made from now on.`,
  };
}

/** Saves the administrator's display name. */
export async function saveAdminProfileAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const name = String(form.get("displayName") ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    return { errors: { displayName: "Enter your name (2 to 60 characters)." }, values: { displayName: name }, message: "Please fix the highlighted field." };
  }
  await saveDisplayName(name);
  revalidatePath("/", "layout");
  return { errors: {}, ok: true, values: { displayName: name }, message: "Profile saved." };
}

/** Changes the administrator's password. Other browsers are signed out; this one stays signed in. */
export async function changeAdminPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!(await isAdmin())) redirect("/login");
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const errors: Record<string, string> = {};
  if (!current) errors.current = "Enter your current password.";
  if (next.length < PASSWORD_MIN) errors.next = `Use at least ${PASSWORD_MIN} characters.`;
  else if (next.length > 128) errors.next = "Use at most 128 characters.";
  else if (next === current) errors.next = "Choose a password different from the current one.";
  if (next !== String(form.get("confirm") ?? "")) errors.confirm = "The two passwords do not match.";
  if (Object.keys(errors).length > 0) return { errors, message: "Please fix the highlighted fields." };

  if (!(await changePassword(current, next))) return { errors: { current: "That is not your current password." }, message: "Please fix the highlighted field." };
  await startAdminSession(); // the secret changed, so renew this browser's session
  revalidatePath("/settings");
  return { errors: {}, ok: true, message: "Password changed. Other browsers have been signed out." };
}
