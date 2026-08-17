import { NextRequest,NextResponse } from "next/server";
import { createClient,type SupabaseClient,type User } from "@supabase/supabase-js";
import { lookupVietQrBusiness,normalizeRegistryValue,normalizeVietnamTaxCode,type VietQrBusinessRecord,type VietQrLookupResult } from "@/lib/vietqr-business";

export const runtime="nodejs";
const ALLOWED_ROLES=new Set(["admin","planner","warehouse","accountant"]);
const requests=new Map<string,{count:number;reset:number}>();

interface RegistryCacheRow {
  tax_code:string;lookup_status:"SUCCESS"|"NOT_FOUND";response_code:string;legal_name:string;international_name:string;short_name:string;
  registered_address:string;taxpayer_status:string;source_url:string;raw_payload:Record<string,unknown>;payload_hash:string;fetched_at:string;expires_at:string;
}

function rateLimited(userId:string):boolean{
  const now=Date.now(),current=requests.get(userId);
  if(!current||current.reset<now){requests.set(userId,{count:1,reset:now+60_000});return false}
  current.count+=1;return current.count>10;
}

async function verify(req:NextRequest):Promise<{client:SupabaseClient;user:User;role:string}|null>{
  const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!token||!url||!key)return null;
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const{data,error}=await client.auth.getUser(token);const role=String(data.user?.app_metadata?.role??"");
  return error||!data.user||!ALLOWED_ROLES.has(role)?null:{client,user:data.user,role};
}

function recordFromCache(row:RegistryCacheRow):VietQrBusinessRecord|null{
  return row.lookup_status==="SUCCESS"?{taxCode:row.tax_code,legalName:row.legal_name,internationalName:row.international_name,shortName:row.short_name,registeredAddress:row.registered_address,taxpayerStatus:row.taxpayer_status}:null;
}

async function saveEvidence(client:SupabaseClient,userId:string,profileId:string,result:VietQrLookupResult):Promise<void>{
  const record=result.record;
  if(!record)return;
  const fields:Array<{field_name:string;field_value:string;confidence:number}>=[
    {field_name:"TAX_CODE",field_value:record.taxCode,confidence:100},
    {field_name:"LEGAL_NAME",field_value:record.legalName,confidence:90},
    {field_name:"INTERNATIONAL_NAME",field_value:record.internationalName,confidence:80},
    {field_name:"SHORT_NAME",field_value:record.shortName,confidence:80},
    {field_name:"REGISTERED_ADDRESS",field_value:record.registeredAddress,confidence:90},
    {field_name:"TAXPAYER_STATUS",field_value:record.taxpayerStatus,confidence:90},
  ].filter(field=>field.field_value);
  const rows=fields.map(field=>({organization_id:"mimin",company_profile_id:profileId,tax_code:record.taxCode,provider:"VIETQR",field_name:field.field_name,field_value:field.field_value,normalized_value:normalizeRegistryValue(field.field_value),source_url:result.sourceUrl,confidence:field.confidence,verification_status:"PARTIAL",captured_at:result.fetchedAt,created_by:userId,updated_by:userId}));
  const{error}=await client.from("production_company_field_evidence").upsert(rows,{onConflict:"company_profile_id,provider,field_name"});
  if(error)throw new Error(error.message);
}

export async function POST(req:NextRequest){
  try{
    const auth=await verify(req);if(!auth)return NextResponse.json({error:"Không có quyền"},{status:401});
    if(rateLimited(auth.user.id))return NextResponse.json({error:"Vượt giới hạn 10 lượt/phút"},{status:429});
    const body=await req.json() as{profileId?:unknown;taxCode?:unknown;force?:unknown};
    const profileId=typeof body.profileId==="string"?body.profileId.trim():"";
    const taxCode=normalizeVietnamTaxCode(typeof body.taxCode==="string"?body.taxCode:"");
    if(!profileId)return NextResponse.json({error:"Thiếu mã hồ sơ công ty"},{status:400});
    const{data:profile,error:profileError}=await auth.client.from("production_company_profiles").select("id,tax_code").eq("organization_id","mimin").eq("id",profileId).single();
    if(profileError||!profile)return NextResponse.json({error:"Không tìm thấy hồ sơ công ty"},{status:404});
    let profileTaxCode="";
    try{profileTaxCode=profile.tax_code?normalizeVietnamTaxCode(String(profile.tax_code)):""}catch{return NextResponse.json({error:"Mã số thuế hiện có trong hồ sơ không hợp lệ"},{status:409})}
    if(profileTaxCode&&profileTaxCode!==taxCode)return NextResponse.json({error:"Mã số thuế không khớp hồ sơ; không liên kết bằng chứng"},{status:409});
    const force=body.force===true&&auth.role==="admin";
    if(!force){
      const{data:cached,error:cacheError}=await auth.client.from("production_company_registry_cache").select("tax_code,lookup_status,response_code,legal_name,international_name,short_name,registered_address,taxpayer_status,source_url,raw_payload,payload_hash,fetched_at,expires_at").eq("organization_id","mimin").eq("provider","VIETQR").eq("tax_code",taxCode).in("lookup_status",["SUCCESS","NOT_FOUND"]).gt("expires_at",new Date().toISOString()).maybeSingle();
      if(cacheError)throw new Error(cacheError.message);
      if(cached){const row=cached as RegistryCacheRow;const cachedResult:VietQrLookupResult={status:row.lookup_status,responseCode:row.response_code,responseDescription:"",record:recordFromCache(row),rawPayload:row.raw_payload,payloadHash:row.payload_hash,sourceUrl:row.source_url,fetchedAt:row.fetched_at,expiresAt:row.expires_at};await saveEvidence(auth.client,auth.user.id,profileId,cachedResult);return NextResponse.json({provider:"VIETQR",cached:true,record:cachedResult.record,fetchedAt:cachedResult.fetchedAt,expiresAt:cachedResult.expiresAt},{status:cachedResult.record?200:404})}
    }
    const result=await lookupVietQrBusiness(taxCode);
    const cacheValues={organization_id:"mimin",provider:"VIETQR",tax_code:taxCode,lookup_status:result.status,response_code:result.responseCode,legal_name:result.record?.legalName??"",international_name:result.record?.internationalName??"",short_name:result.record?.shortName??"",registered_address:result.record?.registeredAddress??"",taxpayer_status:result.record?.taxpayerStatus??"",source_url:result.sourceUrl,raw_payload:result.rawPayload,payload_hash:result.payloadHash,fetched_at:result.fetchedAt,expires_at:result.expiresAt,created_by:auth.user.id,updated_by:auth.user.id};
    const{error:cacheError}=await auth.client.from("production_company_registry_cache").upsert(cacheValues,{onConflict:"organization_id,provider,tax_code"});if(cacheError)throw new Error(cacheError.message);
    await saveEvidence(auth.client,auth.user.id,profileId,result);
    return NextResponse.json({provider:"VIETQR",cached:false,record:result.record,fetchedAt:result.fetchedAt,expiresAt:result.expiresAt},{status:result.record?200:404});
  }catch(error){const timeout=error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError");return NextResponse.json({error:timeout?"VietQR quá thời gian phản hồi":error instanceof Error?error.message:"Không tra cứu được VietQR"},{status:timeout?504:502})}
}
