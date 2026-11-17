"use client";

import { useActionState } from "react";

import { changeAdminPasswordAction, saveAdminProfileAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import { PASSWORD_MIN } from "@/lib/forms";

import { Field, FormMessage, inputClass, primaryButton } from "./ui";

export function AdminProfileForm({ displayName, email }: { displayName: string; email: string }) {
  const [state, action, pending] = useActionState(saveAdminProfileAction, initialState);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Your name" name="displayName" error={state.errors.displayName}>
        <input id="displayName" name="displayName" autoComplete="name" defaultValue={state.values?.displayName ?? displayName} className={inputClass} />
      </Field>
      <Field label="Sign-in email" name="email" hint="This is your login. It is set in the project's .env file (ADMIN_PORTAL_EMAIL).">
        <input id="email" value={email} readOnly className={`${inputClass} bg-sand`} />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPasswordAction, initialState);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Current password" name="current" error={state.errors.current}>
        <input id="current" name="current" type="password" autoComplete="current-password" className={inputClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="New password" name="next" error={state.errors.next} hint={`At least ${PASSWORD_MIN} characters.`}>
          <input id="next" name="next" type="password" autoComplete="new-password" className={inputClass} />
        </Field>
        <Field label="Confirm new password" name="confirm" error={state.errors.confirm}>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputClass} />
        </Field>
      </div>
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
