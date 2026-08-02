const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Redesign overflow wrapper to have padding and gap
code = code.replace(
  `<div className="flex-1 overflow-y-auto bg-[#F4F1EA] flex flex-col">`,
  `<div className="flex-1 overflow-y-auto bg-[#F4F1EA] p-4 flex flex-col gap-4">`
);

// 2. Redesign KHỐI 1: THÔNG TIN CHÍNH
const oldK1 = `<div className="p-6 border-b-[8px] border-[#2B4C3E]">`;
const newK1 = `<div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">`;
code = code.replace(oldK1, newK1);

// 3. Redesign KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU
const oldK2 = `<div className="bg-[#9ACBB8] p-6 border-b-[8px] border-[#2B4C3E]">`;
const newK2 = `<div className="bg-[#E6F3EE] p-5 rounded-lg border border-emerald-200/80 shadow-sm">`;
code = code.replace(oldK2, newK2);

// 4. Redesign KHỐI 3: GIA CÔNG VÀ ĐƠN GIÁ
const oldK3 = `<div className="bg-[#F0A619] p-6 pb-8">`;
const newK3 = `<div className="bg-[#FCF5E8] p-5 rounded-lg border border-amber-200/80 shadow-sm mb-2">`;
code = code.replace(oldK3, newK3);

// 5. Redesign KHỐI 4: NHẬP THỰC TẾ
const oldK4 = `<div className="bg-slate-800 p-6">`;
const newK4 = `<div className="bg-slate-800 text-white p-5 rounded-lg border border-slate-700 shadow-sm">`;
code = code.replace(oldK4, newK4);

fs.writeFileSync(modalFile, code);
console.log("LenhCatModal.tsx card interface redesigned successfully.");
