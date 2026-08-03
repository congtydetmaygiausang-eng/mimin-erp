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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Shirt className="w-8 h-8 text-[#2B4C3E]" />
            Danh Mục Sản Phẩm
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý Master Data (Thông tin gốc) của các sản phẩm</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowBangSize(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg"
          >
            <Ruler className="w-5 h-5" />
            Bảng Size ({dsSanPham?.length || 0})
          </button>
          <button
            onClick={() => {
              setEditId(null);
              setShowModal(true);
            }}
            className="bg-[#2B4C3E] text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-[#1A3329] transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Thêm Mẫu Mới
          </button>
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
