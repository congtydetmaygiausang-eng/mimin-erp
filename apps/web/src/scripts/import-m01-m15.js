const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Read env
const envContent = fs.readFileSync(path.resolve(__dirname, '../../../../.env.production'), 'utf8');
const matchKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const serviceKey = matchKey ? matchKey[1].replace(/['"]/g, '').trim() : '';

const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';

console.log('Connecting to Supabase:', url);
const sb = createClient(url, serviceKey);

// 2. Load JSON
const ordersPath = path.resolve(__dirname, '../lib/data/cutting-orders-m01-m15.json');
const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8'));

console.log(`Loaded ${orders.length} orders from JSON`);

async function main() {
  // Check existing lenh_cat
  const { data: existingLC, error: errLC } = await sb.from('lenh_cat').select('id');
  if (errLC) {
    console.error('Error fetching existing lenh_cat:', errLC);
  } else {
    console.log(`Existing lenh_cat count: ${existingLC.length}`);
  }

  // 1. Upsert lenh_cat
  for (const o of orders) {
    // Map camelCase to snake_case for Supabase table lenh_cat
    const rowLC = {
      id: o.id,
      loai_lenh: o.loaiLenh,
      khach_hang: o.khachHang,
      loai_sp: o.loaiSP,
      ma_sp: o.maSP,
      ten_sp: o.tenSP,
      tong_sl: o.tongSL,
      tong_sl_thuc_te: o.tongSLThucTe,
      han_hoan_thanh: o.hanHoanThanh,
      ti_le_size: o.tiLeSize,
      ds_mau: o.dsMau,
      ds_phu_lieu: o.dsPhuLieu || [],
      phan_cong: o.phanCong || [],
      chi_phi_co_dinh: o.chiPhiCoDinh || {},
      phu_trach_cat: o.phuTrachCat,
      phu_trach_sx: o.phuTrachSX,
      ghi_chu: o.ghiChuKyThuat ? `${o.ghiChu} | ${o.ghiChuKyThuat}` : o.ghiChu,
      trang_thai: o.trangThai,
      phien_ban_dinh_muc: o.phienBanDinhMuc,
      ngay_tao: o.ngayTao,
    };

    const { error: upsertErr } = await sb.from('lenh_cat').upsert(rowLC, { onConflict: 'id' });
    if (upsertErr) {
      console.error(`Error upserting lenh_cat ${o.id}:`, upsertErr.message);
    } else {
      console.log(`✓ Upserted lenh_cat: ${o.id} (${o.maSP} - ${o.tenSP})`);
    }
  }

  // 2. Upsert khsx
  for (const o of orders) {
    const rowKHSX = {
      id: `KHSX-2026-${o.maSP}`,
      maKHSX: `KHSX-2026-${o.maSP}`,
      maSP: o.maSP,
      tenSP: o.tenSP,
      loaiSP: o.loaiSP,
      tiLeSize: o.tiLeSize,
      dsMau: o.dsMau,
      tuan: 'Tuần 42',
      tuNgay: o.ngayTao,
      denNgay: o.hanHoanThanh,
      sanPham: o.tenSP,
      loai: 'Bộ',
      soLuong: o.tongSL,
      daHoanThanh: 0,
      xuongPhuTrach: 'Tổ cắt',
      trangThai: 'Đang SX',
      ghiChu: `KHSX theo phiếu cắt mới ${o.maSP} - POLOMIMIN`,
      ngayTao: o.ngayTao,
      lenhCatId: o.id,
    };

    const { error: errKHSX } = await sb.from('khsx').upsert(rowKHSX, { onConflict: 'id' });
    if (errKHSX) {
      console.error(`Error upserting khsx ${rowKHSX.id}:`, errKHSX.message);
    } else {
      console.log(`✓ Upserted khsx: ${rowKHSX.maKHSX} (${o.maSP} - ${o.tenSP})`);
    }
  }

  // 3. Upsert san_pham
  const { data: existingSP } = await sb.from('san_pham').select('id, ma_sp');
  const spMap = new Map((existingSP || []).map(s => [s.ma_sp, s.id]));

  for (const o of orders) {
    const existingId = spMap.get(o.maSP);
    const rowSP = {
      id: existingId || require('crypto').randomUUID(),
      ma_sp: o.maSP,
      ma_dm: `DM-${o.loaiSP}`,
      ten_sp: o.tenSP,
      loai_sp: o.loaiSP,
      gia_ban_du_kien: 185000,
      gia_von_du_kien: 85000,
      ti_le_size: o.tiLeSize,
      bang_size: {
        sizes: ["L", "XL", "XXL", "3XL"],
        ratios: [1, 1, 1, 1]
      },
      ds_mau: o.dsMau.map(m => ({
        ten: m.ten,
        maSKU: m.maSKU,
        img: m.img || "",
        dinhMuc: m.dinhMuc || 0.26,
        tonKho: m.slDuKien || 80
      })),
      trang_thai: "con-hang",
      ncc: "MANPJ / POLOMIMIN",
      chat_lieu: "Cotton CVC",
      hinh_anh: `/phieu-cat/Phieu_Giao_Nhan_${o.maSP}.png`,
    };

    const { error: errSP } = await sb.from('san_pham').upsert(rowSP, { onConflict: 'id' });
    if (errSP) {
      console.log(`Note: san_pham upsert ${o.maSP}:`, errSP.message);
    } else {
      console.log(`✓ Upserted san_pham: ${o.maSP} - ${o.tenSP}`);
    }
  }

  console.log('ALL 15 ORDERS UPSERTED SUCCESSFULLY!');
}

main().catch(console.error);
