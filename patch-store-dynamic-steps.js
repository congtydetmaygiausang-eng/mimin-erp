const fs = require('fs');

const storeFile = 'apps/web/src/lib/data/lenh-cat-store.tsx';
let code = fs.readFileSync(storeFile, 'utf8');

// 1. Redefine PhanCongGiaCong
const oldPhanCongType = `export type PhanCongGiaCong = {
  cat?: { nguoiMa: string; nguoiTen: string; donGia: number };
  mayAo?: { nguoiMa: string; nguoiTen: string; donGia: number };
  mayQuan?: { nguoiMa: string; nguoiTen: string; donGia: number };
  inTheu?: { nguoiMa: string; nguoiTen: string; donGia: number };
  uiQC?: { nguoiMa: string; nguoiTen: string; donGia: number };
};`;

const newPhanCongType = `export type CongDoanItem = {
  id: string; // e.g. "cat", "mayAo", "in", "theu" or auto-generated
  tenCongDoan: string; // e.g. "Cắt", "May Áo", "In", "Thêu", "Ủi", "Đóng Gói", "In Chuyển Nhiệt"
  nguoiMa: string;
  nguoiTen: string;
  donGia: number;
};
export type PhanCongGiaCong = CongDoanItem[];`;

code = code.replace(oldPhanCongType, newPhanCongType);

// 2. Update DEFAULT_MAU_CONG_DOAN
const oldDefaultMCD = `const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  { id: "AoThun", ten: "Áo Thun", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 1400 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2000 } } },
  { id: "Quan", ten: "Quần", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 900 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 2500 } } },
  { id: "BoTheThao", ten: "Bộ Thể Thao", giaCong: { cat: { nguoiMa: "", nguoiTen: "", donGia: 2300 }, mayAo: { nguoiMa: "", nguoiTen: "", donGia: 12000 }, mayQuan: { nguoiMa: "", nguoiTen: "", donGia: 15000 }, inTheu: { nguoiMa: "", nguoiTen: "", donGia: 3000 }, uiQC: { nguoiMa: "", nguoiTen: "", donGia: 4500 } } }
];`;

const newDefaultMCD = `const DEFAULT_MAU_CONG_DOAN: MauCongDoanItem[] = [
  { id: "AoThun", ten: "Áo Thun", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 1400 },
    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 12000 },
    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 3000 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 1000 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 1000 }
  ] },
  { id: "Quan", ten: "Quần", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 900 },
    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 15000 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 1250 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 1250 }
  ] },
  { id: "BoTheThao", ten: "Bộ Thể Thao", giaCong: [
    { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 2300 },
    { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 12000 },
    { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 15000 },
    { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 3000 },
    { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 2000 },
    { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 2500 }
  ] }
];`;

code = code.replace(oldDefaultMCD, newDefaultMCD);

fs.writeFileSync(storeFile, code);
console.log("Patched lenh-cat-store.tsx successfully.");
