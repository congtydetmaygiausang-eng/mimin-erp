"use client";
import { useState } from "react";
import { ShieldCheck, Users, LogIn, ChevronRight, User, Building2, Tag } from "lucide-react";
import Link from "next/link";
import { USERS, type UserAccount } from "@/lib/users";
import { CONG_NHAN_13 } from "@/lib/congnhan-13";
import { USER_ACCOUNTS_SECURE } from "@/lib/user-accounts-secure";

// 44 user @mimin.vn (sync tu Supabase 2026-08-05) - phan theo role
const USERS_MIMIN_VN = [
  // admin (4)
  { email: "sang@mimin.vn",   name: "Hồ Minh Sang",     role: "admin",     chucVu: "Quản trị hệ thống" },
  { email: "hoa@mimin.vn",    name: "Huỳnh Xuân Hòa",   role: "admin",     chucVu: "Trợ lý admin (Media)" },
  { email: "phi@mimin.vn",    name: "Lương Hoàng Phi",  role: "admin",     chucVu: "Media" },
  { email: "vy2@mimin.vn",    name: "Vy (Kho)",         role: "admin",     chucVu: "NV Kho phụ" },
  // accountant (2)
  { email: "thanh@mimin.vn",  name: "Bùi Thị Thanh",    role: "accountant",chucVu: "Kế toán trưởng" },
  { email: "thanh2@mimin.vn", name: "Thanh 2",          role: "accountant",chucVu: "Kế toán" },
  // content (1)
  { email: "vy@mimin.vn",     name: "Cẩm Vy",           role: "content",   chucVu: "Content - Media" },
  // planner (3)
  { email: "giau@mimin.vn",   name: "Nguyễn Thị Giàu",  role: "planner",   chucVu: "Điều hành SX" },
  { email: "huyen@mimin.vn",  name: "Đỗ Thị Huyền",     role: "planner",   chucVu: "QL Khách hàng Sỉ" },
  { email: "huyen2@mimin.vn", name: "Huyền 2",          role: "planner",   chucVu: "Bán sỉ" },
  // warehouse (1)
  { email: "hau@mimin.vn",    name: "Quốc Hậu",         role: "warehouse", chucVu: "Thủ kho trưởng" },
  // sewing (7)
  { email: "giang@mimin.vn",  name: "Phan Văn Giang",   role: "sewing",    chucVu: "Tổ trưởng Cắt" },
  { email: "de@mimin.vn",     name: "Phạm Văn Đệ",     role: "sewing",    chucVu: "CN Cắt" },
  { email: "phu@mimin.vn",    name: "Nguyễn Văn Phú",  role: "sewing",    chucVu: "CN Cắt hỗ trợ" },
  { email: "vinh@mimin.vn",   name: "Dương Tấn Vĩnh",  role: "sewing",    chucVu: "CN Cắt" },
  { email: "minh1@mimin.vn",  name: "Nguyễn Quốc Minh",role: "sewing",    chucVu: "CN Cắt" },
  { email: "nhan@mimin.vn",   name: "Trương Văn Nhẫn", role: "sewing",    chucVu: "CN Cắt" },
  { email: "ruong@mimin.vn",  name: "Nguyễn Văn Ruộng",role: "sewing",    chucVu: "Tổ trưởng Khuy nút" },
  // finishing (6)
  { email: "nhi@mimin.vn",    name: "Nguyễn Thị Mỹ Nhi",role: "finishing", chucVu: "Gấp xếp" },
  { email: "phuong@mimin.vn", name: "Võ Thị Phượng",   role: "finishing", chucVu: "Gấp xếp" },
  { email: "be@mimin.vn",     name: "Nguyễn Thị Bé",   role: "finishing", chucVu: "Gấp xếp" },
  { email: "duc1@mimin.vn",   name: "Nguyễn Minh Đức", role: "finishing", chucVu: "Ủi" },
  { email: "tam@mimin.vn",    name: "Trương Minh Tâm", role: "finishing", chucVu: "Ủi" },
  { email: "dinh@mimin.vn",   name: "Lê Đỉnh",         role: "finishing", chucVu: "Ủi" },
  // partner (20 NCC gia cong may)
  { email: "gc-gc-in-001@mimin.vn", name: "Bảo Ngân (IN-001)",  role: "partner" },
  { email: "gc-gc-in-002@mimin.vn", name: "Hạnh (IN-002)",      role: "partner" },
  { email: "gc-gc-in-003@mimin.vn", name: "Thanh Sơn (IN-003)", role: "partner" },
  { email: "gc-gc-in-004@mimin.vn", name: "Tiến Đạt (IN-004)",  role: "partner" },
  { email: "gc-gc-in-006@mimin.vn", name: "Anh Vui (IN-006)",   role: "partner" },
  { email: "gc-gc-quan-001@mimin.vn", name: "Chị Dung (QUAN-001)", role: "partner" },
  { email: "gc-gc-quan-002@mimin.vn", name: "Minh Vy (QUAN-002)",  role: "partner" },
  { email: "gc-gc-quan-003@mimin.vn", name: "Anh Thơ (QUAN-003)",  role: "partner" },
  { email: "gc-gc-quan-004@mimin.vn", name: "Chị Hương (QUAN-004)", role: "partner" },
  { email: "gc-gc-tron-001@mimin.vn", name: "Anh Trai (TRON-001)", role: "partner" },
  { email: "gc-gc-tron-002@mimin.vn", name: "Chị Hằng (TRON-002)", role: "partner" },
  { email: "gc-gc-tron-003@mimin.vn", name: "Anh Chiến (TRON-003)", role: "partner" },
  { email: "gc-gc-tron-004@mimin.vn", name: "Anh Thuận (TRON-004)", role: "partner" },
  { email: "gc-gc-tron-005@mimin.vn", name: "Anh Quang (TRON-005)", role: "partner" },
  { email: "gc-gc-tru-001@mimin.vn",  name: "Chị Liễu (TRU-001)",  role: "partner" },
  { email: "gc-gc-tru-002@mimin.vn",  name: "Tý Sơn (TRU-002)",    role: "partner" },
  { email: "gc-gc-tru-003@mimin.vn",  name: "Anh Duẩn (TRU-003)",  role: "partner" },
  { email: "gc-gc-tru-005@mimin.vn",  name: "Anh Thông (TRU-005)", role: "partner" },
  { email: "gc-gc-tru-006@mimin.vn",  name: "Cô Cúc (TRU-006)",    role: "partner" },
  { email: "gc-gc-tru-007@mimin.vn",  name: "Anh Sản (TRU-007)",   role: "partner" },
];

const ROLE_COLOR: Record<string, string> = {
  admin: "rose", planner: "violet", warehouse: "amber", sewing: "sky",
  qc: "emerald", finishing: "fuchsia", accountant: "blue", content: "pink", partner: "purple",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "👑 Admin", planner: "📋 Planner", warehouse: "📦 Kho", sewing: "✂️ May",
  qc: "🛡️ QC", finishing: "🧵 Hoàn thiện", accountant: "💰 Kế toán",
  content: "🎨 Content", partner: "🤝 NCC Gia công",
};

export default function TestPhanQuyenPage() {
  const [selected, setSelected] = useState<UserAccount | null>(null);

  const allUsers = [
    ...USERS,
    ...CONG_NHAN_13,
  ].filter((u, i, arr) => arr.findIndex((x) => x.email === u.email) === i);

  const nhomQuanLy = allUsers.filter((u: any) => u.nhom && !u.laCongNhan);
  const nhomSX = allUsers.filter((u: any) => u.laCongNhan);
  const mockLegacy = USER_ACCOUNTS_SECURE.filter((u: any) => !USERS.find((d) => d.email === u.email) && !CONG_NHAN_13.find((c) => c.email === u.email));

  // Nhom user theo role (44 user @mimin.vn)
  const byRole = USERS_MIMIN_VN.reduce((acc: any, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {});

  const handleLogin = (email: string, password: string) => {
    // Detect role tu email
    const u = USERS_MIMIN_VN.find((x) => x.email === email);
    const role = u?.role || "sewing";
    localStorage.setItem("mimin_erp_session", JSON.stringify({
      id: email.split("@")[0],
      email,
      name: email.split("@")[0],
      role,
    }));
    window.location.href = "/dashboard/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-purple-50/30 p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> MIMIN OS · Test phân quyền</div>
          <h1 className="text-2xl md:text-3xl font-bold">🧪 Test nhanh {USERS_MIMIN_VN.length} User @mimin.vn</h1>
          <p className="text-sm opacity-95 mt-1">Click bất kỳ user nào để login nhanh. Mỗi user có role + modules khác nhau.</p>
          <div className="mt-3 grid grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{byRole.admin?.length || 0}</div><div className="opacity-90">👑 Admin</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{byRole.planner?.length || 0}</div><div className="opacity-90">📋 Planner</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{byRole.sewing?.length || 0}</div><div className="opacity-90">✂️ May</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{byRole.finishing?.length || 0}</div><div className="opacity-90">🧵 HT</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-2xl font-bold">{byRole.partner?.length || 0}</div><div className="opacity-90">🤝 NCC</div></div>
          </div>
        </div>

        {/* ===== 44 user @mimin.vn theo role ===== */}
        {Object.entries(byRole).map(([role, users]: [string, any]) => (
          <Group
            key={role}
            title={`${ROLE_LABEL[role] || role} (${users.length} user)`}
            users={users}
            color={ROLE_COLOR[role] || "slate"}
            onLogin={handleLogin}
          />
        ))}

        {/* Legacy sections (giu de test cu) */}
        {nhomQuanLy.length > 0 && (
          <Group title="👔 Legacy: Nhóm Quản lý (cũ)" users={nhomQuanLy} color="violet" onLogin={handleLogin} />
        )}

        {nhomSX.length > 0 && (
          <>
            <Group title="✂️ Legacy: Nhóm Cắt (cũ)" users={nhomSX.filter((u: any) => u.module === "cat")} color="sky" onLogin={handleLogin} />
            <Group title="🪡 Legacy: Nhóm Khuy nút (cũ)" users={nhomSX.filter((u: any) => u.module === "khuy-nut")} color="amber" onLogin={handleLogin} />
            <Group title="👔 Legacy: Nhóm Ủi (cũ)" users={nhomSX.filter((u: any) => u.module === "ui")} color="rose" onLogin={handleLogin} />
            <Group title="📦 Legacy: Nhóm Đóng gói (cũ)" users={nhomSX.filter((u: any) => u.module === "dong-goi")} color="violet" onLogin={handleLogin} />
          </>
        )}

        {mockLegacy.length > 0 && (
          <Group title="🧪 Mock Legacy (cũ)" users={mockLegacy} color="slate" onLogin={handleLogin} />
        )}

        <Link href="/login/" className="card p-3 text-center text-sm text-blue-600 hover:bg-blue-50">
          📋 Đến trang login đầy đủ (có đăng nhập nhanh 6 user) →
        </Link>
      </div>
    </div>
  );
}

function Group({ title, users, color, onLogin }: { title: string; users: any[]; color: string; onLogin: (e: string, p: string) => void }) {
  return (
    <div className="card p-4">
      <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-blue-600" /> {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {users.map((u: any) => (
          <button
            key={u.email}
            onClick={() => onLogin(u.email, u.password || (u.email === "sang@mimin.vn" ? "sang123" : "Mimin@123"))}
            className="text-left p-3 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-lg flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 text-white flex items-center justify-center font-bold`}>
              {u.name?.charAt(0) || u.email.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{u.name || u.email}</div>
              <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{u.chucVu || u.title || "Nhân viên"} • {u.maNV || u.phongBan || ""}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
