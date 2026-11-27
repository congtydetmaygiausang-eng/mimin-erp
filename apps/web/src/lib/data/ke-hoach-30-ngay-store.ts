import { isSupabaseEnabled, supabase } from "@/lib/supabase/client";

export interface KeHoach30NgayItem {
  id: string;
  thuTu: number;
  maSP: string;
  loaiSP: string;
  mauChinh?: string;
  hinhAnh?: string;
  mauAo?: string;
  mauQuan?: string;
  mauBoCo?: string;
  slKeHoach: number;
  dmVaiChinh: number;
  slBoCo: number;
  lungThun?: string;
  dayKeo?: string;
  nut?: string;
  baoBi?: string;
  nhan?: string;
  theBai?: string;
  giaCongAo?: number;
  giaCongQuan?: number;
  nhipGiao?: string;
  ghiChu?: string;
  createdAt: string;
  updatedAt: string;
}

const LOCAL_KEY = "mimin_ke_hoach_30_ngay";
export const KE_HOACH_30_NGAY_CHANGED_EVENT = "mimin:ke-hoach-30-ngay-changed";

type Row = {
  id: string; thu_tu: number; ma_sp: string; loai_sp: string;
  mau_chinh: string | null; hinh_anh: string | null;
  mau_ao: string | null; mau_quan: string | null; mau_bo_co: string | null;
  sl_ke_hoach: number; dm_vai_chinh: number; sl_bo_co: number;
  lung_thun: string | null; day_keo: string | null; nut: string | null; bao_bi: string | null;
  nhan: string | null; the_bai: string | null;
  gia_cong_ao: number | null; gia_cong_quan: number | null;
  nhip_giao: string | null; ghi_chu: string | null;
  created_at: string; updated_at: string;
};

function fromRow(row: Row): KeHoach30NgayItem {
  return {
    id: row.id, thuTu: row.thu_tu, maSP: row.ma_sp, loaiSP: row.loai_sp,
    mauChinh: row.mau_chinh || "", hinhAnh: row.hinh_anh || "",
    mauAo: row.mau_ao || "", mauQuan: row.mau_quan || "", mauBoCo: row.mau_bo_co || "",
    slKeHoach: Number(row.sl_ke_hoach), dmVaiChinh: Number(row.dm_vai_chinh), slBoCo: Number(row.sl_bo_co),
    lungThun: row.lung_thun || "", dayKeo: row.day_keo || "", nut: row.nut || "", baoBi: row.bao_bi || "",
    nhan: row.nhan || "", theBai: row.the_bai || "",
    giaCongAo: row.gia_cong_ao !== null ? Number(row.gia_cong_ao) : undefined,
    giaCongQuan: row.gia_cong_quan !== null ? Number(row.gia_cong_quan) : undefined,
    nhipGiao: row.nhip_giao || "", ghiChu: row.ghi_chu || "",
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function toRow(item: Omit<KeHoach30NgayItem, "id" | "createdAt" | "updatedAt">) {
  return {
    thu_tu: item.thuTu, ma_sp: item.maSP, loai_sp: item.loaiSP,
    mau_chinh: item.mauChinh || null, hinh_anh: item.hinhAnh || null,
    mau_ao: item.mauAo || null, mau_quan: item.mauQuan || null, mau_bo_co: item.mauBoCo || null,
    sl_ke_hoach: item.slKeHoach, dm_vai_chinh: item.dmVaiChinh, sl_bo_co: item.slBoCo,
    lung_thun: item.lungThun || null, day_keo: item.dayKeo || null, nut: item.nut || null, bao_bi: item.baoBi || null,
    nhan: item.nhan || null, the_bai: item.theBai || null,
    gia_cong_ao: item.giaCongAo ?? null, gia_cong_quan: item.giaCongQuan ?? null,
    nhip_giao: item.nhipGiao || null, ghi_chu: item.ghiChu || null,
  };
}

function getLocal(): KeHoach30NgayItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]") as KeHoach30NgayItem[]; } catch { return []; }
}

function saveLocal(items: KeHoach30NgayItem[]): void {
  const serialized = JSON.stringify(items);
  if (localStorage.getItem(LOCAL_KEY) === serialized) return;
  localStorage.setItem(LOCAL_KEY, serialized);
  window.dispatchEvent(new CustomEvent(KE_HOACH_30_NGAY_CHANGED_EVENT));
}

export async function fetchKeHoach30Ngay(): Promise<KeHoach30NgayItem[]> {
  const local = getLocal();
  if (!isSupabaseEnabled || !supabase) return local;
  const { data, error } = await supabase
    .from("ke_hoach_san_xuat_30_ngay")
    .select("*")
    .order("thu_tu", { ascending: true });
  if (error) return local;
  const items = ((data || []) as Row[]).map(fromRow);
  saveLocal(items);
  return items;
}

export async function createKeHoach30Ngay(
  input: Omit<KeHoach30NgayItem, "id" | "createdAt" | "updatedAt">
): Promise<KeHoach30NgayItem> {
  const now = new Date().toISOString();
  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from("ke_hoach_san_xuat_30_ngay")
      .insert(toRow(input))
      .select("*")
      .single();
    if (!error && data) {
      const saved = fromRow(data as Row);
      saveLocal([...getLocal(), saved]);
      return saved;
    }
  }
  const localItem: KeHoach30NgayItem = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  saveLocal([...getLocal(), localItem]);
  return localItem;
}

export async function updateKeHoach30Ngay(
  id: string,
  patch: Partial<Omit<KeHoach30NgayItem, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  if (isSupabaseEnabled && supabase) {
    const current = getLocal().find((i) => i.id === id);
    const merged = { ...current, ...patch } as KeHoach30NgayItem;
    const { error } = await supabase
      .from("ke_hoach_san_xuat_30_ngay")
      .update(toRow(merged))
      .eq("id", id);
    if (error) throw new Error(error.message);
  }
  saveLocal(getLocal().map((i) => (i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i)));
}

export async function deleteKeHoach30Ngay(id: string): Promise<void> {
  if (isSupabaseEnabled && supabase) {
    const { error } = await supabase.from("ke_hoach_san_xuat_30_ngay").delete().eq("id", id);
    if (error) throw new Error(error.message);
  }
  saveLocal(getLocal().filter((i) => i.id !== id));
}

export interface SelectOption {
  value: string;
  label: string;
}

/** Danh sách màu vải thật trong kho (loai='Vai'), dùng làm option cho Màu Áo/Quần/Bo Cổ. */
export async function fetchMauVaiOptions(): Promise<SelectOption[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  const { data, error } = await supabase
    .from("kho")
    .select("sku, ten_vt, mau_sac")
    .eq("loai", "Vai")
    .order("sku", { ascending: true });
  if (error || !data) return [];
  return (data as { sku: string; ten_vt: string; mau_sac: string | null }[]).map((r) => ({
    value: r.mau_sac || r.ten_vt,
    label: `${r.mau_sac || r.ten_vt} (${r.sku})`,
  }));
}

/** Danh sách phụ liệu thật trong kho (loai='Phu lieu'), lọc theo loai_chi_tiet hoặc từ khóa tên. */
export async function fetchPhuLieuOptions(filter: { loaiChiTiet?: string; tenChua?: string }): Promise<SelectOption[]> {
  if (!isSupabaseEnabled || !supabase) return [];
  let query = supabase.from("kho").select("sku, ten_vt, loai_chi_tiet").eq("loai", "Phu lieu");
  if (filter.loaiChiTiet) query = query.eq("loai_chi_tiet", filter.loaiChiTiet);
  if (filter.tenChua) query = query.ilike("ten_vt", `%${filter.tenChua}%`);
  const { data, error } = await query.order("sku", { ascending: true });
  if (error || !data) return [];
  return (data as { sku: string; ten_vt: string }[]).map((r) => ({
    value: r.ten_vt,
    label: `${r.ten_vt} (${r.sku})`,
  }));
}

/** Gộp số lượng kế hoạch 30 ngày về 4 nhóm cố định dùng cho MRP "Kế hoạch tháng". */
export function gomNhomTheoLoaiSP(items: KeHoach30NgayItem[]): {
  aoTron: number; aoTru: number; boTron: number; boTru: number; tong: number;
} {
  let aoTron = 0, aoTru = 0, boTron = 0, boTru = 0;
  items.forEach((i) => {
    const loai = (i.loaiSP || "").toLowerCase();
    if (loai.includes("áo tròn") || loai.includes("ao tron")) aoTron += i.slKeHoach;
    else if (loai.includes("áo trụ") || loai.includes("ao tru")) aoTru += i.slKeHoach;
    else if (loai.includes("bộ tròn") || loai.includes("bo tron")) boTron += i.slKeHoach;
    else if (loai.includes("bộ trụ") || loai.includes("bo tru")) boTru += i.slKeHoach;
  });
  return { aoTron, aoTru, boTron, boTru, tong: aoTron + aoTru + boTron + boTru };
}

/**
 * Định mức phụ liệu tính theo 1 SP kế hoạch (mặc định áp dụng chung, Bộ Trụ dùng đúng tỷ lệ này):
 * Lưng thun / Bao bì / Nhãn / Thẻ bài: 1 cái/SP · Dây kéo / Nút: 2 cái/SP.
 */
export const DINH_MUC_PHU_LIEU: Record<"lungThun" | "dayKeo" | "nut" | "baoBi" | "nhan" | "theBai", number> = {
  lungThun: 1,
  dayKeo: 2,
  nut: 2,
  baoBi: 1,
  nhan: 1,
  theBai: 1,
};

/** Quy đổi ra kg cho phụ liệu nhỏ, lẻ (mua/cân theo kg): số cái trong 1kg. */
export const QUY_DOI_KG_PHU_LIEU: Partial<Record<"lungThun" | "dayKeo" | "nut" | "baoBi" | "nhan" | "theBai", number>> = {
  nut: 4500,
  lungThun: 45,
};

/** Gộp vải chính + phụ liệu cần đặt từ danh sách kế hoạch 30 ngày, dùng cho phiếu đặt vật tư. */
export interface TongHopVatTu {
  ten: string;
  soLuong: number;
  donVi: string;
  soLuongKg?: number;
}

export function gomVatTuCanDat(items: KeHoach30NgayItem[]): { vai: TongHopVatTu[]; phuLieu: TongHopVatTu[] } {
  const vaiMap = new Map<string, number>();
  items.forEach((i) => {
    const can = i.slKeHoach * i.dmVaiChinh;
    if (can <= 0) return;
    const ten = i.mauAo || i.mauQuan || i.mauBoCo || i.maSP;
    vaiMap.set(ten, (vaiMap.get(ten) || 0) + can);
  });

  // Map theo tên phụ liệu, đồng thời nhớ loại cột để áp đúng quy đổi kg
  const plMap = new Map<string, { soLuong: number; loai?: keyof typeof QUY_DOI_KG_PHU_LIEU }>();
  const addPL = (ten: string | undefined, sl: number, loai?: keyof typeof QUY_DOI_KG_PHU_LIEU) => {
    if (!ten) return;
    const cur = plMap.get(ten);
    plMap.set(ten, { soLuong: (cur?.soLuong || 0) + sl, loai: loai ?? cur?.loai });
  };
  items.forEach((i) => {
    addPL(i.mauBoCo ? `Bo cổ ${i.mauBoCo}` : undefined, i.slBoCo);
    addPL(i.lungThun, i.slKeHoach * DINH_MUC_PHU_LIEU.lungThun, "lungThun");
    addPL(i.dayKeo, i.slKeHoach * DINH_MUC_PHU_LIEU.dayKeo, "dayKeo");
    addPL(i.nut, i.slKeHoach * DINH_MUC_PHU_LIEU.nut, "nut");
    addPL(i.baoBi, i.slKeHoach * DINH_MUC_PHU_LIEU.baoBi, "baoBi");
    addPL(i.nhan, i.slKeHoach * DINH_MUC_PHU_LIEU.nhan, "nhan");
    addPL(i.theBai, i.slKeHoach * DINH_MUC_PHU_LIEU.theBai, "theBai");
  });

  return {
    vai: Array.from(vaiMap.entries()).map(([ten, soLuong]) => ({ ten, soLuong, donVi: "kg" })),
    phuLieu: Array.from(plMap.entries()).map(([ten, v]) => {
      const quyDoi = v.loai ? QUY_DOI_KG_PHU_LIEU[v.loai] : undefined;
      return {
        ten,
        soLuong: v.soLuong,
        donVi: "cái",
        soLuongKg: quyDoi ? Math.round((v.soLuong / quyDoi) * 1000) / 1000 : undefined,
      };
    }),
  };
}
