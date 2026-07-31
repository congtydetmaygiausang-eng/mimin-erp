// Mock Lark Server - Giả lập Lark Base API để test code ERP khi chưa có credentials thật
// Khi a paste App ID/Secret thật → auto chuyển sang real Lark API

import type { PhieuWorkflow } from "./workflow-data";

const MOCK_STORAGE_KEY = "mimin_lark_mock_data_v1";

type LarkRecord = {
  record_id: string;
  fields: Record<string, any>;
  created_time: number;
  updated_time: number;
};

type MockTable = {
  table_id: string;
  name: string;
  records: LarkRecord[];
};

type MockBase = {
  app_token: string;
  name: string;
  tables: Record<string, MockTable>;
};

function getMockBase(): MockBase {
  if (typeof window === "undefined") {
    return { app_token: "MOCK", name: "MOCK", tables: {} };
  }
  try {
    const raw = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) {
      // Tạo base mẫu với 5 bảng
      const base: MockBase = {
        app_token: "MOCK_BASE_TOKEN",
        name: "MIMIN ERP Workflow (Mock)",
        tables: {
          INTD: { table_id: "MOCK_TBL_INTD", name: "In/Thêu/Dập", records: [] },
          MAY: { table_id: "MOCK_TBL_MAY", name: "May", records: [] },
          KN: { table_id: "MOCK_TBL_KN", name: "Khuy nút", records: [] },
          UI: { table_id: "MOCK_TBL_UI", name: "Ủi", records: [] },
          DG: { table_id: "MOCK_TBL_DG", name: "Đóng gói", records: [] },
        },
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(base));
      return base;
    }
    return JSON.parse(raw);
  } catch {
    return { app_token: "MOCK", name: "MOCK", tables: {} };
  }
}

function saveMockBase(base: MockBase) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(base));
}

// ============ MOCK API ENDPOINTS ============

export const MOCK_API = {
  // Auth
  "POST /auth/v3/tenant_access_token/internal": (body: any) => {
    // Bất kỳ app_id + app_secret nào cũng pass
    return {
      code: 0,
      msg: "ok",
      tenant_access_token: "MOCK_TENANT_TOKEN_" + Date.now(),
      expire: 7200,
    };
  },

  // List records in table
  "GET /tables/:table_id/records": (tableId: string) => {
    const base = getMockBase();
    const table = base.tables[tableId] || Object.values(base.tables).find((t) => t.table_id === tableId);
    if (!table) {
      return { code: 404, msg: "Table not found" };
    }
    return {
      code: 0,
      msg: "ok",
      data: {
        items: table.records,
        total: table.records.length,
      },
    };
  },

  // Create record
  "POST /tables/:table_id/records": (tableId: string, body: { fields: any }) => {
    const base = getMockBase();
    const tableKey = Object.keys(base.tables).find((k) => base.tables[k].table_id === tableId) || tableId;
    const table = base.tables[tableKey];
    if (!table) {
      return { code: 404, msg: "Table not found" };
    }
    const record: LarkRecord = {
      record_id: "rec_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      fields: body.fields,
      created_time: Date.now(),
      updated_time: Date.now(),
    };
    table.records.push(record);
    saveMockBase(base);
    return { code: 0, msg: "ok", data: { record } };
  },

  // Update record
  "PUT /tables/:table_id/records/:record_id": (tableId: string, recordId: string, body: { fields: any }) => {
    const base = getMockBase();
    const tableKey = Object.keys(base.tables).find((k) => base.tables[k].table_id === tableId) || tableId;
    const table = base.tables[tableKey];
    if (!table) {
      return { code: 404, msg: "Table not found" };
    }
    const record = table.records.find((r) => r.record_id === recordId);
    if (!record) {
      return { code: 404, msg: "Record not found" };
    }
    record.fields = { ...record.fields, ...body.fields };
    record.updated_time = Date.now();
    saveMockBase(base);
    return { code: 0, msg: "ok", data: { record } };
  },

  // Delete record
  "DELETE /tables/:table_id/records/:record_id": (tableId: string, recordId: string) => {
    const base = getMockBase();
    const tableKey = Object.keys(base.tables).find((k) => base.tables[k].table_id === tableId) || tableId;
    const table = base.tables[tableKey];
    if (!table) {
      return { code: 404, msg: "Table not found" };
    }
    table.records = table.records.filter((r) => r.record_id !== recordId);
    saveMockBase(base);
    return { code: 0, msg: "ok" };
  },
};

// ============ FETCH INTERCEPTOR ============
// Override fetch để route real Lark calls → mock

export function setupMockFetchInterceptor() {
  if (typeof window === "undefined") return;
  const originalFetch = window.fetch;

  (window as any).__originalFetch = originalFetch;

  window.fetch = async function (input: any, init?: any) {
    const url = typeof input === "string" ? input : input.url;

    // Chỉ intercept Lark API
    if (url && url.includes("open.larksuite.com/open-apis/")) {
      const config = getLarkConfigFromStorage();
      if (!config || !config.useMock) {
        return originalFetch(input, init);
      }

      // Parse URL
      const urlObj = new URL(url);
      const path = urlObj.pathname.replace("/open-apis/bitable/v1", "");

      // Route to mock
      if (path.startsWith("/auth/v3/tenant_access_token/internal")) {
        const body = init?.body ? JSON.parse(init.body) : {};
        return mockResponse(MOCK_API["POST /auth/v3/tenant_access_token/internal"](body));
      }

      if (path.match(/^\/tables\/[^/]+\/records$/)) {
        const tableId = path.split("/")[2];
        if (init?.method === "POST" || (!init?.method && init?.body)) {
          const body = init?.body ? JSON.parse(init.body) : {};
          return mockResponse(MOCK_API["POST /tables/:table_id/records"](tableId, body));
        }
        return mockResponse(MOCK_API["GET /tables/:table_id/records"](tableId));
      }

      if (path.match(/^\/tables\/[^/]+\/records\/[^/]+$/)) {
        const parts = path.split("/");
        const tableId = parts[2];
        const recordId = parts[4];
        const body = init?.body ? JSON.parse(init.body) : {};
        if (init?.method === "PUT") {
          return mockResponse(MOCK_API["PUT /tables/:table_id/records/:record_id"](tableId, recordId, body));
        }
        if (init?.method === "DELETE") {
          return mockResponse(MOCK_API["DELETE /tables/:table_id/records/:record_id"](tableId, recordId));
        }
      }
    }

    return originalFetch(input, init);
  };
}

function mockResponse(data: any): Promise<Response> {
  return Promise.resolve({
    ok: data.code === 0,
    status: data.code === 0 ? 200 : data.code,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as any);
}

function getLarkConfigFromStorage(): any {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("mimin_lark_config_v1");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ============ RESET MOCK DATA ============
export function resetMockLarkData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_STORAGE_KEY);
}

export function getMockBaseData(): MockBase {
  return getMockBase();
}
