#Requires -Version 5.1
<#
.SYNOPSIS
    Replaces the EVENTGRID database with the one saved by export-database.ps1.

.DESCRIPTION
    Uses the database settings in .env. WARNING: everything currently in that database is deleted first.
    Stop the backend before running this. Run scripts\development\setup-demo.ps1 first so the database and login exist.

.PARAMETER InFile
    The .sql file made by export-database.ps1.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\database\import-database.ps1 -InFile .\evntgrid-database.sql
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$InFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path -LiteralPath $InFile)) { throw "File not found: $InFile" }

$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'No .env file. Run scripts\development\setup-demo.ps1 first.' }
$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $settings[$Matches[1]] = $Matches[2].Trim() }
}
foreach ($key in 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD') {
    if (-not $settings.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($settings[$key])) { throw "$key is missing in .env." }
}

$psql = (Get-Command psql -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $psql) {
    $psql = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $psql) { throw 'psql was not found. Is PostgreSQL installed?' }

Write-Host "This DELETES everything in the database '$($settings.POSTGRES_DB)' and loads $InFile." -ForegroundColor Yellow
$answer = Read-Host 'Type YES to continue'
if ($answer -ne 'YES') { Write-Host 'Cancelled.'; return }

$env:PGPASSWORD = $settings.POSTGRES_PASSWORD
try {
    $common = @('-h', 'localhost', '-p', '5432', '-U', $settings.POSTGRES_USER, '-d', $settings.POSTGRES_DB, '-X', '-q', '-v', 'ON_ERROR_STOP=1')
    & $psql @common -c 'DROP SCHEMA IF EXISTS public, identity, provider, catalog, discovery, customer, booking, payment, notification, shared CASCADE; CREATE SCHEMA public;'
    if ($LASTEXITCODE -ne 0) { throw 'Could not clear the database.' }
    & $psql @common -f $InFile
    if ($LASTEXITCODE -ne 0) { throw 'The import failed. The database may be half loaded: run setup-demo.ps1 and import again.' }
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
Write-Host 'Database loaded. Start the project with scripts\development\start-demo.ps1.' -ForegroundColor Green
