"use client";

// ============ LENH CAT MODAL (Giai đoạn 1 - Mavis) ============
// Form 4 sections theo layout anh Sang yeu cau:
//   Section 1: Thong tin chung & Ke hoach (Loai SP, Ma SP, Tong SL, Size, Han, Phu trach Cat)
//   Section 2: Vai (multi-mau, so kg, don gia) → auto tinh gia vai BQ
//   Section 3: Phu lieu (Bo co, Khoa, Cuc, Chi, Nhan, Tui PE...) → auto tinh chi phi / SP
//   Section 4: Phan cong gia cong 5 khau (Cat, May Ao, May Quan, InTheu, UiQC)
//   Section 5: Bang tinh gia von san xuat (COGS) tu dong
// Buttons: [Huy bo] [Phat lenh & Dieu chuyen]
//
// Giai doan 1: Focus Section 1 + 5 (form + COGS auto + luu DB)
// Giai doan 2 (sau): Auto tru kho + Phan cong/Cong no

import { useEffect, useMemo, useState, useRef } from "react";
import {
  X, Plus, Trash2, AlertTriangle, Sparkles, Shirt, Package, Scissors,
  Calculator, TrendingUp, Save, Send, ChevronDown, ChevronUp, Info,
  Wand2, CheckCircle2, UploadCloud, Download, Eye, Printer, Share2,
} from "lucide-react";
import { toast } from "sonner";
import { KHO_VAT_TU, formatVND, formatVNDShort, type KhoVai } from "@/lib/data/real-data";
import { supabase, useSupabaseSync } from "@/lib/supabase/client";
import { useSession, type AppUser } from "@/components/session-provider";
import { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";
import { AIMockupModal } from "@/components/AIMockupModal";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import {
  type LenhCat, type LoaiSP, type MauVai, type LenhCatPhuLieu,
  type PhanCongGiaCong, type TrangThaiLenhCat, type LoaiLenh,
  type ChiPhiCoDinh, type BangCOGS,
  LOAI_SP_LABELS,
  BANG_CHI_PHI_CO_DINH,
  useLenhCat,
  generateLenhCatId,
} from "@/lib/data/lenh-cat-store";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { SIZE_RATIO_5SIZE, SIZE_RATIO_4SIZE, SIZE_RATIO_4SIZE_L3XL, SIZE_RATIO_PRESETS, loadCustomSizeRatioPresets } from "@/lib/size-ratio-presets";
import { MAU_VAI, NHOM_MAU } from "@/lib/color-palette";
import { uploadProductFile } from "@/lib/product-upload";
import { getAllInventory, syncInventoryWithSupabase } from "@/lib/inventory-engine";
import { loadSharedSizeRatioPresets, type SizeRatioPreset } from "@/lib/size-ratio-presets";
import { inPhieuLenhCatA4 } from "@/lib/phieu-lenh-cat-print";
import ChonPhieuInModal from "./ui/ChonPhieuInModal";
import { getChiTietGia3Khau } from "@/lib/fabric-cost-breakdown";
import { AddSizeRatioModal } from "@/app/(main)/kho-thanh-pham/components/AddSizeRatioModal";

type NhanVienOption = { ma: string; ten: string; boPhan?: string; ghiChu?: string; sdt?: string };

function formatValue(value: string | number) {
  return value.toLocaleString("vi-VN");
}

function SearchableSelectKhachHang({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: any[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const getTen = (o: any) => o.ten || o.tenKh || o.ten_kh || o.tenKH || "";
  const getMa = (o: any) => o.maKh || o.ma_kh || o.maKH || "";

  const removeAccents = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : "";
  const searchNormalized = removeAccents(search);

  const filtered = options.filter((o) => removeAccents(getTen(o)).includes(searchNormalized) || removeAccents(getMa(o)).includes(searchNormalized));
  
  // Match by name or ID (since older orders store the name directly)
  const selected = options.find((o) => getMa(o) === value || getTen(o) === value);
  
  return (
    <div className={`relative ${open ? "z-50" : "z-10"}`}>
      <div 
        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] cursor-pointer flex items-center justify-between text-sm transition-colors shadow-2xs" 
        onClick={() => setOpen(!open)}
      >
        <span className={`truncate flex-1 pr-2 ${selected ? "text-slate-900 font-semibold" : "text-slate-400 font-normal"}`}>
          {selected ? getTen(selected) : (value || placeholder)}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {Boolean(value || selected) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setSearch("");
                setOpen(false);
                toast.info("Đã xóa chọn khách hàng");
              }}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
              title="Xóa chọn khách hàng"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900 max-h-60 overflow-y-auto">
          <input 
            type="text" 
            className="w-full px-3 py-2 mb-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] text-sm text-slate-900 dark:bg-slate-800 dark:border-white/10 dark:text-white" 
            placeholder="Tìm tên khách, mã khách..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            autoFocus 
          />
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-sm text-slate-500">Không tìm thấy khách hàng nào</div>
            ) : (
              filtered.map((o) => (
                <button 
                  key={getMa(o)} 
                  type="button" 
                  onClick={() => { onChange(getTen(o)); setOpen(false); setSearch(""); }} 
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white ${getMa(o) === value || getTen(o) === value ? "bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}
                >
                  {getTen(o)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

function SearchableSelectNhanSu({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: NhanVienOption[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const removeAccents = (str: string) => str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : "";
  const searchNormalized = removeAccents(search);

  const filtered = options.filter((o) => removeAccents(o.ten).includes(searchNormalized) || removeAccents(o.ma).includes(searchNormalized));
  const selected = options.find((o) => o.ma === value || o.ten === value);
  
  const displayValue = selected ? `${selected.ma} - ${selected.ten}` : placeholder;

  return (
    <div className={`relative ${open ? "z-50" : "z-20"}`}>
      <div className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] cursor-pointer flex items-center justify-between text-sm" onClick={() => setOpen(!open)}>
        <span className={selected ? "text-slate-900 truncate" : "text-slate-500 truncate"}>{displayValue}</span>
        <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-slate-900">
          <input type="text" className="w-full px-3 py-2 mb-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm text-slate-900 dark:bg-slate-800 dark:border-white/10 dark:text-white" placeholder="Tìm tên, mã..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? <div className="p-3 text-center text-sm text-slate-500">Không tìm thấy</div> : filtered.map((o) => (
              <button key={o.ma} type="button" onClick={() => { onChange(o.ma); setOpen(false); setSearch(""); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white ${o.ma === value || o.ten === value ? "bg-emerald-50 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : ""}`}>
                {o.ma} - {o.ten}
              </button>
            ))}
          </div>
        </div>
      )}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
    </div>
  );
}

const formatTonKhoVai = (tonKho: number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(tonKho);

const getVaiOptionLabel = (vai: KhoVai) => {
  const donGiaStr = vai.donGia && vai.donGia > 0
    ? `${vai.donGia.toLocaleString('vi-VN')} đ/kg`
    : "Chưa quy đổi giá 3 khâu";
  return `${vai.maMoi || vai.maVT} - ${vai.mauSac || vai.tenChuan || vai.tenVT} — [${donGiaStr}] — Tồn: ${formatTonKhoVai(vai.tonKho || 0)} kg`;
};

const INTERNAL_NAMES: Record<string, string> = {
  "XUONG_NHA": "Xưởng nhà",
  "TO_CAT": "Tổ cắt",
  "TO_QC": "Tổ QC",
  "TO_KHUY_NUT": "Tổ Khuy Nút",
  "TO_UI": "Tổ Ủi",
  "TO_DONG_GOI": "Tổ Đóng Gói",
  "KHO_THANH_PHAM": "Kho thành phẩm",
};

const getAllOutsourceOptions = (suffix = "Gia công ngoài", excludePrefix?: string) => DOI_TAC_GIA_CONG
  .filter(dt => !excludePrefix || !dt.ma.startsWith(excludePrefix))
  .map(dt => ({
    ma: dt.ma,
    ten: `${dt.ma} - ${dt.tenDonVi} (${suffix})`,
  }));

const getDoiTuongOptions = (tenCongDoan: string, loaiSP: string, nhanVienOptions: NhanVienOption[]) => {
  const cd = (tenCongDoan || "").toLowerCase();
  
  // 1. Cắt
  if (cd.includes("cắt") || cd.includes("cat")) {
    return [
      { ma: "XUONG_NHA", ten: "Xưởng nhà (Tổ cắt nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Cắt)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Cắt"),
    ];
  }
  
  // 2. Khuy nút
  if (cd.includes("khuy") || cd.includes("nút") || cd.includes("cúc")) {
    return [
      { ma: "TO_KHUY_NUT", ten: "Tổ Khuy Nút (Nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Khuy nút)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Khuy nút"),
    ];
  }
  
  // 3. Ủi
  if (cd.includes("ủi") || cd.includes("ui")) {
    return [
      { ma: "TO_UI", ten: "Tổ Ủi (Nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Ủi)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Ủi"),
    ];
  }
  
  // 4. Đóng Gói
  if (cd.includes("đóng gói") || cd.includes("gấp xếp") || cd.includes("gấp") || cd.includes("xếp") || cd.includes("bao bì") || cd.includes("hoàn thiện")) {
    return [
      { ma: "TO_DONG_GOI", ten: "Tổ Đóng Gói (Nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Đóng gói)` })),
    ];
  }

  // QC (Kiểm hàng)
  if (cd.includes("qc") || cd.includes("kiểm") || cd.includes("kiem")) {
    return [
      { ma: "TO_QC", ten: "Tổ QC (Nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (QC)` })),
    ];
  }

  // Nhập kho
  if (cd.includes("nhập kho") || cd.includes("nhap kho")) {
    return [
      { ma: "KHO_THANH_PHAM", ten: "Kho thành phẩm (Nội bộ)" },
      ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Kho)` })),
    ];
  }

  // 5. May Áo / In / Thêu / Dập / Gia công khác -> Lọc đối tác gia công ngoại
  if (cd.includes("trụ") || cd.includes("tru") || (cd.includes("may áo") && (loaiSP === "AoTru" || loaiSP === "BoTru" || loaiSP === "AoPolo"))) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU") || (dt.chuyenMonChiTiet && dt.chuyenMonChiTiet.includes("May áo trụ")))
        .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Trụ)` })),
      ...getAllOutsourceOptions("Gia công ngoài", "GC-TRU"),
    ];
  }
  if (cd.includes("tròn") || cd.includes("tron") || (cd.includes("may áo") && (loaiSP === "AoCoTron" || loaiSP === "BoCoTron"))) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRON") || (dt.chuyenMonChiTiet && dt.chuyenMonChiTiet.includes("May áo tròn")))
        .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Tròn)` })),
      ...getAllOutsourceOptions("Gia công ngoài", "GC-TRON"),
    ];
  }
  if (cd.includes("quần") || cd.includes("quan")) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-QUAN"))
        .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Quần)` })),
      ...getAllOutsourceOptions("Gia công ngoài", "GC-QUAN"),
    ];
  }
  if (cd.includes("in") || cd.includes("thêu") || cd.includes("dập")) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-IN"))
        .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công In/Thêu)` })),
      ...getAllOutsourceOptions("Gia công ngoài - In/Thêu", "GC-IN"),
    ];
  }

  if (cd.includes("may") || cd.includes("gia công") || cd.includes("outsource")) {
    // Chỉ hiển thị các xưởng may nếu không phải in/thêu
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU") || dt.ma.startsWith("GC-TRON") || dt.ma.startsWith("GC-QUAN") || dt.ma.startsWith("GC-ALL"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }));
  }

  return [
    ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Nội bộ)` })),
    ...DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }))
  ];
};

export const EXCEL_GIA_CONG_MAPPINGS: Record<string, {
  inTheu: { ma: string; ten: string; gia: number };
  mayAo: { ma: string; ten: string; gia: number };
  mayQuan: { ma: string; ten: string; gia: number };
}> = {
  "M01": { inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 }, mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M02": { inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 }, mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M03": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M04": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRON-003", ten: "Xưởng may tròn anh Chiến", gia: 13000 }, mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 } },
  "M05": { inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 }, mayAo: { ma: "GC-TRON-003", ten: "Xưởng may tròn anh Chiến", gia: 13000 }, mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 } },
  "M06": { inTheu: { ma: "GC-IN-007", ten: "Xưởng in anh Trung Nha Trang", gia: 1500 }, mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M07": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M08": { inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 }, mayAo: { ma: "GC-TRU-002", ten: "Xưởng may trụ chị Tý Sơn", gia: 15000 }, mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 } },
  "M09": { inTheu: { ma: "GC-IN-003", ten: "Xưởng in/dập Thanh Sơn", gia: 1500 }, mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 15000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M10": { inTheu: { ma: "GC-IN-002", ten: "Xưởng thêu chị Hạnh", gia: 1500 }, mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M11": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 }, mayQuan: { ma: "GC-QUAN-003", ten: "Xưởng may quần anh Thơ", gia: 9500 } },
  "M12": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRU-006", ten: "Xưởng may trụ cô Cúc", gia: 15000 }, mayQuan: { ma: "GC-QUAN-004", ten: "Xưởng may quần chị Hương", gia: 9500 } },
  "M13": { inTheu: { ma: "GC-IN-003", ten: "Xưởng in/dập Thanh Sơn", gia: 1500 }, mayAo: { ma: "GC-TRU-001", ten: "Xưởng may trụ chị Liễu", gia: 15000 }, mayQuan: { ma: "GC-QUAN-003", ten: "Xưởng may quần anh Thơ", gia: 9500 } },
  "M14": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRU-005", ten: "Xưởng may trụ anh Thông", gia: 15000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
  "M15": { inTheu: { ma: "GC-IN-006", ten: "Xưởng thêu anh Vui", gia: 1500 }, mayAo: { ma: "GC-TRON-001", ten: "Xưởng may tròn anh Trai", gia: 13000 }, mayQuan: { ma: "GC-QUAN-001", ten: "Xưởng may quần chị Dung", gia: 9500 } },
};

export const applyAutoGiaCong = (
  stages: PhanCongGiaCong, 
  maSPKey?: string,
  tenSPKey?: string,
  loaiSPKey?: string
): PhanCongGiaCong => {
  const textToScan = `${maSPKey || ""} ${tenSPKey || ""}`.toUpperCase().trim();
  const mMatch = textToScan.match(/\bM0?([1-9]|1[0-5])\b/);
  let mappedCode = "";
  if (mMatch) {
    const num = parseInt(mMatch[1], 10);
    mappedCode = num < 10 ? `M0${num}` : `M${num}`;
  } else {
    const directKey = (maSPKey || "").toUpperCase().trim();
    if (EXCEL_GIA_CONG_MAPPINGS[directKey]) {
      mappedCode = directKey;
    }
  }

  const asg = EXCEL_GIA_CONG_MAPPINGS[mappedCode];
  const isBo = (loaiSPKey || "").toLowerCase().includes("bo");
  const isTru = (loaiSPKey || "").toLowerCase().includes("tru") || (loaiSPKey || "").toLowerCase().includes("polo");

  return stages.map(item => {
    // If already has valid nguoiMa, keep it
    if (item.nguoiMa && item.nguoiMa.trim() !== "") return item;

    const id = item.id;
    const cd = (item.tenCongDoan || "").toLowerCase();

    if (id === "cat" || cd.includes("cắt")) {
      return { ...item, nguoiMa: "XUONG_NHA", nguoiTen: "Xưởng nhà", loaiNguoi: "noi_bo", donGia: item.donGia || (isBo ? 2300 : 1400) };
    }
    if (asg) {
      if (id === "in_theu" || cd.includes("in") || cd.includes("thêu")) {
        return { ...item, nguoiMa: asg.inTheu.ma, nguoiTen: asg.inTheu.ten, loaiNguoi: "xuong_ngoai", donGia: item.donGia || asg.inTheu.gia };
      }
      if (id === "may_ao" || (cd.includes("may") && (cd.includes("áo") || !isBo))) {
        return { ...item, nguoiMa: asg.mayAo.ma, nguoiTen: asg.mayAo.ten, loaiNguoi: "xuong_ngoai", donGia: item.donGia || asg.mayAo.gia };
      }
      if (id === "may_quan" || (cd.includes("may") && cd.includes("quần"))) {
        return { ...item, nguoiMa: asg.mayQuan.ma, nguoiTen: asg.mayQuan.ten, loaiNguoi: "xuong_ngoai", donGia: item.donGia || asg.mayQuan.gia };
      }
    } else {
      if (id === "in_theu" || cd.includes("in") || cd.includes("thêu")) {
        return { ...item, nguoiMa: "GC-IN-007", nguoiTen: "Xưởng in anh Trung Nha Trang", loaiNguoi: "xuong_ngoai", donGia: item.donGia || 1500 };
      }
      if (id === "may_ao" || (cd.includes("may") && (cd.includes("áo") || !isBo))) {
        return isTru
          ? { ...item, nguoiMa: "GC-TRU-006", nguoiTen: "Xưởng may trụ cô Cúc", loaiNguoi: "xuong_ngoai", donGia: item.donGia || 15000 }
          : { ...item, nguoiMa: "GC-TRON-001", nguoiTen: "Xưởng may tròn anh Trai", loaiNguoi: "xuong_ngoai", donGia: item.donGia || 13000 };
      }
      if (id === "may_quan" || (cd.includes("may") && cd.includes("quần"))) {
        return { ...item, nguoiMa: "GC-QUAN-001", nguoiTen: "Xưởng may quần chị Dung", loaiNguoi: "xuong_ngoai", donGia: item.donGia || 9500 };
      }
    }
    if (id === "qc" || cd.includes("qc") || cd.includes("kiểm")) {
      return { ...item, nguoiMa: "TO_QC", nguoiTen: "Tổ QC", loaiNguoi: "noi_bo", donGia: item.donGia || 500 };
    }
    if (id === "khuy_nut" || cd.includes("khuy")) {
      return { ...item, nguoiMa: "TO_KHUY_NUT", nguoiTen: "Tổ Khuy Nút", loaiNguoi: "noi_bo", donGia: item.donGia || 750 };
    }
    if (id === "ui" || cd.includes("ủi")) {
      return { ...item, nguoiMa: "TO_UI", nguoiTen: "Tổ Ủi", loaiNguoi: "noi_bo", donGia: item.donGia || (isBo ? 1500 : 900) };
    }
    if (id === "dong_goi" || cd.includes("đóng gói")) {
      return { ...item, nguoiMa: "TO_DONG_GOI", nguoiTen: "Tổ Đóng Gói", loaiNguoi: "noi_bo", donGia: item.donGia || (isBo ? 1200 : 700) };
    }
    if (id === "nhap_kho" || cd.includes("kho")) {
      return { ...item, nguoiMa: "KHO_THANH_PHAM", nguoiTen: "Kho thành phẩm", loaiNguoi: "noi_bo", donGia: 0 };
    }
    return item;
  });
};

const isOutsourceStage = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  return cd.includes("may") || cd.includes("in") || cd.includes("thêu") || cd.includes("dập") || cd.includes("gia công");
};

const isInTheuStage = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  return cd.includes("in") || cd.includes("thêu") || cd.includes("dập") || cd.includes("chuyển nhiệt");
};
const IN_THEU_OPTIONS = ["In", "Thêu", "Dập", "In chuyển nhiệt"] as const;
type InTheuOption = typeof IN_THEU_OPTIONS[number];

const getInTheuStage = (stages: PhanCongGiaCong) => stages.find(stage => isInTheuStage(stage.tenCongDoan));

export const isBoProduct = (loai?: string): boolean => {
  if (!loai) return false;
  const s = loai.toLowerCase();
  return s.includes("bo") || s.includes("bộ");
};

const getTemplateIdForProduct = (loaiSP: LoaiSP) => {
  if (loaiSP === "BoTru") return "MCD-BO-TRU";
  if (loaiSP === "BoCoTron") return "MCD-BO-TRON";
  if (loaiSP === "AoTru" || loaiSP === "AoPolo") return "MCD-AO-TRU";
  return "MCD-AO-TRON";
};

const splitPhoiFiles = (value?: any) => {
  if (!value) return { ao: "", quan: "" };
  if (typeof value === "object") {
    if ("ao" in value || "quan" in value) {
      return { 
        ao: typeof value.ao === "object" ? JSON.stringify(value.ao) : (value.ao || ""), 
        quan: typeof value.quan === "object" ? JSON.stringify(value.quan) : (value.quan || "") 
      };
    }
    return { ao: JSON.stringify(value), quan: "" };
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && ("ao" in parsed || "quan" in parsed)) {
      return { 
        ao: typeof parsed.ao === "object" ? JSON.stringify(parsed.ao) : (parsed.ao || ""), 
        quan: typeof parsed.quan === "object" ? JSON.stringify(parsed.quan) : (parsed.quan || "") 
      };
    }
  } catch {}
  return { ao: value, quan: "" };
};

const splitDiagramFiles = (value?: any) => {
  if (!value) return { file: "", image: "" };
  if (typeof value === "object") {
    if ("file" in value || "image" in value) {
      return { 
        file: typeof value.file === "object" ? JSON.stringify(value.file) : (value.file || ""), 
        image: typeof value.image === "object" ? JSON.stringify(value.image) : (value.image || "") 
      };
    }
    if (value.url || value.type?.startsWith("image/")) {
      return { file: "", image: JSON.stringify(value) };
    }
    return { file: JSON.stringify(value), image: "" };
  }
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      if ("file" in parsed || "image" in parsed) {
        return { 
          file: typeof parsed.file === "object" ? JSON.stringify(parsed.file) : (parsed.file || ""), 
          image: typeof parsed.image === "object" ? JSON.stringify(parsed.image) : (parsed.image || "") 
        };
      }
      if (parsed.url || parsed.type?.startsWith("image/")) {
        return { file: "", image: value };
      }
    }
  } catch {}
  if (typeof value === "string" && (value.startsWith("data:image/") || value.startsWith("http"))) {
    return { file: "", image: value };
  }
  return { file: value, image: "" };
};

const getDistinctColorOptions = (baseColor: string, selectedColors: string[] = []) => {
  const base = MAU_VAI.find(color => color.ten.toLowerCase() === baseColor.toLowerCase());
  return MAU_VAI.filter(color =>
    color.ten !== baseColor &&
    !selectedColors.includes(color.ten) &&
    (!base || color.nhom !== base.nhom)
  );
};

const isQuanStage = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  return cd.includes("quần") || cd.includes("quan");
};
const getVisibleStages = (stages: PhanCongGiaCong, loaiSP: LoaiSP, congDoanInTheu: string = "") => {
  const isBo = loaiSP?.toLowerCase().includes("bo") || false;
  return stages.filter(stage => {
    if (!congDoanInTheu && isInTheuStage(stage.tenCongDoan)) return false;
    return isBo || !isQuanStage(stage.tenCongDoan);
  });
};

// Constants
const SIZE_OPTIONS = ["S", "M", "L", "XL", "2XL", "3XL"];
const DEFAULT_HAO_HUT = 1.5; // 1.5%
const DEFAULT_DON_GIA = {
  cat: 3500,
  mayAo: 22000,
  mayQuan: 18000,
  inTheu: 4500,
  uiQC: 3000,
};

/**
 * Fallback user khi session null (chưa login) — dùng cho logWorkflow vẫn ghi nhận action.
 * Match đúng shape AppUser (id/email/name/role/title/source).
 */
const getFallbackUser = (): AppUser => ({
  id: "NV001",
  email: "sang@mimin.vn",
  name: "Hồ Minh Sang",
  role: "DIEU_HANH",
  title: "Admin",
  source: "demo",
});

// Mỗi thẻ Màu trong lệnh cắt lấy 1 màu trong bảng này theo thứ tự (idx %
// length) - giúp phân biệt nhanh bằng mắt khi lệnh có nhiều màu, không phải
// đọc chữ "Màu 1/Màu 2..." mới biết đang ở thẻ nào. Dùng class literal đầy
// đủ (không ghép chuỗi động) để Tailwind JIT quét được.
const MAU_CARD_ACCENT = [
  { stripe: "border-l-emerald-500", badge: "bg-emerald-500", tint: "bg-emerald-50/50", ring: "focus-within:ring-emerald-200" },
  { stripe: "border-l-sky-500", badge: "bg-sky-500", tint: "bg-sky-50/50", ring: "focus-within:ring-sky-200" },
  { stripe: "border-l-amber-500", badge: "bg-amber-500", tint: "bg-amber-50/50", ring: "focus-within:ring-amber-200" },
  { stripe: "border-l-rose-500", badge: "bg-rose-500", tint: "bg-rose-50/50", ring: "focus-within:ring-rose-200" },
  { stripe: "border-l-violet-500", badge: "bg-violet-500", tint: "bg-violet-50/50", ring: "focus-within:ring-violet-200" },
  { stripe: "border-l-cyan-500", badge: "bg-cyan-500", tint: "bg-cyan-50/50", ring: "focus-within:ring-cyan-200" },
  { stripe: "border-l-orange-500", badge: "bg-orange-500", tint: "bg-orange-50/50", ring: "focus-within:ring-orange-200" },
  { stripe: "border-l-fuchsia-500", badge: "bg-fuchsia-500", tint: "bg-fuchsia-50/50", ring: "focus-within:ring-fuchsia-200" },
] as const;

export function LenhCatModal({ isOpen, onClose, editId, initialSP }: { isOpen: boolean; onClose: () => void; editId?: string | null; initialSP?: import("@/lib/data/danh-muc-sp-store").SanPham | null }) {
  const { list: nhanSuList } = useNhanSu();
  const nhanVienOptions: NhanVienOption[] = nhanSuList.map(nv => ({
    ma: nv.maNV,
    ten: nv.hoTen,
    boPhan: nv.boPhan,
    ghiChu: nv.ghiChu,
    sdt: nv.sdt,
  }));
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, themMauCongDoan, dsMauChiPhi, themMauChiPhi } = useLenhCat();
  const { dsSanPham } = useDanhMucSP();
  const [khoVaiReals, setKhoVaiReals] = useState<KhoVai[]>([]);
  const [isKhoVaiLoading, setIsKhoVaiLoading] = useState(true);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [zaloPickerOpen, setZaloPickerOpen] = useState(false);
  useEffect(() => {
    let isActive = true;
    const inv = getAllInventory();
    setKhoVaiReals(inv);
    void syncInventoryWithSupabase()
      .then(() => {
        if (isActive) {
          const fresh = getAllInventory();
          setKhoVaiReals(fresh);
          // Tự động cập nhật đơn giá vải kho cho các màu đang hiển thị nếu chưa có đơn giá
          setDsMau(prev => prev.map(m => {
            const vAo = m.maVai ? fresh.find(x => x.maVT === m.maVai) : null;
            const vQuan = m.maVaiQuan ? fresh.find(x => x.maVT === m.maVaiQuan) : null;
            let dgAo = m.donGiaVai;
            let dgQuan = m.donGiaVaiQuan;
            let changed = false;
            if (vAo && (!dgAo || dgAo === 0)) {
              dgAo = vAo.donGia || 0;
              changed = true;
            }
            if (vQuan && (!dgQuan || dgQuan === 0)) {
              dgQuan = vQuan.donGia || 0;
              changed = true;
            }
            return changed ? { ...m, donGiaVai: dgAo, donGiaVaiQuan: dgQuan } : m;
          }));
        }
      })
      .finally(() => {
        if (isActive) setIsKhoVaiLoading(false);
      });
    return () => { isActive = false; };
  }, []);

  const { data: rawKho } = useSupabaseSync<any>("mimin_kho_all_real", "kho");
  const khoPhuLieuReals = useMemo(() => {
    if (!rawKho) return KHO_VAT_TU;
    const phuLieu = rawKho.filter((x: any) => x.loai === "Phu lieu");
    if (phuLieu.length === 0) return KHO_VAT_TU;
    return phuLieu.map((r: any) => ({
      maVT: r.sku || "",
      tenVT: r.tenVt || "",
      mauSac: r.mauSac || "",
      dvt: r.dvt || "cái",
      donGia: Number(r.donGia) || 0,
      loai: r.loaiChiTiet || "Phụ liệu", 
      tonKho: r.tonKho || 0, 
      tonToiThieu: r.tonToiThieu || 0, 
      kho: "Kho phụ liệu",
      ghiChu: r.ghiChu || "",
      soCayNhap: r.soCayNhap || 0,
      tonCay: r.tonCay || 0,
      tenChuan: r.tenVt || "",
      maMoi: r.maMoi || "",
    }));
  }, [rawKho]);

  const { user } = useSession();
  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;

  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!editId || !supabase) {
      setIsLocked(false);
      setActiveEditor(null);
      return;
    }

    const channelName = `lenh_cat_presence_${editId}`;
    const myClientId = `${user?.id || "anon"}-${Math.random().toString(36).slice(2, 9)}`;
    const myName = user?.name || "Người dùng ẩn danh";
    
    const channel = supabase.channel(channelName, {
      config: { presence: { key: myClientId } },
    });
    
    const globalChannel = supabase.channel('global_lenh_cat_presence', {
      config: { presence: { key: myClientId } },
    });

    const myState = {
      id: myClientId,
      name: myName,
      joinedAt: Date.now(),
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let firstEditor: any = null;
        
        for (const key in state) {
          const presences = state[key] as any[];
          for (const p of presences) {
            if (!firstEditor || p.joinedAt < firstEditor.joinedAt) {
              firstEditor = p;
            }
          }
        }
        
        if (firstEditor && firstEditor.id !== myClientId && firstEditor.name !== myName) {
          setIsLocked(true);
          setActiveEditor(firstEditor.name);
        } else {
          setIsLocked(false);
          setActiveEditor(null);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myState);
        }
      });

    return () => {
      channel.untrack();
      supabase?.removeChannel(channel);
    };
  }, [editId, user]);

  const loadedEditId = useRef<string | null>(null);
  const loadedEditHash = useRef<string>("");

  // Sync editing data into states when editing changes
  useEffect(() => {
    if (!editing) return;
    const isNewId = loadedEditId.current !== editing.id;
    const editHash = `${editing.id}_${editing.soDoAo || ""}_${editing.soDoQuan || ""}_${editing.soDoPhoi || ""}_${editing.soDoChinh || ""}_${editing.hinhMauInTheu || ""}_${editing.fileGocInTheu || ""}_${editing.daiSoDoAo || ""}_${editing.daiSoDoQuan || ""}`;
    const hasDataChanged = isNewId || (loadedEditHash.current !== editHash);

    if (hasDataChanged) {
      loadedEditId.current = editing.id;
      loadedEditHash.current = editHash;
      if (isNewId) {
        setLoaiLenh(editing.loaiLenh);
        setKhachHang(editing.khachHang || "");
        setLoaiSP(editing.loaiSP);
        setMaSP(editing.maSP);
        setTenSP(editing.tenSP);
        setTongSL(editing.tongSL);
        setTongSLThucTe(editing.tongSLThucTe || "");
        if (editing.ngayTao) setNgayBatDau(editing.ngayTao);
        setHanHoanThanh(editing.hanHoanThanh);
        setPhuTrachCat(editing.phuTrachCat || "");
        setPhuTrachSX(editing.phuTrachSX || "");
        setPhuTrachSoDo(editing.phuTrachSoDo || "");
        setGhiChu(editing.ghiChu || "");
        setGhiChuKyThuat(editing.ghiChuKyThuat || "");
        setTrangThai(editing.trangThai || "Nhap");
        const targetTiLe = editing.tiLeSize || "1:2:2:1";
        setTiLeSize(targetTiLe);
        // Nhận diện chính xác preset theo CẢ tỷ lệ VÀ danh sách size từ dsMau (tránh nhầm Ri8 của M-2XL với L-3XL)
        const existingSizes = editing.dsMau?.[0]?.phanBoSize?.map(p => p.size).filter(Boolean) || [];
        let matchPreset: SizeRatioPreset | undefined;
        if (existingSizes.length > 0) {
          matchPreset = allRatioPresets.find(p => 
            (p.id === targetTiLe || p.label === targetTiLe || p.value === targetTiLe) &&
            p.sizes && p.sizes.length === existingSizes.length &&
            p.sizes.every((sz, i) => sz.toUpperCase() === existingSizes[i].toUpperCase())
          );
        }
        if (!matchPreset) {
          matchPreset = allRatioPresets.find(p => p.id === targetTiLe || p.label === targetTiLe);
        }
        if (!matchPreset && existingSizes.length > 0) {
          matchPreset = allRatioPresets.find(p => 
            p.sizes && p.sizes.length === existingSizes.length &&
            p.sizes.every((sz, i) => sz.toUpperCase() === existingSizes[i].toUpperCase())
          );
        }
        if (!matchPreset) {
          matchPreset = allRatioPresets.find(p => p.value === targetTiLe);
        }
        if (matchPreset) setSelectedPresetId(matchPreset.id);
        else setSelectedPresetId("");
        setSoMau(editing.dsMau?.length || 4);
        const currentKho = getAllInventory();
        const populatedDsMau = (editing.dsMau || []).map((m) => {
          const vAo = m.maVai ? (currentKho.find(x => x.maVT === m.maVai) || khoVaiReals.find(x => x.maVT === m.maVai)) : null;
          const vQuan = m.maVaiQuan ? (currentKho.find(x => x.maVT === m.maVaiQuan) || khoVaiReals.find(x => x.maVT === m.maVaiQuan)) : null;
          return {
            ...m,
            donGiaVai: (m.donGiaVai && m.donGiaVai > 0) ? m.donGiaVai : (vAo?.donGia || 0),
            donGiaVaiQuan: (m.donGiaVaiQuan && m.donGiaVaiQuan > 0) ? m.donGiaVaiQuan : (vQuan?.donGia || 0),
            dinhMucQuan: (m.dinhMucQuan && m.dinhMucQuan > 0) ? m.dinhMucQuan : (isBoProduct(editing.loaiSP) ? 0.18 : 0),
          };
        });
        setDsMau(populatedDsMau);
        setDsPhuLieu(editing.dsPhuLieu || []);
        setMauCongDoan(editing.mauCongDoan || getTemplateIdForProduct(editing.loaiSP));
        const templateCandidate = dsMauCongDoan.find(x => x.id === (editing.mauCongDoan || getTemplateIdForProduct(editing.loaiSP))) || dsMauCongDoan[0];
        const initialPhanCong = (editing.phanCong && editing.phanCong.length > 0)
          ? editing.phanCong
          : (templateCandidate ? templateCandidate.giaCong : []);
        const autoPhanCong = applyAutoGiaCong(initialPhanCong, editing.maSP, editing.tenSP, editing.loaiSP);
        setPhanCong(autoPhanCong);
        const inTheuItem = getInTheuStage(autoPhanCong);
        if (inTheuItem) {
          setCongDoanInTheu((IN_THEU_OPTIONS.find(option => inTheuItem.tenCongDoan?.toLowerCase().includes(option.toLowerCase())) || "In") as InTheuOption);
          if (inTheuItem.id === "in_theu_ao") setLoaiInTheu("ao");
          else if (inTheuItem.id === "in_theu_quan") setLoaiInTheu("quan");
          else setLoaiInTheu("bo");
        }
        setChiPhiCoDinh(editing.chiPhiCoDinh || BANG_CHI_PHI_CO_DINH[editing.loaiSP] || {});
        setPhienBanDinhMuc(editing.phienBanDinhMuc || 1);
      }

      // Luôn đồng bộ dữ liệu sơ đồ & tài liệu sản xuất
      if (isNewId || editing.soDoChinh) setSoDoChinh(editing.soDoChinh || "");
      if (isNewId || editing.pdfSoDoChinh) setPdfSoDoChinh(editing.pdfSoDoChinh || "");
      if (isNewId || editing.khoSoDoChinh) setKhoSoDoChinh(editing.khoSoDoChinh || "");
      if (isNewId || editing.daiSoDoChinh) setDaiSoDoChinh(editing.daiSoDoChinh || "");
      if (isNewId || editing.soDoPhoi) {
        setSoDoPhoi(editing.soDoPhoi || "");
        const phoiFiles = splitPhoiFiles(editing.soDoPhoi);
        setSoDoPhoiAo(phoiFiles.ao);
        setSoDoPhoiQuan(phoiFiles.quan);
        if (editing.loaiSoDoPhoi) {
          setLoaiSoDoPhoi(editing.loaiSoDoPhoi as any);
        } else if (phoiFiles.ao && phoiFiles.quan) {
          setLoaiSoDoPhoi("ca-hai");
        } else if (phoiFiles.quan) {
          setLoaiSoDoPhoi("quan");
        } else if (phoiFiles.ao) {
          setLoaiSoDoPhoi("ao");
        } else if (editing.soDoChinh || editing.pdfSoDoPhoi || editing.khoSoDoPhoi || editing.daiSoDoPhoi) {
          setLoaiSoDoPhoi("ca-hai");
        }
      }
      if (isNewId || editing.pdfSoDoPhoi) setPdfSoDoPhoi(editing.pdfSoDoPhoi || "");
      if (isNewId || editing.khoSoDoPhoi) setKhoSoDoPhoi(editing.khoSoDoPhoi || "");
      if (isNewId || editing.daiSoDoPhoi) setDaiSoDoPhoi(editing.daiSoDoPhoi || "");
      if (isNewId || editing.ghiChuSoDoChinh) setGhiChuSoDoChinh(editing.ghiChuSoDoChinh || "");
      if (isNewId || editing.ghiChuSoDoPhoi) setGhiChuSoDoPhoi(editing.ghiChuSoDoPhoi || "");
      if (isNewId || editing.daCoSoDo !== undefined) setDaCoSoDo(editing.daCoSoDo || false);
      if (isNewId || editing.daiSoDoAo) setDaiSoDoAo(editing.daiSoDoAo || "");
      if (isNewId || editing.soDoAo) {
        const diagramAo = splitDiagramFiles(editing.soDoAo);
        setSoDoAo(diagramAo.file);
        setHinhAnhSoDoAo(diagramAo.image);
      }
      if (isNewId || editing.daiSoDoQuan) setDaiSoDoQuan(editing.daiSoDoQuan || "");
      if (isNewId || editing.soDoQuan) {
        const diagramQuan = splitDiagramFiles(editing.soDoQuan);
        setSoDoQuan(diagramQuan.file);
        setHinhAnhSoDoQuan(diagramQuan.image);
      }
      if (isNewId || editing.hinhMauInTheu) setHinhMauInTheu(editing.hinhMauInTheu || "");
      if (isNewId || editing.fileGocInTheu) setFileGocInTheu(editing.fileGocInTheu || "");
      if (isNewId || editing.ghiChuInTheu) setGhiChuInTheu(editing.ghiChuInTheu || "");
    }
  }, [editing]);

  // Reset loadedEditId when modal closes
  const hasAdjustedOldDataRef = useRef(false);
  useEffect(() => {
    if (!isOpen) {
      loadedEditId.current = null;
      loadedEditHash.current = "";
      hasAdjustedOldDataRef.current = false;
    }
  }, [isOpen]);

  // Pre-fill product info khi mở từ nút "Sản Xuất" ở Danh Mục SP
  useEffect(() => {
    if (!initialSP || editId) return; // chỉ áp dụng khi tạo mới (không phải edit)
    setMaSP(initialSP.id || "");
    setTenSP(initialSP.tenSP || "");
    if (initialSP.loaiSP) setLoaiSP(initialSP.loaiSP as LoaiSP);
    if (initialSP.tiLeSize) {
      setTiLeSize(initialSP.tiLeSize);
      let initSizes: string[] = [];
      try {
        const parsedDs = typeof initialSP.dsMau === "string" ? JSON.parse(initialSP.dsMau) : initialSP.dsMau;
        initSizes = parsedDs?.[0]?.phanBoSize?.map((p: any) => p.size).filter(Boolean) || [];
      } catch {}

      let matchPreset: SizeRatioPreset | undefined;
      if (initSizes.length > 0) {
        matchPreset = allRatioPresets.find(p => 
          (p.id === initialSP.tiLeSize || p.label === initialSP.tiLeSize || p.value === initialSP.tiLeSize) &&
          p.sizes && p.sizes.length === initSizes.length &&
          p.sizes.every((sz, i) => sz.toUpperCase() === initSizes[i].toUpperCase())
        );
      }
      if (!matchPreset) {
        matchPreset = allRatioPresets.find(p => p.id === initialSP.tiLeSize || p.label === initialSP.tiLeSize);
      }
      if (!matchPreset && initSizes.length > 0) {
        matchPreset = allRatioPresets.find(p => 
          p.sizes && p.sizes.length === initSizes.length &&
          p.sizes.every((sz, i) => sz.toUpperCase() === initSizes[i].toUpperCase())
        );
      }
      if (!matchPreset) {
        matchPreset = allRatioPresets.find(p => p.value === initialSP.tiLeSize);
      }
      if (matchPreset) setSelectedPresetId(matchPreset.id);
      else setSelectedPresetId("");
    }
    try {
      let dsMauToSet: unknown = initialSP.dsMau;
      if (typeof dsMauToSet === "string") {
        dsMauToSet = JSON.parse(dsMauToSet);
      }
      if (Array.isArray(dsMauToSet) && dsMauToSet.length > 0) {
        setSoMau(dsMauToSet.length);
        setDsMau(dsMauToSet.map((m: Record<string, unknown>) => ({
          ten: (m.ten as string) || "",
          maSKU: (m.maSKU as string) || "",
          dinhMuc: (m.dinhMuc as number) || 0.25,
          img: (m.img as string) || "",
          maVai: "",
          slDuKien: 0,
          ghiChu: "",
          phanBoSize: [],
        })));
      }
    } catch (e) {
      console.error("Lỗi parse dsMau từ initialSP:", e);
    }
  }, [initialSP, editId]);

  // ============ Form state ============
  const [loaiLenh, setLoaiLenh] = useState<LoaiLenh>("HangNha");
  const [khachHang, setKhachHang] = useState("");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>("BoTru");
  const isBo = (loaiSP || "").toLowerCase().includes("bo");
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [tongSL, setTongSL] = useState<number | "">("");
  const [tongSLThucTe, setTongSLThucTe] = useState<number | "">("");
  const [ngayBatDau, setNgayBatDau] = useState(() => new Date().toISOString().split("T")[0]);
  const [sdtLienHe, setSdtLienHe] = useState("");
  const [hanHoanThanh, setHanHoanThanh] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split("T")[0];
  });
  const [nguoiPhuTrachCat, setNguoiPhuTrachCat] = useState(editing?.phuTrachCat || "");
  const [dienThoaiNguoiCac, setDienThoaiNguoiCac] = useState("");

  // Custom Product Dropdown State
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sơ đồ áo/quần (PLT) - dùng để tự tính định mức kg/SP
  const [daiSoDoAo, setDaiSoDoAo] = useState("");
  const [soDoAo, setSoDoAo] = useState("");
  const [hinhAnhSoDoAo, setHinhAnhSoDoAo] = useState("");
  const [daiSoDoQuan, setDaiSoDoQuan] = useState("");
  const [soDoQuan, setSoDoQuan] = useState("");
  const [hinhAnhSoDoQuan, setHinhAnhSoDoQuan] = useState("");
  const fileAoRef = useRef<HTMLInputElement>(null);
  const fileQuanRef = useRef<HTMLInputElement>(null);
  const imageAoRef = useRef<HTMLInputElement>(null);
  const imageQuanRef = useRef<HTMLInputElement>(null);

  // Sơ đồ cắt
  const [soDoChinh, setSoDoChinh] = useState("");
  const [pdfSoDoChinh, setPdfSoDoChinh] = useState("");
  const [khoSoDoChinh, setKhoSoDoChinh] = useState("");
  const [daiSoDoChinh, setDaiSoDoChinh] = useState("");
  const [soDoPhoi, setSoDoPhoi] = useState("");
  const [soDoPhoiAo, setSoDoPhoiAo] = useState("");
  const [soDoPhoiQuan, setSoDoPhoiQuan] = useState("");
  const [loaiSoDoPhoi, setLoaiSoDoPhoi] = useState<"ao" | "quan" | "ca-hai" | "">("");
  const [pdfSoDoPhoi, setPdfSoDoPhoi] = useState("");
  const [khoSoDoPhoi, setKhoSoDoPhoi] = useState("");
  const [daiSoDoPhoi, setDaiSoDoPhoi] = useState("");
  const [ghiChuSoDoChinh, setGhiChuSoDoChinh] = useState("");
  const [ghiChuSoDoPhoi, setGhiChuSoDoPhoi] = useState("");
  const [daCoSoDo, setDaCoSoDo] = useState(false);
  const fileChinhRef = useRef<HTMLInputElement>(null);
  const filePdfChinhRef = useRef<HTMLInputElement>(null);
  const filePhoiRef = useRef<HTMLInputElement>(null);
  const filePdfPhoiRef = useRef<HTMLInputElement>(null);

  // Tài liệu In/Thêu (mẫu)
  const [hinhMauInTheu, setHinhMauInTheu] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [fileGocInTheu, setFileGocInTheu] = useState("");
  const [ghiChuInTheu, setGhiChuInTheu] = useState("");
  const [loaiInTheu, setLoaiInTheu] = useState<"ao" | "quan" | "bo">("bo");
    const [congDoanInTheu, setCongDoanInTheu] = useState<InTheuOption | "">("");
  const fileInTheuAnhRef = useRef<HTMLInputElement>(null);
  const fileInTheuFileRef = useRef<HTMLInputElement>(null);

  const handleUploadSoDo = async (e: React.ChangeEvent<HTMLInputElement>, type: "chinh" | "phoi" | "pdf-chinh" | "pdf-phoi" | "ao" | "quan" | "anh-ao" | "anh-quan" | "in-theu-anh" | "in-theu-file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File quá lớn, vui lòng chọn file < 2MB (demo giới hạn localStorage)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const fileData = JSON.stringify({ name: file.name, type: file.type, url: dataUrl });

      if (type === "chinh") {
        setSoDoChinh(fileData);
        setDaCoSoDo(true);
      } else if (type === "phoi") {
        if (loaiSoDoPhoi === "quan" || loaiSoDoPhoi === "ca-hai") setSoDoPhoiQuan(fileData);
        else setSoDoPhoiAo(fileData);
        setDaCoSoDo(true);
      } else if (type === "pdf-chinh") {
        setPdfSoDoChinh(fileData);
      } else if (type === "pdf-phoi") {
        setPdfSoDoPhoi(fileData);
      } else if (type === "ao") {
        setSoDoAo(fileData);
      } else if (type === "quan") {
        setSoDoQuan(fileData);
      } else if (type === "anh-ao") {
        setHinhAnhSoDoAo(fileData);
      } else if (type === "anh-quan") {
        setHinhAnhSoDoQuan(fileData);
      } else if (type === "in-theu-anh") {
        setHinhMauInTheu(fileData);
      } else if (type === "in-theu-file") {
        setFileGocInTheu(fileData);
      }
      toast.success("Đã tải lên " + file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadSoDo = (e: React.MouseEvent, fileDataStr: string) => {
    e.stopPropagation();
    try {
      let url = "";
      let name = "tai-lieu";
      const trimmed = (fileDataStr || "").trim();
      if (trimmed.startsWith("/") || trimmed.startsWith("http") || trimmed.startsWith("data:")) {
        url = trimmed;
        name = trimmed.startsWith("data:") ? "hinh-anh-mau.png" : (trimmed.split("/").pop() || "tai-lieu");
      } else {
        const fileData = JSON.parse(fileDataStr);
        url = fileData.url;
        name = fileData.name || "tai-lieu";
      }
      if (!url) return;
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      // Fallback for old mock data
      toast.error("Không thể tải file");
    }
  };

  const handleSelectInTheu = (value: InTheuOption | "") => {
    setCongDoanInTheu(value);
    setPhanCong(prev => {
      const next = [...prev];
      const index = next.findIndex(stage => isInTheuStage(stage.tenCongDoan));
      if (!value) return next.filter(stage => !isInTheuStage(stage.tenCongDoan));
      const existing = index >= 0 ? next[index] : {
        id: "in_theu",
        loaiNguoi: "xuong_ngoai",
        nguoiMa: "",
        nguoiTen: "",
        donGia: 0,
        soLuong: 0,
        thanhTien: 0,
        daThanhToan: 0,
        conLai: 0,
        trangThaiTT: "chua_tra",
      } as PhanCongGiaCong[number];
      const updated = { ...existing, tenCongDoan: value };
      if (index >= 0) next[index] = updated;
      else next.push(updated);
      return next;
    });
    if (!value) {
      setHinhMauInTheu("");
      setFileGocInTheu("");
      setGhiChuInTheu("");
    }
  };

  const handlePreviewPDF = (e: React.MouseEvent, fileDataStr: string) => {
    e.stopPropagation();
    try {
      const fileData = JSON.parse(fileDataStr);
      if (!fileData.url) return;
      
      const arr = fileData.url.split(',');
      const match = arr[0].match(/:(.*?);/);
      const mime = match ? match[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], {type: mime});
      const blobUrl = URL.createObjectURL(blob);
      
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(err);
      toast.error("Không thể xem trước file PDF");
    }
  };

  const handlePreviewImage = (e: React.MouseEvent, imageDataStr: string) => {
    e.stopPropagation();
    if (!imageDataStr) return;
    const trimmed = imageDataStr.trim();
    if (trimmed.startsWith("/") || trimmed.startsWith("http") || trimmed.startsWith("data:")) {
      setPreviewImage({ url: trimmed, name: "Ảnh" });
      return;
    }
    try {
      const imageData = JSON.parse(imageDataStr);
      if (!imageData.url) return;
      setPreviewImage({ url: imageData.url, name: imageData.name || "Ảnh" });
    } catch {
      setPreviewImage({ url: trimmed, name: "Ảnh" });
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    if (showProductDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProductDropdown]);

  const filteredProducts = dsSanPham.filter(sp => 
    sp.id.toLowerCase().includes(productSearch.toLowerCase()) || 
    sp.tenSP.toLowerCase().includes(productSearch.toLowerCase())
  );
  
  const [phuTrachCat, setPhuTrachCat] = useState("");
  const [phuTrachSX, setPhuTrachSX] = useState("");
  const [phuTrachSoDo, setPhuTrachSoDo] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [ghiChuKyThuat, setGhiChuKyThuat] = useState("");
  const [trangThai, setTrangThai] = useState<TrangThaiLenhCat>("Nhap");
  const [phienBanDinhMuc, setPhienBanDinhMuc] = useState(1);

  // ============ Size Ratio & Màu sắc ============
  const [soMau, setSoMau] = useState(4);
  const [dsMau, setDsMau] = useState<MauVai[]>(Array.from({ length: 4 }).map(() => ({ 
    ten: "", maSKU: "", maVai: "", dinhMuc: 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: []
  })));

  // 3 bang size: co 3XL (5 size) + bo 3XL (4 size M-2XL) + bo M (4 size L-3XL)
  const [customPresets, setCustomPresets] = useState<SizeRatioPreset[]>(() => {
    return typeof window !== "undefined" ? loadCustomSizeRatioPresets() : [];
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");
  const [openAddSizeRatioModal, setOpenAddSizeRatioModal] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      loadSharedSizeRatioPresets().then((items) => {
        if (!active) return;
        setCustomPresets((prev) => {
          const combined = [...items];
          prev.forEach(p => {
            if (!combined.some(c => c.id === p.id)) combined.push(p);
          });
          return combined;
        });
      });
    };
    load();
    window.addEventListener("size-ratio-changed", load);
    return () => { 
      active = false; 
      window.removeEventListener("size-ratio-changed", load);
    };
  }, []);

  const allRatioPresets = useMemo(() => [
    ...SIZE_RATIO_5SIZE,
    ...SIZE_RATIO_4SIZE,
    ...SIZE_RATIO_4SIZE_L3XL,
    ...customPresets,
  ], [customPresets]);

  const [tiLeSize, setTiLeSize] = useState("1:2:2:1");

  const currentPreset = useMemo(() => {
    if (selectedPresetId) {
      const found = allRatioPresets.find((p) => p.id === selectedPresetId);
      if (found) return found;
    }
    // Đối chiếu theo sizes thực tế trong dsMau nếu có (ví dụ L-3XL vs M-2XL)
    const existingSizes = dsMau?.[0]?.phanBoSize?.map(p => p.size).filter(Boolean) || [];
    if (existingSizes.length > 0) {
      const matchedBySize = allRatioPresets.find(p => 
        (p.id === tiLeSize || p.label === tiLeSize || p.value === tiLeSize) &&
        p.sizes && p.sizes.length === existingSizes.length &&
        p.sizes.every((sz, i) => sz.toUpperCase() === existingSizes[i].toUpperCase())
      );
      if (matchedBySize) return matchedBySize;
    }
    return (
      allRatioPresets.find((p) => p.id === tiLeSize || p.label === tiLeSize) ||
      allRatioPresets.find((p) => p.value === tiLeSize) ||
      null
    );
  }, [selectedPresetId, allRatioPresets, tiLeSize, dsMau]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = allRatioPresets.find((p) => p.id === presetId);
    if (found) {
      setTiLeSize(found.value);
      // Cập nhật ngay lập tức dsMau với sizes và ratios của preset được chọn
      setDsMau((prev) => {
        return prev.map((mau) => {
          const totalRatio = found.ratios.reduce((a, b) => a + b, 0);
          const baseQty = (totalRatio > 0 && mau.slDuKien && mau.slDuKien > 0) 
            ? Math.floor(mau.slDuKien / totalRatio) 
            : 0;
          const newPhanBo = found.ratios.map((r, i) => ({
            size: found.sizes[i] || `Size ${i + 1}`,
            sl: baseQty * r,
          }));
          return { ...mau, phanBoSize: newPhanBo };
        });
      });
    }
  };

  const getCanhBaoTonKho = (mau: MauVai, maVai: string): string | null => {
    if (!maVai || !mau.slDuKien) return null;
    const vai = khoVaiReals.find((item) => item.maVT === maVai);
    if (!vai) return null;

    const dinhMucCungLoai =
      (mau.maVai === maVai ? mau.dinhMuc || 0 : 0)
      + (mau.maVaiQuan === maVai ? mau.dinhMucQuan || 0 : 0);
    const kgCan = mau.slDuKien * dinhMucCungLoai;
    const tonKho = vai.tonKho || 0;
    if (kgCan <= tonKho) return null;

    return `Tồn kho không đủ cho số lượng cắt màu ${mau.ten || "này"}. Vải ${vai.maMoi || vai.maVT} còn ${formatTonKhoVai(tonKho)} kg, cần ${formatTonKhoVai(kgCan)} kg, thiếu ${formatTonKhoVai(kgCan - tonKho)} kg.`;
  };

  const handleChonVai = (idx: number, maVai: string, phan: "ao" | "quan") => {
    if (!maVai) {
      setDsMau((prev) => prev.map((mau, mauIdx) => mauIdx === idx
        ? { ...mau, ...(phan === "quan" ? { maVaiQuan: "", donGiaVaiQuan: 0 } : { maVai: "", donGiaVai: 0 }) }
        : mau));
      return;
    }
    if (isKhoVaiLoading) {
      toast.error("Kho vải đang đồng bộ số lượng tồn. Vui lòng chọn lại sau ít giây.");
      return;
    }

    const vai = khoVaiReals.find((item) => item.maVT === maVai);
    if (!vai) {
      toast.error("Không tìm thấy mã vải trong dữ liệu tồn kho mới nhất. Vui lòng tải lại trang.");
      return;
    }

    const mauHienTai = dsMau[idx];
    const donGiaKho = vai.donGia || 0;
    const mauMoi: MauVai = {
      ...mauHienTai,
      ...(phan === "quan"
        ? { maVaiQuan: maVai, donGiaVaiQuan: donGiaKho }
        : { maVai, donGiaVai: donGiaKho }),
    };

    const dinhMuc = phan === "quan" ? mauHienTai.dinhMucQuan || 0 : mauHienTai.dinhMuc || 0;
    if (mauHienTai.slDuKien > 0 && dinhMuc > 0) {
      const canhBao = getCanhBaoTonKho(mauMoi, maVai);
      if (canhBao) {
        toast.error(canhBao);
        return;
      }
    }
    setDsMau((prev) => prev.map((mau, mauIdx) => mauIdx === idx ? mauMoi : mau));
    if (donGiaKho > 0) {
      const g3k = getChiTietGia3Khau(vai.maVT, donGiaKho, vai.tenVT, vai.mauSac);
      toast.success(
        `✅ Đã lấy đơn giá vải ${phan === "quan" ? "quần" : "áo"}: ${donGiaKho.toLocaleString('vi-VN')} đ/kg (Quy đổi 3 khâu: Sợi ${g3k.chiPhiSoi.toLocaleString()}đ + Dệt ${g3k.giaDet.toLocaleString()}đ + Nhuộm ${g3k.chiPhiNhuom.toLocaleString()}đ)`
      );
    } else {
      toast.warning(
        `⚠️ Vải ${vai.tenVT || vai.maVT} chưa có giá quy đổi từ 3 khâu (Sợi - Dệt - Nhuộm). Bạn có thể vào Kho Vải Thành Phẩm bấm Nhập để tính giá tự động.`
      );
    }
  };
  const [canhBaoTonKho, setCanhBaoTonKho] = useState<string[]>([]);

  // ============ AI Mockup state (MiniMax image-01) - tách riêng component ============
  const [aiMockupIdx, setAiMockupIdx] = useState<number | null>(null);

  // Tự chia size theo màu
  useEffect(() => {
    setDsMau(prev => {
      let changed = false;
      const next = prev.map(mau => {
        if (!mau.slDuKien || mau.slDuKien <= 0) return mau;
        
        let ratioParts = [1, 2, 2, 1];
        let sizes = (mau.phanBoSize && mau.phanBoSize.length > 0)
          ? mau.phanBoSize.map(p => p.size).filter(Boolean)
          : ["S", "M", "L", "XL"];
        
        const preset = currentPreset || (
          sizes.length > 0
            ? allRatioPresets.find(p => 
                p.value === tiLeSize && 
                p.sizes && p.sizes.length === sizes.length && 
                p.sizes.every((s, i) => s.toUpperCase() === sizes[i].toUpperCase())
              )
            : null
        ) || allRatioPresets.find(p => p.value === tiLeSize);

        if (preset) {
          ratioParts = preset.ratios;
          sizes = preset.sizes;
        } else if (tiLeSize === "0:1:2:2:1") {
          ratioParts = [1, 2, 2, 1];
          sizes = ["M", "L", "XL", "2XL"];
        } else if (tiLeSize === "1:2:2:2:1") {
          ratioParts = [1, 2, 2, 2, 1];
          sizes = ["S", "M", "L", "XL", "2XL"];
        } else {
          const parts = tiLeSize.split(":").map(Number).filter(n => Number.isFinite(n) && n >= 0);
          if (parts.length > 0) {
            ratioParts = parts;
            if (sizes.length !== parts.length) {
              if (parts.length === 5) sizes = ["M", "L", "XL", "2XL", "3XL"];
              else if (parts.length === 4) sizes = ["L", "XL", "2XL", "3XL"];
              else sizes = parts.map((_, i) => `S${i+1}`);
            }
          }
        }

        const totalRatio = ratioParts.reduce((a, b) => a + b, 0);
        const baseQty = totalRatio > 0 ? Math.floor(mau.slDuKien / totalRatio) : 0;

        // Chia đúng theo tỉ lệ cho MỌI size (không dồn phần lẻ vào size cuối làm phá tỉ lệ).
        // Nếu slDuKien không phải bội số của tổng tỉ lệ, phần lẻ hiển thị cảnh báo + gợi ý
        // số gần nhất (xem soLuongGoiY bên dưới) thay vì tự ý phá tỉ lệ.
        const newPhanBo = ratioParts.map((r, i) => ({ size: sizes[i] || `Size ${i+1}`, sl: baseQty * r }));

        // Kiểm tra xem phanBoSize có thay đổi không (CẢ size và số lượng)
        const isSame = mau.phanBoSize && 
          mau.phanBoSize.length === newPhanBo.length && 
          mau.phanBoSize.every((p, idx) => p.sl === newPhanBo[idx].sl && p.size === newPhanBo[idx].size);
        if (!isSame) changed = true;

        return { ...mau, phanBoSize: newPhanBo };
      });
      
      return changed ? next : prev;
    });
  }, [tiLeSize, currentPreset, allRatioPresets, dsMau]);

  // ============ Định mức áo/quần tự tính từ sơ đồ (PLT) ============
  // Công thức (a Sang chốt): Định mức (kg/SP) = Chiều dài sơ đồ (cm) ÷ 190 (cm/kg) ÷ Tổng SP trong 1 sơ đồ
  // Tổng SP trong 1 sơ đồ = tổng các phần của tỉ lệ size (VD 1:2:2:1 -> 6 SP/sơ đồ)
  const soSpTrongSoDo = useMemo(() => {
    const preset = currentPreset || allRatioPresets.find(p => p.value === tiLeSize);
    if (preset) return preset.ratios.reduce((a, b) => a + b, 0);
    const parts = tiLeSize.split(":").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
    return parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : 0;
  }, [currentPreset, allRatioPresets, tiLeSize]);
  const soSizeThucTe = useMemo(
    () => dsMau.reduce((max, mau) => Math.max(max, mau.phanBoSize?.length || 0), 0),
    [dsMau],
  );
  const soSPToiThieuMoiMau = Math.max(soSpTrongSoDo, soSizeThucTe);
  const tongSLToiThieu = Math.max(dsMau.length, soMau) * soSPToiThieuMoiMau;

  // Dữ liệu cũ có thể lưu tổng SL nhỏ hơn số màu × số size. Khi mở form sửa lệnh cũ,
  // chỉ hiệu chỉnh state để người dùng kiểm tra; chưa ghi DB cho tới khi bấm lưu.
  // Không can thiệp khi tạo lệnh cắt mới để người dùng tự do nhập số lượng mong muốn.
  useEffect(() => {
    if (!editing) return;
    if (hasAdjustedOldDataRef.current) return;
    if (!soSPToiThieuMoiMau || typeof tongSL !== "number" || tongSL >= tongSLToiThieu) return;
    hasAdjustedOldDataRef.current = true;
    setDsMau((prev) => prev.map((mau) => ({
      ...mau,
      slDuKien: Math.max(mau.slDuKien || 0, soSPToiThieuMoiMau),
    })));
    setTongSL(tongSLToiThieu);
  }, [editing, soSPToiThieuMoiMau, tongSL, tongSLToiThieu]);

  const dinhMucAoTuDong = useMemo(() => {
    const dai = parseFloat(daiSoDoAo);
    if (!dai || !soSpTrongSoDo) return 0;
    return dai / 190 / soSpTrongSoDo;
  }, [daiSoDoAo, soSpTrongSoDo]);

  const dinhMucQuanTuDong = useMemo(() => {
    const dai = parseFloat(daiSoDoQuan);
    if (!dai || !soSpTrongSoDo) return 0;
    return dai / 190 / soSpTrongSoDo;
  }, [daiSoDoQuan, soSpTrongSoDo]);

  // Tự áp định mức áo tính từ sơ đồ vào tất cả các màu (mỗi màu vẫn sửa tay được sau đó)
  useEffect(() => {
    if (!dinhMucAoTuDong) return;
    const rounded = Math.round(dinhMucAoTuDong * 10000) / 10000;
    setDsMau(prev => {
      let changed = false;
      const next = prev.map(mau => {
        if (mau.dinhMuc === rounded) return mau;
        changed = true;
        return { ...mau, dinhMuc: rounded };
      });
      return changed ? next : prev;
    });
  }, [dinhMucAoTuDong]);

  // Tự áp định mức quần tính từ sơ đồ vào tất cả các màu (Bộ)
  useEffect(() => {
    if (!dinhMucQuanTuDong) return;
    const rounded = Math.round(dinhMucQuanTuDong * 10000) / 10000;
    setDsMau(prev => {
      let changed = false;
      const next = prev.map(mau => {
        if (mau.dinhMucQuan === rounded) return mau;
        changed = true;
        return { ...mau, dinhMucQuan: rounded };
      });
      return changed ? next : prev;
    });
  }, [dinhMucQuanTuDong]);

  // Adjust soMau length
  // Removed redundant useEffect for soMau to prevent stale closure bugs on mount

  // Section 3 - Phụ liệu
  const [dsPhuLieu, setDsPhuLieu] = useState<LenhCatPhuLieu[]>([]);

  const themVatTuTheoMau = (mauIdx: number, apDungCho: "ao" | "quan") => {
    const vatTuMacDinh = khoPhuLieuReals[0];
    if (!vatTuMacDinh) {
      toast.error("Kho phụ liệu chưa có vật tư để chọn");
      return;
    }
    const soLuongMau = dsMau[mauIdx]?.slDuKien || 0;
    setDsPhuLieu((prev) => [...prev, {
      maPL: vatTuMacDinh.maVT,
      tenPL: vatTuMacDinh.tenVT,
      soLuong: soLuongMau,
      donGia: vatTuMacDinh.donGia || 1000,
      dvt: vatTuMacDinh.dvt || "cái",
      apDungCho,
      mauIdx,
    }]);
  };
  
  // Section 4 - Phân công
  const [mauCongDoan, setMauCongDoan] = useState<string>("");
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>([]);
  const visiblePhanCong = useMemo(() => {
    const filtered = getVisibleStages(phanCong, loaiSP, congDoanInTheu);
    return applyAutoGiaCong(filtered, maSP, tenSP, loaiSP);
  }, [phanCong, loaiSP, congDoanInTheu, maSP, tenSP]);
  const hasInTheuStage = Boolean(congDoanInTheu) && visiblePhanCong.some(stage => isInTheuStage(stage.tenCongDoan));
  const activeSoDoPhoi = (loaiSoDoPhoi === "quan" || loaiSoDoPhoi === "ca-hai") ? soDoPhoiQuan : (soDoPhoiAo || soDoPhoiQuan);
  
  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [newMauCD, setNewMauCD] = useState<{ id: string, ten: string, giaCong: any[] }>({ id: "", ten: "", giaCong: [] });
  const [customStepName, setCustomStepName] = useState("");

  const [showTaoMauChiPhi, setShowTaoMauChiPhi] = useState(false);
  const [newMauChiPhi, setNewMauChiPhi] = useState<{ id: string, ten: string, chiPhi: Record<string, number> }>({ id: "", ten: "", chiPhi: { "Cắt": 1600, "In/Thêu": 1500 } });
  const [customChiPhiName, setCustomChiPhiName] = useState("");
  
  // Chi Phí Cố Định
  const [chiPhiCoDinh, setChiPhiCoDinh] = useState<ChiPhiCoDinh>({});

  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    if (!editId && !draftLoaded) {
      if (!initialSP) {
        try {
          const saved = localStorage.getItem("lenhCatDraft");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.loaiLenh) setLoaiLenh(parsed.loaiLenh);
            if (parsed.khachHang) setKhachHang(parsed.khachHang);
            if (parsed.loaiSP) setLoaiSP(parsed.loaiSP);
            if (parsed.maSP) setMaSP(parsed.maSP);
            if (parsed.tenSP) setTenSP(parsed.tenSP);
            if (parsed.tongSL) setTongSL(parsed.tongSL);
            if (parsed.tongSLThucTe) setTongSLThucTe(parsed.tongSLThucTe);
            if (parsed.ngayBatDau) setNgayBatDau(parsed.ngayBatDau);
            if (parsed.sdtLienHe) setSdtLienHe(parsed.sdtLienHe);
            if (parsed.hanHoanThanh) setHanHoanThanh(parsed.hanHoanThanh);
            if (parsed.phuTrachCat) setPhuTrachCat(parsed.phuTrachCat);
            if (parsed.phuTrachSX) setPhuTrachSX(parsed.phuTrachSX);
            if (parsed.phuTrachSoDo) setPhuTrachSoDo(parsed.phuTrachSoDo);
            if (parsed.ghiChu) setGhiChu(parsed.ghiChu);
            if (parsed.ghiChuKyThuat) setGhiChuKyThuat(parsed.ghiChuKyThuat);
            if (parsed.tiLeSize) setTiLeSize(parsed.tiLeSize);
            if (parsed.selectedPresetId) setSelectedPresetId(parsed.selectedPresetId);
            if (parsed.soMau) setSoMau(parsed.soMau);
            if (parsed.dsMau && parsed.dsMau.length > 0) setDsMau(parsed.dsMau);
            if (parsed.dsPhuLieu && parsed.dsPhuLieu.length > 0) setDsPhuLieu(parsed.dsPhuLieu);
            if (parsed.mauCongDoan) setMauCongDoan(parsed.mauCongDoan);
            if (parsed.phanCong && parsed.phanCong.length > 0) setPhanCong(parsed.phanCong);
            if (parsed.chiPhiCoDinh) setChiPhiCoDinh(parsed.chiPhiCoDinh);
            if (parsed.soDoChinh) setSoDoChinh(parsed.soDoChinh);
            if (parsed.pdfSoDoChinh) setPdfSoDoChinh(parsed.pdfSoDoChinh);
            if (parsed.khoSoDoChinh) setKhoSoDoChinh(parsed.khoSoDoChinh);
            if (parsed.daiSoDoChinh) setDaiSoDoChinh(parsed.daiSoDoChinh);
            if (parsed.soDoPhoi) setSoDoPhoi(parsed.soDoPhoi);
            const phoiFiles = splitPhoiFiles(parsed.soDoPhoi);
            setSoDoPhoiAo(phoiFiles.ao);
            setSoDoPhoiQuan(phoiFiles.quan);
            if (parsed.loaiSoDoPhoi) {
              setLoaiSoDoPhoi(parsed.loaiSoDoPhoi);
            } else if (phoiFiles.ao && phoiFiles.quan) {
              setLoaiSoDoPhoi("ca-hai");
            } else if (phoiFiles.quan) {
              setLoaiSoDoPhoi("quan");
            } else if (phoiFiles.ao) {
              setLoaiSoDoPhoi("ao");
            } else if (parsed.soDoChinh || parsed.pdfSoDoPhoi) {
              setLoaiSoDoPhoi("ca-hai");
            }
            if (parsed.pdfSoDoPhoi) setPdfSoDoPhoi(parsed.pdfSoDoPhoi);
            if (parsed.khoSoDoPhoi) setKhoSoDoPhoi(parsed.khoSoDoPhoi);
            if (parsed.daiSoDoPhoi) setDaiSoDoPhoi(parsed.daiSoDoPhoi);
            if (parsed.ghiChuSoDoChinh) setGhiChuSoDoChinh(parsed.ghiChuSoDoChinh);
            if (parsed.ghiChuSoDoPhoi) setGhiChuSoDoPhoi(parsed.ghiChuSoDoPhoi);
            if (parsed.daCoSoDo) setDaCoSoDo(parsed.daCoSoDo);
            if (parsed.daiSoDoAo) setDaiSoDoAo(parsed.daiSoDoAo);
            const diagramAo = splitDiagramFiles(parsed.soDoAo);
            setSoDoAo(diagramAo.file);
            setHinhAnhSoDoAo(diagramAo.image);
            if (parsed.daiSoDoQuan) setDaiSoDoQuan(parsed.daiSoDoQuan);
            const diagramQuan = splitDiagramFiles(parsed.soDoQuan);
            setSoDoQuan(diagramQuan.file);
            setHinhAnhSoDoQuan(diagramQuan.image);
            if (parsed.hinhMauInTheu) setHinhMauInTheu(parsed.hinhMauInTheu);
            if (parsed.fileGocInTheu) setFileGocInTheu(parsed.fileGocInTheu);
            if (parsed.ghiChuInTheu) setGhiChuInTheu(parsed.ghiChuInTheu);
            
            if (parsed.phanCong) {
              const inTheuItem = getInTheuStage(parsed.phanCong);
              if (inTheuItem) {
                setCongDoanInTheu((IN_THEU_OPTIONS.find(option => inTheuItem.tenCongDoan?.toLowerCase().includes(option.toLowerCase())) || "In") as InTheuOption);
                if (inTheuItem.id === "in_theu_ao") setLoaiInTheu("ao");
                else if (inTheuItem.id === "in_theu_quan") setLoaiInTheu("quan");
                else setLoaiInTheu("bo");
              }
            }
          }
        } catch (e) {
          console.error("Lỗi tải nháp", e);
        }
      }
      setDraftLoaded(true);
    }
  }, [editId, draftLoaded, initialSP]);

  useEffect(() => {
    if (!editId && draftLoaded) {
      localStorage.setItem("lenhCatDraft", JSON.stringify({
        loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe,
        ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, phuTrachSoDo, ghiChu, ghiChuKyThuat,
        tiLeSize, selectedPresetId, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh,
        loaiSoDoPhoi,
        daiSoDoAo, soDoAo: JSON.stringify({ file: soDoAo, image: hinhAnhSoDoAo }), daiSoDoQuan, soDoQuan: JSON.stringify({ file: soDoQuan, image: hinhAnhSoDoQuan }),
        soDoChinh, pdfSoDoChinh, khoSoDoChinh, daiSoDoChinh,
        soDoPhoi: JSON.stringify({ ao: soDoPhoiAo, quan: soDoPhoiQuan }), pdfSoDoPhoi, khoSoDoPhoi, daiSoDoPhoi, ghiChuSoDoChinh, ghiChuSoDoPhoi, daCoSoDo,
        hinhMauInTheu, fileGocInTheu, ghiChuInTheu,
      }));
    }
  }, [loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe, ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, phuTrachSoDo, ghiChu, ghiChuKyThuat, tiLeSize, selectedPresetId, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh, loaiSoDoPhoi, daiSoDoAo, soDoAo, hinhAnhSoDoAo, daiSoDoQuan, soDoQuan, hinhAnhSoDoQuan, soDoChinh, pdfSoDoChinh, khoSoDoChinh, daiSoDoChinh, soDoPhoiAo, soDoPhoiQuan, pdfSoDoPhoi, khoSoDoPhoi, daiSoDoPhoi, ghiChuSoDoChinh, ghiChuSoDoPhoi, daCoSoDo, hinhMauInTheu, fileGocInTheu, ghiChuInTheu, editId, draftLoaded]);

  // Sync default phanCong and chiPhiCoDinh when templates are loaded
  useEffect(() => {
    if (editId) return; // Không ghi đè khi đang sửa lệnh cắt đã có
    if (dsMauCongDoan.length > 0 && (!phanCong || phanCong.length === 0)) {
      const templateId = getTemplateIdForProduct(loaiSP);
      const defaultCD = dsMauCongDoan.find(x => x.id === templateId) || dsMauCongDoan.find(x => x.id === "MCD-AO-TRON") || dsMauCongDoan[0];
      if (defaultCD) {
        setMauCongDoan(defaultCD.id);
        setPhanCong(applyAutoGiaCong(defaultCD.giaCong, maSP, tenSP, loaiSP));
      }
    }
  }, [dsMauCongDoan, phanCong, editId, loaiSP, maSP, tenSP]);

  useEffect(() => {
    if (editId) return; // Không ghi đè khi đang sửa lệnh cắt đã có
    if (dsMauCongDoan.length === 0) return;
    const templateId = getTemplateIdForProduct(loaiSP);
    const template = dsMauCongDoan.find(item => item.id === templateId);
    if (template && template.id !== mauCongDoan) {
      setMauCongDoan(template.id);
      setPhanCong(applyAutoGiaCong(template.giaCong, maSP, tenSP, loaiSP));
    }
  }, [loaiSP, dsMauCongDoan, editId, maSP, tenSP]);

  // Tự động phân công xưởng theo mã M01..M15 hoặc mặc định khi người dùng chọn/nhập Mã SP
  useEffect(() => {
    if (!maSP && !tenSP) return;
    setPhanCong(prev => {
      if (!prev || prev.length === 0) return prev;
      const updated = applyAutoGiaCong(prev, maSP, tenSP, loaiSP);
      const changed = updated.some((u, idx) => u.nguoiMa !== prev[idx]?.nguoiMa || u.donGia !== prev[idx]?.donGia);
      return changed ? updated : prev;
    });
  }, [maSP, tenSP, loaiSP]);

  useEffect(() => {
    if (!editId) {
      // Khi user chưa lưu nháp phần chi phí, và chuyển loaiSP -> tự động reset chi phí theo bảng
      setChiPhiCoDinh(BANG_CHI_PHI_CO_DINH[loaiSP] || {});
    }
  }, [loaiSP, editId]);

  // Cảnh báo tồn kho
  useEffect(() => {
    const alerts: string[] = [];
    // Mock inventory check logic (Giả sử tồn kho mỗi loại vải là 50kg, mỗi loại phụ liệu là 1000 cái)
    // Trong thực tế sẽ lấy từ KHO_VAI.tonKho
    dsMau.forEach((m, i) => {
      if (m.maVai && m.slDuKien && m.dinhMuc) {
        const req = m.slDuKien * m.dinhMuc;
        // Lấy từ khoVaiReals
        const v = khoVaiReals.find((x) => x.maVT === m.maVai);
        const tonKhoThuc = v?.tonKho ?? 0;
        if (req > tonKhoThuc) {
          alerts.push(`Thiếu vải Màu ${i+1} (${v?.tenVT || m.maVai}): Cần ${req}kg, chỉ còn ${tonKhoThuc}kg`);
        }
      }
    });

    dsPhuLieu.forEach((p) => {
      if (p.maPL && p.soLuong) {
        const v = khoPhuLieuReals.find(x => x.maVT === p.maPL);
        const tonKhoThuc = v ? (v.tonKho || 1000) : 1000;
        if (p.soLuong > tonKhoThuc) {
          alerts.push(`Thiếu phụ liệu ${p.tenPL}: Cần ${p.soLuong}, chỉ còn ${tonKhoThuc}`);
        }
      }
    });

    setCanhBaoTonKho(alerts);
  }, [dsMau, dsPhuLieu, khoVaiReals, khoPhuLieuReals]);

  const [uploadingColor, setUploadingColor] = useState<{ idx: number; phan: "ao" | "quan" } | null>(null);

  // Tải ảnh mẫu cho 1 màu. Hàng Bộ có 2 ảnh riêng: ÁO (img) và QUẦN (imgQuan).
  const handleColorImageUpload = (idx: number, phan: "ao" | "quan" = "ao") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. Hiển thị ngay ảnh preview tạm thời (0ms delay) để người dùng thấy ảnh lập tức
      const localPreviewUrl = URL.createObjectURL(file);
      setDsMau(prev => {
        const next = [...prev];
        next[idx] = phan === "quan"
          ? { ...next[idx], imgQuan: localPreviewUrl }
          : { ...next[idx], img: localPreviewUrl };
        return next;
      });

      // 2. Báo trạng thái upload
      setUploadingColor({ idx, phan });
      const toastId = toast.loading(`Đang tải ảnh ${phan === "quan" ? "quần" : "áo"} ${dsMau[idx]?.ten || ""}...`);

      try {
        const permanentUrl = await uploadProductFile(file, phan === "quan" ? "mau-quan" : "mau-ao");
        setDsMau(prev => {
          const next = [...prev];
          next[idx] = phan === "quan"
            ? { ...next[idx], imgQuan: permanentUrl }
            : { ...next[idx], img: permanentUrl };
          return next;
        });
        toast.success(`Đã tải xong ảnh ${phan === "quan" ? "quần" : "áo"}!`, { id: toastId });
      } catch (err: any) {
        toast.error(err instanceof Error ? err.message : "Không upload được ảnh", { id: toastId });
      } finally {
        setUploadingColor(null);
      }
    };
    input.click();
  };

  // ============ AI Mockup handlers (MiniMax image-01) ============
  const openAiMockup = (idx: number) => {
    setAiMockupIdx(idx);
  };

  const applyAIMockup = (url: string) => {
    if (aiMockupIdx === null) return;
    setDsMau(prev => {
      const next = [...prev];
      next[aiMockupIdx] = { ...next[aiMockupIdx], img: url };
      return next;
    });
  };

  const buildAiPrompt = (idx: number): string => {
    const loaiText = loaiSP === "BoTru" ? "bộ trụ" : "áo polo";
    const colorText = dsMau[idx]?.ten || "";
    if (tenSP) {
      return `${tenSP} ${loaiText} màu ${colorText}, may mặc Việt Nam, chất liệu cotton, studio lighting, nền trắng`;
    }
    return `mockup sản phẩm may mặc ${loaiText} màu ${colorText}, studio lighting, nền trắng`;
  };


  // ============ Calculate Auto Values ============
  const validTongSL = (tongSL || 1) as number;
  
  let tongTienVai = 0;
  dsMau.forEach(m => {
    if (m.maVai && m.slDuKien && m.dinhMuc) {
      const v = khoVaiReals.find((x: any) => x.maVT === m.maVai);
      const donGia = (m.donGiaVai !== undefined && m.donGiaVai !== null && m.donGiaVai > 0)
        ? m.donGiaVai
        : (v ? (v.donGia || 0) : 0);
      tongTienVai += m.slDuKien * m.dinhMuc * donGia;
    }
    if (isBo && m.maVaiQuan && m.slDuKien && m.dinhMucQuan) {
      const vQuan = khoVaiReals.find((x: any) => x.maVT === m.maVaiQuan);
      const donGiaQuan = (m.donGiaVaiQuan !== undefined && m.donGiaVaiQuan !== null && m.donGiaVaiQuan > 0)
        ? m.donGiaVaiQuan
        : (vQuan ? (vQuan.donGia || 0) : 0);
      tongTienVai += m.slDuKien * m.dinhMucQuan * donGiaQuan;
    }
  });

  const tongTienPhuLieu = dsPhuLieu.reduce((s, p) => s + p.soLuong * p.donGia, 0);
  
  let giaCong1SP = 0;
  visiblePhanCong.forEach((kh: any) => {
    if (kh && kh.donGia) giaCong1SP += kh.donGia;
  });

  const tongChiPhiCoDinh = Object.values(chiPhiCoDinh).reduce((a, b) => a + b, 0);
  const validTongSL_Colors = Math.max(1, dsMau.reduce((s, m) => s + (m.slDuKien || 0), 0));
  const binhQuanVai = tongTienVai / validTongSL_Colors;
  const giaVonBinhQuan = binhQuanVai + (tongTienPhuLieu / validTongSL) + giaCong1SP + tongChiPhiCoDinh;

  // ============ IN PHIẾU LỆNH CẮT & KIỂM ĐẾM CHUẨN A4 ============
  const currentPrintData = useMemo(() => ({
    id: editing?.id || `LC-${new Date().getFullYear()}-0001`,
    maSP,
    tenSP,
    loaiSP,
    loaiLenh,
    khachHang,
    tongSL: Number(tongSL || 0),
    tongSLThucTe: tongSLThucTe !== "" ? Number(tongSLThucTe) : undefined,
    tiLeSize,
    hanHoanThanh,
    ngayTao: ngayBatDau || editing?.ngayTao || new Date().toISOString(),
    phuTrachCat: nguoiPhuTrachCat || editing?.phuTrachCat,
    phuTrachSX: nhanVienOptions.find(n => n.ma === phuTrachSX)?.ten || phuTrachSX,
    ghiChuKyThuat,
    ghiChu,
    dsMau,
    phanCong: visiblePhanCong || phanCong,
    daiSoDoChinh,
    khoSoDoChinh,
    daiSoDoPhoi,
    khoSoDoPhoi,
    hinhAnhDaiDien: (dsMau.find(m => m.img)?.img) || undefined,
  }), [
    editing, maSP, tenSP, loaiSP, loaiLenh, khachHang, tongSL, tongSLThucTe,
    tiLeSize, hanHoanThanh, ngayBatDau, nguoiPhuTrachCat, nhanVienOptions,
    phuTrachSX, ghiChuKyThuat, ghiChu, dsMau, visiblePhanCong, phanCong,
    daiSoDoChinh, khoSoDoChinh, daiSoDoPhoi, khoSoDoPhoi
  ]);

  // Checklist bắt buộc trước khi "Hoàn tất lệnh" (NHÁP -> ĐÃ TẠO LỆNH).
  // Trả về danh sách các mục còn thiếu (rỗng = đủ điều kiện).
  const validateLenhCatDayDu = (): string[] => {
    const thieu: string[] = [];
    if (!maSP || !tenSP) thieu.push("Sản phẩm (Mã SP/Tên SP - chọn từ Danh mục sản phẩm)");
    if (!dsMau || dsMau.length === 0 || dsMau.every(m => !m.ten && !m.maSKU)) thieu.push("Màu (chưa nhập màu nào)");
    if (!soSpTrongSoDo || soSpTrongSoDo <= 0) thieu.push("Tỉ lệ size");
    if (!daiSoDoAo || (isBo && !daiSoDoQuan)) thieu.push(`Sơ đồ ${!daiSoDoAo ? "áo" : "quần"} (chưa nhập chiều dài sơ đồ)`);
    if (dsMau.some(m => !m.dinhMuc || m.dinhMuc <= 0) || (isBo && dsMau.some(m => !m.dinhMucQuan || m.dinhMucQuan <= 0))) thieu.push("Định mức (còn màu chưa có định mức áo/quần)");
    if (dsMau.some(m => !m.maVai) || (isBo && dsMau.some(m => !m.maVaiQuan))) thieu.push("Vải (còn màu chưa chọn mã vải áo/quần)");
    dsMau.forEach((mau) => {
      const cacMaVai = [...new Set(
        [mau.maVai, isBo ? mau.maVaiQuan : ""].filter((maVai): maVai is string => Boolean(maVai)),
      )];
      cacMaVai.forEach((maVai) => {
        const canhBao = getCanhBaoTonKho(mau, maVai);
        if (canhBao) thieu.push(canhBao);
      });
    });
    if (!dsPhuLieu || dsPhuLieu.length === 0) thieu.push("Vật tư/phụ liệu (chưa thêm khoản mục nào)");
    const tongSLMau = dsMau.reduce((s, m) => s + (m.slDuKien || 0), 0);
    if (soSpTrongSoDo > 0 && Number(tongSL) < tongSLToiThieu) {
      thieu.push(`Tổng SL dự kiến tối thiểu là ${tongSLToiThieu} SP (${dsMau.length} màu × ${soSpTrongSoDo} SP/màu theo tỷ lệ ${tiLeSize})`);
    }
    if (soSPToiThieuMoiMau > 0 && dsMau.some(m => (m.slDuKien || 0) < soSPToiThieuMoiMau)) {
      thieu.push(`Mỗi màu phải có tối thiểu ${soSPToiThieuMoiMau} SP cho ${soSizeThucTe || tiLeSize.split(":").length} size`);
    }
    if (soSpTrongSoDo > 0 && dsMau.some(m => (m.slDuKien || 0) % soSpTrongSoDo !== 0)) {
      thieu.push(`Số lượng từng màu phải là bội số của ${soSpTrongSoDo} để giữ đúng tỷ lệ ${tiLeSize}`);
    }
    if (!tongSL || dsMau.some(m => !m.slDuKien || m.slDuKien <= 0) || tongSLMau !== Number(tongSL)) thieu.push(`Số lượng (tổng SL từng màu = ${tongSLMau}, chưa khớp Tổng SL dự kiến = ${tongSL || 0})`);
    if (!phuTrachSX && !phuTrachCat) thieu.push("Người phụ trách sản xuất");
    return thieu;
  };

  const getCongDoanChuaPhanCong = (): string[] => visiblePhanCong
    .filter((congDoan) => !congDoan.nguoiMa?.trim())
    .map((congDoan) => congDoan.tenCongDoan);

  const getCongDoanChuaDonGia = (): string[] => visiblePhanCong
    .filter((congDoan) => !Number.isFinite(Number(congDoan.donGia)) || Number(congDoan.donGia) <= 0)
    .map((congDoan) => congDoan.tenCongDoan);

  const handleSave = async (status: TrangThaiLenhCat) => {
    if (uploadingColor) {
      toast.info("Ảnh đang được tải lên, vui lòng đợi trong giây lát rồi bấm lưu...");
      return;
    }
    if (editing?.trangThai === "ChuyenTiep") {
      toast.error("Lệnh cắt đã chuyển khâu, chỉ được phép xem");
      return;
    }
    if (!maSP || !tenSP || !tongSL) {
      toast.error("Vui lòng điền đầy đủ Mã SP, Tên SP và Tổng SL!");
      return;
    }

    if (status === "ChuyenTiep") {
      const congDoanChuaPhanCong = getCongDoanChuaPhanCong();
      const congDoanChuaDonGia = getCongDoanChuaDonGia();
      if (congDoanChuaPhanCong.length > 0 || congDoanChuaDonGia.length > 0) {
        const chiTietThieu = [
          congDoanChuaPhanCong.length > 0
            ? `Chưa gắn người phụ trách: ${congDoanChuaPhanCong.join(", ")}`
            : "",
          congDoanChuaDonGia.length > 0
            ? `Chưa có bảng giá công đoạn: ${congDoanChuaDonGia.join(", ")}`
            : "",
        ].filter(Boolean);
        toast.error(`Chưa thể chuyển khâu. Bạn có thể "Hoàn tất lệnh" hoặc "Lưu nháp" để bổ sung sau:\n• ${chiTietThieu.join("\n• ")}`);
        return;
      }
    }

    if (status === "DaTao" || status === "ChuyenTiep") {
      const thieu = validateLenhCatDayDu();
      if (thieu.length > 0) {
        toast.error(`Chưa đủ điều kiện hoàn tất lệnh, còn thiếu:\n• ${thieu.join("\n• ")}`);
        return;
      }
    }

    const cogsData = {
      tongTienVai,
      tongTienPhuLieu,
      giaCong1SP,
      tongChiPhiCoDinh,
      giaVonBinhQuan
    };

    const finalDsMau = dsMau.map(m => {
      const vAo = m.maVai ? khoVaiReals.find(x => x.maVT === m.maVai) : null;
      const vQuan = m.maVaiQuan ? khoVaiReals.find(x => x.maVT === m.maVaiQuan) : null;
      return {
        ...m,
        donGiaVai: (m.donGiaVai && m.donGiaVai > 0) ? m.donGiaVai : (vAo?.donGia || 0),
        donGiaVaiQuan: (m.donGiaVaiQuan && m.donGiaVaiQuan > 0) ? m.donGiaVaiQuan : (vQuan?.donGia || 0),
        dinhMucQuan: (m.dinhMucQuan && m.dinhMucQuan > 0) ? m.dinhMucQuan : (isBo ? 0.18 : 0),
        phanBoSizeQuan: (m.phanBoSizeQuan && m.phanBoSizeQuan.length > 0) ? m.phanBoSizeQuan : (isBo ? (m.phanBoSize || []).map(s => ({ ...s })) : undefined),
      };
    });

    const catStage = phanCong.find(x => x.tenCongDoan?.toLowerCase().includes("cắt") || x.tenCongDoan?.toLowerCase().includes("cat"));
    const actualPhuTrachCat = catStage?.nguoiMa || phuTrachCat || "";

    if (editing) {
      try {
      await suaLenhCat(editing.id, {
        loaiLenh,
        khachHang: loaiLenh === "HangDat" ? khachHang : undefined,
        loaiSP,
        maSP,
        tenSP,
        tongSL: Number(tongSL) || 0,
        tongSLThucTe: Number(tongSLThucTe) || undefined,
        hanHoanThanh,
        tiLeSize,
        dsMau: finalDsMau,
        dsPhuLieu,
        mauCongDoan,
        phanCong: visiblePhanCong,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachCat: actualPhuTrachCat,
        phuTrachSX,
        phuTrachSoDo,
        ghiChu,
        ghiChuKyThuat,
        trangThai: (editing && status === "Nhap" && editing.trangThai && editing.trangThai !== "Nhap")
          ? editing.trangThai
          : status,
        ngayTao: ngayBatDau,
        loaiSoDoPhoi,
        daiSoDoAo,
        soDoAo: JSON.stringify({ file: soDoAo, image: hinhAnhSoDoAo }),
        daiSoDoQuan,
        soDoQuan: JSON.stringify({ file: soDoQuan, image: hinhAnhSoDoQuan }),
        soDoChinh,
        pdfSoDoChinh,
        khoSoDoChinh,
        daiSoDoChinh,
        soDoPhoi: JSON.stringify({ ao: soDoPhoiAo, quan: soDoPhoiQuan }),
        pdfSoDoPhoi,
        khoSoDoPhoi,
        daiSoDoPhoi,
        ghiChuSoDoChinh,
        ghiChuSoDoPhoi,
        daCoSoDo,
        hinhMauInTheu,
        fileGocInTheu,
        ghiChuInTheu,
      }, user || getFallbackUser());
      toast.success(`Đã cập nhật Lệnh Cắt ${editing.id} với trạng thái: ${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}`);
      // Tự động đồng bộ hình ảnh & dsMau sang Kế hoạch sản xuất tương ứng
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          await supabase.from("khsx").update({ dsMau }).or(`lenhCatId.eq.${editing.id},maSP.eq.${maSP}`);
        }
      } catch (e) {
        console.warn("Lỗi đồng bộ dsMau sang khsx:", e);
      }
      } catch (err: any) {
        toast.error("Lỗi khi cập nhật: " + (err?.message || err));
        return; // Dừng lại, không đóng modal nếu Supabase lỗi
      }
    } else {
      // Dùng generateLenhCatId (max số hiện có + 1) thay vì dsLenhCat.length + 1:
      // đếm theo length sẽ sinh mã TRÙNG với lệnh đang tồn tại ngay khi có 1 lệnh
      // cũ bị xóa ở giữa (VD xóa 0002 trong 0001-0003 -> length=2 -> sinh lại 0003),
      // và themLenhCat upsert theo id nên sẽ GHI ĐÈ mất lệnh cũ.
      const newId = generateLenhCatId(dsLenhCat);
      try {
      await themLenhCat({
        id: newId,
        loaiLenh,
        khachHang: loaiLenh === "HangDat" ? khachHang : undefined,
        loaiSP,
        maSP,
        tenSP,
        tongSL: Number(tongSL) || 0,
        tongSLThucTe: Number(tongSLThucTe) || undefined,
        hanHoanThanh,
        tiLeSize,
        dsMau: finalDsMau,
        dsPhuLieu,
        mauCongDoan,
        phanCong: visiblePhanCong,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachCat: actualPhuTrachCat,
        phuTrachSX,
        phuTrachSoDo,
        ghiChu,
        ghiChuKyThuat,
        trangThai: status,
        phienBanDinhMuc: 1,
        ngayTao: ngayBatDau,
        loaiSoDoPhoi,
        daiSoDoAo,
        soDoAo: JSON.stringify({ file: soDoAo, image: hinhAnhSoDoAo }),
        daiSoDoQuan,
        soDoQuan: JSON.stringify({ file: soDoQuan, image: hinhAnhSoDoQuan }),
        soDoChinh,
        pdfSoDoChinh,
        khoSoDoChinh,
        daiSoDoChinh,
        soDoPhoi: JSON.stringify({ ao: soDoPhoiAo, quan: soDoPhoiQuan }),
        pdfSoDoPhoi,
        khoSoDoPhoi,
        daiSoDoPhoi,
        ghiChuSoDoChinh,
        ghiChuSoDoPhoi,
        daCoSoDo,
        hinhMauInTheu,
        fileGocInTheu,
        ghiChuInTheu,
        nguoiTao: user?.name || "Nguyễn Thị Ngọc Giàu"
      }, user || getFallbackUser());
      } catch (e: any) {
        // Giữ nguyên modal + dữ liệu đang nhập để không mất công nhập lại.
        toast.error(e?.message || "Không tạo được lệnh cắt. Vui lòng thử lại.");
        return;
      }

      toast.success(`Đã tạo thành công Lệnh Cắt mới: ${newId} với trạng thái: ${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}`);
      // Tự động đồng bộ dsMau sang Kế hoạch sản xuất tương ứng
      try {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          await supabase.from("khsx").update({ dsMau, lenhCatId: newId }).eq("maSP", maSP);
        }
      } catch (e) {
        console.warn("Lỗi đồng bộ dsMau sang khsx:", e);
      }
      localStorage.removeItem("lenhCatDraft");
    }
    onClose();
  };

  const handleInPhieuGiaCong = () => {
    if (!maSP || !tenSP) {
      toast.error("Vui lòng nhập Mã SP / Tên SP trước khi in phiếu");
      return;
    }
    setPrintModalOpen(true);
  };

  const handleShareZaloItem = async (item: PhanCongGiaCong[number]) => {
    const lines = [
      `📋 Phân công gia công - ${tenSP || maSP}`,
      `Công đoạn: ${item.tenCongDoan}`,
      `Số lượng: ${item.soLuong ?? 0} × ${(item.donGia ?? 0).toLocaleString("vi-VN")}đ = ${(item.thanhTien ?? 0).toLocaleString("vi-VN")}đ`,
      `Hạn giao: ${hanHoanThanh}`,
      ghiChuKyThuat ? `Yêu cầu kỹ thuật: ${ghiChuKyThuat}` : "",
    ].filter(Boolean).join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      toast.success(`Đã sao chép nội dung gửi cho ${item.nguoiTen}. Dán vào Zalo để gửi.`);
    } catch {
      toast.error("Không sao chép được, trình duyệt chặn clipboard");
    }

    const doiTac = item.loaiNguoi === "xuong_ngoai" ? DOI_TAC_GIA_CONG.find(d => d.ma === item.nguoiMa) : null;
    const sdt = doiTac?.sdt;
    if (sdt) {
      window.open(`https://zalo.me/${sdt.replace(/\D/g, "")}`, "_blank");
    }
    setZaloPickerOpen(false);
  };

  if (!isOpen) return null;

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={onClose}
      maxWidth="full"
      className="bg-[#2B4C3E] text-white overflow-hidden"
      overlayClassName="bg-black/60 backdrop-blur-sm"
      fullScreenMobile={true}
    >
      <div className="w-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-50 flex flex-wrap md:flex-nowrap justify-between items-start md:items-center gap-3 md:gap-4 px-4 md:px-5 py-3 md:py-3.5 bg-[#2B4C3E] border-b border-white/10 shrink-0 shadow-sm w-full overflow-hidden">
          <div className="flex items-center gap-3 min-w-0 w-full md:w-auto flex-1">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 md:w-4.5 md:h-4.5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-bold text-sm md:text-base leading-tight truncate">Tạo Lệnh Cắt Sản Xuất</h2>
              <p className="text-white/60 text-[10px] md:text-xs font-mono truncate">{editId || "LC-" + new Date().getFullYear() + "-XXXX"}</p>
            </div>
            <button onClick={onClose} className="md:hidden p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors shrink-0 ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-2 items-center shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-white/10 pt-2 md:border-0 md:pt-0">
            <span className="bg-white/10 text-white/80 text-[10px] md:text-xs px-2.5 py-1 md:px-3 md:py-1.5 rounded-full font-medium">
              Version BOM: {phienBanDinhMuc}.0
            </span>
            <button onClick={onClose} className="hidden md:block p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLocked && activeEditor && (
          <div className="bg-red-500 text-white px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 border-b border-red-600">
            <AlertTriangle className="w-5 h-5" />
            Lệnh cắt này đang được chỉnh sửa bởi {activeEditor}. Bạn chỉ có thể xem và không thể lưu đè.
          </div>
        )}

        <div className="w-full bg-[#F4F1EA] p-3 md:p-6 pb-8 flex flex-col gap-4 text-slate-900">
          
          {/* CẢNH BÁO TỒN KHO */}
          {canhBaoTonKho.length > 0 && (
            <div className="bg-rose-100 p-3 flex flex-col gap-1 border-l-4 border-rose-500 text-rose-800 text-sm">
              <div className="font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Cảnh báo vật tư thiếu hụt:</div>
              <ul className="list-disc pl-6">
                {canhBaoTonKho.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {/* KHỐI 1: THÔNG TIN CHUNG & KẾ HOẠCH (HIỆN ĐẠI HÓA CHUYÊN NGHIỆP) */}
          <div className="order-1 bg-white p-5 md:p-6 rounded-2xl border border-slate-200/90 shadow-sm relative space-y-5">
            {/* Header: Title + Mã Lệnh Cắt Badge + Segmented Pill Toggle (Hàng Nhà / Hàng Đặt) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2B4C3E]/10 flex items-center justify-center text-[#2B4C3E] shrink-0">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base md:text-lg font-black text-[#2B4C3E] uppercase tracking-wide">
                      THÔNG TIN CHUNG & KẾ HOẠCH
                    </h2>
                    <span className="px-2.5 py-0.5 bg-[#2B4C3E] text-white rounded-md text-xs font-mono font-bold tracking-wider shadow-xs">
                      {editId || "LC-" + new Date().getFullYear() + "-XXXX"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Thiết lập sản phẩm, thời gian triển khai và sản lượng cắt dự kiến</p>
                </div>
              </div>

              {/* Segmented Control: Hàng Nhà vs Hàng Đặt */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start lg:self-auto">
                <button
                  type="button"
                  onClick={() => setLoaiLenh("HangNha")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                    loaiLenh === "HangNha"
                      ? "bg-[#2B4C3E] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🏠</span>
                  <span>Hàng Nhà (Nội bộ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoaiLenh("HangDat")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                    loaiLenh === "HangDat"
                      ? "bg-[#2B4C3E] text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>🛒</span>
                  <span>Hàng Đặt (Khách/Gia công)</span>
                </button>
              </div>
            </div>

            {/* PHẦN A: CHỌN NHANH TỪ DANH MỤC SP (Đưa lên đầu để nhân sự thao tác liền mạch) */}
            <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <label className="text-xs md:text-sm font-bold text-blue-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Chọn nhanh từ danh mục sản phẩm ({dsSanPham.length} sản phẩm)</span>
                </label>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  💡 Tự động điền Mã, Tên, Phân loại, Tỉ lệ size & Phối màu
                </span>
              </div>
              
              <div className="relative" ref={dropdownRef}>
                <div 
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-blue-200/90 rounded-xl cursor-pointer flex justify-between items-center hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-blue-950 shadow-xs"
                  onClick={() => setShowProductDropdown(!showProductDropdown)}
                >
                  <span className="truncate flex-1 pr-2 text-sm">
                    {maSP ? (
                      <span className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold text-xs">{maSP}</span>
                        <span className="font-bold text-slate-800">{tenSP}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">-- Bấm để tìm & chọn sản phẩm có sẵn từ danh mục --</span>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {maSP && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaSP("");
                          setTenSP("");
                          setProductSearch("");
                          setShowProductDropdown(false);
                          toast.info("Đã xóa chọn sản phẩm danh mục");
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Xóa chọn sản phẩm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showProductDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-blue-200 rounded-xl shadow-2xl z-[100] max-h-80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b bg-slate-50 shrink-0">
                      <input 
                        autoFocus
                        type="text" 
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        placeholder="Gõ mã hoặc tên SP để tìm kiếm..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                      {filteredProducts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Không tìm thấy sản phẩm nào phù hợp.</div>
                      ) : (
                        filteredProducts.map(sp => {
                          const imgUrl = sp.hinhAnh || sp.dsMau?.[0]?.img || "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image";
                          return (
                            <div 
                              key={sp.id} 
                              className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${maSP === sp.id ? 'bg-blue-50/80' : 'hover:bg-slate-50'}`}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setShowProductDropdown(false);
                                setMaSP(sp.id || "");
                                setTenSP(sp.tenSP || "");
                                if (sp.loaiSP) setLoaiSP(sp.loaiSP);
                                if (sp.tiLeSize) {
                                  setTiLeSize(sp.tiLeSize);
                                  let initSizes: string[] = [];
                                  try {
                                    const parsedDs = typeof sp.dsMau === "string" ? JSON.parse(sp.dsMau) : sp.dsMau;
                                    initSizes = parsedDs?.[0]?.phanBoSize?.map((p: any) => p.size).filter(Boolean) || [];
                                  } catch {}

                                  let matchPreset: SizeRatioPreset | undefined;
                                  if (initSizes.length > 0) {
                                    matchPreset = allRatioPresets.find(p => 
                                      (p.id === sp.tiLeSize || p.label === sp.tiLeSize || p.value === sp.tiLeSize) &&
                                      p.sizes && p.sizes.length === initSizes.length &&
                                      p.sizes.every((s, i) => s.toUpperCase() === initSizes[i].toUpperCase())
                                    );
                                  }
                                  if (!matchPreset) {
                                    matchPreset = allRatioPresets.find(p => p.id === sp.tiLeSize || p.label === sp.tiLeSize);
                                  }
                                  if (!matchPreset && initSizes.length > 0) {
                                    matchPreset = allRatioPresets.find(p => 
                                      p.sizes && p.sizes.length === initSizes.length &&
                                      p.sizes.every((sz, i) => sz.toUpperCase() === initSizes[i].toUpperCase())
                                    );
                                  }
                                  if (!matchPreset) {
                                    matchPreset = allRatioPresets.find(p => p.value === sp.tiLeSize);
                                  }
                                  if (matchPreset) setSelectedPresetId(matchPreset.id);
                                  else setSelectedPresetId("");
                                }
                                try {
                                  let dsMauToSet = sp.dsMau;
                                  if (typeof dsMauToSet === 'string') {
                                    dsMauToSet = JSON.parse(dsMauToSet);
                                  }
                                  if (Array.isArray(dsMauToSet) && dsMauToSet.length > 0) {
                                    setSoMau(dsMauToSet.length);
                                    setDsMau(dsMauToSet.map((m) => ({
                                      ten: m.ten || "",
                                      maSKU: m.maSKU || "",
                                      dinhMuc: m.dinhMuc || 0.25,
                                      img: m.img || "",
                                      maVai: "",
                                      slDuKien: 0,
                                      ghiChu: "",
                                      phanBoSize: []
                                    })));
                                  }
                                } catch (e) {
                                  console.error("Lỗi parse dsMau khi chọn SP:", e);
                                }
                                toast.success(`✅ Đã chọn: [${sp.id}] ${sp.tenSP}`);
                                setShowProductDropdown(false);
                                setProductSearch("");
                              }}
                            >
                              <img src={imgUrl} className="w-11 h-11 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100" />
                              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">[{sp.id}]</span>
                                  <span className="font-bold text-sm text-slate-800 truncate">{sp.tenSP}</span>
                                </div>
                                <span className="text-xs text-slate-500 truncate mt-0.5">
                                  {LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP} • {sp.dsMau?.length || 0} màu • {sp.tiLeSize || "Tự do"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PHẦN B: THÔNG TIN SẢN PHẨM & TỈ LỆ SIZE (4 Cột) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-[#2B4C3E]" />
                <span>1. Chi tiết sản phẩm</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Mã SP *</label>
                  <input 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] text-sm font-mono font-bold text-slate-800 uppercase placeholder:font-normal" 
                    value={maSP} 
                    onChange={(e) => setMaSP(e.target.value.toUpperCase())} 
                    placeholder="VD: M001" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tên SP *</label>
                  <input 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] text-sm font-semibold text-slate-800 placeholder:font-normal" 
                    value={tenSP} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setTenSP(val);
                      const lowerVal = val.toLowerCase();
                      if (lowerVal.includes("áo polo") || lowerVal.includes("ao polo")) setLoaiSP("AoPolo");
                      else if (lowerVal.includes("áo trụ") || lowerVal.includes("ao tru")) setLoaiSP("AoTru");
                      else if (lowerVal.includes("áo tròn") || lowerVal.includes("áo cổ tròn") || lowerVal.includes("cổ tròn")) setLoaiSP("AoCoTron");
                      else if (lowerVal.includes("bộ tròn") || lowerVal.includes("bộ cổ tròn")) setLoaiSP("BoCoTron");
                      else if (lowerVal.includes("bộ trụ") || lowerVal.includes("bo tru")) setLoaiSP("BoTru");
                      else if (lowerVal.includes("phụ kiện") || lowerVal.includes("quần") || lowerVal.includes("quan")) setLoaiSP("PhuKien");
                    }} 
                    placeholder="VD: Áo Polo Cổ Trụ" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phân loại SP *</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] text-sm font-medium text-slate-800" 
                    value={loaiSP} 
                    onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}
                  >
                    {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Tỉ lệ size * (Mỗi màu)</label>
                    <button
                      type="button"
                      onClick={() => setOpenAddSizeRatioModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 transition-colors"
                      title="Tạo bảng tỉ lệ size mới theo yêu cầu"
                    >
                      <Plus className="w-3 h-3" />
                      Tạo bảng size
                    </button>
                  </div>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] text-sm font-medium text-slate-800" 
                    value={currentPreset?.id || ""} 
                    onChange={(e) => handleSelectPreset(e.target.value)}
                  >
                    <option value="" disabled>-- Chọn tỉ lệ size --</option>
                    {customPresets.length > 0 && (
                      <optgroup label="⭐ Bảng size tùy chỉnh">
                        {customPresets.map((opt) => (
                          <option key={opt.id} value={opt.id}>⭐ {opt.label}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="📐 Bảng 5 size (Có 3XL: M, L, XL, 2XL, 3XL)">
                      {SIZE_RATIO_5SIZE.map((opt) => (
                        <option key={opt.id} value={opt.id}>📐 {opt.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="📏 Bảng 4 size lớn (Bỏ M: L, XL, 2XL, 3XL)">
                      {SIZE_RATIO_4SIZE_L3XL.map((opt) => (
                        <option key={opt.id} value={opt.id}>📏 {opt.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="📏 Bảng 4 size chuẩn (Bỏ 3XL: M, L, XL, 2XL)">
                      {SIZE_RATIO_4SIZE.map((opt) => (
                        <option key={opt.id} value={opt.id}>📏 {opt.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* PHẦN C: KẾ HOẠCH THỜI GIAN, SẢN LƯỢNG & NHÂN SỰ (4 Cột chuẩn hóa) */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>2. Kế hoạch thời gian & Sản lượng</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Ngày bắt đầu *</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#2B4C3E]" 
                    value={ngayBatDau} 
                    onChange={e => setNgayBatDau(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#2B4C3E]" 
                    value={hanHoanThanh} 
                    onChange={e => setHanHoanThanh(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tổng SL cắt dự kiến *</label>
                  <input 
                    type="number" 
                    min={1} 
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2B4C3E] outline-none font-bold text-amber-700 text-sm" 
                    value={tongSL} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setTongSL("");
                        return;
                      }
                      const val = parseInt(raw, 10);
                      if (!isNaN(val)) {
                        const safeVal = Math.max(0, val);
                        setTongSL(safeVal);
                        const countMau = dsMau.length > 0 ? dsMau.length : (soMau > 0 ? soMau : 1);
                        if (countMau > 0) {
                          const perColor = Math.floor(safeVal / countMau);
                          setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                        }
                      }
                    }} 
                    placeholder="Nhập tổng SL..." 
                  />
                  {tongSLToiThieu > 0 && (
                    <div className="mt-1">
                      {typeof tongSL === "number" && tongSL > 0 && tongSL < tongSLToiThieu ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                          <span>⚠️ Nhỏ hơn mức gợi ý ({tongSLToiThieu} SP).</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTongSL(tongSLToiThieu);
                              const countMau = dsMau.length > 0 ? dsMau.length : (soMau > 0 ? soMau : 1);
                              if (countMau > 0) {
                                const perColor = Math.floor(tongSLToiThieu / countMau);
                                setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                              }
                            }}
                            className="text-amber-800 underline font-bold hover:text-amber-900 cursor-pointer"
                          >
                            [Lấy {tongSLToiThieu} SP]
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Gợi ý: {tongSLToiThieu} SP ({dsMau.length || soMau} màu)
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phụ trách SX & SĐT *</label>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold text-xs border border-emerald-300 shrink-0">
                      {nhanVienOptions.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-1.5 min-w-0">
                      <SearchableSelectNhanSu 
                        value={phuTrachSX} 
                        onChange={val => {
                          setPhuTrachSX(val);
                          if (val) {
                            const nv = nhanVienOptions.find(n => n.ma === val);
                            if (nv?.sdt) {
                              setSdtLienHe(nv.sdt);
                            } else {
                              const numericPart = val.replace(/\D/g, "");
                              setSdtLienHe(`09${numericPart}123456`.substring(0, 10));
                            }
                          } else {
                            setSdtLienHe("");
                          }
                        }}
                        options={nhanVienOptions}
                        placeholder="-- Chọn NV --"
                      />
                      <input 
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#2B4C3E] font-medium" 
                        value={sdtLienHe} 
                        onChange={e => setSdtLienHe(e.target.value)} 
                        placeholder="SĐT..." 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PHẦN D: GHI CHÚ / KHÁCH HÀNG (Nếu là hàng đặt) */}
            {loaiLenh === "HangDat" ? (
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🛒 Thông tin Đơn Hàng Đặt / Khách Hàng</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <SearchableSelectKhachHang
                      value={khachHang}
                      onChange={(v) => setKhachHang(v)}
                      options={khachHangs || []}
                      placeholder="-- Chọn Khách Hàng --"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú chung</label>
                    <input 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2B4C3E]" 
                      value={ghiChu} 
                      onChange={e => setGhiChu(e.target.value)} 
                      placeholder="Ghi chú thêm về đơn đặt..." 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú kỹ thuật cắt may</label>
                    <textarea 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2B4C3E]" 
                      rows={2}
                      value={ghiChuKyThuat} 
                      onChange={e => setGhiChuKyThuat(e.target.value)} 
                      placeholder="Nhập thông tin ghi chú kỹ thuật cắt may..." 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <label className="text-xs font-bold text-slate-700 block mb-1">Ghi chú sản xuất nội bộ</label>
                <input 
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2B4C3E]" 
                  value={ghiChu} 
                  onChange={e => setGhiChu(e.target.value)} 
                  placeholder="Ghi chú thêm về lô hàng nội bộ..." 
                />
              </div>
            )}

            {/* Selected Product Banner Preview at the bottom of the section */}
            {(maSP || tenSP) && (() => {
              const sp = dsSanPham.find(s => s.id === maSP);
              const spImg = sp?.hinhAnh || sp?.dsMau?.[0]?.img || dsMau?.[0]?.img || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image";
              const spTen = sp?.tenSP || tenSP || "Chưa có tên SP";
              const spId = sp?.id || maSP || "Chưa có mã SP";
              const spLoai = sp ? (LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP) : (LOAI_SP_LABELS[loaiSP] || loaiSP);
              const totalColors = sp?.dsMau?.length || soMau || 1;
              
              return (
                <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white border border-emerald-200/70 rounded-xl shadow-xs flex flex-col md:flex-row gap-5 items-start md:items-center">
                  <div 
                    className="relative w-full md:w-28 md:h-28 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white shadow-xs flex items-center justify-center group cursor-zoom-in"
                    onClick={(e) => {
                      if (spImg && !spImg.includes("placehold.co")) {
                        handlePreviewImage(e, JSON.stringify({ url: spImg, name: spTen }));
                      }
                    }}
                  >
                    <img src={spImg} alt={spTen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded backdrop-blur-xs uppercase pointer-events-none">
                      {spLoai}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 w-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-md font-mono">{spId}</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-md">{totalColors} MÀU</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">{loaiLenh === "HangDat" ? "Đơn Hàng Đặt" : "Hàng Nhà Nội Bộ"}</span>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800 truncate mb-1">{spTen}</h3>
                        <div className="text-xs font-medium text-slate-500">Tỉ lệ size: <span className="text-slate-800 font-semibold">{tiLeSize}</span></div>
                      </div>
                      
                      <div className="flex items-center md:flex-col md:items-end gap-1.5 shrink-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng SL cắt</span>
                        <div className="text-xl md:text-2xl font-black text-amber-600 font-mono">
                          {typeof tongSL === "number" ? tongSL.toLocaleString() : (tongSL || 0)} <span className="text-xs font-bold text-slate-500">SP</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* SƠ ĐỒ ÁO/QUẦN (PLT) - dùng chiều dài sơ đồ để tự tính định mức kg/SP */}
          <div className="order-2 bg-[#D9ECE8] p-5 rounded-lg border border-teal-300/80 shadow-sm mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-teal-900 uppercase tracking-wide">Sơ đồ áo/quần (PLT)</h2>
                {isBo && <>
                  <button type="button" onClick={() => setLoaiSoDoPhoi("ao")} className={`px-2 py-1 rounded text-xs font-bold ${loaiSoDoPhoi === "ao" ? "bg-teal-700 text-white" : "bg-white text-teal-800 border border-teal-200"}`}>Phối áo</button>
                  <button type="button" onClick={() => setLoaiSoDoPhoi("quan")} className={`px-2 py-1 rounded text-xs font-bold ${loaiSoDoPhoi === "quan" ? "bg-teal-700 text-white" : "bg-white text-teal-800 border border-teal-200"}`}>Phối quần</button>
                  <button type="button" onClick={() => setLoaiSoDoPhoi("ca-hai")} className={`px-2 py-1 rounded text-xs font-bold ${loaiSoDoPhoi === "ca-hai" ? "bg-teal-700 text-white" : "bg-white text-teal-800 border border-teal-200"}`}>Phối áo và quần</button>
                  <button type="button" onClick={() => setLoaiSoDoPhoi("")} className={`px-2 py-1 rounded text-xs font-bold ${!loaiSoDoPhoi ? "bg-slate-600 text-white" : "bg-white text-slate-700 border border-slate-300"}`}>Mẫu trơn</button>
                </>}
              </div>
              <div className="flex items-center gap-2 bg-white/70 px-3 py-1.5 rounded-md border border-teal-200">
                <span className="text-sm font-bold text-teal-800">Phụ trách sơ đồ:</span>
                <div className="w-[200px]">
                  <SearchableSelectNhanSu 
                    value={phuTrachSoDo}
                    onChange={setPhuTrachSoDo}
                    options={nhanVienOptions}
                    placeholder="-- Chọn NV phụ trách --"
                  />
                </div>
              </div>
            </div>
            <div className={`grid grid-cols-1 ${isBo ? "md:grid-cols-2" : ""} gap-4`}>
              {/* Sơ đồ áo */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Shirt className="w-4 h-4" /> Sơ đồ áo (PLT)</label>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input type="text" inputMode="decimal" placeholder="Dài sơ đồ (cm)..." className="flex-1 min-w-0 w-full sm:w-40 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-violet-500" value={daiSoDoAo} onChange={e => setDaiSoDoAo(e.target.value)} />
                    <span className="px-2 py-1 rounded bg-violet-100 text-violet-800 text-xs font-bold whitespace-nowrap shrink-0">
                      {dinhMucAoTuDong ? dinhMucAoTuDong.toFixed(4) : "0"} kg/áo
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="file" accept="image/*" className="hidden" ref={imageAoRef} onChange={(e) => handleUploadSoDo(e, "anh-ao")} />
                <div className="relative w-full h-40 bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer overflow-hidden group hover:border-teal-500 transition-colors flex items-center justify-center" onClick={(e) => hinhAnhSoDoAo ? handlePreviewImage(e, hinhAnhSoDoAo) : imageAoRef.current?.click()}>
                  {hinhAnhSoDoAo ? <div className="relative w-full h-full flex items-center justify-center p-3"><img src={(() => { try { return JSON.parse(hinhAnhSoDoAo).url || hinhAnhSoDoAo; } catch { return hinhAnhSoDoAo; } })()} alt="Ảnh sơ đồ áo" className="w-full h-full object-contain" /><div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"><button type="button" onClick={(e) => handlePreviewImage(e, hinhAnhSoDoAo)} className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded">Xem</button><button type="button" onClick={(e) => handleDownloadSoDo(e, hinhAnhSoDoAo)} className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded">Tải về</button></div><button type="button" onClick={(e) => { e.stopPropagation(); setHinhAnhSoDoAo(""); if (imageAoRef.current) imageAoRef.current.value = ""; }} className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 rounded">Xóa</button></div> : <div className="flex flex-col items-center opacity-60 group-hover:opacity-100"><UploadCloud className="w-8 h-8 mb-1 text-teal-600" /><span className="text-xs font-medium">Tải ảnh sơ đồ áo</span></div>}
                </div>
                <input type="file" accept=".plt,.zip" className="hidden" ref={fileAoRef} onChange={(e) => handleUploadSoDo(e, "ao")} />
                <div
                  className="relative w-full h-40 bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer overflow-hidden group hover:border-teal-500 transition-colors flex items-center justify-center"
                  onClick={() => !soDoAo && fileAoRef.current?.click()}
                >
                  {soDoAo ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
                          {(() => { try { return JSON.parse(soDoAo).name; } catch { return "Sơ đồ áo"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => handleDownloadSoDo(e, soDoAo)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          <Download size={14} /> Tải
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSoDoAo(""); fileAoRef.current && (fileAoRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Tải file sơ đồ áo<br/>(.plt, .zip)</span>
                    </div>
                  )}
                </div>
                </div>
              </div>

              {/* Sơ đồ quần - chỉ hiện khi loại SP là Bộ */}
              {isBo && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Shirt className="w-4 h-4 rotate-180" /> Sơ đồ quần (PLT)</label>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input type="text" inputMode="decimal" placeholder="Dài sơ đồ (cm)..." className="flex-1 min-w-0 w-full sm:w-40 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-violet-500" value={daiSoDoQuan} onChange={e => setDaiSoDoQuan(e.target.value)} />
                      <span className="px-2 py-1 rounded bg-violet-100 text-violet-800 text-xs font-bold whitespace-nowrap shrink-0">
                        {dinhMucQuanTuDong ? dinhMucQuanTuDong.toFixed(4) : "0"} kg/quần
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="file" accept="image/*" className="hidden" ref={imageQuanRef} onChange={(e) => handleUploadSoDo(e, "anh-quan")} />
                  <div className="relative w-full h-40 bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer overflow-hidden group hover:border-teal-500 transition-colors flex items-center justify-center" onClick={(e) => hinhAnhSoDoQuan ? handlePreviewImage(e, hinhAnhSoDoQuan) : imageQuanRef.current?.click()}>
                    {hinhAnhSoDoQuan ? <div className="relative w-full h-full flex items-center justify-center p-3"><img src={(() => { try { return JSON.parse(hinhAnhSoDoQuan).url || hinhAnhSoDoQuan; } catch { return hinhAnhSoDoQuan; } })()} alt="Ảnh sơ đồ quần" className="w-full h-full object-contain" /><div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"><button type="button" onClick={(e) => handlePreviewImage(e, hinhAnhSoDoQuan)} className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded">Xem</button><button type="button" onClick={(e) => handleDownloadSoDo(e, hinhAnhSoDoQuan)} className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded">Tải về</button></div><button type="button" onClick={(e) => { e.stopPropagation(); setHinhAnhSoDoQuan(""); if (imageQuanRef.current) imageQuanRef.current.value = ""; }} className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 rounded">Xóa</button></div> : <div className="flex flex-col items-center opacity-60 group-hover:opacity-100"><UploadCloud className="w-8 h-8 mb-1 text-teal-600" /><span className="text-xs font-medium">Tải ảnh sơ đồ quần</span></div>}
                  </div>
                  <input type="file" accept=".plt,.zip" className="hidden" ref={fileQuanRef} onChange={(e) => handleUploadSoDo(e, "quan")} />
                  <div
                    className="relative w-full h-40 bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer overflow-hidden group hover:border-teal-500 transition-colors flex items-center justify-center"
                    onClick={() => !soDoQuan && fileQuanRef.current?.click()}
                  >
                    {soDoQuan ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]">
                            {(() => { try { return JSON.parse(soDoQuan).name; } catch { return "Sơ đồ quần"; } })()}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={(e) => handleDownloadSoDo(e, soDoQuan)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                            <Download size={14} /> Tải
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSoDoQuan(""); fileQuanRef.current && (fileQuanRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                            <X size={14} /> Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                        <UploadCloud className="w-8 h-8 mb-1" />
                          <span className="text-xs font-medium text-center">Tải file sơ đồ quần<br/>(.plt, .zip)</span>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              )}
            </div>
            {isBo && (dinhMucAoTuDong > 0 || dinhMucQuanTuDong > 0) && (
              <div className="mt-4 px-4 py-2.5 rounded-lg bg-violet-900 text-white flex items-center justify-between">
                <span className="text-sm font-bold uppercase tracking-wide">Định mức Bộ (kg/áo + kg/quần)</span>
                <span className="text-lg font-extrabold">{(dinhMucAoTuDong + dinhMucQuanTuDong).toFixed(4)} kg/bộ</span>
              </div>
            )}
          </div>

          {/* SƠ ĐỒ CẮT (MARKER) */}
          <div className={`${loaiSoDoPhoi ? "" : "hidden"} order-3 bg-[#DCEAF2] p-5 rounded-lg border border-blue-300/80 shadow-sm mt-6`}>
             <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-[#1E3A8A] uppercase tracking-wide">SƠ ĐỒ CẮT (MARKER)</h2>
               <div className="flex items-center gap-2 bg-blue-100/50 px-3 py-1.5 rounded-full">
                 <input type="checkbox" id="daCoSoDo" className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer" checked={daCoSoDo} onChange={e => setDaCoSoDo(e.target.checked)} />
                 <label htmlFor="daCoSoDo" className="text-sm font-bold text-[#1E3A8A] cursor-pointer">Đã có sơ đồ</label>
               </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Sơ đồ chính */}
               <div>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                     <label className="text-sm font-bold text-slate-700">Sơ đồ phối áo</label>
                   <div className="flex gap-2">
                     <input type="text" placeholder="Khổ..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={khoSoDoChinh} onChange={e => setKhoSoDoChinh(e.target.value)} />
                     <input type="text" placeholder="Dài..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={daiSoDoChinh} onChange={e => setDaiSoDoChinh(e.target.value)} />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   {/* File Sơ đồ */}
                   <div>
                     <input type="file" className="hidden" ref={fileChinhRef} onChange={(e) => handleUploadSoDo(e, "chinh")} />
                     <div 
                       className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                       onClick={() => !soDoChinh && fileChinhRef.current?.click()}
                     >
                       {soDoChinh ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                             <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                               {(() => { try { return JSON.parse(soDoChinh).name; } catch { return "Sơ đồ"; } })()}
                             </span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={(e) => handleDownloadSoDo(e, soDoChinh)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                               <Download size={14} /> Tải
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setSoDoChinh(""); fileChinhRef.current && (fileChinhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                               <X size={14} /> Xóa
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                           <UploadCloud className="w-8 h-8 mb-1" />
                           <span className="text-xs font-medium text-center">Tải lên file sơ đồ<br/>(PLT/ZIP)</span>
                         </div>
                       )}
                     </div>
                   </div>
                   
                   {/* File PDF xem trước */}
                   <div>
                     <input type="file" accept=".pdf" className="hidden" ref={filePdfChinhRef} onChange={(e) => handleUploadSoDo(e, "pdf-chinh")} />
                     <div 
                       className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                       onClick={() => !pdfSoDoChinh && filePdfChinhRef.current?.click()}
                     >
                       {pdfSoDoChinh ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-6 h-6 text-red-500" />
                             <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                               {(() => { try { return JSON.parse(pdfSoDoChinh).name; } catch { return "File PDF"; } })()}
                             </span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={(e) => handlePreviewPDF(e, pdfSoDoChinh)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                               <Eye size={14} /> Xem
                             </button>
                             <button onClick={(e) => handleDownloadSoDo(e, pdfSoDoChinh)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                               <Download size={14} /> Tải
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setPdfSoDoChinh(""); filePdfChinhRef.current && (filePdfChinhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                               <X size={14} /> Xóa
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                           <UploadCloud className="w-8 h-8 mb-1" />
                           <span className="text-xs font-medium text-center">Upload PDF<br/>xem trước</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="mt-2">
                    <textarea rows={2} placeholder="Ghi chú sơ đồ chính (dành cho cắt may)..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y" value={ghiChuSoDoChinh} onChange={e => setGhiChuSoDoChinh(e.target.value)} />
                  </div>
               </div>
               
               {/* Sơ đồ phối */}
               <div>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                   <label className="text-sm font-bold text-slate-700">Sơ đồ phối quần</label>
                   <div className={`${loaiSoDoPhoi ? "flex" : "hidden"} gap-2`}>
                     <input type="text" placeholder="Khổ..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={khoSoDoPhoi} onChange={e => setKhoSoDoPhoi(e.target.value)} />
                     <input type="text" placeholder="Dài..." className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm focus:ring-1 focus:ring-blue-500" value={daiSoDoPhoi} onChange={e => setDaiSoDoPhoi(e.target.value)} />
                   </div>
                 </div>
                 <div className={`${loaiSoDoPhoi ? "grid" : "hidden"} grid-cols-2 gap-2 mt-2`}>
                   {/* File Sơ đồ phối */}
                   <div>
                     <input type="file" className="hidden" ref={filePhoiRef} onChange={(e) => handleUploadSoDo(e, "phoi")} />
                     <div 
                       className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                       onClick={() => !activeSoDoPhoi && filePhoiRef.current?.click()}
                     >
                       {activeSoDoPhoi ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                             <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                               {(() => { try { return JSON.parse(activeSoDoPhoi).name; } catch { return `Sơ đồ phối ${loaiSoDoPhoi}`; } })()}
                             </span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={(e) => handleDownloadSoDo(e, activeSoDoPhoi)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                               <Download size={14} /> Tải
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); if (loaiSoDoPhoi === "ao") setSoDoPhoiAo(""); else setSoDoPhoiQuan(""); filePhoiRef.current && (filePhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                               <X size={14} /> Xóa
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                           <UploadCloud className="w-8 h-8 mb-1" />
                           <span className="text-xs font-medium text-center">Tải lên file sơ đồ<br/>(PLT/ZIP)</span>
                         </div>
                       )}
                     </div>
                   </div>

                   {/* File PDF phối xem trước */}
                   <div>
                     <input type="file" accept=".pdf" className="hidden" ref={filePdfPhoiRef} onChange={(e) => handleUploadSoDo(e, "pdf-phoi")} />
                     <div 
                       className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                       onClick={() => !pdfSoDoPhoi && filePdfPhoiRef.current?.click()}
                     >
                       {pdfSoDoPhoi ? (
                         <div className="flex flex-col items-center gap-2">
                           <div className="flex items-center gap-2">
                             <CheckCircle2 className="w-6 h-6 text-red-500" />
                             <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
                               {(() => { try { return JSON.parse(pdfSoDoPhoi).name; } catch { return "File PDF"; } })()}
                             </span>
                           </div>
                           <div className="flex gap-2">
                             <button onClick={(e) => handlePreviewPDF(e, pdfSoDoPhoi)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                               <Eye size={14} /> Xem
                             </button>
                             <button onClick={(e) => handleDownloadSoDo(e, pdfSoDoPhoi)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                               <Download size={14} /> Tải
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); setPdfSoDoPhoi(""); filePdfPhoiRef.current && (filePdfPhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                               <X size={14} /> Xóa
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                           <UploadCloud className="w-8 h-8 mb-1" />
                           <span className="text-xs font-medium text-center">Upload PDF<br/>xem trước</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
                  <div className={`${loaiSoDoPhoi ? "block" : "hidden"} mt-2`}>
                    <textarea rows={2} placeholder="Ghi chú sơ đồ phối (dành cho cắt may)..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y" value={ghiChuSoDoPhoi} onChange={e => setGhiChuSoDoPhoi(e.target.value)} />
                  </div>
               </div>
             </div>
          </div>

          <div className="order-3 bg-white p-4 rounded-lg border border-orange-200 shadow-sm mt-6">
            <label className="text-sm font-bold text-slate-700 block mb-2">Công đoạn In / Thêu / Dập</label>
            <select
              className="w-full md:max-w-md px-3 py-2 border border-orange-300 rounded bg-white text-sm font-semibold text-orange-900"
              value={congDoanInTheu}
              onChange={e => handleSelectInTheu(e.target.value as InTheuOption | "")}
            >
              <option value="">-- Không thực hiện In/Thêu/Dập --</option>
              {IN_THEU_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          {/* TÀI LIỆU IN/THÊU (MẪU) */}
          <div className={`order-3 bg-[#F8E6D2] p-5 rounded-lg border border-orange-300/80 shadow-sm mt-6 ${hasInTheuStage ? "" : "hidden"}`}>
            <h2 className="text-xl font-bold text-orange-900 uppercase tracking-wide mb-4">Tài liệu In/Thêu (Mẫu)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hình ảnh mẫu In/Thêu */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">🖼️ Hình ảnh mẫu In/Thêu</label>
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="hidden" ref={fileInTheuAnhRef} onChange={(e) => handleUploadSoDo(e, "in-theu-anh")} />
                <div
                  className="relative w-full min-h-[220px] p-3.5 bg-orange-50/50 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer group hover:border-orange-500 hover:bg-orange-50/80 transition-all flex flex-col items-center justify-center"
                  onClick={(e) => hinhMauInTheu ? handlePreviewImage(e, hinhMauInTheu) : fileInTheuAnhRef.current?.click()}
                >
                  {hinhMauInTheu ? (
                    (() => {
                      let url = "";
                      let name = "Hình mẫu In/Thêu";
                      const trimmed = (hinhMauInTheu || "").trim();
                      if (trimmed.startsWith("/") || trimmed.startsWith("http") || trimmed.startsWith("data:")) {
                        url = trimmed;
                        name = trimmed.startsWith("data:") ? "hinh_mau_in_theu.png" : (trimmed.split("/").pop() || "Hình mẫu In/Thêu");
                      } else {
                        try {
                          const parsed = JSON.parse(hinhMauInTheu);
                          url = parsed.url || hinhMauInTheu;
                          name = parsed.name || "Hình mẫu In/Thêu";
                        } catch {
                          url = hinhMauInTheu;
                        }
                      }
                      return (
                        <div className="flex flex-col items-center justify-center gap-2.5 w-full">
                          {/* Ảnh lớn hơn rõ nét, hover zoom nhẹ */}
                          <div className="relative group/img flex items-center justify-center">
                            <img
                              src={url}
                              alt="Ảnh mẫu In/Thêu"
                              className="h-28 sm:h-32 max-h-36 max-w-full object-contain rounded-md border border-orange-200 bg-white p-1.5 shadow-sm hover:scale-105 transition-transform"
                            />
                          </div>

                          {/* Tên file & badge trạng thái */}
                          <div className="flex items-center gap-1.5 max-w-[90%] px-2.5 py-0.5 bg-white/90 border border-orange-200 rounded-full shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={name}>
                              {name}
                            </span>
                          </div>

                          {/* Bộ nút thao tác: Xem, Tải, Đổi ảnh, Xóa - KHÔNG BAO GIỜ BỊ CHE */}
                          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                            <button
                              type="button"
                              onClick={(e) => handlePreviewImage(e, hinhMauInTheu)}
                              className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-100/90 hover:bg-blue-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Xem phóng to ảnh"
                            >
                              <Eye size={14} /> Xem
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDownloadSoDo(e, hinhMauInTheu)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Tải ảnh về máy"
                            >
                              <Download size={14} /> Tải
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInTheuAnhRef.current?.click();
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Tải lên ảnh khác thay thế"
                            >
                              <UploadCloud size={14} /> Đổi ảnh
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setHinhMauInTheu("");
                                if (fileInTheuAnhRef.current) fileInTheuAnhRef.current.value = "";
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100/90 hover:bg-red-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Xóa ảnh mẫu"
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-orange-600/80 group-hover:text-orange-700 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-orange-100/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
                        <UploadCloud className="w-6 h-6 text-orange-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Tải lên hình ảnh mẫu</span>
                      <span className="text-xs text-slate-500 mt-1">Hỗ trợ JPG, PNG (nhấp để chọn file)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* File gốc In/Thêu */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">📄 File gốc In/Thêu</label>
                <input type="file" accept=".pdf,.ai,.cdr,.psd,.svg" className="hidden" ref={fileInTheuFileRef} onChange={(e) => handleUploadSoDo(e, "in-theu-file")} />
                <div
                  className="relative w-full min-h-[220px] p-3.5 bg-white border-2 border-dashed border-slate-300 rounded-lg cursor-pointer group hover:border-orange-500 hover:bg-orange-50/20 transition-all flex flex-col items-center justify-center"
                  onClick={() => !fileGocInTheu && fileInTheuFileRef.current?.click()}
                >
                  {fileGocInTheu ? (
                    (() => {
                      let fileName = "File gốc In/Thêu";
                      try {
                        const parsed = JSON.parse(fileGocInTheu);
                        fileName = parsed.name || "File gốc In/Thêu";
                      } catch {
                        fileName = fileGocInTheu.split("/").pop() || "File gốc In/Thêu";
                      }
                      return (
                        <div className="flex flex-col items-center justify-center gap-2.5 w-full">
                          <div className="w-16 h-16 rounded-xl bg-orange-100/80 border border-orange-200 flex items-center justify-center shadow-xs">
                            <Package className="w-8 h-8 text-orange-600" />
                          </div>
                          <div className="flex items-center gap-1.5 max-w-[90%] px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full shadow-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]" title={fileName}>
                              {fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
                            <button
                              type="button"
                              onClick={(e) => handleDownloadSoDo(e, fileGocInTheu)}
                              className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Tải file về máy"
                            >
                              <Download size={14} /> Tải file
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInTheuFileRef.current?.click();
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Tải lên file khác thay thế"
                            >
                              <UploadCloud size={14} /> Đổi file
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileGocInTheu("");
                                if (fileInTheuFileRef.current) fileInTheuFileRef.current.value = "";
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 bg-red-100/90 hover:bg-red-200 px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
                              title="Xóa file"
                            >
                              <Trash2 size={14} /> Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-slate-500 group-hover:text-orange-600 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-orange-100/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-xs">
                        <UploadCloud className="w-6 h-6 text-slate-500 group-hover:text-orange-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Tải lên file thiết kế gốc</span>
                      <span className="text-xs text-slate-500 mt-1">Hỗ trợ PDF, AI, CDR, PSD (nhấp để chọn file)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3">
              <textarea rows={2} placeholder="Nhập ghi chú cho bên in/thêu (vd: kích thước, vị trí in, màu in, chất liệu)..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-y" value={ghiChuInTheu} onChange={e => setGhiChuInTheu(e.target.value)} />
            </div>

            {/* THÔNG TIN GIA CÔNG IN/THÊU */}
            <div className="mt-4 pt-4 border-t border-orange-200/50">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {loaiSP?.toLowerCase().includes("bo") && (
                  <div className="flex items-center gap-4 bg-white px-3 py-1.5 rounded-md border border-orange-200 shrink-0">
                    <span className="text-sm font-bold text-orange-800">In/Thêu cho:</span>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer font-medium"><input type="radio" name="loaiInTheu" checked={loaiInTheu === "bo"} onChange={() => {
                      setLoaiInTheu("bo");
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id?.startsWith("in_theu"));
                        if (idx >= 0) {
                          next[idx].id = "in_theu";
                          next[idx].tenCongDoan = "In/Thêu";
                        }
                        return next as any;
                      });
                    }} /> Nguyên bộ</label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer font-medium"><input type="radio" name="loaiInTheu" checked={loaiInTheu === "ao"} onChange={() => {
                      setLoaiInTheu("ao");
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id?.startsWith("in_theu"));
                        if (idx >= 0) {
                          next[idx].id = "in_theu_ao";
                          next[idx].tenCongDoan = "In/Thêu Áo";
                        }
                        return next as any;
                      });
                    }} /> Chỉ Áo</label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer font-medium"><input type="radio" name="loaiInTheu" checked={loaiInTheu === "quan"} onChange={() => {
                      setLoaiInTheu("quan");
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id?.startsWith("in_theu"));
                        if (idx >= 0) {
                          next[idx].id = "in_theu_quan";
                          next[idx].tenCongDoan = "In/Thêu Quần";
                        }
                        return next as any;
                      });
                    }} /> Chỉ Quần</label>
                  </div>
                )}
                
                <div className="flex-1 bg-orange-50 border-2 border-orange-300 p-3 rounded-lg grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start md:items-center gap-3 shadow-sm w-full min-w-0">
                  <span className="text-sm font-black text-orange-800 whitespace-nowrap shrink-0">
                    GIA CÔNG IN/THÊU{loaiSP?.toLowerCase().includes("bo") ? (loaiInTheu === "ao" ? " ÁO:" : loaiInTheu === "quan" ? " QUẦN:" : ":") : ":"}
                  </span>
                  <select 
                    className="w-full flex-1 min-w-0 px-2 py-1.5 border border-orange-300 rounded text-sm focus:outline-none bg-white font-semibold text-orange-900"
                    value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id?.startsWith("in_theu"))?.nguoiMa || ""}
                    onChange={e => {
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id?.startsWith("in_theu"));
                        const selectedVal = e.target.value;
                        const nv = nhanVienOptions.find(n => n.ma === selectedVal);
                        const dt = DOI_TAC_GIA_CONG.find(d => d.ma === selectedVal);
                        const selectedTen = nv?.ten || dt?.tenDonVi || selectedVal;

                        if (idx >= 0) {
                          next[idx] = { ...next[idx], nguoiMa: selectedVal, nguoiTen: selectedTen };
                        } else {
                          // Thêm mới nếu chưa có
                          next.push({
                            id: loaiSP?.toLowerCase().includes("bo") ? (loaiInTheu === "ao" ? "in_theu_ao" : loaiInTheu === "quan" ? "in_theu_quan" : "in_theu") : "in_theu",
                            tenCongDoan: loaiSP?.toLowerCase().includes("bo") ? (loaiInTheu === "ao" ? "In/Thêu Áo" : loaiInTheu === "quan" ? "In/Thêu Quần" : "In/Thêu") : "In/Thêu",
                            loaiNguoi: "xuong_ngoai",
                            nguoiMa: selectedVal,
                            nguoiTen: selectedTen,
                            donGia: 0,
                            soLuong: 0, thanhTien: 0, daThanhToan: 0, conLai: 0, trangThaiTT: "chua_tra"
                          });
                        }
                        return next as any;
                      });
                    }}
                  >
                     <option value="">-- Chọn NV/Xưởng --</option>
                     {(() => {
                       const inTheuCurrent = ((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id?.startsWith("in_theu"));
                       const inTheuOpts = getDoiTuongOptions(congDoanInTheu || "In/Thêu", loaiSP, nhanVienOptions);
                       const hasSelected = inTheuCurrent?.nguoiMa && inTheuOpts.some(opt => opt.ma === inTheuCurrent.nguoiMa);
                       return (
                         <>
                           {inTheuCurrent?.nguoiMa && !hasSelected && (
                             <option value={inTheuCurrent.nguoiMa}>{inTheuCurrent.nguoiTen || inTheuCurrent.nguoiMa}</option>
                           )}
                           {inTheuOpts.map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
                         </>
                       );
                     })()}
                  </select>
                  <div className="flex items-center gap-1 w-full md:w-auto">
                    <span className="text-xs font-bold text-orange-700">Đơn giá:</span>
                    <input 
                      type="number" min={0}
                      placeholder="0" 
                      className="w-full md:w-28 px-2 py-1.5 border border-orange-300 rounded text-sm text-right font-bold tabular-nums text-orange-900"
                      value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id?.startsWith("in_theu"))?.donGia || ""}
                      onChange={e => {
                        setPhanCong(p => {
                          const next = [...(p as any[])];
                          const idx = next.findIndex(k => k.id?.startsWith("in_theu"));
                          if (idx >= 0) next[idx] = { ...next[idx], donGia: parseInt(e.target.value) || 0 };
                          return next as any;
                        });
                      }}
                    />
                    <span className="text-xs font-bold text-orange-700">đ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU */}
          <div className="order-4 bg-[#2B7770] p-5 rounded-lg border border-[#1B625F] shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-white uppercase tracking-wide">MÀU SẮC, VẢI & CHIA SIZE</h2>
               <div className="flex items-center gap-2">
                 <label className="text-sm font-bold text-white">Số màu vải cắt:</label>
                 <input
                   type="number"
                   className="w-16 px-2 py-1 text-center rounded border border-white font-bold text-slate-900 bg-white"
                   value={soMau}
                   onChange={e => {
                     const newSoMau = Math.max(1, parseInt(e.target.value) || 1);
                     setSoMau(newSoMau);
                     setDsMau(prev => {
                       if (prev.length === newSoMau) return prev;
                       if (prev.length < newSoMau) {
                         const extra = Array.from({ length: newSoMau - prev.length }).map(() => ({
                           ten: "", maSKU: "", maVai: "", dinhMuc: dinhMucAoTuDong || 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: []
                         }));
                         return [...prev, ...extra];
                       }
                       return prev.slice(0, newSoMau);
                     });
                   }}
                 />
               </div>
            </div>

            {/* THÔNG TIN GIA CÔNG MAY (ÁO / QUẦN) */}
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Box Áo */}
              <div className="flex-1 bg-emerald-50/80 border-2 border-emerald-400 p-3 rounded-lg grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start md:items-center gap-3 shadow-sm min-w-0">
                <span className="text-sm font-black text-emerald-800 whitespace-nowrap shrink-0">GIA CÔNG ÁO:</span>
                <select 
                  className="w-full flex-1 min-w-0 px-2 py-1.5 border border-emerald-300 rounded text-sm focus:outline-none bg-white font-semibold text-emerald-900"
                  value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayAo" || k.id === "may" || k.id === "may_ao")?.nguoiMa || ""}
                  onChange={e => {
                    setPhanCong(p => {
                      const next = [...(p as any[])];
                      const idx = next.findIndex(k => k.id === "mayAo" || k.id === "may" || k.id === "may_ao");
                      const nv = nhanVienOptions.find(n => n.ma === e.target.value);
                      const dt = DOI_TAC_GIA_CONG.find(d => d.ma === e.target.value);
                      const ten = nv?.ten || dt?.tenDonVi || e.target.value;
                      if (idx >= 0) {
                        next[idx] = { ...next[idx], nguoiMa: e.target.value, nguoiTen: ten };
                      } else {
                        next.push({
                          id: loaiSP?.toLowerCase().includes("bo") ? "may_ao" : "may",
                          tenCongDoan: loaiSP?.toLowerCase().includes("bo") ? "May Áo" : "May",
                          nguoiMa: e.target.value,
                          nguoiTen: ten,
                          donGia: 0,
                          trangThaiCD: "chua_bat_dau"
                        });
                      }
                      return next as any;
                    });
                  }}
                >
                   <option value="">-- Chọn NV/Xưởng --</option>
                   {(() => {
                     const mayAoCurrent = ((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayAo" || k.id === "may" || k.id === "may_ao");
                     const mayAoOpts = getDoiTuongOptions("May Áo", loaiSP, nhanVienOptions);
                     const hasSelected = mayAoCurrent?.nguoiMa && mayAoOpts.some(opt => opt.ma === mayAoCurrent.nguoiMa);
                     return (
                       <>
                         {mayAoCurrent?.nguoiMa && !hasSelected && (
                           <option value={mayAoCurrent.nguoiMa}>{mayAoCurrent.nguoiTen || mayAoCurrent.nguoiMa}</option>
                         )}
                         {mayAoOpts.map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
                       </>
                     );
                   })()}
                </select>
                <div className="flex items-center gap-1 w-full md:w-auto">
                  <span className="text-xs font-bold text-emerald-700">Đơn giá:</span>
                  <input 
                    type="number" min={0}
                    placeholder="0" 
                    className="w-full md:w-24 px-2 py-1 border border-emerald-300 rounded text-sm bg-white text-right font-bold text-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayAo" || k.id === "may" || k.id === "may_ao")?.donGia || ""}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id === "mayAo" || k.id === "may" || k.id === "may_ao");
                        if (idx >= 0) {
                          next[idx] = { ...next[idx], donGia: val };
                        } else {
                          next.push({
                            id: loaiSP?.toLowerCase().includes("bo") ? "may_ao" : "may",
                            tenCongDoan: loaiSP?.toLowerCase().includes("bo") ? "May Áo" : "May",
                            donGia: val,
                            nguoiMa: "",
                            nguoiTen: "",
                            trangThaiCD: "chua_bat_dau"
                          });
                        }
                        return next as any;
                      });
                    }}
                  />
                  <span className="text-xs font-bold text-emerald-700">đ</span>
                </div>
              </div>

              {/* Box Quần (Chỉ hiện nếu là hàng Bộ) */}
              {loaiSP?.toLowerCase().includes("bo") && (
                <div className="flex-1 bg-emerald-50/80 border-2 border-emerald-400 p-3 rounded-lg grid grid-cols-1 md:grid-cols-[auto_1fr_auto] items-start md:items-center gap-3 shadow-sm min-w-0">
                  <span className="text-sm font-black text-emerald-800 whitespace-nowrap shrink-0">GIA CÔNG QUẦN:</span>
                  <select 
                    className="w-full flex-1 min-w-0 px-2 py-1.5 border border-emerald-300 rounded text-sm focus:outline-none bg-white font-semibold text-emerald-900"
                    value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayQuan" || k.id === "may_quan")?.nguoiMa || ""}
                    onChange={e => {
                      setPhanCong(p => {
                        const next = [...(p as any[])];
                        const idx = next.findIndex(k => k.id === "mayQuan" || k.id === "may_quan");
                        const nv = nhanVienOptions.find(n => n.ma === e.target.value);
                        const dt = DOI_TAC_GIA_CONG.find(d => d.ma === e.target.value);
                        const ten = nv?.ten || dt?.tenDonVi || e.target.value;
                        if (idx >= 0) {
                          next[idx] = { ...next[idx], nguoiMa: e.target.value, nguoiTen: ten };
                        } else {
                          next.push({
                            id: "may_quan",
                            tenCongDoan: "May Quần",
                            nguoiMa: e.target.value,
                            nguoiTen: ten,
                            donGia: 0,
                            trangThaiCD: "chua_bat_dau"
                          });
                        }
                        return next as any;
                      });
                    }}
                  >
                     <option value="">-- Chọn NV/Xưởng --</option>
                     {(() => {
                       const mayQuanCurrent = ((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayQuan" || k.id === "may_quan");
                       const mayQuanOpts = getDoiTuongOptions("May Quần", loaiSP, nhanVienOptions);
                       const hasSelected = mayQuanCurrent?.nguoiMa && mayQuanOpts.some(opt => opt.ma === mayQuanCurrent.nguoiMa);
                       return (
                         <>
                           {mayQuanCurrent?.nguoiMa && !hasSelected && (
                             <option value={mayQuanCurrent.nguoiMa}>{mayQuanCurrent.nguoiTen || mayQuanCurrent.nguoiMa}</option>
                           )}
                           {mayQuanOpts.map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
                         </>
                       );
                     })()}
                  </select>
                  <div className="flex items-center gap-1 w-full md:w-auto">
                    <span className="text-xs font-bold text-emerald-700">Đơn giá thực tế:</span>
                    <input 
                      type="number" min={0}
                      placeholder="0" 
                      className="w-full md:w-28 px-2 py-1.5 border border-emerald-300 rounded text-sm text-right font-bold tabular-nums text-emerald-900"
                      value={((Array.isArray(phanCong) ? phanCong : []) as any[]).find(k => k.id === "mayQuan" || k.id === "may_quan")?.donGia || ""}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        setPhanCong(p => {
                          const next = [...(p as any[])];
                          const idx = next.findIndex(k => k.id === "mayQuan" || k.id === "may_quan");
                          if (idx >= 0) {
                            next[idx] = { ...next[idx], donGia: val };
                          } else {
                            next.push({
                              id: "may_quan",
                              tenCongDoan: "May Quần",
                              donGia: val,
                              nguoiMa: "",
                              nguoiTen: "",
                              trangThaiCD: "chua_bat_dau"
                            });
                          }
                          return next as any;
                        });
                      }}
                    />
                    <span className="text-xs font-bold text-emerald-700">đ</span>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Thẻ Màu Sắc */}
            <div className="grid grid-cols-1 gap-4 md:gap-6 mb-6">
              {dsMau.map((mau, idx) => {
                const isBo = loaiSP?.toLowerCase().includes("bo");
                const accent = MAU_CARD_ACCENT[idx % MAU_CARD_ACCENT.length];
                return (
                <div key={idx} className={`bg-[#D7ECE7] ${accent.ring} w-full min-w-0 rounded-lg shadow-md p-3 md:p-5 grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)] gap-4 md:gap-5 border border-[#A6CEC3] border-l-4 border-l-[#2B4C3E] focus-within:ring-2 transition-shadow`}>

                  {/* Left: Image */}
                  <div className="w-full md:w-[280px] shrink-0 flex flex-col gap-3 rounded-lg border-2 border-blue-300 bg-white/95 p-2 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-blue-300 pb-1.5">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${accent.badge} text-white text-xs font-black shrink-0`}>{idx + 1}</span>
                      <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Ảnh màu áo</span>
                    </div>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold"
                      placeholder="Tên màu..."
                      value={mau.ten}
                      onChange={(e) => {
                        const next = [...dsMau]; next[idx].ten = e.target.value; setDsMau(next);
                      }}
                    />
                    <div className="grid grid-cols-1 gap-2">
                      {/* Ảnh mẫu ÁO (hàng Bộ hiển thị cạnh ảnh QUẦN) */}
                      <div
                        className="relative w-[240px] h-[320px] max-w-full aspect-[3/4] mx-auto bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer group hover:border-blue-500 transition-colors flex items-center justify-center z-10 hover:z-50 overflow-hidden shadow-sm"
                        onClick={() => handleColorImageUpload(idx, "ao")}
                      >
                        {uploadingColor?.idx === idx && uploadingColor?.phan === "ao" && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center rounded-lg z-30 pointer-events-none">
                            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-1.5" />
                            <span className="text-xs font-bold text-white">Đang tải ảnh...</span>
                          </div>
                        )}
                        {mau.img ? (
                          <>
                            <img src={mau.img} className="w-full h-full object-cover object-top rounded-lg group-hover:scale-[1.75] transition-transform duration-300 group-hover:shadow-2xl origin-center" style={{ imageRendering: "-webkit-optimize-contrast" }} />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold">ÁO</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDsMau(prev => {
                                  const next = [...prev];
                                  next[idx] = { ...next[idx], img: "" };
                                  return next;
                                });
                                toast.info("Đã gỡ ảnh màu áo");
                              }}
                              className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-md z-20 transition-all opacity-80 hover:opacity-100"
                              title="Xoá ảnh này"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="absolute bottom-0 inset-x-0 py-1 bg-black/60 text-white text-[10px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">
                              Bấm để thay ảnh {isBo ? "ÁO" : ""}
                            </span>
                          </>
                        ) : (
                          <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-8 h-8 text-[#2B4C3E]" />
                            <span className="text-xs mt-2 text-slate-600 font-medium">Tải ảnh {isBo ? "ÁO" : ""}</span>
                          </div>
                        )}
                      </div>

                    </div>


                    {/* Thêm vật tư nhanh ngay tại card màu này (trước đây chỉ có 1 nút chung ở cuối form, phải cuộn xa) */}
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => themVatTuTheoMau(idx, "ao")}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-[#2B4C3E] text-white text-xs font-bold rounded hover:bg-[#2B4C3E]/80 transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Vật tư áo
                      </button>
                    </div>

                    {/* Vật tư đã gắn với ĐÚNG màu này - hiện ngay tại đây để bên gia công
                        biết chính xác vật tư nào đi với màu nào, không phải đoán ở danh
                        sách chung cuối form. */}
                    {(() => {
                      const vtCuaMau = dsPhuLieu
                        .map((p, i) => ({ p, i }))
                        .filter(({ p }) => p.mauIdx === idx);
                      if (vtCuaMau.length === 0) return null;
                      return (
                        <div className="flex flex-col gap-1 bg-white/70 rounded-lg border border-slate-200 p-2">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Vật tư của màu này</div>
                          {vtCuaMau.map(({ p, i }) => (
                            <div key={i} className="flex items-center justify-between gap-1.5 text-[11px] bg-slate-50 rounded px-1.5 py-1">
                              <span className={`shrink-0 px-1 rounded text-white font-bold ${p.apDungCho === "quan" ? "bg-teal-700" : "bg-[#2B4C3E]"}`}>
                                {p.apDungCho === "quan" ? "Q" : "A"}
                              </span>
                              <select 
                                className="flex-1 font-medium text-slate-700 bg-transparent border-b border-slate-300 outline-none hover:border-[#2B4C3E] focus:border-[#2B4C3E] w-24 text-[11px]"
                                value={p.maPL}
                                onChange={e => {
                                  const v = khoPhuLieuReals.find(x => x.maVT === e.target.value);
                                  if(v) {
                                    setDsPhuLieu(prev => {
                                      const next = [...prev];
                                      next[i] = { ...next[i], maPL: v.maVT, tenPL: v.tenVT, donGia: v.donGia || 0, dvt: v.dvt || "cái" };
                                      return next;
                                    });
                                  }
                                }}
                              >
                                {khoPhuLieuReals.map(v => <option key={v.maVT} value={v.maVT} className="text-black bg-white">{v.tenChuan || v.tenVT}{v.maMoi ? ` (${v.maMoi})` : ""}</option>)}
                              </select>
                              <div className="flex items-center shrink-0">
                                <input 
                                  type="number" 
                                  className="w-10 text-right text-slate-600 bg-transparent border-b border-slate-300 outline-none hover:border-[#2B4C3E] focus:border-[#2B4C3E] text-[11px]" 
                                  value={p.soLuong} 
                                  onChange={e => {
                                    setDsPhuLieu(prev => {
                                      const next = [...prev];
                                      next[i] = { ...next[i], soLuong: parseInt(e.target.value) || 0 };
                                      return next;
                                    });
                                  }} 
                                />
                                <span className="text-slate-500 ml-0.5">{p.dvt}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setDsPhuLieu(prev => prev.filter((_, pi) => pi !== i))}
                                className="shrink-0 text-rose-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Right: Details & Sizes */}
                  {(() => {
                    // Pre-calculate prices
                    const v = khoVaiReals.find((x: any) => x.maVT === mau.maVai);
                    const donGiaKho = v ? (v.donGia || 0) : 0;
                    const donGiaAo = (mau.donGiaVai !== undefined && mau.donGiaVai !== null && mau.donGiaVai > 0)
                      ? mau.donGiaVai
                      : donGiaKho;
                    let tienVaiAo1SP = (mau.dinhMuc || 0) * donGiaAo;
                    
                    let vQuan = null;
                    let donGiaQuanKho = 0;
                    let donGiaQuan = 0;
                    let tienVaiQuan1SP = 0;
                    if (isBo && mau.maVaiQuan) {
                      vQuan = khoVaiReals.find((x: any) => x.maVT === mau.maVaiQuan);
                      donGiaQuanKho = vQuan ? (vQuan.donGia || 0) : 0;
                      donGiaQuan = (mau.donGiaVaiQuan !== undefined && mau.donGiaVaiQuan !== null && mau.donGiaVaiQuan > 0)
                        ? mau.donGiaVaiQuan
                        : donGiaQuanKho;
                      tienVaiQuan1SP = (mau.dinhMucQuan || 0) * donGiaQuan;
                    }
                    
                    const tienVai1SP = tienVaiAo1SP + tienVaiQuan1SP;
                    const tongTienVaiMau = tienVai1SP * (mau.slDuKien || 0);

                    return (
                      <div className={`flex-1 min-w-0 grid grid-cols-1 ${isBo ? 'md:grid-cols-[minmax(0,380px)_minmax(0,1fr)]' : ''} gap-4 md:gap-5`}>
                        {/* CỘT 1: Áo và Thông tin dùng chung */}
                        <div className="flex flex-col gap-2 min-w-0 min-h-[300px] rounded-lg border-2 border-blue-300 bg-white/95 p-2 text-xs shadow-sm [&_input]:py-1 [&_select]:py-1 [&_textarea]:py-1">
                          <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 border-b border-blue-200 pb-2">Thông tin áo</div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 mb-1 block">Mã SKU Biến Thể</label>
                            <input 
                              type="text"
                              className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold text-emerald-700" 
                              placeholder="VD: SP001-DEN"
                              value={mau.maSKU || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, maSKU: val } : m));
                              }}
                            />
                          </div>

                          {isBo ? (
                            <div className="p-2 bg-blue-50/50 rounded border border-blue-200 flex flex-col gap-2">
                              <div>
                                <div className="text-[10px] font-bold text-blue-700 mb-1">ÁO - Kho Vải</div>
                                <select 
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.maVai}
                                  onChange={(e) => handleChonVai(idx, e.target.value, "ao")}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv) => (
                                    <option key={kv.maVT} value={kv.maVT}>{getVaiOptionLabel(kv)}</option>
                                  ))}
                                </select>
                                {mau.maVai && (() => {
                                  const v = khoVaiReals.find((x) => x.maVT === mau.maVai);
                                  if (!v) return null;
                                  const g3k = getChiTietGia3Khau(v.maVT, v.donGia, v.tenVT, v.mauSac);
                                  return (
                                    <div className="mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/40 rounded border border-sky-200 dark:border-sky-800 text-[10px] text-sky-800 dark:text-sky-300 flex items-center justify-between flex-wrap gap-1">
                                      <span className="font-semibold">
                                        🧵 Sợi {g3k.chiPhiSoi.toLocaleString()}đ + 🏭 Dệt {g3k.giaDet.toLocaleString()}đ + 🧪 Nhuộm {g3k.chiPhiNhuom.toLocaleString()}đ
                                      </span>
                                      <span className="font-bold font-mono">
                                        = {(v.donGia || 0).toLocaleString('vi-VN')} đ/kg
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/áo):</div>
                                  <input 
                                    type="number" step="0.0001"
                                    className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                    value={mau.dinhMuc}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, dinhMuc: val } : m));
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] font-bold text-blue-700">Đơn giá vải áo (đ/kg):</div>
                                    {donGiaKho > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVai: donGiaKho } : m))}
                                        className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                        title="Click để đồng bộ đơn giá từ Kho vải"
                                      >
                                        ✓ Kho: {donGiaKho.toLocaleString('vi-VN')} đ
                                      </button>
                                    )}
                                  </div>
                                  <input 
                                    type="number" step="1000"
                                    className="w-full px-2 py-1.5 border border-blue-300 text-sm rounded font-bold text-blue-800 bg-blue-50/30" 
                                    placeholder={donGiaKho > 0 ? String(donGiaKho) : "VD: 91000"}
                                    value={mau.donGiaVai !== undefined && mau.donGiaVai !== null && mau.donGiaVai > 0 ? mau.donGiaVai : (donGiaKho > 0 ? donGiaKho : "")}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVai: val } : m));
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2 p-1.5 bg-fuchsia-50/60 border border-fuchsia-200 rounded">
                                <label className="text-[10px] font-bold text-fuchsia-700 block mb-1">Màu phối (tham khảo, không tính định mức)</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {(mau.mauPhoi || []).length === 0 && <span className="text-[11px] text-fuchsia-400 italic">Chưa có màu phối</span>}
                                  {(mau.mauPhoi || []).map((ten, mpIdx) => (
                                    <span key={mpIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-[11px] font-medium">
                                      {ten}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, mauPhoi: (m.mauPhoi || []).filter((_, mi) => mi !== mpIdx) } : m));
                                        }}
                                        className="hover:text-fuchsia-950"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Kho Vải Chính</label>
                                <select 
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.maVai}
                                  onChange={(e) => handleChonVai(idx, e.target.value, "ao")}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv) => (
                                    <option key={kv.maVT} value={kv.maVT}>{getVaiOptionLabel(kv)}</option>
                                  ))}
                                </select>
                                {mau.maVai && (() => {
                                  const v = khoVaiReals.find((x) => x.maVT === mau.maVai);
                                  if (!v) return null;
                                  const g3k = getChiTietGia3Khau(v.maVT, v.donGia, v.tenVT, v.mauSac);
                                  return (
                                    <div className="mt-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/40 rounded border border-sky-200 dark:border-sky-800 text-[10px] text-sky-800 dark:text-sky-300 flex items-center justify-between flex-wrap gap-1">
                                      <span className="font-semibold">
                                        🧵 Sợi {g3k.chiPhiSoi.toLocaleString()}đ + 🏭 Dệt {g3k.giaDet.toLocaleString()}đ + 🧪 Nhuộm {g3k.chiPhiNhuom.toLocaleString()}đ
                                      </span>
                                      <span className="font-bold font-mono">
                                        = {(v.donGia || 0).toLocaleString('vi-VN')} đ/kg
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/sp):</label>
                                  <input 
                                    type="number" step="0.0001"
                                    className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                    value={mau.dinhMuc}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, dinhMuc: val } : m));
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-[10px] font-bold text-blue-700 block">Đơn giá vải (đ/kg):</label>
                                    {donGiaKho > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVai: donGiaKho } : m))}
                                        className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                        title="Click để đồng bộ đơn giá từ Kho vải"
                                      >
                                        ✓ Kho: {donGiaKho.toLocaleString('vi-VN')} đ
                                      </button>
                                    )}
                                  </div>
                                  <input 
                                    type="number" step="1000"
                                    className="w-full px-2 py-1.5 border border-blue-300 text-sm rounded font-bold text-blue-800 bg-blue-50/30" 
                                    placeholder={donGiaKho > 0 ? String(donGiaKho) : "VD: 91000"}
                                    value={mau.donGiaVai !== undefined && mau.donGiaVai !== null && mau.donGiaVai > 0 ? mau.donGiaVai : (donGiaKho > 0 ? donGiaKho : "")}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVai: val } : m));
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="bg-fuchsia-50/60 border border-fuchsia-200 rounded p-2">
                                <div className="flex flex-wrap items-center justify-between mb-1.5 gap-2">
                                  <label className="text-[10px] font-bold text-fuchsia-700">Màu phối (tham khảo, không tính định mức)</label>
                                  <select
                                    className="text-[11px] px-1.5 py-1 border border-fuchsia-200 rounded bg-white w-full sm:w-auto sm:max-w-[160px]"
                                    value=""
                                    onChange={(e) => {
                                      const ten = e.target.value;
                                      if (!ten) return;
                                      const next = [...dsMau];
                                      const dsHienTai = next[idx].mauPhoi || [];
                                      if (!dsHienTai.includes(ten)) {
                                        next[idx].mauPhoi = [...dsHienTai, ten];
                                        setDsMau(next);
                                      }
                                      e.target.value = "";
                                    }}
                                  >
                                    <option value="">+ Thêm màu phối...</option>
                                    {NHOM_MAU.map((nhom) => (
                                      <optgroup key={nhom} label={nhom}>
                                        {getDistinctColorOptions(mau.ten, mau.mauPhoi || []).filter((sw) => sw.nhom === nhom).map((sw) => (
                                          <option key={sw.id} value={sw.ten}>{sw.ten}</option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(mau.mauPhoi || []).length === 0 && <span className="text-[11px] text-fuchsia-400 italic">Chưa có màu phối</span>}
                                  {(mau.mauPhoi || []).map((ten, mpIdx) => (
                                    <span key={mpIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-800 text-[11px] font-medium">
                                      {ten}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = [...dsMau];
                                          next[idx].mauPhoi = (next[idx].mauPhoi || []).filter((_, i) => i !== mpIdx);
                                          setDsMau(next);
                                        }}
                                        className="hover:text-fuchsia-950"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block text-blue-700 mb-1">SL Dự kiến cắt (Màu này):</label>
                            <input
                              type="number"
                              min="0"
                              className="w-full px-2 py-1.5 border-2 border-blue-400 text-sm rounded font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={mau.slDuKien === 0 ? "" : mau.slDuKien}
                              placeholder="Nhập số lượng..."
                              onChange={(e) => {
                                const valStr = e.target.value;
                                const newVal = valStr === "" ? 0 : parseInt(valStr, 10);
                                const finalVal = isNaN(newVal) ? 0 : Math.max(0, newVal);
                                
                                setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, slDuKien: finalVal } : m));
                                
                                // Cập nhật Tổng SL
                                setTongSL(prev => {
                                  const nextDs = dsMau.map((m, i) => i === idx ? { ...m, slDuKien: finalVal } : m);
                                  return nextDs.reduce((sum, m) => sum + (m.slDuKien || 0), 0);
                                });
                                
                                // Cập nhật số lượng vật tư của màu này
                                setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: finalVal } : p));
                              }}
                              onBlur={(e) => {
                                const rawVal = parseInt(e.target.value, 10);
                                const safeVal = isNaN(rawVal) || rawVal < 0 ? 0 : rawVal;
                                if (safeVal !== mau.slDuKien) {
                                  setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, slDuKien: safeVal } : m));
                                  setTongSL(prev => {
                                    const nextDs = dsMau.map((m, i) => i === idx ? { ...m, slDuKien: safeVal } : m);
                                    return nextDs.reduce((sum, m) => sum + (m.slDuKien || 0), 0);
                                  });
                                  setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: safeVal } : p));
                                }
                              }}
                            />
                            {soSpTrongSoDo > 0 && mau.slDuKien > 0 && mau.slDuKien % soSpTrongSoDo !== 0 && (() => {
                              const duoi = Math.max(soSpTrongSoDo, Math.floor(mau.slDuKien / soSpTrongSoDo) * soSpTrongSoDo);
                              const tren = duoi + soSpTrongSoDo;
                              return (
                                <div className="mt-1.5 px-2 py-1.5 rounded bg-amber-50 border border-amber-300 text-[11px] text-amber-800 flex items-center gap-2 flex-wrap">
                                  <span>⚠️ {mau.slDuKien} chưa khớp bội số tỉ lệ ({soSpTrongSoDo}/lượt). Chọn số gần nhất:</span>
                                  <button type="button" onClick={() => { 
                                    setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, slDuKien: duoi } : m));
                                    setTongSL(prev => {
                                      const nextDs = dsMau.map((m, i) => i === idx ? { ...m, slDuKien: duoi } : m);
                                      return nextDs.reduce((sum, m) => sum + (m.slDuKien || 0), 0);
                                    });
                                    setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: duoi } : p));
                                  }} className="px-2 py-0.5 rounded bg-white border border-amber-400 font-bold hover:bg-amber-100">{duoi}</button>
                                  <button type="button" onClick={() => { 
                                    setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, slDuKien: tren } : m));
                                    setTongSL(prev => {
                                      const nextDs = dsMau.map((m, i) => i === idx ? { ...m, slDuKien: tren } : m);
                                      return nextDs.reduce((sum, m) => sum + (m.slDuKien || 0), 0);
                                    });
                                    setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: tren } : p));
                                  }} className="px-2 py-0.5 rounded bg-white border border-amber-400 font-bold hover:bg-amber-100">{tren}</button>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <div className="text-[10px] font-bold text-slate-500 mb-2 flex items-center justify-between">
                              <span>Tự động bung size theo tỉ lệ:</span>
                              {mau.phanBoSize && mau.phanBoSize.length > 0 && (
                                <span className={`font-bold ${(mau.phanBoSize.reduce((s, p) => s + p.sl, 0)) !== (mau.slDuKien || 0) ? "text-amber-600" : "text-emerald-600"}`}>
                                  Tổng đã chia: {mau.phanBoSize.reduce((s, p) => s + p.sl, 0)}/{mau.slDuKien || 0}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {mau.phanBoSize && mau.phanBoSize.map(pb => (
                                 <div key={pb.size} className="flex flex-col items-center bg-white border rounded p-1 w-12">
                                   <span className="text-[10px] font-bold text-slate-400">{pb.size}</span>
                                   <span className="text-sm font-bold text-slate-700">{pb.sl}</span>
                                 </div>
                              ))}
                              {(!mau.phanBoSize || mau.phanBoSize.length === 0) && <span className="text-xs text-slate-400">Nhập SL Dự kiến để chia size...</span>}
                            </div>
                          </div>

                          <div className="bg-amber-50 p-2 rounded border border-amber-200">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold text-amber-700">Giá vải / 1 SP {isBo ? "(Áo+Quần)" : ""}</div>
                              {tienVai1SP > 0 && (
                                <div className="text-[10px] font-medium text-amber-700">
                                  {isBo ? (
                                    <span>Áo: {formatVND(tienVaiAo1SP)} + Quần: {formatVND(tienVaiQuan1SP)}</span>
                                  ) : (
                                    <span>{mau.dinhMuc} kg × {formatVND(donGiaAo)}/kg</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-sm font-bold text-amber-900 mt-0.5">{formatVND(tienVai1SP)}</div>
                          </div>
                        </div>

                        {/* CỘT 2: Quần và Thông tin Bổ sung (Ghi chú, Tổng tiền) */}
                        <div className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-2 min-w-0 min-h-[300px] rounded-lg border-2 border-teal-300 bg-white/95 p-2 text-xs shadow-sm [&_input]:py-1 [&_select]:py-1 [&_textarea]:py-1">
                          {isBo && (
                            <div
                              className="relative w-[240px] h-[320px] max-w-full aspect-[3/4] mx-auto md:row-span-2 self-start bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer group hover:border-teal-500 transition-colors flex items-center justify-center z-10 hover:z-50 overflow-hidden shadow-sm"
                              onClick={() => handleColorImageUpload(idx, "quan")}
                            >
                              {uploadingColor?.idx === idx && uploadingColor?.phan === "quan" && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex flex-col items-center justify-center rounded-lg z-30 pointer-events-none">
                                  <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin mb-1.5" />
                                  <span className="text-xs font-bold text-white">Đang tải ảnh...</span>
                                </div>
                              )}
                              {mau.imgQuan ? (
                                <>
                                  <img src={mau.imgQuan} alt={`Ảnh màu quần ${mau.ten || idx + 1}`} className="w-full h-full object-cover object-top rounded-lg group-hover:scale-[1.75] transition-transform duration-300 group-hover:shadow-2xl origin-center" style={{ imageRendering: "-webkit-optimize-contrast" }} />
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-teal-700/90 text-white text-[10px] font-bold">QUẦN</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDsMau(prev => {
                                        const next = [...prev];
                                        next[idx] = { ...next[idx], imgQuan: "" };
                                        return next;
                                      });
                                      toast.info("Đã gỡ ảnh màu quần");
                                    }}
                                    className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-md z-20 transition-all opacity-80 hover:opacity-100"
                                    title="Xoá ảnh này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="absolute bottom-0 inset-x-0 py-1.5 bg-black/60 text-white text-xs font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity">Bấm để thay ảnh quần</span>
                                </>
                              ) : (
                                <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity">
                                  <Plus className="w-8 h-8 text-teal-600" />
                                  <span className="text-sm mt-2 text-slate-600 font-bold">Tải ảnh màu quần</span>
                                </div>
                              )}
                            </div>
                          )}
                          {isBo && <div className="text-[10px] font-black uppercase tracking-wider text-teal-800 border-b border-teal-300 pb-2 md:col-start-2">Thông tin quần</div>}
                          {isBo && (
                            <div className="p-2 bg-teal-50/50 rounded border border-teal-200 flex flex-col gap-2 md:col-start-2">
                              <div>
                                <div className="text-[10px] font-bold text-teal-800 mb-1">QUẦN - Kho Vải</div>
                                <select 
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.maVaiQuan || ""}
                                  onChange={(e) => handleChonVai(idx, e.target.value, "quan")}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv) => (
                                    <option key={kv.maVT} value={kv.maVT}>{getVaiOptionLabel(kv)}</option>
                                  ))}
                                </select>
                                {mau.maVaiQuan && (() => {
                                  const v = khoVaiReals.find((x) => x.maVT === mau.maVaiQuan);
                                  if (!v) return null;
                                  const g3k = getChiTietGia3Khau(v.maVT, v.donGia, v.tenVT, v.mauSac);
                                  return (
                                    <div className="mt-1 px-2 py-1 bg-teal-50 dark:bg-teal-950/40 rounded border border-teal-200 dark:border-teal-800 text-[10px] text-teal-800 dark:text-teal-300 flex items-center justify-between flex-wrap gap-1">
                                      <span className="font-semibold">
                                        🧵 Sợi {g3k.chiPhiSoi.toLocaleString()}đ + 🏭 Dệt {g3k.giaDet.toLocaleString()}đ + 🧪 Nhuộm {g3k.chiPhiNhuom.toLocaleString()}đ
                                      </span>
                                      <span className="font-bold font-mono">
                                        = {(v.donGia || 0).toLocaleString('vi-VN')} đ/kg
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/quần):</div>
                                  <input 
                                    type="number" step="0.0001"
                                    className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                    value={mau.dinhMucQuan || ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, dinhMucQuan: val } : m));
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="text-[10px] font-bold text-teal-700">Đơn giá vải quần (đ/kg):</div>
                                    {donGiaQuanKho > 0 && (
                                      <button
                                        type="button"
                                        onClick={() => setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVaiQuan: donGiaQuanKho } : m))}
                                        className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                        title="Click để đồng bộ đơn giá từ Kho vải"
                                      >
                                        ✓ Kho: {donGiaQuanKho.toLocaleString('vi-VN')} đ
                                      </button>
                                    )}
                                  </div>
                                  <input 
                                    type="number" step="1000"
                                    className="w-full px-2 py-1.5 border border-teal-300 text-sm rounded font-bold text-teal-800 bg-teal-50/30" 
                                    placeholder={donGiaQuanKho > 0 ? String(donGiaQuanKho) : "VD: 91000"}
                                    value={mau.donGiaVaiQuan !== undefined && mau.donGiaVaiQuan !== null && mau.donGiaVaiQuan > 0 ? mau.donGiaVaiQuan : (donGiaQuanKho > 0 ? donGiaQuanKho : "")}
                                    onChange={(e) => {
                                      const valStr = e.target.value;
                                      const val = valStr === "" ? 0 : parseFloat(valStr) || 0;
                                      setDsMau(prev => prev.map((m, i) => i === idx ? { ...m, donGiaVaiQuan: val } : m));
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <select
                                  className="text-[11px] px-2 py-1.5 border border-fuchsia-200 rounded bg-white w-full font-medium text-fuchsia-800 focus:outline-none focus:border-fuchsia-400 shadow-sm"
                                  value=""
                                  onChange={(e) => {
                                    const ten = e.target.value;
                                    if (!ten) return;
                                    const next = [...dsMau];
                                    const dsHienTai = next[idx].mauPhoi || [];
                                    if (!dsHienTai.includes(ten)) {
                                      next[idx].mauPhoi = [...dsHienTai, ten];
                                      setDsMau(next);
                                    }
                                    e.target.value = "";
                                  }}
                                >
                                  <option value="">+ Thêm màu phối...</option>
                                  {NHOM_MAU.map((nhom) => (
                                    <optgroup key={nhom} label={nhom}>
                                      {getDistinctColorOptions(mau.ten, mau.mauPhoi || []).filter((sw) => sw.nhom === nhom).map((sw) => (
                                        <option key={sw.id} value={sw.ten}>{sw.ten}</option>
                                      ))}
                                    </optgroup>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}

                          {isBo && (
                            <button
                              type="button"
                              onClick={() => themVatTuTheoMau(idx, "quan")}
                              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-teal-700 text-white text-xs font-bold rounded hover:bg-teal-800 transition md:col-start-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Vật tư quần
                            </button>
                          )}

                          <div className="flex flex-col flex-1 bg-amber-50/50 p-2 rounded border border-amber-200/50 md:col-span-2">
                            <label className="text-[10px] font-bold text-amber-700 mb-1">Ghi chú (Màu sắc phối, chú ý kỹ thuật may):</label>
                            <textarea 
                              className="w-full flex-1 px-2 py-1.5 border border-amber-200 rounded text-sm focus:outline-none focus:border-amber-400 resize-none bg-white"
                              placeholder="Nhập ghi chú kỹ thuật riêng cho màu này..."
                              value={mau.ghiChu || ""}
                              onChange={(e) => {
                                const next = [...dsMau]; 
                                next[idx].ghiChu = e.target.value; 
                                setDsMau(next);
                              }}
                            />
                          </div>

                          <div className="bg-emerald-50 p-2 rounded border border-emerald-200 md:col-span-2">
                            <div className="flex items-center justify-between">
                              <div className="text-[10px] font-bold text-emerald-700">Tổng tiền vải màu này ({mau.slDuKien || 0} SP)</div>
                              <div className="text-sm font-bold text-emerald-900">{formatVND(tongTienVaiMau)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                );
              })}
            </div>

            {/* Nguyên Phụ Liệu - tách theo Áo/Quần, không còn là 1 bảng gộp chung */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
              {([["ao", "👕 Vật tư ÁO (bo cổ, bo tay, nút, nhãn...)"], ...(isBo ? [["quan", "👖 Vật tư QUẦN (thun/dây rút, nhãn...)"]] as const : [])] as const).map(([nhom, tieuDe]) => {
                const dsNhom = dsPhuLieu.filter(p => (nhom === "ao" ? (p.apDungCho || "ao") === "ao" : p.apDungCho === "quan"));
                return (
                  <div key={nhom}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-800 text-sm">{tieuDe}</h3>
                      <button
                        onClick={() => {
                          setDsPhuLieu(prev => [...prev, { maPL: `PL-MOI-${Date.now()}`, tenPL: "", soLuong: (tongSL as number) || 500, donGia: 0, dvt: "cái", apDungCho: nhom }]);
                        }}
                        className="px-3 py-1 bg-white border-2 border-[#2B4C3E] text-[#2B4C3E] text-xs rounded hover:bg-[#2B4C3E]/10 transition flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3"/> Nguyên liệu mới
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dsNhom.length === 0 && <div className="text-xs text-slate-400 italic px-1">Chưa có vật tư nào</div>}
                      {dsNhom.map((p) => {
                        const idx = dsPhuLieu.indexOf(p);
                        const laNguyenLieuMoi = !khoPhuLieuReals.some(v => v.maVT === p.maPL);
                        return (
                          <div key={idx} className="flex flex-col sm:grid sm:grid-cols-13 gap-2 sm:items-center bg-white p-2 rounded shadow-sm">
                            <select
                              className={`sm:col-span-2 text-[11px] p-1.5 border rounded font-semibold ${p.mauIdx !== undefined ? "border-[#2B4C3E] text-[#2B4C3E]" : "border-slate-200 text-slate-400"}`}
                              value={p.mauIdx ?? ""}
                              title="Vật tư này đi với màu nào - hiển thị ngay trong card màu tương ứng"
                              onChange={e => {
                                const next = [...dsPhuLieu];
                                const mauIdxMoi = e.target.value === "" ? undefined : Number(e.target.value);
                                next[idx] = {
                                  ...next[idx],
                                  mauIdx: mauIdxMoi,
                                  ...(mauIdxMoi === undefined ? {} : { soLuong: dsMau[mauIdxMoi]?.slDuKien || 0 }),
                                };
                                setDsPhuLieu(next);
                              }}
                            >
                              <option value="">Dùng chung</option>
                              {dsMau.map((m, mi) => <option key={mi} value={mi}>Màu {mi + 1}{m.ten ? `: ${m.ten}` : ""}</option>)}
                            </select>
                            {laNguyenLieuMoi ? (
                              <input
                                className="sm:col-span-3 text-sm p-1.5 border-2 border-amber-300 rounded"
                                placeholder="Tên nguyên liệu mới..."
                                value={p.tenPL}
                                onChange={e => {
                                  const next = [...dsPhuLieu]; next[idx].tenPL = e.target.value; setDsPhuLieu(next);
                                }}
                              />
                            ) : (
                              <select className="sm:col-span-3 text-sm p-1.5 border rounded" value={p.maPL} onChange={e => {
                                const v = khoPhuLieuReals.find(x => x.maVT === e.target.value);
                                if(v) {
                                  const next = [...dsPhuLieu];
                                  next[idx] = { ...next[idx], maPL: v.maVT, tenPL: v.tenVT, donGia: v.donGia || 0, dvt: v.dvt || "cái" };
                                  setDsPhuLieu(next);
                                }
                              }}>
                                {khoPhuLieuReals.map(v => <option key={v.maVT} value={v.maVT} className="text-black bg-white">{v.tenChuan || v.tenVT}{v.maMoi ? ` (${v.maMoi})` : ""}</option>)}
                              </select>
                            )}
                            <div className="flex gap-2 sm:contents">
                              <input type="number" className="flex-1 sm:col-span-2 text-sm p-1.5 border rounded min-w-0" value={p.soLuong} onChange={e => {
                                const next = [...dsPhuLieu]; next[idx].soLuong = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                              }} placeholder="Số lượng..." />
                              {laNguyenLieuMoi ? (
                                <input className="w-16 sm:w-auto sm:col-span-1 text-xs p-1 border rounded text-center" value={p.dvt} placeholder="ĐVT" onChange={e => {
                                  const next = [...dsPhuLieu]; next[idx].dvt = e.target.value; setDsPhuLieu(next);
                                }} />
                              ) : (
                                <div className="w-16 sm:w-auto sm:col-span-1 text-xs text-center text-slate-500 flex items-center justify-center">{p.dvt}</div>
                              )}
                            </div>
                            <div className="flex gap-2 items-center sm:contents">
                              <input type="number" className="flex-1 sm:col-span-2 text-sm p-1.5 border rounded min-w-0" value={p.donGia} onChange={e => {
                                const next = [...dsPhuLieu]; next[idx].donGia = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                              }} placeholder="Đơn giá..." />
                              <div className="sm:col-span-2 text-right text-sm font-bold text-emerald-600 whitespace-nowrap">{formatVNDShort(p.soLuong * p.donGia)}</div>
                              <button onClick={() => setDsPhuLieu(prev => prev.filter((_, i) => i !== idx))} className="sm:col-span-1 text-rose-500 p-1 flex justify-center shrink-0"><Trash2 className="w-4 h-4"/></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

              {/* BẢNG THỐNG KÊ VẢI VÀ PHỤ LIỆU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-[#103D4A] text-white p-5 rounded-2xl shadow-xl shadow-[#103D4A]/20 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Tổng chi phí vải / SP</div>
                  <div className="text-3xl font-black text-center text-white drop-shadow-md">
                    {formatVND(tongTienVai / validTongSL)}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 text-xs font-medium text-slate-300 flex justify-between items-center relative z-10">
                     <div><span className="opacity-70">Tổng tiền vải:</span> <span className="text-slate-100 ml-1">{formatVND(tongTienVai)}</span></div>
                     <div><span className="opacity-70">Số màu:</span> <span className="text-slate-100 ml-1 font-bold">{dsMau.length}</span></div>
                  </div>
                </div>

                <div className="bg-[#103D4A] text-white p-5 rounded-2xl shadow-xl shadow-[#103D4A]/20 flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Tổng chi phí phụ liệu / SP</div>
                  <div className="text-3xl font-black text-center text-white drop-shadow-md">
                    {formatVND(tongTienPhuLieu / validTongSL)}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 text-xs font-medium text-slate-300 flex justify-between items-center relative z-10">
                     <div><span className="opacity-70">Tổng phụ liệu:</span> <span className="text-slate-100 ml-1">{formatVND(tongTienPhuLieu)}</span></div>
                     <div><span className="opacity-70">Số khoản mục:</span> <span className="text-slate-100 ml-1 font-bold">{dsPhuLieu.length}</span></div>
                  </div>
                </div>
              </div>

            </div>

          {/* KHỐI 3: GIA CÔNG VÀ ĐƠN GIÁ */}
          <div className="order-last bg-[#F1E2BE] p-5 rounded-lg border border-amber-300/80 shadow-sm mb-2">
            <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide drop-shadow-sm">
              MẪU CÔNG ĐOẠN & CHI PHÍ
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Công đoạn */}
              <div className="bg-white/20 p-4 rounded-xl flex flex-col gap-4">
                <div className="flex justify-between items-center border-b border-black/10 pb-2">
                  <h3 className="font-bold text-slate-800">1. GIA CÔNG SẢN XUẤT</h3>
<div className="flex items-center gap-2">
<select 
                    className="px-2 py-1 text-xs border rounded shadow-sm bg-white font-bold text-[#2B4C3E]"
                    value={mauCongDoan}
                    onChange={(e) => {
                      setMauCongDoan(e.target.value);
                      setPhanCong(dsMauCongDoan.find(x => x.id === e.target.value)?.giaCong || []);
                    }}
                  >
                    {dsMauCongDoan.map(m => <option key={m.id} value={m.id}>Mẫu: {m.ten}</option>)}
                  </select>
<button type="button" onClick={() => setShowTaoMauCD(true)} className="px-2 py-1 text-xs bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap shadow-sm">+ Tạo mẫu</button>
</div>
                </div>
                
                <div className="space-y-2">
                  {visiblePhanCong.map((kh, idx) => {
                    if (!kh) return null;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                        <div className="col-span-3 font-semibold text-slate-700 text-sm truncate" title={kh.tenCongDoan}>{kh.tenCongDoan}</div>
                        <div className="col-span-6 flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border flex-shrink-0 text-[10px] ${kh.loaiNguoi === "xuong_ngoai" || isOutsourceStage(kh.tenCongDoan) ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            {kh.nguoiMa ? (
                              INTERNAL_NAMES[kh.nguoiMa] ? INTERNAL_NAMES[kh.nguoiMa].substring(0, 2) :
                              (nhanVienOptions.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || 
                               DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || 
                               (kh.nguoiTen ? kh.nguoiTen.replace("Xưởng ", "").substring(0, 2) : "GC"))
                            ) : (isOutsourceStage(kh.tenCongDoan) ? "GC" : "NV")}
                          </div>
                          {(() => {
                            const stageOpts = getDoiTuongOptions(kh.tenCongDoan, loaiSP, nhanVienOptions);
                            const hasSelected = stageOpts.some(opt => opt.ma === kh.nguoiMa);
                            return (
                              <select 
                                className={`flex-1 min-w-0 px-2 py-1.5 border rounded text-sm focus:outline-none ${kh.nguoiMa ? "border-slate-200 font-medium text-slate-800" : "border-rose-300 bg-rose-50/50"}`}
                                value={kh.nguoiMa || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const nv = nhanVienOptions.find(n => n.ma === val);
                                  const dt = DOI_TAC_GIA_CONG.find(d => d.ma === val);
                                  const selectedName = INTERNAL_NAMES[val] || nv?.ten || dt?.tenDonVi || val;
                                  const isOutsource = val.startsWith("GC-");
                                  setPhanCong(p => {
                                    const next = [...(p as any[])];
                                    const actualIdx = next.findIndex(x => x.tenCongDoan === kh.tenCongDoan);
                                    if (actualIdx !== -1) {
                                      next[actualIdx] = { 
                                        ...next[actualIdx], 
                                        nguoiMa: val, 
                                        nguoiTen: selectedName,
                                        loaiNguoi: isOutsource ? "xuong_ngoai" : "noi_bo"
                                      };
                                    }
                                    return next as any;
                                  });
                                }}
                              >
                                <option value="">-- Chọn NV/Xưởng --</option>
                                {kh.nguoiMa && !hasSelected && (
                                  <option value={kh.nguoiMa}>{kh.nguoiTen || INTERNAL_NAMES[kh.nguoiMa] || kh.nguoiMa}</option>
                                )}
                                {stageOpts.map(opt => (
                                  <option key={opt.ma} value={opt.ma}>{opt.ten}</option>
                                ))}
                              </select>
                            );
                          })()}
                        </div>
                        <div className="col-span-3 relative">
                          <input 
                            type="number" min={0}
                            className={`w-full px-2 py-1.5 border rounded text-sm text-right pr-6 ${Number(kh.donGia) > 0 ? "border-slate-200" : "border-rose-300 bg-rose-50/50"}`}
                            value={kh.donGia}
                            onChange={(e) => {
                              setPhanCong(p => {
                                const next = [...(p as any[])];
                                const actualIdx = next.findIndex(x => x.tenCongDoan === kh.tenCongDoan);
                                if (actualIdx !== -1) {
                                  next[actualIdx] = { ...next[actualIdx], donGia: parseInt(e.target.value) || 0 };
                                }
                                return next as any;
                              });
                            }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">đ</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Summary block cho Gia công sản xuất */}
                <div className="bg-[#103D4A] text-white p-5 rounded-2xl shadow-xl shadow-[#103D4A]/20 mt-auto flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Tổng gia công sản xuất / SP</div>
                  <div className="text-3xl font-black text-center text-white drop-shadow-md">
                    {formatVND(giaCong1SP)}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 text-xs font-medium text-slate-300 flex justify-between items-center relative z-10">
                     <div><span className="opacity-70">Nội bộ:</span> <span className="text-slate-100 ml-1">{formatVND((Array.isArray(phanCong) ? phanCong : []).filter(kh => !isOutsourceStage(kh.tenCongDoan)).reduce((sum, kh) => sum + (kh.donGia || 0), 0))}</span></div>
                     <div><span className="opacity-70">Gia công ngoài:</span> <span className="text-slate-100 ml-1">{formatVND((Array.isArray(phanCong) ? phanCong : []).filter(kh => isOutsourceStage(kh.tenCongDoan)).reduce((sum, kh) => sum + (kh.donGia || 0), 0))}</span></div>
                  </div>
                </div>
              </div>

              {/* Chi Phí Cố Định */}
              <div className="flex flex-col gap-4">
                <div className="bg-white/20 p-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-black/10 pb-2 mb-3">
                    <h3 className="font-bold text-slate-800">2. CHI PHÍ CỐ ĐỊNH / SẢN PHẨM</h3>
                    <div className="flex items-center gap-2">
                      <select 
                        className="px-2 py-1 text-xs border rounded shadow-sm bg-white font-bold text-[#2B4C3E]"
                        onChange={(e) => {
                          const m = dsMauChiPhi.find(x => x.id === e.target.value);
                          if (m) setChiPhiCoDinh(m.chiPhi);
                        }}
                      >
                        <option value="">-- Chọn mẫu --</option>
                        {dsMauChiPhi.map(m => <option key={m.id} value={m.id}>Mẫu: {m.ten}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowTaoMauChiPhi(true)} className="px-2 py-1 text-xs bg-violet-600 text-white rounded font-bold hover:bg-violet-700 whitespace-nowrap shadow-sm">+ Tạo mẫu</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(chiPhiCoDinh).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                        <span className="text-sm font-semibold text-slate-700">{key}</span>
                        <input type="number" className="w-24 px-2 py-1 text-sm text-right border rounded font-mono font-bold text-[#2B4C3E]" value={val} onChange={e => setChiPhiCoDinh(p => ({...p, [key]: parseInt(e.target.value)||0}))} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary block cho Chi phí cố định */}
                <div className="bg-[#103D4A] text-white p-5 rounded-2xl shadow-xl shadow-[#103D4A]/20 mt-auto flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="text-center text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">Tổng chi phí cố định / SP</div>
                  <div className="text-3xl font-black text-center text-white drop-shadow-md">
                    {formatVND(tongChiPhiCoDinh)}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 text-xs font-medium text-slate-300 flex justify-between items-center relative z-10">
                     <div><span className="opacity-70">Số khoản mục:</span> <span className="text-slate-100 ml-1 font-bold">{Object.keys(chiPhiCoDinh).length}</span></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overall Summary Box - span full width */}
            <div className="bg-[#103D4A] text-white p-8 rounded-2xl shadow-2xl shadow-[#103D4A]/20 mt-8 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400"></div>
               <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
               <div className="text-center text-sm font-bold text-slate-300 mb-3 uppercase tracking-[0.2em] relative z-10">Tổng chi phí bình quân / SP</div>
               <div className="text-5xl font-black text-center text-yellow-300 drop-shadow-lg tracking-tight relative z-10">
                 {formatVND(giaVonBinhQuan)}
               </div>
               <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap justify-center gap-x-12 gap-y-6 relative z-10">
                 <div className="flex flex-col items-center"><span className="text-slate-300/80 text-xs uppercase tracking-wider mb-1 font-semibold">Giá vải</span><span className="text-lg font-bold text-white drop-shadow-sm">{formatVND(binhQuanVai)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-slate-300/80 text-xs uppercase tracking-wider mb-1 font-semibold">Nguyên liệu</span><span className="text-lg font-bold text-white drop-shadow-sm">{formatVND(tongTienPhuLieu / validTongSL)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-slate-300/80 text-xs uppercase tracking-wider mb-1 font-semibold">Gia công</span><span className="text-lg font-bold text-white drop-shadow-sm">{formatVND(giaCong1SP)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-slate-300/80 text-xs uppercase tracking-wider mb-1 font-semibold">Cố định</span><span className="text-lg font-bold text-white drop-shadow-sm">{formatVND(tongChiPhiCoDinh)}</span></div>
               </div>
            </div>
          </div>
          
          {/* KHỐI 4: NHẬP THỰC TẾ - Đã chuyển sang kênh của tổ cắt */}

        </div>

        {/* Footer Buttons */}
        <div className="shrink-0 bg-white p-3 md:px-6 md:py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between border-t border-slate-200 rounded-b-xl gap-3 w-full">
          
          {/* Right Actions (Primary) - Đưa lên trên ở mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3 order-1 md:order-2 w-full md:w-auto">
            {/* Tam cap 2: xac nhan lenh da du dieu kien */}
            <button
              className={`flex-1 md:flex-none px-5 py-2 md:py-2.5 rounded-lg font-bold text-sm text-blue-700 bg-blue-50 border border-blue-200 transition-all text-center justify-center ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-100 hover:border-blue-300"}`}
              onClick={() => handleSave("DaTao")}
              disabled={isLocked}
            >
              Hoàn tất lệnh
            </button>

            {/* Tam cap 1 (CTA chinh): chuyen sang khau san xuat tiep theo */}
            <button
              className={`flex-1 md:flex-none px-5 py-2 md:py-2.5 rounded-lg font-bold text-sm text-white bg-[#F0A619] transition-all flex items-center justify-center gap-2 ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[#d9930f] shadow-md shadow-[#F0A619]/30 hover:shadow-lg hover:shadow-[#F0A619]/40 hover:-translate-y-0.5"}`}
              onClick={() => handleSave("ChuyenTiep")}
              disabled={isLocked}
            >
              <Send className="w-4 h-4" />
              Lưu & chuyển khâu
            </button>
          </div>

          {/* Left Actions (Secondary) - Nằm dưới ở mobile */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 order-2 md:order-1 w-full md:w-auto">
            <button
              onClick={onClose}
              className="px-3 py-1.5 md:py-2 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              Đóng
            </button>
            
            <span className="hidden md:block w-px h-6 bg-slate-200 mx-1" />
            
            <button
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-sm text-slate-500 bg-transparent border border-slate-300 transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 hover:border-slate-400"}`}
              onClick={() => handleSave("Nhap")}
              disabled={isLocked}
            >
              Lưu nháp
            </button>
            
            <button
              onClick={handleInPhieuGiaCong}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-sm text-slate-600 bg-transparent border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> In phiếu
            </button>
            
            <div className="relative">
              <button
                onClick={() => setZaloPickerOpen(v => !v)}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-sm text-sky-600 bg-transparent border border-sky-300 hover:bg-sky-50 hover:border-sky-400 transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4" /> Zalo
              </button>
              {zaloPickerOpen && (
                <div className="absolute bottom-full mb-2 left-0 md:left-auto md:right-0 w-[calc(100vw-32px)] md:w-72 max-w-[280px] bg-white border border-slate-200 rounded-xl shadow-xl z-[150] overflow-hidden">
                  <div className="px-3 py-2 text-xs font-bold text-slate-500 bg-slate-50 border-b border-slate-200">
                    Chọn người nhận - họ chỉ thấy giá của chính mình
                  </div>
                  {phanCong.length === 0 && (
                    <div className="px-3 py-3 text-xs text-slate-400">Chưa có phân công gia công nào</div>
                  )}
                  {visiblePhanCong.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleShareZaloItem(item)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-sky-50 border-b border-slate-100 last:border-0 flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">{item.tenCongDoan} · {item.nguoiTen}</span>
                      <span className="text-xs text-slate-400">{item.soLuong ?? 0}×{(item.donGia ?? 0).toLocaleString("vi-VN")}đ</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>


  {/* Modal Tạo Mẫu Công Đoạn */}
  {showTaoMauCD && (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Tạo Mẫu Công Đoạn Mới</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-900 dark:text-slate-200">Tên Mẫu</label>
            <input className="w-full px-3 py-2 border dark:border-slate-700 rounded bg-transparent text-slate-900 dark:text-white" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\s/g, "") || "cd_" + Date.now() }))} />
          </div>
          {newMauCD.giaCong.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong.splice(index, 1);
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} className="text-rose-500 hover:bg-rose-500/20 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
                <input className="text-sm font-medium border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none flex-1 bg-transparent text-slate-900 dark:text-white" value={item.tenCongDoan} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index] = { ...newGiaCong[index], tenCongDoan: e.target.value };
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} />
              </div>
              <div className="flex items-center gap-1 w-32 border dark:border-slate-700 rounded px-2">
                <input type="number" className="w-full py-1 focus:outline-none bg-transparent text-slate-900 dark:text-white" placeholder="Đơn giá" value={item.donGia || ""} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index] = { ...newGiaCong[index], donGia: parseInt(e.target.value) || 0 };
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>
          ))}
          {/* Thêm công đoạn mới */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input 
              className="flex-1 px-3 py-1.5 border dark:border-slate-700 rounded text-sm bg-transparent text-slate-900 dark:text-white" 
              placeholder="Nhập tên công đoạn mới..." 
              value={customStepName} 
              onChange={e => setCustomStepName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && customStepName.trim()) {
                  const newId = "cd_" + Date.now();
                  setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                  setCustomStepName("");
                }
              }}
            />
            <button onClick={() => {
              if (customStepName.trim()) {
                const newId = "cd_" + Date.now();
                setNewMauCD(prev => ({ ...prev, giaCong: [...prev.giaCong, { id: newId, tenCongDoan: customStepName.trim(), nguoiMa: "", nguoiTen: "", donGia: 0 }] }));
                setCustomStepName("");
              }
            }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm rounded hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap">+ Thêm</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowTaoMauCD(false)} className="px-4 py-2 border dark:border-slate-700 rounded text-slate-600 dark:text-slate-400">Huỷ</button>
          <button onClick={() => {
            if (!newMauCD.ten.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; }
            themMauCongDoan({ id: newMauCD.id || "cd_" + Date.now(), ten: newMauCD.ten, giaCong: newMauCD.giaCong });
            setShowTaoMauCD(false);
            setMauCongDoan(newMauCD.id);
            setPhanCong(newMauCD.giaCong);
            toast.success("Đã lưu mẫu công đoạn");
          }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold">Lưu Mẫu</button>
        </div>
      </div>
    </div>
  )}

  {/* Modal Tạo Mẫu Chi Phí Cố Định */}
  {showTaoMauChiPhi && (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4 text-slate-900">Tạo Mẫu Chi Phí Mới</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-900">Tên Mẫu</label>
            <input className="w-full px-3 py-2 border rounded text-slate-900" placeholder="VD: Chi Phí Hàng Thun" value={newMauChiPhi.ten} onChange={e => setNewMauChiPhi(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\s/g, "") || "cp_" + Date.now() }))} />
          </div>
          {Object.entries(newMauChiPhi.chiPhi).map(([tenKhoan, donGia]) => (
            <div key={tenKhoan} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => {
                  const newChiPhi = { ...newMauChiPhi.chiPhi };
                  delete newChiPhi[tenKhoan];
                  setNewMauChiPhi(prev => ({ ...prev, chiPhi: newChiPhi }));
                }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium flex-1 text-slate-900">{tenKhoan}</span>
              </div>
              <div className="flex items-center gap-1 w-32 border rounded px-2">
                <input type="number" className="w-full py-1 focus:outline-none bg-transparent text-slate-900" placeholder="Đơn giá" value={donGia || ""} onChange={e => {
                  const newChiPhi = { ...newMauChiPhi.chiPhi };
                  newChiPhi[tenKhoan] = parseInt(e.target.value) || 0;
                  setNewMauChiPhi(prev => ({ ...prev, chiPhi: newChiPhi }));
                }} />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>
          ))}
          {/* Thêm khoản chi phí mới */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
            <input 
              className="flex-1 px-3 py-1.5 border rounded text-sm text-slate-900" 
              placeholder="Nhập khoản chi phí mới..." 
              value={customChiPhiName} 
              onChange={e => setCustomChiPhiName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && customChiPhiName.trim()) {
                  setNewMauChiPhi(prev => ({ ...prev, chiPhi: { ...prev.chiPhi, [customChiPhiName.trim()]: 0 } }));
                  setCustomChiPhiName("");
                }
              }}
            />
            <button onClick={() => {
              if (customChiPhiName.trim()) {
                setNewMauChiPhi(prev => ({ ...prev, chiPhi: { ...prev.chiPhi, [customChiPhiName.trim()]: 0 } }));
                setCustomChiPhiName("");
              }
            }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowTaoMauChiPhi(false)} className="px-4 py-2 border rounded text-slate-600">Huỷ</button>
          <button onClick={() => {
            if (!newMauChiPhi.ten.trim()) { toast.error("Vui lòng nhập tên mẫu"); return; }
            themMauChiPhi({ id: newMauChiPhi.id || "cp_" + Date.now(), ten: newMauChiPhi.ten, chiPhi: newMauChiPhi.chiPhi });
            setShowTaoMauChiPhi(false);
            setChiPhiCoDinh(newMauChiPhi.chiPhi);
            toast.success("Đã lưu mẫu chi phí");
          }} className="px-4 py-2 bg-violet-600 text-white rounded font-bold">Lưu Mẫu</button>
        </div>
      </div>
    </div>
  )}


      </div>

    {previewImage && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4" onClick={() => setPreviewImage(null)}>
        <div className="relative max-w-[95vw] max-h-[92vh] rounded-xl bg-white p-3 shadow-2xl" onClick={e => e.stopPropagation()}>
          <img src={previewImage.url} alt={previewImage.name} className="max-w-[90vw] max-h-[82vh] object-contain rounded-lg" />
          <div className="flex justify-center gap-2 pt-3">
            <a href={previewImage.url} download={previewImage.name} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-bold">Tải về</a>
            <button type="button" onClick={() => setPreviewImage(null)} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-sm font-bold">Đóng</button>
          </div>
        </div>
      </div>
    )}

    {/* ============ AI MOCKUP MODAL (MiniMax image-01) - component riêng ============ */}
    {aiMockupIdx !== null && (
      <AIMockupModal
        open={true}
        onClose={() => setAiMockupIdx(null)}
        onApply={applyAIMockup}
        colorIndex={aiMockupIdx}
        colorName={dsMau[aiMockupIdx]?.ten || ""}
        productName={tenSP}
        defaultPrompt={buildAiPrompt(aiMockupIdx)}
      />
    )}

    {/* ============ CHỌN PHIẾU IN A4 (LỆNH CẮT / KIỂM ĐẾM) ============ */}
    <ChonPhieuInModal
      open={printModalOpen}
      onClose={() => setPrintModalOpen(false)}
      lenhCat={currentPrintData}
    />

    {/* ============ TẠO BẢNG TỈ LỆ SIZE MODAL ============ */}
    {openAddSizeRatioModal && (
      <AddSizeRatioModal
        onClose={() => setOpenAddSizeRatioModal(false)}
        onSelectPreset={(p) => {
          setSelectedPresetId(p.id);
          setTiLeSize(p.value);
          handleSelectPreset(p.id);
          setOpenAddSizeRatioModal(false);
          toast.success(`Đã áp dụng bảng size: ${p.label}`);
        }}
      />
    )}
  </ResponsiveModal>
  );

}
