import "server-only";

import {
  AdminBookingsApi,
  AdminCommissionApi,
  AdminCustomersApi,
  Configuration,
  FetchError,
  ResponseError,
} from "@/lib/api/generated/admin";

/**
 * Server-side clients for the backend's administration API (/api/admin/v1), generated from
 * backend/openapi/admin-v1.json. The admin portal's server authenticates with ADMIN_API_TOKEN from the root .env;
 * the token never reaches the browser. Never call `fetch` directly for the API.
 */
const baseUrl = () => process.env.EVNTGRID_API_BASE_URL ?? "http://localhost:8080";

function configuration(): Configuration {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) throw new Error("NOT_CONFIGURED");
  return new Configuration({
    basePath: baseUrl(),
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    // Administration data must always be fresh.
    fetchApi: (input, init) => fetch(input, { ...init, cache: "no-store" }),
  });
}

export const customersApi = () => new AdminCustomersApi(configuration());
export const bookingsApi = () => new AdminBookingsApi(configuration());
export const commissionApi = () => new AdminCommissionApi(configuration());

export type Outcome<T> = { ok: true; data: T } | { ok: false; message: string };

/** Runs a backend call and turns every failure into a message the page can show. */
export async function attempt<T>(call: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { ok: true, data: await call() };
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_CONFIGURED") {
      return { ok: false, message: "ADMIN_API_TOKEN is not set in the root .env file. Add it and restart the backend and the admin portal." };
    }
    if (error instanceof ResponseError) {
      if (error.response.status === 401 || error.response.status === 403) {
        return { ok: false, message: "The backend refused the admin token. ADMIN_API_TOKEN in .env must be the same for the backend and the admin portal; restart both after changing it." };
      }
      try {
        const problem = (await error.response.json()) as { detail?: string };
        if (problem.detail) return { ok: false, message: problem.detail };
      } catch {
        // not a JSON body
      }
      return { ok: false, message: `The backend answered with an error (${error.response.status}).` };
    }
    if (error instanceof FetchError || error instanceof TypeError) {
      return { ok: false, message: `The backend is not reachable at ${baseUrl()}. Start it with scripts\\development\\run-backend.ps1.` };
    }
    throw error;
  }
}
