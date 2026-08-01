// Helper script: xoá page.tsx cũ, rename page-lenhcat.tsx thành page.tsx
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { resolve } from "path";

const dir = resolve("src/app/(main)/lenh-cat");
const oldFile = resolve(dir, "page.tsx");
const newFile = resolve(dir, "page-lenhcat.tsx");

try {
  // Backup (nếu chưa có)
  const backup = resolve(dir, "page.tsx.backup");
  try {
    writeFileSync(backup, readFileSync(oldFile));
    console.log("✅ Backup:", backup);
  } catch (e) {
    console.log("Backup skipped (already exists or error):", e.message);
  }

  // Read new file content
  const newContent = readFileSync(newFile, "utf8");

  // Overwrite old file with new content
  writeFileSync(oldFile, newContent, "utf8");
  console.log("✅ Overwrote:", oldFile);

  // Delete temp new file
  unlinkSync(newFile);
  console.log("✅ Deleted:", newFile);

  console.log("Done!");
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
}
