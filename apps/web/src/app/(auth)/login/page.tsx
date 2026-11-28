"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { useTheme } from "next-themes";
import { Sun, Moon, Shirt, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit-log";
import { getDefaultLandingRoute } from "@/lib/permissions";
import { DEMO_USERS } from "@/lib/supabase/client";
import { useEffect } from "react";
const BACKGROUNDS = [
  { id: "teal", src: "/bg/login-teal.jpg", label: "Teal" },
  { id: "galaxy", src: "/bg/galaxy-dark.jpg", label: "Galaxy" },
  { id: "dandelion", src: "/bg/dandelion.jpg", label: "Dandelion" },
  { id: "sky-clouds", src: "/bg/sky-clouds.jpg", label: "Sky" },
  { id: "teal-cyan", src: "/bg/teal-cyan.jpg", label: "Teal-Cyan" },
];
// 6 user nhanh pho bien nhat (hien thi duoi dang chip)
// LƯU Ý BẢO MẬT: KHÔNG bao giờ đặt "password" thật vào mảng này - trang /login
// là route CÔNG KHAI (không cần đăng nhập mới xem được), mọi giá trị ở đây bị
// bundle thẳng xuống JS gửi cho bất kỳ ai mở trang, kể cả người chưa đăng nhập.
// Trước đây có "password" thật ở đây (sang123, Mimin@123 dùng chung cho 44 NV)
// - đã gỡ bỏ. Các chip này chỉ điền sẵn EMAIL, người dùng vẫn phải tự gõ mật khẩu.
const QUICK_LOGIN = [
  { email: "sang@mimin.vn",   name: "Anh Sang",   role: "admin",     icon: "👑", color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30" },
  { email: "giau@mimin.vn",   name: "Chị Giàu",   role: "planner",   icon: "📋", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { email: "vy@mimin.vn",     name: "Cẩm Vy",     role: "content",   icon: "🎨", color: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30" },
  { email: "hau@mimin.vn",    name: "Quốc Hậu",   role: "warehouse", icon: "📦", color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { email: "giang@mimin.vn",  name: "Hoàng Giang", role: "attendance", icon: "🕒", color: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
];
// Tat ca 44 user @mimin.vn (dropdown) - phan theo role
const ALL_USERS = [
  // Admin
  { email: "sang@mimin.vn",   name: "Hồ Minh Sang (Admin)",     role: "admin" },
  { email: "mrhung@mimin.vn", name: "Mr Hùng (Admin)",          role: "admin" },
  { email: "phi@mimin.vn",    name: "Lương Hoàng Phi",          role: "admin" },
  { email: "ly@mimin.vn",     name: "Đoàn Văn Lý (Quản lý)",    role: "admin" },
  { email: "hoa@mimin.vn",    name: "Huỳnh Xuân Hòa",           role: "admin" },
  { email: "vy2@mimin.vn",    name: "Vy (Kho)",                 role: "admin" },
  // Planner
  { email: "giau@mimin.vn",   name: "Nguyễn Thị Giàu",          role: "planner" },
  { email: "huyen@mimin.vn",  name: "Đỗ Thị Huyền",            role: "planner" },
  { email: "huyen2@mimin.vn", name: "Huyền 2 (Bán sỉ)",        role: "planner" },
  // Accountant
  { email: "thanh@mimin.vn",  name: "Bùi Thị Thanh",            role: "accountant" },
  { email: "thanh2@mimin.vn", name: "Thanh 2 (Kế toán)",        role: "accountant" },
  // Content
  { email: "vy@mimin.vn",     name: "Nguyễn Ngọc Cẩm Vy",      role: "content" },
  // Warehouse
  { email: "hau@mimin.vn",    name: "Nguyễn Quốc Hậu",          role: "warehouse" },
  // Sewing (Cắt)
  { email: "de@mimin.vn",     name: "Phạm Văn Đệ",             role: "sewing" },
  { email: "phu@mimin.vn",    name: "Nguyễn Văn Phú",          role: "sewing" },
  { email: "vinh@mimin.vn",   name: "Dương Tấn Vĩnh",          role: "sewing" },
  { email: "minh1@mimin.vn",  name: "Nguyễn Quốc Minh",        role: "sewing" },
  // Finishing (Hoàn thiện)
  { email: "phuong@mimin.vn", name: "Võ Thị Phượng",           role: "finishing" },
  { email: "be@mimin.vn",     name: "Nguyễn Thị Bé",           role: "finishing" },
  { email: "duc1@mimin.vn",   name: "Nguyễn Minh Đức",         role: "finishing" },
  { email: "ruong@mimin.vn",  name: "Nguyễn Văn Ruộng",        role: "sewing" },
  // Chấm công (Attendance)
  { email: "long@mimin.vn",      name: "Long (NV16 - Chấm công)",               role: "attendance" },
  { email: "dinh@mimin.vn",      name: "Lê Định (NV02 - Chấm công)",            role: "attendance" },
  { email: "khang@mimin.vn",     name: "Nguyễn Triết Khang (NV03 - Chấm công)", role: "attendance" },
  { email: "hao@mimin.vn",       name: "Trần Thái Hào (NV07 - Chấm công)",      role: "attendance" },
  { email: "giang@mimin.vn",     name: "Nguyễn Hoàng Giang (NV08 - Chấm công)", role: "attendance" },
  { email: "tuanthanh@mimin.vn", name: "Lê Tuấn Thành (NV09 - Chấm công)",      role: "attendance" },
  { email: "lam@mimin.vn",       name: "Trần Hoàng Lâm (NV10 - Chấm công)",     role: "attendance" },
  { email: "chi@mimin.vn",       name: "Lục Thị Kim Chi (NV-011 - Chấm công)",  role: "attendance" },
  { email: "duy@mimin.vn",       name: "Hồ Lê Khánh Duy (NV-012 - Chấm công)",  role: "attendance" },
  { email: "nhung@mimin.vn",     name: "Dương Tuyết Nhung (NV-013 - Chấm công)", role: "attendance" },
  { email: "tu@mimin.vn",        name: "Nguyễn Tuấn Tú (NV-014 - Chấm công)",   role: "attendance" },
  // Partner (NCC gia công)
  { email: "gc-gc-in-001@mimin.vn",  name: "Bảo Ngân (IN-001)",     role: "partner" },
  { email: "gc-gc-in-002@mimin.vn",  name: "Hạnh (IN-002)",         role: "partner" },
  { email: "gc-gc-in-003@mimin.vn",  name: "Thanh Sơn (IN-003)",    role: "partner" },
  { email: "gc-gc-in-004@mimin.vn",  name: "Tiến Đạt (IN-004)",     role: "partner" },
  { email: "gc-gc-in-006@mimin.vn",  name: "Anh Vui (IN-006)",      role: "partner" },
  { email: "gc-gc-quan-001@mimin.vn", name: "Chị Dung (QUAN-001)", role: "partner" },
  { email: "gc-gc-quan-002@mimin.vn", name: "Minh Vy (QUAN-002)",  role: "partner" },
  { email: "gc-gc-quan-003@mimin.vn", name: "Anh Thơ (QUAN-003)",  role: "partner" },
  { email: "gc-gc-quan-004@mimin.vn", name: "Chị Hương (QUAN-004)", role: "partner" },
  { email: "gc-gc-tron-001@mimin.vn", name: "Anh Trai (TRON-001)", role: "partner" },
  { email: "gc-gc-tron-002@mimin.vn", name: "Chị Hằng (TRON-002)", role: "partner" },
  { email: "gc-gc-tron-003@mimin.vn", name: "Anh Chiến (TRON-003)", role: "partner" },
  { email: "gc-gc-tron-004@mimin.vn", name: "Anh Thuận (TRON-004)", role: "partner" },
  { email: "gc-gc-tron-005@mimin.vn", name: "Anh Quang (TRON-005)", role: "partner" },
  { email: "gc-gc-tru-001@mimin.vn",  name: "Chị Liễu (TRU-001)",  role: "partner" },
  { email: "gc-gc-tru-002@mimin.vn",  name: "Tý Sơn (TRU-002)",    role: "partner" },
  { email: "gc-gc-tru-003@mimin.vn",  name: "Anh Duẩn (TRU-003)",  role: "partner" },
  { email: "gc-gc-tru-005@mimin.vn",  name: "Anh Thông (TRU-005)", role: "partner" },
  { email: "gc-gc-tru-006@mimin.vn",  name: "Cô Cúc (TRU-006)",    role: "partner" },
  { email: "gc-gc-tru-007@mimin.vn",  name: "Anh Sản (TRU-007)",   role: "partner" },
];
export default function LoginPage() {
  const { signIn, user, loading: sessionLoading } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!sessionLoading && user) {
      router.replace(getDefaultLandingRoute(user.role));
    }
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
        user: { id: res.user?.id || email, email, name: res.user?.name || demoUser?.name || email.split("@")[0] || email, role: res.user?.role || demoUser?.role || "user", title: res.user?.title || demoUser?.title || "", source: res.user?.source || "demo" },
        action: "login",
        module: "auth",
        description: `Đăng nhập: ${email}`,
        success: true,
      });
      toast.dismiss();
      toast.success("Đăng nhập thành công", { id: "auth-toast", duration: 2000 });
      router.replace(getDefaultLandingRoute(res.user?.role || user?.role));
    } else {
      logAudit({
        user: { id: email, email, name: email, role: "guest", title: "Khách", source: "demo" },
        action: "login_failed",
        module: "auth",
        description: `Sai mật khẩu: ${email}`,
        success: false,
        errorMessage: res.error,
      });
      toast.dismiss();
      toast.error(res.error || "Đăng nhập thất bại", { id: "auth-toast", duration: 3000 });
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
              <div className="flex items-center gap-2 mt-2 mb-4">
                <input
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  defaultChecked
                />
                <label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Đang đăng nhập…" : "Đăng nhập"}
              </button>
            </form>
            <p className="text-[11px] text-center text-muted-foreground mt-4 mb-5">
              Nhân viên vui lòng đăng nhập bằng tài khoản <span className="font-semibold">@mimin.vn</span> và mật khẩu được cấp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
              <Link href="/forgot-password" className="hover:text-foreground transition-colors">
                Quên mật khẩu?
              </Link>
              <div className="flex items-center gap-1">
                <span>Chưa có tài khoản?</span>
                <Link href="/register" className="text-brand-500 font-medium hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

