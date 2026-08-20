"use client";
import { useState, useMemo } from "react";
import {
  Building2, Users, Factory, Store, Plus, Edit2, Trash2, Search,
  Phone, Mail, MapPin, DollarSign, Award, AlertCircle, X, FileText, TrendingUp,
  Truck, Package, ChevronRight, FileSpreadsheet, PhoneCall, CheckCircle2, Clock,
} from "lucide-react";
import { NCC_FULL, KH_SI_FULL, XUONG_GIA_CONG, MASTER_DATA_SUMMARY } from "@/lib/master-data-full";

type Tab = "ncc" | "kh" | "xuong";

export default function MasterDataPage() {
  const [tab, setTab] = useState<Tab>("ncc");
  const [search, setSearch] = useState("");
  const [filterLoai, setFilterLoai] = useState("");

  const fmtVND = (n: number) => n === 0 ? "0" : (n / 1_000_000).toFixed(1) + " tr";
  const fmtFull = (n: number) => n.toLocaleString("vi-VN") + " đ";

  // Filter
  const filteredNCC = useMemo(() => {
    return NCC_FULL.filter((n) => {
      if (search && !(`${n.maNCC} ${n.tenNCC} ${n.nguoiLH}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterLoai && n.loai !== filterLoai) return false;
      return true;
    });
  }, [search, filterLoai]);

  const filteredKH = useMemo(() => {
    return KH_SI_FULL.filter((k) => {
      if (search && !(`${k.maKH} ${k.tenKH} ${k.nguoiLH}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterLoai && k.loai !== filterLoai) return false;
      return true;
    });
  }, [search, filterLoai]);

  const filteredXuong = useMemo(() => {
    return XUONG_GIA_CONG.filter((x) => {
      if (search && !(`${x.maXuong} ${x.tenXuong} ${x.nguoiLH}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterLoai && x.loai !== filterLoai) return false;
      return true;
    });
  }, [search, filterLoai]);

  const loaiNCCSet = Array.from(new Set(NCC_FULL.map((n) => n.loai)));
  const loaiKHSet = Array.from(new Set(KH_SI_FULL.map((k) => k.loai)));
  const loaiXuongSet = Array.from(new Set(XUONG_GIA_CONG.map((x) => x.loai)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/30 p-3 md:p-5">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-700 text-white p-5 md:p-7 shadow-xl">
          <div className="text-xs font-medium opacity-90 mb-1">🏭 MIMIN OS · Bước 1 - Nhập liệu Master Data</div>
          <h1 className="text-2xl md:text-3xl font-bold">📋 Master Data - NCC + Xưởng + Khách hàng</h1>
          <p className="text-sm opacity-95 mt-1 max-w-3xl">
            Tổng hợp <b>{MASTER_DATA_SUMMARY.tongNCC} NCC</b> + <b>{MASTER_DATA_SUMMARY.tongKHSi} KH sỉ</b> + <b>{MASTER_DATA_SUMMARY.tongXuong} xưởng</b> + <b>{MASTER_DATA_SUMMARY.tongDoiTac} đối tác gia công</b> để chuẩn bị nhập liệu LSX.
          </p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{MASTER_DATA_SUMMARY.tongNCC}</div><div className="opacity-90">NCC</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{MASTER_DATA_SUMMARY.tongKHSi}</div><div className="opacity-90">KH sỉ</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{MASTER_DATA_SUMMARY.tongXuong}</div><div className="opacity-90">Xưởng</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{MASTER_DATA_SUMMARY.tongDoiTac}</div><div className="opacity-90">Đối tác GC</div></div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2"><div className="text-xl font-bold">{MASTER_DATA_SUMMARY.tongUser}</div><div className="opacity-90">User</div></div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/10 rounded p-2">
              <div className="opacity-90">Tổng công nợ KH</div>
              <div className="text-base font-bold text-amber-200">{fmtVND(MASTER_DATA_SUMMARY.tongCongNoKH)}</div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="opacity-90">Tổng công nợ NCC</div>
              <div className="text-base font-bold text-rose-200">{fmtVND(MASTER_DATA_SUMMARY.tongCongNoNCC)}</div>
            </div>
            <div className="bg-white/10 rounded p-2">
              <div className="opacity-90">Doanh số KH/năm</div>
              <div className="text-base font-bold text-emerald-200">{(MASTER_DATA_SUMMARY.tongDoanhSoKH / 1_000_000_000).toFixed(1)} tỷ</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "ncc" as Tab,   label: "🏭 Nhà cung cấp", count: MASTER_DATA_SUMMARY.tongNCC, color: "from-blue-500 to-indigo-500" },
            { id: "kh" as Tab,    label: "🤝 Khách hàng sỉ", count: MASTER_DATA_SUMMARY.tongKHSi, color: "from-emerald-500 to-teal-500" },
            { id: "xuong" as Tab, label: "🏗️ Xưởng gia công", count: MASTER_DATA_SUMMARY.tongXuong, color: "from-amber-500 to-orange-500" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFilterLoai(""); }}
              className={`card p-3 text-left transition ${tab === t.id ? `ring-2 ring-offset-2 ring-indigo-500 bg-gradient-to-br ${t.color} text-white` : "bg-white"}`}
            >
              <div className="font-bold text-base">{t.label}</div>
              <div className={`text-2xl font-bold ${tab === t.id ? "text-white" : "text-slate-700"}`}>{t.count}</div>
            </button>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="card p-3 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Tìm ${tab === "ncc" ? "NCC" : tab === "kh" ? "khách hàng" : "xưởng"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterLoai}
            onChange={(e) => setFilterLoai(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          >
            <option value="">-- Tất cả loại --</option>
            {tab === "ncc" && loaiNCCSet.map((l) => <option key={l} value={l}>{l}</option>)}
            {tab === "kh" && loaiKHSet.map((l) => <option key={l} value={l}>{l}</option>)}
            {tab === "xuong" && loaiXuongSet.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button className="text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Thêm mới
          </button>
        </div>

        {/* Content */}
        {tab === "ncc" && <NCCTab data={filteredNCC} fmtVND={fmtVND} fmtFull={fmtFull} />}
        {tab === "kh" && <KHTab data={filteredKH} fmtVND={fmtVND} fmtFull={fmtFull} />}
        {tab === "xuong" && <XuongTab data={filteredXuong} fmtVND={fmtVND} fmtFull={fmtFull} />}
      </div>
    </div>
  );
}

function NCCTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-2">
      {data.map((n: any) => (
        <div key={n.id} className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{n.maNCC}</span>
                <h3 className="font-bold text-sm">{n.tenNCC}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">{n.loai}</span>
                {n.congNo > 50_000_000 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">⚠️ Nợ nhiều</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {n.diaChi}</div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {n.sdt}</div>
                <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {n.email}</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1.5">👤 {n.nguoiLH} · MST: {n.mst || "—"}</div>
              {n.donGia && <div className="text-[10px] text-emerald-700 mt-1">💰 {n.donGia}</div>}
              <div className="text-[10px] text-slate-500 mt-1 italic">"{n.ghiChu}"</div>
            </div>
            <div className="text-right ml-3">
              <div className="text-[10px] text-slate-500">Công nợ</div>
              <div className={`text-base font-bold ${n.congNo > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtVND(n.congNo)}</div>
              <div className="flex gap-1 mt-2 justify-end">
                <button className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-600"><Edit2 className="w-3 h-3 inline" /></button>
                <button className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded"><Trash2 className="w-3 h-3 inline" /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function KHTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-2">
      {data.map((k: any) => (
        <div key={k.id} className="card p-4 border-l-4 border-emerald-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{k.maKH}</span>
                <h3 className="font-bold text-sm">{k.tenKH}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{k.loai}</span>
                {k.trangThai === "VIP" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 flex items-center gap-0.5"><Award className="w-3 h-3" />VIP</span>}
                {k.trangThai === "Mới" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Mới</span>}
                {k.congNoHT > k.hanMucNo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">⚠️ Vượt hạn mức</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {k.diaChi}</div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {k.sdt}</div>
                <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {k.email}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-[10px]">
                <div><span className="text-slate-500">👤 {k.nguoiLH}</span></div>
                <div><span className="text-slate-500">💳 {k.chinhSach}</span></div>
                <div><span className="text-slate-500">📦 SP chính: {k.spChinh}</span></div>
                <div><span className="text-slate-500">💵 Hạn mức: {fmtVND(k.hanMucNo)}</span></div>
              </div>
              {k.ghiChu && <div className="text-[10px] text-slate-500 mt-1.5 italic">"{k.ghiChu}"</div>}
            </div>
            <div className="text-right ml-3">
              <div className="text-[10px] text-slate-500">Công nợ HT</div>
              <div className={`text-base font-bold ${k.congNoHT > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtVND(k.congNoHT)}</div>
              <div className="text-[10px] text-slate-500 mt-2">DS năm</div>
              <div className="text-xs font-bold text-indigo-600">{fmtVND(k.doanhSoNam)}</div>
              <div className="flex gap-1 mt-2 justify-end">
                <button className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-600"><Edit2 className="w-3 h-3 inline" /></button>
                <button className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded"><Trash2 className="w-3 h-3 inline" /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function XuongTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-2">
      {data.map((x: any) => (
        <div key={x.id} className="card p-4 border-l-4 border-amber-500">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{x.maXuong}</span>
                <h3 className="font-bold text-sm">{x.tenXuong}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{x.loai}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {x.diaChi}</div>
                <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {x.sdt}</div>
                <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {x.email}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-[10px]">
                <div><span className="text-slate-500">👤 {x.nguoiLH}</span></div>
                <div><span className="text-slate-500">⚙️ CS: {x.congSuat}</span></div>
                <div><span className="text-emerald-700 font-semibold">💰 {x.donGiaTB.toLocaleString("vi-VN")} {x.donVi}</span></div>
              </div>
              {x.ghiChu && <div className="text-[10px] text-slate-500 mt-1.5 italic">"{x.ghiChu}"</div>}
            </div>
            <div className="text-right ml-3">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${x.trangThai === "Đang hợp tác" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{x.trangThai}</span>
              <div className="flex gap-1 mt-2 justify-end">
                <button className="text-[10px] px-2 py-1 bg-slate-100 rounded text-slate-600"><Edit2 className="w-3 h-3 inline" /></button>
                <button className="text-[10px] px-2 py-1 bg-rose-50 text-rose-600 rounded"><Trash2 className="w-3 h-3 inline" /></button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
