const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageBreak,
} = require('docx');

const {
  outputDir,
  FONT_FAMILY,
  COLOR_PRIMARY,
  COLOR_MUTED,
  COLOR_BORDER,
  BG_HEADER,
  BG_ALT,
  cellBorders,
  noBorders,
  pQuocHieu,
  pDocTitle,
  pHeading1,
  pBody,
  createSignatureTable,
} = require('./docx_helpers');

function makeCell(text, widthPercent, options = {}) {
  const isHeader = !!options.isHeader;
  const runs = Array.isArray(text)
    ? text.map(t => typeof t === 'string' ? new TextRun({ text: t, font: FONT_FAMILY, size: isHeader ? 24 : 22, bold: isHeader, color: COLOR_PRIMARY }) : t)
    : [
        new TextRun({
          text: String(text || ''),
          font: FONT_FAMILY,
          size: options.size || (isHeader ? 24 : 22),
          bold: isHeader || !!options.bold,
          italics: !!options.italics,
          color: options.color || COLOR_PRIMARY,
        }),
      ];

  return new TableCell({
    borders: options.borders || cellBorders,
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: options.shading || (isHeader ? { fill: BG_HEADER } : options.isAlt ? { fill: BG_ALT } : undefined),
    children: [
      new Paragraph({
        alignment: options.alignment || (isHeader ? AlignmentType.CENTER : AlignmentType.LEFT),
        spacing: { before: 80, after: 80, line: 260 },
        children: runs,
      }),
    ],
  });
}

async function buildMergedDoc() {
  const sections = [];

  // Trang bìa & Mục lục
  sections.push({
    properties: {
      page: { margin: { top: 1418, right: 1418, bottom: 1418, left: 1418 } },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1000, after: 120 },
        children: [
          new TextRun({
            text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG',
            font: FONT_FAMILY,
            size: 32,
            bold: true,
            color: '1E3A8A',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 800 },
        children: [
          new TextRun({
            text: 'THƯƠNG HIỆU: POLOMIMIN & MAN PJ',
            font: FONT_FAMILY,
            size: 26,
            bold: true,
            color: '2563EB',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [
          new TextRun({
            text: 'TẬP TÀI LIỆU HỒ SƠ PHÁP LÝ,\nQUY TRÌNH CHUỖI CUNG ỨNG &\nHỢP ĐỒNG NGUYÊN TẮC',
            font: FONT_FAMILY,
            size: 40,
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 1000 },
        children: [
          new TextRun({
            text: '(Bản chuyển đổi Word .docx – Dành cho chỉnh sửa & nhập số liệu)',
            font: FONT_FAMILY,
            size: 24,
            italics: true,
            color: COLOR_MUTED,
          }),
        ],
      }),

      // Bảng tóm tắt mục lục
      new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [
          new TextRun({
            text: 'MỤC LỤC TÀI LIỆU:',
            font: FONT_FAMILY,
            size: 26,
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: cellBorders,
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              makeCell('PHẦN', 12, { isHeader: true }),
              makeCell('TÊN VĂN BẢN / TÀI LIỆU', 58, { isHeader: true }),
              makeCell('SỐ HIỆU / ĐỐI TÁC', 30, { isHeader: true }),
            ],
          }),
          ...[
            { phan: 'Phần 1', ten: 'Phụ lục: Phạm vi chứng nhận sản phẩm (Oeko-Tex / TCCS)', doiTac: 'GCN số 557116 (Man PJ)' },
            { phan: 'Phần 2', ten: 'Quy trình sản xuất chuỗi cung ứng khép kín từ sợi đến bán hàng', doiTac: 'QCVN 01:2017/BCT (POLOMIMIN)' },
            { phan: 'Phần 3', ten: 'Hợp đồng nguyên tắc mua bán sợi', doiTac: 'Số: 99/HĐNT/2026 (Lucky Avanti)' },
            { phan: 'Phần 4', ten: 'Hợp đồng nguyên tắc cung cấp sợi Spandex-40 & gia công dệt vải mộc', doiTac: 'Số: 02/SM-AT/2026 (Dệt Hải Dương)' },
            { phan: 'Phần 5', ten: 'Hợp đồng nguyên tắc gia công nhuộm hoàn tất vải', doiTac: 'Số: 11-2026/HĐNT-GIAUSANG (Tân Đức Khanh)' },
            { phan: 'Phần 6', ten: 'Hợp đồng nguyên tắc gia công may mặc', doiTac: 'Số: 022025/HĐGC - POLOMON (HKD Ngọc Dung)' },
            { phan: 'Phần 7', ten: 'Sơ đồ tổ chức công ty & nguyên tắc vận hành 6 khối', doiTac: 'Cơ cấu bộ máy điều hành Giàu Sang' },
          ].map((r, i) =>
            new TableRow({
              children: [
                makeCell(r.phan, 12, { alignment: AlignmentType.CENTER, bold: true, isAlt: i % 2 === 1 }),
                makeCell(r.ten, 58, { bold: true, isAlt: i % 2 === 1 }),
                makeCell(r.doiTac, 30, { isAlt: i % 2 === 1 }),
              ],
            })
          ),
        ],
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 0 },
        children: [
          new TextRun({
            text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG\nNăm 2026',
            font: FONT_FAMILY,
            size: 24,
            bold: true,
            color: COLOR_MUTED,
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '00_Muc_Luc_Va_Huong_Dan_Su_Dung_Ho_So.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Cover & TOC Doc:', outPath);
}

buildMergedDoc().catch(console.error);
