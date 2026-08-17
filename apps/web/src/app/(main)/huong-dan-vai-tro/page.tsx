"use client";

import { useState } from "react";
import { Users, Shield, Package, Scissors, ShieldCheck, PenTool, Calculator, Image as ImageIcon, Briefcase } from "lucide-react";
import Link from "next/link";

const ROLES = [
  {
    id: "admin",
    name: "Ban Điều Hành (Admin)",
    icon: Shield,
    color: "bg-red-50 text-red-600 border-red-200",
    description: "Quản trị viên toàn quyền hệ thống. Quản lý toàn bộ vòng đời sản phẩm.",
    modules: ["Tất cả tính năng (30/30)", "Quản lý tài khoản & phân quyền", "Duyệt công nợ & chi phí", "Cài đặt hệ thống & AI"],
    users: "sang, hoa, phi, vy2, A Cường"
  },
  {
    id: "planner",
    name: "Điều phối SX (Planner)",
    icon: Briefcase,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    description: "Lên kế hoạch sản xuất, tạo lệnh cắt và điều phối nguyên phụ liệu.",
    modules: ["Công thức định mức", "Sơ đồ chiến lược", "Lệnh cắt & Lệnh tổng", "Kiểm tra vải & phụ liệu"],
    users: "giau, huyen, huyen2"
  },
  {
    id: "warehouse",
    name: "Quản lý Kho (Warehouse)",
    icon: Package,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    description: "Nhập xuất tồn kho vải, phụ liệu và thành phẩm.",
    modules: ["Kho vải & Kho phụ liệu", "Kho thành phẩm", "Nhập/Xuất kho Mobile", "Kiểm kê kho"],
    users: "hau"
  },
  {
    id: "sewing",
    name: "Tổ trưởng May (Sewing)",
    icon: Scissors,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    description: "Quản lý tiến độ may, nhận lệnh cắt và phân công thợ may.",
    modules: ["Tiến độ cắt may", "Giao việc tổ may", "Báo cáo sản lượng may", "Tính tiền công may"],
    users: "giang, de, phu, vinh, minh1, nhan, ruong"
  },
  {
    id: "finishing",
    name: "Tổ trưởng Hoàn Thiện",
    icon: PenTool,
    color: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Quản lý các công đoạn sau may: Ủi, Khuy nút, Đóng gói.",
    modules: ["Tiến độ ủi/đóng gói", "Nhận/giao hàng hoàn thiện", "Ghi nhận sản lượng", "Tính tiền công hoàn thiện"],
    users: "nhu, nga"
  },
  {
    id: "qc",
    name: "Kiểm tra CL (QC)",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    description: "Kiểm tra chất lượng thành phẩm trước khi nhập kho.",
    modules: ["Báo cáo lỗi QC", "Nghiệm thu chất lượng", "Danh sách hàng đạt/hỏng"],
    users: "KCS team"
  },
  {
    id: "accountant",
    name: "Kế toán (Accountant)",
    icon: Calculator,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    description: "Quản lý dòng tiền, công nợ và thanh toán cho đối tác/nhân viên.",
    modules: ["Công nợ gia công", "Tính lương tiền công", "Hóa đơn điện tử", "Duyệt phiếu chi"],
    users: "linh, chau"
  },
  {
    id: "content",
    name: "Content/Media",
    icon: ImageIcon,
    color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200",
    description: "Marketing, cập nhật hình ảnh sản phẩm.",
    modules: ["Danh mục sản phẩm", "Tải ảnh sản phẩm", "Cập nhật catalogue"],
    users: "Content team"
  },
  {
    id: "partner",
    name: "Đối tác GC (Partner)",
    icon: Users,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    description: "Xưởng gia công ngoài xem tiến độ và công nợ của riêng họ.",
    modules: ["Nhận lệnh gia công", "Báo cáo giao hàng", "Xem công nợ cá nhân"],
    users: "Đối tác ngoài (ví dụ: Xưởng A, Xưởng B)"
  }
];

export default function HuongDanVaiTroPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Users className="w-6 h-6 text-brand-500" />
          Sơ đồ hướng dẫn sử dụng & Vai trò
        </h1>
        <p className="text-slate-500">
          Danh sách các vai trò trong hệ thống MIMIN ERP và quyền hạn tương ứng của từng tài khoản.
        </p>
      </div>

      {/* Grid of roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <div 
              key={role.id}
              onClick={() => setSelectedRole(isSelected ? null : role.id)}
              className={`border rounded-xl p-5 cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-brand-500 shadow-md bg-white' : 'hover:border-brand-300 hover:shadow-sm bg-white/60 dark:bg-slate-900/40'} ${role.color.replace('bg-', 'border-').split(' ')[0]}`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className={`p-3 rounded-lg ${role.color}`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{role.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Tài khoản: {role.users}</p>
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-10 line-clamp-2">
                {role.description}
              </p>

              <div className={`space-y-2 overflow-hidden transition-all duration-300 ${isSelected ? 'max-h-60 opacity-100 mt-4 border-t pt-4 border-slate-100' : 'max-h-0 opacity-0'}`}>
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Tính năng chính</div>
                <ul className="space-y-1.5">
                  {role.modules.map((mod, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      {mod}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Visualization */}
      <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">Luồng hoạt động chính (Workflow)</h2>
        
        <div className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 z-0 rounded-full" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ring-4 ring-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">1. Lên Kế Hoạch</h4>
              <p className="text-xs text-slate-500 mt-1">Điều phối SX tạo Lệnh Cắt & Định Mức</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ring-4 ring-white">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">2. Xuất Vật Tư</h4>
              <p className="text-xs text-slate-500 mt-1">Kho xuất vải & phụ liệu theo lệnh</p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-cyan-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ring-4 ring-white">
                <Scissors className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">3. Gia Công May</h4>
              <p className="text-xs text-slate-500 mt-1">Tổ may thực hiện & báo cáo tiến độ</p>
            </div>
            
            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm ring-4 ring-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-800">4. QC & Nhập Kho</h4>
              <p className="text-xs text-slate-500 mt-1">Kiểm tra chất lượng & Nhập thành phẩm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
