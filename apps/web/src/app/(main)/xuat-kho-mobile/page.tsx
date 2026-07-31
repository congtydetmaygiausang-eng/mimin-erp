"use client";

// ============ XUẤT KHO MOBILE (Đợt 7) ============
// Tạo phiếu xuất kho cho LSX / công đoạn

import { useState, useMemo, Suspense } from "react";
import { ArrowUpFromLine, Plus, X, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useKhoMobile, TRANG_THAI_PK_STYLE, type LoaiKho, type PhieuKho } from "@/lib/data/kho-mobile-store";
import { getKhoKPI, filterByLoaiKho, filterByLoaiPhieu } from "@/lib/kho-mobile-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay, ConfirmDialog } from "@/components/ui";
import { KHO_VAI } from "@/lib/data/real-data";

export default function XuatKhoMobilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <XuatKhoMobileContent />
    </Suspense>
  );
}

function XuatKhoMobileContent() {
  const { user } = useSession();
  const { phieu, taoPhieu, duyetPhieu, hoanThanh } = useKhoMobile();
  const [showForm, setShowForm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "duyet" | "hoanThanh"; p: PhieuKho } | null>(null);

  const filtered = useMemo(
    () => filterByLoaiPhieu(phieu, "xuat"),
    [phieu]
  );
  const kpi = getKhoKPI(filtered);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "duyet") {
      duyetPhieu(confirmAction.p.id, user);
      toast.success("Đã duyệt");
    } else {
      hoanThanh(confirmAction.p.id, user);
      toast.success("Đã hoàn thành xuất kho");
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ArrowUpFromLine className="w-7 h-7 text-sky-500" />
            Xuất kho
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {filtered.length} phiếu · SL: <b className="text-sky-600">{kpi.tongXuat.toLocaleString()}</b>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tạo phiếu
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Chưa có phiếu xuất" description="Bấm 'Tạo phiếu' để xuất kho" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const s = TRANG_THAI_PK_STYLE[p.trangThai];
            return (
              <MobileCard
                key={p.id}
                title={p.id}
                subtitle={`${p.tenSP} · ${p.lsx || ""}`}
                badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{p.trangThai}</span>}
                fields={[
                  { label: "SL", value: <span className="font-mono">{p.soLuong.toLocaleString()} {p.donVi}</span> },
                  { label: "Giá trị", value: <span className="font-mono font-semibold text-sky-600">{formatVNDShort(p.thanhTien)}</span>, highlight: true },
                  { label: "Người tạo", value: p.nguoiTao },
                  { label: "Ngày", value: <DateDisplay value={p.ngayTao} /> },
                ]}
                actions={
                  <div className="flex gap-1 w-full">
                    {p.trangThai === "Chờ duyệt" && (
                      <button
                        onClick={() => setConfirmAction({ type: "duyet", p })}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded bg-sky-500/15 text-sky-700 font-medium"
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> Duyệt
                      </button>
                    )}
                    {p.trangThai === "Đã duyệt" && (
                      <button
                        onClick={() => setConfirmAction({ type: "hoanThanh", p })}
                        className="flex-1 text-[10px] px-2 py-1.5 rounded bg-emerald-500/15 text-emerald-700 font-medium"
                      >
                        <Send className="w-3 h-3 inline mr-0.5" /> Hoàn thành
                      </button>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {showForm && <TaoPhieuXuatModal onClose={() => setShowForm(false)} onSubmit={(data: any) => {
        taoPhieu({
          ...data,
          loai: "xuat",
          maNV: user?.id || "NV001",
          nguoiTao: user?.name || user?.id || "NV001",
        }, user);
        toast.success("Đã tạo phiếu xuất kho");
        setShowForm(false);
      }} />}

      {confirmAction && (
        <ConfirmDialog
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirm}
          title={confirmAction.type === "duyet" ? "Duyệt phiếu xuất?" : "Hoàn thành xuất kho?"}
          description={`Phiếu ${confirmAction.p.id} - ${confirmAction.p.tenSP}`}
          confirmLabel={confirmAction.type === "duyet" ? "Duyệt" : "Hoàn thành"}
        />
      )}
    </div>
  );
}

function TaoPhieuXuatModal({ onClose, onSubmit }: any) {
  const [loaiKho, setLoaiKho] = useState<LoaiKho>("vai");
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [soLuong, setSoLuong] = useState(1);
  const [donGia, setDonGia] = useState(0);
  const [lsx, setLsx] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const dsSP = loaiKho === "vai" ? KHO_VAI : [];

  const handleSubmit = () => {
    if (!maSP || !tenSP || soLuong <= 0) {
      toast.error("Vui lòng điền đủ thông tin");
      return;
    }
    onSubmit({
      loaiKho, maSP, tenSP, soLuong, donVi: "m", donGia, thanhTien: soLuong * donGia,
      lsx, ghiChu,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ArrowUpFromLine className="w-5 h-5 text-sky-500" /> Tạo phiếu xuất
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            {(["vai", "phu-lieu"] as LoaiKho[]).map((k) => (
              <button
                key={k}
                onClick={() => setLoaiKho(k)}
                className={`text-xs py-2 rounded ${
                  loaiKho === k ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5"
                }`}
              >
                {k === "vai" ? "Vải" : "Phụ liệu"}
              </button>
            ))}
          </div>

          {dsSP.length > 0 && loaiKho === "vai" && (
            <div>
              <label className="text-xs font-medium block mb-1">Chọn nhanh</label>
              <select
                onChange={(e) => {
                  const sp = dsSP.find((s) => s.maVT === e.target.value);
                  if (sp) { setMaSP(sp.maVT); setTenSP(sp.tenVT); setDonGia(sp.donGia || 0); }
                }}
                className="input w-full"
              >
                <option value="">-- Chọn vải --</option>
                {dsSP.map((s) => (
                  <option key={s.maVT} value={s.maVT}>{s.maVT} - {s.tenVT}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium block mb-1">Mã SP *</label>
            <input className="input w-full" value={maSP} onChange={(e) => setMaSP(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Tên SP *</label>
            <input className="input w-full" value={tenSP} onChange={(e) => setTenSP(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">SL *</label>
              <input type="number" min={1} className="input w-full" value={soLuong} onChange={(e) => setSoLuong(Math.max(1, parseInt(e.target.value) || 0))} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá</label>
              <input type="number" min={0} className="input w-full" value={donGia} onChange={(e) => setDonGia(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">LSX liên quan</label>
            <input className="input w-full" value={lsx} onChange={(e) => setLsx(e.target.value)} placeholder="VD: LSX-2026-001" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[60px]" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={handleSubmit} className="btn-primary text-sm bg-sky-500 hover:bg-sky-600">Tạo phiếu</button>
        </div>
      </div>
    </div>
  );
}
