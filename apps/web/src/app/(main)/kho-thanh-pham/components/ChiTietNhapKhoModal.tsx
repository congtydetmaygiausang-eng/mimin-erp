"use client";

import React, { useState } from "react";
import { 
  Package, 
  Warehouse, 
  CheckCircle2, 
  ArrowRight, 
  Tag, 
  ShoppingBag, 
  DollarSign, 
  MapPin, 
  FileText, 
  Layers, 
  Image as ImageIcon,
  Check,
  Loader2,
  Calendar,
  Building2,
  Sparkles,
  Info
} from "lucide-react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { DS_KENH_BAN, type KenhBan } from "../data";
import { tinhGiaVonLenhCat } from "@/lib/gia-von-lenh-cat";
import { type KenhBan as KenhBanBangGia } from "@/lib/data/bang-gia-store";

interface ChiTietNhapKhoModalProps {
  lenhCat: any;
  giaoDich: any[];
  kenhNhapKho: KenhBan[];
  setKenhNhapKho: React.Dispatch<React.SetStateAction<KenhBan[]>>;
  loadingBangGia: boolean;
  layGia: (kenh: KenhBanBangGia, maSP: string, maSKU?: string, sl?: number) => number | null;
  onClose: () => void;
  onConfirmNhapKho: (data: { kenhBan: KenhBan[]; viTri: string; ghiChu: string }) => Promise<void>;
  isSubmitting: boolean;
  onPreviewImage?: (imgUrl: string) => void;
}

const KENH_BAN_ICONS: Record<string, string> = {
  "ban-le": "🛍️",
  "ban-si": "📦",
  "ban-lo": "🏭",
  "tiktok": "🎵",
  "shopee": "🧡",
};

export function ChiTietNhapKhoModal({
  lenhCat,
  giaoDich,
  kenhNhapKho,
  setKenhNhapKho,
  loadingBangGia,
  layGia,
  onClose,
  onConfirmNhapKho,
  isSubmitting,
  onPreviewImage,
}: ChiTietNhapKhoModalProps) {
  const [viTri, setViTri] = useState("Khu A1");
  const [ghiChu, setGhiChu] = useState(`Nhập kho hoàn thành từ lệnh cắt ${lenhCat.id}`);

  // Tính toán dữ liệu
  const ketQuaGiaVon = tinhGiaVonLenhCat(lenhCat, giaoDich);
  const giaVon1SP = Math.round(
    ketQuaGiaVon.giaVon1SP ||
    lenhCat.bangCOGS?.giaVonBinhQuan ||
    lenhCat.bangCOGS?.giaVon1SP ||
    lenhCat.giaVonDuKien ||
    lenhCat.donGia ||
    0
  );
  const tongSL = lenhCat.tongSL || 0;
  const tongGiaTri = tongSL * giaVon1SP;
  const maSPChuan = lenhCat.maSP || lenhCat.id;

  const anhDaiDien =
    (lenhCat.hinhAnh || (maSPChuan && /^M\d{2}$/i.test(maSPChuan) ? `/product-models/${maSPChuan}.png` : "")) ||
    lenhCat.hinhMauInTheu ||
    "";

  const dongGoiPCs = lenhCat.phanCong?.filter(
    (pc: any) => pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói")
  ) || [];
  const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
  const dsMauLC = lenhCat.dsMau && lenhCat.dsMau.length > 0 ? lenhCat.dsMau : [{ ten: "Mặc định", img: "" }];

  // Chi tiết từng màu
  const danhSachMau = dsMauLC.map((m: any, idx: number) => {
    const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
    const sl = ct?.soLuongDat ?? Math.round((lenhCat.tongSL || 0) / dsMauLC.length);
    const chiTietSize = (ct?.sizes || m.phanBoSize || []) as Array<{ size: string; sl: number }>;
    const anhMau = m.img || anhDaiDien;
    const maSKU = m.maSKU || `${maSPChuan}-${m.ten}`;
    const thanhTien = sl * giaVon1SP;

    return {
      ten: m.ten,
      maSKU,
      sl,
      chiTietSize,
      anhMau,
      thanhTien,
      dinhMuc: m.dinhMuc,
    };
  });

  const toggleKenhBan = (kenh: KenhBan) => {
    setKenhNhapKho((current) =>
      current.includes(kenh)
        ? current.filter((item) => item !== kenh)
        : [...current, kenh]
    );
  };

  const handleConfirm = () => {
    if (kenhNhapKho.length === 0) {
      alert("Vui lòng chọn ít nhất 1 loại giá bán áp dụng!");
      return;
    }
    onConfirmNhapKho({ kenhBan: kenhNhapKho, viTri: viTri.trim() || "Khu A1", ghiChu });
  };

  return (
    <ResponsiveModal
      open={true}
      maxWidth="4xl"
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-md">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
              CHI TIẾT NHẬP KHO TỪ SẢN XUẤT
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Sẵn sàng lưu kho
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kiểm tra thông tin số lượng, bảng size và định giá trước khi lưu vào Kho Thành Phẩm
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-6 p-2 md:p-4 text-slate-800">
        {/* ================= 1. CARD TỔNG QUAN SẢN PHẨM ================= */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm flex flex-col md:flex-row gap-5">
          {/* Ảnh mẫu */}
          <div 
            className="w-24 h-32 md:w-28 md:h-36 rounded-xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden flex-shrink-0 cursor-zoom-in relative group"
            onClick={() => {
              if (anhDaiDien && onPreviewImage) onPreviewImage(anhDaiDien);
            }}
          >
            {anhDaiDien ? (
              <img src={anhDaiDien} alt={lenhCat.tenSP} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-[10px] font-bold text-slate-400">Chưa có ảnh</span>
              </div>
            )}
            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] font-mono font-black text-white">
              {maSPChuan}
            </div>
          </div>

          {/* Chi tiết sản phẩm */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono font-black text-xs md:text-sm text-sky-800 bg-sky-100/80 px-2.5 py-0.5 rounded-md border border-sky-200 shadow-sm">
                  {lenhCat.id}
                </span>
                <span className="font-mono font-black text-xs md:text-sm text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-md border border-indigo-200 shadow-sm">
                  MÃ: {maSPChuan}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-md">
                  {lenhCat.loaiSP || "Bộ Trụ"}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                  Khách: {lenhCat.khachHang || "MANPJ / POLOMIMIN"}
                </span>
              </div>

              <h3 className="text-lg md:text-xl font-black text-slate-900 leading-snug">
                {lenhCat.tenSP || `Sản phẩm từ ${lenhCat.id}`}
              </h3>

              <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-4">
                <span>Tỉ lệ size: <strong className="text-slate-700">{lenhCat.tiLeSize || "1:1:1:1"}</strong></span>
                {lenhCat.hanHoanThanh && (
                  <span>Hạn giao: <strong className="text-slate-700">{lenhCat.hanHoanThanh}</strong></span>
                )}
                <span>Ngày nhập kho: <strong className="text-emerald-700">{new Date().toLocaleDateString("vi-VN")}</strong></span>
              </div>
            </div>

            {/* 3 Thẻ KPI con số chính */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-slate-200/80">
              <div className="bg-white rounded-xl border border-sky-200 p-2.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-sky-600 tracking-wider">Tổng SL Nhập Kho</div>
                <div className="text-xl font-black text-sky-950 mt-0.5">
                  {tongSL.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-slate-500">SP</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-2.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-emerald-600 tracking-wider">Giá Vốn / SP</div>
                <div className="text-xl font-black text-emerald-900 mt-0.5">
                  {giaVon1SP.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-slate-500">đ/SP</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-purple-200 p-2.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase text-purple-600 tracking-wider">Tổng Giá Trị Tồn Kho</div>
                <div className="text-xl font-black text-purple-950 mt-0.5">
                  {tongGiaTri.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-slate-500">đ</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. BẢNG PHÂN BỔ MÀU & SIZE NHẬP KHO ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3.5 md:px-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h4 className="font-black text-sm text-slate-800 uppercase tracking-wide">
                Chi tiết phân bổ {danhSachMau.length} biến thể màu & size sẽ lưu kho
              </h4>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Mỗi màu sẽ trở thành 1 SKU độc lập trong Kho Thành Phẩm
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">#</th>
                  <th className="py-2.5 px-3">Màu sắc</th>
                  <th className="py-2.5 px-3">Phân bổ size (Số lượng)</th>
                  <th className="py-2.5 px-3 text-right">SL Nhập</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền (Giá vốn)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {danhSachMau.map((m, index) => (
                  <tr key={m.ten + index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0 cursor-zoom-in"
                          onClick={() => {
                            if (m.anhMau && onPreviewImage) onPreviewImage(m.anhMau);
                          }}
                        >
                          {m.anhMau ? (
                            <img src={m.anhMau} alt={m.ten} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm uppercase">{m.ten}</div>
                          <div className="font-mono text-[10px] text-slate-400 font-bold">{m.maSKU}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      {m.chiTietSize && m.chiTietSize.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {m.chiTietSize.map((sz: any) => (
                            <span 
                              key={sz.size}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200 shadow-2xs"
                            >
                              <span>{sz.size}:</span>
                              <span className="font-extrabold text-sky-950">{sz.sl}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Theo tỷ lệ {lenhCat.tiLeSize || "1:1:1:1"}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-black text-slate-800 text-sm">
                        {m.sl.toLocaleString("vi-VN")}
                      </span>{" "}
                      <span className="text-[11px] text-slate-400 font-medium">SP</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="font-extrabold text-emerald-800 text-xs">
                        {m.thanhTien.toLocaleString("vi-VN")}đ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-right text-slate-700 uppercase font-black">
                    Tổng cộng {danhSachMau.length} màu:
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-base text-sky-900">
                    {tongSL.toLocaleString("vi-VN")} SP
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-sm text-emerald-900">
                    {tongGiaTri.toLocaleString("vi-VN")}đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ================= 3. CHỌN LOẠI GIÁ BÁN & KÊNH BÁN ================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-600" /> Chọn loại giá bán áp dụng cho đợt nhập kho này
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Đã chọn: <strong className="text-emerald-700">{kenhNhapKho.length} kênh</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {DS_KENH_BAN.map((kenh) => {
              const selected = kenhNhapKho.includes(kenh.value);
              const giaCacMau = dsMauLC
                .map((m: any) => layGia(kenh.value as KenhBanBangGia, maSPChuan, m.maSKU, Math.max(1, m.slDuKien || m.slThucTe || 1)))
                .filter((gia): gia is number => gia != null);
              const coDuGia = dsMauLC.length > 0 && giaCacMau.length === dsMauLC.length;
              const min = giaCacMau.length ? Math.min(...giaCacMau) : 0;
              const max = giaCacMau.length ? Math.max(...giaCacMau) : 0;

              return (
                <button
                  key={kenh.value}
                  type="button"
                  onClick={() => toggleKenhBan(kenh.value)}
                  className={`rounded-xl border-2 p-3 text-left transition-all duration-200 flex flex-col justify-between relative overflow-hidden group ${
                    selected
                      ? "border-emerald-600 bg-emerald-50/60 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-lg">{KENH_BAN_ICONS[kenh.value] || "🏷️"}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        selected ? "bg-emerald-600 text-white" : "border border-slate-300 bg-slate-50"
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{kenh.label}</div>
                    <div className={`mt-0.5 text-[11px] font-black ${coDuGia ? "text-emerald-700" : "text-amber-700"}`}>
                      {coDuGia
                        ? `${min.toLocaleString("vi-VN")}${max !== min ? ` - ${max.toLocaleString("vi-VN")}` : ""}đ`
                        : "Giá chuẩn (tự động)"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 italic flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Giá bán được tự động đồng bộ theo Bảng giá bán. Bạn có thể thay đổi chi tiết sau tại bảng Kho thành phẩm.
          </p>
        </div>

        {/* ================= 4. VỊ TRÍ LƯU KHO & GHI CHÚ ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Vị trí lưu kho thành phẩm
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={viTri}
                onChange={(e) => setViTri(e.target.value)}
                placeholder="VD: Khu A1, Kệ 03, Tầng 2"
                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex gap-1 shrink-0">
                {["Khu A1", "Khu A2", "Khu B1"].map((vt) => (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => setViTri(vt)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-colors ${
                      viTri === vt ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Ghi chú nhập kho
            </label>
            <input
              type="text"
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
              placeholder="Ghi chú đợt nhập kho này..."
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* ================= 5. FOOTER ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Hệ thống sẽ cập nhật trạng thái Lệnh Cắt sang <strong className="text-emerald-700 font-bold">Hoàn Thành</strong> và tự động đồng bộ sang <strong className="text-indigo-700 font-bold">Danh Mục Sản Phẩm</strong>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-bold text-slate-700 text-xs transition-colors"
            >
              Hủy / Đóng
            </button>

            <button
              type="button"
              disabled={isSubmitting || loadingBangGia || kenhNhapKho.length === 0}
              onClick={handleConfirm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2B4C3E] hover:bg-[#1E372C] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý nhập kho...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận Nhập Kho Thành Phẩm ({tongSL.toLocaleString("vi-VN")} SP)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
}
