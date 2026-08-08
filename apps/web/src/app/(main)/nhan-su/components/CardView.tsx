// ============ CARD VIEW + LIST VIEW ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { Phone, Calendar, Star, Edit2, Trash2, Wallet } from "lucide-react";
import { formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import type { NhanSuExt } from "../data";

export function CardView({ filtered, luongSPTheoNV, onShowDetail, onShowLuong, onEdit, onDelete }: { filtered: NhanSuExt[]; luongSPTheoNV: Record<string, number>; onShowDetail: (n: NhanSuExt) => void; onShowLuong: (n: NhanSuExt) => void; onEdit: (n: NhanSuExt) => void; onDelete: (n: NhanSuExt) => void }) {
  return (
    <EntityCardGrid cols={3}>
      {filtered.map((n) => {
        const luongSP = luongSPTheoNV[n.maNV] || 0;
        return (
          <EntityCard
            key={n.maNV}
            name={n.hoTen}
            avatarUrl={n.avatar}
            avatarSize="xl"
            rating={n.rating}
            badges={[
              { label: n.boPhan, bg: "bg-violet-500/15", color: "text-violet-700" },
              { label: n.chucVu, bg: "bg-sky-500/15", color: "text-sky-700" },
            ]}
            subtitle={<span className="font-mono text-[10px]">{n.maNV}</span>}
            stats={[
              { label: "SĐT", value: n.sdt, icon: Phone },
              { label: "Ngày vào", value: n.ngayVao, icon: Calendar },
              { label: "Lương cứng", value: formatVNDShort(n.luongCung || 0), color: "text-sky-600" },
              { label: "Lương SP", value: luongSP > 0 ? formatVNDShort(luongSP) : "—", color: "text-emerald-600" },
            ]}
            onView={() => onShowDetail(n)}
            onEdit={() => onEdit(n)}
            onDelete={() => onDelete(n)}
          />
        );
      })}
    </EntityCardGrid>
  );
}

export function ListView({ filtered, luongSPTheoNV, onShowDetail, onShowLuong, onEdit, onDelete }: { filtered: NhanSuExt[]; luongSPTheoNV: Record<string, number>; onShowDetail: (n: NhanSuExt) => void; onShowLuong: (n: NhanSuExt) => void; onEdit: (n: NhanSuExt) => void; onDelete: (n: NhanSuExt) => void }) {
  return (
    <EntityCardList>
      {filtered.map((n) => {
        const luongSP = luongSPTheoNV[n.maNV] || 0;
        return (
          <div key={n.maNV} className="card p-3 flex items-center gap-3">
            <Avatar name={n.hoTen} src={n.avatar} size="md" />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onShowDetail(n)}>
              <div className="font-semibold text-sm hover:text-teal-600 transition">{n.hoTen}</div>
              <div className="text-[10px] opacity-60 flex items-center gap-2">
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
              <div className="text-[10px] opacity-60">Cứng: {formatVNDShort(n.luongCung || 0)}</div>
              <div className="text-[10px] text-emerald-600">SP: +{formatVNDShort(luongSP)}</div>
            </div>
            <div className="text-right border-l pl-3" style={{ borderColor: "var(--border)" }}>
              <div className="text-[10px] opacity-60">Đánh giá</div>
              <div className="text-sm font-bold text-amber-600 flex items-center gap-0.5 justify-end">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {n.rating}
              </div>
            </div>
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
