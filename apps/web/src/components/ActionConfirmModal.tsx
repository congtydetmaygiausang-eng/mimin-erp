"use client";

// ============================================
// ACTION CONFIRM MODAL - HITL Pattern
// Hiển thị action proposal từ AI agent
// Admin bấm "Duyệt" → execute | "Huỷ" → xóa proposal
// ============================================

import { useState } from "react";
import { X, Check, XCircle, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

export interface ActionProposal {
  type: "action_proposal";
  action: string;
  proposal_id: string;
  data: any;
  preview: Record<string, any>;
  warnings: string[];
  requires_approval: boolean;
  agent: string;
  timestamp: number;
}

interface ActionConfirmModalProps {
  open: boolean;
  proposal: ActionProposal | null;
  onClose: () => void;
  onApprove: (proposal: ActionProposal) => void | Promise<void>;
  onReject: (proposalId: string) => void;
}

const ACTION_LABELS: Record<string, { title: string; icon: string; color: string }> = {
  createLenhCat: {
    title: "Tạo lệnh cắt mới",
    icon: "✂️",
    color: "from-blue-600 to-indigo-600",
  },
  updateTonKho: {
    title: "Cập nhật tồn kho",
    icon: "📦",
    color: "from-emerald-600 to-teal-600",
  },
  capNhatTrangThaiLenhCat: {
    title: "Đổi trạng thái lệnh cắt",
    icon: "🔄",
    color: "from-amber-500 to-orange-500",
  },
  xuatBaoCao: {
    title: "Xuất báo cáo",
    icon: "📊",
    color: "from-violet-600 to-fuchsia-600",
  },
};

export function ActionConfirmModal({
  open,
  proposal,
  onClose,
  onApprove,
  onReject,
}: ActionConfirmModalProps) {
  const [executing, setExecuting] = useState(false);

  if (!open || !proposal) return null;

  const meta = ACTION_LABELS[proposal.action] || {
    title: proposal.action,
    icon: "🤖",
    color: "from-slate-500 to-slate-600",
  };

  const handleApprove = async () => {
    setExecuting(true);
    try {
      await onApprove(proposal);
      toast.success(`✅ Đã duyệt: ${meta.title}`);
      onClose();
    } catch (err: any) {
      toast.error("Lỗi khi thực thi: " + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleReject = () => {
    onReject(proposal.proposal_id);
    toast.info(`Đã huỷ: ${meta.title}`);
    onClose();
  };

  // Render preview fields
  const renderPreview = () => {
    return Object.entries(proposal.preview).map(([key, value]) => {
      let displayValue = value;
      if (typeof value === "number" && key.toLowerCase().includes("chi")) {
        displayValue = new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(value);
      } else if (Array.isArray(value)) {
        displayValue = value.join(", ");
      } else if (typeof value === "object" && value !== null) {
        displayValue = JSON.stringify(value, null, 2);
      }
      const labelMap: Record<string, string> = {
        tenSP: "Tên sản phẩm",
        maSP: "Mã SP",
        tongSL: "Tổng SL",
        vaiCanM: "Vải cần (m)",
        COGS: "Giá vốn/SP",
        tongChiPhi: "Tổng chi phí",
        tenVT: "Tên vật tư",
        loai: "Loại thao tác",
        tonKhoHienTai: "Tồn hiện tại",
        tonKhoMoi: "Tồn mới",
        chenhLech: "Chênh lệch",
        donVi: "Đơn vị",
        lenhCatId: "Mã lệnh",
        trangThaiCu: "TT cũ",
        trangThaiMoi: "TT mới",
        ghiChu: "Ghi chú",
        tuNgay: "Từ ngày",
        denNgay: "Đến ngày",
        dinhDang: "Định dạng",
        vaiGoiY: "Vải gợi ý",
      };
      return (
        <div key={key} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
          <span className="text-sm text-slate-500">{labelMap[key] || key}</span>
          <span className="text-sm font-medium text-slate-800 text-right max-w-[60%] break-words">
            {String(displayValue)}
          </span>
        </div>
      );
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={() => !executing && onClose()}
      maxWidth="md"
      className="bg-white rounded-2xl"
    >
      <div className="flex flex-col max-h-[92vh]">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 bg-gradient-to-r ${meta.color} text-white shrink-0 -m-0 md:-m-0 rounded-b-none`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <h3 className="font-bold text-lg">Xác nhận hành động</h3>
              <p className="text-xs text-white/80">{meta.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={executing}
            className="p-1 hover:bg-white/20 rounded-full transition-colors disabled:opacity-30"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Agent info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-xs text-slate-600">
              Đề xuất từ <strong className="text-violet-700">{proposal.agent}</strong>
            </span>
          </div>

          {/* Warnings */}
          {proposal.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
              {proposal.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview data */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Chi tiết
            </div>
            {renderPreview()}
          </div>

          {/* Raw data (collapsible) */}
          <details className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
            <summary className="cursor-pointer font-bold text-slate-500 uppercase tracking-wide">
              Raw data (JSON)
            </summary>
            <pre className="mt-2 p-2 bg-slate-100 rounded text-[10px] overflow-auto max-h-40">
              {JSON.stringify(proposal.data, null, 2)}
            </pre>
          </details>

          {/* ID */}
          <div className="text-[10px] text-slate-400 text-center">
            proposal_id: <code>{proposal.proposal_id}</code>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 p-4 border-t bg-slate-50 shrink-0 rounded-b-2xl">
          <button
            onClick={handleReject}
            disabled={executing}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 text-slate-700 font-medium text-sm hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[44px]"
          >
            <XCircle className="w-4 h-4" />
            Huỷ
          </button>
          <button
            onClick={handleApprove}
            disabled={executing}
            data-testid="btn-approve-action"
            className={`w-full sm:w-auto px-4 py-3 sm:py-2 bg-gradient-to-r ${meta.color} text-white font-bold text-sm rounded-lg hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm min-h-[44px]`}
          >
            {executing ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang thực thi...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Duyệt & Thực thi
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
