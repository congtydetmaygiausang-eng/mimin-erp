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
  ShieldCheck,
  Square,
} from "lucide-react";
import { googleMapsSearchUrl } from "@/lib/google-maps";
import { extractVietnamPhones, formatVietnamPhone, normalizeVietnamPhone } from "@/lib/vietnam-phone";
import type { DirectCandidateEvidenceField, DirectSearchCandidate } from "@/lib/production-discovery";

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
  const contact = contactDetails(item);
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
      </div>
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
