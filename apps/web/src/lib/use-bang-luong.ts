"use client";

// Hook bảng lương - Lấy data workflow từ các store + engine
// 2026-08-03 - Mavis
//
// Cách dùng:
//   const { bangLuong, tongKet, loading } = useBangLuongData(8, 2026);

import { useEffect, useState, useMemo } from "react";
import { tinhBangLuongThang, tongKetBangLuong, type BangLuongNV, type TongKetBangLuong } from "./bang-luong-engine";

/**
 * Hook lấy dữ liệu bảng lương từ các store localStorage + Supabase
 * Tự động merge với workflow data để tính lương
 */
export function useBangLuongData(thang: number, nam: number) {
  const [allPhieu, setAllPhieu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workflow từ localStorage (gồm: gia-cong-store, doi-soat-store, etc.)
  useEffect(() => {
    setLoading(true);
    try {
      // Gom data từ nhiều store localStorage
      const keys = [
        "mimin_gia_cong_taskStates",   // GiaCongStore
        "mimin_doi_soat_v1",            // DoiSoatStore
        "mimin_hoan_thien_v1",          // HoanThienStore
        "mimin_qc_v1",                  // QCStore
        "mimin_khsx_v1",                // KHSXStore
        "mimin_lenh_cat_v2",            // LenhCatStore
        "mimin_kho_vai_v2",             // KhoStore
      ];
      const allRows: any[] = [];
      for (const key of keys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              // Merge vào allRows
              for (const row of parsed) {
                // LenhCat không phải workflow - skip
                if (row.loaiLenh || row.maSP) continue;
                // Task phải có nguoiNhan
                if (row.nguoiNhan) {
                  allRows.push(row);
                }
              }
            }
          }
        } catch {}
      }
      // Fallback: nếu không có data, dùng ALL_REAL_PHIEU (đã xoá nên rỗng)
      setAllPhieu(allRows);
    } catch (err) {
      console.error("[useBangLuongData] Error:", err);
      setAllPhieu([]);
    } finally {
      setLoading(false);
    }
  }, [thang, nam]);

  // Tính bảng lương
  const bangLuong = useMemo(
    () => tinhBangLuongThang(thang, nam, allPhieu),
    [thang, nam, allPhieu]
  );
  const tongKet = useMemo(() => tongKetBangLuong(bangLuong), [bangLuong]);

  return { bangLuong, tongKet, loading, allPhieuCount: allPhieu.length };
}
