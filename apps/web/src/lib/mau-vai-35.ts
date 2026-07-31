// 35 màu vải chuẩn MIMIN - Color Picker cho form LSX
export interface MauVai {
  id: string;
  ten: string;
  hex: string;
  nhom: "trang" | "den" | "xam" | "do" | "xanh-duong" | "xanh-la" | "vang" | "cam" | "tim" | "hong" | "nau" | "be";
}

export const MAU_VAI_35: MauVai[] = [
  // Trắng/Đen/Xám (7 màu cơ bản)
  { id: "trang",      ten: "Trắng",       hex: "#FFFFFF", nhom: "trang" },
  { id: "den",        ten: "Đen",         hex: "#0F0F0F", nhom: "den" },
  { id: "xam-nhat",   ten: "Xám nhạt",    hex: "#D1D5DB", nhom: "xam" },
  { id: "xam",        ten: "Xám",         hex: "#9CA3AF", nhom: "xam" },
  { id: "xam-dam",    ten: "Xám đậm",     hex: "#4B5563", nhom: "xam" },
  { id: "xam-xanh",   ten: "Xám xanh",    hex: "#6B7280", nhom: "xam" },
  { id: "kem",        ten: "Kem",         hex: "#FEF3C7", nhom: "be" },

  // Đỏ (4 màu)
  { id: "do-tuoi",    ten: "Đỏ tươi",    hex: "#DC2626", nhom: "do" },
  { id: "do-do",      ten: "Đỏ đô",       hex: "#991B1B", nhom: "do" },
  { id: "do-nau",     ten: "Đỏ nâu",      hex: "#7C2D12", nhom: "do" },
  { id: "do-hong",    ten: "Đỏ hồng",     hex: "#FB7185", nhom: "do" },

  // Xanh dương (5 màu)
  { id: "xanh-duong",  ten: "Xanh dương",  hex: "#2563EB", nhom: "xanh-duong" },
  { id: "xanh-navy",   ten: "Xanh Navy",   hex: "#1E3A8A", nhom: "xanh-duong" },
  { id: "xanh-den",    ten: "Xanh đen",    hex: "#1E40AF", nhom: "xanh-duong" },
  { id: "xanh-nhat",   ten: "Xanh nhạt",   hex: "#93C5FD", nhom: "xanh-duong" },
  { id: "xanh-polo",   ten: "Xanh Polo",   hex: "#1E50A2", nhom: "xanh-duong" },

  // Xanh lá (4 màu)
  { id: "xanh-la",     ten: "Xanh lá",     hex: "#16A34A", nhom: "xanh-la" },
  { id: "xanh-la-dam", ten: "Xanh lá đậm", hex: "#166534", nhom: "xanh-la" },
  { id: "xanh-la-nhat",ten: "Xanh lá nhạt",hex: "#86EFAC", nhom: "xanh-la" },
  { id: "xanh-reu",    ten: "Xanh rêu",    hex: "#4D7C0F", nhom: "xanh-la" },

  // Vàng (3 màu)
  { id: "vang",        ten: "Vàng",        hex: "#FACC15", nhom: "vang" },
  { id: "vang-nhat",   ten: "Vàng nhạt",   hex: "#FDE68A", nhom: "vang" },
  { id: "vang-kem",    ten: "Vàng kem",    hex: "#FCD34D", nhom: "vang" },

  // Cam (3 màu)
  { id: "cam",         ten: "Cam",         hex: "#F97316", nhom: "cam" },
  { id: "cam-nhat",    ten: "Cam nhạt",    hex: "#FED7AA", nhom: "cam" },
  { id: "cam-dat",     ten: "Cam đất",     hex: "#C2410C", nhom: "cam" },

  // Tím (3 màu)
  { id: "tim",         ten: "Tím",         hex: "#9333EA", nhom: "tim" },
  { id: "tim-nhat",    ten: "Tím nhạt",    hex: "#C084FC", nhom: "tim" },
  { id: "tim-than",    ten: "Tím than",    hex: "#4C1D95", nhom: "tim" },

  // Hồng (3 màu)
  { id: "hong",        ten: "Hồng",        hex: "#EC4899", nhom: "hong" },
  { id: "hong-nhat",   ten: "Hồng nhạt",   hex: "#FBCFE8", nhom: "hong" },
  { id: "hong-da",     ten: "Hồng da",     hex: "#F9A8D4", nhom: "hong" },

  // Nâu/Bé (3 màu)
  { id: "nau",         ten: "Nâu",         hex: "#78350F", nhom: "nau" },
  { id: "nau-nhat",    ten: "Nâu nhạt",    hex: "#A16207", nhom: "nau" },
  { id: "be",          ten: "Be",          hex: "#D6BC8A", nhom: "be" },
];

export function getMauByTen(ten: string): MauVai | undefined {
  return MAU_VAI_35.find((m) => m.ten.toLowerCase() === ten.toLowerCase() || m.id === ten);
}

export function getMauById(id: string): MauVai | undefined {
  return MAU_VAI_35.find((m) => m.id === id);
}
