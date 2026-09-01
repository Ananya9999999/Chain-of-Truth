<#
.SYNOPSIS
  Start the Chain of Truth API. Works from any directory.
.DESCRIPTION
  Resolves paths from the script location rather than the current directory, so
  it cannot fail with "cannot find path ...\backend\backend". Stops any stale
  listener on the port first, because a forgotten server from an earlier session
  silently serves old data.
#>
param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
    $p = Get-Process -Id $existing.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "Stopping stale process on port $Port ($($p.ProcessName) pid=$($p.Id))" -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force
    Start-Sleep -Seconds 2
}

$python = Join-Path $root '.venv\Scripts\python.exe'
if (-not (Test-Path $python)) { throw "venv not found at $python" }

Set-Location (Join-Path $root 'backend')
Write-Host "API   -> http://localhost:$Port" -ForegroundColor Green
Write-Host "Docs  -> http://localhost:$Port/docs" -ForegroundColor Green
& $python -m uvicorn app.main:app --reload --port $Port
