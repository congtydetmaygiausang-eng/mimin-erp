// Apply schema bảng nha_cung_cap mới + Insert 20 đối tác gia công
// Drop bảng cũ nếu có, tạo bảng mới với cấu trúc đầy đủ thông tin
//
// Cách chạy (từ máy của anh Sang):
//   cd "D:\APP ERP POLOMIMIN\MIMIN-ERP-v89.6.8-code\mimin-erp\apps\web"
//   node apply-doi-tac-schema.mjs

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
  process.exit(1);
}

console.log("🔌 Đang kết nối Supabase...");
const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

// 20 đối tác gia công (import từ CSV sếp Sang ngày 2026-08-03)
const PARTNERS = [
  // 5 IN/THÊU/DẬP
  { stt: 1, ma: "GC-IN-001", ten: "Xưởng in/thêu/dập Bảo Ngân", nguoi_lh: "Bảo Ngân", sdt: "978417243", email: "", dia_chi: "b13/1a/15c ấp 2, xã tân vĩnh lộc, tphcm", so_tai_khoan: "114624915555", ngan_hang: "TMCP công thương việt nam", ma_so_thue: "319004432", cccd: "", cccd_ngay_cap: "", chuyen_mon: "In – Dập", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 2, ma: "GC-IN-002", ten: "Xưởng in/thêu/dập Hạnh", nguoi_lh: "Hạnh", sdt: "374592478", email: "honghanh38911@gmail.com", dia_chi: "ấp mỹ hòa 2, xuân thới sơn, hcm", so_tai_khoan: "0374592478", ngan_hang: "viettinbank", ma_so_thue: "", cccd: "079188007153", cccd_ngay_cap: "12/01/2022", chuyen_mon: "In – Dập", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 3, ma: "GC-IN-003", ten: "Xưởng in/thêu/dập Thanh Sơn", nguoi_lh: "Thanh Sơn", sdt: "937557261", email: "thanhson040696@gmail.com", dia_chi: "219/1/1 đường 12,bình tân", so_tai_khoan: "04061996", ngan_hang: "sacombank", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "In – Dập", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 4, ma: "GC-IN-004", ten: "Xưởng in/thêu/dập Tiến Đạt", nguoi_lh: "Tiến Đạt", sdt: "987700589", email: "Invaitiendat@gmail.com", dia_chi: "48 nguyễn văn vinh, phú thạnh, hcm", so_tai_khoan: "160320168", ngan_hang: "acb", ma_so_thue: "0316108031", cccd: "", cccd_ngay_cap: "", chuyen_mon: "In – Dập", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 6, ma: "GC-IN-006", ten: "Xưởng in/thêu/dập Vui", nguoi_lh: "Vui", sdt: "373779959", email: "tranvuivn@gmai.com", dia_chi: "đông hưng thuận 03, quận 12", so_tai_khoan: "", ngan_hang: "", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "In – Dập", trang_thai: "dang_hop_tac", ghi_chu: "" },

  // 4 MAY QUẦN
  { stt: 8, ma: "GC-QUAN-001", ten: "NGUYỄN THỊ NGỌC DUNG", nguoi_lh: "Nguyễn Thị Ngọc Dung", sdt: "383373415", email: "nguyenthingocdung3415@gmail.com", dia_chi: "Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, TP.HCM", so_tai_khoan: "00241983", ngan_hang: "OCB", ma_so_thue: "8898968687-001", cccd: "091183000355", cccd_ngay_cap: "27/03/2022", chuyen_mon: "May quần", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 9, ma: "GC-QUAN-002", ten: "NHÀ MAY MINH VY", nguoi_lh: "Tổng Thị Minh", sdt: "362044839", email: "Tongminh10081987@gmail.com", dia_chi: "27/6C Hưng Lân, Xã Bà Điểm, TP.HCM", so_tai_khoan: "4362044839", ngan_hang: "vietcombank", ma_so_thue: "", cccd: "38187008969", cccd_ngay_cap: "25/08/2022", chuyen_mon: "May quần", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 10, ma: "GC-QUAN-003", ten: "Xưởng may quần anh Thơ", nguoi_lh: "Tăng Văn Thơ", sdt: "766769562", email: "Tangtho101@gmail.com", dia_chi: "Ấp 12, Xã Vĩnh Lộc, TP.Hồ Chí Minh", so_tai_khoan: "1490190764", ngan_hang: "bidv", ma_so_thue: "", cccd: "83084003261", cccd_ngay_cap: "22/02/2023", chuyen_mon: "May quần", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 11, ma: "GC-QUAN-004", ten: "LÊ THỊ HOÀI HƯƠNG", nguoi_lh: "Lê Thị Hoài Hương", sdt: "941104007", email: "0941104007h@gmail.com", dia_chi: "Thôn Xuân Thuận, Xã Phú Xuân, Tỉnh Đăk Lăk", so_tai_khoan: "0231000604464", ngan_hang: "vietcombank", ma_so_thue: "66190017850", cccd: "066190017850", cccd_ngay_cap: "12/08/2021", chuyen_mon: "May quần", trang_thai: "dang_hop_tac", ghi_chu: "" },

  // 5 MAY ÁO TRÒN
  { stt: 12, ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", nguoi_lh: "Nguyễn Ngọc Trai", sdt: "908908167", email: "nguyenngoctrai139@gmail.com", dia_chi: "Ấp 19, Xã Vĩnh Lộc, Huyện Bình Chánh, TP.HCM", so_tai_khoan: "3180088065", ngan_hang: "bidv", ma_so_thue: "", cccd: "0520082013001", cccd_ngay_cap: "27/01/2023", chuyen_mon: "May áo tròn", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 13, ma: "GC-TRON-002", ten: "Xưởng may tròn chị Hằng", nguoi_lh: "phan thị thúy hằng", sdt: "909802852", email: "", dia_chi: "41/1C Hưng Lân, Bà Điểm, Hóc Môn", so_tai_khoan: "060259005607", ngan_hang: "sacombank", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "May áo tròn", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 14, ma: "GC-TRON-003", ten: "Xưởng may tròn anh Chiến", nguoi_lh: "Chiến", sdt: "986747344", email: "", dia_chi: "1/8/13 Tân Thới Nhất 22, hẻm 123, Q.12", so_tai_khoan: "19035056718019", ngan_hang: "techcombank", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "May áo tròn", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 15, ma: "GC-TRON-004", ten: "Xưởng may tròn anh Thuận", nguoi_lh: "Thuận", sdt: "903071501", email: "ducthuan0715@gmail.com", dia_chi: "28/10/15 KP40, Tân Thới Nhất 11, Q.12", so_tai_khoan: "43075977", ngan_hang: "ACB", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "May áo tròn", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 16, ma: "GC-TRON-005", ten: "Xưởng may quang", nguoi_lh: "Quang", sdt: "966670624", email: "", dia_chi: "133/42 liên khu 4, khu phố 5, phường binh hưng hòa B, quận bình tân", so_tai_khoan: "6440205573303", ngan_hang: "agribank", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "May áo tròn", trang_thai: "dang_hop_tac", ghi_chu: "" },

  // 6 MAY ÁO TRỤ
  { stt: 26, ma: "GC-TRU-001", ten: "NGUYỄN THỊ NGỌC LIỄU", nguoi_lh: "Nguyễn Thị Ngọc Liễu", sdt: "933305465", email: "", dia_chi: "594/59 Âu Cơ, KP 4, P. Bảy Hiền, TP.HCM", so_tai_khoan: "", ngan_hang: "", ma_so_thue: "83182011101", cccd: "083182011101", cccd_ngay_cap: "22/12/2021", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 27, ma: "GC-TRU-002", ten: "Xưởng may trụ anh Tý Sơn", nguoi_lh: "Nguyễn Hữu Kim Ly Sơn", sdt: "794953483", email: "nguyenhuukimlyson@gmail.com", dia_chi: "Nhà không số ấp 29, Xã Tân Vĩnh Lộc, TP.HCM", so_tai_khoan: "060287316545", ngan_hang: "sacombank", ma_so_thue: "", cccd: "066188019712", cccd_ngay_cap: "20/01/2022", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 28, ma: "GC-TRU-003", ten: "Xưởng may trụ anh Duẩn", nguoi_lh: "Dương Xuân Duẩn", sdt: "966266775", email: "Xuanduanduong87@gmail.com", dia_chi: "Đường N11, tổ 1 KP 2, P. Thới Hòa, TP.HCM", so_tai_khoan: "07119869", ngan_hang: "vietcombank", ma_so_thue: "", cccd: "034086003445", cccd_ngay_cap: "26/08/2022", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 30, ma: "GC-TRU-005", ten: "THÔNG THƯƠNG", nguoi_lh: "Nguyễn Văn Thông", sdt: "933305465", email: "bt5815989@gmail.com", dia_chi: "28/8 Ấp 46, Xã Hóc Môn, TP.HCM", so_tai_khoan: "0355589066", ngan_hang: "mb", ma_so_thue: "86090005870", cccd: "086090005870", cccd_ngay_cap: "22/12/2021", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 31, ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", nguoi_lh: "Huỳnh Thị Cúc Em", sdt: "907869422", email: "huynhthicucem1210@gmail.com", dia_chi: "1/5B KP49 Nguyễn Văn Quá, P.Đông Hưng Thuận", so_tai_khoan: "9907869422", ngan_hang: "techcombank", ma_so_thue: "", cccd: "", cccd_ngay_cap: "", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
  { stt: 32, ma: "GC-TRU-007", ten: "Xưởng may trụ anh Sản", nguoi_lh: "Nguyễn Gia Sản", sdt: "906042853", email: "Giasan20015@gmail.com", dia_chi: "Tổ 16 đường Lê Văn Chi, Linh Xuân", so_tai_khoan: "8888906042853", ngan_hang: "agribank", ma_so_thue: "", cccd: "030080000661", cccd_ngay_cap: "19/09/2024", chuyen_mon: "May áo trụ", trang_thai: "dang_hop_tac", ghi_chu: "" },
];

try {
  await client.connect();
  console.log("✅ Đã kết nối Supabase!\n");

  // 1. DROP bảng cũ nếu có
  console.log("🗑️  Xoá bảng cũ nha_cung_cap (nếu có)...");
  await client.query(`DROP TABLE IF EXISTS nha_cung_cap CASCADE;`);
  console.log("   ✅ Đã xoá bảng cũ\n");

  // 2. Tạo bảng mới với cấu trúc đầy đủ
  console.log("📄 Tạo bảng nha_cung_cap mới...");
  await client.query(`
    CREATE TABLE nha_cung_cap (
      id              TEXT PRIMARY KEY,
      stt             INTEGER NOT NULL,
      ma_ncc          TEXT UNIQUE NOT NULL,
      ten_ncc         TEXT NOT NULL,
      loai            TEXT NOT NULL,                  -- GC-IN | GC-QUAN | GC-TRON | GC-TRU
      chuyen_mon      TEXT NOT NULL,                  -- In – Dập | May quần | May áo tròn | May áo trụ
      nguoi_lh        TEXT,                            -- Người liên hệ
      sdt             TEXT,                            -- Số điện thoại
      email           TEXT,                            -- Email
      dia_chi         TEXT,                            -- Địa chỉ xưởng
      so_tai_khoan    TEXT,                            -- Số tài khoản NH
      ngan_hang       TEXT,                            -- Tên ngân hàng
      ma_so_thue      TEXT,                            -- Mã số thuế
      cccd            TEXT,                            -- Số CCCD
      cccd_ngay_cap   TEXT,                            -- Ngày cấp CCCD (dd/mm/yyyy)
      trang_thai      TEXT DEFAULT 'dang_hop_tac',     -- dang_hop_tac | ngung_hop_tac
      ghi_chu         TEXT,                            -- Ghi chú chung
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );

    -- Index cho tìm kiếm nhanh
    CREATE INDEX idx_ncc_ma ON nha_cung_cap(ma_ncc);
    CREATE INDEX idx_ncc_loai ON nha_cung_cap(loai);
    CREATE INDEX idx_ncc_trang_thai ON nha_cung_cap(trang_thai);
    CREATE INDEX idx_ncc_chuyen_mon ON nha_cung_cap(chuyen_mon);

    -- Comment
    COMMENT ON TABLE nha_cung_cap IS 'Đối tác gia công (in/thêu/dập, may quần, may áo tròn, may áo trụ) - Imported từ CSV sếp Sang 2026-08-03';
  `);
  console.log("   ✅ Đã tạo bảng + indexes + comments\n");

  // 3. Insert 20 đối tác
  console.log(`📥 Insert ${PARTNERS.length} đối tác gia công...`);
  let inserted = 0;
  for (const p of PARTNERS) {
    const id = `ncc_${p.ma.toLowerCase().replace(/-/g, '_')}`;
    const loai = p.ma.startsWith("GC-IN-") ? "in_thêu_dập"
               : p.ma.startsWith("GC-QUAN-") ? "may_quần"
               : p.ma.startsWith("GC-TRON-") ? "may_áo_tròn"
               : p.ma.startsWith("GC-TRU-") ? "may_áo_trụ"
               : "khác";

    await client.query(`
      INSERT INTO nha_cung_cap (
        id, stt, ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt, email, dia_chi,
        so_tai_khoan, ngan_hang, ma_so_thue, cccd, cccd_ngay_cap, trang_thai, ghi_chu
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (ma_ncc) DO UPDATE SET
        ten_ncc = EXCLUDED.ten_ncc,
        chuyen_mon = EXCLUDED.chuyen_mon,
        nguoi_lh = EXCLUDED.nguoi_lh,
        sdt = EXCLUDED.sdt,
        email = EXCLUDED.email,
        dia_chi = EXCLUDED.dia_chi,
        so_tai_khoan = EXCLUDED.so_tai_khoan,
        ngan_hang = EXCLUDED.ngan_hang,
        ma_so_thue = EXCLUDED.ma_so_thue,
        cccd = EXCLUDED.cccd,
        cccd_ngay_cap = EXCLUDED.cccd_ngay_cap,
        trang_thai = EXCLUDED.trang_thai,
        updated_at = NOW()
    `, [
      id, p.stt, p.ma, p.ten, loai, p.chuyen_mon, p.nguoi_lh, p.sdt, p.email, p.dia_chi,
      p.so_tai_khoan, p.ngan_hang, p.ma_so_thue, p.cccd, p.cccd_ngay_cap, p.trang_thai, p.ghi_chu,
    ]);
    inserted++;
  }
  console.log(`   ✅ Insert/Update: ${inserted} đối tác\n`);

  // 4. Verify
  console.log("📊 Verify:");
  const count = await client.query(`SELECT COUNT(*) AS c FROM nha_cung_cap`);
  console.log(`   Tổng đối tác: ${count.rows[0].c}`);

  const stats = await client.query(`
    SELECT loai, chuyen_mon, COUNT(*) AS c
    FROM nha_cung_cap
    GROUP BY loai, chuyen_mon
    ORDER BY loai
  `);
  console.log("\n   Phân bổ theo loại:");
  stats.rows.forEach((r) => {
    console.log(`   - ${r.loai.padEnd(15)} (${r.chuyen_mon.padEnd(12)}): ${r.c} đối tác`);
  });

  console.log("\n🎉 HOÀN THÀNH!");
  console.log("👉 Verify tại: https://supabase.com/dashboard/project/nftlwdcsmlpeiazhuoho/database/tables");
  console.log("👉 Hoặc vào app: /doi-tac-gia-cong");
} catch (err) {
  console.error("\n❌ LỖI:", err.message);
  if (err.message.includes("ENOTFOUND") || err.message.includes("ECONNREFUSED")) {
    console.error("\n💡 Không kết nối được. Kiểm tra DATABASE_URL trong .env.local");
  } else if (err.message.includes("password")) {
    console.error("\n💡 Sai password. Reset ở Supabase Dashboard → Settings → Database");
  }
  process.exit(1);
} finally {
  await client.end();
}
