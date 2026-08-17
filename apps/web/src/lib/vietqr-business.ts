export interface VietQrBusinessRecord {
  taxCode:string;
  legalName:string;
  internationalName:string;
  shortName:string;
  registeredAddress:string;
  taxpayerStatus:string;
}

export interface VietQrLookupResult {
  status:"SUCCESS"|"NOT_FOUND";
  responseCode:string;
  responseDescription:string;
  record:VietQrBusinessRecord|null;
  rawPayload:Record<string,unknown>;
  payloadHash:string;
  sourceUrl:string;
  fetchedAt:string;
  expiresAt:string;
}

interface VietQrPayload {
  code?:unknown;
  desc?:unknown;
  data?:unknown;
  metadata?:unknown;
}

function text(value:unknown,max:number):string{
  return typeof value==="string"?value.normalize("NFKC").replace(/\s+/g," ").trim().slice(0,max):"";
}

export function normalizeVietnamTaxCode(value:string):string{
  const digits=value.replace(/\D/g,"");
  if(digits.length===10)return digits;
  if(digits.length===13)return `${digits.slice(0,10)}-${digits.slice(10)}`;
  throw new Error("Mã số thuế phải có 10 số hoặc 13 số đối với đơn vị phụ thuộc");
}

export function normalizeRegistryValue(value:string):string{
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/đ/g,"d").replace(/\b(tp\.?|thanh pho)\b/g," ").replace(/\b(q\.?|quan)\b/g," ").replace(/\b(p\.?|phuong)\b/g," ").replace(/[^a-z0-9]+/g," ").trim().slice(0,2000);
}

async function sha256(value:string):Promise<string>{
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(byte=>byte.toString(16).padStart(2,"0")).join("");
}

export async function lookupVietQrBusiness(taxCodeInput:string):Promise<VietQrLookupResult>{
  const taxCode=normalizeVietnamTaxCode(taxCodeInput);
  const sourceUrl=`https://api.vietqr.io/v2/business/${encodeURIComponent(taxCode.replace("-",""))}`;
  const response=await fetch(sourceUrl,{headers:{Accept:"application/json","User-Agent":"MIMIN-ERP-Registry/1.0"},signal:AbortSignal.timeout(8_000),cache:"no-store"});
  if(!response.ok)throw new Error(`VietQR tạm lỗi (HTTP ${response.status})`);
  const decoded=await response.json() as unknown;
  const parsed:VietQrPayload=decoded&&typeof decoded==="object"&&!Array.isArray(decoded)?decoded:{};
  const rawPayload=parsed as Record<string,unknown>;
  const responseCode=text(parsed.code,30);
  const responseDescription=text(parsed.desc,300);
  const fetchedAt=new Date();
  const rawData=parsed.data&&typeof parsed.data==="object"&&!Array.isArray(parsed.data)?parsed.data as Record<string,unknown>:null;
  const legalName=text(rawData?.name,300);
  const returnedTaxCode=rawData?normalizeVietnamTaxCode(text(rawData.id,30)||taxCode):taxCode;
  const status:VietQrLookupResult["status"]=responseCode==="00"&&rawData&&legalName?"SUCCESS":"NOT_FOUND";
  const record=status==="SUCCESS"?{taxCode:returnedTaxCode,legalName,internationalName:text(rawData?.internationalName,300),shortName:text(rawData?.shortName,200),registeredAddress:text(rawData?.address,1000),taxpayerStatus:text(rawData?.status,300)}:null;
  const expiresAt=new Date(fetchedAt.getTime()+(status==="SUCCESS"?7:1)*86_400_000);
  return{status,responseCode,responseDescription,record,rawPayload,payloadHash:await sha256(JSON.stringify(rawPayload)),sourceUrl,fetchedAt:fetchedAt.toISOString(),expiresAt:expiresAt.toISOString()};
}
