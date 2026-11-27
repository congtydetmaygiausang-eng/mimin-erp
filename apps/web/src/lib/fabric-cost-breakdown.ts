// Module Quản lý Cấu thành giá 3 khâu (Sợi - Dệt - Nhuộm) cho Kho Vải Thành Phẩm MIMIN ERP
// Sử dụng chính xác dữ liệu Nhà cung cấp và Đơn giá thực tế đang có trên hệ thống của MIMIN ERP

export interface ChiTietGia3Khau {
  maVT: string;
  tenVT?: string;
  mauSac?: string;
  // 1. Khâu Sợi
  nccSoi: string;
  loaiSoi: string;
  giaSoi: number;        // đ/kg sợi
  dinhMucSoi: number;    // kg sợi / kg vải (mặc định 1.0)
  haoHutSoi?: number;    // % hao hụt sợi
  vatSoi?: number;       // % thuế VAT sợi
  chiPhiSoi: number;     // chi phí sợi / kg vải quy đổi

  // 2. Khâu Dệt vải mộc
  nccDet: string;
  kieuDet: string;
  giaDet: number;        // đ/kg vải mộc
  haoHutDet?: number;    // % hao hụt dệt
  vatDet?: number;       // % thuế VAT dệt
  chiPhiDet?: number;    // chi phí dệt / kg vải quy đổi

  // 3. Khâu Nhuộm & Hoàn tất
  nccNhuom: string;
  kieuNhuom: string;
  giaNhuom: number;       // đ/kg vải
  phuPhiNhuom: number;   // hóa chất, căng kim, chống nhiễm (đ/kg)
  haoHutNhuom?: number;  // % hao hụt nhuộm
  vatNhuom?: number;     // % thuế VAT nhuộm
  chiPhiNhuom: number;   // chi phí nhuộm / kg vải quy đổi

  // Tổng quy đổi
  donGiaQuyDoi: number;  // = chiPhiSoi + chiPhiDet + chiPhiNhuom (đ/kg vải thành phẩm)
  ngayCapNhat: string;
  ghiChu?: string;
}

export interface PresetVaiMau {
  id: string;
  tenPreset: string;
  moTa: string;
  donGiaMau: number;
  khauSoi: {
    nccSoi: string;
    loaiSoi: string;
    giaSoi: number;
    dinhMucSoi: number;
    haoHutSoi?: number;
    vatSoi?: number;
  };
  khauDet: {
    nccDet: string;
    kieuDet: string;
    giaDet: number;
    haoHutDet?: number;
    vatDet?: number;
  };
  khauNhuom: {
    nccNhuom: string;
    kieuNhuom: string;
    giaNhuom: number;
    phuPhiNhuom: number;
    haoHutNhuom?: number;
    vatNhuom?: number;
  };
}

// Danh mục các Presets cấu thành giá CHUẨN THEO ĐÚNG NHÀ CUNG CẤP CÓ TRÊN HỆ THỐNG MIMIN ERP
// 1. Sợi: CT TNHH TM Quốc tế Sammoon (NCC-02, giá 42.000đ/kg) & Công ty Lucky Avanti (NCC-01)
// 2. Dệt: CT TNHH SX TM Dệt May Hải Dương (NCC-03, đơn giá 10.000đ/kg)
// 3. Nhuộm: CT TNHH MTV Dệt Nhuộm Thái Thành (NCC-04) & CÔNG TY GIGATEX (NCC-14)
export const PRESETS_VAI_MAU: PresetVaiMau[] = [
  {
    id: "ca-sau-polytes",
    tenPreset: "Cá sấu Polytes (74.000 đ/kg)",
    moTa: "Chuyên may Polo cao cấp, chống nhăn, thoáng mát (Chuẩn xưởng)",
    donGiaMau: 74000,
    khauSoi: {
      nccSoi: "CT TNHH TM Quốc tế Sammoon",
      loaiSoi: "Sợi 30s Poly Spandex (Sammoon)",
      giaSoi: 42000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Cá sấu 4 chiều (Pique)",
      giaDet: 10000,
    },
    khauNhuom: {
      nccNhuom: "CT TNHH MTV Dệt Nhuộm Thái Thành",
      kieuNhuom: "Nhuộm cao áp OZ chống nhiễm màu",
      giaNhuom: 22000,
      phuPhiNhuom: 0,
    },
  },
  {
    id: "cotton-100-4c",
    tenPreset: "Cotton 100% 4C Compact (115.000 đ/kg)",
    moTa: "Cotton tự nhiên mềm mát, chải kỹ sợi 30s",
    donGiaMau: 115000,
    khauSoi: {
      nccSoi: "Công ty Lucky Avanti",
      loaiSoi: "Sợi cotton 30s/32s Compact",
      giaSoi: 77000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Single Jersey 4 chiều co giãn",
      giaDet: 12000,
    },
    khauNhuom: {
      nccNhuom: "CT TNHH MTV Dệt Nhuộm Thái Thành",
      kieuNhuom: "Nhuộm hoạt tính cầm màu cấp 4-5",
      giaNhuom: 26000,
      phuPhiNhuom: 0,
    },
  },
  {
    id: "cvc-65-35",
    tenPreset: "CVC 65/35 Cá Sấu (97.000 đ/kg)",
    moTa: "Vải cá sấu pha Cotton và Poly giữ phom đứng dáng",
    donGiaMau: 97000,
    khauSoi: {
      nccSoi: "CT TNHH TM Quốc tế Sammoon",
      loaiSoi: "Sợi CVC 65/35 chi số 30s",
      giaSoi: 62000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Cá sấu 4 chiều",
      giaDet: 11000,
    },
    khauNhuom: {
      nccNhuom: "CT TNHH MTV Dệt Nhuộm Thái Thành",
      kieuNhuom: "Nhuộm phân tán - hoạt tính",
      giaNhuom: 24000,
      phuPhiNhuom: 0,
    },
  },
  {
    id: "poly-me-the-thao",
    tenPreset: "Poly Mè Thể Thao (67.000 đ/kg)",
    moTa: "Vải mè kim cương siêu nhẹ, thoáng khí, may áo thể thao",
    donGiaMau: 67000,
    khauSoi: {
      nccSoi: "CT TNHH TM Quốc tế Sammoon",
      loaiSoi: "Sợi Poly 75/72 nhanh khô",
      giaSoi: 39000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Mè lỗ kim thể thao",
      giaDet: 10000,
    },
    khauNhuom: {
      nccNhuom: "CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)",
      kieuNhuom: "Nhuộm phân tán hoàn tất Quick-Dry",
      giaNhuom: 18000,
      phuPhiNhuom: 0,
    },
  },
  {
    id: "ni-da-ca-chan-cua",
    tenPreset: "Nỉ Da Cá Chân Cua (94.000 đ/kg)",
    moTa: "Vải nỉ may áo khoác, quần jogger, đầm ấm",
    donGiaMau: 94000,
    khauSoi: {
      nccSoi: "Công ty Lucky Avanti",
      loaiSoi: "Sợi TC 20s + chân cua",
      giaSoi: 60000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Dệt 3 sợi chân cua",
      giaDet: 12000,
    },
    khauNhuom: {
      nccNhuom: "CT TNHH MTV Dệt Nhuộm Thái Thành",
      kieuNhuom: "Nhuộm hoàn tất chải lông chống xù",
      giaNhuom: 22000,
      phuPhiNhuom: 0,
    },
  },
  {
    id: "thun-lanh-spandex",
    tenPreset: "Thun Lạnh 4 Chiều (80.000 đ/kg)",
    moTa: "Mặt vải trơn mịn, mát lạnh tay, chống tia UV",
    donGiaMau: 80000,
    khauSoi: {
      nccSoi: "CT TNHH TM Quốc tế Sammoon",
      loaiSoi: "Sợi Poly lạnh + Spandex 40D",
      giaSoi: 48000,
      dinhMucSoi: 1.0,
    },
    khauDet: {
      nccDet: "CT TNHH SX TM Dệt May Hải Dương",
      kieuDet: "Interlock lạnh 4 chiều",
      giaDet: 10000,
    },
    khauNhuom: {
      nccNhuom: "CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)",
      kieuNhuom: "Nhuộm phân tán hoàn tất CoolTouch",
      giaNhuom: 22000,
      phuPhiNhuom: 0,
    },
  },
];

const STORAGE_KEY_3_KHAU = "mimin_kho_vai_gia_3_khau";

/**
 * Đọc toàn bộ danh sách cấu thành giá 3 khâu từ localStorage
 */
export function getAllGia3Khau(): Record<string, ChiTietGia3Khau> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_3_KHAU);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error("Lỗi khi đọc mimin_kho_vai_gia_3_khau:", e);
    return {};
  }
}

/**
 * Lấy chi tiết giá 3 khâu của một mã vải
 * Tự động lọc sạch các giá trị lỗi ảo (> 200.000 đ/kg như 7474040)
 * Gán đúng Nhà cung cấp thực tế trên hệ thống MIMIN: Sammoon (Sợi), Hải Dương (Dệt), Thái Thành / Gigatex (Nhuộm)
 */
export function getChiTietGia3Khau(
  maVT: string,
  donGiaHienTai?: number,
  tenVT?: string,
  mauSac?: string
): ChiTietGia3Khau {
  const all = getAllGia3Khau();
  const existing = all[maVT];

  // Nếu đã lưu và là giá thực tế hợp lý (< 200.000đ/kg vải và giá sợi < 120.000đ/kg)
  if (existing && existing.donGiaQuyDoi > 0 && existing.donGiaQuyDoi < 200000 && existing.giaSoi < 120000) {
    return existing;
  }

  // Chuẩn hóa baseGia trong khoảng thực tế của vải may mặc (thường là 64.000 - 120.000 đ/kg)
  let baseGia = 74000;
  if (donGiaHienTai && donGiaHienTai > 0) {
    if (donGiaHienTai > 200000) {
      // Bị số lỗi như 7474040 -> đưa về 74.000 đ
      baseGia = 74000;
    } else {
      baseGia = donGiaHienTai;
    }
  }

  // Khâu Dệt: CT TNHH SX TM Dệt May Hải Dương - Đơn giá dệt chuẩn trong hệ thống là 10.000 đ/kg
  const giaDet = 10000;
  // Khâu Sợi: CT TNHH TM Quốc tế Sammoon - Đơn giá sợi chuẩn là 42.000 đ/kg (hoặc phân bổ ~57%)
  const giaSoi = baseGia === 74000 ? 42000 : Math.round(Math.max(30000, (baseGia - giaDet) * 0.65) / 1000) * 1000;
  // Khâu Nhuộm: CT TNHH MTV Dệt Nhuộm Thái Thành - Phần còn lại
  const giaNhuom = Math.max(0, baseGia - giaSoi - giaDet);

  const initialRecord: ChiTietGia3Khau = {
    maVT,
    tenVT: tenVT || "",
    mauSac: mauSac || "",
    nccSoi: "CT TNHH TM Quốc tế Sammoon",
    loaiSoi: "Sợi 30s Poly Spandex (Sammoon)",
    giaSoi: giaSoi || 42000,
    dinhMucSoi: 1.0,
    haoHutSoi: 0,
    vatSoi: 0,
    chiPhiSoi: giaSoi || 42000,
    nccDet: "CT TNHH SX TM Dệt May Hải Dương",
    kieuDet: "Cá sấu 4 chiều",
    giaDet: giaDet,
    haoHutDet: 0,
    vatDet: 0,
    chiPhiDet: giaDet,
    nccNhuom: "CT TNHH MTV Dệt Nhuộm Thái Thành",
    kieuNhuom: "Nhuộm cao áp OZ chống nhiễm",
    giaNhuom: giaNhuom || 22000,
    phuPhiNhuom: 0,
    haoHutNhuom: 0,
    vatNhuom: 0,
    chiPhiNhuom: giaNhuom || 22000,
    donGiaQuyDoi: (giaSoi || 42000) + giaDet + (giaNhuom || 22000),
    ngayCapNhat: new Date().toISOString().split("T")[0],
    ghiChu: "Quy đổi theo NCC và đơn giá thực tế MIMIN ERP",
  };

  // Lưu bản chuẩn này vào storage để loại bỏ dữ liệu rác cũ
  saveChiTietGia3Khau(initialRecord);

  return initialRecord;
}

/**
 * Lưu cấu thành giá 3 khâu cho một mã vải
 */
export function saveChiTietGia3Khau(data: ChiTietGia3Khau): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllGia3Khau();
    all[data.maVT] = {
      ...data,
      ngayCapNhat: new Date().toISOString().split("T")[0],
    };
    localStorage.setItem(STORAGE_KEY_3_KHAU, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("mimin_gia_3_khau_updated", { detail: data }));
  } catch (e) {
    console.error("Lỗi khi lưu mimin_kho_vai_gia_3_khau:", e);
  }
}
