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
  Wand2, CheckCircle2, UploadCloud, Download,
} from "lucide-react";
import { toast } from "sonner";
import { KHO_VAI, KHO_VAT_TU, formatVND, formatVNDShort } from "@/lib/data/real-data";
import { useSupabaseSync } from "@/lib/supabase/client";
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


const getDoiTuongOptions = (tenCongDoan: string, loaiSP: string) => {
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
  if (cd.includes("trụ") || cd.includes("tru") || (cd.includes("may áo") && (loaiSP === "AoTru" || loaiSP === "BoTru" || loaiSP === "AoPolo"))) {
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công Trụ)` }));
  }
  if (cd.includes("tròn") || cd.includes("tron") || (cd.includes("may áo") && (loaiSP === "AoCoTron" || loaiSP === "BoCoTron"))) {
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
    // Chỉ hiển thị các xưởng may nếu không phải in/thêu
    return DOI_TAC_GIA_CONG.filter(dt => dt.ma.startsWith("GC-TRU") || dt.ma.startsWith("GC-TRON") || dt.ma.startsWith("GC-QUAN"))
      .map(dt => ({ ma: dt.ma, ten: `${dt.ma} - ${dt.tenDonVi} (Gia công)` }));
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

export function LenhCatModal({ isOpen, onClose, editId }: { isOpen: boolean; onClose: () => void; editId?: string | null }) {
  const { data: khachHangs } = useSupabaseSync<any>("mimin_khach_hang", "khach_hang");
  const { dsLenhCat, themLenhCat, suaLenhCat, dsMauCongDoan, themMauCongDoan, dsMauChiPhi, themMauChiPhi } = useLenhCat();
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
      setSoDoChinh(editing.soDoChinh || "");
      setSoDoPhoi(editing.soDoPhoi || "");
      setDaCoSoDo(editing.daCoSoDo || false);
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

  // Sơ đồ cắt
  const [soDoChinh, setSoDoChinh] = useState("");
  const [soDoPhoi, setSoDoPhoi] = useState("");
  const [daCoSoDo, setDaCoSoDo] = useState(false);
  const fileChinhRef = useRef<HTMLInputElement>(null);
  const filePhoiRef = useRef<HTMLInputElement>(null);

  const handleUploadSoDo = async (e: React.ChangeEvent<HTMLInputElement>, type: "chinh" | "phoi") => {
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
      } else {
        setSoDoPhoi(fileData);
        setDaCoSoDo(true);
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
  const [mauCongDoan, setMauCongDoan] = useState<string>("BoTheThao");
  const [phanCong, setPhanCong] = useState<PhanCongGiaCong>(dsMauCongDoan.find(x => x.id === "BoTheThao")?.giaCong || []);
  
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
          if (parsed.ghiChu) setGhiChu(parsed.ghiChu);
          if (parsed.tiLeSize) setTiLeSize(parsed.tiLeSize);
          if (parsed.soMau) setSoMau(parsed.soMau);
          if (parsed.dsMau && parsed.dsMau.length > 0) setDsMau(parsed.dsMau);
          if (parsed.dsPhuLieu && parsed.dsPhuLieu.length > 0) setDsPhuLieu(parsed.dsPhuLieu);
          if (parsed.mauCongDoan) setMauCongDoan(parsed.mauCongDoan);
          if (parsed.phanCong && parsed.phanCong.length > 0) setPhanCong(parsed.phanCong);
          if (parsed.chiPhiCoDinh) setChiPhiCoDinh(parsed.chiPhiCoDinh);
          if (parsed.soDoChinh) setSoDoChinh(parsed.soDoChinh);
          if (parsed.soDoPhoi) setSoDoPhoi(parsed.soDoPhoi);
          if (parsed.daCoSoDo) setDaCoSoDo(parsed.daCoSoDo);
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
        tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh,
        soDoChinh, soDoPhoi, daCoSoDo
      };
      localStorage.setItem("lenhCatDraft", JSON.stringify(draft));
    }
  }, [loaiLenh, khachHang, loaiSP, maSP, tenSP, tongSL, tongSLThucTe, ngayBatDau, sdtLienHe, hanHoanThanh, phuTrachCat, phuTrachSX, ghiChu, tiLeSize, soMau, dsMau, dsPhuLieu, mauCongDoan, phanCong, chiPhiCoDinh, soDoChinh, soDoPhoi, daCoSoDo, editId, draftLoaded]);

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
        soDoChinh,
        soDoPhoi,
        daCoSoDo,
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
        soDoChinh,
        soDoPhoi,
        daCoSoDo,
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
  const isBo = loaiSP?.toLowerCase().includes("bo");
  dsMau.forEach(m => {
    if (m.maVai && m.slDuKien && m.dinhMuc) {
      const v = KHO_VAI.find(x => x.maVT === m.maVai);
      if (v) {
        tongTienVai += m.slDuKien * m.dinhMuc * (v.donGia || 0);
      }
    }
    if (isBo && m.maVaiQuan && m.slDuKien && m.dinhMucQuan) {
      const vQuan = KHO_VAI.find(x => x.maVT === m.maVaiQuan);
      if (vQuan) {
        tongTienVai += m.slDuKien * m.dinhMucQuan * (vQuan.donGia || 0);
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
          <div className="bg-slate-100 p-5 rounded-lg border-2 border-slate-300 shadow-md relative">
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
              {/* Row 2 */}
              <div className="md:col-span-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
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
                  
                  {/* Selected Product Preview */}
                  {maSP && (() => {
                    const sp = dsSanPham.find(s => s.id === maSP);
                    if (sp) {
                      const spImg = sp.hinhAnh || sp.dsMau?.[0]?.img || "https://placehold.co/100x100/e2e8f0/64748b?text=No+Image";
                      return (
                        <div className="w-full md:w-64 shrink-0 flex items-center gap-3 p-2 bg-white rounded-lg border border-blue-100 shadow-sm">
                          <img src={spImg} alt={sp.tenSP} className="w-12 h-12 rounded object-cover border border-slate-200" />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-slate-800 truncate">{sp.tenSP}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{sp.id} • {LOAI_SP_LABELS[sp.loaiSP] || sp.loaiSP}</div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
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
                      {khachHangs?.map((k: any) => <option key={k.ma_kh} value={k.ma_kh}>{k.ten_kh}</option>)}
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
                    <select className="px-3 py-2 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-[#2B4C3E] text-sm" value={phuTrachSX} onChange={e => {
                      const val = e.target.value;
                      setPhuTrachSX(val);
                      if (val) {
                        const numericPart = val.replace(/\D/g, "");
                        setSdtLienHe(`09${numericPart}123456`.substring(0, 10));
                      } else {
                        setSdtLienHe("");
                      }
                    }}>
                      <option value="">-- Chọn Người phụ trách --</option>
                      {REAL_NHAN_VIEN.map(n => <option key={n.ma} value={n.ma}>{n.ma} - {n.ten}</option>)}
                    </select>
                    <input className="px-3 py-2 bg-white border border-slate-300 rounded text-sm focus:ring-2 focus:ring-[#2B4C3E]" value={sdtLienHe} onChange={e => setSdtLienHe(e.target.value)} placeholder="SĐT liên hệ..." />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SƠ ĐỒ CẮT (MARKER) */}
          <div className="bg-[#F0F7FF] p-5 rounded-lg border border-blue-200/80 shadow-sm mt-6">
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
                 <label className="text-sm font-bold text-slate-700 block mb-2">Sơ đồ vải chính</label>
                 <input type="file" className="hidden" ref={fileChinhRef} onChange={(e) => handleUploadSoDo(e, "chinh")} />
                 <div 
                   className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                   onClick={() => !soDoChinh && fileChinhRef.current?.click()}
                 >
                   {soDoChinh ? (
                     <div className="flex flex-col items-center gap-2">
                       <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                         <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                           {(() => { try { return JSON.parse(soDoChinh).name; } catch { return "Sơ đồ chính"; } })()}
                         </span>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={(e) => handleDownloadSoDo(e, soDoChinh)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                           <Download size={14} /> Tải về
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setSoDoChinh(""); fileChinhRef.current && (fileChinhRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                           <X size={14} /> Xóa
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                       <UploadCloud className="w-8 h-8 mb-1" />
                       <span className="text-xs font-medium">Tải lên sơ đồ chính (PLT, PDF, Image)</span>
                     </div>
                   )}
                 </div>
               </div>
               
               {/* Sơ đồ phối */}
               <div>
                 <label className="text-sm font-bold text-slate-700 block mb-2">Sơ đồ phối (nếu có)</label>
                 <input type="file" className="hidden" ref={filePhoiRef} onChange={(e) => handleUploadSoDo(e, "phoi")} />
                 <div 
                   className="relative w-full h-24 bg-white border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-blue-500 transition-colors flex items-center justify-center"
                   onClick={() => !soDoPhoi && filePhoiRef.current?.click()}
                 >
                   {soDoPhoi ? (
                     <div className="flex flex-col items-center gap-2">
                       <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                         <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                           {(() => { try { return JSON.parse(soDoPhoi).name; } catch { return "Sơ đồ phối"; } })()}
                         </span>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={(e) => handleDownloadSoDo(e, soDoPhoi)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                           <Download size={14} /> Tải về
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); setSoDoPhoi(""); filePhoiRef.current && (filePhoiRef.current.value = ""); }} className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded">
                           <X size={14} /> Xóa
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity text-slate-500">
                       <UploadCloud className="w-8 h-8 mb-1" />
                       <span className="text-xs font-medium">Tải lên sơ đồ phối</span>
                     </div>
                   )}
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
              {dsMau.map((mau, idx) => {
                const isBo = loaiSP?.toLowerCase().includes("bo");
                return (
                <div key={idx} className={`bg-white rounded-lg shadow-md p-4 flex gap-4 ${isBo ? "md:col-span-2" : ""}`}>
                  
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
                      className="relative w-full aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded cursor-pointer overflow-hidden group hover:border-[#2B4C3E] transition-colors flex items-center justify-center"
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
                    {isBo ? (
                      <div className="flex gap-2">
                        <div className="w-1/2 p-2 bg-blue-50/50 rounded border border-blue-100 flex flex-col gap-2">
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
                              {KHO_VAI.map((kv) => (
                                <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
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
                        </div>
                        <div className="w-1/2 p-2 bg-rose-50/50 rounded border border-rose-100 flex flex-col gap-2">
                          <div>
                            <div className="text-[10px] font-bold text-rose-700 mb-1">QUẦN - Kho Vải</div>
                            <select 
                              className="w-full px-2 py-1.5 border border-slate-200 text-sm rounded" 
                              value={mau.maVaiQuan || ""}
                              onChange={(e) => {
                                const next = [...dsMau]; next[idx].maVaiQuan = e.target.value; setDsMau(next);
                              }}
                            >
                              <option value="">-- Chọn vải --</option>
                              {KHO_VAI.map((kv) => (
                                <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
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
                            {KHO_VAI.map((kv) => (
                              <option key={kv.maVT} value={kv.maVT}>{kv.maVT} - {kv.tenVT}</option>
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
                          const next = [...dsMau]; next[idx].slDuKien = parseInt(e.target.value) || 0; setDsMau(next);
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-2">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
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

                      <div className="flex flex-col bg-amber-50/50 p-2 rounded border border-amber-200/50">
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
                    </div>
                    
                    {/* BỔ SUNG GIÁ TIỀN VẢI MÀU NÀY */}
                    {(() => {
                      const v = KHO_VAI.find(x => x.maVT === mau.maVai);
                      const donGia = v ? (v.donGia || 0) : 0;
                      let tienVai1SP = mau.dinhMuc * donGia;
                      
                      let vQuan = null;
                      if (isBo && mau.maVaiQuan) {
                        vQuan = KHO_VAI.find(x => x.maVT === mau.maVaiQuan);
                        const donGiaQuan = vQuan ? (vQuan.donGia || 0) : 0;
                        tienVai1SP += (mau.dinhMucQuan || 0) * donGiaQuan;
                      }
                      
                      const tongTienVaiMau = tienVai1SP * (mau.slDuKien || 0);
                      return (
                        <div className="flex gap-2 mt-1">
                          <div className="w-1/2 bg-amber-50 p-2 rounded border border-amber-200">
                            <div className="text-[10px] font-bold text-amber-700">Giá vải / 1 SP {isBo ? "(Áo+Quần)" : ""}</div>
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
                );
              })}
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

              {/* BẢNG THỐNG KÊ VẢI VÀ PHỤ LIỆU */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg flex flex-col justify-center">
                  <div className="text-center text-sm text-slate-300 mb-1">TỔNG CHI PHÍ VẢI / SP =</div>
                  <div className="text-2xl font-bold text-center text-white">
                    {formatVND(tongTienVai / validTongSL)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                     <div className="flex justify-between"><span>Tổng tiền vải:</span> <span>{formatVND(tongTienVai)}</span></div>
                     <div className="flex justify-between"><span>Số màu:</span> <span>{dsMau.length}</span></div>
                  </div>
                </div>

                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg flex flex-col justify-center">
                  <div className="text-center text-sm text-slate-300 mb-1">TỔNG CHI PHÍ PHỤ LIỆU / SP =</div>
                  <div className="text-2xl font-bold text-center text-white">
                    {formatVND(tongTienPhuLieu / validTongSL)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                     <div className="flex justify-between"><span>Tổng tiền phụ liệu:</span> <span>{formatVND(tongTienPhuLieu)}</span></div>
                     <div className="flex justify-between"><span>Số khoản mục:</span> <span>{dsPhuLieu.length}</span></div>
                  </div>
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
                        <div className="col-span-6 flex items-center gap-2 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold overflow-hidden border flex-shrink-0 text-[10px] ${isOutsourceStage(kh.tenCongDoan) ? "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                            {kh.nguoiMa ? (REAL_NHAN_VIEN.find(x => x.ma === kh.nguoiMa)?.ten?.substring(0, 2) || DOI_TAC_GIA_CONG.find(x => x.ma === kh.nguoiMa)?.tenDonVi?.replace("Xưởng ", "")?.substring(0, 2) || "GC") : (isOutsourceStage(kh.tenCongDoan) ? "GC" : "NV")}
                          </div>
                          <select 
                          className="flex-1 min-w-0 px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none"
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
                          {getDoiTuongOptions(kh.tenCongDoan, loaiSP).map(opt => (
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
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg mt-auto flex flex-col justify-center">
                  <div className="text-center text-sm text-slate-300 mb-1">TỔNG GIA CÔNG SẢN XUẤT / SP =</div>
                  <div className="text-2xl font-bold text-center text-white">
                    {formatVND(giaCong1SP)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                     <div className="flex justify-between"><span>Nội bộ:</span> <span>{formatVND((Array.isArray(phanCong) ? phanCong : []).filter(kh => !isOutsourceStage(kh.tenCongDoan)).reduce((sum, kh) => sum + (kh.donGia || 0), 0))}</span></div>
                     <div className="flex justify-between"><span>Gia công ngoài:</span> <span>{formatVND((Array.isArray(phanCong) ? phanCong : []).filter(kh => isOutsourceStage(kh.tenCongDoan)).reduce((sum, kh) => sum + (kh.donGia || 0), 0))}</span></div>
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
                <div className="bg-slate-800 text-white p-4 rounded-xl shadow-lg mt-auto flex flex-col justify-center">
                  <div className="text-center text-sm text-slate-300 mb-1">TỔNG CHI PHÍ CỐ ĐỊNH / SP =</div>
                  <div className="text-2xl font-bold text-center text-white">
                    {formatVND(tongChiPhiCoDinh)}
                  </div>
                  <div className="mt-4 text-xs opacity-70 grid grid-cols-2 gap-x-4 gap-y-1">
                     <div className="flex justify-between"><span>Số khoản mục:</span> <span>{Object.keys(chiPhiCoDinh).length}</span></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overall Summary Box - span full width */}
            <div className="bg-[#2B4C3E] text-white p-6 rounded-xl shadow-lg mt-6 flex flex-col justify-center">
               <div className="text-center text-sm text-emerald-200 mb-2">TỔNG CHI PHÍ BÌNH QUÂN / SP =</div>
               <div className="text-4xl font-bold text-center text-yellow-400">
                 {formatVND(giaVonBinhQuan)}
               </div>
               <div className="mt-6 text-sm opacity-90 flex flex-wrap justify-center gap-x-8 gap-y-4 border-t border-white/20 pt-4">
                 <div className="flex flex-col items-center"><span className="text-emerald-200/70 text-xs mb-1">Giá vải</span><span className="font-bold">{formatVND(tongTienVai / validTongSL)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-emerald-200/70 text-xs mb-1">Nguyên liệu</span><span className="font-bold">{formatVND(tongTienPhuLieu / validTongSL)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-emerald-200/70 text-xs mb-1">Gia công</span><span className="font-bold">{formatVND(giaCong1SP)}</span></div>
                 <div className="flex flex-col items-center"><span className="text-emerald-200/70 text-xs mb-1">Cố định</span><span className="font-bold">{formatVND(tongChiPhiCoDinh)}</span></div>
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
        <div className="bg-white p-6 flex items-center justify-between border-t border-slate-200 rounded-b-xl">
          <div className="flex gap-4">
            <button className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-transparent border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 shadow-sm">
               In Phiếu / Xuất PDF
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-bold text-rose-500 bg-transparent border-2 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
            >
               Đóng
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              className="px-8 py-3 rounded-xl font-bold text-slate-600 bg-transparent border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              onClick={() => handleSave("Nhap")}
            >
              LƯU NHÁP
            </button>

            <button 
              className="px-8 py-3 rounded-xl font-bold text-blue-600 bg-transparent border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-0.5"
              onClick={() => handleSave("DaTao")}
            >
              HOÀN TẤT TẠO LỆNH
            </button>

            <button 
              className="px-8 py-3 rounded-xl font-extrabold text-[#F0A619] bg-transparent border-2 border-[#F0A619] hover:bg-[#F0A619] hover:text-white transition-all shadow-md hover:shadow-lg hover:shadow-[#F0A619]/20 hover:-translate-y-0.5 flex items-center gap-2 uppercase tracking-wide"
              onClick={() => handleSave("ChuyenTiep")}
            >
              <Send className="w-6 h-6" />
              CHUYỂN KHÂU TIẾP NHẬN
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

  {/* Modal Tạo Mẫu Chi Phí Cố Định */}
  {showTaoMauChiPhi && (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Tạo Mẫu Chi Phí Mới</h3>
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-bold mb-1">Tên Mẫu</label>
            <input className="w-full px-3 py-2 border rounded" placeholder="VD: Chi Phí Hàng Thun" value={newMauChiPhi.ten} onChange={e => setNewMauChiPhi(prev => ({ ...prev, ten: e.target.value, id: e.target.value.replace(/\s/g, "") || "cp_" + Date.now() }))} />
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
                <span className="text-sm font-medium flex-1">{tenKhoan}</span>
              </div>
              <div className="flex items-center gap-1 w-32 border rounded px-2">
                <input type="number" className="w-full py-1 focus:outline-none bg-transparent" placeholder="Đơn giá" value={donGia || ""} onChange={e => {
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
              className="flex-1 px-3 py-1.5 border rounded text-sm" 
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
