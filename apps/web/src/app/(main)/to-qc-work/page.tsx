"use client";

// ============ UI QC - KIỂM TRA CHẤT LƯỢNG (/ui-qc) ============
// Nhận hàng từ Tổ May, kiểm tra SL đạt/lỗi, quyết định Đạt → HT hay Lỗi → Trả may

import { useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";

const LOAI_LOI_OPTIONS = [
  "Lỗi rập / kích thước", "Lỗi đường may", "Lỗi vải (lủng, rách)",
  "Ô nhiễm / bẩn", "Cúc / khóa lỗi", "Đường in bị lem", "Thêu lỗi",
];

export default function UiQCPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const { dsLenhCat, capNhatCongDoan, suaLenhCat } = useLenhCat();
  const { user } = useSession();
  const [loaiLoi, setLoaiLoi] = useState<Record<string, string>>({});
  const [khauLoi, setKhauLoi] = useState<Record<string, string>>({});
  const [ghiChu, setGhiChu] = useState<Record<string, string>>({});

  function getMayPC(lc: any) {
    return lc.phanCong?.filter((pc: any) =>
      (pc.id === "mayAo" || pc.id === "mayQuan" || pc.tenCongDoan?.toLowerCase().includes("may")) &&
      pc.trangThaiCD === "cho_qc"
    ) || [];
  }

  // Lấy LC có công đoạn may đã xong, chờ QC
  const lcChoQC = dsLenhCat.filter(lc => getMayPC(lc).length > 0);

  // KPI
  const tongSPChoKiem = lcChoQC.reduce((s, lc) => s + (lc.tongSL || 0), 0);

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

  function handleDat(lc: any) {
    let tongD = 0;
    let tongL = 0;

    getMayPC(lc).forEach((pc: any) => {
      const chiTietMau = pc.chiTietMau || [];
      let slD = 0;
      let slL = 0;
      if (chiTietMau.length > 0) {
        for (const m of chiTietMau) {
          slD += (m.soLuongDat || 0);
          slL += (m.soLuongLoi || 0);
        }
      } else {
        slD = pc.soLuong || lc.tongSL;
        slL = 0;
      }
      tongD += slD;
      tongL += slL;
      // Cập nhật công đoạn may thành hoan_thanh (QC pass)
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: slD, soLuongLoi: slL });
    });

    // Không cần tự động kích hoạt Khuy/Ủi vì chúng tự hiển thị khi May hoàn thành
    toast.success(`✅ QC đạt: ${lc.id} – ${tongD} SP đạt${tongL > 0 ? `, ${tongL} SP lỗi` : ""}`);
  }

  function handleTraLai(lc: any) {
    const ll = loaiLoi[lc.id] ?? "";
    const kl = khauLoi[lc.id] ?? "";
    const gc = ghiChu[lc.id] ?? "";

    let tongL = 0;

    getMayPC(lc).forEach((pc: any) => {
      const chiTietMau = pc.chiTietMau || [];
      let slL = 0;
      for (const m of chiTietMau) {
        slL += (m.soLuongLoi || 0);
      }
      tongL += slL;
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi", soLuongLoi: slL, lyDoLoi: `${kl ? `[${kl}] ` : ""}${ll} ${gc}`.trim() });
    });

    toast.error(`⚠️ Trả lại: ${lc.id} – ${tongL} SP lỗi${ll ? ` (${ll})` : ""}${kl ? ` (Do ${kl})` : ""}`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <ShieldCheck className="w-7 h-7 text-emerald-600" /> QC – Kiểm tra chất lượng
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">
            {lcChoQC.length} lô chờ kiểm · {tongSPChoKiem.toLocaleString()} SP
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Chờ kiểm", value: lcChoQC.length, color: "text-amber-700", icon: ClipboardCheck },
            { label: "SP cần kiểm", value: tongSPChoKiem, color: "text-slate-800", icon: ShieldCheck },
            { label: "Đã đạt hôm nay", value: 0, color: "text-emerald-700", icon: CheckCircle2 },
            { label: "Trả lại hôm nay", value: 0, color: "text-rose-700", icon: XCircle },
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
              <LenhCatCardV2
                key={lc.id}
                lc={lc}
                onColorClick={(mau) => setSelectedMau({ lc, mau })}
              >
                <div className="space-y-4">
                  {/* Công đoạn may đã xong, chờ QC */}
                  <div className="flex flex-wrap gap-2">
                    {mayPCs.map((pc: any) => {
                      const tt = (pc.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
                      const style = TRANG_THAI_CD_STYLE[tt];
                      return (
                        <span key={pc.id} className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-bold border ${style.bg} ${style.text} border-current/20`}>
                          <CheckCircle2 className="w-3 h-3" /> {pc.tenCongDoan}: {TRANG_THAI_CD_LABELS[tt]}
                        </span>
                      );
                    })}
                  </div>

                  {/* Form kiểm tra */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-600 mb-1">Loại lỗi (nếu có):</div>
                        <select value={loaiLoi[lc.id] ?? ""}
                          onChange={e => setLoaiLoi(p => ({ ...p, [lc.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-400">
                          <option value="">-- Chọn loại lỗi --</option>
                          {LOAI_LOI_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-600 mb-1">Khâu gây lỗi:</div>
                        <select value={khauLoi[lc.id] ?? ""}
                          onChange={e => setKhauLoi(p => ({ ...p, [lc.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-400">
                          <option value="">-- Bắt đền tổ nào? --</option>
                          <option value="Tổ Cắt">Tổ Cắt</option>
                          <option value="Xưởng In/Thêu">Xưởng In/Thêu</option>
                          <option value="Tổ May">Tổ May</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-bold text-slate-600 mb-1">Ghi chú thêm:</div>
                      <input type="text" value={ghiChu[lc.id] ?? ""}
                        onChange={e => setGhiChu(p => ({ ...p, [lc.id]: e.target.value }))}
                        placeholder="Chi tiết lỗi (nếu có)..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400/30" />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2 border-t border-slate-100">
                    <button onClick={() => handleDat(lc)}
                      className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors">
                      <CheckCircle2 className="w-4 h-4" /> QC Đạt & Chuyển Khuy/Ủi
                    </button>
                    <button onClick={() => handleTraLai(lc)}
                      className="flex-1 py-2.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-600 font-bold hover:bg-rose-100 flex items-center justify-center gap-2 transition-colors">
                      <XCircle className="w-4 h-4" /> Lỗi – Trả lại Tổ May
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
          currentPCs={getMayPC(selectedMau.lc)}
          onSave={handleSaveColorModal}
        />
      )}
    </div>
  );
}
