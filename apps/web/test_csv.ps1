$csvPath = "f:\Tool\mimin-erp\apps\web\scratch_customers.csv"
$lines = [System.IO.File]::ReadAllLines($csvPath, [System.Text.Encoding]::UTF8)

Write-Host "Total lines: $($lines.Length)"
$line = $lines[1]
$singleCsv = $lines[0] + "`n" + $line
$parsed = ConvertFrom-Csv -InputObject $singleCsv
$parsed | ConvertTo-Json
