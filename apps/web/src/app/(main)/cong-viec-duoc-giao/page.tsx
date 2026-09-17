"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, UserPlus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useLenhCat, type CongDoanItem, TRANG_THAI_CD_LABELS } from "@/lib/data/lenh-cat-store";
import { useDonHang } from "@/lib/data/don-hang-store";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { LOCAL_ACCOUNT_MODE } from "@/lib/local-account-mode";
import { localActiveAccount, readLocalAccounts, saveLocalAccount, useLocalAccountRevision } from "@/lib/local-account-store";
import { canAccessStage, stageModule, canAccessBusinessRecord } from "@/lib/account-access";
import { can, type Module } from "@/lib/permissions";
import type { RecordAssignment, AccountAssignmentAudit } from "@/lib/data/account-access";
import { createAccountAssignmentTestData } from "@/lib/data/real-data";

const STAGE_PATHS: Partial<Record<Module, string>> = { "to-cat": "/to-cat-work", "to-in-theu": "/ui-intd", "to-may": "/to-may-work", "kiem-tra-chat-luong": "/to-qc-work", "to-khuy-nut": "/ui-khuy-nut", "to-ui": "/ui-ui", "to-dong-goi": "/ui-dong-goi" };
interface AssignmentTarget { kind: "stage" | "production" | "order" | "purchase"; id: string; stageId?: string; title: string; assignment: RecordAssignment; }

export default function AssignedWorkPage() {
  return LOCAL_ACCOUNT_MODE ? <LocalAssignedWork /> : <div className="card p-6">Trang thử nghiệm chỉ mở trong chế độ test local.</div>;
}
function LocalAssignedWork() {
  useLocalAccountRevision();
  const { user } = useSession();
  const production = useLenhCat();
  const sales = useDonHang();
  const purchases = usePhieuDatNcc();
  const account = localActiveAccount();
  const [target, setTarget] = useState<AssignmentTarget | null>(null);
  const [query, setQuery] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [auditVersion, setAuditVersion] = useState(0);
  const admin = Boolean(account?.roles.includes("admin"));
  const accounts = readLocalAccounts();
  const audit: AccountAssignmentAudit[] = typeof window === "undefined" ? [] : JSON.parse(localStorage.getItem("mimin_local_assignment_audit") || "[]");
  const matches = (text: string) => text.toLowerCase().includes(query.toLowerCase());
  const eligibleAccounts = accounts.filter(item => item.active && (target?.kind !== "stage" ? item.kind === "employee" : item.kind !== "supplier"));
  const fields: FieldDef[] = [
    { name: "userIds", label: "Người phụ trách / người thực hiện", type: "checkbox-group", options: eligibleAccounts.map(item => ({ value: item.id, label: `${item.name} · ${item.employeeCode || item.partnerCode}` })) },
    { name: "team", label: "Mã tổ nhận việc", type: "text", placeholder: "Khớp mã tổ trong cấu hình tài khoản" },
    { name: "department", label: "Bộ phận nhận việc", type: "text", placeholder: "Khớp bộ phận trong cấu hình tài khoản" },
  ];
  const assignButton = (value: AssignmentTarget) => admin && <button className="text-xs text-blue-600 inline-flex items-center gap-1" onClick={() => setTarget(value)}><UserPlus size={14} /> Phân công</button>;
  const seed = async () => {
    if (!user || !admin || seeding) return;
    setSeeding(true);
    try {
      const data = createAccountAssignmentTestData(user.id);
      for (const item of data.accounts) if (!accounts.some(old => old.id === item.id)) saveLocalAccount(item);
      for (const order of data.production) if (!production.dsLenhCat.some(old => old.id === order.id)) await production.themLenhCat(order, user);
      for (const order of data.purchases) if (!purchases.orders.some(old => old.id === order.id)) await purchases.saveOrder(order);
      toast.success("Đã thêm bộ test: 2 tổ cắt, các công đoạn, 2 xưởng và 2 NCC. Chọn tài khoản trên thanh vàng để kiểm tra.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không tạo được bộ test"); }
    finally { setSeeding(false); }
  };
  return <div className="space-y-5">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-bold flex gap-2 items-center"><ClipboardList /> Công việc được giao</h1><p className="text-sm text-slate-500 mt-2">{account?.name} · Công việc theo liên kết tài khoản và bảng phân quyền hiện tại.</p></div>{admin && <button disabled={seeding} className="btn-primary inline-flex items-center gap-2" onClick={seed}><FlaskConical size={16} /> {seeding ? "Đang tạo…" : "Thêm bộ dữ liệu test"}</button>}</header>
    <input className="input w-full" aria-label="Tìm công việc" value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm mã lệnh, đơn hàng, sản phẩm…" />
    {account?.kind !== "supplier" && <section className="space-y-3"><h2 className="font-bold">Lệnh sản xuất ({production.dsLenhCat.length})</h2>{production.dsLenhCat.filter(order => matches(`${order.id} ${order.tenSP}`)).map(order => <article key={order.id} className="card p-4 space-y-3">
      <div className="flex justify-between gap-2"><strong>{order.id} · {order.tenSP}</strong>{assignButton({ kind: "production", id: order.id, title: `Phụ trách lệnh ${order.id}`, assignment: order })}</div><p className="text-xs text-slate-500">Số lượng: {order.tongSL} · Hạn: {order.hanHoanThanh}</p>
      <div className="grid gap-2 md:grid-cols-2">{order.phanCong.filter(stage => admin || canAccessStage(account, stage, "view", can)).map(stage => {
        const module = stageModule(stage);
        const path = module ? STAGE_PATHS[module] : undefined;
        return <div key={stage.id} className="rounded-xl border border-slate-200 dark:border-white/10 p-3 space-y-2"><div className="flex justify-between gap-2"><b className="text-sm">{stage.tenCongDoan}</b>{assignButton({ kind: "stage", id: order.id, stageId: stage.id, title: `${order.id} · ${stage.tenCongDoan}`, assignment: stage })}</div><p className="text-xs">{stage.nguoiTen || stage.nguoiMa || "Chưa giao người thực hiện"} · {TRANG_THAI_CD_LABELS[stage.trangThaiCD || "cho_giao"]}</p><p className="text-xs">SL giao: {stage.soLuong} · Đạt: {stage.soLuongHoanThanh || 0} · Lỗi: {stage.soLuongLoi || 0}</p>
          {path && <Link href={`${path}?lenhId=${encodeURIComponent(order.id)}`} className="text-xs text-blue-600 underline">Mở công đoạn</Link>}
        </div>;
      })}</div>
    </article>)}{!production.dsLenhCat.length && <p className="card p-5 text-sm text-slate-500">Chưa có lệnh thuộc phạm vi được giao.</p>}</section>}
    {account?.kind === "employee" && <section className="space-y-3"><h2 className="font-bold">Đơn hàng ({sales.dsOrder.length})</h2>{sales.dsOrder.filter(order => matches(`${order.maDH} ${order.khachHang}`)).map(order => <div key={order.id} className="card p-4 flex justify-between gap-2"><div><b>{order.maDH}</b><p className="text-sm">{order.khachHang} · {order.trangThai}</p><Link className="text-xs text-blue-600 underline" href="/don-hang">Mở đơn hàng</Link></div>{assignButton({ kind: "order", id: order.id, title: `Phụ trách đơn ${order.maDH}`, assignment: order })}</div>)}</section>}
    {account?.kind !== "partner" && <section className="space-y-3"><h2 className="font-bold">Đơn đặt nhà cung cấp ({purchases.orders.length})</h2>{purchases.orders.filter(order => matches(`${order.maPhieu} ${order.maNcc} ${order.tenVatTu}`)).map(order => <div key={order.id} className="card p-4 space-y-2"><div className="flex justify-between gap-2"><b>{order.maPhieu} · {order.maNcc}</b>{assignButton({ kind: "purchase", id: order.id, title: `Phụ trách phiếu ${order.maPhieu}`, assignment: order })}</div><p className="text-sm">{order.tenVatTu} · {order.soLuong} {order.donVi} · {order.trangThai}</p>{account?.kind === "supplier" && canAccessBusinessRecord(account, order, "dat-ncc-phu-lieu", "edit", can) && <select aria-label={`Tiến độ ${order.maPhieu}`} className="input text-sm" value={order.trangThai} onChange={async event => { try { await purchases.updateStatus(order.id, event.target.value as typeof order.trangThai, account.id); toast.success("Đã cập nhật tiến độ"); } catch (error) { toast.error(String(error)); } }}><option value={order.trangThai}>{order.trangThai}</option>{["NCC xác nhận", "Đang dệt", "Hoàn thành", "Đã giao"].filter(status => status !== order.trangThai).map(status => <option key={status}>{status}</option>)}</select>}</div>)}</section>}
    {admin && <section className="card p-4" key={auditVersion}><h2 className="font-bold mb-2">Lịch sử phân công</h2>{audit.slice(-10).reverse().map((entry, index) => <p key={index} className="text-xs py-1">{entry.at} · {entry.recordId} · {(entry.before.userIds || []).join(", ") || "Chưa giao"} → {(entry.after.userIds || []).join(", ") || "Giao theo tổ/bộ phận"}</p>)}</section>}
    {target && <CrudModal open title={target.title} fields={fields} maxWidth="3xl" initial={{ userIds: target.assignment.userIds?.join(",") || "", team: target.assignment.team || "", department: target.assignment.department || "" }} onClose={() => setTarget(null)} onSubmit={async values => {
      if (!user || !localActiveAccount()?.roles.includes("admin")) throw new Error("Không có quyền phân công");
      const next: RecordAssignment = { userIds: values.userIds.split(",").filter(Boolean), team: values.team.trim(), department: values.department.trim() };
      if (target.kind === "stage" || target.kind === "production") {
        const order = production.dsLenhCat.find(item => item.id === target.id);
        if (!order) throw new Error("Lệnh không còn tồn tại");
        if (target.kind === "production") await production.suaLenhCat(order.id, { ...next, phuTrachSX: next.userIds?.[0] || "" }, user);
        else {
          const assigned = accounts.filter(item => next.userIds?.includes(item.id));
          const partnerCodes = new Set(assigned.filter(item => item.kind === "partner").map(item => item.partnerCode));
          if (partnerCodes.size > 1 || (partnerCodes.size && assigned.some(item => item.kind === "employee"))) throw new Error("Một phần giao gia công chỉ thuộc một xưởng; không trộn với nhân viên nội bộ");
          const first = assigned[0];
          const phanCong = order.phanCong.map(stage => stage.id === target.stageId ? { ...stage, ...next, nguoiMa: first ? first.employeeCode || first.partnerCode : "", nguoiTen: assigned.map(item => item.name).join(", "), loaiNguoi: first?.kind === "partner" ? "xuong_ngoai" : "noi_bo" } as CongDoanItem : stage);
          await production.suaLenhCat(order.id, { phanCong }, user);
        }
      } else if (target.kind === "order") sales.suaOrder(target.id, next);
      else { const order = purchases.orders.find(item => item.id === target.id); if (!order) throw new Error("Phiếu không tồn tại"); await purchases.saveOrder({ ...order, ...next }); }
      const before: RecordAssignment = { userIds: target.assignment.userIds, team: target.assignment.team, department: target.assignment.department };
      localStorage.setItem("mimin_local_assignment_audit", JSON.stringify([...audit, { at: new Date().toISOString(), actorId: user.id, recordId: `${target.id}${target.stageId ? `/${target.stageId}` : ""}`, before, after: next }]));
      setAuditVersion(value => value + 1);
    }} />}
  </div>;
}
