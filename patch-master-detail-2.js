const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add tiLeSize and Khu ke hang to the Filters toolbar
const filterHtmlOld = `<select value={filterViTri} onChange={(e) => setFilterViTri(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 font-semibold text-slate-700 min-w-[150px]">
                <option value="all">Khu vực (Tất cả)</option>
                {Array.from(new Set(dsSanPham.map(s => s.viTri.split(" ")[1]))).map(v => v && <option key={v} value={v}>Khu {v}</option>)}
              </select>`;
const filterHtmlNew = `<select value={filterTiLeSize} onChange={(e) => setFilterTiLeSize(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 font-semibold text-slate-700 min-w-[150px]">
                <option value="all">Tỉ lệ size (Tất cả)</option>
                {dsDynamicTiLeSize.map(v => v && <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={filterViTri} onChange={(e) => setFilterViTri(e.target.value)} className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-amber-400 font-semibold text-slate-700 min-w-[150px]">
                <option value="all">Khu kệ hàng (Tất cả)</option>
                {DS_KHU_KE_HANG.map(v => <option key={v} value={v}>{v}</option>)}
              </select>`;
code = code.replace(filterHtmlOld, filterHtmlNew);

// 2. Add Modal Master Details
const masterModalHtml = `
      {/* Modal Master Details */}
      {showMasterDetails && (() => {
        const group = groupedProducts.find(g => g.maSP === showMasterDetails);
        if (!group) return null;
        const totalQty = group.items.reduce((s, x) => s + x.soLuong, 0);
        const totalValue = group.items.reduce((s, x) => s + x.giaTri, 0);
        const uniqueTls = Array.from(new Set(group.items.map(i => i.tiLeSize).filter(Boolean)));
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white/20 rounded-xl border border-white/20 flex items-center justify-center overflow-hidden">
                    {productImages[group.maSP] ? <img src={productImages[group.maSP]} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 opacity-70" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{group.tenSP || "Sản phẩm mới"}</h2>
                    <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                      <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{group.maSP}</span>
                      <span>• {group.items.length} kiện biến thể</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setShowMasterDetails(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className="p-5 flex-1 overflow-y-auto bg-slate-50">
                
                {/* Master Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tỉ lệ size</div>
                    <div className="font-semibold text-slate-800 text-sm">{uniqueTls.length > 0 ? uniqueTls.join(", ") : "Chưa cập nhật"}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng Số Lượng</div>
                    <div className="font-black text-2xl text-emerald-600">{totalQty.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng Giá Vốn (Ước tính)</div>
                    <div className="font-black text-2xl text-rose-600">{(totalValue * 0.7 / 1000).toFixed(0)}K</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold text-slate-500 uppercase mb-1">Tổng Giá Bán</div>
                    <div className="font-black text-2xl text-amber-600">{(totalValue / 1000).toFixed(0)}K</div>
                  </div>
                </div>

                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <List className="w-4 h-4 text-emerald-600" />
                  Danh sách kiện (Biến thể)
                </h3>
                
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3 font-semibold">Màu sắc</th>
                        <th className="p-3 font-semibold">Size</th>
                        <th className="p-3 font-semibold">Tỉ lệ size</th>
                        <th className="p-3 font-semibold">Số lượng</th>
                        <th className="p-3 font-semibold">Đơn giá</th>
                        <th className="p-3 font-semibold">LSX</th>
                        <th className="p-3 font-semibold">Vị trí</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-800">{item.mau}</td>
                          <td className="p-3 text-slate-600 font-mono text-xs">{item.size}</td>
                          <td className="p-3 text-slate-500 text-xs">{item.tiLeSize || "-"}</td>
                          <td className="p-3 font-bold text-emerald-600">{item.soLuong.toLocaleString()}</td>
                          <td className="p-3 text-slate-600">{item.donGia.toLocaleString()}đ</td>
                          <td className="p-3 font-mono text-xs text-slate-400">{item.lsx}</td>
                          <td className="p-3 text-slate-500">{item.viTri}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
`;
if (!code.includes('Modal Master Details')) {
  code = code.replace(`{/* Modal Thêm/Sửa SP */}`, masterModalHtml + '\n      {/* Modal Thêm/Sửa SP */}');
}

fs.writeFileSync(file, code);
