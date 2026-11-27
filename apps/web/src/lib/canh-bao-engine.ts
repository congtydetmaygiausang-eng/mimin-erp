/**
 * Cảnh báo real-time Engine (Production Grade)
 * - Quét dữ liệu thực tế từ hệ thống ERP: Lệnh Cắt, Kế Hoạch SX, Kho Vải & Phụ Liệu, Gia Công, Đối Soát Tiền Công
 * - Tối ưu hóa thông minh: Không spam 100+ thông báo lẻ, gom nhóm có giá trị hành động (Actionable)
 * - Loại bỏ hoàn toàn mock data giả
 */

import { formatVNDShort } from "./data/real-data";

export type LoaiCanhBao = "kho-sap-het" | "lsx-qua-han" | "cong-no-qua-han" | "cn-tre-sl" | "ncc-vuot-han-muc";
export type MucDoCanhBao = "thap" | "trung-binh" | "cao";

export interface CanhBao {
  id: string;
  loai: LoaiCanhBao;
  mucDo: MucDoCanhBao;
  tieuDe: string;
  noiDung: string;
  doiTuong: string;       // Tên NV/KH/NCC/LSX/SKU
  lienKet?: string;       // URL
  thoiGian: string;       // ISO date
  giaTri?: number;        // Giá trị liên quan (SL, tiền, ngày)
  donVi?: string;
}

const TODAY = new Date();

/**
 * Tính tất cả cảnh báo thông minh, chính xác từ dữ liệu thực tế
 */
export function tinhTatCaCanhBao(
  tasks?: any[],
  kho?: any[],
  congNo?: any[],
  lenhCat?: any[],
  khachHang?: any[],
  phanCongList?: any[]
): CanhBao[] {
  const dsKho = kho || [];
  const dsLenhCat = lenhCat || [];
  const dsPhanCong = phanCongList || [];

  const canhBaos: CanhBao[] = [];

  // =========================================================================
  // 1. QUÉT LỆNH CẮT & SẢN XUẤT THỰC TẾ (Chỉ xét lệnh đang hoạt động)
  // =========================================================================
  const activeLenhCat = dsLenhCat.filter(
    (lc) => lc.trangThai !== "HoanThanh" && lc.trangThai !== "DaGiao" && lc.trangThai !== "Huy"
  );

  if (activeLenhCat.length > 0) {
    // 1.1 Lệnh sản xuất đang triển khai trễ hạn
    const overdueOrders = activeLenhCat
      .map((lc) => {
        const han = lc.hanHoanThanh || lc.hanGiao;
        if (!han) return null;
        const hanDate = new Date(han);
        const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
        return soNgayTre > 0 ? { lc, soNgayTre, han } : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.soNgayTre - a.soNgayTre);

    if (overdueOrders.length > 0) {
      // Chỉ lấy Top 3 lệnh trễ hạn nghiêm trọng nhất để quản lý tập trung xử lý
      const topOverdue = overdueOrders.slice(0, 3);
      for (const { lc, soNgayTre, han } of topOverdue) {
        const mucDo: MucDoCanhBao = soNgayTre > 7 ? "cao" : soNgayTre > 2 ? "trung-binh" : "thap";
        const sl = lc.tongSL || lc.soLuong || 0;
        canhBaos.push({
          id: `lc-qua-han-${lc.id}`,
          loai: "lsx-qua-han",
          mucDo,
          tieuDe: `Lệnh cắt trễ hạn: ${lc.id}`,
          noiDung: `Trễ ${soNgayTre} ngày (hạn: ${han}). Mã SP: ${lc.tenSP} (${sl.toLocaleString()} SP). Cần đôn đốc chuyền.`,
          doiTuong: lc.tenSP,
          thoiGian: new Date().toISOString(),
          giaTri: soNgayTre,
          donVi: "ngày",
          lienKet: "/lenh-cat",
        });
      }

      // Nếu có thêm các lệnh khác trễ hạn, gom thành 1 thông báo tổng quan
      if (overdueOrders.length > 3) {
        const remainingCount = overdueOrders.length - 3;
        canhBaos.push({
          id: "lc-qua-han-tong-hop",
          loai: "lsx-qua-han",
          mucDo: "trung-binh",
          tieuDe: `Tiến độ: Còn ${remainingCount} lệnh sản xuất khác trễ hạn`,
          noiDung: `Tổng cộng ${overdueOrders.length} lệnh sản xuất chưa hoàn tất theo kế hoạch. Nhấn để kiểm tra và điều phối lại tiến độ chuyền.`,
          doiTuong: "Kế hoạch sản xuất",
          thoiGian: new Date().toISOString(),
          giaTri: remainingCount,
          donVi: "lệnh",
          lienKet: "/bang-dieu-hanh-sx",
        });
      }
    }

    // 1.2 Lệnh đang cắt nhưng chưa chốt SL thực tế (Single Source of Truth qua TyLeSizeModal)
    const dangCatChuaChot = activeLenhCat.filter(
      (lc) => lc.trangThai === "DangCat" && (!lc.tongSLThucTe || lc.tongSLThucTe === 0)
    );
    for (const lc of dangCatChuaChot.slice(0, 2)) {
      canhBaos.push({
        id: `lc-chua-chot-cat-${lc.id}`,
        loai: "cn-tre-sl",
        mucDo: "trung-binh",
        tieuDe: `Tổ Cắt chưa chốt số lượng: ${lc.id}`,
        noiDung: `Lệnh đang cắt chưa nhập số lượng thực tế qua TyLeSizeModal để chuyển giao khâu In/Thêu (${lc.tenSP}).`,
        doiTuong: lc.phuTrachCat || "Tổ Cắt",
        thoiGian: new Date().toISOString(),
        lienKet: "/to-cat-work",
      });
    }

    // 1.3 Sản phẩm lỗi / phế phẩm công đoạn (Defect Tracking)
    for (const lc of activeLenhCat) {
      if (Array.isArray(lc.phanCong)) {
        for (const pc of lc.phanCong) {
          const soLuongLoi = pc.soLuongLoi || 0;
          if (soLuongLoi > 0 || pc.trangThaiCD === "co_loi") {
            if (canhBaos.filter((c) => c.id.startsWith("lc-loi-")).length < 2) {
              const nguoiNhan =
                pc.nguoiTen ||
                (typeof pc.nguoiPhuTrach === "object" ? pc.nguoiPhuTrach?.ten : pc.nguoiPhuTrach) ||
                "Xưởng May";
              canhBaos.push({
                id: `lc-loi-${lc.id}-${pc.id}`,
                loai: "cn-tre-sl",
                mucDo: "cao",
                tieuDe: `Sản phẩm lỗi tại ${lc.id}: ${pc.tenCongDoan || "Công đoạn"}`,
                noiDung: `Phát hiện ${soLuongLoi} SP lỗi cần xử lý sửa lại (${lc.tenSP}). Đơn vị nhận: ${nguoiNhan}.`,
                doiTuong: nguoiNhan,
                thoiGian: new Date().toISOString(),
                giaTri: soLuongLoi,
                donVi: "SP",
                lienKet: "/to-may-work",
              });
            }
          }
        }
      }
    }
  }

  // =========================================================================
  // 2. QUÉT ĐIỀU PHỐI VẬT TƯ KHSX (Từ kho dữ liệu điều phối KHSX)
  // =========================================================================
  if (typeof window !== "undefined") {
    try {
      const rawDp = localStorage.getItem("mimin_dieu_phoi_khsx_v1");
      if (rawDp) {
        const dpMap = JSON.parse(rawDp);
        const thieuVatTuList = Object.values(dpMap).filter(
          (dp: any) => dp.trangThaiVai === "thieu_vai" || dp.trangThaiBo === "thieu_bo"
        );
        if (thieuVatTuList.length > 0) {
          canhBaos.push({
            id: "dieu-phoi-thieu-vat-tu",
            loai: "kho-sap-het",
            mucDo: "trung-binh",
            tieuDe: `Điều phối KHSX: ${thieuVatTuList.length} lệnh chưa đủ vật tư vào chuyền`,
            noiDung: `Có ${thieuVatTuList.length} lệnh cắt đang chuẩn bị triển khai nhưng thiếu Vải chính hoặc Bo cổ. Cần kiểm tra kho hoặc giục NCC.`,
            doiTuong: "Điều phối KHSX",
            thoiGian: new Date().toISOString(),
            giaTri: thieuVatTuList.length,
            donVi: "lệnh",
            lienKet: "/ke-hoach-san-xuat",
          });
        }
      }
    } catch {}
  }

  // =========================================================================
  // 3. QUÉT GIA CÔNG NGOÀI THỰC TẾ (Trễ hẹn giao hàng)
  // =========================================================================
  if (dsPhanCong.length > 0) {
    const pcTre = dsPhanCong.filter((pc) => {
      if (pc.trangThai === "Hoàn thành" || pc.trangThai === "Đã thanh toán" || !pc.ngayXongDuKien) return false;
      const hanDate = new Date(pc.ngayXongDuKien);
      return (TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24) > 0;
    });

    if (pcTre.length > 0) {
      for (const pc of pcTre.slice(0, 2)) {
        const hanDate = new Date(pc.ngayXongDuKien);
        const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
        const tenDoiTac =
          pc.nguoiPhuTrach?.ten || (typeof pc.nguoiPhuTrach === "string" ? pc.nguoiPhuTrach : "") || pc.nguoiTen || "Xưởng gia công";
        canhBaos.push({
          id: `pc-tre-${pc.id}`,
          loai: "lsx-qua-han",
          mucDo: soNgayTre > 3 ? "cao" : "trung-binh",
          tieuDe: `Gia công trễ hẹn: ${pc.congDoan || "May gia công"}`,
          noiDung: `Đơn vị "${tenDoiTac}" quá hạn ${soNgayTre} ngày (SL: ${(pc.soLuongGiao || 0).toLocaleString()} SP). Cần liên hệ thúc giục giao hàng.`,
          doiTuong: tenDoiTac,
          thoiGian: new Date().toISOString(),
          giaTri: soNgayTre,
          donVi: "ngày",
          lienKet: "/to-may-work",
        });
      }
    }
  }

  // =========================================================================
  // 4. QUÉT KHO VẢI & PHỤ LIỆU (Tối ưu hóa: Không spam 100+ thông báo lẻ)
  // =========================================================================
  if (dsKho.length > 0) {
    const dsKhoPL = dsKho.filter(
      (k) =>
        !((k.sku || "").toLowerCase().includes("vai") ||
          (k.ten || "").toLowerCase().includes("vải") ||
          (k.sku || "").startsWith("V-"))
    );
    const dsKhoVai = dsKho.filter(
      (k) =>
        (k.sku || "").toLowerCase().includes("vai") ||
        (k.ten || "").toLowerCase().includes("vải") ||
        (k.sku || "").startsWith("V-")
    );

    // 4.1 Gom toàn bộ Phụ liệu dưới ngưỡng an toàn thành ĐÚNG 1 thông báo tổng hợp
    const lowPL = dsKhoPL.filter((k) => k.sl < k.tonThap);
    if (lowPL.length > 0) {
      const outOfStockCount = lowPL.filter((k) => k.sl <= 0).length;
      const top3Names = lowPL
        .slice(0, 3)
        .map((k) => k.ten || k.sku)
        .join(", ");

      canhBaos.push({
        id: "kho-phu-lieu-tong-hop",
        loai: "kho-sap-het",
        mucDo: outOfStockCount > 5 ? "cao" : "trung-binh",
        tieuDe: `Tồn kho phụ liệu: Có ${lowPL.length} mã chạm ngưỡng an toàn`,
        noiDung: `Đang có ${lowPL.length} loại phụ liệu tồn thấp (${outOfStockCount > 0 ? `${outOfStockCount} loại hết hàng, ` : ""}như ${top3Names}...). Cần kiểm tra và lập đơn đặt NCC.`,
        doiTuong: "Kho Phụ Liệu",
        thoiGian: new Date().toISOString(),
        giaTri: lowPL.length,
        donVi: "loại VT",
        lienKet: "/phieu-dat-ncc-phu-lieu",
      });
    }

    // 4.2 Vải chính cạn kiệt (Chỉ cảnh báo khi thực sự cạn <= 50kg/m hoặc = 0, tối đa 2 loại)
    const criticalVai = dsKhoVai.filter((k) => k.sl <= 50);
    if (criticalVai.length > 0) {
      for (const v of criticalVai.slice(0, 2)) {
        canhBaos.push({
          id: `kho-vai-${v.sku}`,
          loai: "kho-sap-het",
          mucDo: v.sl <= 0 ? "cao" : "trung-binh",
          tieuDe: `Kho Vải cạn kiệt: ${v.ten || v.sku}`,
          noiDung: `Mã vải ${v.sku} hiện chỉ còn ${v.sl <= 0 ? "0 (Hết)" : v.sl} ${v.donVi || "kg"} (ngưỡng an toàn: ${v.tonThap} ${v.donVi || "kg"}). Cần nhập gấp để cấp cho lệnh cắt.`,
          doiTuong: "Kho Vải",
          thoiGian: new Date().toISOString(),
          giaTri: v.sl,
          donVi: v.donVi,
          lienKet: "/kho-vai-tinhmann",
        });
      }
    }
  }

  // =========================================================================
  // 5. QUÉT ĐỐI SOÁT TIỀN CÔNG (Khiếu nại chưa xử lý)
  // =========================================================================
  if (typeof window !== "undefined") {
    try {
      const rawDs = localStorage.getItem("mimin_doi_soat_records_v1");
      if (rawDs) {
        const dsRecords = JSON.parse(rawDs);
        const khieuNaiList = (Array.isArray(dsRecords) ? dsRecords : []).filter(
          (r: any) => r.trangThai === "Có khiếu nại" || Boolean(r.khieuNai)
        );
        if (khieuNaiList.length > 0) {
          canhBaos.push({
            id: "doi-soat-co-khieu-nai",
            loai: "cong-no-qua-han",
            mucDo: "cao",
            tieuDe: `Đối soát tiền công: ${khieuNaiList.length} trường hợp khiếu nại`,
            noiDung: `Phát hiện ${khieuNaiList.length} bản ghi đối soát tiền công đang có khiếu nại từ nhân sự/thợ. Cần kế toán kiểm tra và xử lý ngay.`,
            doiTuong: "Kế toán tiền công",
            thoiGian: new Date().toISOString(),
            giaTri: khieuNaiList.length,
            donVi: "vụ",
            lienKet: "/doi-soat-tien-cong",
          });
        }
      }
    } catch {}
  }

  // Sắp xếp ưu tiên: P0 (Cao) lên đầu, tiếp đến P1 (Trung bình), P2 (Thấp)
  return canhBaos.sort((a, b) => {
    const priority: Record<MucDoCanhBao, number> = { "cao": 0, "trung-binh": 1, "thap": 2 };
    return priority[a.mucDo] - priority[b.mucDo];
  });
}

/**
 * Tổng kết cảnh báo theo mức độ
 */
export function thongKeCanhBao(cbs: CanhBao[]) {
  return {
    tong: cbs.length,
    cao: cbs.filter((c) => c.mucDo === "cao").length,
    trungBinh: cbs.filter((c) => c.mucDo === "trung-binh").length,
    thap: cbs.filter((c) => c.mucDo === "thap").length,
    theoLoai: {
      "kho-sap-het": cbs.filter((c) => c.loai === "kho-sap-het").length,
      "lsx-qua-han": cbs.filter((c) => c.loai === "lsx-qua-han").length,
      "cong-no-qua-han": cbs.filter((c) => c.loai === "cong-no-qua-han").length,
      "cn-tre-sl": cbs.filter((c) => c.loai === "cn-tre-sl").length,
      "ncc-vuot-han-muc": cbs.filter((c) => c.loai === "ncc-vuot-han-muc").length,
    },
  };
}
