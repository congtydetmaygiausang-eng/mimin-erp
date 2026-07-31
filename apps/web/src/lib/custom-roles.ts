// Custom Roles - Admin tạo/sửa role mới từ UI

import type { Module, Action } from "./permissions";

export type CustomRole = {
  id: string;
  key: string;        // unique key, e.g. "intern_qc"
  name: string;       // Display name
  description?: string;
  color?: string;     // gradient class
  permissions: Record<Module, Action[]>; // empty array = no access
  isSystem?: boolean; // system role không cho xoá
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "mimin_custom_roles_v1";

const SYSTEM_ROLES_KEY = "mimin_builtin_roles_v1"; // Built-in roles vẫn ở permissions.ts

export function getCustomRoles(): CustomRole[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CustomRole[];
  } catch {
    return [];
  }
}

function saveRoles(roles: CustomRole[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
}

export function getCustomRoleByKey(key: string): CustomRole | null {
  return getCustomRoles().find((r) => r.key === key) || null;
}

export function addCustomRole(role: Omit<CustomRole, "id" | "createdAt" | "updatedAt">): CustomRole {
  const roles = getCustomRoles();
  const newRole: CustomRole = {
    ...role,
    id: `role_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  roles.push(newRole);
  saveRoles(roles);
  return newRole;
}

export function updateCustomRole(id: string, updates: Partial<CustomRole>): CustomRole | null {
  const roles = getCustomRoles();
  const idx = roles.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  roles[idx] = { ...roles[idx], ...updates, updatedAt: new Date().toISOString() };
  saveRoles(roles);
  return roles[idx];
}

export function deleteCustomRole(id: string): void {
  const roles = getCustomRoles();
  const filtered = roles.filter((r) => r.id !== id);
  saveRoles(filtered);
}

// Check permission cho custom role
export function canCustomRole(roleKey: string, module: Module, action: Action): boolean {
  const role = getCustomRoleByKey(roleKey);
  if (!role) return false;
  return (role.permissions[module] || []).includes(action);
}

export const GRADIENT_OPTIONS = [
  { value: "from-rose-500 to-pink-500", label: "Đỏ hồng" },
  { value: "from-violet-500 to-purple-500", label: "Tím" },
  { value: "from-amber-500 to-orange-500", label: "Cam" },
  { value: "from-sky-500 to-cyan-500", label: "Xanh biển" },
  { value: "from-emerald-500 to-green-500", label: "Xanh lá" },
  { value: "from-fuchsia-500 to-pink-500", label: "Fuchsia" },
  { value: "from-blue-500 to-indigo-500", label: "Xanh dương" },
  { value: "from-slate-500 to-slate-700", label: "Xám" },
];
