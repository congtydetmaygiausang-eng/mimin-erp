"use client";

import { useState, useEffect } from "react";
import {
  Eye, Plus, Edit, Trash2, Check, X, Lock, Unlock,
  User, LogIn, ChevronRight, AlertCircle, Award, Users,
} from "lucide-react";
import { Shield } from "lucide-react";

import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  getFullMatrix, canView, canCreate, canEdit, canDelete, getAccessibleModules,
  ROLE_LABELS, MODULE_LABELS, ALL_ROLES, ALL_MODULES,
  type Role, type Module,
} from "@/lib/permissions";
import { DEMO_USERS } from "@/lib/supabase/client";

const ACTION_META: Record<string, { label: string; icon: any; color: string; letter: string }> = {
  r: { label: "Xem", icon: Eye, color: "blue", letter: "R" },
  c: { label: "Tạo", icon: Plus, color: "emerald", letter: "C" },
  u: { label: "Sửa", icon: Edit, color: "amber", letter: "U" },
  d: { label: "Xóa", icon: Trash2, color: "rose", letter: "D" },
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Toàn quyền - Quản lý tất cả 30 module",
  planner: "Chuyên viên kế hoạch - Tạo lệnh cắt, KH, đơn hàng",
  warehouse: "Quản lý kho - CRUD kho, xem các phần liên quan",
  sewing: "Tổ trưởng may - Quản lý tổ may, chấm công",
  qc: "Kiểm tra chất lượng - CRUD QC, xem SX",
  finishing: "Tổ trưởng hoàn thiện - Hoàn thiện, giao hàng",
  accountant: "Kế toán - Bảng lương, công nợ, NCC, báo cáo",
  content: "Content / Media - CRUD danh mục SP, xem marketing",
  partner: "Đối tác gia công - CHỈ thấy phiếu giao cho mình (20 NCC)",
};

export default function PhanQuenCuaToiPage() {
  const { user, signOut } = useSession();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [view, setView] = useState<"me" | "matrix" | "users">("me");

  const myRole = (user?.role || "admin") as Role;
  const roleToShow = selectedRole || myRole;

  return (
    <div className="max-w-6xl mx-auto space-y-3 animate-fade-in p-3">
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7 text-blue-500" /> Phân quyền của tôi
        </h1>
        <p className="opacity-70 text-sm">
          Xem quyền hiện tại · Ma trận 9 role × 30 module · Đổi role để test
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "me", label: "Của tôi", icon: User },
          { key: "matrix", label: "Ma trận", icon: Shield },
          { key: "users", label: "Demo Users", icon: Users },
        ].map((t: any) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setView(t.key as any)} className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              view === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
            }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* View: Của tôi */}
      {view === "me" && (
        <div className="space-y-3">
          {/* User info card */}
          <div className="card p-4 bg-gradient-to-br from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div>
                <div className="font-bold text-lg">{user?.name || "Chưa đăng nhập"}</div>
                <div className="text-sm opacity-70">{user?.email || "—"}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white bg-gradient-to-r from-rose-500 to-pink-500 font-bold">
                    {ROLE_LABELS[myRole] || myRole}
                  </span>
                  <span className="text-[10px] opacity-60">{user?.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat n={getAccessibleModules(myRole).length} label="Modules truy cập" sub={`/ ${ALL_MODULES.length}`} color="blue" />
            <Stat n={countPerms(myRole, "r")} label="Quyền Xem" sub="view" color="emerald" />
            <Stat n={countPerms(myRole, "c")} label="Quyền Tạo" sub="create" color="amber" />
            <Stat n={countPerms(myRole, "u") + countPerms(myRole, "d")} label="Sửa/Xóa" sub="update/delete" color="rose" />
          </div>

          {/* Chi tiết quyền theo module */}
          <div className="card p-3">
            <h3 className="font-bold text-sm mb-2">📋 Quyền chi tiết theo module</h3>
            <div className="space-y-1">
              {ALL_MODULES.map((mod) => {
                const perms = getMyPerms(myRole, mod);
                const canAccess = perms.length > 0;
                return (
                  <div key={mod} className={`flex items-center justify-between p-2 rounded ${
                    canAccess ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-slate-50 dark:bg-slate-800/30 opacity-50"
                  }`}>
                    <div className="flex items-center gap-2">
                      {canAccess ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      <span className="text-xs font-semibold">{MODULE_LABELS[mod]}</span>
                    </div>
                    <div className="flex gap-1">
                      {["r", "c", "u", "d"].map((act) => {
                        const has = perms.includes(act as any);
                        const meta = ACTION_META[act];
                        return (
                          <span key={act} className={`text-[10px] w-6 h-6 rounded flex items-center justify-center font-bold ${
                            has ? `bg-${meta.color}-500 text-white` : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                          }`}>
                            {meta.letter}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-[10px] opacity-60 flex flex-wrap gap-3">
              <span><span className="font-bold text-blue-600">R</span> = Xem</span>
              <span><span className="font-bold text-emerald-600">C</span> = Tạo</span>
              <span><span className="font-bold text-amber-600">U</span> = Sửa</span>
              <span><span className="font-bold text-rose-600">D</span> = Xóa</span>
            </div>
          </div>
        </div>
      )}

      {/* View: Ma trận */}
      {view === "matrix" && (
        <div className="card p-3">
          <h3 className="font-bold text-sm mb-2">🛡️ Ma trận 9 Role × 30 Module × 4 Action</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="p-1.5 text-left sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">Module</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r} className="p-1.5 text-center" title={ROLE_DESCRIPTIONS[r]}>
                      <div className="font-bold">{ROLE_LABELS[r]}</div>
                      <div className="text-[8px] opacity-60 mt-0.5">R C U D</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_MODULES.map((mod) => (
                  <tr key={mod} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="p-1.5 font-semibold sticky left-0 bg-white dark:bg-slate-900 z-10">
                      {MODULE_LABELS[mod]}
                    </td>
                    {ALL_ROLES.map((r) => {
                      const perms = getMyPerms(r, mod);
                      return (
                        <td key={r} className="p-1.5 text-center">
                          {["r", "c", "u", "d"].map((act) => {
                            const has = perms.includes(act as any);
                            const meta = ACTION_META[act];
                            return (
                              <span key={act} className={`inline-block w-4 h-4 mx-0.5 rounded text-[8px] font-bold leading-4 ${
                                has ? `bg-${meta.color}-500 text-white` : "bg-slate-100 dark:bg-slate-800 text-slate-300"
                              }`}>
                                {has ? meta.letter : "·"}
                              </span>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] opacity-60 flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> R - Xem (read)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> C - Tạo (create)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> U - Sửa (update)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500"></span> D - Xóa (delete)</span>
          </div>
        </div>
      )}

      {/* View: Demo users */}
      {view === "users" && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm">👥 Tài khoản nội bộ (19 users thật)</h3>
          <div className="text-[10px] opacity-60">
            Đã xoá 7 tài khoản test (2026-08-01). Hiện chỉ dùng 19 tài khoản nội bộ thật.
            Xem chi tiết tại <code>/cai-dat</code> hoặc trang Login.
          </div>
          <div className="text-xs opacity-60 text-center mt-3 p-3 card">
            💡 Tất cả tài khoản đều là nhân viên thật của MIMIN (sang, giau, thanh, huyen, vy, hau + 13 công nhân).
            <br />
            Mật khẩu mặc định: <code>&lt;username&gt;123</code> (vd: <code>sang123</code>, <code>giau123</code>)
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, sub, color }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-2xl font-bold">{n}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}

function getMyPerms(role: Role, mod: Module): string[] {
  const r = getFullMatrix()[role];
  if (!r) return [];
  const perms = r[mod] || "";
  return ["r", "c", "u", "d"].filter((a) => perms.includes(a));
}

function countPerms(role: Role, action: string): number {
  const r = getFullMatrix()[role];
  if (!r) return 0;
  return Object.values(r).filter((p) => p.includes(action)).length;
}
