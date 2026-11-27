"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { LenhCatModal } from "@/components/LenhCatModal";
import { useLenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { useSession } from "@/components/session-provider";
import { EmptyState, LenhCatTableView } from "@/components/ui";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { PremiumHeader } from "./components/Header";
import { FilterBar, MauSection } from "./components/FilterBar";
import { LenhCatCard } from "./components/LCard";
import { MauCDModal, MauCPModal } from "./components/MauModals";
import { useNhanSu, resolveTenNhanSu } from "@/lib/data/nhan-su-store";

const DEFAULT_GIA_CONG = [
  { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
  { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 }
];

export default function LenhCatPage() {
  const router = useRouter();
  // suaLenhCat + user được dùng ở onSaveTyLe/onSaveGiaCong bên dưới nhưng trước
  // đây không hề được lấy ra -> lưu tỷ lệ size hoặc giao việc là lỗi "suaLenhCat
  // is not defined" ngay tại chỗ.
  const { dsLenhCat, xoaLenhCat, suaLenhCat, capNhatTrangThai, reset, themMauCongDoan, themMauChiPhi, dsMauCongDoan, dsMauChiPhi, xoaMauCongDoan, xoaMauChiPhi, loading } = useLenhCat();
  const { user } = useSession();
  const { list: dsNhanSu } = useNhanSu();

  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [customCostName, setCustomCostName] = useState("");
  const [newMauCD, setNewMauCD] = useState<{ id: string; ten: string; giaCong: any[] }>({ id: "", ten: "", giaCong: DEFAULT_GIA_CONG });
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftData, setDraftData] = useState<any>(null);
  const [filterTrangThai, setFilterTrangThai] = useState<"ALL" | TrangThaiLenhCat>("ALL");
  // Mặc định luôn là Dạng Danh Sách theo yêu cầu của anh Cường
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [expandedMauCD, setExpandedMauCD] = useState<string | null>(null);
  const [expandedMauCP, setExpandedMauCP] = useState<string | null>(null);
  const [showDanhSachMau, setShowDanhSachMau] = useState(false);

  // Bộ lọc tìm kiếm & phân loại chuẩn ERP cho Lệnh Cắt
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoaiSP, setSelectedLoaiSP] = useState("ALL");
  const [selectedGiaCong, setSelectedGiaCong] = useState("ALL");
  const [sortBy, setSortBy] = useState<"id_desc" | "id_asc" | "deadline_asc" | "deadline_desc" | "sl_desc" | "sl_asc">("id_desc");

  useEffect(() => {
    const editIdToOpen = localStorage.getItem("mimin_edit_lenh_cat_id");
    if (editIdToOpen) {
      localStorage.removeItem("mimin_edit_lenh_cat_id");
      setEditId(editIdToOpen);
      setShowModal(true);
      return;
    }
    if (localStorage.getItem("mimin_open_lenh_cat") === "1") {
      localStorage.removeItem("mimin_open_lenh_cat");
      
      const draftStr = localStorage.getItem("mimin_draft_lenh_cat");
      if (draftStr) {
        try {
          setDraftData(JSON.parse(draftStr));
        } catch (e) {
          console.error("Lỗi parse draft data:", e);
        }
        localStorage.removeItem("mimin_draft_lenh_cat");
      }
      
      setEditId(null);
      setShowModal(true);
    }
  }, []);

  // KPIs
  const stats = {
    tongLC: dsLenhCat.length,
    nhap: dsLenhCat.filter((l) => l.trangThai === "Nhap").length,
    daTao: dsLenhCat.filter((l) => l.trangThai === "DaTao").length,
    dangCat: dsLenhCat.filter((l) => l.trangThai === "DangCat").length,
    hoanThanh: dsLenhCat.filter((l) => l.trangThai === "HoanThanh").length,
    chuyenTiep: dsLenhCat.filter((l) => l.trangThai === "ChuyenTiep").length,
    tongSL: dsLenhCat.reduce((s, l) => s + l.tongSL, 0),
    tongGiaVon: dsLenhCat.reduce((s, l) => s + ((l.bangCOGS as any)?.tongGiaVon ?? (l.bangCOGS as any)?.giaVonBinhQuan ?? 0) * l.tongSL, 0),
    giaVonTBSP: (() => {
      const valid = dsLenhCat.filter((l) => l.tongSL > 0 && l.bangCOGS);
      if (valid.length === 0) return 0;
      return valid.reduce((s, l) => s + l.tongSL * ((l.bangCOGS as any)?.giaVon1SP ?? (l.bangCOGS as any)?.giaVonBinhQuan ?? 0), 0) /
        valid.reduce((s, l) => s + l.tongSL, 0);
    })(),
  };

  const filterCounts: Record<string, number> = {
    Nhap: stats.nhap, DaTao: stats.daTao, DangCat: stats.dangCat,
    HoanThanh: stats.hoanThanh, ChuyenTiep: stats.chuyenTiep,
  };

  // Thu thập danh sách Loại SP
  const danhSachLoaiSP = useMemo(() => {
    const set = new Set<string>();
    dsLenhCat.forEach(lc => { if (lc.loaiSP) set.add(lc.loaiSP); });
    return Array.from(set);
  }, [dsLenhCat]);

  // Thu thập danh sách Người phụ trách / Gia công
  const danhSachGiaCong = useMemo(() => {
    const set = new Set<string>();
    dsLenhCat.forEach(lc => {
      const ptSX = (lc as any).phuTrachSX?.trim();
      if (ptSX) set.add(resolveTenNhanSu(ptSX, dsNhanSu));
      const ptCat = (lc as any).phuTrachCat?.trim();
      if (ptCat) set.add(resolveTenNhanSu(ptCat, dsNhanSu));
      (lc.phanCong || []).forEach((pc: any) => {
        if (pc?.nguoiTen && pc.nguoiTen.trim()) {
          set.add(resolveTenNhanSu(pc.nguoiTen.trim(), dsNhanSu));
        }
      });
    });
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b, "vi"));
  }, [dsLenhCat, dsNhanSu]);

  const filteredLC = useMemo(() => {
    let result = dsLenhCat.filter((l) => {
      // 1. Filter Trạng thái
      if (filterTrangThai !== "ALL" && l.trangThai !== filterTrangThai) return false;

      // 2. Filter Từ khóa (Mã LC, Mã SP, Tên SP, Tên gia công, Tên màu)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchId = (l.id || "").toLowerCase().includes(q);
        const matchMaSP = (l.maSP || "").toLowerCase().includes(q);
        const matchTenSP = (l.tenSP || "").toLowerCase().includes(q);
        const ptSX = (l as any).phuTrachSX || "";
        const ptCat = (l as any).phuTrachCat || "";
        const resolvedSX = resolveTenNhanSu(ptSX, dsNhanSu);
        const resolvedCat = resolveTenNhanSu(ptCat, dsNhanSu);
        const pcStr = (
          (l.phanCong || []).map((p: any) => `${p?.nguoiTen || ""} ${resolveTenNhanSu(p?.nguoiTen, dsNhanSu)}`).join(" ") +
          ` ${ptSX} ${resolvedSX} ${ptCat} ${resolvedCat}`
        ).toLowerCase();
        const matchGiaCong = pcStr.includes(q);
        const matchMau = (l.dsMau || []).some(m => (m.ten || "").toLowerCase().includes(q) || (m.maSKU || "").toLowerCase().includes(q));
        if (!matchId && !matchMaSP && !matchTenSP && !matchGiaCong && !matchMau) return false;
      }

      // 3. Filter Loại SP
      if (selectedLoaiSP !== "ALL" && l.loaiSP !== selectedLoaiSP) return false;

      // 4. Filter Người phụ trách
      if (selectedGiaCong !== "ALL") {
        const ptSX = ((l as any).phuTrachSX || "").trim();
        const ptCat = ((l as any).phuTrachCat || "").trim();
        const resolvedSX = resolveTenNhanSu(ptSX, dsNhanSu);
        const resolvedCat = resolveTenNhanSu(ptCat, dsNhanSu);
        const pcNames = (l.phanCong || []).map((p: any) => (p?.nguoiTen || "").trim());
        const resolvedPCNames = pcNames.map((n: string) => resolveTenNhanSu(n, dsNhanSu));

        const candidates = [ptSX, ptCat, resolvedSX, resolvedCat, ...pcNames, ...resolvedPCNames].filter(Boolean);
        const match = candidates.some(c => c === selectedGiaCong || c.toLowerCase() === selectedGiaCong.toLowerCase());
        if (!match) return false;
      }

      return true;
    });

    // 5. Sắp xếp
    result = [...result].sort((a, b) => {
      if (sortBy === "id_desc") return b.id.localeCompare(a.id, undefined, { numeric: true });
      if (sortBy === "id_asc") return a.id.localeCompare(b.id, undefined, { numeric: true });
      if (sortBy === "deadline_asc") {
        const timeA = a.hanHoanThanh ? new Date(a.hanHoanThanh).getTime() : Infinity;
        const timeB = b.hanHoanThanh ? new Date(b.hanHoanThanh).getTime() : Infinity;
        return timeA - timeB;
      }
      if (sortBy === "deadline_desc") {
        const timeA = a.hanHoanThanh ? new Date(a.hanHoanThanh).getTime() : 0;
        const timeB = b.hanHoanThanh ? new Date(b.hanHoanThanh).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "sl_desc") return (b.tongSL || 0) - (a.tongSL || 0);
      if (sortBy === "sl_asc") return (a.tongSL || 0) - (b.tongSL || 0);
      return 0;
    });

    return result;
  }, [dsLenhCat, filterTrangThai, searchTerm, selectedLoaiSP, selectedGiaCong, sortBy]);

  const hasActiveFilters = searchTerm !== "" || selectedLoaiSP !== "ALL" || selectedGiaCong !== "ALL" || sortBy !== "id_desc";

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedLoaiSP("ALL");
    setSelectedGiaCong("ALL");
    setSortBy("id_desc");
  };

  // Handlers
  const handleEdit = (lc: (typeof dsLenhCat)[number]) => {
    if (lc.trangThai === "ChuyenTiep") {
      router.push(`/lenh-cat/${lc.id}`);
      return;
    }
    setDraftData(null);
    setEditId(lc.id);
    setShowModal(true);
  };
  // Tạm dùng lại LenhCatModal: wizard /lenh-cat/tao-moi chưa chạy được
  // (thiếu framer-motion + @/components/ui/button), đã chuyển vào _tao-moi.
  const handleCreate = () => { setEditId(null); setShowModal(true); };
  const handleDelete = (id: string) => {
    if (confirm(`Xoá ${id}? Hành động này không thể hoàn tác.`)) {
      xoaLenhCat(id, user!);
      toast.success(`Đã xoá ${id}`);
    }
  };
  const handleReset = () => {
    if (confirm("Reset toàn bộ lệnh cắt về mặc định?")) { reset(); toast.success("Đã reset"); }
  };
  const handleCreateCD = () => {
    setNewMauCD({ id: "cd_" + Date.now(), ten: "", giaCong: DEFAULT_GIA_CONG.map(c => ({ ...c })) });
    setShowTaoMauCD(true);
  };
  const handleCreateCP = () => {
    setNewMauCP({ id: "cp_" + Date.now(), ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });
    setShowTaoMauCP(true);
  };

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full overflow-x-hidden">
      <PremiumHeader stats={stats} onReset={handleReset} onCreate={handleCreate} />

      <FilterBar
        filterTrangThai={filterTrangThai}
        setFilterTrangThai={setFilterTrangThai}
        totalCount={stats.tongLC}
        counts={filterCounts}
        onCreateCD={handleCreateCD}
        onCreateCP={handleCreateCP}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedLoaiSP={selectedLoaiSP}
        setSelectedLoaiSP={setSelectedLoaiSP}
        danhSachLoaiSP={danhSachLoaiSP}
        selectedGiaCong={selectedGiaCong}
        setSelectedGiaCong={setSelectedGiaCong}
        danhSachGiaCong={danhSachGiaCong}
        sortBy={sortBy}
        setSortBy={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
      />

      <MauSection
        dsMauCongDoan={dsMauCongDoan}
        dsMauChiPhi={dsMauChiPhi}
        showDanhSachMau={showDanhSachMau}
        setShowDanhSachMau={setShowDanhSachMau}
        expandedMauCD={expandedMauCD}
        setExpandedMauCD={setExpandedMauCD}
        expandedMauCP={expandedMauCP}
        setExpandedMauCP={setExpandedMauCP}
        onEditCD={(m) => { setNewMauCD(m); setShowTaoMauCD(true); }}
        onEditCP={(m) => { setNewMauCP(m); setShowTaoMauCP(true); }}
        onDeleteCD={(id) => { xoaMauCongDoan(id); toast.success("Đã xoá mẫu"); }}
        onDeleteCP={(id) => { xoaMauChiPhi(id); toast.success("Đã xoá bảng giá"); }}
      />

      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-xs font-bold text-slate-500">
          Hiển thị: <b className="text-teal-700">{filteredLC.length}</b> / {stats.tongLC} lệnh cắt
        </span>
        <DataViewToggle value={viewMode} onChange={setViewMode} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mb-4"></div>
          <div className="text-slate-500 font-medium">Đang đồng bộ dữ liệu từ Supabase...</div>
        </div>
      ) : filteredLC.length === 0 ? (
        <EmptyState
          icon={<Scissors className="w-7 h-7 text-violet-500 opacity-60" />}
          title="Chưa có lệnh cắt nào"
          description="Bấm 'Tạo lệnh cắt' để bắt đầu"
        />
      ) : viewMode === "card" ? (
        <div className="flex flex-col gap-3">
          {filteredLC.map((lc) => (
            <LenhCatCard
              key={lc.id}
              lc={lc}
              onEdit={() => handleEdit(lc)}
              onDelete={() => handleDelete(lc.id)}
              onChangeStatus={async (tt) => {
                await capNhatTrangThai(lc.id, tt, user);
                if (tt === "DangCat") {
                  // Đổi trạng thái ở đây KHÔNG trừ kho - kho vải/phụ liệu chỉ bị trừ
                  // khi tổ cắt bấm "Nhận việc" ở trang Cắt (to-cat-work). Toast trước
                  // đây báo "đã tự động xuất kho" ngay tại nút này là SAI (đã bị gỡ
                  // khỏi capNhatTrangThai từ trước để tránh trừ kho 2 lần).
                  toast.success(`✂️ ${lc.id} đã chuyển sang Đang Cắt`, {
                    description: "Kho vải/phụ liệu chưa bị trừ ở bước này - sẽ trừ khi tổ cắt bấm \"Nhận việc\" ở trang Cắt.",
                    duration: 6000,
                  });
                }
              }}
              onSaveTyLe={(mauIdx, newTyLe, _tongDuCat, fixedPhanCong) => {
                const newDsMau = [...(lc.dsMau || [])];
                if (newDsMau[mauIdx]) {
                  newDsMau[mauIdx] = { ...newDsMau[mauIdx], tyLeSizeChiTiet: { ...newDsMau[mauIdx].tyLeSizeChiTiet, ...newTyLe } };

                  // ===== ĐồNG BỘ phanBoSize với data Cắt thực tế =====
                  // Khi lưu tỷ lệ size, cập nhật luôn phanBoSize của màu này
                  // = data khâu Cắt. Đây là nguồn fallback tin cậy sau F5.
                  const catKeySync = Object.keys(newTyLe).find(k =>
                    k.toLowerCase().includes("cat") ||
                    (fixedPhanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt") ||
                    (lc.phanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt")
                  );
                  if (catKeySync && newTyLe[catKeySync]) {
                    newDsMau[mauIdx].phanBoSize = newTyLe[catKeySync].map((sz: any) => ({
                      size: sz.size,
                      sl: sz.sl || 0,
                    }));
                  }
                  
                  // Tự động tính lại tổng SL thực tế của khâu Cắt
                  let totalThucTe = 0;
                  newDsMau.forEach(mau => {
                    if (mau.tyLeSizeChiTiet) {
                      const catKey = Object.keys(mau.tyLeSizeChiTiet).find(k =>
                        k.toLowerCase().includes("cat") ||
                        (lc.phanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt") ||
                        (fixedPhanCong?.find((p: any) => p.id === k)?.tenCongDoan || "").toLowerCase().includes("cắt")
                      );
                      if (catKey && mau.tyLeSizeChiTiet[catKey]) {
                        totalThucTe += mau.tyLeSizeChiTiet[catKey].reduce((sum: number, sz: any) => sum + (sz.sl || 0), 0);
                      }
                    }
                  });

                  // ===== TÁCH 2 LẦN LƯU ĐỘC LẬP =====
                  // Lần 1: Lưu dsMau + tongSLThucTe (quan trọng nhất - PHẢI thành công)
                  suaLenhCat(lc.id, { dsMau: newDsMau, tongSLThucTe: totalThucTe }, user!)
                    .then(() => toast.success("Đã cập nhật tỷ lệ size thành công!"))
                    .catch((err: any) => toast.error("Lỗi khi lưu tỷ lệ size: " + (err?.message || err)));

                  // Lần 2: Repair phanCong nếu đang rỗng (KHÔNG ảnh hưởng lần lưu trên)
                  // Gọi bất đồng bộ riêng, lỗi chỉ log console, không block UI.
                  if (fixedPhanCong && fixedPhanCong.length > 0) {
                    suaLenhCat(lc.id, { phanCong: fixedPhanCong }, user!)
                      .catch((err: any) => console.warn("[phanCong repair]", err?.message || err));
                  }
                }
              }}
              onSaveGiaCong={(slThucTe, dsPhanCong, newDsMau) => {
                const updatePayload: any = { phanCong: dsPhanCong };
                
                if (newDsMau) {
                  updatePayload.dsMau = newDsMau;
                  // Xác định xem đang lưu áo hay quần để cập nhật tổng SL thực tế
                  const hasMayAo = dsPhanCong.some((pc: any) => pc.tenCongDoan?.toLowerCase().includes("may áo"));
                  if (hasMayAo) updatePayload.tongSLThucTeAo = slThucTe;
                  else updatePayload.tongSLThucTeQuan = slThucTe;
                }
                
                suaLenhCat(lc.id, updatePayload, user!);
                toast.success("Đã cập nhật giao việc và chi tiết size gia công thành công!");
              }}
            />
          ))}
        </div>
      ) : (
        <LenhCatTableView
          stage="lenh-cat"
          list={filteredLC}
          onActionClick={(lc) => handleEdit(lc)}
          onTyLeClick={(lc) => handleEdit(lc)}
        />
      )}

      {showTaoMauCD && (
        <MauCDModal
          dsMauCongDoan={dsMauCongDoan}
          newMauCD={newMauCD}
          setNewMauCD={setNewMauCD}
          customStepName={customStepName}
          setCustomStepName={setCustomStepName}
          onClose={() => setShowTaoMauCD(false)}
          onSave={() => { 
            themMauCongDoan({ ...newMauCD, id: newMauCD.id || "cd_" + Date.now() }); 
            setShowTaoMauCD(false); 
          }}
        />
      )}

      {showTaoMauCP && (
        <MauCPModal
          dsMauChiPhi={dsMauChiPhi}
          newMauCP={newMauCP}
          setNewMauCP={setNewMauCP}
          customCostName={customCostName}
          setCustomCostName={setCustomCostName}
          onClose={() => setShowTaoMauCP(false)}
          onSave={() => { 
            themMauChiPhi({ ...newMauCP, id: newMauCP.id || "cp_" + Date.now() }); 
            setShowTaoMauCP(false); 
          }}
        />
      )}

      {showModal && (
        <LenhCatModal
          isOpen={true}
          onClose={() => { setShowModal(false); setEditId(null); setDraftData(null); }}
          editId={editId}
          initialSP={draftData}
        />
      )}
    </div>
  );
}
