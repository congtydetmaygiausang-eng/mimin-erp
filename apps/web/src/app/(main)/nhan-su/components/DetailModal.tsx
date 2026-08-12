// ============ CHI TIET NHAN SU MODAL ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { useState, useEffect } from "react";
import { X, Phone, Mail, Calendar, Star, Edit2, Wallet } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import type { NhanSuExt } from "../data";
import { ImagePreviewModal } from "./ImagePreviewModal";

export function ChiTietNhanSuModal({ nv, luongSP, onClose, onEdit, onLuong }: { nv: NhanSuExt; luongSP: number; onClose: () => void; onEdit: () => void; onLuong: () => void }) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-[96%] max-w-2xl sm:max-w-3xl rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">{nv.maNV}</span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Hồ sơ Nhân sự Chi tiết</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 border border-teal-500/20">
          <div className="cursor-pointer" onClick={() => (nv.avatar ? setPreviewImage(nv.avatar) : null)}>
            <Avatar name={nv.hoTen} src={nv.avatar} size="2xl" className="border-4 border-white dark:border-slate-800 shadow-xl" />
          </div>
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{nv.hoTen}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700">{nv.boPhan}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700">{nv.chucVu}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-teal-600" /> {nv.sdt || "Chưa có SĐT"}</span>
              {nv.facebookUrl && (
                <a
                  href={nv.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-white bg-[#1877F2] hover:bg-[#145dbf]"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                  Facebook
                </a>
              )}
              {nv.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-sky-600" /> {nv.email}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 opacity-60" /> Ngày vào: {nv.ngayVao || "—"}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin Cá nhân</div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Giới tính:</span> <span className="font-medium">{nv.gioiTinh || "Nam"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Ngày sinh:</span> <span className="font-medium">{nv.ngaySinh || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Số CCCD:</span> <span className="font-mono font-medium">{nv.cccd || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Thường trú:</span> <span className="font-medium text-right max-w-[200px] truncate" title={nv.diaChiTT}>{nv.diaChiTT || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="opacity-70">Tạm trú:</span> <span className="font-medium text-right max-w-[200px] truncate" title={nv.diaChiTamTru}>{nv.diaChiTamTru || "—"}</span></div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thu nhập & Đánh giá</div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Lương cơ bản:</span> <span className="font-bold text-sky-600">{formatVNDShort(nv.luongCB || 0)}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Lương Sản phẩm:</span> <span className="font-bold text-emerald-600">{formatVNDShort(luongSP)}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Đơn giá SP:</span> <span className="font-medium text-right max-w-[200px] truncate" title={nv.donGiaSP}>{nv.donGiaSP || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Tài khoản NH:</span> <span className="font-mono font-medium text-right max-w-[200px] truncate">{nv.soTK ? `${nv.soTK} - ${nv.nganHang}` : "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Đánh giá sếp:</span> <span className="font-bold text-amber-500 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400" /> {nv.rating || 4}/5</span></div>
            <div className="flex justify-between py-1"><span className="opacity-70">Ghi chú:</span> <span className="font-medium text-right max-w-[200px] truncate" title={nv.ghiChu}>{nv.ghiChu || "—"}</span></div>
          </div>
        </div>

        {(nv.cccdFrontImage || nv.cccdBackImage) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nv.cccdFrontImage && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">CCCD mặt trước</div>
                <img src={nv.cccdFrontImage} alt="CCCD mặt trước" className="h-36 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setPreviewImage(nv.cccdFrontImage || null)} />
              </div>
            )}
            {nv.cccdBackImage && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">CCCD mặt sau</div>
                <img src={nv.cccdBackImage} alt="CCCD mặt sau" className="h-36 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setPreviewImage(nv.cccdBackImage || null)} />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
            Đóng
          </button>
          <button onClick={onLuong} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20">
            <Wallet className="w-4 h-4" /> Bảng lương chi tiết
          </button>
          <button onClick={onEdit} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/20">
            <Edit2 className="w-4 h-4" /> Sửa thông tin
          </button>
        </div>
      </div>
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
