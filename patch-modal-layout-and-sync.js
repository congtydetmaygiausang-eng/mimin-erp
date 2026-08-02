const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

// 1. Remove "Người phụ trách cắt" dropdown and "Nhân công phụ trách từng khâu" section, and force grid-cols-2 instead of md:grid-cols-2.
// Let's replace the whole grid section in KHOI 1.
// We also want to remove "phuTrachCat" state or just keep it unused.
const oldGridKHOI1 = `<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                {loaiLenh === "HangDat" ? (
                  <>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                    </select>
                  </>
                ) : (
                  <div className="h-full flex items-end pb-2">
                    <span className="text-xs text-slate-400 italic">Đang tạo Lệnh Cắt cho Hàng Nhà</span>
                  </div>
                )}
              </div>

              {/* Row 2 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
              </div>
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

              {/* Row 4 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách cắt *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={phuTrachCat} onChange={e => setPhuTrachCat(e.target.value)}>
                  {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                  {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Row 5 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất & SĐT liên hệ *</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-emerald-300 flex-shrink-0">
                    {REAL_NHAN_VIEN.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select className="px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => setPhuTrachSX(e.target.value)}>
                      {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                    </select>
                    <input className="px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
              </div>

              {/* Row 6 */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-2">Nhân công phụ trách từng khâu (Lương sản phẩm)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "✂️ Cắt", key: "cat", color: "bg-amber-100 text-amber-700 border-amber-200" },
                    { label: "♨️ Ủi", key: "ui", color: "bg-orange-100 text-orange-700 border-orange-200" },
                    { label: "📦 Đóng Gói", key: "dongGoi", color: "bg-blue-100 text-blue-700 border-blue-200" }
                  ].map(({ label, key, color }) => {
                    const khau = (Array.isArray(phanCong) ? phanCong : []).find((k: any) => k.id === key);
                    const nv = khau?.nguoiMa ? REAL_NHAN_VIEN.find(n => n.ma === khau.nguoiMa) : null;
                    return (
                      <div key={key} className="flex items-center gap-2 bg-white/70 rounded-lg p-2 border border-slate-200 shadow-sm">
                        <div className={\`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border flex-shrink-0 \${color}\`}>
                          {nv?.ten?.substring(0,2) || "--"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
                          <div className="text-xs text-slate-800 truncate font-semibold">{nv?.ten || "Chưa phân công"}</div>
                        </div>
                        {khau?.donGia ? <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{khau.donGia.toLocaleString()}đ</div> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>`;

const newGridKHOI1 = `<div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                {loaiLenh === "HangDat" ? (
                  <>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                    </select>
                  </>
                ) : (
                  <div className="h-full flex items-end pb-2">
                    <span className="text-xs text-slate-400 italic">Đang tạo Lệnh Cắt cho Hàng Nhà</span>
                  </div>
                )}
              </div>

              {/* Row 2 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
              </div>
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

              {/* Row 4 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                  {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
              </div>

              {/* Row 5 */}
              <div className="col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất & SĐT liên hệ *</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-emerald-300 flex-shrink-0">
                    {REAL_NHAN_VIEN.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select className="px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => setPhuTrachSX(e.target.value)}>
                      {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                    </select>
                    <input className="px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                  </div>
                </div>
              </div>
            </div>`;

code = code.replace(oldGridKHOI1, newGridKHOI1);

// 2. Add useEffect to sync phanCong and chiPhiCoDinh when dsMauCongDoan and dsMauChiPhi load or change
const oldUseEffects = `  // Cảnh báo tồn kho
  useEffect(() => {`;

const newUseEffects = `  // Sync default phanCong and chiPhiCoDinh when templates are loaded
  useEffect(() => {
    if (dsMauCongDoan.length > 0 && (!phanCong || phanCong.length === 0)) {
      const defaultCD = dsMauCongDoan.find(x => x.id === "BoTheThao") || dsMauCongDoan[0];
      if (defaultCD) {
        setMauCongDoan(defaultCD.id);
        setPhanCong(defaultCD.giaCong);
      }
    }
  }, [dsMauCongDoan, phanCong]);

  useEffect(() => {
    if (dsMauChiPhi.length > 0 && chiPhiCoDinh.baoBi === 0 && chiPhiCoDinh.temNhan === 0 && chiPhiCoDinh.khauHao === 0) {
      const defaultCP = dsMauChiPhi.find(x => x.id === "BoTheThao") || dsMauChiPhi[0];
      if (defaultCP) {
        setMauChiPhi(defaultCP.id);
        setChiPhiCoDinh(defaultCP.chiPhi);
      }
    }
  }, [dsMauChiPhi, chiPhiCoDinh]);

  // Cảnh báo tồn kho
  useEffect(() => {`;

code = code.replace(oldUseEffects, newUseEffects);

// 3. Make chiPhiCoDinh select dropdown load dynamically from dsMauChiPhi
const oldSelectChiPhi = `<select 
                      className="px-2 py-1 text-xs border rounded shadow-sm bg-white font-bold text-[#2B4C3E]"
                      value={mauChiPhi}
                      onChange={(e) => {
                        setMauChiPhi(e.target.value);
                        const m = dsMauChiPhi.find(x => x.id === e.target.value); if (m) setChiPhiCoDinh(m.chiPhi);
                      }}
                    >
                      <option value="AoThun">Bảng giá: Áo</option>
                      <option value="Quan">Bảng giá: Quần</option>
                      <option value="BoTheThao">Bảng giá: Bộ</option>
                    </select>`;

const newSelectChiPhi = `<select 
                      className="px-2 py-1 text-xs border rounded shadow-sm bg-white font-bold text-[#2B4C3E]"
                      value={mauChiPhi}
                      onChange={(e) => {
                        setMauChiPhi(e.target.value);
                        const m = dsMauChiPhi.find(x => x.id === e.target.value); if (m) setChiPhiCoDinh(m.chiPhi);
                      }}
                    >
                      {dsMauChiPhi.map(m => <option key={m.id} value={m.id}>Bảng giá: {m.ten}</option>)}
                    </select>`;

code = code.replace(oldSelectChiPhi, newSelectChiPhi);

fs.writeFileSync(modalFile, code);
console.log("Patched LenhCatModal.tsx successfully.");
