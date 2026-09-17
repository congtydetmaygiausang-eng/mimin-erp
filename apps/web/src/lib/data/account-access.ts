import type { Role, Module, Action } from "../permissions";

export type AccountScope = "ASSIGNED" | "TEAM" | "DEPARTMENT" | "COMPANY";
export type AccountKind = "employee" | "partner" | "supplier";
export interface AccountDisplayProfile {
  name?: string;
  avatar?: string;
  title?: string;
}
export interface AccountDirectoryEntry {
  kind: AccountKind;
  code: string;
  name: string;
  email: string;
  department: string;
}
export interface AccountAccess {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  kind: AccountKind;
  employeeCode: string;
  partnerCode: string;
  supplierCode: string;
  department: string;
  team: string;
  scope: AccountScope;
  active: boolean;
}
export interface RecordAssignment {
  userIds?: string[];
  team?: string;
  department?: string;
}
export interface AccountAssignmentAudit {
  at: string;
  actorId: string;
  recordId: string;
  before: RecordAssignment;
  after: RecordAssignment;
}
export type PermissionCheck = (role: Role | string, module: Module, action: Action) => boolean;
