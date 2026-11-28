import React, { useState } from "react";
import { type LenhCat, type MauVai } from "@/lib/data/lenh-cat-store";
import { Image as ImageIcon } from "lucide-react";

export function MauCardStage({ 
  title, 
  mau, 
  lc, 
  type 
}: { 
  title: string; 
  mau: MauVai; 
  lc: LenhCat; 
  type: "ao" | "quan";
}) {
  const imageUrl = type === "ao" ? mau.img : mau.imgQuan;
  const phanBoSize = type === "ao" ? mau.phanBoSize : (mau.phanBoSizeQuan || mau.phanBoSize);
  const [hasError, setHasError] = useState(false);

  const isValidSrc = Boolean(
    imageUrl && 
    typeof imageUrl === "string" && 
    imageUrl.trim() !== "" && 
    !hasError
  );

  return (
    <div className={`p-5 rounded-xl border-2 ${type === "ao" ? "border-blue-100 bg-blue-50/30" : "border-rose-100 bg-rose-50/30"}`}>
      <h4 className={`text-sm font-black mb-4 ${type === "ao" ? "text-blue-800" : "text-rose-800"}`}>
        {title}
      </h4>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Image: Chữ nhật tỉ lệ 3:4 chuẩn Danh Mục Sản Phẩm */}
        <div className={`w-28 h-36 shrink-0 rounded-lg overflow-hidden border ${type === "ao" ? "border-blue-200" : "border-rose-200"} bg-white flex items-center justify-center aspect-[3/4] shadow-xs`}>
          {isValidSrc ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover object-top" 
              style={{ imageRendering: "-webkit-optimize-contrast" }}
              onError={() => setHasError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-50 border border-dashed border-slate-200">
              <ImageIcon className="w-5 h-5 text-amber-600 mb-1" />
              <span className="text-[9px] font-bold text-slate-600 leading-tight">Đang cập nhật</span>
              <span className="text-[8px] text-slate-400">{type.toUpperCase()}</span>
            </div>
          )}
        </div>

        {/* Sizes */}
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-500 mb-2">BẢNG SIZE & SỐ LƯỢNG</div>
          <div className="flex flex-wrap gap-2">
            {phanBoSize && phanBoSize.length > 0 ? (
              phanBoSize.map((pb) => (
                <div key={pb.size} className={`flex flex-col items-center bg-white border rounded p-2 min-w-[3rem] ${type === "ao" ? "border-blue-200" : "border-rose-200"}`}>
                  <span className="text-[10px] font-bold text-slate-400 mb-1">{pb.size}</span>
                  <span className={`text-sm font-black ${type === "ao" ? "text-blue-700" : "text-rose-700"}`}>{pb.sl}</span>
                </div>
              ))
            ) : (
              <span className="text-xs font-bold text-slate-400">Chưa có tỉ lệ size</span>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-2">
            <span className="text-xs font-bold text-slate-500">Tổng SL {type === "ao" ? "Áo" : "Quần"}:</span>
            <span className="text-sm font-black text-slate-800">
              {phanBoSize?.reduce((sum, pb) => sum + (pb.sl || 0), 0) || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
