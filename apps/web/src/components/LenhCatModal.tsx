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
import { KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
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
import { SIZE_RATIO_5SIZE, SIZE_RATIO_4SIZE, SIZE_RATIO_PRESETS } from "@/lib/size-ratio-presets";
import { MAU_VAI, NHOM_MAU } from "@/lib/color-palette";
import { uploadProductFile } from "@/lib/product-upload";
import { getAllInventory } from "@/lib/inventory-engine";

type NhanVienOption = { ma: string; ten: string; boPhan?: string; ghiChu?: string };

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
      ...nhanVienOptions.filter(nv => (nv.boPhan || "").toLowerCase().includes("cắt") || (nv.ghiChu || "").toLowerCase().includes("cắt"))
        .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Cắt)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Cắt"),
    ];
  }
  
  // 2. Khuy nút
  if (cd.includes("khuy") || cd.includes("nút") || cd.includes("cúc")) {
    return [
      ...nhanVienOptions.filter(nv => (nv.boPhan || "").toLowerCase().includes("khuy") || (nv.ghiChu || "").toLowerCase().includes("khuy"))
        .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Khuy nút)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Khuy nút"),
    ];
  }
  
  // 3. Ủi
  if (cd.includes("ủi") || cd.includes("ui")) {
    return [
      ...nhanVienOptions.filter(nv => (nv.boPhan || "").toLowerCase().includes("ủi") || (nv.ghiChu || "").toLowerCase().includes("ủi"))
        .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Ủi)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Ủi"),
    ];
  }
  
  // 4. Đóng Gói
  if (cd.includes("đóng gói") || cd.includes("gấp xếp") || cd.includes("gấp") || cd.includes("xếp") || cd.includes("bao bì") || cd.includes("hoàn thiện")) {
    return [
      ...nhanVienOptions.filter(nv => (nv.boPhan || "").toLowerCase().includes("gấp") || (nv.ghiChu || "").toLowerCase().includes("gấp") || (nv.boPhan || "").toLowerCase().includes("xếp"))
        .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Đóng gói)` })),
      ...getAllOutsourceOptions("Gia công ngoài - Đóng gói"),
    ];
  }

  // 5. May Áo / In / Thêu / Dập / Gia công khác -> Lọc đối tác gia công ngoại
  if (cd.includes("trụ") || cd.includes("tru") || (cd.includes("may áo") && (loaiSP === "AoTru" || loaiSP === "BoTru" || loaiSP === "AoPolo"))) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU"))
        .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Trụ)` })),
      ...getAllOutsourceOptions("Gia công ngoài", "GC-TRU"),
    ];
  }
  if (cd.includes("tròn") || cd.includes("tron") || (cd.includes("may áo") && (loaiSP === "AoCoTron" || loaiSP === "BoCoTron"))) {
    return [
      ...DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRON"))
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
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU") || dt.ma.startsWith("GC-TRON") || dt.ma.startsWith("GC-QUAN"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }));
  }

  return [
    ...nhanVienOptions.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Nội bộ)` })),
    ...DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }))
  ];
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

const getTemplateIdForProduct = (loaiSP: LoaiSP) => {
  if (loaiSP === "BoTru") return "MCD-BO-TRU";
  if (loaiSP === "BoCoTron") return "MCD-BO-TRON";
  if (loaiSP === "AoTru" || loaiSP === "AoPolo") return "MCD-AO-TRU";
  return "MCD-AO-TRON";
};

const splitPhoiFiles = (value?: string) => {
  if (!value) return { ao: "", quan: "" };
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && ("ao" in parsed || "quan" in parsed)) {
      return { ao: parsed.ao || "", quan: parsed.quan || "" };
    }
  } catch {}
  return { ao: value, quan: "" };
};

const splitDiagramFiles = (value?: string) => {
  if (!value) return { file: "", image: "" };
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && ("file" in parsed || "image" in parsed)) {
      return { file: parsed.file || "", image: parsed.image || "" };
    }
  } catch {}
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

const getVisibleStages = (stages: PhanCongGiaCong, loaiSP: LoaiSP) => {
  const isBo = loaiSP.toLowerCase().includes("bo");
  return stages.filter(stage => isBo || !isQuanStage(stage.tenCongDoan));
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

export function LenhCatModal({ isOpen, onClose, editId }: { isOpen: boolean; onClose: () => void; editId?: string | null }) {
  const { list: nhanSuList } = useNhanSu();
  const nhanVienOptions: NhanVienOption[] = nhanSuList.map(nv => ({
    ma: nv.maNV,
    ten: nv.hoTen,
    boPhan: nv.boPhan,
    sdt: nv.sdt,
  }));
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, themMauCongDoan, dsMauChiPhi, themMauChiPhi } = useLenhCat();
  const { dsSanPham } = useDanhMucSP();
  const [khoVaiReals, setKhoVaiReals] = useState<any[]>([]);
  useEffect(() => { setKhoVaiReals(getAllInventory()); }, []);

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
        
        if (firstEditor && firstEditor.id !== myClientId) {
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

  // Sync editing data into states when editing changes
  useEffect(() => {
    if (editing) {
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
      setTiLeSize(editing.tiLeSize || "1:2:2:1");
      setSoMau(editing.dsMau?.length || 4);
      setDsMau(editing.dsMau || []);
      setDsPhuLieu(editing.dsPhuLieu || []);
      setMauCongDoan(editing.mauCongDoan || "BoTheThao");
      if (editing.phanCong) {
        setPhanCong(editing.phanCong);
        const inTheuItem = getInTheuStage(editing.phanCong);
        if (inTheuItem) {
          setCongDoanInTheu((IN_THEU_OPTIONS.find(option => inTheuItem.tenCongDoan.toLowerCase().includes(option.toLowerCase())) || "In") as InTheuOption);
          if (inTheuItem.id === "in_theu_ao") setLoaiInTheu("ao");
          else if (inTheuItem.id === "in_theu_quan") setLoaiInTheu("quan");
          else setLoaiInTheu("bo");
        }
      }
      setChiPhiCoDinh(editing.chiPhiCoDinh || BANG_CHI_PHI_CO_DINH[editing.loaiSP] || {});
      setPhienBanDinhMuc(editing.phienBanDinhMuc || 1);
      setSoDoChinh(editing.soDoChinh || "");
      setPdfSoDoChinh(editing.pdfSoDoChinh || "");
      setKhoSoDoChinh(editing.khoSoDoChinh || "");
      setDaiSoDoChinh(editing.daiSoDoChinh || "");
      setSoDoPhoi(editing.soDoPhoi || "");
      const phoiFiles = splitPhoiFiles(editing.soDoPhoi);
      setSoDoPhoiAo(phoiFiles.ao);
      setSoDoPhoiQuan(phoiFiles.quan);
      setPdfSoDoPhoi(editing.pdfSoDoPhoi || "");
      setKhoSoDoPhoi(editing.khoSoDoPhoi || "");
      setDaiSoDoPhoi(editing.daiSoDoPhoi || "");
      // FIX: 2 dòng dưới trước đây bị thiếu -> mở lại lệnh cắt để sửa sẽ mất ghi chú sơ đồ đã lưu
      setGhiChuSoDoChinh(editing.ghiChuSoDoChinh || "");
      setGhiChuSoDoPhoi(editing.ghiChuSoDoPhoi || "");
      setDaCoSoDo(editing.daCoSoDo || false);
      setDaiSoDoAo(editing.daiSoDoAo || "");
      const diagramAo = splitDiagramFiles(editing.soDoAo);
      setSoDoAo(diagramAo.file);
      setHinhAnhSoDoAo(diagramAo.image);
      setDaiSoDoQuan(editing.daiSoDoQuan || "");
      const diagramQuan = splitDiagramFiles(editing.soDoQuan);
      setSoDoQuan(diagramQuan.file);
      setHinhAnhSoDoQuan(diagramQuan.image);
      setHinhMauInTheu(editing.hinhMauInTheu || "");
      setFileGocInTheu(editing.fileGocInTheu || "");
      setGhiChuInTheu(editing.ghiChuInTheu || "");
    }
  }, [editing]);

  // ============ Form state ============
  const [loaiLenh, setLoaiLenh] = useState<LoaiLenh>("HangNha");
  const [khachHang, setKhachHang] = useState("");
  const [loaiSP, setLoaiSP] = useState<LoaiSP>("BoTru");
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
        if (loaiSoDoPhoi === "quan") setSoDoPhoiQuan(fileData);
        else if (loaiSoDoPhoi === "ca-hai") {
          setSoDoPhoiAo(fileData);
          setSoDoPhoiQuan(fileData);
        } else setSoDoPhoiAo(fileData);
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
      const fileData = JSON.parse(fileDataStr);
      if (!fileData.url) return;
      const a = document.createElement("a");
      a.href = fileData.url;
      a.download = fileData.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      // Fallback for old mock data
      toast.error("Không thể tải file (dữ liệu mock cũ)");
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
    try {
      const imageData = JSON.parse(imageDataStr);
      if (!imageData.url) return;
      setPreviewImage({ url: imageData.url, name: imageData.name || "Ảnh" });
    } catch {
      toast.error("Không thể xem ảnh");
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
  // 2 bang size: co 3XL (5 size) + bo 3XL (4 size)
  const TI_LE_OPTIONS = [
    ...SIZE_RATIO_5SIZE.map((p) => ({ label: "📐 " + p.label, value: p.value, sizes: p.sizes })),
    ...SIZE_RATIO_4SIZE.map((p) => ({ label: "📏 " + p.label, value: p.value, sizes: p.sizes })),
  ];
  const [tiLeSize, setTiLeSize] = useState("1:2:2:1");
  const [soMau, setSoMau] = useState(4);
  const [dsMau, setDsMau] = useState<MauVai[]>(Array.from({ length: 4 }).map(() => ({ 
    ten: "", maSKU: "", maVai: "", dinhMuc: 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: []
  })));
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
        let sizes = ["S", "M", "L", "XL"];
        
        const preset = SIZE_RATIO_PRESETS.find(p => p.value === tiLeSize);
        if (preset) {
          ratioParts = preset.ratios;
          sizes = preset.sizes;
        } else if (tiLeSize === "0:1:2:2:1") {
          ratioParts = [1, 2, 2, 1];
          sizes = ["M", "L", "XL", "2XL"];
        } else if (tiLeSize === "1:2:2:2:1") {
          ratioParts = [1, 2, 2, 2, 1];
          sizes = ["S", "M", "L", "XL", "2XL"];
        }

        const totalRatio = ratioParts.reduce((a, b) => a + b, 0);
        const baseQty = Math.floor(mau.slDuKien / totalRatio);

        // Chia đúng theo tỉ lệ cho MỌI size (không dồn phần lẻ vào size cuối làm phá tỉ lệ).
        // Nếu slDuKien không phải bội số của tổng tỉ lệ, phần lẻ hiển thị cảnh báo + gợi ý
        // số gần nhất (xem soLuongGoiY bên dưới) thay vì tự ý phá tỉ lệ.
        const newPhanBo = ratioParts.map((r, i) => ({ size: sizes[i], sl: baseQty * r }));

        // Kiểm tra xem phanBoSize có thay đổi không (để tránh infinite loop)
        const isSame = mau.phanBoSize && mau.phanBoSize.length === newPhanBo.length && mau.phanBoSize.every((p, idx) => p.sl === newPhanBo[idx].sl);
        if (!isSame) changed = true;

        return { ...mau, phanBoSize: newPhanBo };
      });
      
      return changed ? next : prev;
    });
  }, [tiLeSize, dsMau]);

  // ============ Định mức áo/quần tự tính từ sơ đồ (PLT) ============
  // Công thức (a Sang chốt): Định mức (kg/SP) = Chiều dài sơ đồ (cm) ÷ 190 (cm/kg) ÷ Tổng SP trong 1 sơ đồ
  // Tổng SP trong 1 sơ đồ = tổng các phần của tỉ lệ size (VD 1:2:2:1 -> 6 SP/sơ đồ)
  const soSpTrongSoDo = useMemo(() => {
    const preset = SIZE_RATIO_PRESETS.find(p => p.value === tiLeSize);
    if (preset) return preset.ratios.reduce((a, b) => a + b, 0);
    const parts = tiLeSize.split(":").map(Number).filter((n) => Number.isFinite(n) && n >= 0);
    return parts.length > 0 ? parts.reduce((a, b) => a + b, 0) : 0;
  }, [tiLeSize]);

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
  useEffect(() => {
    setDsMau(prev => {
      if (prev.length === soMau) return prev;
      if (prev.length < soMau) {
        return [...prev, ...Array.from({ length: soMau - prev.length }).map(() => ({ 
          ten: "", maSKU: "", maVai: "", dinhMuc: 0.25, slDuKien: 0, ghiChu: "", img: "", phanBoSize: []
        }))];
      }
      return prev.slice(0, soMau);
    });
  }, [soMau]);

  // Section 3 - Phụ liệu
  const [dsPhuLieu, setDsPhuLieu] = useState<LenhCatPhuLieu[]>([]);
  
  // Section 4 - Phân công
  const [mauCongDoan, setMauCongDoan] = useState<string>("BoTheThao");
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(dsMauCongDoan.find(x => x.id === "BoTheThao")?.giaCong || []);
  const visiblePhanCong = useMemo(() => getVisibleStages(phanCong, loaiSP), [phanCong, loaiSP]);
  const hasInTheuStage = Boolean(congDoanInTheu) && visiblePhanCong.some(stage => isInTheuStage(stage.tenCongDoan));
  const activeSoDoPhoi = loaiSoDoPhoi === "quan" ? soDoPhoiQuan : soDoPhoiAo || soDoPhoiQuan;
  
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
              setCongDoanInTheu((IN_THEU_OPTIONS.find(option => inTheuItem.tenCongDoan.toLowerCase().includes(option.toLowerCase())) || "In") as InTheuOption);
              if (inTheuItem.id === "in_theu_ao") setLoaiInTheu("ao");
              else if (inTheuItem.id === "in_theu_quan") setLoaiInTheu("quan");
              else setLoaiInTheu("bo");
            }
          }
        }
      } catch (e) {
        console.error("Lỗi tải nháp", e);
      }
      setDraftLoaded(true);
    }
  }, [editId, draftLoaded]);

  useEffect(() => {
    if (!editId && draftLoaded) {
      localStorage.setItem("lenhCatDraft", JSON.stringify({
        loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe,
        ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, phuTrachSoDo, ghiChu, ghiChuKyThuat,
        tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh,
        daiSoDoAo, soDoAo: JSON.stringify({ file: soDoAo, image: hinhAnhSoDoAo }), daiSoDoQuan, soDoQuan: JSON.stringify({ file: soDoQuan, image: hinhAnhSoDoQuan }),
        soDoChinh, pdfSoDoChinh, khoSoDoChinh, daiSoDoChinh,
        soDoPhoi: JSON.stringify({ ao: soDoPhoiAo, quan: soDoPhoiQuan }), pdfSoDoPhoi, khoSoDoPhoi, daiSoDoPhoi, ghiChuSoDoChinh, ghiChuSoDoPhoi, daCoSoDo,
        hinhMauInTheu, fileGocInTheu, ghiChuInTheu,
      }));
    }
  }, [loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe, ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, phuTrachSoDo, ghiChu, ghiChuKyThuat, tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh, daiSoDoAo, soDoAo, hinhAnhSoDoAo, daiSoDoQuan, soDoQuan, hinhAnhSoDoQuan, soDoChinh, pdfSoDoChinh, khoSoDoChinh, daiSoDoChinh, soDoPhoiAo, soDoPhoiQuan, pdfSoDoPhoi, khoSoDoPhoi, daiSoDoPhoi, ghiChuSoDoChinh, ghiChuSoDoPhoi, daCoSoDo, hinhMauInTheu, fileGocInTheu, ghiChuInTheu, editId, draftLoaded]);

  // Sync default phanCong and chiPhiCoDinh when templates are loaded
  useEffect(() => {
    if (dsMauCongDoan.length > 0 && (!phanCong || phanCong.length === 0)) {
      const defaultCD = dsMauCongDoan.find(x => x.id === "BoTheThao") || dsMauCongDoan[0];
      if (defaultCD) {
        setMauCongDoan(defaultCD.id);
        setPhanCong(defaultCD.giaCong);
      }
    }
  }, [dsMauCongDoan, phanCong]);

  useEffect(() => {
    if (dsMauCongDoan.length === 0) return;
    const templateId = getTemplateIdForProduct(loaiSP);
    const template = dsMauCongDoan.find(item => item.id === templateId);
    if (template && template.id !== mauCongDoan) {
      setMauCongDoan(template.id);
      setPhanCong(template.giaCong);
    }
  }, [loaiSP, dsMauCongDoan]);

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
        const v = khoVaiReals.find((x: any) => x.maVT === m.maVai);
        const tonKhoThuc = v ? (v.tonKho || 50) : 50; 
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
  }, [dsMau, dsPhuLieu]);

  // Tải ảnh mẫu cho 1 màu. Hàng Bộ có 2 ảnh riêng: ÁO (img) và QUẦN (imgQuan).
  const handleColorImageUpload = (idx: number, phan: "ao" | "quan" = "ao") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadProductFile(file, phan === "quan" ? "mau-quan" : "mau-ao")
        .then((url) => {
          setDsMau(prev => {
            const next = [...prev];
            next[idx] = phan === "quan"
              ? { ...next[idx], imgQuan: url }
              : { ...next[idx], img: url };
            return next;
          });
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Không upload được ảnh"));
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
    if (!dsPhuLieu || dsPhuLieu.length === 0) thieu.push("Vật tư/phụ liệu (chưa thêm khoản mục nào)");
    const tongSLMau = dsMau.reduce((s, m) => s + (m.slDuKien || 0), 0);
    if (!tongSL || dsMau.some(m => !m.slDuKien || m.slDuKien <= 0) || tongSLMau !== Number(tongSL)) thieu.push(`Số lượng (tổng SL từng màu = ${tongSLMau}, chưa khớp Tổng SL dự kiến = ${tongSL || 0})`);
    if (!phuTrachSX && !phuTrachCat) thieu.push("Người phụ trách sản xuất");
    return thieu;
  };

  const handleSave = async (status: TrangThaiLenhCat) => {
    if (!maSP || !tenSP || !tongSL) {
      toast.error("Vui lòng điền đầy đủ Mã SP, Tên SP và Tổng SL!");
      return;
    }

    if (status === "DaTao") {
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

    const catStage = phanCong.find(x => x.tenCongDoan.toLowerCase().includes("cắt") || x.tenCongDoan.toLowerCase().includes("cat"));
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
        dsMau,
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
        ngayTao: ngayBatDau,
        daiSoDoAo,
        soDoAo,
        daiSoDoQuan,
        soDoQuan,
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
        dsMau,
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
        daiSoDoAo,
        soDoAo,
        daiSoDoQuan,
        soDoQuan,
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
      localStorage.removeItem("lenhCatDraft");
    }
    onClose();
  };

  if (!isOpen) return null;

  // ============ Calculate Auto Values ============
  const validTongSL = (tongSL || 1) as number;
  
  let tongTienVai = 0;
  const isBo = loaiSP?.toLowerCase().includes("bo");

  // ============ IN PHIẾU GIA CÔNG (không hiển thị giá) ============
  const handleInPhieuGiaCong = () => {
    if (!maSP || !tenSP) {
      toast.error("Vui lòng nhập Mã SP / Tên SP trước khi in phiếu");
      return;
    }
    const maLenh = editing?.id || "(Chưa lưu lệnh)";
    const rows = dsMau.map((m, i) => {
      const sizeAo = (m.phanBoSize || []).map(pb => `<div class="sz"><b>${pb.size}</b><span>${pb.sl}</span></div>`).join("");
      const mauPhoiText = (m.mauPhoi || []).join(", ");
      return `
        <div class="mau-block">
          <div class="mau-title">${m.img ? `<img src="${m.img}" class="mau-img" title="Áo" />` : ""}${isBo && m.imgQuan ? `<img src="${m.imgQuan}" class="mau-img" title="Quần" />` : ""}Màu ${i + 1}${m.ten ? `: ${m.ten}` : ""}${m.maSKU ? ` <span class="sku">(${m.maSKU})</span>` : ""}</div>
          <div class="sz-row"><span class="sz-label">${isBo ? "Áo" : "SP"} theo size:</span>${sizeAo || "<i>Chưa chia size</i>"}</div>
          <div class="meta">SL màu này: <b>${m.slDuKien || 0}</b> &middot; Màu phối: <b>${mauPhoiText || "—"}</b>${m.ghiChu ? ` &middot; Ghi chú: ${m.ghiChu}` : ""}</div>
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Phiếu gia công ${maSP}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#1e293b;}
        h1{font-size:20px;margin:0 0 4px;} .sub{color:#64748b;font-size:13px;margin-bottom:16px;}
        table.info{width:100%;border-collapse:collapse;margin-bottom:16px;}
        table.info td{border:1px solid #cbd5e1;padding:6px 10px;font-size:13px;}
        table.info td.label{background:#f1f5f9;font-weight:bold;width:160px;}
        .mau-block{border:1px solid #cbd5e1;border-radius:6px;padding:10px 12px;margin-bottom:10px;}
        .mau-title{font-weight:bold;margin-bottom:6px;display:flex;align-items:center;gap:8px;}
        .mau-img{width:36px;height:36px;object-fit:cover;border-radius:4px;}
        .sku{color:#64748b;font-weight:normal;}
        .sz-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;}
        .sz-label{font-weight:bold;color:#334155;margin-right:4px;}
        .sz{border:1px solid #cbd5e1;border-radius:4px;padding:2px 8px;display:flex;flex-direction:column;align-items:center;min-width:36px;}
        .sz b{font-size:11px;color:#64748b;} .sz span{font-weight:bold;}
        .meta{font-size:12px;color:#475569;margin-top:6px;}
        table.sign{width:100%;border-collapse:collapse;margin-top:28px;}
        table.sign td{border:1px solid #94a3b8;text-align:center;padding:36px 8px 8px;font-size:12px;font-weight:bold;vertical-align:bottom;}
        @media print{ button{display:none;} }
      </style></head><body>
      <h1>PHIẾU GIA CÔNG</h1>
      <div class="sub">Mã lệnh: ${maLenh} &middot; Ngày in: ${new Date().toLocaleDateString("vi-VN")}</div>
      <table class="info">
        <tr><td class="label">Mã SP / Tên SP</td><td>${maSP} — ${tenSP}</td><td class="label">Tổng SL</td><td>${tongSL || 0}</td></tr>
        <tr><td class="label">Tỉ lệ size</td><td>${tiLeSize}</td><td class="label">Hạn hoàn thành</td><td>${hanHoanThanh}</td></tr>
        <tr><td class="label">Người phụ trách SX</td><td>${nhanVienOptions.find(n => n.ma === phuTrachSX)?.ten || phuTrachSX || "—"}</td><td class="label">Yêu cầu kỹ thuật</td><td>${ghiChuKyThuat || "—"}</td></tr>
        ${ghiChuInTheu ? `<tr><td class="label">Ghi chú In/Thêu</td><td colspan="3">${ghiChuInTheu}</td></tr>` : ""}
      </table>
      ${rows}
      <table class="sign">
        <tr><td>Người giao</td><td>Người nhận GC</td><td>Phụ trách SX</td><td>QC/Kho</td></tr>
      </table>
      <script>window.onload = () => { window.print(); };</script>
      </body></html>`;

    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) {
      toast.error("Trình duyệt chặn cửa sổ in, vui lòng cho phép popup");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  // ============ CHIA SẺ ZALO (mỗi người chỉ thấy đơn giá của chính họ) ============
  const [zaloPickerOpen, setZaloPickerOpen] = useState(false);
  const handleShareZaloItem = async (item: PhanCongGiaCong[number]) => {
    const lines = [
      `📋 Phân công gia công - ${tenSP || maSP}`,
      `Công đoạn: ${item.tenCongDoan}`,
      `Số lượng: ${item.soLuong} × ${item.donGia.toLocaleString("vi-VN")}đ = ${item.thanhTien.toLocaleString("vi-VN")}đ`,
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

  dsMau.forEach(m => {
    if (m.maVai && m.slDuKien && m.dinhMuc) {
      const v = khoVaiReals.find((x: any) => x.maVT === m.maVai);
      if (v) {
        tongTienVai += m.slDuKien * m.dinhMuc * (v.donGia || 0);
      }
    }
    if (isBo && m.maVaiQuan && m.slDuKien && m.dinhMucQuan) {
      const vQuan = khoVaiReals.find((x: any) => x.maVT === m.maVaiQuan);
      if (vQuan) {
        tongTienVai += m.slDuKien * m.dinhMucQuan * (vQuan.donGia || 0);
      }
    }
  });

  let tongTienPhuLieu = dsPhuLieu.reduce((s, p) => s + p.soLuong * p.donGia, 0);
  
  let giaCong1SP = 0;
  visiblePhanCong.forEach((kh: any) => {
    if (kh && kh.donGia) giaCong1SP += kh.donGia;
  });

  const tongChiPhiCoDinh = Object.values(chiPhiCoDinh).reduce((a, b) => a + b, 0);
  const validTongSL_Colors = Math.max(1, dsMau.reduce((s, m) => s + (m.slDuKien || 0), 0));
  const binhQuanVai = tongTienVai / validTongSL_Colors;
  const giaVonBinhQuan = binhQuanVai + (tongTienPhuLieu / validTongSL) + giaCong1SP + tongChiPhiCoDinh;

  return (
    <ResponsiveModal
      open={isOpen}
      onClose={onClose}
      maxWidth="full"
      className="bg-[#2B4C3E] text-white overflow-hidden"
      overlayClassName="bg-black/60 backdrop-blur-sm"
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
            Lệnh cắt này đang được chỉnh sửa bởi {activeEditor.name}. Bạn chỉ có thể xem và không thể lưu đè.
          </div>
        )}

        <div className="flex-1 bg-[#F4F1EA] p-2.5 md:p-6 flex flex-col gap-4 text-slate-900 overflow-y-auto">
          
          {/* CẢNH BÁO TỒN KHO */}
          {canhBaoTonKho.length > 0 && (
            <div className="bg-rose-100 p-3 flex flex-col gap-1 border-l-4 border-rose-500 text-rose-800 text-sm">
              <div className="font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Cảnh báo vật tư thiếu hụt:</div>
              <ul className="list-disc pl-6">
                {canhBaoTonKho.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          )}

          {/* KHỐI 1: THÔNG TIN CHÍNH */}
          <div className="order-1 bg-slate-100 p-3 md:p-5 rounded-lg border-2 border-slate-300 shadow-md relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
              <h2 className="text-base md:text-xl font-bold text-[#2B4C3E] uppercase tracking-wide break-words">THÔNG TIN CHUNG & KẾ HOẠCH</h2>
              <div className="flex gap-3 md:gap-4 items-center pr-0 md:pr-6">
                <label className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-white px-3 py-2 md:py-1.5 rounded-lg border shadow-sm cursor-pointer">
                  <input type="radio" name="loaiLenh" checked={loaiLenh === "HangNha"} onChange={() => setLoaiLenh("HangNha")} className="accent-[#2B4C3E]" />
                  <span className="text-sm font-bold text-slate-700">Hàng Nhà</span>
                </label>
                <label className="flex flex-1 md:flex-none items-center justify-center gap-2 bg-white px-3 py-2 md:py-1.5 rounded-lg border shadow-sm cursor-pointer">
                  <input type="radio" name="loaiLenh" checked={loaiLenh === "HangDat"} onChange={() => setLoaiLenh("HangDat")} className="accent-[#2B4C3E]" />
                  <span className="text-sm font-bold text-slate-700">Hàng Đặt</span>
                </label>
              </div>
            </div>
            
            {/* ID + Ngày bắt đầu banner */}
            <div className="flex flex-col md:grid md:grid-cols-[120px_1fr_120px_1fr] md:items-center gap-y-2 md:gap-x-6 mb-6 p-3 md:p-5 bg-gradient-to-r from-[#2B4C3E]/10 to-[#2B4C3E]/5 rounded-xl border border-[#2B4C3E]/20 shadow-sm w-full">
              <span className="text-xs md:text-sm font-bold text-slate-600 uppercase">Mã Lệnh cắt</span>
              <span className="px-3 py-2 md:px-4 md:py-1.5 bg-[#2B4C3E] text-white rounded-lg text-sm md:text-base font-bold tracking-widest shadow-inner truncate block w-full text-center md:text-left">
                {editId || "LC-" + new Date().getFullYear() + "-XXXX"}
              </span>
              <div className="hidden md:block col-span-2"></div>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-[120px_1fr_120px_1fr] md:items-center gap-4 md:gap-6 mb-6 p-3 md:p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm w-full">
              <div className="flex flex-col gap-1.5 md:contents">
                <label className="text-xs md:text-sm font-bold text-slate-600 uppercase">Ngày bắt đầu</label>
                <input type="date" className="w-full px-3 py-2 text-sm md:text-base font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#2B4C3E] shadow-sm min-w-0" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} />
              </div>
              
              <div className="flex flex-col gap-1.5 md:contents">
                <label className="text-xs md:text-sm font-bold text-slate-600 uppercase">Hoàn thành</label>
                <input type="date" className="w-full px-3 py-2 text-sm md:text-base font-medium border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#2B4C3E] shadow-sm min-w-0" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div className="lg:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Tổng SL cắt dự kiến *</label>
                <input type="number" min={1} className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tongSL} onChange={(e) => {
                  const val = e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 0);
                  setTongSL(val);
                  if (val && typeof val === "number") {
                    const perColor = Math.floor(val / soMau);
                    setDsMau(prev => prev.map(m => ({ ...m, slDuKien: perColor })));
                  }
                }} placeholder="Nhập số lượng..." />
              </div>

              {/* Row 2 */}
              <div className="sm:col-span-2 lg:col-span-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <label className="text-sm font-bold text-blue-800 block mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  Chọn nhanh từ danh mục SP ({dsSanPham.length} sản phẩm)
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative" ref={dropdownRef}>
                    <div 
                      className="w-full px-3 py-2.5 bg-white border-2 border-blue-200 rounded-lg cursor-pointer flex justify-between items-center hover:border-blue-400 focus:ring-2 focus:ring-blue-500 transition-colors font-semibold text-blue-900 shadow-sm"
                      onClick={() => setShowProductDropdown(!showProductDropdown)}
                    >
                      <span className="truncate">
                        {maSP ? `[${maSP}] ${tenSP}` : "-- Chọn sản phẩm có sẵn từ danh mục --"}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-blue-500 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
                    </div>

                    {showProductDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-lg shadow-xl z-[100] max-h-80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-2 border-b bg-slate-50 shrink-0">
                          <input 
                            autoFocus
                            type="text" 
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Tìm mã hoặc tên SP..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                          />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredProducts.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm">Không tìm thấy sản phẩm.</div>
                          ) : (
                            filteredProducts.map(sp => {
                              const imgUrl = sp.hinhAnh || sp.dsMau?.[0]?.img || "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image";
                              return (
                                <div 
                                  key={sp.id} 
                                  className={`flex items-center gap-3 p-2.5 border-b border-slate-100 cursor-pointer transition-colors ${maSP === sp.id ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                  onClick={() => {
                                    setMaSP(sp.id);
                                    setTenSP(sp.tenSP);
                                    setLoaiSP(sp.loaiSP);
                                    if (sp.tiLeSize) setTiLeSize(sp.tiLeSize);
                                    if (sp.dsMau && sp.dsMau.length > 0) {
                                      setSoMau(sp.dsMau.length);
                                      setDsMau(sp.dsMau.map(m => ({
                                        ten: m.ten,
                                        maSKU: m.maSKU || "",
                                        dinhMuc: m.dinhMuc || 0.25,
                                        img: m.img || "",
                                        maVai: "",
                                        slDuKien: 0,
                                        ghiChu: "",
                                        phanBoSize: []
                                      })));
                                    }
                                    toast.success(`✅ Đã chọn: [${sp.id}] ${sp.tenSP}`);
                                    setShowProductDropdown(false);
                                    setProductSearch("");
                                  }}
                                >
                                  <img src={imgUrl} className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0" />
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-sm text-slate-800 truncate">[{sp.id}] {sp.tenSP}</span>
                                    <span className="text-xs text-slate-500 truncate">{LOAI_SP_LABELS[sp.loaiSP]} • {sp.dsMau?.length || 0} màu</span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => {
                  const val = e.target.value;
                  setTenSP(val);
                  const lowerVal = val.toLowerCase();
                  if (lowerVal.includes("áo polo") || lowerVal.includes("ao polo")) setLoaiSP("AoPolo");
                  else if (lowerVal.includes("áo trụ") || lowerVal.includes("ao tru")) setLoaiSP("AoTru");
                  else if (lowerVal.includes("áo tròn") || lowerVal.includes("áo cổ tròn") || lowerVal.includes("cổ tròn")) setLoaiSP("AoCoTron");
                  else if (lowerVal.includes("bộ tròn") || lowerVal.includes("bộ cổ tròn")) setLoaiSP("BoCoTron");
                  else if (lowerVal.includes("bộ trụ") || lowerVal.includes("bo tru")) setLoaiSP("BoTru");
                  else if (lowerVal.includes("phụ kiện") || lowerVal.includes("quần") || lowerVal.includes("quan")) setLoaiSP("PhuKien");
                }} placeholder="VD: Bộ Trụ" />
              </div>

              {/* Row 3 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Hạn hoàn thành *</label>
                <input type="date" className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={(e) => setHanHoanThanh(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tỉ lệ size * (Áp dụng cho từng màu)</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tiLeSize} onChange={(e) => setTiLeSize(e.target.value)}>
                  {TI_LE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {/* Row 4 */}
              {loaiLenh === "HangDat" ? (
                <>
                  <div className="lg:col-span-2">
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {khachHangs?.map((k: any) => <option key={k.ma_kh} value={k.ma_kh}>{k.ten_kh}</option>)}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ghi chú (chung)</label>
                    <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-4">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Ghi chú kỹ thuật cắt may</label>
                    <textarea 
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" 
                      rows={3}
                      value={ghiChuKyThuat} 
                      onChange={e => setGhiChuKyThuat(e.target.value)} 
                      placeholder="Nhập thông tin ghi chú kỹ thuật cắt may..." 
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 lg:col-span-4">
                  <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
                </div>
              )}

              {/* Row 5 */}
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất & SĐT liên hệ *</label>
                <div className="flex items-center gap-2 max-w-2xl">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-emerald-300 flex-shrink-0">
                    {nhanVienOptions.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select className="px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => {
                      const val = e.target.value;
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
                    }}>
                      <option value="">-- Chọn Người phụ trách --</option>
                      {nhanVienOptions.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                    </select>
                    <input className="px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Product Banner Preview at the bottom of the section */}
            {(maSP || tenSP) && (() => {
              const sp = dsSanPham.find(s => s.id === maSP);
              const spImg = sp?.hinhAnh || sp?.dsMau?.[0]?.img || dsMau?.[0]?.img || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image";
              const spTen = sp?.tenSP || tenSP || "Chưa có tên SP";
              const spId = sp?.id || maSP || "Chưa có mã SP";
              const spLoai = sp ? (LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP) : (LOAI_SP_LABELS[loaiSP] || loaiSP);
              const totalColors = sp?.dsMau?.length || soMau || 1;
              
              return (
                <div className="mt-6 p-4 md:p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center">
                  <div 
                    className="relative w-full md:w-32 md:h-32 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center group cursor-zoom-in"
                    onClick={(e) => {
                      if (spImg && !spImg.includes("placehold.co")) {
                        handlePreviewImage(e, JSON.stringify({ url: spImg, name: spTen }));
                      }
                    }}
                  >
                    <img src={spImg} alt={spTen} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] font-bold rounded backdrop-blur-sm uppercase pointer-events-none">
                      {spLoai}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col min-w-0 w-full">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md font-mono">{spId}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">{totalColors} MÀU</span>
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-slate-800 truncate mb-1">{spTen}</h3>
                        <div className="text-sm font-medium text-slate-500 mb-2">Tỉ lệ size: <span className="text-slate-700">{tiLeSize}</span></div>
                      </div>
                      
                      <div className="flex items-center md:flex-col md:items-end gap-2 shrink-0 bg-slate-50 p-2 md:p-3 rounded-lg border border-slate-100">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng dự kiến</span>
                        <div className="text-xl md:text-2xl font-black text-amber-600 font-mono">{tongSL.toLocaleString()} <span className="text-sm font-bold text-slate-500">SP</span></div>
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
                <select 
                  className="px-2 py-1 text-sm border border-teal-300 rounded font-semibold text-teal-900 focus:outline-none bg-white min-w-[150px]"
                  value={phuTrachSoDo}
                  onChange={e => setPhuTrachSoDo(e.target.value)}
                >
                  <option value="">-- Chọn NV phụ trách --</option>
                  {nhanVienOptions.map(nv => (
                    <option key={nv.ma} value={nv.ma}>{nv.ma} - {nv.ten}</option>
                  ))}
                </select>
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
                  {hinhAnhSoDoAo ? <div className="relative w-full h-full flex items-center justify-center p-3"><img src={JSON.parse(hinhAnhSoDoAo).url} alt="Ảnh sơ đồ áo" className="w-full h-full object-contain" /><div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"><button type="button" onClick={(e) => handlePreviewImage(e, hinhAnhSoDoAo)} className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded">Xem</button><button type="button" onClick={(e) => handleDownloadSoDo(e, hinhAnhSoDoAo)} className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded">Tải về</button></div><button type="button" onClick={(e) => { e.stopPropagation(); setHinhAnhSoDoAo(""); if (imageAoRef.current) imageAoRef.current.value = ""; }} className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 rounded">Xóa</button></div> : <div className="flex flex-col items-center opacity-60 group-hover:opacity-100"><UploadCloud className="w-8 h-8 mb-1 text-teal-600" /><span className="text-xs font-medium">Tải ảnh sơ đồ áo</span></div>}
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
                    {hinhAnhSoDoQuan ? <div className="relative w-full h-full flex items-center justify-center p-3"><img src={JSON.parse(hinhAnhSoDoQuan).url} alt="Ảnh sơ đồ quần" className="w-full h-full object-contain" /><div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"><button type="button" onClick={(e) => handlePreviewImage(e, hinhAnhSoDoQuan)} className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-50 rounded">Xem</button><button type="button" onClick={(e) => handleDownloadSoDo(e, hinhAnhSoDoQuan)} className="px-2 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded">Tải về</button></div><button type="button" onClick={(e) => { e.stopPropagation(); setHinhAnhSoDoQuan(""); if (imageQuanRef.current) imageQuanRef.current.value = ""; }} className="absolute top-2 right-2 px-2 py-1 text-xs font-bold text-red-600 bg-red-50 rounded">Xóa</button></div> : <div className="flex flex-col items-center opacity-60 group-hover:opacity-100"><UploadCloud className="w-8 h-8 mb-1 text-teal-600" /><span className="text-xs font-medium">Tải ảnh sơ đồ quần</span></div>}
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
                             <button onClick={(e) => { e.stopPropagation(); if (loaiSoDoPhoi === "ao") setSoDoPhoiAo(""); else if (loaiSoDoPhoi === "quan") setSoDoPhoiQuan(""); else { setSoDoPhoiAo(""); setSoDoPhoiQuan(""); } filePhoiRef.current && (filePhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
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
                <input type="file" accept=".jpg,.jpeg,.png" className="hidden" ref={fileInTheuAnhRef} onChange={(e) => handleUploadSoDo(e, "in-theu-anh")} />
                <div
                  className="relative w-full h-32 bg-orange-50/50 border-2 border-dashed border-orange-300 rounded cursor-pointer overflow-hidden group hover:border-orange-500 transition-colors flex items-center justify-center"
                  onClick={(e) => hinhMauInTheu ? handlePreviewImage(e, hinhMauInTheu) : fileInTheuAnhRef.current?.click()}
                >
                  {hinhMauInTheu ? (
                    <div className="flex flex-col items-center gap-2">
                      {(() => { try { return <img src={JSON.parse(hinhMauInTheu).url} alt="Ảnh mẫu In/Thêu" className="h-20 max-w-full object-contain rounded border border-slate-200" />; } catch { return null; } })()}
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[220px]">
                          {(() => { try { return JSON.parse(hinhMauInTheu).name; } catch { return "Hình mẫu In/Thêu"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => handlePreviewImage(e, hinhMauInTheu)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">Xem</button>
                        <button onClick={(e) => handleDownloadSoDo(e, hinhMauInTheu)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                          <Download size={14} /> Tải
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setHinhMauInTheu(""); fileInTheuAnhRef.current && (fileInTheuAnhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-orange-600">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Tải lên ảnh<br/>(.jpg, .png)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* File gốc In/Thêu */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">📄 File gốc In/Thêu</label>
                <input type="file" accept=".pdf,.ai" className="hidden" ref={fileInTheuFileRef} onChange={(e) => handleUploadSoDo(e, "in-theu-file")} />
                <div
                  className="relative w-full h-32 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-orange-500 transition-colors flex items-center justify-center"
                  onClick={() => !fileGocInTheu && fileInTheuFileRef.current?.click()}
                >
                  {fileGocInTheu ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-red-500" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[220px]">
                          {(() => { try { return JSON.parse(fileGocInTheu).name; } catch { return "File gốc In/Thêu"; } })()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => handleDownloadSoDo(e, fileGocInTheu)} className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                          <Download size={14} /> Tải
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setFileGocInTheu(""); fileInTheuFileRef.current && (fileInTheuFileRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                          <X size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                      <UploadCloud className="w-8 h-8 mb-1" />
                      <span className="text-xs font-medium text-center">Tải lên file<br/>(.pdf, .ai)</span>
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
                     {getDoiTuongOptions(congDoanInTheu || "In/Thêu", loaiSP, nhanVienOptions).map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
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
                 <input type="number" className="w-16 px-2 py-1 text-center rounded border border-white" value={soMau} onChange={e => setSoMau(Math.max(1, parseInt(e.target.value) || 1))} />
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
                   {getDoiTuongOptions("May Áo", loaiSP, nhanVienOptions).map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
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
                     {getDoiTuongOptions("May Quần", loaiSP, nhanVienOptions).map(opt => <option key={opt.ma} value={opt.ma}>{opt.ten}</option>)}
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
                        className="relative w-[260px] h-[260px] max-w-full aspect-square mx-auto bg-white border-2 border-dashed border-blue-300 rounded-lg cursor-pointer group hover:border-blue-500 transition-colors flex items-center justify-center z-10 hover:z-50"
                        onClick={() => handleColorImageUpload(idx, "ao")}
                      >
                        {mau.img ? (
                          <>
                            <img src={mau.img} className="w-full h-full object-cover rounded-lg group-hover:scale-[1.75] transition-transform duration-300 group-hover:shadow-2xl origin-center" />
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold">ÁO</span>
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
                        onClick={() => {
                          const p = khoPhuLieuReals[0];
                          setDsPhuLieu(prev => [...prev, { maPL: p.maVT, tenPL: p.tenVT, soLuong: (tongSL as number) || 500, donGia: p.donGia || 1000, dvt: p.dvt || "cái", apDungCho: "ao", mauIdx: idx }]);
                        }}
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
                    const donGia = v ? (v.donGia || 0) : 0;
                    let tienVaiAo1SP = mau.dinhMuc * donGia;
                    
                    let vQuan = null;
                    let tienVaiQuan1SP = 0;
                    if (isBo && mau.maVaiQuan) {
                      vQuan = khoVaiReals.find((x: any) => x.maVT === mau.maVaiQuan);
                      const donGiaQuan = vQuan ? (vQuan.donGia || 0) : 0;
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
                                const next = [...dsMau]; next[idx].maSKU = e.target.value; setDsMau(next);
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
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].maVai = e.target.value; setDsMau(next);
                                  }}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv: any) => (
                                    <option key={kv.maVT} value={kv.maVT}>{kv.maMoi || kv.maVT} - {kv.mauSac || kv.tenChuan || kv.tenVT}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/áo):</div>
                                <input 
                                  type="number" step="0.01"
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.dinhMuc}
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(next);
                                  }}
                                />
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
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 mb-1 block">Kho Vải Chính</label>
                                <select 
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.maVai}
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].maVai = e.target.value; setDsMau(next);
                                  }}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv: any) => (
                                    <option key={kv.maVT} value={kv.maVT}>{kv.maMoi || kv.maVT} - {kv.mauSac || kv.tenChuan || kv.tenVT}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/sp):</label>
                                <input 
                                  type="number" step="0.01"
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.dinhMuc}
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(next);
                                  }}
                                />
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
                              className="w-full px-2 py-1.5 border-2 border-blue-400 text-sm rounded font-bold text-blue-800"
                              value={mau.slDuKien || ""}
                              placeholder="VD: 125"
                              onChange={(e) => {
                                const newVal = parseInt(e.target.value) || 0;
                                const next = [...dsMau]; 
                                next[idx].slDuKien = newVal; 
                                setDsMau(next);
                                
                                // Cập nhật Tổng SL
                                const newTongSL = next.reduce((sum, m) => sum + (m.slDuKien || 0), 0);
                                setTongSL(newTongSL);
                                
                                // Cập nhật số lượng vật tư của màu này
                                setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: newVal } : p));
                              }}
                            />
                            {soSpTrongSoDo > 0 && mau.slDuKien > 0 && mau.slDuKien % soSpTrongSoDo !== 0 && (() => {
                              const duoi = Math.floor(mau.slDuKien / soSpTrongSoDo) * soSpTrongSoDo;
                              const tren = duoi + soSpTrongSoDo;
                              return (
                                <div className="mt-1.5 px-2 py-1.5 rounded bg-amber-50 border border-amber-300 text-[11px] text-amber-800 flex items-center gap-2 flex-wrap">
                                  <span>⚠️ {mau.slDuKien} chưa khớp bội số tỉ lệ ({soSpTrongSoDo}/lượt). Chọn số gần nhất:</span>
                                  <button type="button" onClick={() => { 
                                    const next = [...dsMau]; 
                                    next[idx].slDuKien = duoi; 
                                    setDsMau(next); 
                                    setTongSL(next.reduce((sum, m) => sum + (m.slDuKien || 0), 0));
                                    setDsPhuLieu(prev => prev.map(p => p.mauIdx === idx ? { ...p, soLuong: duoi } : p));
                                  }} className="px-2 py-0.5 rounded bg-white border border-amber-400 font-bold hover:bg-amber-100">{duoi}</button>
                                  <button type="button" onClick={() => { 
                                    const next = [...dsMau]; 
                                    next[idx].slDuKien = tren; 
                                    setDsMau(next); 
                                    setTongSL(next.reduce((sum, m) => sum + (m.slDuKien || 0), 0));
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
                            <div className="text-[10px] font-bold text-amber-700">Giá vải / 1 SP {isBo ? "(Áo+Quần)" : ""}</div>
                            <div className="text-sm font-bold text-amber-900">{formatVND(tienVai1SP)}</div>
                          </div>
                        </div>

                        {/* CỘT 2: Quần và Thông tin Bổ sung (Ghi chú, Tổng tiền) */}
                        <div className="grid grid-cols-1 md:grid-cols-[160px_minmax(0,1fr)] gap-2 min-w-0 min-h-[300px] rounded-lg border-2 border-teal-300 bg-white/95 p-2 text-xs shadow-sm [&_input]:py-1 [&_select]:py-1 [&_textarea]:py-1">
                          {isBo && (
                            <div
                              className="relative w-[260px] h-[260px] max-w-full aspect-square mx-auto md:row-span-2 self-start bg-white border-2 border-dashed border-teal-300 rounded-lg cursor-pointer group hover:border-teal-500 transition-colors flex items-center justify-center z-10 hover:z-50"
                              onClick={() => handleColorImageUpload(idx, "quan")}
                            >
                              {mau.imgQuan ? (
                                <>
                                  <img src={mau.imgQuan} alt={`Ảnh màu quần ${mau.ten || idx + 1}`} className="w-full h-full object-cover rounded-lg group-hover:scale-[1.75] transition-transform duration-300 group-hover:shadow-2xl origin-center" />
                                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-teal-700/90 text-white text-[10px] font-bold">QUẦN</span>
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
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].maVaiQuan = e.target.value; setDsMau(next);
                                  }}
                                >
                                  <option value="">-- Chọn vải --</option>
                                  {khoVaiReals.map((kv: any) => (
                                    <option key={kv.maVT} value={kv.maVT}>{kv.maMoi || kv.maVT} - {kv.mauSac || kv.tenChuan || kv.tenVT}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <div className="text-[10px] font-bold text-slate-500 block mb-1">Định mức (kg/quần):</div>
                                <input 
                                  type="number" step="0.01"
                                  className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                                  value={mau.dinhMucQuan || ""}
                                  onChange={(e) => {
                                    const next = [...dsMau]; next[idx].dinhMucQuan = parseFloat(e.target.value) || 0; setDsMau(next);
                                  }}
                                />
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
                              onClick={() => {
                                const p = khoPhuLieuReals[0];
                                setDsPhuLieu(prev => [...prev, { maPL: p.maVT, tenPL: p.tenVT, soLuong: (tongSL as number) || 500, donGia: p.donGia || 1000, dvt: p.dvt || "cái", apDungCho: "quan", mauIdx: idx }]);
                              }}
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
                            <div className="text-[10px] font-bold text-emerald-700">Tổng tiền vải màu này</div>
                            <div className="text-sm font-bold text-emerald-900">{formatVND(tongTienVaiMau)}</div>
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
                                next[idx] = { ...next[idx], mauIdx: e.target.value === "" ? undefined : Number(e.target.value) };
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
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border flex-shrink-0 text-[10px] ${isOutsourceStage(kh.tenCongDoan) ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            {kh.nguoiMa ? (nhanVienOptions.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : (isOutsourceStage(kh.tenCongDoan) ? "GC" : "NV")}
                          </div>
                          <select 
                          className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none"
                          value={kh.nguoiMa}
                          onChange={(e) => {
                            const nv = nhanVienOptions.find(n => n.ma === e.target.value);
                            const dt = DOI_TAC_GIA_CONG.find(d => d.ma === e.target.value);
                            const selectedName = nv?.ten || dt?.tenDonVi || e.target.value;
                            setPhanCong(p => {
                              const next = [...(p as any[])];
                              next[idx] = { ...next[idx], nguoiMa: e.target.value, nguoiTen: selectedName };
                              return next as any;
                            });
                          }}
                        >
                          <option value="">-- Chọn NV/Xưởng --</option>
                          {getDoiTuongOptions(kh.tenCongDoan, loaiSP, nhanVienOptions).map(opt => (
                            <option key={opt.ma} value={opt.ma}>{opt.ten}</option>
                          ))}
                        </select>
                        </div>
                        <div className="col-span-3 relative">
                          <input 
                            type="number" min={0}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right pr-6"
                            value={kh.donGia}
                            onChange={(e) => {
                              setPhanCong(p => {
                                const next = [...(p as any[])];
                                next[idx] = { ...next[idx], donGia: parseInt(e.target.value) || 0 };
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
        <div className="sticky bottom-0 z-[100] shrink-0 bg-white p-3 md:px-6 md:py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between border-t border-slate-200 rounded-b-xl gap-3 w-full">
          
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
              Chuyển khâu
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
                      <span className="text-xs text-slate-400">{item.soLuong}×{item.donGia.toLocaleString("vi-VN")}đ</span>
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
  </ResponsiveModal>
  );

}
