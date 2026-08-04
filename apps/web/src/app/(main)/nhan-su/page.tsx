"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Users,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  Star,
  DollarSign,
  Calendar,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Wallet,
  History,
  Lock,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeEmployeeRecord } from "@/lib/employee-records";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { Avatar } from "@/components/Avatar";
import { EntityCard, EntityCardGrid, EntityCardList } from "@/components/EntityCard";
import { DataViewToggle, type ViewMode } from "@/components/DataViewToggle";
import { usePermission } from "@/components/PermissionGuard";
import { NHAN_SU_KHOI_DAU, type NhanSuExt } from "./data";

async function loadEmployeesFromSupabase() {
  const response = await fetch("/api/employee-records", { method: "GET" });
  if (!response.ok) {
    throw new Error("Không thể tải danh sách nhân sự từ Supabase");
  }
  const data = await response.json();
  return (data.records || []).map((record: any) => normalizeEmployeeRecord(record) as NhanSuExt);
}

export default function NhanSuPage() {
  const [list, setList] = useState<NhanSuExt[]>(NHAN_SU_KHOI_DAU);
  const [search, setSearch] = useState("");
  const [filterBP, setFilterBP] = useState<string>("all");
  const [showForm, setShowForm] = useState<{ mode: "add" | "edit"; nv?: NhanSuExt } | null>(null);
  const [showLuong, setShowLuong] = useState<NhanSuExt | null>(null);
  const [showDetail, setShowDetail] = useState<NhanSuExt | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const perm = usePermission();

  const { phanCong } = usePhanCong();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const fromSupabase = await loadEmployeesFromSupabase();
        if (!mounted) return;
        if (fromSupabase.length > 0) {
          setList(fromSupabase);
          toast.success(`Đã tải ${fromSupabase.length} nhân viên từ Supabase`);
        }
      } catch (error) {
        console.error("load employees failed", error);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // KPIs (memoize - tranh tinh lai moi render)
  const kpis = useMemo(() => {
    const bp = new Set<string>();
    let tongLuongCung = 0;
    let dsSanXuat = 0, dsKho = 0, dsQC = 0;
    for (const n of list) {
      bp.add(n.boPhan);
      tongLuongCung += n.luongCung || 0;
      if (n.boPhan === "Sản xuất") dsSanXuat++;
      if (n.boPhan === "Kho vận") dsKho++;
      if (n.boPhan === "QC") dsQC++;
    }
    return { tongNV: list.length, dsBP: Array.from(bp), tongLuongCung, dsSanXuat, dsKho, dsQC };
  }, [list]);

  // Lương sản phẩm từ PHAN_CONG (memoize)
  const luongSPTheoNV = useMemo(() => {
    const map: Record<string, number> = {};
    for (const pc of phanCong) {
      const maNV = pc.nguoiPhuTrach.ma;
      if (!map[maNV]) map[maNV] = 0;
      map[maNV] += pc.donGiaGiao * pc.soLuongGiao;
    }
    return map;
  }, [phanCong]);

  // Filter (memoize)
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter((n) => {
      const matchSearch = !q || [n.hoTen, n.maNV, n.sdt, n.email, n.chucVu, n.boPhan].some(
        (y) => (y || "").toLowerCase().includes(q)
      );
      const matchBP = filterBP === "all" || n.boPhan === filterBP;
      return matchSearch && matchBP;
    });
  }, [list, search, filterBP]);

  const handleSave = useCallback((nv: NhanSuExt) => {
    setList((prev) => {
      if (showForm?.mode === "add") {
        toast.success(`Đã thêm NV: ${nv.hoTen}`);
        return [...prev, nv];
      } else {
        toast.success(`Đã cập nhật: ${nv.hoTen}`);
        return prev.map((x) => (x.maNV === nv.maNV ? nv : x));
      }
    });
    setShowForm(null);
  }, [showForm]);

  const handleDelete = useCallback(async (nv: NhanSuExt) => {
    if (!confirm(`Xoá NV "${nv.hoTen}"?`)) return;

    try {
      const response = await fetch(`/api/employee-records?maNV=${encodeURIComponent(nv.maNV || "")}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(await response.text());
      }

      setList((prev) => prev.filter((x) => x.maNV !== nv.maNV));
      toast.success(`Đã xoá: ${nv.hoTen}`);
    } catch (error) {
      console.error("delete employee failed", error);
      toast.error(error instanceof Error ? error.message : "Không thể xoá nhân sự khỏi Supabase");
    }
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Hero Header Banner */}
      <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #006d8f 0%, #0a9ebd 20%, #3dba7a 55%, #2d6a4f 80%, #1b3a2e 100%)" }}>
        {/* Blur glow orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: "radial-gradient(circle, #7fffd4 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-15" style={{ background: "radial-gradient(circle, #00bcd4 0%, transparent 70%)", transform: "translate(-30%, 30%)" }} />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white drop-shadow">
              <Users className="w-7 h-7 text-white/90" />
              Nhân sự
            </h1>
            <p className="text-white/80 mt-1 text-sm font-medium">
              {kpis.tongNV} nhân viên · Tổng quỹ lương cứng <b className="text-white">{formatVNDShort(kpis.tongLuongCung)}/tháng</b>
            </p>
          </div>
          {perm.canCreate("nhan-su") ? (
          <button onClick={() => setShowForm({ mode: "add" })} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition shadow-lg">
            <Plus className="w-4 h-4" /> Thêm NV
          </button>
          ) : (
          <div className="text-xs px-3 py-1.5 rounded-lg bg-white/10 text-white/70 flex items-center gap-1 border border-white/20" title="Bạn không có quyền thêm nhân viên">
            <Lock className="w-3.5 h-3.5" /> Chỉ Admin
          </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Users className="w-3 h-3" /> Tổng nhân viên</div>
          <div className="text-2xl md:text-3xl font-bold mt-1">{kpis.tongNV}</div>
          <div className="text-xs opacity-60 mt-1">{kpis.dsBP.length} bộ phận</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Sản xuất</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-sky-600">{kpis.dsSanXuat}</div>
          <div className="text-xs opacity-60 mt-1">công nhân</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Shield className="w-3 h-3" /> QC + Kho</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-violet-600">{kpis.dsQC + kpis.dsKho}</div>
          <div className="text-xs opacity-60 mt-1">kiểm soát</div>
        </div>
        <div className="card p-5">
          <div className="text-xs opacity-70 flex items-center gap-1"><Wallet className="w-3 h-3" /> Quỹ lương</div>
          <div className="text-2xl md:text-3xl font-bold mt-1 text-emerald-600">{formatVNDShort(kpis.tongLuongCung)}</div>
          <div className="text-xs opacity-60 mt-1">{formatVND(kpis.tongLuongCung)}/tháng</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 flex-1">
            {["all", ...kpis.dsBP].map((bp) => (
              <button
                key={bp}
                onClick={() => setFilterBP(bp)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filterBP === bp ? "bg-brand-500 text-white" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
                }`}
              >
                {bp === "all" ? `Tất cả (${list.length})` : `${bp} (${list.filter((n) => n.boPhan === bp).length})`}
              </button>
            ))}
          </div>
          <DataViewToggle onChange={setViewMode} />
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input className="input pl-9" placeholder="Tìm tên, mã NV, SĐT, email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table / Card / List View */}
      {viewMode === "table" && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Mã NV</th>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Bộ phận</th>
                  <th className="p-3">Chức vụ</th>
                  <th className="p-3">SĐT</th>
                  <th className="p-3">Ngày vào</th>
                  <th className="p-3 text-right">Lương cứng</th>
                  <th className="p-3 text-right">Lương SP</th>
                  <th className="p-3 text-center">Đánh giá</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => {
                  const luongSP = luongSPTheoNV[n.maNV] || 0;
                  return (
                    <tr key={n.maNV} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3 font-mono text-xs opacity-70">{n.maNV}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowDetail(n)}>
                          <Avatar name={n.hoTen} src={n.avatar} size="sm" />
                          <div>
                            <div className="font-medium text-teal-600 dark:text-teal-400 hover:underline">{n.hoTen}</div>
                            <div className="text-[10px] opacity-60 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {n.email?.slice(0, 18)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 text-[10px]">{n.boPhan}</span>
                      </td>
                      <td className="p-3 text-xs">{n.chucVu || "—"}</td>
                      <td className="p-3 text-xs">
                        <a href={`tel:${n.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                          <Phone className="w-3 h-3" /> {n.sdt}
                        </a>
                      </td>
                      <td className="p-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {n.ngayVao}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono">{formatVNDShort(n.luongCung || 0)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-emerald-600">
                        {luongSP > 0 ? formatVNDShort(luongSP) : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className={`w-3 h-3 ${star <= (n.rating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowDetail(n)} className="text-[10px] px-2 py-1 rounded bg-teal-500/15 text-teal-700 dark:text-teal-300 hover:bg-teal-500/25 font-semibold">
                            Xem
                          </button>
                          <button onClick={() => setShowLuong(n)} className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25" title="Bảng lương">
                            <Wallet className="w-3 h-3" />
                          </button>
                          <button onClick={() => setShowForm({ mode: "edit", nv: n })} className="text-[10px] px-1.5 py-1 rounded bg-sky-500/15 text-sky-700 hover:bg-sky-500/25">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(n)} className="text-[10px] px-1.5 py-1 rounded bg-red-500/15 text-red-700 hover:bg-red-500/25">
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
            const luongSP = luongSPTheoNV[n.maNV] || 0;
            return (
              <EntityCard
                key={n.maNV}
                name={n.hoTen}
                avatarUrl={n.avatar}
                avatarSize="xl"
                rating={n.rating}
                badges={[
                  { label: n.boPhan, bg: "bg-violet-500/15", color: "text-violet-700" },
                  { label: n.chucVu, bg: "bg-sky-500/15", color: "text-sky-700" },
                ]}
                subtitle={<span className="font-mono text-[10px]">{n.maNV}</span>}
                stats={[
                  { label: "SĐT", value: n.sdt, icon: Phone },
                  { label: "Ngày vào", value: n.ngayVao, icon: Calendar },
                  { label: "Lương cứng", value: formatVNDShort(n.luongCung || 0), color: "text-sky-600" },
                  { label: "Lương SP", value: luongSP > 0 ? formatVNDShort(luongSP) : "—", color: "text-emerald-600" },
                ]}
                onView={() => setShowDetail(n)}
                onEdit={() => setShowForm({ mode: "edit", nv: n })}
                onDelete={() => handleDelete(n)}
              />
            );
          })}
        </EntityCardGrid>
      )}

      {viewMode === "list" && (
        <EntityCardList>
          {filtered.map((n) => {
            const luongSP = luongSPTheoNV[n.maNV] || 0;
            return (
              <div key={n.maNV} className="card p-3 flex items-center gap-3">
                <Avatar name={n.hoTen} src={n.avatar} size="md" />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowDetail(n)}>
                  <div className="font-semibold text-sm hover:text-teal-600 transition">{n.hoTen}</div>
                  <div className="text-[10px] opacity-60 flex items-center gap-2">
                    <span className="font-mono">{n.maNV}</span>
                    <span>·</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700">{n.boPhan}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {n.sdt}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] opacity-60">Cứng: {formatVNDShort(n.luongCung || 0)}</div>
                  <div className="text-[10px] text-emerald-600">SP: +{formatVNDShort(luongSP)}</div>
                </div>
                <div className="text-right border-l pl-3" style={{ borderColor: "var(--border)" }}>
                  <div className="text-[10px] opacity-60">Đánh giá</div>
                  <div className="text-sm font-bold text-amber-600 flex items-center gap-0.5 justify-end">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {n.rating}
                  </div>
                </div>
                <button onClick={() => setShowDetail(n)} className="p-1.5 rounded hover:bg-white/40 text-teal-600 font-xs font-semibold">Xem</button>
                <button onClick={() => setShowLuong(n)} className="p-1.5 rounded hover:bg-white/40 text-emerald-600"><Wallet className="w-4 h-4" /></button>
                <button onClick={() => setShowForm({ mode: "edit", nv: n })} className="p-1.5 rounded hover:bg-white/40 text-sky-600"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-white/40 text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            );
          })}
        </EntityCardList>
      )}

      {showForm && <NVForm mode={showForm.mode} nv={showForm.nv} existingCount={list.length} onClose={() => setShowForm(null)} onSave={handleSave} />}
      {showDetail && <ChiTietNhanSuModal nv={showDetail} luongSP={luongSPTheoNV[showDetail.maNV] || 0} onClose={() => setShowDetail(null)} onEdit={() => { const target = showDetail; setShowDetail(null); setShowForm({ mode: "edit", nv: target }); }} onLuong={() => { const target = showDetail; setShowDetail(null); setShowLuong(target); }} />}
      {showLuong && <BangLuongNV nv={showLuong} luongSP={luongSPTheoNV[showLuong.maNV] || 0} onClose={() => setShowLuong(null)} />}
      {previewImage && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-5xl w-full">
            <button type="button" onClick={() => setPreviewImage(null)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-slate-700 shadow-lg">
              <X className="w-5 h-5" />
            </button>
            <img src={previewImage} alt="Preview ảnh" className="max-h-[85vh] w-full rounded-3xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function NVForm({ mode, nv, existingCount, onClose, onSave }: { mode: "add" | "edit"; nv?: NhanSuExt; existingCount: number; onClose: () => void; onSave: (n: NhanSuExt) => void }) {
  const [form, setForm] = useState<NhanSuExt>(nv || {
    stt: existingCount + 1,
    maNV: `NV${(existingCount + 19).toString().padStart(3, "0")}`,
    hoTen: "",
    ngaySinh: "1995-01-01",
    ngayCap: "",
    noiCap: "",
    gioiTinh: "Nam",
    cccd: "",
    sdt: "",
    email: "",
    diaChiTT: "",
    diaChiTamTru: "",
    viTri: "",
    ngayVaoLam: "",
    loaiHD: "",
    tinhTrangHN: "",
    soTK: "",
    nganHang: "",
    mst: "",
    bhxh: "",
    trangThai: "dang_lam",
    luongCB: 0,
    loaiLuong: "",
    boPhan: "Sản xuất",
    chucVu: "Công nhân",
    ngayVao: new Date().toISOString().split("T")[0],
    luongCung: 7500000,
    rating: 4,
    taiKhoan: "",
  } as NhanSuExt);

  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleUpload = (field: "avatar" | "cccdFrontImage" | "cccdBackImage") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFiles((prev) => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, [field]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const uploadToSupabase = async (field: "avatar" | "cccdFrontImage" | "cccdBackImage", file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const safeBase = (form.maNV || `nv-${existingCount + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "employee";
    const path = `nhan-su/${safeBase}/${field}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    formData.append("path", path);

    const response = await fetch("/api/employee-uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Không thể upload ảnh lên Supabase");
    }

    const data = await response.json();
    return data.url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hoTen || !form.sdt) {
      toast.error("Vui lòng nhập tên và SĐT");
      return;
    }

    const hasFront = Boolean(form.cccdFrontImage || uploadFiles.cccdFrontImage || nv?.cccdFrontImage);
    const hasBack = Boolean(form.cccdBackImage || uploadFiles.cccdBackImage || nv?.cccdBackImage);
    if (!hasFront || !hasBack) {
      toast.error("Vui lòng tải cả ảnh CCCD mặt trước và mặt sau trước khi lưu");
      return;
    }

    setIsUploading(true);
    try {
      const [avatarUrl, cccdFrontUrl, cccdBackUrl] = await Promise.all([
        uploadFiles.avatar ? uploadToSupabase("avatar", uploadFiles.avatar) : Promise.resolve(form.avatar || nv?.avatar || ""),
        uploadFiles.cccdFrontImage ? uploadToSupabase("cccdFrontImage", uploadFiles.cccdFrontImage) : Promise.resolve(form.cccdFrontImage || nv?.cccdFrontImage || ""),
        uploadFiles.cccdBackImage ? uploadToSupabase("cccdBackImage", uploadFiles.cccdBackImage) : Promise.resolve(form.cccdBackImage || nv?.cccdBackImage || ""),
      ]);

      const savedEmployee = {
        ...form,
        avatar: avatarUrl || form.avatar || "",
        cccdFrontImage: cccdFrontUrl || form.cccdFrontImage || "",
        cccdBackImage: cccdBackUrl || form.cccdBackImage || "",
      } as NhanSuExt;

      const response = await fetch("/api/employee-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedEmployee),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Không thể lưu dữ liệu nhân sự vào Supabase");
      }

      onSave(savedEmployee);
      toast.success("Đã lưu nhân sự vào Supabase");
    } catch (error) {
      console.error("Upload employee images failed", error);
      toast.error(error instanceof Error ? error.message : "Không thể lưu ảnh lên Supabase");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-2xl sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[90vh] sm:min-h-0 max-h-[97vh] sm:max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm nhân viên mới" : `Chỉnh sửa: ${nv?.hoTen}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhập đầy đủ thông tin hồ sơ nhân sự xưởng may</p>
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
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-teal-500/30 shadow-md overflow-hidden bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer" onClick={() => (form.avatar ? setPreviewImage(form.avatar) : null)}>
                {form.avatar ? (
                  <img src={form.avatar} alt={form.hoTen} className="w-full h-full object-cover" />
                ) : (
                  <span>{form.hoTen ? form.hoTen.charAt(0).toUpperCase() : "NV"}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-xs font-semibold">Tải ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload("avatar")}
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Ảnh đại diện nhân viên</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tải ảnh chân dung công nhân hoặc chọn ảnh đại diện từ thiết bị</div>
              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                {["/avatars/female-1.png", "/avatars/male-1.png", "/avatars/female-2.png", "/avatars/male-2.png"].map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: url })}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-500 text-slate-700 dark:text-slate-200 transition"
                  >
                    Mẫu {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã NV *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.maNV} onChange={(e) => setForm({ ...form, maNV: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Họ tên *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày sinh</label>
              <input type="date" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.ngaySinh} onChange={(e) => setForm({ ...form, ngaySinh: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Giới tính</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.gioiTinh} onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CCCD</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.cccd} onChange={(e) => setForm({ ...form, cccd: e.target.value })} placeholder="012345678901" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <ImagePlus className="w-4 h-4 text-teal-600" />
              Ảnh CCCD và hồ sơ nhân viên
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "cccdFrontImage", label: "CCCD mặt trước", preview: form.cccdFrontImage },
                { key: "cccdBackImage", label: "CCCD mặt sau", preview: form.cccdBackImage },
              ].map((item) => (
                <label key={item.key} className="cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/50 p-3 transition hover:border-teal-500">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">Tải ảnh</span>
                  </div>
                  {item.preview ? (
                    <img src={item.preview} alt={item.label} className="h-28 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700" onClick={(e) => { e.stopPropagation(); setPreviewImage(item.preview || null); }} />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload(item.key as "cccdFrontImage" | "cccdBackImage")} />
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ thường trú</label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.diaChiTT || ""} onChange={(e) => setForm({ ...form, diaChiTT: e.target.value })} placeholder="Địa chỉ nơi ở hiện tại..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bộ phận *</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.boPhan} onChange={(e) => setForm({ ...form, boPhan: e.target.value })}>
                <option>Sản xuất</option>
                <option>Kho vận</option>
                <option>QC</option>
                <option>Hành chính</option>
                <option>Kế toán</option>
                <option>Kinh doanh</option>
                <option>Quản lý</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Chức vụ</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.chucVu} onChange={(e) => setForm({ ...form, chucVu: e.target.value })} placeholder="Công nhân / Tổ trưởng..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày vào</label>
              <input type="date" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.ngayVao} onChange={(e) => setForm({ ...form, ngayVao: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Lương cứng (đ/tháng)</label>
              <input type="number" min={0} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.luongCung} onChange={(e) => setForm({ ...form, luongCung: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tài khoản</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.taiKhoan} onChange={(e) => setForm({ ...form, taiKhoan: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh giá (1-5)</label>
              <input type="number" min={1} max={5} step={0.5} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
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
              disabled={isUploading}
              className="w-full sm:w-2/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {isUploading ? "Đang lưu ảnh lên Supabase..." : (mode === "add" ? "Thêm nhân viên mới" : "Lưu thay đổi")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChiTietNhanSuModal({ nv, luongSP, onClose, onEdit, onLuong }: { nv: NhanSuExt; luongSP: number; onClose: () => void; onEdit: () => void; onLuong: () => void }) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-[96%] max-w-2xl sm:max-w-3xl rounded-3xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold">{nv.maNV}</span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Hồ sơ Nhân sự Chi tiết</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 border border-teal-500/20">
          <div className="cursor-pointer" onClick={() => (nv.avatar ? setPreviewImage(nv.avatar) : null)}>
            <Avatar name={nv.hoTen} src={nv.avatar} size="2xl" className="border-4 border-white dark:border-slate-800 shadow-xl" />
          </div>
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{nv.hoTen}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-700">{nv.boPhan}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700">{nv.chucVu}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-teal-600" /> {nv.sdt || "Chưa có SĐT"}</span>
              {nv.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-sky-600" /> {nv.email}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 opacity-60" /> Ngày vào: {nv.ngayVao || "—"}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin Cá nhân</div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Giới tính:</span> <span className="font-medium">{nv.gioiTinh || "Nam"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Ngày sinh:</span> <span className="font-medium">{nv.ngaySinh || "—"}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Số CCCD:</span> <span className="font-mono font-medium">{nv.cccd || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="opacity-70">Địa chỉ:</span> <span className="font-medium text-right max-w-[200px] truncate">{nv.diaChiTT || "—"}</span></div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thu nhập & Đánh giá</div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Lương cứng:</span> <span className="font-bold text-sky-600">{formatVNDShort(nv.luongCung || 0)}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Lương Sản phẩm:</span> <span className="font-bold text-emerald-600">{formatVNDShort(luongSP)}</span></div>
            <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50"><span className="opacity-70">Tài khoản NH:</span> <span className="font-mono font-medium">{nv.taiKhoan || "—"}</span></div>
            <div className="flex justify-between py-1"><span className="opacity-70">Đánh giá sếp:</span> <span className="font-bold text-amber-500 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400" /> {nv.rating || 4}/5</span></div>
          </div>
        </div>

        {(nv.cccdFrontImage || nv.cccdBackImage) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nv.cccdFrontImage && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">CCCD mặt trước</div>
                <img src={nv.cccdFrontImage} alt="CCCD mặt trước" className="h-36 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setPreviewImage(nv.cccdFrontImage || null)} />
              </div>
            )}
            {nv.cccdBackImage && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 p-3">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">CCCD mặt sau</div>
                <img src={nv.cccdBackImage} alt="CCCD mặt sau" className="h-36 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={() => setPreviewImage(nv.cccdBackImage || null)} />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button onClick={onClose} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
            Đóng
          </button>
          <button onClick={onLuong} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20">
            <Wallet className="w-4 h-4" /> Bảng lương chi tiết
          </button>
          <button onClick={onEdit} className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/20">
            <Edit2 className="w-4 h-4" /> Sửa thông tin
          </button>
        </div>
      </div>
    </div>
  );
}

function BangLuongNV({ nv, luongSP, onClose }: { nv: NhanSuExt; luongSP: number; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const { phanCong, layTheoLenh } = usePhanCong();
  const pcNV = phanCong.filter((p) => p.nguoiPhuTrach.ma === nv.maNV);
  const tongCongDoan = pcNV.reduce((s, p) => s + p.donGiaGiao * p.soLuongGiao, 0);
  const daThanhToan = pcNV.reduce((s, p) => s + p.daThanhToan, 0);
  const conNo = tongCongDoan - daThanhToan;
  const baoHiem = (nv.luongCung || 0) * 0.105;  // 10.5% BHXH
  const thucNhan = (nv.luongCung || 0) - baoHiem + (luongSP || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="card max-w-3xl w-[96%] p-5 sm:p-7 max-h-[90vh] overflow-y-auto rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Bảng lương: {nv.hoTen}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="bg-emerald-500/10 rounded p-3 mb-4 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-xs opacity-70">Lương cứng</div>
              <div className="text-lg font-bold">{formatVNDShort(nv.luongCung || 0)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">Lương SP</div>
              <div className="text-lg font-bold text-emerald-600">{formatVNDShort(luongSP)}</div>
            </div>
            <div>
              <div className="text-xs opacity-70">BHXH (10.5%)</div>
              <div className="text-lg font-bold text-red-600">-{formatVNDShort(baoHiem)}</div>
            </div>
            <div className="bg-emerald-500/20 rounded p-1">
              <div className="text-xs opacity-70">Thực nhận</div>
              <div className="text-lg font-bold text-emerald-700">{formatVNDShort(thucNhan)}</div>
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold mb-2">📋 Chi tiết lương sản phẩm ({pcNV.length} công đoạn):</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">Lệnh cắt</th>
                <th className="p-2">Công đoạn</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Tiền</th>
                <th className="p-2 text-right">Đã TT</th>
                <th className="p-2">TT</th>
              </tr>
            </thead>
            <tbody>
              {pcNV.length === 0 ? (
                <tr><td colSpan={7} className="p-6 text-center opacity-60 text-sm">Chưa có công đoạn nào</td></tr>
              ) : pcNV.map((p) => (
                <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 font-mono text-xs">{p.lenhCatId}</td>
                  <td className="p-2 text-xs">{p.congDoan}</td>
                  <td className="p-2 text-right text-xs">{p.soLuongGiao}</td>
                  <td className="p-2 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                  <td className="p-2 text-right text-xs font-mono font-semibold">{(p.donGiaGiao * p.soLuongGiao).toLocaleString()}</td>
                  <td className="p-2 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                  <td className="p-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${p.trangThai === "Đã thanh toán" ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
                      {p.trangThai}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-500/10 font-bold text-xs">
                <td colSpan={4} className="p-2 text-right">TỔNG</td>
                <td className="p-2 text-right">{formatVNDShort(tongCongDoan)}</td>
                <td className="p-2 text-right text-emerald-600">{formatVNDShort(daThanhToan)}</td>
                <td className="p-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        {conNo > 0 && (
          <div className="mt-3 text-xs bg-amber-500/10 border border-amber-500/30 rounded p-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Còn <b className="text-amber-700">{formatVNDShort(conNo)}</b> chưa thanh toán - sẽ trừ vào lương tháng sau hoặc chờ xưởng trả</span>
          </div>
        )}
      </div>
    </div>
  );
}
