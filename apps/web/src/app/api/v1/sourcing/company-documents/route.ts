import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
const BUCKET = "production-company-documents";
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_ROLES = new Set(["admin","planner","accountant"]);
const TYPES = new Set(["BUSINESS_LICENSE","TAX_REGISTRATION","BRAND_LICENSE","CERTIFICATE","FACTORY_LICENSE","OTHER"]);
const EXTENSIONS: Record<string,string> = { "application/pdf":"pdf","image/jpeg":"jpg","image/png":"png","image/webp":"webp" };

function validMagic(bytes: Uint8Array, mime: string): boolean {
  if (mime === "application/pdf") return String.fromCharCode(...bytes.slice(0,5)) === "%PDF-";
  if (mime === "image/jpeg") return bytes[0]===0xff && bytes[1]===0xd8;
  if (mime === "image/png") return bytes[0]===0x89 && bytes[1]===0x50 && bytes[2]===0x4e && bytes[3]===0x47;
  return String.fromCharCode(...bytes.slice(8,12)) === "WEBP";
}

export async function POST(req: NextRequest) {
  let uploadedPath = "";
  try {
    const token=req.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!token||!url||!publicKey||!secretKey) return NextResponse.json({error:"Thiếu cấu hình máy chủ"},{status:503});
    const userClient=createClient(url,publicKey,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const {data:authData,error:authError}=await userClient.auth.getUser(token);
    const user=authData.user;
    if(authError||!user||!ALLOWED_ROLES.has(String(user.app_metadata?.role??""))) return NextResponse.json({error:"Không có quyền"},{status:401});
    const form=await req.formData();
    const file=form.get("file"), profileId=String(form.get("profileId")??""), documentType=String(form.get("documentType")??""), title=String(form.get("title")??"").trim().slice(0,200);
    if(!(file instanceof File)||!profileId||!TYPES.has(documentType)||!title) return NextResponse.json({error:"Thông tin giấy tờ chưa hợp lệ"},{status:400});
    if(file.size<1||file.size>MAX_BYTES||!EXTENSIONS[file.type]) return NextResponse.json({error:"Tệp phải là PDF/JPEG/PNG/WebP và không quá 15 MB"},{status:400});
    const bytes=new Uint8Array(await file.arrayBuffer());
    if(!validMagic(bytes,file.type)) return NextResponse.json({error:"Nội dung tệp không đúng định dạng"},{status:400});
    const {data:profile,error:profileError}=await userClient.from("production_company_profiles").select("id").eq("organization_id","mimin").eq("id",profileId).single();
    if(profileError||!profile) return NextResponse.json({error:"Không tìm thấy hồ sơ công ty"},{status:404});
    const documentId=crypto.randomUUID();
    uploadedPath=`mimin/${profileId}/${documentId}.${EXTENSIONS[file.type]}`;
    const admin=createClient(url,secretKey,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error:uploadError}=await admin.storage.from(BUCKET).upload(uploadedPath,bytes,{contentType:file.type,upsert:false,cacheControl:"3600"});
    if(uploadError) throw new Error(uploadError.message);
    const value=(name:string,max:number)=>String(form.get(name)??"").trim().slice(0,max)||null;
    const {error:insertError}=await admin.from("production_company_documents").insert({id:documentId,organization_id:"mimin",company_profile_id:profileId,document_type:documentType,title,document_number:value("documentNumber",100),issuer:value("issuer",200),issued_on:value("issuedOn",10),expires_on:value("expiresOn",10),notes:value("notes",1000),original_filename:file.name.slice(0,255),storage_path:uploadedPath,mime_type:file.type,file_bytes:file.size,uploaded_by:user.id});
    if(insertError){await admin.storage.from(BUCKET).remove([uploadedPath]);uploadedPath="";throw new Error(insertError.message);}
    return NextResponse.json({id:documentId});
  } catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Không tải được giấy tờ"},{status:502});}
}
