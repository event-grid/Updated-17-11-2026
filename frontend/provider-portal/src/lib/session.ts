import { cookies } from "next/headers";

import { endSession, providerForSession, startSession, type Provider } from "./store";

const COOKIE = "evg_partner";
/**
 * A flag cookie (no secret, only "1") that tells the customer website a provider is signed in, so it can hide its
 * "For vendors" link. Readable by scripts on purpose. In production set SESSION_COOKIE_DOMAIN to the shared parent
 * domain (for example .evntgrid.com) so both sites see it; on localhost cookies are shared between ports.
 */
const FLAG = "evg_provider";
const MAX_AGE_SECONDS = 12 * 60 * 60;
const flagDomain = process.env.SESSION_COOKIE_DOMAIN || undefined;

/** Signs the provider in: a random token in an httpOnly cookie, with its hash kept in the prototype store. */
export async function signIn(providerId: string): Promise<void> {
  const token = await startSession(providerId);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  (await cookies()).set(FLAG, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: flagDomain,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await endSession(token);
  jar.delete(COOKIE);
  jar.set(FLAG, "", { path: "/", domain: flagDomain, maxAge: 0 });
}

/**
 * The signed-in provider, or null. Only approved providers count: if an administrator rejects or suspends an account
 * that is signed in, the next request treats it as signed out.
 */
export async function currentProvider(): Promise<Provider | null> {
  const provider = await providerForSession((await cookies()).get(COOKIE)?.value);
  return provider?.status === "APPROVED" ? provider : null;
}
