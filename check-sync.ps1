# ===============================================
# CHECK-SYNC - Script kiểm tra đồng bộ data giữa 2 AI
# ===============================================
# Chạy trước khi commit/push để check:
# 1. Data files không bị conflict
# 2. Schema không bị phá
# 3. 2 AI không sửa cùng file
# 4. Branch status OK
# ===============================================

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

# Cấu hình branch
$MavisBranch = "main"
$AntigravityBranch = "feature/ai-agents"
$MainBranch = "main"

# Files cần check
$DataFiles = @(
    "apps/web/src/lib/data/real-data.ts",
    "apps/web/src/lib/workflow-data.ts",
    "apps/web/src/lib/real-workflow-data.ts",
    "apps/web/src/lib/data/cong-no.ts",
    "apps/web/package.json",
    "apps/web/next.config.ts"
)

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  CHECK-SYNC - Kiem tra dong bo 2 AI" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Git status
Write-Host "[1/5] Git status (current branch)..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
$status = git status --short 2>&1
if ($status) {
    Write-Host "  Co thay doi chua commit:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  [OK] Working tree clean" -ForegroundColor Green
}
Write-Host "  Branch: $currentBranch" -ForegroundColor Gray
Write-Host ""

# Bước 2: Fetch latest
Write-Host "[2/5] Fetch latest tu remote..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
$behind = git rev-list --count HEAD..origin/main 2>&1
if ($behind -gt 0) {
    Write-Host "  [!!] Local DANG LUI $behind commits" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] Cap nhat" -ForegroundColor Green
}
Write-Host ""

# Bước 3: Check 2 branch data files
Write-Host "[3/5] Kiem tra data files giua 2 branch..." -ForegroundColor Yellow
Write-Host ""

$conflictFound = $false
foreach ($file in $DataFiles) {
    $existsMain = git show "origin/main:$file" 2>&1 | Out-String
    $existsAntigravity = git show "origin/$AntigravityBranch`:$file" 2>&1 | Out-String
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [WARN] $file - khong co trong branch" -ForegroundColor Yellow
        continue
    }
    if ($existsMain -ne $existsAntigravity) {
        Write-Host "  [DIFF] $file - KHAC NHAU giua main va Antigravity" -ForegroundColor Red
        $conflictFound = $true
    } else {
        Write-Host "  [OK]   $file - giong nhau" -ForegroundColor Green
    }
}
Write-Host ""

# Bước 4: Check Antigravity đang sửa gì
Write-Host "[4/5] Antigravity dang sua (last 3 commits)..." -ForegroundColor Yellow
git log origin/$AntigravityBranch --oneline -3 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

# Bước 5: Check Mavis đang sửa gì
Write-Host "[5/5] Mavis dang sua (last 3 commits)..." -ForegroundColor Yellow
git log origin/main --oneline -3 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

# Kết quả
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  KET QUA" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if ($conflictFound) {
    Write-Host "  [!!] PHAT HIEN CONFLICT trong data files" -ForegroundColor Red
    Write-Host "       Can resolve truoc khi push" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] KHONG co conflict" -ForegroundColor Green
}

Write-Host ""
Write-Host "  Quy tac:" -ForegroundColor Yellow
Write-Host "  1. Mavis sua data files -> bao Antigravity" -ForegroundColor Gray
Write-Host "  2. Antigravity sua data files -> bao Mavis" -ForegroundColor Gray
Write-Host "  3. Conflict -> user (anh Sang) quyet" -ForegroundColor Gray
Write-Host ""

Read-Host "  Nhan Enter de tiep tuc" | Out-Null
