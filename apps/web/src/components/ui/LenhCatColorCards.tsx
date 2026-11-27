import React, { useState } from "react";
import { Maximize2, X, Shirt, Scissors, Sparkles, Clock, FileText, ExternalLink } from "lucide-react";
import type { LenhCat, MauVai } from "@/lib/data/lenh-cat-store";
import { formatVND } from "@/lib/data/real-data";

interface Props {
  lc: LenhCat;
  onClickColor?: (mauIdx: number) => void;
}

function ColorImageItem({
  src,
  alt,
  title,
  badgeText,
  badgeColor = "teal",
  onZoom,
  aspectClass = "aspect-[3/4]",
}: {
  src?: string;
  alt: string;
  title: string;
  badgeText?: string;
  badgeColor?: "teal" | "indigo" | "purple";
  onZoom: (url: string, title: string) => void;
  aspectClass?: string;
}) {
  const [hasError, setHasError] = useState(false);

  const isValidSrc = Boolean(
    src && 
    typeof src === "string" && 
    src.trim() !== "" && 
    !src.includes("undefined") && 
    !src.includes("null") && 
    !hasError
  );

  const badgeBg = {
    teal: "bg-teal-700/90 text-white",
    indigo: "bg-indigo-600/90 text-white",
    purple: "bg-purple-600/90 text-white",
  }[badgeColor];

  if (!isValidSrc) {
    return (
      <div 
        className={`w-full ${aspectClass} relative overflow-hidden rounded-xl border border-dashed border-slate-300/80 bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 hover:border-teal-400 hover:bg-teal-50/15 transition-all duration-300 flex flex-col items-center justify-between p-2 text-center shadow-2xs group/fallback select-none`}
        title={`${badgeText || "Sản phẩm"} ${title} - Đang cập nhật ảnh`}
      >
        <div className="w-full flex items-center justify-between gap-1">
          {badgeText && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200/70">
              {badgeText}
            </span>
          )}
          <span className="text-[10px] font-bold text-slate-500 truncate max-w-[65%] text-right ml-auto">
            {title}
          </span>
        </div>

        <div className="my-auto flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-400 group-hover/fallback:text-teal-600 group-hover/fallback:border-teal-300 group-hover/fallback:scale-105 transition-all duration-300 mb-1.5">
            {badgeColor === "indigo" ? (
              <Scissors className="w-5 h-5 stroke-[1.6]" />
            ) : (
              <Shirt className="w-5 h-5 stroke-[1.6]" />
            )}
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">
            Đang cập nhật ảnh
          </span>
        </div>

        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/90 text-slate-500 border border-slate-200/80 text-[9px] font-semibold tracking-wide">
          <Clock className="w-2.5 h-2.5 text-amber-500 animate-pulse" />
          <span>Chờ tải ảnh</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${aspectClass} relative overflow-hidden rounded-xl shadow-2xs border border-slate-200/90 bg-slate-100 flex items-center justify-center group/img`}>
      <img 
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover/img:scale-105" 
        style={{ imageRendering: "-webkit-optimize-contrast" }}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
      />

      {badgeText && (
        <span className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs ${badgeBg}`}>
          {badgeText}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onZoom(src, title);
        }}
        className="absolute bottom-1.5 right-1.5 p-1 sm:p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/img:opacity-100 transition-opacity backdrop-blur-xs flex items-center gap-1 text-[10px] sm:text-[11px] font-bold shadow-md cursor-pointer"
        title="Nhấp để xem ảnh to rõ nét"
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Xem to</span>
      </button>
    </div>
  );
}

function ColorCardItem({
  mau,
  idx,
  lc,
  isOrderSetBo,
  onClickColor,
  onZoom,
}: {
  mau: MauVai;
  idx: number;
  lc: LenhCat;
  isOrderSetBo: boolean;
  onClickColor?: (mauIdx: number) => void;
  onZoom: (url: string, title: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"ao" | "quan" | "both">("ao");

  const displayImg = (mau.img && !mau.img.includes("/phieu-cat/"))
    ? mau.img
    : (lc.hinhAnh && !lc.hinhAnh.includes("/phieu-cat/"))
      ? lc.hinhAnh
      : "";

  // Chỉ xem là có ảnh Quần riêng biệt khi imgQuan có dữ liệu VÀ KHÁC ảnh Áo
  // (tránh trường hợp ảnh chụp cả bộ bị nhân đôi thành 2 ảnh giống hệt nhau làm thu nhỏ thẻ)
  const hasSeparatePantsImg = Boolean(
    isOrderSetBo &&
    mau.imgQuan &&
    typeof mau.imgQuan === "string" &&
    mau.imgQuan.trim() !== "" &&
    !mau.imgQuan.includes("/phieu-cat/") &&
    mau.imgQuan !== displayImg
  );

  const clickableClasses = onClickColor
    ? "cursor-pointer hover:ring-2 hover:ring-teal-500/50 hover:-translate-y-0.5"
    : "";

  return (
    <div 
      onClick={() => onClickColor && onClickColor(idx)}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col hover:shadow-md hover:border-slate-300 transition-all ${clickableClasses}`}
    >
      {/* VÙNG ẢNH: Đảm bảo ảnh luôn hiển thị to, rõ ràng, không bị thu nhỏ bất hợp lý */}
      <div className="w-full bg-slate-50/70 p-2.5 border-b border-slate-100">
        {hasSeparatePantsImg ? (
          <div>
            {/* Thanh chuyển đổi Áo / Quần / Cả 2 */}
            <div className="flex items-center justify-between gap-1 mb-2 bg-slate-100/90 p-1 rounded-lg border border-slate-200/70">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewMode("ao"); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                    viewMode === "ao" ? "bg-teal-700 text-white shadow-xs" : "text-slate-600 hover:bg-white/80"
                  }`}
                >
                  Áo
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewMode("quan"); }}
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                    viewMode === "quan" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-white/80"
                  }`}
                >
                  Quần
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewMode("both"); }}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-500 hover:text-slate-800 transition-all ${
                    viewMode === "both" ? "bg-slate-700 text-white shadow-xs" : "hover:bg-white/80"
                  }`}
                  title="Hiển thị cả 2 ảnh cạnh nhau"
                >
                  Cả 2
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[75px] text-right">
                {mau.ten}
              </span>
            </div>

            {/* Nội dung ảnh theo chế độ chọn */}
            {viewMode === "both" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <ColorImageItem
                    src={displayImg}
                    alt={`Áo ${mau.ten || idx + 1}`}
                    title={`Áo ${mau.ten || idx + 1}`}
                    badgeText="Áo"
                    badgeColor="teal"
                    onZoom={(url, title) => onZoom(url, `${title} - ${lc.tenSP}`)}
                  />
                </div>
                <div className="min-w-0">
                  <ColorImageItem
                    src={mau.imgQuan}
                    alt={`Quần ${mau.ten || idx + 1}`}
                    title={`Quần ${mau.ten || idx + 1}`}
                    badgeText="Quần"
                    badgeColor="indigo"
                    onZoom={(url, title) => onZoom(url, `${title} - ${lc.tenSP}`)}
                  />
                </div>
              </div>
            ) : viewMode === "quan" ? (
              <ColorImageItem
                src={mau.imgQuan}
                alt={`Quần ${mau.ten || idx + 1}`}
                title={`Quần ${mau.ten || idx + 1}`}
                badgeText="Quần"
                badgeColor="indigo"
                onZoom={(url, title) => onZoom(url, `${title} - ${lc.tenSP}`)}
              />
            ) : (
              <ColorImageItem
                src={displayImg}
                alt={`Áo ${mau.ten || idx + 1}`}
                title={`Áo ${mau.ten || idx + 1}`}
                badgeText="Áo"
                badgeColor="teal"
                onZoom={(url, title) => onZoom(url, `${title} - ${lc.tenSP}`)}
              />
            )}
          </div>
        ) : (
          /* Ảnh đơn chiếm trọn chiều rộng thẻ: To, rõ nét, tỉ lệ 3:4 chuẩn thời trang */
          <ColorImageItem
            src={displayImg}
            alt={`${mau.ten || idx + 1}`}
            title={`${mau.ten || idx + 1}`}
            badgeText={isOrderSetBo ? "Bộ (Áo + Quần)" : "Áo"}
            badgeColor="teal"
            onZoom={(url, title) => onZoom(url, `${title} - ${lc.tenSP}`)}
          />
        )}
      </div>

      {/* THÔNG TIN CHI TIẾT */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider mb-0.5">
            Mã vải: <span className="text-slate-600 font-bold">{mau.maVai || "-"}</span> {mau.dinhMuc ? `• ĐM: ${mau.dinhMuc}kg` : ''}
          </div>
          {mau.maVaiQuan && (
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Quần: <span className="text-slate-600 font-bold">{mau.maVaiQuan}</span> {mau.dinhMucQuan ? `• ĐM: ${mau.dinhMucQuan}kg` : ''}
            </div>
          )}
          <div className="font-extrabold text-slate-800 text-base leading-tight mb-1.5">{mau.ten}</div>
          
          <div className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/70 rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5">
            Tỷ lệ size: <span className="font-mono font-bold text-teal-700 text-sm">{lc.tiLeSize || "-"}</span>
          </div>
        </div>
        
        {/* Phân bổ số lượng các size */}
        <div className="text-xs flex flex-wrap gap-1.5">
          {(() => {
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
              <span 
                key={s.size} 
                className={`px-2 py-0.5 rounded text-xs border font-medium ${
                  isThucTe 
                    ? 'bg-teal-50 border-teal-200/80 text-teal-800' 
                    : 'bg-slate-50 border-slate-200/70 text-slate-700'
                }`}
              >
                <strong className={isThucTe ? 'text-teal-900 font-bold' : 'text-slate-800'}>{s.size}:</strong> {s.sl.toLocaleString()}
              </span>
            ));
          })()}
        </div>
        
        {/* Màu phối & vật tư phụ liệu */}
        {(() => {
          const vt = lc.dsPhuLieu?.filter(p => p.mauIdx === idx);
          const hasMauPhoi = mau.mauPhoi && mau.mauPhoi.length > 0;
          const hasVatTu = vt && vt.length > 0;
          
          if (!hasMauPhoi && !hasVatTu) return null;
          
          return (
            <div className="pt-2.5 border-t border-slate-100 mt-1 space-y-2">
              {hasMauPhoi && (
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Màu phối</div>
                  <div className="flex flex-wrap gap-1">
                    {mau.mauPhoi!.map(mp => (
                      <span key={mp} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {mp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hasVatTu && (
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Vật tư</div>
                  <div className="flex flex-wrap gap-1">
                    {vt.map((p, pIdx) => (
                      <span key={pIdx} className="text-[11px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200/80 font-medium">
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
}

function LogoInTheuCard({
  lc,
  logoUrl,
  onZoom,
}: {
  lc: LenhCat;
  logoUrl: string;
  onZoom: (url: string, title: string) => void;
}) {
  // Tìm thông tin xưởng In / Thêu trong phân công
  const pcInTheu = lc.phanCong?.find(p => 
    p.id === "in_theu" || 
    p.id === "in" || 
    p.id === "theu" || 
    (p.tenCongDoan && (p.tenCongDoan.toLowerCase().includes("in") || p.tenCongDoan.toLowerCase().includes("thêu")))
  );

  return (
    <div 
      className="bg-white rounded-xl border border-purple-200/90 shadow-2xs overflow-hidden flex flex-col hover:border-purple-300 hover:shadow-md transition-all group/logo cursor-pointer"
      onClick={() => onZoom(logoUrl, `Hình In/Thêu - ${lc.tenSP}`)}
    >
      {/* VÙNG LOGO: Tỉ lệ chuẩn xác, logo không bị phóng to áp đảo ảnh người mẫu */}
      <div className="w-full bg-gradient-to-b from-purple-50/40 via-white to-slate-50/60 p-3 border-b border-purple-100 flex flex-col items-center justify-center relative">
        <div className="w-full flex items-center justify-between gap-1 mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200/70">
            <Sparkles className="w-2.5 h-2.5 text-purple-600" />
            Hình In / Thêu
          </span>
          <span className="text-[10px] font-bold text-purple-500">
            Mẫu in áo
          </span>
        </div>

        {/* Khung chứa logo: Giới hạn kích thước vừa vặn (max height ~100px), logo nằm gọn gàng sắc nét */}
        <div className="w-full h-36 sm:h-40 rounded-xl bg-white border border-purple-200/70 shadow-xs p-3 flex items-center justify-center relative overflow-hidden group-hover/logo:border-purple-400 transition-colors">
          <img 
            src={logoUrl} 
            alt="Logo In Thêu" 
            className="max-h-24 max-w-[150px] sm:max-h-28 sm:max-w-[170px] w-auto h-auto object-contain transition-transform duration-300 group-hover/logo:scale-105" 
            style={{ imageRendering: "-webkit-optimize-contrast" }}
            loading="lazy"
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom(logoUrl, `Hình In/Thêu - ${lc.tenSP}`);
            }}
            className="absolute bottom-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover/logo:opacity-100 transition-opacity backdrop-blur-xs flex items-center gap-1 text-[10px] font-bold shadow-md cursor-pointer"
            title="Nhấp để xem ảnh to rõ nét"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Xem to</span>
          </button>
        </div>
      </div>

      {/* THÔNG TIN VỊ TRÍ & XƯỞNG IN/THÊU */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2.5 bg-white">
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-purple-500 uppercase font-black tracking-widest mb-0.5">
              Chi tiết quy cách
            </div>
            <div className="font-extrabold text-slate-800 text-base leading-tight">
              Logo / Hình In & Thêu
            </div>
          </div>

          {/* Ghi chú vị trí in/thêu */}
          <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-100 text-xs text-purple-900 font-semibold flex items-start gap-1.5 leading-snug">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-purple-600 uppercase font-bold block mb-0.5">Vị trí & Yêu cầu:</span>
              <span>{lc.ghiChuInTheu || "In / thêu theo mẫu thiết kế chuẩn"}</span>
            </div>
          </div>

          {/* Đơn vị gia công in/thêu */}
          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-medium">Xưởng in/thêu:</span>
              <span className="font-bold text-slate-700 truncate max-w-[130px] text-right">
                {pcInTheu?.nguoiTen || "Chưa giao"}
              </span>
            </div>
            {pcInTheu?.donGia ? (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Đơn giá in:</span>
                <span className="font-bold text-teal-700 font-mono">
                  {formatVND(pcInTheu.donGia)}/SP
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Nút hành động hoặc link file gốc */}
        {lc.fileGocInTheu && (
          <div className="pt-2 border-t border-slate-100">
            <a
              href={lc.fileGocInTheu}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 font-bold hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tải file gốc in/thêu</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function LenhCatColorCards({ lc, onClickColor }: Props) {
  const [zoomImg, setZoomImg] = useState<{ url: string; title: string } | null>(null);

  if (!lc.dsMau || lc.dsMau.length === 0) return null;

  // Nhận diện chuẩn xác toàn bộ Lệnh Cắt có phải là Hàng Bộ (Áo + Quần) hay không
  const isOrderSetBo = Boolean(
    (lc.loaiSP && /b[oộ]|set|combo/i.test(lc.loaiSP.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))) ||
    lc.loaiSP?.toLowerCase().includes("bộ") ||
    lc.phanCong?.some(p => (p.id || "").toLowerCase().includes("quan")) ||
    lc.dsMau?.some(m => Boolean(m.imgQuan || m.maVaiQuan))
  );

  // Trích xuất link ảnh logo in/thêu nếu có
  let logoUrl = "";
  if (lc.hinhMauInTheu) {
    const raw = (lc.hinhMauInTheu || "").trim();
    if (raw.startsWith("/") || raw.startsWith("http") || raw.startsWith("data:")) {
      logoUrl = raw;
    } else {
      try {
        const parsed = JSON.parse(raw);
        logoUrl = parsed?.url || (typeof parsed === "string" ? parsed : "");
      } catch (e) {
        logoUrl = raw;
      }
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 px-3 pb-3 pt-1">
        {/* Render từng thẻ màu sản phẩm */}
        {lc.dsMau.map((mau, idx) => (
          <ColorCardItem
            key={idx}
            mau={mau}
            idx={idx}
            lc={lc}
            isOrderSetBo={isOrderSetBo}
            onClickColor={onClickColor}
            onZoom={(url, title) => setZoomImg({ url, title })}
          />
        ))}

        {/* Thẻ Logo In/Thêu (kích thước logo được kiểm soát hài hòa, cân đối với ảnh áo) */}
        {logoUrl && (
          <LogoInTheuCard
            key="logo-in-theu"
            lc={lc}
            logoUrl={logoUrl}
            onZoom={(url, title) => setZoomImg({ url, title })}
          />
        )}
      </div>

      {/* Modal phóng to xem ảnh full rõ nét */}
      {zoomImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomImg(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[92vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
              <div className="font-bold text-slate-800 text-sm">{zoomImg.title}</div>
              <button 
                type="button"
                onClick={() => setZoomImg(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-slate-900/5 overflow-auto max-h-[82vh]">
              <img 
                src={zoomImg.url} 
                alt={zoomImg.title} 
                className="max-h-[78vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                style={{ imageRendering: "-webkit-optimize-contrast" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
