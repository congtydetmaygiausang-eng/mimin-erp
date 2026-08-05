"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { useTheme } from "next-themes";
import { Sun, Moon, Shirt, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { DEMO_USERS } from "@/lib/supabase/client";
import { useEffect } from "react";

const BACKGROUNDS = [
  { id: "teal", src: "/bg/login-teal.jpg", label: "Teal" },
  { id: "galaxy", src: "/bg/galaxy-dark.jpg", label: "Galaxy" },
  { id: "dandelion", src: "/bg/dandelion.jpg", label: "Dandelion" },
  { id: "sky-clouds", src: "/bg/sky-clouds.jpg", label: "Sky" },
  { id: "teal-cyan", src: "/bg/teal-cyan.jpg", label: "Teal-Cyan" },
];

// Đã xoá các tài khoản test theo yêu cầu (2026-08-05)
const DEMO_ACCOUNTS: Array<{email: string; password: string; name: string; role: string}> = [];

export default function LoginPage() {
  const { signIn, user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("sang@mimin.vn");
  const [password, setPassword] = useState("sang123");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!sessionLoading && user) router.replace("/dashboard");
  }, [user, sessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);
    if (res.ok) {
      // DEMO_USERS đã bị xoá ngày 2026-08-01 - dùng fallback
      const demoUser = DEMO_USERS.find((u) => u.email === email);
      logAudit({
        user: { id: email, email, name: demoUser?.name || email.split("@")[0] || email, role: demoUser?.role || "user", title: demoUser?.title || "", source: "demo" },
        action: "login",
        module: "auth",
        description: `Đăng nhập: ${email}`,
        success: true,
      });
      toast.success("Đăng nhập thành công");
      router.replace("/dashboard");
    } else {
      logAudit({
        user: { id: email, email, name: email, role: "guest", title: "Khách", source: "demo" },
        action: "login_failed",
        module: "auth",
        description: `Sai mật khẩu: ${email}`,
        success: false,
        errorMessage: res.error,
      });
      toast.error(res.error || "Đăng nhập thất bại");
    }
  };


  const bg = BACKGROUNDS[bgIndex];

  return (
    <div className="min-h-screen relative bg-module-login" style={{ backgroundImage: `url(${bg.src})` }}>
      {/* Vì galaxy-dark là màn đậm nhất → text trắng nổi bật */}
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
              Quản lý toàn bộ <br /> quy trình sản xuất
            </h1>
            <p className="text-white/90 leading-relaxed">
              Từ kế hoạch sản xuất → cắt → may → hoàn thiện → QC → giao hàng.<br />
              Tất cả trong một nền tảng duy nhất.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {["Lệnh cắt", "Kế hoạch SX", "Kho vải", "QC", "Giao hàng", "Báo cáo"].map((t) => (
                <span key={t} className="px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right form */}
          <div className="card p-6 md:p-8 w-full max-w-md mx-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                Đăng nhập
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

            <form onSubmit={handleSubmit} className="space-y-3">
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
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/30"
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </form>


          </div>
        </div>
      </div>
    </div>
  );
}
