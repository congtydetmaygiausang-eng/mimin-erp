"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Check, AlertTriangle, Layers, Shirt, Factory, Calendar, Clock, Scissors, CheckCircle2, ChevronDown, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, DOI_TAC, type KhoVai, type KhoVatTu, type DoiTac } from "@/lib/data/real-data";
import type { LenhCat } from "@/lib/data/lenh-cat-store";
import { ThongTinDieuPhoi, TrangThaiVatTu, TrangThaiBo, BuocTienTrinh } from "@/lib/data/dieu-phoi-khsx-store";

interface DieuPhoiLenhCatModalProps {
  open: boolean;
  onClose: () => void;
  lenhCat: LenhCat | null;
  dieuPhoi: ThongTinDieuPhoi | null;
  onSave: (patch: Partial<ThongTinDieuPhoi>) => void;
  onZoomImg?: (url: string) => void;
}

export function DieuPhoiLenhCatModal({
  open,
  onClose,
  lenhCat,
  dieuPhoi,
  onSave,
  onZoomImg,
}: DieuPhoiLenhCatModalProps) {
  const [form, setForm] = useState<Partial<ThongTinDieuPhoi>>({});
  const [vaiSearch, setVaiSearch] = useState("");
  const [boSearch, setBoSearch] = useState("");

  useEffect(() => {
    if (dieuPhoi) {
      setForm({ ...dieuPhoi });
    }
  }, [dieuPhoi, open]);

  // Danh sách vải từ Kho Vải
  const filteredVai = useMemo(() => {
    if (!vaiSearch.trim()) return KHO_VAI.slice(0, 30);
    const q = vaiSearch.toLowerCase();
    return KHO_VAI.filter((v) => v.tenVT.toLowerCase().includes(q) || v.maVT.toLowerCase().includes(q) || v.mauSac.toLowerCase().includes(q));
  }, [vaiSearch]);

  // Danh sách Bo từ Kho Phụ Liệu
  const filteredBo = useMemo(() => {
    const boList = KHO_VAT_TU.filter((b) => b.loai === "Bo cổ" || b.tenVT.toLowerCase().includes("bo"));
    if (!boSearch.trim()) return boList;
    const q = boSearch.toLowerCase();
    return boList.filter((b) => b.tenVT.toLowerCase().includes(q) || b.maVT.toLowerCase().includes(q) || (b.mauSac && b.mauSac.toLowerCase().includes(q)));
  }, [boSearch]);

  // Danh sách xưởng gia công May & In/Thêu
  const xuongMayList = useMemo(() => {
    return DOI_TAC.filter((dt) => dt.congDoan.toLowerCase().includes("may"));
  }, []);

  const xuongInTheuList = useMemo(() => {
    return DOI_TAC.filter((dt) => dt.congDoan.toLowerCase().includes("in") || dt.congDoan.toLowerCase().includes("thêu"));
  }, []);

  if (!open || !lenhCat) return null;

  const firstMau = lenhCat.dsMau?.[0];
  const imgUrl = firstMau?.img || (firstMau as any)?.imgQuan || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    toast.success(`Đã lưu điều phối thành công cho lệnh cắt ${lenhCat.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-slate-900 via-teal-950 to-slate-900 border-b border-teal-500/20 px-5 py-4 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <span>ĐIỀU PHỐI TIẾN TRÌNH LỆNH CẮT</span>
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="font-mono text-slate-300">{lenhCat.id}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white line-clamp-1">
                {lenhCat.tenSP} ({lenhCat.maSP}) · {lenhCat.tongSL.toLocaleString("vi-VN")} SP
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Thông tin vắn tắt sản phẩm */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
            <div
              className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shrink-0 cursor-zoom-in group shadow-xs"
              onClick={() => imgUrl && onZoomImg && onZoomImg(imgUrl)}
              title="Xem ảnh lớn"
            >
              {imgUrl ? (
                <img src={imgUrl} alt={lenhCat.tenSP} className="w-full h-full object-cover group-hover:scale-110 transition duration-200" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No img</div>
              )}
            </div>
            <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Loại sản phẩm</span>
                <b className="text-slate-800 dark:text-slate-200 font-medium">{lenhCat.loaiSP}</b>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tổng số lượng</span>
                <b className="text-teal-600 dark:text-teal-400 font-black font-mono text-sm">{lenhCat.tongSL.toLocaleString("vi-VN")} cái</b>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Hạn hoàn thành</span>
                <b className="text-slate-800 dark:text-slate-200 font-mono">{lenhCat.hanHoanThanh || "Chưa set"}</b>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Màu sản xuất</span>
                <b className="text-slate-800 dark:text-slate-200">{lenhCat.dsMau?.map((m) => m.ten).join(", ") || "Màu chuẩn"}</b>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* KHỐI 1: VẢI (CHỌN TỪ KHO VẢI) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Shirt className="w-4 h-4" /> 1. Vải (Kho vải MIMIN)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, trangThaiVai: p.trangThaiVai === "du_vai" ? "thieu_vai" : "du_vai" }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      form.trangThaiVai === "du_vai"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {form.trangThaiVai === "du_vai" ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{form.trangThaiVai === "du_vai" ? "Đã đủ vải" : "Thiếu vải"}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Chọn loại vải từ Kho Vải:</label>
                <select
                  value={form.maVai || ""}
                  onChange={(e) => {
                    const sel = KHO_VAI.find((v) => v.maVT === e.target.value);
                    setForm((p) => ({
                      ...p,
                      maVai: e.target.value,
                      tenVai: sel?.tenVT || p.tenVai,
                      mauVai: sel?.mauSac || p.mauVai,
                      trangThaiVai: sel ? "du_vai" : p.trangThaiVai,
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">-- Chọn vải trong kho --</option>
                  {filteredVai.map((v) => (
                    <option key={v.maVT} value={v.maVT}>
                      {v.tenVT} ({v.maVT}) · Màu: {v.mauSac}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Số kg vải cần (kg):</label>
                  <input
                    type="number"
                    value={form.soKgVaiCan ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, soKgVaiCan: Number(e.target.value) || 0 }))}
                    placeholder="VD: 150"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Trạng thái vải:</label>
                  <select
                    value={form.trangThaiVai || "thieu_vai"}
                    onChange={(e) => setForm((p) => ({ ...p, trangThaiVai: e.target.value as TrangThaiVatTu }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="du_vai">Đã đủ vải (Sẵn sàng cắt)</option>
                    <option value="thieu_vai">Thiếu vải (Cần lấy thêm)</option>
                    <option value="cho_nhap">Chờ nhập kho vải</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Ghi chú vải:</label>
                <input
                  type="text"
                  value={form.ghiChuVai || ""}
                  onChange={(e) => setForm((p) => ({ ...p, ghiChuVai: e.target.value }))}
                  placeholder="Ghi chú cây vải, số cuộn, độ co giãn..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* KHỐI 2: BO CỔ (CHỌN TỪ KHO BO & CẬP NHẬT ĐÃ ĐỦ BO) */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> 2. Bo Cổ (Kho Phụ Liệu)
                </span>
                {/* Nút cập nhật nhanh Đã Đủ Bo theo yêu cầu anh Sang */}
                <button
                  type="button"
                  onClick={() => {
                    const isDu = form.trangThaiBo === "du_bo";
                    setForm((p) => ({ ...p, trangThaiBo: isDu ? "thieu_bo" : "du_bo" }));
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    form.trangThaiBo === "du_bo"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>{form.trangThaiBo === "du_bo" ? "✓ ĐÃ ĐỦ BO CỔ" : "Chưa đủ bo"}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Chọn mẫu Bo từ Kho Phụ Liệu:</label>
                <select
                  value={form.maBo || ""}
                  onChange={(e) => {
                    const sel = KHO_VAT_TU.find((b) => b.maVT === e.target.value);
                    setForm((p) => ({
                      ...p,
                      maBo: e.target.value,
                      tenBo: sel?.tenVT || p.tenBo,
                      mauBo: sel?.mauSac || p.mauBo,
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">-- Chọn bo cổ trong kho --</option>
                  {filteredBo.map((b) => (
                    <option key={b.maVT} value={b.maVT}>
                      {b.tenVT} ({b.maVT}) · Tồn: {b.tonKho} {b.dvt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Số bộ bo cần:</label>
                  <input
                    type="number"
                    value={form.soBoCan ?? lenhCat.tongSL}
                    onChange={(e) => setForm((p) => ({ ...p, soBoCan: Number(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-0.5">Trạng thái bo:</label>
                  <select
                    value={form.trangThaiBo || "thieu_bo"}
                    onChange={(e) => setForm((p) => ({ ...p, trangThaiBo: e.target.value as TrangThaiBo }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="du_bo">Đã đủ bo (Sẵn sàng)</option>
                    <option value="thieu_bo">Thiếu bo</option>
                    <option value="cho_det">Đang chờ dệt bo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-0.5">Ghi chú bo cổ:</label>
                <input
                  type="text"
                  value={form.ghiChuBo || ""}
                  onChange={(e) => setForm((p) => ({ ...p, ghiChuBo: e.target.value }))}
                  placeholder="Ghi chú quy cách dệt bo, màu sọc..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 3: ĐIỀU PHỐI GIA CÔNG (CHỌN TỪ DANH SÁCH GIA CÔNG) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Factory className="w-4 h-4" /> 3. Điều Phối Xưởng Gia Công (May & In / Thêu)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Xưởng may gia công:</label>
                <select
                  value={form.maXuongMay || ""}
                  onChange={(e) => {
                    const sel = DOI_TAC.find((dt) => dt.maDT === e.target.value);
                    setForm((p) => ({
                      ...p,
                      maXuongMay: e.target.value,
                      tenXuongMay: sel?.tenDonVi || "",
                      sdtXuongMay: sel?.sdt || "",
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">-- Chọn xưởng may đối tác --</option>
                  {xuongMayList.map((dt) => (
                    <option key={dt.maDT} value={dt.maDT}>
                      {dt.tenDonVi} ({dt.maDT}) · {dt.congDoan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Xưởng in / thêu / dập:</label>
                <select
                  value={form.maXuongInTheu || ""}
                  onChange={(e) => {
                    const sel = DOI_TAC.find((dt) => dt.maDT === e.target.value);
                    setForm((p) => ({
                      ...p,
                      maXuongInTheu: e.target.value,
                      tenXuongInTheu: sel?.tenDonVi || "",
                      sdtXuongInTheu: sel?.sdt || "",
                    }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="">-- Chọn xưởng in/thêu đối tác --</option>
                  {xuongInTheuList.map((dt) => (
                    <option key={dt.maDT} value={dt.maDT}>
                      {dt.tenDonVi} ({dt.maDT}) · {dt.congDoan}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KHỐI 4: TIẾN TRÌNH & THỜI GIAN THỰC HIỆN */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <span className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Calendar className="w-4 h-4" /> 4. Tiến Trình Sản Xuất & Thời Gian Thực Hiện
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Bước tiến trình hiện tại:</label>
                <select
                  value={form.buocHienTai || "chuan_bi"}
                  onChange={(e) => setForm((p) => ({ ...p, buocHienTai: e.target.value as BuocTienTrinh }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="chuan_bi">1. Chuẩn bị (Vải & Bo & Rập)</option>
                  <option value="cat">2. Đang cắt vải</option>
                  <option value="in_theu">3. Đang in / thêu</option>
                  <option value="may">4. Đang may ráp</option>
                  <option value="qc_hoan_thien">5. Đang QC & Ủi đóng gói</option>
                  <option value="hoan_thanh">✓ Hoàn thành đơn hàng</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Ngày giao xưởng:</label>
                <input
                  type="date"
                  value={form.ngayGiaoXuong || ""}
                  onChange={(e) => setForm((p) => ({ ...p, ngayGiaoXuong: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Hạn hoàn thành (Deadline):</label>
                <input
                  type="date"
                  value={form.hanHoanThanh || lenhCat.hanHoanThanh || ""}
                  onChange={(e) => setForm((p) => ({ ...p, hanHoanThanh: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Ghi chú điều phối tổng hợp:</label>
              <textarea
                value={form.ghiChuDieuPhoi || ""}
                onChange={(e) => setForm((p) => ({ ...p, ghiChuDieuPhoi: e.target.value }))}
                placeholder="Nhập ghi chú những gì cần chuẩn bị gấp, tiến độ xưởng..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-16"
              />
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Lưu thông tin điều phối
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
