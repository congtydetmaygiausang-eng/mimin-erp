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

import { useEffect, useMemo, useState } from "react";
import {
  X, Plus, Trash2, AlertTriangle, Sparkles, Shirt, Package, Scissors,
  Calculator, TrendingUp, Save, Send, ChevronDown, ChevronUp, Info,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, KHACH_HANG_DATA, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { REAL_NHAN_VIEN } from "@/lib/real-workflow-data";
import { useSession, type AppUser } from "@/components/session-provider";
import { DOI_TAC_GIA_CONG } from "@/lib/doi-tac-gia-cong";
import { AIMockupModal } from "@/components/AIMockupModal";
import {
  type LenhCat, type LoaiSP, type MauVai, type LenhCatPhuLieu,
  type PhanCongGiaCong, type TrangThaiLenhCat, type LoaiLenh,
  type ChiPhiCoDinh, type BangCOGS,
  LOAI_SP_LABELS,
  BANG_CHI_PHI_CO_DINH,
  useLenhCat,
} from "@/lib/data/lenh-cat-store";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { SIZE_RATIO_5SIZE, SIZE_RATIO_4SIZE } from "@/lib/size-ratio-presets";


const getDoiTuongOptions = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  
  // 1. Cắt
  if (cd.includes("cắt") || cd.includes("cat")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("cắt") || (nv.ghiChu || "").toLowerCase().includes("cắt"))
      .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Cắt)` }));
  }
  
  // 2. Khuy nút
  if (cd.includes("khuy") || cd.includes("nút") || cd.includes("cúc")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("khuy") || (nv.ghiChu || "").toLowerCase().includes("khuy"))
      .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Khuy nút)` }));
  }
  
  // 3. Ủi
  if (cd.includes("ủi") || cd.includes("ui")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("ủi") || (nv.ghiChu || "").toLowerCase().includes("ủi"))
      .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Ủi)` }));
  }
  
  // 4. Đóng Gói
  if (cd.includes("đóng gói") || cd.includes("gấp xếp") || cd.includes("gấp") || cd.includes("xếp") || cd.includes("bao bì") || cd.includes("hoàn thiện")) {
    return REAL_NHAN_VIEN.filter(nv => (nv.boPhan || "").toLowerCase().includes("gấp") || (nv.ghiChu || "").toLowerCase().includes("gấp") || (nv.boPhan || "").toLowerCase().includes("xếp"))
      .map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Đóng gói)` }));
  }

  // 5. May Áo / In / Thêu / Dập / Gia công khác -> Lọc đối tác gia công ngoại
  if (cd.includes("trụ") || cd.includes("tru")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Trụ)` }));
  }
  if (cd.includes("tròn") || cd.includes("tron")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRON"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Tròn)` }));
  }
  if (cd.includes("quần") || cd.includes("quan")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-QUAN"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Quần)` }));
  }
  if (cd.includes("in") || cd.includes("thêu") || cd.includes("dập")) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-IN"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công In/Thêu)` }));
  }

  if (cd.includes("may") || cd.includes("gia công") || cd.includes("outsource")) {
    return DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }));
  }

  return [
    ...REAL_NHAN_VIEN.map(nv => ({ ma: nv.ma, ten: `${nv.ma} - ${nv.ten} (Nội bộ)` })),
    ...DOI_TAC_GIA_CONG.map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }))
  ];
};

const isOutsourceStage = (tenCongDoan: string) => {
  const cd = (tenCongDoan || "").toLowerCase();
  return cd.includes("may") || cd.includes("in") || cd.includes("thêu") || cd.includes("dập") || cd.includes("gia công");
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

interface Props {
  open: boolean;
  onClose: () => void;
  editId?: string | null; // Nếu có → edit mode, ngược lại → create
}


export default function LenhCatModal({ open, onClose, editId }: Props) {
  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, themMauCongDoan } = useLenhCat();
  const { dsSanPham } = useDanhMucSP();
  const { user } = useSession();
  const editing = editId ? dsLenhCat.find((l) => l.id === editId) : null;

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
      setPhuTrachCat(editing.phuTrachCat || "NV006");
      setPhuTrachSX(editing.phuTrachSX || "NV001");
      setGhiChu(editing.ghiChu || "");
      setTrangThai(editing.trangThai || "Nhap");
      setTiLeSize(editing.tiLeSize || "1:2:2:1");
      setSoMau(editing.dsMau?.length || 4);
      setDsMau(editing.dsMau || []);
      setDsPhuLieu(editing.dsPhuLieu || []);
      setMauCongDoan(editing.mauCongDoan || "BoTheThao");
      if (editing.phanCong) setPhanCong(editing.phanCong);
      setChiPhiCoDinh(editing.chiPhiCoDinh || BANG_CHI_PHI_CO_DINH[editing.loaiSP] || {});
      setPhienBanDinhMuc(editing.phienBanDinhMuc || 1);
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
  const [phuTrachCat, setPhuTrachCat] = useState("NV006");
  const [phuTrachSX, setPhuTrachSX] = useState("NV001");
  const [ghiChu, setGhiChu] = useState("");
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
        if (tiLeSize === "0:1:2:2:1") {
          ratioParts = [1, 2, 2, 1];
          sizes = ["M", "L", "XL", "2XL"];
        } else if (tiLeSize === "1:2:2:2:1") {
          ratioParts = [1, 2, 2, 2, 1];
          sizes = ["S", "M", "L", "XL", "2XL"];
        }

        const totalRatio = ratioParts.reduce((a, b) => a + b, 0);
        const baseQty = Math.floor(mau.slDuKien / totalRatio);
        
        let newPhanBo = [];
        let currentSum = 0;
        
        for (let i = 0; i < ratioParts.length - 1; i++) {
          const qty = baseQty * ratioParts[i];
          newPhanBo.push({ size: sizes[i], sl: qty });
          currentSum += qty;
        }
        newPhanBo.push({ size: sizes[sizes.length - 1], sl: mau.slDuKien - currentSum });
        
        // Kiểm tra xem phanBoSize có thay đổi không (để tránh infinite loop)
        const isSame = mau.phanBoSize && mau.phanBoSize.length === newPhanBo.length && mau.phanBoSize.every((p, idx) => p.sl === newPhanBo[idx].sl);
        if (!isSame) changed = true;

        return { ...mau, phanBoSize: newPhanBo };
      });
      
      return changed ? next : prev;
    });
  }, [tiLeSize, dsMau]);

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
  
  const [showTaoMauCD, setShowTaoMauCD] = useState(false);
  const [newMauCD, setNewMauCD] = useState<{ id: string; ten: string; giaCong: { id: string; tenCongDoan: string; nguoiMa: string; nguoiTen: string; donGia: number }[] }>({ 
    id: "", ten: "", giaCong: [
      { id: "cat", tenCongDoan: "Cắt", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayAo", tenCongDoan: "May Áo", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "mayQuan", tenCongDoan: "May Quần", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "in", tenCongDoan: "In", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "theu", tenCongDoan: "Thêu", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "ui", tenCongDoan: "Ủi", nguoiMa: "", nguoiTen: "", donGia: 0 },
      { id: "dongGoi", tenCongDoan: "Đóng Gói", nguoiMa: "", nguoiTen: "", donGia: 0 },
    ] 
  });
  const [customStepName, setCustomStepName] = useState("");

  const [mauCongDoan, setMauCongDoan] = useState<string>("BoTheThao");
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(dsMauCongDoan.find(x => x.id === "BoTheThao")?.giaCong || []);
  
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
          if (parsed.ghiChu) setGhiChu(parsed.ghiChu);
          if (parsed.tiLeSize) setTiLeSize(parsed.tiLeSize);
          if (parsed.soMau) setSoMau(parsed.soMau);
          if (parsed.dsMau && parsed.dsMau.length > 0) setDsMau(parsed.dsMau);
          if (parsed.dsPhuLieu && parsed.dsPhuLieu.length > 0) setDsPhuLieu(parsed.dsPhuLieu);
          if (parsed.mauCongDoan) setMauCongDoan(parsed.mauCongDoan);
          if (parsed.phanCong && parsed.phanCong.length > 0) setPhanCong(parsed.phanCong);
          if (parsed.chiPhiCoDinh) setChiPhiCoDinh(parsed.chiPhiCoDinh);
        }
      } catch (e) {
        console.error("Lỗi tải nháp", e);
      }
      setDraftLoaded(true);
    }
  }, [editId, draftLoaded]);

  useEffect(() => {
    if (!editId && draftLoaded) {
      const draft = {
        loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe,
        ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, ghiChu,
        tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh
      };
      localStorage.setItem("lenhCatDraft", JSON.stringify(draft));
    }
  }, [loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe, ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, ghiChu, tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh, editId, draftLoaded]);

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
        // Mock inventory = 50 cho vui. Thực tế lấy từ KHO_VAI.find().tonKho
        const v = KHO_VAI.find(x => x.maVT === m.maVai);
        const tonKhoThuc = v ? (v.tonKho || 50) : 50; 
        if (req > tonKhoThuc) {
          alerts.push(`Thiếu vải Màu ${i+1} (${v?.tenVT || m.maVai}): Cần ${req}kg, chỉ còn ${tonKhoThuc}kg`);
        }
      }
    });

    dsPhuLieu.forEach((p) => {
      if (p.maPL && p.soLuong) {
        const v = KHO_VAT_TU.find(x => x.maVT === p.maPL);
        const tonKhoThuc = v ? (v.tonKho || 1000) : 1000;
        if (p.soLuong > tonKhoThuc) {
          alerts.push(`Thiếu phụ liệu ${p.tenPL}: Cần ${p.soLuong}, chỉ còn ${tonKhoThuc}`);
        }
      }
    });

    setCanhBaoTonKho(alerts);
  }, [dsMau, dsPhuLieu]);

  const handleColorImageUpload = (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setDsMau(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], img: ev.target?.result as string };
            return next;
          });
        };
        reader.readAsDataURL(file);
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


  const handleSave = (status: TrangThaiLenhCat) => {
    if (!maSP || !tenSP || !tongSL) {
      toast.error("Vui lòng điền đầy đủ Mã SP, Tên SP và Tổng SL!");
      return;
    }

    const cogsData = {
      tongTienVai,
      tongTienPhuLieu,
      giaCong1SP,
      tongChiPhiCoDinh,
      giaVonBinhQuan
    };

    const catStage = phanCong.find(x => x.tenCongDoan.toLowerCase().includes("cắt") || x.tenCongDoan.toLowerCase().includes("cat"));
    const actualPhuTrachCat = catStage?.nguoiMa || phuTrachCat || "NV006";

    if (editing) {
      suaLenhCat(editing.id, {
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
        phanCong,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachCat: actualPhuTrachCat,
        phuTrachSX,
        ghiChu,
        trangThai: status,
        ngayTao: ngayBatDau,
      }, user || getFallbackUser());
      
      toast.success(`Đã cập nhật Lệnh Cắt ${editing.id} với trạng thái: ${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}`);
    } else {
      const newId = `LC-${new Date().getFullYear()}-${String(dsLenhCat.length + 1).padStart(4, "0")}`;
      themLenhCat({
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
        phanCong,
        chiPhiCoDinh,
        bangCOGS: cogsData,
        phuTrachCat: actualPhuTrachCat,
        phuTrachSX,
        ghiChu,
        trangThai: status,
        phienBanDinhMuc: 1,
        ngayTao: ngayBatDau,
        nguoiTao: user?.name || "Nguyễn Thị Ngọc Giàu"
      }, user || getFallbackUser());

      toast.success(`Đã tạo thành công Lệnh Cắt mới: ${newId} với trạng thái: ${status === "DaTao" ? "Đã tạo" : status === "Nhap" ? "Bản nháp" : "Chuyển tiếp"}`);
      localStorage.removeItem("lenhCatDraft");
    }
    onClose();
  };

  if (!open) return null;

  // ============ Calculate Auto Values ============
  const validTongSL = (tongSL || 1) as number;
  
  let tongTienVai = 0;
  dsMau.forEach(m => {
    if (m.maVai && m.slDuKien && m.dinhMuc) {
      const v = KHO_VAI.find(x => x.maVT === m.maVai);
      if (v) {
        tongTienVai += m.slDuKien * m.dinhMuc * (v.donGia || 0);
      }
    }
  });

  let tongTienPhuLieu = dsPhuLieu.reduce((s, p) => s + p.soLuong * p.donGia, 0);
  
  let giaCong1SP = 0;
  (Array.isArray(phanCong) ? phanCong : []).forEach((kh: any) => {
    if (kh && kh.donGia) giaCong1SP += kh.donGia;
  });

  const tongChiPhiCoDinh = Object.values(chiPhiCoDinh).reduce((a, b) => a + b, 0);
  const giaVonBinhQuan = (tongTienVai / validTongSL) + (tongTienPhuLieu / validTongSL) + giaCong1SP + tongChiPhiCoDinh;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2B4C3E]/80 backdrop-blur-sm p-2 md:p-6 animate-fade-in">
      <div 
        className="bg-[#2B4C3E] rounded-xl shadow-2xl max-w-6xl w-full max-h-[96vh] overflow-hidden flex flex-col animate-slide-up border-4 border-[#2B4C3E]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Close */}
        <div className="flex justify-between items-center p-3 bg-[#2B4C3E]">
          <h2 className="text-white font-bold ml-2">TẠO LỆNH CẮT MỚI {editId ? `(${editId})` : "(LC-XXXX-XXXX)"}</h2>
          <div className="flex gap-2">
            <span className="bg-slate-700/50 text-white text-xs px-3 py-1 rounded-full flex items-center">
              Version BOM: {phienBanDinhMuc}.0
            </span>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F4F1EA] p-4 flex flex-col gap-4">
          
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
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative">
            <button 
              onClick={onClose} 
              className="absolute -top-3 -right-3 p-2 bg-rose-500 text-white hover:bg-rose-600 rounded-full shadow-lg transition-transform hover:scale-110 z-10 flex items-center justify-center"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2B4C3E] uppercase tracking-wide">THÔNG TIN CHUNG & KẾ HOẠCH</h2>
              <div className="flex gap-4 items-center pr-6">
                <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm cursor-pointer">
                  <input type="radio" name="loaiLenh" checked={loaiLenh === "HangNha"} onChange={() => setLoaiLenh("HangNha")} className="accent-[#2B4C3E]" />
                  <span className="text-sm font-bold text-slate-700">Hàng Nhà</span>
                </label>
                <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm cursor-pointer">
                  <input type="radio" name="loaiLenh" checked={loaiLenh === "HangDat"} onChange={() => setLoaiLenh("HangDat")} className="accent-[#2B4C3E]" />
                  <span className="text-sm font-bold text-slate-700">Hàng Đặt</span>
                </label>
              </div>
            </div>
            
            {/* ID + Ngày bắt đầu banner */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-[#2B4C3E]/10 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">ID Lệnh cắt</span>
                <span className="px-3 py-1 bg-[#2B4C3E] text-white rounded-lg text-sm font-bold tracking-widest">
                  {editId || "LC-" + new Date().getFullYear() + "-XXXX"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Ngày bắt đầu</span>
                <input type="date" className="px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-[#2B4C3E]" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-bold text-slate-500 uppercase">→ Hoàn thành</span>
                <input type="date" className="px-2 py-1 text-sm border border-slate-300 rounded bg-white focus:ring-2 focus:ring-[#2B4C3E]" value={hanHoanThanh} onChange={e => setHanHoanThanh(e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Row 1 */}
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Loại SP *</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={loaiSP} onChange={(e) => setLoaiSP(e.target.value as LoaiSP)}>
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
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
              <div className="md:col-span-2">
                <label className="text-sm font-bold text-blue-700 block mb-1 flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Chọn nhanh từ danh mục SP ({dsSanPham.length} sản phẩm)
                </label>
                <select
                  className="w-full px-3 py-2 bg-blue-50 border-2 border-blue-300 rounded focus:ring-2 focus:ring-blue-500 font-semibold text-blue-900"
                  value=""
                  onChange={(e) => {
                    const sp = dsSanPham.find((s) => s.id === e.target.value);
                    if (sp) {
                      setMaSP(sp.id);
                      setTenSP(sp.tenSP);
                      setLoaiSP(sp.loaiSP);
                      if (sp.tiLeSize) setTiLeSize(sp.tiLeSize);
                      toast.success(`✅ Đã chọn: [${sp.id}] ${sp.tenSP}`);
                    }
                  }}
                >
                  <option value="">-- Chọn sản phẩm có sẵn từ danh mục --</option>
                  {dsSanPham.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      [{sp.id}] {sp.tenSP} - {LOAI_SP_LABELS[sp.loaiSP]} ({sp.dsMau.length} màu)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Mã SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={maSP} onChange={(e) => setMaSP(e.target.value.toUpperCase())} placeholder="VD: M001" />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">Tên SP *</label>
                <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={tenSP} onChange={(e) => setTenSP(e.target.value)} placeholder="VD: Bộ Trụ" />
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
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Khách Hàng *</label>
                    <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={khachHang} onChange={e => setKhachHang(e.target.value)}>
                      <option value="">-- Chọn Khách Hàng --</option>
                      {KHACH_HANG_DATA.map(k => <option key={k.maKH} value={k.maKH}>{k.ten}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                    <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <label className="text-sm font-bold text-slate-700 block mb-1">Ghi chú sản xuất</label>
                  <input className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E]" value={ghiChu} onChange={e => setGhiChu(e.target.value)} placeholder="Ghi chú thêm..." />
                </div>
              )}

              {/* Row 5 */}
              <div className="col-span-2">
                <label className="text-sm font-bold text-slate-700 block mb-1">Người phụ trách sản xuất & SĐT liên hệ *</label>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm border-2 border-emerald-300 flex-shrink-0">
                    {REAL_NHAN_VIEN.find(n => n.ma === phuTrachSX)?.ten?.substring(0,2) || "NV"}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <select className="px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => setPhuTrachSX(e.target.value)}>
                      {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                    </select>
                    <input className="px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* KHỐI 2: MÀU SẮC, VẢI, NGUYÊN PHỤ LIỆU */}
          <div className="bg-[#E6F3EE] p-5 rounded-lg border border-emerald-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
               <h2 className="text-xl font-bold text-[#2B4C3E] uppercase tracking-wide">MÀU SẮC, VẢI & CHIA SIZE</h2>
               <div className="flex items-center gap-2">
                 <label className="text-sm font-bold text-[#2B4C3E]">Số màu vải cắt:</label>
                 <input type="number" className="w-16 px-2 py-1 text-center rounded border border-white" value={soMau} onChange={e => setSoMau(Math.max(1, parseInt(e.target.value) || 1))} />
               </div>
            </div>

            {/* Grid Thẻ Màu Sắc */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {dsMau.map((mau, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-4 flex gap-4">
                  
                  {/* Left: Image */}
                  <div className="w-1/3 flex flex-col gap-2">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Màu {idx + 1}</div>
                    <input 
                      type="text"
                      className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded font-bold" 
                      placeholder="Tên màu..."
                      value={mau.ten}
                      onChange={(e) => {
                        const next = [...dsMau]; next[idx].ten = e.target.value; setDsMau(next);
                      }}
                    />
                    <div 
                      className="relative w-full aspect-[4/5] bg-slate-100 border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-[#2B4C3E] transition-colors flex items-center justify-center"
                      onClick={() => handleColorImageUpload(idx)}
                    >
                      {mau.img ? (
                        <img src={mau.img} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-8 h-8 text-[#2B4C3E]" />
                          <span className="text-xs mt-2 text-slate-600 font-medium">Tải ảnh</span>
                        </div>
                      )}
                    </div>
                    {/* Nút tạo mockup bằng AI - MiniMax image-01 */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openAiMockup(idx); }}
                      data-testid={`btn-ai-mockup-${idx}`}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold rounded hover:from-violet-600 hover:to-fuchsia-600 transition-all shadow-sm"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Tạo mockup bằng AI
                    </button>
                  </div>

                  {/* Right: Details & Sizes */}
                  <div className="w-2/3 flex flex-col gap-3 justify-center">
                    <div className="flex gap-2">
                      <div className="w-full">
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
                    </div>
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
                        {KHO_VAI.map((kv) => (
                          <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="w-1/2">
                        <label className="text-[10px] font-bold text-slate-500 block">Định mức (kg/sp):</label>
                        <input 
                          type="number" step="0.01"
                          className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                          value={mau.dinhMuc}
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].dinhMuc = parseFloat(e.target.value) || 0; setDsMau(next);
                          }}
                        />
                      </div>
                      <div className="w-1/2">
                        <label className="text-[10px] font-bold text-slate-500 block text-blue-700">SL Dự kiến cắt (Màu này):</label>
                        <input 
                          type="number" 
                          className="w-full px-2 py-1.5 border-2 border-blue-400 text-sm rounded font-bold text-blue-800" 
                          value={mau.slDuKien || ""}
                          placeholder="VD: 125"
                          onChange={(e) => {
                            const next = [...dsMau]; next[idx].slDuKien = parseInt(e.target.value) || 0; setDsMau(next);
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded border border-slate-200 mt-2">
                      <div className="text-[10px] font-bold text-slate-500 mb-2">Tự động bung size theo tỉ lệ:</div>
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
                    
                                        {/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}
                    {(() => {
                      const v = KHO_VAI.find(x => x.maVT === mau.maVai);
                      const donGia = v ? (v.donGia || 0) : 0;
                      const tienVai1SP = mau.dinhMuc * donGia;
                      const tongTienVaiMau = tienVai1SP * (mau.slDuKien || 0);
                      return (
                        <div className="flex gap-2 mt-1">
                          <div className="w-1/2 bg-amber-50 p-2 rounded border border-amber-200">
                            <div className="text-[10px] font-bold text-amber-700">Giá vải / 1 SP</div>
                            <div className="text-sm font-bold text-amber-900">{formatVND(tienVai1SP)}</div>
                          </div>
                          <div className="w-1/2 bg-emerald-50 p-2 rounded border border-emerald-200">
                            <div className="text-[10px] font-bold text-emerald-700">Tổng tiền vải màu này</div>
                            <div className="text-sm font-bold text-emerald-900">{formatVND(tongTienVaiMau)}</div>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>
              ))}
            </div>

            {/* Nguyên Phụ Liệu */}
            <div className="bg-white/40 p-4 rounded-lg">
               <div className="flex items-center justify-between mb-3">
                 <h3 className="font-bold text-slate-800 text-sm">Nguyên Phụ Liệu (Từ Kho Vật Tư)</h3>
                 <button 
                  onClick={() => {
                    const p = KHO_VAT_TU[0];
                    setDsPhuLieu(prev => [...prev, { maPL: p.maVT, tenPL: p.tenVT, soLuong: (tongSL as number) || 500, donGia: p.donGia || 1000, dvt: p.dvt || "cái" }]);
                  }}
                  className="px-3 py-1 bg-[#2B4C3E] text-white text-xs rounded hover:bg-[#2B4C3E]/80 transition flex items-center gap-1"
                 >
                   <Plus className="w-3 h-3"/> Thêm phụ liệu
                 </button>
               </div>
               
               <div className="space-y-2">
                 {dsPhuLieu.map((p, idx) => (
                   <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                     <select className="col-span-4 text-sm p-1.5 border rounded" value={p.maPL} onChange={e => {
                       const v = KHO_VAT_TU.find(x => x.maVT === e.target.value);
                       if(v) {
                         const next = [...dsPhuLieu];
                         next[idx] = { ...next[idx], maPL: v.maVT, tenPL: v.tenVT, donGia: v.donGia || 0, dvt: v.dvt || "cái" };
                         setDsPhuLieu(next);
                       }
                     }}>
                       {KHO_VAT_TU.map(v => <option key={v.maVT} value={v.maVT}>{v.tenVT}</option>)}
                     </select>
                     <input type="number" className="col-span-2 text-sm p-1.5 border rounded" value={p.soLuong} onChange={e => {
                       const next = [...dsPhuLieu]; next[idx].soLuong = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                     }} placeholder="Số lượng..." />
                     <div className="col-span-1 text-xs text-center text-slate-500">{p.dvt}</div>
                     <input type="number" className="col-span-2 text-sm p-1.5 border rounded" value={p.donGia} onChange={e => {
                       const next = [...dsPhuLieu]; next[idx].donGia = parseInt(e.target.value) || 0; setDsPhuLieu(next);
                     }} placeholder="Đơn giá..." />
                     <div className="col-span-2 text-right text-sm font-bold text-emerald-600">{formatVNDShort(p.soLuong * p.donGia)}</div>
                     <button onClick={() => setDsPhuLieu(prev => prev.filter((_, i) => i !== idx))} className="col-span-1 text-rose-500 p-1 flex justify-center"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* KHỐI 3: GIA CÔNG VÀ ĐƠN GIÁ */}
          <div className="bg-[#FCF5E8] p-5 rounded-lg border border-amber-200/80 shadow-sm mb-2">
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
                  {(Array.isArray(phanCong) ? phanCong : []).map((kh, idx) => {
                    if (!kh) return null;
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded shadow-sm">
                        <div className="col-span-3 font-semibold text-slate-700 text-sm truncate" title={kh.tenCongDoan}>{kh.tenCongDoan}</div>
                        <div className="col-span-6 flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border flex-shrink-0 text-[10px] ${isOutsourceStage(kh.tenCongDoan) ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            {kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : (isOutsourceStage(kh.tenCongDoan) ? "GC" : "NV")}
                          </div>
                          <select 
                          className="flex-1 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none"
                          value={kh.nguoiMa}
                          onChange={(e) => {
                            const nv = REAL_NHAN_VIEN.find(n => n.ma === e.target.value);
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
                          {getDoiTuongOptions(kh.tenCongDoan).map(opt => (
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
              </div>

              {/* Chi Phí Cố Định */}
              <div className="flex flex-col gap-4">
                <div className="bg-white/20 p-4 rounded-xl">
                  <div className="flex justify-between items-center border-b border-black/10 pb-2 mb-3">
                    <h3 className="font-bold text-slate-800">2. CHI PHÍ CỐ ĐỊNH / SẢN PHẨM</h3>
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

                <div className="bg-[#2B4C3E] text-white p-4 rounded-xl shadow-lg mt-auto flex flex-col justify-center">
                  <div className="text-center text-sm text-emerald-200 mb-1">TỔNG CHI PHÍ BÌNH QUÂN / SP =</div>
                  <div className="text-3xl font-bold text-center text-yellow-400">
                    {formatVND(giaVonBinhQuan)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex justify-between"><span>Giá vải:</span> <span>{formatVND(tongTienVai / validTongSL)}</span></div>
                    <div className="flex justify-between"><span>Nguyên liệu:</span> <span>{formatVND(tongTienPhuLieu / validTongSL)}</span></div>
                    <div className="flex justify-between"><span>Gia công:</span> <span>{formatVND(giaCong1SP)}</span></div>
                    <div className="flex justify-between"><span>Cố định:</span> <span>{formatVND(tongChiPhiCoDinh)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* KHỐI 4: NHẬP THỰC TẾ (Chỉ hiện khi Đang cắt hoặc Hoàn thành) */}
          {(trangThai === "DangCat" || trangThai === "HoanThanh" || trangThai === "ChuyenTiep") && (
            <div className="bg-slate-800 text-white p-5 rounded-lg border border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wide">THÔNG SỐ THỰC TẾ SAU CẮT</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-bold text-slate-300 block mb-1">Tổng SL Thực Tế Cắt Được</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded font-bold focus:ring-2 focus:ring-emerald-500" 
                    value={tongSLThucTe || ""} 
                    onChange={e => setTongSLThucTe(parseInt(e.target.value) || "")} 
                    placeholder="VD: 505 cái"
                  />
                </div>
                <div>
                   <label className="text-sm font-bold text-slate-300 block mb-1">Chi tiết hao hụt từng màu</label>
                   <div className="space-y-2">
                     {dsMau.map((mau, idx) => (
                       <div key={idx} className="flex gap-2 items-center bg-slate-700/50 p-2 rounded">
                         <div className="w-24 text-xs text-white truncate font-bold">{mau.ten || `Màu ${idx+1}`}</div>
                         <input type="number" placeholder="Kg thực tế..." className="w-1/3 px-2 py-1 text-sm bg-slate-900 text-white border border-slate-600 rounded" value={mau.kgThucTe || ""} onChange={e => { const n = [...dsMau]; n[idx].kgThucTe = parseFloat(e.target.value); setDsMau(n); }} />
                         <input type="number" placeholder="% Hao hụt..." className="w-1/3 px-2 py-1 text-sm bg-slate-900 text-white border border-slate-600 rounded" value={mau.haoHut || ""} onChange={e => { const n = [...dsMau]; n[idx].haoHut = parseFloat(e.target.value); setDsMau(n); }} />
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="bg-[#1A3329] p-4 flex items-center justify-between border-t border-white/10">
          <div>
            <button className="px-4 py-2 rounded font-bold text-slate-300 hover:bg-slate-800 transition-colors flex items-center gap-2 border border-slate-600">
               In Phiếu / Xuất PDF
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 ml-2 rounded font-bold text-rose-300 hover:bg-rose-900/30 transition-colors border border-rose-800/50"
            >
               Đóng
            </button>
          </div>
          <div className="flex gap-3">
            <button 
              className="px-6 py-2 rounded font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-600"
              onClick={() => handleSave("Nhap")}
            >
              Lưu Nháp
            </button>

            <button 
              className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg"
              onClick={() => handleSave("DaTao")}
            >
              Hoàn Tất Tạo Lệnh
            </button>

            <button 
              className="px-6 py-2 rounded font-bold text-slate-900 bg-[#F0A619] hover:bg-[#F0A619]/90 transition-colors shadow-lg flex items-center gap-2"
              onClick={() => handleSave("ChuyenTiep")}
            >
              <Send className="w-5 h-5" />
              Chuyển Khâu Tiếp Nhận
            </button>
          </div>
        

  {/* Modal Tạo Mẫu Công Đoạn */}
  {showTaoMauCD && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Tạo Mẫu Công Đoạn Mới</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">Tên Mẫu</label>
            <input className="w-full px-3 py-2 border rounded" placeholder="VD: Áo Thun Cổ Tròn" value={newMauCD.ten} onChange={e => setNewMauCD(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\s/g, "") || "cd_" + Date.now() }))} />
          </div>
          {newMauCD.giaCong.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <button onClick={() => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong.splice(index, 1);
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} className="text-rose-500 hover:bg-rose-100 p-1 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
                <input className="text-sm font-medium border-b border-dashed border-slate-300 focus:outline-none flex-1 bg-transparent" value={item.tenCongDoan} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index] = { ...newGiaCong[index], tenCongDoan: e.target.value };
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} />
              </div>
              <div className="flex items-center gap-1 w-32 border rounded px-2">
                <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Đơn giá" value={item.donGia || ""} onChange={e => {
                  const newGiaCong = [...newMauCD.giaCong];
                  newGiaCong[index] = { ...newGiaCong[index], donGia: parseInt(e.target.value) || 0 };
                  setNewMauCD(prev => ({ ...prev, giaCong: newGiaCong }));
                }} />
                <span className="text-xs text-slate-400">đ</span>
              </div>
            </div>
          ))}
          {/* Thêm công đoạn mới */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-100">
            <input 
              className="flex-1 px-3 py-1.5 border rounded text-sm" 
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
            }} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-sm rounded hover:bg-slate-200 whitespace-nowrap">+ Thêm</button>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowTaoMauCD(false)} className="px-4 py-2 border rounded text-slate-600">Huỷ</button>
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


      </div>
    </div>

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
  </div>
  );

}
