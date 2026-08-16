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
    id: "SD-002",
    name: "Luồng xử lý đơn hàng sỉ",
    updatedAt: "2026-08-15T09:30:00Z",
    nodes: [],
    edges: [],
  }
];
