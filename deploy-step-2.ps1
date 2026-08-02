# ============================================
# MIMIN ERP - Step 2: Set env + Deploy (PowerShell native)
# Chay SAU khi da vercel login + vercel link xong
# ============================================

$ErrorActionPreference = "Stop"

# Su dung vercel.cmd de bypass PowerShell wrapper bug
$vercelCmd = "vercel.cmd"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MIMIN ERP - Set Env + Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check vercel da login chua
$vercelWho = & $vercelCmd whoami 2>$null
if (-not $vercelWho) {
    Write-Host "[ERR] Chua login Vercel. Chay: vercel login" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Logged in: $vercelWho" -ForegroundColor Green

# Check project da link chua
if (-not (Test-Path ".vercel\project.json")) {
    Write-Host "[ERR] Chua link project. Chay: vercel link --project mimin-erp --yes" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Project linked" -ForegroundColor Green

# Doc keys tu apps/web/.env.local
$envFile = "apps\web\.env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERR] Khong tim thay $envFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[Step 1] Set Environment Variables" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

# Parse .env.local
$envValues = @{}
foreach ($line in (Get-Content $envFile)) {
    if ($line -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+?)\s*$') {
        $name = $Matches[1]
        $val = $Matches[2] -replace '^"', '' -replace '"$', ''
        $envValues[$name] = $val
    }
}

# Danh sach env can set
$wantedKeys = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "DEEPSEEK_API_KEY",
    "MINIMAX_API_KEY",
    "GEMINI_API_KEY",
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "LARK_APP_ID",
    "LARK_APP_SECRET"
)

$setCount = 0
$skipCount = 0

foreach ($name in $wantedKeys) {
    if (-not $envValues.ContainsKey($name)) {
        Write-Host "   [SKIP] $name (khong co trong .env.local)" -ForegroundColor Yellow
        $skipCount++
        continue
    }
    $val = $envValues[$name]
    if ([string]::IsNullOrWhiteSpace($val)) {
        Write-Host "   [SKIP] $name (rong)" -ForegroundColor Yellow
        $skipCount++
        continue
    }

    $preview = $val.Substring(0, [Math]::Min(15, $val.Length))
    Write-Host "   Setting $name = $preview..." -ForegroundColor Gray

    # Remove neu ton tai (im lai output)
    & $vercelCmd env rm $name production --yes 2>&1 | Out-Null

    # Add moi - su dung echo de pipe value vao stdin
    $tmpFile = [System.IO.Path]::GetTempFileName()
    try {
        Set-Content -Path $tmpFile -Value $val -NoNewline -Encoding UTF8
        $content = Get-Content -Path $tmpFile -Raw
        # Pipe value vao vercel env add
        $output = $content | & $vercelCmd env add $name production --yes 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-Host "   [OK] $name" -ForegroundColor Green
            $setCount++
        } else {
            Write-Host "   [FAIL] $name : $output" -ForegroundColor Red
        }
    } finally {
        Remove-Item -Path $tmpFile -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "Set: $setCount / $($wantedKeys.Count) bien" -ForegroundColor Cyan

Write-Host ""
Write-Host "[Step 2] Deploy" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan
Write-Host "Dang deploy..." -ForegroundColor Yellow
Write-Host ""

# Build + deploy tu root
& $vercelCmd deploy --prod --yes 2>&1 | Tee-Object -FilePath "vercel-deploy.log"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  DEPLOY THANH CONG!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vao https://vercel.com/mimin-erp/mimin-erp de xem URL + log" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[ERR] Deploy that bai. Check vercel-deploy.log" -ForegroundColor Red
    exit 1
}
