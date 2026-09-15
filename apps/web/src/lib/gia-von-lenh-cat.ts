import type { GiaoDichKho } from "@/lib/data/kho-store";
import type { LenhCat } from "@/lib/data/lenh-cat-store";

export interface KetQuaGiaVonLenhCat {
  giaVon1SP: number;
  nguon: "bang-cogs" | "tinh-lai" | "thieu-du-lieu";
  maVatTuThieuGia: string[];
}

function donGiaNhapBinhQuan(giaoDich: GiaoDichKho[], maVT: string): number | undefined {
  const phieuNhap = giaoDich.filter((item) => item.loai === "NHAP" && item.maVT === maVT && item.soLuong > 0 && item.donGia > 0);
  if (phieuNhap.length === 0) return undefined;
  const tongSoLuong = phieuNhap.reduce((sum, item) => sum + item.soLuong, 0);
  const tongGiaTri = phieuNhap.reduce((sum, item) => sum + item.soLuong * item.donGia, 0);
  return tongSoLuong > 0 ? tongGiaTri / tongSoLuong : undefined;
}

/**
 * Một công thức dùng chung từ Lệnh cắt đến Nhập kho thành phẩm.
 * Lệnh mới dùng snapshot bangCOGS; lệnh cũ được phục hồi từ lịch sử nhập kho
 * nguyên liệu. Không trả giá ước đoán khi thiếu đơn giá vật tư.
 */
export function tinhGiaVonLenhCat(lenh: LenhCat, giaoDichKho: GiaoDichKho[]): KetQuaGiaVonLenhCat {
  const giaVonDaKhoa = Number(lenh.bangCOGS?.giaVonBinhQuan || lenh.bangCOGS?.giaVon1SP || 0);
  if (giaVonDaKhoa > 0) {
    return { giaVon1SP: Math.round(giaVonDaKhoa), nguon: "bang-cogs", maVatTuThieuGia: [] };
  }

  const maVatTuThieuGia = new Set<string>();
  let tongTienVai = 0;
  for (const mau of lenh.dsMau || []) {
    const soLuong = mau.slDuKien || mau.slThucTe || 0;
    if (mau.maVai && mau.dinhMuc > 0 && soLuong > 0) {
      const donGia = donGiaNhapBinhQuan(giaoDichKho, mau.maVai);
      if (donGia == null) maVatTuThieuGia.add(mau.maVai);
      else tongTienVai += soLuong * mau.dinhMuc * donGia;
    }
    if (mau.maVaiQuan && (mau.dinhMucQuan || 0) > 0 && soLuong > 0) {
      const donGia = donGiaNhapBinhQuan(giaoDichKho, mau.maVaiQuan);
      if (donGia == null) maVatTuThieuGia.add(mau.maVaiQuan);
      else tongTienVai += soLuong * (mau.dinhMucQuan || 0) * donGia;
    }
  }

  if (maVatTuThieuGia.size > 0) {
    return { giaVon1SP: 0, nguon: "thieu-du-lieu", maVatTuThieuGia: [...maVatTuThieuGia] };
  }

  const soLuongTinhGia = Math.max(1, (lenh.dsMau || []).reduce((sum, mau) => sum + (mau.slDuKien || mau.slThucTe || 0), 0) || lenh.tongSLThucTe || lenh.tongSL);
  const tongTienPhuLieu = (lenh.dsPhuLieu || []).reduce((sum, item) => sum + (item.soLuong || 0) * (item.donGia || 0), 0);
  const giaCong1SP = (lenh.phanCong || []).reduce((sum, item) => sum + (item.donGia || 0), 0);
  const chiPhiCoDinh1SP = Object.values(lenh.chiPhiCoDinh || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const giaVon1SP = (tongTienVai + tongTienPhuLieu) / soLuongTinhGia + giaCong1SP + chiPhiCoDinh1SP;

  return {
    giaVon1SP: Math.round(giaVon1SP),
    nguon: giaVon1SP > 0 ? "tinh-lai" : "thieu-du-lieu",
    maVatTuThieuGia: [],
  };
}
