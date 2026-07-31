"use client";

// ============ KIỂM TRA CHẤT LƯỢNG (Đợt 8 - Bộ 8) ============
// QC kiểm tra sản phẩm từ các công đoạn

import { useState, useMemo, Suspense } from "react";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, RotateCcw, X, Plus,
  ClipboardCheck, ScanLine,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useQC, TRANG_THAI_QC_STYLE, type BanGhiQC, type LoiQC } from "@/lib/data/qc-store";
import { getQCKPI } from "@/lib/qc-helper";
import { MobileCard, EmptyState, DateDisplay } from "@/components/ui";

export default function KiemTraCLPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <KiemTraCLContent />
    </Suspense>
  );
}

function KiemTraCLContent() {
  const { user } = useSession();
  const { banGhi, nhanKiem, dat, baoLoi, xuLyLoi } = useQC();
  const [filter, setFilter] = useState<"all" | "choKiem" | "dat" | "loi">("all");
  const [showKiem, setShowKiem] = useState<BanGhiQC | null>(null);
  const [showBaoLoi, setShowBaoLoi] = useState<BanGhiQC | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return banGhi;
    if (filter === "choKiem") return banGhi.filter((b) => b.trangThai === "Chờ kiểm" || b.trangThai === "Đang kiểm" || b.trangThai === "Đã xử lý lỗi");
    if (filter === "dat") return banGhi.filter((b) => b.trangThai === "Đạt");
    if (filter === "loi") return banGhi.filter((b) => b.trangThai === "Có lỗi");
    return banGhi;
  }, [banGhi, filter]);

  const kpi = getQCKPI(banGhi);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-rose-500" />
          Kiểm tra chất lượng
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {filtered.length} phiếu · SL đạt: <b className="text-emerald-600">{kpi.tongDat.toLocaleString()}</b> · SL lỗi: <b className="text-rose-600">{kpi.tongLoi.toLocaleString()}</b>
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {([
          { v: "all", label: "Tất cả", count: banGhi.length },
          { v: "choKiem", label: "Chờ kiểm", count: kpi.theoTrangThai["Chờ kiểm"].count + kpi.theoTrangThai["Đang kiểm"].count },
          { v: "dat", label: "Đạt", count: kpi.theoTrangThai["Đạt"].count },
          { v: "loi", label: "Có lỗi", count: kpi.theoTrangThai["Có lỗi"].count },
        ] as { v: any; label: string; count: number }[]).map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
              filter === f.v ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="Không có phiếu" description="Thử đổi filter" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((b) => {
            const s = TRANG_THAI_QC_STYLE[b.trangThai];
            return (
              <MobileCard
                key={b.id}
                title={b.id}
                subtitle={`${b.congDoan} · ${b.nguoiThucHien}`}
                badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{b.trangThai}</span>}
                fields={[
                  { label: "Mã SP", value: b.maSP },
                  { label: "SL giao", value: <span className="font-mono">{b.soLuongGiao.toLocaleString()}</span> },
                  { label: "SL đạt", value: <span className="font-mono text-emerald-600 font-semibold">{b.soLuongDat.toLocaleString()}</span> },
                  { label: "SL lỗi", value: <span className="font-mono text-rose-600">{b.soLuongLoi.toLocaleString()}</span> },
                  { label: "Tỷ lệ", value: <span className="font-mono">{b.tiLeDat}%</span>, highlight: true },
                  { label: "Ngày kiểm", value: <DateDisplay value={b.ngayKiem} /> },
                ]}
                actions={
                  <div className="flex gap-1 w-full flex-wrap">
                    {b.trangThai === "Chờ kiểm" && (
                      <button onClick={() => { nhanKiem(b.id, user); toast.success("Đã nhận kiểm"); }} className="flex-1 text-[10px] px-2 py-1.5 rounded bg-amber-500/15 text-amber-700 font-medium">
                        <ClipboardCheck className="w-3 h-3 inline mr-0.5" /> Nhận
                      </button>
                    )}
                    {(b.trangThai === "Đang kiểm" || b.trangThai === "Đã xử lý lỗi") && (
                      <>
                        <button onClick={() => setShowKiem(b)} className="flex-1 text-[10px] px-2 py-1.5 rounded bg-emerald-500/15 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3 inline mr-0.5" /> Đạt
                        </button>
                        <button onClick={() => setShowBaoLoi(b)} className="flex-1 text-[10px] px-2 py-1.5 rounded bg-rose-500/15 text-rose-700 font-medium">
                          <AlertTriangle className="w-3 h-3 inline mr-0.5" /> Lỗi
                        </button>
                      </>
                    )}
                    {b.trangThai === "Có lỗi" && (
                      <button onClick={() => { xuLyLoi(b.id, user); toast.success("Đã đánh dấu xử lý lỗi"); }} className="flex-1 text-[10px] px-2 py-1.5 rounded bg-sky-500/15 text-sky-700 font-medium">
                        <RotateCcw className="w-3 h-3 inline mr-0.5" /> Đã xử lý
                      </button>
                    )}
                  </div>
                }
              />
            );
          })}
        </div>
      )}

      {/* Modal kiểm tra (Đạt) */}
      {showKiem && <KiemModal record={showKiem} onClose={() => setShowKiem(null)} onConfirm={(slDat: number, slLoi: number, ghiChu: string) => {
        dat(showKiem.id, slDat, slLoi, ghiChu, user);
        toast.success("Đã đánh dấu đạt");
        setShowKiem(null);
      }} />}

      {/* Modal báo lỗi */}
      {showBaoLoi && <BaoLoiModal record={showBaoLoi} onClose={() => setShowBaoLoi(null)} onConfirm={(loi: LoiQC[], ghiChu: string) => {
        baoLoi(showBaoLoi.id, loi, ghiChu, user);
        toast.warning("Đã báo lỗi cho NV trước");
        setShowBaoLoi(null);
      }} />}
    </div>
  );
}

function KiemModal({ record, onClose, onConfirm }: any) {
  const [slDat, setSlDat] = useState(record.soLuongDat);
  const [slLoi, setSlLoi] = useState(record.soLuongLoi);
  const [ghiChu, setGhiChu] = useState("");
  const tong = slDat + slLoi;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" /> QC Đạt - {record.id}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium block mb-1">SL đạt *</label>
              <input type="number" min={0} className="input w-full" value={slDat} onChange={(e) => setSlDat(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">SL lỗi</label>
              <input type="number" min={0} className="input w-full" value={slLoi} onChange={(e) => setSlLoi(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
          </div>
          <div className="text-xs text-center opacity-70">Tổng kiểm: {tong} sp · Tỷ lệ đạt: {tong > 0 ? Math.round((slDat / tong) * 100) : 0}%</div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[60px]" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={() => onConfirm(slDat, slLoi, ghiChu)} className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600">Xác nhận đạt</button>
        </div>
      </div>
    </div>
  );
}

function BaoLoiModal({ record, onClose, onConfirm }: any) {
  const [loiList, setLoiList] = useState<LoiQC[]>([{ id: "L1", loai: "mop", moTa: "", soLuong: 0 }]);
  const [ghiChu, setGhiChu] = useState("");

  const addLoi = () => {
    setLoiList([...loiList, { id: `L${loiList.length + 1}`, loai: "khac", moTa: "", soLuong: 0 }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-lg w-full p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" /> Báo lỗi - {record.id}
          </h3>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          {loiList.map((l, i) => (
            <div key={l.id} className="card p-2 bg-rose-500/5">
              <div className="grid grid-cols-3 gap-2 mb-1.5">
                <select className="input text-xs py-1" value={l.loai} onChange={(e) => {
                  const newList = [...loiList];
                  newList[i].loai = e.target.value as any;
                  setLoiList(newList);
                }}>
                  <option value="mop">Móp</option>
                  <option value="rach">Rách</option>
                  <option value="buc-chi">Bục chỉ</option>
                  <option value="sai-mau">Sai màu</option>
                  <option value="sai-size">Sai size</option>
                  <option value="khac">Khác</option>
                </select>
                <input type="number" min={0} placeholder="SL" className="input text-xs py-1" value={l.soLuong} onChange={(e) => {
                  const newList = [...loiList];
                  newList[i].soLuong = parseInt(e.target.value) || 0;
                  setLoiList(newList);
                }} />
                <button onClick={() => setLoiList(loiList.filter((_, idx) => idx !== i))} className="text-rose-600 text-xs">Xoá</button>
              </div>
              <input className="input text-xs py-1 w-full" placeholder="Mô tả chi tiết" value={l.moTa} onChange={(e) => {
                const newList = [...loiList];
                newList[i].moTa = e.target.value;
                setLoiList(newList);
              }} />
            </div>
          ))}
          <button onClick={addLoi} className="w-full text-xs py-2 rounded bg-rose-500/10 text-rose-700 flex items-center justify-center gap-1">
            <Plus className="w-3 h-3" /> Thêm lỗi
          </button>
          <div>
            <label className="text-xs font-medium block mb-1 mt-2">Ghi chú chung</label>
            <textarea className="input w-full min-h-[60px]" value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={() => onConfirm(loiList.filter((l) => l.moTa || l.soLuong > 0), ghiChu)} className="btn-primary text-sm bg-rose-500 hover:bg-rose-600">Gửi báo lỗi</button>
        </div>
      </div>
    </div>
  );
}
