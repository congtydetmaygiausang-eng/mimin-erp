"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import BangSizeInput from "./BangSizeInput";

export interface SizeTableData {
  id: string;
  name: string;
  ratios: [number, number, number, number, number];
}

interface BangSizeMultipleProps {
  sizes?: SizeTableData[];
  onChange?: (sizes: SizeTableData[]) => void;
  className?: string;
}

const DEFAULT_RATIO: [number, number, number, number, number] = [0, 1, 1, 1, 1];

export default function BangSizeMultiple({ sizes, onChange, className = "" }: BangSizeMultipleProps) {
  const [localSizes, setLocalSizes] = useState<SizeTableData[]>(
    sizes || [{ id: "1", name: "Bảng Size 1", ratios: DEFAULT_RATIO }]
  );

  const handleUpdate = (id: string, newRatios: [number, number, number, number, number]) => {
    const next = localSizes.map((s) => (s.id === id ? { ...s, ratios: newRatios } : s));
    setLocalSizes(next);
    onChange?.(next);
  };

  const handleAdd = () => {
    const next = [
      ...localSizes,
      {
        id: Math.random().toString(36).substring(7),
        name: `Bảng Size ${localSizes.length + 1}`,
        ratios: [...DEFAULT_RATIO] as [number, number, number, number, number],
      },
    ];
    setLocalSizes(next);
    onChange?.(next);
  };

  const handleRemove = (id: string) => {
    if (localSizes.length <= 1) return;
    const next = localSizes.filter((s) => s.id !== id);
    setLocalSizes(next);
    onChange?.(next);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {localSizes.map((item, index) => (
        <div key={item.id} className="relative group">
          {/* Header Row for each size table (optional naming) */}
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">
                {index + 1}
              </span>
              {item.name}
            </h4>
            {localSizes.length > 1 && (
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                title="Xóa Bảng Size này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <BangSizeInput
            ratios={item.ratios}
            onChange={(r) => handleUpdate(item.id, r)}
          />
        </div>
      ))}

      {/* Nút thêm bảng size mới */}
      <button
        onClick={handleAdd}
        className="w-full py-4 border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-600 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        BẤM VÀO ĐÂY THÊM BẢNG SIZE MỚI
      </button>
    </div>
  );
}
