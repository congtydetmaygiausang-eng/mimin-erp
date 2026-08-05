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

async function loadEmployeesFromSupabase() {
  const response = await fetch("/api/employee-records", { method: "GET" });
  if (!response.ok) {
    throw new Error("Không thể tải danh sách nhân sự từ Supabase");
  }
  const data = await response.json();
  return (data.records || []).map((record: any) => normalizeEmployeeRecord(record) as NhanSuExt);
}

export default function NhanSuPage() {
  const [list, setList] = useState<NhanSuExt[]>(NHAN_SU_KHOI_DAU);
  const [search, setSearch] = useState("");
  const [filterBP, setFilterBP] = useState<string>("all");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; nv?: NhanSuExt } | null>(null);
  const [showLuong, setShowLuong] = useState<NhanSuExt | null>(null);
  const [showDetail, setShowDetail] = useState<NhanSuExt | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const perm = usePermission();

  const { phanCong } = usePhanCong();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const fromSupabase = await loadEmployeesFromSupabase();
        if (!mounted) return;
        if (fromSupabase.length > 0) {
          setList(fromSupabase);
          toast.success(`Đã tải ${fromSupabase.length} nhân viên từ Supabase`);
        }
      } catch (error) {
        console.error("load employees failed", error);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // KPIs (memoize)
  const kpis = useMemo(() => {
    const bp = new Set<string>();
    let tongLuongCung = 0;
    let dsSanXuat = 0, dsKho = 0, dsQC = 0;
    for (const n of list) {
      bp.add(n.boPhan);
      tongLuongCung += n.luongCung || 0;
      if (n.boPhan === "Sản xuất") dsSanXuat++;
      if (n.boPhan === "Kho vận") dsKho++;
      if (n.boPhan === "QC") dsQC++;
    }
    return { tongNV: list.length, dsBP: Array.from(bp), tongLuongCung, dsSanXuat, dsKho, dsQC };
  }, [list]);

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
    return list.filter((n) => {
      const matchSearch = !q || [n.hoTen, n.maNV, n.sdt, n.email, n.chucVu, n.boPhan].some(
        (y) => (y || "").toLowerCase().includes(q)
      );
      const matchBP = filterBP === "all" || n.boPhan === filterBP;
      return matchSearch && matchBP;
    });
  }, [list, search, filterBP]);

  const handleSave = useCallback((nv: NhanSuExt) => {
    setList((prev) => {
      if (showForm?.mode === "add") {
        toast.success(`Đã thêm NV: ${nv.hoTen}`);
        return [...prev, nv];
      } else {
        toast.success(`Đã cập nhật: ${nv.hoTen}`);
        return prev.map((x) => (x.maNV === nv.maNV ? nv : x));
      }
    });
    setShowForm(null);
  }, [showForm]);

  const handleDelete = useCallback(async (nv: NhanSuExt) => {
    if (!confirm(`Xoá NV "${nv.hoTen}"?`)) return;

    try {
      const response = await fetch(`/api/employee-records?maNV=${encodeURIComponent(nv.maNV || "")}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      setList((prev) => prev.filter((x) => x.maNV !== nv.maNV));
      toast.success(`Đã xoá: ${nv.hoTen}`);
    } catch (error) {
      console.error("delete employee failed", error);
      toast.error(error instanceof Error ? error.message : "Không thể xoá nhân sự khỏi Supabase");
    }
  }, []);

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
