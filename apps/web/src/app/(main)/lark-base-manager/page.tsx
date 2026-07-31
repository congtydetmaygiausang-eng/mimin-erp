"use client";

import { useState, useEffect } from "react";
import {
  Database, Plus, RefreshCw, CheckCircle2, AlertCircle, Loader2,
  Sparkles, Settings
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { hasUserToken } from "@/lib/lark-user-token";
import {
  createLarkBase, listTables, listFields,
  batchCreateTables, batchCreateFields,
  type FieldDef
} from "@/lib/lark-base-manager";
import { ALL_REAL_PHIEU, REAL_NHAN_VIEN } from "@/lib/real-workflow-data";

const TABLES_TO_CREATE: { name: string; key: string; fields: FieldDef[] }[] = [
  {
    name: "Công việc thực tế từng người",
    key: "NV",
    fields: [
      { field_name: "Mã NV", type: 1 },
      { field_name: "Họ tên", type: 1 },
      { field_name: "Bộ phận", type: 1 },
      { field_name: "Đơn giá thực tế", type: 1 },
      { field_name: "Công việc thực tế", type: 1 },
      { field_name: "Việc phải làm", type: 1 },
    ],
  },
  {
    name: "Bảng Lệnh cắt",
    key: "LC",
    fields: [
      { field_name: "Mã lệnh cắt", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Loại sản phẩm", type: 1 },
      { field_name: "Màu", type: 1 },
      { field_name: "Size", type: 1 },
      { field_name: "Tổng SL", type: 2 },
      { field_name: "Khách hàng", type: 1 },
      { field_name: "Ngày cắt", type: 5 },
      { field_name: "Người cắt", type: 1 },
      { field_name: "Trạng thái", type: 1 },
    ],
  },
  {
    name: "Cắt - Khâu 1",
    key: "CAT",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Loại SP", type: 1 },
      { field_name: "Kiểu cắt", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL giao", type: 2 },
      { field_name: "SL nhận", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "SL thiếu", type: 2 },
      { field_name: "Người thực hiện", type: 1 },
      { field_name: "Đơn giá", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Đã trả", type: 2 },
      { field_name: "Còn nợ", type: 2 },
      { field_name: "Ngày giao", type: 5 },
      { field_name: "Ngày nhận", type: 5 },
      { field_name: "Hạn hoàn thành", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "In / Thêu / Dập - Khâu 2",
    key: "INTD",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Vị trí thực hiện", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL giao", type: 2 },
      { field_name: "SL nhận", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "Đối tác", type: 1 },
      { field_name: "Ngày giao", type: 5 },
      { field_name: "Hạn trả hàng", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "May - Khâu 3",
    key: "MAY",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Loại SP", type: 1 },
      { field_name: "Kiểu may", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL giao", type: 2 },
      { field_name: "SL bộ giao", type: 2 },
      { field_name: "SL nhận về", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "SL thiếu", type: 2 },
      { field_name: "Xưởng nhận may", type: 1 },
      { field_name: "Đơn giá may", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Đã trả", type: 2 },
      { field_name: "Còn nợ", type: 2 },
      { field_name: "Hạn hoàn thành", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "Khuy nút - Khâu 4",
    key: "KN",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL nhận", type: 2 },
      { field_name: "SL làm khuy", type: 2 },
      { field_name: "SL đính nút", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "SL sửa lại", type: 2 },
      { field_name: "SL giao ủi", type: 2 },
      { field_name: "Người thực hiện", type: 1 },
      { field_name: "Đơn giá", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Hạn hoàn thành", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "Ủi - Khâu 5",
    key: "UI",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Loại SP", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL nhận", type: 2 },
      { field_name: "SL đủ bộ", type: 2 },
      { field_name: "SL chưa đủ bộ", type: 2 },
      { field_name: "SL đã ủi", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "SL giao gấp xếp", type: 2 },
      { field_name: "Người thực hiện", type: 1 },
      { field_name: "Đơn giá", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Hạn hoàn thành", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "Gấp xếp - Đóng gói - Khâu 6",
    key: "DG",
    fields: [
      { field_name: "Mã phiếu", type: 1 },
      { field_name: "Mã LSX", type: 1 },
      { field_name: "Mã SP", type: 1 },
      { field_name: "Phân loại", type: 1 },
      { field_name: "Màu - Size", type: 1 },
      { field_name: "SL nhận", type: 2 },
      { field_name: "SL đã gấp", type: 2 },
      { field_name: "SL đóng bao", type: 2 },
      { field_name: "SL đạt", type: 2 },
      { field_name: "SL lỗi", type: 2 },
      { field_name: "SL giao kho", type: 2 },
      { field_name: "Người thực hiện", type: 1 },
      { field_name: "Đơn giá", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Loại bao bì", type: 1 },
      { field_name: "Tem size", type: 1 },
      { field_name: "Ngày thực hiện", type: 5 },
      { field_name: "Người nhận kho", type: 1 },
      { field_name: "Hạn hoàn thành", type: 5 },
      { field_name: "Trạng thái", type: 1 },
      { field_name: "Ghi chú", type: 1 },
    ],
  },
  {
    name: "Sản lượng và tiền công",
    key: "SANL",
    fields: [
      { field_name: "Mã NV", type: 1 },
      { field_name: "Họ tên", type: 1 },
      { field_name: "Bộ phận", type: 1 },
      { field_name: "Loại sản phẩm", type: 1 },
      { field_name: "Tổng SL đạt", type: 2 },
      { field_name: "Tổng SL lỗi", type: 2 },
      { field_name: "Đơn giá", type: 2 },
      { field_name: "Thành tiền", type: 2 },
      { field_name: "Tạm ứng", type: 2 },
      { field_name: "Khấu trừ", type: 2 },
      { field_name: "Thực nhận", type: 2 },
      { field_name: "Kế toán xác nhận", type: 1 },
      { field_name: "Người duyệt", type: 1 },
    ],
  },
];

type StepLog = { ts: string; msg: string; type: "info" | "success" | "error" | "warning" };

export default function LarkBaseManagerPage() {
  const { user } = useSession();
  const [hasUser, setHasUser] = useState(false);
  const [baseName, setBaseName] = useState("MIMIN ERP - Quản lý sản xuất may mặc");
  const [appToken, setAppToken] = useState("");
  const [tables, setTables] = useState<{ table_id: string; name: string; key: string; fieldCount: number }[]>([]);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setHasUser(!!hasUserToken());
    const saved = localStorage.getItem("mimin_lark_new_base");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAppToken(parsed.appToken || "");
      } catch {}
    }
  }, []);

  const addLog = (msg: string, type: StepLog["type"] = "info") => {
    setLogs((prev) => [
      { ts: new Date().toLocaleTimeString("vi-VN"), msg, type },
      ...prev,
    ].slice(0, 200));
  };

  const extractTokenFromUrl = (url: string): string => {
    // Match: /base/{token} or /sheets/{token}?sheet=...
    const m = url.match(/\/(base|sheets)\/([A-Za-z0-9]+)/);
    return m ? m[2] : url.trim();
  };

  const [urlInput, setUrlInput] = useState("");

  const createBase = async () => {
    if (!hasUser) {
      toast.error("Vui lòng Login với Lark trước");
      return;
    }
    setRunning(true);
    addLog(`📦 Tạo Base mới: ${baseName}...`, "info");
    try {
      const result = await createLarkBase(baseName, user);
      setAppToken(result.app_token);
      localStorage.setItem("mimin_lark_new_base", JSON.stringify({ appToken: result.app_token }));
      addLog(`✅ Tạo Base thành công! app_token: ${result.app_token}`, "success");
      addLog(`🔗 URL: ${result.url}`, "info");
      toast.success("Tạo Base thành công!");
    } catch (e: any) {
      addLog(`❌ ${e.message}`, "error");
      toast.error(e.message);
    } finally {
      setRunning(false);
    }
  };

  const loadTables = async () => {
    if (!appToken) {
      toast.error("Chưa có Base. Tạo Base trước.");
      return;
    }
    setRunning(true);
    try {
      const list = await listTables(appToken);
      const enriched = await Promise.all(
        list.map(async (t) => {
          const fields = await listFields(appToken, t.table_id).catch(() => []);
          return { ...t, key: "", fieldCount: fields.length };
        })
      );
      setTables(enriched);
      addLog(`📋 Tìm thấy ${list.length} bảng trong Base`, "info");
    } catch (e: any) {
      addLog(`❌ ${e.message}`, "error");
    } finally {
      setRunning(false);
    }
  };

  const createAllTables = async () => {
    if (!appToken) {
      toast.error("Chưa có Base. Tạo Base trước.");
      return;
    }
    if (!confirm(`Tạo ${TABLES_TO_CREATE.length} bảng với tổng cộng ${TABLES_TO_CREATE.reduce((s, t) => s + t.fields.length, 0)} fields?`)) return;

    setRunning(true);
    setLogs([]);
    addLog(`🚀 Bắt đầu tạo ${TABLES_TO_CREATE.length} bảng (dùng batch API)...`, "info");

    const created: { table_id: string; name: string; key: string; fieldCount: number }[] = [];

    try {
      // Bước 1: Batch tạo 9 bảng cùng lúc (1 API call)
      addLog(`📦 Batch tạo ${TABLES_TO_CREATE.length} bảng (1 API call)...`, "info");
      const tableNames = TABLES_TO_CREATE.map((t) => t.name);
      const tableIds = await batchCreateTables(appToken, tableNames, user);
      addLog(`✅ Batch thành công! Nhận ${tableIds.length} table_ids`, "success");

      const nameToId: Record<string, string> = {};
      TABLES_TO_CREATE.forEach((t, idx) => {
        if (tableIds[idx]) nameToId[t.name] = tableIds[idx];
      });

      // Bước 2: Batch tạo fields cho từng bảng
      for (const t of TABLES_TO_CREATE) {
        const tableId = nameToId[t.name];
        if (!tableId) {
          addLog(`⚠️ Bỏ qua ${t.name} (không có table_id)`, "warning");
          continue;
        }
        try {
          addLog(`📝 Batch tạo ${t.fields.length} fields cho ${t.name}...`, "info");
          const result = await batchCreateFields(appToken, tableId, t.fields, user);
          addLog(`  ✅ ${result.created}/${t.fields.length} fields OK`, "success");
          created.push({ table_id: tableId, name: t.name, key: t.key, fieldCount: result.created });
        } catch (e: any) {
          addLog(`❌ ${t.name} fields: ${e.message}`, "error");
        }
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch (e: any) {
      addLog(`❌ Batch tạo bảng thất bại: ${e.message}`, "error");
    }

    setTables(created);
    addLog(`\n🎉 HOÀN THÀNH! Tạo ${created.length}/${TABLES_TO_CREATE.length} bảng`, "success");
    toast.success("Tạo schema hoàn tất!");
    setRunning(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Database className="w-7 h-7 text-blue-500" /> Lark Base Manager
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Tạo Base mới + 9 bảng + 140 fields theo workflow chị Giàu (batch API - nhanh hơn 9 lần)
        </p>
      </div>

      {!hasUser ? (
        <div className="card p-6 text-center bg-amber-500/10 border-amber-500/30">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <h3 className="text-lg font-bold mb-2">Cần Login Lark (OAuth)</h3>
          <p className="text-sm opacity-70 mb-4">Cần User Access Token có quyền tạo base/table/field</p>
          <a href="/lark-login" className="btn-primary inline-flex items-center gap-2">
            Login với Lark ngay
          </a>
        </div>
      ) : (
        <>
          <div className="card p-4 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-700">✅ Đã có User Access Token</div>
              <div className="text-xs opacity-70">Có thể tạo Base + Tables + Fields (dùng batch API)</div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
              Tạo Base mới trên Lark
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                placeholder="Tên base"
              />
              <button
                onClick={createBase}
                disabled={running}
                className="btn-primary flex items-center gap-2"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Tạo Base
              </button>
            </div>
            {appToken && (
              <div className="mt-3 p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-sm">
                <div className="font-mono text-xs">app_token: <b>{appToken}</b></div>
                <div className="mt-1">
                  <a
                    href={`https://kjph64hnjkl5.jp.larksuite.com/base/${appToken}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 underline text-xs"
                  >
                    🔗 Mở Base trên Lark →
                  </a>
                </div>
              </div>
            )}
            <div className="mt-3 space-y-2">
              <label className="text-xs opacity-60">Hoặc paste URL Base Lark (a copy từ Lark → Share → Copy link):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => {
                    setUrlInput(e.target.value);
                    const token = extractTokenFromUrl(e.target.value);
                    if (token) {
                      setAppToken(token);
                      localStorage.setItem("mimin_lark_new_base", JSON.stringify({ appToken: token }));
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  placeholder="https://kjph64hnjkl5.jp.larksuite.com/base/XXXXXX"
                />
                {urlInput && (
                  <button
                    onClick={() => setUrlInput("")}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    ✕
                  </button>
                )}
              </div>
              {appToken && (
                <div className="text-[10px] opacity-50 font-mono">
                  → app_token: {appToken}
                </div>
              )}
            </div>
          </div>

          {appToken && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">2</span>
                  Tạo 9 bảng + {TABLES_TO_CREATE.reduce((s, t) => s + t.fields.length, 0)} fields (BATCH API)
                </h3>
                <div className="flex gap-2">
                  <button onClick={loadTables} className="btn-secondary text-xs">
                    <RefreshCw className="w-3 h-3" /> Load lại
                  </button>
                  <button onClick={createAllTables} disabled={running} className="btn-primary text-xs">
                    {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Batch tạo tất cả
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TABLES_TO_CREATE.map((t) => (
                  <div key={t.key} className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 text-xs">
                    <div className="font-mono font-bold text-blue-500">{t.key}</div>
                    <div className="opacity-80 truncate">{t.name}</div>
                    <div className="opacity-50 mt-0.5">{t.fields.length} fields</div>
                  </div>
                ))}
              </div>
              {tables.length > 0 && (
                <div className="mt-3 p-3 rounded bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-xs font-semibold mb-2">📋 Bảng đã tạo trên Lark:</div>
                  <div className="space-y-1">
                    {tables.map((t) => (
                      <div key={t.table_id} className="text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="font-mono">{t.table_id}</span>
                        <span>{t.name}</span>
                        <span className="opacity-50">({t.fieldCount} fields)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">3</span>
              Push 17 NV + {ALL_REAL_PHIEU.length} phiếu
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
                <div className="text-2xl font-bold text-blue-500">{REAL_NHAN_VIEN.length}</div>
                <div className="text-xs opacity-70">NV thật</div>
              </div>
              <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-900/20">
                <div className="text-2xl font-bold text-emerald-500">{ALL_REAL_PHIEU.length}</div>
                <div className="text-xs opacity-70">Phiếu workflow</div>
              </div>
              <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20">
                <div className="text-2xl font-bold text-amber-500">6</div>
                <div className="text-xs opacity-70">LSX</div>
              </div>
              <div className="p-3 rounded bg-violet-50 dark:bg-violet-900/20">
                <div className="text-2xl font-bold text-violet-500">7</div>
                <div className="text-xs opacity-70">Khâu</div>
              </div>
            </div>
            <div className="mt-3 text-xs opacity-70">
              → Dùng trang <a href="/test-real-data" className="text-blue-500 underline">Test Data Thật</a> để push từng phiếu.
            </div>
          </div>

          {logs.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-2">📜 Logs ({logs.length})</h3>
              <div className="bg-slate-900 dark:bg-black rounded p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div
                    key={i}
                    className={
                      log.type === "success" ? "text-emerald-400" :
                      log.type === "error" ? "text-red-400" :
                      log.type === "warning" ? "text-amber-400" :
                      "text-slate-300"
                    }
                  >
                    <span className="opacity-50">[{log.ts}]</span> {log.msg}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
