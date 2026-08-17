// ============ BẢNG MÀU CHO KHỐI (Ô) TRÊN SƠ ĐỒ ============
// Dùng chung giữa thanh công cụ (nút chọn màu) và component vẽ khối, để 2 nơi
// không bị lệch màu nhau.
export type MauKhoi = "teal" | "xanh" | "tim" | "hong" | "cam" | "vang" | "do" | "xam";

export const MAU_KHOI: Record<MauKhoi, { ten: string; khoi: string; cham: string }> = {
  teal: { ten: "Xanh ngọc", khoi: "bg-teal-500 text-white border-teal-600", cham: "bg-teal-500" },
  xanh: { ten: "Xanh dương", khoi: "bg-blue-500 text-white border-blue-600", cham: "bg-blue-500" },
  tim: { ten: "Tím", khoi: "bg-violet-500 text-white border-violet-600", cham: "bg-violet-500" },
  hong: { ten: "Hồng", khoi: "bg-pink-500 text-white border-pink-600", cham: "bg-pink-500" },
  cam: { ten: "Cam", khoi: "bg-orange-500 text-white border-orange-600", cham: "bg-orange-500" },
  vang: { ten: "Vàng", khoi: "bg-amber-400 text-amber-950 border-amber-500", cham: "bg-amber-400" },
  do: { ten: "Đỏ", khoi: "bg-rose-500 text-white border-rose-600", cham: "bg-rose-500" },
  xam: { ten: "Trắng xám", khoi: "bg-white text-slate-800 border-slate-300", cham: "bg-slate-200 ring-1 ring-slate-300" },
};

export const DS_MAU_KHOI = Object.keys(MAU_KHOI) as MauKhoi[];

export type MindMapProject = {
  id: string;
  name: string;
  updatedAt: string;
  nodes: any[];
  edges: any[];
};

export const MOCK_PROJECTS: MindMapProject[] = [
  {
    id: "SD-001",
    name: "Kế hoạch ra mắt áo Polo mới",
    updatedAt: "2026-08-16T10:00:00Z",
    nodes: [
      { id: "1", position: { x: 400, y: 100 }, data: { label: "Ra mắt áo Polo Thu Đông", type: "title" }, type: "miminNode" },
      { id: "2", position: { x: 200, y: 250 }, data: { label: "Sản xuất (5000 cái)", type: "normal" }, type: "miminNode" },
      { id: "3", position: { x: 600, y: 250 }, data: { label: "Marketing", type: "normal" }, type: "miminNode" },
      { id: "4", position: { x: 100, y: 400 }, data: { label: "Mua vải", type: "sub" }, type: "miminNode" },
      { id: "5", position: { x: 300, y: 400 }, data: { label: "Cắt may", type: "sub" }, type: "miminNode" },
      { id: "6", position: { x: 500, y: 400 }, data: { label: "Facebook Ads", type: "sub" }, type: "miminNode" },
      { id: "7", position: { x: 700, y: 400 }, data: { label: "Mẫu áo", type: "image", imageSrc: "https://polomimin.vn/wp-content/uploads/2023/10/ao-polo-mimin-768x768.png" }, type: "miminImageNode" },
    ],
    edges: [
      { id: "e1-2", source: "1", target: "2", animated: true },
      { id: "e1-3", source: "1", target: "3", animated: true },
      { id: "e2-4", source: "2", target: "4" },
      { id: "e2-5", source: "2", target: "5" },
      { id: "e3-6", source: "3", target: "6" },
      { id: "e3-7", source: "3", target: "7", style: { strokeDasharray: "5 5" } },
    ],
  },
  {
    id: "LUONG-BANHANG-001",
    name: "Luồng Bán Hàng",
    updatedAt: "2026-08-16T11:00:00Z",
    nodes: [
      // Tiêu đề
      { id: "bh-title", position: { x: 500, y: 50 }, data: { label: "Luồng Bán Hàng", type: "title", color: "xanh" }, type: "miminNode" },
      
      // Giai đoạn 1: Tiếp nhận
      { id: "bh-1-1", position: { x: 150, y: 180 }, data: { label: "Quản lý khách hàng", type: "normal", color: "xanh" }, type: "miminNode" },
      { id: "bh-1-2", position: { x: 350, y: 180 }, data: { label: "Tạo đơn hàng", type: "normal", color: "xanh" }, type: "miminNode" },
      { id: "bh-1-3", position: { x: 550, y: 180 }, data: { label: "Xác nhận đơn", type: "normal", color: "xanh" }, type: "miminNode" },
      
      // Giai đoạn 2: Thanh toán
      { id: "bh-2-1", position: { x: 150, y: 320 }, data: { label: "Kiểm tra kho", type: "normal", color: "cam" }, type: "miminNode" },
      { id: "bh-2-2", position: { x: 350, y: 320 }, data: { label: "Yêu cầu thanh toán", type: "normal", color: "cam" }, type: "miminNode" },
      { id: "bh-2-3", position: { x: 550, y: 320 }, data: { label: "Xác nhận thanh toán", type: "normal", color: "cam" }, type: "miminNode" },
      
      // Giai đoạn 3: Giao hàng
      { id: "bh-3-1", position: { x: 150, y: 460 }, data: { label: "Chuẩn bị hàng", type: "normal", color: "do" }, type: "miminNode" },
      { id: "bh-3-2", position: { x: 350, y: 460 }, data: { label: "Đóng gói", type: "normal", color: "do" }, type: "miminNode" },
      { id: "bh-3-3", position: { x: 550, y: 460 }, data: { label: "Giao hàng", type: "normal", color: "do" }, type: "miminNode" },
      
      // Giai đoạn 4: Hoàn tất
      { id: "bh-4-1", position: { x: 350, y: 600 }, data: { label: "Khách nhận hàng", type: "normal", color: "teal" }, type: "miminNode" },
    ],
    edges: [
      // Luồng Tiếp nhận
      { id: "bh-e1", source: "bh-title", target: "bh-1-1", animated: true },
      { id: "bh-e2", source: "bh-1-1", target: "bh-1-2" },
      { id: "bh-e3", source: "bh-1-2", target: "bh-1-3" },
      
      // Luồng Thanh toán
      { id: "bh-e4", source: "bh-1-3", target: "bh-2-1" },
      { id: "bh-e5", source: "bh-2-1", target: "bh-2-2" },
      { id: "bh-e6", source: "bh-2-2", target: "bh-2-3" },
      
      // Luồng Giao hàng
      { id: "bh-e7", source: "bh-2-3", target: "bh-3-1" },
      { id: "bh-e8", source: "bh-3-1", target: "bh-3-2" },
      { id: "bh-e9", source: "bh-3-2", target: "bh-3-3" },
      
      // Hoàn tất
      { id: "bh-e10", source: "bh-3-3", target: "bh-4-1" },
    ],
  },
  {
    id: "LUONG-SANXUAT-001",
    name: "Luồng Sản Xuất",
    updatedAt: "2026-08-16T11:05:00Z",
    nodes: [
      // Tiêu đề
      { id: "sx-title", position: { x: 600, y: 50 }, data: { label: "Luồng Sản Xuất", type: "title", color: "tim" }, type: "miminNode" },
      
      // Giai đoạn 1: Chuẩn bị
      { id: "sx-1-1", position: { x: 100, y: 180 }, data: { label: "Kế hoạch sản xuất", type: "normal", color: "tim" }, type: "miminNode" },
      { id: "sx-1-2", position: { x: 300, y: 180 }, data: { label: "Kiểm kho vải", type: "normal", color: "tim" }, type: "miminNode" },
      { id: "sx-1-3", position: { x: 500, y: 180 }, data: { label: "Chuẩn bị vật tư", type: "normal", color: "tim" }, type: "miminNode" },
      
      // Giai đoạn 2: Cắt
      { id: "sx-2-1", position: { x: 100, y: 320 }, data: { label: "Cắt vải", type: "normal", color: "hong" }, type: "miminNode" },
      { id: "sx-2-2", position: { x: 300, y: 320 }, data: { label: "Kiểm kho cắt", type: "normal", color: "hong" }, type: "miminNode" },
      
      // Giai đoạn 3: May
      { id: "sx-3-1", position: { x: 100, y: 460 }, data: { label: "May áo", type: "normal", color: "vang" }, type: "miminNode" },
      { id: "sx-3-2", position: { x: 300, y: 460 }, data: { label: "May quần", type: "normal", color: "vang" }, type: "miminNode" },
      { id: "sx-3-3", position: { x: 500, y: 460 }, data: { label: "Hoàn thiện", type: "normal", color: "vang" }, type: "miminNode" },
      
      // Giai đoạn 4: Kiểm chất lượng
      { id: "sx-4-1", position: { x: 100, y: 600 }, data: { label: "QC chất lượng", type: "normal", color: "xanh" }, type: "miminNode" },
      { id: "sx-4-2", position: { x: 300, y: 600 }, data: { label: "Sửa chữa (nếu cần)", type: "normal", color: "xanh" }, type: "miminNode" },
      
      // Giai đoạn 5: Hoàn tất
      { id: "sx-5-1", position: { x: 100, y: 740 }, data: { label: "Ủi hàng", type: "normal", color: "do" }, type: "miminNode" },
      { id: "sx-5-2", position: { x: 300, y: 740 }, data: { label: "Đóng gói", type: "normal", color: "do" }, type: "miminNode" },
      { id: "sx-5-3", position: { x: 500, y: 740 }, data: { label: "Lưu kho thành phẩm", type: "normal", color: "do" }, type: "miminNode" },
    ],
    edges: [
      // Chuẩn bị
      { id: "sx-e1", source: "sx-title", target: "sx-1-1", animated: true },
      { id: "sx-e2", source: "sx-1-1", target: "sx-1-2" },
      { id: "sx-e3", source: "sx-1-2", target: "sx-1-3" },
      
      // Cắt
      { id: "sx-e4", source: "sx-1-3", target: "sx-2-1" },
      { id: "sx-e5", source: "sx-2-1", target: "sx-2-2" },
      
      // May
      { id: "sx-e6", source: "sx-2-2", target: "sx-3-1" },
      { id: "sx-e7", source: "sx-2-2", target: "sx-3-2" },
      { id: "sx-e8", source: "sx-3-1", target: "sx-3-3" },
      { id: "sx-e9", source: "sx-3-2", target: "sx-3-3" },
      
      // QC
      { id: "sx-e10", source: "sx-3-3", target: "sx-4-1" },
      { id: "sx-e11", source: "sx-4-1", target: "sx-4-2" },
      { id: "sx-e12", source: "sx-4-2", target: "sx-5-1" },
      
      // Hoàn tất
      { id: "sx-e13", source: "sx-5-1", target: "sx-5-2" },
      { id: "sx-e14", source: "sx-5-2", target: "sx-5-3" },
    ],
  },
  {
    id: "SD-002",
    name: "Luồng xử lý đơn hàng sỉ (Template)",
    updatedAt: "2026-08-15T09:30:00Z",
    nodes: [
      { id: "template-1", position: { x: 500, y: 100 }, data: { label: "Tiêu đề luồng", type: "title", color: "xam" }, type: "miminNode" },
      { id: "template-2", position: { x: 300, y: 250 }, data: { label: "Khối chính", type: "normal", color: "xam" }, type: "miminNode" },
      { id: "template-3", position: { x: 700, y: 250 }, data: { label: "Khối phụ", type: "normal", color: "xam" }, type: "miminNode" },
      { id: "template-4", position: { x: 300, y: 380 }, data: { label: "Chi tiết 1", type: "sub" }, type: "miminNode" },
      { id: "template-5", position: { x: 500, y: 380 }, data: { label: "Chi tiết 2", type: "sub" }, type: "miminNode" },
      { id: "template-6", position: { x: 700, y: 380 }, data: { label: "Chi tiết 3", type: "sub" }, type: "miminNode" },
    ],
    edges: [
      { id: "t-e1", source: "template-1", target: "template-2", animated: true },
      { id: "t-e2", source: "template-1", target: "template-3", animated: true },
      { id: "t-e3", source: "template-2", target: "template-4" },
      { id: "t-e4", source: "template-2", target: "template-5" },
      { id: "t-e5", source: "template-3", target: "template-6" },
    ],
  }
];
