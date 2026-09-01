// ============ NV FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.3)

import { useState, useEffect } from "react";
import { X, Plus, Edit2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import type { NhanSuExt } from "../data";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { authFetch } from "@/lib/auth-fetch";

export function NVFormModal({ mode, nv, existingCount, onClose, onSave }: { mode: "add" | "edit"; nv?: NhanSuExt; existingCount: number; onClose: () => void; onSave: (n: NhanSuExt) => void }) {
  const [form, setForm] = useState<NhanSuExt>(nv || {
    stt: existingCount + 1,
    maNV: `NV${(existingCount + 19).toString().padStart(3, "0")}`,
    hoTen: "",
    ngaySinh: "1995-01-01",
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
    luongCung: 7500000,
    rating: 4,
    taiKhoan: "",
  } as NhanSuExt);

  const [uploadFiles, setUploadFiles] = useState<Record<string, File | null>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  const handleUpload = (field: "avatar" | "cccdFrontImage" | "cccdBackImage") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFiles((prev) => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((prev) => ({ ...prev, [field]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const uploadToSupabase = async (field: "avatar" | "cccdFrontImage" | "cccdBackImage", file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const safeBase = (form.maNV || `nv-${existingCount + 1}`).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "employee";
    const path = `nhan-su/${safeBase}/${field}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    formData.append("path", path);

    const response = await fetch("/api/employee-uploads", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Không thể upload ảnh lên Supabase");
    }

    const data = await response.json();
    // Bucket private - lưu path bền vào DB, không lưu url (chỉ dùng tạm 1
    // tiếng). nhan-su-store.tsx sẽ tự ký lại URL mới mỗi khi tải danh sách.
    return data.path as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.hoTen || !form.sdt) {
      toast.error("Vui lòng nhập tên và SĐT");
      return;
    }

    const hasFront = Boolean(form.cccdFrontImage || uploadFiles.cccdFrontImage || nv?.cccdFrontImage);
    const hasBack = Boolean(form.cccdBackImage || uploadFiles.cccdBackImage || nv?.cccdBackImage);
    if (!hasFront || !hasBack) {
      toast.error("Vui lòng tải cả ảnh CCCD mặt trước và mặt sau trước khi lưu");
      return;
    }

    setIsUploading(true);
    try {
      // Bucket employee-documents là private - nv.avatar/cccdFrontImage/cccdBackImage
      // hiện trên form là URL đã ký tạm (chỉ để xem), KHÔNG được lưu lại vào DB.
      // Khi không upload ảnh mới, phải lấy path bền từ nv.*Path (do nhan-su-store
      // gắn vào lúc tải danh sách) - nếu không có (vd chọn ảnh mẫu tĩnh /avatars/...
      // hoặc thêm mới chưa từng lưu), giữ nguyên giá trị đang có trên form.
      const [avatarPath, cccdFrontPath, cccdBackPath] = await Promise.all([
        uploadFiles.avatar ? uploadToSupabase("avatar", uploadFiles.avatar) : Promise.resolve(null),
        uploadFiles.cccdFrontImage ? uploadToSupabase("cccdFrontImage", uploadFiles.cccdFrontImage) : Promise.resolve(null),
        uploadFiles.cccdBackImage ? uploadToSupabase("cccdBackImage", uploadFiles.cccdBackImage) : Promise.resolve(null),
      ]);

      const savedEmployee = {
        ...form,
        avatar: avatarPath ?? nv?.avatarPath ?? form.avatar ?? "",
        cccdFrontImage: cccdFrontPath ?? nv?.cccdFrontPath ?? form.cccdFrontImage ?? "",
        cccdBackImage: cccdBackPath ?? nv?.cccdBackPath ?? form.cccdBackImage ?? "",
        oldMaNV: mode === "edit" ? nv?.maNV : undefined, // Gửi mã cũ để backend biết xoá nếu đổi mã
      } as NhanSuExt & { oldMaNV?: string };

      const response = await authFetch("/api/employee-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savedEmployee),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Không thể lưu dữ liệu nhân sự vào Supabase");
      }

      onSave(savedEmployee);
      toast.success("Đã lưu nhân sự vào Supabase");
    } catch (error) {
      console.error("Upload employee images failed", error);
      toast.error(error instanceof Error ? error.message : "Không thể lưu ảnh lên Supabase");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="w-full sm:w-[96%] sm:max-w-2xl sm:max-w-3xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 min-h-[90vh] sm:min-h-0 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              {mode === "add" ? <Plus className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {mode === "add" ? "Thêm nhân viên mới" : `Chỉnh sửa: ${nv?.hoTen}`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nhập đầy đủ thông tin hồ sơ nhân sự xưởng may</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-teal-500/30 shadow-md overflow-hidden bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold cursor-pointer" onClick={() => (form.avatar ? setPreviewImage(form.avatar) : null)}>
                {form.avatar ? (
                  <img src={form.avatar} alt={form.hoTen} className="w-full h-full object-cover" />
                ) : (
                  <span>{form.hoTen ? form.hoTen.charAt(0).toUpperCase() : "NV"}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <span className="text-xs font-semibold">Tải ảnh</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload("avatar")}
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="text-sm font-semibold text-slate-900 dark:text-white">Ảnh đại diện nhân viên</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tải ảnh chân dung công nhân hoặc chọn ảnh đại diện từ thiết bị</div>
              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                {["/avatars/female-1.png", "/avatars/male-1.png", "/avatars/female-2.png", "/avatars/male-2.png"].map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: url })}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-500 text-slate-700 dark:text-slate-200 transition"
                  >
                    Mẫu {idx + 1}
                  </button>
                ))}
              </div>
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
                <label key={item.key} className="cursor-pointer rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-900/50 p-3 transition hover:border-teal-500">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300">Tải ảnh</span>
                  </div>
                  {item.preview ? (
                    <img src={item.preview} alt={item.label} className="h-28 w-full rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer" onClick={(e) => { e.stopPropagation(); setPreviewImage(item.preview || null); }} />
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400">
                      Chưa có ảnh
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload(item.key as "cccdFrontImage" | "cccdBackImage")} />
                </label>
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
              <input type="number" min={0} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-500" value={form.luongCB || form.luongCung || 0} onChange={(e) => setForm({ ...form, luongCB: Number(e.target.value), luongCung: Number(e.target.value) })} />
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
              <input type="number" min={1} max={5} step={0.5} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
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

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/3 py-3.5 rounded-2xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="w-full sm:w-2/3 py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white shadow-lg shadow-teal-500/25 transition flex items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mode === "add" ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
              {isUploading ? "Đang lưu ảnh lên Supabase..." : (mode === "add" ? "Thêm nhân viên mới" : "Lưu thay đổi")}
            </button>
          </div>
        </form>
      </div>
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
