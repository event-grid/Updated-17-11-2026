#Requires -Version 5.1
<#
.SYNOPSIS
    Starts the whole EVENTGRID demo: the backend and the three websites, each in its own window.

.DESCRIPTION
    Run setup-demo.ps1 once first. This script opens four PowerShell windows:
      backend          http://localhost:8080   (builds first, then Flyway creates the tables and demo data)
      customer site    http://localhost:3000
      vendor portal    http://localhost:3001
      admin portal     http://localhost:3002
    It waits for the backend and then opens the customer site in your browser. Close the four windows to stop everything.

.PARAMETER NoBrowser
    Do not open the browser at the end.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\development\start-demo.ps1
#>
[CmdletBinding()]
param(
    [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.env'))) {
    throw 'No .env file yet. Run scripts\development\setup-demo.ps1 first.'
}
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'frontend\node_modules'))) {
    throw 'The website packages are not installed. Run scripts\development\setup-demo.ps1 first.'
}

function Open-Window([string]$Title, [string]$Folder, [string]$Command) {
    $inner = "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location -LiteralPath '$Folder'; $Command"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', $inner) | Out-Null
}

Write-Host 'Opening the backend and the three websites in separate windows ...' -ForegroundColor Cyan
Open-Window 'EVENTGRID backend' $projectRoot "& '.\scripts\development\run-backend.ps1'"
Open-Window 'EVENTGRID customer site (3000)' (Join-Path $projectRoot 'frontend\customer-web') 'npm run dev'
Open-Window 'EVENTGRID vendor portal (3001)' (Join-Path $projectRoot 'frontend\provider-portal') 'npm run dev'
Open-Window 'EVENTGRID admin portal (3002)' (Join-Path $projectRoot 'frontend\admin-portal') 'npm run dev'

Write-Host 'Waiting for the backend (the first start builds it and creates the database tables: 2 to 5 minutes) ...' -ForegroundColor Cyan
$ready = $false
for ($i = 0; $i -lt 150; $i++) {
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8080/api/public/v1/categories' -UseBasicParsing -TimeoutSec 3
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 4
}

Write-Host ''
if ($ready) {
    Write-Host 'The backend is ready.' -ForegroundColor Green
} else {
    Write-Host 'The backend is not ready yet. Look at the "EVENTGRID backend" window for the reason (often a wrong database password: run setup-demo.ps1 again).' -ForegroundColor Yellow
}
Write-Host ''
Write-Host '  Customer site   http://localhost:3000'
Write-Host '  Vendor portal   http://localhost:3001'
Write-Host '  Admin portal    http://localhost:3002   (login is in the .env file: ADMIN_PORTAL_EMAIL / ADMIN_PORTAL_PASSWORD)'
Write-Host ''
Write-Host 'The websites compile each page the first time it is opened, so the first visit to a page can take a few seconds.'
if ($ready -and -not $NoBrowser) { Start-Process 'http://localhost:3000' }
