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
  HeadingLevel,
  BorderStyle,
  PageBreak,
  Header,
  Footer
} = require('docx');

const outputDir = path.join(__dirname, 'tai-lieu-goc-word');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Common styles & helpers
const FONT_FAMILY = 'Times New Roman';
const COLOR_PRIMARY = '0F172A';
const COLOR_MUTED = '475569';
const COLOR_BORDER = '94A3B8';
const BG_HEADER = 'F1F5F9';
const BG_ALT = 'F8FAFC';

const singleBorder = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: COLOR_BORDER,
};

const cellBorders = {
  top: singleBorder,
  bottom: singleBorder,
  left: singleBorder,
  right: singleBorder,
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

function pQuocHieu() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60, line: 276 },
      children: [
        new TextRun({
          text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
          font: FONT_FAMILY,
          size: 24, // 12pt
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 180, line: 276 },
      children: [
        new TextRun({
          text: 'Độc lập – Tự do – Hạnh phúc',
          font: FONT_FAMILY,
          size: 26, // 13pt
          bold: true,
          underline: {},
          color: COLOR_PRIMARY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new TextRun({
          text: '---------o0o---------',
          font: FONT_FAMILY,
          size: 20,
          color: COLOR_MUTED,
        }),
      ],
    }),
  ];
}

function pDocTitle(title, subNumber = '') {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: subNumber ? 80 : 180, line: 300 },
      children: [
        new TextRun({
          text: title,
          font: FONT_FAMILY,
          size: 32, // 16pt
          bold: true,
          color: COLOR_PRIMARY,
        }),
      ],
    }),
  ];

  if (subNumber) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 220, line: 276 },
        children: [
          new TextRun({
            text: subNumber,
            font: FONT_FAMILY,
            size: 24, // 12pt
            italics: true,
            bold: true,
            color: COLOR_MUTED,
          }),
        ],
      })
    );
  }
  return children;
}

function pHeading1(text) {
  return new Paragraph({
    spacing: { before: 200, after: 100, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 26, // 13pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function pBody(text, options = {}) {
  const runs = Array.isArray(text)
    ? text.map(t =>
        typeof t === 'string'
          ? new TextRun({ text: t, font: FONT_FAMILY, size: 26, color: COLOR_PRIMARY })
          : new TextRun({ font: FONT_FAMILY, size: 26, color: COLOR_PRIMARY, ...t })
      )
    : [
        new TextRun({
          text,
          font: FONT_FAMILY,
          size: options.size || 26,
          bold: !!options.bold,
          italics: !!options.italics,
          color: options.color || COLOR_PRIMARY,
        }),
      ];

  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: { before: options.before ?? 60, after: options.after ?? 80, line: 276 },
    children: runs,
  });
}

function pBullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 60, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_FAMILY,
        size: 26,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createSignatureTable(leftTitle, leftName, rightTitle, rightName, dateText = 'Ngày ..... tháng ..... năm 2026') {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ text: '', spacing: { after: 60 } }),
            ],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 80 },
                children: [
                  new TextRun({
                    text: dateText,
                    font: FONT_FAMILY,
                    size: 24,
                    italics: true,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: leftTitle,
                    font: FONT_FAMILY,
                    size: 26,
                    bold: true,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 1200 }, // Khoảng trống ký tên
                children: [
                  new TextRun({
                    text: '(Ký, đóng dấu, ghi rõ họ tên)',
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
                    text: leftName,
                    font: FONT_FAMILY,
                    size: 26,
                    bold: true,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
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
                    text: rightTitle,
                    font: FONT_FAMILY,
                    size: 26,
                    bold: true,
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 1200 }, // Khoảng trống ký tên
                children: [
                  new TextRun({
                    text: '(Ký, đóng dấu, ghi rõ họ tên)',
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
                    text: rightName,
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
  });
}

console.log('Helpers initialized successfully.');
module.exports = {
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
};
