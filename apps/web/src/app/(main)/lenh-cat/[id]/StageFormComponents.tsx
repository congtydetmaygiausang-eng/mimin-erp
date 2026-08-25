"use client";

import React, { useState } from "react";
import { SizeDetail } from "@/lib/data/lenh-cat-store";
import { CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { toast } from "sonner";

// ============================================================
// 1. CẮT FORM (Nhập SL Cắt thực tế)
// ============================================================
export function CatSizeForm({
  initialData,
  onSave,
  readOnly = false,
}: {
  initialData: SizeDetail[];
  onSave: (data: SizeDetail[]) => void;
  readOnly?: boolean;
}) {
  const [data, setData] = useState<SizeDetail[]>(initialData.map(d => ({ ...d })));

  const handleSlChange = (index: number, val: string) => {
    const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const newData = [...data];
    newData[index].sl = num;
    setData(newData);
  };

  if (readOnly) {
    return (
      <div className="space-y-1 mt-2">
        {data.map((sz) => (
          <div key={sz.size} className="flex justify-between text-xs border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-600">{sz.size}</span>
            <span className="font-black text-sky-700">{sz.sl.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between text-xs pt-1">
          <span className="font-bold text-slate-500">Tổng cắt</span>
          <span className="font-black text-sky-900">{data.reduce((a, b) => a + (b.sl || 0), 0).toLocaleString()}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 uppercase">
        <div>Size</div>
        <div className="text-right">Cắt Thực Tế</div>
      </div>
      {data.map((sz, idx) => (
        <div key={sz.size} className="grid grid-cols-2 gap-2 items-center">
          <div className="text-sm font-bold text-slate-700">{sz.size}</div>
          <input
            type="text"
            className="h-8 w-full text-right font-bold tabular-nums bg-sky-50 focus-visible:ring-sky-500 border border-slate-200 rounded px-2"
            value={sz.sl || ""}
            onChange={(e) => handleSlChange(idx, e.target.value)}
            placeholder="0"
          />
        </div>
      ))}
      <button
        className="w-full mt-3 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center"
        onClick={() => {
          onSave(data);
          toast.success("Đã cập nhật số lượng cắt");
        }}
      >
        LƯU SỐ LƯỢNG
      </button>
    </div>
  );
}

// ============================================================
// 2. QC FORM (Nhập Đạt, Lỗi)
// ============================================================
export function QCSizeForm({
  initialData,
  onSave,
}: {
  initialData: SizeDetail[];
  onSave: (data: SizeDetail[], ghiChu: string) => void;
}) {
  const [data, setData] = useState<SizeDetail[]>(initialData.map(d => ({ ...d })));
  const [ghiChu, setGhiChu] = useState("");

  const handleDatChange = (index: number, val: string) => {
    const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const newData = [...data];
    newData[index].dat = num;
    setData(newData);
  };

  const handleLoiChange = (index: number, val: string) => {
    const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const newData = [...data];
    newData[index].loi = num;
    setData(newData);
  };

  const LYY_DO = ["Lỗi may", "Lỗi In/Thêu", "Sai màu", "Sai Size", "Dơ", "Rách", "Khác"];

  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-slate-400 uppercase text-center">
        <div className="text-left">Size</div>
        <div>Nhận</div>
        <div className="text-emerald-600">Đạt</div>
        <div className="text-rose-600">Lỗi</div>
      </div>
      
      {data.map((sz, idx) => (
        <div key={sz.size} className="space-y-1 pb-2 border-b border-slate-100 last:border-0">
          <div className="grid grid-cols-4 gap-1 items-center">
            <div className="text-sm font-bold text-slate-700">{sz.size}</div>
            <div className="text-sm font-black text-slate-500 text-center">{sz.nhan?.toLocaleString() || 0}</div>
            <input
              type="text"
              className="h-8 w-full text-center font-bold tabular-nums border border-emerald-200 focus-visible:ring-emerald-500 rounded bg-white px-1"
              value={sz.dat || ""}
              onChange={(e) => handleDatChange(idx, e.target.value)}
              placeholder="0"
            />
            <input
              type="text"
              className="h-8 w-full text-center font-bold tabular-nums border border-rose-200 focus-visible:ring-rose-500 rounded bg-white px-1"
              value={sz.loi || ""}
              onChange={(e) => handleLoiChange(idx, e.target.value)}
              placeholder="0"
            />
          </div>
          {(sz.loi || 0) > 0 && (
            <div className="pl-[25%] pr-1 mt-1">
              <select
                className="w-full h-7 text-xs border border-rose-200 bg-rose-50 text-rose-700 rounded px-1"
                value={sz.nguyenNhan || ""}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].nguyenNhan = e.target.value;
                  setData(newData);
                }}
              >
                <option value="">Chọn lỗi...</option>
                {LYY_DO.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
      ))}
      
      <div className="pt-2">
        <input
          placeholder="Ghi chú QC..."
          className="w-full text-xs h-8 border border-slate-200 rounded px-2"
          value={ghiChu}
          onChange={(e) => setGhiChu(e.target.value)}
        />
      </div>

      <button
        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center"
        onClick={() => {
          onSave(data, ghiChu);
          toast.success("Đã xác nhận QC");
        }}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> XÁC NHẬN QC
      </button>
    </div>
  );
}

// ============================================================
// 3. COMMON FORM (Ủi, Đóng Gói, Khuy Nút)
// ============================================================
export function BasicStageForm({
  initialData,
  onSave,
  btnText = "XÁC NHẬN",
}: {
  initialData: SizeDetail[];
  onSave: (data: SizeDetail[]) => void;
  btnText?: string;
}) {
  const [data, setData] = useState<SizeDetail[]>(initialData.map(d => ({ ...d })));

  const handleSlChange = (index: number, val: string) => {
    const num = parseInt(val.replace(/\D/g, ""), 10) || 0;
    const newData = [...data];
    newData[index].sl = num;
    setData(newData);
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-400 uppercase text-center">
        <div className="text-left">Size</div>
        <div>Nhận</div>
        <div className="text-right">Thực tế</div>
      </div>
      {data.map((sz, idx) => {
        const chenhLech = (sz.sl || 0) - (sz.nhan || 0);
        return (
          <div key={sz.size} className="space-y-1">
            <div className="grid grid-cols-3 gap-2 items-center">
              <div className="text-sm font-bold text-slate-700">{sz.size}</div>
              <div className="text-sm font-black text-slate-500 text-center">{sz.nhan?.toLocaleString() || 0}</div>
              <input
                type="text"
                className="h-8 w-full text-right font-bold tabular-nums border border-sky-200 focus-visible:ring-sky-500 rounded bg-white px-2"
                value={sz.sl || ""}
                onChange={(e) => handleSlChange(idx, e.target.value)}
                placeholder="0"
              />
            </div>
            {chenhLech !== 0 && (
              <div className={`text-[10px] text-right font-bold ${chenhLech > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                Lệch: {chenhLech > 0 ? "+" : ""}{chenhLech}
              </div>
            )}
          </div>
        );
      })}
      <button
        className="w-full mt-3 bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center"
        onClick={() => {
          onSave(data);
          toast.success("Đã lưu thông tin");
        }}
      >
        {btnText} <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  );
}

// ============================================================
// 4. NHẬP KHO FORM
// ============================================================
export function NhapKhoForm({
  initialData,
  onSave,
  btnText = "XÁC NHẬN NHẬP KHO",
}: {
  initialData: SizeDetail[];
  onSave: (giaSi: number, giaLe: number, trangThaiBan: string) => void;
  btnText?: string;
}) {
  const [giaSi, setGiaSi] = useState("");
  const [giaLe, setGiaLe] = useState("");
  const [trangThai, setTrangThai] = useState("DangBan");

  return (
    <div className="space-y-3 mt-2">
      {/* Read-only sizes */}
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-400 uppercase mb-1">
          <div>Size</div>
          <div className="text-right">SL Nhập</div>
        </div>
        {initialData.map((sz) => (
          <div key={sz.size} className="flex justify-between items-center mb-1 last:mb-0">
            <span className="text-xs font-bold text-slate-600">{sz.size}</span>
            <span className="text-xs font-black text-emerald-700">{sz.sl.toLocaleString()}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Giá Sỉ</label>
            <input
              type="text"
              className="h-8 w-full text-right font-bold text-sm bg-white border border-slate-200 rounded px-2"
              value={giaSi}
              onChange={(e) => setGiaSi(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Giá Lẻ</label>
            <input
              type="text"
              className="h-8 w-full text-right font-bold text-sm bg-white border border-slate-200 rounded px-2"
              value={giaLe}
              onChange={(e) => setGiaLe(e.target.value.replace(/\D/g, ""))}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase">Trạng thái Bán</label>
          <select 
            value={trangThai} 
            onChange={(e) => setTrangThai(e.target.value)}
            className="w-full h-8 text-xs bg-white font-bold border border-slate-200 rounded px-2"
          >
            <option value="DangBan">Đang bán</option>
            <option value="ChuaBan">Chưa bán</option>
            <option value="NgungBan">Ngừng bán</option>
          </select>
        </div>
      </div>

      <button
        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center"
        onClick={() => {
          onSave(parseInt(giaSi) || 0, parseInt(giaLe) || 0, trangThai);
        }}
      >
        <CheckCircle2 className="w-4 h-4 mr-2" /> {btnText}
      </button>
    </div>
  );
}
