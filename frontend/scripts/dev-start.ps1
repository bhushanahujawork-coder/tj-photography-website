<#
.SYNOPSIS
    Start the TJ Photography frontend dev server on port 3008.

.DESCRIPTION
    Starts `npm run dev` (which runs `next dev -p 3008` per package.json).
    Logs are written OUTSIDE the project to avoid watcher churn.
    Waits for "Ready" and HTTP 200 on port 3008.

.PARAMETER Clean
    If set, removes .next before starting (use only when genuinely needed).
#>

param(
    [switch]$Clean
)

$Port = 3008
$ProjectRoot = "C:\Projects\TJ PHOTOGRAPHY WEBSITE\frontend"
$LogDir = "$env:LOCALAPPDATA\Temp\opencode\tj-frontend"
$LogFile = "$LogDir\dev.log"
$ErrFile = "$LogDir\dev-err.log"

# Ensure log dir
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

if ($Clean) {
    Write-Host "Cleaning .next..."
    Remove-Item -Recurse -Force "$ProjectRoot\.next" -ErrorAction SilentlyContinue
}

# Pre-check: port must be free (with brief retry for the old listener to die)
& "$ProjectRoot\scripts\dev-stop.ps1" 2>$null | Out-Null

$check = netstat -ano | Select-String "LISTENING" | Select-String ":$Port"
$tries = 0
while ($check -and $tries -lt 5) {
    Start-Sleep 2
    $tries++
    $check = netstat -ano | Select-String "LISTENING" | Select-String ":$Port"
}
if ($check) {
    Write-Error "Port $Port is still occupied after stop. Aborting."
    exit 1
}

Write-Host "Starting TJ frontend on http://localhost:$Port ..."
Write-Host "Logs: $LogFile"

# Start detached with logs outside project
$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" `
    -WorkingDirectory $ProjectRoot `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrFile `
    -WindowStyle Hidden `
    -PassThru

if (-not $proc) {
    Write-Error "Failed to start npm."
    exit 1
}

Write-Host "Started (PID $($proc.Id)). Waiting for Ready..."

# Wait for HTTP 200 on port 3008 (up to 90s for cold builds)
$ready = $false
for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep 2
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$Port/" -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            $ready = $true
            break
        }
    }
    catch { }
    # Also tail log for "Ready in" banner as early signal
    if (Test-Path $LogFile) {
        $line = Get-Content $LogFile -Tail 5 | Select-String "Ready in"
        if ($line) { Write-Host "Log: $($line.Line.Trim())" }
    }
    Write-Host "  ... waiting ($(($i+1)*2)s)"
}

if (-not $ready) {
    Write-Error "Server did not become ready on port $Port within 90s."
    Write-Host "--- Last 20 lines of dev.log ---"
    Get-Content $LogFile -Tail 20
    exit 1
}

Write-Host "`n✓ TJ Frontend READY at http://localhost:$Port"

# Open the site in the default browser so "open" just opens.
Start-Process "http://localhost:$Port" | Out-Null