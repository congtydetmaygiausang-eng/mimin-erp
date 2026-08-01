// Seed 19 user nội bộ thật vào bảng nhan_su (Supabase)
// Chạy SAU khi đã apply schema bằng apply-schema.mjs
//
// Cách chạy:
//   cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
//   node seed-users.mjs
//
// Script này sẽ:
//   1. Xoá sạch user cũ trong bảng nhan_su (nếu có)
//   2. Insert 19 user nội bộ thật
//   3. Verify hiển thị

import pg from "pg";
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.+)$`, "m"));
  return m ? m[1].trim() : null;
};

const dbUrl = get("DATABASE_URL");
if (!dbUrl) {
  console.error("❌ Chưa có DATABASE_URL trong .env.local");
  console.error("Chạy node apply-schema.mjs trước (xem hướng dẫn ở HUONG_DAN_APPLY_SCHEMA.md)");
  process.exit(1);
}

console.log("🔌 Đang kết nối Supabase...");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

// Mapping phongBan → bo_phan (label tiếng Việt)
const BO_PHAN_LABELS = {
  "ban-giam-doc": "Ban Giám Đốc",
  "ke-toan": "Phòng Kế Toán",
  "kinh-doanh": "Phòng Kinh Doanh",
  "marketing": "Phòng Marketing",
  "kho": "Phòng Kho",
  "to-may": "Tổ May",
  "hoan-thien": "Tổ Hoàn Thiện",
};

// 19 user nội bộ thật (khớp với USERS trong src/lib/users.ts)
const USERS = [
  // 6 quản lý
  { maNV: "NV035", email: "sang@mimin.vn",   name: "Hồ Minh Sang",          chucVu: "Quản trị hệ thống",            phongBan: "ban-giam-doc", luongCung: 25000000, sdt: "0901234567" },
  { maNV: "NV001", email: "giau@mimin.vn",   name: "Nguyễn Thị Ngọc Giàu",   chucVu: "GĐ điều hành",                  phongBan: "ban-giam-doc", luongCung: 30000000, sdt: "0912345678" },
  { maNV: "NV002", email: "thanh@mimin.vn",  name: "Bùi Thị Thanh",          chucVu: "Kế toán trưởng + Điều phối SX",phongBan: "ke-toan",     luongCung: 18000000, sdt: "0923456789" },
  { maNV: "NV003", email: "huyen@mimin.vn",  name: "Đỗ Thị Huyền",           chucVu: "Trưởng phòng KH sỉ",            phongBan: "kinh-doanh",  luongCung: 15000000, sdt: "0934567890" },
  { maNV: "NV004", email: "vy@mimin.vn",     name: "Nguyễn Ngọc Cẩm Vy",     chucVu: "Trưởng nhóm Content - Media",    phongBan: "marketing",   luongCung: 14000000, sdt: "0945678901" },
  { maNV: "NV005", email: "hau@mimin.vn",    name: "Nguyễn Quốc Hậu",        chucVu: "Thủ kho trưởng",                 phongBan: "kho",         luongCung: 13000000, sdt: "0956789012" },

  // 3 Cắt
  { maNV: "NV006", email: "giang@mimin.vn",  name: "Nguyễn Hoàng Giang",      chucVu: "Tổ trưởng Cắt",                       phongBan: "to-may",      luongCung: 12000000, sdt: "0966789012" },
  { maNV: "NV007", email: "de@mimin.vn",     name: "Phạm Văn Đệ",            chucVu: "CN Cắt (1400đ trụ / 1200đ tròn / 900đ quần)", phongBan: "to-may", luongCung: 9000000,  sdt: "0977890123" },
  { maNV: "NV008", email: "phu@mimin.vn",    name: "Hồ Văn Minh Phú",        chucVu: "CN Cắt hỗ trợ",                        phongBan: "to-may",      luongCung: 8500000,  sdt: "0988901234" },

  // 4 Đóng gói (gấp xếp)
  { maNV: "NV009", email: "nhi@mimin.vn",    name: "Nguyễn Thị Mỹ Nhi",      chucVu: "Tổ trưởng Gấp xếp",                    phongBan: "hoan-thien",  luongCung: 10000000, sdt: "0999012345" },
  { maNV: "NV010", email: "phuong@mimin.vn", name: "Võ Thị Phương",          chucVu: "CN Gấp - Xếp",                          phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0990123456" },
  { maNV: "NV015", email: "tim@mimin.vn",    name: "Tím",                    chucVu: "CN Phân loại - Bao",                     phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0956678901" },
  { maNV: "NV016", email: "phien@mimin.vn",  name: "Trần Thị Bé Phiên",      chucVu: "CN Gấp - Tem - Đóng bao",               phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0967789012" },

  // 4 Ủi
  { maNV: "NV011", email: "tuyen@mimin.vn",  name: "Đặng Võ Công Tuyền",     chucVu: "Tổ trưởng Ủi",                          phongBan: "hoan-thien",  luongCung: 11000000, sdt: "0912234567" },
  { maNV: "NV012", email: "huynh@mimin.vn",  name: "Phạm Văn Huynh",         chucVu: "CN Ủi áo/quần",                          phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0923345678" },
  { maNV: "NV013", email: "thuy@mimin.vn",   name: "Chu Quang Thủy",         chucVu: "CN Ủi hoàn thiện",                       phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0934456789" },
  { maNV: "NV014", email: "anhui@mimin.vn",  name: "Thế Anh",                chucVu: "CN Ủi theo lô",                          phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0945567890" },

  // 2 Khuy nút
  { maNV: "NV017", email: "ruong@mimin.vn",  name: "Nguyễn Văn Ruộng",       chucVu: "Tổ trưởng Khuy nút (750đ/cái)",         phongBan: "hoan-thien",  luongCung: 10500000, sdt: "0978890123" },
  { maNV: "NV018", email: "khoi@mimin.vn",   name: "Bùi Minh Khôi",          chucVu: "CN Khuy nút hỗ trợ",                     phongBan: "hoan-thien",  luongCung: 8500000,  sdt: "0989901234" },
];

const REAL_MA_NV = USERS.map((u) => u.maNV);

try {
  await client.connect();
  console.log("✅ Đã kết nối!");

  // 1. Kiểm tra bảng nhan_su có tồn tại không
  console.log("\n📋 Kiểm tra bảng nhan_su...");
  const checkTable = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'nhan_su'
    ) AS exists;
  `);
  if (!checkTable.rows[0].exists) {
    console.error("❌ Bảng 'nhan_su' chưa tồn tại!");
    console.error("👉 Chạy trước: node apply-schema.mjs");
    console.error("📖 Hướng dẫn: HUONG_DAN_APPLY_SCHEMA.md");
    process.exit(1);
  }
  console.log("✅ Bảng nhan_su tồn tại");

  // 2. Đếm nhân sự hiện tại
  const before = await client.query(`SELECT COUNT(*) AS c FROM nhan_su`);
  console.log(`📊 Hiện có: ${before.rows[0].c} nhân sự trong bảng`);

  // 3. Xoá sạch nhân sự cũ (test/demo/legacy) - chỉ giữ lại 19 user thật
  console.log("\n🧹 Xoá nhân sự cũ (không thuộc 19 mã NV nội bộ)...");
  const deleteResult = await client.query(
    `DELETE FROM nhan_su WHERE ma_nv <> ALL($1::text[])`,
    [REAL_MA_NV]
  );
  console.log(`   Đã xoá: ${deleteResult.rowCount} nhân sự cũ`);

  // 4. Reset sequence stt về 1 (để insert từ đầu)
  await client.query(`SELECT setval(pg_get_serial_sequence('nhan_su', 'stt'), 1, false)`);

  // 5. Insert / Update 19 user thật
  console.log("\n👥 Insert 19 nhân sự nội bộ...");
  let inserted = 0, updated = 0;
  for (let i = 0; i < USERS.length; i++) {
    const u = USERS[i];
    const stt = i + 1;
    const boPhan = BO_PHAN_LABELS[u.phongBan] || u.phongBan;

    const res = await client.query(
      `INSERT INTO nhan_su (stt, ma_nv, ho_ten, bo_phan, chuc_vu, sdt, email, luong_cung, rating, trang_thai, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 4, 'dang_lam', NOW())
       ON CONFLICT (ma_nv) DO UPDATE SET
         ho_ten = EXCLUDED.ho_ten,
         bo_phan = EXCLUDED.bo_phan,
         chuc_vu = EXCLUDED.chuc_vu,
         sdt = EXCLUDED.sdt,
         email = EXCLUDED.email,
         luong_cung = EXCLUDED.luong_cung,
         trang_thai = 'dang_lam'
       RETURNING (xmax = 0) AS inserted`,
      [stt, u.maNV, u.name, boPhan, u.chucVu, u.sdt, u.email, u.luongCung]
    );
    if (res.rows[0]?.inserted) inserted++;
    else updated++;
  }
  console.log(`   Insert mới: ${inserted}`);
  console.log(`   Cập nhật:   ${updated}`);

  // 6. Verify
  console.log("\n📊 Kiểm tra sau khi seed:");
  const after = await client.query(`SELECT COUNT(*) AS c FROM nhan_su`);
  console.log(`   Tổng: ${after.rows[0].c} nhân sự`);

  console.log("\n📋 Danh sách 19 nhân sự nội bộ:");
  const list = await client.query(`
    SELECT stt, ma_nv, ho_ten, bo_phan, chuc_vu, email, trang_thai, luong_cung
    FROM nhan_su
    ORDER BY stt
  `);
  list.rows.forEach((row) => {
    const luong = Number(row.luong_cung).toLocaleString("vi-VN");
    const trangThai = row.trang_thai === "dang_lam" ? "✅" : "❌";
    console.log(`   ${String(row.stt).padStart(2)}. [${row.ma_nv}] ${row.email.padEnd(20)} ${row.bo_phan.padEnd(18)} ${luong.padStart(11)}đ ${trangThai}`);
  });

  // 7. Nhóm theo bộ phận
  console.log("\n📊 Phân bố theo bộ phận:");
  const stats = await client.query(`
    SELECT bo_phan, COUNT(*) AS c
    FROM nhan_su
    GROUP BY bo_phan
    ORDER BY bo_phan
  `);
  stats.rows.forEach((row) => {
    console.log(`   ${row.bo_phan.padEnd(20)}: ${row.c} người`);
  });

  console.log("\n🎉 HOÀN THÀNH! 19 nhân sự nội bộ thật đã có trong Supabase.");
  console.log("👉 Verify tại: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/editor");
  console.log("👉 Hoặc vào app: /nhan-su (Quản lý nhân sự)");
} catch (err) {
  console.error("\n❌ LỖI:", err.message);
  if (err.message.includes("column") && err.message.includes("does not exist")) {
    console.error("\n💡 Schema chưa đúng. Kiểm tra các cột bảng nhan_su:");
    console.error("   SELECT column_name, data_type FROM information_schema.columns");
    console.error("   WHERE table_schema = 'public' AND table_name = 'nhan_su';");
  } else if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    console.error("\n💡 Không kết nối được. Kiểm tra DATABASE_URL trong .env.local");
  } else if (err.message.includes("password")) {
    console.error("\n💡 Sai password. Reset ở Supabase Dashboard → Settings → Database");
  }
  process.exit(1);
} finally {
  await client.end();
}
