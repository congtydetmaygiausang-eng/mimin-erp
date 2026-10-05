/**
 * Cảnh báo real-time Engine
 * - Kho sắp hết (sl < tonThap)
 * - LSX quá hạn (deadline < today && chưa hoàn thành)
 * - Công nợ KH quá hạn
 * - NV không update SL trong 3 ngày
 * - Công nợ NCC vượt hạn mức
 */

import { ALL_REAL_PHIEU } from "./real-workflow-data";
import { KH_SI_FULL } from "./master-data-full";
import { NCC_FULL } from "./master-data-full";
import { CONG_NHAN_13 } from "./congnhan-13";
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
const THREE_DAYS_AGO = new Date(TODAY.getTime() - 3 * 24 * 60 * 60 * 1000);

/**
 * Tính tất cả cảnh báo
 */
export function tinhTatCaCanhBao(
  tasks?: any[],
  kho?: any[],
  congNo?: any[],
  lenhCat?: any[],
  khachHang?: any[],
  phanCongList?: any[]
): CanhBao[] {
  const dsKho = kho || DEMO_KHO;
  const dsCongNo = congNo || DEMO_CONG_NO;
  const dsTasks = tasks || ALL_REAL_PHIEU;
  const dsLenhCat = lenhCat || [];
  const dsPhanCong = phanCongList || [];

  const canhBaos: CanhBao[] = [];

  // 1. Quét Lệnh Cắt thực tế (quá hạn giao / có lỗi công đoạn / thiếu sơ đồ)
  if (dsLenhCat.length > 0) {
    for (const lc of dsLenhCat) {
      // 1.1 Quá hạn giao
      const han = lc.hanHoanThanh || lc.hanGiao;
      if (han && lc.trangThai !== "HoanThanh") {
        const hanDate = new Date(han);
        const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
        if (soNgayTre > 0) {
          const mucDo: MucDoCanhBao = soNgayTre > 5 ? "cao" : soNgayTre > 2 ? "trung-binh" : "thap";
          const sl = lc.tongSL || lc.soLuong || 0;
          canhBaos.push({
            id: `lc-qua-han-${lc.id}`,
            loai: "lsx-qua-han",
            mucDo,
            tieuDe: `Lệnh cắt quá hạn giao: ${lc.id}`,
            noiDung: `Trễ ${soNgayTre} ngày so với hạn chót (${han}). Sản phẩm: ${lc.tenSP} (${sl.toLocaleString()} SP).`,
            doiTuong: lc.tenSP,
            thoiGian: new Date().toISOString(),
            giaTri: soNgayTre,
            donVi: "ngày",
            lienKet: "/lenh-cat",
          });
        }
      }

      // 1.2 Lệnh đang cắt nhưng chưa chốt SL thực tế (Single Source of Truth)
      if (lc.trangThai === "DangCat" && (!lc.tongSLThucTe || lc.tongSLThucTe === 0)) {
        canhBaos.push({
          id: `lc-chua-chot-cat-${lc.id}`,
          loai: "cn-tre-sl",
          mucDo: "trung-binh",
          tieuDe: `Tổ Cắt chưa chốt số lượng thực tế: ${lc.id}`,
          noiDung: `Lệnh đang cắt nhưng chưa nhập số lượng thực tế qua TyLeSizeModal để chuyển khâu In/Thêu (${lc.tenSP}).`,
          doiTuong: lc.phuTrachCat || "Tổ Cắt",
          thoiGian: new Date().toISOString(),
          lienKet: "/to-cat-work",
        });
      }

      // 1.3 Lệnh đã tạo nhưng chưa có sơ đồ cắt
      if (lc.trangThai === "DaTao" && !lc.daCoSoDo && !lc.soDoChinh) {
        canhBaos.push({
          id: `lc-thieu-so-do-${lc.id}`,
          loai: "lsx-qua-han",
          mucDo: "thap",
          tieuDe: `Chưa có sơ đồ cắt: ${lc.id}`,
          noiDung: `Lệnh sản xuất đã duyệt nhưng chưa đính kèm file sơ đồ cắt (.PLT/PDF) để trải vải.`,
          doiTuong: lc.phuTrachSoDo || "Phòng Kỹ Thuật",
          thoiGian: new Date().toISOString(),
          lienKet: "/lenh-cat",
        });
      }

      // 1.4 Công đoạn có lỗi / phế phẩm
      if (Array.isArray(lc.phanCong)) {
        for (const pc of lc.phanCong) {
          const soLuongLoi = pc.soLuongLoi || 0;
          if (soLuongLoi > 0 || pc.trangThaiCD === "co_loi") {
            const nguoiNhan = pc.nguoiTen || (typeof pc.nguoiPhuTrach === "object" ? pc.nguoiPhuTrach?.ten : pc.nguoiPhuTrach) || pc.nguoiNhan || "Xưởng May";
            canhBaos.push({
              id: `lc-loi-${lc.id}-${pc.id}`,
              loai: "cn-tre-sl",
              mucDo: "cao",
              tieuDe: `Sản phẩm lỗi tại ${lc.id}: ${pc.tenCongDoan || "Công đoạn"}`,
              noiDung: `Phát hiện ${soLuongLoi} SP lỗi cần sửa lại trước khi sang khâu tiếp theo (${lc.tenSP}). Đơn vị nhận: ${nguoiNhan}.`,
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

  // 1.5 Quét phân công gia công ngoài thực tế (trễ hạn / đôn đốc)
  if (dsPhanCong.length > 0) {
    for (const pc of dsPhanCong) {
      if (pc.trangThai !== "Hoàn thành" && pc.trangThai !== "Đã thanh toán" && pc.ngayXongDuKien) {
        const hanDate = new Date(pc.ngayXongDuKien);
        const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
        if (soNgayTre > 0) {
          const tenDoiTac = pc.nguoiPhuTrach?.ten || "Xưởng gia công";
          canhBaos.push({
            id: `pc-tre-${pc.id}`,
            loai: "lsx-qua-han",
            mucDo: soNgayTre > 3 ? "cao" : "trung-binh",
            tieuDe: `Gia công trễ hạn: ${pc.congDoan} (${pc.maLenhCat})`,
            noiDung: `Đơn vị "${tenDoiTac}" trễ ${soNgayTre} ngày so với ngày hẹn giao (${pc.ngayXongDuKien}). Số lượng: ${pc.soLuongGiao} SP.`,
            doiTuong: tenDoiTac,
            thoiGian: new Date().toISOString(),
            giaTri: soNgayTre,
            donVi: "ngày",
            lienKet: "/to-may-work",
          });
        }
      }
    }
  }

  // 2. Kho sắp hết
  for (const k of dsKho) {
    if (k.sl < k.tonThap) {
      const ratio = k.tonThap > 0 ? k.sl / k.tonThap : 0;
      const mucDo: MucDoCanhBao = ratio < 0.2 || k.sl <= 0 ? "cao" : ratio < 0.6 ? "trung-binh" : "thap";
      const isVai = (k.sku || "").toLowerCase().includes("vai") || (k.ten || "").toLowerCase().includes("vải") || (k.sku || "").startsWith("V-");
      const slClean = k.sl <= 0 ? 0 : Math.round(k.sl * 10) / 10;
      const slDisplay = k.sl <= 0 ? "0 (Hết hàng)" : `${slClean.toLocaleString()} ${k.donVi}`;
      canhBaos.push({
        id: `kho-${k.sku}`,
        loai: "kho-sap-het",
        mucDo,
        tieuDe: `Kho sắp hết: ${k.ten || k.sku}`,
        noiDung: `Mã ${k.sku} hiện còn ${slDisplay} (ngưỡng an toàn: ${k.tonThap.toLocaleString()} ${k.donVi}). Cần đặt hàng bổ sung để tránh đứt gãy chuyền may.`,
        doiTuong: isVai ? "Kho Vải" : "Kho Phụ Liệu",
        thoiGian: new Date().toISOString(),
        giaTri: slClean,
        donVi: k.donVi,
        lienKet: isVai ? `/kho-vai-tinhmann` : `/kho-phu-lieu`,
      });
    }
  }

  // 3. LSX quá hạn (từ dsTasks nếu có)
  for (const t of dsTasks) {
    if (t.hanHoanThanh && t.trangThai !== "Hoàn thành") {
      const hanDate = new Date(t.hanHoanThanh);
      const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
      if (soNgayTre > 0) {
        const mucDo: MucDoCanhBao = soNgayTre > 7 ? "cao" : soNgayTre > 3 ? "trung-binh" : "thap";
        canhBaos.push({
          id: `lsx-${t.id}`,
          loai: "lsx-qua-han",
          mucDo,
          tieuDe: `LSX quá hạn: ${t.id} (${t.maSP})`,
          noiDung: `Trễ ${soNgayTre} ngày. NV: ${t.tenNguoiNhan}. Trạng thái: ${t.trangThai}.`,
          doiTuong: t.tenNguoiNhan || "",
          thoiGian: new Date().toISOString(),
          giaTri: soNgayTre,
          donVi: "ngày",
          lienKet: `/lenh-cat`,
        });
      }
    }
  }

  // 4. Công nợ KH quá hạn
  for (const c of dsCongNo) {
    if (c.han && c.status !== "da-thu") {
      const hanDate = new Date(c.han);
      const soNgayTre = Math.floor((TODAY.getTime() - hanDate.getTime()) / (1000 * 60 * 60 * 24));
      if (soNgayTre > 0) {
        const mucDo: MucDoCanhBao = soNgayTre > 30 ? "cao" : soNgayTre > 14 ? "trung-binh" : "thap";
        canhBaos.push({
          id: `cn-${c.id}`,
          loai: "cong-no-qua-han",
          mucDo,
          tieuDe: `Công nợ quá hạn: ${c.kh}`,
          noiDung: `Nợ ${(c.no / 1_000_000).toFixed(1)} tr đã quá hạn ${soNgayTre} ngày. Cần liên hệ thu hồi.`,
          doiTuong: c.kh,
          thoiGian: new Date().toISOString(),
          giaTri: c.no,
          donVi: "đ",
          lienKet: `/cong-no`,
        });
      }
    }
  }

  // 5. NV không update SL trong 3 ngày (chỉ check CN có tasks đang làm)
  for (const cn of CONG_NHAN_13) {
    const lastTask = dsTasks
      .filter((t) => t.nguoiNhan === cn.maNV)
      .sort((a, b) => (b.ngayNhan || b.ngayGiao || "").localeCompare(a.ngayNhan || a.ngayGiao || ""))[0];

    if (lastTask) {
      const lastUpdate = new Date(lastTask.ngayNhan || lastTask.ngayGiao || "");
      const soNgay = Math.floor((TODAY.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      if (soNgay >= 3 && lastTask.trangThai !== "Hoàn thành") {
        canhBaos.push({
          id: `cn-tre-${cn.maNV}`,
          loai: "cn-tre-sl",
          mucDo: soNgay >= 7 ? "cao" : "trung-binh",
          tieuDe: `NV không cập nhật SL: ${cn.name}`,
          noiDung: `${soNgay} ngày chưa update. Task hiện tại: ${lastTask.id} (${lastTask.maSP}).`,
          doiTuong: cn.name,
          thoiGian: new Date().toISOString(),
          giaTri: soNgay,
          donVi: "ngày",
          lienKet: `/to-may-work`,
        });
      }
    }
  }

  // 6. NCC có công nợ vượt hạn mức tín dụng
  for (const ncc of DEMO_NCC) {
    if (ncc.congNo > ncc.hanMuc) {
      const vuot = ncc.congNo - ncc.hanMuc;
      const ptVuot = (vuot / ncc.hanMuc) * 100;
      canhBaos.push({
        id: `ncc-vuot-${ncc.id}`,
        loai: "ncc-vuot-han-muc",
        mucDo: ptVuot > 100 ? "cao" : ptVuot > 30 ? "trung-binh" : "thap",
        tieuDe: `NCC vượt hạn mức: ${ncc.ten}`,
        noiDung: `Công nợ ${formatVNDShort(ncc.congNo)} vượt hạn mức ${formatVNDShort(ncc.hanMuc)} (${ptVuot.toFixed(0)}%). Vui lòng thanh toán hoặc đàm phán tăng hạn mức.`,
        doiTuong: ncc.ten,
        thoiGian: new Date().toISOString(),
        giaTri: vuot,
        donVi: "VND",
        lienKet: "/phieu-dat-ncc-phu-lieu",
      });
    }
  }

  // Sort theo mức độ
  return canhBaos.sort((a, b) => {
    const priority = { "cao": 0, "trung-binh": 1, "thap": 2 };
    return priority[a.mucDo] - priority[b.mucDo];
  });
}

// Mock data nếu chưa có
const DEMO_KHO = [
  { sku: "VAI-COTTON-TRANG", ten: "Vải cotton trắng",   sl: 1200, donVi: "m",     tonThap: 500 },
  { sku: "VAI-POLO-XANH",    ten: "Vải polo xanh navy", sl: 350,  donVi: "m",     tonThap: 500 },
  { sku: "NUT-15MM",         ten: "Nút 15mm đen",        sl: 850,  donVi: "cái",   tonThap: 1000 },
  { sku: "CHI-POLY",         ten: "Chỉ polyester",       sl: 45,   donVi: "cuộn",  tonThap: 20 },
  { sku: "TUI-PVC",          ten: "Túi PVC đóng gói",    sl: 2500, donVi: "cái",   tonThap: 500 },
];

const DEMO_NCC = [
  { id: "NCC-01", ten: "Cty Sợi Thiên Hà",   congNo: 320_000_000, hanMuc: 500_000_000 },
  { id: "NCC-02", ten: "Dệt May Hòa Phát",   congNo: 580_000_000, hanMuc: 500_000_000 },
  { id: "NCC-03", ten: "Nhuộm Hoàng Long",   congNo: 195_000_000, hanMuc: 500_000_000 },
  { id: "NCC-04", ten: "Phụ liệu Minh Tâm",  congNo: 89_000_000,  hanMuc: 300_000_000 },
  { id: "NCC-05", ten: "Bo cổ Phú Thịnh",    congNo: 415_000_000, hanMuc: 400_000_000 },
];

const DEMO_CONG_NO = [
  { id: "CN001", kh: "Shop Mẹ Bé Xinh",     no: 45000000, han: "2026-08-15", status: "chua-thu" },
  { id: "CN002", kh: "Đại lý Thanh Hà",     no: 12300000, han: "2026-08-05", status: "chua-thu" },
  { id: "CN003", kh: "Shop Áo Thun Sỉ HN",   no: 8900000,  han: "2026-08-20", status: "da-thu-1-phan" },
  { id: "CN004", kh: "Đại lý Miền Tây",     no: 23400000, han: "2026-08-10", status: "chua-thu" },
];

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
