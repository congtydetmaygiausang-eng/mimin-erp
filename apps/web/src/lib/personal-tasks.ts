// Personal Tasks - Công việc cần làm của riêng từng user/role
// "My Queue" - tương tự hộp thư đến

import { PHAN_CONG } from "./data/cong-no";
import { NHAN_SU, DOI_TAC } from "./data/real-data";
import type { Role } from "./permissions";

export type Task = {
  id: string;
  kind: "lenh-cat" | "kho" | "qc" | "cong-no" | "ke-hoach" | "hoan-thien" | "giao-hang" | "don-hang" | "nhan-su" | "system" | "cham-cong";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: string;
  module: string;
  link: string;
  meta?: Record<string, string | number>;
};

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

function addDays(d: number): string {
  return new Date(NOW + d * DAY).toISOString();
}

// Tính personal tasks theo role
export function getPersonalTasks(role: Role | string, userName: string): Task[] {
  const tasks: Task[] = [];

  // Helper tìm user
  const me = NHAN_SU.find((n) => n.hoTen === userName);

  switch (role) {
    case "admin":
      tasks.push(
        {
          id: "t-admin-1",
          kind: "system",
          title: "Xem Audit Log",
          description: "14 hoạt động hôm nay · 4 lỗi cần kiểm tra",
          priority: "high",
          module: "audit-log",
          link: "/audit-log",
        },
        {
          id: "t-admin-2",
          kind: "system",
          title: "Phê duyệt tài khoản mới",
          description: "0 yêu cầu đang chờ",
          priority: "low",
          module: "cai-dat",
          link: "/cai-dat",
        },
        {
          id: "t-admin-3",
          kind: "nhan-su",
          title: "Cập nhật bảng lương tháng 7",
          description: "Còn 17/17 NV chưa duyệt · Deadline 30/7",
          priority: "urgent",
          dueDate: addDays(4),
          module: "bang-luong",
          link: "/bang-luong",
          meta: { pending: 17 },
        }
      );
      break;

    case "planner":
      tasks.push(
        {
          id: "t-pl-1",
          kind: "ke-hoach",
          title: "Lập KHSX tuần 31 (1-7/8)",
          description: "3 đơn hàng mới cần lập kế hoạch · 12,400 SP",
          priority: "high",
          dueDate: addDays(3),
          module: "ke-hoach-sx",
          link: "/ke-hoach-san-xuat",
          meta: { count: 3, total: 12400 },
        },
        {
          id: "t-pl-2",
          kind: "lenh-cat",
          title: "Duyệt 2 lệnh cắt mới",
          description: "M758 (Bộ trụ trơn) · M873 (Áo thun cotton)",
          priority: "high",
          module: "lenh-cat",
          link: "/lenh-cat",
          meta: { count: 2 },
        },
        {
          id: "t-pl-3",
          kind: "don-hang",
          title: "5 đơn hàng chờ duyệt",
          description: "Tổng giá trị 289 triệu",
          priority: "medium",
          module: "don-hang",
          link: "/don-hang",
          meta: { count: 5, value: 289000000 },
        },
        {
          id: "t-pl-4",
          kind: "system",
          title: "Đánh giá lại tiến độ tổ 1",
          description: "Tổ 1 đạt 95% tuần này, vượt KPI 5%",
          priority: "low",
          module: "bao-cao",
          link: "/bao-cao",
        }
      );
      break;

    case "warehouse":
      tasks.push(
        {
          id: "t-wh-1",
          kind: "kho",
          title: "Nhập kho 2,400m vải Cotton 30s",
          description: "Đơn NCC Cty Dệt Phong Phú · Đến hạn 9:00 sáng nay",
          priority: "urgent",
          dueDate: addDays(0.1),
          module: "kho-vai",
          link: "/kho-vai-tinhmann",
          meta: { quantity: 2400, unit: "m" },
        },
        {
          id: "t-wh-2",
          kind: "kho",
          title: "Xuất kho vải cho 3 tổ may",
          description: "Tổ 1 (M758): 800m · Tổ 2 (M873): 1,200m · Tổ 3: 400m",
          priority: "high",
          dueDate: addDays(1),
          module: "kho-vai",
          link: "/kho-vai-tinhmann",
          meta: { teams: 3, total: 2400 },
        },
        {
          id: "t-wh-3",
          kind: "kho",
          title: "Kiểm kê kho phụ liệu cuối tháng",
          description: "58 mã · 5 mã dưới định mức tối thiểu",
          priority: "medium",
          dueDate: addDays(5),
          module: "kho-phu-lieu",
          link: "/kho-phu-lieu",
          meta: { total: 58, low: 5 },
        },
        {
          id: "t-wh-4",
          kind: "nhan-su",
          title: "Đặt hàng 12 chỉ Poly 40s",
          description: "Tồn kho còn 8 cuộn · Cần đặt gấp",
          priority: "high",
          dueDate: addDays(2),
          module: "nha-cung-cap",
          link: "/nha-cung-cap",
        }
      );
      break;

    case "sewing":
      tasks.push(
        {
          id: "t-sw-1",
          kind: "lenh-cat",
          title: "Cắt 1,200 SP cho lệnh M758",
          description: "Bộ trụ trơn · Hoàn thành 750/1,200 (62.5%)",
          priority: "high",
          dueDate: addDays(2),
          module: "to-may",
          link: "/may",
          meta: { progress: 62, target: 1200, done: 750 },
        },
        {
          id: "t-sw-2",
          kind: "lenh-cat",
          title: "Bàn giao 800 SP đã cắt cho tổ 1",
          description: "Cắt xong lúc 14:00 hôm nay",
          priority: "medium",
          dueDate: addDays(0.3),
          module: "to-may",
          link: "/may",
        },
        {
          id: "t-sw-3",
          kind: "cham-cong",
          title: "Chấm công tổ hôm nay",
          description: "11 công nhân · Còn 2 chưa chấm",
          priority: "medium",
          module: "cham-cong",
          link: "/cham-cong",
          meta: { total: 11, pending: 2 },
        },
        {
          id: "t-sw-4",
          kind: "lenh-cat",
          title: "Lệnh M873 (Áo thun cotton) chờ cắt",
          description: "1,200 SP · Vải đã về kho từ 2 ngày trước",
          priority: "high",
          dueDate: addDays(3),
          module: "lenh-cat",
          link: "/lenh-cat",
        }
      );
      break;

    case "qc":
      tasks.push(
        {
          id: "t-qc-1",
          kind: "qc",
          title: "Kiểm tra 800 SP từ tổ 1",
          description: "Lệnh M758 · 12 SP lỗi phát hiện sáng nay · Tỷ lệ 1.5%",
          priority: "urgent",
          dueDate: addDays(0.2),
          module: "kiem-tra-chat-luong",
          link: "/qc",
          meta: { total: 800, fail: 12, rate: 1.5 },
        },
        {
          id: "t-qc-2",
          kind: "qc",
          title: "Kiểm tra lô vải Cotton 30s mới nhập",
          description: "2,400m · Kiểm tra độ co rút, màu sắc",
          priority: "high",
          dueDate: addDays(1),
          module: "qc",
          link: "/qc",
        },
        {
          id: "t-qc-3",
          kind: "qc",
          title: "Tổng hợp báo cáo QC tuần 30",
          description: "Tổng SP kiểm tra: 4,200 · Tỷ lệ lỗi: 1.2%",
          priority: "medium",
          dueDate: addDays(2),
          module: "bao-cao",
          link: "/bao-cao",
          meta: { total: 4200, rate: 1.2 },
        }
      );
      break;

    case "finishing":
      tasks.push(
        {
          id: "t-ft-1",
          kind: "hoan-thien",
          title: "Ủi 800 SP lệnh M758",
          description: "Bộ trụ trơn · Hoàn thành 580/800 (72.5%)",
          priority: "high",
          dueDate: addDays(1),
          module: "hoan-thien",
          link: "/hoan-thien",
          meta: { progress: 72, target: 800, done: 580 },
        },
        {
          id: "t-ft-2",
          kind: "giao-hang",
          title: "Giao 1,500 SP cho Shop Thời Trang Sài Gòn",
          description: "Đơn DH-2024-001 · Hẹn giao 16:00 chiều nay",
          priority: "urgent",
          dueDate: addDays(0.3),
          module: "giao-hang",
          link: "/giao-hang",
          meta: { customer: "Shop Thời Trang Sài Gòn", quantity: 1500 },
        },
        {
          id: "t-ft-3",
          kind: "hoan-thien",
          title: "Đóng gói 600 SP Polo Xanh navy",
          description: "Lệnh LC-2398 · Chuẩn bị giao ngày mai",
          priority: "medium",
          dueDate: addDays(1),
          module: "hoan-thien",
          link: "/hoan-thien",
        }
      );
      break;

    case "accountant":
      tasks.push(
        {
          id: "t-ac-1",
          kind: "cong-no",
          title: "Thanh toán 5 phiếu công nợ đến hạn",
          description: "Tổng 89 triệu · NCC + Đối tác gia công",
          priority: "urgent",
          dueDate: addDays(0.5),
          module: "cong-no-cong-doan",
          link: "/cong-no",
          meta: { count: 5, total: 89000000 },
        },
        {
          id: "t-ac-2",
          kind: "nhan-su",
          title: "Duyệt bảng lương tháng 7",
          description: "17 NV · Tổng chi 135 triệu (sau BHXH)",
          priority: "high",
          dueDate: addDays(3),
          module: "bang-luong",
          link: "/bang-luong",
          meta: { count: 17, total: 135000000 },
        },
        {
          id: "t-ac-3",
          kind: "nhan-su",
          title: "Thanh toán 9 phân công công đoạn",
          description: "Tổng 25 triệu · Còn 0 trễ hạn",
          priority: "high",
          dueDate: addDays(1),
          module: "cong-no-cong-doan",
          link: "/cong-no",
          meta: { count: 9, total: 25000000 },
        },
        {
          id: "t-ac-4",
          kind: "system",
          title: "Lập báo cáo tài chính quý 3",
          description: "Deadline 31/7 · Tổng hợp DT/CP/LN",
          priority: "medium",
          dueDate: addDays(5),
          module: "bao-cao",
          link: "/bao-cao",
        }
      );
      break;
  }

  // Sort theo priority
  const order = { urgent: 0, high: 1, medium: 2, low: 3 };
  return tasks.sort((a, b) => order[a.priority] - order[b.priority]);
}

export function getTaskStats(tasks: Task[]) {
  return {
    total: tasks.length,
    urgent: tasks.filter((t) => t.priority === "urgent").length,
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };
}

export function priorityColor(p: Task["priority"]): string {
  return {
    urgent: "bg-red-500/15 text-red-700",
    high: "bg-amber-500/15 text-amber-700",
    medium: "bg-sky-500/15 text-sky-700",
    low: "bg-slate-500/15 text-slate-700",
  }[p];
}

export function priorityLabel(p: Task["priority"]): string {
  return { urgent: "Khẩn", high: "Cao", medium: "TB", low: "Thấp" }[p];
}
