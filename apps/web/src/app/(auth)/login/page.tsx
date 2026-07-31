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

// 19 user nội bộ + 13 CN = 32 tài khoản (theo bảng chốt a Cường)
// Tất cả password = 123 (trừ một số theo role riêng)
const DEMO_ACCOUNTS = [
  // 6 nhóm quản lý
  { email: "sang@mimin.vn", password: "sang123", name: "Anh Sang (Admin)", role: "Quản trị" },
  { email: "giau@mimin.vn", password: "giau123", name: "Chị Giàu", role: "Điều hành" },
  { email: "thanh@mimin.vn", password: "thanh123", name: "Bùi Thị Thanh", role: "Kế toán + Điều phối" },
  { email: "huyen@mimin.vn", password: "huyen123", name: "Đỗ Thị Huyền", role: "Bán sỉ" },
  { email: "vy@mimin.vn", password: "vy123", name: "Cẩm Vy", role: "Content - Media" },
  { email: "hau@mimin.vn", password: "hau123", name: "Quốc Hậu", role: "Thủ kho trưởng" },
  // 3 nhóm Cắt
  { email: "giang@mimin.vn", password: "giang123", name: "Giang (Cắt)", role: "Tổ trưởng Cắt" },
  { email: "de@mimin.vn", password: "de123", name: "Đệ (Cắt)", role: "CN Cắt" },
  { email: "phu@mimin.vn", password: "phu123", name: "Phú (Cắt)", role: "CN Cắt hỗ trợ" },
  // 2 nhóm Khuy nút
  { email: "ruong@mimin.vn", password: "ruong123", name: "Ruộng (KN)", role: "Tổ trưởng Khuy nút" },
  { email: "khoi@mimin.vn", password: "khoi123", name: "Khôi (KN)", role: "CN Khuy nút" },
  // 4 nhóm Ủi
  { email: "tuyen@mimin.vn", password: "tuyen123", name: "Tuyền (Ủi)", role: "Tổ trưởng Ủi" },
  { email: "huynh@mimin.vn", password: "huynh123", name: "Huynh (Ủi)", role: "CN Ủi" },
  { email: "thuy@mimin.vn", password: "thuy123", name: "Thủy (Ủi)", role: "CN Ủi" },
  { email: "anhui@mimin.vn", password: "anhui123", name: "Anh (Ủi)", role: "CN Ủi" },
  // 4 nhóm Đóng gói
  { email: "nhi@mimin.vn", password: "nhi123", name: "Mỹ Nhi (ĐG)", role: "Tổ trưởng ĐG" },
  { email: "phuong@mimin.vn", password: "phuong123", name: "Phương (ĐG)", role: "CN ĐG" },
  { email: "tim@mimin.vn", password: "tim123", name: "Tím (ĐG)", role: "CN ĐG" },
  { email: "phien@mimin.vn", password: "phien123", name: "Phiên (ĐG)", role: "CN ĐG" },
  // 7 mock user (legacy cho test)
  { email: "admin@mimin.vn", password: "admin123", name: "Nguyễn Văn An (Mock)", role: "Quản trị viên" },
  { email: "sewing@mimin.vn", password: "sewing123", name: "Phạm Thị Dung (Mock)", role: "Tổ trưởng may" },
];

export default function LoginPage() {
  const { signIn, user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("admin@mimin.vn");
  const [password, setPassword] = useState("admin123");
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
      const demoUser = DEMO_USERS.find((u) => u.email === email);
      logAudit({
        user: { id: email, email, name: demoUser?.name || email, role: demoUser?.role || "user", title: demoUser?.title || "", source: "demo" },
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

  const handleDemo = (acc: { email: string; password: string }) => {
    setEmail(acc.email);
    setPassword(acc.password);
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

            <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-xs font-medium mb-2 opacity-70">32 tài khoản (click để điền nhanh):</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleDemo(acc)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/5 transition text-xs"
                    type="button"
                  >
                    <div className="font-semibold">{acc.name}</div>
                    <div className="opacity-70">{acc.role} · {acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
