// Kho sợi - dây chuyền - Engine riêng
import { fromStorage, saveToStorage } from "./storage-helper";
import { SOI_TO_VAI_RATIO } from "./yarn-production-chain";

export interface LoSoi {
  id: string;
  maLo: string;          // LSOI-001
  loaiSoi: string;       // "Cotton 30s"
  soKgBanDau: number;
  soKgConLai: number;
  donGia: number;        // VND/kg
  giaTri: number;
  nccId: string;
  ngayNhap: string;
  trangThai: "con" | "het" | "khoa";
}

const KHO_SOI_KEY = "mimin_lo_soi";

export function getAllSoi(): LoSoi[] {
  return fromStorage<LoSoi[]>(KHO_SOI_KEY, []);
}
export function saveAllSoi(data: LoSoi[]) { saveToStorage(KHO_SOI_KEY, data); }

export function nhapSoi(loaiSoi: string, soKg: number, donGia: number, nccId: string) {
  const list = getAllSoi();
  const lo: LoSoi = {
    id: `LS${Date.now().toString().slice(-6)}`,
    maLo: `LSOI-${(list.length + 1).toString().padStart(3, "0")}`,
    loaiSoi, soKgBanDau: soKg, soKgConLai: soKg, donGia,
    giaTri: soKg * donGia, nccId,
    ngayNhap: new Date().toISOString().slice(0, 10),
    trangThai: "con",
  };
  list.push(lo);
  saveAllSoi(list);
  return lo;
}

export function xuatSoi(maLo: string, soKgXuat: number) {
  const list = getAllSoi();
  const lo = list.find((l) => l.maLo === maLo);
  if (!lo) return { ok: false, message: `Không tìm thấy lô ${maLo}` };
  if (lo.soKgConLai < soKgXuat) return { ok: false, message: `Tồn kho không đủ` };
  lo.soKgConLai -= soKgXuat;
  if (lo.soKgConLai === 0) lo.trangThai = "het";
  saveAllSoi(list);
  return { ok: true, message: `Đã xuất ${soKgXuat}kg. Còn ${lo.soKgConLai}kg` };
}

// 1kg sợi = 4m vải
export function duKienMetVai(soKg: number): number {
  return soKg * SOI_TO_VAI_RATIO;
}
