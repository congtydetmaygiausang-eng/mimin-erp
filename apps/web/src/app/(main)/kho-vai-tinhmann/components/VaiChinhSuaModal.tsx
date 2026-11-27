"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Layers, X, CheckCircle2, SlidersHorizontal, RefreshCw,
  ShieldCheck, Calculator, Package, AlertCircle,
  Tag, ArrowRight, Check, Percent
} from "lucide-react";
import { toast } from "sonner";
import { Portal } from "@/components/ui/Portal";
import { formatVND, type KhoVai } from "@/lib/data/real-data";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { updateVaiInfo, getInventoryByMaVT, upsertInventoryItem, type ThuongHieuVai } from "@/lib/inventory-engine";
import {
  getChiTietGia3Khau, saveChiTietGia3Khau,
  type ChiTietGia3Khau
} from "@/lib/fabric-cost-breakdown";

interface VaiChinhSuaModalProps {
  maVT: string;
  vatTu?: KhoVai;
  inventory?: KhoVai[];
  onClose: () => void;
  onSuccess: () => void;
}

export function VaiChinhSuaModal({
  maVT: initialMaVT,
  vatTu,
  inventory = [],
  onClose,
  onSuccess,
}: VaiChinhSuaModalProps) {
  const [maVT, setMaVT] = useState(initialMaVT);
  const vt = inventory.find((v) => v.maVT === maVT) || (maVT === initialMaVT ? vatTu : undefined);
  const { list: nccList } = useNhaCungCap();

  // Thông tin cơ bản của loại vải
  const [tenVT, setTenVT] = useState(vt?.tenVT || "");
  const [mauSac, setMauSac] = useState(vt?.mauSac || "");
  const [thuongHieu, setThuongHieu] = useState<ThuongHieuVai>(vt?.thuongHieu || "polomimin");
  const [tonKho, setTonKho] = useState<number>(vt?.tonKho ?? 0);
  const [donGia, setDonGia] = useState<number>(vt?.donGia ?? 74000);
  const [isCustomDonGia, setIsCustomDonGia] = useState(false);

  // Danh sách NCC theo nghiệp vụ 3 khâu thực tế đang có trên hệ thống MIMIN ERP
  const nccSoiOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("sợi") || v.includes("soi") || n.ma_ncc === "NCC-001" || n.ma_ncc === "NCC-002" || n.ma_ncc === "NCC-01" || n.ma_ncc === "NCC-02";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-002", ma_ncc: "NCC-002", ten_ncc: "CT TNHH TM Quốc tế Sammoon", don_gia: "42.000 đ/kg", loai: "Bán sợi" },
      { id: "NCC-001", ma_ncc: "NCC-001", ten_ncc: "Công ty Lucky Avanti", don_gia: "45.000 đ/kg", loai: "Bán sợi" },
    ];
  }, [nccList]);

  const nccDetOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("dệt") || v.includes("det") || n.ma_ncc === "NCC-003" || n.ma_ncc === "NCC-03";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-003", ma_ncc: "NCC-003", ten_ncc: "CT TNHH SX TM Dệt May Hải Dương", don_gia: "10.000 đ/kg", loai: "Dệt" },
    ];
  }, [nccList]);

  const nccNhuomOptions = useMemo(() => {
    const list = nccList.filter(n => {
      const v = (n.loai || "").toLowerCase();
      return v.includes("nhuộm") || v.includes("nhuom") || n.ma_ncc === "NCC-004" || n.ma_ncc === "NCC-014" || n.ma_ncc === "NCC-04" || n.ma_ncc === "NCC-14";
    });
    if (list.length > 0) return list;
    return [
      { id: "NCC-004", ma_ncc: "NCC-004", ten_ncc: "CT TNHH MTV Dệt Nhuộm Thái Thành", don_gia: "22.000 đ/kg", loai: "Nhuộm" },
      { id: "NCC-014", ma_ncc: "NCC-014", ten_ncc: "CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)", don_gia: "22.000 đ/kg", loai: "Nhuộm" },
    ];
  }, [nccList]);

  // Cấu hình nguồn giá 3 khâu
  const initialGia3Khau = useMemo(() => {
    return getChiTietGia3Khau(maVT, vt?.donGia, vt?.tenVT, vt?.mauSac);
  }, [maVT, vt?.donGia, vt?.tenVT, vt?.mauSac]);

  // 1. Khâu Sợi (Sammoon / Lucky Avanti)
  const [nccSoi, setNccSoi] = useState(initialGia3Khau.nccSoi || "CT TNHH TM Quốc tế Sammoon");
  const [loaiSoi, setLoaiSoi] = useState(initialGia3Khau.loaiSoi || "Sợi 30s Poly Spandex (Sammoon)");
  const [giaSoi, setGiaSoi] = useState<number>(initialGia3Khau.giaSoi || 42000);
  const [dinhMucSoi, setDinhMucSoi] = useState<number>(initialGia3Khau.dinhMucSoi || 1.0);
  const [haoHutSoi, setHaoHutSoi] = useState<number>(initialGia3Khau.haoHutSoi || 0);
  const [vatSoi, setVatSoi] = useState<number>(initialGia3Khau.vatSoi || 0);

  // 2. Khâu Dệt vải mộc (Dệt May Hải Dương)
  const [nccDet, setNccDet] = useState(initialGia3Khau.nccDet || "CT TNHH SX TM Dệt May Hải Dương");
  const [kieuDet, setKieuDet] = useState(initialGia3Khau.kieuDet || (vt?.loai || "Cá sấu 4 chiều (Pique)"));
  const [giaDet, setGiaDet] = useState<number>(initialGia3Khau.giaDet || 10000);
  const [haoHutDet, setHaoHutDet] = useState<number>(initialGia3Khau.haoHutDet || 0);
  const [vatDet, setVatDet] = useState<number>(initialGia3Khau.vatDet || 0);

  // 3. Khâu Nhuộm & hoàn tất (Dệt Nhuộm Thái Thành / Gigatex)
  const [nccNhuom, setNccNhuom] = useState(initialGia3Khau.nccNhuom || "CT TNHH MTV Dệt Nhuộm Thái Thành");
  const [kieuNhuom, setKieuNhuom] = useState(initialGia3Khau.kieuNhuom || "Nhuộm cao áp OZ chống nhiễm màu");
  const [giaNhuom, setGiaNhuom] = useState<number>(initialGia3Khau.giaNhuom || 22000);
  const [phuPhiNhuom, setPhuPhiNhuom] = useState<number>(initialGia3Khau.phuPhiNhuom || 0);
  const [haoHutNhuom, setHaoHutNhuom] = useState<number>(initialGia3Khau.haoHutNhuom || 0);
  const [vatNhuom, setVatNhuom] = useState<number>(initialGia3Khau.vatNhuom || 0);

  // Tính chi phí 3 khâu thời gian thực (có Hao hụt & VAT)
  const heSoSoi = (1 + (haoHutSoi || 0) / 100) * (1 + (vatSoi || 0) / 100);
  const chiPhiSoiQuyDoi = Math.round((giaSoi || 0) * (dinhMucSoi || 1.0) * heSoSoi);

  const heSoDet = (1 + (haoHutDet || 0) / 100) * (1 + (vatDet || 0) / 100);
  const chiPhiDetQuyDoi = Math.round((giaDet || 0) * heSoDet);

  const heSoNhuom = (1 + (haoHutNhuom || 0) / 100) * (1 + (vatNhuom || 0) / 100);
  const chiPhiNhuomQuyDoi = Math.round(((giaNhuom || 0) + (phuPhiNhuom || 0)) * heSoNhuom);

  const donGia3KhauQuyDoi = chiPhiSoiQuyDoi + chiPhiDetQuyDoi + chiPhiNhuomQuyDoi;

  // Nếu người dùng không chọn chế độ sửa tay đơn giá, tự động đồng bộ đơn giá từ 3 khâu
  useEffect(() => {
    if (!isCustomDonGia && donGia3KhauQuyDoi > 0) {
      setDonGia(donGia3KhauQuyDoi);
    }
  }, [donGia3KhauQuyDoi, isCustomDonGia]);

  // Tỷ trọng %
  const tongChiPhi3Khau = Math.max(1, donGia3KhauQuyDoi);
  const pctSoi = Math.round((chiPhiSoiQuyDoi / tongChiPhi3Khau) * 100);
  const pctDet = Math.round((chiPhiDetQuyDoi / tongChiPhi3Khau) * 100);
  const pctNhuom = Math.max(0, 100 - pctSoi - pctDet);

  // Quy đổi tồn kho
  const soCayQuyDoi = (tonKho / 20).toFixed(1);
  const soMetQuyDoi = Math.round(tonKho * 3.2);
  const tongThanhTienTon = Math.round(tonKho * donGia);


  // Khôi phục chuẩn 74k
  const handleResetChuan = () => {
    setNccSoi("CT TNHH TM Quốc tế Sammoon");
    setLoaiSoi("Sợi 30s Poly Spandex (Sammoon)");
    setGiaSoi(42000);
    setDinhMucSoi(1.0);
    setHaoHutSoi(0);
    setVatSoi(0);

    setNccDet("CT TNHH SX TM Dệt May Hải Dương");
    setKieuDet("Cá sấu 4 chiều (Pique)");
    setGiaDet(10000);
    setHaoHutDet(0);
    setVatDet(0);

    setNccNhuom("CT TNHH MTV Dệt Nhuộm Thái Thành");
    setKieuNhuom("Nhuộm cao áp OZ chống nhiễm màu");
    setGiaNhuom(22000);
    setPhuPhiNhuom(0);
    setHaoHutNhuom(0);
    setVatNhuom(0);

    setIsCustomDonGia(false);
    toast.info("Đã khôi phục thông số 3 khâu chuẩn hệ thống: 74.000 đ/kg");
  };

  // Xử lý Lưu
  const [saving, setSaving] = useState(false);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenVT.trim()) {
      toast.error("Vui lòng nhập tên loại vải");
      return;
    }
    if (donGia <= 0) {
      toast.error("Đơn giá vải phải lớn hơn 0");
      return;
    }

    setSaving(true);
    try {
      // 1. Cập nhật thông tin kho vải vào inventory-engine
      const updatedOk = updateVaiInfo(maVT, {
        tenVT: tenVT.trim(),
        mauSac: mauSac.trim(),
        thuongHieu,
        donGia,
        tonKho: Number(tonKho) || 0,
      });

      if (!updatedOk) {
        toast.error("Không tìm thấy mã vải để cập nhật");
        setSaving(false);
        return;
      }

      // 2. Lưu chi tiết cấu thành giá 3 khâu vào localStorage & dispatch event
      saveChiTietGia3Khau({
        maVT,
        tenVT: tenVT.trim(),
        mauSac: mauSac.trim(),
        nccSoi,
        loaiSoi,
        giaSoi,
        dinhMucSoi,
        haoHutSoi,
        vatSoi,
        chiPhiSoi: chiPhiSoiQuyDoi,
        nccDet,
        kieuDet,
        giaDet,
        haoHutDet,
        vatDet,
        chiPhiDet: chiPhiDetQuyDoi,
        nccNhuom,
        kieuNhuom,
        giaNhuom,
        phuPhiNhuom,
        haoHutNhuom,
        vatNhuom,
        chiPhiNhuom: chiPhiNhuomQuyDoi,
        donGiaQuyDoi: donGia,
        ngayCapNhat: new Date().toISOString().split("T")[0],
        ghiChu: `Chỉnh sửa chi tiết mẻ vải: ${tenVT} - ${mauSac}`,
      });

      // 3. Đồng bộ Supabase nếu có item
      const freshItem = getInventoryByMaVT(maVT);
      if (freshItem) {
        try {
          await upsertInventoryItem(freshItem);
        } catch (err) {
          console.warn("Chưa đồng bộ Supabase:", err);
        }
      }

      toast.success(
        `🎉 Đã cập nhật thành công loại vải "${tenVT}" (Đơn giá: ${formatVND(donGia)}/kg, Tồn kho: ${Number(tonKho).toLocaleString()} kg)`
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi lưu thay đổi");
    } finally {
      setSaving(false);
    }
  };

  if (!vt) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-auto animate-slide-up max-h-[94vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER MODAL */}
          <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                    Kho Vải Thành Phẩm
                  </span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {vt.maVT}
                  </span>
                  {inventory.length > 0 && (
                    <select
                      value={maVT}
                      onChange={(e) => {
                        const newMa = e.target.value;
                        setMaVT(newMa);
                        const nextVt = inventory.find(i => i.maVT === newMa);
                        if (nextVt) {
                          setTenVT(nextVt.tenVT);
                          setMauSac(nextVt.mauSac);
                          setThuongHieu(nextVt.thuongHieu || "polomimin");
                          setTonKho(nextVt.tonKho || 0);
                          setDonGia(nextVt.donGia || 74000);
                        }
                      }}
                      className="text-xs font-bold py-0.5 px-2 rounded-lg border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      title="Chuyển sang mẻ vải khác"
                    >
                      {inventory.map((item) => (
                        <option key={item.maVT} value={item.maVT}>
                          {item.maVT} - {item.tenVT} ({item.mauSac})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
                  Chỉnh sửa chi tiết mẻ vải: {tenVT || vt.tenVT} - {mauSac || vt.mauSac}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetChuan}
                className="px-2.5 py-1 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 rounded-lg border border-teal-200 dark:border-teal-800 transition flex items-center gap-1 cursor-pointer"
                title="Khôi phục lại chuẩn 3 khâu 74.000 đ/kg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Chuẩn hệ thống (74k)
              </button>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CUỘN FORM NỘI DUNG */}
          <form id="form-edit-vai-modal" onSubmit={handleSave} className="overflow-y-auto pr-1 flex-1 py-3.5 space-y-4">
            {/* KHỐI 1: THÔNG TIN CƠ BẢN VẢI & PHÂN LOẠI */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-teal-600" />
                  1. Thông tin định danh loại vải
                </span>
                <span className="text-[11px] text-slate-500">Mã: <b className="font-mono text-slate-700 dark:text-slate-200">{vt.maVT}</b></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tên loại vải *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                    value={tenVT}
                    onChange={(e) => setTenVT(e.target.value)}
                    placeholder="VD: Trắng, Xám trắng, Kem..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Màu sắc
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500"
                      value={mauSac}
                      onChange={(e) => setMauSac(e.target.value)}
                      placeholder="VD: Trắng, Đen, Đậu..."
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Thương hiệu phân loại *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setThuongHieu("polomimin")}
                      className={`py-1 px-2 text-xs font-bold rounded-md transition text-center ${
                        thuongHieu === "polomimin"
                          ? "bg-teal-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      🌱 Polomimin
                    </button>
                    <button
                      type="button"
                      onClick={() => setThuongHieu("manpj")}
                      className={`py-1 px-2 text-xs font-bold rounded-md transition text-center ${
                        thuongHieu === "manpj"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      🧵 ManPJ
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 2: CHI TIẾT NƠI CUNG CẤP 3 KHÂU SỢI - DỆT - NHUỘM */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                  2. Nơi Nhà cung cấp & Đơn giá 3 khâu của mẻ vải (Có Hao hụt & VAT)
                </h4>
                <span className="text-[11px] text-slate-500 italic">
                  Tự động lưu và cập nhật vào bảng tính giá vốn mẻ vải
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* KHÂU 1: NHẬP SỢI (BLUE / SKY) */}
                <div className="p-3.5 rounded-xl border-2 border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-sky-200 dark:border-sky-800 mb-2.5">
                      <span className="text-xs font-black text-sky-900 dark:text-sky-300 uppercase flex items-center gap-1.5">
                        🧵 Khâu 1: Nhập Sợi
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-200/80 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-bold">
                        {pctSoi}% giá vải
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Nhà cung cấp sợi *
                        </label>
                        <select
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-sky-300 dark:border-sky-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          value={nccSoi}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNccSoi(val);
                            if (val.includes("Sammoon")) {
                              setGiaSoi(42000);
                              setLoaiSoi("Sợi 30s Poly Spandex (Sammoon)");
                            } else if (val.includes("Lucky Avanti")) {
                              setGiaSoi(45000);
                              setLoaiSoi("Sợi cotton 30s/32s Compact");
                            }
                          }}
                        >
                          {nccSoiOptions.map((n) => (
                            <option key={n.ma_ncc} value={n.ten_ncc}>
                              {n.ten_ncc} {n.don_gia ? `(${n.don_gia})` : ""}
                            </option>
                          ))}
                          <option value="CT TNHH TM Quốc tế Sammoon">CT TNHH TM Quốc tế Sammoon (42.000 đ/kg)</option>
                          <option value="Công ty Lucky Avanti">Công ty Lucky Avanti (45.000 đ/kg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Loại sợi / Chỉ số
                        </label>
                        <input
                          type="text"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900"
                          value={loaiSoi}
                          onChange={(e) => setLoaiSoi(e.target.value)}
                          placeholder="VD: Sợi 30s Poly Spandex..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Giá sợi (đ/kg)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            className="w-full px-2 py-1.5 text-xs font-bold text-sky-800 dark:text-sky-300 bg-white dark:bg-slate-900 rounded-lg border border-sky-300 dark:border-sky-700"
                            value={giaSoi || ""}
                            onChange={(e) => setGiaSoi(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Định mức (kg/kg)
                          </label>
                          <input
                            type="number"
                            min={0.8}
                            step={0.01}
                            className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800"
                            value={dinhMucSoi || 1.0}
                            onChange={(e) => setDinhMucSoi(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-sky-200/60 dark:border-sky-800/60">
                        <div>
                          <label className="text-[11px] font-bold text-sky-900 dark:text-sky-300 block mb-0.5">
                            Hao hụt sợi (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800"
                            value={haoHutSoi || ""}
                            onChange={(e) => setHaoHutSoi(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-sky-900 dark:text-sky-300 block mb-0.5">
                            Thuế VAT sợi (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800"
                            value={vatSoi || ""}
                            onChange={(e) => setVatSoi(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sky-200 dark:border-sky-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300">Chi phí sợi/kg vải:</span>
                      <span className="text-sm font-black text-sky-700 dark:text-sky-400 font-mono">
                        {formatVND(chiPhiSoiQuyDoi)}
                      </span>
                    </div>
                    {(haoHutSoi > 0 || vatSoi > 0) && (
                      <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                        (Đã gồm {haoHutSoi > 0 ? `HH:${haoHutSoi}%` : ""} {haoHutSoi > 0 && vatSoi > 0 ? "+" : ""} {vatSoi > 0 ? `VAT:${vatSoi}%` : ""})
                      </div>
                    )}
                  </div>
                </div>

                {/* KHÂU 2: DỆT VẢI MỘC (PURPLE / VIOLET) */}
                <div className="p-3.5 rounded-xl border-2 border-violet-300 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-violet-200 dark:border-violet-800 mb-2.5">
                      <span className="text-xs font-black text-violet-900 dark:text-violet-300 uppercase flex items-center gap-1.5">
                        🏭 Khâu 2: Dệt Vải Mộc
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-200/80 dark:bg-violet-900 text-violet-800 dark:text-violet-200 font-bold">
                        {pctDet}% giá vải
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Xưởng dệt / NCC dệt *
                        </label>
                        <select
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          value={nccDet}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNccDet(val);
                            if (val.includes("Hải Dương")) {
                              setGiaDet(10000);
                            }
                          }}
                        >
                          {nccDetOptions.map((n) => (
                            <option key={n.ma_ncc} value={n.ten_ncc}>
                              {n.ten_ncc} {n.don_gia ? `(${n.don_gia})` : ""}
                            </option>
                          ))}
                          <option value="CT TNHH SX TM Dệt May Hải Dương">CT TNHH SX TM Dệt May Hải Dương (10.000 đ/kg)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Kiểu dệt / Cấu trúc
                        </label>
                        <input
                          type="text"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900"
                          value={kieuDet}
                          onChange={(e) => setKieuDet(e.target.value)}
                          placeholder="VD: Cá sấu 4 chiều (Pique)..."
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Đơn giá công dệt (đ/kg mộc)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          className="w-full px-2 py-1.5 text-xs font-bold text-violet-800 dark:text-violet-300 bg-white dark:bg-slate-900 rounded-lg border border-violet-300 dark:border-violet-700"
                          value={giaDet || ""}
                          onChange={(e) => setGiaDet(Number(e.target.value))}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-violet-200/60 dark:border-violet-800/60">
                        <div>
                          <label className="text-[11px] font-bold text-violet-900 dark:text-violet-300 block mb-0.5">
                            Hao hụt dệt (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900 rounded-lg border border-violet-200 dark:border-violet-800"
                            value={haoHutDet || ""}
                            onChange={(e) => setHaoHutDet(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-violet-900 dark:text-violet-300 block mb-0.5">
                            Thuế VAT dệt (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900 rounded-lg border border-violet-200 dark:border-violet-800"
                            value={vatDet || ""}
                            onChange={(e) => setVatDet(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-violet-200 dark:border-violet-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-violet-800 dark:text-violet-300">Công dệt/kg vải:</span>
                      <span className="text-sm font-black text-violet-700 dark:text-violet-400 font-mono">
                        {formatVND(chiPhiDetQuyDoi)}
                      </span>
                    </div>
                    {(haoHutDet > 0 || vatDet > 0) && (
                      <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                        (Đã gồm {haoHutDet > 0 ? `HH:${haoHutDet}%` : ""} {haoHutDet > 0 && vatDet > 0 ? "+" : ""} {vatDet > 0 ? `VAT:${vatDet}%` : ""})
                      </div>
                    )}
                  </div>
                </div>

                {/* KHÂU 3: NHUỘM & HOÀN TẤT (ORANGE / AMBER) */}
                <div className="p-3.5 rounded-xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-800 mb-2.5">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase flex items-center gap-1.5">
                        🧪 Khâu 3: Nhuộm & Hoàn Tất
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold">
                        {pctNhuom}% giá vải
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Nhà máy nhuộm / NCC nhuộm *
                        </label>
                        <select
                          className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          value={nccNhuom}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNccNhuom(val);
                            if (val.includes("Thái Thành") || val.includes("GIGATEX")) {
                              setGiaNhuom(22000);
                            }
                          }}
                        >
                          {nccNhuomOptions.map((n) => (
                            <option key={n.ma_ncc} value={n.ten_ncc}>
                              {n.ten_ncc}
                            </option>
                          ))}
                          <option value="CT TNHH MTV Dệt Nhuộm Thái Thành">CT TNHH MTV Dệt Nhuộm Thái Thành (22.000 đ/kg)</option>
                          <option value="CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)">CÔNG TY GIGATEX = Dệt Nhuộm Thái Thành (anh Hùng)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                          Quy trình / Kiểu nhuộm
                        </label>
                        <input
                          type="text"
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900"
                          value={kieuNhuom}
                          onChange={(e) => setKieuNhuom(e.target.value)}
                          placeholder="VD: Nhuộm cao áp OZ chống nhiễm..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Công nhuộm (đ/kg)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            className="w-full px-2 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700"
                            value={giaNhuom || ""}
                            onChange={(e) => setGiaNhuom(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                            Phụ phí (đ/kg)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step={500}
                            className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                            value={phuPhiNhuom || ""}
                            onChange={(e) => setPhuPhiNhuom(Number(e.target.value))}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                        <div>
                          <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                            Hao hụt nhuộm (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-rose-700 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                            value={haoHutNhuom || ""}
                            onChange={(e) => setHaoHutNhuom(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                            Thuế VAT nhuộm (%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            placeholder="0%"
                            className="w-full px-2 py-1.5 text-xs font-semibold text-emerald-700 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                            value={vatNhuom || ""}
                            onChange={(e) => setVatNhuom(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Công nhuộm/kg vải:</span>
                      <span className="text-sm font-black text-amber-700 dark:text-amber-400 font-mono">
                        {formatVND(chiPhiNhuomQuyDoi)}
                      </span>
                    </div>
                    {(haoHutNhuom > 0 || vatNhuom > 0) && (
                      <div className="text-[10px] text-right text-slate-500 font-mono mt-0.5">
                        (Đã gồm {haoHutNhuom > 0 ? `HH:${haoHutNhuom}%` : ""} {haoHutNhuom > 0 && vatNhuom > 0 ? "+" : ""} {vatNhuom > 0 ? `VAT:${vatNhuom}%` : ""})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* KHỐI 3: QUY ĐỔI GIÁ THÀNH 3 KHÂU & TÙY CHỈNH ĐƠN GIÁ / KG */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-400/80 dark:border-emerald-600/60 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200 dark:border-emerald-800/60">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Công thức quy đổi giá thành 1 kg vải hoàn chỉnh:
                  </span>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1 flex flex-wrap items-center gap-1.5 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200">
                      Sợi: {formatVND(chiPhiSoiQuyDoi)}
                    </span>
                    <span>+</span>
                    <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200">
                      Dệt: {formatVND(chiPhiDetQuyDoi)}
                    </span>
                    <span>+</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      Nhuộm: {formatVND(chiPhiNhuomQuyDoi)}
                    </span>
                    <span>=</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300">
                      {formatVND(donGia3KhauQuyDoi)}/kg
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-sm flex items-center gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block text-left">Đơn giá / 1 kg</span>
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      className="w-32 px-2 py-1 text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono text-right border border-emerald-200 dark:border-emerald-800 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20"
                      value={donGia || ""}
                      onChange={(e) => {
                        setDonGia(Number(e.target.value));
                        setIsCustomDonGia(true);
                      }}
                      title="Chỉnh sửa đơn giá/kg vải xuất xưởng"
                    />
                  </div>
                  {isCustomDonGia && (
                    <button
                      type="button"
                      onClick={() => {
                        setDonGia(donGia3KhauQuyDoi);
                        setIsCustomDonGia(false);
                        toast.info("Đã áp dụng lại đơn giá quy đổi từ 3 khâu");
                      }}
                      className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition"
                      title="Đồng bộ theo giá 3 khâu"
                    >
                      Dùng giá 3 khâu
                    </button>
                  )}
                </div>
              </div>

              {/* THANH TỶ TRỌNG % */}
              <div>
                <div className="flex justify-between text-[11px] font-bold mb-1 text-slate-600 dark:text-slate-400">
                  <span>Tỷ trọng chi phí 3 khâu cấu thành:</span>
                  <span>Sợi: {pctSoi}% · Dệt: {pctDet}% · Nhuộm: {pctNhuom}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 flex overflow-hidden shadow-inner">
                  <div style={{ width: `${pctSoi}%` }} className="bg-sky-500 h-full transition-all" title={`Sợi: ${pctSoi}%`} />
                  <div style={{ width: `${pctDet}%` }} className="bg-violet-500 h-full transition-all" title={`Dệt: ${pctDet}%`} />
                  <div style={{ width: `${pctNhuom}%` }} className="bg-amber-500 h-full transition-all" title={`Nhuộm: ${pctNhuom}%`} />
                </div>
              </div>
            </div>

            {/* KHỐI 4: TỒN KHO & QUY ĐỔI CHI TIẾT */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-teal-600" />
                  3. Quản lý Tồn kho & Quy đổi thời gian thực
                </span>
                <span className="text-[11px] text-slate-500">Đơn vị: kg / cây / mét</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tồn kho thực tế (kg) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    className="w-full px-3 py-2 text-base font-black text-teal-700 dark:text-teal-400 bg-white dark:bg-slate-900 border-2 border-teal-400 dark:border-teal-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={tonKho}
                    onChange={(e) => setTonKho(Number(e.target.value))}
                    placeholder="VD: 600"
                  />
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quy đổi số cây vải</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white font-mono">
                    ≈ {soCayQuyDoi} cây
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">(chuẩn 20 kg/cây)</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Quy đổi chiều dài</span>
                  <span className="text-base font-bold text-slate-800 dark:text-white font-mono">
                    ≈ {soMetQuyDoi.toLocaleString()} mét
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">(chuẩn 3.2 m/kg)</span>
                </div>

                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 sm:col-span-1">
                  <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase block">Tổng thành tiền tồn</span>
                  <span className="text-base font-black text-teal-900 dark:text-teal-200 font-mono">
                    {formatVND(tongThanhTienTon)}
                  </span>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 block mt-0.5">({tonKho} kg × {formatVND(donGia)})</span>
                </div>
              </div>
            </div>
          </form>

          {/* FOOTER MODAL */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              Hủy
            </button>

            <button
              type="submit"
              form="form-edit-vai-modal"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 flex items-center gap-2 transition hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Đang lưu..." : "Lưu thay đổi & Cập nhật"}</span>
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
