$logPath = 'C:\Users\POLOMIMIN\.gemini\antigravity-ide\brain\616c37ce-fab1-42c5-8021-7b0e53be4bf4\.system_generated\logs\transcript_full.jsonl'
$lines = Get-Content -Path $logPath
foreach ($line in $lines) {
    if ($line -match 'view_file' -and $line -match 'lenh-cat-store.tsx') {
        Write-Output $line.Substring(0, [math]::Min(500, $line.Length))
        Write-Output "---"
    }
}
