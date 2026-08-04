"use client";

// ============ USER PROFILE MODAL ============
// Hien thi ho so chi tiet cua 1 user
// 2026-08-04 - Mavis
//
// Features:
//   - Avatar lon + Ten + Role badge
//   - 3 sections: Thong tin / Luong & Quyen / Hoat dong
//   - Background glassmorphism

import { X, Users, Mail, Phone, Building2, Key, Briefcase, Calendar, Activity, Award, TrendingUp, Edit, Lock, Unlock } from "lucide-react";
import { type UserAccount as SimpleAccount } from "@/lib/user-accounts";
import { USERS, type UserAccount } from "@/lib/users";
import { PHONG_BAN_LABELS, PHONG_BAN_COLORS } from "@/lib/user-accounts";
import { ROLE_LABELS } from "@/lib/permissions";
import { formatVND } from "@/lib/data/real-data";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";

interface Props {
  open: boolean;
  onClose: () => void;
  account: SimpleAccount | null;
  onEdit?: (a: SimpleAccount) => void;
  onToggleLock?: (id: string) => void;
}

const MODULE_SX_LABELS: Record<string, string> = {
  "cat": "✂️ Cắt vải",
  "intd": "🎨 In/Thêu/Dập",
  "may": "🧵 May",
  "khuy-nut": "🔘 Khuy nút",
  "ui": "♨️ Ủi/Đóng gói",
  "dong-goi": "📦 Đóng gói",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-rose-500",
  planner: "bg-blue-500",
  warehouse: "bg-amber-500",
  sewing: "bg-sky-500",
  qc: "bg-emerald-500",
  finishing: "bg-violet-500",
  accountant: "bg-cyan-500",
};

export default function UserProfileModal({ open, onClose, account, onEdit, onToggleLock }: Props) {
  if (!open || !account) return null;

  // Find full UserAccount from USERS (id is email-based)
  const fullAccount: UserAccount | undefined = USERS.find((u) => u.email === account.email || u.id === account.id);
  const displayName = fullAccount?.name || account.name;
  const displayChucVu = fullAccount?.chucVu || account.chucVu;
  const isCongNhan = fullAccount?.laCongNhan ?? false;
  const moduleLabel = fullAccount?.module ? MODULE_SX_LABELS[fullAccount.module] || fullAccount.module : null;
  const nhanVienInfo = fullAccount?.maNV ? REAL_NHAN_VIEN.find((nv) => nv.ma === fullAccount.maNV) : undefined;

  const roleColor = ROLE_COLORS[account.role] || "bg-blue-500";
  const phongBanColor = PHONG_BAN_COLORS[account.phongBan] || "bg-slate-500";

  // Generate avatar gradient based on name
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
  const avatarHue = (displayName.charCodeAt(0) * 7) % 360;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden flex flex-col border-4 border-white animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER - Gradient + Avatar */}
        <div
          className="relative h-40 flex items-end px-6 pb-4"
          style={{
            background: `linear-gradient(135deg, hsl(${avatarHue}, 60%, 45%) 0%, hsl(${(avatarHue + 40) % 360}, 70%, 55%) 100%)`,
          }}
        >
          {/* Decorative blur orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
          <div className="absolute top-4 right-12 w-24 h-24 rounded-full opacity-15" style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Action buttons */}
          <div className="absolute top-3 left-3 flex gap-2 z-10">
            {onEdit && (
              <button
                onClick={() => onEdit(account)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm"
                title="Sửa"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onToggleLock && (
              <button
                onClick={() => onToggleLock(account.id)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors backdrop-blur-sm"
                title={account.trangThai === "active" ? "Khóa TK" : "Mở khóa"}
              >
                {account.trangThai === "active" ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6 z-10">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-2xl border-4 border-white"
              style={{
                background: `linear-gradient(135deg, hsl(${avatarHue}, 70%, 50%) 0%, hsl(${(avatarHue + 60) % 360}, 80%, 60%) 100%)`,
              }}
            >
              {initials}
            </div>
          </div>
        </div>

        {/* Name + Role */}
        <div className="pt-14 px-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {displayName}
                {account.trangThai === "disabled" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Đã khóa
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-mono">{account.id} · {account.maNV || fullAccount?.maNV}</p>
              <p className="text-sm text-slate-600 mt-0.5">{displayChucVu}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span className={`text-xs px-3 py-1 rounded-full text-white font-bold uppercase tracking-wide ${roleColor}`}>
                {ROLE_LABELS[account.role as keyof typeof ROLE_LABELS] || (account.role as string)}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full text-white font-bold ${phongBanColor}`}>
                {PHONG_BAN_LABELS[account.phongBan]}
              </span>
            </div>
          </div>
        </div>

        {/* BODY - 3 sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Section 1: Thông tin liên hệ */}
          <Section title="📋 Thông tin liên hệ" icon={Users}>
            <InfoRow icon={Mail} label="Email" value={account.email} mono />
            {(account.sdt || fullAccount?.sdt) && <InfoRow icon={Phone} label="Số điện thoại" value={account.sdt || fullAccount?.sdt || ""} />}
            <InfoRow icon={Building2} label="Bộ phận" value={PHONG_BAN_LABELS[account.phongBan]} badge={phongBanColor} />
            {fullAccount?.nhom && <InfoRow icon={Briefcase} label="Nhóm" value={fullAccount.nhom} />}
            {fullAccount?.donVi && <InfoRow icon={Award} label="Đơn vị" value={fullAccount.donVi} />}
          </Section>

          {/* Section 2: Lương & Quyền */}
          <Section title="💰 Lương & Quyền hạn" icon={Award}>
            {isCongNhan ? (
              <>
                <InfoRow
                  icon={TrendingUp}
                  label="Loại lương"
                  value="Lương sản phẩm (theo đơn giá)"
                  badge="bg-emerald-500"
                />
                {fullAccount?.donGia && (
                  <InfoRow
                    icon={TrendingUp}
                    label="Đơn giá"
                    value={`${formatVND(fullAccount.donGia)} / ${fullAccount.donVi || "sản phẩm"}`}
                    highlight
                  />
                )}
                {moduleLabel && (
                  <InfoRow
                    icon={Briefcase}
                    label="Module sản xuất"
                    value={moduleLabel}
                    badge="bg-blue-500"
                  />
                )}
                {nhanVienInfo && (
                  <InfoRow
                    icon={Key}
                    label="Chi tiết đơn giá"
                    value={nhanVienInfo.ghiChu}
                  />
                )}
              </>
            ) : (
              <>
                <InfoRow
                  icon={Award}
                  label="Loại lương"
                  value="Lương cứng (theo tháng)"
                  badge="bg-blue-500"
                />
                {fullAccount?.donGia && (
                  <InfoRow
                    icon={TrendingUp}
                    label="Lương cứng"
                    value={`${formatVND(fullAccount.donGia)} / tháng`}
                    highlight
                  />
                )}
                {fullAccount?.donVi && (
                  <InfoRow icon={Briefcase} label="Đơn vị" value={fullAccount.donVi} />
                )}
              </>
            )}
          </Section>

          {/* Section 3: Hoạt động */}
          <Section title="📊 Hoạt động" icon={Activity}>
            <InfoRow icon={Calendar} label="Ngày tạo TK" value={account.ngayTao} />
            {account.lanDangNhapCuoi && (
              <InfoRow icon={Activity} label="Đăng nhập cuối" value={new Date(account.lanDangNhapCuoi).toLocaleString("vi-VN")} />
            )}
            {fullAccount?.loginCount !== undefined && (
              <InfoRow
                icon={TrendingUp}
                label="Tổng lượt đăng nhập"
                value={`${fullAccount.loginCount} lần`}
                highlight
              />
            )}
            {fullAccount?.lastLogin && (
              <InfoRow
                icon={Activity}
                label="Lần cuối online"
                value={new Date(fullAccount.lastLogin).toLocaleString("vi-VN")}
              />
            )}
            {account.trangThai === "active" ? (
              <InfoRow icon={Activity} label="Trạng thái" value="🟢 Đang hoạt động" />
            ) : (
              <InfoRow icon={Lock} label="Trạng thái" value="🔒 Đã bị khóa" />
            )}
          </Section>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Sub-components ============

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200">
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, mono, highlight, badge }: { icon: any; label: string; value: string; mono?: boolean; highlight?: boolean; badge?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <Icon className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-32 shrink-0">{label}</span>
      {badge ? (
        <span className={`text-xs px-2 py-0.5 rounded-full text-white font-semibold ${badge}`}>{value}</span>
      ) : (
        <span className={`text-sm ${mono ? "font-mono" : "font-medium"} ${highlight ? "text-emerald-700 font-bold" : "text-slate-800"} break-all`}>{value}</span>
      )}
    </div>
  );
}
