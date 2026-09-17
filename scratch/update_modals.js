const fs = require('fs');

const path = 'apps/web/src/app/(main)/kho-thanh-pham/components/ProductFormModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const sua_start_str = "  return (\n    <div className=\"fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3\" onClick={onClose}>";
const sua_start = content.indexOf(sua_start_str);
const sua_end_str = "    </div>\n  );\n}\n";
const sua_end = content.indexOf(sua_end_str, sua_start) + sua_end_str.length;

const sua_replacement = `  return (
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
                      className={\`rounded-xl border px-4 py-2 text-xs font-bold transition-all \${selected ? "border-[#2B4C3E] bg-emerald-50 text-[#2B4C3E] shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}\`}
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
`;

if (sua_start !== -1) {
    content = content.substring(0, sua_start) + sua_replacement + content.substring(sua_end);
    console.log("Replaced SuaBienTheForm");
} else {
    console.log("Could not find SuaBienTheForm");
}

const them_start_str = "  return (\n    <div className=\"fixed inset-0 z-50 flex justify-center bg-black/50 backdrop-blur-sm sm:p-4 md:p-6 lg:p-8 overflow-y-auto\" onClick={onClose}>";
const them_start = content.indexOf(them_start_str);
const them_end_str = "    </div>\n  );\n}\n";
const them_end = content.indexOf(them_end_str, them_start) + them_end_str.length;

const them_replacement = `  return (
    <>
      <ResponsiveModal
        isOpen={true}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2B4C3E] flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800 tracking-tight">Nhập lô hàng tồn kho</div>
              <div className="text-xs font-medium text-slate-500">
                Thêm nhiều biến thể cùng lúc
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Mã SP mẹ *</label>
                  <input value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white" placeholder="VD: M024" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên SP mẹ *</label>
                  <input value={tenSP} onChange={(e) => {
                    const val = e.target.value;
                    setTenSP(val);
                    setPhanLoai(detectLoaiSP(val));
                  }} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white" placeholder="VD: Bộ Trụ Phối Lé" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Phân loại</label>
                  <select 
                    value={phanLoai} 
                    onChange={(e) => setPhanLoai(e.target.value)} 
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium"
                  >
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">LSX / Lô nhập</label>
                  <input value={lsx} onChange={(e) => setLsx(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none font-mono bg-white" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">2</span>
                  Đặc Tính & Tỉ Lệ Size
                </div>
                <button
                  type="button"
                  onClick={() => setOpenSizeBuilder(true)}
                  className="p-1.5 bg-fuchsia-50 text-fuchsia-600 rounded-lg hover:bg-fuchsia-100 transition-colors"
                  title="Tạo bảng size mới"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </h3>
              
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">Chọn bảng tỉ lệ áp dụng *</label>
                <select value={presetId} onChange={(e) => doiPresetChung(e.target.value)} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                  {SIZE_RATIO_PRESETS.length > 0 && (
                    <optgroup label="Bảng chuẩn">
                      {SIZE_RATIO_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </optgroup>
                  )}
                  {customPresets.length > 0 && (
                    <optgroup label="Bảng tự tạo">
                      {customPresets.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div className="mt-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                <span className="font-bold text-slate-800 shrink-0">Tỉ lệ:</span> 
                <span className="tracking-widest">{preset.sizes.join(":")} = {preset.ratios.join(":")}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
              <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs">3</span>
                Thiết Lập Giá Bán
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">Giá vốn</label>
                  <div className="relative">
                    <input type="number" min={0} value={giaVon || ""} onChange={(e) => setGiaVon(Math.max(0, parseInt(e.target.value) || 0))} className="w-full pl-3 pr-8 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-[#2B4C3E] outline-none bg-white text-slate-800" placeholder="0" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">đ</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 mb-3 block">Giá bán các kênh</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán lẻ</label>
                      <input type="number" min={0} value={giaBanLe || ""} onChange={(e) => setGiaBanLe(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán sỉ</label>
                      <input type="number" min={0} value={giaBanSi || ""} onChange={(e) => setGiaBanSi(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Bán lô</label>
                      <input type="number" min={0} value={giaBanLo || ""} onChange={(e) => setGiaBanLo(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">TikTok</label>
                      <input type="number" min={0} value={giaTikTok || ""} onChange={(e) => setGiaTikTok(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">Shopee</label>
                      <input type="number" min={0} value={giaShopee || ""} onChange={(e) => setGiaShopee(Math.max(0, parseInt(e.target.value) || 0))} className="w-full px-2.5 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">4</span>
                  Danh Sách Biến Thể Màu ({bienThe.length})
                </h3>
                <span className="text-xs font-semibold text-[#2B4C3E] bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  Tổng: {tongSLTatCa.toLocaleString()} SP
                </span>
              </div>
              
              <div className="space-y-4">
                {bienThe.map((bt, idx) => {
                  const tong = tongSLBienThe(bt);
                  return (
                    <div key={idx} className="border-2 border-slate-200 bg-slate-50/50 rounded-xl p-4 relative group transition-colors hover:border-[#2B4C3E]">
                      {bienThe.length > 1 && (
                        <button onClick={() => setBienThe((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Xoá biến thể này">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="flex flex-col sm:flex-row gap-5 mb-4">
                        <div className="w-20 h-20 bg-white rounded-xl border-2 border-slate-200 shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-sm hover:border-[#2B4C3E] transition-colors" onClick={() => fileInputs.current[idx]?.click()}>
                          <input ref={(el) => { fileInputs.current[idx] = el; }} type="file" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAnh(idx, f); }} />
                          {uploadingIdx === idx ? (
                            <div className="text-[10px] text-emerald-600 font-bold text-center px-1">Đang tải...</div>
                          ) : bt.img ? (
                            <img src={bt.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Camera className="w-6 h-6 text-slate-300" />
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Tải ảnh</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="pr-8">
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tên màu biến thể *</label>
                            <input value={bt.mau} onChange={(e) => capNhatBienThe(idx, { mau: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium" placeholder="VD: Trắng" />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold text-slate-700">Chia số lượng theo Size</label>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] text-slate-500 shrink-0">Nhập tổng SL tự chia:</label>
                                <input type="number" min={0} value={bt.slDuKien || ""} onChange={(e) => doiSlDuKien(idx, Math.max(0, parseInt(e.target.value) || 0))} className="w-20 px-2 py-1 border-2 border-slate-200 rounded-lg text-xs focus:border-[#2B4C3E] outline-none text-right font-bold bg-white" placeholder="0" />
                              </div>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-end">
                              {bt.sizes.map((s, si) => (
                                <div key={s.size} className="flex flex-col shrink-0 min-w-[54px]">
                                  <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t-lg bg-slate-200 text-slate-600 text-center">{s.size}</span>
                                  <input
                                    type="number" min={0} value={s.sl}
                                    onChange={(e) => doiSizeSL(idx, si, Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-1 py-1.5 text-sm font-extrabold text-center bg-white text-emerald-700 border-x-2 border-b-2 border-slate-200 rounded-b-lg outline-none focus:border-[#2B4C3E]"
                                  />
                                </div>
                              ))}
                              <div className="flex flex-col shrink-0 min-w-[60px] ml-2">
                                <span className="w-full px-1 py-1 text-[11px] font-bold rounded-t-lg bg-[#2B4C3E] text-white text-center">Tổng SL</span>
                                <span className="w-full px-1 py-1.5 text-sm font-extrabold text-center bg-white border-x-2 border-b-2 border-[#2B4C3E] rounded-b-lg text-slate-800">{tong}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t-2 border-slate-200 border-dashed">
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Vị trí (Khu kệ)</label>
                          <select value={bt.viTri} onChange={(e) => capNhatBienThe(idx, { viTri: e.target.value })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                            <option value="">-- Chọn --</option>
                            {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">Trạng thái</label>
                          <select value={bt.trangThai} onChange={(e) => capNhatBienThe(idx, { trangThai: e.target.value as any })} className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium">
                            <option value="con">Còn hàng</option>
                            <option value="dat-hang">Đã đặt hàng</option>
                            <option value="xuat-kho">Đã xuất kho</option>
                            <option value="khong-dat">Không đạt</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-bold text-slate-700 mb-2 block">Kênh được phép bán *</label>
                          <div className="flex flex-wrap gap-2">
                            {DS_KENH_BAN.map((kenh) => {
                              const selected = bt.kenhBan.includes(kenh.value);
                              return (
                                <button
                                  key={kenh.value}
                                  type="button"
                                  onClick={() => capNhatBienThe(idx, {
                                    kenhBan: selected
                                      ? bt.kenhBan.filter((value) => value !== kenh.value)
                                      : [...bt.kenhBan, kenh.value],
                                  })}
                                  className={\`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all \${selected ? "border-[#2B4C3E] bg-emerald-50 text-[#2B4C3E]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}\`}
                                >
                                  {selected ? "✓ " : ""}{kenh.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setBienThe((prev) => [...prev, bienTheMoi(preset.sizes)])}
                className="w-full mt-4 py-3 border-2 border-dashed border-[#2B4C3E] rounded-xl text-[#2B4C3E] font-bold text-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Thêm biến thể mới
              </button>
            </div>

            {/* Summary widget */}
            <div className="bg-[#2B4C3E]/5 p-4 rounded-2xl border-2 border-[#2B4C3E]/20">
              <div className="text-xs font-bold text-[#2B4C3E] mb-2">TÓM TẮT LÔ NHẬP</div>
              <div className="space-y-1.5 text-sm text-[#2B4C3E]">
                <div className="flex justify-between items-start gap-2">
                  <span className="font-bold shrink-0">{maSP || "—"}</span>
                  <span className="text-right truncate">{tenSP || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số lượng màu:</span>
                  <span className="font-bold">{bienThe.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#2B4C3E]/20 mt-2">
                  <span className="font-bold">Tổng nhập kho:</span>
                  <span className="font-black text-[#2B4C3E] text-lg">{tongSLTatCa.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 rounded-b-2xl z-20">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl font-bold transition-colors">
              Hủy bỏ
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              className="px-6 py-2.5 bg-[#2B4C3E] hover:bg-[#203a2f] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" /> {saving ? "Đang lưu..." : \`Lưu \${bienThe.length} biến thể\`}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {openSizeBuilder && (
        <SizeRatioBuilderModal onClose={() => setOpenSizeBuilder(false)} onSave={handleLuuBangSizeMoi} />
      )}
    </>
  );
}
`;

if (them_start !== -1) {
    content = content.substring(0, them_start) + them_replacement + content.substring(them_end);
    console.log("Replaced ThemNhieuBienTheForm");
} else {
    console.log("Could not find ThemNhieuBienTheForm");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
