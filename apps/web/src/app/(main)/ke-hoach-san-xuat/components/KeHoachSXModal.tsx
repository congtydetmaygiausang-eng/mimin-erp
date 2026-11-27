"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Calendar, 
  Building2, 
  Package, 
  Scissors, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Layers,
  Hash
} from "lucide-react";
import type { KHSX, TrangThaiKHSX } from "@/lib/data/khsx-store";
import { LOAI_SP_LABELS, type LoaiSP } from "@/lib/data/lenh-cat-store";

interface KeHoachSXModalProps {
  open: boolean;
  onClose: () => void;
  editing: KHSX | null;
  khsxList: KHSX[];
  dsSanPham: any[];
  dsLenhCat: any[];
  onSave: (data: Partial<KHSX>) => void;
}

const TRANG_THAI_OPTIONS: TrangThaiKHSX[] = ["Lên kế hoạch", "Đang SX", "Hoàn thành", "Trễ hạn"];

const LOAI_SP_OPTIONS: { value: string; label: string }[] = [
  { value: "BoCoTron", label: "Bộ Cổ Tròn" },
  { value: "BoTru", label: "Bộ Cổ Trụ" },
  { value: "AoPolo", label: "Áo Polo" },
  { value: "AoCoTron", label: "Áo Cổ Tròn" },
  { value: "AoTru", label: "Áo Cổ Trụ" },
  { value: "PhuKien", label: "Phụ kiện / Quần" },
];

export function KeHoachSXModal({
  open,
  onClose,
  editing,
  khsxList,
  dsSanPham,
  dsLenhCat,
  onSave,
}: KeHoachSXModalProps) {
  // State form
  const [maKHSX, setMaKHSX] = useState("");
  const [maSP, setMaSP] = useState("");
  const [sanPham, setSanPham] = useState("");
  const [loaiSP, setLoaiSP] = useState<string>("BoCoTron");
  const [soLuong, setSoLuong] = useState<number>(400);
  const [daHoanThanh, setDaHoanThanh] = useState<number>(0);
  const [tuNgay, setTuNgay] = useState("");
  const [denNgay, setDenNgay] = useState("");
  const [xuongPhuTrach, setXuongPhuTrach] = useState("");
  const [trangThai, setTrangThai] = useState<TrangThaiKHSX>("Đang SX");
  const [ghiChu, setGhiChu] = useState("");

  // Thu thập danh sách xưởng phụ trách đầy đủ (từ hệ thống + dữ liệu hiện tại)
  const danhSachXuong = useMemo(() => {
    const set = new Set<string>([
      "Tổ cắt",
      "Xưởng May 1 – Polomimin",
      "Xưởng May 2 – Polomimin",
      "Gia công ngoài",
    ]);

    khsxList.forEach((item) => {
      if (item.xuongPhuTrach && item.xuongPhuTrach.trim()) {
        set.add(item.xuongPhuTrach.trim());
      }
    });

    dsLenhCat.forEach((lc) => {
      (lc.phanCong || []).forEach((pc: any) => {
        if (pc.nguoiTen && pc.nguoiTen.trim()) {
          set.add(pc.nguoiTen.trim());
        }
      });
      if ((lc as any).phuTrachSX) set.add((lc as any).phuTrachSX.trim());
      if ((lc as any).phuTrachCat) set.add((lc as any).phuTrachCat.trim());
    });

    if (editing?.xuongPhuTrach && editing.xuongPhuTrach.trim()) {
      set.add(editing.xuongPhuTrach.trim());
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [khsxList, dsLenhCat, editing]);

  // Khởi tạo giá trị khi mở Modal
  useEffect(() => {
    if (!open) return;

    if (editing) {
      setMaKHSX(editing.maKHSX || editing.id || "");
      setMaSP(editing.maSP || "");
      setSanPham(editing.sanPham || editing.tenSP || "");
      setLoaiSP(editing.loaiSP || "BoCoTron");
      setSoLuong(editing.soLuong || 400);
      setDaHoanThanh(editing.daHoanThanh || 0);
      setTuNgay(editing.tuNgay || new Date().toISOString().slice(0, 10));
      setDenNgay(editing.denNgay || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      setXuongPhuTrach(editing.xuongPhuTrach || danhSachXuong[0] || "Tổ cắt");
      setTrangThai(editing.trangThai || "Đang SX");
      setGhiChu(editing.ghiChu || "");
    } else {
      const generatedCode = `KHSX-${new Date().getFullYear()}-${String(khsxList.length + 1).padStart(3, "0")}`;
      setMaKHSX(generatedCode);
      setMaSP("");
      setSanPham("");
      setLoaiSP("BoCoTron");
      setSoLuong(400);
      setDaHoanThanh(0);
      setTuNgay(new Date().toISOString().slice(0, 10));
      setDenNgay(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      setXuongPhuTrach(danhSachXuong[0] || "Tổ cắt");
      setTrangThai("Lên kế hoạch");
      setGhiChu("");
    }
  }, [open, editing, khsxList, danhSachXuong]);

  // Tìm sản phẩm đối ứng để lấy hình ảnh preview
  const matchedSP = useMemo(() => {
    if (!maSP && !sanPham) return null;
    return dsSanPham.find(
      (s: any) =>
        (maSP && (s.id === maSP || s.ma_sp === maSP)) ||
        (sanPham && s.tenSP === sanPham)
    );
  }, [maSP, sanPham, dsSanPham]);

  // Tìm Lệnh Cắt đối ứng
  const matchedLC = useMemo(() => {
    if (!editing && !maSP) return null;
    return dsLenhCat.find(
      (lc: any) =>
        (editing?.lenhCatId && lc.id === editing.lenhCatId) ||
        (maSP && (lc.maSP === maSP || lc.id.endsWith(maSP)))
    );
  }, [editing, maSP, dsLenhCat]);

  // Tự động nhận diện & gợi ý khi người dùng gõ / chọn Mã SP
  const handleSelectMaSP = (selectedCode: string) => {
    setMaSP(selectedCode);
    if (!selectedCode) return;

    const found = dsSanPham.find(
      (s: any) => s.id === selectedCode || s.ma_sp === selectedCode
    );
    if (found) {
      if (found.tenSP) setSanPham(found.tenSP);
      if (found.loaiSP) setLoaiSP(found.loaiSP);
      if (!editing && found.tiLeSize) {
        // Tự động gán nếu tạo mới
      }
    }
  };

  // Tính số ngày thực hiện
  const soNgayThucHien = useMemo(() => {
    if (!tuNgay || !denNgay) return 0;
    const d1 = new Date(tuNgay).getTime();
    const d2 = new Date(denNgay).getTime();
    if (isNaN(d1) || isNaN(d2)) return 0;
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }, [tuNgay, denNgay]);

  // Ảnh preview đại diện
  const previewImg = useMemo(() => {
    if (matchedLC?.dsMau && matchedLC.dsMau.length > 0) {
      const real = matchedLC.dsMau.find((m: any) => m.img && !m.img.includes("Phieu_Giao_Nhan"));
      if (real?.img) return real.img;
      if (matchedLC.dsMau[0]?.img) return matchedLC.dsMau[0].img;
    }
    if (maSP) {
      return `/product-models/${maSP}.png`;
    }
    if (editing?.dsMau && editing.dsMau.length > 0 && editing.dsMau[0]?.img) {
      return editing.dsMau[0].img;
    }
    if (matchedSP?.dsMau && matchedSP.dsMau[0]?.img) {
      return matchedSP.dsMau[0].img;
    }
    return null;
  }, [matchedLC, maSP, editing, matchedSP]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maKHSX.trim()) {
      alert("Vui lòng nhập Mã kế hoạch sản xuất");
      return;
    }
    if (!sanPham.trim()) {
      alert("Vui lòng nhập Tên sản phẩm");
      return;
    }
    if (soLuong <= 0) {
      alert("Số lượng kế hoạch phải lớn hơn 0");
      return;
    }

    onSave({
      maKHSX: maKHSX.trim(),
      maSP: maSP.trim() || undefined,
      sanPham: sanPham.trim(),
      tenSP: sanPham.trim(),
      loaiSP: loaiSP as LoaiSP,
      loai: (loaiSP.startsWith("Bo") ? "Bộ" : "Áo") as any,
      soLuong: Number(soLuong),
      daHoanThanh: Number(daHoanThanh || 0),
      tuNgay,
      denNgay,
      xuongPhuTrach: xuongPhuTrach || danhSachXuong[0] || "Tổ cắt",
      trangThai,
      ghiChu: ghiChu.trim() || undefined,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white flex items-center justify-between border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {editing ? "Sửa Kế Hoạch Sản Xuất" : "Tạo Kế Hoạch Sản Xuất Mới"}
                </h2>
                {editing && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                    {editing.trangThai}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {editing ? `Mã KHSX: ${editing.maKHSX}` : "Nhập đầy đủ thông tin để khởi tạo quy trình sản xuất"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY (SCROLLABLE) */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* BANNER TÓM TẮT SẢN PHẨM & ẢNH ĐẠI DIỆN */}
          <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex items-center gap-4">
            {/* Ảnh đại diện chữ nhật đứng 3:4 chuẩn thời trang */}
            <div 
              style={{ width: "68px", height: "90px", minWidth: "68px", maxWidth: "68px" }}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs shrink-0 flex items-center justify-center relative"
            >
              {previewImg ? (
                <img 
                  src={previewImg} 
                  alt={sanPham || "Sản phẩm"} 
                  className="w-full h-full object-cover object-top" 
                />
              ) : (
                <div className="text-center p-1 text-slate-300">
                  <Package className="w-6 h-6 mx-auto mb-0.5 opacity-40" />
                  <span className="text-[9px] font-bold uppercase tracking-wider block">CHƯA ẢNH</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/80">
                  {maKHSX || "KHSX-MỚI"}
                </span>
                {maSP && (
                  <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50/90 px-2 py-0.5 rounded border border-indigo-200/80">
                    Mã: {maSP}
                  </span>
                )}
                {matchedLC?.id && (
                  <span className="font-mono font-bold text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200/80 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> {matchedLC.id}
                  </span>
                )}
              </div>

              <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate" title={sanPham || "Tên sản phẩm"}>
                {sanPham || <span className="italic text-slate-400">Chưa nhập tên sản phẩm</span>}
              </div>

              <div className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-3 flex-wrap">
                <span>Loại: <b className="text-slate-700">{LOAI_SP_LABELS[loaiSP as LoaiSP] || loaiSP}</b></span>
                <span>•</span>
                <span>Kế hoạch: <b className="text-teal-700 font-mono">{soLuong.toLocaleString("vi-VN")} SP</b></span>
                <span>•</span>
                <span>Xưởng: <b className="text-slate-700">{xuongPhuTrach}</b></span>
              </div>
            </div>
          </div>

          {/* GRID FORM 2 CỘT CÂN ĐỐI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* CỘT 1: THÔNG TIN KẾ HOẠCH & SẢN PHẨM */}
            <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <TagIcon className="w-4 h-4 text-teal-600" />
                <span>1. Thông tin Sản phẩm & Kế hoạch</span>
              </div>

              {/* Mã Kế Hoạch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã kế hoạch <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={maKHSX}
                    onChange={(e) => setMaKHSX(e.target.value)}
                    placeholder="VD: KHSX-2026-M15"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Mã Sản Phẩm (Gợi ý từ danh mục) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mã sản phẩm (SKU)
                  </label>
                  <span className="text-[10px] text-teal-600 font-semibold">Tự động điền thông tin</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="ds-ma-sp-datalist"
                    value={maSP}
                    onChange={(e) => handleSelectMaSP(e.target.value)}
                    placeholder="Chọn hoặc nhập mã SP (VD: M15, TPJ-111...)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  />
                  <datalist id="ds-ma-sp-datalist">
                    {dsSanPham.map((s: any) => (
                      <option key={s.id || s.ma_sp} value={s.id || s.ma_sp}>
                        {s.tenSP}
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Tên Sản Phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={sanPham}
                  onChange={(e) => setSanPham(e.target.value)}
                  placeholder="VD: BỘ TRÒN PHỐI VAI-LÉ"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
                  required
                />
              </div>

              {/* Phân loại Sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phân loại sản phẩm
                </label>
                <div className="relative">
                  <select
                    value={loaiSP}
                    onChange={(e) => setLoaiSP(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer transition-all"
                  >
                    {LOAI_SP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CỘT 2: SỐ LƯỢNG, THỜI GIAN & PHÂN CÔNG */}
            <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>2. Số lượng, Thời gian & Phân công</span>
              </div>

              {/* Số Lượng Kế Hoạch & Đã Hoàn Thành */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    SL kế hoạch <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={soLuong}
                      onChange={(e) => setSoLuong(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all pr-8"
                      required
                    />
                    <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold pointer-events-none">SP</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đã hoàn thành
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={daHoanThanh}
                      onChange={(e) => setDaHoanThanh(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all pr-8"
                    />
                    <span className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold pointer-events-none">SP</span>
                  </div>
                </div>
              </div>

              {/* Thời Gian (Từ ngày → Đến ngày) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Từ ngày <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={tuNgay}
                    onChange={(e) => setTuNgay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Đến ngày <span className="text-rose-500">*</span>
                    </label>
                    {soNgayThucHien > 0 && (
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60">
                        {soNgayThucHien} ngày
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={denNgay}
                    onChange={(e) => setDenNgay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              {/* Xưởng Phụ Trách (Khắc phục triệt để lỗi -- Chọn --) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Xưởng phụ trách <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <select
                    value={xuongPhuTrach}
                    onChange={(e) => setXuongPhuTrach(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer transition-all truncate"
                    required
                  >
                    {danhSachXuong.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Trạng Thái Kế Hoạch */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trạng thái kế hoạch
                </label>
                <select
                  value={trangThai}
                  onChange={(e) => setTrangThai(e.target.value as TrangThaiKHSX)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 cursor-pointer transition-all"
                >
                  {TRANG_THAI_OPTIONS.map((tt) => (
                    <option key={tt} value={tt}>
                      {tt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GHI CHÚ KẾ HOẠCH */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú sản xuất & Lưu ý kỹ thuật</span>
            </label>
            <textarea
              rows={2}
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Nhập ghi chú kỹ thuật may, lưu ý phụ liệu hoặc yêu cầu giao hàng..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all resize-none"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editing ? "Lưu thay đổi KHSX" : "Tạo Kế Hoạch Sản Xuất"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TagIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
    </svg>
  );
}
