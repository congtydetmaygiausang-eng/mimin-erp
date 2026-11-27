// ============ PRODUCT FORM MODAL (Add/Edit) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.2)
// 2026-08-24: Chế độ Thêm mới cho phép nhập NHIỀU biến thể (màu) cùng lúc,
// mỗi biến thể có tỉ lệ size + số lượng theo từng size + đủ giá vốn/giá bán/
// giá bán sỉ/giá bán lẻ/giá bán lô - phục vụ nhập lô hàng tồn kho hiện tại.
// Chế độ Sửa giữ nguyên form 1 biến thể như cũ (sửa 1 dòng tồn kho có sẵn).

import { useState, useRef, useEffect, useMemo } from "react";
import { ResponsiveModal } from "@/components/ui/ResponsiveModal";
import { AddSizeRatioModal } from "./AddSizeRatioModal";
import { Camera, Save, Plus, Trash2, Package, Calculator, X, Loader2, Box, Tag, DollarSign, Layers, CheckCircle2, AlertCircle, ShoppingCart, Sparkles, Building2, ExternalLink, HelpCircle, ShoppingBag, Ruler } from "lucide-react";
import { toast } from "sonner";
import { DS_KHU_KE_HANG, DS_KENH_BAN, layMaLoTonKho, hienThiDanhSachSize, type KenhBan, type SanPhamTP } from "../data";
import {
  SIZE_RATIO_PRESETS,
  type SizeRatioPreset,
  loadSharedSizeRatioPresets,
  buildCustomSizeRatioPreset,
  saveSharedSizeRatioPreset,
} from "@/lib/size-ratio-presets";
import { uploadProductFile } from "@/lib/product-upload";
import { LOAI_SP_LABELS, type LoaiSP } from "@/lib/data/lenh-cat-store";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import { useBangGia, type KenhBan as KenhBanBangGia } from "@/lib/data/bang-gia-store";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);

// Chỉ còn Màu + số lượng theo size là khác nhau giữa các biến thể - mọi thứ
// khác (mã/tên SP, phân loại, tỉ lệ size, giá vốn/bán/sỉ/lẻ/lô) đều dùng
// CHUNG cho cả lô, nhập 1 lần ở đầu form (theo đúng góp ý thực tế: 1 lô hàng
// nhập về nhiều màu nhưng cùng 1 mã hàng thì giá và tỉ lệ size luôn giống
// nhau, không có lý do phải gõ lại cho từng màu).
type BienTheDraft = {
  mau: string;
  img: string;
  sizes: { size: string; sl: number }[];
  slDuKien: number;
  viTri: string;
  trangThai: SanPhamTP["trangThai"];
  ghiChu: string;
  kenhBan: KenhBan[];
};

function bienTheMoi(sizes: string[]): BienTheDraft {
  return {
    mau: "",
    img: "",
    sizes: sizes.map((s) => ({ size: s, sl: 0 })),
    slDuKien: 0,
    viTri: "",
    trangThai: "con",
    ghiChu: "",
    kenhBan: ["ban-le"],
  };
}

function phanBoTheoTiLe(ratios: number[], sizes: string[], slDuKien: number): { size: string; sl: number }[] {
  if (sizes.length === 0) return [];
  const tongTiLe = ratios.reduce((a, b) => a + b, 0) || 1;
  const raw = sizes.map((_, i) => (slDuKien * (ratios[i] || 0)) / tongTiLe);
  const quantities = raw.map(Math.floor);
  const remainder = slDuKien - quantities.reduce((sum, value) => sum + value, 0);
  const priority = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let i = 0; i < remainder; i += 1) quantities[priority[i % priority.length].index] += 1;
  return sizes.map((size, index) => ({ size, sl: quantities[index] || 0 }));
}

function taoMaLoTonKho(): string {
  const ngay = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LTK-${ngay}-${suffix}`;
}

function detectLoaiSP(value: string): LoaiSP {
  const normalized = value.toLocaleLowerCase("vi");
  if (normalized.includes("phụ kiện") || normalized.includes("quần")) return "PhuKien";
  if (normalized.includes("bộ") && (normalized.includes("cổ tròn") || normalized.includes("tròn"))) return "BoCoTron";
  if (normalized.includes("bộ")) return "BoTru";
  if (normalized.includes("polo")) return "AoPolo";
  if (normalized.includes("trụ")) return "AoTru";
  return "AoCoTron";
}

export function ProductFormModal({ sp, initialImage, onClose, onSave }: { sp?: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => void }) {
  if (sp) {
    return <SuaBienTheForm sp={sp} initialImage={initialImage} onClose={onClose} onSave={onSave} />;
  }
  return <ThemNhieuBienTheForm onClose={onClose} onSave={onSave} />;
}

// =================== THÊM MỚI - NHIỀU BIẾN THỂ ===================
function ThemNhieuBienTheForm({ onClose, onSave }: { onClose: () => void; onSave: (data: any[]) => void }) {
  const { dsSanPham: dsDanhMuc, loading: loadingDanhMuc } = useDanhMucSP();
  const { bangGia: dsBangGia, themChiTiet, layGia, loading: loadingBangGia } = useBangGia();
  // === Thông tin CHUNG cho cả lô (nhập 1 lần) ===
  const [maSP, setMaSP] = useState("");
  const [tenSP, setTenSP] = useState("");
  const [phanLoai, setPhanLoai] = useState<string>("BoTru");
  const [thuongHieu, setThuongHieu] = useState<"Man PJ" | "Polomimin">("Man PJ");
  const [maLoKho] = useState(taoMaLoTonKho);
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [presetId, setPresetId] = useState("");
  const [giaVon, setGiaVon] = useState(0);
  const [donGia, setDonGia] = useState(0);
  const [customPresets, setCustomPresets] = useState<SizeRatioPreset[]>([]);
  const [openSizeBuilder, setOpenSizeBuilder] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(false);
  
  // Kênh bán áp dụng chung cho cả lô hàng (đăng bài nhanh chóng)
  const [loKenhBan, setLoKenhBan] = useState<KenhBan[]>(["ban-si", "ban-le"]);
  const [selectedBangGia, setSelectedBangGia] = useState<Record<string, string>>({});
  const [inputPrices, setInputPrices] = useState<Record<string, number>>({});
  
  useEffect(() => {
    let active = true;
    const load = () => {
      loadSharedSizeRatioPresets().then((items) => {
        if (active) setCustomPresets(items);
      });
    };
    load();
    window.addEventListener("size-ratio-changed", load);
    return () => { 
      active = false; 
      window.removeEventListener("size-ratio-changed", load);
    };
  }, []);

  const selectedProduct = dsDanhMuc.find((product) => product.id === maSP);
  const productSizePreset: SizeRatioPreset | undefined = selectedProduct?.bangSize?.sizes?.length
    ? {
        id: `product-${selectedProduct.id}`,
        label: `Bảng size danh mục · ${selectedProduct.id}`,
        value: selectedProduct.bangSize.ratios.join(":"),
        sizes: selectedProduct.bangSize.sizes,
        ratios: selectedProduct.bangSize.ratios,
        riSo: selectedProduct.bangSize.ratios.reduce((sum, value) => sum + value, 0),
      }
    : undefined;
  const allPresets = [...(productSizePreset ? [productSizePreset] : []), ...SIZE_RATIO_PRESETS, ...customPresets];
  const preset = allPresets.find((p) => p.id === presetId);

  const chonSanPham = (productId: string) => {
    if (productId === "NEW") {
      setIsNewProduct(true);
      setMaSP("");
      setTenSP("");
      setPhanLoai("BoTru");
      setPresetId("");
      setThuongHieu("Man PJ");
      setBienThe([bienTheMoi([])]);
      return;
    }
    setIsNewProduct(false);
    const product = dsDanhMuc.find((item) => item.id === productId);
    setMaSP(productId);
    if (!product) return;
    setTenSP(product.tenSP);
    setPhanLoai(product.loaiSP);
    const pBrand = (product.thuongHieu === "Man PJ" || product.thuongHieu === "Polomimin"
      ? product.thuongHieu
      : product.ncc === "Polomimin"
      ? "Polomimin"
      : ((product.id || "").toUpperCase().includes("BPJ") || (product.tenSP || "").toUpperCase().includes("MANPJ") ? "Man PJ" : "Polomimin"));
    setThuongHieu(pBrand as "Man PJ" | "Polomimin");
    if (product.bangSize?.sizes?.length && product.bangSize.ratios.some((value) => value > 0)) {
      setPresetId(`product-${product.id}`);
      setBienThe([bienTheMoi(product.bangSize.sizes)]);
    } else {
      setPresetId("");
      setBienThe([bienTheMoi([])]);
    }
  };

  const handleLuuBangSizeMoi = async (p: SizeRatioPreset) => {
    try {
      const updated = await saveSharedSizeRatioPreset(p);
      setCustomPresets(updated);
      doiPresetChung(p.id, [...SIZE_RATIO_PRESETS, ...updated]);
      setOpenSizeBuilder(false);
      toast.success(`Đã lưu bảng size "${p.label}" lên Supabase`);
    } catch (error) {
      toast.error(`Chưa lưu được bảng size: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
    }
  };

  // === Danh sách biến thể (chỉ khác Màu + số lượng theo size) ===
  const [bienThe, setBienThe] = useState<BienTheDraft[]>([bienTheMoi([])]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  // Đổi tỉ lệ size chung -> áp lại size list cho MỌI biến thể đang có.
  const doiPresetChung = (id: string, fromList: SizeRatioPreset[] = allPresets) => {
    const p = fromList.find((x) => x.id === id);
    setPresetId(id);
    if (!p) return;
    setBienThe((prev) => prev.map((bt) => ({ ...bt, sizes: p.sizes.map((s) => ({ size: s, sl: 0 })), slDuKien: 0 })));
  };

  const capNhatBienThe = (idx: number, patch: Partial<BienTheDraft>) => {
    setBienThe((prev) => prev.map((bt, i) => (i === idx ? { ...bt, ...patch } : bt)));
  };

  const doiSlDuKien = (idx: number, sl: number) => {
    if (!preset) return;
    capNhatBienThe(idx, { slDuKien: sl, sizes: phanBoTheoTiLe(preset.ratios, preset.sizes, sl) });
  };

  const handleUploadAnh = async (idx: number, file: File) => {
    setUploadingIdx(idx);
    try {
      const url = await uploadProductFile(file, "kho-tp");
      capNhatBienThe(idx, { img: url });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không upload được ảnh");
    } finally {
      setUploadingIdx(null);
    }
  };

  const tongSLBienThe = (bt: BienTheDraft) => bt.sizes.reduce((s, x) => s + (x.sl || 0), 0);
  const tongSLTatCa = bienThe.reduce((s, bt) => s + tongSLBienThe(bt), 0);
  const tongGiaTriVon = tongSLTatCa * (giaVon || 0);

  // Tra cứu giá từ Bảng Giá Bán theo Kênh và Mã SP
  const layGiaKenh = (kenh: KenhBan) => {
    if (!maSP) return null;
    return layGia(kenh as KenhBanBangGia, maSP.trim().toUpperCase(), undefined, 1);
  };

  // Toggle kênh bán chung của lô hàng
  const toggleKenhBanChung = (kenh: KenhBan) => {
    const nextChannels = loKenhBan.includes(kenh)
      ? loKenhBan.filter((k) => k !== kenh)
      : [...loKenhBan, kenh];
    setLoKenhBan(nextChannels);
    // Đồng bộ sang tất cả các biến thể màu
    setBienThe((prev) => prev.map((bt) => ({ ...bt, kenhBan: nextChannels })));
  };

  // Kiểm tra kênh nào được chọn mà chưa có giá trong Bảng giá bán
  const missingChannels = useMemo(() => {
    if (!maSP) return [];
    return loKenhBan.filter((kenh) => {
      const existing = layGiaKenh(kenh);
      const manual = selectedBangGia[kenh] && (inputPrices[kenh] || 0) > 0;
      return existing == null && !manual;
    });
  }, [loKenhBan, maSP, layGia, selectedBangGia, inputPrices]);

  const handleSubmit = async () => {
    if (!selectedProduct && !isNewProduct) {
      toast.error("Vui lòng chọn hoặc thêm mới sản phẩm");
      return;
    }
    if (isNewProduct && (!maSP.trim() || !tenSP.trim())) {
      toast.error("Vui lòng nhập đầy đủ Mã và Tên sản phẩm");
      return;
    }
    if (!preset || preset.ratios.reduce((sum, value) => sum + value, 0) <= 0) {
      toast.error("Vui lòng chọn đúng bảng tỷ lệ size trước khi nhập kho");
      return;
    }
    const hopLe = bienThe.filter((bt) => bt.mau.trim());
    if (hopLe.length === 0) {
      toast.error("Cần ít nhất 1 biến thể có tên màu");
      return;
    }
    if (new Set(hopLe.map((bt) => bt.mau)).size !== hopLe.length) {
      toast.error("Không được chọn trùng màu / SKU trong cùng một lần nhập kho");
      return;
    }
    if (hopLe.some((bt) => tongSLBienThe(bt) <= 0)) {
      toast.error("Mỗi màu cần có số lượng nhập kho lớn hơn 0");
      return;
    }
    if (loKenhBan.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 kênh bán cho lô hàng này");
      return;
    }

    // Kiểm tra tính hợp lệ của giá bán cho TẤT CẢ các kênh đã chọn (Bắt buộc)
    const kenhThieuGia = loKenhBan.filter((kenh) => {
      const giaHeThong = layGiaKenh(kenh);
      const giaNhapMoi = (inputPrices[kenh] || 0) > 0 && selectedBangGia[kenh];
      return giaHeThong == null && !giaNhapMoi;
    });

    if (kenhThieuGia.length > 0) {
      const tenKenhThieu = kenhThieuGia.map((k) => DS_KENH_BAN.find((c) => c.value === k)?.label || k).join(", ");
      toast.error(`Bắt buộc có giá bán cho: ${tenKenhThieu}. Vui lòng nhập giá bán để tiếp tục.`);
      return;
    }

    setSaving(true);

    try {
      // Tự động lưu giá bán mới vào tab Bảng giá bán (useBangGia)
      for (const kenh of loKenhBan) {
        const giaHeThong = layGiaKenh(kenh);
        const bgId = selectedBangGia[kenh];
        const giaMoi = inputPrices[kenh];

        // Nếu kênh chưa có giá hoặc nhân sự có nhập giá mới kèm chọn bảng giá
        if (bgId && giaMoi && giaMoi > 0 && (!giaHeThong || giaHeThong !== giaMoi)) {
          await themChiTiet({
            bangGiaId: bgId,
            maSP: maSP.trim().toUpperCase(),
            giaBan: giaMoi,
            soLuongTu: 1,
          });
        }
      }
    } catch (err) {
      toast.error("Lỗi khi lưu bảng giá bán: " + (err as Error).message);
      setSaving(false);
      return;
    }

    const rows = hopLe.map((bt) => {
      const effectiveKenhBan = loKenhBan.length > 0 ? loKenhBan : bt.kenhBan;
      return {
        maSP: maSP.trim().toUpperCase(),
        tenSP: tenSP.trim(),
        phanLoai,
        thuongHieu,
        mau: bt.mau.trim(),
        size: bt.sizes.filter((s) => s.sl > 0).map((s) => s.size).join(", "),
        chiTietSize: bt.sizes,
        tiLeSize: preset.value,
        lsx: maLoKho,
        ngayNhap,
        soLuong: tongSLBienThe(bt),
        donGia: giaVon,
        giaVon,
        hinhAnh: bt.img ? [bt.img] : [],
        maSKU: `${maSP.trim().toUpperCase()}-${bt.mau.trim().toUpperCase()}`,
        giaBanSi: effectiveKenhBan.includes("ban-si") ? layGiaKenh("ban-si") || inputPrices["ban-si"] || 0 : 0,
        giaBanLe: effectiveKenhBan.includes("ban-le") ? layGiaKenh("ban-le") || inputPrices["ban-le"] || 0 : 0,
        giaBanLo: effectiveKenhBan.includes("ban-lo") ? layGiaKenh("ban-lo") || inputPrices["ban-lo"] || 0 : 0,
        giaTikTok: effectiveKenhBan.includes("tiktok") ? layGiaKenh("tiktok") || inputPrices["tiktok"] || 0 : 0,
        giaShopee: effectiveKenhBan.includes("shopee") ? layGiaKenh("shopee") || inputPrices["shopee"] || 0 : 0,
        kenhBan: effectiveKenhBan,
        viTri: bt.viTri.trim(),
        ghiChu: bt.ghiChu.trim(),
        trangThai: "con",
        __tempImage: bt.img,
      };
    });

    onSave(rows);
  };

  return (
    <>
      <ResponsiveModal
        open={true}
        maxWidth="6xl"
        onClose={onClose}
        title={
          <div className="flex items-center justify-between w-full pr-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2B4C3E] flex items-center justify-center shadow-inner text-white">
                <Package className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <div className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <span>Nhập Lô Hàng Tồn Kho</span>
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                    {maLoKho}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Thêm nhiều biến thể màu cùng lúc · Đồng bộ Bảng giá bán & Tỉ lệ size
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
                Quy mô: {bienThe.length} màu · {tongSLTatCa.toLocaleString()} SP
              </span>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-[86vh]">
          {/* Main content body: Chia 2 cột trên Desktop (lg:grid-cols-12) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/70">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* ==================== CỘT TRÁI: CẤU HÌNH SẢN PHẨM & BẢNG GIÁ (5 COLS) ==================== */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* KHỐI 1: THÔNG TIN SẢN PHẨM & THƯƠNG HIỆU */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                    Thông Tin Sản Phẩm & Lô Kho
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                        Sản phẩm trong danh mục *
                      </label>
                      <select 
                        value={isNewProduct ? "NEW" : maSP} 
                        onChange={(e) => chonSanPham(e.target.value)} 
                        disabled={loadingDanhMuc} 
                        className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold disabled:opacity-60 shadow-2xs"
                      >
                        <option value="">{loadingDanhMuc ? "Đang tải danh mục..." : "-- Chọn sản phẩm từ danh mục --"}</option>
                        <option value="NEW" className="font-bold text-emerald-600">+ Thêm sản phẩm mới ngoài danh mục</option>
                        {[...dsDanhMuc].sort((a, b) => a.id.localeCompare(b.id)).map((product) => (
                          <option key={product.id} value={product.id}>
                            [{product.id}] {product.tenSP}
                          </option>
                        ))}
                      </select>
                      {!loadingDanhMuc && dsDanhMuc.length === 0 && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-600">Danh mục sản phẩm đang trống.</p>
                      )}
                      {selectedProduct && selectedProduct.dsMau.length === 0 && (
                        <p className="mt-1.5 text-xs font-semibold text-rose-600">Sản phẩm chưa có màu / SKU trong danh mục.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Mã sản phẩm *</label>
                        <input 
                          value={maSP} 
                          onChange={(e) => isNewProduct && setMaSP(e.target.value)} 
                          readOnly={!isNewProduct} 
                          className={`w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none font-mono font-bold ${isNewProduct ? 'bg-white focus:border-[#2B4C3E]' : 'bg-slate-50 text-slate-700'}`} 
                          placeholder={isNewProduct ? "VD: M016" : ""} 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1 block">Phân loại *</label>
                        <select 
                          value={phanLoai} 
                          onChange={(e) => isNewProduct && setPhanLoai(e.target.value)} 
                          disabled={!isNewProduct && !!selectedProduct}
                          className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium disabled:bg-slate-50 disabled:text-slate-700"
                        >
                          {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 block">Tên sản phẩm *</label>
                      <input 
                        value={tenSP} 
                        onChange={(e) => isNewProduct && setTenSP(e.target.value)} 
                        readOnly={!isNewProduct} 
                        className={`w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm outline-none font-semibold ${isNewProduct ? 'bg-white focus:border-[#2B4C3E]' : 'bg-slate-50 text-slate-700'}`} 
                        placeholder={isNewProduct ? "VD: Áo Polo Cổ Trụ Phối Bo..." : ""} 
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Thương hiệu sản phẩm *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setThuongHieu("Man PJ")}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                            thuongHieu === "Man PJ"
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          Man PJ
                        </button>
                        <button
                          type="button"
                          onClick={() => setThuongHieu("Polomimin")}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                            thuongHieu === "Polomimin"
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          Polomimin
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KHỐI 2: ĐẶC TÍNH & BẢNG TỈ LỆ SIZE */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                  
                  {/* Header Khối 2 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-xs font-black shadow-xs shadow-indigo-500/20">
                        2
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                          Bảng Tỉ Lệ Size Áp Dụng
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">Quyết định cơ cấu size và phân bổ số lượng cho các màu</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setOpenSizeBuilder(true)}
                      className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1.5 border border-indigo-200 shadow-2xs hover:shadow-xs cursor-pointer"
                      title="Mở bảng quản lý & tạo tỉ lệ size"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Tạo bảng size
                    </button>
                  </div>
                  
                  {/* Dropdown chọn bảng tỉ lệ */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 block">
                        Chọn bảng tỉ lệ áp dụng cho lô hàng <span className="text-rose-500">*</span>
                      </label>
                      {preset && (
                        <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200/70">
                          Ri {preset.riSo} ({preset.sizes.length} size)
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <select 
                        value={presetId} 
                        onChange={(e) => doiPresetChung(e.target.value)} 
                        className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-xs focus:border-indigo-500 outline-none bg-white font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer"
                      >
                        <option value="">-- Chọn bảng tỷ lệ size áp dụng --</option>
                        {productSizePreset && (
                          <option value={productSizePreset.id}>
                            ✅ {productSizePreset.label} (Đúng danh mục)
                          </option>
                        )}
                        {SIZE_RATIO_PRESETS.length > 0 && (
                          <optgroup label="⚡ Bảng chuẩn hệ thống">
                            {SIZE_RATIO_PRESETS.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label} (Ri {p.riSo})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {customPresets.length > 0 && (
                          <optgroup label="⭐ Bảng tự tạo từ Supabase">
                            {customPresets.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.label} (Ri {p.riSo})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Gợi ý chọn nhanh các bảng phổ biến */}
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto pb-0.5">
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">Gợi ý nhanh:</span>
                      {productSizePreset && (
                        <button
                          type="button"
                          onClick={() => doiPresetChung(productSizePreset.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${presetId === productSizePreset.id ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
                        >
                          Theo danh mục ({productSizePreset.value})
                        </button>
                      )}
                      {SIZE_RATIO_PRESETS.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => doiPresetChung(p.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer shrink-0 ${presetId === p.id ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700"}`}
                        >
                          {p.label.replace("Tỉ lệ ", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {productSizePreset && presetId !== productSizePreset.id && (
                    <div className="mt-2 text-[11px] font-semibold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 flex items-center gap-2">
                      <span className="text-sm">⚠️</span>
                      <span>Đang dùng bảng size khác với danh mục sản phẩm (Danh mục: <strong className="font-bold">{productSizePreset.label}</strong>)</span>
                    </div>
                  )}

                  {/* Visual Size Matrix & Tỉ lệ trực quan */}
                  {preset ? (
                    <div className="mt-3.5 p-3.5 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-indigo-50/30 rounded-xl border border-indigo-100/90 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Ruler className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Chi tiết phân bổ cơ cấu size:</span>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-800 bg-white px-2 py-0.5 rounded-md border border-indigo-100 shadow-2xs">
                          {preset.label}
                        </span>
                      </div>

                      {/* Ma trận thẻ Size & Tỉ lệ tương ứng */}
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {preset.sizes.map((s, idx) => {
                          const ratio = preset.ratios[idx] || 0;
                          const pct = preset.riSo > 0 ? Math.round((ratio / preset.riSo) * 100) : 0;
                          return (
                            <div key={s} className="bg-white rounded-xl border border-indigo-100 shadow-2xs overflow-hidden flex flex-col text-center">
                              <div className="bg-indigo-50/80 py-1 px-1.5 text-[11px] font-black text-indigo-900 border-b border-indigo-100/70">
                                {s}
                              </div>
                              <div className="py-1 px-1.5 text-xs font-black text-indigo-600 bg-white">
                                x{ratio}
                              </div>
                              <div className="py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-50/80 border-t border-slate-100">
                                {pct}%
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Công thức và ghi chú */}
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium border-t border-indigo-100/60">
                        <div>
                          Công thức: <span className="font-mono font-bold text-indigo-800">{preset.sizes.join(" : ")} = {preset.ratios.join(" : ")}</span>
                        </div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Tự động tính số lượng cho tất cả màu</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5 p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 text-center flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Ruler className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-700 block">Chưa chọn bảng tỉ lệ size</span>
                        <span className="text-[11px] text-slate-400">Chọn bảng tỉ lệ từ danh mục phía trên hoặc tạo bảng mới</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpenSizeBuilder(true)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        + Tạo bảng size mới
                      </button>
                    </div>
                  )}
                </div>

                {/* KHỐI 4: GIÁ VỐN & KÊNH PHÂN PHỐI (BẢNG GIÁ BÁN) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</span>
                      Giá Vốn & Kênh Phân Phối
                    </h3>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Bắt buộc có giá
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Giá vốn */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <label className="text-xs font-bold text-slate-700 mb-1 block">
                        Giá vốn sản phẩm (VNĐ / SP) *
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min={0} 
                          value={giaVon || ""} 
                          onChange={(e) => setGiaVon(Math.max(0, parseInt(e.target.value) || 0))} 
                          className="w-full pl-3 pr-10 py-2 border-2 border-slate-200 rounded-xl text-sm font-black focus:border-[#2B4C3E] outline-none bg-white text-slate-800 shadow-2xs" 
                          placeholder="0" 
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">VNĐ</span>
                      </div>
                    </div>

                    {/* Danh sách kênh bán */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-2 block flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-amber-600" /> Chọn kênh bán áp dụng cho lô hàng:
                      </label>

                      <div className="space-y-2.5">
                        {DS_KENH_BAN.map((kenh) => {
                          const isSelected = loKenhBan.includes(kenh.value);
                          const currentPrice = layGiaKenh(kenh.value);
                          const customPrice = inputPrices[kenh.value];
                          const activeLists = dsBangGia.filter((b) => b.kenhBan === kenh.value && b.trangThai === "dang-ap-dung");
                          const allLists = dsBangGia.filter((b) => b.kenhBan === kenh.value);

                          return (
                            <div 
                              key={kenh.value} 
                              className={`rounded-xl border-2 transition-all p-3 ${
                                isSelected 
                                  ? "border-[#2B4C3E]/40 bg-emerald-50/20 shadow-2xs" 
                                  : "border-slate-200 bg-slate-50/60 opacity-70"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleKenhBanChung(kenh.value)}
                                    className="w-4 h-4 rounded border-2 border-slate-300 text-[#2B4C3E] focus:ring-[#2B4C3E] accent-[#2B4C3E] cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold ${isSelected ? "text-slate-800" : "text-slate-500"}`}>
                                    {kenh.label}
                                  </span>
                                </label>

                                {isSelected && (
                                  <div>
                                    {currentPrice != null && currentPrice > 0 ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        {formatVND(currentPrice)}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        Cần bổ sung giá
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Form nhập giá nếu kênh chưa có giá */}
                              {isSelected && currentPrice == null && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 bg-white p-2.5 rounded-lg border border-amber-200/90 space-y-2">
                                  <div className="text-[10px] font-bold text-amber-800 flex items-center justify-between">
                                    <span>Bổ sung giá bán {kenh.label}:</span>
                                    <span className="font-normal text-amber-600">Tự động lưu vào Bảng giá bán</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <select
                                        value={selectedBangGia[kenh.value] || ""}
                                        onChange={(e) => setSelectedBangGia({ ...selectedBangGia, [kenh.value]: e.target.value })}
                                        className="w-full px-2 py-1.5 border border-slate-200 rounded-md text-[11px] bg-slate-50 outline-none"
                                      >
                                        <option value="">-- Chọn bảng giá --</option>
                                        {(activeLists.length > 0 ? activeLists : allLists).map((b) => (
                                          <option key={b.id} value={b.id}>
                                            {b.tenBangGia}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        min={0}
                                        placeholder="Nhập giá (VNĐ)..."
                                        value={customPrice || ""}
                                        onChange={(e) => setInputPrices({ ...inputPrices, [kenh.value]: Math.max(0, parseInt(e.target.value) || 0) })}
                                        className="w-full px-2 py-1.5 border border-amber-300 rounded-md text-[11px] font-bold bg-white outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ==================== CỘT PHẢI: BIẾN THỂ MÀU SẮC & SỐ LƯỢNG (7 COLS) ==================== */}
              <div className="lg:col-span-7 space-y-5">
                
                {/* KHỐI 3: DANH SÁCH BIẾN THỂ MÀU */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-600"></div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">4</span>
                      Danh Sách Biến Thể Màu Sắc ({bienThe.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#2B4C3E] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                        Tổng nhập: {tongSLTatCa.toLocaleString()} SP
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {bienThe.map((bt, idx) => {
                      const tong = tongSLBienThe(bt);
                      return (
                        <div key={idx} className="border-2 border-slate-200 bg-slate-50/60 rounded-2xl p-4 relative group transition-all hover:border-[#2B4C3E] hover:bg-white hover:shadow-sm">
                          {bienThe.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => setBienThe((prev) => prev.filter((_, i) => i !== idx))} 
                              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" 
                              title="Xoá màu này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-4 mb-3">
                            {/* Ảnh màu biến thể */}
                            <div 
                              className="w-24 h-24 bg-white rounded-2xl border-2 border-dashed border-slate-300 shrink-0 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-2xs hover:border-[#2B4C3E] transition-all group/img" 
                              onClick={() => fileInputs.current[idx]?.click()}
                              title="Nhấn để tải ảnh màu"
                            >
                              <input 
                                ref={(el) => { fileInputs.current[idx] = el; }} 
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadAnh(idx, f); }} 
                              />
                              {uploadingIdx === idx ? (
                                <div className="text-[10px] text-emerald-600 font-bold text-center px-1 animate-pulse">Đang tải...</div>
                              ) : bt.img ? (
                                <img src={bt.img} alt={bt.mau} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" />
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Camera className="w-6 h-6 text-slate-300 group-hover/img:text-[#2B4C3E] transition-colors" />
                                  <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Tải ảnh</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Tên màu và chia số lượng */}
                            <div className="flex-1 space-y-3">
                              <div className="pr-8">
                                <label className="text-xs font-bold text-slate-700 mb-1 block">
                                  {isNewProduct ? "Tên màu sắc *" : "Màu / SKU trong danh mục *"}
                                </label>
                                {isNewProduct ? (
                                  <input 
                                    value={bt.mau} 
                                    onChange={(e) => capNhatBienThe(idx, { mau: e.target.value })} 
                                    placeholder="VD: Đen, Trắng, Xanh rêu, Xám chì..." 
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-medium shadow-2xs" 
                                  />
                                ) : (
                                  <select 
                                    value={bt.mau} 
                                    onChange={(e) => capNhatBienThe(idx, { mau: e.target.value })} 
                                    disabled={!selectedProduct} 
                                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm focus:border-[#2B4C3E] outline-none bg-white font-semibold disabled:bg-slate-100 shadow-2xs"
                                  >
                                    <option value="">-- Chọn màu / SKU --</option>
                                    {selectedProduct?.dsMau.map((variant) => (
                                      <option key={variant.maSKU || variant.ten} value={variant.ten}>
                                        {variant.ten}{variant.maSKU ? ` — SKU: ${variant.maSKU}` : ""}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>

                              {/* Bảng phân chia số lượng theo size */}
                              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                    <Calculator className="w-3.5 h-3.5 text-[#2B4C3E]" /> Số lượng theo Size
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-semibold text-slate-500 shrink-0">Tổng tự chia:</label>
                                    <input 
                                      type="number" 
                                      min={0} 
                                      value={bt.slDuKien || ""} 
                                      onChange={(e) => doiSlDuKien(idx, Math.max(0, parseInt(e.target.value) || 0))} 
                                      className="w-20 px-2 py-1 border-2 border-slate-200 rounded-lg text-xs focus:border-[#2B4C3E] outline-none text-right font-black bg-slate-50 focus:bg-white text-emerald-800" 
                                      placeholder="0" 
                                    />
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-end">
                                  {bt.sizes.map((s, sIdx) => (
                                    <div key={s.size} className="flex flex-col shrink-0 min-w-[52px]">
                                      <span className="w-full px-1 py-0.5 text-[10px] font-bold rounded-t-lg bg-slate-100 text-slate-700 text-center border-t border-x border-slate-200">
                                        {s.size}
                                      </span>
                                      <input
                                        type="number"
                                        min={0}
                                        value={s.sl || 0}
                                        onChange={(e) => {
                                          const val = Math.max(0, parseInt(e.target.value) || 0);
                                          const newSizes = [...bt.sizes];
                                          newSizes[sIdx] = { ...s, sl: val };
                                          capNhatBienThe(idx, { sizes: newSizes });
                                        }}
                                        className="w-full px-1 py-1 text-xs font-black text-center bg-white text-emerald-700 border-2 border-slate-200 rounded-b-lg focus:border-[#2B4C3E] outline-none"
                                      />
                                    </div>
                                  ))}
                                  <div className="flex flex-col shrink-0 min-w-[60px] ml-auto">
                                    <span className="w-full px-1 py-0.5 text-[10px] font-bold rounded-t-lg bg-[#2B4C3E] text-white text-center">
                                      Tổng
                                    </span>
                                    <span className="w-full px-1 py-1 text-xs font-black text-center bg-emerald-50 border-x-2 border-b-2 border-[#2B4C3E] rounded-b-lg text-[#2B4C3E]">
                                      {tong.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Vị trí kệ và Trạng thái */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 border-dashed">
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Vị trí kệ kho</label>
                              <select 
                                value={bt.viTri} 
                                onChange={(e) => capNhatBienThe(idx, { viTri: e.target.value })} 
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none"
                              >
                                <option value="">-- Chọn vị trí --</option>
                                {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-600 mb-1 block">Trạng thái kho</label>
                              <select 
                                value={bt.trangThai} 
                                onChange={(e) => capNhatBienThe(idx, { trangThai: e.target.value as any })} 
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white outline-none font-medium"
                              >
                                <option value="con">Còn hàng</option>
                                <option value="dat-hang">Đã đặt hàng</option>
                                <option value="xuat-kho">Đã xuất kho</option>
                                <option value="khong-dat">Lỗi / Không đạt</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => preset && setBienThe((prev) => [...prev, bienTheMoi(preset.sizes)])}
                    disabled={!preset}
                    className="w-full mt-4 py-2.5 border-2 border-dashed border-[#2B4C3E] rounded-xl text-[#2B4C3E] font-bold text-xs hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                  >
                    <Plus className="w-4 h-4" /> Thêm biến thể màu mới
                  </button>
                </div>

                {/* KHỐI 5: TÓM TẮT LÔ NHẬP KHO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black tracking-wider text-slate-800 uppercase flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#2B4C3E]" /> Tóm Tắt Lô Nhập Kho
                    </span>
                    <span className="text-xs font-mono font-bold text-[#2B4C3E] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {maLoKho}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold">Sản phẩm</div>
                      <div className="font-bold text-slate-800 truncate">{maSP || "Chưa có"}</div>
                      <div className="text-[11px] text-slate-500 truncate">{tenSP || "—"}</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold">Thương hiệu</div>
                      <div className="font-bold text-slate-800">{thuongHieu}</div>
                      <div className="text-[11px] text-slate-500">{LOAI_SP_LABELS[phanLoai as LoaiSP] || phanLoai}</div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 font-semibold">Tổng nhập kho</div>
                      <div className="font-black text-emerald-700 text-sm">{tongSLTatCa.toLocaleString()} SP</div>
                      <div className="text-[11px] text-slate-500">{bienThe.length} màu sắc</div>
                    </div>
                  </div>

                  {/* Kênh bán đã áp dụng */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-600">Kênh bán ({loKenhBan.length}):</span>
                    {loKenhBan.map((kVal) => {
                      const kObj = DS_KENH_BAN.find((x) => x.value === kVal);
                      const pVal = layGiaKenh(kVal) || inputPrices[kVal] || 0;
                      return (
                        <span key={kVal} className="text-[11px] font-semibold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {kObj?.label}: <strong className="text-emerald-700">{pVal > 0 ? formatVND(pVal) : "Chưa có giá"}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Sticky footer đáy modal */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 rounded-b-2xl z-20 shadow-md">
            <div className="flex items-center gap-3 text-xs">
              <span className="font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                Lô: <strong>{maLoKho}</strong>
              </span>
              <span className="font-bold text-[#2B4C3E] bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                Tổng nhập: <strong className="text-sm">{tongSLTatCa.toLocaleString()}</strong> SP · <strong>{bienThe.length}</strong> màu
              </span>
              {giaVon > 0 && tongSLTatCa > 0 && (
                <span className="hidden sm:inline text-slate-500 font-semibold">
                  Tổng giá trị vốn: <strong className="text-slate-800">{formatVND(tongGiaTriVon)}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-xl font-bold transition-colors text-sm">
                Hủy bỏ
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={saving || loadingDanhMuc || loadingBangGia || (!selectedProduct && !isNewProduct)}
                className="px-6 py-2.5 bg-[#2B4C3E] hover:bg-[#203a2f] text-white rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Save className="w-4 h-4" /> {saving ? "Đang lưu..." : loadingBangGia ? "Đang tải bảng giá..." : `Lưu lô hàng (${bienThe.length} màu · ${tongSLTatCa.toLocaleString()} SP)`}
              </button>
            </div>
          </div>
        </div>
      </ResponsiveModal>

      {openSizeBuilder && (
        <AddSizeRatioModal onClose={() => setOpenSizeBuilder(false)} onSelectPreset={handleLuuBangSizeMoi} />
      )}
    </>
  );
}

// =================== SỬA 1 BIẾN THỂ (giữ nguyên hành vi cũ) ===================
function SuaBienTheForm({ sp, initialImage, onClose, onSave }: { sp: SanPhamTP; initialImage?: string; onClose: () => void; onSave: (data: any) => Promise<void> | void }) {
  const isValidKey = Object.keys(LOAI_SP_LABELS).includes(sp.phanLoai || "");
  const detectedPhanLoai = isValidKey ? sp.phanLoai : detectLoaiSP((sp.tenSP || "") + " " + (sp.phanLoai || ""));

  const [chiTietSize, setChiTietSize] = useState<Array<{ size: string; sl: number }>>(() => {
    if (Array.isArray(sp.chiTietSize) && sp.chiTietSize.length > 0) {
      return sp.chiTietSize;
    }
    const defaultSizes = sp.size ? sp.size.split(",").map(s => s.trim()).filter(Boolean) : ["L", "XL", "2XL", "3XL"];
    const baseList = defaultSizes.length > 0 ? defaultSizes : ["L", "XL", "2XL", "3XL"];
    return baseList.map(size => ({ size, sl: 0 }));
  });

  const [form, setForm] = useState({
    maSP: sp.maSP || "",
    tenSP: sp.tenSP || "",
    phanLoai: detectedPhanLoai || "BoTru",
    thuongHieu: (sp as any).thuongHieu || (sp.maSP?.toUpperCase().includes("BPJ") || sp.tenSP?.toUpperCase().includes("MANPJ") ? "Man PJ" : "Polomimin"),
    mau: sp.mau || "Trắng",
    size: hienThiDanhSachSize(sp.size || "", sp.chiTietSize),
    lsx: layMaLoTonKho(sp),
    ngayNhap: sp.ngayNhap || new Date().toISOString().slice(0, 10),
    soLuong: sp.soLuong ?? 0,
    donGia: sp.donGia ?? 0,
    giaVon: sp.giaVon ?? 0,
    giaBanSi: sp.giaBanSi ?? 0,
    giaBanLe: sp.giaBanLe ?? 0,
    giaBanLo: sp.giaBanLo ?? 0,
    giaTikTok: sp.giaTikTok ?? 0,
    giaShopee: sp.giaShopee ?? 0,
    kenhBan: sp.kenhBan?.length ? sp.kenhBan : (["ban-le"] as KenhBan[]),
    viTri: sp.viTri || "",
    trangThai: sp.trangThai || "con",
    ghiChu: sp.ghiChu || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [image, setImage] = useState(initialImage || "");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phân bổ tự động số lượng vào các size khi user đổi "Số lượng thực tế"
  const handleSoLuongChange = (rawVal: string) => {
    const newSl = Math.max(0, parseInt(rawVal) || 0);
    let newTt = form.trangThai;
    if (newSl === 0) newTt = "xuat-kho";
    else if (newSl > 0 && (form.trangThai === "xuat-kho" || (form.trangThai as any) === "het")) newTt = "con";

    let updatedSizes = chiTietSize;
    if (updatedSizes.length > 0) {
      const tongCu = updatedSizes.reduce((s, x) => s + (Number(x.sl) || 0), 0);
      let conLai = newSl;
      updatedSizes = updatedSizes.map((x, idx) => {
        if (idx === updatedSizes.length - 1) return { ...x, sl: conLai };
        const chia = tongCu > 0 ? Math.round(((Number(x.sl) || 0) / tongCu) * newSl) : Math.floor(newSl / updatedSizes.length);
        conLai -= chia;
        return { ...x, sl: Math.max(0, chia) };
      });
    } else {
      updatedSizes = [{ size: form.size || "Freesize", sl: newSl }];
    }
    setChiTietSize(updatedSizes);
    const newSizeStr = hienThiDanhSachSize(form.size, updatedSizes);
    setForm((prev) => ({ ...prev, soLuong: newSl, trangThai: newTt, size: newSizeStr }));
  };

  // Cho phép user gõ trực tiếp số lượng từng size nếu muốn
  const handleSizeItemChange = (idx: number, newQty: number) => {
    const updated = [...chiTietSize];
    updated[idx] = { ...updated[idx], sl: Math.max(0, newQty) };
    const tongMoi = updated.reduce((s, x) => s + (Number(x.sl) || 0), 0);
    setChiTietSize(updated);
    let newTt = form.trangThai;
    if (tongMoi === 0) newTt = "xuat-kho";
    else if (tongMoi > 0 && (form.trangThai === "xuat-kho" || (form.trangThai as any) === "het")) newTt = "con";
    setForm((prev) => ({
      ...prev,
      soLuong: tongMoi,
      trangThai: newTt,
      size: hienThiDanhSachSize(prev.size, updated),
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductFile(file, "kho-tp");
      setImage(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không upload được ảnh");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ResponsiveModal
      open={true}
      maxWidth="3xl"
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-slate-800 font-black tracking-tight">
          <div className="bg-[#2B4C3E] p-1.5 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span>CẬP NHẬT BIẾN THỂ</span>
        </div>
      }
    >
      <div className="flex flex-col bg-slate-50/50 h-full">
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-6">

          {/* KHỐI 1: THÔNG TIN CHUNG */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs">1</span>
              Thông Tin Chung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mã SP mẹ *</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 uppercase font-mono font-bold text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  value={form.maSP} onChange={(e) => setForm({ ...form, maSP: e.target.value.toUpperCase() })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên SP mẹ *</label>
                <input 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800 bg-slate-50 transition-all hover:bg-white" 
                  value={form.tenSP} onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, tenSP: val, phanLoai: detectLoaiSP(val) });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Phân loại</label>
                <select 
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 bg-slate-50 font-medium text-slate-700 transition-all hover:bg-white cursor-pointer"
                  value={form.phanLoai} onChange={(e) => setForm({ ...form, phanLoai: e.target.value })}
                >
                  {Object.entries(LOAI_SP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mã lô tồn kho</label>
                <input 
                  readOnly
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 bg-slate-100 font-mono text-slate-700 cursor-not-allowed"
                  value={form.lsx}
                />
                <p className="mt-1.5 text-xs font-semibold text-slate-500">
                  {sp.maLenhCat ? `Nguồn sản xuất: ${sp.maLenhCat}` : "Nguồn: nhập tồn kho trực tiếp"}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Thương hiệu *</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, thuongHieu: "Man PJ" })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                    form.thuongHieu === "Man PJ"
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Man PJ
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, thuongHieu: "Polomimin" })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                    form.thuongHieu === "Polomimin"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Polomimin
                </button>
              </div>
            </div>
          </div>

          {/* KHỐI 2: ĐẶC TÍNH & TRẠNG THÁI */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">2</span>
              Đặc Tính & Trạng Thái
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Màu</label>
                <input 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white" 
                  value={form.mau} onChange={(e) => setForm({ ...form, mau: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Size / Tỉ lệ</label>
                <input readOnly className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-slate-100 cursor-not-allowed" value={form.size} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vị trí (Khu kệ)</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white cursor-pointer" 
                  value={form.viTri} onChange={(e) => setForm({ ...form, viTri: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  {DS_KHU_KE_HANG.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 bg-white cursor-pointer" 
                  value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as any })}
                >
                  <option value="con">Còn hàng</option>
                  <option value="dat-hang">Đã đặt hàng</option>
                  <option value="xuat-kho">Đã xuất kho</option>
                  <option value="khong-dat">Không đạt</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4 items-center">
              <div className="w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
                {uploading ? (
                  <div className="text-[9px] text-blue-600 font-bold text-center px-1">Đang tải...</div>
                ) : image ? (
                  <img src={image} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" />
                ) : (
                  <div className="text-center text-slate-400 group-hover:text-blue-500 transition-colors">
                    <Camera className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <div className="text-[9px] font-bold uppercase">Tải ảnh</div>
                  </div>
                )}
              </div>
              <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider">Số Lượng Thực Tế *</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" min="0" 
                    className="w-32 border-2 border-blue-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-lg font-bold text-blue-700 bg-white" 
                    value={form.soLuong} 
                    onChange={(e) => handleSoLuongChange(e.target.value)}
                  />
                  <span className="text-xs font-bold text-slate-500">sản phẩm</span>
                </div>
              </div>
            </div>

            {/* PHÂN BỔ THEO SIZE NẾU CÓ CHI TIẾT */}
            {chiTietSize.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-blue-600" /> Chi tiết phân bổ theo size
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {chiTietSize.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col items-center shadow-xs">
                      <span className="text-xs font-black text-slate-700 uppercase">{item.size}</span>
                      <input
                        type="number"
                        min="0"
                        className="w-full text-center font-bold text-blue-700 bg-white border border-slate-300 rounded-lg py-1 mt-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={item.sl}
                        onChange={(e) => handleSizeItemChange(idx, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* KHỐI 3: THIẾT LẬP GIÁ BÁN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs">3</span>
              Thiết Lập Giá Bán
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Giá Vốn", value: form.giaVon, set: (v: number) => setForm({ ...form, giaVon: v }) },
                { label: "Giá Bán Lẻ", value: form.giaBanLe, set: (v: number) => setForm({ ...form, giaBanLe: v }) },
                { label: "Giá Bán Sỉ", value: form.giaBanSi, set: (v: number) => setForm({ ...form, giaBanSi: v }) },
                { label: "Giá Bán Lô", value: form.giaBanLo, set: (v: number) => setForm({ ...form, giaBanLo: v }) },
                { label: "Giá TikTok", value: form.giaTikTok, set: (v: number) => setForm({ ...form, giaTikTok: v }) },
                { label: "Giá Shopee", value: form.giaShopee, set: (v: number) => setForm({ ...form, giaShopee: v }) },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{item.label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₫</span>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono font-bold text-slate-700" 
                      placeholder="0" 
                      value={item.value || ""} 
                      onChange={e => item.set(Math.max(0, parseInt(e.target.value) || 0))} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 4: THÔNG TIN KHÁC */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-fuchsia-500"></div>
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xs">4</span>
              Kênh Bán & Ghi Chú
            </h3>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kênh được phép bán *</label>
              <div className="flex flex-wrap gap-2">
                {DS_KENH_BAN.map((kenh) => {
                  const selected = form.kenhBan.includes(kenh.value);
                  return (
                    <button
                      key={kenh.value}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        kenhBan: selected
                          ? form.kenhBan.filter((value) => value !== kenh.value)
                          : [...form.kenhBan, kenh.value],
                      })}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold shadow-sm transition-colors ${selected ? "border-[#2B4C3E] bg-[#2B4C3E]/5 text-[#2B4C3E]" : "border-slate-200 text-slate-500 hover:border-slate-300 bg-white"}`}
                    >
                      {selected ? "✓ " : ""}{kenh.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú thêm</label>
              <textarea 
                value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} 
                rows={2} 
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 outline-none bg-slate-50" 
              />
            </div>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-slate-200 bg-white flex justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-b-2xl">
          <button type="button" disabled={isSaving} onClick={onClose} className="px-6 py-2.5 font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border-2 border-slate-200 disabled:opacity-50">Đóng</button>
          <button 
            type="button"
            disabled={isSaving}
            onClick={async () => {
              if (form.kenhBan.length === 0) {
                toast.error("Cần chọn ít nhất 1 kênh bán");
                return;
              }
              setIsSaving(true);
              try {
                await onSave({ ...sp, ...form, chiTietSize, __tempImage: image });
                onClose();
              } catch (err: any) {
                console.error("[SuaBienTheForm] Lỗi khi lưu:", err);
                toast.error(err?.message || "Lỗi khi lưu thay đổi");
              } finally {
                setIsSaving(false);
              }
            }} 
            className="px-8 py-2.5 font-bold text-white bg-[#2B4C3E] hover:bg-[#1f382d] rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all scale-100 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSaving ? "Đang lưu..." : "LƯU THAY ĐỔI"}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
