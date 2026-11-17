/** Indian formatting for amounts (in paise, ₹1 = 100 paise) and dates. */
const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const rupeesPaise = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });

export function formatRupees(minor: number): string {
  return minor % 100 === 0 ? rupees.format(minor / 100) : rupeesPaise.format(minor / 100);
}

const dateOnly = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

export function formatDate(value: Date | string): string {
  return dateOnly.format(new Date(value));
}
