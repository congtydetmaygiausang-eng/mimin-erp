import type { UploadedFile } from "@/components/ui/ImageUploader";

export type TrangThaiPhieuDatNcc = "Nháp" | "Đã gửi NCC" | "NCC xác nhận" | "Đang dệt" | "Hoàn thành" | "Đã giao";

export interface LichSuTrangThaiPhieuDatNcc {
  trangThai: TrangThaiPhieuDatNcc;
  thoiGian: string;
  nguoiCapNhat: string;
  ghiChu?: string;
}

export type TrangThaiVatTuDatSanXuat = "Đang dùng" | "Tạm ngưng";

export interface VatTuDatSanXuat {
  id: string;
  maMau: string;
  tenMau: string;
  loai: string;
  mauSac: string;
  quyCach: string;
  donVi: string;
  maNccMacDinh: string;
  giaMuaThamKhao: number;
  giaBanDeXuat: number;
  soLuongToiThieu: number;
  thoiGianSanXuat: number;
  maKhachHangSoHuu: string;
  hinhAnh: string;
  dungChung: boolean;
  trangThai: TrangThaiVatTuDatSanXuat;
  createdAt: string;
  updatedAt: string;
}

export interface PhieuDatNccLineItem {
  id: string;
  maVatTu: string;
  tenVatTu: string;
  mauSac: string;
  quyCach: string;
  donVi: string;
  soLuong: number;
  donGiaMua: number;
  donGiaBan: number;
  hinhAnh: string;
}

export interface PhieuDatNccPhuLieu {
  id: string;
  maPhieu: string;
  ngayDat: string;
  ngayGiao: string;
  nguoiTao?: string;
  maKhachHang: string;
  maNcc: string;
  ownerOrganizationId?: string;
  supplierOrganizationId?: string;
  customerOrganizationId?: string;
  maVatTu: string;
  tenVatTu: string;
  mauSac: string;
  quyCach: string;
  donVi: string;
  soLuong: number;
  donGiaMua: number;
  donGiaBan: number;
  phiVanChuyen: number;
  chiPhiKhac: number;
  thueVat: number;
  giaoThangKhach: boolean;
  diaChiGiao: string;
  ghiChu: string;
  hinhAnh: UploadedFile[];
  items?: PhieuDatNccLineItem[];
  trangThai: TrangThaiPhieuDatNcc;
  createdAt: string;
  updatedAt?: string;
  lichSuTrangThai?: LichSuTrangThaiPhieuDatNcc[];
}

export function tinhTongTienPhieuDatNcc(input: Pick<PhieuDatNccPhuLieu, "soLuong" | "donGiaMua" | "donGiaBan" | "phiVanChuyen" | "chiPhiKhac" | "thueVat">) {
  const tienMua = input.soLuong * input.donGiaMua;
  const doanhThu = input.soLuong * input.donGiaBan;
  const giaVon = tienMua + input.phiVanChuyen + input.chiPhiKhac;
  const loiNhuan = doanhThu - giaVon;
  const vatDauRa = doanhThu * input.thueVat / 100;
  return { tienMua, doanhThu, giaVon, loiNhuan, vatDauRa, tongHoaDon: doanhThu + vatDauRa, bienLoiNhuan: doanhThu > 0 ? loiNhuan / doanhThu * 100 : 0 };
}
