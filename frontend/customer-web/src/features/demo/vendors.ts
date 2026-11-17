import "server-only";

import { getCategories, getCategory } from "@/features/categories/api";

import { dummyListing, dummyListings, type DummyListing } from "./dummy-listings";

/**
 * The demo vendors (providers): one for every demo listing of every service, so everyone shown on a service's page
 * also has a profile on the Providers page. Generated from the catalogue, like the listings themselves, so the list
 * is always complete and never stored anywhere. Always shown with a "Demo" badge.
 */
export type DummyVendor = {
  /** "demo~<category>~<service>~<id>": unique, URL-safe, and tells the profile page which listing to rebuild. */
  slug: string;
  name: string;
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  categorySlug: string;
  categoryName: string;
  serviceCode: string;
  serviceName: string;
  listingId: string;
  fromPriceMinor: number;
  priceUnit: "FIXED" | "PER_GUEST";
};

export const DEMO_VENDOR_PREFIX = "demo~";

export const vendorSlug = (categorySlug: string, serviceCode: string, listingId: string) =>
  `${DEMO_VENDOR_PREFIX}${categorySlug}~${serviceCode}~${listingId}`;

export function parseVendorSlug(slug: string): { categorySlug: string; serviceCode: string; listingId: string } | null {
  if (!slug.startsWith(DEMO_VENDOR_PREFIX)) return null;
  const [categorySlug, serviceCode, listingId, ...rest] = slug.slice(DEMO_VENDOR_PREFIX.length).split("~");
  return categorySlug && serviceCode && listingId && rest.length === 0 ? { categorySlug, serviceCode, listingId } : null;
}

function toVendor(categorySlug: string, categoryName: string, serviceCode: string, serviceName: string, l: DummyListing): DummyVendor {
  return {
    slug: vendorSlug(categorySlug, serviceCode, l.id),
    name: l.providerName,
    city: l.city,
    area: l.area,
    rating: l.rating,
    reviewCount: l.reviewCount,
    categorySlug,
    categoryName,
    serviceCode,
    serviceName,
    listingId: l.id,
    fromPriceMinor: l.fromPriceMinor,
    priceUnit: l.priceUnit,
  };
}

/** Every demo vendor, in catalogue order (category, then service, then listing). */
export async function allDummyVendors(): Promise<DummyVendor[]> {
  const categories = await getCategories();
  const details = await Promise.all(categories.map((c) => getCategory(c.slug)));
  return details.flatMap((category) =>
    !category
      ? []
      : category.services.flatMap((service) =>
          dummyListings(category.slug, service).map((l) => toVendor(category.slug, category.name, service.code, service.name, l)),
        ),
  );
}

/** One demo vendor with its full listing, or `null` when the address does not name one. */
export async function dummyVendorBySlug(
  slug: string,
): Promise<{ vendor: DummyVendor; listing: DummyListing; options: string[] } | null> {
  const parsed = parseVendorSlug(slug);
  if (!parsed) return null;
  const category = await getCategory(parsed.categorySlug);
  const service = category?.services.find((s) => s.code === parsed.serviceCode);
  if (!category || !service) return null;
  const listing = dummyListing(category.slug, service, parsed.listingId);
  return listing
    ? { vendor: toVendor(category.slug, category.name, service.code, service.name, listing), listing, options: service.options }
    : null;
}
