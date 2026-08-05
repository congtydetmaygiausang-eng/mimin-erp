// ============ MASTER DATA (NCC + Xuong) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { Plus, Edit, Trash2, Phone, MapPin, Mail } from "lucide-react";
import { toast } from "sonner";
import { getAllNCC, getAllXuong, deleteNCC, deleteXuong, upsertNCC, upsertXuong, type NhaCungCap, type XuongGiaCong } from "@/lib/master-data";
import { F, Modal } from "./ui-blocks";

// ============ NCC LIST + FORM ============
function NCCList({ nccs, onEdit, onRefresh }: { nccs: NhaCungCap[]; onEdit: (n: NhaCungCap) => void; onRefresh: () => void }) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onEdit({ id: `NCC-${Date.now().toString().slice(-3)}`, maNCC: "", tenNCC: "", loai: "sợi",
          diaChi: "", sdt: "", email: "", maSoThue: "", nguoiLienHe: "", ghiChu: "",
          ngayTao: new Date().toISOString().slice(0, 10), trangThai: "Đang hợp tác" } as NhaCungCap)}
        className="btn-primary w-full bg-blue-500"
      >
        <Plus className="w-4 h-4 inline" /> Thêm NCC mới
      </button>
      {nccs.map((n: NhaCungCap) => (
        <div key={n.id} className="card p-3 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-sm">{n.tenNCC}</div>
              <div className="text-[10px] font-mono opacity-60">{n.maNCC}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(n)} className="text-xs p-1.5 rounded bg-blue-500 text-white">
                <Edit className="w-3 h-3" />
              </button>
              <button onClick={() => {
                if (confirm(`Xóa ${n.tenNCC}?`)) { deleteNCC(n.id); onRefresh(); toast.success("Đã xóa"); }
              }} className="text-xs p-1.5 rounded bg-rose-500 text-white">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-[10px] opacity-70 space-y-0.5">
            <div className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {n.sdt}</div>
            <div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {n.diaChi}</div>
            <div className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {n.email}</div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">{n.trangThai}</span>
            <span className="text-[10px] opacity-60">{n.loai}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function NCCForm({ ncc, onClose, onSave }: { ncc: NhaCungCap; onClose: () => void; onSave: () => void }) {
  const [data, setData] = useState(ncc);
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{ncc.tenNCC ? "Sửa" : "Thêm"} NCC</h3>
      <div className="grid grid-cols-2 gap-2">
        <F label="Mã NCC" v={data.maNCC} on={(v: any) => setData({ ...data, maNCC: v })} />
        <F label="Tên NCC" v={data.tenNCC} on={(v: any) => setData({ ...data, tenNCC: v })} />
        <F label="SĐT" v={data.sdt} on={(v: any) => setData({ ...data, sdt: v })} />
        <F label="Email" v={data.email} on={(v: any) => setData({ ...data, email: v })} />
        <F label="MST" v={data.maSoThue} on={(v: any) => setData({ ...data, maSoThue: v })} />
        <F label="Người LH" v={data.nguoiLienHe} on={(v: any) => setData({ ...data, nguoiLienHe: v })} />
        <F label="Địa chỉ" v={data.diaChi} on={(v: any) => setData({ ...data, diaChi: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Loại</label>
          <select value={data.loai} onChange={(e) => setData({ ...data, loai: e.target.value as any })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option value="sợi">Sợi</option>
            <option value="phụ liệu">Phụ liệu</option>
            <option value="hóa chất">Hóa chất</option>
          </select>
        </div>
        <F label="Ghi chú" v={data.ghiChu} on={(v: any) => setData({ ...data, ghiChu: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Trạng thái</label>
          <select value={data.trangThai} onChange={(e) => setData({ ...data, trangThai: e.target.value as any })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option>Đang hợp tác</option>
            <option>Tạm dừng</option>
            <option>Ngừng hợp tác</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={() => { upsertNCC(data); onSave(); toast.success("Đã lưu"); }} className="btn-primary flex-1 bg-blue-500">💾 Lưu</button>
      </div>
    </div>
  );
}

// ============ XUONG LIST + FORM ============
function XuongList({ xuongs, onEdit, onRefresh }: { xuongs: XuongGiaCong[]; onEdit: (x: XuongGiaCong) => void; onRefresh: () => void }) {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onEdit({ id: `XGC-${Date.now().toString().slice(-3)}`, maXuong: "", tenXuong: "",
          loai: "dệt", diaChi: "", sdt: "", email: "", maSoThue: "", nguoiLienHe: "",
          nangLuc: "", chatLuongTB: "Tốt", ghiChu: "",
          ngayTao: new Date().toISOString().slice(0, 10), trangThai: "Đang hợp tác" } as XuongGiaCong)}
        className="btn-primary w-full bg-violet-500"
      >
        <Plus className="w-4 h-4 inline" /> Thêm xưởng mới
      </button>
      {xuongs.map((x: XuongGiaCong) => (
        <div key={x.id} className="card p-3 bg-violet-50 dark:bg-violet-900/20">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="font-bold text-sm">{x.tenXuong}</div>
              <div className="text-[10px] font-mono opacity-60">{x.maXuong}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(x)} className="text-xs p-1.5 rounded bg-violet-500 text-white">
                <Edit className="w-3 h-3" />
              </button>
              <button onClick={() => {
                if (confirm(`Xóa ${x.tenXuong}?`)) { deleteXuong(x.id); onRefresh(); toast.success("Đã xóa"); }
              }} className="text-xs p-1.5 rounded bg-rose-500 text-white">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="text-[10px] opacity-70 space-y-0.5">
            <div className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {x.sdt}</div>
            <div>📍 {x.diaChi}</div>
            <div>🏭 Năng lực: {x.nangLuc} · Chất lượng: {x.chatLuongTB}</div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">{x.trangThai}</span>
            <span className="text-[10px] opacity-60 capitalize">{x.loai}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function XuongForm({ xuong, onClose, onSave }: { xuong: XuongGiaCong; onClose: () => void; onSave: () => void }) {
  const [data, setData] = useState(xuong);
  return (
    <div className="space-y-2">
      <h3 className="font-bold">{xuong.tenXuong ? "Sửa" : "Thêm"} xưởng</h3>
      <div className="grid grid-cols-2 gap-2">
        <F label="Mã xưởng" v={data.maXuong} on={(v: any) => setData({ ...data, maXuong: v })} />
        <F label="Tên xưởng" v={data.tenXuong} on={(v: any) => setData({ ...data, tenXuong: v })} />
        <F label="SĐT" v={data.sdt} on={(v: any) => setData({ ...data, sdt: v })} />
        <F label="Email" v={data.email} on={(v: any) => setData({ ...data, email: v })} />
        <F label="MST" v={data.maSoThue} on={(v: any) => setData({ ...data, maSoThue: v })} />
        <F label="Người LH" v={data.nguoiLienHe} on={(v: any) => setData({ ...data, nguoiLienHe: v })} />
        <F label="Địa chỉ" v={data.diaChi} on={(v: any) => setData({ ...data, diaChi: v })} />
        <F label="Năng lực" v={data.nangLuc} on={(v: any) => setData({ ...data, nangLuc: v })} />
        <div>
          <label className="text-xs font-semibold opacity-70">Loại</label>
          <select value={data.loai} onChange={(e) => setData({ ...data, loai: e.target.value as any })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option value="dệt">Dệt</option>
            <option value="nhuộm">Nhuộm</option>
            <option value="hoàn thiện">Hoàn thiện</option>
            <option value="may">May</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">CL TB</label>
          <select value={data.chatLuongTB} onChange={(e) => setData({ ...data, chatLuongTB: e.target.value as any })} className="w-full mt-0.5 px-2 py-1.5 rounded border text-sm">
            <option>Tốt</option>
            <option>Khá</option>
            <option>Trung bình</option>
          </select>
        </div>
        <F label="Ghi chú" v={data.ghiChu} on={(v: any) => setData({ ...data, ghiChu: v })} />
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
        <button onClick={() => { upsertXuong(data); onSave(); toast.success("Đã lưu"); }} className="btn-primary flex-1 bg-violet-500">💾 Lưu</button>
      </div>
    </div>
  );
}

// ============ MAIN VIEW ============
export function MasterData() {
  const [subTab, setSubTab] = useState<"ncc" | "xuong">("ncc");
  const [nccs, setNccs] = useState(getAllNCC());
  const [xuongs, setXuongs] = useState(getAllXuong());
  const [editing, setEditing] = useState<NhaCungCap | XuongGiaCong | null>(null);

  const refresh = () => {
    setNccs(getAllNCC());
    setXuongs(getAllXuong());
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex gap-1">
        <button onClick={() => setSubTab("ncc")} className={`flex-1 py-2 rounded text-sm font-semibold ${
          subTab === "ncc" ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800"
        }`}>
          🏭 NCC ({nccs.length})
        </button>
        <button onClick={() => setSubTab("xuong")} className={`flex-1 py-2 rounded text-sm font-semibold ${
          subTab === "xuong" ? "bg-violet-500 text-white" : "bg-slate-100 dark:bg-slate-800"
        }`}>
          🏗️ Xưởng ({xuongs.length})
        </button>
      </div>

      {subTab === "ncc" ? (
        <NCCList nccs={nccs} onEdit={setEditing} onRefresh={refresh} />
      ) : (
        <XuongList xuongs={xuongs} onEdit={setEditing} onRefresh={refresh} />
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)}>
          {"tenNCC" in editing ? (
            <NCCForm ncc={editing as NhaCungCap} onClose={() => setEditing(null)} onSave={() => { refresh(); setEditing(null); }} />
          ) : (
            <XuongForm xuong={editing as XuongGiaCong} onClose={() => setEditing(null)} onSave={() => { refresh(); setEditing(null); }} />
          )}
        </Modal>
      )}
    </div>
  );
}
