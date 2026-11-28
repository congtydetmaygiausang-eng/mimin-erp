// =================================================================
// MODULE IN PHIẾU KIỂM ĐẾM & THEO DÕI GIAO NHẬN CHUẨN A4 - POLOMIMIN / GIAU SANG
// Giao diện tinh gọn, chuyên nghiệp, vừa khít 1 TRANG A4 duy nhất
// Cải tiến theo yêu cầu anh Cường:
//  - BỎ phần thông tin công ty ở trên cùng
//  - BẢNG QUẦN RÚT GỌN (KHÔNG CẦN HÌNH ẢNH) -> tiết kiệm tối đa chiều cao, chống nhảy trang
//  - BẢNG ÁO giữ hình ảnh to rõ, sắc nét (50x66px)
//  - BỎ phần "Xác nhận & theo dõi hàng sửa"
//  - BỎ phần "Kết luận & nghiệm thu kho (HTL THM)"
//  - BỎ dòng "Tổng số lượng thành phẩm bằng chữ"
//  - Ô Thực Nhận, SL Đạt, Lỗi/Hụt, Ghi chú thiết kế viền mờ rõ ràng cho QC ghi tay bằng bút
//  - Thiết kế co giãn thông minh, màu sắc Navy Slate & Indigo cao cấp, vừa vặn 100% 1 trang A4
// =================================================================

import { LOAI_SP_LABELS, type LenhCat, type LoaiSP, type MauVai } from "./data/lenh-cat-store";

export interface PhieuKiemDemPrintOptions {
  tenCongTy?: string;
  tenQuocTe?: string;
  mst?: string;
  diaChi?: string;
  hotline?: string;
  email?: string;
  daiDienPhapLuat?: string;
  ngayKiemDem?: string;
  tenXuongGiaCong?: string;
  nguoiKiemDem?: string;
  ghiChuXacNhan?: string;
}

const DEFAULT_OPTIONS: PhieuKiemDemPrintOptions = {
  tenCongTy: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
  tenQuocTe: "GIAU SANG TEXTILE COMPANY LIMITED",
  mst: "0318507560",
  diaChi: "12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP. Hồ Chí Minh",
  hotline: "0774480916",
  email: "congtydetmaygiausang@gmail.com",
  daiDienPhapLuat: "Hồ Minh Sang",
  nguoiKiemDem: "Tổ Kiểm Đếm / QC",
};

/**
 * Chuẩn hoá tên size may mặc để sắp xếp đúng thứ tự (S -> M -> L -> XL -> 2XL -> 3XL)
 */
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

function normalizeSizeName(sz: string): string {
  const s = (sz || "").trim().toUpperCase();
  if (s === "XXL") return "2XL";
  if (s === "XXXL") return "3XL";
  return s;
}

/**
 * Bảng màu swatch nhận diện cho may mặc Việt Nam
 */
function getColorSwatch(colorName?: string): { hex: string; text: string; short: string; border: string } {
  const c = (colorName || "").toLowerCase().trim();
  if (c.includes("đen") || c.includes("black")) return { hex: "#0f172a", text: "#ffffff", short: "ĐEN", border: "#334155" };
  if (c.includes("trắng") || c.includes("white")) return { hex: "#ffffff", text: "#0f172a", short: "TRẮNG", border: "#94a3b8" };
  if (c.includes("xám nhạt") || c.includes("tiêu nhạt") || c.includes("muối tiêu")) return { hex: "#cbd5e1", text: "#0f172a", short: "XÁM", border: "#94a3b8" };
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
 * Sinh mã HTML hoàn chỉnh cho Phiếu Kiểm Đếm & Theo Dõi Giao Nhận A4
 */
export function generatePhieuKiemDemA4HTML(
  lc: Partial<LenhCat> & {
    id?: string;
    maSP?: string;
    tenSP?: string;
    loaiSP?: LoaiSP;
    loaiLenh?: string;
    khachHang?: string;
    tongSL?: number | string;
    tongSLThucTe?: number | string;
    tongSLThucTeAo?: number | string;
    tongSLThucTeQuan?: number | string;
    tiLeSize?: string;
    hanHoanThanh?: string;
    ngayTao?: string;
    phuTrachCat?: string;
    phuTrachSX?: string;
    ghiChu?: string;
    dsMau?: MauVai[];
    phanCong?: any[];
  },
  customOptions?: PhieuKiemDemPrintOptions
): string {
  const opts = { ...DEFAULT_OPTIONS, ...customOptions };

  const idLenhCat = lc.id || `LC-${new Date().getFullYear()}-0001`;
  const maSP = lc.maSP || "—";
  const tenSP = lc.tenSP || "—";
  const loaiSP = lc.loaiSP || "BoCoTron";
  const loaiSPLabel = LOAI_SP_LABELS[loaiSP] || loaiSP;
  
  // Xác định Set Bộ hay Áo Đơn
  const isBo = loaiSP.startsWith("Bo") || (lc.tenSP || "").toLowerCase().includes("bộ");
  const donViTinh = isBo ? "Bộ" : "Cái";

  const tongSLKeHoach = Number(lc.tongSL || 0);

  // Trích xuất chi tiết các xưởng gia công phụ trách
  const rawPhanCong = Array.isArray(lc.phanCong) ? lc.phanCong : [];
  
  const xuongMayAoItem = rawPhanCong.find(
    (p: any) => p.id === "may_ao" || (p.tenCongDoan && p.tenCongDoan.toLowerCase().includes("may áo")) || (p.tenCongDoan && p.tenCongDoan.toLowerCase().includes("may tròn")) || (p.tenCongDoan && p.tenCongDoan.toLowerCase().includes("may trụ"))
  ) || rawPhanCong.find((p: any) => p.id === "may" || (p.tenCongDoan && p.tenCongDoan.toLowerCase().includes("may")));

  const xuongMayQuanItem = rawPhanCong.find(
    (p: any) => p.id === "may_quan" || (p.tenCongDoan && p.tenCongDoan.toLowerCase().includes("may quần"))
  );

  const xuongInTheuItem = rawPhanCong.find(
    (p: any) => p.id === "in" || p.id === "theu" || p.id === "in_theu" || (p.tenCongDoan && (p.tenCongDoan.toLowerCase().includes("in") || p.tenCongDoan.toLowerCase().includes("thêu")))
  );

  const xuongMayAoTen = xuongMayAoItem?.nguoiTen || (isBo ? "Xưởng may áo" : "Xưởng may thành phẩm");
  const xuongMayQuanTen = xuongMayQuanItem?.nguoiTen || (isBo ? "Xưởng may quần" : "");
  const xuongInTheuTen = xuongInTheuItem?.nguoiTen || "Xưởng in / thêu";

  // Ngày lập / kiểm đếm & hạn giao
  const ngayKiemDemHienThi = opts.ngayKiemDem ? formatPrintDate(opts.ngayKiemDem) : formatPrintDate(new Date().toISOString());
  const hanGiaoHienThi = formatPrintDate(lc.hanHoanThanh);

  // Danh sách màu sắc
  const dsMau = lc.dsMau || [];
  const tongSoMau = dsMau.length;

  // Thu thập danh sách size duy nhất & chuẩn hóa thứ tự S, M, L, XL, 2XL, 3XL
  const sizeSet = new Set<string>();
  dsMau.forEach((m) => {
    (m.phanBoSize || []).forEach((pb) => {
      if (pb.size) sizeSet.add(normalizeSizeName(pb.size));
    });
    if (isBo && m.phanBoSizeQuan) {
      m.phanBoSizeQuan.forEach((pb) => {
        if (pb.size) sizeSet.add(normalizeSizeName(pb.size));
      });
    }
  });

  let allSizes = Array.from(sizeSet);
  if (allSizes.length === 0) {
    allSizes = ["S", "M", "L", "XL", "2XL", "3XL"];
  } else {
    allSizes.sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(a);
      const ib = SIZE_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }

  // Tính định mức và ký vải (nếu có dữ liệu)
  let tongKgThucTe = 0;
  let tongDinhMuc = 0;
  dsMau.forEach((m) => {
    if (m.kgThucTe) tongKgThucTe += m.kgThucTe;
    if (m.dinhMuc) tongDinhMuc += m.dinhMuc;
  });
  const dinhMucBinhQuan = dsMau.length > 0 && tongDinhMuc > 0 ? (tongDinhMuc / dsMau.length).toFixed(3) : "";

  // Tỷ lệ size hiển thị tóm tắt
  const tiLeSizeDisplay = lc.tiLeSize || (dsMau[0]?.phanBoSize ? dsMau[0].phanBoSize.map(p => p.sl).join(":") : "1:1:1:1");

  // Tùy biến kích thước ảnh, chữ và khoảng đệm theo số lượng màu và phân loại (Bộ vs Áo) để lấp đầy 1 trang A4 hoàn hảo, an toàn tuyệt đối 1 trang duy nhất
  let imgW = 54;
  let imgH = 68;
  let writeCellMinH = 18;
  let rowPadY = "2px";
  let sigSpaceH = 30;

  if (isBo) {
    // Đơn hàng Set Bộ: Có cả 2 bảng Áo & Quần + Bảng Tiến trình 7 dòng
    if (tongSoMau >= 6) {
      imgW = 38;
      imgH = 44;
      writeCellMinH = 13;
      rowPadY = "1px";
      sigSpaceH = 16;
    } else if (tongSoMau >= 5) {
      imgW = 42;
      imgH = 48;
      writeCellMinH = 14;
      rowPadY = "1.2px";
      sigSpaceH = 18;
    } else {
      // 1 đến 4 màu (M01..M15 có 4 màu) -> Tối ưu gọn đẹp, 100% nằm gọn trên 1 tờ A4
      imgW = 52;
      imgH = 58;
      writeCellMinH = 16;
      rowPadY = "2px";
      sigSpaceH = 8; // Rút ngắn khoảng trắng ký tên theo yêu cầu anh Cường
    }
  } else {
    // Đơn hàng Áo lẻ / Quần lẻ (chỉ có 1 bảng size)
    if (tongSoMau >= 6) {
      imgW = 44;
      imgH = 56;
      writeCellMinH = 16;
      rowPadY = "1.5px";
      sigSpaceH = 12;
    } else if (tongSoMau === 5) {
      imgW = 50;
      imgH = 64;
      writeCellMinH = 18;
      rowPadY = "2px";
      sigSpaceH = 14;
    } else {
      imgW = 54;
      imgH = 70;
      writeCellMinH = 20;
      rowPadY = "2.5px";
      sigSpaceH = 16;
    }
  }

  // =================================================================
  // RENDER BẢNG 1: KIỂM ĐẾM SỐ LƯỢNG ÁO (ẢNH TO RÕ NÉT)
  // =================================================================
  const totalPerSizeAo: Record<string, number> = {};
  allSizes.forEach((sz) => { totalPerSizeAo[sz] = 0; });
  let sumKeHoachAo = 0;

  const rowsAoHTML = dsMau.map((mau, idx) => {
    const stt = idx + 1;
    const swatch = getColorSwatch(mau.ten);
    const sizeMapAo: Record<string, number> = {};
    (mau.phanBoSize || []).forEach((pb) => {
      const sz = normalizeSizeName(pb.size);
      sizeMapAo[sz] = pb.sl || 0;
      totalPerSizeAo[sz] = (totalPerSizeAo[sz] || 0) + (pb.sl || 0);
    });

    const slKeHoachAo = mau.slDuKien || Object.values(sizeMapAo).reduce((a, b) => a + b, 0) || 0;
    sumKeHoachAo += slKeHoachAo;

    // Ảnh to rõ nét
    const imgThumb = mau.img
      ? `<img src="${mau.img}" alt="${mau.ten}" class="img-preview-large" style="width: ${imgW}px; height: ${imgH}px;" />`
      : `<div class="color-badge-large" style="width: ${imgW}px; height: ${imgH}px; background-color: ${swatch.hex}; color: ${swatch.text}; border-color: ${swatch.border}; font-size: ${imgW > 55 ? '12px' : '10.5px'};">${swatch.short}</div>`;

    const sizeCellsHTML = allSizes
      .map((sz) => {
        const val = sizeMapAo[sz];
        return `<td class="text-center font-bold" style="background: ${val ? '#f8fafc' : '#fff'}; color: ${val ? '#0f172a' : '#cbd5e1'}; font-size: 12.5px; padding: ${rowPadY} 3px;">${val !== undefined ? val : "—"}</td>`;
      })
      .join("");

    return `
      <tr>
        <td class="text-center font-bold text-slate-600" style="padding: ${rowPadY} 3px; font-size: 12px;">${stt}</td>
        <td class="text-left" style="padding: ${rowPadY} 5px;">
          <div class="color-flex-box">
            ${imgThumb}
            <div class="color-info-box">
              <span class="color-name-main">${mau.ten}</span>
              <span class="color-sku-tag">${mau.maSKU || "ÁO"}</span>
            </div>
          </div>
        </td>
        <td class="text-center text-xs font-mono font-bold text-slate-700" style="padding: ${rowPadY} 3px; font-size: 12px;">${mau.phanBoSize?.map(p => p.sl).join(":") || tiLeSizeDisplay}</td>
        <td class="text-right font-black text-slate-900" style="font-size: 13.5px; padding: ${rowPadY} 4px;">${slKeHoachAo.toLocaleString("vi-VN")}</td>
        ${sizeCellsHTML}
        <!-- CỘT THỰC NHẬN ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT SL ĐẠT ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT LỖI/HỤT ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT GHI CHÚ ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-left bg-white"><div class="blank-write-note"></div></td>
      </tr>
    `;
  }).join("");

  const totalCellsAoHTML = allSizes
    .map((sz) => `<td class="text-center font-black text-slate-900 bg-slate-100" style="font-size: 11.5px; padding: 2.5px 3px;">${(totalPerSizeAo[sz] || 0).toLocaleString("vi-VN")}</td>`)
    .join("");

  // =================================================================
  // RENDER BẢNG 2: KIỂM ĐẾM SỐ LƯỢNG QUẦN (RÚT GỌN - KHÔNG CẦN HÌNH ẢNH)
  // Tiết kiệm tối đa khoảng trắng, bố cục rõ ràng
  // =================================================================
  const totalPerSizeQuan: Record<string, number> = {};
  allSizes.forEach((sz) => { totalPerSizeQuan[sz] = 0; });
  let sumKeHoachQuan = 0;

  const rowsQuanHTML = isBo ? dsMau.map((mau, idx) => {
    const stt = idx + 1;
    const swatch = getColorSwatch(mau.ten);
    const sizeMapQuan: Record<string, number> = {};
    const phanBoQuan = mau.phanBoSizeQuan || mau.phanBoSize || [];
    phanBoQuan.forEach((pb) => {
      const sz = normalizeSizeName(pb.size);
      sizeMapQuan[sz] = pb.sl || 0;
      totalPerSizeQuan[sz] = (totalPerSizeQuan[sz] || 0) + (pb.sl || 0);
    });

    const slKeHoachQuan = Object.values(sizeMapQuan).reduce((a, b) => a + b, 0) || (mau.slDuKien || 0);
    sumKeHoachQuan += slKeHoachQuan;

    const sizeCellsQuanHTML = allSizes
      .map((sz) => {
        const val = sizeMapQuan[sz];
        return `<td class="text-center font-bold" style="background: ${val ? '#faf5ff' : '#fff'}; color: ${val ? '#581c87' : '#cbd5e1'}; font-size: 12.5px; padding: ${rowPadY} 3px;">${val !== undefined ? val : "—"}</td>`;
      })
      .join("");

    return `
      <tr class="row-quan-compact">
        <td class="text-center font-bold text-slate-600" style="padding: ${rowPadY} 3px; font-size: 12px;">${stt}</td>
        <td class="text-left" style="padding: ${rowPadY} 5px;">
          <div class="quan-color-pill">
            <span class="color-dot" style="background-color: ${swatch.hex}; border-color: ${swatch.border};"></span>
            <div>
              <span class="quan-color-title">${mau.ten}</span>
              <span class="quan-fabric-tag">${mau.maVaiQuan || "VẢI QUẦN"}</span>
            </div>
          </div>
        </td>
        <td class="text-center text-xs font-mono font-bold text-slate-700" style="padding: ${rowPadY} 3px; font-size: 12px;">${phanBoQuan.map(p => p.sl).join(":") || tiLeSizeDisplay}</td>
        <td class="text-right font-black text-purple-950" style="font-size: 13.5px; padding: ${rowPadY} 4px;">${slKeHoachQuan.toLocaleString("vi-VN")}</td>
        ${sizeCellsQuanHTML}
        <!-- CỘT THỰC NHẬN ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT SL ĐẠT ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT LỖI/HỤT ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <!-- CỘT GHI CHÚ ĐỂ TRỐNG ĐỂ GHI TAY -->
        <td class="text-left bg-white"><div class="blank-write-note"></div></td>
      </tr>
    `;
  }).join("") : "";

  const totalCellsQuanHTML = isBo ? allSizes
    .map((sz) => `<td class="text-center font-black text-purple-950 bg-purple-50" style="font-size: 12px; padding: 2.5px 3px;">${(totalPerSizeQuan[sz] || 0).toLocaleString("vi-VN")}</td>`)
    .join("") : "";

  // Ngày tháng in phiếu tự động
  const now = new Date();
  const printDay = now.getDate().toString().padStart(2, "0");
  const printMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const printYear = now.getFullYear();
  const ngayThangNamHienTai = `TP. Hồ Chí Minh, ngày ${printDay} tháng ${printMonth} năm ${printYear}`;

  // =================================================================
  // RENDER BẢNG 3: THEO DÕI TIẾN TRÌNH CÁC KHÂU & SẢN LƯỢNG
  // STT 1: Đếm số lượng gia công (dòng ngang đầu tiên)
  // Đã bỏ dấu ... ở các ô theo yêu cầu của anh Cường (để trống sạch sẽ cho nhân sự ghi tay)
  // =================================================================
  const mauHeadersHTML = dsMau.map((m) => `<th style="font-size: 11.5px; padding: 3px 2px;" class="text-center font-bold">${m.ten}</th>`).join("");
  const mauBlankCellsHTML = dsMau.map(() => `<td class="text-center" style="font-size: 12px; padding: 3px 2px; height: 18px;"></td>`).join("");

  const tienTrinhRows = [
    { stt: 1, icon: "🚚", ten: "Đếm số lượng gia công", note: "Xưởng gia công bàn giao" },
    { stt: 2, icon: "🏷️", ten: "Khuy nút", note: "Đơm khuy, đóng nút" },
    { stt: 3, icon: "⚠️", ten: "Lỗi khuy nút", note: "Lỗi khuy, bung cúc", isError: true },
    { stt: 4, icon: "🔥", ten: "Ủi", note: "Ủi định hình phẳng đẹp" },
    { stt: 5, icon: "⚠️", ten: "Lỗi ủi", note: "Ủi cháy, bóng vải, nhăn", isError: true },
    { stt: 6, icon: "📦", ten: "Đóng gói", note: "Gấp xếp bao bì, dán nhãn" },
    { stt: 7, icon: "⚠️", ten: "Lỗi đóng gói", note: "Sai size, rách bao, dơ", isError: true },
    { stt: 8, icon: "📥", ten: "Nhập kho thành phẩm", note: "Hoàn tất kiểm đếm nhập kho", isFinal: true },
  ];

  const tienTrinhRowsHTML = tienTrinhRows.map((r) => {
    const rowClass = r.isError ? "row-error" : r.isFinal ? "row-final font-bold" : "";
    return `
      <tr class="${rowClass}">
        <td class="text-center text-slate-500 font-bold" style="padding: 3px 2px; font-size: 12px; height: 18px;">${r.stt}</td>
        <td class="text-left font-bold text-slate-800" style="padding: 3px 5px; font-size: 12px;">
          <span class="row-icon" style="font-size: 12px;">${r.icon}</span> ${r.ten}
        </td>
        ${mauBlankCellsHTML}
        <td class="text-right font-bold ${r.isFinal ? 'text-blue-900 bg-blue-50/50' : ''}" style="padding: 3px 4px; font-size: 12px; height: 18px;"></td>
        <td class="text-center" style="padding: 3px 4px; font-size: 11px; height: 18px;"></td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phiếu Kiểm Đếm & Theo Dõi Giao Nhận - [${maSP}] ${idLenhCat}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 3.5mm 5mm 2.5mm 5mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f1f5f9;
      padding: 0;
      line-height: 1.25;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 210mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 2.5mm 4mm;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
      border-radius: 4px;
      position: relative;
    }

    /* KHỐI BANNER ĐƠN HÀNG - MÃ SP & MÃ LỆNH CẮT NỔI BẬT */
    .order-banner-card {
      border: 1.5px solid #0f172a;
      border-radius: 5px;
      padding: 4px 8px;
      margin-bottom: 4px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .order-left-info {
      flex: 1;
      min-width: 0;
    }
    .order-title-line {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 2px;
    }
    .badge-lenh-cat {
      background: #0f172a;
      color: #ffffff;
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .sp-highlight {
      font-size: 17px;
      font-weight: 900;
      color: #b91c1c;
      letter-spacing: 0.3px;
    }
    .order-sub-meta {
      font-size: 10.5px;
      color: #334155;
      font-weight: 600;
      margin-top: 1px;
    }

    /* Khối Đơn Vị Gia Công Phụ Trách Đơn Hàng */
    .gia-cong-box-outer {
      border: 1.5px solid #2563eb;
      background: #eff6ff;
      border-radius: 5px;
      padding: 3.5px 7px;
      shrink-0: 0;
      min-width: 250px;
    }
    .gc-header-tag {
      font-size: 9.5px;
      font-weight: 900;
      text-transform: uppercase;
      color: #1e40af;
      margin-bottom: 2px;
      display: flex;
      align-items: center;
      gap: 4px;
      letter-spacing: 0.3px;
    }
    .gc-list-compact {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }
    .gc-item-line {
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      background: #ffffff;
      padding: 1.5px 5px;
      border-radius: 3px;
      border: 1px solid #bfdbfe;
    }

    /* Khối 6 Ô Tóm Tắt Thông Số Kỹ Thuật */
    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 4px;
      margin-bottom: 4px;
    }
    .summary-card-box {
      border: 1.2px solid #cbd5e1;
      border-radius: 4px;
      padding: 2.5px 4px;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
    .card-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
    }
    .card-value {
      font-size: 13.5px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
      margin-top: 1px;
    }

    /* Tiêu Đề Mục Bảng */
    .section-header {
      font-size: 11.5px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 3.5px 0 2px 0;
      display: flex;
      align-items: center;
      gap: 4px;
      letter-spacing: 0.2px;
    }
    .section-header.blue { color: #1e40af; }
    .section-header.purple { color: #6b21a8; }
    .section-header.dark { color: #0f172a; }

    /* Bảng Dữ Liệu */
    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 3.5px;
    }
    .table-custom th, .table-custom td {
      border: 1px solid #94a3b8;
      padding: 2.5px 3px;
    }
    .table-custom th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: center;
      font-size: 10.5px;
    }
    .table-custom.table-quan th {
      background: #faf5ff;
      color: #581c87;
      border-color: #c084fc;
    }

    .table-custom td.text-center { text-align: center; }
    .table-custom td.text-right { text-align: right; padding-right: 4px; }
    .table-custom td.text-left { text-align: left; padding-left: 4px; }

    /* ẢNH MẪU ÁO TO RÕ NÉT */
    .color-flex-box {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 1px 0;
    }
    .img-preview-large {
      width: ${imgW}px;
      height: ${imgH}px;
      object-fit: cover;
      border-radius: 4px;
      border: 1.2px solid #cbd5e1;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      shrink-0: 0;
    }
    .color-badge-large {
      width: ${imgW}px;
      height: ${imgH}px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 900;
      border: 1.2px solid #94a3b8;
      shrink-0: 0;
    }
    .color-info-box {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    .color-name-main {
      font-weight: 900;
      font-size: 12.5px;
      color: #0f172a;
    }
    .color-sku-tag {
      font-size: 9.5px;
      color: #64748b;
      font-family: monospace;
      margin-top: 1px;
    }

    /* BẢNG QUẦN RÚT GỌN (KHÔNG CẦN HÌNH ẢNH) */
    .row-quan-compact td {
      padding: 2.5px 3px;
    }
    .quan-color-pill {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
      shrink-0: 0;
      border: 1.2px solid #94a3b8;
    }
    .quan-color-title {
      font-weight: 900;
      font-size: 12.5px;
      color: #4c1d95;
      display: block;
      line-height: 1.15;
    }
    .quan-fabric-tag {
      font-size: 9.5px;
      color: #6b21a8;
      font-family: monospace;
      display: block;
      margin-top: 1px;
    }

    /* Ô ĐỂ TRỐNG CHO NHÂN SỰ ĐIỀN TAY BẰNG BÚT MỰC */
    .blank-write-cell {
      min-height: ${writeCellMinH}px;
      width: 100%;
      background: #ffffff;
      border-radius: 2px;
    }
    .blank-write-note {
      min-height: ${writeCellMinH}px;
      width: 100%;
      background: #ffffff;
    }

    /* Các dòng trạng thái tiến trình */
    .row-error {
      background: #fff1f2;
      color: #be123c;
    }
    .row-final {
      background: #f0fdf4;
      color: #166534;
    }
    .row-icon {
      font-size: 11.5px;
      display: inline-block;
      width: 14px;
      text-align: center;
    }

    /* Khối 3 Chữ Ký */
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 2px;
      text-align: center;
    }
    .signatures-table td {
      border: none;
      vertical-align: top;
      width: 33.33%;
      padding: 0 4px;
    }
    .sig-title {
      font-weight: 800;
      font-size: 11px;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sig-sub {
      font-size: 9.5px;
      font-style: italic;
      color: #64748b;
      margin-bottom: 1px;
    }
    .sig-space {
      height: ${sigSpaceH}px;
    }
    .sig-name {
      font-weight: 800;
      font-size: 11.5px;
      color: #0f172a;
      margin-top: 1px;
    }

    .date-header-above-sig {
      text-align: right;
      font-style: italic;
      font-size: 10px;
      color: #64748b;
      margin: 2px 0 1px 0;
    }

    .print-btn-bar {
      text-align: center;
      margin: 6px 0;
    }
    .btn-print {
      background: #0f172a;
      color: white;
      border: none;
      padding: 6px 20px;
      font-size: 12.5px;
      font-weight: 800;
      border-radius: 5px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }
    .btn-print:hover {
      background: #1e293b;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 3.5mm 5mm 2.5mm 5mm;
      }
      html, body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
      .page-container {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .print-btn-bar {
        display: none !important;
      }
      .page-break-avoid {
        page-break-inside: avoid !important;
      }
      table, tr, td, th {
        page-break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>

  <div class="print-btn-bar">
    <button class="btn-print" onclick="window.print()">🖨️ In Phiếu Kiểm Đếm & Theo Dõi Giao Nhận A4 (Ctrl + P)</button>
  </div>

  <div class="page-container">
    <!-- KHỐI BANNER ĐƠN HÀNG - MÃ SP & MÃ LỆNH CẮT CHỮ TO NỔI BẬT (ĐÃ BỎ HEADER THÔNG TIN CÔNG TY) -->
    <div class="order-banner-card">
      <div class="order-left-info">
        <div class="order-title-line">
          <span class="badge-lenh-cat">${idLenhCat}</span>
          <span>PHIẾU KIỂM ĐẾM & THEO DÕI</span>
        </div>
        <div style="margin-top: 1px;">
          MÃ SẢN PHẨM: <span class="sp-highlight">[${maSP}] ${tenSP}</span>
        </div>
        <div class="order-sub-meta" style="margin-top: 2px;">
          Phân loại: <strong>${loaiSPLabel}</strong> &nbsp;&bull;&nbsp; 
          Hạn giao hàng: <strong style="color: #b91c1c;">${hanGiaoHienThi}</strong> &nbsp;&bull;&nbsp; 
          Ngày kiểm đếm: <strong>${ngayKiemDemHienThi}</strong>
        </div>
      </div>

      <!-- Khối Đơn Vị Gia Công Phụ Trách Đơn Hàng (Đóng khung nổi bật riêng biệt) -->
      <div class="gia-cong-box-outer">
        <div class="gc-header-tag">
          🧵 ĐƠN VỊ GIA CÔNG PHỤ TRÁCH ĐƠN HÀNG:
        </div>
        <div class="gc-list-compact">
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">🎨 In / Thêu:</span>
            <strong style="color: #0f172a;">${xuongInTheuTen}</strong>
          </div>
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">🧵 ${isBo ? "May Áo:" : "Xưởng May:"}</span>
            <strong style="color: #1e40af;">${xuongMayAoTen}</strong>
          </div>
          ${isBo ? `
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">🩳 May Quần:</span>
            <strong style="color: #6b21a8;">${xuongMayQuanTen}</strong>
          </div>
          ` : `
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">✂️ Tổ Cắt:</span>
            <strong style="color: #047857;">${lc.phuTrachCat || "Xưởng nhà"}</strong>
          </div>
          `}
        </div>
      </div>
    </div>

    <!-- KHỐI 6 Ô TÓM TẮT THÔNG SỐ KỸ THUẬT GỌN GÀNG -->
    <div class="summary-cards-grid">
      <div class="summary-card-box">
        <div class="card-label">📦 Số lượng phiếu</div>
        <div class="card-value">${tongSLKeHoach.toLocaleString("vi-VN")} <span style="font-size: 10px; font-weight: normal; color: #64748b;">${donViTinh.toLowerCase()}</span></div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">⚖️ Tổng ký chuẩn</div>
        <div class="card-value">${tongKgThucTe > 0 ? (tongKgThucTe * 0.98).toFixed(1) + " kg" : "...... kg"}</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">📊 Tổng ký thực tế</div>
        <div class="card-value">${tongKgThucTe > 0 ? tongKgThucTe.toFixed(1) + " kg" : "...... kg"}</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">🎨 Tổng số màu</div>
        <div class="card-value">${tongSoMau} <span style="font-size: 10px; font-weight: normal; color: #64748b;">màu</span></div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">📏 Tỉ lệ size</div>
        <div class="card-value">${tiLeSizeDisplay}</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">⚖️ Định mức (kg/SP)</div>
        <div class="card-value">${dinhMucBinhQuan ? dinhMucBinhQuan + " kg" : "...... kg"}</div>
      </div>
    </div>

    <!-- BẢNG 1: KIỂM ĐẾM SỐ LƯỢNG ÁO (ẢNH TO RÕ NÉT - CỘT THỰC NHẬN & GHI CHÚ ĐỂ TRỐNG CHO GHI TAY) -->
    <div class="section-header blue">
      ${isBo ? "1. BẢNG KIỂM ĐẾM SỐ LƯỢNG ÁO (THEO MÀU & SIZE)" : "1. BẢNG KIỂM ĐẾM SỐ LƯỢNG SẢN PHẨM (THEO MÀU & SIZE)"}
    </div>
    <table class="table-custom">
      <thead>
        <tr>
          <th rowspan="2" style="width: 3.5%; font-size: 10.5px; padding: 3px 2px;">STT</th>
          <th rowspan="2" style="width: 24%; font-size: 10.5px; padding: 3px 4px;">Ảnh Mẫu & Màu Sắc Áo</th>
          <th rowspan="2" style="width: 9%; font-size: 10.5px; padding: 3px 2px;">Tỷ lệ size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 3px 2px;">Kế hoạch</th>
          <th colspan="${allSizes.length}" style="font-size: 10.5px; padding: 3px 2px;">Chi tiết số lượng Áo theo Size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 3px 2px;">Thực nhận</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 3px 2px;">SL Đạt</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 3px 2px;">Lỗi/Hụt</th>
          <th rowspan="2" style="width: 13.5%; font-size: 10.5px; padding: 3px 4px;">Ghi chú</th>
        </tr>
        <tr>
          ${allSizes.map(sz => `<th style="width: ${Math.max(4, Math.floor(20 / allSizes.length))}%; font-size: 10.5px; padding: 2px 2px;">${sz}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rowsAoHTML}
        <!-- Dòng Tổng Kết Áo -->
        <tr style="background: #f1f5f9; font-weight: bold;">
          <td colspan="3" class="text-center font-bold text-slate-800" style="font-size: 11.5px; padding: 2.5px 3px;">TỔNG CỘNG ÁO:</td>
          <td class="text-right font-black text-slate-900" style="font-size: 13px; padding: 2.5px 3px;">${sumKeHoachAo.toLocaleString("vi-VN")}</td>
          ${totalCellsAoHTML}
          <!-- Ô Tổng Thực Nhận Để Trống Cho Nhân Sự Tự Chốt Tay -->
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center text-[10.5px] text-slate-600 font-bold">Tổng hợp Áo</td>
        </tr>
      </tbody>
    </table>

    ${isBo ? `
    <!-- BẢNG 2: KIỂM ĐẾM SỐ LƯỢNG QUẦN (RÚT GỌN - KHÔNG CẦN HÌNH ẢNH ĐỂ TIẾT KIỆM KHÔNG GIAN) -->
    <div class="section-header purple">
      2. BẢNG KIỂM ĐẾM SỐ LƯỢNG QUẦN (THEO MÀU & SIZE)
    </div>
    <table class="table-custom table-quan">
      <thead>
        <tr>
          <th rowspan="2" style="width: 3.5%; font-size: 10.5px; padding: 2.5px 2px;">STT</th>
          <th rowspan="2" style="width: 24%; font-size: 10.5px; padding: 2.5px 4px;">Màu Sắc & Vải Quần</th>
          <th rowspan="2" style="width: 9%; font-size: 10.5px; padding: 2.5px 2px;">Tỷ lệ size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 2.5px 3px;">Kế hoạch</th>
          <th colspan="${allSizes.length}" style="font-size: 10.5px; padding: 2.5px 3px;">Chi tiết số lượng Quần theo Size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 2.5px 2px;">Thực nhận</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 2.5px 2px;">SL Đạt</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 2.5px 2px;">Lỗi/Hụt</th>
          <th rowspan="2" style="width: 13.5%; font-size: 10.5px; padding: 2.5px 4px;">Ghi chú</th>
        </tr>
        <tr>
          ${allSizes.map(sz => `<th style="width: ${Math.max(4, Math.floor(20 / allSizes.length))}%; font-size: 10.5px; padding: 2px 2px;">${sz}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rowsQuanHTML}
        <!-- Dòng Tổng Kết Quần -->
        <tr style="background: #faf5ff; font-weight: bold;">
          <td colspan="3" class="text-center font-bold text-purple-900" style="font-size: 11.5px; padding: 2.5px 3px;">TỔNG CỘNG QUẦN:</td>
          <td class="text-right font-black text-purple-950" style="font-size: 13px; padding: 2.5px 3px;">${sumKeHoachQuan.toLocaleString("vi-VN")}</td>
          ${totalCellsQuanHTML}
          <!-- Ô Tổng Thực Nhận Để Trống Cho Nhân Sự Tự Chốt Tay -->
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center text-[10.5px] text-purple-900 font-bold">Tổng hợp Quần</td>
        </tr>
      </tbody>
    </table>
    ` : ''}

    <!-- BẢNG 3: THEO DÕI TIẾN TRÌNH CÁC KHÂU & SẢN LƯỢNG (CHỮ LỚN RÕ NÉT, CÓ DÒNG ĐẾM SL GIA CÔNG Ở STT 1) -->
    <div class="section-header dark" style="font-size: 11.5px; margin: 4px 0 2.5px 0;">
      ${isBo ? "3" : "2"}. THEO DÕI CÁC KHÂU & SẢN LƯỢNG (ĐỐI CHIẾU TIẾN TRÌNH TỪNG MÀU)
    </div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 4%; font-size: 11px; padding: 3px 2px;">STT</th>
          <th style="width: 32%; font-size: 11px; padding: 3px 4px;">Khâu / Công Đoạn Theo Dõi</th>
          ${mauHeadersHTML}
          <th style="width: 13%; font-size: 11px; padding: 3px 3px;">Tổng (${donViTinh})</th>
          <th style="width: 17%; font-size: 11px; padding: 3px 3px;">Ký tên / Xác nhận</th>
        </tr>
      </thead>
      <tbody>
        ${tienTrinhRowsHTML}
      </tbody>
    </table>

    <!-- Khối 3 Chữ Ký Biên Bản & Ngày Tháng Xác Nhận (ĐÃ TỐI ƯU GỌN GÀNG NẰM TRỌN TRÊN 1 TRANG A4) -->
    <div class="date-header-above-sig">
      ${ngayThangNamHienTai}
    </div>
    <table class="signatures-table page-break-avoid">
      <tr>
        <td>
          <div class="sig-title">NGƯỜI KIỂM ĐẾM / QC</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${opts.nguoiKiemDem || "Tổ Kiểm Đếm / QC"}</div>
        </td>
        <td>
          <div class="sig-title">ĐẠI DIỆN BÊN GIAO (XƯỞNG GIA CÔNG)</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${xuongMayAoTen || "Đại diện xưởng"}</div>
        </td>
        <td>
          <div class="sig-title">ĐẠI DIỆN BÊN NHẬN (GIÀU SANG)</div>
          <div class="sig-sub">(Ký, đóng dấu xác nhận)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${opts.daiDienPhapLuat || "Hồ Minh Sang"}</div>
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
      setTimeout(triggerPrint, 1000);
    };
  </script>
</body>
</html>`;
}

/**
 * Mở cửa sổ in Phiếu Kiểm Đếm & Theo Dõi Giao Nhận trên trình duyệt
 */
export function inPhieuKiemDemA4(
  lc: Parameters<typeof generatePhieuKiemDemA4HTML>[0],
  customOptions?: PhieuKiemDemPrintOptions
): boolean {
  if (typeof window === "undefined") return false;

  const html = generatePhieuKiemDemA4HTML(lc, customOptions);
  const win = window.open("", "_blank", "width=980,height=1080");
  if (!win) {
    return false;
  }
  win.document.write(html);
  win.document.close();
  return true;
}
