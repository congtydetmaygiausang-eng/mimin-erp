"use client";

import { useState, useEffect } from "react";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { Plus, Search, Shirt, Edit2, Trash2, Ruler } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import DanhMucSPModal from "@/components/DanhMucSPModal";
import BangSizeManagerModal from "@/components/BangSizeManagerModal";
import { toast } from "sonner";

export default function DanhMucSanPhamPage() {
  const { dsSanPham, xoaSP } = useDanhMucSP();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showBangSize, setShowBangSize] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filtered = (dsSanPham || []).filter(
    (sp) =>
      (sp?.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (sp?.tenSP || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Premium Header Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-8 border border-white/20">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
          style={{ backgroundImage: "url('/bg/sky-soft.jpg')" }}
        ></div>
        
        {/* Overlay / Glassmorphism */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 via-teal-800/40 to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="text-white drop-shadow-md">
            <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3 tracking-tight">
              <Shirt className="w-9 h-9 text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              Danh mục Sản phẩm
            </h1>
            <p className="mt-3 text-cyan-50 opacity-90 max-w-lg text-sm md:text-base leading-relaxed font-medium">
              Quản lý Master Data (Thông tin gốc) của các sản phẩm. Thêm mẫu mới, cấu hình bảng size và định mức màu sắc.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBangSize(true)}
              className="px-5 py-3 rounded-xl bg-black/20 hover:bg-black/40 border border-white/20 backdrop-blur-md text-white font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Ruler className="w-4 h-4" />
              Bảng Size ({dsSanPham?.length || 0})
            </button>
            <button
              onClick={() => {
                setEditId(null);
                setShowModal(true);
              }}
              className="group relative px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/40 backdrop-blur-lg text-white font-bold text-base shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(34,211,238,0.6)] transition-all overflow-hidden flex items-center gap-2"
            >
              {/* Animated Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 drop-shadow-md relative z-10" />
              <span className="relative z-10 drop-shadow-lg tracking-wide uppercase">Thêm Mẫu Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm theo Mã SP hoặc Tên SP..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((sp) => (
          <div key={sp.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
            <div className="h-48 bg-slate-100 relative overflow-hidden group border-b">
              {sp.dsMau[0]?.img ? (
                <img src={sp.dsMau[0].img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={sp.tenSP} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                  <Shirt className="w-16 h-16 opacity-50" />
                  <span className="text-xs font-semibold mt-2">Chưa có ảnh</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditId(sp.id); setShowModal(true); }} className="p-2 bg-white rounded-full shadow hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if(confirm("Xóa mẫu này?")) { xoaSP(sp.id); toast.success("Đã xóa"); } }} className="p-2 bg-white rounded-full shadow hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="absolute top-2 left-2 px-2 py-1 bg-white/90 backdrop-blur-sm rounded text-xs font-bold text-[#2B4C3E] border">
                {sp.id}
              </div>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 line-clamp-1 mb-1">{sp.tenSP}</h3>
              <p className="text-sm text-slate-500 mb-3">{LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}</p>
              
              <div className="grid grid-cols-2 gap-2 text-sm mt-auto border-t pt-3">
                <div>
                  <div className="text-xs text-slate-400">Giá vốn DK</div>
                  <div className="font-semibold text-rose-600">{formatVND(sp.giaVonDuKien)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Giá bán DK</div>
                  <div className="font-semibold text-emerald-600">{formatVND(sp.giaBanDuKien)}</div>
                </div>
              </div>

              {/* BẢNG SIZE MINI - hiển thị ngay trong card */}
              {sp.bangSize && (
                <div className="mt-3 p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] font-bold text-blue-700 uppercase flex items-center gap-1">
                      📐 Bảng Size
                    </div>
                    <div className="text-[10px] font-mono font-bold text-blue-900">
                      Ri {sp.bangSize.riSo}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {sp.bangSize.sizes.map((size, idx) => {
                      const r = sp.bangSize!.ratios[idx];
                      const isActive = r > 0;
                      return (
                        <div
                          key={size}
                          className={`text-center rounded py-1 ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 text-slate-400 line-through"
                          }`}
                          title={`${size}: ${r} phần`}
                        >
                          <div className="text-[8px] font-semibold uppercase leading-none">{size}</div>
                          <div className="text-xs font-bold leading-tight">{r}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                {sp.dsMau.map(m => (
                  <span key={m.maSKU} className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-full font-medium text-slate-600 border">
                    {m.ten}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <Shirt className="w-16 h-16 mx-auto opacity-20 mb-4" />
          <p>Không tìm thấy sản phẩm nào</p>
        </div>
      )}

      {showModal && (
        <DanhMucSPModal 
          open={showModal} 
          onClose={() => setShowModal(false)} 
          editId={editId} 
        />
      )}
    </div>
  );
}
