import { NextRequest,NextResponse } from "next/server";
import { createClient,type SupabaseClient,type User } from "@supabase/supabase-js";
import { lookupMaSoThueBusiness,type MaSoThueBusinessRecord,type MaSoThueLookupResult } from "@/lib/masothue-business";
import { normalizeRegistryValue,normalizeVietnamTaxCode } from "@/lib/vietqr-business";

export const runtime="nodejs";
const ALLOWED_ROLES=new Set(["admin","planner","warehouse","accountant"]);
const requests=new Map<string,{count:number;reset:number}>();

interface CacheRow {
  tax_code:string;lookup_status:"SUCCESS"|"NOT_FOUND";legal_name:string;registered_address:string;taxpayer_status:string;
  representative_name:string;phone:string;operation_date:string|null;managing_tax_authority:string;business_type:string;main_business_line:string;
  source_url:string;raw_payload:Record<string,unknown>;payload_hash:string;fetched_at:string;expires_at:string;source_updated_at:string|null;
}

function rateLimited(userId:string):boolean{
  const now=Date.now(),current=requests.get(userId);
  if(!current||current.reset<now){requests.set(userId,{count:1,reset:now+60_000});return false}
  current.count+=1;return current.count>5;
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

function recordFromCache(row:CacheRow):MaSoThueBusinessRecord|null{
  return row.lookup_status==="SUCCESS"?{taxCode:row.tax_code,legalName:row.legal_name,registeredAddress:row.registered_address,taxpayerStatus:row.taxpayer_status,representativeName:row.representative_name,phone:row.phone,operationDate:row.operation_date??"",managingTaxAuthority:row.managing_tax_authority,businessType:row.business_type,mainBusinessLine:row.main_business_line}:null;
}

async function saveEvidence(client:SupabaseClient,userId:string,profileId:string,result:MaSoThueLookupResult):Promise<void>{
  const record=result.record;if(!record)return;
  const fields:Array<{field_name:string;field_value:string;confidence:number}>=[
    {field_name:"TAX_CODE",field_value:record.taxCode,confidence:95},{field_name:"LEGAL_NAME",field_value:record.legalName,confidence:80},
    {field_name:"REGISTERED_ADDRESS",field_value:record.registeredAddress,confidence:75},{field_name:"TAXPAYER_STATUS",field_value:record.taxpayerStatus,confidence:70},
    {field_name:"REPRESENTATIVE_NAME",field_value:record.representativeName,confidence:75},{field_name:"PHONE",field_value:record.phone,confidence:65},
    {field_name:"OPERATION_DATE",field_value:record.operationDate,confidence:75},{field_name:"MANAGING_TAX_AUTHORITY",field_value:record.managingTaxAuthority,confidence:75},
    {field_name:"BUSINESS_TYPE",field_value:record.businessType,confidence:70},{field_name:"MAIN_BUSINESS_LINE",field_value:record.mainBusinessLine,confidence:70},
  ].filter(field=>field.field_value);
  const rows=fields.map(field=>({organization_id:"mimin",company_profile_id:profileId,tax_code:record.taxCode,provider:"MASOTHUE",field_name:field.field_name,field_value:field.field_value,normalized_value:normalizeRegistryValue(field.field_value),source_url:result.sourceUrl,confidence:field.confidence,verification_status:"UNVERIFIED",captured_at:result.fetchedAt,created_by:userId,updated_by:userId}));
  const{error}=await client.from("production_company_field_evidence").upsert(rows,{onConflict:"company_profile_id,provider,field_name"});
  if(error)throw new Error(error.message);
}

export async function POST(req:NextRequest){
  try{
    const auth=await verify(req);if(!auth)return NextResponse.json({error:"Không có quyền"},{status:401});
    if(rateLimited(auth.user.id))return NextResponse.json({error:"Vượt giới hạn 5 lượt/phút cho nguồn MaSoThue"},{status:429});
    const body=await req.json() as{profileId?:unknown;taxCode?:unknown;force?:unknown};
    const profileId=typeof body.profileId==="string"?body.profileId.trim():"";
    const taxCode=normalizeVietnamTaxCode(typeof body.taxCode==="string"?body.taxCode:"");
    if(!profileId)return NextResponse.json({error:"Thiếu mã hồ sơ công ty"},{status:400});
    const{data:profile,error:profileError}=await auth.client.from("production_company_profiles").select("id,tax_code").eq("organization_id","mimin").eq("id",profileId).single();
    if(profileError||!profile)return NextResponse.json({error:"Không tìm thấy hồ sơ công ty"},{status:404});
    let profileTaxCode="";try{profileTaxCode=profile.tax_code?normalizeVietnamTaxCode(String(profile.tax_code)):""}catch{return NextResponse.json({error:"Mã số thuế hiện có trong hồ sơ không hợp lệ"},{status:409})}
    if(profileTaxCode&&profileTaxCode!==taxCode)return NextResponse.json({error:"Mã số thuế không khớp hồ sơ; không liên kết bằng chứng"},{status:409});
    const force=body.force===true&&auth.role==="admin";
    if(!force){
      const columns="tax_code,lookup_status,legal_name,registered_address,taxpayer_status,representative_name,phone,operation_date,managing_tax_authority,business_type,main_business_line,source_url,raw_payload,payload_hash,fetched_at,expires_at,source_updated_at";
      const{data:cached,error}=await auth.client.from("production_company_registry_cache").select(columns).eq("organization_id","mimin").eq("provider","MASOTHUE").eq("tax_code",taxCode).in("lookup_status",["SUCCESS","NOT_FOUND"]).gt("expires_at",new Date().toISOString()).maybeSingle();
      if(error)throw new Error(error.message);
      if(cached){const row=cached as unknown as CacheRow;const result:MaSoThueLookupResult={status:row.lookup_status,record:recordFromCache(row),rawPayload:row.raw_payload,payloadHash:row.payload_hash,sourceUrl:row.source_url,fetchedAt:row.fetched_at,expiresAt:row.expires_at,sourceUpdatedAt:row.source_updated_at};await saveEvidence(auth.client,auth.user.id,profileId,result);return NextResponse.json({provider:"MASOTHUE",cached:true,record:result.record,sourceUrl:result.sourceUrl,fetchedAt:result.fetchedAt,expiresAt:result.expiresAt},{status:result.record?200:404})}
    }
    const result=await lookupMaSoThueBusiness(taxCode);
    const record=result.record;
    const values={organization_id:"mimin",provider:"MASOTHUE",tax_code:taxCode,lookup_status:result.status,response_code:result.status==="SUCCESS"?"00":"NOT_FOUND",legal_name:record?.legalName??"",international_name:"",short_name:"",registered_address:record?.registeredAddress??"",taxpayer_status:record?.taxpayerStatus??"",representative_name:record?.representativeName??"",phone:record?.phone??"",operation_date:record?.operationDate||null,managing_tax_authority:record?.managingTaxAuthority??"",business_type:record?.businessType??"",main_business_line:record?.mainBusinessLine??"",source_url:result.sourceUrl,raw_payload:result.rawPayload,payload_hash:result.payloadHash,fetched_at:result.fetchedAt,expires_at:result.expiresAt,source_updated_at:result.sourceUpdatedAt,created_by:auth.user.id,updated_by:auth.user.id};
    const{error}=await auth.client.from("production_company_registry_cache").upsert(values,{onConflict:"organization_id,provider,tax_code"});if(error)throw new Error(error.message);
    await saveEvidence(auth.client,auth.user.id,profileId,result);
    return NextResponse.json({provider:"MASOTHUE",cached:false,record:result.record,sourceUrl:result.sourceUrl,fetchedAt:result.fetchedAt,expiresAt:result.expiresAt},{status:result.record?200:404});
  }catch(error){const timeout=error instanceof Error&&(error.name==="TimeoutError"||error.name==="AbortError");return NextResponse.json({error:timeout?"MaSoThue quá thời gian phản hồi":error instanceof Error?error.message:"Không tra cứu được MaSoThue"},{status:timeout?504:502})}
}
