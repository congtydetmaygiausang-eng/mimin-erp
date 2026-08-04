$ErrorActionPreference = 'Continue'
$url = 'https://mimin-erp.vercel.app/nhan-su/'
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
try {
  $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 30
  $stopwatch.Stop()
  $size = $response.RawContentStream.Length
  Write-Host ('  Status:    ' + $response.StatusCode)
  Write-Host ('  Time:      ' + $stopwatch.ElapsedMilliseconds + ' ms')
  Write-Host ('  Size:      ' + [math]::Round($size / 1KB, 1) + ' KB')
  Write-Host ('  Cache:     ' + $response.Headers['cache-control'])
} catch {
  Write-Host ('  Error:     ' + $_.Exception.Message)
}
