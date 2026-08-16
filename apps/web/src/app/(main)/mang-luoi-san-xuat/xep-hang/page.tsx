"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapPin, Medal, Navigation } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { loadProductionPartners, PARTNER_ROLES, ROLE_LABELS, type ProductionPartner, type ProductionPartnerRole } from "@/lib/production-network";
import { rankPartners, type SourcingCriteria } from "@/lib/production-matching";

const numberOrNull = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;

export default function XepHangDoiTacPage() {
  const [partners,setPartners]=useState<ProductionPartner[]>([]); const [role,setRole]=useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");
  const [capability,setCapability]=useState(""); const [capacity,setCapacity]=useState(""); const [moq,setMoq]=useState("");
  const [lead,setLead]=useState(""); const [quality,setQuality]=useState(""); const [reliability,setReliability]=useState(""); const [radius,setRadius]=useState("");
  const [location,setLocation]=useState<{latitude:number;longitude:number}|null>(null);
  const refresh=useCallback(async()=>{try{setPartners(await loadProductionPartners())}catch{toast.error("Không tải được đối tác")}},[]);
  useEffect(()=>{void refresh()},[refresh]);
  const criteria:SourcingCriteria=useMemo(()=>({role,capability,requiredCapacity:numberOrNull(capacity),maximumMoq:numberOrNull(moq),maximumLeadDays:numberOrNull(lead),minimumQuality:numberOrNull(quality),minimumReliability:numberOrNull(reliability),latitude:location?.latitude??null,longitude:location?.longitude??null,maximumDistanceKm:numberOrNull(radius)}),[role,capability,capacity,moq,lead,quality,reliability,location,radius]);
  const matches=useMemo(()=>rankPartners(partners,criteria),[partners,criteria]);
  const locate=()=>navigator.geolocation?.getCurrentPosition(({coords})=>{setLocation({latitude:coords.latitude,longitude:coords.longitude});toast.success("Đã lấy vị trí")},()=>toast.error("Không lấy được vị trí"),{enableHighAccuracy:true,timeout:10000});
  return <div className="space-y-5 animate-fade-in"><PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Xếp hạng đối tác phù hợp" subtitle="Điểm số minh bạch theo tiêu chí anh nhập; không thay đổi dữ liệu đối tác." icon={<Medal className="w-5 h-5"/>}/>
    <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <label className="text-xs">Danh mục<select className="input mt-1" value={role} onChange={e=>setRole(e.target.value as ProductionPartnerRole)}>{PARTNER_ROLES.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
      <label className="text-xs">Năng lực<input className="input mt-1" value={capability} onChange={e=>setCapability(e.target.value)} placeholder="VD: vải cotton"/></label>
      <label className="text-xs">Công suất tối thiểu/tháng<input className="input mt-1" type="number" min="0" value={capacity} onChange={e=>setCapacity(e.target.value)}/></label>
      <label className="text-xs">MOQ tối đa<input className="input mt-1" type="number" min="0" value={moq} onChange={e=>setMoq(e.target.value)}/></label>
      <label className="text-xs">Đáp ứng tối đa (ngày)<input className="input mt-1" type="number" min="0" value={lead} onChange={e=>setLead(e.target.value)}/></label>
      <label className="text-xs">Chất lượng tối thiểu<input className="input mt-1" type="number" min="0" max="100" value={quality} onChange={e=>setQuality(e.target.value)}/></label>
      <label className="text-xs">Uy tín tối thiểu<input className="input mt-1" type="number" min="0" max="100" value={reliability} onChange={e=>setReliability(e.target.value)}/></label>
      <div className="flex gap-2 items-end"><label className="text-xs flex-1">Bán kính km<input className="input mt-1" type="number" min="0" value={radius} onChange={e=>setRadius(e.target.value)}/></label><button className="btn-secondary p-3" onClick={locate} aria-label="Lấy vị trí"><Navigation className="w-4 h-4"/></button></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{matches.map((m,index)=><article key={m.partner.id} className="card p-5 space-y-3"><div className="flex justify-between"><div className="flex gap-3"><span className="text-xl font-black">#{index+1}</span><div><h3 className="font-bold">{m.partner.legalName}</h3><p className="text-xs opacity-60">{m.partner.partnerCode}</p></div></div><span className={`text-xl font-black ${m.score>=80?"text-emerald-600":m.score>=50?"text-amber-600":"text-rose-600"}`}>{m.score}/100</span></div>{m.distanceKm!==null&&<p className="text-xs flex gap-1"><MapPin className="w-3 h-3"/>{m.distanceKm.toFixed(1)} km</p>}<div className="flex flex-wrap gap-1">{m.reasons.map(x=><span key={x} className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-1">✓ {x}</span>)}{m.gaps.map(x=><span key={x} className="text-[10px] bg-rose-100 text-rose-700 rounded-full px-2 py-1">! {x}</span>)}</div></article>)}</div>
    {matches.length===0&&<div className="card p-10 text-center opacity-60">Chưa có đối tác hoạt động trong danh mục này.</div>}</div>;
}
