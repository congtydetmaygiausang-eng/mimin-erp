import { tool } from "ai";
import { z } from "zod";
import { KHO_VAI, KHO_VAT_TU, NHAN_SU, DOI_TAC } from "./data/real-data";
import { PHAN_CONG } from "./data/cong-no";
import { AGENT_PERSONAS } from "./agent-personas";
import { ALL_MODULES, ROLE_LABELS, getFullMatrix, canCreate, canEdit, canDelete, type Role, type Module } from "./permissions";

// Hàm helper định dạng tiền VND
function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

// HITL helper: tra ve yeu cau xac nhan thay vi thuc thi ngay
// UI se hien ActionConfirmModal, user bam Confirm moi goi lai thuc thi
function requiresConfirmation(action: string, description: string, payload: any, warning?: string) {
  return {
    requires_confirmation: true,
    action,
    description,
    payload,
    warning: warning || "Hành động này sẽ thay đổi dữ liệu. Vui lòng xác nhận.",
    timestamp: new Date().toISOString(),
  };
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
    // 4 Action tools với HITL (Human-in-the-Loop) - 2026-08-05
    createLenhCat,
    updateCongDoan,
    deletePhieu,
    approvePhieu,
  };
};

// ============================================
// 4 ACTION TOOLS với HITL (Human-in-the-Loop)
// Mỗi tool: check permission → return confirmation request
// UI sẽ hiện ActionConfirmModal → user bấm Confirm → gọi lại qua API
// ============================================

/** Helper: check role có quyền không, throw error nếu không */
function checkPermission(role: string | undefined, mod: Module, action: "create" | "edit" | "delete") {
  if (!role) throw new Error("Chưa đăng nhập");
  if (action === "create" && !canCreate(role as Role, mod)) {
    throw new Error(`Role "${role}" KHÔNG có quyền TẠO trong module "${mod}"`);
  }
  if (action === "edit" && !canEdit(role as Role, mod)) {
    throw new Error(`Role "${role}" KHÔNG có quyền SỬA trong module "${mod}"`);
  }
  if (action === "delete" && !canDelete(role as Role, mod)) {
    throw new Error(`Role "${role}" KHÔNG có quyền XÓA trong module "${mod}"`);
  }
}

// 1. TẠO LỆNH CẮT - admin/planner only
export const createLenhCat = tool({
  description: "Tạo lệnh cắt mới (chỉ admin/planner). Trả về yêu cầu xác nhận trước khi thực thi (HITL).",
  inputSchema: z.object({
    role: z.string().describe("Role của user hiện tại"),
    maKH: z.string().describe("Mã khách hàng"),
    tenSP: z.string().describe("Tên sản phẩm"),
    tongSL: z.number().int().positive().describe("Tổng số lượng"),
    hanHoanThanh: z.string().describe("Hạn hoàn thành (YYYY-MM-DD)"),
    ghiChu: z.string().optional().describe("Ghi chú (optional)"),
  }),
  execute: async ({ role, maKH, tenSP, tongSL, hanHoanThanh, ghiChu }) => {
    try {
      checkPermission(role, "lenh-cat", "create");
    } catch (e) {
      return `❌ LỖI PHÂN QUYỀN: ${(e as Error).message}`;
    }

    // KHÔNG thực thi ngay - trả về yêu cầu HITL
    return JSON.stringify(requiresConfirmation(
      "createLenhCat",
      `Tạo lệnh cắt mới: ${tenSP} - ${tongSL} cái - KH ${maKH}`,
      { role, maKH, tenSP, tongSL, hanHoanThanh, ghiChu },
      `Lệnh cắt mới sẽ được tạo với số lượng ${tongSL} cái. Admin/planner sau khi duyệt sẽ cấp phát vải.`
    ));
  },
});

// 2. SỬA CÔNG ĐOẠN - admin/planner/sewing
export const updateCongDoan = tool({
  description: "Cập nhật trạng thái công đoạn (cắt/may/ủi/đóng gói). Trả về yêu cầu xác nhận (HITL).",
  inputSchema: z.object({
    role: z.string().describe("Role của user hiện tại"),
    phanCongId: z.string().describe("ID phân công cần cập nhật"),
    trangThai: z.enum(["Mới giao", "Đang làm", "Hoàn thành", "Tạm dừng", "Đã thanh toán"])
      .describe("Trạng thái mới"),
    ghiChu: z.string().optional().describe("Ghi chú (optional)"),
  }),
  execute: async ({ role, phanCongId, trangThai, ghiChu }) => {
    try {
      checkPermission(role, "lenh-cat", "edit");
    } catch (e) {
      return `❌ LỖI PHÂN QUYỀN: ${(e as Error).message}`;
    }

    return JSON.stringify(requiresConfirmation(
      "updateCongDoan",
      `Cập nhật công đoạn ${phanCongId} → ${trangThai}`,
      { role, phanCongId, trangThai, ghiChu }
    ));
  },
});

// 3. XÓA PHIẾU - admin only
export const deletePhieu = tool({
  description: "Xóa phiếu (lệnh cắt, phân công, NCC...). CHỈ admin. CẢNH BÁO: không thể hoàn tác. Trả về yêu cầu xác nhận (HITL).",
  inputSchema: z.object({
    role: z.string().describe("Role của user hiện tại"),
    loaiPhieu: z.enum(["lenh-cat", "phan-cong", "khach-hang", "nha-cung-cap"]).describe("Loại phiếu cần xóa"),
    phieuId: z.string().describe("ID phiếu cần xóa"),
    lyDo: z.string().describe("Lý do xóa (bắt buộc, để audit)"),
  }),
  execute: async ({ role, loaiPhieu, phieuId, lyDo }) => {
    try {
      const modMap: Record<string, Module> = {
        "lenh-cat": "lenh-cat",
        "phan-cong": "lenh-cat",
        "khach-hang": "khach-hang",
        "nha-cung-cap": "nha-cung-cap",
      };
      checkPermission(role, modMap[loaiPhieu], "delete");
    } catch (e) {
      return `❌ LỖI PHÂN QUYỀN: ${(e as Error).message}`;
    }

    return JSON.stringify(requiresConfirmation(
      "deletePhieu",
      `⚠️ XÓA ${loaiPhieu}: ${phieuId}`,
      { role, loaiPhieu, phieuId, lyDo },
      `⚠️ CẢNH BÁO: Hành động này XÓA VĨNH VIỄN phiếu ${loaiPhieu} (${phieuId}). Lý do: "${lyDo}". Không thể hoàn tác!`
    ));
  },
});

// 4. DUYỆT PHIẾU - admin/planner
export const approvePhieu = tool({
  description: "Duyệt phiếu (lệnh cắt, NCC, bảng lương). Trả về yêu cầu xác nhận (HITL).",
  inputSchema: z.object({
    role: z.string().describe("Role của user hiện tại"),
    loaiPhieu: z.enum(["lenh-cat", "nha-cung-cap", "bang-luong", "cong-no"]).describe("Loại phiếu cần duyệt"),
    phieuId: z.string().describe("ID phiếu cần duyệt"),
    hanhDong: z.enum(["duyet", "tu-choi"]).describe("Hành động: duyệt hoặc từ chối"),
    lyDo: z.string().optional().describe("Lý do (bắt buộc nếu từ chối)"),
  }),
  execute: async ({ role, loaiPhieu, phieuId, hanhDong, lyDo }) => {
    try {
      const modMap: Record<string, Module> = {
        "lenh-cat": "lenh-cat",
        "nha-cung-cap": "nha-cung-cap",
        "bang-luong": "bang-luong",
        "cong-no": "cong-no-cong-doan",
      };
      // Duyệt cần quyền edit
      checkPermission(role, modMap[loaiPhieu], "edit");
    } catch (e) {
      return `❌ LỖI PHÂN QUYỀN: ${(e as Error).message}`;
    }

    if (hanhDong === "tu-choi" && !lyDo) {
      return `❌ LỖI: Bắt buộc phải có lý do khi từ chối phiếu.`;
    }

    return JSON.stringify(requiresConfirmation(
      "approvePhieu",
      `${hanhDong === "duyet" ? "✅ DUYỆT" : "❌ TỪ CHỐI"} ${loaiPhieu}: ${phieuId}`,
      { role, loaiPhieu, phieuId, hanhDong, lyDo }
    ));
  },
});
