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
import { DateDisplay, CrudModal } from "@/components/ui";
import { LenhCatColorCards } from "@/components/ui/LenhCatColorCards";
import { GiaCongModal } from "@/components/modals/GiaCongModal";
import { TyLeSizeModal } from "@/components/modals/TyLeSizeModal";
import { useSession } from "@/components/session-provider";

export default function CongViecCatPage() {
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai, suaLenhCat } = useLenhCat();
  const { themGiaoDich } = useKho();
  const { user } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [modalGiaCong, setModalGiaCong] = useState<{ id: string, type: "ao" | "quan" } | null>(null);
  const [modalTyLeMau, setModalTyLeMau] = useState<{ id: string, mauIdx: number } | null>(null);

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

  function handleHoanThanh(lc: any, newDsMau?: any[], totalThucTe?: number) {
    const pc = getPhanCongCat(lc);
    if (!pc) return;
    
    // Nếu có truyền newDsMau thì gọi suaLenhCat để cập nhật
    if (newDsMau && typeof totalThucTe === 'number') {
      suaLenhCat(lc.id, { dsMau: newDsMau, tongSLThucTe: totalThucTe }, user as any);
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: totalThucTe });
      toast.success(`✅ Lưu thông số và hoàn thành: ${totalThucTe} SP`);
    } else {
      // Trường hợp xác nhận đơn giản nếu không nhập chi tiết
      const sl = totalThucTe || lc.tongSLThucTe || lc.tongSL;
      capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "hoan_thanh", soLuongHoanThanh: sl });
      toast.success(`✅ Chuyển tiếp thành công: ${sl} SP`);
    }
    
    setSelectedId(null);
  }

  function handleCoLoi(lc: any) {
    const pc = getPhanCongCat(lc);
    if (!pc) return;
    capNhatCongDoan(lc.id, pc.id, { trangThaiCD: "co_loi" });
    toast.error(`⚠️ Đã báo lỗi cắt: ${lc.id}`);
  }

  function handleToggleChiTiet(lenhId: string, congDoanId: string, key: string, currentChiTiet: any) {
    const current = currentChiTiet[key];
    let next = "hoan_thanh";
    if (current === "cho_lam") next = "hoan_thanh";
    else if (current === "hoan_thanh") next = "khong_can";
    else if (current === "khong_can") next = "cho_lam";
    
    capNhatCongDoan(lenhId, congDoanId, {
      catChiTiet: { ...currentChiTiet, [key]: next }
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
              <Scissors className="w-7 h-7 text-sky-600" /> Tổ Cắt – Công việc
            </h1>
            <p className="text-sm font-bold text-slate-600 mt-1">
              {lcCoCat.length} lệnh cắt · {tongSLChuaCat.toLocaleString()} SP chưa cắt
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Lệnh được giao", value: lcCoCat.length, icon: Package, color: "text-sky-600" },
            { label: "Đang cắt", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "dang_lam").length, icon: Clock, color: "text-amber-600" },
            { label: "Đã cắt xong", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "hoan_thanh").length, icon: CheckCircle2, color: "text-emerald-700" },
            { label: "Có lỗi", value: lcCoCat.filter(lc => getPhanCongCat(lc)?.trangThaiCD === "co_loi").length, icon: AlertTriangle, color: "text-rose-700" },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <k.icon className="w-3.5 h-3.5" /> {k.label}
              </div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
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

            const isBo = lc.loaiSP?.toLowerCase().includes("bo");
            const isAo = lc.loaiSP?.toLowerCase().includes("ao") || isBo;
            const isQuan = lc.loaiSP?.toLowerCase().includes("quan") || isBo;

            return (
              <div key={lc.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${isLate ? "border-rose-300 ring-2 ring-rose-200" : "border-slate-200"}`}>
                {/* Card header */}
                <div className={`px-4 py-3 flex items-center justify-between ${style.bg} border-b border-current/10`}>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-teal-700 font-mono text-sm">{lc.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${style.bg} ${style.text} border border-current/20 flex items-center`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${style.dot}`} />
                      {TRANG_THAI_CD_LABELS[tt]}
                    </span>
                    {isLate && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAo && (
                      <button
                        onClick={() => setModalGiaCong({ id: lc.id, type: "ao" })}
                        className="px-3 py-1 bg-white border border-violet-200 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-50 transition-colors shadow-sm"
                      >
                        Gia công áo
                      </button>
                    )}
                    {isQuan && (
                      <button
                        onClick={() => setModalGiaCong({ id: lc.id, type: "quan" })}
                        className="px-3 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm"
                      >
                        Gia công quần
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Các màu vải (Cards ngang) */}
                  <div className="-mx-4 sm:-mx-5 mt-2">
                    <LenhCatColorCards lc={lc} onClickColor={(idx) => setModalTyLeMau({ id: lc.id, mauIdx: idx })} />
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

                  {/* Chi tiết 4 bước cắt */}
                  {tt === "dang_lam" && (
                    <div className="border-t border-slate-100 pt-3 mt-3">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tiến độ chi tiết (Bấm để đổi)</div>
                      <div className="grid grid-cols-2 gap-2">
                        {(() => {
                          const catChiTiet = pc?.catChiTiet || { traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" };
                          const steps = [
                            { key: "traiVai", label: "Trải vải" },
                            { key: "catHang", label: "Cắt hàng" },
                            { key: "epNhan", label: "Ép nhãn" },
                            { key: "epKeo", label: "Ép keo" }
                          ] as const;
                          return steps.map(({ key, label }) => {
                            const val = catChiTiet[key as keyof typeof catChiTiet];
                            const color = val === "hoan_thanh" ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                                        : val === "khong_can" ? "bg-slate-100 text-slate-400 border-slate-200 line-through" 
                                        : "bg-white text-slate-600 border-slate-300";
                            return (
                              <button 
                                key={key} 
                                onClick={() => handleToggleChiTiet(lc.id, pc.id, key, catChiTiet)} 
                                className={`px-2 py-2 rounded-lg border text-xs font-bold transition-all hover:brightness-95 flex items-center justify-center gap-1.5 shadow-sm ${color}`}
                              >
                                {val === "hoan_thanh" && <CheckCircle2 className="w-3.5 h-3.5" />}
                                {label}
                                {val === "khong_can" && " (Bỏ qua)"}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    {tt === "cho_giao" && (
                      <button
                        onClick={() => handleNhanViec(lc)}
                        className="flex-1 py-2.5 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-sky-200"
                      >
                        <Scissors className="w-4 h-4" /> Bắt đầu cắt & Xuất kho
                      </button>
                    )}
                    {tt === "dang_lam" && (
                      <>
                        {(() => {
                          const catChiTiet = pc?.catChiTiet || { traiVai: "cho_lam", catHang: "cho_lam", epNhan: "cho_lam", epKeo: "cho_lam" };
                          const isAllDone = Object.values(catChiTiet).every(val => val === "hoan_thanh" || val === "khong_can");
                          return (
                            <div className="flex-1 flex gap-2">
                              {!isAllDone ? (
                                <div className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-sm text-center border border-slate-200 cursor-not-allowed">
                                  Hoàn thành các bước trên
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setSelectedId(isExpanded ? null : lc.id)}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200"
                                  >
                                    {isExpanded ? "Đóng" : "Chuyển tiếp (Hoàn thành)"}
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })()}
                        <button
                          onClick={() => handleCoLoi(lc)}
                          className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 border border-rose-200 shadow-sm"
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

                {/* Modals for this LC */}
                {modalGiaCong?.id === lc.id && (
                  <GiaCongModal
                    lc={lc}
                    type={modalGiaCong.type}
                    onClose={() => setModalGiaCong(null)}
                    onSave={(slThucTe, dsPhanCong) => {
                      // Save outsourcing changes
                      suaLenhCat(lc.id, { 
                        phanCong: dsPhanCong,
                        ...(modalGiaCong.type === "ao" ? { tongSLThucTeAo: slThucTe } : { tongSLThucTeQuan: slThucTe })
                      }, user as any);
                    }}
                  />
                )}

                {modalTyLeMau?.id === lc.id && (
                  <TyLeSizeModal
                    lc={lc}
                    mauIdx={modalTyLeMau.mauIdx}
                    onClose={() => setModalTyLeMau(null)}
                    onSave={(mauIdx, newTyLe) => {
                      const newDsMau = [...(lc.dsMau || [])];
                      newDsMau[mauIdx] = { ...newDsMau[mauIdx], tyLeSizeChiTiet: newTyLe };
                      
                      // Tự động tính lại tổng SL thực tế của khâu Cắt
                      let totalThucTe = 0;
                      newDsMau.forEach(mau => {
                        if (mau.tyLeSizeChiTiet) {
                          const catKey = Object.keys(mau.tyLeSizeChiTiet).find(k => k.toLowerCase().includes("cat"));
                          if (catKey && mau.tyLeSizeChiTiet[catKey]) {
                            totalThucTe += mau.tyLeSizeChiTiet[catKey].reduce((sum: number, sz: any) => sum + (sz.sl || 0), 0);
                          }
                        }
                      });

                      suaLenhCat(lc.id, { dsMau: newDsMau, tongSLThucTe: totalThucTe }, user as any);
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
