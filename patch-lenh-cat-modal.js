const fs = require('fs');
const file = 'apps/web/src/components/LenhCatModal.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('const [dsMau, setDsMau]')) {
  code = code.replace(
    'const [ghiChu, setGhiChu] = useState("");',
    `const [ghiChu, setGhiChu] = useState("");\n  const [dsMau, setDsMau] = useState([\n    { ten: "màu vải chính", sl: "", ghiChu: "", img: "" },\n    { ten: "màu vải chính", sl: "", ghiChu: "", img: "" },\n    { ten: "màu vải chính", sl: "", ghiChu: "", img: "" },\n    { ten: "màu vải chính", sl: "", ghiChu: "", img: "" }\n  ]);`
  );
}

if (!code.includes('handleColorImageUpload')) {
  code = code.replace(
    '// ============ Load data khi edit ============',
    `const handleColorImageUpload = (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setDsMau(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], img: ev.target?.result as string };
            return next;
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // ============ Load data khi edit ============`
  );
}

const renderStart = code.indexOf('// ============ Render ============');
if (renderStart > -1) {
  const newRender = `// ============ Render ============
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-2 md:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#2B4C3E] rounded-xl shadow-2xl max-w-4xl w-full max-h-[96vh] overflow-hidden flex flex-col animate-slide-up border-4 border-[#2B4C3E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close */}
        <div className="flex justify-end p-2 bg-[#2B4C3E]">
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          
          {/* THÔNG TIN CHÍNH CỦA LỆNH CẮT */}
          <div className="bg-[#F4F1EA] p-6 border-b-[16px] border-[#2B4C3E]">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide">THÔNG TIN CHÍNH CỦA LÊNH CẮT</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Loại SP *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Mã SP *</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tên SP *</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Tổng SL cắt *</label>
                  <input type="number" min={1} className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => setTongSL(Math.max(1, parseInt(e.target.value) || 0))} />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-1">Phụ trách cắt *</label>
                  <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B4C3E]" value={phuTrachCat} onChange={(e) => handlePhuTrachCatChange(e.target.value)}>
                    {REAL_NHAN_VIEN.filter((n) => n.boPhan?.toLowerCase().includes("cắt")).map((n) => (
                      <option key={n.ma} value={n.ma}>{n.ma} - {n.ten} ({n.boPhan})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-slate-700">Phân bổ size * <span className="text-xs text-slate-500 font-normal">({tongPhanBoSize} / {tongSL})</span></label>
                    <button onClick={addSizeRow} className="text-xs text-[#2B4C3E] hover:underline flex items-center font-bold">
                      <Plus className="w-3 h-3 mr-0.5" /> Thêm size
                    </button>
                  </div>
                  <div className="space-y-2 bg-white p-3 border border-slate-200 rounded shadow-inner">
                    {phanBoSize.map((p, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select className="px-2 py-1.5 border border-slate-300 rounded focus:outline-none w-20 text-sm" value={p.size} onChange={(e) => updateSizeRow(idx, "size", e.target.value)}>
                          {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <input type="number" min={0} className="px-2 py-1.5 border border-slate-300 rounded focus:outline-none flex-1 text-sm" value={p.sl} onChange={(e) => updateSizeRow(idx, "sl", Math.max(0, parseInt(e.target.value) || 0))} placeholder="Số lượng..." />
                        <span className="text-sm text-slate-500 w-6">cái</span>
                        <button onClick={() => removeSizeRow(idx)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRID HÌNH ẢNH MÀU SẮC */}
          <div className="bg-[#9ACBB8] p-6 border-b-[16px] border-[#2B4C3E]">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {dsMau.map((mau, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-3 flex flex-col gap-2">
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                    placeholder="Tên màu..."
                    value={mau.ten}
                    onChange={(e) => {
                      const next = [...dsMau];
                      next[idx].ten = e.target.value;
                      setDsMau(next);
                    }}
                  />
                  
                  <div 
                    className="relative w-full aspect-[4/5] bg-slate-100 border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-[#2B4C3E] transition-colors flex items-center justify-center"
                    onClick={() => handleColorImageUpload(idx)}
                  >
                    {mau.img ? (
                      <img src={mau.img} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-8 h-8 text-[#2B4C3E]" />
                        <span className="text-xs mt-2 text-slate-600 font-medium">Tải ảnh áo</span>
                      </div>
                    )}
                  </div>

                  <input 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                    placeholder="Số lượng cắt..."
                    value={mau.sl}
                    onChange={(e) => {
                      const next = [...dsMau];
                      next[idx].sl = e.target.value;
                      setDsMau(next);
                    }}
                  />
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 text-sm rounded focus:outline-none focus:border-[#2B4C3E]" 
                    placeholder="Ghi chú thêm..."
                    value={mau.ghiChu}
                    onChange={(e) => {
                      const next = [...dsMau];
                      next[idx].ghiChu = e.target.value;
                      setDsMau(next);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* GIA CÔNG VÀ ĐƠN GIÁ */}
          <div className="bg-[#F0A619] p-6 pb-20">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 uppercase tracking-wide drop-shadow-sm">THÔNG TIN người phụ trách và<br/>đơn giá công đoạn</h2>
            
            <div className="bg-white/20 p-4 rounded-xl">
              <div className="grid grid-cols-12 gap-2 mb-3 text-sm font-bold text-slate-800 uppercase px-2">
                <div className="col-span-4 lg:col-span-3">Gia Công</div>
                <div className="col-span-5 lg:col-span-6">Người Phụ Trách</div>
                <div className="col-span-3 text-right">Đơn Giá</div>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: "cat", label: "Cắt", bp: "Cắt" },
                  { key: "mayAo", label: "May Áo", bp: "May" },
                  { key: "mayQuan", label: "May Quần", bp: "May" },
                  { key: "inTheu", label: "In/Thêu", bp: "In" },
                  { key: "uiQC", label: "Ủi/Đóng Gói", bp: "Ủi" },
                ].map((kh) => {
                  const curr = phanCong[kh.key as keyof PhanCongGiaCong];
                  if (!curr) return null;
                  return (
                    <div key={kh.key} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                      <div className="col-span-4 lg:col-span-3 font-semibold text-slate-700 text-sm">{kh.label}</div>
                      <select 
                        className="col-span-5 lg:col-span-6 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-[#F0A619]"
                        value={curr.nguoiMa}
                        onChange={(e) => handlePhanCongChange(kh.key as keyof PhanCongGiaCong, "nguoiMa", e.target.value)}
                      >
                        {REAL_NHAN_VIEN.filter(n => n.boPhan?.toLowerCase().includes(kh.bp.toLowerCase()) || n.chucVu?.toLowerCase().includes("gia công")).map(n => (
                          <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>
                        ))}
                      </select>
                      <div className="col-span-3 relative">
                        <input 
                          type="number" 
                          min={0}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right pr-6 focus:outline-none focus:border-[#F0A619]"
                          value={curr.donGia}
                          onChange={(e) => handlePhanCongChange(kh.key as keyof PhanCongGiaCong, "donGia", parseInt(e.target.value) || 0)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">đ</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer Buttons */}
        <div className="bg-[#2B4C3E] p-4 flex items-center justify-end gap-4 border-t border-white/10">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-white bg-white/10 hover:bg-white/20 transition-colors">
            Hủy bỏ
          </button>
          <button onClick={handleSubmit} className="px-6 py-2.5 rounded-lg font-bold text-slate-900 bg-[#F0A619] hover:bg-[#F0A619]/90 transition-colors shadow-lg flex items-center gap-2">
            <Save className="w-5 h-5" />
            {editing ? "Lưu thay đổi" : "Tạo Lệnh Cắt Mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
`;
  code = code.substring(0, renderStart) + newRender;
}

fs.writeFileSync(file, code);
