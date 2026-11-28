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
  Header,
  Footer,
} = require('docx');

const {
  outputDir,
  FONT_FAMILY,
  COLOR_PRIMARY,
  COLOR_MUTED,
  COLOR_BORDER,
  BG_HEADER,
  BG_ALT,
  singleBorder,
  cellBorders,
  noBorder,
  noBorders,
  pQuocHieu,
  pDocTitle,
  pHeading1,
  pBody,
  pBullet,
  createSignatureTable,
} = require('./docx_helpers');

// Helper to create table cell
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

// -------------------------------------------------------------
// DOC 1: PHỤ LỤC PHẠM VI CHỨNG NHẬN SẢN PHẨM (OEKO-TEX / TCCS)
// -------------------------------------------------------------
async function buildDoc1() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 }, // chuẩn lề hành chính 2cm - 2cm - 2cm - 2.5cm
          },
        },
        children: [
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
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'PHỤ LỤC: PHẠM VI CHỨNG NHẬN SẢN PHẨM (OEKO-TEX / TCCS)',
                font: FONT_FAMILY,
                size: 30,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
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

          // Table 10 products
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
                {
                  stt: '1',
                  ten: 'Áo thun nam cổ tròn',
                  thuongMai: 'AO THUN CO TRON',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '2',
                  ten: 'Áo thun nam cổ tròn tay raglan',
                  thuongMai: 'AO THUN CO TRON SPANDEX',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '3',
                  ten: 'Áo thun nam cổ trụ (cổ bẻ)',
                  thuongMai: 'AO THUN CO TRU',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '4',
                  ten: 'Áo thun nam cổ trụ tay raglan',
                  thuongMai: 'AO THUN CO TRU SPANDEX',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '5',
                  ten: 'Áo thun nam phối màu / phối kiểu',
                  thuongMai: 'AO THUN PHOI',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '6',
                  ten: 'Bộ quần áo nam cổ tròn',
                  thuongMai: 'BO THUN CO TRON',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '7',
                  ten: 'Bộ quần áo nam cổ trụ',
                  thuongMai: 'BO THUN CO TRU',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '8',
                  ten: 'Bộ quần áo nam co giãn thể thao',
                  thuongMai: 'BO THUN SPANDEX',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '9',
                  ten: 'Quần short nam thời trang',
                  thuongMai: 'QUAN SHORT NAM',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
                {
                  stt: '10',
                  ten: 'Quần short nam co giãn Spandex',
                  thuongMai: 'QUAN SHORT SPANDEX',
                  nhom: 'Nhóm tiếp xúc trực tiếp với da (Class II)',
                  nhanHieu: 'MAN PJ',
                  thanhPhan: '96% Polyester,\n4% Spandex',
                  tccs: 'TCCS 01:2026/AGT',
                },
              ].map((row, idx) =>
                new TableRow({
                  children: [
                    makeCell(row.stt, 6, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
                    makeCell(row.ten, 22, { bold: true, isAlt: idx % 2 === 1 }),
                    makeCell(row.thuongMai, 18, { isAlt: idx % 2 === 1 }),
                    makeCell(row.nhom, 18, { isAlt: idx % 2 === 1 }),
                    makeCell(row.nhanHieu, 10, { alignment: AlignmentType.CENTER, bold: true, isAlt: idx % 2 === 1 }),
                    makeCell(row.thanhPhan, 14, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
                    makeCell(row.tccs, 12, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
                  ],
                })
              ),
            ],
          }),

          pBody('', { before: 180, after: 0 }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      pBody([
                        { text: 'Ghi chú kỹ thuật:\n', bold: true },
                        '- Vải chính & Vải bo: 96% Polyester, 4% Spandex\n',
                        '- Mức giới hạn Formaldehyde & Amin thơm đạt QCVN 01:2017/BCT\n',
                        '- Đạt chuẩn Oeko-Tex Standard 100 Class II (tiếp xúc trực tiếp da)',
                      ], { size: 22, color: COLOR_MUTED }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [
                          new TextRun({
                            text: 'TP. Hồ Chí Minh, ngày 20 tháng 01 năm 2026',
                            font: FONT_FAMILY,
                            size: 24,
                            italics: true,
                            color: COLOR_MUTED,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 60 },
                        children: [
                          new TextRun({
                            text: 'ĐẠI DIỆN DOANH NGHIỆP\nGIÁM ĐỐC',
                            font: FONT_FAMILY,
                            size: 26,
                            bold: true,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 1200 },
                        children: [
                          new TextRun({
                            text: '(Ký tên và đóng dấu)',
                            font: FONT_FAMILY,
                            size: 22,
                            italics: true,
                            color: COLOR_MUTED,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'HỒ MINH SANG',
                            font: FONT_FAMILY,
                            size: 26,
                            bold: true,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '01_Phu_Luc_Chung_Nhan_San_Pham_MANPJ_OekoTex.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 1:', outPath);
}

// -------------------------------------------------------------
// DOC 2: QUY TRÌNH SẢN XUẤT CHUỖI CUNG ỨNG KHÉP KÍN (POLOMIMIN)
// -------------------------------------------------------------
async function buildDoc2() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG',
                font: FONT_FAMILY,
                size: 28,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'THƯƠNG HIỆU: POLOMIMIN (PREMIUM QUALITY)',
                font: FONT_FAMILY,
                size: 24,
                bold: true,
                color: '1E40AF',
              }),
            ],
          }),
          ...pDocTitle(
            'QUY TRÌNH SẢN XUẤT CHUỖI CUNG ỨNG KHÉP KÍN\nTỪ SỢI ĐẾN BÁN HÀNG',
            'Tiêu chuẩn áp dụng: QCVN 01:2017/BCT\n(Quy chuẩn kỹ thuật quốc gia về mức giới hạn hàm lượng Formaldehyt và các Amin thơm chuyển hóa từ thuốc nhuộm Azo trong sản phẩm dệt may)'
          ),

          pHeading1('I. SƠ ĐỒ LUỒNG SẢN XUẤT KHÉP KÍN (7 CÔNG ĐOẠN)'),
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
                  makeCell('Tuyển chọn & thu mua sợi nguyên liệu chất lượng cao (Poly, Cotton, Spandex...)', 14, { size: 20 }),
                  makeCell('Dệt thành mộc (vải xám) theo kiểu dệt: Single Jersey, Cá sấu, Rib, Interlock...', 14, { size: 20 }),
                  makeCell('Nhuộm cao áp, xử lý hoàn tất, làm mềm, chống tĩnh điện, sấy định hình stenter', 15, { size: 20 }),
                  makeCell('Xả vải nghỉ, giác sơ đồ máy tính, cắt chi tiết bán thành phẩm, phối bo', 14, { size: 20 }),
                  makeCell('May ráp các chi tiết tại xưởng gia công, kiểm soát thông số đường may', 14, { size: 20 }),
                  makeCell('Ủi hơi định hình phom dáng, gắn tag mác bài, đóng túi PE/thùng carton', 15, { size: 20 }),
                  makeCell('Nhập kho thành phẩm, phân phối B2B đại lý & vận hành đơn online e-commerce', 14, { size: 20 }),
                ],
              }),
            ],
          }),

          pHeading1('II. MÔ TẢ CHI TIẾT CÁC CÔNG ĐOẠN TRONG CHUỖI CUNG ỨNG'),
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
                  makeCell('ĐIỂM KIỂM SOÁT CHẤT LƯỢNG (QC)', 25, { isHeader: true }),
                  makeCell('HỒ SƠ / CHỨNG TỪ LƯU', 18, { isHeader: true }),
                  makeCell('ĐƠN VỊ THỰC HIỆN', 12, { isHeader: true }),
                ],
              }),
              ...[
                {
                  stt: '01',
                  congDoan: 'MUA SỢI',
                  noiDung: '• Tuyển chọn chỉ số sợi, thành phần (Cotton, Poly, CVC, Spandex...).\n• Thu mua sợi từ nhà cung cấp uy tín.\n• Nhập kho, bảo quản sợi đúng quy cách kỹ thuật.',
                  qc: '• Kiểm tra CO/CQ nguồn gốc xuất xứ.\n• Kiểm tra độ đều, độ bền đứt, độ xoắn, độ ẩm.\n• Kiểm tra ngoại quan, màu sắc đồng nhất.',
                  chungTu: '• Hợp đồng mua bán sợi\n• CO, CQ, Test report\n• Phiếu nhập kho sợi\n• Biên bản kiểm tra đầu vào',
                  donVi: 'Nội bộ\n(Phòng Mua hàng)',
                },
                {
                  stt: '02',
                  congDoan: 'DỆT GIA CÔNG',
                  noiDung: '• Xuất sợi cho đơn vị dệt gia công theo đơn hàng.\n• Dệt thành mộc (vải xám) theo kiểu dệt yêu cầu (Single Jersey, Lacoste, Rib, Pique...).',
                  qc: '• Kiểm tra GSM (định lượng g/m2), độ dày, khổ vải.\n• Kiểm tra lỗi dệt: sọc ngang, đứt sợi, thủng lỗ, dơ dầu...\n• Báo cáo kết quả kiểm tra vải mộc.',
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
                  congDoan: 'CẮT',
                  noiDung: '• Nhập vải nhuộm về xưởng.\n• Xả vải cơ nghỉ đúng thời gian quy định (24h - 48h).\n• Trải vải, giác sơ đồ vi tính và cắt chi tiết chính xác.\n• Phối bo, đánh số bán thành phẩm.',
                  qc: '• Kiểm tra thông số rập, sơ đồ cắt tối ưu định mức.\n• Kiểm tra lỗi mặt vải, lệch kẻ, tuyết vải.\n• Kiểm tra số lượng và kích thước chi tiết cắt.',
                  chungTu: '• Phiếu nhập vải\n• Phiếu trải cắt\n• Biên bản kiểm tra bán thành phẩm\n• Bảng sơ đồ cắt',
                  donVi: 'Nội bộ\n(Xưởng cắt POLOMIMIN)',
                },
                {
                  stt: '05',
                  congDoan: 'GIA CÔNG MAY',
                  noiDung: '• Chuyển bán thành phẩm cho xưởng may gia công.\n• May ráp các chi tiết thành sản phẩm hoàn chỉnh (áo thun, quần short, bộ đồ...).',
                  qc: '• QC kiểm soát đầu chuyền, giữa chuyền và cuối chuyền.\n• Kiểm tra mật độ mũi chỉ, đường may êm, không đứt chỉ, lệch chỉ.\n• Kiểm tra size và thông số theo bảng kích thước chuẩn.',
                  chungTu: '• Phiếu giao nhận BTP\n• Biên bản kiểm đồ & QC\n• Phiếu giao nhận thành phẩm',
                  donVi: 'Gia công ngoài\n(Xưởng may)',
                },
                {
                  stt: '06',
                  congDoan: 'ỦI & ĐÓNG GÓI THÀNH PHẨM',
                  noiDung: '• Thu hàng may về xưởng.\n• Cắt nhặt chỉ thừa, vệ sinh bề mặt.\n• Ủi hơi định hình phom chuẩn dáng.\n• Gắn tem mác, thẻ bài thương hiệu.\n• Đóng túi PE, đóng thùng xuất khẩu/nội địa.',
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

          pHeading1('III. NGUYÊN TẮC THỰC HIỆN & CAM KẾT CHẤT LƯỢNG'),
          pBody([
            { text: '1. Nguyên tắc hoạt động:\n', bold: true },
            '• ', { text: 'An toàn – Chất lượng – Đúng tiến độ:', bold: true }, ' Mọi khâu sản xuất đều phải tuân thủ nghiêm ngặt quy chuẩn an toàn lao động và chất lượng cam kết.\n',
            '• ', { text: 'Tuân thủ pháp luật & tiêu chuẩn áp dụng:', bold: true }, ' Tuyệt đối tuân thủ QCVN 01:2017/BCT về mức giới hạn formaldehyde và azo dyes.\n',
            '• ', { text: 'Cải tiến liên tục – Phát triển bền vững:', bold: true }, ' Ứng dụng công nghệ phần mềm ERP MIMIN tự động hóa quản lý từ sợi đến đơn hàng bán lẻ.',
          ]),
          pBody([
            { text: '2. Cam kết chất lượng:\n', bold: true },
            'POLOMIMIN cam kết kiểm soát chặt chẽ từ nguyên liệu sợi đầu vào đến thành phẩm đến tay người tiêu dùng, đảm bảo sản phẩm thời trang an toàn tuyệt đối cho sức khỏe, thân thiện môi trường và đúng chuẩn định lượng đã công bố.',
          ]),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'PHÒNG KỸ THUẬT & QC',
            'NGUYỄN VĂN THANH',
            'CÔNG TY TNHH DỆT MAY GIÀU SANG\nGIÁM ĐỐC',
            'HỒ MINH SANG',
            'TP. Hồ Chí Minh, ngày 10 tháng 01 năm 2026'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '02_Quy_Trinh_San_Xuat_Chuoi_Cung_Ung_Khep_Kin_POLOMIMIN.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 2:', outPath);
}

// -------------------------------------------------------------
// DOC 3: HỢP ĐỒNG NGUYÊN TẮC MUA BÁN SỢI (LUCKY AVANTI)
// -------------------------------------------------------------
async function buildDoc3() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          // Header 2 cột: Tên công ty bên trái, Quốc hiệu bên phải
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: noBorders,
                    width: { size: 45, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 40 },
                        children: [
                          new TextRun({
                            text: 'CÔNG TY TNHH DỆT LUCKY AVANTI',
                            font: FONT_FAMILY,
                            size: 22,
                            bold: true,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 40 },
                        children: [
                          new TextRun({
                            text: 'Số 656/74/28 Quang Trung, P. Thông Tây Hội, Tp.HCM\nĐT: (08) 62642013   Fax: (08) 62642013',
                            font: FONT_FAMILY,
                            size: 18,
                            color: COLOR_MUTED,
                          }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: noBorders,
                    width: { size: 55, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 40 },
                        children: [
                          new TextRun({
                            text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                            font: FONT_FAMILY,
                            size: 22,
                            bold: true,
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 0, after: 40 },
                        children: [
                          new TextRun({
                            text: 'Độc lập - Tự do - Hạnh phúc',
                            font: FONT_FAMILY,
                            size: 24,
                            bold: true,
                            underline: {},
                            color: COLOR_PRIMARY,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          ...pDocTitle(
            'HỢP ĐỒNG NGUYÊN TẮC\n(LOẠI NGUYÊN TẮC)',
            'Số: 99/HĐNT/2026'
          ),

          pBody([
            { text: '- Căn cứ Bộ luật Dân sự được Quốc hội thông qua ngày 14/6/2005;\n', italics: true },
            { text: '- Căn cứ Luật Thương mại được Quốc hội thông qua ngày 14/6/2005;\n', italics: true },
            { text: '- Căn cứ nhu cầu tiêu thụ và sản xuất của hai bên.', italics: true },
          ]),

          pBody([
            { text: 'Hôm nay, ngày 15 tháng 07 năm 2026. Hai bên chúng tôi gồm:', bold: true },
          ]),

          pBody([
            { text: 'BÊN A: CÔNG TY TNHH DỆT LUCKY AVANTI\n', bold: true },
            'Địa chỉ: Số 656/74/28 Quang Trung, Phường Thông Tây Hội, Tp.HCM.\n',
            '- Tel: (08) 62642013      Fax: (08) 62642013\n',
            '- MST: 0312405160\n',
            '- Đại diện: ', { text: 'Bà NGUYỄN THỊ YẾN NGA', bold: true }, '      Chức Vụ: Giám Đốc',
          ]),

          pBody([
            { text: 'BÊN B: CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
            'Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Bà Điểm, TP Hồ Chí Minh, Việt Nam\n',
            '- Tel: (08) 0774480916\n',
            '- MST: 0318507560\n',
            '- Đại diện: ', { text: 'Ông HỒ MINH SANG', bold: true }, '      Chức Vụ: Giám Đốc',
          ]),

          pBody('Sau khi bàn bạc hai bên đồng thỏa thuận ký kết hợp đồng mua bán theo các điều khoản sau:'),

          pHeading1('Điều 1: MẶT HÀNG'),
          pBody('Bên A bán cho bên B sản phẩm sợi như sau:'),
          pBody([
            { text: '* Mặt hàng:\n', bold: true },
            '• Sợi dùng cho dệt kim, dệt thoi. Chi số từ 10’s - 40’s:\n',
            '  - Sợi 100% Polyester.\n',
            '  - Sợi 100% cotton chải kỹ, chải thô.\n',
            '  - Sợi 65% Polyester 35% Cotton chải kỹ, chải thô.\n',
            '  - Sợi 40% Polyester 60% Cotton.\n',
            '  - Sợi 100% Viscose Rayon.\n',
            '  - Sợi 65% Polyester 35% Viscose.\n',
            '  - Sợi Melange.\n',
            '  - Sợi Modal.\n',
            '  - Sợi Spandex.\n',
            '  - Sợi Modal Cotton.\n',
            '  - Sợi DTY.\n',
            { text: '* Số lượng: ', bold: true }, 'Theo nhu cầu của bên mua và từng đơn hàng cụ thể.\n',
            { text: '* Giá cả: ', bold: true }, 'Tính theo từng thời điểm giao hàng, sẽ có sự thống nhất giữa hai bên.',
          ]),

          pHeading1('Điều 2: TIÊU CHUẨN KỸ THUẬT VÀ BAO BÌ ĐÓNG GÓI'),
          pBody([
            { text: '* Tiêu chuẩn chất lượng:\n', bold: true },
            '- Chất lượng: Hàng bảo đảm chất lượng theo mẫu mà hai bên đã thỏa thuận.\n',
            '- Thời hạn kiểm tra chất lượng: Sau khi nhận hàng bên mua tiến hành kiểm tra số lượng, chất lượng hàng hóa, nếu phát hiện sai sót về số lượng và chất lượng không đạt theo mẫu, bên mua phải bảo quản nguyên nhãn mác và thông báo bằng văn bản cho bên bán trong vòng 10 ngày kể từ ngày nhận hàng. Quá thời hạn trên, nếu bên bán không nhận được văn bản khiếu nại của bên mua, coi như hàng đạt chất lượng như thỏa thuận, mọi khiếu nại về sau bên bán sẽ không chịu trách nhiệm giải quyết.\n',
            { text: '* Bao bì đóng gói: ', bold: true }, 'Đóng gói bằng thùng carton, bao nylon.',
          ]),

          pHeading1('Điều 3: GIAO NHẬN - VẬN CHUYỂN - BỐC XẾP'),
          pBody([
            '- Địa điểm giao hàng: Hàng hóa được giao tại kho của bên mua trong nội thành Tp.HCM.\n',
            '- Vận chuyển: Bên A chịu trách nhiệm.\n',
            '- Bốc xếp: Mỗi bên chịu một đầu.\n',
            '- Trong quá trình giao nhận hai bên có trách nhiệm kiểm tra chặt chẽ về số lượng và chất lượng.',
          ]),

          pHeading1('Điều 4: PHƯƠNG THỨC THANH TOÁN'),
          pBody([
            'Thanh toán bằng hình thức chuyển khoản, thời gian thanh toán theo thỏa thuận của từng đơn hàng vào tài khoản của bên A tại:\n',
            { text: '• Số tài khoản: 033 100 042 5272 ', bold: true }, 'tại Ngân hàng Vietcombank – CN Bến Thành.\n',
            { text: '• Số tài khoản: 6730957 ', bold: true }, 'tại Ngân hàng Á Châu (ACB) – CN Lạc Long Quân.',
          ]),

          pHeading1('Điều 5: ĐIỀU KHOẢN CHUNG'),
          pBody([
            '- Hai bên cam kết thực hiện nghiêm chỉnh các điều khoản đã thỏa thuận, không được đơn phương thay đổi hoặc hủy bỏ hợp đồng. Bên nào không thực hiện hoặc đơn phương hủy hợp đồng mà không có lý do chính đáng sẽ phải bồi thường thiệt hại cho bên kia.\n',
            '- Mỗi thay đổi hoặc bổ sung hợp đồng phải thực hiện bằng văn bản. Trong quá trình thực hiện hợp đồng có khó khăn gì hai bên cùng bàn bạc giải quyết. Trong trường hợp không nhất trí thì phán quyết của Tòa Án Kinh Tế, Tòa Án Nhân Dân TP.HCM làm cơ sở để hai bên thi hành.\n',
            '- Hợp đồng này có hiệu lực từ ngày ký đến hết ngày 31/12/2026 và được lập thành hai (02) bản, mỗi bên giữ một (01) bản có giá trị ngang nhau. Trong vòng 1 tháng kể từ ngày hợp đồng hết hiệu lực, nếu hai bên đã thực hiện xong các quyền và nghĩa vụ và không phát sinh tranh chấp nào khác thì hợp đồng này mặc nhiên được thanh lý.',
          ]),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT LUCKY AVANTI',
            'NGUYỄN THỊ YẾN NGA',
            'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
            'HỒ MINH SANG',
            'Hôm nay, ngày 15 tháng 07 năm 2026'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '03_Hop_Dong_Mua_Ban_Soi_LUCKY_AVANTI_99_HDNT_2026.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 3:', outPath);
}

// -------------------------------------------------------------
// DOC 4: HỢP ĐỒNG NGUYÊN TẮC GIA CÔNG DỆT VẢI MỘC (HẢI DƯƠNG)
// -------------------------------------------------------------
async function buildDoc4() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          ...pQuocHieu(),
          ...pDocTitle(
            'HỢP ĐỒNG NGUYÊN TẮC',
            'HĐNT – SỐ 02/SM- AT/2026'
          ),

          pBody([
            { text: '- Căn cứ Bộ luật Dân sự 2005; Ban hành kèm theo QĐ số 33/2005/QH11 ngày 27/6/2005 của Quốc hội nước Cộng hoà xã hội chủ nghĩa Việt Nam;\n', italics: true },
            { text: '- Căn cứ vào Luật Thương mại 2005; Ban hành kèm theo QĐ số 36/2005/QH11 ngày 14 tháng 6 năm 2005 của Quốc hội nước Cộng hoà xã hội chủ nghĩa Việt Nam;\n', italics: true },
            { text: '- Căn cứ vào nhu cầu mua bán và gia công của 2 bên;', italics: true },
          ]),

          pBody([
            { text: 'Hôm nay, ngày 01 tháng 01 năm 2026, tại Công ty TNHH SX- TM DỆT MAY HẢI DƯƠNG\nChúng tôi gồm có:', bold: true },
          ]),

          pBody([
            { text: 'BÊN A: CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
            { text: '(BÊN ĐƯA GIA CÔNG + MUA SỢI)\n', italics: true, color: COLOR_MUTED },
            'Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, ấp 7, Xã Xuân Thới Thượng, Huyện Hóc Môn, TP.HCM\n',
            'Mã số thuế: 0318507560\n',
            'Tài khoản: ', { text: '7777369369369 – Ngân hàng MB\n', bold: true },
            'Đại diện (Ông/Bà): ', { text: 'Hồ Minh Sang', bold: true }, '      Chức Vụ: Giám Đốc',
          ]),

          pBody([
            { text: 'BÊN B: CÔNG TY TNHH SX- TM DỆT MAY HẢI DƯƠNG\n', bold: true },
            { text: '(BÊN NHẬN GIA CÔNG + BÁN SỢI)\n', italics: true, color: COLOR_MUTED },
            'Địa chỉ: 8/6A, Ấp 2, Xã Xuân Thới Thượng, Huyện Hóc Môn, Thành phố Hồ Chí Minh, Việt Nam\n',
            'Mã số thuế: 0314588287\n',
            'Tài khoản: ', { text: '060159953060 - Ngân hàng Sacombank - Chi nhánh Sơn Kỳ\n', bold: true },
            'Đại diện (Ông/Bà): ', { text: 'NGUYỄN VĂN NGA', bold: true }, '      Chức vụ: Giám Đốc',
          ]),

          pBody('Hai bên cùng nhau thống nhất thoả thuận ký kết hợp đồng nguyên tắc với các điều khoản sau:'),

          pHeading1('Điều 1: Nội dung hợp đồng'),
          pBody('Bên B cung cấp cho bên A sợi SPANDEX-40 và nhận gia công dệt vải thun mộc cho bên A (theo mẫu bên A yêu cầu), sợi do bên A cung cấp theo từng đơn hàng cụ thể. Thời gian cung cấp từ ngày 01/01/2026 đến ngày 31/12/2026.'),

          pHeading1('Điều 2: Yêu cầu, quy cách, chất lượng, giá cả'),
          pBody([
            '- Chất lượng hàng đảm bảo theo tiêu chuẩn như mẫu đã chào của nhà sản xuất.\n',
            '- Bên B đảm bảo chất lượng, hàng tốt và cung cấp đủ số hàng bên A đã đặt. Loại sợi, số lượng, giá cả tuỳ thuộc vào sự thoả thuận của hai bên theo từng thời điểm đơn đặt hàng.\n',
            '- Nếu bên B giao hàng không đạt chất lượng, vải lỗi sợi, dơ ... thì bên B có trách nhiệm xử lý, hoặc bồi thường phần thiệt hại cho bên A theo đúng số lượng thực tế.',
          ]),

          pHeading1('Điều 3: Phương thức đặt hàng, giao nhận'),
          pBody([
            '- Khi có nhu cầu đặt hàng bên A có thể đặt hàng trực tiếp qua điện thoại, tin nhắn Zalo với bên B.\n',
            '- Kể từ khi nhận được đơn hàng, bên B sẽ tiến hành giao hàng cho bên A theo thời gian đã thoả thuận.\n',
            '- Chứng từ giao hàng: Hoá đơn bán hàng, phiếu xuất kho đi kèm.\n',
            '- Địa điểm giao hàng: Giao hàng theo địa chỉ bên A yêu cầu theo mỗi đợt giao hàng.\n',
            '- Địa chỉ nơi giao hàng: Do bên A chỉ định (qua email, Zalo, tin nhắn).',
          ]),

          pHeading1('Điều 4: Phương thức thanh toán'),
          pBody([
            '- Hình thức thanh toán: Bằng tiền mặt hoặc chuyển khoản.\n',
            '- Kế hoạch thanh toán: Bên A sẽ thanh toán cho Bên B từ ngày 1 đến ngày 10 hàng tháng theo hoá đơn đã xuất ra cho bên A. Nếu trong thời gian trên bên A chưa thanh toán thì sẽ chịu phí phạt chậm theo lãi suất ngân hàng Vietcombank.',
          ]),

          pHeading1('Điều 5: Các điều khoản chung'),
          pBody([
            '- Hai bên cam kết thực hiện đúng các điều khoản của hợp đồng.\n',
            '- Trong quá trình thực hiện, nếu có khó khăn trở ngại phải báo cho bên kia biết trước 5 ngày để cùng nhau giải quyết trên tinh thần 2 bên cùng có lợi. Bên nào vi phạm dẫn đến chấm dứt hợp đồng phải chịu bồi thường mọi chi phí thiệt hại.\n',
            '- Mọi tranh chấp hợp đồng nếu không giải quyết được giữa hai bên thì sẽ thực hiện theo quyết định cuối cùng của Toà án kinh tế TP.HCM.\n',
            '- Hợp đồng được lập thành 02 bản, mỗi bên giữ 01 bản có giá trị pháp lý như nhau.',
          ]),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
            'HỒ MINH SANG',
            'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH SX-TM DỆT MAY HẢI DƯƠNG',
            'NGUYỄN VĂN NGA',
            'Hóc Môn, ngày 01 tháng 01 năm 2026'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '04_Hop_Dong_Gia_Cong_Det_Vai_Moc_HAI_DUONG_02_SM_AT_2026.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 4:', outPath);
}

// -------------------------------------------------------------
// DOC 5: HỢP ĐỒNG GIA CÔNG NHUỘM HOÀN TẤT VẢI (TÂN ĐỨC KHANH)
// -------------------------------------------------------------
async function buildDoc5() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          ...pQuocHieu(),
          ...pDocTitle(
            'HỢP ĐỒNG NGUYÊN TẮC\n(V/v gia công nhuộm hoàn tất vải)',
            'Số: 11-2026/HĐNT-GIAUSANG'
          ),

          pBody([
            { text: '- Căn cứ Bộ Luật Dân sự số 91/2015/QH13 được Quốc hội nước CHXHCN Việt Nam thông qua ngày 24/11/2015;\n', italics: true },
            { text: '- Căn cứ Luật Thương mại số 36/2005/QH11 do Quốc hội nước Cộng hòa xã hội chủ nghĩa Việt Nam thông qua ngày 14 tháng 6 năm 2005;\n', italics: true },
            { text: '- Căn cứ nhu cầu và khả năng của hai Bên,', italics: true },
          ]),

          pBody([
            { text: 'Hôm nay, ngày 01 tháng 08 năm 2026, chúng tôi gồm:\n', bold: true },
          ]),

          pBody([
            { text: 'BÊN NHẬN GIA CÔNG: CÔNG TY TNHH DỆT NHUỘM TÂN ĐỨC KHANH\n', bold: true },
            '- Địa chỉ: Lô I22-23-24A, Đường số 5, KCN Hải Sơn (GĐ 3 + 4), Ấp Bình Tiền 2, Xã Đức Hòa, Tỉnh Tây Ninh (hoặc Long An), Việt Nam.\n',
            '- Điện thoại: 091 495 6162\n',
            '- Mã số thuế: 1101744462\n',
            '- Tài khoản: ', { text: '210314851017265 - Tại Ngân hàng Eximbank - CN Tây Sài Gòn\n', bold: true },
            '- Đại diện: ', { text: 'Ông LƯU MẠNH HÙNG', bold: true }, '      Chức vụ: Giám đốc\n',
            { text: '(Sau đây gọi là “Bên A”)', italics: true, color: COLOR_MUTED },
          ]),

          pBody([
            { text: 'BÊN GIA CÔNG: CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
            '- Địa chỉ: 12/39 Đường Xuân Thới Thượng 58C, Ấp 7, Xã Bà Điểm, Thành phố Hồ Chí Minh, Việt Nam.\n',
            '- Mã số thuế: 0318507560\n',
            '- Tài khoản: ', { text: '7777369369369 - Tại Ngân hàng MB\n', bold: true },
            '- Đại diện: ', { text: 'Ông HỒ MINH SANG', bold: true }, '      Chức vụ: Giám đốc\n',
            { text: '(Sau đây gọi là “Bên B”)', italics: true, color: COLOR_MUTED },
          ]),

          pBody('Sau khi thỏa thuận, hai Bên cùng đồng ý ký kết Hợp đồng nguyên tắc về việc gia công nhuộm hoàn tất vải cho bên B (sau đây gọi là “Hợp đồng”) với các điều khoản sau:'),

          pHeading1('Điều 1: Hàng hóa, giá cả, số lượng'),
          pBody([
            '1. Bên B cung cấp cho bên A vải mộc các loại và bên A sẽ gia công nhuộm hoàn tất các loại vải theo yêu cầu kỹ thuật của Bên B, quy cách, chất lượng theo mẫu của bên B cung cấp.\n',
            '2. Đơn giá gia công theo từng đơn đặt hàng của bên B có sự xác nhận của Bên A.\n',
            '3. Khối lượng cụ thể được thể hiện bằng các đơn đặt hàng cụ thể được hai bên xác nhận (gửi bằng điện thoại, fax, email hoặc zalo,...).',
          ]),

          pHeading1('Điều 2: Thời gian, địa điểm và điều kiện giao hàng'),
          pBody([
            '1. Địa điểm nhận vải mộc: Do bên B cung cấp theo từng đơn hàng, trong phạm vi TP.HCM, trường hợp khoảng cách xa thì hai bên thỏa thuận chi phí giao nhận.\n',
            '2. Địa điểm giao vải thành phẩm: Tại kho bên B.\n',
            '3. Thời gian xuất hàng thành phẩm: Theo từng đơn đặt hàng.\n',
            '4. Hình thức giao hàng: Theo từng đơn đặt hàng.\n',
            '5. Chứng từ kèm theo bao gồm: Phiếu xuất kho.',
          ]),

          pHeading1('Điều 3: Giá trị hợp đồng và phương thức thanh toán'),
          pBody([
            '1. Giá trị hợp đồng là tạm tính căn cứ vào đơn giá được xác nhận giữa 2 bên từng thời điểm và khối lượng thực tế được giao nhận giữa hai bên.\n',
            '2. Phương thức thanh toán: Bên A và Bên B sẽ tiến hành đối chiếu số lượng, ký xác nhận công nợ số lượng gia công và tiến hành xuất hóa đơn. Hồ sơ thanh toán như sau:\n',
            '   • Phiếu xuất kho.\n',
            '   • Xác nhận công nợ.\n',
            '   • Xác nhận tồn kho.\n',
            '   • Hóa đơn GTGT.\n',
            'Bên B thanh toán giá trị hợp đồng cho bên A bằng hình thức giao nhận tiền mặt hoặc chuyển khoản vào tài khoản ngân hàng của bên A, số tài khoản ',
            { text: '210314851017265 mở tại Ngân hàng Eximbank - CN Tây Sài Gòn.\n', bold: true },
            'Thời hạn thanh toán: 30 ngày kể từ ngày xuất hóa đơn GTGT.\n',
            'Đồng tiền sử dụng để thanh toán theo Hợp đồng này là Việt Nam Đồng (viết tắt VNĐ).',
          ]),

          pHeading1('Điều 4: Trách nhiệm của hai bên'),
          pBody([
            { text: '1. Bên gia công (Bên B):\n', bold: true },
            '- Cung cấp đầy đủ cho bên A vải mộc phục vụ cho sản xuất gia công.\n',
            '- Trong quá trình gia công, nếu phát sinh các nguyên liệu phụ khác hai bên sẽ thỏa thuận bằng phụ lục, cung cấp mẫu và chứng từ kỹ thuật cần thiết để bên A gia công.\n',
            '- Nếu hàng do lỗi của bên B thì mọi chi phí sửa chữa, nguyên liệu hàng do bên B chịu trách nhiệm.\n\n',
            { text: '2. Bên nhận gia công (Bên A):\n', bold: true },
            '- Bảo quản, lưu trữ vải mộc do bên B cung cấp, đảm bảo không được ẩm mốc, ướt, thất thoát....\n',
            '- Thực hiện sản xuất đúng theo quy trình kỹ thuật yêu cầu và giao hàng theo sự chỉ định của bên B.\n',
            '- Nếu hàng không đạt chất lượng yêu cầu do lỗi của bên A, thì bên A chịu mọi chi phí sửa chữa, nguyên liệu hàng sẽ do bên A chịu trách nhiệm.\n',
            '- Tự cung cấp các nguyên liệu phụ phát sinh (nếu có) mua tại Việt Nam.\n',
            '- Tự chịu trách nhiệm về máy móc, thiết bị trong quá trình thực hiện hợp đồng gia công.\n',
            '- Bồi thường thiệt hại nguyên liệu cho bên B nếu vải bị: hư hỏng, mất mát, giá trị đền bù theo sự thoả thuận 2 bên.\n',
            '- Đền bù chi phí delay nếu có do bên A gây nên: hàng bị hư hỏng, quá ngày giao hàng yêu cầu.',
          ]),

          pHeading1('Điều 5: Thời hạn hợp đồng'),
          pBody('Hợp đồng này có giá trị từ ngày ký đến hết ngày 31 tháng 12 năm 2026.'),

          pHeading1('Điều 6: Điều khoản chung'),
          pBody([
            '- Các bên cùng cam kết nghiêm túc thực hiện các điều khoản trong hợp đồng. Bất kỳ hành động đơn phương hủy bỏ hợp đồng nào cũng sẽ không được chấp nhận nếu không có sự thỏa thuận trước của hai bên.\n',
            '- Mọi phát sinh trong quá trình thực hiện hợp đồng này sẽ được hai bên cùng nhau bàn bạc giải quyết trên tinh thần hữu nghị hợp tác. Nếu không tự giải quyết được thì hai bên sẽ thống nhất nộp đơn đến Tòa án có thẩm quyền để giải quyết. Quyết định của tòa án là quyết định chính thức và ràng buộc các bên tham gia phải chấp hành.\n',
            '- Hợp đồng này được lập thành 02 (hai) bản, mỗi bên giữ 01 (một) bản có giá trị pháp lý như nhau.',
          ]),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'ĐẠI DIỆN BÊN B\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
            'HỒ MINH SANG',
            'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT NHUỘM TÂN ĐỨC KHANH',
            'LƯU MẠNH HÙNG',
            'Ngày 01 tháng 08 năm 2026'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '05_Hop_Dong_Gia_Cong_Nhuom_Hoan_Tat_TAN_DUC_KHANH_11_2026.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 5:', outPath);
}

// -------------------------------------------------------------
// DOC 6: HỢP ĐỒNG GIA CÔNG MAY MẶC (NGUYỄN THỊ NGỌC DUNG)
// -------------------------------------------------------------
async function buildDoc6() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          ...pQuocHieu(),
          ...pDocTitle(
            'HỢP ĐỒNG NGUYÊN TẮC GIA CÔNG MAY MẶC',
            'Số: 022025/HĐGC - POLOMON'
          ),

          pBody([
            { text: '- Căn cứ Bộ luật Dân sự số 91/2015/QH13 ngày 24/11/2015;\n', italics: true },
            { text: '- Căn cứ Luật Thương mại số 36/2005/QH11 ngày 14/06/2005;\n', italics: true },
            { text: '- Căn cứ nhu cầu và khả năng của các bên;', italics: true },
          ]),

          pBody([
            { text: 'Hôm nay, ngày ...... tháng ...... năm 2025 tại Công ty TNHH Dệt May Giàu Sang\nChúng tôi gồm có:', bold: true },
          ]),

          pBody([
            { text: 'BÊN GIA CÔNG (Bên A):\n', bold: true },
            'Tên tổ chức: ', { text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG\n', bold: true },
            'Mã số doanh nghiệp: 0318507560\n',
            'Địa chỉ trụ sở chính: 12/39 đường Xuân Thới Thượng 58C, Xã Bà Điểm, TP.HCM\n',
            'Đại diện: ', { text: 'Hồ Minh Sang', bold: true }, '      Chức vụ: Giám Đốc\n',
            'Điện thoại: 0779333963      Email: congtydetmaygiausang@gmail.com',
          ]),

          pBody([
            { text: 'BÊN NHẬN GIA CÔNG (Bên B):\n', bold: true },
            'Tên Hộ Kinh Doanh: ', { text: 'HỘ KINH DOANH – NGUYỄN THỊ NGỌC DUNG\n', bold: true },
            'Mã số thuế: 8898968687-001\n',
            'Đại diện: ', { text: 'Nguyễn Thị Ngọc Dung\n', bold: true },
            'CCCD số: 091183000355      Cấp ngày: 27/03/2022      Tại: Cục cảnh sát\n',
            'Địa chỉ hiện tại: Số 45C đường 26 ấp trung, Xã Tân Thông Hội, Huyện Củ Chi, Tp.HCM\n',
            'Điện thoại: 0383373415',
          ]),

          pBody('Trên cơ sở thỏa thuận hoàn toàn tự nguyện, hai bên thống nhất ký kết hợp đồng gia công may mặc với các điều khoản như sau:'),

          pHeading1('Điều 1: Đối tượng của hợp đồng'),
          pBody('Hai bên thỏa thuận về việc Bên A đồng ý thuê Bên B thực hiện gia công sản phẩm cho bên A chi tiết như sau:'),
          pBody([
            { text: '1.1. Sản phẩm gia công & Bảng đơn giá chi tiết:\n', bold: true },
          ]),

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
                { stt: '1', sp: 'Quần short trơn cắt chi tiết', gia: '10.000' },
                { stt: '2', sp: 'Quần short phối cắt chi tiết', gia: '11.000' },
                { stt: '3', sp: 'Áo trụ trơn cắt chi tiết', gia: '13.500' },
                { stt: '4', sp: 'Áo trụ phối cắt chi tiết', gia: '15.500' },
                { stt: '5', sp: 'Áo tròn trơn cắt chi tiết', gia: '8.000' },
                { stt: '6', sp: 'Áo tròn phối cắt chi tiết', gia: '9.500' },
              ].map((row, idx) =>
                new TableRow({
                  children: [
                    makeCell(row.stt, 10, { alignment: AlignmentType.CENTER, isAlt: idx % 2 === 1 }),
                    makeCell(row.sp, 60, { bold: true, isAlt: idx % 2 === 1 }),
                    makeCell(row.gia + ' đ', 30, { alignment: AlignmentType.RIGHT, bold: true, isAlt: idx % 2 === 1 }),
                  ],
                })
              ),
            ],
          }),

          pBody([
            { text: '(Đơn giá trên đã bao gồm toàn bộ chi phí nhân công, không bao gồm nguyên vật liệu do Bên A cung cấp)\n', italics: true, color: COLOR_MUTED },
            { text: '1.2. Quy cách sản phẩm: ', bold: true },
            'Tất cả các chi tiết kỹ thuật và kiểu mẫu theo đúng sự chỉ dẫn theo từng lô hàng do Bên A cung cấp.',
          ]),

          pHeading1('Điều 2. Cung cấp nguyên liệu'),
          pBody([
            '- Bên A có trách nhiệm cung ứng nguyên vật liệu chính, phụ,... phù hợp với từng đơn hàng.\n',
            '- Bên B có trách nhiệm bảo quản, đảm bảo về số lượng, chất lượng các nguyên liệu do bên A cung ứng tại thời điểm chuyển giao và phải sử dụng đúng loại nguyên liệu.',
          ]),

          pHeading1('Điều 3. Thời hạn và phương thức thanh toán'),
          pBody([
            '3.1. Hình thức thanh toán: Chuyển khoản / tiền mặt.\n',
            '3.2. Thanh toán được thực hiện sau khi Bên A nghiệm thu số lượng đạt yêu cầu theo từng tháng.\n',
            '3.3. Trường hợp sản phẩm bị lỗi trên 5% Bên A có quyền yêu cầu gia công lại hoặc khấu trừ tương đương.',
          ]),

          pHeading1('Điều 4. Thời gian, địa điểm, phương thức giao hàng'),
          pBody([
            '4.1. Bên B chuyển giao sản phẩm gia công cho Bên A tại kho theo địa chỉ của Bên A.\n',
            '4.2. Phương tiện vận chuyển và chi phí vận chuyển do bên B thanh toán.\n',
            '4.3. Khi nhận hàng, bên A có trách nhiệm kiểm tra sản phẩm gia công tại chỗ. Nếu phát hiện sản phẩm gia công thiếu hoặc không đúng tiêu chuẩn chất lượng thì lập biên bản tại chỗ, yêu cầu bên B xác nhận.',
          ]),

          pHeading1('Điều 5. Quyền và nghĩa vụ của Bên A'),
          pBody([
            '5.1. Cung cấp nguyên vật liệu theo đúng số lượng, chất lượng, thời hạn và địa điểm cho bên B, trừ trường hợp có thoả thuận khác; cung cấp các giấy tờ cần thiết liên quan đến việc gia công;\n',
            '5.2. Chỉ dẫn cho bên B thực hiện hợp đồng;\n',
            '5.3. Chịu trách nhiệm đối với tính hợp pháp về quyền sở hữu trí tuệ của hàng hoá gia công, nguyên liệu, vật liệu, máy móc, thiết bị dùng để gia công chuyển cho bên B;\n',
            '5.4. Trả tiền công theo đúng thoả thuận;\n',
            '5.5. Bồi thường thiệt hại xảy ra cho bên B nếu có thiệt hại phát sinh từ hành vi vi phạm của Bên A;\n',
            '5.6. Bên A có quyền nhận lại toàn bộ sản phẩm gia công, nguyên, phụ liệu, vật tư, phế liệu, vật tư dư thừa, phế phẩm, phế liệu theo đúng số lượng, chất lượng, phương thức, thời hạn và địa điểm đã thoả thuận;\n',
            '5.7. Bên A có quyền cử người đại diện để kiểm tra, giám sát việc gia công tại nơi nhận gia công, cử chuyên gia để hướng dẫn kỹ thuật sản xuất và kiểm tra chất lượng sản phẩm gia công theo thoả thuận trong hợp đồng gia công;\n',
            '5.8. Bên A có quyền Đơn phương chấm dứt thực hiện hợp đồng và yêu cầu bồi thường thiệt hại khi bên B vi phạm nghiêm trọng hợp đồng.',
          ]),

          pHeading1('Điều 6. Trách nhiệm của Bên B'),
          pBody([
            '6.1. Bảo quản nguyên vật liệu do bên A cung cấp.\n',
            '6.2. Giao sản phẩm cho bên A đúng số lượng, chất lượng, phương thức, thời hạn và địa điểm đã thoả thuận.\n',
            '6.3. Báo cho bên A biết để đổi nguyên vật liệu khác, nếu nguyên vật liệu không bảo đảm chất lượng; từ chối thực hiện gia công, nếu việc sử dụng nguyên vật liệu có thể tạo ra sản phẩm nguy hại cho xã hội; trường hợp không báo hoặc không từ chối thì phải chịu trách nhiệm về sản phẩm tạo ra.\n',
            '6.4. Giữ bí mật các thông tin về quy trình gia công và sản phẩm tạo ra.\n',
            '6.5. Chịu trách nhiệm về chất lượng sản phẩm, trừ trường hợp sản phẩm không bảo đảm chất lượng do nguyên vật liệu mà bên A cung cấp hoặc do sự chỉ dẫn không hợp lý của bên A.\n',
            '6.6. Hoàn trả nguyên vật liệu còn lại cho bên A sau khi hoàn thành hợp đồng.\n',
            '6.7. Bên B có quyền yêu cầu bên A giao nguyên vật liệu đúng chất lượng, số lượng, thời hạn và địa điểm đã thoả thuận.\n',
            '6.8. Từ chối sự chỉ dẫn không hợp lý của bên A, nếu thấy chỉ dẫn đó có thể làm giảm chất lượng sản phẩm, nhưng phải báo ngay cho bên A.\n',
            '6.9. Yêu cầu bên A trả đủ tiền công theo đúng thời hạn và phương thức đã thoả thuận.',
          ]),

          pHeading1('Điều 7. Điều khoản phạt vi phạm hợp đồng và bồi thường thiệt hại'),
          pBody([
            '7.1. Hai bên cam kết thực hiện đầy đủ các điều khoản đã thỏa thuận trên, không được đơn phương thay đổi hoặc hủy bỏ hợp đồng, bên nào không thực hiện hoặc đơn phương đình chỉ thực hiện hợp đồng mà không có lý do chính đáng thì sẽ bị phạt 5 % giá trị phần nghĩa vụ của hợp đồng bị vi phạm.\n',
            '7.2. Nếu trong quá trình thực hiện hợp đồng, một trong hai bên có hành vi vi phạm hợp đồng gây thiệt hại cho bên kia thì phải bồi thường thiệt hại, theo đó, bên gây thiệt hại phải chịu trách nhiệm hoàn toàn và bồi thường thiệt hại đối với những thiệt hại mà hành vi vi phạm đó gây ra.',
          ]),

          pHeading1('Điều 8. Bất khả kháng và giải quyết tranh chấp'),
          pBody([
            '8.1. Bất khả kháng nghĩa là các sự kiện xảy ra một cách khách quan, không thể lường trước được bao gồm nhưng không hạn chế các sự kiện như: thiên tai, hỏa hoạn, lũ lụt, chiến tranh, bạo loạn, xung đột vũ trang... gây ảnh hưởng đến việc thực hiện quyền và nghĩa vụ của các bên trong Hợp đồng này.\n',
            '8.2. Khi xảy ra sự kiện bất khả kháng, bên bị ảnh hưởng phải thông báo cho bên kia trong vòng 10 ngày kể từ ngày xảy ra sự kiện bất khả kháng phải thông báo bằng văn bản cho bên kia.\n',
            '8.3. Trừ trường hợp bất khả kháng, hai bên phải thực hiện đầy đủ và đúng thời hạn các nội dung của hợp đồng này. Trong quá trình thực hiện hợp đồng, nếu có vướng mắc từ bất kỳ bên nào, hai bên sẽ cùng nhau giải quyết trên tinh thần hợp tác.',
          ]),

          pHeading1('Điều 9. Các trường hợp chấm dứt hợp đồng'),
          pBody([
            'Hợp đồng này sẽ được chấm dứt trong các trường hợp sau:\n',
            '- Khi các Bên thực hiện xong các quyền và nghĩa vụ quy định trong Hợp đồng này.\n',
            '- Khi một Bên vi phạm hợp đồng dẫn đến Hợp đồng không thể thực hiện được thì phía Bên kia có quyền đơn phương chấm dứt hợp đồng.\n',
            '- Hợp đồng có thể được chấm dứt do sự thỏa thuận của các Bên.',
          ]),

          pHeading1('Điều 10. Điều khoản chung'),
          pBody([
            '10.1. Hợp đồng này có hiệu lực từ ngày ký cho đến khi có văn bản thanh lý hợp đồng giữa 2 bên.\n',
            '10.2. Hợp đồng này có giá trị kể từ ngày ký. Mọi sự bổ sung, sửa đổi hợp đồng này đều phải có sự đồng ý bằng văn bản của hai bên.\n',
            '10.3. Trừ các trường hợp được quy định ở trên, hợp đồng này không thể bị hủy bỏ nếu không có thỏa thuận bằng văn bản của các bên. Trong trường hợp hủy hợp đồng, trách nhiệm liên quan tới phạt vi phạm hợp đồng và bồi thường thiệt hại được bảo lưu.\n',
            '10.4. Trong quá trình thực hiện Hợp đồng này, nếu pháp luật Việt Nam thay đổi dẫn đến sự thay đổi toàn bộ hoặc từng phần trong các điều khoản trong Hợp đồng này thì hai bên sẽ cùng thỏa thuận để lập biên bản bổ sung sao cho phù hợp. Biên bản bổ sung sẽ có giá trị pháp lý như Hợp đồng này. Khi cần thiết cụ thể hóa các điều khoản của Hợp đồng hai bên sẽ cùng nhau thỏa thuận và ký Phụ lục Hợp đồng. Phụ lục hợp đồng là bộ phận không thể tách rời của Hợp đồng này và có hiệu lực pháp lý.\n',
            '10.5. Hợp đồng này được lập thành 2 bản, mỗi bên giữ 1 bản và có giá trị pháp lý như nhau.',
          ]),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'ĐẠI DIỆN BÊN A\nCÔNG TY TNHH DỆT MAY GIÀU SANG',
            'HỒ MINH SANG',
            'ĐẠI DIỆN BÊN B\nHỘ KINH DOANH NGUYỄN THỊ NGỌC DUNG',
            'NGUYỄN THỊ NGỌC DUNG',
            'TP. Hồ Chí Minh, ngày ...... tháng ...... năm 2025'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '06_Hop_Dong_Gia_Cong_May_Mac_NGUYEN_THI_NGOC_DUNG_022025.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 6:', outPath);
}

// -------------------------------------------------------------
// DOC 7: SƠ ĐỒ TỔ CHỨC CÔNG TY (POLOMIMIN)
// -------------------------------------------------------------
async function buildDoc7() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1418 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'CÔNG TY TNHH DỆT MAY GIÀU SANG',
                font: FONT_FAMILY,
                size: 28,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({
                text: 'THƯƠNG HIỆU: POLOMIMIN (PREMIUM QUALITY)',
                font: FONT_FAMILY,
                size: 24,
                bold: true,
                color: '1E40AF',
              }),
            ],
          }),
          ...pDocTitle(
            'SƠ ĐỒ TỔ CHỨC BỘ MÁY QUẢN LÝ VÀ VẬN HÀNH',
            'Hệ thống quản trị chuỗi sản xuất khép kín và phân phối đa kênh'
          ),

          // Lãnh đạo cấp cao
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            rows: [
              new TableRow({
                children: [
                  makeCell([
                    { text: 'CỐ VẤN CHIẾN LƯỢC\n', bold: true, color: '1E40AF' },
                    'Hỗ trợ định hướng chiến lược, mở rộng quy mô hệ thống, phát triển đối tác & nguồn lực',
                  ], 45, { shading: { fill: 'EFF6FF' }, alignment: AlignmentType.CENTER }),
                  makeCell([
                    { text: 'GIÁM ĐỐC ĐIỀU HÀNH\n', bold: true, color: '1E3A8A' },
                    { text: 'HỒ MINH SANG\n', bold: true, size: 26 },
                    'Định hướng chiến lược toàn diện – Quản trị điều hành chung – Đại diện pháp luật',
                  ], 55, { shading: { fill: 'DBEAFE' }, alignment: AlignmentType.CENTER }),
                ],
              }),
            ],
          }),

          pHeading1('CƠ CẤU 6 KHỐI PHÒNG BAN CHỨC NĂNG'),

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
                  nhanSu: '• Trưởng khối: Thanh\n• Tổ trưởng cắt: Giang\n• Tổ trưởng đầu khúc: Việt\n• Tổ trưởng dây chuyền: Thịnh\n• Tổ trưởng gấp xếp: Phương\n• Tổ trưởng ủi: Tuyền\n• Nhập kho - Giao hàng: Trường',
                  nhiemVu: '• Quản trị kế hoạch sản xuất, điều phối xưởng cắt nội bộ.\n• Quản lý tiến độ dây chuyền may, kiểm soát tỷ lệ size.\n• Điều phối gia công ngoài, tổ ủi, tổ gấp xếp và hoàn thiện.\n• Chốt số lượng thực tế tại TyLeSizeModal và giao nhập kho.',
                },
                {
                  stt: '2',
                  khoi: 'KHỐI KẾ TOÁN\nTÀI CHÍNH',
                  nhanSu: '• Kế toán trưởng: Thanh\n• Kế toán công nợ\n• Kế toán thu chi\n• Kế toán kho',
                  nhiemVu: '• Theo dõi công nợ nhà cung cấp 3 khâu: Sợi, Dệt, Nhuộm.\n• Quản lý công nợ khách hàng B2B, đối soát tiền về sàn TMĐT.\n• Tính lương khoán theo sản phẩm cho các tổ sản xuất.\n• Quản trị dòng tiền, hạch toán hóa đơn chứng từ GTGT.',
                },
                {
                  stt: '3',
                  khoi: 'KHỐI KINH DOANH\nBÁN HÀNG',
                  nhanSu: '• Quản lý bán hàng: Ngọc Giàu\n• Bán lẻ TikTok Shop: Thúng\n• Bán lẻ Shopee: Huyền\n• Bán sỉ & Khách dự án: Vy\n• KOC / Affiliate: Hùng',
                  nhiemVu: '• Phát triển kênh bán lẻ đa sàn (TikTok Shop, Shopee, Web).\n• Chăm sóc khách hàng sỉ, đại lý phân phối, báo giá dự án.\n• Kết nối mạng lưới KOC, Affiliate, xúc tiến bán hàng.\n• Quản trị đơn hàng và nâng cao dịch vụ chăm sóc khách hàng.',
                },
                {
                  stt: '4',
                  khoi: 'KHỐI KHO VẬN\nLOGISTICS',
                  nhanSu: '• Quản lý kho: Hậu\n• Thủ kho vải\n• Thủ kho phụ liệu\n• Thủ kho thành phẩm\n• Đóng gói – Xuất hàng\n• Giao nhận vận tải',
                  nhiemVu: '• Quản lý nhập - xuất - tồn kho vải mộc và vải thành phẩm.\n• Quản lý kho phụ liệu (chỉ, bo, nút, nhãn mác, bao bì).\n• Quản lý kho thành phẩm MAN PJ, POLOMIMIN theo vị trí kệ.\n• Đóng gói đơn hàng, điều phối giao nhận vận tải nhanh chóng.',
                },
                {
                  stt: '5',
                  khoi: 'KHỐI KỸ THUẬT\nR&D – QC',
                  nhanSu: '• Kỹ thuật trưởng\n• Thiết kế rập\n• R&D mẫu\n• QC kiểm tra chất lượng\n• Tiêu chuẩn kỹ thuật',
                  nhiemVu: '• Nghiên cứu phát triển mẫu mã mới, xu hướng thời trang.\n• Thiết kế rập, nhảy size, giác sơ đồ tối ưu định mức vải.\n• May mẫu proto, kiểm tra thông số và độ co giãn vải.\n• Kiểm soát chất lượng KCS/QC toàn diện qua các công đoạn.',
                },
                {
                  stt: '6',
                  khoi: 'KHỐI HỆ THỐNG\nCÔNG NGHỆ (IT)',
                  nhanSu: '• Quản trị hệ thống: Phi\n• Vận hành phần mềm MIMIN OS\n• Quản trị cơ sở dữ liệu\n• Hạ tầng & Bảo mật\n• Hỗ trợ người dùng',
                  nhiemVu: '• Vận hành và tối ưu phần mềm ERP MIMIN độc quyền.\n• Tự động hóa quy trình sản xuất, đồng bộ dữ liệu thời gian thực.\n• Bảo mật thông tin kinh doanh, backup dữ liệu an toàn.\n• Hỗ trợ kỹ thuật người dùng, đào tạo nhân sự sử dụng ERP.',
                },
              ].map((row, idx) =>
                new TableRow({
                  children: [
                    makeCell(row.stt, 6, { alignment: AlignmentType.CENTER, bold: true, isAlt: idx % 2 === 1 }),
                    makeCell(row.khoi, 25, { bold: true, isAlt: idx % 2 === 1 }),
                    makeCell(row.nhanSu, 25, { size: 21, isAlt: idx % 2 === 1 }),
                    makeCell(row.nhiemVu, 44, { size: 21, isAlt: idx % 2 === 1 }),
                  ],
                })
              ),
            ],
          }),

          pHeading1('NGUYÊN TẮC HOẠT ĐỘNG & QUY ĐỊNH ĐIỀU HÀNH'),
          pBody([
            { text: '1. Khách hàng là trung tâm: ', bold: true },
            'Mọi cải tiến và sản phẩm đều hướng tới trải nghiệm hài lòng tối đa của khách hàng.\n',
            { text: '2. Chất lượng là ưu tiên: ', bold: true },
            'Không thỏa hiệp với sản phẩm lỗi. Kiểm soát nghiêm ngặt từ sợi đến từng đường may.\n',
            { text: '3. Minh bạch – Kỷ luật: ', bold: true },
            'Dữ liệu công khai, rõ ràng trên hệ thống ERP MIMIN; đúng giờ, chuẩn mực trong công việc.\n',
            { text: '4. Đoàn kết – Hợp tác: ', bold: true },
            'Phối hợp nhịp nhàng giữa các khối phòng ban, tương trợ đồng nghiệp để cùng phát triển.\n',
            { text: '5. Đổi mới – Phát triển: ', bold: true },
            'Liên tục cải tiến công nghệ, sáng tạo mẫu mã mới và tối ưu hóa chi phí sản xuất.',
          ]),

          pBody([
            { text: 'Ghi chú:\n', bold: true, italics: true },
            '- Sơ đồ tổ chức có thể được điều chỉnh linh hoạt phù hợp với từng giai đoạn mở rộng sản xuất của công ty.\n',
            '- Mỗi cá nhân chịu trách nhiệm toàn diện trong phạm vi chức năng và báo cáo trực tiếp cho cấp quản lý trực tiếp.',
          ], { size: 22, color: COLOR_MUTED }),

          pBody('', { before: 180, after: 0 }),
          createSignatureTable(
            'PHỤ TRÁCH NHÂN SỰ & HÀNH CHÍNH',
            'BAN QUẢN LÝ NHÂN SỰ',
            'CÔNG TY TNHH DỆT MAY GIÀU SANG\nGIÁM ĐỐC',
            'HỒ MINH SANG',
            'TP. Hồ Chí Minh, ngày 05 tháng 01 năm 2026'
          ),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(outputDir, '07_So_Do_To_Chuc_Cong_Ty_GIAU_SANG_Thuong_Hieu_POLOMIMIN.docx');
  fs.writeFileSync(outPath, buffer);
  console.log('Built Doc 7:', outPath);
}

async function main() {
  console.log('Starting docx generation into:', outputDir);
  await buildDoc1();
  await buildDoc2();
  await buildDoc3();
  await buildDoc4();
  await buildDoc5();
  await buildDoc6();
  await buildDoc7();
  console.log('Successfully generated all 7 Word files!');
}

main().catch(err => {
  console.error('Error generating docs:', err);
  process.exit(1);
});
