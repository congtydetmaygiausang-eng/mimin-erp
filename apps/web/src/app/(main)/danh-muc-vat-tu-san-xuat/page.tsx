"use client";

import { useMemo, useState } from "react";
import { Edit2, Image as ImageIcon, PackageSearch, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { formatVND } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { useVatTuDatSanXuat } from "@/lib/data/vat-tu-dat-san-xuat-store";
import { uploadProductFile } from "@/lib/product-upload";
import type { VatTuDatSanXuat } from "@/lib/data/phieu-dat-ncc";

const numberValue = (value: string) => Math.max(0, Number(value) || 0);

export default function DanhMucVatTuSanXuatPage() {
  const { list, loading, themMau, suaMau, xoaMau } = useVatTuDatSanXuat();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
  const [search, setSearch] = useState("");
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
    return list.filter((item) => !keyword || [item.maMau, item.tenMau, item.loai, item.mauSac].some((value) => value.toLocaleLowerCase("vi").includes(keyword)));
  }, [list, search]);

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

  return <div className="space-y-5 animate-fade-in">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl"><PackageSearch className="h-7 w-7 text-emerald-600" /> Danh mục vật tư đặt sản xuất</h1><p className="mt-1 text-sm text-slate-500">Mẫu nhận đặt cho xưởng/cửa hàng, tách biệt hoàn toàn với tồn Kho phụ liệu.</p></div><button onClick={() => setModal({ mode: "add" })} className="btn-primary"><Plus className="h-4 w-4" /> Tạo mẫu sản xuất</button></div>
    <div className="grid gap-3 sm:grid-cols-3"><Kpi label="Tổng mẫu" value={list.length} /><Kpi label="Mẫu dùng chung" value={list.filter((x) => x.dungChung).length} /><Kpi label="Mẫu riêng khách" value={list.filter((x) => !x.dungChung).length} /></div>
    <div className="card p-3"><div className="relative max-w-xl"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã mẫu, tên, loại hoặc màu..." /></div></div>
    {loading ? <div className="card p-10 text-center text-sm text-slate-500">Đang tải danh mục...</div> : filtered.length === 0 ? <div className="card p-10 text-center"><PackageSearch className="mx-auto h-10 w-10 text-slate-300" /><div className="mt-3 font-semibold">Chưa có mẫu vật tư đặt sản xuất</div><button onClick={() => setModal({ mode: "add" })} className="btn-primary mt-4"><Plus className="h-4 w-4" /> Tạo mẫu đầu tiên</button></div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((item) => <article key={item.id} className="card overflow-hidden"><div className="flex aspect-[16/9] items-center justify-center bg-slate-100 dark:bg-slate-800">{item.hinhAnh ? <img src={item.hinhAnh} alt={item.tenMau} className="h-full w-full object-cover" /> : <ImageIcon className="h-10 w-10 text-slate-400" />}</div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><div className="text-xs font-bold text-emerald-700">{item.maMau}</div><h2 className="font-bold">{item.tenMau}</h2></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.dungChung ? "bg-sky-100 text-sky-700" : "bg-violet-100 text-violet-700"}`}>{item.dungChung ? "Dùng chung" : "Mẫu riêng"}</span></div><div className="mt-2 text-xs text-slate-500">{item.loai} · {item.mauSac} · {item.donVi}</div><div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs dark:bg-white/5"><div><span className="text-slate-500">Giá mua</span><b className="block">{formatVND(item.giaMuaThamKhao)}</b></div><div><span className="text-slate-500">Giá bán đề xuất</span><b className="block text-emerald-700">{formatVND(item.giaBanDeXuat)}</b></div></div><div className="mt-3 flex justify-end gap-2"><button onClick={() => setModal({ mode: "edit", item })} className="btn-secondary px-3 py-2"><Edit2 className="h-4 w-4" /> Sửa</button><button onClick={() => remove(item)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></div></article>)}</div>}
    <CrudModal open={Boolean(modal)} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Sửa mẫu vật tư sản xuất" : "Tạo mẫu vật tư sản xuất"} fields={fields} initial={initial} onSubmit={save} submitLabel={modal?.mode === "edit" ? "Cập nhật mẫu" : "Lưu vào danh mục"} onImageUpload={(file) => uploadProductFile(file, "vat-tu-dat-san-xuat")} />
  </div>;
}

function Kpi({ label, value }: { label: string; value: number }) { return <div className="card p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></div>; }
