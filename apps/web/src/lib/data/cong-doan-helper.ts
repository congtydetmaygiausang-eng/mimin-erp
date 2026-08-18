// ============================================
// Helper dùng chung cho các trang công đoạn sản xuất
// (Cắt -> May -> In/Thêu -> QC -> Khuy nút -> Ủi -> Đóng gói -> Hoàn thiện)
// 2026-08-18 - Đợt 3 của rà soát hệ thống
// ============================================
//
// Trước đây mỗi trang công đoạn tự lặp lại đoạn:
//
//     if (chiTietMau.length > 0) { cộng dồn soLuongDat / soLuongLoi }
//     else { slDat = pc.soLuong || lc.tongSL; slLoi = 0; }
//
// Nhánh "else" là chỗ hỏng: công nhân không bấm vào card màu để khai báo thì
// công đoạn tự cho là ĐẠT 100%, LỖI 0 - lấy nguyên số lượng cắt ban đầu chạy
// thẳng tới đóng gói. Hao hụt thật không bao giờ được ghi nhận, và số nhập kho
// thành phẩm nhiều hơn hàng thật.
//
// Ngoài ra không có chỗ nào chặn "số đạt khâu sau > số đạt khâu trước", nên gõ
// nhầm ở đóng gói có thể nhập kho nhiều hơn số đã cắt ra.

import type { LenhCat, CongDoanItem } from "./lenh-cat-store";

export interface KetQuaKhaiBao {
  slDat: number;
  slLoi: number;
  /** Đã có khai báo chi tiết theo màu chưa */
  daKhaiBao: boolean;
}

/** Cộng dồn số đạt / số lỗi từ khai báo theo màu của 1 công đoạn. */
export function tongKhaiBao(pc: any): KetQuaKhaiBao {
  const ds: any[] = Array.isArray(pc?.chiTietMau) ? pc.chiTietMau : [];
  if (ds.length === 0) return { slDat: 0, slLoi: 0, daKhaiBao: false };
  let slDat = 0;
  let slLoi = 0;
  for (const m of ds) {
    slDat += Number(m?.soLuongDat) || 0;
    slLoi += Number(m?.soLuongLoi) || 0;
  }
  return { slDat, slLoi, daKhaiBao: true };
}

/**
 * Công đoạn liền trước trong quy trình. Thứ tự mảng phanCong chính là thứ tự
 * chạy chuyền (Cắt -> ... -> Đóng gói).
 */
export function congDoanTruoc(lc: LenhCat, pc: any): CongDoanItem | undefined {
  const ds = lc?.phanCong || [];
  const idx = ds.findIndex((x: any) => x.id === pc?.id);
  if (idx <= 0) return undefined;
  return ds[idx - 1];
}

/**
 * Trần số lượng được phép khai ở công đoạn này = số ĐẠT của khâu liền trước.
 * Trả về null nếu khâu trước chưa khai báo (không đủ căn cứ để chặn).
 */
export function tranSoLuong(lc: LenhCat, pc: any): number | null {
  const truoc = congDoanTruoc(lc, pc);
  if (!truoc) return null; // khâu đầu tiên (Cắt) - không có trần
  const { slDat, daKhaiBao } = tongKhaiBao(truoc);
  return daKhaiBao ? slDat : null;
}

/** Lệnh cắt có khai màu thật hay không (để biết có bắt buộc khai theo màu không). */
export function coMauThat(lc: LenhCat): boolean {
  const ds = lc?.dsMau || [];
  return ds.length > 0 && ds.some((m: any) => m?.ten);
}

/** Lệnh cắt là hàng Bộ (áo + quần) hay chỉ Áo/Phụ kiện đơn lẻ. */
export function laHangBo(lc: LenhCat): boolean {
  return (lc?.loaiSP || "").startsWith("Bo");
}

function timCongDoan(lc: LenhCat, tuKhoa: string): CongDoanItem | undefined {
  return (lc?.phanCong || []).find((pc: any) => {
    const id = (pc.id || "").toLowerCase().replace(/_/g, "");
    const ten = (pc.tenCongDoan || "").toLowerCase();
    return id.includes(tuKhoa) || ten.includes(tuKhoa === "mayao" ? "may áo" : "may quần");
  });
}

export interface KetQuaKhopBo {
  ok: boolean;
  loi?: string;
}

/**
 * Với hàng Bộ (áo + quần), May áo và May quần là 2 khâu TÁCH RIÊNG trong cùng 1
 * lệnh cắt. Việc kiểm tra "không vượt khâu liền trước" (tranSoLuong) chỉ so với
 * ĐÚNG 1 khâu ngay trước đó trong mảng phanCong - nếu quy trình là
 * ...May áo -> May quần -> Khuy nút -> Ủi..., khâu Khuy nút/Ủi chỉ bị so với
 * May quần, không hề biết May áo có làm ĐỦ số tương ứng hay chưa. Hàng có thể
 * bị đóng gói/ủi thiếu áo hoặc thiếu quần mà hệ thống không phát hiện.
 *
 * Hàm này so khớp số ĐẠT của May áo và May quần khi CẢ HAI đã khai báo - dùng
 * cho các khâu SAU khi cả áo và quần đã gộp lại (Khuy nút, Ủi, Đóng gói...).
 */
export function kiemTraKhopBo(lc: LenhCat, pc: any): KetQuaKhopBo {
  if (!laHangBo(lc)) return { ok: true };

  const mayAo = timCongDoan(lc, "mayao");
  const mayQuan = timCongDoan(lc, "mayquan");
  if (!mayAo || !mayQuan) return { ok: true }; // lệnh cắt không tách riêng 2 khâu này

  // Đang đứng ở chính khâu May áo/May quần thì chưa cần so - 1 trong 2 vế có thể
  // chưa xong, đó là chuyện bình thường.
  const idHienTai = (pc?.id || "").toLowerCase();
  if (idHienTai === (mayAo.id || "").toLowerCase() || idHienTai === (mayQuan.id || "").toLowerCase()) {
    return { ok: true };
  }

  const kqAo = tongKhaiBao(mayAo);
  const kqQuan = tongKhaiBao(mayQuan);
  if (!kqAo.daKhaiBao || !kqQuan.daKhaiBao) {
    return {
      ok: false,
      loi: `Hàng Bộ cần cả May áo và May quần đều đã khai báo số lượng trước khi qua "${pc?.tenCongDoan || "khâu này"}". Hiện ${!kqAo.daKhaiBao ? "May áo" : "May quần"} chưa khai báo.`,
    };
  }
  if (kqAo.slDat !== kqQuan.slDat) {
    return {
      ok: false,
      loi: `Chưa đủ bộ: May áo đạt ${kqAo.slDat.toLocaleString("vi-VN")} nhưng May quần đạt ${kqQuan.slDat.toLocaleString("vi-VN")}. Cần khớp số nhau mới chuyển "${pc?.tenCongDoan || "khâu tiếp theo"}" được (thiếu ${Math.abs(kqAo.slDat - kqQuan.slDat).toLocaleString("vi-VN")} ở bên ${kqAo.slDat < kqQuan.slDat ? "áo" : "quần"}).`,
    };
  }
  return { ok: true };
}

export interface KetQuaKiemTra {
  ok: boolean;
  /** Lý do không cho hoàn thành (hiển thị cho người dùng) */
  loi?: string;
  slDat: number;
  slLoi: number;
}

/**
 * Kiểm tra trước khi cho phép bấm "Hoàn thành" 1 công đoạn.
 *
 * - Bắt buộc khai báo số đạt/lỗi theo màu (nếu lệnh cắt có màu).
 * - Chặn số đạt vượt quá số đạt của khâu liền trước.
 */
export function kiemTraTruocHoanThanh(lc: LenhCat, pc: any): KetQuaKiemTra {
  const { slDat, slLoi, daKhaiBao } = tongKhaiBao(pc);

  if (!daKhaiBao) {
    if (coMauThat(lc)) {
      return {
        ok: false,
        loi: "Chưa khai báo số lượng đạt/lỗi theo màu. Bấm vào từng card màu để khai báo trước khi hoàn thành công đoạn.",
        slDat: 0,
        slLoi: 0,
      };
    }
    // Lệnh cắt không có màu -> chấp nhận lấy số lượng giao cho công đoạn
    const slFallback = Number(pc?.soLuong) || Number(lc?.tongSL) || 0;
    return { ok: true, slDat: slFallback, slLoi: 0 };
  }

  if (slDat + slLoi === 0) {
    return {
      ok: false,
      loi: "Số lượng đạt và lỗi đều bằng 0. Vui lòng khai báo lại số lượng thực tế.",
      slDat,
      slLoi,
    };
  }

  const tran = tranSoLuong(lc, pc);
  if (tran !== null && slDat + slLoi > tran) {
    const truoc = congDoanTruoc(lc, pc);
    return {
      ok: false,
      loi: `Tổng số khai báo (${(slDat + slLoi).toLocaleString("vi-VN")}) vượt quá số đạt của khâu trước "${truoc?.tenCongDoan || "?"}" (${tran.toLocaleString("vi-VN")}). Vui lòng kiểm tra lại.`,
      slDat,
      slLoi,
    };
  }

  const khopBo = kiemTraKhopBo(lc, pc);
  if (!khopBo.ok) {
    return { ok: false, loi: khopBo.loi, slDat, slLoi };
  }

  return { ok: true, slDat, slLoi };
}

// ============================================
// TỔNG HỢP LỖI THEO LỆNH CẮT (cho quản lý)
// ============================================

export interface ThongKeLoiCongDoan {
  congDoanId: string;
  tenCongDoan: string;
  nguoiTen?: string;
  slDat: number;
  slLoi: number;
  /** % lỗi trên tổng nhận của khâu đó */
  tiLeLoi: number;
}

export interface ThongKeLoiLenhCat {
  maLenhCat: string;
  tenSP: string;
  tongSLCat: number;
  tongLoi: number;
  tiLeLoiChung: number;
  /** Khâu có số lỗi cao nhất */
  khauLoiNhieuNhat?: ThongKeLoiCongDoan;
  chiTiet: ThongKeLoiCongDoan[];
}

/** Tổng hợp hao hụt theo từng khâu của 1 lệnh cắt. */
export function thongKeLoiLenhCat(lc: LenhCat): ThongKeLoiLenhCat {
  const chiTiet: ThongKeLoiCongDoan[] = (lc?.phanCong || [])
    .map((pc: any) => {
      const { slDat, slLoi, daKhaiBao } = tongKhaiBao(pc);
      if (!daKhaiBao) return null;
      const tongNhan = slDat + slLoi;
      return {
        congDoanId: pc.id,
        tenCongDoan: pc.tenCongDoan,
        nguoiTen: pc.nguoiTen,
        slDat,
        slLoi,
        tiLeLoi: tongNhan > 0 ? (slLoi / tongNhan) * 100 : 0,
      } as ThongKeLoiCongDoan;
    })
    .filter((x): x is ThongKeLoiCongDoan => x !== null);

  const tongLoi = chiTiet.reduce((s, x) => s + x.slLoi, 0);
  const tongSLCat = Number(lc?.tongSL) || 0;
  const khauLoiNhieuNhat = chiTiet.length > 0
    ? chiTiet.reduce((max, x) => (x.slLoi > max.slLoi ? x : max), chiTiet[0])
    : undefined;

  return {
    maLenhCat: lc.id,
    tenSP: lc.tenSP,
    tongSLCat,
    tongLoi,
    tiLeLoiChung: tongSLCat > 0 ? (tongLoi / tongSLCat) * 100 : 0,
    khauLoiNhieuNhat: khauLoiNhieuNhat && khauLoiNhieuNhat.slLoi > 0 ? khauLoiNhieuNhat : undefined,
    chiTiet,
  };
}
