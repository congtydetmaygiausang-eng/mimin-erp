"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, MapPin, Navigation, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import { approveDiscoveryCandidate, importAICandidates, loadDiscoveryCandidates, saveDirectSearchCandidates, setDiscoveryStatus, type DirectSearchCandidate, type DiscoveryCandidate } from "@/lib/production-discovery";
import { supabase } from "@/lib/supabase/client";

export default function TimKiemDoiTacPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");
  const [items, setItems] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [directResults, setDirectResults] = useState<DirectSearchCandidate[]>([]);
  const [directProvider, setDirectProvider] = useState("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [locationMode, setLocationMode] = useState<"PREFER"|"STRICT">("PREFER");
  const [center, setCenter] = useState<{latitude:number;longitude:number;accuracy?:number}|null>(null);
  const [resolvedCenter, setResolvedCenter] = useState<{label:string;source:"GPS"|"ADDRESS";accuracy?:number}|null>(null);
  const [aiText, setAiText] = useState("");
  const [aiProvider, setAiProvider] = useState("AI_IMPORT");
  const [aiSourceUrl, setAiSourceUrl] = useState("https://mimin-erp.vercel.app");
  const refresh = useCallback(async () => { try { setItems(await loadDiscoveryCandidates()); } catch { toast.error("Không tải được ứng viên"); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
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

  const search = async () => {
    if (!query.trim() || !location.trim()) return toast.error("Nhập nội dung và khu vực cần tìm");
    setLoading(true);
    try {
      const token = (await supabase?.auth.getSession())?.data.session?.access_token;
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn");
      const response = await fetch("/api/v1/sourcing/search", { method:"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body:JSON.stringify({query:query.trim(),location:location.trim(),role,center,radiusKm,locationMode}) });
      const data = await response.json() as {error?:string;provider?:string;searchQueries?:string[];center?:{label:string;source:"GPS"|"ADDRESS";accuracy?:number}|null;candidates?:DirectSearchCandidate[]};
      if (!response.ok) throw new Error(data.error??"Tìm kiếm thất bại");
      setDirectResults(data.candidates??[]); setDirectProvider(data.provider??""); setResolvedCenter(data.center??null);
      toast.success(`Đã mở rộng ${data.searchQueries?.length??0} truy vấn và xử lý ${data.candidates?.length??0} kết quả`);
    }
    catch (error) { toast.error(error instanceof Error ? error.message : "Tìm kiếm thất bại"); }
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
  const saveDirectResults = async()=>{try{await saveDirectSearchCandidates(directResults,role,`${query} | ${location}`,directProvider);setDirectResults([]);await refresh();toast.success("Đã lưu kết quả vào vùng chờ")}catch(error){toast.error(error instanceof Error?error.message:"Không lưu được kết quả")}};

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Tìm kiếm ứng viên tự động"
      subtitle="Kết quả từ nguồn mở được lưu vào vùng chờ; chưa tự động ghi vào danh mục đối tác chính thức."
      icon={<Search className="w-5 h-5" />} />
    <div className="card p-5 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><label className="text-xs font-medium">Danh mục<select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as ProductionPartnerRole)}>{PARTNER_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label><label className="text-xs font-medium">Cần tìm<input className="input mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: xưởng dệt, vải cotton" /></label></div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3"><label className="text-xs font-medium md:col-span-2">Vị trí trung tâm<input className="input mt-1" value={location} onChange={(e) => {setLocation(e.target.value);setCenter(null)}} placeholder="VD: Hóc Môn, TP.HCM" /></label><label className="text-xs font-medium">Bán kính<select className="input mt-1" value={radiusKm} onChange={e=>setRadiusKm(Number(e.target.value))}>{[5,10,20,30,50,100].map(value=><option key={value} value={value}>{value} km</option>)}</select></label><label className="text-xs font-medium">Chế độ<select className="input mt-1" value={locationMode} onChange={e=>setLocationMode(e.target.value as "PREFER"|"STRICT")}><option value="PREFER">Ưu tiên gần</option><option value="STRICT">Chỉ trong bán kính</option></select></label><div className="flex items-end"><button type="button" className="btn-secondary w-full inline-flex justify-center gap-2" onClick={useCurrentLocation}><Navigation className="w-4 h-4"/>Vị trí hiện tại</button></div></div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3"><p className="text-xs opacity-60">{center?`GPS: ${center.latitude.toFixed(5)}, ${center.longitude.toFixed(5)} · sai số ~${Math.round(center.accuracy??0)} m`:"Nếu không dùng GPS, hệ thống sẽ xác định tâm từ địa chỉ đã nhập."}</p><button className="btn-primary md:min-w-56 inline-flex justify-center gap-2" disabled={loading} onClick={() => void search()}><Search className="w-4 h-4" />{loading ? "Đang tìm..." : "Tìm tự động"}</button></div>
    </div>
    {directResults.length>0&&<div className="card p-5 space-y-4"><div className="flex items-center justify-between"><div><h2 className="font-bold">Kết quả trực tiếp từ Gemini + DeepSeek</h2><p className="text-xs opacity-60">Nguồn: {directProvider} · Tâm: {resolvedCenter?.label??"chưa xác định"} · {radiusKm} km</p></div><button className="btn-primary" onClick={()=>void saveDirectResults()}>Lưu {directResults.length} kết quả vào vùng chờ</button></div><div className="grid md:grid-cols-2 gap-3">{directResults.map((item,index)=><article key={`${item.sourceUrl}-${index}`} className="rounded-xl border p-4" style={{borderColor:"var(--border)"}}><div className="flex justify-between gap-2"><div><b>{item.legalName}</b><div className="text-[11px] mt-1 text-brand-700">{item.verificationStatus==="VERIFIED"?"Đã đối chiếu nhiều nguồn":item.verificationStatus==="PARTIAL"?"Đã đối chiếu một phần":"Chưa đủ bằng chứng"}</div></div><span className="text-xs text-brand-700">{item.confidence}% phù hợp</span></div><p className="text-xs mt-2 opacity-70">{item.address}</p><div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">{item.phone&&<a href={`tel:${item.phone}`}>Điện thoại: {item.phone}</a>}{item.email&&<a href={`mailto:${item.email}`}>Email: {item.email}</a>}{item.taxCode&&<span>MST: {item.taxCode}</span>}{item.website&&<a className="text-brand-700 truncate" href={item.website.startsWith("http")?item.website:`https://${item.website}`} target="_blank" rel="noopener noreferrer">Website: {item.website}</a>}</div><div className="mt-2 flex flex-wrap gap-2">{item.matchReasons?.map(reason=><span key={reason} className="text-[11px] rounded-full border px-2 py-1" style={{borderColor:"var(--border)"}}>{reason}</span>)}</div><div className="mt-3 flex flex-wrap gap-3 text-xs">{(item.sources?.length?item.sources:[{url:item.sourceUrl,title:item.sourceTitle}]).slice(0,3).map((source,sourceIndex)=><a key={`${source.url}-${sourceIndex}`} className="text-brand-700" href={source.url} target="_blank" rel="noopener noreferrer">Nguồn {sourceIndex+1}</a>)}</div></article>)}</div></div>}
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
