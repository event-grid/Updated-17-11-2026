# EVNTGRID — Pre-Implementation Review, Version 2

| | |
|---|---|
| **Date** | 2026-11-09 |
| **Replaces** | Review version 1 (before the owner's three decisions) |
| **Scope** | Folder blueprint, PowerShell script revision 2, architecture and requirements documents |
| **Rules** | No business requirement was changed. Statuses: RESOLVED, PARTIALLY RESOLVED, OPEN, NOT TESTED |

## 1. Verdict

The structure and the script are ready for a first run, starting with `-DryRun`. Work on business modules is still blocked by the open business decisions in section 5.

## 2. Previous findings (review version 1)

| # | Previous finding | Status | Evidence and what remains |
|---|---|---|---|
| 1 | Documents recommended four repositories; folder plan was one root | **RESOLVED** | CD-21 and ADR-027. `DEPLOYMENT_ARCHITECTURE.md`, `APPLICATION_ECOSYSTEM.md` (AR-15 superseded), root README. The CI/CD tool is still open (TA-14) |
| 2 | "Approved" was not recorded anywhere | **PARTIALLY RESOLVED** | The three owner decisions are now recorded (CD-21 to CD-23). D-01 to D-35, the unresolved rules and the 17 technology approvals are still open |
| 3 | Release labels contradicted the MVP scope (favourites, reviews, support, payment) | **PARTIALLY RESOLVED** | Favourites and reviews are labelled FUTURE / DEFERRED in 15 documents. Payment is labelled NOT IN MVP. Support is handled by finding N3 |
| 4 | Backend and frontend architecture documents out of date | **RESOLVED** | Package mapping, `backend/` path, frontend layout and `stores/` updated. Dockerfile location is now an explicit open item (U-30) |
| 5 | `stores/` implied an unapproved client-state library | **RESOLVED** | CD-23, ADR-029, frontend README and architecture. Folder stays empty |
| 6 | Backend generation steps had gaps (nested folder, OpenTelemetry) | **PARTIALLY RESOLVED** | Two-case extraction procedure written. OpenTelemetry is not added and is labelled. Initializr values are NOT TESTED because start.spring.io could not be opened |
| 7 | `.env.example` errors (bucket, queues, Razorpay comment) | **RESOLVED** | Three buckets, six queue and dead-letter queue placeholders, corrected Razorpay comments |
| 8 | `_scratch` instruction could delete user files | **RESOLVED** | The scratch folder, the copy tool and any deletion step are removed completely |
| 9 | Script only tested on PowerShell 7 on Linux | **NOT TESTED** | Still true for Windows PowerShell 5.1 and `D:\` |
| 10 | Minor points | **PARTIALLY RESOLVED** | `out/` rule narrowed. Symbolic links and junctions are now refused. `.vscode/` is still ignored (owner choice). `infrastructure/aws` still has no defined contents |

## 3. Requested review areas

| # | Area | Status | Notes |
|---|---|---|---|
| 1 | One-repository consistency | **RESOLVED** | One root `.git` and `.gitignore`, documented in root README, deployment and ecosystem documents. The generators add their own `.gitignore` files inside each application. Confirm you want to keep them |
| 2 | MVP versus deferred favourites and reviews | **RESOLVED** | Labelled in the MVP scope, features, journeys (J13 and the Mermaid flow), frontend, backend, database, API, data ownership, security, synchronization and gaps documents. No requirement text was removed |
| 3 | Listing reports and complaints | **PARTIALLY RESOLVED** | See N3 |
| 4 | Payment module consistency | **RESOLVED** | The MVP scope never proposed payments. The inconsistency was the backend document calling `payment` ACTIVE. It now says NOT IN MVP, design kept (ADR-031) |
| 5 | Empty `stores/` decision | **RESOLVED** | The folder is added after generation by the snippet in `frontend\README.md` |
| 6 | Frontend architecture versus folder blueprint | **RESOLVED** | One layout in both. Dockerfile location is U-30 (OPEN) |
| 7 | Backend architecture versus folder blueprint | **RESOLVED** | `api`, `application`, `domain`, `infrastructure` mapped. `@NamedInterface` exposure is still to be decided |
| 8 | Next.js generator destination safety | **PARTIALLY RESOLVED** | The script creates no application folder. In a Linux sandbox, `create-next-app` generated `customer-web` directly into `frontend\` beside the README, with no nested `.git`. NOT TESTED on Windows or with the interactive prompt |
| 9 | Spring Initializr extraction safety | **NOT TESTED** | The procedure handles both possible ZIP layouts, but the actual layout was never seen |
| 10 | `.env.example` consistency | **RESOLVED** | Placeholders only |
| 11 | Razorpay key ID and secrets | **RESOLVED** | Key ID marked public by design. Secret and webhook secret marked server-only |
| 12 | S3 buckets and dead-letter queues | **RESOLVED** | Three buckets and a dead-letter queue per queue. The queue list itself is illustrative and not final (OPEN) |
| 13 | Technology approvals and unresolved decisions | **OPEN** | 17 technology approvals. Terraform is treated as selected because the folder plan names it. CI/CD tool open |
| 14 | PowerShell 5.1 compatibility | **NOT TESTED** | Written to 5.1 syntax, but never run on 5.1 |
| 15 | Dry-run accuracy | **RESOLVED** | Dry run prints "would create". Planned and real counts matched in testing on PowerShell 7 (Linux) |
| 16 | Idempotency and no overwrite | **RESOLVED** on Linux, **NOT TESTED** on Windows | Second run created nothing. Planted files survived. Files are opened in create-only mode |
| 17 | Other issues | See section 4 | |

## 4. New findings in this revision

| # | Finding | Status |
|---|---|---|
| N1 | `DATA_OWNERSHIP.md` and `API_CONTRACT_STRATEGY.md` still named the old modules `audit`, `engagement` and `support` | **RESOLVED** (audit in `shared`, favourites in `customer`, support in `complaint`) |
| N2 | The brief said payment was active in the MVP scope. The scope actually proposes nothing for payment until D-24 | **RESOLVED**, noted for accuracy |
| N3 | The MVP includes "report an incorrect listing", but `complaint` was reserved with no entity or endpoint | **PARTIALLY RESOLVED.** ADR-030 proposes a minimal `complaint` module, one entity (`complaint.support_request`) and endpoints `POST /api/customer/v1/support-requests` and an admin read. This is provisional. D-32 (visitor submissions, who reads reports, replies) is open. No backend folder exists yet, by design |
| N4 | A `support` feature folder is in the customer-web list, which was not in your 16 features | **OPEN, please confirm.** It follows the MVP scope |
| N5 | The first `EventGrid.zip` and script revision 1 pre-create the application folders | **OPEN, user action.** Do not use them. If already used, see the execution instructions |
| N6 | Per-application `.gitignore` files written by generators sit beside the one root `.gitignore` | **OPEN, please confirm** |
| N7 | If the project folder is inside OneDrive (the owner now uses `C:\Users\deera\OneDrive\Desktop\EventGrid`), Windows may mark some folders as links and the script would refuse them | **NOT TESTED** |
| N8 | `administration` is an MVP module only if D-18 selects staff-operated provider handling | **OPEN** |

## 5. Decisions still needed

- **Technology approvals:** TA-01 to TA-17, in `ARCHITECTURE_DECISIONS.md`.
- **Before enquiries, quotations and bookings:** D-13 to D-16, D-19 to D-24, D-29.
- **Before provider, payment and settlement work:** U-02 to U-05, U-10, U-22, U-23.
- **Support:** D-32 (and confirm N4).
- **Layout:** U-30 (Dockerfile location), the CI/CD tool, and whether `api` is exposed with `@NamedInterface`.

## 6. Approval checklist

| Item | Status |
|---|---|
| Three frontends, one backend, one database, one repository | Approved by review |
| Script never overwrites, deletes, runs Git or generators | Approved by review (tested on Linux) |
| Favourites and reviews deferred and labelled | Approved by review |
| Script run on Windows PowerShell 5.1 with `-DryRun` | **Pending, by you** |
| Next.js generation on your machine | **Pending, by you** |
| Spring Initializr extraction on your machine | **Pending, by you** |
| N4 and N6 confirmed | **Pending, by you** |
| Business decisions and technology approvals | **Open** |
