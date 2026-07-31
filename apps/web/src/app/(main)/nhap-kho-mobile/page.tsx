"use client";

// ============ NHẬP KHO MOBILE (Đợt 7) ============
// Mobile-first: tạo phiếu nhập kho vải/phụ liệu/thành phẩm

import { useState, useMemo, Suspense } from "react";
import {
  ArrowDownToLine, Plus, Search, Package, Warehouse, X,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useKhoMobile, TRANG_THAI_PK_STYLE, type LoaiKho } from "@/lib/data/kho-mobile-store";
import { getKhoKPI, filterByLoaiKho, filterByLoaiPhieu } from "@/lib/kho-mobile-helper";
import { MobileCard, EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";
import { KHO_VAI, KHO_VAT_TU } from "@/lib/data/real-data";

export default function NhapKhoMobilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <NhapKhoMobileContent />
    </Suspense>
  );
}

function NhapKhoMobileContent() {
  const { user } = useSession();
  const { phieu, taoPhieu } = useKhoMobile();
  const [filterKho, setFilterKho] = useState<LoaiKho | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(
    () => filterByLoaiPhieu(filterByLoaiKho(phieu, filterKho), "nhap"),
    [phieu, filterKho]
  );
  const kpi = getKhoKPI(filtered);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <ArrowDownToLine className="w-7 h-7 text-emerald-500" />
            Nhập kho
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {filtered.length} phiếu · SL: <b className="text-emerald-600">{kpi.tongNhap.toLocaleString()}</b>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tạo phiếu
        </button>
      </div>

      {/* Filter kho */}
      <div className="flex flex-wrap gap-1.5">
        {(["all", "vai", "phu-lieu", "thanh-pham"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilterKho(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filterKho === k ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
            }`}
          >
            {k === "all" ? "Tất cả" : k === "vai" ? "Vải" : k === "phu-lieu" ? "Phụ liệu" : "Thành phẩm"}
          </button>
        ))}
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <EmptyState title="Chưa có phiếu nhập" description="Bấm 'Tạo phiếu' để nhập kho" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => {
            const s = TRANG_THAI_PK_STYLE[p.trangThai];
            return (
              <MobileCard
                key={p.id}
                title={p.id}
                subtitle={`${p.tenSP} · ${p.nhaCC || ""}`}
                badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{p.trangThai}</span>}
                fields={[
                  { label: "SL", value: <span className="font-mono">{p.soLuong.toLocaleString()} {p.donVi}</span> },
                  { label: "Đơn giá", value: <span className="font-mono">{p.donGia.toLocaleString()}</span> },
                  { label: "Thành tiền", value: <span className="font-mono font-semibold text-emerald-600">{formatVNDShort(p.thanhTien)}</span>, highlight: true },
                  { label: "Người tạo", value: p.nguoiTao },
                  { label: "Ngày", value: <DateDisplay value={p.ngayTao} /> },
                ]}
              />
            );
          })}
        </div>
      )}

      {/* Form tạo phiếu */}
      {showForm && <TaoPhieuNhapModal onClose={() => setShowForm(false)} onSubmit={(data: any) => {
        taoPhieu({
          ...data,
          loai: "nhap",
          maNV: user?.id || "NV001",
          nguoiTao: user?.name || user?.id || "NV001",
        }, user);
        toast.success("Đã tạo phiếu nhập kho");
        setShowForm(false);
      }} />}
    </div>
  );
}

function TaoPhieuNhapModal({ onClose, onSubmit }: any) {
  const [loaiKho, setLoaiKho] = useState<LoaiKho>("vai");
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [soLuong, setSoLuong] = useState(1);
  const [donGia, setDonGia] = useState(0);
  const [nhaCC, setNhaCC] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const dsSP = loaiKho === "vai" ? KHO_VAI : loaiKho === "phu-lieu" ? KHO_VAT_TU : [];

  const handleSubmit = () => {
    if (!maSP || !tenSP || soLuong <= 0 || donGia < 0) {
      toast.error("Vui lòng điền đủ thông tin");
      return;
    }
    onSubmit({
      loaiKho,
      maSP,
      tenSP,
      soLuong,
      donVi: "m",
      donGia,
      thanhTien: soLuong * donGia,
      nhaCC,
      ghiChu,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-500" /> Tạo phiếu nhập
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1">Loại kho</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["vai", "phu-lieu", "thanh-pham"] as LoaiKho[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setLoaiKho(k)}
                  className={`text-xs py-2 rounded ${
                    loaiKho === k ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5"
                  }`}
                >
                  {k === "vai" ? "Vải" : k === "phu-lieu" ? "Phụ liệu" : "Thành phẩm"}
                </button>
              ))}
            </div>
          </div>

          {dsSP.length > 0 && (
            <div>
              <label className="text-xs font-medium block mb-1">Chọn nhanh</label>
              <select
                onChange={(e) => {
                  const sp = dsSP.find((s) => s.maVT === e.target.value);
                  if (sp) {
                    setMaSP(sp.maVT);
                    setTenSP(sp.tenVT);
                    setDonGia(sp.donGia || 0);
                  }
                }}
                className="input w-full"
              >
                <option value="">-- Chọn mặt hàng --</option>
                {dsSP.map((s) => (
                  <option key={s.maVT} value={s.maVT}>{s.maVT} - {s.tenVT}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium block mb-1">Mã SP *</label>
            <input className="input w-full" value={maSP} onChange={(e) => setMaSP(e.target.value)} placeholder="VD: V001" />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Tên SP *</label>
            <input className="input w-full" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Vải cotton 100%" />
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
            <label className="text-xs font-medium block mb-1">Nhà CC</label>
            <input className="input w-full" value={nhaCC} onChange={(e) => setNhaCC(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[60px]" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
          <div className="text-sm font-bold text-emerald-600 text-right">
            Thành tiền: {formatVNDShort(soLuong * donGia)}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={handleSubmit} className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600">Tạo phiếu</button>
        </div>
      </div>
    </div>
  );
}
