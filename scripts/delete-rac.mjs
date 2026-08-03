// Xoá folder rac (main\ (có dấu \) va các subfolder/file bên trong
// Sau khi da copy file can thiet sang dung vi tri
import { execFileSync } from "child_process";

const target = "D:\\APP ERP POLOMIMIN\\MIMIN-ERP-v89.6.8-code\\mimin-erp\\apps\\web\\src\\app\\(main\\";
const escaped = target.replace(/'/g, "''");
const psScript = `
  Add-Type -AssemblyName Microsoft.VisualBasic
  # Xoá từng file bên trong trước
  Get-ChildItem -LiteralPath '${escaped}' -Recurse -File | ForEach-Object {
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile(\$_.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin')
  }
  # Xoá folder con
  Get-ChildItem -LiteralPath '${escaped}' -Recurse -Directory | Sort-Object { \$_.FullName.Length } -Descending | ForEach-Object {
    [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory(\$_.FullName, 'OnlyErrorDialogs', 'SendToRecycleBin')
  }
  # Cuối cùng xoá folder chính (parent)
  [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory('${escaped.replace(/\\$/, '')}', 'OnlyErrorDialogs', 'SendToRecycleBin')
  Write-Host 'DONE'
`;

try {
  const out = execFileSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    psScript,
  ], { stdio: "pipe" });
  console.log("OUT:", out.toString());
} catch (e) {
  console.error("STDERR:", e.stderr?.toString());
  console.error("STDOUT:", e.stdout?.toString());
  process.exit(1);
}
