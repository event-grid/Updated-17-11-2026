/**
 * DEVELOPMENT PROTOTYPE STORE for service providers.
 *
 * The backend has no provider accounts or provider sign-in yet (see provider module notes in the database
 * migrations). Until it does, provider-portal, admin-portal and customer-web read and write one JSON file,
 * `frontend/.demo-data/providers.json`, so a provider registered in one app shows up in the others.
 *
 * Not for production: no locking between processes, no real session management and no audit trail. This file is
 * copied identically into provider-portal, admin-portal and customer-web (the applications share no code).
 * Replace it with calls to the backend's provider and admin APIs when those exist.
 */
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export type ProviderType = "INDIVIDUAL" | "COMPANY";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ServicePackage = { name: string; priceRupees: number; description: string };

export type ServiceDetails = {
  /** "<categorySlug>:<serviceCode>" */
  key: string;
  categorySlug: string;
  categoryName: string;
  serviceCode: string;
  serviceName: string;
  /** Options of the service (from the catalogue) this provider offers. */
  options: string[];
  /** Values for the service's attributes (for example Cost, Type), by attribute name. */
  attributes: Record<string, string>;
  startingPriceRupees: number | null;
  priceUnit: "FIXED" | "PER_GUEST";
  description: string;
  packages: ServicePackage[];
  /** False until the provider has filled in the details. */
  completed: boolean;
};

export type Provider = {
  id: string;
  slug: string;
  name: string;
  type: ProviderType;
  email: string;
  phone: string;
  city: string;
  area: string;
  about: string;
  status: ApprovalStatus;
  createdBy: "SELF" | "ADMIN";
  createdAt: string;
  passwordSalt: string;
  passwordHash: string;
  services: ServiceDetails[];
};

type Session = { tokenHash: string; providerId: string; expiresAt: number };
type Data = { providers: Provider[]; sessions: Session[] };

const FILE = path.resolve(process.cwd(), "..", ".demo-data", "providers.json");

let queue: Promise<unknown> = Promise.resolve();

/** Runs store changes one after another inside this process. */
function serial<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
}

async function load(): Promise<Data> {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8")) as Partial<Data>;
    return { providers: parsed.providers ?? [], sessions: parsed.sessions ?? [] };
  } catch {
    return { providers: [], sessions: [] };
  }
}

async function save(data: Data): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(temp, FILE);
}

/** Reads, changes and writes the store as one step. */
async function change<T>(work: (data: Data) => T): Promise<T> {
  return serial(async () => {
    const data = await load();
    const result = work(data);
    await save(data);
    return result;
  });
}

// ---- passwords and sessions ---------------------------------------------------------------------------------

function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, 64, (error, key) => (error ? reject(error) : resolve(key))),
  );
}

export async function hashPassword(password: string): Promise<{ salt: string; hash: string }> {
  const salt = randomBytes(16).toString("hex");
  return { salt, hash: (await derive(password, salt)).toString("hex") };
}

async function passwordMatches(provider: Provider, password: string): Promise<boolean> {
  const expected = Buffer.from(provider.passwordHash, "hex");
  const actual = await derive(password, provider.passwordSalt);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const SESSION_HOURS = 12;

export async function startSession(providerId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await change((data) => {
    const now = Date.now();
    data.sessions = data.sessions.filter((s) => s.expiresAt > now);
    data.sessions.push({ tokenHash: sha256(token), providerId, expiresAt: now + SESSION_HOURS * 3_600_000 });
  });
  return token;
}

export async function endSession(token: string): Promise<void> {
  await change((data) => {
    data.sessions = data.sessions.filter((s) => s.tokenHash !== sha256(token));
  });
}

export async function providerForSession(token: string | undefined): Promise<Provider | null> {
  if (!token) return null;
  const data = await load();
  const session = data.sessions.find((s) => s.tokenHash === sha256(token) && s.expiresAt > Date.now());
  return data.providers.find((p) => p.id === session?.providerId) ?? null;
}

/** Changes every time the provider store or the site settings are written. Pages poll this (through the live-update route) to refresh themselves. */
export async function storeVersion(): Promise<number> {
  const times = await Promise.all(
    [FILE, path.join(path.dirname(FILE), "site-settings.json")].map(async (file) => {
      try {
        return (await fs.stat(file)).mtimeMs;
      } catch {
        return 0;
      }
    }),
  );
  return Math.max(...times);
}

// ---- providers ------------------------------------------------------------------------------------------------

export async function listProviders(): Promise<Provider[]> {
  return (await load()).providers.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listApprovedProviders(): Promise<Provider[]> {
  return (await listProviders()).filter((p) => p.status === "APPROVED");
}

export async function getProviderById(id: string): Promise<Provider | null> {
  return (await load()).providers.find((p) => p.id === id) ?? null;
}

export async function getApprovedProviderBySlug(slug: string): Promise<Provider | null> {
  return (await load()).providers.find((p) => p.slug === slug && p.status === "APPROVED") ?? null;
}

export async function findByEmail(email: string): Promise<Provider | null> {
  const wanted = email.trim().toLowerCase();
  return (await load()).providers.find((p) => p.email === wanted) ?? null;
}

/** The provider when the email and password match, otherwise null (the same answer for both mistakes). */
export async function authenticate(email: string, password: string): Promise<Provider | null> {
  const provider = await findByEmail(email);
  if (!provider) {
    // Spend the same time as a real check so the answer does not reveal whether the email exists.
    await derive(password, "0".repeat(32));
    return null;
  }
  return (await passwordMatches(provider, password)) ? provider : null;
}

function slugify(text: string): string {
  const base = text.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return base || "provider";
}

export type NewProvider = {
  name: string;
  type: ProviderType;
  email: string;
  phone: string;
  city: string;
  area: string;
  about: string;
  password: string;
  createdBy: "SELF" | "ADMIN";
  status: ApprovalStatus;
  services: ServiceDetails[];
};

/** Creates a provider. Returns null when the email is already registered. */
export async function createProvider(input: NewProvider): Promise<Provider | null> {
  const { salt, hash } = await hashPassword(input.password);
  return change((data) => {
    const email = input.email.trim().toLowerCase();
    if (data.providers.some((p) => p.email === email)) return null;
    let slug = slugify(input.name);
    if (data.providers.some((p) => p.slug === slug)) slug = `${slug}-${randomUUID().slice(0, 6)}`;
    const provider: Provider = {
      id: randomUUID(),
      slug,
      name: input.name.trim(),
      type: input.type,
      email,
      phone: input.phone.trim(),
      city: input.city.trim(),
      area: input.area.trim(),
      about: input.about.trim(),
      status: input.status,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      passwordSalt: salt,
      passwordHash: hash,
      services: input.services,
    };
    data.providers.push(provider);
    return provider;
  });
}

/** Changes one provider; the callback edits it in place. Returns the updated provider or null if unknown. */
export async function updateProvider(id: string, edit: (provider: Provider) => void): Promise<Provider | null> {
  return change((data) => {
    const provider = data.providers.find((p) => p.id === id);
    if (!provider) return null;
    edit(provider);
    return provider;
  });
}

// ---- administrator operations (admin-portal only) ---------------------------------------------------------

/** Removes a provider and ends its sessions. Returns false when there is no such provider. */
export async function deleteProvider(id: string): Promise<boolean> {
  return change((data) => {
    const before = data.providers.length;
    data.providers = data.providers.filter((p) => p.id !== id);
    data.sessions = data.sessions.filter((s) => s.providerId !== id);
    return data.providers.length < before;
  });
}

/** Sets a new password and signs the provider out everywhere. Returns false when there is no such provider. */
export async function setProviderPassword(id: string, password: string): Promise<boolean> {
  const { salt, hash } = await hashPassword(password);
  return change((data) => {
    const provider = data.providers.find((p) => p.id === id);
    if (!provider) return false;
    provider.passwordSalt = salt;
    provider.passwordHash = hash;
    data.sessions = data.sessions.filter((s) => s.providerId !== id);
    return true;
  });
}

/** The provider without its password hash, for pages and props. */
export type PublicProvider = Omit<Provider, "passwordSalt" | "passwordHash">;

export function toPublic(provider: Provider): PublicProvider {
  const { passwordSalt: _salt, passwordHash: _hash, ...rest } = provider;
  void _salt;
  void _hash;
  return rest;
}
