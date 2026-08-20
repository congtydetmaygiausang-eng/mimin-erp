"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { USERS } from "@/lib/users";
import { ROLE_LABELS, ROLE_COLORS, type Role } from "@/lib/permissions";
import { ChevronDown, UserCog, Check, Shield } from "lucide-react";

export function RoleSwitcher() {
  const { user, authSource, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Chỉ hiển thị trong DEMO mode
  if (authSource !== "demo") return null;

  // Trước đây tự đăng nhập bằng mật khẩu thật đọc từ lib/users.ts (đã bị bundle
  // xuống client). Giờ chỉ đăng xuất + chuyển sang /login kèm email điền sẵn -
  // người test vẫn phải tự gõ mật khẩu, không còn mật khẩu nào nằm trong bundle.
  const switchTo = async (email: string) => {
    await signOut();
    setOpen(false);
    router.push(`/login?email=${encodeURIComponent(email)}`);
  };

  const currentRole = (user?.role || "admin") as Role;
  const gradient = ROLE_COLORS[currentRole] || "from-slate-500 to-slate-700";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/30 dark:bg-white/5 hover:bg-white/50 text-xs font-medium border border-brand-200/30"
        title="Đổi role demo"
      >
        <Shield className="w-3.5 h-3.5 text-brand-600" />
        <span className="hidden sm:inline">Demo Role</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 card shadow-2xl z-50 py-2 animate-fade-in">
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold flex items-center gap-1">
              <UserCog className="w-3.5 h-3.5" /> Đổi role để test phân quyền
            </div>
            <div className="text-[10px] opacity-60 mt-0.5">Mỗi role thấy menu + quyền khác nhau</div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {USERS.map((u) => {
              const role = u.role as Role;
              const isActive = user?.email === u.email;
              return (
                <button
                  key={u.email}
                  onClick={() => switchTo(u.email)}
                  className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-white/40 dark:hover:bg-white/5 text-left ${
                    isActive ? "bg-brand-500/10" : ""
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${ROLE_COLORS[role] || "from-slate-500 to-slate-700"} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {u.name.split(" ").slice(-1)[0]?.[0] || u.email[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{u.name}</div>
                    <div className="text-[10px] opacity-60 truncate">{ROLE_LABELS[role] || u.role}</div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function RoleBanner() {
  const { user, authSource } = useSession();
  if (authSource !== "demo" || !user) return null;
  const role = (user.role || "admin") as Role;
  const gradient = ROLE_COLORS[role] || "from-slate-500 to-slate-700";
  return (
    <div className={`bg-gradient-to-r ${gradient} text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-sm`}>
      <Shield className="w-3.5 h-3.5" />
      <span>
        🛡️ Đang đăng nhập với quyền: <b>{ROLE_LABELS[role] || role}</b>
        <span className="opacity-80 hidden sm:inline"> — {user.name} ({user.email})</span>
      </span>
    </div>
  );
}
