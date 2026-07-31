"use client";

// ============ BẢNG ĐIỀU HÀNH ACTIONS (Đợt 3 - Bộ 2) ============
// Các modal action QLSX: Giao việc / Gia hạn / Thu hồi / Làm lại / Chuyển CĐ / Duyệt
// Tất cả log audit qua logWorkflow

import { useState } from "react";
import { X, Calendar, Send, RotateCcw, RefreshCw, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useGiaCong } from "@/lib/data/gia-cong-store";
import { logWorkflow } from "@/lib/audit-log";
import { USERS } from "@/lib/users";
import { CONG_DOAN_LABELS, type CongDoanKey, CONG_DOAN_ORDER } from "@/lib/bang-dieu-hanh-helper";
import type { PhieuWorkflow } from "@/lib/workflow-data";
import { DateDisplay } from "@/components/ui";

type ActionType = "assign" | "extend" | "revoke" | "rework" | "transfer" | "approve" | null;

// ============ MAIN COMPONENT ============

export function BangDieuHanhActions({
  task,
  action,
  user,
  onClose,
}: {
  task: PhieuWorkflow;
  action: ActionType;
  user: AppUser | null;
  onClose: () => void;
}) {
  if (!action) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        {action === "assign" && <AssignForm task={task} user={user} onClose={onClose} />}
        {action === "extend" && <ExtendForm task={task} user={user} onClose={onClose} />}
        {action === "revoke" && <RevokeForm task={task} user={user} onClose={onClose} />}
        {action === "rework" && <ReworkForm task={task} user={user} onClose={onClose} />}
        {action === "transfer" && <TransferForm task={task} user={user} onClose={onClose} />}
        {action === "approve" && <ApproveForm task={task} user={user} onClose={onClose} />}
      </div>
    </div>
  );
}

// ============ ASSIGN FORM (Giao việc) ============

function AssignForm({ task, user, onClose }: any) {
  const { phanCong, themPhanCong } = usePhanCong();
  // Tìm NV cùng module (công đoạn) - ưu tiên người chưa đầy tải
  const sameModuleUsers = USERS.filter((u) => u.laCongNhan && u.module && task.id.toLowerCase().includes(u.module.toLowerCase().slice(0, 3)));

  const [nguoiNhan, setNguoiNhan] = useState<string>(task.nguoiNhan || sameModuleUsers[0]?.maNV || "");
  const [nguoiTen, setNguoiTen] = useState<string>(task.tenNguoiNhan || sameModuleUsers[0]?.name || "");
  const [soLuong, setSoLuong] = useState<number>(task.soLuongGiao);
  const [donGia, setDonGia] = useState<number>(task.donGia);
  const [donVi, setDonVi] = useState<string>(task.donVi || (task.id.startsWith("MAY_") ? "áo" : "bộ"));
  const [hanMoi, setHanMoi] = useState<string>(task.hanHoanThanh);
  const [ghiChu, setGhiChu] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nguoiNhan || !nguoiTen) {
      toast.error("Vui lòng chọn người nhận");
      return;
    }
    if (soLuong <= 0) {
      toast.error("Số lượng phải > 0");
      return;
    }
    // Tạo phân công mới
    themPhanCong({
      lenhCatId: task.lenhCat,
      congDoan: task.kieuMay ? "May áo" : task.id.startsWith("CAT_") ? "Cắt" : task.id.startsWith("UI_") ? "Ủi/Đóng gói" : task.id.startsWith("DG_") ? "Ủi/Đóng gói" : "May áo",
      nguoiPhuTrach: {
        loai: "Nhân viên nội bộ",
        ma: nguoiNhan,
        ten: nguoiTen,
      },
      donGiaGiao: donGia,
      soLuongGiao: soLuong,
      donVi,
      ngayGiao: new Date().toISOString().split("T")[0],
      ngayXongDuKien: hanMoi,
      trangThai: "Chờ giao",
      daThanhToan: 0,
      ghiChu: ghiChu || `QLSX giao: ${soLuong} ${donVi} cho ${nguoiTen}`,
    });
    logWorkflow(user, "assign", task.id, task.id, {
      newValue: { nguoiNhan, soLuong, hanMoi },
    });
    toast.success(`Đã giao ${soLuong} ${donVi} cho ${nguoiTen}`);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<Send className="w-5 h-5 text-brand-500" />} title={`Giao việc - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1">Mã NV nhận *</label>
            <input required value={nguoiNhan} onChange={(e) => setNguoiNhan(e.target.value.toUpperCase())} className="input w-full" placeholder="VD: NV006" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Tên NV nhận *</label>
            <input required value={nguoiTen} onChange={(e) => setNguoiTen(e.target.value)} className="input w-full" placeholder="Tên nhân viên" />
          </div>
        </div>
        {sameModuleUsers.length > 0 && (
          <div>
            <label className="text-xs font-medium block mb-1 opacity-70">Gợi ý NV cùng module:</label>
            <div className="flex flex-wrap gap-1.5">
              {sameModuleUsers.slice(0, 6).map((u) => (
                <button
                  key={u.maNV}
                  type="button"
                  onClick={() => { setNguoiNhan(u.maNV); setNguoiTen(u.name); }}
                  className="text-[10px] px-2 py-1 rounded-full bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 font-medium"
                >
                  {u.maNV} · {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-medium block mb-1">SL giao *</label>
            <input type="number" min={1} value={soLuong || ""} onChange={(e) => setSoLuong(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Đơn vị</label>
            <input value={donVi} onChange={(e) => setDonVi(e.target.value)} className="input w-full" placeholder="cái/bộ/áo" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Đơn giá (đ)</label>
            <input type="number" min={0} value={donGia || ""} onChange={(e) => setDonGia(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Hạn hoàn thành *</label>
          <input type="date" required value={hanMoi} onChange={(e) => setHanMoi(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Ghi chú</label>
          <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="input w-full min-h-[50px]" placeholder="Lý do giao, hướng dẫn đặc biệt..." />
        </div>
        <div className="text-xs opacity-70 bg-brand-500/5 rounded p-2">
          💡 Hệ thống sẽ tạo 1 phân công mới trong <b>module Công nợ</b> với trạng thái <b>"Chờ giao"</b>.
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Giao việc" />
    </form>
  );
}

// ============ EXTEND FORM (Gia hạn) ============

function ExtendForm({ task, user, onClose }: any) {
  const [hanMoi, setHanMoi] = useState<string>(task.hanHoanThanh);
  const [lyDo, setLyDo] = useState<string>("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      toast.error("Vui lòng nhập lý do gia hạn");
      return;
    }
    logWorkflow(user, "approve", task.id, task.id, {
      oldValue: { hanHoanThanh: task.hanHoanThanh },
      newValue: { hanHoanThanh: hanMoi, lyDo },
    });
    toast.success(`Đã gia hạn đến ${hanMoi}`);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<Calendar className="w-5 h-5 text-amber-500" />} title={`Gia hạn - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="card p-3 bg-amber-500/10 text-sm">
          <div className="flex items-center justify-between">
            <span className="opacity-70">Hạn hiện tại:</span>
            <span className="font-mono font-semibold"><DateDisplay value={task.hanHoanThanh} /></span>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Hạn mới *</label>
          <input type="date" required value={hanMoi} onChange={(e) => setHanMoi(e.target.value)} className="input w-full" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Lý do gia hạn *</label>
          <textarea required value={lyDo} onChange={(e) => setLyDo(e.target.value)} className="input w-full min-h-[80px]" placeholder="VD: Chờ vải từ NCC / NV bận việc khác / Yêu cầu KH thay đổi..." />
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Gia hạn" variant="warning" />
    </form>
  );
}

// ============ REVOKE FORM (Thu hồi) ============

function RevokeForm({ task, user, onClose }: any) {
  const [lyDo, setLyDo] = useState<string>("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      toast.error("Vui lòng nhập lý do thu hồi");
      return;
    }
    logWorkflow(user, "approve", task.id, task.id, {
      newValue: { action: "revoke", lyDo },
    });
    toast.warning(`Đã thu hồi lệnh ${task.id} từ ${task.tenNguoiNhan}`);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<RotateCcw className="w-5 h-5 text-rose-500" />} title={`Thu hồi lệnh - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="card p-3 bg-rose-500/10 border border-rose-500/30 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <b className="text-rose-700">Cảnh báo:</b> Đang thu hồi lệnh từ <b>{task.tenNguoiNhan}</b> ({task.nguoiNhan}). Hành động này sẽ được ghi log.
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Lý do thu hồi *</label>
          <textarea required value={lyDo} onChange={(e) => setLyDo(e.target.value)} className="input w-full min-h-[80px]" placeholder="Lý do thu hồi..." />
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Thu hồi" variant="danger" />
    </form>
  );
}

// ============ REWORK FORM (Yêu cầu làm lại) ============

function ReworkForm({ task, user, onClose }: any) {
  const [lyDo, setLyDo] = useState<string>("");
  const [soLuong, setSoLuong] = useState<number>(task.soLuongLoi || 0);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lyDo.trim()) {
      toast.error("Vui lòng nhập lý do làm lại");
      return;
    }
    logWorkflow(user, "rework", task.id, task.id, {
      newValue: { soLuong, lyDo },
    });
    toast.warning(`Đã yêu cầu làm lại ${soLuong} sp cho ${task.tenNguoiNhan}`);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<RefreshCw className="w-5 h-5 text-rose-500" />} title={`Yêu cầu làm lại - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="card p-3 bg-rose-500/5 text-sm">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] opacity-70">SL giao</div>
              <div className="font-bold">{task.soLuongGiao.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">SL đạt</div>
              <div className="font-bold text-emerald-600">{task.soLuongDat.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">SL lỗi</div>
              <div className="font-bold text-rose-600">{task.soLuongLoi.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">SL cần làm lại *</label>
          <input type="number" required min={1} max={task.soLuongGiao} value={soLuong || ""} onChange={(e) => setSoLuong(Math.max(0, parseInt(e.target.value) || 0))} className="input w-full" />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Lý do / Yêu cầu *</label>
          <textarea required value={lyDo} onChange={(e) => setLyDo(e.target.value)} className="input w-full min-h-[80px]" placeholder="Mô tả lỗi + yêu cầu cụ thể..." />
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Yêu cầu làm lại" variant="danger" />
    </form>
  );
}

// ============ TRANSFER FORM (Chuyển công đoạn) ============

function TransferForm({ task, user, onClose }: any) {
  const fromKhau = task.id.startsWith("CAT_") ? "cat"
    : task.id.startsWith("INTD_") ? "intd"
    : task.id.startsWith("MAY_") ? "may"
    : task.id.startsWith("KN_") ? "khuy-nut"
    : task.id.startsWith("UI_") ? "ui"
    : task.id.startsWith("DG_") ? "dong-goi"
    : null;
  const [toKhau, setToKhau] = useState<CongDoanKey | "">("");
  const [ghiChu, setGhiChu] = useState<string>("");

  const availableKhau = CONG_DOAN_ORDER.filter((k) => k !== fromKhau);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toKhau) {
      toast.error("Vui lòng chọn công đoạn chuyển đến");
      return;
    }
    logWorkflow(user, "approve", task.id, task.id, {
      newValue: { fromKhau, toKhau, ghiChu },
    });
    toast.success(`Đã chuyển sang công đoạn ${CONG_DOAN_LABELS[toKhau as CongDoanKey]}`);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<ArrowRight className="w-5 h-5 text-sky-500" />} title={`Chuyển công đoạn - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="card p-3 bg-sky-500/5 text-sm">
          <div className="text-xs opacity-70 mb-1">Hiện tại đang ở:</div>
          <div className="font-semibold text-sky-700">{fromKhau ? CONG_DOAN_LABELS[fromKhau] : "—"}</div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Chuyển đến *</label>
          <select required value={toKhau} onChange={(e) => setToKhau(e.target.value as CongDoanKey)} className="input w-full">
            <option value="">-- Chọn công đoạn --</option>
            {availableKhau.map((k) => (
              <option key={k} value={k}>{CONG_DOAN_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Lý do chuyển</label>
          <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="input w-full min-h-[60px]" placeholder="VD: Chuyển nhanh qua bộ phận khác do quá tải..." />
        </div>
        <div className="text-xs opacity-70 bg-amber-500/5 rounded p-2">
          ⚠️ Hành động này sẽ tạo phiếu mới ở công đoạn đích. Phiếu hiện tại sẽ được đánh dấu "Chuyển tiếp".
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Chuyển công đoạn" />
    </form>
  );
}

// ============ APPROVE FORM (Duyệt hoàn thành) ============

function ApproveForm({ task, user, onClose }: any) {
  const [ghiChu, setGhiChu] = useState<string>("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logWorkflow(user, "approve", task.id, task.id, {
      newValue: { action: "final_approve", ghiChu },
    });
    toast.success(`Đã duyệt hoàn thành ${task.id}`);
    onClose();
  };
  return (
    <form onSubmit={handleSubmit} className="p-5">
      <ModalHeader icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} title={`Duyệt hoàn thành - ${task.id}`} onClose={onClose} />
      <div className="space-y-3 mb-4">
        <div className="card p-3 bg-emerald-500/10 text-sm">
          <div className="text-xs opacity-70 mb-2">Tổng kết phiếu:</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] opacity-70">SL đạt</div>
              <div className="font-bold text-emerald-600">{task.soLuongDat.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">SL lỗi</div>
              <div className="font-bold text-rose-600">{task.soLuongLoi.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Tiền công</div>
              <div className="font-bold">{(task.soLuongDat * task.donGia).toLocaleString()}đ</div>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Ghi chú duyệt (optional)</label>
          <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} className="input w-full min-h-[60px]" placeholder="Ghi chú cho kế toán..." />
        </div>
        <div className="card p-3 bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            Sau khi duyệt, <b>kế toán sẽ đối soát</b> và lên lịch thanh toán. Bạn có thể khóa đối soát sau khi xác nhận xong.
          </div>
        </div>
      </div>
      <ModalFooter onClose={onClose} submitLabel="Duyệt hoàn thành" variant="warning" />
    </form>
  );
}

// ============ SHARED ============

function ModalHeader({ icon, title, onClose }: { icon: React.ReactNode; title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
      <h2 className="text-base font-bold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <button onClick={onClose} aria-label="Đóng" className="p-1 rounded hover:bg-white/30">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, submitLabel, variant = "primary" }: { onClose: () => void; submitLabel: string; variant?: "primary" | "warning" | "danger" }) {
  const variantClass = {
    primary: "btn-primary",
    warning: "bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl",
    danger: "bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl",
  }[variant];
  return (
    <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "var(--border)" }}>
      <button type="button" onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
      <button type="submit" className={`text-sm ${variantClass}`}>{submitLabel}</button>
    </div>
  );
}
