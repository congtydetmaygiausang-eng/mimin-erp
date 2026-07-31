// Color Palette - Bảng màu sắc vải chuẩn ngành dệt may Việt Nam
// Tên màu + mã hex + loại vải phù hợp

export interface ColorSwatch {
  id: string;            // M-TRANG-001
  ten: string;           // Trắng ngà
  maMau: string;         // #F5F5DC
  nhom: string;          // Trắng / Đen / Xám / Xanh dương / Đỏ / Vàng / ...
  loaiVaiPhuHop: string[]; // cotton, poly, kaki, ...
  donGiaNhuomTB: number; // đ/kg - đơn giá nhuộm trung bình
  doBen: "Tốt" | "Khá" | "Trung bình";
  ghiChu: string;
}

export const MAU_VAI: ColorSwatch[] = [
  // ===== TRẮNG =====
  { id: "M-TRANG-001", ten: "Trắng tinh", maMau: "#FFFFFF", nhom: "Trắng",
    loaiVaiPhuHop: ["cotton", "poly", "kaki"], donGiaNhuomTB: 12000,
    doBen: "Tốt", ghiChu: "Trắng sáng, dễ phai vàng nếu giặt nước nóng" },
  { id: "M-TRANG-002", ten: "Trắng ngà", maMau: "#F5F5DC", nhom: "Trắng",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 11000,
    doBen: "Tốt", ghiChu: "Trắng hơi vàng - ấm, phổ biến nhất" },
  { id: "M-TRANG-003", ten: "Trắng sữa", maMau: "#FFFDD0", nhom: "Trắng",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 11500,
    doBen: "Tốt", ghiChu: "Trắng kem - thời trang cao cấp" },
  { id: "M-TRANG-004", ten: "Trắng xám", maMau: "#EEEEEE", nhom: "Trắng",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 11000,
    doBen: "Tốt", ghiChu: "Trắng hơi xám - hiện đại" },

  // ===== ĐEN =====
  { id: "M-DEN-001", ten: "Đen tuyền", maMau: "#000000", nhom: "Đen",
    loaiVaiPhuHop: ["cotton", "poly", "kaki", "jean"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Đen đậm, bền màu, phổ biến nhất" },
  { id: "M-DEN-002", ten: "Đen nhám", maMau: "#1A1A1A", nhom: "Đen",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Đen hơi xám - thanh lịch" },
  { id: "M-DEN-003", ten: "Đen charcoal", maMau: "#36454F", nhom: "Đen",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 13500,
    doBen: "Tốt", ghiChu: "Đen xám - thời thượng" },

  // ===== XÁM =====
  { id: "M-XAM-001", ten: "Xám nhạt", maMau: "#D3D3D3", nhom: "Xám",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 12000,
    doBen: "Tốt", ghiChu: "Xám sáng - basic" },
  { id: "M-XAM-002", ten: "Xám chì", maMau: "#808080", nhom: "Xám",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 12000,
    doBen: "Tốt", ghiChu: "Xám trung tính - phổ biến" },
  { id: "M-XAM-003", ten: "Xám đậm", maMau: "#555555", nhom: "Xám",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 12500,
    doBen: "Tốt", ghiChu: "Xám đậm - công sở" },
  { id: "M-XAM-004", ten: "Xám xanh", maMau: "#708090", nhom: "Xám",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 12500,
    doBen: "Tốt", ghiChu: "Xám hơi xanh - thời trang" },

  // ===== XANH DƯƠNG =====
  { id: "M-XDUONG-001", ten: "Xanh dương", maMau: "#1E5AFF", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh dương tươi - trẻ trung" },
  { id: "M-XDUONG-002", ten: "Navy", maMau: "#000080", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "kaki", "jean"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Navy cổ điển - công sở, phổ biến" },
  { id: "M-XDUONG-003", ten: "Xanh coban", maMau: "#0047AB", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh coban đậm" },
  { id: "M-XDUONG-004", ten: "Xanh dương pastel", maMau: "#A2C2E8", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh nhạt - baby" },
  { id: "M-XDUONG-005", ten: "Xanh biển", maMau: "#006994", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh biển sâu" },
  { id: "M-XDUONG-006", ten: "Xanh đen", maMau: "#0B1F3A", nhom: "Xanh dương",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14500,
    doBen: "Tốt", ghiChu: "Xanh gần đen - thanh lịch" },

  // ===== ĐỎ =====
  { id: "M-DO-001", ten: "Đỏ tươi", maMau: "#FF0000", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Đỏ rực - nổi bật" },
  { id: "M-DO-002", ten: "Đỏ đô", maMau: "#8B0000", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Đỏ sẫm - sang trọng" },
  { id: "M-DO-003", ten: "Đỏ cam", maMau: "#FF4500", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15500,
    doBen: "Tốt", ghiChu: "Đỏ thiên cam - ấm áp" },
  { id: "M-DO-004", ten: "Đỏ gạch", maMau: "#A0522D", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Đỏ nâu - vintage" },
  { id: "M-DO-005", ten: "Hồng cánh sen", maMau: "#FF69B4", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Hồng tươi - nữ tính" },
  { id: "M-DO-006", ten: "Hồng phấn", maMau: "#FFB6C1", nhom: "Đỏ",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14500,
    doBen: "Tốt", ghiChu: "Hồng nhạt - trẻ em, nữ" },

  // ===== VÀNG =====
  { id: "M-VANG-001", ten: "Vàng tươi", maMau: "#FFD700", nhom: "Vàng",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Vàng chanh - tươi sáng" },
  { id: "M-VANG-002", ten: "Vàng đồng", maMau: "#B87333", nhom: "Vàng",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14500,
    doBen: "Tốt", ghiChu: "Vàng đồng cổ điển" },
  { id: "M-VANG-003", ten: "Vàng kem", maMau: "#FFF8DC", nhom: "Vàng",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 13500,
    doBen: "Tốt", ghiChu: "Vàng nhạt - trang nhã" },
  { id: "M-VANG-004", ten: "Be", maMau: "#F5F5DC", nhom: "Vàng",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 13500,
    doBen: "Tốt", ghiChu: "Be trầm - tự nhiên" },
  { id: "M-VANG-005", ten: "Nâu nhạt", maMau: "#D2B48C", nhom: "Vàng",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Tan/Be - safari" },

  // ===== CAM =====
  { id: "M-CAM-001", ten: "Cam tươi", maMau: "#FF8C00", nhom: "Cam",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15500,
    doBen: "Tốt", ghiChu: "Cam sáng - năng động" },
  { id: "M-CAM-002", ten: "Cam đất", maMau: "#CC5500", nhom: "Cam",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Cam cháy - vintage" },
  { id: "M-CAM-003", ten: "Cam pastel", maMau: "#FFB347", nhom: "Cam",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Cam nhạt - dịu" },

  // ===== TÍM =====
  { id: "M-TIM-001", ten: "Tím lavender", maMau: "#E6E6FA", nhom: "Tím",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Tím nhạt - nữ tính" },
  { id: "M-TIM-002", ten: "Tím đậm", maMau: "#800080", nhom: "Tím",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 15500,
    doBen: "Tốt", ghiChu: "Tím sẫm - quý phái" },
  { id: "M-TIM-003", ten: "Tím pastel", maMau: "#D8BFD8", nhom: "Tím",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 15000,
    doBen: "Tốt", ghiChu: "Tím nhẹ - thời trang" },

  // ===== XANH LÁ =====
  { id: "M-XLA-001", ten: "Xanh lá đậm", maMau: "#228B22", nhom: "Xanh lá",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh lá rừng" },
  { id: "M-XLA-002", ten: "Xanh rêu", maMau: "#556B2F", nhom: "Xanh lá",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh rêu - quân đội" },
  { id: "M-XLA-003", ten: "Xanh mint", maMau: "#98FF98", nhom: "Xanh lá",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh bạc hà - tươi mát" },
  { id: "M-XLA-004", ten: "Xanh lá pastel", maMau: "#90EE90", nhom: "Xanh lá",
    loaiVaiPhuHop: ["cotton", "poly"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh lá nhạt" },
  { id: "M-XLA-005", ten: "Xanh olive", maMau: "#808000", nhom: "Xanh lá",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Xanh ô-liu" },

  // ===== NÂU =====
  { id: "M-NAU-001", ten: "Nâu đất", maMau: "#8B4513", nhom: "Nâu",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Nâu saddle - cổ điển" },
  { id: "M-NAU-002", ten: "Nâu chocolate", maMau: "#3D2817", nhom: "Nâu",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14500,
    doBen: "Tốt", ghiChu: "Nâu socola đậm" },
  { id: "M-NAU-003", ten: "Nâu cà phê", maMau: "#6F4E37", nhom: "Nâu",
    loaiVaiPhuHop: ["cotton", "kaki"], donGiaNhuomTB: 14000,
    doBen: "Tốt", ghiChu: "Nâu cà phê - ấm" },
];

// Group by nhom
export const NHOM_MAU = Array.from(new Set(MAU_VAI.map((m) => m.nhom)));

export function timMauTheoTen(ten: string): ColorSwatch | undefined {
  return MAU_VAI.find((m) => m.ten.toLowerCase() === ten.toLowerCase());
}

export function timMauTheoMa(ma: string): ColorSwatch | undefined {
  return MAU_VAI.find((m) => m.id === ma);
}
