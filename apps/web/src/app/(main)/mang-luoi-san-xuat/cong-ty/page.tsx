"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, ExternalLink, FileCheck2, Globe2, History, Images, Mail, MapPin, Phone, SearchCheck, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { loadCompanyProfile, type ProductionCompanyProfile, type ProductionCompanySource } from "@/lib/production-company-profile";

const TABS = ["Tổng quan", "Liên hệ", "Hình ảnh", "Giấy tờ", "Nguồn kiểm chứng", "Lịch sử"] as const;
type CompanyTab = typeof TABS[number];

function EmptyStage({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return <div className="rounded-xl border border-dashed p-10 text-center" style={{borderColor:"var(--border)"}}><div className="mx-auto w-12 h-12 rounded-xl bg-brand-500/10 text-brand-700 flex items-center justify-center">{icon}</div><h3 className="mt-3 font-bold">{title}</h3><p className="mt-1 text-sm opacity-60 max-w-xl mx-auto">{description}</p></div>;
}

function CompanyProfileContent() {
  const id = useSearchParams().get("id") ?? "";
  const [profile, setProfile] = useState<ProductionCompanyProfile | null>(null);
  const [sources, setSources] = useState<ProductionCompanySource[]>([]);
  const [activeTab, setActiveTab] = useState<CompanyTab>("Tổng quan");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!id) { setError("Thiếu mã hồ sơ công ty"); setLoading(false); return; }
    void loadCompanyProfile(id).then((result) => { if (active) { setProfile(result.profile); setSources(result.sources); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Không tải được hồ sơ công ty"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="card p-10 text-center opacity-60">Đang tải hồ sơ công ty...</div>;
  if (error || !profile) return <div className="card p-10 text-center"><h2 className="font-bold text-rose-700">Không mở được hồ sơ</h2><p className="mt-2 text-sm opacity-70">{error}</p><Link href="/mang-luoi-san-xuat/tim-kiem" className="btn-secondary inline-flex mt-4">Quay lại tìm kiếm</Link></div>;

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Hồ sơ doanh nghiệp" title={profile.legalName} subtitle="Hồ sơ nháp độc lập; chưa tự động ghi vào danh mục đối tác chính thức." icon={<Building2 className="w-5 h-5"/>} actions={<Link href="/mang-luoi-san-xuat/tim-kiem" className="btn-secondary inline-flex items-center gap-2"><ArrowLeft className="w-4 h-4"/>Quay lại</Link>}/>
    <div className="card p-4 flex flex-wrap items-center gap-2"><span className="text-xs rounded-full bg-amber-100 text-amber-700 px-3 py-1">{profile.profileStatus === "DRAFT" ? "Hồ sơ nháp" : profile.profileStatus}</span><span className="text-xs rounded-full bg-brand-500/10 text-brand-700 px-3 py-1">{profile.verificationStatus === "VERIFIED" ? "Đã xác minh" : profile.verificationStatus === "REVIEWED" ? "Đã xem xét" : "Mới tìm thấy"}</span><span className="text-xs opacity-60">Cập nhật {new Date(profile.updatedAt).toLocaleString("vi-VN")}</span></div>
    <div className="card p-2 flex gap-2 overflow-x-auto">{TABS.map((tab)=><button key={tab} type="button" onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab===tab?"bg-brand-500 text-white":"hover:bg-brand-500/10"}`}>{tab}</button>)}</div>
    <div className="card p-5">
      {activeTab==="Tổng quan"&&<div className="grid lg:grid-cols-3 gap-4"><div className="lg:col-span-2 space-y-4"><h2 className="font-bold text-lg">Thông tin doanh nghiệp</h2><div className="grid sm:grid-cols-2 gap-3 text-sm"><div className="rounded-xl border p-3" style={{borderColor:"var(--border)"}}><span className="text-xs opacity-60">Tên pháp lý</span><p className="font-semibold mt-1">{profile.legalName}</p></div><div className="rounded-xl border p-3" style={{borderColor:"var(--border)"}}><span className="text-xs opacity-60">Mã số thuế</span><p className="font-semibold mt-1">{profile.taxCode||"Chưa xác minh"}</p></div><div className="rounded-xl border p-3 sm:col-span-2" style={{borderColor:"var(--border)"}}><span className="text-xs opacity-60">Địa chỉ</span><p className="font-semibold mt-1">{profile.address||"Chưa có địa chỉ"}</p></div></div>{profile.capabilities.length>0&&<div><h3 className="text-sm font-semibold">Năng lực ghi nhận</h3><div className="mt-2 flex flex-wrap gap-2">{profile.capabilities.map((capability)=><span key={capability} className="text-xs rounded-full border px-3 py-1" style={{borderColor:"var(--border)"}}>{capability}</span>)}</div></div>}</div><div className="rounded-xl bg-brand-500/5 p-4"><ShieldCheck className="w-6 h-6 text-brand-700"/><h3 className="font-bold mt-2">Mức độ hồ sơ</h3><p className="text-sm mt-1 opacity-70">H1 mới tạo nền tảng và lưu nguồn chứng cứ. Hình ảnh, giấy tờ và OCR chưa được kích hoạt.</p><p className="text-xs mt-3 opacity-60">{sources.length} nguồn đã liên kết</p></div></div>}
      {activeTab==="Liên hệ"&&<div className="space-y-3 max-w-3xl"><h2 className="font-bold text-lg">Thông tin liên hệ</h2><div className="rounded-xl border p-4 flex gap-3" style={{borderColor:"var(--border)"}}><Phone className="w-5 h-5 text-emerald-600"/><div><div className="text-xs opacity-60">Điện thoại</div>{profile.phone?<a href={`tel:${profile.phone}`} className="font-semibold">{profile.phone}</a>:<p>Chưa có</p>}</div></div><div className="rounded-xl border p-4 flex gap-3" style={{borderColor:"var(--border)"}}><Mail className="w-5 h-5 text-violet-600"/><div><div className="text-xs opacity-60">Email</div>{profile.email?<a href={`mailto:${profile.email}`} className="font-semibold">{profile.email}</a>:<p>Chưa có</p>}</div></div><div className="rounded-xl border p-4 flex gap-3" style={{borderColor:"var(--border)"}}><Globe2 className="w-5 h-5 text-sky-600"/><div className="min-w-0"><div className="text-xs opacity-60">Website</div>{profile.website?<a href={profile.website.startsWith("http")?profile.website:`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 break-all">{profile.website}</a>:<p>Chưa có</p>}</div></div><div className="rounded-xl border p-4 flex gap-3" style={{borderColor:"var(--border)"}}><MapPin className="w-5 h-5 text-rose-600"/><div><div className="text-xs opacity-60">Khu vực</div><p className="font-semibold">{[profile.district,profile.province].filter(Boolean).join(", ")||"Chưa xác định"}</p></div></div></div>}
      {activeTab==="Hình ảnh"&&<EmptyStage icon={<Images className="w-6 h-6"/>} title="Chưa thu thập hình ảnh" description="Giai đoạn H2 sẽ tìm logo, mặt tiền, nhà xưởng, máy móc và sản phẩm; ảnh phải có nguồn và trạng thái xác minh."/>}
      {activeTab==="Giấy tờ"&&<EmptyStage icon={<FileCheck2 className="w-6 h-6"/>} title="Chưa có giấy tờ doanh nghiệp" description="Giấy phép, chứng nhận và tài liệu pháp lý sẽ được lưu riêng tư và chỉ hiển thị sau khi có quyền truy cập phù hợp."/>}
      {activeTab==="Nguồn kiểm chứng"&&<div className="space-y-3"><h2 className="font-bold text-lg">Nguồn đã liên kết</h2>{sources.length===0?<EmptyStage icon={<SearchCheck className="w-6 h-6"/>} title="Chưa có nguồn" description="Hồ sơ này chưa có URL nguồn hợp lệ."/>:sources.map((source,index)=><a key={source.id} href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border p-4 flex items-start justify-between gap-3 hover:bg-brand-500/5" style={{borderColor:"var(--border)"}}><div className="min-w-0"><div className="text-xs text-brand-700">Nguồn {index+1} · {source.sourceProvider||source.sourceType}</div><div className="font-semibold truncate">{source.sourceTitle||source.sourceUrl}</div><div className="text-xs opacity-60 truncate">{source.sourceUrl}</div></div><ExternalLink className="w-4 h-4 shrink-0"/></a>)}</div>}
      {activeTab==="Lịch sử"&&<EmptyStage icon={<History className="w-6 h-6"/>} title="Chưa có lịch sử xác minh" description="Các hành động duyệt ảnh, giấy tờ và thay đổi hồ sơ sẽ được ghi nhận ở những giai đoạn tiếp theo."/>}
    </div>
  </div>;
}

export default function CompanyProfilePage() {
  return <Suspense fallback={<div className="card p-10 text-center opacity-60">Đang mở hồ sơ...</div>}><CompanyProfileContent/></Suspense>;
}
