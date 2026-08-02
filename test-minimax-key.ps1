# ==========================================
# Test MiniMax API Key
# Chạy: powershell -ExecutionPolicy Bypass -File test-minimax-key.ps1
# ==========================================

$ErrorActionPreference = "Stop"

# Đọc key từ apps/web/.env.local
$envFile = "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Không tìm thấy .env.local" -ForegroundColor Red
    exit 1
}

# Parse .env.local - tìm MINIMAX_API_KEY=
$keyLine = Get-Content $envFile | Where-Object { $_ -match "^MINIMAX_API_KEY=" } | Select-Object -First 1
if (-not $keyLine) {
    Write-Host "❌ Không tìm thấy MINIMAX_API_KEY trong .env.local" -ForegroundColor Red
    exit 1
}

$key = $keyLine -replace "^MINIMAX_API_KEY=", "" -replace '"', ''
$key = $key.Trim()

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST MINIMAX API KEY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Key length: $($key.Length) ký tự"
Write-Host "Key preview: $($key.Substring(0, [Math]::Min(20, $key.Length)))..."
Write-Host ""

# Test 1: International endpoint (api.minimax.io)
Write-Host "[Test 1] International endpoint (api.minimax.io/v1)..." -ForegroundColor Yellow
try {
    $body = @{
        model = "abab6.5s-chat"
        messages = @(@{ role = "user"; content = "hi" })
        max_tokens = 10
    } | ConvertTo-Json -Depth 5

    $headers = @{
        "Authorization" = "Bearer $key"
        "Content-Type"  = "application/json"
    }

    $res = Invoke-WebRequest `
        -Uri "https://api.minimax.io/v1/chat/completions" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -TimeoutSec 30 `
        -ErrorAction Stop

    Write-Host "✅ OK! Status: $($res.StatusCode)" -ForegroundColor Green
    $data = $res.Content | ConvertFrom-Json
    Write-Host "Response: $($data.choices[0].message.content)" -ForegroundColor Green
    Write-Host ""
    Write-Host "👉 Key này dùng được cho International. Vấn đề ở Vercel env var." -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = $_.ErrorDetails.Message
    Write-Host "❌ FAIL Status: $statusCode" -ForegroundColor Red
    Write-Host "Error: $errorBody" -ForegroundColor Red
    Write-Host ""

    # Phân tích lỗi
    if ($errorBody -match "1004") {
        Write-Host "👉 Error 1004 = key sai hoặc key China không dùng được cho International URL" -ForegroundColor Yellow
        Write-Host "👉 Cần generate key MỚI từ https://platform.minimax.io (không phải .com)" -ForegroundColor Yellow
    } elseif ($statusCode -eq 401) {
        Write-Host "👉 Key không hợp lệ hoặc đã bị revoke" -ForegroundColor Yellow
    } elseif ($statusCode -eq 403) {
        Write-Host "👉 Key hết quota hoặc bị khóa" -ForegroundColor Yellow
    } elseif ($statusCode -eq 429) {
        Write-Host "👉 Rate limit - đợi 1 phút rồi test lại" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHECKLIST VERCEL DASHBOARD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Mở: https://vercel.com/mimin-erp/mimin-erp/settings/environment-variables"
Write-Host "2. Tìm MINIMAX_API_KEY:"
Write-Host "   - Nếu chưa có → click 'Add' → paste key → chọn Production/Preview"
Write-Host "   - Nếu có rồi → check value có đầy đủ (không bị cắt)"
Write-Host "3. Sau khi set/update env var → Tab Deployments → click 3 chấm → Redeploy"
Write-Host ""
Write-Host "Key lấy từ: https://platform.minimax.io/user-center/basic-information/interface-key"
Write-Host ""
