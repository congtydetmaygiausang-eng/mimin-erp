"use client";

// @codex Q3: màn hình quản lý riêng cho vùng chờ production_discovery_candidates.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ArchiveRestore, BadgeCheck, Building2, Check, Download, ExternalLink, FileSpreadsheet, Filter, Globe2, Hash, Mail, MapPin, Phone, RefreshCw, Scale, Search, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, normalizeSearchValue, type ProductionPartnerRole } from "@/lib/production-network";
import { approveDiscoveryCandidate, importExcelCandidates, loadDiscoveryCandidates, setDiscoveryStatus, type DiscoveryCandidate, type DiscoveryStatus, type ExcelCandidateInput } from "@/lib/production-discovery";
import { RECONCILIATION_STYLES, type LegalLookupResponse } from "@/components/sourcing/SupplierResultCard";
import { supabase } from "@/lib/supabase/client";

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

// Nhập Excel: mẫu cột cố định (tránh đoán sai tên cột khi không có ai xác nhận trực
// tiếp) - vẫn dò thêm vài biến thể tên cột thường gặp để không quá cứng nhắc.
const EXCEL_TEMPLATE_HEADERS = ["Tên công ty", "Địa chỉ", "Điện thoại", "Email", "Mã số thuế", "Website"];
const HEADER_PATTERNS: Record<keyof ExcelCandidateInput, RegExp> = {
  legalName: /ten|tên|company|name/i,
  address: /dia\s*chi|địa\s*chỉ|address/i,
  phone: /dien\s*thoai|điện\s*thoại|s[dđ]t|phone/i,
  email: /email/i,
  taxCode: /ma\s*so\s*thue|mã\s*số\s*thuế|^mst$|tax/i,
  website: /website|web/i,
};

function downloadExcelTemplate(){
  const rows=[EXCEL_TEMPLATE_HEADERS,["Công ty TNHH Ví Dụ","123 Nguyễn Huệ, Q1, TP.HCM","0901234567","contact@vidu.vn","0301234567",""]];
  const csv=rows.map(r=>r.map(cell=>`"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob=new Blob([`﻿${csv}`],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download="mau-nhap-cong-ty.csv";a.click();
  URL.revokeObjectURL(url);
}

function matchColumn(headers:string[],field:keyof ExcelCandidateInput):number{
  // "Đ/đ" (chữ D gạch ngang) không tách rời qua NFD như dấu thanh/dấu phụ (nó là 1 chữ cái
  // riêng, không phải D + dấu) nên phải tự thay trước, nếu không "Địa chỉ"/"Điện thoại" sẽ
  // không khớp được pattern không dấu.
  return headers.findIndex(header=>HEADER_PATTERNS[field].test(header.replace(/đ/g,"d").replace(/Đ/g,"D").normalize("NFD").replace(/[̀-ͯ]/g,"")));
}

// Parse CSV có xử lý dấu ngoặc kép (ô địa chỉ thường chứa dấu phẩy bên trong "..." -
// tách bằng String.split(",") đơn giản sẽ cắt sai cột từ đây trở đi).
function parseCsvLines(text:string):string[][]{
  const lines=text.replace(/\r/g,"").split("\n").filter(line=>line.trim());
  return lines.map(line=>{
    const cells:string[]=[];
    let current="";
    let inQuotes=false;
    for(let i=0;i<line.length;i+=1){
      const char=line[i];
      if(char==='"'){
        if(inQuotes&&line[i+1]==='"'){current+='"';i+=1}
        else inQuotes=!inQuotes;
      }else if(char===","&&!inQuotes){cells.push(current);current=""}
      else current+=char;
    }
    cells.push(current);
    return cells;
  });
}

async function parseExcelFile(file:File):Promise<ExcelCandidateInput[]>{
  const isCsv=file.name.toLowerCase().endsWith(".csv");
  const rows:string[][]=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(new Error("Không đọc được file"));
    reader.onload=(event)=>{
      try{
        if(isCsv){
          resolve(parseCsvLines(String(event.target?.result??"")));
        }else{
          const workbook=XLSX.read(event.target?.result,{type:"array"});
          const sheet=workbook.Sheets[workbook.SheetNames[0]];
          resolve(XLSX.utils.sheet_to_json(sheet,{header:1,defval:""}) as string[][]);
        }
      }catch(error){reject(error instanceof Error?error:new Error("Không đọc được file"))}
    };
    if(isCsv)reader.readAsText(file,"utf-8");else reader.readAsArrayBuffer(file);
  });
  const header=(rows[0]??[]).map(value=>String(value??""));
  const columns:Record<keyof ExcelCandidateInput,number>={
    legalName:matchColumn(header,"legalName"),address:matchColumn(header,"address"),phone:matchColumn(header,"phone"),
    email:matchColumn(header,"email"),taxCode:matchColumn(header,"taxCode"),website:matchColumn(header,"website"),
  };
  return rows.slice(1).filter(row=>Array.isArray(row)&&row.some(cell=>String(cell??"").trim())).map(row=>({
    legalName:columns.legalName>=0?String(row[columns.legalName]??"").trim():"",
    address:columns.address>=0?String(row[columns.address]??"").trim():"",
    phone:columns.phone>=0?String(row[columns.phone]??"").trim():"",
    email:columns.email>=0?String(row[columns.email]??"").trim():"",
    taxCode:columns.taxCode>=0?String(row[columns.taxCode]??"").trim():"",
    website:columns.website>=0?String(row[columns.website]??"").trim():"",
  }));
}

const MAX_BULK_LOOKUP_PER_RUN=30;
const BULK_LOOKUP_INTERVAL_MS=13_000; // Dưới hạn 5 lượt/phút của MaSoThue (nút chặn chính)

function statusLabel(status:DiscoveryStatus):string{
  if(status==="PENDING")return "Chờ duyệt";
  if(status==="APPROVED")return "Đã vào danh mục chính thức";
  return "Đã loại";
}

export default function DanhBaDoiTacPage(){
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

  // Nhập Excel: chọn 1 vai trò áp dụng cho cả file (bảng không có cột "vai trò" trong
  // mẫu để tránh người dùng gõ sai chuỗi enum) - xem trước rồi mới xác nhận nhập.
  const[showImport,setShowImport]=useState(false);
  const[importRole,setImportRole]=useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");
  const[importPreview,setImportPreview]=useState<ExcelCandidateInput[]>([]);
  const[importFileName,setImportFileName]=useState("");
  const[parsingFile,setParsingFile]=useState(false);
  const[importingExcel,setImportingExcel]=useState(false);

  const handleExcelFile=async(file:File)=>{
    setParsingFile(true);
    setImportFileName(file.name);
    try{
      const rows=await parseExcelFile(file);
      if(rows.length===0)throw new Error("Không đọc được dòng dữ liệu nào - kiểm tra lại tên cột có khớp file mẫu không");
      setImportPreview(rows.slice(0,200));
    }catch(error){
      toast.error(error instanceof Error?error.message:"Không đọc được file");
      setImportPreview([]);
    }finally{setParsingFile(false)}
  };

  const confirmImportExcel=async()=>{
    setImportingExcel(true);
    try{
      const count=await importExcelCandidates(importPreview,importRole,importFileName);
      toast.success(`Đã nhập ${count} công ty vào vùng chờ duyệt`);
      setShowImport(false);setImportPreview([]);setImportFileName("");
      await refresh();
    }catch(error){toast.error(error instanceof Error?error.message:"Không nhập được danh sách")}
    finally{setImportingExcel(false)}
  };

  // Tra cứu pháp lý hàng loạt: chạy trên danh sách đang lọc (PENDING + có MST), thong thả
  // theo BULK_LOOKUP_INTERVAL_MS để không vượt hạn mức 5 lượt/phút của MaSoThue - có thể
  // hủy giữa chừng (bulkLookupCancelRef), kết quả cache theo tax_code nên chạy lại không
  // tốn thêm lượt cho các mã đã tra trong ~1-7 ngày qua.
  const[bulkLookupRunning,setBulkLookupRunning]=useState(false);
  const[bulkLookupDone,setBulkLookupDone]=useState(0);
  const[bulkLookupTotal,setBulkLookupTotal]=useState(0);
  const[legalVerdicts,setLegalVerdicts]=useState<Map<string,LegalLookupResponse|{error:string}>>(new Map());
  const bulkLookupCancelRef=useRef(false);

  const lookupTargets=useMemo(()=>filtered.filter(item=>item.status==="PENDING"&&item.taxCode).slice(0,MAX_BULK_LOOKUP_PER_RUN),[filtered]);

  const runBulkLegalLookup=async()=>{
    if(lookupTargets.length===0){toast.error("Không có công ty nào ở trạng thái Chờ duyệt có sẵn mã số thuế");return}
    setBulkLookupRunning(true);bulkLookupCancelRef.current=false;
    setBulkLookupDone(0);setBulkLookupTotal(lookupTargets.length);
    try{
      const token=(await supabase?.auth.getSession())?.data.session?.access_token;
      if(!token)throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      for(let i=0;i<lookupTargets.length;i+=1){
        if(bulkLookupCancelRef.current)break;
        const target=lookupTargets[i];
        try{
          const response=await fetch("/api/v1/sourcing/company-registry/lookup",{
            method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},
            body:JSON.stringify({taxCode:target.taxCode}),
          });
          const data=await response.json() as LegalLookupResponse&{error?:string};
          setLegalVerdicts(current=>new Map(current).set(target.id,response.ok?data:{error:data.error??"Lỗi tra cứu"}));
        }catch(error){
          setLegalVerdicts(current=>new Map(current).set(target.id,{error:error instanceof Error?error.message:"Lỗi tra cứu"}));
        }
        setBulkLookupDone(i+1);
        if(i<lookupTargets.length-1&&!bulkLookupCancelRef.current)await new Promise(resolve=>setTimeout(resolve,BULK_LOOKUP_INTERVAL_MS));
      }
      toast.success(bulkLookupCancelRef.current?"Đã dừng tra cứu":"Đã tra cứu xong đợt này");
    }finally{setBulkLookupRunning(false)}
  };

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Danh bạ đối tác" subtitle="Quản lý vùng chờ Supabase; chỉ hồ sơ được duyệt mới đi vào danh mục đối tác chính thức." icon={<Building2 className="w-5 h-5"/>} actions={<div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setShowImport(current=>!current)} className="btn-secondary inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4"/>Nhập Excel</button><Link href="/mang-luoi-san-xuat/tim-doi-tac" className="btn-secondary inline-flex items-center gap-2"><Search className="w-4 h-4"/>Tìm đối tác</Link><button type="button" onClick={()=>void refresh()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Làm mới</button></div>}/>

    {showImport&&<div className="card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3"><h2 className="font-bold inline-flex items-center gap-2"><FileSpreadsheet className="w-4 h-4 text-emerald-600"/>Nhập danh sách công ty từ Excel/CSV</h2><button type="button" onClick={()=>{setShowImport(false);setImportPreview([]);setImportFileName("")}} className="opacity-60 hover:opacity-100"><X className="w-4 h-4"/></button></div>
      <p className="text-xs opacity-70">File cần có các cột: {EXCEL_TEMPLATE_HEADERS.join(", ")}. Công ty sẽ vào vùng chờ duyệt (tab Chờ duyệt) giống như khi tìm bằng AI.</p>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={downloadExcelTemplate} className="btn-secondary inline-flex items-center gap-2 text-xs"><Download className="w-3.5 h-3.5"/>Tải file mẫu</button>
        <label className="btn-secondary inline-flex items-center gap-2 text-xs cursor-pointer">
          <Upload className="w-3.5 h-3.5"/>{parsingFile?"Đang đọc...":"Chọn file"}
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={parsingFile} onChange={event=>{const file=event.target.files?.[0];if(file)void handleExcelFile(file);event.target.value=""}}/>
        </label>
        {importFileName&&<span className="text-xs opacity-60">{importFileName}</span>}
        <label className="ml-auto text-xs font-medium inline-flex items-center gap-2">Áp dụng vai trò:
          <select className="input text-xs" value={importRole} onChange={event=>setImportRole(event.target.value as ProductionPartnerRole)}>{PARTNER_ROLES.map(item=><option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select>
        </label>
      </div>
      {importPreview.length>0&&<div className="space-y-2">
        <div className="max-h-64 overflow-auto rounded-lg border text-xs" style={{borderColor:"var(--border)"}}>
          <table className="w-full"><thead className="sticky top-0 bg-slate-50 dark:bg-white/5"><tr>{EXCEL_TEMPLATE_HEADERS.map(header=><th key={header} className="px-2 py-1.5 text-left font-semibold whitespace-nowrap">{header}</th>)}</tr></thead>
          <tbody>{importPreview.slice(0,50).map((row,index)=><tr key={index} className="border-t" style={{borderColor:"var(--border)"}}><td className="px-2 py-1 whitespace-nowrap">{row.legalName||<span className="text-rose-600">(thiếu tên)</span>}</td><td className="px-2 py-1 max-w-[220px] truncate">{row.address}</td><td className="px-2 py-1 whitespace-nowrap">{row.phone}</td><td className="px-2 py-1 whitespace-nowrap">{row.email}</td><td className="px-2 py-1 whitespace-nowrap">{row.taxCode}</td><td className="px-2 py-1 whitespace-nowrap">{row.website}</td></tr>)}</tbody></table>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs opacity-70">{importPreview.length} dòng đọc được{importPreview.length>50?" (xem trước 50 dòng đầu)":""} · {importPreview.filter(row=>row.legalName.trim()).length} dòng có tên hợp lệ</span>
          <button type="button" disabled={importingExcel} onClick={()=>void confirmImportExcel()} className="btn-primary inline-flex items-center gap-2 text-xs"><Upload className="w-3.5 h-3.5"/>{importingExcel?"Đang nhập...":`Nhập ${importPreview.filter(row=>row.legalName.trim()).length} công ty`}</button>
        </div>
      </div>}
    </div>}

    <div className="card p-4 space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">{TAB_LABELS.map(item=><button key={item.value} type="button" onClick={()=>setTab(item.value)} className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold transition ${tab===item.value?"border-brand-500 bg-brand-500 text-white":"hover:bg-brand-500/5"}`}><span>{item.label}</span><span className={`ml-2 rounded-full px-1.5 py-0.5 ${tab===item.value?"bg-white/20":"bg-slate-100 dark:bg-white/10"}`}>{counts[item.value]}</span></button>)}</div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]"><label className="relative"><Search className="absolute left-3 top-3 w-4 h-4 opacity-50"/><input className="input pl-9" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Tìm tên, mã số thuế, điện thoại, email, website, địa chỉ..."/></label><label className="relative"><Filter className="absolute left-3 top-3 w-4 h-4 opacity-50"/><select className="input pl-9" value={role} onChange={event=>setRole(event.target.value as ProductionPartnerRole|"ALL")}><option value="ALL">Tất cả danh mục</option>{PARTNER_ROLES.map(item=><option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label></div>
      <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs text-sky-900 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-100"><b>Luồng dữ liệu:</b> Lưu từ tìm kiếm → Chờ duyệt tại trang này → Duyệt → Danh mục đối tác chính thức. Hồ sơ bị loại vẫn được giữ để tránh tìm và lưu lại kết quả không phù hợp.</div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5" style={{borderColor:"var(--border)"}}>
        <Scale className="w-4 h-4 text-brand-700 shrink-0"/>
        <span className="text-xs">{bulkLookupRunning?`Đang tra cứu pháp lý ${bulkLookupDone}/${bulkLookupTotal}...`:`${lookupTargets.length} công ty đang chờ duyệt có sẵn MST để tra cứu (tối đa ${MAX_BULK_LOOKUP_PER_RUN}/lượt).`}</span>
        <div className="ml-auto flex gap-2">
          {bulkLookupRunning?<button type="button" onClick={()=>{bulkLookupCancelRef.current=true}} className="btn-secondary text-xs">Dừng</button>
          :<button type="button" disabled={lookupTargets.length===0} onClick={()=>void runBulkLegalLookup()} className="btn-primary inline-flex items-center gap-2 text-xs disabled:opacity-50"><Scale className="w-3.5 h-3.5"/>Bắt đầu tra cứu pháp lý</button>}
        </div>
      </div>
    </div>

    {loading?<div className="card p-10 text-center opacity-60">Đang tải công ty đã lưu...</div>:visible.length===0?<div className="card p-10 text-center"><Building2 className="mx-auto w-10 h-10 text-brand-700 opacity-50"/><h2 className="mt-3 font-bold">Không có công ty phù hợp bộ lọc</h2><p className="mt-1 text-sm opacity-60">Thử đổi trạng thái, danh mục hoặc từ khóa tìm kiếm.</p></div>:<div className="grid gap-4 lg:grid-cols-2">{visible.map(item=>{
      const duplicate=duplicateIds.has(item.id);
      const missing=isMissing(item);
      const verdict=legalVerdicts.get(item.id);
      return <article key={item.id} className="card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[11px] font-semibold text-brand-700">{ROLE_LABELS[item.role]} · {item.sourceProvider}</p><h2 className="mt-1 font-bold leading-snug">{item.legalName}</h2><p className="mt-1 text-[11px] opacity-55">Lưu lúc {new Date(item.discoveredAt).toLocaleString("vi-VN")}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status==="APPROVED"?"bg-emerald-100 text-emerald-700":item.status==="REJECTED"?"bg-rose-100 text-rose-700":"bg-amber-100 text-amber-700"}`}>{statusLabel(item.status)}</span></div>
        <div className="space-y-2 text-xs"><div className="flex gap-2"><MapPin className="w-4 h-4 shrink-0 text-rose-600"/><span className="break-words">{item.address||"Chưa có địa chỉ"}</span></div><div className="grid gap-2 sm:grid-cols-2"><div className="flex gap-2"><Phone className="w-4 h-4 shrink-0 text-emerald-600"/><span>{item.phone||"Chưa có điện thoại"}</span></div><div className="flex gap-2"><Mail className="w-4 h-4 shrink-0 text-violet-600"/><span className="break-all">{item.email||"Chưa có email"}</span></div><div className="flex gap-2"><Globe2 className="w-4 h-4 shrink-0 text-sky-600"/><span className="break-all">{item.website||"Chưa có website"}</span></div><div className="flex gap-2"><Hash className="w-4 h-4 shrink-0 text-amber-600"/><span>{item.taxCode||"Chưa xác minh MST"}</span></div></div></div>
        <div className="flex flex-wrap gap-2">{duplicate&&<span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">Có thể trùng hồ sơ khác</span>}{missing&&<span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] text-slate-700">Thiếu thông tin cần bổ sung</span>}{item.matchedPartnerId&&<span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 inline-flex items-center gap-1"><BadgeCheck className="w-3 h-3"/>Đã liên kết đối tác</span>}</div>
        {verdict&&("error" in verdict?<p className="text-[11px] text-red-700 inline-flex items-center gap-1"><Scale className="w-3.5 h-3.5"/>Tra cứu lỗi: {verdict.error}</p>:<div className={`rounded-lg border px-3 py-2 text-[11px] ${verdict.reconciliation?RECONCILIATION_STYLES[verdict.reconciliation.overallStatus].className:"border-slate-300 bg-slate-50 text-slate-700"}`}><span className="font-semibold inline-flex items-center gap-1"><Scale className="w-3.5 h-3.5"/>{verdict.reconciliation?`${RECONCILIATION_STYLES[verdict.reconciliation.overallStatus].label} · ${verdict.reconciliation.matchScore}/100`:"Chưa đủ dữ liệu đối chiếu"}</span>{verdict.vietQr.status==="SUCCESS"&&<span className="block mt-0.5 opacity-80">VietQR: {verdict.vietQr.record?.legalName}</span>}</div>)}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3" style={{borderColor:"var(--border)"}}><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5"/>Kiểm tra nguồn</a><div className="flex flex-wrap gap-2">{item.status==="PENDING"&&<><button type="button" disabled={updatingId===item.id} onClick={()=>void updateStatus(item,"REJECTED")} className="btn-secondary inline-flex items-center gap-1 text-xs"><Trash2 className="w-3.5 h-3.5 text-rose-600"/>Loại</button><button type="button" disabled={updatingId===item.id||duplicate} title={duplicate?"Kiểm tra và xử lý hồ sơ trùng trước khi duyệt":""} onClick={()=>void updateStatus(item,"APPROVED")} className="btn-primary inline-flex items-center gap-1 text-xs"><Check className="w-3.5 h-3.5"/>{updatingId===item.id?"Đang lưu...":"Duyệt vào danh mục"}</button></>}{item.status==="REJECTED"&&<button type="button" disabled={updatingId===item.id} onClick={()=>void updateStatus(item,"PENDING")} className="btn-secondary inline-flex items-center gap-1 text-xs"><ArchiveRestore className="w-3.5 h-3.5"/>Khôi phục</button>}</div></div>
      </article>})}</div>}

    {!loading&&filtered.length>PAGE_SIZE&&<div className="card p-3 flex items-center justify-between gap-3"><button type="button" className="btn-secondary text-xs" disabled={page===1} onClick={()=>setPage(value=>Math.max(1,value-1))}>Trang trước</button><span className="text-xs">Trang {page}/{pageCount} · {filtered.length} công ty</span><button type="button" className="btn-secondary text-xs" disabled={page===pageCount} onClick={()=>setPage(value=>Math.min(pageCount,value+1))}>Trang sau</button></div>}
  </div>;
}
