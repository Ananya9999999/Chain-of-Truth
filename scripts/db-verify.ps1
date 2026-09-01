<#
.SYNOPSIS
  Verify PostgreSQL, pgvector and MinIO are healthy.
#>
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host '-- Containers --' -ForegroundColor Cyan
docker compose -f docker/docker-compose.yml --env-file .env ps

Write-Host ''
Write-Host '-- PostgreSQL --' -ForegroundColor Cyan
docker exec cot-postgres pg_isready -U cot -d chain_of_truth

Write-Host ''
Write-Host '-- Extensions --' -ForegroundColor Cyan
docker exec cot-postgres psql -U cot -d chain_of_truth -c "SELECT extname, extversion FROM pg_extension ORDER BY extname;"

Write-Host ''
Write-Host '-- pgvector smoke test --' -ForegroundColor Cyan
docker exec cot-postgres psql -U cot -d chain_of_truth -tAc "SELECT '[1,2,3]'::vector <-> '[1,2,4]'::vector AS l2_distance;"
