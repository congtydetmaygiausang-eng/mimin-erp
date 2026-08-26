// ============ 3 MODAL: NHAP/XUAT/LICH SU ============
// Tach tu page.tsx (2026-08-05 - toi uu B.8)

import { useState } from "react";
import { Plus, Minus, X, Box, History } from "lucide-react";
import { toast } from "sonner";
import { useKho } from "@/lib/data/kho-store";
import { KHO_VAT_TU, KHO_VAI } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { Portal } from "@/components/ui/Portal";
import type { LoaiKho } from "../data";

// ============ MODAL NHAP KHO ============
export function PLNhapKho({ maVT, inventory, loai, onClose }: { maVT: string; inventory?: KhoVai[]; loai: LoaiKho; onClose: () => void }) {
  const { themGiaoDich } = useKho();
  const dsVT = inventory && inventory.length > 0 ? inventory : (loai === "vai" ? KHO_VAI : KHO_VAT_TU);
  const vt = dsVT.find((v) => v.maVT === maVT) || dsVT[0];
  const { list: _nccList, suaNCC } = useNhaCungCap();
  const nccList = _nccList
    .filter(n => {
      const txt = (n.loai + " " + (n.danh_muc_chi_tiet?.join(" ") || "")).toLowerCase();
      // Nếu là Kho Phụ Liệu thì ưu tiên các NCC có chữ "phụ liệu", "phu lieu", "khóa", "nút", "chỉ", "bo cổ", v.v.
      // Hoặc đơn giản là loại trừ các NCC chuyên Vải/Sợi ra. Ở đây ta lọc tương đối:
      if (txt.includes("phụ liệu") || txt.includes("phu lieu") || txt.includes("bo cổ") || txt.includes("chỉ") || txt.includes("nút") || txt.includes("khóa")) return true;
      // Nếu NCC không có tag rõ ràng, tạm thời cho hiển thị nếu KHÔNG phải chuyên vải/sợi
      return !txt.includes("sợi") && !txt.includes("vải") && !txt.includes("dệt") && !txt.includes("nhuộm");
    })
    .map((n) => ({ maDT: n.ma_ncc, tenDonVi: n.ten_ncc }));
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    donGia: vt.donGia,
    nguonNhap: nccList[0]?.tenDonVi || "",
    nguoiThucHien: "Trần Thị Bình",
    ghiChu: "",
  });

  const thanhTien = form.soLuong * form.donGia;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vt) return toast.error("Không tìm thấy vật tư");
    if (form.soLuong <= 0) return toast.error("SL phải > 0");
    
    // Ghi nhận giao dịch
    themGiaoDich({ ...form, loai: "NHAP" as const, maVT: vt.maVT, tenVT: vt.tenVT, donVi: vt.dvt, thanhTien });
    
    // Ghi nhận công nợ cho nhà cung cấp
    if (form.nguonNhap) {
      const ncc = _nccList.find(n => n.ten_ncc === form.nguonNhap);
      if (ncc) {
        suaNCC({ ...ncc, cong_no: ncc.cong_no + thanhTien });
      }
    }
    
    toast.success(`Đã nhập ${form.soLuong.toLocaleString()} ${vt.dvt} ${vt.tenVT} và cập nhật công nợ`);
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-sky-600" /> Nhập kho: {vt.tenVT}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="bg-sky-500/10 rounded p-2 mb-3 text-xs">
            <span className="opacity-70">Mã:</span> <b className="font-mono">{vt.maVT}</b> · <span className="opacity-70">ĐVT:</span> {vt.dvt} · <span className="opacity-70">Loại:</span> {vt.loai}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Ngày nhập *</label>
                <input type="date" required className="input w-full" value={form.ngay} onChange={(e) => setForm({ ...form, ngay: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Số lượng ({vt.dvt}) *</label>
                <input type="number" required min={1} className="input w-full" value={form.soLuong || ""} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Đơn giá (đ/{vt.dvt}) *</label>
                <input type="number" required min={0} className="input w-full" value={form.donGia} onChange={(e) => setForm({ ...form, donGia: Number(e.target.value) })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Thành tiền</label>
                <div className="input w-full bg-emerald-500/10 text-emerald-700 font-bold flex items-center">{thanhTien.toLocaleString()}đ</div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Nguồn nhập (NCC) *</label>
              <select required className="input w-full" value={form.nguonNhap} onChange={(e) => setForm({ ...form, nguonNhap: e.target.value })}>
                <option value="">-- Chọn NCC --</option>
                {nccList.map((n) => <option key={n.maDT} value={n.tenDonVi}>{n.tenDonVi}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Người TH</label>
              <input className="input w-full" value={form.nguoiThucHien} onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ghi chú</label>
              <textarea className="input w-full min-h-[50px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
              <button type="submit" className="btn-primary flex-1 bg-sky-500 hover:bg-sky-600">Xác nhận nhập</button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ============ MODAL XUAT KHO ============
export function PLXuatKho({ maVT, inventory, loai, onClose }: { maVT: string; inventory?: KhoVai[]; loai: LoaiKho; onClose: () => void }) {
  const { themGiaoDich, giaoDichTheoVT } = useKho();
  const dsVT = inventory && inventory.length > 0 ? inventory : (loai === "vai" ? KHO_VAI : KHO_VAT_TU);
  const vt = dsVT.find((v) => v.maVT === maVT) || dsVT[0];
  const ds = giaoDichTheoVT(maVT);
  const tongNhap = ds.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
  const tongXuat = ds.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
  const tonHienTai = vt.tonKho + tongNhap - tongXuat;
  const [form, setForm] = useState({
    ngay: new Date().toISOString().split("T")[0],
    soLuong: 0,
    nguonNhap: "",
    nguoiThucHien: "Nguyễn Thị Mỹ Nhi",
    ghiChu: "",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.soLuong <= 0) return toast.error("SL phải > 0");
    if (form.soLuong > tonHienTai) return toast.error(`Không đủ tồn! Còn ${tonHienTai.toFixed(1)} ${vt.dvt}`);
    themGiaoDich({ ...form, loai: "XUAT" as const, maVT: vt.maVT, tenVT: vt.tenVT, donVi: vt.dvt, donGia: vt.donGia, thanhTien: form.soLuong * vt.donGia });
    toast.success(`Đã xuất ${form.soLuong.toLocaleString()} ${vt.dvt} ${vt.tenVT}`);
    onClose();
  };
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2"><Minus className="w-5 h-5 text-amber-600" /> Xuất kho: {vt.tenVT}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="bg-amber-500/10 rounded p-2 mb-3 text-xs flex items-center gap-2">
            <Box className="w-4 h-4 text-amber-600" />
            <span><b>Tồn hiện tại:</b> <b className="text-amber-700">{tonHienTai.toFixed(1)} {vt.dvt}</b></span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Ngày xuất *</label>
                <input type="date" required className="input w-full" value={form.ngay} onChange={(e) => setForm({ ...form, ngay: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Số lượng ({vt.dvt}) *</label>
                <input type="number" required min={1} max={tonHienTai} className="input w-full" value={form.soLuong || ""} onChange={(e) => setForm({ ...form, soLuong: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Mục đích xuất *</label>
              <select required className="input w-full" value={form.nguonNhap} onChange={(e) => setForm({ ...form, nguonNhap: e.target.value })}>
                <option value="">-- Chọn --</option>
                <optgroup label="Lệnh cắt">
                  <option value="LSX-M758">Cắt Lệnh LSX-M758 (5000 áo)</option>
                  <option value="LSX-002">Cắt Lệnh LSX-002 (3000 áo)</option>
                </optgroup>
                <optgroup label="Khác">
                  <option value="Xuất bù hao hụt">Xuất bù hao hụt</option>
                  <option value="Xuất gửi mẫu">Xuất gửi mẫu</option>
                  <option value="Khác">Khác...</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Người TH</label>
              <input className="input w-full" value={form.nguoiThucHien} onChange={(e) => setForm({ ...form, nguoiThucHien: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ghi chú</label>
              <textarea className="input w-full min-h-[50px]" value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
              <button type="submit" className="btn-primary flex-1 bg-amber-500 hover:bg-amber-600">Xác nhận xuất</button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}

// ============ MODAL LICH SU ============
export function PLLichSu({ maVT, inventory, loai, onClose }: { maVT: string; inventory?: KhoVai[]; loai: LoaiKho; onClose: () => void }) {
  const { giaoDichTheoVT } = useKho();
  const dsVT = inventory && inventory.length > 0 ? inventory : (loai === "vai" ? KHO_VAI : KHO_VAT_TU);
  const vt = dsVT.find((v) => v.maVT === maVT) || dsVT[0];
  const ds = giaoDichTheoVT(maVT);
  const tongNhap = ds.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
  const tongXuat = ds.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
  return (
    <Portal>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="card max-w-4xl w-full p-6 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Lịch sử giao dịch: {vt.tenVT}</h3>
            <button onClick={onClose} className="p-1 hover:bg-white/40 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4 flex-shrink-0">
            <div className="bg-sky-500/10 rounded p-2 text-center">
              <div className="text-xs opacity-70">Tổng nhập</div>
              <div className="font-bold text-sky-600">+{tongNhap.toFixed(0)} {vt.dvt}</div>
            </div>
            <div className="bg-amber-500/10 rounded p-2 text-center">
              <div className="text-xs opacity-70">Tổng xuất</div>
              <div className="font-bold text-amber-600">-{tongXuat.toFixed(0)} {vt.dvt}</div>
            </div>
            <div className="bg-emerald-500/10 rounded p-2 text-center">
              <div className="text-xs opacity-70">Tồn hiện tại</div>
              <div className="font-bold text-emerald-600">{(tongNhap - tongXuat).toFixed(0)} {vt.dvt}</div>
            </div>
          </div>
          <div className="overflow-x-auto flex-1 h-0 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-sm z-10">
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-2">Ngày</th>
                  <th className="p-2">Loại</th>
                  <th className="p-2 text-right">SL</th>
                  <th className="p-2 text-right">Đơn giá</th>
                  <th className="p-2 text-right">Tiền</th>
                  <th className="p-2">Mục đích</th>
                  <th className="p-2">Người TH</th>
                </tr>
              </thead>
              <tbody>
                {ds.length === 0 ? (
                  <tr><td colSpan={7} className="p-6 text-center opacity-60 text-sm">Chưa có giao dịch</td></tr>
                ) : ds.map((g) => (
                  <tr key={g.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                    <td className="p-2 text-xs">{g.ngay}</td>
                    <td className="p-2 text-xs">{g.loai === "NHAP" ? <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-700 text-[10px] font-semibold">+NHẬP</span> : <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 text-[10px] font-semibold">-XUẤT</span>}</td>
                    <td className="p-2 text-right text-xs">{g.soLuong.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono">{g.donGia.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono">{(g.thanhTien || 0).toLocaleString()}</td>
                    <td className="p-2 text-xs">{g.nguonNhap || "—"}</td>
                    <td className="p-2 text-xs">{g.nguoiThucHien}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Portal>
  );
}
