import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LiveSync } from "@/components/LiveSync";
import { CommissionNotice } from "@/components/CommissionNotice";
import { ServiceDetailsForm, ServicesForm } from "@/components/DashboardForms";
import { StatusBadge } from "@/components/ui";
import { loadCatalogue } from "@/lib/catalogue";
import { loadCommissionPercent } from "@/lib/commission";
import { currentProvider } from "@/lib/session";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const provider = await currentProvider();
  if (!provider) redirect("/login");
  const [catalogue, commissionPercent] = await Promise.all([loadCatalogue(), loadCommissionPercent()]);

  const done = provider.services.filter((s) => s.completed).length;
  const lookup = (categorySlug: string, serviceCode: string) =>
    catalogue.find((c) => c.slug === categorySlug)?.services.find((s) => s.code === serviceCode);

  return (
    <div className="flex flex-col gap-12">
      <LiveSync />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl tracking-tight">{provider.name}</h1>
          <StatusBadge status={provider.status} />
        </div>
        <p className="text-ink-soft">
          You are approved. Customers see each service on EVENTGRID once you have completed its details.
        </p>
        <p className="text-sm text-ink-soft">
          {done} of {provider.services.length} services completed
        </p>
      </header>

      <CommissionNotice percent={commissionPercent} />

      <section aria-labelledby="services-heading" className="flex flex-col gap-6">
        <h2 id="services-heading" className="font-display text-3xl">
          Your services
        </h2>
        {provider.services.map((details) => {
          const service = lookup(details.categorySlug, details.serviceCode);
          if (!service) return null;
          return (
            <details key={details.key} open className="rounded-xl bg-white ring-1 ring-line">
              <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-5 py-4">
                <span className="flex flex-col">
                  <span className="font-display text-xl">{details.serviceName}</span>
                  <span className="text-xs text-ink-soft">{details.categoryName}</span>
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${details.completed ? "bg-[#e3efe6] text-[#1f5a35]" : "bg-champagne-200 text-gold"}`}>
                  {details.completed ? "Completed" : "Details needed"}
                </span>
              </summary>
              <div className="border-t border-line px-5 py-6">
                <ServiceDetailsForm details={details} service={service} commissionPercent={commissionPercent} />
              </div>
            </details>
          );
        })}
      </section>

      <section aria-labelledby="change-services-heading" className="flex flex-col gap-5">
        <h2 id="change-services-heading" className="font-display text-3xl">
          Add or remove services
        </h2>
        <ServicesForm catalogue={catalogue} selected={provider.services.map((s) => s.key)} />
      </section>
    </div>
  );
}
