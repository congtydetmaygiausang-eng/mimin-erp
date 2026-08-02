const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Add session import
if (!code.includes('import { useSession }')) {
  code = code.replace(
    'import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";',
    'import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";\nimport { useSession } from "@/components/session-provider";'
  );
}

// 2. Add useSession call and editing useEffect sync
const sessionCallAndEffect = `  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, dsMauChiPhi, themMauCongDoan, themMauChiPhi } = useLenhCat();
  const { user } = useSession();
  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;

  // Sync editing data into states when editing changes
  useEffect(() => {
    if (editing) {
      setLoaiLenh(editing.loaiLenh);
      setKhachHang(editing.khachHang || "");
      setLoaiSP(editing.loaiSP);
      setMaSP(editing.maSP);
      setTenSP(editing.tenSP);
      setTongSL(editing.tongSL);
      setTongSLThucTe(editing.tongSLThucTe || "");
      if (editing.ngayTao) setNgayBatDau(editing.ngayTao);
      setHanHoanThanh(editing.hanHoanThanh);
      setPhuTrachCat(editing.phuTrachCat || "NV006");
      setPhuTrachSX(editing.phuTrachSX || "NV001");
      setGhiChu(editing.ghiChu || "");
      setTrangThai(editing.trangThai || "Nhap");
      setTiLeSize(editing.tiLeSize || "1:2:2:1");
      setSoMau(editing.dsMau?.length || 4);
      setDsMau(editing.dsMau || []);
      setDsPhuLieu(editing.dsPhuLieu || []);
      setMauCongDoan(editing.mauCongDoan || "BoTheThao");
      setPhanCong(editing.phanCong || []);
      setMauChiPhi(editing.mauChiPhi || "BoTheThao");
      setChiPhiCoDinh(editing.chiPhiCoDinh || {});
      setPhienBanDinhMuc(editing.phienBanDinhMuc || 1);
    }
  }, [editing]);`;

code = code.replace(
  `  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, dsMauChiPhi, themMauCongDoan, themMauChiPhi } = useLenhCat();\n  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;`,
  sessionCallAndEffect
);

// 3. Add handleSave helper function before the return block
const handleSaveFn = `
  const handleSave = (status: TrangThaiLenhCat) => {
    if (!maSP || !tenSP || !tongSL) {
      toast.error("Vui lòng điền đầy đủ Mã SP, Tên SP và Tổng SL!");
      return;
    }

    const cogsData = {
      tongTienVai,
      tongTienPhuLieu,
      giaCong1SP,
      tongChiPhiCoDinh,
      giaVonBinhQuan
    };

    if (editing) {
      suaLenhCat(editing.id, {
        loaiLenh,
        khachHang: loaiLenh === "HangDat" ? khachHang : undefined,
        loaiSP,
        maSP,
        tenSP,
        tongSL: Number(tongSL) || 0,
        tongSLThucTe: Number(tongSLThucTe) || undefined,
        hanHoanThanh,
        tiLeSize,
        dsMau,
        dsPhuLieu,
        mauCongDoan,
        phanCong,
        mauChiPhi,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachSX,
        ghiChu,
        trangThai: status,
      }, user || { ma: "NV001", ten: "Nguyễn Thị Ngọc Giàu", vaiTro: "DIEU_HANH" });
      
      toast.success(\`Đã cập nhật Lệnh Cắt \${editing.id} với trạng thái: \${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}\`);
    } else {
      const newId = \`LC-\${new Date().getFullYear()}-\${String(dsLenhCat.length + 1).padStart(4, "0")}\`;
      themLenhCat({
        id: newId,
        loaiLenh,
        khachHang: loaiLenh === "HangDat" ? khachHang : undefined,
        loaiSP,
        maSP,
        tenSP,
        tongSL: Number(tongSL) || 0,
        tongSLThucTe: Number(tongSLThucTe) || undefined,
        hanHoanThanh,
        tiLeSize,
        dsMau,
        dsPhuLieu,
        mauCongDoan,
        phanCong,
        mauChiPhi,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachCat,
        phuTrachSX,
        ghiChu,
        trangThai: status,
        phienBanDinhMuc: 1,
        ngayTao: new Date().toISOString().split("T")[0],
        nguoiTao: user?.ten || "Nguyễn Thị Ngọc Giàu"
      }, user || { ma: "NV001", ten: "Nguyễn Thị Ngọc Giàu", vaiTro: "DIEU_HANH" });

      toast.success(\`Đã tạo thành công Lệnh Cắt mới: \${newId} với trạng thái: \${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}\`);
    }
    onClose();
  };
`;

code = code.replace(
  '  if (!open) return null;',
  handleSaveFn + '\n  if (!open) return null;'
);

// 4. Update the avatar circles logic in phanCong list mapping to display "GC" vs "NV" based on stage
const isOutsourceFn = `const isOutsourceStage = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  return cd.includes("may") || cd.includes("in") || cd.includes("thêu") || cd.includes("dập") || cd.includes("gia công");
};
`;

if (!code.includes('const isOutsourceStage =')) {
  code = code.replace(
    '// Constants',
    isOutsourceFn + '\n// Constants'
  );
}

// Update the avatar inside phanCong map:
code = code.replace(
  `{kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : "NV"}`,
  `{kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : (isOutsourceStage(kh.tenCongDoan) ? "GC" : "NV")}`
);

// Style the avatar circle with dynamic background classes
code = code.replace(
  `className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 flex-shrink-0 text-[10px]"`,
  `className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border flex-shrink-0 text-[10px] \${isOutsourceStage(kh.tenCongDoan) ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : "bg-blue-100 text-blue-700 border-blue-200"}\`}`
);

// 5. Update footer buttons to use handleSave
// First, "Lưu Nháp"
code = code.replace(
  `            <button \n              className="px-6 py-2 rounded font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600"\n              onClick={() => {\n                setTrangThai("Nhap");\n                toast.success("Đã lưu nháp Lệnh Cắt");\n                onClose();\n              }}\n            >`,
  `            <button \n              className="px-6 py-2 rounded font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600"\n              onClick={() => handleSave("Nhap")}\n            >`
);

// Next, "Hoàn Tất Tạo Lệnh"
code = code.replace(
  `            <button \n              className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg"\n              onClick={() => {\n                setTrangThai("DaTao");\n                toast.success("Đã tạo lệnh cắt thành công");\n              }}\n            >`,
  `            <button \n              className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg"\n              onClick={() => handleSave("DaTao")}\n            >`
);

// Finally, "Chuyển Khâu Tiếp Nhận"
code = code.replace(
  `            <button \n              className="px-6 py-2 rounded font-bold text-slate-900 bg-[#F0A619] hover:bg-[#F0A619]/90 transition-colors shadow-lg flex items-center gap-2"\n              onClick={() => {\n                setTrangThai("ChuyenTiep");\n                toast.success("Đã chuyển khâu tiếp nhận");\n                onClose();\n              }}\n            >`,
  `            <button \n              className="px-6 py-2 rounded font-bold text-slate-900 bg-[#F0A619] hover:bg-[#F0A619]/90 transition-colors shadow-lg flex items-center gap-2"\n              onClick={() => handleSave("ChuyenTiep")}\n            >`
);

// 6. Display friendly labels for chiPhiCoDinh entries
code = code.replace(
  `<span className="text-sm font-semibold text-slate-700">{key}</span>`,
  `<span className="text-sm font-semibold text-slate-700">{key === "baoBi" ? "Bao Bì, Túi PE" : key === "temNhan" ? "Tem, Nhãn mác" : key === "khauHao" ? "Khấu hao máy, Điện nước" : key}</span>`
);

fs.writeFileSync(modalFile, code);
console.log("LenhCatModal.tsx fully updated with edit sync, handleSave, friendly labels and outsource avatars.");
