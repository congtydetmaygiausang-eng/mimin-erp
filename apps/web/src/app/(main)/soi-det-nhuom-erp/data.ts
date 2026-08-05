// ============ TYPES + SCREEN REGISTRY ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)

import { BarChart3, Plus, Package, Truck, CheckCircle2, Boxes, Palette, DollarSign, AlertTriangle, Calculator, History, Link2 } from "lucide-react";

export type Screen =
  | "dashboard" | "nhapsoi" | "khosoi" | "lenhdet" | "nghiemthumoc"
  | "khomoc" | "menhuom" | "nghiemthumau" | "khotp"
  | "congno" | "haohut" | "giavon" | "kho-log" | "truynguoc";

export const SCREENS: { key: Screen; label: string; icon: any; nhom: number }[] = [
  { key: "dashboard", label: "1. Dashboard", icon: BarChart3, nhom: 1 },
  { key: "nhapsoi", label: "2. Nhập kho sợi", icon: Plus, nhom: 1 },
  { key: "khosoi", label: "3. Kho sợi", icon: Package, nhom: 1 },
  { key: "lenhdet", label: "4. Lệnh dệt", icon: Truck, nhom: 2 },
  { key: "nghiemthumoc", label: "5. Nghiệm thu mộc", icon: CheckCircle2, nhom: 2 },
  { key: "khomoc", label: "6. Kho vải mộc", icon: Boxes, nhom: 2 },
  { key: "menhuom", label: "7. Mẻ nhuộm", icon: Palette, nhom: 3 },
  { key: "nghiemthumau", label: "8. Nghiệm thu vải màu", icon: CheckCircle2, nhom: 3 },
  { key: "khotp", label: "9. Kho vải TP", icon: Boxes, nhom: 3 },
  { key: "congno", label: "10. Công nợ gia công", icon: DollarSign, nhom: 4 },
  { key: "haohut", label: "11. Báo cáo hao hụt", icon: AlertTriangle, nhom: 4 },
  { key: "giavon", label: "12. Báo cáo giá vốn", icon: Calculator, nhom: 4 },
  { key: "kho-log", label: "📜 Kho Log", icon: History, nhom: 5 },
  { key: "truynguoc", label: "🔍 Truy ngược lô", icon: Link2, nhom: 5 },
];
