import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { Notice, Pill } from "@/components/ui";
import { isAdmin } from "@/lib/admin-session";
import { attempt, bookingsApi } from "@/lib/backend";
import { BOOKING_STATUS } from "@/lib/booking-status";
import { formatDate, formatDateTime, formatRupees } from "@/lib/format";

export const metadata: Metadata = { title: "Booking" };

export default function BookingDetailPage(props: PageProps<"/bookings/[reference]">) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="h-96 animate-pulse rounded-xl bg-sand" />}>
      <Detail params={props.params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/bookings/[reference]">, "params">) {
  if (!(await isAdmin())) redirect("/login");
  const { reference } = await params;
  const result = await attempt(() => bookingsApi().getBooking({ reference }));

  if (!result.ok) {
    // The backend answers 404 for an unknown reference; show that as "not found", anything else as a notice.
    if (result.message.includes("404") || /not found|does not exist/i.test(result.message)) notFound();
    return <Notice tone="bad">{result.message}</Notice>;
  }
  const { booking, items } = result.data;
  const status = BOOKING_STATUS[booking.status] ?? { label: booking.status, tone: "neutral" as const };

  return (
    <div className="flex flex-col gap-10">
      <Link href="/bookings" className="text-sm text-ink-soft hover:text-terracotta">
        ← All bookings
      </Link>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-4xl tracking-tight">{booking.reference}</h1>
          <Pill tone={status.tone}>{status.label}</Pill>
        </div>
        <p className="text-ink-soft">
          Booked {formatDateTime(booking.createdAt)} · customer {booking.customerId}
          {booking.advancePaidAt && <> · advance paid {formatDateTime(booking.advancePaidAt)}</>}
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", formatRupees(booking.totalMinor)],
          ["Advance (paid online)", formatRupees(booking.advanceMinor)],
          ["Balance (paid to vendors)", formatRupees(booking.balanceMinor)],
          ["Commission kept", formatRupees(booking.commissionMinor)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-5 ring-1 ring-line">
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">{label}</dt>
            <dd className="font-display text-3xl text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">Items</h2>
        <ul className="flex flex-col gap-3">
          {items.map((item, i) => (
            <li key={i} className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-line">
              <div className="flex flex-col gap-1">
                <p className="font-display text-xl text-ink">{item.listingTitle}</p>
                <p className="text-sm text-ink-soft">
                  {item.packageTitle} · {item.providerName} · {item.categoryName}
                </p>
                <p className="text-sm text-ink-soft">
                  Event {formatDate(item.eventDate)} · {item.quantity} × {formatRupees(item.unitPriceMinor)}
                  {item.priceUnit === "PER_GUEST" ? " per guest" : ""}
                </p>
                {item.notes && <p className="text-sm text-ink">Note: {item.notes}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <strong className="font-display text-xl text-ink">{formatRupees(item.lineTotalMinor)}</strong>
                <span className="text-xs text-ink-soft">
                  Commission {item.commissionBps / 100}%: {formatRupees(item.commissionMinor)}
                </span>
                <span className="text-xs text-ink-soft">Vendor receives {formatRupees(item.providerPayoutMinor)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
