"use client";

import { useMemo, useState } from "react";
import { Building2, FileText, Plus, ShieldCheck } from "lucide-react";
import { CrudModal, type FieldDef } from "@/components/ui";
import { formatVND } from "@/lib/data/real-data";
import { useSupplierRelations, type SupplierContract } from "../supplier-relations";

const COMPANY = {
  legalName: "CÔNG TY TNHH DỆT MAY GIÀU SANG",
  taxCode: "0318507560",
  establishedAt: "2024-06-12",
  legalType: "Công ty trách nhiệm hữu hạn",
  brand: "POLOMIMIN",
  business: "Sản xuất và kinh doanh hàng may mặc",
  representative: "Hồ Minh Sang",
  representativeTitle: "Giám đốc",
};

const STATUS_STYLE: Record<SupplierContract["trangThai"], string> = {
  "Đang hiệu lực": "bg-emerald-100 text-emerald-700",
  "Hết hạn": "bg-rose-100 text-rose-700",
  "Nháp": "bg-slate-100 text-slate-700",
};

export default function HopDongPage() {
  const { suppliers, contracts, contractsLoading, addContract } = useSupplierRelations();
  const [open, setOpen] = useState(false);

  const fields = useMemo<FieldDef[]>(() => [
    { name: "maNcc", label: "Đối tác/Nhà cung cấp", type: "select", required: true, options: suppliers.map((supplier) => ({ value: supplier.ma_ncc, label: `${supplier.ma_ncc} — ${supplier.ten_ncc}` })) },
    { name: "doiTuong", label: "Loại đối tượng", type: "select", required: true, options: ["NCC", "Gia công", "Nhân sự", "Khách hàng"].map((value) => ({ value, label: value })) },
    { name: "soHopDong", label: "Số hợp đồng", type: "text", required: true, placeholder: "VD: HD-NCC-2026-001" },
    { name: "tenHopDong", label: "Tên hợp đồng", type: "text", required: true, placeholder: "VD: Hợp đồng cung cấp vải cotton" },
    { name: "loaiHopDong", label: "Loại hợp đồng", type: "select", required: true, options: ["Mua hàng", "Cung ứng", "Gia công", "Nguyên tắc", "Dịch vụ", "Khác"].map((value) => ({ value, label: value })) },
    { name: "ngayKy", label: "Ngày ký", type: "date", required: true },
    { name: "ngayHieuLuc", label: "Ngày hiệu lực", type: "date", required: true },
    { name: "ngayHetHan", label: "Ngày hết hạn", type: "date" },
    { name: "giaTri", label: "Giá trị hợp đồng", type: "number", min: 0, step: 1000 },
    { name: "tienTe", label: "Tiền tệ", type: "select", required: true, options: [{ value: "VND", label: "VND" }, { value: "USD", label: "USD" }] },
    { name: "dieuKhoanThanhToan", label: "Điều khoản thanh toán", type: "textarea", rows: 3, placeholder: "Đặt cọc, thời hạn và phương thức thanh toán..." },
    { name: "noiDung", label: "Hàng hóa/Dịch vụ và phạm vi công việc", type: "textarea", required: true, rows: 4 },
    { name: "daiDienBenB", label: "Đại diện bên đối tác", type: "text", required: true },
    { name: "chucVuBenB", label: "Chức vụ đại diện đối tác", type: "text" },
    { name: "nguoiPhuTrach", label: "Người phụ trách hợp đồng", type: "text", required: true },
    { name: "trangThai", label: "Trạng thái", type: "select", required: true, options: ["Nháp", "Đang hiệu lực", "Hết hạn"].map((value) => ({ value, label: value })) },
    { name: "ghiChu", label: "Ghi chú nội bộ", type: "textarea", rows: 3 },
  ], [suppliers]);

  const initial = useMemo<Record<string, string>>(() => ({
    doiTuong: "NCC",
    loaiHopDong: "Mua hàng",
    ngayKy: new Date().toISOString().slice(0, 10),
    ngayHieuLuc: new Date().toISOString().slice(0, 10),
    tienTe: "VND",
    daiDienBenA: COMPANY.representative,
    chucVuBenA: COMPANY.representativeTitle,
    nguoiPhuTrach: COMPANY.representative,
    trangThai: "Nháp",
  }), []);

  const save = async (values: Record<string, string>) => {
    const supplier = suppliers.find((item) => item.ma_ncc === values.maNcc);
    const normalizedNumber = values.soHopDong.trim().toLowerCase();
    if (contracts.some((contract) => contract.soHopDong.trim().toLowerCase() === normalizedNumber)) {
      throw new Error("Số hợp đồng đã tồn tại");
    }
    if (values.ngayHetHan && values.ngayHetHan < values.ngayHieuLuc) {
      throw new Error("Ngày hết hạn không được trước ngày hiệu lực");
    }
    await addContract({
      maNcc: values.maNcc,
      tenDoiTac: supplier?.ten_ncc || values.maNcc,
      doiTuong: values.doiTuong as SupplierContract["doiTuong"],
      soHopDong: values.soHopDong.trim(),
      tenHopDong: values.tenHopDong.trim(),
      loaiHopDong: values.loaiHopDong,
      ngayKy: values.ngayKy,
      ngayHieuLuc: values.ngayHieuLuc,
      ngayHetHan: values.ngayHetHan || "",
      giaTri: Number(values.giaTri || 0),
      tienTe: values.tienTe as SupplierContract["tienTe"],
      dieuKhoanThanhToan: values.dieuKhoanThanhToan || "",
      noiDung: values.noiDung,
      daiDienBenA: COMPANY.representative,
      chucVuBenA: COMPANY.representativeTitle,
      daiDienBenB: values.daiDienBenB,
      chucVuBenB: values.chucVuBenB || "",
      nguoiPhuTrach: values.nguoiPhuTrach,
      trangThai: values.trangThai as SupplierContract["trangThai"],
      ghiChu: values.ghiChu || "",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><FileText className="text-brand-500" /> Hợp đồng</h1>
          <p className="text-sm opacity-70">Quản lý hợp đồng NCC, gia công và các đối tác</p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className="btn-primary inline-flex items-center justify-center gap-2"><Plus className="h-4 w-4" /> Thêm hợp đồng</button>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-3">
        <div className="flex gap-3"><Building2 className="h-5 w-5 shrink-0 text-brand-500" /><div><div className="font-bold">{COMPANY.legalName}</div><div className="text-xs opacity-65">MST {COMPANY.taxCode} · {COMPANY.legalType}</div></div></div>
        <div><div className="text-xs opacity-60">Đại diện pháp luật</div><div className="font-semibold">{COMPANY.representative} — {COMPANY.representativeTitle}</div></div>
        <div><div className="text-xs opacity-60">Thương hiệu/Lĩnh vực</div><div className="font-semibold">{COMPANY.brand}</div><div className="text-xs opacity-65">{COMPANY.business}</div></div>
      </div>

      {contractsLoading ? <div className="card p-6 text-center text-sm opacity-60">Đang tải hợp đồng...</div> : contracts.length === 0 ? (
        <div className="card p-8 text-center"><ShieldCheck className="mx-auto mb-2 h-8 w-8 text-brand-500" /><div className="font-semibold">Chưa có hợp đồng</div><p className="text-sm opacity-60">Bấm “Thêm hợp đồng” để tạo hồ sơ đầu tiên.</p></div>
      ) : (
        <div className="grid gap-3">
          {contracts.map((contract) => (
            <article key={contract.id} className="card p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="font-mono text-xs font-bold text-brand-600">{contract.soHopDong}</div><h2 className="truncate text-lg font-bold">{contract.tenHopDong || `Hợp đồng ${contract.doiTuong}`}</h2><div className="text-sm opacity-70">{contract.maNcc} — {contract.tenDoiTac || "Đối tác chưa cập nhật"}</div></div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[contract.trangThai] || STATUS_STYLE.Nháp}`}>{contract.trangThai}</span>
              </div>
              <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-white/10">
                <div><span className="block text-xs opacity-55">Loại hợp đồng</span>{contract.loaiHopDong || contract.doiTuong}</div>
                <div><span className="block text-xs opacity-55">Thời hạn</span>{contract.ngayHieuLuc || contract.ngayKy} → {contract.ngayHetHan || "Không thời hạn"}</div>
                <div><span className="block text-xs opacity-55">Giá trị</span><b>{contract.tienTe === "USD" ? `${(contract.giaTri || 0).toLocaleString("vi-VN")} USD` : formatVND(contract.giaTri || 0)}</b></div>
                <div><span className="block text-xs opacity-55">Đại diện đối tác</span>{contract.daiDienBenB || "Chưa cập nhật"}{contract.chucVuBenB ? ` — ${contract.chucVuBenB}` : ""}</div>
              </div>
            </article>
          ))}
        </div>
      )}

      <CrudModal open={open} onClose={() => setOpen(false)} title="Thêm hợp đồng mới" fields={fields} initial={initial} onSubmit={save} submitLabel="Lưu hợp đồng" />
    </div>
  );
}
