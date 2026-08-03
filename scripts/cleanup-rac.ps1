$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName Microsoft.VisualBasic

$paths = @(
  'apps\web\src\app\(main',
  'apps\web\src\lib\doi-tac-gia-cong.ts.bak',
  'apps\web\src\lib\more-workflow-data.ts.bak2',
  'apps\web\src\lib\real-workflow-data.ts.bak',
  'apps\web\src\lib\real-workflow-data.ts.bak2',
  'apps\web\src\lib\users.ts.bak',
  '_danh sách nhân sự - NHÂN SỰ.csv',
  '_danh sách nhân sự.xlsx',
  'danh sach đối tác gia công - ĐỐI TÁC NCC.csv',
  'danh sach đối tác gia công.xlsx'
)

foreach ($p in $paths) {
  if (Test-Path $p) {
    $isDir = (Get-Item $p).PSIsContainer
    try {
      if ($isDir) {
        Microsoft.VisualBasic.FileIO.FileSystem::DeleteDirectory($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
        Write-Host "RECYCLED-DIR: $p"
      } else {
        Microsoft.VisualBasic.FileIO.FileSystem::DeleteFile($p, 'OnlyErrorDialogs', 'SendToRecycleBin')
        Write-Host "RECYCLED: $p"
      }
    } catch {
      Write-Host "FAIL: $p - $($_.Exception.Message)"
    }
  } else {
    Write-Host "NOT-FOUND: $p"
  }
}
