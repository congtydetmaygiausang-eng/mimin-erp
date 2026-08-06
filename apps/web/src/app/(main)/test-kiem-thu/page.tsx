"use client";
import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, AlertCircle, Play, RefreshCw, FileText,
  Database, ChevronRight, Activity, Layers, Sparkles, BarChart3,
} from "lucide-react";
import { AdminOnly } from "@/components/AdminOnly";

const TEST_CASES = [
  // 1. Master Data
  { id: "01", group: "Master Data", name: "Trang Master Data hub", url: "/master-data/", check: ["NCC", "KH sỉ", "Xưởng", "16", "12", "5"] },
  { id: "02", group: "Master Data", name: "Đối tác gia công (35)", url: "/doi-tac-gia-cong/", check: ["35", "GC-IN", "GC-TRON"] },

  // 2. Sản xuất
  { id: "03", group: "Sản xuất", name: "Lệnh cắt (6 LSX thật)", url: "/lenh-cat/", check: ["LSX-2026-001", "M758", "Bộ trụ trơn", "500"] },
  { id: "04", group: "Sản xuất", name: "Kế hoạch SX", url: "/ke-hoach-san-xuat/", check: ["Kế hoạch", "LSX"] },
  { id: "05", group: "Sản xuất", name: "Workflow", url: "/workflow/", check: ["workflow", "công đoạn"] },
  { id: "06", group: "Sản xuất", name: "May", url: "/may/", check: ["May"] },
  { id: "07", group: "Sản xuất", name: "Hoàn thiện", url: "/hoan-thien/", check: ["Hoàn thiện", "Ủi"] },
  { id: "08", group: "Sản xuất", name: "QC", url: "/qc/", check: ["QC", "lỗi"] },
  { id: "09", group: "Sản xuất", name: "Tổng hợp công đoạn", url: "/tong-hop-cong-doan/", check: ["công đoạn"] },
  { id: "10", group: "Sản xuất", name: "Lệnh tổng", url: "/lenh-tong/", check: ["Lệnh tổng"] },
  { id: "11", group: "Sản xuất", name: "Sản xuất ERP", url: "/san-xuat-erp/", check: ["Sản xuất"] },

  // 3. Sợi - Dệt - Nhuộm
  { id: "12", group: "Sợi-Dệt-Nhuộm", name: "Kho sợi - dây chuyền", url: "/kho-soi-day-chuyen/", check: ["sợi", "dây chuyền"] },
  { id: "13", group: "Sợi-Dệt-Nhuộm", name: "Kho vải Tinh Mần", url: "/kho-vai-tinhmann/", check: ["vải"] },
  { id: "14", group: "Sợi-Dệt-Nhuộm", name: "Kho phụ liệu", url: "/kho-phu-lieu/", check: ["phụ liệu"] },
  { id: "15", group: "Sợi-Dệt-Nhuộm", name: "Sợi dệt nhuộm ERP", url: "/soi-det-nhuom-erp/", check: ["Sợi", "Dệt", "Nhuộm"] },
  { id: "16", group: "Sợi-Dệt-Nhuộm", name: "Sơ đồ dệt nhuộm", url: "/so-det-nhuom/", check: ["sơ đồ"] },
  { id: "17", group: "Sợi-Dệt-Nhuộm", name: "Flow tổng quan", url: "/flow-tong-quan/", check: ["flow", "tổng quan"] },
  { id: "18", group: "Sợi-Dệt-Nhuộm", name: "Dệt nhuộm flow", url: "/det-nhuom-flow/", check: ["dệt nhuộm"] },
  { id: "19", group: "Sợi-Dệt-Nhuộm", name: "Mini sợi dệt", url: "/mini-soi-det/", check: ["sợi dệt"] },

  // 4. Kho
  { id: "20", group: "Kho", name: "Kho thành phẩm", url: "/kho-thanh-pham/", check: ["thành phẩm"] },
  { id: "21", group: "Kho", name: "Giao hàng", url: "/giao-hang/", check: ["giao hàng"] },
  { id: "22", group: "Kho", name: "Gia công ngoài", url: "/gia-cong-ngoai/", check: ["gia công"] },

  // 5. Bán hàng - KH
  { id: "23", group: "Bán hàng", name: "Khách hàng", url: "/khach-hang/", check: ["Khách hàng"] },
  { id: "24", group: "Bán hàng", name: "Đơn hàng", url: "/don-hang/", check: ["Đơn hàng"] },
  { id: "25", group: "Bán hàng", name: "Nhà cung cấp", url: "/nha-cung-cap/", check: ["Nhà cung cấp"] },

  // 6. Kế toán - Lương
  { id: "26", group: "Kế toán", name: "Bảng lương", url: "/bang-luong/", check: ["lương"] },
  { id: "27", group: "Kế toán", name: "Bảng lương tự động", url: "/bang-luong-auto/", check: ["Tiền công", "Thực nhận"] },
  { id: "28", group: "Kế toán", name: "Công nợ", url: "/cong-no/", check: ["Công nợ"] },

  // 7. Nhân sự - Phân quyền
  { id: "29", group: "Nhân sự", name: "Nhân viên (18 NV thật)", url: "/nhan-su/", check: ["NV001", "NV018", "Chị Giàu"] },
  { id: "30", group: "Nhân sự", name: "Quản lý tài khoản", url: "/quan-ly-tai-khoan/", check: ["tài khoản"] },
  { id: "31", group: "Nhân sự", name: "Phân quyền của tôi", url: "/phan-quyen-cua-toi/", check: ["phân quyền"] },
  { id: "32", group: "Nhân sự", name: "Kiến trúc phân quyền", url: "/kien-truc-phan-quyen/", check: ["kiến trúc"] },
  { id: "33", group: "Nhân sự", name: "Mô hình chuẩn MIMIN OS", url: "/mohinh-phan-quyen-chuan/", check: ["vai trò", "data scope"] },
  { id: "34", group: "Nhân sự", name: "Chấm công", url: "/cham-cong/", check: ["chấm công"] },
  { id: "35", group: "Nhân sự", name: "Audit log", url: "/audit-log/", check: ["audit"] },
  { id: "36", group: "Nhân sự", name: "Role workspaces", url: "/role-workspaces/", check: ["workspace"] },

  // 8. UI Mobile
  { id: "37", group: "UI Mobile", name: "UI Công nhân Cắt", url: "/ui-cat/", check: ["Module Cắt", "Cần làm", "+10"] },
  { id: "38", group: "UI Mobile", name: "UI Khuy nút", url: "/ui-khuy-nut/", check: ["Khuy nút", "750"] },
  { id: "39", group: "UI Mobile", name: "UI Ủi", url: "/ui-ui/", check: ["Ủi"] },
  { id: "40", group: "UI Mobile", name: "UI Đóng gói", url: "/ui-dong-goi/", check: ["Đóng gói"] },
  { id: "41", group: "UI Mobile", name: "Test 32 user", url: "/test-phan-quyen/", check: ["32", "Anh Sang", "CN"] },

  // 9. Tính năng mới
  { id: "42", group: "Tính năng", name: "LSX M758 demo workflow", url: "/lsx-m758-demo/", check: ["LSX-2026-001", "7 khâu"] },
  { id: "43", group: "Tính năng", name: "Cảnh báo real-time", url: "/canh-bao/", check: ["Cảnh báo", "Kho sắp hết"] },
  { id: "44", group: "Tính năng", name: "Backup & Restore", url: "/backup-restore/", check: ["Backup", "27 keys"] },
  { id: "45", group: "Tính năng", name: "Supabase Status", url: "/supabase-status/", check: ["Supabase"] },
  { id: "46", group: "Tính năng", name: "Real-time Dashboard", url: "/realtime/", check: ["realtime"] },
  { id: "47", group: "Tính năng", name: "Profile", url: "/profile/", check: ["profile"] },

  // 10. Lark
  { id: "48", group: "Lark", name: "Lark settings", url: "/lark-settings/", check: ["Lark"] },
  { id: "49", group: "Lark", name: "Lark login", url: "/lark-login/", check: ["Lark"] },
  { id: "50", group: "Lark", name: "Lark sync engine", url: "/lark-sync-engine/", check: ["sync"] },
  { id: "51", group: "Lark", name: "Lark sheet import", url: "/lark-sheet-import/", check: ["sheet"] },
  { id: "52", group: "Lark", name: "Lark auto setup", url: "/lark-auto-setup/", check: ["auto"] },
  { id: "53", group: "Lark", name: "Lark base manager", url: "/lark-base-manager/", check: ["base"] },
  { id: "54", group: "Lark", name: "Lark sync overview", url: "/lark-sync-overview/", check: ["overview"] },
];

export default function TestKiemThuPage() {
  const [results, setResults] = useState<Record<string, { ok: boolean; size: number; matches: string[] }>>({});
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);

  const runTest = async (id: string, url: string, keywords: string[]) => {
    try {
      const resp = await fetch(url, { method: "GET", credentials: "include" });
      const html = await resp.text();
      const matches: string[] = [];
      for (const k of keywords) {
        if (html.includes(k)) matches.push(k);
      }
      const ok = resp.status === 200 && matches.length >= Math.min(2, keywords.length);
      return { ok, size: html.length, matches };
    } catch {
      return { ok: false, size: 0, matches: [] };
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setProgress(0);
    const newResults: any = {};
    for (let i = 0; i < TEST_CASES.length; i++) {
      const tc = TEST_CASES[i];
      const r = await runTest(tc.id, tc.url, tc.check);
      newResults[tc.id] = r;
      setProgress(Math.round(((i + 1) / TEST_CASES.length) * 100));
      setResults({ ...newResults });
    }
    setTesting(false);
  };

  const grouped = TEST_CASES.reduce((acc, tc) => {
    if (!acc[tc.group]) acc[tc.group] = [];
    acc[tc.group].push(tc);
    return acc;
  }, {} as Record<string, typeof TEST_CASES>);

  const passed = Object.values(results).filter((r: any) => r.ok).length;
  const total = TEST_CASES.length;

  return (
    <AdminOnly>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-3 md:p-5">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" /> MIMIN OS · Kiểm thử tự động
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">🧪 Test {TEST_CASES.length} modules</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Click <b>"Chạy tất cả"</b> để tự động kiểm tra trạng thái + nội dung của từng module.
            Kết quả dựa trên HTTP status + keyword matching.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{total}</div><div className="opacity-90">Tổng test</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold text-emerald-200">{passed}</div><div className="opacity-90">Đã chạy</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold text-emerald-200">{Object.values(results).filter((r: any) => r.ok).length}</div><div className="opacity-90">Pass</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold text-rose-200">{Object.values(results).filter((r: any) => !r.ok).length}</div><div className="opacity-90">Fail</div></div>
          </div>
        </div>

        {/* Action */}
        <div className="card p-4 flex gap-2">
          <button
            onClick={runAllTests}
            disabled={testing}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang test... {progress}%
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Chạy tất cả {TEST_CASES.length} test
              </>
            )}
          </button>
        </div>

        {/* Progress bar */}
        {testing && (
          <div className="card p-3">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {/* Results by group */}
        {Object.entries(grouped).map(([group, tcs]) => {
          const groupPassed = tcs.filter((tc) => (results as any)[tc.id]?.ok).length;
          return (
            <div key={group} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> {group}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                  {groupPassed}/{tcs.length} pass
                </span>
              </div>
              <div className="space-y-1.5">
                {tcs.map((tc) => {
                  const r = (results as any)[tc.id];
                  return (
                    <a
                      key={tc.id}
                      href={tc.url}
                      target="_blank"
                      className={`block p-2.5 rounded border text-xs flex items-center gap-2 hover:shadow transition ${
                        !r ? "bg-slate-50 border-slate-200" :
                        r.ok ? "bg-emerald-50 border-emerald-300" :
                        "bg-rose-50 border-rose-300"
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-500 w-6">{tc.id}</span>
                      <span className="flex-1 truncate">{tc.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{tc.url}</span>
                      {r ? (
                        r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> :
                              <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </AdminOnly>
  );
}
