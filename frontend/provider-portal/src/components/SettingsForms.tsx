"use client";

import { useActionState } from "react";

import { changePasswordAction, deleteAccountAction, signOutEverywhereAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import { PASSWORD_MIN } from "@/lib/forms";

import { Field, FormMessage, inputClass, primaryButton, secondaryButton } from "./ui";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
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

export function SignOutEverywhere() {
  return (
    <form action={signOutEverywhereAction}>
      <button type="submit" className={secondaryButton}>
        Sign out of all browsers
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, initialState);
  return (
    <form action={action} className="flex max-w-xl flex-col gap-4" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="Your password" name="delete-password" error={state.errors.password}>
        <input id="delete-password" name="password" type="password" autoComplete="current-password" className={inputClass} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name="confirm" className="mt-0.5 accent-terracotta" />
        <span>I understand this deletes my account, my services and my sign-in, and cannot be undone.</span>
      </label>
      {state.errors.confirm && (
        <p role="alert" className="-mt-2 text-sm text-terracotta-600">
          {state.errors.confirm}
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md px-5 py-3 font-semibold text-terracotta-600 ring-1 ring-terracotta/40 transition-colors hover:bg-[#f8e3dd] disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </form>
  );
}
