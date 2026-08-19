"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, BookmarkCheck, BookmarkPlus, Building2, Calculator, Check, CheckSquare, ExternalLink, Eye, Globe2, Hash, Mail, MapPinned, MapPin, MoreHorizontal, Navigation, Phone, RefreshCw, Search, ShieldCheck, Sparkles, Square, Target, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import { approveDiscoveryCandidate, directCandidateSaveKey, importAICandidates, isDirectCandidateSaved, loadDiscoveryCandidates, saveDirectSearchCandidates, setDiscoveryStatus, type DirectSearchCandidate, type DiscoveryCandidate } from "@/lib/production-discovery";
import { ensureCompanyProfileFromSearch } from "@/lib/production-company-profile";
import { googleMapsSearchUrl } from "@/lib/google-maps";
import { supabase } from "@/lib/supabase/client";

const SEARCH_CACHE_KEY = "mimin:sourcing-search:v1";

interface ResolvedSearchCenter {
  label: string;
  source: "GPS" | "ADDRESS";
  accuracy?: number;
  validationStatus: "VERIFIED";
  validationConfidence: "HIGH" | "MEDIUM";
  placeType: string;
  validatedAt: string;
}

interface SearchCache {
  query: string;
  location: string;
  role: ProductionPartnerRole;
  radiusKm: number;
  locationMode: "PREFER" | "STRICT";
  center: {latitude:number;longitude:number;accuracy?:number}|null;
  directResults: DirectSearchCandidate[];
  directProvider: string;
  resolvedCenter: ResolvedSearchCenter|null;
  learningSummary: {approvedCount:number;rejectedCount:number;applied:boolean}|null;
  diagnostics: SearchDiagnostics|null;
}

interface SearchDiagnostics { collectedSources:number;normalizedCandidates:number;finalCandidates:number;verified:number;partial:number;insideRadius:number;unknownCoordinates:number;coordinateConflicts?:number;locationBreakdown?:{inside:number;outside:number;unknown:number;conflict:number};strictExcluded?:number;strictLocationFallback?:boolean;enrichmentSources?:number;enrichedCandidates?:number;rejectedNoiseCandidates?:number;geocoding?:{attempted:number;verified:number;rejected:number;retainedFromSource:number;persistentHits?:number;staleFallbacks?:number;providerRequests?:number};locationQuality?:{runId:string;algorithmVersion:string;grade:"HIGH"|"MEDIUM"|"LOW";coordinateCoveragePercent:number;staleFallbackUsed:boolean;warnings:string[];evaluatedAt:string};providers:Array<{name:string;status:"OK"|"EMPTY"|"ERROR"|"DISABLED";count:number;code?:string}> }

function contactDetails(item: DirectSearchCandidate) {
  const sourceText = item.address ?? "";
  const email = item.email || sourceText.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0] || "";
  const phone = item.phone || sourceText.match(/(?:điện thoại|hotline|phone|liên hệ)\s*:?[\s-]*([+()\d][\d().\s-]{7,20})/i)?.[1]?.trim() || "";
  const website = item.website || sourceText.match(/(?:https?:\/\/|www\.)[^\s,;]+/i)?.[0]?.replace(/[.)]+$/, "") || "";
  const taxCode = item.taxCode || sourceText.match(/(?:mã số thuế|mst)\s*:?[\s-]*(\d{8,14})/i)?.[1] || "";
  return { email, phone, website, taxCode };
}

const LOCATION_BADGES = {
  INSIDE: { label: "Trong bán kính", className: "border-emerald-300 bg-emerald-50 text-emerald-700" },
  OUTSIDE: { label: "Ngoài bán kính", className: "border-amber-300 bg-amber-50 text-amber-700" },
  UNKNOWN: { label: "Chưa xác minh tọa độ", className: "border-slate-300 bg-slate-50 text-slate-700" },
  CONFLICT: { label: "Mâu thuẫn vị trí", className: "border-red-300 bg-red-50 text-red-700" },
} as const;

function SupplierResultCard({ item, opening, verifying, saving, saved, selected, onViewDetails, onVerifyLocation, onToggleSelected, onSave }: { item: DirectSearchCandidate; opening: boolean; verifying: boolean; saving:boolean; saved:boolean; selected:boolean; onViewDetails: () => void; onVerifyLocation: () => void; onToggleSelected:()=>void; onSave:()=>void }) {
  const [showCalculation, setShowCalculation] = useState(false);
  const contact = contactDetails(item);
  const sources = item.sources?.length ? item.sources : [{ url: item.sourceUrl, title: item.sourceTitle }];
  const status = item.locationStatus ?? "UNKNOWN";
  const locationBadge = LOCATION_BADGES[status];
  const distanceLabel = status === "INSIDE" && item.distanceKm !== null && item.distanceKm !== undefined ? `${item.distanceKm.toFixed(1)} km từ tâm` : status === "OUTSIDE" && item.distanceKm !== null && item.distanceKm !== undefined ? `Ngoài bán kính · ${item.distanceKm.toFixed(1)} km` : locationBadge.label;
  const mapsUrl = googleMapsSearchUrl(item);
  const evidence = item.distanceEvidence;
  const verificationLabel=item.verificationStatus==="VERIFIED"?"Tin cậy cao · nhiều nguồn":item.verificationStatus==="PARTIAL"?"Tin cậy trung bình · đối chiếu một phần":"Tin cậy thấp · cần bổ sung bằng chứng";
  return <article className={`group rounded-2xl border bg-white/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5 ${selected?"ring-2 ring-brand-500":saved?"border-emerald-300":""}`} style={{borderColor:selected||saved?undefined:"var(--border)"}}>
    <header className="flex items-start justify-between gap-3 border-b pb-3" style={{borderColor:"var(--border)"}}><div className="flex min-w-0 gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/15 to-brand-500/15 text-cyan-700 transition-transform duration-200 group-hover:scale-105"><Building2 className="w-5 h-5"/></div><div className="min-w-0"><h3 className="font-bold leading-snug text-slate-900 dark:text-white">{item.legalName}</h3><div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-brand-700"/>{verificationLabel}</div></div></div><div className="flex shrink-0 items-start gap-2"><div className="rounded-xl bg-brand-500/10 px-2.5 py-1.5 text-center text-brand-700"><div className="inline-flex items-center gap-1 text-sm font-bold"><Target className="w-3.5 h-3.5"/>{item.confidence}%</div><div className="text-[9px] uppercase tracking-wide">Phù hợp nhu cầu</div></div><button type="button" disabled={saved} onClick={onToggleSelected} className="rounded-lg p-1.5 text-brand-700 transition hover:bg-brand-500/10 disabled:text-emerald-600" aria-label={saved?"Công ty đã được lưu":selected?"Bỏ chọn công ty":"Chọn công ty để lưu"}>{saved?<BookmarkCheck className="w-5 h-5"/>:selected?<CheckSquare className="w-5 h-5"/>:<Square className="w-5 h-5"/>}</button></div></header>

    <section className="space-y-2.5 py-3"><div className="flex flex-wrap items-center gap-2"><span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${locationBadge.className}`}><Navigation className="w-3.5 h-3.5"/>{distanceLabel}</span><span className="rounded-full border px-2.5 py-1 text-[11px]" style={{borderColor:"var(--border)"}}>{sources.length} nguồn tham khảo</span></div><div className="rounded-xl border bg-slate-50/70 p-3 dark:bg-white/5" style={{borderColor:"var(--border)"}}><div className="flex items-start gap-2"><MapPin className="mt-0.5 w-4 h-4 shrink-0 text-rose-600"/><div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wide text-rose-600">Địa chỉ công ty</div><p className="mt-1 text-xs leading-relaxed break-words" title={item.legacyAddress?`Địa chỉ cũ: ${item.legacyAddress}`:item.address}>{item.address||"Chưa có địa chỉ"}</p>{item.addressStandard&&<span className="mt-1 inline-flex text-[10px] font-medium text-emerald-700">Đã chuẩn hóa sau sắp xếp 2025</span>}</div></div></div></section>

    <section className="grid grid-cols-1 gap-2 border-t py-3 sm:grid-cols-2" style={{borderColor:"var(--border)"}}><div className="flex min-w-0 items-start gap-2 rounded-lg bg-emerald-500/5 p-2.5"><Phone className="w-4 h-4 shrink-0 text-emerald-600"/><div className="min-w-0"><div className="text-[10px] opacity-55">Điện thoại</div>{contact.phone?<a className="text-xs font-medium break-all" href={`tel:${contact.phone}`}>{contact.phone}</a>:<span className="text-xs opacity-45">Chưa có</span>}</div></div><div className="flex min-w-0 items-start gap-2 rounded-lg bg-violet-500/5 p-2.5"><Mail className="w-4 h-4 shrink-0 text-violet-600"/><div className="min-w-0"><div className="text-[10px] opacity-55">Email</div>{contact.email?<a className="text-xs font-medium break-all text-brand-700" href={`mailto:${contact.email}`}>{contact.email}</a>:<span className="text-xs opacity-45">Chưa có</span>}</div></div><div className="flex min-w-0 items-start gap-2 rounded-lg bg-sky-500/5 p-2.5"><Globe2 className="w-4 h-4 shrink-0 text-sky-600"/><div className="min-w-0"><div className="text-[10px] opacity-55">Website</div>{contact.website?<a className="text-xs font-medium break-all text-brand-700" href={contact.website.startsWith("http")?contact.website:`https://${contact.website}`} target="_blank" rel="noopener noreferrer">{contact.website}</a>:<span className="text-xs opacity-45">Chưa có</span>}</div></div><div className="flex min-w-0 items-start gap-2 rounded-lg bg-amber-500/5 p-2.5"><Hash className="w-4 h-4 shrink-0 text-amber-600"/><div className="min-w-0"><div className="text-[10px] opacity-55">Mã số thuế</div>{contact.taxCode?<span className="text-xs font-medium">{contact.taxCode}</span>:<span className="text-xs opacity-45">Chưa xác minh</span>}</div></div></section>

    {item.matchReasons?.length?<section className="flex flex-wrap gap-1.5 border-t py-3" style={{borderColor:"var(--border)"}}>{item.matchReasons.map(reason=><span key={reason} className="rounded-full border bg-white/60 px-2 py-1 text-[10px] dark:bg-white/5" style={{borderColor:"var(--border)"}}>{reason}</span>)}</section>:null}
    {showCalculation&&<div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] text-sky-900 space-y-1 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><p><b>Phương pháp:</b> {evidence?.method==="HAVERSINE"?"Haversine · khoảng cách đường chim bay":"Chưa có phép tính"}</p><p><b>Bán kính:</b> {evidence?`${evidence.radiusKm} km`:"Chưa có"}</p><p><b>Tâm:</b> {evidence?`${evidence.center.latitude.toFixed(6)}, ${evidence.center.longitude.toFixed(6)} · ${evidence.center.label}`:"Chưa xác định"}</p><p><b>Công ty:</b> {evidence?.destination.latitude!==null&&evidence?.destination.latitude!==undefined&&evidence.destination.longitude!==null&&evidence.destination.longitude!==undefined?`${evidence.destination.latitude.toFixed(6)}, ${evidence.destination.longitude.toFixed(6)}`:"Chưa có tọa độ"}</p><p><b>Nguồn tọa độ:</b> {evidence?.destination.coordinateSource??"Chưa xác minh"} · độ tin cậy {evidence?.destination.coordinateConfidence??"chưa có"}</p><p><b>Kết luận:</b> {item.locationReason??locationBadge.label}</p></div>}

    <footer className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between" style={{borderColor:"var(--border)"}}><div className="flex flex-wrap gap-2"><a className="btn-secondary inline-flex items-center gap-1.5 text-xs" href={mapsUrl} target="_blank" rel="noopener noreferrer"><MapPinned className="w-4 h-4 text-rose-600"/>Google Maps</a>{saved?<span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"><BookmarkCheck className="w-4 h-4"/>Đã lưu</span>:<button type="button" disabled={saving} onClick={onSave} className="btn-secondary inline-flex items-center gap-1.5 text-xs"><BookmarkPlus className="w-4 h-4 text-emerald-600"/>{saving?"Đang lưu...":"Lưu công ty"}</button>}</div><div className="flex flex-wrap gap-2"><details className="relative"><summary className="btn-secondary inline-flex cursor-pointer list-none items-center gap-1.5 text-xs"><MoreHorizontal className="w-4 h-4"/>Thao tác khác</summary><div className="absolute bottom-full right-0 z-20 mb-2 w-56 rounded-xl border bg-white p-2 shadow-xl dark:bg-slate-900" style={{borderColor:"var(--border)"}}><button type="button" className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-brand-500/10 inline-flex items-center gap-2" onClick={()=>setShowCalculation(current=>!current)}><Calculator className="w-4 h-4"/>{showCalculation?"Ẩn cách tính":"Xem cách tính khoảng cách"}</button><button type="button" disabled={verifying} className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-brand-500/10 inline-flex items-center gap-2" onClick={onVerifyLocation}><RefreshCw className={`w-4 h-4 ${verifying?"animate-spin":""}`}/>{verifying?"Đang xác minh...":"Xác minh lại vị trí"}</button>{sources.slice(0,3).map((source,index)=><a key={`${source.url}-${index}`} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-brand-500/10"><ExternalLink className="w-4 h-4"/>Kiểm tra nguồn {index+1}</a>)}</div></details><button type="button" disabled={opening} onClick={onViewDetails} className="btn-primary inline-flex items-center gap-1.5 text-xs"><Eye className="w-4 h-4"/>{opening?"Đang mở...":"Xem chi tiết"}</button></div></footer>
  </article>;
}

export default function TimKiemDoiTacPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");
  const [items, setItems] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [directResults, setDirectResults] = useState<DirectSearchCandidate[]>([]);
  const [directProvider, setDirectProvider] = useState("");
  const [selectedResultKeys,setSelectedResultKeys]=useState<Set<string>>(new Set());
  const [savingResultKey,setSavingResultKey]=useState("");
  const [openingProfile, setOpeningProfile] = useState("");
  const [verifyingLocation, setVerifyingLocation] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  // @codex Q1: giao diện luôn ưu tiên gần. Backend vẫn giữ STRICT để tương thích
  // với dữ liệu/lượt tìm cũ và có thể kích hoạt lại khi độ phủ tọa độ đủ cao.
  const locationMode = "PREFER" as const;
  const [center, setCenter] = useState<{latitude:number;longitude:number;accuracy?:number}|null>(null);
  const [resolvedCenter, setResolvedCenter] = useState<ResolvedSearchCenter|null>(null);
  const [learningSummary, setLearningSummary] = useState<{approvedCount:number;rejectedCount:number;applied:boolean}|null>(null);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostics|null>(null);
  const [aiText, setAiText] = useState("");
  const [aiProvider, setAiProvider] = useState("AI_IMPORT");
  const [aiSourceUrl, setAiSourceUrl] = useState("https://mimin-erp.vercel.app");
  const [cacheReady,setCacheReady]=useState(false);
  const refresh = useCallback(async () => { try { setItems(await loadDiscoveryCandidates()); } catch { toast.error("Không tải được ứng viên"); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(()=>{
    try{
      const raw=sessionStorage.getItem(SEARCH_CACHE_KEY);
      if(raw){
        const cached=JSON.parse(raw) as Partial<SearchCache>;
        if(typeof cached.query==="string")setQuery(cached.query);
        if(typeof cached.location==="string")setLocation(cached.location);
        if(cached.role&&PARTNER_ROLES.includes(cached.role))setRole(cached.role);
        if(typeof cached.radiusKm==="number")setRadiusKm(cached.radiusKm);
        if(cached.center)setCenter(cached.center);
        if(Array.isArray(cached.directResults))setDirectResults(cached.directResults);
        if(typeof cached.directProvider==="string")setDirectProvider(cached.directProvider);
        if(cached.resolvedCenter)setResolvedCenter(cached.resolvedCenter);
        if(cached.learningSummary)setLearningSummary(cached.learningSummary);
        if(cached.diagnostics)setDiagnostics(cached.diagnostics);
      }
    }catch{sessionStorage.removeItem(SEARCH_CACHE_KEY)}
    finally{setCacheReady(true)}
  },[]);
  useEffect(()=>{
    if(!cacheReady)return;
    const cached:SearchCache={query,location,role,radiusKm,locationMode,center,directResults,directProvider,resolvedCenter,learningSummary,diagnostics};
    try{sessionStorage.setItem(SEARCH_CACHE_KEY,JSON.stringify(cached))}catch{/* Trình duyệt có thể chặn hoặc hết dung lượng sessionStorage. */}
  },[cacheReady,query,location,role,radiusKm,locationMode,center,directResults,directProvider,resolvedCenter,learningSummary,diagnostics]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== "MIMIN_AI_IMPORT") return;
      const payload = event.data.payload as { text?: unknown; provider?: unknown; sourceUrl?: unknown };
      if (typeof payload.text === "string") setAiText(payload.text);
      if (typeof payload.provider === "string") setAiProvider(payload.provider);
      if (typeof payload.sourceUrl === "string") setAiSourceUrl(payload.sourceUrl);
      toast.success("Đã nhận dữ liệu từ extension — hãy kiểm tra trước khi lưu");
      window.postMessage({ type: "MIMIN_AI_IMPORT_RECEIVED" }, window.location.origin);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  const search = async (silent = false): Promise<DirectSearchCandidate[]|null> => {
    if (!query.trim() || !location.trim()) { toast.error("Nhập nội dung và khu vực cần tìm"); return null; }
    setLoading(true);
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      const response = await fetch("/api/v1/sourcing/search", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({query:query.trim(),location:location.trim(),role,center,radiusKm,locationMode}) });
      const data = await response.json() as {error?:string;provider?:string;searchQueries?:string[];center?:ResolvedSearchCenter|null;learning?:{approvedCount:number;rejectedCount:number;applied:boolean};diagnostics?:SearchDiagnostics;candidates?:DirectSearchCandidate[]};
      if (!response.ok) throw new Error(data.error??"Tìm kiếm thất bại");
      const candidates = data.candidates??[];
      setDirectResults(candidates); setSelectedResultKeys(new Set()); setDirectProvider(data.provider??""); setResolvedCenter(data.center??null); setLearningSummary(data.learning??null); setDiagnostics(data.diagnostics??null);
      if (!silent) toast.success(`Đã mở rộng ${data.searchQueries?.length??0} truy vấn và xử lý ${candidates.length} kết quả`);
      return candidates;
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Tìm kiếm thất bại"); return null; }
    finally { setLoading(false); }
  };
  const useCurrentLocation=()=>{if(!navigator.geolocation)return toast.error("Thiết bị không hỗ trợ định vị");navigator.geolocation.getCurrentPosition(position=>{setCenter({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy});toast.success(`Đã lấy vị trí GPS · sai số khoảng ${Math.round(position.coords.accuracy)} m`)},()=>toast.error("Không lấy được vị trí. Hãy cấp quyền định vị cho trình duyệt."),{enableHighAccuracy:true,timeout:10000,maximumAge:60000})};
  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    try { if (status === "APPROVED") await approveDiscoveryCandidate(id); else await setDiscoveryStatus(id, status); await refresh(); toast.success(status === "APPROVED" ? "Đã duyệt vào danh mục đối tác" : "Đã loại ứng viên"); }
    catch { toast.error("Không cập nhật được trạng thái"); }
  };
  const importFromAI = async () => {
    if (!aiText.trim()) return toast.error("Chưa có dữ liệu JSON từ AI");
    setLoading(true);
    try { const count = await importAICandidates(aiText, role, aiProvider, aiSourceUrl); setAiText(""); await refresh(); toast.success(`Đã đưa ${count} ứng viên vào vùng chờ`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Không nhập được dữ liệu AI"); }
    finally { setLoading(false); }
  };
  const saveResults=async(candidates:DirectSearchCandidate[],operationKey:string)=>{
    if(!candidates.length)return toast.error("Chưa chọn công ty cần lưu");
    setSavingResultKey(operationKey);
    try{
      const result=await saveDirectSearchCandidates(candidates,role,`${query} | ${location}`,directProvider);
      await refresh();
      setSelectedResultKeys(current=>{const next=new Set(current);candidates.forEach(item=>next.delete(directCandidateSaveKey(item)));return next});
      if(result.savedCount&&result.skippedCount)toast.success(`Đã lưu ${result.savedCount} công ty; bỏ qua ${result.skippedCount} hồ sơ đã có hoặc trùng`);
      else if(result.savedCount)toast.success(`Đã lưu ${result.savedCount} công ty vào Công ty đã lưu`);
      else toast.info("Các công ty đã chọn đều đã được lưu trước đó");
    }catch(error){toast.error(error instanceof Error?error.message:"Không lưu được kết quả")}
    finally{setSavingResultKey("")}
  };
  const viewCompanyProfile = async (item: DirectSearchCandidate, key: string) => {
    setOpeningProfile(key);
    try {
      const profileId = await ensureCompanyProfileFromSearch(item, role, directProvider || "DIRECT_SEARCH");
      router.push(`/mang-luoi-san-xuat/cong-ty?id=${encodeURIComponent(profileId)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không mở được hồ sơ công ty");
      setOpeningProfile("");
    }
  };
  const verifyLocation = async (item: DirectSearchCandidate, key: string) => {
    setVerifyingLocation(key);
    try {
      const refreshed = await search(true);
      if (!refreshed) return;
      const matched = refreshed.some((candidate) => candidate.sourceUrl === item.sourceUrl || candidate.legalName.trim().toLowerCase() === item.legalName.trim().toLowerCase());
      if (matched) toast.success(`Đã xác minh lại vị trí cho ${item.legalName}`);
      else toast.warning(`Lần tìm mới chưa xác nhận lại được ${item.legalName}`);
    }
    finally { setVerifyingLocation(""); }
  };
  const directResultSections = [
    { status: "INSIDE", title: `Trong bán kính ${radiusKm} km`, description: "Đã xác minh tọa độ · xếp từ gần đến xa" },
    { status: "OUTSIDE", title: "Gợi ý mở rộng ngoài bán kính", description: "Chỉ hiển thị trong chế độ Ưu tiên gần" },
    { status: "UNKNOWN", title: "Chưa xác minh tọa độ", description: "Không được coi là nằm trong bán kính" },
    { status: "CONFLICT", title: "Cần kiểm tra mâu thuẫn vị trí", description: "Không dùng để tính khoảng cách" },
  ].map((section) => ({ ...section, items: directResults.filter((item) => item.locationStatus === section.status || (section.status === "UNKNOWN" && !item.locationStatus)) })).filter((section) => section.items.length);
  const unsavedResults=directResults.filter(item=>!isDirectCandidateSaved(item,items));
  const selectedResults=unsavedResults.filter(item=>selectedResultKeys.has(directCandidateSaveKey(item)));
  const allUnsavedSelected=unsavedResults.length>0&&selectedResults.length===unsavedResults.length;
  const toggleSelected=(item:DirectSearchCandidate)=>setSelectedResultKeys(current=>{const next=new Set(current);const key=directCandidateSaveKey(item);if(next.has(key))next.delete(key);else next.add(key);return next});
  const toggleAllUnsaved=()=>setSelectedResultKeys(allUnsavedSelected?new Set():new Set(unsavedResults.map(directCandidateSaveKey)));

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Tìm kiếm ứng viên tự động"
      subtitle="Kết quả từ nguồn mở được lưu vào vùng chờ; chưa tự động ghi vào danh mục đối tác chính thức."
      icon={<Search className="w-5 h-5" />} />
    {learningSummary&&<div className="text-xs px-1 opacity-70">{learningSummary.applied?`AI đang học từ ${learningSummary.approvedCount} kết quả đã duyệt và ${learningSummary.rejectedCount} kết quả đã loại.`:`Cần ít nhất 3 quyết định duyệt/loại để AI bắt đầu học. Hiện có ${learningSummary.approvedCount+learningSummary.rejectedCount}.`}</div>}
    {diagnostics?.locationQuality&&<div className={`rounded-lg border px-3 py-2 text-xs ${diagnostics.locationQuality.grade==="HIGH"?"border-emerald-300 bg-emerald-50 text-emerald-900":diagnostics.locationQuality.grade==="MEDIUM"?"border-amber-300 bg-amber-50 text-amber-900":"border-red-300 bg-red-50 text-red-900"}`}><div className="flex flex-wrap items-center justify-between gap-2"><b>Chất lượng định vị: {diagnostics.locationQuality.grade==="HIGH"?"Cao":diagnostics.locationQuality.grade==="MEDIUM"?"Trung bình":"Thấp"} · phủ tọa độ {diagnostics.locationQuality.coordinateCoveragePercent}%</b><span className="font-mono text-[10px]">Mã lượt: {diagnostics.locationQuality.runId.slice(0,8)} · {diagnostics.locationQuality.algorithmVersion}</span></div>{diagnostics.locationQuality.warnings.length>0&&<ul className="mt-1 list-disc pl-4">{diagnostics.locationQuality.warnings.map(warning=><li key={warning}>{warning}</li>)}</ul>}</div>}
    {diagnostics&&<div className="card p-4 space-y-3"><div className="flex flex-wrap gap-2">{diagnostics.providers.map(item=><span key={item.name} className="text-xs rounded-full border px-3 py-1" style={{borderColor:"var(--border)"}}>{item.name}: {item.status==="OK"?`${item.count} nguồn`:item.status==="EMPTY"?"không có kết quả":item.status==="DISABLED"?"chưa cấu hình":`tạm lỗi${item.code?` (${item.code})`:""}`}</span>)}{typeof diagnostics.enrichmentSources==="number"&&<span className="text-xs rounded-full border px-3 py-1 border-emerald-300 text-emerald-700">Làm giàu: {diagnostics.enrichmentSources} nguồn · bổ sung {diagnostics.enrichedCandidates??0} hồ sơ</span>}{Boolean(diagnostics.rejectedNoiseCandidates)&&<span className="text-xs rounded-full border px-3 py-1 border-amber-300 text-amber-700">Đã loại {diagnostics.rejectedNoiseCandidates} kết quả rao vặt/không đủ hồ sơ công ty</span>}{diagnostics.geocoding&&<span className="text-xs rounded-full border px-3 py-1 border-sky-300 text-sky-700">Định vị: xác minh {diagnostics.geocoding.verified+diagnostics.geocoding.retainedFromSource}/{diagnostics.geocoding.attempted+diagnostics.geocoding.retainedFromSource} hồ sơ</span>}</div>{diagnostics.strictLocationFallback&&<div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Chưa có hồ sơ nào đủ tọa độ để xác nhận trong {radiusKm} km. Hệ thống đang hiển thị hồ sơ chưa có tọa độ để anh kiểm tra; các hồ sơ này không được tính là nằm trong bán kính.</div>}<div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center"><div><b>{diagnostics.collectedSources}</b><p className="text-[11px] opacity-60">Nguồn thu thập</p></div><div><b>{diagnostics.finalCandidates}</b><p className="text-[11px] opacity-60">Hồ sơ sau gộp</p></div><div><b>{diagnostics.verified}</b><p className="text-[11px] opacity-60">Đối chiếu nhiều nguồn</p></div><div><b>{diagnostics.partial}</b><p className="text-[11px] opacity-60">Đối chiếu một phần</p></div><div><b>{diagnostics.insideRadius}</b><p className="text-[11px] opacity-60">Trong bán kính</p></div><div><b>{diagnostics.unknownCoordinates}</b><p className="text-[11px] opacity-60">Thiếu tọa độ</p></div></div></div>}
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="text-xs font-medium">Danh mục<select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as ProductionPartnerRole)}>{PARTNER_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label><label className="text-xs font-medium">Cần tìm<input className="input mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: xưởng dệt, vải cotton" /></label></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3"><label className="text-xs font-medium md:col-span-2">Vị trí trung tâm<input className="input mt-1" value={location} onChange={(e) => {setLocation(e.target.value);setCenter(null)}} placeholder="VD: Hóc Môn, TP.HCM" /></label><label className="text-xs font-medium">Bán kính<select className="input mt-1" value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))}>{[5,10,20,30,50,100].map(value=><option key={value} value={value}>{value} km</option>)}</select></label><div className="flex items-end"><button type="button" className="btn-secondary w-full inline-flex justify-center gap-2" onClick={useCurrentLocation}><Navigation className="w-4 h-4"/>Vị trí hiện tại</button></div></div>
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><b>Ưu tiên gần:</b> công ty đã xác minh trong bán kính được xếp trước. Hồ sơ ngoài bán kính hoặc chưa đủ tọa độ được tách thành nhóm riêng để anh kiểm tra, không bị coi là công ty ở gần.</div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3"><p className="text-xs opacity-60">{center?`GPS: ${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)} · sai số ~${Math.round(center.accuracy??0)} m`:"Nếu không dùng GPS, hệ thống sẽ xác định tâm từ địa chỉ đã nhập."}</p><button className="btn-primary md:min-w-56 inline-flex justify-center gap-2" disabled={loading} onClick={() => void search()}><Search className="w-4 h-4" />{loading ? "Đang tìm..." : "Tìm tự động"}</button></div>
    </div>
    {directResults.length>0&&<div className="card p-5 space-y-5"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-bold">Kết quả trực tiếp từ Gemini + DeepSeek</h2><p className="text-xs opacity-60">Nguồn: {directProvider} · Tâm: {resolvedCenter?.label??"chưa xác định"} · {radiusKm} km · Tự phục hồi khi quay lại</p>{resolvedCenter&&<p className="mt-1 text-[11px] text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5"/>Đã xác minh tâm · {resolvedCenter.source==="GPS"?"GPS":`Địa giới ${resolvedCenter.placeType}`} · độ tin cậy {resolvedCenter.validationConfidence==="HIGH"?"cao":"trung bình"}</p>}</div><div className="flex flex-wrap gap-2"><button type="button" disabled={!unsavedResults.length||Boolean(savingResultKey)} onClick={toggleAllUnsaved} className="btn-secondary inline-flex items-center gap-2 text-xs">{allUnsavedSelected?<CheckSquare className="w-4 h-4"/>:<Square className="w-4 h-4"/>}{allUnsavedSelected?"Bỏ chọn tất cả":`Chọn tất cả chưa lưu (${unsavedResults.length})`}</button><button type="button" disabled={!selectedResults.length||Boolean(savingResultKey)} onClick={()=>void saveResults(selectedResults,"BATCH")} className="btn-primary inline-flex items-center gap-2 text-xs"><BookmarkPlus className="w-4 h-4"/>{savingResultKey==="BATCH"?"Đang lưu...":`Lưu công ty đã chọn (${selectedResults.length})`}</button></div></div>{directResultSections.map((section)=><section key={section.status} className="space-y-3"><div><h3 className="font-semibold">{section.title} <span className="text-xs font-normal opacity-60">({section.items.length})</span></h3><p className="text-xs opacity-60">{section.description}</p></div><div className="grid md:grid-cols-2 gap-3">{section.items.map((item,index)=>{const saveKey=directCandidateSaveKey(item);const itemKey=`${saveKey}-${section.status}-${index}`;const saved=isDirectCandidateSaved(item,items);return <SupplierResultCard key={itemKey} item={item} opening={openingProfile===itemKey} verifying={verifyingLocation===itemKey} saving={savingResultKey===saveKey} saved={saved} selected={selectedResultKeys.has(saveKey)} onToggleSelected={()=>toggleSelected(item)} onSave={()=>void saveResults([item],saveKey)} onViewDetails={()=>void viewCompanyProfile(item,itemKey)} onVerifyLocation={()=>void verifyLocation(item,itemKey)}/>})}</div></section>)}</div>}
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-700" /><div><h2 className="font-bold">Nhập từ ChatGPT / Gemini / DeepSeek</h2><p className="text-xs opacity-60">Extension chỉ chuyển phần JSON anh chủ động chọn; dữ liệu vẫn vào vùng chờ duyệt.</p></div></div>
      <textarea className="input min-h-32" value={aiText} onChange={(e) => setAiText(e.target.value)} placeholder='Dán JSON: [{"legalName":"...","address":"..."}]' />
      <div className="flex justify-between items-center gap-3"><span className="text-xs opacity-60">Nguồn: {aiProvider}</span><button className="btn-primary" disabled={loading} onClick={() => void importFromAI()}>Kiểm tra & lưu vùng chờ</button></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{items.map((item) => <article key={item.id} className="card p-5 space-y-3">
      <div className="flex justify-between gap-3"><div><div className="text-[10px] text-brand-700">{ROLE_LABELS[item.role]} · {item.sourceProvider}</div><h3 className="font-bold">{item.legalName}</h3></div><span className="text-xs">{item.status === "PENDING" ? "Chờ duyệt" : item.status === "APPROVED" ? "Phù hợp" : "Đã loại"}</span></div>
      <p className="text-sm flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{item.address}</p>
      <div className="flex justify-between"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 inline-flex gap-1">Kiểm tra nguồn <ExternalLink className="w-3 h-3" /></a>
      {item.status === "PENDING" && <div className="flex gap-2"><button onClick={() => void review(item.id,"REJECTED")} className="btn-secondary p-2" aria-label="Loại"><X className="w-4 h-4" /></button><button onClick={() => void review(item.id,"APPROVED")} className="btn-primary p-2" aria-label="Đánh dấu phù hợp"><Check className="w-4 h-4" /></button></div>}</div>
    </article>)}</div>
    {!loading && items.length === 0 && <div className="card p-10 text-center opacity-60">Chưa có ứng viên. Nhập nhu cầu để bắt đầu tìm kiếm.</div>}
  </div>;
}
