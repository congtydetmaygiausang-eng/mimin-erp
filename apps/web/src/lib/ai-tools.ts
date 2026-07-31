import { tool } from "ai";
import { z } from "zod";
import { KHO_VAI, KHO_VAT_TU, NHAN_SU, DOI_TAC } from "./data/real-data";
import { PHAN_CONG } from "./data/cong-no";

// Hàm helper định dạng tiền VND
function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export const getInventoryStatus = tool({
  description: "Lấy thông tin tồn kho (vải, sợi, phụ liệu) từ hệ thống. Nếu người dùng hỏi về tồn kho, hãy dùng công cụ này.",
  parameters: z.object({
    category: z.enum(["vai", "phu_lieu", "all"]).optional().describe("Loại vật tư cần xem (vai, phu_lieu, hoặc all cho tất cả)"),
  }),
  execute: async ({ category = "all" }) => {
    let result: string[] = [];

    if (category === "vai" || category === "all") {
      const totalVai = KHO_VAI.length;
      const tongKhoiLuong = KHO_VAI.reduce((sum, item) => sum + item.tonKho, 0);
      result.push(`Kho vải hiện có ${totalVai} mã, tổng khối lượng tồn là ${tongKhoiLuong} kg.`);
      
      // Top 3 tồn nhiều nhất
      const topVai = [...KHO_VAI].sort((a, b) => b.tonKho - a.tonKho).slice(0, 3);
      result.push("Top 3 mã vải tồn nhiều nhất:");
      topVai.forEach(v => result.push(`- ${v.ten} (${v.ma}): ${v.tonKho} kg`));
    }

    if (category === "phu_lieu" || category === "all") {
      const totalPhuLieu = KHO_VAT_TU.length;
      const tongTon = KHO_VAT_TU.reduce((sum, item) => sum + item.tonKho, 0);
      result.push(`Kho phụ liệu hiện có ${totalPhuLieu} mã, tổng tồn kho ${tongTon} đơn vị.`);
    }

    return result.join("\n");
  },
});

export const getDebtStatus = tool({
  description: "Lấy thông tin công nợ (phải thu, phải trả, tiền công) của khách hàng, nhà cung cấp hoặc đối tác gia công.",
  parameters: z.object({
    entityType: z.enum(["nha_cung_cap", "khach_hang", "gia_cong", "all"]).optional().describe("Loại đối tác cần xem công nợ"),
  }),
  execute: async ({ entityType = "all" }) => {
    let result: string[] = [];

    if (entityType === "nha_cung_cap" || entityType === "all") {
      const nccNo = DOI_TAC.filter(d => d.vaiTro === "Dệt" || d.vaiTro === "Nhuộm" || d.vaiTro === "Bo cổ").filter(d => (d as any).congNo > 0);
      const tongNoNCC = nccNo.reduce((sum, d) => sum + ((d as any).congNo || 0), 0);
      result.push(`Công nợ phải trả Nhà Cung Cấp: Tổng cộng ${formatVND(tongNoNCC)} (đang nợ ${nccNo.length} NCC).`);
    }

    if (entityType === "gia_cong" || entityType === "all") {
      // Dựa vào PHAN_CONG để tính nợ
      const tienCongNo = PHAN_CONG.filter(pc => pc.trangThaiThanhToan !== "Đã thanh toán").reduce((sum, pc) => sum + (pc.donGia * pc.soLuongLoi), 0); // Ví dụ tính nợ tạm
      result.push(`Công nợ phải trả tiền gia công/công nhân: Khoảng ${formatVND(tienCongNo)} (chưa tính chi tiết).`);
    }

    return result.join("\n");
  },
});

export const getStaffList = tool({
  description: "Lấy danh sách và thông tin nhân sự trong công ty.",
  parameters: z.object({
    department: z.string().optional().describe("Tên phòng ban cần lọc, ví dụ: 'Ban Giám đốc', 'Kho', 'Sản xuất'"),
  }),
  execute: async ({ department }) => {
    let list = NHAN_SU;
    if (department) {
      list = list.filter(nv => nv.boPhan.toLowerCase().includes(department.toLowerCase()));
    }
    
    return `Tìm thấy ${list.length} nhân viên${department ? ` trong bộ phận ${department}` : ""}. Một số nhân viên: ` +
      list.slice(0, 5).map(nv => `${nv.hoTen} (${nv.chucVu})`).join(", ") + (list.length > 5 ? ", v.v." : "");
  },
});

export const getAllTools = () => {
  return {
    getInventoryStatus,
    getDebtStatus,
    getStaffList,
  };
};
