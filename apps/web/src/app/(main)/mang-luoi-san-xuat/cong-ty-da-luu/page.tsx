"use client";

// @codex Q3: màn hình quản lý riêng cho vùng chờ production_discovery_candidates.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArchiveRestore, BadgeCheck, Building2, Check, ExternalLink, Filter, Globe2, Hash, Mail, MapPin, Phone, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, normalizeSearchValue, type ProductionPartnerRole } from "@/lib/production-network";
import { approveDiscoveryCandidate, loadDiscoveryCandidates, setDiscoveryStatus, type DiscoveryCandidate, type DiscoveryStatus } from "@/lib/production-discovery";

type ManagementTab = DiscoveryStatus | "ALL" | "DUPLICATE" | "MISSING";

const TAB_LABELS: Array<{value:ManagementTab;label:string}> = [
  {value:"ALL",label:"Tất cả"},
  {value:"PENDING",label:"Chờ duyệt"},
  {value:"APPROVED",label:"Đã duyệt"},
  {value:"REJECTED",label:"Đã loại"},
  {value:"DUPLICATE",label:"Có thể trùng"},
  {value:"MISSING",label:"Thiếu thông tin"},
];

const PAGE_SIZE=12;

function identityKeys(item:DiscoveryCandidate):string[]{
  return [
    item.taxCode?`tax:${normalizeSearchValue(item.taxCode)}`:"",
    item.phone?`phone:${item.phone.replace(/\D/g,"")}`:"",
    item.website?`web:${normalizeSearchValue(item.website.replace(/^https?:\/\//i,"").replace(/^www\./i,""))}`:"",
    item.legalName&&item.address?`name:${normalizeSearchValue(item.legalName)}|${normalizeSearchValue(item.address)}`:"",
  ].filter(Boolean);
}

function isMissing(item:DiscoveryCandidate):boolean{
  const hasContact=Boolean(item.phone||item.email||item.website);
  return !item.address||!hasContact||!item.taxCode;
}

function statusLabel(status:DiscoveryStatus):string{
  if(status==="PENDING")return "Chờ duyệt";
  if(status==="APPROVED")return "Đã vào danh mục chính thức";
  return "Đã loại";
}

export default function CongTyDaLuuPage(){
  const[items,setItems]=useState<DiscoveryCandidate[]>([]);
  const[loading,setLoading]=useState(true);
  const[updatingId,setUpdatingId]=useState("");
  const[tab,setTab]=useState<ManagementTab>("PENDING");
  const[role,setRole]=useState<ProductionPartnerRole|"ALL">("ALL");
  const[query,setQuery]=useState("");
  const[page,setPage]=useState(1);

  const refresh=useCallback(async()=>{
    setLoading(true);
    try{setItems(await loadDiscoveryCandidates())}
    catch(error){toast.error(error instanceof Error?error.message:"Không tải được công ty đã lưu")}
    finally{setLoading(false)}
  },[]);
  useEffect(()=>{void refresh()},[refresh]);

  const duplicateIds=useMemo(()=>{
    const owners=new Map<string,string[]>();
    for(const item of items)for(const key of identityKeys(item))owners.set(key,[...(owners.get(key)??[]),item.id]);
    return new Set(Array.from(owners.values()).filter(ids=>ids.length>1).flat());
  },[items]);

  const counts=useMemo<Record<ManagementTab,number>>(()=>({
    ALL:items.length,
    PENDING:items.filter(item=>item.status==="PENDING").length,
    APPROVED:items.filter(item=>item.status==="APPROVED").length,
    REJECTED:items.filter(item=>item.status==="REJECTED").length,
    DUPLICATE:duplicateIds.size,
    MISSING:items.filter(isMissing).length,
  }),[duplicateIds,items]);

  const filtered=useMemo(()=>{
    const keyword=normalizeSearchValue(query);
    return items.filter(item=>{
      if(tab==="DUPLICATE"&&!duplicateIds.has(item.id))return false;
      if(tab==="MISSING"&&!isMissing(item))return false;
      if((tab==="PENDING"||tab==="APPROVED"||tab==="REJECTED")&&item.status!==tab)return false;
      if(role!=="ALL"&&item.role!==role)return false;
      return !keyword||normalizeSearchValue([item.legalName,item.taxCode,item.phone,item.email,item.website,item.address,item.searchQuery].join(" ")).includes(keyword);
    });
  },[duplicateIds,items,query,role,tab]);
  const pageCount=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE));
  const visible=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  useEffect(()=>{setPage(1)},[query,role,tab]);
  useEffect(()=>{if(page>pageCount)setPage(pageCount)},[page,pageCount]);

  const updateStatus=async(item:DiscoveryCandidate,status:DiscoveryStatus)=>{
    setUpdatingId(item.id);
    try{
      if(status==="APPROVED")await approveDiscoveryCandidate(item.id);else await setDiscoveryStatus(item.id,status);
      await refresh();
      toast.success(status==="APPROVED"?"Đã duyệt vào danh mục đối tác":status==="PENDING"?"Đã khôi phục về chờ duyệt":"Đã chuyển vào danh sách loại");
    }catch(error){toast.error(error instanceof Error?error.message:"Không cập nhật được trạng thái")}
    finally{setUpdatingId("")}
  };

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Công ty đã lưu" subtitle="Quản lý vùng chờ Supabase; chỉ hồ sơ được duyệt mới đi vào danh mục đối tác chính thức." icon={<Building2 className="w-5 h-5"/>} actions={<div className="flex flex-wrap gap-2"><Link href="/mang-luoi-san-xuat" className="btn-secondary inline-flex items-center gap-2"><Search className="w-4 h-4"/>Tìm thêm công ty</Link><button type="button" onClick={()=>void refresh()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Làm mới</button></div>}/>

    <div className="card p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">{TAB_LABELS.map(item=><button key={item.value} type="button" onClick={()=>setTab(item.value)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${tab===item.value?"border-brand-500 bg-brand-500 text-white":"hover:bg-brand-500/5"}`}><span>{item.label}</span><span className={`ml-2 rounded-full px-1.5 py-0.5 ${tab===item.value?"bg-white/20":"bg-slate-100 dark:bg-white/10"}`}>{counts[item.value]}</span></button>)}</div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]"><label className="relative"><Search className="absolute left-3 top-3 w-4 h-4 opacity-50"/><input className="input pl-9" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm tên, mã số thuế, điện thoại, email, website, địa chỉ..."/></label><label className="relative"><Filter className="absolute left-3 top-3 w-4 h-4 opacity-50"/><select className="input pl-9" value={role} onChange={event=>setRole(event.target.value as ProductionPartnerRole|"ALL")}><option value="ALL">Tất cả danh mục</option>{PARTNER_ROLES.map(item=><option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label></div>
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><b>Luồng dữ liệu:</b> Lưu từ tìm kiếm → Chờ duyệt tại trang này → Duyệt → Danh mục đối tác chính thức. Hồ sơ bị loại vẫn được giữ để tránh tìm và lưu lại kết quả không phù hợp.</div>
    </div>

    {loading?<div className="card p-10 text-center opacity-60">Đang tải công ty đã lưu...</div>:visible.length===0?<div className="card p-10 text-center"><Building2 className="mx-auto w-10 h-10 text-brand-700 opacity-50"/><h2 className="mt-3 font-bold">Không có công ty phù hợp bộ lọc</h2><p className="mt-1 text-sm opacity-60">Thử đổi trạng thái, danh mục hoặc từ khóa tìm kiếm.</p></div>:<div className="grid gap-4 lg:grid-cols-2">{visible.map(item=>{
      const duplicate=duplicateIds.has(item.id);
      const missing=isMissing(item);
      return <article key={item.id} className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold text-brand-700">{ROLE_LABELS[item.role]} · {item.sourceProvider}</p><h2 className="mt-1 font-bold leading-snug">{item.legalName}</h2><p className="mt-1 text-[11px] opacity-55">Lưu lúc {new Date(item.discoveredAt).toLocaleString("vi-VN")}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status==="APPROVED"?"bg-emerald-100 text-emerald-700":item.status==="REJECTED"?"bg-rose-100 text-rose-700":"bg-amber-100 text-amber-700"}`}>{statusLabel(item.status)}</span></div>
        <div className="space-y-2 text-xs"><div className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-rose-600"/><span className="break-words">{item.address||"Chưa có địa chỉ"}</span></div><div className="grid gap-2 sm:grid-cols-2"><div className="flex gap-2"><Phone className="w-4 h-4 shrink-0 text-emerald-600"/><span>{item.phone||"Chưa có điện thoại"}</span></div><div className="flex gap-2"><Mail className="w-4 h-4 shrink-0 text-violet-600"/><span className="break-all">{item.email||"Chưa có email"}</span></div><div className="flex gap-2"><Globe2 className="w-4 h-4 shrink-0 text-sky-600"/><span className="break-all">{item.website||"Chưa có website"}</span></div><div className="flex gap-2"><Hash className="w-4 h-4 shrink-0 text-amber-600"/><span>{item.taxCode||"Chưa xác minh MST"}</span></div></div></div>
        <div className="flex flex-wrap gap-2">{duplicate&&<span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">Có thể trùng hồ sơ khác</span>}{missing&&<span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">Thiếu thông tin cần bổ sung</span>}{item.matchedPartnerId&&<span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3"/>Đã liên kết đối tác</span>}</div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{borderColor:"var(--border)"}}><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5"/>Kiểm tra nguồn</a><div className="flex flex-wrap gap-2">{item.status==="PENDING"&&<><button type="button" disabled={updatingId===item.id} onClick={()=>void updateStatus(item,"REJECTED")} className="btn-secondary inline-flex items-center gap-1 text-xs"><Trash2 className="w-3.5 h-3.5 text-rose-600"/>Loại</button><button type="button" disabled={updatingId===item.id||duplicate} title={duplicate?"Kiểm tra và xử lý hồ sơ trùng trước khi duyệt":""} onClick={()=>void updateStatus(item,"APPROVED")} className="btn-primary inline-flex items-center gap-1 text-xs"><Check className="w-3.5 h-3.5"/>{updatingId===item.id?"Đang lưu...":"Duyệt vào danh mục"}</button></>}{item.status==="REJECTED"&&<button type="button" disabled={updatingId===item.id} onClick={()=>void updateStatus(item,"PENDING")} className="btn-secondary inline-flex items-center gap-1 text-xs"><ArchiveRestore className="w-3.5 h-3.5"/>Khôi phục</button>}</div></div>
      </article>})}</div>}

    {!loading&&filtered.length>PAGE_SIZE&&<div className="card p-3 flex items-center justify-between gap-3"><button type="button" className="btn-secondary text-xs" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Trang trước</button><span className="text-xs">Trang {page}/{pageCount} · {filtered.length} công ty</span><button type="button" className="btn-secondary text-xs" disabled={page===pageCount} onClick={()=>setPage(value=>Math.min(pageCount,value+1))}>Trang sau</button></div>}
  </div>;
}
