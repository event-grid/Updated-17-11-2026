# EVNTGRID — Architecture Decisions

| | |
|---|---|
| **Purpose** | Single register of architecture decisions, technology approval requests and unresolved rules |
| **Builds on** | `APPLICATION_ECOSYSTEM.md` (CD, AR, U registers) and `CUSTOMER_REQUIREMENTS_GAPS.md` (D, C, A registers) |
| **Status** | For owner review. No application code or SQL migrations have been produced. |

## 1. How this baseline was set

| Earlier item | Treatment here |
|---|---|
| Owner confirmations (CD-01 to CD-20) | Stand as confirmed |
| Architect recommendations (AR-01 to AR-20) | Treated as **baseline**, because this brief calls the architecture approved, unless changed in section 2 |
| Business decisions (D-01 to D-35) | **Still open**, because the Project records no owner answers. Calling the requirements approved adopts them as the planning baseline, and does not answer them |
| Proposed features | Remain proposals, planned according to `CUSTOMER_MVP_SCOPE.md` |

## 2. What this brief changes

| Earlier item | Change |
|---|---|
| AR-04 module set | Replaced by the owner's 17 modules. There is no `audit`, `engagement` or `support` module, so those duties are relocated (ADR-004, ADR-005) |
| AR-10 hosting | ECS Fargate and RDS are now confirmed. Region and managed Redis remain recommendations |
| AR-11, U-14 client generation | OpenAPI Generator is now confirmed (ADR-008). U-14 is closed |
| U-17 hosting | Application and database hosting are now confirmed. AWS account structure stays open |
| Identity owns customer profile | Moved to the new `customer` module |
| DEPLOYMENT_ARCHITECTURE monitoring | CloudWatch was assumed for logs and metrics. The stack now names OpenTelemetry, Prometheus and Grafana (ADR-023, TA-07 to TA-09) |
| Provider types | Previously an enumeration. Now a requested entity, modelled as a two-row reference table |

## 3. Technology approval requests

These are not in your stack. **None is adopted until you approve it.** Each document marks the dependency with its TA number.

| ID | Item | Why it is needed | Without it | Recommendation |
|---|---|---|---|---|
| TA-01 | Spring Session Data Redis | Stores server-side sessions in the confirmed Redis | Hand-written session storage, which is riskier | Approve |
| TA-02 | Spring Cloud AWS (SQS, Spring Modulith SQS externalization) | Spring Modulith's SQS support now lives in this project | Write SQS integration directly on the AWS SDK | Approve |
| TA-03 | AWS foundation: VPC, NAT, Application Load Balancer, ECR, IAM, Route 53, ACM | ECS Fargate and CloudFront cannot run or be addressed without them | None practical | Approve |
| TA-04 | Amazon ElastiCache for Redis | Managed Multi-AZ hosting for the confirmed Redis | Redis on Fargate, with no durable storage or managed failover | Approve |
| TA-05 | AWS Secrets Manager and KMS | Keeps secrets out of code; encrypts verification documents | SSM Parameter Store and S3-managed keys, with weaker key separation | Approve |
| TA-06 | AWS WAF | Admin IP restriction, abuse rules, Razorpay IP list | Application-level limits only | Approve |
| TA-07 | Log storage: CloudWatch Logs or Grafana Loki | The stack has no log store. Spring Boot does not export logs automatically | Logs are lost when tasks stop | Approve CloudWatch Logs first; it is the ECS default |
| TA-08 | Trace storage: Grafana Tempo or AWS X-Ray | OpenTelemetry generates traces but does not store them | No trace search | Approve Tempo if self-hosting is acceptable, otherwise X-Ray |
| TA-09 | Prometheus and Grafana hosting: Amazon Managed Service for Prometheus, or self-hosted on Fargate with EFS | Metrics need durable storage. Fargate tasks have none of their own | Metrics are lost on restart | Approve the managed service, with Grafana in Docker on Fargate |
| TA-10 | Email, SMS and WhatsApp delivery vendors | The stack has no delivery channel (U-13) | In-app notifications only | Choose with D-31 |
| TA-11 | Amazon GuardDuty Malware Protection for S3 | Scans uploaded verification documents | Unscanned documents reach administrators' machines | Approve before accepting real documents |
| TA-12 | OpenAPI breaking-change checker, such as `oasdiff` | Automates AR-11. OpenAPI Generator does not compare versions | Manual contract review | Approve |
| TA-13 | Frontend helpers: `@hookform/resolvers`, `@tanstack/react-table`, Testing Library with jsdom | The bridge between React Hook Form and Zod; shadcn/ui's data table; component tests under Vitest | Custom bridging, custom tables, browser-only tests | Approve |
| TA-14 | CI/CD and infrastructure as code, such as GitHub Actions and Terraform | The stack names no pipeline or provisioning tool | Manual, unrepeatable deployments | Terraform is named in the owner's folder plan and is treated as the infrastructure-as-code choice. Choose the CI/CD tool; with one repository it must support per-application path filters |
| TA-15 | PostgreSQL `pg_trgm` extension | Spelling-tolerant search (mehandi, mehandhi). It ships with PostgreSQL | Exact and full-text matching only | Approve |
| TA-16 | LocalStack through Testcontainers | Tests SQS and S3 behaviour in CI | Fakes in CI and real AWS in staging | Optional. The default is without it |
| TA-17 | Authenticator-code (TOTP) library | Only if admins use authenticator codes | WebAuthn through Spring Security | Avoid if WebAuthn is acceptable |

## 4. Decision records

Status: **ACCEPTED** (owner specified), **BASELINE** (earlier recommendation adopted), **PROPOSED** (new, needs approval), **BLOCKED** (waiting on a business decision).

| ADR | Decision | Status | Alternatives considered | Consequence |
|---|---|---|---|---|
| ADR-001 | Three independent Next.js and TypeScript applications | ACCEPTED | One app with role-based areas | Independent releases; no shared layout code |
| ADR-002 | One Spring Boot modular monolith with the owner's 17 modules | ACCEPTED | Microservices (excluded) | Boundaries are enforced by Spring Modulith, not the network |
| ADR-003 | One PostgreSQL database, one schema per module | ACCEPTED (one database), BASELINE (schemas) | Single schema | Clear ownership; one Flyway history |
| ADR-004 | Audit recording lives in `shared`. `administration` provides the read view | PROPOSED | A dedicated `audit` module, which is cleaner but adds an 18th module; placing it in `administration` would make every module depend on it | `shared` must stay small and rule-free. Please confirm or add `audit` |
| ADR-005 | Customer support goes in `complaint`; homepage and help text go in `content`. Favourites would go in `customer` when scheduled, and are FUTURE / DEFERRED (ADR-028) | PROPOSED | Add `engagement` and `support` | No new modules. "Complaint" may be narrower than "support" (U-24) |
| ADR-006 | Each app calls `/api/...` on its own hostname | BASELINE (AR-01) | `api.evntgrid.com` with credentialed CORS | No production CORS; per-host cookies |
| ADR-007 | Opaque server-side sessions in Redis, one per application | BASELINE (AR-02), needs TA-01 | JWT in the browser | Instant revocation |
| ADR-008 | OpenAPI Generator `typescript-fetch`; one client per surface; emit OpenAPI 3.0 for generation | PROPOSED | Emit 3.1, springdoc's default | Generator version pinned. Move to 3.1 only after a successful test |
| ADR-009 | TanStack Query is the only server-state layer in each frontend | ACCEPTED (tool), PROPOSED (usage) | Next.js fetch cache for authenticated data | Consistent freshness, per AR-09 |
| ADR-010 | Zod validates form input only. The backend remains the authority | PROPOSED | Generate Zod from OpenAPI, which needs another tool | Some repetition of format rules, none of business rules |
| ADR-011 | shadcn/ui components are copied into each app separately | PROPOSED | A shared UI package | Honours CD-07; visual drift is possible |
| ADR-012 | UUIDv7 primary keys, generated by the application | PROPOSED | Sequences; random UUIDv4 | Non-guessable public IDs with good index locality |
| ADR-013 | Money as integer minor units plus currency code | BASELINE | Decimal | Matches Razorpay amounts |
| ADR-014 | Status columns are text with CHECK constraints | PROPOSED | PostgreSQL enum types | New values through an ordinary Flyway change |
| ADR-015 | Composite foreign keys carry `provider_id` on provider-owned rows | PROPOSED | Application checks only | The database stops cross-provider links |
| ADR-016 | One booking per accepted quotation, grouped by event plan | BLOCKED (D-21) | Parent booking with vendor children | Works under either D-21 answer, with a parent table added if needed |
| ADR-017 | Canonical `service` plus `category_service` placement holding the verbatim source label | PROPOSED | One service row per category | Later merges (D-12) are data changes, not schema changes |
| ADR-018 | No availability row means "owner has not stated". Only an explicit row produces the SR-2 message | PROPOSED | Default to "does not allow" | Prevents a false statement about an owner (D-15) |
| ADR-019 | Quotation acceptance and booking creation in one transaction | BASELINE (AR-06) | Event-driven creation | Guaranteed consistency |
| ADR-020 | Spring Modulith event registry as outbox; SQS for delivery; worker role | BASELINE (AR-07, AR-08), needs TA-02 | Custom outbox | Events survive crashes |
| ADR-021 | `commission` and `settlement` get boundaries only; no entities or rates | BLOCKED (D-26, U-22, U-23) | Designing assumed rules | Respects the instruction not to invent commission rules |
| ADR-022 | Razorpay Orders, Standard Checkout and signed webhooks. Route is not assumed | ACCEPTED (Razorpay), BLOCKED (fund flow) | Designing around Route now | Money-flow decisions stay with the owner and counsel |
| ADR-023 | Metrics, traces and logs through OpenTelemetry and Micrometer; Prometheus and Grafana for metrics | ACCEPTED (tools), needs TA-07 to TA-09 | CloudWatch only | Hosting choices remain open |
| ADR-024 | Verification documents in a private S3 bucket, never served through CloudFront | PROPOSED, needs TA-05, TA-11 | Public-CDN delivery with signed URLs | Stronger isolation |
| ADR-025 | Test with JUnit 5, Testcontainers, Vitest, Playwright and k6 | ACCEPTED | — | LocalStack is optional (TA-16) |
| ADR-026 | Target PostgreSQL 18 on RDS, Spring Boot 4.1.x and Next.js 16 | PROPOSED | Older lines | Exact pins set at build start (U-20) |
| ADR-027 | One Git repository (monorepo) in one project folder (any location, no fixed path) for backend, three frontends, infrastructure, documentation and scripts. One root `.git` and `.gitignore`; no nested repositories | **ACCEPTED** (owner, 2026-11-09, CD-21) | Four repositories (AR-15), now superseded | Applications still release independently through per-application pipelines with path filters (TA-14) |
| ADR-028 | Favourites and reviews are FUTURE / DEFERRED beyond the MVP. No MVP module or deliverable. Their requirements and design notes stay, labelled | **ACCEPTED** (owner, 2026-11-09, CD-22) | Keep them in release 2 | `review` is not an MVP module. Favourites are not built. The review schema is retained for planning only |
| ADR-029 | Frontend `stores/` stays empty. No client-state library. TanStack Query for server state, React built-in state for local UI state | **ACCEPTED** (owner, 2026-11-09, CD-23) | Zustand or Redux | A client-state library needs a technology approval request first |
| ADR-030 | The MVP support need (contact route and incorrect-listing report, D-32) is built minimally in `complaint` as support-request intake. All other complaint handling stays a boundary (U-24) | PROPOSED, follows `CUSTOMER_MVP_SCOPE.md` | Defer the report feature | Adds one provisional entity (`complaint.support_request`) and two provisional endpoints. Depends on D-32 |
| ADR-031 | Payment is outside the MVP until D-24 is decided. The `payment` module and its design are kept, and no business flow is built | PROPOSED, follows `CUSTOMER_MVP_SCOPE.md` | Build payments in the MVP | The booking flow must let a payment step be added later without changing what a booking is |
| ADR-032 | Generators write directly into their final folders. The folder script creates only empty `frontend/` and `backend/`. Application folders and internal folders are added after generation | **ACCEPTED** (owner, 2026-11-09) | Pre-created folders with a scratch folder and copying | Removes any file replacement or deletion step |

## 5. Unresolved rules and what each one blocks

U-01 to U-21 are defined in `APPLICATION_ECOSYSTEM.md`. U-22 onward are added here.

| ID | Unresolved | Linked | Blocks |
|---|---|---|---|
| U-01 | Customer sign-in | D-29 | `user_credential` detail, sign-in API |
| U-02 | Provider sign-in; COMPANY staff | — | `provider_member` roles |
| U-03 | Administrator sub-permissions | — | Admin capability mapping |
| U-04 | Suspension, re-application | — | `provider.approval_status` values |
| U-05 | Publication states and review | — | `publication_status` values |
| U-06 | Venue owners and event managers in the provider model | D-05 | Provider onboarding fields |
| U-07 | Multi-vendor booking structure | D-21 | Booking grouping |
| U-08 | Booking statuses, confirmation | D-22 | `booking.status` values |
| U-09 | Availability | D-23 | Availability entity, withheld |
| U-10 | Payment policy and money flow | D-24 to D-26 | Payment purpose, refunds |
| U-11 | Build order and operation before provider-portal | D-18 | Delivery plan |
| U-12 | One login as both Customer and Provider | — | `user_role` rules |
| U-13 | Notification vendors | D-31 | Delivery adapters, TA-10 |
| U-15 | Capacity, service levels, recovery targets | — | Sizing, k6 thresholds |
| U-16 | Retention and compliance | D-34 | Deletion, archival |
| U-18 | Domain ownership | — | Go-live |
| U-19 | Direct booking | D-17 | Whether a booking can exist without a quotation |
| U-20 | Exact version pins | — | Build start |
| U-21 | Enquiry routing and contact sharing | D-19 | `enquiry_recipient`, field exposure |
| U-22 | Commission rules | D-26 | `commission` module design |
| U-23 | Settlement method and fund flow | D-24, D-34 | `settlement` module design |
| U-24 | Complaint process, and whether it covers all support | D-32 | `complaint` module design |
| U-25 | What `content` manages | — | `content` module design |
| U-26 | Required verification checks and documents | D-27 | `provider_verification` detail |
| U-27 | Location hierarchy and service-area model | D-30 | `location` and `service_location` detail |
| U-28 | How rentals are represented | D-10 | Rental fields, deposits |
| U-29 | Enquiry and quotation statuses | D-19, D-20 | Status values |
| U-30 | Where each frontend's Dockerfile lives: in the application folder (earlier design) or in `infrastructure/docker` | — | Build and deployment layout |

Source rules still needing owner decisions: SR-1 (D-13), SR-2 (D-14, D-15), SR-3 (D-16).

## 6. Payment regulation note

The `commission` and `settlement` modules imply that EVNTGRID may split or pass on customer funds. The Reserve Bank of India issued a consolidated Master Direction on Payment Aggregators on 15 September 2025, covering marketplaces, escrow and settlement. Commentary describes tighter limits on paying third parties. Razorpay Route offers a split-payment product with Linked Accounts, and has its own RBI compliance requirements.

**This is not legal advice.** A qualified adviser and Razorpay should confirm the fund flow before U-10 or U-23 is decided.

## Sources

- [RBI Master Direction on Regulation of Payment Aggregator](https://rbi.org.in/SCRIPTs/BS_ViewMasDirections.aspx?id=12896)
- [Cyril Amarchand Mangaldas client alert on the Master Direction](https://www.cyrilshroff.com/wp-content/uploads/2025/10/Client-Alert-RBI-Introduces-Consolidated-Framework-for-Payment-Aggregators-3.pdf)
- [Razorpay Route](https://razorpay.com/docs/payments/route/)
- [Razorpay Route dashboard and RBI compliance reference](https://razorpay.com/docs/payments/route/dashboard.md)
- [Spring Boot observability](https://docs.spring.io/spring-boot/4.2/reference/actuator/observability.html)
- [Amazon RDS for PostgreSQL 18](https://aws.amazon.com/about-aws/whats-new/2025/11/amazon-rds-postgresql-major-version-18)
- [GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html)
- [What's new in Spring Modulith 1.3: SQS support moved to Spring Cloud AWS](https://spring.io/blog/2024/11/22/whats-new-in-spring-modulith-1-3)
