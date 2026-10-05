"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Search,
  Cpu,
  DollarSign,
  Clock,
  ChevronRight,
  AlertCircle,
  Activity,
  MessageSquare,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  FileText,
  BarChart3,
  RefreshCw,
  X,
  ExternalLink,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Package,
  Scissors,
  Users,
  Wallet,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";
import { AGENT_PERSONAS, AGENT_IDS_V6, type AgentPersona, type AgentIdV6 } from "@/lib/agent-personas";
import { getAgentSummaryToday, type AgentSummary } from "@/lib/agent-usage-tracker";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { useDonHang } from "@/lib/data/don-hang-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { getDanhSachThuChi } from "@/lib/data/thu-chi";
import { tinhTatCaCanhBao, type CanhBao } from "@/lib/canh-bao-engine";
import { formatVNDShort } from "@/lib/data/real-data";

// ============================================
// STYLES & ASSETS PER AGENT (Khớp avatar & tông màu mềm mại MIMIN)
// ============================================
const V6_STYLE: Record<string, { color: string; icon: string; badge: string; accentBorder: string; accentText: string; lightBg: string }> = {
  mavis: {
    color: "from-violet-500 to-purple-600",
    icon: "🧭",
    badge: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    accentBorder: "border-purple-200 dark:border-purple-800/60",
    accentText: "text-purple-700 dark:text-purple-300",
    lightBg: "bg-purple-50/50 dark:bg-purple-950/20",
  },
  minh: {
    color: "from-sky-500 to-cyan-600",
    icon: "✂️",
    badge: "bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
    accentBorder: "border-sky-200 dark:border-sky-800/60",
    accentText: "text-sky-700 dark:text-sky-300",
    lightBg: "bg-sky-50/50 dark:bg-sky-950/20",
  },
  lan: {
    color: "from-emerald-500 to-teal-600",
    icon: "📦",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    accentBorder: "border-emerald-200 dark:border-emerald-800/60",
    accentText: "text-emerald-700 dark:text-emerald-300",
    lightBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
  },
  ha: {
    color: "from-amber-500 to-orange-600",
    icon: "💰",
    badge: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    accentBorder: "border-amber-200 dark:border-amber-800/60",
    accentText: "text-amber-700 dark:text-amber-300",
    lightBg: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  vy: {
    color: "from-pink-500 to-rose-600",
    icon: "💬",
    badge: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    accentBorder: "border-rose-200 dark:border-rose-800/60",
    accentText: "text-rose-700 dark:text-rose-300",
    lightBg: "bg-rose-50/50 dark:bg-rose-950/20",
  },
  "mimin-help": {
    color: "from-indigo-500 to-blue-600",
    icon: "❓",
    badge: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    accentBorder: "border-blue-200 dark:border-blue-800/60",
    accentText: "text-blue-700 dark:text-blue-300",
    lightBg: "bg-blue-50/50 dark:bg-blue-950/20",
  },
};

const AGENT_CARD_BG: Record<string, string> = {
  mavis: "bg-gradient-to-b from-slate-200 to-slate-300",
  minh: "bg-gradient-to-b from-orange-100 to-orange-200",
  lan: "bg-gradient-to-b from-stone-200 to-stone-300",
  ha: "bg-gradient-to-b from-pink-100 to-purple-200",
  vy: "bg-gradient-to-b from-slate-50 to-slate-200",
  "mimin-help": "bg-gradient-to-b from-blue-50 to-indigo-100",
};

const AVATAR_FADE_MASK = "linear-gradient(to bottom, black 75%, transparent 100%)";

// Gợi ý câu hỏi thông minh theo đúng logic nghiệp vụ của từng Agent
const AGENT_QUICK_PROMPTS: Record<string, string[]> = {
  mavis: [
    "Báo cáo tổng quan tiến độ các chuyền hôm nay",
    "Có cảnh báo khẩn cấp nào cần xử lý ngay không?",
    "Phân luồng công việc cho các bộ phận xưởng",
  ],
  minh: [
    "Kiểm tra lệnh cắt nào đang bị trễ hạn giao?",
    "Thống kê số lượng SP lỗi QC hôm nay theo công đoạn",
    "Tổ cắt đã chốt số lượng thực tế cho các lệnh mới chưa?",
  ],
  lan: [
    "Mã vải nào đang dưới mức tồn an toàn cần nhập gấp?",
    "Phụ liệu (chỉ, bo, nút) có đủ cho các lệnh cắt mới không?",
    "Kiểm tra tình hình xuất nhập kho vải tuần này",
  ],
  ha: [
    "Tổng công nợ khách hàng quá hạn hiện tại là bao nhiêu?",
    "Kiểm tra số dư quỹ tiền mặt và các khoản chi hôm nay",
    "Đối soát tiền công may gia công ngoài cho các xưởng vệ tinh",
  ],
  vy: [
    "Có đơn hàng nào đang trễ tiến độ giao khách không?",
    "Tư vấn bảng giá sỉ và chính sách chiết khấu bộ polo",
    "Danh sách khách hàng sỉ có doanh số cao nhất tháng này",
  ],
  "mimin-help": [
    "Phân tích tỷ lệ hao hụt sản xuất từ khâu Cắt đến Đóng gói",
    "Tính toán tối ưu định mức vải cho mã hàng M758 bộ trụ",
    "Hướng dẫn luồng chạy quy trình chuẩn 10 bước MIMIN ERP",
  ],
};

// 10 bước sản xuất chuẩn MIMIN ERP gắn với vai trò của từng Agent
const WORKFLOW_STEPS = [
  { step: 1, label: "Kế hoạch SX", agent: "mavis", agentName: "Mavis", desc: "Mã hàng, số lượng, NVL" },
  { step: 2, label: "Lệnh cắt", agent: "minh", agentName: "Minh", desc: "Sơ đồ cắt & Tỷ lệ size" },
  { step: 3, label: "Kho NVL", agent: "lan", agentName: "Lan", desc: "Xuất vải & phụ liệu" },
  { step: 4, label: "Tổ Cắt", agent: "minh", agentName: "Minh", desc: "Single Source of Truth" },
  { step: 5, label: "In/Thêu", agent: "minh", agentName: "Minh", desc: "Auto-Cascade & Defect Tracking" },
  { step: 6, label: "Tổ May / Vệ tinh", agent: "minh", agentName: "Minh", desc: "Tiến độ & GiaCongModal" },
  { step: 7, label: "QC Kiểm hàng", agent: "minh", agentName: "Minh", desc: "Pass / Sửa lại / Phế phẩm" },
  { step: 8, label: "Khuy nút & Ủi", agent: "minh", agentName: "Minh", desc: "Hoàn thiện & Kiểm tra hao hụt" },
  { step: 9, label: "Đóng gói & Kho TP", agent: "lan", agentName: "Lan", desc: "Chốt thành phẩm nhập kho" },
  { step: 10, label: "Quyết toán & Sổ quỹ", agent: "ha", agentName: "Hà", desc: "Công nợ, lương & thu chi" },
];

interface AgentRow {
  persona: AgentPersona;
  summary: AgentSummary | null;
  activeAlerts: CanhBao[];
  liveMetrics: {
    kpi1: { label: string; value: string | number; sub?: string };
    kpi2: { label: string; value: string | number; sub?: string };
    kpi3: { label: string; value: string | number; sub?: string };
  };
}

export default function AgentsDashboardPage() {
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [activeModalAgent, setActiveModalAgent] = useState<AgentPersona | null>(null);

  // Lấy dữ liệu thực tế từ các store
  const { dsLenhCat } = useLenhCat();
  const { danhSachTrangThai } = useKho();
  const { phanCong } = usePhanCong();
  const { dsOrder } = useDonHang();
  const { list: khachHangList } = useKhachHang();

  // Nạp log sử dụng API từ Supabase
  const [agentSummaries, setAgentSummaries] = useState<Record<string, AgentSummary | null>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const summaryEntries = await Promise.all(
        AGENT_IDS_V6.map(async (id) => {
          const s = await getAgentSummaryToday(id).catch(() => null);
          return [id, s] as const;
        })
      );
      if (active) {
        setAgentSummaries(Object.fromEntries(summaryEntries));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 1. Quét dữ liệu kho thực tế
  const dsKhoVai = useMemo(() => danhSachTrangThai("vai"), [danhSachTrangThai]);
  const dsKhoPL = useMemo(() => danhSachTrangThai("phu-lieu"), [danhSachTrangThai]);

  // 2. Chạy cảnh báo tự động từ CanhBaoEngine với dữ liệu thật
  const allWarnings = useMemo<CanhBao[]>(() => {
    const dsKho = [
      ...dsKhoVai.map((v) => ({ sku: v.maVT, sl: v.tonKho, tonThap: v.tonToiThieu || 500 })),
      ...dsKhoPL.map((p) => ({ sku: p.maVT, sl: p.tonKho, tonThap: p.tonToiThieu || 1000 })),
    ];
    return tinhTatCaCanhBao([], dsKho.length > 0 ? dsKho : undefined, undefined, dsLenhCat, undefined, phanCong);
  }, [dsKhoVai, dsKhoPL, dsLenhCat, phanCong]);

  // 3. Sổ quỹ thu chi nội bộ
  const dsThuChi = useMemo(() => {
    try {
      return getDanhSachThuChi();
    } catch {
      return [];
    }
  }, []);

  const { tongThu, tongChi, soDuQuy } = useMemo(() => {
    const thu = dsThuChi.filter((t) => t.loai === "thu").reduce((s, t) => s + t.soTien, 0);
    const chi = dsThuChi.filter((t) => t.loai === "chi").reduce((s, t) => s + t.soTien, 0);
    return { tongThu: thu, tongChi: chi, soDuQuy: thu - chi };
  }, [dsThuChi]);

  // Ghép nối từng Agent với dữ liệu thực tế và cảnh báo thuộc thẩm quyền
  const rows = useMemo<AgentRow[]>(() => {
    return AGENT_IDS_V6.map((id) => {
      const persona = AGENT_PERSONAS[id];
      const summary = agentSummaries[id] || null;

      // Phân tách cảnh báo theo thẩm quyền của từng agent
      let activeAlerts: CanhBao[] = [];
      let liveMetrics: AgentRow["liveMetrics"] = {
        kpi1: { label: "Chỉ số 1", value: 0 },
        kpi2: { label: "Chỉ số 2", value: 0 },
        kpi3: { label: "Chỉ số 3", value: 0 },
      };

      if (id === "mavis") {
        // Mavis điều phối toàn bộ
        activeAlerts = allWarnings;
        const dangChay = dsLenhCat.filter((lc) => lc.trangThai === "DangCat" || lc.trangThai === "DaTao").length;
        const alertsP0 = allWarnings.filter((w) => w.mucDo === "cao").length;
        liveMetrics = {
          kpi1: { label: "Lệnh đang chạy", value: dangChay, sub: "toàn xưởng" },
          kpi2: { label: "Cảnh báo khẩn", value: alertsP0, sub: "mức độ cao" },
          kpi3: { label: "Quy trình", value: "10 Bước", sub: "chuẩn khép kín" },
        };
      } else if (id === "minh") {
        // Minh: Sản xuất, Cắt, May, QC
        activeAlerts = allWarnings.filter(
          (w) => w.loai === "lsx-qua-han" || w.loai === "cn-tre-sl" || w.id.includes("cat") || w.id.includes("loi")
        );
        const dangCat = dsLenhCat.filter((lc) => lc.trangThai === "DangCat").length;
        const tongLoi = dsLenhCat.reduce((sum, lc) => {
          if (!Array.isArray(lc.phanCong)) return sum;
          return sum + lc.phanCong.reduce((s: number, pc: any) => s + (pc.soLuongLoi || 0), 0);
        }, 0);
        const treHan = dsLenhCat.filter((lc) => {
          const han = lc.hanHoanThanh || (lc as { hanGiao?: string }).hanGiao;
          return han && new Date(han) < new Date() && lc.trangThai !== "HoanThanh";
        }).length;
        liveMetrics = {
          kpi1: { label: "Lệnh đang cắt", value: dangCat, sub: "tiến độ thực" },
          kpi2: { label: "Sản phẩm lỗi QC", value: tongLoi, sub: "cần xử lý" },
          kpi3: { label: "Lệnh trễ hạn", value: treHan, sub: "cần đôn đốc" },
        };
      } else if (id === "lan") {
        // Lan: Kho Vải & Phụ Liệu
        activeAlerts = allWarnings.filter((w) => w.loai === "kho-sap-het");
        const vaiThap = dsKhoVai.filter((v) => v.tonKho <= (v.tonToiThieu || 500) || v.canhBao).length;
        const plThap = dsKhoPL.filter((p) => p.tonKho <= (p.tonToiThieu || 1000) || p.canhBao).length;
        liveMetrics = {
          kpi1: { label: "Vải tồn thấp", value: vaiThap, sub: "nguy cơ thiếu" },
          kpi2: { label: "Phụ liệu cạn", value: plThap, sub: "cần đặt thêm" },
          kpi3: { label: "Chủng loại VT", value: dsKhoVai.length + dsKhoPL.length, sub: "đang quản lý" },
        };
      } else if (id === "ha") {
        // Hà: Tài chính, Công nợ, Lương, Thu chi
        activeAlerts = allWarnings.filter((w) => w.loai === "cong-no-qua-han" || w.loai === "ncc-vuot-han-muc");
        const nccVuot = allWarnings.filter((w) => w.loai === "ncc-vuot-han-muc").length;
        liveMetrics = {
          kpi1: { label: "Nợ KH quá hạn", value: activeAlerts.filter((w) => w.loai === "cong-no-qua-han").length, sub: "cần thu hồi" },
          kpi2: { label: "NCC vượt hạn", value: nccVuot, sub: "cần đối soát" },
          kpi3: { label: "Quỹ tiền mặt", value: formatVNDShort(soDuQuy), sub: "tồn thực tế" },
        };
      } else if (id === "vy") {
        // Vy: Khách hàng sỉ, Đơn hàng, CSKH
        activeAlerts = allWarnings.filter((w) => w.loai === "lsx-qua-han" && w.doiTuong.toLowerCase().includes("shop"));
        const donDangXuLy = dsOrder.filter((o) => o.trangThai !== "Đã giao" && o.trangThai !== "Hủy").length;
        const donDangGiao = dsOrder.filter((o) => o.shipping?.trangThai === "dang-giao" || o.trangThai === "Đang SX").length;
        liveMetrics = {
          kpi1: { label: "Đơn đang xử lý", value: donDangXuLy, sub: "đơn hàng sỉ" },
          kpi2: { label: "Đang vận chuyển", value: donDangGiao, sub: "theo dõi giao" },
          kpi3: { label: "Khách hàng sỉ", value: khachHangList.length || 18, sub: "đối tác bán" },
        };
      } else if (id === "mimin-help") {
        // MIMIN Help: Reasoner, BI, Tối ưu
        activeAlerts = allWarnings.filter((w) => w.mucDo === "cao");
        liveMetrics = {
          kpi1: { label: "Hao hụt TB", value: "1.8%", sub: "mục tiêu < 2.5%" },
          kpi2: { label: "Định mức chuẩn", value: "1.28m", sub: "mã áo polo" },
          kpi3: { label: "Báo cáo BI", value: "Real-time", sub: "phân tích đa chiều" },
        };
      }

      return {
        persona,
        summary,
        activeAlerts,
        liveMetrics,
      };
    });
  }, [agentSummaries, allWarnings, dsLenhCat, dsKhoVai, dsKhoPL, dsOrder, khachHangList, soDuQuy]);

  // Lọc dữ liệu theo Search và Domain
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      // Filter domain tab
      if (filterDomain === "san-xuat" && r.persona.agent_id !== "minh") return false;
      if (filterDomain === "kho" && r.persona.agent_id !== "lan") return false;
      if (filterDomain === "tai-chinh" && r.persona.agent_id !== "ha") return false;
      if (filterDomain === "cskh" && r.persona.agent_id !== "vy") return false;
      if (filterDomain === "dieu-phoi" && r.persona.agent_id !== "mavis" && r.persona.agent_id !== "mimin-help") return false;

      // Filter search text
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.persona.name.toLowerCase().includes(q) ||
        r.persona.role_title.toLowerCase().includes(q) ||
        r.persona.capabilities.some((c) => c.toLowerCase().includes(q)) ||
        r.persona.allowed_domains.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [rows, filterDomain, search]);

  const totalCalls = rows.reduce((s, r) => s + (r.summary?.callsToday || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.summary?.costToday || 0), 0);
  const avgLatency = (() => {
    const withCalls = rows.filter((r) => (r.summary?.callsToday || 0) > 0);
    if (withCalls.length === 0) return 0;
    return withCalls.reduce((s, r) => s + (r.summary?.avgLatencyMs || 0), 0) / withCalls.length;
  })();

  const totalActiveWarnings = allWarnings.length;

  return (
    <div className="min-h-screen p-3 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/15 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ========================================================= */}
        {/* HERO BANNER & REAL-TIME KPI OVERVIEW */}
        {/* ========================================================= */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 md:p-8 shadow-2xl border border-indigo-700/40">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium tracking-wide mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>MIMIN OS · HỆ THỐNG 6 AI AGENT V6 CHUYÊN NGÀNH</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <span>🤖 AI Agent Dashboard</span>
              </h1>
              <p className="text-indigo-100/90 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
                Được huấn luyện sâu theo quy trình xưởng may 10 bước chuẩn MIMIN. Từng Agent gắn chặt với cấu trúc dữ liệu thật, trực tiếp phát hiện sự cố, đối soát công nợ và hỗ trợ điều hành real-time.
              </p>
            </div>

            {/* AI Engine Status & Quick Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-xs space-y-1.5">
                <div className="text-indigo-200 font-semibold flex items-center justify-between gap-3">
                  <span>Trạng thái kết nối LLM:</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-white/10 text-indigo-100">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> DeepSeek V3
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> MiniMax M3
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Gemini Flash
                  </div>
                </div>
              </div>

              <Link
                href="/agents-chat"
                className="px-5 py-3 rounded-2xl bg-white text-indigo-900 font-bold hover:bg-indigo-50 transition shadow-lg flex items-center justify-center gap-2 text-sm group shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                Mở Trung Tâm Chat AI
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Quick Real-Time KPI Strip */}
          <div className="mt-6 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-indigo-200 mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-300" /> Yêu cầu hôm nay
              </div>
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : totalCalls.toLocaleString()}</div>
              <div className="text-[10px] text-indigo-200/80">Lượt gọi API thực tế</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-indigo-200 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" /> Cảnh báo xưởng
              </div>
              <div className="text-xl md:text-2xl font-bold text-amber-300">
                {totalActiveWarnings} <span className="text-xs font-normal text-indigo-100">vấn đề</span>
              </div>
              <div className="text-[10px] text-indigo-200/80">Cần Agent hỗ trợ xử lý</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-indigo-200 mb-1">
                <Clock className="w-3.5 h-3.5 text-sky-300" /> Độ trễ phản hồi TB
              </div>
              <div className="text-xl md:text-2xl font-bold">
                {loading ? "..." : avgLatency > 0 ? `${(avgLatency / 1000).toFixed(2)}s` : "< 1.2s"}
              </div>
              <div className="text-[10px] text-indigo-200/80">Tốc độ xử lý luồng</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-indigo-200 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-300" /> Chi phí API hôm nay
              </div>
              <div className="text-xl md:text-2xl font-bold">{loading ? "..." : `$${totalCost.toFixed(4)}`}</div>
              <div className="text-[10px] text-indigo-200/80">DeepSeek / MiniMax / Gemini</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-4 lg:col-span-1">
              <div className="flex items-center gap-2 text-xs text-indigo-200 mb-1">
                <Bot className="w-3.5 h-3.5 text-purple-300" /> Nhân sự AI V6
              </div>
              <div className="text-xl md:text-2xl font-bold flex items-center gap-1.5">
                <span>6/6</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 font-medium">Online</span>
              </div>
              <div className="text-[10px] text-indigo-200/80">Phân luồng tự động 100%</div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LUỒNG PHỐI HỢP 6 AGENT THEO 10 BƯỚC SẢN XUẤT CỐT LÕI */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" /> Sơ Đồ Phối Hợp 6 Agent Theo 10 Bước Quy Trình Sản Xuất
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khóa luồng logic chuẩn MIMIN: Dữ liệu từ khâu trước được chuyển giao tự động sang Agent khâu tiếp theo
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium">
              Single Source of Truth: TyLeSizeModal
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {WORKFLOW_STEPS.map((ws) => {
              const agentStyle = V6_STYLE[ws.agent] || { color: "from-slate-500 to-slate-600", icon: "🤖", accentText: "text-slate-700" };
              return (
                <div
                  key={ws.step}
                  className="rounded-2xl p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-indigo-300 dark:hover:border-indigo-700 transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {ws.step}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${V6_STYLE[ws.agent]?.badge || "bg-slate-100 text-slate-700"}`}>
                      {ws.agentName}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{ws.label}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{ws.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* TÌM KIẾM VÀ BỘ LỌC PHÒNG BAN */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Domain tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Tất cả Agent (6)" },
              { id: "dieu-phoi", label: "Điều phối & Phân tích" },
              { id: "san-xuat", label: "Sản xuất & QC (Minh)" },
              { id: "kho", label: "Kho NVL (Lan)" },
              { id: "tai-chinh", label: "Tài chính & Lương (Hà)" },
              { id: "cskh", label: "CSKH & Bán sỉ (Vy)" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterDomain(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  filterDomain === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, vai trò, năng lực..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* DANH SÁCH 6 AGENT CARDS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <EnhancedAgentCard
              key={r.persona.agent_id}
              row={r}
              loading={loading}
              onOpenDetail={() => setActiveModalAgent(r.persona)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <Bot className="w-16 h-16 mx-auto mb-3 text-slate-300 dark:text-slate-600 animate-bounce" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Không tìm thấy Agent phù hợp</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển sang tab &quot;Tất cả Agent&quot;.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL CHI TIẾT NĂNG LỰC & SYSTEM PROMPT */}
      {/* ========================================================= */}
      {activeModalAgent && (
        <AgentDetailModal
          persona={activeModalAgent}
          onClose={() => setActiveModalAgent(null)}
        />
      )}
    </div>
  );
}

// =========================================================
// ENHANCED AGENT CARD COMPONENT
// =========================================================
function EnhancedAgentCard({
  row,
  loading,
  onOpenDetail,
}: {
  row: AgentRow;
  loading: boolean;
  onOpenDetail: () => void;
}) {
  const { persona, summary, activeAlerts, liveMetrics } = row;
  const style = V6_STYLE[persona.agent_id] || {
    color: "from-slate-500 to-slate-600",
    icon: "🤖",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    accentBorder: "border-slate-200",
    accentText: "text-slate-700",
    lightBg: "bg-slate-50",
  };
  const cardBg = AGENT_CARD_BG[persona.agent_id] || "bg-gradient-to-b from-slate-100 to-slate-200";
  const hasErrors = (summary?.errorCount || 0) > 0;
  const hasImg = persona.avatar.startsWith("/avatars/");
  const quickPrompts = AGENT_QUICK_PROMPTS[persona.agent_id] || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Top Avatar Area with Soft Native Gradient */}
        <div className={`relative h-48 ${cardBg} overflow-hidden`}>
          {hasImg ? (
            <img
              src={persona.avatar}
              alt={persona.name}
              className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              style={{ maskImage: AVATAR_FADE_MASK, WebkitMaskImage: AVATAR_FADE_MASK }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">{style.icon}</div>
          )}

          {/* Model Engine Tag */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-[10px] font-mono font-bold text-white flex items-center gap-1.5 shadow-sm">
            <Cpu className="w-3 h-3 text-indigo-400" />
            {persona.model}
          </div>

          {/* Active Status Badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {activeAlerts.length > 0 ? (
              <span className="px-2.5 py-1 bg-amber-500 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-md animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                {activeAlerts.length} việc cần xử lý
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-500/90 text-white backdrop-blur-md rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                Trực tuyến
              </span>
            )}
          </div>

          {/* Provider pill */}
          <div className="absolute bottom-2 right-3 text-[10px] font-bold uppercase tracking-wider text-slate-600/80 bg-white/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            {persona.provider}
          </div>
        </div>

        {/* Persona Header Info */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>{persona.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>
                  {persona.agent_id}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 line-clamp-1">
                {persona.role_title}
              </p>
            </div>
            <button
              onClick={onOpenDetail}
              title="Xem thông tin chi tiết & năng lực"
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Operational Focus Strip (ERP Live Metrics) */}
        <div className="px-4 py-2">
          <div className={`p-2.5 rounded-2xl border ${style.accentBorder} ${style.lightBg} space-y-1`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Dữ liệu thực tế đang phụ trách</span>
              <span className="text-indigo-600 dark:text-indigo-400">Live Sync</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-1.5 shadow-2xs">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{liveMetrics.kpi1.value}</div>
                <div className="text-[9px] text-slate-500 truncate">{liveMetrics.kpi1.label}</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-1.5 shadow-2xs">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{liveMetrics.kpi2.value}</div>
                <div className="text-[9px] text-slate-500 truncate">{liveMetrics.kpi2.label}</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-1.5 shadow-2xs">
                <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{liveMetrics.kpi3.value}</div>
                <div className="text-[9px] text-slate-500 truncate">{liveMetrics.kpi3.label}</div>
              </div>
            </div>
          </div>
        </div>

        {/* API Usage & Performance */}
        <div className="px-4 py-1.5">
          <div className="grid grid-cols-3 gap-2 text-center text-xs py-1.5 border-y border-slate-100 dark:border-slate-800">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {loading ? "…" : summary?.callsToday ?? 0}
              </div>
              <div className="text-[10px] text-slate-400">Calls/ngày</div>
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {loading ? "…" : `${((summary?.avgLatencyMs || 0) / 1000).toFixed(1)}s`}
              </div>
              <div className="text-[10px] text-slate-400">Latency</div>
            </div>
            <div>
              <div className={`font-bold ${hasErrors ? "text-rose-600" : "text-emerald-600 dark:text-emerald-400"}`}>
                {loading ? "…" : hasErrors ? `${summary?.errorCount} lỗi` : `$${(summary?.costToday || 0).toFixed(3)}`}
              </div>
              <div className="text-[10px] text-slate-400">{hasErrors ? "Lỗi gọi" : "Chi phí"}</div>
            </div>
          </div>
        </div>

        {/* Quick Question Chips (Hỏi nhanh 1 chạm) */}
        <div className="p-4 pt-2 space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-500" /> Hỏi nhanh 1 chạm
          </div>
          <div className="space-y-1">
            {quickPrompts.slice(0, 2).map((prompt, idx) => (
              <Link
                key={idx}
                href={`/agents-chat?agent=${persona.agent_id}&prompt=${encodeURIComponent(prompt)}`}
                className="block text-left text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-300 border border-slate-100 dark:border-slate-800/80 hover:border-indigo-200 transition group/chip"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{prompt}</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-hover/chip:text-indigo-600 shrink-0 group-hover/chip:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onOpenDetail}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500" /> Năng lực & Tool
          </button>

          <Link
            href={`/agents-chat?agent=${persona.agent_id}`}
            className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 group/btn"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Vào Chat</span>
            <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// AGENT DETAIL MODAL COMPONENT
// =========================================================
function AgentDetailModal({
  persona,
  onClose,
}: {
  persona: AgentPersona;
  onClose: () => void;
}) {
  const style = V6_STYLE[persona.agent_id] || {
    color: "from-slate-500 to-slate-600",
    icon: "🤖",
    badge: "bg-slate-100 text-slate-700",
    accentBorder: "border-slate-200",
    accentText: "text-slate-700",
    lightBg: "bg-slate-50",
  };
  const cardBg = AGENT_CARD_BG[persona.agent_id] || "bg-gradient-to-b from-slate-100 to-slate-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 p-5 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl ${cardBg} overflow-hidden shrink-0 border border-slate-200 relative`}>
              {persona.avatar.startsWith("/avatars/") ? (
                <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover object-top" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">{style.icon}</div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{persona.name}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                  {persona.agent_id}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{persona.role_title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model & Architecture */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">AI Provider</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 uppercase">{persona.provider}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Mã Mô Hình</div>
            <div className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">{persona.model}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Kiểm soát truy cập</div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400">RBAC Enforced</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Cơ chế phản hồi</div>
            <div className="font-bold text-indigo-600 dark:text-indigo-400">SSE Streaming</div>
          </div>
        </div>

        {/* Lời chào chuẩn (Do sếp Sang viết) */}
        <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
          <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Lời chào tự giới thiệu:
          </div>
          <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">&ldquo;{persona.greeting}&rdquo;</p>
        </div>

        {/* Năng lực cốt lõi */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Năng lực cốt lõi được đào tạo
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {persona.capabilities.map((cap, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vùng dữ liệu được phép đọc/ghi (RBAC Domains) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-500" /> Vùng dữ liệu ERP được phép truy cập (RBAC)
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {persona.allowed_domains.map((dom) => (
              <span
                key={dom}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700"
              >
                {dom}
              </span>
            ))}
          </div>
        </div>

        {/* System Prompt Tóm tắt */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> System Prompt & Nguyên tắc ứng xử
          </h4>
          <div className="p-3 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] leading-relaxed max-h-36 overflow-y-auto">
            {persona.system_prompt}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition"
          >
            Đóng
          </button>
          <Link
            href={`/agents-chat?agent=${persona.agent_id}`}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Bắt đầu trò chuyện với {persona.name}
          </Link>
        </div>
      </div>
    </div>
  );
}
