"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Eye, Printer, Trash2, LayoutList, Package, Truck, Palette, Boxes,
  CheckCircle2, Clock, ChevronRight, FileText, Sparkles, Building2,
  Calendar, Search, X, Image as ImageIcon, Layers, DollarSign, ArrowUpRight,
  Upload, Camera, Plus, ZoomIn
} from "lucide-react";
import { toast } from "sonner";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Modal } from "./ui-blocks";
import PhieuNhapSoiPrint from "./PhieuNhapSoiPrint";
import PhieuGiaoDetPrint from "./PhieuGiaoDetPrint";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import {
  FABRIC_DYE_LOTS_CHANGED_EVENT,
  type FabricDyeLot,
  type KhuMeNhuom,
  type TrangThaiMeNhuom,
} from "@/lib/data/fabric-dye-lots";

// Ảnh mẫu Biên bản bàn giao sợi cho xưởng dệt
const ANH_CHUNG_TU_MAU_GIAO_DET = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <rect x="30" y="30" width="740" height="940" fill="%23ffffff" stroke="%2394a3b8" stroke-width="1.5" stroke-dasharray="4 2"/>
  <text x="60" y="75" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="%230f766e">POLOMIMIN - CÔNG TY TNHH DỆT MAY GIÀU SANG</text>
  <text x="60" y="100" font-family="Arial, sans-serif" font-size="12" fill="%2364748b">MST: 0318507560 · Hotline: 0774480916 · 12/39 Xuân Thới Thượng 58C, Bà Điểm, Hóc Môn</text>
  <line x1="60" y1="115" x2="740" y2="115" stroke="%230f766e" stroke-width="2"/>
  <text x="400" y="160" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="%231e293b" text-anchor="middle">BIÊN BẢN BÀN GIAO SỢI CHO XƯỞNG DỆT</text>
  <text x="400" y="185" font-family="Arial, sans-serif" font-size="13" font-style="italic" fill="%2364748b" text-anchor="middle">Số: BB-GIAO-DET-2026/01 · Ngày: 15/10/2026</text>
  <rect x="60" y="210" width="680" height="95" rx="8" fill="%23f8fafc" stroke="%23cbd5e1"/>
  <text x="80" y="235" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a">BÊN GIAO (KHO SỢI): Công ty Sợi Phú Bài</text>
  <text x="80" y="255" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Đại diện: Hồ Minh Sang · Điện thoại: 0774480916</text>
  <text x="80" y="280" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%236d28d9">BÊN NHẬN (XƯỞNG DỆT): Xưởng dệt Hưng Phát</text>
  <text x="80" y="295" font-family="Arial, sans-serif" font-size="12" fill="%23475569">Đại diện: Nguyễn Văn Hưng · Mã lệnh dệt: LD-20261015-01</text>
  <rect x="60" y="325" width="680" height="35" fill="%23ede9fe"/>
  <text x="75" y="348" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%235b21b6">STT</text>
  <text x="120" y="348" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%235b21b6">Loại Sợi</text>
  <text x="350" y="348" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%235b21b6">Mã Lô</text>
  <text x="490" y="348" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%235b21b6">Quy Cách</text>
  <text x="630" y="348" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="%235b21b6">Khối Lượng</text>
  <line x1="60" y1="395" x2="740" y2="395" stroke="%23e2e8f0"/>
  <text x="82" y="385" font-family="Arial, sans-serif" font-size="12" fill="%23334155">1</text>
  <text x="120" y="385" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a">Cotton 100% 30s/1 Compact</text>
  <text x="350" y="385" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%236d28d9">LSOI-PB-882</text>
  <text x="490" y="385" font-family="Arial, sans-serif" font-size="12" fill="%23334155">40 thùng (25kg/thùng)</text>
  <text x="630" y="385" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="%232563eb">1.000 kg</text>
  <rect x="60" y="415" width="680" height="35" fill="%23f1f5f9"/>
  <text x="470" y="438" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a">TỔNG KHỐI LƯỢNG GIAO:</text>
  <text x="630" y="438" font-family="Arial, sans-serif" font-size="15" font-weight="black" fill="%23dc2626">1.000 KG</text>
  <text x="60" y="490" font-family="Arial, sans-serif" font-size="12" font-style="italic" fill="%23475569">Ghi chú bàn giao: Sợi chuẩn chất lượng, nguyên seal đai kiện. Xưởng dệt tiến hành lên dàn dệt theo đơn hàng.</text>
  <text x="180" y="580" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a" text-anchor="middle">ĐẠI DIỆN BÊN GIAO</text>
  <text x="180" y="600" font-family="Arial, sans-serif" font-size="11" font-style="italic" fill="%2364748b" text-anchor="middle">(Ký, ghi rõ họ tên)</text>
  <text x="180" y="700" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="%230284c7" text-anchor="middle">Hồ Minh Sang</text>
  <text x="580" y="580" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a" text-anchor="middle">ĐẠI DIỆN BÊN NHẬN (XƯỞNG DỆT)</text>
  <text x="580" y="600" font-family="Arial, sans-serif" font-size="11" font-style="italic" fill="%2364748b" text-anchor="middle">(Ký nhận, đóng dấu)</text>
  <text x="580" y="700" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="%237c3aed" text-anchor="middle">Nguyễn Văn Hưng</text>
  <circle cx="580" cy="675" r="50" fill="none" stroke="%23dc2626" stroke-width="2.5" stroke-dasharray="4 2" opacity="0.85"/>
  <circle cx="580" cy="675" r="44" fill="none" stroke="%23dc2626" stroke-width="1.2" opacity="0.85"/>
  <text x="580" y="663" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="%23dc2626" text-anchor="middle">XƯỞNG DỆT HƯNG PHÁT</text>
  <text x="580" y="680" font-family="Arial, sans-serif" font-size="11" font-weight="black" fill="%23dc2626" text-anchor="middle">★ ĐÃ NHẬN ĐỦ ★</text>
  <text x="580" y="694" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="%23dc2626" text-anchor="middle">1.000 KG SỢI</text>
</svg>`;

// Ảnh mẫu Biên bản giao mộc xưởng nhuộm
const ANH_CHUNG_TU_MAU_GIAO_NHUOM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900">
  <rect width="800" height="900" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <text x="60" y="70" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="%237c2d12">POLOMIMIN - BIÊN BẢN GIAO MỘC CHO XƯỞNG NHUỘM</text>
  <line x1="60" y1="85" x2="740" y2="85" stroke="%23ea580c" stroke-width="2"/>
  <text x="80" y="125" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a">Giao từ: Xưởng dệt Hưng Phát ➔ Nhận: Xưởng nhuộm Á Châu</text>
  <text x="80" y="150" font-family="Arial, sans-serif" font-size="12" fill="%23334155">Mã mộc: LM-LD-20261015-01 · Khối lượng mộc: 970 kg · Số cây: 49 cây</text>
  <rect x="60" y="180" width="680" height="150" fill="%23fff7ed" stroke="%23fed7aa" rx="8"/>
  <text x="80" y="215" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23c2410c">Xác nhận nghiệm thu mộc đạt tiêu chuẩn dệt:</text>
  <text x="80" y="245" font-family="Arial, sans-serif" font-size="12" fill="%23475569">✓ Vải mộc Single Jersey 4C không lỗi đường dệt, không đốm dầu</text>
  <text x="80" y="275" font-family="Arial, sans-serif" font-size="12" fill="%23475569">✓ Đủ 49 cây, tổng cân 970 kg, hao hụt dệt thực tế 3%</text>
  <circle cx="580" cy="400" r="45" fill="none" stroke="%23dc2626" stroke-width="2" opacity="0.85"/>
  <text x="580" y="395" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="%23dc2626" text-anchor="middle">XƯỞNG NHUỘM Á CHÂU</text>
  <text x="580" y="412" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23dc2626" text-anchor="middle">ĐÃ NHẬN 970KG</text>
</svg>`;

// Ảnh mẫu Biên bản giao kho vải TP
const ANH_CHUNG_TU_MAU_GIAO_KHO_TP = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900">
  <rect width="800" height="900" fill="%23ffffff" stroke="%23cbd5e1" stroke-width="2"/>
  <text x="60" y="70" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="%23065f46">POLOMIMIN - BIÊN BẢN BÀN GIAO VẢI THÀNH PHẨM NHẬP KHO</text>
  <line x1="60" y1="85" x2="740" y2="85" stroke="%23059669" stroke-width="2"/>
  <text x="80" y="125" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%230f172a">Xưởng nhuộm Á Châu ➔ Kho Vải Thành Phẩm (Khu A - Kệ K02)</text>
  <text x="80" y="150" font-family="Arial, sans-serif" font-size="12" fill="%23334155">Đen Tiêu Chuẩn: 500 kg (25 cây) · Trắng Sữa: 470 kg (24 cây) · Tổng: 970 kg (49 cây)</text>
  <rect x="60" y="180" width="680" height="150" fill="%23ecfdf5" stroke="%23a7f3d0" rx="8"/>
  <text x="80" y="215" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="%23047857">Đạt kiểm định chất lượng vải thành phẩm:</text>
  <text x="80" y="245" font-family="Arial, sans-serif" font-size="12" fill="%23475569">✓ Độ bền màu cấp 4-5, độ co giãn hồi phục tốt, không loang màu</text>
  <text x="80" y="275" font-family="Arial, sans-serif" font-size="12" fill="%23475569">✓ Đã dán tem mã vạch QR từng cây, xếp vào Khu A - Kệ K02</text>
  <circle cx="580" cy="400" r="45" fill="none" stroke="%23dc2626" stroke-width="2" opacity="0.85"/>
  <text x="580" y="395" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="%23dc2626" text-anchor="middle">KHO THÀNH PHẨM</text>
  <text x="580" y="412" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="%23dc2626" text-anchor="middle">ĐÃ NHẬP KHO</text>
</svg>`;

function lamTronTheo100Dong(so: number) {
  return Math.round(so / 100) * 100;
}

/**
 * Đồng bộ dữ liệu BƯỚC 6 (Nhập kho vải TP) sang module Vải thành phẩm khu mẻ nhuộm (/kho-vai-tinhmann)
 */
export function dongBoLenhVaoKhoMeNhuom(lenh: LenhSXRecord): { count: number; tongKg: number; khu: string; ke: string } {
  if (typeof window === "undefined") return { count: 0, tongKg: 0, khu: "A", ke: "K02" };
  try {
    const rawLots = localStorage.getItem("mimin_kho_vai_me_nhuom");
    let currentLots: FabricDyeLot[] = rawLots ? JSON.parse(rawLots) : [];
    if (!Array.isArray(currentLots)) currentLots = [];

    const khu = (lenh.khu || "A") as KhuMeNhuom;
    const ke = lenh.ke || (khu === "A" ? "K02" : "C01");
    const trangThaiTheoKhuMap: Record<string, TrangThaiMeNhuom> = {
      A: "DANG_SU_DUNG",
      B: "ME_KE_TIEP",
      C: "CHO_KIEM",
      D: "GIU_RIENG",
      E: "CHO_TRA",
    };
    const trangThai: TrangThaiMeNhuom = trangThaiTheoKhuMap[khu] || (khu === "A" ? "DANG_SU_DUNG" : "CHO_KIEM");
    const now = new Date().toISOString();
    let daCapNhat = false;
    let tongKg = 0;
    let count = 0;

    const danhSachMau = lenh.danhSachMau || [];
    for (let idx = 0; idx < danhSachMau.length; idx++) {
      const m = danhSachMau[idx];
      const soKg = Number(m.soKg) || 0;
      if (soKg <= 0) continue;
      const soCay = Number(m.soCay) || Math.max(1, Math.ceil(soKg / 20));
      const giaVon = Math.round(
        Number(m.giaVonDuKien) ||
        Number(lenh.giaVonTheoMau?.[idx]?.giaVonMoiKgCoVAT) ||
        Number(lenh.giaVonTheoMau?.[idx]?.giaVonMoiKg) ||
        Number(m.donGiaNhuom) ||
        140000
      );
      const maMe = `${lenh.maMeNhuom || lenh.id}-${m.maVai || idx + 1}`;
      const sku = m.maVai || `VAI-TP-${idx + 1}`;

      const existingIndex = currentLots.findIndex(
        (lot) => lot.maMe === maMe || (lot.sku === sku && lot.mauSac === m.mau && lot.ghiChu?.includes(lenh.id))
      );

      if (existingIndex >= 0) {
        currentLots[existingIndex] = {
          ...currentLots[existingIndex],
          soKgNhap: soKg,
          tonKg: soKg,
          soCay,
          khu,
          ke,
          trangThai,
          donGia: giaVon,
          mauSac: m.mau,
          sku,
          xuongNhuom: lenh.tenXuongNhuom || currentLots[existingIndex].xuongNhuom || "Xưởng nhuộm Á Châu",
          ghiChu: `Đồng bộ từ Lệnh SX ${lenh.id} - Kệ ${ke} (Bước 6: Nhập kho vải TP)`,
          updatedAt: now,
        };
        daCapNhat = true;
      } else {
        const newLot: FabricDyeLot = {
          id: `lot-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          maMe,
          sku,
          mauSac: m.mau,
          ngayNhap: lenh.ngayTao ? new Date(lenh.ngayTao).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          xuongNhuom: lenh.tenXuongNhuom || "Xưởng nhuộm Á Châu",
          donGia: giaVon,
          soKgNhap: soKg,
          tonKg: soKg,
          soCay,
          khu,
          ke,
          tang: "",
          o: "",
          trangThai,
          ghiChu: `Đồng bộ từ Lệnh SX ${lenh.id} - Kệ ${ke} (Bước 6: Nhập kho vải TP)`,
          createdAt: now,
          updatedAt: now,
        };
        currentLots.unshift(newLot);
        daCapNhat = true;
      }
      tongKg += soKg;
      count++;
    }

    if (daCapNhat) {
      localStorage.setItem("mimin_kho_vai_me_nhuom", JSON.stringify(currentLots));
      window.dispatchEvent(new CustomEvent(FABRIC_DYE_LOTS_CHANGED_EVENT));
    }
    return { count, tongKg, khu, ke };
  } catch (err) {
    console.error("Lỗi đồng bộ mẻ nhuộm:", err);
    return { count: 0, tongKg: 0, khu: "A", ke: "K02" };
  }
}

export interface LenhSXRecord {
  id: string;
  ngayTao: string;
  trangThai: "Hoàn thành" | "Đang sản xuất" | "Chờ xử lý";
  nhapKhoNgay?: boolean;
  maLenhDet: string;
  maMeNhuom: string;
  
  // 1. Sợi
  nccId?: string;
  tenNccSoi: string;
  danhSachSoi: {
    id?: string;
    loaiSoi: string;
    maLoSoi: string;
    soKg: number;
    donGia: number;
    vat?: number;
    thanhTien?: number;
  }[];
  tongKgSoi: number;
  chiSoi?: number;
  vatSoi?: number;
  chiSoiCoVAT?: number;

  // 2. Dệt
  xuongDetId?: string;
  tenXuongDet: string;
  thongSoDet?: {
    loaiVaiDet?: string;
    khoVai?: number;
    trongLuongGSM?: number;
    haoHutDet?: number;
  };
  donGiaDet: number;
  vatDet?: number;
  chiDet?: number;
  chiDetCoVAT?: number;
  anhChungTuGiaoDet?: any[];

  // 3. Mộc
  tongKgMoc?: number;
  soCayMoc?: number;
  haoHutDetThucTe?: number;

  // 4. Nhuộm
  xuongNhuomId?: string;
  tenXuongNhuom: string;
  anhChungTuGiaoNhuom?: any[];
  chiNhuom?: number;
  vatNhuom?: number;
  chiNhuomCoVAT?: number;

  // 5. Màu
  danhSachMau: {
    maVai: string;
    mau: string;
    soKg: number;
    soCay?: number;
    donGiaNhuom: number;
    chiPhiHoaChat?: number;
    vat?: number;
    giaVonDuKien?: number;
  }[];
  tongKgMau?: number;

  // 6. Kho TP
  kho?: string;
  khu?: string;
  ke?: string;
  tongKgVaiTP?: number;
  tongCayVaiTP?: number;
  anhChungTuGiaoKhoTP?: any[];

  // 7. Tổng kết giá vốn & chi phí
  giaVonTheoMau?: any[];
  tongCong: number;
}

interface Props {
  onTaoLenhMoi?: () => void;
  selectedLenhId?: string;
}

export function DanhSachLenhTong({ onTaoLenhMoi, selectedLenhId }: Props) {
  const [danhSach, setDanhSach] = useState<LenhSXRecord[]>([]);
  const [selectedLenh, setSelectedLenh] = useState<LenhSXRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | "Hoàn thành" | "Đang sản xuất">("all");
  
  // In ấn
  const [inPhieuTong, setInPhieuTong] = useState<LenhSXRecord | null>(null);
  const [inPhieuNhapSoi, setInPhieuNhapSoi] = useState<LenhSXRecord | null>(null);
  const [inPhieuGiaoDet, setInPhieuGiaoDet] = useState<LenhSXRecord | null>(null);

  // Lightbox ảnh chứng từ
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Load danh sách lệnh
  const loadDanhSach = () => {
    try {
      const data = localStorage.getItem("mimin_lenh_tong_list");
      if (data) {
        let parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Tự động kiểm tra và bổ sung ảnh chứng từ mẫu cho lệnh LSX-20261015-001 nếu đang bị rỗng
          let coThayDoi = false;
          parsed = parsed.map((item: LenhSXRecord) => {
            if (item.id === "LSX-20261015-001") {
              const capNhat = { ...item };
              if (!capNhat.khu) {
                capNhat.khu = "A";
                coThayDoi = true;
              }
              if (!capNhat.ke) {
                capNhat.ke = "K02";
                coThayDoi = true;
              }
              if (!capNhat.tongKgVaiTP) {
                capNhat.tongKgVaiTP = 970;
                coThayDoi = true;
              }
              if (!capNhat.tongCayVaiTP) {
                capNhat.tongCayVaiTP = 49;
                coThayDoi = true;
              }
              // Chuẩn hóa chiSoiPhanBo & chiDetPhanBo để triệt tiêu lỗi NaNđ
              if (capNhat.giaVonTheoMau && capNhat.giaVonTheoMau.length > 0) {
                capNhat.giaVonTheoMau = capNhat.giaVonTheoMau.map((g: any, gIdx: number) => ({
                  ...g,
                  chiSoiPhanBo: g.chiSoiPhanBo ?? g.tienSoiPhanBo ?? (gIdx === 0 ? 43814433 : 41185567),
                  chiDetPhanBo: g.chiDetPhanBo ?? g.tienDetPhanBo ?? (gIdx === 0 ? 7216495 : 6783505),
                }));
                coThayDoi = true;
              }
              if (!capNhat.anhChungTuGiaoDet || capNhat.anhChungTuGiaoDet.length === 0) {
                capNhat.anhChungTuGiaoDet = [
                  {
                    id: "img-mau-det-1",
                    name: "Bien_Ban_Giao_Soi_XDet_HungPhat.svg",
                    dataUrl: ANH_CHUNG_TU_MAU_GIAO_DET,
                  },
                ];
                coThayDoi = true;
              }
              if (!capNhat.anhChungTuGiaoNhuom || capNhat.anhChungTuGiaoNhuom.length === 0) {
                capNhat.anhChungTuGiaoNhuom = [
                  {
                    id: "img-mau-nhuom-1",
                    name: "Bien_Ban_Giao_Moc_XNhuom_AChau.svg",
                    dataUrl: ANH_CHUNG_TU_MAU_GIAO_NHUOM,
                  },
                ];
                coThayDoi = true;
              }
              if (!capNhat.anhChungTuGiaoKhoTP || capNhat.anhChungTuGiaoKhoTP.length === 0) {
                capNhat.anhChungTuGiaoKhoTP = [
                  {
                    id: "img-mau-tp-1",
                    name: "Bien_Ban_Giao_Kho_TP_KhuA.svg",
                    dataUrl: ANH_CHUNG_TU_MAU_GIAO_KHO_TP,
                  },
                ];
                coThayDoi = true;
              }
              // Tự động đồng bộ mẻ nhuộm của lệnh này sang Kho vải mẻ nhuộm
              dongBoLenhVaoKhoMeNhuom(capNhat);
              return capNhat;
            } else if (item.danhSachMau && item.danhSachMau.length > 0) {
              dongBoLenhVaoKhoMeNhuom(item);
            }
            return item;
          });

          if (coThayDoi) {
            localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(parsed));
          }

          setDanhSach(parsed);
          if (selectedLenhId) {
            const found = parsed.find((x: LenhSXRecord) => x.id === selectedLenhId);
            if (found) setSelectedLenh(found);
          }
          return;
        }
      }

      // Khởi tạo 1 lệnh sản xuất mẫu hoàn chỉnh kèm ảnh chứng từ sắc nét để anh Cường xem ngay
      const mauMauRecord: LenhSXRecord = {
        id: "LSX-20261015-001",
        ngayTao: new Date().toISOString(),
        trangThai: "Hoàn thành",
        nhapKhoNgay: true,
        maLenhDet: "LD-20261015-01",
        maMeNhuom: "MN-20261015-01",
        // 1. Sợi
        tenNccSoi: "Công ty Sợi Phú Bài",
        danhSachSoi: [
          {
            id: "s1",
            loaiSoi: "Cotton 100% 30s/1 Compact",
            maLoSoi: "LSOI-PB-882",
            soKg: 1000,
            donGia: 85000,
            vat: 8,
            thanhTien: 85000000,
          },
        ],
        tongKgSoi: 1000,
        chiSoi: 85000000,
        vatSoi: 8,
        chiSoiCoVAT: 91800000,
        // 2. Dệt
        tenXuongDet: "Xưởng dệt Hưng Phát",
        thongSoDet: {
          loaiVaiDet: "Single Jersey Cotton Spandex 4C",
          khoVai: 185,
          trongLuongGSM: 195,
          haoHutDet: 3,
        },
        donGiaDet: 14000,
        vatDet: 8,
        chiDet: 14000000,
        chiDetCoVAT: 15120000,
        anhChungTuGiaoDet: [
          {
            id: "img-mau-det-1",
            name: "Bien_Ban_Giao_Soi_XDet_HungPhat.svg",
            dataUrl: ANH_CHUNG_TU_MAU_GIAO_DET,
          },
        ],
        // 3. Mộc
        tongKgMoc: 970,
        soCayMoc: 49,
        haoHutDetThucTe: 3,
        // 4. Nhuộm
        tenXuongNhuom: "Xưởng nhuộm Á Châu",
        anhChungTuGiaoNhuom: [
          {
            id: "img-mau-nhuom-1",
            name: "Bien_Ban_Giao_Moc_XNhuom_AChau.svg",
            dataUrl: ANH_CHUNG_TU_MAU_GIAO_NHUOM,
          },
        ],
        chiNhuom: 24250000,
        vatNhuom: 8,
        chiNhuomCoVAT: 26190000,
        // 5. Màu
        danhSachMau: [
          {
            maVai: "VAI-COTTON-DEN",
            mau: "Đen Tiêu Chuẩn (Black 19-4008)",
            soKg: 500,
            soCay: 25,
            donGiaNhuom: 26000,
            chiPhiHoaChat: 1500000,
            giaVon: 132400,
          },
          {
            maVai: "VAI-COTTON-TRANG",
            mau: "Trắng Sữa (Off White 11-0601)",
            soKg: 470,
            soCay: 24,
            donGiaNhuom: 24000,
            chiPhiHoaChat: 1000000,
            giaVon: 129800,
          },
        ],
        tongKgMau: 970,
        // 6. Kho TP
        kho: "Kho Vải TP",
        khu: "A",
        ke: "K02",
        tongKgVaiTP: 970,
        tongCayVaiTP: 49,
        anhChungTuGiaoKhoTP: [
          {
            id: "img-mau-tp-1",
            name: "Bien_Ban_Giao_Kho_TP_KhuA.svg",
            dataUrl: ANH_CHUNG_TU_MAU_GIAO_KHO_TP,
          },
        ],
        // 7. Giá vốn & Tổng chi phí
        giaVonTheoMau: [
          {
            maVai: "VAI-COTTON-DEN",
            mau: "Đen Tiêu Chuẩn (Black 19-4008)",
            soKg: 500,
            donGiaNhuom: 26000,
            chiPhiHoaChat: 1500000,
            tienNhuom: 13000000,
            tienSoiPhanBo: 43814433,
            chiSoiPhanBo: 43814433,
            tienDetPhanBo: 7216495,
            chiDetPhanBo: 7216495,
            vatSoiPhanBo: 3505155,
            vatDetPhanBo: 577320,
            vatNhuomPhanBo: 1160000,
            tongVATMau: 5242474,
            tongGiaVonChuaVAT: 65530928,
            tongGiaVonCoVAT: 70773402,
            giaVonMoiKg: 131062,
            giaVonMoiKgCoVAT: 141547,
          },
          {
            maVai: "VAI-COTTON-TRANG",
            mau: "Trắng Sữa (Off White 11-0601)",
            soKg: 470,
            donGiaNhuom: 24000,
            chiPhiHoaChat: 1000000,
            tienNhuom: 11280000,
            tienSoiPhanBo: 41185567,
            chiSoiPhanBo: 41185567,
            tienDetPhanBo: 6783505,
            chiDetPhanBo: 6783505,
            vatSoiPhanBo: 3294845,
            vatDetPhanBo: 542680,
            vatNhuomPhanBo: 982400,
            tongVATMau: 4819925,
            tongGiaVonChuaVAT: 60249072,
            tongGiaVonCoVAT: 65068997,
            giaVonMoiKg: 128189,
            giaVonMoiKgCoVAT: 138445,
          },
        ],
        tongCong: 133110000,
      };

      setDanhSach([mauMauRecord]);
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify([mauMauRecord]));
      dongBoLenhVaoKhoMeNhuom(mauMauRecord);
      if (selectedLenhId === mauMauRecord.id) {
        setSelectedLenh(mauMauRecord);
      }
    } catch (e) {
      console.error("Lỗi đọc mimin_lenh_tong_list:", e);
    }
  };

  // Thêm ảnh chứng từ trực tiếp vào lệnh
  const handleThemAnhChungTu = (
    lenhId: string,
    khau: "giaoDet" | "giaoNhuom" | "giaoKhoTP",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const propName =
      khau === "giaoDet"
        ? "anhChungTuGiaoDet"
        : khau === "giaoNhuom"
        ? "anhChungTuGiaoNhuom"
        : "anhChungTuGiaoKhoTP";

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (!dataUrl) return;
        const newImg = {
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl,
          type: file.type,
          size: file.size,
        };
        setDanhSach((prev) => {
          const next = prev.map((item) => {
            if (item.id === lenhId) {
              const cur = (item as any)[propName] || [];
              return { ...item, [propName]: [...cur, newImg] };
            }
            return item;
          });
          localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(next));
          return next;
        });
        setSelectedLenh((prev) => {
          if (!prev || prev.id !== lenhId) return prev;
          const cur = (prev as any)[propName] || [];
          return { ...prev, [propName]: [...cur, newImg] };
        });
        toast.success(`Đã thêm ảnh chứng từ "${file.name}"`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Xóa ảnh chứng từ khỏi lệnh
  const handleXoaAnhChungTu = (
    lenhId: string,
    khau: "giaoDet" | "giaoNhuom" | "giaoKhoTP",
    index: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const propName =
      khau === "giaoDet"
        ? "anhChungTuGiaoDet"
        : khau === "giaoNhuom"
        ? "anhChungTuGiaoNhuom"
        : "anhChungTuGiaoKhoTP";

    setDanhSach((prev) => {
      const next = prev.map((item) => {
        if (item.id === lenhId) {
          const cur = [...((item as any)[propName] || [])];
          cur.splice(index, 1);
          return { ...item, [propName]: cur };
        }
        return item;
      });
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(next));
      return next;
    });

    setSelectedLenh((prev) => {
      if (!prev || prev.id !== lenhId) return prev;
      const cur = [...((prev as any)[propName] || [])];
      cur.splice(index, 1);
      return { ...prev, [propName]: cur };
    });
    toast.success("Đã xóa ảnh chứng từ");
  };

  useEffect(() => {
    loadDanhSach();
    window.addEventListener("storage", loadDanhSach);
    return () => window.removeEventListener("storage", loadDanhSach);
  }, [selectedLenhId]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa lệnh sản xuất "${id}" khỏi danh sách hiển thị? (Không xóa dữ liệu tồn kho đã nhập)`)) {
      const newList = danhSach.filter((x) => x.id !== id);
      setDanhSach(newList);
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(newList));
      if (selectedLenh?.id === id) setSelectedLenh(null);
    }
  };

  const filtered = useMemo(() => {
    return danhSach.filter((l) => {
      const matchSearch =
        search === "" ||
        [l.id, l.tenNccSoi, l.tenXuongDet, l.tenXuongNhuom, l.maLenhDet, l.maMeNhuom]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        filterTrangThai === "all" ||
        (filterTrangThai === "Hoàn thành" && l.trangThai === "Hoàn thành") ||
        (filterTrangThai === "Đang sản xuất" && l.trangThai !== "Hoàn thành");

      return matchSearch && matchStatus;
    });
  }, [danhSach, search, filterTrangThai]);

  const handleOpenLightbox = (images: any[], startIndex = 0) => {
    const urls = images.map((img) => img.dataUrl || img.url || img).filter(Boolean);
    if (urls.length > 0) {
      setLightboxImages(urls);
      setLightboxIndex(startIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR TÌM KIẾM & BỘ LỌC */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã lệnh, xưởng dệt, nhuộm..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-semibold focus:border-orange-500 focus:bg-white focus:outline-none transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterTrangThai("all")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "all" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Tất cả ({danhSach.length})
            </button>
            <button
              onClick={() => setFilterTrangThai("Hoàn thành")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "Hoàn thành" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hoàn thành ({danhSach.filter((x) => x.trangThai === "Hoàn thành").length})
            </button>
            <button
              onClick={() => setFilterTrangThai("Đang sản xuất")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "Đang sản xuất" ? "bg-white text-amber-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Đang chạy ({danhSach.filter((x) => x.trangThai !== "Hoàn thành").length})
            </button>
          </div>
        </div>

        {onTaoLenhMoi && (
          <button
            onClick={onTaoLenhMoi}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:brightness-105 transition"
          >
            <Sparkles className="h-4 w-4" /> Tạo lệnh SX mới
          </button>
        )}
      </div>

      {/* DANH SÁCH CÁC LỆNH SX */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-slate-500">
          <LayoutList className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-700">Chưa có lệnh sản xuất nào trong danh sách</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Khi anh bấm "LƯU & TẠO LỆNH" ở tab Tạo lệnh, toàn bộ quy trình các bước sẽ được lưu và hiển thị chi tiết tại đây.
          </p>
          {onTaoLenhMoi && (
            <button
              onClick={onTaoLenhMoi}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 transition"
            >
              <Sparkles className="h-4 w-4" /> Bắt đầu tạo lệnh ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((lenh) => {
            const isCompleted = lenh.trangThai === "Hoàn thành";
            const tongKgMau = lenh.danhSachMau?.reduce((s, m) => s + (m.soKg || 0), 0) || 0;

            return (
              <div
                key={lenh.id}
                onClick={() => setSelectedLenh(lenh)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
              >
                {/* Header lệnh */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
                      <LayoutList className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-slate-900 group-hover:text-orange-600 transition">
                          {lenh.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
                          {isCompleted ? "Đã nhập kho TP" : "Đang sản xuất"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <DateDisplay value={lenh.ngayTao} format="dd/MM/yyyy HH:mm" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Tổng chi phí</div>
                      <div className="text-base sm:text-lg font-black text-amber-600">
                        {lenh.tongCong?.toLocaleString()}đ
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(lenh.id, e)}
                      title="Xóa lệnh này"
                      className="ml-2 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* STEPPER TIẾN TRÌNH 6 KHÂU QUY TRÌNH */}
                <div className="my-3 py-2 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Quy trình các bước thực tế:</span>
                    <span className="text-orange-600 font-semibold lowercase">Click để xem chi tiết từng bước & chứng từ ➔</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {/* Bước 1: Sợi */}
                    <div className="bg-white p-2 rounded-lg border border-blue-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 text-[11px] mb-1">
                        <Package className="h-3.5 w-3.5 text-blue-600" /> 1. Kho Sợi
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenNccSoi}</div>
                      <div className="text-blue-600 font-bold">{lenh.tongKgSoi?.toLocaleString()} kg</div>
                    </div>

                    {/* Bước 2: Dệt */}
                    <div className="bg-white p-2 rounded-lg border border-violet-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-violet-700 text-[11px] mb-1">
                        <Truck className="h-3.5 w-3.5 text-violet-600" /> 2. Xưởng Dệt
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenXuongDet}</div>
                      <div className="text-violet-600 font-bold">Lệnh: {lenh.maLenhDet}</div>
                    </div>

                    {/* Bước 3: Mộc */}
                    <div className="bg-white p-2 rounded-lg border border-purple-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-purple-700 text-[11px] mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> 3. NT Mộc
                      </div>
                      <div className="font-semibold text-slate-800">Đạt chuẩn</div>
                      <div className="text-purple-600 font-bold">~{lenh.tongKgMoc || lenh.tongKgSoi} kg</div>
                    </div>

                    {/* Bước 4: Nhuộm */}
                    <div className="bg-white p-2 rounded-lg border border-rose-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 text-[11px] mb-1">
                        <Palette className="h-3.5 w-3.5 text-rose-600" /> 4. Xưởng Nhuộm
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenXuongNhuom}</div>
                      <div className="text-rose-600 font-bold">Mẻ: {lenh.maMeNhuom}</div>
                    </div>

                    {/* Bước 5: Màu */}
                    <div className="bg-white p-2 rounded-lg border border-pink-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-pink-700 text-[11px] mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-pink-600" /> 5. NT Màu
                      </div>
                      <div className="font-semibold text-slate-800">{lenh.danhSachMau?.length || 0} màu</div>
                      <div className="text-pink-600 font-bold">{tongKgMau.toLocaleString()} kg</div>
                    </div>

                    {/* Bước 6: Kho TP */}
                    <div className="bg-white p-2 rounded-lg border border-emerald-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-[11px] mb-1">
                        <Boxes className="h-3.5 w-3.5 text-emerald-600" /> 6. Kho Vải TP
                      </div>
                      <div className="font-semibold text-slate-800">Khu {lenh.khu || "C"} · Kệ {lenh.ke || "C01"}</div>
                      <div className="text-emerald-600 font-bold">{lenh.tongKgVaiTP || tongKgMau} kg</div>
                    </div>
                  </div>
                </div>

                {/* Footer card: nút thao tác */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    {lenh.anhChungTuGiaoDet?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoDet.length} ảnh giao dệt</span> : null}
                    {lenh.anhChungTuGiaoNhuom?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoNhuom.length} ảnh giao nhuộm</span> : null}
                    {lenh.anhChungTuGiaoKhoTP?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoKhoTP.length} ảnh giao kho</span> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInPhieuTong(lenh);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition"
                    >
                      <Printer className="h-3.5 w-3.5" /> In phiếu SX
                    </button>
                    <button
                      onClick={() => setSelectedLenh(lenh)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem đầy đủ các bước
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CHI TIẾT ĐẦY ĐỦ CÁC QUY TRÌNH CỦA CÁC BƯỚC */}
      {/* ============================================================ */}
      {selectedLenh && (
        <Modal onClose={() => setSelectedLenh(null)}>
          <div className="max-h-[85vh] overflow-y-auto space-y-4 p-1">
            {/* Header Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                  <LayoutList className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedLenh.id}</h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                      {selectedLenh.trangThai}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Quy trình sản xuất vải khép kín từ Sợi ➔ Dệt vải mộc ➔ Nhuộm thành phẩm ➔ Nhập kho vải TP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInPhieuTong(selectedLenh)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-black text-white shadow hover:bg-orange-700 transition"
                >
                  <Printer className="h-4 w-4" /> IN PHIẾU TỔNG HỢP
                </button>
              </div>
            </div>

            {/* BƯỚC 1: SỢI + NCC SỢI */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-3">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">1</span>
                  BƯỚC 1: KHO SỢI & NHÀ CUNG CẤP SỢI
                </div>
                <button
                  onClick={() => setInPhieuNhapSoi(selectedLenh)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" /> In phiếu nhập sợi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                <div><span className="text-slate-500">Nhà cung cấp sợi:</span> <b className="text-slate-800">{selectedLenh.tenNccSoi}</b></div>
                <div><span className="text-slate-500">Tổng khối lượng sợi:</span> <b className="text-blue-700 font-bold">{selectedLenh.tongKgSoi?.toLocaleString()} kg</b></div>
                <div><span className="text-slate-500">VAT Sợi:</span> <b>{selectedLenh.vatSoi ? `${selectedLenh.vatSoi}%` : "Chưa VAT"}</b></div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-blue-50 text-blue-900 border-b border-blue-100">
                    <tr>
                      <th className="p-2.5">Loại sợi</th>
                      <th className="p-2.5">Mã lô sợi</th>
                      <th className="p-2.5 text-right">Số kg</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 font-medium">
                    {selectedLenh.danhSachSoi?.map((s, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{s.loaiSoi}</td>
                        <td className="p-2.5 font-mono text-blue-600">{s.maLoSoi}</td>
                        <td className="p-2.5 text-right font-bold">{s.soKg?.toLocaleString()} kg</td>
                        <td className="p-2.5 text-right">{s.donGia?.toLocaleString()}đ</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {((s.soKg || 0) * (s.donGia || 0)).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BƯỚC 2: XƯỞNG DỆT GIA CÔNG */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
              <div className="flex items-center justify-between border-b border-violet-100 pb-2 mb-3">
                <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-black">2</span>
                  BƯỚC 2: XƯỞNG DỆT GIA CÔNG VẢI MỘC
                </div>
                <button
                  onClick={() => setInPhieuGiaoDet(selectedLenh)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" /> In phiếu giao dệt
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                <div><span className="text-slate-500">Xưởng dệt:</span> <b className="text-slate-800">{selectedLenh.tenXuongDet}</b></div>
                <div><span className="text-slate-500">Mã lệnh dệt:</span> <b className="text-violet-700 font-mono">{selectedLenh.maLenhDet}</b></div>
                <div><span className="text-slate-500">Đơn giá dệt:</span> <b>{selectedLenh.donGiaDet?.toLocaleString()}đ/kg</b></div>
                <div><span className="text-slate-500">Thuế VAT Dệt:</span> <b>{selectedLenh.vatDet || 0}%</b></div>
              </div>

              {selectedLenh.thongSoDet && (
                <div className="rounded-xl border border-violet-200 bg-white p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div><span className="text-slate-500">Loại vải dệt:</span> <b className="text-slate-800">{selectedLenh.thongSoDet.loaiVaiDet || "Vải Thun/Polo"}</b></div>
                  <div><span className="text-slate-500">Khổ vải:</span> <b>{selectedLenh.thongSoDet.khoVai || 180} cm</b></div>
                  <div><span className="text-slate-500">Trọng lượng GSM:</span> <b>{selectedLenh.thongSoDet.trongLuongGSM || 220} g/m²</b></div>
                  <div><span className="text-slate-500">Hao hụt dệt định mức:</span> <b className="text-rose-600">{selectedLenh.thongSoDet.haoHutDet || 3}%</b></div>
                </div>
              )}

              {/* Ảnh chứng từ giao dệt */}
              <div className="mt-3 pt-3 border-t border-violet-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-violet-700" />
                    <span>Ảnh biên bản / Chứng từ giao sợi cho xưởng dệt</span>
                    <span className="bg-violet-200/90 text-violet-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {selectedLenh.anhChungTuGiaoDet?.length || 0} ảnh
                    </span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition shadow-xs">
                    <Plus className="h-3 w-3" /> Tải thêm ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoDet", e)}
                    />
                  </label>
                </div>

                {selectedLenh.anhChungTuGiaoDet && selectedLenh.anhChungTuGiaoDet.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {selectedLenh.anhChungTuGiaoDet.map((img, i) => (
                      <div
                        key={img.id || i}
                        className="group/img relative h-24 w-24 sm:h-28 sm:w-28 rounded-xl border-2 border-violet-300 overflow-hidden bg-white shadow-xs cursor-pointer hover:border-violet-600 transition"
                        onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoDet!, i)}
                        title="Bấm để xem phóng to chi tiết biên bản"
                      >
                        <img
                          src={img.dataUrl || img.url || img}
                          alt={img.name || "Chứng từ giao dệt"}
                          className="h-full w-full object-cover transition group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white">
                          <ZoomIn className="h-5 w-5 text-white" />
                          <span className="text-[10px] font-bold">Phóng to</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleXoaAnhChungTu(selectedLenh.id, "giaoDet", i, e)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover/img:opacity-100 transition hover:bg-rose-700 shadow-md z-10"
                          title="Xóa ảnh này"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-violet-300 hover:border-violet-500 bg-white/60 hover:bg-violet-50/50 transition text-center">
                    <Camera className="h-6 w-6 text-violet-500 mb-1" />
                    <span className="text-xs font-bold text-violet-900">Chưa có ảnh chứng từ giao sợi cho xưởng dệt</span>
                    <span className="text-[11px] text-violet-600 mt-0.5">Bấm vào đây để tải ảnh chụp biên bản hoặc phiếu giao nhận</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoDet", e)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* BƯỚC 3 & 4: MỘC & XƯỞNG NHUỘM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bước 3: Nghiệm thu mộc */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-purple-900 text-sm border-b border-purple-100 pb-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">3</span>
                  BƯỚC 3: NGHIỆM THU VẢI MỘC
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khối lượng mộc nhận:</span>
                    <b className="text-purple-700 font-bold">{selectedLenh.tongKgMoc || selectedLenh.tongKgSoi} kg</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đánh giá chất lượng:</span>
                    <b className="text-emerald-700">Đạt tiêu chuẩn dệt</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hao hụt dệt thực tế:</span>
                    <b className="text-slate-700">{selectedLenh.haoHutDetThucTe || selectedLenh.thongSoDet?.haoHutDet || 3}%</b>
                  </div>
                </div>
              </div>

              {/* Bước 4: Xưởng Nhuộm */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-sm border-b border-rose-100 pb-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-black">4</span>
                  BƯỚC 4: XƯỞNG NHUỘM GIA CÔNG
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Xưởng nhuộm:</span>
                    <b className="text-slate-800">{selectedLenh.tenXuongNhuom}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã mẻ nhuộm:</span>
                    <b className="text-rose-700 font-mono">{selectedLenh.maMeNhuom}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã lô mộc chuyển:</span>
                    <b className="font-mono text-slate-700">LM-{selectedLenh.maLenhDet}</b>
                  </div>
                </div>

                {/* Ảnh chứng từ giao nhuộm */}
                <div className="mt-3 pt-2.5 border-t border-rose-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5 text-rose-600" />
                      <span>Chứng từ giao mộc sang nhuộm ({selectedLenh.anhChungTuGiaoNhuom?.length || 0} ảnh)</span>
                    </div>
                    <label className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold transition shadow-2xs">
                      <Plus className="h-2.5 w-2.5" /> Thêm ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoNhuom", e)}
                      />
                    </label>
                  </div>

                  {selectedLenh.anhChungTuGiaoNhuom && selectedLenh.anhChungTuGiaoNhuom.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedLenh.anhChungTuGiaoNhuom.map((img, i) => (
                        <div
                          key={img.id || i}
                          className="group/img relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg border border-rose-300 overflow-hidden bg-white shadow-2xs cursor-pointer hover:border-rose-600 transition"
                          onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoNhuom!, i)}
                          title="Bấm để xem phóng to biên bản giao mộc"
                        >
                          <img
                            src={img.dataUrl || img.url || img}
                            alt="Chứng từ giao nhuộm"
                            className="h-full w-full object-cover transition group-hover/img:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                            <ZoomIn className="h-4 w-4" />
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleXoaAnhChungTu(selectedLenh.id, "giaoNhuom", i, e)}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-rose-600 text-white opacity-0 group-hover/img:opacity-100 transition hover:bg-rose-700 shadow"
                            title="Xóa ảnh"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center p-2.5 rounded-lg border border-dashed border-rose-300 hover:border-rose-500 bg-white/70 text-center text-[11px] text-rose-700 font-medium">
                      <span>Bấm để tải ảnh biên bản bàn giao mộc</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoNhuom", e)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* BƯỚC 5: NGHIỆM THU MÀU NHUỘM */}
            <div className="rounded-2xl border border-pink-200 bg-pink-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-pink-900 text-sm border-b border-pink-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white text-xs font-black">5</span>
                BƯỚC 5: PHÂN BỔ MÀU NHUỘM & NGHIỆM THU MÀU
              </div>

              <div className="overflow-x-auto rounded-xl border border-pink-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-pink-50 text-pink-900 border-b border-pink-100">
                    <tr>
                      <th className="p-2.5">Mã vải</th>
                      <th className="p-2.5">Tên màu</th>
                      <th className="p-2.5 text-right">Số kg</th>
                      <th className="p-2.5 text-right">Số cây</th>
                      <th className="p-2.5 text-right">Đơn giá nhuộm</th>
                      <th className="p-2.5 text-right">Chi phí nhuộm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 font-medium">
                    {selectedLenh.danhSachMau?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{m.maVai}</td>
                        <td className="p-2.5 font-bold text-pink-700">{m.mau}</td>
                        <td className="p-2.5 text-right font-bold">{m.soKg?.toLocaleString()} kg</td>
                        <td className="p-2.5 text-right">{m.soCay || Math.ceil(m.soKg / 20)} cây</td>
                        <td className="p-2.5 text-right">{m.donGiaNhuom?.toLocaleString()}đ/kg</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {((m.soKg || 0) * (m.donGiaNhuom || 0)).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BƯỚC 6: NHẬP KHO VẢI THÀNH PHẨM */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm border-b border-emerald-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">6</span>
                BƯỚC 6: NHẬP KHO VẢI THÀNH PHẨM
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Vị trí lưu kho</div>
                  <div className="font-bold text-slate-900 text-sm">Khu {selectedLenh.khu || "C"} · Kệ {selectedLenh.ke || "C01"}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Tổng kg nhập kho</div>
                  <div className="font-bold text-emerald-600 text-sm">{selectedLenh.tongKgVaiTP || selectedLenh.tongKgMau} kg</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Tổng số cây vải</div>
                  <div className="font-bold text-emerald-600 text-sm">{selectedLenh.tongCayVaiTP || "Nhiều"} cây</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Sẵn sàng cắt may</div>
                  <div className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Tổ Cắt lấy được ngay
                  </div>
                </div>
              </div>

              {/* Thông tin chuyển sang module Vải thành phẩm khu mẻ nhuộm */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-white p-3 shadow-2xs mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold shrink-0">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex flex-wrap items-center gap-1.5">
                      <span>✓ Đã chuyển sang module Vải thành phẩm khu mẻ nhuộm</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">
                        Khu {selectedLenh.khu || "A"} · Kệ {selectedLenh.ke || "K02"}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Tổng số kg: <b className="text-emerald-700 font-bold">{(selectedLenh.tongKgVaiTP || selectedLenh.tongKgMau)?.toLocaleString()} kg</b> · <b className="text-emerald-700 font-bold">{selectedLenh.tongCayVaiTP || selectedLenh.danhSachMau?.reduce((s, m) => s + (m.soCay || Math.ceil(m.soKg / 20)), 0)} cây</b> ({selectedLenh.danhSachMau?.length || 0} màu mẻ) · Trạng thái: {selectedLenh.khu === "A" ? "Mẻ đang sử dụng (Tổ Cắt lấy ngay)" : "Chờ kiểm"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const res = dongBoLenhVaoKhoMeNhuom(selectedLenh);
                      toast.success(`Đã đồng bộ lại ${res.count} mẻ (${res.tongKg}kg) sang Khu ${res.khu} - Kệ ${res.ke} tại Kho vải mẻ nhuộm!`);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                    title="Bấm để cập nhật lại dữ liệu sang Kho vải mẻ nhuộm"
                  >
                    <span>↻ Đồng bộ lại</span>
                  </button>
                  <a
                    href="/kho-vai-tinhmann?tab=menhuom"
                    className="inline-flex items-center gap-1 rounded-lg bg-teal-600 hover:bg-teal-700 px-3 py-1.5 text-xs font-bold text-white transition shadow-xs"
                    title="Mở module Vải thành phẩm khu mẻ nhuộm"
                  >
                    <span>Xem tại Kho Mẻ Nhuộm</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Ảnh chứng từ giao kho vải TP */}
              <div className="mt-3 pt-2.5 border-t border-emerald-200">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Biên bản / Chứng từ nhuộm giao kho vải TP ({selectedLenh.anhChungTuGiaoKhoTP?.length || 0} ảnh)</span>
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs">
                    <Plus className="h-3 w-3" /> Tải thêm ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoKhoTP", e)}
                    />
                  </label>
                </div>

                {selectedLenh.anhChungTuGiaoKhoTP && selectedLenh.anhChungTuGiaoKhoTP.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5">
                    {selectedLenh.anhChungTuGiaoKhoTP.map((img, i) => (
                      <div
                        key={img.id || i}
                        className="group/img relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl border-2 border-emerald-300 overflow-hidden bg-white shadow-xs cursor-pointer hover:border-emerald-600 transition"
                        onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoKhoTP!, i)}
                        title="Bấm để xem phóng to biên bản nhập kho TP"
                      >
                        <img
                          src={img.dataUrl || img.url || img}
                          alt="Chứng từ giao kho TP"
                          className="h-full w-full object-cover transition group-hover/img:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                          <ZoomIn className="h-4 w-4" />
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleXoaAnhChungTu(selectedLenh.id, "giaoKhoTP", i, e)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover/img:opacity-100 transition hover:bg-rose-700 shadow"
                          title="Xóa ảnh"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/70 text-center text-xs text-emerald-800 font-semibold">
                    <span>Chưa có ảnh chứng từ nhập kho vải thành phẩm. Bấm vào đây để tải ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleThemAnhChungTu(selectedLenh.id, "giaoKhoTP", e)}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* BƯỚC 7: GIÁ VỐN & CÔNG NỢ TỔNG HỢP */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm border-b border-amber-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-black">7</span>
                BƯỚC 7: TỔNG HỢP GIÁ VỐN & CÔNG NỢ CÁC KHÂU
              </div>

              {selectedLenh.giaVonTheoMau && selectedLenh.giaVonTheoMau.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white mb-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50 text-amber-900 border-b border-amber-100">
                      <tr>
                        <th className="p-2.5">Màu vải</th>
                        <th className="p-2.5 text-right">Số kg</th>
                        <th className="p-2.5 text-right">Sợi/kg</th>
                        <th className="p-2.5 text-right">Dệt/kg</th>
                        <th className="p-2.5 text-right">Nhuộm/kg</th>
                        <th className="p-2.5 text-right font-black text-amber-800">Giá vốn TP / kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50 font-medium">
                      {selectedLenh.giaVonTheoMau.map((g, idx) => {
                        const soKg = Number(g.soKg) || 1;
                        const tienSoi = Number(g.chiSoiPhanBo ?? g.tienSoiPhanBo ?? 0);
                        const tienDet = Number(g.chiDetPhanBo ?? g.tienDetPhanBo ?? 0);
                        const tienNhuomVaHC = Number(g.tienNhuom ?? (soKg * (g.donGiaNhuom || 0))) + Number(g.chiPhiHoaChat || 0);

                        const donGiaSoi = Math.round(tienSoi / soKg);
                        const donGiaDet = Math.round(tienDet / soKg);
                        const donGiaNhuom = Math.round(tienNhuomVaHC / soKg);
                        const donGiaTP = Math.round(g.giaVonMoiKgCoVAT || g.giaVonMoiKg || (donGiaSoi + donGiaDet + donGiaNhuom));

                        return (
                          <tr key={idx}>
                            <td className="p-2.5 font-bold text-slate-900">{g.mau}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800">{g.soKg?.toLocaleString()} kg</td>
                            <td className="p-2.5 text-right font-medium text-blue-700">
                              {donGiaSoi > 0 ? `${donGiaSoi.toLocaleString()}đ` : "—"}
                            </td>
                            <td className="p-2.5 text-right font-medium text-violet-700">
                              {donGiaDet > 0 ? `${donGiaDet.toLocaleString()}đ` : "—"}
                            </td>
                            <td className="p-2.5 text-right font-medium text-rose-700">
                              {donGiaNhuom > 0 ? `${donGiaNhuom.toLocaleString()}đ` : "—"}
                            </td>
                            <td className="p-2.5 text-right font-black text-amber-700 text-sm">
                              {donGiaTP.toLocaleString()}đ/kg
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Tổng công nợ phát sinh toàn chuỗi:</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    NCC Sợi: <b>{selectedLenh.tenNccSoi}</b> · Xưởng Dệt: <b>{selectedLenh.tenXuongDet}</b> · Xưởng Nhuộm: <b>{selectedLenh.tenXuongNhuom}</b>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">TỔNG GIÁ TRỊ LỆNH</div>
                  <div className="text-xl font-black text-amber-600">{selectedLenh.tongCong?.toLocaleString()}đ</div>
                </div>
              </div>
            </div>

            {/* Nút đóng modal */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedLenh(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={() => setInPhieuTong(selectedLenh)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700 transition"
              >
                <Printer className="h-4 w-4" /> In toàn bộ phiếu SX
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL IN PHIẾU TỔNG HỢP SẢN XUẤT VẢI */}
      {/* ============================================================ */}
      {inPhieuTong && (
        <Modal onClose={() => setInPhieuTong(null)}>
          <style>{`@media print {
            body * { visibility: hidden !important; }
            #phieu-san-xuat-vai, #phieu-san-xuat-vai * { visibility: visible !important; }
            #phieu-san-xuat-vai { position: absolute; inset: 0; width: 100%; background: white; }
            .khong-in { display: none !important; }
          }`}</style>
          <div id="phieu-san-xuat-vai" className="bg-white p-6 text-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="border-b-2 border-[#307082] pb-3 text-center">
              <div className="text-sm font-bold text-[#307082]">MIMIN ERP</div>
              <h2 className="text-2xl font-black">PHIẾU SẢN XUẤT VẢI (SỢI · DỆT · NHUỘM)</h2>
              <div className="mt-1 text-xs text-slate-500">Mã lệnh: {inPhieuTong.id} · Ngày tạo: {new Date(inPhieuTong.ngayTao).toLocaleDateString("vi-VN")}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-xl">
              <div><span className="text-slate-500">Lệnh dệt:</span> <b>{inPhieuTong.maLenhDet}</b></div>
              <div><span className="text-slate-500">Mẻ nhuộm:</span> <b>{inPhieuTong.maMeNhuom}</b></div>
              <div><span className="text-slate-500">NCC sợi:</span> <b>{inPhieuTong.tenNccSoi}</b></div>
              <div><span className="text-slate-500">Xưởng dệt:</span> <b>{inPhieuTong.tenXuongDet}</b></div>
              <div><span className="text-slate-500">Xưởng nhuộm:</span> <b>{inPhieuTong.tenXuongNhuom}</b></div>
              <div><span className="text-slate-500">Vị trí kho TP:</span> <b>Khu {inPhieuTong.khu || "C"} · Kệ {inPhieuTong.ke || "C01"}</b></div>
            </div>

            <h3 className="mt-4 rounded bg-[#307082] px-3 py-2 font-bold text-white text-sm">1. DANH SÁCH SỢI – TỔNG {inPhieuTong.tongKgSoi?.toLocaleString("vi-VN")} KG</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Loại sợi</th><th className="border p-2">Mã lô</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá</th><th className="border p-2 text-right">Thành tiền</th></tr></thead>
                <tbody>{inPhieuTong.danhSachSoi?.map((item: any, idx: number) => (
                  <tr key={idx}><td className="border p-2">{item.loaiSoi}</td><td className="border p-2 text-center font-mono">{item.maLoSoi}</td><td className="border p-2 text-right">{item.soKg?.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGia?.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold">{((item.soKg || 0) * (item.donGia || 0)).toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <h3 className="mt-4 rounded bg-[#EA990C] px-3 py-2 font-bold text-white text-sm">2. DANH SÁCH MÀU NHUỘM & THÀNH PHẨM</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Mã vải</th><th className="border p-2">Màu</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá nhuộm</th><th className="border p-2 text-right">Giá vốn dự kiến</th></tr></thead>
                <tbody>{inPhieuTong.danhSachMau?.map((item: any, index: number) => (
                  <tr key={index}><td className="border p-2 font-bold">{item.maVai}</td><td className="border p-2 text-center font-semibold">{item.mau}</td><td className="border p-2 text-right">{item.soKg?.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGiaNhuom?.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold text-amber-700">{lamTronTheo100Dong(item.giaVon || 0).toLocaleString("vi-VN")}đ/kg</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between rounded-xl border-2 border-[#EA990C] bg-[#ECE7DC] p-3 text-base font-black">
              <span>TỔNG CHI PHÍ LỆNH SẢN XUẤT</span><span>{inPhieuTong.tongCong?.toLocaleString("vi-VN")}đ</span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 text-center text-xs font-bold">
              <div>Người lập phiếu<br /><span className="font-normal text-slate-400">(Ký, ghi rõ họ tên)</span></div>
              <div>Xưởng dệt / Nhuộm<br /><span className="font-normal text-slate-400">(Ký nhận bàn giao)</span></div>
              <div>Quản lý duyệt<br /><span className="font-normal text-slate-400">(Ký duyệt nhập kho)</span></div>
            </div>
          </div>

          <div className="khong-in mt-4 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={() => setInPhieuTong(null)} className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100">Đóng</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-xs font-bold text-white hover:bg-orange-700">
              <Printer className="h-4 w-4" /> In phiếu ngay
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL IN PHIẾU NHẬP SỢI */}
      {inPhieuNhapSoi && (
        <PhieuNhapSoiPrint
          ncc={{ ten_ncc: inPhieuNhapSoi.tenNccSoi }}
          danhSachSoi={inPhieuNhapSoi.danhSachSoi}
          chungTu={inPhieuNhapSoi.anhChungTuGiaoDet}
          onClose={() => setInPhieuNhapSoi(null)}
        />
      )}

      {/* MODAL IN PHIẾU GIAO DỆT */}
      {inPhieuGiaoDet && (
        <PhieuGiaoDetPrint
          xDet={{ ten_ncc: inPhieuGiaoDet.tenXuongDet }}
          danhSachSoi={inPhieuGiaoDet.danhSachSoi}
          chungTu={inPhieuGiaoDet.anhChungTuGiaoDet}
          onClose={() => setInPhieuGiaoDet(null)}
        />
      )}

      {/* LIGHTBOX PHÓNG TO HÌNH ẢNH */}
      {lightboxIndex !== null && (
        <ImageLightbox
          src={lightboxImages[lightboxIndex] || null}
          gallery={lightboxImages}
          onChange={(_newSrc, newIdx) => setLightboxIndex(newIdx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
