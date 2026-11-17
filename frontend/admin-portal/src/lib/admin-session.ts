import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { adminConfigured, adminEmail, passwordMatches, sessionSecret } from "./admin-account";

/**
 * PROTOTYPE administrator sign-in: one account (see admin-account.ts). The session cookie is an HMAC of the email,
 * keyed by a secret that changes whenever the password changes, so changing the password signs every other browser
 * out. The backend has no administrator accounts yet.
 */
const COOKIE = "evg_admin";
const MAX_AGE_SECONDS = 8 * 60 * 60;

export { adminConfigured };

async function sign(): Promise<string> {
  return createHmac("sha256", await sessionSecret()).update(`admin-session:${adminEmail()}`).digest("hex");
}

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Starts (or renews) the browser's administrator session. */
export async function startAdminSession(): Promise<void> {
  (await cookies()).set(COOKIE, await sign(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function adminSignIn(email: string, password: string): Promise<boolean> {
  if (!adminConfigured() || !same(email.trim().toLowerCase(), adminEmail()) || !(await passwordMatches(password))) return false;
  await startAdminSession();
  return true;
}

export async function adminSignOut(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return Boolean(value && same(value, await sign()));
}
