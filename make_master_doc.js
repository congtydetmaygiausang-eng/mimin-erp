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

async function buildMasterDoc() {
  const allChildren = [];

  // ===================== COVER PAGE =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 120 },
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
      spacing: { before: 0, after: 600 },
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
      spacing: { before: 200, after: 200 },
      children: [
        new TextRun({
          text: 'TRỌN BỘ HỒ SƠ PHÁP LÝ,\nQUY TRÌNH SẢN XUẤT CHUỖI CUNG ỨNG\n& CÁC HỢP ĐỒNG NGUYÊN TẮC',
          font: FONT_FAMILY,
          size: 36,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 600 },
      children: [
        new TextRun({
          text: '(Bản Word .docx đầy đủ – Có thể trực tiếp nhập và sửa đổi thông tin)',
          font: FONT_FAMILY,
          size: 24,
          italics: true,
          color: COLOR_MUTED,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [
        new TextRun({
          text: 'MỤC LỤC CHI TIẾT TÀI LIỆU:',
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
            makeCell('TÊN VĂN BẢN / TÀI LIỆU', 56, { isHeader: true }),
            makeCell('ĐỐI TÁC / SỐ HIỆU', 32, { isHeader: true }),
          ],
        }),
        ...[
          { phan: 'Phần 1', ten: 'Phụ lục: Phạm vi chứng nhận sản phẩm (Oeko-Tex / TCCS)', doiTac: 'GCN 557116 (Man PJ)' },
          { phan: 'Phần 2', ten: 'Quy trình sản xuất chuỗi cung ứng khép kín từ sợi đến bán hàng', doiTac: 'QCVN 01:2017/BCT (POLOMIMIN)' },
          { phan: 'Phần 3', ten: 'Hợp đồng nguyên tắc mua bán sợi dệt', doiTac: 'Số: 99/HĐNT/2026 (Lucky Avanti)' },
          { phan: 'Phần 4', ten: 'Hợp đồng nguyên tắc cung cấp sợi Spandex-40 & dệt vải mộc', doiTac: 'Số: 02/SM-AT/2026 (Dệt Hải Dương)' },
          { phan: 'Phần 5', ten: 'Hợp đồng nguyên tắc gia công nhuộm hoàn tất vải', doiTac: 'Số: 11-2026/HĐNT-GIAUSANG (Tân Đức Khanh)' },
          { phan: 'Phần 6', ten: 'Hợp đồng nguyên tắc gia công may mặc', doiTac: 'Số: 022025/HĐGC - POLOMON (HKD Ngọc Dung)' },
          { phan: 'Phần 7', ten: 'Sơ đồ tổ chức công ty & nguyên tắc vận hành 6 khối', doiTac: 'Bộ máy quản trị Giàu Sang' },
        ].map((r, i) =>
          new TableRow({
            children: [
              makeCell(r.phan, 12, { alignment: AlignmentType.CENTER, bold: true, isAlt: i % 2 === 1 }),
              makeCell(r.ten, 56, { bold: true, isAlt: i % 2 === 1 }),
              makeCell(r.doiTac, 32, { isAlt: i % 2 === 1 }),
            ],
          })
        ),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 800, after: 0 },
      children: [
        new TextRun({
          text: 'TP. HỒ CHÍ MINH – NĂM 2026',
          font: FONT_FAMILY,
          size: 24,
          bold: true,
          color: COLOR_MUTED,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 1 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 1: PHẠM VI CHỨNG NHẬN SẢN PHẨM (OEKO-TEX / TCCS)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG',
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [
        new TextRun({
          text: 'Địa chỉ: 5/38 đường Đặng Thúc Vịnh, Ấp 1, Xã Đông Thạnh, Huyện Hóc Môn, TP. Hồ Chí Minh',
          font: FONT_FAMILY,
          size: 22,
          italics: true,
          color: COLOR_MUTED,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({
          text: 'NHÃN HIỆU MAN PJ – GCN SỐ: 557116',
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: '1E40AF',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: '(Kèm theo Giấy chứng nhận số 557116 cấp ngày 20 tháng 01 năm 2026)',
          font: FONT_FAMILY,
          size: 22,
          italics: true,
          color: COLOR_MUTED,
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
            makeCell('STT', 6, { isHeader: true }),
            makeCell('TÊN SẢN PHẨM', 22, { isHeader: true }),
            makeCell('TÊN THƯƠNG MẠI', 18, { isHeader: true }),
            makeCell('PHÂN NHÓM SẢN PHẨM\n(Oeko-Tex Standard 100)', 18, { isHeader: true }),
            makeCell('NHÃN HIỆU', 10, { isHeader: true }),
            makeCell('THÀNH PHẦN CHẤT LIỆU', 14, { isHeader: true }),
            makeCell('SỐ TIÊU CHUẨN\nTCCS', 12, { isHeader: true }),
          ],
        }),
        ...[
          { stt: '1', ten: 'Áo thun nam cổ tròn', tm: 'AO THUN CO TRON' },
          { stt: '2', ten: 'Áo thun nam cổ tròn tay raglan', tm: 'AO THUN CO TRON SPANDEX' },
          { stt: '3', ten: 'Áo thun nam cổ trụ (cổ bẻ)', tm: 'AO THUN CO TRU' },
          { stt: '4', ten: 'Áo thun nam cổ trụ tay raglan', tm: 'AO THUN CO TRU SPANDEX' },
          { stt: '5', ten: 'Áo thun nam phối màu / phối kiểu', tm: 'AO THUN PHOI' },
          { stt: '6', ten: 'Bộ quần áo nam cổ tròn', tm: 'BO THUN CO TRON' },
          { stt: '7', ten: 'Bộ quần áo nam cổ trụ', tm: 'BO THUN CO TRU' },
          { stt: '8', ten: 'Bộ quần áo nam co giãn thể thao', tm: 'BO THUN SPANDEX' },
          { stt: '9', ten: 'Quần short nam thời trang', tm: 'QUAN SHORT NAM' },
          { stt: '10', ten: 'Quần short nam co giãn Spandex', tm: 'QUAN SHORT SPANDEX' },
        ].map((r, idx) =>
          new TableRow({
            children: [
              makeCell(r.stt, 6, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
              makeCell(r.ten, 22, { bold: true, isAlt: idx % 2 === 1 }),
              makeCell(r.tm, 18, { isAlt: idx % 2 === 1 }),
              makeCell('Nhóm tiếp xúc trực tiếp với da (Class II)', 18, { isAlt: idx % 2 === 1 }),
              makeCell('MAN PJ', 10, { alignment: AlignmentType.CENTER, bold: true, isAlt: idx % 2 === 1 }),
              makeCell('96% Polyester,\n4% Spandex', 14, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
              makeCell('TCCS 01:2026/AGT', 12, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
            ],
          })
        ),
      ],
    }),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'Ghi chú kỹ thuật:\n- Vải chính & Vải bo: 96% Poly, 4% Spandex\n- Đạt chuẩn Oeko-Tex Standard 100 Class II',
      '',
      'ĐẠI DIỆN DOANH NGHIỆP\nGIÁM ĐỐC',
      'HỒ MINH SANG',
      'TP. Hồ Chí Minh, ngày 20 tháng 01 năm 2026'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 2 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 2: QUY TRÌNH SẢN XUẤT CHUỖI CUNG ỨNG KHÉP KÍN',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pDocTitle(
      'QUY TRÌNH SẢN XUẤT CHUỖI CUNG ỨNG KHÉP KÍN\nTỪ SỢI ĐẾN BÁN HÀNG',
      'Tiêu chuẩn áp dụng: QCVN 01:2017/BCT (POLOMIMIN PREMIUM QUALITY)'
    ),
    pHeading1('I. SƠ ĐỒ 7 CÔNG ĐOẠN KHÉP KÍN'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          children: [
            makeCell('01. MUA SỢI', 14, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('02. DỆT GIA CÔNG', 14, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('03. NHUỘM & HOÀN TẤT', 15, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('04. CẮT VẢI', 14, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('05. GIA CÔNG MAY', 14, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('06. ỦI & ĐÓNG GÓI', 15, { isHeader: true, alignment: AlignmentType.CENTER }),
            makeCell('07. BÁN HÀNG', 14, { isHeader: true, alignment: AlignmentType.CENTER }),
          ],
        }),
        new TableRow({
          children: [
            makeCell('Thu mua sợi Poly, Cotton, Spandex chất lượng cao', 14, { size: 20 }),
            makeCell('Dệt mộc cá sấu, mè, single, interlock...', 14, { size: 20 }),
            makeCell('Nhuộm cao áp, hoàn tất mềm, định hình stenter', 15, { size: 20 }),
            makeCell('Xả nghỉ, giác sơ đồ, cắt chi tiết, phối bo', 14, { size: 20 }),
            makeCell('May ráp hoàn chỉnh, kiểm soát thông số đường may', 14, { size: 20 }),
            makeCell('Ủi hơi định hình, gắn tag mác, đóng túi PE/thùng', 15, { size: 20 }),
            makeCell('Nhập kho thành phẩm, phân phối B2B & sàn TMĐT', 14, { size: 20 }),
          ],
        }),
      ],
    }),
    pHeading1('II. BẢNG MÔ TẢ CHI TIẾT CÁC CÔNG ĐOẠN'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            makeCell('STT', 5, { isHeader: true }),
            makeCell('CÔNG ĐOẠN', 14, { isHeader: true }),
            makeCell('NỘI DUNG CÔNG VIỆC', 26, { isHeader: true }),
            makeCell('ĐIỂM KIỂM SOÁT QC', 25, { isHeader: true }),
            makeCell('HỒ SƠ / CHỨNG TỪ LƯU', 18, { isHeader: true }),
            makeCell('ĐƠN VỊ THỰC HIỆN', 12, { isHeader: true }),
          ],
        }),
        ...[
          {
            stt: '01',
            congDoan: 'MUA SỢI',
            noiDung: '• Tuyển chọn chỉ số sợi, thành phần (Cotton, Poly, CVC, Spandex...).\n• Thu mua sợi từ nhà cung cấp uy tín.\n• Nhập kho, bảo quản sợi đúng quy cách.',
            qc: '• Kiểm tra CO/CQ nguồn gốc xuất xứ.\n• Kiểm tra độ đều, độ bền đứt, độ xoắn, độ ẩm.\n• Kiểm tra ngoại quan, màu sắc đồng nhất.',
            chungTu: '• Hợp đồng mua bán sợi\n• CO, CQ, Test report\n• Phiếu nhập kho sợi\n• Biên bản kiểm tra đầu vào',
            donVi: 'Nội bộ\n(Phòng Mua hàng)',
          },
          {
            stt: '02',
            congDoan: 'DỆT GIA CÔNG',
            noiDung: '• Xuất sợi cho đơn vị dệt gia công theo đơn hàng.\n• Dệt thành mộc (vải xám) theo kiểu dệt: Single Jersey, Cá sấu, Rib, Interlock...',
            qc: '• Kiểm tra GSM (định lượng g/m2), độ dày, khổ vải.\n• Kiểm tra lỗi dệt: sọc ngang, đứt sợi, thủng lỗ, dơ dầu...\n• Báo cáo kết quả kiểm tra mộc.',
            chungTu: '• Phiếu giao nhận sợi\n• Biên bản nghiệm thu mộc\n• Chứng từ giao nhận',
            donVi: 'Gia công ngoài\n(Nhà máy dệt)',
          },
          {
            stt: '03',
            congDoan: 'NHUỘM & HOÀN TẤT',
            noiDung: '• Chuyển mộc đi nhuộm theo bảng màu chuẩn.\n• Sấy định hình, xử lý mềm mặt vải, cuộn cây.\n• Kiểm soát hóa chất và quy trình nhuộm công nghệ cao.',
            qc: '• Kiểm tra độ lệch màu (Labdip so với màu chuẩn).\n• Kiểm tra độ bền màu: giặt, ma sát, mồ hôi, ủi nhiệt.\n• Kiểm soát Formaldehyde và Azo dyes theo QCVN 01:2017/BCT.',
            chungTu: '• Phiếu nhuộm\n• Kết quả test màu\n• Kết quả test QCVN 01:2017/BCT\n• Chứng từ giao nhận',
            donVi: 'Gia công ngoài\n(Nhà máy nhuộm)',
          },
          {
            stt: '04',
            congDoan: 'CẮT VẢI',
            noiDung: '• Nhập vải nhuộm về xưởng.\n• Xả vải cơ nghỉ 24h - 48h.\n• Trải vải, giác sơ đồ vi tính và cắt chi tiết chính xác.\n• Phối bo, đánh số bán thành phẩm.',
            qc: '• Kiểm tra thông số rập, sơ đồ cắt tối ưu định mức.\n• Kiểm tra lỗi mặt vải, lệch kẻ, tuyết vải.\n• Kiểm tra số lượng và kích thước chi tiết cắt.',
            chungTu: '• Phiếu nhập vải\n• Phiếu trải cắt\n• Biên bản kiểm tra BTP\n• Bảng sơ đồ cắt',
            donVi: 'Nội bộ\n(Xưởng cắt POLOMIMIN)',
          },
          {
            stt: '05',
            congDoan: 'GIA CÔNG MAY',
            noiDung: '• Chuyển bán thành phẩm cho xưởng may gia công.\n• May ráp các chi tiết thành sản phẩm hoàn chỉnh.',
            qc: '• QC kiểm soát đầu chuyền, giữa chuyền và cuối chuyền.\n• Kiểm tra mật độ mũi chỉ, đường may êm, không đứt chỉ.\n• Kiểm tra size và thông số theo bảng kích thước.',
            chungTu: '• Phiếu giao nhận BTP\n• Biên bản kiểm đồ & QC\n• Phiếu giao nhận thành phẩm',
            donVi: 'Gia công ngoài\n(Xưởng may)',
          },
          {
            stt: '06',
            congDoan: 'ỦI & ĐÓNG GÓI THÀNH PHẨM',
            noiDung: '• Thu hàng may về xưởng.\n• Cắt nhặt chỉ thừa, vệ sinh bề mặt.\n• Ủi hơi định hình phom chuẩn dáng.\n• Gắn tem mác, thẻ bài thương hiệu.\n• Đóng túi PE, đóng thùng xuất xưởng.',
            qc: '• KCS kiểm tra 100% thành phẩm: phom dáng, vệ sinh, thông số kích thước.\n• Kiểm tra tem nhãn, mã vạch barcode.\n• Kiểm tra quy cách đóng gói và số lượng.',
            chungTu: '• Phiếu kiểm tra KCS\n• Phiếu nhập kho thành phẩm\n• Danh sách đóng gói (Packing List)',
            donVi: 'Nội bộ\n(Xưởng hoàn thiện POLOMIMIN)',
          },
          {
            stt: '07',
            congDoan: 'BÁN HÀNG',
            noiDung: '• Nhập kho thành phẩm POLOMIMIN.\n• Xuất bán sỉ/lẻ: hệ thống đại lý, showroom, cửa hàng.\n• Kênh online: Shopee, TikTok Shop, Zalo, Website.\n• Vận chuyển, giao hàng và chăm sóc khách hàng.',
            qc: '• Đối soát đơn hàng, số lượng, chủng loại, mã màu.\n• Kiểm tra tồn kho an toàn trên phần mềm ERP.\n• Thu thập phản hồi khách hàng và xử lý khiếu nại nhanh chóng.',
            chungTu: '• Đơn hàng / HĐ bán hàng\n• Phiếu xuất kho / Hóa đơn GTGT\n• Biên bản giao nhận\n• Báo cáo doanh số',
            donVi: 'Nội bộ\n(Phòng Kinh doanh)',
          },
        ].map((row, idx) =>
          new TableRow({
            children: [
              makeCell(row.stt, 5, { alignment: AlignmentType.CENTER, bold: true, isAlt: idx % 2 === 1 }),
              makeCell(row.congDoan, 14, { bold: true, isAlt: idx % 2 === 1 }),
              makeCell(row.noiDung, 26, { size: 21, isAlt: idx % 2 === 1 }),
              makeCell(row.qc, 25, { size: 21, isAlt: idx % 2 === 1 }),
              makeCell(row.chungTu, 18, { size: 21, isAlt: idx % 2 === 1 }),
              makeCell(row.donVi, 12, { alignment: AlignmentType.CENTER, size: 21, isAlt: idx % 2 === 1 }),
            ],
          })
        ),
      ],
    }),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'PHÒNG KỸ THUẬT & QC',
      'NGUYỄN VĂN THANH',
      'CÔNG TY TNHH DỆT MAY GIÀU SANG\nGIÁM ĐỐC',
      'HỒ MINH SANG',
      'TP. Hồ Chí Minh, ngày 10 tháng 01 năm 2026'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 3 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 3: HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SỢI (LUCKY AVANTI)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pQuocHieu(),
    ...pDocTitle('HỢP ĐỒNG NGUYÊN TẮC\n(LOẠI NGUYÊN TẮC)', 'Số: 99/HĐNT/2026'),
    pBody([
      { text: '- Căn cứ Bộ luật Dân sự và Luật Thương mại được Quốc hội thông qua ngày 14/6/2005;\n', italics: true },
      { text: '- Căn cứ nhu cầu tiêu thụ và sản xuất của hai bên.', italics: true },
    ]),
    pBody([
      { text: 'Hôm nay, ngày 15 tháng 07 năm 2026. Hai bên chúng tôi gồm:\n', bold: true },
      { text: 'BÊN A: CÔNG TY TNHH DỆT LUCKY AVANTI\n', bold: true },
      'Địa chỉ: Số 656/74/28 Quang Trung, Phường Thông Tây Hội, Tp.HCM.\n',
      '- Tel: (08) 62642013   Fax: (08) 62642013   MST: 0312405160\n',
      '- Đại diện: ', { text: 'Bà NGUYỄN THỊ YẾN NGA', bold: true }, '   Chức Vụ: Giám Đốc\n\n',
      { text: 'BÊN B: CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
      'Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Bà Điểm, TP Hồ Chí Minh\n',
      '- Tel: (08) 0774480916   MST: 0318507560\n',
      '- Đại diện: ', { text: 'Ông HỒ MINH SANG', bold: true }, '   Chức Vụ: Giám Đốc',
    ]),
    pHeading1('Điều 1: MẶT HÀNG'),
    pBody('Bên A bán cho bên B các sản phẩm sợi dùng cho dệt kim, dệt thoi chi số từ 10’s - 40’s: Sợi 100% Poly, Sợi 100% Cotton chải kỹ/thô, Sợi 65/35 TC, Sợi 40/60 CVC, Sợi Viscose Rayon, Sợi Melange, Modal, Spandex, DTY theo nhu cầu từng đơn hàng cụ thể.'),
    pHeading1('Điều 2: TIÊU CHUẨN KỸ THUẬT VÀ BAO BÌ ĐÓNG GÓI'),
    pBody('Hàng bảo đảm chất lượng theo mẫu hai bên đã thỏa thuận. Thời hạn khiếu nại kiểm tra trong vòng 10 ngày kể từ ngày nhận hàng. Đóng gói bằng thùng carton, bao nylon.'),
    pHeading1('Điều 3: GIAO NHẬN - VẬN CHUYỂN - BỐC XẾP'),
    pBody('Hàng hóa được giao tại kho bên mua trong nội thành TP.HCM. Bên A chịu trách nhiệm vận chuyển. Bốc xếp mỗi bên chịu một đầu.'),
    pHeading1('Điều 4: PHƯƠNG THỨC THANH TOÁN'),
    pBody([
      'Thanh toán chuyển khoản vào tài khoản bên A:\n',
      '• STK: ', { text: '033 100 042 5272', bold: true }, ' tại Ngân hàng Vietcombank - CN Bến Thành.\n',
      '• STK: ', { text: '6730957', bold: true }, ' tại Ngân hàng Á Châu (ACB) - CN Lạc Long Quân.',
    ]),
    pHeading1('Điều 5: ĐIỀU KHOẢN CHUNG'),
    pBody('Hợp đồng có hiệu lực từ ngày ký đến hết ngày 31/12/2026. Lập thành 02 bản có giá trị như nhau.'),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT LUCKY AVANTI',
      'NGUYỄN THỊ YẾN NGA',
      'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
      'HỒ MINH SANG',
      'Ngày 15 tháng 07 năm 2026'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 4 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 4: HỢP ĐỒNG NGUYÊN TẮC GIA CÔNG DỆT VẢI MỘC (HẢI DƯƠNG)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pQuocHieu(),
    ...pDocTitle('HỢP ĐỒNG NGUYÊN TẮC', 'HĐNT – SỐ 02/SM- AT/2026'),
    pBody([
      { text: 'Hôm nay, ngày 01 tháng 01 năm 2026, tại Công ty TNHH SX- TM DỆT MAY HẢI DƯƠNG\n', bold: true },
      { text: 'BÊN A: CÔNG TY TNHH DỆT MAY GIÀU SANG (BÊN ĐƯA GIA CÔNG + MUA SỢI)\n', bold: true },
      'Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP.HCM\n',
      'MST: 0318507560   Tài khoản: 7777369369369 – Ngân hàng MB\n',
      'Đại diện: ', { text: 'Hồ Minh Sang', bold: true }, '   Chức Vụ: Giám Đốc\n\n',
      { text: 'BÊN B: CÔNG TY TNHH SX- TM DỆT MAY HẢI DƯƠNG (BÊN NHẬN GIA CÔNG + BÁN SỢI)\n', bold: true },
      'Địa chỉ: 8/6A, Ấp 2, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP. Hồ Chí Minh\n',
      'MST: 0314588287   Tài khoản: 060159953060 - Ngân hàng Sacombank - Chi nhánh Sơn Kỳ\n',
      'Đại diện: ', { text: 'NGUYỄN VĂN NGA', bold: true }, '   Chức vụ: Giám Đốc',
    ]),
    pHeading1('Điều 1: Nội dung hợp đồng'),
    pBody('Bên B cung cấp cho bên A sợi SPANDEX-40 và nhận gia công dệt vải thun mộc cho bên A (theo mẫu bên A yêu cầu), sợi do bên A cung cấp theo từng đơn hàng cụ thể từ ngày 01/01/2026 đến ngày 31/12/2026.'),
    pHeading1('Điều 2: Yêu cầu, quy cách, chất lượng, giá cả'),
    pBody('Chất lượng hàng đảm bảo theo tiêu chuẩn mẫu chào. Bên B chịu trách nhiệm xử lý hoặc bồi thường nếu giao vải lỗi sợi, dơ, không đạt yêu cầu.'),
    pHeading1('Điều 3: Phương thức đặt hàng, giao nhận'),
    pBody('Đặt hàng qua điện thoại, Zalo. Giao hàng theo địa chỉ bên A chỉ định kèm hóa đơn, phiếu xuất kho.'),
    pHeading1('Điều 4: Phương thức thanh toán'),
    pBody('Bên A thanh toán cho Bên B từ ngày 1 đến ngày 10 hàng tháng theo hóa đơn đã xuất ra.'),
    pHeading1('Điều 5: Các điều khoản chung'),
    pBody('Hai bên cam kết thực hiện đúng hợp đồng, giải quyết khó khăn trên tinh thần hợp tác, tranh chấp giải quyết tại Tòa án kinh tế TP.HCM.'),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
      'HỒ MINH SANG',
      'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH SX-TM DỆT MAY HẢI DƯƠNG',
      'NGUYỄN VĂN NGA',
      'Hóc Môn, ngày 01 tháng 01 năm 2026'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 5 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 5: HỢP ĐỒNG GIA CÔNG NHUỘM HOÀN TẤT VẢI (TÂN ĐỨC KHANH)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pQuocHieu(),
    ...pDocTitle('HỢP ĐỒNG NGUYÊN TẮC\n(V/v gia công nhuộm hoàn tất vải)', 'Số: 11-2026/HĐNT-GIAUSANG'),
    pBody([
      { text: 'Hôm nay, ngày 01 tháng 08 năm 2026, chúng tôi gồm:\n', bold: true },
      { text: 'BÊN NHẬN GIA CÔNG (Bên A): CÔNG TY TNHH DỆT NHUỘM TÂN ĐỨC KHANH\n', bold: true },
      '- Địa chỉ: Lô I22-23-24A, Đường số 5, KCN Hải Sơn (GĐ 3 + 4), Ấp Bình Tiền 2, Xã Đức Hòa, Tỉnh Tây Ninh/Long An.\n',
      '- MST: 1101744462   ĐT: 091 495 6162   Tài khoản: 210314851017265 - Ngân hàng Eximbank - CN Tây Sài Gòn\n',
      '- Đại diện: ', { text: 'Ông LƯU MẠNH HÙNG', bold: true }, '   Chức vụ: Giám đốc\n\n',
      { text: 'BÊN GIA CÔNG (Bên B): CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
      '- Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Bà Điểm, TP. Hồ Chí Minh\n',
      '- MST: 0318507560   Tài khoản: 7777369369369 - Ngân hàng MB\n',
      '- Đại diện: ', { text: 'Ông HỒ MINH SANG', bold: true }, '   Chức vụ: Giám đốc',
    ]),
    pHeading1('Điều 1: Hàng hóa, giá cả, số lượng'),
    pBody('Bên B cung cấp vải mộc các loại và bên A gia công nhuộm hoàn tất theo yêu cầu kỹ thuật và bảng màu chuẩn của bên B.'),
    pHeading1('Điều 2: Thời gian, địa điểm và điều kiện giao hàng'),
    pBody('Nhận mộc và giao vải thành phẩm tại kho bên B theo từng đơn đặt hàng cụ thể kèm phiếu xuất kho.'),
    pHeading1('Điều 3: Giá trị hợp đồng và phương thức thanh toán'),
    pBody('Thanh toán bằng chuyển khoản vào tài khoản Eximbank Tây Sài Gòn của Bên A trong vòng 30 ngày kể từ ngày xuất hóa đơn GTGT.'),
    pHeading1('Điều 4: Trách nhiệm của hai bên'),
    pBody('Bên B cung cấp đầy đủ vải mộc. Bên A bảo quản vải, thực hiện nhuộm đạt tiêu chuẩn, bồi thường thiệt hại nếu làm hư hỏng, lem màu hoặc trễ hạn giao hàng.'),
    pHeading1('Điều 5: Thời hạn hợp đồng & Điều khoản chung'),
    pBody('Hợp đồng có hiệu lực đến hết ngày 31 tháng 12 năm 2026. Lập thành 02 bản có giá trị pháp lý như nhau.'),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
      'HỒ MINH SANG',
      'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT NHUỘM TÂN ĐỨC KHANH',
      'LƯU MẠNH HÙNG',
      'Ngày 01 tháng 08 năm 2026'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 6 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 6: HỢP ĐỒNG GIA CÔNG MAY MẶC (NGUYỄN THỊ NGỌC DUNG)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pQuocHieu(),
    ...pDocTitle('HỢP ĐỒNG NGUYÊN TẮC GIA CÔNG MAY MẶC', 'Số: 022025/HĐGC - POLOMON'),
    pBody([
      { text: 'Hôm nay, ngày ...... tháng ...... năm 2025 tại Công ty TNHH Dệt May Giàu Sang\n', bold: true },
      { text: 'BÊN GIA CÔNG (Bên A): CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
      'Địa chỉ: 12/39 đường Xuân Thới Thượng 58C, Xã Bà Điểm, TP.HCM   MST: 0318507560\n',
      'Đại diện: ', { text: 'Hồ Minh Sang', bold: true }, '   Chức vụ: Giám Đốc\n\n',
      { text: 'BÊN NHẬN GIA CÔNG (Bên B): HỘ KINH DOANH – NGUYỄN THỊ NGỌC DUNG\n', bold: true },
      'Địa chỉ: Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, Tp.HCM   MST: 8898968687-001\n',
      'Đại diện: ', { text: 'Nguyễn Thị Ngọc Dung', bold: true }, '   CCCD: 091183000355   ĐT: 0383373415',
    ]),
    pHeading1('Điều 1: Bảng đơn giá gia công may 6 sản phẩm chi tiết'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            makeCell('STT', 10, { isHeader: true }),
            makeCell('SẢN PHẨM GIA CÔNG', 60, { isHeader: true }),
            makeCell('ĐƠN GIÁ (VNĐ/SP)', 30, { isHeader: true }),
          ],
        }),
        ...[
          { stt: '1', sp: 'Quần short trơn cắt chi tiết', gia: '10.000 đ' },
          { stt: '2', sp: 'Quần short phối cắt chi tiết', gia: '11.000 đ' },
          { stt: '3', sp: 'Áo trụ trơn cắt chi tiết', gia: '13.500 đ' },
          { stt: '4', sp: 'Áo trụ phối cắt chi tiết', gia: '15.500 đ' },
          { stt: '5', sp: 'Áo tròn trơn cắt chi tiết', gia: '8.000 đ' },
          { stt: '6', sp: 'Áo tròn phối cắt chi tiết', gia: '9.500 đ' },
        ].map((r, idx) =>
          new TableRow({
            children: [
              makeCell(r.stt, 10, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
              makeCell(r.sp, 60, { bold: true, isAlt: idx % 2 === 1 }),
              makeCell(r.gia, 30, { alignment: AlignmentType.RIGHT, bold: true, isAlt: idx % 2 === 1 }),
            ],
          })
        ),
      ],
    }),
    pBody('(Đơn giá trên đã bao gồm toàn bộ chi phí nhân công, không bao gồm nguyên vật liệu do Bên A cung cấp)', { italics: true, color: COLOR_MUTED }),
    pHeading1('Điều 2 - Điều 10: Các điều khoản quyền, nghĩa vụ và trách nhiệm thực hiện'),
    pBody('Bên A cung cấp bán thành phẩm cắt và phụ liệu. Bên B may đúng thông số mẫu, tỷ lệ lỗi không quá 5%. Thanh toán theo nghiệm thu hàng tháng. Phạt 5% vi phạm hợp đồng.'),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
      'HỒ MINH SANG',
      'ĐẠI DIỆN BÊN B\nHỘ KINH DOANH NGUYỄN THỊ NGỌC DUNG',
      'NGUYỄN THỊ NGỌC DUNG',
      'TP. Hồ Chí Minh, năm 2025'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ===================== PHẦN 7 =====================
  allChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PHẦN 7: SƠ ĐỒ TỔ CHỨC CÔNG TY (POLOMIMIN)',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: '1E3A8A',
        }),
      ],
    }),
    ...pDocTitle(
      'SƠ ĐỒ TỔ CHỨC BỘ MÁY QUẢN LÝ VÀ VẬN HÀNH',
      'CÔNG TY TNHH DỆT MAY GIÀU SANG – THƯƠNG HIỆU: POLOMIMIN'
    ),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          children: [
            makeCell([
              { text: 'CỐ VẤN CHIẾN LƯỢC\n', bold: true, color: '1E40AF' },
              'Định hướng chiến lược, kết nối nguồn lực phát triển hệ sinh thái',
            ], 45, { shading: { fill: 'EFF6FF' }, alignment: AlignmentType.CENTER }),
            makeCell([
              { text: 'GIÁM ĐỐC ĐIỀU HÀNH: ', bold: true },
              { text: 'HỒ MINH SANG\n', bold: true, size: 26, color: '1E3A8A' },
              'Định hướng chiến lược – Quản trị điều hành chung – Đại diện pháp luật',
            ], 55, { shading: { fill: 'DBEAFE' }, alignment: AlignmentType.CENTER }),
          ],
        }),
      ],
    }),
    pHeading1('BẢNG PHÂN CÔNG 6 KHỐI PHÒNG BAN CHỨC NĂNG'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            makeCell('STT', 6, { isHeader: true }),
            makeCell('KHỐI PHÒNG BAN', 25, { isHeader: true }),
            makeCell('NHÂN SỰ PHỤ TRÁCH', 25, { isHeader: true }),
            makeCell('CHỨC NĂNG & NHIỆM VỤ CỐT LÕI', 44, { isHeader: true }),
          ],
        }),
        ...[
          {
            stt: '1',
            khoi: 'KHỐI SẢN XUẤT\n(QUẢN LÝ SẢN XUẤT)',
            nhanSu: '• Trưởng khối: Thanh\n• Cắt: Giang\n• Đầu khúc: Việt\n• Dây chuyền: Thịnh\n• Gấp xếp: Phương\n• Ủi: Tuyền\n• Giao kho: Trường',
            nhiemVu: '• Điều phối xưởng cắt nội bộ, chốt SL tại TyLeSizeModal.\n• Quản lý tiến độ may, giao nhận gia công ngoài.\n• Quản lý khâu ủi, gấp xếp, đóng gói thành phẩm.',
          },
          {
            stt: '2',
            khoi: 'KHỐI KẾ TOÁN\nTÀI CHÍNH',
            nhanSu: '• Kế toán trưởng: Thanh\n• Kế toán công nợ\n• Kế toán thu chi\n• Kế toán kho',
            nhiemVu: '• Theo dõi công nợ nhà cung cấp 3 khâu: Sợi, Dệt, Nhuộm.\n• Quản lý công nợ khách hàng B2B & sàn TMĐT.\n• Tính lương khoán theo sản phẩm cho các tổ sản xuất.',
          },
          {
            stt: '3',
            khoi: 'KHỐI KINH DOANH\nBÁN HÀNG',
            nhanSu: '• Quản lý bán hàng: Ngọc Giàu\n• TikTok Shop: Thúng\n• Shopee: Huyền\n• Bán sỉ/Dự án: Vy\n• KOC/Affiliate: Hùng',
            nhiemVu: '• Phát triển kênh bán lẻ đa sàn (TikTok, Shopee, Web).\n• Chăm sóc khách sỉ, đại lý phân phối, báo giá dự án.\n• Kết nối mạng lưới KOC/Affiliate thúc đẩy doanh số.',
          },
          {
            stt: '4',
            khoi: 'KHỐI KHO VẬN\nLOGISTICS',
            nhanSu: '• Quản lý kho: Hậu\n• Thủ kho vải\n• Thủ kho phụ liệu\n• Thủ kho thành phẩm\n• Đóng gói - Vận chuyển',
            nhiemVu: '• Quản trị kho vải mộc và kho vải thành phẩm.\n• Quản lý kho phụ liệu và kho thành phẩm theo vị trí kệ.\n• Đóng gói đơn hàng và điều phối logistics.',
          },
          {
            stt: '5',
            khoi: 'KHỐI KỸ THUẬT\nR&D – QC',
            nhanSu: '• Kỹ thuật trưởng\n• Thiết kế rập\n• R&D mẫu\n• QC kiểm tra chất lượng\n• Tiêu chuẩn kỹ thuật',
            nhiemVu: '• Nghiên cứu phát triển mẫu mã mới theo xu hướng.\n• Thiết kế rập vi tính, nhảy size, giác sơ đồ tối ưu vải.\n• May mẫu proto, kiểm soát chất lượng KCS/QC toàn diện.',
          },
          {
            stt: '6',
            khoi: 'KHỐI HỆ THỐNG\nCÔNG NGHỆ (IT)',
            nhanSu: '• Quản trị hệ thống: Phi\n• Vận hành phần mềm MIMIN OS\n• Quản trị CSDL\n• Bảo mật & Hạ tầng',
            nhiemVu: '• Vận hành và tối ưu hóa hệ thống ERP MIMIN độc quyền.\n• Tự động hóa quy trình sản xuất, đồng bộ dữ liệu thời gian thực.\n• Đảm bảo an toàn thông tin dữ liệu công ty.',
          },
        ].map((r, idx) =>
          new TableRow({
            children: [
              makeCell(r.stt, 6, { alignment: AlignmentType.CENTER, bold: true, isAlt: idx % 2 === 1 }),
              makeCell(r.khoi, 25, { bold: true, isAlt: idx % 2 === 1 }),
              makeCell(r.nhanSu, 25, { size: 21, isAlt: idx % 2 === 1 }),
              makeCell(r.nhiemVu, 44, { size: 21, isAlt: idx % 2 === 1 }),
            ],
          })
        ),
      ],
    }),
    pHeading1('5 NGUYÊN TẮC HOẠT ĐỘNG CỐT LÕI'),
    pBody([
      '1. ', { text: 'Khách hàng là trung tâm: ', bold: true }, 'Mọi cải tiến đều vì sự hài lòng của khách hàng.\n',
      '2. ', { text: 'Chất lượng là ưu tiên: ', bold: true }, 'Kiểm soát nghiêm ngặt từ sợi đến thành phẩm, không để lọt lỗi.\n',
      '3. ', { text: 'Minh bạch – Kỷ luật: ', bold: true }, 'Số liệu chuẩn xác trên ERP MIMIN, làm việc đúng hẹn, trách nhiệm.\n',
      '4. ', { text: 'Đoàn kết – Hợp tác: ', bold: true }, 'Phối hợp liên khối nhịp nhàng, gắn kết cùng phát triển.\n',
      '5. ', { text: 'Đổi mới – Phát triển: ', bold: true }, 'Liên tục cải tiến công nghệ, nâng cao năng suất và chất lượng.',
    ]),
    pBody('', { before: 180, after: 0 }),
    createSignatureTable(
      'PHỤ TRÁCH NHÂN SỰ & HÀNH CHÍNH',
      'BAN QUẢN LÝ NHÂN SỰ',
      'CÔNG TY TNHH DỆT MAY GIÀU SANG\nGIÁM ĐỐC',
      'HỒ MINH SANG',
      'TP. Hồ Chí Minh, ngày 05 tháng 01 năm 2026'
    )
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 } },
        },
        children: allChildren,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '00_TRON_BO_HO_SO_CHUAN_GIAU_SANG_POLOMIMIN.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Master Doc:', outPath);
}

buildMasterDoc().catch(console.error);
