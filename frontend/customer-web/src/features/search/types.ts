/**
 * Search types, generated from the backend contract (backend/openapi/public-v1.json).
 * Titles and options are verbatim catalogue wording.
 */
import type { SearchResponse } from "@/lib/api/generated/public";

export type {
  SearchResponse,
  SearchResultItem,
  SearchResultItemTypeEnum as SearchResultType,
} from "@/lib/api/generated/public";

export type SearchOutcome =
  | { kind: "results"; response: SearchResponse }
  | { kind: "invalid"; message: string };
