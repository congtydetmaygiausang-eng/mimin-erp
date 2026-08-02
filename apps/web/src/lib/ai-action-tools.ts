import { tool } from "ai";
import { z } from "zod";
import { KHO_VAI, KHO_VAT_TU } from "./data/real-data";

// ============================================
// MIMIN ERP - AI Action Tools (HITL Pattern)
// 4 tool giúp Mavis có thể VẬN HÀNH hệ thống
// Mỗi tool trả về "action_proposal" - Admin duyệt mới thực thi
// Phase 1: createLenhCat, updateTonKho, capNhatTrangThaiLenhCat, xuatBaoCao
// ============================================

const PROPOSAL_TYPES = {
  CREATE_LENH_CAT: "createLenhCat",
  UPDATE_TON_KHO: "updateTonKho",
  CAP_NHAT_TRANG_THAI: "capNhatTrangThaiLenhCat",
  XUAT_BAO_CAO: "xuatBaoCao",
} as const;

// ============================================
// 1. CREATE LENH CAT (MIN AI Sản xuất)
// ============================================
export const createLenhCatAction = tool({
  description:
    "Đề xuất tạo lệnh cắt mới. Cần admin duyệt trước khi thực thi. Dùng khi user nói 'tạo lệnh cắt', 'lập lệnh SX', 'cắt áo polo', 'may 500 cái'...",
  inputSchema: z.object({
    tenSP: z.string().describe("Tên sản phẩm (VD: Áo Polo Xanh Navy)"),
    maSP: z.string().optional().describe("Mã SP (tự sinh nếu không có)"),
    loaiSP: z.enum(["BoTru", "AoPolo", "AoThun", "QuanShort", "BoTheThao", "AoSoMi", "ĐongPhuc"]).default("AoPolo"),
    tongSL: z.number().int().positive().describe("Tổng số lượng cắt"),
    sizeBreakdown: z
      .object({
        S: z.number().int().nonnegative().default(0),
        M: z.number().int().nonnegative().default(0),
        L: z.number().int().nonnegative().default(0),
        XL: z.number().int().nonnegative().default(0),
        "2XL": z.number().int().nonnegative().default(0),
        "3XL": z.number().int().nonnegative().default(0),
      })
      .optional()
      .describe("Phân bổ size chi tiết (tùy chọn)"),
    soMau: z.number().int().positive().default(1).describe("Số màu vải cắt"),
    hanHoanThanh: z.string().describe("Hạn hoàn thành (YYYY-MM-DD)"),
    phuTrachCat: z.string().default("NV006").describe("Mã người phụ trách cắt"),
    ghiChu: z.string().optional().describe("Ghi chú thêm"),
  }),
  execute: async (args) => {
    // Check size breakdown khớp tổng SL
    const sizeTotal = args.sizeBreakdown
      ? Object.values(args.sizeBreakdown).reduce((a, b) => a + b, 0)
      : 0;
    const warnings: string[] = [];

    if (args.sizeBreakdown && sizeTotal !== args.tongSL) {
      warnings.push(
        `⚠️ Tổng size breakdown (${sizeTotal}) ≠ tổng SL (${args.tongSL}). Chênh lệch ${Math.abs(args.tongSL - sizeTotal)} SP sẽ phân bổ tự động.`
      );
    }

    // Estimate định mức vải
    const dinhMucVaiM = 0.25; // 0.25m/SP (default polo)
    const vaiCanM = args.tongSL * dinhMucVaiM;

    // Tìm vải phù hợp trong kho
    const vaiGoiY = KHO_VAI.filter(
      (v) => v.tenVT?.toLowerCase().includes("cotton") || v.tenVT?.toLowerCase().includes("polo")
    ).slice(0, 3);

    // Check tồn kho
    if (vaiGoiY.length > 0) {
      const vaiChinh = vaiGoiY[0];
      const tonKho = vaiChinh.tonKho || 0;
      if (tonKho < vaiCanM) {
        warnings.push(
          `⚠️ Tồn kho vải ${vaiChinh.tenVT} còn ${tonKho}m < ${vaiCanM}m cần. Cần nhập thêm ${vaiCanM - tonKho}m.`
        );
      }
    }

    // Estimate COGS (chỉ là sơ bộ, form thật sẽ tính chính xác)
    const giaVaiBQ = vaiGoiY[0]?.donGia || 50000; // đ/m
    const giaPhuLieuBQ = 8000; // đ/SP
    const giaCong1SP = 22000 + 18000 + 4500 + 3000; // 5 khâu
    const chiPhiCoDinh = 2500; // bao bì + tem
    const COGS = giaVaiBQ * dinhMucVaiM + giaPhuLieuBQ + giaCong1SP + chiPhiCoDinh;

    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      type: "action_proposal",
      action: PROPOSAL_TYPES.CREATE_LENH_CAT,
      proposal_id: proposalId,
      data: args,
      preview: {
        tenSP: args.tenSP,
        maSP: args.maSP || `M${String(Date.now()).slice(-4)}`,
        tongSL: args.tongSL,
        vaiCanM,
        COGS: Math.round(COGS),
        tongChiPhi: Math.round(COGS * args.tongSL),
        vaiGoiY: vaiGoiY.map((v) => `${v.tenVT} (${v.tonKho || 0}m)`),
      },
      warnings,
      requires_approval: true,
      agent: "MIN AI Sản xuất",
      timestamp: Date.now(),
    };
  },
});

// ============================================
// 2. UPDATE TON KHO (MIN AI Kho)
// ============================================
export const updateTonKhoAction = tool({
  description:
    "Đề xuất cập nhật tồn kho (nhập/xuất/kiểm kê). Cần admin duyệt. Dùng khi user nói 'nhập kho', 'xuất kho', 'kiểm kê', 'cập nhật tồn kho'...",
  inputSchema: z.object({
    loai: z.enum(["nhap", "xuat", "kiem_ke"]).describe("Loại thao tác"),
    maVT: z.string().describe("Mã vật tư (VD: VT001)"),
    soLuong: z.number().positive().describe("Số lượng (kg/m/cái)"),
    donVi: z.string().default("kg").describe("Đơn vị"),
    lyDo: z.string().describe("Lý do nhập/xuất/kiểm kê"),
    nhaCungCap: z.string().optional().describe("Nhà cung cấp (nếu nhập)"),
    khachHang: z.string().optional().describe("Khách hàng (nếu xuất)"),
  }),
  execute: async (args) => {
    const vatTu = KHO_VAI.find((v) => v.maVT === args.maVT) || KHO_VAT_TU.find((v) => v.maVT === args.maVT);
    if (!vatTu) {
      return {
        type: "error",
        error: `Không tìm thấy vật tư mã ${args.maVT}`,
        suggestions: KHO_VAI.slice(0, 5).map((v) => `${v.maVT} - ${v.tenVT}`),
      };
    }

    const tonKhoHienTai = vatTu.tonKho || 0;
    let tonKhoMoi = tonKhoHienTai;

    if (args.loai === "nhap") {
      tonKhoMoi = tonKhoHienTai + args.soLuong;
    } else if (args.loai === "xuat") {
      tonKhoMoi = tonKhoHienTai - args.soLuong;
      if (tonKhoMoi < 0) {
        return {
          type: "error",
          error: `Tồn kho không đủ. Hiện tại: ${tonKhoHienTai}${args.donVi}, yêu cầu xuất: ${args.soLuong}${args.donVi}`,
        };
      }
    } else {
      // kiem_ke - soLuong là số thực tế sau kiểm kê
      tonKhoMoi = args.soLuong;
    }

    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    return {
      type: "action_proposal",
      action: PROPOSAL_TYPES.UPDATE_TON_KHO,
      proposal_id: proposalId,
      data: args,
      preview: {
        tenVT: vatTu.tenVT,
        loai: args.loai,
        tonKhoHienTai,
        tonKhoMoi,
        chenhLech: tonKhoMoi - tonKhoHienTai,
        donVi: args.donVi,
      },
      warnings:
        args.loai === "xuat" && tonKhoMoi < tonKhoHienTai * 0.1
          ? [`⚠️ Tồn kho sau xuất chỉ còn ${tonKhoMoi}${args.donVi} (dưới 10% - sắp hết)`]
          : [],
      requires_approval: true,
      agent: "MIN AI Kho",
      timestamp: Date.now(),
    };
  },
});

// ============================================
// 3. CAP NHAT TRANG THAI LENH CAT (MIN AI Sản xuất)
// ============================================
export const capNhatTrangThaiLenhCatAction = tool({
  description:
    "Đề xuất đổi trạng thái lệnh cắt. Cần admin duyệt. Dùng khi user nói 'bắt đầu cắt', 'hoàn thành lệnh', 'đổi trạng thái'...",
  inputSchema: z.object({
    lenhCatId: z.string().describe("ID lệnh cắt (VD: LC-2024-001)"),
    trangThaiMoi: z
      .enum(["Moi", "DangCat", "DaCat", "HoanThanh", "Huy"])
      .describe("Trạng thái mới"),
    ghiChu: z.string().optional().describe("Lý do / ghi chú"),
  }),
  execute: async (args) => {
    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      type: "action_proposal",
      action: PROPOSAL_TYPES.CAP_NHAT_TRANG_THAI,
      proposal_id: proposalId,
      data: args,
      preview: {
        lenhCatId: args.lenhCatId,
        trangThaiCu: "(hiện tại - sẽ tự load)",
        trangThaiMoi: args.trangThaiMoi,
        ghiChu: args.ghiChu,
      },
      warnings: [],
      requires_approval: true,
      agent: "MIN AI Sản xuất",
      timestamp: Date.now(),
    };
  },
});

// ============================================
// 4. XUAT BAO CAO (MIN AI Tài chính)
// ============================================
export const xuatBaoCaoAction = tool({
  description:
    "Đề xuất xuất báo cáo ra file Excel/PDF. Cần admin duyệt. Dùng khi user nói 'xuất báo cáo', 'báo cáo tồn kho', 'excel sản lượng'...",
  inputSchema: z.object({
    loai: z
      .enum(["ton_kho", "san_luong", "cong_no", "tien_luong", "doanh_thu"])
      .describe("Loại báo cáo"),
    tuNgay: z.string().optional().describe("Từ ngày (YYYY-MM-DD)"),
    denNgay: z.string().optional().describe("Đến ngày (YYYY-MM-DD)"),
    dinhDang: z.enum(["xlsx", "pdf", "csv"]).default("xlsx"),
  }),
  execute: async (args) => {
    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    return {
      type: "action_proposal",
      action: PROPOSAL_TYPES.XUAT_BAO_CAO,
      proposal_id: proposalId,
      data: args,
      preview: {
        loai: args.loai,
        tuNgay: args.tuNgay || "đầu kỳ",
        denNgay: args.denNgay || "hiện tại",
        dinhDang: args.dinhDang.toUpperCase(),
      },
      warnings: [],
      requires_approval: true,
      agent: "MIN AI Tài chính",
      timestamp: Date.now(),
    };
  },
});

// ============================================
// EXPORT ALL ACTION TOOLS
// ============================================
export const ACTION_TOOLS = {
  createLenhCat: createLenhCatAction,
  updateTonKho: updateTonKhoAction,
  capNhatTrangThaiLenhCat: capNhatTrangThaiLenhCatAction,
  xuatBaoCao: xuatBaoCaoAction,
} as const;

export type ActionProposal = {
  type: "action_proposal";
  action: string;
  proposal_id: string;
  data: any;
  preview: Record<string, any>;
  warnings: string[];
  requires_approval: true;
  agent: string;
  timestamp: number;
};

export const getActionTools = () => ACTION_TOOLS;
