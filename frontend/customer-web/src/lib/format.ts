/** Indian formatting for amounts and dates. Amounts from the API are in paise (₹1 = 100 paise). */

const rupeeFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupeePaiseFormat = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

/** ₹1,50,000 (Indian digit grouping); paise are shown only when present. */
export function formatRupees(minor: number): string {
  return minor % 100 === 0 ? rupeeFormat.format(minor / 100) : rupeePaiseFormat.format(minor / 100);
}

/** "per guest" for PER_GUEST packages, nothing for FIXED. */
export function unitSuffix(priceUnit: string | null | undefined): string {
  return priceUnit === "PER_GUEST" ? " per guest" : "";
}

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** 14 Feb 2027. Accepts a Date or an ISO date (yyyy-mm-dd, read as an Indian calendar date). */
export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00+05:30`) : value;
  return dateFormat.format(date);
}

export function formatDateTime(value: Date): string {
  return dateTimeFormat.format(value);
}

/** yyyy-mm-dd of a date in India, for <input type="date"> and the API. */
export function isoDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(date);
}

/** Tomorrow in India: the earliest event date the backend accepts. */
export function tomorrowIso(now = new Date()): string {
  return isoDate(new Date(now.getTime() + 24 * 60 * 60 * 1000));
}

export function capacityLabel(min?: number | null, max?: number | null): string | null {
  if (min && max) return `${min.toLocaleString("en-IN")}–${max.toLocaleString("en-IN")} guests`;
  if (max) return `Up to ${max.toLocaleString("en-IN")} guests`;
  if (min) return `From ${min.toLocaleString("en-IN")} guests`;
  return null;
}
