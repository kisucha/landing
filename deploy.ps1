# Kisucha Studio — Windows 배포 스크립트
# 사용법: .\deploy.ps1
# 동작: 로컬 변경사항 push 후 서버에 SSH로 업데이트 명령 실행

param(
    [string]$Server   = "192.168.20.80",
    [string]$User     = "kisucha",       # 서버 SSH 사용자명으로 변경
    [string]$AppDir   = "/var/www/landing"
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

Write-Host "[2/3] 서버 업데이트 (SSH)..." -ForegroundColor Cyan
ssh "${User}@${Server}" "bash ${AppDir}/deploy/update.sh"

Write-Host "[3/3] 배포 완료!" -ForegroundColor Green
Write-Host "  사이트: http://www.dogsound.net"
