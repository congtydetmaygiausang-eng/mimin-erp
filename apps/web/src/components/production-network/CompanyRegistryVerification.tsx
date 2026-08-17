"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, DatabaseZap, RefreshCw, ShieldQuestion, XCircle } from "lucide-react";
import { toast } from "sonner";
import { loadLatestRegistryVerification, runRegistryVerification, type CompanyRegistryVerification as Verification, type RegistryProviderAttempt } from "@/lib/company-registry-verification";
import type { FieldComparisonStatus, ReconciliationStatus, RegistryFieldName } from "@/lib/registry-reconciliation";

const FIELD_LABELS: Record<RegistryFieldName, string> = {
  TAX_CODE: "Mã số thuế",
  LEGAL_NAME: "Tên pháp lý",
  REGISTERED_ADDRESS: "Địa chỉ đăng ký",
  TAXPAYER_STATUS: "Trạng thái hoạt động",
};

const STATUS_LABELS: Record<ReconciliationStatus, string> = {
  MATCH: "Hai nguồn khớp",
  PARTIAL: "Khớp một phần",
  CONFLICT: "Có mâu thuẫn",
  INSUFFICIENT: "Chưa đủ dữ liệu",
};

const FIELD_STATUS_LABELS: Record<FieldComparisonStatus, string> = {
  MATCH: "Khớp",
  PARTIAL: "Tương đồng",
  CONFLICT: "Mâu thuẫn",
  MISSING_SOURCE: "Thiếu nguồn",
};

function statusStyle(status: ReconciliationStatus | FieldComparisonStatus): string {
  if (status === "MATCH") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "CONFLICT") return "border-rose-200 bg-rose-50 text-rose-800";
  if (status === "PARTIAL") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function CompanyRegistryVerification({ profileId, taxCode }: { profileId: string; taxCode: string }) {
  const [verification, setVerification] = useState<Verification | null>(null);
  const [attempts, setAttempts] = useState<RegistryProviderAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    void loadLatestRegistryVerification(profileId).then(value => { if (active) setVerification(value); }).catch(() => undefined);
    return () => { active = false; };
  }, [profileId]);

  const run = async () => {
    if (!taxCode) { toast.error("Hồ sơ chưa có mã số thuế để tra cứu"); return; }
    setLoading(true);
    try {
      const result = await runRegistryVerification(profileId, taxCode);
      setVerification(result.verification);
      setAttempts(result.attempts);
      toast.success("Đã lưu ảnh chụp đối chiếu VietQR và MaSoThue");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không đối chiếu được nguồn pháp lý");
    } finally { setLoading(false); }
  };

  return <section className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--border)" }}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3"><DatabaseZap className="h-6 w-6 shrink-0 text-brand-700"/><div><h2 className="font-bold text-lg">V4 · Đối chiếu pháp lý hai nguồn</h2><p className="text-xs opacity-60">VietQR là nguồn cấu trúc; MaSoThue là nguồn tham khảo. Kết quả không tự ghi đè hồ sơ công ty.</p></div></div>
      <button type="button" disabled={loading || !taxCode} onClick={() => void run()} className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>{loading ? "Đang đối chiếu..." : "Tra cứu & đối chiếu"}</button>
    </div>
    {!taxCode && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><AlertTriangle className="mr-2 inline h-4 w-4"/>Cần bổ sung mã số thuế trước khi chạy V4.</div>}
    {attempts.length > 0 && <div className="grid gap-2 sm:grid-cols-2">{attempts.map(item => <div key={item.provider} className={`rounded-lg border p-3 text-xs ${item.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}><div className="flex items-center gap-2 font-semibold">{item.ok ? <CheckCircle2 className="h-4 w-4"/> : <XCircle className="h-4 w-4"/>}{item.provider}</div><p className="mt-1">{item.message}</p></div>)}</div>}
    {!verification ? <div className="rounded-lg border border-dashed p-5 text-center"><ShieldQuestion className="mx-auto h-7 w-7 text-brand-700"/><p className="mt-2 text-sm font-semibold">Chưa có lần đối chiếu</p><p className="text-xs opacity-60">Bấm Tra cứu & đối chiếu để tạo ảnh chụp chứng cứ đầu tiên.</p></div> : <>
      <div className={`rounded-xl border p-4 ${statusStyle(verification.overallStatus)}`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold">{STATUS_LABELS[verification.overallStatus]} · {verification.formulaVersion}</p><p className="mt-1 text-xs opacity-70">Lưu lúc {new Date(verification.createdAt).toLocaleString("vi-VN")}</p></div><div className="text-right"><strong className="text-2xl">{verification.matchScore}%</strong><p className="text-[11px]">độ khớp hai nguồn</p></div></div></div>
      <div className="grid gap-3 lg:grid-cols-2">{verification.fields.map(field => <article key={field.fieldName} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{FIELD_LABELS[field.fieldName]}</h3><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${statusStyle(field.status)}`}>{FIELD_STATUS_LABELS[field.status]}{field.status !== "MISSING_SOURCE" ? ` · ${field.similarity}%` : ""}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg bg-brand-500/5 p-2"><p className="text-[11px] font-semibold text-brand-700">VietQR</p><p className="mt-1 break-words text-xs">{field.vietQrValue || "Chưa có"}</p></div><div className="rounded-lg bg-slate-500/5 p-2"><p className="text-[11px] font-semibold">MaSoThue</p><p className="mt-1 break-words text-xs">{field.maSoThueValue || "Chưa có"}</p></div></div><p className="mt-2 text-[11px] opacity-60">{field.reason}</p></article>)}</div>
      <p className="text-[11px] text-amber-700">V4 chỉ hỗ trợ kiểm duyệt. Nhân viên vẫn phải mở nguồn gốc và kiểm tra trước khi dùng dữ liệu cho quyết định mua hàng.</p>
    </>}
  </section>;
}
