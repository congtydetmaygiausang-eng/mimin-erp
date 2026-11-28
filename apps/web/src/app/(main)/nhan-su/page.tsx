"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { usePermission } from "@/components/PermissionGuard";
import { type ViewMode } from "@/components/DataViewToggle";
import type { NhanSuExt } from "./data";
import { HeaderBanner } from "./components/Header";
import { Filters } from "./components/Filters";
import { TableView } from "./components/TableView";
import { CardView, ListView } from "./components/CardView";
import { NVFormModal } from "./components/NVFormModal";
import { ChiTietNhanSuModal } from "./components/DetailModal";
import { BangLuongNV } from "./components/LuongModal";
import { ImagePreviewModal } from "./components/ImagePreviewModal";
import { NhanSuTabs } from "@/components/nhan-su-tabs";
import { useNhanSu } from "@/lib/data/nhan-su-store";

export default function NhanSuPage() {
  const { list, xoaNhanSu, themNhanSu, suaNhanSu } = useNhanSu();
  const [search, setSearch] = useState("");
  const [filterBP, setFilterBP] = useState<string>("all");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | "dang_lam" | "nghi_viec">("all");
  const [filterLuong, setFilterLuong] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("stt");

  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; nv?: NhanSuExt } | null>(null);
  const [showLuong, setShowLuong] = useState<NhanSuExt | null>(null);
  const [showDetail, setShowDetail] = useState<NhanSuExt | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { phanCong } = usePhanCong();

  // Deduplicate on the fly
  const dedupedList = useMemo(() => {
    const map = new Map<string, NhanSuExt>();
    list.forEach((nv) => {
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
    let dsSanXuat = 0;
    let dsKho = 0;
    let dsQC = 0;
    let dangLamCount = 0;
    let nghiViecCount = 0;

    for (const n of dedupedList) {
      if (n.boPhan) bp.add(n.boPhan);
      if (n.trangThai === "nghi_viec") {
        nghiViecCount++;
      } else {
        dangLamCount++;
        tongLuongCung += n.luongCung || n.luongCB || 0;
      }
      if (n.boPhan === "Sản xuất") dsSanXuat++;
      if (n.boPhan === "Kho vận") dsKho++;
      if (n.boPhan === "QC") dsQC++;
    }

    return {
      tongNV: dedupedList.length,
      dangLamCount,
      nghiViecCount,
      dsBP: Array.from(bp),
      tongLuongCung,
      dsSanXuat,
      dsKho,
      dsQC,
    };
  }, [dedupedList]);

  // Lương sản phẩm từ PHAN_CONG (memoize)
  const luongSPTheoNV = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pc of phanCong) {
      const maNV = typeof pc.nguoiPhuTrach === "object" ? pc.nguoiPhuTrach?.ma : pc.nguoiPhuTrach;
      if (maNV) {
        if (!map[maNV]) map[maNV] = 0;
        map[maNV] += (pc.donGiaGiao || 0) * (pc.soLuongGiao || 0);
      }
    }
    return map;
  }, [phanCong]);

  // Filter & Sort (memoize)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const result = dedupedList.filter((n) => {
      // 1. Tìm kiếm đa trường
      const matchSearch =
        !q ||
        [n.hoTen, n.maNV, n.sdt, n.email, n.chucVu, n.boPhan].some((y) =>
          (y || "").toLowerCase().includes(q)
        );

      // 2. Lọc theo Bộ phận
      const matchBP = filterBP === "all" || n.boPhan === filterBP;

      // 3. Lọc theo Trạng thái
      const status = n.trangThai === "nghi_viec" ? "nghi_viec" : "dang_lam";
      const matchTrangThai = filterTrangThai === "all" || status === filterTrangThai;

      // 4. Lọc theo Mức lương
      const luongCB = n.luongCB || n.luongCung || 0;
      let matchLuong = true;
      if (filterLuong === "duoi_8tr") {
        matchLuong = luongCB < 8000000;
      } else if (filterLuong === "8_12tr") {
        matchLuong = luongCB >= 8000000 && luongCB <= 12000000;
      } else if (filterLuong === "tren_12tr") {
        matchLuong = luongCB > 12000000;
      } else if (filterLuong === "luong_sp") {
        matchLuong = (luongSPTheoNV[n.maNV] || 0) > 0 || Boolean(n.donGiaSP);
      }

      return matchSearch && matchBP && matchTrangThai && matchLuong;
    });

    // 5. Sắp xếp đa chiều
    return result.sort((a, b) => {
      if (sortBy === "ten_asc") {
        return a.hoTen.localeCompare(b.hoTen, "vi");
      }
      if (sortBy === "ten_desc") {
        return b.hoTen.localeCompare(a.hoTen, "vi");
      }
      if (sortBy === "luong_desc") {
        const luongA = a.luongCB || a.luongCung || 0;
        const luongB = b.luongCB || b.luongCung || 0;
        return luongB - luongA;
      }
      if (sortBy === "ngay_desc") {
        return (b.ngayVao || b.ngayVaoLam || "").localeCompare(a.ngayVao || a.ngayVaoLam || "");
      }
      if (sortBy === "rating_desc") {
        return (b.rating || 0) - (a.rating || 0);
      }
      // Mặc định: theo STT hoặc mã NV
      return (a.stt || 0) - (b.stt || 0) || (a.maNV || "").localeCompare(b.maNV || "");
    });
  }, [dedupedList, search, filterBP, filterTrangThai, filterLuong, sortBy, luongSPTheoNV]);

  // Reset toàn bộ bộ lọc
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setFilterBP("all");
    setFilterTrangThai("all");
    setFilterLuong("all");
    setSortBy("stt");
  }, []);

  // Xuất file CSV danh sách nhân sự chuẩn UTF-8
  const handleExportCSV = useCallback(() => {
    try {
      const headers = [
        "STT",
        "Mã NV",
        "Họ và Tên",
        "Bộ Phận",
        "Chức Vụ",
        "Số Điện Thoại",
        "Email",
        "Ngày Vào Làm",
        "Lương Cơ Bản (VNĐ)",
        "Đánh Giá",
        "Trạng Thái",
      ];

      const rows = filtered.map((n, i) => [
        i + 1,
        `"${n.maNV || ""}"`,
        `"${n.hoTen || ""}"`,
        `"${n.boPhan || ""}"`,
        `"${n.chucVu || ""}"`,
        `"${n.sdt || ""}"`,
        `"${n.email || ""}"`,
        `"${n.ngayVao || n.ngayVaoLam || ""}"`,
        n.luongCB || n.luongCung || 0,
        n.rating || 4,
        n.trangThai === "nghi_viec" ? "Đã nghỉ việc" : "Đang làm việc",
      ]);

      const csvContent =
        "\uFEFF" +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.setAttribute("download", `Danh_sach_nhan_su_MIMIN_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Đã xuất file CSV cho ${filtered.length} nhân sự`);
    } catch (err) {
      console.error(err);
      toast.error("Không thể xuất file CSV");
    }
  }, [filtered]);

  const handleSave = useCallback(
    async (nv: NhanSuExt) => {
      if (showForm?.mode === "add") {
        await themNhanSu(nv);
      } else {
        await suaNhanSu(nv);
      }
    },
    [themNhanSu, suaNhanSu, showForm?.mode]
  );

  const handleToggleTrangThai = useCallback(
    async (nv: NhanSuExt) => {
      const isNghi = nv.trangThai === "nghi_viec";
      const nextStatus = isNghi ? "dang_lam" : "nghi_viec";
      const confirmMsg = isNghi
        ? `Kích hoạt cho nhân viên "${nv.hoTen}" (${nv.maNV}) đi làm lại?`
        : `Đánh dấu nhân viên "${nv.hoTen}" (${nv.maNV}) đã nghỉ việc?`;

      if (!confirm(confirmMsg)) return;

      const updated = { ...nv, trangThai: nextStatus };
      const ok = await suaNhanSu(updated);
      if (ok) {
        toast.success(
          isNghi ? `Đã kích hoạt lại: ${nv.hoTen}` : `Đã chuyển sang đã nghỉ việc: ${nv.hoTen}`
        );
      } else {
        toast.error("Không thể cập nhật trạng thái nhân viên");
      }
    },
    [suaNhanSu]
  );

  const handleDelete = useCallback(
    async (nv: NhanSuExt) => {
      if (!confirm(`Xoá NV "${nv.hoTen}"?`)) return;

      const ok = await xoaNhanSu(nv.maNV || "");
      if (ok) {
        toast.success(`Đã xoá: ${nv.hoTen}`);
      } else {
        toast.error("Không thể xoá nhân sự khỏi hệ thống");
      }
    },
    [xoaNhanSu]
  );

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full overflow-x-hidden pb-10">
      {/* 1. Tabs chuyển đổi Hồ sơ nhân sự / Chấm công */}
      <NhanSuTabs />

      {/* 2. Header Banner & 4 thẻ KPI Glassmorphism chuẩn Kho Thành Phẩm */}
      <HeaderBanner
        tongNV={kpis.tongNV}
        tongLuongCung={kpis.tongLuongCung}
        kpis={kpis}
        onAdd={() => setShowForm({ mode: "add" })}
        onExportCSV={handleExportCSV}
      />

      {/* 3. Thanh tìm kiếm và bộ lọc đa chiều chuẩn ERP */}
      <Filters
        list={dedupedList}
        dsBP={kpis.dsBP}
        filterBP={filterBP}
        setFilterBP={setFilterBP}
        filterTrangThai={filterTrangThai}
        setFilterTrangThai={setFilterTrangThai}
        filterLuong={filterLuong}
        setFilterLuong={setFilterLuong}
        sortBy={sortBy}
        setSortBy={setSortBy}
        search={search}
        setSearch={setSearch}
        viewMode={viewMode}
        setViewMode={setViewMode}
        filteredCount={filtered.length}
        onReset={handleResetFilters}
      />

      {/* 4. Danh sách nhân sự theo View Mode được chọn */}
      {viewMode === "table" && (
        <TableView
          filtered={filtered}
          luongSPTheoNV={luongSPTheoNV}
          onShowDetail={setShowDetail}
          onShowLuong={setShowLuong}
          onEdit={(n) => setShowForm({ mode: "edit", nv: n })}
          onDelete={handleDelete}
          onToggleTrangThai={handleToggleTrangThai}
        />
      )}

      {viewMode === "card" && (
        <CardView
          filtered={filtered}
          luongSPTheoNV={luongSPTheoNV}
          onShowDetail={setShowDetail}
          onShowLuong={setShowLuong}
          onEdit={(n) => setShowForm({ mode: "edit", nv: n })}
          onDelete={handleDelete}
          onToggleTrangThai={handleToggleTrangThai}
        />
      )}

      {viewMode === "list" && (
        <ListView
          filtered={filtered}
          luongSPTheoNV={luongSPTheoNV}
          onShowDetail={setShowDetail}
          onShowLuong={setShowLuong}
          onEdit={(n) => setShowForm({ mode: "edit", nv: n })}
          onDelete={handleDelete}
          onToggleTrangThai={handleToggleTrangThai}
        />
      )}

      {/* Các Modals nghiệp vụ */}
      {showForm && (
        <NVFormModal
          mode={showForm.mode}
          nv={showForm.nv}
          existingCount={list.length}
          existingCodes={list.map((nv) => nv.maNV)}
          onClose={() => setShowForm(null)}
          onSave={handleSave}
        />
      )}

      {showDetail && (
        <ChiTietNhanSuModal
          nv={showDetail}
          luongSP={luongSPTheoNV[showDetail.maNV] || 0}
          onClose={() => setShowDetail(null)}
          onEdit={() => {
            const target = showDetail;
            setShowDetail(null);
            setShowForm({ mode: "edit", nv: target });
          }}
          onLuong={() => {
            const target = showDetail;
            setShowDetail(null);
            setShowLuong(target);
          }}
        />
      )}

      {showLuong && (
        <BangLuongNV
          nv={showLuong}
          luongSP={luongSPTheoNV[showLuong.maNV] || 0}
          onClose={() => setShowLuong(null)}
        />
      )}

      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
