"use client";

// ============ UI TỔ CẮT (/cong-viec-cat) ============
// Trang dành riêng cho thợ cắt / tổ trưởng cắt
// Xem lệnh cắt được giao, cập nhật trạng thái, xem sơ đồ cắt

import { useState } from "react";
import { Scissors, Package, Calendar, FileText, CheckCircle2, Clock, AlertTriangle, ChevronDown, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan } from "@/lib/data/lenh-cat-store";
import { useKho } from "@/lib/data/kho-store";
import { formatVND } from "@/lib/data/real-data";
import { DateDisplay } from "@/components/ui";
import { useSession } from "@/components/session-provider";

export default function CongViecCatPage() {
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai } = useLenhCat();
  const { themGiaoDich } = useKho();
  const { user } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slInput, setSlInput] = useState<Record<string, number>>({});

  function getPhanCongCat(lc: any) {
    return lc.phanCong?.find((pc: any) => {
      const isCat = pc.id === "cat" || pc.tenCongDoan?.toLowerCase().includes("cắt");
      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isCat && isMyTask;
      }
      return isCat;
    });
  }

  // Lọc LC có công đoạn cắt CỦA TÔI, đang cần xử lý
  const lcCoCat = dsLenhCat.filter(lc =>
    lc.trangThai === "DangCat" || lc.trangThai === "DaTao" || lc.trangThai === "Nhap"
  ).filter(lc => getPhanCongCat(lc) !== undefined);

  const tongSLChuaCat = lcCoCat.reduce((s, lc) => {
    const pc = getPhanCongCat(lc);
    if (!pc || pc.trangThaiCD === "hoan_thanh") return s;
    return s + (lc.tongSL || 0);
  }, 0);

  function handleNhanViec(lc: any) {
    const pc = getPhanCongCat(lc);
    if (!pc) return;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "dang_lam" });
    capNhatTrangThai(lc.id, "DangCat", null);
    
    // Tự động xuất kho vải & phụ liệu
    try {
      const ngay = new Date().toISOString().split("T")[0];
      
      // 1. Xuất vải
      lc.dsMau?.forEach((mau: any) => {
        if (mau.maVai && mau.dinhMuc) {
          themGiaoDich({
            ngay, loai: "XUAT", maVT: mau.maVai, tenVT: `Vải ${mau.ten}`,
            soLuong: mau.dinhMuc * (lc.tongSL || 0),
            donVi: "kg", donGia: 0, thanhTien: 0, nguonNhap: `Lệnh cắt ${lc.id}`,
            nguoiThucHien: "Tổ Cắt", ghiChu: `Xuất tự động cho LC ${lc.id}`
          });
        }
        if (mau.maVaiQuan && mau.dinhMucQuan) {
          themGiaoDich({
            ngay, loai: "XUAT", maVT: mau.maVaiQuan, tenVT: `Vải Quần ${mau.ten}`,
            soLuong: mau.dinhMucQuan * (lc.tongSL || 0),
            donVi: "kg", donGia: 0, thanhTien: 0, nguonNhap: `Lệnh cắt ${lc.id}`,
            nguoiThucHien: "Tổ Cắt", ghiChu: `Xuất tự động (Quần) cho LC ${lc.id}`
          });
        }
      });

      // 2. Xuất phụ liệu
      lc.dsPhuLieu?.forEach((pl: any) => {
        if (pl.maPL && pl.soLuong) {
          themGiaoDich({
            ngay, loai: "XUAT", maVT: pl.maPL, tenVT: pl.tenPL,
            soLuong: pl.soLuong,
            donVi: pl.dvt || "cái", donGia: 0, thanhTien: 0, nguonNhap: `Lệnh cắt ${lc.id}`,
            nguoiThucHien: "Tổ Cắt", ghiChu: `Xuất tự động cho LC ${lc.id}`
          });
        }
      });
      
      toast.success(`✂️ Đã nhận việc và tự động xuất vật tư cho: ${lc.id}`);
    } catch (e) {
      toast.error(`⚠️ Có lỗi khi xuất kho tự động!`);
    }
  }

  function handleHoanThanh(lc: any) {
    const pc = getPhanCongCat(lc);
    if (!pc) return;
    const sl = slInput[lc.id] || lc.tongSL;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: sl });
    toast.success(`✅ Chuyển tiếp thành công: ${sl} SP`);
    setSelectedId(null);
  }

  function handleCoLoi(lc: any) {
    const pc = getPhanCongCat(lc);
    if (!pc) return;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi" });
    toast.error(`⚠️ Đã báo lỗi cắt: ${lc.id}`);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
            <Scissors className="w-7 h-7 text-sky-500" /> Tổ Cắt – Công việc
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lcCoCat.length} lệnh cắt · {tongSLChuaCat.toLocaleString()} SP chưa cắt
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Lệnh được giao", value: lcCoCat.length, icon: Package, color: "text-sky-600" },
          { label: "Đang cắt", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "dang_lam").length, icon: Clock, color: "text-amber-600" },
          { label: "Đã cắt xong", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "hoan_thanh").length, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Có lỗi", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "co_loi").length, icon: AlertTriangle, color: "text-rose-600" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="text-xs text-slate-500 flex items-center gap-1">
              <k.icon className="w-3 h-3" /> {k.label}
            </div>
            <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Danh sách lệnh cắt */}
      {lcCoCat.length === 0 ? (
        <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Scissors className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Chưa có lệnh cắt nào được giao</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lcCoCat.map(lc => {
            const pc = getPhanCongCat(lc) as any;
            const tt = (pc?.trangThaiCD as TrangThaiCongDoan | undefined) ?? "cho_giao";
            const style = TRANG_THAI_CD_STYLE[tt];
            const isLate = lc.hanHoanThanh < new Date().toISOString().split("T")[0] && tt !== "hoan_thanh";
            const isExpanded = selectedId === lc.id;

            return (
              <div key={lc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isLate ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-200"}`}>
                {/* Card header */}
                <div className={`px-4 py-3 flex items-center justify-between ${style.bg}`}>
                  <div>
                    <span className="font-black text-teal-700 font-mono text-sm">{lc.id}</span>
                    <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold ${style.bg} ${style.text} border border-current/20`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${style.dot}`} />
                      {TRANG_THAI_CD_LABELS[tt]}
                    </span>
                  </div>
                  {isLate && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                </div>

                <div className="p-4 space-y-3">
                  {/* Ảnh + tên SP */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {lc.dsMau?.[0]?.img ? (
                        <img src={lc.dsMau[0].img} alt="SP" className="w-full h-full object-cover" />
                      ) : (
                        <Scissors className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-lg leading-tight">{lc.tenSP}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Mã: {lc.maSP} · {lc.tongSL?.toLocaleString()} SP</div>
                      <div className="text-xs text-slate-500">Size: {lc.tiLeSize}</div>
                    </div>
                  </div>

                  {/* Thợ cắt */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">Thợ cắt:</span>
                    <span className="font-bold text-slate-800">{pc?.nguoiTen || <span className="italic text-slate-400">Chưa giao</span>}</span>
                  </div>

                  {/* Hạn */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Hạn hoàn thành:</span>
                    <span className={`font-bold ${isLate ? "text-rose-600" : "text-slate-700"}`}>
                      <DateDisplay value={lc.hanHoanThanh} format="dd/MM/yyyy" showRelative />
                    </span>
                  </div>

                  {/* Sơ đồ cắt */}
                  {lc.daCoSoDo && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                      <FileText className="w-3 h-3" />
                      <span className="font-bold">Sơ đồ cắt (Chính/Phối):</span>
                      <div className="ml-auto flex items-center gap-3">
                        {lc.pdfSoDoChinh && (
                          <a href={lc.pdfSoDoChinh} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-sky-600 hover:underline font-bold bg-sky-100 px-2 py-1 rounded">
                            <Eye className="w-3 h-3" /> PDF Chính
                          </a>
                        )}
                        {lc.pdfSoDoPhoi && (
                          <a href={lc.pdfSoDoPhoi} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-sky-600 hover:underline font-bold bg-sky-100 px-2 py-1 rounded">
                            <Eye className="w-3 h-3" /> PDF Phối
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {lc.ghiChuKyThuat && (
                    <div className="text-xs bg-slate-50 rounded-lg px-3 py-2 text-slate-600 border border-slate-200">
                      📝 <span className="font-bold">Ghi chú kỹ thuật:</span> {lc.ghiChuKyThuat}
                    </div>
                  )}

                  {/* Màu sắc trải/phối */}
                  {lc.dsMau && lc.dsMau.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <div className="text-xs font-bold text-slate-600 mb-2">🎨 Chi tiết màu sắc (Trải/Phối):</div>
                      <div className="flex flex-col gap-2">
                        {lc.dsMau.map((mau, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center gap-3">
                            {mau.img && <img src={mau.img} alt={mau.ten} className="w-8 h-8 rounded object-cover border border-slate-200" />}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-black text-slate-700">{mau.ten}</span>
                                <span className="text-[11px] font-bold text-emerald-600">SL: {mau.slDuKien} SP</span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Mã vải: {mau.maVai} • Định mức: {mau.dinhMuc} kg/SP</div>
                              {mau.maVaiQuan && (
                                <div className="text-[10px] text-slate-500 mt-0.5">Vải quần: {mau.maVaiQuan} • Định mức quần: {mau.dinhMucQuan} kg/SP</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input SL khi hoàn thành */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="text-xs font-bold text-slate-600">Số SP thực tế đã cắt:</div>
                      <input
                        type="number"
                        value={slInput[lc.id] ?? lc.tongSL}
                        onChange={e => setSlInput(prev => ({ ...prev, [lc.id]: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                        max={lc.tongSL}
                      />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    {tt === "cho_giao" && (
                      <button
                        onClick={() => handleNhanViec(lc)}
                        className="flex-1 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Scissors className="w-4 h-4" /> Nhận việc
                      </button>
                    )}
                    {tt === "dang_lam" && (
                      <>
                        <button
                          onClick={() => setSelectedId(isExpanded ? null : lc.id)}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {isExpanded ? "Xác nhận" : "Hoàn thành & Chuyển tiếp"}
                        </button>
                        {isExpanded && (
                          <button
                            onClick={() => handleHoanThanh(lc)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700"
                          >✓</button>
                        )}
                        <button
                          onClick={() => handleCoLoi(lc)}
                          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 border border-rose-200"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {tt === "hoan_thanh" && (
                      <div className="flex-1 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-200 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Đã cắt xong {pc?.soLuongHoanThanh || lc.tongSL} SP
                      </div>
                    )}
                    {tt === "co_loi" && (
                      <button
                        onClick={() => handleNhanViec(lc)}
                        className="flex-1 py-2 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-4 h-4" /> Làm lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
