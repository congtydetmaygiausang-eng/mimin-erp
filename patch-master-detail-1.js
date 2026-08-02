const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Update SanPhamTP interface
if (!code.includes('tiLeSize?: string;')) {
  code = code.replace(
    'khachHang?: string;',
    'khachHang?: string;\n  tiLeSize?: string;'
  );
}

// 2. Update generateSanPhamFromWorkflow
const genOld = `const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {`;
const genNew = `const ds = ALL_PHIEU.filter((p: any) => (p.id || "").startsWith("DG_") && p.trangThai === "Hoàn thành");
  return ds.map((p: any, i) => {
    const lc = ALL_PHIEU.find((x: any) => x.id?.startsWith("LC_") && x.lenhSX === p.lenhSX);`;
code = code.replace(genOld, genNew);

const genOld2 = `      maSP: p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: p.mau || "Trắng",
      size: p.size || "M",`;
const genNew2 = `      maSP: lc?.maSP || p.maSP,
      tenSP: p.phanLoai,
      phanLoai: p.phanLoai,
      mau: lc?.mau || p.mau || "Trắng",
      size: lc?.size || p.size || "M",
      tiLeSize: "",`;
code = code.replace(genOld2, genNew2);

// 3. Update handleLsxChange (This is inside the AddEditModal logic)
// Wait, the handleLsxChange is inside the Modal Thêm/Sửa SP render logic directly? Let's check.
// I'll update it later if it's there. Actually, the user asked to auto-update maSP from LC.

// 4. Update the Master View "Chi tiết" Button action
// Locate the "Chi tiết" button
code = code.replace(
  `onClick={() => alert('Xem chi tiết lệnh tổng: ' + group.tenSP)}`,
  `onClick={() => setShowMasterDetails(group.maSP)}`
);

// Add showMasterDetails state
if (!code.includes('const [showMasterDetails, setShowMasterDetails] = useState<string | null>(null);')) {
  code = code.replace(
    `const [viewingImage, setViewingImage] = useState<string | null>(null);`,
    `const [viewingImage, setViewingImage] = useState<string | null>(null);\n  const [showMasterDetails, setShowMasterDetails] = useState<string | null>(null);`
  );
}

// Add state for tiLeSize filter
if (!code.includes('const [filterTiLeSize, setFilterTiLeSize] = useState<"all" | string>("all");')) {
  code = code.replace(
    `const [filterViTri, setFilterViTri] = useState<"all" | string>("all");`,
    `const [filterViTri, setFilterViTri] = useState<"all" | string>("all");\n  const [filterTiLeSize, setFilterTiLeSize] = useState<"all" | string>("all");`
  );
}

// Update filter logic
if (!code.includes('s.tiLeSize === filterTiLeSize')) {
  code = code.replace(
    `if (filterViTri !== "all") result = result.filter((s) => s.viTri.includes(filterViTri));`,
    `if (filterViTri !== "all") result = result.filter((s) => s.viTri.includes(filterViTri));\n    if (filterTiLeSize !== "all") result = result.filter((s) => s.tiLeSize === filterTiLeSize);`
  );
}

// Find dynamic tiLeSize list
if (!code.includes('const dsDynamicTiLeSize = useMemo')) {
  code = code.replace(
    `// Unique maSP cho filter\n  const dsLoai`,
    `const dsDynamicTiLeSize = useMemo(() => Array.from(new Set([...DS_TI_LE_SIZE, ...dsSanPham.map(s => s.tiLeSize).filter(Boolean)])) as string[], [dsSanPham]);\n\n  // Unique maSP cho filter\n  const dsLoai`
  );
}

// Write file back temporarily so we can proceed with other replacements carefully
fs.writeFileSync(file, code);
