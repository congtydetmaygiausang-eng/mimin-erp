"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Calendar, CheckCircle2, Edit2, Filter, Plus, Scissors, Target, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CrudModal } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { useKHSX, type KHSX, type TrangThaiKHSX } from "@/lib/data/khsx-store";
import { useLenhCat, generateLenhCatId } from "@/lib/data/lenh-cat-store";

const TRANG_THAI: TrangThaiKHSX[] = ["Lên kế hoạch", "Đang SX", "Hoàn thành", "Trễ hạn"];
const XUONG = ["Tổ cắt", "Xưởng May 1 – Polomimin", "Xưởng May 2 – Polomimin", "Gia công ngoài"];

export default function KeHoachSXPage() {
  const router = useRouter();
  const { user } = useSession();
  const { khsx, themKHSX, suaKHSX, xoaKHSX } = useKHSX();
  const { dsLenhCat, themLenhCat } = useLenhCat();
  
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KHSX | null>(null);
  const [filter, setFilter] = useState<TrangThaiKHSX | "Tất cả">("Tất cả");
  const visible = filter === "Tất cả" ? khsx : khsx.filter((item) => item.trangThai === filter);
  const tongSL = khsx.reduce((sum, item) => sum + item.soLuong, 0);
  const tongXong = khsx.reduce((sum, item) => sum + item.daHoanThanh, 0);
  const tienDo = tongSL ? (tongXong / tongSL) * 100 : 0;
  
  const formInitial: Record<string, string> = editing ? {
    maKHSX: editing.maKHSX,
    maSP: editing.maSP || "",
    sanPham: editing.sanPham,
    soLuong: String(editing.soLuong),
    tuNgay: editing.tuNgay,
    denNgay: editing.denNgay,
    xuongPhuTrach: editing.xuongPhuTrach,
    trangThai: editing.trangThai,
    ghiChu: editing.ghiChu || "",
  } : {
    maKHSX: `KHSX-${new Date().getFullYear()}-${String(khsx.length + 1).padStart(3, "0")}`,
    soLuong: "1",
    tuNgay: new Date().toISOString().slice(0, 10),
    denNgay: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    xuongPhuTrach: XUONG[0],
    trangThai: "Lên kế hoạch",
  };

  const taoLenhCat = async (item: KHSX) => {
    try {
      const newId = generateLenhCatId(dsLenhCat);
      const now = new Date().toISOString().slice(0, 10);
      
      const newLenhCat = {
        id: newId,
        loaiLenh: "HangNha" as const,
        loaiSP: ["AoTru", "AoCoTron", "BoTru", "BoCoTron", "AoPolo", "PhuKien"].includes(item.loaiSP as string) 
          ? (item.loaiSP as any) 
          : "BoTru",
        maSP: item.maSP || "",
        tenSP: item.tenSP || item.sanPham,
        tongSL: item.soLuong,
        hanHoanThanh: item.denNgay,
        tiLeSize: item.tiLeSize || "1:2:2:1",
        dsMau: (item.dsMau || []).map((mau) => {
          let mergedImg = mau.img;
          let mergedImgQuan = (mau as any).imgQuan;
          if (!mergedImg && item.maSP) {
            try {
              // Dùng đúng key của danh mục sản phẩm (không phải v2)
              const spRaw = localStorage.getItem("mimin_danh_muc_sp");
              if (spRaw) {
                const spList = JSON.parse(spRaw);
                const sp = spList.find((s: any) => s.id === item.maSP || s.ma_sp === item.maSP);
                if (sp && sp.dsMau) {
                  const spMau = sp.dsMau.find((sm: any) => sm.ten === mau.ten || sm.maSKU === mau.maSKU);
                  if (spMau) {
                    mergedImg = spMau.img || "";
                    mergedImgQuan = spMau.imgQuan || "";
                  }
                }
              }
            } catch (e) {}
          }
          return {
            ...mau,
            img: mergedImg || "",
            imgQuan: mergedImgQuan || "",
          };
        }),
        dsPhuLieu: [],
        phanCong: [],
        chiPhiCoDinh: {},
        phuTrachCat: "NV006",
        ghiChu: `Tạo từ kế hoạch ${item.maKHSX} bởi ${user?.name || "Người dùng"} lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ngày ${new Date().toLocaleDateString("vi-VN")}`,
        trangThai: "Nhap" as const,
        phienBanDinhMuc: 1,
        ngayTao: now,
      };

      await themLenhCat(newLenhCat, user as any);
      toast.success(`Đã chuyển ${item.maSP || item.sanPham} thành Lệnh cắt ${newId}`);
      localStorage.setItem("mimin_edit_lenh_cat_id", newId);
      router.push("/lenh-cat");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo lệnh cắt");
    }
  };

  return <div className="space-y-5 animate-fade-in">
    <section className="rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-500 p-5 sm:p-6 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1 w-full">
          <p className="flex items-center gap-2 text-sm font-semibold"><Calendar className="h-4 w-4" /> MIMIN ERP · Sản xuất & Kế hoạch</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Kế hoạch sản xuất</h1>
          <p className="mt-2 text-sm leading-relaxed">{khsx.length} kế hoạch · Tổng SL {tongSL.toLocaleString("vi-VN")} · Hoàn thành {tongXong.toLocaleString("vi-VN")} · Tiến độ {tienDo.toFixed(1)}%</p>
          <div className="mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${Math.min(tienDo, 100)}%` }} /></div>
        </div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-3 font-bold hover:bg-white/30 shrink-0"><Plus className="h-5 w-5" /> Tạo KHSX</button>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[
      { label: "Tổng kế hoạch", value: khsx.length, icon: Target, color: "text-slate-900" },
      { label: "Đang sản xuất", value: khsx.filter((x) => x.trangThai === "Đang SX").length, icon: Scissors, color: "text-amber-600" },
      { label: "Hoàn thành", value: khsx.filter((x) => x.trangThai === "Hoàn thành").length, icon: CheckCircle2, color: "text-emerald-600" },
      { label: "Trễ hạn", value: khsx.filter((x) => x.trangThai === "Trễ hạn").length, icon: AlertCircle, color: "text-red-600" },
    ].map(({ label, value, icon: Icon, color }) => <div key={label} className="card p-5"><p className="flex items-center gap-2 text-sm text-slate-500"><Icon className="h-4 w-4" />{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{value}</p></div>)}</section>

    <section className="card flex flex-wrap items-center gap-2 p-3"><Filter className="h-4 w-4 text-slate-400" />{(["Tất cả", ...TRANG_THAI] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-2 text-xs font-bold ${filter === item ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"}`}>{item}{item !== "Tất cả" ? ` (${khsx.filter((x) => x.trangThai === item).length})` : ""}</button>)}</section>

    {visible.length === 0 ? <section className="card py-16 text-center text-slate-400"><Calendar className="mx-auto mb-3 h-12 w-12 opacity-25" /><p className="font-bold">Chưa có kế hoạch sản xuất nào</p><p className="mt-1 text-sm">Chọn “Đặt sản xuất” trong Danh mục sản phẩm hoặc bấm “Tạo KHSX”.</p></section> :
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <article key={item.id} className="card p-5">
        <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-teal-700">Mã kế hoạch: {item.maKHSX}</p><p className="mt-1 text-sm font-bold text-slate-700">Mã sản phẩm: {item.maSP || "Chưa có mã SP"}</p><h2 className="text-sm font-medium text-slate-900">Tên sản phẩm: {item.sanPham}</h2></div><span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-bold text-teal-700">{item.trangThai}</span></div>
        <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><p className="text-slate-400">Số lượng</p><b>{item.soLuong.toLocaleString("vi-VN")} SP</b></div><div><p className="text-slate-400">Thời gian</p><b>{item.tuNgay} → {item.denNgay}</b></div></div>
        {item.ghiChu && <div className="mb-4 text-xs text-slate-500 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/50">{item.ghiChu}</div>}
        <button onClick={() => taoLenhCat(item)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700"><Scissors className="h-4 w-4" /> Tạo lệnh cắt</button>
        <div className="flex gap-2"><button onClick={() => { setEditing(item); setShowForm(true); }} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 py-2 text-xs font-bold text-amber-700"><Edit2 className="h-3 w-3" /> Sửa</button><button onClick={() => { if (confirm(`Xóa kế hoạch ${item.maKHSX}?`)) xoaKHSX(item.id, user); }} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-700"><Trash2 className="h-3 w-3" /> Xóa</button></div>
      </article>)}</section>}

    <CrudModal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Sửa kế hoạch sản xuất" : "Tạo kế hoạch sản xuất"} fields={[
      { name: "maKHSX", label: "Mã kế hoạch", type: "text", required: true }, { name: "maSP", label: "Mã sản phẩm", type: "text" }, { name: "sanPham", label: "Tên sản phẩm", type: "text", required: true }, { name: "soLuong", label: "Số lượng", type: "number", min: 1, required: true }, { name: "tuNgay", label: "Từ ngày", type: "date", required: true }, { name: "denNgay", label: "Đến ngày", type: "date", required: true }, { name: "xuongPhuTrach", label: "Xưởng phụ trách", type: "select", options: XUONG.map((x) => ({ value: x, label: x })) }, { name: "trangThai", label: "Trạng thái", type: "select", options: TRANG_THAI.map((x) => ({ value: x, label: x })) }, { name: "ghiChu", label: "Ghi chú", type: "textarea" },
    ]} initial={formInitial} onSubmit={async (values) => {
      const patch = { maKHSX: values.maKHSX, maSP: values.maSP, sanPham: values.sanPham, tenSP: values.sanPham, tuan: "", tuNgay: values.tuNgay, denNgay: values.denNgay, loai: "Bộ" as const, soLuong: Number(values.soLuong), daHoanThanh: editing?.daHoanThanh || 0, xuongPhuTrach: values.xuongPhuTrach, trangThai: values.trangThai as TrangThaiKHSX, ghiChu: values.ghiChu };
      if (editing) suaKHSX(editing.id, patch, user); else themKHSX(patch, user);
      toast.success(editing ? "Đã cập nhật kế hoạch" : "Đã tạo kế hoạch sản xuất"); setShowForm(false); setEditing(null);
    }} />
  </div>;
}
