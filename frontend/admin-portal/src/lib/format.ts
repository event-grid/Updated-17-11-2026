/** Indian formatting for amounts and dates. Amounts from the backend are in paise (₹1 = 100 paise). */

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupeesPaise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export function formatRupees(minor: number): string {
  return minor % 100 === 0 ? rupees.format(minor / 100) : rupeesPaise.format(minor / 100);
}

const dateTime = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const dateOnly = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function formatDateTime(value: Date | string | undefined | null): string {
  return value ? dateTime.format(new Date(value)) : "Never";
}

export function formatDate(value: Date | string | undefined | null): string {
  return value ? dateOnly.format(new Date(value)) : "—";
}
