import { Boxes, Minus, Plus } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import type { KhoVai } from "@/lib/data/real-data";

interface InventoryTableProps {
  filteredVT: KhoVai[];
  dsTrangThai: { maVT: string; tonKho: number; tonToiThieu: number; canhBao: boolean; giaTriTon: number }[];
  inventoryImages: Record<string, string>;
  editingVT: string | null;
  editForm: Partial<KhoVai>;
  setEditingVT: (value: string | null) => void;
  setEditForm: (value: Partial<KhoVai>) => void;
  onSaveEdit: (value: KhoVai) => void;
  onUploadImage: (maVT: string) => void;
  onShowNhap: (maVT: string) => void;
  onShowXuat: (maVT: string) => void;
}

export function InventoryTable({ filteredVT, dsTrangThai, inventoryImages, editingVT, editForm, setEditingVT, setEditForm, onSaveEdit, onUploadImage, onShowNhap, onShowXuat }: InventoryTableProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1050px] text-sm tabular-nums">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3 text-left">Mã VT</th>
              <th className="p-3 text-left">Hình ảnh</th>
              <th className="p-3 text-left">Tên phụ liệu</th>
              <th className="p-3 text-left">Loại</th>
              <th className="p-3 text-left">Màu sắc</th>
              <th className="p-3 text-right">Tồn kho</th>
              <th className="p-3 text-right">Tồn tối thiểu</th>
              <th className="p-3 text-right">Đơn giá</th>
              <th className="p-3 text-right">Giá trị tồn</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredVT.length === 0 ? <tr><td colSpan={11} className="p-10 text-center text-slate-500">Chưa có phụ liệu</td></tr> : filteredVT.map((item) => {
              const status = dsTrangThai.find((value) => value.maVT === item.maVT);
              if (!status) return null;
              const image = inventoryImages[item.maVT] || item.hinhAnh;
              const editing = editingVT === item.maVT;
              return <tr key={item.maVT} className="border-b last:border-0 hover:bg-slate-50/70 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-200">{item.maVT}</td>
                <td className="p-3"><div className="group relative w-14"><button type="button" onClick={() => onUploadImage(item.maVT)} className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 text-violet-500 hover:border-violet-500" title="Tải ảnh phụ liệu lên">{image ? <img src={image} alt={item.tenVT} className="h-full w-full object-cover" /> : <Boxes className="h-6 w-6" />}</button>{image && <div className="pointer-events-none absolute left-16 top-1/2 z-50 hidden -translate-y-1/2 rounded-xl border-2 border-white bg-white p-1 shadow-2xl group-hover:block"><img src={image} alt={`Xem trước ${item.tenVT}`} className="h-48 w-48 max-w-none rounded-lg object-contain" /></div>}</div></td>
                <td className="p-3 font-semibold">{editing ? <input className="input w-48" value={editForm.tenVT || ""} onChange={(event) => setEditForm({ ...editForm, tenVT: event.target.value })} /> : item.tenVT}</td>
                <td className="p-3">{item.loai}</td>
                <td className="p-3">{item.mauSac || "-"}</td>
                <td className={`p-3 text-right font-black ${status.canhBao ? "text-red-600" : "text-emerald-600"}`}>{status.tonKho.toLocaleString("vi-VN")} {item.dvt}</td>
                <td className="p-3 text-right">{status.tonToiThieu.toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right">{editing ? <input type="number" min={0} className="input w-28 text-right" value={editForm.donGia || 0} onChange={(event) => setEditForm({ ...editForm, donGia: Number(event.target.value) })} /> : `${item.donGia.toLocaleString("vi-VN")} đ`}</td>
                <td className="p-3 text-right font-semibold">{formatVND(status.giaTriTon)}</td>
                <td className="p-3 text-center">{status.canhBao ? <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-600">Tồn thấp</span> : <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">OK</span>}</td>
                <td className="p-3"><div className="flex justify-end gap-1.5">{editing ? <><button type="button" onClick={() => onSaveEdit(item)} className="rounded bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white">Lưu</button><button type="button" onClick={() => setEditingVT(null)} className="rounded bg-slate-200 px-2.5 py-1.5 text-xs font-bold">Hủy</button></> : <><button type="button" onClick={() => { setEditingVT(item.maVT); setEditForm({ tenVT: item.tenVT, donGia: item.donGia }); }} className="rounded bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700">Sửa</button><button type="button" onClick={() => onShowXuat(item.maVT)} className="flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-700"><Minus className="h-3 w-3" /> Xuất</button><button type="button" onClick={() => onShowNhap(item.maVT)} className="flex items-center gap-1 rounded bg-sky-500 px-2.5 py-1.5 text-xs font-bold text-white"><Plus className="h-3 w-3" /> Nhập</button></>}</div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
