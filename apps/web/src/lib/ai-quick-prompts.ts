// ============================================
// MIMIN ERP - AI Quick Prompts theo Context
// Hiển thị câu hỏi gợi ý thông minh theo trang đang xem
// ============================================

export type QuickContext =
  | "kho"           // Trang kho
  | "san-xuat"      // Lệnh cắt, KHSX
  | "gia-cong"      // Công việc gia công
  | "nhan-su"       // Nhân sự, chấm công
  | "ke-toan"       // Công nợ, lương
  | "ban-hang"      // Khách hàng, đơn hàng
  | "qc"            // Kiểm tra chất lượng
  | "tai-chinh"     // Báo cáo tài chính
  | "general";      // Chung

export interface QuickPrompt {
  icon: string;          // emoji
  label: string;         // text ngắn hiển thị
  query: string;         // câu hỏi đầy đủ
}

const QUICK_PROMPTS_BY_CONTEXT: Record<QuickContext, QuickPrompt[]> = {
  // ============ KHO ============
  kho: [
    { icon: "📦", label: "Tồn kho?", query: "Tồn kho vải và phụ liệu hiện tại thế nào?" },
    { icon: "📥", label: "Phiếu nhập", query: "Tuần này có bao nhiêu phiếu nhập kho?" },
    { icon: "⚠️", label: "Sắp hết", query: "Những mặt hàng nào sắp hết cần nhập gấp?" },
    { icon: "🔍", label: "Kiểm kê", query: "Lịch kiểm kê gần nhất là khi nào?" },
  ],

  // ============ SẢN XUẤT ============
  "san-xuat": [
    { icon: "✂️", label: "Lệnh cắt", query: "Có bao nhiêu lệnh cắt đang chờ xử lý?" },
    { icon: "📋", label: "KHSX", query: "Kế hoạch sản xuất tuần này có gì?" },
    { icon: "⏱️", label: "Tiến độ", query: "Tiến độ các lệnh cắt đang chạy thế nào?" },
    { icon: "🚨", label: "Trễ hạn", query: "Lệnh nào sắp trễ hạn cần xử lý?" },
  ],

  // ============ GIA CÔNG ============
  "gia-cong": [
    { icon: "🪡", label: "Công việc", query: "Có bao nhiêu công việc gia công hôm nay?" },
    { icon: "📦", label: "Bàn giao", query: "Danh sách phiếu bàn giao tuần này?" },
    { icon: "💰", label: "Tiền công", query: "Tổng tiền công tháng này của thợ may?" },
    { icon: "📊", label: "KPI của tôi", query: "KPI gia công tuần này của tôi thế nào?" },
  ],

  // ============ NHÂN SỰ ============
  "nhan-su": [
    { icon: "👥", label: "Danh sách NV", query: "Công ty hiện có bao nhiêu nhân viên?" },
    { icon: "📅", label: "Chấm công", query: "Hôm nay ai đi muộn hoặc vắng?" },
    { icon: "💸", label: "Bảng lương", query: "Lương tháng này của nhân viên như thế nào?" },
    { icon: "📝", label: "Phân quyền", query: "Tài khoản nào chưa được phân quyền?" },
  ],

  // ============ KẾ TOÁN ============
  "ke-toan": [
    { icon: "💰", label: "Công nợ", query: "Tổng công nợ phải thu và phải trả hiện tại?" },
    { icon: "📊", label: "Đối soát", query: "Đối soát sản lượng với tiền công tháng này?" },
    { icon: "📈", label: "Doanh thu", query: "Doanh thu tháng này đến đâu?" },
    { icon: "⏰", label: "Quá hạn", query: "Khách hàng nào đang quá hạn thanh toán?" },
  ],

  // ============ BÁN HÀNG ============
  "ban-hang": [
    { icon: "🛒", label: "Đơn mới", query: "Hôm nay có bao nhiêu đơn hàng mới?" },
    { icon: "📞", label: "KH nợ", query: "Khách hàng nào đang nợ tiền?" },
    { icon: "🚚", label: "Giao hàng", query: "Đơn hàng nào cần giao hôm nay?" },
    { icon: "📦", label: "Tồn kho KH", query: "Khách hàng nào đặt nhiều nhất?" },
  ],

  // ============ QC ============
  qc: [
    { icon: "🔍", label: "Lỗi hôm nay", query: "Hôm nay có bao nhiêu lỗi QC được báo cáo?" },
    { icon: "📊", label: "Tỷ lệ đạt", query: "Tỷ lệ hàng đạt chất lượng tuần này?" },
    { icon: "🏭", label: "Theo công đoạn", query: "Công đoạn nào đang có nhiều lỗi nhất?" },
    { icon: "🔄", label: "Bàn giao", query: "Phiếu bàn giao nào đang chờ QC?" },
  ],

  // ============ TÀI CHÍNH ============
  "tai-chinh": [
    { icon: "📈", label: "Doanh thu", query: "Doanh thu quý này thế nào?" },
    { icon: "💵", label: "Dòng tiền", query: "Dòng tiền dự kiến 3 tháng tới?" },
    { icon: "📊", label: "Chi phí SX", query: "Chi phí sản xuất chiếm bao nhiêu % doanh thu?" },
    { icon: "📋", label: "Excel BC", query: "Xuất báo cáo tài chính quý này ra Excel" },
  ],

  // ============ CHUNG (fallback) ============
  general: [
    { icon: "📦", label: "Tồn kho?", query: "Tồn kho hiện tại thế nào?" },
    { icon: "✂️", label: "Lệnh cắt", query: "Có bao nhiêu lệnh cắt đang chạy?" },
    { icon: "💰", label: "Công nợ", query: "Tổng công nợ hiện tại?" },
    { icon: "👥", label: "Nhân sự", query: "Công ty có bao nhiêu nhân viên?" },
  ],
};

// ============================================
// CONTEXT DETECTION
// ============================================

const PATHNAME_PATTERNS: Array<{ pattern: RegExp | string; context: QuickContext }> = [
  // KHO
  { pattern: /\/kho-vai/, context: "kho" },
  { pattern: /\/kho-phu-lieu/, context: "kho" },
  { pattern: /\/kho-thanh-pham/, context: "kho" },
  { pattern: /\/kho-mobile/, context: "kho" },
  { pattern: /\/trang-chu-kho/, context: "kho" },
  { pattern: /\/nhap-kho-mobile/, context: "kho" },
  { pattern: /\/xuat-kho-mobile/, context: "kho" },
  { pattern: /\/kiem-ke/, context: "kho" },

  // SẢN XUẤT
  { pattern: /\/lenh-cat/, context: "san-xuat" },
  { pattern: /\/ke-hoach-san-xuat/, context: "san-xuat" },
  { pattern: /\/lsx/, context: "san-xuat" },
  { pattern: /\/khsx/, context: "san-xuat" },
  { pattern: /\/bang-dieu-hanh/, context: "san-xuat" },

  // GIA CÔNG
  { pattern: /\/trang-chu-gia-cong/, context: "gia-cong" },
  { pattern: /\/gia-cong-ngoai/, context: "gia-cong" },
  { pattern: /\/cong-viec/, context: "gia-cong" },
  { pattern: /\/ban-giao/, context: "gia-cong" },
  { pattern: /\/tien-cong/, context: "gia-cong" },
  { pattern: /\/doi-soat-tien-cong/, context: "gia-cong" },
  { pattern: /\/trang-chu-kho-soi-day-chuyen/, context: "gia-cong" },

  // NHÂN SỰ
  { pattern: /\/nhan-su/, context: "nhan-su" },
  { pattern: /\/profile/, context: "nhan-su" },
  { pattern: /\/cham-cong/, context: "nhan-su" },
  { pattern: /\/phan-quyen-cua-toi/, context: "nhan-su" },
  { pattern: /\/phan-quyen-tuy-chinh/, context: "nhan-su" },
  { pattern: /\/quan-ly-tai-khoan/, context: "nhan-su" },

  // KẾ TOÁN
  { pattern: /\/cong-no/, context: "ke-toan" },
  { pattern: /\/bang-luong/, context: "ke-toan" },
  { pattern: /\/doi-soat/, context: "ke-toan" },

  // BÁN HÀNG
  { pattern: /\/khach-hang/, context: "ban-hang" },
  { pattern: /\/don-hang/, context: "ban-hang" },
  { pattern: /\/giao-hang/, context: "ban-hang" },
  { pattern: /\/nha-cung-cap/, context: "ban-hang" },

  // QC
  { pattern: /\/qc/, context: "qc" },
  { pattern: /\/kiem-tra/, context: "qc" },
  { pattern: /\/chat-luong/, context: "qc" },

  // TÀI CHÍNH
  { pattern: /\/bao-cao/, context: "tai-chinh" },
  { pattern: /\/tai-chinh/, context: "tai-chinh" },
  { pattern: /\/dashboard/, context: "tai-chinh" },
  { pattern: /\/realtime/, context: "tai-chinh" },
];

/**
 * Detect context từ URL pathname
 */
export function detectContext(pathname: string | null | undefined): QuickContext {
  if (!pathname) return "general";
  for (const { pattern, context } of PATHNAME_PATTERNS) {
    if (typeof pattern === "string") {
      if (pathname.includes(pattern)) return context;
    } else {
      if (pattern.test(pathname)) return context;
    }
  }
  return "general";
}

/**
 * Lấy quick prompts theo context
 */
export function getQuickPrompts(pathname: string | null | undefined): QuickPrompt[] {
  const context = detectContext(pathname);
  return QUICK_PROMPTS_BY_CONTEXT[context];
}

/**
 * Lấy label của context (cho badge UI)
 */
export function getContextLabel(context: QuickContext): string {
  const labels: Record<QuickContext, string> = {
    kho: "📦 Kho",
    "san-xuat": "✂️ Sản xuất",
    "gia-cong": "🪡 Gia công",
    "nhan-su": "👥 Nhân sự",
    "ke-toan": "💰 Kế toán",
    "ban-hang": "🛒 Bán hàng",
    qc: "🔍 QC",
    "tai-chinh": "📊 Tài chính",
    general: "Tổng hợp",
  };
  return labels[context];
}
