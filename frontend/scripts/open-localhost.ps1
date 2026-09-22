<#
.SYNOPSIS
    Lightweight "open localhost:3008" helper — permanent daily workflow.

.DESCRIPTION
    1. HTTP-check http://localhost:3008/ (real request, not just process check).
    2. If healthy -> open default browser, exit immediately. No restart,
       no kill, no .next delete, no dev-restart, no duplicate server.
    3. If unhealthy:
       - If port 3008 is LISTENING but HTTP not ready yet (starting up),
         wait bounded time for HTTP 200, then open browser.
       - If port is free, delegate to dev-start.ps1 which starts
         `npm run dev` (next dev -p 3008) DETACHED via Start-Process,
         waits for Ready + HTTP 200, then opens the browser.
    Bounded timeout. Never waits forever. Never deletes .next here.

.PARAMETER TimeoutSec
    Max seconds to wait for HTTP readiness. Default 90.
#>
param(
    [int]$TimeoutSec = 90
)

$Port = 3008
$Url = "http://localhost:$Port/"
$ScriptDir = $PSScriptRoot

function Test-Health {
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        return ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400)
    } catch {
        return $false
    }
}

function Test-PortListening {
    $conn = netstat -ano | Select-String "LISTENING" | Select-String ":$Port"
    return ($null -ne $conn)
}

# STEP 1: fast-path — already healthy?
if (Test-Health) {
    Write-Host "✓ localhost:$Port already healthy — opening browser (no restart)."
    Start-Process $Url | Out-Null
    exit 0
}

# STEP 2: port listening but HTTP not up yet = server is starting (delay case).
# Wait bounded, do NOT start a duplicate.
if (Test-PortListening) {
    Write-Host "Port $Port is LISTENING but HTTP not ready — waiting (max 30s, no duplicate start)..."
    $elapsed = 0
    while ($elapsed -lt 30) {
        Start-Sleep 2
        $elapsed += 2
        if (Test-Health) {
            Write-Host "✓ localhost:$Port became healthy after ${elapsed}s — opening browser."
            Start-Process $Url | Out-Null
            exit 0
        }
    }
    Write-Error "Port $Port is occupied but HTTP never became healthy within 30s. Check logs at $env:LOCALAPPDATA\Temp\opencode\tj-frontend\dev.log. NOT restarting in a loop."
    exit 1
}

# STEP 3: port free — start detached via dev-start.ps1 (bounded wait inside, opens browser itself).
Write-Host "Port $Port free — starting detached dev server..."
& "$ScriptDir\dev-start.ps1"
exit $LASTEXITCODE
