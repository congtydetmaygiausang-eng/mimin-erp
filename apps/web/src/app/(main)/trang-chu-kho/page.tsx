"use client";

// ============ TRANG CHỦ KHO (Premium AI Dashboard) ============
import Link from "next/link";
import { useState } from "react";
import {
  Warehouse, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck,
  Layers, AlertTriangle, Sparkles, Send, Loader2, Search, ArrowRight,
  TrendingUp, PackageOpen
} from "lucide-react";
import { useSession } from "@/components/session-provider";
import { useKhoMobile, TRANG_THAI_PK_STYLE } from "@/lib/data/kho-mobile-store";
import { getKhoKPI, getTonKhoHienTai, getTonTheoMatHang } from "@/lib/kho-mobile-helper";
import { EmptyState, formatVNDShort, DateDisplay } from "@/components/ui";

export default function TrangChuKhoPage() {
  const { user } = useSession();
  const { phieu, tonKhoDelta } = useKhoMobile();
  const kpi = getKhoKPI(phieu);

  const tonVai = getTonKhoHienTai("vai", tonKhoDelta);
  const tonPL = getTonKhoHienTai("phu-lieu", tonKhoDelta);
  const tonTP = getTonKhoHienTai("thanh-pham", tonKhoDelta);

  const choDuyet = phieu.filter((p) => p.trangThai === "Chờ duyệt").slice(0, 5);
  const tonThap = [
    ...getTonTheoMatHang("vai", tonKhoDelta),
    ...getTonTheoMatHang("phu-lieu", tonKhoDelta),
  ].filter((v) => v.ton < 100).slice(0, 5);

  const [aiChat, setAiChat] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChat.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    // Giả lập AI Minimax trả lời nhanh về kho
    setTimeout(() => {
      setAiResponse(`Minimax (AI Kho): Em đã rà soát, hiện tại mã "${aiChat}" đang có biến động xuất nhập nhiều trong tuần. Anh cần em lập báo cáo chi tiết không? 📦`);
      setIsAiLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header - Glassmorphism Premium */}
      <div className="relative overflow-hidden rounded-3xl p-6 shadow-2xl border border-white/20" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)", backdropFilter: "blur(20px)" }}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-70 animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl opacity-70" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/20">
              <Warehouse className="w-3.5 h-3.5" /> Phân hệ Quản lý Kho
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Xin chào, {user?.name || user?.id} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Vải · Phụ liệu · Thành phẩm đã sẵn sàng hoạt động.
            </p>
          </div>

          {/* AI Quick Chat Widget */}
          <div className="w-full md:w-96 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 border border-white/30 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" /> AI Kho (Minimax)
            </div>
            {aiResponse ? (
              <div className="text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 p-3 rounded-xl mb-2 animate-fade-in border border-emerald-100 dark:border-emerald-500/20">
                {aiResponse}
              </div>
            ) : null}
            <form onSubmit={handleAiSubmit} className="flex gap-2 relative">
              <input 
                type="text" 
                value={aiChat}
                onChange={(e) => setAiChat(e.target.value)}
                placeholder="Hỏi nhanh tồn kho..." 
                className="flex-1 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm border-none shadow-inner focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button disabled={isAiLoading} type="submit" className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30">
                {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Cảnh báo (Nổi bật) */}
      {tonThap.length > 0 && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-rose-500/10 to-orange-500/5 border border-rose-500/20 flex items-center justify-between group cursor-pointer hover:bg-rose-500/15 transition-colors">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-400">
            <div className="p-2 bg-rose-500/20 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold">Cảnh báo tồn kho</div>
              <div className="text-sm opacity-90">{tonThap.length} mặt hàng sắp hết (&lt; 100). Cần nhập thêm!</div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-rose-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      )}

      {/* Modern KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Tồn Vải" value={tonVai.toLocaleString()} icon={<Layers />} color="from-indigo-500 to-violet-500" />
        <KPICard title="Tồn Phụ liệu" value={tonPL.toLocaleString()} icon={<PackageOpen />} color="from-sky-500 to-cyan-500" />
        <KPICard title="Nhập Hôm nay" value={formatVNDShort(kpi.tongGiaTriNhap)} icon={<ArrowDownToLine />} color="from-emerald-500 to-teal-500" />
        <KPICard title="Xuất Hôm nay" value={formatVNDShort(kpi.tongGiaTriXuat)} icon={<ArrowUpFromLine />} color="from-orange-500 to-amber-500" />
      </div>

      {/* Quick Actions (Floating Glass Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <ActionCard href="/nhap-kho-mobile" icon={<ArrowDownToLine />} label="Lập Phiếu Nhập" bg="bg-emerald-50 dark:bg-emerald-900/20" text="text-emerald-700 dark:text-emerald-400" />
        <ActionCard href="/xuat-kho-mobile" icon={<ArrowUpFromLine />} label="Lập Phiếu Xuất" bg="bg-rose-50 dark:bg-rose-900/20" text="text-rose-700 dark:text-rose-400" />
        <ActionCard href="/kiem-ke-mobile" icon={<ClipboardCheck />} label="Kiểm Kê" bg="bg-violet-50 dark:bg-violet-900/20" text="text-violet-700 dark:text-violet-400" />
        <ActionCard href="/lo-hang-mobile" icon={<PackageOpen />} label="Quản lý Lô" bg="bg-amber-50 dark:bg-amber-900/20" text="text-amber-700 dark:text-amber-400" />
      </div>

      {/* Bảng dữ liệu hiện đại */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold flex items-center gap-2">
            <span className="w-2 h-6 rounded-full bg-amber-500" />
            Phiếu chờ duyệt ({choDuyet.length})
          </h2>
          <button className="text-sm text-emerald-600 font-medium hover:underline">Xem tất cả</button>
        </div>
        
        {choDuyet.length === 0 ? (
          <EmptyState title="Khoẻ re!" description="Tuyệt vời, tất cả phiếu đã được duyệt xử lý xong." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="py-3 px-4 rounded-l-xl font-medium">Mã Phiếu</th>
                  <th className="py-3 px-4 font-medium">Sản phẩm</th>
                  <th className="py-3 px-4 font-medium">Số lượng</th>
                  <th className="py-3 px-4 font-medium">Thành tiền</th>
                  <th className="py-3 px-4 rounded-r-xl font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {choDuyet.map((p) => {
                  const s = TRANG_THAI_PK_STYLE[p.trangThai];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{p.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{p.tenSP}</div>
                        <div className="text-xs text-slate-500">{p.loaiKho}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{p.soLuong.toLocaleString()} {p.donVi}</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatVNDShort(p.thanhTien)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
                          {p.trangThai}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Components phụ trợ
function KPICard({ title, value, icon, color }: { title: string, value: string, icon: any, color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group">
      <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${color} rounded-full opacity-10 group-hover:scale-125 transition-transform duration-500`} />
      <div className={`w-10 h-10 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}>
        {icon}
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</div>
      <div className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</div>
    </div>
  );
}

function ActionCard({ href, icon, label, bg, text }: { href: string, icon: any, label: string, bg: string, text: string }) {
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl ${bg} ${text} hover:-translate-y-1 hover:shadow-lg transition-all duration-300 border border-current/10`}>
      <div className="p-3 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm shadow-sm">
        {icon}
      </div>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}

