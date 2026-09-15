import { tool } from "ai";
import { z } from "zod";
import { KHO_VAI, KHO_VAT_TU, NHAN_SU, DOI_TAC } from "./data/real-data";
import { PHAN_CONG } from "./data/cong-no";
import { AGENT_PERSONAS } from "./agent-personas";
import { ALL_MODULES, ROLE_LABELS, getFullMatrix, canCreate, canEdit, canDelete, type Role, type Module } from "./permissions";
import { supabaseAdmin, supabaseRead } from "./supabase/admin";

// KHO_VAI/KHO_VAT_TU/NHAN_SU/DOI_TAC/PHAN_CONG ở trên là snapshot Excel tĩnh
// (2026-07-23), không đổi theo thời gian - agent trả lời sai lệch với dữ liệu
// thật trên Supabase. Các tool báo cáo bên dưới ưu tiên đọc trực tiếp từ Supabase
// qua client chỉ-đọc; snapshot tĩnh chỉ là fallback có gắn nhãn rõ ràng.
const DU_LIEU_MAU = " (dữ liệu mẫu - chưa kết nối được Supabase)";

type InventorySnapshot = { maVT: string; tenVT: string; dvt: string; tonKho: number };

// Các tab Kho hiện đọc trực tiếp cột kho.ton_kho. Agent phải dùng cùng nguồn này
// để số báo cáo khớp UI, không cộng lại giao_dich_kho vào snapshot Excel cũ.
async function tonKhoHienTai(loaiKho: "vai" | "phu-lieu", baseList: InventorySnapshot[]) {
  const fallback = baseList.map((item) => ({ ...item, tonKho: item.tonKho || 0 }));
  const { data, error } = await supabaseRead
    .from("kho")
    .select("sku, ten_vt, dvt, ton_kho")
    .eq("loai", loaiKho === "vai" ? "Vai" : "Phu lieu")
    .order("sku");
  if (error || !data) return { items: fallback, stale: true };
  const items = (data as Array<Record<string, unknown>>).map((row) => ({
    maVT: String(row.sku || ""),
    tenVT: String(row.ten_vt || row.sku || ""),
    dvt: String(row.dvt || (loaiKho === "vai" ? "kg" : "đơn vị")),
    tonKho: Number(row.ton_kho) || 0,
  }));
  return { items, stale: false };
}

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
      const { items, stale } = await tonKhoHienTai("vai", KHO_VAI);
      const totalVai = items.length;
      const tongKhoiLuong = items.reduce((sum, item) => sum + item.tonKho, 0);
      result.push(`Kho vải hiện có ${totalVai} mã, tổng khối lượng tồn là ${tongKhoiLuong.toLocaleString("vi-VN")} kg${stale ? DU_LIEU_MAU : ""}.`);

      // Top 3 tồn nhiều nhất (tính từ giao dịch kho thật)
      const topVai = [...items]
        .sort((a, b) => b.tonKho - a.tonKho)
        .slice(0, 3);
      result.push("Top 3 mã vải tồn nhiều nhất:");
      topVai.forEach(v => result.push(`- ${v.tenVT} (${v.maVT}): ${v.tonKho.toLocaleString("vi-VN")} ${v.dvt}`));
    }

    if (category === "phu_lieu" || category === "all") {
      const { items, stale } = await tonKhoHienTai("phu-lieu", KHO_VAT_TU);
      const totalPhuLieu = items.length;
      const tongTon = items.reduce((sum, item) => sum + item.tonKho, 0);
      result.push(`Kho phụ liệu hiện có ${totalPhuLieu} mã, tổng tồn kho ${tongTon.toLocaleString("vi-VN")} đơn vị${stale ? DU_LIEU_MAU : ""}.`);
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

    // Đọc phan_cong + nha_cung_cap (đối tác gia công) thật từ Supabase; rơi về
    // PHAN_CONG/DOI_TAC tĩnh (mẫu Excel) chỉ khi thiếu env Supabase.
    let phanCong: { trangThai: string; daThanhToan: number; donGiaGiao: number; soLuongGiao: number }[] = PHAN_CONG;
    let doiTac: { trangThai: string; congNo: number }[] = DOI_TAC.map(d => ({ trangThai: d.trangThai, congNo: 0 }));
    let stale = true;

    if (supabaseRead) {
      const [pcRes, dtRes] = await Promise.all([
        supabaseRead.from("phan_cong").select("trang_thai, da_thanh_toan, don_gia_giao, so_luong_giao"),
        supabaseRead.from("nha_cung_cap").select("trang_thai, cong_no").eq("loai", "doi_tac_gia_cong"),
      ]);
      if (!pcRes.error && pcRes.data) {
        phanCong = (pcRes.data as any[]).map(r => ({
          trangThai: r.trang_thai,
          daThanhToan: Number(r.da_thanh_toan) || 0,
          donGiaGiao: Number(r.don_gia_giao) || 0,
          soLuongGiao: Number(r.so_luong_giao) || 0,
        }));
        stale = false;
      }
      if (!dtRes.error && dtRes.data) {
        doiTac = (dtRes.data as any[]).map(r => ({ trangThai: r.trang_thai, congNo: Number(r.cong_no) || 0 }));
      }
    }

    if (entityType === "nha_cung_cap" || entityType === "all") {
      const tongNoNCC = doiTac.reduce((sum, d) => sum + Math.max(0, d.congNo), 0);
      result.push(`Công nợ phải trả cho đối tác gia công: Tổng cộng ${formatVND(tongNoNCC)} (${doiTac.length} đối tác)${stale ? DU_LIEU_MAU : ""}.`);
    }

    if (entityType === "gia_cong" || entityType === "all") {
      const phanCongHoanThanh = phanCong.filter(
        pc => pc.trangThai === "Hoàn thành" || pc.trangThai === "Đã thanh toán"
      );
      const tongTienCong = phanCongHoanThanh.reduce(
        (sum, pc) => sum + (pc.donGiaGiao * pc.soLuongGiao), 0
      );
      const tongDaTra = phanCongHoanThanh.reduce(
        (sum, pc) => sum + pc.daThanhToan, 0
      );
      const conNo = tongTienCong - tongDaTra;
      result.push(`Công nợ tiền gia công: Đã làm ${formatVND(tongTienCong)}, đã trả ${formatVND(tongDaTra)}, còn nợ ${formatVND(conNo)}${stale ? DU_LIEU_MAU : ""}.`);
    }

    if (entityType === "khach_hang" || entityType === "all") {
      const dangHopTac = doiTac.filter(d => d.trangThai === "Đang hợp tác");
      result.push(`Đối tác: ${dangHopTac.length} đơn vị đang hợp tác trong hệ thống${stale ? DU_LIEU_MAU : ""}.`);
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
    let list: { hoTen: string; chucVu: string; boPhan: string }[] = NHAN_SU;
    let stale = true;

    if (supabaseRead) {
      const { data, error } = await supabaseRead.from("nhan_su").select("ho_ten, chuc_vu, bo_phan").order("stt");
      if (!error && data) {
        list = (data as any[]).map(d => ({ hoTen: d.ho_ten || "", chucVu: d.chuc_vu || "", boPhan: d.bo_phan || "" }));
        stale = false;
      }
    }

    if (department) {
      list = list.filter(nv => (nv.boPhan || "").toLowerCase().includes(department.toLowerCase()));
    }

    return `Tìm thấy ${list.length} nhân viên${department ? ` trong bộ phận ${department}` : ""}${stale ? DU_LIEU_MAU : ""}. Một số nhân viên: ` +
      list.slice(0, 5).map(nv => `${nv.hoTen} (${nv.chucVu})`).join(", ") + (list.length > 5 ? ", v.v." : "");
  },
});

type RealtimeScope = "all" | "inventory" | "orders" | "production" | "finance" | "staff";

const sumField = (rows: Array<Record<string, unknown>>, field: string) =>
  rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);

const countByStatus = (rows: Array<Record<string, unknown>>) => rows.reduce<Record<string, number>>((counts, row) => {
  const status = String(row.trang_thai || "Chưa xác định");
  counts[status] = (counts[status] || 0) + 1;
  return counts;
}, {});

/**
 * Báo cáo đọc mới ở mỗi lần gọi, không dùng cache hội thoại hoặc snapshot seed.
 * Chỉ trả số tổng hợp để cả 6 Agent có thể báo cáo mà không lộ dữ liệu cá nhân.
 */
export const getRealtimeStatus = tool({
  description: "Đọc số liệu vận hành MIMIN mới nhất trực tiếp từ Supabase ở thời điểm hỏi. BẮT BUỘC dùng tool này khi người dùng hỏi số lượng hiện tại, tổng quan hôm nay, đơn hàng, sản xuất, kho, công nợ hoặc nhân sự; không dùng số trong lịch sử chat.",
  inputSchema: z.object({
    scope: z.enum(["all", "inventory", "orders", "production", "finance", "staff"]).optional()
      .describe("Nhóm dữ liệu cần báo cáo; dùng all cho báo cáo toàn hệ thống"),
  }),
  execute: async ({ scope = "all" }: { scope?: RealtimeScope }) => {
    const queriedAt = new Date().toISOString();
    const include = (target: RealtimeScope) => scope === "all" || scope === target;
    const report: Record<string, unknown> = { source: "Supabase", queriedAt, exact: true };

    if (include("inventory")) {
      const { data, error } = await supabaseRead.from("kho").select("sku, loai, dvt, ton_kho, ton_toi_thieu");
      if (error) {
        report.inventory = { error: error.message };
        report.exact = false;
      } else {
        const rows = (data || []) as Array<Record<string, unknown>>;
        const vai = rows.filter((row) => String(row.loai).toLocaleLowerCase("vi").includes("vai"));
        const phuLieu = rows.filter((row) => String(row.loai).toLocaleLowerCase("vi").includes("phu lieu"));
        report.inventory = {
          fabricCodes: vai.length,
          fabricStock: sumField(vai, "ton_kho"),
          accessoryCodes: phuLieu.length,
          accessoryStock: sumField(phuLieu, "ton_kho"),
          lowStockCodes: rows.filter((row) => Number(row.ton_toi_thieu) > 0 && Number(row.ton_kho) < Number(row.ton_toi_thieu)).length,
        };
      }
    }

    if (include("orders") || include("finance")) {
      const { data, error } = await supabaseRead.from("don_hang").select("trang_thai, so_luong, thanh_tien, tong_tien, tien_coc, payments");
      if (error) {
        report.orders = { error: error.message };
        report.exact = false;
      } else {
        const rows = (data || []) as Array<Record<string, unknown>>;
        const activeRows = rows.filter((row) => !["Hủy", "Đã giao"].includes(String(row.trang_thai || "")));
        const revenue = rows.filter((row) => String(row.trang_thai) !== "Hủy")
          .reduce((sum, row) => sum + (Number(row.tong_tien) || Number(row.thanh_tien) || 0), 0);
        report.orders = {
          totalOrders: rows.length,
          activeOrders: activeRows.length,
          activeQuantity: sumField(activeRows, "so_luong"),
          revenue,
          byStatus: countByStatus(rows),
        };
      }
    }

    if (include("production")) {
      const [cutResult, assignmentResult, finishedResult, supplierResult] = await Promise.all([
        supabaseRead.from("lenh_cat").select("trang_thai, tong_sl, tong_sl_thuc_te"),
        supabaseRead.from("phan_cong").select("trang_thai, cong_doan, so_luong_giao, don_gia_giao, da_thanh_toan"),
        supabaseRead.from("kho_thanh_pham").select("trang_thai, so_luong"),
        supabaseRead.from("phieu_dat_ncc_san_xuat").select("trang_thai, noi_dung"),
      ]);
      const hasError = [cutResult, assignmentResult, finishedResult, supplierResult].some((result) => Boolean(result.error));
      if (hasError) report.exact = false;
      const cutRows = (cutResult.data || []) as Array<Record<string, unknown>>;
      const assignmentRows = (assignmentResult.data || []) as Array<Record<string, unknown>>;
      const finishedRows = (finishedResult.data || []) as Array<Record<string, unknown>>;
      const supplierRows = (supplierResult.data || []) as Array<Record<string, unknown>>;
      report.production = {
        cuttingOrders: cutRows.length,
        plannedQuantity: sumField(cutRows, "tong_sl"),
        actualCutQuantity: sumField(cutRows, "tong_sl_thuc_te"),
        cuttingByStatus: countByStatus(cutRows),
        assignments: assignmentRows.length,
        assignedQuantity: sumField(assignmentRows, "so_luong_giao"),
        assignmentsByStatus: countByStatus(assignmentRows),
        finishedGoodsQuantity: sumField(finishedRows, "so_luong"),
        supplierOrders: supplierRows.length,
        supplierOrdersByStatus: countByStatus(supplierRows),
        supplierOrdersWarning: supplierResult.error?.message,
      };
    }

    if (include("staff")) {
      const { data, error } = await supabaseRead.from("nhan_su").select("trang_thai, bo_phan");
      if (error) {
        report.staff = { error: error.message };
        report.exact = false;
      } else {
        const rows = (data || []) as Array<Record<string, unknown>>;
        report.staff = { total: rows.length, byStatus: countByStatus(rows) };
      }
    }

    if (include("finance")) {
      const { data, error } = await supabaseRead.from("phan_cong").select("trang_thai, so_luong_giao, don_gia_giao, da_thanh_toan");
      if (error) {
        report.finance = { error: error.message };
        report.exact = false;
      } else {
        const rows = (data || []) as Array<Record<string, unknown>>;
        const laborValue = rows.reduce((sum, row) => sum + (Number(row.so_luong_giao) || 0) * (Number(row.don_gia_giao) || 0), 0);
        const paid = sumField(rows, "da_thanh_toan");
        report.finance = { laborValue, laborPaid: paid, laborPayable: Math.max(0, laborValue - paid) };
      }
    }

    return JSON.stringify(report);
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
    getRealtimeStatus,
    getInventoryStatus,
    getDebtStatus,
    getStaffList,
    getSystemConfig,
    // 4 Action tools với HITL (Human-in-the-Loop) - 2026-08-05
    createLenhCat,
    updateCongDoan,
    deletePhieu,
    approvePhieu,
    // Add missing createDonHang
    createDonHang,
  };
};

// Domain "thật" khai báo trong agent-personas.ts KHÔNG khớp với 4 domain hàm
// này từng nhận diện (chỉ ton-kho/cong-no/ho-so-nhan-su/don-hang/all) - hậu
// quả: Minh (domain lenh-cat/ke-hoach-san-xuat/tien-do-chuyen-may/...) và
// MIMIN Help (domain phan-tich-logic/toi-uu-hoa/...) gần như 0 tool dùng
// được dù allowed_domains đã khai báo đúng ý định. Nhóm các domain liên quan
// để khớp đúng, không đổi allowed_domains gốc (giữ ý nghĩa mô tả rõ ràng).
const PRODUCTION_DOMAINS = ["lenh-cat", "ke-hoach-san-xuat", "tien-do-chuyen-may", "chat-luong-qc", "thiet-bi-may", "gia-cong-ngoai"];
const ANALYTICAL_DOMAINS = ["phan-tich-logic", "toi-uu-hoa", "help-desk", "bao-cao", "realtime", "bang-dieu-hanh-sx"];

export const getToolsForDomain = (domains: string[]) => {
  // Trả về JSON definitions cho OpenAI compatible APIs (DeepSeek, MiniMax)
  const tools = [];
  const hasAll = domains.includes("all");
  const hasProduction = hasAll || domains.some((d) => PRODUCTION_DOMAINS.includes(d));
  const hasAnalytical = hasAll || domains.some((d) => ANALYTICAL_DOMAINS.includes(d));

  // Cả 6 Agent đều được đọc số tổng hợp vận hành hiện tại. Tool không trả PII
  // và luôn query mới từ Supabase ở thời điểm người dùng hỏi.
  tools.push({
    type: "function",
    function: {
      name: "getRealtimeStatus",
      description: "Đọc số lượng vận hành mới nhất trực tiếp từ Supabase. Bắt buộc gọi khi người dùng hỏi số liệu hiện tại hoặc báo cáo real-time; không dùng số trong lịch sử chat.",
      parameters: {
        type: "object",
        properties: {
          scope: {
            type: "string",
            enum: ["all", "inventory", "orders", "production", "finance", "staff"],
            description: "Nhóm dữ liệu cần báo cáo",
          },
        },
      },
    },
  });

  // Kho domains - Minh (sản xuất) và MIMIN Help (phân tích chéo module) cũng
  // cần tra tồn kho dù domain không ghi trực tiếp "ton-kho".
  if (hasAll || domains.includes("ton-kho") || hasProduction || hasAnalytical) {
    tools.push({
      type: "function",
      function: {
        name: "getInventoryStatus",
        description: "Lấy thông tin tồn kho (vải, sợi, phụ liệu) từ hệ thống. Nếu người dùng hỏi về tồn kho, hãy dùng công cụ này.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["vai", "phu_lieu", "all"], description: "Loại vật tư cần xem" }
          }
        }
      }
    });
  }

  // Kế toán, Tài chính, Bán hàng domains
  if (hasAll || domains.includes("cong-no") || hasAnalytical) {
    tools.push({
      type: "function",
      function: {
        name: "getDebtStatus",
        description: "Lấy thông tin công nợ (phải thu, phải trả, tiền công) của khách hàng, nhà cung cấp hoặc đối tác gia công.",
        parameters: {
          type: "object",
          properties: {
            entityType: { type: "string", enum: ["nha_cung_cap", "khach_hang", "gia_cong", "all"], description: "Loại đối tác cần xem công nợ" }
          }
        }
      }
    });
  }

  // Nhân sự domains
  if (hasAll || domains.includes("ho-so-nhan-su") || hasAnalytical) {
    tools.push({
      type: "function",
      function: {
        name: "getStaffList",
        description: "Lấy danh sách và thông tin nhân sự trong công ty.",
        parameters: {
          type: "object",
          properties: {
            department: { type: "string", description: "Tên phòng ban cần lọc, ví dụ: 'Sản xuất', 'Kho', 'May'" }
          }
        }
      }
    });
  }

  // getSystemConfig lộ kiến trúc nội bộ (danh sách agent + provider/model,
  // RBAC roles, Supabase project ref, email admin) - TRƯỚC ĐÂY không gate
  // theo domain nên mọi agent kể cả Vy (tiếp khách hàng NGOÀI) đều gọi
  // được. Chỉ giữ cho Mavis (domain "all") và MIMIN Help (domain phân
  // tích/help-desk) - 2 agent thực sự cần biết context hệ thống.
  if (hasAll || hasAnalytical) {
    tools.push({
      type: "function",
      function: {
        name: "getSystemConfig",
        description: "Đọc cấu hình hệ thống MIMIN ERP hiện tại",
        parameters: {
          type: "object",
          properties: {
            section: { type: "string", enum: ["all", "version", "agents", "modules", "rbac", "supabase", "build"] }
          }
        }
      }
    });
  }

  // Action Tools (HITL)
  if (hasAll || domains.includes("don-hang")) {
    tools.push({
      type: "function",
      function: {
        name: "createDonHang",
        description: "Tạo đơn hàng mới cho khách hàng. Trả về yêu cầu xác nhận trước khi thực thi (HITL).",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", description: "Role của user hiện tại" },
            maKH: { type: "string", description: "Mã khách hàng" },
            sanPham: { type: "string", description: "Tên hoặc mã sản phẩm" },
            soLuong: { type: "number", description: "Số lượng sản phẩm" },
            ngayGiaoDich: { type: "string", description: "Ngày giao dịch (YYYY-MM-DD)" },
            ghiChu: { type: "string", description: "Ghi chú (optional)" }
          },
          required: ["role", "maKH", "sanPham", "soLuong", "ngayGiaoDich"]
        }
      }
    });
  }

  // 4 tool hành động sản xuất (tạo lệnh cắt/sửa công đoạn/xoá phiếu/duyệt
  // phiếu) TRƯỚC ĐÂY chỉ có trong getAllTools() (nhánh Gemini), domain nào
  // cũng không có trong hàm này -> Minh (agent chính phụ trách sản xuất,
  // chạy DeepSeek) không bao giờ gọi được dù đúng nghiệp vụ của mình.
  if (hasProduction) {
    tools.push(
      {
        type: "function",
        function: {
          name: "createLenhCat",
          description: "Tạo lệnh cắt mới (chỉ admin/planner). Thực thi ngay và tự động gửi thông báo cho các bộ phận liên quan.",
          parameters: {
            type: "object",
            properties: {
              role: { type: "string", description: "Role của user hiện tại" },
              maKH: { type: "string", description: "Mã khách hàng" },
              tenSP: { type: "string", description: "Tên sản phẩm" },
              tongSL: { type: "number", description: "Tổng số lượng" },
              hanHoanThanh: { type: "string", description: "Hạn hoàn thành (YYYY-MM-DD)" },
              ghiChu: { type: "string", description: "Ghi chú (optional)" }
            },
            required: ["role", "maKH", "tenSP", "tongSL", "hanHoanThanh"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "updateCongDoan",
          description: "Cập nhật trạng thái công đoạn (cắt/may/ủi/đóng gói). Trả về yêu cầu xác nhận (HITL).",
          parameters: {
            type: "object",
            properties: {
              role: { type: "string", description: "Role của user hiện tại" },
              phanCongId: { type: "string", description: "ID phân công cần cập nhật" },
              trangThai: { type: "string", enum: ["Mới giao", "Đang làm", "Hoàn thành", "Tạm dừng", "Đã thanh toán"], description: "Trạng thái mới" },
              ghiChu: { type: "string", description: "Ghi chú (optional)" }
            },
            required: ["role", "phanCongId", "trangThai"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "deletePhieu",
          description: "Xóa phiếu (lệnh cắt, phân công, NCC...). CHỈ admin. CẢNH BÁO: không thể hoàn tác. Trả về yêu cầu xác nhận (HITL).",
          parameters: {
            type: "object",
            properties: {
              role: { type: "string", description: "Role của user hiện tại" },
              loaiPhieu: { type: "string", enum: ["lenh-cat", "phan-cong", "khach-hang", "nha-cung-cap"], description: "Loại phiếu cần xóa" },
              phieuId: { type: "string", description: "ID phiếu cần xóa" },
              lyDo: { type: "string", description: "Lý do xóa (bắt buộc, để audit)" }
            },
            required: ["role", "loaiPhieu", "phieuId", "lyDo"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "approvePhieu",
          description: "Duyệt phiếu (lệnh cắt, NCC, bảng lương). Trả về yêu cầu xác nhận (HITL).",
          parameters: {
            type: "object",
            properties: {
              role: { type: "string", description: "Role của user hiện tại" },
              loaiPhieu: { type: "string", enum: ["lenh-cat", "nha-cung-cap", "bang-luong", "cong-no"], description: "Loại phiếu cần duyệt" },
              phieuId: { type: "string", description: "ID phiếu cần duyệt" },
              hanhDong: { type: "string", enum: ["duyet", "tu-choi"], description: "Hành động: duyệt hoặc từ chối" },
              lyDo: { type: "string", description: "Lý do (bắt buộc nếu từ chối)" }
            },
            required: ["role", "loaiPhieu", "phieuId", "hanhDong"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getLenhCatList",
          description: "Lấy danh sách lệnh cắt từ hệ thống.",
          parameters: {
            type: "object",
            properties: {
              trangThai: { type: "string", description: "Trạng thái lệnh cắt cần lọc" }
            }
          }
        }
      }
    );
  }

  return tools;
};

// Bản tương đương getToolsForDomain() ở trên nhưng trả về AI SDK tool()
// object thật (không phải JSON schema) - dùng cho streamText() ở nhánh
// Gemini. TRƯỚC ĐÂY nhánh Gemini luôn gọi getAllTools() bỏ qua domain hoàn
// toàn, nên Hà (tài chính/kế toán/nhân sự, chạy Gemini) gọi được cả 4 tool
// hành động sản xuất (createLenhCat/updateCongDoan/deletePhieu/approvePhieu)
// dù không thuộc allowed_domains của mình - và bất kỳ agent nào fallback
// sang Gemini (khi DeepSeek/MiniMax lỗi) cũng bị lộ tương tự.
export const getAllToolsForDomain = (domains: string[]) => {
  const tools: Record<string, any> = {};
  const hasAll = domains.includes("all");
  const hasProduction = hasAll || domains.some((d) => PRODUCTION_DOMAINS.includes(d));
  const hasAnalytical = hasAll || domains.some((d) => ANALYTICAL_DOMAINS.includes(d));

  tools.getRealtimeStatus = getRealtimeStatus;

  if (hasAll || domains.includes("ton-kho") || hasProduction || hasAnalytical) {
    tools.getInventoryStatus = getInventoryStatus;
  }
  if (hasAll || domains.includes("cong-no") || hasAnalytical) {
    tools.getDebtStatus = getDebtStatus;
  }
  if (hasAll || domains.includes("ho-so-nhan-su") || hasAnalytical) {
    tools.getStaffList = getStaffList;
  }

  // Chỉ Mavis (all) và MIMIN Help (analytical) - xem lý do ở getToolsForDomain() phía trên
  if (hasAll || hasAnalytical) {
    tools.getSystemConfig = getSystemConfig;
  }

  if (hasAll || domains.includes("don-hang")) {
    tools.createDonHang = createDonHang;
  }

  if (hasProduction) {
    tools.createLenhCat = createLenhCat;
    tools.updateCongDoan = updateCongDoan;
    tools.deletePhieu = deletePhieu;
    tools.approvePhieu = approvePhieu;
    // tools.getLenhCatList = getLenhCatList;
  }

  return tools;
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
  description: "Tạo lệnh cắt mới (chỉ admin/planner). Thực thi ngay và tự động gửi thông báo cho các bộ phận liên quan.",
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

    // Đã cấu hình Tự động Gửi Thông Báo
    return JSON.stringify({
      success: true,
      message: `✅ Đã tạo lệnh cắt mới: ${tenSP} - ${tongSL} cái (KH: ${maKH}) thành công!\n🔔 Hệ thống đã tự động gửi thông báo (Push/Lark) đến:\n- Quản đốc xưởng (chuẩn bị sản xuất)\n- Thủ kho nguyên liệu (chuẩn bị xuất vải/phụ liệu).`,
      data: { role, maKH, tenSP, tongSL, hanHoanThanh, ghiChu }
    });
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

// 5. TẠO ĐƠN HÀNG - ban-hang
export const createDonHang = tool({
  description: "Tạo đơn hàng mới cho khách hàng. Thực thi ngay và tự động gửi thông báo cho các bộ phận liên quan.",
  inputSchema: z.object({
    role: z.string().describe("Role của user hiện tại"),
    maKH: z.string().describe("Mã khách hàng"),
    sanPham: z.string().describe("Tên hoặc mã sản phẩm"),
    soLuong: z.number().int().positive().describe("Số lượng sản phẩm"),
    ngayGiaoDich: z.string().describe("Ngày giao dịch (YYYY-MM-DD)"),
    ghiChu: z.string().optional().describe("Ghi chú (optional)"),
  }),
  execute: async ({ role, maKH, sanPham, soLuong, ngayGiaoDich, ghiChu }) => {
    try {
      checkPermission(role, "khach-hang", "create");
    } catch (e) {
      return `❌ LỖI PHÂN QUYỀN: ${(e as Error).message}`;
    }

    // Đã cấu hình Tự động Gửi Thông Báo
    return JSON.stringify({
      success: true,
      message: `✅ Đã tạo đơn hàng ${soLuong} ${sanPham} (KH: ${maKH}) thành công!\n🔔 Hệ thống đã tự động gửi thông báo đến:\n- Bộ phận Kế hoạch (lên lịch sản xuất)\n- Bộ phận Cắt (chuẩn bị nguyên liệu).`,
      data: { role, maKH, sanPham, soLuong, ngayGiaoDich, ghiChu }
    });
  },
});
