# ===============================================
# SYNC-2AI - Script đồng bộ 2 AI (Mavis + Antigravity)
# ===============================================
# Chạy TRƯỚC khi code để:
# 1. Pull code mới nhất từ main
# 2. Check branch status
# 3. Check pending changes
# 4. Xem AI kia đang làm gì
# 5. Cảnh báo conflict tiềm năng
# ===============================================

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
$LogFile = "$ProjectRoot\CHANGELOG-2AI.md"

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  SYNC-2AI - Kiem tra dong bo 2 AI" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Bước 1: Git status
Write-Host "[1/6] Git status (branch hien tai + remote)..." -ForegroundColor Yellow
$currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
$remoteUrl = git remote get-url origin 2>&1
$lastCommit = git log -1 --oneline 2>&1
Write-Host "  Branch: $currentBranch" -ForegroundColor Green
Write-Host "  Remote: $remoteUrl" -ForegroundColor Green
Write-Host "  Last commit: $lastCommit" -ForegroundColor Gray
Write-Host ""

# Bước 2: Fetch latest
Write-Host "[2/6] Fetch latest tu remote..." -ForegroundColor Yellow
git fetch origin 2>&1 | Out-Null
$localHash = git rev-parse HEAD 2>&1
$remoteHash = git rev-parse origin/main 2>&1
$behind = git rev-list --count HEAD..origin/main 2>&1
$ahead = git rev-list --count origin/main..HEAD 2>&1

if ($localHash -eq $remoteHash) {
    Write-Host "  [OK] Local = remote (cap nhat)" -ForegroundColor Green
} elseif ($behind -gt 0) {
    Write-Host "  [!!] Local DANG LUI $behind commits" -ForegroundColor Yellow
    Write-Host "        Can pull: git pull origin main" -ForegroundColor Gray
} elseif ($ahead -gt 0) {
    Write-Host "  [OK] Local DANG TRUOC $ahead commits" -ForegroundColor Green
    Write-Host "        Co the push: git push origin main" -ForegroundColor Gray
}
Write-Host ""

# Bước 3: Branches
Write-Host "[3/6] Tat ca branches (local + remote)..." -ForegroundColor Yellow
git branch -a 2>&1 | ForEach-Object { $line = $_.Trim() ; if ($line -match "^\*|remotes/") { Write-Host "  $line" -ForegroundColor Green } else { Write-Host "  $line" -ForegroundColor Gray } }
Write-Host ""

# Bước 4: Working tree status
Write-Host "[4/6] Working tree (thay doi chua commit)..." -ForegroundColor Yellow
$status = git status --short 2>&1
if ($status) {
    Write-Host "  Co thay doi chua commit:" -ForegroundColor Yellow
    $status | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  [OK] Working tree clean" -ForegroundColor Green
}
Write-Host ""

# Bước 5: Check CHANGELOG-2AI.md
Write-Host "[5/6] Kiem tra CHANGELOG-2AI.md..." -ForegroundColor Yellow
if (Test-Path $LogFile) {
    Write-Host "  [OK] File ton tai" -ForegroundColor Green
    $lastWip = Select-String -Path $LogFile -Pattern "🟡 WIP|🔴 CONFLICT" 2>&1 | Select-Object -First 3
    if ($lastWip) {
        Write-Host "  Tasks dang lam (WIP/CONFLICT):" -ForegroundColor Yellow
        $lastWip | ForEach-Object { Write-Host "    $($_.Line)" -ForegroundColor Gray }
    } else {
        Write-Host "  Khong co WIP/CONFLICT dang mo" -ForegroundColor Green
    }
} else {
    Write-Host "  [!!] KHONG TIM THAY $LogFile" -ForegroundColor Red
    Write-Host "        Tao file CHANGELOG-2AI.md truoc" -ForegroundColor Gray
}
Write-Host ""

# Bước 6: Check conflict potential (xem file nao vua sua)
Write-Host "[6/6] Recent changes (5 commits gan nhat)..." -ForegroundColor Yellow
git log --oneline -5 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  KET QUA KIEM TRA" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if ($behind -gt 0) {
    Write-Host "  [ACTION] Can pull code moi:" -ForegroundColor Yellow
    Write-Host "           git pull origin main" -ForegroundColor Gray
} else {
    Write-Host "  [OK] San sang code!" -ForegroundColor Green
    Write-Host "       Nho doc WORKFLOW-2AI.md truoc khi sua" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  Quy tac nho:" -ForegroundColor Yellow
Write-Host "  1. Doc CHANGELOG-2AI.md (xem AI kia dang lam gi)" -ForegroundColor Gray
Write-Host "  2. Tao branch rieng: git checkout -b feature/xxx" -ForegroundColor Gray
Write-Host "  3. KHONG sua file cua AI khac (xem WORKFLOW-2AI.md)" -ForegroundColor Gray
Write-Host "  4. Ghi log vao CHANGELOG-2AI.md sau khi xong" -ForegroundColor Gray
Write-Host "  5. Push branch, doi user review, KHONG tu merge" -ForegroundColor Gray
Write-Host ""

Read-Host "  Nhan Enter de tiep tuc" | Out-Null
