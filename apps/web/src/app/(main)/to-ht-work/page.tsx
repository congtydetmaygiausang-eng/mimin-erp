"use client";

// ============ UI HOÀN THIỆN (/ui-hoan-thien) ============
// Nhận hàng từ QC đạt, Ủi + Gấp + Đóng gói, giao Kho Thành Phẩm

import { useState } from "react";
import { ClipboardList, CheckCircle2, Package, Shirt, Clock, Box, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh, thongKeLoiLenhCat } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { DoiSoatModal } from "@/components/DoiSoatModal";

export default function UiHoanThienPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const [selectedDoiSoatLc, setSelectedDoiSoatLc] = useState<LenhCat | null>(null);
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai, suaLenhCat } = useLenhCat();
  const [soThung, setSoThung] = useState<Record<string, number>>({});
  const [khuVuc, setKhuVuc] = useState<Record<string, string>>({});

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const tc = pc.tenCongDoan?.toLowerCase() || "";
      const isHT = pc.id === "ui" || pc.id === "dongGoi" ||
                   tc.includes("ủi") ||
                   tc.includes("đóng gói") ||
                   tc.includes("khuy nút") ||
                   tc.includes("gấp mác") ||
                   tc.includes("kiểm tra") ||
                   tc.includes("hoàn thiện");

      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isHT && isMyTask;
      }
      return isHT;
    }) || [];
  }

  // LC chờ hoàn thiện: Lệnh cắt có chứa công đoạn Hoàn Thiện
  const lcHT = dsLenhCat.filter(lc => {
    // 1. Phải có công đoạn HT của TÔI (nếu là quản lý thì thấy tất cả HT)
    const htPCs = getHTPC(lc);
    if (htPCs.length === 0) return false;

    // 2. Không cần ép buộc các khâu trước (May, In) phải 100% hoàn thành. 
    // Trong xưởng thực tế, May ra tới đâu là HT nhận tới đó (nhận lắt nhắt).
    // Nên chỉ cần LC chưa ở trạng thái "HoanThanh" hoặc đã hoàn thành HT thì vẫn hiển thị để xem.
    return true;
  });

  const handleSaveColorModal = (pcId: string, data: ChiTietMauInput) => {
    if (!selectedMau) return;
    const { lc } = selectedMau;
    const pc = lc.phanCong?.find((p: any) => p.id === pcId);
    if (!pc) return;

    try {
      const existingIdx = pc.chiTietMau?.findIndex((m: any) => m.mau === data.mau) ?? -1;
      let newChiTiet = [...(pc.chiTietMau || [])];

      if (existingIdx >= 0) {
        newChiTiet[existingIdx] = data;
      } else {
        newChiTiet.push(data);
      }

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
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  function handleNhanHang(lc: any, pc: any) {
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    toast.success(`🧺 Nhận hàng hoàn thiện: ${lc.id} – ${pc.tenCongDoan}`);
  }

  function handleXong(lc: any, pc: any) {
    const key = `${lc.id}-${pc.id}`;

    // Bắt buộc khai báo đạt/lỗi theo màu + chặn số vượt khâu trước.
    const kiemTra = kiemTraTruocHoanThanh(lc, pc);
    if (!kiemTra.ok) {
      toast.error(kiemTra.loi!, { duration: 6000 });
      return;
    }
    const { slDat, slLoi } = kiemTra;

    const numThung = soThung[key] ?? 0;
    const lyDoKemThung = numThung > 0 ? `Đóng được: ${numThung} thùng` : "";

    const thanhTienDat = slDat * (pc.donGia || 0);

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slDat,
      soLuongLoi: slLoi,
      lyDoLoi: lyDoKemThung,
      thanhTien: thanhTienDat, // Cập nhật lại công nợ theo SP đạt
      conLai: thanhTienDat - (pc.daThanhToan || 0)
    });

    // Nếu tất cả công đoạn HT đã xong → cập nhật LC HoanThanh
    const allPCs = getHTPC(lc);
    const allDone = allPCs.every((p: any) =>
      p.id === pc.id ? true : p.trangThaiCD === "hoan_thanh"
    );
    if (allDone) {
      toast.success(`🎉 ${lc.id} hoàn thành toàn bộ – Đang chờ Nhập kho thành phẩm!`);
    } else {
      toast.success(`✅ ${pc.tenCongDoan} xong: ${slDat} SP`);
    }
  }

  const loDangHT = lcHT.filter(lc => {
    if (lc.trangThai === "HoanThanh") return false;
    const htPCs = getHTPC(lc);
    // Đang hoàn thiện: Có ít nhất 1 khâu HT đang làm, hoặc có khâu đã xong nhưng chưa xong toàn bộ
    const coDangLam = htPCs.some((pc: any) => pc.trangThaiCD === "dang_lam");
    const coHoanThanh = htPCs.some((pc: any) => pc.trangThaiCD === "hoan_thanh");
    const chuaXongHet = !htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    return coDangLam || (coHoanThanh && chuaXongHet);
  });

  const tongSPDangHT = loDangHT.reduce((s, lc) => s + (lc.tongSL || 0), 0);

  const loChoNhan = lcHT.filter(lc => {
    if (lc.trangThai === "HoanThanh") return false;
    const htPCs = getHTPC(lc);
    // Chờ nhận: Tất cả các khâu HT đều chưa bắt đầu
    return htPCs.every((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao");
  });

  const loHoanThanh = lcHT.filter(lc => {
    // Hoàn thành: Đã đóng lệnh cắt, HOẶC tất cả khâu HT đã hoàn thành
    if (lc.trangThai === "HoanThanh") return true;
    const htPCs = getHTPC(lc);
    return htPCs.length > 0 && htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
  });

  // Chỉ hiện lệnh đã có khai báo thật ở ít nhất 1 khâu, ưu tiên lệnh lỗi nhiều lên đầu
  const thongKeLoi = lcHT
    .map(thongKeLoiLenhCat)
    .filter((tk) => tk.chiTiet.length > 0)
    .sort((a, b) => b.tongLoi - a.tongLoi);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <ClipboardList className="w-7 h-7 text-sky-600" /> Hoàn Thiện – Công việc
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">
            Ủi · Khuy nút · Gấp mác · Đóng gói · Kiểm tra cuối
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Lô đang hoàn thiện", value: loDangHT.length, color: "text-amber-700", icon: Clock },
            { label: "SP đang xử lý", value: tongSPDangHT, color: "text-sky-700", icon: Shirt },
            { label: "Lô chờ nhận", value: loChoNhan.length, color: "text-slate-800", icon: Package },
            { label: "Lô hoàn thành", value: loHoanThanh.length, color: "text-emerald-700", icon: CheckCircle2 },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <k.icon className="w-3.5 h-3.5" /> {k.label}
              </div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tổng hợp hao hụt theo khâu - trước đây số lỗi chỉ nằm rời trong từng
          phiếu công đoạn, không có chỗ nào cộng lại để quản lý nhìn ra khâu nào
          đang lỗi nhiều. */}
      {thongKeLoi.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Tổng hợp hao hụt theo khâu
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-3 font-bold">Lệnh cắt</th>
                  <th className="py-2 px-3 font-bold text-right">SL cắt</th>
                  <th className="py-2 px-3 font-bold text-right">Tổng lỗi</th>
                  <th className="py-2 px-3 font-bold text-right">% lỗi</th>
                  <th className="py-2 pl-3 font-bold">Khâu lỗi nhiều nhất</th>
                </tr>
              </thead>
              <tbody>
                {thongKeLoi.map((tk) => (
                  <tr key={tk.maLenhCat} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-bold text-slate-800">{tk.maLenhCat}</div>
                      <div className="text-xs text-slate-500">{tk.tenSP}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-700 tabular-nums">
                      {tk.tongSLCat.toLocaleString("vi-VN")}
                    </td>
                    <td className={`py-2 px-3 text-right font-black tabular-nums ${tk.tongLoi > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {tk.tongLoi.toLocaleString("vi-VN")}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold tabular-nums ${tk.tiLeLoiChung >= 5 ? "text-rose-600" : tk.tiLeLoiChung > 0 ? "text-amber-600" : "text-slate-400"}`}>
                      {tk.tiLeLoiChung.toFixed(1)}%
                    </td>
                    <td className="py-2 pl-3 text-slate-600">
                      {tk.khauLoiNhieuNhat ? (
                        <span>
                          <b className="text-slate-800">{tk.khauLoiNhieuNhat.tenCongDoan}</b>
                          {" – "}{tk.khauLoiNhieuNhat.slLoi.toLocaleString("vi-VN")} SP
                          {tk.khauLoiNhieuNhat.nguoiTen ? ` (${tk.khauLoiNhieuNhat.nguoiTen})` : ""}
                        </span>
                      ) : (
                        <span className="text-slate-400">Không có lỗi</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lcHT.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có lô nào cần hoàn thiện</div>
          <div className="text-sm mt-1">Hàng QC đạt sẽ chuyển sang đây</div>
        </div>
      ) : (
        <div className="space-y-4">
          {lcHT.map(lc => {
            const htPCs = getHTPC(lc);
            const isAllDone = htPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
            const isLCDone = lc.trangThai === "HoanThanh";

            return (
              <LenhCatCardV2
                key={lc.id}
                lc={lc}
                onColorClick={(mau) => setSelectedMau({ lc, mau })}
                renderStatus={
                  isLCDone ? (
                    <span className="text-xs bg-emerald-500 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> HOÀN THÀNH
                    </span>
                  ) : null
                }
              >
                <div className="space-y-3">
                  {htPCs.map((pc: any) => {
                    const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                    const style = TRANG_THAI_CD_STYLE[tt];
                    const key = `${lc.id}-${pc.id}`;

                    return (
                      <div key={pc.id} className={`rounded-xl border p-4 ${style.bg} border-current/20`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="font-black text-slate-800">{pc.tenCongDoan}</div>
                            <div className="text-xs text-slate-500">{pc.nguoiTen || "Chưa giao"}</div>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold bg-white/70 border ${style.text}`}>
                            {TRANG_THAI_CD_LABELS[tt]}
                          </span>
                        </div>

                        {tt === "dang_lam" && (
                          <div className="mb-3">
                            <div className="text-[11px] font-bold text-sky-600 mb-1">Số thùng/kiện</div>
                            <input type="number"
                              value={soThung[key] ?? ""}
                              onChange={e => setSoThung(p => ({ ...p, [key]: +e.target.value }))}
                              placeholder="0"
                              className="w-full px-3 py-2 border border-sky-300 rounded-lg text-sm font-bold text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 flex items-center justify-center gap-1.5">
                              <Package className="w-4 h-4" /> Nhận hàng
                            </button>
                          )}
                          {tt === "dang_lam" && (
                            <button onClick={() => handleXong(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Xong
                            </button>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2 font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Xong: {pc.soLuongHoanThanh ?? (pc.soLuong || lc.tongSL)} Đạt
                              </div>
                              {(pc.soLuongLoi > 0) && (
                                <div className="text-xs text-rose-600 font-semibold pl-6">
                                  ⚠️ Lỗi: {pc.soLuongLoi} SP - {pc.lyDoLoi}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Nhập kho khi tất cả xong */}
                  {isAllDone && !isLCDone && (
                    <div className="border-t border-slate-100 pt-4 mt-2">
                      <div className="mb-3">
                        <label className="text-xs font-bold text-slate-600 block mb-1">Khu vực Nhập kho *</label>
                        <select
                          value={khuVuc[lc.id] || ""}
                          onChange={e => setKhuVuc(p => ({ ...p, [lc.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                        >
                          <option value="">-- Chọn khu vực lưu trữ --</option>
                          <option value="Khu A - Tầng 1">Khu A - Tầng 1</option>
                          <option value="Khu A - Tầng 2">Khu A - Tầng 2</option>
                          <option value="Khu B - Kệ 01">Khu B - Kệ 01</option>
                          <option value="Khu B - Kệ 02">Khu B - Kệ 02</option>
                          <option value="Khu C chờ xuất">Khu C chờ xuất</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!khuVuc[lc.id]) {
                            toast.error("Vui lòng chọn khu vực nhập kho!");
                            return;
                          }
                          capNhatTrangThai(lc.id, "HoanThanh", null);
                          toast.success(`📦 Đã nhập kho ${lc.id} tại ${khuVuc[lc.id]}`);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                      >
                        <Box className="w-5 h-5" /> Nhập kho thành phẩm
                      </button>
                    </div>
                  )}

                  <div className="border-t border-slate-100 pt-3 mt-2">
                    <button
                      onClick={() => setSelectedDoiSoatLc(lc)}
                      className="w-full py-2.5 rounded-xl bg-slate-50 text-sky-700 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      <ClipboardList className="w-4 h-4" /> Xem chi tiết đối soát tổng
                    </button>
                  </div>
                </div>
              </LenhCatCardV2>
            );
          })}
        </div>
      )}

      {/* Modal nhập liệu cho màu */}
      {selectedMau && (
        <ChiTietMauHistoryModal
          isOpen={!!selectedMau}
          onClose={() => setSelectedMau(null)}
          lc={selectedMau.lc}
          mau={selectedMau.mau}
          currentPCs={getHTPC(selectedMau.lc).filter((pc: any) => pc.trangThaiCD === "dang_lam")}
          onSave={handleSaveColorModal}
        />
      )}

      {/* Modal Đối Soát */}
      <DoiSoatModal 
        isOpen={!!selectedDoiSoatLc}
        onClose={() => setSelectedDoiSoatLc(null)}
        lc={selectedDoiSoatLc}
      />
    </div>
  );
}
