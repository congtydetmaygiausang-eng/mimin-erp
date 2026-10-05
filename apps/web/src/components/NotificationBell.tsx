"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  X,
  AlertTriangle,
  Clock,
  Package,
  Wallet,
  Users,
  AlertCircle,
  XCircle,
  Activity,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { useLenhCat } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { KHO_VAI, KHO_VAT_TU, formatVNDShort } from "@/lib/data/real-data";
import { getDanhSachThuChi } from "@/lib/data/thu-chi";
import { tinhTatCaCanhBao, type CanhBao, type MucDoCanhBao, type LoaiCanhBao } from "@/lib/canh-bao-engine";
import { useNotification, type Notification as StoredNotification } from "@/lib/notification-store";

export type NotificationCategory = "all" | "unread" | "p0" | "san_xuat" | "kho_finance";

export interface UnifiedNotification {
  id: string;
  loai: LoaiCanhBao | "thu-chi" | "he-thong";
  mucDo: MucDoCanhBao;
  tieuDe: string;
  noiDung: string;
  doiTuong?: string;
  lienKet?: string;
  thoiGian: string;
  daDoc: boolean;
  nguon: "engine" | "user";
}

const READ_STORAGE_KEY = "mimin_read_notifications_v2";

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  } catch {
    return "Gần đây";
  }
}

export function NotificationBell() {
  const router = useRouter();
  const { dsLenhCat } = useLenhCat();
  const { danhSachTrangThai } = useKho();
  const { phanCong } = usePhanCong();
  const { notifications: userNotis, markAsRead: markUserNotiAsRead, markAllAsRead: markAllUserNotiAsRead } = useNotification();

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Đọc danh sách ID đã đọc từ localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_STORAGE_KEY);
      if (raw) {
        setReadIds(new Set(JSON.parse(raw)));
      }
      const isEnabled = localStorage.getItem("mimin_notifications_enabled") === "true";
      setIsPushSubscribed(isEnabled);
    } catch {}
  }, []);

  // Lắng nghe thay đổi trạng thái push từ NotificationToggle
  useEffect(() => {
    const handlePushChange = (e: any) => {
      if (typeof e.detail?.isSubscribed === "boolean") {
        setIsPushSubscribed(e.detail.isSubscribed);
      }
    };
    window.addEventListener("mimin_push_state_changed", handlePushChange);
    return () => window.removeEventListener("mimin_push_state_changed", handlePushChange);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Quét dữ liệu thực tế từ hệ thống ERP
  const allNotifications = useMemo<UnifiedNotification[]>(() => {
    // 1. Quét dữ liệu kho thực tế
    const vaiMap = new Map(KHO_VAI.map((v) => [v.maVT, v]));
    const vtMap = new Map(KHO_VAT_TU.map((v) => [v.maVT, v]));

    const dsKhoVai = danhSachTrangThai("vai").map((v) => {
      const info = vaiMap.get(v.maVT);
      return {
        sku: v.maVT,
        ten: info?.tenVT ? `${info.tenVT} (${v.maVT})` : v.maVT,
        sl: v.tonKho,
        donVi: info?.dvt || "kg",
        tonThap: v.tonToiThieu || 500,
      };
    });

    const dsKhoPL = danhSachTrangThai("phu-lieu").map((p) => {
      const info = vtMap.get(p.maVT);
      return {
        sku: p.maVT,
        ten: info?.tenVT ? `${info.tenVT} (${p.maVT})` : p.maVT,
        sl: p.tonKho,
        donVi: info?.dvt || "cái",
        tonThap: p.tonToiThieu || 1000,
      };
    });

    const dsKho = [...dsKhoVai, ...dsKhoPL];

    // 2. Chạy cảnh báo tự động từ CanhBaoEngine
    const rawEngineAlerts = tinhTatCaCanhBao(
      [],
      dsKho.length > 0 ? dsKho : undefined,
      undefined,
      dsLenhCat,
      undefined,
      phanCong
    );

    // Chuyển sang format UnifiedNotification
    const engineNotis: UnifiedNotification[] = rawEngineAlerts.map((cb) => ({
      id: cb.id,
      loai: cb.loai,
      mucDo: cb.mucDo,
      tieuDe: cb.tieuDe,
      noiDung: cb.noiDung,
      doiTuong: cb.doiTuong,
      lienKet: cb.lienKet,
      thoiGian: cb.thoiGian,
      daDoc: readIds.has(cb.id),
      nguon: "engine",
    }));

    // 3. Quét Thu Chi Nội Bộ (các khoản chi lớn phát sinh)
    const thuChiNotis: UnifiedNotification[] = [];
    try {
      const dsThuChi = getDanhSachThuChi();
      for (const tc of dsThuChi.slice(0, 10)) {
        if (tc.loai === "chi" && tc.soTien >= 2000000) {
          const id = `tc-lon-${tc.id}`;
          thuChiNotis.push({
            id,
            loai: "thu-chi",
            mucDo: tc.soTien >= 5000000 ? "cao" : "trung-binh",
            tieuDe: `Khoản chi lớn: ${formatVNDShort(tc.soTien)}`,
            noiDung: `${tc.noiDung} · Người chi: ${tc.nguoiThucHien} (${tc.ngay})`,
            doiTuong: tc.nguoiThucHien,
            lienKet: "/thu-chi",
            thoiGian: tc.ngayTao,
            daDoc: readIds.has(id),
            nguon: "engine",
          });
        }
      }
    } catch {}

    // 4. Kết hợp thông báo người dùng/hệ thống đã lưu
    const storedUserNotis: UnifiedNotification[] = userNotis.map((un) => ({
      id: un.id,
      loai: (un.type === "late" ? "lsx-qua-han" : un.type === "qc_fail" ? "cn-tre-sl" : un.type === "low_stock" ? "kho-sap-het" : "he-thong") as any,
      mucDo: un.type === "error" || un.type === "qc_fail" || un.type === "late" ? "cao" : "trung-binh",
      tieuDe: un.title,
      noiDung: un.body,
      lienKet: un.link,
      thoiGian: un.createdAt,
      daDoc: un.read || readIds.has(un.id),
      nguon: "user",
    }));

    // Gộp và loại trùng ID
    const mergedMap = new Map<string, UnifiedNotification>();
    for (const item of [...engineNotis, ...thuChiNotis, ...storedUserNotis]) {
      mergedMap.set(item.id, item);
    }

    // Sắp xếp: Ưu tiên P0 (Cao) lên trước, sau đó theo thời gian mới nhất
    return Array.from(mergedMap.values()).sort((a, b) => {
      const priorityWeight: Record<MucDoCanhBao, number> = { cao: 3, "trung-binh": 2, thap: 1 };
      if (priorityWeight[a.mucDo] !== priorityWeight[b.mucDo]) {
        return priorityWeight[b.mucDo] - priorityWeight[a.mucDo];
      }
      return new Date(b.thoiGian).getTime() - new Date(a.thoiGian).getTime();
    });
  }, [dsLenhCat, danhSachTrangThai, phanCong, userNotis, readIds, refreshKey]);

  // Thống kê phân loại
  const unreadList = useMemo(() => allNotifications.filter((n) => !n.daDoc), [allNotifications]);
  const unreadCount = unreadList.length;
  const criticalP0Count = useMemo(() => unreadList.filter((n) => n.mucDo === "cao").length, [unreadList]);

  // Lọc theo tab
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case "unread":
        return allNotifications.filter((n) => !n.daDoc);
      case "p0":
        return allNotifications.filter((n) => n.mucDo === "cao");
      case "san_xuat":
        return allNotifications.filter(
          (n) => n.loai === "lsx-qua-han" || n.loai === "cn-tre-sl"
        );
      case "kho_finance":
        return allNotifications.filter(
          (n) => n.loai === "kho-sap-het" || n.loai === "cong-no-qua-han" || n.loai === "ncc-vuot-han-muc" || n.loai === "thu-chi"
        );
      default:
        return allNotifications;
    }
  }, [allNotifications, activeTab]);

  // Đánh dấu 1 thông báo là đã đọc
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch {}
    markUserNotiAsRead(id);
  };

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = () => {
    const updated = new Set(readIds);
    allNotifications.forEach((n) => updated.add(n.id));
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(updated)));
    } catch {}
    markAllUserNotiAsRead();
    toast.success("Đã đánh dấu đã đọc tất cả thông báo");
  };

  // Click vào thông báo
  const handleItemClick = (n: UnifiedNotification) => {
    handleMarkAsRead(n.id);
    setOpen(false);
    if (n.lienKet) {
      router.push(n.lienKet);
    }
  };

  // Làm mới cảnh báo
  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Đã cập nhật dữ liệu thông báo mới nhất");
    }, 400);
  };

  // Bật/tắt thông báo đẩy
  const handleTogglePush = () => {
    window.dispatchEvent(new CustomEvent("mimin_trigger_push_toggle"));
  };

  // Render icon theo loại
  const renderIcon = (loai: UnifiedNotification["loai"], mucDo: MucDoCanhBao) => {
    const isP0 = mucDo === "cao";
    switch (loai) {
      case "lsx-qua-han":
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isP0 ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600" : "bg-amber-100 dark:bg-amber-950/60 text-amber-600"}`}>
            <Clock className="w-4 h-4" />
          </div>
        );
      case "cn-tre-sl":
        return (
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case "kho-sap-het":
        return (
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isP0 ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600" : "bg-amber-100 dark:bg-amber-950/60 text-amber-600"}`}>
            <Package className="w-4 h-4" />
          </div>
        );
      case "cong-no-qua-han":
      case "ncc-vuot-han-muc":
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        );
      case "thu-chi":
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* NÚT CHUÔNG TRÊN THANH HEADER */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl text-white hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200"
        title={
          unreadCount > 0
            ? `Chuông thông báo: ${unreadCount} cảnh báo cần xử lý ${criticalP0Count > 0 ? `(${criticalP0Count} việc khẩn cấp P0!)` : ""}`
            : "Chuông thông báo: Hệ thống đang vận hành ổn định"
        }
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5 text-white" />

        {/* Badge số lượng thông báo */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center">
            {criticalP0Count > 0 && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex items-center justify-center px-1.5 h-[18px] min-w-[18px] rounded-full text-[10px] font-black text-white shadow-md ring-2 ring-[#0B4D5D] ${
                criticalP0Count > 0 ? "bg-rose-600 animate-pulse" : "bg-rose-500"
              }`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* DROPDOWN DANH SÁCH THÔNG BÁO */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] sm:w-[440px] max-w-[calc(100vw-20px)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-[100] animate-fade-in text-slate-800 dark:text-slate-100">
          {/* Header Panel */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#0B4D5D] to-teal-600 text-white shadow-xs">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                    <span>Thông Báo & Cảnh Báo</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
                        {unreadCount} mới
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dữ liệu sản xuất & kho real-time</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                    title="Đánh dấu đã đọc tất cả"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition"
                  title="Làm mới cảnh báo"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Dải trạng thái Thông báo đẩy Web Push */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-white/5 bg-slate-100/50 dark:bg-slate-800/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${isPushSubscribed ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm" : "bg-amber-400"}`} />
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {isPushSubscribed ? "Thông báo đẩy: Đang bật trên máy" : "Thông báo đẩy: Chưa bật"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleTogglePush}
              className={`text-[11px] font-semibold underline underline-offset-2 transition ${
                isPushSubscribed ? "text-slate-500 hover:text-rose-600" : "text-sky-600 hover:text-sky-700"
              }`}
            >
              {isPushSubscribed ? "Tắt" : "Bật ngay"}
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 dark:border-white/5 overflow-x-auto text-xs font-semibold scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition ${
                activeTab === "all"
                  ? "bg-[#0B4D5D] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Tất cả ({allNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("unread")}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition ${
                activeTab === "unread"
                  ? "bg-[#0B4D5D] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("p0")}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition flex items-center gap-1 ${
                activeTab === "p0"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              }`}
            >
              <span>🚨 P0 Khẩn</span>
              <span>({allNotifications.filter((n) => n.mucDo === "cao").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("san_xuat")}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition ${
                activeTab === "san_xuat"
                  ? "bg-[#0B4D5D] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Sản xuất & QC
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("kho_finance")}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition ${
                activeTab === "kho_finance"
                  ? "bg-[#0B4D5D] text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Kho & Tiền
            </button>
          </div>

          {/* Danh sách thông báo */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-2.5 shadow-xs">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {activeTab === "unread" ? "Đã đọc hết mọi thông báo!" : "Không có cảnh báo nào tồn đọng"}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                  Dây chuyền sản xuất, kho bãi và công nợ đang vận hành đúng tiến độ chuẩn MIMIN ERP.
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const isP0 = n.mucDo === "cao";
                return (
                  <div
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition group ${
                      !n.daDoc ? "bg-sky-50/40 dark:bg-sky-950/15" : ""
                    }`}
                  >
                    {/* Icon */}
                    {renderIcon(n.loai, n.mucDo)}

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Priority Badge */}
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                            isP0
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300/60"
                              : n.mucDo === "trung-binh"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60"
                          }`}
                        >
                          {isP0 ? "P0 Khẩn cấp" : n.mucDo === "trung-binh" ? "P1 Cần xử lý" : "P2 Theo dõi"}
                        </span>

                        {n.doiTuong && (
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                            {n.doiTuong}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 ml-auto whitespace-nowrap">
                          {formatRelativeTime(n.thoiGian)}
                        </span>
                      </div>

                      {/* Tiêu đề */}
                      <h4
                        className={`text-xs mt-1 leading-snug line-clamp-1 ${
                          !n.daDoc
                            ? "font-extrabold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {n.tieuDe}
                      </h4>

                      {/* Nội dung chi tiết */}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {n.noiDung}
                      </p>

                      {/* Footer item: Bấm để xử lý */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 dark:border-white/5 text-[10px]">
                        <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium group-hover:underline">
                          <span>Bấm để xử lý</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>

                        {!n.daDoc && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-slate-400 hover:text-emerald-600 px-1 py-0.5 rounded transition flex items-center gap-0.5"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="w-3 h-3" />
                            <span>Đã đọc</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer chuyển sang Trung tâm cảnh báo rủi ro */}
          <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/40 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400">
              Tổng {allNotifications.length} cảnh báo vận hành
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/canh-bao");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#0B4D5D] to-teal-600 hover:from-teal-700 hover:to-teal-800 shadow-sm transition"
            >
              <span>Xem Trung Tâm Cảnh Báo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
