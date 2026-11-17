import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * PROTOTYPE administrator account. The administrator's sign-in email, and the first password, come from the root
 * .env (ADMIN_PORTAL_EMAIL, ADMIN_PORTAL_PASSWORD). Changing the password on the Settings page stores a hash in
 * `frontend/.demo-data/admin-account.json`, which then replaces the .env password; delete that file to go back to
 * the .env one. The display name lives in the same file. The backend has no administrator accounts yet.
 */
type Stored = { displayName?: string; passwordSalt?: string; passwordHash?: string };

const FILE = path.resolve(process.cwd(), "..", ".demo-data", "admin-account.json");

async function read(): Promise<Stored> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Stored;
  } catch {
    return {};
  }
}

async function write(data: Stored): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(temp, FILE);
}

const derive = (password: string, salt: string) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (e, key) => (e ? reject(e) : resolve(key))));

function same(a: Buffer | string, b: Buffer | string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const adminEmail = () => process.env.ADMIN_PORTAL_EMAIL?.trim().toLowerCase() ?? "";
const envPassword = () => process.env.ADMIN_PORTAL_PASSWORD ?? "";

export const adminConfigured = () => Boolean(adminEmail() && envPassword());

/** True when the password was changed in the portal (so the .env password no longer applies). */
export async function passwordWasChanged(): Promise<boolean> {
  return Boolean((await read()).passwordHash);
}

/** Checks a password against the stored hash, or against the .env password until it has been changed. */
export async function passwordMatches(password: string): Promise<boolean> {
  const stored = await read();
  if (stored.passwordHash && stored.passwordSalt) {
    return same(await derive(password, stored.passwordSalt), Buffer.from(stored.passwordHash, "hex"));
  }
  const expected = envPassword();
  return expected.length > 0 && same(password, expected);
}

/** The secret that signs the session cookie: it changes with the password, so a password change ends old sessions. */
export async function sessionSecret(): Promise<string> {
  const stored = await read();
  return stored.passwordHash ?? envPassword();
}

export async function changePassword(current: string, next: string): Promise<boolean> {
  if (!(await passwordMatches(current))) return false;
  const stored = await read();
  const salt = randomBytes(16).toString("hex");
  await write({ ...stored, passwordSalt: salt, passwordHash: (await derive(next, salt)).toString("hex") });
  return true;
}

export async function displayName(): Promise<string> {
  return (await read()).displayName?.trim() || "Administrator";
}

export async function saveDisplayName(name: string): Promise<void> {
  await write({ ...(await read()), displayName: name.trim() });
}
