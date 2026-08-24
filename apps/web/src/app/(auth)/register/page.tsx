"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Shirt, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

const BACKGROUNDS = [
  { id: "teal", src: "/bg/login-teal.jpg", label: "Teal" },
  { id: "galaxy", src: "/bg/galaxy-dark.jpg", label: "Galaxy" },
  { id: "dandelion", src: "/bg/dandelion.jpg", label: "Dandelion" },
  { id: "sky-clouds", src: "/bg/sky-clouds.jpg", label: "Sky" },
  { id: "teal-cyan", src: "/bg/teal-cyan.jpg", label: "Teal-Cyan" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!supabase) {
      toast.error("Hệ thống chưa kết nối cơ sở dữ liệu");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          has_set_password: true,
        },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực.");
      router.push("/login");
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
              Đăng ký tài khoản mới <br /> gia nhập hệ thống
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
                <UserPlus className="w-5 h-5 text-brand-500" />
                Đăng ký
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

            <form onSubmit={handleRegister} className="space-y-3">
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
              <div>
                <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
                {loading ? "Đang đăng ký…" : "Đăng ký tài khoản"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <span>Đã có tài khoản?</span>
                <Link href="/login" className="text-brand-500 font-medium hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                  Đăng nhập ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
