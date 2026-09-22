$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$supabaseUrl = "https://ejcuqyaiwabfygyesvxj.supabase.co/rest/v1/khach_hang"
$apiKey = "sb_publishable_jjxSsC-ADuxGWpWfH6KI5g_3EgU1ADd"

$headers = @{
    "apikey" = $apiKey
    "Authorization" = "Bearer $apiKey"
    "Prefer" = "return=representation"
}

$newCustomer = @{
    id = [guid]::NewGuid().ToString()
    ma_kh = "KH-9999"
    ten_kh = "TEST CUSTOMER"
    sdt = "0999999999"
    loai = "Cá nhân"
    cong_no = 0
    trang_thai = "hoat_dong"
}
$payload = $newCustomer | ConvertTo-Json -Compress -Depth 5
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)

try {
    Invoke-RestMethod -Uri $supabaseUrl -Headers $headers -Method Post -Body $bytes -ContentType "application/json; charset=utf-8"
    Write-Host "Success with GUID id"
} catch {
    Write-Host "Failed with GUID id: $_"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody"
}
