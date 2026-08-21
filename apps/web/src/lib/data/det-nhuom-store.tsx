"use client";

// ============================================
// Module Dệt Nhuộm (Sợi -> Dệt -> Nhuộm -> Nhập kho)
// Thay thế 5 module cũ (yarn-production-chain/yarn-weaving-dyeing/
// yarn-warehouse/yarn-inventory/yarn-me-soi-engine) vốn chỉ chạy
// localStorage, không có dữ liệu thật.
//
// Nguyên tắc: KHÔNG tạo bảng kho/công nợ riêng - dùng lại đúng nguồn thật
// đã có: giao_dich_kho (tồn vải), nha_cung_cap.cong_no (công nợ NCC/xưởng
// gia công), logAudit() (nhật ký). det_nhuom_cost_ledger chỉ là "ảnh chụp"
// giá vốn phục vụ báo cáo, không phải nguồn công nợ.
//
// Công nợ được cộng NGAY khi chi phí phát sinh (lúc nhập sợi / giao dệt /
// giao nhuộm) - không đợi đến bước "xác nhận nhập kho", tránh cộng trùng.
// ============================================

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { logAudit } from "@/lib/audit-log";
import { useSession } from "@/components/session-provider";
import { toast } from "sonner";

// ============ TYPES (UI model - camelCase) ============
export type NhapSoi = {
  id: string;
  nccId?: string;
  nccTen: string;
  loaiSoi: string;
  kg: number;
  gia: number;
  thanhTien: number;
  maPhieu?: string;
  anhChungTu?: string;
  ngay: string;
  nguoiTao?: string;
  ghiChu?: string;
};

export type GiaoDet = {
  id: string;
  nhapSoiId?: string;
  xuongId?: string;
  xuongTen: string;
  kgVao: number;
  kgRa: number;
  cay: number;
  giaDet: number;
  dinhMucHaoHut: number;
  haoHutThucTe: number;
  vuotDinhMuc: boolean;
  tienPhatHaoHut: number;
  chungTuUrl?: string;
  nguoiPhuTrach?: string;
  ngay: string;
  ghiChu?: string;
};

export type GiaoNhuom = {
  id: string;
  giaoDetId?: string;
  xuongId?: string;
  xuongTen: string;
  mau: string;
  cay: number;
  kgGui: number;
  kgTp: number;
  gia: number;
  kho: string;
  dinhMucHaoHut: number;
  haoHutThucTe: number;
  vuotDinhMuc: boolean;
  tienPhatHaoHut: number;
  daNhapKho: boolean;
  maVtKho?: string;
  chungTuUrl?: string;
  nguoiPhuTrach?: string;
  ngay: string;
  ghiChu?: string;
};

// ============ Tính hao hụt (dùng chung cho store lẫn UI preview) ============
export function calcHaoHut(kgVao: number, kgRa: number, dinhMuc: number) {
  const haoHutThucTe = kgVao > 0 ? Math.max(0, ((kgVao - kgRa) / kgVao) * 100) : 0;
  const vuotDinhMuc = haoHutThucTe > dinhMuc;
  return { haoHutThucTe: Math.round(haoHutThucTe * 100) / 100, vuotDinhMuc };
}

function tienPhat(kgVao: number, haoHutThucTe: number, dinhMuc: number, donGia: number) {
  if (haoHutThucTe <= dinhMuc) return 0;
  const kgVuot = (kgVao * (haoHutThucTe - dinhMuc)) / 100;
  return Math.round(kgVuot * donGia);
}

// ============ Map Supabase (snake_case) <-> UI (camelCase) ============
function soiFromRow(r: any): NhapSoi {
  return {
    id: String(r.id),
    nccId: r.ncc_id || undefined,
    nccTen: r.ncc_ten || "",
    loaiSoi: r.loai_soi || "",
    kg: Number(r.kg) || 0,
    gia: Number(r.gia) || 0,
    thanhTien: Number(r.thanh_tien) || 0,
    maPhieu: r.ma_phieu || undefined,
    anhChungTu: r.anh_chung_tu || undefined,
    ngay: String(r.ngay || "").slice(0, 10),
    nguoiTao: r.nguoi_tao || undefined,
    ghiChu: r.ghi_chu || undefined,
  };
}
function soiToRow(s: NhapSoi) {
  return {
    id: s.id,
    ncc_id: s.nccId || null,
    ncc_ten: s.nccTen,
    loai_soi: s.loaiSoi,
    kg: s.kg,
    gia: s.gia,
    thanh_tien: s.thanhTien,
    ma_phieu: s.maPhieu || null,
    anh_chung_tu: s.anhChungTu || null,
    ngay: s.ngay,
    nguoi_tao: s.nguoiTao || null,
    ghi_chu: s.ghiChu || null,
  };
}

function detFromRow(r: any): GiaoDet {
  return {
    id: String(r.id),
    nhapSoiId: r.nhap_soi_id || undefined,
    xuongId: r.xuong_id || undefined,
    xuongTen: r.xuong_ten || "",
    kgVao: Number(r.kg_vao) || 0,
    kgRa: Number(r.kg_ra) || 0,
    cay: Number(r.cay) || 0,
    giaDet: Number(r.gia_det) || 0,
    dinhMucHaoHut: Number(r.dinh_muc_hao_hut) || 0,
    haoHutThucTe: Number(r.hao_hut_thuc_te) || 0,
    vuotDinhMuc: !!r.vuot_dinh_muc,
    tienPhatHaoHut: Number(r.tien_phat_hao_hut) || 0,
    chungTuUrl: r.chung_tu_url || undefined,
    nguoiPhuTrach: r.nguoi_phu_trach || undefined,
    ngay: String(r.ngay || "").slice(0, 10),
    ghiChu: r.ghi_chu || undefined,
  };
}
function detToRow(d: GiaoDet) {
  return {
    id: d.id,
    nhap_soi_id: d.nhapSoiId || null,
    xuong_id: d.xuongId || null,
    xuong_ten: d.xuongTen,
    kg_vao: d.kgVao,
    kg_ra: d.kgRa,
    cay: d.cay,
    gia_det: d.giaDet,
    dinh_muc_hao_hut: d.dinhMucHaoHut,
    hao_hut_thuc_te: d.haoHutThucTe,
    vuot_dinh_muc: d.vuotDinhMuc,
    tien_phat_hao_hut: d.tienPhatHaoHut,
    chung_tu_url: d.chungTuUrl || null,
    nguoi_phu_trach: d.nguoiPhuTrach || null,
    ngay: d.ngay,
    ghi_chu: d.ghiChu || null,
  };
}

function nhuomFromRow(r: any): GiaoNhuom {
  return {
    id: String(r.id),
    giaoDetId: r.giao_det_id || undefined,
    xuongId: r.xuong_id || undefined,
    xuongTen: r.xuong_ten || "",
    mau: r.mau || "",
    cay: Number(r.cay) || 0,
    kgGui: Number(r.kg_gui) || 0,
    kgTp: Number(r.kg_tp) || 0,
    gia: Number(r.gia) || 0,
    kho: r.kho || "vai",
    dinhMucHaoHut: Number(r.dinh_muc_hao_hut) || 0,
    haoHutThucTe: Number(r.hao_hut_thuc_te) || 0,
    vuotDinhMuc: !!r.vuot_dinh_muc,
    tienPhatHaoHut: Number(r.tien_phat_hao_hut) || 0,
    daNhapKho: !!r.da_nhap_kho,
    maVtKho: r.ma_vt_kho || undefined,
    chungTuUrl: r.chung_tu_url || undefined,
    nguoiPhuTrach: r.nguoi_phu_trach || undefined,
    ngay: String(r.ngay || "").slice(0, 10),
    ghiChu: r.ghi_chu || undefined,
  };
}
function nhuomToRow(n: GiaoNhuom) {
  return {
    id: n.id,
    giao_det_id: n.giaoDetId || null,
    xuong_id: n.xuongId || null,
    xuong_ten: n.xuongTen,
    mau: n.mau,
    cay: n.cay,
    kg_gui: n.kgGui,
    kg_tp: n.kgTp,
    gia: n.gia,
    kho: n.kho || "vai",
    dinh_muc_hao_hut: n.dinhMucHaoHut,
    hao_hut_thuc_te: n.haoHutThucTe,
    vuot_dinh_muc: n.vuotDinhMuc,
    tien_phat_hao_hut: n.tienPhatHaoHut,
    da_nhap_kho: n.daNhapKho,
    ma_vt_kho: n.maVtKho || null,
    chung_tu_url: n.chungTuUrl || null,
    nguoi_phu_trach: n.nguoiPhuTrach || null,
    ngay: n.ngay,
    ghi_chu: n.ghiChu || null,
  };
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ============ Context ============
type Ctx = {
  soi: NhapSoi[];
  det: GiaoDet[];
  nhuom: GiaoNhuom[];
  loading: boolean;
  themNhapSoi: (input: Omit<NhapSoi, "id" | "thanhTien">) => Promise<NhapSoi | null>;
  themGiaoDet: (input: Omit<GiaoDet, "id" | "haoHutThucTe" | "vuotDinhMuc" | "tienPhatHaoHut">) => Promise<GiaoDet | null>;
  themGiaoNhuom: (input: Omit<GiaoNhuom, "id" | "haoHutThucTe" | "vuotDinhMuc" | "tienPhatHaoHut" | "daNhapKho">) => Promise<GiaoNhuom | null>;
  xacNhanNhapKho: (giaoNhuomId: string) => Promise<boolean>;
};

const DetNhuomCtx = createContext<Ctx | null>(null);

async function congNo(nccId: string | undefined, deltaVND: number) {
  if (!nccId || !deltaVND || !isSupabaseEnabled || !supabase) return;
  try {
    const { data } = await supabase.from("nha_cung_cap").select("cong_no").eq("id", nccId).single();
    const current = Number(data?.cong_no) || 0;
    await supabase.from("nha_cung_cap").update({ cong_no: current + deltaVND }).eq("id", nccId);
  } catch (err) {
    console.error("[DetNhuomStore] update cong_no error:", err);
  }
}

export function DetNhuomProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [soi, setSoi] = useState<NhapSoi[]>([]);
  const [det, setDet] = useState<GiaoDet[]>([]);
  const [nhuom, setNhuom] = useState<GiaoNhuom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const [rSoi, rDet, rNhuom] = await Promise.all([
          supabase.from("det_nhuom_nhap_soi").select("*").order("created_at", { ascending: false }),
          supabase.from("det_nhuom_giao_det").select("*").order("created_at", { ascending: false }),
          supabase.from("det_nhuom_giao_nhuom").select("*").order("created_at", { ascending: false }),
        ]);
        if (!mounted) return;
        if (rSoi.error || rDet.error || rNhuom.error) {
          const err = rSoi.error || rDet.error || rNhuom.error;
          console.warn("[DetNhuomStore] Supabase fetch error (bảng có thể chưa tạo):", err?.message);
        } else {
          setSoi((rSoi.data || []).map(soiFromRow));
          setDet((rDet.data || []).map(detFromRow));
          setNhuom((rNhuom.data || []).map(nhuomFromRow));
        }
      } catch (err) {
        console.error("[DetNhuomStore] fetch exception:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const themNhapSoi = useCallback(
    async (input: Omit<NhapSoi, "id" | "thanhTien">) => {
      const row: NhapSoi = { ...input, id: genId("SOI"), thanhTien: Math.round(input.kg * input.gia) };
      setSoi((prev) => [row, ...prev]);
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.from("det_nhuom_nhap_soi").insert(soiToRow(row));
        if (error) {
          toast.error(`Chưa lưu được lô sợi lên máy chủ: ${error.message}`);
          console.error("[DetNhuomStore] insert soi error:", error);
          return null;
        }
        await congNo(row.nccId, row.thanhTien);
      }
      logAudit({
        user,
        action: "create",
        module: "kho-soi",
        description: `Nhập sợi ${row.loaiSoi} ${row.kg}kg từ ${row.nccTen}`,
        resourceId: row.id,
        resourceName: row.loaiSoi,
      });
      return row;
    },
    [user]
  );

  const themGiaoDet = useCallback(
    async (input: Omit<GiaoDet, "id" | "haoHutThucTe" | "vuotDinhMuc" | "tienPhatHaoHut">) => {
      const { haoHutThucTe, vuotDinhMuc } = calcHaoHut(input.kgVao, input.kgRa, input.dinhMucHaoHut);
      const phat = tienPhat(input.kgVao, haoHutThucTe, input.dinhMucHaoHut, input.giaDet);
      const row: GiaoDet = { ...input, id: genId("DET"), haoHutThucTe, vuotDinhMuc, tienPhatHaoHut: phat };
      setDet((prev) => [row, ...prev]);
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.from("det_nhuom_giao_det").insert(detToRow(row));
        if (error) {
          toast.error(`Chưa lưu được lô dệt lên máy chủ: ${error.message}`);
          console.error("[DetNhuomStore] insert det error:", error);
          return null;
        }
        const tienCong = Math.round(row.kgRa * row.giaDet) - phat;
        await congNo(row.xuongId, tienCong);
      }
      if (vuotDinhMuc) {
        toast.warning(`Hao hụt dệt ${haoHutThucTe}% vượt định mức ${input.dinhMucHaoHut}% - phạt ${phat.toLocaleString("vi-VN")}đ`);
      }
      logAudit({
        user,
        action: "create",
        module: "kho-soi",
        description: `Giao dệt ${row.kgVao}kg cho ${row.xuongTen}, thu về ${row.kgRa}kg (hao hụt ${haoHutThucTe}%)`,
        resourceId: row.id,
        resourceName: row.xuongTen,
      });
      return row;
    },
    [user]
  );

  const themGiaoNhuom = useCallback(
    async (input: Omit<GiaoNhuom, "id" | "haoHutThucTe" | "vuotDinhMuc" | "tienPhatHaoHut" | "daNhapKho">) => {
      const { haoHutThucTe, vuotDinhMuc } = calcHaoHut(input.kgGui, input.kgTp, input.dinhMucHaoHut);
      const phat = tienPhat(input.kgGui, haoHutThucTe, input.dinhMucHaoHut, input.gia);
      const row: GiaoNhuom = { ...input, id: genId("NHU"), haoHutThucTe, vuotDinhMuc, tienPhatHaoHut: phat, daNhapKho: false };
      setNhuom((prev) => [row, ...prev]);
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase.from("det_nhuom_giao_nhuom").insert(nhuomToRow(row));
        if (error) {
          toast.error(`Chưa lưu được lô nhuộm lên máy chủ: ${error.message}`);
          console.error("[DetNhuomStore] insert nhuom error:", error);
          return null;
        }
        const tienCong = Math.round(row.kgTp * row.gia) - phat;
        await congNo(row.xuongId, tienCong);
      }
      if (vuotDinhMuc) {
        toast.warning(`Hao hụt nhuộm ${haoHutThucTe}% vượt định mức ${input.dinhMucHaoHut}% - phạt ${phat.toLocaleString("vi-VN")}đ`);
      }
      logAudit({
        user,
        action: "create",
        module: "kho-soi",
        description: `Giao nhuộm màu ${row.mau} ${row.kgGui}kg cho ${row.xuongTen}, thu về ${row.kgTp}kg (hao hụt ${haoHutThucTe}%)`,
        resourceId: row.id,
        resourceName: row.mau,
      });
      return row;
    },
    [user]
  );

  const xacNhanNhapKho = useCallback(
    async (giaoNhuomId: string) => {
      const lo = nhuom.find((n) => n.id === giaoNhuomId);
      if (!lo) {
        toast.error("Không tìm thấy lô nhuộm");
        return false;
      }
      if (lo.daNhapKho) {
        toast.error("Lô này đã nhập kho rồi");
        return false;
      }
      if (!isSupabaseEnabled || !supabase) {
        toast.error("Chưa kết nối Supabase, không thể ghi nhận kho");
        return false;
      }
      const loDet = det.find((d) => d.id === lo.giaoDetId);
      const loSoi = soi.find((s) => s.id === loDet?.nhapSoiId);

      const tienNhuom = Math.round(lo.kgTp * lo.gia) - lo.tienPhatHaoHut;
      const tienDet = loDet ? Math.round(loDet.kgRa * loDet.giaDet) - loDet.tienPhatHaoHut : 0;
      // Phân bổ tiền sợi theo đúng tỷ lệ kg sợi đã dùng cho lô dệt này
      const tienSoi = loSoi && loSoi.kg > 0 && loDet ? Math.round((loDet.kgVao / loSoi.kg) * loSoi.thanhTien) : 0;

      const tongChiPhi = tienSoi + tienDet + tienNhuom;
      const giaVonMoiKg = lo.kgTp > 0 ? Math.round(tongChiPhi / lo.kgTp) : 0;
      const maVt = lo.maVtKho || `VAI-${lo.mau.toUpperCase().replace(/\s+/g, "").slice(0, 12)}`;

      const ghDichId = genId("GD");
      const { error: khoErr } = await supabase.from("giao_dich_kho").insert({
        id: ghDichId,
        ngay: lo.ngay,
        loai: "NHAP",
        loai_kho: "vai",
        ma_vt: maVt,
        ten_vt: `Vải ${lo.mau}`,
        so_luong: lo.kgTp,
        don_vi: "kg",
        don_gia: giaVonMoiKg,
        thanh_tien: lo.kgTp * giaVonMoiKg,
        nguoi_thuc_hien: user?.name || user?.email || "",
        ghi_chu: `Nhập kho từ dệt nhuộm - lô ${lo.id} (${lo.cay} cây)`,
      });
      if (khoErr) {
        toast.error(`Ghi nhập kho thất bại: ${khoErr.message}`);
        console.error("[DetNhuomStore] insert giao_dich_kho error:", khoErr);
        return false;
      }

      await supabase.from("det_nhuom_cost_ledger").insert({
        id: genId("CL"),
        giao_nhuom_id: lo.id,
        ma_phieu: ghDichId,
        tong_tien_soi: tienSoi,
        tong_tien_det: tienDet,
        tong_tien_nhuom: tienNhuom,
        tong_tien_phat_hao_hut: (loDet?.tienPhatHaoHut || 0) + lo.tienPhatHaoHut,
        gia_von_moi_kg: giaVonMoiKg,
        tong_thanh_toan: tongChiPhi,
        nguoi_tao: user?.name || user?.email || "",
      });

      const { error: updErr } = await supabase
        .from("det_nhuom_giao_nhuom")
        .update({ da_nhap_kho: true, ma_vt_kho: maVt })
        .eq("id", lo.id);
      if (updErr) console.error("[DetNhuomStore] update da_nhap_kho error:", updErr);

      setNhuom((prev) => prev.map((n) => (n.id === lo.id ? { ...n, daNhapKho: true, maVtKho: maVt } : n)));

      logAudit({
        user,
        action: "create",
        module: "kho-vai",
        description: `Xác nhận nhập kho vải ${lo.mau} ${lo.kgTp}kg, giá vốn ${giaVonMoiKg.toLocaleString("vi-VN")}đ/kg`,
        resourceId: ghDichId,
        resourceName: maVt,
      });
      toast.success(`Đã nhập kho ${lo.kgTp}kg vải ${lo.mau} - giá vốn ${giaVonMoiKg.toLocaleString("vi-VN")}đ/kg`);
      return true;
    },
    [nhuom, det, soi, user]
  );

  return (
    <DetNhuomCtx.Provider value={{ soi, det, nhuom, loading, themNhapSoi, themGiaoDet, themGiaoNhuom, xacNhanNhapKho }}>
      {children}
    </DetNhuomCtx.Provider>
  );
}

export function useDetNhuom() {
  const ctx = useContext(DetNhuomCtx);
  if (!ctx) throw new Error("useDetNhuom must be used within DetNhuomProvider");
  return ctx;
}
