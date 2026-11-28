const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\POLOMIMIN\\.gemini\\antigravity\\brain\\6d876684-63ab-4763-ad44-fc7f42b62710';
const OUT_DIR = path.resolve(__dirname, '../public/downloads/phieu-kiem-dem');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// Danh sách 9 phiếu gia nhận hàng gia công MANPJ
const PHIEU_LIST = [
  {
    id: 'LC-2026-0333',
    maSP: 'M333',
    tenSP: 'BỘ TRỤ PHỐI NGỰC BÀN 195',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-11-03',
    ngayTao: '2026-10-25',
    phuTrachCat: 'Bàn 195',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 195 - M333',
    aoXuong: 'Xưởng may trụ chị Tý Sơn',
    quanXuong: 'Xưởng may quần chị Hương',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M333.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M333-quan.jpg'),
  },
  {
    id: 'LC-2026-0331',
    maSP: 'M331',
    tenSP: 'BỘ TRỤ PHỐI TAY LOGO P BÀN 195',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-11-03',
    ngayTao: '2026-10-25',
    phuTrachCat: 'Bàn 195',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 195 - M331',
    aoXuong: 'Xưởng may trụ chị Tý Sơn',
    quanXuong: 'Xưởng may quần chị Hương',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M331.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M331-quan.jpg'),
  },
  {
    id: 'LC-2026-0336',
    maSP: 'M336',
    tenSP: 'BỘ TRỤ HEBOZ BÀN 188',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-10-26',
    ngayTao: '2026-10-18',
    phuTrachCat: 'Bàn 188',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 188 - M336',
    aoXuong: 'Xưởng may trụ anh Thông',
    quanXuong: 'Xưởng may quần anh Thơ',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M336.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M336-quan.jpg'),
  },
  {
    id: 'LC-2026-0337',
    maSP: 'M337',
    tenSP: 'BỘ TRỤ SỌC NGỰC BÀN 188',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-10-26',
    ngayTao: '2026-10-18',
    phuTrachCat: 'Bàn 188',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 188 - M337',
    aoXuong: 'Xưởng may trụ anh Thông',
    quanXuong: 'Xưởng may quần anh Thơ',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M337.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M337-quan.jpg'),
  },
  {
    id: 'LC-2026-0334',
    maSP: 'M334',
    tenSP: 'BỘ TRỤ ZIP KÉO KHÓA BÀN 197',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-11-03',
    ngayTao: '2026-10-25',
    phuTrachCat: 'Bàn 197',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 197 - M334',
    aoXuong: 'Xưởng may trụ anh Thông',
    quanXuong: 'Xưởng may quần anh Thơ',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M334.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M334-quan.jpg'),
  },
  {
    id: 'LC-2026-0335',
    maSP: 'M335',
    tenSP: 'BỘ TRỤ BO CỔ VIỀN BÀN 197',
    loaiSP: 'BoTru',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-11-03',
    ngayTao: '2026-10-25',
    phuTrachCat: 'Bàn 197',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 197 - M335',
    aoXuong: 'Xưởng may trụ anh Thông',
    quanXuong: 'Xưởng may quần anh Thơ',
    inXuong: 'Xưởng thêu anh Vui',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M335.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M335-quan.jpg'),
  },
  {
    id: 'LC-2026-0327',
    maSP: 'M327',
    tenSP: 'BỘ TRÒN SỌC TAY BÀN 192',
    loaiSP: 'BoCoTron',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-10-26',
    ngayTao: '2026-10-18',
    phuTrachCat: 'Bàn 192',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 192 - M327',
    aoXuong: 'Xưởng may tròn Vân Anh',
    quanXuong: 'Xưởng may quần chị Dung',
    inXuong: 'Xưởng in/dập Thanh Sơn',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M327.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M327-quan.jpg'),
  },
  {
    id: 'LC-2026-0305',
    maSP: 'M305',
    tenSP: 'BỘ TRÒN PHỐI TAY BÀN 192',
    loaiSP: 'BoCoTron',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-10-26',
    ngayTao: '2026-10-18',
    phuTrachCat: 'Bàn 192',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 192 - M305',
    aoXuong: 'Xưởng may tròn Vân Anh',
    quanXuong: 'Xưởng may quần chị Dung',
    inXuong: 'Xưởng in/dập Thanh Sơn',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M305.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M305-quan.jpg'),
  },
  {
    id: 'LC-2026-0292',
    maSP: 'M292',
    tenSP: 'BỘ TRÒN RAGLAN LA BÀN 194',
    loaiSP: 'BoCoTron',
    loaiLenh: 'HangDat',
    khachHang: 'MANPJ / POLOMIMIN',
    tongSL: 400,
    tiLeSize: '1:1:1:1',
    hanHoanThanh: '2026-10-24',
    ngayTao: '2026-10-16',
    phuTrachCat: 'Bàn 194',
    phuTrachSX: 'Hồ Minh Sang',
    ghiChu: 'Theo Phiếu Giao Nhận Gia Công Bàn 194 - M292',
    aoXuong: 'Xưởng may anh Long',
    quanXuong: 'Xưởng may quần chị Dung',
    inXuong: 'Xưởng in/dập Thanh Sơn',
    imgAoFile: path.resolve(__dirname, '../public/product-models/M292.jpg'),
    imgQuanFile: path.resolve(__dirname, '../public/product-models/M292-quan.jpg'),
  }
];

// 5 màu chuẩn theo bảng trên phiếu: MÀU ĐEN, MÀU XANH ĐEN, MÀU DA, MÀU RÊU, MÀU XÁM
const MAU_LIST = [
  { ten: 'MÀU ĐEN', hex: '#1e293b', border: '#0f172a', text: '#ffffff', short: 'ĐEN', sl: 80 },
  { ten: 'MÀU XANH ĐEN', hex: '#0f172a', border: '#1e3a8a', text: '#ffffff', short: 'X.ĐEN', sl: 80 },
  { ten: 'MÀU DA', hex: '#fed7aa', border: '#f97316', text: '#7c2d12', short: 'DA', sl: 80 },
  { ten: 'MÀU RÊU', hex: '#3f6212', border: '#15803d', text: '#ffffff', short: 'RÊU', sl: 80 },
  { ten: 'MÀU XÁM', hex: '#94a3b8', border: '#64748b', text: '#0f172a', short: 'XÁM', sl: 80 },
];

const SIZES = ['L', 'XL', '2XL', '3XL'];

function fileToBase64(filePath) {
  if (!fs.existsSync(filePath)) return '';
  const ext = path.extname(filePath).slice(1) || 'jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

function generateHTML(order) {
  const isBo = true;
  const donViTinh = 'Bộ';
  const imgAoDataUrl = fileToBase64(order.imgAoFile);
  const imgQuanDataUrl = fileToBase64(order.imgQuanFile);

  const imgW = 46;
  const imgH = 50;
  const rowPadY = '2px';
  const sigSpaceH = 8;

  // Render Rows Áo
  let sumKeHoachAo = 0;
  const rowsAoHTML = MAU_LIST.map((mau, idx) => {
    const stt = idx + 1;
    const slPerSize = mau.sl / SIZES.length;
    sumKeHoachAo += mau.sl;

    const sizeCells = SIZES.map(sz => 
      `<td class="text-center font-bold" style="background: #f8fafc; color: #0f172a; font-size: 12.5px; padding: ${rowPadY} 3px;">${slPerSize}</td>`
    ).join('');

    const imgTag = imgAoDataUrl 
      ? `<img src="${imgAoDataUrl}" class="img-preview-large" style="width:${imgW}px;height:${imgH}px;" />`
      : `<div class="color-badge-large" style="width:${imgW}px;height:${imgH}px;background:${mau.hex};color:${mau.text};">${mau.short}</div>`;

    return `
      <tr>
        <td class="text-center font-bold text-slate-600" style="padding: ${rowPadY} 3px; font-size: 12px;">${stt}</td>
        <td class="text-left" style="padding: ${rowPadY} 4px;">
          <div class="color-flex-box">
            ${imgTag}
            <div class="color-info-box">
              <span class="color-name-main">${mau.ten}</span>
              <span class="color-sku-tag">${order.maSP}-${mau.short}</span>
            </div>
          </div>
        </td>
        <td class="text-center text-xs font-mono font-bold text-slate-700" style="padding: ${rowPadY} 3px; font-size: 12px;">1:1:1:1</td>
        <td class="text-right font-black text-slate-900" style="font-size: 13.5px; padding: ${rowPadY} 4px;">${mau.sl}</td>
        ${sizeCells}
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-left bg-white"><div class="blank-write-note"></div></td>
      </tr>
    `;
  }).join('');

  const totalCellsAoHTML = SIZES.map(() => 
    `<td class="text-center font-black text-slate-900 bg-slate-100" style="font-size: 12px; padding: 2.5px 3px;">100</td>`
  ).join('');

  // Render Rows Quần (Rút gọn)
  let sumKeHoachQuan = 0;
  const rowsQuanHTML = MAU_LIST.map((mau, idx) => {
    const stt = idx + 1;
    const slPerSize = mau.sl / SIZES.length;
    sumKeHoachQuan += mau.sl;

    const sizeCells = SIZES.map(sz => 
      `<td class="text-center font-bold" style="background: #faf5ff; color: #581c87; font-size: 12.5px; padding: ${rowPadY} 3px;">${slPerSize}</td>`
    ).join('');

    return `
      <tr class="row-quan-compact">
        <td class="text-center font-bold text-slate-600" style="padding: ${rowPadY} 3px; font-size: 12px;">${stt}</td>
        <td class="text-left" style="padding: ${rowPadY} 4px;">
          <div class="quan-color-pill">
            <span class="color-dot" style="background-color: ${mau.hex}; border-color: ${mau.border};"></span>
            <div>
              <span class="quan-color-title">${mau.ten}</span>
              <span class="quan-fabric-tag">VẢI QUẦN (CHỜ BỔ SUNG)</span>
            </div>
          </div>
        </td>
        <td class="text-center text-xs font-mono font-bold text-slate-700" style="padding: ${rowPadY} 3px; font-size: 12px;">1:1:1:1</td>
        <td class="text-right font-black text-purple-950" style="font-size: 13.5px; padding: ${rowPadY} 4px;">${mau.sl}</td>
        ${sizeCells}
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
        <td class="text-left bg-white"><div class="blank-write-note"></div></td>
      </tr>
    `;
  }).join('');

  const totalCellsQuanHTML = SIZES.map(() => 
    `<td class="text-center font-black text-purple-950 bg-purple-50" style="font-size: 12px; padding: 2.5px 3px;">100</td>`
  ).join('');

  // Table 3: Tiến trình các khâu
  const mauHeadersHTML = MAU_LIST.map(m => `<th style="font-size: 11px; padding: 2.5px 2px;" class="text-center font-bold">${m.short}</th>`).join('');
  const mauBlankCellsHTML = MAU_LIST.map(() => `<td class="text-center font-mono text-slate-300" style="font-size: 11.5px; padding: 2.5px 2px;">......</td>`).join('');

  const tienTrinhRows = [
    { stt: 1, icon: '🚚', ten: 'Đếm số lượng gia công', note: 'Xưởng gia công bàn giao' },
    { stt: 2, icon: '🏷️', ten: 'Khuy nút', note: 'Đơm khuy, đóng nút' },
    { stt: 3, icon: '⚠️', ten: 'Lỗi khuy nút', note: 'Lỗi khuy, bung cúc', isError: true },
    { stt: 4, icon: '🔥', ten: 'Ủi', note: 'Ủi định hình phẳng đẹp' },
    { stt: 5, icon: '⚠️', ten: 'Lỗi ủi', note: 'Ủi cháy, bóng vải, nhăn', isError: true },
    { stt: 6, icon: '📦', ten: 'Đóng gói', note: 'Gấp xếp bao bì, dán nhãn' },
    { stt: 7, icon: '⚠️', ten: 'Lỗi đóng gói', note: 'Sai size, rách bao, dơ', isError: true },
    { stt: 8, icon: '📥', ten: 'Nhập kho thành phẩm', note: 'Hoàn tất kiểm đếm nhập kho', isFinal: true },
  ];

  const tienTrinhRowsHTML = tienTrinhRows.map(r => {
    const rowClass = r.isError ? 'row-error' : r.isFinal ? 'row-final font-bold' : '';
    return `
      <tr class="${rowClass}">
        <td class="text-center text-slate-500 font-bold" style="padding: 2.5px 2px; font-size: 11.5px;">${r.stt}</td>
        <td class="text-left font-bold text-slate-800" style="padding: 2.5px 4px; font-size: 11.5px;">
          <span class="row-icon">${r.icon}</span> ${r.ten}
        </td>
        ${mauBlankCellsHTML}
        <td class="text-right font-mono font-bold ${r.isFinal ? 'text-blue-900 bg-blue-50/50' : 'text-slate-300'}" style="padding: 2.5px 3px; font-size: 11.5px;">......</td>
        <td class="text-center text-xs text-slate-300" style="padding: 2.5px 3px; font-size: 10px;">................</td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Phiếu Kiểm Đếm & Theo Dõi - [${order.maSP}] ${order.id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 3mm 4.5mm 2.5mm 4.5mm;
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
      padding: 2mm 3.5mm;
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
      border-radius: 4px;
      position: relative;
    }
    .order-banner-card {
      border: 1.5px solid #0f172a;
      border-radius: 5px;
      padding: 3.5px 7px;
      margin-bottom: 3.5px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .order-left-info { flex: 1; min-width: 0; }
    .order-title-line {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }
    .badge-lenh-cat {
      background: #0f172a;
      color: #ffffff;
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      padding: 2px 6px;
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
    .gia-cong-box-outer {
      border: 1.5px solid #2563eb;
      background: #eff6ff;
      border-radius: 5px;
      padding: 3px 6px;
      min-width: 245px;
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
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid #bfdbfe;
    }
    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 3.5px;
      margin-bottom: 3.5px;
    }
    .summary-card-box {
      border: 1.2px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px 3px;
      background: #f8fafc;
      text-align: center;
    }
    .card-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 800;
      text-transform: uppercase;
    }
    .card-value {
      font-size: 13px;
      font-weight: 900;
      color: #0f172a;
      font-family: monospace;
      margin-top: 1px;
    }
    .section-header {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      margin: 3px 0 1.5px 0;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .section-header.blue { color: #1e40af; }
    .section-header.purple { color: #6b21a8; }
    .section-header.dark { color: #0f172a; }

    .table-custom {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      margin-bottom: 3px;
    }
    .table-custom th, .table-custom td {
      border: 1px solid #94a3b8;
      padding: 2px 3px;
    }
    .table-custom th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 800;
      text-align: center;
      font-size: 10px;
    }
    .table-custom.table-quan th {
      background: #faf5ff;
      color: #581c87;
      border-color: #c084fc;
    }
    .table-custom td.text-center { text-align: center; }
    .table-custom td.text-right { text-align: right; padding-right: 4px; }
    .table-custom td.text-left { text-align: left; padding-left: 4px; }

    .color-flex-box {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 1px 0;
    }
    .img-preview-large {
      width: ${imgW}px;
      height: ${imgH}px;
      object-fit: cover;
      border-radius: 4px;
      border: 1.2px solid #cbd5e1;
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
    }
    .color-info-box {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      text-align: left;
    }
    .color-name-main {
      font-weight: 900;
      font-size: 12px;
      color: #0f172a;
    }
    .color-sku-tag {
      font-size: 9px;
      color: #64748b;
      font-family: monospace;
      margin-top: 1px;
    }

    .row-quan-compact td { padding: 2px 3px; }
    .quan-color-pill {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .color-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      display: inline-block;
      border: 1.2px solid #94a3b8;
    }
    .quan-color-title {
      font-weight: 900;
      font-size: 12px;
      color: #4c1d95;
    }
    .quan-fabric-tag {
      font-size: 8.5px;
      color: #6b21a8;
      font-family: monospace;
    }

    .blank-write-cell {
      min-height: 14px;
      width: 100%;
      background: #ffffff;
      border-radius: 2px;
    }
    .blank-write-note {
      min-height: 14px;
      width: 100%;
      background: #ffffff;
    }

    .row-error { background: #fff1f2; color: #be123c; }
    .row-final { background: #f0fdf4; color: #166534; }
    .row-icon { font-size: 11px; display: inline-block; width: 14px; text-align: center; }

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
      font-size: 9px;
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
    @media print {
      body { background: white !important; padding: 0 !important; }
      .page-container { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- KHỐI BANNER ĐƠN HÀNG -->
    <div class="order-banner-card">
      <div class="order-left-info">
        <div class="order-title-line">
          <span class="badge-lenh-cat">${order.id}</span>
          <span>PHIẾU KIỂM ĐẾM & THEO DÕI</span>
        </div>
        <div style="margin-top: 2px;">
          <span style="font-weight: 800; font-size: 11px; color: #475569;">Mã Sản Phẩm:</span>
          <span class="sp-highlight">[${order.maSP}] ${order.tenSP.replace(`[${order.maSP}] `, '')}</span>
        </div>
        <div class="order-sub-meta">
          <span>Phân loại: <strong>${order.loaiSP === 'BoTru' ? 'Bộ Trụ' : 'Bộ Cổ Tròn'}</strong></span>
          <span style="margin: 0 5px; color: #94a3b8;">•</span>
          <span>Hạn giao hàng: <strong style="color: #b91c1c;">${order.hanHoanThanh}</strong></span>
          <span style="margin: 0 5px; color: #94a3b8;">•</span>
          <span>Ngày kiểm đếm: <strong>21/11/2026</strong></span>
        </div>
      </div>
      <div class="gia-cong-box-outer">
        <div class="gc-header-tag">🧵 ĐƠN VỊ GIA CÔNG PHỤ TRÁCH ĐƠN HÀNG:</div>
        <div class="gc-list-compact">
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">🎨 In / Thêu:</span>
            <strong style="color: #1e40af;">${order.inXuong}</strong>
          </div>
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">👕 May Áo:</span>
            <strong style="color: #0f172a;">${order.aoXuong}</strong>
          </div>
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">👖 May Quần:</span>
            <strong style="color: #6b21a8;">${order.quanXuong}</strong>
          </div>
          <div class="gc-item-line">
            <span style="color: #64748b; font-weight: 700;">✂️ Tổ Cắt:</span>
            <strong style="color: #047857;">${order.phuTrachCat}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- KHỐI 6 Ô TÓM TẮT THÔNG SỐ KỸ THUẬT -->
    <div class="summary-cards-grid">
      <div class="summary-card-box">
        <div class="card-label">📦 Số lượng phiếu</div>
        <div class="card-value">400 <span style="font-size: 10px; font-weight: normal; color: #64748b;">bộ</span></div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">⚖️ Tổng ký chuẩn</div>
        <div class="card-value">...... kg</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">📊 Tổng ký thực tế</div>
        <div class="card-value">...... kg</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">🎨 Tổng số màu</div>
        <div class="card-value">5 <span style="font-size: 10px; font-weight: normal; color: #64748b;">màu</span></div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">📏 Tỉ lệ size</div>
        <div class="card-value">1:1:1:1</div>
      </div>
      <div class="summary-card-box">
        <div class="card-label">⚖️ Định mức (kg/SP)</div>
        <div class="card-value">0.260 kg</div>
      </div>
    </div>

    <!-- BẢNG 1: KIỂM ĐẾM SỐ LƯỢNG ÁO -->
    <div class="section-header blue">
      1. BẢNG KIỂM ĐẾM SỐ LƯỢNG ÁO (THEO MÀU & SIZE)
    </div>
    <table class="table-custom">
      <thead>
        <tr>
          <th rowspan="2" style="width: 3.5%; font-size: 10.5px; padding: 3px 2px;">STT</th>
          <th rowspan="2" style="width: 24%; font-size: 10.5px; padding: 3px 4px;">Ảnh Mẫu & Màu Sắc Áo</th>
          <th rowspan="2" style="width: 9%; font-size: 10.5px; padding: 3px 2px;">Tỷ lệ size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 3px 2px;">Kế hoạch</th>
          <th colspan="4" style="font-size: 10.5px; padding: 3px 2px;">Chi tiết số lượng Áo theo Size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 3px 2px;">Thực nhận</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 3px 2px;">SL Đạt</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 3px 2px;">Lỗi/Hụt</th>
          <th rowspan="2" style="width: 13.5%; font-size: 10.5px; padding: 3px 4px;">Ghi chú</th>
        </tr>
        <tr>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">L</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">XL</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">2XL</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">3XL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsAoHTML}
        <tr style="background: #f1f5f9; font-weight: bold;">
          <td colspan="3" class="text-center font-bold text-slate-800" style="font-size: 11.5px; padding: 2.5px 3px;">TỔNG CỘNG ÁO:</td>
          <td class="text-right font-black text-slate-900" style="font-size: 13px; padding: 2.5px 3px;">${sumKeHoachAo}</td>
          ${totalCellsAoHTML}
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center text-[10.5px] text-slate-600 font-bold">Tổng hợp Áo</td>
        </tr>
      </tbody>
    </table>

    <!-- BẢNG 2: KIỂM ĐẾM SỐ LƯỢNG QUẦN (RÚT GỌN - ĐỂ TRỐNG VẢI QUẦN THEO YÊU CẦU) -->
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
          <th colspan="4" style="font-size: 10.5px; padding: 2.5px 3px;">Chi tiết số lượng Quần theo Size</th>
          <th rowspan="2" style="width: 8%; font-size: 10.5px; padding: 2.5px 2px;">Thực nhận</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 2.5px 2px;">SL Đạt</th>
          <th rowspan="2" style="width: 7%; font-size: 10.5px; padding: 2.5px 2px;">Lỗi/Hụt</th>
          <th rowspan="2" style="width: 13.5%; font-size: 10.5px; padding: 2.5px 4px;">Ghi chú</th>
        </tr>
        <tr>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">L</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">XL</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">2XL</th>
          <th style="width: 5%; font-size: 10.5px; padding: 2px 2px;">3XL</th>
        </tr>
      </thead>
      <tbody>
        ${rowsQuanHTML}
        <tr style="background: #faf5ff; font-weight: bold;">
          <td colspan="3" class="text-center font-bold text-purple-900" style="font-size: 11.5px; padding: 2.5px 3px;">TỔNG CỘNG QUẦN:</td>
          <td class="text-right font-black text-purple-950" style="font-size: 13px; padding: 2.5px 3px;">${sumKeHoachQuan}</td>
          ${totalCellsQuanHTML}
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center bg-white"><div class="blank-write-cell"></div></td>
          <td class="text-center text-[10.5px] text-purple-900 font-bold">Tổng hợp Quần</td>
        </tr>
      </tbody>
    </table>

    <!-- BẢNG 3: THEO DÕI TIẾN TRÌNH CÁC KHÂU & SẢN LƯỢNG -->
    <div class="section-header dark" style="font-size: 11.5px; margin: 3.5px 0 2px 0;">
      3. THEO DÕI CÁC KHÂU & SẢN LƯỢNG (ĐỐI CHIẾU TIẾN TRÌNH TỪNG MÀU)
    </div>
    <table class="table-custom">
      <thead>
        <tr>
          <th style="width: 4%; font-size: 11px; padding: 2.5px 2px;">STT</th>
          <th style="width: 32%; font-size: 11px; padding: 2.5px 4px;">Khâu / Công Đoạn Theo Dõi</th>
          ${mauHeadersHTML}
          <th style="width: 13%; font-size: 11px; padding: 2.5px 3px;">Tổng (${donViTinh})</th>
          <th style="width: 17%; font-size: 11px; padding: 2.5px 3px;">Ký tên / Xác nhận</th>
        </tr>
      </thead>
      <tbody>
        ${tienTrinhRowsHTML}
      </tbody>
    </table>

    <!-- Khối 3 Chữ Ký Biên Bản -->
    <div class="date-header-above-sig">
      TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2026
    </div>
    <table class="signatures-table">
      <tr>
        <td>
          <div class="sig-title">NGƯỜI KIỂM ĐẾM / QC</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">Tổ Kiểm Đếm / QC</div>
        </td>
        <td>
          <div class="sig-title">ĐẠI DIỆN BÊN GIAO (XƯỞNG GIA CÔNG)</div>
          <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
          <div class="sig-space"></div>
          <div class="sig-name">${order.aoXuong}</div>
        </td>
        <td>
          <div class="sig-title">ĐẠI DIỆN BÊN NHẬN (GIÀU SANG)</div>
          <div class="sig-sub">(Ký, đóng dấu xác nhận)</div>
          <div class="sig-space"></div>
          <div class="sig-name">Hồ Minh Sang</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

// Chạy xử lý 9 phiếu
console.log('=== BẮT ĐẦU XỬ LÝ 9 PHIẾU KIỂM ĐẾM & THEO DÕI ===');

for (let i = 0; i < PHIEU_LIST.length; i++) {
  const ord = PHIEU_LIST[i];
  const htmlContent = generateHTML(ord);
  const htmlFile = path.join(OUT_DIR, `phieu-kiem-dem-${ord.maSP}.html`);
  fs.writeFileSync(htmlFile, htmlContent, 'utf8');

  // Tên file ảnh
  const pngName = `phieu-kiem-dem-${ord.maSP}.png`;
  const pngOutPath = path.join(OUT_DIR, pngName);
  const artifactPngPath = path.join(ARTIFACT_DIR, pngName);

  // Chụp ảnh bằng Chrome Headless (khổ A4 tỷ lệ chuẩn 794x1123 hoặc 1240x1754 để cực kỳ nét)
  const fileUrl = 'file:///' + htmlFile.replace(/\\/g, '/');
  try {
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${pngOutPath}" --window-size=1240,1754 "${fileUrl}"`);
    if (fs.existsSync(pngOutPath)) {
      fs.copyFileSync(pngOutPath, artifactPngPath);
      console.log(`[${i + 1}/9] Đã xuất ảnh A4 thành công: ${pngName} (kích thước: ${fs.statSync(pngOutPath).size} bytes)`);
    }
  } catch (err) {
    console.error(`Lỗi render ảnh phiếu ${ord.maSP}:`, err.message);
  }
}

console.log('=== HOÀN TẤT TẠO 9 FILE IN VÀ ẢNH A4 ===');
