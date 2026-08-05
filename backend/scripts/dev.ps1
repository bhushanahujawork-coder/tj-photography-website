# Start the FastAPI backend server
Write-Host "Starting TJ Photography Backend..." -ForegroundColor Green

$venvPath = Join-Path $PSScriptRoot "..\venv\Scripts\python.exe"
$appPath = Join-Path $PSScriptRoot "..\app\main.py"

if (-not (Test-Path $venvPath)) {
    Write-Host "Virtual environment not found. Run: python -m venv venv" -ForegroundColor Red
    exit 1
}

Write-Host "Running: uvicorn app.main:app --reload" -ForegroundColor Cyan
& $venvPath -m uvicorn app.main:app --reload
