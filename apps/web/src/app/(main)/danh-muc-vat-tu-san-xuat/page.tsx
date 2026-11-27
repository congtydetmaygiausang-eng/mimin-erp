"use client";

import { useMemo, useState } from "react";
import { Edit2, Image as ImageIcon, PackageSearch, Plus, Search, Trash2, LayoutGrid, Table as TableIcon, Layers, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { formatVND } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { useVatTuDatSanXuat } from "@/lib/data/vat-tu-dat-san-xuat-store";
import { uploadProductFile } from "@/lib/product-upload";
import type { VatTuDatSanXuat } from "@/lib/data/phieu-dat-ncc";

const numberValue = (value: string) => Math.max(0, Number(value) || 0);

const CATEGORIES = ["Tất cả", "Bo cổ", "Bo tay", "Dây dệt", "Nhãn", "Tem", "Bao bì", "Khác"];

export default function DanhMucVatTuSanXuatPage() {
  const { list, loading, themMau, suaMau, xoaMau } = useVatTuDatSanXuat();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modal, setModal] = useState<{ mode: "add" | "edit"; item?: VatTuDatSanXuat } | null>(null);

  const fields = useMemo<FieldDef[]>(() => [
    { name: "maMau", label: "Mã mẫu", type: "text", required: true, placeholder: "VD: VTSX-001", readOnly: modal?.mode === "edit" },
    { name: "tenMau", label: "Tên mẫu vật tư", type: "text", required: true, placeholder: "VD: Bo cổ dệt 2 sọc" },
    { name: "loai", label: "Loại vật tư", type: "select", required: true, options: ["Bo cổ", "Bo tay", "Dây dệt", "Nhãn", "Tem", "Bao bì", "Khác"].map((value) => ({ value, label: value })) },
    { name: "mauSac", label: "Màu sắc", type: "text", required: true },
    { name: "quyCach", label: "Quy cách sản xuất", type: "textarea", rows: 3, placeholder: "Kích thước, số sọc, loại sợi, độ co giãn..." },
    { name: "donVi", label: "Đơn vị", type: "select", required: true, options: ["bộ", "cái", "kg", "mét", "cuộn"].map((value) => ({ value, label: value })) },
    { name: "maNccMacDinh", label: "NCC mặc định", type: "select", options: nccList.map((ncc) => ({ value: ncc.ma_ncc, label: `${ncc.ma_ncc} · ${ncc.ten_ncc}` })) },
    { name: "giaMuaThamKhao", label: "Giá mua tham khảo", type: "number", min: 0 },
    { name: "giaBanDeXuat", label: "Giá bán đề xuất", type: "number", min: 0 },
    { name: "soLuongToiThieu", label: "Số lượng tối thiểu", type: "number", min: 0 },
    { name: "thoiGianSanXuat", label: "Thời gian sản xuất (ngày)", type: "number", min: 0 },
    { name: "phamVi", label: "Phạm vi mẫu", type: "select", required: true, options: [{ value: "dung-chung", label: "Dùng chung cho mọi khách" }, { value: "mau-rieng", label: "Mẫu riêng của khách" }] },
    { name: "maKhachHangSoHuu", label: "Khách hàng sở hữu mẫu", type: "select", options: khachHangList.map((kh) => ({ value: kh.maKH, label: `${kh.maKH} · ${kh.ten}` })) },
    { name: "hinhAnh", label: "Hình mẫu vật tư", type: "image" },
  ], [khachHangList, modal?.mode, nccList]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return list.filter((item) => {
      const matchCat = selectedCategory === "Tất cả" || item.loai === selectedCategory;
      const matchSearch = !keyword || [item.maMau, item.tenMau, item.loai, item.mauSac].some((value) => value.toLocaleLowerCase("vi").includes(keyword));
      return matchCat && matchSearch;
    });
  }, [list, search, selectedCategory]);

  const initial = (modal?.item ? {
    maMau: modal.item.maMau, tenMau: modal.item.tenMau, loai: modal.item.loai, mauSac: modal.item.mauSac,
    quyCach: modal.item.quyCach, donVi: modal.item.donVi, maNccMacDinh: modal.item.maNccMacDinh,
    giaMuaThamKhao: String(modal.item.giaMuaThamKhao), giaBanDeXuat: String(modal.item.giaBanDeXuat),
    soLuongToiThieu: String(modal.item.soLuongToiThieu), thoiGianSanXuat: String(modal.item.thoiGianSanXuat),
    phamVi: modal.item.dungChung ? "dung-chung" : "mau-rieng", maKhachHangSoHuu: modal.item.maKhachHangSoHuu,
    hinhAnh: modal.item.hinhAnh,
  } : { maMau: `VTSX-${String(list.length + 1).padStart(3, "0")}`, donVi: "bộ", phamVi: "dung-chung", thoiGianSanXuat: "7" }) as Record<string, string>;

  const save = async (values: Record<string, string>) => {
    const dungChung = values.phamVi === "dung-chung";
    if (!dungChung && !values.maKhachHangSoHuu) throw new Error("Mẫu riêng phải chọn khách hàng sở hữu");
    const duplicate = list.some((item) => item.maMau.toLocaleLowerCase() === values.maMau.trim().toLocaleLowerCase() && item.id !== modal?.item?.id);
    if (duplicate) throw new Error(`Mã mẫu ${values.maMau} đã tồn tại`);
    const data = { maMau: values.maMau.trim(), tenMau: values.tenMau.trim(), loai: values.loai, mauSac: values.mauSac.trim(), quyCach: values.quyCach || "", donVi: values.donVi, maNccMacDinh: values.maNccMacDinh || "", giaMuaThamKhao: numberValue(values.giaMuaThamKhao), giaBanDeXuat: numberValue(values.giaBanDeXuat), soLuongToiThieu: numberValue(values.soLuongToiThieu), thoiGianSanXuat: numberValue(values.thoiGianSanXuat), maKhachHangSoHuu: dungChung ? "" : values.maKhachHangSoHuu, hinhAnh: values.hinhAnh || "", dungChung, trangThai: "Đang dùng" as const };
    if (modal?.mode === "edit" && modal.item) await suaMau(modal.item.id, data);
    else await themMau(data);
  };

  const remove = async (item: VatTuDatSanXuat) => {
    if (!confirm(`Xóa mẫu "${item.tenMau}"?`)) return;
    await xoaMau(item.id);
    toast.success(`Đã xóa ${item.maMau}`);
  };

  const dungChungCount = list.filter((x) => x.dungChung).length;
  const mauRiengCount = list.filter((x) => !x.dungChung).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Executive Header Banner - Chuẩn Bảng Lương */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 border border-teal-800/60 p-5 sm:p-6 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            MIMIN ERP · QUẢN LÝ VẬT TƯ ĐẶT SẢN XUẤT
          </div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2.5 tracking-tight text-white">
            <PackageSearch className="w-7 h-7 text-teal-400" />
            Mẫu vật tư sản xuất
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Mẫu nhận đặt theo đơn xưởng & khách hàng (bo dệt, dây dệt, nhãn mác, bao bì).</span>
            <span className="text-slate-500">·</span>
            <span className="text-teal-400 font-medium">Tách biệt hoàn toàn với tồn Kho phụ liệu</span>
          </p>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Tạo mẫu sản xuất
          </button>
        </div>
      </div>

      {/* Unslopped KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng mẫu danh mục</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <PackageSearch className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-slate-900 dark:text-white">
            {list.length} <span className="text-xs font-normal text-slate-400">mẫu</span>
          </div>
          <div className="text-[11px] text-slate-400">Đang kích hoạt trong thư viện</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mẫu dùng chung</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-sky-600 dark:text-sky-400">
            {dungChungCount} <span className="text-xs font-normal text-slate-400">mẫu</span>
          </div>
          <div className="text-[11px] text-slate-400">Áp dụng cho mọi xưởng may</div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Mẫu riêng khách</span>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono tracking-tight my-1 text-indigo-600 dark:text-indigo-400">
            {mauRiengCount} <span className="text-xs font-normal text-slate-400">mẫu</span>
          </div>
          <div className="text-[11px] text-slate-400">Gắn liền với từng thương hiệu riêng</div>
        </div>
      </div>

      {/* Filter and View Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar tab-scroll-mobile max-w-full pb-0.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Loại:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedCategory === cat
                  ? "bg-slate-900 dark:bg-slate-800 text-white font-semibold shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center self-end sm:self-auto gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium transition ${viewMode === "grid"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              title="Xem dạng lưới thẻ"
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Thẻ
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium transition ${viewMode === "table"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              title="Xem dạng bảng"
            >
              <TableIcon className="w-3.5 h-3.5" /> Bảng
            </button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            placeholder="Tìm theo mã mẫu, tên, loại vật tư hoặc màu sắc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content: Grid or Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-xs text-slate-500 border border-slate-200/80 dark:border-slate-800">
          Đang tải danh mục mẫu sản xuất...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200/80 dark:border-slate-800">
          <PackageSearch className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
          <div className="mt-3 font-semibold text-slate-800 dark:text-slate-200 text-sm">
            Không tìm thấy mẫu vật tư nào
          </div>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc tạo mẫu mới.</p>
          <button
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition mt-4"
          >
            <Plus className="h-4 w-4" /> Tạo mẫu đầu tiên
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col hover:shadow-sm transition"
            >
              <div
                className="relative flex aspect-[16/10] items-center justify-center bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-zoom-in group"
                onClick={() => item.hinhAnh && setPreviewImage(item.hinhAnh)}
              >
                {item.hinhAnh ? (
                  <img
                    src={item.hinhAnh}
                    alt={item.tenMau}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                )}
                <span className="absolute top-2.5 right-2.5">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs ${item.dungChung
                      ? "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/40"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/40"
                      }`}
                  >
                    {item.dungChung ? "Dùng chung" : "Mẫu riêng"}
                  </span>
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{item.maMau}</div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.tenMau}</h2>
                  </div>
                </div>
                <div className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                    {item.loai}
                  </span>
                  <span>·</span>
                  <span>{item.mauSac}</span>
                  <span>·</span>
                  <span>{item.donVi}</span>
                </div>
                <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px]">Giá mua tham khảo</span>
                    <b className="block font-mono text-slate-800 dark:text-slate-200 mt-0.5">{formatVND(item.giaMuaThamKhao)}</b>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Giá bán đề xuất</span>
                    <b className="block font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{formatVND(item.giaBanDeXuat)}</b>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2 mt-auto">
                  <button
                    onClick={() => setModal({ mode: "edit", item })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => remove(item)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="Xóa mẫu"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-xs md:text-sm">
              <thead>
                <tr className="text-left bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-3 w-14 text-center">Hình ảnh</th>
                  <th className="p-3">Mã & Tên mẫu</th>
                  <th className="p-3">Phân loại</th>
                  <th className="p-3">Màu sắc</th>
                  <th className="p-3">Đơn vị</th>
                  <th className="p-3">Phạm vi</th>
                  <th className="p-3 text-right">Giá mua</th>
                  <th className="p-3 text-right">Giá bán đề xuất</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 text-center">
                      {item.hinhAnh ? (
                        <img
                          src={item.hinhAnh}
                          alt={item.tenMau}
                          onClick={() => setPreviewImage(item.hinhAnh)}
                          className="inline-block h-10 w-10 min-w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-xs hover:scale-110 transition-transform cursor-zoom-in"
                          title="Nhấn để phóng lớn"
                        />
                      ) : (
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <b className="block text-emerald-600 dark:text-emerald-400 font-mono text-xs">{item.maMau}</b>
                      <span className="font-semibold text-slate-900 dark:text-white">{item.tenMau}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
                        {item.loai}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{item.mauSac}</td>
                    <td className="p-3 text-slate-500 font-mono">{item.donVi}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${item.dungChung
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300"
                          : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                          }`}
                      >
                        {item.dungChung ? "Dùng chung" : "Mẫu riêng"}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatVND(item.giaMuaThamKhao)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatVND(item.giaBanDeXuat)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setModal({ mode: "edit", item })}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition"
                          title="Sửa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(item)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <CrudModal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.mode === "edit" ? "Sửa mẫu vật tư sản xuất" : "Tạo mẫu vật tư sản xuất"}
        fields={fields}
        initial={initial}
        onSubmit={save}
        submitLabel={modal?.mode === "edit" ? "Cập nhật mẫu" : "Lưu vào danh mục"}
        onImageUpload={(file) => uploadProductFile(file, "vat-tu-dat-san-xuat")}
      />
    </div>
  );
}