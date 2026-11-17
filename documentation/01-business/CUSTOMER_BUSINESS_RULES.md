# EVNTGRID — Customer Business Rules

| | |
|---|---|
| **Source** | `main eventgrid.docx` and the owner's brief |
| **Status** | Draft for owner review |
| **Key point** | The document contains **three** behaviour-related statements. Everything beyond them is a catalogue fact, a proposal, or undefined. |

## 1. Status of rules

| Status | Meaning | May development rely on it? |
|---|---|---|
| **CONFIRMED** | Stated in the document | Yes, within the limits of its wording |
| **INTERPRETATION NEEDED** | Stated, but with more than one valid reading | Only after the owner chooses a reading |
| **PROPOSED** | Business analyst's suggestion | Only after approval |
| **UNDEFINED** | No rule exists | **No. Do not build or assume a rule.** |

## 2. Source rules

### SR-1 — Automatic filters based on venues

| | |
|---|---|
| **Source (p.1, verbatim)** | "All filter should be applied automatically based on filtered by venues." |
| **Owner's brief** | "Filters should be automatically applied based on selected venues." |
| **Status** | CONFIRMED that the rule exists; INTERPRETATION NEEDED on how it behaves (D-13) |

**What is certain**

- Filtering must happen automatically, without the customer setting each filter by hand.
- Venues are the driver of that automatic filtering.
- The source says "All filter", so the rule is not limited to one filter type.

**Wording difference to preserve**

The source says "filtered by venues"; the brief says "selected venues". "Filtered" could describe a set of results, and "selected" suggests a specific choice. The source wording stays authoritative until the owner confirms that the brief's wording is the intended meaning.

**Possible readings (none has been chosen)**

| Reading | Behaviour | Fits source? | Fits brief? |
|---|---|---|---|
| A. Venue scopes services | After a venue is chosen, services and vendors shown are limited by what applies to that venue | Yes | Yes |
| B. Venue set drives filter options | Available filters and values change to reflect the venues currently in the results | Yes | Partly |
| C. Venue context carries forward | Details tied to the venue (for example its location) are automatically applied to later vendor searches | Yes | Yes |
| D. Instant filtering | Filters apply without an "Apply" button | Weak: this does not depend on venues | Weak |

A, B and C can coexist. **Analyst's recommendation, for approval only:** adopt A and C, and treat B as a supporting behaviour. D is a UI choice and does not satisfy the rule alone.

**Implications**

- Venues need structured data that filters can read; the document names only Cost and Type, and only for wedding venues.
- Discovery depends on venue-level service data, which venue owners will supply through the provider application that is being built later (D-18).
- Automatic filters should be visible to the customer, or results could look incomplete without explanation (proposal).

**Edge cases requiring an answer under D-13**

1. "venues" is plural. With several venues selected or shortlisted, is the outcome the union or the intersection of their rules?
2. May a customer turn off or override an automatic filter?
3. If the customer changes or removes the venue, what happens to services already chosen?
4. Can a customer find vendors with no venue selected? (Customers holding an event at home, or undecided on venue.)
5. Which filters count as "All filter"?

**Interaction with SR-2.** If automatic filtering simply hides what a venue does not offer, the customer never sees the message SR-2 requires. Filtering must therefore not silently remove a service to which SR-2 applies. This preserves both rules as written and is the one interaction that needs handling however D-13 is answered.

---

### SR-2 — Show when the venue owner does not allow a service

| | |
|---|---|
| **Source (p.1, verbatim)** | "If any of service is not availed by venue owner. It should be displayed like: the owner does not allow xyz services." |
| **Owner's brief** | "If a venue owner does not provide a service, show that the owner does not allow/provide that service." |
| **Status** | CONFIRMED that the message must appear; INTERPRETATION NEEDED on "allow" versus "provide" (D-14, D-15) |

**What is certain**

- The rule is at the level of a venue owner and a service.
- The unavailable service must be **shown as unavailable**, with an explicit message. It must not simply be absent.
- The source's model message is: "the owner does not allow xyz services", where xyz is the service.

**The central ambiguity**

"Not availed" could mean the owner does not make the service available. "Does not allow" could mean the owner prohibits it. The brief says "allow/provide". These are different facts for a customer:

| Situation | What it means to the customer | Source message accurate? |
|---|---|---|
| Venue provides the service itself | Can be arranged with the venue | Message not needed |
| Venue does not provide it, outside vendors **permitted** | Customer can bring a vendor | "does not allow" would be misleading |
| Venue does not provide it, outside vendors **prohibited** | Customer cannot have this service at this venue | Accurate |
| Owner has given no information | Unknown | Message would be unsupported |

This matters most because the brief includes finding additional vendors for an event at a venue. Whether a customer can add an outside vendor for a service depends on this distinction. **Until D-14 is decided, the document's wording must be displayed as given and no rule about outside vendors may be implied.**

**Implications**

- The system needs a per-venue, per-service record, covering each service relevant to that venue.
- The record has to come from the venue owner. The provider portal is planned for later, so an interim source is needed (D-18).
- A missing record must not automatically produce "does not allow" (D-15). Otherwise a venue that simply has not completed its profile would appear to prohibit services.
- The statement is attributed to the owner, so it needs to be accurate and maintainable.

**Questions under D-14 and D-15**

1. Should the words be exactly "the owner does not allow xyz services", or a different message for "does not provide"?
2. Does the message prevent the customer from adding an outside vendor for that service at that venue, or only inform them?
3. Which services does it apply to: all services in the catalogue, or those relevant to the selected event type?
4. Can it apply at option level, such as a venue that permits Veg but not Non-Veg? Or by event type?
5. What is displayed when the owner has not answered?

---

### SR-3 — Same or different vendors for veg and non-veg food

| | |
|---|---|
| **Source (p.2, verbatim)** | "Food – Veg, Non-Veg, Veg and Non-Veg(same/diff vendors), Chats and Bakeries" |
| **Owner's brief** | "Food may be provided by the same or different vendors for veg and non-veg options." |
| **Status** | CONFIRMED for wedding food; scope beyond weddings is a decision (D-16) |

**What is certain**

- For wedding food, a combined veg and non-veg requirement may be met by one vendor or by two.
- Both arrangements must be possible. Neither is the default in the source.
- "Veg", "Non-Veg" and the combined option are separate listed options.

**Scope difference to preserve**

The qualifier appears only on the Weddings food line. The Foods section lists "Veg and non veg Caterings", "Veg" and "Non veg" without it. Meetups, Birthday, Baby Shower, Outdoor and College/School list food with no detail. The brief states the rule without a category limit, which suggests wider intent. D-16 needs to confirm this.

**Implications**

| Area | Implication |
|---|---|
| Customer requirement | The customer needs a way to express veg only, non-veg only, or both; and, for both, one vendor or two |
| Vendor capability | Vendors need to be identifiable as offering veg, non-veg or both |
| Enquiries | One food requirement can become enquiries to two vendors |
| Quotations | A customer may compare one combined quotation against two separate ones |
| Booking | Two food vendors may be attached to a single event, which depends on D-21 |
| Venue rules | Interacts with SR-2 if a venue restricts one food type at option level (D-15) |

**Open questions under D-16**

1. Does same/different apply to all categories with food?
2. Does the customer choose the arrangement, or can the provider propose it?
3. Can a vendor offering both be used for only one of them?
4. How are "Chats and Bakeries" and "Soft drinks" treated: as part of the food arrangement or as separate vendors?
5. Are guest numbers captured separately for veg and non-veg?

## 3. Catalogue rules stated in the document

These are direct facts from the source. Details are in `EVENT_CATEGORY_CATALOG.md`.

| ID | Rule | Source | Status |
|---|---|---|---|
| CR-01 | There are 12 Main Services | p.1 | CONFIRMED |
| CR-02 | Weddings has 10 listed Sub Types | p.2 | CONFIRMED; D-03, D-04 |
| CR-03 | Meetups has 2 listed Sub Types | p.3 | CONFIRMED; list may be unfinished (D-08) |
| CR-04 | Wedding Venues carry Cost and Type | p.2 | CONFIRMED; meaning open (D-11) |
| CR-05 | Invitation Printers carry Type, Cost and Customised | p.2 | CONFIRMED; meaning open (D-11) |
| CR-06 | Tent carries cost and type | p.2 | CONFIRMED; meaning open (D-11) |
| CR-07 | Wedding Wearables are rental | p.2 | CONFIRMED |
| CR-08 | Baby Shower Return Gifts are optional | p.4 | CONFIRMED; other services' status is not stated (C-10) |
| CR-09 | Event Managers are "Event Companies those manage all Events" | p.5 | CONFIRMED wording; "all" is undefined (D-05) |
| CR-10 | Venues cover "all types of venues" | p.6 | CONFIRMED; no master list (D-09) |

## 4. Proposed rules (not confirmed)

| ID | Proposal | Reason | Depends on |
|---|---|---|---|
| PR-01 | Automatic filters are shown to the customer as active filters | Prevents unexplained missing results | D-13 |
| PR-02 | A service with no owner response is shown as "not confirmed" and never as "does not allow" | Avoids a false statement about the owner | D-15 |
| PR-03 | Changing a venue flags any selected service that conflicts with the new venue, rather than deleting it | Protects customer's work | D-13, D-14 |
| PR-04 | Source terms remain unchanged in the catalogue until names are approved | Follows the owner's instruction | D-01 |
| PR-05 | Categories with no source content are not populated by inference | Follows the owner's instruction | D-02, D-06 |
| PR-06 | A customer-visible price is always described according to what it actually represents | Avoids a price being read as a final quote | D-11, D-20 |
| PR-07 | Enquiry, quotation and booking are separate records with their own status | Keeps each commercial stage clear | D-17, D-21 |
| PR-08 | Any terms shown at acceptance are stored with the booking as they appeared at that moment | Allows later reference to what was agreed | D-22 |

## 5. Undefined rules — do not build or assume

The document and brief contain no rule for any of the following. This section deliberately offers no suggested values.

| Area | Status | Decision |
|---|---|---|
| Whether payments are taken on the platform | UNDEFINED | D-24 |
| Who receives customer money | UNDEFINED | D-24 |
| Advance, deposit or instalment amounts and timing | UNDEFINED | D-24 |
| Cancellation by customer or provider | UNDEFINED | D-25 |
| Refunds | UNDEFINED | D-25 |
| Rescheduling | UNDEFINED | D-25 |
| Commission, service fees, revenue model | UNDEFINED | D-26 |
| Taxes and invoicing | UNDEFINED | D-26, D-34 |
| Booking terms, including when a booking is binding | UNDEFINED | D-22 |
| Quotation validity and revision | UNDEFINED | D-20 |
| Availability holds and double-booking handling | UNDEFINED | D-23 |
| Dispute responsibility | UNDEFINED | D-32 |
| Review eligibility and moderation | UNDEFINED | D-28 |
| Provider verification | UNDEFINED | D-27 |

## 6. What the customer application needs from other applications

The customer application shares one central backend with the provider and admin portals (architecture diagram). These inputs are not produced by the customer application. Their timing is decision D-18.

| Customer capability | Data or action required | Likely origin | Available before provider portal? |
|---|---|---|---|
| SR-1 automatic filtering | Venue attributes | Provider Portal / Admin Portal | Needs interim source |
| SR-2 owner message | Per-venue service status | Provider Portal (venue owner) | Needs interim source |
| SR-3 food arrangements | Vendor veg / non-veg capability | Provider Portal | Needs interim source |
| Catalogue | Categories, services, options | Admin Portal | Needs interim source |
| Profiles | Provider and venue content | Provider Portal | Needs interim source |
| Availability | Dates or status | Provider Portal | Needs interim source and D-23 |
| Quotations | Provider's response to enquiry | Provider Portal | **Needs interim process** |
| Booking status | Provider confirmation | Provider Portal | **Needs interim process** |
| Review moderation | Administrative action | Admin Portal | Needs interim process |
