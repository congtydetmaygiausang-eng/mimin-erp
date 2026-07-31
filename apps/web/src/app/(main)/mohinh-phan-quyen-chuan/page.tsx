// Mô hình phân quyền chuẩn MIMIN OS - Cập nhật theo a Cường
// So sánh 2 mô hình: Cũ (Role tổng quát) vs Mới (Vai trò tách nhỏ + Data scope + 11 trạng thái)

"use client";

import { useState, useMemo } from "react";
import {
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, Users, Shield, ShieldCheck,
  Building2, Eye, Database, GitBranch, Sparkles, ChevronDown, ChevronRight,
  Layers, BookOpen, FileText, Workflow, Lock, UserCog, Briefcase,
} from "lucide-react";
import {
  TRANG_THAI_LABELS, TRANG_THAI_COLORS, QUYEN_LABELS, MA_TRAN_QUYEN,
  tinhChenhLechBanGiao, giaoDienChoVaiTro, coTheChuyenTrangThai,
  type TrangThaiCongDoan, type QuyenCongDoan,
} from "@/lib/cong-doan";
import {
  VAI_TRO_LABELS, VAI_TRO_COLORS, NHOM_VAI_TRO, DATA_SCOPE_LABELS,
  DATA_SCOPE_DESCRIPTIONS, PHONG_BAN_CHUAN_LABELS, PHONG_BAN_CHUAN_CONG_DOAN,
  VAI_TRO_DATA_SCOPE, VAI_TRO_PHONG_BAN,
  isCongNhan, isPhuTrach, isDoiTac, isQuanLy,
  type VaiTroChuan, type DataScope, type PhongBanChuan,
} from "@/lib/vai-tro-chuan";

const TRANG_THAI_ORDER: TrangThaiCongDoan[] = [
  "CHO_NHAN", "DA_NHAN", "DANG_LAM", "CHO_KIEM", "DAT", "LOI",
  "LAM_LAI", "CHO_BAN_GIAO", "DA_BAN_GIAO", "DA_XAC_NHAN_NHAN", "HOAN_THANH",
];

const QUYEN_ORDER: QuyenCongDoan[] = [
  "xem", "nhan_viec", "cap_nhat", "phan_cong", "ban_giao", "duyet", "xoa", "xem_tien",
];

export default function MohinhPhanQuyenChuanPage() {
  const [tab, setTab] = useState<"so-sanh" | "vai-tro" | "trang-thai" | "ban-giao" | "giao-dien">("so-sanh");
  const [vtSelected, setVtSelected] = useState<VaiTroChuan>("PHU_TRACH_KHUY_NUT");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-medium opacity-90 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            MIMIN OS · v83 · Mô hình phân quyền chuẩn
          </div>
          <h1 className="text-2xl md:text-4xl font-bold leading-tight">
            Mô hình phân quyền 4 tầng
          </h1>
          <p className="text-sm md:text-base opacity-95 mt-2 max-w-3xl">
            <span className="font-semibold">UserAccount → Phòng ban → Vai trò (1-n) → Data scope (6 cấp) → Trạng thái công đoạn (11 states) → Quyền thao tác (8 actions)</span>.
            Không phân quyền cứng theo tên người - chỉ cần đổi vai trò khi nhân sự thay đổi.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">17 vai trò</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">11 phòng ban</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">6 data scope</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">11 trạng thái</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">8 quyền</span>
            <span className="px-2.5 py-1 bg-white/20 backdrop-blur rounded-full">2 bước bàn giao</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1.5 flex flex-wrap gap-1">
          {[
            { id: "so-sanh", label: "So sánh 2 mô hình", icon: GitBranch },
            { id: "vai-tro", label: "17 Vai trò + Data scope", icon: Users },
            { id: "trang-thai", label: "11 Trạng thái + 8 Quyền", icon: Workflow },
            { id: "ban-giao", label: "Quy trình 2 bước bàn giao", icon: ArrowRight },
            { id: "giao-dien", label: "5 Giao diện theo vai trò", icon: Layers },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex-1 min-w-[150px] px-3 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 ${
                  tab === t.id
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{t.label}</span>
                <span className="md:hidden">{t.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {tab === "so-sanh" && <TabSoSanh />}
        {tab === "vai-tro" && <TabVaiTro selected={vtSelected} onSelect={setVtSelected} />}
        {tab === "trang-thai" && <TabTrangThai />}
        {tab === "ban-giao" && <TabBanGiao />}
        {tab === "giao-dien" && <TabGiaoDien />}
      </div>
    </div>
  );
}

function TabSoSanh() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Mô hình cũ */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">CŨ</div>
          <h2 className="text-lg font-bold text-slate-800">7 Role tổng quát</h2>
        </div>
        <div className="space-y-2 text-sm">
          {[
            ["admin", "Quản trị viên (tất cả)"],
            ["planner", "CV kế hoạch"],
            ["warehouse", "Quản lý kho (chung)"],
            ["sewing", "Tổ trưởng may (gộp tất cả)"],
            ["qc", "QC (chung)"],
            ["finishing", "Tổ trưởng hoàn thiện"],
            ["accountant", "Kế toán"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
              <code className="text-xs bg-amber-200 px-2 py-0.5 rounded font-mono">{k}</code>
              <span className="text-slate-700">{v}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 space-y-1">
          <p className="font-bold">❌ Hạn chế:</p>
          <p>• Role ở mức phòng ban, không tách theo <b>công đoạn</b></p>
          <p>• Không phân biệt PT công đoạn vs Nhân viên</p>
          <p>• Không có khái niệm đối tác gia công (PARTNER)</p>
          <p>• Data scope cố định theo phòng ban</p>
          <p>• Không có trạng thái công đoạn</p>
        </div>
      </div>

      {/* Mô hình mới */}
      <div className="bg-white rounded-2xl shadow-sm border-2 border-emerald-300 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">MỚI</div>
          <h2 className="text-lg font-bold text-slate-800">17 Vai trò tách nhỏ theo công đoạn</h2>
        </div>
        <div className="space-y-2 text-sm">
          {Object.entries(NHOM_VAI_TRO).map(([nhom, ds]) => (
            <div key={nhom} className="p-2 bg-emerald-50 rounded-lg">
              <div className="text-xs font-bold text-emerald-700 mb-1">📦 {nhom}</div>
              <div className="flex flex-wrap gap-1">
                {ds.map((v) => (
                  <span key={v} className="text-[10px] px-1.5 py-0.5 bg-white border border-emerald-200 rounded text-slate-700 font-mono">
                    {v.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 space-y-1">
          <p className="font-bold">✅ Ưu điểm:</p>
          <p>• Tách nhỏ theo <b>từng công đoạn</b> + PT/NV/Đối tác</p>
          <p>• Mỗi user có thể giữ <b>nhiều vai trò</b> (1-n)</p>
          <p>• Có Data scope <b>per user</b> (SELF/TEAM/DEPT/PROD/COMPANY/PARTNER)</p>
          <p>• 11 trạng thái workflow + 8 quyền thao tác</p>
          <p>• Quy trình 2 bước bàn giao có cảnh báo thiếu</p>
          <p>• 5 giao diện riêng theo nhóm vai trò</p>
        </div>
      </div>

      {/* Khác biệt chính */}
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-indigo-600" />
          Khác biệt cốt lõi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {[
            ["Vai trò", "7 role gộp", "17 vai trò tách nhỏ"],
            ["Phòng ban", "12 PB (gần giống)", "11 PB chuẩn theo a Cường"],
            ["Quan hệ User → Vai trò", "1 user → 1 role", "1 user → N vai trò (1-n)"],
            ["Data scope", "Cố định theo PB", "6 cấp per user (override được)"],
            ["Trạng thái", "Không có", "11 states + flow chuyển"],
            ["Quyền công đoạn", "R/C/U/D (4)", "8 actions theo ma trận"],
            ["Bàn giao", "Không có quy trình", "2 bước + cảnh báo thiếu"],
            ["Đối tác gia công", "Không có", "PARTNER role riêng"],
          ].map(([k, cu, moi], i) => (
            <div key={i} className="p-3 border border-slate-200 rounded-lg">
              <div className="text-xs font-bold text-slate-500 mb-1">{k}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-rose-600 line-through">{cu}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-600 font-semibold">{moi}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabVaiTro({ selected, onSelect }: { selected: VaiTroChuan; onSelect: (v: VaiTroChuan) => void }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Danh sách vai trò */}
      <div className="lg:col-span-2 space-y-3">
        {Object.entries(NHOM_VAI_TRO).map(([nhom, ds]) => (
          <div key={nhom} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              {nhom}
              <span className="text-xs font-normal text-slate-500">({ds.length} vai trò)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ds.map((v) => {
                const isActive = selected === v;
                return (
                  <button
                    key={v}
                    onClick={() => onSelect(v)}
                    className={`text-left p-3 rounded-xl border-2 transition ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`inline-block px-2 py-0.5 bg-gradient-to-r ${VAI_TRO_COLORS[v]} text-white text-[10px] font-mono rounded mb-1`}>
                      {v}
                    </div>
                    <div className="text-sm font-semibold text-slate-800">{VAI_TRO_LABELS[v]}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                      <span>📍 {PHONG_BAN_CHUAN_LABELS[VAI_TRO_PHONG_BAN[v]]}</span>
                      <span>👁️ {DATA_SCOPE_LABELS[VAI_TRO_DATA_SCOPE[v]]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Chi tiết vai trò */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <div className={`bg-gradient-to-br ${VAI_TRO_COLORS[selected]} text-white rounded-2xl p-5 shadow-xl`}>
          <div className="text-xs font-mono opacity-80">{selected}</div>
          <h2 className="text-xl font-bold mt-1">{VAI_TRO_LABELS[selected]}</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between bg-white/15 rounded-lg px-3 py-2">
              <span>📍 Phòng ban</span>
              <span className="font-semibold">{PHONG_BAN_CHUAN_LABELS[VAI_TRO_PHONG_BAN[selected]]}</span>
            </div>
            <div className="flex items-center justify-between bg-white/15 rounded-lg px-3 py-2">
              <span>👁️ Data scope</span>
              <span className="font-semibold">{DATA_SCOPE_LABELS[VAI_TRO_DATA_SCOPE[selected]]}</span>
            </div>
            <div className="bg-white/15 rounded-lg px-3 py-2 text-xs">
              {DATA_SCOPE_DESCRIPTIONS[VAI_TRO_DATA_SCOPE[selected]]}
            </div>
            <div className="bg-white/15 rounded-lg px-3 py-2 text-xs">
              <b>Công đoạn:</b> {PHONG_BAN_CHUAN_CONG_DOAN[VAI_TRO_PHONG_BAN[selected]]}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mt-3">
          <h3 className="font-bold text-slate-800 mb-2 text-sm">Quyền được phép</h3>
          <div className="space-y-1.5">
            {QUYEN_ORDER.map((q) => {
              const has = MA_TRAN_QUYEN[selected]?.includes(q);
              return (
                <div
                  key={q}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                    has ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400 line-through"
                  }`}
                >
                  {has ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span className="font-medium">{QUYEN_LABELS[q]}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mt-3">
          <h3 className="font-bold text-slate-800 mb-2 text-sm">Loại tài khoản</h3>
          <div className="flex flex-wrap gap-1.5">
            {isCongNhan(selected) && <span className="text-xs px-2 py-0.5 bg-slate-100 rounded">👷 Công nhân</span>}
            {isPhuTrach(selected) && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">👨‍💼 Phụ trách</span>}
            {isDoiTac(selected) && <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-700 rounded">🤝 Đối tác</span>}
            {isQuanLy(selected) && <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-700 rounded">👑 Quản lý</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabTrangThai() {
  const [from, setFrom] = useState<TrangThaiCongDoan>("CHO_NHAN");
  const [to, setTo] = useState<TrangThaiCongDoan>("DA_NHAN");
  const hopLe = coTheChuyenTrangThai(from, to);

  return (
    <div className="space-y-4">
      {/* 11 trạng thái */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Workflow className="w-5 h-5 text-indigo-600" />
          11 trạng thái công đoạn
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {TRANG_THAI_ORDER.map((tt) => (
            <div
              key={tt}
              className={`p-2.5 rounded-lg border-2 text-xs ${TRANG_THAI_COLORS[tt]}`}
            >
              <div className="font-mono text-[10px] opacity-70">{tt}</div>
              <div className="font-semibold mt-0.5">{TRANG_THAI_LABELS[tt]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow chuyển trạng thái */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3">Test chuyển trạng thái</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as TrangThaiCongDoan)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {TRANG_THAI_ORDER.map((tt) => (
              <option key={tt} value={tt}>Từ: {TRANG_THAI_LABELS[tt]}</option>
            ))}
          </select>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as TrangThaiCongDoan)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            {TRANG_THAI_ORDER.map((tt) => (
              <option key={tt} value={tt}>Đến: {TRANG_THAI_LABELS[tt]}</option>
            ))}
          </select>
          <div
            className={`ml-auto px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${
              hopLe ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
            }`}
          >
            {hopLe ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {hopLe ? "Hợp lệ" : "KHÔNG hợp lệ"}
          </div>
        </div>
      </div>

      {/* 8 quyền thao tác */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          8 quyền thao tác trong công đoạn
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUYEN_ORDER.map((q) => (
            <div key={q} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="font-mono text-[10px] text-slate-500">{q}</div>
              <div className="text-sm font-semibold text-slate-800 mt-1">{QUYEN_LABELS[q]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabBanGiao() {
  const [slGiao, setSlGiao] = useState(480);
  const [slNhan, setSlNhan] = useState(475);
  const result = useMemo(() => tinhChenhLechBanGiao(slGiao, slNhan), [slGiao, slNhan]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3">Quy trình 2 bước bàn giao</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50">
            <div className="text-xs text-indigo-600 font-bold mb-1">BƯỚC 1</div>
            <div className="font-semibold text-slate-800">Bộ phận trước bấm "Bàn giao"</div>
            <div className="text-xs text-slate-600 mt-1">VD: May giao 480 cái</div>
          </div>
          <div className="p-4 rounded-xl border-2 border-pink-200 bg-pink-50">
            <div className="text-xs text-pink-600 font-bold mb-1">BƯỚC 2</div>
            <div className="font-semibold text-slate-800">Bộ phận sau bấm "Xác nhận nhận"</div>
            <div className="text-xs text-slate-600 mt-1">VD: Khuy nút thực nhận 475 cái</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">SL Bàn giao</label>
            <input
              type="number"
              value={slGiao}
              onChange={(e) => setSlGiao(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">SL Thực nhận</label>
            <input
              type="number"
              value={slNhan}
              onChange={(e) => setSlNhan(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border-2 ${
            result.trangThai === "DAT"
              ? "border-emerald-200 bg-emerald-50"
              : result.trangThai === "THIEU"
              ? "border-rose-200 bg-rose-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-center gap-2 font-bold mb-2">
            {result.trangThai === "DAT" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : result.trangThai === "THIEU" ? (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
            <span>
              {result.trangThai === "DAT" && "Đạt - Phiếu hoàn thành"}
              {result.trangThai === "THIEU" && `Thiếu ${result.chenhLech} cái`}
              {result.trangThai === "DU" && `Dư ${result.chenhLech} cái`}
            </span>
          </div>
          {result.canhBao && (
            <p className="text-sm text-slate-700">{result.canhBao}</p>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border-2 border-indigo-200 p-5">
        <h3 className="font-bold text-slate-800 mb-2">Quy tắc bàn giao</h3>
        <ul className="space-y-2 text-sm text-slate-700">
          <li className="flex gap-2"><span className="text-rose-500">•</span> Phiếu KHÔNG tự ý lấy dữ liệu từ công đoạn sau</li>
          <li className="flex gap-2"><span className="text-rose-500">•</span> Bộ phận sau phải xác nhận mới hoàn thành</li>
          <li className="flex gap-2"><span className="text-rose-500">•</span> Chênh lệch → phiếu chuyển CHỜ_XỬ_LÝ_CHÊNH_LỆCH</li>
          <li className="flex gap-2"><span className="text-rose-500">•</span> Điều phối SX nhận thông báo xử lý</li>
          <li className="flex gap-2"><span className="text-rose-500">•</span> Lưu lịch sử LICH_SU_TRANG_THAI</li>
        </ul>
      </div>
    </div>
  );
}

function TabGiaoDien() {
  const ds = [
    { nhom: "CONG_NHAN", label: "Công nhân", menu: 1, hanhDong: 5, mau: "from-slate-500 to-slate-600", icon: "👷" },
    { nhom: "PHU_TRACH", label: "Phụ trách công đoạn", menu: 1, hanhDong: 5, mau: "from-indigo-500 to-violet-500", icon: "👨‍💼" },
    { nhom: "DIEU_PHOI", label: "Điều phối SX", menu: 1, hanhDong: 6, mau: "from-orange-500 to-red-500", icon: "🎯" },
    { nhom: "QUAN_LY", label: "Giám đốc (Chị Giàu)", menu: 1, hanhDong: 4, mau: "from-rose-500 to-pink-500", icon: "👑" },
    { nhom: "QUAN_TRI", label: "Quản trị hệ thống (Anh Sang)", menu: 6, hanhDong: 8, mau: "from-slate-600 to-slate-700", icon: "⚙️" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ds.map((d) => (
          <div key={d.nhom} className={`bg-gradient-to-br ${d.mau} text-white rounded-2xl p-5 shadow-lg`}>
            <div className="text-3xl mb-2">{d.icon}</div>
            <div className="text-xs opacity-80 font-mono">{d.nhom}</div>
            <h3 className="text-lg font-bold mt-1">{d.label}</h3>
            <div className="mt-3 space-y-1 text-xs">
              <div className="bg-white/15 rounded px-2 py-1">📋 {d.menu} menu chính</div>
              <div className="bg-white/15 rounded px-2 py-1">⚡ {d.hanhDong} hành động chính</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-3">Cấu trúc dữ liệu đề xuất (theo a Cường)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
          {[
            "PHONG_BAN",
            "VAI_TRO",
            "QUYEN",
            "VAI_TRO_QUYEN",
            "NHAN_VIEN",
            "NHAN_VIEN_VAI_TRO",
            "CONG_DOAN",
            "PHAN_CONG_CONG_DOAN",
            "PHIEU_CONG_DOAN",
            "LICH_SU_TRANG_THAI",
            "BAN_GIAO_CONG_DOAN",
            "QC_LOI",
            "THONG_BAO",
            "NHAT_KY_HE_THONG",
          ].map((t) => (
            <div key={t} className="p-2 bg-slate-50 rounded border border-slate-200 font-mono text-slate-700">
              📋 {t}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5">
        <h3 className="font-bold text-emerald-800 mb-2">Kết luận tối ưu cho MIMIN OS</h3>
        <p className="text-sm text-emerald-700">
          Không làm kiểu "Giang thấy màn Cắt, Tuyền thấy màn Ủi" bằng cách viết cứng tên người.
          Mà làm theo chuỗi: <b>Tài khoản → Nhân viên → Phòng ban → Vai trò → Quyền → Phạm vi dữ liệu → Giao diện</b>.
        </p>
        <p className="text-sm text-emerald-700 mt-2">
          Khi Nguyễn Văn Ruộng nghỉ, chỉ cần gán <code className="bg-white px-1.5 py-0.5 rounded">PHU_TRACH_KHUY_NUT</code> cho người mới.
          Không cần sửa giao diện, công thức hay quy trình.
        </p>
      </div>
    </div>
  );
}
