"use client";

// ============ MODAL CHI TIẾT CÔNG VIỆC - 7 TAB (Đợt 2) ============
// Dùng chung cho Bộ 5 (Người gia công) + Bộ 6 (Hoàn thiện)
// 7 tab: Thông tin / Yêu cầu KT / Hình ảnh / Sản lượng / Lỗi / Bàn giao / Tiền công
// 8 nút thao tác + log workflow qua audit-log

import { useState, useEffect } from "react";
import {
  X, Info, Wrench, Image as ImageIcon, BarChart3, AlertTriangle,
  Package, Wallet, CheckCircle2, Play, Plus, Camera, Bug,
  LifeBuoy, Send, Eye, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { DateDisplay, formatDateVN } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui";
import { formatVNDShort } from "@/lib/data/real-data";

type Tab = "info" | "tech" | "media" | "progress" | "errors" | "handover" | "payment";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "info", label: "Thông tin", icon: Info },
  { key: "tech", label: "Yêu cầu KT", icon: Wrench },
  { key: "media", label: "Hình ảnh", icon: ImageIcon },
  { key: "progress", label: "Sản lượng", icon: BarChart3 },
  { key: "errors", label: "Lỗi", icon: AlertTriangle },
  { key: "handover", label: "Bàn giao", icon: Package },
  { key: "payment", label: "Tiền công", icon: Wallet },
];

export function CongViecDetailModal({
  task,
  user,
  open,
  onClose,
}: {
  task: PhieuWorkflow | null;
  user: AppUser | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("info");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showLoiModal, setShowLoiModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | {
    title: string;
    description?: string;
    onConfirm: () => void;
    variant?: "danger" | "primary" | "warning";
    confirmLabel?: string;
  }>(null);

  const {
    getEffectiveTask, nhanViec, batDauLam, capNhatSanLuong,
    banGiao, baoLoi, yeuCauHoTro,
    sanLuongUpdates, banGiaoRecords, loiReports, supportRequests,
  } = useGiaCong();

  useEffect(() => {
    if (open) setTab("info");
  }, [open, task?.id]);

  // ESC đóng modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const effective = getEffectiveTask(task.id) || task;
  const myUpdates = sanLuongUpdates.filter((u) => u.taskId === task.id);
  const myHandover = banGiaoRecords.filter((u) => u.taskId === task.id);
  const myLoi = loiReports.filter((u) => u.taskId === task.id);
  const mySupport = supportRequests.filter((u) => u.taskId === task.id);

  // Tính tổng sản lượng
  const totalDat = myUpdates.reduce((s, u) => s + u.soLuongDat, 0) || effective.soLuongDat;
  const totalLoi = myUpdates.reduce((s, u) => s + u.soLuongLoi, 0) || effective.soLuongLoi;
  const totalThieu = effective.soLuongThieu;
  const conLai = Math.max(0, effective.soLuongGiao - totalDat - totalLoi - totalThieu);

  // Tính tiền công
  const thanhTien = totalDat * effective.donGia;
  const daThanhToan = effective.daThanhToan;
  const conNo = thanhTien - daThanhToan;

  // 8 nút thao tác
  const canNhanViec = effective.trangThai === "Chờ giao" || effective.trangThai === "Chờ gấp";
  const canBatDau = canNhanViec || effective.trangThai === "Đang làm" || effective.trangThai === "Đang may";
  const canCapNhat = effective.trangThai === "Đang làm" || effective.trangThai === "Đang may";
  const canBanGiao = canCapNhat && (totalDat > 0);
  const canBaoLoi = canBatDau;
  const canHoTro = canBatDau;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full md:max-w-3xl max-h-[95vh] flex flex-col animate-slide-up md:rounded-2xl rounded-t-2xl">
        {/* Header sticky */}
        <div className="sticky top-0 z-10 card border-b rounded-t-2xl md:rounded-t-2xl p-4" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-brand-600 font-mono font-semibold truncate">
                {task.id} · {task.lenhCat || task.lenhSX}
              </div>
              <h2 className="text-base font-bold mt-0.5 line-clamp-2">
                {task.phanLoai || task.maSP} - {task.maSP}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-700 font-medium">
                  {effective.trangThai}
                </span>
                <span className="text-[10px] opacity-60">Màu {task.mau || "—"} · Size {task.size || "—"}</span>
              </div>
            </div>
            <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded hover:bg-white/30 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 8 action buttons - scroll ngang trên mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {canNhanViec && (
              <button
                onClick={() => handleAction(() => nhanViec(task.id, user))}
                className="text-xs px-3 py-2 rounded-lg bg-brand-500 text-white font-semibold whitespace-nowrap inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Nhận việc
              </button>
            )}
            {canBatDau && !canNhanViec && (
              <button
                onClick={() => handleAction(() => batDauLam(task.id, user))}
                className="text-xs px-3 py-2 rounded-lg bg-amber-500 text-white font-semibold whitespace-nowrap inline-flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5" /> Bắt đầu làm
              </button>
            )}
            {canCapNhat && (
              <button
                onClick={() => setShowProgressModal(true)}
                className="text-xs px-3 py-2 rounded-lg bg-sky-500/15 text-sky-700 hover:bg-sky-500/25 font-medium whitespace-nowrap inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Cập nhật SL
              </button>
            )}
            {canBaoLoi && (
              <>
                <button
                  onClick={() => setShowLoiModal(true)}
                  className="text-xs px-3 py-2 rounded-lg bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 font-medium whitespace-nowrap inline-flex items-center gap-1"
                >
                  <Bug className="w-3.5 h-3.5" /> Báo lỗi
                </button>
                <button
                  onClick={() => setShowSupportModal(true)}
                  className="text-xs px-3 py-2 rounded-lg bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 font-medium whitespace-nowrap inline-flex items-center gap-1"
                >
                  <LifeBuoy className="w-3.5 h-3.5" /> YC hỗ trợ
                </button>
              </>
            )}
            {canBanGiao && (
              <button
                onClick={() => setShowHandoverModal(true)}
                className="text-xs px-3 py-2 rounded-lg bg-emerald-500 text-white font-semibold whitespace-nowrap inline-flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Bàn giao
              </button>
            )}
            <button
              onClick={() => setTab("payment")}
              className="text-xs px-3 py-2 rounded-lg bg-white/30 hover:bg-white/50 font-medium whitespace-nowrap inline-flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> Xem tiền công
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          <div className="flex">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                    active
                      ? "border-brand-500 text-brand-700 dark:text-brand-400 bg-brand-500/5"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "info" && <TabInfo task={effective} totalDat={totalDat} totalLoi={totalLoi} totalThieu={totalThieu} conLai={conLai} />}
          {tab === "tech" && <TabTech task={effective} />}
          {tab === "media" && <TabMedia task={effective} />}
          {tab === "progress" && <TabProgress task={effective} updates={myUpdates} totalDat={totalDat} totalLoi={totalLoi} conLai={conLai} />}
          {tab === "errors" && <TabErrors task={effective} reports={myLoi} />}
          {tab === "handover" && <TabHandover task={effective} records={myHandover} />}
          {tab === "payment" && <TabPayment task={effective} totalDat={totalDat} thanhTien={thanhTien} daThanhToan={daThanhToan} conNo={conNo} />}
        </div>
      </div>

      {/* Modals lồng nhau */}
      {showProgressModal && (
        <ProgressModal
          task={task}
          user={user}
          maxRemain={effective.soLuongGiao - totalDat - totalLoi - totalThieu}
          onClose={() => setShowProgressModal(false)}
          onSave={(data: { soLuongDat: number; soLuongLoi: number; ghiChu?: string }) => {
            capNhatSanLuong(task.id, data, user);
            setShowProgressModal(false);
            toast.success(`Đã cập nhật SL: ${data.soLuongDat} đạt / ${data.soLuongLoi} lỗi`);
          }}
        />
      )}

      {showHandoverModal && (
        <HandoverModal
          task={task}
          user={user}
          maxRemain={totalDat}
          onClose={() => setShowHandoverModal(false)}
          onSave={(data: { soLuongBanGiao: number; nguoiNhan?: string; ghiChu?: string }) => {
            banGiao(task.id, data, user);
            setShowHandoverModal(false);
            toast.success(`Đã bàn giao ${data.soLuongBanGiao} sp cho ${data.nguoiNhan || "công đoạn sau"}`);
            onClose();
          }}
        />
      )}

      {showLoiModal && (
        <LoiReportModal
          task={task}
          user={user}
          onClose={() => setShowLoiModal(false)}
          onSave={(data: { loai: string; soLuong: number; moTa: string }) => {
            baoLoi(task.id, data as any, user);
            setShowLoiModal(false);
            toast.success("Đã báo lỗi");
          }}
        />
      )}

      {showSupportModal && (
        <SupportModal
          task={task}
          user={user}
          onClose={() => setShowSupportModal(false)}
          onSave={(data: { loai: string; moTa: string }) => {
            yeuCauHoTro(task.id, data as any, user);
            setShowSupportModal(false);
            toast.success("Đã gửi yêu cầu hỗ trợ");
          }}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel={confirmAction.confirmLabel}
        />
      )}
    </div>
  );
}

// ============ TAB CONTENT ============

function TabInfo({ task, totalDat, totalLoi, totalThieu, conLai }: any) {
  return (
    <div className="space-y-3 text-sm">
      <FieldGrid>
        <Field label="Mã phiếu" value={<span className="font-mono">{task.id}</span>} />
        <Field label="LSX" value={<span className="font-mono">{task.lenhSX}</span>} />
        <Field label="Lệnh cắt" value={<span className="font-mono">{task.lenhCat}</span>} />
        <Field label="Mã SP" value={<span className="font-mono font-semibold">{task.maSP}</span>} />
        <Field label="Phân loại" value={task.phanLoai || "—"} />
        <Field label="Màu" value={task.mau || "—"} />
        <Field label="Size" value={task.size || "—"} />
        <Field label="Công đoạn" value={task.viTriIn || task.kieuMay || "—"} />
        <Field label="Người giao" value={<span className="font-mono text-xs">{task.nguoiGiao}</span>} />
        <Field label="Người nhận" value={task.tenNguoiNhan} />
        <Field label="Ngày giao" value={<DateDisplay value={task.ngayGiao} showRelative />} />
        <Field label="Hạn hoàn thành" value={<DateDisplay value={task.hanHoanThanh} showRelative />} />
        {task.ngayHoanThanh && <Field label="Ngày xong" value={<DateDisplay value={task.ngayHoanThanh} />} />}
      </FieldGrid>

      <div className="card p-3 bg-brand-500/5">
        <div className="text-xs font-semibold mb-2 opacity-70">Sản lượng</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-sm">
          <div>
            <div className="text-[10px] opacity-60">SL giao</div>
            <div className="font-bold text-lg">{task.soLuongGiao.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] opacity-60">Đã đạt</div>
            <div className="font-bold text-lg text-emerald-600">{totalDat.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] opacity-60">Lỗi</div>
            <div className="font-bold text-lg text-rose-600">{totalLoi.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[10px] opacity-60">Còn lại</div>
            <div className="font-bold text-lg text-amber-600">{conLai.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {task.ghiChu && (
        <div className="card p-3 bg-amber-500/5 border-amber-500/20">
          <div className="text-xs font-semibold opacity-70 mb-1">Ghi chú</div>
          <div className="text-sm whitespace-pre-line">{task.ghiChu}</div>
        </div>
      )}
    </div>
  );
}

function TabTech({ task }: any) {
  const sections: { label: string; value: string | null | undefined }[] = [
    { label: "Kiểu may", value: task.kieuMay },
    { label: "Vị trí in/thêu", value: task.viTriIn },
    { label: "Mẫu đã duyệt", value: task.mauDaDuyet ? "✅ Đã duyệt" : "⏳ Chưa duyệt" },
    { label: "Người xác nhận mẫu", value: task.nguoiXacNhan },
  ];
  return (
    <div className="space-y-3 text-sm">
      <FieldGrid>
        {sections.map((s, i) => (
          <Field key={i} label={s.label} value={s.value || "—"} />
        ))}
      </FieldGrid>
      <div className="card p-3 bg-sky-500/5 text-xs opacity-70">
        💡 Tip: Mỗi công đoạn có yêu cầu kỹ thuật riêng. Hỏi QLSX nếu chưa rõ.
      </div>
    </div>
  );
}

function TabMedia({ task }: any) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs opacity-70 mb-2">Hình ảnh / File mẫu (nếu có)</div>
      {task.mauThucHien ? (
        <div className="card p-3">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs opacity-60">
            <Camera className="w-8 h-8 mr-2" />
            Ảnh mẫu: {task.mauThucHien}
          </div>
        </div>
      ) : (
        <div className="card p-8 text-center opacity-60 text-xs">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Chưa có ảnh / file mẫu cho lệnh này
        </div>
      )}
      {task.hinhAnhGiao && (
        <div className="card p-3">
          <div className="text-xs opacity-70 mb-2">Ảnh giao nhận</div>
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-xs opacity-60">
            {task.hinhAnhGiao}
          </div>
        </div>
      )}
    </div>
  );
}

function TabProgress({ task, updates, totalDat, totalLoi, conLai }: any) {
  const phanTram = task.soLuongGiao > 0 ? Math.min(100, (totalDat / task.soLuongGiao) * 100) : 0;
  return (
    <div className="space-y-3 text-sm">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs opacity-70">Tiến độ</span>
          <span className="text-xs font-bold">{phanTram.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-slate-200/40 dark:bg-slate-700/40 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${phanTram >= 100 ? "bg-emerald-500" : phanTram > 50 ? "bg-amber-500" : "bg-brand-500"}`}
            style={{ width: `${phanTram}%` }}
          />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="card p-2 bg-emerald-500/10">
          <div className="text-[10px] opacity-70">Đạt</div>
          <div className="font-bold text-emerald-600">{totalDat.toLocaleString()}</div>
        </div>
        <div className="card p-2 bg-rose-500/10">
          <div className="text-[10px] opacity-70">Lỗi</div>
          <div className="font-bold text-rose-600">{totalLoi.toLocaleString()}</div>
        </div>
        <div className="card p-2 bg-amber-500/10">
          <div className="text-[10px] opacity-70">Còn</div>
          <div className="font-bold text-amber-600">{conLai.toLocaleString()}</div>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="text-xs font-semibold opacity-70 mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          Lịch sử cập nhật ({updates.length})
        </div>
        {updates.length === 0 ? (
          <div className="card p-4 text-center text-xs opacity-60">
            Chưa có cập nhật sản lượng
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...updates].reverse().map((u: any) => (
              <div key={u.id} className="card p-2.5 text-xs flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-emerald-600">+{u.soLuongDat}</span>
                    {u.soLuongLoi > 0 && <span className="text-rose-600">/{u.soLuongLoi} lỗi</span>}
                  </div>
                  {u.ghiChu && <div className="opacity-60 truncate">{u.ghiChu}</div>}
                </div>
                <div className="text-[10px] opacity-60 shrink-0">
                  <DateDisplay value={u.ngay} format="dd/MM" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabErrors({ task, reports }: any) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs opacity-70 mb-2 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5" />
        Báo cáo lỗi ({reports.length})
      </div>
      {reports.length === 0 ? (
        <div className="card p-4 text-center text-xs opacity-60">
          ✅ Chưa có lỗi nào được báo
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map((r: any) => (
            <div key={r.id} className="card p-3 border-l-4 border-rose-500/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-700 font-medium uppercase">{r.loai}</span>
                <span className="text-xs font-semibold">SL: {r.soLuong}</span>
              </div>
              <div className="text-sm">{r.moTa}</div>
              <div className="text-[10px] opacity-60 mt-1">
                <DateDisplay value={r.ngay} showRelative /> · {r.nguoiBao}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabHandover({ task, records }: any) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-xs opacity-70 mb-2 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5" />
        Lịch sử bàn giao ({records.length})
      </div>
      {records.length === 0 ? (
        <div className="card p-4 text-center text-xs opacity-60">
          Chưa có bàn giao nào. Khi hoàn thành SL, bấm "Bàn giao" ở header.
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r: any) => (
            <div key={r.id} className="card p-3 border-l-4 border-emerald-500/40">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 font-medium">BÀN GIAO</span>
                <span className="text-sm font-semibold">{r.soLuongBanGiao} sp</span>
              </div>
              {r.nguoiNhan && <div className="text-xs opacity-70">→ Người nhận: <span className="font-mono">{r.nguoiNhan}</span></div>}
              {r.ghiChu && <div className="text-xs opacity-70 mt-1">{r.ghiChu}</div>}
              <div className="text-[10px] opacity-60 mt-1">
                <DateDisplay value={r.ngayBanGiao} showRelative /> · {r.nguoiBanGiao}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabPayment({ task, totalDat, thanhTien, daThanhToan, conNo }: any) {
  return (
    <div className="space-y-3 text-sm">
      <FieldGrid>
        <Field label="Đơn giá" value={<span className="font-mono font-semibold">{task.donGia.toLocaleString()}đ</span>} />
        <Field label="SL đạt" value={totalDat.toLocaleString()} />
        <Field label="Thành tiền" value={<span className="font-mono font-bold text-emerald-600">{formatVNDShort(thanhTien)}</span>} />
        <Field label="Đã thanh toán" value={<span className="font-mono">{formatVNDShort(daThanhToan)}</span>} />
        <Field label="Còn nợ" value={<span className={`font-mono font-bold ${conNo > 0 ? "text-amber-600" : "text-emerald-600"}`}>{formatVNDShort(conNo)}</span>} />
        <Field label="Trạng thái" value={conNo === 0 && thanhTien > 0 ? <span className="text-emerald-600 font-semibold">Đã thanh toán</span> : <span className="text-amber-600">Chờ thanh toán</span>} />
      </FieldGrid>

      <div className="card p-3 bg-emerald-500/5">
        <div className="text-xs font-semibold mb-1">Công thức tính:</div>
        <div className="text-xs opacity-70 font-mono">
          Tiền công = SL đạt × Đơn giá = {totalDat.toLocaleString()} × {task.donGia.toLocaleString()}đ = <b className="text-emerald-600">{thanhTien.toLocaleString()}đ</b>
        </div>
      </div>

      <div className="card p-3 bg-amber-500/5 text-xs">
        <div className="font-semibold mb-1.5">Điều kiện để được thanh toán:</div>
        <ul className="space-y-1 opacity-80 list-disc list-inside">
          <li>Bàn giao cho công đoạn sau ✓</li>
          <li>Công đoạn sau xác nhận số lượng nhận ✓</li>
          <li>QC xác nhận SL đạt ✓</li>
          <li>QLSX duyệt đối soát ✓</li>
        </ul>
      </div>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{children}</div>;
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-[10px] opacity-60 uppercase tracking-wide">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// ============ Sub Modals ============

function ProgressModal({ task, user, maxRemain, onClose, onSave }: any) {
  const [soDat, setSoDat] = useState(0);
  const [soLoi, setSoLoi] = useState(0);
  const [ghiChu, setGhiChu] = useState("");
  const overLimit = (soDat + soLoi) > maxRemain;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2">Cập nhật sản lượng</h3>
        <p className="text-xs opacity-70 mb-3">Còn lại: {maxRemain.toLocaleString()} sp. Nhập SL đạt và lỗi trong lần này.</p>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">SL đạt *</label>
              <input type="number" min={0} max={maxRemain} value={soDat || ""} onChange={(e) => setSoDat(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" placeholder="0" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">SL lỗi</label>
              <input type="number" min={0} max={maxRemain} value={soLoi || ""} onChange={(e) => setSoLoi(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="input w-full min-h-[50px]" placeholder="Ghi chú (nếu có)..." />
          </div>
          {overLimit && (
            <div className="text-xs text-rose-600 bg-rose-500/10 rounded p-2">
              ⚠️ Tổng ({soDat + soLoi}) vượt quá SL còn lại ({maxRemain})
            </div>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button
            onClick={() => onSave({ soLuongDat: soDat, soLuongLoi: soLoi, ghiChu })}
            disabled={soDat <= 0 && soLoi <= 0 || overLimit}
            className="btn-primary text-sm disabled:opacity-50"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

function HandoverModal({ task, user, maxRemain, onClose, onSave }: any) {
  const [soBanGiao, setSoBanGiao] = useState(maxRemain);
  const [nguoiNhan, setNguoiNhan] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2">Bàn giao {task.id}</h3>
        <p className="text-xs opacity-70 mb-3">Bàn giao SP cho công đoạn sau hoặc kho.</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1">SL bàn giao *</label>
            <input type="number" min={0} max={maxRemain} value={soBanGiao || ""} onChange={(e) => setSoBanGiao(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" />
            <div className="text-[10px] opacity-60 mt-1">Đã đạt: {maxRemain.toLocaleString()}</div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Người nhận (mã NV)</label>
            <input value={nguoiNhan} onChange={(e) => setNguoiNhan(e.target.value.toUpperCase())} className="input w-full" placeholder="VD: NV011" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="input w-full min-h-[50px]" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button
            onClick={() => onSave({ soLuongBanGiao: soBanGiao, nguoiNhan, ghiChu })}
            disabled={soBanGiao <= 0}
            className="btn-primary text-sm disabled:opacity-50"
          >
            Xác nhận bàn giao
          </button>
        </div>
      </div>
    </div>
  );
}

function LoiReportModal({ task, user, onClose, onSave }: any) {
  const [loai, setLoai] = useState<"loi-san-pham" | "thieu-hang" | "hong-vai" | "khac">("loi-san-pham");
  const [soLuong, setSoLuong] = useState(1);
  const [moTa, setMoTa] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2 text-rose-700">Báo lỗi / thiếu hàng</h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1">Loại lỗi *</label>
            <select value={loai} onChange={(e) => setLoai(e.target.value as any)} className="input w-full">
              <option value="loi-san-pham">Lỗi sản phẩm</option>
              <option value="thieu-hang">Thiếu hàng</option>
              <option value="hong-vai">Hỏng vải</option>
              <option value="khac">Khác</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Số lượng *</label>
            <input type="number" min={1} value={soLuong} onChange={(e) => setSoLuong(Math.max(1, parseInt(e.target.value) || 1))} className="input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Mô tả chi tiết *</label>
            <textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} className="input w-full min-h-[80px]" placeholder="Mô tả chi tiết lỗi..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button
            onClick={() => onSave({ loai, soLuong, moTa })}
            disabled={!moTa.trim()}
            className="btn-primary text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50"
          >
            Gửi báo lỗi
          </button>
        </div>
      </div>
    </div>
  );
}

function SupportModal({ task, user, onClose, onSave }: any) {
  const [loai, setLoai] = useState<"ho-tro-ky-thuat" | "ho-tro-vat-tu" | "ho-tro-cong-cu" | "khac">("ho-tro-ky-thuat");
  const [moTa, setMoTa] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2 text-amber-700">Yêu cầu hỗ trợ</h3>
        <p className="text-xs opacity-70 mb-3">Gửi yêu cầu hỗ trợ cho QLSX hoặc kho.</p>
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-medium block mb-1">Loại hỗ trợ *</label>
            <select value={loai} onChange={(e) => setLoai(e.target.value as any)} className="input w-full">
              <option value="ho-tro-ky-thuat">Hỗ trợ kỹ thuật</option>
              <option value="ho-tro-vat-tu">Hỗ trợ vật tư</option>
              <option value="ho-tro-cong-cu">Hỗ trợ công cụ</option>
              <option value="khac">Khác</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Mô tả *</label>
            <textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} className="input w-full min-h-[80px]" placeholder="Mô tả chi tiết yêu cầu..." />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button
            onClick={() => onSave({ loai, moTa })}
            disabled={!moTa.trim()}
            className="btn-primary text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50"
          >
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}
