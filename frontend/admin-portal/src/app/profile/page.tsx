import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminProfileForm } from "@/components/AdminAccountForms";
import { adminEmail, displayName } from "@/lib/admin-account";
import { isAdmin } from "@/lib/admin-session";

export const metadata: Metadata = { title: "Profile" };

export default function AdminProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Your profile</h1>
        <p className="text-ink-soft">Who you are in the administration of EVENTGRID.</p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-72 animate-pulse rounded-xl bg-sand" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  if (!(await isAdmin())) redirect("/login");
  const name = await displayName();
  const email = adminEmail();

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <aside className="flex h-fit flex-col items-center gap-3 rounded-xl bg-plum p-8 text-center text-champagne-200">
        <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-champagne font-display text-4xl text-plum">
          {name.charAt(0).toUpperCase()}
        </span>
        <p className="font-display text-2xl text-champagne">{name}</p>
        <p className="break-all text-sm">{email}</p>
        <span className="rounded-full bg-champagne/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-champagne">Administrator</span>
        <p className="mt-2 text-xs text-champagne/70">Full access: vendors, customers, bookings, commission and the website.</p>
      </aside>
      <div className="flex flex-col gap-8">
        <section className="rounded-xl bg-white p-6 ring-1 ring-line">
          <h2 className="mb-5 font-display text-2xl">Details</h2>
          <AdminProfileForm displayName={name} email={email} />
        </section>
        <p className="text-sm text-ink-soft">
          To change your password, open{" "}
          <Link href="/settings" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
