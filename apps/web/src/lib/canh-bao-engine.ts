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
export function tinhTatCaCanhBao(tasks?: any[], kho?: any[], congNo?: any[]): CanhBao[] {
  const dsKho = kho || DEMO_KHO;
  const dsCongNo = congNo || DEMO_CONG_NO;
  const dsTasks = tasks || ALL_REAL_PHIEU;

  const canhBaos: CanhBao[] = [];

  // 1. Kho sắp hết
  for (const k of dsKho) {
    if (k.sl < k.tonThap) {
      const ratio = k.sl / k.tonThap;
      const mucDo: MucDoCanhBao = ratio < 0.3 ? "cao" : ratio < 0.6 ? "trung-binh" : "thap";
      canhBaos.push({
        id: `kho-${k.sku}`,
        loai: "kho-sap-het",
        mucDo,
        tieuDe: `Kho sắp hết: ${k.ten}`,
        noiDung: `SKU ${k.sku} chỉ còn ${k.sl} ${k.donVi} (định mức: ${k.tonThap}). Cần nhập thêm.`,
        doiTuong: k.ten,
        thoiGian: new Date().toISOString(),
        giaTri: k.sl,
        donVi: k.donVi,
        lienKet: `/kho-vai-tinhmann`,
      });
    }
  }

  // 2. LSX quá hạn
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
          lienKet: `/lsx-m758-demo`,
        });
      }
    }
  }

  // 3. Công nợ KH quá hạn
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

  // 4. NV không update SL trong 3 ngày (chỉ check CN có tasks đang làm)
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
          lienKet: `/test-phan-quyen`,
        });
      }
    }
  }

  // 5. NCC có công nợ vượt hạn mức tín dụng
  // Mỗi NCC có hanMucTinDung (mặc định = 500 triệu); nếu congNo > hanMuc → cảnh báo
  for (const ncc of DEMO_NCC) {
    if (ncc.congNo > ncc.hanMuc) {
      const vuot = ncc.congNo - ncc.hanMuc;
      const ptVuot = (vuot / ncc.hanMuc) * 100;
      canhBaos.push({
        id: `ncc-vuot-${ncc.id}`,
        loai: "ncc-vuot-han-muc",
        mucDo: ptVuot > 100 ? "cao" : ptVuot > 30 ? "trung-binh" : "thap",
        tieuDe: `NCC vượt hạn mức: ${ncc.ten}`,
        noiDung: `Công nợ ${(ncc.congNo/1_000_000).toFixed(0)}tr vượt hạn mức ${(ncc.hanMuc/1_000_000).toFixed(0)}tr (${ptVuot.toFixed(0)}%). Vui lòng thanh toán hoặc đàm phán tăng hạn mức.`,
        doiTuong: ncc.ten,
        thoiGian: new Date().toISOString(),
        giaTri: vuot,
        donVi: "VND",
        lienKet: "/master-data/",
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
