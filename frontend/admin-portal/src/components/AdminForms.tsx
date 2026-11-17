"use client";

import { useActionState } from "react";

import { adminLoginAction, createProviderAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import type { CatalogueCategory } from "@/lib/catalogue";
import { PASSWORD_MIN } from "@/lib/forms";

import { ProfileFields } from "./ProfileFields";
import { ServicePicker } from "./ServicePicker";
import { Field, FormMessage, inputClass, primaryButton } from "./ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.values?.email} className={inputClass} />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function CreateProviderForm({ catalogue }: { catalogue: CatalogueCategory[] }) {
  const [state, action, pending] = useActionState(createProviderAction, initialState);
  const { errors, values = {} } = state;
  const selected = (values.__services ?? "").split(",").filter(Boolean);

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl">1. Vendor details</h2>
        <ProfileFields values={values} errors={errors} />
      </section>
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl">2. Services</h2>
        <ServicePicker catalogue={catalogue} selected={selected} error={errors.service} />
      </section>
      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl">3. Temporary password</h2>
        <Field label="Temporary password" name="password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters. Give it to the vendor; they sign in at the partner portal and fill in their service details.`}>
          <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="approved" defaultChecked className="accent-terracotta" />
          Approve this vendor now
        </label>
      </section>
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Creating…" : "Create vendor"}
        </button>
      </div>
    </form>
  );
}
