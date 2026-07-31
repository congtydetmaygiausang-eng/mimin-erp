"use client";

// Helper functions for Lark API
import { getLarkConfig } from "./lark";
import { getUserAccessToken } from "./lark-user-token";

const LARK_API = "https://open.larksuite.com/open-apis";

export interface LarkFieldValue {
  [key: string]: any;
}

export async function pushRecordToLark(tableId: string, fields: LarkFieldValue): Promise<{ record_id: string }> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token. Vào /lark-login");

  const config = getLarkConfig();
  if (!config) throw new Error("Chưa config Lark. Vào /lark-settings");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${config.baseToken}/tables/${tableId}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ fields }),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Lark API: ${data.msg} (code ${data.code})`);
  }
  return data.data;
}

export async function updateLarkRecord(tableId: string, recordId: string, fields: LarkFieldValue): Promise<void> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const config = getLarkConfig();
  if (!config) throw new Error("Chưa config Lark");

  const res = await fetch(`${LARK_API}/bitable/v1/apps/${config.baseToken}/tables/${tableId}/records/${recordId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ fields }),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Lark API: ${data.msg}`);
  }
}

export async function pullFromLark(tableId: string): Promise<any[]> {
  const token = getUserAccessToken();
  if (!token) throw new Error("Chưa có User Access Token");

  const config = getLarkConfig();
  if (!config) throw new Error("Chưa config Lark");

  const allRecords: any[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${LARK_API}/bitable/v1/apps/${config.baseToken}/tables/${tableId}/records`);
    url.searchParams.set("page_size", "100");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token.token}` },
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`Lark API: ${data.msg}`);

    allRecords.push(...(data.data.items || []));
    pageToken = data.data.has_more ? data.data.page_token : undefined;
  } while (pageToken);

  return allRecords;
}
