"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  History,
  ShoppingBag,
  FileText,
  CreditCard,
  Search,
  X,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Package,
} from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupplierRelations, EmptyRelationState } from "../supplier-relations";

type TimelineEvent = {
  id: string;
  type: "giao_dich" | "hop_dong" | "thanh_toan";
  date: string;
  title: string;
  supplier: string;
  detail: string;
  amount?: number;
  badge: string;
  badgeColor: string;
  icon: any;
  iconBg: string;
  link?: string;
};

export default function LichSuNccPage() {
  const { giaoDich, contracts, payments, suppliers } = useSupplierRelations();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Tổng hợp tất cả sự kiện thành dòng thời gian chuẩn hóa
  const allEvents = useMemo<TimelineEvent[]>(() => {
    const list: TimelineEvent[] = [];

    // 1. Giao dịch mua hàng nhập kho
    giaoDich
      .filter((g) => g.loai === "NHAP")
      .forEach((g) => {
        list.push({
          id: `gd-${g.id}`,
          type: "giao_dich",
          date: g.ngay,
          title: `Nhập kho: ${g.tenVT}`,
          supplier: g.nguonNhap || "NCC vãng lai",
          detail: `Số lượng: ${g.soLuong.toLocaleString("vi-VN")} ${g.donVi} · Đơn vị nhập kho sản xuất`,
          amount: g.thanhTien,
          badge: "Nhập mua",
          badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200",
          icon: ShoppingBag,
          iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
          link: "/nha-cung-cap/giao-dich-mua",
        });
      });

    // 2. Ký hợp đồng
    contracts.forEach((c) => {
      list.push({
        id: `hd-${c.id}`,
        type: "hop_dong",
        date: c.ngayKy || c.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        title: `Ký kết hợp đồng: ${c.soHopDong}`,
        supplier: c.tenDoiTac || c.maNcc,
        detail: `${c.tenHopDong || "Hợp đồng cung ứng"} · Đại diện: ${c.daiDienBenB || "Chưa cập nhật"}`,
        amount: c.giaTri,
        badge: "Hợp đồng",
        badgeColor: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200",
        icon: FileText,
        iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
        link: "/nha-cung-cap/hop-dong",
      });
    });

    // 3. Thanh toán tiền NCC
    payments.forEach((p) => {
      const sup = suppliers.find((s) => s.ma_ncc === p.maNcc);
      list.push({
        id: `tt-${p.id}`,
        type: "thanh_toan",
        date: p.ngay,
        title: `Thanh toán: ${p.maChungTu || p.id}`,
        supplier: sup?.ten_ncc || p.maNcc,
        detail: `Hình thức: ${p.phuongThuc} · Nội dung: ${p.ghiChu || "Thanh toán công nợ"}`,
        amount: p.soTien,
        badge: "Chi tiền",
        badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200",
        icon: CreditCard,
        iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        link: "/nha-cung-cap/thanh-toan",
      });
    });

    // Sắp xếp ngày mới nhất lên đầu
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [giaoDich, contracts, payments, suppliers]);

  // Thống kê
  const stats = useMemo(() => {
    const total = allEvents.length;
    const gdCount = allEvents.filter((e) => e.type === "giao_dich").length;
    const hdCount = allEvents.filter((e) => e.type === "hop_dong").length;
    const ttCount = allEvents.filter((e) => e.type === "thanh_toan").length;
    return { total, gdCount, hdCount, ttCount };
  }, [allEvents]);

  // Lọc danh sách
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allEvents.filter((e) => {
      const matchQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.supplier.toLowerCase().includes(q) ||
        e.detail.toLowerCase().includes(q) ||
        e.date.includes(q);

      const matchT = filterType === "ALL" || e.type === filterType;
      return matchQ && matchT;
    });
  }, [allEvents, search, filterType]);

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
              <History className="w-3.5 h-3.5 text-teal-600" />
              Nhật Ký Dòng Hoạt Động Chuỗi Cung Ứng
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Lịch Sử Hoạt Động Nhà Cung Cấp
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Dòng thời gian tổng hợp các sự kiện giao dịch nhập mua hàng, ký kết hợp đồng và chi trả thanh toán công nợ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shadow-2xs">
                📜 {stats.total} sự kiện hoạt động
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 shadow-2xs">
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" /> {stats.gdCount} phiếu nhập mua
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 shadow-2xs">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> {stats.hdCount} hợp đồng
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> {stats.ttCount} đợt thanh toán
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TÌM KIẾM & BỘ LỌC DÒNG THỜI GIAN */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo sự kiện, tên nhà cung cấp, nội dung giao dịch hoặc ngày..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Tất cả sự kiện", count: stats.total },
              { id: "giao_dich", label: "Mua hàng nhập kho", count: stats.gdCount },
              { id: "hop_dong", label: "Hợp đồng đối tác", count: stats.hdCount },
              { id: "thanh_toan", label: "Thanh toán công nợ", count: stats.ttCount },
            ].map((tab) => {
              const active = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-slate-500">
            Hiển thị: <b className="text-teal-700 font-mono">{filtered.length}</b> sự kiện
          </span>
        </div>
      </div>

      {/* 3. DÒNG THỜI GIAN HOẠT ĐỘNG (CHRONOLOGICAL TIMELINE) */}
      {filtered.length === 0 ? (
        <EmptyRelationState>Chưa có sự kiện hoạt động nào phù hợp điều kiện lọc.</EmptyRelationState>
      ) : (
        <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${item.iconBg}`}
                  >
                    <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>

                  {/* Event Card */}
                  <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xs transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-400">{item.date}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h3>
                      </div>

                      {item.amount !== undefined && item.amount > 0 && (
                        <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatVND(item.amount)}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Đối tác NCC: <b className="text-slate-900 dark:text-white font-bold">{item.supplier}</b>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.detail}</div>

                    {item.link && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700"
                        >
                          Xem chi tiết phân hệ <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
