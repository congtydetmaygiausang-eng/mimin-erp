"use client";

// ============ UI QC - KIỂM TRA CHẤT LƯỢNG (/to-qc-work) ============
// Nhận hàng từ Tổ May, kiểm tra SL đạt/lỗi, vòng lặp sửa lỗi May ↔ QC

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, ClipboardCheck, History, RotateCcw, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat, type LichSuQCItem } from "@/lib/data/lenh-cat-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";

const LOAI_LOI_OPTIONS = [
  "Lỗi rập / kích thước", "Lỗi đường may", "Lỗi vải (lủng, rách)",
  "Ô nhiễm / bẩn", "Cúc / khóa lỗi", "Đường in bị lem", "Thêu lỗi",
];

const KHAU_GAY_LOI_OPTIONS = ["Tổ Cắt", "Xưởng In/Thêu", "Tổ May", "Khác"];

export default function UiQCPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();
  const { themPhanCong } = usePhanCong();
  const { user } = useSession();

  // State nhập liệu QC - key = `${lcId}_${pcId}`
  const [slDatInput, setSlDatInput] = useState<Record<string, number>>({});
  const [slLoiInput, setSlLoiInput] = useState<Record<string, number>>({});
  const [loaiLoi, setLoaiLoi] = useState<Record<string, string>>({});
  const [khauGayLoi, setKhauGayLoi] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});
  const [showHistory, setShowHistory] = useState<Record<string, boolean>>({});

  function getMayPC(lc: any) {
    return lc.phanCong?.filter((pc: any) =>
      (pc.id === "mayAo" || pc.id === "mayQuan" || pc.id === "may_ao" || pc.id === "may_quan" || pc.tenCongDoan?.toLowerCase().includes("may"))
    ) || [];
  }

  // Tính SL đạt tạm từ lịch sử QC (các lần trả lỗi có slDat > 0)
  function tinhSlDatTam(lichSuQC: LichSuQCItem[]): number {
    return lichSuQC
      .filter(h => h.ketQua === "tra_lai")
      .reduce((s, h) => s + h.slDat, 0);
  }

  // LC có công đoạn may đang chờ QC hoặc đang có lỗi, HOẶC đã xong hết nhưng chưa bấm ghép bộ QC
  const lcChoQC = dsLenhCat.filter(lc => {
    const mayPCs = getMayPC(lc);
    if (mayPCs.length === 0) return false;

    // Nếu khâu QC đã hoàn thành -> Không hiển thị nữa
    const qcPC = lc.phanCong?.find((pc: any) => pc.id === "qc");
    if (qcPC && qcPC.trangThaiCD === "hoan_thanh") return false;

    // Phải có ít nhất 1 khâu may đã đến QC (cho_qc, co_loi, hoan_thanh)
    const hasToQC = mayPCs.some((pc: any) => pc.trangThaiCD === "cho_qc" || pc.trangThaiCD === "co_loi" || pc.trangThaiCD === "hoan_thanh");
    return hasToQC;
  });

  const tongSPChoKiem = lcChoQC.reduce((s, lc) => s + (lc.tongSL || 0), 0);
  const today = new Date().toISOString().slice(0, 10);

  const tongDatHomNay = dsLenhCat.reduce((s, lc) =>
    s + (lc.phanCong || []).reduce((ss: number, pc: any) => {
      return ss + ((pc.lichSuQC || []).filter((h: LichSuQCItem) => h.ngay === today && h.ketQua !== "tra_lai").reduce((sss: number, h: LichSuQCItem) => sss + h.slDat, 0));
    }, 0), 0);

  const tongTraLaiHomNay = dsLenhCat.reduce((s, lc) =>
    s + (lc.phanCong || []).reduce((ss: number, pc: any) => {
      return ss + ((pc.lichSuQC || []).filter((h: LichSuQCItem) => h.ngay === today && h.ketQua === "tra_lai").reduce((sss: number, h: LichSuQCItem) => sss + h.slLoi, 0));
    }, 0), 0);

  // Tổng SL đạt tạm toàn hệ thống (đang chờ vòng sửa lỗi kết thúc)
  const tongDatTam = dsLenhCat.reduce((s, lc) =>
    s + (lc.phanCong || []).reduce((ss: number, pc: any) => {
      if (pc.trangThaiCD !== "co_loi") return ss;
      return ss + tinhSlDatTam(pc.lichSuQC || []);
    }, 0), 0);

  const handleSaveColorModal = (pcId: string, data: ChiTietMauInput) => {
    if (!selectedMau) return;
    const { lc } = selectedMau;
    const pc = lc.phanCong?.find((p: any) => p.id === pcId);
    if (!pc) return;
    try {
      const existingIdx = pc.chiTietMau?.findIndex((m: any) => m.mau === data.mau) ?? -1;
      let newChiTiet = [...(pc.chiTietMau || [])];
      if (existingIdx >= 0) { newChiTiet[existingIdx] = data; } else { newChiTiet.push(data); }
      capNhatCongDoan(lc.id, pcId, { chiTietMau: newChiTiet });
      if (data.sizes && data.sizes.length > 0) {
        const mauIdx = lc.dsMau?.findIndex((m: any) => m.ten === data.mau) ?? -1;
        if (mauIdx >= 0) {
          const newDsMau = [...(lc.dsMau || [])];
          newDsMau[mauIdx] = { ...newDsMau[mauIdx], tyLeSizeChiTiet: { ...(newDsMau[mauIdx].tyLeSizeChiTiet || {}), [pcId]: data.sizes } };
          suaLenhCat(lc.id, { dsMau: newDsMau }, user as any);
        }
      }
      toast.success(`Đã lưu thông tin màu ${data.mau}`);
    } catch (e: any) { toast.error(e.message); }
  };

  // Khi tất cả các khâu May đã được QC duyệt (hoan_thanh), nhấn nút này để chốt toàn bộ khâu QC
  function handleHoanTatQC(lc: any) {
    const qcPC = lc.phanCong?.find((pc: any) => pc.id === "qc");
    if (!qcPC) return;

    const mayPCs = getMayPC(lc);
    if (mayPCs.length === 0) return;

    const isBo = lc.loaiLenh?.toLowerCase().includes("bo") || mayPCs.length > 1;
    let slQC = 0;
    if (isBo) {
      slQC = Math.min(...mayPCs.map((pc: any) => pc.soLuongHoanThanh || 0));
    } else {
      slQC = mayPCs[0]?.soLuongHoanThanh || 0;
    }

    capNhatCongDoan(lc.id, qcPC.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slQC,
      soLuongDatCuoi: slQC,
      lichSuNhapSL: [{
        ngay: new Date().toISOString().slice(0, 10),
        loai: "qc_dat",
        soLuong: slQC,
        nguoiNhap: user?.name,
        ghiChu: isBo ? "QC xác nhận ghép bộ thành công" : "QC hoàn tất toàn bộ",
      }]
    });
    toast.success(`🎉 Lệnh cắt ${lc.id} đã hoàn tất QC. Chuyển sang Hoàn Thiện!`);
  }

  // QC xác nhận ĐẠT cho 1 công đoạn may cụ thể
  function handleDatPC(lc: any, pc: any) {
    const key = `${lc.id}_${pc.id}`;
    const slDat = slDatInput[key] ?? 0;
    const slLoi = slLoiInput[key] ?? 0;
    if (slDat <= 0 && slLoi <= 0) {
      toast.error("Vui lòng nhập số lượng đạt hoặc lỗi trước khi xác nhận");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const lichSuCu: LichSuQCItem[] = pc.lichSuQC || [];
    const lanKiem = lichSuCu.length + 1;

    // Tổng SL đạt tích lũy = đạt tạm (các lần trả lỗi trước) + đạt lần này
    const slDatTamTruoc = tinhSlDatTam(lichSuCu);
    const slDatTichLuy = slDatTamTruoc + slDat;

    const newLichSuQC: LichSuQCItem[] = [...lichSuCu, {
      lan: lanKiem,
      ngay: today,
      slDat,
      slLoi,
      loaiLoi: slLoi > 0 ? (loaiLoi[key] || undefined) : undefined,
      khauGayLoi: slLoi > 0 ? (khauGayLoi[key] || undefined) : undefined,
      nguoiKiem: user?.name || user?.email || undefined,
      ketQua: "hoan_tat",
      ghiChu: ghiChu[key] || undefined,
    }];

    // soLuongDatCuoi = đạt tạm cũ + đạt lần này → trigger upsertTuLenhCat → Công Nợ
    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slDatTichLuy,
      soLuongDatCuoi: slDatTichLuy,
      soLuongLoi: slLoi,
      soLuongPhePham: slLoi,
      lichSuQC: newLichSuQC,
      lichSuNhapSL: [{ ngay: today, nguoiNhap: user?.name, soLuong: slDat, loai: "qc_dat", ghiChu: `QC lần ${lanKiem} – Hoàn tất (tích lũy ${slDatTichLuy} SP → Cộng CN)` }],
    });

    toast.success(`✅ QC Hoàn Tất: ${pc.tenCongDoan} – ${slDatTichLuy} SP đạt → Cộng vào Công Nợ${slLoi > 0 ? ` · ${slLoi} SP phế phẩm` : ""}`);

    // Reset input
    setSlDatInput(p => ({ ...p, [key]: 0 }));
    setSlLoiInput(p => ({ ...p, [key]: 0 }));
  }

  // QC trả lỗi về Tổ May
  function handleTraLoiPC(lc: any, pc: any) {
    const key = `${lc.id}_${pc.id}`;
    const slDat = slDatInput[key] ?? 0;
    const slLoi = slLoiInput[key] ?? 0;
    if (slLoi <= 0) {
      toast.error("Cần nhập số lượng lỗi mới có thể trả về Tổ May");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const lichSuCu: LichSuQCItem[] = pc.lichSuQC || [];
    const lanKiem = lichSuCu.length + 1;

    const newLichSuQC: LichSuQCItem[] = [...lichSuCu, {
      lan: lanKiem,
      ngay: today,
      slDat,
      slLoi,
      loaiLoi: loaiLoi[key] || undefined,
      khauGayLoi: khauGayLoi[key] || undefined,
      nguoiKiem: user?.name || user?.email || undefined,
      ketQua: "tra_lai",
      ghiChu: ghiChu[key] || undefined,
    }];

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "co_loi",
      soLuongLoi: slLoi,
      lyDoLoi: `[${khauGayLoi[key] || "?"}] ${loaiLoi[key] || ""} ${ghiChu[key] || ""}`.trim(),
      lichSuQC: newLichSuQC,
      lichSuNhapSL: [
        ...(slDat > 0 ? [{ ngay: today, nguoiNhap: user?.name, soLuong: slDat, loai: "qc_dat" as const, ghiChu: `QC lần ${lanKiem} – Đạt tạm (chờ sửa lỗi xong mới cộng CN)` }] : []),
        { ngay: today, nguoiNhap: user?.name, soLuong: slLoi, loai: "tra_loi" as const, ghiChu: `QC lần ${lanKiem} – Trả lỗi về ${khauGayLoi[key] || "Tổ May"}` },
      ],
    });

    const msg = slDat > 0
      ? `⚠️ Trả lỗi: ${slLoi} SP lỗi → Tổ May sửa · ${slDat} SP đạt tạm (chờ hoàn tất mới cộng CN)`
      : `⚠️ Trả lỗi: ${slLoi} SP lỗi → Tổ May sửa`;
    toast.warning(msg);
    setSlDatInput(p => ({ ...p, [key]: 0 }));
    setSlLoiInput(p => ({ ...p, [key]: 0 }));
  }

  // Phạt lỗi quá 3 ngày
  function handlePhatQuaHan(lc: any, pc: any, lastLichSu: LichSuQCItem) {
    const confirmPhat = confirm(`Lỗi từ khâu ${lastLichSu.khauGayLoi || "Tổ May"} đã ngâm quá 3 ngày.\nBạn có muốn tự động HỦY số lượng lỗi này (${lastLichSu.slLoi} SP) và tạo lệnh Trừ tiền vào Công Nợ không?`);
    if (confirmPhat) {
      const today = new Date().toISOString().slice(0, 10);
      const lichSuCu: LichSuQCItem[] = pc.lichSuQC || [];
      const idx = lichSuCu.findIndex(l => l.lan === lastLichSu.lan);
      
      const newLichSuQC = [...lichSuCu];
      if (idx >= 0) {
         newLichSuQC[idx] = { ...newLichSuQC[idx], daPhatQuaHan: true, ghiChu: (newLichSuQC[idx].ghiChu || "") + " [Đã phạt/Hủy hàng]" };
      }

      // Đóng lỗi, ko mong chờ nhận lại nữa -> trừ soLuongLoi
      capNhatCongDoan(lc.id, pc.id, {
        soLuongLoi: 0, // Không còn chờ xử lý lỗi nữa
        lichSuQC: newLichSuQC,
      });

      // Tạo giao dịch phạt
      themPhanCong({
        lenhCatId: lc.id,
        congDoan: `Phạt hủy hàng lỗi quá 3 ngày`,
        nguoiMa: pc.nguoiMa || "CHUA_RO",
        nguoiTen: pc.nguoiTen || lastLichSu.khauGayLoi || "Tổ May",
        donGia: pc.donGia || 30000, // Lấy giá gia công hoặc mặc định
        soLuongGiao: -lastLichSu.slLoi,
        ngayGiao: today,
      });

      toast.success(`Đã hủy ${lastLichSu.slLoi} hàng lỗi quá hạn và tạo lệnh trừ tiền.`);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <ShieldCheck className="w-7 h-7 text-emerald-600" /> QC – Kiểm tra chất lượng
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">
            {lcChoQC.length} lô chờ kiểm · {tongSPChoKiem.toLocaleString()} SP
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Chờ kiểm", value: lcChoQC.length, color: "text-amber-700", bg: "bg-white/80", icon: ClipboardCheck },
            { label: "SP cần kiểm", value: tongSPChoKiem, color: "text-slate-800", bg: "bg-white/80", icon: ShieldCheck },
            { label: "Đạt hôm nay", value: tongDatHomNay, color: "text-emerald-700", bg: "bg-emerald-50/80", icon: CheckCircle2 },
            { label: "Trả lại hôm nay", value: tongTraLaiHomNay, color: "text-rose-700", bg: "bg-rose-50/80", icon: XCircle },
            { label: "SP Đạt Tạm", value: tongDatTam, color: "text-amber-700", bg: tongDatTam > 0 ? "bg-amber-100 border-amber-300" : "bg-white/80", icon: RotateCcw },
          ].map(k => (
            <div key={k.label} className={`${k.bg} backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]`}>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <k.icon className="w-3.5 h-3.5" /> {k.label}
              </div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Banner cảnh báo nếu có SL Đạt Tạm */}
        {tongDatTam > 0 && (
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-300 rounded-2xl text-amber-800">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
            <div className="text-xs font-bold leading-relaxed">
              <span className="text-amber-700 text-sm">⏸ {tongDatTam} SP đạt tạm</span> đang chờ vòng sửa lỗi kết thúc.{" "}
              Các SP này <span className="underline">chưa được tính vào Công Nợ</span> — sẽ tự động cộng khi QC bấm "Hoàn tất" lần cuối.
            </div>
          </div>
        )}
      </div>

      {lcChoQC.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có lô nào cần kiểm tra</div>
          <div className="text-sm mt-1">Khi Tổ May hoàn thành sẽ xuất hiện ở đây</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcChoQC.map(lc => {
            const mayPCs = getMayPC(lc);
            return (
              <LenhCatCardV2 key={lc.id} lc={lc} onColorClick={(mau) => setSelectedMau({ lc, mau })}>
                <div className="space-y-5">
                  {mayPCs.map((pc: any) => {
                    const key = `${lc.id}_${pc.id}`;
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt];
                    const lichSuQC: LichSuQCItem[] = pc.lichSuQC || [];
                    const lanKiemTiepTheo = lichSuQC.length + 1;

                    // SL đạt tạm = tổng slDat từ các lần tra_lai
                    const slDatTam = tinhSlDatTam(lichSuQC);
                    const isTraLai = tt === "co_loi";
                    const isHoanThanh = tt === "hoan_thanh";
                    const tongSLCongDoan = pc.soLuong || lc.tongSL || 0;
                    const slConLaiCanKiem = (pc.soLuongLoi || tongSLCongDoan) - slDatTam;
                    const pctDat = tongSLCongDoan > 0 ? Math.min(100, Math.round((slDatTam / tongSLCongDoan) * 100)) : 0;

                    return (
                      <div key={pc.id} className={`rounded-xl border ${isTraLai ? "border-rose-300 bg-rose-50/30" : isHoanThanh ? "border-emerald-300 bg-emerald-50/30 opacity-80" : "border-slate-200 bg-white"} overflow-hidden shadow-sm`}>
                        {/* Khâu Header */}
                        <div className={`px-4 py-3 flex items-center justify-between ${isTraLai ? "bg-rose-100/60" : isHoanThanh ? "bg-emerald-100/60" : "bg-slate-50"} border-b border-current/10`}>
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold border ${style.bg} ${style.text} border-current/20`}>
                              <CheckCircle2 className="w-3 h-3" /> {pc.tenCongDoan}: {TRANG_THAI_CD_LABELS[tt]}
                            </span>
                            {isTraLai && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-rose-600 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <RotateCcw className="w-3 h-3" /> Vòng sửa lỗi #{lanKiemTiepTheo - 1}
                                </span>
                                {(() => {
                                  const now = new Date().getTime();
                                  const lastLichSu = lichSuQC.length > 0 ? lichSuQC[lichSuQC.length - 1] : null;
                                  if (lastLichSu && lastLichSu.ketQua === "tra_lai" && !lastLichSu.daPhatQuaHan) {
                                    const days = (now - new Date(lastLichSu.ngay).getTime()) / (1000 * 3600 * 24);
                                    if (days >= 3) {
                                      return (
                                        <button
                                          onClick={() => handlePhatQuaHan(lc, pc, lastLichSu)}
                                          className="text-[10px] font-black bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-md shadow-sm transition-all animate-pulse"
                                        >
                                          ⚠️ PHẠT LỖI QUÁ HẠN 3 NGÀY
                                        </button>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </div>
                            )}
                          </div>
                          {pc.nguoiTen && <span className="text-xs text-slate-500 font-bold">{pc.nguoiTen}</span>}
                        </div>

                        <div className="p-4 space-y-4">
                          {isHoanThanh ? (
                            <div className="text-center py-6 flex flex-col items-center justify-center space-y-2">
                              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                              <div className="font-black text-emerald-700 text-lg">Đã kiểm tra đạt!</div>
                              <div className="font-bold text-emerald-600">Tổng đạt: {pc.soLuongHoanThanh} SP</div>
                            </div>
                          ) : (
                            <>
                              {/* ===== PANEL SL ĐẠT TẠM (nổi bật khi đang co_loi) ===== */}
                              {isTraLai && slDatTam > 0 && (
                                <div className="rounded-xl border-2 border-amber-300 bg-amber-50/60 p-3 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4 text-amber-600 shrink-0" />
                                    <span className="text-xs font-black text-amber-800 uppercase tracking-wide">SL Đạt Tạm – Chờ hoàn tất</span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-amber-100 rounded-lg py-2 px-1">
                                      <div className="text-[10px] font-bold text-amber-600 uppercase">Đạt Tạm</div>
                                      <div className="text-xl font-black text-amber-700">{slDatTam}</div>
                                    </div>
                                    <div className="bg-rose-100 rounded-lg py-2 px-1">
                                      <div className="text-[10px] font-bold text-rose-600 uppercase">Đang Sửa</div>
                                      <div className="text-xl font-black text-rose-700">{pc.soLuongLoi || 0}</div>
                                    </div>
                                    <div className="bg-slate-100 rounded-lg py-2 px-1">
                                      <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng LC</div>
                                      <div className="text-xl font-black text-slate-700">{tongSLCongDoan}</div>
                                    </div>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold text-amber-700">
                                      <span>Tiến độ đạt: {slDatTam}/{tongSLCongDoan} SP ({pctDat}%)</span>
                                      <span className="text-rose-600">Còn {pc.soLuongLoi || 0} SP sửa</span>
                                    </div>
                                    <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                                        style={{ width: `${pctDat}%` }}
                                      />
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-amber-700 bg-amber-100 rounded-lg px-2 py-1.5 font-bold flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    {slDatTam} SP đạt tạm <span className="text-amber-900 underline">chưa tính vào Công Nợ</span> — sẽ cộng khi QC bấm "Hoàn tất" lần cuối.
                                  </p>
                                </div>
                              )}

                              {/* Thông tin tích lũy (khi có lịch sử nhưng KHÔNG phải đang co_loi có slDatTam) */}
                              {lichSuQC.length > 0 && !(isTraLai && slDatTam > 0) && (
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 grid grid-cols-3 gap-3 text-center text-sm">
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Đạt lần trước</div>
                                    <div className="font-black text-emerald-600 text-lg">
                                      {lichSuQC.reduce((s: number, h: LichSuQCItem) => s + (h.ketQua !== "tra_lai" ? h.slDat : 0), 0)}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Còn cần kiểm</div>
                                    <div className="font-black text-amber-600 text-lg">{Math.max(0, slConLaiCanKiem)}</div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Lần kiểm</div>
                                    <div className="font-black text-slate-800 text-lg">#{lanKiemTiepTheo}</div>
                                  </div>
                                </div>
                              )}

                              {/* Nhập SL lần này */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-bold text-emerald-700 mb-1.5 block">
                                    ✅ SL Đạt lần này
                                    {isTraLai && slDatTam > 0 && (
                                      <span className="ml-1 text-amber-600 font-normal">(cộng vào {slDatTam} đạt tạm)</span>
                                    )}
                                  </label>
                                  <input
                                    type="number" min="0"
                                    value={slDatInput[key] || ""}
                                    onChange={e => setSlDatInput(p => ({ ...p, [key]: Number(e.target.value) }))}
                                    onFocus={e => e.target.select()}
                                    className="w-full px-3 py-2.5 border-2 border-emerald-300 rounded-lg text-center text-lg font-black text-emerald-700 focus:outline-none focus:border-emerald-500 bg-emerald-50"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-bold text-rose-700 mb-1.5 block">❌ SL Lỗi lần này</label>
                                  <input
                                    type="number" min="0"
                                    value={slLoiInput[key] || ""}
                                    onChange={e => setSlLoiInput(p => ({ ...p, [key]: Number(e.target.value) }))}
                                    onFocus={e => e.target.select()}
                                    className="w-full px-3 py-2.5 border-2 border-rose-300 rounded-lg text-center text-lg font-black text-rose-700 focus:outline-none focus:border-rose-500 bg-rose-50"
                                    placeholder="0"
                                  />
                                </div>
                              </div>

                              {/* Preview tổng cộng vào Công Nợ khi nhập */}
                              {isTraLai && slDatTam > 0 && (slDatInput[key] || 0) > 0 && (
                                <div className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                  Nếu hoàn tất ngay: Công Nợ sẽ cộng{" "}
                                  <span className="text-base font-black">{slDatTam + (slDatInput[key] || 0)} SP</span>
                                </div>
                              )}

                              {/* Loại lỗi (hiện khi có SL lỗi) */}
                              {(slLoiInput[key] || 0) > 0 && (
                                <div className="grid grid-cols-2 gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
                                  <div>
                                    <div className="text-xs font-bold text-rose-700 mb-1">Loại lỗi</div>
                                    <select value={loaiLoi[key] ?? ""} onChange={e => setLoaiLoi(p => ({ ...p, [key]: e.target.value }))}
                                      className="w-full px-2 py-1.5 border border-rose-300 rounded-lg text-xs font-bold focus:outline-none bg-white">
                                      <option value="">-- Chọn loại lỗi --</option>
                                      {LOAI_LOI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <div className="text-xs font-bold text-rose-700 mb-1">Khâu gây lỗi</div>
                                    <select value={khauGayLoi[key] ?? ""} onChange={e => setKhauGayLoi(p => ({ ...p, [key]: e.target.value }))}
                                      className="w-full px-2 py-1.5 border border-rose-300 rounded-lg text-xs font-bold focus:outline-none bg-white">
                                      <option value="">-- Bắt đền tổ nào? --</option>
                                      {KHAU_GAY_LOI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                  </div>
                                  <div className="col-span-2">
                                    <input type="text" value={ghiChu[key] ?? ""}
                                      onChange={e => setGhiChu(p => ({ ...p, [key]: e.target.value }))}
                                      placeholder="Ghi chú chi tiết lỗi..."
                                      className="w-full px-2 py-1.5 border border-rose-300 rounded-lg text-xs focus:outline-none bg-white" />
                                  </div>
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex gap-3">
                                <button onClick={() => handleDatPC(lc, pc)}
                                  className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                                  <CheckCircle2 className="w-4 h-4" />
                                  QC Đạt – Hoàn tất
                                </button>
                                <button onClick={() => handleTraLoiPC(lc, pc)}
                                  disabled={(slLoiInput[key] || 0) <= 0}
                                  className="flex-1 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-600 font-bold text-sm hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                  <XCircle className="w-4 h-4" /> Trả lỗi → Tổ May
                                </button>
                              </div>
                            </>
                          )}

                          {/* Lịch sử các lần kiểm */}
                          {lichSuQC.length > 0 && (
                            <div>
                              <button onClick={() => setShowHistory(p => ({ ...p, [key]: !p[key] }))}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                <History className="w-3.5 h-3.5" />
                                Lịch sử {lichSuQC.length} lần kiểm {showHistory[key] ? "▲" : "▼"}
                              </button>
                              {showHistory[key] && (
                                <div className="mt-2 space-y-1.5">
                                  {lichSuQC.map((h: LichSuQCItem, idx: number) => (
                                    <div key={idx} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs border ${h.ketQua === "tra_lai" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"}`}>
                                      <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-600">Lần {h.lan}</span>
                                        <span className="text-slate-400">{h.ngay}</span>
                                        {h.nguoiKiem && <span className="text-slate-500">({h.nguoiKiem})</span>}
                                        {h.khauGayLoi && <span className="text-rose-500 text-[10px] font-bold">↩ {h.khauGayLoi}</span>}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {h.slDat > 0 && (
                                          <span className={`font-bold ${h.ketQua === "tra_lai" ? "text-amber-600" : "text-emerald-700"}`}>
                                            {h.ketQua === "tra_lai" ? `⏸ ${h.slDat} đạt tạm` : `✅ ${h.slDat} đạt`}
                                          </span>
                                        )}
                                        {h.slLoi > 0 && <span className="font-bold text-rose-600">❌ {h.slLoi} lỗi</span>}
                                        <span className={`font-black px-2 py-0.5 rounded-full border text-[10px] ${
                                          h.ketQua === "tra_lai"
                                            ? "bg-amber-100 border-amber-300 text-amber-700"
                                            : "bg-emerald-100 border-emerald-300 text-emerald-700"
                                        }`}>
                                          {h.ketQua === "tra_lai" ? "Trả lại" : "Hoàn tất"}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {(() => {
                    const allMayDone = mayPCs.length > 0 && mayPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
                    const isBo = (lc.loaiLenh || "").toLowerCase().includes("bo");
                    
                    if (isBo && mayPCs.length < 2 && allMayDone) {
                      return (
                        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-3">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                          <div className="text-amber-800 font-black text-lg">
                            ⚠️ Đang chờ đủ Bộ!
                          </div>
                          <p className="text-sm text-amber-700 font-bold max-w-sm mx-auto leading-relaxed">
                            Lệnh cắt này là <b>hàng Bộ</b>, nhưng hiện tại QC mới nhận và duyệt xong 1 thành phần (Áo hoặc Quần).
                            <br/>Vui lòng chờ phân công và kiểm tra nốt thành phần còn lại để tiến hành Ghép Bộ!
                          </p>
                        </div>
                      );
                    }

                    if (allMayDone) {
                      return (
                        <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
                          <div className="text-emerald-700 font-black text-lg">
                            {isBo ? "👕👖 Đã hoàn thành duyệt cả Bộ!" : "✅ Đã kiểm tra hoàn tất!"}
                          </div>
                          <p className="text-sm text-emerald-600 font-bold max-w-sm mx-auto leading-relaxed">
                            {isBo
                              ? "Tất cả các khâu gia công (Áo và Quần) đã đạt QC. Bấm xác nhận ghép bộ để gửi sang Hoàn Thiện."
                              : "QC đã hoàn tất cho lệnh cắt này. Bấm xác nhận để gửi sang Hoàn Thiện."}
                          </p>
                          <button
                            onClick={() => handleHoanTatQC(lc)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-sm transition-transform active:scale-95"
                          >
                            <Package className="w-5 h-5" />
                            {isBo ? "Xác nhận Ghép Bộ → Chuyển Ủi" : "Chốt QC → Chuyển Ủi"}
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </LenhCatCardV2>
            );
          })}
        </div>
      )}

      {selectedMau && (
        <ChiTietMauHistoryModal
          isOpen={!!selectedMau}
          onClose={() => setSelectedMau(null)}
          lc={selectedMau.lc}
          mau={selectedMau.mau}
          currentPCs={getMayPC(selectedMau.lc)}
          onSave={handleSaveColorModal}
        />
      )}
    </div>
  );
}
