# EVNTGRID — Folder Structure (revision 2)

Root: the **project folder**, at any location (on the Desktop: `C:\Users\<you>\OneDrive\Desktop\EventGrid\EventGrid`). No path is fixed: the script detects the project folder from its own location (`<project folder>\scripts\utilities`) or takes `-Root`. This document replaces the first version. It applies three owner decisions (2026-11-09): one repository (CD-21), favourites and reviews deferred (CD-22), and an empty `stores/` folder with no client-state library (CD-23).

## 1. Principle

The folder script creates only folders and starter files that no generator needs. **Generators write directly into their final folders**, so nothing is copied, replaced or deleted (ADR-032).

| Who creates it | What |
|---|---|
| Folder script | Root files, `frontend/` and `backend/` (both empty except `frontend/README.md`), `infrastructure/`, `documentation/`, `scripts/` and their subfolders |
| Next.js generator (`create-next-app`) | `frontend/customer-web`, and later `frontend/provider-portal` and `frontend/admin-portal`, including `public/` and `src/app/` |
| You, after generation | The extra `src/` folders and `tests/` inside each application (snippet in `frontend/README.md`) |
| Spring Initializr ZIP | Everything inside `backend/` (`pom.xml`, `mvnw`, `.mvn`, `src/`) |
| You, as code arrives | Backend module packages |

## 2. Folders the script creates

```text
<project folder>
+--- .env.example
+--- .gitignore
+--- README.md
+--- backend\                     EMPTY. Spring Initializr ZIP is extracted here
+--- documentation\
|    +--- README.md
|    +--- 01-business\
|    +--- 02-product\customer\
|    +--- 03-architecture\        BACKEND_SETUP.md is created here
|    +--- 04-database\
|    +--- 05-design\
|    +--- 06-security\
|    +--- 07-workflows\
|    +--- 08-testing\
|    +--- 09-deployment\
|    \--- 10-project-management\
+--- frontend\                    README.md only. The three applications are NOT created
+--- infrastructure\
|    +--- README.md
|    +--- aws\
|    +--- docker\
|    +--- monitoring\
|    \--- terraform\
\--- scripts\
     +--- README.md
     +--- database\
     +--- development\
     \--- utilities\
```

Empty folders (except `backend` and `frontend`) hold a `.gitkeep` so Git keeps them. The script never creates `.gitkeep` in `frontend` or `backend`.

## 3. Folders left for the Next.js generator

Not created by the script. Each is generated with `create-next-app` directly into place (see `frontend/README.md`). **Done on 2026-11-11** with create-next-app 16.4.6 for all three, with the folders below added:

```text
frontend\customer-web\       MVP
frontend\provider-portal\    FUTURE (skeleton generated, requirements not written)
frontend\admin-portal\       FUTURE (skeleton generated, requirements not written)
```

After an application is generated, add these folders inside it:

```text
public\                      (generator)
src\app\                     (generator)
src\components\  src\features\  src\hooks\  src\lib\  src\providers\
src\stores\                  EMPTY. No client-state library is approved
src\types\  src\config\
tests\
```

`components/ui`, `lib/api/generated`, `lib/api/client.ts`, `lib/query` and `lib/server` appear when shadcn/ui and OpenAPI Generator are first used.

**customer-web feature folders (MVP):** home, categories, event-types, venues, vendors, search, filters, services, event-requirements, enquiries, quotations, bookings, notifications, profile, support.
**FUTURE / DEFERRED (not MVP), folders exist but stay empty:** favourites, reviews.
**provider-portal and admin-portal:** `src/features/` exists and stays empty until their requirements exist.

## 4. Folders left for Spring Initializr and for later

Inside `backend\`, from the ZIP: `pom.xml`, `mvnw`, `mvnw.cmd`, `.mvn\`, `.gitignore`, `.gitattributes`, `HELP.md`, `src\main\java\com\evntgrid\` (application class only), `src\main\resources\`, `src\test\java\com\evntgrid\`.

**Done on 2026-11-11:** Spring Boot 4.1.2, Java 25. The module folders exist with a `.gitkeep` and no Java classes. MVP modules, `administration` and the deferred `review` module have `api`, `application`, `domain` and `infrastructure`. Reserved modules (payment, commission, settlement, content) have only their root folder. `db\migration\catalog\` holds the first migrations (feature 1).

| Module | Status |
|---|---|
| shared (`kernel`, `error`, `audit`, `idempotency`) | MVP |
| identity, customer, provider, catalog, discovery, enquiry, quotation, booking, notification | MVP |
| administration | MVP if D-18 selects staff-operated provider handling |
| complaint | MVP, minimal: support-request intake only (ADR-030) |
| payment | Not in MVP. Design kept (D-24, U-10) |
| commission, settlement, content | Reserved |
| review | **FUTURE / DEFERRED** |

Flyway migrations go in `src\main\resources\db\migration\`, created with the first migration.

## 5. Package mapping

The earlier design named the packages `web`, `application`, `domain`, `persistence`, `integration` and `events`. The owner's structure maps onto it:

| Package | Holds |
|---|---|
| `api` | Controllers per API surface, request and response models |
| `application` | Use cases and transaction boundaries |
| `domain` | Entities, value objects, state rules |
| `infrastructure` | Spring Data repositories and external adapters |
| module root | Public service interfaces, public data records, published events |

Spring Modulith treats sub-packages as private to a module. A type other modules must call belongs in the module root, or in `api` exposed with `@NamedInterface`. Decide this when the first cross-module call is written.

## 6. One repository

One `.git` in the project folder and one root `.gitignore`. No nested repositories. The script never runs Git. Generators add their own `.gitignore` files inside each application; they are harmless. Applications still build and release independently through per-application pipelines (TA-14).

## 7. Open items

- Where Dockerfiles live (U-30).
- The CI/CD tool (TA-14). Terraform is named in the folder plan and is treated as the infrastructure-as-code choice.
- `infrastructure/aws` has no defined contents.
- Whether `api` is exposed with `@NamedInterface` for cross-module contracts.
- The Spring Initializr form values and dependency names were verified on 2026-11-11 (Spring Boot 4.1.2, Java 25). See `BACKEND_SETUP.md`.
