"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { DOI_TAC_GIA_CONG, type DoiTacGiaCong } from "@/lib/doi-tac-gia-cong";

export type DoiTacDBModel = {
  id: string;
  ma_xuong: string;
  ten_xuong: string;
  loai: string;
  dia_chi: string;
  sdt: string;
  email: string;
  nguoi_lh: string;
  cong_suat?: string;
  don_gia_tb?: number;
  don_vi?: string;
  ghi_chu: string;
  trang_thai: string;
  // === P0/P1 - 2026-08-07 - Cong no + Thanh toan ===
  cong_no?: number;
  da_thanh_toan?: number;
  con_lai?: number;
  han_muc_no?: number;
  ngay_hop_tac?: string;
  thoi_han_thanh_toan?: number;
  phuong_thuc_tt?: string;
  rating?: number;
};

function mapToDB(ui: DoiTacGiaCong): DoiTacDBModel {
  return {
    ma_xuong: ui.ma,
    ten_xuong: ui.tenDonVi,
    loai: ui.chuyenMon,
    dia_chi: ui.diaChi,
    sdt: ui.sdt,
    email: ui.email || "",
    nguoi_lh: ui.nguoiLienHe,
    ghi_chu: ui.ghiChu || "",
    trang_thai: ui.trangThai === "dang_hop_tac" ? "Đang hợp tác" : "Ngừng hợp tác",
    // === P0/P1 - Cong no + Thanh toan ===
    cong_no: ui.congNo || 0,
    da_thanh_toan: ui.daThanhToan || 0,
    con_lai: ui.conLai ?? ((ui.congNo || 0) - (ui.daThanhToan || 0)),
    han_muc_no: ui.hanMucNo || 0,
    ngay_hop_tac: ui.ngayHopTac || null,
    thoi_han_thanh_toan: ui.thoiHanThanhToan || 30,
    phuong_thuc_tt: ui.phuongThucTT || "Chuyển khoản",
    rating: ui.rating || 4.0,
  };
}

function mapToUI(db: DoiTacDBModel, index: number): DoiTacGiaCong {
  return {
    stt: index + 1,
    ma: db.ma_xuong,
    tenDonVi: db.ten_xuong,
    nguoiLienHe: db.nguoi_lh,
    sdt: db.sdt,
    email: db.email,
    diaChi: db.dia_chi,
    boPhan: "Sản xuất",
    chucVu: "Đối tác gia công",
    loaiDoiTuong: "doi_tac_gia_cong",
    trangThai: db.trang_thai === "Đang hợp tác" ? "dang_hop_tac" : "ngung_hop_tac",
    ghiChu: db.ghi_chu,
    chuyenMon: db.loai as any,
    // === P0/P1 - Cong no + Thanh toan ===
    congNo: db.cong_no || 0,
    daThanhToan: db.da_thanh_toan || 0,
    conLai: db.con_lai ?? ((db.cong_no || 0) - (db.da_thanh_toan || 0)),
    hanMucNo: db.han_muc_no || 0,
    ngayHopTac: db.ngay_hop_tac || undefined,
    thoiHanThanhToan: db.thoi_han_thanh_toan || 30,
    phuongThucTT: (db.phuong_thuc_tt as any) || "Chuyển khoản",
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
        const { data, error } = await supabase!.from("xuong_gia_cong").select("*").order("created_at", { ascending: true });
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
              supabaseUpsert("xuong_gia_cong", mapToDB(dt))
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
        await supabaseUpsert("xuong_gia_cong", mapToDB(dt));
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
        await supabaseUpsert("xuong_gia_cong", mapToDB(dt));
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
        await supabase!.from("xuong_gia_cong").delete().eq("ma_xuong", ma);
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
