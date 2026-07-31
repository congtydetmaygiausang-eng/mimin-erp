"use client";

import { useState, useEffect } from "react";
import {
  Database, RefreshCw, Settings, BarChart3, Activity, CheckCircle2, XCircle, AlertTriangle,
  Play, Pause, Trash2, Plus, Edit, Eye, Download, Upload, Link2, Zap, Clock, TrendingUp,
  Users, Package, FileSpreadsheet, ArrowRight, Search, Filter, ChevronRight, Sparkles, Server, FileText
} from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "tables" | "fields" | "sync" | "logs";

interface LarkTable {
  id: string;
  name: string;
  recordCount: number;
  lastSync: string;
  status: "synced" | "pending" | "error";
  localMapping: string; // MIMIN module
  larkUrl: string;
}

interface LarkField {
  id: string;
  larkField: string;
  larkType: string;
  localField: string;
  localType: string;
  mapped: boolean;
  required: boolean;
}

interface SyncLog {
  id: string;
  time: string;
  type: "push" | "pull" | "error" | "info";
  table: string;
  record: string;
  status: "success" | "failed" | "pending";
  message: string;
}

const MOCK_TABLES: LarkTable[] = [
  { id: "tblCAT", name: "Phiếu Cắt (CAT_)", recordCount: 32, lastSync: "2 phút trước", status: "synced", localMapping: "lenh_cat.cat", larkUrl: "https://larksuite.com/base/xxx/tblCAT" },
  { id: "tblINTD", name: "In/Thêu/Dập (INTD_)", recordCount: 28, lastSync: "5 phút trước", status: "synced", localMapping: "tasks.intd", larkUrl: "https://larksuite.com/base/xxx/tblINTD" },
  { id: "tblMAY", name: "Tổ May (MAY_)", recordCount: 35, lastSync: "1 phút trước", status: "synced", localMapping: "tasks.may", larkUrl: "https://larksuite.com/base/xxx/tblMAY" },
  { id: "tblKN", name: "Khuy Nút (KN_)", recordCount: 24, lastSync: "3 phút trước", status: "synced", localMapping: "tasks.khuy-nut", larkUrl: "https://larksuite.com/base/xxx/tblKN" },
  { id: "tblUI", name: "Ủi (UI_)", recordCount: 18, lastSync: "10 phút trước", status: "pending", localMapping: "tasks.ui", larkUrl: "https://larksuite.com/base/xxx/tblUI" },
  { id: "tblDG", name: "Đóng Gói (DG_)", recordCount: 22, lastSync: "4 phút trước", status: "synced", localMapping: "tasks.dong-goi", larkUrl: "https://larksuite.com/base/xxx/tblDG" },
  { id: "tblNCC", name: "Nhà Cung Cấp", recordCount: 16, lastSync: "1 giờ trước", status: "synced", localMapping: "nha_cung_cap", larkUrl: "https://larksuite.com/base/xxx/tblNCC" },
  { id: "tblKH", name: "Khách Hàng Sỉ", recordCount: 12, lastSync: "1 giờ trước", status: "synced", localMapping: "khach_hang_si", larkUrl: "https://larksuite.com/base/xxx/tblKH" },
  { id: "tblKho", name: "Kho (Vải/Sợi/PL)", recordCount: 87, lastSync: "30 phút trước", status: "error", localMapping: "kho", larkUrl: "https://larksuite.com/base/xxx/tblKho" },
];

const MOCK_FIELDS: LarkField[] = [
  { id: "1", larkField: "Mã SP", larkType: "Text", localField: "maSP", localType: "string", mapped: true, required: true },
  { id: "2", larkField: "Tên SP", larkType: "Text", localField: "tenSP", localType: "string", mapped: true, required: true },
  { id: "3", larkField: "Số lượng", larkType: "Number", localField: "soLuong", localType: "number", mapped: true, required: true },
  { id: "4", larkField: "Trạng thái", larkType: "Select", localField: "trangThai", localType: "enum", mapped: true, required: false },
  { id: "5", larkField: "Ngày tạo", larkType: "DateTime", localField: "ngayTao", localType: "date", mapped: true, required: false },
  { id: "6", larkField: "Hạn hoàn thành", larkType: "Date", localField: "hanHoanThanh", localType: "date", mapped: true, required: false },
  { id: "7", larkField: "Người phụ trách", larkType: "Person", localField: "nguoiPhuTrach", localType: "user_id", mapped: true, required: false },
  { id: "8", larkField: "Ghi chú", larkType: "Text", localField: "ghiChu", localType: "string", mapped: true, required: false },
  { id: "9", larkField: "Ảnh", larkType: "Attachment", localField: "images", localType: "string[]", mapped: false, required: false },
  { id: "10", larkField: "Lark Record ID", larkType: "Auto Number", localField: "larkRecordId", localType: "string", mapped: true, required: false },
];

const MOCK_LOGS: SyncLog[] = [
  { id: "1", time: "12:34:56", type: "push", table: "tblMAY", record: "MAY_007", status: "success", message: "Pushed 1 record to Lark" },
  { id: "2", time: "12:34:30", type: "pull", table: "tblCAT", record: "CAT_005", status: "success", message: "Pulled 3 fields from Lark" },
  { id: "3", time: "12:33:15", type: "error", table: "tblKho", record: "KHO_VAI_023", status: "failed", message: "Field 'donGia' mismatch (number vs text)" },
  { id: "4", time: "12:32:00", type: "push", table: "tblINTD", record: "INTD_012", status: "success", message: "Updated trangThai = 'Hoàn thành'" },
  { id: "5", time: "12:30:45", type: "info", table: "tblDG", record: "—", status: "success", message: "Auto-sync triggered by cron" },
  { id: "6", time: "12:28:12", type: "pull", table: "tblNCC", record: "NCC-005", status: "success", message: "Pulled Phú Long updated" },
  { id: "7", time: "12:25:00", type: "push", table: "tblKH", record: "KH-008", status: "success", message: "New KH created" },
  { id: "8", time: "12:20:00", type: "error", table: "tblKho", record: "KHO_SOI_010", status: "failed", message: "Connection timeout (30s)" },
];

export default function LarkControlCenter() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);

  // Auto-refresh mỗi 30s
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live logs
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncAll = async () => {
    setSyncing(true);
    toast.info("Đang đồng bộ tất cả...");
    await new Promise((r) => setTimeout(r, 3000));
    setSyncing(false);
    toast.success("✅ Đồng bộ 274 records thành công!");
  };

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-sky-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600 text-white p-5 md:p-7 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> MIMIN ERP · Lark Control Center
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">🎛️ Lark Control Center</h1>
              <p className="text-sm opacity-95 mt-1 max-w-3xl">
                Quản lý đồng bộ Lark Base real-time. 9 tables, 274 records, 8/9 tables synced.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                autoSync ? "bg-emerald-500/30 backdrop-blur" : "bg-slate-500/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${autoSync ? "bg-emerald-300 animate-pulse" : "bg-slate-300"}`} />
                {autoSync ? "Auto-sync ON" : "Auto-sync OFF"}
              </span>
              <button
                onClick={() => setAutoSync(!autoSync)}
                className="px-3 py-1.5 bg-white/20 backdrop-blur rounded-lg text-xs font-semibold"
              >
                {autoSync ? "Tắt" : "Bật"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">9</div>
              <div className="opacity-90">Tables</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold">274</div>
              <div className="opacity-90">Records</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold text-emerald-300">8/9</div>
              <div className="opacity-90">Synced</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold text-amber-300">1</div>
              <div className="opacity-90">Pending</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5">
              <div className="text-xl md:text-2xl font-bold text-rose-300">1</div>
              <div className="opacity-90">Error</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card p-1 flex overflow-x-auto">
          {[
            { k: "overview" as Tab, l: "Tổng quan", icon: BarChart3 },
            { k: "tables" as Tab, l: "Tables", icon: Database, count: 9 },
            { k: "fields" as Tab, l: "Field Mapping", icon: Settings, count: 10 },
            { k: "sync" as Tab, l: "Sync Engine", icon: RefreshCw },
            { k: "logs" as Tab, l: "Logs", icon: FileText, count: 8 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  tab === t.k
                    ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.l}
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${
                    tab === t.k ? "bg-white/30" : "bg-slate-200"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === "overview" && <OverviewTab handleSyncAll={handleSyncAll} syncing={syncing} />}
        {tab === "tables" && <TablesTab search={search} setSearch={setSearch} filterStatus={filterStatus} setFilterStatus={setFilterStatus} />}
        {tab === "fields" && <FieldsTab search={search} setSearch={setSearch} />}
        {tab === "sync" && <SyncTab />}
        {tab === "logs" && <LogsTab />}
      </div>
    </div>
  );
}

// =================== OVERVIEW ===================
function OverviewTab({ handleSyncAll, syncing }: any) {
  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-500" /> Sync Status
            </h3>
            <span className="text-2xl">🟢</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái:</span>
              <span className="font-semibold text-emerald-600">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last sync:</span>
              <span className="font-semibold">2 phút trước</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Auto interval:</span>
              <span className="font-semibold">5 phút</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode:</span>
              <span className="font-semibold">2-way</span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> 24h Activity
            </h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Push:</span>
              <span className="font-semibold text-blue-600">142 records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pull:</span>
              <span className="font-semibold text-emerald-600">87 records</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Errors:</span>
              <span className="font-semibold text-rose-600">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Avg latency:</span>
              <span className="font-semibold">245ms</span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Actions
            </h3>
          </div>
          <div className="space-y-1.5">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="w-full px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {syncing ? "Đang sync..." : "Sync all tables ngay"}
            </button>
            <button className="w-full px-3 py-2 bg-sky-50 text-sky-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
              <Settings className="w-3.5 h-3.5" /> Cấu hình
            </button>
            <button className="w-full px-3 py-2 bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Export log
            </button>
          </div>
        </div>
      </div>

      {/* Activity chart (mock) */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-sky-500" /> Hoạt động 24 giờ qua
        </h3>
        <div className="grid grid-cols-24 gap-1 h-32">
          {Array.from({ length: 24 }).map((_, h) => {
            const height = 30 + Math.random() * 70;
            return (
              <div key={h} className="flex flex-col justify-end items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-sky-400 to-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
                <div className="text-[8px] text-slate-500">{h}h</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-sky-500 rounded" />
            <span>Push</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-emerald-500 rounded" />
            <span>Pull</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-rose-500 rounded" />
            <span>Errors</span>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-500" /> Hoạt động gần đây
        </h3>
        <div className="space-y-2">
          {MOCK_LOGS.slice(0, 5).map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =================== TABLES ===================
function TablesTab({ search, setSearch, filterStatus, setFilterStatus }: any) {
  const filtered = MOCK_TABLES.filter((t) => {
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      <div className="card p-3 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm table..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-sky-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tất cả</option>
          <option value="synced">🟢 Synced</option>
          <option value="pending">🟡 Pending</option>
          <option value="error">🔴 Error</option>
        </select>
        <button className="px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Thêm table
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 text-sky-900">
              <tr>
                <th className="p-2 text-left">Table</th>
                <th className="p-2 text-left">Lark URL</th>
                <th className="p-2 text-left">MIMIN Mapping</th>
                <th className="p-2 text-right">Records</th>
                <th className="p-2 text-left">Last Sync</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-t hover:bg-sky-50/30">
                  <td className="p-2 font-mono font-bold text-sky-700">{t.id}</td>
                  <td className="p-2">
                    <div className="font-semibold">{t.name}</div>
                    <a href={t.larkUrl} target="_blank" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1">
                      <Link2 className="w-2.5 h-2.5" /> Mở Lark
                    </a>
                  </td>
                  <td className="p-2 text-xs font-mono">{t.localMapping}</td>
                  <td className="p-2 text-right font-bold">{t.recordCount}</td>
                  <td className="p-2 text-xs text-slate-500">{t.lastSync}</td>
                  <td className="p-2 text-center">
                    {t.status === "synced" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">Synced</span>}
                    {t.status === "pending" && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">Pending</span>}
                    {t.status === "error" && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold">Error</span>}
                  </td>
                  <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1 hover:bg-sky-100 rounded" title="Sync ngay">
                        <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                      </button>
                      <button className="p-1 hover:bg-blue-100 rounded" title="Sửa mapping">
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                      <button className="p-1 hover:bg-slate-100 rounded" title="Xem records">
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// =================== FIELDS ===================
function FieldsTab({ search, setSearch }: any) {
  const filtered = MOCK_FIELDS.filter((f) =>
    !search || f.larkField.toLowerCase().includes(search.toLowerCase()) || f.localField.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="card p-4 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-sm text-blue-800 mb-1">🔗 Field Mapping</h3>
        <p className="text-xs text-blue-700">
          Map các field giữa Lark Base và MIMIN ERP. Field chưa map (màu vàng) sẽ không được đồng bộ.
        </p>
      </div>

      <div className="card p-3 flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm field..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-sky-500 outline-none"
          />
        </div>
        <button className="px-3 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Auto-map
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 text-left">Lark Field</th>
              <th className="p-2 text-center">→</th>
              <th className="p-2 text-left">Local Field</th>
              <th className="p-2 text-center">Type</th>
              <th className="p-2 text-center">Required</th>
              <th className="p-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => (
              <tr key={f.id} className={`border-t ${f.mapped ? "" : "bg-amber-50/30"}`}>
                <td className="p-2 font-semibold">{f.larkField}</td>
                <td className="p-2 text-center text-slate-400">→</td>
                <td className="p-2 font-mono text-xs">{f.localField}</td>
                <td className="p-2 text-center text-xs">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded">{f.larkType}</span>
                  <ArrowRight className="w-3 h-3 inline mx-1 text-slate-400" />
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{f.localType}</span>
                </td>
                <td className="p-2 text-center">
                  {f.required ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-300">—</span>}
                </td>
                <td className="p-2 text-center">
                  {f.mapped ? (
                    <span className="text-emerald-600 text-[10px] font-bold flex items-center justify-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Mapped
                    </span>
                  ) : (
                    <span className="text-amber-600 text-[10px] font-bold flex items-center justify-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Chưa map
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// =================== SYNC ===================
function SyncTab() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-4">
          <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1.5">
            <Server className="w-4 h-4 text-sky-500" /> Sync Engine Status
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-emerald-50 rounded">
              <span className="text-xs font-semibold text-emerald-700">Auto-sync (5 phút)</span>
              <span className="text-xs font-bold text-emerald-600">ON</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs">Last push:</span>
              <span className="text-xs font-mono">12:34:56</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs">Last pull:</span>
              <span className="text-xs font-mono">12:34:30</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs">Last error:</span>
              <span className="text-xs font-mono text-rose-600">12:25:00 (Kho)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <span className="text-xs">Next run in:</span>
              <span className="text-xs font-mono text-sky-600 font-bold">2 phút 34 giây</span>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-sky-500" /> Sync Config
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mode</label>
              <select className="w-full px-2 py-1.5 border rounded text-xs">
                <option>Two-way (ERP ↔ Lark)</option>
                <option>One-way ERP → Lark</option>
                <option>One-way Lark → ERP</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Auto interval</label>
              <select className="w-full px-2 py-1.5 border rounded text-xs">
                <option>1 phút</option>
                <option>5 phút (current)</option>
                <option>15 phút</option>
                <option>30 phút</option>
                <option>Manual only</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Conflict resolution</label>
              <select className="w-full px-2 py-1.5 border rounded text-xs">
                <option>Last-write-wins</option>
                <option>Lark wins</option>
                <option>Local wins</option>
                <option>Manual</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Retry on error</label>
              <select className="w-full px-2 py-1.5 border rounded text-xs">
                <option>3 lần (current)</option>
                <option>5 lần</option>
                <option>10 lần</option>
                <option>Không retry</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-bold text-sm text-slate-700 mb-2 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-sky-500" /> Webhooks (Lark → MIMIN)
        </h3>
        <div className="bg-slate-50 p-3 rounded-lg font-mono text-[10px] break-all">
          POST https://mimin-erp.app/api/webhooks/lark<br />
          Events: bitable.record.created, bitable.record.updated, bitable.record.deleted
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Sếp cần cấu hình URL trên Lark Developer Console → Event Subscriptions
        </div>
      </div>
    </div>
  );
}

// =================== LOGS ===================
function LogsTab() {
  return (
    <div className="space-y-3">
      <div className="card p-3 flex flex-col md:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm log..."
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:border-sky-500 outline-none"
          />
        </div>
        <select className="px-3 py-2 border rounded-lg text-sm">
          <option>Tất cả</option>
          <option>Push</option>
          <option>Pull</option>
          <option>Errors</option>
        </select>
        <button className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-1">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="card p-4 space-y-2">
        {MOCK_LOGS.map((log) => (
          <LogRow key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
}

// =================== LOG ROW ===================
function LogRow({ log }: { log: SyncLog }) {
  const typeColors: Record<string, string> = {
    push: "bg-blue-100 text-blue-700",
    pull: "bg-emerald-100 text-emerald-700",
    error: "bg-rose-100 text-rose-700",
    info: "bg-slate-100 text-slate-700",
  };
  const typeIcons: Record<string, string> = {
    push: "↑",
    pull: "↓",
    error: "⚠",
    info: "ⓘ",
  };

  return (
    <div className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
      <div className="text-[10px] font-mono text-slate-500 mt-0.5 min-w-[60px]">{log.time}</div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[log.type]}`}>
        <span className="text-xs font-bold">{typeIcons[log.type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-sky-700">{log.table}</span>
          <span className="text-xs text-slate-500">·</span>
          <span className="font-mono text-xs">{log.record}</span>
          {log.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          {log.status === "failed" && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
        </div>
        <div className="text-xs text-slate-600 mt-0.5">{log.message}</div>
      </div>
    </div>
  );
}
