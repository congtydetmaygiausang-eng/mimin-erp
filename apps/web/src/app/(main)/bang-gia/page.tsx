"use client";

import { useMemo, useState } from "react";
import { Edit2, ListPlus, PackageSearch, Plus, Tag, Trash2 } from "lucide-react";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { KENH_BAN, type BangGia, type BangGiaChiTiet, type KenhBan, type TrangThaiBangGia, useBangGia } from "@/lib/data/bang-gia-store";

const CHANNEL_LABELS: Record<KenhBan, string> = { "ban-le": "Bán lẻ", "ban-si": "Bán sỉ", "ban-lo": "Bán lô", tiktok: "TikTok Shop", shopee: "Shopee" };
const STATUS_LABELS: Record<TrangThaiBangGia, string> = { nhap: "Bản nháp", "dang-ap-dung": "Đang áp dụng", "ngung-ap-dung": "Ngừng áp dụng" };
const STATUS_STYLES: Record<TrangThaiBangGia, string> = { nhap: "bg-slate-100 text-slate-600", "dang-ap-dung": "bg-emerald-50 text-emerald-700", "ngung-ap-dung": "bg-rose-50 text-rose-700" };

const formatVND = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
const rangesOverlap = (fromA: number, toA: number | undefined, fromB: number, toB: number | undefined) => fromA <= (toB ?? Infinity) && fromB <= (toA ?? Infinity);

export default function BangGiaPage() {
  const { bangGia, chiTiet, loading, themBangGia, suaBangGia, xoaBangGia, themChiTiet, suaChiTiet, xoaChiTiet } = useBangGia();
  const { dsSanPham, loading: loadingProducts } = useDanhMucSP();
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<BangGia | null>(null);
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [editingDetail, setEditingDetail] = useState<BangGiaChiTiet | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const selectedList = bangGia.find((item) => item.id === detailListId) || null;
  const selectedDetails = useMemo(() => chiTiet.filter((item) => item.bangGiaId === detailListId).sort((a, b) => a.maSP.localeCompare(b.maSP) || (a.maSKUBienThe || "").localeCompare(b.maSKUBienThe || "") || a.soLuongTu - b.soLuongTu), [chiTiet, detailListId]);
  const productsById = useMemo(() => new Map(dsSanPham.map((product) => [product.id, product])), [dsSanPham]);
  const productOptions = useMemo(() => [...dsSanPham].sort((a, b) => a.id.localeCompare(b.id)).map((product) => ({ value: product.id, label: `${product.id} — ${product.tenSP}` })), [dsSanPham]);

  const listInitial: Record<string, string> = editingList ? { tenBangGia: editingList.tenBangGia, kenhBan: editingList.kenhBan, tuNgay: editingList.tuNgay || "", denNgay: editingList.denNgay || "", trangThai: editingList.trangThai, ghiChu: editingList.ghiChu || "" } : { tenBangGia: "", kenhBan: "ban-le", tuNgay: "", denNgay: "", trangThai: "nhap", ghiChu: "" };
  const detailInitial: Record<string, string> = editingDetail ? { maSP: editingDetail.maSP, maSKUBienThe: editingDetail.maSKUBienThe || "", giaBan: String(editingDetail.giaBan), soLuongTu: String(editingDetail.soLuongTu), soLuongDen: editingDetail.soLuongDen == null ? "" : String(editingDetail.soLuongDen), ghiChu: editingDetail.ghiChu || "" } : { maSP: "", maSKUBienThe: "", giaBan: "", soLuongTu: "1", soLuongDen: "", ghiChu: "" };

  const listFields: FieldDef[] = [
    { name: "tenBangGia", label: "Tên bảng giá", type: "text", required: true, placeholder: "VD: Giá bán sỉ tháng 09/2026" },
    { name: "kenhBan", label: "Kênh bán", type: "select", required: true, options: KENH_BAN.map((channel) => ({ value: channel, label: CHANNEL_LABELS[channel] })) },
    { name: "tuNgay", label: "Từ ngày", type: "date" }, { name: "denNgay", label: "Đến ngày", type: "date" },
    { name: "trangThai", label: "Trạng thái", type: "select", required: true, options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })) },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
  ];
  const detailFields: FieldDef[] = [
    { name: "maSP", label: "Sản phẩm trong danh mục", type: "select", required: true, options: productOptions, emptyLabel: loadingProducts ? "Đang tải danh mục..." : "-- Chọn sản phẩm --", clearOnChange: ["maSKUBienThe"] },
    { name: "maSKUBienThe", label: "Biến thể / SKU", type: "select", disabled: (values) => !values.maSP, emptyLabel: "Tất cả biến thể", options: (values) => productsById.get(values.maSP)?.dsMau.filter((variant) => variant.maSKU?.trim()).map((variant) => ({ value: variant.maSKU.trim(), label: `${variant.ten} — ${variant.maSKU.trim()}` })) || [] },
    { name: "giaBan", label: "Giá bán (VNĐ)", type: "number", min: 1, step: 1, required: true, placeholder: "VD: 150000" },
    { name: "soLuongTu", label: "Số lượng từ", type: "number", min: 1, step: 1, required: true },
    { name: "soLuongDen", label: "Số lượng đến (để trống nếu không giới hạn)", type: "number", min: 1, step: 1 },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
  ];

  return <div className="space-y-6 animate-in fade-in duration-500">
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-800 to-indigo-950 p-8 text-white shadow-2xl transition-all hover:shadow-indigo-900/20">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div className="absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>
      <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md border border-indigo-400/20">
            <Tag className="h-3.5 w-3.5" /> Bán hàng
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent drop-shadow-sm">Bảng Giá Bán</h1>
          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">Quản lý và thiết lập chính sách giá bán chuyên nghiệp theo sản phẩm, biến thể, kênh bán và ngưỡng số lượng.</p>
        </div>
        <button onClick={() => { setEditingList(null); setShowListForm(true); }} className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-white px-5 py-3 font-bold text-indigo-950 transition-all hover:scale-105 hover:bg-indigo-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95">
          <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" /> 
          <span>Tạo bảng giá</span>
        </button>
      </div>
    </section>

    {loading ? <section className="card p-12 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600 mb-4"></div>
      <p className="font-medium animate-pulse">Đang tải dữ liệu bảng giá...</p>
    </section> : bangGia.length === 0 ? <section className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-16 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-5 rounded-full bg-indigo-100 p-5 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
        <Tag className="h-10 w-10" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Chưa có bảng giá nào</h3>
      <p className="mt-2 max-w-md text-slate-500">Tạo bảng giá đầu tiên để bắt đầu quản lý chính sách giá cho các kênh bán hàng của bạn.</p>
      <button onClick={() => { setEditingList(null); setShowListForm(true); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95">
        <Plus className="h-5 w-5" /> Bắt đầu tạo bảng giá
      </button>
    </section> : <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{bangGia.map((item, idx) => { const count = chiTiet.filter((detail) => detail.bangGiaId === item.id).length; return <article key={item.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-200/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:shadow-indigo-900/20 animate-in fade-in slide-in-from-bottom-8 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-sky-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
  <div>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400"><Tag className="h-3 w-3" /> {CHANNEL_LABELS[item.kenhBan]}</p>
        <h2 className="mt-2 text-xl font-bold leading-tight text-slate-900 dark:text-white line-clamp-2">{item.tenBangGia}</h2>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold border uppercase tracking-wider ${item.trangThai === 'dang-ap-dung' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : item.trangThai === 'nhap' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-200/50'}`}>{STATUS_LABELS[item.trangThai]}</span>
    </div>
    <div className="my-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50/80 p-4 text-sm border border-slate-100 dark:bg-slate-800/50 dark:border-slate-700/50">
      <div><p className="mb-1 text-xs font-medium text-slate-500">Thời hạn áp dụng</p><p className="font-semibold text-slate-800 dark:text-slate-200">{item.tuNgay || "Không giới hạn"} {item.denNgay ? <><br/><span className="text-slate-400 text-[11px] font-normal">đến</span> {item.denNgay}</> : ""}</p></div>
      <div><p className="mb-1 text-xs font-medium text-slate-500">Quy mô thiết lập</p><p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">{count}</span> dòng giá</p></div>
    </div>
  </div>
  <div className="mt-2 flex gap-2">
    <button onClick={() => setDetailListId(item.id)} className="group/btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95"><ListPlus className="h-4 w-4 transition-transform group-hover/btn:scale-110" /> Chi tiết & Cập nhật</button>
    <button onClick={() => { setEditingList(item); setShowListForm(true); }} className="flex items-center justify-center rounded-xl bg-slate-100 px-3.5 py-2.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white" title="Sửa thông tin"><Edit2 className="h-4 w-4" /></button>
    <button onClick={() => { if (confirm(`Xóa bảng giá ${item.tenBangGia}?`)) void xoaBangGia(item.id); }} className="flex items-center justify-center rounded-xl bg-rose-50 px-3.5 py-2.5 text-rose-600 transition-colors hover:bg-rose-100 hover:text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20" title="Xóa bảng giá"><Trash2 className="h-4 w-4" /></button>
  </div>
</article>; })}</section>}

    <CrudModal open={showListForm} onClose={() => setShowListForm(false)} title={editingList ? "Sửa bảng giá" : "Tạo bảng giá"} fields={listFields} initial={listInitial} onSubmit={async (values) => { const tenBangGia = values.tenBangGia.trim(); if (values.tuNgay && values.denNgay && values.denNgay < values.tuNgay) throw new Error("Đến ngày phải bằng hoặc sau Từ ngày."); if (bangGia.some((item) => item.id !== editingList?.id && item.tenBangGia.trim().toLocaleLowerCase("vi") === tenBangGia.toLocaleLowerCase("vi") && item.kenhBan === values.kenhBan)) throw new Error("Tên bảng giá đã tồn tại trong kênh bán này."); const data = { tenBangGia, kenhBan: values.kenhBan as KenhBan, tuNgay: values.tuNgay || undefined, denNgay: values.denNgay || undefined, trangThai: values.trangThai as TrangThaiBangGia, ghiChu: values.ghiChu?.trim() || undefined }; if (editingList) await suaBangGia(editingList.id, data); else await themBangGia(data); }} />

    {selectedList && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"><div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setDetailListId(null)} /><div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/50 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 dark:bg-slate-900 dark:ring-slate-800"><div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/20"><div><div className="flex items-center gap-2"><span className="rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">{CHANNEL_LABELS[selectedList.kenhBan]}</span><span className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${selectedList.trangThai === 'dang-ap-dung' ? 'bg-emerald-100 text-emerald-700' : selectedList.trangThai === 'nhap' ? 'bg-slate-200 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>{STATUS_LABELS[selectedList.trangThai]}</span></div><h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{selectedList.tenBangGia}</h2></div><button onClick={() => setDetailListId(null)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"><svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div><div className="flex-1 overflow-y-auto p-6">
      {selectedDetails.length === 0 ? <div className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center transition-all hover:border-indigo-300 hover:bg-indigo-50/30 dark:border-slate-800 dark:bg-slate-900/50"><div className="mb-4 rounded-full bg-indigo-100 p-4 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"><PackageSearch className="h-8 w-8" /></div><p className="text-lg font-bold text-slate-900 dark:text-white">Chưa có dòng giá nào</p><p className="mt-1 max-w-sm text-sm text-slate-500">Hãy thêm dòng giá cho các sản phẩm trong danh mục để bắt đầu thiết lập bảng giá này.</p></div> : <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800"><div className="overflow-x-auto"><table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 dark:bg-slate-800/50"><tr className="text-slate-500 dark:text-slate-400"><th className="px-4 py-3 font-medium w-16 text-center">Hình ảnh</th><th className="px-4 py-3 font-medium">Sản phẩm</th><th className="px-4 py-3 font-medium">Biến thể / SKU</th><th className="px-4 py-3 font-medium">Ngưỡng số lượng</th><th className="px-4 py-3 font-medium text-right">Đơn giá bán</th><th className="px-4 py-3 font-medium text-right w-24">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{selectedDetails.map((detail) => { const product = productsById.get(detail.maSP); const variant = product?.dsMau.find((item) => item.maSKU === detail.maSKUBienThe); const imgUrl = variant?.img || product?.hinhAnh || ""; return <tr key={detail.id} className="group/row bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/50"><td className="px-4 py-3 text-center">{imgUrl ? <img src={imgUrl} alt="Thumb" onClick={() => setPreviewImage(imgUrl)} className="inline-block h-11 w-11 min-w-11 rounded-lg object-cover ring-1 ring-slate-200 shadow-sm transition-all hover:scale-110 hover:shadow-md hover:ring-indigo-300 cursor-zoom-in dark:ring-slate-700" title="Nhấn để phóng lớn" /> : <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"><Tag className="h-5 w-5" /></div>}</td><td className="px-4 py-3"><p className="font-bold text-slate-900 dark:text-white">{detail.maSP}</p><p className="text-xs text-slate-500 max-w-[200px] truncate" title={product?.tenSP}>{product?.tenSP || "Sản phẩm không còn trong danh mục"}</p></td><td className="px-4 py-3">{detail.maSKUBienThe ? <div className="flex items-center gap-2"><span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{detail.maSKUBienThe}</span><span className="text-xs text-slate-500">{variant?.ten}</span></div> : <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">Tất cả biến thể</span>}</td><td className="px-4 py-3"><div className="flex items-center gap-1.5 font-medium"><span className="text-slate-900 dark:text-white">{detail.soLuongTu}</span> {detail.soLuongDen ? <><span className="text-slate-400">→</span> <span className="text-slate-900 dark:text-white">{detail.soLuongDen}</span></> : <span className="text-slate-500">trở lên</span>}</div></td><td className="px-4 py-3 text-right"><span className="inline-block rounded-lg bg-emerald-50 px-3 py-1.5 font-black text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{formatVND(detail.giaBan)}</span></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 transition-opacity group-hover/row:opacity-100"><button onClick={() => { setEditingDetail(detail); setShowDetailForm(true); }} className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800" title="Sửa dòng giá"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (confirm("Xóa dòng giá này?")) void xoaChiTiet(detail.id); }} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20" title="Xóa dòng giá"><Trash2 className="h-4 w-4" /></button></div></td></tr>; })}</tbody></table></div></div>}
      <div className="flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
        <button onClick={() => { setEditingDetail(null); setShowDetailForm(true); }} disabled={loadingProducts || dsSanPham.length === 0} className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-5 w-5 transition-transform group-hover:rotate-90" /> Thêm dòng giá mới</button>
        {!loadingProducts && dsSanPham.length === 0 && <p className="text-sm text-rose-600 font-medium bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">⚠ Danh mục trống. Cần tạo sản phẩm trước.</p>}
      </div>
      <CrudModal open={showDetailForm} onClose={() => setShowDetailForm(false)} title={editingDetail ? "Sửa dòng giá" : "Thêm dòng giá"} fields={detailFields} initial={detailInitial} onSubmit={async (values) => { const product = productsById.get(values.maSP); if (!product) throw new Error("Sản phẩm không tồn tại trong danh mục."); const sku = values.maSKUBienThe || undefined; if (sku && !product.dsMau.some((variant) => variant.maSKU === sku)) throw new Error("SKU không thuộc sản phẩm đã chọn."); const giaBan = Number(values.giaBan); const soLuongTu = Number(values.soLuongTu); const soLuongDen = values.soLuongDen ? Number(values.soLuongDen) : undefined; if (!Number.isFinite(giaBan) || giaBan <= 0) throw new Error("Giá bán phải lớn hơn 0."); if (!Number.isInteger(soLuongTu) || soLuongTu < 1 || (soLuongDen !== undefined && (!Number.isInteger(soLuongDen) || soLuongDen < soLuongTu))) throw new Error("Khoảng số lượng không hợp lệ."); if (selectedDetails.some((item) => item.id !== editingDetail?.id && item.maSP === product.id && (item.maSKUBienThe || undefined) === sku && rangesOverlap(soLuongTu, soLuongDen, item.soLuongTu, item.soLuongDen))) throw new Error("Khoảng số lượng bị trùng với một dòng giá của cùng sản phẩm và biến thể."); const data = { bangGiaId: selectedList.id, maSP: product.id, maSKUBienThe: sku, giaBan, soLuongTu, soLuongDen, ghiChu: values.ghiChu?.trim() || undefined }; if (editingDetail) await suaChiTiet(editingDetail.id, data); else await themChiTiet(data); }} />
    </div></div></div>}
    {previewImage && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-in fade-in zoom-in-95 duration-200 cursor-zoom-out backdrop-blur-sm" onClick={() => setPreviewImage(null)}><img src={previewImage} alt="Preview" className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" /></div>}
  </div>;
}
