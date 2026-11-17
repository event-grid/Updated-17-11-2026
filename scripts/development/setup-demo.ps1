#Requires -Version 5.1
<#
.SYNOPSIS
    One-time setup of the EVENTGRID demo on a new computer: settings file, database with demo data, website packages.

.DESCRIPTION
    Run this once after cloning the project, then run start-demo.ps1. It
      1. checks that Java, Node.js and PostgreSQL are installed,
      2. creates the .env settings file with generated secrets (only if there is none yet) and prints the admin login,
      3. creates the database and its login (asks once for the password of the PostgreSQL "postgres" user),
      4. installs the website packages (npm install, a few minutes the first time),
      5. copies the sample vendors for the vendor portal into frontend\.demo-data (only if not there yet).
    The database tables and the demo data (venues, vendors, packages, customers, bookings) are created by the backend
    itself the first time it starts. It is safe to run this script again: nothing that exists is overwritten.

.PARAMETER SkipDatabase
    Do not create the database (use when it already exists).

.PARAMETER SkipNpm
    Do not run npm install.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\development\setup-demo.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipDatabase,
    [switch]$SkipNpm,
    # Where the settings file goes. Only changed by tests.
    [string]$EnvPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
if (-not $EnvPath) { $EnvPath = Join-Path $projectRoot '.env' }

function Step($text) { Write-Host ""; Write-Host "== $text" -ForegroundColor Cyan }
function Ok($text) { Write-Host "   ok  $text" -ForegroundColor Green }
function Fail($text) { throw $text }

function New-Secret([int]$Length) {
    $chars = (48..57) + (65..90) + (97..122) | ForEach-Object { [char]$_ }
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    -join ($bytes | ForEach-Object { $chars[$_ % $chars.Count] })
}

# ---- 1. tools ------------------------------------------------------------------------------------------------------
Step '1 of 5: checking the tools'

$javaText = (& cmd /c 'java -version 2>&1') -join ' '
if ($javaText -notmatch 'version "?(\d+)') { Fail 'Java was not found. Install JDK 25 from https://adoptium.net and run this script again.' }
if ([int]$Matches[1] -lt 25) { Fail "Java $($Matches[1]) found, but JDK 25 is needed. Install JDK 25 from https://adoptium.net." }
Ok "Java $($Matches[1])"

$nodeText = (& cmd /c 'node -v 2>&1') -join ' '
if ($nodeText -notmatch 'v(\d+)\.(\d+)') { Fail 'Node.js was not found. Install the LTS version from https://nodejs.org and run this script again.' }
if ([int]$Matches[1] -lt 20 -or ([int]$Matches[1] -eq 20 -and [int]$Matches[2] -lt 9)) { Fail "Node.js $nodeText found, but 20.9 or newer is needed." }
Ok "Node.js $nodeText"

$psql = (Get-Command psql -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $psql) {
    $psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) { Fail 'PostgreSQL was not found. Install PostgreSQL 18 from https://www.postgresql.org/download/windows/ (remember the password you choose for the "postgres" user) and run this script again.' }
Ok "PostgreSQL client at $psql"

# ---- 2. settings file -----------------------------------------------------------------------------------------------
Step '2 of 5: settings file (.env)'
if (Test-Path -LiteralPath $EnvPath) {
    # The .env that comes with the project has CHANGE_ME placeholders. Fill those in with generated secrets; anything
    # the person has already set to a real value is left exactly as it is.
    $generators = @{
        POSTGRES_PASSWORD     = { New-Secret 24 }
        ADMIN_API_TOKEN       = { New-Secret 40 }
        ADMIN_PORTAL_PASSWORD = { New-Secret 14 }
    }
    $filled = @{}
    $updated = foreach ($line in Get-Content -LiteralPath $EnvPath) {
        if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?i:CHANGE_ME)') {
            $key = $Matches[1]
            if ($generators.ContainsKey($key)) {
                $value = & $generators[$key]
                $filled[$key] = $value
                "$key=$value"
                continue
            }
            Write-Host "   note: $key still says CHANGE_ME in .env; edit it yourself if you need it." -ForegroundColor Yellow
        }
        $line
    }
    if ($filled.Count -gt 0) {
        Set-Content -LiteralPath $EnvPath -Value $updated -Encoding ASCII
        Ok "filled in $($filled.Count) CHANGE_ME placeholder(s) in $EnvPath with generated secrets"
        if ($filled.ContainsKey('ADMIN_PORTAL_PASSWORD')) {
            Write-Host ""
            Write-Host "   ADMIN LOGIN (also saved in .env)" -ForegroundColor Yellow
            Write-Host "   email:    admin@evntgrid.local" -ForegroundColor Yellow
            Write-Host "   password: $($filled['ADMIN_PORTAL_PASSWORD'])" -ForegroundColor Yellow
        }
    } else {
        Ok ".env already has real values, left as it is ($EnvPath)"
        $kept = @{}
        foreach ($line in Get-Content -LiteralPath $EnvPath) {
            if ($line -match '^\s*(ADMIN_PORTAL_EMAIL|ADMIN_PORTAL_PASSWORD)\s*=\s*(.*?)\s*$') { $kept[$Matches[1]] = $Matches[2] }
        }
        if ($kept.ContainsKey('ADMIN_PORTAL_PASSWORD')) {
            Write-Host ""
            Write-Host "   ADMIN LOGIN (from .env)" -ForegroundColor Yellow
            Write-Host "   email:    $($kept['ADMIN_PORTAL_EMAIL'])" -ForegroundColor Yellow
            Write-Host "   password: $($kept['ADMIN_PORTAL_PASSWORD'])" -ForegroundColor Yellow
        }
    }
} else {
    $dbPassword = New-Secret 24
    $adminPassword = New-Secret 14
    $adminToken = New-Secret 40
    $lines = @(
        '# Local settings for the EVENTGRID demo. Created by scripts\development\setup-demo.ps1. Never commit this file.',
        'POSTGRES_DB=evntgrid',
        'POSTGRES_USER=evntgrid',
        "POSTGRES_PASSWORD=$dbPassword",
        'DATABASE_URL=jdbc:postgresql://localhost:5432/evntgrid',
        '',
        '# Sign-in codes are shown on screen (development only). The dummy number 9999999999 always accepts 123456.',
        'SESSION_COOKIE_NAME=evg_c',
        'SESSION_COOKIE_SECURE=false',
        'OTP_DEV_MODE=true',
        'OTP_TEST_PHONE=9999999999',
        'OTP_TEST_CODE=123456',
        'API_DOCS_ENABLED=true',
        'BOOKING_ADVANCE_PERCENT=20',
        '',
        '# Admin portal: the secret it uses to talk to the backend, and the administrator login.',
        "ADMIN_API_TOKEN=$adminToken",
        'ADMIN_PORTAL_EMAIL=admin@evntgrid.local',
        "ADMIN_PORTAL_PASSWORD=$adminPassword"
    )
    Set-Content -LiteralPath $EnvPath -Value $lines -Encoding ASCII
    Ok "created $EnvPath"
    Write-Host ""
    Write-Host "   ADMIN LOGIN (also saved in .env)" -ForegroundColor Yellow
    Write-Host "   email:    admin@evntgrid.local" -ForegroundColor Yellow
    Write-Host "   password: $adminPassword" -ForegroundColor Yellow
}

# ---- 3. database ----------------------------------------------------------------------------------------------------
Step '3 of 5: database'
if ($SkipDatabase) {
    Ok 'skipped (-SkipDatabase)'
} else {
    Write-Host '   The next step asks for the password of the PostgreSQL "postgres" user (chosen when PostgreSQL was installed).' -ForegroundColor Gray
    & powershell -ExecutionPolicy Bypass -File (Join-Path $projectRoot 'scripts\database\create-local-database.ps1')
    if ($LASTEXITCODE -ne 0) { Fail 'The database could not be created. Check the postgres password and that PostgreSQL is running, then run this script again.' }
}

# ---- 4. website packages --------------------------------------------------------------------------------------------
Step '4 of 5: website packages (npm install)'
if ($SkipNpm) {
    Ok 'skipped (-SkipNpm)'
} else {
    Push-Location (Join-Path $projectRoot 'frontend')
    try {
        & npm install --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { Fail 'npm install failed. Check your internet connection and run this script again.' }
    } finally { Pop-Location }
    Ok 'packages installed'
}

# ---- 5. sample vendors ----------------------------------------------------------------------------------------------
Step '5 of 5: sample vendors and website settings'
$seed = Join-Path $projectRoot 'frontend\demo-seed'
$target = Join-Path $projectRoot 'frontend\.demo-data'
New-Item -ItemType Directory -Force -Path $target | Out-Null
foreach ($name in 'providers.json', 'site-settings.json') {
    $from = Join-Path $seed $name
    $to = Join-Path $target $name
    if (-not (Test-Path -LiteralPath $from)) { Fail "Missing $from. Is the project complete?" }
    if (Test-Path -LiteralPath $to) { Ok "$name already there, left as it is" }
    else { Copy-Item -LiteralPath $from -Destination $to; Ok "$name copied" }
}

Write-Host ""
Write-Host "Setup is done. Next: powershell -ExecutionPolicy Bypass -File .\scripts\development\start-demo.ps1" -ForegroundColor Green
