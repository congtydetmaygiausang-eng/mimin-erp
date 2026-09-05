"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, ShieldCheck, QrCode } from "lucide-react";
import { useCustomerCart } from "@/lib/data/customer-cart-store";
import { formatVNDShort } from "@/lib/data/real-data";

export default function MisaPaymentMockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [processing, setProcessing] = useState(true);
  const { clearCart } = useCustomerCart();

  const amount = searchParams.get("amount");
  const orderId = searchParams.get("orderId");
  const returnUrl = searchParams.get("returnUrl") || "/";

  useEffect(() => {
    // Giả lập KH đang quét mã QR hoặc nhập thẻ trên cổng MISA
    const timer = setTimeout(() => {
      setProcessing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSuccess = () => {
    // Xóa giỏ hàng khi thanh toán thành công
    clearCart();
    
    // Redirect về trang kết quả của Mimin
    router.push(returnUrl);
  };

  const handleCancel = () => {
    router.push("/danh-muc-sp");
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header MISA */}
        <div className="bg-[#00558f] p-4 flex items-center justify-center border-b-[4px] border-[#0091ff]">
          <div className="text-white font-extrabold text-2xl flex items-center gap-2 tracking-wider">
            <QrCode className="w-8 h-8" />
            MISA VietQR
          </div>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          {processing ? (
            <>
              <Loader2 className="w-16 h-16 text-[#00558f] animate-spin mb-6" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">Đang kết nối cổng thanh toán...</h2>
              <p className="text-slate-500 mb-6 text-sm">Vui lòng không đóng cửa sổ này</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 border-4 border-blue-100">
                <ShieldCheck className="w-8 h-8 text-[#00558f]" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Xác nhận thanh toán</h2>
              <p className="text-slate-500 mb-6 text-sm">Bạn đang thực hiện thanh toán cho đơn hàng {orderId}</p>

              <div className="w-full bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-500">Mã đơn hàng:</span>
                  <span className="text-sm font-bold text-slate-800">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-500">Số tiền:</span>
                  <span className="text-lg font-extrabold text-rose-600">{formatVNDShort(Number(amount || 0))}</span>
                </div>
              </div>

              {/* VietQR Code */}
              <div className="w-full flex flex-col items-center justify-center mb-6">
                <p className="text-sm font-semibold text-slate-500 mb-2">Quét mã QR bằng ứng dụng ngân hàng</p>
                <img 
                  src={`https://img.vietqr.io/image/970422-123456789-compact2.png?amount=${amount}&addInfo=${orderId}&accountName=POLOMIMIN`} 
                  alt="VietQR" 
                  className="max-w-[250px] w-full h-auto border-2 border-[#00558f] rounded-lg p-2 bg-white" 
                />
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={handleSuccess}
                  className="w-full py-3.5 bg-[#00558f] hover:bg-[#00416b] text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all"
                >
                  THANH TOÁN THÀNH CÔNG (MOCK)
                </button>
                <button 
                  onClick={handleCancel}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                >
                  HỦY GIAO DỊCH
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
