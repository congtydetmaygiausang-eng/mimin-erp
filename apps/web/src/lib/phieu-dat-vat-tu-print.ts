import type { KeHoach30NgayItem } from "./data/ke-hoach-30-ngay-store";
import { gomVatTuCanDat } from "./data/ke-hoach-30-ngay-store";

export interface PhieuDatVatTuOptions {
  tenCongTy?: string;
  mst?: string;
  diaChi?: string;
  hotline?: string;
  nguoiLap?: string;
  ngayLap?: string;
}

const DEFAULT_OPTIONS: PhieuDatVatTuOptions = {
  tenCongTy: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
  mst: "0318507560",
  diaChi: "12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP. Hồ Chí Minh",
  hotline: "0774480916",
  nguoiLap: "Hồ Minh Sang",
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function generatePhieuDatVatTuHTML(
  items: KeHoach30NgayItem[],
  customOptions?: PhieuDatVatTuOptions
): string {
  const opt = { ...DEFAULT_OPTIONS, ...customOptions };
  const { vai, phuLieu } = gomVatTuCanDat(items);
  const ngay = opt.ngayLap || new Date().toLocaleDateString("vi-VN");
  const tongSP = items.reduce((s, i) => s + i.slKeHoach, 0);

  const vaiRows = vai
    .map(
      (v, idx) => `
      <tr>
        <td class="stt">${idx + 1}</td>
        <td>${escapeHtml(v.ten)}</td>
        <td class="num">${v.soLuong.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}</td>
        <td>${v.donVi}</td>
        <td class="ghi-chu"></td>
      </tr>`
    )
    .join("");

  const plRows = phuLieu
    .map(
      (p, idx) => `
      <tr>
        <td class="stt">${idx + 1}</td>
        <td>${escapeHtml(p.ten)}</td>
        <td class="num">${p.soLuong.toLocaleString("vi-VN")}${
          p.soLuongKg !== undefined
            ? ` <span style="color:#64748b;font-weight:400;">(≈ ${p.soLuongKg.toLocaleString("vi-VN", { maximumFractionDigits: 3 })} kg)</span>`
            : ""
        }</td>
        <td>${p.donVi}</td>
        <td class="ghi-chu"></td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<title>Phiếu Đặt Vật Tư - ${ngay}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
  .company h1 { font-size: 16px; margin: 0 0 2px; color: #0f766e; }
  .company p { font-size: 11px; margin: 1px 0; color: #475569; }
  .title { text-align: right; }
  .title h2 { font-size: 20px; margin: 0; color: #0f172a; letter-spacing: 0.5px; }
  .title p { font-size: 11px; margin: 2px 0 0; color: #64748b; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 14px; }
  .meta b { color: #0f172a; }
  h3.section { background: #0f766e; color: #fff; font-size: 13px; padding: 6px 10px; border-radius: 6px 6px 0 0; margin: 18px 0 0; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  thead th { background: #f0fdfa; border: 1px solid #99f6e4; padding: 6px 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #0f766e; }
  tbody td { border: 1px solid #cbd5e1; padding: 6px 8px; }
  td.stt { text-align: center; width: 36px; color: #94a3b8; }
  td.num { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
  td.ghi-chu { width: 120px; }
  .empty { padding: 14px; text-align: center; color: #94a3b8; border: 1px dashed #cbd5e1; font-size: 12px; }
  .footer { display: flex; justify-content: space-between; margin-top: 36px; font-size: 12px; }
  .footer .sign { text-align: center; width: 180px; }
  .footer .sign .line { margin-top: 56px; border-top: 1px solid #94a3b8; padding-top: 4px; font-weight: 700; }
  .btn-print { position: fixed; top: 10px; right: 10px; background: #0f766e; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
  @media print { .btn-print { display: none; } }
</style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">🖨️ In Phiếu Đặt Vật Tư (Ctrl+P)</button>

  <div class="header">
    <div class="company">
      <h1>${escapeHtml(opt.tenCongTy || "")}</h1>
      <p>MST: ${escapeHtml(opt.mst || "")}</p>
      <p>${escapeHtml(opt.diaChi || "")}</p>
      <p>Hotline: ${escapeHtml(opt.hotline || "")}</p>
    </div>
    <div class="title">
      <h2>PHIẾU ĐẶT VẬT TƯ</h2>
      <p>Theo Kế Hoạch Sản Xuất 30 Ngày</p>
    </div>
  </div>

  <div class="meta">
    <span>Ngày lập: <b>${ngay}</b></span>
    <span>Người lập: <b>${escapeHtml(opt.nguoiLap || "")}</b></span>
    <span>Tổng SL kế hoạch: <b>${tongSP.toLocaleString("vi-VN")} SP</b></span>
  </div>

  <h3 class="section">I. VẢI CHÍNH CẦN ĐẶT</h3>
  ${
    vaiRows
      ? `<table><thead><tr><th>STT</th><th>Màu / Mã vải</th><th>Số lượng</th><th>ĐVT</th><th>Ghi chú</th></tr></thead><tbody>${vaiRows}</tbody></table>`
      : `<div class="empty">Chưa có dòng kế hoạch nào cần vải chính</div>`
  }

  <h3 class="section">II. PHỤ LIỆU CẦN ĐẶT</h3>
  ${
    plRows
      ? `<table><thead><tr><th>STT</th><th>Tên phụ liệu</th><th>Số lượng</th><th>ĐVT</th><th>Ghi chú</th></tr></thead><tbody>${plRows}</tbody></table>`
      : `<div class="empty">Chưa có dòng kế hoạch nào cần phụ liệu</div>`
  }

  <div class="footer">
    <div class="sign"><div class="line">Người lập phiếu</div></div>
    <div class="sign"><div class="line">Phụ trách kho / NCC</div></div>
    <div class="sign"><div class="line">Giám đốc duyệt</div></div>
  </div>

  <script>
    window.onload = function () {
      setTimeout(function () {}, 100);
    };
  </script>
</body>
</html>`;
}

export function inPhieuDatVatTu(
  items: KeHoach30NgayItem[],
  customOptions?: PhieuDatVatTuOptions
): boolean {
  if (typeof window === "undefined") return false;
  const html = generatePhieuDatVatTuHTML(items, customOptions);
  const win = window.open("", "_blank", "width=980,height=1080");
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
