# Vendor portal, admin portal, commission and the administration API

Status: prototype (written 2026-11-17, updated the same day). This note records what is real, what is stand-in data,
and what to replace when the backend grows vendor and administrator accounts.

Naming: people see **vendors** everywhere. Inside the code the older word is kept for stable identifiers: the folder
`frontend/provider-portal`, the backend `provider` module and database schema, the API path
`/api/public/v1/providers/{slug}` and the `provider*` field names of the generated clients. Do not rename those without
changing the API contract.

## The three websites

| Website | Folder | Dev port | Talks to |
|---|---|---|---|
| Customer website | `frontend/customer-web` | 3000 | backend `/api/public/v1` and `/api/customer/v1` (browser, same-origin `/api/*`) |
| Vendor portal | `frontend/provider-portal` | 3001 | backend public catalogue and commission rate (server side) |
| Admin portal | `frontend/admin-portal` | 3002 | backend `/api/admin/v1` (server side only, with `ADMIN_API_TOKEN`) |

The applications still share no code. Each copies the few small files it needs (`lib/store.ts`, `LiveRefresh.tsx`,
`load-root-env.ts`).

## Commission (real, in the backend)

The platform keeps a percentage of every booked package; the vendor receives the rest. At 5%, a hall booked for
₹20,000 earns EVENTGRID ₹1,000 and the vendor receives ₹19,000.

- One setting, 0% to 30% with up to 2 decimals, default 5%. Table `booking.commission_setting` (one row) and
  `booking.commission_change` (every change, for the history).
- Taken only for **successful** bookings: at checkout each booked item stores the rate and the commission amount in
  force then (`booking.booking_item.commission_bps`, `commission_minor`). Changing the rate later never alters an
  existing booking. The commission counts as earned once the booking's advance is paid (`ADVANCE_PAID`).
- `GET /api/public/v1/commission` shows the rate to everyone (vendors see it while pricing).
  `GET` and `PUT /api/admin/v1/commission` read and change it (admin token only).
- The admin portal's Commission page raises or lowers the rate with a live calculator, shows the history and the
  commission earned. Booking pages show the commission and "Vendor receives" for every item.
- The vendor portal shows the rate on registration, on the dashboard and in Settings, and under every price field:
  "Commission (5%): ₹1,000 · You receive ₹19,000".

## What else is real (backend)

- **Customer email with a one-time code.** `POST /api/customer/v1/me/email/codes` sends a code to the address,
  `POST /api/customer/v1/me/email` checks it and saves the address on the account. Every saved email has been
  verified. An address used by another account is refused (`EMAIL_IN_USE`). Same code rules as sign-in.
- **Administration API** `/api/admin/v1` (OpenAPI group `admin`): customers (search, suspend, reactivate), bookings
  (list, detail, statistics) and commission. Called only by the admin portal's server with
  `Authorization: Bearer <ADMIN_API_TOKEN>` (constant-time comparison, no cookies, so no CSRF). While the token is
  empty or shorter than 24 characters every request gets 401. A suspended customer cannot sign in.

## What is prototype data (replace later)

- **Vendors** (registration, sign-in, service details, approval) live in `frontend/.demo-data/providers.json`, read and
  written by all three websites. Passwords are hashed with scrypt; sessions are random tokens whose hashes are stored
  in the same file. There is no locking between processes and no audit trail.
- **Website settings** (announcement bar, social links, contact details, which pages are shown) live in
  `frontend/.demo-data/site-settings.json`.
- **Administrator account.** The sign-in email and first password come from `ADMIN_PORTAL_EMAIL` and
  `ADMIN_PORTAL_PASSWORD` in `.env`. Changing the password in the admin portal's Settings stores a hash and the display
  name in `frontend/.demo-data/admin-account.json`, which then replaces the `.env` password (delete the file to go
  back). Changing the password signs every other browser out.
- **Live updates** (`/live/providers` in each app, Server-Sent Events) watch that folder so open pages refresh
  themselves. Pages carry the data version they were rendered with, so a change made while a page was loading is not missed.
- **Demo vendors.** The placeholder vendors listed on every service (6 per service, 276 in total) are generated from
  the catalogue and never stored.

When the backend gets vendor and administrator accounts (identity roles `PROVIDER` and `ADMINISTRATOR` already exist
in the schema): add the matching API surfaces, regenerate the clients with `node scripts/development/api-contract.mjs`,
then delete `lib/store.ts`, `lib/settings.ts`, `lib/site-settings.ts`, `lib/admin-account.ts`, `lib/provider-store.ts`,
the `live/providers` routes and `LiveRefresh`/`LiveSync`, and the `.demo-data` folder.

## Admin portal pages

Dashboard (counts, vendors waiting for approval, commission), Vendors (search, filter, add, edit, reset password,
approve, reject, delete), Customers (search, suspend, reactivate), Bookings (list and detail with commission),
Commission, Website (announcement bar, social links, contact details, which pages are shown), Profile (name, email,
role) and Settings (password, system status, sign out).

## Vendor portal pages

Dashboard (commission notice, service details with live earnings), Profile (account summary and details), Settings
(commission, change password, sign out of all browsers, delete account), plus registration and sign-in.

## Rules the prototype follows

- A vendor cannot sign in until an administrator approves the registration. Rejecting or deleting a vendor signs
  them out within a second.
- Only approved vendors appear on the customer website, and only their completed services.
- A website page switched off by the administrator disappears from the menu and footer and answers "page not found".
- The frontends read only the `.env` settings they need (never database or payment secrets). The admin API token and
  administrator password are visible to the admin portal alone.

## Settings

| Name | Used by | Meaning |
|---|---|---|
| `ADMIN_API_TOKEN` | backend, admin portal | secret for `/api/admin/v1` (at least 24 characters) |
| `ADMIN_PORTAL_EMAIL`, `ADMIN_PORTAL_PASSWORD` | admin portal | administrator sign-in (first password) |
| `PARTNER_PORTAL_URL` | customer website, admin portal | vendor portal address (links) |
| `ADMIN_PORTAL_URL` | customer website | admin portal address (footer link) |
| `CUSTOMER_SITE_URL` | vendor and admin portals | customer website address (links) |
| `SESSION_COOKIE_DOMAIN` | vendor portal | shared parent domain (for example `.evntgrid.com`) of the cookie that tells the customer website a vendor is signed in, so it can hide "For vendors" |

Without the three URL settings, development links point to the local sites and production shows no such links.
