"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, Search, X, Send, ListChecks, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";
import { MiminGroupTabs } from "@/components/mimin-group/MiminGroupTabs";
import { useDanhMucSP, type SanPham } from "@/lib/data/danh-muc-sp-store";
import { LOAI_SP_LABELS } from "@/lib/data/lenh-cat-store";
import { useSession } from "@/components/session-provider";
import { supabase } from "@/lib/supabase/client";

type YeuCau = {
  id: string;
  ma_sp: string;
  ten_sp: string;
  hinh_anh: string | null;
  ten_khach: string | null;
  sdt_khach: string | null;
  so_luong_yeu_cau: number | null;
  ghi_chu: string | null;
  nguoi_gui_name: string | null;
  trang_thai: string;
  created_at: string;
};

function anhSanPham(sp: SanPham): string {
  if (sp.hinhAnh) return sp.hinhAnh;
  const anhMau = sp.dsMau?.find((m) => m.img);
  return anhMau?.img || "";
}

function formatTien(v: number) {
  return v.toLocaleString("vi-VN") + "đ";
}

export default function KhoMauPage() {
  const { user } = useSession();
  const tenNguoiDung = user?.name || "Khuyết danh";
  const { dsSanPham, loading } = useDanhMucSP();

  const [search, setSearch] = useState("");
  const [dangXem, setDangXem] = useState<SanPham | null>(null);
  const [tenKhach, setTenKhach] = useState("");
  const [sdtKhach, setSdtKhach] = useState("");
  const [soLuong, setSoLuong] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [dangGui, setDangGui] = useState(false);

  const [hienYeuCau, setHienYeuCau] = useState(false);
  const [dsYeuCau, setDsYeuCau] = useState<YeuCau[]>([]);

  const filtered = dsSanPham.filter((sp) =>
    sp.tenSP.toLowerCase().includes(search.toLowerCase()) || sp.id.toLowerCase().includes(search.toLowerCase())
  );

  const taiYeuCau = async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from("kho_mau_yeu_cau").select("*").order("created_at", { ascending: false });
    if (!error) setDsYeuCau((data || []) as YeuCau[]);
  };

  useEffect(() => {
    taiYeuCau();
  }, []);

  const moChiTiet = (sp: SanPham) => {
    setDangXem(sp);
    setTenKhach("");
    setSdtKhach("");
    setSoLuong("");
    setGhiChu("");
  };

  const guiYeuCau = async () => {
    if (!dangXem) return;
    if (!supabase) {
      toast.error("Chưa kết nối được cơ sở dữ liệu.");
      return;
    }
    setDangGui(true);
    const yc: YeuCau = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ma_sp: dangXem.id,
      ten_sp: dangXem.tenSP,
      hinh_anh: anhSanPham(dangXem) || null,
      ten_khach: tenKhach.trim() || null,
      sdt_khach: sdtKhach.trim() || null,
      so_luong_yeu_cau: soLuong ? parseInt(soLuong, 10) : null,
      ghi_chu: ghiChu.trim() || null,
      nguoi_gui_name: tenNguoiDung,
      trang_thai: "Mới",
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("kho_mau_yeu_cau").insert(yc);
    setDangGui(false);
    if (error) {
      toast.error("Gửi yêu cầu thất bại: " + error.message);
      return;
    }
    toast.success("Đã gửi yêu cầu sản xuất!");
    setDangXem(null);
    taiYeuCau();
  };

  const danhDauDaXuLy = async (id: string) => {
    if (!supabase) return;
    setDsYeuCau((prev) => prev.map((y) => (y.id === id ? { ...y, trang_thai: "Đã xử lý" } : y)));
    await supabase.from("kho_mau_yeu_cau").update({ trang_thai: "Đã xử lý" }).eq("id", id);
  };

  const soYeuCauMoi = dsYeuCau.filter((y) => y.trang_thai === "Mới").length;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 pb-24 md:pb-20">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-brand-500" /> Kho mẫu
        </h1>
        <p className="text-sm opacity-70 mt-1">Các mẫu đã có quy trình sản xuất sẵn — xem và gửi yêu cầu để được sản xuất.</p>
      </div>

      <MiminGroupTabs />

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mẫu theo tên hoặc mã..."
            className="w-full bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
          />
        </div>
        <button
          onClick={() => setHienYeuCau((v) => !v)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
        >
          <ListChecks className="w-4 h-4" /> Yêu cầu đã gửi {soYeuCauMoi > 0 && `(${soYeuCauMoi} mới)`}
        </button>
      </div>

      {hienYeuCau && (
        <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl p-4 space-y-2">
          <div className="font-semibold text-sm mb-1">Danh sách yêu cầu sản xuất</div>
          {dsYeuCau.length === 0 ? (
            <div className="text-sm opacity-60 py-4 text-center">Chưa có yêu cầu nào.</div>
          ) : (
            dsYeuCau.map((y) => (
              <div key={y.id} className="flex items-center gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5">
                <div className="w-10 h-10 rounded bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
                  {y.hinh_anh ? <img src={y.hinh_anh} className="w-full h-full object-cover" /> : <Package className="w-full h-full p-2 opacity-40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{y.ten_sp} {y.so_luong_yeu_cau ? `× ${y.so_luong_yeu_cau}` : ""}</div>
                  <div className="text-xs opacity-60 truncate">
                    {y.ten_khach ? `Khách: ${y.ten_khach} · ` : ""}Gửi bởi {y.nguoi_gui_name} · {new Date(y.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>
                {y.trang_thai === "Mới" ? (
                  <button
                    onClick={() => danhDauDaXuLy(y.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 text-xs font-medium hover:bg-amber-500/25 transition shrink-0"
                  >
                    Mới
                  </button>
                ) : (
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-600 text-xs font-medium shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã xử lý
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center opacity-50 text-sm">Đang tải kho mẫu...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center opacity-50 text-sm">Không tìm thấy mẫu phù hợp.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((sp) => {
            const anh = anhSanPham(sp);
            return (
              <div
                key={sp.id}
                onClick={() => moChiTiet(sp)}
                className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl overflow-hidden cursor-pointer hover:border-brand-500/50 hover:shadow-lg transition group"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                  {anh ? (
                    <img src={anh} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 opacity-30" />
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-0.5">
                  <div className="text-sm font-semibold truncate">{sp.tenSP}</div>
                  <div className="text-xs opacity-60">{LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}</div>
                  <div className="text-sm font-bold text-brand-600">{formatTien(sp.giaBanDuKien)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal chi tiết + gửi yêu cầu */}
      {dangXem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setDangXem(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
              {anhSanPham(dangXem) ? (
                <img src={anhSanPham(dangXem)} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-16 h-16 opacity-30" />
                </div>
              )}
              <button
                onClick={() => setDangXem(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h2 className="text-lg font-bold">{dangXem.tenSP}</h2>
                <div className="text-sm opacity-60">{LOAI_SP_LABELS[dangXem.loaiSP] || dangXem.loaiSP} · Mã {dangXem.id}</div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-bold text-brand-600">{formatTien(dangXem.giaBanDuKien)}</span>
                {dangXem.chatLieu && <span className="opacity-70">{dangXem.chatLieu}</span>}
              </div>
              {dangXem.dsMau?.length > 0 && (
                <div className="text-sm">
                  <span className="opacity-60">Màu: </span>
                  {dangXem.dsMau.map((m) => m.ten).join(", ")}
                </div>
              )}
              <div className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã có quy trình sản xuất chuẩn
              </div>

              <div className="border-t border-black/10 dark:border-white/10 pt-3 space-y-2">
                <div className="font-semibold text-sm">Gửi yêu cầu sản xuất</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={tenKhach}
                    onChange={(e) => setTenKhach(e.target.value)}
                    placeholder="Tên khách hàng"
                    className="bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                  />
                  <input
                    value={sdtKhach}
                    onChange={(e) => setSdtKhach(e.target.value)}
                    placeholder="Số điện thoại"
                    className="bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                  />
                </div>
                <input
                  value={soLuong}
                  onChange={(e) => setSoLuong(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="Số lượng dự kiến"
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 transition"
                />
                <textarea
                  value={ghiChu}
                  onChange={(e) => setGhiChu(e.target.value)}
                  placeholder="Ghi chú thêm (màu, size, yêu cầu riêng...)"
                  rows={2}
                  className="w-full bg-white/40 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-500 transition"
                />
                <button
                  onClick={guiYeuCau}
                  disabled={dangGui}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition"
                >
                  <Send className="w-4 h-4" /> Gửi yêu cầu sản xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
