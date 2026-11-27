"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Plus, Edit3, Trash2, Package, Layers, CalendarDays, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { Portal } from "@/components/ui/Portal";
import {
  createKeHoach30Ngay,
  deleteKeHoach30Ngay,
  DINH_MUC_PHU_LIEU,
  fetchKeHoach30Ngay,
  fetchMauVaiOptions,
  fetchPhuLieuOptions,
  KE_HOACH_30_NGAY_CHANGED_EVENT,
  QUY_DOI_KG_PHU_LIEU,
  updateKeHoach30Ngay,
  type KeHoach30NgayItem,
  type SelectOption,
} from "@/lib/data/ke-hoach-30-ngay-store";
import { inPhieuDatVatTu } from "@/lib/phieu-dat-vat-tu-print";
import { uploadProductFile } from "@/lib/product-upload";

const LOAI_SP_OPTIONS = ["Bộ Trụ", "Áo Trụ lẻ", "Bộ Tròn", "Áo Tròn lẻ", "Quần", "Phụ kiện"];

function getColorHex(mau?: string): string {
  if (!mau) return "#ccc";
  const m = mau.toLowerCase();
  if (m.includes("trắng")) return "#f1f2f6";
  if (m.includes("đen")) return "#2f3542";
  if (m.includes("xám chì")) return "#57606f";
  if (m.includes("xám")) return "#a4b0be";
  if (m.includes("rêu")) return "#4b6584";
  if (m.includes("nâu") || m.includes("cacao") || m.includes("ca cao") || m.includes("bò")) return "#8b5a2b";
  if (m.includes("xanh đen") || m.includes("x.đen")) return "#0c2461";
  if (m.includes("đỏ")) return "#ff4757";
  if (m.includes("vàng") || m.includes("gừng") || m.includes("kem")) return "#eccc68";
  if (m.includes("xanh") || m.includes("x.nhớt") || m.includes("cổ vịt")) return "#1e90ff";
  if (m.includes("tím")) return "#9b59b6";
  if (m.includes("hồng") || m.includes("beige")) return "#ff9ff3";
  if (m.includes("cam")) return "#ffa502";
  return "#dfe4ea";
}

function fmtSo(n: number, soThapPhan = 0): string {
  return n.toLocaleString("vi-VN", { minimumFractionDigits: soThapPhan, maximumFractionDigits: soThapPhan });
}

function fmtTien(n?: number): string {
  if (!n) return "–";
  return n.toLocaleString("vi-VN") + "đ";
}

/** Hiển thị tên phụ liệu + số lượng tự tính theo định mức (vd: 2 cái/SP) ngay khi SL Kế Hoạch thay đổi. */
function renderPhuLieuCell(ten: string | undefined, loai: keyof typeof DINH_MUC_PHU_LIEU, slKeHoach: number): string {
  if (!ten) return "–";
  const dinhMuc = DINH_MUC_PHU_LIEU[loai];
  const soLuong = slKeHoach * dinhMuc;
  const quyDoi = QUY_DOI_KG_PHU_LIEU[loai];
  const kg = quyDoi ? ` (≈${(soLuong / quyDoi).toFixed(2)}kg)` : "";
  return `${ten} · ${fmtSo(soLuong)} cái${kg}`;
}

export function KeHoach30NgayView() {
  const [items, setItems] = useState<KeHoach30NgayItem[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KeHoach30NgayItem | null>(null);
  const [mauVaiOptions, setMauVaiOptions] = useState<SelectOption[]>([]);
  const [nutOptions, setNutOptions] = useState<SelectOption[]>([]);
  const [dayKeoOptions, setDayKeoOptions] = useState<SelectOption[]>([]);
  const [lungThunOptions, setLungThunOptions] = useState<SelectOption[]>([]);
  const [baoBiOptions, setBaoBiOptions] = useState<SelectOption[]>([]);
  const [nhanOptions, setNhanOptions] = useState<SelectOption[]>([]);
  const [theBaiOptions, setTheBaiOptions] = useState<SelectOption[]>([]);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  const refresh = async () => setItems(await fetchKeHoach30Ngay());

  useEffect(() => {
    void refresh();
    const handler = () => { void refresh(); };
    window.addEventListener(KE_HOACH_30_NGAY_CHANGED_EVENT, handler);
    return () => window.removeEventListener(KE_HOACH_30_NGAY_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    fetchMauVaiOptions().then(setMauVaiOptions);
    fetchPhuLieuOptions({ loaiChiTiet: "Nút" }).then(setNutOptions);
    fetchPhuLieuOptions({ tenChua: "Dây kéo" }).then(setDayKeoOptions);
    fetchPhuLieuOptions({ tenChua: "Thun" }).then(setLungThunOptions);
    fetchPhuLieuOptions({ loaiChiTiet: "Phụ liệu" }).then(setBaoBiOptions);
    fetchPhuLieuOptions({ tenChua: "Nhãn" }).then(setNhanOptions);
    fetchPhuLieuOptions({ tenChua: "Thẻ bài" }).then(setTheBaiOptions);
  }, []);

  const sorted = useMemo(() => [...items].sort((a, b) => a.thuTu - b.thuTu), [items]);

  const tongSP = sorted.reduce((s, i) => s + i.slKeHoach, 0);
  const tongVai = sorted.reduce((s, i) => s + i.slKeHoach * i.dmVaiChinh, 0);
  const tongBoCo = sorted.reduce((s, i) => s + i.slBoCo, 0);

  const theoLoai = useMemo(() => {
    const map = new Map<string, { sl: number; vai: number; bo: number; dm: number }>();
    sorted.forEach((i) => {
      const cur = map.get(i.loaiSP) || { sl: 0, vai: 0, bo: 0, dm: i.dmVaiChinh };
      cur.sl += i.slKeHoach;
      cur.vai += i.slKeHoach * i.dmVaiChinh;
      cur.bo += i.slBoCo;
      map.set(i.loaiSP, cur);
    });
    return Array.from(map.entries()).map(([loaiSP, v]) => ({ loaiSP, ...v }));
  }, [sorted]);

  const fields: FieldDef[] = useMemo(() => [
    { name: "maSP", label: "Mã SP", type: "text", required: true, placeholder: "B-14" },
    {
      name: "loaiSP", label: "Loại SP", type: "select", required: true,
      options: LOAI_SP_OPTIONS.map((v) => ({ value: v, label: v })),
    },
    { name: "hinhAnh", label: "Hình Ảnh Sản Phẩm", type: "image" },
    {
      name: "mauChinh", label: "Màu Chính (đại diện)", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...mauVaiOptions],
    },
    {
      name: "mauAo", label: "Màu Áo", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...mauVaiOptions],
      clearOnChange: ["mauBoCo"],
    },
    {
      name: "mauQuan", label: "Màu Quần", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...mauVaiOptions],
      clearOnChange: ["mauBoCo"],
    },
    {
      name: "kieuBoCo", label: "Bo Cổ", type: "select",
      options: [
        { value: "phoi", label: "Phối màu khác" },
        { value: "theo", label: "Theo màu áo/quần" },
      ],
      emptyLabel: "-- Chọn kiểu bo cổ --",
      clearOnChange: ["mauBoCo"],
    },
    {
      name: "mauBoCo", label: "Màu Bo Cổ", type: "select",
      options: (values) => {
        if (values.kieuBoCo === "theo") {
          const matchColor = values.mauAo || values.mauQuan;
          return matchColor ? [{ value: matchColor, label: `${matchColor} (theo áo/quần)` }] : [];
        }
        return mauVaiOptions;
      },
      disabled: (values) => values.kieuBoCo === "theo" && !(values.mauAo || values.mauQuan),
      emptyLabel: "— Không có —",
    },
    { name: "slKeHoach", label: "SL Kế Hoạch (SP)", type: "number", required: true, min: 0 },
    { name: "dmVaiChinh", label: "ĐM Vải Chính (kg/SP)", type: "number", required: true, min: 0, step: "any" },
    { name: "slBoCo", label: "SL Bo Cổ (cái)", type: "number", required: true, min: 0 },
    {
      name: "lungThun", label: "Lưng Thun", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...lungThunOptions],
    },
    {
      name: "dayKeo", label: "Dây Kéo", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...dayKeoOptions],
    },
    {
      name: "nut", label: "Nút", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...nutOptions],
    },
    {
      name: "baoBi", label: "Bao Bì", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...baoBiOptions],
    },
    {
      name: "nhan", label: "Nhãn", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...nhanOptions],
    },
    {
      name: "theBai", label: "Thẻ Bài", type: "select",
      options: [{ value: "", label: "— Không có —" }, ...theBaiOptions],
    },
    { name: "giaCongAo", label: "Giá Gia Công Áo (đ/sp)", type: "number", min: 0 },
    { name: "giaCongQuan", label: "Giá Gia Công Quần (đ/sp)", type: "number", min: 0 },
    { name: "nhipGiao", label: "Nhịp Giao / Ra Hàng", type: "text", placeholder: "Ngày 01 – 08" },
    { name: "ghiChu", label: "Ghi chú", type: "textarea", rows: 2 },
  ], [mauVaiOptions, nutOptions, dayKeoOptions, lungThunOptions, baoBiOptions, nhanOptions, theBaiOptions]);

  return (
    <div className="space-y-4 animate-fade-in w-full">
      {/* HEADER THƯƠNG HIỆU */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-5 md:p-6 text-white shadow-lg border border-emerald-600/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-200/90 mb-1 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" /> MIMIN ERP · POLOMIMIN
            </div>
            <h1 className="text-xl md:text-2xl font-black">Kế Hoạch Sản Xuất 30 Ngày</h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              Bảng kế hoạch đơn giản: Định mức vải chính (kg), Bo cổ tính theo số lượng (cái)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/15 border border-white/25 text-xs font-bold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Thời gian kế hoạch: 30 Ngày
            </div>
            <button
              type="button"
              onClick={() => {
                if (sorted.length === 0) { toast.info("Chưa có dòng kế hoạch nào để in"); return; }
                inPhieuDatVatTu(sorted);
              }}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> In Phiếu Đặt Vật Tư
            </button>
            <button
              type="button"
              onClick={() => { setEditing(null); setOpen(true); }}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm dòng
            </button>
          </div>
        </div>
      </div>

      {/* BẢNG CHÍNH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-2.5 text-center">STT</th>
                <th className="py-2.5 px-3 text-center">Ảnh</th>
                <th className="py-2.5 px-3">Mã SP</th>
                <th className="py-2.5 px-3">Loại SP</th>
                <th className="py-2.5 px-3">Màu Chính</th>
                <th className="py-2.5 px-3">Màu Áo</th>
                <th className="py-2.5 px-3">Màu Quần</th>
                <th className="py-2.5 px-3">Màu Bo Cổ</th>
                <th className="py-2.5 px-3 text-right">SL Kế Hoạch (SP)</th>
                <th className="py-2.5 px-3 text-right">ĐM Vải Chính (kg/SP)</th>
                <th className="py-2.5 px-3 text-right">Vải Chính Cần (kg)</th>
                <th className="py-2.5 px-3 text-right">SL Bo Cổ (cái)</th>
                <th className="py-2.5 px-3">Lưng Thun</th>
                <th className="py-2.5 px-3">Dây Kéo</th>
                <th className="py-2.5 px-3">Nút</th>
                <th className="py-2.5 px-3">Bao Bì</th>
                <th className="py-2.5 px-3">Nhãn</th>
                <th className="py-2.5 px-3">Thẻ Bài</th>
                <th className="py-2.5 px-3 text-right">Giá GC Áo</th>
                <th className="py-2.5 px-3 text-right">Giá GC Quần</th>
                <th className="py-2.5 px-3">Nhịp Giao / Ra Hàng</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={22} className="py-10 text-center text-slate-400">
                    Chưa có dòng kế hoạch nào. Bấm "Thêm dòng" để bắt đầu.
                  </td>
                </tr>
              ) : (
                sorted.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2 px-2.5 text-center font-bold text-slate-400">{index + 1}</td>
                    <td className="py-2 px-2.5 text-center">
                      {item.hinhAnh ? (
                        <img
                          src={item.hinhAnh}
                          alt={item.maSP}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 mx-auto cursor-zoom-in"
                          onClick={() => setZoomImg(item.hinhAnh!)}
                        />
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{item.maSP}</td>
                    <td className="py-2 px-3 font-semibold">{item.loaiSP}</td>
                    <td className="py-2 px-3">
                      {item.mauChinh ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                            style={{ backgroundColor: getColorHex(item.mauChinh) }}
                          />
                          {item.mauChinh}
                        </span>
                      ) : (
                        "–"
                      )}
                    </td>
                    <td className="py-2 px-3">{item.mauAo || "–"}</td>
                    <td className="py-2 px-3">{item.mauQuan || "–"}</td>
                    <td className="py-2 px-3">{item.mauBoCo || "–"}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{fmtSo(item.slKeHoach)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(item.dmVaiChinh, 2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {fmtSo(item.slKeHoach * item.dmVaiChinh, 1)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(item.slBoCo)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.lungThun, "lungThun", item.slKeHoach)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.dayKeo, "dayKeo", item.slKeHoach)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.nut, "nut", item.slKeHoach)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.baoBi, "baoBi", item.slKeHoach)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.nhan, "nhan", item.slKeHoach)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{renderPhuLieuCell(item.theBai, "theBai", item.slKeHoach)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtTien(item.giaCongAo)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtTien(item.giaCongQuan)}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{item.nhipGiao || "–"}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setEditing(item); setOpen(true); }}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                          title="Sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm(`Xóa dòng ${item.maSP} - ${item.mauAo}?`)) return;
                            try {
                              await deleteKeHoach30Ngay(item.id);
                              await refresh();
                              toast.success("Đã xóa dòng kế hoạch");
                            } catch (error: unknown) {
                              toast.error(error instanceof Error ? error.message : "Không xóa được");
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {sorted.length > 0 && (
              <tfoot className="bg-emerald-50 dark:bg-emerald-950/40 font-black text-xs border-t-2 border-emerald-200 dark:border-emerald-900">
                <tr>
                  <td colSpan={8} className="py-3 px-4 text-emerald-900 dark:text-emerald-300">TỔNG</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300">{fmtSo(tongSP)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">–</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300">{fmtSo(tongVai, 1)}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300">{fmtSo(tongBoCo)}</td>
                  <td colSpan={8} className="py-3 px-3 text-slate-400">–</td>
                  <td colSpan={2} className="py-3 px-3 text-emerald-700 dark:text-emerald-400">Trọn 30 Ngày</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {sorted.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* TỔNG HỢP THEO LOẠI SẢN PHẨM */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 font-bold text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" /> Tổng hợp theo loại sản phẩm
            </div>
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500">
                <tr>
                  <th className="py-2 px-3 text-left">Loại SP</th>
                  <th className="py-2 px-3 text-right">Số lượng (SP)</th>
                  <th className="py-2 px-3 text-right">ĐM vải chính</th>
                  <th className="py-2 px-3 text-right">Vải chính cần (kg)</th>
                  <th className="py-2 px-3 text-right">SL Bo cổ (cái)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {theoLoai.map((r) => (
                  <tr key={r.loaiSP}>
                    <td className="py-2 px-3 font-semibold">{r.loaiSP}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(r.sl)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(r.dm, 2)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(r.vai, 1)}</td>
                    <td className="py-2 px-3 text-right font-mono">{fmtSo(r.bo)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 dark:bg-emerald-950/30 font-black">
                  <td className="py-2 px-3">TỔNG</td>
                  <td className="py-2 px-3 text-right font-mono">{fmtSo(tongSP)}</td>
                  <td className="py-2 px-3 text-right text-slate-400">–</td>
                  <td className="py-2 px-3 text-right font-mono">{fmtSo(tongVai, 1)}</td>
                  <td className="py-2 px-3 text-right font-mono">{fmtSo(tongBoCo)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* KẾT QUẢ TỔNG HỢP (KPI) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
            <div className="font-bold text-sm flex items-center gap-2 mb-3">
              <CalendarDays className="w-4 h-4 text-emerald-600" /> Kết quả tổng hợp
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{fmtSo(tongSP)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tổng sản lượng (SP)</div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{fmtSo(tongVai, 1)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Vải chính cần (kg)</div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">{fmtSo(tongBoCo)}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Bo cổ cần (cái)</div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">30</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Thời gian (ngày)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CrudModal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? `Sửa dòng: ${editing.maSP}` : "Thêm dòng kế hoạch 30 ngày"}
        fields={fields}
        onImageUpload={(file) => uploadProductFile(file, "ke-hoach-30-ngay")}
        initial={
          editing
            ? {
                maSP: editing.maSP,
                loaiSP: editing.loaiSP,
                hinhAnh: editing.hinhAnh || "",
                mauChinh: editing.mauChinh || "",
                mauAo: editing.mauAo || "",
                mauQuan: editing.mauQuan || "",
                kieuBoCo:
                  editing.mauBoCo && (editing.mauBoCo === editing.mauAo || editing.mauBoCo === editing.mauQuan)
                    ? "theo"
                    : "phoi",
                mauBoCo: editing.mauBoCo || "",
                slKeHoach: String(editing.slKeHoach),
                dmVaiChinh: String(editing.dmVaiChinh),
                slBoCo: String(editing.slBoCo),
                lungThun: editing.lungThun || "",
                dayKeo: editing.dayKeo || "",
                nut: editing.nut || "",
                baoBi: editing.baoBi || "",
                nhan: editing.nhan || "",
                theBai: editing.theBai || "",
                giaCongAo: editing.giaCongAo !== undefined ? String(editing.giaCongAo) : "",
                giaCongQuan: editing.giaCongQuan !== undefined ? String(editing.giaCongQuan) : "",
                nhipGiao: editing.nhipGiao || "",
                ghiChu: editing.ghiChu || "",
              }
            : {}
        }
        onSubmit={async (values) => {
          const payload = {
            thuTu: editing?.thuTu ?? items.length + 1,
            maSP: values.maSP.trim(),
            loaiSP: values.loaiSP.trim(),
            hinhAnh: values.hinhAnh || "",
            mauChinh: values.mauChinh || "",
            mauAo: values.mauAo || "",
            mauQuan: values.mauQuan || "",
            mauBoCo: values.mauBoCo || "",
            slKeHoach: Number(values.slKeHoach),
            dmVaiChinh: Number(values.dmVaiChinh),
            slBoCo: Number(values.slBoCo),
            lungThun: values.lungThun || "",
            dayKeo: values.dayKeo || "",
            nut: values.nut || "",
            baoBi: values.baoBi || "",
            nhan: values.nhan || "",
            theBai: values.theBai || "",
            giaCongAo: values.giaCongAo ? Number(values.giaCongAo) : undefined,
            giaCongQuan: values.giaCongQuan ? Number(values.giaCongQuan) : undefined,
            nhipGiao: values.nhipGiao || "",
            ghiChu: values.ghiChu || "",
          };
          if (editing) {
            await updateKeHoach30Ngay(editing.id, payload);
          } else {
            await createKeHoach30Ngay(payload);
          }
          await refresh();
        }}
        submitLabel={editing ? "Lưu thay đổi" : "Thêm dòng"}
      />

      {zoomImg && (
        <Portal>
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setZoomImg(null)}
          >
            <button
              type="button"
              className="absolute right-5 top-5 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
              onClick={() => setZoomImg(null)}
              aria-label="Đóng"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomImg}
              alt="Ảnh sản phẩm"
              className="max-h-[88vh] max-w-[94vw] rounded-2xl object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        </Portal>
      )}
    </div>
  );
}
