import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ProfileForm } from "@/components/DashboardForms";
import { StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { currentProvider } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default function VendorProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Your profile</h1>
        <p className="text-ink-soft">How you appear to customers and to EVENTGRID.</p>
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
  const completed = provider.services.filter((s) => s.completed).length;

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      <aside className="flex h-fit flex-col items-center gap-3 rounded-xl bg-plum p-8 text-center text-champagne-200">
        <span aria-hidden="true" className="flex size-20 items-center justify-center rounded-full bg-champagne font-display text-4xl text-plum">
          {provider.name.charAt(0).toUpperCase()}
        </span>
        <p className="font-display text-2xl text-champagne">{provider.name}</p>
        <p className="text-sm">{provider.type === "COMPANY" ? "Event management company or business" : "Individual vendor"}</p>
        <StatusBadge status={provider.status} />
        <dl className="mt-3 grid w-full gap-2 border-t border-champagne/15 pt-4 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-champagne/70">Member since</dt>
            <dd>{formatDate(provider.createdAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-champagne/70">Services</dt>
            <dd>
              {completed} of {provider.services.length} completed
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-champagne/70">Public page</dt>
            <dd>{provider.status === "APPROVED" ? "Visible" : "Hidden"}</dd>
          </div>
        </dl>
      </aside>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl bg-white p-6 ring-1 ring-line">
          <h2 className="mb-5 font-display text-2xl">Details</h2>
          <ProfileForm
            profile={{
              name: provider.name,
              type: provider.type,
              email: provider.email,
              phone: provider.phone,
              city: provider.city,
              area: provider.area,
              about: provider.about,
            }}
          />
        </section>
        <p className="text-sm text-ink-soft">
          Your services and prices are on the{" "}
          <Link href="/dashboard" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            dashboard
          </Link>
          . To change your password, open{" "}
          <Link href="/settings" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
            Settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
