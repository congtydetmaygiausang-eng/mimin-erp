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
    <div className="card shadow-sm">
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full min-w-[1050px] text-sm tabular-nums border-collapse">
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

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden flex flex-col gap-4 p-2">
        {filteredVT.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Chưa có phụ liệu</div>
        ) : (
          filteredVT.map((item) => {
            const status = dsTrangThai.find((value) => value.maVT === item.maVT);
            if (!status) return null;
            const image = inventoryImages[item.maVT] || item.hinhAnh;
            const editing = editingVT === item.maVT;

            return (
              <div key={item.maVT} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center relative">
                    <button type="button" onClick={() => onUploadImage(item.maVT)} className="absolute inset-0 w-full h-full text-violet-500 bg-violet-50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <Boxes className="w-5 h-5" />
                    </button>
                    {image ? <img src={image} alt={item.tenVT} className="h-full w-full object-cover" /> : <Boxes className="h-6 w-6 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editing ? (
                      <input className="input w-full mb-1" value={editForm.tenVT || ""} onChange={(event) => setEditForm({ ...editForm, tenVT: event.target.value })} />
                    ) : (
                      <div className="font-bold text-slate-800 truncate">{item.tenVT}</div>
                    )}
                    <div className="text-xs font-mono text-slate-500 mt-0.5">{item.maVT}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{item.loai}</span>
                      {item.mauSac && <span className="text-[10px] uppercase font-semibold text-slate-500 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{item.mauSac}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-white space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">Tồn kho / Tối thiểu</div>
                    <div className="text-right">
                      <span className={`font-black text-base ${status.canhBao ? "text-red-600" : "text-emerald-600"}`}>
                        {status.tonKho.toLocaleString("vi-VN")} {item.dvt}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">
                        / {status.tonToiThieu.toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">Đơn giá</div>
                    <div className="text-right">
                      {editing ? (
                        <input type="number" min={0} className="input w-28 text-right text-xs" value={editForm.donGia || 0} onChange={(event) => setEditForm({ ...editForm, donGia: Number(event.target.value) })} />
                      ) : (
                        <span className="font-semibold text-slate-700">{item.donGia.toLocaleString("vi-VN")} đ</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-500">Giá trị tồn</div>
                    <div className="text-right font-bold text-slate-800">{formatVND(status.giaTriTon)}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {status.canhBao ? <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">Tồn thấp</span> : <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">OK</span>}
                  </div>
                  <div className="flex justify-end gap-1.5">
                    {editing ? (
                      <>
                        <button type="button" onClick={() => onSaveEdit(item)} className="rounded bg-emerald-500 px-2.5 py-1.5 text-xs font-bold text-white">Lưu</button>
                        <button type="button" onClick={() => setEditingVT(null)} className="rounded bg-slate-200 px-2.5 py-1.5 text-xs font-bold">Hủy</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setEditingVT(item.maVT); setEditForm({ tenVT: item.tenVT, donGia: item.donGia }); }} className="rounded bg-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-700">Sửa</button>
                        <button type="button" onClick={() => onShowXuat(item.maVT)} className="flex items-center gap-1 rounded bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-700"><Minus className="h-3 w-3" /> Xuất</button>
                        <button type="button" onClick={() => onShowNhap(item.maVT)} className="flex items-center gap-1 rounded bg-sky-500 px-2.5 py-1.5 text-xs font-bold text-white"><Plus className="h-3 w-3" /> Nhập</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
