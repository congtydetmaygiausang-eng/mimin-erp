# Sync 20 NCC gia cong may qua SQL INSERT truc tiep vao auth.users
# (GoTrue Admin API bi 401 voi sb_secret_, nen dung SQL)
# 2026-08-05 - Mavis

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# ===== Load env =====
$envPath = "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web\.env.local"
$cfg = @{}
$content = [System.IO.File]::ReadAllText($envPath)
$lines = $content -split "`r?`n"
foreach ($line in $lines) {
    if ($line -and -not $line.StartsWith('#')) {
        $idx = $line.IndexOf('=')
        if ($idx -gt 0) {
            $key = $line.Substring(0, $idx).Trim()
            $val = $line.Substring($idx + 1).Trim().Trim("'", '"')
            $cfg[$key] = $val
        }
    }
}

if (-not $env:SUPABASE_PAT) {
    $env:SUPABASE_PAT = 'sbp_REDACTED'
}
$PAT = $env:SUPABASE_PAT
$PROJECT_REF = 'ejcuqyaiwabfygyesvxj'

function Invoke-Sql($query) {
    # Build JSON thu cong de tranh PowerShell escape ' thanh ''
    $sqlEsc = $query.Replace('\\', '\\\\').Replace('"', '\"')
    $body = '{"query":"' + $sqlEsc + '"}'
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
    $request = [System.Net.HttpWebRequest]::Create("https://api.supabase.com/v1/projects/$PROJECT_REF/database/query")
    $request.Method = "POST"
    $request.ContentType = "application/json; charset=utf-8"
    $request.Headers.Add("Authorization", "Bearer $PAT")
    $request.ContentLength = $bytes.Length
    $request.Timeout = 30000
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $response = $request.GetResponse()
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    $text = $reader.ReadToEnd()
    $response.Close()
    if ($text) {
        return $text | ConvertFrom-Json
    }
    return $null
}

function Escape-Sql($s) {
    return $s.Replace("'", "''")
}

# ===== Lay 20 NCC =====
Write-Host "Lay 20 NCC gia cong may..." -ForegroundColor Cyan
$nccs = Invoke-Sql "SELECT ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt FROM nha_cung_cap WHERE ma_ncc LIKE 'GC-%' AND trang_thai = 'dang_hop_tac' ORDER BY ma_ncc"
Write-Host "Tim thay $($nccs.Count) NCC" -ForegroundColor Yellow

# ===== Sync 20 NCC =====
Write-Host "`n========== SYNC 20 NCC GIA CONG MAY ==========`n" -ForegroundColor Cyan

$created = 0; $updated = 0; $failed = 0
foreach ($n in $nccs) {
    $maNcc = $n.ma_ncc
    $email = "gc-$($maNcc.ToLower())@mimin.vn"
    $nguoiLh = if ($n.nguoi_lh) { $n.nguoi_lh.Trim() } else { '' }
    $tenNcc = $n.ten_ncc
    $name = if ($nguoiLh) { $nguoiLh } else { $tenNcc }
    $chuyenMon = $n.chuyen_mon
    $chucVu = "Đối tác gia công - $maNcc ($chuyenMon)"
    $nameEsc = Escape-Sql $name
    $chucVuEsc = Escape-Sql $chucVu

    # 1. Kiem tra user da ton tai
    $ex = Invoke-Sql "SELECT id FROM auth.users WHERE email = '$email'"
    if ($ex -and $ex.Count -gt 0) {
        $authId = $ex[0].id
        $status = 'EXISTED'
        $color = 'Yellow'
        $updated++
    } else {
        # 2. Tao user moi trong auth.users (SQL INSERT)
        $insertSql = @"
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', '$email', crypt('Mimin@123', gen_salt('bf')), NOW(), '{"full_name": "$nameEsc", "role": "partner"}'::jsonb, '{"role": "partner", "provider": "email", "providers": ["email"]}'::jsonb, NOW(), NOW(), '', '', '', '') RETURNING id
"@
        try {
            $res = Invoke-Sql $insertSql
            $authId = $res[0].id
            $status = 'CREATED'
            $color = 'Green'
            $created++
        } catch {
            $errMsg = $_.Exception.Message
            if ($errMsg -match 'duplicate') {
                $ex2 = Invoke-Sql "SELECT id FROM auth.users WHERE email = '$email'"
                $authId = $ex2[0].id
                $status = 'EXISTED'
                $color = 'Yellow'
                $updated++
            } else {
                Write-Host "  FAIL: $email - $($errMsg.Substring(0, [Math]::Min(200, $errMsg.Length)))" -ForegroundColor Red
                $failed++
                continue
            }
        }
    }

    # 3. Upsert vao bang users (custom)
    $upsertSql = @"
INSERT INTO users (id, email, name, role, "chucVu", "phongBan", "isActive", "created_at", "updated_at") VALUES ('$authId', '$email', '$nameEsc', 'partner', '$chucVuEsc', 'doi-tac', true, NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role, "chucVu" = EXCLUDED."chucVu", "phongBan" = EXCLUDED."phongBan", "isActive" = EXCLUDED."isActive", "updated_at" = NOW()
"@
    try {
        Invoke-Sql $upsertSql | Out-Null
        Write-Host "  $status $($email.PadRight(32)) [partner] $name" -ForegroundColor $color
    } catch {
        Write-Host "  USERS FAIL: $email - $($_.Exception.Message.Substring(0, [Math]::Min(200, $_.Exception.Message.Length)))" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`nNCC STATS: Created=$created, Existed=$updated, Failed=$failed" -ForegroundColor Cyan

# ===== Audit =====
Write-Host "`n========== AUDIT TONG KET ==========`n" -ForegroundColor Cyan
$finalAuth = Invoke-Sql "SELECT email FROM auth.users WHERE email LIKE '%@mimin.vn' ORDER BY email"
$finalUsers = Invoke-Sql "SELECT email, role FROM users WHERE email LIKE '%@mimin.vn' ORDER BY role, email"

Write-Host "auth.users @mimin.vn: $($finalAuth.Count) user" -ForegroundColor Yellow
$finalAuth | ForEach-Object { Write-Host "  - $($_.email)" }

Write-Host "`nbang users @mimin.vn: $($finalUsers.Count) user" -ForegroundColor Yellow
$finalUsers | ForEach-Object { Write-Host "  - [$($_.role)] $($_.email)" }

$partners = ($finalUsers | Where-Object { $_.role -eq 'partner' }).Count
Write-Host "`nTONG: $($finalAuth.Count) user @mimin.vn, $partners NCC partner" -ForegroundColor Green
Write-Host "HOAN THANH sync 20 NCC!" -ForegroundColor Green
