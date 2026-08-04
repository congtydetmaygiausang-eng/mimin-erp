import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";

const rawFile = path.join(__dirname, "../raw_kh.txt");
const outFile = path.join(__dirname, "../NAP-DU-LIEU-KHACH-HANG.sql");

const content = fs.readFileSync(rawFile, "utf-8");
const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);

// Remove the header line
lines.shift();

let sql = `-- BƠM DỮ LIỆU KHÁCH HÀNG (128 dòng)\n`;
sql += `-- Chạy sau khi đã tạo bảng khach_hang\n\n`;
sql += `DELETE FROM khach_hang;\n\n`;
sql += `INSERT INTO khach_hang (id, ma_kh, ten_kh, loai, dia_chi, sdt, email, cong_no, ghi_chu) VALUES\n`;

const values: string[] = [];

for (const line of lines) {
  const parts = line.split("\t");
  if (parts.length < 2) continue;

  const ma_kh = parts[0]?.trim() || "";
  let ten_kh = parts[1]?.trim() || "";
  const sdt = parts[2]?.trim() || "";
  const email = parts[3]?.trim() || "";
  const dia_chi = parts[4]?.trim() || "";
  const loai = parts[5]?.trim() || "";
  const mst = parts[6]?.trim() || "";
  const danh_gia = parts[7]?.trim() || "";
  
  let congNoStr = parts[8]?.trim() || "0";
  // Strip non numeric characters for cong_no
  congNoStr = congNoStr.replace(/[^0-9]/g, "");
  let cong_no = parseInt(congNoStr, 10);
  if (isNaN(cong_no)) cong_no = 0;

  let rawGhiChu = parts[9]?.trim() || "";
  
  let ghi_chu = [];
  if (mst) ghi_chu.push(`MST: ${mst}`);
  if (danh_gia) ghi_chu.push(`Đánh giá: ${danh_gia} sao`);
  if (rawGhiChu) ghi_chu.push(rawGhiChu);
  
  const finalGhiChu = ghi_chu.join(". ");
  const id = crypto.randomUUID();

  // Escape single quotes for SQL
  ten_kh = ten_kh.replace(/'/g, "''");
  const finalGhiChuSql = finalGhiChu.replace(/'/g, "''");

  values.push(`('${id}', '${ma_kh}', '${ten_kh}', '${loai}', '${dia_chi}', '${sdt}', '${email}', ${cong_no}, '${finalGhiChuSql}')`);
}

sql += values.join(",\n") + ";\n";

fs.writeFileSync(outFile, sql, "utf-8");
console.log(`✅ Đã tạo file ${outFile}`);
