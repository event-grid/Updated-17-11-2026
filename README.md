# EVNTGRID

India-focused event booking marketplace connecting customers with individual event vendors and event management companies.

## Getting started (after cloning)

The repository holds only source code, configuration and documentation. Libraries, build output and secrets are **not** in Git (see [What is not in Git](#what-is-not-in-git)); the steps below download and create them on your machine. Windows and PowerShell are assumed; run every command in the project folder (the folder with this README) unless a step says otherwise.

### 1. Install the tools

| Tool | Version | Check |
|---|---|---|
| Git | any recent | `git --version` |
| Java (JDK) | 25 | `java -version` |
| Node.js (includes npm) | 20.9 or later | `node -v` |
| PostgreSQL | 18, installed on Windows **or** run in Docker | `psql --version` or `docker --version` |

Maven does not need to be installed: the backend includes the Maven wrapper (`backend\mvnw.cmd`), which downloads Maven and all Java libraries itself.

### 2. Get the code

```powershell
git clone https://github.com/event-grid/web.git EventGrid
cd EventGrid
```

### 3. Your settings (`.env`)

`.env` in the project folder is the one settings file. The backend and the scripts read everything they need from it. Create it if it does not exist, with at least:

```
POSTGRES_DB=evntgrid
POSTGRES_USER=<a login name you choose>
POSTGRES_PASSWORD=<a password you choose>
DATABASE_URL=jdbc:postgresql://localhost:5432/evntgrid
SESSION_COOKIE_NAME=evg_c
SESSION_COOKIE_SECURE=false
OTP_DEV_MODE=true
OTP_TEST_PHONE=9999999999
OTP_TEST_CODE=123456
ADMIN_API_TOKEN=<a long random secret, at least 24 characters>
ADMIN_PORTAL_EMAIL=<the administrator's sign-in email>
ADMIN_PORTAL_PASSWORD=<the administrator's sign-in password>
```

The last three are for the admin portal. `ADMIN_API_TOKEN` is the secret the admin portal's server sends to the backend's administration API; the backend refuses that API while the token is empty. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. The frontends read only the settings they need from this file (they never see the database or payment secrets). To link the websites in production, also set `PARTNER_PORTAL_URL`, `ADMIN_PORTAL_URL`, `CUSTOMER_SITE_URL` and `SESSION_COOKIE_DOMAIN` (see `documentation\03-architecture\PORTALS_AND_ADMIN.md`); in development the links point to the local sites.

Settings you leave out use the backend's built-in defaults (for example `BOOKING_ADVANCE_PERCENT=20` and `API_DOCS_ENABLED=true`). `.env` holds your secrets and is never committed.

### 4. Create the database (once)

Use **one** of these:

- **PostgreSQL installed on Windows:** creates the login and database from `.env`. It asks once for the password of the `postgres` admin user (chosen when PostgreSQL was installed):
  ```powershell
  powershell -ExecutionPolicy Bypass -File .\scripts\database\create-local-database.ps1
  ```
  Run it again whenever you change `POSTGRES_PASSWORD` in `.env`; otherwise the backend fails with `password authentication failed`.
- **Docker:** starts PostgreSQL 18 and Redis and creates the database from `.env`:
  ```powershell
  docker compose --env-file .env -f infrastructure/docker/compose.yaml up -d
  ```

### 5. Download the frontend libraries (once, and after `package.json` changes)

The three frontends form one npm workspace, so this single command installs the libraries for all of them into `frontend\node_modules`:

```powershell
cd frontend
npm install
cd ..
```

The backend's Java libraries are downloaded automatically by Maven in the next step.

### 6. Run

1. **Backend** (terminal 1). Builds the backend, downloads the Java libraries on the first run, and starts it on http://localhost:8080. Flyway creates or updates the tables on start:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\development\run-backend.ps1
   ```
   Ready when it prints `Started EvntgridApplication`. Check http://localhost:8080/api/public/v1/categories.
   Add `-SkipBuild` to start the last build without rebuilding. Do not use `mvnw spring-boot:run` on Windows: its argument-file classpath breaks Spring Modulith's startup scan.
2. **Customer website** (terminal 2):
   ```powershell
   cd frontend\customer-web
   npm run dev
   ```
   Open http://localhost:3000.
3. **Vendor portal** and 4. **Admin portal** (optional, one terminal each):
   ```powershell
   cd frontend
   npm run dev:provider     # http://localhost:3001  register and sign in as a vendor
   npm run dev:admin        # http://localhost:3002  admin sign-in: ADMIN_PORTAL_EMAIL and ADMIN_PORTAL_PASSWORD from .env (change the password in Settings)
   ```
   New vendors wait for an administrator's approval before they can sign in. The administrator also manages customers, bookings and the website's announcement, social links and contact details. See `documentation\03-architecture\PORTALS_AND_ADMIN.md` for what is prototype data and what is real.

Stop each with **Ctrl+C**. Redis is not used by any feature yet, so the backend runs without it; only its health check reports Redis as down.

### Tests

- Backend: `cd backend` then `.\mvnw.cmd test`. The database integration tests need Docker (Testcontainers); without Docker they fail, and the other tests still run.
- Website: see `frontend\README.md` (`npm test`, `npm run test:e2e`, `npm run api:check`). `npm run lint:all` in `frontend` lints all three applications.
- After changing an API (a controller or its request and response types), start the backend and run `node scripts\development\api-contract.mjs` to refresh `backend\openapi` and the generated clients (the customer website uses the `public` and `customer` surfaces, the admin portal the `admin` surface). `node scripts\development\api-contract.mjs --check` fails if they are out of date.

### What is not in Git

These are listed in `.gitignore`. Never commit them; each one is downloaded or rebuilt by the steps above.

| Not in Git | What it is | Recreated by |
|---|---|---|
| `.env` | Your local settings and secrets | Step 3 (create it yourself) |
| `frontend\node_modules` | Frontend libraries | Step 5, `npm install` |
| `backend\target`, `backend\.run` | Compiled backend and its jar | Step 6, `run-backend.ps1` |
| `.next`, `next-env.d.ts`, `*.tsbuildinfo` | Next.js and TypeScript build output | `npm run dev` / `npm run build` |
| `test-results`, `playwright-report`, `coverage` | Test output | Running the tests |
| `.vscode`, `.idea` | Personal editor settings | Your editor |

Committed on purpose, so everyone gets the same library versions: `frontend\package.json`, `frontend\package-lock.json`, each application's `package.json`, `backend\pom.xml` and the Maven wrapper (`backend\mvnw`, `backend\mvnw.cmd`, `backend\.mvn`).

### Contributing changes

```powershell
git pull
git status          # check that .env and no node_modules, target or .next folder are listed
git add -A
git commit -m "Short description of the change"
git push
```

## One repository

Everything lives in **one Git repository** rooted at the **project folder**: the folder that contains this README. The three frontend applications, the backend, infrastructure, documentation and scripts are all inside it. The project folder can be anywhere, on the Desktop: `C:\Users\<you>\OneDrive\Desktop\EventGrid\EventGrid`. No document or script depends on a fixed path.

- There is exactly one `.git` folder, in the project folder, and one root `.gitignore`.
- Never run `git init` inside `frontend\...` or `backend`.
- The folder script never runs Git. You run `git init` yourself, once, at the root (step 2 below).
- The generators add their own `.gitignore` files inside each application. That is normal. They do not create repositories.

## Layout

| Folder | Contents | Release |
|---|---|---|
| `frontend/customer-web` | Customer website (www.evntgrid.com) | MVP |
| `frontend/provider-portal` | Vendor portal (partner.evntgrid.com): vendor registration, sign-in and service details | Prototype (provider data is in a local development file, not yet in the backend) |
| `frontend/admin-portal` | Admin portal (admin.evntgrid.com): dashboard, vendors, customers, bookings, commission, website settings, profile, settings | Customers and bookings use the backend; vendors and site settings are prototype data |
| `backend` | One Spring Boot modular monolith (Java 25, Spring Modulith, Maven) serving all three applications | MVP |
| `infrastructure` | Docker, AWS, Terraform and monitoring files | As needed |
| `documentation` | Requirements, architecture, database, security and workflow documents | Ongoing |
| `scripts` | Developer, database and utility scripts | As needed |

The folders `frontend\customer-web`, `frontend\provider-portal`, `frontend\admin-portal` and everything inside `backend` are **not created by the script**. The official generators create them (see below).

## Rules that apply everywhere

- The three frontends are separate applications. They share no code package and never connect to the database.
- There is one backend and one PostgreSQL database. Only the backend reads or writes it.
- No secrets in the repository. Your settings live in `.env`, which is ignored by Git.

## How the repository was first created (history)

**Not needed after cloning.** These steps were run once, on 2026-11-11, to create the project. Do not run the generators again: the applications already exist. To set up a cloned copy, follow [Getting started](#getting-started-after-cloning).

All commands below are run in a terminal opened in the project folder. In VS Code, open the project folder with **File > Open Folder**, then **Terminal > New Terminal** opens there.

1. Run `scripts\utilities\create-evntgrid-structure.ps1` (folders and starter files only). Saved in that folder, it finds the project folder by itself.
2. Once: `git --version` (Git for Windows must be installed), then `git init`.
3. Generate the three Next.js applications: follow `frontend\README.md`.
4. Generate the backend: follow `documentation\03-architecture\BACKEND_SETUP.md`.
5. Check that no nested repository exists. Run this in the project folder. It should print nothing:

```powershell
Get-ChildItem -Path .\frontend\customer-web, .\frontend\provider-portal, .\frontend\admin-portal, .\backend -Force -Directory -Filter .git -ErrorAction SilentlyContinue
```

## Status

Generated projects and planned folders exist (2026-11-11): the three Next.js applications (create-next-app 16.4.6) and the backend (Spring Initializr, Spring Boot 4.1.2, Java 25). Empty planned folders hold a `.gitkeep`.

**Implemented features** (records in `documentation\10-project-management\`):

1. Category browsing: backend `catalog` module; customer-web home, `/categories` and `/categories/[slug]` (`FEATURE_01_CATEGORY_BROWSING.md`).
2. Search: backend `discovery` module; header search box and `/search` page (`FEATURE_02_SEARCH.md`).
3. API contract and tests: an OpenAPI document per API surface (springdoc), a generated website client with a drift check, Vitest unit tests and Playwright end-to-end tests.


4. Customer sign-in by one-time code (owner request 2026-11-12): backend `identity` module (`/api/public/v1/sign-in/codes`, `/api/public/v1/sessions`, `/api/customer/v1/me`); header **Sign in** button and `/sign-in` page. Email codes go out over SMTP (`SMTP_*` in `.env`). No SMS gateway is chosen yet (`SMS_*` are placeholders), so mobile codes work only with `OTP_DEV_MODE=true`, which shows the code on screen and enables the dummy number `OTP_TEST_PHONE` / `OTP_TEST_CODE`. Never enable `OTP_DEV_MODE` in production. Sessions are in memory for now (Redis later).

5. Marketplace and shopping (owner decisions 2026-11-13: fixed-price packages bought through a cart, an advance paid with Razorpay, favourites in the MVP, demo data): venues with what each owner allows (SR-2), services that adapt to a chosen venue (SR-1), provider pages and packages (`catalog`, `provider`), favourites (`customer`), cart, checkout and bookings (`booking`), Razorpay orders, signature checks and webhook (`payment`), in-app notifications (`notification`). Website: `/venues`, `/services`, `/vendors/[slug]`, `/cart`, `/account` (overview, bookings, favourites, notifications, profile), plus information and legal placeholder pages. Checkout needs Razorpay test keys in `.env`; without them the cart shows that online payment is not available yet. Demo data lives in `backend/src/main/resources/db/demo` and is switched off with `DEMO_DATA_MIGRATIONS=` (empty).

**Waiting on owner decisions:** SMS provider, Razorpay account and keys, provider confirmation of bookings (D-22), cancellation and refunds (D-25), how the balance is paid (D-24), legal pages (D-34), whether enquiries need an account (D-29), and enquiries (D-18, D-19, D-21), see `documentation\10-project-management\DECISION_BRIEF_ENQUIRY_FLOW.md`.

Business decisions that are still open are listed in `documentation\01-business\CUSTOMER_REQUIREMENTS_GAPS.md` and `documentation\03-architecture\ARCHITECTURE_DECISIONS.md`.

---

# Run the demo on a new computer (no help needed)

This section is for anyone who receives the project and wants to see every page with data in it. It takes about 15
minutes the first time, most of it downloading packages. Windows is assumed.

## What you get

Nothing has to be typed in by hand. The first start of the backend creates the whole database, including demo data:

| What | Where you see it |
|---|---|
| 12 event categories with their services and options | customer site, Explore events |
| 14 demo vendors, 6 demo venues and their packages | customer site, Venues and Services |
| 276 demo vendors (6 for each service), listed on every service page | customer site, Vendors |
| 7 sample registered vendors (6 approved with services and prices, 1 waiting for approval) | vendor portal, admin portal, customer site Vendors |
| 6 sample customers and 6 bookings (4 paid, 1 awaiting payment, 1 failed), 5% commission recorded on each | admin portal Customers, Bookings, Commission; customer My bookings |

Everything demo is marked "Demo" or starts with "Demo", and every business is fictional.

## 1. Install these once

| Tool | Version | Download | Check in a terminal |
|---|---|---|---|
| Java (JDK) | 25 | https://adoptium.net | `java -version` |
| Node.js | 20.9 or newer (LTS is fine) | https://nodejs.org | `node -v` |
| PostgreSQL | 18 | https://www.postgresql.org/download/windows/ | `psql --version` (or check Start menu) |
| Git | any | https://git-scm.com | `git --version` |

When PostgreSQL asks for a password for the `postgres` user, choose one and **remember it**: the setup asks for it once.
Keep the default port 5432. Close and reopen the terminal after installing, so the new tools are found.

## 2. Get the project

```powershell
git clone https://github.com/event-grid/Updated-17-11-2026.git EventGrid
cd EventGrid
```

(If you were sent the project as a zip file instead, unzip it and open a terminal in the unzipped folder.)

## 3. Set it up (once)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\development\setup-demo.ps1
```

It checks the tools, creates the `.env` settings file with generated secrets, creates the database (it asks **once** for the
`postgres` password from step 1), installs the website packages and copies in the sample vendors. At the end it prints
the **admin login**. Write it down; it is also saved in the `.env` file (`ADMIN_PORTAL_EMAIL`, `ADMIN_PORTAL_PASSWORD`).

## 4. Start everything

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\development\start-demo.ps1
```

Four windows open (backend and three websites). The first start builds the backend and creates the database tables and
demo data, which takes 2 to 5 minutes; the script waits and then opens the customer site. Leave the four windows open
while you use the project; close them to stop it.

| Website | Address |
|---|---|
| Customer site | http://localhost:3000 |
| Vendor portal | http://localhost:3001 |
| Admin portal | http://localhost:3002 |
| Backend (API) | http://localhost:8080 |

The websites compile each page the first time it is opened, so the first visit to a page can take a few seconds.

## 5. Logins

| Who | How to sign in |
|---|---|
| **Administrator** (admin portal) | email `admin@evntgrid.local` and the password printed by the setup (also in `.env` as `ADMIN_PORTAL_PASSWORD`) |
| **Vendor** (vendor portal) | any sample vendor, for example `aarav.lens@example.com`, `saffron.table@example.com`, `marigold.decor@example.com`, `glow.makeup@example.com`, `beats.bash@example.com`, `little.joys@example.com`. Password for all of them: `Vendor@Demo2026`. `newbie.events@example.com` is still waiting for approval, so it cannot sign in until the admin approves it. |
| **Customer** (customer site, Sign in) | choose "Use dummy number" (9999999999, code 123456), or use `9000000001`, `9000000002` or `9000000003` (the sample customers with bookings). Codes are shown on the screen in demo mode: no SMS is sent. |

## 6. What to look at

- **Customer site (3000):** Explore events, open a category, a service and a vendor listing; Venues; Vendors (search and filters);
  grid and list switch; How it works; sign in and open My account, Bookings and Profile (add an email with a one-time code).
- **Vendor portal (3001):** sign in as a vendor, open the Dashboard (services with prices and the live commission), Profile and Settings.
  Register a new vendor, then approve it in the admin portal.
- **Admin portal (3002):** Dashboard, Vendors (approve, add, edit, delete), Customers (suspend, reactivate), Bookings (with
  commission and what the vendor receives), Commission (raise or lower the rate), Website (announcement bar, social links,
  contact details, which pages are shown), Profile and Settings.
- Changes made in one website appear in the others within a second, without reloading.

Not available in the demo: real payments (they need Razorpay keys) and real SMS or email delivery.

## Something went wrong?

| Problem | What to do |
|---|---|
| `setup-demo.ps1` says a tool was not found | Install it from the table in step 1, close and reopen the terminal, run the script again. |
| "password authentication failed" in the backend window | The database password does not match `.env`. Run `setup-demo.ps1` again (it re-sets the database login to the password in `.env`). |
| "Port 8080 (or 3000, 3001, 3002) was already in use" | An earlier copy is still running. Close its windows, or restart the computer, then run `start-demo.ps1` again. |
| A website shows an error right after starting | Wait for the backend window to print `Started EvntgridApplication`, then reload the page. |
| The admin portal says the backend is not connected | The backend is not running yet, or `ADMIN_API_TOKEN` in `.env` was changed after it started. Restart with `start-demo.ps1`. |
| Pages look unstyled or old after changing files | Close that website's window and run `start-demo.ps1` again. |
| You want the demo back to its first state | Close the four windows, delete the folder `frontend\.demo-data`, then run `setup-demo.ps1` (to restore the sample vendors) and, to reset the database too, ask PostgreSQL to drop it: in a terminal `psql -U postgres -c "DROP DATABASE evntgrid;"`, then run `setup-demo.ps1` and `start-demo.ps1` again. |

## Share your own database exactly as it is

You do not need this to share the project, because the demo data is created automatically. Use it only to hand over
the current state of your database, for example the bookings you made while testing:

```powershell
# on your computer: saves everything into evntgrid-database.sql (it contains customer phone numbers and emails)
powershell -ExecutionPolicy Bypass -File .\scripts\database\export-database.ps1

# on the other computer, after setup-demo.ps1 and with the backend stopped (this REPLACES that database):
powershell -ExecutionPolicy Bypass -File .\scripts\database\import-database.ps1 -InFile .\evntgrid-database.sql
```

The vendors, website settings and admin password are not in the database: the sample vendors and website settings come from
`frontend\demo-seed`, and your own live ones are in `frontend\.demo-data` (copy that folder too if you want them).
