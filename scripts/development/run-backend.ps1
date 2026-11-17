#Requires -Version 5.1
<#
.SYNOPSIS
    Builds and runs the EVNTGRID backend locally on http://localhost:8080.

.DESCRIPTION
    Packages the backend (tests skipped) and runs the jar, the same way it runs in production.
    Settings come from the root .env file (database login, Redis host).

    Why not "mvnw spring-boot:run": on Windows that command passes the classpath through an
    argument file, and Spring Modulith's startup scan then finds no application classes
    ("No classes found in packages [com.evntgrid]"). Running the jar avoids this.

    Stop the backend with Ctrl+C.

.PARAMETER SkipBuild
    Run the jar from the last build without rebuilding.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\scripts\development\run-backend.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Path (Split-Path -Path $PSScriptRoot -Parent) -Parent
$backend = Join-Path $projectRoot 'backend'

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.env'))) {
    throw 'No .env file in the project folder. Create .env and fill in the database settings first (see the README, step 3).'
}

Push-Location $backend
try {
    if (-not $SkipBuild) {
        Write-Host 'Building the backend (tests skipped) ...' -ForegroundColor Cyan
        & .\mvnw.cmd -q -DskipTests package
        if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE." }
    }

    $jar = Get-ChildItem -LiteralPath (Join-Path $backend 'target') -Filter 'backend-*.jar' |
        Where-Object { $_.Name -notlike '*.original' } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $jar) { throw 'No backend jar found in backend\target. Run without -SkipBuild.' }

    # Run from a copy: Java loads classes from the jar on demand, so if a later build or test run replaced
    # target\backend-*.jar under a running backend, it would fail with ClassNotFoundException (seen first
    # on error responses). The copy is outside target\, which Maven rewrites.
    $runDir = Join-Path $backend '.run'
    New-Item -ItemType Directory -Force -Path $runDir | Out-Null
    $runJar = Join-Path $runDir 'backend.jar'
    try {
        Copy-Item -LiteralPath $jar.FullName -Destination $runJar -Force
    } catch {
        throw "Could not replace $runJar. Is another backend still running? Stop it first (Ctrl+C in its terminal)."
    }

    Write-Host "Starting $($jar.Name) on http://localhost:8080 (Ctrl+C to stop)" -ForegroundColor Green
    # Working directory stays in backend so the ../.env import in application.properties resolves.
    & java -jar $runJar
}
finally {
    Pop-Location
}
