"use client";

import { Settings, Users, Shield, Database, KeyRound, AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { can, ROLE_LABELS, ALL_ROLES, ALL_MODULES, MODULE_LABELS, ROLE_COLORS, getFullMatrix, type Role, type Module } from "@/lib/permissions";
import { DEMO_USERS } from "@/lib/supabase/client"; // Xoá 2026-08-01 - dùng USERS
import { USERS } from "@/lib/users";
import { Avatar } from "@/components/Avatar";

export default function Page() {
  const { user } = useSession();
  const isAdmin = user?.role === "admin";
  const matrix = getFullMatrix();

  if (!isAdmin) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-500" />
          <h1 className="text-2xl md:text-3xl font-bold">Cài đặt</h1>
        </div>
        <div className="card p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Quyền quản trị</h2>
          <p className="text-sm opacity-70">
            Trang Cài đặt chỉ dành cho <b>Quản trị viên</b>. Bạn đang đăng nhập với vai trò: <b>{user?.title}</b>
          </p>
        </div>
      </div>
    );
  }

  const actionLabels: Record<string, string> = { r: "Xem", c: "Tạo", u: "Sửa", d: "Xoá" };
  const actionColors: Record<string, string> = {
    r: "bg-sky-500/20 text-sky-700",
    c: "bg-emerald-500/20 text-emerald-700",
    u: "bg-amber-500/20 text-amber-700",
    d: "bg-red-500/20 text-red-700",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-500" /> Cài đặt hệ thống
        </h1>
        <p className="opacity-70 mt-1 text-sm">Cấu hình phân quyền · {ALL_ROLES.length} vai trò · {ALL_MODULES.length} module · {USERS.length} tài khoản nội bộ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tài khoản nội bộ</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{USERS.length}</div>
          <div className="text-xs opacity-60 mt-1">tài khoản thật</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Shield className="w-3 h-3" /> Vai trò</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{ALL_ROLES.length}</div>
          <div className="text-xs opacity-60 mt-1">roles</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Database className="w-3 h-3" /> Modules</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{ALL_MODULES.length}</div>
          <div className="text-xs opacity-60 mt-1">chức năng</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><KeyRound className="w-3 h-3" /> Tổng quyền</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">
            {Object.values(matrix).reduce((sum, rolePerms) => sum + Object.values(rolePerms).reduce((s, p) => s + p.length, 0), 0)}
          </div>
          <div className="text-xs opacity-60 mt-1">cấp quyền</div>
        </div>
      </div>

      {/* Tài khoản nội bộ */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-500" /> Tài khoản nội bộ ({USERS.length} người - click để đăng nhập nhanh)
          </h3>
        </div>
        <div className="p-4 grid md:grid-cols-2 gap-3">
          {USERS.map((u) => {
            const role = u.role as Role;
            return (
              <div key={u.email} className="card p-3 flex items-center gap-3 hover:shadow-lg transition">
                <Avatar name={u.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{u.name}</div>
                  <div className="text-[10px] opacity-70 font-mono">{u.email}</div>
                  <div className="text-xs mt-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-gradient-to-r ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} text-white`}>
                      {ROLE_LABELS[role] || u.role}
                    </span>
                    {u.maNV && <span className="text-[10px] opacity-60 ml-2">Mã: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{u.maNV}</code></span>}
                  </div>
                </div>
                {user?.email === u.email && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3 h-3 inline" /> Đang đăng nhập
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-violet-500" /> Ma trận phân quyền
          </h3>
          <p className="text-xs opacity-60 mt-1">r=Xem · c=Tạo · u=Sửa · d=Xoá</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-2 sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10">Module</th>
                {ALL_ROLES.map((r) => (
                  <th key={r} className="p-2 text-center">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ROLE_COLORS[r]} flex items-center justify-center text-white font-bold text-[10px] mx-auto mb-1`}>
                      {r[0].toUpperCase()}
                    </div>
                    <div className="text-[10px] opacity-80 whitespace-nowrap">{ROLE_LABELS[r].split(" ").slice(-1)[0]}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_MODULES.map((m) => (
                <tr key={m} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 sticky left-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur z-10 font-medium">
                    {MODULE_LABELS[m]}
                  </td>
                  {ALL_ROLES.map((r) => {
                    const perms = matrix[r][m] || "";
                    return (
                      <td key={r} className="p-2 text-center">
                        <div className="flex gap-0.5 justify-center flex-wrap">
                          {perms.split("").map((p) => (
                            <span
                              key={p}
                              className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center ${actionColors[p] || "bg-slate-200 text-slate-600"}`}
                              title={actionLabels[p]}
                            >
                              {p.toUpperCase()}
                            </span>
                          ))}
                          {perms === "" && <span className="text-[10px] opacity-30">—</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
