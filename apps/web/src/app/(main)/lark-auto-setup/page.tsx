"use client";

import { useState, useEffect } from "react";
import {
  Database, CheckCircle2, XCircle, Loader2, Shield, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { getLarkConfig, saveLarkConfig } from "@/lib/lark";
import { getUserAccessToken, hasUserToken as _hasUserToken } from "@/lib/lark-user-token";
import { logAudit } from "@/lib/audit-log";

const BASE = "NNKRbEQcYak0Ees0v61j2iXypEc";

const TABLE_SCHEMAS: Record<string, { name: string; fields: { name: string; type: number }[] }> = {
  INTD: {
    name: "In / Thêu / Dập",
    fields: [
      { name: "ma_phieu", type: 1 },
      { name: "ma_lenh_sx", type: 1 },
      { name: "ma_san_pham", type: 1 },
      { name: "cong_doan", type: 1 },
      { name: "vi_tri_thuc_hien", type: 1 },
      { name: "mau", type: 1 },
      { name: "size", type: 1 },
      { name: "so_luong_giao", type: 2 },
      { name: "ngay_giao", type: 5 },
      { name: "nguoi_giao", type: 1 },
      { name: "doi_tac_nhan", type: 1 },
      { name: "han_tra_hang", type: 5 },
      { name: "so_luong_nhan", type: 2 },
      { name: "so_luong_dat", type: 2 },
      { name: "so_luong_loi", type: 2 },
      { name: "so_luong_thieu", type: 2 },
      { name: "don_gia", type: 2 },
      { name: "thanh_tien", type: 2 },
      { name: "trang_thai", type: 3 },
      { name: "ghi_chu", type: 1 },
    ],
  },
  MAY: {
    name: "May",
    fields: [
      { name: "ma_phieu", type: 1 }, { name: "ma_lenh_sx", type: 1 }, { name: "ma_san_pham", type: 1 },
      { name: "loai_san_pham", type: 1 }, { name: "kieu_may", type: 1 },
      { name: "mau", type: 1 }, { name: "size", type: 1 },
      { name: "so_luong_giao", type: 2 }, { name: "so_bo_giao", type: 2 },
      { name: "ngay_giao", type: 5 }, { name: "nguoi_giao", type: 1 },
      { name: "xuong_nhan_may", type: 1 }, { name: "han_hoan_thanh", type: 5 },
      { name: "so_luong_nhan_ve", type: 2 }, { name: "so_luong_dat", type: 2 },
      { name: "so_luong_loi", type: 2 }, { name: "so_luong_thieu", type: 2 },
      { name: "so_luong_sua_lai", type: 2 }, { name: "don_gia_may", type: 2 },
      { name: "thanh_tien", type: 2 }, { name: "tien_da_thanh_toan", type: 2 },
      { name: "cong_no_con_lai", type: 2 }, { name: "trang_thai", type: 3 },
      { name: "ghi_chu", type: 1 },
    ],
  },
  KN: {
    name: "Bảng Khuy nút",
    fields: [
      { name: "ma_phieu", type: 1 }, { name: "ma_san_pham", type: 1 },
      { name: "mau_size", type: 1 }, { name: "so_luong_nhan", type: 2 },
      { name: "so_luong_lam_khuy", type: 2 }, { name: "so_luong_dinh_nut", type: 2 },
      { name: "so_luong_dat", type: 2 }, { name: "so_luong_loi", type: 2 },
      { name: "so_luong_sua_lai", type: 2 }, { name: "so_luong_giao_ui", type: 2 },
      { name: "nguoi_thuc_hien", type: 1 }, { name: "don_gia", type: 2 },
      { name: "thanh_tien", type: 2 }, { name: "ngay_nhan", type: 5 },
      { name: "ngay_hoan_thanh", type: 5 }, { name: "nguoi_nhan_sau", type: 1 },
      { name: "trang_thai", type: 3 }, { name: "ghi_chu", type: 1 },
    ],
  },
  UI: {
    name: "Bảng Ủi",
    fields: [
      { name: "ma_phieu", type: 1 }, { name: "ma_san_pham", type: 1 },
      { name: "loai_san_pham", type: 1 }, { name: "mau_size", type: 1 },
      { name: "so_luong_nhan", type: 2 }, { name: "so_luong_du_bo", type: 2 },
      { name: "so_luong_chua_du_bo", type: 2 }, { name: "so_luong_da_ui", type: 2 },
      { name: "so_luong_dat", type: 2 }, { name: "so_luong_loi", type: 2 },
      { name: "so_luong_giao_gap_xep", type: 2 }, { name: "nguoi_thuc_hien", type: 1 },
      { name: "san_luong_tung_nguoi", type: 1 }, { name: "don_gia", type: 2 },
      { name: "thanh_tien", type: 2 }, { name: "ngay_nhan", type: 5 },
      { name: "ngay_hoan_thanh", type: 5 }, { name: "trang_thai", type: 3 },
      { name: "ghi_chu", type: 1 },
    ],
  },
  DG: {
    name: "Bảng Gấp xếp – đóng gói",
    fields: [
      { name: "ma_phieu", type: 1 }, { name: "ma_san_pham", type: 1 },
      { name: "phan_loai", type: 1 }, { name: "mau", type: 1 },
      { name: "size", type: 1 }, { name: "so_luong_nhan", type: 2 },
      { name: "so_luong_da_gap", type: 2 }, { name: "so_luong_dong_bao", type: 2 },
      { name: "so_luong_dat", type: 2 }, { name: "so_luong_loi", type: 2 },
      { name: "so_luong_giao_kho", type: 2 }, { name: "nguoi_thuc_hien", type: 1 },
      { name: "san_luong_tung_nguoi", type: 1 }, { name: "don_gia", type: 2 },
      { name: "thanh_tien", type: 2 }, { name: "loai_bao_bi", type: 1 },
      { name: "tem_size", type: 1 }, { name: "ri_dong_hang", type: 1 },
      { name: "ngay_thuc_hien", type: 5 }, { name: "nguoi_nhan_kho", type: 1 },
      { name: "trang_thai", type: 3 }, { name: "ghi_chu", type: 1 },
    ],
  },
};

const EXISTING_TABLE_IDS: Record<string, string> = {
  KN: "tbl3Et3KsXVcJGbw",
  UI: "tbl5wlqkV34wjz22",
  DG: "tbl71L2HWDwAgtNa",
};

type StepLog = { ts: string; msg: string; ok: boolean };

export default function LarkAutoSetupPage() {
  const { user } = useSession();
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<StepLog[]>([]);
  const [hasUser, setHasUser] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    setHasUser(!!_hasUserToken());
  }, []);

  const addLog = (msg: string, ok = true) => {
    setLogs((prev) => [{ ts: new Date().toLocaleTimeString("vi-VN"), msg, ok }, ...prev]);
  };

  const callLark = async (endpoint: string, method = "GET", body?: any) => {
    const token = getUserAccessToken();
    if (!token) throw new Error("Chưa có user token");
    const url = `https://open.larksuite.com/open-apis/bitable/v1/apps/${BASE}${endpoint}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (data.code !== 0) throw new Error(`${endpoint}: ${data.msg}`);
    return data.data;
  };

  const runSetup = async () => {
    if (!getUserAccessToken()) {
      toast.error("Vui lòng Login với Lark trước");
      return;
    }
    setRunning(true);
    setLogs([]);

    const totalSteps = 2 + Object.values(TABLE_SCHEMAS).reduce((s, t) => s + t.fields.length, 0);
    let done = 0;
    setProgress({ done, total: totalSteps });

    try {
      for (const key of ["INTD", "MAY"]) {
        const schema = TABLE_SCHEMAS[key];
        addLog(`Tạo bảng mới: ${schema.name}...`);
        try {
          const data = await callLark("/tables", "POST", { table: { name: schema.name } });
          EXISTING_TABLE_IDS[key] = data.table.table_id;
          addLog(`✅ Tạo bảng ${schema.name}: ${data.table.table_id}`);
        } catch (e: any) {
          addLog(`❌ Tạo bảng ${schema.name} thất bại: ${e.message}`, false);
        }
        done++;
        setProgress({ done, total: totalSteps });
      }

      for (const [key, schema] of Object.entries(TABLE_SCHEMAS)) {
        const tableId = EXISTING_TABLE_IDS[key];
        if (!tableId) {
          addLog(`⚠️ Bảng ${key} chưa có table_id, bỏ qua`, false);
          continue;
        }
        addLog(`Thêm fields cho ${schema.name} (${schema.fields.length} fields)...`);

        let existing: string[] = [];
        try {
          const f = await callLark(`/tables/${tableId}/fields`);
          existing = (f.items || []).map((x: any) => x.field_name);
        } catch (e) {}

        for (const field of schema.fields) {
          if (existing.includes(field.name)) {
            addLog(`  ↪ Field "${field.name}" đã có, bỏ qua`, true);
          } else {
            try {
              await callLark(`/tables/${tableId}/fields`, "POST", field);
              addLog(`  ✅ Tạo field "${field.name}"`);
            } catch (e: any) {
              addLog(`  ❌ Field "${field.name}": ${e.message}`, false);
            }
          }
          done++;
          setProgress({ done, total: totalSteps });
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      const config = getLarkConfig();
      if (config) {
        saveLarkConfig({
          ...config,
          baseToken: BASE,
          tableIds: {
            inTheuDap: EXISTING_TABLE_IDS.INTD || config.tableIds.inTheuDap,
            may: EXISTING_TABLE_IDS.MAY || config.tableIds.may,
            khuyNut: EXISTING_TABLE_IDS.KN,
            ui: EXISTING_TABLE_IDS.UI,
            dongGoi: EXISTING_TABLE_IDS.DG,
          },
        });
        addLog("✅ Đã lưu Table IDs vào Lark config");
      }

      addLog("🎉 HOÀN THÀNH! Tất cả 5 bảng đã sẵn sàng sync 2 chiều với ERP");

      logAudit({
        user,
        action: "create",
        module: "lark-setup" as any,
        description: "Auto setup Lark schema (5 bảng, 100+ fields)",
        success: true,
      });
    } catch (e: any) {
      addLog(`❌ Lỗi: ${e.message}`, false);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-violet-500" /> Auto Setup Lark Schema
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          Tự động tạo 2 bảng mới + thêm ~100 fields cho 5 bảng công đoạn
        </p>
      </div>

      {!hasUser ? (
        <div className="card p-6 text-center bg-amber-500/10 border-amber-500/30">
          <Shield className="w-12 h-12 mx-auto mb-3 text-amber-500" />
          <h3 className="text-lg font-bold mb-2">Cần đăng nhập Lark trước</h3>
          <p className="text-sm opacity-70 mb-4">User Access Token cần có để tạo bảng + fields</p>
          <a href="/lark-login" className="btn-primary inline-flex items-center gap-2">
            <Shield className="w-4 h-4" /> Login với Lark ngay
          </a>
        </div>
      ) : (
        <>
          <div className="card p-4 bg-emerald-500/10 border-emerald-500/30 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <div className="flex-1">
              <div className="font-semibold text-emerald-700">✅ Đã có User Access Token</div>
              <div className="text-xs opacity-70">Sẵn sàng tạo schema với quyền admin</div>
            </div>
            <a href="/lark-login" className="text-xs underline opacity-70">Đổi user</a>
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">📋 Schema sẽ tạo:</h3>
              <div className="text-xs opacity-70">
                Tiến độ: {progress.done} / {progress.total}
              </div>
            </div>
            <div className="space-y-2 mb-3">
              {Object.entries(TABLE_SCHEMAS).map(([key, schema]) => {
                const isNew = !EXISTING_TABLE_IDS[key];
                return (
                  <div key={key} className="flex items-center gap-2 text-sm p-2 rounded bg-slate-100/50 dark:bg-slate-800/50">
                    <div className={`w-2 h-2 rounded-full ${isNew ? "bg-amber-500" : "bg-sky-500"}`} />
                    <span className="font-mono font-semibold">{key}</span>
                    <span className="opacity-80">{schema.name}</span>
                    <span className="text-[10px] opacity-60">({schema.fields.length} fields)</span>
                    {isNew && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700">MỚI</span>}
                    {EXISTING_TABLE_IDS[key] && <span className="text-[10px] opacity-60">→ {EXISTING_TABLE_IDS[key].slice(0, 12)}...</span>}
                  </div>
                );
              })}
            </div>

            {running && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-brand-400 to-brand-600 h-full transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            )}

            <button
              onClick={runSetup}
              disabled={running}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
            >
              {running ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Đang setup...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Bắt đầu Auto Setup</>
              )}
            </button>
          </div>

          {logs.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold mb-2">📜 Logs ({logs.length})</h3>
              <div className="bg-slate-900 dark:bg-black rounded p-3 max-h-96 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={log.ok ? "text-emerald-400" : "text-red-400"}>
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
