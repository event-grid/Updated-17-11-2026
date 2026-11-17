"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import type { CatalogueCategory } from "@/lib/catalogue";
import { PASSWORD_MIN } from "@/lib/forms";

import { ProfileFields } from "./ProfileFields";
import { ServicePicker } from "./ServicePicker";
import { Field, FormMessage, inputClass, primaryButton } from "./ui";

export function RegisterForm({ catalogue }: { catalogue: CatalogueCategory[] }) {
  const [state, action, pending] = useActionState(registerAction, initialState);
  const { errors, values = {} } = state;
  // Form values come back from the server as one flat record; services come back as repeated keys, so keep them here.
  const selected = (values.__services ?? "").split(",").filter(Boolean);

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormMessage message={state.message} ok={state.ok} />

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl text-ink">1. About you</h2>
        <ProfileFields values={values} errors={errors} />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl text-ink">2. Your services</h2>
        <ServicePicker catalogue={catalogue} selected={selected} error={errors.service} />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="font-display text-2xl text-ink">3. Create your password</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Password" name="password" error={errors.password} hint={`At least ${PASSWORD_MIN} characters.`}>
            <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} />
          </Field>
          <Field label="Confirm password" name="confirmPassword" error={errors.confirmPassword}>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-ink">
          <input type="checkbox" name="terms" className="mt-0.5 accent-terracotta" />
          <span>I agree to the EVENTGRID terms for vendors.</span>
        </label>
        {errors.terms && (
          <p role="alert" className="-mt-3 text-sm text-terracotta-600">
            {errors.terms}
          </p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Creating account…" : "Create account"}
        </button>
        <p className="text-sm text-ink-soft">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} className={inputClass} />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} />
      </Field>
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-sm text-ink-soft">
        New to EVENTGRID?{" "}
        <Link href="/register" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
          Register as a vendor
        </Link>
      </p>
    </form>
  );
}
