/**
 * DEVELOPMENT PROTOTYPE STORE for website-wide settings that an administrator controls: the announcement bar,
 * the footer's social links and the contact details. admin-portal writes them; customer-web reads them from the same
 * file (`frontend/.demo-data/site-settings.json`). Replace with backend endpoints when they exist. This file is
 * copied identically into admin-portal and customer-web (the applications share no code).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type SiteSettings = {
  announcement: { enabled: boolean; text: string };
  social: { instagram: string; facebook: string; youtube: string; x: string };
  contact: { email: string; phone: string; address: string };
  /** Which pages of the website are shown. A page that is switched off disappears from the menus and answers "not found". */
  sections: Record<SectionKey, boolean>;
};

export const SECTION_KEYS = ["venues", "services", "vendors", "howItWorks"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  venues: "Venues",
  services: "Services",
  vendors: "Vendors",
  howItWorks: "How it works",
};

/** The sections an administrator has switched off. */
export function hiddenSections(settings: SiteSettings): SectionKey[] {
  return SECTION_KEYS.filter((key) => !settings.sections[key]);
}

export const DEFAULT_SETTINGS: SiteSettings = {
  announcement: { enabled: true, text: "One platform, every celebration." },
  social: { instagram: "", facebook: "", youtube: "", x: "" },
  contact: { email: "", phone: "", address: "" },
  sections: { venues: true, services: true, vendors: true, howItWorks: true },
};

const FILE = path.resolve(process.cwd(), "..", ".demo-data", "site-settings.json");

/** Fills anything missing or of the wrong type from the defaults, so a half-written file never breaks a page. */
function normalise(raw: unknown): SiteSettings {
  const r = (raw ?? {}) as Partial<Record<keyof SiteSettings, Record<string, unknown>>>;
  const text = (value: unknown, fallback: string) => (typeof value === "string" ? value : fallback);
  return {
    announcement: {
      enabled: typeof r.announcement?.enabled === "boolean" ? r.announcement.enabled : DEFAULT_SETTINGS.announcement.enabled,
      text: text(r.announcement?.text, DEFAULT_SETTINGS.announcement.text),
    },
    social: {
      instagram: text(r.social?.instagram, ""),
      facebook: text(r.social?.facebook, ""),
      youtube: text(r.social?.youtube, ""),
      x: text(r.social?.x, ""),
    },
    contact: {
      email: text(r.contact?.email, ""),
      phone: text(r.contact?.phone, ""),
      address: text(r.contact?.address, ""),
    },
    sections: Object.fromEntries(
      SECTION_KEYS.map((key) => [key, typeof (raw as { sections?: Record<string, unknown> } | null)?.sections?.[key] === "boolean" ? ((raw as { sections: Record<string, boolean> }).sections[key]) : true]),
    ) as Record<SectionKey, boolean>,
  };
}

export async function readSettings(): Promise<SiteSettings> {
  try {
    return normalise(JSON.parse(await fs.readFile(FILE, "utf8")));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function writeSettings(settings: SiteSettings): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const temp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(normalise(settings), null, 2), "utf8");
  await fs.rename(temp, FILE);
}

/** Only web addresses (http or https) are accepted as social links; anything else is dropped. */
export function cleanUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
