"use client";

// ============ UI ĐÓNG GÓI (/ui-dong-goi) ============
// Nhận hàng từ Ủi đạt, Đóng gói, giao Kho Thành Phẩm

import { useState } from "react";
import { CheckCircle2, Package, Box } from "lucide-react";
import { toast } from "sonner";
import { useLenhCat, TRANG_THAI_CD_LABELS, TRANG_THAI_CD_STYLE, type TrangThaiCongDoan, type LenhCat } from "@/lib/data/lenh-cat-store";
import { kiemTraTruocHoanThanh } from "@/lib/data/cong-doan-helper";
import { LenhCatCardV2, ChiTietMauHistoryModal, type ChiTietMauInput } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { supabaseUpsertRaw } from "@/lib/supabase/sync-helper";
import { toSupabaseRow, type SanPhamTP } from "../kho-thanh-pham/data";

export default function UiDongGoiPage() {
  const [selectedMau, setSelectedMau] = useState<{lc: LenhCat, mau: any} | null>(null);
  const { dsLenhCat, capNhatCongDoan, capNhatTrangThai, suaLenhCat } = useLenhCat();
  const { dsSanPham: dsDanhMuc, suaSP } = useDanhMucSP();
  const [khuVuc, setKhuVuc] = useState<Record<string, string>>({});

  const { user } = useSession();

  function getHTPC(lc: any) {
    return lc.phanCong?.filter((pc: any) => {
      const isHT = pc.id === "dongGoi" || pc.id === "dong_goi" || pc.tenCongDoan?.toLowerCase().includes("đóng gói");
      
      // Nếu không có người phụ trách (bỏ qua/không chọn) thì không hiển thị
      if (isHT && (!pc.nguoiMa || pc.nguoiMa === "")) {
        return false;
      }

      if (user?.laCongNhan) {
        const isMyTask = pc.nguoiMa === user.id || pc.nguoiMa === user.maNV || pc.nguoiTen?.includes(user.name);
        return isHT && isMyTask;
      }
      return isHT;
    }) || [];
  }

  // LC chờ Đóng gói: Ủi đã xong
  const lcHT = dsLenhCat.filter(lc => {
    // 1. Phải có công đoạn Đóng gói của TÔI
    const htPCs = getHTPC(lc);
    if (htPCs.length === 0) return false;

    // 2. Kiểm tra Ủi (hoặc khâu trước đó)
    const uiPCs = lc.phanCong?.filter((pc: any) => pc.id === "ui" || pc.tenCongDoan?.toLowerCase().includes("ủi")) || [];
    if (uiPCs.length > 0) {
      return uiPCs.every((pc: any) => pc.trangThaiCD === "hoan_thanh");
    }

    return true; // Nếu không có ủi thì hiển thị (Dự phòng)
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
    // Bắt buộc khai báo đạt/lỗi theo màu + chặn số vượt khâu trước.
    const kiemTra = kiemTraTruocHoanThanh(lc, pc);
    if (!kiemTra.ok) {
      toast.error(kiemTra.loi!, { duration: 6000 });
      return;
    }
    const { slDat, slLoi } = kiemTra;

    const thanhTienDat = slDat * (pc.donGia || 0);

    capNhatCongDoan(lc.id, pc.id, {
      trangThaiCD: "hoan_thanh",
      soLuongHoanThanh: slDat,
      soLuongLoi: slLoi,
      thanhTien: thanhTienDat, // Cập nhật lại công nợ theo SP đạt
      conLai: thanhTienDat - (pc.daThanhToan || 0)
    });

    // Nếu tất cả công đoạn HT đã xong → cập nhật LC HoanThanh
    const allPCs = getHTPC(lc);
    const allDone = allPCs.every((p: any) =>
      p.id === pc.id ? true : p.trangThaiCD === "hoan_thanh"
    );
    if (allDone) {
      toast.success(`🎉 ${lc.id} đóng gói hoàn thành toàn bộ – Đang chờ Nhập kho thành phẩm!`);
    } else {
      toast.success(`✅ Hoàn thành: ${slDat} SP đạt${slLoi > 0 ? `, ${slLoi} SP lỗi` : ""}`);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Transparent Glassmorphism Header Card */}
      <div className="bg-white/30 backdrop-blur-md border border-white/50 shadow-sm rounded-3xl p-5 mb-5 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2 text-slate-800 drop-shadow-sm">
            <Package className="w-7 h-7 text-amber-600" /> Đóng gói nhập kho – Việc của tôi
          </h1>
          <p className="text-sm font-bold text-slate-600 mt-1">{lcHT.length} lô đang cần Đóng gói & Nhập kho</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Đang làm", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "dang_lam")).length, color: "text-amber-700" },
            { label: "Chờ nhận", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => !pc.trangThaiCD || pc.trangThaiCD === "cho_giao")).length, color: "text-slate-800" },
            { label: "Hoàn thành", value: lcHT.filter(lc => getHTPC(lc).every((pc: any) => pc.trangThaiCD === "hoan_thanh")).length, color: "text-emerald-700" },
            { label: "Có lỗi", value: lcHT.filter(lc => getHTPC(lc).some((pc: any) => pc.trangThaiCD === "co_loi")).length, color: "text-rose-700" },
          ].map(k => (
            <div key={k.label} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white p-4 shadow-sm transition hover:scale-[1.02]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">{k.label}</div>
              <div className={`text-2xl font-black mt-1 ${k.color}`}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>

      {lcHT.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <div className="font-bold">Không có việc Đóng Gói nào</div>
          <div className="text-sm mt-1">Chờ Tổ Ủi hoàn thành sẽ xuất hiện ở đây để đóng gói & nhập kho</div>
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

                        <div className="flex gap-2">
                          {tt === "cho_giao" && (
                            <button onClick={() => handleNhanHang(lc, pc)}
                              className="flex-1 py-2 rounded-xl bg-sky-500 text-white font-bold text-sm hover:bg-sky-600 flex items-center justify-center gap-1.5">
                              <Package className="w-4 h-4" /> Nhận hàng
                            </button>
                          )}
                          {tt === "dang_lam" && (
                            <button onClick={() => handleXong(lc, pc)}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition-colors shadow-sm">
                              <CheckCircle2 className="w-4 h-4" /> Đóng Gói Xong & Chuyển Kho
                            </button>
                          )}
                          {tt === "hoan_thanh" && (
                            <div className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm flex flex-col justify-center gap-1">
                              <div className="flex items-center gap-2 font-bold text-emerald-700">
                                <CheckCircle2 className="w-4 h-4" /> Xong: {pc.soLuongHoanThanh ?? (pc.soLuong || lc.tongSL)} Đạt
                              </div>
                              {(pc.soLuongLoi > 0) && (
                                <div className="text-xs text-rose-600 font-semibold pl-6">
                                  ⚠️ Lỗi: {pc.soLuongLoi} SP
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
                          onChange={e => setKhuVuc((p: Record<string, string>) => ({ ...p, [lc.id]: e.target.value }))}
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

                          // Thêm vào kho thành phẩm: 1 dòng riêng cho MỖI MÀU (không gộp
                          // "Nhiều màu") - lấy ảnh từ dsMau gốc, số lượng thật từ chiTietMau
                          // của khâu Đóng gói (nếu có), fallback chia đều theo tổng SL.
                          const dongGoiPCs = getHTPC(lc);
                          const chiTietMauAll: any[] = dongGoiPCs.flatMap((pc: any) => pc.chiTietMau || []);
                          const dsMauLC = lc.dsMau && lc.dsMau.length > 0 ? lc.dsMau : [{ ten: "Mặc định", img: "" }];

                          // Giá vốn 1 SP đã được tính sẵn lúc tạo lệnh cắt (vải + phụ liệu
                          // + gia công + chi phí cố định). Trước đây bị gán cứng donGia: 0
                          // nên cột "Giá trị" của Kho thành phẩm luôn hiện 0đ.
                          const giaVon1SP = Math.round(
                            lc.bangCOGS?.giaVonBinhQuan || lc.bangCOGS?.giaVon1SP || 0
                          );

                          const newSPs: SanPhamTP[] = dsMauLC.map((m: any, idx: number) => {
                            const ct = chiTietMauAll.find((c: any) => c.mau === m.ten);
                            const sl = ct?.soLuongDat ?? Math.round((lc.tongSL || 0) / dsMauLC.length);
                            const chiTietSz = ct?.sizes || m.phanBoSize || [];
                            const strTiLeSize = chiTietSz.filter((x: any) => x.sl > 0).map((x: any) => `${x.size}:${x.sl}`).join(", ");
                            return {
                              id: `SP-${Date.now()}-${idx}`,
                              maSP: lc.maSP || lc.id,
                              tenSP: lc.tenSP,
                              phanLoai: lc.loaiSP === "BoTru" ? "Bộ Trụ" : lc.loaiSP === "AoTru" ? "Áo Trụ" : lc.loaiSP === "AoCoTron" ? "Áo Cổ Tròn" : lc.loaiSP === "BoCoTron" ? "Bộ Cổ Tròn" : lc.loaiSP === "AoPolo" ? "Áo Polo" : lc.loaiSP === "PhuKien" ? "Phụ Kiện" : "Áo",
                              mau: m.ten,
                              size: "Nhiều size",
                              lsx: lc.id,
                              ngayNhap: new Date().toISOString().split("T")[0],
                              soLuong: sl,
                              donGia: giaVon1SP,
                              giaTri: sl * giaVon1SP,
                              viTri: khuVuc[lc.id],
                              trangThai: "con",
                              hinhAnh: m.img ? [m.img] : [],
                              imgQuan: m.imgQuan || undefined,
                              chiTietSize: chiTietSz,
                              tiLeSize: strTiLeSize,
                            };
                          });

                          try {
                            const khoKey = "mimin_kho_thanh_pham_v2";
                            const currentKho = JSON.parse(localStorage.getItem(khoKey) || "[]");
                            currentKho.push(...newSPs);
                            localStorage.setItem(khoKey, JSON.stringify(currentKho));
                          } catch (e) {
                            console.error("Lỗi khi thêm vào kho thành phẩm (local)", e);
                          }
                          newSPs.forEach((sp) => {
                            supabaseUpsertRaw("kho_thanh_pham", toSupabaseRow(sp)).catch((e) =>
                              console.error("Lỗi khi đồng bộ kho thành phẩm lên Supabase", e)
                            );
                          });

                          // Cập nhật lại màu và size chuẩn vào Danh mục sản phẩm
                          const existingDM = dsDanhMuc.find(d => d.id === lc.maSP || d.maSP === lc.maSP);
                          if (existingDM) {
                            const newDM = { ...existingDM };
                            let changed = false;

                            const allSizesMap: Record<string, number> = {};
                            newSPs.forEach(sp => {
                              sp.chiTietSize?.forEach((sz: any) => {
                                allSizesMap[sz.size] = (allSizesMap[sz.size] || 0) + sz.sl;
                              });
                            });
                            
                            const totalTiLeStr = Object.entries(allSizesMap).map(([size, sl]) => `${size}:${sl}`).join(", ");
                            if (totalTiLeStr && newDM.tiLeSize !== totalTiLeStr) {
                              newDM.tiLeSize = totalTiLeStr;
                              changed = true;
                            }

                            const newDsMau = [...(newDM.dsMau || [])];
                            newSPs.forEach(sp => {
                              const mIdx = newDsMau.findIndex(m => m.ten === sp.mau);
                              if (mIdx >= 0) {
                                // Đã có màu này trong danh mục -> giữ nguyên
                              } else {
                                // Thêm màu mới bị phát sinh
                                newDsMau.push({ ten: sp.mau, maSKU: `${newDM.id}-${sp.mau}`, dinhMuc: 0, img: sp.hinhAnh?.[0] || "" });
                                changed = true;
                              }
                            });

                            if (changed) {
                              newDM.dsMau = newDsMau;
                              suaSP(newDM.id, newDM);
                            }
                          }

                          toast.success(`📦 Đã nhập kho ${lc.id} (${newSPs.length} màu) tại ${khuVuc[lc.id]}`);
                        }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02]"
                      >
                        <Box className="w-5 h-5" /> Nhập kho thành phẩm
                      </button>
                    </div>
                  )}
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
    </div>
  );
}
