// ============================================
// MIMIN ERP - Admin Requirements Checklist
// Spec do sep Sang viet (2026-08-03) - Kiem tra man Tao lenh cat
// Phan 1: Bo yeu cau chuan
// Phan 2: 4 lop kiem tra (UI / Xu ly / API / Database)
// Phan 3: Cac cong thuc tinh toan bat buoc
// ============================================

// ============================================
// A. THONG TIN CHUNG VA KE HOACH
// ============================================
export const REQUIREMENTS_GENERAL = [
  { id: "loai-ke-hoach", label: "Loại kế hoạch (Hàng Nhà / Hàng Đặt)", required: true, type: "select" },
  { id: "id-lenh-cat", label: "ID lệnh cắt (LC-2026-XXXX, tự sinh, không trùng, không sửa khi đã tạo)", required: true, type: "auto" },
  { id: "ngay-bat-dau", label: "Ngày dự kiến bắt đầu", required: true, type: "date" },
  { id: "han-hoan-thanh", label: "Hạn hoàn thành", required: true, type: "date" },
  { id: "ngay-hoan-thanh-thuc-te", label: "Ngày hoàn thành thực tế (tự ghi khi Hoàn thành, không nhập khi tạo)", required: false, type: "auto" },
  { id: "loai-sp", label: "Loại sản phẩm (VD: Bộ Trụ)", required: true, type: "select" },
  { id: "tong-sl", label: "Tổng số lượng cắt dự kiến (> 0)", required: true, type: "number", validation: "> 0" },
  { id: "ma-sp", label: "Mã sản phẩm (chọn từ danh mục, không nhập tự do)", required: true, type: "select" },
  { id: "ten-sp", label: "Tên sản phẩm (tự lấy theo mã SP)", required: true, type: "auto" },
  { id: "ti-le-size", label: "Tỷ lệ size (VD: 1:2:2:1)", required: true, type: "select" },
  { id: "ghi-chu", label: "Ghi chú sản xuất", required: false, type: "text" },
  { id: "nguoi-pt-sx", label: "Người phụ trách sản xuất (chọn từ danh sách NV)", required: true, type: "select" },
  { id: "sdt", label: "Số điện thoại (tự lấy từ hồ sơ NV)", required: false, type: "auto" },
  { id: "trang-thai", label: "Trạng thái lệnh (12 loại: Nháp / Chờ duyệt / Đã duyệt / Chờ nguyên liệu / Đang chuẩn bị / Đang cắt / Chờ kiểm tra / Hoàn thành / Tạm dừng / Cần xử lý / Đã hủy)", required: true, type: "select" },
];

// Quy tắc Hàng Nhà / Hàng Đặt
export const RULES_HANG_NHA_DAT = {
  "hang-nha": {
    required: {
      khachHang: false,
      khoThanhPham: true, // Phải xác định kho nhập TP hoặc KH tồn kho
    },
  },
  "hang-dat": {
    required: {
      khachHang: true, // Bắt buộc chọn KH
      donHang: true, // Bắt buộc liên kết đơn hàng
      hanGiaoKH: true, // Bắt buộc có hạn giao KH
    },
    constraint: "Số lượng lệnh cắt KHÔNG được vượt quá SL đơn hàng nếu chưa duyệt",
  },
};

// ============================================
// B. MAU SAC, VAI VA CHIA SIZE
// ============================================
export const REQUIREMENTS_COLOR = [
  { id: "so-mau", label: "Số màu cần cắt (mặc định: 4)", required: true, type: "number" },
  { id: "thu-tu-mau", label: "Thứ tự màu", required: true, type: "number" },
  { id: "ten-mau", label: "Tên màu", required: true, type: "text" },
  { id: "ma-mau", label: "Mã màu", required: true, type: "text" },
  { id: "hinh-anh", label: "Hình ảnh màu hoặc sản phẩm", required: false, type: "image" },
  { id: "tai-anh", label: "Nút tải ảnh", required: true, type: "button" },
  { id: "tao-mockup-ai", label: "Nút tạo mockup bằng AI (MiniMax image-01)", required: false, type: "button" },
  { id: "ma-sku", label: "Mã SKU biến thể", required: true, type: "text" },
  { id: "kho-vai", label: "Kho vải chính", required: true, type: "select" },
  { id: "ma-vai", label: "Mã vải", required: true, type: "select" },
  { id: "lo-vai", label: "Lô vải", required: false, type: "text" },
  { id: "ton-kha-dung", label: "Tồn khả dụng", required: true, type: "auto" },
  { id: "dinh-muc", label: "Định mức kg/sản phẩm", required: true, type: "number" },
  { id: "sl-du-kien", label: "Số lượng dự kiến cắt của màu", required: true, type: "number" },
  { id: "bang-bung-size", label: "Bảng bung size theo tỷ lệ", required: true, type: "matrix" },
  { id: "tong-kg-vai", label: "Tổng kg vải dự kiến", required: true, type: "auto" },
  { id: "gia-vai-kg", label: "Giá vải/kg", required: true, type: "number" },
  { id: "gia-vai-sp", label: "Giá vải trên một sản phẩm", required: true, type: "auto" },
  { id: "tong-tien-vai", label: "Tổng tiền vải của màu", required: true, type: "auto" },
  { id: "trang-thai-vai", label: "Trạng thái đủ/thiếu vải", required: true, type: "auto" },
];

// Công thức bắt buộc
export const FORMULAS_SIZE = `
- Tổng hệ số size = Tổng các hệ số trong tỷ lệ size
- Số lượng size cơ bản = Số lượng của màu ÷ Tổng hệ số size
- Vải cần dùng = Số lượng dự kiến của màu × Định mức kg/sản phẩm
- Giá vải/SP = Định mức kg/sản phẩm × Giá vải/kg
- Tổng tiền vải màu = Tổng kg vải cần dùng × Giá vải/kg
`;

// Kiểm tra tổng
export const CHECKS_TOTAL = [
  "Tổng số lượng tất cả màu = Tổng số lượng cắt dự kiến",
  "Tổng số lượng các size của một màu = Số lượng dự kiến của màu đó",
  "Tổng ma trận màu × size = Tổng số lượng cắt dự kiến",
  "Nếu KHÔNG khớp → đánh dấu lỗi + KHÔNG cho duyệt lệnh",
];

// Quy tắc chia số dư
export const RULES_REMAINDER = `
Tỷ lệ 1:2:2:1, tổng hệ số là 6.
Một màu có 125 SP: 125 ÷ 6 = 20 bộ tỷ lệ, dư 5 SP.
Hệ thống phải:
- Có quy tắc phân bổ số dư
- Hiển thị kết quả sau khi làm tròn
- Đảm bảo tổng cuối cùng vẫn là 125
- KHÔNG tự âm thầm bỏ 5 SP dư
`;

// ============================================
// C. NGUYEN PHU LIEU TU KHO VAT TU
// ============================================
export const REQUIREMENTS_MATERIAL = [
  { id: "them-phu-lieu", label: "Nút Thêm phụ liệu (phải hoạt động)", required: true, type: "button" },
  { id: "nhom-phu-lieu", label: "Nhóm phụ liệu", required: true, type: "select" },
  { id: "ma-vat-tu", label: "Mã vật tư", required: true, type: "select" },
  { id: "ten-vat-tu", label: "Tên vật tư", required: true, type: "text" },
  { id: "mau", label: "Màu", required: false, type: "text" },
  { id: "kho-vat-tu", label: "Kho vật tư", required: true, type: "select" },
  { id: "don-vi", label: "Đơn vị tính", required: true, type: "select" },
  { id: "dinh-muc-pl", label: "Định mức trên một sản phẩm", required: true, type: "number" },
  { id: "sl-can-dung", label: "Số lượng cần dùng", required: true, type: "auto" },
  { id: "ton-kha-dung-pl", label: "Tồn khả dụng", required: true, type: "auto" },
  { id: "gia-von-pl", label: "Giá vốn", required: true, type: "number" },
  { id: "thanh-tien-pl", label: "Thành tiền", required: true, type: "auto" },
  { id: "trang-thai-pl", label: "Trạng thái đủ/thiếu", required: true, type: "auto" },
];

// Phụ liệu cho Bộ Trụ
export const REQUIRED_MATERIALS_BO_TRU = [
  "Bo cổ",
  "Bo tay",
  "Nút",
  "Chỉ",
  "Lưng thun",
  "Dây rút",
  "Tem",
  "Nhãn mác",
  "Túi PE",
  "Bao bì",
];

// ============================================
// D. MAU CONG DOAN VA CHI PHI
// ============================================
export const REQUIREMENTS_PROCESS = [
  { id: "ten-mau-cd", label: "Tên mẫu công đoạn", required: true, type: "text" },
  { id: "chon-mau", label: "Nút chọn mẫu", required: true, type: "button" },
  { id: "tao-mau-moi", label: "Nút tạo mẫu mới", required: true, type: "button" },
  { id: "ds-cong-doan", label: "Danh sách công đoạn", required: true, type: "list" },
  { id: "loai-nguoi", label: "Loại người thực hiện (NV / GC)", required: true, type: "select" },
  { id: "nguoi-phu-trach", label: "Người/xưởng phụ trách", required: true, type: "select" },
  { id: "don-gia", label: "Đơn giá", required: true, type: "number" },
  { id: "thu-tu", label: "Thứ tự thực hiện", required: true, type: "number" },
];

// Mẫu chuẩn 6 công đoạn
export const STANDARD_PROCESS_TEMPLATE = [
  { name: "Cắt", type: "NV", donGia: 2300 },
  { name: "May áo", type: "GC", donGia: 12000 },
  { name: "May quần", type: "GC", donGia: 15000 },
  { name: "In", type: "GC", donGia: 3000 },
  { name: "Ủi", type: "NV", donGia: 2000 },
  { name: "Đóng gói", type: "NV", donGia: 2500 },
];

// Tổng gia công chuẩn
export const TOTAL_GIA_CONG_STANDARD = 36800; // 2300 + 12000 + 15000 + 3000 + 2000 + 2500

// Kiểm tra mẫu theo loại SP
export const CHECKS_MAU_THEO_LOAI = `
Nếu loại SP là Bộ Trụ nhưng mẫu chọn là Bộ Thể Thao, Agent phải:
- Kiểm tra mẫu Bộ Thể Thao có được phép áp dụng cho Bộ Trụ không
- So sánh danh sách công đoạn
- Kiểm tra có thiếu công đoạn khuy/nút không
- Kiểm tra đơn giá có đúng bảng giá Bộ Trụ không
- Cảnh báo trước khi cho duyệt lệnh
- KHÔNG được tự xem hai loại SP là giống nhau
`;

// ============================================
// E. CHI PHI CO DINH
// ============================================
export const STANDARD_FIXED_COSTS = [
  { name: "Bao bì, túi PE", donGia: 2500 },
  { name: "Tem, nhãn mác", donGia: 1000 },
  { name: "Khấu hao máy, điện nước", donGia: 3500 },
];

export const TOTAL_FIXED_COST_STANDARD = 7000; // 2500 + 1000 + 3500

export const CHECKS_BANG_GIA = [
  "Tên bảng giá",
  "Loại sản phẩm áp dụng",
  "Ngày hiệu lực",
  "Phiên bản bảng giá",
  "Người duyệt",
  "User có quyền chỉnh đơn giá hay không",
];

// ============================================
// F. TONG COGS
// ============================================
export const FORMULA_COGS = `
COGS dự kiến/SP =
Giá vải/SP
+ Nguyên phụ liệu/SP
+ Gia công/SP
+ Chi phí cố định/SP
`;

export const CHECKS_COGS = `
COGS tạm tính (chưa có vải + NPL):
- 0 + 0 + 36.800 + 7.000 = 43.800đ/SP
- Chỉ là tổng tạm tính
- Chưa phải COGS đầy đủ vì chưa chọn vải
- Chưa có giá nguyên phụ liệu
- Hệ thống phải hiển thị: "COGS tạm tính: 43.800đ/SP - Chưa bao gồm vải và NPL"
- KHÔNG được trình bày là giá vốn hoàn chỉnh
`;

// ============================================
// FORMAT BAO CAO (9 HANG MUC x 4 COT)
// ============================================
export const REPORT_FORMAT = `
| Hạng mục Admin yêu cầu | UI | Công thức | API | Database | Kết luận |
|-------------------------|-----|-----------|-----|-----------|----------|
| Loại Hàng Nhà/Hàng Đặt | ✅/🔴 | — | ✅/🔴 | ✅/🔴 | Kết quả |
| ID lệnh cắt | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Tổng số lượng | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Chia màu × size | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Vải và định mức | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Phụ liệu | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Công đoạn | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| Chi phí cố định | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
| COGS | ✅/🔴 | ✅/🔴 | ✅/🔴 | ✅/🔴 | Kết quả |
`;

export const STATUS_ICONS = {
  complete: "✅", // Hoàn chỉnh
  partial: "🟡", // Đang làm
  uiOnly: "🧱", // Chỉ có UI
  apiOnly: "🔌", // Chỉ có backend
  mockData: "🧪", // Dữ liệu giả
  hasError: "⚠️", // Có lỗi
  notDone: "🔴", // Chưa làm
  noPermission: "🔒", // Chưa đủ quyền
  unverified: "❓", // Chưa kiểm chứng
};
