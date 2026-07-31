"use client";
import { useState, useEffect } from "react";
import { Scissors, Package, AlertTriangle, ArrowRight, CheckCircle2, Camera, Clock, FileText, ChevronRight, User, Ruler, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CONG_NHAN_13, type ModuleSX } from "@/lib/congnhan-13";
import UpdateSLModal, { type UpdateSLPayload } from "@/components/UpdateSLModal";
import Link from "next/link";

type Tab = "can-lam" | "dang-lam" | "hoan-thanh" | "loi" | "thong-ke";

const STORAGE_KEY = "polomimin_phieu_workflow_v1";

export default function UICatPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("can-lam");
  const [phieuList, setPhieuList] = useState<any[]>([]);
  const [selectedPhieu, setSelectedPhieu] = useState<any>(null);

  useEffect(() => {
    const sess = typeof window !== "undefined" ? localStorage.getItem("mimin_erp_session") : null;
    if (sess) setUser(JSON.parse(sess));
    // Load phiếu từ localStorage
    const data = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (data) {
      try { setPhieuList(JSON.parse(data)); } catch {}
    }
  }, []);

  const cnHienTai = CONG_NHAN_13.find((c) => c.email === user?.email) || CONG_NHAN_13.find((c) => c.maNV === "NV006")!;
  const dsCat = CONG_NHAN_13.filter((c) => c.module === "cat");

  // Lọc phiếu theo khâu Cắt (CAT_)
  const phieuCat = phieuList.filter((p) => p.id?.startsWith("CAT_"));
  const canLam = phieuCat.filter((p) => !p.soLuongDat && p.trangThai !== "hoan-thanh");
  const dangLam = phieuCat.filter((p) => p.soLuongDat && p.soLuongDat < p.soLuongGiao && p.trangThai !== "hoan-thanh");
  const hoanThanh = phieuCat.filter((p) => p.trangThai === "hoan-thanh" || p.soLuongDat === p.soLuongGiao);
  const coLoi = phieuCat.filter((p) => p.soLuongLoi && p.soLuongLoi > 0);

  // Tính thống kê
  const tongDat = hoanThanh.reduce((s, p) => s + (p.soLuongDat || 0), 0);
  const tongLoi = coLoi.reduce((s, p) => s + (p.soLuongLoi || 0), 0);
  const donGiaCat = 1200;
  const tienCong = tongDat * donGiaCat;
  const phatLoi = Math.round(tongLoi * donGiaCat * 0.3);

  const handleSaveSL = (payload: UpdateSLPayload) => {
    if (!selectedPhieu) return;
    const updated = phieuList.map((p) =>
      p.id === selectedPhieu.id
        ? {
            ...p,
            soLuongDat: payload.soLuongDat,
            soLuongLoi: payload.soLuongLoi,
            soLuongThieu: payload.soLuongThieu,
            ghiChu: payload.ghiChu,
            trangThai: payload.hoanThanh ? "hoan-thanh" : "dang-cat",
            ngayHoanThanh: payload.hoanThanh ? new Date().toISOString().split("T")[0] : p.ngayHoanThanh,
            nguoiNhan: cnHienTai?.maNV,
            tenNguoiNhan: cnHienTai?.name,
          }
        : p
    );
    setPhieuList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`✅ Đã cập nhật ${selectedPhieu.maSP}: ${payload.soLuongDat} đạt / ${payload.soLuongLoi} lỗi`);
    setSelectedPhieu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50/30 to-blue-50/30 pb-20">
      {/* Header sticky */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl">✂️</div>
            <div>
              <h1 className="text-base font-bold">Module Cắt</h1>
              <p className="text-[10px] opacity-90">{cnHienTai?.name} • {cnHienTai?.maNV}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={cnHienTai?.maNV}
              onChange={(e) => {
                const cn = CONG_NHAN_13.find((c) => c.maNV === e.target.value);
                if (cn) {
                  localStorage.setItem("mimin_erp_session", JSON.stringify({ id: cn.email, name: cn.name, email: cn.email, role: "sewing" }));
                  setUser({ name: cn.name, email: cn.email });
                  toast.info(`Đã chuyển sang ${cn.name}`);
                }
              }}
              className="text-xs bg-white/20 backdrop-blur text-white border border-white/30 rounded-lg px-2 py-1"
            >
              {dsCat.map((c) => <option key={c.maNV} value={c.maNV} className="text-slate-800">{c.name}</option>)}
            </select>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex overflow-x-auto bg-white/10 backdrop-blur">
          {([
            ["can-lam", "📋 Cần làm", canLam.length],
            ["dang-lam", "✂️ Đang cắt", dangLam.length],
            ["hoan-thanh", "✅ Hoàn thành", hoanThanh.length],
            ["loi", "⚠️ Lỗi", coLoi.length],
            ["thong-ke", "📊 Thống kê", 0],
          ] as [Tab, string, number][]).map(([k, label, n]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 min-w-fit px-3 py-2.5 text-xs font-bold whitespace-nowrap transition ${
                tab === k ? "bg-white text-sky-700" : "text-white/80"
              }`}
            >
              {label} {n > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/30 text-[10px]">{n}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        {tab === "can-lam" && (
          canLam.length === 0 ? (
            <EmptyState msg="Không có lệnh cắt nào" sub="Có thể bạn cần seed data trước" />
          ) : canLam.map((p) => <PhieuCard key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} />)
        )}
        {tab === "dang-lam" && (
          dangLam.length === 0 ? <EmptyState msg="Chưa có phiếu đang cắt" /> :
          dangLam.map((p) => <PhieuCard key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} statusBadge="dang-cat" />)
        )}
        {tab === "hoan-thanh" && (
          hoanThanh.length === 0 ? <EmptyState msg="Chưa hoàn thành phiếu nào" /> :
          hoanThanh.map((p) => <PhieuCard key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} statusBadge="hoan-thanh" />)
        )}
        {tab === "loi" && (
          coLoi.length === 0 ? <EmptyState msg="Không có lỗi 🎉" /> :
          coLoi.map((p) => <PhieuCard key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} statusBadge="loi" />)
        )}
        {tab === "thong-ke" && (
          <div className="space-y-2">
            <div className="card p-4">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-sky-500" /> Thống kê 7 ngày</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="SP đạt" value={tongDat} color="emerald" />
                <Stat label="SP lỗi" value={tongLoi} color="rose" />
                <Stat label="Tiền công" value={`${tienCong.toLocaleString()}đ`} color="sky" />
                <Stat label="Phạt lỗi" value={`${phatLoi.toLocaleString()}đ`} color="amber" />
              </div>
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-slate-500">Thực nhận</div>
                <div className="text-2xl font-bold text-sky-700">{(tienCong - phatLoi).toLocaleString()}đ</div>
              </div>
            </div>
            <Link href="/seed-data/" className="card p-3 bg-amber-50 border border-amber-200 text-xs text-amber-700 flex items-center gap-2">
              <Package className="w-4 h-4" /> Chưa có data? Click để seed 95 records test
            </Link>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-2 py-2 flex gap-1.5 z-20">
        <BottomBtn icon={Package} label="Nhận" color="bg-sky-500" onClick={() => toast.info("Đã nhận việc")} />
        <BottomBtn icon={Ruler} label="Trải" color="bg-cyan-500" onClick={() => toast.info("Đã trải vải")} />
        <BottomBtn icon={Scissors} label="Cắt" color="bg-blue-500" onClick={() => toast.info("Đang cắt...")} />
        <BottomBtn icon={AlertTriangle} label="Lỗi" color="bg-rose-500" onClick={() => toast.warning("Báo lỗi")} />
        <BottomBtn icon={ArrowRight} label="BG" color="bg-emerald-500" onClick={() => toast.success("Đã bàn giao")} />
      </div>

      {/* Modal update SL */}
      {selectedPhieu && (
        <UpdateSLModal
          open={!!selectedPhieu}
          onClose={() => setSelectedPhieu(null)}
          onSave={handleSaveSL}
          phieu={selectedPhieu}
          donGia={donGiaCat}
          moduleName="Cập nhật cắt"
          moduleColor="bg-gradient-to-r from-sky-500 to-cyan-500"
        />
      )}
    </div>
  );
}

function PhieuCard({ p, onUpdate, statusBadge }: { p: any; onUpdate: () => void; statusBadge?: string }) {
  return (
    <div className="card p-3 border-l-4 border-sky-500">
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-xs font-mono text-slate-500">{p.id}</div>
          <div className="font-bold text-sm">{p.maSP} - {p.phanLoai}</div>
        </div>
        {statusBadge === "hoan-thanh" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">✅ Xong</span>}
        {statusBadge === "dang-cat" && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">✂️ Đang cắt</span>}
        {statusBadge === "loi" && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] rounded-full font-bold">⚠️ Lỗi {p.soLuongLoi}</span>}
      </div>
      <div className="text-[11px] text-slate-600 space-y-0.5">
        <div>Màu: <b>{p.mau}</b> | Size: <b>{p.size}</b></div>
        <div>SL giao: <b>{p.soLuongGiao}</b> | Đạt: <b className="text-emerald-600">{p.soLuongDat || 0}</b> | Lỗi: <b className="text-rose-600">{p.soLuongLoi || 0}</b></div>
        <div>Hạn: <b className="text-amber-600">{p.hanHoanThanh}</b></div>
      </div>
      <button onClick={onUpdate} className="mt-2 w-full py-2 bg-sky-500 text-white text-xs font-bold rounded-lg">
        ✏️ Cập nhật SL
      </button>
    </div>
  );
}

function EmptyState({ msg, sub }: { msg: string; sub?: string }) {
  return (
    <div className="card p-6 text-center text-slate-400">
      <div className="text-4xl mb-2">📋</div>
      <div className="text-sm font-semibold">{msg}</div>
      {sub && <div className="text-xs mt-1">{sub}</div>}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <div className={`bg-${color}-50 p-2 rounded-lg`}>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className={`text-lg font-bold text-${color}-600`}>{value}</div>
    </div>
  );
}

function BottomBtn({ icon: Icon, label, color, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex-1 flex flex-col items-center py-1.5 ${color} text-white rounded-lg active:opacity-70`}>
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold mt-0.5">{label}</span>
    </button>
  );
}
