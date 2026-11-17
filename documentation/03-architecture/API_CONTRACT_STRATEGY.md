# EVNTGRID — API Contract Strategy

| | |
|---|---|
| **Status** | Architecture baseline for owner review |
| **Labels** | CONFIRMED (`CD`), RECOMMENDED (`AR`), UNRESOLVED (`U`), defined in `APPLICATION_ECOSYSTEM.md` |

## 1. Principles

1. REST contracts are documented, and they are the only interface between frontends and backend (CD-04, CD-09).
2. Each application gets a contract shaped for its audience, not one generic API.
3. Business rules are expressed by the backend. Frontends follow what the contract tells them (CD-08).
4. TypeScript clients are generated from OpenAPI once an API is ready. They are never written by hand (CD-09).
5. A breaking contract change cannot reach production unnoticed (AR-11).

## 2. API surfaces (AR-03)

| Surface | Base path | Used by | Authentication | Exposed on |
|---|---|---|---|---|
| Public | `/api/public/v1` | customer-web | None | www |
| Customer | `/api/customer/v1` | customer-web | Customer session | www |
| Provider | `/api/provider/v1` | provider-portal | Provider session | partner |
| Admin | `/api/admin/v1` | admin-portal | Administrator session | admin |
| Webhooks | `/webhooks/razorpay` | Razorpay only | Signature | Dedicated host (see `DEPLOYMENT_ARCHITECTURE.md`) |

**Why separate surfaces rather than one API with role checks**

- The same record needs different fields per audience. A provider's view of an enquiry differs from an admin's.
- Each surface has its own OpenAPI document and client, so an admin operation cannot appear in the customer client.
- Each surface has its own security configuration.
- Each frontend can release against its own contract at its own pace.

Separate surfaces call the **same** module services. Business logic is not repeated per surface.

## 3. Contract workflow (AR-11)

| Stage | What happens |
|---|---|
| Design | For significant features, the request and response shapes are agreed before implementation and reviewed with frontend developers |
| Implement | Controllers define the API. springdoc-openapi (v3 for Spring Boot 4) generates one document per surface |
| Publish | CI generates the OpenAPI documents and commits or publishes them as versioned artifacts |
| Check | CI lints each document and compares it with the last released one. A breaking change fails the build |
| Consume | Each frontend generates its client from the released contract for its surface |
| Verify | Backend contract tests confirm responses match the documents |

**Code-first with review** is recommended over full specification-first, since it keeps the contract and implementation together for a single backend team. It is compatible with mocking from an agreed draft when frontend work has to start early.

### When clients are generated

CD-09 says clients are generated when the API is ready. "Ready" is defined per surface and per feature:

| Status | Meaning | Frontend action |
|---|---|---|
| Draft | Shape agreed, may change | May build against a mock |
| Stable | Implemented, contract tested, published | Generate client and integrate |
| Deprecated | Replacement exists, with removal date | Migrate |

The generator is undecided (U-14). A selection should favour plain TypeScript types with a small runtime, such as `openapi-typescript` with `openapi-fetch`.

## 4. Conventions

### Resources and methods

| Topic | Convention |
|---|---|
| URLs | Lower-case plural nouns, for example `/enquiries/{id}/quotations` |
| Reads | `GET`, with no side effects |
| Create | `POST`, returns 201 |
| Partial update | `PATCH` |
| Business actions | Explicit sub-resources, such as `POST /quotations/{id}/acceptance`; no generic "set status" field |
| IDs | Non-sequential string identifiers |

### Data formats

| Type | Rule |
|---|---|
| JSON field names | camelCase |
| Money | Integer in minor units with currency code. Razorpay also works in the smallest currency unit |
| Instants | ISO 8601 in UTC |
| Event dates | Calendar date with no time zone, so an event date cannot shift |
| Enumerations | Documented. Clients must tolerate new values |
| Status | Returned by the backend, as code and customer-appropriate label |

### Errors

All errors use RFC 9457 Problem Details, which Spring supports directly.

| Status | Use |
|---|---|
| 400 | Malformed request |
| 401 | No valid session |
| 403 | Authenticated but not permitted |
| 404 | Not found, or not the caller's record |
| 409 | Conflict with current state, such as a stale version or duplicate action |
| 422 | Business rule rejected, with a stable machine-readable `code` |
| 429 | Rate limited |

Frontends act on the stable `code`, not on message text.

### Lists

Lists use cursor pagination where data changes often, with an explicit maximum page size. Sorting and filter parameters are declared per endpoint.

### Concurrency

Mutable records return a version as an `ETag`. Updates send `If-Match`. A stale update returns 409.

### Idempotency

Create and action requests accept an `Idempotency-Key` header, required for enquiry submission, quotation sending, acceptance and payment initiation. Keys are scoped to the user and operation. A retry returns the original result.

### Allowed actions (AR-18)

This is how rules stay out of frontend code. Responses include what the caller may do now:

| Field | Example values |
|---|---|
| `allowedActions` | `ACCEPT`, `DECLINE`, `REQUEST_REVISION` |

A frontend shows a button only if the action is listed. The backend still checks every action when it is called. The source rule SR-2 follows the same pattern: the API returns each service's status and display text for the venue, and the frontend renders it without deciding it. SR-1 is applied by Discovery on the backend, and the response reports which filters were applied automatically.

### Correlation

Every request gets a correlation ID that appears in logs, events, audit records and error responses.

## 5. Versioning

| Topic | Rule |
|---|---|
| Major version | In the URL path per surface; surfaces version independently |
| Additive changes | Add optional fields or endpoints with no version change |
| Breaking changes | New version, with the old one supported for a defined overlap |
| Deprecation | Marked in the contract, with `Deprecation` and `Sunset` response headers |
| Deployment | Backend is deployed first and stays compatible with the frontend versions currently live |

Spring Framework 7 has built-in API versioning support, which may implement the path scheme.

## 6. Provisional resource inventory

This shows which surface owns what. Final endpoints are defined feature by feature, and items under an unresolved decision may change.

| Area | Public | Customer | Provider | Admin | Module |
|---|---|---|---|---|---|
| Catalogue and taxonomy | Read | — | Read | Manage | Catalog |
| Search and filters (SR-1) | Read | — | — | Read | Discovery |
| Venue and service listings | Read published | — | Manage own | Moderate | Catalog |
| Venue service permissions (SR-2) | Read | — | Manage own | Support | Catalog |
| Session and account | Sign-in | Manage own | Manage own | Manage own | Identity |
| Provider onboarding and status | — | — | Own | Approve, reject | Provider |
| Event plans | — | Own | — | Read | Enquiry |
| Enquiries | — | Create, own | Addressed to it | Monitor | Enquiry |
| Quotations | — | Received, accept, decline | Create, own | Monitor | Quotation |
| Bookings | — | Own | Own | Monitor | Booking |
| Availability (U-09) | Possibly read | Read | Manage own | Read | Booking |
| Payments (U-10) | — | Start, status | Summary | Monitor | Payment |
| Notifications | — | Own | Own | Own | Notification |
| Reviews (FUTURE / DEFERRED, D-28) | Read | Create | Own, reply if allowed | Moderate | Review |
| Favourites (FUTURE / DEFERRED) | — | Own | — | — | Customer |
| Support requests (D-32, MVP minimal) | — | Create, own | — | Read | Complaint |
| Audit | — | — | — | Read | Administration (records written by Shared, ADR-004) |
| Transaction timeline | — | — | — | Read | Administration |

## 7. What contracts must not expose

- Internal IDs or fields not needed by that audience
- JPA entities (responses use dedicated models per surface)
- Fields that let a client set approval status, publication status, ownership, prices derived by the server or payment status
- Other parties' personal data beyond the agreed point (U-21)
- Stack traces and internal error details

## 8. Decision status

| Status | Items |
|---|---|
| **CONFIRMED** | REST with documented contracts; TypeScript clients from OpenAPI when ready (CD-09); business rules in backend (CD-08); all operations via backend (CD-04) |
| **RECOMMENDED** | Four surfaces (AR-03); code-first with breaking-change checks (AR-11); allowed actions in responses (AR-18); conventions in section 4 |
| **UNRESOLVED** | Client generator (U-14); endpoint details under U-07, U-08, U-09, U-10; rate-limit values (U-15); contact field exposure (U-21) |

## Sources

- [springdoc-openapi: Spring Boot 4 requires v3](https://github.com/springdoc/springdoc-openapi)
- [Spring news roundup, Nov 2025: API versioning in Spring Boot 4](https://www.infoq.com/news/2025/11/spring-news-roundup-nov17-2025)
