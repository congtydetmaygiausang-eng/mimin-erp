"use client";

import { useState } from "react";
import { Plus, Pencil, Link2, RefreshCw, KeyRound, CheckCircle2, Lock, Copy, Check, Shield } from "lucide-react";
import { CrudModal, type FieldDef } from "./ui/CrudModal";
import { ALL_ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";
import { localActiveAccount, readLocalAccounts, saveLocalAccount, useLocalAccountRevision } from "@/lib/local-account-store";
import type { AccountAccess, AccountKind, AccountScope, AccountDirectoryEntry } from "@/lib/data/account-access";
import { useAccountDirectory } from "@/lib/use-account-directory";
import { toast } from "sonner";

export const ACCOUNT_SCOPE_LABELS: Record<AccountScope, string> = {
  ASSIGNED: "Chỉ việc được giao",
  TEAM: "Việc của tổ quản lý",
  DEPARTMENT: "Việc của bộ phận quản lý",
  COMPANY: "Toàn công ty (theo quyền)",
};

/** Tự động gợi ý email chuẩn khi chưa có email sẵn */
function suggestEmail(source: AccountDirectoryEntry): string {
  if (source.email && source.email.includes("@")) return source.email.trim().toLowerCase();
  const cleanCode = source.code.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (source.kind === "employee") {
    // Chuyển "Nguyễn Thị Mỹ Nhi" -> "nhi.nguyen@mimin.vn"
    const parts = source.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[parts.length - 1]}.${parts[0]}@mimin.vn`;
    }
    return `${cleanCode}@mimin.vn`;
  }

  if (source.kind === "partner") {
    return `${cleanCode}.gc@mimin.vn`;
  }

  return `${cleanCode}.ncc@mimin.vn`;
}

export function LocalAccountManager() {
  useLocalAccountRevision();
  const { sources, loading, error, refresh } = useAccountDirectory(Boolean(localActiveAccount()?.roles.includes("admin")));
  const [editing, setEditing] = useState<AccountAccess | null>(null);
  const [resetModal, setResetModal] = useState<{ name: string; email: string; pass: string; copied: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<AccountKind | "all">("all");
  const accounts = readLocalAccounts();

  if (!localActiveAccount()?.roles.includes("admin")) {
    return <div className="card p-6">Chỉ quản trị viên được quản lý liên kết tài khoản.</div>;
  }

  const blank = (): AccountAccess => ({
    id: `TK-${crypto.randomUUID()}`,
    name: "",
    email: "",
    roles: [],
    kind: "employee",
    employeeCode: "",
    partnerCode: "",
    supplierCode: "",
    department: "",
    team: "",
    scope: "ASSIGNED",
    active: true,
  });

  const sourceLabels: Record<AccountKind, string> = { employee: "Nhân sự", partner: "Đối tác gia công", supplier: "Nhà cung cấp" };
  const codeOf = (account: AccountAccess) => (account.kind === "employee" ? account.employeeCode : account.kind === "partner" ? account.partnerCode : account.supplierCode);

  const rows = Array.from(new Map(sources.filter((source) => source.code).map((source) => [`${source.kind}:${source.code}`, source])).values()).flatMap((source) => {
    const linked = accounts.filter((account) => account.kind === source.kind && codeOf(account) === source.code);
    return (linked.length ? linked : [null]).map((account) => ({ source, account }));
  });

  const visibleRows = rows.filter(
    ({ source, account }) =>
      (sourceFilter === "all" || source.kind === sourceFilter) &&
      `${source.name} ${source.code} ${source.email} ${account?.email || ""}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi"))
  );

  const openSource = (row: (typeof rows)[number]) => {
    const emailToUse = row.account?.email || row.source.email || suggestEmail(row.source);
    setEditing(
      row.account
        ? { ...row.account, name: row.source.name, email: emailToUse }
        : {
            ...blank(),
            name: row.source.name,
            email: emailToUse,
            kind: row.source.kind,
            department: row.source.department,
            employeeCode: row.source.kind === "employee" ? row.source.code : "",
            partnerCode: row.source.kind === "partner" ? row.source.code : "",
            supplierCode: row.source.kind === "supplier" ? row.source.code : "",
            roles: row.source.kind === "employee" ? [] : [row.source.kind as Role],
          }
    );
  };

  const handleToggleActive = (account: AccountAccess) => {
    try {
      saveLocalAccount({ ...account, active: !account.active });
      toast.success(account.active ? `Đã tạm khóa tài khoản ${account.name}` : `Đã kích hoạt tài khoản ${account.name}`);
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  const handleResetPassword = (account: AccountAccess) => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newPass = `Mimin@${randomDigits}`;
    setResetModal({ name: account.name, email: account.email, pass: newPass, copied: false });
    navigator.clipboard.writeText(newPass).catch(() => {});
    toast.success(`Đã tạo mật khẩu mới: ${newPass} (Đã copy vào bộ nhớ tạm)`);
  };

  const optionsFor = (kind: AccountKind) => sources.filter((item) => item.kind === kind).map((item) => ({ value: item.code, label: `${item.code} · ${item.name}` }));

  const fields: FieldDef[] = [
    { name: "name", label: "Tên theo hồ sơ nguồn", type: "text", readOnly: true },
    { name: "email", label: "Email tài khoản (Tự động gợi ý)", type: "email", required: true },
    {
      name: "kind",
      label: "Loại tài khoản",
      type: "select",
      required: true,
      disabled: true,
      options: [
        { value: "employee", label: "Nhân viên nội bộ" },
        { value: "partner", label: "Đối tác gia công" },
        { value: "supplier", label: "Nhà cung cấp" },
      ],
    },
    { name: "employeeCode", label: "Liên kết nhân viên (nội bộ)", type: "select", options: optionsFor("employee"), disabled: (values) => values.kind !== "employee" },
    { name: "partnerCode", label: "Đối tác gia công", type: "select", options: optionsFor("partner"), disabled: (values) => values.kind !== "partner" },
    { name: "supplierCode", label: "Nhà cung cấp", type: "select", options: optionsFor("supplier"), disabled: (values) => values.kind !== "supplier" },
    {
      name: "roles",
      label: "Vai trò theo bảng phân quyền (có thể kiêm nhiệm)",
      type: "checkbox-group",
      required: true,
      options: ALL_ROLES.filter((role) => (editing?.kind === "employee" ? !["partner", "supplier", "workshop_customer", "buyer_customer"].includes(role) : role === editing?.kind)).map((role) => ({
        value: role,
        label: ROLE_LABELS[role],
      })),
    },
    { name: "department", label: "Bộ phận / Ngành nghề quản lý", type: "text", placeholder: "VD: May áo trụ, In - Dập, Kho..." },
    { name: "team", label: "Mã tổ quản lý", type: "text", placeholder: "VD: CAT-01, MAY-02" },
    {
      name: "scope",
      label: "Phạm vi dữ liệu",
      type: "select",
      required: true,
      disabled: editing?.kind !== "employee",
      options: Object.entries(ACCOUNT_SCOPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: "active",
      label: "Trạng thái",
      type: "select",
      options: [
        { value: "true", label: "Hoạt động" },
        { value: "false", label: "Tạm khóa" },
      ],
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-emerald-500/10 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Link2 size={22} aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Quản lý tài khoản</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Cấp tài khoản và phân quyền cho Nhân sự ({sources.filter(s => s.kind === "employee").length}), Đối tác gia công ({sources.filter(s => s.kind === "partner").length}), Nhà cung cấp ({sources.filter(s => s.kind === "supplier").length}).
              </p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            disabled={loading}
            onClick={() => {
              setEditing(null);
              void refresh();
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}. Vui lòng kiểm tra kết nối Supabase và thử lại.</p>}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          aria-label="Tìm tài khoản"
          className="input flex-1"
          placeholder="Tìm tên xưởng, nhân viên, email, mã liên kết…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {(["all", "employee", "partner", "supplier"] as const).map((kind) => (
            <button
              key={kind}
              onClick={() => setSourceFilter(kind)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                sourceFilter === kind ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {kind === "all" ? "Tất cả" : sourceLabels[kind]} ({rows.filter((row) => kind === "all" || row.source.kind === kind).length})
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto shadow-sm border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <th className="p-3.5">Nguồn / Mã</th>
              <th className="p-3.5">Họ tên / Đơn vị</th>
              <th className="p-3.5">Email đăng nhập</th>
              <th className="p-3.5">Vai trò & Phạm vi</th>
              <th className="p-3.5 text-center">Trạng thái</th>
              <th className="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.map((row) => (
              <tr key={`${row.source.kind}:${row.source.code}:${row.account?.id || "new"}`} className="hover:bg-slate-50/70 transition">
                <td className="p-3.5">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-0.5">
                    {sourceLabels[row.source.kind]}
                  </span>
                  <div className="text-xs font-mono font-bold text-blue-600">{row.source.code}</div>
                </td>
                <td className="p-3.5">
                  <div className="font-bold text-slate-800">{row.source.name}</div>
                  {row.source.department && <div className="text-xs text-slate-500 mt-0.5">{row.source.department}</div>}
                </td>
                <td className="p-3.5">
                  {row.account?.email ? (
                    <span className="font-mono text-xs text-slate-800 font-semibold">{row.account.email}</span>
                  ) : (
                    <span className="italic text-xs text-slate-400">Chưa cấp tài khoản</span>
                  )}
                </td>
                <td className="p-3.5">
                  {row.account?.roles.length ? (
                    <div className="flex flex-wrap gap-1 items-center">
                      {row.account.roles.map((role) => (
                        <span key={role} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {ROLE_LABELS[role] || role}
                        </span>
                      ))}
                      {row.account.kind === "employee" && (
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({ACCOUNT_SCOPE_LABELS[row.account.scope] || row.account.scope})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Chưa phân quyền</span>
                  )}
                </td>
                <td className="p-3.5 text-center">
                  {!row.account ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                      Chưa kích hoạt
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleToggleActive(row.account!)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition ${
                        row.account.active
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                      }`}
                      title="Bấm để đổi trạng thái khóa/mở khóa"
                    >
                      {row.account.active ? <CheckCircle2 size={13} /> : <Lock size={13} />}
                      {row.account.active ? "Hoạt động" : "Tạm khóa"}
                    </button>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold transition shadow-sm ${
                        row.account
                          ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                      onClick={() => openSource(row)}
                    >
                      {row.account ? <Pencil size={13} /> : <Plus size={13} />}
                      {row.account ? "Phân quyền" : "Cấp tài khoản"}
                    </button>
                    {row.account && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition shadow-sm"
                        onClick={() => handleResetPassword(row.account!)}
                        title="Đặt lại mật khẩu cho tài khoản này"
                      >
                        <KeyRound size={13} />
                        Đặt lại MK
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRows.length && <p className="p-8 text-center text-slate-500 text-sm">Không tìm thấy hồ sơ nào phù hợp.</p>}
      </div>

      {/* Edit / Cấp tài khoản Modal */}
      {editing && (
        <CrudModal
          open
          title={editing.roles.length ? `Phân quyền tài khoản: ${editing.name}` : `Cấp tài khoản cho: ${editing.name}`}
          fields={fields.filter((field) => editing.kind === "employee" || !["department", "team"].includes(field.name))}
          maxWidth="3xl"
          onClose={() => setEditing(null)}
          initial={{
            ...editing,
            scope: editing.kind === "employee" ? editing.scope : "ASSIGNED",
            roles: editing.roles.join(","),
            active: String(editing.active),
          }}
          onSubmit={(values) => {
            const code = values.kind === "employee" ? values.employeeCode : values.kind === "partner" ? values.partnerCode : values.supplierCode;
            const source = sources.find((item) => item.kind === values.kind && item.code === code);
            if (!source) throw new Error("Vui lòng chọn hồ sơ có trong Nhân sự, Đối tác hoặc Nhà cung cấp");
            saveLocalAccount({
              id: editing.id,
              name: source.name,
              email: values.email.trim(),
              kind: values.kind as AccountKind,
              roles: (values.roles ? values.roles.split(",") : []) as Role[],
              employeeCode: values.kind === "employee" ? values.employeeCode.trim() : "",
              partnerCode: values.kind === "partner" ? values.partnerCode.trim() : "",
              supplierCode: values.kind === "supplier" ? values.supplierCode.trim() : "",
              department: values.department ? values.department.trim() : "",
              team: values.team ? values.team.trim() : "",
              scope: values.scope as AccountScope,
              active: values.active === "true",
            });
            toast.success(`Đã lưu tài khoản ${source.name} thành công!`);
          }}
        />
      )}

      {/* Modal hiển thị mật khẩu vừa đặt lại */}
      {resetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setResetModal(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Đặt lại mật khẩu thành công</h3>
                <p className="text-xs text-slate-500">{resetModal.name} · {resetModal.email}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs text-slate-500 font-semibold">Mật khẩu mới tạm thời:</div>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="font-mono text-base font-black text-blue-700 tracking-wider select-all">{resetModal.pass}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resetModal.pass).catch(() => {});
                    setResetModal({ ...resetModal, copied: true });
                    toast.success("Đã copy mật khẩu vào bộ nhớ tạm!");
                  }}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition"
                >
                  {resetModal.copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {resetModal.copied ? "Đã copy" : "Copy"}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Vui lòng gửi thông tin này cho người dùng và nhắc họ đổi mật khẩu sau lần đăng nhập đầu tiên.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setResetModal(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
