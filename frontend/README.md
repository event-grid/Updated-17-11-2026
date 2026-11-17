# Frontend

Three separate Next.js applications in one repository. They share no code package and never connect to the database. Each one calls the backend only.

## Installing packages (npm workspace)

`frontend\package.json` makes the three applications one npm workspace, so the packages they all use (Next.js, React, Tailwind, ESLint, TypeScript) are installed **once**, in `frontend\node_modules`, with one `frontend\package-lock.json`. Only the installed packages are shared; the applications still share no code.

- Install or update packages from the `frontend` folder: `npm install`. There is no `package-lock.json` or full `node_modules` inside the application folders any more. A small `<app>\node_modules` can appear when an application needs a different version of a package than the others.
- Add a package to one application from the `frontend` folder: `npm install <package> -w customer-web` (or `-w provider-portal`, `-w admin-portal`).
- Run scripts inside the application folder as before (`npm run dev`, `npm test`), or from `frontend` with `npm run dev -w customer-web`.
- Keep shared packages on the same version in all three `package.json` files (for example `@types/node`). A different version makes npm install a second copy inside that application.
- `overrides` in `frontend\package.json` (2026-11-15) force patched versions of two indirect packages that `npm audit` flagged: `basic-ftp` (through `@openapitools/openapi-generator-cli`) and `minimatch` under `@typescript-eslint/typescript-estree` (through `eslint-config-next`). Remove each override once the parent package ships the fix itself, then check with `npm audit`. After changing overrides, delete `node_modules` and `package-lock.json` in `frontend` and run `npm install`, because npm keeps the versions already in the lock file.

| Application | Destination folder | Host | Release |
|---|---|---|---|
| customer-web | `frontend\customer-web` | www.evntgrid.com | MVP |
| provider-portal | `frontend\provider-portal` | partner.evntgrid.com | Prototype (dev port 3001) |
| admin-portal | `frontend\admin-portal` | admin.evntgrid.com | Prototype (dev port 3002) |

Paths are relative to the **project folder** (the folder with the root `README.md`). It can be anywhere.

**Status (2026-11-11): all three applications have been generated** with create-next-app 16.4.6, and the planned folders below have been added. The steps are kept for reference. **Never create an application folder by hand.** If one ever has to be regenerated, the generator needs the folder to be missing.

## Before you start

1. Install Node.js 20.9 or later (the current LTS is fine). Check with `node -v`.
2. Open a terminal in the project folder (in VS Code: **Terminal > New Terminal**). Go to the frontend folder: `cd frontend`
3. Check that the application folder does not exist yet. This must print `False`:

```powershell
Test-Path .\customer-web
```

If it prints `True`, stop. Look inside the folder in File Explorer. Do not generate into it until you understand what is there.

## Generate customer-web (MVP)

Run this from the `frontend` folder:

```powershell
npx create-next-app@16.4.6 customer-web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --no-agent-feedback --yes
```

- If it asks `Ok to proceed? (y)`, type `y` and press Enter. It then installs packages, which takes a few minutes.
- `--src-dir` gives you the `src` folder. `--app` selects the App Router. `--disable-git` stops the generator creating a repository inside the application. `--no-agent-feedback` skips the optional feedback step.
- `16.4.6` is the current stable Next.js 16 release (checked 2026-11-11). Pinning it keeps all three applications on the same version (ADR-026). Use the same version for provider-portal and admin-portal unless a newer one is approved.
- The generator also writes its own `.gitignore`, `README.md` and `AGENTS.md` inside the application. Leave them.

Provider-portal and admin-portal were generated the same way, replacing `customer-web` with `provider-portal` or `admin-portal`. They now hold working prototypes; see `documentation\03-architecture\PORTALS_AND_ADMIN.md`.

## After generation: add the planned folders

Only after `customer-web` has been generated, go back to the project folder (`cd ..` from `frontend`) and run this there. It only creates folders that are missing, and never touches existing files:

```powershell
$app = Join-Path (Get-Location).Path 'frontend\customer-web'
if (-not (Test-Path -LiteralPath (Join-Path $app 'package.json'))) { Write-Host "No package.json in $app. Either customer-web is not generated yet, or this terminal is not in the project folder. Stop." }
else {
    $folders = 'src\components','src\features','src\hooks','src\lib','src\vendors','src\stores','src\types','src\config','tests'
    $features = 'home','categories','event-types','venues','vendors','search','filters','services','event-requirements','enquiries','quotations','bookings','notifications','profile','support'
    $all = @($folders) + ($features | ForEach-Object { "src\features\$_" })
    foreach ($f in $all) {
        $p = Join-Path $app $f
        if (-not (Test-Path -LiteralPath $p)) {
            New-Item -ItemType Directory -Path $p | Out-Null
            New-Item -ItemType File -Path (Join-Path $p '.gitkeep') | Out-Null
            Write-Host "Created $p"
        }
    }
}
```

`public\` and `src\app\` are created by the generator. The other two applications got the same folders without the `$features` list, plus an empty `src\features\` (their features are not defined yet).

## Folder meaning (inside each application)

| Folder | Purpose |
|---|---|
| `public/` | Static files (generator) |
| `src/app/` | Next.js routes, layouts, loading and error boundaries (generator) |
| `src/components/` | Shared UI. `components/ui` holds shadcn/ui components when you add them. `components/layout` holds navigation and page frames |
| `src/features/` | One folder per feature. A feature never imports another feature's internals |
| `src/hooks/` | Shared React hooks |
| `src/lib/` | Utilities and API access. `lib/api/generated` is OpenAPI Generator output and is never edited by hand. `lib/api/client.ts`, `lib/query` and `lib/server` are created when needed |
| `src/providers/` | React context providers, for example the TanStack Query provider |
| `src/stores/` | **Kept empty.** See below |
| `src/types/` | Shared TypeScript types that are not generated from the API |
| `src/config/` | Public, non-secret configuration |
| `tests/` | Vitest and Playwright tests |

## Client state: no store library

The `stores/` folder stays empty. **No client-state library is approved**, and Zustand, Redux and similar libraries must not be added. Use TanStack Query for data from the backend, and React's built-in state (`useState`, `useReducer`, context) for local screen state.

## MVP customer features and deferred features

Customer-web feature folders (created): home, categories, event-types, venues, vendors, search, filters, services, event-requirements, enquiries, quotations, bookings, notifications, profile and support.

**FUTURE / DEFERRED (not MVP):** favourites and reviews. Their folders exist (empty) so the structure is ready, but nothing is built for them in the MVP. Their requirements are kept in `documentation\02-product\customer`.

Payments are not part of the MVP until decision D-24 is made.

## Dockerfiles

Where each application's Dockerfile lives is **not decided yet**. The architecture documents place it in the application folder. The infrastructure folder also has a `docker` folder. Nothing is created until this is decided.
## API client (generated)

customer-web calls the backend only through the client in `src/lib/api/generated/public`, generated by OpenAPI Generator 7.26.0 (`typescript-fetch`) from `backend/openapi/public-v1.json`. Never edit it by hand. Server code uses it through `src/lib/server/public-api.ts`.

After changing a backend endpoint, with the backend running:

```powershell
npm run api:generate   # export the contract from the backend and regenerate the client
npm run api:check      # fails if the contract or the client is out of date
```

API documentation while the backend runs: http://localhost:8080/swagger-ui.html (disabled in production).

## Tests (customer-web)

```powershell
npm test               # unit tests (Vitest)
npm run test:e2e       # end-to-end tests (Playwright, in the installed Microsoft Edge)
```

End-to-end tests need the backend running with its catalogue; they start `npm run dev` themselves if it is not already running. They run at laptop and phone sizes. React Testing Library is not added yet (TA-13).

## Running the applications

From the `frontend` folder, one terminal each:

| Command | Application | Address |
|---|---|---|
| `npm run dev:customer` | customer-web | http://localhost:3000 |
| `npm run dev:provider` | provider-portal | http://localhost:3001 |
| `npm run dev:admin` | admin-portal | http://localhost:3002 |

Settings come from the project's root `.env` (each application reads only the names it needs, see `load-root-env.ts` in each application). `npm run lint:all` lints all three.
