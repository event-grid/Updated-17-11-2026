import type { ServiceDetails } from "./store";

/**
 * The event categories and services providers can offer, read from the backend's public catalogue
 * (the same catalogue customers browse). Server-side only.
 */
export type CatalogueService = { code: string; name: string; options: string[]; attributes: string[] };
export type CatalogueCategory = { slug: string; name: string; services: CatalogueService[] };

const API = process.env.EVNTGRID_API_BASE_URL ?? "http://localhost:8080";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}/api/public/v1${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`The catalogue could not be loaded (${response.status}).`);
  return (await response.json()) as T;
}

export async function loadCatalogue(): Promise<CatalogueCategory[]> {
  const list = await getJson<{ items: { slug: string; name: string }[] }>("/categories");
  const details = await Promise.all(
    list.items.map((c) => getJson<{ slug: string; name: string; services: CatalogueService[] }>(`/categories/${c.slug}`)),
  );
  return details
    .map((d) => ({ slug: d.slug, name: d.name, services: d.services }))
    .filter((c) => c.services.length > 0);
}

export const serviceKey = (categorySlug: string, serviceCode: string) => `${categorySlug}:${serviceCode}`;

/** Names carry source markers such as "[Rental]"; keep them (they are the catalogue's wording). */
export function emptyDetails(category: CatalogueCategory, service: CatalogueService): ServiceDetails {
  return {
    key: serviceKey(category.slug, service.code),
    categorySlug: category.slug,
    categoryName: category.name,
    serviceCode: service.code,
    serviceName: service.name,
    options: [],
    attributes: {},
    startingPriceRupees: null,
    priceUnit: /food|cater|venue/i.test(`${service.code} ${service.name}`) ? "PER_GUEST" : "FIXED",
    description: "",
    packages: [],
    completed: false,
  };
}

/**
 * The service list for a set of selected keys: services already on the provider keep their details, new ones
 * start empty, unselected ones are dropped. Keys that are not in the catalogue are ignored.
 */
export function applySelection(
  selected: string[],
  catalogue: CatalogueCategory[],
  existing: ServiceDetails[] = [],
): ServiceDetails[] {
  const kept = new Map(existing.map((s) => [s.key, s]));
  const result: ServiceDetails[] = [];
  const wanted = new Set(selected);
  for (const category of catalogue) {
    for (const service of category.services) {
      const key = serviceKey(category.slug, service.code);
      if (!wanted.has(key)) continue;
      result.push(kept.get(key) ?? emptyDetails(category, service));
    }
  }
  return result;
}
