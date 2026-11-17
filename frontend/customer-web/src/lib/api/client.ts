import { ApiError, toApiError } from "./errors";
import {
  Configuration as CustomerConfiguration,
  FavouritesApi,
  NotificationsApi,
  SessionApi,
  ShoppingApi,
} from "./generated/customer";
import { IdentityApi, Configuration as PublicConfiguration } from "./generated/public";

/**
 * Browser-side API clients (FRONTEND_ARCHITECTURE.md, section 6). Requests go to this site's own /api/*
 * (same-origin routing, AR-01), carry the session cookie, and send the session-bound CSRF token on writes.
 * Server-side code uses lib/server/public-api.ts instead.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

let csrfToken: Promise<{ headerName: string; token: string }> | null = null;

/** Forget the CSRF token (the backend issues a new one after sign-in and sign-out). */
export function resetCsrfToken() {
  csrfToken = null;
}

const csrfMiddleware = {
  async pre({ url, init }: { url: string; init: RequestInit }) {
    const method = (init.method ?? "GET").toUpperCase();
    if (SAFE_METHODS.has(method)) {
      return { url, init };
    }
    csrfToken ??= identityApi.getCsrfToken().catch((error) => {
      csrfToken = null;
      throw error;
    });
    const { headerName, token } = await csrfToken;
    const headers = new Headers(init.headers);
    headers.set(headerName, token);
    return { url, init: { ...init, headers } };
  },
};

const common = {
  basePath: "", // same origin
  credentials: "same-origin" as RequestCredentials,
  headers: { Accept: "application/json" },
  middleware: [csrfMiddleware],
};

export const identityApi = new IdentityApi(new PublicConfiguration(common));
const customer = new CustomerConfiguration(common);
export const sessionApi = new SessionApi(customer);
export const shoppingApi = new ShoppingApi(customer);
export const favouritesApi = new FavouritesApi(customer);
export const notificationsApi = new NotificationsApi(customer);

/** Runs an API call; failures become `ApiError`. A stale CSRF token is refreshed and the call retried once. */
export async function callBrowserApi<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    const apiError = await toApiError(error, "this site's /api");
    if (apiError.code === "CSRF_INVALID") {
      resetCsrfToken();
      try {
        return await call();
      } catch (retryError) {
        throw await toApiError(retryError, "this site's /api");
      }
    }
    throw apiError;
  }
}

export { ApiError };
