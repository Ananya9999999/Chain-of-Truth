<#
.SYNOPSIS
  Start the Chain of Truth web app. Works from any directory.
.DESCRIPTION
  Resolves the frontend directory from the script location, so running it while
  already inside frontend/ does not produce "cannot find path ...\frontend\frontend".
  Also clears a stale Next dev server, which otherwise refuses to start and
  leaves an older build serving on port 3000.
#>
param([int]$Port = 3000)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existing) {
    $p = Get-Process -Id $existing.OwningProcess -ErrorAction SilentlyContinue
    Write-Host "Stopping stale dev server on port $Port ($($p.ProcessName) pid=$($p.Id))" -ForegroundColor Yellow
    Stop-Process -Id $existing.OwningProcess -Force
    Start-Sleep -Seconds 3
}

Set-Location (Join-Path $root 'frontend')
Write-Host "Web -> http://localhost:$Port" -ForegroundColor Green
npm run dev -- --port $Port
