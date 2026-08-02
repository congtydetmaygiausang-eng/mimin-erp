const fs = require('fs');
const file = 'apps/web/src/app/(main)/kho-thanh-pham/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Find the green header section
const startStr = '{/* Header: Khung vùng xanh lá */}';
const endStr = '{/* Body: Danh sách biến thể */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const newHeader = `{/* Header: Khung vùng xanh lá */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-4 md:p-5 text-white flex flex-col md:flex-row gap-5 items-stretch">
                      {/* Left: Big Cover Image (Blue Box) & Video */}
                      <div className="flex gap-3 flex-shrink-0">
                        <div 
                          className="w-32 h-32 md:w-40 md:h-40 bg-black/20 rounded-xl relative overflow-hidden group cursor-pointer border border-white/20 shadow-inner"
                          onClick={() => { setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click(); }}
                          title="Đổi ảnh bìa chính"
                        >
                          {productImages[group.maSP] ? (
                            <img src={productImages[group.maSP]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={group.tenSP} />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <Camera className="w-8 h-8 mb-2 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-xs font-bold uppercase tracking-wider opacity-80 text-center leading-tight">Ảnh bìa<br/>chính</span>
                            </div>
                          )}
                        </div>
                        <div 
                          className="w-20 h-32 md:w-24 md:h-40 bg-black/20 rounded-xl relative overflow-hidden group cursor-pointer border border-white/20 shadow-inner flex-shrink-0"
                          onClick={() => { setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click(); }}
                          title="Đổi video"
                        >
                          {productVideos[group.maSP] ? (
                            <video src={productVideos[group.maSP]} className="w-full h-full object-cover group-hover:scale-110 transition-transform" muted loop autoPlay playsInline />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-1">
                              <Video className="w-6 h-6 mb-2 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 text-center leading-tight">Video<br/>SP</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle & Right: Info, Stats (Red boxes), and Buttons (Green boxes) */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div className="flex items-start justify-between">
                          {/* Title */}
                          <div>
                            <div className="inline-block px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wider mb-1.5 backdrop-blur">{group.maSP}</div>
                            <h2 className="text-2xl md:text-3xl font-bold leading-tight">{group.tenSP || "Sản phẩm mới"}</h2>
                          </div>
                          
                          {/* Buttons (Green boxes) */}
                          <div className="flex gap-2 flex-wrap justify-end">
                            <button onClick={() => alert('Xem chi tiết lệnh tổng: ' + group.tenSP)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur text-white transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-white/10" title="Xem chi tiết">
                              <Eye className="w-4 h-4" /> <span className="hidden lg:inline">Chi tiết</span>
                            </button>
                            <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur text-white transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-white/10" title="Thêm đơn hàng">
                              <Plus className="w-4 h-4" /> <span className="hidden lg:inline">Thêm đơn</span>
                            </button>
                            <button onClick={() => alert('Chức năng sửa tổng')} className="px-3 py-1.5 bg-amber-500/90 hover:bg-amber-500 rounded-lg backdrop-blur text-white transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-amber-400/50" title="Sửa tổng">
                              <Edit className="w-4 h-4" /> <span className="hidden lg:inline">Sửa tổng</span>
                            </button>
                            <button onClick={() => { if(confirm('Xóa toàn bộ sản phẩm này?')) update(dsSanPham.filter(s => s.maSP !== group.maSP)); }} className="p-1.5 bg-rose-500/80 hover:bg-rose-500 rounded-lg backdrop-blur text-white transition-colors shadow-sm" title="Xóa toàn bộ sản phẩm">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Stats (Red boxes) */}
                        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mt-4">
                          <div className="bg-black/15 rounded-xl p-3 backdrop-blur border border-white/10 shadow-inner">
                            <div className="text-[10px] text-emerald-100 uppercase font-semibold mb-1">Tổng số lượng</div>
                            <div className="text-2xl font-black">{totalQty.toLocaleString()}</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-3 backdrop-blur border border-white/10 shadow-inner">
                            <div className="text-[10px] text-emerald-100 uppercase font-semibold mb-1">Giá bán</div>
                            <div className="text-2xl font-bold">{priceDisplay}đ</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-3 backdrop-blur border border-white/10 shadow-inner">
                            <div className="text-[10px] text-emerald-100 uppercase font-semibold mb-1">Tổng giá trị</div>
                            <div className="text-2xl font-bold">{(totalValue/1000).toFixed(0)}K</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-3 backdrop-blur border border-white/10 shadow-inner">
                            <div className="text-[10px] text-emerald-100 uppercase font-semibold mb-1">Kiện biến thể</div>
                            <div className="text-2xl font-bold">{group.items.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    `;

  code = code.substring(0, startIndex) + newHeader + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log("Patched layout successfully");
} else {
  console.log("Could not find delimiters");
}
