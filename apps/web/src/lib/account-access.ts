import type { AccountAccess, RecordAssignment, PermissionCheck } from "./data/account-access";
import type { Module, Action } from "./permissions";
import { productionStageRank } from "./production-stage-order";

export const STAGE_MODULES: Module[] = ["to-cat", "to-in-theu", "to-may", "kiem-tra-chat-luong", "to-khuy-nut", "to-ui", "to-dong-goi", "kho-thanh-pham"];
export interface AssignedStage extends RecordAssignment {
  id: string;
  tenCongDoan: string;
  nguoiMa?: string;
  loaiNguoi?: string;
}
export interface AssignedOrder extends RecordAssignment {
  id: string;
  phuTrachSX?: string;
  phuTrachCat?: string;
  phanCong?: AssignedStage[];
}
const code = (value: string | undefined) => (value || "").trim().toLowerCase();
export function hasAccountPermission(account: AccountAccess | null, module: Module, action: Action, check: PermissionCheck): boolean {
  return Boolean(account?.active && account.roles.some(role => check(role, module, "view") && check(role, module, action)));
}
export function matchesEmployee(account: AccountAccess, id: string | undefined): boolean {
  return Boolean(code(id) && [account.id, account.employeeCode].some(value => code(value) === code(id)));
}
export function inAssignment(account: AccountAccess, assignment: RecordAssignment): boolean {
  if (!account.active) return false;
  if (assignment.userIds?.includes(account.id)) return true;
  if (account.kind !== "employee") return false;
  if (account.scope === "COMPANY") return true;
  if (account.scope === "TEAM" && code(account.team) && code(account.team) === code(assignment.team)) return true;
  return account.scope === "DEPARTMENT" && Boolean(code(account.department)) && code(account.department) === code(assignment.department);
}
export function stageModule(stage: AssignedStage): Module | undefined {
  return STAGE_MODULES[productionStageRank(stage)];
}
export function canAccessStage(account: AccountAccess | null, stage: AssignedStage, action: Action, check: PermissionCheck): boolean {
  const module = stageModule(stage);
  if (!account || !module) return false;
  const permitted = account.kind === "partner"
    ? hasAccountPermission(account, "cong-viec-gia-cong", action, check)
    : hasAccountPermission(account, module, action, check);
  if (!permitted) return false;
  if (account.kind === "supplier") return false;
  if (account.kind === "partner") {
    return stage.loaiNguoi === "xuong_ngoai" && Boolean(code(account.partnerCode))
      && code(stage.nguoiMa) === code(account.partnerCode)
      && (!stage.userIds?.length || stage.userIds.includes(account.id));
  }
  return inAssignment(account, stage) || (stage.loaiNguoi !== "xuong_ngoai" && matchesEmployee(account, stage.nguoiMa));
}
export function canAccessProductionOrder(account: AccountAccess | null, order: AssignedOrder, check: PermissionCheck): boolean {
  if (!account?.active || account.kind === "supplier") return false;
  if (account.kind === "employee" && hasAccountPermission(account, "lenh-cat", "view", check)
    && (inAssignment(account, order) || matchesEmployee(account, order.phuTrachSX) || matchesEmployee(account, order.phuTrachCat))) return true;
  return Boolean(order.phanCong?.some(stage => canAccessStage(account, stage, "view", check)));
}
export function canAccessBusinessRecord(account: AccountAccess | null, record: RecordAssignment & { maNcc?: string; nguoiTao?: string }, module: Module, action: Action, check: PermissionCheck): boolean {
  if (!account || !hasAccountPermission(account, module, action, check)) return false;
  if (account.kind === "supplier") return module === "dat-ncc-phu-lieu" && Boolean(code(account.supplierCode)) && code(account.supplierCode) === code(record.maNcc)
    && (!record.userIds?.length || record.userIds.includes(account.id));
  if (account.kind === "partner") return false;
  return inAssignment(account, record) || matchesEmployee(account, record.nguoiTao);
}
