import * as fs from "fs";
import * as path from "path";

const rawFile = path.join(__dirname, "../raw_sp.txt");
const outFile = path.join(__dirname, "../TAO-BANG-SAN-PHAM.sql");

const content = fs.readFileSync(rawFile, "utf-8");
const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);

let sql = `-- ====================================================
-- TẠO BẢNG DANH SÁCH SẢN PHẨM & BƠM DỮ LIỆU
-- ====================================================

-- 1. Xoá bảng cũ (nếu có) để tạo mới sạch sẽ
DROP TABLE IF EXISTS san_pham CASCADE;

-- 2. Tạo cấu trúc bảng
CREATE TABLE IF NOT EXISTS san_pham (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ma_sp TEXT NOT NULL,
  loai_sp TEXT NOT NULL,
  ma_dm TEXT NOT NULL,
  ten_sp TEXT NOT NULL,
  dinh_muc NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật bảo mật RLS
ALTER TABLE san_pham ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated" ON san_pham;
CREATE POLICY "Allow all for authenticated" ON san_pham FOR ALL USING (true) WITH CHECK (true);

-- Bật Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE san_pham;

-- 3. Bơm dữ liệu ban đầu
INSERT INTO san_pham (ma_sp, loai_sp, ma_dm, ten_sp, dinh_muc) VALUES
`;

const values: string[] = [];

for (const line of lines) {
  const parts = line.split("\t");
  if (parts.length < 2) continue;

  const ma_sp = parts[0]?.trim() || "";
  const loai_sp = parts[1]?.trim() || "";
  const ma_dm = parts[2]?.trim() || "";
  const ten_sp = (parts[3]?.trim() || "").replace(/'/g, "''");
  
  let dinh_muc_str = parts[4]?.trim() || "0";
  let dinh_muc = parseFloat(dinh_muc_str);
  if (isNaN(dinh_muc)) dinh_muc = 0;

  values.push(`('${ma_sp}', '${loai_sp}', '${ma_dm}', '${ten_sp}', ${dinh_muc})`);
}

sql += values.join(",\n") + ";\n";

fs.writeFileSync(outFile, sql, "utf-8");
console.log(`✅ Đã tạo file ${outFile}`);
