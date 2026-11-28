"use client";

import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronRight, Factory, PackageCheck, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import type { AppUser } from "@/components/session-provider";
import type { PhieuDatNccPhuLieu, TrangThaiPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { useWorkspace, type OrganizationWorkspace } from "@/lib/workspace-context";

const STATUS_FLOW: TrangThaiPhieuDatNcc[] = ["Nháp", "Đã gửi NCC", "NCC xác nhận", "Đang dệt", "Hoàn thành", "Đã giao"];
const INTERNAL_ROLES = new Set(["admin", "planner", "accountant"]);

export function scopeOrders(orders: PhieuDatNccPhuLieu[], user: AppUser | null, workspaces: OrganizationWorkspace[]) {
  if (!user) return [];
  if (INTERNAL_ROLES.has(user.role) || workspaces.some((workspace) => workspace.dataScope === "SYSTEM")) return orders;
  const organizationIds = new Set(workspaces.map((workspace) => workspace.id));
  const workspaceOrders = orders.filter((order) =>
    organizationIds.has(order.ownerOrganizationId || "")
    || organizationIds.has(order.supplierOrganizationId || "")
    || organizationIds.has(order.customerOrganizationId || ""));
  if (workspaceOrders.length > 0) return workspaceOrders;
  const identity = user.maNV || user.id || user.email;
  if (user.role === "supplier" || user.role === "partner") return orders.filter((order) => order.maNcc === identity);
  if (user.role === "workshop_customer" || user.role === "buyer_customer") return orders.filter((order) => order.maKhachHang === identity);
  return orders.filter((order) => order.nguoiTao === user.name || order.nguoiTao === user.email);
}

function nextStatus(order: PhieuDatNccPhuLieu, user: AppUser | null): TrangThaiPhieuDatNcc | null {
  const next = STATUS_FLOW[STATUS_FLOW.indexOf(order.trangThai) + 1];
  if (!next || !user) return null;
  if (INTERNAL_ROLES.has(user.role)) return next;
  if ((user.role === "supplier" || user.role === "partner") && ["NCC xác nhận", "Đang dệt", "Hoàn thành"].includes(next)) return next;
  return null;
}

export function TheoDoiTienDo({ user }: { user: AppUser | null }) {
  const { orders, loading, updateStatus } = usePhieuDatNcc();
  const { workspaces } = useWorkspace();
  const [query, setQuery] = useState("");
  const visibleOrders = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("vi");
    return scopeOrders(orders, user, workspaces).filter((order) => !keyword || [order.maPhieu, order.maNcc, order.maKhachHang, order.tenVatTu].some((value) => value?.toLocaleLowerCase("vi").includes(keyword)));
  }, [orders, query, user, workspaces]);

  const changeStatus = async (order: PhieuDatNccPhuLieu) => {
    const status = nextStatus(order, user);
    if (!status) return;
    await updateStatus(order.id, status, user?.name || user?.email || "Người dùng");
    toast.success(`${order.maPhieu}: ${status}`);
  };

  if (loading) return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center text-xs text-slate-500">Đang tải tiến độ đơn hàng...</div>;
  return <div className="space-y-4">
    <div className="grid gap-3.5 sm:grid-cols-3">
      <Summary icon={CalendarClock} label="Đơn đang theo dõi" value={visibleOrders.filter((item) => item.trangThai !== "Đã giao").length} border="border-l-4 border-l-amber-500" valueColor="text-amber-600 dark:text-amber-400" />
      <Summary icon={Factory} label="Đang dệt sản xuất" value={visibleOrders.filter((item) => item.trangThai === "Đang dệt").length} border="border-l-4 border-l-sky-500" valueColor="text-sky-600 dark:text-sky-400" />
      <Summary icon={PackageCheck} label="Đã hoàn tất & giao" value={visibleOrders.filter((item) => item.trangThai === "Đã giao").length} border="border-l-4 border-l-emerald-500" valueColor="text-emerald-600 dark:text-emerald-400" />
    </div>
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã phiếu, NCC, khách hàng hoặc vật tư..." />
      </div>
    </div>
    {visibleOrders.length === 0 ? <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-10 text-center"><Truck className="mx-auto h-9 w-9 text-slate-300 dark:text-slate-600" /><h2 className="mt-3 font-bold text-sm text-slate-800 dark:text-slate-200">Chưa có đơn hàng trong phạm vi tài khoản</h2><p className="mt-1 text-xs text-slate-400">Đơn sau khi lưu hoặc gửi NCC sẽ xuất hiện tại đây.</p></div> : visibleOrders.map((order) => {
      const activeIndex = STATUS_FLOW.indexOf(order.trangThai);
      const next = nextStatus(order, user);
      return <article key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 dark:border-slate-800 p-4 md:flex-row md:items-center md:justify-between"><div><div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">{order.maPhieu}</div><h2 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{order.tenVatTu || `${order.items?.length || 0} mặt hàng`}</h2><div className="mt-1 text-xs text-slate-400">NCC: <b className="text-slate-700 dark:text-slate-300">{order.maNcc}</b> · Khách/xưởng: <b className="text-slate-700 dark:text-slate-300">{order.maKhachHang || "MIMIN"}</b> · Hẹn giao: {order.ngayGiao}</div></div>{next && <button type="button" className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition" onClick={() => void changeStatus(order)}>Chuyển sang {next}<ChevronRight className="h-4 w-4 text-emerald-400" /></button>}</div>
        <div className="overflow-x-auto p-4"><div className="flex min-w-[720px] items-start">{STATUS_FLOW.map((status, index) => <div key={status} className="flex flex-1 items-start"><div className="flex min-w-24 flex-col items-center text-center"><div className={`grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-bold ${index <= activeIndex ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-400 dark:bg-slate-900 dark:border-slate-700"}`}>{index < activeIndex ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div><span className={`mt-2 text-xs font-medium ${index <= activeIndex ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>{status}</span></div>{index < STATUS_FLOW.length - 1 && <div className={`mt-4 h-0.5 flex-1 ${index < activeIndex ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"}`} />}</div>)}</div></div>
        {order.lichSuTrangThai?.length ? <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 py-2.5 text-[11px] text-slate-400">Cập nhật gần nhất: {order.lichSuTrangThai.at(-1)?.nguoiCapNhat} · {new Date(order.lichSuTrangThai.at(-1)?.thoiGian || order.createdAt).toLocaleString("vi-VN")}</div> : null}
      </article>;
    })}
  </div>;
}

function Summary({ icon: Icon, label, value, border, valueColor }: { icon: typeof Truck; label: string; value: number; border?: string; valueColor?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between ${border || "border-l-4 border-l-slate-400"}`}>
      <div>
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
        <div className={`text-xl md:text-2xl font-bold font-mono tracking-tight mt-1 ${valueColor || "text-slate-900 dark:text-white"}`}>
          {value} <span className="text-xs font-normal text-slate-400">đơn</span>
        </div>
      </div>
      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
