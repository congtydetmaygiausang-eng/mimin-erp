"use client";

// ============ XUẤT KHO MOBILE (Premium AI) ============
// Mobile-first: tạo phiếu xuất kho cho LSX / công đoạn

import { useState, useMemo, Suspense } from "react";
import {
  ArrowUpFromLine, Plus, Search, Package, Warehouse, X, Sparkles, Wand2, Loader2, CheckCircle2, Send
} from "lucide-react";
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
      toast.success("Đã duyệt phiếu xuất");
    } else {
      hoanThanh(confirmAction.p.id, user);
      toast.success("Đã hoàn thành xuất kho");
    }
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header Premium (Sky Blue Theme) */}
      <div className="flex items-center justify-between p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 to-blue-500/5 border border-sky-500/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-3">
            <ArrowUpFromLine className="w-3.5 h-3.5" /> Lập phiếu xuất
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            Xuất Kho Hàng Hoá
          </h1>
          <p className="opacity-80 mt-2 text-sm text-slate-600 dark:text-slate-300">
            Tổng số phiếu: <b className="text-sky-600">{filtered.length}</b> · Đã xuất: <b className="text-sky-600">{kpi.tongXuat.toLocaleString()} SP</b>
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="relative z-10 group px-5 py-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white font-medium flex items-center gap-2 shadow-lg shadow-sky-500/30 hover:scale-105 transition-all"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
          <span>Tạo phiếu xuất</span>
        </button>
      </div>

      {/* Danh sách */}
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Chưa có phiếu xuất nào" description="Bấm 'Tạo phiếu xuất' hoặc dùng AI để tạo nhanh phiếu xuất kho." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const s = TRANG_THAI_PK_STYLE[p.trangThai];
            return (
              <div key={p.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">{p.id}</h3>
                      <div className="text-sm text-slate-500">{p.tenSP} {p.lsx ? `· ${p.lsx}` : ""}</div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
                      {p.trangThai}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Số lượng:</span>
                      <span className="font-mono font-medium">{p.soLuong.toLocaleString()} {p.donVi}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Thành tiền:</span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{formatVNDShort(p.thanhTien)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex gap-2 w-full mb-3">
                    {p.trangThai === "Chờ duyệt" && (
                      <button
                        onClick={() => setConfirmAction({ type: "duyet", p })}
                        className="flex-1 text-xs py-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors flex justify-center items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Duyệt phiếu
                      </button>
                    )}
                    {p.trangThai === "Đã duyệt" && (
                      <button
                        onClick={() => setConfirmAction({ type: "hoanThanh", p })}
                        className="flex-1 text-xs py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors flex justify-center items-center gap-1"
                      >
                        <Send className="w-4 h-4" /> Hoàn thành xuất
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5"/> {p.nguoiTao}</span>
                    <DateDisplay value={p.ngayTao} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form tạo phiếu */}
      {showForm && <TaoPhieuXuatModal onClose={() => setShowForm(false)} onSubmit={(data: any) => {
        taoPhieu({
          ...data,
          loai: "xuat",
          maNV: user?.id || "NV001",
          nguoiTao: user?.name || user?.id || "NV001",
        }, user);
        toast.success("Đã tạo phiếu xuất kho thành công!");
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

  const [aiText, setAiText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const dsSP = loaiKho === "vai" ? KHO_VAI : [];

  const handleAiAutoFill = async () => {
    if (!aiText.trim()) {
      toast.error("Vui lòng nhập nội dung cho AI");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/v1/ai-parse-kho-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Lỗi không xác định");

      let filledCount = 0;
      if (data.loaiKho) { setLoaiKho(data.loaiKho); filledCount++; }
      if (data.tenSP) { setTenSP(data.tenSP); filledCount++; }
      if (data.maSP) { setMaSP(data.maSP); filledCount++; }
      if (typeof data.soLuong === "number") { setSoLuong(data.soLuong); filledCount++; }
      if (typeof data.donGia === "number") { setDonGia(data.donGia); filledCount++; }
      if (data.lsx) { setLsx(data.lsx); filledCount++; }

      if (filledCount === 0) {
        toast.error("AI không nhận ra thông tin nào rõ ràng trong nội dung này, anh/chị điền tay giúp em nhé");
      } else {
        toast.success(`AI đã điền ${filledCount} trường - kiểm tra lại trước khi lưu nhé`);
        setAiText("");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi gọi AI bóc tách");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!maSP || !tenSP || soLuong <= 0) {
      toast.error("Vui lòng điền đủ thông tin");
      return;
    }
    onSubmit({
      loaiKho, maSP, tenSP, soLuong, donVi: loaiKho === "vai" ? "m" : "cái", donGia, thanhTien: soLuong * donGia,
      lsx, ghiChu,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 animate-slide-up shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-sky-100 dark:bg-sky-500/20 text-sky-600 rounded-xl">
              <ArrowUpFromLine className="w-5 h-5" /> 
            </div>
            Tạo phiếu xuất mới
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* AI Auto Fill Box */}
        <div className="mb-6 bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-violet-700 dark:text-violet-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AI Kho Auto-Fill
            </label>
            <span className="text-[10px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium">Thử nghiệm</span>
          </div>
          <div className="flex gap-2">
            <input 
              className="flex-1 bg-white/60 dark:bg-slate-900/60 border border-violet-200 dark:border-violet-800/50 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none" 
              placeholder="VD: Xuất 200m vải cho LSX-102..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={isAiLoading}
            />
            <button 
              onClick={handleAiAutoFill}
              disabled={isAiLoading || !aiText.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Điền tự động
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">Loại kho xuất</label>
            <div className="grid grid-cols-2 gap-2">
              {(["vai", "phu-lieu"] as LoaiKho[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setLoaiKho(k)}
                  className={`text-sm py-2.5 rounded-xl font-medium transition-colors ${
                    loaiKho === k ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {k === "vai" ? "Kho Vải" : "Kho Phụ liệu"}
                </button>
              ))}
            </div>
          </div>

          {dsSP.length > 0 && loaiKho === "vai" && (
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">Chọn mã hàng có sẵn</label>
              <select
                onChange={(e) => {
                  const sp = dsSP.find((s) => s.maVT === e.target.value);
                  if (sp) { setMaSP(sp.maVT); setTenSP(sp.tenVT); setDonGia(sp.donGia || 0); }
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
              >
                <option value="">-- Chọn hoặc tìm mã vải --</option>
                {dsSP.map((s) => (
                  <option key={s.maVT} value={s.maVT}>{s.maVT} - {s.tenVT}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã SP *</label>
              <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" value={maSP} onChange={(e) => setMaSP(e.target.value)} placeholder="VD: V001" />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên SP *</label>
              <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Vải cotton 100%" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">Số lượng *</label>
              <input type="number" min={1} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" value={soLuong} onChange={(e) => setSoLuong(Math.max(1, parseInt(e.target.value) || 0))} />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">LSX liên quan</label>
              <input className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500" value={lsx} onChange={(e) => setLsx(e.target.value)} placeholder="VD: LSX-2026-001" />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-800">
            <span className="text-sm text-slate-500 font-medium">Tổng thành tiền xuất:</span>
            <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
              {formatVNDShort(soLuong * donGia)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-medium transition-colors">Huỷ</button>
          <button onClick={handleSubmit} className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-lg shadow-sky-500/30 transition-colors">Xác nhận tạo phiếu</button>
        </div>
      </div>
    </div>
  );
}
