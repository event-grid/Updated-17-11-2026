# EVNTGRID — Data Ownership

| | |
|---|---|
| **Status** | Architecture baseline for owner review |
| **Scope** | Who owns each kind of data. Entities are conceptual; this is not a schema. |
| **Labels** | CONFIRMED (`CD`), RECOMMENDED (`AR`), UNRESOLVED (`U`), defined in `APPLICATION_ECOSYSTEM.md` |

## 1. Rules

| # | Rule | Status |
|---|---|---|
| 1 | One PostgreSQL database holds all business data | CONFIRMED (CD-03) |
| 2 | No application holds a second copy of customer, provider or booking data | CONFIRMED (CD-05) |
| 3 | Frontends reach data only through backend APIs | CONFIRMED (CD-04) |
| 4 | Each table is owned by exactly one module, the only one that writes it | RECOMMENDED |
| 5 | Other modules read through the owner's interface or react to its events | RECOMMENDED |
| 6 | Each module has its own PostgreSQL schema within the one database (AR-05) | RECOMMENDED |

## 2. Ownership by module

| Module (schema) | Owns | Key references |
|---|---|---|
| Identity (`identity`) | User account, credential, role grant, customer profile | — |
| Provider (`provider`) | Provider organisation, provider type, approval status and history, membership, onboarding documents | User |
| Catalog (`catalog`) | Taxonomy (categories, event types, services, options), venue listing, service listing, publication state, venue service permission, food capability | Provider |
| Discovery (`discovery`) | Search and filter read models, all derived from Catalog | Catalog |
| Enquiry (`enquiry`) | Event plan, plan items, enquiry, enquiry recipient | User, Listing, Provider |
| Quotation (`quotation`) | Quotation, line items, acceptance record | Enquiry, Provider |
| Booking (`booking`) | Booking, booking items, agreed snapshot, availability records | Quotation, User, Provider |
| Payment (`payment`) | Razorpay order reference, payment, refund record, webhook receipts | Booking |
| Notification (`notification`) | Template, in-app notification, delivery attempt, preferences | User |
| Audit (recorded in `shared`, read through `administration`; ADR-004) | Audit record | Actor and target IDs |
| Administration (`administration`) | Operational notes and workflow items; no business record duplicates | Target IDs |
| Review (`review`), FUTURE / DEFERRED | Rating, review, moderation state | Booking, Provider |
| Favourite (in `customer`), FUTURE / DEFERRED | Favourite | User, Listing |
| Support request (`complaint`, MVP minimal) | Support request: contact or incorrect-listing report. Complaint handling later (U-24) | User, Listing |

The Spring Modulith event publication table is infrastructure and has its own schema.

Taxonomy content is seeded from `EVENT_CATEGORY_CATALOG.md`, using approved names (D-01). The three-way distinction between venue listing, provider organisation and user account means a venue owner is modelled without adding a role (U-06).

### Where the source rules live

| Rule | Data owner | Logic owner | How applications receive it |
|---|---|---|---|
| SR-1 automatic venue filters | Catalog (venue data) | Discovery | Applied in the backend; result reports applied filters |
| SR-2 owner does not allow a service | Catalog (venue service permission) | Catalog | Status and display text in API responses |
| SR-3 same or different food vendors | Catalog (capability), Enquiry (customer's choice) | Enquiry | Plan and enquiry APIs |

## 3. One record, three views

| Record | customer-web writes | provider-portal writes | admin-portal writes | Single owner |
|---|---|---|---|---|
| User account | Own | Own | Administrative changes, audited | Identity |
| Customer profile | Own | — | Support edits (U-03) | Identity |
| Provider organisation | — | Own, within status rules | Approval status | Provider |
| Listing | — | Own | Publication control (U-05) | Catalog |
| Venue service permission | — | Own | Support edits (U-03) | Catalog |
| Enquiry | Create | Respond state | — | Enquiry |
| Quotation | Accept, decline | Create | — | Quotation |
| Booking | Limited to agreed actions | Limited to agreed actions | Agreed interventions (U-08) | Booking |
| Payment | Start | — | Agreed interventions (U-10) | Payment |
| Audit record | — | — | — (system writes only) | Audit |

"Writes" means through an API that invokes the owning module's rules, never a direct table change.

**A person who is both a customer and a provider** has one user account with two role grants if U-12 is approved. Their customer data and business data remain in their own places, with nothing duplicated.

## 4. What is not a prohibited copy

Repetition is acceptable only in the categories below.

| Category | Examples | Rule |
|---|---|---|
| **Commercial snapshot** (AR-19) | Price and items on a quotation; the agreed items on a booking | Immutable record of what was offered or agreed. If a listing later changes, the agreement must not change |
| **Identity reference** | `provider_id` on a booking | ID only, not name or contact |
| **Derived read model** | Discovery search index; admin timeline projection, if needed | Rebuildable from the owner; never edited directly |
| **Cache** | Redis, CloudFront, Next.js cache | Expires; can be dropped without data loss |
| **Audit before/after** | Audit record | Historical evidence |

The test: *if this data were deleted, could it be rebuilt from its owner, or is it an intentional historical record?* Otherwise it is a prohibited copy.

## 5. Stores outside PostgreSQL

| Store | Holds | Authoritative? | If lost |
|---|---|---|---|
| Redis | Sessions, rate-limit counters, short-lived cache, OTP attempt state | Only for active sessions | Users sign in again; cache rebuilds |
| SQS | Messages pending delivery | No | Regenerated from incomplete event publications |
| S3 | Listing media and onboarding documents | Yes for file bytes; PostgreSQL holds metadata and ownership | Protected by versioning and backup |
| CloudFront | Cached public media and pages | No | Refills from origin |
| Razorpay | Its own payment records | Yes for the money movement | EVNTGRID reconciles against it |
| Browser | Display state | No | Refetch |

## 6. Cross-module rules

| Topic | Recommendation |
|---|---|
| JPA relationships | Within a module only. Across modules, store the ID |
| Database foreign keys | Allowed across schemas to stable anchors (user, provider, listing, enquiry, quotation, booking). CD-02 rules out microservices, so database integrity is worth more than theoretical separability |
| Queries | No SQL joins into another module's tables in application code, except in approved read models |
| Transactions | Cross-module work in one transaction is allowed where atomicity is a requirement (AR-06) |
| Search | PostgreSQL full-text and trigram search at launch (AR-14); trigrams help with spelling variants in the catalogue, such as mehandi and mehandhi |
| Reassessment of AR-14 | If relevance or volume outgrows PostgreSQL, a dedicated search engine can be fed as a derived read model |

## 7. Migrations (CD-15)

| Topic | Recommendation |
|---|---|
| Tool | Flyway, one history for the whole database |
| Organisation | Migration files grouped by module |
| Ownership | A module's team changes only its own schema |
| Version numbers | Global and timestamped, to avoid collisions |
| Compatibility | Expand-and-contract, because applications deploy independently (AR-16) |

## 8. Database access

| Principal | Access |
|---|---|
| Application role | Read and write on business schemas. Insert and read only on `audit` |
| Migration role | Schema changes; used only during deployment |
| Read-only role | Reporting and approved support, on a replica where possible |
| Frontends | None. No network route and no credentials |
| Human production access | Exceptional, time-limited, logged |

## 9. Sensitive data

| Class | Examples | Handling |
|---|---|---|
| Identity and contact | Name, phone, email | Field-level exposure controls (U-21); masked in logs |
| Provider verification | Identity and business documents | Private S3 bucket, short-lived signed access, every access audited |
| Payment | Razorpay references, status | Card data never enters EVNTGRID systems |
| Audit | Actor and network details | Administrator access only |

Retention, deletion and any restriction on data location are undecided, and need legal review (U-16, D-34). Deletion must take into account snapshots and audit evidence.

## 10. Decision status

| Status | Items |
|---|---|
| **CONFIRMED** | One database (CD-03); no copies (CD-05); access through backend (CD-04); Flyway and JPA (CD-15); controlled approval and publication (CD-11) |
| **RECOMMENDED** | Single-writer modules; per-module schemas (AR-05); snapshot rule (AR-19); PostgreSQL search (AR-14); expand-and-contract (AR-16); cross-schema anchors |
| **UNRESOLVED** | Multi-vendor structure (U-07); statuses (U-08); availability model (U-09); payment data scope (U-10); venue owner representation (U-06); dual role (U-12); publication (U-05); retention (U-16) |
