import { split } from "@/lib/commission-math";
import { formatRupees } from "@/lib/format";

/**
 * Tells a vendor what EVENTGRID keeps from each successful booking, with the example of a ₹20,000 booking.
 * Shows nothing when the rate could not be loaded.
 */
export function CommissionNotice({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const { priceMinor, commissionMinor, payoutMinor } = split(20_000, percent);
  return (
    <aside aria-label="Platform commission" className="flex flex-col gap-2 rounded-xl bg-plum p-6 text-champagne-200">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-champagne/70">Platform commission</p>
      <p className="font-display text-2xl text-champagne">
        EVENTGRID keeps {percent}% of each successful booking.
      </p>
      <p className="text-sm">
        For example, a booking of {formatRupees(priceMinor)} earns EVENTGRID {formatRupees(commissionMinor)}, and you receive{" "}
        <strong className="text-champagne">{formatRupees(payoutMinor)}</strong>. The commission is taken only when a customer’s
        booking succeeds (the advance is paid). Prices you enter below show what you would receive.
      </p>
    </aside>
  );
}
