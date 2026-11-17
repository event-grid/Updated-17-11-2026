#Requires -Version 5.1
<#
.SYNOPSIS
    Saves the whole EVENTGRID database (tables and all data) into one file, to send to someone or to keep as a backup.

.DESCRIPTION
    Uses the database settings in .env. The file is plain SQL. It contains everything in the database, including customer
    phone numbers and emails, so only share it with people you trust. Restore it with import-database.ps1.

    You do NOT need this to share the project: the demo data is created automatically when the backend starts.
    Use it only to hand over the exact current state of your own database (for example the bookings you made while testing).

.PARAMETER OutFile
    Where to write the file. Default: evntgrid-database.sql in the project folder.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\database\export-database.ps1
#>
[CmdletBinding()]
param(
    [string]$OutFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
if (-not $OutFile) { $OutFile = Join-Path $projectRoot 'evntgrid-database.sql' }

$envFile = Join-Path $projectRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw 'No .env file. Run scripts\development\setup-demo.ps1 first.' }
$settings = @{}
foreach ($line in Get-Content -LiteralPath $envFile) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') { $settings[$Matches[1]] = $Matches[2].Trim() }
}
foreach ($key in 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD') {
    if (-not $settings.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($settings[$key])) { throw "$key is missing in .env." }
}

$pgDump = (Get-Command pg_dump -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $pgDump) {
    $pgDump = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\pg_dump.exe' -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}
if (-not $pgDump) { throw 'pg_dump was not found. Is PostgreSQL installed?' }

$env:PGPASSWORD = $settings.POSTGRES_PASSWORD
try {
    & $pgDump -h localhost -p 5432 -U $settings.POSTGRES_USER -d $settings.POSTGRES_DB --no-owner --no-privileges --encoding UTF8 -f $OutFile
    if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit code $LASTEXITCODE." }
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$size = [math]::Round((Get-Item -LiteralPath $OutFile).Length / 1MB, 2)
Write-Host "Database saved to $OutFile ($size MB)." -ForegroundColor Green
Write-Host 'To use it on another computer: run setup-demo.ps1 there, then import-database.ps1 -InFile <this file>.'
