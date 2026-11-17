"use client";

import { useSyncExternalStore } from "react";

import { useSession } from "./session-store";

/**
 * Name of the flag cookie that provider-portal sets while a provider is signed in (it holds no secret, only "1").
 * Set SESSION_COOKIE_DOMAIN to the shared parent domain in production so this site can see it; on localhost,
 * cookies are shared between ports, so it works without that.
 */
const PROVIDER_FLAG = "evg_provider=1";

function subscribe(onChange: () => void) {
  window.addEventListener("focus", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const providerSignedIn = () => document.cookie.split("; ").includes(PROVIDER_FLAG);

/**
 * True only for visitors who are not signed in as a customer or as a provider. The "For vendors" link is for
 * them; once someone has signed in it is hidden. Shown after the session check, so it never flashes for
 * signed-in people.
 */
export function useShowProviderLink(): boolean {
  const session = useSession();
  const provider = useSyncExternalStore(subscribe, providerSignedIn, () => false);
  return session.status === "signed-out" && !provider;
}

/** Renders its children (the "For vendors" link) only when useShowProviderLink() is true. */
export function ShowForVisitors({ children }: { children: React.ReactNode }) {
  return useShowProviderLink() ? <>{children}</> : null;
}
