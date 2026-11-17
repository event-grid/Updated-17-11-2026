/**
 * Base URL of the EVNTGRID backend, used by server-side code only.
 * Not secret, but deliberately not NEXT_PUBLIC_: the browser never calls the backend by this URL.
 * Override with EVNTGRID_API_BASE_URL (for example in .env.local).
 */
export const apiBaseUrl =
  process.env.EVNTGRID_API_BASE_URL ?? "http://localhost:8080";
