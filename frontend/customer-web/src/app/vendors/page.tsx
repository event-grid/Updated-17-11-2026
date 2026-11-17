import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { SectionGuard } from "@/components/layout/SectionGuard";
import { Eyebrow } from "@/components/layout/SectionHeading";
import { CARD_LIST_CLASS } from "@/components/ui/view-classes";
import { ViewSwitcher } from "@/components/ui/ViewSwitcher";
import { partnerLinks } from "@/config/partner";
import { getCategories } from "@/features/categories/api";
import { DummyVendorCard } from "@/features/demo/components/DummyVendorCard";
import { allDummyVendors } from "@/features/demo/vendors";
import { EmptyState, Field, Pagination, fieldClass } from "@/features/marketplace/components/Bits";
import { PortalProviderCard } from "@/features/providers/components/PortalProviderCard";
import { listApprovedProviders, toPublic } from "@/lib/provider-store";

export const metadata: Metadata = {
  title: "Vendors",
  description: "Photographers, caterers, decorators and event companies on EVENTGRID.",
};

const PAGE_SIZE = 24;

export default function ProvidersPage(props: PageProps<"/vendors">) {
  return (
    <>
      <Suspense fallback={null}>
        <SectionGuard section="vendors" />
      </Suspense>
      <ProvidersPageContent {...props} />
    </>
  );
}

function ProvidersPageContent(props: PageProps<"/vendors">) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-14 sm:px-8">
      <div className="flex flex-col gap-4">
        <Eyebrow>Vendors</Eyebrow>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
          The people behind your <em className="text-terracotta">event.</em>
        </h1>
        <p className="max-w-2xl text-ink-soft">
          The photographers, caterers, decorators and event companies listed on every service. Registered vendors come
          first; the rest are demo vendors that show how the marketplace will look.
        </p>
        {partnerLinks && (
          <p className="text-sm text-ink-soft">
            Are you a vendor?{" "}
            <a href={partnerLinks.register} className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              Register as a vendor
            </a>
          </p>
        )}
      </div>
      <Suspense fallback={<div aria-hidden="true" className="skeleton h-96 rounded-xl" />}>
        <ProviderResults searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

async function ProviderResults({ searchParams }: Pick<PageProps<"/vendors">, "searchParams">) {
  await connection();
  const params = await searchParams;
  const q = one(params.q).trim().toLowerCase();
  const category = one(params.category);
  const city = one(params.city);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const [registered, vendors, categories] = await Promise.all([
    listApprovedProviders().then((list) => list.map(toPublic)),
    allDummyVendors(),
    getCategories(),
  ]);
  const cities = [...new Set([...vendors.map((v) => v.city), ...registered.map((p) => p.city)])].sort();

  // Filters apply to both kinds. A registered provider matches a category or text through the services it offers.
  const matchedRegistered = registered.filter(
    (p) =>
      (!city || p.city === city) &&
      (!category || p.services.some((s) => s.categorySlug === category)) &&
      (!q || [p.name, p.city, p.area, ...p.services.map((s) => s.serviceName)].some((v) => v.toLowerCase().includes(q))),
  );
  const matchedVendors = vendors.filter(
    (v) =>
      (!city || v.city === city) &&
      (!category || v.categorySlug === category) &&
      (!q || [v.name, v.city, v.area, v.serviceName, v.categoryName].some((x) => x.toLowerCase().includes(q))),
  );

  const items = [
    ...matchedRegistered.map((p) => ({ kind: "registered" as const, key: p.id, provider: p })),
    ...matchedVendors.map((v) => ({ kind: "demo" as const, key: v.slug, vendor: v })),
  ];
  const total = items.length;
  const shown = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (nextPage: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", one(params.q).trim());
    if (category) next.set("category", category);
    if (city) next.set("city", city);
    if (nextPage > 1) next.set("page", String(nextPage));
    const query = next.toString();
    return query ? `/vendors?${query}` : "/vendors";
  };
  const filtered = Boolean(q || category || city);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
      <form action="/vendors" className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-line lg:sticky lg:top-28 lg:self-start">
        <Field label="Search" htmlFor="p-q">
          <input id="p-q" name="q" defaultValue={one(params.q)} placeholder="Name, service or area" className={fieldClass} />
        </Field>
        <Field label="Occasion" htmlFor="p-category">
          <select id="p-category" name="category" defaultValue={category} className={fieldClass}>
            <option value="">Any occasion</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City" htmlFor="p-city">
          <select id="p-city" name="city" defaultValue={city} className={fieldClass}>
            <option value="">Any city</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 rounded-md bg-plum px-4 py-3 text-sm font-semibold text-champagne-200 transition-colors hover:bg-plum-700">
            Apply filters
          </button>
          {filtered && (
            <Link href="/vendors" className="rounded-md px-4 py-3 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-6">
        {total === 0 ? (
          <EmptyState title="No vendors match">
            Try another occasion or city, or{" "}
            <Link href="/vendors" className="font-medium text-ink underline decoration-terracotta underline-offset-4">
              clear all filters
            </Link>
            .
          </EmptyState>
        ) : (
          <>
            <ViewSwitcher
              summary={`${total} ${total === 1 ? "vendor" : "vendors"}${matchedRegistered.length > 0 ? ` · ${matchedRegistered.length} registered` : ""}`}
            >
              <ul className={CARD_LIST_CLASS}>
                {shown.map((item, i) => (
                  <li key={item.key} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
                    {item.kind === "registered" ? <PortalProviderCard provider={item.provider} /> : <DummyVendorCard vendor={item.vendor} />}
                  </li>
                ))}
              </ul>
            </ViewSwitcher>
            <Pagination page={page} size={PAGE_SIZE} total={total} href={href} />
          </>
        )}
      </div>
    </div>
  );
}
