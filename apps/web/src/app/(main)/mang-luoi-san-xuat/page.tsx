"use client";

// @codex Giai đoạn 1 - danh mục Mạng lưới sản xuất độc lập với ERP core.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes,
  Building2,
  CheckCircle2,
  Edit2,
  Factory,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  RefreshCw,
  Search,
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
  };
}

function valuesToInput(
  values: Record<string, string>,
  editingPartner?: ProductionPartner,
): ProductionPartnerInput {
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
  const [search, setSearch] = useState("");
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
    return partners.filter((partner) => {
      if (!partner.roles.includes(activeRole)) return false;
      if (!normalizedSearch) return true;
      return [
        partner.partnerCode,
        partner.legalName,
        partner.taxCode,
        partner.phone,
        partner.address,
        partner.province,
      ].some((value) => normalizeSearchValue(value).includes(normalizedSearch));
    });
  }, [activeRole, partners, search]);

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
        subtitle="Một hồ sơ đối tác có thể thuộc nhiều danh mục; dữ liệu được lưu riêng, không ảnh hưởng danh mục ERP hiện hữu."
        icon={<Building2 className="w-5 h-5" />}
        actions={
          <div className="flex gap-2">
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
              onClick={() => setActiveRole(role)}
              className={`text-left rounded-2xl border bg-gradient-to-br p-4 transition shadow-sm ${meta.cardClass} ${active ? "ring-2 ring-brand-500 shadow-md" : "hover:-translate-y-0.5"}`}
            >
              <div className="flex items-start justify-between gap-3">
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

      <div className="card p-4">
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
      </div>

      {loading ? (
        <div className="card p-10 text-center opacity-70">Đang tải mạng lưới sản xuất...</div>
      ) : filteredPartners.length === 0 ? (
        <div className="card p-10 text-center">
          <Building2 className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="mt-3 font-bold">Chưa có đối tác trong danh mục này</h3>
          <p className="mt-1 text-sm opacity-60">Thêm thủ công ở Giai đoạn 1; công cụ tìm kiếm tự động sẽ được bổ sung ở Giai đoạn 3.</p>
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
              </div>

              <div className="space-y-2 text-sm min-h-20">
                {partner.phone && <a href={`tel:${partner.phone}`} className="flex items-center gap-2 hover:text-brand-600"><Phone className="w-4 h-4" /> {partner.phone}</a>}
                {partner.email && <a href={`mailto:${partner.email}`} className="flex items-center gap-2 hover:text-brand-600"><Mail className="w-4 h-4" /> {partner.email}</a>}
                {(partner.address || partner.province) && <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-0.5 shrink-0" /> {[partner.address, partner.district, partner.province].filter(Boolean).join(", ")}</div>}
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
