"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

import { BookingStatus, PAYABLE } from "@/features/account/components/BookingStatus";
import { useBooking, useSignedIn } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";
import { usePayWithRazorpay } from "@/features/shopping/razorpay";
import { shoppingApi } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { formatDate, formatDateTime, formatRupees, unitSuffix } from "@/lib/format";

export default function BookingPage() {
  const { reference } = useParams<{ reference: string }>();
  const justPaid = useSearchParams().get("paid") === "1";
  const { session } = useSignedIn();
  const booking = useBooking(reference);
  const { state, pay } = usePayWithRazorpay();

  if (session.status === "loading" || booking.isLoading) return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="this booking" />;
  if (booking.isError) {
    const notFound = booking.error instanceof ApiError && booking.error.status === 404;
    return (
      <p role="alert" className="rounded-xl bg-white p-6 text-ink ring-1 ring-line">
        {notFound ? "This booking was not found." : "We could not load this booking. Please refresh."}{" "}
        <Link href="/account/bookings" className="font-semibold text-terracotta">
          All bookings →
        </Link>
      </p>
    );
  }

  const b = booking.data!;
  const payable = PAYABLE.has(b.status);
  const busy = state.status !== "idle";

  return (
    <article className="flex flex-col gap-8">
      <Link href="/account/bookings" className="text-sm text-ink-soft hover:text-terracotta">
        ← All bookings
      </Link>

      {/* Success is shown only when the backend itself reports the advance as paid. */}
      {justPaid && b.status === "ADVANCE_PAID" && (
        <div role="status" className="animate-[pop-in_0.6s_var(--ease-out-soft)] rounded-xl bg-tile-mint p-5 ring-1 ring-[#5c8a6e]/30">
          <p className="font-display text-2xl text-ink">Payment received — thank you!</p>
          <p className="text-sm text-ink">The providers will confirm your dates. We&apos;ll notify you here.</p>
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-soft">Booking</p>
          <h1 className="mt-1 font-display text-4xl text-ink">{b.reference}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Booked {formatDateTime(b.createdAt)}
            {b.advancePaidAt && <> · advance paid {formatDateTime(b.advancePaidAt)}</>}
          </p>
        </div>
        <BookingStatus status={b.status} />
      </header>

      {payable && (
        <div className="flex flex-col gap-3 rounded-xl bg-tile-butter/50 p-5 ring-1 ring-gold/30 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink">
            {b.status === "PAYMENT_FAILED" ? "Your last payment did not go through." : "This booking is waiting for its advance."} Pay{" "}
            {formatRupees(b.totals.advanceMinor)} to book.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => pay(() => shoppingApi.retryBookingPayment({ reference: b.reference }))}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-3 font-semibold text-white transition-all hover:bg-terracotta-600 active:scale-[0.98] disabled:opacity-60"
          >
            {busy && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {state.status === "verifying" ? "Confirming…" : `Pay ${formatRupees(b.totals.advanceMinor)}`}
          </button>
        </div>
      )}
      {state.error && (
        <p key={state.error} role="alert" className="animate-shake text-sm text-terracotta-600">
          {state.error}
        </p>
      )}

      <section aria-labelledby="items-heading" className="flex flex-col gap-4">
        <h2 id="items-heading" className="font-display text-2xl text-ink">
          Items
        </h2>
        <ul className="flex flex-col gap-3">
          {b.items.map((item, i) => (
            <li key={i} className="flex flex-wrap justify-between gap-3 rounded-xl bg-white p-5 ring-1 ring-line">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">{item.categoryName}</p>
                <p className="font-display text-xl text-ink">{item.packageTitle}</p>
                <p className="text-sm text-ink-soft">
                  {item.listingTitle} · {item.providerName}
                </p>
                <p className="text-sm text-ink">Event date: {formatDate(item.eventDate)}</p>
                {item.notes && <p className="text-sm text-ink-soft">Note: {item.notes}</p>}
              </div>
              <p className="text-right">
                <span className="block font-display text-xl text-ink">{formatRupees(item.lineTotalMinor)}</span>
                <span className="text-xs text-ink-soft">
                  {formatRupees(item.unitPriceMinor)}
                  {unitSuffix(item.priceUnit)}
                  {item.quantity > 1 && ` × ${item.quantity.toLocaleString("en-IN")}`}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="payment-heading" className="flex flex-col gap-3 rounded-xl bg-white p-6 ring-1 ring-line">
        <h2 id="payment-heading" className="font-display text-2xl text-ink">
          Payment
        </h2>
        <dl className="grid gap-2 text-sm sm:max-w-md">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Total</dt>
            <dd>{formatRupees(b.totals.totalMinor)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Advance ({b.totals.advancePercent}%)</dt>
            <dd className="font-semibold">
              {formatRupees(b.totals.advanceMinor)} {b.advancePaidAt ? "· paid" : "· not paid yet"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Balance, paid to vendors</dt>
            <dd>{formatRupees(b.totals.balanceMinor)}</dd>
          </div>
        </dl>
        <p className="text-xs text-ink-soft">
          Vendor confirmation, cancellation and refund rules are not published yet; they will appear here once they are.
        </p>
      </section>
    </article>
  );
}
