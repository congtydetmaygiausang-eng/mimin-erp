"use client";

import { supabase, isSupabaseEnabled } from "./client";

const STORAGE_PREFIX = "mimin_";

// LocalStorage key map → Supabase table
const SYNC_MAP: Record<string, { table: string; map: (item: any) => any }> = {
  "phanCong_v1": {
    table: "phan_cong",
    map: (p) => ({
      id: p.id,
      lenh_cat_id: p.lenhCatId,
      cong_doan: p.congDoan,
      nguoi_ma: p.nguoiPhuTrach.ma,
      nguoi_ten: p.nguoiPhuTrach.ten,
      nguoi_loai: p.nguoiPhuTrach.loai,
      nguoi_sdt: p.nguoiPhuTrach.sdt,
      don_gia_giao: p.donGiaGiao,
      so_luong_giao: p.soLuongGiao,
      don_vi: p.donVi,
      ngay_giao: p.ngayGiao,
      ngay_xong_du_kien: p.ngayXongDuKien,
      trang_thai: p.trangThai,
      da_thanh_toan: p.daThanhToan,
      ghi_chu: p.ghiChu,
    }),
  },
  "mimin_kho_vai_v2": {
    table: "giao_dich_kho",
    map: (g) => ({
      id: g.id,
      ngay: g.ngay,
      loai: g.loai,
      ma_vt: g.maVT,
      ten_vt: g.tenVT,
      so_luong: g.soLuong,
      don_vi: g.donVi,
      don_gia: g.donGia,
      thanh_tien: g.thanhTien,
      loai_kho: g.loaiKho || "vai",
      nguon_nhap: g.nguonNhap,
      nguoi_thuc_hien: g.nguoiThucHien,
      ghi_chu: g.ghiChu,
    }),
  },
};

export async function pushToSupabase() {
  if (!isSupabaseEnabled || !supabase) {
    throw new Error("Supabase chưa được cấu hình");
  }
  const results: { table: string; count: number; error?: string }[] = [];
  for (const [key, config] of Object.entries(SYNC_MAP)) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data) || data.length === 0) continue;
      // LoaiKho không có trong data, cần infer từ maVT
      const records = data.map((item) => {
        const mapped = config.map(item);
        if (config.table === "giao_dich_kho" && !mapped.loai_kho) {
          mapped.loai_kho = mapped.ma_vt?.startsWith("VT-") ? "phu-lieu" : "vai";
        }
        return mapped;
      });
      // Xoá dữ liệu cũ trước
      await supabase.from(config.table).delete().neq("id", "__never__");
      // Insert dữ liệu mới (chunk 100/lần)
      for (let i = 0; i < records.length; i += 100) {
        const chunk = records.slice(i, i + 100);
        const { error } = await supabase.from(config.table).insert(chunk);
        if (error) throw error;
      }
      results.push({ table: config.table, count: records.length });
    } catch (e: any) {
      results.push({ table: config.table, count: 0, error: e.message });
    }
  }
  return results;
}

export async function pullFromSupabase() {
  if (!isSupabaseEnabled || !supabase) {
    throw new Error("Supabase chưa được cấu hình");
  }
  const results: { table: string; count: number; data?: any[] }[] = [];
  for (const [key, config] of Object.entries(SYNC_MAP)) {
    try {
      const { data, error } = await supabase.from(config.table).select("*");
      if (error) throw error;
      if (data) {
        // Convert về format localStorage
        if (config.table === "phan_cong") {
          const localData = data.map((p: any) => ({
            id: p.id,
            lenhCatId: p.lenh_cat_id,
            congDoan: p.cong_doan,
            nguoiPhuTrach: {
              ma: p.nguoi_ma,
              ten: p.nguoi_ten,
              loai: p.nguoi_loai,
              sdt: p.nguoi_sdt,
            },
            donGiaGiao: p.don_gia_giao,
            soLuongGiao: p.so_luong_giao,
            donVi: p.don_vi,
            ngayGiao: p.ngay_giao,
            ngayXongDuKien: p.ngay_xong_du_kien,
            trangThai: p.trang_thai,
            daThanhToan: p.da_thanh_toan,
            ghiChu: p.ghi_chu,
          }));
          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(localData));
          results.push({ table: config.table, count: localData.length, data: localData });
        } else if (config.table === "giao_dich_kho") {
          const localData = data.map((g: any) => ({
            id: g.id,
            ngay: g.ngay,
            loai: g.loai,
            maVT: g.ma_vt,
            tenVT: g.ten_vt,
            soLuong: g.so_luong,
            donVi: g.don_vi,
            donGia: g.don_gia,
            thanhTien: g.thanh_tien,
            loaiKho: g.loai_kho,
            nguonNhap: g.nguon_nhap,
            nguoiThucHien: g.nguoi_thuc_hien,
            ghiChu: g.ghi_chu,
          }));
          localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(localData));
          results.push({ table: config.table, count: localData.length, data: localData });
        }
      }
    } catch (e: any) {
      results.push({ table: config.table, count: 0 });
    }
  }
  return results;
}

export function getLocalStats() {
  const stats: { key: string; count: number }[] = [];
  for (const key of Object.keys(SYNC_MAP)) {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) stats.push({ key: key.replace("mimin_", ""), count: data.length });
      } catch {}
    }
  }
  return stats;
}
