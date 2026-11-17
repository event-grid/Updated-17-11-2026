import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CommissionNotice } from "@/components/CommissionNotice";
import { ChangePasswordForm, DeleteAccountForm, SignOutEverywhere } from "@/components/SettingsForms";
import { loadCommissionPercent } from "@/lib/commission";
import { currentProvider } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default function VendorSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Settings</h1>
        <p className="text-ink-soft">Your sign-in, security and account.</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  const provider = await currentProvider();
  if (!provider) redirect("/login");
  const percent = await loadCommissionPercent();

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section aria-labelledby="account-heading" className="flex flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="account-heading" className="font-display text-2xl">
          Account
        </h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-ink-soft">Sign-in email</dt>
          <dd>{provider.email}</dd>
          <dt className="text-ink-soft">Mobile number</dt>
          <dd>{provider.phone}</dd>
        </dl>
        <p className="text-xs text-ink-soft">Change your name, number, city and description on the Profile page.</p>
      </section>

      <CommissionNotice percent={percent} />

      <section aria-labelledby="password-heading" className="flex flex-col gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="password-heading" className="font-display text-2xl">
          Password
        </h2>
        <ChangePasswordForm />
      </section>

      <section aria-labelledby="sessions-heading" className="flex flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="sessions-heading" className="font-display text-2xl">
          Sessions
        </h2>
        <p className="text-sm text-ink-soft">Signed in on a shared or lost device? Sign out everywhere, then sign in again here.</p>
        <div>
          <SignOutEverywhere />
        </div>
      </section>

      <section aria-labelledby="danger-heading" className="flex flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-terracotta/30">
        <h2 id="danger-heading" className="font-display text-2xl">
          Delete account
        </h2>
        <p className="text-sm text-ink-soft">
          Removes your account, services and sign-in from EVENTGRID. Customers will no longer see you. This cannot be undone.
        </p>
        <DeleteAccountForm />
      </section>
    </div>
  );
}
