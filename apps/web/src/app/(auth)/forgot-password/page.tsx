"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Shirt, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const BACKGROUNDS = [
  { id: "teal", src: "/bg/login-teal.jpg", label: "Teal" },
  { id: "galaxy", src: "/bg/galaxy-dark.jpg", label: "Galaxy" },
  { id: "dandelion", src: "/bg/dandelion.jpg", label: "Dandelion" },
  { id: "sky-clouds", src: "/bg/sky-clouds.jpg", label: "Sky" },
  { id: "teal-cyan", src: "/bg/teal-cyan.jpg", label: "Teal-Cyan" },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      toast.error("Hệ thống chưa kết nối cơ sở dữ liệu");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Đã gửi liên kết khôi phục mật khẩu. Vui lòng kiểm tra email.");
    }
  };

  const bg = BACKGROUNDS[bgIndex];

  return (
    <div className="min-h-screen relative bg-module-login" style={{ backgroundImage: `url(${bg.src})` }}>
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/60" />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-6 items-center">
          {/* Left brand */}
          <div className="hidden md:flex flex-col gap-4 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-2xl">MIMIN ERP</div>
                <div className="text-sm text-white/80">Hệ thống quản lý sản xuất may mặc</div>
              </div>
            </div>
            <h1 className="text-4xl font-bold leading-tight mt-6">
              Khôi phục mật khẩu <br /> nhanh chóng
            </h1>
            <p className="text-white/90 leading-relaxed">
              Từ kế hoạch sản xuất → cắt → may → hoàn thiện → QC → giao hàng.<br />
              Tất cả trong một nền tảng duy nhất.
            </p>
          </div>

          {/* Right form */}
          <div className="card p-6 md:p-8 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-brand-500" />
                Quên mật khẩu
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBgIndex((i) => (i + 1) % BACKGROUNDS.length)}
                  className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 text-xs"
                  title="Đổi nền"
                >
                  🎨 {bg.label}
                </button>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5"
                  aria-label="Theme"
                >
                  {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Đã gửi email khôi phục</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Vui lòng kiểm tra hộp thư đến (và thư mục Spam) của <strong>{email}</strong> để đặt lại mật khẩu.
                </p>
                <Link href="/login" className="btn-primary w-full inline-block text-center">
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6">
                  Nhập địa chỉ email của bạn, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
                </p>
                <form onSubmit={handleReset} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="email@mimin.vn"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                    {loading ? "Đang gửi…" : "Gửi liên kết"}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <span>Đã nhớ mật khẩu?</span>
                    <Link href="/login" className="text-brand-500 font-medium hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                      Đăng nhập ngay
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
