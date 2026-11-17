import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { callApi, callApiOrNull, catalogApi } from "@/lib/server/public-api";

import type { CategoryDetail, CategorySummary } from "./types";

/**
 * The catalogue is the same for every visitor and changes rarely, so results are cached
 * and become part of the prerendered pages. Tag "catalog" allows on-demand revalidation later.
 */

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const list = await callApi(() => catalogApi.listCategories());
  return list.items;
}

/** One category, or `null` if no category has this slug. */
export async function getCategory(slug: string): Promise<CategoryDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog", `catalog:category:${slug}`);

  return callApiOrNull(() => catalogApi.getCategory({ slug }));
}
