"use client";
import { useState } from "react";
import { ShieldCheck, Users, LogIn, ChevronRight, User, Building2, Tag } from "lucide-react";
import Link from "next/link";
import { USERS, type UserAccount } from "@/lib/users";
import { CONG_NHAN_13 } from "@/lib/congnhan-13";
import { USER_ACCOUNTS_SECURE } from "@/lib/user-accounts-secure";

export default function TestPhanQuyenPage() {
  const [selected, setSelected] = useState<UserAccount | null>(null);

  const allUsers = [
    ...USERS,
    ...CONG_NHAN_13,
  ].filter((u, i, arr) => arr.findIndex((x) => x.email === u.email) === i);

  const nhomQuanLy = allUsers.filter((u: any) => u.nhom && !u.laCongNhan);
  const nhomSX = allUsers.filter((u: any) => u.laCongNhan);
  const mockLegacy = USER_ACCOUNTS_SECURE.filter((u: any) => !USERS.find((d) => d.email === u.email) && !CONG_NHAN_13.find((c) => c.email === u.email));

  const handleLogin = (email: string, password: string) => {
    localStorage.setItem("mimin_erp_session", JSON.stringify({
      id: email.split("@")[0],
      email,
      name: email.split("@")[0],
      role: "sewing",
    }));
    window.location.href = "/dashboard/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/30 p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> MIMIN OS · Test phân quyền</div>
          <h1 className="text-2xl md:text-3xl font-bold">🧪 Test nhanh 32 User</h1>
          <p className="text-sm opacity-95 mt-1">Click bất kỳ user nào để login nhanh. Mỗi user có role + modules khác nhau.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{nhomQuanLy.length}</div><div className="opacity-90">Quản lý</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{nhomSX.length}</div><div className="opacity-90">Công nhân</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{mockLegacy.length}</div><div className="opacity-90">Mock</div></div>
          </div>
        </div>

        {nhomQuanLy.length > 0 && (
          <Group title="👔 Nhóm Quản lý (6 user)" users={nhomQuanLy} color="violet" onLogin={handleLogin} />
        )}

        {nhomSX.length > 0 && (
          <>
            <Group title="✂️ Nhóm Cắt (3 user)" users={nhomSX.filter((u: any) => u.module === "cat")} color="sky" onLogin={handleLogin} />
            <Group title="🪡 Nhóm Khuy nút (2 user)" users={nhomSX.filter((u: any) => u.module === "khuy-nut")} color="amber" onLogin={handleLogin} />
            <Group title="👔 Nhóm Ủi (4 user)" users={nhomSX.filter((u: any) => u.module === "ui")} color="rose" onLogin={handleLogin} />
            <Group title="📦 Nhóm Đóng gói (4 user)" users={nhomSX.filter((u: any) => u.module === "dong-goi")} color="violet" onLogin={handleLogin} />
          </>
        )}

        {mockLegacy.length > 0 && (
          <Group title="🧪 Mock Legacy (7 user)" users={mockLegacy} color="slate" onLogin={handleLogin} />
        )}

        <Link href="/login/" className="card p-3 text-center text-sm text-blue-600 hover:bg-blue-50">
          📋 Đến trang login đầy đủ →
        </Link>
      </div>
    </div>
  );
}

function Group({ title, users, color, onLogin }: { title: string; users: any[]; color: string; onLogin: (e: string, p: string) => void }) {
  return (
    <div className="card p-4">
      <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-600" /> {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {users.map((u: any) => (
          <button
            key={u.email}
            onClick={() => onLogin(u.email, u.password || "123")}
            className="text-left p-3 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-lg flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 text-white flex items-center justify-center font-bold`}>
              {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{u.name || u.email}</div>
              <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{u.chucVu || u.title || "Nhân viên"} • {u.maNV || u.phongBan || ""}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
