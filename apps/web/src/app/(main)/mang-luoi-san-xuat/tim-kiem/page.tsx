"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { PARTNER_ROLES, ROLE_LABELS, type ProductionPartnerRole } from "@/lib/production-network";
import { approveDiscoveryCandidate, discoverOpenStreetMap, loadDiscoveryCandidates, setDiscoveryStatus, type DiscoveryCandidate } from "@/lib/production-discovery";

export default function TimKiemDoiTacPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState<ProductionPartnerRole>("MATERIAL_SUPPLIER");
  const [items, setItems] = useState<DiscoveryCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const refresh = useCallback(async () => { try { setItems(await loadDiscoveryCandidates()); } catch { toast.error("Không tải được ứng viên"); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const search = async () => {
    if (!query.trim() || !location.trim()) return toast.error("Nhập nội dung và khu vực cần tìm");
    setLoading(true);
    try { setItems(await discoverOpenStreetMap(query.trim(), location.trim(), role)); toast.success("Đã lưu kết quả vào vùng chờ duyệt"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Tìm kiếm thất bại"); }
    finally { setLoading(false); }
  };
  const review = async (id: string, status: "APPROVED" | "REJECTED") => {
    try { if (status === "APPROVED") await approveDiscoveryCandidate(id); else await setDiscoveryStatus(id, status); await refresh(); toast.success(status === "APPROVED" ? "Đã duyệt vào danh mục đối tác" : "Đã loại ứng viên"); }
    catch { toast.error("Không cập nhật được trạng thái"); }
  };

  return <div className="space-y-5 animate-fade-in">
    <PageHeader moduleLabel="MIMIN ERP — Mạng lưới sản xuất" title="Tìm kiếm ứng viên tự động"
      subtitle="Kết quả từ nguồn mở được lưu vào vùng chờ; chưa tự động ghi vào danh mục đối tác chính thức."
      icon={<Search className="w-5 h-5" />} />
    <div className="card p-5 grid grid-cols-1 md:grid-cols-4 gap-3">
      <label className="text-xs font-medium">Danh mục<select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as ProductionPartnerRole)}>{PARTNER_ROLES.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}</select></label>
      <label className="text-xs font-medium">Cần tìm<input className="input mt-1" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="VD: xưởng dệt, vải cotton" /></label>
      <label className="text-xs font-medium">Khu vực<input className="input mt-1" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="VD: Thủ Đức, TP.HCM" /></label>
      <div className="flex items-end"><button className="btn-primary w-full inline-flex justify-center gap-2" disabled={loading} onClick={() => void search()}><Search className="w-4 h-4" />{loading ? "Đang tìm..." : "Tìm tự động"}</button></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{items.map((item) => <article key={item.id} className="card p-5 space-y-3">
      <div className="flex justify-between gap-3"><div><div className="text-[10px] text-brand-700">{ROLE_LABELS[item.role]} · {item.sourceProvider}</div><h3 className="font-bold">{item.legalName}</h3></div><span className="text-xs">{item.status === "PENDING" ? "Chờ duyệt" : item.status === "APPROVED" ? "Phù hợp" : "Đã loại"}</span></div>
      <p className="text-sm flex gap-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5" />{item.address}</p>
      <div className="flex justify-between"><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-700 inline-flex gap-1">Kiểm tra nguồn <ExternalLink className="w-3 h-3" /></a>
      {item.status === "PENDING" && <div className="flex gap-2"><button onClick={() => void review(item.id,"REJECTED")} className="btn-secondary p-2" aria-label="Loại"><X className="w-4 h-4" /></button><button onClick={() => void review(item.id,"APPROVED")} className="btn-primary p-2" aria-label="Đánh dấu phù hợp"><Check className="w-4 h-4" /></button></div>}</div>
    </article>)}</div>
    {!loading && items.length === 0 && <div className="card p-10 text-center opacity-60">Chưa có ứng viên. Nhập nhu cầu để bắt đầu tìm kiếm.</div>}
  </div>;
}
