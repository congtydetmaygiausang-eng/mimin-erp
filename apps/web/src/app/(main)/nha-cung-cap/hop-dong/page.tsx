"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  FileText,
  Plus,
  ShieldCheck,
  Search,
  X,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { CrudModal, type FieldDef } from "@/components/ui";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
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
  "Đang hiệu lực": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
  "Hết hạn": "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
  "Nháp": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
};

export default function HopDongPage() {
  const { suppliers, contracts, contractsLoading, addContract } = useSupplierRelations();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fields = useMemo<FieldDef[]>(
    () => [
      {
        name: "maNcc",
        label: "Đối tác / Nhà cung cấp",
        type: "select",
        required: true,
        options: suppliers.map((supplier) => ({
          value: supplier.ma_ncc,
          label: `${supplier.ma_ncc} — ${supplier.ten_ncc}`,
        })),
      },
      {
        name: "doiTuong",
        label: "Loại đối tượng",
        type: "select",
        required: true,
        options: ["NCC", "Gia công", "Nhân sự", "Khách hàng"].map((value) => ({ value, label: value })),
      },
      { name: "soHopDong", label: "Số hợp đồng", type: "text", required: true, placeholder: "VD: HD-NCC-2026-001" },
      { name: "tenHopDong", label: "Tên hợp đồng", type: "text", required: true, placeholder: "VD: Hợp đồng cung cấp vải cotton" },
      {
        name: "loaiHopDong",
        label: "Loại hợp đồng",
        type: "select",
        required: true,
        options: ["Mua hàng", "Cung ứng", "Gia công", "Nguyên tắc", "Dịch vụ", "Khác"].map((value) => ({ value, label: value })),
      },
      { name: "ngayKy", label: "Ngày ký", type: "date", required: true },
      { name: "ngayHieuLuc", label: "Ngày hiệu lực", type: "date", required: true },
      { name: "ngayHetHan", label: "Ngày hết hạn", type: "date" },
      { name: "giaTri", label: "Giá trị hợp đồng", type: "number", min: 0, step: 1000 },
      {
        name: "tienTe",
        label: "Tiền tệ",
        type: "select",
        required: true,
        options: [
          { value: "VND", label: "VND" },
          { value: "USD", label: "USD" },
        ],
      },
      {
        name: "dieuKhoanThanhToan",
        label: "Điều khoản thanh toán",
        type: "textarea",
        rows: 3,
        placeholder: "Đặt cọc, thời hạn và phương thức thanh toán...",
      },
      { name: "noiDung", label: "Hàng hóa/Dịch vụ và phạm vi công việc", type: "textarea", required: true, rows: 4 },
      { name: "daiDienBenB", label: "Đại diện bên đối tác", type: "text", required: true },
      { name: "chucVuBenB", label: "Chức vụ đại diện đối tác", type: "text" },
      { name: "nguoiPhuTrach", label: "Người phụ trách hợp đồng", type: "text", required: true },
      {
        name: "trangThai",
        label: "Trạng thái",
        type: "select",
        required: true,
        options: ["Nháp", "Đang hiệu lực", "Hết hạn"].map((value) => ({ value, label: value })),
      },
      { name: "ghiChu", label: "Ghi chú nội bộ", type: "textarea", rows: 3 },
    ],
    [suppliers]
  );

  const initial = useMemo<Record<string, string>>(
    () => ({
      doiTuong: "NCC",
      loaiHopDong: "Mua hàng",
      ngayKy: new Date().toISOString().slice(0, 10),
      ngayHieuLuc: new Date().toISOString().slice(0, 10),
      tienTe: "VND",
      daiDienBenA: COMPANY.representative,
      chucVuBenA: COMPANY.representativeTitle,
      nguoiPhuTrach: COMPANY.representative,
      trangThai: "Đang hiệu lực",
    }),
    []
  );

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

  // KPIs
  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.trangThai === "Đang hiệu lực").length;
    const expired = contracts.filter((c) => c.trangThai === "Hết hạn").length;
    const draft = contracts.filter((c) => c.trangThai === "Nháp").length;
    const totalValue = contracts.reduce((sum, c) => sum + (c.giaTri || 0), 0);
    return { total, active, expired, draft, totalValue };
  }, [contracts]);

  // Filtered List
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contracts.filter((c) => {
      const matchQ =
        !q ||
        c.soHopDong.toLowerCase().includes(q) ||
        (c.tenHopDong || "").toLowerCase().includes(q) ||
        (c.tenDoiTac || "").toLowerCase().includes(q) ||
        c.maNcc.toLowerCase().includes(q);

      const matchStatus = filterStatus === "ALL" || c.trangThai === filterStatus;
      return matchQ && matchStatus;
    });
  }, [contracts, search, filterStatus]);

  return (
    <div className="space-y-6 animate-fade-in pb-10 w-full max-w-full overflow-x-hidden">
      {/* 1. HERO COMMAND BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-teal-50/70 to-emerald-50/80 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 md:p-7 shadow-sm border border-teal-200/90 dark:border-teal-800/80 group">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              Hồ Sơ Hợp Đồng & Pháp Lý Đối Tác
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 via-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-500/25">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Hợp Đồng NCC & Đối Tác Gia Công
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Theo dõi thời hạn, giá trị ký kết, điều khoản thanh toán và hồ sơ pháp lý đối tác chuỗi cung ứng
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 shadow-2xs">
                📄 {stats.total} hợp đồng
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {stats.active} đang hiệu lực
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 shadow-2xs">
                💰 Tổng giá trị: {formatVNDShort(stats.totalValue)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-teal-600/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Thêm Hợp Đồng Mới
          </button>
        </div>
      </div>

      {/* 2. THÔNG TIN PHÁP NHÂN CÔNG TY */}
      <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">{COMPANY.legalName}</div>
            <div className="text-slate-500 mt-0.5">MST: <b className="font-mono text-slate-700 dark:text-slate-300">{COMPANY.taxCode}</b> · {COMPANY.legalType}</div>
          </div>
        </div>

        <div>
          <div className="text-slate-400 font-medium">Đại diện pháp luật bên A:</div>
          <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
            {COMPANY.representative} — <span className="text-teal-600 font-semibold">{COMPANY.representativeTitle}</span>
          </div>
        </div>

        <div>
          <div className="text-slate-400 font-medium">Thương hiệu & Lĩnh vực:</div>
          <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
            {COMPANY.brand} — <span className="text-slate-600 dark:text-slate-400 font-normal">{COMPANY.business}</span>
          </div>
        </div>
      </div>

      {/* 3. BỘ LỌC & Ô TÌM KIẾM HỢP ĐỒNG */}
      <div className="card p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs space-y-3.5">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input
            className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Tìm theo số hợp đồng, tên hợp đồng, tên đối tác, mã NCC..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Tất cả", count: stats.total },
              { id: "Đang hiệu lực", label: "Đang hiệu lực", count: stats.active },
              { id: "Nháp", label: "Bản nháp", count: stats.draft },
              { id: "Hết hạn", label: "Hết hạn", count: stats.expired },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-slate-500">
            Hiển thị: <b className="text-teal-700 font-mono">{filtered.length}</b> hợp đồng
          </span>
        </div>
      </div>

      {/* 4. DANH SÁCH HỢP ĐỒNG */}
      {contractsLoading ? (
        <div className="card p-8 text-center text-sm text-slate-500">Đang tải danh sách hợp đồng...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200">
          <ShieldCheck className="mx-auto mb-2 h-10 w-10 text-teal-600" />
          <div className="font-bold text-base text-slate-800 dark:text-slate-200">Không tìm thấy hợp đồng phù hợp</div>
          <p className="text-xs text-slate-500 mt-1">Bấm “Thêm Hợp Đồng Mới” để tạo hồ sơ hợp đồng đầu tiên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((contract) => (
            <article
              key={contract.id}
              className="card p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200">
                        {contract.soHopDong}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{contract.doiTuong}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {contract.tenHopDong || `Hợp đồng ${contract.doiTuong}`}
                    </h2>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      Đối tác: <b className="text-slate-800 dark:text-slate-200">{contract.tenDoiTac}</b> ({contract.maNcc})
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold border ${
                      STATUS_STYLE[contract.trangThai] || STATUS_STYLE.Nháp
                    }`}
                  >
                    {contract.trangThai}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Loại hợp đồng</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{contract.loaiHopDong || "Mua hàng"}</span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Giá trị hợp đồng</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {contract.tienTe === "USD"
                        ? `${(contract.giaTri || 0).toLocaleString("vi-VN")} USD`
                        : formatVND(contract.giaTri || 0)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Thời hạn hợp đồng</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {contract.ngayHieuLuc || contract.ngayKy} → {contract.ngayHetHan || "Vô thời hạn"}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-slate-400 font-medium">Đại diện bên đối tác</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block">
                      {contract.daiDienBenB || "Chưa cập nhật"}
                      {contract.chucVuBenB ? ` (${contract.chucVuBenB})` : ""}
                    </span>
                  </div>
                </div>

                {contract.noiDung && (
                  <div className="mt-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {contract.noiDung}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Phụ trách: <b>{contract.nguoiPhuTrach || COMPANY.representative}</b></span>
                <span className="text-[11px] text-slate-400">Ký ngày: {contract.ngayKy}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 5. MODAL TẠO HỢP ĐỒNG */}
      <CrudModal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm Hợp Đồng Đối Tác Mới"
        fields={fields}
        initial={initial}
        onSubmit={save}
        submitLabel="Lưu Hợp Đồng"
      />
    </div>
  );
}
