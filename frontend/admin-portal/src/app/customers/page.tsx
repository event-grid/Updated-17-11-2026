import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CustomerStatusButton } from "@/components/ManageForms";
import { Pager } from "@/components/Pager";
import { Notice, Pill, inputClass } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { attempt, customersApi } from "@/lib/backend";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Customers" };

const SIZE = 20;

export default function CustomersPage(props: PageProps<"/customers">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Customers searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: Pick<PageProps<"/customers">, "searchParams">) {
  if (!(await isAdmin())) redirect("/login");
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const q = one(params.q).trim();
  const status = one(params.status);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const result = await attempt(() => customersApi().listCustomers({ q: q || undefined, status: status || undefined, page, size: SIZE }));
  const href = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (p > 1) next.set("page", String(p));
    const query = next.toString();
    return query ? `/customers?${query}` : "/customers";
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Customers</h1>
        <p className="text-ink-soft">People who signed in on the website. A suspended customer cannot sign in.</p>
      </div>

      <form action="/customers" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="block text-sm font-semibold text-ink">
            Search
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, email or mobile number" className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-ink">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className={inputClass}>
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-plum px-5 py-2.5 text-sm font-semibold text-champagne-200 hover:bg-plum-700">
          Apply
        </button>
        {(q || status) && (
          <Link href="/customers" className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Clear
          </Link>
        )}
      </form>

      {!result.ok ? (
        <Notice tone="bad">{result.message}</Notice>
      ) : result.data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">No customers match.</p>
      ) : (
        <>
          <p className="text-sm text-ink-soft" aria-live="polite">
            {result.data.total} {result.data.total === 1 ? "customer" : "customers"}
          </p>
          <ul className="flex flex-col gap-3">
            {result.data.items.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="font-display text-xl text-ink">{c.displayName || c.phone || c.email}</p>
                  <p className="text-sm text-ink-soft">
                    {[c.phone, c.email].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Joined {formatDateTime(c.createdAt)} · Last sign-in {formatDateTime(c.lastSignInAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={c.status === "ACTIVE" ? "good" : "bad"}>{c.status === "ACTIVE" ? "Active" : "Suspended"}</Pill>
                  <CustomerStatusButton id={c.id} status={c.status} />
                </div>
              </li>
            ))}
          </ul>
          <Pager page={result.data.page} size={result.data.size} total={result.data.total} href={href} />
        </>
      )}
    </div>
  );
}
