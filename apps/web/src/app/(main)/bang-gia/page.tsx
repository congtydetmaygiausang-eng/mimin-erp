"use client";

import { useMemo, useState } from "react";
import { Edit2, ListPlus, PackageSearch, Plus, Search, Tag, Trash2, Calendar, Layers, CheckCircle2 } from "lucide-react";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
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

const STATUS_STYLES: Record<TrangThaiBangGia, string> = {
  nhap: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  "dang-ap-dung": "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40",
  "ngung-ap-dung": "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40",
};

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

const rangesOverlap = (fromA: number, toA: number | undefined, fromB: number, toB: number | undefined) =>
  fromA <= (toB ?? Infinity) && fromB <= (toA ?? Infinity);

export default function BangGiaPage() {
  const { bangGia, chiTiet, loading, themBangGia, suaBangGia, xoaBangGia, themChiTiet, suaChiTiet, xoaChiTiet } = useBangGia();
  const { dsSanPham, loading: loadingProducts } = useDanhMucSP();
  const [showListForm, setShowListForm] = useState(false);
  const [editingList, setEditingList] = useState<BangGia | null>(null);
  const [detailListId, setDetailListId] = useState<string | null>(null);
  const [showDetailForm, setShowDetailForm] = useState(false);
  const [editingDetail, setEditingDetail] = useState<BangGiaChiTiet | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<"all" | KenhBan>("all");
  const [search, setSearch] = useState("");

  const selectedList = bangGia.find((item) => item.id === detailListId) || null;
  const selectedDetails = useMemo(
    () =>
      chiTiet
        .filter((item) => item.bangGiaId === detailListId)
        .sort(
          (a, b) =>
            a.maSP.localeCompare(b.maSP) ||
            (a.maSKUBienThe || "").localeCompare(b.maSKUBienThe || "") ||
            a.soLuongTu - b.soLuongTu
        ),
    [chiTiet, detailListId]
  );
  const productsById = useMemo(() => new Map(dsSanPham.map((product) => [product.id, product])), [dsSanPham]);
  const productOptions = useMemo(
    () => [...dsSanPham].sort((a, b) => a.id.localeCompare(b.id)).map((product) => ({ value: product.id, label: `${product.id} — ${product.tenSP}` })),
    [dsSanPham]
  );

  const filteredBangGia = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return bangGia.filter((item) => {
      const matchChannel = channelFilter === "all" || item.kenhBan === channelFilter;
      const matchSearch = !keyword || item.tenBangGia.toLowerCase().includes(keyword) || CHANNEL_LABELS[item.kenhBan].toLowerCase().includes(keyword);
      return matchChannel && matchSearch;
    });
  }, [bangGia, channelFilter, search]);

  const activeCount = bangGia.filter((item) => item.trangThai === "dang-ap-dung").length;
  const draftCount = bangGia.filter((item) => item.trangThai === "nhap").length;

  const listInitial: Record<string, string> = editingList
    ? {
        tenBangGia: editingList.tenBangGia,
        kenhBan: editingList.kenhBan,
        tuNgay: editingList.tuNgay || "",
        denNgay: editingList.denNgay || "",
        trangThai: editingList.trangThai,
        ghiChu: editingList.ghiChu || "",
      }
    : { tenBangGia: "", kenhBan: "ban-le", tuNgay: "", denNgay: "", trangThai: "nhap", ghiChu: "" };

  const detailInitial: Record<string, string> = editingDetail
    ? {
        maSP: editingDetail.maSP,
        maSKUBienThe: editingDetail.maSKUBienThe || "",
        giaBan: String(editingDetail.giaBan),
        soLuongTu: String(editingDetail.soLuongTu),
        soLuongDen: editingDetail.soLuongDen == null ? "" : String(editingDetail.soLuongDen),
        ghiChu: editingDetail.ghiChu || "",
      }
    : { maSP: "", maSKUBienThe: "", giaBan: "", soLuongTu: "1", soLuongDen: "", ghiChu: "" };

  const listFields: FieldDef[] = [
    { name: "tenBangGia", label: "Tên bảng giá", type: "text", required: true, placeholder: "VD: Giá bán sỉ tháng 09/2026" },
    { name: "kenhBan", label: "Kênh bán", type: "select", required: true, options: KENH_BAN.map((channel) => ({ value: channel, label: CHANNEL_LABELS[channel] })) },
    { name: "tuNgay", label: "Từ ngày", type: "date" },
    { name: "denNgay", label: "Đến ngày", type: "date" },
    { name: "trangThai", label: "Trạng thái", type: "select", required: true, options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })) },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
  ];

  const detailFields: FieldDef[] = [
    {
      name: "maSP",
      label: "Sản phẩm trong danh mục",
      type: "select",
      required: true,
      options: productOptions,
      emptyLabel: loadingProducts ? "Đang tải danh mục..." : "-- Chọn sản phẩm --",
      clearOnChange: ["maSKUBienThe"],
    },
    {
      name: "maSKUBienThe",
      label: "Biến thể / SKU",
      type: "select",
      disabled: (values) => !values.maSP,
      emptyLabel: "Tất cả biến thể",
      options: (values) =>
        productsById
          .get(values.maSP)
          ?.dsMau.filter((variant) => variant.maSKU?.trim())
          .map((variant) => ({ value: variant.maSKU.trim(), label: `${variant.ten} — ${variant.maSKU.trim()}` })) || [],
    },
    { name: "giaBan", label: "Giá bán (VNĐ)", type: "number", min: 1, step: 1, required: true, placeholder: "VD: 150000" },
    { name: "soLuongTu", label: "Số lượng từ", type: "number", min: 1, step: 1, required: true },
    { name: "soLuongDen", label: "Số lượng đến (để trống nếu không giới hạn)", type: "number", min: 1, step: 1 },
    { name: "ghiChu", label: "Ghi chú", type: "textarea" },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Executive Header Banner - Chuẩn Bảng Lương */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border border-teal-800/60 text-white p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            MIMIN ERP · BÁN HÀNG & PHÂN PHỐI
          </div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Tag className="w-5 h-5" />
            </div>
            Bảng giá bán hàng
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1.5 max-w-2xl leading-relaxed">
            Thiết lập biểu giá chuẩn theo từng kênh (Bán lẻ, Bán sỉ, TikTok Shop, Shopee) và bậc thang số lượng.
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setEditingList(null);
              setShowListForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tạo bảng giá mới
          </button>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng bảng giá</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-slate-900 dark:text-white">
            {bangGia.length} <span className="text-xs font-normal text-slate-400">bảng</span>
          </div>
          <div className="text-[11px] text-slate-400">Đã cấu hình trên hệ thống</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Đang áp dụng</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-emerald-600 dark:text-emerald-400">
            {activeCount} <span className="text-xs font-normal text-slate-400">kênh</span>
          </div>
          <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium">Có hiệu lực tính giá đơn</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Bản nháp</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-amber-600 dark:text-amber-400">
            {draftCount} <span className="text-xs font-normal text-slate-400">bản</span>
          </div>
          <div className="text-[11px] text-slate-400">Đang soạn thảo chính sách</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tổng dòng giá SKU</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-sky-600 dark:text-sky-400">
            {chiTiet.length} <span className="text-xs font-normal text-slate-400">mức giá</span>
          </div>
          <div className="text-[11px] text-slate-400">Bậc thang theo số lượng</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile max-w-full pb-0.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Kênh bán:</span>
          {([
            { id: "all" as const, label: "Tất cả kênh" },
            { id: "ban-le" as const, label: "Bán lẻ" },
            { id: "ban-si" as const, label: "Bán sỉ" },
            { id: "ban-lo" as const, label: "Bán lô" },
            { id: "tiktok" as const, label: "TikTok Shop" },
            { id: "shopee" as const, label: "Shopee" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChannelFilter(tab.id)}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                channelFilter === tab.id
                  ? "bg-teal-600 text-white font-semibold shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
            placeholder="Tìm theo tên bảng giá hoặc kênh bán..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200/80 dark:border-slate-800">
          Đang tải bảng giá...
        </section>
      ) : filteredBangGia.length === 0 ? (
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
          <Tag className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Chưa có bảng giá phù hợp</p>
          <p className="mt-1 text-xs text-slate-400">Tạo bảng giá đầu tiên cho từng kênh bán để kích hoạt cơ chế báo giá tự động.</p>
          <button
            onClick={() => {
              setEditingList(null);
              setShowListForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs transition mt-4"
          >
            <Plus className="h-4 w-4" /> Tạo bảng giá
          </button>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredBangGia.map((item) => {
            const count = chiTiet.filter((detail) => detail.bangGiaId === item.id).length;
            return (
              <article
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-lg px-2.5 py-1 text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                      {CHANNEL_LABELS[item.kenhBan]}
                    </span>
                    <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[item.trangThai]}`}>
                      {STATUS_LABELS[item.trangThai]}
                    </span>
                  </div>
                  <h2 className="mt-2.5 text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.tenBangGia}
                  </h2>
                  {item.ghiChu && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{item.ghiChu}</p>}

                  <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Thời hạn
                      </p>
                      <b className="block mt-0.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {item.tuNgay || "Không giới hạn"} {item.denNgay ? `→ ${item.denNgay}` : ""}
                      </b>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[11px] flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-400" /> Mức giá
                      </p>
                      <b className="block mt-0.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        {count} dòng giá
                      </b>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => setDetailListId(item.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white py-2 text-xs font-semibold shadow-xs transition"
                  >
                    <ListPlus className="h-3.5 w-3.5 text-amber-400" /> Chi tiết mức giá
                  </button>
                  <button
                    onClick={() => {
                      setEditingList(item);
                      setShowListForm(true);
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                    title="Sửa bảng giá"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa bảng giá ${item.tenBangGia}?`)) void xoaBangGia(item.id);
                    }}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="Xóa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Modal Bảng Giá Form */}
      <CrudModal
        open={showListForm}
        onClose={() => setShowListForm(false)}
        title={editingList ? "Sửa bảng giá" : "Tạo bảng giá"}
        fields={listFields}
        initial={listInitial}
        onSubmit={async (values) => {
          const tenBangGia = values.tenBangGia.trim();
          if (values.tuNgay && values.denNgay && values.denNgay < values.tuNgay) {
            throw new Error("Đến ngày phải bằng hoặc sau Từ ngày.");
          }
          if (
            bangGia.some(
              (item) =>
                item.id !== editingList?.id &&
                item.tenBangGia.trim().toLocaleLowerCase("vi") === tenBangGia.toLocaleLowerCase("vi") &&
                item.kenhBan === values.kenhBan
            )
          ) {
            throw new Error("Tên bảng giá đã tồn tại trong kênh bán này.");
          }
          const data = {
            tenBangGia,
            kenhBan: values.kenhBan as KenhBan,
            tuNgay: values.tuNgay || undefined,
            denNgay: values.denNgay || undefined,
            trangThai: values.trangThai as TrangThaiBangGia,
            ghiChu: values.ghiChu?.trim() || undefined,
          };
          if (editingList) await suaBangGia(editingList.id, data);
          else await themBangGia(data);
        }}
      />

      {/* Modal Quản lý chi tiết giá */}
      {selectedList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setDetailListId(null)} />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-h-[90vh] w-full max-w-5xl overflow-y-auto p-5 md:p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="rounded-lg px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/40">
                  {CHANNEL_LABELS[selectedList.kenhBan]}
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1.5">{selectedList.tenBangGia}</h2>
              </div>
              <button onClick={() => setDetailListId(null)} className="btn-secondary text-xs">
                Đóng
              </button>
            </div>

            {selectedDetails.length === 0 ? (
              <div className="mb-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">
                <PackageSearch className="mx-auto mb-2 h-9 w-9 opacity-40 text-slate-400" />
                <p className="font-semibold text-sm">Chưa có dòng giá</p>
                <p className="text-xs text-slate-400 mt-1">Chọn sản phẩm từ danh mục để bắt đầu thiết lập biểu giá theo số lượng.</p>
              </div>
            ) : (
              <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full min-w-[650px] text-left text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="p-3 w-14 text-center">Hình ảnh</th>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3">Biến thể / SKU</th>
                      <th className="p-3">Ngưỡng số lượng</th>
                      <th className="p-3">Giá bán</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedDetails.map((detail) => {
                      const product = productsById.get(detail.maSP);
                      const variant = product?.dsMau.find((item) => item.maSKU === detail.maSKUBienThe);
                      const imgUrl = variant?.img || product?.hinhAnh || "";
                      return (
                        <tr key={detail.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3 text-center">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt="Thumb"
                                onClick={() => setPreviewImage(imgUrl)}
                                className="inline-block h-10 w-10 min-w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-xs hover:scale-110 transition-transform cursor-zoom-in"
                                title="Nhấn để phóng lớn"
                              />
                            ) : (
                              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 dark:bg-slate-800 text-slate-400">
                                <Tag className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <b className="font-mono text-xs text-slate-900 dark:text-white">{detail.maSP}</b>
                            <p className="text-xs text-slate-500">{product?.tenSP || "Sản phẩm không còn trong danh mục"}</p>
                          </td>
                          <td className="p-3">
                            {detail.maSKUBienThe ? (
                              <>
                                <b className="text-xs text-slate-800 dark:text-slate-200">{variant?.ten || "SKU"}</b>
                                <p className="text-[11px] font-mono text-slate-400">{detail.maSKUBienThe}</p>
                              </>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                                Tất cả biến thể
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {detail.soLuongTu} {detail.soLuongDen ? `– ${detail.soLuongDen}` : "+"}
                          </td>
                          <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatVND(detail.giaBan)}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingDetail(detail);
                                setShowDetailForm(true);
                              }}
                              className="mr-3 text-amber-600 hover:text-amber-500 font-medium text-xs"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Xóa dòng giá này?")) void xoaChiTiet(detail.id);
                              }}
                              className="text-rose-600 hover:text-rose-500 font-medium text-xs"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => {
                setEditingDetail(null);
                setShowDetailForm(true);
              }}
              disabled={loadingProducts || dsSanPham.length === 0}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 text-xs"
            >
              <Plus className="h-4 w-4" /> Thêm dòng giá
            </button>
            {!loadingProducts && dsSanPham.length === 0 && (
              <p className="mt-2 text-xs text-rose-600">
                Danh mục sản phẩm đang trống. Cần tạo sản phẩm trước khi thiết lập giá.
              </p>
            )}

            <CrudModal
              open={showDetailForm}
              onClose={() => setShowDetailForm(false)}
              title={editingDetail ? "Sửa dòng giá" : "Thêm dòng giá"}
              fields={detailFields}
              initial={detailInitial}
              onSubmit={async (values) => {
                const product = productsById.get(values.maSP);
                if (!product) throw new Error("Sản phẩm không tồn tại trong danh mục.");
                const sku = values.maSKUBienThe || undefined;
                if (sku && !product.dsMau.some((variant) => variant.maSKU === sku)) {
                  throw new Error("SKU không thuộc sản phẩm đã chọn.");
                }
                const giaBan = Number(values.giaBan);
                const soLuongTu = Number(values.soLuongTu);
                const soLuongDen = values.soLuongDen ? Number(values.soLuongDen) : undefined;
                if (!Number.isFinite(giaBan) || giaBan <= 0) throw new Error("Giá bán phải lớn hơn 0.");
                if (
                  !Number.isInteger(soLuongTu) ||
                  soLuongTu < 1 ||
                  (soLuongDen !== undefined && (!Number.isInteger(soLuongDen) || soLuongDen < soLuongTu))
                ) {
                  throw new Error("Khoảng số lượng không hợp lệ.");
                }
                if (
                  selectedDetails.some(
                    (item) =>
                      item.id !== editingDetail?.id &&
                      item.maSP === product.id &&
                      (item.maSKUBienThe || undefined) === sku &&
                      rangesOverlap(soLuongTu, soLuongDen, item.soLuongTu, item.soLuongDen)
                  )
                ) {
                  throw new Error("Khoảng số lượng bị trùng với một dòng giá của cùng sản phẩm và biến thể.");
                }
                const data = {
                  bangGiaId: selectedList.id,
                  maSP: product.id,
                  maSKUBienThe: sku,
                  giaBan,
                  soLuongTu,
                  soLuongDen,
                  ghiChu: values.ghiChu?.trim() || undefined,
                };
                if (editingDetail) await suaChiTiet(editingDetail.id, data);
                else await themChiTiet(data);
              }}
            />
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 animate-fade-in cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
          />
        </div>
      )}
    </div>
  );
}