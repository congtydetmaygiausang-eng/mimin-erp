"use client";

// ============ ĐỐI SOÁT SẢN LƯỢNG (Đợt 5 - Bộ 3 Kế toán) ============
// Bảng đối soát 12 cột + filter 7 trạng thái + action (Duyệt/Khóa/Thanh toán/Khiếu nại)
// Dùng ALL_REAL_PHIEU (data thật từ Lark chị Giàu) - 12+ phiếu M758/M873

import { useState, useMemo, Suspense } from "react";
import {
  Wallet, Lock, Unlock, AlertTriangle, Send, X, CheckCircle2,
  DollarSign, FileText, Search, Filter, Eye, Edit2, MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  useDoiSoat, TRANG_THAI_DOI_SOAT, TRANG_THAI_STYLE,
  type BanGhiDoiSoat, type TrangThaiDoiSoat,
} from "@/lib/data/doi-soat-store";
import { getDoiSoatKPI, topNguoiTienCong } from "@/lib/doi-soat-helper";
import { DateDisplay, EmptyState, MobileCard, ConfirmDialog, formatVNDShort } from "@/components/ui";

type FilterTrangThai = "all" | TrangThaiDoiSoat;

export default function DoiSoatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm opacity-60">Đang tải…</div>}>
      <DoiSoatContent />
    </Suspense>
  );
}

function DoiSoatContent() {
  const { user } = useSession();
  const { doiSoat, capNhatTrangThai, capNhatThanhToan, capNhatKhauTru, themKhiieuNai, giaiQuyetKhiieuNai, khoa, moKhoa } = useDoiSoat();
  const [filter, setFilter] = useState<FilterTrangThai>("all");
  const [search, setSearch] = useState("");
  const [showPayment, setShowPayment] = useState<BanGhiDoiSoat | null>(null);
  const [showKhiieuNai, setShowKhiieuNai] = useState<BanGhiDoiSoat | null>(null);
  const [showDetail, setShowDetail] = useState<BanGhiDoiSoat | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | { title: string; description?: string; onConfirm: () => void; variant?: "danger" | "primary" | "warning" }>(null);

  const kpi = useMemo(() => getDoiSoatKPI(doiSoat), [doiSoat]);
  const top10 = useMemo(() => topNguoiTienCong(doiSoat, 10), [doiSoat]);

  const filtered = doiSoat.filter((d) => {
    if (filter !== "all" && d.trangThai !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!d.id.toLowerCase().includes(q) &&
          !d.nguoiThucHien.toLowerCase().includes(q) &&
          !d.maSP.toLowerCase().includes(q) &&
          !d.congDoan.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const handleAction = (record: BanGhiDoiSoat, newStatus: TrangThaiDoiSoat) => {
    if (record.locked) {
      toast.error("Bản ghi đã khóa, không thể thay đổi");
      return;
    }
    capNhatTrangThai(record.id, newStatus, user);
    toast.success(`Đã cập nhật: ${newStatus}`);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-500" />
          Đối soát sản lượng
        </h1>
        <p className="opacity-70 mt-1 text-sm">
          {kpi.tongBanGhi} bản ghi · Tổng tiền công <b className="text-emerald-600">{formatVNDShort(kpi.tongThucNhan)}</b> · Còn nợ <b className="text-amber-600">{formatVNDShort(kpi.tongConNo)}</b>
        </p>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Bản ghi" value={kpi.tongBanGhi} icon={<FileText className="w-4 h-4" />} color="slate" />
        <KPICard label="Tổng tiền" value={formatVNDShort(kpi.tongThucNhan)} icon={<DollarSign className="w-4 h-4" />} color="emerald" />
        <KPICard label="Đã TT" value={formatVNDShort(kpi.tongDaThanhToan)} icon={<CheckCircle2 className="w-4 h-4" />} color="sky" />
        <KPICard label="Còn nợ" value={formatVNDShort(kpi.tongConNo)} icon={<Wallet className="w-4 h-4" />} color="amber" highlight={kpi.tongConNo > 0} />
        <KPICard label="Khiếu nại" value={kpi.tongKhiieuNai} icon={<AlertTriangle className="w-4 h-4" />} color="rose" highlight={kpi.tongKhiieuNai > 0} />
        <KPICard label="Đã khóa" value={kpi.tongLocked} icon={<Lock className="w-4 h-4" />} color="violet" />
      </div>

      {/* Top 3 tiền công cao nhất */}
      {top10.length > 0 && (
        <div className="card p-4 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div className="text-xs font-bold opacity-70 mb-2 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Top {Math.min(3, top10.length)} người có tiền công cao nhất
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {top10.slice(0, 3).map((p, i) => (
              <div key={p.ma} className="bg-white/40 dark:bg-white/5 rounded p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    i === 0 ? "bg-amber-500 text-white" : i === 1 ? "bg-slate-400 text-white" : "bg-orange-500 text-white"
                  }`}>{i + 1}</span>
                  <span className="text-xs font-mono opacity-70">{p.ma}</span>
                </div>
                <div className="font-semibold text-sm truncate">{p.ten}</div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="opacity-60">{p.tongSL.toLocaleString()} sp / {p.soBanGhi} phiếu</span>
                  <b className="text-emerald-600">{formatVNDShort(p.tongTien)}</b>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips - 7 trạng thái */}
      <div className="flex flex-wrap gap-1.5 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
            filter === "all" ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
          }`}
        >
          Tất cả ({doiSoat.length})
        </button>
        {TRANG_THAI_DOI_SOAT.map((t) => {
          const count = kpi.theoTrangThai[t].count;
          const s = TRANG_THAI_STYLE[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                filter === t ? `${s.bg} ${s.color} ring-2 ring-current` : `${s.bg} ${s.color} opacity-60 hover:opacity-100`
              }`}
            >
              {t} ({count})
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm theo mã, NV, mã SP, công đoạn..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Bảng desktop - 12 cột */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50/50 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <th className="p-3">Mã</th>
                <th className="p-3">Người TH</th>
                <th className="p-3">CĐ</th>
                <th className="p-3">Mã SP</th>
                <th className="p-3 text-right">SL nhận</th>
                <th className="p-3 text-right">SL đạt</th>
                <th className="p-3 text-right">SL lỗi</th>
                <th className="p-3 text-right">Đơn giá</th>
                <th className="p-3 text-right">Tiền công</th>
                <th className="p-3 text-right">Khấu trừ</th>
                <th className="p-3 text-right">Thực nhận</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} className="p-8 text-center"><EmptyState title="Không có bản ghi" description="Thử đổi filter hoặc từ khoá" /></td></tr>
              ) : filtered.map((d) => {
                const s = TRANG_THAI_STYLE[d.trangThai];
                return (
                  <tr key={d.id} className={`border-b hover:bg-white/30 dark:hover:bg-white/5 ${d.locked ? "opacity-70" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <td className="p-3 font-mono text-xs font-semibold">
                      <div>{d.id}</div>
                      {d.locked && <Lock className="w-3 h-3 inline text-violet-600 mt-0.5" />}
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-medium">{d.nguoiThucHien}</div>
                      <div className="text-[10px] font-mono opacity-60">{d.nguoiThucHienMa}</div>
                    </td>
                    <td className="p-3 text-xs">{d.congDoan}</td>
                    <td className="p-3 text-xs font-mono">{d.maSP}</td>
                    <td className="p-3 text-right font-mono">{d.soLuongNhan.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-emerald-600 font-semibold">{d.soLuongDat.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-rose-600">{d.soLuongLoi.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-xs">{d.donGia.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-semibold">{formatVNDShort(d.thanhTien)}</td>
                    <td className="p-3 text-right font-mono text-xs text-rose-600">
                      {d.khauTru > 0 ? `-${formatVNDShort(d.khauTru)}` : "—"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">{formatVNDShort(d.thucNhan)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${s.bg} ${s.color}`}>
                        {d.trangThai}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {d.trangThai === "Chưa đối soát" && (
                          <button onClick={() => handleAction(d, "Chờ NV xác nhận")} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700">Gửi NV</button>
                        )}
                        {d.trangThai === "Chờ NV xác nhận" && (
                          <button onClick={() => handleAction(d, "Đã xác nhận")} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700">Xác nhận</button>
                        )}
                        {d.trangThai === "Đã xác nhận" && (
                          <button onClick={() => handleAction(d, "Chờ thanh toán")} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700">Lên lịch TT</button>
                        )}
                        {(d.trangThai === "Chờ thanh toán" || d.trangThai === "Đã thanh toán 1 phần") && (
                          <button onClick={() => setShowPayment(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700">Thanh toán</button>
                        )}
                        {d.trangThai !== "Đã thanh toán" && d.trangThai !== "Có khiếu nại" && !d.locked && (
                          <button onClick={() => setShowKhiieuNai(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700">KN</button>
                        )}
                        {d.khiieuNai && d.khiieuNai.trangThai !== "da-giai-quyet" && (
                          <button onClick={() => giaiQuyetKhiieuNai(d.id, user)} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700">Giải quyết</button>
                        )}
                        <button onClick={() => setShowDetail(d)} className="text-[10px] px-1.5 py-0.5 rounded bg-white/30"><Eye className="w-3 h-3 inline" /></button>
                        {d.locked ? (
                          <button onClick={() => moKhoa(d.id, user)} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700"><Unlock className="w-3 h-3 inline" /></button>
                        ) : (
                          <button onClick={() => setConfirmAction({ title: "Khóa đối soát", description: "Sau khi khóa, bản ghi không thể chỉnh sửa.", variant: "warning", onConfirm: () => { khoa(d.id, user); toast.success("Đã khóa"); } })} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700"><Lock className="w-3 h-3 inline" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <EmptyState title="Không có bản ghi" description="Thử đổi filter hoặc từ khoá" />
        ) : (
          filtered.map((d) => {
            const s = TRANG_THAI_STYLE[d.trangThai];
            return (
              <MobileCard
                key={d.id}
                title={d.id}
                subtitle={`${d.nguoiThucHien} · ${d.congDoan}`}
                badge={<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${s.bg} ${s.color}`}>{d.trangThai}</span>}
                fields={[
                  { label: "Mã SP", value: d.maSP },
                  { label: "SL đạt / lỗi", value: <span className="font-mono"><b className="text-emerald-600">{d.soLuongDat.toLocaleString()}</b> / <span className="text-rose-600">{d.soLuongLoi.toLocaleString()}</span></span>, highlight: true },
                  { label: "Đơn giá", value: <span className="font-mono">{d.donGia.toLocaleString()}</span> },
                  { label: "Tiền công", value: <span className="font-mono font-semibold text-emerald-600">{formatVNDShort(d.thucNhan)}</span> },
                  { label: "Đã TT", value: <span className="font-mono">{formatVNDShort(d.daThanhToan)}</span> },
                  { label: "Còn nợ", value: <span className={d.conNo > 0 ? "font-mono font-semibold text-amber-600" : "font-mono text-emerald-600"}>{formatVNDShort(d.conNo)}</span> },
                ]}
                actions={
                  <div className="flex flex-wrap gap-1 w-full">
                    {d.trangThai === "Chưa đối soát" && <button onClick={() => handleAction(d, "Chờ NV xác nhận")} className="text-[10px] px-2 py-1 rounded bg-sky-500/15 text-sky-700 font-medium">Gửi NV</button>}
                    {d.trangThai === "Chờ NV xác nhận" && <button onClick={() => handleAction(d, "Đã xác nhận")} className="text-[10px] px-2 py-1 rounded bg-violet-500/15 text-violet-700 font-medium">Xác nhận</button>}
                    {d.trangThai === "Đã xác nhận" && <button onClick={() => handleAction(d, "Chờ thanh toán")} className="text-[10px] px-2 py-1 rounded bg-amber-500/15 text-amber-700 font-medium">Lên lịch TT</button>}
                    {(d.trangThai === "Chờ thanh toán" || d.trangThai === "Đã thanh toán 1 phần") && <button onClick={() => setShowPayment(d)} className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 font-medium">+ Thanh toán</button>}
                    {d.trangThai !== "Đã thanh toán" && d.trangThai !== "Có khiếu nại" && !d.locked && <button onClick={() => setShowKhiieuNai(d)} className="text-[10px] px-2 py-1 rounded bg-rose-500/10 text-rose-700">KN</button>}
                    <div className="flex-1" />
                    <button onClick={() => setShowDetail(d)} className="text-[10px] px-2 py-1 rounded bg-white/30"><Eye className="w-3 h-3 inline" /></button>
                    {d.locked ? (
                      <button onClick={() => moKhoa(d.id, user)} className="text-[10px] px-2 py-1 rounded bg-violet-500/15 text-violet-700"><Unlock className="w-3 h-3 inline" /></button>
                    ) : (
                      <button onClick={() => setConfirmAction({ title: "Khóa", description: "Khóa bản ghi này?", variant: "warning", onConfirm: () => { khoa(d.id, user); toast.success("Đã khóa"); } })} className="text-[10px] px-2 py-1 rounded bg-violet-500/15 text-violet-700"><Lock className="w-3 h-3 inline" /></button>
                    )}
                  </div>
                }
              />
            );
          })
        )}
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          record={showPayment}
          onClose={() => setShowPayment(null)}
          onConfirm={(soTien) => {
            capNhatThanhToan(showPayment.id, soTien, user);
            toast.success(`Đã thanh toán +${soTien.toLocaleString()}đ`);
            setShowPayment(null);
          }}
        />
      )}

      {showKhiieuNai && (
        <KhiieuNaiModal
          record={showKhiieuNai}
          onClose={() => setShowKhiieuNai(null)}
          onConfirm={(noiDung) => {
            themKhiieuNai(showKhiieuNai.id, noiDung, user);
            toast.warning("Đã ghi nhận khiếu nại");
            setShowKhiieuNai(null);
          }}
        />
      )}

      {showDetail && <DetailModal record={showDetail} onClose={() => setShowDetail(null)} />}

      {confirmAction && (
        <ConfirmDialog
          open
          onClose={() => setConfirmAction(null)}
          onConfirm={() => { confirmAction.onConfirm(); setConfirmAction(null); }}
          title={confirmAction.title}
          description={confirmAction.description}
          variant={confirmAction.variant}
          confirmLabel="Xác nhận"
        />
      )}
    </div>
  );
}

// ============ Sub Components ============

function KPICard({ label, value, icon, color, highlight = false }: any) {
  const colorMap: Record<string, string> = {
    slate: "from-slate-500/10 to-slate-500/5 text-slate-700",
    emerald: "from-emerald-500/10 to-emerald-500/5 text-emerald-700",
    sky: "from-sky-500/10 to-sky-500/5 text-sky-700",
    amber: "from-amber-500/10 to-amber-500/5 text-amber-700",
    rose: "from-rose-500/10 to-rose-500/5 text-rose-700",
    violet: "from-violet-500/10 to-violet-500/5 text-violet-700",
  };
  return (
    <div className={`card p-3 bg-gradient-to-br ${colorMap[color]} ${highlight ? "ring-2 ring-amber-500/40" : ""}`}>
      <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="text-lg md:text-2xl font-bold tabular-nums truncate">{value}</div>
    </div>
  );
}

function PaymentModal({ record, onClose, onConfirm }: { record: BanGhiDoiSoat; onClose: () => void; onConfirm: (soTien: number) => void }) {
  const conNo = record.thucNhan - record.daThanhToan;
  const [soTien, setSoTien] = useState(conNo);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-500" />
          Thanh toán - {record.id}
        </h3>
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] opacity-70">Thực nhận</div>
              <div className="font-bold text-emerald-600">{formatVNDShort(record.thucNhan)}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Đã TT</div>
              <div className="font-bold text-sky-600">{formatVNDShort(record.daThanhToan)}</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Còn nợ</div>
              <div className="font-bold text-amber-600">{formatVNDShort(conNo)}</div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Số tiền thanh toán *</label>
            <input type="number" min={0} max={conNo} value={soTien || ""} onChange={(e) => setSoTien(Math.max(0, Math.min(conNo, parseInt(e.target.value) || 0)))} className="input w-full" />
            <input type="range" min={0} max={conNo} value={soTien} onChange={(e) => setSoTien(parseInt(e.target.value))} className="w-full mt-2" />
            <div className="flex gap-1.5 mt-2">
              <button type="button" onClick={() => setSoTien(Math.floor(conNo / 2))} className="text-[10px] px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20">50%</button>
              <button type="button" onClick={() => setSoTien(conNo)} className="text-[10px] px-2 py-1 rounded bg-slate-500/10 hover:bg-slate-500/20">100%</button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={() => onConfirm(soTien)} disabled={soTien <= 0} className="btn-primary text-sm bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50">
            Xác nhận thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}

function KhiieuNaiModal({ record, onClose, onConfirm }: { record: BanGhiDoiSoat; onClose: () => void; onConfirm: (noiDung: string) => void }) {
  const [noiDung, setNoiDung] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-md w-full p-5 animate-slide-up">
        <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-5 h-5" />
          Khiếu nại - {record.id}
        </h3>
        <p className="text-xs opacity-70 mb-3">NV: {record.nguoiThucHien} · {record.congDoan} · {formatVNDShort(record.thucNhan)}</p>
        <div>
          <label className="text-xs font-medium block mb-1">Nội dung khiếu nại *</label>
          <textarea value={noiDung} onChange={(e) => setNoiDung(e.target.value)} className="input w-full min-h-[100px]" placeholder="Mô tả chi tiết: thiếu hàng, sai SL, chất lượng..." />
        </div>
        <div className="flex gap-2 justify-end pt-3 mt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button onClick={onClose} className="btn-secondary text-sm">Huỷ</button>
          <button onClick={() => onConfirm(noiDung)} disabled={!noiDung.trim()} className="btn-primary text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-50">
            Gửi khiếu nại
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ record, onClose }: { record: BanGhiDoiSoat; onClose: () => void }) {
  const s = TRANG_THAI_STYLE[record.trangThai];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-500" />
            Chi tiết đối soát - {record.id}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/30"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3 mb-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <InfoItem label="Người thực hiện" value={record.nguoiThucHien} sub={record.nguoiThucHienMa} />
            <InfoItem label="Công đoạn" value={record.congDoan} />
            <InfoItem label="Mã SP" value={record.maSP} sub={record.phanLoai} />
            <InfoItem label="Ngày giao" value={<DateDisplay value={record.ngayGiao} />} />
          </div>

          <div className="card p-3 bg-emerald-500/5">
            <div className="text-xs font-semibold mb-2 opacity-70">Sản lượng & Tiền công</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-center">
              <div><div className="text-[10px] opacity-70">SL nhận</div><div className="font-bold">{record.soLuongNhan.toLocaleString()}</div></div>
              <div><div className="text-[10px] opacity-70">SL đạt</div><div className="font-bold text-emerald-600">{record.soLuongDat.toLocaleString()}</div></div>
              <div><div className="text-[10px] opacity-70">SL lỗi</div><div className="font-bold text-rose-600">{record.soLuongLoi.toLocaleString()}</div></div>
              <div><div className="text-[10px] opacity-70">Đơn giá</div><div className="font-bold">{record.donGia.toLocaleString()}</div></div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs text-center mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <div><div className="text-[10px] opacity-70">Thành tiền</div><div className="font-mono font-semibold">{formatVNDShort(record.thanhTien)}</div></div>
              <div><div className="text-[10px] opacity-70">Khấu trừ</div><div className="font-mono text-rose-600">-{formatVNDShort(record.khauTru)}</div></div>
              <div><div className="text-[10px] opacity-70">Thực nhận</div><div className="font-mono font-bold text-emerald-600">{formatVNDShort(record.thucNhan)}</div></div>
              <div><div className="text-[10px] opacity-70">Còn nợ</div><div className="font-mono text-amber-600">{formatVNDShort(record.conNo)}</div></div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold opacity-70 mb-1">Trạng thái</div>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.color}`}>
              {record.trangThai} {record.locked && <Lock className="w-3 h-3" />}
            </span>
          </div>

          {record.khiieuNai && (
            <div className="card p-3 bg-rose-500/5 border border-rose-500/20">
              <div className="text-xs font-semibold mb-1 text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Khiếu nại
              </div>
              <div className="text-sm whitespace-pre-line">{record.khiieuNai.noiDung}</div>
              <div className="text-[10px] opacity-60 mt-1">
                {record.khiieuNai.ngayKhiieuNai} · {record.khiieuNai.nguoiKhiieuNai} · {record.khiieuNai.trangThai}
              </div>
            </div>
          )}

          {record.lichSu && record.lichSu.length > 0 && (
            <div>
              <div className="text-xs font-semibold opacity-70 mb-2">Lịch sử ({record.lichSu.length})</div>
              <div className="space-y-1.5">
                {record.lichSu.map((l, i) => (
                  <div key={i} className="text-xs flex items-start gap-2 p-2 rounded bg-white/30">
                    <div className="text-[10px] opacity-60 shrink-0">{l.ngay.split("T")[0]}</div>
                    <div className="flex-1">
                      <div><span className="opacity-60">{l.trangThaiCu}</span> → <b>{l.trangThaiMoi}</b></div>
                      {l.ghiChu && <div className="opacity-70 italic">{l.ghiChu}</div>}
                      <div className="text-[10px] opacity-60">bởi {l.nguoiThucHien}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] opacity-70 uppercase tracking-wide">{label}</div>
      <div className="text-sm font-medium">{value}</div>
      {sub && <div className="text-[10px] opacity-60 font-mono">{sub}</div>}
    </div>
  );
}
