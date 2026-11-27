const fs = require('fs');
const path = require('path');
const { createClient } = require(path.resolve(__dirname, '../../node_modules/@supabase/supabase-js'));

// 1. Supabase credentials
const envPath = path.resolve(__dirname, '../../../../.env.production');
let serviceKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const matchKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
  if (matchKey) serviceKey = matchKey[1].replace(/['"]/g, '').trim();
}
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';

console.log('Connecting to Supabase:', url);
const sb = createClient(url, serviceKey);

// 2. Specific workshop assignments for M01 -> M15 from Excel
const ASSIGNMENTS = {
  "M01": {
    inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 },
    mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M02": {
    inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 },
    mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M03": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M04": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRON-003", ten: "Xưởng may tròn anh Chiến", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 },
  },
  "M05": {
    inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 },
    mayAo: { ma: "GC-TRON-003", ten: "Xưởng may tròn anh Chiến", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 },
  },
  "M06": {
    inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 },
    mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M07": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M08": {
    inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 },
    mayAo: { ma: "GC-TRU-002", ten: "Xưởng may trụ chị Tý Sơn", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 },
  },
  "M09": {
    inTheu: { ma: "GC-IN-003", ten: "Xưởng in/dập Thanh Sơn", gia: 1500 },
    mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M10": {
    inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 },
    mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M11": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-003", ten: "Xưởng may quần anh Thơ", gia: 9500 },
  },
  "M12": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 },
  },
  "M13": {
    inTheu: { ma: "GC-IN-003", ten: "Xưởng in/dập Thanh Sơn", gia: 1500 },
    mayAo: { ma: "GC-TRU-001", ten: "Xưởng may trụ chị Liễu", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-003", ten: "Xưởng may quần anh Thơ", gia: 9500 },
  },
  "M14": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 15000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
  "M15": {
    inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 },
    mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  },
};

function buildPhanCong(order) {
  const ma = order.maSP;
  const isBoTru = order.loaiSP === "BoTru";
  const tongSL = order.tongSL || 0;
  const asg = ASSIGNMENTS[ma] || {
    inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 },
    mayAo: { ma: isBoTru ? "GC-TRU-005" : "GC-TRON-001", ten: isBoTru ? "Xưởng may trụ anh Thông" : "Xưởng may tròn anh Trai", gia: isBoTru ? 15000 : 13000 },
    mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 },
  };

  const stages = [
    {
      id: "cat",
      loaiNguoi: "noi_bo",
      tenCongDoan: "Cắt bộ",
      nguoiMa: "XUONG_NHA",
      nguoiTen: "Xưởng nhà",
      donGia: 2300,
      soLuong: tongSL,
      thanhTien: 2300 * tongSL,
      daThanhToan: 0,
      conLai: 2300 * tongSL,
      trangThaiTT: "chua_tra",
      catChiTiet: {
        nhanLieu: "cho_lam",
        traiVai: "cho_lam",
        catHang: "cho_lam",
        epNhan: "cho_lam",
        epKeo: isBoTru ? "cho_lam" : "khong_can"
      }
    },
    {
      id: "in_theu",
      loaiNguoi: "xuong_ngoai",
      tenCongDoan: "In/Thêu",
      nguoiMa: asg.inTheu.ma,
      nguoiTen: asg.inTheu.ten,
      donGia: asg.inTheu.gia,
      soLuong: tongSL,
      thanhTien: asg.inTheu.gia * tongSL,
      daThanhToan: 0,
      conLai: asg.inTheu.gia * tongSL,
      trangThaiTT: "chua_tra"
    },
    {
      id: "may_ao",
      loaiNguoi: "xuong_ngoai",
      tenCongDoan: "May áo",
      nguoiMa: asg.mayAo.ma,
      nguoiTen: asg.mayAo.ten,
      donGia: asg.mayAo.gia,
      soLuong: tongSL,
      thanhTien: asg.mayAo.gia * tongSL,
      daThanhToan: 0,
      conLai: asg.mayAo.gia * tongSL,
      trangThaiTT: "chua_tra"
    },
    {
      id: "may_quan",
      loaiNguoi: "xuong_ngoai",
      tenCongDoan: "May quần",
      nguoiMa: asg.mayQuan.ma,
      nguoiTen: asg.mayQuan.ten,
      donGia: asg.mayQuan.gia,
      soLuong: tongSL,
      thanhTien: asg.mayQuan.gia * tongSL,
      daThanhToan: 0,
      conLai: asg.mayQuan.gia * tongSL,
      trangThaiTT: "chua_tra"
    },
    {
      id: "qc",
      loaiNguoi: "noi_bo",
      tenCongDoan: "QC (Kiểm hàng)",
      nguoiMa: "TO_QC",
      nguoiTen: "Tổ QC",
      donGia: 500,
      soLuong: tongSL,
      thanhTien: 500 * tongSL,
      daThanhToan: 0,
      conLai: 500 * tongSL,
      trangThaiTT: "chua_tra"
    }
  ];

  if (isBoTru) {
    stages.push({
      id: "khuy_nut",
      loaiNguoi: "noi_bo",
      tenCongDoan: "Khuy nút",
      nguoiMa: "TO_KHUY_NUT",
      nguoiTen: "Tổ Khuy Nút",
      donGia: 750,
      soLuong: tongSL,
      thanhTien: 750 * tongSL,
      daThanhToan: 0,
      conLai: 750 * tongSL,
      trangThaiTT: "chua_tra"
    });
  }

  stages.push(
    {
      id: "ui",
      loaiNguoi: "noi_bo",
      tenCongDoan: "Ủi",
      nguoiMa: "TO_UI",
      nguoiTen: "Tổ Ủi",
      donGia: 1500,
      soLuong: tongSL,
      thanhTien: 1500 * tongSL,
      daThanhToan: 0,
      conLai: 1500 * tongSL,
      trangThaiTT: "chua_tra"
    },
    {
      id: "dong_goi",
      loaiNguoi: "noi_bo",
      tenCongDoan: "Đóng gói",
      nguoiMa: "TO_DONG_GOI",
      nguoiTen: "Tổ Đóng Gói",
      donGia: 1200,
      soLuong: tongSL,
      thanhTien: 1200 * tongSL,
      daThanhToan: 0,
      conLai: 1200 * tongSL,
      trangThaiTT: "chua_tra"
    },
    {
      id: "nhap_kho",
      loaiNguoi: "noi_bo",
      tenCongDoan: "Nhập kho",
      nguoiMa: "KHO_THANH_PHAM",
      nguoiTen: "Kho thành phẩm",
      donGia: 0,
      soLuong: tongSL,
      thanhTien: 0,
      daThanhToan: 0,
      conLai: 0,
      trangThaiTT: "chua_tra"
    }
  );

  return stages;
}

async function main() {
  const jsonPath = path.resolve(__dirname, '../lib/data/cutting-orders-m01-m15.json');
  const orders = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`Processing ${orders.length} orders...`);

  for (const o of orders) {
    const isBoTru = o.loaiSP === "BoTru";
    o.mauCongDoan = isBoTru ? "MCD-BO-TRU" : "MCD-BO-TRON";
    o.phanCong = buildPhanCong(o);
  }

  // 1. Save updated JSON
  fs.writeFileSync(jsonPath, JSON.stringify(orders, null, 2), 'utf8');
  console.log('✓ Successfully updated cutting-orders-m01-m15.json');

  // 2. Update Supabase lenh_cat
  for (const o of orders) {
    const { error: errLC } = await sb
      .from('lenh_cat')
      .update({
        mau_cong_doan: o.mauCongDoan,
        phan_cong: o.phanCong,
      })
      .eq('id', o.id);

    if (errLC) {
      console.error(`Error updating lenh_cat ${o.id}:`, errLC.message);
    } else {
      console.log(`✓ Updated Supabase lenh_cat ${o.id} (${o.maSP}) with ${o.phanCong.length} stages`);
    }
  }

  // 3. Update Supabase khsx xuongPhuTrach
  for (const o of orders) {
    const asg = ASSIGNMENTS[o.maSP];
    const xuongDesc = asg ? `${asg.mayAo.ten} / ${asg.mayQuan.ten}` : 'Tổ cắt';
    const khsxId = `KHSX-2026-${o.maSP}`;

    const { error: errKHSX } = await sb
      .from('khsx')
      .update({
        xuongPhuTrach: xuongDesc,
      })
      .eq('id', khsxId);

    if (errKHSX) {
      console.error(`Error updating khsx ${khsxId}:`, errKHSX.message);
    } else {
      console.log(`✓ Updated Supabase khsx ${khsxId} -> ${xuongDesc}`);
    }
  }

  console.log('\n--- ALL 15 ORDERS UPDATED WITH EXACT GIA CÔNG SẢN XUẤT! ---');
}

main().catch(console.error);
