$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$csvPath = "f:\Tool\mimin-erp\apps\web\scratch_customers.csv"
$supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co/rest/v1/khach_hang"
$apiKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd"

$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Prefer" = "return=representation"
}

Write-Host "Fetching existing customers from Supabase..."
$existingUrl = $supabaseUrl + "?select=*"
$existing = Invoke-RestMethod -Uri $existingUrl -Headers $headers -Method Get

$existingMap = @{}
$maxKhId = 0
$maxStt = 0
foreach ($kh in $existing) {
    if ($kh.sdt) {
        $existingMap[$kh.sdt] = $kh
    }
    
    if ($kh.ma_kh -match "KH-(\d+)") {
        $num = [int]$matches[1]
        if ($num -gt $maxKhId) {
            $maxKhId = $num
        }
    }
}

Write-Host "Found $($existing.Count) existing customers."

Write-Host "Reading CSV..."
$lines = [System.IO.File]::ReadAllLines($csvPath, [System.Text.Encoding]::UTF8)

$added = 0
$updated = 0
$skipped = 0

if ($lines.Length -gt 1) {
    $headersCsv = "ten","sdt","email","donhang","chitieu","diachi","ghichu"
    for ($i = 1; $i -lt $lines.Length; $i++) {
        $line = $lines[$i]
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        
        $parsed = ConvertFrom-Csv -InputObject $line -Header $headersCsv
        
        $ten = $parsed.ten
        $sdtRaw = $parsed.sdt
        $diaChi = $parsed.diachi
        $tongChiTieuRaw = $parsed.chitieu
        $ghiChu = $parsed.ghichu

        if ($null -eq $ten) { $ten = "" }
        if ($null -eq $sdtRaw) { $sdtRaw = "" }
        if ($null -eq $diaChi) { $diaChi = "" }
        if ($null -eq $ghiChu) { $ghiChu = "" }

        # Remove quotes not needed since ConvertFrom-Csv handles it


        # Normalize phone number
        $sdt = $sdtRaw -replace '\D', ''
        if ($sdt.StartsWith("84")) {
            $sdt = "0" + $sdt.Substring(2)
        }

        if ([string]::IsNullOrWhiteSpace($sdt)) {
            continue
        }

        if ($existingMap.ContainsKey($sdt)) {
            $kh = $existingMap[$sdt]
            if ([string]::IsNullOrWhiteSpace($kh.dia_chi) -and ![string]::IsNullOrWhiteSpace($diaChi)) {
                $payload = @{ dia_chi = $diaChi } | ConvertTo-Json -Compress -Depth 5
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
                $updateUrl = $supabaseUrl + "?id=eq." + $kh.id
                try {
                    Invoke-RestMethod -Uri $updateUrl -Headers $headers -Method Patch -Body $bytes -ContentType "application/json; charset=utf-8" | Out-Null
                    $updated++
                } catch {
                    Write-Host "Failed to update $ten : $_"
                }
            } else {
                $skipped++
            }
        } else {
            $maxKhId++
            $maxStt++
            $newMaKh = "KH-{0:D3}" -f $maxKhId

            $newCustomer = @{
                id = [guid]::NewGuid().ToString()
                ma_kh = $newMaKh
                ten_kh = $ten
                sdt = $sdt
                dia_chi = $diaChi
                ghi_chu = $ghiChu
                cong_no = 0
                loai = "Cá nhân"
                trang_thai = "hoat_dong"
            }
            
            $payload = $newCustomer | ConvertTo-Json -Compress -Depth 5
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
            try {
                Invoke-RestMethod -Uri $supabaseUrl -Headers $headers -Method Post -Body $bytes -ContentType "application/json; charset=utf-8" | Out-Null
                $existingMap[$sdt] = $newCustomer
                $added++
            } catch {
                Write-Host "Failed to insert $ten : $_"
                $maxKhId--
            }
        }
    }
}

Write-Host "Sync Complete!"
Write-Host "Added: $added"
Write-Host "Updated: $updated"
Write-Host "Skipped: $skipped"
