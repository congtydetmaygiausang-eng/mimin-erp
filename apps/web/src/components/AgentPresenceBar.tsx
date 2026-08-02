"use client";

// ============================================
// Agent Presence Bar - Thanh AI hien thi o dau moi man hinh
// Theo spec sep Sang (2026-08-03)
// Hien thi: Ten Agent phu trach + trang thai + nut actions + supporting agents
// KHONG hien thi ten model (DeepSeek/Gemini/MiniMax)
// ============================================

import { useState } from "react";
import { Eye, Search, Clock, Cog, CheckCircle, AlertTriangle, Lock, Sparkles, MessageSquare, FileText, Check } from "lucide-react";
import { AGENT_STATUS_LABELS, type AgentStatus } from "@/lib/agent-screen-config";
import { AGENT_PERSONAS } from "@/lib/agent-personas";

interface AgentPresenceBarProps {
  screenCode: string;
  screenName: string;
  primaryAgentId: string;
  supportingAgentIds?: string[];
  status?: AgentStatus;
  warnings?: string[];
  showActions?: boolean;
  onCheck?: () => void;
  onViewProposals?: () => void;
  onOpenChat?: () => void;
  onConfirm?: () => void;
}

const STATUS_ICONS = {
  monitoring: Eye,
  checking: Search,
  awaiting: Clock,
  executing: Cog,
  done: CheckCircle,
  warning: AlertTriangle,
  blocked: Lock,
};

export function AgentPresenceBar({
  screenCode,
  screenName,
  primaryAgentId,
  supportingAgentIds = [],
  status = "monitoring",
  warnings = [],
  showActions = true,
  onCheck,
  onViewProposals,
  onOpenChat,
  onConfirm,
}: AgentPresenceBarProps) {
  const [showSupporting, setShowSupporting] = useState(false);

  const primary = AGENT_PERSONAS[primaryAgentId];
  if (!primary) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-sm text-rose-700">
        Không tìm thấy Agent: {primaryAgentId}
      </div>
    );
  }

  const supportingAgents = supportingAgentIds
    .map((id) => AGENT_PERSONAS[id])
    .filter(Boolean);

  const statusInfo = AGENT_STATUS_LABELS[status];
  const StatusIcon = STATUS_ICONS[status];

  return (
    <div className="bg-gradient-to-r from-violet-50/60 via-white to-fuchsia-50/60 backdrop-blur-md border border-violet-200/60 rounded-2xl p-4 shadow-sm">
      {/* Header: Primary agent */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {primary.avatar.startsWith("/avatars/") ? (
            <img
              src={primary.avatar}
              alt={primary.name}
              className="w-12 h-12 rounded-2xl shadow-md object-cover bg-gradient-to-br from-violet-500 to-fuchsia-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl shadow-md">
              {primary.avatar}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-slate-800 text-base">{primary.name}</h3>
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">
              Phụ trách
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {screenName} <span className="text-slate-400">·</span> <code className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{screenCode}</code>
          </p>

          {/* Status */}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusInfo.label}
            </div>

            {warnings.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                {warnings.length} cảnh báo
              </div>
            )}

            {supportingAgents.length > 0 && (
              <button
                onClick={() => setShowSupporting(!showSupporting)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium text-slate-500 hover:text-violet-600 hover:bg-violet-50 border border-slate-200 transition-colors"
              >
                +{supportingAgents.length} phối hợp
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-1.5 flex-shrink-0">
            {onCheck && (
              <button
                onClick={onCheck}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 flex items-center gap-1 transition-colors"
                title="Yêu cầu AI kiểm tra màn hình"
              >
                <Search className="w-3.5 h-3.5" />
                Kiểm tra
              </button>
            )}
            {onViewProposals && (
              <button
                onClick={onViewProposals}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 flex items-center gap-1 transition-colors"
                title="Xem đề xuất"
              >
                <FileText className="w-3.5 h-3.5" />
                Đề xuất
              </button>
            )}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-violet-300 flex items-center gap-1 transition-colors"
                title="Mở hội thoại với AI"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
            )}
            {onConfirm && (
              <button
                onClick={onConfirm}
                className="px-2.5 py-1.5 text-xs font-bold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg hover:from-violet-700 hover:to-fuchsia-700 flex items-center gap-1 transition-all shadow-sm"
                title="Xác nhận thay đổi"
              >
                <Check className="w-3.5 h-3.5" />
                Xác nhận
              </button>
            )}
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Supporting Agents (collapsible) */}
      {showSupporting && supportingAgents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-200/60">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2">
            AI phối hợp
          </div>
          <div className="flex flex-wrap gap-2">
            {supportingAgents.map((agent) => (
              <div
                key={agent!.agent_id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
              >
                <span className="text-lg">{agent!.avatar}</span>
                <div>
                  <div className="text-xs font-semibold text-slate-700">{agent!.name}</div>
                  <div className="text-[10px] text-slate-500">{agent!.role_title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AgentPresenceBar;
