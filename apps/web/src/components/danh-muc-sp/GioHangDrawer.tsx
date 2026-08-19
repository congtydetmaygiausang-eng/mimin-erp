// GioHangDrawer - panel truot tu phai, xem/sua gio hang truoc khi chot don
import { X, Trash2, ShoppingCart, Minus, Plus, Package } from "lucide-react";
import type { GioHangItem } from "@/lib/data/gio-hang-store";
import { formatVND } from "@/lib/data/real-data";

interface Props {
  items: GioHangItem[];
  onClose: () => void;
  onUpdateQty: (id: string, soLuong: number) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onCheckout: () => void;
}

export function GioHangDrawer({ items, onClose, onUpdateQty, onRemove, onClearAll, onCheckout }: Props) {
  const tongTien = items.reduce((s, it) => s + it.soLuong * it.donGia, 0);
  const tongSL = items.reduce((s, it) => s + it.soLuong, 0);

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-slide-up">
        <div className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Giỏ hàng ({tongSL})
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">Giỏ hàng trống</p>
              <p className="text-xs mt-1">Bấm "Giỏ" trên sản phẩm để thêm vào đây</p>
            </div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="flex gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {it.img && <img src={it.img} alt={it.spTen} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{it.spTen}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-1.5 flex-wrap">
                    {it.mauTen && <span>🎨 {it.mauTen}</span>}
                    {it.size && <span>📏 {it.size}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onUpdateQty(it.id, it.soLuong - 1)}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-6 text-center">{it.soLuong}</span>
                      <button
                        onClick={() => onUpdateQty(it.id, it.soLuong + 1)}
                        className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-cyan-700 dark:text-cyan-400">
                      {formatVND(it.soLuong * it.donGia)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(it.id)}
                  className="p-1.5 h-fit text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3 shrink-0 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-700 dark:text-slate-200">Tổng cộng</span>
              <span className="text-xl font-black text-cyan-700 dark:text-cyan-400">{formatVND(tongTien)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClearAll}
                className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Xóa giỏ
              </button>
              <button
                onClick={onCheckout}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold shadow-md shadow-cyan-500/30 transition-colors"
              >
                Tạo đơn hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
