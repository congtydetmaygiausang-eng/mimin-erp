"use client";

/**
 * account-links-sync.ts
 * Sync bảng `account_links` giữa localStorage và Supabase.
 *
 * Schema Supabase (chạy migration ở cuối file này):
 *   id          text PRIMARY KEY
 *   name        text NOT NULL
 *   email       text NOT NULL
 *   roles       jsonb NOT NULL DEFAULT '[]'
 *   kind        text NOT NULL DEFAULT 'employee'
 *   employee_code text NOT NULL DEFAULT ''
 *   partner_code  text NOT NULL DEFAULT ''
 *   supplier_code text NOT NULL DEFAULT ''
 *   department  text NOT NULL DEFAULT ''
 *   team        text NOT NULL DEFAULT ''
 *   scope       text NOT NULL DEFAULT 'ASSIGNED'
 *   active      boolean NOT NULL DEFAULT true
 *   updated_at  timestamptz NOT NULL DEFAULT now()
 */

import { supabase, isSupabaseEnabled } from "./client";
import type { AccountAccess } from "../data/account-access";

const TABLE = "account_links";

// Row type (snake_case) tren Supabase
interface AccountLinkRow {
  id: string;
  name: string;
  email: string;
  roles: string[];
  kind: string;
  employee_code: string;
  partner_code: string;
  supplier_code: string;
  department: string;
  team: string;
  scope: string;
  active: boolean;
  updated_at?: string;
}

function toRow(account: AccountAccess): AccountLinkRow {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    roles: account.roles as string[],
    kind: account.kind,
    employee_code: account.employeeCode,
    partner_code: account.partnerCode,
    supplier_code: account.supplierCode,
    department: account.department,
    team: account.team,
    scope: account.scope,
    active: account.active,
  };
}

function fromRow(row: AccountLinkRow): AccountAccess {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    roles: (row.roles ?? []) as AccountAccess["roles"],
    kind: row.kind as AccountAccess["kind"],
    employeeCode: row.employee_code ?? "",
    partnerCode: row.partner_code ?? "",
    supplierCode: row.supplier_code ?? "",
    department: row.department ?? "",
    team: row.team ?? "",
    scope: row.scope as AccountAccess["scope"],
    active: row.active ?? true,
  };
}

/** Tai danh sach account tu Supabase. Tra ve [] neu Supabase khong kha dung. */
export async function fetchAccountLinksFromSupabase(): Promise<AccountAccess[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      console.warn("[account-links-sync] fetch error:", error.message);
      return [];
    }
    return (data ?? []).map((row) => fromRow(row as AccountLinkRow));
  } catch (e) {
    console.warn("[account-links-sync] fetch exception:", e);
    return [];
  }
}

/** Upsert 1 account len Supabase. Silent-fail neu khong ket noi duoc. */
export async function upsertAccountLinkToSupabase(account: AccountAccess): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(toRow(account), { onConflict: "id" });
    if (error) {
      console.warn("[account-links-sync] upsert error:", error.message);
    }
  } catch (e) {
    console.warn("[account-links-sync] upsert exception:", e);
  }
}

/** Upsert nhieu accounts len Supabase (batch). */
export async function upsertManyAccountLinksToSupabase(accounts: AccountAccess[]): Promise<void> {
  if (!isSupabaseEnabled || !supabase || accounts.length === 0) return;
  try {
    const { error } = await supabase
      .from(TABLE)
      .upsert(accounts.map(toRow), { onConflict: "id" });
    if (error) {
      console.warn("[account-links-sync] upsert-many error:", error.message);
    }
  } catch (e) {
    console.warn("[account-links-sync] upsert-many exception:", e);
  }
}

/** Xoa account theo id tren Supabase. */
export async function deleteAccountLinkFromSupabase(id: string): Promise<void> {
  if (!isSupabaseEnabled || !supabase) return;
  try {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.warn("[account-links-sync] delete error:", error.message);
    }
  } catch (e) {
    console.warn("[account-links-sync] delete exception:", e);
  }
}
