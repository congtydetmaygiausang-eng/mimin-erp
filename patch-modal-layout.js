const fs = require('fs');

const modalFile = 'apps/web/src/components/LenhCatModal.tsx';
let modalCode = fs.readFileSync(modalFile, 'utf8');

// 1. Add state for ngayBatDau and sdtLienHe
modalCode = modalCode.replace(
  /const \[hanHoanThanh, setHanHoanThanh\] = useState\(\(\) => \{/g,
  `const [ngayBatDau, setNgayBatDau] = useState(() => new Date().toISOString().split("T")[0]);
  const [sdtLienHe, setSdtLienHe] = useState("");
  const [hanHoanThanh, setHanHoanThanh] = useState(() => {`
);

// 2. Replace KHỐI 1 JSX
const block1Regex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\!-- KHỐI 2/m;
// Wait, the end of Block 1 in the current code is:
/*
              </div>
            </div>
          </div>

          {/* KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU *\/}
*/

const block1RegexExact = /<div className="grid grid-cols-1 md:grid-cols-3 gap-6">[\s\S]*?(?=<\!-- KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU -->)/m;

const newBlock1 = `<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Row 1 */}
              {loaiLenh === "HangDat" && (
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                    <option value="">-- Chọn Khách Hàng --</option>
                    {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                  </select>
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                   {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
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
                <label className="text-sm font-bold text-slate-700 block mb-1">Ngày bắt đầu *</label>
                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ngayBatDau} onChange={(e) => setNgayBatDau(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
              </div>

              {/* Row 4 */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Tổng SL cắt dự kiến *</label>
                <input type="number" min={1} className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => {
                  const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0);
                  setTongSL(val);
                  if (val && typeof val === "number") {
                    const perColor = Math.floor(val / soMau);
                    setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                  }
                }} placeholder="VD: 500" />
              </div>

              {/* Row 5 */}
              <div>
                 <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất *</label>
                 <div className="flex items-center gap-2">
                   <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold overflow-hidden border border-emerald-300 flex-shrink-0">
                     {phuTrachCat ? (REAL_NHAN_VIEN.find(x => x.ma === phuTrachCat)?.ten?.substring(0, 2) || "NV") : "NV"}
                   </div>
                   <select className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={phuTrachCat} onChange={e => {
                       setPhuTrachCat(e.target.value);
                       const nv = REAL_NHAN_VIEN.find(x => x.ma === e.target.value);
                       if(nv) setSdtLienHe(nv.sdt || "");
                   }}>
                     <option value="">-- Chọn NV --</option>
                     {REAL_NHAN_VIEN.map(nv => <option key={nv.ma} value={nv.ma}>{nv.ten}</option>)}
                   </select>
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-slate-700 block mb-1">SĐT liên hệ</label>
                 <input type="text" className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded text-slate-500 font-medium" value={sdtLienHe} readOnly placeholder="---" />
              </div>

              {/* Row 6 */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                  {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <div className="mt-1 text-xs text-slate-500 italic">Khi nhập SL dự kiến từng màu, hệ thống tự bung tỷ lệ size cho màu đó.</div>
              </div>
              
              {/* Row 7 */}
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                <textarea className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} rows={2} placeholder="Ghi chú thêm..."></textarea>
              </div>
            </div>
          </div>
          `;

modalCode = modalCode.replace(block1RegexExact, newBlock1);

// 3. Update Khối 3 (Gia công) with Avatars
const block3Regex = /<select\s+className="col-span-6[\s\S]*?<\/select>/g;

modalCode = modalCode.replace(block3Regex, (match, offset, str) => {
  // We need to wrap it and add the avatar.
  // Look at the context of the match. It's inside a grid-cols-12
  // We can change the <select> into a flex div.
  return `<div className="col-span-6 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-blue-200 flex-shrink-0 text-[10px]">
                            {kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || "NV") : "NV"}
                          </div>
                          ${match.replace('col-span-6', 'flex-1')}
                        </div>`;
});

// Remove User icon if imported? We didn't import User, we use string initials.
fs.writeFileSync(modalFile, modalCode);
console.log("Patched successfully");
