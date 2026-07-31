// Kho vải Tinh Mần - Engine riêng
import { fromStorage, saveToStorage } from "./storage-helper";

export interface LoVai {
  id: string;
  maLo: string;          // LVT-001
  loaiVai: string;       // "Cotton 30s"
  soMet: number;
  soMetConLai: number;
  donGia: number;        // VND/m
  giaTri: number;        // = soMet * donGia
  ngayNhap: string;
  nccId: string;
  viTri: string;
  trangThai: "con" | "het" | "khoa";
}

const KHO_VAI_KEY = "mimin_kho_vai";

export function getAllVai(): LoVai[] {
  return fromStorage<LoVai[]>(KHO_VAI_KEY, []);
}

export function saveAllVai(data: LoVai[]) {
  saveToStorage(KHO_VAI_KEY, data);
}

export function nhapVai(loaiVai: string, soMet: number, donGia: number, nccId: string) {
  const list = getAllVai();
  const lo: LoVai = {
    id: `LV${Date.now().toString().slice(-6)}`,
    maLo: `LVT-${(list.length + 1).toString().padStart(3, "0")}`,
    loaiVai,
    soMet,
    soMetConLai: soMet,
    donGia,
    giaTri: soMet * donGia,
    ngayNhap: new Date().toISOString().slice(0, 10),
    nccId,
    viTri: `Kệ A${Math.ceil((list.length + 1) / 5)}`,
    trangThai: "con",
  };
  list.push(lo);
  saveAllVai(list);
  return lo;
}

export function xuatVai(maLo: string, soMetXuat: number) {
  const list = getAllVai();
  const lo = list.find((l) => l.maLo === maLo);
  if (!lo) return { ok: false, message: `Không tìm thấy lô ${maLo}` };
  if (lo.soMetConLai < soMetXuat) return { ok: false, message: `Tồn kho không đủ (${lo.soMetConLai}m < ${soMetXuat}m)` };
  lo.soMetConLai -= soMetXuat;
  if (lo.soMetConLai === 0) lo.trangThai = "het";
  saveAllVai(list);
  return { ok: true, message: `Đã xuất ${soMetXuat}m từ ${maLo}` };
}

export function tinhTonKhoVai() {
  const list = getAllVai();
  return {
    tongLo: list.length,
    tongMet: list.reduce((s, l) => s + l.soMetConLai, 0),
    giaTri: list.reduce((s, l) => s + l.soMetConLai * l.donGia, 0),
    sapHet: list.filter((l) => l.soMetConLai < 200).length,
  };
}
