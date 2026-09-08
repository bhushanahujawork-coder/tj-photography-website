<#
.SYNOPSIS
    Stop the TJ Photography frontend dev server on port 3008.

.DESCRIPTION
    Finds and stops ONLY the Next.js server listening on port 3008.
    Does NOT kill unrelated Node processes.
#>

param()

$Port = 3008

function Get-PidOnPort {
    param($Port)
    $conn = netstat -ano | Select-String "LISTENING" | Select-String ":$Port"
    if ($conn) {
        $line = $conn[0].ToString().Trim()
        $processId = ($line -replace ".*LISTENING\s+", "").Trim()
        return [int]$processId
    }
    return $null
}

$processId = Get-PidOnPort $Port
if ($processId) {
    try {
        $proc = Get-Process -Id $processId -ErrorAction Stop
        Write-Host "Stopping TJ frontend (PID $processId) on port $Port..."
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Start-Sleep 2
        $still = Get-PidOnPort $Port
        if ($still) {
            Write-Warning "Port $Port still occupied by PID $still — forcing tree kill"
            $parent = Get-CimInstance Win32_Process -Filter "ProcessId=$still" | Select-Object -ExpandProperty ParentProcessId
            if ($parent) { Stop-Process -Id $parent -Force -ErrorAction SilentlyContinue }
        }
        Write-Host "Stopped."
    }
    catch {
        Write-Warning "Process $processId already gone or access denied."
    }
}
else {
    Write-Host "No TJ frontend running on port $Port."
}

# Verify port free
$final = Get-PidOnPort $Port
if ($final) {
    Write-Error "Port $Port still busy (PID $final)"
    exit 1
}
Write-Host "Port $Port is free."