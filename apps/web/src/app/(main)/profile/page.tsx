"use client";

import { useState, ReactNode } from "react";
import {
  User, Mail, Phone, Shield, KeyRound, ShieldCheck, LogOut,
  Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle,
  Activity, Clock, Smartphone, Copy, Check
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { ROLE_LABELS, ROLE_COLORS, type Role } from "@/lib/permissions";
import { checkPassword, strengthColor, strengthLabel, type PasswordStrength } from "@/lib/password-policy";
import { setup2FA, enable2FA, disable2FA, is2FAEnabled, type TwoFactorConfig } from "@/lib/two-factor";
import { getAuditLogs, filterAuditLogs, type AuditLog } from "@/lib/audit-log";
import { useMemo } from "react";
import { DEMO_USERS } from "@/lib/supabase/client";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";

export default function ProfilePage() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"info" | "security" | "2fa" | "activity">("info");

  if (!user) {
    return (
      <div className="card p-8 text-center max-w-md mx-auto">
        <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Chưa đăng nhập</h2>
      </div>
    );
  }

  const role = (user.role || "admin") as Role;
  const gradient = ROLE_COLORS[role] || "from-slate-500 to-slate-700";
  const demoUser = DEMO_USERS.find((u) => u.email === user.email);
  const twoFAConfig = is2FAEnabled(user.id) || is2FAEnabled(user.email) ? (demoUser ? setup2FA(demoUser.email, demoUser.email) : null) : null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="card overflow-hidden">
        <div className={`h-24 bg-gradient-to-r ${gradient}`} />
        <div className="px-5 pb-5 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar name={user.name} size="2xl" className="ring-4 ring-white dark:ring-slate-900" />
            <div className="flex-1 min-w-0 mb-1">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <div className="text-sm opacity-70">{user.email}</div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${gradient} text-white`}>
                  {ROLE_LABELS[role] || role}
                </span>
                <span className="text-xs opacity-60">·</span>
                <span className="text-xs opacity-70">{user.title}</span>
                {is2FAEnabled(user.email) && (
                  <>
                    <span className="text-xs opacity-60">·</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 2FA
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={async () => { await signOut(); router.replace("/login"); }}
              className="btn-secondary flex items-center gap-1 text-red-600"
            >
              <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-1 inline-flex flex-wrap">
        {([
          { id: "info", icon: User, label: "Thông tin" },
          { id: "security", icon: KeyRound, label: "Mật khẩu" },
          { id: "2fa", icon: ShieldCheck, label: "2FA" },
          { id: "activity", icon: Activity, label: "Hoạt động" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded text-xs font-medium flex items-center gap-1.5 ${
              tab === t.id ? "bg-brand-500 text-white" : "hover:bg-white/40"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "info" && <InfoTab user={user} />}
      {tab === "security" && <SecurityTab user={user} />}
      {tab === "2fa" && <TwoFATab user={user} />}
      {tab === "activity" && <ActivityTab user={user} />}
    </div>
  );
}

function InfoTab({ user }: { user: any }) {
  const role = (user.role || "admin") as Role;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" /> Thông tin cá nhân
        </h3>
        <Row icon={User} label="Họ tên" value={user.name} />
        <Row icon={Mail} label="Email" value={user.email} />
        <Row icon={Phone} label="Số điện thoại" value="0901234567" />
        <Row icon={Shield} label="Vai trò" value={ROLE_LABELS[role]} />
        <Row icon={User} label="Tài khoản demo" value={user.email === "admin@mimin.vn" ? "Có" : user.email} />
      </div>
      <div className="card p-5 space-y-3">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-500" /> Thống kê hoạt động
        </h3>
        <Row icon={Activity} label="Phiên đăng nhập" value="14 lần (30 ngày)" />
        <Row icon={Clock} label="Lần cuối" value="Hôm nay 16:30" />
        <Row icon={ShieldCheck} label="Bảo mật" value={`Mật khẩu + ${is2FAEnabled(user.email) ? "2FA" : "chưa 2FA"}`} />
        <Row icon={CheckCircle2} label="Trạng thái" value="🟢 Hoạt động" />
      </div>
    </div>
  );
}

function SecurityTab({ user }: { user: any }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const check = useMemo(() => checkPassword(newPw, user.email), [newPw, user.email]);
  const oldCheck = useMemo(() => checkPassword(oldPw), [oldPw]);

  const handleChange = () => {
    if (!oldPw || !newPw || !confirmPw) {
      toast.error("Vui lòng nhập đầy đủ");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Mật khẩu mới không khớp");
      return;
    }
    if (!check.valid) {
      toast.error("Mật khẩu mới chưa đủ mạnh");
      return;
    }
    // Mock change
    logAudit({ user, action: "password_change", module: "auth", description: "Đổi mật khẩu", success: true });
    toast.success("Đổi mật khẩu thành công!");
    setOldPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <div className="card p-5 max-w-2xl">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <KeyRound className="w-4 h-4 text-amber-500" /> Đổi mật khẩu
      </h3>
      <div className="space-y-3">
        <Field label="Mật khẩu hiện tại">
          <div className="relative">
            <input className="input pr-9" type={showOld ? "text" : "password"} value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
            <button onClick={() => setShowOld(!showOld)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
              {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </Field>
        <Field label="Mật khẩu mới">
          <div className="relative">
            <input className="input pr-9" type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPw && <PasswordStrengthMeter strength={check.strength} score={check.score} failures={check.failures} />}
        </Field>
        <Field label="Nhập lại mật khẩu mới">
          <input
            className={`input ${confirmPw && confirmPw !== newPw ? "border-red-500" : ""}`}
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
          />
          {confirmPw && confirmPw !== newPw && <p className="text-[10px] text-red-600 mt-1">Mật khẩu không khớp</p>}
        </Field>
        <button onClick={handleChange} className="btn-primary w-full">Cập nhật mật khẩu</button>
      </div>
    </div>
  );
}

function PasswordStrengthMeter({ strength, score, failures }: { strength: PasswordStrength; score: number; failures: string[] }) {
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${strengthColor(strength)} transition-all`} style={{ width: `${score}%` }} />
        </div>
        <span className="text-[10px] font-medium">{strengthLabel(strength)}</span>
      </div>
      {failures.length > 0 && (
        <div className="space-y-0.5">
          {failures.map((f, i) => (
            <div key={i} className="text-[10px] text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {f}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TwoFATab({ user }: { user: any }) {
  const [step, setStep] = useState<"idle" | "setup" | "verify">("idle");
  const [code, setCode] = useState("");
  const [config, setConfig] = useState<TwoFactorConfig | null>(is2FAEnabled(user.email) ? setup2FA(user.email, user.email) : null);
  const [copied, setCopied] = useState(false);

  const enabled = is2FAEnabled(user.email);

  const handleSetup = () => {
    const newConfig = setup2FA(user.email, user.email);
    setConfig(newConfig);
    setStep("verify");
    toast.info("Đã tạo secret. Nhập mã 123456 để verify (mock)");
  };

  const handleVerify = () => {
    const res = enable2FA(user.email, code);
    if (res.ok) {
      toast.success("2FA đã bật!");
      setStep("idle");
      setCode("");
    } else {
      toast.error(res.error || "Mã sai");
    }
  };

  const handleDisable = () => {
    if (confirm("Tắt 2FA? Giảm bảo mật.")) {
      disable2FA(user.email);
      setConfig(null);
      toast.success("Đã tắt 2FA");
    }
  };

  const copyBackup = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Xác thực 2 yếu tố
        </h3>
        <p className="text-sm opacity-70 mb-4">
          2FA bảo vệ tài khoản bằng cách yêu cầu mã 6 số từ app (Google Authenticator, Authy, ...) mỗi lần đăng nhập.
        </p>
        {enabled ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-emerald-700">Đã bật 2FA</div>
                <div className="text-xs opacity-70">Tài khoản được bảo vệ thêm 1 lớp</div>
              </div>
            </div>
            <button onClick={handleDisable} className="btn-secondary w-full text-red-600">Tắt 2FA</button>
          </div>
        ) : step === "idle" ? (
          <button onClick={handleSetup} className="btn-primary w-full flex items-center gap-2 justify-center">
            <ShieldCheck className="w-4 h-4" /> Bật 2FA
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
              <div className="font-semibold mb-1">Bước 2: Quét QR / nhập secret</div>
              {config && (
                <code className="block bg-white/50 dark:bg-black/30 p-2 rounded mt-1 break-all text-[10px]">
                  {config.secret}
                </code>
              )}
              <div className="mt-2 opacity-70">(Mock - dùng mã <b>123456</b> để test)</div>
            </div>
            <input
              className="input text-center text-lg font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <div className="flex gap-2">
              <button onClick={() => setStep("idle")} className="btn-secondary flex-1">Huỷ</button>
              <button onClick={handleVerify} className="btn-primary flex-1">Xác nhận</button>
            </div>
          </div>
        )}
      </div>
      <div className="card p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-500" /> Backup codes
        </h3>
        <p className="text-sm opacity-70 mb-3">
          Dùng khi mất thiết bị. Mỗi code chỉ dùng được 1 lần.
        </p>
        {config ? (
          <div className="grid grid-cols-2 gap-2">
            {config.backupCodes?.map((c, i) => (
              <button
                key={i}
                onClick={() => copyBackup(c)}
                className="p-2 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs flex items-center justify-between hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span>{c}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-50" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 opacity-50 text-sm">Bật 2FA để tạo backup codes</div>
        )}
      </div>
    </div>
  );
}

function ActivityTab({ user }: { user: any }) {
  const logs = useMemo(() => {
    return filterAuditLogs(getAuditLogs(), { userId: user.id }).slice(0, 50);
  }, [user.id]);

  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4 text-violet-500" /> Hoạt động gần đây ({logs.length})
      </h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 opacity-60 text-sm">Chưa có hoạt động nào</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/30 dark:hover:bg-white/5">
              <div className={`w-2 h-2 rounded-full mt-2 ${log.success ? "bg-emerald-500" : "bg-red-500"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-sm">{log.description}</div>
                <div className="text-[10px] opacity-60">
                  {new Date(log.timestamp).toLocaleString("vi-VN")} · {log.action} · {log.module}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium opacity-70 block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon className="w-4 h-4 opacity-50" />
      <span className="opacity-70 w-28 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
