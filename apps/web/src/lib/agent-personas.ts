// ============================================
// MIMIN ERP - 6 Agent Personas V6 Việt (v89.6.9.4)
// Personality System do sep Sang viet (2026-08-03)
// ============================================

import {
  PERSONALITY_SAN_XUAT,
  PERSONALITY_KHO,
  PERSONALITY_KE_TOAN,
  PERSONALITY_TAI_CHINH,
  PERSONALITY_BAN_HANG,
  PERSONALITY_NHAN_SU,
  PERSONALITY_QC,
  PERSONALITY_KY_THUAT,
  PERSONALITY_CSKH,
  PERSONALITY_HELP,
} from "./agent-personality";

export interface AgentPersona {
  agent_id: string;
  name: string;
  role_title: string;
  avatar: string;
  provider: "deepseek" | "minimax" | "gemini";
  model: string;
  system_prompt: string;
  capabilities: string[];
  allowed_domains: string[]; // Vùng dữ liệu được phép nhập liệu (RBAC)
}

// 6 agents V6 (theo chốt 2026-08-05) - danh sách agent DUY NHẤT còn hoạt động.
// 10 persona cũ (mimin-orchestrator, agent-san-xuat, agent-kho, agent-ke-toan,
// agent-nhan-su, agent-deepseek, agent-ban-hang, agent-tai-chinh,
// agent-theo-doi-cd, agent-ky-thuat-may) đã gộp vào 6 agent dưới đây và KHÔNG
// còn route rule nào trỏ tới nữa (xem agent-routing-rules.ts) - xoá hẳn khỏi
// đây để tránh hiểu nhầm là đang có 2 bộ agent chạy song song.
// Mapping V6: gộp 10 personas cũ thành 6 mới
// - mavis: orchestrator (giữ nguyên)
// - minh: san-xuat + theo-doi-cd + ky-thuat-may
// - lan: kho + ban-hang
// - ha: tai-chinh + ke-toan + nhan-su
// - vy: CSKH (mới, tách từ ban-hang)
// - mimin-help: deepseek (đổi tên)
export const AGENT_IDS_V6 = ["mavis", "minh", "lan", "ha", "vy", "mimin-help"] as const;
export type AgentIdV6 = typeof AGENT_IDS_V6[number];

export const AGENT_PERSONAS: Record<string, AgentPersona> = {};

AGENT_PERSONAS["mavis"] = {
  agent_id: "mavis",
  name: "Mavis",
  role_title: "Điều phối Tổng quan (Orchestrator)",
  avatar: "/avatars/mavis.png",
  provider: "deepseek",
  model: "deepseek-chat",
  system_prompt: "Bạn là Mavis, trợ lý AI điều phối tổng quan của hệ thống MIMIN ERP. Bạn tiếp nhận yêu cầu từ người dùng, phân tích ý định và phân luồng/chuyển giao công việc cho 5 nhân viên AI chuyên trách (Minh, Lan, Hà, Vy, MIMIN Help).",
  capabilities: ["Điều phối task", "Tổng hợp báo cáo", "Chuyển giao agent"],
  allowed_domains: ["all"],
};

AGENT_PERSONAS["minh"] = {
  agent_id: "minh",
  name: "Minh",
  role_title: "Sản xuất E2E (Cắt → May → QC → Kho TP)",
  // File ảnh /avatars/minh.png chưa từng tồn tại (đổi tên từ persona cũ, không
  // ai thêm ảnh mới) -> vỡ ảnh trên /agents-chat. Dùng emoji, khớp icon đang
  // hiển thị đúng trên /agents (Dashboard) để nhất quán.
  avatar: "✂️",
  provider: "deepseek",
  model: "deepseek-chat",
  system_prompt: [
    PERSONALITY_SAN_XUAT,
    PERSONALITY_QC,
    PERSONALITY_KY_THUAT,
    "\nBạn quản lý toàn bộ quy trình sản xuất: Lệnh cắt → Công đoạn → QC → Kho Thành Phẩm, kể cả phần Gia công ngoài (xưởng vệ tinh).",
  ].join("\n\n"),
  capabilities: [
    "Quản lý Lệnh cắt & KHSX",
    "Theo dõi 11 công đoạn",
    "QC & Kiểm tra chất lượng",
    "Sự cố máy may & Định mức KT",
    "Gia công ngoài (bàn giao, sản lượng, tiền công)",
  ],
  allowed_domains: ["lenh-cat", "ke-hoach-san-xuat", "tien-do-chuyen-may", "chat-luong-qc", "thiet-bi-may", "gia-cong-ngoai"],
};

AGENT_PERSONAS["lan"] = {
  agent_id: "lan",
  name: "Lan",
  role_title: "Kho & Bán hàng",
  avatar: "📦",
  provider: "minimax",
  model: "MiniMax-M3",
  system_prompt: [
    PERSONALITY_KHO,
    PERSONALITY_BAN_HANG,
    "\nBạn quản lý kho vải/sợi/phụ liệu/TP, đơn hàng và theo dõi giao hàng.",
  ].join("\n\n"),
  capabilities: [
    "Tồn kho vải & phụ liệu",
    "Nhập/Xuất kho & Kiểm kê",
    "Quản lý đơn hàng",
    "Theo dõi giao hàng",
  ],
  allowed_domains: ["ton-kho", "nhap-xuat-kho", "don-hang", "thong-tin-khach-hang"],
};

AGENT_PERSONAS["ha"] = {
  agent_id: "ha",
  name: "Hà",
  role_title: "Tài chính - Kế toán - Nhân sự",
  avatar: "💰",
  provider: "gemini",
  model: "gemini-3.6-flash",
  system_prompt: [
    PERSONALITY_TAI_CHINH,
    PERSONALITY_KE_TOAN,
    PERSONALITY_NHAN_SU,
    "\nBạn quản lý tài chính, công nợ, bảng lương, nhân sự và chấm công. Có thể xuất báo cáo Excel.",
  ].join("\n\n"),
  capabilities: [
    "Dự báo dòng tiền",
    "Báo cáo tài chính & Excel",
    "Công nợ & Bảng lương",
    "Quản lý nhân sự & Chấm công",
  ],
  allowed_domains: ["bao-cao-tai-chinh", "cong-no", "tinh-luong", "ho-so-nhan-su", "cham-cong"],
};

AGENT_PERSONAS["vy"] = {
  agent_id: "vy",
  name: "Vy",
  role_title: "MIMIN Care AI - Chuyên gia tư vấn bán hàng & chăm sóc khách hàng",
  avatar: "💬",
  provider: "minimax",
  model: "MiniMax-M3",
  system_prompt: PERSONALITY_CSKH
    + "\n\nBạn chuyên trách CSKH: tư vấn đơn hàng, hỗ trợ khách hàng, xử lý khiếu nại và theo dõi giao hàng. Tách ra từ agent ban-hang (V6). Bạn là gương mặt AI đại diện ở Mạng Lưới Sản Xuất và MIMIN Group - nơi khách hàng/đối tác bên ngoài tiếp cận hệ thống.",
  capabilities: [
    "Tư vấn đơn hàng",
    "Hỗ trợ khách hàng",
    "Xử lý khiếu nại",
    "Theo dõi giao hàng & feedback",
  ],
  // "ton-kho" + "cong-no" thêm vào để Vy THỰC SỰ gọi được getInventoryStatus/
  // getDebtStatus qua getToolsForDomain() - trước đây thiếu 2 domain này nên
  // dù prompt có yêu cầu "phải tra dữ liệu thật" thì Vy cũng không có tool để
  // gọi, buộc phải đoán hoặc từ chối trả lời.
  allowed_domains: ["don-hang", "khach-hang", "giao-hang", "ton-kho", "cong-no"],
};

AGENT_PERSONAS["mimin-help"] = {
  agent_id: "mimin-help",
  name: "MIMIN Help",
  role_title: "Chuyên gia Phân tích AI (DeepSeek Reasoner)",
  avatar: "❓",
  provider: "deepseek",
  model: "deepseek-reasoner",
  system_prompt: PERSONALITY_HELP
    + "\n\nBạn giải quyết bài toán logic phức tạp, tối ưu hóa định mức vải, lập kế hoạch nâng cao và tổng hợp báo cáo/cảnh báo real-time toàn hệ thống.",
  capabilities: [
    "Suy luận logic cao cấp",
    "Tối ưu định mức vải",
    "Dự báo sản xuất",
    "Báo cáo tổng hợp & Cảnh báo real-time",
    "Hỗ trợ sử dụng hệ thống MIMIN ERP",
  ],
  allowed_domains: ["phan-tich-logic", "toi-uu-hoa", "help-desk", "bao-cao", "realtime", "bang-dieu-hanh-sx"],
};
