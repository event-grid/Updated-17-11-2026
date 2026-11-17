/**
 * Placeholder ("dummy") listings for every service of every event category.
 *
 * They exist so every service can be opened and clicked through while real vendors are still being onboarded.
 * Nothing here comes from the backend: the data is generated from the category and service, so it is identical
 * on every request, needs no database rows and is always shown with a "Demo" badge. Real, approved listings
 * (backend) appear on /services and the provider pages.
 */

export type DummyService = {
  code: string;
  name: string;
  options: string[];
  attributes: string[];
};

export type DummyPackage = {
  name: string;
  priceMinor: number;
  includes: string[];
};

export type DummyListing = {
  /** "d1" to "d6": the last part of the detail page address. */
  id: string;
  title: string;
  providerName: string;
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  fromPriceMinor: number;
  /** PER_GUEST for food and venues, FIXED for everything else (same meaning as the backend's price unit). */
  priceUnit: "FIXED" | "PER_GUEST";
  about: string;
  highlights: string[];
  packages: DummyPackage[];
};

export const DUMMY_LISTING_COUNT = 6;

const CITIES: [string, string][] = [
  ["Bengaluru", "Indiranagar"],
  ["Bengaluru", "Jayanagar"],
  ["Mysuru", "Vijayanagar"],
  ["Hyderabad", "Banjara Hills"],
  ["Chennai", "Adyar"],
  ["Mumbai", "Andheri"],
  ["Pune", "Koregaon Park"],
  ["Kochi", "Edappally"],
];

const PREFIXES = ["Lotus", "Saffron", "Royal", "Marigold", "Silver Oak", "Indigo", "Velvet", "Jasmine", "Monsoon", "Golden Hour"];

const TIERS = ["Essential", "Signature", "Grand"];

/** A stable number from text (FNV-1a), so the same service always produces the same dummies. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** "Wearables [Rental]" -> "Wearables"; "Gifts (optional)" -> "Gifts". */
function baseName(name: string): string {
  return name.replace(/\[.*?\]|\(.*?\)/g, "").replace(/\s+/g, " ").trim();
}

function isPerGuest(service: DummyService): boolean {
  return /food|cater|venue|snack|bakery|chat/i.test(`${service.code} ${service.name}`);
}

function build(categorySlug: string, service: DummyService, index: number): DummyListing {
  const seed = hash(`${categorySlug}/${service.code}/${index}`);
  const base = baseName(service.name);
  const [city, area] = CITIES[seed % CITIES.length];
  const prefix = PREFIXES[(seed >>> 3) % PREFIXES.length];
  const perGuest = isPerGuest(service);

  // Rupees: per-guest services cost a few hundred, the others a few thousand to a lakh.
  const baseRupees = perGuest ? 250 + ((seed >>> 5) % 18) * 50 : 4000 + ((seed >>> 5) % 40) * 2500;
  const fromPriceMinor = baseRupees * 100;

  const options = service.options.length > 0 ? service.options : [base];
  const attributes = service.attributes.length > 0 ? service.attributes : ["Free consultation", "Travel within the city"];

  return {
    id: `d${index + 1}`,
    title: `${prefix} ${base}`,
    providerName: `${prefix} ${base} Studio`,
    city,
    area,
    rating: Math.round((40 + ((seed >>> 9) % 10)) ) / 10,
    reviewCount: 12 + ((seed >>> 11) % 180),
    fromPriceMinor,
    priceUnit: perGuest ? "PER_GUEST" : "FIXED",
    about: `Demo listing. ${prefix} ${base} is a placeholder vendor in ${city} used to show how a ${base.toLowerCase()} listing will look. Real vendors replace these once they are approved.`,
    highlights: [...options.slice(0, 4), ...attributes.slice(0, 2)],
    packages: TIERS.map((tier, i) => ({
      name: `${tier} ${base}`,
      priceMinor: Math.round((baseRupees * (1 + i * 0.75)) / 50) * 50 * 100,
      includes: [
        ...options.slice(0, i + 1).map((o) => o.charAt(0).toUpperCase() + o.slice(1)),
        i === 2 ? "Dedicated coordinator on the day" : i === 1 ? "One planning call" : "Email support",
      ],
    })),
  };
}

/** The six placeholder listings of one service. */
export function dummyListings(categorySlug: string, service: DummyService): DummyListing[] {
  return Array.from({ length: DUMMY_LISTING_COUNT }, (_, i) => build(categorySlug, service, i));
}

/** One placeholder listing by its id ("d1" to "d6"), or `null` for any other id. */
export function dummyListing(categorySlug: string, service: DummyService, id: string): DummyListing | null {
  const match = /^d([1-9])$/.exec(id);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return index < DUMMY_LISTING_COUNT ? build(categorySlug, service, index) : null;
}
