import { NextRequest,NextResponse } from "next/server";
import { createClient,type SupabaseClient,type User } from "@supabase/supabase-js";
import { normalizeVietnamTaxCode } from "@/lib/vietqr-business";
import { reconcileRegistryEvidence,type RegistryEvidenceValue,type RegistryFieldName,type RegistryProvider } from "@/lib/registry-reconciliation";

export const runtime="nodejs";
const ALLOWED_ROLES=new Set(["admin","planner","warehouse","accountant"]);
const COMPARABLE_FIELDS:Set<string>=new Set(["TAX_CODE","LEGAL_NAME","REGISTERED_ADDRESS","TAXPAYER_STATUS"]);
const requests=new Map<string,{count:number;reset:number}>();

interface EvidenceRow {
  provider:string;field_name:string;field_value:string;normalized_value:string;source_url:string;captured_at:string;
}

async function verify(req:NextRequest):Promise<{client:SupabaseClient;user:User}|null>{
  const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!token||!url||!key)return null;
  const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const{data,error}=await client.auth.getUser(token);
  const role=String(data.user?.app_metadata?.role??"");
  return error||!data.user||!ALLOWED_ROLES.has(role)?null:{client,user:data.user};
}

function rateLimited(userId:string):boolean{
  const now=Date.now(),current=requests.get(userId);
  if(!current||current.reset<now){requests.set(userId,{count:1,reset:now+60_000});return false}
  current.count+=1;return current.count>10;
}

function validEvidence(row:EvidenceRow):row is EvidenceRow&{provider:RegistryProvider;field_name:RegistryFieldName}{
  return(row.provider==="VIETQR"||row.provider==="MASOTHUE")&&COMPARABLE_FIELDS.has(row.field_name);
}

export async function POST(req:NextRequest){
  try{
    const auth=await verify(req);if(!auth)return NextResponse.json({error:"Không có quyền"},{status:401});
    if(rateLimited(auth.user.id))return NextResponse.json({error:"Vượt giới hạn 10 lượt đối chiếu/phút"},{status:429});
    const body=await req.json() as{profileId?:unknown;taxCode?:unknown};
    const profileId=typeof body.profileId==="string"?body.profileId.trim():"";
    if(!profileId)return NextResponse.json({error:"Thiếu mã hồ sơ công ty"},{status:400});
    let taxCode="";try{taxCode=normalizeVietnamTaxCode(typeof body.taxCode==="string"?body.taxCode:"")}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Mã số thuế không hợp lệ"},{status:400})}
    const{data:profile,error:profileError}=await auth.client.from("production_company_profiles").select("id,tax_code").eq("organization_id","mimin").eq("id",profileId).single();
    if(profileError||!profile)return NextResponse.json({error:"Không tìm thấy hồ sơ công ty"},{status:404});
    let profileTaxCode="";try{profileTaxCode=profile.tax_code?normalizeVietnamTaxCode(String(profile.tax_code)):""}catch{return NextResponse.json({error:"Mã số thuế hiện có trong hồ sơ không hợp lệ"},{status:409})}
    if(profileTaxCode&&profileTaxCode!==taxCode)return NextResponse.json({error:"Mã số thuế không khớp hồ sơ"},{status:409});
    const{data,error}=await auth.client.from("production_company_field_evidence").select("provider,field_name,field_value,normalized_value,source_url,captured_at").eq("organization_id","mimin").eq("company_profile_id",profileId).eq("tax_code",taxCode).in("provider",["VIETQR","MASOTHUE"]).in("field_name",Array.from(COMPARABLE_FIELDS));
    if(error)throw new Error(error.message);
    const evidence=((data??[]) as EvidenceRow[]).filter(validEvidence).map((row):RegistryEvidenceValue=>({provider:row.provider,fieldName:row.field_name,fieldValue:row.field_value,normalizedValue:row.normalized_value,sourceUrl:row.source_url,capturedAt:row.captured_at}));
    const result=reconcileRegistryEvidence(evidence);
    const sourceSnapshot=Object.fromEntries(["VIETQR","MASOTHUE"].map(provider=>[provider,evidence.filter(item=>item.provider===provider).map(item=>({fieldName:item.fieldName,sourceUrl:item.sourceUrl,capturedAt:item.capturedAt}))]));
    const{data:snapshot,error:snapshotError}=await auth.client.from("production_company_registry_reconciliations").insert({organization_id:"mimin",company_profile_id:profileId,tax_code:taxCode,formula_version:result.formulaVersion,overall_status:result.overallStatus,match_score:result.matchScore,matched_fields:result.matchedFields,partial_fields:result.partialFields,conflict_fields:result.conflictFields,missing_fields:result.missingFields,field_results:result.fields,source_snapshot:sourceSnapshot,created_by:auth.user.id}).select("id,created_at").single();
    if(snapshotError)throw new Error(snapshotError.message);
    return NextResponse.json({id:snapshot.id,createdAt:snapshot.created_at,...result});
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không đối chiếu được hai nguồn"},{status:500})}
}
