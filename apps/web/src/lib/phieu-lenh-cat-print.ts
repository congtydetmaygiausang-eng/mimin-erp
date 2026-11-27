// =================================================================
// MODULE IN PHIẾU LỆNH CẮT & SẢN XUẤT CHUẨN A4 - POLOMIMIN / MANPJ
// Thiết kế dựa 100% từ thông tin trên Lệnh Cắt Sản Xuất (LenhCatModal)
// Cập nhật:
//  - Ảnh / Swatch MÀU VẢI CHÍNH to rõ nổi bật (58px)
//  - Thông tin tên công ty lớn hơn, bố cục xuống dòng rõ ràng
//  - KHÔNG hiển thị cột đơn giá và chi phí trên phiếu in
//  - Vừa vặn 100% đúng 1 trang A4 không khoảng trắng thừa
// =================================================================

import { LOAI_SP_LABELS, type LenhCat, type LoaiSP, type MauVai } from "./data/lenh-cat-store";

export interface PhieuLenhCatPrintOptions {
  tenCongTy?: string;
  mst?: string;
  diaChi?: string;
  thuongHieu?: string;
  soDienThoai?: string;
  nguoiLapPhieu?: string;
}

const DEFAULT_OPTIONS: PhieuLenhCatPrintOptions = {
  tenCongTy: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
  mst: "0318507560",
  diaChi: "12/39 Xuân Thới Thượng 58C, Hóc Môn, TP.HCM",
  thuongHieu: "MANPJ - POLOMIMIN",
  soDienThoai: "0774480916",
  nguoiLapPhieu: "Hồ Minh Sang",
};

/**
 * Trả về mã màu swatch và màu chữ tương phản cho từng tên màu may mặc Việt Nam
 */
function getColorSwatch(colorName?: string): { hex: string; text: string; short: string; border: string } {
  const c = (colorName || "").toLowerCase().trim();
  if (c.includes("đen") || c.includes("black")) return { hex: "#0f172a", text: "#ffffff", short: "ĐEN", border: "#334155" };
  if (c.includes("trắng") || c.includes("white")) return { hex: "#ffffff", text: "#0f172a", short: "TRẮNG", border: "#94a3b8" };
  if (c.includes("xám nhạt") || c.includes("tiêu nhạt") || c.includes("muối tiêu nhạt")) return { hex: "#cbd5e1", text: "#0f172a", short: "XÁM", border: "#94a3b8" };
  if (c.includes("xám") || c.includes("grey") || c.includes("gray") || c.includes("tiêu")) return { hex: "#64748b", text: "#ffffff", short: "XÁM", border: "#475569" };
  if (c.includes("xanh nhớt") || c.includes("nhớt") || c.includes("rêu") || c.includes("cỏ úa")) return { hex: "#365314", text: "#ffffff", short: "RÊU", border: "#4d7c0f" };
  if (c.includes("xanh đen") || c.includes("navy")) return { hex: "#172554", text: "#ffffff", short: "NAVY", border: "#1e3a8a" };
  if (c.includes("xanh dương") || c.includes("blue") || c.includes("bích")) return { hex: "#1d4ed8", text: "#ffffff", short: "XANH", border: "#2563eb" };
  if (c.includes("xanh lá") || c.includes("green")) return { hex: "#15803d", text: "#ffffff", short: "LÁ", border: "#16a34a" };
  if (c.includes("xanh ngọc") || c.includes("ngọc") || c.includes("mint")) return { hex: "#0d9488", text: "#ffffff", short: "NGỌC", border: "#14b8a6" };
  if (c.includes("da") || c.includes("kem") || c.includes("be") || c.includes("beige") || c.includes("nude")) return { hex: "#fde68a", text: "#78350f", short: "DA", border: "#f59e0b" };
  if (c.includes("nâu") || c.includes("brown") || c.includes("cà phê") || c.includes("cafe")) return { hex: "#78350f", text: "#ffffff", short: "NÂU", border: "#92400e" };
  if (c.includes("đỏ đô") || c.includes("maroon") || c.includes("đô")) return { hex: "#881337", text: "#ffffff", short: "ĐÔ", border: "#9f1239" };
  if (c.includes("đỏ") || c.includes("red")) return { hex: "#b91c1c", text: "#ffffff", short: "ĐỎ", border: "#dc2626" };
  if (c.includes("vàng") || c.includes("yellow")) return { hex: "#eab308", text: "#713f12", short: "VÀNG", border: "#ca8a04" };
  if (c.includes("cam") || c.includes("orange")) return { hex: "#ea580c", text: "#ffffff", short: "CAM", border: "#c2410c" };
  if (c.includes("hồng") || c.includes("pink")) return { hex: "#db2777", text: "#ffffff", short: "HỒNG", border: "#be185d" };
  if (c.includes("tím") || c.includes("purple")) return { hex: "#7e22ce", text: "#ffffff", short: "TÍM", border: "#6b21a8" };
  return { hex: "#e2e8f0", text: "#1e293b", short: (colorName || "MÀU").substring(0, 4).toUpperCase(), border: "#cbd5e1" };
}

function formatPrintDate(d?: string): string {
  if (!d) return "—";
  if (d.includes("/")) return d;
  try {
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("vi-VN");
    }
  } catch {}
  return d;
}

/**
 * Sinh mã HTML hoàn chỉnh cho Phiếu Lệnh Cắt Sản Xuất trên khổ A4
 * Dựa 100% trên dữ liệu của Lệnh Cắt Sản Xuất (LenhCatModal)
 */
export function generatePhieuLenhCatA4HTML(
  lc: Partial<LenhCat> & {
    id?: string;
    maSP?: string;
    tenSP?: string;
    loaiSP?: LoaiSP;
    loaiLenh?: string;
    khachHang?: string;
    tongSL?: number | string;
    tongSLThucTe?: number | string;
    tiLeSize?: string;
    hanHoanThanh?: string;
    ngayTao?: string;
    phuTrachCat?: string;
    phuTrachSX?: string;
    ghiChuKyThuat?: string;
    ghiChu?: string;
    dsMau?: MauVai[];
    phanCong?: any[];
    daiSoDoChinh?: string;
    khoSoDoChinh?: string;
    daiSoDoPhoi?: string;
    khoSoDoPhoi?: string;
    hinhAnhDaiDien?: string;
  },
  customOptions?: PhieuLenhCatPrintOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...customOptions };

  const maLenh = lc.id || `LC-${new Date().getFullYear()}-0001`;
  const ngayBatDauText = formatPrintDate(lc.ngayTao);
  const hanHoanThanhText = formatPrintDate(lc.hanHoanThanh);

  const isBo = (lc.loaiSP || "").toLowerCase().includes("bo");
  const loaiSPText = lc.loaiSP ? (LOAI_SP_LABELS[lc.loaiSP] || lc.loaiSP) : (isBo ? "Bộ Trụ" : "Áo Polo");
  const isHangDat = lc.loaiLenh === "HangDat";
  const loaiLenhText = isHangDat ? "Hàng Đặt" : "Hàng Nhà";
  const khachHangText = isHangDat 
    ? (lc.khachHang && lc.khachHang.trim() && lc.khachHang !== "-- Chọn Khách Hàng --" ? lc.khachHang : "Khách Hàng Đặt")
    : "MANPJ / POLOMIMIN";

  const dsMau = lc.dsMau || [];
  const soMau = dsMau.length || 1;
  const tongSL = Number(lc.tongSLThucTe || lc.tongSL || 0);
  const donViTinh = isBo ? "BỘ" : "CÁI";

  // Cơ cấu màu sắc
  const slBinhQuan = soMau > 0 ? Math.round(tongSL / soMau) : tongSL;
  const coCauText = `${soMau} MÀU × ~${slBinhQuan} ${donViTinh}/MÀU`;

  // Quét tìm mã M01..M16 để lấy ảnh sản phẩm gốc có độ phân giải cao
  const scanCode = `${lc.maSP || ""} ${lc.tenSP || ""}`.toUpperCase();
  const mMatch = scanCode.match(/\bM0?([1-9]|1[0-6])\b/);
  const normalizedMCode = mMatch ? (parseInt(mMatch[1], 10) < 10 ? `M0${parseInt(mMatch[1], 10)}` : `M${parseInt(mMatch[1], 10)}`) : "";

  // Tìm ảnh sản phẩm đại diện (Ưu tiên ảnh chụp mẫu lớn từ /product-models/)
  let productImg = "";
  let pantsImg = "";
  if (normalizedMCode) {
    productImg = `/product-models/${normalizedMCode}.png`;
  }
  if (!productImg && lc.hinhAnhDaiDien && !lc.hinhAnhDaiDien.includes("Phieu_Giao_Nhan")) {
    productImg = lc.hinhAnhDaiDien;
  }
  if (!productImg && dsMau.length > 0) {
    const foundWithImg = dsMau.find(m => m.img && m.img.trim().length > 0 && !m.img.includes("Phieu_Giao_Nhan"));
    if (foundWithImg) productImg = foundWithImg.img;
    const foundWithPants = dsMau.find(m => m.imgQuan && m.imgQuan.trim().length > 0 && !m.imgQuan.includes("Phieu_Giao_Nhan"));
    if (foundWithPants) pantsImg = foundWithPants.imgQuan || "";
  }
  if (!productImg && normalizedMCode) {
    productImg = `/phieu-cat/Phieu_Giao_Nhan_${normalizedMCode}.png`;
  }
  if (!productImg && lc.hinhAnhDaiDien) {
    productImg = lc.hinhAnhDaiDien;
  }

  // Thu thập danh sách size có trong bảng phân bổ size
  const allSizesSet = new Set<string>();
  dsMau.forEach(m => {
    (m.phanBoSize || []).forEach(p => {
      if (p.size) allSizesSet.add(p.size);
    });
  });

  let sizeList = Array.from(allSizesSet);
  if (sizeList.length === 0) {
    const rawRatio = lc.tiLeSize || "1:1:1:1";
    const parts = rawRatio.split(/[:,-]/);
    if (parts.length === 4) sizeList = ["M", "L", "XL", "2XL"];
    else if (parts.length === 5) sizeList = ["M", "L", "XL", "2XL", "3XL"];
    else if (parts.length === 6) sizeList = ["S", "M", "L", "XL", "2XL", "3XL"];
    else sizeList = ["M", "L", "XL", "2XL"];
  }

  const tiLeDisplay = lc.tiLeSize ? lc.tiLeSize.replace(/:/g, " - ") : "1 - 1 - 1 - 1";
  const firstDinhMuc = dsMau[0]?.dinhMuc || (isBo ? 0.26 : 0.22);

  // Ghi chú và thông số sơ đồ cắt may (trích xuất chuẩn xác từ Lệnh Cắt)
  const ghiChuTongHop = [
    lc.ghiChu,
    lc.ghiChuKyThuat,
    lc.daiSoDoChinh ? `Sơ đồ chính: ${lc.daiSoDoChinh}${lc.khoSoDoChinh ? ` / khổ ${lc.khoSoDoChinh}` : ""}` : "",
  ].filter(Boolean).join(" | ");

  // Danh sách công đoạn phân công sản xuất lấy từ Lệnh Cắt (KHÔNG CÓ ĐƠN GIÁ THEO YÊU CẦU)
  const rawPhanCong = lc.phanCong && Array.isArray(lc.phanCong) && lc.phanCong.length > 0 ? lc.phanCong : [];
  
  const congDoanList = rawPhanCong.length > 0 ? rawPhanCong.map((p: any, idx: number) => {
    const isOutsource = p.loaiNguoi === "xuong_ngoai" || (p.nguoiMa && String(p.nguoiMa).startsWith("GC-"));
    return {
      stt: idx + 1,
      tenCongDoan: p.tenCongDoan || "Công đoạn",
      nguoiTen: p.nguoiTen || (p.nguoiMa === "XUONG_NHA" ? "Xưởng nhà" : p.nguoiMa) || "—",
      hinhThuc: isOutsource ? "Gia công ngoài" : "Nội bộ",
    };
  }) : [
    { stt: 1, tenCongDoan: "Cắt bộ", nguoiTen: lc.phuTrachCat || "Xưởng nhà", hinhThuc: "Nội bộ" },
    { stt: 2, tenCongDoan: "In/Thêu", nguoiTen: "Xưởng in/thêu", hinhThuc: "Gia công ngoài" },
    { stt: 3, tenCongDoan: isBo ? "May áo" : "May thành phẩm", nguoiTen: "Xưởng may", hinhThuc: "Gia công ngoài" },
    ...(isBo ? [{ stt: 4, tenCongDoan: "May quần", nguoiTen: "Xưởng may quần", hinhThuc: "Gia công ngoài" }] : []),
    { stt: isBo ? 5 : 4, tenCongDoan: "QC (Kiểm hàng)", nguoiTen: "Tổ QC", hinhThuc: "Nội bộ" },
    { stt: isBo ? 6 : 5, tenCongDoan: "Khuy nút", nguoiTen: "Tổ Khuy Nút", hinhThuc: "Nội bộ" },
    { stt: isBo ? 7 : 6, tenCongDoan: "Ủi", nguoiTen: "Tổ Ủi", hinhThuc: "Nội bộ" },
    { stt: isBo ? 8 : 7, tenCongDoan: "Đóng gói", nguoiTen: "Tổ Đóng Gói", hinhThuc: "Nội bộ" },
    { stt: isBo ? 9 : 8, tenCongDoan: "Nhập kho", nguoiTen: "Kho thành phẩm", hinhThuc: "Nội bộ" },
  ];

  // Kích thước swatch / ảnh màu lớn (64px cho <=4 màu, 54px cho >=5 màu để vừa khít 1 trang A4)
  const swatchSize = dsMau.length <= 4 ? 64 : (dsMau.length === 5 ? 54 : 48);

  // Tính tổng theo từng cột size
  const totalPerSize: Record<string, number> = {};
  sizeList.forEach(s => { totalPerSize[s] = 0; });

  let grandTotalQty = 0;
  let grandTotalMet = 0;
  let grandTotalDuKien = 0;

  const mauTableRows = dsMau.map((m, idx) => {
    const stt = idx + 1;
    const tenMauChinh = m.ten || `Màu ${stt}`;
    const swatch = getColorSwatch(tenMauChinh);
    const hasRealImg = m.img && m.img.trim().length > 0 && !m.img.includes("Phieu_Giao_Nhan");

    const mauQuan = isBo 
      ? (m.imgQuan ? `${tenMauChinh} (Bộ)` : (m.mauPhoi?.[0] || m.maVaiQuan || "Theo bộ")) 
      : (m.mauPhoi?.[0] || "—");
    const boDay = m.mauPhoi && m.mauPhoi.length > 1 
      ? m.mauPhoi[1] 
      : (m.mauPhoi?.[0] || "Bo dệt viền");

    // Lấy số lượng từng size
    let rowTotal = 0;
    const sizeCells = sizeList.map(s => {
      const found = (m.phanBoSize || []).find(p => p.size === s);
      const sl = found ? found.sl : 0;
      rowTotal += sl;
      totalPerSize[s] += sl;
      return `<td class="text-center font-bold" style="font-size: 13.5px; padding: 6px 3px;">${sl > 0 ? sl : "—"}</td>`;
    }).join("");

    const rowActual = m.slThucTe || (rowTotal > 0 ? rowTotal : m.slDuKien || 0);
    grandTotalQty += rowActual;
    grandTotalDuKien += (m.slDuKien || 0);

    const soMetUocTinh = m.slDuKien ? Math.round(m.slDuKien * (m.dinhMuc || firstDinhMuc) * 3.3) : "";
    if (typeof soMetUocTinh === "number") grandTotalMet += soMetUocTinh;
    const soCayUocTinh = typeof soMetUocTinh === "number" && soMetUocTinh > 0 ? (soMetUocTinh / 40).toFixed(1) : "";
    const soLopUocTinh = rowActual > 0 ? Math.ceil(rowActual / Math.max(1, sizeList.length)) : "";

    const bgRow = idx % 2 === 0 ? "bg-white" : "bg-slate-50";

    return `
      <tr class="${bgRow}">
        <td class="text-center font-mono font-bold" style="font-size: 12px;">${stt}</td>
        <td style="padding: 5px 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${hasRealImg ? `
              <img src="${m.img}" style="width: ${swatchSize}px; height: ${swatchSize}px; object-fit: cover; border-radius: 6px; border: 2px solid #cbd5e1; background: #ffffff; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" alt="${tenMauChinh}" />
            ` : `
              <div style="width: ${swatchSize}px; height: ${swatchSize}px; border-radius: 6px; border: 2px solid ${swatch.border}; background: ${swatch.hex}; box-shadow: inset 0 0 10px rgba(0,0,0,0.32), 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 900; color: ${swatch.text}; flex-shrink: 0; letter-spacing: 0.3px; text-transform: uppercase;">
                ${swatch.short}
              </div>
            `}
            <div style="min-width: 0;">
              <div class="font-bold text-slate-900" style="font-size: 13.5px; line-height: 1.25;">${tenMauChinh}</div>
              ${m.maSKU ? `<div style="font-size: 11px; color: #475569; font-family: monospace; font-weight: 700; margin-top: 2px;">${m.maSKU}</div>` : ""}
            </div>
          </div>
        </td>
        <td style="padding: 5px 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            ${m.imgQuan && !m.imgQuan.includes("Phieu_Giao_Nhan") ? `
              <img src="${m.imgQuan}" style="width: 32px; height: 32px; object-fit: contain; border-radius: 4px; border: 1.5px solid #cbd5e1; background: #ffffff; flex-shrink: 0;" alt="Quần" />
            ` : ""}
            <span class="text-slate-800 font-bold" style="font-size: 12px;">${mauQuan}</span>
          </div>
        </td>
        <td class="text-slate-800 font-semibold" style="font-size: 11.5px;">${boDay}</td>
        <td class="text-center font-mono font-bold" style="font-size: 12.5px;">${soLopUocTinh || ""}</td>
        ${sizeCells}
        <td class="text-center font-black bg-amber-50 text-slate-900" style="font-size: 14px;">${rowActual}</td>
        <td class="text-center font-mono font-semibold" style="font-size: 11.5px;">${soMetUocTinh || ""}</td>
        <td class="text-center font-mono font-semibold" style="font-size: 11.5px;">${soCayUocTinh || ""}</td>
        <td class="text-center font-bold text-slate-800" style="font-size: 12.5px;">${m.slDuKien || rowActual}</td>
      </tr>
    `;
  }).join("");

  const totalSizeFooterCells = sizeList.map(s => {
    return `<td class="text-center font-black bg-emerald-100 text-emerald-950" style="font-size: 13.5px; padding: 6px 3px;">${totalPerSize[s]}</td>`;
  }).join("");

  const originUrl = typeof window !== "undefined" ? window.location.origin : "";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Phiếu Lệnh Cắt Sản Xuất - ${lc.maSP || "MIMIN"} - ${maLenh}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${originUrl ? `<base href="${originUrl}/">` : ""}
  <style>
    /* ================= A4 EXACT PRINT OPTIMIZATION (100% VỪA VẶN 1 TRANG A4 DỌC) ================= */
    @page {
      size: A4 portrait;
      margin: 4mm 6mm 4mm 6mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      font-family: Arial, "Helvetica Neue", Helvetica, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.25;
      color: #0f172a;
      background: #f1f5f9;
      height: 100%;
    }

    /* Khung A4 sheet */
    .a4-sheet {
      width: 198mm;
      height: 288mm;
      max-height: 288mm;
      margin: 8px auto;
      background: #ffffff;
      padding: 0;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      border: 1.5px solid #0f172a;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    /* Nút in nổi trên thanh công cụ */
    .toolbar-no-print {
      position: sticky;
      top: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #0f172a;
      color: #ffffff;
      padding: 7px 16px;
      border-radius: 8px;
      margin: 6px auto;
      max-width: 198mm;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover { background: #1d4ed8; }
    .btn-close {
      background: #475569;
      color: #ffffff;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }
    .btn-close:hover { background: #334155; }

    /* ================= CÁC PHẦN TỬ BẢNG & LƯỚI ================= */
    .a4-main-content {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .banner-header {
      background: #102a45;
      color: #ffffff;
      text-align: center;
      padding: 6px 10px;
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-bottom: 2px solid #0a1b2d;
    }

    /* Phần thông tin công ty lớn hơn, bố cục xuống dòng rõ ràng */
    .company-banner {
      background: #f8fafc;
      border-bottom: 2px solid #102a45;
      padding: 6px 12px;
      text-align: center;
    }
    .company-name {
      font-size: 15px;
      font-weight: 900;
      color: #102a45;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .company-sub {
      font-size: 11.5px;
      color: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .company-sep {
      color: #94a3b8;
      font-weight: bold;
    }

    .section-title {
      background: #1b365d;
      color: #ffffff;
      padding: 3.5px 10px;
      font-size: 11.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .section-title-sub {
      background: #fef3c7;
      border: 1px solid #64748b;
      border-top: none;
      border-bottom: none;
      padding: 3.5px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11.5px;
      font-weight: 800;
      color: #1e293b;
    }

    table.excel-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto;
    }
    table.excel-table th, table.excel-table td {
      border: 1px solid #64748b;
      padding: 3.5px 6px;
      vertical-align: middle;
      font-size: 11px;
      line-height: 1.25;
    }
    table.excel-table th {
      background: #1b365d;
      color: #ffffff;
      font-weight: 800;
      text-align: center;
    }
    table.excel-table td.label-cell {
      background: #f1f5f9;
      font-weight: 800;
      color: #1e293b;
      width: 105px;
      font-size: 11px;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .bg-white { background: #ffffff; }
    .bg-slate-50 { background: #f8fafc; }
    .bg-amber-50 { background: #fefce8; }
    .bg-emerald-50 { background: #ecfdf5; }
    .text-emerald-700 { color: #047857; }

    /* Khối Section 2: Bảng quy trình gia công (47%) + HÌNH ẢNH MẪU SẢN PHẨM LỚN (53%) */
    .section-two-container {
      display: flex;
      width: 100%;
      border-bottom: 1.5px solid #64748b;
    }
    .section-two-left {
      flex: 0 0 47%;
      width: 47%;
      border-right: 1.5px solid #64748b;
      display: flex;
      flex-direction: column;
    }
    .section-two-right {
      flex: 0 0 53%;
      width: 53%;
      display: flex;
      flex-direction: column;
      background: #ffffff;
    }

    .product-img-box {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
      background: #ffffff;
      overflow: hidden;
      min-height: 250px;
      max-height: 275px;
    }
    .product-img {
      max-width: 100%;
      max-height: 255px;
      object-fit: contain;
      border-radius: 6px;
      border: 1.5px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      background: #ffffff;
    }

    /* Footer chữ ký 4 bên ghim sát đáy */
    .sign-table {
      width: 100%;
      border-collapse: collapse;
      border-top: 2px solid #0f172a;
      margin-top: auto;
    }
    .sign-table td {
      border: 1px solid #94a3b8;
      width: 25%;
      text-align: center;
      padding: 5px 6px 40px 6px;
      font-size: 11px;
      font-weight: bold;
      vertical-align: top;
      background: #ffffff;
    }
    .sign-table td .sign-title {
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 2px;
      font-size: 11px;
    }
    .sign-table td .sign-sub {
      font-weight: normal;
      font-style: italic;
      color: #64748b;
      font-size: 9.5px;
    }
    .sign-table td .sign-name {
      margin-top: 28px;
      font-weight: bold;
      color: #1e293b;
      font-size: 11.5px;
    }

    /* ================= PRINT MEDIA ================= */
    @media print {
      html, body {
        width: 210mm !important;
        height: 297mm !important;
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: hidden !important;
      }
      .toolbar-no-print {
        display: none !important;
      }
      .a4-sheet {
        width: 100% !important;
        height: 100% !important;
        max-height: 288mm !important;
        box-shadow: none !important;
        border: 1.5px solid #0f172a !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        page-break-inside: avoid !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
      }
    }
  </style>
</head>
<body>

  <!-- Thanh công cụ (ẩn khi in) -->
  <div class="toolbar-no-print">
    <div>
      <strong>LỆNH CẮT SẢN XUẤT (CHUẨN KHỔ A4)</strong>
      <span style="opacity: 0.7; font-size: 12px; margin-left: 8px;">Mã: ${maLenh} · ${lc.maSP || ""} ${lc.tenSP || ""}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">🖨️ In Phiếu (Khổ A4)</button>
      <button class="btn-close" onclick="window.close()">Đóng</button>
    </div>
  </div>

  <!-- Trang giấy A4 Chuẩn Vừa Vặn 100% Đầy Khổ Giấy Không Tràn Trang -->
  <div class="a4-sheet">
    <div class="a4-main-content">
      <!-- 1. Header Banner -->
      <div class="banner-header">
        LỆNH CẮT SẢN XUẤT - ${opts.thuongHieu}
      </div>

      <!-- 2. Company Banner (Tên công ty lớn hơn, thông tin công ty bố cục xuống dòng rõ ràng) -->
      <div class="company-banner">
        <div class="company-name">${opts.tenCongTy}</div>
        <div class="company-sub">
          <span>Địa chỉ: <b>${opts.diaChi}</b></span>
          <span class="company-sep">•</span>
          <span>MST: <b>${opts.mst}</b></span>
          <span class="company-sep">•</span>
          <span>Hotline: <b>${opts.soDienThoai}</b></span>
        </div>
      </div>

      <!-- 3. Section 1: Thông tin chung & Kế hoạch (Dựa 100% từ Lệnh Cắt) -->
      <div class="section-title">1. THÔNG TIN CHUNG & KẾ HOẠCH CẮT SẢN XUẤT</div>
      <table class="excel-table">
        <tr>
          <td class="label-cell">Mã Lệnh Cắt</td>
          <td class="font-bold font-mono" style="font-size: 13.5px; color: #b45309; background: #fefce8; width: 140px;">${maLenh}</td>
          <td class="label-cell" style="width: 80px;">Loại lệnh</td>
          <td class="font-bold" style="font-size: 11.5px; width: 110px;">${loaiLenhText}</td>
          <td class="label-cell" style="width: 85px;">Khách hàng</td>
          <td class="font-bold text-slate-900" style="font-size: 11.5px;">${khachHangText}</td>
        </tr>
        <tr>
          <td class="label-cell">Mã sản phẩm</td>
          <td class="font-bold font-mono" style="font-size: 14px; color: #1e3a8a; background: #eff6ff;">${lc.maSP || "—"}</td>
          <td class="label-cell">Tên sản phẩm</td>
          <td colspan="3" class="font-bold" style="font-size: 13px; color: #0f172a;">${lc.tenSP || "—"}</td>
        </tr>
        <tr>
          <td class="label-cell">Loại SP</td>
          <td class="font-bold" style="font-size: 12px;">${loaiSPText}</td>
          <td class="label-cell">Tổng SL dự kiến</td>
          <td class="font-black" style="font-size: 15px; color: #047857; background: #ecfdf5;">
            ${tongSL} <span style="font-size: 11px; font-weight: normal;">${donViTinh}</span>
          </td>
          <td class="label-cell">Tỉ lệ size</td>
          <td class="font-bold font-mono" style="font-size: 13px; color: #4338ca; background: #eef2ff;">${tiLeDisplay}</td>
        </tr>
        <tr>
          <td class="label-cell">Ngày bắt đầu</td>
          <td class="font-bold font-mono" style="font-size: 11.5px;">${ngayBatDauText}</td>
          <td class="label-cell">Hạn hoàn thành</td>
          <td class="font-bold font-mono" style="font-size: 11.5px; color: #b91c1c;">${hanHoanThanhText}</td>
          <td class="label-cell">Cơ cấu</td>
          <td class="font-bold text-slate-800" style="font-size: 11.5px;">${coCauText}</td>
        </tr>
        ${ghiChuTongHop ? `
        <tr>
          <td class="label-cell">Ghi chú & Sơ đồ</td>
          <td colspan="5" style="font-size: 11px; color: #1e293b; background: #fffbeb; font-weight: 600;">
            ${ghiChuTongHop}
          </td>
        </tr>
        ` : ""}
      </table>

      <!-- 4. Section 2: Quy trình gia công (Trái) & HÌNH ẢNH MẪU SẢN PHẨM LỚN (Phải) -->
      <!-- ĐÃ BỎ HOÀN TOÀN CỘT ĐƠN GIÁ THEO YÊU CẦU -->
      <div class="section-title">2. QUY TRÌNH GIA CÔNG SẢN XUẤT & HÌNH ẢNH MẪU SẢN PHẨM</div>
      <div class="section-two-container">
        <!-- Cột Trái: Bảng quy trình gia công từ Lệnh Cắt (KHÔNG CÓ ĐƠN GIÁ) -->
        <div class="section-two-left">
          <table class="excel-table" style="border: none; height: 100%;">
            <thead>
              <tr>
                <th style="width: 32px; font-size: 10.5px; padding: 4px 2px;">STT</th>
                <th style="font-size: 10.5px; padding: 4px 6px;">CÔNG ĐOẠN</th>
                <th style="font-size: 10.5px; padding: 4px 6px;">ĐƠN VỊ PHỤ TRÁCH / GIA CÔNG</th>
                <th style="width: 95px; font-size: 10.5px; padding: 4px 2px;">HÌNH THỨC</th>
              </tr>
            </thead>
            <tbody>
              ${congDoanList.map(cd => `
                <tr>
                  <td class="text-center font-mono font-bold" style="font-size: 11px; padding: 4.5px 2px;">${cd.stt}</td>
                  <td class="font-bold text-slate-900" style="font-size: 11px; padding: 4.5px 6px;">${cd.tenCongDoan}</td>
                  <td class="text-slate-800 font-semibold" style="font-size: 11px; padding: 4.5px 6px;">${cd.nguoiTen}</td>
                  <td class="text-center" style="font-size: 10px; padding: 4.5px 2px;">
                    <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; ${cd.hinhThuc === "Gia công ngoài" ? "background: #fdf2f8; color: #be185d;" : "background: #eff6ff; color: #1d4ed8;"}">
                      ${cd.hinhThuc}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <!-- Cột Phải: HÌNH ẢNH MẪU SẢN PHẨM LỚN RÕ NÉT -->
        <div class="section-two-right">
          <div style="background: #1b365d; color: #ffffff; text-align: center; font-weight: 800; font-size: 11px; padding: 3.5px 6px; letter-spacing: 0.3px;">
            HÌNH ẢNH MẪU SẢN PHẨM ${lc.maSP ? `[${lc.maSP}]` : ""}
          </div>
          <div class="product-img-box">
            ${productImg ? `
              <div style="display: flex; gap: 8px; align-items: center; justify-content: center; height: 100%; width: 100%;">
                <img src="${productImg}" class="product-img" alt="${lc.tenSP || "Mẫu sản phẩm"}" />
                ${pantsImg ? `<img src="${pantsImg}" class="product-img" alt="Mẫu quần" />` : ""}
              </div>
            ` : `
              <div style="text-align: center; color: #94a3b8; font-size: 13px; padding: 30px 0;">
                <div style="font-size: 42px; margin-bottom: 6px;">👕</div>
                <i>Chưa có ảnh mẫu sản phẩm</i>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- 5. Section 3: Bảng Tỉ Lệ Size & Phân bổ chi tiết màu (ẢNH / SWATCH MÀU CHÍNH TO RÕ 58PX) -->
      <div class="section-title-sub">
        <span>3. BẢNG TỈ LỆ SIZE & CHI TIẾT CẮT THEO MÀU (${soMau} MÀU)</span>
        <span class="font-mono" style="color: #b45309; font-size: 11.5px;">Tỉ lệ size: ${sizeList.map(s => `${s}: 1`).join(" | ")} (${tiLeDisplay})</span>
      </div>

      <table class="excel-table">
        <thead>
          <tr>
            <th style="width: 28px; font-size: 10.5px; padding: 5px 2px;">STT</th>
            <th style="min-width: 175px; font-size: 11px; padding: 5px 6px;">MÀU VẢI CHÍNH (ẢNH / SWATCH)</th>
            <th style="width: 115px; font-size: 10.5px; padding: 5px 4px;">${isBo ? "MÀU QUẦN" : "MÀU PHỐI"}</th>
            <th style="width: 75px; font-size: 10.5px; padding: 5px 4px;">BO / DÂY</th>
            <th style="width: 44px; font-size: 10.5px; padding: 5px 2px;">SỐ LỚP</th>
            ${sizeList.map(s => `<th style="width: 36px; font-size: 11.5px; padding: 5px 2px;">${s}</th>`).join("")}
            <th style="width: 65px; background: #b45309; font-size: 11.5px; padding: 5px 2px;">TỔNG ${donViTinh}</th>
            <th style="width: 46px; font-size: 10px; padding: 5px 2px;">SỐ MÉT</th>
            <th style="width: 42px; font-size: 10px; padding: 5px 2px;">SỐ CÂY</th>
            <th style="width: 58px; font-size: 10.5px; padding: 5px 2px;">SL DỰ KIẾN</th>
          </tr>
        </thead>
        <tbody>
          ${mauTableRows}
          <!-- Hàng tổng cộng -->
          <tr style="background: #ecfdf5; font-weight: bold; border-top: 2px solid #0f172a;">
            <td colspan="4" class="text-center font-black" style="font-size: 12.5px; color: #064e3b; padding: 6px 4px;">TỔNG CỘNG</td>
            <td class="text-center font-mono font-bold" style="font-size: 11px;">—</td>
            ${totalSizeFooterCells}
            <td class="text-center font-black bg-emerald-200 text-emerald-950" style="font-size: 15px; padding: 6px 2px;">${grandTotalQty}</td>
            <td class="text-center font-mono font-bold" style="font-size: 12px;">${grandTotalMet > 0 ? grandTotalMet : "—"}</td>
            <td class="text-center font-mono font-bold" style="font-size: 12px;">${grandTotalMet > 0 ? (grandTotalMet / 40).toFixed(1) : "—"}</td>
            <td class="text-center font-black text-emerald-900" style="font-size: 13px;">${grandTotalDuKien || grandTotalQty}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 6. Footer: Chữ ký 4 bên ghim sát đáy bảng A4 -->
    <table class="sign-table">
      <tr>
        <td>
          <div class="sign-title">NGƯỜI LẬP PHIẾU</div>
          <div class="sign-sub">(Ký & ghi rõ họ tên)</div>
          <div class="sign-name">${opts.nguoiLapPhieu}</div>
        </td>
        <td>
          <div class="sign-title">TỔ TRƯỞNG CẮT</div>
          <div class="sign-sub">(Ký & ghi rõ họ tên)</div>
          <div class="sign-name">${lc.phuTrachCat || "Xưởng nhà"}</div>
        </td>
        <td>
          <div class="sign-title">QUẢN LÝ SẢN XUẤT</div>
          <div class="sign-sub">(Ký & ghi rõ họ tên)</div>
          <div class="sign-name">${lc.phuTrachSX || "Hồ Minh Sang"}</div>
        </td>
        <td>
          <div class="sign-title">GIÁM ĐỐC DUYỆT</div>
          <div class="sign-sub">(Ký & ghi rõ họ tên)</div>
          <div class="sign-name">Hồ Minh Sang</div>
        </td>
      </tr>
    </table>
  </div>

  <script>
    window.onload = function() {
      var imgs = Array.from(document.images);
      var pending = imgs.length;
      if (pending === 0) {
        setTimeout(function() { window.print(); }, 200);
        return;
      }
      var printed = false;
      function triggerPrint() {
        if (!printed) {
          printed = true;
          window.print();
        }
      }
      function onImgDone() {
        pending--;
        if (pending <= 0) {
          setTimeout(triggerPrint, 150);
        }
      }
      imgs.forEach(function(img) {
        if (img.complete) {
          onImgDone();
        } else {
          img.onload = onImgDone;
          img.onerror = onImgDone;
        }
      });
      // Fallback sau 1s nếu có ảnh tải chậm
      setTimeout(triggerPrint, 1000);
    };
  </script>
</body>
</html>`;
}

/**
 * Mở cửa sổ in Phiếu Lệnh Cắt & Sản Xuất trên trình duyệt
 */
export function inPhieuLenhCatA4(
  lc: Parameters<typeof generatePhieuLenhCatA4HTML>[0],
  customOptions?: PhieuLenhCatPrintOptions
): boolean {
  if (typeof window === "undefined") return false;

  const html = generatePhieuLenhCatA4HTML(lc, customOptions);
  const win = window.open("", "_blank", "width=960,height=1080");
  if (!win) {
    return false;
  }
  win.document.write(html);
  win.document.close();
  return true;
}
