import re

with open(r"apps\web\src\app\(main)\kho-thanh-pham\components\ProductFormModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace SuaBienTheForm return block
sua_start = content.find("  return (\n    <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3\" onClick={onClose}>")
sua_end_str = "    </div>\n  );\n}\n"
sua_end = content.find(sua_end_str, sua_start) + len(sua_end_str)

sua_replacement = """  return (
    <ResponsiveModal
      isOpen={true}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2B4C3E] flex items-center justify-center shadow-inner">
            <Package className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-800 tracking-tight">Sửa biến thể</div>
            <div className="text-xs font-medium text-slate-500">
              {form.maSP || "Đang cập nhật..."}
            </div>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-[85vh]">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">1</span>
              Thông Tin Chung
            </h3>
            <div className="flex gap-4 items-start mb-4">
              <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-[#2B4C3E] hover:bg-emerald-50/50 transition-all" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                {uploading ? (
                  <div className="text-[10px] text-emerald-600 font-bold text-center px-1">Đang tải...</div>
                ) : image ? (
                  <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                ) : (
                  <div className="flex flex-col items-center group-hover:text-[#2B4C3E]">
                    <Camera className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Tải ảnh</span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Mã SP mẹ *</label>
                    <input value={form.maSP} onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white" placeholder="VD: M024" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên SP mẹ *</label>
                    <input value={form.tenSP} onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, tenSP: val, phanLoai: detectLoaiSP(val) });
                    }} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="VD: Bộ Trụ Phối Lé" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phân loại</label>
                  <select 
                    value={form.phanLoai} 
                    onChange={(e) => setForm({ ...form, phanLoai: e.target.value })} 
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium"
                  >
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">2</span>
              Đặc Tính & Trạng Thái
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Màu</label>
                <input value={form.mau} onChange={(e) => setForm({ ...form, mau: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="VD: Trắng" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Size / Tỉ lệ</label>
                <input list="ds-ti-le-size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="VD: M, L, XL" />
                <datalist id="ds-ti-le-size">
                  {DS_TI_LE_SIZE.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">LSX (Tự động điền màu)</label>
                <input
                  value={form.lsx}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newForm = { ...form, lsx: val };
                    const matchedLC = ALL_PHIEU.find((p: any) => p.lenhSX === val && p.id?.startsWith("LC_"));
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
                    }
                    setForm(newForm);
                  }}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Số lượng *</label>
                <input type="number" min="0" value={form.soLuong} onChange={(e) => setForm({ ...form, soLuong: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-emerald-300 bg-emerald-50/30 rounded-xl text-base font-bold focus:border-[#2B4C3E] outline-none text-emerald-800" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Vị trí (Khu kệ)</label>
                <select value={form.viTri} onChange={(e) => setForm({ ...form, viTri: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                  <option value="">-- Chọn --</option>
                  {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Trạng thái</label>
                <select value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                  <option value="con">Còn hàng</option>
                  <option value="dat-hang">Đã đặt hàng</option>
                  <option value="xuat-kho">Đã xuất kho</option>
                  <option value="khong-dat">Không đạt</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">3</span>
              Thiết Lập Giá Bán
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá vốn</label>
                <input type="number" min="0" value={form.giaVon} onChange={(e) => setForm({ ...form, giaVon: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá bán sỉ</label>
                <input type="number" min="0" value={form.giaBanSi} onChange={(e) => setForm({ ...form, giaBanSi: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá bán lẻ</label>
                <input type="number" min="0" value={form.giaBanLe} onChange={(e) => setForm({ ...form, giaBanLe: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá bán lô</label>
                <input type="number" min="0" value={form.giaBanLo} onChange={(e) => setForm({ ...form, giaBanLo: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá TikTok</label>
                <input type="number" min="0" value={form.giaTikTok} onChange={(e) => setForm({ ...form, giaTikTok: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1 block uppercase">Giá Shopee</label>
                <input type="number" min="0" value={form.giaShopee} onChange={(e) => setForm({ ...form, giaShopee: Math.max(0, parseInt(e.target.value) || 0) })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-semibold focus:border-[#2B4C3E] outline-none bg-white" placeholder="0" />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="text-xs font-bold text-slate-700 mb-2 block">Kênh được phép bán *</label>
              <div className="flex flex-wrap gap-2">
                {DS_KENH_BAN.map((kenh) => {
                  const selected = form.kenhBan.includes(kenh.value);
                  return (
                    <button
                      key={kenh.value}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        kenhBan: selected
                          ? form.kenhBan.filter((value) => value !== kenh.value)
                          : [...form.kenhBan, kenh.value],
                      })}
                      className={`rounded-xl border px-4 py-2 text-xs font-bold transition-all ${selected ? "border-[#2B4C3E] bg-emerald-50 text-[#2B4C3E] shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                    >
                      {selected ? "✓ " : ""}{kenh.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">4</span>
              Thông Tin Khác
            </h3>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Ghi chú</label>
            <textarea value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} rows={2} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="Thêm ghi chú nếu cần..." />
          </div>

        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl z-20">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl font-bold transition-colors">
            Hủy bỏ
          </button>
          <button onClick={() => {
            if (form.kenhBan.length === 0) {
              toast.error("Cần chọn ít nhất 1 kênh bán");
              return;
            }
            onSave({ ...sp, ...form, __tempImage: image });
          }} className="px-6 py-2.5 bg-[#2B4C3E] hover:bg-[#203a2f] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors">
            <Save className="w-4 h-4" /> Lưu biến thể
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
"""

if sua_start != -1:
    content = content[:sua_start] + sua_replacement + content[sua_end:]
    print("Found and replaced SuaBienTheForm")
else:
    print("Could not find SuaBienTheForm start block")
    
with open(r"apps\web\src\app\(main)\kho-thanh-pham\components\ProductFormModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
