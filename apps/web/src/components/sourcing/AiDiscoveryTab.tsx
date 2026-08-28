"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Boxes, Bot, Building2, Check, CheckCircle2, ExternalLink, Factory, MapPin, Navigation, RefreshCw, Search, Send, ShieldCheck, Sparkles, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import { directCandidateSaveKey, approveDiscoveryCandidate, isDirectCandidateSaved, loadDiscoveryCandidates, saveDirectSearchCandidates, setDiscoveryStatus, type DirectSearchCandidate, type DiscoveryCandidate } from "@/lib/production-discovery";
import { ensureCompanyProfileFromSearch } from "@/lib/production-company-profile";
import { supabase } from "@/lib/supabase/client";
import { MANG_LUOI_DANH_MUC } from "@/lib/data/mang-luoi-danh-muc";
import { SupplierResultCard } from "@/components/sourcing/SupplierResultCard";
import { runCompanyReaderShadow } from "@/lib/company-reader-shadow";
import React from "react";

// Trình render Markdown gọn nhẹ (không cần thư viện) cho Chatbox
const SimpleMarkdown = ({ content }: { content: string }) => {
  const parseLine = (line: string, index: number) => {
    let html = line
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") // sanitize
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>") // italic
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline hover:text-brand-800">$1</a>'); // link

    if (html.startsWith("- ") || html.startsWith("* ")) {
      return <li key={index} dangerouslySetInnerHTML={{ __html: html.substring(2) }} className="ml-4 list-disc" />;
    } else if (html.match(/^\d+\.\s/)) {
      return <li key={index} dangerouslySetInnerHTML={{ __html: html.replace(/^\d+\.\s/, "") }} className="ml-4 list-decimal" />;
    } else if (html.startsWith("### ")) {
      return <h3 key={index} dangerouslySetInnerHTML={{ __html: html.substring(4) }} className="text-lg font-bold mt-3 mb-2 text-brand-700" />;
    } else if (html.startsWith("## ")) {
      return <h2 key={index} dangerouslySetInnerHTML={{ __html: html.substring(3) }} className="text-xl font-bold mt-4 mb-2 text-brand-800" />;
    }
    return <p key={index} dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} className={html ? "mb-1" : "mb-2"} />;
  };
  return <div className="text-sm leading-relaxed">{content.split("\n").map(parseLine)}</div>;
};

const HCM_DISTRICTS = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Tân Bình", "Bình Tân", "Tân Phú", "Phú Nhuận", "Gò Vấp", "Bình Thạnh",
  "Thủ Đức",
  "Huyện Hóc Môn", "Huyện Củ Chi", "Huyện Nhà Bè", "Huyện Bình Chánh", "Huyện Cần Giờ"
];

const SEARCH_CACHE_KEY = "mimin:sourcing-search:v3";

// Nút gợi ý nhanh trong khung chat - chỉ điền sẵn câu vào ô nhắn (không tự gửi) để anh
// còn bổ sung chi tiết trước khi bấm Gửi. partner_type do DeepSeek tự suy ra từ câu chữ
// (search_partners tool), không phụ thuộc role cố định của trang này - nên vẫn cho chọn
// cả 3 loại kể cả khi đang ở trang Xưởng/Nhà cung cấp.
const CHAT_STARTERS = [
  { label: "Xưởng may gia công", icon: Factory, text: "Tìm xưởng may gia công" },
  { label: "Nhà cung cấp", icon: Boxes, text: "Tìm nhà cung cấp nguyên phụ liệu" },
  { label: "Khách hàng", icon: Building2, text: "Tìm khách hàng đầu ra" },
] as const;

interface SearchCriteriaSnapshot {
  query: string;
  location: string;
  role: ProductionPartnerRole;
  radiusKm: number;
  searchedAt: string;
}

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
  locationType?: "DISTRICT" | "GPS";
  role: ProductionPartnerRole;
  radiusKm: number;
  locationMode: "PREFER" | "STRICT";
  center: {latitude:number;longitude:number;accuracy?:number}|null;
  directResults: DirectSearchCandidate[];
  directProvider: string;
  resolvedCenter: ResolvedSearchCenter|null;
  learningSummary: {approvedCount:number;rejectedCount:number;applied:boolean}|null;
  diagnostics: SearchDiagnostics|null;
  resultCriteria: SearchCriteriaSnapshot|null;
}

interface SearchDiagnostics { requestedRadiusKm?:number;effectiveRadiusKm?:number;radiusEscalated?:boolean;discoveryExpanded?:boolean;discoveryExpansionRadiusKm?:number|null;executedQueries?:string[];plannedQueries?:number;executedTavilyQueries?:number;normalizationBatches?:number;normalizationSourceLimit?:number;collectedSources:number;normalizedCandidates:number;directoryCandidates?:number;supplementedCandidates?:number;finalCandidates:number;exactCandidates?:number;relatedCandidates?:number;verified:number;partial:number;insideRadius:number;unknownCoordinates:number;coordinateConflicts?:number;locationBreakdown?:{inside:number;outside:number;unknown:number;conflict:number};strictExcluded?:number;strictLocationFallback?:boolean;enrichmentSources?:number;enrichedCandidates?:number;companyReaderEnrichmentSources?:number;rejectedNoiseCandidates?:number;qualityGate?:{strong:number;review:number;weak:number;conflicts:number;averageScore:number};qualificationGate?:{qualified:number;needsVerification:number;incomplete:number;missingPhone:number;missingAddress:number;missingTaxCode:number;individualSellerSuspected:number;entityTypeUnknown:number};geocoding?:{attempted:number;verified:number;rejected:number;retainedFromSource:number;persistentHits?:number;staleFallbacks?:number;providerRequests?:number};locationQuality?:{runId:string;algorithmVersion:string;grade:"HIGH"|"MEDIUM"|"LOW";coordinateCoveragePercent:number;staleFallbackUsed:boolean;warnings:string[];evaluatedAt:string};providers:Array<{name:string;status:"OK"|"EMPTY"|"ERROR"|"DISABLED"|"SKIPPED";count:number;code?:string}> }

function SearchProgressModal({ loading }: { loading: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!loading) { setStep(0); return; }
    const t1 = setTimeout(() => setStep(1), 2000);
    const t2 = setTimeout(() => setStep(2), 6000);
    const t3 = setTimeout(() => setStep(3), 12000);
    const t4 = setTimeout(() => setStep(4), 18000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [loading]);
  if (!loading) return null;
  const steps = [
    "Khởi tạo luồng tìm kiếm AI...",
    "Quét nguồn dữ liệu từ Brave, Google & Tavily...",
    "Agent DeepSeek/Gemini đang phân tích hồ sơ...",
    "Định vị GPS & tính toán khoảng cách...",
    "Đang tổng hợp kết quả..."
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-sm space-y-4">
        <div className="flex justify-center"><RefreshCw className="w-10 h-10 text-brand-600 animate-spin" /></div>
        <div className="text-center">
          <h3 className="font-bold text-lg">Hệ thống đang xử lý</h3>
          <p className="text-brand-600 font-medium mt-2 animate-pulse">{steps[step]}</p>
        </div>
        <div className="space-y-2 mt-4">
          {steps.map((s, i) => (
             <div key={i} className={`text-xs flex items-center gap-2 ${i === step ? "text-brand-700 font-semibold" : i < step ? "text-emerald-600" : "text-slate-400"}`}>
               {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i === step ? <RefreshCw className="w-3 h-3 animate-spin" /> : <div className="w-3 h-3 rounded-full border" />}
               {s}
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// --- Jina Radar Component ---
function JinaRadar({ diagnostics }: { diagnostics: any }) {
  if (!diagnostics) return null;
  
  const diagList = Array.isArray(diagnostics) ? diagnostics : [diagnostics];
  const radarLogs: any[] = [];
  
  for (const diag of diagList) {
    if (diag && Array.isArray(diag.operations)) {
      for (const op of diag.operations) {
         if (op.name === "Jina Reader" && Array.isArray(op.radarLogs)) {
            radarLogs.push(...op.radarLogs);
         }
      }
    }
  }

  if (radarLogs.length === 0) return null;

  return (
    <div className="card p-4 space-y-3 bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden relative group mt-4">
      <div className="absolute top-0 right-0 bg-brand-600 px-2 py-1 text-[10px] uppercase font-bold rounded-bl-lg">Jina Radar</div>
      <div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-2">
         <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
         </span>
         <h3 className="font-semibold text-sm">Theo dõi Jina Reader (Trực tiếp)</h3>
         <span className="ml-auto opacity-70">URL đã xử lý: {radarLogs.length}</span>
      </div>
      <div className="max-h-60 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
         {radarLogs.map((log: any, i: number) => {
             const time = new Date(log.timestamp).toLocaleTimeString("vi-VN");
             const color = log.status === "ERROR" ? "text-red-400" : log.status === "SUCCESS" ? "text-emerald-400" : "text-amber-400";
             const icon = log.status === "ERROR" ? "🔴" : log.status === "SUCCESS" ? "🟢" : "🟡";
             return (
               <div key={i} className="flex gap-2 items-start border-b border-slate-800 pb-1">
                 <span className="text-slate-500 shrink-0">[{time}]</span>
                 <span className="shrink-0">{icon}</span>
                 <div className="flex-1 min-w-0">
                    <p className="truncate opacity-80" title={log.url}>{log.url}</p>
                    {log.status === "SUCCESS" && <p className={`${color} font-semibold`}>{"=>"} {log.message || `Đọc thành công ${log.bytesRead || 0} bytes`}</p>}
                    {log.status === "ERROR" && <p className={`${color}`}>{"=>"} Lỗi: {log.message}</p>}
                    {log.status === "PENDING" && <p className={`${color} animate-pulse`}>{"=>"} Đang kết nối Jina Reader...</p>}
                 </div>
               </div>
             );
         })}
      </div>
    </div>
  );
}
// -----------------------------

export function AiDiscoveryTab({ role }: { role: ProductionPartnerRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [manualKeyword, setManualKeyword] = useState("");
  const [locationType, setLocationType] = useState<"DISTRICT" | "GPS">("DISTRICT");
  const [location, setLocation] = useState("");
  const lastDistrictLocation = useRef("");
  const gpsRequestId = useRef(0);
  const shadowRequestId = useRef(0);
  const [items, setItems] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [directResults, setDirectResults] = useState<DirectSearchCandidate[]>([]);
  const [directProvider, setDirectProvider] = useState("");
  const [openingProfile, setOpeningProfile] = useState("");
  const [verifyingLocation, setVerifyingLocation] = useState("");
  const [savingCard, setSavingCard] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [locationMode, setLocationMode] = useState<"PREFER" | "STRICT">("PREFER");
  const [entityTypeFilter, setEntityTypeFilter] = useState<"ALL" | "COMPANY" | "HOUSEHOLD_BUSINESS">("ALL");
  const [selectedResultKeys, setSelectedResultKeys] = useState<Set<string>>(new Set());
  const [center, setCenter] = useState<{latitude:number;longitude:number;accuracy?:number}|null>(null);
  const [resolvedCenter, setResolvedCenter] = useState<ResolvedSearchCenter|null>(null);
  const [learningSummary, setLearningSummary] = useState<{approvedCount:number;rejectedCount:number;applied:boolean}|null>(null);
  const [diagnostics, setDiagnostics] = useState<SearchDiagnostics|null>(null);
  const [agentDiagnostics, setAgentDiagnostics] = useState<any>(null);
  const lastSearchArgsRef = useRef<any>(null);
  const [resultCriteria, setResultCriteria] = useState<SearchCriteriaSnapshot|null>(null);
  const [cacheReady,setCacheReady]=useState(false);
  const [chatBubbles,setChatBubbles]=useState<Array<{role:"user"|"assistant"|"error";content:string;payload?:string}>>([]);
  const [chatInput,setChatInput]=useState("");
  const [chatLoading,setChatLoading]=useState(false);
  const chatRequestId=useRef(0);
  // Auto-refresh when Jina Reader is processing in the background
  useEffect(() => {
    if (!agentDiagnostics || chatLoading) return;
    const diagList = Array.isArray(agentDiagnostics) ? agentDiagnostics : [agentDiagnostics];
    const hasShadow = diagList.some(d => d?.api0Baseline?.operations?.some((op: any) => op.name === "Jina Reader" && op.code === "SHADOW_ONLY") || d?.api0Operations?.some((op: any) => op.name === "Jina Reader" && op.code === "SHADOW_ONLY"));
    if (hasShadow) {
      const timer = setTimeout(async () => {
         if (!lastSearchArgsRef.current) return;
         try {
           setChatBubbles(current => [...current, { role: "assistant", content: "Đang tự động tải lại dữ liệu từ Jina Reader (chạy ngầm)..." }]);
           const token = (await supabase?.auth.getSession())?.data.session?.access_token;
           if (!token) return;
           const toolsResponse = await fetch("/api/v1/mimin-group/agent/tools", {
             method: "POST",
             headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
             body: JSON.stringify({ 
               toolCalls: [{ id: "call_refresh", type: "function", function: { name: "search_partners", arguments: JSON.stringify(lastSearchArgsRef.current) } }], 
               turnResults: [] 
             }),
           });
           if (!toolsResponse.ok) return;
           const toolsData = await toolsResponse.json();
           if (toolsData.results) {
             setDirectResults(toolsData.results.candidates || []);
             setDirectProvider((toolsData.results.provider || []).join("+"));
             setAgentDiagnostics(toolsData.results.diagnostics || null);
             setChatBubbles(current => {
               const filtered = current.filter(b => b.content !== "Đang tự động tải lại dữ liệu từ Jina Reader (chạy ngầm)...");
               return [...filtered, { role: "assistant", content: "Đã tự động tải lại dữ liệu Jina Reader thành công!" }];
             });
           }
         } catch (error) {}
      }, 70000); // 70 seconds delay to ensure edge function cache is populated
      return () => clearTimeout(timer);
    }
  }, [agentDiagnostics, chatLoading, supabase]);

  const refresh = useCallback(async () => { try { setItems(await loadDiscoveryCandidates()); } catch (error) { console.error("Không tải được ứng viên:", error); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    setQuery("");
    setManualKeyword("");
  }, [role]);
  useEffect(()=>{
    try{
      const raw=sessionStorage.getItem(SEARCH_CACHE_KEY);
      if(raw){
        const cached=JSON.parse(raw) as Partial<SearchCache>;
        if(typeof cached.query==="string")setQuery(cached.query);
        if(typeof cached.location==="string"){
          const restoredType=cached.locationType==="GPS"||cached.location==="Vị trí hiện tại (GPS)"?"GPS":"DISTRICT";
          setLocationType(restoredType);
          setLocation(cached.location);
          if(restoredType==="DISTRICT")lastDistrictLocation.current=cached.location;
        }
        if(typeof cached.radiusKm==="number")setRadiusKm(cached.radiusKm);
        if(cached.center&&(cached.locationType==="GPS"||cached.location==="Vị trí hiện tại (GPS)"))setCenter(cached.center);
        if(Array.isArray(cached.directResults))setDirectResults(cached.directResults);
        if(typeof cached.directProvider==="string")setDirectProvider(cached.directProvider);
        if(cached.resolvedCenter)setResolvedCenter(cached.resolvedCenter);
        if(cached.learningSummary)setLearningSummary(cached.learningSummary);
        if(cached.diagnostics)setDiagnostics(cached.diagnostics);
        if(cached.resultCriteria)setResultCriteria(cached.resultCriteria);
      }
    }catch{sessionStorage.removeItem(SEARCH_CACHE_KEY)}
    finally{setCacheReady(true)}
  },[]);
  useEffect(()=>{
    if(!cacheReady)return;
    const cached:SearchCache={query,location,locationType,role,radiusKm,locationMode,center:locationType==="GPS"?center:null,directResults,directProvider,resolvedCenter,learningSummary,diagnostics,resultCriteria};
    try{sessionStorage.setItem(SEARCH_CACHE_KEY,JSON.stringify(cached))}catch{/* Trình duyệt có thể chặn hoặc hết dung lượng sessionStorage. */}
  },[cacheReady,query,location,locationType,role,radiusKm,locationMode,center,directResults,directProvider,resolvedCenter,learningSummary,diagnostics,resultCriteria]);
  const search = async (silent = false): Promise<DirectSearchCandidate[]|null> => {
    const combinedQuery = [query, manualKeyword].filter(Boolean).join(", ");
    if (!combinedQuery.trim() || !location.trim()) { toast.error("Nhập nội dung và khu vực cần tìm"); return null; }
    if(locationType==="GPS"&&!center){toast.error("Đang chờ lấy tọa độ GPS. Anh thử lại sau vài giây.");return null;}
    const currentShadowRequestId = shadowRequestId.current + 1;
    shadowRequestId.current = currentShadowRequestId;
    setLoading(true);
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      const response = await fetch("/api/v1/sourcing/search", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({query:combinedQuery.trim(),location:location.trim(),role,center:locationType==="GPS"?center:null,radiusKm,locationMode}) });
      const data = await response.json() as {error?:string;provider?:string;searchQueries?:string[];center?:ResolvedSearchCenter|null;learning?:{approvedCount:number;rejectedCount:number;applied:boolean};diagnostics?:SearchDiagnostics;candidates?:DirectSearchCandidate[]};
      if (!response.ok) throw new Error(data.error??"Tìm kiếm thất bại");
      const candidates = data.candidates??[];
      const diagnostics = data.diagnostics ?? null;
      if (diagnostics && data.searchQueries) diagnostics.executedQueries = data.searchQueries;
      // Render the primary search immediately. Company Reader is shadow-only and
      // must never hold the main result list behind a free-tier cold start.
        setDirectResults(candidates); setDirectProvider(data.provider??""); setResolvedCenter(data.center??null); setLearningSummary(data.learning??null); setDiagnostics(diagnostics);
        setResultCriteria({query:combinedQuery.trim(),location:location.trim(),role,radiusKm,searchedAt:new Date().toISOString()});
        // Shadow enrichment is deliberately detached from the primary search.
        // A request id prevents a slow previous run from updating a newer result set.
        void runCompanyReaderShadow(candidates.map((candidate) => candidate.sourceUrl)).then((readerShadow) => {
          if (shadowRequestId.current !== currentShadowRequestId || !diagnostics) return;
          setDiagnostics({ ...diagnostics, providers: [...diagnostics.providers, {
            name: "Jina Reader shadow",
            status: readerShadow.status === "SHADOW_PROCESSED" ? "OK" : readerShadow.status === "DISABLED" ? "DISABLED" : "ERROR",
            count: readerShadow.sourceCount,
            code: readerShadow.code,
          }] });
        });
      if (!silent) toast.success(`Đã mở rộng ${data.searchQueries?.length??0} truy vấn và xử lý ${candidates.length} kết quả`);
      return candidates;
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Tìm kiếm thất bại"); return null; }
    finally { setLoading(false); }
  };
  const cancelCurrentLocation=()=>{gpsRequestId.current+=1;setLocationType("DISTRICT");setCenter(null);setResolvedCenter(null);setLocation(lastDistrictLocation.current)};
  const useCurrentLocation=()=>{if(!navigator.geolocation)return toast.error("Thiết bị không hỗ trợ định vị");const requestId=gpsRequestId.current+1;gpsRequestId.current=requestId;if(locationType==="DISTRICT"&&location)lastDistrictLocation.current=location;setLocationType("GPS");setCenter(null);setLocation("Vị trí hiện tại (GPS)");navigator.geolocation.getCurrentPosition(position=>{if(gpsRequestId.current!==requestId)return;setCenter({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy});toast.success(`Đã lấy vị trí GPS · sai số khoảng ${Math.round(position.coords.accuracy)} m`)},()=>{if(gpsRequestId.current!==requestId)return;cancelCurrentLocation();toast.error("Không lấy được vị trí. Hãy cấp quyền định vị cho trình duyệt.")},{enableHighAccuracy:true,timeout:10000,maximumAge:60000})};
  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    try { if (status === "APPROVED") await approveDiscoveryCandidate(id); else await setDiscoveryStatus(id, status); await refresh(); toast.success(status === "APPROVED" ? "Đã duyệt vào danh mục đối tác" : "Đã loại ứng viên"); }
    catch { toast.error("Không cập nhật được trạng thái"); }
  };
  // Khung chat AI thay cho khung "Nhập từ ChatGPT/Gemini/DeepSeek" dán JSON thủ công cũ
  // (đã lỗi thời vì giờ có agent chat thật) - gọi cùng route DeepSeek tool-calling mà
  // AgentSearchBox dùng, nhưng đổ kết quả thẳng vào directResults/directResultSections
  // sẵn có của trang này thay vì có danh sách kết quả riêng - đúng ý "gộp về 1".
  //
  // Chiều ngược "chat → form": sau khi AI hiểu câu chat và gọi search_partners, đọc lại
  // args (specialty/location/radius_km) rồi tự điền vào form nâng cao phía trên - để anh
  // NHÌN THẤY chính xác AI đã hiểu điều kiện nào, không chỉ đọc trong câu trả lời.
  const syncFormFromToolCall = (args: Record<string, unknown>) => {
    const specialty = typeof args.specialty === "string" ? args.specialty.trim() : "";
    if (specialty) {
      const options = MANG_LUOI_DANH_MUC[role];
      const matched = options.find((option) => option.toLowerCase() === specialty.toLowerCase() || specialty.toLowerCase().includes(option.toLowerCase()) || option.toLowerCase().includes(specialty.toLowerCase()));
      if (matched) { setQuery(matched); setManualKeyword(""); }
      else { setQuery(""); setManualKeyword(specialty); }
    }
    const location_ = typeof args.location === "string" ? args.location.trim() : "";
    if (location_) { setLocationType("DISTRICT"); setCenter(null); setResolvedCenter(null); lastDistrictLocation.current = location_; setLocation(location_); }
    const radius = typeof args.radius_km === "number" ? args.radius_km : null;
    if (radius) { const nearest = [5, 10, 20, 30, 50, 100].reduce((best, option) => Math.abs(option - radius) < Math.abs(best - radius) ? option : best); setRadiusKm(nearest); }
  };
  const sendChat = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatLoading) return;
    const currentRequestId = chatRequestId.current + 1;
    chatRequestId.current = currentRequestId;
    
    // Convert current bubbles to message format
    const history = chatBubbles.filter(b => b.role !== "error").map(b => ({ role: b.role, content: b.content })).slice(-6);
    const messages = [...history, { role: "user", content: trimmed }];
    
    setChatBubbles((current) => [...current, { role: "user", content: trimmed }]);
    setChatLoading(true);

    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");

      // Seed turn results from current screen
      let turnResults = directResults.map((item, index) => ({ 
        role, 
        candidate: { ...item, role: undefined, roleLabel: undefined, resultIndex: undefined }, 
        searchQuery: "", 
        provider: "" 
      }));

      let loopCount = 0;
      let finalReply = "";

      while (loopCount < 5) {
        loopCount++;
        
        // 1. GỌI DEEPSEEK (Chỉ suy nghĩ, không chạy tool)
        const chatResponse = await fetch("/api/v1/mimin-group/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages }),
        });
        
        let chatData;
        const chatText = await chatResponse.text();
        try {
          chatData = JSON.parse(chatText);
        } catch {
          throw new Error(chatResponse.ok ? "Lỗi máy chủ: không nhận được JSON hợp lệ" : `Lỗi máy chủ (${chatResponse.status}): ${chatText.substring(0, 50)}...`);
        }
        if (!chatResponse.ok) throw new Error(chatData.error ?? "AI Search Agent gặp lỗi proxy");
        
        const message = chatData.message;
        if (!message) throw new Error("Không nhận được phản hồi từ AI");
        messages.push(message);

        // 2. NẾU KHÔNG CÓ TOOL CALL -> LÀ CÂU TRẢ LỜI CUỐI CÙNG
        if (!message.tool_calls || message.tool_calls.length === 0) {
          finalReply = message.content || "Đã xử lý xong.";
          break;
        }

        // 3. NẾU CÓ TOOL CALL -> GỌI API TOOLS ĐỂ THỰC THI
        if (chatRequestId.current === currentRequestId && loopCount === 1) {
          setChatBubbles((current) => [...current, { role: "assistant", content: "Đang phân tích dữ liệu và tìm kiếm..." }]);
        }

        const toolsResponse = await fetch("/api/v1/mimin-group/agent/tools", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toolCalls: message.tool_calls, turnResults }),
        });
        
        let toolsData;
        const toolsText = await toolsResponse.text();
        try {
          toolsData = JSON.parse(toolsText);
        } catch (err: any) {
          throw new Error(`API công cụ trả về dữ liệu hỏng. Status: ${toolsResponse.status}. Raw text: "${toolsText}". Error: ${err.message}`);
        }
        if (!toolsResponse.ok) throw new Error(toolsData.error ?? "Thực thi công cụ thất bại");

        turnResults = toolsData.turnResults || turnResults;
        
        if (toolsData.toolMessages) {
          messages.push(...toolsData.toolMessages);
        }

        // Update state and UI side-effects from tool execution
        const searchCall = message.tool_calls.find((call: any) => call.function?.name === "search_partners");
        if (searchCall) {
          try {
            const args = JSON.parse(searchCall.function.arguments);
            syncFormFromToolCall(args);
            lastSearchArgsRef.current = args;
          } catch {}
        }
        
        if (toolsData.results) {
          const fetchedCandidates = toolsData.results.candidates || [];
          setDirectResults(fetchedCandidates);
          setDirectProvider((toolsData.results.provider || []).join("+"));
          setResultCriteria({ query: trimmed, location, role, radiusKm, searchedAt: new Date().toISOString() });
          setAgentDiagnostics(toolsData.results.diagnostics || null);
        }
      }

      if (chatRequestId.current !== currentRequestId) return;
      if (!finalReply) finalReply = "Đã hoàn thành tìm kiếm (đạt giới hạn bước xử lý của AI). Vui lòng thử đổi từ khóa hoặc mở rộng bán kính.";

      // Xóa tin nhắn "Đang phân tích..." nếu có và thêm câu trả lời cuối
      setChatBubbles((current) => {
        const filtered = current.filter(b => b.content !== "Đang phân tích dữ liệu và tìm kiếm...");
        return [...filtered, { role: "assistant", content: finalReply }];
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : "AI Search Agent gặp lỗi";
      if (chatRequestId.current === currentRequestId) {
        setChatBubbles((current) => {
          const filtered = current.filter(b => b.content !== "Đang phân tích dữ liệu và tìm kiếm...");
          return [...filtered, { role: "error", content: `Xin lỗi, có lỗi xảy ra: ${message}`, payload: trimmed }];
        });
      }
    } finally {
      if (chatRequestId.current === currentRequestId) setChatLoading(false);
    }
  };
  // "Nạp điều kiện đã chọn" - ghép các trường form nâng cao (đã điền ở trên) thành 1 câu
  // rồi gửi thẳng cho AI Agent, để không phải gõ lại tay những gì đã chọn sẵn.
  const roleTypeLabel = role === "CUSTOMER" ? "khách hàng" : role === "SATELLITE_PROCESSOR" ? "xưởng sản xuất" : "nhà cung cấp";
  const composeFormMessage = () => {
    const specialty = [query, manualKeyword].filter(Boolean).join(", ");
    const parts = [`Tìm ${roleTypeLabel}`];
    if (specialty) parts.push(`chuyên ${specialty}`);
    if (locationType === "GPS" && center) parts.push(`gần vị trí hiện tại (tọa độ ${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)})`);
    else if (location.trim()) parts.push(`ở ${location.trim()}`);
    parts.push(`bán kính ${radiusKm}km`);
    return parts.join(" ");
  };
  const sendFormConditions = () => {
    if (!query && !manualKeyword) { toast.error("Chọn năng lực hoặc nhập từ khóa ở form phía trên trước"); return; }
    if (!location.trim() && !(locationType === "GPS" && center)) { toast.error("Chọn khu vực hoặc bật Vị trí hiện tại ở form phía trên trước"); return; }
    void sendChat(composeFormMessage());
  };
  const saveDirectResults = async()=>{const selected=directResults.filter(item=>selectedResultKeys.has(directCandidateSaveKey(item)));const candidates=selected.length?selected:directResults.filter(item=>!isDirectCandidateSaved(item,items));try{const result=await saveDirectSearchCandidates(candidates,role,`${query} | ${location}`,directProvider);await refresh();setSelectedResultKeys(new Set());if(result.savedCount)toast.success(`Đã lưu ${result.savedCount} công ty vào Công ty đã lưu`);else toast.info("Các công ty đã có trong vùng chờ")}catch(error){toast.error(error instanceof Error?error.message:"Không lưu được kết quả")}};
  const saveOneResult = async (item: DirectSearchCandidate, key: string) => {
    setSavingCard(key);
    try {
      const result=await saveDirectSearchCandidates([item], role, `${query} | ${location}`, directProvider);
      await refresh();
      if(result.savedCount)toast.success(`Đã lưu "${item.legalName}" vào Công ty đã lưu`);else toast.info("Công ty này đã được lưu trước đó");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không lưu được"); }
    finally { setSavingCard(""); }
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
  const currentCombinedQuery = [query, manualKeyword].filter(Boolean).join(", ").trim();
  const resultRadiusKm = diagnostics?.effectiveRadiusKm ?? resultCriteria?.radiusKm ?? radiusKm;
  const resultsAreStale = Boolean(directResults.length && (!resultCriteria || resultCriteria.query !== currentCombinedQuery || resultCriteria.location !== location.trim() || resultCriteria.role !== role || resultCriteria.radiusKm !== radiusKm));
  const locationSections = [
    { status: "INSIDE", title: `Trong bán kính ${resultRadiusKm} km`, description: "Đã xác minh tọa độ · xếp từ gần đến xa" },
    { status: "OUTSIDE", title: "Gợi ý mở rộng ngoài bán kính", description: "Chỉ hiển thị trong chế độ Ưu tiên gần" },
    { status: "UNKNOWN", title: "Chưa xác minh tọa độ", description: "Không được coi là nằm trong bán kính" },
    { status: "CONFLICT", title: "Cần kiểm tra mâu thuẫn vị trí", description: "Không dùng để tính khoảng cách" },
  ] as const;
  const directResultSections = ([
    { tier: "EXACT", prefix: "Đúng năng lực · đủ điều kiện" },
    { tier: "RELATED", prefix: "Ứng viên liên quan · cần xác minh" },
    { tier: "NOISE", prefix: "Không đủ hồ sơ công ty (Bị loại)" },
  ] as const).flatMap((tier) => locationSections.map((section) => ({
    ...section,
    key: `${tier.tier}-${section.status}`,
    title: `${tier.prefix} — ${section.title}`,
    items: directResults.filter((item) => (item.resultTier ?? "EXACT") === tier.tier && (item.locationStatus === section.status || (section.status === "UNKNOWN" && !item.locationStatus)) && (entityTypeFilter === "ALL" || item.entityType === entityTypeFilter)),
  }))).filter((section) => section.items.length);

  return <div className="space-y-5 animate-fade-in">

        <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-brand-700" /><div><h2 className="font-bold">Trò chuyện với AI Agent</h2><p className="text-xs opacity-60">Gõ nhu cầu bằng lời — AI tự hiểu, lọc điều kiện và gọi tìm kiếm; kết quả hiện ở khu vực phía trên.</p></div></div>
      <div className="flex flex-wrap gap-1.5">
        {CHAT_STARTERS.map((starter) => {
          const Icon = starter.icon;
          return (
            <button key={starter.label} type="button" disabled={chatLoading} onClick={() => setChatInput(starter.text)} className="text-xs rounded-full border px-2.5 py-1.5 font-medium inline-flex items-center gap-1.5 border-slate-200 text-slate-600 hover:border-brand-300 disabled:opacity-50 dark:text-slate-300">
              <Icon className="w-3.5 h-3.5" />{starter.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto rounded-xl border p-4 bg-white/50" style={{ borderColor: "var(--border)" }}>
        {chatBubbles.length === 0 && <p className="text-sm opacity-60 text-center mt-10">VD: "Tìm xưởng cắt tại Quận 12" hoặc "chỉ lấy công ty có website" để lọc lại kết quả vừa tìm.</p>}
        {chatBubbles.map((bubble, index) => (
          <div key={index} className={`flex items-start gap-2 text-sm ${bubble.role === "user" ? "justify-end" : ""}`}>
            {bubble.role === "assistant" && <Bot className="w-4 h-4 mt-0.5 shrink-0 text-brand-600" />}
            {bubble.role === "error" && <X className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />}
            <div className={`rounded-xl px-3 py-2 max-w-[85%] ${
              bubble.role === "user" ? "bg-brand-500 text-white" : 
              bubble.role === "error" ? "bg-red-50 text-red-700 border border-red-200" : 
              "bg-slate-100 dark:bg-white/10"
            }`}>
              {bubble.role === "user" ? bubble.content : <SimpleMarkdown content={bubble.content} />}
              {bubble.role === "error" && bubble.payload && (
                <button 
                  type="button"
                  onClick={() => {
                    setChatBubbles(curr => curr.filter((_, i) => i !== index));
                    void sendChat(bubble.payload!);
                  }}
                  className="mt-2 text-xs font-medium bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-md transition-colors"
                >
                  Thử lại
                </button>
              )}
            </div>
            {bubble.role === "user" && <UserIcon className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />}
          </div>
        ))}
        {chatLoading && <div className="flex items-center gap-2 text-sm opacity-60"><Bot className="w-4 h-4 shrink-0 text-brand-600" /><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Đang tìm kiếm...</div>}
      </div>
      <div className="flex items-end gap-3 mt-4">
        <textarea
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !chatLoading) { event.preventDefault(); void sendChat(chatInput); setChatInput(""); } }}
          disabled={chatLoading}
          className="input text-sm flex-1 min-h-[60px] max-h-32 py-3 resize-y"
          placeholder="Nhắn cho AI Agent (Shift + Enter để xuống dòng)..."
          rows={2}
        />
        <button type="button" onClick={() => { void sendChat(chatInput); setChatInput(""); }} disabled={chatLoading || !chatInput.trim()} className="btn-primary text-sm shrink-0 px-6 py-3 h-[60px] font-semibold">Gửi</button>
      </div>
    </div>
    {directResults.length>0&&<div className="card p-5 space-y-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Kết quả trực tiếp từ Gemini + DeepSeek</h2><p className="text-xs opacity-60">Nguồn: {directProvider} · Tâm: {resolvedCenter?.label??"chưa xác định"} · {radiusKm} km · Tự phục hồi khi quay lại</p>{resolvedCenter&&<p className="mt-1 text-[11px] text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5"/>Đã xác minh tâm · {resolvedCenter.source==="GPS"?"GPS":`Địa giới ${resolvedCenter.placeType}`} · độ tin cậy {resolvedCenter.validationConfidence==="HIGH"?"cao":"trung bình"}</p>}</div><button className="btn-primary" onClick={()=>void saveDirectResults()}>Lưu {selectedResultKeys.size||directResults.filter(item=>!isDirectCandidateSaved(item,items)).length} công ty</button></div>{directResultSections.map((section)=><section key={section.key} className="space-y-3"><div><h3 className="font-semibold">{section.title} <span className="text-xs font-normal opacity-60">({section.items.length})</span></h3><p className="text-xs opacity-60">{section.description}</p></div><div className="grid md:grid-cols-2 gap-3">{section.items.map((item,index)=>{const itemKey=`${item.sourceUrl}-${section.key}-${index}`;const saveKey=directCandidateSaveKey(item);const saved=isDirectCandidateSaved(item,items);return <SupplierResultCard key={itemKey} item={item} opening={openingProfile===itemKey} verifying={verifyingLocation===itemKey} saving={savingCard===itemKey} selected={selectedResultKeys.has(saveKey)} saved={saved} onToggle={()=>setSelectedResultKeys(current=>{const next=new Set(current);if(next.has(saveKey))next.delete(saveKey);else next.add(saveKey);return next})} onViewDetails={()=>void viewCompanyProfile(item,itemKey)} onVerifyLocation={()=>void verifyLocation(item,itemKey)} onSaveOne={()=>void saveOneResult(item,itemKey)}/>})}</div></section>)}</div>}

  </div>;
}
