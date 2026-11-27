"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar, Layers, Shirt, Scissors, PackageCheck, Download,
  CheckCircle2, AlertTriangle, ArrowRight, Printer, Sparkles,
  TrendingUp, Factory, ShoppingCart, RefreshCw, DollarSign,
  PieChart, Check, Info, FileSpreadsheet, Eye, ChevronRight,
  Sliders, Plus, Minus, Warehouse, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import {
  tinhToanKeHoachThang,
  type MonthlyPlanInputs,
  type ProductQuantityDistribution,
  type HaoHutSettings,
  type MonthlyPlanCalculationResult,
  DINH_MUC_TINH,
  HAO_HUT_MAC_DINH
} from "@/lib/data/monthly-production-planner";
import { KHO_VAI, KHO_VAT_TU, formatVND } from "@/lib/data/real-data";
import { useRouter } from "next/navigation";
import { fetchKeHoach30Ngay, gomNhomTheoLoaiSP } from "@/lib/data/ke-hoach-30-ngay-store";

const STORAGE_KEY = "mimin_ke_hoach_thang_v2";

export function KeHoachThangView() {
  const router = useRouter();

  // Khởi tạo state kế hoạch
  const [targetTotal, setTargetTotal] = useState<number>(40000);
  const [selectedMonth, setSelectedMonth] = useState<string>("Tháng 12/2026");
  const [quantities, setQuantities] = useState<ProductQuantityDistribution>({
    aoTron: 10000,
    aoTru: 15000,
    boTron: 5000,
    boTru: 10000,
  });

  // Tỷ lệ hao hụt an toàn
  const [haoHut, setHaoHut] = useState<HaoHutSettings>({ ...HAO_HUT_MAC_DINH });
  const [showHaoHutConfig, setShowHaoHutConfig] = useState<boolean>(false);

  // Chọn vải mẫu từ Kho Vải thực tế
  const [selectedMaVai, setSelectedMaVai] = useState<string>("V-CASAUDEN");
  const [donGiaVai, setDonGiaVai] = useState<number>(75000);
  const [donGiaBo, setDonGiaBo] = useState<number>(6500);
  const [donGiaMay, setDonGiaMay] = useState<number>(14000);

  // Sub-tab chi tiết
  const [detailTab, setDetailTab] = useState<"vat_tu" | "dinh_muc_hao_hut" | "mau_sac" | "ke_hoach_tuan" | "tai_chinh">("vat_tu");

  // Danh sách vải thực tế có giá trong KHO_VAI
  const danhSachVaiThucTe = useMemo(() => {
    return KHO_VAI.filter((v) => v.donGia > 0);
  }, []);

  // Load từ localStorage nếu có; nếu chưa từng lưu kế hoạch nào thì tự lấy số liệu từ Kế hoạch 30 ngày
  useEffect(() => {
    let daCoKeHoachLuu = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.targetTotal) setTargetTotal(parsed.targetTotal);
        if (parsed.selectedMonth) setSelectedMonth(parsed.selectedMonth);
        if (parsed.quantities) setQuantities(parsed.quantities);
        if (parsed.haoHut) setHaoHut(parsed.haoHut);
        if (parsed.selectedMaVai) setSelectedMaVai(parsed.selectedMaVai);
        if (parsed.donGiaVai) setDonGiaVai(parsed.donGiaVai);
        if (parsed.donGiaBo) setDonGiaBo(parsed.donGiaBo);
        if (parsed.donGiaMay) setDonGiaMay(parsed.donGiaMay);
        daCoKeHoachLuu = true;
      }
    } catch {}
    if (!daCoKeHoachLuu) {
      void handleLayTuKeHoach30Ngay(false);
    }
  }, []);

  // Lấy số lượng từ bảng "Kế hoạch sản xuất 30 ngày" (gộp theo 4 nhóm Áo tròn/Áo trụ/Bộ tròn/Bộ trụ)
  const handleLayTuKeHoach30Ngay = async (thongBao = true) => {
    const items = await fetchKeHoach30Ngay();
    if (items.length === 0) {
      if (thongBao) toast.info("Chưa có dòng nào trong Kế hoạch sản xuất 30 ngày");
      return;
    }
    const nhom = gomNhomTheoLoaiSP(items);
    if (nhom.tong === 0) {
      if (thongBao) toast.info("Kế hoạch 30 ngày chưa có dòng nào khớp 4 nhóm Áo tròn/Áo trụ/Bộ tròn/Bộ trụ");
      return;
    }
    setQuantities({ aoTron: nhom.aoTron, aoTru: nhom.aoTru, boTron: nhom.boTron, boTru: nhom.boTru });
    setTargetTotal(nhom.tong);
    if (thongBao) toast.success(`Đã lấy ${nhom.tong.toLocaleString("vi-VN")} SP từ Kế hoạch 30 ngày`);
  };

  // Khi chọn vải cụ thể trong kho, cập nhật đơn giá vải theo kho
  const handleSelectVaiKho = (maVT: string) => {
    setSelectedMaVai(maVT);
    if (maVT === "all_avg") {
      const avg = Math.round(danhSachVaiThucTe.reduce((s, v) => s + v.donGia, 0) / (danhSachVaiThucTe.length || 1));
      setDonGiaVai(avg);
      toast.info(`Đã áp dụng giá bình quân kho vải: ${formatVND(avg)}/kg`);
    } else {
      const item = KHO_VAI.find((v) => v.maVT === maVT);
      if (item && item.donGia > 0) {
        setDonGiaVai(item.donGia);
        toast.info(`Áp dụng giá vải "${item.tenVT}": ${formatVND(item.donGia)}/kg`);
      }
    }
  };

  // Lưu tự động
  const handleSavePlan = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          targetTotal,
          selectedMonth,
          quantities,
          haoHut,
          selectedMaVai,
          donGiaVai,
          donGiaBo,
          donGiaMay,
          savedAt: new Date().toISOString(),
        })
      );
      toast.success(`Đã lưu kế hoạch sản xuất ${selectedMonth} (${targetTotal.toLocaleString("vi-VN")} SP)`);
    } catch {
      toast.error("Không thể lưu vào bộ nhớ trình duyệt");
    }
  };

  // Áp dụng tỷ lệ nhanh
  const applyQuickRatio = (rTron: number, rTru: number, rBoTron: number, rBoTru: number) => {
    const qTron = Math.round(targetTotal * rTron);
    const qTru = Math.round(targetTotal * rTru);
    const qBoTron = Math.round(targetTotal * rBoTron);
    const qBoTru = targetTotal - (qTron + qTru + qBoTron);

    setQuantities({
      aoTron: Math.max(0, qTron),
      aoTru: Math.max(0, qTru),
      boTron: Math.max(0, qBoTron),
      boTru: Math.max(0, qBoTru),
    });
    toast.info("Đã phân bổ lại số lượng theo tỷ lệ");
  };

  // Cập nhật số lượng từng loại và tự động update tổng
  const handleUpdateQuantity = (key: keyof ProductQuantityDistribution, val: number) => {
    const nextQ = { ...quantities, [key]: Math.max(0, isNaN(val) ? 0 : val) };
    setQuantities(nextQ);
    const newTotal = nextQ.aoTron + nextQ.aoTru + nextQ.boTron + nextQ.boTru;
    setTargetTotal(newTotal);
  };

  // Tăng giảm nhanh theo bước (VD: 500 hoặc 1.000)
  const handleStepQuantity = (key: keyof ProductQuantityDistribution, step: number) => {
    const current = quantities[key] || 0;
    handleUpdateQuantity(key, current + step);
  };

  // Cập nhật tổng và phân bổ lại theo tỷ lệ hiện tại
  const handleUpdateTotal = (newTotal: number) => {
    const validTotal = Math.max(0, isNaN(newTotal) ? 0 : newTotal);
    setTargetTotal(validTotal);
    const currentSum = quantities.aoTron + quantities.aoTru + quantities.boTron + quantities.boTru || 1;
    const r1 = quantities.aoTron / currentSum;
    const r2 = quantities.aoTru / currentSum;
    const r3 = quantities.boTron / currentSum;

    const q1 = Math.round(validTotal * r1);
    const q2 = Math.round(validTotal * r2);
    const q3 = Math.round(validTotal * r3);
    const q4 = validTotal - (q1 + q2 + q3);

    setQuantities({
      aoTron: Math.max(0, q1),
      aoTru: Math.max(0, q2),
      boTron: Math.max(0, q3),
      boTru: Math.max(0, q4),
    });
  };

  // Tính toán kết quả MRP
  const result: MonthlyPlanCalculationResult = useMemo(() => {
    return tinhToanKeHoachThang({
      thang: selectedMonth,
      tongSoLuong: targetTotal,
      phanBo: quantities,
      haoHut,
      donGiaVaiTrungBinh: donGiaVai,
      donGiaBoTrungBinh: donGiaBo,
      donGiaMayTrungBinh: donGiaMay,
    });
  }, [selectedMonth, targetTotal, quantities, haoHut, donGiaVai, donGiaBo, donGiaMay]);

  // Xuất file CSV / In
  const handleExportCSV = () => {
    const headers = [
      "STT",
      "Mã kho tham chiếu",
      "Tên vật tư",
      "Phân loại",
      "Số lượng tinh (Net)",
      "Hao hụt (%)",
      "Tổng cần (Gross)",
      "Đơn vị",
      "Tồn kho hiện có",
      "Cần mua thêm",
      "Đơn giá tham chiếu (VNĐ)",
      "Thành tiền tổng (VNĐ)",
      "Tiền cần mua thêm (VNĐ)",
      "Nguồn giá",
      "Ghi chú",
    ];
    const rows = result.danhSachVatTu.map((v, i) => [
      i + 1,
      `"${v.maVTKho || ""}"`,
      `"${v.tenVatTu}"`,
      `"${v.phanLoai}"`,
      v.soLuongTinh,
      `${v.tyLeHaoHut}%`,
      v.soLuongTongCan,
      v.dvt,
      v.tonKhoHienCo,
      v.soLuongCanMuaThem,
      v.donGiaThamChieu,
      v.thanhTienTong,
      v.thanhTienMuaThem,
      `"${v.nguonGia}"`,
      `"${v.ghiChu}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Du_tru_vat_tu_${selectedMonth.replace(/\s|\//g, "_")}_${targetTotal}SP.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất file dự trù vật tư thành công!");
  };

  return (
    <div className="space-y-4 animate-fade-in w-full">
      {/* 1. KHỐI ĐIỀU KHIỂN ĐẦU VÀO KẾ HOẠCH THÁNG (INPUT PANEL) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-teal-500/30 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                TỰ ĐỘNG HÓA MRP & ĐỊNH MỨC KHO SẢN XUẤT
              </span>
              <span className="text-xs text-slate-400">· Dữ liệu kết nối trực tiếp KHO_VAI & KHO_VAT_TU</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-teal-600" />
              Lập Kế Hoạch Sản Xuất & Bóc Tách Vật Tư Tháng
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Nhập số lượng kế hoạch cho 4 dòng sản phẩm chủ lực (Áo tròn, Áo trụ, Bộ tròn, Bộ trụ). Hệ thống tự động tính định mức tinh, cộng tỷ lệ hao hụt an toàn và đối chiếu đơn giá thực tế trong ứng dụng.
            </p>
          </div>

          {/* Cụm nút thao tác */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => handleLayTuKeHoach30Ngay(true)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Lấy số lượng từ bảng Kế hoạch sản xuất 30 ngày"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Lấy Từ KH 30 Ngày</span>
            </button>
            <button
              type="button"
              onClick={() => setShowHaoHutConfig(!showHaoHutConfig)}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border ${
                showHaoHutConfig
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Chỉnh Tỷ Lệ Hao Hụt</span>
            </button>
            <button
              type="button"
              onClick={handleSavePlan}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Kế Hoạch</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>

        {/* BẢNG ĐIỀU CHỈNH TỶ LỆ HAO HỤT (NẾU MỞ) */}
        {showHaoHutConfig && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Cấu Hình Tỷ Lệ Hao Hụt An Toàn Theo Ngành May Mặc
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHaoHut({ ...HAO_HUT_MAC_DINH });
                  toast.success("Đã đưa tỷ lệ hao hụt về chuẩn xưởng MIMIN");
                }}
                className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Khôi phục mặc định xưởng
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Hao hụt Vải chính:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={15}
                    value={haoHut.vaiChinh}
                    onChange={(e) => setHaoHut({ ...haoHut, vaiChinh: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded-lg border text-right font-mono font-black text-amber-700 dark:text-amber-400"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Biên vải, đầu cây, co rút</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Hao hụt Bo cổ / Bo tay:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={10}
                    value={haoHut.boCo}
                    onChange={(e) => setHaoHut({ ...haoHut, boCo: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded-lg border text-right font-mono font-black text-rose-600 dark:text-rose-400"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Lỗi sợi dệt, tra bo mép</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Hao hụt Phụ liệu may:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={10}
                    value={haoHut.phuLieu}
                    onChange={(e) => setHaoHut({ ...haoHut, phuLieu: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded-lg border text-right font-mono font-black text-blue-600 dark:text-blue-400"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Nút, mex keo, thun, chỉ</span>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-slate-500 font-semibold block mb-1">Hao hụt Đóng gói:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step={0.5}
                    min={1}
                    max={10}
                    value={haoHut.dongGoi}
                    onChange={(e) => setHaoHut({ ...haoHut, dongGoi: parseFloat(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 rounded-lg border text-right font-mono font-black text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">Bao OPP, thẻ bài MIN</span>
              </div>
            </div>
          </div>
        )}

        {/* BẢNG NHẬP 4 DÒNG SẢN PHẨM & TỔNG SỐ LƯỢNG */}
        <div className="mt-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Kỳ sản xuất:
              </span>
              <input
                type="text"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-teal-700 dark:text-teal-400 w-36"
              />
            </div>

            {/* Ô nhập Tổng số lượng có nút tăng giảm mượt mà */}
            <div className="flex items-center gap-2 self-start md:self-center flex-wrap">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tổng Sản Phẩm Toàn Tháng:
              </span>
              <div className="inline-flex items-center rounded-xl border-2 border-teal-500 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleUpdateTotal(Math.max(1000, targetTotal - 5000))}
                  className="px-2.5 py-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition"
                  title="Giảm 5.000 SP"
                >
                  -5k
                </button>
                <input
                  type="number"
                  step={1000}
                  value={targetTotal || ""}
                  onChange={(e) => handleUpdateTotal(parseInt(e.target.value, 10) || 0)}
                  className="w-28 px-2 py-1 text-center font-mono font-black text-base text-teal-700 dark:text-teal-400 focus:outline-hidden bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateTotal(targetTotal + 5000)}
                  className="px-2.5 py-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition"
                  title="Tăng 5.000 SP"
                >
                  +5k
                </button>
                <span className="px-2.5 py-1 text-xs font-black bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded-md">
                  SP
                </span>
              </div>
            </div>
          </div>

          {/* 4 CARD NHẬP DÒNG SẢN PHẨM CỐT LÕI - GIAO DIỆN HOÀN TOÀN MỚI, KHÔNG ĐÈ CHỮ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Áo tròn */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50/80 to-blue-50/50 dark:from-cyan-950/40 dark:to-blue-950/30 border border-cyan-200/80 dark:border-cyan-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-cyan-900 dark:text-cyan-200 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Shirt className="w-4 h-4 text-cyan-600" /> Áo Tròn (Cổ Tròn)
                  </span>
                  <span className="text-xs font-black font-mono bg-cyan-200/80 dark:bg-cyan-900/80 text-cyan-900 dark:text-cyan-200 px-2 py-0.5 rounded-full">
                    {result.tyTrong.aoTron}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 space-y-0.5">
                  <div>• Định mức tinh: <b>{DINH_MUC_TINH.vaiKg.aoTron} kg</b> vải · <b>1</b> bo viền</div>
                  <div className="text-cyan-700 dark:text-cyan-400 font-semibold">
                    • Gồm hao hụt {haoHut.vaiChinh}%: <b>{(DINH_MUC_TINH.vaiKg.aoTron * (1 + haoHut.vaiChinh / 100)).toFixed(3)} kg</b>/áo
                  </div>
                </div>
              </div>

              {/* Input Group rõ ràng */}
              <div className="space-y-1.5">
                <div className="flex items-center rounded-xl border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("aoTron", -500)}
                    className="p-2 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-slate-800 transition"
                    title="Giảm 500 cái"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step={500}
                    value={quantities.aoTron || ""}
                    onChange={(e) => handleUpdateQuantity("aoTron", parseInt(e.target.value, 10) || 0)}
                    className="w-full py-2 text-center font-mono font-black text-sm text-cyan-950 dark:text-cyan-100 focus:outline-hidden bg-transparent"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("aoTron", 500)}
                    className="p-2 text-slate-400 hover:text-cyan-700 hover:bg-cyan-50 dark:hover:bg-slate-800 transition"
                    title="Tăng 500 cái"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-100 dark:bg-cyan-950/80 border-l border-cyan-200 dark:border-cyan-800 shrink-0">
                    Cái
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Áo trụ */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50/80 to-emerald-50/50 dark:from-teal-950/40 dark:to-emerald-950/30 border border-teal-200/80 dark:border-teal-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-teal-900 dark:text-teal-200 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-600" /> Áo Trụ (Polo Cổ Bẻ)
                  </span>
                  <span className="text-xs font-black font-mono bg-teal-200/80 dark:bg-teal-900/80 text-teal-900 dark:text-teal-200 px-2 py-0.5 rounded-full">
                    {result.tyTrong.aoTru}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 space-y-0.5">
                  <div>• Định mức tinh: <b>{DINH_MUC_TINH.vaiKg.aoTru} kg</b> vải · <b>1</b> bộ bo · <b>2</b> nút</div>
                  <div className="text-teal-700 dark:text-teal-400 font-semibold">
                    • Gồm hao hụt {haoHut.vaiChinh}%: <b>{(DINH_MUC_TINH.vaiKg.aoTru * (1 + haoHut.vaiChinh / 100)).toFixed(3)} kg</b>/áo
                  </div>
                </div>
              </div>

              {/* Input Group rõ ràng */}
              <div className="space-y-1.5">
                <div className="flex items-center rounded-xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("aoTru", -500)}
                    className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                    title="Giảm 500 cái"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step={500}
                    value={quantities.aoTru || ""}
                    onChange={(e) => handleUpdateQuantity("aoTru", parseInt(e.target.value, 10) || 0)}
                    className="w-full py-2 text-center font-mono font-black text-sm text-teal-950 dark:text-teal-100 focus:outline-hidden bg-transparent"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("aoTru", 500)}
                    className="p-2 text-slate-400 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                    title="Tăng 500 cái"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-950/80 border-l border-teal-200 dark:border-teal-800 shrink-0">
                    Cái
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Bộ tròn */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-amber-900 dark:text-amber-200 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-amber-600" /> Bộ Tròn (Set Bộ Cổ Tròn)
                  </span>
                  <span className="text-xs font-black font-mono bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                    {result.tyTrong.boTron}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 space-y-0.5">
                  <div>• Định mức tinh: <b>{DINH_MUC_TINH.vaiKg.boTron} kg</b> · <b>0.75m</b> thun lưng</div>
                  <div className="text-amber-700 dark:text-amber-400 font-semibold">
                    • Gồm hao hụt {haoHut.vaiChinh}%: <b>{(DINH_MUC_TINH.vaiKg.boTron * (1 + haoHut.vaiChinh / 100)).toFixed(3)} kg</b>/bộ
                  </div>
                </div>
              </div>

              {/* Input Group rõ ràng */}
              <div className="space-y-1.5">
                <div className="flex items-center rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("boTron", -500)}
                    className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                    title="Giảm 500 bộ"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step={500}
                    value={quantities.boTron || ""}
                    onChange={(e) => handleUpdateQuantity("boTron", parseInt(e.target.value, 10) || 0)}
                    className="w-full py-2 text-center font-mono font-black text-sm text-amber-950 dark:text-amber-100 focus:outline-hidden bg-transparent"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("boTron", 500)}
                    className="p-2 text-slate-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-slate-800 transition"
                    title="Tăng 500 bộ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border-l border-amber-200 dark:border-amber-800 shrink-0">
                    Bộ
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Bộ trụ */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-violet-50/50 dark:from-indigo-950/40 dark:to-violet-950/30 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-200 mb-1">
                  <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-indigo-600" /> Bộ Trụ (Set Bộ Polo)
                  </span>
                  <span className="text-xs font-black font-mono bg-indigo-200/80 dark:bg-indigo-900/80 text-indigo-900 dark:text-indigo-200 px-2 py-0.5 rounded-full">
                    {result.tyTrong.boTru}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 space-y-0.5">
                  <div>• Định mức tinh: <b>{DINH_MUC_TINH.vaiKg.boTru} kg</b> · <b>1</b> bộ bo · <b>2</b> nút</div>
                  <div className="text-indigo-700 dark:text-indigo-400 font-semibold">
                    • Gồm hao hụt {haoHut.vaiChinh}%: <b>{(DINH_MUC_TINH.vaiKg.boTru * (1 + haoHut.vaiChinh / 100)).toFixed(3)} kg</b>/bộ
                  </div>
                </div>
              </div>

              {/* Input Group rõ ràng */}
              <div className="space-y-1.5">
                <div className="flex items-center rounded-xl border border-indigo-300 dark:border-indigo-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("boTru", -500)}
                    className="p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                    title="Giảm 500 bộ"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    step={500}
                    value={quantities.boTru || ""}
                    onChange={(e) => handleUpdateQuantity("boTru", parseInt(e.target.value, 10) || 0)}
                    className="w-full py-2 text-center font-mono font-black text-sm text-indigo-950 dark:text-indigo-100 focus:outline-hidden bg-transparent"
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => handleStepQuantity("boTru", 500)}
                    className="p-2 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-slate-800 transition"
                    title="Tăng 500 bộ"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2.5 py-1 text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 border-l border-indigo-200 dark:border-indigo-800 shrink-0">
                    Bộ
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Thanh phân bổ nhanh */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-semibold">Tỷ lệ mẫu:</span>
              <button
                type="button"
                onClick={() => applyQuickRatio(0.25, 0.25, 0.25, 0.25)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
              >
                Chia đều 25% (mỗi loại 10.000 SP)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRatio(0.25, 0.40, 0.15, 0.20)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
              >
                Trọng tâm Polo Áo Trụ (40% Áo trụ)
              </button>
              <button
                type="button"
                onClick={() => applyQuickRatio(0.20, 0.30, 0.25, 0.25)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition cursor-pointer"
              >
                Đẩy mạnh Set Bộ (50% Set Bộ)
              </button>
            </div>

            {/* Chọn vải mẫu từ KHO_VAI */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold text-[11px]">Chọn vải mẫu KHO_VAI:</span>
              <select
                value={selectedMaVai}
                onChange={(e) => handleSelectVaiKho(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-teal-700 dark:text-teal-400 cursor-pointer"
              >
                <option value="all_avg">Bình quân Kho Vải (~74.500 đ/kg)</option>
                {danhSachVaiThucTe.map((v) => (
                  <option key={v.maVT} value={v.maVT}>
                    {v.tenVT} ({formatVND(v.donGia)}/kg)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 KPI TỔNG HỢP VẬT TƯ CẦN CHUẨN BỊ (OUTPUT KPI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Tổng Vải Chính */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-teal-500/30 shadow-xs">
          <div className="flex items-center justify-between text-teal-800 dark:text-teal-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              Tổng Vải Chính
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-teal-600">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-slate-900 dark:text-white">
            {result.tongKgVaiChinh.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">kg</span>
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 font-bold flex items-center justify-between">
            <span>Tinh: {result.vaiTinhKg.toLocaleString("vi-VN")}kg + Hao hụt: {result.vaiHaoHutKg.toLocaleString("vi-VN")}kg</span>
            <span>{(result.duToanChiPhi.tienVaiChinh / 1e9).toFixed(2)} tỷ đ</span>
          </div>
        </div>

        {/* Card 2: Bo Cổ & Bo Tay */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-rose-500/30 shadow-xs">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              Bo Cổ & Bo Tay
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-rose-600 dark:text-rose-400">
            {result.tongBoCoDuyet.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">bộ/cái</span>
          </div>
          <div className="text-[11px] text-rose-700 dark:text-rose-400 font-bold flex items-center justify-between">
            <span>Tinh: {result.boCoTinh} + Hao hụt {haoHut.boCo}%: +{result.boCoHaoHut}</span>
            <span>{(result.duToanChiPhi.tienBoCo / 1e6).toFixed(1)} tr đ</span>
          </div>
        </div>

        {/* Card 3: Phụ liệu May */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-amber-500/30 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              Phụ Liệu May & Đóng Gói
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-amber-600 dark:text-amber-400">
            {result.tongVienNut.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">nút</span>
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center justify-between">
            <span>{result.tongMetThun.toLocaleString("vi-VN")}m thun · {result.tongCuonChi} cuộn chỉ</span>
            <span>{(result.duToanChiPhi.tienPhuLieu / 1e6).toFixed(1)} tr đ</span>
          </div>
        </div>

        {/* Card 4: Tổng Dự Toán Vốn */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-indigo-500/30 shadow-xs">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300">
            <span className="text-xs font-bold uppercase tracking-wider">
              Tổng Vốn Sản Xuất Dự Kiến
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight my-1 text-indigo-900 dark:text-indigo-100">
            {(result.duToanChiPhi.tongChiPhiDuKien / 1e9).toFixed(2)} <span className="text-xs font-normal text-slate-400">tỷ VNĐ</span>
          </div>
          <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-between">
            <span>Giá thành bình quân:</span>
            <span>{result.duToanChiPhi.giaThanhTrungBinh1SP.toLocaleString("vi-VN")} đ/SP</span>
          </div>
        </div>
      </div>

      {/* 3. CHI TIẾT BỐC TÁCH: TAB CHỨC NĂNG CHUYÊN SÂU */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setDetailTab("vat_tu")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              detailTab === "vat_tu"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bảng Dự Trù Vật Tư MRP & Đơn Giá Kho</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
              {result.danhSachVatTu.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab("dinh_muc_hao_hut")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              detailTab === "dinh_muc_hao_hut"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Định Mức Tinh & Bảng Hao Hụt</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab("mau_sac")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              detailTab === "mau_sac"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Cơ Cấu Màu Vải Chủ Lực</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab("ke_hoach_tuan")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              detailTab === "ke_hoach_tuan"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Kế Hoạch Tiến Độ 4 Tuần & Xưởng May</span>
          </button>

          <button
            type="button"
            onClick={() => setDetailTab("tai_chinh")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              detailTab === "tai_chinh"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dự Toán Ngân Sách & Dòng Tiền</span>
          </button>
        </div>

        {/* NỘI DUNG 1: BẢNG DỰ TRÙ VẬT TƯ MRP & ĐƠN GIÁ TỪ KHO */}
        {detailTab === "vat_tu" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-teal-600" />
                Đơn giá được lấy chính xác từ <b>KHO_VAI</b> (29 loại) và <b>KHO_VAT_TU</b> (58 mặt hàng) của MIMIN.
              </span>
              <button
                type="button"
                onClick={() => router.push("/phieu-dat-ncc-phu-lieu")}
                className="text-teal-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Chuyển sang Đặt Hàng Nhà Cung Cấp</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3 min-w-[200px]">Hạng mục nguyên phụ liệu</th>
                    <th className="p-3">Phân loại</th>
                    <th className="p-3 text-right">SL Tinh</th>
                    <th className="p-3 text-center">Hao hụt</th>
                    <th className="p-3 text-right">Tổng cần</th>
                    <th className="p-3">Đơn vị</th>
                    <th className="p-3 text-right">Tồn kho</th>
                    <th className="p-3 text-right font-bold text-amber-700 dark:text-amber-400">Cần mua</th>
                    <th className="p-3 text-right">Đơn giá kho</th>
                    <th className="p-3 text-right min-w-[120px]">Tổng dự toán</th>
                    <th className="p-3 min-w-[180px]">Nguồn giá tham chiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.danhSachVatTu.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-center text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          {v.tenVatTu}
                        </span>
                        {v.maVTKho && (
                          <span className="text-[10px] text-teal-600 font-mono">
                            Mã: {v.maVTKho}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {v.phanLoai}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {v.soLuongTinh.toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          +{v.tyLeHaoHut}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {v.soLuongTongCan.toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{v.dvt}</td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {v.tonKhoHienCo > 0 ? v.tonKhoHienCo.toLocaleString("vi-VN") : "0"}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/20">
                        {v.soLuongCanMuaThem.toLocaleString("vi-VN")}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {formatVND(v.donGiaThamChieu)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-teal-700 dark:text-teal-400">
                        {formatVND(v.thanhTienTong)}
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] leading-tight">
                        <span className="block font-medium text-slate-700 dark:text-slate-300">{v.nguonGia}</span>
                        <span className="text-[10px] text-slate-400">{v.ghiChu}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NỘI DUNG 2: ĐỊNH MỨC TINH & BẢNG HAO HỤT */}
        {detailTab === "dinh_muc_hao_hut" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/40">
              <h4 className="text-sm font-bold text-teal-950 dark:text-teal-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                Công thức Định mức Tinh & Bóc tách Tỷ lệ Hao hụt An toàn
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Trong may mặc công nghiệp, <b>Số lượng thực tế cần chuẩn bị = Số lượng tinh (Net) × (1 + % Hao hụt an toàn)</b>. Bảng dưới đây thể hiện chính xác từng thành phần hao hụt:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bảng Định mức tinh từng dòng sản phẩm */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                  1. Bảng Định Mức Tinh (Net BOM - Chưa tính hao hụt)
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <b className="text-cyan-800 dark:text-cyan-300">Áo tròn (Cổ tròn):</b>
                      <span className="text-slate-500 block text-[11px]">1 áo = 0.23 kg vải + 1 bo viền cổ</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1kg ~ 4.35 áo</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <b className="text-teal-800 dark:text-teal-300">Áo trụ (Polo cổ bẻ):</b>
                      <span className="text-slate-500 block text-[11px]">1 áo = 0.29 kg vải + 1 bộ bo + 2 nút + 0.05m mex keo</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1kg ~ 3.45 áo</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <b className="text-amber-800 dark:text-amber-300">Bộ tròn (Set Bộ cổ tròn):</b>
                      <span className="text-slate-500 block text-[11px]">1 bộ = 0.52 kg vải (áo 0.23 + quần 0.29) + 0.75m thun</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1kg ~ 1.92 bộ</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                    <div>
                      <b className="text-indigo-800 dark:text-indigo-300">Bộ trụ (Set Bộ Polo):</b>
                      <span className="text-slate-500 block text-[11px]">1 bộ = 0.62 kg vải (áo 0.29 + quần 0.33) + 1 bộ bo + 2 nút</span>
                    </div>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">1kg ~ 1.61 bộ</span>
                  </div>
                </div>
              </div>

              {/* Bảng Chi tiết tỷ lệ hao hụt an toàn */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <h5 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                  2. Tỷ Lệ Hao Hụt An Toàn Đang Áp Dụng
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-center justify-between">
                    <div>
                      <b className="text-amber-900 dark:text-amber-300">Vải chính ({haoHut.vaiChinh}%):</b>
                      <span className="text-slate-500 block text-[11px]">Gồm mép vải biên, đầu cây, giác sơ đồ và co rút nhiệt khi ủi</span>
                    </div>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-400">+{result.vaiHaoHutKg} kg</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 flex items-center justify-between">
                    <div>
                      <b className="text-rose-900 dark:text-rose-300">Bo dệt cổ & tay ({haoHut.boCo}%):</b>
                      <span className="text-slate-500 block text-[11px]">Dự phòng lỗi xơ sợi, dập mép bo dệt khi tra bo cổ/tay</span>
                    </div>
                    <span className="font-mono font-bold text-rose-800 dark:text-rose-400">+{result.boCoHaoHut} cái</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 flex items-center justify-between">
                    <div>
                      <b className="text-blue-900 dark:text-blue-300">Phụ liệu may ({haoHut.phuLieu}%):</b>
                      <span className="text-slate-500 block text-[11px]">Nút áo, keo ép trụ, thun lưng, dây rút, chỉ may</span>
                    </div>
                    <span className="font-mono font-bold text-blue-800 dark:text-blue-400">Dự phòng +{haoHut.phuLieu}%</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 flex items-center justify-between">
                    <div>
                      <b className="text-emerald-900 dark:text-emerald-300">Bao bì & Đóng gói ({haoHut.dongGoi}%):</b>
                      <span className="text-slate-500 block text-[11px]">Túi OPP dán miệng, thẻ bài MIN, dây xỏ mác</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-400">Dự phòng +{haoHut.dongGoi}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NỘI DUNG 3: CƠ CẤU MÀU SẮC CHỦ LỰC */}
        {detailTab === "mau_sac" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Cơ cấu màu sắc chủ lực khuyến nghị cho đợt sản xuất {result.tongSoLuong.toLocaleString("vi-VN")} sản phẩm dựa trên thị hiếu bán chạy và giá thực tế trong Kho Vải MIMIN:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {result.coCauMauSacGoiY.map((m) => (
                <div key={m.mau} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs" style={{ backgroundColor: m.hex }} />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{m.mau}</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-teal-600 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-md">
                      {m.tyLe}%
                    </span>
                  </div>
                  <div className="text-xs space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
                    <div className="flex justify-between">
                      <span>Mã vải kho:</span>
                      <b className="font-mono text-slate-800 dark:text-slate-200">{m.maMau}</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Đơn giá kho:</span>
                      <b className="font-mono text-slate-800 dark:text-slate-200">{formatVND(m.giaKho)}/kg</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Số lượng SP:</span>
                      <b className="font-mono text-slate-800 dark:text-slate-200">{m.soLuongSP.toLocaleString("vi-VN")} SP</b>
                    </div>
                    <div className="flex justify-between">
                      <span>Lượng vải cần:</span>
                      <b className="font-mono text-teal-600">{m.soKgVai.toLocaleString("vi-VN")} kg</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NỘI DUNG 4: KẾ HOẠCH TIẾN ĐỘ 4 TUẦN & XƯỞNG MAY */}
        {detailTab === "ke_hoach_tuan" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Tiến độ điều phối 4 tuần để hoàn thành {result.tongSoLuong.toLocaleString("vi-VN")} sản phẩm không bị ứ đọng công đoạn:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {result.keHoachTuan.map((t) => (
                <div key={t.tuan} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-teal-700 dark:text-teal-400">
                      {t.tuan} ({t.ngayDuKien})
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                      Mục tiêu
                    </span>
                  </div>

                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {t.soLuongSP.toLocaleString("vi-VN")} <span className="text-xs font-normal text-slate-400">SP</span>
                  </div>

                  <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div>• Cần cấp: <b>{t.soKgVai.toLocaleString("vi-VN")} kg</b> vải chính</div>
                    <div>• Cần dệt: <b>{t.soBoCo.toLocaleString("vi-VN")} bộ</b> bo cổ</div>
                    <div>• Năng lực cắt: <b>{t.soBanCatCan} bàn cắt</b> đồng thời</div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-bold text-slate-500 block mb-1">Xưởng may điều phối:</span>
                    <div className="space-y-1">
                      {t.xuongMayGoiY.map((x, idx) => (
                        <div key={idx} className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold truncate">
                          ✓ {x}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NỘI DUNG 5: DỰ TOÁN NGÂN SÁCH & DÒNG TIỀN */}
        {detailTab === "tai_chinh" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cấu Thành Giá Vốn Toàn Tháng ({result.tongSoLuong.toLocaleString("vi-VN")} Sản Phẩm)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Giá thành bình quân dự kiến: <b className="text-teal-600 text-sm font-mono">{formatVND(result.duToanChiPhi.giaThanhTrungBinh1SP)} / sản phẩm</b>
                </p>
              </div>

              {/* Tùy chỉnh đơn giá nhanh */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Đơn giá vải (đ/kg):</span>
                  <input
                    type="number"
                    step={1000}
                    value={donGiaVai}
                    onChange={(e) => setDonGiaVai(parseInt(e.target.value, 10) || 0)}
                    className="w-24 px-2 py-1 rounded-lg border text-xs font-mono font-bold"
                  />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Đơn giá bo (đ/bộ):</span>
                  <input
                    type="number"
                    step={500}
                    value={donGiaBo}
                    onChange={(e) => setDonGiaBo(parseInt(e.target.value, 10) || 0)}
                    className="w-20 px-2 py-1 rounded-lg border text-xs font-mono font-bold"
                  />
                </div>
                <div className="text-xs">
                  <span className="text-slate-400 block text-[10px]">Tiền may (đ/sp):</span>
                  <input
                    type="number"
                    step={500}
                    value={donGiaMay}
                    onChange={(e) => setDonGiaMay(parseInt(e.target.value, 10) || 0)}
                    className="w-20 px-2 py-1 rounded-lg border text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Chi tiết 4 khoản mục chi phí */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500">1. Tiền Vải Chính</span>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {formatVND(result.duToanChiPhi.tienVaiChinh)}
                </div>
                <span className="text-[11px] text-teal-600 font-semibold">
                  Chiếm ~{Math.round((result.duToanChiPhi.tienVaiChinh / (result.duToanChiPhi.tongChiPhiDuKien || 1)) * 100)}% tổng vốn
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500">2. Tiền Bo Cổ / Tay</span>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {formatVND(result.duToanChiPhi.tienBoCo)}
                </div>
                <span className="text-[11px] text-rose-600 font-semibold">
                  Chiếm ~{Math.round((result.duToanChiPhi.tienBoCo / (result.duToanChiPhi.tongChiPhiDuKien || 1)) * 100)}% tổng vốn
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500">3. Tiền Phụ Liệu May</span>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {formatVND(result.duToanChiPhi.tienPhuLieu)}
                </div>
                <span className="text-[11px] text-amber-600 font-semibold">
                  Chiếm ~{Math.round((result.duToanChiPhi.tienPhuLieu / (result.duToanChiPhi.tongChiPhiDuKien || 1)) * 100)}% tổng vốn
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-xs text-slate-500">4. Tiền Công May Gia Công</span>
                <div className="text-lg font-black font-mono text-slate-900 dark:text-white">
                  {formatVND(result.duToanChiPhi.tienCongMayVaGiaCong)}
                </div>
                <span className="text-[11px] text-indigo-600 font-semibold">
                  Chiếm ~{Math.round((result.duToanChiPhi.tienCongMayVaGiaCong / (result.duToanChiPhi.tongChiPhiDuKien || 1)) * 100)}% tổng vốn
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
