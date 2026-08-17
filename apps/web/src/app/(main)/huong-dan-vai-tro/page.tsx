"use client";

import { useState } from "react";
import { Users, Shield, Package, Scissors, ShieldCheck, PenTool, Calculator, Image as ImageIcon, Briefcase, ChevronDown, CheckCircle2 } from "lucide-react";

const ROLES = [
  {
    id: "admin",
    name: "Ban Điều Hành (Admin)",
    icon: Shield,
    color: "bg-red-50 text-red-600 border-red-200",
    description: "Quản trị viên toàn quyền hệ thống. Quản lý toàn bộ vòng đời sản phẩm.",
    users: "sang, hoa, phi, vy2, A Cường",
    detailedGuide: [
      {
        task: "Quản lý Tài Khoản & Phân Quyền",
        steps: [
          "Truy cập menu [Quản lý tài khoản] ở Sidebar bên trái.",
          "Bấm nút [Thêm tài khoản mới] màu xanh góc phải trên.",
          "Điền [Email], [Mật khẩu], [Họ Tên] và chọn [Vai trò].",
          "Bấm nút [Lưu] để tạo tài khoản cho nhân viên."
        ]
      },
      {
        task: "Xem Báo Cáo Tổng Quan",
        steps: [
          "Truy cập menu [Dashboard] hoặc [Sơ Đồ Chiến Lược].",
          "Bấm nút [Xem] tại mỗi thẻ để xem chi tiết tiến độ hoặc doanh thu.",
          "Dùng nút [Bộ lọc] góc trên để lọc theo thời gian."
        ]
      }
    ]
  },
  {
    id: "planner",
    name: "Điều phối SX (Planner)",
    icon: Briefcase,
    color: "bg-purple-50 text-purple-600 border-purple-200",
    description: "Lên kế hoạch sản xuất, tạo lệnh cắt và điều phối nguyên phụ liệu.",
    users: "giau, huyen, huyen2",
    detailedGuide: [
      {
        task: "1. Tạo Công Thức Định Mức",
        steps: [
          "Truy cập menu [Công thức định mức].",
          "Nhập [Số lượng sản phẩm], [Kích thước Size] (VD: S, M, L), [Tên vải].",
          "Điền các chi phí [Giá vải], [Bo cổ], [Công may]... Hệ thống sẽ tự động cộng tổng.",
          "Bấm nút [Lưu định mức] để lưu lại cấu hình giá vốn."
        ]
      },
      {
        task: "2. Tạo Lệnh Cắt",
        steps: [
          "Truy cập menu [Lệnh Cắt].",
          "Bấm nút [Thêm Lệnh Cắt] màu xanh góc phải.",
          "Điền [Mã Lệnh Cắt] (Ví dụ: LC-001) và [Mã Sản Phẩm].",
          "Nhập [Số lượng cần cắt], chọn [Tổ cắt] và bấm [Lưu]."
        ]
      }
    ]
  },
  {
    id: "warehouse",
    name: "Quản lý Kho (Warehouse)",
    icon: Package,
    color: "bg-amber-50 text-amber-600 border-amber-200",
    description: "Nhập xuất tồn kho vải, phụ liệu và thành phẩm.",
    users: "hau",
    detailedGuide: [
      {
        task: "1. Nhập Kho Vải / Phụ Liệu",
        steps: [
          "Truy cập [Kho Vải] hoặc [Kho Phụ Liệu].",
          "Bấm nút [Nhập Kho mới].",
          "Chọn [Mã Vải/Phụ liệu], nhập [Số lượng], [Số lô].",
          "Bấm [Xác nhận nhập kho]."
        ]
      },
      {
        task: "2. Xuất Kho (Theo Lệnh Cắt)",
        steps: [
          "Vào tab [Xuất Kho].",
          "Bấm nút [Xuất cho Lệnh Cắt].",
          "Chọn [Mã Lệnh Cắt] từ danh sách thả xuống, hệ thống sẽ tự động điền số lượng định mức.",
          "Bấm [Xuất Kho] và in phiếu xuất."
        ]
      }
    ]
  },
  {
    id: "sewing",
    name: "Tổ trưởng May (Sewing)",
    icon: Scissors,
    color: "bg-cyan-50 text-cyan-600 border-cyan-200",
    description: "Quản lý tiến độ may, nhận lệnh cắt và phân công thợ may.",
    users: "giang, de, phu, vinh, minh1, nhan, ruong",
    detailedGuide: [
      {
        task: "1. Nhận Việc (Từ Lệnh Cắt)",
        steps: [
          "Truy cập màn hình [Tổ May Work].",
          "Ở tab [Chờ nhận], tìm Mã Lệnh Cắt và bấm nút [Nhận việc].",
          "Trạng thái sẽ chuyển sang [Đang thực hiện]."
        ]
      },
      {
        task: "2. Báo Cáo Sản Lượng (Hoàn Thành)",
        steps: [
          "Ở Lệnh cắt đang thực hiện, bấm nút [Báo cáo tiến độ].",
          "Nhập [Số lượng đạt] và [Số lượng lỗi] (nếu có).",
          "Bấm [Lưu tiến độ]. Nếu làm xong toàn bộ, bấm [Chuyển QC]."
        ]
      }
    ]
  },
  {
    id: "qc",
    name: "Kiểm tra CL (QC)",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    description: "Kiểm tra chất lượng thành phẩm trước khi nhập kho.",
    users: "KCS team",
    detailedGuide: [
      {
        task: "1. Kiểm tra Thành Phẩm",
        steps: [
          "Truy cập [Kiểm Tra CL (QC)].",
          "Tại danh sách Hàng chờ QC, bấm nút [Kiểm Tra].",
          "Nhập [Số lượng Đạt] và ghi chú [Số lượng Lỗi] (phân loại lỗi: tuột chỉ, sai kích thước...).",
          "Bấm [Xác nhận] để hàng tự động đẩy sang Kho Thành Phẩm."
        ]
      }
    ]
  },
  {
    id: "finishing",
    name: "Tổ trưởng Hoàn Thiện",
    icon: PenTool,
    color: "bg-pink-50 text-pink-600 border-pink-200",
    description: "Quản lý các công đoạn sau may: Ủi, Khuy nút, Đóng gói.",
    users: "nhu, nga",
    detailedGuide: [
      {
        task: "1. Nhận Việc Hoàn Thiện",
        steps: [
          "Truy cập [Tổ Hoàn Thiện Work].",
          "Bấm nút [Nhận lô hàng] đã qua QC hoặc từ Tổ May chuyển đến."
        ]
      },
      {
        task: "2. Đóng Gói / Ghi nhận",
        steps: [
          "Bấm nút [Báo cáo đóng gói].",
          "Nhập [Số lượng thùng] hoặc [Số lượng cái].",
          "Bấm nút [Hoàn tất đóng gói] để chuyển giao cho Kho Thành Phẩm hoặc Giao hàng."
        ]
      }
    ]
  },
  {
    id: "accountant",
    name: "Kế toán (Accountant)",
    icon: Calculator,
    color: "bg-blue-50 text-blue-600 border-blue-200",
    description: "Quản lý dòng tiền, công nợ và thanh toán.",
    users: "linh, chau",
    detailedGuide: [
      {
        task: "1. Chốt Công Nợ Gia Công",
        steps: [
          "Truy cập menu [Công Nợ & Thanh Toán].",
          "Chọn mục [Đối tác Gia Công Ngoài], xem tổng dư nợ.",
          "Bấm nút [Tạo Phiếu Chi] để thanh toán tiền cho đối tác.",
          "Điền [Số tiền], [Ghi chú] và bấm [Lưu Phiếu]."
        ]
      },
      {
        task: "2. Duyệt Lương Công Nhân",
        steps: [
          "Vào menu [Tiền Công Hoàn Thiện] / [Tiền Công May].",
          "Xem bảng kê số lượng từ các Tổ, đối chiếu và bấm nút [Chốt Lương].",
          "Hệ thống tự động tính tổng tiền công trong tháng."
        ]
      }
    ]
  },
  {
    id: "partner",
    name: "Đối tác GC (Partner)",
    icon: Users,
    color: "bg-slate-50 text-slate-600 border-slate-200",
    description: "Xưởng gia công ngoài xem tiến độ và công nợ của riêng họ.",
    users: "Xưởng A, Xưởng B",
    detailedGuide: [
      {
        task: "1. Xem Lệnh Gia Công",
        steps: [
          "Truy cập [Trang Chủ Gia Công].",
          "Nhìn thấy các Mã Hàng đang nhận gia công, bấm nút [Chi tiết] để xem số lượng và yêu cầu kỹ thuật."
        ]
      },
      {
        task: "2. Xem Công Nợ",
        steps: [
          "Bấm vào tab [Công Nợ Của Tôi].",
          "Xem các khoản đã nhận thanh toán, và các khoản MIMIN ERP đang nợ chưa thanh toán."
        ]
      }
    ]
  }
];

// Helper to render steps with badge styling for buttons
const renderStepWithBadges = (text: string) => {
  // Regex tìm nội dung nằm trong cặp ngoặc vuông [...] để biến thành nút/badge
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, index) => {
    if (part.startsWith("[") && part.endsWith("]")) {
      const btnText = part.slice(1, -1);
      return (
        <span key={index} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-sm">
          {btnText}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function HuongDanVaiTroPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 bg-white/30 dark:bg-slate-900/50 backdrop-blur-md border border-white/50 dark:border-slate-800/50 rounded-2xl p-6 shadow-lg">
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mb-3 text-slate-900 dark:text-white drop-shadow-sm">
          <div className="p-2 bg-brand-600 text-white rounded-xl shadow-md">
            <Users className="w-6 h-6" />
          </div>
          Sơ đồ hướng dẫn sử dụng & Vai trò chi tiết
        </h1>
        <p className="text-slate-800 dark:text-slate-200 text-base md:text-lg font-medium drop-shadow-sm">
          Danh sách các vai trò trong hệ thống MIMIN ERP. <strong className="text-brand-700 dark:text-brand-300">Bấm vào từng thẻ</strong> để xem hướng dẫn chi tiết từng nút bấm cho các thao tác chính.
        </p>
      </div>

      {/* Grid of roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          return (
            <div 
              key={role.id}
              onClick={() => setSelectedRole(isSelected ? null : role.id)}
              className={`border rounded-xl p-5 cursor-pointer transition-all duration-300 relative overflow-hidden ${isSelected ? 'ring-2 ring-brand-500 shadow-lg bg-white dark:bg-slate-900 z-10 scale-[1.02]' : 'hover:border-brand-300 hover:shadow-md bg-white/80 dark:bg-slate-900/40'} ${role.color.replace('bg-', 'border-').split(' ')[0]}`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className={`p-3 rounded-lg shrink-0 ${role.color}`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{role.name}</h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5 break-words">Tài khoản: {role.users}</p>
                </div>
                <div className="shrink-0 mt-2">
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isSelected ? 'rotate-180 text-brand-500' : ''}`} />
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                {role.description}
              </p>

              {/* Detailed Guide Section (Collapsible) */}
              <div 
                className={`grid transition-all duration-300 ease-in-out ${isSelected ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-5">
                    {role.detailedGuide.map((guide, idx) => (
                      <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-800">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-brand-500" />
                          {guide.task}
                        </h4>
                        <ul className="space-y-3">
                          {guide.steps.map((step, stepIdx) => (
                            <li key={stepIdx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold mt-0.5">
                                {stepIdx + 1}
                              </span>
                              <div className="leading-relaxed">
                                {renderStepWithBadges(step)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workflow Visualization */}
      <div className="mt-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">Luồng hoạt động chính (Workflow)</h2>
        
        <div className="relative">
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
