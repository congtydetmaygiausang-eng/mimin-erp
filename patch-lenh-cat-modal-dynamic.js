const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Update the COGS calculation for giaCong1SP
code = code.replace(
  /let giaCong1SP = 0;\s*Object\.values\(phanCong\)\.forEach\(kh => \{\s*if \(kh && kh\.donGia\) giaCong1SP \+= kh\.donGia;\s*\}\);/,
  `let giaCong1SP = 0;
  (Array.isArray(phanCong) ? phanCong : []).forEach((kh: any) => {
    if (kh && kh.donGia) giaCong1SP += kh.donGia;
  });`
);

// 2. Update the state initialization (it was already modified to handle array in my other patch maybe? Let's check)
// Actually we can just do a regex replace to make sure it handles arrays.
code = code.replace(
  /const \[phanCong, setPhanCong\] = useState<PhanCongGiaCong>\(dsMauCongDoan\.find\(x => x\.id === "BoTheThao"\)\?\.giaCong \|\| \{\}\);/,
  `const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(dsMauCongDoan.find(x => x.id === "BoTheThao")?.giaCong || []);`
);

// 3. Update the select for mauCongDoan to use dsMauCongDoan instead of MAU_CONG_DOAN
code = code.replace(
  /setPhanCong\(MAU_CONG_DOAN\[e\.target\.value as keyof typeof MAU_CONG_DOAN\] as any\);/,
  `setPhanCong(dsMauCongDoan.find(x => x.id === e.target.value)?.giaCong || []);`
);
code = code.replace(
  /<option value="AoThun">Mẫu: Áo Thun<\/option>\s*<option value="Quan">Mẫu: Quần<\/option>\s*<option value="BoTheThao">Mẫu: Bộ Thể Thao<\/option>/,
  `{dsMauCongDoan.map(m => <option key={m.id} value={m.id}>Mẫu: {m.ten}</option>)}`
);

// 4. Update the rendering of phanCong
const oldRenderPhanCong = `\{Object\\.keys\\(phanCong\\)\\.map\\(\\(khKey\\) => \\{\\s*const kh = phanCong\\[khKey as keyof PhanCongGiaCong\\];\\s*if \\(!kh\\) return null;\\s*const labels: Record<string, string> = \\{ cat: "Cắt", mayAo: "May Áo", mayQuan: "May Quần", inTheu: "In/Thêu", uiQC: "Ủi/Đóng Gói" \\};\\s*return \\(\\s*<div key=\\{khKey\\} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">\\s*<div className="col-span-3 font-semibold text-slate-700 text-sm">\\{labels\\[khKey\\]\\}</div>\\s*<div className="col-span-6 flex items-center gap-2">\\s*<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 flex-shrink-0 text-\\[10px\\]">\\s*\\{kh\\.nguoiMa \\? \\(REAL_NHAN_VIEN\\.find\\(x => x\\.ma === kh\\.nguoiMa\\)\\?\\.ten\\?\\.substring\\(0, 2\\) \\|\\| "NV"\\) : "NV"\\}\\s*</div>\\s*<select \\s*className="flex-1 px-2 py-1\\.5 border border-slate-200 rounded text-sm focus:outline-none"\\s*value=\\{kh\\.nguoiMa\\}\\s*onChange=\\{\\(e\\) => \\{\\s*const nv = REAL_NHAN_VIEN\\.find\\(n => n\\.ma === e\\.target\\.value\\);\\s*setPhanCong\\(p => \\(\\{ \\.\\.\\.p, \\[khKey\\]: \\{ \\.\\.\\.p\\[khKey as keyof PhanCongGiaCong\\], nguoiMa: e\\.target\\.value, nguoiTen: nv\\?\\.ten \\|\\| e\\.target\\.value \\} \\}\\)\\);\\s*\\}\\}\\s*>\\s*<option value="">-- Chọn NV/Xưởng --</option>\\s*\\{REAL_NHAN_VIEN\\.map\\(n => <option key=\\{n\\.ma\\} value=\\{n\\.ma\\}>\\{n\\.ma\\} - \\{n\\.ten\\}</option>\\)\\}\\s*</select>\\s*</div>\\s*<div className="col-span-3 relative">\\s*<input \\s*type="number" min=\\{0\\}\\s*className="w-full px-2 py-1\\.5 border border-slate-200 rounded text-sm text-right pr-6"\\s*value=\\{kh\\.donGia\\}\\s*onChange=\\{\\(e\\) => setPhanCong\\(p => \\(\\{ \\.\\.\\.p, \\[khKey\\]: \\{ \\.\\.\\.p\\[khKey as keyof PhanCongGiaCong\\], donGia: parseInt\\(e\\.target\\.value\\) \\|\\| 0 \\} \\}\\)\\)\\}\\s*/>\\s*<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">đ</span>\\s*</div>\\s*</div>\\s*\\);\\s*\\}\\)\\}`;

const newRenderPhanCong = `{(Array.isArray(phanCong) ? phanCong : []).map((kh, idx) => {
                    if (!kh) return null;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                        <div className="col-span-3 font-semibold text-slate-700 text-sm truncate" title={kh.tenCongDoan}>{kh.tenCongDoan}</div>
                        <div className="col-span-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 flex-shrink-0 text-[10px]">
                            {kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || "NV") : "NV"}
                          </div>
                          <select 
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none"
                          value={kh.nguoiMa}
                          onChange={(e) => {
                            const nv = REAL_NHAN_VIEN.find(n => n.ma === e.target.value);
                            setPhanCong(p => {
                              const next = [...(p as any[])];
                              next[idx] = { ...next[idx], nguoiMa: e.target.value, nguoiTen: nv?.ten || e.target.value };
                              return next as any;
                            });
                          }}
                        >
                          <option value="">-- Chọn NV/Xưởng --</option>
                          {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                        </select>
                        </div>
                        <div className="col-span-3 relative">
                          <input 
                            type="number" min={0}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right pr-6"
                            value={kh.donGia}
                            onChange={(e) => {
                              setPhanCong(p => {
                                const next = [...(p as any[])];
                                next[idx] = { ...next[idx], donGia: parseInt(e.target.value) || 0 };
                                return next as any;
                              });
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">đ</span>
                        </div>
                      </div>
                    );
                  })}`;

code = code.replace(new RegExp(oldRenderPhanCong), newRenderPhanCong);

// Remove the inline modal for "Tạo Mẫu Công Đoạn Mới" in LenhCatModal.tsx if it exists, since we moved it to dashboard page.
// Or we can just leave it if the user wants to be able to create inside as well. I'll patch it quickly to use the dynamic array format just in case.
const oldModalCreation = /\{showTaoMauCD && \(\s*<div[\s\S]*?Tạo Mẫu Công Đoạn Mới[\s\S]*?<\/div>\s*\)\}/;
code = code.replace(oldModalCreation, '');

fs.writeFileSync(modalFile, code);
console.log("Patched LenhCatModal.tsx successfully.");
