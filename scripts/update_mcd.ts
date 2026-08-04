import * as fs from 'fs';

const filePath = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const newDefault = `const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  {
    id: "MCD-AO-TRON",
    ten: "Áo tròn",
    giaCong: [
      { id: "cat", tenCongDoan: "Cắt áo", nguoiMa: "", nguoiTen: "", donGia: 1400 },
      { id: "in_theu", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "may_ao", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 900 },
      { id: "dong_goi", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 700 }
    ]
  },
  {
    id: "MCD-AO-TRU",
    ten: "Áo trụ",
    giaCong: [
      { id: "cat", tenCongDoan: "Cắt áo", nguoiMa: "", nguoiTen: "", donGia: 1400 },
      { id: "in_theu", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "may_ao", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 15000 },
      { id: "khuy_nut", tenCongDoan: "Khuy nút", nguoiMa: "", nguoiTen: "", donGia: 750 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 900 },
      { id: "dong_goi", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 700 }
    ]
  },
  {
    id: "MCD-BO-TRON",
    ten: "Bộ tròn",
    giaCong: [
      { id: "cat", tenCongDoan: "Cắt bộ", nguoiMa: "", nguoiTen: "", donGia: 2300 },
      { id: "in_theu", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "may_ao", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000 },
      { id: "may_quan", tenCongDoan: "May quần", nguoiMa: "", nguoiTen: "", donGia: 9500 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "dong_goi", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 1200 }
    ]
  },
  {
    id: "MCD-BO-TRU",
    ten: "Bộ trụ",
    giaCong: [
      { id: "cat", tenCongDoan: "Cắt bộ", nguoiMa: "", nguoiTen: "", donGia: 2300 },
      { id: "in_theu", tenCongDoan: "In/Thêu", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "may_ao", tenCongDoan: "May áo", nguoiMa: "", nguoiTen: "", donGia: 13000 },
      { id: "may_quan", tenCongDoan: "May quần", nguoiMa: "", nguoiTen: "", donGia: 9500 },
      { id: "khuy_nut", tenCongDoan: "Khuy nút", nguoiMa: "", nguoiTen: "", donGia: 750 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 1500 },
      { id: "dong_goi", tenCongDoan: "Đóng gói", nguoiMa: "", nguoiTen: "", donGia: 1200 }
    ]
  }
];`;

content = content.replace(/const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem\[\] = \[\];/, newDefault);

fs.writeFileSync(filePath, content);
console.log('Updated DEFAULT_MAU_CONG_DOAN successfully');
