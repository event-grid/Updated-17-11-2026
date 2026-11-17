#Requires -Version 5.1
<#
.SYNOPSIS
    Creates the local EVNTGRID database and login role in a locally installed PostgreSQL 18.

.DESCRIPTION
    Reads POSTGRES_DB, POSTGRES_USER and POSTGRES_PASSWORD from the root .env file and runs
    create-local-database.sql as a PostgreSQL superuser. psql asks for the superuser's password;
    it is never stored. Safe to run more than once: nothing is dropped or deleted.

    Not needed when PostgreSQL runs in Docker (infrastructure/docker/compose.yaml creates them).

.PARAMETER SuperUser
    PostgreSQL superuser to connect as. Default: postgres.

.PARAMETER Port
    PostgreSQL port. Default: 5432.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\database\create-local-database.ps1
#>
[CmdletBinding()]
param(
    [string]$SuperUser = 'postgres',
    [int]$Port = 5432
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
    throw "No .env file at $envFile. Create it and set POSTGRES_USER and POSTGRES_PASSWORD first (see the README, step 3)."
}

# Read KEY=VALUE lines from .env (comments and blank lines ignored).
$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $settings[$Matches[1]] = $Matches[2].Trim() }
}
foreach ($key in 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD') {
    if (-not $settings.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($settings[$key]) -or $settings[$key] -eq 'change_me') {
        throw "$key is missing or still 'change_me' in .env."
    }
}

# Find psql: PATH first, then the default PostgreSQL 18 install folder.
$psql = (Get-Command psql -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $psql) {
    $candidate = 'C:\Program Files\PostgreSQL\18\bin\psql.exe'
    if (Test-Path -LiteralPath $candidate) { $psql = $candidate } else { throw 'psql not found. Is PostgreSQL 18 installed?' }
}

Write-Host "Creating database '$($settings.POSTGRES_DB)' and role '$($settings.POSTGRES_USER)' on localhost:$Port"
Write-Host "psql will ask for the password of the PostgreSQL user '$SuperUser' (the one chosen during installation)." -ForegroundColor Cyan

& $psql -h localhost -p $Port -U $SuperUser -d postgres -X -q `
    -v "app_db=$($settings.POSTGRES_DB)" `
    -v "app_user=$($settings.POSTGRES_USER)" `
    -v "app_password=$($settings.POSTGRES_PASSWORD)" `
    -f (Join-Path $PSScriptRoot 'create-local-database.sql')

if ($LASTEXITCODE -ne 0) { throw "psql failed with exit code $LASTEXITCODE." }
Write-Host 'Done. You can now start the backend.' -ForegroundColor Green
