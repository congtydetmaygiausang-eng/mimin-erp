# ===============================================
# MIMIN ERP v89.6.8 - Script chạy nhanh (Windows PowerShell)
# ===============================================
# Cách dùng: Mở PowerShell, cd vào folder này, chạy:
#   .\start-dev.ps1
# Hoặc double-click file này
# ===============================================

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$WebAppPath = Join-Path $ProjectRoot "apps\web"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  MIMIN ERP v89.6.8 - Dev Server Launcher" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Kiểm tra Node.js
Write-Host "[1/4] Kiem tra Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [LOI] Khong tim thay Node.js!" -ForegroundColor Red
    Write-Host "  Tai tai: https://nodejs.org/" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  [OK] Node.js: $nodeVersion" -ForegroundColor Green

# Bước 2: Kiểm tra npm
Write-Host "[2/4] Kiem tra npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [LOI] npm khong kha dung!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  [OK] npm: $npmVersion" -ForegroundColor Green

# Bước 3: Kiểm tra dependencies
Write-Host "[3/4] Kiem tra dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "$WebAppPath\node_modules")) {
    Write-Host "  Chua co node_modules. Tien hanh cai dat..." -ForegroundColor Yellow
    Push-Location $WebAppPath
    npm install
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [LOI] Cai dat that bai!" -ForegroundColor Red
        pause
        exit 1
    }
}
Write-Host "  [OK] node_modules OK" -ForegroundColor Green

# Bước 4: Chạy dev server
Write-Host "[4/4] Khoi dong dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "===============================================" -ForegroundColor Green
Write-Host "  Server se chay tai: http://localhost:3000" -ForegroundColor Green
Write-Host "  Nhan Ctrl+C de dung server" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""

Push-Location $WebAppPath
try {
    npm run dev
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Server da dung." -ForegroundColor Yellow
pause
