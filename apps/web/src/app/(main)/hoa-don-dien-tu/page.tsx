"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Settings, Plus, Download, Mail, Search, X, CheckCircle2,
  AlertCircle, Loader2, ExternalLink, RefreshCw, Eye, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

// ============ TYPES ============
interface MeInvoiceConfig {
  id: string;
  app_id: string;
  tax_code: string;
  username: string;
  password_enc: string;
  env: "test" | "live";
  sign_type: 2 | 5;
  last_token: string;
  token_expires_at: string;
  default_template: string;
  updated_at: string;
}

interface HoaDonDienTu {
  id: string;
  transaction_id: string;
  ref_id: string;
  inv_no: string;
  inv_series: string;
  inv_date: string;
  buyer_legal_name: string;
  buyer_tax_code: string;
  buyer_address: string;
  buyer_phone: string;
  buyer_email: string;
  total_amount: number;
  vat_amount: number;
  total_with_vat: number;
  currency: string;
  status: "draft" | "issued" | "cancelled" | "adjusted" | "replaced";
  ref_id_don_hang: string;
  ref_id_khach_hang: string;
  nguoi_tao: string;
  created_at: string;
  issued_at: string;
}

const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(n || 0);

export default function HoaDonDienTuPage() {
  const [config, setConfig] = useState<MeInvoiceConfig | null>(null);
  const [dsHoaDon, setDsHoaDon] = useState<HoaDonDienTu[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [testAuthLoading, setTestAuthLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // ============ LOAD DATA ============
  const loadConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/meinvoice/config");
      const json = await r.json();
      if (json.ok) setConfig(json.config);
    } catch (err) {
      console.error("load config error:", err);
    }
  }, []);

  const loadHoaDon = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("hoa_don_dien_tu")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("load hddt error:", error);
        return;
      }
      setDsHoaDon(data || []);
    } catch (err) {
      console.error("load hddt exception:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadConfig(), loadHoaDon()]).finally(() => setLoading(false));
  }, [loadConfig, loadHoaDon]);

  // ============ TEST AUTH ============
  const testAuth = async () => {
    setTestAuthLoading(true);
    setAuthStatus(null);
    try {
      const r = await fetch("/api/meinvoice/auth", { method: "POST" });
      const json = await r.json();
      if (json.ok) {
        setAuthStatus({ ok: true, msg: `✅ Kết nối thành công! (env: ${json.env}, ${json.duration_ms}ms)` });
        toast.success("Kết nối MeInvoice thành công!");
        await loadConfig();
      } else {
        setAuthStatus({ ok: false, msg: `❌ ${json.error}` });
        toast.error(json.error);
      }
    } catch (err: any) {
      setAuthStatus({ ok: false, msg: `❌ ${err.message}` });
    } finally {
      setTestAuthLoading(false);
    }
  };

  // ============ DOWNLOAD PDF ============
  const downloadPDF = async (id: string, invNo: string) => {
    try {
      const r = await fetch(`/api/meinvoice/invoice/${id}/download?format=pdf`);
      if (!r.ok) {
        const err = await r.json();
        toast.error(err.error || "Tải PDF thất bại");
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `HoaDon_${invNo || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã tải PDF");
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  // ============ SEND EMAIL ============
  const sendEmail = async (id: string, defaultEmail: string) => {
    const email = prompt("Nhập email KH để gửi HĐĐT:", defaultEmail);
    if (!email) return;
    try {
      const r = await fetch(`/api/meinvoice/invoice/${id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await r.json();
      if (json.ok) {
        toast.success(`Đã gửi email tới ${email}`);
      } else {
        toast.error(json.error || "Gửi email thất bại");
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  // ============ FILTER ============
  const filtered = dsHoaDon.filter((hd) => {
    const matchSearch =
      !search ||
      [hd.inv_no, hd.buyer_legal_name, hd.buyer_tax_code, hd.ref_id_don_hang]
        .some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || hd.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ============ RENDER ============
  return (
    <div className="space-y-5 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-600" />
            Hóa đơn điện tử
            <span className="text-xs font-normal text-slate-500">(Misa meInvoice)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phát hành và quản lý HĐĐT theo Nghị định 123/2020/NĐ-CP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              loadConfig();
              loadHoaDon();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 text-white text-sm font-semibold hover:bg-cyan-600"
          >
            <Settings className="w-4 h-4" /> Cài đặt MeInvoice
          </button>
        </div>
      </div>

      {/* Status banner */}
      {!config || config.app_id === "PENDING_APP_ID" ? (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-amber-900 dark:text-amber-100">
                Chưa cấu hình MeInvoice
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                Vào <strong>Settings</strong> để nhập AppID, MST, username, password do MISA cung cấp.
                Liên hệ MISA: <a href="https://meinvoice.vn" target="_blank" className="underline">meinvoice.vn</a> · Hotline 1900 6822
              </div>
              <div className="text-xs text-amber-600 mt-2">
                Hướng dẫn: <a href="https://www.misa.vn/154989/tai-lieu-open-api-tich-hop-hoa-don-dien-tu-misa-meinvoice-dau-ra/" target="_blank" rel="noreferrer" className="underline">
                  Tài liệu API Misa meInvoice
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Đã cấu hình MeInvoice ({config.env === "test" ? "🧪 TEST" : "🚀 LIVE"})
                </div>
                <div className="text-xs text-emerald-700 dark:text-emerald-200 mt-0.5">
                  MST: {config.tax_code} · User: {config.username} · SignType: {config.sign_type}
                </div>
              </div>
            </div>
            <button
              onClick={testAuth}
              disabled={testAuthLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
            >
              {testAuthLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Test kết nối
            </button>
          </div>
          {authStatus && (
            <div className={`mt-2 text-xs ${authStatus.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {authStatus.msg}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
            placeholder="Tìm theo số HĐ, tên KH, MST, mã đơn hàng..."
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input w-auto"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="issued">✅ Đã phát hành</option>
          <option value="draft">📝 Nháp</option>
          <option value="cancelled">🚫 Đã hủy</option>
          <option value="adjusted">🔄 Điều chỉnh</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="text-xs opacity-70">Tổng HĐĐT</div>
          <div className="text-2xl font-bold mt-1">{dsHoaDon.length}</div>
        </div>
        <div className="card p-3 border-emerald-200">
          <div className="text-xs opacity-70">Đã phát hành</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {dsHoaDon.filter((h) => h.status === "issued").length}
          </div>
        </div>
        <div className="card p-3 border-amber-200">
          <div className="text-xs opacity-70">Tổng tiền (VND)</div>
          <div className="text-lg font-bold mt-1 text-amber-600">
            {formatVND(dsHoaDon.reduce((s, h) => s + (h.total_with_vat || 0), 0))}
          </div>
        </div>
        <div className="card p-3 border-cyan-200">
          <div className="text-xs opacity-70">Đã thu VAT</div>
          <div className="text-lg font-bold mt-1 text-cyan-600">
            {formatVND(dsHoaDon.reduce((s, h) => s + (h.vat_amount || 0), 0))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50 dark:bg-slate-800/50" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Số HĐ</th>
                <th className="p-3">Ngày</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">MST</th>
                <th className="p-3 text-right">Tổng tiền (VAT)</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3">Đơn hàng</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Đang tải...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    {dsHoaDon.length === 0
                      ? "Chưa có hóa đơn nào. Tạo HĐ từ đơn hàng → Đơn hàng đã giao."
                      : "Không có kết quả phù hợp."}
                  </td>
                </tr>
              ) : (
                filtered.map((hd) => (
                  <tr key={hd.id} className="border-b last:border-0 hover:bg-slate-50/50" style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono font-semibold text-cyan-600">
                      {hd.inv_series}
                      {hd.inv_no || "—"}
                    </td>
                    <td className="p-3 text-xs">{hd.inv_date || "—"}</td>
                    <td className="p-3">
                      <div className="font-medium">{hd.buyer_legal_name}</div>
                      {hd.buyer_email && (
                        <div className="text-[10px] opacity-60">{hd.buyer_email}</div>
                      )}
                    </td>
                    <td className="p-3 font-mono text-xs">{hd.buyer_tax_code || "—"}</td>
                    <td className="p-3 text-right font-mono font-semibold">
                      {formatVND(hd.total_with_vat)}
                      <div className="text-[10px] opacity-60 font-normal">
                        VAT: {formatVND(hd.vat_amount)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <StatusBadge status={hd.status} />
                    </td>
                    <td className="p-3 font-mono text-xs">{hd.ref_id_don_hang || "—"}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => downloadPDF(hd.id, hd.inv_no)}
                          title="Tải PDF"
                          className="p-1.5 rounded text-cyan-600 hover:bg-cyan-50"
                          disabled={!hd.transaction_id}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendEmail(hd.id, hd.buyer_email)}
                          title="Gửi email"
                          className="p-1.5 rounded text-amber-600 hover:bg-amber-50"
                          disabled={!hd.transaction_id}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <MeInvoiceSettingsModal
          config={config}
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            loadConfig();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
    issued: { bg: "bg-emerald-500/15", color: "text-emerald-700", label: "Đã phát hành", emoji: "✅" },
    draft: { bg: "bg-slate-500/15", color: "text-slate-700", label: "Nháp", emoji: "📝" },
    cancelled: { bg: "bg-rose-500/15", color: "text-rose-700", label: "Đã hủy", emoji: "🚫" },
    adjusted: { bg: "bg-amber-500/15", color: "text-amber-700", label: "Điều chỉnh", emoji: "🔄" },
    replaced: { bg: "bg-blue-500/15", color: "text-blue-700", label: "Thay thế", emoji: "🔁" },
  };
  const s = styles[status] || styles.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
      {s.emoji} {s.label}
    </span>
  );
}

// ============ SETTINGS MODAL ============
function MeInvoiceSettingsModal({
  config,
  onClose,
  onSaved,
}: {
  config: MeInvoiceConfig | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [appId, setAppId] = useState(config?.app_id === "PENDING_APP_ID" ? "" : config?.app_id || "");
  const [taxCode, setTaxCode] = useState(config?.tax_code || "0318507560");
  const [username, setUsername] = useState(config?.username === "PENDING_USERNAME" ? "" : config?.username || "");
  const [password, setPassword] = useState("");
  const [env, setEnv] = useState<"test" | "live">(config?.env || "test");
  const [signType, setSignType] = useState<2 | 5>(config?.sign_type || 2);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!appId || !username) {
      toast.error("Vui lòng nhập AppID và Username");
      return;
    }
    if (!config || !config.password_enc) {
      if (!password) {
        toast.error("Vui lòng nhập Password");
        return;
      }
    }
    setSaving(true);
    try {
      const r = await fetch("/api/meinvoice/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: appId,
          tax_code: taxCode,
          username,
          password: password || "******",
          env,
          sign_type: signType,
        }),
      });
      const json = await r.json();
      if (json.ok) {
        toast.success("Đã lưu cấu hình MeInvoice!");
        onSaved();
      } else {
        toast.error(json.error);
      }
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 max-h-[95vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cài đặt MeInvoice</h3>
              <p className="text-xs text-slate-500">Kết nối với dịch vụ HĐĐT Misa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200">
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <strong>📋 Lấy AppID từ MISA:</strong> Đăng ký tài khoản tại{" "}
              <a href="https://testapp3.meinvoice.vn" target="_blank" rel="noreferrer" className="underline">testapp3.meinvoice.vn</a>{" "}
              (test) hoặc <a href="https://app3.meinvoice.vn" target="_blank" rel="noreferrer" className="underline">app3.meinvoice.vn</a>{" "}
              (live), sau đó liên hệ MISA qua live chat để lấy AppID.
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Môi trường</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setEnv("test")}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                  env === "test"
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                🧪 TEST (Sandbox)
              </button>
              <button
                onClick={() => setEnv("live")}
                className={`px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                  env === "live"
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                🚀 LIVE (Production)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">AppID *</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="VD: ABCD-1234-EFGH-5678"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">MST doanh nghiệp *</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono font-semibold"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="0318507560"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Username (email/SDT đăng nhập MeInvoice) *</label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: sang@mimin.vn hoặc 0901234567"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Password {config?.password_enc ? "(để trống nếu không đổi)" : "*"}
            </label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={config?.password_enc ? "••••••" : "Mật khẩu đăng nhập MeInvoice"}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Loại chữ ký số</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSignType(2)}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold ${
                  signType === 2
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                Có CKS (Hiển thị chữ ký số)
              </button>
              <button
                onClick={() => setSignType(5)}
                className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold ${
                  signType === 5
                    ? "border-cyan-500 bg-cyan-50 text-cyan-700"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                Không CKS (CQS server ký)
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 font-semibold text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
