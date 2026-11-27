const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Kết nối Supabase
const envContent = fs.readFileSync(path.resolve(__dirname, '../../../../.env.production'), 'utf8');
const matchKey = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const serviceKey = matchKey ? matchKey[1].replace(/['"]/g, '').trim() : '';
const url = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const sb = createClient(url, serviceKey);

// 2. Đọc file cutting-orders-m01-m15.json
const jsonPath = path.resolve(__dirname, '../lib/data/cutting-orders-m01-m15.json');
const orders = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`Bắt đầu xử lý hoàn thành các công đoạn cho ${orders.length} lệnh cắt...`);

for (const o of orders) {
  // A. Đồng bộ dsMau và tyLeSizeChiTiet cho tất cả các khâu
  o.dsMau = (o.dsMau || []).map((m) => {
    const sizeArr = m.phanBoSize || [];
    const sumSize = sizeArr.reduce((s, b) => s + (b.sl || 0), 0);
    const slThucTe = sumSize > 0 ? sumSize : (m.slThucTe || m.slDuKien || 0);

    return {
      ...m,
      slThucTe,
      tyLeSizeChiTiet: {
        cat: sizeArr,
        in_theu: sizeArr,
        inTheu: sizeArr,
        may_ao: sizeArr,
        mayAo: sizeArr,
        may_quan: sizeArr,
        mayQuan: sizeArr,
        qc: sizeArr,
        khuy_nut: sizeArr,
        khuyNut: sizeArr,
        ui: sizeArr,
        dong_goi: sizeArr,
        dongGoi: sizeArr,
      },
    };
  });

  const tongSLThucTe = o.dsMau.reduce((s, m) => s + (m.slThucTe || 0), 0) || o.tongSL;
  o.tongSLThucTe = tongSLThucTe;
  o.tongSLThucTeAo = tongSLThucTe;
  o.tongSLThucTeQuan = tongSLThucTe;

  // B. Hoàn thành tất cả các công đoạn đến khâu Đóng gói, dừng lại trước khâu Nhập kho
  const chiTietMauChuan = o.dsMau.map((m) => ({
    mau: m.ten,
    soLuongNhan: m.slThucTe,
    soLuongDat: m.slThucTe,
    soLuongLoi: 0,
    sizes: m.phanBoSize || [],
  }));

  o.phanCong = (o.phanCong || []).map((pc) => {
    const isNhapKho = pc.id === 'nhap_kho' || pc.id === 'nhapKho' || (pc.tenCongDoan || '').toLowerCase().includes('nhập kho');

    if (isNhapKho) {
      return {
        ...pc,
        trangThaiCD: 'cho_giao',
        soLuong: tongSLThucTe,
        soLuongHoanThanh: 0,
        soLuongLoi: 0,
        thanhTien: 0,
        conLai: 0,
      };
    }

    // Các công đoạn: Cắt, In/Thêu, May áo, May quần, QC, Khuy nút, Ủi, Đóng gói => HOÀN THÀNH 100%
    const thanhTien = (pc.donGia || 0) * tongSLThucTe;
    const conLai = thanhTien - (pc.daThanhToan || 0);

    const updatedPC = {
      ...pc,
      trangThaiCD: 'hoan_thanh',
      soLuong: tongSLThucTe,
      soLuongHoanThanh: tongSLThucTe,
      soLuongLoi: 0,
      thanhTien,
      conLai,
      chiTietMau: chiTietMauChuan,
    };

    if (pc.id === 'cat' || (pc.tenCongDoan || '').toLowerCase().includes('cắt')) {
      updatedPC.catChiTiet = {
        nhanLieu: 'hoan_thanh',
        traiVai: 'hoan_thanh',
        catHang: 'hoan_thanh',
        epNhan: 'hoan_thanh',
        epKeo: 'khong_can',
      };
    }

    if (pc.id === 'qc' || (pc.tenCongDoan || '').toLowerCase().includes('qc')) {
      updatedPC.soLuongDatCuoi = tongSLThucTe;
      updatedPC.soLuongPhePham = 0;
      updatedPC.soLuongSuaXong = 0;
    }

    return updatedPC;
  });

  // C. Tính bảng COGS (giá vốn) để khi bấm Nhập Kho thành phẩm không bị thiếu giá
  const giaCong1SP = o.phanCong.reduce((s, p) => s + (p.donGia || 0), 0);
  o.bangCOGS = {
    tongTienVai: 0,
    tongTienPhuLieu: 0,
    giaCong1SP,
    tongChiPhiCoDinh: 0,
    giaVonBinhQuan: giaCong1SP,
    giaVon1SP: giaCong1SP,
    tongGiaVon: giaCong1SP * tongSLThucTe,
  };

  // Trạng thái Lệnh cắt: DangCat (hoặc ChuyenTiep) để sẵn sàng ở bước Đóng gói -> Chờ Nhập kho
  o.trangThai = 'DangCat';
}

// 3. Ghi lại vào file JSON
fs.writeFileSync(jsonPath, JSON.stringify(orders, null, 2), 'utf8');
console.log(`✓ Đã cập nhật file JSON: ${jsonPath}`);

// 4. Đồng bộ lên Supabase (bảng lenh_cat và bảng khsx)
async function syncToSupabase() {
  console.log('Đang đồng bộ dữ liệu hoàn thành lên Supabase...');

  for (const o of orders) {
    // A. Bảng lenh_cat
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

    const { error: errLC } = await sb.from('lenh_cat').upsert(rowLC, { onConflict: 'id' });
    if (errLC) {
      console.error(`Lỗi upsert lenh_cat ${o.id}:`, errLC.message);
    } else {
      console.log(`✓ [lenh_cat] ${o.id} (${o.maSP}): Hoàn thành tất cả các công đoạn, sẵn sàng nhập kho.`);
    }

    // B. Bảng khsx
    const khsxId = `KHSX-2026-${o.maSP}`;
    const { error: errKHSX } = await sb
      .from('khsx')
      .update({
        daHoanThanh: o.tongSLThucTe,
        trangThai: 'Đang SX',
      })
      .eq('id', khsxId);

    if (errKHSX) {
      console.warn(`Lưu ý update khsx ${khsxId}:`, errKHSX.message);
    }
  }

  console.log('🎉 Hoàn tất 100% cập nhật 15 mã từ M01 đến M15!');
}

syncToSupabase();
