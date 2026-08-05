"use client";

import { useState } from "react";
import { Factory } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { ROLES, type Role } from "./data";
import { KhoSoiWorkspace, XuongDetWorkspace, XuongNhuomWorkspace, KhoTPWorkspace, QCWorkspace, KeToanWorkspace, AdminWorkspace } from "./components/Workspaces";

export default function RoleWorkspacesPage() {
  const { user } = useSession();
  const [role, setRole] = useState<Role>("admin");

  return (
    <div className="max-w-7xl mx-auto space-y-3 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Factory className="w-7 h-7 text-blue-500" /> Workspaces theo Role
        </h1>
        <p className="opacity-70 text-sm">
          Mỗi role 1 giao diện riêng. 1 mẻ sợi (LSOI) → nhiều lệnh dệt → gộp lô mộc → 1 mẻ nhuộm nhiều màu → QC tổng hợp
        </p>
      </div>

      {/* Role switcher */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setRole(r.key)}
              className={`card p-3 text-left transition ${
                role === r.key ? `ring-2 ring-${r.color}-500 bg-${r.color}-500/10` : "hover:scale-105"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${r.color}-500 text-white mb-2`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm">{r.label}</div>
              <div className="text-[10px] opacity-60 leading-tight">{r.moTa}</div>
            </button>
          );
        })}
      </div>

      {role === "kho-soi" && <KhoSoiWorkspace user={user} />}
      {role === "xuong-det" && <XuongDetWorkspace user={user} />}
      {role === "xuong-nhuom" && <XuongNhuomWorkspace user={user} />}
      {role === "kho-tp" && <KhoTPWorkspace user={user} />}
      {role === "qc" && <QCWorkspace user={user} />}
      {role === "ke-toan" && <KeToanWorkspace />}
      {role === "admin" && <AdminWorkspace />}
    </div>
  );
}
