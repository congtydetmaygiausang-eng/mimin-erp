"use client";

// ============ NV FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { useState, useEffect } from "react";
import { ImagePlus } from "lucide-react";
import { CrudModal } from "@/components/ui/CrudModal";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import { normalizeEmployeeRecord } from "@/lib/employee-records";
import type { NhanSuExt } from "../data";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { authFetch } from "@/lib/auth-fetch";

export function NVFormModal({ mode, nv, existingCount, existingCodes, onClose, onSave }: { mode: "add" | "edit"; nv?: NhanSuExt; existingCount: number; existingCodes: string[]; onClose: () => void; onSave: (n: NhanSuExt) => Promise<void> }) {
  const [form, setForm] = useState<NhanSuExt>(nv || {
    stt: existingCount + 1,
    maNV: `NV-${(Math.max(0, ...existingCodes.map((code) => Number(code.match(/^NV-?(\d+)$/i)?.[1] || 0))) + 1).toString().padStart(3, "0")}`,
    hoTen: "",
    ngaySinh: "",
    ngayCap: "",
    noiCap: "",
    gioiTinh: "Nam",
    cccd: "",
    sdt: "",
    email: "",
    diaChiTT: "",
    diaChiTamTru: "",
    viTri: "",
    ngayVaoLam: "",
    loaiHD: "",
    tinhTrangHN: "",
    soTK: "",
    nganHang: "",
    mst: "",
    bhxh: "",
    trangThai: "dang_lam",
    luongCB: 0,
    loaiLuong: "",
    boPhan: "Sản xuất",
    chucVu: "Công nhân",
    ngayVao: new Date().toISOString().split("T")[0],
    luongCung: 0,
    rating: 4,
    taiKhoan: "",
  } as NhanSuExt);

  const [uploadFiles, setUploadFiles] = useState<Partial<Record<"avatar" | "cccdFrontImage" | "cccdBackImage", UploadedFile>>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const handleImageChange = (field: "avatar" | "cccdFrontImage" | "cccdBackImage", files: UploadedFile[]) => {
    const selected = files[files.length - 1];
    setUploadFiles((previous) => ({ ...previous, [field]: selected }));
    setForm((previous) => ({ ...previous, [field]: selected?.dataUrl ?? nv?.[field] ?? "" }));
  };

  const uploadImage = async (field: string, file: UploadedFile): Promise<string> => {
    const blob = await (await fetch(file.dataUrl)).blob();
    const body = new FormData();
    body.append("file", blob, file.name);
    const safeCode = form.maNV.trim().replace(/[^a-zA-Z0-9-]/g, "-");
    body.append("path", `nhan-su/${safeCode}/${field}-${crypto.randomUUID()}`);
    const response = await authFetch("/api/employee-uploads", { method: "POST", body });
    const result: { path?: string; error?: string } = await response.json();
    if (!response.ok || !result.path?.startsWith("nhan-su/")) {
      throw new Error(result.error || "Không tải được ảnh, vui lòng thử lại");
    }
    return result.path;
  };

  const handleSubmit = async () => {
    const code = form.maNV.trim();
    if (!code || !form.hoTen.trim() || !form.sdt.trim()) {
      throw new Error("Vui lòng nhập mã nhân viên, họ tên và SĐT");
    }
    if (existingCodes.some((existing) => existing.trim().toLowerCase() === code.toLowerCase() && existing !== nv?.maNV)) {
      throw new Error("Mã nhân viên đã tồn tại. Vui lòng chọn mã khác");
    }
    if (!(form.cccdFrontImage || nv?.cccdFrontPath) || !(form.cccdBackImage || nv?.cccdBackPath)) {
      throw new Error("Vui lòng tải cả ảnh CCCD mặt trước và mặt sau trước khi lưu");
    }
    setIsUploading(true);
    try {
      const [avatar, front, back] = await Promise.all([
        uploadFiles.avatar ? uploadImage("avatar", uploadFiles.avatar) : nv?.avatarPath ?? form.avatar ?? "",
        uploadFiles.cccdFrontImage ? uploadImage("cccdFrontImage", uploadFiles.cccdFrontImage) : nv?.cccdFrontPath ?? form.cccdFrontImage ?? "",
        uploadFiles.cccdBackImage ? uploadImage("cccdBackImage", uploadFiles.cccdBackImage) : nv?.cccdBackPath ?? form.cccdBackImage ?? "",
      ]);
      const saved = { ...form, maNV: code, hoTen: form.hoTen.trim(), sdt: form.sdt.trim(), avatar, cccdFrontImage: front, cccdBackImage: back, oldMaNV: mode === "edit" ? nv?.maNV : undefined };
      const response = await authFetch("/api/employee-records", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(saved),
      });
      const result: { record?: Record<string, unknown>; error?: string } = await response.json();
      if (!response.ok || !result.record) throw new Error(result.error || "Không thể lưu hồ sơ nhân sự");
      await onSave({ ...saved, ...normalizeEmployeeRecord(result.record), oldMaNV: saved.oldMaNV } as NhanSuExt);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <CrudModal open onClose={onClose} title={mode === "add" ? "Thêm nhân viên mới" : `Chỉnh sửa: ${nv?.hoTen}`} fields={[]} onSubmit={handleSubmit} maxWidth="3xl" submitLabel={isUploading ? "Đang lưu..." : "Lưu thay đổi"}>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <button type="button" aria-label="Xem ảnh đại diện" disabled={!form.avatar} onClick={() => setPreviewImage(form.avatar || null)} className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-teal-600 text-white text-2xl font-bold">
              {form.avatar ? <img src={form.avatar} alt={form.hoTen || "Ảnh đại diện"} className="w-full h-full object-cover" /> : (form.hoTen.trim().charAt(0).toUpperCase() || "NV")}
            </button>
            <div className="min-w-0 flex-1 w-full space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white break-words">{form.hoTen.trim() || "Nhân viên mới"}</div>
              <ImageUploader files={uploadFiles.avatar ? [uploadFiles.avatar] : []} onChange={(files) => handleImageChange("avatar", files)} category="avatar" accept="image/*" multiple={false} label="Ảnh đại diện" hint="Chọn ảnh chân dung thật, tối đa 5 MB" />
            </div>
          </div>
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Mã NV *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.maNV} onChange={(e) => setForm({ ...form, maNV: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Họ tên *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày sinh</label>
              <input type="date" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.ngaySinh} onChange={(e) => setForm({ ...form, ngaySinh: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Giới tính</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.gioiTinh} onChange={(e) => setForm({ ...form, gioiTinh: e.target.value })}>
                <option>Nam</option>
                <option>Nữ</option>
                <option>Khác</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">CCCD</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.cccd} onChange={(e) => setForm({ ...form, cccd: e.target.value })} placeholder="012345678901" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">SĐT *</label>
              <input required className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.sdt} onChange={(e) => setForm({ ...form, sdt: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Email</label>
              <input type="email" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              Facebook URL
            </label>
            <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#1877F2]" value={form.facebookUrl || ""} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} placeholder="https://facebook.com/ten-nhan-vien" />
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <ImagePlus className="w-4 h-4 text-teal-600" />
              Ảnh CCCD và hồ sơ nhân viên
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "cccdFrontImage", label: "CCCD mặt trước", preview: form.cccdFrontImage },
                { key: "cccdBackImage", label: "CCCD mặt sau", preview: form.cccdBackImage },
              ].map((item) => (
                <div key={item.key} className="min-w-0 rounded-2xl border border-slate-200 dark:border-slate-600 p-3 space-y-2">
                  {item.preview && !uploadFiles[item.key as "cccdFrontImage" | "cccdBackImage"] && (
                    <button type="button" onClick={() => setPreviewImage(item.preview || null)} className="w-full" aria-label={`Xem ${item.label}`}>
                      <img src={item.preview} alt={item.label} className="h-28 w-full rounded-xl object-contain" />
                    </button>
                  )}
                  <ImageUploader files={uploadFiles[item.key as "cccdFrontImage" | "cccdBackImage"] ? [uploadFiles[item.key as "cccdFrontImage" | "cccdBackImage"]!] : []} onChange={(files) => handleImageChange(item.key as "cccdFrontImage" | "cccdBackImage", files)} category={item.key} label={item.label} accept="image/*" multiple={false} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ thường trú</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.diaChiTT || ""} onChange={(e) => setForm({ ...form, diaChiTT: e.target.value })} placeholder="Địa chỉ nơi ở hiện tại..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Địa chỉ tạm trú</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.diaChiTamTru || ""} onChange={(e) => setForm({ ...form, diaChiTamTru: e.target.value })} placeholder="Địa chỉ tạm trú..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Bộ phận *</label>
              <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.boPhan} onChange={(e) => setForm({ ...form, boPhan: e.target.value })}>
                <option>Sản xuất</option>
                <option>Kho vận</option>
                <option>QC</option>
                <option>Hành chính</option>
                <option>Kế toán</option>
                <option>Kinh doanh</option>
                <option>Quản lý</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Chức vụ</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.chucVu} onChange={(e) => setForm({ ...form, chucVu: e.target.value })} placeholder="Công nhân / Tổ trưởng..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngày vào</label>
              <input type="date" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.ngayVao} onChange={(e) => setForm({ ...form, ngayVao: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Lương cơ bản (đ/tháng)</label>
              <input type="number" min={0} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.luongCB ?? form.luongCung ?? 0} onChange={(e) => setForm({ ...form, luongCB: Number(e.target.value), luongCung: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Số tài khoản</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.soTK || ""} onChange={(e) => setForm({ ...form, soTK: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ngân hàng</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.nganHang || ""} onChange={(e) => setForm({ ...form, nganHang: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đánh giá (1-5)</label>
              <input type="number" min={1} max={5} step={1} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Ghi chú</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.ghiChu || ""} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Đơn giá SP</label>
              <input className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.donGiaSP || ""} onChange={(e) => setForm({ ...form, donGiaSP: e.target.value })} placeholder="VD: Áo trụ: 1.400đ..." />
            </div>
          </div>

      </CrudModal>
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </>
  );
}
