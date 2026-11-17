"use client";

import { useActionState, useState } from "react";

import { setCommissionAction } from "@/app/actions";
import { initialState } from "@/lib/action-state";
import { formatRupees } from "@/lib/format";

import { Field, FormMessage, inputClass, primaryButton, secondaryButton } from "./ui";

const STEP = 0.5;
const MAX = 30;

const clamp = (value: number) => Math.min(MAX, Math.max(0, Math.round(value * 100) / 100));

/** What the platform keeps and what the vendor receives for a price, in paise (same rounding as the backend). */
export function split(priceRupees: number, percent: number) {
  const priceMinor = Math.round(priceRupees * 100);
  const commissionMinor = Math.round((priceMinor * Math.round(percent * 100)) / 10_000);
  return { priceMinor, commissionMinor, payoutMinor: priceMinor - commissionMinor };
}

/**
 * Raise or lower the commission: type a percentage or use the + and - buttons, see what it means for a real price,
 * then save. A saved rate applies to bookings made from now on; existing bookings keep theirs.
 */
export function CommissionForm({ current }: { current: number }) {
  const [state, action, pending] = useActionState(setCommissionAction, initialState);
  const [draft, setDraft] = useState(String(state.values?.ratePercent ?? current));
  const [price, setPrice] = useState("20000");

  const percent = Number(draft);
  const valid = draft.trim() !== "" && Number.isFinite(percent) && percent >= 0 && percent <= MAX;
  const priceRupees = Number(price);
  const example = valid && Number.isFinite(priceRupees) && priceRupees > 0 ? split(priceRupees, percent) : null;
  const unchanged = valid && percent === current;

  const nudge = (delta: number) => setDraft(String(clamp((valid ? percent : current) + delta)));

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      <FormMessage message={state.message} ok={state.ok} />

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="rate-heading" className="flex flex-col gap-5 rounded-xl bg-white p-6 ring-1 ring-line">
          <h2 id="rate-heading" className="font-display text-2xl">
            Commission rate
          </h2>
          <Field label="Percentage kept from each booked package" name="ratePercent" error={state.errors.ratePercent} hint={`Between 0% and ${MAX}%, up to 2 decimals.`}>
            <div className="mt-1.5 flex items-stretch gap-2">
              <button type="button" onClick={() => nudge(-STEP)} aria-label={`Decrease by ${STEP}%`} className={`${secondaryButton} px-4 py-2 text-xl leading-none`}>
                −
              </button>
              <div className="relative flex-1">
                <input
                  id="ratePercent"
                  name="ratePercent"
                  inputMode="decimal"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
                  aria-invalid={Boolean(state.errors.ratePercent)}
                  className={`${inputClass} mt-0 pr-10 text-center font-display text-2xl`}
                />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft">
                  %
                </span>
              </div>
              <button type="button" onClick={() => nudge(STEP)} aria-label={`Increase by ${STEP}%`} className={`${secondaryButton} px-4 py-2 text-xl leading-none`}>
                +
              </button>
            </div>
          </Field>
          <p className="text-sm text-ink-soft">
            Now: <strong className="text-ink">{current}%</strong>. A new rate applies to bookings made from now on; bookings
            already made keep the rate they were made with.
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={pending || !valid || unchanged} className={primaryButton}>
              {pending ? "Saving…" : "Save commission"}
            </button>
            {draft !== String(current) && (
              <button type="button" onClick={() => setDraft(String(current))} className={secondaryButton}>
                Reset
              </button>
            )}
          </div>
        </section>

        <section aria-labelledby="example-heading" className="flex flex-col gap-5 rounded-xl bg-plum p-6 text-champagne-200">
          <h2 id="example-heading" className="font-display text-2xl text-champagne">
            What it means
          </h2>
          <div>
            <label htmlFor="example-price" className="block text-sm font-semibold text-champagne">
              A booked package costs (₹)
            </label>
            <input
              id="example-price"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              className="mt-1.5 w-full rounded-lg border border-champagne/30 bg-plum-700 px-3 py-2.5 text-champagne focus:border-champagne focus:outline-none"
            />
          </div>
          {example ? (
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-champagne/15 pb-3">
                <dt>Customer pays</dt>
                <dd className="font-display text-lg text-champagne">{formatRupees(example.priceMinor)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-champagne/15 pb-3">
                <dt>EVENTGRID keeps ({percent}%)</dt>
                <dd className="font-display text-lg text-champagne">{formatRupees(example.commissionMinor)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Vendor receives</dt>
                <dd className="font-display text-2xl text-champagne">{formatRupees(example.payoutMinor)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm">Enter a rate between 0% and {MAX}% and a price to see the split.</p>
          )}
        </section>
      </div>
    </form>
  );
}
