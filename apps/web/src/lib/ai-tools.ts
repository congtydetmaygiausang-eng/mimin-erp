import { tool } from "ai";
import { z } from "zod";
import { KHO_VAI, KHO_VAT_TU, NHAN_SU, DOI_TAC } from "./data/real-data";
import { PHAN_CONG } from "./data/cong-no";
import { AGENT_PERSONAS } from "./agent-personas";
import { ALL_MODULES, ROLE_LABELS, getFullMatrix } from "./permissions";

// Hàm helper định dạng tiền VND
function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

export const getInventoryStatus = tool({
  description: "Lấy thông tin tồn kho (vải, sợi, phụ liệu) từ hệ thống. Nếu người dùng hỏi về tồn kho, hãy dùng công cụ này.",
  inputSchema: z.object({
    category: z.enum(["vai", "phu_lieu", "all"]).optional().describe("Loại vật tư cần xem (vai, phu_lieu, hoặc all cho tất cả)"),
  }),
  execute: async ({ category = "all" }) => {
    const result: string[] = [];

    if (category === "vai" || category === "all") {
      const totalVai = KHO_VAI.length;
      const tongKhoiLuong = KHO_VAI.reduce((sum, item) => sum + (item.tonKho || 0), 0);
      result.push(`Kho vải hiện có ${totalVai} mã, tổng khối lượng tồn là ${tongKhoiLuong} kg.`);

      // Top 3 tồn nhiều nhất
      const topVai = [...KHO_VAI].sort((a, b) => (b.tonKho || 0) - (a.tonKho || 0)).slice(0, 3);
      result.push("Top 3 mã vải tồn nhiều nhất:");
      topVai.forEach(v => result.push(`- ${v.tenVT} (${v.maVT}): ${v.tonKho || 0} ${v.dvt}`));
    }

    if (category === "phu_lieu" || category === "all") {
      const totalPhuLieu = KHO_VAT_TU.length;
      const tongTon = KHO_VAT_TU.reduce((sum, item) => sum + (item.tonKho || 0), 0);
      result.push(`Kho phụ liệu hiện có ${totalPhuLieu} mã, tổng tồn kho ${tongTon} đơn vị.`);
    }

    return result.join("\n");
  },
});

export const getDebtStatus = tool({
  description: "Lấy thông tin công nợ (phải thu, phải trả, tiền công) của khách hàng, nhà cung cấp hoặc đối tác gia công.",
  inputSchema: z.object({
    entityType: z.enum(["nha_cung_cap", "khach_hang", "gia_cong", "all"]).optional().describe("Loại đối tác cần xem công nợ"),
  }),
  execute: async ({ entityType = "all" }) => {
    const result: string[] = [];

    if (entityType === "nha_cung_cap" || entityType === "all") {
      // Tính công nợ NCC dựa trên PHAN_CONG có daThanhToan < donGiaGiao*soLuongGiao
      const phanCongChuaThanhToan = PHAN_CONG.filter(
        pc => pc.trangThai !== "Đã thanh toán"
      );
      const tongDaThanhToan = phanCongChuaThanhToan.reduce(
        (sum, pc) => sum + (pc.daThanhToan || 0), 0
      );
      const tongCanThanhToan = phanCongChuaThanhToan.reduce(
        (sum, pc) => sum + ((pc.donGiaGiao || 0) * (pc.soLuongGiao || 0)), 0
      );
      const tongNoNCC = Math.max(0, tongCanThanhToan - tongDaThanhToan);
      result.push(`Công nợ phải trả (từ phân công): Tổng cộng ${formatVND(tongNoNCC)} (chưa thanh toán ${phanCongChuaThanhToan.length} phiếu).`);
    }

    if (entityType === "gia_cong" || entityType === "all") {
      // Tiền công gia công dựa trên PHAN_CONG
      const phanCongHoanThanh = PHAN_CONG.filter(
        pc => pc.trangThai === "Hoàn thành" || pc.trangThai === "Đã thanh toán"
      );
      const tongTienCong = phanCongHoanThanh.reduce(
        (sum, pc) => sum + ((pc.donGiaGiao || 0) * (pc.soLuongGiao || 0)), 0
      );
      const tongDaTra = phanCongHoanThanh.reduce(
        (sum, pc) => sum + (pc.daThanhToan || 0), 0
      );
      const conNo = tongTienCong - tongDaTra;
      result.push(`Công nợ tiền gia công: Đã làm ${formatVND(tongTienCong)}, đã trả ${formatVND(tongDaTra)}, còn nợ ${formatVND(conNo)}.`);
    }

    if (entityType === "khach_hang" || entityType === "all") {
      // Đếm đối tác Đang hợp tác (coi là KH tiềm năng)
      const khActive = DOI_TAC.filter(d => d.trangThai === "Đang hợp tác");
      result.push(`Khách hàng: ${khActive.length} đối tác đang hợp tác trong hệ thống.`);
    }

    return result.join("\n");
  },
});

export const getStaffList = tool({
  description: "Lấy danh sách và thông tin nhân sự trong công ty.",
  inputSchema: z.object({
    department: z.string().optional().describe("Tên phòng ban cần lọc, ví dụ: 'Sản xuất', 'Kho', 'May'"),
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

export const getSystemConfig = tool({
  description: "Đọc cấu hình hệ thống MIMIN ERP hiện tại: version app, môi trường (production/development), danh sách 9 agent personas + RBAC, danh sách modules + phân quyền, cấu hình Supabase, ngày giờ build. Dùng tool này khi cần biết context hệ thống đang thay đổi trong quá trình chỉnh sửa để cập nhật hỗ trợ phù hợp.",
  inputSchema: z.object({
    section: z.enum(["all", "version", "agents", "modules", "rbac", "supabase", "build"]).optional()
      .describe("Phần thông tin cần đọc (mặc định: all)"),
  }),
  execute: async ({ section = "all" }) => {
    const config: Record<string, any> = {
      app: {
        name: process.env.NEXT_PUBLIC_APP_NAME || "MIMIN ERP",
        version: process.env.NEXT_PUBLIC_APP_VERSION || "89.6.9.3",
        env: process.env.NODE_ENV,
        build_time: new Date().toISOString(),
      },
      agents: Object.values(AGENT_PERSONAS).map((a) => ({
        agent_id: a.agent_id,
        name: a.name,
        role: a.role_title,
        provider: a.provider,
        model: a.model,
        allowed_domains: a.allowed_domains,
      })),
      modules: ALL_MODULES,
    };

    if (section === "version" || section === "all") {
      // version đã có trong app
    }

    if (section === "agents" || section === "all") {
      // agents đã có
    }

    if (section === "modules" || section === "all") {
      // modules đã có
    }

    if (section === "rbac" || section === "all") {
      config.rbac = {
        roles: Object.keys(ROLE_LABELS),
        role_labels: ROLE_LABELS,
        admin_email: "sang@mimin.vn",
        matrix_size: `${Object.keys(ROLE_LABELS).length} roles × ${ALL_MODULES.length} modules`,
        note: "Phân quyền chi tiết theo module trong getFullMatrix()",
      };
    }

    if (section === "supabase" || section === "all") {
      config.supabase = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || "(chưa cấu hình)",
        has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        project: "nftlwdcsmlpeiazhuoho",
      };
    }

    if (section === "build" || section === "all") {
      config.build = {
        next_output: "export (static)",
        framework: "Next.js 15.5.0 + React 19.0.0",
        deploy_target: "Vercel",
        edge_functions: "API routes v1 (orchestrator, lark, users)",
      };
    }

    // Trả về JSON string dễ đọc
    const filtered = section === "all" ? config : { [section]: config[section] || config };
    return `⚙️ Cấu hình hệ thống MIMIN ERP:\n\`\`\`json\n${JSON.stringify(filtered, null, 2)}\n\`\`\``;
  },
});

export const getAllTools = () => {
  return {
    getInventoryStatus,
    getDebtStatus,
    getStaffList,
    getSystemConfig,
  };
};
