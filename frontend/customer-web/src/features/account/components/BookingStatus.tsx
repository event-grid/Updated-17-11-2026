/**
 * Booking statuses exactly as the backend returns them. Provider confirmation and cancellation states will be added
 * when those rules are decided (D-22, D-25); an unknown value is shown as-is rather than guessed.
 */
const STATUS: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Awaiting payment", className: "bg-tile-butter text-ink" },
  ADVANCE_PAID: { label: "Advance paid", className: "bg-tile-mint text-[#2f5a40]" },
  PAYMENT_FAILED: { label: "Payment failed", className: "bg-tile-blush text-terracotta-600" },
  EXPIRED: { label: "Expired", className: "bg-sand text-ink-soft" },
};

export function BookingStatus({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: "bg-sand text-ink" };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${s.className}`}>{s.label}</span>;
}

export function bookingStatusLabel(status: string) {
  return STATUS[status]?.label ?? status;
}

export const PAYABLE = new Set(["PENDING_PAYMENT", "PAYMENT_FAILED"]);
