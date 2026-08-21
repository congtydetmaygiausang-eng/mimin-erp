"use client";

// @codex MIMIN GROUP - bảng dữ liệu đối tác dùng chung cho tab Xưởng sản xuất & Nhà cung cấp.
// Giao diện làm mới theo mockup (KPI + filter bar + bảng chuyên nghiệp), tái dùng nguyên
// data layer production-network.ts (không đổi API/DB ở Phase 1).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit2,
  Eye,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { canCreate, canDelete, canEdit } from "@/lib/permissions";
import {
  PARTNER_ROLES,
  ROLE_LABELS,
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

const PAGE_SIZE = 10;

type CooperationStatus = "DANG_HOP_TAC" | "DANG_XEM_XET" | "TIEM_NANG" | "NGUNG_HOP_TAC";

const COOPERATION_META: Record<CooperationStatus, { label: string; className: string }> = {
  DANG_HOP_TAC: { label: "Đang hợp tác", className: "bg-emerald-100 text-emerald-700" },
  DANG_XEM_XET: { label: "Đang xem xét", className: "bg-amber-100 text-amber-700" },
  TIEM_NANG: { label: "Tiềm năng", className: "bg-violet-100 text-violet-700" },
  NGUNG_HOP_TAC: { label: "Ngừng hợp tác", className: "bg-rose-100 text-rose-700" },
};

function cooperationStatus(partner: ProductionPartner): CooperationStatus {
  if (partner.status === "INACTIVE") return "NGUNG_HOP_TAC";
  if (partner.verificationStatus === "VERIFIED") return "DANG_HOP_TAC";
  if (partner.verificationStatus === "REVIEWED") return "DANG_XEM_XET";
  return "TIEM_NANG";
}

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
  { name: "minimumOrderQuantity", label: "Đơn hàng tối thiểu (MOQ)", type: "number", min: 0 },
  { name: "leadTimeDays", label: "Thời gian đáp ứng (ngày)", type: "number", min: 0 },
  { name: "qualityScore", label: "Điểm chất lượng (0-100)", type: "number", min: 0, max: 100 },
  { name: "reliabilityScore", label: "Điểm uy tín (0-100)", type: "number", min: 0, max: 100 },
  {
    name: "verificationStatus",
    label: "Trạng thái xác minh",
    type: "select",
    required: true,
    options: [
      { value: "DISCOVERED", label: "Mới tìm thấy (Tiềm năng)" },
      { value: "REVIEWED", label: "Đã xem xét" },
      { value: "VERIFIED", label: "Đã xác minh (Đang hợp tác)" },
    ],
  },
  {
    name: "status",
    label: "Trạng thái hoạt động",
    type: "select",
    required: true,
    options: [
      { value: "ACTIVE", label: "Đang hoạt động" },
      { value: "INACTIVE", label: "Ngừng hợp tác" },
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
    qualityScore: partner.qualityScore?.toString() ?? "",
    reliabilityScore: partner.reliabilityScore?.toString() ?? "",
  };
}

function nullableNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function valuesToInput(values: Record<string, string>, editingPartner?: ProductionPartner): ProductionPartnerInput {
  const roles = values.roles
    .split(",")
    .filter((role): role is ProductionPartnerRole => PARTNER_ROLES.includes(role as ProductionPartnerRole));

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
    latitude: editingPartner?.latitude ?? null,
    longitude: editingPartner?.longitude ?? null,
    serviceRadiusKm: editingPartner?.serviceRadiusKm ?? null,
    qualityScore: nullableNumber(values.qualityScore),
    reliabilityScore: nullableNumber(values.reliabilityScore),
  };
}

function safeWebsiteUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

export default function PartnerDataTable({
  roles,
  primaryRole,
  emptyHint,
}: {
  /** Các vai trò được gộp hiển thị trong bảng này (VD: NCC = MATERIAL_SUPPLIER + PACKAGING_FINISHER) */
  roles: ProductionPartnerRole[];
  /** Vai trò dùng làm mặc định khi tạo mới + nguồn danh mục quick-filter */
  primaryRole: ProductionPartnerRole;
  emptyHint?: string;
}) {
  const { user } = useSession();
  const [allPartners, setAllPartners] = useState<ProductionPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [capabilityFilter, setCapabilityFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<CooperationStatus | "">("");
  const [quickChip, setQuickChip] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ProductionPartner | undefined>();
  const [deletingPartner, setDeletingPartner] = useState<ProductionPartner | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const mayCreate = canCreate(user?.role, "nha-cung-cap");
  const mayEdit = canEdit(user?.role, "nha-cung-cap");
  const mayDelete = canDelete(user?.role, "nha-cung-cap");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAllPartners(await loadProductionPartners());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách đối tác");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setPage(1);
  }, [search, provinceFilter, capabilityFilter, statusFilter, quickChip, roles.join(",")]);

  const partners = useMemo(
    () => allPartners.filter((partner) => partner.roles.some((role) => roles.includes(role))),
    [allPartners, roles],
  );

  const kpi = useMemo(() => {
    const counts: Record<CooperationStatus, number> = {
      DANG_HOP_TAC: 0,
      DANG_XEM_XET: 0,
      TIEM_NANG: 0,
      NGUNG_HOP_TAC: 0,
    };
    for (const partner of partners) counts[cooperationStatus(partner)] += 1;
    return counts;
  }, [partners]);

  const quickChipOptions = useMemo(() => {
    const merged = new Set<string>();
    roles.forEach((role) => MANG_LUOI_DANH_MUC[role]?.forEach((item) => merged.add(item)));
    return Array.from(merged).slice(0, 8);
  }, [roles]);

  const filtered = useMemo(() => {
    const normalizedSearch = normalizeSearchValue(search);
    const normalizedProvince = normalizeSearchValue(provinceFilter);
    return partners.filter((partner) => {
      if (statusFilter && cooperationStatus(partner) !== statusFilter) return false;
      if (normalizedProvince && !normalizeSearchValue(partner.province).includes(normalizedProvince)) return false;
      if (quickChip && !partner.capabilities.some((cap) => normalizeSearchValue(cap) === normalizeSearchValue(quickChip))) return false;
      if (
        capabilityFilter.length > 0 &&
        !capabilityFilter.every((cap) => partner.capabilities.some((pc) => normalizeSearchValue(pc) === normalizeSearchValue(cap)))
      ) return false;
      if (!normalizedSearch) return true;
      return [partner.partnerCode, partner.legalName, partner.taxCode, partner.phone, partner.address, partner.province, ...partner.capabilities]
        .some((value) => normalizeSearchValue(value).includes(normalizedSearch));
    });
  }, [partners, search, provinceFilter, capabilityFilter, statusFilter, quickChip]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openCreate = () => {
    setEditingPartner(undefined);
    setModalOpen(true);
  };
  const openEdit = (partner: ProductionPartner) => {
    setEditingPartner(partner);
    setModalOpen(true);
    setOpenMenuId(null);
  };

  const initialValues = editingPartner
    ? partnerToInitial(editingPartner)
    : {
        partnerCode: createPartnerCode(primaryRole, allPartners),
        roles: primaryRole,
        status: "ACTIVE",
        verificationStatus: "DISCOVERED",
      };

  const handleSave = async (values: Record<string, string>) => {
    try {
      const next = await saveProductionPartner(valuesToInput(values, editingPartner), allPartners);
      setAllPartners(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lưu được đối tác");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingPartner) return;
    setDeleting(true);
    try {
      setAllPartners(await deleteProductionPartner(deletingPartner.id, allPartners));
      toast.success(`Đã xóa ${deletingPartner.legalName}`);
      setDeletingPartner(undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không xóa được đối tác");
    } finally {
      setDeleting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setProvinceFilter("");
    setCapabilityFilter([]);
    setStatusFilter("");
    setQuickChip("");
  };
  const hasActiveFilters = Boolean(search || provinceFilter || capabilityFilter.length || statusFilter || quickChip);

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-black">{partners.length}</div>
          <div className="text-xs opacity-60 mt-1">Tổng số</div>
        </div>
        {(Object.keys(COOPERATION_META) as CooperationStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter((current) => (current === key ? "" : key))}
            className={`card p-4 text-left transition ${statusFilter === key ? "ring-2 ring-brand-500" : "hover:shadow-md"}`}
          >
            <div className="text-2xl font-black">{kpi[key]}</div>
            <div className={`text-xs mt-1 inline-flex px-1.5 py-0.5 rounded ${COOPERATION_META[key].className}`}>
              {COOPERATION_META[key].label}
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3 relative z-20">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="input pl-9"
              placeholder="Tìm theo tên, mã, MST, SĐT, địa chỉ..."
            />
          </div>
          <input
            value={provinceFilter}
            onChange={(event) => setProvinceFilter(event.target.value)}
            className="input md:w-48"
            placeholder="Tỉnh / thành"
          />
          <MultiSelectDropdown
            className="md:w-64"
            options={quickChipOptions.length ? quickChipOptions : Array.from(new Set(roles.flatMap((role) => MANG_LUOI_DANH_MUC[role] ?? [])))}
            selected={capabilityFilter}
            onChange={setCapabilityFilter}
            placeholder="Lọc theo năng lực..."
          />
          {mayCreate && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center justify-center gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Thêm đối tác
            </button>
          )}
          <button onClick={() => void refresh()} className="btn-secondary inline-flex items-center justify-center gap-2 shrink-0" aria-label="Làm mới">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickChipOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setQuickChip((current) => (current === option ? "" : option))}
              className={`text-xs rounded-full border px-2.5 py-1 transition ${
                quickChip === option
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:text-slate-300"
              }`}
            >
              {option}
            </button>
          ))}
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="text-xs underline text-brand-700 ml-1">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center opacity-70">Đang tải dữ liệu...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <Building2 className="w-12 h-12 text-slate-300" />
            <h3 className="mt-3 font-bold">Chưa có đối tác phù hợp</h3>
            <p className="mt-1 text-sm opacity-60">{emptyHint ?? "Không tìm thấy hồ sơ nào khớp với bộ lọc."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 text-left text-xs uppercase tracking-wide opacity-60">
                <tr>
                  <th className="px-4 py-3 font-semibold">Đối tác</th>
                  <th className="px-4 py-3 font-semibold">Danh mục & năng lực</th>
                  <th className="px-4 py-3 font-semibold">Địa chỉ</th>
                  <th className="px-4 py-3 font-semibold">MOQ</th>
                  <th className="px-4 py-3 font-semibold">Đánh giá</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {pageItems.map((partner) => {
                  const status = cooperationStatus(partner);
                  const score = calculatePartnerScore(partner);
                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5">
                      <td className="px-4 py-3 align-top">
                        <div className="font-mono text-[11px] text-brand-700">{partner.partnerCode}</div>
                        <div className="font-semibold">{partner.legalName}</div>
                        <div className="mt-1 flex flex-col gap-0.5 text-xs opacity-70">
                          {partner.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{partner.phone}</span>}
                          {partner.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{partner.email}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {partner.capabilities.slice(0, 3).map((capability) => (
                            <span key={capability} className="text-[10px] rounded-full bg-slate-100 dark:bg-white/10 px-2 py-0.5">{capability}</span>
                          ))}
                          {partner.capabilities.length > 3 && (
                            <span className="text-[10px] opacity-60">+{partner.capabilities.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top max-w-[220px]">
                        <span className="inline-flex items-start gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-60" />
                          <span className="line-clamp-2">{[partner.district, partner.province].filter(Boolean).join(", ") || "Chưa cập nhật"}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {partner.minimumOrderQuantity !== null ? partner.minimumOrderQuantity.toLocaleString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        {score !== null ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                            <Sparkles className="w-3.5 h-3.5" /> {score}/100
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 align-top whitespace-nowrap">
                        <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${COOPERATION_META[status].className}`}>
                          {COOPERATION_META[status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="inline-flex items-center gap-1 relative">
                          <button
                            onClick={() => openEdit(partner)}
                            className="btn-secondary text-xs inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId((current) => (current === partner.id ? null : partner.id))}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            aria-label="Thao tác khác"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === partner.id && (
                            <div className="absolute right-0 top-9 z-30 w-36 card p-1 shadow-lg">
                              {mayEdit && (
                                <button
                                  onClick={() => openEdit(partner)}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-sky-500/10 text-sky-700 inline-flex items-center gap-2"
                                >
                                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                                </button>
                              )}
                              {mayDelete && (
                                <button
                                  onClick={() => { setDeletingPartner(partner); setOpenMenuId(null); }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-rose-500/10 text-rose-700 inline-flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Xóa
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-xs" style={{ borderColor: "var(--border)" }}>
            <span className="opacity-60">
              Hiển thị {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary px-2.5 py-1 disabled:opacity-40">Trước</button>
              <span className="px-2">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary px-2.5 py-1 disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </div>

      <CrudModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPartner ? `Chi tiết & chỉnh sửa — ${editingPartner.legalName}` : `Thêm ${ROLE_LABELS[primaryRole]}`}
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
        description={deletingPartner ? `Hồ sơ ${deletingPartner.partnerCode} — ${deletingPartner.legalName} sẽ bị xóa. Hành động không thể hoàn tác.` : undefined}
        confirmLabel="Xóa đối tác"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

export { cooperationStatus, COOPERATION_META };
export type { CooperationStatus };
