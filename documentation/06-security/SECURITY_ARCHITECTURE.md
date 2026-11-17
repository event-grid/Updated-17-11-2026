# EVNTGRID — Security Architecture

| | |
|---|---|
| **Builds on** | `CENTRAL_IDENTITY_AND_SECURITY.md` |
| **Stack** | Spring Security, Redis, PostgreSQL, S3, CloudFront |
| **Status** | For owner review. `TA-xx` items need approval. |

## 1. Role-based authorization

| Role | Stored? | Sign-in application | API surface |
|---|---|---|---|
| Visitor | No | None | public |
| Customer | Yes | customer-web | customer |
| Provider | Yes | provider-portal | provider |
| Administrator | Yes | admin-portal | admin |

Provider type (INDIVIDUAL, COMPANY) and approval status (PENDING, APPROVED, REJECTED) are attributes of the provider, and never roles (CD-18).

**Decision sequence on every protected request**

| Step | Check | Failure |
|---|---|---|
| 1 | Valid session | 401 |
| 2 | Session belongs to this surface | 401 |
| 3 | Session holds the surface's role | 403 |
| 4 | CSRF and Origin for writes | 403 |
| 5 | Provider status permits the action | 403 `PROVIDER_NOT_APPROVED` |
| 6 | Record ownership | 404 |
| 7 | Field-level response rules | Field omitted |

| Mechanism | Use |
|---|---|
| One `SecurityFilterChain` per surface | Steps 1 to 4 |
| Application service authorization | Steps 5 and 6, by module |
| Dedicated response models per surface | Step 7 |

The frontends only reflect these decisions. The full matrix is in `CENTRAL_IDENTITY_AND_SECURITY.md`, section 2.

## 2. Resource ownership

| Record | Owner check |
|---|---|
| Customer profile, event plan, favourite (favourites FUTURE / DEFERRED) | `customer_id` from the session |
| Support request | `customer_id` from the session when signed in (visitor submissions are undecided, D-32) |
| Enquiry | Customer: `customer_id`. Provider: via `enquiry_recipient.provider_id` |
| Quotation | Customer: via enquiry. Provider: `provider_id` |
| Booking | Customer: `customer_id`. Provider: `provider_id` |
| Payment | Customer: via booking. Provider summary: subject to U-10 |
| Review (FUTURE / DEFERRED) | Author for edits, if allowed; publication is public |
| Notification | `recipient_user_id` and surface |

**Rules**

1. The owner comes from the session, never from a request parameter.
2. Ownership is part of the query. A missing or foreign record returns 404.
3. Primary keys are not secrets, but UUIDv7 prevents simple enumeration. UUIDv7 does reveal creation time, which is acceptable for these records.
4. Every endpoint has an automated test with a second user of the same role.

## 3. Provider data isolation

| Layer | Control |
|---|---|
| Session | `provider_id` is resolved from `provider_member` at each request, so removal takes effect immediately |
| Application | Provider use cases receive a `ProviderContext` created by the security layer |
| Repository | Provider-owned queries require `provider_id`. A review rule and test prohibit unscoped provider queries |
| Database | `provider_id` on owned rows, with composite foreign keys (ADR-015) |
| Optional | PostgreSQL row-level security, as defence in depth. Not required at first |
| Cache | Provider data isn't placed in shared caches. Any Redis cache key includes `provider_id` |
| Storage | S3 keys have a provider-specific prefix, and access is only through the backend |
| Frontend | TanStack Query cache cleared at sign-out. Never a shared cache |
| Competitors | A provider sees only enquiries addressed to it, and never other providers' quotations |
| Tests | Provider A against Provider B for every provider endpoint |

**Unresolved:** staff permissions in a COMPANY (U-02).

## 4. Admin permission boundaries

Administrator is one confirmed role. Sub-permissions are undecided (U-03). Endpoints are tagged with capabilities now, so that later separation needs no redesign. Initially, all capabilities map to Administrator.

| Capability (proposed) | Covers |
|---|---|
| `PROVIDER_REVIEW` | View provider applications |
| `VERIFICATION_DOCUMENT_READ` | Open verification documents |
| `PROVIDER_DECIDE` | Approve or reject |
| `CATALOG_MANAGE` | Taxonomy |
| `PUBLICATION_MANAGE` | Listing visibility |
| `TRANSACTION_VIEW` | Monitor enquiries, quotations, bookings, payments |
| `FINANCE_MANAGE` | Reserved (U-10, U-22, U-23) |
| `REVIEW_MODERATE` | Reviews (FUTURE / DEFERRED) |
| `COMPLAINT_MANAGE` | Complaints |
| `CONTENT_MANAGE` | Content |
| `AUDIT_READ` | Audit search |
| `ADMIN_MANAGE` | Administrator accounts |

**Hard limits for every Administrator**

| Limit | Reason |
|---|---|
| Cannot edit or delete audit records | Evidence integrity |
| Cannot set a payment status directly | Razorpay evidence is the authority (AR-13) |
| Cannot act as a customer or provider | No impersonation is proposed |
| Cannot grant themselves capabilities | Separation of duty |
| Cannot bypass the owning module's rules | CD-08 |
| Personal-data access is audited | CD-13 |

**Perimeter (AR-12).** admin.evntgrid.com has an IP allowlist or VPN through WAF (TA-06), mandatory MFA, shorter sessions, no search indexing and SameSite=Strict cookies. Administrator accounts are invitation only, and don't hold other roles.

**Proposed for approval:** a second approver for high-risk actions, once U-03 is decided.

## 5. Secure verification document storage

| Stage | Control |
|---|---|
| Authorization | Only a member of the provider, for its own open verification |
| Upload | Presigned, short-lived, single-object PUT to quarantine, with type and size conditions |
| Validation | Backend verifies size, checksum and actual content type |
| Scan | Malware scan (TA-11). Access denied until a clean result arrives. Infected files are isolated |
| Storage | Dedicated private bucket; Block Public Access; SSE-KMS with a dedicated key (TA-05); versioning; TLS-only policy |
| Delivery | Never through CloudFront (ADR-024) |
| Access | Backend issues a presigned GET, valid for a short time, with attachment disposition, after checking `VERIFICATION_DOCUMENT_READ` |
| Audit | Every upload, access and decision is recorded, with actor and optional reason |
| Key format | `provider/{providerId}/verification/{verificationId}/{randomId}` with no original name |
| IAM | Only the backend role can read. Humans have no direct bucket access in production |
| Logs | Never contains presigned URLs |
| Retention | Undecided (U-16). Legal review is needed. Deletion must cover versions |

## 6. Audit logging

| Property | Design |
|---|---|
| Location | `shared.audit_event` (ADR-004) |
| Atomicity | Written in the same transaction as the change (AR-17) |
| Immutability | INSERT and SELECT only for the application's database role; no update path |
| Identity | Actor, role, surface and provider, with correlation ID |
| Privacy | Sensitive values masked; document contents never stored |
| Read path | `administration`, under `AUDIT_READ` |
| Reads audited | Verification documents and sensitive personal data |

**Required events**

| Area | Events |
|---|---|
| identity | Sign-in failure patterns, role grant or revoke, MFA change, administrator creation |
| provider | Status changes, verification submissions, document access |
| catalog | Taxonomy, publication, venue service availability changes |
| enquiry, quotation, booking | Creation and every status change |
| payment | Status changes, reconciliation outcomes, administrator actions |
| review, complaint, content | Moderation and administrator changes |
| administration | Every administrator write |

## 7. Secure session and API communication

| Control | Design |
|---|---|
| Sessions | Opaque, server-side, in Redis (ADR-007, TA-01) |
| Isolation | Separate `__Host-` cookie and session per application; surface recorded in the session |
| Cookie attributes | HttpOnly, Secure, Path=/; SameSite=Lax for customer and provider, Strict for admin |
| Rotation | New session ID at sign-in and privilege change |
| Revocation | Immediate at sign-out, role change or provider member removal |
| Cross-origin | No browser cross-origin API calls in production (ADR-006) |
| CSRF | Session-bound token, Origin check, `Sec-Fetch-Site` check. Subdomains are same-site, so SameSite alone is insufficient |
| Transport | HTTPS, HSTS; TLS from CloudFront to origin |
| Origin | Internal load balancer via CloudFront VPC origin, so no public backend |
| Server-side reads | Next.js forwards the session cookie over the private network, with the same checks |
| Headers | CSP per application; frame blocking; Referrer-Policy; nosniff |
| Secrets | TA-05; no secrets in frontend code. Razorpay key ID is the only payment value in the browser |
| Webhook | HMAC signature on the raw body. Separate hostname. WAF source list optional |
| Actuator | Private port only |

Next.js `proxy.ts` is not an authorization layer (AR-20).

## 8. Validation and rate limiting

**Validation layers**

| Layer | Purpose | Authority? |
|---|---|---|
| Zod in the frontend | Immediate feedback | No |
| Bean Validation at controllers | Shape, format, size | Yes, for input |
| Domain rules | Business correctness | Yes |
| Database constraints | Final integrity | Yes |

**Input rules.** Unknown JSON fields are rejected on write models. Status, ownership and price-derived fields can't be set by clients. Maximum lengths are declared in the contract. Free text is encoded on output, and rich text isn't accepted by default. Search terms go through parameterized queries.

**Rate limits** are held in Redis counters, using the confirmed stack. WAF rules add broader protection (TA-06). Values are set from k6 tests and U-15.

| Target | Key |
|---|---|
| Sign-in, OTP request and verification | Account and IP |
| Password or credential reset | Account and IP |
| Enquiry submission | Customer, with D-19 limits |
| Search and public listing | IP |
| Upload requests | User and provider |
| Quotation sending | Provider |
| Admin writes | Administrator |
| Webhook | WAF and signature, not application throttling, so genuine events aren't dropped |

## 9. Unresolved security items

| Item | Reference |
|---|---|
| Sign-in methods | U-01, U-02 |
| Administrator sub-permissions | U-03 |
| Contact detail exposure | U-21 |
| Retention and data rights | U-16, D-34 |
| Authenticator-code option | TA-17 |
| Provider staff permissions | U-02 |

## Sources

- [GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html)
- [OWASP Next.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nextjs_Security_Cheat_Sheet.html)
- [Spring Security CSRF reference](https://docs.spring.io/spring-security/reference/7.0.7/servlet/exploits/csrf.html)
- [Razorpay webhook validation](https://razorpay.com/docs/webhooks/validate-test.md)
