import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { ApiError, callApi, discoveryApi } from "@/lib/server/public-api";

import type { SearchOutcome } from "./types";

/**
 * Searches the catalogue. Results are the same for every visitor, so they are cached per query.
 * A query the backend rejects (422) becomes an "invalid" outcome with the backend's message.
 */
export async function searchCatalogue(query: string): Promise<SearchOutcome> {
  "use cache";
  cacheLife("minutes");
  cacheTag("catalog", "search");

  try {
    const response = await callApi(() => discoveryApi.search({ q: query }));
    return { kind: "results", response };
  } catch (error) {
    if (error instanceof ApiError && error.status === 422) {
      return { kind: "invalid", message: error.message };
    }
    throw error;
  }
}
