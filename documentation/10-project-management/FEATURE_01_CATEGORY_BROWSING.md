# Feature 1 — Category Browsing

| | |
|---|---|
| **Date** | 2026-11-11 |
| **Release** | R1 (MVP) |
| **Scope** | Customer can browse the 12 event categories and see each category's event types, subcategories, services, options and attributes |
| **Source** | `01-business/EVENT_CATEGORY_CATALOG.md`; `02-product/customer/CUSTOMER_MVP_SCOPE.md` (Catalogue, Homepage, Browsing) |
| **Status** | Implemented. Web-layer and module tests pass. Database integration test written; it needs Docker to run |

## 1. What was built

| Layer | Item | Location |
|---|---|---|
| Database | `catalog` schema: `event_category`, `event_subcategory`, `service`, `category_service`, `service_option` | `backend/src/main/resources/db/migration/catalog/V2026_11_11_1__catalog_create_taxonomy.sql` |
| Database | Seed of the whole source catalogue, verbatim | `.../V2026_11_11_2__catalog_seed_taxonomy.sql` |
| Backend | `catalog` module: entities (`domain`), repositories (`infrastructure`), `CategoryBrowsing` use cases (`application`), public controller (`api`) | `backend/src/main/java/com/evntgrid/catalog/` |
| Backend | Problem Details errors with `code` and `correlationId`; `X-Correlation-Id` on every response | `shared/error`, `shared/kernel` |
| Backend | Security: public surface is GET only; every other path denied until sign-in exists | `identity/infrastructure/WebSecurityConfiguration.java` |
| API | `GET /api/public/v1/categories`, `GET /api/public/v1/categories/{slug}` (provisional, API_DESIGN.md section 6) | |
| Frontend | Home page with category entry points; `/categories`; `/categories/[slug]` | `frontend/customer-web/src/app/` |
| Frontend | Feature folders used: `home`, `categories`, `event-types`, `services` | `frontend/customer-web/src/features/` |
| Local services | PostgreSQL 18 and Redis for development | `infrastructure/docker/compose.yaml` |

## 2. Tests

| Test | What it checks | Needs Docker |
|---|---|---|
| `ModularityTests` | Spring Modulith: no undeclared module dependency or cycle | No |
| `PublicCategoryControllerTests` (5) | JSON shape, cache header, 404 Problem Details, correlation ID, malformed slug, writes denied | No |
| `CatalogBrowsingIntegrationTests` (4) | Migrations on PostgreSQL 18; seed totals match catalogue section 8 (12 / 12 / 12 / 46, one rental, one optional); API end to end | **Yes, not yet run** |

The customer website passes lint, the TypeScript check and a production build. The build was checked against a temporary stand-in for the API, because Docker was not installed.

## 3. Choices made while building (please confirm)

| # | Choice | Why | Related decision |
|---|---|---|---|
| F1-1 | Category `code` is the URL slug, from the working name (for example `weddings-and-reception`) | The API design addresses categories by slug; no separate column needed | D-01 |
| F1-2 | `display_name` of categories = working names from the owner's brief; all other display names = verbatim source text | Names are not changed until D-01 | D-01 |
| F1-3 | Services that differ only in capitalisation share one `service` row (`Pandal System` / `Pandal system`). Each category keeps its own verbatim wording | Avoids two identical codes; nothing with different words is merged | D-12, ADR-017 |
| F1-4 | Service names are shown as written, including `[Rental]` and `(optional)`; the flags are also returned for logic | Source wording is shown verbatim | D-10 |
| F1-5 | Options vs attributes: Cost, Type and Customised are attributes; everything else after a dash or colon is an option | Assumption A-04 | D-11 |
| F1-6 | Surprise Events shows "No event types or services are listed for this category yet." | Source has no section for it | D-02 |
| F1-7 | Event types are shown but do not filter services | Whether Sub Types change services is undecided | D-08 |
| F1-8 | Homepage heading and intro text are placeholders | No content decision yet | D-30, U-25 |

## 4. Known limitations

- **Frontend build needs the API.** Pages are prerendered from the API at build time, so the backend must be reachable when `npm run build` runs. This matches the release order (backend first, then frontends).
- **Unknown category URLs** show the not-found page with a `noindex` tag but HTTP status 200. Next.js 16 with Cache Components streams the result, and `dynamicParams` is not available. All 12 real categories are prerendered.
- **Hand-written API client.** `lib/server/public-api.ts` and `features/categories/types.ts` stand in for the OpenAPI Generator client until the endpoints are Stable. springdoc-openapi is not added yet.
- **No subcategory or service detail pages** yet (`/categories/[slug]/[sub]`, `/services/[id]`): blocked by D-08 and D-11.
