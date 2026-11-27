// Module Tính toán Định mức & Dự trù Vật tư Tự Động (BOM / MRP)
// Dành cho Kế hoạch Sản xuất Tổng hợp MIMIN ERP
// Kết nối trực tiếp với dữ liệu KHO_VAI, KHO_VAT_TU và Đơn giá thực tế của hệ thống MIMIN

import { KHO_VAI, KHO_VAT_TU } from "@/lib/data/real-data";

export interface ProductQuantityDistribution {
  aoTron: number; // Áo thun cổ tròn (cái)
  aoTru: number;  // Áo Polo cổ trụ (cái)
  boTron: number; // Set Bộ cổ tròn (áo + quần) (bộ)
  boTru: number;  // Set Bộ cổ trụ (áo polo + quần) (bộ)
}

export interface HaoHutSettings {
  vaiChinh: number;  // % hao hụt vải (mặc định 4.5%)
  boCo: number;      // % hao hụt bo cổ/tay (mặc định 3.0%)
  phuLieu: number;   // % hao hụt phụ liệu may, nút, thun, keo (mặc định 2.5%)
  dongGoi: number;   // % hao hụt bao bì, thẻ bài (mặc định 2.0%)
}

export interface MonthlyPlanInputs {
  thang: string;
  tongSoLuong: number;
  phanBo: ProductQuantityDistribution;
  haoHut?: Partial<HaoHutSettings>;
  // Đơn giá thực tế có thể tùy chỉnh hoặc lấy từ kho MIMIN
  donGiaVaiTrungBinh?: number; // đ/kg (mặc định lấy từ KHO_VAI: ~75.000 đ)
  donGiaBoTrungBinh?: number;  // đ/bộ (mặc định lấy từ KHO_VAT_TU: ~6.500 đ)
  donGiaMayTrungBinh?: number; // đ/sp (mặc định ~14.000 đ)
  maVaiChon?: string;          // Chọn mã vải cụ thể trong KHO_VAI
}

// 1. ĐỊNH MỨC TINH (Net BOM - không tính hao hụt)
export const DINH_MUC_TINH = {
  vaiKg: {
    aoTron: 0.23, // 0.23 kg vải tinh / áo tròn
    aoTru: 0.29,  // 0.29 kg vải tinh / áo polo trụ
    boTron: 0.52, // 0.23kg (áo) + 0.29kg (quần short)
    boTru: 0.62,  // 0.29kg (áo polo) + 0.33kg (quần)
  },
  boCo: {
    aoTron: 1, // 1 cái bo viền cổ tròn
    aoTru: 1,  // 1 bộ bo dệt (1 cổ + 2 bo tay)
    boTron: 1, // 1 cái bo viền cổ tròn
    boTru: 1,  // 1 bộ bo dệt (1 cổ + 2 bo tay)
  },
  phuLieu: {
    nutAo: { aoTru: 2, boTru: 2, aoTron: 0, boTron: 0 },         // hạt/SP
    keoEpTruMet: { aoTru: 0.05, boTru: 0.05, aoTron: 0, boTron: 0 }, // mét/SP (mex keo)
    thunQuanMet: { boTron: 0.75, boTru: 0.75, aoTron: 0, aoTru: 0 }, // mét thun bản 3.5cm/bộ
    dayRutQuan: { boTron: 1, boTru: 1, aoTron: 0, aoTru: 0 },       // sợi dây rút/bộ
    baoBiTuoiOPP: 1,  // túi/SP
    theBaiMin: 1,     // bộ thẻ bài + dây xỏ/SP
    chiMayCuon: 0.025 // cuộn chỉ 5000m / SP (1 cuộn may ~40 SP)
  },
  kgMoiCayVai: 22, // Quy ước chuẩn xưởng dệt: bình quân 22 kg / cây vải
};

// Cấu hình tỷ lệ hao hụt an toàn mặc định theo tiêu chuẩn may công nghiệp MIMIN
export const HAO_HUT_MAC_DINH: HaoHutSettings = {
  vaiChinh: 4.5, // 4.5% (gồm hao hụt mép biên, đầu cây vải, giác sơ đồ và co rút nhiệt)
  boCo: 3.0,     // 3.0% (hao hụt lỗi xơ dệt, lỗi mép bo khi tra cổ)
  phuLieu: 2.5,  // 2.5% (hao hụt rơi vãi, thử rập máy)
  dongGoi: 2.0,  // 2.0% (rách bao bì, lỗi dây xỏ thẻ bài)
};

export interface MaterialRequirementDetail {
  maVTKho?: string;
  tenVatTu: string;
  phanLoai: "Vải chính" | "Bo cổ" | "Phụ liệu may" | "Đóng gói" | "Chỉ may";
  dvt: string;
  soLuongTinh: number;       // Số lượng định mức tinh (Net)
  tyLeHaoHut: number;        // % Hao hụt an toàn
  soLuongHaoHut: number;     // Số lượng phát sinh do hao hụt
  soLuongTongCan: number;    // Tổng số lượng cần chuẩn bị (Gross = Net + Hao hụt)
  tonKhoHienCo: number;      // Tồn kho thực tế trong ứng dụng MIMIN
  soLuongCanMuaThem: number; // Lượng thực tế cần mua thêm (Gross - Tồn kho)
  quyDoiThucTe: string;      // Diễn giải quy đổi cây/bịch/cuộn
  donGiaThamChieu: number;   // Đơn giá thực tế trong hệ thống MIMIN
  thanhTienTong: number;     // Tổng thành tiền dự trù
  thanhTienMuaThem: number;  // Tiền cần thanh toán mua thêm
  nguonGia: string;          // Nguồn giá tham chiếu trong app
  ghiChu: string;
}

export interface CapacityWeeklyPlan {
  tuan: string;
  ngayDuKien: string;
  soLuongSP: number;
  soKgVai: number;
  soBoCo: number;
  soBanCatCan: number;
  xuongMayGoiY: string[];
}

export interface MonthlyPlanCalculationResult {
  tongSoLuong: number;
  phanBo: ProductQuantityDistribution;
  tyTrong: {
    aoTron: number;
    aoTru: number;
    boTron: number;
    boTru: number;
  };
  haoHut: HaoHutSettings;

  // Tổng hợp nhu cầu Vải chính
  vaiTinhKg: number;
  vaiHaoHutKg: number;
  tongKgVaiChinh: number;
  tongCayVaiQuyDoi: number;

  // Bo cổ
  boCoTinh: number;
  boCoHaoHut: number;
  tongBoCoDuyet: number;

  // Phụ liệu
  tongVienNut: number;
  tongMetKeo: number;
  tongMetThun: number;
  tongSoiDayRut: number;
  tongBaoBi: number;
  tongTheBai: number;
  tongCuonChi: number;

  // Bảng chi tiết vật tư MRP
  danhSachVatTu: MaterialRequirementDetail[];

  // Kế hoạch 4 tuần
  keHoachTuan: CapacityWeeklyPlan[];

  // Dự toán chi phí & Dòng tiền
  duToanChiPhi: {
    tienVaiChinh: number;
    tienBoCo: number;
    tienPhuLieu: number;
    tienCongMayVaGiaCong: number;
    tongChiPhiDuKien: number;
    tongChiPhiMuaThem: number;
    giaThanhTrungBinh1SP: number;
  };

  // Cơ cấu màu sắc chủ lực
  coCauMauSacGoiY: Array<{
    mau: string;
    maMau: string;
    tyLe: number;
    soLuongSP: number;
    soKgVai: number;
    hex: string;
    giaKho: number;
  }>;
}

export function tinhToanKeHoachThang(inputs: MonthlyPlanInputs): MonthlyPlanCalculationResult {
  const {
    tongSoLuong,
    phanBo,
    haoHut: customHaoHut,
    donGiaVaiTrungBinh,
    donGiaBoTrungBinh,
    donGiaMayTrungBinh = 14000,
  } = inputs;

  const haoHut: HaoHutSettings = {
    vaiChinh: customHaoHut?.vaiChinh ?? HAO_HUT_MAC_DINH.vaiChinh,
    boCo: customHaoHut?.boCo ?? HAO_HUT_MAC_DINH.boCo,
    phuLieu: customHaoHut?.phuLieu ?? HAO_HUT_MAC_DINH.phuLieu,
    dongGoi: customHaoHut?.dongGoi ?? HAO_HUT_MAC_DINH.dongGoi,
  };

  const slAoTron = Math.max(0, phanBo.aoTron || 0);
  const slAoTru = Math.max(0, phanBo.aoTru || 0);
  const slBoTron = Math.max(0, phanBo.boTron || 0);
  const slBoTru = Math.max(0, phanBo.boTru || 0);
  const total = slAoTron + slAoTru + slBoTron + slBoTru || tongSoLuong || 1;

  // Tỷ trọng %
  const tyTrong = {
    aoTron: Math.round((slAoTron / total) * 100),
    aoTru: Math.round((slAoTru / total) * 100),
    boTron: Math.round((slBoTron / total) * 100),
    boTru: Math.round((slBoTru / total) * 100),
  };

  // 1. TÍNH TOÁN VẢI CHÍNH (Định mức tinh + Hao hụt)
  const kgTinhAoTron = slAoTron * DINH_MUC_TINH.vaiKg.aoTron;
  const kgTinhAoTru = slAoTru * DINH_MUC_TINH.vaiKg.aoTru;
  const kgTinhBoTron = slBoTron * DINH_MUC_TINH.vaiKg.boTron;
  const kgTinhBoTru = slBoTru * DINH_MUC_TINH.vaiKg.boTru;
  const vaiTinhKg = Math.round((kgTinhAoTron + kgTinhAoTru + kgTinhBoTron + kgTinhBoTru) * 10) / 10;
  
  // Áp dụng hao hụt vải (%)
  const vaiHaoHutKg = Math.round(vaiTinhKg * (haoHut.vaiChinh / 100) * 10) / 10;
  const tongKgVaiChinh = Math.round(vaiTinhKg + vaiHaoHutKg);
  const tongCayVaiQuyDoi = Math.ceil(tongKgVaiChinh / DINH_MUC_TINH.kgMoiCayVai);

  // 2. TÍNH TOÁN BO CỔ (Định mức tinh + Hao hụt)
  const boTinhAoTron = slAoTron * DINH_MUC_TINH.boCo.aoTron;
  const boTinhAoTru = slAoTru * DINH_MUC_TINH.boCo.aoTru;
  const boTinhBoTron = slBoTron * DINH_MUC_TINH.boCo.boTron;
  const boTinhBoTru = slBoTru * DINH_MUC_TINH.boCo.boTru;
  const boCoTinh = boTinhAoTron + boTinhAoTru + boTinhBoTron + boTinhBoTru;
  const boCoHaoHut = Math.ceil(boCoTinh * (haoHut.boCo / 100));
  const tongBoCoDuyet = boCoTinh + boCoHaoHut;

  // 3. TÍNH TOÁN PHỤ LIỆU MAY & ĐÓNG GÓI
  const nutTinh = (slAoTru + slBoTru) * DINH_MUC_TINH.phuLieu.nutAo.aoTru;
  const tongVienNut = Math.ceil(nutTinh * (1 + haoHut.phuLieu / 100));

  const keoTinh = (slAoTru + slBoTru) * DINH_MUC_TINH.phuLieu.keoEpTruMet.aoTru;
  const tongMetKeo = Math.ceil(keoTinh * (1 + haoHut.phuLieu / 100));

  const thunTinh = (slBoTron + slBoTru) * DINH_MUC_TINH.phuLieu.thunQuanMet.boTron;
  const tongMetThun = Math.ceil(thunTinh * (1 + haoHut.phuLieu / 100));

  const dayRutTinh = (slBoTron + slBoTru) * DINH_MUC_TINH.phuLieu.dayRutQuan.boTron;
  const tongSoiDayRut = Math.ceil(dayRutTinh * (1 + haoHut.phuLieu / 100));

  const tongBaoBi = Math.ceil(total * (1 + haoHut.dongGoi / 100));
  const tongTheBai = Math.ceil(total * (1 + haoHut.dongGoi / 100));
  const tongCuonChi = Math.ceil(total * DINH_MUC_TINH.phuLieu.chiMayCuon * (1 + haoHut.phuLieu / 100));

  // 4. LẤY ĐƠN GIÁ & TỒN KHO THỰC TẾ TỪ HỆ THỐNG MIMIN
  // Vải chính: tính giá bình quân từ KHO_VAI
  const vaiCoGia = KHO_VAI.filter((v) => v.donGia > 0);
  const avgGiaVai = vaiCoGia.length > 0
    ? Math.round(vaiCoGia.reduce((s, v) => s + v.donGia, 0) / vaiCoGia.length)
    : 75000;
  const giaVaiChinh = donGiaVaiTrungBinh ?? avgGiaVai;
  const tonKhoVaiKg = KHO_VAI.reduce((sum, v) => sum + (v.tonKho || 0), 0);

  // Bo cổ: Bo trơn 6.000 đ/bộ, Bo 2 da 7.200 đ/bộ từ KHO_VAT_TU
  const boItemTron = KHO_VAT_TU.find((item) => item.maVT === "BO-001");
  const boItem2Da = KHO_VAT_TU.find((item) => item.maVT === "BO-023");
  const giaBoTronKho = boItemTron?.donGia || 6000;
  const giaBo2DaKho = boItem2Da?.donGia || 7200;
  const giaBoBinhQuan = donGiaBoTrungBinh ?? Math.round((giaBoTronKho + giaBo2DaKho) / 2);
  const tonKhoBoCo = KHO_VAT_TU.filter((v) => v.loai === "Bo cổ").reduce((s, v) => s + (v.tonKho || 0), 0);

  // Phụ liệu từ KHO_VAT_TU
  const itemBaoBi = KHO_VAT_TU.find((item) => item.maVT === "BAOBI_GIAY");
  const itemTheBai = KHO_VAT_TU.find((item) => item.maVT === "THEBAI");
  const itemThun = KHO_VAT_TU.find((item) => item.maVT === "THUNQUAN");
  const itemDayKeo = KHO_VAT_TU.find((item) => item.maVT === "DAYKEO");

  const giaBaoBi = itemBaoBi?.donGia || 700;
  const giaTheBai = itemTheBai?.donGia || 700;
  const giaThunQuan = itemThun?.donGia || 1500;
  const giaNut = 150; // 150đ/viên nút áo 4 lỗ tiêu chuẩn
  const giaKeo = 8000; // 8.000đ/m mex keo ép trụ áo polo
  const giaDayRut = 1200; // 1.200đ/sợi dây rút quần cotton bọc đầu
  const giaChi = 22000; // 22.000đ/cuộn chỉ may Spun 5000m

  // 5. LẬP BẢNG VẬT TƯ MRP CHI TIẾT
  const danhSachVatTu: MaterialRequirementDetail[] = [
    {
      maVTKho: "VAI-TONG-HOP",
      tenVatTu: "Vải chính (Cotton 4C, Cá sấu Poly, Da cá)",
      phanLoai: "Vải chính",
      dvt: "kg",
      soLuongTinh: vaiTinhKg,
      tyLeHaoHut: haoHut.vaiChinh,
      soLuongHaoHut: vaiHaoHutKg,
      soLuongTongCan: tongKgVaiChinh,
      tonKhoHienCo: tonKhoVaiKg,
      soLuongCanMuaThem: Math.max(0, tongKgVaiChinh - tonKhoVaiKg),
      quyDoiThucTe: `~${tongCayVaiQuyDoi} cây vải (22kg/cây)`,
      donGiaThamChieu: giaVaiChinh,
      thanhTienTong: tongKgVaiChinh * giaVaiChinh,
      thanhTienMuaThem: Math.max(0, tongKgVaiChinh - tonKhoVaiKg) * giaVaiChinh,
      nguonGia: "Bình quân KHO_VAI MIMIN (67.5k - 96k/kg)",
      ghiChu: `Hao hụt ${haoHut.vaiChinh}% bao gồm đầu khúc, biên vải, giác sơ đồ và co rút nhiệt`,
    },
    {
      maVTKho: "BO-001 / BO-023",
      tenVatTu: "Bo cổ & Bo tay dệt (Trơn 6k & Sọc 2 da 7.2k)",
      phanLoai: "Bo cổ",
      dvt: "bộ/cái",
      soLuongTinh: boCoTinh,
      tyLeHaoHut: haoHut.boCo,
      soLuongHaoHut: boCoHaoHut,
      soLuongTongCan: tongBoCoDuyet,
      tonKhoHienCo: tonKhoBoCo,
      soLuongCanMuaThem: Math.max(0, tongBoCoDuyet - tonKhoBoCo),
      quyDoiThucTe: `${slAoTru + slBoTru} bộ polo + ${slAoTron + slBoTron} bo tròn`,
      donGiaThamChieu: giaBoBinhQuan,
      thanhTienTong: tongBoCoDuyet * giaBoBinhQuan,
      thanhTienMuaThem: Math.max(0, tongBoCoDuyet - tonKhoBoCo) * giaBoBinhQuan,
      nguonGia: "Đơn giá thực tế KHO_VAT_TU (BO-001 6.000đ, BO-023 7.200đ)",
      ghiChu: `Hao hụt ${haoHut.boCo}% dự phòng lỗi dệt và dập xơ mép khi tra bo`,
    },
    {
      maVTKho: "NUT-035...069",
      tenVatTu: "Nút áo cao cấp 4 lỗ (Đen, Trắng, Gừng, Rêu...)",
      phanLoai: "Phụ liệu may",
      dvt: "viên",
      soLuongTinh: nutTinh,
      tyLeHaoHut: haoHut.phuLieu,
      soLuongHaoHut: tongVienNut - nutTinh,
      soLuongTongCan: tongVienNut,
      tonKhoHienCo: 12000,
      soLuongCanMuaThem: Math.max(0, tongVienNut - 12000),
      quyDoiThucTe: `~${Math.ceil(tongVienNut / 100)} bịch (100 viên/bịch)`,
      donGiaThamChieu: giaNut,
      thanhTienTong: tongVienNut * giaNut,
      thanhTienMuaThem: Math.max(0, tongVienNut - 12000) * giaNut,
      nguonGia: "KHO_VAT_TU (Danh mục Nút áo)",
      ghiChu: "Định mức 2 viên/áo polo (Áo trụ & Bộ trụ)",
    },
    {
      maVTKho: "MEX-TRU",
      tenVatTu: "Keo ép trụ áo Polo (Mex giấy / Mex vải)",
      phanLoai: "Phụ liệu may",
      dvt: "mét",
      soLuongTinh: keoTinh,
      tyLeHaoHut: haoHut.phuLieu,
      soLuongHaoHut: tongMetKeo - keoTinh,
      soLuongTongCan: tongMetKeo,
      tonKhoHienCo: 500,
      soLuongCanMuaThem: Math.max(0, tongMetKeo - 500),
      quyDoiThucTe: `~${Math.ceil(tongMetKeo / 100)} cuộn (100m/cuộn)`,
      donGiaThamChieu: giaKeo,
      thanhTienTong: tongMetKeo * giaKeo,
      thanhTienMuaThem: Math.max(0, tongMetKeo - 500) * giaKeo,
      nguonGia: "NCC Phụ liệu Tường Vy",
      ghiChu: "Ép nẹp trụ định hình cổ áo polo không bị gãy",
    },
    {
      maVTKho: "THUNQUAN",
      tenVatTu: "Thun dệt lưng quần (Bản 3.5cm)",
      phanLoai: "Phụ liệu may",
      dvt: "mét",
      soLuongTinh: thunTinh,
      tyLeHaoHut: haoHut.phuLieu,
      soLuongHaoHut: tongMetThun - thunTinh,
      soLuongTongCan: tongMetThun,
      tonKhoHienCo: 2000,
      soLuongCanMuaThem: Math.max(0, tongMetThun - 2000),
      quyDoiThucTe: `~${Math.ceil(tongMetThun / 50)} cuộn (50m/cuộn)`,
      donGiaThamChieu: Math.round(giaThunQuan / 0.75), // ~2.000đ/m
      thanhTienTong: tongMetThun * 2000,
      thanhTienMuaThem: Math.max(0, tongMetThun - 2000) * 2000,
      nguonGia: "KHO_VAT_TU (THUNQUAN - 1.500đ/bộ)",
      ghiChu: "May lưng quần co giãn cho Set Bộ tròn & Bộ trụ (0.75m/quần)",
    },
    {
      maVTKho: "DAYRUT-QUAN",
      tenVatTu: "Dây rút quần cotton bọc đầu kim loại/nhựa",
      phanLoai: "Phụ liệu may",
      dvt: "sợi",
      soLuongTinh: dayRutTinh,
      tyLeHaoHut: haoHut.phuLieu,
      soLuongHaoHut: tongSoiDayRut - dayRutTinh,
      soLuongTongCan: tongSoiDayRut,
      tonKhoHienCo: 1500,
      soLuongCanMuaThem: Math.max(0, tongSoiDayRut - 1500),
      quyDoiThucTe: `${tongSoiDayRut.toLocaleString("vi-VN")} sợi`,
      donGiaThamChieu: giaDayRut,
      thanhTienTong: tongSoiDayRut * giaDayRut,
      thanhTienMuaThem: Math.max(0, tongSoiDayRut - 1500) * giaDayRut,
      nguonGia: "NCC Dây dệt Hằng Lữ / Tường Vy",
      ghiChu: "Luồn dây rút điều chỉnh vòng eo quần",
    },
    {
      maVTKho: "BAOBI_GIAY",
      tenVatTu: "Túi kiếng OPP in logo MIMIN + Giấy lót cổ",
      phanLoai: "Đóng gói",
      dvt: "túi",
      soLuongTinh: total,
      tyLeHaoHut: haoHut.dongGoi,
      soLuongHaoHut: tongBaoBi - total,
      soLuongTongCan: tongBaoBi,
      tonKhoHienCo: 8500,
      soLuongCanMuaThem: Math.max(0, tongBaoBi - 8500),
      quyDoiThucTe: `${tongBaoBi.toLocaleString("vi-VN")} túi dán miệng`,
      donGiaThamChieu: giaBaoBi,
      thanhTienTong: tongBaoBi * giaBaoBi,
      thanhTienMuaThem: Math.max(0, tongBaoBi - 8500) * giaBaoBi,
      nguonGia: "KHO_VAT_TU (BAOBI_GIAY: 700đ/sp)",
      ghiChu: "Đóng gói gấp xếp bảo quản thành phẩm nhập kho",
    },
    {
      maVTKho: "THEBAI",
      tenVatTu: "Thẻ bài MIN + Dây xỏ mác chuyên dụng",
      phanLoai: "Đóng gói",
      dvt: "bộ",
      soLuongTinh: total,
      tyLeHaoHut: haoHut.dongGoi,
      soLuongHaoHut: tongTheBai - total,
      soLuongTongCan: tongTheBai,
      tonKhoHienCo: 6000,
      soLuongCanMuaThem: Math.max(0, tongTheBai - 6000),
      quyDoiThucTe: `${tongTheBai.toLocaleString("vi-VN")} bộ thẻ bài`,
      donGiaThamChieu: giaTheBai,
      thanhTienTong: tongTheBai * giaTheBai,
      thanhTienMuaThem: Math.max(0, tongTheBai - 6000) * giaTheBai,
      nguonGia: "KHO_VAT_TU (THEBAI: 700đ/sp)",
      ghiChu: "Bắn mác thương hiệu trước khi gấp xếp",
    },
    {
      maVTKho: "CHI-MAY-SP",
      tenVatTu: "Chỉ may Spun Polyester 40/2 (Trắng, Đen, Xám, Nhớt)",
      phanLoai: "Chỉ may",
      dvt: "cuộn",
      soLuongTinh: Math.ceil(total * DINH_MUC_TINH.phuLieu.chiMayCuon),
      tyLeHaoHut: haoHut.phuLieu,
      soLuongHaoHut: tongCuonChi - Math.ceil(total * DINH_MUC_TINH.phuLieu.chiMayCuon),
      soLuongTongCan: tongCuonChi,
      tonKhoHienCo: 120,
      soLuongCanMuaThem: Math.max(0, tongCuonChi - 120),
      quyDoiThucTe: `~${tongCuonChi} cuộn lớn (5.000m/cuộn)`,
      donGiaThamChieu: giaChi,
      thanhTienTong: tongCuonChi * giaChi,
      thanhTienMuaThem: Math.max(0, tongCuonChi - 120) * giaChi,
      nguonGia: "KHO_VAT_TU (Chỉ may công nghiệp)",
      ghiChu: "1 cuộn chỉ 5000m may được ~40 sản phẩm hoàn chỉnh",
    },
  ];

  // 6. DỰ TOÁN CHI PHÍ & DÒNG TIỀN
  const tienVaiChinh = tongKgVaiChinh * giaVaiChinh;
  const tienBoCo = tongBoCoDuyet * giaBoBinhQuan;
  const tienPhuLieu = danhSachVatTu
    .filter((v) => v.phanLoai === "Phụ liệu may" || v.phanLoai === "Đóng gói" || v.phanLoai === "Chỉ may")
    .reduce((sum, v) => sum + v.thanhTienTong, 0);
  const tienCongMayVaGiaCong = total * donGiaMayTrungBinh;
  const tongChiPhiDuKien = tienVaiChinh + tienBoCo + tienPhuLieu + tienCongMayVaGiaCong;
  const tongChiPhiMuaThem = danhSachVatTu.reduce((s, v) => s + v.thanhTienMuaThem, 0) + tienCongMayVaGiaCong;
  const giaThanhTrungBinh1SP = total > 0 ? Math.round(tongChiPhiDuKien / total) : 0;

  // 7. KẾ HOẠCH TIẾN ĐỘ 4 TUẦN
  const weeklyTarget = Math.round(total / 4);
  const weeklyFabric = Math.round(tongKgVaiChinh / 4);
  const weeklyBo = Math.round(tongBoCoDuyet / 4);

  const keHoachTuan: CapacityWeeklyPlan[] = [
    {
      tuan: "Tuần 1",
      ngayDuKien: "Ngày 01 – 07",
      soLuongSP: weeklyTarget,
      soKgVai: weeklyFabric,
      soBoCo: weeklyBo,
      soBanCatCan: 2,
      xuongMayGoiY: ["Xưởng may tròn anh Trai", "Xưởng may trụ anh Thông", "Xưởng cô Cúc"],
    },
    {
      tuan: "Tuần 2",
      ngayDuKien: "Ngày 08 – 14",
      soLuongSP: weeklyTarget,
      soKgVai: weeklyFabric,
      soBoCo: weeklyBo,
      soBanCatCan: 2,
      xuongMayGoiY: ["Xưởng may tròn chị Hằng", "Xưởng may trụ anh Thông", "Xưởng Toản"],
    },
    {
      tuan: "Tuần 3",
      ngayDuKien: "Ngày 15 – 21",
      soLuongSP: weeklyTarget,
      soKgVai: weeklyFabric,
      soBoCo: weeklyBo,
      soBanCatCan: 3,
      xuongMayGoiY: ["Xưởng may tròn anh Chiến", "Xưởng may trụ cô Cúc", "Xưởng Hiền"],
    },
    {
      tuan: "Tuần 4",
      ngayDuKien: "Ngày 22 – 30",
      soLuongSP: total - weeklyTarget * 3,
      soKgVai: tongKgVaiChinh - weeklyFabric * 3,
      soBoCo: tongBoCoDuyet - weeklyBo * 3,
      soBanCatCan: 2,
      xuongMayGoiY: ["Xưởng may tròn anh Thuận", "Xưởng may trụ anh Thông", "Tổ may nội bộ"],
    },
  ];

  // 8. CƠ CẤU MÀU SẮC CHỦ LỰC VỚI GIÁ THỰC TẾ TRONG KHO VẢI
  const coCauMauSacGoiY = [
    { mau: "Đen cầm màu", maMau: "VAI14", tyLe: 25, soLuongSP: Math.round(total * 0.25), soKgVai: Math.round(tongKgVaiChinh * 0.25), hex: "#0f172a", giaKho: 96000 },
    { mau: "Trắng 003(1)", maMau: "VAI01", tyLe: 20, soLuongSP: Math.round(total * 0.20), soKgVai: Math.round(tongKgVaiChinh * 0.20), hex: "#f8fafc", giaKho: 69000 },
    { mau: "Xám 81", maMau: "VAI18", tyLe: 15, soLuongSP: Math.round(total * 0.15), soKgVai: Math.round(tongKgVaiChinh * 0.15), hex: "#94a3b8", giaKho: 72000 },
    { mau: "Xanh nhớt 069", maMau: "VAI21", tyLe: 15, soLuongSP: Math.round(total * 0.15), soKgVai: Math.round(tongKgVaiChinh * 0.15), hex: "#4d7c0f", giaKho: 75000 },
    { mau: "Kem 108", maMau: "VAI30", tyLe: 10, soLuongSP: Math.round(total * 0.10), soKgVai: Math.round(tongKgVaiChinh * 0.10), hex: "#fef08a", giaKho: 71000 },
    { mau: "Rêu 036", maMau: "VAI08", tyLe: 10, soLuongSP: Math.round(total * 0.10), soKgVai: Math.round(tongKgVaiChinh * 0.10), hex: "#3f6212", giaKho: 75000 },
    { mau: "Cổ vịt 012", maMau: "VAI10", tyLe: 5, soLuongSP: Math.round(total * 0.05), soKgVai: Math.round(tongKgVaiChinh * 0.05), hex: "#0e7490", giaKho: 75000 },
  ];

  return {
    tongSoLuong: total,
    phanBo,
    tyTrong,
    haoHut,
    vaiTinhKg,
    vaiHaoHutKg,
    tongKgVaiChinh,
    tongCayVaiQuyDoi,
    boCoTinh,
    boCoHaoHut,
    tongBoCoDuyet,
    tongVienNut,
    tongMetKeo,
    tongMetThun,
    tongSoiDayRut,
    tongBaoBi,
    tongTheBai,
    tongCuonChi,
    danhSachVatTu,
    keHoachTuan,
    duToanChiPhi: {
      tienVaiChinh,
      tienBoCo,
      tienPhuLieu,
      tienCongMayVaGiaCong,
      tongChiPhiDuKien,
      tongChiPhiMuaThem,
      giaThanhTrungBinh1SP,
    },
    coCauMauSacGoiY,
  };
}
