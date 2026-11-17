"use client";

import Link from "next/link";
import { useState } from "react";

import { ApiError } from "@/lib/api/errors";
import { shoppingApi } from "@/lib/api/client";
import type { CartLine } from "@/lib/api/generated/customer";
import { formatDate, formatRupees, isoDate, tomorrowIso, unitSuffix } from "@/lib/format";

import { useCart, useCartMutations, useSignedIn } from "../hooks";
import { usePayWithRazorpay } from "../razorpay";

import { SignInPrompt } from "./SignInPrompt";

/** The cart: edit dates and quantities, see the advance due now, and pay it with Razorpay. */
export function CartView() {
  const { session } = useSignedIn();
  const cart = useCart();
  const { state, pay } = usePayWithRazorpay();

  if (session.status === "loading" || (session.status === "signed-in" && cart.isLoading)) {
    return <div aria-hidden="true" className="skeleton h-80 rounded-xl" />;
  }
  if (session.status === "signed-out") {
    return <SignInPrompt what="your cart" />;
  }
  if (cart.isError || !cart.data) {
    return <p role="alert" className="rounded-xl bg-white p-6 text-terracotta-600 ring-1 ring-line">We could not load your cart. Please refresh.</p>;
  }

  const { items, totals, checkoutReady, paymentsEnabled } = cart.data;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 rounded-xl border border-dashed border-line bg-white p-10">
        <p className="font-display text-3xl text-ink">Your cart is empty</p>
        <p className="text-ink-soft">Browse venues and services and add packages for your event.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/venues" className="rounded-md bg-plum px-5 py-3 font-semibold text-champagne-200 hover:bg-plum-700">
            Browse venues
          </Link>
          <Link href="/services" className="rounded-md px-5 py-3 font-semibold text-ink ring-1 ring-line hover:text-terracotta">
            Browse services
          </Link>
        </div>
      </div>
    );
  }

  const busy = state.status !== "idle";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="flex flex-col gap-4" aria-label="Cart items">
        {items.map((line, i) => (
          <li key={line.id} className="stagger animate-fade-up" style={{ "--i": i } as React.CSSProperties}>
            <CartItem line={line} />
          </li>
        ))}
      </ul>

      <aside aria-labelledby="summary-heading" className="flex flex-col gap-4 self-start rounded-xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-28">
        <h2 id="summary-heading" className="font-display text-2xl text-ink">
          Summary
        </h2>
        <dl className="flex flex-col gap-2 text-sm">
          <Row label={`Total (${items.length} ${items.length === 1 ? "item" : "items"})`} value={formatRupees(totals.totalMinor)} />
          <Row label={`Advance now (${totals.advancePercent}%)`} value={formatRupees(totals.advanceMinor)} strong />
          <Row label="Balance, paid to vendors later" value={formatRupees(totals.balanceMinor)} />
        </dl>
        {!paymentsEnabled && (
          <p role="status" className="rounded-lg bg-tile-butter/60 px-4 py-3 text-sm text-ink">
            Online payment is not available yet. Your cart is saved — please check back soon.
          </p>
        )}
        {!checkoutReady && paymentsEnabled && (
          <p role="status" className="text-sm text-terracotta-600">Some items need attention before you can pay.</p>
        )}
        {state.error && (
          <p key={state.error} role="alert" className="animate-shake text-sm text-terracotta-600">
            {state.error}
          </p>
        )}
        <button
          type="button"
          disabled={!checkoutReady || !paymentsEnabled || busy}
          onClick={() => pay(() => shoppingApi.checkout())}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-terracotta px-5 py-4 font-semibold text-white shadow-[0_10px_24px_-14px_rgb(217_115_90/0.9)] transition-all hover:-translate-y-px hover:bg-terracotta-600 active:scale-[0.99] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {state.status === "verifying" ? "Confirming payment…" : `Pay ${formatRupees(totals.advanceMinor)} advance`}
        </button>
        <p className="text-xs leading-relaxed text-ink-soft">
          Payments are processed securely by Razorpay (UPI, cards, net banking, wallets). Event dates are requests; each
          vendor confirms availability after booking. Cancellation and refund terms will be shown here once published.
        </p>
      </aside>
    </div>
  );
}

function CartItem({ line }: { line: CartLine }) {
  const { update, remove } = useCartMutations();
  const [error, setError] = useState<string | null>(null);
  const perGuest = line.priceUnit === "PER_GUEST";

  const save = (quantity: number, eventDate: string) => {
    setError(null);
    update.mutate(
      { itemId: line.id, update: { quantity, eventDate: new Date(`${eventDate}T00:00:00Z`), notes: line.notes } },
      { onError: (e) => setError(e instanceof ApiError ? e.message : "Could not update this item.") },
    );
  };
  const date = isoDate(line.eventDate);

  return (
    <article className={`flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ${line.problem ? "ring-terracotta/50" : "ring-line"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">{line.categoryName}</p>
          <h3 className="font-display text-2xl leading-tight text-ink">{line.packageTitle}</h3>
          <p className="text-sm text-ink-soft">
            {line.listingTitle} ·{" "}
            {line.providerSlug ? (
              <Link href={`/vendors/${line.providerSlug}`} className="underline decoration-terracotta underline-offset-4">
                {line.providerName}
              </Link>
            ) : (
              line.providerName
            )}
          </p>
        </div>
        <p className="text-right">
          <span className="block font-display text-2xl text-ink">{formatRupees(line.lineTotalMinor)}</span>
          <span className="text-xs text-ink-soft">
            {formatRupees(line.unitPriceMinor)}
            {unitSuffix(line.priceUnit)}
            {line.quantity > 1 && ` × ${line.quantity.toLocaleString("en-IN")}`}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Event date
          <input
            type="date"
            min={tomorrowIso()}
            defaultValue={date}
            disabled={!line.available || update.isPending}
            onChange={(e) => e.target.value && save(line.quantity, e.target.value)}
            className="mt-1 block rounded-lg border border-line px-3 py-2 text-sm normal-case tracking-normal text-ink focus:border-terracotta focus:outline-none"
          />
        </label>
        {line.maxQuantity > 1 && (
          <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {perGuest ? "Guests" : "Quantity"}
            <input
              type="number"
              inputMode="numeric"
              min={line.minQuantity}
              max={line.maxQuantity}
              defaultValue={line.quantity}
              disabled={!line.available || update.isPending}
              onBlur={(e) => {
                const q = Number(e.target.value);
                if (Number.isInteger(q) && q !== line.quantity) save(q, date);
              }}
              className="mt-1 block w-28 rounded-lg border border-line px-3 py-2 text-sm normal-case tracking-normal text-ink focus:border-terracotta focus:outline-none"
            />
          </label>
        )}
        <p className="pb-2 text-sm text-ink-soft">{formatDate(line.eventDate)}</p>
        <button
          type="button"
          onClick={() => remove.mutate(line.id)}
          disabled={remove.isPending}
          className="ml-auto pb-2 text-sm font-semibold text-ink-soft underline-offset-4 hover:text-terracotta hover:underline"
        >
          {remove.isPending ? "Removing…" : "Remove"}
        </button>
      </div>
      {line.notes && <p className="text-sm text-ink-soft">Note: {line.notes}</p>}
      {(line.problem || error) && (
        <p role="alert" className="text-sm font-medium text-terracotta-600">
          {error ?? line.problem}
        </p>
      )}
    </article>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-y border-line py-2 text-base font-semibold text-ink" : "text-ink-soft"}`}>
      <dt>{label}</dt>
      <dd className={strong ? "text-terracotta-600" : "text-ink"}>{value}</dd>
    </div>
  );
}
