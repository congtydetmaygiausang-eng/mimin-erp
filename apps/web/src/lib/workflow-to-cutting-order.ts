/**
 * Helper: Convert PhieuWorkflow (data Lark thật) → CuttingOrder (UI lenh-cat)
 * Fix P0-02: thay data cũ 2024 bằng data thật 2026
 */
import { ALL_REAL_PHIEU } from "./real-workflow-data";
import type { PhieuWorkflow } from "./workflow-data";

// Type CuttingOrder phải match với lenh-cat/page.tsx
type CuttingOrder = {
  id: string;
  productCode: string;
  productName: string;
  loaiSanPham: "Áo" | "Bộ";
  productImage: string;
  productGallery?: string[];
  fabricSwatch: string;
  fabricName: string;
  totalQty: number;
  soAo?: number;
  soQuan?: number;
  deadline: string;
  factory: string;
  status: "draft" | "cutting" | "waiting_fabric" | "completed";
  sizes: { size: string; qty: number }[];
  lsxCode: string;
  giaVon?: any;
  mauSac?: { ten: string; soLuong: number; hex?: string }[];
  tepDinhKem?: any[];
};

// Mapping sản phẩm thật theo Lark
const PRODUCT_INFO: Record<string, {
  name: string;
  type: "Áo" | "Bộ";
  image: string;
  fabric: string;
  swatch: string;
  factory: string;
}> = {
  M758: { name: "BỘ TRỤ TRƠN", type: "Bộ", image: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&h=1200&fit=crop&q=80", fabric: "XANH ĐEN CM (Interlock 30s)", swatch: "#1e3a5f", factory: "Xưởng Sài Gòn + gia công ngoài" },
  M873: { name: "ÁO THUN COTTON", type: "Áo", image: "https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=1200&h=1200&fit=crop&q=80", fabric: "COTTON 4 CHIỀU", swatch: "#a89570", factory: "Xưởng Sài Gòn" },
  M111: { name: "ÁO POLO", type: "Áo", image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&h=1200&fit=crop&q=80", fabric: "COTTON POLO", swatch: "#1e3a8a", factory: "Xưởng Bình Dương" },
  M222: { name: "BỘ THỂ THAO NAM", type: "Bộ", image: "https://images.unsplash.com/photo-1593030103066-0093718efeb9?w=1200&h=1200&fit=crop&q=80", fabric: "THUN LẠNH 4 CHIỀU", swatch: "#000000", factory: "Xưởng Sài Gòn + gia công ngoài" },
  M333: { name: "ÁO SƠ MI NỮ", type: "Áo", image: "https://images.unsplash.com/photo-1485518882345-15568b007407?w=1200&h=1200&fit=crop&q=80", fabric: "COTTON SƠ MI", swatch: "#f5f1e8", factory: "Xưởng Sài Gòn" },
  M555: { name: "QUẦN KAKI NAM", type: "Áo", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&h=1200&fit=crop&q=80", fabric: "KAKI 100% COTTON", swatch: "#c4a47c", factory: "Xưởng Sài Gòn" },
};

// Tính gia vốn trung bình từ các công đoạn
function tinhGiaVon(phieus: PhieuWorkflow[]): any {
  const cat = phieus.find((p) => p.id.startsWith("CAT_"));
  const may = phieus.find((p) => p.id.startsWith("MAY_"));
  const intd = phieus.find((p) => p.id.startsWith("INTD_"));
  const kn = phieus.find((p) => p.id.startsWith("KN_"));
  const ui = phieus.find((p) => p.id.startsWith("UI_"));
  const dg = phieus.find((p) => p.id.startsWith("DG_"));

  // Giá vải: lấy từ M758 (116,500 đ/kg theo file Excel a Cường)
  const isBo = cat?.phanLoai?.toLowerCase().includes("bộ");
  return {
    vaiChinh: 116500,
    dinhMucVai: isBo ? 0.56 : 0.27,
    boCo: isBo ? 6500 : 4500,
    khoa: isBo ? 1500 : undefined,
    phuLieu: isBo ? 3500 : 2500,
    congCat: isBo ? 3500 : 2000,
    congMayAo: may?.donGia || (isBo ? 22000 : 14000),
    congMayQuan: isBo ? 18000 : undefined,
    congTheu: intd?.donGia || 4500,
    congIn: !isBo ? (intd?.donGia || 5000) : undefined,
    congUi: ui?.donGia || (isBo ? 3000 : 2000),
    haoHut: 1.5,
    ghiChu: `Tính từ ${phieus.length} phiếu workflow: Cắt ${cat?.soLuongDat || 0}/${cat?.soLuongGiao || 0}, May ${may?.soLuongDat || 0}, KN ${kn?.soLuongDat || 0}, Ủi ${ui?.soLuongDat || 0}, ĐG ${dg?.soLuongDat || 0}`,
  };
}

// Convert từ ALL_REAL_PHIEU → 6 CuttingOrder (1 cho mỗi LSX)
export function getCuttingOrdersFromRealData(): CuttingOrder[] {
  // Group phiếu theo LSX
  const lsxMap: Record<string, PhieuWorkflow[]> = {};
  for (const p of ALL_REAL_PHIEU) {
    if (!lsxMap[p.lenhSX]) lsxMap[p.lenhSX] = [];
    lsxMap[p.lenhSX].push(p);
  }

  const orders: CuttingOrder[] = [];
  for (const [lsxCode, phieus] of Object.entries(lsxMap)) {
    const first = phieus[0];
    const maSP = first.maSP;
    const productInfo = PRODUCT_INFO[maSP] || PRODUCT_INFO.M873;

    // Tổng SL từ phiếu đầu tiên (cắt)
    const catPhieu = phieus.find((p) => p.id.startsWith("CAT_")) || first;
    const totalQty = catPhieu.soLuongGiao;

    // Màu sắc (parse từ phiếu)
    const mauArr = (first.mau || '').split(/[,+]/).filter(Boolean);
    const mauSac = mauArr.length > 0
      ? mauArr.map((m) => ({
          ten: m.trim(),
          soLuong: Math.round(totalQty / mauArr.length),
          hex: "#888888",
        }))
      : [{ ten: "Mặc định", soLuong: totalQty }];

    // Size parse
    const sizeArr = (first.size || 'M').split(/[,+]/).filter(Boolean);
    const sizes = sizeArr.map((s) => ({
      size: s.trim(),
      qty: Math.round(totalQty / sizeArr.length),
    }));

    // Status
    const allDone = phieus.every((p) => p.trangThai === "Hoàn thành");
    const anyCat = phieus.some((p) => p.id.startsWith("CAT_") && p.trangThai === "Hoàn thành");
    const status: CuttingOrder["status"] = allDone ? "completed" : anyCat ? "cutting" : "draft";

    orders.push({
      id: first.lenhCat || lsxCode,
      productCode: maSP,
      productName: productInfo.name,
      loaiSanPham: productInfo.type,
      productImage: productInfo.image,
      productGallery: [productInfo.image],
      fabricSwatch: productInfo.swatch,
      fabricName: productInfo.fabric,
      totalQty,
      soAo: productInfo.type === "Bộ" ? totalQty : totalQty,
      soQuan: productInfo.type === "Bộ" ? totalQty : undefined,
      deadline: first.hanHoanThanh || "2026-08-30",
      factory: productInfo.factory,
      status,
      sizes,
      lsxCode,  // ← ĐÃ ĐỔI từ LSX-2024-* → LSX-2026-*
      mauSac,
      giaVon: tinhGiaVon(phieus),
      tepDinhKem: [],
    });
  }

  return orders.sort((a, b) => a.lsxCode.localeCompare(b.lsxCode));
}
