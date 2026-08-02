const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Update AddEditModal form state
code = code.replace(
  `    size: sp?.size || "M, L, XL",
    lsx: sp?.lsx || "LSX-2026-007",`,
  `    size: sp?.size || "M, L, XL",
    tiLeSize: sp?.tiLeSize || "",
    lsx: sp?.lsx || "LSX-2026-007",`
);

// Update handleLsxChange inside AddEditModal input
const handleLsxOld = `                  const matched = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.mau);
                  if (matched && matched.mau) {
                    newForm.mau = matched.mau;
                    if (!form.maSP) newForm.maSP = matched.maSP || "";
                    if (!form.tenSP) newForm.tenSP = matched.phanLoai || "";
                  }`;
const handleLsxNew = `                  const matchedLC = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.id?.startsWith("LC_"));
                  const matched = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.mau);
                  
                  if (matchedLC) {
                    if (!form.maSP) newForm.maSP = matchedLC.maSP || "";
                    if (!form.tenSP) newForm.tenSP = matchedLC.phanLoai || "";
                    if (!form.mau) newForm.mau = matchedLC.mau || "Trắng";
                    if (!form.size) newForm.size = matchedLC.size || "M";
                  } else if (matched && matched.mau) {
                    newForm.mau = matched.mau;
                    if (!form.maSP) newForm.maSP = matched.maSP || "";
                    if (!form.tenSP) newForm.tenSP = matched.phanLoai || "";
                  }`;
code = code.replace(handleLsxOld, handleLsxNew);

// Update Size and Ti Le Size inputs in AddEditModal
const sizeInputOld = `            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Size / Tỉ lệ</label>
              <input list="ds-ti-le-size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" />
              <datalist id="ds-ti-le-size">
                {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX (Tự động điền màu)</label>`;

const sizeInputNew = `            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Size (Chữ cái)</label>
              <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="Ví dụ: M, L" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">Tỉ lệ size</label>
              <input list="ds-ti-le-size" value={form.tiLeSize} onChange={(e) => setForm({ ...form, tiLeSize: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:border-amber-500 outline-none" placeholder="Chọn hoặc nhập tỉ lệ" />
              <datalist id="ds-ti-le-size">
                {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">LSX (Tự bốc Mã SP từ LC)</label>`;

code = code.replace(sizeInputOld, sizeInputNew);

fs.writeFileSync(file, code);
