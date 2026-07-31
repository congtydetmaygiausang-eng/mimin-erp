# ============================================
# MIMIN ERP - Auto Deploy to Vercel
# Chạy: powershell -ExecutionPolicy Bypass -File deploy-vercel.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 MIMIN ERP - Deploy to Vercel" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "❌ Node.js chưa cài. Tải tại: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $($node.Version)" -ForegroundColor Green

# Check git
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "❌ Git chưa cài. Tải tại: https://git-scm.com" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git: $(git --version)" -ForegroundColor Green

# Check vercel CLI
$vercel = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercel) {
    Write-Host "⚠️  Vercel CLI chưa cài. Đang cài..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cài Vercel CLI thất bại" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Vercel CLI: $(vercel --version)" -ForegroundColor Green

Write-Host ""
Write-Host "📋 BƯỚC 1: Kiểm tra Git status" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
$branch = git branch --show-current
Write-Host "   Branch: $branch"
$status = git status --short
if ($status) {
    Write-Host "   Uncommitted changes:" -ForegroundColor Yellow
    Write-Host $status
} else {
    Write-Host "   Working tree clean ✅" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 BƯỚC 2: Convert sang SSR mode (nếu cần)" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
$configPath = "apps\web\next.config.ts"
$config = Get-Content $configPath -Raw
if ($config -match 'output:\s*"export"') {
    Write-Host "   Project đang dùng STATIC EXPORT." -ForegroundColor Yellow
    $answer = Read-Host "   Convert sang SSR để dùng API routes? (y/n)"
    if ($answer -eq "y") {
        $newConfig = $config -replace 'output:\s*"export",?\s*\n', ''
        Set-Content -Path $configPath -Value $newConfig
        Write-Host "   ✅ Đã chuyển sang SSR mode" -ForegroundColor Green
    }
} else {
    Write-Host "   ✅ Đã ở SSR mode" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 BƯỚC 3: Restore API routes" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
$apiDir = "apps\web\src\app\api"
$docsApi = "apps\web\docs\lark-api-routes"
if (-not (Test-Path $apiDir)) {
    Write-Host "   Restoring API routes từ docs..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "$apiDir\v1\lark\oauth\start" -Force | Out-Null
    New-Item -ItemType Directory -Path "$apiDir\v1\lark\oauth\callback" -Force | Out-Null
    New-Item -ItemType Directory -Path "$apiDir\v1\lark\oauth\refresh" -Force | Out-Null
    New-Item -ItemType Directory -Path "$apiDir\v1\lark\bot\run" -Force | Out-Null
    New-Item -ItemType Directory -Path "$apiDir\v1\lark\webhook" -Force | Out-Null
    
    Copy-Item "$docsApi\lark-oauth-start.ts" "$apiDir\v1\lark\oauth\start\route.ts" -Force
    Copy-Item "$docsApi\lark-oauth-callback.ts" "$apiDir\v1\lark\oauth\callback\route.ts" -Force
    Copy-Item "$docsApi\lark-oauth-refresh.ts" "$apiDir\v1\lark\oauth\refresh\route.ts" -Force
    Copy-Item "$docsApi\lark-bot-run.ts" "$apiDir\v1\lark\bot\run\route.ts" -Force
    Copy-Item "$docsApi\lark-webhook.ts" "$apiDir\v1\lark\webhook\route.ts" -Force
    Write-Host "   ✅ 5 API routes restored" -ForegroundColor Green
} else {
    Write-Host "   ✅ API routes đã có sẵn" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 BƯỚC 4: Login Vercel" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
$vercelWho = vercel whoami 2>$null
if (-not $vercelWho) {
    Write-Host "   Chưa login Vercel. Đang mở browser để login..." -ForegroundColor Yellow
    vercel login
} else {
    Write-Host "   ✅ Đã login: $vercelWho" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 BƯỚC 5: Set Environment Variables" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   Sếp cần set các env sau trên Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   • NEXT_PUBLIC_SUPABASE_URL"
Write-Host "   • NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "   • LARK_APP_ID, LARK_APP_SECRET"
Write-Host "   • DEEPSEEK_API_KEY, MINIMAX_API_KEY"
Write-Host ""
$answer = Read-Host "   Sếp đã set env vars trên Vercel chưa? (y/n)"
if ($answer -ne "y") {
    Write-Host "   ⏸️  Sếp vào https://vercel.com/dashboard để set env trước" -ForegroundColor Yellow
    Write-Host "   Sau đó chạy lại script này." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "📋 BƯỚC 6: Deploy lên Vercel" -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   Đang deploy..." -ForegroundColor Yellow
vercel deploy --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "🎉 DEPLOY THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Sếp vào https://vercel.com/dashboard để xem URL" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🔗 Sau khi deploy, sếp cần:" -ForegroundColor Yellow
    Write-Host "   1. Cập nhật Lark App → Redirect URL: https://[your-domain]/lark-callback"
    Write-Host "   2. Cập nhật Lark App → Webhook URL: https://[your-domain]/api/v1/lark/webhook"
    Write-Host "   3. Test OAuth ở /lark-setup/"
    Write-Host "   4. Gửi card test ở /lark-card-builder/"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deploy thất bại. Check log ở trên." -ForegroundColor Red
    exit 1
}
