"use client";

import { useActionState, useState, useTransition } from "react";

import {
  deleteProviderAction,
  resetProviderPasswordAction,
  saveSettingsAction,
  setCustomerStatusAction,
  updateProviderAction,
} from "@/app/actions";
import { initialState } from "@/lib/action-state";
import { PASSWORD_MIN } from "@/lib/forms";
import { SECTION_KEYS, SECTION_LABELS } from "@/lib/sections";
import type { SiteSettings } from "@/lib/settings";

import { ProfileFields } from "./ProfileFields";
import { Field, FormMessage, inputClass, primaryButton, secondaryButton } from "./ui";

type Profile = Record<string, string | undefined>;

export function EditProviderForm({ id, profile }: { id: string; profile: Profile }) {
  const [state, action, pending] = useActionState(updateProviderAction.bind(null, id), initialState);
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <ProfileFields values={state.values ?? profile} errors={state.errors} emailLocked />
      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save vendor"}
        </button>
      </div>
    </form>
  );
}

export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetProviderPasswordAction.bind(null, id), initialState);
  return (
    <form action={action} className="flex max-w-md flex-col gap-4" noValidate>
      <FormMessage message={state.message} ok={state.ok} />
      <Field label="New temporary password" name="password" error={state.errors.password} hint={`At least ${PASSWORD_MIN} characters. The vendor is signed out everywhere.`}>
        <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={secondaryButton}>
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

export function DeleteProviderButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (window.confirm(`Delete ${name}? Their account, services and sign-in are removed. This cannot be undone.`)) {
          start(async () => {
            await deleteProviderAction(id);
          });
        }
      }}
      className="rounded-md px-5 py-3 font-semibold text-terracotta-600 ring-1 ring-terracotta/40 transition-colors hover:bg-[#f8e3dd] disabled:opacity-60"
    >
      {pending ? "Deleting…" : "Delete vendor"}
    </button>
  );
}

/** Suspend or reactivate a customer. Runs in the background and shows what went wrong, if anything. */
export function CustomerStatusButton({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suspended = status === "SUSPENDED";
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!suspended && !window.confirm("Suspend this customer? They are signed out and cannot sign in until reactivated.")) return;
          setError(null);
          start(async () => setError(await setCustomerStatusAction(id, suspended ? "ACTIVE" : "SUSPENDED")));
        }}
        className={`min-h-11 rounded-md px-4 py-1.5 text-sm font-semibold ring-1 transition-colors disabled:opacity-60 sm:min-h-0 sm:px-3 ${
          suspended ? "text-ink ring-line hover:text-terracotta" : "text-terracotta-600 ring-terracotta/40 hover:bg-[#f8e3dd]"
        }`}
      >
        {pending ? "Saving…" : suspended ? "Reactivate" : "Suspend"}
      </button>
      {error && (
        <span role="alert" className="max-w-xs text-right text-xs text-terracotta-600">
          {error}
        </span>
      )}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, initialState);
  const v = state.values;
  const text = (name: string, fallback: string) => v?.[name] ?? fallback;
  const enabled = v ? v.announcementEnabled === "on" : settings.announcement.enabled;
  const { errors } = state;

  return (
    <form action={action} className="flex flex-col gap-10" noValidate>
      <FormMessage message={state.message} ok={state.ok} />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">Website pages</h2>
        <p className="text-sm text-ink-soft">
          Switch a page off to remove it from the menu and footer; visitors who open its address see “page not found”.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SECTION_KEYS.map((key) => (
            <li key={key}>
              <label className="flex items-center gap-3 rounded-lg bg-sand/60 px-4 py-3 text-sm text-ink">
                <input
                  type="checkbox"
                  name={`section-${key}`}
                  defaultChecked={v ? v[`section-${key}`] === "on" : settings.sections[key]}
                  className="accent-terracotta"
                />
                {SECTION_LABELS[key]}
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">Announcement bar</h2>
        <p className="text-sm text-ink-soft">The dark strip at the very top of every page of the website.</p>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="announcementEnabled" defaultChecked={enabled} className="accent-terracotta" />
          Show the announcement bar
        </label>
        <Field label="Text" name="announcementText" error={errors.announcementText}>
          <input id="announcementText" name="announcementText" defaultValue={text("announcementText", settings.announcement.text)} className={inputClass} />
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">Social profiles</h2>
        <p className="text-sm text-ink-soft">Shown in the website footer. Leave a field empty to show the button without a link.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          {(
            [
              ["instagram", "Instagram"],
              ["facebook", "Facebook"],
              ["youtube", "YouTube"],
              ["x", "X"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label} name={key} error={errors[key]}>
              <input id={key} name={key} inputMode="url" placeholder="https://" defaultValue={text(key, settings.social[key])} className={inputClass} />
            </Field>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">Contact details</h2>
        <p className="text-sm text-ink-soft">Shown on the Contact page once any of them is filled in.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" name="email" error={errors.email}>
            <input id="email" name="email" type="email" defaultValue={text("email", settings.contact.email)} className={inputClass} />
          </Field>
          <Field label="Phone" name="phone" error={errors.phone}>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              pattern="[0-9]{10}"
              title="Exactly 10 digits, numbers only"
              defaultValue={text("phone", settings.contact.phone)}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
              }}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" name="address" error={errors.address}>
              <textarea id="address" name="address" rows={3} defaultValue={text("address", settings.contact.address)} className={inputClass} />
            </Field>
          </div>
        </div>
      </section>

      <div>
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
