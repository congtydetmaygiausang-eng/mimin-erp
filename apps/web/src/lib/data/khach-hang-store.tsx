"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";

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
export const LOAI_KH_OPTIONS = ["Đại lý cấp 1", "Đại lý cấp 2", "Công ty", "Shop", "Cá nhân"] as const;
export type LoaiKH = typeof LOAI_KH_OPTIONS[number];

function mapToDB(ui: KhachHangUI): any {
  return {
    id: ui.id,
    ma_kh: ui.maKH,
    ten_kh: ui.ten,
    loai: ui.loai || "",
    dia_chi: ui.diaChi,
    sdt: ui.sdt,
    email: ui.email,
    mst: ui.mst || "",
    cong_no: ui.congNo || 0,
    han_muc_no: ui.hanMucNo || 0, // P1 - 2026-08-07
    rating: ui.rating || 4,
    ghi_chu: ui.ghiChu || "",
    trang_thai: ui.trangThai || "Thường",
    facebook_url: ui.facebookUrl || "", // 2026-08-08
    nhu_cau_chinh: ui.nhuCauChinh || [], // 2026-08-18
    ghi_nho: ui.ghiNho || false,
  };
}

function mapToUI(db: any): KhachHangUI {
  let r = db.rating || 4;
  if (!db.rating) {
    const match = db.ghi_chu?.match(/Đánh giá:\s*(\d)/);
    if (match) r = parseInt(match[1], 10);
  }

  let mst = db.mst || "";
  const mstMatch = db.ghi_chu?.match(/MST:\s*([\d\-]+)/);
  if (mstMatch && !mst) mst = mstMatch[1];

  let ghiChu = db.ghi_chu || "";
  ghiChu = ghiChu.replace(/Đánh giá:\s*\d\s*\|\s*/, "").replace(/MST:\s*[\d\-]+\s*\|\s*/, "");

  return {
    id: db.id,
    maKH: db.ma_kh,
    ten: db.ten_kh || db.ten, // Hỗ trợ cả ten_kh (cũ) và ten (mới trong bảng khach_hang)
    sdt: db.sdt || "",
    email: db.email || "",
    diaChi: db.dia_chi || "",
    loai: db.loai || "",
    congNo: db.cong_no || db.cong_no_hien_tai || 0,
    hanMucNo: db.han_muc_no || 0, // P1 - 2026-08-07
    ghiChu: ghiChu,
    trangThai: db.trang_thai || "",
    rating: r,
    mst: mst,
    facebookUrl: db.facebook_url || "", // 2026-08-08
    nhuCauChinh: Array.isArray(db.nhu_cau_chinh) ? db.nhu_cau_chinh : [], // 2026-08-18
    ghiNho: db.ghi_nho || false,
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
const STORAGE_KEY = "mimin_khach_hang_v1";

const KHACH_HANG_MOCK: KhachHangUI[] = [
  { maKH: "KH-002", ten: "Shop Thời Trang Sài Gòn", sdt: "0901234568", email: "saigon@shop.vn", diaChi: "TPHCM", congNo: 0, rating: 4, ghiChu: "Khách lẻ", loai: "Shop", nhuCauChinh: [], ghiNho: false },
  { maKH: "KH-001", ten: "Cty May Hà Nội", sdt: "0901234567", email: "hanoi@may.vn", diaChi: "Hà Nội", congNo: 15000000, rating: 5, ghiChu: "Khách VIP", loai: "Công ty", nhuCauChinh: [], ghiNho: true },
];

export function KhachHangProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<KhachHangUI[]>([]);
  const [loading, setLoading] = useState(true);

  // Bỏ load localStorage - khách hàng 700+ rows quá lớn, dùng Supabase trực tiếp

  useEffect(() => {
    let mounted = true;
    const fetchSupabase = async () => {
      if (!isSupabaseEnabled) {
        if (list.length === 0) setList(KHACH_HANG_MOCK);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase!.from("khach_hang").select("*");
        if (error) throw error;
        
        if (mounted) {
          if (data && data.length > 0) {
            // Sort by maKH descending so new customers appear first
            data.sort((a: any, b: any) => (b.ma_kh || "").localeCompare(a.ma_kh || ""));
            const mapped = data.map((d: any) => mapToUI(d));
            setList(mapped);
            // Không lưu localStorage - 700+ rows quá lớn
          } else {
            setList(KHACH_HANG_MOCK);
            Promise.all(KHACH_HANG_MOCK.map(kh => 
              supabaseUpsert("khach_hang", mapToDB(kh))
            )).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Lỗi fetch khách hàng Supabase:", err);
        if (mounted && list.length === 0) setList(KHACH_HANG_MOCK);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSupabase();
    return () => { mounted = false; };
  }, []);

  const themKhachHang = useCallback(async (kh: KhachHangUI) => {
    setList(prev => [kh, ...prev]);
    if (isSupabaseEnabled) {
      try {
        const payload = mapToDB(kh);
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
    setList(prev => prev.map(x => x.maKH === kh.maKH ? kh : x));
    if (isSupabaseEnabled) {
      try {
        const payload = mapToDB(kh);
        if (!payload.id) payload.id = crypto.randomUUID();
        let { error } = await supabase!.from("khach_hang").update(payload).eq("ma_kh", kh.maKH);
        if (error?.code === "42703" || error?.code === "PGRST204") {
          const safePayload = { ...payload };
          delete safePayload.han_muc_no;
          delete safePayload.facebook_url;
          delete safePayload.nhu_cau_chinh;
          delete safePayload.rating;
          delete safePayload.ghi_nho;
          ({ error } = await supabase!.from("khach_hang").update(safePayload).eq("ma_kh", kh.maKH));
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
