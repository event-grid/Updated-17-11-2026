import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Pager } from "@/components/Pager";
import { Notice, Pill, inputClass } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { attempt, bookingsApi } from "@/lib/backend";
import { BOOKING_STATUS } from "@/lib/booking-status";
import { formatDate, formatDateTime, formatRupees } from "@/lib/format";

export const metadata: Metadata = { title: "Bookings" };

const SIZE = 20;

export default function BookingsPage(props: PageProps<"/bookings">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Bookings searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Bookings({ searchParams }: Pick<PageProps<"/bookings">, "searchParams">) {
  if (!(await isAdmin())) redirect("/login");
  const params = await searchParams;
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const q = one(params.q).trim();
  const status = one(params.status);
  const page = Math.max(1, Number(one(params.page)) || 1);

  const result = await attempt(() => bookingsApi().listBookings({ q: q || undefined, status: status || undefined, page, size: SIZE }));
  const href = (p: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (status) next.set("status", status);
    if (p > 1) next.set("page", String(p));
    const query = next.toString();
    return query ? `/bookings?${query}` : "/bookings";
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Bookings</h1>
        <p className="text-ink-soft">Every booking made on the website, newest first.</p>
      </div>

      <form action="/bookings" className="flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 ring-1 ring-line">
        <div className="min-w-56 flex-1">
          <label htmlFor="q" className="block text-sm font-semibold text-ink">
            Booking reference
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Part of the reference" className={inputClass} />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-ink">
            Status
          </label>
          <select id="status" name="status" defaultValue={status} className={inputClass}>
            <option value="">All</option>
            {Object.entries(BOOKING_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md bg-plum px-5 py-2.5 text-sm font-semibold text-champagne-200 hover:bg-plum-700">
          Apply
        </button>
        {(q || status) && (
          <Link href="/bookings" className="rounded-md px-4 py-2.5 text-sm font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Clear
          </Link>
        )}
      </form>

      {!result.ok ? (
        <Notice tone="bad">{result.message}</Notice>
      ) : result.data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">No bookings match.</p>
      ) : (
        <>
          <p className="text-sm text-ink-soft" aria-live="polite">
            {result.data.total} {result.data.total === 1 ? "booking" : "bookings"}
          </p>
          <ul className="flex flex-col gap-3">
            {result.data.items.map((b) => {
              const s = BOOKING_STATUS[b.status] ?? { label: b.status, tone: "neutral" as const };
              return (
                <li key={b.reference} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link href={`/bookings/${b.reference}`} className="font-display text-xl text-ink underline-offset-4 hover:underline">
                      {b.reference}
                    </Link>
                    <p className="text-sm text-ink-soft">
                      {b.title}
                      {b.itemCount > 1 && ` + ${b.itemCount - 1} more`} · event {formatDate(b.firstEventDate)} · booked {formatDateTime(b.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm text-ink-soft">
                      <strong className="font-display text-lg text-ink">{formatRupees(b.totalMinor)}</strong>
                      <br />
                      advance {formatRupees(b.advanceMinor)} · commission {formatRupees(b.commissionMinor)}
                    </div>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager page={result.data.page} size={result.data.size} total={result.data.total} href={href} />
        </>
      )}
    </div>
  );
}
