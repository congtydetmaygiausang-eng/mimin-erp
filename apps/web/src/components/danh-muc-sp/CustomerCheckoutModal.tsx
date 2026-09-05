"use client";

import { useState, useEffect } from "react";
import { X, ShoppingCart, Trash2, CreditCard, MapPin, Phone, User, Loader2, ArrowLeft, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { useCustomerCart } from "@/lib/data/customer-cart-store";
import { formatVNDShort } from "@/lib/data/real-data";
import { createMisaPaymentUrl } from "@/lib/misa/misa-helper";
import { toast } from "sonner";

interface Province {
  name: string;
  code: number;
  districts: District[];
}

interface District {
  name: string;
  code: number;
}

interface CustomerCheckoutModalProps {
  onClose: () => void;
}

export default function CustomerCheckoutModal({ onClose }: CustomerCheckoutModalProps) {
  const { items, getTotalPrice, removeItem, updateQuantity } = useCustomerCart();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    province: "",
    district: "",
    address: "",
    note: "",
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=2")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Failed to load provinces", err));
  }, []);

  // When province changes, reset district
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    setFormData({ ...formData, province: provinceName, district: "" });
    
    const selectedProvince = provinces.find((p) => p.name === provinceName);
    if (selectedProvince) {
      let d = [...selectedProvince.districts];
      // Inject missing districts if HCM
      if (provinceName === "Thành phố Hồ Chí Minh" || provinceName === "Hồ Chí Minh") {
        d.push({ name: "Quận 2", code: 9992 });
        d.push({ name: "Quận 9", code: 9999 });
        d.push({ name: "Quận Thủ Đức", code: 9990 });
      }
      setDistricts(d);
    } else {
      setDistricts([]);
    }
  };

  const total = getTotalPrice();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Giỏ hàng đang trống!");
      return;
    }
    if (!formData.name || !formData.phone || !formData.province || !formData.district || !formData.address) {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[90vh] md:h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "cart" ? (
          // Cart View
          <>
            <div className="p-5 md:p-6 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-800">
                <ShoppingCart className="w-6 h-6 text-cyan-600" />
                Giỏ Hàng Của Bạn
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                  {items.length} sản phẩm
                </span>
                <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                  <p>Giỏ hàng đang trống.</p>
                  <p className="text-sm">Hãy thêm sản phẩm vào giỏ nhé!</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-20 h-24 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-50">
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
                        <div className="text-xs font-semibold text-slate-500 bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">
                          {item.mauTen} • Size {item.size}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm font-extrabold text-cyan-700">
                          {formatVNDShort(item.donGia)}
                        </div>
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
                            <button 
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-l-lg font-bold transition-colors"
                              onClick={() => updateQuantity(item.id, item.soLuong - 1)}
                            >-</button>
                            <span className="w-8 text-center text-sm font-bold text-slate-800">{item.soLuong}</span>
                            <button 
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-r-lg font-bold transition-colors"
                              onClick={() => updateQuantity(item.id, item.soLuong + 1)}
                            >+</button>
                          </div>
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa sản phẩm"
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

            <div className="p-5 md:p-8 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
              <div className="flex justify-between items-center mb-5 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="text-sm font-bold text-slate-500 uppercase">Tổng giỏ hàng</span>
                <span className="text-2xl font-black text-cyan-600">{formatVNDShort(total)}</span>
              </div>
              <button 
                onClick={() => setStep("checkout")}
                disabled={items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                Tiến hành thanh toán
              </button>
            </div>
          </>
        ) : (
          // Checkout View
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col h-full bg-white relative">
            <div className="p-5 md:p-6 border-b border-slate-200 bg-white shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setStep("cart")}
                  className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-800">
                  <User className="w-6 h-6 text-blue-600" />
                  Thông tin nhận hàng
                </h2>
              </div>
              <button type="button" onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 md:p-8 flex-1 overflow-y-auto bg-slate-50/50">
              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Họ và tên <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Số điện thoại <span className="text-rose-500">*</span></label>
                  <input 
                    type="tel" 
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-slate-400"
                    placeholder="0901234567"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Tỉnh / Thành phố <span className="text-rose-500">*</span></label>
                    <select 
                      required
                      value={formData.province}
                      onChange={handleProvinceChange}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Chọn Tỉnh/Thành</option>
                      {provinces.map((p) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Quận / Huyện <span className="text-rose-500">*</span></label>
                    <select 
                      required
                      value={formData.district}
                      onChange={(e) => setFormData({...formData, district: e.target.value})}
                      disabled={!formData.province}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Chọn Quận/Huyện</option>
                      {districts.map((d) => (
                        <option key={d.code} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Địa chỉ cụ thể <span className="text-rose-500">*</span></label>
                  <textarea 
                    required
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder-slate-400"
                    placeholder="Số nhà, Tên đường, Phường/Xã..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Ghi chú giao hàng (Tùy chọn)</label>
                  <textarea 
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({...formData, note: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder-slate-400"
                    placeholder="Giao trong giờ hành chính..."
                  />
                </div>
              </div>
            </div>

            <div className="p-5 md:p-8 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
              <div className="flex justify-between items-center mb-5 p-4 rounded-xl border border-slate-100 bg-slate-50">
                <span className="text-sm font-bold text-slate-500 uppercase">Tổng thanh toán</span>
                <span className="text-2xl font-black text-rose-600">{formatVNDShort(total)}</span>
              </div>
              
              <button 
                type="submit"
                disabled={loading || items.length === 0}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#00558f] hover:bg-[#00416b] text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(0,85,143,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    THANH TOÁN MISA VietQR
                  </>
                )}
              </button>
              
              <div className="mt-5 flex flex-col items-center gap-3 w-full">
                {/* Security Badges */}
                <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50/80 text-emerald-700 rounded-lg text-[10px] md:text-xs font-bold border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Bảo mật SSL 256-bit
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/80 text-blue-700 rounded-lg text-[10px] md:text-xs font-bold border border-blue-100">
                    <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    Mã hoá End-to-End
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-[10px] md:text-xs font-bold border border-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
                    PCI DSS Compliant
                  </div>
                </div>
                
                {/* Payment Partners & MISA */}
                <div className="flex flex-col items-center gap-2 mt-1">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-medium text-slate-400">
                    Được bảo chứng xử lý giao dịch bởi 
                    <img src="/misa-logo.svg" alt="MISA" className="h-3.5 object-contain opacity-70 grayscale" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span className="font-extrabold text-slate-600">MISA VietQR</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-40 grayscale hover:grayscale-0 transition-all duration-300">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/800px-Mastercard_2019_logo.svg.png" className="h-4" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/JCB_logo.svg/1200px-JCB_logo.svg.png" className="h-4" alt="JCB" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
