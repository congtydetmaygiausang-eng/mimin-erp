"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, Plus, Edit, Trash2, Lock, Unlock, Search, X,
  Shield, Key, Mail, Phone, Building2, UserCheck, UserX,
  Eye, EyeOff, RefreshCw, AlertCircle, Building, Filter,
  Briefcase, KeyRound, Copy, Check, Sparkles, UserPlus,
  Link2, ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle,
  ArrowRight, CheckCircle, HelpCircle, Layers, FileText,
  Calendar, Clock, UserCog, ExternalLink, ShieldOff
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  ROLE_LABELS,
  ROLE_COLORS,
  ALL_ROLES,
  ALL_MODULES,
  MODULE_LABELS,
  getFullMatrix,
  loadSharedPermissionMatrix,
  subscribeSharedPermissionMatrix,
  type Role,
  type Module
} from "@/lib/permissions";
import { authFetch } from "@/lib/auth-fetch";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import type { NhanSuExt } from "@/app/(main)/nhan-su/data";
import { LOCAL_ACCOUNT_MODE } from "@/lib/local-account-mode";
import { LocalAccountManager } from "@/components/local-account-manager";
import { AccountLinkReview } from "@/components/account-link-review";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";

export const dynamic = "force-dynamic";

// 18 roles
const ROLE_OPTIONS = ALL_ROLES;

// Phong ban
const PHONG_BAN_OPTIONS = [
  "ban-giam-doc", "ban-dieu-hanh", "ke-toan", "ban-content", "ban-kho",
  "to-cat", "to-may", "to-khuy-nut", "to-ui", "to-dong-goi",
  "ban-qc", "doi-tac", "khac",
] as const;

const PHONG_BAN_LABELS: Record<string, string> = {
  "ban-giam-doc": "Ban Giám Đốc",
  "ban-dieu-hanh": "Điều Hành SX",
  "ke-toan": "Kế Toán",
  "ban-content": "Content / Media",
  "ban-kho": "Kho Vải & Phụ Liệu",
  "to-cat": "Tổ Cắt",
  "to-may": "Tổ May",
  "to-khuy-nut": "Khuy Nút",
  "to-ui": "Tổ Ủi",
  "to-dong-goi": "Đóng Gói / Nhập Kho",
  "ban-qc": "Kiểm Tra QC",
  "doi-tac": "Đối Tác Gia Công",
  "khac": "Khác / Hành Chính",
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

const PHONG_BAN_TO_BO_PHAN: Record<string, string> = {
  "ban-giam-doc": "Quản lý",
  "ban-dieu-hanh": "Quản lý",
  "ke-toan": "Kế toán",
  "ban-content": "Kinh doanh",
  "ban-kho": "Kho vận",
  "to-cat": "Sản xuất",
  "to-may": "Sản xuất",
  "to-khuy-nut": "Sản xuất",
  "to-ui": "Sản xuất",
  "to-dong-goi": "Sản xuất",
  "ban-qc": "QC",
  "doi-tac": "Kinh doanh",
  "khac": "Hành chính",
};

const BO_PHAN_TO_PHONG_BAN: Record<string, string> = {
  "Quản lý": "ban-dieu-hanh",
  "Kế toán": "ke-toan",
  "Kinh doanh": "ban-content",
  "Kho vận": "ban-kho",
  "Sản xuất": "to-may",
  "QC": "ban-qc",
  "Hành chính": "khac",
};

export type UserRow = {
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

type UserType = "all" | "noi-bo" | "ncc" | "can-kiem-tra";
type TabKey = "accounts" | "linking" | "roles" | "security-audit";

export default function QuanLyTaiKhoanPage() {
  return LOCAL_ACCOUNT_MODE ? <LocalAccountManager /> : <LiveAccountManager />;
}

function LiveAccountManager() {
  const { user, authSource } = useSession();
  const [activeTab, setActiveTab] = useState<TabKey>("accounts");
  const [list, setList] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("Tất cả");
  const [filterPhongBan, setFilterPhongBan] = useState<string>("Tất cả");
  const [filterType, setFilterType] = useState<UserType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "disabled">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Modals
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [resettingPw, setResettingPw] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [prefilledEmployee, setPrefilledEmployee] = useState<string | null>(null);

  // Permission Matrix for Tab 3
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [matrix, setMatrix] = useState(getFullMatrix);

  useEffect(() => {
    let active = true;
    void loadSharedPermissionMatrix().then((val) => {
      if (active) setMatrix(val);
    }).catch(() => {});
    const unsub = subscribeSharedPermissionMatrix((val) => {
      if (active) setMatrix(val);
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/users", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Tải danh sách thất bại (${res.status})`);
      }
      setList(json.users || []);
    } catch (e) {
      if (isSupabaseEnabled && supabase) {
        try {
          const { data: directData, error: directErr } = await supabase
            .from("users")
            .select('id, email, name, role, "chucVu", "phongBan", "isActive", "maNV", created_at, updated_at')
            .order("role", { ascending: true })
            .order("email", { ascending: true });
          if (!directErr && directData && directData.length > 0) {
            setList(directData as UserRow[]);
            toast.warning("Đã tải dữ liệu qua kết nối trực tiếp Supabase");
            return;
          }
        } catch {
          // Ignore fallback error
        }
      }
      toast.error("Không tải được danh sách tài khoản: " + (e as Error).message);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Phân tích bảo mật & rà soát
  const auditAnalysis = useMemo(() => {
    const issues: Array<{ user: UserRow; reason: string; severity: "high" | "medium" | "low" }> = [];
    list.forEach((u) => {
      const email = u.email.toLowerCase();
      const name = u.name.toLowerCase();

      // Kiểm tra tài khoản test / probe
      if (
        email.includes("test") ||
        email.includes("probe") ||
        email.includes("codex") ||
        name.includes("test") ||
        name.includes("probe")
      ) {
        issues.push({
          user: u,
          reason: "Tài khoản kiểm thử tự động (Test / Probe / RLS)",
          severity: "high"
        });
        return;
      }

      // Email không thuộc tên miền mimin.vn
      if (!email.endsWith("@mimin.vn")) {
        issues.push({
          user: u,
          reason: `Email sử dụng tên miền ngoài (${email.split("@")[1] || "ngoại lai"}), không theo chuẩn @mimin.vn`,
          severity: "medium"
        });
      }

      // Thiếu mã nhân viên liên kết
      if (!u.maNV && u.role !== "partner") {
        issues.push({
          user: u,
          reason: "Chưa liên kết với hồ sơ nhân sự (thiếu mã NV)",
          severity: "low"
        });
      }
    });

    return issues;
  }, [list]);

  // Bộ lọc danh sách
  const filtered = useMemo(() => {
    let f = list;
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s) ||
          (u.maNV || "").toLowerCase().includes(s) ||
          (u.chucVu || "").toLowerCase().includes(s)
      );
    }
    if (filterRole !== "Tất cả") f = f.filter((u) => u.role === filterRole);
    if (filterPhongBan !== "Tất cả") f = f.filter((u) => u.phongBan === filterPhongBan);
    if (filterType === "noi-bo") f = f.filter((u) => u.role !== "partner" && u.email.endsWith("@mimin.vn"));
    if (filterType === "ncc") f = f.filter((u) => u.role === "partner");
    if (filterType === "can-kiem-tra") f = f.filter((u) => !u.maNV || !u.email.endsWith("@mimin.vn"));
    if (filterStatus === "active") f = f.filter((u) => u.isActive);
    if (filterStatus === "disabled") f = f.filter((u) => !u.isActive);
    return f;
  }, [list, search, filterRole, filterPhongBan, filterType, filterStatus]);

  // Thống kê nhanh
  const stats = useMemo(() => {
    const tong = list.length;
    const active = list.filter((u) => u.isActive).length;
    const disabled = tong - active;
    const partner = list.filter((u) => u.role === "partner").length;
    const linked = list.filter((u) => Boolean(u.maNV)).length;
    const unlinked = tong - linked;
    const pbSet = new Set(list.map((u) => u.phongBan).filter(Boolean));
    return {
      tong,
      active,
      disabled,
      partner,
      linked,
      unlinked,
      phongBan: pbSet.size,
      percentLinked: tong > 0 ? Math.round((linked / tong) * 100) : 0
    };
  }, [list]);

  // Phân bố theo phòng ban
  const byPhongBan = useMemo(() => {
    const map = new Map<string, number>();
    for (const u of list) {
      const pb = u.phongBan || "khac";
      map.set(pb, (map.get(pb) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([pb, count]) => ({
        pb,
        count,
        label: PHONG_BAN_LABELS[pb] || pb,
        color: PHONG_BAN_COLORS[pb] || "bg-slate-500",
      }));
  }, [list]);

  return (
    <div className="max-w-7xl mx-auto space-y-4 p-3 md:p-5 animate-fade-in">
      {/* Header Banner Cao Cấp */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 md:p-6 shadow-xl border border-teal-800/40">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                MIMIN SECURITY & IAM
              </span>
              <span className="text-xs text-slate-400">· Hệ thống Quản trị & Xác thực Nhân sự</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-teal-400" /> Quản Lý Tài Khoản & Phân Quyền
            </h1>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              Kiểm soát tài khoản người dùng, liên kết định danh mã nhân sự, giám sát phân quyền 18 vai trò và tự động rà soát an toàn.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition border border-white/10 backdrop-blur-xs shadow-xs"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
            <button
              onClick={() => {
                setPrefilledEmployee(null);
                setCreating(true);
              }}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tạo Tài Khoản Mới</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-1.5 mt-6 border-t border-slate-700/60 pt-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "accounts"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách Tài Khoản</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === "accounts" ? "bg-slate-950 text-teal-300" : "bg-slate-800 text-slate-300"
            }`}>
              {stats.tong}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("linking")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "linking"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Liên Kết Hồ Sơ Nhân Sự</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              stats.percentLinked >= 90
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
              {stats.percentLinked}%
            </span>
          </button>

          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "roles"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Phân Quyền & Vai Trò</span>
          </button>

          <button
            onClick={() => setActiveTab("security-audit")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "security-audit"
                ? "bg-teal-500 text-slate-950 shadow-md"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Rà Soát & Bảo Mật</span>
            {auditAnalysis.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-500 text-white animate-pulse">
                {auditAnalysis.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cảnh báo chế độ demo nếu có */}
      {authSource === "demo" && (
        <div className="card p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 rounded-xl shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <b>Lưu ý chế độ phiên:</b> Bạn đang đăng nhập bằng phiên dự phòng (chưa phải Supabase Auth trực tiếp).
            Một số chức năng tạo/xóa tài khoản nâng cao trên cloud có thể yêu cầu bạn đăng nhập lại bằng mật khẩu Supabase.
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: DANH SÁCH TÀI KHOẢN (ACTIVE TAB)
         ======================================================== */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          {/* Thẻ Thống Kê KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-300">
                <span className="text-xs font-bold">Tổng Tài Khoản</span>
                <Users className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-blue-950 dark:text-blue-100 mt-1.5">
                {stats.tong}
              </div>
              <div className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-0.5 flex items-center justify-between">
                <span>{stats.phongBan} phòng ban</span>
                <span>{stats.partner} đối tác</span>
              </div>
            </div>

            <div className="card p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                <span className="text-xs font-bold">Đang Hoạt Động</span>
                <UserCheck className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1.5">
                {stats.active}
              </div>
              <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">
                100% bảo mật an toàn
              </div>
            </div>

            <div className="card p-4 rounded-2xl bg-gradient-to-br from-teal-50/70 to-cyan-50/40 dark:from-teal-950/30 dark:to-cyan-950/20 border border-teal-200/60 dark:border-teal-900/40 shadow-xs">
              <div className="flex items-center justify-between text-teal-700 dark:text-teal-300">
                <span className="text-xs font-bold">Đã Liên Kết Mã NV</span>
                <Link2 className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-teal-950 dark:text-teal-100 mt-1.5">
                {stats.linked} <span className="text-sm font-semibold opacity-70">/ {stats.tong}</span>
              </div>
              <div className="text-[11px] text-teal-600/80 dark:text-teal-400 mt-0.5">
                Tỷ lệ chuẩn hóa: {stats.percentLinked}%
              </div>
            </div>

            <div className="card p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-900/40 dark:to-slate-800/30 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span className="text-xs font-bold">Khóa / Cần Kiểm Tra</span>
                <UserX className="w-4 h-4 opacity-70" />
              </div>
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">
                {stats.disabled > 0 ? (
                  <span className="text-rose-600">{stats.disabled}</span>
                ) : (
                  <span className="text-emerald-600 font-bold">0</span>
                )}
                {stats.unlinked > 0 && (
                  <span className="text-xs font-normal text-amber-600 ml-2">({stats.unlinked} chưa có mã)</span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stats.disabled === 0 ? "Không có tài khoản bị khóa" : "Cần rà soát"}
              </div>
            </div>
          </div>

          {/* Phân bố phòng ban trực quan */}
          <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-600" />
                Phân bố nhân sự theo phòng ban
              </span>
              <span className="text-[11px] text-slate-400">
                Hiển thị số lượng tài khoản theo từng ban
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {byPhongBan.map((p) => (
                <div
                  key={p.pb}
                  onClick={() => setFilterPhongBan(filterPhongBan === p.pb ? "Tất cả" : p.pb)}
                  className={`cursor-pointer px-2.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition ${
                    filterPhongBan === p.pb
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold border-transparent shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/70 dark:border-slate-700"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.color}`} />
                  <span>{p.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 font-bold">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Thanh Công Cụ & Bộ Lọc Nâng Cao */}
          <div className="card p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo họ tên, email (@mimin.vn), mã NV, chức vụ..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Lọc Trạng Thái */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">🟢 Đang hoạt động</option>
                <option value="disabled">🔒 Bị khóa</option>
              </select>

              {/* Lọc Loại User */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as UserType)}
                className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">Tất cả loại tài khoản</option>
                <option value="noi-bo">👔 Nội bộ (@mimin.vn)</option>
                <option value="ncc">🤝 Đối tác gia công</option>
                <option value="can-kiem-tra">⚠️ Cần kiểm tra mã NV</option>
              </select>

              {/* Lọc Vai trò */}
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              >
                <option value="Tất cả">Tất cả vai trò ({ROLE_OPTIONS.length})</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              {/* Chuyển đổi View Mode */}
              <DataViewToggle value={viewMode} onChange={setViewMode} modes={["list", "card"]} />
            </div>
          </div>

          {/* User List Render */}
          {loading ? (
            <div className="card p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-8 h-8 mx-auto text-teal-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Đang tải danh sách tài khoản hệ thống...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Không tìm thấy tài khoản nào khớp bộ lọc
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setFilterRole("Tất cả");
                  setFilterPhongBan("Tất cả");
                  setFilterType("all");
                  setFilterStatus("all");
                }}
                className="mt-3 px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Xóa toàn bộ bộ lọc
              </button>
            </div>
          ) : viewMode === "list" ? (
            /* Table View */
            <div className="card rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[200px]">Họ tên & Email</th>
                      <th className="p-3 min-w-[110px]">Mã Nhân Viên</th>
                      <th className="p-3 min-w-[140px]">Vai trò</th>
                      <th className="p-3 min-w-[150px]">Phòng ban</th>
                      <th className="p-3 min-w-[120px]">Trạng thái</th>
                      <th className="p-3 text-right min-w-[170px]">Thao tác bảo mật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filtered.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${PHONG_BAN_COLORS[u.phongBan || "khac"] || "bg-slate-500"} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-100 block truncate">
                                {u.name}
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                                <span>{u.email}</span>
                                <CopyEmailBtn email={u.email} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {u.maNV ? (
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 font-mono font-bold">
                              {u.maNV}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Chưa gắn mã
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-lg text-white font-medium text-[11px] ${ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || "bg-slate-500"}`}>
                            {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                            {PHONG_BAN_LABELS[u.phongBan || "khac"] || u.phongBan || "—"}
                          </span>
                          <span className="block text-[11px] text-slate-400 mt-0.5">
                            {u.chucVu || "—"}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-[11px]">
                              <Lock className="w-3 h-3" /> Đã khóa
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setResettingPw(u)}
                              className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 text-[11px] font-bold flex items-center gap-1 transition"
                              title="Đặt lại mật khẩu"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Đổi MK</span>
                            </button>
                            <button
                              onClick={() => setEditing(u)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
                              title="Sửa thông tin"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <ToggleUserBtn u={u} onToggled={fetchUsers} />
                            <DeleteUserBtn u={u} onDeleted={fetchUsers} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((u) => (
                <UserCard
                  key={u.id}
                  u={u}
                  onEdit={() => setEditing(u)}
                  onResetPassword={() => setResettingPw(u)}
                  onDeleted={fetchUsers}
                  onToggled={fetchUsers}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: LIÊN KẾT HỒ SƠ NHÂN SỰ
         ======================================================== */}
      {activeTab === "linking" && (
        <div className="space-y-4">
          <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-teal-600" />
                  Đối Soát & Đồng Bộ Định Danh (Single Source of Truth)
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                  Mỗi tài khoản đăng nhập cần được liên kết với đúng 1 mã nhân sự (ví dụ: <code>NV01</code>, <code>NV02</code>...) trong cơ sở dữ liệu Nhân sự để tính lương khoán, ghi nhận công đoạn sản xuất và phân công việc chính xác.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-3 py-1 rounded-xl border border-teal-200 dark:border-teal-800">
                  Hoàn tất: {stats.linked}/{stats.tong} ({stats.percentLinked}%)
                </span>
              </div>
            </div>

            {/* Thanh tiến độ */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${stats.percentLinked}%` }}
              />
            </div>

            {/* Tích hợp component AccountLinkReview */}
            <AccountLinkReview onSaved={fetchUsers} />
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: PHÂN QUYỀN & VAI TRÒ (PERMISSION MATRIX)
         ======================================================== */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-600" />
                  Ma Trận Phân Quyền Theo Vai Trò (18 Roles × 40 Modules)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xem chi tiết các quyền Xem, Tạo, Sửa, Xóa tương ứng từng phân hệ sản xuất trong MIMIN ERP.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Chọn vai trò:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as Role)}
                  className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} ({r})
                    </option>
                  ))}
                </select>

                <a
                  href="/phan-quyen-tuy-chinh/"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Chỉnh Quyền Tùy Chỉnh</span>
                </a>
              </div>
            </div>

            {/* Bảng quyền chi tiết */}
            <div className="overflow-x-auto max-h-[520px] rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-600 dark:text-slate-300 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3">Phân Hệ (Module Sản Xuất & Vận Hành)</th>
                    <th className="p-3 text-center w-24">Xem (View)</th>
                    <th className="p-3 text-center w-24">Tạo (Create)</th>
                    <th className="p-3 text-center w-24">Sửa (Edit)</th>
                    <th className="p-3 text-center w-24">Xóa (Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ALL_MODULES.map((m) => {
                    const perm = matrix[selectedRole]?.[m] || [];
                    const canView = perm.includes("r") || perm.includes("v");
                    const canCreate = perm.includes("c");
                    const canEdit = perm.includes("u") || perm.includes("e");
                    const canDelete = perm.includes("d");

                    return (
                      <tr key={m} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {MODULE_LABELS[m] || m}
                          <span className="text-[10px] text-slate-400 font-mono block">
                            /{m}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          {canView ? (
                            <span className="text-emerald-600 font-bold">✔ Có</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canCreate ? (
                            <span className="text-blue-600 font-bold">✔ Có</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canEdit ? (
                            <span className="text-amber-600 font-bold">✔ Có</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {canDelete ? (
                            <span className="text-rose-600 font-bold">✔ Có</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: RÀ SOÁT & BẢO MẬT (SECURITY AUDIT)
         ======================================================== */}
      {activeTab === "security-audit" && (
        <div className="space-y-4">
          <div className="card p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Trung Tâm Rà Soát Bảo Mật & An Toàn Tài Khoản
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tự động quét các tài khoản rác, tài khoản thử nghiệm, tài khoản ngoài tên miền công ty và tài khoản chưa gắn mã nhân viên.
                </p>
              </div>

              <button
                onClick={fetchUsers}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Quét Lại
              </button>
            </div>

            {auditAnalysis.length === 0 ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">
                  Hệ thống 100% An Toàn & Chuẩn Xác!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-md mx-auto">
                  Toàn bộ tài khoản hiện tại đều thuộc nhân sự chính thức của MIMIN, không có tài khoản rác hay tài khoản kiểm thử probe nào tồn tại.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>
                    Phát hiện <b>{auditAnalysis.length} tài khoản</b> cần chú ý rà soát hoặc dọn dẹp.
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-xl overflow-hidden">
                  {auditAnalysis.map(({ user: u, reason, severity }) => (
                    <div key={u.id} className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          severity === "high"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40"
                            : severity === "medium"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/40"
                        }`}>
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {u.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({u.email})
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              severity === "high"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40"
                                : severity === "medium"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40"
                            }`}>
                              {severity === "high" ? "Cần Xóa / Dọn Dẹp" : severity === "medium" ? "Cần Rà Soát" : "Nhắc Nhở"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Lý do: <span className="font-medium text-slate-700 dark:text-slate-300">{reason}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setEditing(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                          Sửa
                        </button>
                        <DeleteUserBtn u={u} onDeleted={fetchUsers} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODALS
         ======================================================== */}
      {/* Reset Password Modal */}
      {resettingPw && (
        <ResetPasswordModal
          user={resettingPw}
          onClose={() => setResettingPw(null)}
          onSuccess={() => {
            setResettingPw(null);
            fetchUsers();
          }}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <EditUserModal
          user={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchUsers();
          }}
        />
      )}

      {/* Create modal */}
      {creating && (
        <CreateUserModal
          existingAccounts={list}
          prefilledMaNV={prefilledEmployee}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}

// =================== USER CARD (GRID VIEW) ===================
function UserCard({
  u,
  onEdit,
  onResetPassword,
  onDeleted,
  onToggled,
}: {
  u: UserRow;
  onEdit: () => void;
  onResetPassword: () => void;
  onDeleted: () => void;
  onToggled: () => void;
}) {
  return (
    <div className="card p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-10 h-10 rounded-2xl ${PHONG_BAN_COLORS[u.phongBan || "khac"] || "bg-slate-500"} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}>
              {u.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block truncate">
                {u.name}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                <span className="truncate">{u.email}</span>
                <CopyEmailBtn email={u.email} />
              </div>
            </div>
          </div>

          <div>
            {u.isActive ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                🟢 Hoạt động
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                🔒 Đã khóa
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-1.5 flex-wrap my-2.5">
          {u.maNV ? (
            <span className="text-[11px] px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-mono font-bold border border-teal-200 dark:border-teal-800">
              Mã: {u.maNV}
            </span>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
              Chưa gán mã NV
            </span>
          )}

          <span className={`text-[10px] px-2 py-0.5 rounded-lg text-white font-medium ${ROLE_COLORS[u.role as keyof typeof ROLE_COLORS] || "bg-slate-500"}`}>
            {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] || u.role}
          </span>

          {u.phongBan && (
            <span className={`text-[10px] px-2 py-0.5 rounded-lg text-white font-medium ${PHONG_BAN_COLORS[u.phongBan] || "bg-slate-500"}`}>
              {PHONG_BAN_LABELS[u.phongBan] || u.phongBan}
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span>Chức vụ:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{u.chucVu || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Ngày tạo:</span>
            <span>{new Date(u.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={onResetPassword}
          className="px-2.5 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 text-xs font-bold flex items-center gap-1 transition"
          title="Đặt lại mật khẩu"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Đổi MK</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 transition"
            title="Sửa thông tin"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <ToggleUserBtn u={u} onToggled={onToggled} />
          <DeleteUserBtn u={u} onDeleted={onDeleted} />
        </div>
      </div>
    </div>
  );
}

// Button Copy Email
function CopyEmailBtn({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success(`Đã sao chép email: ${email}`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
      title="Sao chép email"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// Button Toggle Lock/Unlock
function ToggleUserBtn({ u, onToggled }: { u: UserRow; onToggled: () => void }) {
  const [busy, setBusy] = useState(false);
  const handleToggle = async () => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const json = await res.json();
      if (json.error) {
        toast.error("Lỗi: " + json.error);
      } else {
        toast.success(u.isActive ? `Đã khóa tài khoản ${u.email}` : `Đã mở khóa tài khoản ${u.email}`);
        onToggled();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`p-1.5 rounded-xl text-white transition disabled:opacity-50 ${
        u.isActive
          ? "bg-amber-500 hover:bg-amber-600"
          : "bg-emerald-600 hover:bg-emerald-700"
      }`}
      title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
    >
      {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
    </button>
  );
}

// Button Delete User
function DeleteUserBtn({ u, onDeleted }: { u: UserRow; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);
  const handleDelete = async () => {
    if (!confirm(`Xác nhận xóa vĩnh viễn tài khoản ${u.name} (${u.email})?\n\nHành động này không thể hoàn tác.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await authFetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.error) {
        toast.error("Lỗi: " + json.error);
      } else {
        toast.success(`Đã xóa tài khoản ${u.email}`);
        onDeleted();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="p-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition disabled:opacity-50"
      title="Xóa tài khoản"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// =================== RESET PASSWORD MODAL ===================
function ResetPasswordModal({
  user,
  onClose,
  onSuccess,
}: {
  user: UserRow;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("Mimin@" + Math.floor(1000 + Math.random() * 9000));
  const [showPw, setShowPw] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateRandom = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const newPass = `Mimin@${randomCode}`;
    setPassword(newPass);
    setCopied(false);
    toast.info("Đã tạo mật khẩu ngẫu nhiên: " + newPass);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Đã sao chép mật khẩu vào clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        toast.error("Lỗi đổi mật khẩu: " + (json.error || `Lỗi ${res.status}`));
        return;
      }
      navigator.clipboard.writeText(password);
      toast.success(`Đã đổi mật khẩu cho ${user.email} thành công! Mật khẩu đã được copy.`);
      onSuccess();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Đặt lại mật khẩu: ${user.name}`}>
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-xs text-violet-800 dark:text-violet-300">
          <p className="font-bold flex items-center gap-1.5 mb-1">
            <KeyRound className="w-4 h-4" /> Tài khoản: {user.email}
          </p>
          <p className="opacity-80">
            Mật khẩu mới sẽ được cập nhật trực tiếp vào hệ thống Supabase Auth. Bạn có thể copy mật khẩu này để gửi cho nhân viên đăng nhập.
          </p>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Mật khẩu mới *
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới..."
                className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm font-semibold"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={handleGenerateRandom}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border shrink-0 transition"
              title="Sinh mật khẩu ngẫu nhiên"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ngẫu nhiên
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 border shrink-0 transition"
              title="Sao chép mật khẩu"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Đã chép" : "Chép"}
            </button>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            Tối thiểu 6 ký tự. Khuyến nghị bao gồm chữ hoa, chữ thường và chữ số.
          </span>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex-1 hover:bg-slate-200 transition">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex-1 transition disabled:opacity-50"
          >
            {saving ? "Đang cập nhật..." : "💾 Lưu Mật Khẩu Mới"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =================== EDIT MODAL ===================
function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState({ ...user });
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword && newPassword.length < 6) {
      toast.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: data.name,
        role: data.role,
        chucVu: data.chucVu,
        phongBan: data.phongBan,
        isActive: data.isActive,
      };
      if (newPassword && newPassword.length >= 6) {
        payload.password = newPassword;
      }
      const res = await authFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.error) {
        toast.error("Lỗi: " + json.error);
      } else {
        toast.success("Đã cập nhật thông tin tài khoản" + (newPassword ? " và mật khẩu mới" : ""));
        onSaved();
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`Sửa tài khoản: ${user.email}`}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Họ tên *" value={data.name} onChange={(v) => setData({ ...data, name: v })} />
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Mã NV Liên Kết</label>
          <div className="font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-bold text-teal-700 dark:text-teal-300">
            {data.maNV || "Chưa liên kết"}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Quản lý mã tại Tab &quot;Liên kết hồ sơ&quot;.</p>
        </div>
        <Field label="Chức vụ" value={data.chucVu || ""} onChange={(v) => setData({ ...data, chucVu: v })} />
        <SelectField
          label="Vai trò (Role) *"
          value={data.role}
          options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          onChange={(v) => setData({ ...data, role: v })}
        />
        <SelectField
          label="Phòng ban"
          value={data.phongBan || "khac"}
          options={PHONG_BAN_OPTIONS.map((p) => ({ value: p, label: PHONG_BAN_LABELS[p] }))}
          onChange={(v) => setData({ ...data, phongBan: v })}
        />
        <SelectField
          label="Trạng thái"
          value={data.isActive ? "active" : "disabled"}
          options={[
            { value: "active", label: "🟢 Đang hoạt động" },
            { value: "disabled", label: "🔒 Khóa tài khoản" },
          ]}
          onChange={(v) => setData({ ...data, isActive: v === "active" })}
        />
      </div>

      <div className="mt-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
          Đổi mật khẩu mới (để trống nếu giữ nguyên)
        </label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Để trống nếu giữ mật khẩu cũ"
            className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          >
            {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-200 mt-3 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Thay đổi Role sẽ đồng bộ tự động sang <code>auth.users.app_metadata</code>. Nhân sự cần đăng xuất và đăng nhập lại để quyền mới có hiệu lực tức thì.
        </span>
      </div>

      <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex-1 hover:bg-slate-200 transition">
          Hủy
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex-1 transition disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "💾 Cập Nhật Tài Khoản"}
        </button>
      </div>
    </Modal>
  );
}

// =================== CREATE USER MODAL ===================
function CreateUserModal({
  existingAccounts,
  prefilledMaNV,
  onClose,
  onCreated,
}: {
  existingAccounts: UserRow[];
  prefilledMaNV?: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { list: nhanSuList, themNhanSu } = useNhanSu();
  const [data, setData] = useState({
    email: "",
    password: "Mimin@" + Math.floor(1000 + Math.random() * 9000),
    name: "",
    role: "attendance" as string,
    chucVu: "",
    phongBan: "to-may" as string,
    maNV: prefilledMaNV || "",
    sdt: "",
  });
  const [selectedNvMa, setSelectedNvMa] = useState(prefilledMaNV || "");
  const [taoHoSoNhanSu, setTaoHoSoNhanSu] = useState(false);
  const [ngayVaoLam, setNgayVaoLam] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Danh sách nhân sự chưa có tài khoản
  const unregisteredEmployees = useMemo(() => {
    return nhanSuList.filter((nv) => {
      const matchMa = nv.maNV && existingAccounts.some(
        (u) => u.maNV && u.maNV.trim().toLowerCase() === nv.maNV.trim().toLowerCase()
      );
      const matchEmail = nv.email && existingAccounts.some(
        (u) => u.email && u.email.trim().toLowerCase() === nv.email.trim().toLowerCase()
      );
      return !matchMa && !matchEmail;
    });
  }, [nhanSuList, existingAccounts]);

  const handleSelectEmployee = (maNV: string) => {
    setSelectedNvMa(maNV);
    if (!maNV) return;

    const nv = nhanSuList.find((item) => item.maNV === maNV);
    if (!nv) return;

    const mappedPhongBan = BO_PHAN_TO_PHONG_BAN[nv.boPhan] || "khac";
    setData((prev) => ({
      ...prev,
      name: nv.hoTen || prev.name,
      maNV: nv.maNV,
      email: nv.email || `${nv.maNV.toLowerCase()}@mimin.vn`,
      sdt: nv.sdt || prev.sdt,
      chucVu: nv.chucVu || nv.viTri || prev.chucVu,
      phongBan: mappedPhongBan,
    }));
    setTaoHoSoNhanSu(false);
    toast.info(`Đã điền tự động thông tin nhân viên ${nv.hoTen} (${nv.maNV})`);
  };

  const handleCreate = async () => {
    if (!data.email || !data.password || !data.name) {
      toast.error("Vui lòng điền họ tên, email và mật khẩu");
      return;
    }
    if (data.password.length < 6) {
      toast.error("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) {
        toast.error("Lỗi: " + json.error);
        return;
      }
      toast.success("Đã tạo tài khoản thành công: " + data.email);

      // Tạo kèm hồ sơ Nhân sự nếu được chọn
      if (taoHoSoNhanSu) {
        const maNV = data.maNV.trim() || `NV${(nhanSuList.length + 19).toString().padStart(3, "0")}`;
        const nv: NhanSuExt = {
          stt: nhanSuList.length + 1,
          maNV,
          hoTen: data.name,
          boPhan: PHONG_BAN_TO_BO_PHAN[data.phongBan] || "Hành chính",
          chucVu: data.chucVu || ROLE_LABELS[data.role as keyof typeof ROLE_LABELS] || data.role,
          ngaySinh: "",
          ngayCap: "",
          noiCap: "",
          gioiTinh: "",
          cccd: "",
          sdt: data.sdt,
          email: data.email,
          diaChiTT: "",
          diaChiTamTru: "",
          viTri: data.chucVu,
          ngayVaoLam,
          loaiHD: "",
          tinhTrangHN: "",
          soTK: "",
          nganHang: "",
          mst: "",
          bhxh: "",
          trangThai: "dang_lam",
          luongCB: 0,
          loaiLuong: "",
          ngayVao: ngayVaoLam,
          luongCung: 0,
          rating: 4,
          taiKhoan: data.email,
        };
        await themNhanSu(nv);
      }
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="Tạo tài khoản đăng nhập mới">
      <div className="space-y-3">
        {/* Chọn nhanh nhân viên chưa có tài khoản */}
        {unregisteredEmployees.length > 0 && (
          <div className="p-3 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/50 dark:bg-teal-950/20">
            <label className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5 mb-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              Chọn nhanh nhân sự chưa có tài khoản ({unregisteredEmployees.length})
            </label>
            <select
              value={selectedNvMa}
              onChange={(e) => handleSelectEmployee(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900"
            >
              <option value="">-- Chọn nhân sự để tự động điền form --</option>
              {unregisteredEmployees.map((nv) => (
                <option key={nv.maNV} value={nv.maNV}>
                  {nv.maNV} - {nv.hoTen} ({nv.boPhan || "Chưa rõ phòng ban"})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Họ tên *" value={data.name} onChange={(v) => setData({ ...data, name: v })} placeholder="Nguyễn Văn A" />
          <Field label="Mã Nhân Viên" value={data.maNV} onChange={(v) => setData({ ...data, maNV: v })} placeholder="NV01 (ví dụ)" />
          <Field label="Email đăng nhập *" value={data.email} onChange={(v) => setData({ ...data, email: v })} placeholder="ten@mimin.vn" type="email" />
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Mật khẩu ban đầu *</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                className="w-full px-2.5 py-1.5 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <Field label="Chức vụ" value={data.chucVu} onChange={(v) => setData({ ...data, chucVu: v })} placeholder="Tổ trưởng may" />
          <SelectField
            label="Vai trò (Role) *"
            value={data.role}
            options={ROLE_OPTIONS.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
            onChange={(v) => setData({ ...data, role: v })}
          />
          <SelectField
            label="Phòng ban"
            value={data.phongBan}
            options={PHONG_BAN_OPTIONS.map((p) => ({ value: p, label: PHONG_BAN_LABELS[p] }))}
            onChange={(v) => setData({ ...data, phongBan: v })}
          />
          <Field label="Số điện thoại" value={data.sdt} onChange={(v) => setData({ ...data, sdt: v })} placeholder="0901234567" />
        </div>

        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20">
          <label className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
            <input
              type="checkbox"
              checked={taoHoSoNhanSu}
              onChange={(e) => setTaoHoSoNhanSu(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600"
            />
            Đồng thời tạo mới hồ sơ Nhân sự (nếu nhân viên này chưa có trong danh sách)
          </label>
          {taoHoSoNhanSu && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] text-slate-500 shrink-0">Ngày vào làm:</span>
              <input
                type="date"
                value={ngayVaoLam}
                onChange={(e) => setNgayVaoLam(e.target.value)}
                className="px-2 py-1 rounded-lg border text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex-1 hover:bg-slate-200 transition">
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex-1 transition disabled:opacity-50"
          >
            {saving ? "Đang tạo..." : "🚀 Tạo Tài Khoản"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// =================== FIELD HELPERS ===================
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" /> {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
