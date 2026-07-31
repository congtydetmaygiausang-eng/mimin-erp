# ============================================
# MIMIN ERP - PowerShell wrapper cho apply-migrations
# Chạy: powershell -ExecutionPolicy Bypass -File apply-migrations.ps1
# Hoặc: .\apply-migrations.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🔍 MIMIN ERP - Apply Migrations (PowerShell)" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "❌ Node.js chưa cài. Tải tại: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $($node.Version)" -ForegroundColor Green

# Check .env.local
$envPath = Join-Path $PSScriptRoot "apps\web\.env.local"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ Không tìm thấy: $envPath" -ForegroundColor Red
    Write-Host "   Sếp cần tạo file này trước (xem HUONG_DAN_SUPABASE_TUNG_BUOC.md)" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ .env.local: $envPath" -ForegroundColor Green

# Check migrations
$migPath = Join-Path $PSScriptRoot "supabase-migrations\001_init_schema.sql"
if (-not (Test-Path $migPath)) {
    Write-Host "❌ Không tìm thấy: $migPath" -ForegroundColor Red
    exit 1
}
$size = (Get-Item $migPath).Length
Write-Host "✅ Migration file: 001_init_schema.sql ($([math]::Round($size/1KB, 1)) KB)" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Bắt đầu check schema..." -ForegroundColor Cyan
Write-Host ""

# Chạy Node script
& node apply-migrations.js

Write-Host ""
Write-Host "💡 TIP: Sau khi apply xong, chạy:" -ForegroundColor Yellow
Write-Host "   node verify-supabase.js" -ForegroundColor White
Write-Host ""
