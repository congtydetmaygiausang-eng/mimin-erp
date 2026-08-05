// ============ TABS + TYPES ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { BarChart3, Users, Plus, GitBranch, CreditCard, FileText } from "lucide-react";

export type Tab = "dashboard" | "master" | "lenhtong" | "flow" | "congno" | "baocao";

export const TABS: { key: Tab; label: string; icon: any; color: string }[] = [
  { key: "dashboard", label: "Tổng", icon: BarChart3, color: "blue" },
  { key: "master", label: "Danh bạ", icon: Users, color: "slate" },
  { key: "lenhtong", label: "Lệnh", icon: Plus, color: "emerald" },
  { key: "flow", label: "Quy trình", icon: GitBranch, color: "violet" },
  { key: "congno", label: "Công nợ", icon: CreditCard, color: "rose" },
  { key: "baocao", label: "Báo cáo", icon: FileText, color: "amber" },
];

export type FlowStep = "khosoi" | "lenhdet" | "nghiemthumoc" | "menhuom" | "nghiemthumau" | "khotp";

export const FLOW_STEPS: { k: FlowStep; l: string; i: any; c: string; sub: string }[] = [
  { k: "khosoi", l: "Kho sợi", i: null, c: "blue", sub: "Nhập/Xuất" },
  { k: "lenhdet", l: "Xưởng dệt", i: null, c: "violet", sub: "Tạo lệnh" },
  { k: "nghiemthumoc", l: "NT mộc", i: null, c: "purple", sub: "Nghiệm thu" },
  { k: "menhuom", l: "Xưởng nhuộm", i: null, c: "rose", sub: "Mẻ nhuộm" },
  { k: "nghiemthumau", l: "NT màu", i: null, c: "pink", sub: "Từng màu" },
  { k: "khotp", l: "Kho TP", i: null, c: "emerald", sub: "Nhập kho" },
];

// Workaround: set icon sau (vi luc import luc khoi tao)
import { Package, Truck, CheckCircle2, Palette, Boxes } from "lucide-react";
FLOW_STEPS[0].i = Package;
FLOW_STEPS[1].i = Truck;
FLOW_STEPS[2].i = CheckCircle2;
FLOW_STEPS[3].i = Palette;
FLOW_STEPS[4].i = CheckCircle2;
FLOW_STEPS[5].i = Boxes;
