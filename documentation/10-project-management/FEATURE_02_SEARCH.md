# Feature 2 — Search

| | |
|---|---|
| **Date** | 2026-11-11 |
| **Release** | R1 (MVP) |
| **Requirement** | SRC-02 (`CUSTOMER_FEATURES.md`): keyword search. Scope today: categories, event types, subcategories and services (with their options). Venues and vendors join when those features exist |
| **Status** | Implemented. 20 tests without a database pass; the database integration test is written and needs Docker. Verified by hand against local PostgreSQL 18 |

## 1. What was built

| Layer | Item | Location |
|---|---|---|
| Catalog | Public interface `CatalogTaxonomy` (module root): read-only snapshot of the whole taxonomy, so other modules never read catalog tables | `catalog/CatalogTaxonomy.java`, `catalog/application/CatalogTaxonomyService.java` |
| Database | `discovery.search_entry`: derived read model with a generated `tsvector` and a GIN index | `db/migration/discovery/V2026_11_11_4__discovery_create_search_index.sql` |
| Backend | `discovery` module: `SearchQuery` (parsing), `SearchIndexer` (rebuild at startup, advisory-locked), `Searching` (use case), `PublicSearchController` | `backend/src/main/java/com/evntgrid/discovery/` |
| Backend | 422 `VALIDATION_FAILED` with `fieldErrors` | `shared/error/ValidationFailedException.java` |
| API | `GET /api/public/v1/search?q=` → `{ query, words, total, items[] }`; items ordered categories → event types/subcategories → services | |
| Frontend | Search box in the header (every page); `/search` page with grouped, highlighted results and a no-results state | `frontend/customer-web/src/features/search/`, `src/app/search/page.tsx` |

## 2. How matching works

- PostgreSQL full-text search (AR-14) with the `simple` configuration: no English stemming, so Indian terms (mehandi, choultry, pandal) match as written.
- Every word is a **prefix** ("wed" finds Weddings) and **all** words must match ("destination weddings" → one result).
- A category is also found by its source names ("catering" → Food and Catering). A service is found by its options ("mehandi" → Makeup).
- Input: 2–100 characters, at most 8 words. Only letters, digits and combining marks are kept, so user input can never inject search operators. Indian scripts work (vowel signs are combining marks).
- At most 60 results per query.

## 3. Tests

| Test | Checks | Docker |
|---|---|---|
| `SearchQueryTests` (6) | Prefix query, operator stripping, Indian scripts, limits | No |
| `SearchIndexerTests` (5) | Taxonomy → index entries; source names and options are searchable | No |
| `PublicSearchControllerTests` (3) | JSON shape, cache header, 422 with field error, 400 when `q` is missing | No |
| `ModularityTests` | `discovery` uses only `catalog`'s public interface | No |
| `SearchIntegrationTests` (6) | 82 index entries; real queries on PostgreSQL 18 | **Yes, not yet run** |

## 4. Open points

| # | Point | Decision |
|---|---|---|
| F2-1 | **Spelling tolerance is off.** "mehandi" does not find Baby Shower's "Mehandhi"; small typos return nothing. Enabling `pg_trgm` fixes this without rework | **TA-15**, waiting for approval |
| F2-2 | The index is rebuilt at startup only; the catalogue changes only through migrations today. When admin taxonomy editing arrives, catalog publishes an event and the index rebuilds on it | With admin taxonomy (D-01) |
| F2-3 | Every result opens its category page; service and subcategory pages do not exist yet | D-08, D-11 |
| F2-4 | Search by location (SRC-03) | D-30 |
