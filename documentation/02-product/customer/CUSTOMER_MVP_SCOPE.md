# EVNTGRID — Customer MVP Scope

| | |
|---|---|
| **Source** | `main eventgrid.docx`, the owner's brief, and the architecture diagram |
| **Status** | **Proposal for owner approval.** Placement in a release is a recommendation, and it does not confirm a requirement. |
| **Owner decisions (2026-11-09)** | Favourites and reviews are **FUTURE / DEFERRED** beyond the MVP (CD-22). Payments stay out of the MVP until D-24 is decided. No other feature was moved |

## 1. Goal of the first release (proposed)

Let a customer find a venue and event services from the EVNTGRID catalogue, understand what that venue does and does not allow, send an enquiry to one or more providers, receive and compare quotations, accept one, and track the result.

## 2. Scope principles

1. **The catalogue stays whole.** All 12 categories and all source detail are preserved, even if some have few providers at launch.
2. **The three source rules ship in the first release.** They are the only behaviour the owner has actually specified.
3. **No policy is invented.** Payment, cancellation, refund, commission and booking terms are not assumed. The product must not imply any terms the owner has not approved.
4. **Build what the marketplace needs first.** Features that need existing transaction history, such as reviews, come later.

## 3. Conditions for starting the first release

These decisions shape the first release. Details are in `CUSTOMER_REQUIREMENTS_GAPS.md`.

| Decision | Why it blocks the first release |
|---|---|
| D-17 Buying model | Defines the core flow |
| D-18 Operating before provider portal | Without it, no data appears and no quotation can be sent |
| D-13, D-14 Meaning of SR-1, SR-2 | Determines discovery behaviour |
| D-01, D-02, D-07 Names, Surprise Events, navigation | Determines catalogue and navigation |
| D-19 Enquiry rules | Defines enquiry flow |
| D-21, D-22 Multi-vendor booking and confirmation | Defines what a booking is |
| D-23 Availability | Determines what the customer is told about dates |
| D-24 Payments | Determines whether a payment step exists |
| D-29, D-30 Accounts, launch geography | Determines sign-in and supply |

### The provider dependency

The brief puts the customer application first. However, enquiries need someone to answer them, and SR-2 needs input from venue owners. The first release therefore needs **one** of the following, chosen under D-18:

| Option | Description | Trade-off |
|---|---|---|
| A. Build a minimal provider tool alongside | Providers respond themselves | More build before launch |
| B. Staff-operated through admin functions | EVNTGRID staff enter data and quotations on providers' behalf | Quicker build, more manual work, limited scale |
| C. Delay launch until the provider portal is ready | Customer app built first but launched together | Slower to market, cleanest experience |

**Analyst's recommendation, for approval:** Option B for a small launch area, moving to the provider portal in the next release.

## 4. Essential first-release features

Every item below is a proposal except where the DOC label appears.

| Area | Included | Basis | Decisions |
|---|---|---|---|
| Catalogue | All 12 categories; Sub Types, services and options as in the source | DOC | D-01, D-02, D-08 |
| Homepage | Category entry points, venue entry point, location selection | PROPOSED | D-30 |
| Browsing | Category, subcategory and service screens | PROPOSED, with DOC content | D-07 |
| Search | Basic keyword search across categories, services, venues and vendors | PROPOSED | |
| Filters | Automatic filters based on venues (SR-1) | DOC | D-13 |
| Filters | Basic location, venue type and available source attributes | PROPOSED | D-09, D-11 |
| Venue discovery | Listing by type and location | PROPOSED, with DOC types | D-09 |
| Venue profiles | Core information, Cost and Type where supplied, per-service status | PROPOSED | D-14 |
| Venue rule | "the owner does not allow xyz services" (SR-2) | DOC | D-14, D-15 |
| Vendor discovery | Listing by catalogue service, reflecting the selected venue | PROPOSED | D-13 |
| Vendor profiles | Core information, services offered, food capability | PROPOSED | |
| Service details | Options as listed; Rental and optional markings | DOC | D-11 |
| Availability | Clear statement of how availability is confirmed, based on the decision | PROPOSED | D-23 |
| Event details | Event type, date, location, guest count, requirements | PROPOSED | |
| Food choice | Veg, Non-Veg, both, and same or different vendors (SR-3) | DOC | D-16 |
| Multi-vendor plan | One event plan holding venue and several vendors | PROPOSED | D-21 |
| Enquiries | Submit, view status | PROPOSED | D-19 |
| Quotations | Receive, view, compare, accept or decline | PROPOSED | D-20 |
| Bookings | Booking record and status per provider | PROPOSED | D-21, D-22 |
| Account | Sign-in; my event plans, enquiries, quotations and bookings | PROPOSED | D-29 |
| Notifications | Quotation received; booking status changed | PROPOSED | D-31 |
| Support | One clear contact route; report an incorrect listing | PROPOSED | D-32. Built minimally in `complaint` (ADR-030) |

**Payments in the first release:** nothing is proposed until D-24 is decided. The booking flow should be designed so that a payment step can be added later without changing what a booking is. If the owner decides payments must be in the first release, D-24 to D-26 have to be fully answered first, and this scope must be revised.

## 5. Useful next-release features

Favourites, reviews and the rating filter are **FUTURE / DEFERRED** (owner decision, CD-22). No release is assigned to them until the owner schedules them.

| Feature | Why it can wait | Decisions |
|---|---|---|
| Provider self-service integration (if Option B is used) | Enabled by provider portal | D-18 |
| **FUTURE / DEFERRED:** Favourites and shortlists organised by event | Enquiry works without them | |
| **FUTURE / DEFERRED:** Reviews and ratings | Needs completed bookings first | D-28 |
| **FUTURE / DEFERRED:** Rating filter | Needs reviews | D-28 |
| Richer filters: budget, capacity, date | Needs more complete data | D-11, D-23 |
| Date-based availability | Needs provider-maintained data | D-23 |
| Payments, if deferred | Needs policy | D-24, D-25, D-26 |
| Cancellation and rescheduling requests | Needs policy | D-25 |
| Quotation revision and negotiation | First release can accept or decline | D-20 |
| In-app messaging | Needs moderation and contact-sharing rules | D-19 |
| Further notification channels | | D-31 |
| Help centre and booking-linked support | | D-32 |

## 6. Future enhancements

These are ideas only. They need no decision now.

| Idea |
|---|
| Native mobile applications (D-33) |
| Regional language support (D-30) |
| Direct booking of fixed-price services (D-17) |
| Map-based venue search |
| Event budgeting and checklist tools |
| Package bundles of venue and vendors |
| Personalised recommendations |
| Sponsored listings (D-26) |
| Guest list and invitation management |
| Multi-city expansion |

## 7. Explicitly out of scope until decided

- Collecting or holding customer money
- Any stated advance, deposit, refund, cancellation or commission rule
- Any stated booking terms
- Any wording that presents a date as guaranteed
- Any category content for Surprise Events or Corporate Events that is not supplied by the owner
- Provider and admin applications, beyond identifying what the customer application needs from them

## 8. First-release acceptance checks for the source rules

The expected behaviour below is limited to what the source states. Finer detail follows D-13 to D-16.

| Rule | Check |
|---|---|
| Catalogue | Every entry in the `EVENT_CATEGORY_CATALOG.md` appendix can be found in the application under its approved name |
| SR-1 | After venue-based filtering occurs, filters apply with no further action by the customer |
| SR-2 | For a venue whose owner does not allow a service, the customer sees the approved form of "the owner does not allow xyz services" and the service is not silently absent |
| SR-1 with SR-2 | Automatic filtering never hides an SR-2 message |
| SR-3 | A wedding customer can request Veg, Non-Veg, or both, and for both can use the same vendor or different vendors |
| Markings | Wedding Wearables appear as Rental, and Baby Shower Return Gifts appear as optional |
