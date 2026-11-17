"use client";

import { useEffect, useSyncExternalStore } from "react";

import { callBrowserApi, identityApi, resetCsrfToken, sessionApi } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { SignedInAccount } from "@/lib/api/generated/customer";

/**
 * Who is signed in, shared by the header and the sign-in page. The backend session (HttpOnly cookie) is
 * the source of truth; this only mirrors GET /api/customer/v1/me for display. It never decides access.
 */
export type SessionState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; account: SignedInAccount };

let state: SessionState = { status: "loading" };
let loaded = false;
const listeners = new Set<() => void>();

function set(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

export async function refreshSession() {
  loaded = true;
  try {
    // Public endpoint that always answers 200, so a signed-out visit logs no error.
    const current = await callBrowserApi(() => identityApi.getCurrentSession());
    set(current.signedIn && current.account ? { status: "signed-in", account: current.account } : { status: "signed-out" });
  } catch (error) {
    // Backend unreachable: show the sign-in link rather than an error.
    if (!(error instanceof ApiError) || error.code !== "API_UNREACHABLE") {
      console.warn("Could not check the session", error);
    }
    set({ status: "signed-out" });
  }
}

export function setSignedIn(account: SignedInAccount) {
  loaded = true;
  resetCsrfToken();
  set({ status: "signed-in", account });
}

export async function signOut() {
  try {
    await callBrowserApi(() => sessionApi.signOut());
  } finally {
    resetCsrfToken();
    set({ status: "signed-out" });
  }
}

const SERVER_STATE: SessionState = { status: "loading" };

export function useSession(): SessionState {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => SERVER_STATE,
  );
  useEffect(() => {
    if (!loaded) {
      void refreshSession();
    }
  }, []);
  return current;
}

/** "+91 98765 43210" for phones, the address for email. */
export function accountLabel(account: SignedInAccount): string {
  if (account.displayName) return account.displayName;
  if (account.phone?.startsWith("+91") && account.phone.length === 13) {
    return `+91 ${account.phone.slice(3, 8)} ${account.phone.slice(8)}`;
  }
  return account.phone ?? account.email ?? "My account";
}
