export type TrangThaiChamCong = "di-lam" | "nghi-phep" | "nghi-khong-phep" | "nua-cong" | "di-tre";

export interface ChamCongRecord {
  id: string;
  maNV: string;
  authUserId?: string;
  boPhan?: string;
  ngay: string;
  trangThai: TrangThaiChamCong;
  gioVao?: string;
  gioRa?: string;
  soGioTangCa: number;
  ghiChu?: string;
  createdAt: string;
  updatedAt: string;
}

export function toLocalTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function isLateArrival(time: string, shiftStart = "08:00:00"): boolean {
  return time > shiftStart;
}

export interface TongHopChamCong {
  ngayCong: number;
  ngayPhep: number;
  ngayKhongPhep: number;
  soLanDiTre: number;
  gioTangCa: number;
}

export const TRANG_THAI_CHAM_CONG: Array<{
  value: TrangThaiChamCong;
  label: string;
  shortLabel: string;
  className: string;
}> = [
  { value: "di-lam", label: "Đi làm", shortLabel: "X", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
  { value: "nghi-phep", label: "Nghỉ phép", shortLabel: "P", className: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300" },
  { value: "nghi-khong-phep", label: "Nghỉ không phép", shortLabel: "KP", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300" },
  { value: "nua-cong", label: "Nửa công", shortLabel: "0.5", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  { value: "di-tre", label: "Đi trễ", shortLabel: "L", className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300" },
];

export function getDaysInMonth(monthKey: string): Date[] {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return [];
  const count = new Date(year, month, 0).getDate();
  return Array.from({ length: count }, (_, index) => new Date(year, month - 1, index + 1));
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function tongHopChamCong(records: ChamCongRecord[]): TongHopChamCong {
  return records.reduce<TongHopChamCong>((total, record) => {
    if (record.trangThai === "di-lam" || record.trangThai === "di-tre") total.ngayCong += 1;
    if (record.trangThai === "nua-cong") total.ngayCong += 0.5;
    if (record.trangThai === "nghi-phep") total.ngayPhep += 1;
    if (record.trangThai === "nghi-khong-phep") total.ngayKhongPhep += 1;
    if (record.trangThai === "di-tre") total.soLanDiTre += 1;
    total.gioTangCa += record.soGioTangCa || 0;
    return total;
  }, { ngayCong: 0, ngayPhep: 0, ngayKhongPhep: 0, soLanDiTre: 0, gioTangCa: 0 });
}
