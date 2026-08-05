// ============ TABLE VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Phone, Calendar, Mail, Star, Edit2, Trash2, Wallet } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import type { NhanSuExt } from "../data";

export function TableView({ filtered, luongSPTheoNV, onShowDetail, onShowLuong, onEdit, onDelete }: { filtered: NhanSuExt[]; luongSPTheoNV: Record<string, number>; onShowDetail: (n: NhanSuExt) => void; onShowLuong: (n: NhanSuExt) => void; onEdit: (n: NhanSuExt) => void; onDelete: (n: NhanSuExt) => void }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Mã NV</th>
              <th className="p-3">Họ tên</th>
              <th className="p-3">Bộ phận</th>
              <th className="p-3">Chức vụ</th>
              <th className="p-3">SĐT</th>
              <th className="p-3">Ngày vào</th>
              <th className="p-3 text-right">Lương cứng</th>
              <th className="p-3 text-right">Lương SP</th>
              <th className="p-3 text-center">Đánh giá</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((n) => {
              const luongSP = luongSPTheoNV[n.maNV] || 0;
              return (
                <tr key={n.maNV} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs opacity-70">{n.maNV}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onShowDetail(n)}>
                      <Avatar name={n.hoTen} src={n.avatar} size="sm" />
                      <div>
                        <div className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{n.hoTen}</div>
                        <div className="text-[10px] opacity-60 flex items-center gap-1">
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
                    <a href={`tel:${n.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                      <Phone className="w-3 h-3" /> {n.sdt}
                    </a>
                  </td>
                  <td className="p-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {n.ngayVao}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono">{formatVNDShort(n.luongCung || 0)}</td>
                  <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                    {luongSP > 0 ? formatVNDShort(luongSP) : "—"}
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
                      <button onClick={() => onEdit(n)} className="text-[10px] px-1.5 py-1 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(n)} className="text-[10px] px-1.5 py-1 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25">
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
    </div>
  );
}
