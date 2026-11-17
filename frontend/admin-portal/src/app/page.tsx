import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LiveSync } from "@/components/LiveSync";
import { StatusButtons } from "@/components/StatusButtons";
import { Notice, StatCard } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { attempt, bookingsApi, commissionApi, customersApi } from "@/lib/backend";
import { formatRupees } from "@/lib/format";
import { listProviders } from "@/lib/store";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  if (!(await isAdmin())) redirect("/login");

  const [providers, customers, bookings, commission] = await Promise.all([
    listProviders(),
    attempt(() => customersApi().getCustomerSummary()),
    attempt(() => bookingsApi().getBookingStats()),
    attempt(() => commissionApi().getCommission()),
  ]);
  const count = (status: string) => providers.filter((p) => p.status === status).length;
  const waiting = providers.filter((p) => p.status === "PENDING");

  return (
    <div className="flex flex-col gap-12">
      <LiveSync />
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl tracking-tight">Dashboard</h1>
        <p className="text-ink-soft">Everything on the EVENTGRID website, in one place.</p>
      </header>

      <section aria-labelledby="providers-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="providers-heading" className="font-display text-2xl">
            Vendors
          </h2>
          <Link href="/vendors" className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-terracotta underline-offset-4">
            Manage vendors
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total" value={providers.length} href="/vendors" />
          <StatCard label="Waiting for approval" value={waiting.length} hint={waiting.length ? "Needs your decision" : "All caught up"} href="/vendors?status=PENDING" />
          <StatCard label="Approved" value={count("APPROVED")} href="/vendors?status=APPROVED" />
          <StatCard label="Not approved" value={count("REJECTED")} href="/vendors?status=REJECTED" />
        </div>
        {waiting.length > 0 && (
          <ul className="flex flex-col gap-3">
            {waiting.slice(0, 5).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4 ring-1 ring-line">
                <div className="flex min-w-0 flex-col">
                  <Link href={`/vendors/${p.id}`} className="font-display text-lg text-ink underline-offset-4 hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-sm text-ink-soft">
                    {p.city} · {p.email} · {p.services.length} {p.services.length === 1 ? "service" : "services"}
                  </span>
                </div>
                <StatusButtons id={p.id} current={p.status} only={["APPROVED", "REJECTED"]} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="customers-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="customers-heading" className="font-display text-2xl">
            Customers
          </h2>
          <Link href="/customers" className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-terracotta underline-offset-4">
            Manage customers
          </Link>
        </div>
        {customers.ok ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total" value={customers.data.total} href="/customers" />
            <StatCard label="Active" value={customers.data.active} href="/customers?status=ACTIVE" />
            <StatCard label="Suspended" value={customers.data.suspended} href="/customers?status=SUSPENDED" />
            <StatCard label="New in 7 days" value={customers.data.newLast7Days} />
          </div>
        ) : (
          <Notice tone="bad">{customers.message}</Notice>
        )}
      </section>

      <section aria-labelledby="bookings-heading" className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="bookings-heading" className="font-display text-2xl">
            Bookings
          </h2>
          <Link href="/bookings" className="inline-flex min-h-11 items-center text-sm font-medium text-ink underline decoration-terracotta underline-offset-4">
            All bookings
          </Link>
        </div>
        {bookings.ok ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total" value={bookings.data.total} href="/bookings" />
            <StatCard label="Advance paid" value={bookings.data.advancePaid} href="/bookings?status=ADVANCE_PAID" />
            <StatCard label="Awaiting payment" value={bookings.data.pendingPayment} href="/bookings?status=PENDING_PAYMENT" />
            <StatCard label="Advance collected" value={formatRupees(bookings.data.advanceCollectedMinor)} />
            <StatCard
              label="Commission earned"
              value={formatRupees(bookings.data.commissionEarnedMinor)}
              hint={commission.ok ? `At ${commission.data.rate.ratePercent}% of each booked package` : undefined}
              href="/commission"
            />
          </div>
        ) : (
          <Notice tone="bad">{bookings.message}</Notice>
        )}
      </section>

      <section aria-labelledby="site-heading" className="flex flex-col gap-3">
        <h2 id="site-heading" className="font-display text-2xl">
          Website
        </h2>
        <p className="text-ink-soft">Change the announcement bar, social links and contact details that visitors see.</p>
        <div>
          <Link href="/site" className="inline-flex rounded-md px-5 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Open website settings
          </Link>
        </div>
      </section>
    </div>
  );
}
