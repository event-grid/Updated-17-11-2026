# Decision Brief — Sign-in and the Enquiry Flow

| | |
|---|---|
| **Date** | 2026-11-11 |
| **For** | Owner decision |
| **Unblocks** | Sign-in and customer account, event plans, enquiries; then quotations and bookings |
| **Decisions** | D-29 (with U-01), D-18, D-19, D-21 — all P0 in `CUSTOMER_REQUIREMENTS_GAPS.md` |

Features 1 and 2 (browsing and search) work without an account. The next milestone — a customer asking providers for quotes — needs the four decisions below. Each lists the options, what they cost, and a recommendation. **Recommendations are proposals; nothing is decided until you choose.** Answering with the letters is enough, for example "D-29: A, D-18: B, D-19: as recommended, D-21: A".

---

## 1. D-29 / U-01 — How do customers sign in, and when?

> **DECIDED (owner, 2026-11-11): email one-time code now (option B), mobile number + SMS code (option A) added later as a second method.** An implementation was built and then **removed at the owner's request (2026-11-11)**; sign-in will be rebuilt when enquiries need accounts.

**Question:** which sign-in method, and can customers browse or enquire without an account?

| Option | For the customer | Cost and lead time | Risk |
|---|---|---|---|
| **A. Mobile number + one-time code (SMS OTP)** | The most familiar sign-in in India; no password | SMS provider fees per message. Commercial SMS in India needs **DLT registration** of the sender and message templates, which takes time before launch | SMS delivery delays; OTP abuse must be rate-limited (already planned) |
| B. Email + one-time code | Familiar, no password | Email provider only; no DLT | Fewer Indian customers check email promptly |
| C. Google sign-in | One tap for Google users | Free; needs a Google Cloud project | Excludes people without Google accounts; still need a phone number for providers to call |
| D. A + C together | Choice for the customer | Sum of A and C | More to build and test |

**When an account is needed (ACC-03, ENQ-04):**

- Browsing and search: **no account** (already built that way).
- Sending an enquiry: **account required** — providers need a verified contact, and the customer needs somewhere to track replies.

**Recommendation:** **A — mobile number + SMS OTP**, account required only to send an enquiry. Start DLT registration now because it has a lead time. If launch must not wait for DLT, start with **B (email OTP)** and add A when DLT is approved; accounts stay the same.

**Also needed with A or B:** choice of SMS/email provider (TA-10).

---

## 2. D-18 — Who answers enquiries before the provider portal exists?

**Question:** the customer app comes first, but enquiries need someone to answer them.

| Option | What it means | Trade-off |
|---|---|---|
| A. Minimal provider tool alongside | Providers sign in and reply themselves | More to build before launch |
| **B. Staff-operated** | EVNTGRID staff load providers and venues and enter quotations on providers' behalf, through admin functions | Quicker to build; manual work; limited scale |
| C. Delay launch until the provider portal is ready | Customer app built first but launched together | Slowest to market; cleanest experience |

**Recommendation (from `CUSTOMER_MVP_SCOPE.md`):** **B** for a small launch area, moving to the provider portal in the next release. Choosing B also makes the `administration` module part of the MVP.

---

## 3. D-19 — Enquiry rules

**Questions and recommended answers:**

| # | Question | Options | Recommendation |
|---|---|---|---|
| 19a | One provider per enquiry, or several at once? | One / several | **Several**, so customers can compare quotations |
| 19b | Customer chooses the providers, or the platform matches? | Customer chooses / platform matches / both | **Customer chooses**, up to **5 providers per service** — matching needs data we do not have yet |
| 19c | When are contact details shared? | At enquiry / after a quotation / after acceptance | **After the customer accepts a quotation** — protects customers from spam and keeps the booking on the platform |
| 19d | In-app messaging in the first release? | Yes / no | **No.** Questions go in the enquiry's notes and the quotation's notes (messaging needs moderation rules; it is already listed as next release) |
| 19e | What if a provider does not reply? | Nothing / reminder / expiry | **Reminder after 24 hours; marked "no response" after 72 hours**, and the customer is told |
| 19f | Limits? | None / per day | **At most 10 enquiries per customer per day**, to stop misuse |
| 19g | Enquiry without an event plan? | Plan first / direct enquiry / both | **Both:** a single-service enquiry creates a small event plan automatically |

---

## 4. D-21 — One booking or one per vendor?

**Question:** when a customer books a venue, a caterer and a photographer for the same event, is that one booking or three? What if one vendor drops out?

| Option | What it means | Trade-off |
|---|---|---|
| **A. One booking per vendor, grouped under the event plan** | Each vendor's booking has its own status; the plan shows them together | Simple and fair: one vendor's problem does not cancel the others. Matches PR-07 |
| B. One combined booking | One status for the whole event | If one vendor fails, the whole booking is in question |

**If one vendor fails (A):** that booking is cancelled, the others stay confirmed, and the customer is told and can send a new enquiry for that service. Cancellation terms are D-25.

**Recommendation:** **A.**

---

## 5. What happens after you decide

| Decision | Next build |
|---|---|
| D-29 (+ provider for A/B) | Sign-in, customer profile, `/account` |
| D-18 = B | Staff tools in admin-portal for providers, venues and quotations |
| D-19 | Event plans and enquiries (`enquiry` module, customer-web `/plans`, `/enquiries`) |
| D-21 | Bookings structure, built after quotations (D-20, D-22 still needed for that step) |
