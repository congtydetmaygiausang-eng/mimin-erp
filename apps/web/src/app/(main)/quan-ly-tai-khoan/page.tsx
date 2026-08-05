"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Plus, Edit, Trash2, Lock, Unlock, Search, X,
  Shield, Key, Mail, Phone, Building2, UserCheck, UserX,
  Eye, EyeOff, RefreshCw, AlertCircle, Building, Hammer, Filter,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { ROLE_LABELS, ROLE_COLORS, ALL_ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// 9 role (them content, partner)
const ROLE_OPTIONS = ALL_ROLES;

// Phong ban
const PHONG_BAN_OPTIONS = [
  "ban-giam-doc", "ban-dieu-hanh", "ke-toan", "ban-content", "ban-kho",
  "to-cat", "to-may", "to-khuy-nut", "to-ui", "to-dong-goi",
  "ban-qc", "doi-tac", "khac",
] as const;

const PHONG_BAN_LABELS: Record<string, string> = {
  "ban-giam-doc": "Ban giám đốc",
  "ban-dieu-hanh": "Điều hành SX",
  "ke-toan": "Kế toán",
  "ban-content": "Content / Media",
  "ban-kho": "Kho",
  "to-cat": "Tổ cắt",
  "to-may": "Tổ may",
  "to-khuy-nut": "Khuy nút",
  "to-ui": "Ủi",
  "to-dong-goi": "Gấp xếp / Đóng gói",
  "ban-qc": "QC",
  "doi-tac": "Đối tác gia công",
  "khac": "Khác",
};

const PHONG_BAN_COLORS: Record<string, string> = {
  "ban-giam-doc": "bg-rose-500",
  "ban-dieu-hanh": "bg-violet-500",
  "ke-toan": "bg-blue-500",
  "ban-content": "bg-pink-500",
  "ban-kho": "bg-amber-500",
  "to-cat": "bg-cyan-500",
  "to-may": "bg-sky-500",
  "to-khuy-nut": "bg-orange-500",
  "to-ui": "bg-rose-500",
  "to-dong-goi": "bg-fuchsia-500",
  "ban-qc": "bg-emerald-500",
  "doi-tac": "bg-purple-500",
  "khac": "bg-slate-500",
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  chucVu: string | null;
  phongBan: string | null;
  maNV: string | null;
  isActive: boolean;
  created_at: string;
  updated_at: string;
};

type UserType = "all" | "noi-bo" | "ncc";

export default function QuanLyTaiKhoanPage() {
  const { user } = useSession();
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("Tất cả");
  const [filterPhongBan, setFilterPhongBan] = useState<string>("Tất cả");
  const [filterType, setFilterType] = useState<UserType>("all");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (json.error) {
        toast.error("Lỗi: " + json.error);
        setList([]);
      } else {
        setList(json.users || []);
      }
    } catch (e) {
      toast.error("Lỗi fetch: " + (e as Error).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    let f = list;
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.chucVu || "").toLowerCase().includes(s)
      );
    }
    if (filterRole !== "Tất cả") f = f.filter((u) => u.role === filterRole);
    if (filterPhongBan !== "Tất cả") f = f.filter((u) => u.phongBan === filterPhongBan);
    if (filterType === "noi-bo") f = f.filter((u) => u.role !== "partner");
    if (filterType === "ncc") f = f.filter((u) => u.role === "partner");
    return f;
  }, [list, search, filterRole, filterPhongBan, filterType]);

  // Stats
  const stats = useMemo(() => {
    const tong = list.length;
    const active = list.filter((u) => u.isActive).length;
    const partner = list.filter((u) => u.role === "partner").length;
    const pbSet = new Set(list.map((u) => u.phongBan).filter(Boolean));
    return { tong, active, partner, phongBan: pbSet.size };
  }, [list]);

  // Phan bo theo phong ban
  const byPhongBan = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of list) {
      const pb = u.phongBan || "khac";
      map.set(pb, (map.get(pb) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pb, count]) => ({ pb, count, label: PHONG_BAN_LABELS[pb] || pb, color: PHONG_BAN_COLORS[pb] || "bg-slate-500" }));
  }, [list]);

  return (
    <div className="max-w-6xl mx-auto space-y-3 p-3 animate-fade-in">
      {/* Header */}
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-blue-500" /> Quản lý tài khoản
            </h1>
            <p className="opacity-70 text-sm">
              Phân quyền theo Role + Phòng ban · Tạo tài khoản từ hồ sơ nhân sự
            </p>
          </div>
          <button
            onClick={fetchUsers}
            className="text-xs px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 flex items-center gap-1"
            title="Tải lại"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat n={stats.tong} label="Tổng TK" sub="Tất cả" color="blue" icon={Users} />
        <Stat n={stats.active} label="Đang hoạt động" sub="active" color="emerald" icon={UserCheck} />
        <Stat n={stats.tong - stats.active} label="Bị khóa" sub="disabled" color="rose" icon={UserX} />
        <Stat n={stats.phongBan} label="Phòng ban" sub="đang hoạt động" color="violet" icon={Building2} />
      </div>

      {/* Phan bo theo phong ban */}
      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <Building className="w-4 h-4" /> Phân bố theo phòng ban
        </h3>
        <div className="space-y-1.5">
          {byPhongBan.map((p) => (
            <div key={p.pb} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${p.color}`} />
              <span className="text-xs flex-1">{p.label}</span>
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div className={`h-full ${p.color}`} style={{ width: `${(p.count / Math.max(stats.tong, 1)) * 100}%` }} />
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
        <select value={filterType} onChange={(e) => setFilterType(e.target.value as UserType)} className="text-xs px-2 py-1.5 rounded border" title="Loại user">
          <option value="all">Tất cả loại</option>
          <option value="noi-bo">👔 Nội bộ</option>
          <option value="ncc">🤝 NCC gia công</option>
        </select>
        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="text-xs px-2 py-1.5 rounded border" title="Lọc theo role">
          <option>Tất cả</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select value={filterPhongBan} onChange={(e) => setFilterPhongBan(e.target.value)} className="text-xs px-2 py-1.5 rounded border" title="Lọc theo phòng ban">
          <option>Tất cả</option>
          {PHONG_BAN_OPTIONS.map((p) => <option key={p} value={p}>{PHONG_BAN_LABELS[p]}</option>)}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="text-xs px-3 py-1.5 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Tạo TK
        </button>
      </div>

      {/* Account list */}
      <div className="space-y-2">
        {loading ? (
          <div className="card p-6 text-center text-sm opacity-60">
            <RefreshCw className="w-5 h-5 inline animate-spin mr-2" /> Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-6 text-center text-sm opacity-60">
            Không có tài khoản nào khớp bộ lọc
          </div>
        ) : (
          filtered.map((u) => (
            <UserCard
              key={u.id}
              u={u}
              onEdit={() => setEditing(u)}
              onDeleted={fetchUsers}
              onToggled={fetchUsers}
            />
          ))
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchUsers(); }}
        />
      )}

      {/* Create modal */}
      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); fetchUsers(); }}
        />
      )}
    </div>
  );
}

// =================== USER CARD ===================
function UserCard({ u, onEdit, onDeleted, onToggled }: {
  u: UserRow;
  onEdit: () => void;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleToggle = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const json = await res.json();
      if (json.error) toast.error("Lỗi: " + json.error);
      else { toast.success(u.isActive ? "Đã khóa TK" : "Đã mở khóa"); onToggled(); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Xóa tài khoản ${u.email}?\n\nLưu ý: Xóa trong CẢ auth.users và bảng users. Không thể hoàn tác.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) toast.error("Lỗi: " + json.error);
      else { toast.success("Đã xóa TK"); onDeleted(); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-3">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${PHONG_BAN_COLORS[u.phongBan || "khac"] || "bg-slate-500"} text-white flex items-center justify-center font-bold shrink-0`}>
          {u.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{u.name}</span>
            {u.maNV && <span className="text-[10px] font-mono opacity-60">{u.maNV}</span>}
            <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || "bg-slate-500"}`}>
              {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
            </span>
            {u.phongBan && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${PHONG_BAN_COLORS[u.phongBan] || "bg-slate-500"}`}>
                {PHONG_BAN_LABELS[u.phongBan] || u.phongBan}
              </span>
            )}
            {!u.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-slate-500">🔒 BỊ KHÓA</span>
            )}
          </div>
          <div className="text-xs opacity-70 mt-1 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {u.email}</span>
          </div>
          <div className="text-[10px] opacity-60 mt-1">
            Chức vụ: {u.chucVu || "—"} · Tạo: {new Date(u.created_at).toLocaleDateString("vi-VN")}
          </div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <button onClick={onEdit} disabled={busy} className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50" title="Sửa">
            <Edit className="w-3 h-3" />
          </button>
          <button onClick={handleToggle} disabled={busy} className={`text-xs px-2 py-1 rounded text-white ${u.isActive ? "bg-amber-500 hover:bg-amber-600" : "bg-emerald-500 hover:bg-emerald-600"} disabled:opacity-50`} title={u.isActive ? "Khóa" : "Mở"}>
            {u.isActive ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
          <button onClick={handleDelete} disabled={busy} className="text-xs px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50" title="Xóa">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =================== EDIT MODAL ===================
function EditUserModal({ user, onClose, onSaved }: {
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState({ ...user });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          role: data.role,
          chucVu: data.chucVu,
          phongBan: data.phongBan,
          maNV: data.maNV,
          isActive: data.isActive,
        }),
      });
      const json = await res.json();
      if (json.error) toast.error("Lỗi: " + json.error);
      else { toast.success("Đã cập nhật"); onSaved(); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Sửa tài khoản: ${user.email}`}>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Họ tên *" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
        <Field label="Mã NV" value={data.maNV || ""} onChange={(v) => setData({ ...data, maNV: v })} />
        <Field label="Chức vụ" value={data.chucVu || ""} onChange={(v) => setData({ ...data, chucVu: v })} />
        <SelectField label="Role *" value={data.role} options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} onChange={(v) => setData({ ...data, role: v })} />
        <SelectField label="Phòng ban" value={data.phongBan || "khac"} options={PHONG_BAN_OPTIONS.map((p) => ({ value: p, label: PHONG_BAN_LABELS[p] }))} onChange={(v) => setData({ ...data, phongBan: v })} />
        <SelectField
          label="Trạng thái"
          value={data.isActive ? "active" : "disabled"}
          options={[
            { value: "active", label: "🟢 Hoạt động" },
            { value: "disabled", label: "🔒 Bị khóa" },
          ]}
          onChange={(v) => setData({ ...data, isActive: v === "active" })}
        />
      </div>
      <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-700 dark:text-amber-300 mt-2">
        <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
        Thay đổi Role sẽ đồng bộ sang <code>auth.users.app_metadata</code>. User cần <b>đăng xuất + đăng nhập lại</b> để áp dụng.
      </div>
      <div className="flex gap-2 pt-3">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 bg-blue-500 disabled:opacity-50">
          {saving ? "Đang lưu..." : "💾 Cập nhật"}
        </button>
      </div>
    </Modal>
  );
}

// =================== CREATE MODAL ===================
function CreateUserModal({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [data, setData] = useState({
    email: "",
    password: "",
    name: "",
    role: "planner" as string,
    chucVu: "",
    phongBan: "khac" as string,
    maNV: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleCreate = async () => {
    if (!data.email || !data.password || !data.name) {
      toast.error("Vui lòng điền email, mật khẩu, họ tên");
      return;
    }
    if (data.password.length < 6) {
      toast.error("Mật khẩu phải >= 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) toast.error("Lỗi: " + json.error);
      else { toast.success("Đã tạo tài khoản: " + data.email); onCreated(); }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Tạo tài khoản mới">
      <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-2 rounded mb-2">
        Tạo user thật trong <code>auth.users</code> + bảng <code>users</code> (Supabase). Có thể login ngay.
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Họ tên *" value={data.name} onChange={(v) => setData({ ...data, name: v })} placeholder="Nguyễn Văn A" />
        <Field label="Mã NV" value={data.maNV} onChange={(v) => setData({ ...data, maNV: v })} placeholder="NV001" />
        <Field label="Email *" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="a@mimin.vn" type="email" />
        <div>
          <label className="text-xs font-semibold opacity-70">Mật khẩu *</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
              placeholder="Mimin@123 (mặc định)"
              className="w-full mt-0.5 px-2 py-1.5 pr-8 rounded border text-sm"
            />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400">
              {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
        <Field label="Chức vụ" value={data.chucVu} onChange={(v) => setData({ ...data, chucVu: v })} placeholder="Nhân viên kho" />
        <SelectField label="Role *" value={data.role} options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))} onChange={(v) => setData({ ...data, role: v })} />
        <SelectField label="Phòng ban" value={data.phongBan} options={PHONG_BAN_OPTIONS.map((p) => ({ value: p, label: PHONG_BAN_LABELS[p] }))} onChange={(v) => setData({ ...data, phongBan: v })} />
      </div>
      <div className="flex gap-2 pt-3">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 bg-blue-500 disabled:opacity-50">
          {saving ? "Đang tạo..." : "🚀 Tạo tài khoản"}
        </button>
      </div>
    </Modal>
  );
}

// =================== HELPER COMPONENTS ===================
function Stat({ n, label, sub, color, icon: Icon }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700 dark:text-blue-300",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700 dark:text-emerald-300",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700 dark:text-rose-300",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-700 dark:text-violet-300",
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

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold opacity-70">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" /> {title}
          </h2>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
