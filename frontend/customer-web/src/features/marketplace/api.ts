import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import type {
  ListingPage,
  Location,
  ProviderDetail,
  VenueDetail,
  VenuePage,
  VenueType,
} from "@/lib/api/generated/public";
import { ApiError, callApi, callApiOrNull, marketplaceApi } from "@/lib/server/public-api";

import type { ListingQuery, VenueQuery } from "./search-params";

/**
 * Public marketplace reads. The same for every visitor, so cached for a few minutes (listings change more often
 * than the catalogue). Tag "marketplace" allows on-demand revalidation when providers publish changes.
 */

export async function getVenueTypes(): Promise<VenueType[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("marketplace");
  return callApi(() => marketplaceApi.listVenueTypes());
}

export async function getLocations(): Promise<Location[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("marketplace");
  return callApi(() => marketplaceApi.listLocations());
}

export type Outcome<T> = { kind: "ok"; data: T } | { kind: "invalid"; message: string };

/** A filter the backend rejects (422) becomes an "invalid" outcome with its message instead of an error page. */
async function outcome<T>(call: () => Promise<T>): Promise<Outcome<T>> {
  try {
    return { kind: "ok", data: await callApi(call) };
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return { kind: "invalid", message: error.message };
    }
    throw error;
  }
}

export async function searchVenues(query: VenueQuery): Promise<Outcome<VenuePage>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("marketplace");
  return outcome(() => marketplaceApi.searchVenues(query));
}

export async function searchListings(query: ListingQuery): Promise<Outcome<ListingPage>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("marketplace");
  return outcome(() => marketplaceApi.searchListings(query));
}

export async function getVenue(slug: string): Promise<VenueDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("marketplace", `venue:${slug}`);
  return callApiOrNull(() => marketplaceApi.getVenue({ slug }));
}

export async function getProvider(slug: string): Promise<ProviderDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("marketplace", `provider:${slug}`);
  return callApiOrNull(() => marketplaceApi.getProvider({ slug }));
}
