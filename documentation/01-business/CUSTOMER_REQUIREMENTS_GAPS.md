# EVNTGRID — Customer Requirements Gaps

| | |
|---|---|
| **Source** | `main eventgrid.docx`, the owner's brief, the architecture diagram, and the Project description |
| **Status** | Open: requires owner input |

**Priority key**

| Priority | Meaning |
|---|---|
| **P0** | Needed before development of the customer application starts |
| **P1** | Needed before the affected feature is built |
| **P2** | Can be settled during or after the first release |

## 1. What the document covers

| Topic | Coverage |
|---|---|
| Main categories | Complete list of 12 |
| Sub Services | 11 of 12 sections; Surprise Events absent |
| Event types | Weddings and Meetups only |
| Service options | Mainly Weddings; most other services are name only |
| Behaviour rules | 2 display rules on p.1, plus 1 food qualifier on p.2 |
| Screens and features | None |
| Enquiry, quotation, booking, payment | None |
| Accounts, favourites, notifications, reviews, support | None |
| Cancellation, refund, commission, terms | None |

## 2. Conflicting or inconsistent information

| ID | Conflict | Where | Effect | Decision |
|---|---|---|---|---|
| C-01 | 12 Main Services but 11 Sub Services sections; Surprise Events has no content, so later numbers do not line up | p.1 vs p.2–6 | A listed category has no content | D-02 |
| C-02 | Most categories have two or three different names | Catalogue section 2 | Unclear customer-facing names | D-01 |
| C-03 | "College Events" vs "College and School Events" | p.1 vs p.5 | Schools may or may not be in scope. The brief uses the wider name | D-01 |
| C-04 | "filtered by venues" (source) vs "selected venues" (brief) | p.1 vs brief | Different filter behaviour is possible | D-13 |
| C-05 | "not availed" vs "does not allow" within the source, and "allow/provide" in the brief | p.1 vs brief | Prohibited and simply not provided are different facts | D-14 |
| C-06 | Automatic filters could hide the service that SR-2 requires to be displayed | SR-1 vs SR-2 | Both rules cannot hold if filtering hides unavailable services | D-13 |
| C-07 | Photography options differ: "pre-wedding, wedding" vs "Wedding shoot, Party Shoots, General Photographs, Festives" | p.2 vs p.3–4 | Pre-wedding is absent from the Photography category | D-07, D-12 |
| C-08 | Main Services mix different kinds of thing: occasions (Birthday), services (Photography), provider types (Event Managers, Surprise Events Planners) and places (Venue) | p.1 | Affects navigation and data structure | D-07 |
| C-09 | "Weddings + Reception" vs "Weddings and Events", while the Sub Types are almost all weddings and do not include Reception | p.1 vs p.2 | Category boundary is unclear | D-03 |
| C-10 | Only Return Gifts is marked optional, which could imply all others are required | p.4 | Affects whether any services are mandatory | D-08 |
| C-11 | Overlapping terms: Tent / Pandal System / Pandals and lightings / Pandal and decorator’s; Music / Music & Dj’S / Dance & DJ’s / DJ’s and lightnings | Multiple | Unclear whether one service or several | D-12 |
| C-12 | "Veg and Non-Veg(same/diff vendors)" vs "Veg and non veg Caterings" | p.2 vs p.4 | May or may not be the same offering | D-16 |
| C-13 | Same/different vendors appears only on wedding food; the brief states it generally | p.2 vs brief | Scope is unclear | D-16 |
| C-14 | Jewellery is Rental under Wearables at weddings, but under Makeup with no rental mark at Baby Shower | p.2 vs p.4 | Inconsistent classification | D-10 |
| C-15 | The Project description says "like amazon or flipkart" (cart and direct purchase), whereas the brief describes enquiry and quotation | Project vs brief | Different core buying models | D-17 |
| C-16 | Customer app comes first, yet its data and quotations depend on providers whose portal comes later | Brief | The customer journey cannot complete without an interim process | D-18 |
| C-17 | Brief lists Favourites, Notifications, Reviews and Support; the visible backend modules do not include them | Brief vs diagram | Possible architecture gap | D-35 |
| C-18 | Source list formatting: "11. Pandal System" is typed inside item 10; Baby Shower onward continues the list numbering of the Foods items | p.2, p.4 | Extraction interpretation only | A-02 |

## 3. Assumptions used in these documents

Please correct any that are wrong.

| ID | Assumption |
|---|---|
| A-01 | The 12 names in the owner's brief are working names; source names are preserved alongside them |
| A-02 | "Music & Dj’S 11. Pandal System" is two separate services |
| A-03 | Sub Services sections match Main Services by meaning, with Surprise Events omitted |
| A-04 | Text after a dash or colon on a service line gives that service's options or attributes |
| A-05 | "Photographers" corresponds to Photography, and "Foods" to Catering |
| A-06 | The owner's restatements of the source rules show intent but do not replace the source wording |
| A-07 | The main transaction flow is enquiry, quotation, acceptance and booking, as listed in the brief |
| A-08 | "lightnings" means lightings. Used for analysis only; the source text is preserved |
| A-09 | `customer-web` is a web application, based on the architecture diagram |
| A-10 | All three applications use one central backend and one PostgreSQL database |
| A-11 | "Provider" covers individual vendors, venue owners and event management companies |

## 4. Decisions needed

### Catalogue

| ID | Priority | Decision needed | Questions |
|---|---|---|---|
| D-01 | P0 | Customer-facing names and spellings | Which name is final for each of the 12 categories? Are the spelling items in catalogue section 9 to be corrected? Are schools included in C10? |
| D-02 | P0 | Surprise Events | What event types, services and options belong here? Until then, is it displayed, marked "coming soon", or routed to planners? |
| D-03 | P1 | Reception and category scope | Is Reception a separate type with its own services? Does "Weddings and Events" mean the section covers other events? |
| D-04 | P2 | Anniversary | Should Anniversary stay under Weddings? |
| D-05 | P1 | Event Managers | What does "Social and Private Event Companies (list of events manage company)" mean? What does "all Events" cover? Does choosing a company replace individual vendors? |
| D-06 | P1 | Corporate Events | What services are offered? What is the difference between Internal and External? |
| D-07 | P0 | Navigation model | Can customers enter through occasion, service, or venue? Is a photographer under Weddings the same listing as under Photography? Can one provider appear in several categories? |
| D-08 | P1 | Completeness of service lists | Are the per-event service lists complete? What goes after "Gifts –" and the entries with trailing commas? Do other events have Sub Types? Do Sub Types change the services shown? Are any services mandatory? |
| D-09 | P1 | Venue types | What is the master list behind "all types of venues"? Is "Home" or a customer's own location a supported venue? |
| D-10 | P1 | Rental scope | Are Tent, Pandal, Costumes and Baby Shower Jewelry rental? What rental details are needed? |
| D-11 | P1 | Meaning of Cost, Type, Customised | Is Cost a fixed price, range or starting price, and per what unit? What are the values of Type? What does Customised include? |
| D-12 | P1 | Overlapping services | Are Tent and Pandal different? Is Music the same as DJ? Should the overlapping terms in C-07 and C-11 be one service or several? |

### Source rules

| ID | Priority | Decision needed | Questions |
|---|---|---|---|
| D-13 | P0 | Meaning of SR-1 | Which reading applies (see `CUSTOMER_BUSINESS_RULES.md`)? Which filters? How do several venues combine? Can customers override? Can they proceed with no venue? What happens when a venue changes? |
| D-14 | P0 | SR-2: "allow" vs "provide" | Are these separate states? Does the rule stop customers using outside vendors? |
| D-15 | P1 | SR-2: detail | What is the exact wording? What is shown when the owner has not answered? Can it vary by option (Veg vs Non-Veg) or event type? |
| D-16 | P1 | SR-3 scope | Does same/different apply to all categories? Who chooses? Are Chats, Bakeries and Soft drinks part of it? Are guest counts split? |

### Marketplace model

| ID | Priority | Decision needed | Questions |
|---|---|---|---|
| D-17 | P0 | Buying model | Quotation only, or can some services be booked directly at a fixed price? |
| D-18 | P0 | Operating before provider portal | Who loads provider and venue data? Who gets enquiries and sends quotations in the first release? Should the portal or an administrative process come first? |
| D-19 | P0 | Enquiry rules | One provider or several? Customer selects or platform matches? When are contact details shared? Is in-app messaging included? What happens when a provider does not reply? Are there limits? |
| D-20 | P1 | Quotation rules | Required content? Validity? Revisions and negotiation? Partial acceptance? What happens to other quotations? |
| D-21 | P0 | Multi-vendor booking | One booking or one per vendor? What happens to the rest if one vendor fails? |
| D-22 | P0 | Booking confirmation and terms | Who confirms? What makes a booking binding? What terms does a customer accept? Is EVNTGRID a party to the booking? |
| D-23 | P0 | Availability | Who maintains it? Is it day-level or slot-level? Is it live or confirmed on request? Are dates held? |
| D-24 | P0 | Payments | Are payments taken on EVNTGRID at the first release? Who receives funds? Any advance? Which methods? *No value is proposed.* |
| D-25 | P1 | Cancellation, refund, rescheduling | What rules apply to customers and providers? *No value is proposed.* |
| D-26 | P1 | Revenue model and tax | Commission, fees, subscriptions, sponsored placement? Who invoices? *No value is proposed.* |

### Trust and operations

| ID | Priority | Decision needed | Questions |
|---|---|---|---|
| D-27 | P1 | Provider onboarding and verification | What is checked? What is shown to customers? |
| D-28 | P1 | Reviews | Who can review? When? Moderation? Provider replies? Are venue and vendors reviewed separately? **Reviews are FUTURE / DEFERRED beyond the MVP (owner decision, 2026-11-09). The question stays open for the future release.** |
| D-29 | P0 | Accounts | Which sign-in method? Can customers browse or enquire without an account? |
| D-30 | P0 | Launch geography and language | Which cities first? How are provider service areas defined? Which languages? |
| D-31 | P1 | Notification channels | Email, SMS, WhatsApp, push? What consent is needed? |
| D-32 | P1 | Support and disputes | Which channels and hours? Who is responsible for disputes? |
| D-33 | P1 | Platforms | Is the first release web only? Is a mobile app planned? |
| D-34 | P1 | Legal and compliance | Counsel should confirm obligations, for example under the Digital Personal Data Protection Act, 2023, the Consumer Protection (E-Commerce) Rules, 2020, tax treatment, and any food-safety licensing checks on food vendors |
| D-35 | P1 | Backend coverage | Where do Favourites, Reviews, Notifications and Support live? Does the rest of the diagram show them? **Partly answered (2026-11-09):** favourites and reviews are FUTURE / DEFERRED (CD-22); notifications live in `notification`; MVP support is built minimally in `complaint` (ADR-030). The rest is still open. |

## 5. Other unanswered questions

| Area | Question | Related |
|---|---|---|
| Customers | Are customers individuals only, or also companies and colleges buying for Corporate and College/School events? | D-06 |
| Enquiry | Can a customer enquire for a service without first making an event plan? | D-19 |
| Event plan | Can a customer run several events at the same time? | D-21 |
| Venue | Can a venue owner also be listed as a vendor for their own services? | D-07, D-14 |
| Venue | How often must venue service information be re-confirmed? | D-15 |
| Rental | How do returns, damage and sizing work for Wearables? | D-10, D-25 |
| Photography | Are deliverables such as albums, video or drone part of Photography? The source does not mention them. | D-08 |
| Food | Are menu, per-plate pricing and minimum guest numbers needed? | D-11, D-16 |
| Gifts | Are gifts sold, customised or both? Who delivers them? | D-08 |
| Printing | Are designs, proofs and delivery part of Invitation Printers? | D-11 |
| Destination Weddings | Are vendors expected to travel, and who covers that? | D-30 |
| Mass Weddings | Do these need different enquiry details or different providers? | D-08 |
| Accessibility | What accessibility standard should the application target? | D-34 |
| Data | Is any launch supply already signed up? How many venues and vendors are expected at launch? | D-18 |

## 6. Suggested order for decisions

1. **What are we selling, and how?** D-17, D-18, D-21, D-22
2. **What do the source rules mean?** D-13, D-14
3. **What does the catalogue look like?** D-01, D-02, D-07
4. **Where and how do we launch?** D-19, D-23, D-24, D-29, D-30
5. **Everything marked P1**, as each feature comes up for build
