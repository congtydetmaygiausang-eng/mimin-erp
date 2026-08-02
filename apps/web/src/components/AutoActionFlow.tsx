"use client";

// ============================================
// Auto Action Flow - Flowchart cho MIN AI
// Hien thi flow 6 buoc auto-action cua MIN AI San xuat
// Component doc lap, co the nhung vao bat ky trang nao
// ============================================

import { ArrowDown, ArrowRight, Check, X, Loader2, MessageSquare, Database, FileCheck, Cog, Activity, BarChart3 } from "lucide-react";

interface FlowNode {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  type: "user" | "ai" | "decision" | "process" | "result";
  color: string;
}

const FLOW_NODES: FlowNode[] = [
  {
    id: "A",
    label: "Anh Sang mô tả công việc",
    description: "Bằng ngôn ngữ tự nhiên, không cần nhớ tên màn hình",
    icon: <MessageSquare className="w-5 h-5" />,
    type: "user",
    color: "from-sky-500 to-blue-600",
  },
  {
    id: "B",
    label: "AI tự lấy dữ liệu & kiểm tra",
    description: "Hồ sơ SP, tỷ lệ size, tồn kho, định mức, bảng giá, năng lực tổ",
    icon: <Database className="w-5 h-5" />,
    type: "ai",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "C",
    label: "AI trình kế hoạch",
    description: "Liệt kê tất cả bước sẽ làm + cảnh báo (thiếu NVL, vượt định mức...)",
    icon: <FileCheck className="w-5 h-5" />,
    type: "ai",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "D",
    label: "Anh Sang xác nhận?",
    description: "OK / Làm đi / Triển khai đi em → chạy. Chỉnh lại → quay về B",
    icon: <Check className="w-5 h-5" />,
    type: "decision",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "E",
    label: "AI thao tác từng màn hình",
    description: "10 bước: tìm SP → tạo lệnh → chọn màu/size → định mức → phụ liệu → công đoạn → tạo lệnh → phân công → xuất kho → thông báo",
    icon: <Cog className="w-5 h-5" />,
    type: "process",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "F",
    label: "Tự kiểm tra sau mỗi bước",
    description: "Verify: lưu chưa? mã chứng từ? trạng thái? SL thay đổi? lỗi?",
    icon: <Activity className="w-5 h-5" />,
    type: "ai",
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "G",
    label: "Báo cáo + theo dõi chủ động",
    description: "Báo mã lệnh, SL, NV phụ trách, NVL đã xuất/thiếu, COGS, trạng thái. Tiếp tục theo dõi 24/7",
    icon: <BarChart3 className="w-5 h-5" />,
    type: "result",
    color: "from-rose-500 to-pink-600",
  },
];

export function AutoActionFlow() {
  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-slate-800 mb-1">
          🤖 MIN AI Sản xuất - Chế độ Nhân viên Tự động
        </h3>
        <p className="text-sm text-slate-500">
          Flow 7 bước: Từ mô tả ngôn ngữ tự nhiên → tự thao tác → báo cáo
        </p>
      </div>

      <div className="space-y-3">
        {FLOW_NODES.map((node, idx) => (
          <div key={node.id} className="flex flex-col items-center">
            {/* Node */}
            <div
              className={`w-full bg-gradient-to-br ${node.color} text-white rounded-2xl shadow-lg p-4 flex items-start gap-3 transition-transform hover:scale-[1.02] cursor-default`}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wide">
                    {node.type === "user" && "User"}
                    {node.type === "ai" && "AI"}
                    {node.type === "decision" && "Quyết định"}
                    {node.type === "process" && "Xử lý"}
                    {node.type === "result" && "Kết quả"}
                  </span>
                  <span className="text-xs font-bold opacity-80">Bước {node.id}</span>
                </div>
                <div className="font-bold text-sm mb-0.5">{node.label}</div>
                {node.description && (
                  <div className="text-xs opacity-90 leading-relaxed">{node.description}</div>
                )}
              </div>
            </div>

            {/* Arrow to next */}
            {idx < FLOW_NODES.length - 1 && (
              <div className="flex flex-col items-center my-2 text-slate-400">
                <ArrowDown className="w-5 h-5 animate-pulse" />
                {/* Special: D is decision, has 2 branches */}
                {node.id === "D" && (
                  <div className="absolute right-0 mt-12 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 font-bold">
                    ← Nếu "Chỉnh lại" → quay về B
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Highlight box */}
      <div className="mt-6 p-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 rounded-2xl">
        <div className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-2">
          ✨ Nguyên tắc quan trọng nhất
        </div>
        <div className="text-sm text-slate-700 leading-relaxed">
          Người dùng nói <strong>mục tiêu</strong> → AI tự hiểu <strong>quy trình</strong> →
          User <strong>xác nhận</strong> 1 lần → AI tự <strong>thao tác</strong> →
          AI tự <strong>kiểm tra</strong> → AI <strong>báo kết quả</strong> →
          AI tiếp tục <strong>theo dõi chủ động</strong>.
        </div>
        <div className="mt-2 text-xs text-slate-500 italic">
          MIN AI là nhân viên vận hành AI, không phải chatbot chỉ biết hướng dẫn.
        </div>
      </div>
    </div>
  );
}

export default AutoActionFlow;
