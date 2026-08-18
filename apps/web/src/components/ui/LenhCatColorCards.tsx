import React from "react";
import type { LenhCat } from "@/lib/data/lenh-cat-store";

interface Props {
  lc: LenhCat;
  onClickColor?: (mauIdx: number) => void;
}

export function LenhCatColorCards({ lc, onClickColor }: Props) {
  if (!lc.dsMau || lc.dsMau.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 px-5 pb-5 pt-1">
      {lc.dsMau.map((mau, idx) => {
        const clickableClasses = onClickColor ? "cursor-pointer hover:ring-2 hover:ring-sky-500 hover:-translate-y-1" : "";
        return (
        <div 
          key={idx} 
          onClick={() => onClickColor && onClickColor(idx)}
          className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all ${clickableClasses}`}
        >
          {/* Images */}
          <div className="flex bg-slate-100 min-h-32">
            {mau.img ? (
              <div className="flex-1 aspect-square border-r border-slate-200">
                <img src={mau.img} alt={`Áo ${mau.ten}`} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="flex-1 aspect-square border-r border-slate-200 flex flex-col items-center justify-center text-slate-300">
                <span className="text-xs font-bold uppercase tracking-widest mt-1">NO IMG</span>
              </div>
            )}
            
            {/* If it's a set (Bộ), show pants image if available */}
            {mau.imgQuan && (
              <div className="flex-1 aspect-square">
                <img src={mau.imgQuan} alt={`Quần ${mau.ten}`} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-0.5">
                Mã vải: {mau.maVai} {mau.dinhMuc ? `• ĐM: ${mau.dinhMuc}kg` : ''}
              </div>
              {mau.maVaiQuan && (
                <div className="text-[10px] text-slate-400 font-bold mb-1">
                  Quần: {mau.maVaiQuan} {mau.dinhMucQuan ? `• ĐM: ${mau.dinhMucQuan}kg` : ''}
                </div>
              )}
              <div className="font-black text-slate-800 text-lg leading-tight mb-2">{mau.ten}</div>
              
              <div className="text-sm font-bold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-2">
                Tỷ lệ size: <span className="font-black text-sky-600 text-base">{lc.tiLeSize || "-"}</span>
              </div>
            </div>
            
            <div className="text-xs flex flex-wrap gap-1.5">
              {(() => {
                // Ưu tiên lấy số liệu cắt thực tế
                let displaySizes = mau.phanBoSize;
                let isThucTe = false;
                
                if (mau.tyLeSizeChiTiet) {
                  const catKey = Object.keys(mau.tyLeSizeChiTiet).find(k => k.toLowerCase().includes("cat"));
                  if (catKey && mau.tyLeSizeChiTiet[catKey] && mau.tyLeSizeChiTiet[catKey].some(s => s.sl > 0)) {
                    displaySizes = mau.tyLeSizeChiTiet[catKey];
                    isThucTe = true;
                  }
                }

                return displaySizes?.map(s => (
                  <span key={s.size} className={`px-2 py-0.5 rounded-md shadow-sm border ${isThucTe ? 'bg-sky-50 border-sky-200 text-sky-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <strong className={isThucTe ? 'text-sky-900' : 'text-slate-800'}>{s.size}:</strong> {s.sl.toLocaleString()}
                  </span>
                ));
              })()}
            </div>
            
            {(() => {
              const vt = lc.dsPhuLieu?.filter(p => p.mauIdx === idx);
              const hasMauPhoi = mau.mauPhoi && mau.mauPhoi.length > 0;
              const hasVatTu = vt && vt.length > 0;
              
              if (!hasMauPhoi && !hasVatTu) return null;
              
              return (
                <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
                  {hasMauPhoi && (
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Chi tiết màu phối</div>
                      <div className="flex flex-wrap gap-1">
                        {mau.mauPhoi!.map(mp => (
                          <span key={mp} className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md font-bold border border-indigo-100">
                            {mp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {hasVatTu && (
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Vật tư đi kèm</div>
                      <div className="flex flex-wrap gap-1">
                        {vt.map((p, pIdx) => (
                          <span key={pIdx} className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold border border-emerald-100">
                            {p.tenPL} {p.soLuong ? `(${p.soLuong.toLocaleString()})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        );
      })}

      {/* Embroidery/Print Logo Card */}
      {lc.hinhMauInTheu && (() => {
        let fileData = null;
        try {
          fileData = JSON.parse(lc.hinhMauInTheu);
        } catch(e) {}
        if (!fileData?.url) return null;

        return (
          <div 
            key="logo-in-theu"
            className="bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-sm overflow-hidden flex flex-col hover:border-sky-400 hover:shadow-md transition-all cursor-pointer"
            onClick={() => {
              const w = window.open();
              if (w) w.document.write(`<img src="${fileData.url}" style="max-width:100%; max-height:100vh; object-fit:contain;"/>`);
            }}
          >
            {/* Image */}
            <div className="flex bg-slate-50 min-h-32 aspect-[2/1] sm:aspect-square">
              <div className="flex-1 flex items-center justify-center p-4">
                <img src={fileData.url} alt="Logo In Thêu" className="w-full h-full object-contain" />
              </div>
            </div>
            
            {/* Info */}
            <div className="p-3.5 flex flex-col justify-between border-t border-slate-100 flex-1 bg-white">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Logo</div>
                <div className="font-black text-slate-800 text-lg leading-tight mb-2">Hình In/Thêu</div>
                {lc.ghiChuInTheu && (
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-500">Ghi chú:</span> {lc.ghiChuInTheu}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
