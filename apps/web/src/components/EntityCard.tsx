"use client";

import { ReactNode } from "react";
import { Avatar } from "./Avatar";
import { MoreVertical, Star, Phone, Mail, MapPin, Edit2, Trash2, Eye, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";

type StatItem = {
  label: string;
  value: ReactNode;
  color?: string;
  icon?: any;
};

type BadgeItem = {
  label: string;
  color?: string;
  bg?: string;
};

export function EntityCard({
  name,
  subtitle,
  avatarSize = "lg",
  badges = [],
  stats = [],
  rating,
  status,
  actions = [],
  onClick,
  onEdit,
  onDelete,
  onView,
  className = "",
  footer,
  meta,
  highlight,
  warning,
  children,
}: {
  name: string;
  subtitle?: ReactNode;
  avatarSize?: "md" | "lg" | "xl" | "2xl";
  badges?: BadgeItem[];
  stats?: StatItem[];
  rating?: number;
  status?: { label: string; color: string; bg: string };
  actions?: ReactNode;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  footer?: ReactNode;
  meta?: ReactNode;
  highlight?: boolean;
  warning?: boolean;
  children?: ReactNode;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onClick}
      className={`card p-4 transition hover:shadow-xl hover:-translate-y-0.5 ${onClick ? "cursor-pointer" : ""} ${
        highlight ? "ring-2 ring-amber-500/50" : ""
      } ${warning ? "ring-2 ring-red-500/30 bg-red-500/5" : ""} ${className}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={name} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate text-sm">{name}</h3>
            {rating !== undefined && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3 h-3 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                  />
                ))}
              </div>
            )}
          </div>
          {subtitle && <div className="text-xs opacity-70 mt-0.5 truncate">{subtitle}</div>}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {badges.map((b, i) => (
                <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${b.bg || "bg-brand-500/15"} ${b.color || "text-brand-700"}`}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {(onEdit || onDelete || onView || actions) && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/5"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-36 card shadow-xl z-50 py-1 animate-fade-in">
                  {onView && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onView(); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/40 flex items-center gap-2">
                      <Eye className="w-3 h-3" /> Xem chi tiết
                    </button>
                  )}
                  {onEdit && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/40 flex items-center gap-2">
                      <Edit2 className="w-3 h-3" /> Sửa
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete(); }} className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/40 text-red-600 flex items-center gap-2">
                      <Trash2 className="w-3 h-3" /> Xoá
                    </button>
                  )}
                  {actions}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className="mb-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>
      )}

      {/* Stats grid */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white/30 dark:bg-white/5 rounded p-2">
                <div className="text-[10px] opacity-60 flex items-center gap-1">
                  {Icon && <Icon className="w-3 h-3" />}
                  {s.label}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${s.color || ""}`}>{s.value}</div>
              </div>
            );
          })}
        </div>
      )}

      {children}

      {meta && <div className="text-[10px] opacity-60 mb-2">{meta}</div>}

      {footer && (
        <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          {footer}
        </div>
      )}

      {onClick && (
        <ChevronRight className="w-4 h-4 absolute bottom-3 right-3 opacity-30" />
      )}
    </div>
  );
}

export function EntityCardGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const gridClass = {
    2: "grid md:grid-cols-2 gap-3",
    3: "grid md:grid-cols-2 lg:grid-cols-3 gap-3",
    4: "grid md:grid-cols-2 lg:grid-cols-4 gap-3",
  }[cols];
  return <div className={gridClass}>{children}</div>;
}

export function EntityCardList({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}
