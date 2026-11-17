# EVNTGRID — Customer Features

| | |
|---|---|
| **Source** | `main eventgrid.docx`, the owner's brief, and the architecture diagram |
| **Scope** | Customer-facing application only |
| **Status** | Draft for owner review. Items marked PROPOSED or DECISION are **not confirmed requirements**. |

## 1. Most important finding

The source document is a **service catalogue plus two display rules and one food-vendor qualifier**. Apart from those, it does not describe any feature of the application. It does not mention a homepage, search, profiles, enquiries, quotations, bookings, accounts, favourites, notifications, reviews, payments or support.

The owner's brief names those areas as things to analyse, so they are in scope for analysis. The details within them remain proposals or open decisions.

## 2. Classification

| Label | Meaning |
|---|---|
| **DOC** | Explicitly present in the document |
| **PROPOSED** | Proposed customer feature; needs approval |
| **DECISION** | Cannot be specified until the owner makes a business decision (see `CUSTOMER_REQUIREMENTS_GAPS.md`) |

Where a catalogue item is in the document but the way it appears on screen is not, the two are listed separately.

**Result across all 144 items**

| Class | Items |
|---|---|
| DOC | 28 |
| PROPOSED | 60 |
| DECISION | 56 |

Most DOC items are catalogue content. Eleven of the 21 areas have no DOC item at all: Search, Vendor profiles, Enquiries, Quotations, Bookings, Customer account, Favourites, Notifications, Reviews, Payments and Customer support.

## 3. Features by area

### 3.1 Homepage

| ID | Item | Class | Basis / note |
|---|---|---|---|
| HOM-01 | The 12 Main Services exist as the top-level offering | DOC | p.1 |
| HOM-02 | A homepage exists | PROPOSED | Named in brief; not in document |
| HOM-03 | Homepage displays the 12 categories as entry points | PROPOSED | Natural placement for HOM-01 |
| HOM-04 | Prominent search or location entry | PROPOSED | Depends on D-30 |
| HOM-05 | Direct entry point to Venues | PROPOSED | Venues drive SR-1 |
| HOM-06 | Featured providers or promotions | DECISION | Paid or editorial placement is a commercial choice (D-26) |
| HOM-07 | Explanation of how EVNTGRID works | PROPOSED | Content depends on D-17 |

### 3.2 Event category browsing

| ID | Item | Class | Basis / note |
|---|---|---|---|
| CAT-01 | 12 main categories | DOC | p.1; names under D-01 |
| CAT-02 | Each category except Surprise Events has its own Sub Services content | DOC | p.2–6 |
| CAT-03 | Category page for each main category | PROPOSED | |
| CAT-04 | Content for Surprise Events | DECISION | No content in source (D-02) |
| CAT-05 | Services for Corporate Events | DECISION | Only Internal / External listed (D-06) |
| CAT-06 | How Photography, Food and Catering, and Venues relate to the same services inside event categories | DECISION | D-07 |
| CAT-07 | Behaviour of a category with no available providers | PROPOSED | Likely at launch; must not remove the category |

### 3.3 Subcategory browsing

| ID | Item | Class | Basis / note |
|---|---|---|---|
| SUB-01 | Wedding Sub Types (10) | DOC | p.2 |
| SUB-02 | Meetup Sub Types (2) | DOC | p.3 |
| SUB-03 | Services listed under each event category | DOC | Catalogue section 3 |
| SUB-04 | Service options, such as Photography – pre-wedding, wedding | DOC | p.2 |
| SUB-05 | Photography subcategories (Wedding shoot, Party Shoots, General Photographs, Festives) | DOC | p.3–4 |
| SUB-06 | Food subcategories (5) | DOC | p.4 |
| SUB-07 | Corporate subcategories (Internal, External) | DOC | p.5 |
| SUB-08 | Selecting an event type changes which services are shown | DECISION | Source does not link types to services (D-08) |
| SUB-09 | Drill-down screens from category to type to service to provider | PROPOSED | |

### 3.4 Search

| ID | Item | Class | Basis / note |
|---|---|---|---|
| SRC-01 | Any search function | PROPOSED | Not in document |
| SRC-02 | Keyword search over categories, services, venues and providers | PROPOSED | |
| SRC-03 | Search by location | PROPOSED | Depends on D-30 |
| SRC-04 | Tolerance for spelling variants such as mehandi / mehandhi | PROPOSED | Source itself uses both |
| SRC-05 | No-results handling with alternatives | PROPOSED | |
| SRC-06 | Paid ranking or sponsored results | DECISION | D-26 |

### 3.5 Filters

| ID | Item | Class | Basis / note |
|---|---|---|---|
| FIL-01 | All filters applied automatically based on venues (SR-1) | DOC | p.1; behaviour under D-13 |
| FIL-02 | Cost and Type recorded for wedding venues and tents; Type, Cost and Customised for invitation printers | DOC | p.2, as attributes |
| FIL-03 | Using those attributes as customer filters | PROPOSED | Document lists attributes, not filters |
| FIL-04 | Filtering by Veg / Non-Veg / both, and same or different vendors | PROPOSED | Options are DOC; filter is proposed (D-16) |
| FIL-05 | Filter by venue type | PROPOSED | Master list needed (D-09) |
| FIL-06 | Filter by location, date, guest count, budget | PROPOSED | Not in document |
| FIL-07 | Rating filter | PROPOSED | Depends on reviews (D-28) |
| FIL-08 | Automatic filters shown and clearable | DECISION | Whether they can be overridden (D-13) |
| FIL-09 | Automatic filters do not hide SR-2 messages | PROPOSED | Needed to keep SR-1 and SR-2 both true |

### 3.6 Venue discovery

| ID | Item | Class | Basis / note |
|---|---|---|---|
| VDI-01 | Venues as a main category covering all types | DOC | p.1, p.6 |
| VDI-02 | Named venue types: choultry, halls, banquets, Party halls, Open Grounds, auditorium Hall’s, Resorts, open ground | DOC | Catalogue section 5 |
| VDI-03 | Venues presented within event categories | DOC | Listed as a service under C01, C02, C03, C07, C10, C11 |
| VDI-04 | Venue listing and result cards | PROPOSED | |
| VDI-05 | Map or distance view | PROPOSED | |
| VDI-06 | Shortlist and compare venues | PROPOSED | |
| VDI-07 | Full master list of venue types | DECISION | D-09 |
| VDI-08 | Events at a customer's own location | DECISION | "Home" appears only as a decoration option (D-09) |

### 3.7 Vendor discovery

| ID | Item | Class | Basis / note |
|---|---|---|---|
| VND-01 | Vendor kinds named in the catalogue, such as Photographers, Decorators, Invitation Printers, Prize makers, Costumes providers | DOC | Catalogue section 3 |
| VND-02 | Event Managers (Event Companies those manage all Events) | DOC | p.5; meaning under D-05 |
| VND-03 | Surprise Events Planners | DOC | Name only, p.1 |
| VND-04 | Vendor listings by service | PROPOSED | |
| VND-05 | Vendors narrowed by selected venue | DECISION | One possible reading of SR-1; the source does not mention vendors (D-13) |
| VND-06 | Vendor service areas | DECISION | D-30 |
| VND-07 | Finding vendors without selecting a venue | DECISION | D-13 |
| VND-08 | Same vendor listed under multiple categories | DECISION | D-07 |

### 3.8 Venue profiles

| ID | Item | Class | Basis / note |
|---|---|---|---|
| VPR-01 | Message when the owner does not allow a service (SR-2) | DOC | p.1; wording and meaning under D-14 and D-15 |
| VPR-02 | Cost and Type listed as details of wedding venues | DOC | p.2; how they appear on a profile is not stated (D-11) |
| VPR-03 | Status of each service at the venue (provided, not provided, outside vendor allowed, not allowed, unknown) | DECISION | Only "does not allow" is in source (D-14, D-15) |
| VPR-04 | Photos, description, location, capacity, amenities | PROPOSED | |
| VPR-05 | Ratings and reviews | PROPOSED | D-28 |
| VPR-06 | Enquire from the profile | PROPOSED | |
| VPR-07 | Availability shown on the profile | DECISION | D-23 |

### 3.9 Vendor profiles

| ID | Item | Class | Basis / note |
|---|---|---|---|
| VEP-01 | Whether a food vendor offers Veg, Non-Veg or both | PROPOSED | Needed to support SR-3 |
| VEP-02 | List of events managed by an Event Company | DECISION | Possible meaning of source parenthetical (D-05) |
| VEP-03 | Name, description, portfolio, service list, areas served | PROPOSED | |
| VEP-04 | Verification indicator | DECISION | D-27 |
| VEP-05 | Ratings and reviews | PROPOSED | D-28 |
| VEP-06 | Direct contact details shown to customers | DECISION | D-19 |

### 3.10 Service details

| ID | Item | Class | Basis / note |
|---|---|---|---|
| SVC-01 | Service options exactly as listed | DOC | Catalogue section 3 |
| SVC-02 | Wearables identified as Rental | DOC | p.2 |
| SVC-03 | Return Gifts identified as optional | DOC | p.4 |
| SVC-04 | Customised option for Invitation Printers | DOC | p.2; meaning under D-11 |
| SVC-05 | Cost listed as a detail of wedding Venues, Invitation Printers and Tent | DOC | p.2; whether a price, range or starting price is D-11 |
| SVC-06 | Service detail screens | PROPOSED | |
| SVC-07 | Rental terms such as duration or deposit | DECISION | D-10, D-24 |
| SVC-08 | Which other services are rental | DECISION | D-10 |

### 3.11 Service availability

| ID | Item | Class | Basis / note |
|---|---|---|---|
| AVL-01 | A service not availed by a venue owner is displayed as such (SR-2) | DOC | p.1. The only availability concept in the source |
| AVL-02 | Date-based availability of venues and vendors | DECISION | D-23 |
| AVL-03 | Calendar, slot or day-level granularity | DECISION | D-23 |
| AVL-04 | Temporary hold during enquiry or quotation | DECISION | D-23 |
| AVL-05 | "Availability not confirmed until provider responds" messaging | PROPOSED | Sensible default if live data is not offered |

### 3.12 Event details and requirements

| ID | Item | Class | Basis / note |
|---|---|---|---|
| EVT-01 | Event categories and Sub Types available as event details | DOC | Options from p.1–3; how they are captured is proposed |
| EVT-02 | Veg, Non-Veg, Veg and Non-Veg (same/diff vendors) as food options | DOC | p.2, wedding food; scope under D-16 |
| EVT-03 | Event requirements form | PROPOSED | Not in document |
| EVT-04 | Date, city or area, guest count, budget range, notes | PROPOSED | |
| EVT-05 | Saved event plan holding venue and chosen services | PROPOSED | Needed for multi-vendor selection |
| EVT-06 | Attachments and inspiration images | PROPOSED | |
| EVT-07 | Separate veg and non-veg guest counts | DECISION | D-16 |

### 3.13 Enquiries

| ID | Item | Class | Basis / note |
|---|---|---|---|
| ENQ-01 | Customer submits an enquiry | PROPOSED | Named in brief; not in document |
| ENQ-02 | Enquiry to one provider or several at once | DECISION | D-19 |
| ENQ-03 | Customer chooses recipients, or platform matches | DECISION | D-19 |
| ENQ-04 | Login required to submit | DECISION | D-29 |
| ENQ-05 | Contact details shared with providers, and when | DECISION | D-19 |
| ENQ-06 | Enquiry status visible to customer | PROPOSED | |
| ENQ-07 | Warning when enquiry conflicts with venue's SR-2 status | PROPOSED | Behaviour depends on D-14 |
| ENQ-08 | Messaging between customer and provider | DECISION | D-19 |
| ENQ-09 | Limit on enquiries; provider response time expectations | DECISION | D-19 |

### 3.14 Quotations

| ID | Item | Class | Basis / note |
|---|---|---|---|
| QUO-01 | Customer receives quotations | PROPOSED | Named in brief; not in document |
| QUO-02 | Side-by-side comparison | PROPOSED | Named in brief |
| QUO-03 | Comparing one combined food quotation against two separate ones | PROPOSED | Needed to support SR-3 |
| QUO-04 | Required quotation contents, inclusions and exclusions | DECISION | D-20 |
| QUO-05 | Validity and expiry | DECISION | D-20 |
| QUO-06 | Revision or negotiation | DECISION | D-20 |
| QUO-07 | Accepting or declining | PROPOSED | Named in brief; effect depends on D-22 |
| QUO-08 | Partial acceptance of a quotation | DECISION | D-20, D-21 |

### 3.15 Bookings

| ID | Item | Class | Basis / note |
|---|---|---|---|
| BKG-01 | Customer completes a booking | PROPOSED | Named in brief; not in document |
| BKG-02 | One booking with many vendors, or one per vendor | DECISION | D-21 |
| BKG-03 | What makes a booking confirmed, and who confirms | DECISION | D-22 |
| BKG-04 | Booking terms shown to the customer | DECISION | D-22 |
| BKG-05 | Booking list and status tracking | PROPOSED | Named in brief |
| BKG-06 | Event-level view across all vendors | PROPOSED | |
| BKG-07 | Direct purchase without enquiry for fixed-price items | DECISION | D-17 |
| BKG-08 | Cancellation or rescheduling | DECISION | D-25 |

### 3.16 Customer account

| ID | Item | Class | Basis / note |
|---|---|---|---|
| ACC-01 | Customer account | PROPOSED | Identity module in architecture; not in document |
| ACC-02 | Sign-in method | DECISION | D-29 |
| ACC-03 | Browsing without an account | DECISION | D-29 |
| ACC-04 | Profile and contact details | PROPOSED | |
| ACC-05 | My events, enquiries, quotations and bookings | PROPOSED | |
| ACC-06 | Account deletion and data rights | DECISION | D-34 |

### 3.17 Favourites

> **FUTURE / DEFERRED (owner decision, 2026-11-09).** Not an MVP feature. The requirements below are kept unchanged.

| ID | Item | Class | Basis / note |
|---|---|---|---|
| FAV-01 | Save venues and vendors | PROPOSED | Named in brief; not in document |
| FAV-02 | Organise favourites by event | PROPOSED | |
| FAV-03 | Enquire from favourites | PROPOSED | |

### 3.18 Notifications

| ID | Item | Class | Basis / note |
|---|---|---|---|
| NOT-01 | Alerts for quotation received and booking status change | PROPOSED | Named in brief; not in document |
| NOT-02 | In-app notification centre | PROPOSED | |
| NOT-03 | Channels: email, SMS, WhatsApp, push | DECISION | D-31 |
| NOT-04 | Consent and preference settings | DECISION | D-31, D-34 |

### 3.19 Reviews

> **FUTURE / DEFERRED (owner decision, 2026-11-09).** Not an MVP feature. The requirements below are kept unchanged.

| ID | Item | Class | Basis / note |
|---|---|---|---|
| REV-01 | Customer reviews a provider | PROPOSED | Named in brief; not in document |
| REV-02 | Ratings and written reviews | PROPOSED | |
| REV-03 | Only customers with completed bookings may review | DECISION | D-28 |
| REV-04 | Moderation and removal | DECISION | D-28 |
| REV-05 | Provider replies | DECISION | D-28 |
| REV-06 | Reviews of the venue and each vendor separately | PROPOSED | Follows the multi-vendor model |

### 3.20 Payments

| ID | Item | Class | Basis / note |
|---|---|---|---|
| PAY-01 | Whether payments happen on the platform at all | DECISION | Payment module exists in architecture; no rules exist (D-24) |
| PAY-02 | Who receives money | DECISION | D-24 |
| PAY-03 | Payment methods and timing | DECISION | D-24 |
| PAY-04 | Refund handling | DECISION | D-25 |
| PAY-05 | Fees and commission visible to customers | DECISION | D-26 |
| PAY-06 | Receipts, invoices and tax | DECISION | D-26, D-34 |
| PAY-07 | Rental deposits | DECISION | D-10, D-24 |

No customer-facing payment behaviour is proposed. This is deliberate.

### 3.21 Customer support

> **MVP part:** the contact route and the incorrect-listing report (D-32), built minimally in `complaint` (ADR-030). Everything else here is later.

| ID | Item | Class | Basis / note |
|---|---|---|---|
| SUP-01 | A way to contact EVNTGRID | PROPOSED | Named in brief; not in document |
| SUP-02 | Help / FAQ content | PROPOSED | Content depends on the undecided policies |
| SUP-03 | Issue linked to a specific booking or enquiry | PROPOSED | |
| SUP-04 | Support channels and hours | DECISION | D-32 |
| SUP-05 | Dispute responsibility between customer, provider and EVNTGRID | DECISION | D-32 |
| SUP-06 | Reporting an incorrect listing, including an incorrect SR-2 message | PROPOSED | Protects the accuracy of owner statements |

## 4. Mapping to the architecture

The architecture diagram shows `customer-web`, `provider-portal` and `admin-portal` calling one Java 25 / Spring Boot / Spring Modulith backend over HTTPS/REST, with one central PostgreSQL database.

| Backend module (diagram) | Customer feature areas |
|---|---|
| Identity | Customer account |
| Catalog | Category and subcategory browsing, service details |
| Discovery | Homepage, search, filters, venue and vendor discovery, profiles |
| Enquiry | Event requirements, enquiries |
| Quotation | Quotations |
| Booking | Bookings, availability |
| Payment | Payments |
| Administration | Back-office support for catalogue and moderation |
| **Not shown** | **Favourites, Notifications, Reviews, Customer support** |

The screenshot is cut off below the database, so more may exist. If not, these four areas need a home in the backend (D-35).
