"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, supabaseUpsert, supabaseDelete, isSupabaseEnabled } from "@/lib/supabase/client";
import { NHAN_SU_KHOI_DAU, type NhanSuExt } from "@/app/(main)/nhan-su/data";
import { toSupabaseEmployeeRecord, normalizeEmployeeRecord } from "@/lib/employee-records";
import { authFetch } from "@/lib/auth-fetch";
import { toast } from "sonner";

// Bucket "employee-documents" (ảnh CCCD) là private - avatar/cccdFrontImage/
// cccdBackImage lưu trong DB là PATH bền, không phải URL xem được trực tiếp.
// Hàm này ký lại URL tạm (1 tiếng) cho các path đó trước khi đưa vào state
// hiển thị, đồng thời giữ lại path gốc ở *Path để NVFormModal lưu đúng path
// khi sửa hồ sơ mà không upload ảnh mới. Giá trị không phải path lưu trữ
// (avatar mẫu tĩnh /avatars/*, rỗng...) được giữ nguyên, không ký.
const isEmployeeStoragePath = (value?: string): value is string => Boolean(value && value.startsWith("nhan-su/"));

async function resolveEmployeeImageUrls(items: NhanSuExt[]): Promise<NhanSuExt[]> {
  const paths = new Set<string>();
  items.forEach((nv) => {
    if (isEmployeeStoragePath(nv.avatar)) paths.add(nv.avatar);
    if (isEmployeeStoragePath(nv.cccdFrontImage)) paths.add(nv.cccdFrontImage);
    if (isEmployeeStoragePath(nv.cccdBackImage)) paths.add(nv.cccdBackImage);
  });
  if (!paths.size) return items;

  let urls: Record<string, string> = {};
  try {
    const res = await authFetch("/api/employee-uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths: Array.from(paths) }),
    });
    const json = await res.json();
    urls = json.urls || {};
  } catch (err) {
    console.warn("[nhan-su] Không ký được URL ảnh CCCD:", err);
  }

  return items.map((nv) => ({
    ...nv,
    avatarPath: isEmployeeStoragePath(nv.avatar) ? nv.avatar : nv.avatarPath,
    cccdFrontPath: isEmployeeStoragePath(nv.cccdFrontImage) ? nv.cccdFrontImage : nv.cccdFrontPath,
    cccdBackPath: isEmployeeStoragePath(nv.cccdBackImage) ? nv.cccdBackImage : nv.cccdBackPath,
    avatar: isEmployeeStoragePath(nv.avatar) ? (urls[nv.avatar] || nv.avatar) : nv.avatar,
    cccdFrontImage: isEmployeeStoragePath(nv.cccdFrontImage) ? (urls[nv.cccdFrontImage] || nv.cccdFrontImage) : nv.cccdFrontImage,
    cccdBackImage: isEmployeeStoragePath(nv.cccdBackImage) ? (urls[nv.cccdBackImage] || nv.cccdBackImage) : nv.cccdBackImage,
  }));
}

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
        setList(prev => {
          if (prev.length === 0) return NHAN_SU_KHOI_DAU;
          if (prev.length < NHAN_SU_KHOI_DAU.length) {
            const missing = NHAN_SU_KHOI_DAU.filter(k => !prev.find(p => p.maNV === k.maNV));
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
        // 2026-08-08 - Select cu the (tranh loi schema cache voi column moi)
        // Dung wrapper "head" de check column ton tai truoc
        // avatar_url (không phải "avatar") - đúng tên cột gốc trong schema.sql;
        // toSupabaseEmployeeRecord() cũng ghi vào avatar_url, lệch tên ở đây
        // trước đó khiến ảnh đại diện không bao giờ đọc lại được sau khi lưu.
        const { data, error } = await supabase!.from("nhan_su").select("ma_nv, ho_ten, bo_phan, chuc_vu, sdt, email, ngay_sinh, gioi_tinh, cccd, dia_chi_tt, ngay_vao_lam, luong_cb, loai_luong, trang_thai, role, ma_dm, ghi_chu, avatar_url, cccd_front_url, cccd_back_url, bhxh, mst, so_tk, ngan_hang, don_gia_sp").order("stt", { ascending: true });
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
            
            // Lọc trùng lặp theo mã NV hoặc Tên NV (ưu tiên mã NV)
            const uniqueMap = new Map<string, NhanSuExt>();
            normalized.forEach(nv => {
              const key = nv.maNV ? nv.maNV.toLowerCase().trim() : nv.hoTen.toLowerCase().trim();
              if (!uniqueMap.has(key)) {
                uniqueMap.set(key, nv);
              }
            });
            const uniqueList = Array.from(uniqueMap.values()).sort((a, b) => (a.stt || 0) - (b.stt || 0));
            const resolvedList = await resolveEmployeeImageUrls(uniqueList);
            if (!mounted) return;

            setList(resolvedList);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(resolvedList));
          } else {
            // Seed data if empty
            setList(NHAN_SU_KHOI_DAU);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(NHAN_SU_KHOI_DAU));
            
            // Background seed
            Promise.all(NHAN_SU_KHOI_DAU.map(nv => 
              supabaseUpsert("nhan_su", toSupabaseEmployeeRecord(nv), "ma_nv")
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
    // nv.avatar/cccdFrontImage/cccdBackImage ở đây là path bền (NVFormModal đã
    // lưu path, không lưu URL ký tạm) - ký URL riêng cho state hiển thị, KHÔNG
    // dùng bản đã ký để ghi xuống Supabase (toSupabaseEmployeeRecord dùng `nv`
    // gốc bên dưới, không phải `display`).
    const display = (await resolveEmployeeImageUrls([nv]))[0];
    setList(prev => {
      const newList = [...prev, display];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseEnabled) {
      try {
        const record = toSupabaseEmployeeRecord(nv);
        await supabaseUpsert("nhan_su", record, "ma_nv");
        return true;
      } catch (err) {
        console.error("Supabase upsert error:", err);
        return false;
      }
    }
    return true;
  }, []);

  const suaNhanSu = useCallback(async (nv: NhanSuExt & { oldMaNV?: string }) => {
    const display = (await resolveEmployeeImageUrls([nv]))[0];
    const targetMa = nv.oldMaNV || nv.maNV;
    
    setList(prev => {
      const newList = prev.map(x => x.maNV === targetMa ? display : x);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });

    if (isSupabaseEnabled) {
      try {
        const record = toSupabaseEmployeeRecord(nv);
        await supabaseUpsert("nhan_su", record, "ma_nv");
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
