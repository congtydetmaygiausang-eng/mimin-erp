"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Factory, Plus, Trash2, Save, Edit, Package, Truck, Palette, Boxes,
  ChevronRight, Bell, X, AlertCircle, DollarSign, Calculator, FileText,
  Eye, Sparkles, ArrowRight, GitBranch, Users, Search, Filter,
  TrendingDown, BarChart3, ClipboardCheck, Lock, Phone, MapPin, Mail,
  CheckCircle2, ArrowDownToLine, ArrowUpFromLine, CreditCard, History,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import {
  nhapKhoSoi_V2, taoLenhDet, nghiemThuDet_V2, taoMeNhuom,
  nghiemThuMau_V2, nhapKhoVaiTP, getAllPhieuNhapSoi, getAllLenhDet,
  getAllMeNhuom, getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type NghiemThuMau, type LoVaiTP,
} from "@/lib/yarn-production-chain";
import {
  getAllNCC, getAllXuong, getNCCByLoai, getXuongByLoai, getNCCById, getXuongById,
  upsertNCC, deleteNCC, upsertXuong, deleteXuong,
  themCongNo, thanhToanCongNo, baoCaoCongNoByDoiTuong, getAllCongNo,
  type NhaCungCap, type XuongGiaCong, type CongNoEntry, type BaoCaoCongNo,
} from "@/lib/master-data";
import { truyNguocLo } from "@/lib/yarn-production-chain";
import ColorPicker from "@/components/ColorPicker";

type Tab = "dashboard" | "master" | "lenhtong" | "flow" | "congno" | "baocao";

export default function SanXuatERPPage() {
  const { user } = useSession();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* Mobile-first header */}
      <div className="card p-3 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-rose-500/10 sticky top-0 z-10 backdrop-blur">
        <h1 className="text-lg md:text-2xl font-bold flex items-center gap-2">
          <Factory className="w-5 h-5 md:w-7 md:h-7 text-blue-500" />
          Sản Xuất ERP - Sợi · Dệt · Nhuộm
        </h1>
        <p className="opacity-70 text-xs">Module tổng hợp · Mobile/Tablet chuẩn app</p>
      </div>

      {/* Bottom tab bar (mobile app style) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="grid grid-cols-6 max-w-3xl mx-auto">
          {[
            { key: "dashboard", label: "Tổng", icon: BarChart3, color: "blue" },
            { key: "master", label: "Danh bạ", icon: Users, color: "slate" },
            { key: "lenhtong", label: "Lệnh", icon: Plus, color: "emerald" },
            { key: "flow", label: "Quy trình", icon: GitBranch, color: "violet" },
            { key: "congno", label: "Công nợ", icon: CreditCard, color: "rose" },
            { key: "baocao", label: "Báo cáo", icon: FileText, color: "amber" },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as Tab)}
                className={`flex flex-col items-center py-2 px-1 ${
                  isActive ? `text-${t.color}-600` : "opacity-50"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "" : ""}`} />
                <span className="text-[10px] font-semibold mt-0.5">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active screen */}
      <div className="pt-2">
        {tab === "dashboard" && <Dashboard user={user} />}
        {tab === "master" && <MasterData />}
        {tab === "lenhtong" && <LenhTongForm user={user} />}
        {tab === "flow" && <FlowQuick user={user} />}
        {tab === "congno" && <CongNoView />}
        {tab === "baocao" && <BaoCaoView />}
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function Dashboard({ user }: any) {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());
  const [congNos, setCongNos] = useState(baoCaoCongNoByDoiTuong());

  const refresh = () => {
    setPnss(getAllPhieuNhapSoi());
    setLds(getAllLenhDet());
    setMns(getAllMeNhuom());
    setLtps(getAllLoVaiTP());
    setCongNos(baoCaoCongNoByDoiTuong());
  };

  const tongNhapSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongCongNo = congNos.reduce((s, c) => s + c.tongConNo, 0);

  return (
    <div className="space-y-3 p-3">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat n={pnss.length} label="Phiếu nhập sợi" sub={`${(tongNhapSoi / 1_000_000).toFixed(0)}tr`} color="blue" icon={Package} />
        <Stat n={lds.length} label="Lệnh dệt" sub={`${lds.filter((l) => l.trangThai !== "Hoàn thành").length} đang chạy`} color="violet" icon={Truck} />
        <Stat n={mns.length} label="Mẻ nhuộm" sub={`${mns.filter((m) => m.trangThai !== "Hoàn thành").length} đang nhuộm`} color="rose" icon={Palette} />
        <Stat n={ltps.length} label="Lô vải TP" sub={`${ltps.reduce((s, l) => s + l.tongKg, 0).toFixed(0)}kg`} color="emerald" icon={Boxes} />
      </div>

      {/* Công nợ tổng */}
      <div className="card p-3 bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-2 border-rose-300">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-rose-600" /> Tổng công nợ phải trả
          </h3>
          <span className="text-2xl font-bold text-rose-600">
            {(tongCongNo / 1_000_000).toFixed(1)}tr
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {congNos.slice(0, 3).map((c) => (
            <div key={c.doiTuongId} className="p-2 rounded bg-white dark:bg-slate-800">
              <div className="opacity-60 truncate">{c.tenDoiTuong}</div>
              <div className="font-bold text-rose-600">{(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow ngắn */}
      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-blue-500" /> Luồng sản xuất
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
          {[
            { l: "1.Sợi", c: "blue" },
            { l: "2.Dệt", c: "violet" },
            { l: "3.Mộc", c: "purple" },
            { l: "4.Nhuộm", c: "rose" },
            { l: "5.Màu", c: "pink" },
            { l: "6.TP", c: "emerald" },
            { l: "7.QC", c: "amber" },
          ].map((s, i) => (
            <div key={i} className={`p-1 rounded bg-${s.c}-500/20 text-${s.c}-700 font-semibold`}>
              {s.l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label, sub, color, icon: Icon }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    violet: "from-violet-500/10 to-purple-500/10 text-violet-700",
    rose: "from-rose-500/10 to-pink-500/10 text-rose-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] opacity-60">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1">{n}</div>
      <div className="text-[10px] opacity-60">{sub}</div>
    </div>
  );
}

// ============ MASTER DATA ============
function MasterData() {
  const [subTab, setSubTab] = useState<"ncc" | "xuong">("ncc");
  const [nccs, setNccs] = useState(getAllNCC());
  const [xuongs, setXuongs] = useState(getAllXuong());
  const [editing, setEditing] = useState<NhaCungCap | XuongGiaCong | null>(null);

  const refresh = () => {
    setNccs(getAllNCC());
    setXuongs(getAllXuong());
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-1">
        <button onClick={() => setSubTab("ncc")} className={`flex-1 py-2 rounded text-sm font-semibold ${
          subTab === "ncc" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"
        }`}>
          🏭 NCC ({nccs.length})
        </button>
        <button onClick={() => setSubTab("xuong")} className={`flex-1 py-2 rounded text-sm font-semibold ${
          subTab === "xuong" ? "bg-violet-500 text-white" : "bg-slate-100 dark:bg-slate-800"
        }`}>
          🏗️ Xưởng ({xuongs.length})
        </button>
      </div>

      {subTab === "ncc" ? (
        <NCCList nccs={nccs} onEdit={setEditing} onRefresh={refresh} />
      ) : (
        <XuongList xuongs={xuongs} onEdit={setEditing} onRefresh={refresh} />
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          {"tenNCC" in editing ? (
            <NCCForm ncc={editing as NhaCungCap} onClose={() => setEditing(null)} onSave={() => { refresh(); setEditing(null); }} />
          ) : (
            <XuongForm xuong={editing as XuongGiaCong} onClose={() => setEditing(null)} onSave={() => { refresh(); setEditing(null); }} />
          )}
        </Modal>
      )}
    </div>
  );
}

function NCCList({ nccs, onEdit, onRefresh }: any) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onEdit({ id: `NCC-${Date.now().toString().slice(-3)}`, maNCC: "", tenNCC: "", loai: "sợi",
          diaChi: "", sdt: "", email: "", maSoThue: "", nguoiLienHe: "", ghiChu: "",
          ngayTao: new Date().toISOString().slice(0, 10), trangThai: "Đang hợp tác" })}
        className="btn-primary w-full bg-blue-500"
      >
        <Plus className="w-4 h-4 inline" /> Thêm NCC mới
      </button>
      {nccs.map((n: NhaCungCap) => (
        <div key={n.id} className="card p-3 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-sm">{n.tenNCC}</div>
              <div className="text-[10px] font-mono opacity-60">{n.maNCC}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(n)} className="text-xs p-1.5 rounded bg-blue-500 text-white">
                <Edit className="w-3 h-3" />
              </button>
              <button onClick={() => {
                if (confirm(`Xóa ${n.tenNCC}?`)) { deleteNCC(n.id); onRefresh(); toast.success("Đã xóa"); }
              }} className="text-xs p-1.5 rounded bg-rose-500 text-white">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-[10px] opacity-70 space-y-0.5">
            <div className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {n.sdt}</div>
            <div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {n.diaChi}</div>
            <div className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {n.email}</div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">{n.trangThai}</span>
            <span className="text-[10px] opacity-60">{n.loai}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function XuongList({ xuongs, onEdit, onRefresh }: any) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onEdit({ id: `XGC-${Date.now().toString().slice(-3)}`, maXuong: "", tenXuong: "",
          loai: "dệt", diaChi: "", sdt: "", email: "", maSoThue: "", nguoiLienHe: "",
          nangLuc: "", chatLuongTB: "Tốt", ghiChu: "",
          ngayTao: new Date().toISOString().slice(0, 10), trangThai: "Đang hợp tác" })}
        className="btn-primary w-full bg-violet-500"
      >
        <Plus className="w-4 h-4 inline" /> Thêm xưởng mới
      </button>
      {xuongs.map((x: XuongGiaCong) => (
        <div key={x.id} className="card p-3 bg-violet-50 dark:bg-violet-900/20">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-sm">{x.tenXuong}</div>
              <div className="text-[10px] font-mono opacity-60">{x.maXuong}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(x)} className="text-xs p-1.5 rounded bg-violet-500 text-white">
                <Edit className="w-3 h-3" />
              </button>
              <button onClick={() => {
                if (confirm(`Xóa ${x.tenXuong}?`)) { deleteXuong(x.id); onRefresh(); toast.success("Đã xóa"); }
              }} className="text-xs p-1.5 rounded bg-rose-500 text-white">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-[10px] opacity-70 space-y-0.5">
            <div className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {x.sdt}</div>
            <div>📍 {x.diaChi}</div>
            <div>🏭 Năng lực: {x.nangLuc} · Chất lượng: {x.chatLuongTB}</div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">{x.trangThai}</span>
            <span className="text-[10px] opacity-60 capitalize">{x.loai}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NCCForm({ ncc, onClose, onSave }: any) {
  const [data, setData] = useState(ncc);
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{ncc.tenNCC ? "Sửa" : "Thêm"} NCC</h3>
      <div className="grid grid-cols-2 gap-2">
        <F label="Mã NCC" v={data.maNCC} on={(v: any) => setData({ ...data, maNCC: v })} />
        <F label="Tên NCC" v={data.tenNCC} on={(v: any) => setData({ ...data, tenNCC: v })} />
        <F label="SĐT" v={data.sdt} on={(v: any) => setData({ ...data, sdt: v })} />
        <F label="Email" v={data.email} on={(v: any) => setData({ ...data, email: v })} />
        <F label="MST" v={data.maSoThue} on={(v: any) => setData({ ...data, maSoThue: v })} />
        <F label="Người LH" v={data.nguoiLienHe} on={(v: any) => setData({ ...data, nguoiLienHe: v })} />
        <F label="Địa chỉ" v={data.diaChi} on={(v: any) => setData({ ...data, diaChi: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Loại</label>
          <select value={data.loai} onChange={(e) => setData({ ...data, loai: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option value="sợi">Sợi</option>
            <option value="phụ liệu">Phụ liệu</option>
            <option value="hóa chất">Hóa chất</option>
          </select>
        </div>
        <F label="Ghi chú" v={data.ghiChu} on={(v: any) => setData({ ...data, ghiChu: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Trạng thái</label>
          <select value={data.trangThai} onChange={(e) => setData({ ...data, trangThai: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option>Đang hợp tác</option>
            <option>Tạm dừng</option>
            <option>Ngừng hợp tác</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={() => { upsertNCC(data); onSave(); toast.success("Đã lưu"); }} className="btn-primary flex-1 bg-blue-500">💾 Lưu</button>
      </div>
    </div>
  );
}

function XuongForm({ xuong, onClose, onSave }: any) {
  const [data, setData] = useState(xuong);
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{xuong.tenXuong ? "Sửa" : "Thêm"} xưởng</h3>
      <div className="grid grid-cols-2 gap-2">
        <F label="Mã xưởng" v={data.maXuong} on={(v: any) => setData({ ...data, maXuong: v })} />
        <F label="Tên xưởng" v={data.tenXuong} on={(v: any) => setData({ ...data, tenXuong: v })} />
        <F label="SĐT" v={data.sdt} on={(v: any) => setData({ ...data, sdt: v })} />
        <F label="Email" v={data.email} on={(v: any) => setData({ ...data, email: v })} />
        <F label="MST" v={data.maSoThue} on={(v: any) => setData({ ...data, maSoThue: v })} />
        <F label="Người LH" v={data.nguoiLienHe} on={(v: any) => setData({ ...data, nguoiLienHe: v })} />
        <F label="Địa chỉ" v={data.diaChi} on={(v: any) => setData({ ...data, diaChi: v })} />
        <F label="Năng lực" v={data.nangLuc} on={(v: any) => setData({ ...data, nangLuc: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Loại</label>
          <select value={data.loai} onChange={(e) => setData({ ...data, loai: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option value="dệt">Dệt</option>
            <option value="nhuộm">Nhuộm</option>
            <option value="hoàn thiện">Hoàn thiện</option>
            <option value="may">May</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">CL TB</label>
          <select value={data.chatLuongTB} onChange={(e) => setData({ ...data, chatLuongTB: e.target.value })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option>Tốt</option>
            <option>Khá</option>
            <option>Trung bình</option>
          </select>
        </div>
        <F label="Ghi chú" v={data.ghiChu} on={(v: any) => setData({ ...data, ghiChu: v })} />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={() => { upsertXuong(data); onSave(); toast.success("Đã lưu"); }} className="btn-primary flex-1 bg-violet-500">💾 Lưu</button>
      </div>
    </div>
  );
}

// ============ LỆNH TỔNG FORM ============
function LenhTongForm({ user }: any) {
  const nccs = getNCCByLoai("sợi");
  const dsXuongDet = getXuongByLoai("dệt");
  const dsXuongNhuom = getXuongByLoai("nhuộm");

  const [nccId, setNccId] = useState(nccs[0]?.id || "");
  const [loaiSoi, setLoaiSoi] = useState("Cotton 32s");
  const [maLoSoi, setMaLoSoi] = useState("LSOI-001");
  const [soKgSoi, setSoKgSoi] = useState(1000);
  const [donGiaSoi, setDonGiaSoi] = useState(130000);

  const [xuongDetId, setXuongDetId] = useState(dsXuongDet[0]?.id || "");
  const [donGiaDet, setDonGiaDet] = useState(8000);

  const [xuongNhuomId, setXuongNhuomId] = useState(dsXuongNhuom[0]?.id || "");
  const [danhSachMau, setDanhSachMau] = useState([
    { mau: "Đen", soKg: 200, donGiaNhuom: 15000, chiPhiHoaChat: 1200000 },
    { mau: "Trắng", soKg: 150, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 },
  ]);

  const [kho, setKho] = useState("Kho Vải TP");
  const [khu, setKhu] = useState("Khu A");
  const [ke, setKe] = useState("A03");

  const chiSoi = soKgSoi * donGiaSoi;
  const chiDet = soKgSoi * donGiaDet;
  const chiNhuom = danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0);
  const chiHoaChat = danhSachMau.reduce((s, m) => s + m.chiPhiHoaChat, 0);
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat;

  const ncc = getNCCById(nccId);
  const xDet = getXuongById(xuongDetId);
  const xNhuom = getXuongById(xuongNhuomId);

  const handleTao = () => {
    if (!ncc || !xDet || !xNhuom) {
      toast.error("Vui lòng chọn NCC và xưởng");
      return;
    }
    // 1. Nhập sợi
    const r1 = nhapKhoSoi_V2({
      ngayNhap: new Date().toISOString().slice(0, 10),
      nccId: ncc.id, tenNCC: ncc.tenNCC,
      loaiSoi: `SOI-${loaiSoi.replace(/\s/g, "")}`,
      tenSoi: `Sợi ${loaiSoi}`, maLoSoi, soKg: soKgSoi, donGia: donGiaSoi,
      daThanhToan: 0, khoNhap: "Kho Sợi",
      nguoiPhuTrach: user?.name || "Admin", ghiChu: "", khoa: false,
    } as any, user);

    if (r1.ok) {
      // 2. Tạo công nợ NCC
      themCongNo({
        ngayPhatSinh: new Date().toISOString().slice(0, 10),
        doiTuongId: ncc.id, tenDoiTuong: ncc.tenNCC,
        loai: "NCC sợi", maPhieuGoc: r1.phieu?.id || "",
        moTa: `Nhập ${soKgSoi}kg ${loaiSoi} từ ${ncc.tenNCC}`,
        phatSinh: chiSoi, thanhToan: 0,
      });
    }

    // 3. Tạo lệnh dệt
    if (r1.ok) {
      const r2 = taoLenhDet({
        ngayGiao: new Date().toISOString().slice(0, 10),
        ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
        xuongDet: xDet.tenXuong, maLoSoi, loaiSoi,
        soKgGiao: soKgSoi, donGiaDet, tienDuKien: soKgSoi * donGiaDet, soMetDuKien: soKgSoi * 4,
        nguoiPhuTrach: user?.name || "Admin", ghiChu: "",
      }, user);

      if (r2.ok) {
        themCongNo({
          ngayPhatSinh: new Date().toISOString().slice(0, 10),
          doiTuongId: xDet.id, tenDoiTuong: xDet.tenXuong,
          loai: "Xưởng dệt", maPhieuGoc: r2.lenh?.id || "",
          moTa: `Dệt ${soKgSoi}kg sợi → ${xDet.tenXuong}`,
          phatSinh: chiDet, thanhToan: 0,
        });
      }

      // 4. Tạo mẻ nhuộm
      if (danhSachMau.length > 0) {
        const r3 = taoMeNhuom({
          ngayGiao: new Date().toISOString().slice(0, 10),
          ngayDuKienNhan: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
          xuongNhuom: xNhuom.tenXuong,
          maLoMoc: `LM-${r2.lenh?.id}`,
          danhSachMau: danhSachMau.map((m) => ({ mau: m.mau, soKg: m.soKg, donGiaNhuom: m.donGiaNhuom })),
          nguoiPhuTrach: user?.name || "Admin",
          ghiChu: "",
        }, user);

        if (r3.ok) {
          themCongNo({
            ngayPhatSinh: new Date().toISOString().slice(0, 10),
            doiTuongId: xNhuom.id, tenDoiTuong: xNhuom.tenXuong,
            loai: "Xưởng nhuộm", maPhieuGoc: r3.me?.id || "",
            moTa: `Nhuộm ${danhSachMau.length} màu → ${xNhuom.tenXuong}`,
            phatSinh: chiNhuom + chiHoaChat, thanhToan: 0,
          });
        }
      }
    }

    toast.success(`✅ Tạo lệnh tổng thành công! Tổng: ${tongCong.toLocaleString()}đ | 3 công nợ đã tạo`);
  };

  return (
    <div className="space-y-3 p-3">
      {/* Bước 1: Sợi */}
      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300">
        <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
          SỢI + NCC
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs font-semibold opacity-70">Nhà cung cấp sợi</label>
            <select value={nccId} onChange={(e) => setNccId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
              {nccs.map((n) => <option key={n.id} value={n.id}>{n.tenNCC} ({n.maNCC})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Loại sợi" v={loaiSoi} on={setLoaiSoi} />
            <F label="Mã lô" v={maLoSoi} on={setMaLoSoi} />
            <F label="Số kg" v={soKgSoi} on={setSoKgSoi} type="number" />
            <F label="Đơn giá (đ/kg)" v={donGiaSoi} on={setDonGiaSoi} type="number" />
          </div>
        </div>
      </div>

      {/* Bước 2: Dệt */}
      <div className="card p-3 bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300">
        <h3 className="font-bold text-violet-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
          DỆT - GIA CÔNG
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng dệt</label>
          <select value={xuongDetId} onChange={(e) => setXuongDetId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
            {dsXuongDet.map((x) => <option key={x.id} value={x.id}>{x.tenXuong} ({x.maXuong})</option>)}
          </select>
        </div>
        <F label="Đơn giá dệt (đ/kg)" v={donGiaDet} on={setDonGiaDet} type="number" />
      </div>

      {/* Bước 3: Nhuộm */}
      <div className="card p-3 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300">
        <h3 className="font-bold text-rose-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">3</span>
          NHUỘM
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng nhuộm</label>
          <select value={xuongNhuomId} onChange={(e) => setXuongNhuomId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
            {dsXuongNhuom.map((x) => <option key={x.id} value={x.id}>{x.tenXuong} ({x.maXuong})</option>)}
          </select>
        </div>
        <div className="text-[10px] font-semibold opacity-70 mt-2 mb-1">Danh sách màu nhuộm:</div>
        {danhSachMau.map((m, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 mb-1 text-xs">
            <input value={m.mau} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, mau: e.target.value }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border" />
            <input type="number" value={m.soKg} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, soKg: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-2 px-2 py-1 rounded border text-right" />
            <input type="number" value={m.donGiaNhuom} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, donGiaNhuom: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border text-right" />
            <input type="number" value={m.chiPhiHoaChat} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, chiPhiHoaChat: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border text-right" />
            <button onClick={() => setDanhSachMau(danhSachMau.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-600 p-1">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={() => setDanhSachMau([...danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 }])} className="text-xs text-blue-600 mt-1">
          <Plus className="w-3 h-3 inline" /> Thêm màu
        </button>
      </div>

      {/* Bước 4: Kho TP */}
      <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300">
        <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">4</span>
          KHO VẢI TP
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <F label="Kho" v={kho} on={setKho} />
          <F label="Khu" v={khu} on={setKhu} />
          <F label="Kệ" v={ke} on={setKe} />
        </div>
      </div>

      {/* Tổng kết */}
      <div className="card p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Card label="Chi sợi" v={chiSoi} c="blue" sub={ncc?.tenNCC} />
          <Card label="Chi dệt" v={chiDet} c="violet" sub={xDet?.tenXuong} />
          <Card label="Chi nhuộm" v={chiNhuom + chiHoaChat} c="rose" sub={xNhuom?.tenXuong} />
          <Card label="Tổng" v={tongCong} c="amber" />
        </div>
        <div className="mt-2 text-center text-2xl font-bold text-amber-600">
          {tongCong.toLocaleString()}đ
        </div>
      </div>

      <button onClick={handleTao} className="btn-primary w-full py-3 bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500 text-base">
        <Sparkles className="w-4 h-4 inline" /> TẠO LỆNH + 3 CÔNG NỢ
      </button>
    </div>
  );
}

function Card({ label, v, c, sub }: { label: string; v: number; c: string; sub?: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    violet: "bg-violet-100 dark:bg-violet-900/30 text-violet-700",
    rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-700",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-700",
  };
  return (
    <div className={`p-2 rounded ${colors[c]}`}>
      <div className="text-[10px] opacity-70">{label}</div>
      <div className="text-base font-bold">{(v / 1_000_000).toFixed(1)}tr</div>
      {sub && <div className="text-[9px] opacity-60 truncate">{sub}</div>}
    </div>
  );
}

// ============ FLOW QUICK ============
function FlowQuick({ user }: any) {
  const [step, setStep] = useState<"khosoi" | "lenhdet" | "nghiemthumoc" | "menhuom" | "nghiemthumau" | "khotp">("khosoi");

  return (
    <div className="space-y-3 p-3">
      <div className="card p-3">
        <h3 className="font-bold text-sm mb-2">⚡ Truy cập nhanh theo vai</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: "khosoi", l: "Kho sợi", i: Package, c: "blue", sub: "Nhập/Xuất" },
            { k: "lenhdet", l: "Xưởng dệt", i: Truck, c: "violet", sub: "Tạo lệnh" },
            { k: "nghiemthumoc", l: "NT mộc", i: CheckCircle2, c: "purple", sub: "Nghiệm thu" },
            { k: "menhuom", l: "Xưởng nhuộm", i: Palette, c: "rose", sub: "Mẻ nhuộm" },
            { k: "nghiemthumau", l: "NT màu", i: CheckCircle2, c: "pink", sub: "Từng màu" },
            { k: "khotp", l: "Kho TP", i: Boxes, c: "emerald", sub: "Nhập kho" },
          ].map((s) => {
            const Icon = s.i;
            return (
              <button
                key={s.k}
                onClick={() => setStep(s.k as any)}
                className={`p-3 rounded-lg border-2 ${
                  step === s.k ? `border-${s.c}-500 bg-${s.c}-500/10` : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 text-${s.c}-600 mx-auto mb-1`} />
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-[10px] opacity-60">{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {step === "khosoi" && <KhoSoiStep />}
      {step === "lenhdet" && <LenhDetStep user={user} />}
      {step === "nghiemthumoc" && <NghiemThuMocStep user={user} />}
      {step === "menhuom" && <MeNhuomStep user={user} />}
      {step === "nghiemthumau" && <NghiemThuMauStep user={user} />}
      {step === "khotp" && <KhoTPStep user={user} />}
    </div>
  );
}

function KhoSoiStep() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]")); }, []);
  return (
    <div className="card p-3 bg-blue-50 dark:bg-blue-900/20">
      <h3 className="font-bold text-blue-700 mb-2">📦 Kho sợi ({list.length} lô)</h3>
      {list.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô sợi nào. Tạo lệnh tổng trước.</p>
      ) : (
        list.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="font-mono font-bold">{l.maLoSoi}</span>
              <span>{l.soKgConLai}/{l.soKgBanDau}kg</span>
            </div>
            <div className="opacity-70">{l.tenSoi}</div>
          </div>
        ))
      )}
    </div>
  );
}

function LenhDetStep({ user }: any) {
  const [lds, setLds] = useState(getAllLenhDet());
  return (
    <div className="card p-3 bg-violet-50 dark:bg-violet-900/20">
      <h3 className="font-bold text-violet-700 mb-2">🚛 Lệnh dệt ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{l.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500 text-white">{l.trangThai}</span>
          </div>
          <div className="opacity-70">{l.xuongDet} - {l.soKgGiao}kg</div>
        </div>
      ))}
    </div>
  );
}

function NghiemThuMocStep({ user }: any) {
  const [lds, setLds] = useState(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy"));
  return (
    <div className="card p-3 bg-purple-50 dark:bg-purple-900/20">
      <h3 className="font-bold text-purple-700 mb-2">✅ NT mộc ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{l.id}</div>
          <div className="opacity-70">Giao {l.soKgGiao}kg - {l.xuongDet}</div>
          <button
            onClick={() => {
              const kg = parseInt(prompt(`Kg mộc nhận cho ${l.id}:`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
              if (kg > 0) {
                const r = nghiemThuDet_V2(l.id, {
                  soKgMocNhan: kg, soCayMoc: Math.floor(kg / 20), soKgLoi: 0,
                  chiPhiPhatSinh: 0, daThanhToan: 0,
                  khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                }, user);
                if (r.ok) { toast.success(r.message); setLds(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy")); }
              }
            }}
            className="text-xs w-full mt-1 py-1 rounded bg-purple-500 text-white"
          >
            ✅ NT mộc
          </button>
        </div>
      ))}
    </div>
  );
}

function MeNhuomStep({ user }: any) {
  const [mns, setMns] = useState(getAllMeNhuom());
  return (
    <div className="card p-3 bg-rose-50 dark:bg-rose-900/20">
      <h3 className="font-bold text-rose-700 mb-2">🎨 Mẻ nhuộm ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{m.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white">{m.trangThai}</span>
          </div>
          <div className="opacity-70">{m.xuongNhuom} - {m.tongKgXuat}kg - {m.danhSachMau.length} màu</div>
        </div>
      ))}
    </div>
  );
}

function NghiemThuMauStep({ user }: any) {
  const [mns, setMns] = useState(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành"));
  return (
    <div className="card p-3 bg-pink-50 dark:bg-pink-900/20">
      <h3 className="font-bold text-pink-700 mb-2">🎨 NT màu ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{m.id}</div>
          {m.danhSachMau.map((x) => (
            <div key={x.mau} className="mt-1 flex items-center justify-between">
              <span><strong>{x.mau}</strong> - {x.soKg}kg</span>
              <button
                onClick={() => {
                  const kg = parseInt(prompt(`Kg màu nhận cho ${x.mau}:`, String(Math.floor(x.soKg * 0.95))) || "0");
                  if (kg > 0) {
                    const r = nghiemThuMau_V2(m.id, [{
                      mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: kg,
                      soCayNhan: Math.floor(kg / 20), soKgLoi: 0, donGiaNhuom: x.donGiaNhuom,
                      chiPhiHoaChat: 200000, chiPhiHoanThien: 100000, chiPhiPhatSinh: 0, daThanhToan: 0,
                    }], user?.name || "system", user);
                    if (r.ok) { toast.success(r.message); setMns(getAllMeNhuom().filter((x) => x.trangThai !== "Hoàn thành")); }
                  }
                }}
                className="text-[10px] px-2 py-0.5 rounded bg-pink-500 text-white"
              >
                NT {x.mau}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function KhoTPStep({ user }: any) {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);
  return (
    <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20">
      <h3 className="font-bold text-emerald-700 mb-2">📦 Kho vải TP ({ltps.length})</h3>
      {ltps.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô vải TP</p>
      ) : (
        ltps.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{l.maLo}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-emerald-500">{l.mau}</span>
            </div>
            <div className="opacity-70">{l.tongKg.toFixed(0)}kg · {l.giaVonPerKg.toFixed(0)}đ/kg · {l.khu}/{l.ke}</div>
          </div>
        ))
      )}
    </div>
  );
}

// ============ CÔNG NỢ ============
function CongNoView() {
  const [list, setList] = useState(baoCaoCongNoByDoiTuong());
  const [selected, setSelected] = useState<BaoCaoCongNo | null>(null);

  const refresh = () => setList(baoCaoCongNoByDoiTuong());

  return (
    <div className="space-y-3 p-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-rose-500" /> Công nợ gia công
      </h2>

      {selected ? (
        <div className="space-y-2">
          <button onClick={() => setSelected(null)} className="text-sm text-blue-600">← Quay lại</button>
          <div className="card p-3 bg-rose-50 dark:bg-rose-900/20">
            <div className="font-bold">{selected.tenDoiTuong}</div>
            <div className="text-[10px] opacity-60">{selected.doiTuongId} · {selected.loai}</div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <Card label="Phát sinh" v={selected.tongPhatSinh} c="blue" />
              <Card label="Đã trả" v={selected.tongThanhToan} c="emerald" />
              <Card label="Còn nợ" v={selected.tongConNo} c="rose" />
            </div>
          </div>
          <h3 className="font-semibold text-sm mt-3">📋 Chi tiết phiếu ({selected.chiTiet.length})</h3>
          {selected.chiTiet.map((c) => (
            <div key={c.id} className="card p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-mono font-bold">{c.maPhieuGoc}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                  c.trangThai === "Đã trả" ? "bg-emerald-500" :
                  c.trangThai === "Đã trả một phần" ? "bg-amber-500" : "bg-rose-500"
                }`}>
                  {c.trangThai}
                </span>
              </div>
              <div className="opacity-70 text-[10px]">{c.moTa}</div>
              <div className="mt-1 grid grid-cols-3 gap-1 text-[10px]">
                <div>PS: <strong>{c.phatSinh.toLocaleString()}</strong></div>
                <div>TT: <strong>{c.thanhToan.toLocaleString()}</strong></div>
                <div>Nợ: <strong className="text-rose-600">{c.conNo.toLocaleString()}</strong></div>
              </div>
              {c.conNo > 0 && (
                <button
                  onClick={() => {
                    const tien = parseInt(prompt(`Thanh toán cho ${c.maPhieuGoc} (còn nợ ${c.conNo.toLocaleString()}đ):`, String(c.conNo)) || "0");
                    if (tien > 0) {
                      const r = thanhToanCongNo(c.id, tien);
                      if (r.ok) { toast.success(r.message); refresh(); setSelected(baoCaoCongNoByDoiTuong().find((x) => x.doiTuongId === selected.doiTuongId) || null); }
                      else toast.error(r.message);
                    }
                  }}
                  className="btn-primary text-xs w-full mt-2 bg-emerald-500"
                >
                  💰 Thanh toán
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.length === 0 ? (
            <p className="text-center text-sm opacity-60 py-8">Chưa có công nợ. Tạo lệnh tổng trước.</p>
          ) : list.map((c) => (
            <div key={c.doiTuongId} onClick={() => setSelected(c)} className="card p-3 cursor-pointer hover:scale-[1.02] transition">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="font-bold text-sm">{c.tenDoiTuong}</div>
                  <div className="text-[10px] opacity-60">{c.loai} · {c.soPhieu} phiếu</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-rose-600">{(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
                  <div className="text-[10px] opacity-60">còn nợ</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 text-[10px] mt-2">
                <div>PS: {(c.tongPhatSinh / 1_000_000).toFixed(1)}tr</div>
                <div>TT: {(c.tongThanhToan / 1_000_000).toFixed(1)}tr</div>
                <div className="text-rose-600">Nợ: {(c.tongConNo / 1_000_000).toFixed(1)}tr</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ BÁO CÁO ============
function BaoCaoView() {
  const [pnss, setPnss] = useState(getAllPhieuNhapSoi());
  const [lds, setLds] = useState(getAllLenhDet());
  const [mns, setMns] = useState(getAllMeNhuom());
  const [ltps, setLtps] = useState(getAllLoVaiTP());

  const tongSoi = pnss.reduce((s, p) => s + p.thanhTien, 0);
  const tongKgTP = ltps.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = ltps.reduce((s, l) => s + l.tongGiaTri, 0);
  const giaVonTB = tongKgTP > 0 ? tongGiaTriTP / tongKgTP : 0;

  const avgHaoHutDet = lds.filter((l) => l.haoHutPt !== undefined).reduce((s, l) => s + (l.haoHutPt || 0), 0) / Math.max(lds.filter((l) => l.haoHutPt !== undefined).length, 1);

  return (
    <div className="space-y-3 p-3">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <FileText className="w-5 h-5 text-amber-500" /> Báo cáo tổng hợp
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Hao hụt dệt" value={`${avgHaoHutDet.toFixed(1)}%`} color={avgHaoHutDet <= 4 ? "emerald" : avgHaoHutDet <= 10 ? "amber" : "rose"} icon={TrendingDown} />
        <KPICard label="Giá vốn TB" value={`${giaVonTB.toFixed(0)}đ`} color="blue" icon={DollarSign} />
        <KPICard label="Tổng vải TP" value={`${tongKgTP.toFixed(0)}kg`} color="emerald" icon={Boxes} />
        <KPICard label="Giá trị TP" value={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} color="amber" icon={Calculator} />
      </div>

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📊 Thống kê</h3>
        <div className="space-y-1 text-xs">
          <Row label="Phiếu nhập sợi" value={`${pnss.length} phiếu`} sub={`${(tongSoi / 1_000_000).toFixed(0)}tr`} />
          <Row label="Lệnh dệt" value={`${lds.length} lệnh`} sub={`${lds.filter((l) => l.trangThai === "Hoàn thành").length} hoàn thành`} />
          <Row label="Mẻ nhuộm" value={`${mns.length} mẻ`} sub={`${mns.reduce((s, m) => s + m.danhSachMau.length, 0)} màu`} />
          <Row label="Lô vải TP" value={`${ltps.length} lô`} sub={`${(tongGiaTriTP / 1_000_000).toFixed(1)}tr`} />
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, color, icon: Icon }: any) {
  const colors: Record<string, string> = {
    blue: "from-blue-500/10 to-cyan-500/10 text-blue-700",
    emerald: "from-emerald-500/10 to-green-500/10 text-emerald-700",
    amber: "from-amber-500/10 to-yellow-500/10 text-amber-700",
    rose: "from-rose-500/10 to-red-500/10 text-rose-700",
  };
  return (
    <div className={`card p-2 bg-gradient-to-br ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-4 h-4 opacity-60" />
        <span className="text-[10px] opacity-70">{label}</span>
      </div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value, sub }: any) {
  return (
    <div className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/50">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <strong>{value}</strong>
        <span className="text-[10px] opacity-60">{sub}</span>
      </span>
    </div>
  );
}

function F({ label, v, on, type = "text" }: any) {
  return (
    <div>
      <label className="text-[10px] font-semibold opacity-70">{label}</label>
      <input
        type={type}
        value={v ?? ""}
        onChange={(e: any) => on(type === "number" ? (e.target.value === "" ? 0 : Number(e.target.value)) : e.target.value)}
        className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm"
      />
    </div>
  );
}

function Modal({ children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl md:rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-2xl">
        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="p-1"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
