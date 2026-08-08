"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { NHAN_SU_KHOI_DAU, type NhanSuExt } from "@/app/(main)/nhan-su/data";
import { toSupabaseEmployeeRecord, normalizeEmployeeRecord } from "@/lib/employee-records";
import { toast } from "sonner";

type NhanSuContextType = {
  list: NhanSuExt[];
  themNhanSu: (nv: NhanSuExt) => Promise<boolean>;
  suaNhanSu: (nv: NhanSuExt) => Promise<boolean>;
  xoaNhanSu: (maNV: string) => Promise<boolean>;
  loading: boolean;
};

const Ctx = createContext<NhanSuContextType | null>(null);

const STORAGE_KEY = "mimin_nhan_su_v1";

export function NhanSuProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<NhanSuExt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from local storage initially for fast UI
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setList(parsed);
        }
      }
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  // Fetch from Supabase
  useEffect(() => {
    let mounted = true;
    const fetchSupabase = async () => {
      if (!isSupabaseEnabled) {
        if (list.length === 0) setList(NHAN_SU_KHOI_DAU);
        setLoading(false);
        return;
      }

      try {
        // 2026-08-08 - Select cu the (tranh loi schema cache voi column moi)
        // Dung wrapper "head" de check column ton tai truoc
        const { data, error } = await supabase!.from("nhan_su").select("ma_nv, ho_ten, bo_phan, chuc_vu, sdt, email, ngay_sinh, gioi_tinh, cccd, dia_chi_tt, ngay_vao_lam, luong_cb, loai_luong, trang_thai, role, ma_dm, ghi_chu, avatar, bhxh, mst, so_tk, ngan_hang").order("stt", { ascending: true });
        if (error) {
          console.warn("[nhan-su] Supabase fetch error:", error.message);
          // Fallback to localStorage
          if (mounted && list.length === 0) {
            const cached = localStorage.getItem(STORAGE_KEY);
            if (cached) {
              setList(JSON.parse(cached));
            } else {
              setList(NHAN_SU_KHOI_DAU);
            }
          }
          return;
        }

        if (mounted) {
          if (data && data.length > 0) {
            const normalized = data.map((d: any) => normalizeEmployeeRecord(d) as NhanSuExt);
            setList(normalized);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
          } else {
            // Seed data if empty
            setList(NHAN_SU_KHOI_DAU);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(NHAN_SU_KHOI_DAU));
            
            // Background seed
            Promise.all(NHAN_SU_KHOI_DAU.map(nv => 
              supabaseUpsert("nhan_su", toSupabaseEmployeeRecord(nv))
            )).catch(err => console.error("Seed error", err));
          }
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
        if (mounted && list.length === 0) {
          setList(NHAN_SU_KHOI_DAU);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSupabase();

    return () => {
      mounted = false;
    };
  }, []); // Run once on mount

  const themNhanSu = useCallback(async (nv: NhanSuExt) => {
    // Optimistic UI update
    setList(prev => {
      const newList = [...prev, nv];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseEnabled) {
      try {
        const record = toSupabaseEmployeeRecord(nv);
        await supabaseUpsert("nhan_su", record);
        return true;
      } catch (err) {
        console.error("Supabase upsert error:", err);
        return false;
      }
    }
    return true;
  }, []);

  const suaNhanSu = useCallback(async (nv: NhanSuExt) => {
    setList(prev => {
      const newList = prev.map(x => x.maNV === nv.maNV ? nv : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseEnabled) {
      try {
        const record = toSupabaseEmployeeRecord(nv);
        await supabaseUpsert("nhan_su", record);
        return true;
      } catch (err) {
        console.error("Supabase update error:", err);
        return false;
      }
    }
    return true;
  }, []);

  const xoaNhanSu = useCallback(async (maNV: string) => {
    setList(prev => {
      const newList = prev.filter(x => x.maNV !== maNV);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseEnabled) {
      try {
        const { error } = await supabase!.from("nhan_su").delete().eq("ma_nv", maNV);
        if (error) throw error;
        return true;
      } catch (err) {
        console.error("Supabase delete error:", err);
        return false;
      }
    }
    return true;
  }, []);

  return (
    <Ctx.Provider value={{ list, themNhanSu, suaNhanSu, xoaNhanSu, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNhanSu() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNhanSu must be used within NhanSuProvider");
  return ctx;
}
