"use client";

import { useSyncExternalStore } from "react";
import { USERS } from "./users";
import { ALL_ROLES, type Role } from "./permissions";
import type { AccountAccess } from "./data/account-access";
import { LOCAL_ACCOUNT_MODE } from "./local-account-mode";
import { createLocalStageAccounts } from "./data/real-data";

const KEY = "mimin_local_account_links_v1";
const EVENT = "mimin-local-account-links";
const ACTIVE = "mimin_local_active_account_v1";
let snapshot = "";
export function readLocalAccounts(): AccountAccess[] {
  if (!LOCAL_ACCOUNT_MODE || typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  const accounts: AccountAccess[] = raw ? JSON.parse(raw) as AccountAccess[] : USERS.map(user => ({
    id: user.id, name: user.name, email: user.email,
    roles: [ALL_ROLES.includes(user.role as Role) ? user.role as Role : "sewing"],
    kind: "employee", employeeCode: user.maNV || "", partnerCode: "", supplierCode: "",
    department: user.phongBan || "", team: "", scope: ["admin", "planner", "accountant"].includes(user.role) ? "COMPANY" : "ASSIGNED", active: true,
  }));
  // Add missing previews even in browsers with saved accounts; retain all edits.
  return [...accounts, ...createLocalStageAccounts().filter(preview =>
    !accounts.some(account => account.id === preview.id
      || account.email.toLowerCase() === preview.email
      || account.employeeCode === preview.employeeCode))];
}
export function localActiveAccount(): AccountAccess | null {
  const accounts = readLocalAccounts();
  const id = typeof window === "undefined" ? "" : localStorage.getItem(ACTIVE);
  if (id) return accounts.find(account => account.id === id && account.active) || null;
  return accounts.find(account => account.active && account.roles.includes("admin")) || null;
}
function emit() { window.dispatchEvent(new Event(EVENT)); }
export function selectLocalAccount(id: string) {
  if (!LOCAL_ACCOUNT_MODE || !readLocalAccounts().some(account => account.id === id && account.active)) throw new Error("Tài khoản không hoạt động");
  localStorage.setItem(ACTIVE, id); emit();
}
export function saveLocalAccount(account: AccountAccess) {
  if (!LOCAL_ACCOUNT_MODE || !localActiveAccount()?.roles.includes("admin")) throw new Error("Chỉ quản trị viên được liên kết tài khoản");
  account = { ...account, email: account.email.trim().toLowerCase(), name: account.name.trim(),
    employeeCode: account.employeeCode.trim(), partnerCode: account.partnerCode.trim(),
    supplierCode: account.supplierCode.trim(), department: account.department.trim(), team: account.team.trim(),
    roles: [...new Set(account.roles)] };
  if (!account.id.trim() || !account.name) throw new Error("Thiếu mã tài khoản hoặc tên hồ sơ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) throw new Error("Email không hợp lệ");
  if (!["employee", "partner", "supplier"].includes(account.kind)) throw new Error("Loại tài khoản không hợp lệ");
  if (!["ASSIGNED", "TEAM", "DEPARTMENT", "COMPANY"].includes(account.scope)) throw new Error("Phạm vi dữ liệu không hợp lệ");
  if (typeof account.active !== "boolean") throw new Error("Trạng thái không hợp lệ");
  if (account.kind !== "employee") account = { ...account, scope: "ASSIGNED", department: "", team: "" };
  account = { ...account, employeeCode: account.kind === "employee" ? account.employeeCode : "",
    partnerCode: account.kind === "partner" ? account.partnerCode : "", supplierCode: account.kind === "supplier" ? account.supplierCode : "" };
  if (!account.roles.length || account.roles.some(role => !ALL_ROLES.includes(role))) throw new Error("Chọn ít nhất một vai trò hợp lệ");
  if (account.kind !== "employee" && account.roles.some(role => role !== (account.kind === "partner" ? "partner" : "supplier"))) throw new Error("Tài khoản bên ngoài chỉ nhận vai trò của đối tác hoặc nhà cung cấp");
  if (account.kind === "employee" && account.roles.some(role => ["partner", "supplier", "workshop_customer", "buyer_customer"].includes(role))) throw new Error("Chọn đúng loại tài khoản cho vai trò bên ngoài");
  if (account.kind === "employee" && !account.employeeCode.trim()) throw new Error("Cần liên kết mã nhân viên");
  if (account.kind === "partner" && !account.partnerCode.trim()) throw new Error("Cần liên kết mã đối tác gia công");
  if (account.kind === "supplier" && !account.supplierCode.trim()) throw new Error("Cần liên kết mã nhà cung cấp");
  if (account.scope === "TEAM" && !account.team.trim()) throw new Error("Chọn tổ quản lý");
  if (account.scope === "DEPARTMENT" && !account.department.trim()) throw new Error("Chọn bộ phận quản lý");
  const accounts = readLocalAccounts();
  if (accounts.some(item => item.id !== account.id && item.email.trim().toLowerCase() === account.email)) throw new Error("Email đã có tài khoản");
  if (account.kind === "employee" && accounts.some(item => item.id !== account.id && item.kind === "employee" && item.employeeCode.toLowerCase() === account.employeeCode.toLowerCase())) throw new Error("Nhân viên đã được liên kết với tài khoản khác");
  const next = [...accounts.filter(item => item.id !== account.id), account];
  if (!next.some(item => item.active && item.roles.includes("admin"))) throw new Error("Cần giữ ít nhất một quản trị viên đang hoạt động");
  localStorage.setItem(KEY, JSON.stringify(next)); emit();
}
function subscribe(listener: () => void) {
  window.addEventListener(EVENT, listener); window.addEventListener("storage", listener);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", listener); };
}
export function useLocalAccountRevision() {
  return useSyncExternalStore(subscribe, () => {
    snapshot = `${localStorage.getItem(KEY) || ""}|${localStorage.getItem(ACTIVE) || ""}`;
    return snapshot;
  }, () => "");
}
