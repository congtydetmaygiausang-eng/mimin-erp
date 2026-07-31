"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  FileText,
  Star,
  AlertCircle,
  TrendingUp,
  DollarSign,
  History,
  Award,
  CheckCircle2,
  ShoppingCart,
  Hash,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { NCCS, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { useKho } from "@/lib/data/kho-store";

type NCC = {
  stt: number;
  ten: string;
  vaiTro: string;
  sdt: string;
  mail: string;
  diaChi: string;
  congNo: number;
  donGia?: string;
  maSoThue?: string;
  ghiChu?: string;
  rating?: number;
  avatar?: string;
};

// Khởi tạo NCC data + thêm rating + MST
const NCC_KHOI_DAU: NCC[] = NCCS.map((n, i) => ({
  ...n,
  sdt: `090${(1000000 + i * 12345).toString().slice(0, 7)}`,
  mail: `ncc${i + 1}@${n.ten.toLowerCase().split(" ")[0] || "vendor"}.vn`,
  diaChi: i % 2 === 0 ? "Quận 12, TP.HCM" : "Hóc Môn, TP.HCM",
  maSoThue: `0312${String(456789 + i * 13).slice(0, 6)}`,
  ghiChu: i % 3 === 0 ? "Giao hàng đúng hẹn, chất lượng ổn định" : i % 3 === 1 ? "Hợp tác từ 2020" : "Cần theo dõi thêm",
  rating: 4 + (i % 2) * 0.5,
}));

export default function NhaCungCapPage() {
  const [list, setList] = useState<NCC[]>(NCC_KHOI_DAU);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "co_no" | "bo_co" | "det" | "nhuom" | "khac">("all");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; ncc?: NCC } | null>(null);
  const [showHistory, setShowHistory] = useState<NCC | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  // Lấy lịch sử mua từ giao dịch kho
  const { giaoDich } = useKho();

  // KPIs
  const tongCongNo = list.reduce((s, x) => s + x.congNo, 0);
  const dsCongNo = list.filter((x) => x.congNo > 0);
  const nccBoCo = list.filter((x) => x.vaiTro.includes("Bo cổ"));
  const nccNhuom = list.filter((x) => x.vaiTro.includes("Nhuộm"));
  const nccDet = list.filter((x) => x.vaiTro.includes("Dệt") || x.vaiTro.includes("sợi"));

  // Lịch sử mua theo từng NCC
  const lichSuMua = useMemo(() => {
    const map: Record<string, { gd: typeof giaoDich; tongTien: number; tongNhap: number }> = {};
    for (const ncc of list) {
      const dsGD = giaoDich.filter((g) => g.loai === "NHAP" && g.nguonNhap === ncc.ten);
      map[ncc.ten] = {
        gd: dsGD,
        tongTien: dsGD.reduce((s, g) => s + g.thanhTien, 0),
        tongNhap: dsGD.length,
      };
    }
    return map;
  }, [giaoDich, list]);

  const filtered = list.filter((x) => {
    const matchSearch = [x.ten, x.vaiTro, x.sdt, x.mail, x.diaChi].some((y) => (y || "").toLowerCase().includes(search.toLowerCase()));
    let matchFilter = true;
    if (filter === "co_no") matchFilter = x.congNo > 0;
    else if (filter === "bo_co") matchFilter = x.vaiTro.includes("Bo cổ");
    else if (filter === "det") matchFilter = x.vaiTro.includes("Dệt") || x.vaiTro.includes("sợi");
    else if (filter === "nhuom") matchFilter = x.vaiTro.includes("Nhuộm");
    else if (filter === "khac") matchFilter = !x.vaiTro.includes("Bo cổ") && !x.vaiTro.includes("Nhuộm") && !x.vaiTro.includes("Dệt") && !x.vaiTro.includes("sợi");
    return matchSearch && matchFilter;
  });

  const handleSave = (ncc: NCC) => {
    if (showForm?.mode === "add") {
      setList([...list, ncc]);
      toast.success(`Đã thêm NCC: ${ncc.ten}`);
    } else if (showForm?.mode === "edit") {
      setList(list.map((x) => (x.stt === ncc.stt ? ncc : x)));
      toast.success(`Đã cập nhật: ${ncc.ten}`);
    }
    setShowForm(null);
  };

  const handleDelete = (ncc: NCC) => {
    if (confirm(`Xoá NCC "${ncc.ten}"?`)) {
      setList(list.filter((x) => x.stt !== ncc.stt));
      toast.success(`Đã xoá: ${ncc.ten}`);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-7 h-7 text-brand-500" />
            Nhà cung cấp
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {list.length} NCC · Tổng công nợ <b className="text-red-600">{formatVNDShort(tongCongNo)}</b>
            {dsCongNo.length > 0 && <> · <b className="text-amber-600">{dsCongNo.length} NCC đang nợ</b></>}
          </p>
        </div>
        <button onClick={() => setShowForm({ mode: "add" })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm NCC
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Building2 className="w-3 h-3" /> Tổng NCC</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{list.length}</div>
          <div className="text-xs opacity-60 mt-1">đối tác</div>
        </div>
        <div className={`card p-5 ${tongCongNo > 0 ? "bg-red-500/10 border-red-500/40" : ""}`}>
          <div className="text-xs opacity-70 flex items-center gap-1"><DollarSign className="w-3 h-3 text-red-600" /> Tổng công nợ</div>
          <div className={`text-2xl md:text-3xl font-bold mt-1 ${tongCongNo > 0 ? "text-red-600" : ""}`}>{formatVNDShort(tongCongNo)}</div>
          <div className="text-xs opacity-60 mt-1">{dsCongNo.length} NCC đang nợ</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Award className="w-3 h-3 text-emerald-600" /> NCC dệt</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{nccDet.length}</div>
          <div className="text-xs opacity-60 mt-1">cung cấp vải</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> NCC Bo cổ</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-violet-600">{nccBoCo.length}</div>
          <div className="text-xs opacity-60 mt-1">phụ liệu</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {([
              { id: "all", label: `Tất cả (${list.length})` },
              { id: "co_no", label: `Có nợ (${dsCongNo.length})`, danger: dsCongNo.length > 0 },
              { id: "det", label: `Dệt (${nccDet.length})` },
              { id: "nhuom", label: `Nhuộm (${nccNhuom.length})` },
              { id: "bo_co", label: `Bo cổ (${nccBoCo.length})` },
              { id: "khac", label: "Khác" },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filter === f.id
                    ? f.danger ? "bg-red-500 text-white" : "bg-brand-500 text-white"
                    : f.danger ? "bg-red-500/10 text-red-700 hover:bg-red-500/20" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <DataViewToggle onChange={setViewMode} />
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm tên, SĐT, email, vai trò…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table / Card View */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">STT</th>
                  <th className="p-3">Tên NCC</th>
                  <th className="p-3">Vai trò</th>
                  <th className="p-3">SĐT</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Đánh giá</th>
                  <th className="p-3 text-right">Công nợ</th>
                  <th className="p-3 text-right">Đã mua</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => {
                  const ls = lichSuMua[n.ten] || { gd: [], tongTien: 0, tongNhap: 0 };
                  return (
                    <tr key={n.stt} className={`border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5 ${n.congNo > 0 ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-mono text-xs opacity-70">#{n.stt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={n.ten} size="sm" />
                          <div>
                            <div className="font-medium">{n.ten}</div>
                            <div className="text-[10px] opacity-60 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {n.diaChi?.slice(0, 25)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 text-[10px]">{n.vaiTro}</span>
                      </td>
                      <td className="p-3 text-xs">
                        <a href={`tel:${n.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          <Phone className="w-3 h-3" /> {n.sdt}
                        </a>
                      </td>
                      <td className="p-3 text-xs">
                        <a href={`mailto:${n.mail}`} className="flex items-center gap-1 text-sky-600 hover:underline">
                          <Mail className="w-3 h-3" /> {n.mail?.slice(0, 18)}
                        </a>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= (n.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                          ))}
                          <span className="text-[10px] opacity-60 ml-1">({n.rating})</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {n.congNo > 0 ? <span className="text-red-600">{formatVNDShort(n.congNo)}</span> : <span className="text-emerald-600">✓</span>}
                      </td>
                      <td className="p-3 text-right text-xs">
                        <div className="font-semibold">{formatVNDShort(ls.tongTien)}</div>
                        <div className="text-[10px] opacity-60">{ls.tongNhap} giao dịch</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowHistory(n)} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 hover:bg-brand-500/25" title="Lịch sử mua">
                            <History className="w-3 h-3" />
                          </button>
                          <button onClick={() => setShowForm({ mode: "edit", ncc: n })} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25" title="Sửa">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(n)} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25" title="Xoá">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "card" && (
        <EntityCardGrid cols={3}>
          {filtered.map((n) => {
            const ls = lichSuMua[n.ten] || { gd: [], tongTien: 0, tongNhap: 0 };
            return (
              <EntityCard
                key={n.stt}
                name={n.ten}
                avatarSize="xl"
                rating={n.rating}
                highlight={(n.rating || 0) >= 4.5}
                warning={n.congNo > 0}
                badges={[{ label: n.vaiTro, bg: "bg-violet-500/15", color: "text-violet-700" }]}
                subtitle={<span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {n.diaChi?.slice(0, 30)}</span>}
                status={n.congNo > 0 ? { label: `Còn nợ ${formatVNDShort(n.congNo)}`, color: "text-red-700", bg: "bg-red-500/15" } : { label: "Không nợ", color: "text-emerald-700", bg: "bg-emerald-500/15" }}
                stats={[
                  { label: "SĐT", value: n.sdt, icon: Phone },
                  { label: "MST", value: n.maSoThue || "—", icon: Hash },
                  { label: "Đã mua", value: formatVNDShort(ls.tongTien), color: "text-emerald-600" },
                  { label: "Số GD", value: `${ls.tongNhap} lần`, icon: ShoppingCart },
                ]}
                onView={() => setShowHistory(n)}
                onEdit={() => setShowForm({ mode: "edit", ncc: n })}
                onDelete={() => handleDelete(n)}
                meta={`#${n.stt} · ${n.ghiChu?.slice(0, 50) || ""}`}
              />
            );
          })}
        </EntityCardGrid>
      )}

      {viewMode === "list" && (
        <EntityCardList>
          {filtered.map((n) => {
            const ls = lichSuMua[n.ten] || { gd: [], tongTien: 0, tongNhap: 0 };
            return (
              <div key={n.stt} className={`card p-3 flex items-center gap-3 ${n.congNo > 0 ? "ring-1 ring-red-500/30 bg-red-500/5" : ""}`}>
                <Avatar name={n.ten} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{n.ten}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 text-[10px]">{n.vaiTro}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Phone className="w-3 h-3" /> {n.sdt}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {n.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-emerald-600">{formatVNDShort(ls.tongTien)}</div>
                  <div className={`text-[10px] font-mono ${n.congNo > 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {n.congNo > 0 ? `Nợ: ${formatVNDShort(n.congNo)}` : "Sạch"}
                  </div>
                </div>
                <button onClick={() => setShowHistory(n)} className="p-1.5 rounded hover:bg-white/40 text-brand-600"><History className="w-4 h-4" /></button>
                <button onClick={() => setShowForm({ mode: "edit", ncc: n })} className="p-1.5 rounded hover:bg-white/40 text-sky-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-white/40 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </EntityCardList>
      )}

      {showForm && <NCCForm mode={showForm.mode} ncc={showForm.ncc} onClose={() => setShowForm(null)} onSave={handleSave} />}
      {showHistory && <NCCLichSuModal ncc={showHistory} onClose={() => setShowHistory(null)} />}
    </div>
  );
}

function NCCForm({ mode, ncc, onClose, onSave }: { mode: "add" | "edit"; ncc?: NCC; onClose: () => void; onSave: (n: NCC) => void }) {
  const [form, setForm] = useState<NCC>(ncc || {
    stt: 99,
    ten: "",
    vaiTro: "Dệt",
    sdt: "",
    mail: "",
    diaChi: "",
    maSoThue: "",
    congNo: 0,
    rating: 4,
    ghiChu: "",
    avatar: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ten || !form.sdt) return toast.error("Vui lòng nhập tên NCC và SĐT");
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-[96%] max-w-2xl sm:max-w-3xl rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm Nhà Cung Cấp mới" : `Chỉnh sửa: ${ncc?.ten}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhà cung cấp vải, sợi, nhuộm, phụ liệu, bo cổ, chỉ may</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-amber-500/30 shadow-md overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold">
                {form.avatar ? (
                  <img src={form.avatar} alt={form.ten} className="w-full h-full object-cover" />
                ) : (
                  <span>{form.ten ? form.ten.charAt(0).toUpperCase() : "NCC"}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-xs font-semibold">Tải Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setForm({ ...form, avatar: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Logo / Ảnh Nhà Cung Cấp</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tải logo đại diện xưởng dệt, nhuộm, công ty vải</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên Nhà Cung Cấp *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500" value={form.ten} onChange={(e) => setForm({ ...form, ten: e.target.value })} placeholder="VD: Công ty Dệt Phong Phú..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Vai trò / Chuyên môn *</label>
              <select required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500" value={form.vaiTro} onChange={(e) => setForm({ ...form, vaiTro: e.target.value })}>
                <option>Dệt</option>
                <option>Nhuộm</option>
                <option>Bo cổ</option>
                <option>Phụ liệu</option>
                <option>Chỉ</option>
                <option>Cúc</option>
                <option>Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT liên hệ *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} placeholder="0901234567" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500" value={form.mail} onChange={(e) => setForm({ ...form, mail: e.target.value })} placeholder="ncc@example.com" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ trụ sở / Xưởng</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500" value={form.diaChi} onChange={(e) => setForm({ ...form, diaChi: e.target.value })} placeholder="Số nhà, đường, quận/huyện, tỉnh/TP..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã số thuế</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500" value={form.maSoThue} onChange={(e) => setForm({ ...form, maSoThue: e.target.value })} placeholder="0312456789" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Công nợ đầu kỳ (đ)</label>
              <input type="number" min={0} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-amber-500" value={form.congNo} onChange={(e) => setForm({ ...form, congNo: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh giá (1-5 sao)</label>
              <input type="number" min={1} max={5} step={0.5} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú chi tiết</label>
            <textarea className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500 min-h-[70px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} placeholder="Ghi chú thêm về điều khoản thanh toán, thời gian giao vải..." />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="w-full sm:w-2/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition flex items-center justify-center gap-2 text-base"
            >
              {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {mode === "add" ? "Thêm Nhà Cung Cấp mới" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NCCLichSuModal({ ncc, onClose }: { ncc: NCC; onClose: () => void }) {
  const { giaoDich } = useKho();
  const dsGD = giaoDich.filter((g) => g.loai === "NHAP" && g.nguonNhap === ncc.ten).sort((a, b) => b.ngay.localeCompare(a.ngay));
  const tongTien = dsGD.reduce((s, g) => s + g.thanhTien, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            Lịch sử mua: {ncc.ten}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
          <div className="bg-brand-500/10 rounded p-2 text-center">
            <div className="text-xs opacity-70">Tổng mua</div>
            <div className="font-bold text-brand-600">{formatVNDShort(tongTien)}</div>
          </div>
          <div className="bg-sky-500/10 rounded p-2 text-center">
            <div className="text-xs opacity-70">Số lần mua</div>
            <div className="font-bold text-sky-600">{dsGD.length}</div>
          </div>
          <div className={`rounded p-2 text-center ${ncc.congNo > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
            <div className="text-xs opacity-70">Còn nợ</div>
            <div className={`font-bold ${ncc.congNo > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatVNDShort(ncc.congNo)}</div>
          </div>
        </div>
        <div className="text-sm mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-3 h-3 text-brand-500" /> {ncc.sdt}
            <Mail className="w-3 h-3 text-brand-500 ml-2" /> {ncc.mail}
          </div>
          {ncc.diaChi && <div className="flex items-center gap-2 text-xs opacity-70"><MapPin className="w-3 h-3" /> {ncc.diaChi}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">Ngày</th>
                <th className="p-2">Mã VT</th>
                <th className="p-2">Tên VT</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Tiền</th>
                <th className="p-2">Người TH</th>
              </tr>
            </thead>
            <tbody>
              {dsGD.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center opacity-60 text-sm">Chưa có giao dịch mua nào</td></tr>
              ) : dsGD.map((g) => (
                <tr key={g.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 text-xs">{g.ngay}</td>
                  <td className="p-2 font-mono text-xs">{g.maVT}</td>
                  <td className="p-2 text-xs">{g.tenVT}</td>
                  <td className="p-2 text-right font-mono">{g.soLuong.toLocaleString()} {g.donVi}</td>
                  <td className="p-2 text-right font-mono">{g.donGia.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono font-semibold text-emerald-600">{formatVNDShort(g.thanhTien)}</td>
                  <td className="p-2 text-xs">{g.nguoiThucHien}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
