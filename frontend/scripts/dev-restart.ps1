<#
.SYNOPSIS
    Restart the TJ Photography frontend dev server.

.DESCRIPTION
    Stops existing server on port 3008, then starts fresh.
    By default does NOT clean .next (preserves cache for fast restarts).
    Use -Clean to force .next removal (only when route registration fails).

.PARAMETER Clean
    Remove .next before starting.
#>

param(
    [switch]$Clean
)

Write-Host "=== TJ Frontend Restart ==="
& "$PSScriptRoot\dev-stop.ps1"
if ($LASTEXITCODE -ne 0) { exit 1 }
$args = @()
if ($Clean) { $args += "-Clean" }
& "$PSScriptRoot\dev-start.ps1" @args
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host "=== Restart complete ==="