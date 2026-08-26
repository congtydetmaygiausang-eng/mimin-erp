"use client";

import { useMemo, useState } from "react";
import { Edit2, ListPlus, Plus, Tag, Trash2 } from "lucide-react";
import { CrudModal } from "@/components/ui/CrudModal";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { KENH_BAN, type BangGia, type BangGiaChiTiet, type KenhBan, type TrangThaiBangGia, useBangGia } from "@/lib/data/bang-gia-store";

const CHANNEL_LABELS: Record<KenhBan, string> = {
  "ban-le": "Bán lẻ",
  "ban-si": "Bán sỉ",
  "ban-lo": "Bán lô",
  tiktok: "TikTok Shop",
  shopee: "Shopee",
};

const STATUS_LABELS: Record<TrangThaiBangGia, string> = {
  nhap: "Bản nháp",
  "dang-ap-dung": "Đang áp dụng",
  "ngung-ap-dung": "Ngừng áp dụng",
};

function money(value: number) {
  return `${value.toLocaleString("vi-VN")} đ`;
}

export default function BangGiaPage() {
  const { bangGia, chiTiet, loading, themBangGia, suaBangGia, xoaBangGia, themChiTiet, suaChiTiet, xoaChiTiet } = useBangGia();
  const { dsSanPham } = useDanhMucSP();
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<BangGia | null>(null);
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [editingDetail, setEditingDetail] = useState<BangGiaChiTiet | null>(null);

  const selectedList = bangGia.find((item) => item.id === detailListId) || null;
  const selectedDetails = useMemo(() => chiTiet.filter((item) => item.bangGiaId === detailListId), [chiTiet, detailListId]);
  const productOptions = dsSanPham.map((product) => ({ value: product.id, label: `${product.id} - ${product.tenSP}` }));
  const listInitial: Record<string, string> = editingList ? {
    tenBangGia: editingList.tenBangGia,
    kenhBan: editingList.kenhBan,
    tuNgay: editingList.tuNgay || "",
    denNgay: editingList.denNgay || "",
    trangThai: editingList.trangThai,
    ghiChu: editingList.ghiChu || "",
  } : {
    tenBangGia: "",
    kenhBan: "ban-le",
    trangThai: "dang-ap-dung",
  };
  const detailInitial: Record<string, string> = editingDetail ? {
    maSP: editingDetail.maSP,
    maSKUBienThe: editingDetail.maSKUBienThe || "",
    giaBan: String(editingDetail.giaBan),
    soLuongTu: String(editingDetail.soLuongTu),
    soLuongDen: editingDetail.soLuongDen == null ? "" : String(editingDetail.soLuongDen),
    ghiChu: editingDetail.ghiChu || "",
  } : { maSP: "", giaBan: "0", soLuongTu: "1", soLuongDen: "" };

  return (
    <div className="space-y-5 animate-fade-in">
      <section className="rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold"><Tag className="h-4 w-4" /> MIMIN ERP · Bán hàng</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Bảng giá bán</h1>
            <p className="mt-2 text-sm">Quản lý giá theo kênh bán, sản phẩm, biến thể và số lượng.</p>
          </div>
          <button onClick={() => { setEditingList(null); setShowListForm(true); }} className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-3 font-bold hover:bg-white/30"><Plus className="h-5 w-5" /> Tạo bảng giá</button>
        </div>
      </section>

      {loading ? <section className="card p-12 text-center text-slate-500">Đang tải bảng giá...</section> : bangGia.length === 0 ? <section className="card p-12 text-center text-slate-500"><Tag className="mx-auto mb-3 h-10 w-10 opacity-30" /><p className="font-bold">Chưa có bảng giá</p><p className="mt-1 text-sm">Tạo bảng giá đầu tiên cho từng kênh bán.</p></section> : <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {bangGia.map((item) => {
          const count = chiTiet.filter((detail) => detail.bangGiaId === item.id).length;
          return <article key={item.id} className="card p-5">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-amber-600">{CHANNEL_LABELS[item.kenhBan]}</p><h2 className="mt-1 text-lg font-black text-slate-900">{item.tenBangGia}</h2></div><span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{STATUS_LABELS[item.trangThai]}</span></div>
            <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm"><div><p className="text-slate-400">Thời hạn</p><b>{item.tuNgay || "Không giới hạn"} {item.denNgay ? `→ ${item.denNgay}` : ""}</b></div><div><p className="text-slate-400">Mức giá</p><b>{count} dòng</b></div></div>
            <div className="flex gap-2"><button onClick={() => setDetailListId(item.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-white"><ListPlus className="h-3 w-3" /> Chi tiết giá</button><button onClick={() => { setEditingList(item); setShowListForm(true); }} className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600" title="Sửa"><Edit2 className="h-4 w-4" /></button><button onClick={() => { if (confirm(`Xóa bảng giá ${item.tenBangGia}?`)) void xoaBangGia(item.id); }} className="rounded-lg bg-red-50 px-3 py-2 text-red-700" title="Xóa"><Trash2 className="h-4 w-4" /></button></div>
          </article>;
        })}
      </section>}

      <CrudModal open={showListForm} onClose={() => setShowListForm(false)} title={editingList ? "Sửa bảng giá" : "Tạo bảng giá"} fields={[
        { name: "tenBangGia", label: "Tên bảng giá", type: "text", required: true, placeholder: "VD: Giá bán sỉ tháng 08/2026" },
        { name: "kenhBan", label: "Kênh bán", type: "select", required: true, options: KENH_BAN.map((channel) => ({ value: channel, label: CHANNEL_LABELS[channel] })) },
        { name: "tuNgay", label: "Từ ngày", type: "date" }, { name: "denNgay", label: "Đến ngày", type: "date" },
        { name: "trangThai", label: "Trạng thái", type: "select", options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })) },
        { name: "ghiChu", label: "Ghi chú", type: "textarea" },
      ]} initial={listInitial} onSubmit={async (values) => {
        const data = { tenBangGia: values.tenBangGia, kenhBan: values.kenhBan as KenhBan, tuNgay: values.tuNgay || undefined, denNgay: values.denNgay || undefined, trangThai: values.trangThai as TrangThaiBangGia, ghiChu: values.ghiChu || undefined };
        if (editingList) await suaBangGia(editingList.id, data); else await themBangGia(data);
        setShowListForm(false);
      }} />

      {selectedList && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/40" onClick={() => setDetailListId(null)} /><div className="relative card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-5">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-amber-600">{CHANNEL_LABELS[selectedList.kenhBan]}</p><h2 className="text-xl font-black">{selectedList.tenBangGia}</h2></div><button onClick={() => setDetailListId(null)} className="btn-secondary">Đóng</button></div>
        <div className="mb-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">Mã SP</th><th className="p-2">SKU biến thể</th><th className="p-2">Số lượng</th><th className="p-2">Giá bán</th><th className="p-2" /></tr></thead><tbody>{selectedDetails.map((detail) => <tr key={detail.id} className="border-b"><td className="p-2 font-bold">{detail.maSP}</td><td className="p-2">{detail.maSKUBienThe || "Tất cả biến thể"}</td><td className="p-2">{detail.soLuongTu} {detail.soLuongDen ? `- ${detail.soLuongDen}` : "+"}</td><td className="p-2 font-bold text-emerald-600">{money(detail.giaBan)}</td><td className="p-2 text-right"><button onClick={() => { setEditingDetail(detail); setShowDetailForm(true); }} className="mr-2 text-amber-600">Sửa</button><button onClick={() => void xoaChiTiet(detail.id)} className="text-red-600">Xóa</button></td></tr>)}</tbody></table></div>
        <button onClick={() => { setEditingDetail(null); setShowDetailForm(true); }} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Thêm dòng giá</button>
        <CrudModal open={showDetailForm} onClose={() => setShowDetailForm(false)} title={editingDetail ? "Sửa dòng giá" : "Thêm dòng giá"} fields={[{ name: "maSP", label: "Sản phẩm", type: "select", required: true, options: productOptions }, { name: "maSKUBienThe", label: "SKU biến thể (không bắt buộc)", type: "text", placeholder: "VD: M758-DEN-L" }, { name: "giaBan", label: "Giá bán", type: "number", min: 0, required: true }, { name: "soLuongTu", label: "Từ số lượng", type: "number", min: 1, required: true }, { name: "soLuongDen", label: "Đến số lượng", type: "number", min: 1 }, { name: "ghiChu", label: "Ghi chú", type: "textarea" }]} initial={detailInitial} onSubmit={async (values) => {
          const data = { bangGiaId: selectedList.id, maSP: values.maSP, maSKUBienThe: values.maSKUBienThe || undefined, giaBan: Number(values.giaBan), soLuongTu: Number(values.soLuongTu), soLuongDen: values.soLuongDen ? Number(values.soLuongDen) : undefined, ghiChu: values.ghiChu || undefined };
          if (editingDetail) await suaChiTiet(editingDetail.id, data); else await themChiTiet(data);
          setShowDetailForm(false);
        }} />
      </div></div>}
    </div>
  );
}
