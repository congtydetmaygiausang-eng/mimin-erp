"use client";

import { useState } from "react";
import {
  Layers, ShieldCheck, Building2, Users, Lock, Unlock, Eye, Edit, Trash2, Plus,
  ChevronRight, ArrowRight, Database, Server, GitBranch, Sparkles,
  BookOpen, CheckCircle2, XCircle, Settings, FileText,
} from "lucide-react";
import { Shield as ShieldIcon } from "lucide-react";
const Shield = ShieldIcon;
import { toast } from "sonner";
import { usePermissions } from "@/lib/use-permissions";
import { getAccountByEmail, getAllAccounts, PHONG_BAN_LABELS, PHONG_BAN_COLORS } from "@/lib/user-accounts";
import { ALL_MODULES, ALL_ROLES, MODULE_LABELS, ROLE_LABELS } from "@/lib/permissions";
import { PHONG_BAN_DATA_SCOPE } from "@/lib/permission-resolver";

export default function KienTucPhanQuyenPage() {
  const perm = usePermissions();
  const [tab, setTab] = useState<"kientruc" | "demo" | "matrix">("kientruc");

  return (
    <div className="max-w-6xl mx-auto space-y-3 p-3 animate-fade-in">
      <div className="card p-4 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Layers className="w-7 h-7 text-blue-500" /> Kiến trúc phân quyền
        </h1>
        <p className="opacity-70 text-sm">
          Mỗi công đoạn = 1 người phụ trách → Kết hợp Module + Role + Department
        </p>
      </div>

      {/* User hiện tại */}
      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20">
        <div className="text-xs opacity-70">Đang đăng nhập:</div>
        <div className="font-bold">{perm.ctx.user?.name || "Chưa đăng nhập"}</div>
        <div className="text-xs flex gap-2 mt-1">
          <span className="px-2 py-0.5 rounded bg-blue-500 text-white">Role: {ROLE_LABELS[perm.role as keyof typeof ROLE_LABELS] || (perm.role as string)}</span>
          <span className={`px-2 py-0.5 rounded text-white ${PHONG_BAN_COLORS[perm.phongBan as keyof typeof PHONG_BAN_COLORS]}`}>Phòng ban: {PHONG_BAN_LABELS[perm.phongBan as keyof typeof PHONG_BAN_LABELS]}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {[
          { key: "kientruc", label: "Kiến trúc", icon: GitBranch },
          { key: "demo", label: "Demo trực tiếp", icon: Sparkles },
          { key: "matrix", label: "Ma trận", icon: Database },
        ].map((t: any) => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              tab === t.key ? "bg-white dark:bg-slate-700 shadow" : "opacity-60"
            }`}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "kientruc" && <KienTrucView />}
      {tab === "demo" && <DemoView />}
      {tab === "matrix" && <MatrixView />}
    </div>
  );
}

// ============ TAB 1: KIẾN TRÚC ============
function KienTrucView() {
  return (
    <div className="space-y-3">
      <div className="card p-4 bg-gradient-to-br from-blue-500/5 to-violet-500/5">
        <h3 className="font-bold mb-2">🏗️ Kiến trúc 3 tầng phân quyền</h3>
        <p className="text-sm opacity-80 mb-3">
          Mỗi User có 2 thuộc tính: <strong>Role</strong> (vai trò) + <strong>Phòng ban</strong>.
          Kết hợp 2 thuộc tính này để ra quyền cuối cùng.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
              Module-level
            </div>
            <p className="text-xs opacity-80">User có THẤY/THAO TÁC route nào</p>
            <p className="text-xs mt-1"><strong>VD:</strong> NV Kho sợi không thấy menu "Kế toán"</p>
            <p className="text-[10px] opacity-60 mt-1">→ AppShell, Sidebar, PageGuard</p>
          </div>

          <div className="card p-3 bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-500">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
              Role-level (R/C/U/D)
            </div>
            <p className="text-xs opacity-80">Quyền cụ thể trên từng module</p>
            <p className="text-xs mt-1"><strong>VD:</strong> "Tổ trưởng may" chỉ được C/U trên Tổ may</p>
            <p className="text-[10px] opacity-60 mt-1">→ Matrix 7×21×4, hasPerm(), canEdit()</p>
          </div>

          <div className="card p-3 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500">
            <div className="flex items-center gap-2 font-bold mb-1">
              <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">3</span>
              Department-level (Scope)
            </div>
            <p className="text-xs opacity-80">User thấy DỮ LIỆU nào</p>
            <p className="text-xs mt-1"><strong>VD:</strong> "Kho sợi" chỉ thấy data kho sợi</p>
            <p className="text-[10px] opacity-60 mt-1">→ useScopedData(), filterByPermission()</p>
          </div>
        </div>
      </div>

      {/* Code example */}
      <div className="card p-4 bg-slate-900 text-green-400 font-mono text-xs overflow-x-auto">
        <div className="text-white mb-2">📝 Cách sử dụng trong component:</div>
        <pre className="leading-relaxed">{`// 1. Trong component bất kỳ
import { usePermissions } from "@/lib/use-permissions";

function MyPage() {
  const perm = usePermissions();

  // Check quyền module
  if (!perm.canView("kho-vai")) {
    return <div>Bạn không có quyền truy cập</div>;
  }

  // Check quyền cụ thể (R/C/U/D)
  return (
    <div>
      <h1>Kho vải</h1>
      {perm.canCreate("kho-vai") && (
        <button>+ Thêm mới</button>
      )}
      {perm.canDelete("kho-vai") && (
        <button>Xóa</button>
      )}

      {/* Filter data theo phòng ban */}
      {records.filter(r => perm.canAccessRecord(r)).map(...)}
    </div>
  );
}

// 2. Hook ngắn gọn
import { useCan } from "@/lib/use-permissions";
const canEdit = useCan("kho-vai", "update");

// 3. Filter data tự động
import { useScopedData } from "@/lib/use-permissions";
const myData = useScopedData(allRecords);`}</pre>
      </div>

      {/* Phòng ban → Modules mapping */}
      <div className="card p-3">
        <h3 className="font-bold mb-2">🏢 Scope theo phòng ban</h3>
        <p className="text-xs opacity-70 mb-2">Mỗi phòng ban chỉ thấy data trong modules của mình</p>
        <div className="space-y-1.5">
          {Object.entries(PHONG_BAN_DATA_SCOPE).map(([pb, mods]) => {
            const pbKey = pb as keyof typeof PHONG_BAN_LABELS;
            return (
              <div key={pb} className="flex items-start gap-2 text-xs">
                <span className={`px-2 py-0.5 rounded text-white text-[10px] ${PHONG_BAN_COLORS[pbKey]} whitespace-nowrap`}>
                  {PHONG_BAN_LABELS[pbKey]}
                </span>
                {mods.length === 0 ? (
                  <span className="opacity-60">→ Tất cả modules (admin)</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {mods.map((m) => (
                      <span key={m} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                        {MODULE_LABELS[m]}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mở rộng */}
      <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20">
        <h3 className="font-bold mb-2">🚀 Mở rộng trong tương lai</h3>
        <ul className="text-xs space-y-1">
          <li>✅ <strong>Field-level permission:</strong> Ẩn/hiện từng field theo role (VD: lương NV chỉ Kế toán thấy)</li>
          <li>✅ <strong>Time-restricted:</strong> Giờ làm việc (VD: chỉ vào 8h-17h)</li>
          <li>✅ <strong>Custom groups:</strong> Tạo nhóm quyền riêng (VD: "Trưởng ca A", "Trưởng ca B")</li>
          <li>✅ <strong>Audit log:</strong> Ghi lại mọi thao tác để truy vết</li>
          <li>✅ <strong>Multi-role:</strong> 1 user có thể có nhiều role (VD: vừa kế toán vừa QC)</li>
          <li>✅ <strong>Workflow approval:</strong> Phê duyệt nhiều cấp (VD: lệnh cắt → QL xưởng → GĐ)</li>
        </ul>
      </div>
    </div>
  );
}

// ============ TAB 2: DEMO TRỰC TIẾP ============
function DemoView() {
  const perm = usePermissions();
  const [demoRecords, setDemoRecords] = useState<any[]>([
    { id: 1, ten: "Phiếu nhập sợi từ NCC A", phongBan: "kho-soi", nguoiTao: "U001", giaTri: 100000 },
    { id: 2, ten: "Lệnh dệt 500kg cotton", phongBan: "xuong-det", nguoiTao: "U003", giaTri: 8000000 },
    { id: 3, ten: "Mẻ nhuộm 200kg đen", phongBan: "xuong-nhuom", nguoiTao: "U004", giaTri: 3000000 },
    { id: 4, ten: "Bảng lương NV tháng 7", phongBan: "ke-toan", nguoiTao: "U007", giaTri: 50000000 },
    { id: 5, ten: "Đơn hàng KH M758", phongBan: "ban-giam-doc", nguoiTao: "U001", giaTri: 100000000 },
    { id: 6, ten: "Lô vải TP 200kg Trắng", phongBan: "kho-tp", nguoiTao: "U005", giaTri: 4000000 },
  ]);

  // Filter theo permission của user hiện tại
  const visibleRecords = perm.filterRecords(demoRecords);

  return (
    <div className="space-y-3">
      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-bold mb-2">🧪 Test thực tế với user hiện tại</h3>
        <p className="text-xs opacity-80 mb-2">
          User hiện tại: <strong>{perm.ctx.user?.name}</strong> - 
          Role: <strong>{ROLE_LABELS[perm.role as keyof typeof ROLE_LABELS]}</strong> - 
          Phòng ban: <strong>{PHONG_BAN_LABELS[perm.phongBan as keyof typeof PHONG_BAN_LABELS]}</strong>
        </p>
        <div className="text-xs bg-white dark:bg-slate-800 p-2 rounded">
          📊 Bảng ghi 6 records mẫu · Filter theo quyền: <strong>{visibleRecords.length}/6 records</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {demoRecords.map((r) => {
          const canSee = perm.canAccessRecord(r);
          return (
            <div key={r.id} className={`card p-3 ${canSee ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-slate-100 dark:bg-slate-800/30 opacity-40"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{r.ten}</div>
                  <div className="text-[10px] opacity-70 mt-1">
                    Phòng ban: <span className={`px-1.5 py-0.5 rounded text-white ${PHONG_BAN_COLORS[r.phongBan as keyof typeof PHONG_BAN_COLORS]}`}>
                      {PHONG_BAN_LABELS[r.phongBan as keyof typeof PHONG_BAN_LABELS]}
                    </span>
                    <span className="ml-2">{r.giaTri.toLocaleString()}đ</span>
                  </div>
                </div>
                {canSee ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="mt-1 text-[10px]">
                {canSee ? (
                  <span className="text-emerald-600 font-semibold">✅ Có quyền xem</span>
                ) : (
                  <span className="text-slate-500">🔒 Không có quyền (phòng ban khác)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-3 bg-amber-50 dark:bg-amber-900/20">
        <h4 className="font-bold text-sm mb-1">💡 Test với user khác</h4>
        <p className="text-xs opacity-80">
          Vào <a href="/quan-ly-tai-khoan" className="text-blue-600 underline">Quản lý tài khoản</a> → tab "Demo Users" → chuyển role khác để xem records khác nhau.
        </p>
        <p className="text-xs opacity-80 mt-1">
          VD: Login user <code>warehouse@mimin.vn</code> (Kho sợi) → chỉ thấy record phòng ban "Kho sợi"
        </p>
      </div>
    </div>
  );
}

// ============ TAB 3: MA TRẬN ============
function MatrixView() {
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  return (
    <div className="card p-3">
      <h3 className="font-bold text-sm mb-2">🛡️ Ma trận Role × Phòng ban × Module</h3>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
        {ALL_ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`text-[10px] px-2 py-1 rounded whitespace-nowrap ${
              selectedRole === r ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {ROLE_LABELS[r]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-1.5 text-left">Phòng ban</th>
              {ALL_MODULES.map((m) => (
                <th key={m} className="p-1 text-center" style={{ writingMode: "vertical-rl" }}>
                  {MODULE_LABELS[m].slice(0, 6)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(PHONG_BAN_DATA_SCOPE).map((pb) => {
              const pbKey = pb as keyof typeof PHONG_BAN_DATA_SCOPE;
              const mods = PHONG_BAN_DATA_SCOPE[pbKey];
              return (
                <tr key={pb} className="border-t">
                  <td className="p-1.5 sticky left-0 bg-white dark:bg-slate-900 z-10">
                    <span className={`px-1.5 py-0.5 rounded text-white text-[9px] ${PHONG_BAN_COLORS[pbKey]}`}>
                      {PHONG_BAN_LABELS[pbKey]}
                    </span>
                  </td>
                  {ALL_MODULES.map((m) => {
                    const inScope = mods.length === 0 || mods.includes(m);
                    return (
                      <td key={m} className="p-1 text-center">
                        {inScope ? (
                          <span className="inline-block w-3 h-3 rounded bg-emerald-500" title={`${PHONG_BAN_LABELS[pbKey]} có thể thấy ${MODULE_LABELS[m]}`}></span>
                        ) : (
                          <span className="inline-block w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" title="Không thấy"></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[10px] opacity-70">
        🟢 Có quyền (theo module + phòng ban) · ⬜ Không có quyền
      </div>
    </div>
  );
}
