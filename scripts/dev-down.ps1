<#
.SYNOPSIS
  Stop the Chain of Truth infrastructure. Data volumes are preserved.
.PARAMETER Purge
  Also delete the database and object-storage volumes (destroys all local data).
#>
param([switch]$Purge)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

if ($Purge) {
    Write-Host 'Stopping containers AND DELETING ALL LOCAL DATA...' -ForegroundColor Red
    docker compose -f docker/docker-compose.yml --env-file .env down -v
} else {
    Write-Host 'Stopping containers (data preserved)...' -ForegroundColor Cyan
    docker compose -f docker/docker-compose.yml --env-file .env down
}
