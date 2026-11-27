"use client";

import React from "react";
import { 
  CheckCircle2, 
  Warehouse, 
  ArrowRight, 
  Package, 
  MapPin, 
  DollarSign, 
  Layers, 
  Sparkles, 
  Check, 
  ExternalLink,
  X
} from "lucide-react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";

export interface NhapKhoSuccessData {
  maLC: string;
  maSP: string;
  tenSP: string;
  anhDaiDien?: string;
  tongSL: number;
  soMau: number;
  tongGiaTri: number;
  giaVon1SP: number;
  viTri: string;
  kenhBan: string[];
  dsMau: Array<{ ten: string; sl: number; img?: string }>;
}

interface NhapKhoSuccessModalProps {
  data: NhapKhoSuccessData;
  onClose: () => void;
  onViewInKho: (maSP: string) => void;
  onContinue: () => void;
}

export function NhapKhoSuccessModal({
  data,
  onClose,
  onViewInKho,
  onContinue,
}: NhapKhoSuccessModalProps) {
  return (
    <ResponsiveModal
      open={true}
      maxWidth="lg"
      onClose={onClose}
    >
      <div className="p-5 md:p-6 text-slate-800 space-y-5">
        {/* Header thành công với hiệu ứng icon */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 mb-3 shadow-sm animate-bounce">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
            Thông báo xác nhận thành công
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
            NHẬP KHO THÀNH PHẨM THÀNH CÔNG!
          </h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-md mt-1">
            Lô hàng sản xuất từ lệnh <strong className="text-sky-700 font-mono font-bold">{data.maLC}</strong> đã được lưu trữ chính thức vào Kho Thành Phẩm.
          </p>
        </div>

        {/* Thẻ tóm tắt thông tin lô hàng vừa nhập */}
        <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl border border-emerald-200/80 p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
            {data.anhDaiDien ? (
              <img 
                src={data.anhDaiDien} 
                alt={data.tenSP} 
                className="w-12 h-16 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded-lg bg-emerald-100/50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <Warehouse className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {data.maSP}
                </span>
                <span className="font-mono font-black text-xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  {data.maLC}
                </span>
              </div>
              <div className="font-black text-slate-900 text-sm md:text-base truncate mt-1">
                {data.tenSP}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Vị trí: <strong className="text-slate-800">{data.viTri}</strong>
              </div>
            </div>
          </div>

          {/* 3 Con số kết quả */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Số lượng nhập</div>
              <div className="text-base md:text-lg font-black text-emerald-700 mt-0.5">
                {data.tongSL.toLocaleString("vi-VN")} <span className="text-[10px] text-slate-400 font-semibold">SP</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Số biến thể</div>
              <div className="text-base md:text-lg font-black text-indigo-700 mt-0.5">
                {data.soMau} <span className="text-[10px] text-slate-400 font-semibold">Màu</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
              <div className="text-[10px] font-bold uppercase text-slate-400">Tổng giá trị</div>
              <div className="text-base md:text-lg font-black text-purple-700 mt-0.5">
                {data.tongGiaTri.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>

          {/* Danh sách các màu đã nhập */}
          {data.dsMau && data.dsMau.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {data.dsMau.map((m, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{m.ten}:</span>
                  <span className="font-black text-emerald-800">{m.sl.toLocaleString("vi-VN")} SP</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Các tác vụ hệ thống đã tự động hoàn tất */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5 text-xs">
          <div className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Hệ thống MIMIN ERP đã tự động thực thi:
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tạo <strong>{data.soMau} SKU biến thể màu</strong> vào bảng Kho Thành Phẩm</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Cập nhật công đoạn Nhập Kho và đóng Lệnh Cắt <strong>{data.maLC}</strong> sang <strong>Hoàn Thành</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Tự động đồng bộ số lượng tồn kho sang <strong>Danh Mục Sản Phẩm ({data.maSP})</strong></span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onViewInKho(data.maSP)}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs md:text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Warehouse className="w-4 h-4" />
            Xem Sản Phẩm Trong Kho Thành Phẩm
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm transition-all"
          >
            Tiếp Tục Nhập Lệnh Khác
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
