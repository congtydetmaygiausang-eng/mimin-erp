"use client";

import React from "react";
import {
  Package,
  Boxes,
  ShoppingBag,
  Tag,
  Bookmark,
  Disc,
  Layers,
  Sparkles,
  CircleDot,
  Sliders,
  Activity,
  Scissors,
  Image as ImageIcon,
} from "lucide-react";

export interface MaterialThumbnailProps {
  maMau?: string;
  tenMau?: string;
  category?: "bo_co" | "nut" | "phu_lieu" | "kho_vai" | string;
  loai?: string;
  mauSac?: string;
  hinhAnh?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Icon Dây Kéo (Zipper) chuẩn đồ họa may mặc
function ZipperIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v20" />
      <path d="M8 5h4" />
      <path d="M12 7h4" />
      <path d="M8 9h4" />
      <path d="M12 11h4" />
      <path d="M8 13h4" />
      <path d="M12 15h4" />
      <path d="M8 17h4" />
      <path d="M12 19h4" />
      <rect x="9.5" y="8" width="5" height="7" rx="1.5" className="fill-current opacity-25" strokeWidth="1.5" />
      <circle cx="12" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

// Icon Nút Áo 4 lỗ chuẩn may mặc
function ButtonClothIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="6" strokeDasharray="2 2" strokeWidth="1" />
      <circle cx="9.5" cy="9.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="9.5" r="1.2" fill="currentColor" />
      <circle cx="9.5" cy="14.5" r="1.2" fill="currentColor" />
      <circle cx="14.5" cy="14.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

/**
 * Kiểm tra xem một đường dẫn hình ảnh có phải là ảnh thực tế (ảnh swatch / ảnh upload)
 * hay chỉ là ảnh placeholder logo "M" (/icons/icon-192.png)
 */
export function isRealMaterialImage(
  hinhAnh: string | null | undefined,
  category?: string
): boolean {
  if (!hinhAnh) return false;
  // Loại trừ icon placeholder MIMIN (chữ M)
  if (hinhAnh.includes("icon-192") || hinhAnh.includes("icon-512") || hinhAnh.includes("manifest")) {
    return false;
  }
  // Đối với phụ liệu, các file swatch vai-*.jpg trước đây bị gán nhầm làm placeholder
  if (category === "phu_lieu" && (hinhAnh.startsWith("/swatches/vai-") || hinhAnh.includes("swatch_VAI-"))) {
    return false;
  }
  // Các ảnh hợp lệ: URL từ supabase storage, ảnh base64, ảnh trong public media
  if (
    hinhAnh.startsWith("http://") ||
    hinhAnh.startsWith("https://") ||
    hinhAnh.startsWith("data:image/") ||
    hinhAnh.startsWith("/product-models/") ||
    hinhAnh.startsWith("/excel_media/") ||
    hinhAnh.startsWith("/swatches/")
  ) {
    return true;
  }
  return false;
}

export interface PhuLieuIconConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
}

/**
 * Phân loại chi tiết từng loại phụ liệu dựa vào mã vật tư, tên gọi và phân loại
 */
export function getPhuLieuIconConfig(ma: string = "", ten: string = "", loai: string = ""): PhuLieuIconConfig {
  const m = ma.toUpperCase();
  const t = ten.toLowerCase();
  const l = loai.toLowerCase();

  // 1. DÂY KÉO (Zipper)
  if (
    m.includes("DAYKEO") ||
    m.startsWith("DK") ||
    t.includes("dây kéo") ||
    t.includes("day keo") ||
    l.includes("kéo") ||
    l.includes("zipper")
  ) {
    return {
      key: "day_keo",
      label: "DÂY KÉO",
      icon: <ZipperIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgGradient: "from-amber-100 via-orange-50 to-amber-200/80 dark:from-amber-950/60 dark:via-orange-950/40 dark:to-amber-900/50",
      borderColor: "border-amber-300 dark:border-amber-700",
      textColor: "text-amber-900 dark:text-amber-200",
      badgeBg: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    };
  }

  // 2. THẺ BÀI (Hangtag / Price Tag)
  if (
    m.includes("THEBAI") ||
    m.startsWith("TB") ||
    t.includes("thẻ bài") ||
    t.includes("the bai") ||
    l.includes("thẻ bài") ||
    t.includes("hangtag")
  ) {
    return {
      key: "the_bai",
      label: "THẺ BÀI",
      icon: <Tag className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      bgGradient: "from-rose-100 via-pink-50 to-rose-200/80 dark:from-rose-950/60 dark:via-pink-950/40 dark:to-rose-900/50",
      borderColor: "border-rose-300 dark:border-rose-700",
      textColor: "text-rose-900 dark:text-rose-200",
      badgeBg: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    };
  }

  // 3. THUN QUẦN (Elastic band)
  if (
    m.includes("THUNQUAN") ||
    m.startsWith("TQ") ||
    t.includes("thun") ||
    l.includes("thun") ||
    t.includes("chun")
  ) {
    return {
      key: "thun_quan",
      label: "THUN QUẦN",
      icon: <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      bgGradient: "from-purple-100 via-violet-50 to-purple-200/80 dark:from-purple-950/60 dark:via-violet-950/40 dark:to-purple-900/50",
      borderColor: "border-purple-300 dark:border-purple-700",
      textColor: "text-purple-900 dark:text-purple-200",
      badgeBg: "bg-purple-500/15 text-purple-800 dark:text-purple-300",
    };
  }

  // 4. BỌC KIẾNG ĐEN
  if (
    m.includes("BOCKIENGDEN") ||
    (t.includes("bọc") && t.includes("đen")) ||
    (t.includes("kiếng") && t.includes("đen"))
  ) {
    return {
      key: "boc_kieng_den",
      label: "KIẾNG ĐEN",
      icon: <ShoppingBag className="w-5 h-5 text-slate-200" />,
      bgGradient: "from-slate-800 via-zinc-900 to-black",
      borderColor: "border-slate-700",
      textColor: "text-white",
      badgeBg: "bg-slate-700/80 text-slate-200",
    };
  }

  // 5. BỌC TRẮNG
  if (
    m.includes("BOCTRANG") ||
    (t.includes("bọc") && t.includes("trắng"))
  ) {
    return {
      key: "boc_trang",
      label: "BỌC TRẮNG",
      icon: <ShoppingBag className="w-5 h-5 text-slate-600 dark:text-slate-300" />,
      bgGradient: "from-slate-50 via-gray-100 to-slate-200/90 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900",
      borderColor: "border-slate-300 dark:border-slate-700",
      textColor: "text-slate-800 dark:text-slate-200",
      badgeBg: "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
    };
  }

  // 6. BỌC MIN
  if (
    m.includes("BOCMIN") ||
    t.includes("bọc min") ||
    t.includes("boc min")
  ) {
    return {
      key: "boc_min",
      label: "BỌC MIN",
      icon: <ShoppingBag className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bgGradient: "from-teal-100 via-emerald-50 to-teal-200/80 dark:from-teal-950/60 dark:via-emerald-950/40 dark:to-teal-900/50",
      borderColor: "border-teal-300 dark:border-teal-700",
      textColor: "text-teal-900 dark:text-teal-200",
      badgeBg: "bg-teal-500/15 text-teal-800 dark:text-teal-300",
    };
  }

  // 7. BỌC MỸ LỆ
  if (
    m.includes("BOCMYLE") ||
    t.includes("mỹ lệ") ||
    t.includes("my le")
  ) {
    return {
      key: "boc_myle",
      label: "BỌC MỸ LỆ",
      icon: <Boxes className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      bgGradient: "from-cyan-100 via-sky-50 to-cyan-200/80 dark:from-cyan-950/60 dark:via-sky-950/40 dark:to-cyan-900/50",
      borderColor: "border-cyan-300 dark:border-cyan-700",
      textColor: "text-cyan-900 dark:text-cyan-200",
      badgeBg: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
    };
  }

  // 8. BAO BÌ + GIẤY / TÚI DÁN OPP
  if (
    m.includes("BAOBI") ||
    m.includes("GIAY") ||
    t.includes("bao bì") ||
    t.includes("giấy") ||
    m.includes("OPP") ||
    t.includes("opp")
  ) {
    return {
      key: "bao_bi_giay",
      label: m.includes("OPP") ? "TÚI OPP" : "BAO BÌ",
      icon: <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      bgGradient: "from-emerald-100 via-teal-50 to-emerald-200/80 dark:from-emerald-950/60 dark:via-teal-950/40 dark:to-emerald-900/50",
      borderColor: "border-emerald-300 dark:border-emerald-700",
      textColor: "text-emerald-900 dark:text-emerald-200",
      badgeBg: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    };
  }

  // 9. NHÃN CỔ / NHÃN SIZE / NHÃN MÁC
  if (
    m.includes("NHAN") ||
    t.includes("nhãn") ||
    l.includes("nhãn")
  ) {
    const isSize = m.includes("SIZE") || t.includes("size");
    return {
      key: "nhan_mac",
      label: isSize ? "NHÃN SIZE" : "NHÃN CỔ",
      icon: <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      bgGradient: "from-indigo-100 via-blue-50 to-indigo-200/80 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-indigo-900/50",
      borderColor: "border-indigo-300 dark:border-indigo-700",
      textColor: "text-indigo-900 dark:text-indigo-200",
      badgeBg: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
    };
  }

  // 10. CHỈ MAY CÔNG NGHIỆP
  if (
    m.includes("CHI") ||
    t.includes("chỉ may") ||
    l.includes("chỉ")
  ) {
    return {
      key: "chi_may",
      label: "CHỈ MAY",
      icon: <Disc className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      bgGradient: "from-sky-100 via-blue-50 to-sky-200/80 dark:from-sky-950/60 dark:via-blue-950/40 dark:to-sky-900/50",
      borderColor: "border-sky-300 dark:border-sky-700",
      textColor: "text-sky-900 dark:text-sky-200",
      badgeBg: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    };
  }

  // 11. KEO DỰNG / KEO ÉP
  if (
    m.includes("KEO") ||
    t.includes("keo") ||
    l.includes("keo")
  ) {
    return {
      key: "keo_dung",
      label: "KEO DỰNG",
      icon: <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      bgGradient: "from-orange-100 via-amber-50 to-orange-200/80 dark:from-orange-950/60 dark:via-amber-950/40 dark:to-orange-900/50",
      borderColor: "border-orange-300 dark:border-orange-700",
      textColor: "text-orange-900 dark:text-orange-200",
      badgeBg: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
    };
  }

  // 12. DÂY DỆT XƯƠNG CÁ
  if (
    m.includes("DAY-DET") ||
    t.includes("dây dệt") ||
    l.includes("dây dệt")
  ) {
    return {
      key: "day_det",
      label: "DÂY DỆT",
      icon: <Sliders className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      bgGradient: "from-teal-100 via-cyan-50 to-teal-200/80 dark:from-teal-950/60 dark:via-cyan-950/40 dark:to-teal-900/50",
      borderColor: "border-teal-300 dark:border-teal-700",
      textColor: "text-teal-900 dark:text-teal-200",
      badgeBg: "bg-teal-500/15 text-teal-800 dark:text-teal-300",
    };
  }

  // Mặc định phụ liệu khác
  return {
    key: "phu_lieu_chung",
    label: (m.replace("PL-", "").slice(0, 8) || "PHỤ LIỆU").toUpperCase(),
    icon: <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    bgGradient: "from-slate-100 via-emerald-50/50 to-slate-200/80 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900",
    borderColor: "border-emerald-300 dark:border-emerald-700",
    textColor: "text-emerald-900 dark:text-emerald-200",
    badgeBg: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
  };
}

/**
 * Component hiển thị Thumbnail hình ảnh hoặc Icon chuyên nghiệp cho Vật Tư
 */
export function MaterialThumbnail({
  maMau = "",
  tenMau = "",
  category = "phu_lieu",
  loai = "",
  mauSac = "",
  hinhAnh,
  size = "md",
  className = "",
}: MaterialThumbnailProps) {
  const hasRealImage = isRealMaterialImage(hinhAnh, category);

  // Kích thước container
  const sizeClasses = {
    sm: "h-10 w-10 text-[8px]",
    md: "h-14 w-14 text-[9px]",
    lg: "h-16 w-16 text-[10px]",
  }[size];

  // Nếu có ảnh thật (Kho vải, Bo cổ/Nút có swatch, hoặc ảnh người dùng upload)
  if (hasRealImage && hinhAnh) {
    return (
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 ${sizeClasses} ${className}`}
      >
        <img
          src={hinhAnh}
          alt={tenMau || maMau}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  // Xử lý icon riêng cho Bo Cổ khi chưa có ảnh
  if (category === "bo_co") {
    return (
      <div
        className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-teal-300 dark:border-teal-700 bg-gradient-to-br from-teal-100 via-emerald-50 to-teal-200/80 dark:from-teal-950/60 dark:via-emerald-950/40 dark:to-teal-900/50 p-1 text-center shadow-2xs ${sizeClasses} ${className}`}
      >
        <Sparkles className={size === "sm" ? "w-3.5 h-3.5 text-teal-600" : "w-5 h-5 text-teal-600 dark:text-teal-400 mb-0.5"} />
        <span className="max-w-full truncate px-0.5 font-black tracking-tight leading-none text-teal-900 dark:text-teal-200">
          BO CỔ
        </span>
      </div>
    );
  }

  // Xử lý icon riêng cho Nút khi chưa có ảnh
  if (category === "nut") {
    return (
      <div
        className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-indigo-300 dark:border-indigo-700 bg-gradient-to-br from-indigo-100 via-blue-50 to-indigo-200/80 dark:from-indigo-950/60 dark:via-blue-950/40 dark:to-indigo-900/50 p-1 text-center shadow-2xs ${sizeClasses} ${className}`}
      >
        <ButtonClothIcon className={size === "sm" ? "w-3.5 h-3.5 text-indigo-600" : "w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-0.5"} />
        <span className="max-w-full truncate px-0.5 font-black tracking-tight leading-none text-indigo-900 dark:text-indigo-200">
          NÚT ÁO
        </span>
      </div>
    );
  }

  // Xử lý icon riêng cho Kho Vải khi chưa có ảnh
  if (category === "kho_vai") {
    return (
      <div
        className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-cyan-300 dark:border-cyan-700 bg-gradient-to-br from-cyan-100 via-sky-50 to-cyan-200/80 dark:from-cyan-950/60 dark:via-sky-950/40 dark:to-cyan-900/50 p-1 text-center shadow-2xs ${sizeClasses} ${className}`}
      >
        <Scissors className={size === "sm" ? "w-3.5 h-3.5 text-cyan-600" : "w-5 h-5 text-cyan-600 dark:text-cyan-400 mb-0.5"} />
        <span className="max-w-full truncate px-0.5 font-black tracking-tight leading-none text-cyan-900 dark:text-cyan-200">
          KHO VẢI
        </span>
      </div>
    );
  }

  // PHỤ LIỆU MAY MẶC: Hiển thị icon đặc thù tương ứng
  const cfg = getPhuLieuIconConfig(maMau, tenMau, loai);

  return (
    <div
      className={`relative flex shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border ${cfg.borderColor} bg-gradient-to-br ${cfg.bgGradient} p-1 text-center shadow-2xs transition-transform group-hover:scale-105 ${sizeClasses} ${className}`}
      title={`${tenMau || maMau} (${cfg.label})`}
    >
      <div className={`flex items-center justify-center ${size === "sm" ? "" : "mb-0.5"}`}>
        {React.cloneElement(cfg.icon as React.ReactElement, {
          className: size === "sm" ? "w-4 h-4" : "w-5 h-5",
        })}
      </div>
      <span
        className={`max-w-full truncate px-0.5 font-black tracking-tight leading-none ${cfg.textColor}`}
      >
        {cfg.label}
      </span>
    </div>
  );
}
