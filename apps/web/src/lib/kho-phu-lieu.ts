// Kho phụ liệu - Engine riêng
import { fromStorage, saveToStorage } from "./storage-helper";

export interface PhuLieu {
  id: string;
  sku: string;           // NUT-15MM
  ten: string;           // "Nút 15mm đen"
  loai: "nut" | "chi" | "bo-co" | "nhan" | "tem" | "tui" | "khac";
  soLuong: number;
  donVi: string;         // "cái", "cuộn"
  donGia: number;
  giaTri: number;
  tonThap: number;       // ngưỡng cảnh báo
  nccId: string;
  ngayNhap: string;
}

const KHO_PL_KEY = "mimin_phu_lieu";

export function getAllPhuLieu(): PhuLieu[] {
  return fromStorage<PhuLieu[]>(KHO_PL_KEY, []);
}
export function saveAllPhuLieu(data: PhuLieu[]) { saveToStorage(KHO_PL_KEY, data); }

export function nhapPhuLieu(p: Omit<PhuLieu, "id" | "giaTri">) {
  const list = getAllPhuLieu();
  const item: PhuLieu = { ...p, id: `PL${Date.now().toString().slice(-6)}`, giaTri: p.soLuong * p.donGia };
  list.push(item);
  saveAllPhuLieu(list);
  return item;
}

export function xuatPhuLieu(sku: string, soLuongXuat: number) {
  const list = getAllPhuLieu();
  const item = list.find((i) => i.sku === sku);
  if (!item) return { ok: false, message: `Không tìm thấy ${sku}` };
  if (item.soLuong < soLuongXuat) return { ok: false, message: `Tồn kho không đủ` };
  item.soLuong -= soLuongXuat;
  saveAllPhuLieu(list);
  return { ok: true, message: `Đã xuất ${soLuongXuat} ${item.donVi} ${sku}` };
}

export function canhBaoPhuLieu(): PhuLieu[] {
  return getAllPhuLieu().filter((p) => p.soLuong < p.tonThap);
}
