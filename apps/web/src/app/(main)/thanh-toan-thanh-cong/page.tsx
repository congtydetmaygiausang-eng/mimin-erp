"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, PackageCheck, HeartHandshake } from "lucide-react";
import confetti from "canvas-confetti";

export default function ThanhToanThanhCongPage() {
  const router = useRouter();

  useEffect(() => {
    // Bắn pháo hoa ăn mừng
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Thanh toán thành công!</h1>
        <p className="text-slate-500 mb-8">
          Cảm ơn bạn đã tin tưởng và đặt hàng tại Mimin. Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý.
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
          <h3 className="font-bold text-slate-800 mb-4 text-left">Các bước tiếp theo:</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <PackageCheck className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-700">Xác nhận đơn hàng</p>
                <p className="text-xs text-slate-500">Mimin sẽ sớm liên hệ để chốt đơn</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                <HeartHandshake className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-700">Đóng gói & Giao hàng</p>
                <p className="text-xs text-slate-500">Đơn vị vận chuyển sẽ giao hàng tận nơi</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => router.push("/danh-muc-sp")}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all"
        >
          TIẾP TỤC MUA SẮM
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
