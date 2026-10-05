"use client";

// Hook bảng lương - Lấy data workflow từ Supabase + localStorage
// 2026-08-05 - Mavis update: fetch từ Supabase trước, fallback localStorage
//
// Strategy:
// 1. Thử fetch từ Supabase (nếu isSupabaseEnabled + có data)
// 2. Fallback về localStorage nếu Supabase fail/empty
// 3. Convert từng schema row thành format chuẩn cho tinhBangLuongThang

import { useEffect, useState, useMemo } from "react";
import { tinhBangLuongThang, tongKetBangLuong, type BangLuongNV, type TongKetBangLuong, type NhanSuLuongInput } from "./bang-luong-engine";
import { supabaseFetchAll, isSupabaseEnabled, supabase } from "@/lib/supabase/client";

// ============ TYPES ============
type WorkflowRow = {
  id: string;
  nguoiNhan: string;     // maNV
  ngayHoanThanh?: string;
  ngayNhan?: string;
  ngayGiao?: string;
  soLuongGiao?: number;
  soLuongDat?: number;
  soLuongLoi?: number;
};

// Supabase row types (camelCase)
type PhanCongRow = {
  id: string;
  maLenhCat?: string;
  // nguoiPhuTrach là object { loai, ma, ten, sdt? } (xem lib/data/cong-no.ts NguoiPhuTrach)
  nguoiPhuTrach?: { ma?: string; ten?: string } | string;
  soLuongGiao?: number;
  ngayGiao?: string;
  ngayXongDuKien?: string;
  donGiaGiao?: number;
};

/** Lấy mã NV/đối tác từ nguoiPhuTrach (object {ma,ten} hoặc string cũ) */
function maFromNguoiPhuTrach(v: { ma?: string; ten?: string } | string | undefined): string {
  if (!v) return "";
  return typeof v === "string" ? v : v.ma || "";
}

type DoiSoatRow = {
  id: string;
  taskId?: string;
  nguoiThucHienMa?: string;
  soLuongNhan?: number;
  soLuongDat?: number;
  soLuongLoi?: number;
  ngayGiao?: string;
};

type QCRow = {
  id: string;
  maLenhCat?: string;
  nguoiQC?: string;
  soLuongKiem?: number;
  soLuongDat?: number;
  soLuongLoi?: number;
  ngayKiem?: string;
};

type KHSXRow = {
  id: string;
  maLenhCat?: string;
  nguoiPhuTrach?: string;
  soLuong?: number;
  ngayBD?: string;
  ngayKT?: string;
};

type HoanThienRow = {
  id: string;
  maLenhCat?: string;
  nguoiHT?: string;
  soLuong?: number;
  ngayHT?: string;
};

// ============ CONVERTERS ============
function phanCongToWorkflow(r: PhanCongRow): WorkflowRow | null {
  if (!r.id) return null;
  return {
    id: `PC-${r.id}`,
    nguoiNhan: maFromNguoiPhuTrach(r.nguoiPhuTrach),
    ngayGiao: r.ngayGiao,
    ngayHoanThanh: r.ngayXongDuKien,
    soLuongGiao: r.soLuongGiao || 0,
    soLuongDat: r.soLuongGiao || 0,  // Approximation
  };
}

function doiSoatToWorkflow(r: DoiSoatRow): WorkflowRow | null {
  if (!r.id || !r.nguoiThucHienMa) return null;
  return {
    id: r.taskId || r.id,
    nguoiNhan: r.nguoiThucHienMa,
    ngayGiao: r.ngayGiao,
    soLuongGiao: r.soLuongNhan || 0,
    soLuongDat: r.soLuongDat || 0,
    soLuongLoi: r.soLuongLoi || 0,
  };
}

function qcToWorkflow(r: QCRow): WorkflowRow | null {
  if (!r.id || !r.nguoiQC) return null;
  return {
    id: r.id,
    nguoiNhan: r.nguoiQC,
    ngayHoanThanh: r.ngayKiem,
    soLuongDat: r.soLuongDat || 0,
    soLuongLoi: r.soLuongLoi || 0,
  };
}

function khsxToWorkflow(r: KHSXRow): WorkflowRow | null {
  if (!r.id || !r.nguoiPhuTrach) return null;
  return {
    id: r.id,
    nguoiNhan: r.nguoiPhuTrach,
    ngayGiao: r.ngayBD,
    ngayHoanThanh: r.ngayKT,
    soLuongGiao: r.soLuong || 0,
  };
}

function hoanThienToWorkflow(r: HoanThienRow): WorkflowRow | null {
  if (!r.id || !r.nguoiHT) return null;
  return {
    id: r.id,
    nguoiNhan: r.nguoiHT,
    ngayHoanThanh: r.ngayHT,
    soLuongDat: r.soLuong || 0,
  };
}

// ============ MAIN HOOK ============
export function useBangLuongData(thang: number, nam: number) {
  const [allPhieu, setAllPhieu] = useState<WorkflowRow[]>([]);
  const [employees, setEmployees] = useState<NhanSuLuongInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"supabase" | "localStorage" | "empty">("empty");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 0. Load danh sách nhân sự hiện tại từ Supabase / localStorage
        try {
          let rawEmployees: any[] = [];
          if (isSupabaseEnabled && supabase) {
            const { data, error } = await supabase.from("nhan_su").select("*").order("stt", { ascending: true });
            if (!error && data && data.length > 0) {
              rawEmployees = data;
            }
          }
          if (rawEmployees.length === 0) {
            const cached = typeof window !== "undefined" ? localStorage.getItem("mimin_nhan_su_v1") : null;
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) rawEmployees = parsed;
              } catch {}
            }
          }
          // Lọc danh sách: chỉ nhận các nhân sự chính thức NV01-NV05 (loại bỏ toàn bộ nhân viên test cũ như GS002..GS018 nếu còn sót trong cache)
          const officialCodes = new Set(["NV01", "NV02", "NV03", "NV04", "NV05"]);
          if (rawEmployees.some(r => officialCodes.has((r.ma_nv || r.maNV || "").toUpperCase().trim()))) {
            rawEmployees = rawEmployees.filter(r => officialCodes.has((r.ma_nv || r.maNV || "").toUpperCase().trim()));
          }

          if (rawEmployees.length > 0) {
            const parsedEmployees: NhanSuLuongInput[] = rawEmployees.map((r) => {
              const chucVu = r.chuc_vu || r.chucVu || "";
              const boPhan = r.bo_phan || r.boPhan || "Sản xuất";
              let lc = Number(r.luong_cung || r.luong_cb || r.luongCung || r.luongCB || 0);
              if (lc === 0) {
                if (/giám đốc/i.test(chucVu)) lc = 25_000_000;
                else if (/trưởng|quản lý/i.test(chucVu)) lc = 12_000_000;
                else if (/kho/i.test(boPhan)) lc = 8_000_000;
                else if (/kế toán/i.test(boPhan)) lc = 10_000_000;
                else if (/kinh doanh/i.test(boPhan)) lc = 10_000_000;
                else if (/media|marketing/i.test(boPhan)) lc = 10_000_000;
                else if (/sản xuất/i.test(boPhan)) lc = 7_000_000;
              }
              return {
                ma: r.ma_nv || r.maNV || "",
                ten: r.ho_ten || r.hoTen || "",
                boPhan,
                chucVu,
                luongCung: lc,
                donGia: Number(r.don_gia || r.don_gia_sp || 0),
                ghiChu: r.ghi_chu || r.ghiChu || `${chucVu} - ${boPhan}`,
              };
            });
            if (!cancelled) setEmployees(parsedEmployees);
          }
        } catch (err) {
          console.warn("[useBangLuongData] Fetch nhan_su error:", err);
        }

        const allRows: WorkflowRow[] = [];

        // 1. Thử fetch từ Supabase
        if (isSupabaseEnabled) {
          try {
            const [pc, ds, qc, kx, ht] = await Promise.all([
              supabaseFetchAll<PhanCongRow>("phan_cong", "ngayGiao", true).catch(() => []),
              supabaseFetchAll<DoiSoatRow>("doi_soat", "ngayGiao", true).catch(() => []),
              supabaseFetchAll<QCRow>("qc_records", "ngayKiem", true).catch(() => []),
              supabaseFetchAll<KHSXRow>("khsx", "ngayBD", true).catch(() => []),
              supabaseFetchAll<HoanThienRow>("hoan_thien", "ngayHT", true).catch(() => []),
            ]);

            for (const r of pc) {
              const w = phanCongToWorkflow(r);
              if (w && w.nguoiNhan) allRows.push(w);
            }
            for (const r of ds) {
              const w = doiSoatToWorkflow(r);
              if (w && w.nguoiNhan) allRows.push(w);
            }
            for (const r of qc) {
              const w = qcToWorkflow(r);
              if (w && w.nguoiNhan) allRows.push(w);
            }
            for (const r of kx) {
              const w = khsxToWorkflow(r);
              if (w && w.nguoiNhan) allRows.push(w);
            }
            for (const r of ht) {
              const w = hoanThienToWorkflow(r);
              if (w && w.nguoiNhan) allRows.push(w);
            }

            if (!cancelled && allRows.length > 0) {
              setAllPhieu(allRows);
              setSource("supabase");
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn("[useBangLuongData] Supabase fetch failed, fallback localStorage:", err);
          }
        }

        // 2. Fallback: load từ localStorage
        const keys = [
          "mimin_gia_cong_taskStates",   // GiaCongStore (data.taskStates)
          "mimin_doi_soat_v1",            // DoiSoatStore (array)
          "mimin_hoan_thien_v1",          // HoanThienStore (array)
          "mimin_qc_v1",                  // QCStore (array)
          "mimin_khsx_v1",                // KHSXStore (array)
          "mimin_phan_cong_v1",           // PhanCongStore (array)
          "mimin_lenh_cat_v2",            // LenhCatStore (array)
          "mimin_kho_vai_v2",             // KhoStore (array)
        ];
        for (const key of keys) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) continue;

            for (const row of parsed) {
              if (!row) continue;
              // LenhCat không phải workflow - skip
              if (row.loaiLenh || row.maSP) continue;
              // Phải có nguoiNhan hoặc nguoiPhuTrach (phan_cong) hoặc nguoiThucHienMa (doi_soat)
              const maNV = row.nguoiNhan || row.nguoiPhuTrach?.ten || row.nguoiPhuTrach || row.nguoiThucHienMa;
              if (!maNV) continue;

              // Convert sang format WorkflowRow
              const w: WorkflowRow = {
                id: row.id || `local-${Math.random()}`,
                nguoiNhan: maNV,
                ngayHoanThanh: row.ngayHoanThanh || row.ngayNhan || row.ngayHT || row.ngayKiem,
                ngayGiao: row.ngayGiao || row.ngayBD,
                soLuongGiao: row.soLuongGiao || row.soLuongNhan || 0,
                soLuongDat: row.soLuongDat || row.soLuongKiem || 0,
                soLuongLoi: row.soLuongLoi || 0,
              };
              allRows.push(w);
            }
          } catch {}
        }

        if (!cancelled) {
          setAllPhieu(allRows);
          setSource(allRows.length > 0 ? "localStorage" : "empty");
        }
      } catch (err) {
        console.error("[useBangLuongData] Error:", err);
        if (!cancelled) setAllPhieu([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [thang, nam]);

  // Tính bảng lương
  const bangLuong = useMemo(
    () => tinhBangLuongThang(thang, nam, allPhieu, employees.length > 0 ? employees : undefined),
    [thang, nam, allPhieu, employees]
  );
  const tongKet = useMemo(() => tongKetBangLuong(bangLuong), [bangLuong]);

  return { bangLuong, tongKet, loading, allPhieuCount: allPhieu.length, source };
}
