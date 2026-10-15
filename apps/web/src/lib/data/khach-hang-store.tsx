"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { useSupabaseRealtime } from "@/lib/supabase/sync-helper";

export type KhachHangDBModel = {
  id: string;
  ma_kh: string;
  ten_kh: string;
  loai: string;
  dia_chi: string;
  sdt: string;
  email: string;
  mst: string;
  nguoi_lh: string;
  chinh_sach?: string;
  han_muc_no?: number;
  cong_no_hien_tai: number;
  doanh_so_nam?: number;
  sp_chinh?: string;
  ghi_chu: string;
  trang_thai: string;
  // === P2 - 2026-08-07 - Rating tach rieng ===
  rating?: number;
  // === 2026-08-08 - Facebook URL ===
  facebook_url?: string;
  // === 2026-08-18 - Nhu cau chinh ===
  nhu_cau_chinh?: string[];
  // === 2026-08-27 - Ghi nho ===
  ghi_nho?: boolean;
  // === 2026-09-21 - Avatar KH ===
  avatar_url?: string;
};

export type KhachHangUI = {
  id?: string;
  maKH: string;
  ten: string;
  sdt: string;
  email: string;
  diaChi: string;
  mst?: string;
  congNo: number;
  rating: number;
  ghiChu: string;
  loai?: string;
  trangThai?: string;
  avatar?: string;
  // === P1 - 2026-08-07 - Han muc no KH ===
  hanMucNo?: number;
  // === 2026-08-08 - Facebook URL ===
  facebookUrl?: string;
  // === 2026-08-18 - Nhu cau chinh ===
  nhuCauChinh?: string[];
  // === 2026-08-27 - Ghi nho ===
  ghiNho?: boolean;
};

// P1 - 2026-08-07 - Enum phan loai KH
export const LOAI_KH_OPTIONS = ["Đại lý cấp 1", "Đại lý cấp 2", "Công ty", "Shop", "Cá nhân", "Xưởng", "Khách hàng xưởng"] as const;
export type LoaiKH = typeof LOAI_KH_OPTIONS[number];

function mapToDB(ui: KhachHangUI): any {
  return {
    id: ui.id,
    ma_kh: ui.maKH,
    ten_kh: ui.ten,
    loai: ui.loai || "",
    dia_chi: ui.diaChi || "",
    sdt: ui.sdt || "",
    email: ui.email || "",
    mst: ui.mst || "",
    cong_no: Number(ui.congNo) || 0,
    han_muc_no: Number(ui.hanMucNo) || 0, // P1 - 2026-08-07
    rating: Number(ui.rating) || 4,
    ghi_chu: ui.ghiChu || "",
    trang_thai: ui.trangThai || "Thường",
    facebook_url: ui.facebookUrl || "", // 2026-08-08
    nhu_cau_chinh: Array.isArray(ui.nhuCauChinh) ? ui.nhuCauChinh : [], // 2026-08-18
    ghi_nho: Boolean(ui.ghiNho),
    avatar_url: ui.avatar || "", // 2026-09-21
  };
}

function mapToUI(db: any): KhachHangUI {
  if (!db) {
    return {
      maKH: "",
      ten: "",
      sdt: "",
      email: "",
      diaChi: "",
      loai: "",
      congNo: 0,
      hanMucNo: 0,
      ghiChu: "",
      trangThai: "",
      rating: 4,
      mst: "",
      facebookUrl: "",
      nhuCauChinh: [],
      ghiNho: false,
      avatar: "",
    };
  }

  const rawGhiChu = db.ghi_chu || db.ghiChu || "";
  let r = db.rating || 4;
  if (!db.rating) {
    const match = rawGhiChu.match(/Đánh giá:\s*(\d)/);
    if (match) r = parseInt(match[1], 10);
  }

  let mst = db.mst || "";
  const mstMatch = rawGhiChu.match(/MST:\s*([\d\-]+)/);
  if (mstMatch && !mst) mst = mstMatch[1];

  let ghiChu = rawGhiChu
    .replace(/Đánh giá:\s*\d\s*\|\s*/, "")
    .replace(/MST:\s*[\d\-]+\s*\|\s*/, "");

  // Hỗ trợ cả snake_case (ten_kh), camelCase từ sync-helper (tenKh), và UI (ten)
  const ten = (db.ten_kh || db.tenKh || db.ten || db.name || "").trim();
  const maKH = (db.ma_kh || db.maKh || db.maKH || db.code || "").trim();

  return {
    id: db.id,
    maKH,
    ten,
    sdt: (db.sdt || db.phone || "").trim(),
    email: (db.email || "").trim(),
    diaChi: (db.dia_chi || db.diaChi || db.address || "").trim(),
    loai: db.loai || db.loaiKH || "",
    congNo: Number(db.cong_no ?? db.congNo ?? db.cong_no_hien_tai ?? db.congNoHienTai ?? 0) || 0,
    hanMucNo: Number(db.han_muc_no ?? db.hanMucNo ?? 0) || 0,
    ghiChu,
    trangThai: db.trang_thai || db.trangThai || "",
    rating: Number(r) || 4,
    mst,
    facebookUrl: db.facebook_url || db.facebookUrl || "",
    nhuCauChinh: Array.isArray(db.nhu_cau_chinh)
      ? db.nhu_cau_chinh
      : Array.isArray(db.nhuCauChinh)
      ? db.nhuCauChinh
      : [],
    ghiNho: Boolean(db.ghi_nho ?? db.ghiNho ?? false),
    avatar: db.avatar_url || db.avatarUrl || db.avatar || "",
  };
}

type KhachHangContextType = {
  list: KhachHangUI[];
  themKhachHang: (kh: KhachHangUI) => Promise<boolean>;
  suaKhachHang: (kh: KhachHangUI) => Promise<boolean>;
  xoaKhachHang: (idOrMaKH: string) => Promise<boolean>;
  /** Cộng/trừ công nợ an toàn theo mã KH (đọc lại số dư mới nhất trước khi ghi) */
  congTruCongNo: (maKH: string, diff: number) => Promise<boolean>;
  loading: boolean;
};

const Ctx = createContext<KhachHangContextType | null>(null);
const STORAGE_KEY = "mimin_khach_hang_v2";

const KHACH_HANG_MOCK: KhachHangUI[] = [];

export function KhachHangProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<KhachHangUI[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Lọc sạch cache cũ, loại bỏ các item lỗi không có tên hoặc mã
          return parsed
            .filter((item: any) => item && (item.maKH || item.ten || item.ma_kh || item.ten_kh))
            .map((item: any) => mapToUI(item));
        }
      }
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });

  // Bỏ load localStorage - khách hàng 700+ rows quá lớn, dùng Supabase trực tiếp

  useEffect(() => {
    let mounted = true;
    const fetchSupabase = async () => {
      if (!isSupabaseEnabled) {
        if (list.length === 0) setList([]);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase!.from("khach_hang").select("*");
        if (error) throw error;
        
        if (mounted) {
          if (data && data.length > 0) {
            // Sắp xếp mã KH giảm dần để khách hàng mới lên đầu
            data.sort((a: any, b: any) => (b.ma_kh || "").localeCompare(a.ma_kh || ""));
            const mapped = data.map((d: any) => mapToUI(d));
            setList(mapped);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)); } catch {}
          } else {
            setList([]);
          }
        }
      } catch (err) {
        console.error("Lỗi fetch khách hàng Supabase:", err);
        if (mounted && list.length === 0) setList([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSupabase();
    return () => { mounted = false; };
  }, []);

  useSupabaseRealtime<KhachHangUI>("khach_hang", setList, {
    mapIn: mapToUI,
    primaryKey: "maKH",
  });

  const themKhachHang = useCallback(async (kh: KhachHangUI) => {
    const safeKH: KhachHangUI = {
      ...kh,
      ten: (kh.ten || "").trim(),
      maKH: (kh.maKH || "").trim(),
      sdt: (kh.sdt || "").trim(),
    };
    setList(prev => [safeKH, ...prev]);
    if (isSupabaseEnabled) {
      try {
        const payload = mapToDB(safeKH);
        if (!payload.id) payload.id = crypto.randomUUID(); // Tự sinh UUID nếu thiếu
        let { error } = await supabase!.from("khach_hang").insert(payload);
        if (error?.code === "42703" || error?.code === "PGRST204") {
          // Fallback cho DB chưa cập nhật cột mới
          const safePayload = { ...payload };
          delete safePayload.han_muc_no;
          delete safePayload.facebook_url;
          delete safePayload.nhu_cau_chinh;
          delete safePayload.rating;
          delete safePayload.ghi_nho;
          delete safePayload.avatar_url;
          ({ error } = await supabase!.from("khach_hang").insert(safePayload));
        }

        if (error) {
          console.error("Lỗi thêm khách hàng:", error.message, error.details, error.hint);
          throw new Error(error.message);
        }
        return true;
      } catch (err: any) { 
        throw new Error(err.message || "Lỗi không xác định");
      }
    }
    return true;
  }, []);

  const suaKhachHang = useCallback(async (kh: KhachHangUI) => {
    const safeKH: KhachHangUI = {
      ...kh,
      ten: (kh.ten || "").trim(),
      maKH: (kh.maKH || "").trim(),
      sdt: (kh.sdt || "").trim(),
    };
    setList(prev => prev.map(x => x.maKH === safeKH.maKH ? safeKH : x));
    if (isSupabaseEnabled) {
      try {
        const payload = mapToDB(safeKH);
        if (!payload.id) payload.id = crypto.randomUUID();
        let { error } = await supabase!.from("khach_hang").update(payload).eq("ma_kh", safeKH.maKH);
        if (error?.code === "42703" || error?.code === "PGRST204") {
          const safePayload = { ...payload };
          delete safePayload.han_muc_no;
          delete safePayload.facebook_url;
          delete safePayload.nhu_cau_chinh;
          delete safePayload.rating;
          delete safePayload.ghi_nho;
          delete safePayload.avatar_url;
          ({ error } = await supabase!.from("khach_hang").update(safePayload).eq("ma_kh", safeKH.maKH));
        }

        if (error) {
          console.error("Lỗi sửa khách hàng:", error.message, error.details, error.hint);
          throw new Error(error.message);
        }
        return true;
      } catch (err: any) { 
        throw new Error(err.message || "Lỗi không xác định");
      }
    }
    return true;
  }, []);

  /**
   * Cộng/trừ công nợ theo MÃ khách hàng, đọc lại số dư mới nhất từ máy chủ ngay
   * trước khi ghi.
   *
   * Trước đây công nợ được tính bằng cách đọc kh.congNo từ state trong máy rồi
   * ghi đè cả dòng. Hai đơn của cùng 1 khách lưu gần nhau (2 tab, hoặc bấm nhanh
   * trước khi state kịp cập nhật) sẽ cùng đọc một số dư cũ, đơn sau ghi đè đơn
   * trước -> mất công nợ của 1 đơn mà không báo lỗi gì.
   */
  const congTruCongNo = useCallback(async (maKH: string, diff: number) => {
    if (!maKH || !diff) return true;

    let soDuHienTai: number | null = null;
    if (isSupabaseEnabled && supabase) {
      try {
        const { data } = await supabase.from("khach_hang").select("cong_no").eq("ma_kh", maKH).limit(1).maybeSingle();
        if (data) soDuHienTai = Number((data as any).cong_no) || 0;
      } catch (err) {
        console.error("[KhachHang] Không đọc được công nợ mới nhất:", err);
      }
    }

    let daGhi = false;
    setList(prev => prev.map(x => {
      if (x.maKH !== maKH) return x;
      const goc = soDuHienTai ?? (x.congNo || 0);
      daGhi = true;
      return { ...x, congNo: goc + diff };
    }));
    if (!daGhi) return false;

    if (isSupabaseEnabled && supabase) {
      try {
        const goc = soDuHienTai ?? 0;
        await supabase.from("khach_hang").update({ cong_no: goc + diff }).eq("ma_kh", maKH);
        return true;
      } catch (err) {
        console.error("[KhachHang] Lỗi cập nhật công nợ:", err);
        return false;
      }
    }
    return true;
  }, []);

  const xoaKhachHang = useCallback(async (maKH: string) => {
    setList(prev => prev.filter(x => x.maKH !== maKH));
    if (isSupabaseEnabled) {
      try {
        await supabase!.from("khach_hang").delete().eq("ma_kh", maKH);
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  return (
    <Ctx.Provider value={{ list, themKhachHang, suaKhachHang, xoaKhachHang, congTruCongNo, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useKhachHang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useKhachHang must be used within KhachHangProvider");
  return ctx;
}
