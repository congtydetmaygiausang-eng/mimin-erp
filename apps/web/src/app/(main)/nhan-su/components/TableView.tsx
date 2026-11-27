// ============ TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Phone, Calendar, Mail, Star, Edit2, Trash2, Wallet, UserCheck, UserX } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import type { NhanSuExt } from "../data";

export function TableView({
  filtered,
  luongSPTheoNV,
  onShowDetail,
  onShowLuong,
  onEdit,
  onDelete,
  onToggleTrangThai,
}: {
  filtered: NhanSuExt[];
  luongSPTheoNV: Record<string, number>;
  onShowDetail: (n: NhanSuExt) => void;
  onShowLuong: (n: NhanSuExt) => void;
  onEdit: (n: NhanSuExt) => void;
  onDelete: (n: NhanSuExt) => void;
  onToggleTrangThai?: (n: NhanSuExt) => void;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Mã NV</th>
              <th className="p-3">Họ tên</th>
              <th className="p-3">Bộ phận</th>
              <th className="p-3">Chức vụ</th>
              <th className="p-3">SĐT</th>
              <th className="p-3">Ngày vào</th>
              <th className="p-3 text-right">Lương cơ bản</th>
              <th className="p-3 text-right">Lương SP</th>
              <th className="p-3 text-center">Đánh giá</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => {
              const luongSP = luongSPTheoNV[n.maNV] || 0;
              const isNghiViec = n.trangThai === "nghi_viec";
              return (
                <tr
                  key={n.maNV}
                  className={`border-b last:border-0 ${
                    isNghiViec
                      ? "bg-rose-50/25 dark:bg-rose-950/10 hover:bg-rose-50/40 opacity-85"
                      : "hover:bg-white/30 dark:hover:bg-white/5"
                  }`}
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="p-3 font-mono text-xs opacity-70">{n.maNV}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onShowDetail(n)}>
                      <Avatar name={n.hoTen} src={n.avatar} size="sm" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{n.hoTen}</span>
                          {isNghiViec ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300">
                              Đã nghỉ việc
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Đang làm
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] opacity-60 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" /> {n.email?.slice(0, 18)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 text-[10px]">{n.boPhan}</span>
                  </td>
                  <td className="p-3 text-xs">{n.chucVu || "—"}</td>
                  <td className="p-3 text-xs">
                    <div className="flex items-center gap-1">
                      <a href={`tel:${n.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <Phone className="w-3 h-3" /> {n.sdt}
                      </a>
                      {n.facebookUrl && (
                        <a
                          href={n.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-0.5 p-1 rounded text-[#1877F2] hover:bg-blue-50"
                          title="Mở Facebook"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {n.ngayVao}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">{formatVNDShort(n.luongCB || n.luongCung || 0)}</td>
                  <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                    {luongSP > 0 ? formatVNDShort(luongSP) : (n.donGiaSP ? "Có bảng giá" : "—")}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-3 h-3 ${star <= (n.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => onShowDetail(n)} className="text-[10px] px-2 py-1 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 font-semibold">
                        Xem
                      </button>
                      <button onClick={() => onShowLuong(n)} className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" title="Bảng lương">
                        <Wallet className="w-3 h-3" />
                      </button>
                      {onToggleTrangThai && (
                        <button
                          onClick={() => onToggleTrangThai(n)}
                          className={`text-[10px] px-1.5 py-1 rounded border ${
                            isNghiViec
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
                          }`}
                          title={isNghiViec ? "Kích hoạt đi làm lại" : "Đánh dấu đã nghỉ việc"}
                        >
                          {isNghiViec ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        </button>
                      )}
                      <button onClick={() => onEdit(n)} className="text-[10px] px-1.5 py-1 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25" title="Sửa">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(n)} className="text-[10px] px-1.5 py-1 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25" title="Xóa">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-2 p-2 bg-slate-50">
        {filtered.map((n) => {
          const luongSP = luongSPTheoNV[n.maNV] || 0;
          const isNghiViec = n.trangThai === "nghi_viec";
          return (
            <div key={n.maNV} className={`bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2 relative ${isNghiViec ? "border-rose-200 bg-rose-50/20 opacity-85" : ""}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => onShowDetail(n)}>
                  <Avatar name={n.hoTen} src={n.avatar} size="md" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-teal-700">{n.hoTen}</span>
                      {isNghiViec && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 border border-rose-200">
                          Đã nghỉ việc
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <span className="font-mono">{n.maNV}</span> • <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 font-medium">{n.boPhan}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-[11px] mt-1">
                {n.sdt && (
                  <a href={`tel:${n.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                    <Phone className="w-3 h-3" /> {n.sdt}
                  </a>
                )}
                {n.chucVu && (
                  <div className="flex items-center gap-1 text-slate-600">
                    <span className="opacity-70">Chức vụ:</span> {n.chucVu}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg mt-1">
                <div>
                  <span className="text-slate-500 block">Lương cơ bản</span>
                  <span className="font-semibold text-slate-700">{formatVNDShort(n.luongCB || n.luongCung || 0)}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Lương SP</span>
                  <span className="font-bold text-emerald-600">{luongSP > 0 ? formatVNDShort(luongSP) : (n.donGiaSP ? "Có bảng giá" : "—")}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-[11px] font-medium ml-0.5">{n.rating || 0}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onShowLuong(n)} className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 font-semibold flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Lương
                  </button>
                  {onToggleTrangThai && (
                    <button
                      onClick={() => onToggleTrangThai(n)}
                      className={`p-1.5 rounded border ${
                        isNghiViec
                          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                          : "bg-rose-50 text-rose-700 border-rose-300"
                      }`}
                      title={isNghiViec ? "Kích hoạt đi làm lại" : "Đánh dấu đã nghỉ việc"}
                    >
                      {isNghiViec ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button onClick={() => onEdit(n)} className="p-1.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => onDelete(n)} className="p-1.5 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-sm">Không tìm thấy nhân sự nào.</div>
        )}
      </div>
    </div>
  );
}
