/** How booking statuses are shown. The statuses themselves are the backend's (provisional until provider confirmation exists). */
export const BOOKING_STATUS: Record<string, { label: string; tone: "good" | "warn" | "bad" | "neutral" }> = {
  ADVANCE_PAID: { label: "Advance paid", tone: "good" },
  PENDING_PAYMENT: { label: "Awaiting payment", tone: "warn" },
  PAYMENT_FAILED: { label: "Payment failed", tone: "bad" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};
