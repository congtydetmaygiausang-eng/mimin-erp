// Lark Base Manager - Tạo base mới + setup schema + push data
// Dùng User Access Token (cần OAuth login)

import { getUserAccessToken } from "./lark-user-token";
import { logAudit } from "./audit-log";

const LARK_API = "https://open.larksuite.com/open-apis";

export interface CreateBaseResult {
  app_token: string;
  url: string;
}

export interface FieldDef {
  field_name: string;
  type: number; // 1=text, 2=number, 3=select, 4=multi-select, 5=date
  property?: any;
}

export async function createLarkBase(name: string, user: any): Promise<CreateBaseResult> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  // Tạo Bitable app
  const res = await fetch(`${LARK_API}/bitable/v1/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Create base: ${data.msg}`);

  const appToken = data.data.app.app_token;
  logAudit({
    user, action: "create", module: "lark-setup" as any,
    description: `Tạo Lark Base mới: ${name} (${appToken})`, success: true,
  });
  return {
    app_token: appToken,
    url: `https://kjph64hnjkl5.jp.larksuite.com/base/${appToken}`,
  };
}

export async function createTable(appToken: string, name: string, user: any): Promise<string> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ table: { name } }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Create table ${name}: ${data.msg}`);

  logAudit({
    user, action: "create", module: "lark-setup" as any,
    description: `Tạo bảng: ${name} (${data.data.table.table_id})`, success: true,
  });
  return data.data.table.table_id;
}

export async function addField(appToken: string, tableId: string, field: FieldDef, user: any): Promise<void> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify(field),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Add field ${field.field_name}: ${data.msg}`);
}

export async function listFields(appToken: string, tableId: string): Promise<string[]> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
    headers: { Authorization: `Bearer ${token.token}` },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg);
  return (data.data.items || []).map((f: any) => f.field_name);
}

export async function addFieldsBulk(
  appToken: string, tableId: string, fields: FieldDef[], user: any
): Promise<{ created: number; skipped: number; failed: number }> {
  const existing = await listFields(appToken, tableId);
  let created = 0, skipped = 0, failed = 0;
  for (const field of fields) {
    if (existing.includes(field.field_name)) {
      skipped++;
      continue;
    }
    try {
      await addField(appToken, tableId, field, user);
      created++;
      await new Promise((r) => setTimeout(r, 100));
    } catch (e) {
      failed++;
    }
  }
  return { created, skipped, failed };
}

export async function listTables(appToken: string): Promise<{ table_id: string; name: string }[]> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables`, {
    headers: { Authorization: `Bearer ${token.token}` },
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg);
  return (data.data.items || []).map((t: any) => ({ table_id: t.table_id, name: t.name }));
}

// ============ BATCH APIs (tạo nhiều table/field cùng lúc) ============

export async function batchCreateTables(
  appToken: string, tableNames: string[], user: any
): Promise<string[]> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables/batch_create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({
      tables: tableNames.map((name) => ({ name })),
    }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Batch create tables: ${data.msg} (code ${data.code})`);
  }

  const tableIds = (data.data.tables || []).map((t: any) => t.table_id);
  logAudit({
    user, action: "create", module: "lark-setup" as any,
    description: `Batch tạo ${tableIds.length} bảng: ${tableNames.join(", ")}`, success: true,
  });
  return tableIds;
}

export async function batchCreateFields(
  appToken: string, tableId: string, fields: FieldDef[], user: any
): Promise<{ created: number; failed: number }> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${appToken}/tables/${tableId}/fields/batch_create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ fields }),
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Batch create fields: ${data.msg} (code ${data.code})`);
  }

  logAudit({
    user, action: "create", module: "lark-setup" as any,
    description: `Batch tạo ${fields.length} fields trong table ${tableId}`, success: true,
  });
  return { created: (data.data.fields || []).length, failed: 0 };
}
