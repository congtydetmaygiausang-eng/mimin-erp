"use client";
import { useState, useEffect } from "react";
import { Box, Package, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { CONG_NHAN_13 } from "@/lib/congnhan-13";
import UpdateSLModal, { type UpdateSLPayload } from "@/components/UpdateSLModal";

const STORAGE_KEY = "polomimin_phieu_workflow_v1";
const DON_GIA = 800;

export default function UIDongGoiPage() {
  const [user, setUser] = useState<any>(null);
  const [tab, setTab] = useState<string>("nhan");
  const [phieuList, setPhieuList] = useState<any[]>([]);
  const [selectedPhieu, setSelectedPhieu] = useState<any>(null);

  useEffect(() => {
    const sess = typeof window !== "undefined" ? localStorage.getItem("mimin_erp_session") : null;
    if (sess) setUser(JSON.parse(sess));
    const data = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (data) try { setPhieuList(JSON.parse(data)); } catch {}
  }, []);

  const cnHienTai = CONG_NHAN_13.find((c) => c.email === user?.email) || CONG_NHAN_13.find((c) => c.maNV === "NV009")!;
  const dsDG = CONG_NHAN_13.filter((c) => c.module === "dong-goi");

  const phieuDG = phieuList.filter((p) => p.id?.startsWith("DG_"));
  const nhanHang = phieuDG.filter((p) => !p.soLuongDat);
  const dangLam = phieuDG.filter((p) => p.soLuongDat && p.soLuongDat < p.soLuongGiao);
  const hoanThanh = phieuDG.filter((p) => p.trangThai === "hoan-thanh");
  const tongDat = hoanThanh.reduce((s, p) => s + (p.soLuongDat || 0), 0);
  const tienCong = tongDat * DON_GIA;

  const handleSave = (payload: UpdateSLPayload) => {
    if (!selectedPhieu) return;
    const updated = phieuList.map((p) =>
      p.id === selectedPhieu.id
        ? { ...p, soLuongDat: payload.soLuongDat, soLuongLoi: payload.soLuongLoi, soLuongThieu: payload.soLuongThieu, ghiChu: payload.ghiChu, trangThai: payload.hoanThanh ? "hoan-thanh" : "dang-dg", ngayHoanThanh: payload.hoanThanh ? new Date().toISOString().split("T")[0] : p.ngayHoanThanh, nguoiNhan: cnHienTai?.maNV, tenNguoiNhan: cnHienTai?.name }
        : p
    );
    setPhieuList(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(`✅ ${selectedPhieu.maSP}: ${payload.soLuongDat} đạt / ${payload.soLuongLoi} lỗi`);
    setSelectedPhieu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50/30 to-purple-50/30 pb-20">
      <div className="sticky top-0 z-30 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 text-white shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl">📦</div>
            <div>
              <h1 className="text-base font-bold">Module Đóng gói</h1>
              <p className="text-[10px] opacity-90">{cnHienTai?.name} • {cnHienTai?.maNV} • {DON_GIA}đ/sp</p>
            </div>
          </div>
          <select value={cnHienTai?.maNV} onChange={(e) => {
            const cn = CONG_NHAN_13.find((c) => c.maNV === e.target.value);
            if (cn) { localStorage.setItem("mimin_erp_session", JSON.stringify({ id: cn.email, name: cn.name, email: cn.email, role: "sewing" })); setUser({ name: cn.name, email: cn.email }); toast.info(`Đã chuyển sang ${cn.name}`); }
          }} className="text-xs bg-white/20 backdrop-blur text-white border border-white/30 rounded-lg px-2 py-1">
            {dsDG.map((c) => <option key={c.maNV} value={c.maNV} className="text-slate-800">{c.name}</option>)}
          </select>
        </div>
        <div className="flex overflow-x-auto bg-white/10 backdrop-blur">
          {[["nhan","📥 Nhận",nhanHang.length],["dang","📦 Đang gấp",dangLam.length],["xong","✅ Xong",hoanThanh.length],["thongke","📊 Tiền",0]].map(([k,l,n]) => (
            <button key={k} onClick={() => setTab(k as string)} className={`flex-1 min-w-fit px-3 py-2.5 text-xs font-bold whitespace-nowrap ${tab===k?"bg-white text-violet-700":"text-white/80"}`}>{l} {(n as number) > 0 && <span className="ml-1 px-1.5 bg-white/30 text-[10px] rounded-full">{n}</span>}</button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-2">
        {tab === "nhan" && (nhanHang.length === 0 ? <Empty msg="Chưa có phiếu đóng gói" /> : nhanHang.map((p) => <Card key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} />))}
        {tab === "dang" && (dangLam.length === 0 ? <Empty msg="Chưa đóng gói cái nào" /> : dangLam.map((p) => <Card key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} badge="đang" />))}
        {tab === "xong" && (hoanThanh.length === 0 ? <Empty msg="Chưa hoàn thành" /> : hoanThanh.map((p) => <Card key={p.id} p={p} onUpdate={() => setSelectedPhieu(p)} badge="xong" />))}
        {tab === "thongke" && (
          <div className="card p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-violet-500" /> Tiền công 7 ngày</h3>
            <div className="text-center py-4">
              <div className="text-xs text-slate-500">Tổng tiền</div>
              <div className="text-3xl font-bold text-violet-600">{tienCong.toLocaleString()}đ</div>
              <div className="text-xs text-slate-400 mt-1">{tongDat} sp × {DON_GIA}đ</div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg px-2 py-2 flex gap-1.5 z-20">
        <BBtn icon={Package} l="Nhận" c="bg-violet-500" onClick={() => toast.info("Đã nhận")} />
        <BBtn icon={Box} l="Gấp" c="bg-fuchsia-500" onClick={() => toast.info("Đang gấp")} />
        <BBtn icon={CheckCircle2} l="Tem" c="bg-purple-500" onClick={() => toast.info("Đã dán tem")} />
        <BBtn icon={AlertTriangle} l="Lỗi" c="bg-rose-500" onClick={() => toast.warning("Báo lỗi")} />
        <BBtn icon={ArrowRight} l="Kho" c="bg-emerald-500" onClick={() => toast.success("Đã BG kho")} />
      </div>

      {selectedPhieu && <UpdateSLModal open={!!selectedPhieu} onClose={() => setSelectedPhieu(null)} onSave={handleSave} phieu={selectedPhieu} donGia={DON_GIA} moduleName="Cập nhật đóng gói" moduleColor="bg-gradient-to-r from-violet-500 to-purple-500" />}
    </div>
  );
}

function Card({ p, onUpdate, badge }: any) {
  return (
    <div className="card p-3 border-l-4 border-violet-500">
      <div className="flex justify-between mb-1"><div className="text-xs font-mono text-slate-500">{p.id}</div>
        {badge === "xong" && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full font-bold">✅ Xong</span>}
        {badge === "đang" && <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] rounded-full font-bold">📦 Đang gấp</span>}
      </div>
      <div className="font-bold text-sm">{p.maSP} - {p.phanLoai}</div>
      <div className="text-[11px] text-slate-600 mt-0.5">Màu {p.mau} • Size {p.size} • Giao {p.soLuongGiao} • Đạt <b className="text-emerald-600">{p.soLuongDat||0}</b></div>
      <button onClick={onUpdate} className="mt-2 w-full py-2 bg-violet-500 text-white text-xs font-bold rounded-lg">✏️ Cập nhật SL</button>
    </div>
  );
}
function Empty({ msg }: any) { return <div className="card p-6 text-center text-slate-400"><div className="text-3xl">📦</div><div className="text-sm font-semibold mt-2">{msg}</div></div>; }
function BBtn({ icon: I, l, c, onClick }: any) { return <button onClick={onClick} className={`flex-1 flex flex-col items-center py-1.5 ${c} text-white rounded-lg active:opacity-70`}><I className="w-4 h-4" /><span className="text-[10px] font-bold mt-0.5">{l}</span></button>; }
