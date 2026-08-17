import { normalizeVietnamTaxCode } from "@/lib/vietqr-business";

export interface MaSoThueBusinessRecord {
  taxCode:string;
  legalName:string;
  registeredAddress:string;
  taxpayerStatus:string;
  representativeName:string;
  phone:string;
  operationDate:string;
  managingTaxAuthority:string;
  businessType:string;
  mainBusinessLine:string;
}

export interface MaSoThueLookupResult {
  status:"SUCCESS"|"NOT_FOUND";
  record:MaSoThueBusinessRecord|null;
  rawPayload:Record<string,unknown>;
  payloadHash:string;
  sourceUrl:string;
  fetchedAt:string;
  expiresAt:string;
  sourceUpdatedAt:string|null;
}

interface TavilyResult { title?:unknown;url?:unknown;content?:unknown }

function decodeHtml(value:string):string{
  const named:Record<string,string>={amp:"&",quot:'"',apos:"'",lt:"<",gt:">",nbsp:" "};
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi,(_,entity:string)=>{
    if(entity.startsWith("#x"))return String.fromCodePoint(Number.parseInt(entity.slice(2),16));
    if(entity.startsWith("#"))return String.fromCodePoint(Number.parseInt(entity.slice(1),10));
    return named[entity.toLowerCase()]??`&${entity};`;
  });
}

function cleanHtml(value:string,max=2000):string{
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]+>/g," ")).normalize("NFKC").replace(/\s+/g," ").trim().slice(0,max);
}

function rowsFromHtml(html:string):Map<string,string>{
  const rows=new Map<string,string>();
  for(const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=Array.from(match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)).map(cell=>cleanHtml(cell[1]));
    if(cells.length>=2&&cells[0]&&cells[1])rows.set(cells[0].toLocaleLowerCase("vi"),cells[1]);
  }
  return rows;
}

function row(rows:Map<string,string>,label:string):string{
  const normalized=label.toLocaleLowerCase("vi");
  return rows.get(normalized)??"";
}

function text(value:unknown,max:number):string{
  return typeof value==="string"?value.normalize("NFKC").replace(/\s+/g," ").trim().slice(0,max):"";
}

function canonicalMaSoThueUrl(value:string,taxCode:string):string{
  try{
    const url=new URL(value);
    const host=url.hostname.toLowerCase().replace(/^www\./,"");
    const firstPath=url.pathname.split("/").filter(Boolean)[0]??"";
    const pathTaxCode=firstPath.match(/^(\d{10}(?:-?\d{3})?)(?:-|$)/)?.[1]??"";
    return host==="masothue.com"&&pathTaxCode.replace(/\D/g,"")===taxCode.replace(/\D/g,"") ? `https://masothue.com/${firstPath}` : "";
  }catch{return ""}
}

async function discoverSourceUrl(taxCode:string):Promise<string>{
  const key=process.env.TAVILY_API_KEY?.trim();
  if(!key)throw new Error("Chưa cấu hình TAVILY_API_KEY để tìm trang MaSoThue chính xác");
  const response=await fetch("https://api.tavily.com/search",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({api_key:key,query:`"${taxCode}" site:masothue.com`,search_depth:"basic",max_results:5,include_answer:false}),
    signal:AbortSignal.timeout(12_000),cache:"no-store",
  });
  if(!response.ok)throw new Error(`Nguồn tìm kiếm MaSoThue tạm lỗi (HTTP ${response.status})`);
  const decoded=await response.json() as unknown;
  const results=decoded&&typeof decoded==="object"&&!Array.isArray(decoded)&&(decoded as{results?:unknown}).results;
  if(!Array.isArray(results))return "";
  for(const item of results as TavilyResult[]){
    const url=canonicalMaSoThueUrl(text(item.url,2000),taxCode);
    if(url&&(text(item.title,500).includes(taxCode)||text(item.content,2000).includes(taxCode)))return url;
  }
  return "";
}

async function sha256(value:string):Promise<string>{
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function lookupMaSoThueBusiness(taxCodeInput:string):Promise<MaSoThueLookupResult>{
  const taxCode=normalizeVietnamTaxCode(taxCodeInput);
  const lookupTaxCode=taxCode.replace("-","");
  const discoveredUrl=await discoverSourceUrl(lookupTaxCode);
  const fetchedAt=new Date();
  if(!discoveredUrl){
    const rawPayload={reason:"SOURCE_NOT_FOUND",taxCode};
    return{status:"NOT_FOUND",record:null,rawPayload,payloadHash:await sha256(JSON.stringify(rawPayload)),sourceUrl:`https://masothue.com/Search/?q=${encodeURIComponent(lookupTaxCode)}&type=auto`,fetchedAt:fetchedAt.toISOString(),expiresAt:new Date(fetchedAt.getTime()+86_400_000).toISOString(),sourceUpdatedAt:null};
  }
  const response=await fetch(discoveredUrl,{headers:{Accept:"text/html,application/xhtml+xml","User-Agent":"MIMIN-ERP-Registry/1.0 (+https://mimin.vn)"},signal:AbortSignal.timeout(10_000),cache:"no-store",redirect:"follow"});
  if(!response.ok)throw new Error(`MaSoThue tạm lỗi (HTTP ${response.status})`);
  const finalUrl=canonicalMaSoThueUrl(response.url,lookupTaxCode);
  if(!finalUrl)throw new Error("MaSoThue chuyển hướng sang hồ sơ không khớp mã số thuế");
  const declaredLength=Number(response.headers.get("content-length")??0);
  if(declaredLength>1_500_000)throw new Error("Trang MaSoThue vượt giới hạn xử lý an toàn");
  const html=await response.text();
  if(html.length>1_500_000)throw new Error("Trang MaSoThue vượt giới hạn xử lý an toàn");
  const title=cleanHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??"",500);
  const titleMatch=title.match(/^(\d{10}(?:-\d{3})?)\s*-\s*(.+?)\s*-\s*MaSoThue$/i);
  if(!titleMatch||normalizeVietnamTaxCode(titleMatch[1])!==taxCode)throw new Error("Nội dung MaSoThue không khớp mã số thuế yêu cầu");
  const rows=rowsFromHtml(html);
  const sourceUpdatedMatch=cleanHtml(html,1_500_000).match(/lần cuối vào\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})/i);
  const sourceUpdatedAt=sourceUpdatedMatch?new Date(`${sourceUpdatedMatch[1].replace(" ","T")}+07:00`).toISOString():null;
  const record:MaSoThueBusinessRecord={
    taxCode,legalName:titleMatch[2].trim().slice(0,300),
    registeredAddress:(row(rows,"Địa chỉ")||row(rows,"Địa chỉ Thuế")).slice(0,1000),
    taxpayerStatus:row(rows,"Tình trạng").slice(0,300),
    representativeName:row(rows,"Người đại diện").slice(0,300),
    phone:row(rows,"Điện thoại").replace(/[^\d+().\s-]/g,"").trim().slice(0,50),
    operationDate:row(rows,"Ngày hoạt động").match(/^\d{4}-\d{2}-\d{2}$/)?.[0]??"",
    managingTaxAuthority:row(rows,"Quản lý bởi").slice(0,300),
    businessType:row(rows,"Loại hình DN").slice(0,300),
    mainBusinessLine:row(rows,"Ngành nghề chính").slice(0,500),
  };
  const rawPayload={...record,sourceUpdatedAt};
  return{status:"SUCCESS",record,rawPayload,payloadHash:await sha256(JSON.stringify(rawPayload)),sourceUrl:finalUrl,fetchedAt:fetchedAt.toISOString(),expiresAt:new Date(fetchedAt.getTime()+3*86_400_000).toISOString(),sourceUpdatedAt};
}
