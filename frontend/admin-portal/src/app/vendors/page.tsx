import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LiveSync } from "@/components/LiveSync";
import { StatusButtons } from "@/components/StatusButtons";
import { StatusBadge, inputClass } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { listProviders } from "@/lib/store";

export const metadata: Metadata = { title: "Vendors" };

export default function ProvidersPage(props: PageProps<"/vendors">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Providers searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Providers({ searchParams }: Pick<PageProps<"/vendors">, "searchParams">) {
  if (!(await isAdmin())) redirect("/login");
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const q = one(params.q).trim().toLowerCase();
  const status = one(params.status);

  const all = await listProviders();
  const providers = all.filter(
    (p) =>
      (!status || p.status === status) &&
      (!q || [p.name, p.email, p.city, p.phone, ...p.services.map((s) => s.serviceName)].some((v) => v.toLowerCase().includes(q))),
  );
  const pending = all.filter((p) => p.status === "PENDING").length;

  return (
    <div className="flex flex-col gap-8">
      <LiveSync />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl tracking-tight">Vendors</h1>
          <p className="text-ink-soft">
            {all.length} total · {pending} waiting for approval
          </p>
        </div>
        <Link href="/vendors/new" className="rounded-md bg-terracotta px-5 py-3 font-semibold text-white hover:bg-terracotta-600">
          Add vendor
        </Link>
      </div>

      <form action="/vendors" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="block text-sm font-semibold text-ink">
            Search
          </label>
          <input id="q" name="q" defaultValue={one(params.q)} placeholder="Name, email, city or service" className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-ink">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className={inputClass}>
            <option value="">All</option>
            <option value="PENDING">Waiting for approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Not approved</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-plum px-5 py-2.5 text-sm font-semibold text-champagne-200 hover:bg-plum-700">
          Apply
        </button>
        {(q || status) && (
          <Link href="/vendors" className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Clear
          </Link>
        )}
      </form>

      {providers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">
          {all.length === 0 ? "No vendors yet. Add one here, or let vendors register at the partner portal." : "No vendors match."}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {providers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
              <div className="flex min-w-0 flex-col gap-1">
                <Link href={`/vendors/${p.id}`} className="font-display text-xl text-ink underline-offset-4 hover:underline">
                  {p.name}
                </Link>
                <p className="text-sm text-ink-soft">
                  {p.city} · {p.email} · {p.services.length} {p.services.length === 1 ? "service" : "services"} (
                  {p.services.filter((s) => s.completed).length} completed) · {p.createdBy === "ADMIN" ? "created by admin" : "self-registered"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={p.status} />
                <StatusButtons id={p.id} current={p.status} only={["APPROVED", "REJECTED"]} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
