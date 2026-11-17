import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CommissionForm } from "@/components/CommissionForm";
import { Notice, StatCard } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { attempt, bookingsApi, commissionApi } from "@/lib/backend";
import { formatDateTime, formatRupees } from "@/lib/format";

export const metadata: Metadata = { title: "Commission" };

export default function CommissionPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-4xl tracking-tight">Commission</h1>
        <p className="max-w-2xl text-ink-soft">
          The share of every successfully booked package that EVENTGRID keeps. The vendor receives the rest. For example at
          5%, a hall booked for ₹20,000 earns EVENTGRID ₹1,000 and the vendor receives ₹19,000.
        </p>
      </div>
      <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
        <Content />
      </Suspense>
    </div>
  );
}

async function Content() {
  if (!(await isAdmin())) redirect("/login");
  const [overview, stats] = await Promise.all([attempt(() => commissionApi().getCommission()), attempt(() => bookingsApi().getBookingStats())]);

  if (!overview.ok) return <Notice tone="bad">{overview.message}</Notice>;
  const { rate, history } = overview.data;

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current rate" value={`${rate.ratePercent}%`} hint={`Changed ${formatDateTime(rate.updatedAt)}`} />
        {stats.ok ? (
          <>
            <StatCard label="Commission earned" value={formatRupees(stats.data.commissionEarnedMinor)} hint="On bookings whose advance is paid" />
            <StatCard label="Successful bookings" value={stats.data.advancePaid} href="/bookings?status=ADVANCE_PAID" />
          </>
        ) : (
          <div className="sm:col-span-2">
            <Notice tone="bad">{stats.message}</Notice>
          </div>
        )}
      </div>

      <CommissionForm current={rate.ratePercent} />

      <section aria-labelledby="history-heading" className="flex flex-col gap-4">
        <h2 id="history-heading" className="font-display text-2xl">
          History
        </h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-white p-8 text-center text-ink-soft">The rate has not been changed yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((change) => {
              const up = change.newPercent > change.oldPercent;
              return (
                <li key={String(change.changedAt)} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-5 py-4 ring-1 ring-line">
                  <span className="text-ink">
                    {change.oldPercent}% → <strong>{change.newPercent}%</strong>{" "}
                    <span className={up ? "text-terracotta-600" : "text-[#1f5a35]"}>{up ? "increased" : "decreased"}</span>
                  </span>
                  <span className="text-sm text-ink-soft">{formatDateTime(change.changedAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
