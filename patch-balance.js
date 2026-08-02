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
                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-4 md:p-6 text-white flex flex-col md:flex-row gap-6 items-stretch rounded-t-2xl">
                      
                      {/* Left: Big Cover Image & Video */}
                      <div className="flex gap-3 flex-shrink-0 w-full md:w-[420px] h-[240px] md:h-auto">
                        
                        {/* ẢNH BÌA */}
                        <div 
                          className="flex-1 bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner"
                          onClick={() => {
                            if (productImages[group.maSP]) {
                              const a = document.createElement('a');
                              a.href = productImages[group.maSP];
                              a.download = \`anh-bia-\${group.maSP}.png\`;
                              a.click();
                            } else {
                              setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click();
                            }
                          }}
                          title={productImages[group.maSP] ? "Nhấn để tải ảnh về" : "Nhấn để tải ảnh lên"}
                        >
                          {productImages[group.maSP] && (
                            <button 
                              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                              onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("image"); fileInputRef.current?.click(); }}
                              title="Thay đổi ảnh bìa"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                          )}
                          
                          {productImages[group.maSP] ? (
                            <img src={productImages[group.maSP]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" alt={group.tenSP} />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                              <Camera className="w-10 h-10 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-sm font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Ảnh bìa<br/>chính</span>
                            </div>
                          )}
                        </div>
                        
                        {/* VIDEO */}
                        <div 
                          className="w-[35%] bg-black/20 rounded-xl relative overflow-hidden group border border-white/20 shadow-inner flex-shrink-0"
                          onClick={() => {
                            if (productVideos[group.maSP]) {
                              const a = document.createElement('a');
                              a.href = productVideos[group.maSP];
                              a.download = \`video-\${group.maSP}.mp4\`;
                              a.click();
                            } else {
                              setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click();
                            }
                          }}
                          title={productVideos[group.maSP] ? "Nhấn để xem hoặc tải video về" : "Nhấn để tải video lên"}
                        >
                          {productVideos[group.maSP] && (
                            <button 
                              className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/90 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110 shadow-lg"
                              onClick={(e) => { e.stopPropagation(); setUploadingSP(group.maSP); setUploadType("video"); fileInputRef.current?.click(); }}
                              title="Thay đổi video"
                            >
                              <Video className="w-4 h-4" />
                            </button>
                          )}

                          {productVideos[group.maSP] ? (
                            <video src={productVideos[group.maSP]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer" muted loop playsInline controls={false} />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors">
                              <Video className="w-8 h-8 mb-3 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-center leading-tight">Video<br/>SP</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle & Right: Info, Stats (Red boxes), and Buttons (Green boxes) */}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        
                        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                          {/* Title */}
                          <div>
                            <div className="inline-flex items-center justify-center px-3 py-1 bg-white/20 rounded-md text-[11px] font-bold uppercase tracking-wider mb-2 backdrop-blur border border-white/10 shadow-sm">{group.maSP || "CHƯA CÓ MÃ"}</div>
                            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight drop-shadow-sm">{group.tenSP || "Sản phẩm mới"}</h2>
                          </div>
                          
                          {/* Buttons */}
                          <div className="flex gap-2 flex-wrap xl:justify-end shrink-0">
                            <button onClick={() => alert('Xem chi tiết lệnh tổng: ' + group.tenSP)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Xem chi tiết">
                              <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Chi tiết</span>
                            </button>
                            <button onClick={() => setShowAdd(true)} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur text-white transition-all text-sm font-semibold flex items-center gap-2 shadow-sm border border-white/10 hover:scale-105" title="Thêm đơn hàng">
                              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm đơn</span>
                            </button>
                            <button onClick={() => alert('Chức năng sửa tổng')} className="px-4 py-2 bg-amber-500/90 hover:bg-amber-500 rounded-xl backdrop-blur text-white transition-all text-sm font-bold flex items-center gap-2 shadow-md border border-amber-400/50 hover:scale-105" title="Sửa tổng">
                              <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Sửa tổng</span>
                            </button>
                            <button onClick={() => { if(confirm('Xóa toàn bộ sản phẩm này?')) update(dsSanPham.filter(s => s.maSP !== group.maSP)); }} className="p-2 bg-rose-500/80 hover:bg-rose-500 rounded-xl backdrop-blur text-white transition-all shadow-md hover:scale-105" title="Xóa toàn bộ sản phẩm">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng số lượng</div>
                            <div className="text-3xl font-black drop-shadow-sm">{totalQty.toLocaleString()}</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Giá bán</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{priceDisplay}đ</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Tổng giá trị</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{(totalValue/1000).toFixed(0)}K</div>
                          </div>
                          <div className="bg-black/15 rounded-xl p-4 backdrop-blur border border-white/10 shadow-inner hover:bg-black/20 transition-colors">
                            <div className="text-xs text-emerald-100 uppercase font-bold tracking-wider mb-1.5 opacity-90">Kiện biến thể</div>
                            <div className="text-3xl font-bold drop-shadow-sm">{group.items.length}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    `;

  code = code.substring(0, startIndex) + newHeader + code.substring(endIndex);
  fs.writeFileSync(file, code);
  console.log("Patched layout perfectly");
} else {
  console.log("Could not find delimiters");
}
