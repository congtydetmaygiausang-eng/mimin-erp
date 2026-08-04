"use client";

import { useState } from "react";
import { Ruler, ChevronDown } from "lucide-react";

interface BangSizeInputProps {
  ratios: [number, number, number, number, number]; // [M, L, XL, 2XL, 3XL]
  onChange: (ratios: [number, number, number, number, number]) => void;
  className?: string;
}

const SIZES = ["M", "L", "XL", "2XL", "3XL"];

const TEMPLATES = [
  { label: "Chuẩn 8 SP (1:2:2:2:1)", ratios: [1, 2, 2, 2, 1] },
  { label: "Chuẩn 6 SP (1:2:2:1:0)", ratios: [1, 2, 2, 1, 0] },
  { label: "Chuẩn 4 SP (0:1:1:1:1)", ratios: [0, 1, 1, 1, 1] },
  { label: "Đồng đều 5 SP (1:1:1:1:1)", ratios: [1, 1, 1, 1, 1] },
  { label: "Đồng đều 4 SP (0:1:1:1:1)", ratios: [0, 1, 1, 1, 1] },
];

export default function BangSizeInput({ ratios, onChange, className = "" }: BangSizeInputProps) {
  const handleRatioChange = (index: number, val: string) => {
    const num = parseInt(val, 10);
    const newRatios = [...ratios] as [number, number, number, number, number];
    newRatios[index] = isNaN(num) ? 0 : Math.max(0, num);
    onChange(newRatios);
  };

  const riSo = ratios.reduce((a, b) => a + b, 0);
  const totalVD = 100;
  const numRiVD = riSo > 0 ? Math.floor(totalVD / riSo) : 0;
  
  return (
    <div className={`rounded-xl border border-blue-200 bg-[#f4fafe] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-blue-700 text-sm sm:text-base">BẢNG SIZE (M, L, XL, 2XL, 3XL)</h3>
          <span className="text-xs text-blue-400 font-medium ml-2 hidden sm:inline">← Ở TRÊN CÙNG ĐỂ DỄ THẤY</span>
        </div>
        
        {/* Template Selector */}
        <div className="relative group">
          <select 
            className="appearance-none bg-white border border-blue-300 text-blue-700 text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm hover:bg-blue-50"
            onChange={(e) => {
              const val = e.target.value;
              if (val !== "custom") {
                const template = TEMPLATES[parseInt(val, 10)];
                onChange([...template.ratios] as [number, number, number, number, number]);
              }
            }}
            value={TEMPLATES.findIndex(t => t.ratios.join(":") === ratios.join(":")) !== -1 ? TEMPLATES.findIndex(t => t.ratios.join(":") === ratios.join(":")) : "custom"}
          >
            <option value="custom" disabled>-- Chọn bảng mẫu --</option>
            {TEMPLATES.map((t, idx) => (
              <option key={idx} value={idx}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Input Boxes */}
        <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-5">
          {SIZES.map((size, index) => (
            <div key={size} className="flex flex-col">
              <label className="text-center font-bold text-slate-600 text-xs sm:text-sm mb-1.5">{size}</label>
              <input
                type="number"
                min="0"
                value={ratios[index].toString()}
                onChange={(e) => handleRatioChange(index, e.target.value)}
                className="w-full text-center text-lg sm:text-xl font-bold py-2 sm:py-3 border-2 border-blue-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white"
              />
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-stretch gap-3 mb-4">
          <div className="flex flex-col justify-center px-4 py-2 border-2 border-blue-200 bg-white rounded-lg min-w-[120px]">
            <span className="text-[10px] sm:text-xs font-bold text-blue-500 uppercase">TỈ LỆ</span>
            <span className="text-lg sm:text-xl font-bold text-blue-900 font-mono tracking-widest">{ratios.join(":")}</span>
          </div>

          <div className="flex flex-col justify-center px-4 py-2 border-2 border-emerald-300 bg-emerald-50 rounded-lg">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase">RÌ (1 RI =)</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-800"><span className="text-2xl">{riSo}</span> SP</span>
          </div>

          {riSo > 0 && (
            <div className="flex flex-col justify-center px-4 py-2 border-2 border-amber-300 bg-amber-50 rounded-lg flex-1">
              <span className="text-[10px] sm:text-xs font-bold text-amber-600">VD 100 SP = {numRiVD} rì</span>
              <span className="text-[11px] sm:text-xs text-amber-700 font-medium">
                (M:{numRiVD * ratios[0]}, L:{numRiVD * ratios[1]}, XL:{numRiVD * ratios[2]}, 2XL:{numRiVD * ratios[3]}, 3XL:{numRiVD * ratios[4]})
              </span>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="flex items-start gap-1.5 text-xs sm:text-sm text-blue-800/80 italic font-medium">
          <span>💡</span>
          <p>Mỗi màu trong Bảng Màu bên dưới sẽ áp dụng tỉ lệ này. Khi tạo lệnh cắt → hệ thống tự tính SL từng size.</p>
        </div>
      </div>
    </div>
  );
}
