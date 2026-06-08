# Kisucha Studio - Windows deploy script
# Usage: .\deploy.ps1
# Pushes to Gitea then triggers update on server via SSH

param(
    [string]$Server = "192.168.20.80",
    [string]$User   = "kisucha",
    [string]$AppDir = "/var/www/landing"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/3] Gitea push..." -ForegroundColor Cyan
Set-Location $PSScriptRoot
git add -A
$status = git status --porcelain
if ($status) {
    git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git push origin master

Write-Host "[2/3] Server update (SSH)..." -ForegroundColor Cyan
ssh "${User}@${Server}" "bash ${AppDir}/deploy/update.sh"

Write-Host "[3/3] Deploy complete!" -ForegroundColor Green
Write-Host "  URL: http://www.dogsound.net"
