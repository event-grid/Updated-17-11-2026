import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { adminLogoutAction } from "@/app/actions";
import { ChangePasswordForm } from "@/components/AdminAccountForms";
import { Pill } from "@/components/ui";
import { passwordWasChanged } from "@/lib/admin-account";
import { isAdmin } from "@/lib/admin-session";
import { attempt, customersApi } from "@/lib/backend";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Settings</h1>
        <p className="text-ink-soft">Your own account and the state of the system. Website content is under Website.</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  if (!(await isAdmin())) redirect("/login");
  const [backend, changed] = await Promise.all([attempt(() => customersApi().getCustomerSummary()), passwordWasChanged()]);

  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section aria-labelledby="password-heading" className="flex flex-col gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="password-heading" className="font-display text-2xl">
            Password
          </h2>
          <Pill tone={changed ? "good" : "warn"}>{changed ? "Changed in the portal" : "Still the one from .env"}</Pill>
        </div>
        {!changed && (
          <p className="text-sm text-ink-soft">
            You are using the password from the project&apos;s .env file. Choose your own below: it replaces the .env password,
            and every other browser is signed out.
          </p>
        )}
        <ChangePasswordForm />
      </section>

      <section aria-labelledby="status-heading" className="flex flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="status-heading" className="font-display text-2xl">
          System status
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-[14rem_1fr]">
          <dt className="text-ink-soft">Backend and admin token</dt>
          <dd>{backend.ok ? <Pill tone="good">Connected</Pill> : <Pill tone="bad">Not connected</Pill>}</dd>
          {!backend.ok && (
            <>
              <dt className="text-ink-soft">Details</dt>
              <dd className="text-terracotta-600">{backend.message}</dd>
            </>
          )}
          <dt className="text-ink-soft">Where vendors and website settings are kept</dt>
          <dd>A shared development folder (prototype), not the backend yet</dd>
        </dl>
      </section>

      <section aria-labelledby="session-heading" className="flex flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="session-heading" className="font-display text-2xl">
          Session
        </h2>
        <p className="text-sm text-ink-soft">You stay signed in on this browser for up to 8 hours.</p>
        <div className="flex flex-wrap gap-3">
          <form action={adminLogoutAction}>
            <button type="submit" className="rounded-md px-5 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
              Sign out
            </button>
          </form>
          <Link href="/site" className="rounded-md px-5 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Website settings
          </Link>
          <Link href="/commission" className="rounded-md px-5 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Commission
          </Link>
        </div>
      </section>
    </div>
  );
}
