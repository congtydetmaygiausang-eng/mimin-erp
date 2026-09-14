"use client";

import { Building2, CheckCircle2, Layers3, ShieldCheck, Users } from "lucide-react";
import { useWorkspace, type DataScope, type WorkspaceRole } from "@/lib/workspace-context";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Chủ đơn vị", ADMIN: "Quản trị đơn vị", MANAGER: "Quản lý", ACCOUNTANT: "Kế toán",
  TEAM_LEAD: "Tổ trưởng", WORKER: "Nhân viên/Công nhân", DELIVERY: "Giao nhận", VIEWER: "Chỉ xem", CUSTOMER: "Khách hàng",
};
const SCOPE_LABELS: Record<DataScope, string> = {
  SELF: "Dữ liệu cá nhân", ASSIGNED: "Đơn được giao", TEAM: "Dữ liệu trong tổ", ORGANIZATION: "Toàn đơn vị", SYSTEM: "Toàn hệ thống",
};

export default function RoleWorkspacesPage() {
  const { workspaces, activeWorkspace, loading, selectWorkspace } = useWorkspace();
  return <div className="space-y-5 animate-fade-in">
    <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-900 p-6 text-white shadow-xl">
      <div className="flex items-center gap-3"><div className="rounded-2xl bg-white/10 p-3"><Layers3 className="h-7 w-7 text-violet-300" /></div><div><div className="text-xs font-bold text-violet-300">PHÂN QUYỀN ĐA ĐƠN VỊ</div><h1 className="text-2xl font-bold">Không gian làm việc của tài khoản</h1><p className="mt-1 text-sm text-slate-300">Mỗi đơn vị có dữ liệu, vai trò và phạm vi truy cập riêng.</p></div></div>
    </header>
    {loading ? <div className="card p-8 text-center text-sm text-slate-500">Đang tải quyền tài khoản...</div> : workspaces.length === 0 ? <div className="card p-10 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold">Tài khoản chưa thuộc đơn vị nào</h2><p className="mt-1 text-sm text-slate-500">Quản trị viên cần thêm tài khoản vào một workspace trước khi sử dụng dữ liệu.</p></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{workspaces.map((workspace) => {
      const active = workspace.id === activeWorkspace?.id;
      return <button key={workspace.id} type="button" onClick={() => selectWorkspace(workspace.id)} className={`card p-5 text-left transition ${active ? "ring-2 ring-violet-500" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
        <div className="flex items-start justify-between"><div className="rounded-xl bg-violet-100 p-2.5 text-violet-700 dark:bg-violet-950"><Building2 className="h-5 w-5" /></div>{active && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đang sử dụng</span>}</div>
        <h2 className="mt-4 font-bold">{workspace.name}</h2><div className="text-xs text-slate-500">{workspace.code} · {workspace.organizationType}</div>
        <div className="mt-4 space-y-2 text-sm"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-violet-500" /><span>{ROLE_LABELS[workspace.workspaceRole]}</span></div><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /><span>{SCOPE_LABELS[workspace.dataScope]}</span></div></div>
      </button>;
    })}</div>}
  </div>;
}
