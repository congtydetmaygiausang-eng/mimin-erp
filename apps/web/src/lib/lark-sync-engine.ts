// Lark Sync Engine - Auto-push + Polling
// Khi user thao tác trên ERP → push lên Lark
// Mỗi 5 phút → pull ngược về (cập nhật khi chị Giàu sửa trên Lark)

import type { PhieuWorkflow } from "./workflow-data";
import { getUserAccessToken } from "./lark-user-token";
import { getLarkConfig } from "./lark";
import { logAudit } from "./audit-log";
import { ALL_REAL_PHIEU, REAL_NHAN_VIEN } from "./real-workflow-data";

const POLL_INTERVAL = 5 * 60 * 1000; // 5 phút

export type SyncDirection = "push" | "pull" | "auto";
export type SyncStatus = "pending" | "syncing" | "success" | "error" | "skipped";

export interface SyncRecord {
  id: string;
  phieuId: string;
  direction: SyncDirection;
  status: SyncStatus;
  timestamp: number;
  message?: string;
  recordId?: string; // Lark record_id nếu push thành công
}

const SYNC_HISTORY_KEY = "mimin_lark_sync_history";
const SYNC_POLL_KEY = "mimin_lark_sync_poll";
const LAST_PULL_KEY = "mimin_lark_last_pull";

// ============ Map khâu → table_id ============
const STAGE_TO_TABLE: Record<string, keyof LarkTableIds> = {
  CAT: "cat",
  INTD: "intd",
  MAY: "may",
  KN: "kn",
  UI: "ui",
  DG: "dg",
};

interface LarkTableIds {
  cat: string;
  intd: string;
  may: string;
  kn: string;
  ui: string;
  dg: string;
}

// ============ Auto-push 1 phiếu lên Lark ============
export async function autoPushPhieu(
  phieu: PhieuWorkflow,
  user: any
): Promise<SyncRecord> {
  const record: SyncRecord = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    phieuId: phieu.id,
    direction: "push",
    status: "pending",
    timestamp: Date.now(),
  };

  try {
    const token = getUserAccessToken();
    if (!token) {
      record.status = "skipped";
      record.message = "Chưa có User Token";
      addToHistory(record);
      return record;
    }

    const config = getLarkConfig();
    if (!config) {
      record.status = "skipped";
      record.message = "Chưa config Lark";
      addToHistory(record);
      return record;
    }

    const stage = phieu.id.split("_")[0];
    const tableKey = STAGE_TO_TABLE[stage];
    if (!tableKey) {
      record.status = "skipped";
      record.message = `Không tìm thấy bảng cho khâu ${stage}`;
      addToHistory(record);
      return record;
    }

    // Lấy table_id từ config hoặc lark-mapping
    const tableId = getTableId(config.tableIds, tableKey);
    if (!tableId) {
      record.status = "skipped";
      record.message = `Chưa có table_id cho ${tableKey}`;
      addToHistory(record);
      return record;
    }

    record.status = "syncing";
    addToHistory(record);

    // Map fields
    const fields = mapPhieuToLarkFields(phieu);
    const res = await pushLarkRecord(tableId, fields, token.token);

    record.status = "success";
    record.message = `Push thành công → record_id: ${res.record_id}`;
    record.recordId = res.record_id;

    logAudit({
      user, action: "create", module: "lark-sync" as any,
      description: `Auto-push phiếu ${phieu.id} lên Lark table ${tableKey} (${tableId})`,
      success: true,
    });
  } catch (e: any) {
    record.status = "error";
    record.message = e.message;
    logAudit({
      user, action: "create", module: "lark-sync" as any,
      description: `Push ${phieu.id} thất bại: ${e.message}`,
      success: false,
    });
  }

  addToHistory(record);
  return record;
}

function getTableId(tableIds: any, key: keyof LarkTableIds): string | undefined {
  // Map từ nhiều format config
  const map: Record<keyof LarkTableIds, string[]> = {
    cat: [tableIds.cat, tableIds.cắt, tableIds.catTbl],
    intd: [tableIds.intd, tableIds.inTheuDap, tableIds.inThêuDập, tableIds.inTheuDapTbl],
    may: [tableIds.may, tableIds.mayTbl],
    kn: [tableIds.kn, tableIds.khuyNut, tableIds.khuyNutTbl],
    ui: [tableIds.ui, tableIds.ủi, tableIds.uiTbl],
    dg: [tableIds.dg, tableIds.dongGoi, tableIds.dongGoiTbl],
  };
  for (const id of map[key] || []) {
    if (id && id.length > 5) return id;
  }
  return undefined;
}

function mapPhieuToLarkFields(p: PhieuWorkflow): Record<string, any> {
  return {
    "Mã phiếu": p.id,
    "Mã LSX": p.lenhSX,
    "Mã SP": p.maSP,
    "Loại SP": p.phanLoai,
    "Màu - Size": `${p.mau} - ${p.size}`,
    "SL giao": p.soLuongGiao,
    "SL nhận": p.soLuongNhan,
    "SL đạt": p.soLuongDat,
    "SL lỗi": p.soLuongLoi,
    "SL thiếu": p.soLuongThieu,
    "Người thực hiện": p.tenNguoiNhan,
    "Đơn giá": p.donGia,
    "Thành tiền": p.thanhTien,
    "Đã trả": p.daThanhToan,
    "Còn nợ": p.conNo,
    "Hạn hoàn thành": p.hanHoanThanh ? new Date(p.hanHoanThanh).getTime() : null,
    "Trạng thái": p.trangThai,
    "Ghi chú": p.ghiChu || "",
  };
}

async function pushLarkRecord(tableId: string, fields: Record<string, any>, token: string) {
  const res = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${getLarkConfig()!.baseToken}/tables/${tableId}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(data.msg);
  return data.data;
}

// ============ Bulk push nhiều phiếu ============
export async function bulkPushPhieus(
  phieus: PhieuWorkflow[],
  user: any,
  onProgress?: (done: number, total: number) => void
): Promise<SyncRecord[]> {
  const records: SyncRecord[] = [];
  for (let i = 0; i < phieus.length; i++) {
    const r = await autoPushPhieu(phieus[i], user);
    records.push(r);
    if (onProgress) onProgress(i + 1, phieus.length);
    await new Promise((r) => setTimeout(r, 200));
  }
  return records;
}

// ============ Push 17 NV lên bảng NV ============
export async function pushAllNhanVien(user: any): Promise<SyncRecord[]> {
  const records: SyncRecord[] = [];
  const config = getLarkConfig();
  if (!config) throw new Error("Chưa config Lark");

  for (const nv of REAL_NHAN_VIEN) {
    const record: SyncRecord = {
      id: `sync-nv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      phieuId: nv.ma,
      direction: "push",
      status: "pending",
      timestamp: Date.now(),
    };
    try {
      const token = getUserAccessToken();
      if (!token) {
        record.status = "skipped";
        record.message = "Chưa có User Token";
        addToHistory(record);
        records.push(record);
        continue;
      }
      // Tìm bảng NV (table có Mã NV)
      const tableId = await findTableByName(config.baseToken, "Công việc thực tế từng người", token.token);
      if (!tableId) {
        record.status = "skipped";
        record.message = "Không tìm thấy bảng NV";
        addToHistory(record);
        records.push(record);
        continue;
      }
      record.status = "syncing";
      const fields = {
        "Mã NV": nv.ma,
        "Mã": nv.ma,
        "Họ tên": nv.ten,
        "Nhân sự": nv.ten,
        "Bộ phận": nv.boPhan,
        "Đơn giá thực tế": nv.donGia.toString(),
        "Công việc thực tế": nv.boPhan,
        "Việc phải làm": nv.ghiChu,
      };
      const res = await pushLarkRecord(tableId, fields, token.token);
      record.status = "success";
      record.recordId = res.record_id;
    } catch (e: any) {
      record.status = "error";
      record.message = e.message;
    }
    addToHistory(record);
    records.push(record);
    await new Promise((r) => setTimeout(r, 200));
  }
  return records;
}

async function findTableByName(baseToken: string, name: string, token: string): Promise<string | undefined> {
  const res = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${baseToken}/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (data.code !== 0) return undefined;
  const found = (data.data.items || []).find((t: any) => t.name.includes(name) || t.name === name);
  return found?.table_id;
}

// ============ Pull data từ Lark về ERP ============
export async function pullFromLarkAll(user: any): Promise<{ phieus: number; nvs: number; records: any[] }> {
  const token = getUserAccessToken();
  const config = getLarkConfig();
  if (!token || !config) throw new Error("Chưa có Token/Config");

  const allRecords: any[] = [];

  // Pull từ tất cả 6 bảng khâu
  for (const [stage, tableKey] of Object.entries(STAGE_TO_TABLE)) {
    const tableId = getTableId(config.tableIds, tableKey);
    if (!tableId) continue;

    const res = await fetch(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${config.baseToken}/tables/${tableId}/records?page_size=100`,
      { headers: { Authorization: `Bearer ${token.token}` } }
    );
    const data = await res.json();
    if (data.code === 0) {
      for (const item of data.data.items || []) {
        allRecords.push({ stage, ...item });
      }
    }
  }

  localStorage.setItem(LAST_PULL_KEY, Date.now().toString());
  logAudit({
    user, action: "view", module: "lark-sync" as any,
    description: `Pull từ Lark: ${allRecords.length} records`, success: true,
  });

  return { phieus: allRecords.length, nvs: 0, records: allRecords };
}

// ============ Polling engine ============
let pollInterval: any = null;
let pollCallbacks: Array<(records: any[]) => void> = [];

export function startPolling(user: any, onUpdate?: (records: any[]) => void) {
  if (pollInterval) clearInterval(pollInterval);

  const tick = async () => {
    try {
      const result = await pullFromLarkAll(user);
      if (onUpdate) onUpdate(result.records);
      for (const cb of pollCallbacks) cb(result.records);
      localStorage.setItem(SYNC_POLL_KEY, JSON.stringify({
        lastRun: Date.now(),
        records: result.phieus,
      }));
    } catch (e) {
      console.warn("[Sync] Poll failed:", e);
    }
  };

  // Run immediately + every interval
  tick();
  pollInterval = setInterval(tick, POLL_INTERVAL);

  return () => {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = null;
  };
}

export function onPollingUpdate(cb: (records: any[]) => void) {
  pollCallbacks.push(cb);
  return () => {
    pollCallbacks = pollCallbacks.filter((c) => c !== cb);
  };
}

// ============ History ============
function addToHistory(record: SyncRecord) {
  const history = getHistory();
  history.unshift(record);
  if (history.length > 100) history.pop();
  localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history));
}

export function getHistory(): SyncRecord[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem(SYNC_HISTORY_KEY);
}

export function getLastPull(): number {
  return parseInt(localStorage.getItem(LAST_PULL_KEY) || "0", 10);
}

export function getPollStatus(): { lastRun: number; records: number } | null {
  try {
    return JSON.parse(localStorage.getItem(SYNC_POLL_KEY) || "null");
  } catch {
    return null;
  }
}
