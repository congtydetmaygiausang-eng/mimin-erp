"use client";

import { useState } from "react";
import { Scissors } from "lucide-react";
import { toast } from "sonner";
import { LenhCatModal } from "@/components/LenhCatModal";
import { useLenhCat, type TrangThaiLenhCat } from "@/lib/data/lenh-cat-store";
import { EmptyState } from "@/components/ui";
import { PremiumHeader } from "./components/Header";
import { FilterBar, MauSection } from "./components/FilterBar";
import { LenhCatCard } from "./components/LCard";
import { MauCDModal, MauCPModal } from "./components/MauModals";

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
  const { dsLenhCat, xoaLenhCat, capNhatTrangThai, reset, themMauCongDoan, themMauChiPhi, dsMauCongDoan, dsMauChiPhi, xoaMauCongDoan, xoaMauChiPhi, loading } = useLenhCat();

  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [showTaoMauCP, setShowTaoMauCP] = useState(false);
  const [customStepName, setCustomStepName] = useState("");
  const [customCostName, setCustomCostName] = useState("");
  const [newMauCD, setNewMauCD] = useState<{ id: string; ten: string; giaCong: any[] }>({ id: "", ten: "", giaCong: DEFAULT_GIA_CONG });
  const [newMauCP, setNewMauCP] = useState({ id: "", ten: "", chiPhi: { baoBi: 0, temNhan: 0, khauHao: 0 } });

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterTrangThai, setFilterTrangThai] = useState<"ALL" | TrangThaiLenhCat>("ALL");
  const [expandedMauCD, setExpandedMauCD] = useState<string | null>(null);
  const [expandedMauCP, setExpandedMauCP] = useState<string | null>(null);
  const [showDanhSachMau, setShowDanhSachMau] = useState(false);

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

  const filteredLC = dsLenhCat.filter((l) => filterTrangThai === "ALL" || l.trangThai === filterTrangThai);

  // Handlers
  const handleEdit = (id: string) => { setEditId(id); setShowModal(true); };
  // Tạm dùng lại LenhCatModal: wizard /lenh-cat/tao-moi chưa chạy được
  // (thiếu framer-motion + @/components/ui/button), đã chuyển vào _tao-moi.
  const handleCreate = () => { setEditId(null); setShowModal(true); };
  const handleDelete = (id: string) => {
    if (confirm(`Xoá ${id}? Hành động này không thể hoàn tác.`)) {
      xoaLenhCat(id, (typeof window !== 'undefined' && (window as any).__currentUser) || null as any);
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
    <div className="space-y-4 animate-fade-in">
      <PremiumHeader stats={stats} onReset={handleReset} onCreate={handleCreate} />

      <FilterBar
        filterTrangThai={filterTrangThai}
        setFilterTrangThai={setFilterTrangThai}
        totalCount={stats.tongLC}
        counts={filterCounts}
        onCreateCD={handleCreateCD}
        onCreateCP={handleCreateCP}
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
      ) : (
        <div className="flex flex-col gap-3">
          {filteredLC.map((lc) => (
            <LenhCatCard
              key={lc.id}
              lc={lc}
              onEdit={() => handleEdit(lc.id)}
              onDelete={() => handleDelete(lc.id)}
              onChangeStatus={async (tt) => {
                await capNhatTrangThai(lc.id, tt, null);
                if (tt === "DangCat") {
                  toast.success(`✂️ Đang Cắt — Đã tự động xuất kho vải & phụ liệu cho ${lc.id}`, {
                    description: "Vào Kho Vải / Kho Phụ Liệu để xem lịch sử giao dịch.",
                    duration: 5000,
                  });
                }
              }}
            />
          ))}
        </div>
      )}

      {showTaoMauCD && (
        <MauCDModal
          dsMauCongDoan={dsMauCongDoan}
          newMauCD={newMauCD}
          setNewMauCD={setNewMauCD}
          customStepName={customStepName}
          setCustomStepName={setCustomStepName}
          onClose={() => setShowTaoMauCD(false)}
          onSave={() => { themMauCongDoan(newMauCD); setShowTaoMauCD(false); }}
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
          onSave={() => { themMauChiPhi(newMauCP); setShowTaoMauCP(false); }}
        />
      )}

      {showModal && (
        <LenhCatModal
          isOpen={true}
          onClose={() => { setShowModal(false); setEditId(null); }}
          editId={editId}
        />
      )}
    </div>
  );
}
