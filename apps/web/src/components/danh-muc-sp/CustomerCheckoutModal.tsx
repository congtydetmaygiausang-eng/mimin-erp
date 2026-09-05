"use client";

import { useState } from "react";
import { X, ShoppingCart, Trash2, CreditCard, MapPin, Phone, User, Loader2 } from "lucide-react";
import { useCustomerCart } from "@/lib/data/customer-cart-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { createMisaPaymentUrl } from "@/lib/misa/misa-helper";
import { toast } from "sonner";

interface CustomerCheckoutModalProps {
  onClose: () => void;
}

export default function CustomerCheckoutModal({ onClose }: CustomerCheckoutModalProps) {
  const { items, getTotalPrice, removeItem, updateQuantity } = useCustomerCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    note: "",
  });

  const total = getTotalPrice();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống!");
      return;
    }
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng");
      return;
    }

    setLoading(true);
    try {
      // 1. Tạo đơn hàng nháp trong CSDL (Mock)
      const orderId = `B2C-${Date.now().toString().slice(-6)}`;
      
      // 2. Gọi MISA Helper để lấy URL thanh toán
      const { paymentUrl } = await createMisaPaymentUrl({
        orderId,
        amount: total,
        orderInfo: `Thanh toan don hang ${orderId} cho Khach ${formData.name}`,
        returnUrl: `${window.location.origin}/thanh-toan-thanh-cong`,
      });

      // 3. Chuyển hướng sang cổng thanh toán MISA
      window.location.href = paymentUrl;

    } catch (error: any) {
      toast.error("Có lỗi xảy ra khi kết nối cổng thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Side: Cart Items */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-100 overflow-hidden relative">
          <div className="p-6 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-800">
              <ShoppingCart className="w-6 h-6 text-cyan-600" />
              Giỏ Hàng Của Bạn
            </h2>
            <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full">
              {items.length} sản phẩm
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                <p>Giỏ hàng đang trống.</p>
                <p className="text-sm">Hãy thêm sản phẩm vào giỏ nhé!</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    {item.hinhAnh ? (
                      <img src={item.hinhAnh} alt={item.spTen} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{item.spTen}</h3>
                      <div className="text-xs font-semibold text-slate-500">
                        {item.mauTen} • Size {item.size}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm font-extrabold text-cyan-700">
                        {formatVNDShort(item.donGia)}đ
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
                          <button 
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded-l-lg font-bold"
                            onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                          >-</button>
                          <span className="w-8 text-center text-sm font-bold text-slate-800">{item.soLuong}</span>
                          <button 
                            className="px-2 py-1 text-slate-600 hover:bg-slate-200 rounded-r-lg font-bold"
                            onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                          >+</button>
                        </div>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Checkout Form */}
        <div className="w-full md:w-[400px] flex flex-col bg-white overflow-hidden relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleCheckout} className="flex-1 flex flex-col h-full">
            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Thông tin nhận hàng</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      placeholder="Nhập tên người nhận"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Địa chỉ giao hàng</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <textarea 
                      required
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                      placeholder="Nhập địa chỉ chi tiết"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Ghi chú (Tùy chọn)</label>
                  <textarea 
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                    placeholder="Ghi chú thêm cho đơn vị vận chuyển..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 shrink-0">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-500 uppercase">Tổng thanh toán</span>
                <span className="text-2xl font-extrabold text-cyan-600">{formatVNDShort(total)}đ</span>
              </div>
              
              <button 
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    THANH TOÁN MISA PAY
                  </>
                )}
              </button>
              <div className="mt-3 text-center flex items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <span>Bảo mật 100% qua cổng</span>
                <img src="/misa-logo.svg" alt="MISA" className="h-3 grayscale opacity-60" onError={(e) => e.currentTarget.style.display = 'none'} />
                <span>MISA</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
