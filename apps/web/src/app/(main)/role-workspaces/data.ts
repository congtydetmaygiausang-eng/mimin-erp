// ============ ROLES + TYPES ============
// Tach tu page.tsx (2026-08-05 - toi uu B.6)

import { Package, Truck, Palette, Boxes, ClipboardCheck, Calculator, Shield } from "lucide-react";

export type Role = "kho-soi" | "xuong-det" | "xuong-nhuom" | "kho-tp" | "qc" | "ke-toan" | "admin";

export const ROLES: { key: Role; label: string; icon: any; color: string; moTa: string }[] = [
  { key: "kho-soi", label: "Kho sợi", icon: Package, color: "blue", moTa: "Nhập kho + Theo dõi tồn" },
  { key: "xuong-det", label: "Xưởng dệt", icon: Truck, color: "violet", moTa: "Tạo lệnh + Nghiệm thu mộc" },
  { key: "xuong-nhuom", label: "Xưởng nhuộm", icon: Palette, color: "rose", moTa: "Tạo mẻ + Nghiệm thu màu" },
  { key: "kho-tp", label: "Kho vải TP", icon: Boxes, color: "emerald", moTa: "Nhập kho + Quản lý vị trí" },
  { key: "qc", label: "QC - Chất lượng", icon: ClipboardCheck, color: "amber", moTa: "Tổng hợp chất lượng mẻ sợi" },
  { key: "ke-toan", label: "Kế toán", icon: Calculator, color: "cyan", moTa: "Công nợ + Thanh toán" },
  { key: "admin", label: "Admin tổng", icon: Shield, color: "slate", moTa: "Tổng quan toàn hệ thống" },
];
