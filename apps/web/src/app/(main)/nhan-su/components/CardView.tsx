// ============ CARD VIEW + LIST VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Phone, Calendar, Star, Edit2, Trash2, Wallet, UserCheck, UserX, Users } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import type { NhanSuExt } from "../data";

export function CardView({
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
  if (filtered.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
          Không tìm thấy nhân viên nào phù hợp
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bấm nút &quot;Đặt lại&quot; ở bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <EntityCardGrid cols={4}>
      {filtered.map((n) => {
        const luongSP = luongSPTheoNV[n.maNV] || 0;
        const isNghiViec = n.trangThai === "nghi_viec";
        return (
          <EntityCard
            key={n.maNV}
            onClick={() => onShowDetail(n)}
            name={n.hoTen}
            avatarUrl={n.avatar}
            avatarSize="xl"
            contactPhone={n.sdt || undefined}
            rating={n.rating}
            className={isNghiViec ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/25 dark:bg-rose-950/10 opacity-85" : ""}
            titleAccessory={
              isNghiViec ? (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0">
                  Đã nghỉ
                </span>
              ) : undefined
            }
            badges={[
              { label: n.boPhan, bg: "bg-violet-500/15", color: "text-violet-700" },
              { label: n.chucVu, bg: "bg-sky-500/15", color: "text-sky-700" },
              isNghiViec
                ? { label: "⛔ Đã nghỉ việc", bg: "bg-rose-500/15 border border-rose-300 dark:border-rose-800", color: "text-rose-700 dark:text-rose-300" }
                : { label: "Đang làm việc", bg: "bg-emerald-500/15", color: "text-emerald-700" },
            ]}
            subtitle={<span className="font-mono text-[10px]">{n.maNV}</span>}
            stats={[
              { label: "SĐT", value: n.sdt, icon: Phone },
              { label: "Ngày vào", value: n.ngayVao, icon: Calendar },
              { label: "Lương cơ bản", value: formatVNDShort(n.luongCB || n.luongCung || 0), color: "text-sky-600" },
              { label: "Lương SP", value: luongSP > 0 ? formatVNDShort(luongSP) : (n.donGiaSP ? "Có bảng giá" : "—"), color: "text-emerald-600" },
            ]}
            actions={
              onToggleTrangThai && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTrangThai(n);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs font-semibold hover:bg-white/40 dark:hover:bg-white/5 flex items-center gap-1.5 ${
                    isNghiViec ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isNghiViec ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                  {isNghiViec ? "Đi làm lại" : "Đã nghỉ việc"}
                </button>
              )
            }
            onView={() => onShowDetail(n)}
            onEdit={() => onEdit(n)}
            onDelete={() => onDelete(n)}
          />
        );
      })}
    </EntityCardGrid>
  );
}

export function ListView({
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
  if (filtered.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center shadow-sm">
        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
          Không tìm thấy nhân viên nào phù hợp
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Hãy thử điều chỉnh lại từ khóa tìm kiếm hoặc bấm nút &quot;Đặt lại&quot; ở bộ lọc.
        </p>
      </div>
    );
  }

  return (
    <EntityCardList>
      {filtered.map((n) => {
        const luongSP = luongSPTheoNV[n.maNV] || 0;
        const isNghiViec = n.trangThai === "nghi_viec";
        return (
          <div
            key={n.maNV}
            className={`card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition ${
              isNghiViec ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 opacity-85" : ""
            }`}
            onClick={() => onShowDetail(n)}
          >
            <Avatar name={n.hoTen} src={n.avatar} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm hover:text-teal-600 transition">{n.hoTen}</span>
                {isNghiViec ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300">
                    Đã nghỉ việc
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Đang làm
                  </span>
                )}
              </div>
              <div className="text-[10px] opacity-60 flex items-center gap-2 mt-0.5">
                <span className="font-mono">{n.maNV}</span>
                <span>·</span>
                <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700">{n.boPhan}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {n.sdt}</span>
                {n.facebookUrl && (
                  <a
                    href={n.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1877F2] hover:scale-110 transition"
                    title="Mở Facebook"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
                  </a>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-60">Cơ bản: {formatVNDShort(n.luongCB || n.luongCung || 0)}</div>
              <div className="text-[10px] text-emerald-600">SP: {luongSP > 0 ? `+${formatVNDShort(luongSP)}` : (n.donGiaSP ? "Có bảng giá" : "—")}</div>
            </div>
            <div className="text-right border-l pl-3" style={{ borderColor: "var(--border)" }}>
              <div className="text-[10px] opacity-60">Đánh giá</div>
              <div className="text-sm font-bold text-amber-600 flex items-center gap-0.5 justify-end">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {n.rating}
              </div>
            </div>
            {onToggleTrangThai && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleTrangThai(n);
                }}
                className={`p-1.5 rounded text-[11px] font-semibold border ${
                  isNghiViec
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                }`}
                title={isNghiViec ? "Kích hoạt đi làm lại" : "Đánh dấu đã nghỉ việc"}
              >
                {isNghiViec ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => onShowDetail(n)} className="p-1.5 rounded hover:bg-white/40 text-teal-600 font-xs font-semibold">Xem</button>
            <button onClick={() => onShowLuong(n)} className="p-1.5 rounded hover:bg-white/40 text-emerald-600"><Wallet className="w-4 h-4" /></button>
            <button onClick={() => onEdit(n)} className="p-1.5 rounded hover:bg-white/40 text-sky-600"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => onDelete(n)} className="p-1.5 rounded hover:bg-white/40 text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        );
      })}
    </EntityCardList>
  );
}
