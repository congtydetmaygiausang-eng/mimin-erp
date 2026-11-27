export const CHUAN_NGAY_CONG_THANG = 28;
export const CHUAN_GIO_LAM_MOI_NGAY = 8.5;
export const TONG_GIO_CHUAN_THANG = CHUAN_NGAY_CONG_THANG * CHUAN_GIO_LAM_MOI_NGAY; // 238 giờ
export const GIO_VAO_CA_CHUAN = "07:30:00";
export const GIO_KET_THUC_CA_CHUAN = "17:30:00";

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

/** Chuẩn hóa khóa duy nhất theo (mã NV, ngày YYYY-MM-DD). */
export function chamCongRecordKey(maNV: string, ngay: string): string {
  return `${maNV.trim().toUpperCase()}|${ngay.slice(0, 10)}`;
}

/** Chuyển row snake_case từ Supabase về ChamCongRecord camelCase chính xác. */
export function normalizeChamCongFromDB(row: Record<string, unknown>): ChamCongRecord {
  return {
    id: String(row.id ?? ""),
    maNV: String(row.ma_nv ?? row.maNV ?? "").trim().toUpperCase(),
    authUserId: ((row.auth_user_id ?? row.authUserId) ?? undefined) as string | undefined,
    boPhan: ((row.bo_phan ?? row.boPhan) ?? undefined) as string | undefined,
    ngay: String(row.ngay ?? "").slice(0, 10),
    trangThai: (row.trang_thai ?? row.trangThai) as ChamCongRecord["trangThai"],
    gioVao: ((row.gio_vao ?? row.gioVao) ?? undefined) as string | undefined,
    gioRa: ((row.gio_ra ?? row.gioRa) ?? undefined) as string | undefined,
    soGioTangCa: Number(row.so_gio_tang_ca ?? row.soGioTangCa ?? 0),
    ghiChu: ((row.ghi_chu ?? row.ghiChu) ?? undefined) as string | undefined,
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ""),
  };
}

export function toLocalTime(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

/** So sánh theo HH:MM để mốc 07:30:xx vẫn tính đúng giờ, từ 07:31 trở đi tính đi trễ. */
export function isLateArrival(time: string, shiftStart = GIO_VAO_CA_CHUAN): boolean {
  if (!time) return false;
  return time.slice(0, 5) > shiftStart.slice(0, 5);
}

/** Kiểm tra kết thúc ca sớm trước giờ chuẩn 17:30. */
export function isEarlyLeave(time: string, shiftEnd = GIO_KET_THUC_CA_CHUAN): boolean {
  if (!time) return false;
  return time.slice(0, 5) < shiftEnd.slice(0, 5);
}

/** Tỷ lệ công so với chuẩn 28 ngày/tháng (không chặn trần khi tháng có 29-31 ngày công). */
export function tinhTyLeNgayCong(ngayCong: number, ngayCongChuan = CHUAN_NGAY_CONG_THANG): number {
  if (ngayCongChuan <= 0) return 0;
  return Math.max(0, ngayCong) / ngayCongChuan;
}

/** Phần trăm ngày công so với chuẩn 28 ngày, làm tròn 1 chữ số thập phân. */
export function tinhPhanTramNgayCong(ngayCong: number, ngayCongChuan = CHUAN_NGAY_CONG_THANG): number {
  return Math.round(tinhTyLeNgayCong(ngayCong, ngayCongChuan) * 1000) / 10;
}

/** Quy đổi lương tháng theo đúng số ngày công chấm thực tế trên chuẩn 28 ngày. */
export function tinhLuongTheoNgayCong(
  luongThang: number,
  ngayCong: number,
  ngayCongChuan = CHUAN_NGAY_CONG_THANG
): number {
  if (luongThang <= 0) return 0;
  return Math.round(luongThang * tinhTyLeNgayCong(ngayCong, ngayCongChuan));
}

/**
 * Đơn giá 1 giờ làm việc chuẩn theo quy chế MIMIN ERP:
 * Cơ sở 28 ngày công/tháng, mỗi ngày 8.5 tiếng làm việc chuẩn.
 * Đơn giá 1 giờ = Lương cơ bản / (28 * 8.5) = Lương cơ bản / 238
 */
export function tinhDonGiaGio(
  luongCoBan: number,
  ngayCongChuan = CHUAN_NGAY_CONG_THANG,
  gioLamChuan = CHUAN_GIO_LAM_MOI_NGAY
): number {
  const tongGioChuan = ngayCongChuan * gioLamChuan;
  if (luongCoBan <= 0 || tongGioChuan <= 0) return 0;
  return Math.round(luongCoBan / tongGioChuan);
}

/**
 * Tiền tăng ca = Số giờ tăng ca * Đơn giá 1 giờ chuẩn
 */
export function tinhTienTangCa(
  soGioTangCa: number,
  luongCoBan: number,
  ngayCongChuan = CHUAN_NGAY_CONG_THANG,
  gioLamChuan = CHUAN_GIO_LAM_MOI_NGAY
): number {
  if (soGioTangCa <= 0 || luongCoBan <= 0) return 0;
  const donGiaGio = tinhDonGiaGio(luongCoBan, ngayCongChuan, gioLamChuan);
  return Math.round(soGioTangCa * donGiaGio);
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

/** Cập nhật hoặc thêm 1 bản ghi vào mảng, chống trùng lặp theo id hoặc (maNV, ngay). */
export function upsertChamCongList(current: ChamCongRecord[], record: ChamCongRecord): ChamCongRecord[] {
  const key = chamCongRecordKey(record.maNV, record.ngay);
  const idx = current.findIndex(
    (item) => item.id === record.id || chamCongRecordKey(item.maNV, item.ngay) === key
  );
  if (idx < 0) return [record, ...current];
  return current.map((item, i) => (i === idx ? record : item));
}

/**
 * Hợp nhất dữ liệu Supabase với các bản ghi local đang chờ đồng bộ (pending)
 * để tránh mất dữ liệu chấm công sáng/chiều khi F5 hoặc rớt mạng tạm thời.
 */
export function mergeChamCongRecords(
  remote: ChamCongRecord[],
  localPending: ChamCongRecord[]
): ChamCongRecord[] {
  const byKey = new Map<string, ChamCongRecord>();
  for (const r of remote) {
    const key = chamCongRecordKey(r.maNV, r.ngay);
    const existing = byKey.get(key);
    if (!existing || r.updatedAt >= existing.updatedAt) {
      byKey.set(key, r);
    }
  }
  for (const p of localPending) {
    const key = chamCongRecordKey(p.maNV, p.ngay);
    const normalizedMaNV = p.maNV.trim().toUpperCase();
    const r = byKey.get(key);
    if (!r) {
      byKey.set(key, { ...p, maNV: normalizedMaNV });
      continue;
    }
    const localNewer = p.updatedAt >= r.updatedAt;
    const localHasMoreCheckout = Boolean(p.gioRa && !r.gioRa);
    const localHasMoreCheckin = Boolean(p.gioVao && !r.gioVao);
    if (localNewer || localHasMoreCheckout || localHasMoreCheckin) {
      byKey.set(key, {
        ...p,
        id: r.id || p.id,
        maNV: r.maNV || normalizedMaNV,
        authUserId: r.authUserId || p.authUserId,
        gioVao: p.gioVao || r.gioVao,
        gioRa: p.gioRa || r.gioRa,
      });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => b.ngay.localeCompare(a.ngay));
}
