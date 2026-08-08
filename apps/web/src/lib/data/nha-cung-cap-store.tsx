"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { NCCS, formatVNDShort } from "@/lib/data/real-data";
import { toast } from "sonner";

export type NhaCungCapModel = {
  id: string;
  ma_ncc: string;
  ten_ncc: string;
  han_muc?: number; // P1 - 2026-08-07 - han muc cho no
  loai: string;
  dia_chi?: string;
  sdt?: string;
  email?: string;
  mst?: string;
  nguoi_lh?: string;
  cong_no: number;
  don_gia?: string;
  ghi_chu?: string;
  trang_thai?: string;
  rating?: number; // P2 - 2026-08-07 - tach ra column rieng (truoc day luu trong ghi_chu text)
};

// Convert UI model to DB model
export function toDBNhaCungCap(ncc: NhaCungCapModel) {
  // P2 - 2026-08-07 - Rating tach rieng, khong luu trong ghi_chu
  return {
    ...ncc,
    ghi_chu: ncc.ghi_chu || "", // ghi_chu sach, khong kem "Rating:X" nua
  };
}

// Convert DB to UI
export function fromDBNhaCungCap(row: any): NhaCungCapModel {
  // P2 - 2026-08-07 - Lay rating tu column rieng, fallback tu ghi_chu neu chua migrate
  let rating = row.rating || 4;
  if (!row.rating) {
    const match = row.ghi_chu?.match(/Rating:\s*([\d.]+)/);
    if (match) rating = parseFloat(match[1]);
  }
  return {
    ...row,
    rating,
  };
}

type NhanCungCapContextType = {
  list: NhaCungCapModel[];
  themNCC: (ncc: NhaCungCapModel) => Promise<boolean>;
  suaNCC: (ncc: NhaCungCapModel) => Promise<boolean>;
  xoaNCC: (ma_ncc: string) => Promise<boolean>;
  loading: boolean;
};

const Ctx = createContext<NhanCungCapContextType | null>(null);
const STORAGE_KEY = "mimin_nha_cung_cap_v1";

// Default seed data
const DEFAULT_SEED: NhaCungCapModel[] = NCCS.map((n, i) => ({
  ma_ncc: `NCC-${String(i + 1).padStart(3, "0")}`,
  ten_ncc: n.ten,
  loai: n.vaiTro,
  sdt: `090${(1000000 + i * 12345).toString().slice(0, 7)}`,
  email: `ncc${i + 1}@${n.ten.toLowerCase().split(" ")[0] || "vendor"}.vn`,
  dia_chi: i % 2 === 0 ? "Quận 12, TP.HCM" : "Hóc Môn, TP.HCM",
  mst: `0312${String(456789 + i * 13).slice(0, 6)}`,
  cong_no: n.congNo || 0,
  don_gia: n.donGia || "",
  ghi_chu: `Hợp tác từ 2020. Rating:${4 + (i % 2) * 0.5}`,
  trang_thai: "Đang hợp tác",
  rating: 4 + (i % 2) * 0.5,
}));

export function NhaCungCapProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<NhaCungCapModel[]>([]);
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
        if (list.length === 0) setList(DEFAULT_SEED);
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase!.from("nha_cung_cap").select("*").order("created_at", { ascending: true });
        if (error) throw error;
        
        if (mounted) {
          if (data && data.length > 0) {
            const mapped = data.map(fromDBNhaCungCap);
            setList(mapped);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
          } else {
            setList(DEFAULT_SEED);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEED));
            // Background seed
            Promise.all(DEFAULT_SEED.map(ncc => 
              supabaseUpsert("nha_cung_cap", toDBNhaCungCap(ncc))
            )).catch(() => {});
          }
        }
      } catch (err) {
        if (mounted && list.length === 0) setList(DEFAULT_SEED);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSupabase();
    return () => { mounted = false; };
  }, []);

  const themNCC = useCallback(async (ncc: NhaCungCapModel) => {
    setList(prev => {
      const newList = [...prev, ncc];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabaseUpsert("nha_cung_cap", toDBNhaCungCap(ncc));
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const suaNCC = useCallback(async (ncc: NhaCungCapModel) => {
    setList(prev => {
      const newList = prev.map(x => x.ma_ncc === ncc.ma_ncc ? ncc : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabaseUpsert("nha_cung_cap", toDBNhaCungCap(ncc));
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  const xoaNCC = useCallback(async (ma_ncc: string) => {
    setList(prev => {
      const newList = prev.filter(x => x.ma_ncc !== ma_ncc);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
    if (isSupabaseEnabled) {
      try {
        await supabase!.from("nha_cung_cap").delete().eq("ma_ncc", ma_ncc);
        return true;
      } catch (err) { return false; }
    }
    return true;
  }, []);

  return (
    <Ctx.Provider value={{ list, themNCC, suaNCC, xoaNCC, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNhaCungCap() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNhaCungCap must be used within NhaCungCapProvider");
  return ctx;
}
