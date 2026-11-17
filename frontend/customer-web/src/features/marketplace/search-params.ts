/**
 * URL search parameters of /venues and /services, parsed into the API query. Filters live in the URL so results
 * are shareable, work without JavaScript and survive a refresh. Unknown or malformed values are dropped.
 */

type Raw = Record<string, string | string[] | undefined>;

export type VenueQuery = {
  q?: string;
  city?: string;
  type?: string;
  guests?: number;
  maxPrice?: number;
  category?: string;
  sort?: string;
  page?: number;
};

export type ListingQuery = {
  q?: string;
  category?: string;
  service?: string;
  city?: string;
  food?: string;
  maxPrice?: number;
  venue?: string;
  sort?: string;
  page?: number;
};

function text(raw: Raw, key: string, max = 80): string | undefined {
  const value = Array.isArray(raw[key]) ? raw[key][0] : raw[key];
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function positive(raw: Raw, key: string): number | undefined {
  const value = text(raw, key, 12);
  if (!value || !/^\d+$/.test(value)) return undefined;
  const n = Number(value);
  return n >= 1 ? n : undefined;
}

export function parseVenueQuery(raw: Raw): VenueQuery {
  return {
    q: text(raw, "q"),
    city: text(raw, "city"),
    type: text(raw, "type"),
    guests: positive(raw, "guests"),
    maxPrice: positive(raw, "maxPrice"),
    category: text(raw, "category"),
    sort: text(raw, "sort"),
    page: positive(raw, "page"),
  };
}

export function parseListingQuery(raw: Raw): ListingQuery {
  const food = text(raw, "food");
  return {
    q: text(raw, "q"),
    category: text(raw, "category"),
    service: text(raw, "service"),
    city: text(raw, "city"),
    food: food === "VEG" || food === "NON_VEG" ? food : undefined,
    maxPrice: positive(raw, "maxPrice"),
    venue: text(raw, "venue"),
    sort: text(raw, "sort"),
    page: positive(raw, "page"),
  };
}

/** The same path with one parameter changed (or removed when `value` is undefined); resets the page. */
export function withParam(path: string, query: Record<string, string | number | undefined>, key: string, value?: string | number) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...query, [key]: value })) {
    if (v !== undefined && v !== "" && (k !== "page" || key === "page")) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** Active filters as removable chips. */
export function activeFilters(query: Record<string, string | number | undefined>, labels: Record<string, string>) {
  return Object.entries(query)
    .filter(([k, v]) => v !== undefined && k !== "page" && k !== "sort" && labels[k])
    .map(([k, v]) => ({ key: k, label: `${labels[k]}: ${v}` }));
}
