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
    <div className="space-y-5 animate-fade-in">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-2xl p-5 md:p-6 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-teal-500/10 border border-indigo-500/20 backdrop-blur-sm shadow-sm">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Dữ Liệu Nguồn Cốt Lõi · MIMIN OS
              </span>
              <span className="text-xs text-slate-500 font-medium">Khởi tạo kế hoạch & lệnh SX</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              Master Data - Nhà Cung Cấp, Khách Hàng & Xưởng
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Tổng hợp {MASTER_DATA_SUMMARY.tongNCC} NCC · {MASTER_DATA_SUMMARY.tongKHSi} KH sỉ · {MASTER_DATA_SUMMARY.tongXuong} xưởng nội bộ · {MASTER_DATA_SUMMARY.tongDoiTac} đối tác gia công outside
            </p>
          </div>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-700">Nhà cung cấp</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700">{MASTER_DATA_SUMMARY.tongNCC}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Vải & phụ liệu</div>
        </div>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">Khách hàng sỉ</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{MASTER_DATA_SUMMARY.tongKHSi}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Đại lý & đối tác</div>
        </div>

        <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">Xưởng sản xuất</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{MASTER_DATA_SUMMARY.tongXuong}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Xưởng may nội bộ</div>
        </div>

        <div className="rounded-xl border border-violet-200/80 bg-violet-50/40 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-violet-700">Đối tác gia công</span>
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-violet-700">{MASTER_DATA_SUMMARY.tongDoiTac}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Outside liên kết</div>
        </div>

        <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-teal-700">Tài khoản nhân sự</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700">{MASTER_DATA_SUMMARY.tongUser}</div>
          <div className="mt-1 text-xs text-slate-500 font-medium">Nhân sự nội bộ</div>
        </div>
      </div>

      {/* Financial Health Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50/40 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Tổng công nợ Khách Hàng</span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1 text-xl font-black text-amber-700">{fmtVND(MASTER_DATA_SUMMARY.tongCongNoKH)}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Tiền hàng khách cần thanh toán</div>
        </div>

        <div className="rounded-xl border border-rose-200/70 bg-gradient-to-r from-rose-50 to-red-50/40 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Tổng công nợ Nhà Cung Cấp</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-1 text-xl font-black text-rose-700">{fmtVND(MASTER_DATA_SUMMARY.tongCongNoNCC)}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Tiền nguyên phụ liệu còn nợ NCC</div>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50/40 p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Doanh số khách hàng / năm</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 text-xl font-black text-emerald-700">{(MASTER_DATA_SUMMARY.tongDoanhSoKH / 1_000_000_000).toFixed(1)} tỷ VNĐ</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Tổng giá trị đơn hàng thực hiện</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { id: "ncc" as Tab, label: "Nhà Cung Cấp", sub: "Vải chính, bo cổ, phụ liệu", count: MASTER_DATA_SUMMARY.tongNCC, icon: Building2, color: "text-blue-600", activeBg: "bg-blue-600 text-white" },
          { id: "kh" as Tab, label: "Khách Hàng Sỉ", sub: "Đại lý, chuỗi thời trang", count: MASTER_DATA_SUMMARY.tongKHSi, icon: Users, color: "text-emerald-600", activeBg: "bg-emerald-600 text-white" },
          { id: "xuong" as Tab, label: "Xưởng Sản Xuất", sub: "Xưởng may & liên kết", count: MASTER_DATA_SUMMARY.tongXuong, icon: Factory, color: "text-amber-600", activeBg: "bg-amber-600 text-white" },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFilterLoai(""); }}
              className={`p-4 rounded-xl text-left transition border ${
                active
                  ? `${t.activeBg} border-transparent shadow-md scale-[1.01]`
                  : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-5 h-5 ${active ? "text-white" : t.color}`} />
                  <span className="font-bold text-sm">{t.label}</span>
                </div>
                <span className={`text-xl font-black ${active ? "text-white" : "text-slate-800"}`}>{t.count}</span>
              </div>
              <div className={`text-xs mt-1 ${active ? "text-white/80" : "text-slate-500"}`}>{t.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Search + Filter */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Tìm theo tên, mã, người liên hệ của ${tab === "ncc" ? "NCC" : tab === "kh" ? "khách hàng" : "xưởng"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={filterLoai}
          onChange={(e) => setFilterLoai(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
        >
          <option value="">-- Tất cả phân loại --</option>
          {tab === "ncc" && loaiNCCSet.map((l) => <option key={l} value={l}>{l}</option>)}
          {tab === "kh" && loaiKHSet.map((l) => <option key={l} value={l}>{l}</option>)}
          {tab === "xuong" && loaiXuongSet.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {/* Content */}
      {tab === "ncc" && <NCCTab data={filteredNCC} fmtVND={fmtVND} fmtFull={fmtFull} />}
      {tab === "kh" && <KHTab data={filteredKH} fmtVND={fmtVND} fmtFull={fmtFull} />}
      {tab === "xuong" && <XuongTab data={filteredXuong} fmtVND={fmtVND} fmtFull={fmtFull} />}
    </div>
  );
}

function NCCTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          Không tìm thấy nhà cung cấp nào phù hợp
        </div>
      ) : (
        data.map((n: any) => (
          <div key={n.id} className="rounded-xl border border-slate-200/80 border-l-4 border-l-blue-500 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/60">{n.maNCC}</span>
                  <h3 className="font-bold text-sm text-slate-900">{n.tenNCC}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">{n.loai}</span>
                  {n.congNo > 50_000_000 && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">⚠️ Dư nợ cao</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{n.diaChi}</span></div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <a href={`tel:${n.sdt}`} className="hover:underline font-semibold text-slate-700">{n.sdt}</a>
                  </div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{n.email}</span></div>
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 pt-1">
                  <span>👤 Người LH: <b className="text-slate-700">{n.nguoiLH}</b></span>
                  <span>MST: <b className="text-slate-700 font-mono">{n.mst || "—"}</b></span>
                  {n.donGia && <span className="text-emerald-700 font-semibold">💰 Đơn giá: {n.donGia}</span>}
                </div>
                {n.ghiChu && <div className="text-[11px] text-slate-400 italic pt-0.5">"{n.ghiChu}"</div>}
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Dư nợ NCC</div>
                  <div className={`text-base font-black ${n.congNo > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtVND(n.congNo)}</div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Sửa
                  </button>
                  <button className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Xoá
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function KHTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          Không tìm thấy khách hàng nào phù hợp
        </div>
      ) : (
        data.map((k: any) => (
          <div key={k.id} className="rounded-xl border border-slate-200/80 border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200/60">{k.maKH}</span>
                  <h3 className="font-bold text-sm text-slate-900">{k.tenKH}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">{k.loai}</span>
                  {k.trangThai === "VIP" && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5"><Award className="w-3 h-3" />VIP</span>}
                  {k.trangThai === "Mới" && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700">Mới</span>}
                  {k.congNoHT > k.hanMucNo && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-700">⚠️ Vượt hạn mức</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{k.diaChi}</span></div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <a href={`tel:${k.sdt}`} className="hover:underline font-semibold text-slate-700">{k.sdt}</a>
                  </div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{k.email}</span></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-xs text-slate-500">
                  <div>👤 Đại diện: <b className="text-slate-700">{k.nguoiLH}</b></div>
                  <div>💳 CS: <b className="text-slate-700">{k.chinhSach}</b></div>
                  <div>📦 SP chính: <b className="text-slate-700">{k.spChinh}</b></div>
                  <div>💵 Hạn mức: <b className="text-slate-700">{fmtVND(k.hanMucNo)}</b></div>
                </div>
                {k.ghiChu && <div className="text-[11px] text-slate-400 italic pt-0.5">"{k.ghiChu}"</div>}
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Công nợ hiện tại</div>
                  <div className={`text-base font-black ${k.congNoHT > 0 ? "text-rose-600" : "text-emerald-600"}`}>{fmtVND(k.congNoHT)}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Doanh số năm: <b className="text-indigo-600">{fmtVND(k.doanhSoNam)}</b></div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <button className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Sửa
                  </button>
                  <button className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Xoá
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function XuongTab({ data, fmtVND, fmtFull }: any) {
  return (
    <div className="space-y-3">
      {data.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm">
          Không tìm thấy xưởng nào phù hợp
        </div>
      ) : (
        data.map((x: any) => (
          <div key={x.id} className="rounded-xl border border-slate-200/80 border-l-4 border-l-amber-500 bg-white p-4 shadow-sm hover:shadow-md transition">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200/60">{x.maXuong}</span>
                  <h3 className="font-bold text-sm text-slate-900">{x.tenXuong}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">{x.loai}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{x.diaChi}</span></div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <a href={`tel:${x.sdt}`} className="hover:underline font-semibold text-slate-700">{x.sdt}</a>
                  </div>
                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" /> <span className="line-clamp-1">{x.email}</span></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1 text-xs text-slate-500">
                  <div>👤 Quản lý xưởng: <b className="text-slate-700">{x.nguoiLH}</b></div>
                  <div>⚙️ Công suất: <b className="text-slate-700">{x.congSuat}</b></div>
                  <div>💰 Đơn giá TB: <b className="text-emerald-700 font-bold">{x.donGiaTB.toLocaleString("vi-VN")} {x.donVi}</b></div>
                </div>
                {x.ghiChu && <div className="text-[11px] text-slate-400 italic pt-0.5">"{x.ghiChu}"</div>}
              </div>
              <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-start w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${x.trangThai === "Đang hợp tác" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  <CheckCircle2 className="w-3 h-3" /> {x.trangThai}
                </span>
                <div className="flex gap-1.5 mt-2">
                  <button className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Edit2 className="w-3 h-3" /> Sửa
                  </button>
                  <button className="text-xs px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg font-medium transition flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Xoá
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
