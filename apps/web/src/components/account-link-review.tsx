"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CrudModal } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { authFetch } from "@/lib/auth-fetch";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { ALL_MODULES, ALL_ROLES, MODULE_LABELS, ROLE_LABELS, getFullMatrix, loadSharedPermissionMatrix, subscribeSharedPermissionMatrix, type Role } from "@/lib/permissions";
import { normalizeEmployeeCode, reviewAccountLink, validateAccountLink, type AccountLinkProfile, type EmployeeLinkProfile } from "@/lib/data/account-link-review";

async function readAccounts(): Promise<AccountLinkProfile[]> {
  const response = await authFetch("/api/admin/users", { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.error || !Array.isArray(result.users)) throw new Error(result.error || "Không tải được tài khoản.");
  return result.users;
}

async function readEmployees(): Promise<EmployeeLinkProfile[]> {
  if (!isSupabaseEnabled || !supabase) throw new Error("Chưa kết nối nguồn hồ sơ nhân sự.");
  const employees: EmployeeLinkProfile[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from("nhan_su").select("ma_nv,ho_ten").order("ma_nv").range(offset, offset + 499);
    if (error) throw new Error(error.message);
    employees.push(...(data || []).map(row => ({ maNV: row.ma_nv, hoTen: row.ho_ten })));
    if (!data || data.length < 500) return employees;
  }
}

export function AccountLinkReview({ onSaved }: { onSaved: () => void }) {
  const { user } = useSession();
  const [accounts, setAccounts] = useState<AccountLinkProfile[]>([]);
  const [employees, setEmployees] = useState<EmployeeLinkProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AccountLinkProfile | null>(null);
  const [role, setRole] = useState<Role>("admin");
  const [matrix, setMatrix] = useState(getFullMatrix);
  const isAdmin = user?.role === "admin";
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextAccounts, nextEmployees] = await Promise.all([readAccounts(), readEmployees()]);
      setAccounts(nextAccounts);
      setEmployees(nextEmployees);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu kiểm kê.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isAdmin) void refresh(); }, [isAdmin, refresh]);
  useEffect(() => {
    let active = true;
    void loadSharedPermissionMatrix().then(value => { if (active) setMatrix(value); }).catch(() => {});
    const unsubscribe = subscribeSharedPermissionMatrix(value => { if (active) setMatrix(value); });
    return () => { active = false; unsubscribe(); };
  }, []);
  const rows = useMemo(() => accounts.map(account => ({ account, status: reviewAccountLink(account, accounts, employees) })), [accounts, employees]);
  const orphanEmployees = employees.filter(employee => !accounts.some(account => normalizeEmployeeCode(account.maNV) === normalizeEmployeeCode(employee.maNV)));
  const filtered = rows.filter(({ account, status }) => `${account.name} ${account.email} ${account.maNV || ""} ${status}`.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")));
  if (!isAdmin) return null;

  async function save(values: Record<string, string>) {
    if (!editing) throw new Error("Chưa chọn tài khoản.");
    const [freshAccounts, freshEmployees] = await Promise.all([readAccounts(), readEmployees()]);
    const current = freshAccounts.find(account => account.id === editing.id);
    if (!current || current.maNV !== editing.maNV) throw new Error("Liên kết đã thay đổi. Đóng hộp thoại và tải lại trước khi sửa.");
    validateAccountLink(editing.id, values.maNV, freshAccounts, freshEmployees);
    const response = await authFetch(`/api/admin/users/${encodeURIComponent(editing.id)}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ maNV: values.maNV }),
    });
    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.error || "Không lưu được liên kết.");
    const verified = await readAccounts();
    setAccounts(verified);
    setEmployees(freshEmployees);
    if (verified.find(account => account.id === editing.id)?.maNV !== values.maNV) throw new Error("Chưa xác nhận được liên kết đã lưu. Hãy tải lại để kiểm tra.");
    onSaved();
  }

  return <section className="card p-4 space-y-4" aria-label="Liên kết tài khoản và quyền hiện hành">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">Liên kết tài khoản với nhân sự</h2><button className="btn-secondary" disabled={loading} onClick={() => void refresh()}>Tải lại kiểm kê</button></div>
    <p className="text-sm opacity-70">Chọn hồ sơ đã có bằng mã nhân viên. Liên kết chỉ cập nhật mã trên tài khoản, giữ nguyên hồ sơ nhân sự và lịch sử công việc. Tài khoản đối tác không có mã nhân viên cần được kiểm kê riêng.</p>
    {loading ? <p role="status">Đang đối chiếu tài khoản và nhân sự…</p> : error ? <p role="alert" className="text-red-600">Không thể kiểm kê: {error}. Chức năng liên kết tạm khóa.</p> : <>
      <p className="text-sm">{rows.filter(row => row.status === "Đã liên kết").length} liên kết hợp lệ · {rows.filter(row => row.status !== "Đã liên kết").length} tài khoản cần kiểm tra · {orphanEmployees.length} hồ sơ chưa có tài khoản</p>
      <input className="input w-full" aria-label="Tìm liên kết tài khoản" placeholder="Tìm tên, email, mã nhân viên hoặc trạng thái…" value={search} onChange={event => setSearch(event.target.value)} />
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Tài khoản</th><th className="p-2">Hồ sơ nhân sự</th><th className="p-2">Kiểm kê</th><th className="p-2">Thao tác</th></tr></thead><tbody>{filtered.map(({ account, status }) => <tr key={account.id} className="border-t"><td className="p-2">{account.name}<div className="text-xs opacity-70">{account.email}</div></td><td className="p-2">{account.maNV || "—"}<div className="text-xs">{employees.find(employee => normalizeEmployeeCode(employee.maNV) === normalizeEmployeeCode(account.maNV))?.hoTen}</div></td><td className={`p-2 ${status === "Đã liên kết" ? "text-emerald-600" : "text-amber-700"}`}>{status}</td><td className="p-2"><button className="btn-secondary" onClick={() => setEditing(account)}>Liên kết hồ sơ</button></td></tr>)}</tbody></table>{!filtered.length && <p className="p-3">Không có tài khoản phù hợp.</p>}</div>
      <details><summary className="cursor-pointer text-sm">Hồ sơ chưa có tài khoản ({orphanEmployees.length})</summary><ul className="mt-2 text-sm">{orphanEmployees.map((employee, index) => <li key={`${employee.maNV}-${index}`}>{employee.maNV} · {employee.hoTen}</li>)}</ul></details>
    </>}
    <div className="border-t pt-3 space-y-2"><h3 className="font-semibold">Bảng quyền hiện hành theo vai trò</h3><p className="text-xs opacity-70">Quyền thao tác đang dùng trong ứng dụng; không mô tả phạm vi từng đơn hàng hay chính sách truy cập dữ liệu.</p><select className="input" aria-label="Vai trò xem quyền" value={role} onChange={event => setRole(event.target.value as Role)}>{ALL_ROLES.map(value => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}</select><a className="ml-3 text-blue-600 underline" href="/phan-quyen-tuy-chinh/">Mở bảng chỉnh quyền</a><div className="max-h-72 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Module</th>{["Xem", "Tạo", "Sửa", "Xóa"].map(label => <th className="p-2" key={label}>{label}</th>)}</tr></thead><tbody>{ALL_MODULES.map(module => <tr key={module} className="border-t"><td className="p-2">{MODULE_LABELS[module]}</td>{["r", "c", "u", "d"].map(action => <td className="p-2" key={action}>{matrix[role]?.[module]?.includes(action) ? "Có" : "—"}</td>)}</tr>)}</tbody></table></div></div>
    {editing && <CrudModal open title={`Liên kết: ${editing.email}`} onClose={() => setEditing(null)} initial={{ maNV: editing.maNV || "" }} fields={[{ name: "maNV", label: "Hồ sơ nhân viên", type: "select", required: true, options: employees.filter(employee => {
      try { validateAccountLink(editing.id, employee.maNV, accounts, employees); return true; } catch { return false; }
    }).map(employee => ({ value: employee.maNV, label: `${employee.maNV} · ${employee.hoTen}` })) }]} onSubmit={save}><p className="text-sm">Liên kết hiện tại: {editing.maNV || "Chưa có"}. Kiểm tra đúng người trước khi lưu.</p></CrudModal>}
  </section>;
}
