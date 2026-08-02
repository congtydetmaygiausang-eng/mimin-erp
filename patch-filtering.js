const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Add the import for DOI_TAC_GIA_CONG
if (!code.includes('import { DOI_TAC_GIA_CONG }')) {
  code = code.replace(
    'import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";',
    'import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";\nimport { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";'
  );
}

// 2. Add helper function getDoiTuongOptions before the main component
const helperFn = `
const getDoiTuongOptions = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  
  // 1. Cắt
  if (cd.includes("cắt") || cd.includes("cat")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("cắt") || (nv.ghiChu || "").toLowerCase().includes("cắt"))
      .map(nv => ({ ma: nv.ma, ten: \`\${nv.ma} - \${nv.ten} (Cắt)\` }));
  }
  
  // 2. Khuy nút
  if (cd.includes("khuy") || cd.includes("nút") || cd.includes("cúc")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("khuy") || (nv.ghiChu || "").toLowerCase().includes("khuy"))
      .map(nv => ({ ma: nv.ma, ten: \`\${nv.ma} - \${nv.ten} (Khuy nút)\` }));
  }
  
  // 3. Ủi
  if (cd.includes("ủi") || cd.includes("ui")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("ủi") || (nv.ghiChu || "").toLowerCase().includes("ủi"))
      .map(nv => ({ ma: nv.ma, ten: \`\${nv.ma} - \${nv.ten} (Ủi)\` }));
  }
  
  // 4. Đóng Gói
  if (cd.includes("đóng gói") || cd.includes("gấp xếp") || cd.includes("gấp") || cd.includes("xếp") || cd.includes("bao bì") || cd.includes("hoàn thiện")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("gấp") || (nv.ghiChu || "").toLowerCase().includes("gấp") || (nv.boPhan || "").toLowerCase().includes("xếp"))
      .map(nv => ({ ma: nv.ma, ten: \`\${nv.ma} - \${nv.ten} (Đóng gói)\` }));
  }

  // 5. May Áo / In / Thêu / Dập / Gia công khác -> Lọc đối tác gia công ngoại
  if (cd.includes("trụ") || cd.includes("tru")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU"))
      .map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công Trụ)\` }));
  }
  if (cd.includes("tròn") || cd.includes("tron")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRON"))
      .map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công Tròn)\` }));
  }
  if (cd.includes("quần") || cd.includes("quan")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-QUAN"))
      .map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công Quần)\` }));
  }
  if (cd.includes("in") || cd.includes("thêu") || cd.includes("dập")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-IN"))
      .map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công In/Thêu)\` }));
  }

  if (cd.includes("may") || cd.includes("gia công") || cd.includes("outsource")) {
    return DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công)\` }));
  }

  return [
    ...REAL_NHAN_VIEN.map(nv => ({ ma: nv.ma, ten: \`\${nv.ma} - \${nv.ten} (Nội bộ)\` })),
    ...DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: \`\${dt.ma} - \${dt.tenDonVi} (Gia công)\` }))
  ];
};
`;

if (!code.includes('const getDoiTuongOptions =')) {
  code = code.replace(
    '// Constants',
    helperFn + '\n// Constants'
  );
}

// 3. Redesign the avatar/initials inside phanCong list mapping
code = code.replace(
  `{kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || "NV") : "NV"}`,
  `{kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : "NV"}`
);

// 4. Redesign the select change event to find from both lists
code = code.replace(
  `const nv = REAL_NHAN_VIEN.find(n => n.ma === e.target.value);`,
  `const nv = REAL_NHAN_VIEN.find(n => n.ma === e.target.value);\n                            const dt = DOI_TAC_GIA_CONG.find(d => d.ma === e.target.value);\n                            const selectedName = nv?.ten || dt?.tenDonVi || e.target.value;`
);

code = code.replace(
  `nguoiTen: nv?.ten || e.target.value`,
  `nguoiTen: selectedName`
);

// 5. Redesign the options mapping in phanCong list mapping
code = code.replace(
  `{REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}`,
  `{getDoiTuongOptions(kh.tenCongDoan).map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}`
);

fs.writeFileSync(modalFile, code);
console.log("LenhCatModal.tsx updated with smart person filtering logic.");
