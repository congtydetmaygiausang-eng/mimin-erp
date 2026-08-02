const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Remove all border-red-500 (replace with border-slate-300)
code = code.replace(/border-2 border-red-500/g, 'border border-slate-300');

// 2. Add state for phuTrachSX, sdtPhuTrach (already have sdtLienHe)
// Already exists: ngayBatDau, sdtLienHe - just need phuTrachSX
code = code.replace(
  `  const [phuTrachCat, setPhuTrachCat] = useState("NV006");`,
  `  const [phuTrachCat, setPhuTrachCat] = useState("NV006");
  const [phuTrachSX, setPhuTrachSX] = useState("NV001");`
);

// 3. Update KHOI 1 header to show ID + thay doi layout
// Find the grid section and rebuild it with all required fields
// Current: grid-cols-3 with 3 columns
// New: add ID + start date row at top, add phuTrachSX section, add avatars section

const oldFirstRow = `            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {loaiLenh === "HangDat" && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tổng SL cắt dự kiến *</label>
                  <input type="number" min={1} className="w-full px-3 py-2 bg-white border-2 border-[#2B4C3E] rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0);
                    setTongSL(val);
                    // Tự chia đều cho các thẻ màu nếu có nhập
                    if (val && typeof val === "number") {
                      const perColor = Math.floor(val / soMau);
                      setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                    }
                  }} placeholder="Nhập số lượng..." />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách cắt *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={phuTrachCat} onChange={e => setPhuTrachCat(e.target.value)}>
                    <option value="NV006">NV006 - Nguyễn Hoàng Giang</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                    {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <div className="mt-2 text-xs text-slate-500 italic">
                    Khi nhập SL dự kiến từng màu, hệ thống tự bung tỷ lệ size cho màu đó.
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                  <textarea className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={3} placeholder="Ghi chú thêm..."></textarea>
                </div>
              </div>
            </div>`;

const newFirstRow = `            {/* ID + Ngày bắt đầu banner */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-[#2B4C3E]/10 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">ID Lệnh cắt</span>
                <span className="px-3 py-1 bg-[#2B4C3E] text-white rounded-lg text-sm font-bold tracking-widest">
                  {editId || "LC-" + new Date().getFullYear() + "-XXXX"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Ngày bắt đầu</span>
                <input type="date" className="px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-[#2B4C3E]" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-bold text-slate-500 uppercase">→ Hoàn thành</span>
                <input type="date" className="px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                {loaiLenh === "HangDat" && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                    <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                    <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tổng SL cắt dự kiến *</label>
                  <input type="number" min={1} className="w-full px-3 py-2 bg-white border-2 border-[#2B4C3E] rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => {
                    const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0);
                    setTongSL(val);
                    if (val && typeof val === "number") {
                      const perColor = Math.floor(val / soMau);
                      setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                    }
                  }} placeholder="Nhập số lượng..." />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                    {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                  <div className="mt-1 text-xs text-slate-500 italic">Khi nhập SL dự kiến từng màu, hệ thống tự bung tỷ lệ size.</div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                  <textarea className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={2} placeholder="Ghi chú thêm..."></textarea>
                </div>
              </div>

              <div className="space-y-4">
                {/* Người phụ trách SX */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất *</label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-emerald-300 flex-shrink-0">
                      {REAL_NHAN_VIEN.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                    </div>
                    <div className="flex-1">
                      <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => setPhuTrachSX(e.target.value)}>
                        {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                      </select>
                      <input className="w-full mt-1 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                    </div>
                  </div>
                </div>

                {/* Avatars công đoạn */}
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Nhân công từng khâu (lương SP)</label>
                  <div className="space-y-2">
                    {[
                      { label: "✂️ Cắt", key: "cat" },
                      { label: "♨️ Ủi", key: "ui" },
                      { label: "📦 Đóng Gói", key: "dongGoi" }
                    ].map(({ label, key }) => {
                      const khau = (Array.isArray(phanCong) ? phanCong : []).find((k: any) => k.id === key);
                      const nv = khau?.nguoiMa ? REAL_NHAN_VIEN.find(n => n.ma === khau.nguoiMa) : null;
                      return (
                        <div key={key} className="flex items-center gap-2 bg-white/70 rounded-lg px-2 py-1.5 border border-slate-200">
                          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs border border-amber-200 flex-shrink-0">
                            {nv?.ten?.substring(0,2) || "--"}
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-20 flex-shrink-0">{label}</span>
                          <span className="text-xs text-slate-500 truncate flex-1">{nv?.ten || "Chưa phân công"}</span>
                          {khau?.donGia ? <span className="text-xs font-bold text-emerald-600 flex-shrink-0">{khau.donGia.toLocaleString()}đ</span> : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(oldFirstRow, newFirstRow);

fs.writeFileSync(modalFile, code);
console.log("Patched LenhCatModal.tsx: removed red borders, added ID row, start date, phuTrachSX, avatars");
