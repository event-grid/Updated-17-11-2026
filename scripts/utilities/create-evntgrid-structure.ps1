#Requires -Version 5.1
<#
.SYNOPSIS
    Creates the EVNTGRID folder structure in the project folder (revision 3).

.DESCRIPTION
    Creates folders and a few starter files only. Safe to run more than once.

    The project folder is NOT fixed. It can be anywhere (it lives on the Desktop,
    C:\Users\<you>\OneDrive\Desktop\EventGrid\EventGrid). It is found like this:
    - If -Root is given, that folder is used.
    - Otherwise the script must be saved in <project folder>\scripts\utilities, and the
      project folder is worked out from the script's own location (two levels up).

    What this script does NOT do:
    - It never deletes anything and never overwrites an existing file.
    - It never runs Git, installs packages, runs project generators, or creates AWS resources.
    - It does not create the three Next.js application folders (customer-web, provider-portal,
      admin-portal). The official Next.js generator creates them directly in frontend\.
    - It does not create anything inside backend\. The Spring Initializr ZIP is extracted there.
    - It does not create package.json, pom.xml, Java files, framework configuration or credentials.
    - It does not follow or modify symbolic links or junctions.

.PARAMETER Root
    Project folder. Optional. Without it, the folder is detected from the script location.

.PARAMETER CreateRoot
    Create the root folder if it does not exist. Without it, a missing root stops the script.

.PARAMETER DryRun
    Show what WOULD be created without creating anything.

.EXAMPLE
    .\create-evntgrid-structure.ps1 -DryRun
    .\create-evntgrid-structure.ps1
    .\create-evntgrid-structure.ps1 -Root 'E:\Projects\EventGrid' -CreateRoot -DryRun
#>
[CmdletBinding()]
param(
    [string]$Root = '',
    [switch]$CreateRoot,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ----------------------------------------------------------------------------
# Result tracking
# ----------------------------------------------------------------------------
$script:CreatedDirs  = New-Object System.Collections.Generic.List[string]
$script:ExistingDirs = New-Object System.Collections.Generic.List[string]
$script:CreatedFiles = New-Object System.Collections.Generic.List[string]
$script:ExistingFiles = New-Object System.Collections.Generic.List[string]
$script:Utf8NoBom    = New-Object System.Text.UTF8Encoding($false)

if ($DryRun) {
    $script:TagDir  = '[WOULD CREATE DIR ]'
    $script:TagFile = '[WOULD CREATE FILE]'
}
else {
    $script:TagDir  = '[CREATED DIR      ]'
    $script:TagFile = '[CREATED FILE     ]'
}

# ----------------------------------------------------------------------------
# Small helpers
# ----------------------------------------------------------------------------
function Get-EntryOrNull {
    # Returns the file-system entry (including hidden items and broken links) or $null.
    param([string]$Path)
    return (Get-Item -LiteralPath $Path -Force -ErrorAction SilentlyContinue)
}

function Test-IsLink {
    param($Entry)
    return (($Entry.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0)
}

function Get-FullPath {
    param([string]$Relative)
    $r = $Relative.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    return [System.IO.Path]::Combine($script:RootPath, $r)
}

# ----------------------------------------------------------------------------
# Find the project folder (never hard-coded)
# ----------------------------------------------------------------------------
if ([string]::IsNullOrWhiteSpace($Root)) {
    $scriptFolder = $PSScriptRoot
    if ([string]::IsNullOrWhiteSpace($scriptFolder)) {
        throw "Cannot detect the project folder. Run the script as a file, or give it with -Root."
    }
    $scriptsFolder = Split-Path -Path $scriptFolder -Parent
    $isInUtilities = ((Split-Path -Path $scriptFolder -Leaf) -ieq 'utilities') -and
                     (-not [string]::IsNullOrWhiteSpace($scriptsFolder)) -and
                     ((Split-Path -Path $scriptsFolder -Leaf) -ieq 'scripts')
    if (-not $isInUtilities) {
        throw ("Cannot detect the project folder. The script is in '$scriptFolder', not in " +
               "<project folder>\scripts\utilities. Move it there, or run it with -Root 'C:\path\to\your\project'.")
    }
    $Root = Split-Path -Path $scriptsFolder -Parent
    $rootSource = 'detected from the script location'
}
else {
    $rootSource = 'given with -Root'
}

# ----------------------------------------------------------------------------
# Root check
# ----------------------------------------------------------------------------
$fullRoot = [System.IO.Path]::GetFullPath($Root)
if ($fullRoot -eq [System.IO.Path]::GetPathRoot($fullRoot)) {
    throw "Refusing to use a drive root ('$fullRoot') as the project root."
}
$script:RootPath = $fullRoot.TrimEnd('\', '/')

Write-Host ''
Write-Host 'EVNTGRID structure script (revision 3)' -ForegroundColor Cyan
Write-Host "Project folder: $script:RootPath ($rootSource)"
if ($DryRun) { Write-Host 'DRY RUN: nothing will be created.' -ForegroundColor Yellow }
Write-Host ''

$rootEntry = Get-EntryOrNull $script:RootPath
if ($null -ne $rootEntry) {
    if (-not $rootEntry.PSIsContainer) {
        throw "'$script:RootPath' exists but is a file, not a folder."
    }
    if (Test-IsLink $rootEntry) {
        throw "'$script:RootPath' is a symbolic link or junction. Refusing to use it."
    }
    Write-Host "Root folder exists: $script:RootPath" -ForegroundColor Green
}
elseif ($CreateRoot) {
    if ($DryRun) {
        Write-Host "[WOULD CREATE DIR ] $script:RootPath (root)" -ForegroundColor Yellow
    }
    else {
        [void][System.IO.Directory]::CreateDirectory($script:RootPath)
        Write-Host "[CREATED DIR      ] $script:RootPath (root)" -ForegroundColor Green
    }
}
else {
    throw "Root folder '$script:RootPath' does not exist. Create it first, or run again with -CreateRoot."
}

# ----------------------------------------------------------------------------
# Folder and file creation
# ----------------------------------------------------------------------------
function New-BlueprintDirectory {
    # Creates the folder and any missing parents. Reports each folder it creates.
    param([string]$Relative)

    $current = ''
    foreach ($segment in ($Relative -split '/')) {
        if ($current -eq '') { $current = $segment } else { $current = "$current/$segment" }
        $full = Get-FullPath $current

        $entry = Get-EntryOrNull $full
        if ($null -ne $entry) {
            if (-not $entry.PSIsContainer) {
                throw "'$full' exists but is a file, not a folder."
            }
            if (Test-IsLink $entry) {
                throw "'$full' is a symbolic link or junction. Refusing to follow or modify it."
            }
            if (-not $script:CreatedDirs.Contains($current) -and -not $script:ExistingDirs.Contains($current)) {
                $script:ExistingDirs.Add($current)
            }
            continue
        }

        if ($script:CreatedDirs.Contains($current)) { continue }

        if ($DryRun) {
            Write-Host "  $script:TagDir $current" -ForegroundColor Yellow
        }
        else {
            [void][System.IO.Directory]::CreateDirectory($full)
            Write-Host "  $script:TagDir $current" -ForegroundColor Green
        }
        $script:CreatedDirs.Add($current)
    }
}

function New-BlueprintFile {
    # Creates a file only if nothing exists at that path. CreateNew mode makes
    # overwriting impossible even if the file appears between the check and the write.
    param(
        [string]$Relative,
        [string]$Content = ''
    )

    $full = Get-FullPath $Relative

    if ($null -ne (Get-EntryOrNull $full)) {
        $script:ExistingFiles.Add($Relative)
        Write-Host "  [ALREADY PRESENT ] $Relative (left untouched)" -ForegroundColor DarkYellow
        return
    }

    if ($DryRun) {
        Write-Host "  $script:TagFile $Relative" -ForegroundColor Yellow
        $script:CreatedFiles.Add($Relative)
        return
    }

    $parentEntry = Get-EntryOrNull (Split-Path -Path $full -Parent)
    if (($null -eq $parentEntry) -or (-not $parentEntry.PSIsContainer) -or (Test-IsLink $parentEntry)) {
        throw "Parent folder of '$full' is missing or is a link. Nothing was written."
    }

    $bytes = $script:Utf8NoBom.GetBytes($Content)
    try {
        $stream = [System.IO.File]::Open($full, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write)
    }
    catch [System.IO.IOException] {
        if ($null -ne (Get-EntryOrNull $full)) {
            # Appeared between the check and the write. Treat as already present.
            $script:ExistingFiles.Add($Relative)
            Write-Host "  [ALREADY PRESENT ] $Relative (left untouched)" -ForegroundColor DarkYellow
            return
        }
        throw
    }
    try { $stream.Write($bytes, 0, $bytes.Length) }
    finally { $stream.Dispose() }

    $script:CreatedFiles.Add($Relative)
    Write-Host "  $script:TagFile $Relative" -ForegroundColor Green
}

# ----------------------------------------------------------------------------
# Approved folder blueprint
# frontend\ and backend\ are created EMPTY. Generators fill them.
# ----------------------------------------------------------------------------
$directories = New-Object System.Collections.Generic.List[string]

foreach ($d in @('frontend', 'backend', 'infrastructure', 'documentation', 'scripts')) { $directories.Add($d) }

foreach ($d in @('docker', 'aws', 'terraform', 'monitoring')) { $directories.Add("infrastructure/$d") }

foreach ($d in @(
        '01-business', '02-product/customer', '03-architecture', '04-database', '05-design',
        '06-security', '07-workflows', '08-testing', '09-deployment', '10-project-management')) {
    $directories.Add("documentation/$d")
}

foreach ($d in @('development', 'database', 'utilities')) { $directories.Add("scripts/$d") }

# Folders that must never receive a placeholder file (generators write into them).
$noPlaceholder = @('frontend', 'backend')

# ----------------------------------------------------------------------------
# File contents (placeholders only; no credentials)
# ----------------------------------------------------------------------------
$rootReadme = @'
# EVNTGRID

India-focused event booking marketplace connecting customers with individual event vendors and event management companies.

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
| `frontend/provider-portal` | Provider portal (partner.evntgrid.com) | Future. Requirements not written |
| `frontend/admin-portal` | Admin portal (admin.evntgrid.com) | Future. Requirements not written |
| `backend` | One Spring Boot modular monolith (Java 25, Spring Modulith, Maven) serving all three applications | MVP |
| `infrastructure` | Docker, AWS, Terraform and monitoring files | As needed |
| `documentation` | Requirements, architecture, database, security and workflow documents | Ongoing |
| `scripts` | Developer, database and utility scripts | As needed |

The folders `frontend\customer-web`, `frontend\provider-portal`, `frontend\admin-portal` and everything inside `backend` are **not created by the script**. The official generators create them (see below).

## Rules that apply everywhere

- The three frontends are separate applications. They share no code package and never connect to the database.
- There is one backend and one PostgreSQL database. Only the backend reads or writes it.
- No secrets in the repository. Copy `.env.example` to `.env` locally; `.env` is ignored by Git.

## Setup order

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

Generated projects and planned folders exist (2026-11-11): the three Next.js applications (create-next-app 16.4.6) and the backend (Spring Initializr, Spring Boot 4.1.2, Java 25). No business functionality exists yet. Empty planned folders hold a `.gitkeep`. Business decisions that are still open are listed in `documentation\01-business\CUSTOMER_REQUIREMENTS_GAPS.md` and `documentation\03-architecture\ARCHITECTURE_DECISIONS.md`.
'@

$gitignore = @'
# Secrets and local configuration
.env
.env.*
!.env.example

# Node / Next.js
node_modules/
.next/
frontend/*/out/
*.tsbuildinfo
coverage/
playwright-report/
test-results/

# Java / Maven (keep the Maven wrapper)
target/
!.mvn/wrapper/maven-wrapper.properties
*.class
*.log
HELP.md

# Terraform
.terraform/
*.tfstate
*.tfstate.*
*.tfvars
crash.log

# Editors and operating systems
.idea/
*.iml
.vscode/
.DS_Store
Thumbs.db
'@

$envExample = @'
# Local development only. Copy to .env and fill in. Never commit .env.
# Placeholders only: no real value belongs in this file.
# The frontends need no secrets. They call the backend through same-origin routing.
# Names below follow SYSTEM_ARCHITECTURE.md and DEPLOYMENT_ARCHITECTURE.md.
# Resource names are NOT decided. Replace change_me with real names later.

# --- PostgreSQL (backend only) ---
POSTGRES_DB=evntgrid
POSTGRES_USER=change_me
POSTGRES_PASSWORD=change_me
DATABASE_URL=jdbc:postgresql://localhost:5432/evntgrid

# --- Redis (backend only) ---
REDIS_HOST=localhost
REDIS_PORT=6379

# --- AWS region (AWS Mumbai is the recommended region, AR-10) ---
AWS_REGION=ap-south-1

# --- S3: three buckets (SYSTEM_ARCHITECTURE.md section 5) ---
S3_PUBLIC_MEDIA_BUCKET=change_me
S3_PRIVATE_DOCUMENTS_BUCKET=change_me
S3_QUARANTINE_UPLOADS_BUCKET=change_me

# --- SQS: every queue has a dead-letter queue (DLQ) ---
# The queue list is illustrative (DEPLOYMENT_ARCHITECTURE.md section 5) and not final.
SQS_NOTIFICATIONS_QUEUE=change_me
SQS_NOTIFICATIONS_DLQ=change_me
SQS_MEDIA_PROCESSING_QUEUE=change_me
SQS_MEDIA_PROCESSING_DLQ=change_me
# Only if slower webhook processing is needed:
SQS_PAYMENT_EVENTS_QUEUE=change_me
SQS_PAYMENT_EVENTS_DLQ=change_me

# --- Razorpay ---
# Payments are not part of the MVP until decision D-24 is made. These are placeholders only.
# The key ID is public by design: the backend may send it to the browser for Razorpay Checkout.
RAZORPAY_KEY_ID=change_me
# The key secret and the webhook secret stay on the server. Never expose them to a frontend.
RAZORPAY_KEY_SECRET=change_me
RAZORPAY_WEBHOOK_SECRET=change_me
'@

$frontendReadme = @'
# Frontend

Three separate Next.js applications in one repository. They share no code package and never connect to the database. Each one calls the backend only.

| Application | Destination folder | Host | Release |
|---|---|---|---|
| customer-web | `frontend\customer-web` | www.evntgrid.com | MVP |
| provider-portal | `frontend\provider-portal` | partner.evntgrid.com | Future. Requirements not written yet |
| admin-portal | `frontend\admin-portal` | admin.evntgrid.com | Future. Requirements not written yet |

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

Provider-portal and admin-portal were generated the same way, replacing `customer-web` with `provider-portal` or `admin-portal`. They are skeletons only: their features are future work, and their requirements are not written yet.

## After generation: add the planned folders

Only after `customer-web` has been generated, go back to the project folder (`cd ..` from `frontend`) and run this there. It only creates folders that are missing, and never touches existing files:

```powershell
$app = Join-Path (Get-Location).Path 'frontend\customer-web'
if (-not (Test-Path -LiteralPath (Join-Path $app 'package.json'))) { Write-Host "No package.json in $app. Either customer-web is not generated yet, or this terminal is not in the project folder. Stop." }
else {
    $folders = 'src\components','src\features','src\hooks','src\lib','src\providers','src\stores','src\types','src\config','tests'
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
'@

$backendSetupDoc = @'
# Backend setup

One Spring Boot modular monolith in one Git repository, with one PostgreSQL database. It serves all three frontends.

**Status (2026-11-11): the backend has been generated** from Spring Initializr with the values below, and the module folders have been added. The steps are kept for reference.

**The `backend` folder is created empty by the folder script.** The script puts nothing inside it. You extract the official Spring Initializr project directly into `<project folder>\backend`. No scratch folder and no file-copy tool are needed.

`<project folder>` means the folder that contains the root `README.md`, wherever you keep it (on the Desktop: `C:\Users\<you>\OneDrive\Desktop\EventGrid\EventGrid`).

## Versions

- Java 25. Check with `java -version`.
- Spring Boot 4.1 requires Java 17 or later, supports up to Java 27, and needs Maven 3.6.3 or later (Spring Boot documentation). Initializr adds the Maven wrapper, so a separate Maven install is optional.
- Use Spring Boot **4.1.2**, the current stable release and the Initializr default (checked 2026-11-11). Do not choose a SNAPSHOT, RC or milestone (4.2.0-RC2 and 4.1.3-SNAPSHOT are also listed).

## Step 1: set the Initializr form

Open https://start.spring.io in your browser and set these fields. **Status: verified on 2026-11-11** against the Initializr metadata (Spring Boot 4.1.2 is the default; Java 27, 25, 21 and 17 are offered). Recheck on screen if this date is old.

| Field | Value |
|---|---|
| Project | Maven |
| Language | Java |
| Spring Boot | 4.1.2 |
| Group | `com.evntgrid` |
| Artifact | `backend` |
| Name | `evntgrid` |
| **Package name** | **`com.evntgrid`** (the default would be `com.evntgrid.backend`, which breaks the module layout) |
| Packaging | Jar |
| Java | 25 (the form defaults to 17; change it) |

Dependencies to add with **ADD DEPENDENCIES**. All ten were found in the Initializr metadata on 2026-11-11. If one is missing on screen, do not substitute another. Write it down and ask:

| Dependency | Reason | Initializr ID |
|---|---|---|
| Spring Web | REST API | `web` |
| Spring Data JPA | Persistence | `data-jpa` |
| PostgreSQL Driver | Database | `postgresql` |
| Flyway Migration | Migrations | `flyway` |
| Spring Security | Authentication and authorization | `security` |
| Validation | Request validation | `validation` |
| Spring Boot Actuator | Health and metrics endpoints | `actuator` |
| Spring Modulith | Module boundaries | `modulith` |
| Testcontainers | Integration tests with real PostgreSQL | `testcontainers` |
| Spring Data Redis (Access+Driver) | Client for the approved Redis | `data-redis` |

**Not added at generation:**

- **OpenTelemetry.** It is part of the approved stack, but its exporters need hosting that is not approved yet (TA-07, TA-08, TA-09). Add it when observability work starts, and verify the starter name then.
- **springdoc-openapi.** In the approved stack, but not offered by Initializr. Add it by hand later, after checking the springdoc documentation for the Spring Boot 4 version.
- **Spring Session Data Redis** (TA-01) and **Spring Cloud AWS** (TA-02). Not approved yet.

## Step 2: download the ZIP

Click **GENERATE**. Your browser downloads `backend.zip`, usually into your Downloads folder.

Shortcut: this link opens the form already filled in with the values above. Check every field before clicking GENERATE:

```text
https://start.spring.io/#!type=maven-project&language=java&platformVersion=4.1.2&packaging=jar&jvmVersion=25&groupId=com.evntgrid&artifactId=backend&name=evntgrid&packageName=com.evntgrid&dependencies=web,data-jpa,postgresql,flyway,security,validation,actuator,modulith,testcontainers,data-redis
```

## Step 3: extract directly into <project folder>\backend

1. Open File Explorer. Check that `<project folder>\backend` exists and is empty.
2. Double-click `backend.zip` to look inside it. **Do not extract yet.**
3. Look at what you see first:
   - **Case A: you see a single folder (probably named `backend`) and nothing else.** Close the ZIP. Right-click `backend.zip`, choose **Extract All...**, and set the destination to `<project folder>`. The files then land in `<project folder>\backend` and there is no extra `backend\backend` folder.
   - **Case B: you see files and folders directly (`pom.xml`, `src`, `mvnw` and so on).** Close the ZIP. Right-click `backend.zip`, choose **Extract All...**, and set the destination to `<project folder>\backend`.
4. If Windows asks about files that already exist, choose **Skip** every time. Never choose Replace.
5. Check the result. `<project folder>\backend\pom.xml` must exist, and `<project folder>\backend\backend` must NOT exist.

If you ended up with `<project folder>\backend\backend`, do not delete anything yourself. Stop and ask for help.

The ZIP contains its own `.gitignore`, `.gitattributes` and `HELP.md`. It must not contain a `.git` folder. Leave these files.

## Step 4: check the generated project

In a terminal opened in the project folder:

```powershell
cd backend
.\mvnw.cmd -v
```

This prints Maven and Java versions. It does not build the project. It may download the Maven wrapper the first time.

## Package layout

The module folders below exist under `src\main\java\com\evntgrid\`, next to the generated application class. They contain only a `.gitkeep`, and no Java classes. Classes are added when business functionality is implemented. Modules with four packages have them created already; reserved and deferred modules have only their root folder.

Each implemented module uses `api`, `application`, `domain` and `infrastructure`:

| Package | Holds |
|---|---|
| `api` | REST controllers per API surface, request and response models, and the module's public contracts and events |
| `application` | Use cases and transaction boundaries |
| `domain` | Entities, value objects, state rules |
| `infrastructure` | Spring Data repositories and external adapters |

Spring Modulith treats sub-packages as private to a module. A type that other modules must call belongs in the module's root package, or in `api` exposed with `@NamedInterface`. Decide this when the first cross-module call is written.

| Module | Status | Notes |
|---|---|---|
| shared | MVP | `kernel`, `error`, `audit`, `idempotency` |
| identity, customer, provider, catalog, discovery, enquiry, quotation, booking, notification | MVP | Four packages each |
| administration | MVP if decision D-18 selects staff-operated provider handling | Pending D-18 |
| complaint | MVP, minimal | Intake of support contacts and incorrect-listing reports only (D-32). All other complaint handling is future (U-24) |
| payment | Not in MVP | Design kept. No business flow until D-24 and U-10 |
| commission, settlement, content | Reserved | No business rules yet (U-22, U-23, U-25) |
| review | **FUTURE / DEFERRED** | Not an MVP module |

Favourites are also **FUTURE / DEFERRED**. They had been planned inside `customer`, and nothing is built for them in the MVP.

Flyway migrations go in `src\main\resources\db\migration\<module>\`, named `V<yyyy>_<mm>_<dd>_<n>__<module>_<description>.sql` so all modules share one ordered history. The `catalog` module has the first two (feature 1).
'@

$infrastructureReadme = @'
# Infrastructure

Part of the one EVNTGRID repository.

| Folder | Purpose | Status |
|---|---|---|
| `docker/` | Local development containers | Empty |
| `aws/` | AWS-specific files that are not Terraform. Contents not defined | Empty |
| `terraform/` | Infrastructure as code. Terraform was named in the folder plan | Empty |
| `monitoring/` | OpenTelemetry, Prometheus and Grafana configuration | Empty |

- Nothing here creates AWS resources by itself.
- No credentials belong in this folder. Secrets are never committed.
- Which CI/CD tool is used is not decided yet (TA-14).
- Where Dockerfiles live is not decided yet. See `frontend\README.md`.
'@

$documentationReadme = @'
# Documentation

Part of the one EVNTGRID repository.

| Folder | Contents |
|---|---|
| `01-business/` | Business rules, requirement gaps, event category catalogue |
| `02-product/customer/` | Customer features, user journeys, MVP scope |
| `03-architecture/` | System, frontend and backend architecture, API design, decisions, folder structure, backend setup |
| `04-database/` | Database schema and entity relationships |
| `05-design/` | Design work |
| `06-security/` | Identity and security architecture |
| `07-workflows/` | Cross-application workflows |
| `08-testing/` | Test plans and results |
| `09-deployment/` | Deployment architecture and runbooks |
| `10-project-management/` | Plans, decisions log, review reports, status |

Start with `03-architecture\ARCHITECTURE_DECISIONS.md` and `02-product\customer\CUSTOMER_MVP_SCOPE.md`.

Items marked **FUTURE / DEFERRED** are kept for planning and are not MVP. Favourites and reviews are in that group.
'@

$scriptsReadme = @'
# Scripts

Part of the one EVNTGRID repository.

| Folder | Purpose |
|---|---|
| `development/` | Helpers for local development |
| `database/` | Database helper scripts |
| `utilities/` | General utilities, including `create-evntgrid-structure.ps1` |

Scripts must not contain credentials. Read them from environment variables.
Scripts must never delete or overwrite existing files without an explicit, reviewed reason.
'@

$files = [ordered]@{
    'README.md'                                  = $rootReadme
    '.gitignore'                                 = $gitignore
    '.env.example'                               = $envExample
    'frontend/README.md'                         = $frontendReadme
    'infrastructure/README.md'                   = $infrastructureReadme
    'documentation/README.md'                    = $documentationReadme
    'documentation/03-architecture/BACKEND_SETUP.md' = $backendSetupDoc
    'scripts/README.md'                          = $scriptsReadme
}

# ----------------------------------------------------------------------------
# Pre-flight: check every path BEFORE creating anything
# ----------------------------------------------------------------------------
function Assert-SafePath {
    # Stops the script if an existing part of the path is a file where a folder is
    # needed, or a symbolic link / junction. A final existing FILE is allowed
    # (it is simply skipped later).
    param([string]$Relative, [bool]$IsFile)

    $segments = $Relative -split '/'
    $current = ''
    for ($i = 0; $i -lt $segments.Count; $i++) {
        if ($current -eq '') { $current = $segments[$i] } else { $current = "$current/$($segments[$i])" }
        $entry = Get-EntryOrNull (Get-FullPath $current)
        if ($null -eq $entry) { return }
        $isLastFile = ($IsFile -and ($i -eq ($segments.Count - 1)))
        if ($isLastFile) { return }
        if (-not $entry.PSIsContainer) { throw "'$current' exists but is a file, not a folder. Nothing was created." }
        if (Test-IsLink $entry) { throw "'$current' is a symbolic link or junction. Refusing to follow it. Nothing was created." }
    }
}

foreach ($d in $directories) { Assert-SafePath $d $false }
foreach ($key in $files.Keys) { Assert-SafePath $key $true }

# ----------------------------------------------------------------------------
# Create directories
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host 'Directories' -ForegroundColor Cyan
foreach ($d in $directories) { New-BlueprintDirectory $d }

# ----------------------------------------------------------------------------
# Create starter files
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host 'Files' -ForegroundColor Cyan
foreach ($key in $files.Keys) { New-BlueprintFile $key $files[$key] }

# ----------------------------------------------------------------------------
# .gitkeep so Git keeps folders that are still empty
# (never in frontend\ or backend\, and never in a folder that gets a starter file)
# ----------------------------------------------------------------------------
$foldersWithStarterFiles = @{}
foreach ($key in $files.Keys) {
    $slash = $key.LastIndexOf('/')
    if ($slash -ge 0) { $foldersWithStarterFiles[$key.Substring(0, $slash)] = $true }
}

Write-Host ''
Write-Host '.gitkeep placeholders (empty folders only)' -ForegroundColor Cyan
foreach ($d in $directories) {
    if ($noPlaceholder -contains $d) { continue }
    if ($foldersWithStarterFiles.ContainsKey($d)) { continue }

    $prefix = "$d/"
    $hasChild = $false
    foreach ($other in $directories) {
        if ($other.StartsWith($prefix)) { $hasChild = $true; break }
    }
    if ($hasChild) { continue }

    $full = Get-FullPath $d
    $entry = Get-EntryOrNull $full
    if (($null -ne $entry) -and $entry.PSIsContainer) {
        $anything = @(Get-ChildItem -LiteralPath $full -Force)
        if ($anything.Count -gt 0) { continue }
    }
    New-BlueprintFile "$d/.gitkeep" ''
}

# ----------------------------------------------------------------------------
# Notes (read only)
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host 'Notes' -ForegroundColor Cyan

$appNames = @('customer-web', 'provider-portal', 'admin-portal')
foreach ($app in $appNames) {
    $appPath = Get-FullPath "frontend/$app"
    if ($null -ne (Get-EntryOrNull $appPath)) {
        Write-Host "  frontend\$app already exists. The Next.js generator refuses to run in a folder that is not empty. The script has not touched it." -ForegroundColor DarkYellow
    }
}
$backendPath = Get-FullPath 'backend'
$backendEntry = Get-EntryOrNull $backendPath
if (($null -ne $backendEntry) -and $backendEntry.PSIsContainer) {
    $backendItems = @(Get-ChildItem -LiteralPath $backendPath -Force)
    if ($backendItems.Count -gt 0) {
        Write-Host ("  backend already contains {0} item(s). Extract the Spring Initializr ZIP only if you are sure nothing will be replaced." -f $backendItems.Count) -ForegroundColor DarkYellow
    }
}
if ($null -ne (Get-EntryOrNull (Get-FullPath '.git'))) {
    Write-Host '  Git repository found at the root.'
}
else {
    Write-Host '  No Git repository yet. This script never runs Git. See README.md, step 2.'
}
$nested = @('frontend/customer-web/.git', 'frontend/provider-portal/.git', 'frontend/admin-portal/.git', 'backend/.git')
foreach ($n in $nested) {
    if ($null -ne (Get-EntryOrNull (Get-FullPath $n))) {
        Write-Host "  WARNING: nested Git repository found at $n. The project must have only one root repository." -ForegroundColor Red
    }
}

# ----------------------------------------------------------------------------
# Summary
# ----------------------------------------------------------------------------
Write-Host ''
Write-Host 'Summary' -ForegroundColor Cyan
if ($DryRun) {
    Write-Host ("  Directories that WOULD be created: {0}" -f $script:CreatedDirs.Count)
    Write-Host ("  Files that WOULD be created      : {0}" -f $script:CreatedFiles.Count)
}
else {
    Write-Host ("  Directories created              : {0}" -f $script:CreatedDirs.Count)
    Write-Host ("  Files created                    : {0}" -f $script:CreatedFiles.Count)
}
Write-Host ("  Directories already present      : {0}" -f $script:ExistingDirs.Count)
Write-Host ("  Files already present (skipped)  : {0}" -f $script:ExistingFiles.Count)

if ($script:ExistingDirs.Count -gt 0) {
    Write-Host ''
    Write-Host 'Directories already present (not touched):' -ForegroundColor DarkYellow
    foreach ($s in $script:ExistingDirs) { Write-Host "  $s" }
}
if ($script:ExistingFiles.Count -gt 0) {
    Write-Host ''
    Write-Host 'Files already present (not touched):' -ForegroundColor DarkYellow
    foreach ($s in $script:ExistingFiles) { Write-Host "  $s" }
}

# ----------------------------------------------------------------------------
# Folder tree
# ----------------------------------------------------------------------------
$hiddenFromTree = @('node_modules', '.git', '.next', 'target', '.terraform', '.idea', '.vscode', '.gitkeep')

function Show-Tree {
    param([string]$Path, [string]$Indent = '')

    $items = @(
        Get-ChildItem -LiteralPath $Path -Force |
            Where-Object { $hiddenFromTree -notcontains $_.Name } |
            Sort-Object @{ Expression = { -not $_.PSIsContainer } }, Name
    )
    for ($i = 0; $i -lt $items.Count; $i++) {
        $isLast = ($i -eq ($items.Count - 1))
        if ($isLast) { $branch = '\--- '; $next = '     ' } else { $branch = '+--- '; $next = '|    ' }
        $item = $items[$i]
        if ($item.PSIsContainer) {
            if (Test-IsLink $item) {
                Write-Host ($Indent + $branch + $item.Name + '\  [link, not followed]')
            }
            else {
                Write-Host ($Indent + $branch + $item.Name + '\')
                Show-Tree -Path $item.FullName -Indent ($Indent + $next)
            }
        }
        else {
            Write-Host ($Indent + $branch + $item.Name)
        }
    }
}

Write-Host ''
Write-Host 'Folder tree (.gitkeep, node_modules, .git, .next, target and .terraform hidden)' -ForegroundColor Cyan
if ($null -ne (Get-EntryOrNull $script:RootPath)) {
    Write-Host ($script:RootPath + '\')
    Show-Tree -Path $script:RootPath
    if ($DryRun) { Write-Host '(This tree shows what exists NOW. Dry run created nothing.)' }
}
else {
    Write-Host '(Dry run: the root folder does not exist yet, so there is no tree to show.)'
}

Write-Host ''
if ($DryRun) { Write-Host 'Dry run finished. Nothing was created.' -ForegroundColor Yellow }
else { Write-Host 'Done. Safe to run again.' -ForegroundColor Green }
