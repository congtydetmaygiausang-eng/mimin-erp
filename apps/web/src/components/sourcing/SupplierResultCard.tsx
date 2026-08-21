"use client";

// @codex MIMIN GROUP - tách từ AiDiscoveryTab.tsx để dùng chung cho AgentSearchBox
// (kết quả tìm kiếm qua chat) và Lịch sử tìm kiếm (xem lại kết quả cũ).

import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  Calculator,
  CheckSquare,
  ExternalLink,
  Globe2,
  Hash,
  Info,
  Mail,
  Map,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Scale,
  ShieldCheck,
  Square,
} from "lucide-react";
import { googleMapsSearchUrl } from "@/lib/google-maps";
import { extractVietnamPhones, formatVietnamPhone, normalizeVietnamPhone } from "@/lib/vietnam-phone";
import { supabase } from "@/lib/supabase/client";
import type { DirectCandidateEvidenceField, DirectSearchCandidate } from "@/lib/production-discovery";

interface LegalLookupProviderResult {
  status: "SUCCESS" | "NOT_FOUND" | "ERROR";
  record?: Record<string, string> | null;
  error?: string;
  cached?: boolean;
}
interface LegalLookupResponse {
  taxCode: string;
  vietQr: LegalLookupProviderResult;
  maSoThue: LegalLookupProviderResult;
  reconciliation: { overallStatus: "MATCH" | "PARTIAL" | "CONFLICT" | "INSUFFICIENT"; matchScore: number; matchedFields: number; partialFields: number; conflictFields: number; missingFields: number } | null;
}

const RECONCILIATION_STYLES = {
  MATCH: { label: "Khớp", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  PARTIAL: { label: "Tương đồng một phần", className: "border-amber-300 bg-amber-50 text-amber-800" },
  CONFLICT: { label: "Mâu thuẫn", className: "border-red-300 bg-red-50 text-red-800" },
  INSUFFICIENT: { label: "Chưa đủ dữ liệu đối chiếu", className: "border-slate-300 bg-slate-50 text-slate-700" },
} as const;

export const FIELD_LABELS: Record<DirectCandidateEvidenceField, string> = {
  LEGAL_NAME: "Tên pháp lý", TRADE_NAME: "Tên thương mại", SHORT_NAME: "Tên viết tắt", TAX_CODE: "Mã số thuế",
  REGISTERED_ADDRESS: "Địa chỉ đăng ký", FACTORY_ADDRESS: "Địa chỉ nhà máy", OFFICE_ADDRESS: "Địa chỉ văn phòng",
  PHONE: "Điện thoại", ZALO: "Zalo", EMAIL: "Email", WEBSITE: "Website", FACEBOOK: "Facebook",
  LEGAL_REPRESENTATIVE: "Người đại diện", BUSINESS_LINE: "Ngành nghề", CAPABILITY: "Năng lực",
  COMPANY_INTRODUCTION: "Giới thiệu", FOUNDED_YEAR: "Năm thành lập", OPERATING_STATUS: "Tình trạng hoạt động",
};

export const LOCATION_BADGES = {
  INSIDE: { label: "Trong bán kính", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  OUTSIDE: { label: "Ngoài bán kính", className: "border-amber-300 bg-amber-50 text-amber-700" },
  UNKNOWN: { label: "Chưa xác minh tọa độ", className: "border-slate-300 bg-slate-50 text-slate-700" },
  CONFLICT: { label: "Mâu thuẫn vị trí", className: "border-red-300 bg-red-50 text-red-700" },
} as const;

export const ENTITY_TYPE_LABELS = {
  HOUSEHOLD_BUSINESS: { label: "Hộ kinh doanh", className: "border-sky-300 bg-sky-50 text-sky-700" },
  COMPANY: { label: "Công ty · Doanh nghiệp", className: "border-sky-300 bg-sky-50 text-sky-700" },
  INDIVIDUAL_SELLER: { label: "Cá nhân · Page bán hàng", className: "border-orange-300 bg-orange-50 text-orange-700" },
  UNKNOWN: { label: "Chưa xác định loại hình", className: "border-slate-300 bg-slate-50 text-slate-600" },
} as const;

export const QUALIFICATION_TIER_STYLES = {
  QUALIFIED: { label: "Đủ điều kiện", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  NEEDS_VERIFICATION: { label: "Cần xác minh thêm", className: "border-amber-300 bg-amber-50 text-amber-800" },
  INCOMPLETE: { label: "Thiếu thông tin", className: "border-slate-300 bg-slate-50 text-slate-700" },
} as const;

export function contactDetails(item: DirectSearchCandidate) {
  const sourceText = item.address ?? "";
  const email = item.email || sourceText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "";
  const taxCodeDigits = (item.taxCode ?? "").replace(/\D/g, "");
  const taxNumbers = new Set([taxCodeDigits, taxCodeDigits.slice(0, 10)].filter(Boolean));
  const phones = Array.from(new Set([
    ...(item.phones ?? []).map(normalizeVietnamPhone),
    ...extractVietnamPhones(item.phone || sourceText),
  ].filter((phone) => phone && !taxNumbers.has(phone)))).slice(0, 5);
  const website = item.website || sourceText.match(/(?:https?:\/\/|www\.)[^\s,;]+/i)?.[0]?.replace(/[.)]+$/, "") || "";
  const taxCode = item.taxCode || sourceText.match(/(?:mã số thuế|mst)\s*:?[\s-]*(\d{8,14})/i)?.[1] || "";
  return { email, phones, website, taxCode };
}

export function SupplierResultCard({
  item,
  opening,
  verifying,
  saving,
  selected,
  saved,
  onToggle,
  onViewDetails,
  onVerifyLocation,
  onSaveOne,
}: {
  item: DirectSearchCandidate;
  opening: boolean;
  verifying: boolean;
  saving: boolean;
  selected: boolean;
  saved: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
  onVerifyLocation?: () => void;
  onSaveOne: () => void;
}) {
  const [showCalculation, setShowCalculation] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [legalLookupLoading, setLegalLookupLoading] = useState(false);
  const [legalLookupResult, setLegalLookupResult] = useState<LegalLookupResponse | null>(null);
  const [legalLookupError, setLegalLookupError] = useState("");
  const contact = contactDetails(item);

  const runLegalLookup = async () => {
    if (!item.taxCode || legalLookupLoading) return;
    setLegalLookupLoading(true);
    setLegalLookupError("");
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      const response = await fetch("/api/v1/sourcing/company-registry/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taxCode: item.taxCode }),
      });
      const data = (await response.json()) as LegalLookupResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Không tra cứu được pháp lý");
      setLegalLookupResult(data);
    } catch (error) {
      setLegalLookupError(error instanceof Error ? error.message : "Không tra cứu được pháp lý");
    } finally {
      setLegalLookupLoading(false);
    }
  };
  const sources = item.sources?.length ? item.sources : [{ url: item.sourceUrl, title: item.sourceTitle }];
  const status = item.locationStatus ?? "UNKNOWN";
  const locationBadge = LOCATION_BADGES[status];
  const distanceLabel = status === "INSIDE" && item.distanceKm !== null && item.distanceKm !== undefined
    ? `${item.distanceKm.toFixed(1)} km từ tâm`
    : status === "OUTSIDE" && item.distanceKm !== null && item.distanceKm !== undefined
    ? `Ngoài bán kính · ${item.distanceKm.toFixed(1)} km`
    : locationBadge.label;
  const mapsUrl = googleMapsSearchUrl(item);
  const evidence = item.distanceEvidence;
  const quality = item.profileQuality;
  const conflictLabels = quality?.conflictFields?.map((field) => FIELD_LABELS[field]) ?? [];
  const qualityStyle = quality?.grade === "STRONG"
    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
    : quality?.grade === "CONFLICT"
    ? "border-red-300 bg-red-50 text-red-800"
    : quality?.grade === "REVIEW"
    ? "border-amber-300 bg-amber-50 text-amber-800"
    : "border-slate-300 bg-slate-50 text-slate-700";

  return (
    <article className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
      <div className="flex justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <button type="button" onClick={onToggle} disabled={saved} className="mt-0.5 text-brand-700 disabled:text-emerald-600" aria-label={saved ? "Công ty đã lưu" : selected ? "Bỏ chọn công ty" : "Chọn công ty"}>
            {saved ? <BookmarkCheck className="w-4 h-4" /> : selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-start gap-2">
              <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-cyan-600" />
              <b className="leading-snug">{item.legalName}</b>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${item.resultTier === "RELATED" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
                {item.resultTier === "RELATED" ? "Liên quan · cần xác minh" : "Đúng năng lực"}
              </span>
              {item.entityType && (
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ENTITY_TYPE_LABELS[item.entityType].className}`}>
                  {ENTITY_TYPE_LABELS[item.entityType].label}
                </span>
              )}
            </div>
            <div className="text-[11px] mt-1 text-brand-700 inline-flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" />
              {item.verificationStatus === "VERIFIED" ? "Đã đối chiếu nhiều nguồn" : item.verificationStatus === "PARTIAL" ? "Đã đối chiếu một phần" : "Chưa đủ bằng chứng"}
            </div>
          </div>
        </div>
        <span className="text-xs text-brand-700 shrink-0">{item.confidence}% phù hợp</span>
      </div>
      <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${locationBadge.className}`}>
        <Navigation className="w-3.5 h-3.5" />{distanceLabel}
        {status === "UNKNOWN" && (
          <span className="ml-1 text-slate-500 cursor-help" title="Hồ sơ này có địa chỉ chưa đủ chi tiết để hệ thống định vị trên Bản đồ.">(?)</span>
        )}
      </div>
      {quality && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${qualityStyle}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              {quality.grade === "CONFLICT" ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              {quality.grade === "STRONG" ? "Hồ sơ mạnh" : quality.grade === "CONFLICT" ? "Cần đối chiếu dữ liệu chính" : quality.grade === "REVIEW" ? "Cần kiểm tra thêm" : "Bằng chứng còn yếu"}
            </span>
            <b>{quality.score}/100</b>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <span>Đầy đủ <b>{quality.completeness}%</b></span>
            <span>Bằng chứng <b>{quality.evidenceCoverage}%</b></span>
            {quality.conflictCount > 0 && <span>Xung đột chính <b>{quality.conflictCount}</b></span>}
          </div>
          {quality.grade === "CONFLICT" && (
            <p className="mt-1.5 inline-flex items-center gap-1"><Info className="w-3.5 h-3.5 shrink-0" />Cần kiểm tra: {conflictLabels.length ? conflictLabels.join(", ") : "danh tính doanh nghiệp"}.</p>
          )}
        </div>
      )}
      {item.qualificationTier && (
        <div className={`rounded-lg border px-3 py-2 text-xs ${QUALIFICATION_TIER_STYLES[item.qualificationTier].className}`}>
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4" />{QUALIFICATION_TIER_STYLES[item.qualificationTier].label}
          </span>
          {Boolean(item.qualificationReasons?.length) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {item.qualificationReasons?.map((reason) => (
                <span key={reason} className="rounded-full border border-current/30 px-2 py-0.5 text-[10px] opacity-80">{reason}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0 text-rose-600" /><span className="w-20 shrink-0 font-medium">Địa chỉ</span><span className="min-w-0 break-words leading-relaxed line-clamp-2">{item.address || "Chưa có"}</span></div>
        <div className="flex items-start gap-2"><Phone className="w-4 h-4 shrink-0 text-emerald-600" /><span className="w-20 shrink-0 font-medium">Điện thoại</span>{contact.phones.length ? (<div className="flex min-w-0 flex-wrap items-center gap-1.5">{contact.phones.map((phone, index) => <a key={phone} className={`rounded-md px-2 py-0.5 font-medium ${index === 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`} href={`tel:${phone}`}>{formatVietnamPhone(phone)}{index > 0 && <span className="ml-1 text-[10px] opacity-60">phụ</span>}</a>)}</div>) : <span className="opacity-50">Chưa có</span>}</div>
        <div className="flex items-start gap-2"><Mail className="w-4 h-4 shrink-0 text-violet-600" /><span className="w-20 shrink-0 font-medium">Email</span>{contact.email ? <a className="break-all text-brand-700" href={`mailto:${contact.email}`}>{contact.email}</a> : <span className="opacity-50">Chưa có</span>}</div>
        <div className="flex items-start gap-2"><Globe2 className="w-4 h-4 shrink-0 text-sky-600" /><span className="w-20 shrink-0 font-medium">Website</span>{contact.website ? <a className="break-all text-brand-700" href={contact.website.startsWith("http") ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer">{contact.website}</a> : <span className="opacity-50">Chưa có</span>}</div>
        <div className="flex items-start gap-2"><Hash className="w-4 h-4 shrink-0 text-amber-600" /><span className="w-20 shrink-0 font-medium">Mã số thuế</span>{contact.taxCode ? <span>{contact.taxCode}</span> : <span className="opacity-50">Chưa xác minh</span>}</div>
      </div>
      <div className="flex flex-wrap gap-2">{item.matchReasons?.map((reason) => <span key={reason} className="text-[11px] rounded-full border px-2 py-1" style={{ borderColor: "var(--border)" }}>{reason}</span>)}</div>
      <div className="flex flex-wrap gap-2">
        <a className="btn-secondary inline-flex items-center gap-2 text-xs" href={mapsUrl} target="_blank" rel="noopener noreferrer"><Map className="w-4 h-4" />Google Maps</a>
        <button type="button" className="btn-secondary inline-flex items-center gap-2 text-xs" onClick={() => setShowCalculation((current) => !current)}><Calculator className="w-4 h-4" />{showCalculation ? "Ẩn cách tính" : "Xem cách tính"}</button>
        {Boolean(item.fieldConfidence?.length) && <button type="button" className="btn-secondary inline-flex items-center gap-2 text-xs" onClick={() => setShowEvidence((current) => !current)}><ShieldCheck className="w-4 h-4" />{showEvidence ? "Ẩn kiểm chứng" : "Xem kiểm chứng"}</button>}
        {onVerifyLocation && <button type="button" disabled={verifying} className="btn-secondary inline-flex items-center gap-2 text-xs" onClick={onVerifyLocation}><RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />{verifying ? "Đang xác minh..." : "Xác minh lại vị trí"}</button>}
        <button
          type="button"
          disabled={!item.taxCode || legalLookupLoading}
          title={!item.taxCode ? "Chưa có mã số thuế để tra cứu" : undefined}
          className="btn-secondary inline-flex items-center gap-2 text-xs disabled:opacity-50"
          onClick={() => void runLegalLookup()}
        >
          <Scale className={`w-4 h-4 ${legalLookupLoading ? "animate-pulse" : ""}`} />{legalLookupLoading ? "Đang tra cứu..." : "Tra cứu pháp lý"}
        </button>
      </div>
      {legalLookupError && (
        <p className="text-xs text-red-700 inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 shrink-0" />{legalLookupError}</p>
      )}
      {legalLookupResult && (
        <div className="rounded-lg border p-3 text-xs space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold inline-flex items-center gap-1.5"><Scale className="w-4 h-4" />Đối chiếu VietQR + MaSoThue · MST {legalLookupResult.taxCode}</span>
            {legalLookupResult.reconciliation && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${RECONCILIATION_STYLES[legalLookupResult.reconciliation.overallStatus].className}`}>
                {RECONCILIATION_STYLES[legalLookupResult.reconciliation.overallStatus].label} · {legalLookupResult.reconciliation.matchScore}/100
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <p className="font-medium">VietQR</p>
              {legalLookupResult.vietQr.status === "SUCCESS" ? <p className="opacity-80">{legalLookupResult.vietQr.record?.legalName}</p> : legalLookupResult.vietQr.status === "NOT_FOUND" ? <p className="opacity-60">Không tìm thấy</p> : <p className="text-red-700">{legalLookupResult.vietQr.error ?? "Lỗi tra cứu"}</p>}
            </div>
            <div>
              <p className="font-medium">MaSoThue</p>
              {legalLookupResult.maSoThue.status === "SUCCESS" ? <p className="opacity-80">{legalLookupResult.maSoThue.record?.legalName}</p> : legalLookupResult.maSoThue.status === "NOT_FOUND" ? <p className="opacity-60">Không tìm thấy</p> : <p className="text-red-700">{legalLookupResult.maSoThue.error ?? "Lỗi tra cứu"}</p>}
            </div>
          </div>
          <p className="opacity-60">Đây là bản xem nhanh, chưa lưu bằng chứng. Để lưu bằng chứng đối chiếu đầy đủ, bấm "Lưu công ty này" rồi "Xem chi tiết" để mở mục Đối chiếu pháp lý hai nguồn.</p>
        </div>
      )}
      {showCalculation && (
        <div className="rounded-lg border bg-slate-50 p-3 text-[11px] text-slate-700 space-y-1">
          <p><b>Phương pháp:</b> {evidence?.method === "HAVERSINE" ? "Haversine · khoảng cách đường chim bay" : "Chưa có phép tính"}</p>
          <p><b>Bán kính áp dụng:</b> {evidence ? `${evidence.radiusKm} km` : "Chưa có"}</p>
          <p><b>Tâm:</b> {evidence ? `${evidence.center.latitude.toFixed(6)}, ${evidence.center.longitude.toFixed(6)} · ${evidence.center.label}` : "Chưa xác định"}</p>
          <p><b>Nguồn tọa độ:</b> {evidence?.destination.coordinateSource ?? "Chưa xác minh"} · độ tin cậy {evidence?.destination.coordinateConfidence ?? "chưa có"}</p>
          <p><b>Kết luận:</b> {item.locationReason ?? locationBadge.label}</p>
        </div>
      )}
      {showEvidence && (
        <div className="rounded-lg border bg-white/60 p-3 text-xs dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
          <div className="mb-2 flex items-center justify-between gap-2"><b>Kiểm chứng từng trường</b><span className="opacity-60">Nguồn cùng tên miền chỉ tính một lần</span></div>
          <div className="space-y-2">
            {item.fieldConfidence?.map((field) => (
              <div key={field.fieldName} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t pt-2 first:border-t-0 first:pt-0" style={{ borderColor: "var(--border)" }}>
                <div className="min-w-0"><p className="font-medium">{FIELD_LABELS[field.fieldName]}</p><p className="truncate opacity-60" title={field.selectedValue}>{field.selectedValue}</p></div>
                <div className="text-right"><b className={field.status === "CONFLICT" ? "text-red-700" : field.status === "VERIFIED" ? "text-emerald-700" : "text-amber-700"}>{field.score}/100</b><p className="text-[10px] opacity-60">{field.independentSources} nguồn độc lập</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs">
          {sources.slice(0, 3).map((source, sourceIndex) => (
            <a key={`${source.url}-${sourceIndex}`} className="text-brand-700 inline-flex items-center gap-1" href={source.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" />Nguồn {sourceIndex + 1}</a>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={saving || saved} onClick={onSaveOne} className={`btn-secondary inline-flex items-center gap-1.5 text-xs ${saving || saved ? "opacity-60" : ""}`}>
            {saved ? <><BookmarkCheck className="w-4 h-4 text-emerald-600" />Đã lưu</> : saving ? <><BookmarkCheck className="w-4 h-4 text-emerald-600" />Đang lưu...</> : <><Bookmark className="w-4 h-4" />Lưu công ty này</>}
          </button>
          <button type="button" disabled={opening} onClick={onViewDetails} className="btn-secondary inline-flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4" />{opening ? "Đang mở..." : "Xem chi tiết"}
          </button>
        </div>
      </div>
    </article>
  );
}
