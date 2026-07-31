"use client";

import { useState, useEffect } from "react";
import {
  Link2, CheckCircle2, XCircle, RefreshCw, Cloud, CloudOff, Save,
  ExternalLink, Copy, FileText, Eye, EyeOff, FlaskConical, Database
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { getLarkConfig, saveLarkConfig, testLarkConnection, isLarkEnabled, type LarkConfig } from "@/lib/lark";
import { pullAllFromLark } from "@/lib/lark-sync";
import { setupMockFetchInterceptor, resetMockLarkData, getMockBaseData } from "@/lib/lark-mock";
import { toast } from "sonner";

export default function LarkSettingsPage() {
  const { user } = useSession();
  const [config, setConfig] = useState<LarkConfig>({
    appId: "",
    appSecret: "",
    baseToken: "",
    tableIds: {
      inTheuDap: "",
      may: "",
      khuyNut: "",
      ui: "",
      dongGoi: "",
    },
    syncMode: "two-way",
    enabled: false,
    useMock: true,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pullResult, setPullResult] = useState<any>(null);

  useEffect(() => {
    const existing = getLarkConfig();
    if (existing) setConfig(existing);
  }, []);

  const handleSave = () => {
    saveLarkConfig(config);
    toast.success("Đã lưu cấu hình Lark");
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    saveLarkConfig(config); // Save first để test
    const result = await testLarkConnection();
    setTestResult(result);
    setTesting(false);
    if (result.ok) {
      toast.success("Kết nối Lark thành công!");
    } else {
      toast.error(`Lỗi: ${result.message}`);
    }
  };

  const handlePull = async () => {
    setPulling(true);
    try {
      const result = await pullAllFromLark(user);
      setPullResult(result);
      toast.success(`Đã pull ${result.total} phiếu từ Lark`);
    } catch (e: any) {
      toast.error(`Lỗi pull: ${e.message}`);
    }
    setPulling(false);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Link2 className="w-7 h-7 text-blue-500" /> Kết nối Lark Base
        </h1>
        <p className="opacity-70 mt-1 text-sm">Đồng bộ 2 chiều realtime giữa MIMIN ERP và Lark Base của chị Giàu</p>
      </div>

      {/* Status banner */}
      <div className={`card p-4 flex items-center gap-3 ${
        isLarkEnabled() ? "bg-emerald-500/10 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"
      }`}>
        {isLarkEnabled() ? <Cloud className="w-6 h-6 text-emerald-600" /> : <CloudOff className="w-6 h-6 text-amber-600" />}
        <div className="flex-1">
          <div className="font-semibold">
            {isLarkEnabled() ? "✅ Lark đang hoạt động" : "⚠️ Lark chưa được cấu hình"}
          </div>
          <div className="text-xs opacity-70">
            {isLarkEnabled()
              ? "Mọi thay đổi trên ERP sẽ tự động đẩy lên Lark và ngược lại"
              : "Vui lòng nhập thông tin kết nối bên dưới"}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-5 space-y-4 max-w-2xl">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand-500" /> 1. Thông tin ứng dụng Lark
        </h3>
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">App ID</label>
          <input
            className="input"
            value={config.appId}
            onChange={(e) => setConfig({ ...config, appId: e.target.value })}
            placeholder="cli_xxxxxxxxxxxxxxxx"
          />
        </div>
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">App Secret</label>
          <div className="relative">
            <input
              className="input pr-9"
              type={showSecret ? "text" : "password"}
              value={config.appSecret}
              onChange={(e) => setConfig({ ...config, appSecret: e.target.value })}
              placeholder="••••••••••••••••"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium opacity-70 block mb-1">Base Token (App Token)</label>
          <input
            className="input"
            value={config.baseToken}
            onChange={(e) => setConfig({ ...config, baseToken: e.target.value })}
            placeholder="bascnXXXXXXXXXXXXXX"
          />
          <p className="text-[10px] opacity-60 mt-1">
            Lấy từ URL của Lark Base: https://xxx.larksuite.com/base/<b>BASETOKEN</b>?table=...
          </p>
        </div>

        <h3 className="font-semibold flex items-center gap-2 pt-4">
          <FileText className="w-4 h-4 text-brand-500" /> 2. Table IDs (mỗi khâu 1 bảng)
        </h3>
        <p className="text-xs opacity-60 -mt-2">Lấy từ URL bảng trong Lark Base (phần /table/<b>TABLEID</b>)</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TableField label="🎨 In/Thêu/Dập" value={config.tableIds.inTheuDap} onChange={(v: string) => setConfig({ ...config, tableIds: { ...config.tableIds, inTheuDap: v } })} />
          <TableField label="🧵 May" value={config.tableIds.may} onChange={(v: string) => setConfig({ ...config, tableIds: { ...config.tableIds, may: v } })} />
          <TableField label="🔘 Khuy nút" value={config.tableIds.khuyNut} onChange={(v: string) => setConfig({ ...config, tableIds: { ...config.tableIds, khuyNut: v } })} />
          <TableField label="🔥 Ủi" value={config.tableIds.ui} onChange={(v: string) => setConfig({ ...config, tableIds: { ...config.tableIds, ui: v } })} />
          <TableField label="📦 Gấp xếp/Đóng gói" value={config.tableIds.dongGoi} onChange={(v: string) => setConfig({ ...config, tableIds: { ...config.tableIds, dongGoi: v } })} />
        </div>

        <h3 className="font-semibold flex items-center gap-2 pt-4">
          <RefreshCw className="w-4 h-4 text-brand-500" /> 3. Chế độ đồng bộ
        </h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/30">
            <input
              type="radio"
              checked={config.syncMode === "two-way"}
              onChange={() => setConfig({ ...config, syncMode: "two-way" })}
            />
            <div>
              <div className="text-sm font-medium">🔄 2 chiều (khuyên dùng)</div>
              <div className="text-[10px] opacity-60">ERP ↔ Lark: Thay đổi ở đâu cũng sync sang bên kia</div>
            </div>
          </label>
          <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/30">
            <input
              type="radio"
              checked={config.syncMode === "one-way"}
              onChange={() => setConfig({ ...config, syncMode: "one-way" })}
            />
            <div>
              <div className="text-sm font-medium">➡️ 1 chiều (ERP → Lark)</div>
              <div className="text-[10px] opacity-60">Chỉ đẩy từ ERP lên Lark, không pull về</div>
            </div>
          </label>
        </div>

        <label className="flex items-center gap-2 p-3 rounded bg-brand-500/10 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
          />
          <div>
            <div className="text-sm font-semibold">Bật đồng bộ Lark</div>
            <div className="text-[10px] opacity-70">Bỏ tick nếu muốn tạm tắt (không mất config)</div>
          </div>
        </label>

        <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={handleSave} className="btn-primary flex items-center gap-1.5">
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
          <button onClick={handleTest} disabled={testing} className="btn-secondary flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} /> {testing ? "Đang test..." : "Test kết nối"}
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded text-sm flex items-start gap-2 ${
            testResult.ok ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-red-500/10 border border-red-500/30"
          }`}>
            {testResult.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <div className="text-xs">{testResult.message}</div>
          </div>
        )}
      </div>

      {/* Pull section */}
      {isLarkEnabled() && (
        <div className="card p-5 space-y-3 max-w-2xl">
          <h3 className="font-semibold flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-500" /> 4. Đồng bộ dữ liệu
          </h3>
          <p className="text-xs opacity-70">
            <strong>Auto-push:</strong> Mỗi khi a thay đổi phiếu trên ERP (Tiếp nhận, Hoàn thành, Báo cáo), tự động đẩy lên Lark.<br/>
            <strong>Pull:</strong> Kéo dữ liệu từ Lark về ERP (khi chị Giàu sửa trên Lark).
          </p>
          <button onClick={handlePull} disabled={pulling} className="btn-primary flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${pulling ? "animate-spin" : ""}`} /> {pulling ? "Đang pull..." : "Pull ngay từ Lark"}
          </button>
          {pullResult && (
            <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs">
              <div className="font-semibold mb-1">✅ Pull thành công {pullResult.total} phiếu</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                {Object.entries(pullResult.byKhau).map(([k, v]: any) => (
                  <div key={k} className="text-[10px]">• {k}: <b>{v}</b></div>
                ))}
              </div>
              {pullResult.errors.length > 0 && (
                <div className="mt-2 text-red-600">⚠️ {pullResult.errors.join("; ")}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Setup guide */}
      <div className="card p-5 max-w-2xl">
        <h3 className="font-semibold mb-3">📚 Hướng dẫn lấy App ID, App Secret và Table IDs</h3>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>
            Truy cập <a href="https://open.larksuite.com" target="_blank" rel="noreferrer" className="text-brand-500 underline inline-flex items-center gap-1">
              open.larksuite.com <ExternalLink className="w-3 h-3" />
            </a> → Tạo App (Custom App)
          </li>
          <li>Vào <b>Permissions</b> → thêm scope: <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">bitable:app:readonly</code>, <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">bitable:app:write</code></li>
          <li>Vào <b>Credentials</b> → copy <b>App ID</b> + <b>App Secret</b> → paste vào form trên</li>
          <li>Mở Lark Base chứa 5 bảng INTD/MAY/KN/UI/DG → copy <b>Base Token</b> từ URL</li>
          <li>Mở từng bảng → copy <b>Table ID</b> từ URL → paste vào form</li>
          <li>Bấm <b>Lưu cấu hình</b> → <b>Test kết nối</b></li>
        </ol>
        <div className="mt-3 p-3 rounded bg-amber-500/10 text-xs">
          <b>💡 Mẹo:</b> Field names trong Lark Base phải khớp với field map của em (đã có sẵn). VD: cột mã phiếu phải tên <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">ma_phieu</code>.
        </div>
      </div>
    </div>
  );
}

function TableField({ label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-medium opacity-70 block mb-1">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="tblxxxxxxxxxxxx"
      />
    </div>
  );
}
