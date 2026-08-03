// Cleanup rac: xoa folder rác, file .bak, file CSV/XLSX o root
// Su dung shell:recycle bin (Windows) hoac trash (POSIX)
// Author: Mavis - 2026-08-03

import { existsSync, statSync, unlinkSync, rmdirSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { execFileSync } from "child_process";

const root = resolve(".");

const targets = [
  // Folder rac (chỉ có subfolder ")")
  "apps/web/src/app/(main",
  // File .bak
  "apps/web/src/lib/doi-tac-gia-cong.ts.bak",
  "apps/web/src/lib/more-workflow-data.ts.bak2",
  "apps/web/src/lib/real-workflow-data.ts.bak",
  "apps/web/src/lib/real-workflow-data.ts.bak2",
  "apps/web/src/lib/users.ts.bak",
  // File CSV/XLSX o root (da import xong)
  "_danh sách nhân sự - NHÂN SỰ.csv",
  "_danh sách nhân sự.xlsx",
  "danh sach đối tác gia công - ĐỐI TÁC NCC.csv",
  "danh sach đối tác gia công.xlsx",
];

function rmDirRecursive(p) {
  if (!existsSync(p)) return false;
  const stat = statSync(p);
  if (stat.isDirectory()) {
    for (const f of readdirSync(p)) {
      rmDirRecursive(join(p, f));
    }
    rmdirSync(p);
  } else {
    unlinkSync(p);
  }
  return true;
}

function trashWindows(absPath) {
  // Use PowerShell to move to Recycle Bin
  const isDir = statSync(absPath).isDirectory();
  const escaped = absPath.replace(/'/g, "''");
  const psScript = `
    Add-Type -AssemblyName Microsoft.VisualBasic
    ${isDir
      ? `[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteDirectory('${escaped}', 'OnlyErrorDialogs', 'SendToRecycleBin')`
      : `[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${escaped}', 'OnlyErrorDialogs', 'SendToRecycleBin')`}
  `;
  try {
    execFileSync("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      psScript,
    ], { stdio: "pipe" });
    return true;
  } catch (e) {
    console.error(`   STDERR: ${e.stderr?.toString() || e.message}`);
    return false;
  }
}

let ok = 0, fail = 0, notFound = 0;
for (const rel of targets) {
  const abs = resolve(root, rel);
  if (!existsSync(abs)) {
    console.log(`NOT-FOUND: ${rel}`);
    notFound++;
    continue;
  }
  const stat = statSync(abs);
  const isDir = stat.isDirectory();
  const moved = trashWindows(abs);
  if (moved) {
    console.log(`RECYCLED${isDir ? "-DIR" : ""}: ${rel}`);
    ok++;
  } else {
    console.log(`FAIL: ${rel}`);
    fail++;
  }
}

console.log(`\n=== Summary: ${ok} recycled, ${fail} failed, ${notFound} not found ===`);
process.exit(fail > 0 ? 1 : 0);
