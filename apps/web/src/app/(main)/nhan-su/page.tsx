"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Users, X } from "lucide-react";
import { toast } from "sonner";
import { normalizeEmployeeRecord } from "@/lib/employee-records";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { usePermission } from "@/components/PermissionGuard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { NHAN_SU_KHOI_DAU, type NhanSuExt } from "./data";
import { HeaderBanner, KpiCards } from "./components/Header";
import { Filters } from "./components/Filters";
import { TableView } from "./components/TableView";
import { CardView, ListView } from "./components/CardView";
import { NVFormModal } from "./components/NVFormModal";
import { ChiTietNhanSuModal } from "./components/DetailModal";
import { BangLuongNV } from "./components/LuongModal";
import { ImagePreviewModal } from "./components/ImagePreviewModal";

import { useNhanSu } from "@/lib/data/nhan-su-store";

export default function NhanSuPage() {
  const { list, themNhanSu, suaNhanSu, xoaNhanSu, loading } = useNhanSu();
  const [search, setSearch] = useState("");
  const [filterBP, setFilterBP] = useState<string>("all");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; nv?: NhanSuExt } | null>(null);
  const [showLuong, setShowLuong] = useState<NhanSuExt | null>(null);
  const [showDetail, setShowDetail] = useState<NhanSuExt | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const perm = usePermission();

  const { phanCong } = usePhanCong();

  // Deduplicate on the fly
  const dedupedList = useMemo(() => {
    const map = new Map<string, NhanSuExt>();
    list.forEach(nv => {
      const key = nv.maNV ? nv.maNV.toLowerCase().trim() : nv.hoTen.toLowerCase().trim();
      if (!map.has(key)) {
        map.set(key, nv);
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.stt || 0) - (b.stt || 0));
  }, [list]);

  // KPIs (memoize)
  const kpis = useMemo(() => {
    const bp = new Set<string>();
    let tongLuongCung = 0;
    let dsSanXuat = 0, dsKho = 0, dsQC = 0;
    for (const n of dedupedList) {
      bp.add(n.boPhan);
      tongLuongCung += n.luongCung || 0;
      if (n.boPhan === "Sản xuất") dsSanXuat++;
      if (n.boPhan === "Kho vận") dsKho++;
      if (n.boPhan === "QC") dsQC++;
    }
    return { tongNV: dedupedList.length, dsBP: Array.from(bp), tongLuongCung, dsSanXuat, dsKho, dsQC };
  }, [dedupedList]);

  // Lương sản phẩm từ PHAN_CONG (memoize)
  const luongSPTheoNV = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pc of phanCong) {
      const maNV = pc.nguoiPhuTrach.ma;
      if (!map[maNV]) map[maNV] = 0;
      map[maNV] += pc.donGiaGiao * pc.soLuongGiao;
    }
    return map;
  }, [phanCong]);

  // Filter (memoize)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return dedupedList.filter((n) => {
      const matchSearch = !q || [n.hoTen, n.maNV, n.sdt, n.email, n.chucVu, n.boPhan].some(
        (y) => (y || "").toLowerCase().includes(q)
      );
      const matchBP = filterBP === "all" || n.boPhan === filterBP;
      return matchSearch && matchBP;
    });
  }, [dedupedList, search, filterBP]);

  const handleSave = useCallback(async (nv: NhanSuExt) => {
    if (showForm?.mode === "add") {
      const ok = await themNhanSu(nv);
      if (ok) toast.success(`Đã thêm NV: ${nv.hoTen}`);
      else toast.error("Có lỗi khi thêm nhân sự vào Supabase");
    } else {
      const ok = await suaNhanSu(nv);
      if (ok) toast.success(`Đã cập nhật: ${nv.hoTen}`);
      else toast.error("Có lỗi khi cập nhật nhân sự trên Supabase");
    }
    setShowForm(null);
  }, [showForm, themNhanSu, suaNhanSu]);

  const handleDelete = useCallback(async (nv: NhanSuExt) => {
    if (!confirm(`Xoá NV "${nv.hoTen}"?`)) return;

    const ok = await xoaNhanSu(nv.maNV || "");
    if (ok) {
      toast.success(`Đã xoá: ${nv.hoTen}`);
    } else {
      toast.error("Không thể xoá nhân sự khỏi Supabase");
    }
  }, [xoaNhanSu]);

  return (
    <div className="space-y-5 animate-fade-in">
      <HeaderBanner tongNV={kpis.tongNV} tongLuongCung={kpis.tongLuongCung} onAdd={() => setShowForm({ mode: "add" })} />
      <KpiCards kpis={kpis} />
      <Filters list={list} dsBP={kpis.dsBP} filterBP={filterBP} setFilterBP={setFilterBP} search={search} setSearch={setSearch} viewMode={viewMode} setViewMode={setViewMode} />

      {viewMode === "table" && <TableView filtered={filtered} luongSPTheoNV={luongSPTheoNV} onShowDetail={setShowDetail} onShowLuong={setShowLuong} onEdit={(n) => setShowForm({ mode: "edit", nv: n })} onDelete={handleDelete} />}
      {viewMode === "card" && <CardView filtered={filtered} luongSPTheoNV={luongSPTheoNV} onShowDetail={setShowDetail} onShowLuong={setShowLuong} onEdit={(n) => setShowForm({ mode: "edit", nv: n })} onDelete={handleDelete} />}
      {viewMode === "list" && <ListView filtered={filtered} luongSPTheoNV={luongSPTheoNV} onShowDetail={setShowDetail} onShowLuong={setShowLuong} onEdit={(n) => setShowForm({ mode: "edit", nv: n })} onDelete={handleDelete} />}

      {showForm && <NVFormModal mode={showForm.mode} nv={showForm.nv} existingCount={list.length} onClose={() => setShowForm(null)} onSave={handleSave} />}
      {showDetail && <ChiTietNhanSuModal nv={showDetail} luongSP={luongSPTheoNV[showDetail.maNV] || 0} onClose={() => setShowDetail(null)} onEdit={() => { const target = showDetail; setShowDetail(null); setShowForm({ mode: "edit", nv: target }); }} onLuong={() => { const target = showDetail; setShowDetail(null); setShowLuong(target); }} />}
      {showLuong && <BangLuongNV nv={showLuong} luongSP={luongSPTheoNV[showLuong.maNV] || 0} onClose={() => setShowLuong(null)} />}
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
