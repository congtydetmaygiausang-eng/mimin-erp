"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Edit, Trash2, Lock, Unlock, Search, Filter, X,
  Shield, Key, Mail, Phone, Building2, UserCheck, UserX,
  Eye, EyeOff, Copy, Check, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  getAllAccounts, upsertAccount, deleteAccount, toggleAccountStatus,
  resetPassword, thongKeAccounts, PHONG_BAN_LABELS, PHONG_BAN_COLORS,
  type UserAccount, type PhongBan,
} from "@/lib/user-accounts";
import { ROLE_LABELS } from "@/lib/permissions";
import UserProfileModal from "@/components/UserProfileModal";

const PHONG_BAN_OPTIONS: PhongBan[] = [
  "ban-giam-doc", "ke-toan", "mua-hang", "kho-soi", "xuong-det",
  "xuong-nhuom", "kho-tp", "qc", "to-may", "hoan-thien", "giao-hang", "khac",
];

const ROLE_OPTIONS = ["admin", "planner", "warehouse", "sewing", "qc", "finishing", "accountant"] as const;

export default function QuanLyTaiKhoanPage() {
  const { user } = useSession();
  const [list, setList] = useState(getAllAccounts());
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [search, setSearch] = useState("");
  const [filterPhongBan, setFilterPhongBan] = useState<string>("Tất cả");
  const [filterStatus, setFilterStatus] = useState<string>("Tất cả");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [viewProfile, setViewProfile] = useState<UserAccount | null>(null);

  const refresh = () => setList(getAllAccounts());

  // Filter
  let filtered = list;
  if (search) {
    filtered = filtered.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.chucVu.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (filterPhongBan !== "Tất cả") {
    filtered = filtered.filter((a) => a.phongBan === filterPhongBan);
  }
  if (filterStatus !== "Tất cả") {
    filtered = filtered.filter((a) => a.trangThai === filterStatus);
  }

  // Stats
  const stats = thongKeAccounts();

  return (
    <div className="max-w-6xl mx-auto space-y-3 p-3 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Users className="w-7 h-7 text-blue-500" /> Quản lý tài khoản
        </h1>
        <p className="opacity-70 text-sm">
          Phân quyền theo Role + Phòng ban · Tạo tài khoản từ hồ sơ nhân sự
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat n={stats.tong} label="Tổng TK" sub="Tất cả" color="blue" icon={Users} />
        <Stat n={stats.active} label="Đang hoạt động" sub="active" color="emerald" icon={UserCheck} />
        <Stat n={stats.disabled} label="Bị khóa" sub="disabled" color="rose" icon={UserX} />
        <Stat n={stats.theoPhongBan.length} label="Phòng ban" sub="đang hoạt động" color="violet" icon={Building2} />
      </div>

      {/* Phân bố theo phòng ban */}
      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">🏢 Phân bố theo phòng ban</h3>
        <div className="space-y-1.5">
          {stats.theoPhongBan.map((p) => (
            <div key={p.phongBan} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${p.color}`} />
              <span className="text-xs flex-1">{p.ten}</span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${p.color}`} style={{ width: `${(p.count / stats.tong) * 100}%` }} />
              </div>
              <span className="text-xs font-bold w-8 text-right">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-2 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, email, chức vụ..."
            className="w-full pl-7 pr-2 py-1.5 rounded border text-xs"
          />
        </div>
        <select value={filterPhongBan} onChange={(e) => setFilterPhongBan(e.target.value)} className="text-xs px-2 py-1.5 rounded border">
          <option>Tất cả</option>
          {PHONG_BAN_OPTIONS.map((p) => <option key={p} value={p}>{PHONG_BAN_LABELS[p]}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs px-2 py-1.5 rounded border">
          <option>Tất cả</option>
          <option value="active">Đang hoạt động</option>
          <option value="disabled">Bị khóa</option>
        </select>
        <button
          onClick={() => setEditing({
            id: "", email: "", password: "", name: "", role: "planner",
            phongBan: "khac", chucVu: "", trangThai: "active", ngayTao: new Date().toISOString().slice(0, 10),
          })}
          className="btn-primary text-xs bg-blue-500"
        >
          <Plus className="w-3.5 h-3.5 inline" /> Tạo TK
        </button>
      </div>

      {/* Account list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card p-6 text-center text-sm opacity-60">Không có tài khoản nào</div>
        ) : (
          filtered.map((a) => (
            <div key={a.id} className="card p-3">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full ${PHONG_BAN_COLORS[a.phongBan]} text-white flex items-center justify-center font-bold shrink-0`}>
                  {a.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{a.name}</span>
                    <span className="text-[10px] font-mono opacity-60">{a.id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                      a.role === "admin" ? "bg-rose-500" :
                      a.role === "qc" ? "bg-emerald-500" :
                      a.role === "warehouse" ? "bg-amber-500" :
                      a.role === "sewing" ? "bg-sky-500" :
                      "bg-blue-500"
                    }`}>
                      {ROLE_LABELS[a.role as keyof typeof ROLE_LABELS] || (a.role as string)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${PHONG_BAN_COLORS[a.phongBan]}`}>
                      {PHONG_BAN_LABELS[a.phongBan]}
                    </span>
                    {a.trangThai === "disabled" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-slate-500">
                        🔒 BỊ KHÓA
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {a.email}</span>
                    {a.sdt && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {a.sdt}</span>}
                    <span className="flex items-center gap-1">
                      <Key className="w-2.5 h-2.5" />
                      <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px]">
                        {showPassword[a.id] ? a.password : "••••••••"}
                      </code>
                      <button
                        onClick={() => setShowPassword({ ...showPassword, [a.id]: !showPassword[a.id] })}
                        className="text-[10px] opacity-60"
                      >
                        {showPassword[a.id] ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                      </button>
                    </span>
                  </div>
                  <div className="text-[10px] opacity-60 mt-1">
                    Chức vụ: {a.chucVu} · Tạo: {a.ngayTao}
                    {a.lanDangNhapCuoi && ` · Đăng nhập cuối: ${a.lanDangNhapCuoi}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => setViewProfile(a)}
                    className="text-xs px-2 py-1 rounded bg-cyan-500 text-white"
                    title="Xem profile"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setEditing(a)}
                    className="text-xs px-2 py-1 rounded bg-blue-500 text-white"
                    title="Sửa"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      const r = toggleAccountStatus(a.id, user);
                      if (r.ok) { toast.success(r.message); refresh(); }
                      else toast.error(r.message);
                    }}
                    className={`text-xs px-2 py-1 rounded text-white ${
                      a.trangThai === "active" ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    title={a.trangThai === "active" ? "Khóa TK" : "Mở khóa"}
                  >
                    {a.trangThai === "active" ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => {
                      const newPw = prompt(`Reset mật khẩu cho ${a.email}:`, "newpass123");
                      if (newPw && newPw.length >= 6) {
                        const r = resetPassword(a.id, newPw, user);
                        if (r.ok) { toast.success(r.message); refresh(); }
                      } else {
                        toast.error("Mật khẩu phải >= 6 ký tự");
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-violet-500 text-white"
                    title="Reset MK"
                  >
                    <Key className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa tài khoản ${a.email}?`)) {
                        const r = deleteAccount(a.id, user);
                        if (r.ok) { toast.success(r.message); refresh(); }
                        else toast.error(r.message);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-rose-500 text-white"
                    title="Xóa"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile modal (B+) */}
      <UserProfileModal
        open={!!viewProfile}
        onClose={() => setViewProfile(null)}
        account={viewProfile}
        onEdit={(a) => {
          setViewProfile(null);
          setEditing(a);
        }}
        onToggleLock={(id) => {
          const r = toggleAccountStatus(id, user);
          if (r.ok) {
            toast.success(r.message);
            refresh();
            setViewProfile(null);
          } else toast.error(r.message);
        }}
      />

      {/* Edit modal */}
      {editing && (
        <Modal onClose={() => setEditing(null)}>
          <AccountForm
            acc={editing}
            onClose={() => setEditing(null)}
            onSave={() => { refresh(); setEditing(null); }}
            currentUser={user}
          />
        </Modal>
      )}
    </div>
  );
}

function AccountForm({ acc, onClose, onSave, currentUser }: any) {
  const [data, setData] = useState(acc);
  const [showPw, setShowPw] = useState(false);

  const isNew = !acc.id;
  const generatedPassword = isNew ? `${data.email.split("@")[0] || "user"}${Math.floor(Math.random() * 1000)}` : data.password;

  return (
    <div className="space-y-2">
      <h3 className="font-bold text-lg flex items-center gap-2">
        {isNew ? <Plus className="w-5 h-5 text-blue-500" /> : <Edit className="w-5 h-5 text-blue-500" />}
        {isNew ? "Tạo tài khoản mới" : `Sửa ${acc.name}`}
      </h3>

      <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded flex items-start gap-1">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5" />
        Mật khẩu lưu plain text (chỉ demo). Khi deploy thật cần hash + salt.
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="text-xs font-semibold opacity-70">Họ tên *</label>
          <input
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            placeholder="Nguyễn Văn A"
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Email *</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            placeholder="a@mimin.vn"
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Mật khẩu *</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              className="w-full mt-0.5 px-2 py-1.5 pr-8 rounded border text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {isNew && (
            <button
              type="button"
              onClick={() => setData({ ...data, password: generatedPassword })}
              className="text-[10px] text-blue-600 mt-0.5"
            >
              🎲 Auto-generate: {generatedPassword}
            </button>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Chức vụ *</label>
          <input
            value={data.chucVu}
            onChange={(e) => setData({ ...data, chucVu: e.target.value })}
            placeholder="Nhân viên kho"
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">SĐT</label>
          <input
            value={data.sdt || ""}
            onChange={(e) => setData({ ...data, sdt: e.target.value })}
            placeholder="0901234567"
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Role *</label>
          <select
            value={data.role}
            onChange={(e) => setData({ ...data, role: e.target.value as any })}
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          >
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Phòng ban *</label>
          <select
            value={data.phongBan}
            onChange={(e) => setData({ ...data, phongBan: e.target.value as PhongBan })}
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          >
            {PHONG_BAN_OPTIONS.map((p) => <option key={p} value={p}>{PHONG_BAN_LABELS[p]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Mã NV (liên kết)</label>
          <input
            value={data.maNV || ""}
            onChange={(e) => setData({ ...data, maNV: e.target.value })}
            placeholder="NV001"
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Trạng thái</label>
          <select
            value={data.trangThai}
            onChange={(e) => setData({ ...data, trangThai: e.target.value as any })}
            className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
          >
            <option value="active">🟢 Đang hoạt động</option>
            <option value="disabled">🔒 Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Hiển thị phân quyền theo role + phòng ban */}
      <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-xs">
        <div className="font-semibold mb-1">📋 Phân quyền tự động:</div>
        <div>• Role: <strong>{ROLE_LABELS[data.role as keyof typeof ROLE_LABELS] || (data.role as string)}</strong> → Quyền theo ma trận 21 module</div>
        <div>• Phòng ban: <strong>{PHONG_BAN_LABELS[data.phongBan as keyof typeof PHONG_BAN_LABELS] || (data.phongBan as string)}</strong> → Scope dữ liệu</div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button
          onClick={() => {
            if (!data.name || !data.email || !data.password || !data.chucVu) {
              toast.error("Vui lòng điền đầy đủ");
              return;
            }
            if (data.password.length < 6) {
              toast.error("Mật khẩu phải >= 6 ký tự");
              return;
            }
            const r = upsertAccount(data, currentUser);
            if (r.ok) {
              toast.success(r.message);
              onSave();
            } else toast.error(r.message);
          }}
          className="btn-primary flex-1 bg-blue-500"
        >
          💾 {isNew ? "Tạo tài khoản" : "Cập nhật"}
        </button>
      </div>
    </div>
  );
}

function Stat({ n, label, sub, color, icon: Icon }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-700",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] opacity-70">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{n}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-2xl">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
