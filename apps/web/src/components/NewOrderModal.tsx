"use client";
import { useState, useEffect } from "react";
import { X, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

export interface NewOrderData {
  maSP: string;
  tenSP: string;
  loaiSanPham: "Bộ" | "Áo";
  kieuMay: string;
  mau: string;
  size: string;
  soLuong: number;
  hanHoanThanh: string;
  nguoiPhuTrach: string;
  ghiChu: string;
  donGiaMucTieu: number;
  khoVai: string;
  mauVai: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (data: NewOrderData) => void;
}

export default function NewOrderModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState<NewOrderData>({
    maSP: "",
    tenSP: "",
    loaiSanPham: "Bộ",
    kieuMay: "Trơn",
    mau: "Trắng",
    size: "M",
    soLuong: 500,
    hanHoanThanh: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
    nguoiPhuTrach: "NV006",
    ghiChu: "",
    donGiaMucTieu: 0,
    khoVai: "Kho Vải 1",
    mauVai: "",
  });

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.maSP.trim()) { toast.error("Vui lòng nhập mã SP"); return; }
    if (!form.tenSP.trim()) { toast.error("Vui lòng nhập tên SP"); return; }
    if (form.soLuong < 1) { toast.error("Số lượng phải >= 1"); return; }
    onCreate(form);
    // Reset form
    setForm({
      maSP: "", tenSP: "", loaiSanPham: "Bộ", kieuMay: "Trơn", mau: "Trắng", size: "M",
      soLuong: 500, hanHoanThanh: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
      nguoiPhuTrach: "NV006", ghiChu: "", donGiaMucTieu: 0, khoVai: "Kho Vải 1", mauVai: ""
    });
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between text-slate-800 dark:text-white w-full pr-4">
          <div>
            <div className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-0.5">Tạo mới</div>
            <h2 className="text-lg font-bold">Lệnh cắt mới</h2>
          </div>
        </div>
      }
      maxWidth="2xl"
    >
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50">
        {/* Body */}
        <div className="p-4 sm:p-6 flex-1 space-y-5 overflow-y-auto">
            {/* Loại SP */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Loại sản phẩm *</label>
              <div className="grid grid-cols-2 gap-3">
                {(["Bộ", "Áo"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setForm({ ...form, loaiSanPham: l })}
                    className={`py-2.5 min-h-[44px] rounded-lg text-sm font-bold border-2 transition ${
                      form.loaiSanPham === l
                        ? l === "Bộ" ? "bg-violet-500 text-white border-violet-500" : "bg-sky-500 text-white border-sky-500"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {l === "Bộ" ? "Bộ (áo + quần)" : "Áo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Mã SP + Tên SP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Mã SP *</label>
                <input
                  type="text"
                  value={form.maSP}
                  onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })}
                  placeholder="VD: M999, M001"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Tên SP *</label>
                <input
                  type="text"
                  value={form.tenSP}
                  onChange={(e) => setForm({ ...form, tenSP: e.target.value })}
                  placeholder="VD: Áo polo trắng"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Kiểu may + Màu + Size */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Kiểu may</label>
                <select
                  value={form.kieuMay}
                  onChange={(e) => setForm({ ...form, kieuMay: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                >
                  <option>Trơn</option><option>Bo gấu</option><option>Cổ vest</option><option>Cổ tròn</option><option>Cổ polo</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Màu chính</label>
                <input
                  type="text"
                  value={form.mau}
                  onChange={(e) => setForm({ ...form, mau: e.target.value })}
                  placeholder="Trắng, Xanh..."
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Size</label>
                <input
                  type="text"
                  value={form.size}
                  onChange={(e) => setForm({ ...form, size: e.target.value })}
                  placeholder="M, L, XL"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Dữ liệu Vải */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Kho vải</label>
                <select
                  value={form.khoVai}
                  onChange={(e) => setForm({ ...form, khoVai: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                >
                  <option value="Kho Vải 1">Kho Vải 1 (Vải thun)</option>
                  <option value="Kho Vải 2">Kho Vải 2 (Vải dệt)</option>
                  <option value="Kho Vải 3">Kho Vải 3 (Vải mộc)</option>
                  <option value="Kho Vải 4">Kho Vải 4 (Phụ liệu)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Màu vải</label>
                <input
                  type="text"
                  value={form.mauVai}
                  onChange={(e) => setForm({ ...form, mauVai: e.target.value })}
                  placeholder="VD: Xanh đen, Trắng..."
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* SL + Hạn */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Số lượng *</label>
                <input
                  type="number"
                  min="1"
                  value={form.soLuong}
                  onChange={(e) => setForm({ ...form, soLuong: Math.max(1, parseInt(e.target.value) || 0) })}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-emerald-300 dark:border-emerald-600 dark:bg-slate-800 rounded-lg text-lg font-bold focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Hạn hoàn thành</label>
                <input
                  type="date"
                  value={form.hanHoanThanh}
                  onChange={(e) => setForm({ ...form, hanHoanThanh: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Người phụ trách + Đơn giá */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Người phụ trách cắt</label>
                <select
                  value={form.nguoiPhuTrach}
                  onChange={(e) => setForm({ ...form, nguoiPhuTrach: e.target.value })}
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                >
                  <option value="NV006">NV006 - Giang (Tổ trưởng)</option>
                  <option value="NV007">NV007 - Đệ (CN Cắt)</option>
                  <option value="NV008">NV008 - Phú (CN Cắt)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Đơn giá MT (đ/sp)</label>
                <input
                  type="number"
                  value={form.donGiaMucTieu}
                  onChange={(e) => setForm({ ...form, donGiaMucTieu: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full min-h-[44px] px-3 py-2 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Ghi chú</label>
              <textarea
                value={form.ghiChu}
                onChange={(e) => setForm({ ...form, ghiChu: e.target.value })}
                rows={2}
                placeholder="Yêu cầu đặc biệt, deadline, ưu tiên..."
                className="w-full min-h-[44px] px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 rounded-lg text-sm focus:border-brand-500 outline-none"
              />
            </div>

            {/* Preview */}
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Tóm tắt:</div>
              <div>Mã: <b>{form.maSP || "—"}</b> - {form.tenSP || "—"}</div>
              <div>Loại: <b>{form.loaiSanPham}</b> - {form.kieuMay} - Màu {form.mau} - Size {form.size}</div>
              <div>Vải: <b>{form.khoVai}</b> - Màu vải: <b>{form.mauVai || "—"}</b></div>
              <div>SL: <b>{form.soLuong.toLocaleString()}</b> {form.loaiSanPham === "Bộ" ? "bộ" : "áo"} - Hạn: <b>{form.hanHoanThanh}</b></div>
              {form.donGiaMucTieu > 0 && (
                <div className="text-emerald-600 font-semibold">Tổng DT dự kiến: {(form.donGiaMucTieu * form.soLuong).toLocaleString()}đ</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 shrink-0 sticky bottom-0 z-10 rounded-b-2xl">
            <button onClick={onClose} className="w-full sm:w-1/2 py-2.5 min-h-[44px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
              Huỷ
            </button>
            <button onClick={handleSubmit} className="w-full sm:w-1/2 py-2.5 min-h-[44px] bg-gradient-to-r from-brand-500 to-cyan-500 hover:from-brand-600 hover:to-cyan-600 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Tạo lệnh cắt
            </button>
          </div>
      </div>
    </ResponsiveModal>
  );
}
