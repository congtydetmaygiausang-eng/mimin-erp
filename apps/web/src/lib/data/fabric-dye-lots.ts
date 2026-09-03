import { isSupabaseEnabled, supabase } from "@/lib/supabase/client";

export type KhuMeNhuom = "A" | "B" | "C" | "D" | "E";
export type TrangThaiMeNhuom = "CHO_KIEM" | "DANG_SU_DUNG" | "ME_KE_TIEP" | "GIU_RIENG" | "CHO_TRA" | "DA_HET";

export interface FabricDyeLot {
  id: string;
  maMe: string;
  sku: string;
  mauSac: string;
  ngayNhap: string;
  xuongNhuom: string;
  donGia: number;
  soKgNhap: number;
  tonKg: number;
  soCay: number;
  khu: KhuMeNhuom;
  ke: string;
  tang: string;
  o: string;
  trangThai: TrangThaiMeNhuom;
  ghiChu: string;
  createdAt: string;
  updatedAt: string;
}

export const KHU_ME_NHUOM: Record<KhuMeNhuom, { ten: string; moTa: string }> = {
  A: { ten: "Mẻ đang sử dụng", moTa: "Vải đạt, ưu tiên xuất cho lệnh cắt" },
  B: { ten: "Mẻ kế tiếp", moTa: "Vải đạt, chờ mẻ đang dùng hết tồn" },
  C: { ten: "Mẻ mới chờ kiểm", moTa: "Chờ duyệt màu sắc và chất lượng" },
  D: { ten: "Vải lỗi / giữ riêng", moTa: "Không tự động cấp cho sản xuất" },
  E: { ten: "Vải chờ trả", moTa: "Chờ trả xưởng nhuộm hoặc nhà cung cấp" },
};

const LOCAL_KEY = "mimin_kho_vai_me_nhuom";
export const FABRIC_DYE_LOTS_CHANGED_EVENT = "mimin:fabric-dye-lots-changed";

type DyeLotRow = {
  id: string; ma_me: string; sku: string; mau_sac: string; ngay_nhap: string;
  xuong_nhuom: string | null; don_gia: number; so_kg_nhap: number; ton_kg: number;
  so_cay: number; khu: KhuMeNhuom; ke: string | null; tang: string | null; o: string | null;
  trang_thai: TrangThaiMeNhuom; ghi_chu: string | null; created_at: string; updated_at: string;
};

function fromRow(row: DyeLotRow): FabricDyeLot {
  return {
    id: row.id, maMe: row.ma_me, sku: row.sku, mauSac: row.mau_sac, ngayNhap: row.ngay_nhap,
    xuongNhuom: row.xuong_nhuom || "", donGia: Number(row.don_gia), soKgNhap: Number(row.so_kg_nhap),
    tonKg: Number(row.ton_kg), soCay: Number(row.so_cay), khu: row.khu, ke: row.ke || "", tang: row.tang || "",
    o: row.o || "", trangThai: row.trang_thai, ghiChu: row.ghi_chu || "", createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(lot: Omit<FabricDyeLot, "id" | "createdAt" | "updatedAt">) {
  return {
    ma_me: lot.maMe, sku: lot.sku, mau_sac: lot.mauSac, ngay_nhap: lot.ngayNhap,
    xuong_nhuom: lot.xuongNhuom || null, don_gia: lot.donGia, so_kg_nhap: lot.soKgNhap,
    ton_kg: lot.tonKg, so_cay: lot.soCay, khu: lot.khu, ke: lot.ke || null, tang: lot.tang || null,
    o: lot.o || null, trang_thai: lot.trangThai, ghi_chu: lot.ghiChu || null,
  };
}

function getLocal(): FabricDyeLot[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as FabricDyeLot[]; } catch { return []; }
}

function saveLocal(lots: FabricDyeLot[]): void {
  const serialized = JSON.stringify(lots);
  if (localStorage.getItem(LOCAL_KEY) === serialized) return;
  localStorage.setItem(LOCAL_KEY, serialized);
  window.dispatchEvent(new CustomEvent(FABRIC_DYE_LOTS_CHANGED_EVENT));
}

export async function fetchFabricDyeLots(): Promise<FabricDyeLot[]> {
  const local = getLocal();
  if (!isSupabaseEnabled || !supabase) return local;
  const { data, error } = await supabase.from("kho_vai_me_nhuom").select("*").order("ngay_nhap", { ascending: true });
  if (error) return local;
  const lots = ((data || []) as DyeLotRow[]).map(fromRow);
  if (local.length > 0) {
    const unsynced = local.filter((item) => !lots.some((remote) => remote.maMe === item.maMe));
    if (unsynced.length > 0) {
      const { error: syncError } = await supabase
        .from("kho_vai_me_nhuom")
        .upsert(unsynced.map(({ id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...lot }) => toRow(lot)), { onConflict: "ma_me" });
      if (syncError) return [...lots, ...unsynced];
      const refreshed = await supabase.from("kho_vai_me_nhuom").select("*").order("ngay_nhap", { ascending: true });
      if (!refreshed.error) {
        const synced = ((refreshed.data || []) as DyeLotRow[]).map(fromRow);
        saveLocal(synced);
        return synced;
      }
    }
  }
  saveLocal(lots);
  return lots;
}

export async function createFabricDyeLot(input: Omit<FabricDyeLot, "id" | "createdAt" | "updatedAt">): Promise<FabricDyeLot> {
  const now = new Date().toISOString();
  const localLot: FabricDyeLot = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase.from("kho_vai_me_nhuom").insert(toRow(input)).select("*").single();
    if (!error && data) {
      const saved = fromRow(data as DyeLotRow);
      saveLocal([saved, ...getLocal().filter((item) => item.maMe !== saved.maMe)]);
      return saved;
    }
  }
  const current = getLocal();
  if (current.some((item) => item.maMe === input.maMe)) throw new Error(`Mã mẻ ${input.maMe} đã tồn tại`);
  saveLocal([localLot, ...current]);
  return localLot;
}

export async function approveFabricDyeLot(lot: FabricDyeLot): Promise<FabricDyeLot> {
  if (lot.khu !== "C" || lot.trangThai !== "CHO_KIEM") {
    throw new Error(`Mẻ ${lot.maMe} không ở trạng thái chờ kiểm tại Khu C`);
  }
  const now = new Date().toISOString();
  const approved: FabricDyeLot = {
    ...lot,
    khu: "A",
    trangThai: "DANG_SU_DUNG",
    ghiChu: [lot.ghiChu, `Đã kiểm đạt và chuyển Khu A lúc ${now}`].filter(Boolean).join(" | "),
    updatedAt: now,
  };

  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from("kho_vai_me_nhuom")
      .update({
        ...toRow(approved),
        updated_at: now,
      })
      .eq("id", lot.id)
      .select("*")
      .single();
    if (!error && data) {
      const saved = fromRow(data as DyeLotRow);
      saveLocal(getLocal().map((item) => item.id === lot.id || item.maMe === lot.maMe ? saved : item));
      return saved;
    }
  }

  const current = getLocal();
  if (!current.some((item) => item.id === lot.id || item.maMe === lot.maMe)) {
    throw new Error(`Không tìm thấy mẻ ${lot.maMe} trong kho`);
  }
  saveLocal(current.map((item) => item.id === lot.id || item.maMe === lot.maMe ? approved : item));
  return approved;
}
