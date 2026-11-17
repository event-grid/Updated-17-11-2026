/**
 * What the platform keeps and what a vendor receives for a price. Same rule as the backend: the commission is the
 * price times the rate, rounded half up to a whole paisa. Pure and safe to use in the browser.
 */
export function split(priceRupees: number, percent: number) {
  const priceMinor = Math.round(priceRupees * 100);
  const commissionMinor = Math.round((priceMinor * Math.round(percent * 100)) / 10_000);
  return { priceMinor, commissionMinor, payoutMinor: priceMinor - commissionMinor };
}
