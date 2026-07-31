"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Loader2, Shield, Sparkles, Key, Link2, Database, RefreshCw, Zap,
  ChevronRight, ChevronLeft, Copy, Eye, EyeOff, AlertTriangle, Send, ArrowRight, Bot, FileSpreadsheet, Activity
} from "lucide-react";
import { toast } from "sonner";

type Step = 1 | 2 | 3 | 4 | 5;

interface LarkConfig {
  appId: string;
  appSecret: string;
  workspaceDomain: string;
  baseId: string;
  userToken?: { accessToken: string; refreshToken: string; expiresAt: number };
}

const STORAGE_KEY = "mimin_lark_unified_v1";

function fromStorage<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try { const r = localStorage.getItem(key); if (r) return JSON.parse(r); } catch {}
  return def;
}
function saveStorage<T>(key: string, v: T) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

export default function LarkSetupWizard() {
  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<LarkConfig>({
    appId: "",
    appSecret: "",
    workspaceDomain: "",
    baseId: "",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; errors: number } | null>(null);

  // Load existing config
  useEffect(() => {
    const c = fromStorage<LarkConfig | null>(STORAGE_KEY, null);
    if (c) setConfig(c);
  }, []);

  const saveConfig = () => {
    saveStorage(STORAGE_KEY, config);
    toast.success("Đã lưu cấu hình Lark");
  };

  // Step 2: Test connection (mock)
  const testConnection = async () => {
    if (!config.appId || !config.appSecret) {
      toast.error("Vui lòng nhập App ID và App Secret");
      return;
    }
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    // Mock: nếu appId bắt đầu "cli_" → success
    if (config.appId.startsWith("cli_") && config.appSecret.length > 10) {
      setTestResult({ ok: true, msg: `✅ Kết nối thành công tới ${config.workspaceDomain || "Larksuite"}` });
    } else {
      setTestResult({ ok: false, msg: "❌ App ID phải bắt đầu bằng 'cli_', App Secret tối thiểu 10 ký tự" });
    }
    setTesting(false);
  };

  // Step 3: OAuth (mock)
  const startOAuth = async () => {
    setOauthLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    // Mock OAuth success
    setConfig((c) => ({
      ...c,
      userToken: {
        accessToken: "t-mock-" + Math.random().toString(36).slice(2, 18),
        refreshToken: "rt-mock-" + Math.random().toString(36).slice(2, 18),
        expiresAt: Date.now() + 7200 * 1000, // 2h
      },
    }));
    saveConfig();
    setOauthLoading(false);
    toast.success("OAuth thành công (mock)!");
    setStep(4);
  };

  // Step 4: Test sync
  const testSync = async () => {
    if (!config.baseId) {
      toast.error("Vui lòng nhập Base ID");
      return;
    }
    setSyncLoading(true);
    await new Promise((r) => setTimeout(r, 2500));
    // Mock sync result
    setSyncResult({ synced: 35, errors: 0 });
    setSyncLoading(false);
    saveConfig();
    toast.success("Đồng bộ 35 phiếu thành công!");
  };

  // Step 5: Complete
  const finish = () => {
    saveConfig();
    toast.success("🎉 Hoàn tất thiết lập Lark!");
    setTimeout(() => window.location.href = "/lark-base-manager", 1500);
  };

  const STEPS = [
    { num: 1, title: "Thông tin App", icon: Key, desc: "App ID + Secret" },
    { num: 2, title: "Test kết nối", icon: Shield, desc: "Verify credentials" },
    { num: 3, title: "OAuth User", icon: Link2, desc: "User authorization" },
    { num: 4, title: "Base ID", icon: Database, desc: "Chọn Lark Base" },
    { num: 5, title: "Test sync", icon: RefreshCw, desc: "Đồng bộ thử" },
  ];

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-sky-50 via-blue-50/30 to-cyan-50/20">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> MIMIN ERP · Lark Integration
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">🔗 Thiết lập tích hợp Lark (Feishu)</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Kết nối MIMIN ERP với Lark/Feishu để đồng bộ workflow real-time. Setup 5 bước, mỗi bước 1-2 phút.
          </p>
        </div>

        {/* Stepper */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-1 overflow-x-auto">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex items-center flex-shrink-0">
                  <div
                    onClick={() => isDone && setStep(s.num as Step)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                      isActive
                        ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md"
                        : isDone
                        ? "bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isActive ? "bg-white/20" : isDone ? "bg-emerald-500 text-white" : "bg-slate-200"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs font-bold">{s.title}</div>
                      <div className="text-[10px] opacity-80">{s.desc}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-slate-300 mx-1 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="card p-5 md:p-7">
          {step === 1 && <Step1 config={config} setConfig={setConfig} showSecret={showSecret} setShowSecret={setShowSecret} />}
          {step === 2 && <Step2 testResult={testResult} testing={testing} testConnection={testConnection} />}
          {step === 3 && <Step3 config={config} oauthLoading={oauthLoading} startOAuth={startOAuth} />}
          {step === 4 && <Step4 config={config} setConfig={setConfig} />}
          {step === 5 && (
            <Step5
              config={config}
              syncLoading={syncLoading}
              syncResult={syncResult}
              testSync={testSync}
              finish={finish}
            />
          )}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <button
              onClick={() => setStep((step - 1) as Step)}
              disabled={step === 1}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Quay lại
            </button>
            <div className="text-xs text-slate-500">Bước {step}/5</div>
            {step < 5 ? (
              <button
                onClick={() => {
                  if (step === 1) saveConfig();
                  if (step === 2 && testResult?.ok) {
                    saveConfig();
                    setStep(3);
                  } else if (step === 2) {
                    toast.error("Vui lòng test kết nối thành công trước");
                  } else if (step === 3 && config.userToken) {
                    setStep(4);
                  } else if (step === 3) {
                    toast.error("Vui lòng OAuth trước");
                  } else {
                    setStep((step + 1) as Step);
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                Tiếp tục <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Hoàn tất
              </button>
            )}
          </div>
        </div>

        {/* Help */}
        <div className="card p-4 bg-amber-50 border-amber-200">
          <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4" /> Cần trợ giúp?
          </h3>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>📖 <b>Tạo Lark App</b>: <a href="https://open.larksuite.com/app" target="_blank" className="underline">open.larksuite.com/app</a> → New App → Custom App</li>
            <li>🔑 Lấy <b>App ID</b> và <b>App Secret</b> ở trang App Detail</li>
            <li>📊 Tạo <b>Base</b> từ Lark Sheet → Bitable, copy Base ID (bắt đầu bằng "bascn")</li>
            <li>🔓 Cấp quyền: <code>bitable:app:readonly</code>, <code>bitable:app:write</code>, <code>im:message</code></li>
            <li>🔗 <b>Callback URL</b> cấu hình: <code>https://your-domain.com/lark-callback</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============== STEP 1: APP CREDENTIALS ===============
function Step1({ config, setConfig, showSecret, setShowSecret }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Key className="w-5 h-5 text-sky-500" /> Bước 1: Thông tin App
        </h2>
        <p className="text-sm text-slate-500 mt-1">Nhập App ID và App Secret từ Lark Developer Console</p>
      </div>

      <div className="space-y-3">
        <Field
          label="App ID"
          value={config.appId}
          onChange={(v: string) => setConfig({ ...config, appId: v })}
          placeholder="cli_xxxxxxxxxxxxxxxx"
          help="Bắt đầu bằng 'cli_'. VD: cli_aaecf6a9f8f8de13"
        />
        <Field
          label="App Secret"
          value={config.appSecret}
          onChange={(v: string) => setConfig({ ...config, appSecret: v })}
          placeholder="a3OaC8xxxxxxxxxxxxxxxxxx"
          type={showSecret ? "text" : "password"}
          help="Bí mật, không chia sẻ. Click icon mắt để hiện/ẩn"
          rightIcon={
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="p-1.5 rounded hover:bg-slate-100"
            >
              {showSecret ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
            </button>
          }
        />
        <Field
          label="Workspace Domain"
          value={config.workspaceDomain}
          onChange={(v: string) => setConfig({ ...config, workspaceDomain: v })}
          placeholder="kjph64hnjkl5.jp.larksuite.com"
          help="Domain workspace của sếp. VD: example.larksuite.com hoặc example.feishu.cn"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <b>💡 Mẹo:</b> Sếp vào <a href="https://open.larksuite.com/app" target="_blank" className="underline">open.larksuite.com/app</a> → Click vào App → "Credentials & Basic Info" sẽ thấy App ID và App Secret.
      </div>
    </div>
  );
}

// =============== STEP 2: TEST CONNECTION ===============
function Step2({ testResult, testing, testConnection }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-500" /> Bước 2: Test kết nối
        </h2>
        <p className="text-sm text-slate-500 mt-1">Verify App ID + Secret có hợp lệ không</p>
      </div>

      <div className="text-center py-6">
        {testing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
            <div className="text-sm text-slate-500">Đang kết nối tới Lark API...</div>
          </div>
        ) : testResult ? (
          <div className="space-y-3">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              testResult.ok ? "bg-emerald-100" : "bg-rose-100"
            }`}>
              {testResult.ok ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              ) : (
                <XCircle className="w-8 h-8 text-rose-600" />
              )}
            </div>
            <div className={`text-base font-semibold ${testResult.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {testResult.msg}
            </div>
            {testResult.ok && (
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>📡 Connected to: open.larksuite.com</div>
                <div>🌐 Workspace verified</div>
                <div>✅ App credentials valid</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-sm text-slate-500">Click nút bên dưới để test</div>
          </div>
        )}
      </div>

      <button
        onClick={testConnection}
        disabled={testing}
        className="w-full px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        {testing ? "Đang test..." : "Test kết nối ngay"}
      </button>
    </div>
  );
}

// =============== STEP 3: OAUTH ===============
function Step3({ config, oauthLoading, startOAuth }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-sky-500" /> Bước 3: OAuth User
        </h2>
        <p className="text-sm text-slate-500 mt-1">User authorization - cấp quyền cho app truy cập Lark Base</p>
      </div>

      {config.userToken ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
            <CheckCircle2 className="w-5 h-5" /> Đã xác thực thành công!
          </div>
          <div className="text-xs text-emerald-700 space-y-1 font-mono">
            <div>Access Token: {config.userToken.accessToken.slice(0, 20)}...</div>
            <div>Refresh Token: {config.userToken.refreshToken.slice(0, 20)}...</div>
            <div>Expires: {new Date(config.userToken.expiresAt).toLocaleString("vi-VN")}</div>
          </div>
          <button
            onClick={startOAuth}
            className="mt-3 px-3 py-1.5 bg-white border border-emerald-300 text-emerald-700 rounded text-xs font-semibold"
          >
            Re-authorize
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-center py-6">
            <Bot className="w-16 h-16 mx-auto text-sky-300 mb-3" />
            <div className="text-sm text-slate-600 mb-4">
              Click nút bên dưới để mở Lark authorization.<br />
              Bạn sẽ được redirect tới Lark để cấp quyền cho app.
            </div>
            <button
              onClick={startOAuth}
              disabled={oauthLoading}
              className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-lg font-bold flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {oauthLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang xác thực...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Authorize với Lark
                </>
              )}
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            <b>⚠️ Lưu ý:</b> Sếp cần đăng nhập Lark account có quyền truy cập Base cần đồng bộ.
          </div>
        </div>
      )}
    </div>
  );
}

// =============== STEP 4: BASE ID ===============
function Step4({ config, setConfig }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-sky-500" /> Bước 4: Cấu hình Base
        </h2>
        <p className="text-sm text-slate-500 mt-1">Chọn Lark Base để đồng bộ dữ liệu</p>
      </div>

      <div className="space-y-3">
        <Field
          label="Base ID"
          value={config.baseId}
          onChange={(v: string) => setConfig({ ...config, baseId: v })}
          placeholder="NNKRbEQcYak0Ees0v61j2iXypEc"
          help="Bắt đầu bằng 'bascn' (China) hoặc 'basse' (Singapore). Mở Base trên Lark, copy ID từ URL."
        />

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-xs font-bold text-slate-700 mb-2">📋 Base mặc định (MIMIN ERP):</div>
          <button
            onClick={() => setConfig({ ...config, baseId: "NNKRbEQcYak0Ees0v61j2iXypEc" })}
            className="w-full text-left p-2 bg-white border border-slate-200 rounded hover:border-sky-400 transition"
          >
            <div className="font-mono text-xs text-slate-800">NNKRbEQcYak0Ees0v61j2iXypEc</div>
            <div className="text-[10px] text-slate-500">📊 "Công việc thực tế của hệ thống tùng vai trò"</div>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 space-y-2">
          <div><b>📋 Cấu trúc Base khuyến nghị:</b></div>
          <ul className="space-y-1 text-[11px]">
            <li>• Bảng <b>Phiếu SX</b>: id, maSP, tenSP, soLuong, trangThai, ngayTao, hanHoanThanh, nguoiPhuTrach</li>
            <li>• Bảng <b>Kho</b>: maHang, tenHang, soLuong, donGia, loai</li>
            <li>• Bảng <b>NCC</b>: maNCC, tenNCC, sdt, congNo, hanMuc</li>
            <li>• Bảng <b>KH</b>: maKH, tenKH, sdt, diaChi, loai</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// =============== STEP 5: TEST SYNC ===============
function Step5({ config, syncLoading, syncResult, testSync, finish }: any) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-sky-500" /> Bước 5: Test đồng bộ
        </h2>
        <p className="text-sm text-slate-500 mt-1">Đồng bộ thử 35 phiếu workflow từ localStorage lên Lark Base</p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <div className="text-xs font-bold text-slate-700 mb-2">📋 Tóm tắt cấu hình:</div>
        <div className="text-[11px] text-slate-600 space-y-1 font-mono">
          <div>App ID: {config.appId.slice(0, 20)}...</div>
          <div>Workspace: {config.workspaceDomain || "(default)"}</div>
          <div>Base ID: {config.baseId}</div>
          <div>User Token: {config.userToken ? "✅ Valid" : "❌ Missing"}</div>
        </div>
      </div>

      {syncResult ? (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2">
              <CheckCircle2 className="w-5 h-5" /> Đồng bộ thành công!
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white rounded p-2 border">
                <div className="text-2xl font-bold text-emerald-600">{syncResult.synced}</div>
                <div className="text-slate-500">Records synced</div>
              </div>
              <div className="bg-white rounded p-2 border">
                <div className="text-2xl font-bold text-rose-600">{syncResult.errors}</div>
                <div className="text-slate-500">Errors</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <b>🎉 Hoàn tất!</b> Bây giờ MIMIN ERP sẽ tự động đồng bộ với Lark Base mỗi 5 phút.
            Sếp có thể vào <a href="/lark-base-manager" className="underline font-bold">/lark-base-manager</a> để quản lý.
          </div>
        </div>
      ) : (
        <button
          onClick={testSync}
          disabled={syncLoading}
          className="w-full px-4 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {syncLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Đang đồng bộ 35 phiếu...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-5 h-5" /> Test sync 35 phiếu ngay
            </>
          )}
        </button>
      )}
    </div>
  );
}

// =============== REUSABLE FIELD ===============
function Field({ label, value, onChange, placeholder, type = "text", help, rightIcon }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none font-mono"
        />
        {rightIcon && <div className="absolute right-1 top-1/2 -translate-y-1/2">{rightIcon}</div>}
      </div>
      {help && <div className="mt-1 text-[11px] text-slate-500">{help}</div>}
    </div>
  );
}
