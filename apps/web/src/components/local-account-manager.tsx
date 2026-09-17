"use client";

import { useState } from "react";
import { Plus, Pencil, Link2, RefreshCw } from "lucide-react";
import { CrudModal, type FieldDef } from "./ui/CrudModal";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";
import { localActiveAccount, readLocalAccounts, saveLocalAccount, useLocalAccountRevision } from "@/lib/local-account-store";
import type { AccountAccess, AccountKind, AccountScope } from "@/lib/data/account-access";
import { useAccountDirectory } from "@/lib/use-account-directory";

export const ACCOUNT_SCOPE_LABELS: Record<AccountScope, string> = { ASSIGNED: "Chỉ việc được giao", TEAM: "Việc của tổ quản lý", DEPARTMENT: "Việc của bộ phận quản lý", COMPANY: "Toàn công ty (theo quyền)" };
export function LocalAccountManager() {
  useLocalAccountRevision();
  const { sources, loading, error, refresh } = useAccountDirectory(Boolean(localActiveAccount()?.roles.includes("admin")));
  const [editing, setEditing] = useState<AccountAccess | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AccountKind | "all">("all");
  const accounts = readLocalAccounts();
  if (!localActiveAccount()?.roles.includes("admin")) return <div className="card p-6">Chỉ quản trị viên được quản lý liên kết tài khoản.</div>;
  const blank = (): AccountAccess => ({ id: `TK-${crypto.randomUUID()}`, name: "", email: "", roles: [], kind: "employee", employeeCode: "", partnerCode: "", supplierCode: "", department: "", team: "", scope: "ASSIGNED", active: true });
  const sourceLabels: Record<AccountKind, string> = { employee: "Nhân sự", partner: "Đối tác", supplier: "Nhà cung cấp" };
  const codeOf = (account: AccountAccess) => account.kind === "employee" ? account.employeeCode : account.kind === "partner" ? account.partnerCode : account.supplierCode;
  const rows = Array.from(new Map(sources.filter(source => source.code).map(source => [`${source.kind}:${source.code}`, source])).values()).flatMap(source => {
    const linked = accounts.filter(account => account.kind === source.kind && codeOf(account) === source.code);
    return (linked.length ? linked : [null]).map(account => ({ source, account }));
  });
  const visibleRows = rows.filter(({ source, account }) => (sourceFilter === "all" || source.kind === sourceFilter) && `${source.name} ${source.code} ${source.email} ${account?.email || ""}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")));
  const openSource = (row: typeof rows[number]) => setEditing(row.account ? { ...row.account, name: row.source.name } : {
    ...blank(), name: row.source.name, email: row.source.email, kind: row.source.kind, department: row.source.department,
    employeeCode: row.source.kind === "employee" ? row.source.code : "",
    partnerCode: row.source.kind === "partner" ? row.source.code : "",
    supplierCode: row.source.kind === "supplier" ? row.source.code : "",
    roles: row.source.kind === "employee" ? [] : [row.source.kind],
  });
  const optionsFor = (kind: AccountKind) => sources.filter(item => item.kind === kind).map(item => ({ value: item.code, label: `${item.code} · ${item.name}` }));
  const fields: FieldDef[] = [
    { name: "name", label: "Tên theo hồ sơ nguồn", type: "text", readOnly: true },
    { name: "email", label: "Email tài khoản", type: "email", required: true },
    { name: "kind", label: "Loại tài khoản", type: "select", required: true, disabled: true, options: [{ value: "employee", label: "Nhân viên nội bộ" }, { value: "partner", label: "Đối tác gia công" }, { value: "supplier", label: "Nhà cung cấp" }] },
    { name: "employeeCode", label: "Liên kết nhân viên (nội bộ)", type: "select", options: optionsFor("employee"), disabled: values => values.kind !== "employee" },
    { name: "partnerCode", label: "Đối tác gia công", type: "select", options: optionsFor("partner"), disabled: values => values.kind !== "partner" },
    { name: "supplierCode", label: "Nhà cung cấp", type: "select", options: optionsFor("supplier"), disabled: values => values.kind !== "supplier" },
    { name: "roles", label: "Vai trò theo bảng phân quyền (có thể kiêm nhiệm)", type: "checkbox-group", required: true, options: ALL_ROLES.filter(role => editing?.kind === "employee" ? !["partner", "supplier", "workshop_customer", "buyer_customer"].includes(role) : role === editing?.kind).map(role => ({ value: role, label: ROLE_LABELS[role] })) },
    { name: "department", label: "Bộ phận quản lý", type: "text", placeholder: "VD: san-xuat, ke-toan, mua-hang" },
    { name: "team", label: "Mã tổ quản lý", type: "text", placeholder: "VD: CAT-01, MAY-02" },
    { name: "scope", label: "Phạm vi dữ liệu", type: "select", required: true, disabled: editing?.kind !== "employee", options: Object.entries(ACCOUNT_SCOPE_LABELS).map(([value, label]) => ({ value, label })) },
    { name: "active", label: "Trạng thái", type: "select", options: [{ value: "true", label: "Hoạt động" }, { value: "false", label: "Tạm khóa" }] },
  ];
  return <div className="space-y-5">
    <header className="rounded-2xl border border-white/40 bg-white/20 p-5 shadow-sm backdrop-blur-xl dark:border-white/15 dark:bg-white/5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/40 bg-white/30 text-cyan-950 dark:border-white/15 dark:bg-white/10 dark:text-cyan-200">
            <Link2 size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Quản lý tài khoản</h1>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Cấp tài khoản và phân quyền cho nhân sự, đối tác, nhà cung cấp.</p>
          </div>
        </div>
        <button type="button" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/50 bg-white/30 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" disabled={loading} onClick={() => { setEditing(null); void refresh(); }}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
          {loading ? "Đang tải…" : "Làm mới"}
        </button>
      </div>
    </header>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}. Vui lòng kiểm tra kết nối và quyền truy cập Supabase, rồi thử lại.</p>}
    <input aria-label="Tìm tài khoản" className="input w-full" placeholder="Tìm tên, email, mã liên kết…" value={search} onChange={event => setSearch(event.target.value)} />
    <div className="flex flex-wrap gap-2">{(["all", "employee", "partner", "supplier"] as const).map(kind => <button key={kind} onClick={() => setSourceFilter(kind)} className={`rounded px-3 py-2 text-sm ${sourceFilter === kind ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>{kind === "all" ? "Tất cả" : sourceLabels[kind]} ({rows.filter(row => kind === "all" || row.source.kind === kind).length})</button>)}</div>
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Nguồn / Mã</th><th className="p-3">Họ tên / Đơn vị</th><th className="p-3">Email tài khoản</th><th className="p-3">Vai trò</th><th className="p-3">Trạng thái</th><th className="p-3">Thao tác</th></tr></thead><tbody>{visibleRows.map(row => <tr key={`${row.source.kind}:${row.source.code}:${row.account?.id || "new"}`} className="border-b"><td className="p-3">{sourceLabels[row.source.kind]}<div className="text-xs text-slate-500">{row.source.code}</div></td><td className="p-3 font-medium">{row.source.name}</td><td className="p-3">{row.account?.email || row.source.email || "Chưa có email"}</td><td className="p-3">{row.account?.roles.map(role => ROLE_LABELS[role]).join(", ") || "Chưa phân quyền"}</td><td className="p-3">{!row.account ? "Chưa có tài khoản" : row.account.active ? "Hoạt động" : "Tạm khóa"}</td><td className="p-3"><button className="flex items-center gap-1 text-blue-600" onClick={() => openSource(row)}>{row.account ? <Pencil size={16} /> : <Plus size={16} />}{row.account ? "Phân quyền" : "Cấp tài khoản"}</button></td></tr>)}</tbody></table>{!visibleRows.length && <p className="p-6 text-center text-slate-500">Không có hồ sơ phù hợp.</p>}</div>
    {editing && <CrudModal open title="Liên kết tài khoản" fields={fields.filter(field => editing.kind === "employee" || !["department", "team"].includes(field.name))} maxWidth="3xl" onClose={() => setEditing(null)} initial={{ ...editing, scope: editing.kind === "employee" ? editing.scope : "ASSIGNED", roles: editing.roles.join(","), active: String(editing.active) }} onSubmit={values => {
      const code = values.kind === "employee" ? values.employeeCode : values.kind === "partner" ? values.partnerCode : values.supplierCode;
      const source = sources.find(item => item.kind === values.kind && item.code === code);
      if (!source) throw new Error("Vui lòng chọn hồ sơ có trong Nhân sự, Đối tác hoặc Nhà cung cấp");
      saveLocalAccount({ id: editing.id, name: source.name, email: values.email.trim(), kind: values.kind as AccountKind,
        roles: values.roles.split(",") as Role[], employeeCode: values.kind === "employee" ? values.employeeCode.trim() : "",
        partnerCode: values.kind === "partner" ? values.partnerCode.trim() : "", supplierCode: values.kind === "supplier" ? values.supplierCode.trim() : "",
        department: values.department.trim(), team: values.team.trim(), scope: values.scope as AccountScope, active: values.active === "true" });
    }} />}
  </div>;
}
