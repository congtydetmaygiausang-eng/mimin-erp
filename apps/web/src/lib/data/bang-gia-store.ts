"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";

export const KENH_BAN = ["ban-le", "ban-si", "ban-lo", "tiktok", "shopee"] as const;
export type KenhBan = (typeof KENH_BAN)[number];
export type TrangThaiBangGia = "nhap" | "dang-ap-dung" | "ngung-ap-dung";

export interface BangGia {
  id: string;
  tenBangGia: string;
  kenhBan: KenhBan;
  tuNgay?: string;
  denNgay?: string;
  trangThai: TrangThaiBangGia;
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BangGiaChiTiet {
  id: string;
  bangGiaId: string;
  maSP: string;
  maSKUBienThe?: string;
  giaBan: number;
  soLuongTu: number;
  soLuongDen?: number;
  ghiChu?: string;
  createdAt?: string;
  updatedAt?: string;
}

const LIST_KEY = "mimin_bang_gia_v1";
const DETAIL_KEY = "mimin_bang_gia_chi_tiet_v1";

type BangGiaRow = {
  id: string;
  ten_bang_gia: string;
  kenh_ban: KenhBan;
  tu_ngay?: string | null;
  den_ngay?: string | null;
  trang_thai: TrangThaiBangGia;
  ghi_chu?: string | null;
  created_at?: string;
  updated_at?: string;
};

type BangGiaChiTietRow = {
  id: string;
  bang_gia_id: string;
  ma_sp: string;
  ma_sku_bien_the?: string | null;
  gia_ban: number;
  so_luong_tu: number;
  so_luong_den?: number | null;
  ghi_chu?: string | null;
  created_at?: string;
  updated_at?: string;
};

function mapList(row: BangGiaRow): BangGia {
  return {
    id: row.id,
    tenBangGia: row.ten_bang_gia,
    kenhBan: row.kenh_ban,
    tuNgay: row.tu_ngay || undefined,
    denNgay: row.den_ngay || undefined,
    trangThai: row.trang_thai,
    ghiChu: row.ghi_chu || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDetail(row: BangGiaChiTietRow): BangGiaChiTiet {
  return {
    id: row.id,
    bangGiaId: row.bang_gia_id,
    maSP: row.ma_sp,
    maSKUBienThe: row.ma_sku_bien_the || undefined,
    giaBan: Number(row.gia_ban) || 0,
    soLuongTu: Number(row.so_luong_tu) || 1,
    soLuongDen: row.so_luong_den == null ? undefined : Number(row.so_luong_den),
    ghiChu: row.ghi_chu || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value as T[] : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function listRow(item: BangGia): BangGiaRow {
  return {
    id: item.id,
    ten_bang_gia: item.tenBangGia,
    kenh_ban: item.kenhBan,
    tu_ngay: item.tuNgay || null,
    den_ngay: item.denNgay || null,
    trang_thai: item.trangThai,
    ghi_chu: item.ghiChu || null,
  };
}

function detailRow(item: BangGiaChiTiet): BangGiaChiTietRow {
  return {
    id: item.id,
    bang_gia_id: item.bangGiaId,
    ma_sp: item.maSP,
    ma_sku_bien_the: item.maSKUBienThe || null,
    gia_ban: item.giaBan,
    so_luong_tu: item.soLuongTu,
    so_luong_den: item.soLuongDen ?? null,
    ghi_chu: item.ghiChu || null,
  };
}

export function useBangGia() {
  const [bangGia, setBangGia] = useState<BangGia[]>([]);
  const [chiTiet, setChiTiet] = useState<BangGiaChiTiet[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const localLists = load<BangGia>(LIST_KEY);
    const localDetails = load<BangGiaChiTiet>(DETAIL_KEY);
    setBangGia(localLists);
    setChiTiet(localDetails);
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }
    try {
      const [lists, details] = await Promise.all([
        supabase.from("bang_gia").select("*").order("created_at", { ascending: false }),
        supabase.from("bang_gia_chi_tiet").select("*").order("created_at", { ascending: true }),
      ]);
      if (lists.error) throw lists.error;
      if (details.error) throw details.error;
      const nextLists = (lists.data || []).map((row) => mapList(row as BangGiaRow));
      const nextDetails = (details.data || []).map((row) => mapDetail(row as BangGiaChiTietRow));
      setBangGia(nextLists);
      setChiTiet(nextDetails);
      save(LIST_KEY, nextLists);
      save(DETAIL_KEY, nextDetails);
    } catch (error) {
      console.warn("[BangGiaStore] Supabase fetch failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const themBangGia = useCallback(async (input: Omit<BangGia, "id">) => {
    const item: BangGia = { ...input, id: `BG-${Date.now()}` };
    setBangGia((current) => { const next = [item, ...current]; save(LIST_KEY, next); return next; });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia").insert(listRow(item));
    return item;
  }, []);

  const suaBangGia = useCallback(async (id: string, patch: Partial<BangGia>) => {
    const currentItem = bangGia.find((item) => item.id === id);
    if (!currentItem) return;
    const updated: BangGia = { ...currentItem, ...patch, updatedAt: new Date().toISOString() };
    setBangGia((current) => {
      const next = current.map((item) => item.id === id ? updated : item);
      save(LIST_KEY, next);
      return next;
    });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia").update(listRow(updated)).eq("id", id);
  }, [bangGia]);

  const xoaBangGia = useCallback(async (id: string) => {
    setBangGia((current) => { const next = current.filter((item) => item.id !== id); save(LIST_KEY, next); return next; });
    setChiTiet((current) => { const next = current.filter((item) => item.bangGiaId !== id); save(DETAIL_KEY, next); return next; });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia").delete().eq("id", id);
  }, []);

  const themChiTiet = useCallback(async (input: Omit<BangGiaChiTiet, "id">) => {
    const item: BangGiaChiTiet = { ...input, id: `BGCT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
    setChiTiet((current) => { const next = [...current, item]; save(DETAIL_KEY, next); return next; });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia_chi_tiet").insert(detailRow(item));
    return item;
  }, []);

  const suaChiTiet = useCallback(async (id: string, patch: Partial<BangGiaChiTiet>) => {
    const currentItem = chiTiet.find((item) => item.id === id);
    if (!currentItem) return;
    const updated: BangGiaChiTiet = { ...currentItem, ...patch, updatedAt: new Date().toISOString() };
    setChiTiet((current) => {
      const next = current.map((item) => item.id === id ? updated : item);
      save(DETAIL_KEY, next);
      return next;
    });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia_chi_tiet").update(detailRow(updated)).eq("id", id);
  }, [chiTiet]);

  const xoaChiTiet = useCallback(async (id: string) => {
    setChiTiet((current) => { const next = current.filter((item) => item.id !== id); save(DETAIL_KEY, next); return next; });
    if (isSupabaseEnabled && supabase) await supabase.from("bang_gia_chi_tiet").delete().eq("id", id);
  }, []);

  const layGia = useCallback((kenhBan: KenhBan, maSP: string, maSKUBienThe?: string, soLuong = 1) => {
    const lists = bangGia.filter((item) => item.kenhBan === kenhBan && item.trangThai === "dang-ap-dung");
    const today = new Date().toISOString().slice(0, 10);
    const active = lists.filter((item) => (!item.tuNgay || item.tuNgay <= today) && (!item.denNgay || item.denNgay >= today));
    const candidates = chiTiet.filter((item) => active.some((list) => list.id === item.bangGiaId) && item.maSP === maSP && (!item.maSKUBienThe || item.maSKUBienThe === maSKUBienThe) && item.soLuongTu <= soLuong && (!item.soLuongDen || soLuong <= item.soLuongDen));
    return candidates.sort((a, b) => Number(Boolean(b.maSKUBienThe)) - Number(Boolean(a.maSKUBienThe)) || b.soLuongTu - a.soLuongTu)[0]?.giaBan;
  }, [bangGia, chiTiet]);

  return { bangGia, chiTiet, loading, refresh, themBangGia, suaBangGia, xoaBangGia, themChiTiet, suaChiTiet, xoaChiTiet, layGia };
}
