"use client";

// @codex Giai đoạn 2 - hồ sơ năng lực và tìm kiếm đối tác theo bán kính.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Boxes,
  Building2,
  CheckCircle2,
  Edit2,
  Factory,
  Mail,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { canCreate, canDelete, canEdit } from "@/lib/permissions";
import {
  PARTNER_ROLES,
  ROLE_LABELS,
  calculateDistanceKm,
  calculatePartnerScore,
  createPartnerCode,
  deleteProductionPartner,
  loadProductionPartners,
  normalizeSearchValue,
  saveProductionPartner,
  type PartnerStatus,
  type ProductionPartner,
  type ProductionPartnerInput,
  type ProductionPartnerRole,
  type VerificationStatus,
} from "@/lib/production-network";
import { MANG_LUOI_DANH_MUC } from "@/lib/data/mang-luoi-danh-muc";
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown";
import { AiDiscoveryTab } from "@/components/sourcing/AiDiscoveryTab";

const CATEGORY_META: Record<ProductionPartnerRole, {
  icon: typeof Users;
  description: string;
  iconClass: string;
  cardClass: string;
}> = {
  CUSTOMER: {
    icon: Users,
    description: "Khách hàng và đầu ra sản xuất",
    iconClass: "text-emerald-700",
    cardClass: "from-emerald-50 to-teal-50 border-emerald-200",
  },
  SATELLITE_PROCESSOR: {
    icon: Factory,
    description: "Xưởng nhận công đoạn gia công",
    iconClass: "text-violet-700",
    cardClass: "from-violet-50 to-purple-50 border-violet-200",
  },
  MATERIAL_SUPPLIER: {
    icon: Boxes,
    description: "Vải, sợi, phụ liệu và vật tư",
    iconClass: "text-amber-700",
    cardClass: "from-amber-50 to-orange-50 border-amber-200",
  },
  PACKAGING_FINISHER: {
    icon: PackageCheck,
    description: "Ủi, gấp, nhãn, đóng túi và đóng thùng",
    iconClass: "text-sky-700",
    cardClass: "from-sky-50 to-cyan-50 border-sky-200",
  },
};

const FORM_FIELDS: FieldDef[] = [
  { name: "partnerCode", label: "Mã đối tác", type: "text", required: true, placeholder: "VD: VT-0001" },
  { name: "legalName", label: "Tên doanh nghiệp / đối tác", type: "text", required: true },
  {
    name: "roles",
    label: "Danh mục",
    type: "checkbox-group",
    required: true,
    options: PARTNER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
  },
  { name: "taxCode", label: "Mã số thuế", type: "text" },
  { name: "phone", label: "Số điện thoại", type: "text" },
  { name: "email", label: "Email", type: "email" },
  { name: "contactName", label: "Người liên hệ", type: "text" },
  { name: "website", label: "Website", type: "text", placeholder: "https://..." },
  { name: "address", label: "Địa chỉ", type: "textarea", rows: 2 },
  { name: "district", label: "Quận / huyện", type: "text" },
  { name: "province", label: "Tỉnh / thành", type: "text" },
  {
    name: "capabilities",
    label: "Năng lực / sản phẩm / dịch vụ",
    type: "textarea",
    rows: 2,
    placeholder: "Cách nhau bằng dấu phẩy, VD: vải cotton, nhuộm, may áo thun",
  },
  { name: "capacityPerMonth", label: "Công suất / tháng", type: "number", min: 0 },
  { name: "minimumOrderQuantity", label: "Đơn hàng tối thiểu", type: "number", min: 0 },
  { name: "leadTimeDays", label: "Thời gian đáp ứng (ngày)", type: "number", min: 0 },
  { name: "latitude", label: "Vĩ độ", type: "number", min: -90, max: 90, step: "any", placeholder: "VD: 10.8231" },
  { name: "longitude", label: "Kinh độ", type: "number", min: -180, max: 180, step: "any", placeholder: "VD: 106.6297" },
  { name: "serviceRadiusKm", label: "Bán kính phục vụ (km)", type: "number", min: 0 },
  { name: "qualityScore", label: "Điểm chất lượng (0-100)", type: "number", min: 0, max: 100 },
  { name: "reliabilityScore", label: "Điểm uy tín (0-100)", type: "number", min: 0, max: 100 },
  {
    name: "verificationStatus",
    label: "Trạng thái xác minh",
    type: "select",
    required: true,
    options: [
      { value: "DISCOVERED", label: "Mới tìm thấy" },
      { value: "REVIEWED", label: "Đã xem xét" },
      { value: "VERIFIED", label: "Đã xác minh" },
    ],
  },
  {
    name: "status",
    label: "Trạng thái hoạt động",
    type: "select",
    required: true,
    options: [
      { value: "ACTIVE", label: "Đang hoạt động" },
      { value: "INACTIVE", label: "Ngừng hoạt động" },
    ],
  },
  { name: "notes", label: "Ghi chú", type: "textarea", rows: 3 },
];

function partnerToInitial(partner: ProductionPartner): Record<string, string> {
  return {
    partnerCode: partner.partnerCode,
    legalName: partner.legalName,
    roles: partner.roles.join(","),
    taxCode: partner.taxCode,
    phone: partner.phone,
    email: partner.email,
    website: partner.website,
    contactName: partner.contactName,
    address: partner.address,
    province: partner.province,
    district: partner.district,
    status: partner.status,
    verificationStatus: partner.verificationStatus,
    notes: partner.notes,
    capabilities: partner.capabilities.join(", "),
    capacityPerMonth: partner.capacityPerMonth?.toString() ?? "",
    minimumOrderQuantity: partner.minimumOrderQuantity?.toString() ?? "",
    leadTimeDays: partner.leadTimeDays?.toString() ?? "",
    latitude: partner.latitude?.toString() ?? "",
    longitude: partner.longitude?.toString() ?? "",
    serviceRadiusKm: partner.serviceRadiusKm?.toString() ?? "",
    qualityScore: partner.qualityScore?.toString() ?? "",
    reliabilityScore: partner.reliabilityScore?.toString() ?? "",
  };
}

function nullableNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function valuesToInput(
  values: Record<string, string>,
  editingPartner?: ProductionPartner,
): ProductionPartnerInput {
  const roles = values.roles
    .split(",")
    .filter((role): role is ProductionPartnerRole => PARTNER_ROLES.includes(role as ProductionPartnerRole));
  const latitude = nullableNumber(values.latitude);
  const longitude = nullableNumber(values.longitude);
  if ((latitude === null) !== (longitude === null)) {
    throw new Error("Vĩ độ và kinh độ phải được nhập cùng nhau");
  }

  return {
    id: editingPartner?.id,
    partnerCode: values.partnerCode.trim(),
    legalName: values.legalName.trim(),
    roles,
    taxCode: values.taxCode?.trim() ?? "",
    phone: values.phone?.trim() ?? "",
    email: values.email?.trim() ?? "",
    website: values.website?.trim() ?? "",
    contactName: values.contactName?.trim() ?? "",
    address: values.address?.trim() ?? "",
    province: values.province?.trim() ?? "",
    district: values.district?.trim() ?? "",
    status: values.status as PartnerStatus,
    verificationStatus: values.verificationStatus as VerificationStatus,
    notes: values.notes?.trim() ?? "",
    capabilities: (values.capabilities ?? "")
      .split(",")
      .map((capability) => capability.trim())
      .filter(Boolean),
    capacityPerMonth: nullableNumber(values.capacityPerMonth),
    minimumOrderQuantity: nullableNumber(values.minimumOrderQuantity),
    leadTimeDays: nullableNumber(values.leadTimeDays),
    latitude,
    longitude,
    serviceRadiusKm: nullableNumber(values.serviceRadiusKm),
    qualityScore: nullableNumber(values.qualityScore),
    reliabilityScore: nullableNumber(values.reliabilityScore),
  };
}

function verificationLabel(status: VerificationStatus): string {
  if (status === "VERIFIED") return "Đã xác minh";
  if (status === "REVIEWED") return "Đã xem xét";
  return "Mới tìm thấy";
}

function safeWebsiteUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export default function MangLuoiSanXuatPage() {
  const { user } = useSession();
  const [partners, setPartners] = useState<ProductionPartner[]>([]);
  const [activeRole, setActiveRole] = useState<ProductionPartnerRole>("CUSTOMER");
  const [currentTab, setCurrentTab] = useState<"LOCAL" | "AI_DISCOVERY">("LOCAL");
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState("");
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ProductionPartner | undefined>();
  const [deletingPartner, setDeletingPartner] = useState<ProductionPartner | undefined>();
  const [deleting, setDeleting] = useState(false);

  const mayCreate = canCreate(user?.role, "nha-cung-cap");
  const mayEdit = canEdit(user?.role, "nha-cung-cap");
  const mayDelete = canDelete(user?.role, "nha-cung-cap");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPartners(await loadProductionPartners());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không tải được danh sách đối tác";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const categoryCounts = useMemo(() => {
    return PARTNER_ROLES.reduce<Record<ProductionPartnerRole, number>>((counts, role) => {
      counts[role] = partners.filter((partner) => partner.roles.includes(role)).length;
      return counts;
    }, {
      CUSTOMER: 0,
      SATELLITE_PROCESSOR: 0,
      MATERIAL_SUPPLIER: 0,
      PACKAGING_FINISHER: 0,
    });
  }, [partners]);

  const filteredPartners = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search);
    const normalizedProvince = normalizeSearchValue(provinceFilter);

    const maximumDistance = nullableNumber(radiusKm);
    return partners.filter((partner) => {
      if (!partner.roles.includes(activeRole)) return false;
      if (normalizedProvince && !normalizeSearchValue(partner.province).includes(normalizedProvince)) return false;
      if (
        capabilityFilter.length > 0
        && !capabilityFilter.every((cap) => partner.capabilities.some((pc) => normalizeSearchValue(pc) === normalizeSearchValue(cap)))
      ) return false;
      if (maximumDistance !== null) {
        if (!currentLocation || partner.latitude === null || partner.longitude === null) return false;
        const distance = calculateDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          partner.latitude,
          partner.longitude,
        );
        if (distance > maximumDistance) return false;
      }
      if (!normalizedSearch) return true;
      return [
        partner.partnerCode,
        partner.legalName,
        partner.taxCode,
        partner.phone,
        partner.address,
        partner.province,
        ...partner.capabilities,
      ].some((value) => normalizeSearchValue(value).includes(normalizedSearch));
    }).sort((left, right) => {
      if (!currentLocation) return left.legalName.localeCompare(right.legalName, "vi");
      const leftDistance = left.latitude === null || left.longitude === null
        ? Number.POSITIVE_INFINITY
        : calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, left.latitude, left.longitude);
      const rightDistance = right.latitude === null || right.longitude === null
        ? Number.POSITIVE_INFINITY
        : calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, right.latitude, right.longitude);
      return leftDistance - rightDistance;
    });
  }, [activeRole, capabilityFilter, currentLocation, partners, provinceFilter, radiusKm, search]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ định vị");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({ latitude: coords.latitude, longitude: coords.longitude });
        toast.success("Đã xác định vị trí hiện tại");
        setLocating(false);
      },
      () => {
        toast.error("Không lấy được vị trí. Anh hãy cho phép quyền vị trí trên trình duyệt.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const openCreate = () => {
    setEditingPartner(undefined);
    setModalOpen(true);
  };

  const openEdit = (partner: ProductionPartner) => {
    setEditingPartner(partner);
    setModalOpen(true);
  };

  const initialValues = editingPartner
    ? partnerToInitial(editingPartner)
    : {
        partnerCode: createPartnerCode(activeRole, partners),
        roles: activeRole,
        status: "ACTIVE",
        verificationStatus: "DISCOVERED",
      };

  const handleSave = async (values: Record<string, string>) => {
    try {
      const next = await saveProductionPartner(valuesToInput(values, editingPartner), partners);
      setPartners(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không lưu được đối tác";
      toast.error(message);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingPartner) return;
    setDeleting(true);
    try {
      setPartners(await deleteProductionPartner(deletingPartner.id, partners));
      toast.success(`Đã xóa ${deletingPartner.legalName}`);
      setDeletingPartner(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không xóa được đối tác";
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        moduleLabel="MIMIN ERP — Mạng lưới sản xuất"
        title="Trang chủ sản xuất"
        subtitle="Tìm theo năng lực, tỉnh thành và khoảng cách; dữ liệu vẫn tách riêng khỏi các danh mục ERP hiện hữu."
        icon={<Building2 className="w-5 h-5" />}
        actions={
          <div className="flex gap-2">
            <Link href="/mang-luoi-san-xuat/cong-ty-da-luu" className="btn-secondary inline-flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Công ty đã lưu
            </Link>
            <button onClick={() => void refresh()} className="btn-secondary inline-flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            {mayCreate && (
              <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Thêm đối tác
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PARTNER_ROLES.map((role) => {
          const meta = CATEGORY_META[role];
          const Icon = meta.icon;
          const active = activeRole === role;
          return (
              <button
                key={role}
                onClick={() => {
                  setActiveRole(role);
                  setCapabilityFilter([]);
                  setSearch("");
                }}
                className={`text-left rounded-2xl border bg-gradient-to-br p-4 transition relative ${meta.cardClass} ${active ? "ring-4 ring-brand-600 shadow-xl scale-[1.02] brightness-105" : "shadow-sm opacity-60 hover:opacity-100 grayscale-[0.3] hover:grayscale-0"}`}
              >
                {active && <CheckCircle2 className="absolute top-4 right-4 w-6 h-6 text-brand-600 animate-in fade-in zoom-in" />}
                <div className="flex items-start justify-between gap-3 pr-8">
                <div className={`w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center ${meta.iconClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-800">{categoryCounts[role]}</span>
              </div>
              <div className="mt-3 font-bold text-slate-900">{ROLE_LABELS[role]}</div>
              <div className="mt-1 text-xs text-slate-600">{meta.description}</div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setCurrentTab("LOCAL")}
          className={`pb-2 px-2 text-sm font-semibold transition-colors ${currentTab === "LOCAL" ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          🗃️ Dữ liệu nội bộ
        </button>
        <button
          onClick={() => setCurrentTab("AI_DISCOVERY")}
          className={`pb-2 px-2 text-sm font-semibold transition-colors ${currentTab === "AI_DISCOVERY" ? "border-b-2 border-brand-500 text-brand-700" : "text-slate-500 hover:text-slate-800"}`}
        >
          🤖 Tìm nguồn mới (AI)
        </button>
      </div>

      {currentTab === "AI_DISCOVERY" ? (
        <AiDiscoveryTab role={activeRole} />
      ) : (
        <>
          <div className="card p-4 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg">{ROLE_LABELS[activeRole]}</h2>
            <p className="text-xs opacity-60">{filteredPartners.length} hồ sơ phù hợp</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input pl-9"
              placeholder="Tìm theo tên, mã, MST, SĐT, địa chỉ..."
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <label className="text-xs font-medium">
            Tỉnh / thành
            <input value={provinceFilter} onChange={(event) => setProvinceFilter(event.target.value)} className="input mt-1" placeholder="VD: Bình Dương" />
          </label>
          <label className="text-xs font-medium relative block">
            Năng lực cần tìm
            <MultiSelectDropdown
              options={MANG_LUOI_DANH_MUC[activeRole]}
              selected={capabilityFilter}
              onChange={setCapabilityFilter}
              placeholder="Nhấn để chọn..."
            />
          </label>
          <label className="text-xs font-medium">
            Trong bán kính (km)
            <input value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)} className="input mt-1" type="number" min={0} placeholder="VD: 50" />
          </label>
          <div className="flex flex-col justify-end">
            <button type="button" onClick={useMyLocation} disabled={locating} className="btn-secondary inline-flex items-center justify-center gap-2">
              <Navigation className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
              {currentLocation ? "Cập nhật vị trí" : "Dùng vị trí hiện tại"}
            </button>
          </div>
        </div>
        {(provinceFilter || capabilityFilter.length > 0 || radiusKm) && (
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-700">
            <SlidersHorizontal className="w-4 h-4" /> Đang áp dụng bộ lọc nâng cao
            <button type="button" className="underline" onClick={() => { setProvinceFilter(""); setCapabilityFilter([]); setRadiusKm(""); }}>Xóa bộ lọc</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card p-10 text-center opacity-70">Đang tải mạng lưới sản xuất...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="card p-10 text-center flex flex-col items-center justify-center">
          <Building2 className="w-12 h-12 text-slate-300" />
          <h3 className="mt-3 font-bold">Chưa có đối tác trong danh mục này</h3>
          <p className="mt-1 text-sm opacity-60">Không tìm thấy hồ sơ nào khớp với bộ lọc của anh.</p>
          {(search || provinceFilter || capabilityFilter.length > 0) && (
            <button 
              onClick={() => setCurrentTab("AI_DISCOVERY")} 
              className="mt-4 btn-primary inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Dùng AI tìm nguồn mới ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => (
            <article key={partner.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-mono text-brand-700">{partner.partnerCode}</div>
                  <h3 className="font-bold text-lg truncate" title={partner.legalName}>{partner.legalName}</h3>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${partner.verificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-700" : partner.verificationStatus === "REVIEWED" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {verificationLabel(partner.verificationStatus)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {partner.roles.map((role) => (
                  <span key={role} className="text-[10px] rounded-full bg-brand-500/10 text-brand-700 px-2 py-1">
                    {ROLE_LABELS[role]}
                  </span>
                ))}
                {partner.capabilities.slice(0, 4).map((capability) => (
                  <span key={capability} className="text-[10px] rounded-full bg-slate-100 text-slate-700 px-2 py-1">
                    {capability}
                  </span>
                ))}
              </div>

              <div className="space-y-2 text-sm min-h-20">
                {partner.phone && <a href={`tel:${partner.phone}`} className="flex items-center gap-2 hover:text-brand-600"><Phone className="w-4 h-4" /> {partner.phone}</a>}
                {partner.email && <a href={`mailto:${partner.email}`} className="flex items-center gap-2 hover:text-brand-600"><Mail className="w-4 h-4" /> {partner.email}</a>}
                {(partner.address || partner.province) && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {[partner.address, partner.district, partner.province].filter(Boolean).join(", ")}</div>}
                {currentLocation && partner.latitude !== null && partner.longitude !== null && (
                  <div className="flex items-center gap-2 text-brand-700"><Navigation className="w-4 h-4" /> Cách {calculateDistanceKm(currentLocation.latitude, currentLocation.longitude, partner.latitude, partner.longitude).toFixed(1)} km</div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {partner.capacityPerMonth !== null && <span>Công suất: <strong>{partner.capacityPerMonth.toLocaleString("vi-VN")}/tháng</strong></span>}
                  {partner.leadTimeDays !== null && <span>Đáp ứng: <strong>{partner.leadTimeDays} ngày</strong></span>}
                  {calculatePartnerScore(partner) !== null && <span>Phù hợp: <strong>{calculatePartnerScore(partner)}/100</strong></span>}
                  {partner.serviceRadiusKm !== null && <span>Phục vụ: <strong>{partner.serviceRadiusKm} km</strong></span>}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs opacity-60">
                  {partner.website ? <a href={safeWebsiteUrl(partner.website)} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600">Mở website</a> : partner.taxCode ? `MST: ${partner.taxCode}` : "Chưa có website/MST"}
                </div>
                <div className="flex gap-1">
                  {partner.verificationStatus === "VERIFIED" && <CheckCircle2 className="w-4 h-4 text-emerald-600 mr-1" />}
                  {mayEdit && <button onClick={() => openEdit(partner)} className="p-2 rounded-lg hover:bg-sky-500/10 text-sky-700" aria-label={`Sửa ${partner.legalName}`}><Edit2 className="w-4 h-4" /></button>}
                  {mayDelete && <button onClick={() => setDeletingPartner(partner)} className="p-2 rounded-lg hover:bg-rose-500/10 text-rose-700" aria-label={`Xóa ${partner.legalName}`}><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      </>
      )}

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPartner ? `Chỉnh sửa ${editingPartner.legalName}` : `Thêm ${ROLE_LABELS[activeRole]}`}
        fields={FORM_FIELDS}
        initial={initialValues}
        submitLabel={editingPartner ? "Lưu thay đổi" : "Thêm đối tác"}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deletingPartner)}
        onClose={() => setDeletingPartner(undefined)}
        onConfirm={() => void handleDelete()}
        title="Xóa đối tác khỏi Mạng lưới sản xuất?"
        description={deletingPartner ? `Hồ sơ ${deletingPartner.partnerCode} — ${deletingPartner.legalName} sẽ bị xóa khỏi tất cả danh mục của phân hệ mới. Các danh mục ERP cũ không bị ảnh hưởng.` : undefined}
        confirmLabel="Xóa đối tác"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
