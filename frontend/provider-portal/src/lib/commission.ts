/**
 * The platform commission, read from the backend's public API: the share of each booked package that EVENTGRID
 * keeps (a vendor receives the rest). `null` when the backend cannot be reached, so pages can leave the figures out
 * instead of failing. Server-side only.
 */
const API = process.env.EVNTGRID_API_BASE_URL ?? "http://localhost:8080";

export async function loadCommissionPercent(): Promise<number | null> {
  try {
    const response = await fetch(`${API}/api/public/v1/commission`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) return null;
    const body = (await response.json()) as { ratePercent?: number };
    return typeof body.ratePercent === "number" ? body.ratePercent : null;
  } catch {
    return null;
  }
}
