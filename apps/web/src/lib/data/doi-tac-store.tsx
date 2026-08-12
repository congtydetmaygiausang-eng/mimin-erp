"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { DOI_TAC_GIA_CONG, type DoiTacGiaCong } from "@/lib/doi-tac-gia-cong";

export type DoiTacDBModel = {
  id?: string;
  ma_ncc: string;
  ten_ncc: string;
  loai: string;
  chuyen_mon?: string;
  dia_chi?: string;
  sdt?: string;
  email?: string;
  nguoi_lh?: string;
  ghi_chu?: string;
  trang_thai?: string;
  cong_no?: number;
  han_muc?: number;
  rating?: number;
};

function mapToDB(ui: DoiTacGiaCong): DoiTacDBModel {
  return {
    ma_ncc: ui.ma,
    ten_ncc: ui.tenDonVi,
    loai: "doi_tac_gia_cong",
    chuyen_mon: ui.chuyenMon,
    dia_chi: ui.diaChi,
    sdt: ui.sdt,
    email: ui.email || "",
    nguoi_lh: ui.nguoiLienHe,
    ghi_chu: ui.ghiChu || "",
    trang_thai: ui.trangThai === "dang_hop_tac" ? "Đang hợp tác" : "Ngừng hợp tác",
    cong_no: ui.congNo || 0,
    han_muc: ui.hanMucNo || 0,
    rating: ui.rating || 4.0,
  };
}

function mapToUI(db: any, index: number): DoiTacGiaCong {
  return {
    stt: index + 1,
    ma: db.ma_ncc,
    tenDonVi: db.ten_ncc,
    nguoiLienHe: db.nguoi_lh,
    sdt: db.sdt,
    email: db.email,
    diaChi: db.dia_chi,
    boPhan: "Sản xuất",
    chucVu: "Đối tác gia công",
    loaiDoiTuong: "doi_tac_gia_cong",
    trangThai: db.trang_thai === "Đang hợp tác" ? "dang_hop_tac" : "ngung_hop_tac",
    ghiChu: db.ghi_chu,
    chuyenMon: (db.chuyen_mon || db.loai) as any,
    congNo: db.cong_no || 0,
    daThanhToan: 0,
    conLai: db.cong_no || 0,
    hanMucNo: db.han_muc || 0,
    ngayHopTac: undefined,
    thoiHanThanhToan: 30,
    phuongThucTT: "Chuyển khoản",
    rating: db.rating || 4.0,
  };
}

type DoiTacContextType = {
  list: DoiTacGiaCong[];
  themDoiTac: (dt: DoiTacGiaCong) => Promise<boolean>;
  suaDoiTac: (dt: DoiTacGiaCong) => Promise<boolean>;
  xoaDoiTac: (ma: string) => Promise<boolean>;
  loading: boolean;
};

const Ctx = createContext<DoiTacContextType | null>(null);
const STORAGE_KEY = "mimin_doi_tac_v1";

export function DoiTacProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<DoiTacGiaCong[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
        }
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSupabase = async () => {
      if (!isSupabaseEnabled) {
        setList(prev => {
          if (prev.length === 0) return DOI_TAC_GIA_CONG;
          if (prev.length < DOI_TAC_GIA_CONG.length) {
            const missing = DOI_TAC_GIA_CONG.filter(k => !prev.find(p => p.ma === k.ma));
            if (missing.length > 0) {
              const combined = [...prev, ...missing].sort((a, b) => a.stt - b.stt);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
              return combined;
            }
          }
          return prev;
        });
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase!.from("nha_cung_cap").select("*").eq("loai", "doi_tac_gia_cong").order("created_at", { ascending: true });
        if (error) throw error;
        
        if (mounted) {
          if (data && data.length > 0) {
            const mapped = data.map((d: any, i: number) => mapToUI(d, i));
            setList(mapped);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          } else {
            setList(DOI_TAC_GIA_CONG);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DOI_TAC_GIA_CONG));
            Promise.all(DOI_TAC_GIA_CONG.map(dt => 
              supabaseUpsert("nha_cung_cap", mapToDB(dt))
            )).catch(() => {});
          }
        }
      } catch (err) {
        if (mounted && list.length === 0) setList(DOI_TAC_GIA_CONG);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSupabase();
    return () => { mounted = false; };
  }, []);

  const themDoiTac = useCallback(async (dt: DoiTacGiaCong) => {
    setList(prev => {
      const newList = [...prev, dt];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabaseUpsert("nha_cung_cap", mapToDB(dt));
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const suaDoiTac = useCallback(async (dt: DoiTacGiaCong) => {
    setList(prev => {
      const newList = prev.map(x => x.ma === dt.ma ? dt : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabaseUpsert("nha_cung_cap", mapToDB(dt));
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const xoaDoiTac = useCallback(async (ma: string) => {
    setList(prev => {
      const newList = prev.filter(x => x.ma !== ma);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabase!.from("nha_cung_cap").delete().eq("ma_ncc", ma);
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  return (
    <Ctx.Provider value={{ list, themDoiTac, suaDoiTac, xoaDoiTac, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useDoiTac() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDoiTac must be used within DoiTacProvider");
  return ctx;
}
