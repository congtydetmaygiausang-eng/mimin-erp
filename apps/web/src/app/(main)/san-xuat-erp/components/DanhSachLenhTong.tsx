"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Eye, Printer, Trash2, LayoutList, Package, Truck, Palette, Boxes,
  CheckCircle2, Clock, ChevronRight, FileText, Sparkles, Building2,
  Calendar, Search, X, Image as ImageIcon, Layers, DollarSign, ArrowUpRight
} from "lucide-react";
import { DateDisplay } from "@/components/ui/DateDisplay";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { Modal } from "./ui-blocks";
import PhieuNhapSoiPrint from "./PhieuNhapSoiPrint";
import PhieuGiaoDetPrint from "./PhieuGiaoDetPrint";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

function lamTronTheo100Dong(so: number) {
  return Math.round(so / 100) * 100;
}

export interface LenhSXRecord {
  id: string;
  ngayTao: string;
  trangThai: "Hoàn thành" | "Đang sản xuất" | "Chờ xử lý";
  nhapKhoNgay?: boolean;
  maLenhDet: string;
  maMeNhuom: string;
  
  // 1. Sợi
  nccId?: string;
  tenNccSoi: string;
  danhSachSoi: {
    id?: string;
    loaiSoi: string;
    maLoSoi: string;
    soKg: number;
    donGia: number;
    vat?: number;
    thanhTien?: number;
  }[];
  tongKgSoi: number;
  chiSoi?: number;
  vatSoi?: number;
  chiSoiCoVAT?: number;

  // 2. Dệt
  xuongDetId?: string;
  tenXuongDet: string;
  thongSoDet?: {
    loaiVaiDet?: string;
    khoVai?: number;
    trongLuongGSM?: number;
    haoHutDet?: number;
  };
  donGiaDet: number;
  vatDet?: number;
  chiDet?: number;
  chiDetCoVAT?: number;
  anhChungTuGiaoDet?: any[];

  // 3. Mộc
  tongKgMoc?: number;
  soCayMoc?: number;
  haoHutDetThucTe?: number;

  // 4. Nhuộm
  xuongNhuomId?: string;
  tenXuongNhuom: string;
  anhChungTuGiaoNhuom?: any[];
  chiNhuom?: number;
  vatNhuom?: number;
  chiNhuomCoVAT?: number;

  // 5. Màu
  danhSachMau: {
    maVai: string;
    mau: string;
    soKg: number;
    soCay?: number;
    donGiaNhuom: number;
    chiPhiHoaChat?: number;
    vat?: number;
    giaVonDuKien?: number;
  }[];
  tongKgMau?: number;

  // 6. Kho TP
  kho?: string;
  khu?: string;
  ke?: string;
  tongKgVaiTP?: number;
  tongCayVaiTP?: number;
  anhChungTuGiaoKhoTP?: any[];

  // 7. Tổng kết giá vốn & chi phí
  giaVonTheoMau?: any[];
  tongCong: number;
}

interface Props {
  onTaoLenhMoi?: () => void;
  selectedLenhId?: string;
}

export function DanhSachLenhTong({ onTaoLenhMoi, selectedLenhId }: Props) {
  const [danhSach, setDanhSach] = useState<LenhSXRecord[]>([]);
  const [selectedLenh, setSelectedLenh] = useState<LenhSXRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | "Hoàn thành" | "Đang sản xuất">("all");
  
  // In ấn
  const [inPhieuTong, setInPhieuTong] = useState<LenhSXRecord | null>(null);
  const [inPhieuNhapSoi, setInPhieuNhapSoi] = useState<LenhSXRecord | null>(null);
  const [inPhieuGiaoDet, setInPhieuGiaoDet] = useState<LenhSXRecord | null>(null);

  // Lightbox ảnh chứng từ
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Load danh sách lệnh
  const loadDanhSach = () => {
    try {
      const data = localStorage.getItem("mimin_lenh_tong_list");
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDanhSach(parsed);
          if (selectedLenhId) {
            const found = parsed.find((x: LenhSXRecord) => x.id === selectedLenhId);
            if (found) setSelectedLenh(found);
          }
          return;
        }
      }

      // Khởi tạo 1 lệnh sản xuất mẫu hoàn chỉnh để anh Cường xem ngay quy trình
      const mauMauRecord: LenhSXRecord = {
        id: "LSX-20261015-001",
        ngayTao: new Date().toISOString(),
        trangThai: "Hoàn thành",
        nhapKhoNgay: true,
        maLenhDet: "LD-20261015-01",
        maMeNhuom: "MN-20261015-01",
        // 1. Sợi
        tenNccSoi: "Công ty Sợi Phú Bài",
        danhSachSoi: [
          {
            id: "s1",
            loaiSoi: "Cotton 100% 30s/1 Compact",
            maLoSoi: "LSOI-PB-882",
            soKg: 1000,
            donGia: 85000,
            vat: 8,
            thanhTien: 85000000,
          },
        ],
        tongKgSoi: 1000,
        chiSoi: 85000000,
        vatSoi: 8,
        chiSoiCoVAT: 91800000,
        // 2. Dệt
        tenXuongDet: "Xưởng dệt Hưng Phát",
        thongSoDet: {
          loaiVaiDet: "Single Jersey Cotton Spandex 4C",
          khoVai: 185,
          trongLuongGSM: 195,
          haoHutDet: 3,
        },
        donGiaDet: 14000,
        vatDet: 8,
        chiDet: 14000000,
        chiDetCoVAT: 15120000,
        anhChungTuGiaoDet: [],
        // 3. Mộc
        tongKgMoc: 970,
        soCayMoc: 49,
        haoHutDetThucTe: 3,
        // 4. Nhuộm
        tenXuongNhuom: "Xưởng nhuộm Á Châu",
        anhChungTuGiaoNhuom: [],
        chiNhuom: 24250000,
        vatNhuom: 8,
        chiNhuomCoVAT: 26190000,
        // 5. Màu
        danhSachMau: [
          {
            maVai: "VAI-COTTON-DEN",
            mau: "Đen Tiêu Chuẩn (Black 19-4008)",
            soKg: 500,
            soCay: 25,
            donGiaNhuom: 26000,
            chiPhiHoaChat: 1500000,
            giaVon: 132400,
          },
          {
            maVai: "VAI-COTTON-TRANG",
            mau: "Trắng Sữa (Off White 11-0601)",
            soKg: 470,
            soCay: 24,
            donGiaNhuom: 24000,
            chiPhiHoaChat: 1000000,
            giaVon: 129800,
          },
        ],
        tongKgMau: 970,
        // 6. Kho TP
        kho: "Kho Vải TP",
        khu: "A",
        ke: "K02",
        tongKgVaiTP: 970,
        tongCayVaiTP: 49,
        anhChungTuGiaoKhoTP: [],
        // 7. Giá vốn & Tổng chi phí
        giaVonTheoMau: [
          {
            maVai: "VAI-COTTON-DEN",
            mau: "Đen Tiêu Chuẩn (Black 19-4008)",
            soKg: 500,
            donGiaNhuom: 26000,
            chiPhiHoaChat: 1500000,
            tienNhuom: 13000000,
            tienSoiPhanBo: 43814433,
            tienDetPhanBo: 7216495,
            vatSoiPhanBo: 3505155,
            vatDetPhanBo: 577320,
            vatNhuomPhanBo: 1160000,
            tongVATMau: 5242474,
            tongGiaVonChuaVAT: 65530928,
            tongGiaVonCoVAT: 70773402,
            giaVonMoiKg: 131062,
            giaVonMoiKgCoVAT: 141547,
          },
          {
            maVai: "VAI-COTTON-TRANG",
            mau: "Trắng Sữa (Off White 11-0601)",
            soKg: 470,
            donGiaNhuom: 24000,
            chiPhiHoaChat: 1000000,
            tienNhuom: 11280000,
            tienSoiPhanBo: 41185567,
            tienDetPhanBo: 6783505,
            vatSoiPhanBo: 3294845,
            vatDetPhanBo: 542680,
            vatNhuomPhanBo: 982400,
            tongVATMau: 4819925,
            tongGiaVonChuaVAT: 60249072,
            tongGiaVonCoVAT: 65068997,
            giaVonMoiKg: 128189,
            giaVonMoiKgCoVAT: 138445,
          },
        ],
        tongCong: 133110000,
      };

      setDanhSach([mauMauRecord]);
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify([mauMauRecord]));
      if (selectedLenhId === mauMauRecord.id) {
        setSelectedLenh(mauMauRecord);
      }
    } catch (e) {
      console.error("Lỗi đọc mimin_lenh_tong_list:", e);
    }
  };

  useEffect(() => {
    loadDanhSach();
    window.addEventListener("storage", loadDanhSach);
    return () => window.removeEventListener("storage", loadDanhSach);
  }, [selectedLenhId]);

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm(`Bạn có chắc muốn xóa lệnh sản xuất "${id}" khỏi danh sách hiển thị? (Không xóa dữ liệu tồn kho đã nhập)`)) {
      const newList = danhSach.filter((x) => x.id !== id);
      setDanhSach(newList);
      localStorage.setItem("mimin_lenh_tong_list", JSON.stringify(newList));
      if (selectedLenh?.id === id) setSelectedLenh(null);
    }
  };

  const filtered = useMemo(() => {
    return danhSach.filter((l) => {
      const matchSearch =
        search === "" ||
        [l.id, l.tenNccSoi, l.tenXuongDet, l.tenXuongNhuom, l.maLenhDet, l.maMeNhuom]
          .filter(Boolean)
          .some((val) => val.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        filterTrangThai === "all" ||
        (filterTrangThai === "Hoàn thành" && l.trangThai === "Hoàn thành") ||
        (filterTrangThai === "Đang sản xuất" && l.trangThai !== "Hoàn thành");

      return matchSearch && matchStatus;
    });
  }, [danhSach, search, filterTrangThai]);

  const handleOpenLightbox = (images: any[], startIndex = 0) => {
    const urls = images.map((img) => img.dataUrl || img.url || img).filter(Boolean);
    if (urls.length > 0) {
      setLightboxImages(urls);
      setLightboxIndex(startIndex);
    }
  };

  return (
    <div className="space-y-4">
      {/* TOOLBAR TÌM KIẾM & BỘ LỌC */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm backdrop-blur-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm mã lệnh, xưởng dệt, nhuộm..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-semibold focus:border-orange-500 focus:bg-white focus:outline-none transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lọc trạng thái */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterTrangThai("all")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "all" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Tất cả ({danhSach.length})
            </button>
            <button
              onClick={() => setFilterTrangThai("Hoàn thành")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "Hoàn thành" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Hoàn thành ({danhSach.filter((x) => x.trangThai === "Hoàn thành").length})
            </button>
            <button
              onClick={() => setFilterTrangThai("Đang sản xuất")}
              className={`px-3 py-1.5 rounded-lg transition ${filterTrangThai === "Đang sản xuất" ? "bg-white text-amber-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
            >
              Đang chạy ({danhSach.filter((x) => x.trangThai !== "Hoàn thành").length})
            </button>
          </div>
        </div>

        {onTaoLenhMoi && (
          <button
            onClick={onTaoLenhMoi}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:brightness-105 transition"
          >
            <Sparkles className="h-4 w-4" /> Tạo lệnh SX mới
          </button>
        )}
      </div>

      {/* DANH SÁCH CÁC LỆNH SX */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-12 text-center text-slate-500">
          <LayoutList className="h-12 w-12 mx-auto text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-700">Chưa có lệnh sản xuất nào trong danh sách</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Khi anh bấm "LƯU & TẠO LỆNH" ở tab Tạo lệnh, toàn bộ quy trình các bước sẽ được lưu và hiển thị chi tiết tại đây.
          </p>
          {onTaoLenhMoi && (
            <button
              onClick={onTaoLenhMoi}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-orange-700 transition"
            >
              <Sparkles className="h-4 w-4" /> Bắt đầu tạo lệnh ngay
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((lenh) => {
            const isCompleted = lenh.trangThai === "Hoàn thành";
            const tongKgMau = lenh.danhSachMau?.reduce((s, m) => s + (m.soKg || 0), 0) || 0;

            return (
              <div
                key={lenh.id}
                onClick={() => setSelectedLenh(lenh)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
              >
                {/* Header lệnh */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
                      <LayoutList className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-slate-900 group-hover:text-orange-600 transition">
                          {lenh.id}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3 animate-spin" />}
                          {isCompleted ? "Đã nhập kho TP" : "Đang sản xuất"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <DateDisplay value={lenh.ngayTao} format="dd/MM/yyyy HH:mm" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Tổng chi phí</div>
                      <div className="text-base sm:text-lg font-black text-amber-600">
                        {lenh.tongCong?.toLocaleString()}đ
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(lenh.id, e)}
                      title="Xóa lệnh này"
                      className="ml-2 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* STEPPER TIẾN TRÌNH 6 KHÂU QUY TRÌNH */}
                <div className="my-3 py-2 bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span>Quy trình các bước thực tế:</span>
                    <span className="text-orange-600 font-semibold lowercase">Click để xem chi tiết từng bước & chứng từ ➔</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {/* Bước 1: Sợi */}
                    <div className="bg-white p-2 rounded-lg border border-blue-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-blue-700 text-[11px] mb-1">
                        <Package className="h-3.5 w-3.5 text-blue-600" /> 1. Kho Sợi
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenNccSoi}</div>
                      <div className="text-blue-600 font-bold">{lenh.tongKgSoi?.toLocaleString()} kg</div>
                    </div>

                    {/* Bước 2: Dệt */}
                    <div className="bg-white p-2 rounded-lg border border-violet-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-violet-700 text-[11px] mb-1">
                        <Truck className="h-3.5 w-3.5 text-violet-600" /> 2. Xưởng Dệt
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenXuongDet}</div>
                      <div className="text-violet-600 font-bold">Lệnh: {lenh.maLenhDet}</div>
                    </div>

                    {/* Bước 3: Mộc */}
                    <div className="bg-white p-2 rounded-lg border border-purple-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-purple-700 text-[11px] mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> 3. NT Mộc
                      </div>
                      <div className="font-semibold text-slate-800">Đạt chuẩn</div>
                      <div className="text-purple-600 font-bold">~{lenh.tongKgMoc || lenh.tongKgSoi} kg</div>
                    </div>

                    {/* Bước 4: Nhuộm */}
                    <div className="bg-white p-2 rounded-lg border border-rose-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-rose-700 text-[11px] mb-1">
                        <Palette className="h-3.5 w-3.5 text-rose-600" /> 4. Xưởng Nhuộm
                      </div>
                      <div className="truncate font-semibold text-slate-800">{lenh.tenXuongNhuom}</div>
                      <div className="text-rose-600 font-bold">Mẻ: {lenh.maMeNhuom}</div>
                    </div>

                    {/* Bước 5: Màu */}
                    <div className="bg-white p-2 rounded-lg border border-pink-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-pink-700 text-[11px] mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-pink-600" /> 5. NT Màu
                      </div>
                      <div className="font-semibold text-slate-800">{lenh.danhSachMau?.length || 0} màu</div>
                      <div className="text-pink-600 font-bold">{tongKgMau.toLocaleString()} kg</div>
                    </div>

                    {/* Bước 6: Kho TP */}
                    <div className="bg-white p-2 rounded-lg border border-emerald-100 text-xs shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-[11px] mb-1">
                        <Boxes className="h-3.5 w-3.5 text-emerald-600" /> 6. Kho Vải TP
                      </div>
                      <div className="font-semibold text-slate-800">Khu {lenh.khu || "C"} · Kệ {lenh.ke || "C01"}</div>
                      <div className="text-emerald-600 font-bold">{lenh.tongKgVaiTP || tongKgMau} kg</div>
                    </div>
                  </div>
                </div>

                {/* Footer card: nút thao tác */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    {lenh.anhChungTuGiaoDet?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoDet.length} ảnh giao dệt</span> : null}
                    {lenh.anhChungTuGiaoNhuom?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-violet-50 text-violet-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoNhuom.length} ảnh giao nhuộm</span> : null}
                    {lenh.anhChungTuGiaoKhoTP?.length ? <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded"><ImageIcon className="h-3 w-3" /> {lenh.anhChungTuGiaoKhoTP.length} ảnh giao kho</span> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInPhieuTong(lenh);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 transition"
                    >
                      <Printer className="h-3.5 w-3.5" /> In phiếu SX
                    </button>
                    <button
                      onClick={() => setSelectedLenh(lenh)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> Xem đầy đủ các bước
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CHI TIẾT ĐẦY ĐỦ CÁC QUY TRÌNH CỦA CÁC BƯỚC */}
      {/* ============================================================ */}
      {selectedLenh && (
        <Modal onClose={() => setSelectedLenh(null)}>
          <div className="max-h-[85vh] overflow-y-auto space-y-4 p-1">
            {/* Header Modal */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-md">
                  <LayoutList className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedLenh.id}</h3>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                      {selectedLenh.trangThai}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Quy trình sản xuất vải khép kín từ Sợi ➔ Dệt vải mộc ➔ Nhuộm thành phẩm ➔ Nhập kho vải TP
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInPhieuTong(selectedLenh)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-black text-white shadow hover:bg-orange-700 transition"
                >
                  <Printer className="h-4 w-4" /> IN PHIẾU TỔNG HỢP
                </button>
              </div>
            </div>

            {/* BƯỚC 1: SỢI + NCC SỢI */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2 mb-3">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">1</span>
                  BƯỚC 1: KHO SỢI & NHÀ CUNG CẤP SỢI
                </div>
                <button
                  onClick={() => setInPhieuNhapSoi(selectedLenh)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" /> In phiếu nhập sợi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-3">
                <div><span className="text-slate-500">Nhà cung cấp sợi:</span> <b className="text-slate-800">{selectedLenh.tenNccSoi}</b></div>
                <div><span className="text-slate-500">Tổng khối lượng sợi:</span> <b className="text-blue-700 font-bold">{selectedLenh.tongKgSoi?.toLocaleString()} kg</b></div>
                <div><span className="text-slate-500">VAT Sợi:</span> <b>{selectedLenh.vatSoi ? `${selectedLenh.vatSoi}%` : "Chưa VAT"}</b></div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-blue-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-blue-50 text-blue-900 border-b border-blue-100">
                    <tr>
                      <th className="p-2.5">Loại sợi</th>
                      <th className="p-2.5">Mã lô sợi</th>
                      <th className="p-2.5 text-right">Số kg</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 font-medium">
                    {selectedLenh.danhSachSoi?.map((s, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{s.loaiSoi}</td>
                        <td className="p-2.5 font-mono text-blue-600">{s.maLoSoi}</td>
                        <td className="p-2.5 text-right font-bold">{s.soKg?.toLocaleString()} kg</td>
                        <td className="p-2.5 text-right">{s.donGia?.toLocaleString()}đ</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {((s.soKg || 0) * (s.donGia || 0)).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BƯỚC 2: XƯỞNG DỆT GIA CÔNG */}
            <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4">
              <div className="flex items-center justify-between border-b border-violet-100 pb-2 mb-3">
                <div className="flex items-center gap-2 font-bold text-violet-900 text-sm">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white text-xs font-black">2</span>
                  BƯỚC 2: XƯỞNG DỆT GIA CÔNG VẢI MỘC
                </div>
                <button
                  onClick={() => setInPhieuGiaoDet(selectedLenh)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:underline"
                >
                  <Printer className="h-3.5 w-3.5" /> In phiếu giao dệt
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                <div><span className="text-slate-500">Xưởng dệt:</span> <b className="text-slate-800">{selectedLenh.tenXuongDet}</b></div>
                <div><span className="text-slate-500">Mã lệnh dệt:</span> <b className="text-violet-700 font-mono">{selectedLenh.maLenhDet}</b></div>
                <div><span className="text-slate-500">Đơn giá dệt:</span> <b>{selectedLenh.donGiaDet?.toLocaleString()}đ/kg</b></div>
                <div><span className="text-slate-500">Thuế VAT Dệt:</span> <b>{selectedLenh.vatDet || 0}%</b></div>
              </div>

              {selectedLenh.thongSoDet && (
                <div className="rounded-xl border border-violet-200 bg-white p-3 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <div><span className="text-slate-500">Loại vải dệt:</span> <b className="text-slate-800">{selectedLenh.thongSoDet.loaiVaiDet || "Vải Thun/Polo"}</b></div>
                  <div><span className="text-slate-500">Khổ vải:</span> <b>{selectedLenh.thongSoDet.khoVai || 180} cm</b></div>
                  <div><span className="text-slate-500">Trọng lượng GSM:</span> <b>{selectedLenh.thongSoDet.trongLuongGSM || 220} g/m²</b></div>
                  <div><span className="text-slate-500">Hao hụt dệt định mức:</span> <b className="text-rose-600">{selectedLenh.thongSoDet.haoHutDet || 3}%</b></div>
                </div>
              )}

              {/* Ảnh chứng từ giao dệt */}
              {selectedLenh.anhChungTuGiaoDet && selectedLenh.anhChungTuGiaoDet.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-bold text-violet-800 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Ảnh biên bản / chứng từ bàn giao sợi cho xưởng dệt ({selectedLenh.anhChungTuGiaoDet.length} ảnh):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLenh.anhChungTuGiaoDet.map((img, i) => (
                      <img
                        key={i}
                        src={img.dataUrl || img.url || img}
                        alt="Chứng từ giao dệt"
                        onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoDet!, i)}
                        className="h-16 w-16 object-cover rounded-lg border border-violet-200 cursor-pointer hover:opacity-80 transition shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BƯỚC 3 & 4: MỘC & XƯỞNG NHUỘM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bước 3: Nghiệm thu mộc */}
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-purple-900 text-sm border-b border-purple-100 pb-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs font-black">3</span>
                  BƯỚC 3: NGHIỆM THU VẢI MỘC
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khối lượng mộc nhận:</span>
                    <b className="text-purple-700 font-bold">{selectedLenh.tongKgMoc || selectedLenh.tongKgSoi} kg</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Đánh giá chất lượng:</span>
                    <b className="text-emerald-700">Đạt tiêu chuẩn dệt</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hao hụt dệt thực tế:</span>
                    <b className="text-slate-700">{selectedLenh.haoHutDetThucTe || selectedLenh.thongSoDet?.haoHutDet || 3}%</b>
                  </div>
                </div>
              </div>

              {/* Bước 4: Xưởng Nhuộm */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-sm border-b border-rose-100 pb-2 mb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white text-xs font-black">4</span>
                  BƯỚC 4: XƯỞNG NHUỘM GIA CÔNG
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Xưởng nhuộm:</span>
                    <b className="text-slate-800">{selectedLenh.tenXuongNhuom}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã mẻ nhuộm:</span>
                    <b className="text-rose-700 font-mono">{selectedLenh.maMeNhuom}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã lô mộc chuyển:</span>
                    <b className="font-mono text-slate-700">LM-{selectedLenh.maLenhDet}</b>
                  </div>
                </div>

                {/* Ảnh chứng từ giao nhuộm */}
                {selectedLenh.anhChungTuGiaoNhuom && selectedLenh.anhChungTuGiaoNhuom.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-rose-100">
                    <div className="text-[11px] font-bold text-rose-800 mb-1 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Chứng từ dệt giao mộc sang nhuộm ({selectedLenh.anhChungTuGiaoNhuom.length} ảnh):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLenh.anhChungTuGiaoNhuom.map((img, i) => (
                        <img
                          key={i}
                          src={img.dataUrl || img.url || img}
                          alt="Chứng từ giao nhuộm"
                          onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoNhuom!, i)}
                          className="h-12 w-12 object-cover rounded-md border border-rose-200 cursor-pointer hover:opacity-80 transition"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BƯỚC 5: NGHIỆM THU MÀU NHUỘM */}
            <div className="rounded-2xl border border-pink-200 bg-pink-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-pink-900 text-sm border-b border-pink-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-600 text-white text-xs font-black">5</span>
                BƯỚC 5: PHÂN BỔ MÀU NHUỘM & NGHIỆM THU MÀU
              </div>

              <div className="overflow-x-auto rounded-xl border border-pink-200 bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-pink-50 text-pink-900 border-b border-pink-100">
                    <tr>
                      <th className="p-2.5">Mã vải</th>
                      <th className="p-2.5">Tên màu</th>
                      <th className="p-2.5 text-right">Số kg</th>
                      <th className="p-2.5 text-right">Số cây</th>
                      <th className="p-2.5 text-right">Đơn giá nhuộm</th>
                      <th className="p-2.5 text-right">Chi phí nhuộm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-50 font-medium">
                    {selectedLenh.danhSachMau?.map((m, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{m.maVai}</td>
                        <td className="p-2.5 font-bold text-pink-700">{m.mau}</td>
                        <td className="p-2.5 text-right font-bold">{m.soKg?.toLocaleString()} kg</td>
                        <td className="p-2.5 text-right">{m.soCay || Math.ceil(m.soKg / 20)} cây</td>
                        <td className="p-2.5 text-right">{m.donGiaNhuom?.toLocaleString()}đ/kg</td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          {((m.soKg || 0) * (m.donGiaNhuom || 0)).toLocaleString()}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BƯỚC 6: NHẬP KHO VẢI THÀNH PHẨM */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm border-b border-emerald-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black">6</span>
                BƯỚC 6: NHẬP KHO VẢI THÀNH PHẨM
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Vị trí lưu kho</div>
                  <div className="font-bold text-slate-900 text-sm">Khu {selectedLenh.khu || "C"} · Kệ {selectedLenh.ke || "C01"}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Tổng kg nhập kho</div>
                  <div className="font-bold text-emerald-600 text-sm">{selectedLenh.tongKgVaiTP || selectedLenh.tongKgMau} kg</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Tổng số cây vải</div>
                  <div className="font-bold text-emerald-600 text-sm">{selectedLenh.tongCayVaiTP || "Nhiều"} cây</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-slate-500 mb-0.5">Sẵn sàng cắt may</div>
                  <div className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Tổ Cắt lấy được ngay
                  </div>
                </div>
              </div>

              {/* Ảnh chứng từ giao kho vải TP */}
              {selectedLenh.anhChungTuGiaoKhoTP && selectedLenh.anhChungTuGiaoKhoTP.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                    <ImageIcon className="h-3.5 w-3.5" /> Biên bản / chứng từ nhuộm giao kho vải TP ({selectedLenh.anhChungTuGiaoKhoTP.length} ảnh):
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedLenh.anhChungTuGiaoKhoTP.map((img, i) => (
                      <img
                        key={i}
                        src={img.dataUrl || img.url || img}
                        alt="Chứng từ giao kho TP"
                        onClick={() => handleOpenLightbox(selectedLenh.anhChungTuGiaoKhoTP!, i)}
                        className="h-16 w-16 object-cover rounded-lg border border-emerald-200 cursor-pointer hover:opacity-80 transition shadow-2xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BƯỚC 7: GIÁ VỐN & CÔNG NỢ TỔNG HỢP */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-sm border-b border-amber-100 pb-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-white text-xs font-black">7</span>
                BƯỚC 7: TỔNG HỢP GIÁ VỐN & CÔNG NỢ CÁC KHÂU
              </div>

              {selectedLenh.giaVonTheoMau && selectedLenh.giaVonTheoMau.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white mb-3">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-amber-50 text-amber-900 border-b border-amber-100">
                      <tr>
                        <th className="p-2.5">Màu vải</th>
                        <th className="p-2.5 text-right">Số kg</th>
                        <th className="p-2.5 text-right">Sợi/kg</th>
                        <th className="p-2.5 text-right">Dệt/kg</th>
                        <th className="p-2.5 text-right">Nhuộm/kg</th>
                        <th className="p-2.5 text-right font-black text-amber-800">Giá vốn TP / kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50 font-medium">
                      {selectedLenh.giaVonTheoMau.map((g, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-900">{g.mau}</td>
                          <td className="p-2.5 text-right">{g.soKg?.toLocaleString()} kg</td>
                          <td className="p-2.5 text-right">{lamTronTheo100Dong(g.chiSoiPhanBo / (g.soKg || 1)).toLocaleString()}đ</td>
                          <td className="p-2.5 text-right">{lamTronTheo100Dong(g.chiDetPhanBo / (g.soKg || 1)).toLocaleString()}đ</td>
                          <td className="p-2.5 text-right">{lamTronTheo100Dong((g.tienNhuom + (g.chiPhiHoaChat || 0)) / (g.soKg || 1)).toLocaleString()}đ</td>
                          <td className="p-2.5 text-right font-black text-amber-700 text-sm">
                            {lamTronTheo100Dong(g.giaVonMoiKgCoVAT || g.giaVonMoiKg).toLocaleString()}đ/kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200">
                <div>
                  <div className="text-xs text-slate-500 font-semibold">Tổng công nợ phát sinh toàn chuỗi:</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    NCC Sợi: <b>{selectedLenh.tenNccSoi}</b> · Xưởng Dệt: <b>{selectedLenh.tenXuongDet}</b> · Xưởng Nhuộm: <b>{selectedLenh.tenXuongNhuom}</b>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">TỔNG GIÁ TRỊ LỆNH</div>
                  <div className="text-xl font-black text-amber-600">{selectedLenh.tongCong?.toLocaleString()}đ</div>
                </div>
              </div>
            </div>

            {/* Nút đóng modal */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSelectedLenh(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Đóng lại
              </button>
              <button
                type="button"
                onClick={() => setInPhieuTong(selectedLenh)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700 transition"
              >
                <Printer className="h-4 w-4" /> In toàn bộ phiếu SX
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ============================================================ */}
      {/* MODAL IN PHIẾU TỔNG HỢP SẢN XUẤT VẢI */}
      {/* ============================================================ */}
      {inPhieuTong && (
        <Modal onClose={() => setInPhieuTong(null)}>
          <style>{`@media print {
            body * { visibility: hidden !important; }
            #phieu-san-xuat-vai, #phieu-san-xuat-vai * { visibility: visible !important; }
            #phieu-san-xuat-vai { position: absolute; inset: 0; width: 100%; background: white; }
            .khong-in { display: none !important; }
          }`}</style>
          <div id="phieu-san-xuat-vai" className="bg-white p-6 text-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="border-b-2 border-[#307082] pb-3 text-center">
              <div className="text-sm font-bold text-[#307082]">MIMIN ERP</div>
              <h2 className="text-2xl font-black">PHIẾU SẢN XUẤT VẢI (SỢI · DỆT · NHUỘM)</h2>
              <div className="mt-1 text-xs text-slate-500">Mã lệnh: {inPhieuTong.id} · Ngày tạo: {new Date(inPhieuTong.ngayTao).toLocaleDateString("vi-VN")}</div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-xl">
              <div><span className="text-slate-500">Lệnh dệt:</span> <b>{inPhieuTong.maLenhDet}</b></div>
              <div><span className="text-slate-500">Mẻ nhuộm:</span> <b>{inPhieuTong.maMeNhuom}</b></div>
              <div><span className="text-slate-500">NCC sợi:</span> <b>{inPhieuTong.tenNccSoi}</b></div>
              <div><span className="text-slate-500">Xưởng dệt:</span> <b>{inPhieuTong.tenXuongDet}</b></div>
              <div><span className="text-slate-500">Xưởng nhuộm:</span> <b>{inPhieuTong.tenXuongNhuom}</b></div>
              <div><span className="text-slate-500">Vị trí kho TP:</span> <b>Khu {inPhieuTong.khu || "C"} · Kệ {inPhieuTong.ke || "C01"}</b></div>
            </div>

            <h3 className="mt-4 rounded bg-[#307082] px-3 py-2 font-bold text-white text-sm">1. DANH SÁCH SỢI – TỔNG {inPhieuTong.tongKgSoi?.toLocaleString("vi-VN")} KG</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Loại sợi</th><th className="border p-2">Mã lô</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá</th><th className="border p-2 text-right">Thành tiền</th></tr></thead>
                <tbody>{inPhieuTong.danhSachSoi?.map((item: any, idx: number) => (
                  <tr key={idx}><td className="border p-2">{item.loaiSoi}</td><td className="border p-2 text-center font-mono">{item.maLoSoi}</td><td className="border p-2 text-right">{item.soKg?.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGia?.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold">{((item.soKg || 0) * (item.donGia || 0)).toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <h3 className="mt-4 rounded bg-[#EA990C] px-3 py-2 font-bold text-white text-sm">2. DANH SÁCH MÀU NHUỘM & THÀNH PHẨM</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Mã vải</th><th className="border p-2">Màu</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá nhuộm</th><th className="border p-2 text-right">Giá vốn dự kiến</th></tr></thead>
                <tbody>{inPhieuTong.danhSachMau?.map((item: any, index: number) => (
                  <tr key={index}><td className="border p-2 font-bold">{item.maVai}</td><td className="border p-2 text-center font-semibold">{item.mau}</td><td className="border p-2 text-right">{item.soKg?.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGiaNhuom?.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold text-amber-700">{lamTronTheo100Dong(item.giaVon || 0).toLocaleString("vi-VN")}đ/kg</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between rounded-xl border-2 border-[#EA990C] bg-[#ECE7DC] p-3 text-base font-black">
              <span>TỔNG CHI PHÍ LỆNH SẢN XUẤT</span><span>{inPhieuTong.tongCong?.toLocaleString("vi-VN")}đ</span>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-8 text-center text-xs font-bold">
              <div>Người lập phiếu<br /><span className="font-normal text-slate-400">(Ký, ghi rõ họ tên)</span></div>
              <div>Xưởng dệt / Nhuộm<br /><span className="font-normal text-slate-400">(Ký nhận bàn giao)</span></div>
              <div>Quản lý duyệt<br /><span className="font-normal text-slate-400">(Ký duyệt nhập kho)</span></div>
            </div>
          </div>

          <div className="khong-in mt-4 flex justify-end gap-2 border-t pt-3">
            <button type="button" onClick={() => setInPhieuTong(null)} className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-100">Đóng</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-xs font-bold text-white hover:bg-orange-700">
              <Printer className="h-4 w-4" /> In phiếu ngay
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL IN PHIẾU NHẬP SỢI */}
      {inPhieuNhapSoi && (
        <PhieuNhapSoiPrint
          ncc={{ ten_ncc: inPhieuNhapSoi.tenNccSoi }}
          danhSachSoi={inPhieuNhapSoi.danhSachSoi}
          chungTu={inPhieuNhapSoi.anhChungTuGiaoDet}
          onClose={() => setInPhieuNhapSoi(null)}
        />
      )}

      {/* MODAL IN PHIẾU GIAO DỆT */}
      {inPhieuGiaoDet && (
        <PhieuGiaoDetPrint
          xDet={{ ten_ncc: inPhieuGiaoDet.tenXuongDet }}
          danhSachSoi={inPhieuGiaoDet.danhSachSoi}
          chungTu={inPhieuGiaoDet.anhChungTuGiaoDet}
          onClose={() => setInPhieuGiaoDet(null)}
        />
      )}

      {/* LIGHTBOX PHÓNG TO HÌNH ẢNH */}
      {lightboxIndex !== null && (
        <ImageLightbox
          src={lightboxImages[lightboxIndex] || null}
          gallery={lightboxImages}
          onChange={(_newSrc, newIdx) => setLightboxIndex(newIdx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
