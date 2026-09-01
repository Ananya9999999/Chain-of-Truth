<#
.SYNOPSIS
  Start the Chain of Truth infrastructure (PostgreSQL + pgvector, MinIO).
.EXAMPLE
  .\scripts\dev-up.ps1
#>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path '.env')) {
    Write-Host 'No .env found - creating one from .env.example' -ForegroundColor Yellow
    Copy-Item '.env.example' '.env'
}

Write-Host 'Starting containers...' -ForegroundColor Cyan
docker compose -f docker/docker-compose.yml --env-file .env up -d
if ($LASTEXITCODE -ne 0) { throw 'docker compose failed' }

Write-Host 'Waiting for PostgreSQL...' -ForegroundColor Cyan
$ok = $false
foreach ($i in 1..40) {
    docker exec cot-postgres pg_isready -U cot -d chain_of_truth *> $null
    if ($LASTEXITCODE -eq 0) { $ok = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ok) { throw 'PostgreSQL did not become ready in time' }

$ver = docker exec cot-postgres psql -U cot -d chain_of_truth -tAc "SELECT extversion FROM pg_extension WHERE extname='vector';"
Write-Host ''
Write-Host 'Infrastructure ready.' -ForegroundColor Green
Write-Host "  PostgreSQL    localhost:5432   db=chain_of_truth  pgvector=$ver"
Write-Host '  MinIO API     http://localhost:9000'
Write-Host '  MinIO console http://localhost:9001'
