# ============================================
# Test MiniMax API Key (cu + moi)
# Chay: powershell -ExecutionPolicy Bypass -File test-minimax-new-key.ps1
# ============================================

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEST MINIMAX API KEYS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Key moi (sk-api-...) tu file env cua sep Sang
$newKey = "sk-api-QXS06nxGRQDehQm0cB68iIeKd7FhTbgFXe9NH-yCCLLk6aEY70qzNUVTMy7u1FO2wXaaN1zx_IA4deuoTzmY72ibJnYGL-dF2mwg0N4NnCFtJ1xTobbykNU"

# Key cu (MINIMAX-...) tu .env.local
$oldKey = "MINIMAX-2H88K62N-MZP0RQFD-9F4NHQ2D-M2WPK7T4"

function Test-MiniMaxKey {
    param(
        [string]$Label,
        [string]$Key,
        [string]$Model = "abab6.5s-chat"
    )
    Write-Host ""
    Write-Host "  [Test] $Label (key prefix: $($Key.Substring(0, [Math]::Min(15, $Key.Length)))...)" -ForegroundColor Yellow
    try {
        $body = @{
            model = $Model
            messages = @(@{ role = "user"; content = "hi" })
            max_tokens = 20
        } | ConvertTo-Json -Depth 5 -Compress

        $headers = @{
            "Authorization" = "Bearer $Key"
            "Content-Type"  = "application/json"
        }

        $res = Invoke-WebRequest `
            -Uri "https://api.minimax.io/v1/chat/completions" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -TimeoutSec 30 `
            -ErrorAction Stop

        Write-Host "    [OK] Status: $($res.StatusCode)" -ForegroundColor Green
        $data = $res.Content | ConvertFrom-Json
        $reply = $data.choices[0].message.content
        Write-Host "    Response: $reply" -ForegroundColor Green
        return $true
    } catch {
        $sc = $_.Exception.Response.StatusCode.value__
        $errBody = $_.ErrorDetails.Message
        Write-Host "    [FAIL] Status: $sc" -ForegroundColor Red
        Write-Host "    Error: $errBody" -ForegroundColor Red

        if ($errBody -match "1004") {
            Write-Host "    -> Key khong phai International hoac da bi revoke" -ForegroundColor Yellow
        } elseif ($sc -eq 401) {
            Write-Host "    -> Key sai hoac het han" -ForegroundColor Yellow
        } elseif ($sc -eq 403) {
            Write-Host "    -> Key het quota hoac bi khoa" -ForegroundColor Yellow
        } elseif ($sc -eq 429) {
            Write-Host "    -> Rate limit" -ForegroundColor Yellow
        }
        return $false
    }
}

# Test key moi
$newOk = Test-MiniMaxKey -Label "KEY MOI (sk-api-...) tu file env" -Key $newKey

# Test key cu (de so sanh)
$oldOk = Test-MiniMaxKey -Label "KEY CU (MINIMAX-...) tu .env.local" -Key $oldKey

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KET QUA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($newOk) {
    Write-Host "  [OK] KEY MOI (sk-api-...) HOAT DONG!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  ==> Cap nhat .env.local:" -ForegroundColor Cyan
    Write-Host "      MINIMAX_API_KEY=$newKey" -ForegroundColor White
    Write-Host ""
    Write-Host "  ==> Chay deploy-step-2.ps1 de day key moi len Vercel" -ForegroundColor Cyan
} else {
    Write-Host "  [FAIL] KEY MOI cung khong work. Co the can generate key moi tu platform.minimax.io" -ForegroundColor Red
    Write-Host ""
    if ($oldOk) {
        Write-Host "  [INFO] Key cu van OK - van co the dung" -ForegroundColor Yellow
    }
}
Write-Host ""
