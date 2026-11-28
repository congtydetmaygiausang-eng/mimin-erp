"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Image as ImageIcon,
  ListChecks,
  Package,
  Plus,
  Printer,
  Save,
  Search,
  Send,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  List,
  Phone,
  X,
  Layers,
  Sparkles,
  Scissors,
  CircleDot,
  Box,
  Tag,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { formatVND, KHO_VAT_TU, KHO_VAI, type KhoVai, type KhoVatTu } from "@/lib/data/real-data";
import { isSupabaseEnabled, supabase } from "@/lib/supabase/client";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang, type KhachHangUI } from "@/lib/data/khach-hang-store";
import { SearchableCustomerSelect } from "@/components/ui/SearchableCustomerSelect";
import { type PhieuDatNccLineItem, type PhieuDatNccPhuLieu, type TrangThaiPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { useVatTuDatSanXuat } from "@/lib/data/vat-tu-dat-san-xuat-store";
import { uploadProductFile } from "@/lib/product-upload";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { TheoDoiTienDo } from "./theo-doi-tien-do";
import { DanhSachDonHang } from "./danh-sach-don-hang";
import { MaterialThumbnail } from "./material-thumbnail";
import { useWorkspace } from "@/lib/workspace-context";

const today = new Date().toISOString().slice(0, 10);
const deliveryDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

const customFields: FieldDef[] = [
  { name: "maMau", label: "Mã mẫu", type: "text", required: true },
  { name: "tenMau", label: "Tên mẫu vật tư", type: "text", required: true },
  {
    name: "loai",
    label: "Phân loại",
    type: "select",
    required: true,
    options: ["Bo cổ", "Nút", "Phụ liệu", "Kho vải", "Khác"].map((value) => ({ value, label: value })),
  },
  { name: "mauSac", label: "Màu sắc", type: "text", required: true },
  {
    name: "donVi",
    label: "Đơn vị",
    type: "select",
    required: true,
    options: ["bộ", "cái", "kg", "sp", "mét", "cuộn"].map((value) => ({ value, label: value })),
  },
  { name: "giaMuaThamKhao", label: "Giá mua tham khảo", type: "number", min: 0 },
  { name: "giaBanDeXuat", label: "Giá bán đề xuất", type: "number", min: 0 },
  { name: "hinhAnh", label: "Hình vật tư", type: "image" },
];

const num = (value: string | number) => Math.max(0, Number(value) || 0);
const safe = (value: string) =>
  value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);

type MucDichDatHang = "customer" | "internal";
export type MaterialCategory = "all" | "bo_co" | "nut" | "phu_lieu" | "kho_vai";

export interface UnifiedMaterialItem {
  id: string;
  maMau: string;
  tenMau: string;
  loai: string;
  category: "bo_co" | "nut" | "phu_lieu" | "kho_vai";
  mauSac: string;
  quyCach: string;
  donVi: string;
  maNccMacDinh: string;
  giaMuaThamKhao: number;
  giaBanDeXuat: number;
  soLuongToiThieu: number;
  hinhAnh: string;
  trangThai: "Đang dùng" | "Tạm ngưng";
  tonKho?: number;
}

type KhoPhuLieuRow = {
  sku: string;
  ten_vt: string | null;
  loai_chi_tiet: string | null;
  mau_sac: string | null;
  dvt: string | null;
  don_gia: number | null;
  ton_kho: number | null;
  ton_toi_thieu: number | null;
  so_cay_nhap: number | null;
  ton_cay: number | null;
  ty_le_hao_hut: number | null;
  kho: string | null;
  ghi_chu: string | null;
  hinh_anh?: string | null;
};

const PL_IMAGES_KEY = "mimin_kho_phuLieu_images";
const PL_INVENTORY_KEY = "mimin_kho_phuLieu_custom";

const parseSharedGhiChu = (ghiChu: string | null | undefined): { note: string; imageUrl: string } => {
  if (!ghiChu) return { note: "", imageUrl: "" };
  let current = ghiChu;
  let finalNote = ghiChu;
  let finalImage = "";

  for (let i = 0; i < 10; i++) {
    try {
      const parsed = JSON.parse(current);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        if (typeof parsed.imageUrl === "string" && parsed.imageUrl && !finalImage) {
          finalImage = parsed.imageUrl;
        }
        if (typeof parsed.note === "string") {
          current = parsed.note;
          finalNote = parsed.note;
        } else {
          finalNote = "";
          break;
        }
      } else if (typeof parsed === "string") {
        current = parsed;
        finalNote = parsed;
      } else {
        break;
      }
    } catch {
      finalNote = current;
      break;
    }
  }
  return { note: finalNote === ghiChu ? ghiChu : finalNote, imageUrl: finalImage };
};

const readSharedImage = (ghiChu: string | null | undefined): string => parseSharedGhiChu(ghiChu).imageUrl;
const readSharedNote = (ghiChu: string | null | undefined): string => parseSharedGhiChu(ghiChu).note;

// Danh mục phụ liệu may mặc mở rộng
const EXTRA_PHU_LIEU: UnifiedMaterialItem[] = [
  {
    id: "PL-NHAN-CO",
    maMau: "NHAN-CO",
    tenMau: "Nhãn dệt cổ áo MIMIN",
    loai: "Nhãn mác",
    category: "phu_lieu",
    mauSac: "Trắng chữ đen",
    quyCach: "Kích thước 3x5cm, dệt sợi satin mềm mại",
    donVi: "cái",
    maNccMacDinh: "",
    giaMuaThamKhao: 800,
    giaBanDeXuat: 1200,
    soLuongToiThieu: 1000,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
  {
    id: "PL-NHAN-SIZE",
    maMau: "NHAN-SIZE",
    tenMau: "Bộ Nhãn size dệt (S, M, L, XL, 2XL)",
    loai: "Nhãn mác",
    category: "phu_lieu",
    mauSac: "Trắng chữ đen",
    quyCach: "Nhãn gập đôi 1.2x3cm",
    donVi: "cái",
    maNccMacDinh: "",
    giaMuaThamKhao: 400,
    giaBanDeXuat: 600,
    soLuongToiThieu: 1000,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
  {
    id: "PL-DAY-DET-CO",
    maMau: "DAY-DET-CO",
    tenMau: "Dây dệt xương cá viền cổ áo",
    loai: "Dây dệt",
    category: "phu_lieu",
    mauSac: "Các màu",
    quyCach: "Bản rộng 1.2cm, dệt xương cá 100% cotton",
    donVi: "cuộn",
    maNccMacDinh: "",
    giaMuaThamKhao: 35000,
    giaBanDeXuat: 45000,
    soLuongToiThieu: 10,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
  {
    id: "PL-CHI-MAY",
    maMau: "CHI-MAY",
    tenMau: "Chỉ may công nghiệp chất lượng cao",
    loai: "Chỉ may",
    category: "phu_lieu",
    mauSac: "Các màu theo vải",
    quyCach: "Sợi 40/2, 5000m/cuộn, chống đứt sợi",
    donVi: "cuộn",
    maNccMacDinh: "",
    giaMuaThamKhao: 18000,
    giaBanDeXuat: 24000,
    soLuongToiThieu: 20,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
  {
    id: "PL-KEO-DUNG",
    maMau: "KEO-DUNG",
    tenMau: "Keo dựng ép cổ áo & trụ áo",
    loai: "Keo ép",
    category: "phu_lieu",
    mauSac: "Trắng / Đen",
    quyCach: "Khổ 1m, keo mịn bám dính chắc sau ép nhiệt",
    donVi: "mét",
    maNccMacDinh: "",
    giaMuaThamKhao: 12000,
    giaBanDeXuat: 16000,
    soLuongToiThieu: 50,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
  {
    id: "PL-TUI-OPP",
    maMau: "TUI-OPP",
    tenMau: "Túi dán OPP đóng gói sản phẩm",
    loai: "Bao bì",
    category: "phu_lieu",
    mauSac: "Trong suốt",
    quyCach: "Kích thước 26x35cm + 4cm băng keo dán",
    donVi: "cái",
    maNccMacDinh: "",
    giaMuaThamKhao: 500,
    giaBanDeXuat: 750,
    soLuongToiThieu: 1000,
    hinhAnh: "",
    trangThai: "Đang dùng",
  },
];

export default function PhieuDatNccPhuLieuPage() {
  const { user } = useSession();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
  const { list: catalogMaterials, themMau } = useVatTuDatSanXuat();
  const { orders, saveOrder } = usePhieuDatNcc();
  const { activeWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<"create" | "list" | "progress">("create");
  const [orderPurpose, setOrderPurpose] = useState<MucDichDatHang>("customer");
  const [categoryFilter, setCategoryFilter] = useState<MaterialCategory>("all");
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [orderItems, setOrderItems] = useState<PhieuDatNccLineItem[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<KhoVai[]>(KHO_VAT_TU);

  const [form, setForm] = useState({
    maPhieu: `PO-${today.replaceAll("-", "")}-${String(Date.now()).slice(-4)}`,
    ngayDat: today,
    ngayGiao: deliveryDate,
    maKhachHang: "",
    maNcc: "",
    soLuong: "1000",
    donGiaMua: "0",
    donGiaBan: "0",
    phiVanChuyen: "0",
    chiPhiKhac: "0",
    thueVat: "10",
    quyCach: "",
    diaChiGiao: "",
    ghiChu: "",
    giaoThangKhach: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadCachedMaterials = () => {
      try {
        const cachedRaw = localStorage.getItem(PL_INVENTORY_KEY);
        const imageRaw = localStorage.getItem(PL_IMAGES_KEY);
        const cached = cachedRaw ? (JSON.parse(cachedRaw) as unknown) : null;
        const images = imageRaw ? (JSON.parse(imageRaw) as unknown) : null;
        const imageMap = images && typeof images === "object" ? (images as Record<string, unknown>) : {};
        if (Array.isArray(cached) && cached.length > 0) {
          setWarehouseMaterials(
            (cached as KhoVai[]).map((item) => ({
              ...item,
              hinhAnh: typeof imageMap[item.maVT] === "string" ? String(imageMap[item.maVT]) : item.hinhAnh,
            }))
          );
        }
      } catch {}
    };

    const loadRemoteMaterials = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      const baseFields =
        "sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu";
      const imageResult = await supabase
        .from("kho")
        .select(`${baseFields}, hinh_anh`)
        .eq("loai", "Phu lieu")
        .order("sku");
      let rows = imageResult.data as unknown as KhoPhuLieuRow[] | null;
      let loadError = imageResult.error;

      if (loadError?.code === "PGRST204" || loadError?.code === "42703") {
        const fallbackResult = await supabase.from("kho").select(baseFields).eq("loai", "Phu lieu").order("sku");
        rows = fallbackResult.data as unknown as KhoPhuLieuRow[] | null;
        loadError = fallbackResult.error;
      }
      if (loadError || !mounted || !rows) return;

      const remote = rows.map((row) => {
        const fallback = KHO_VAT_TU.find((item) => item.maVT === row.sku);
        return {
          ...(fallback || {}),
          maVT: row.sku,
          tenVT: row.ten_vt || fallback?.tenVT || row.sku,
          loai: row.loai_chi_tiet || fallback?.loai || "Phụ liệu",
          mauSac: row.mau_sac || fallback?.mauSac || "",
          dvt: row.dvt || fallback?.dvt || "cái",
          donGia: Number(row.don_gia) || fallback?.donGia || 0,
          tonKho: Number(row.ton_kho) || 0,
          tonToiThieu: Number(row.ton_toi_thieu) || 0,
          soCayNhap: Number(row.so_cay_nhap) || 0,
          tonCay: Number(row.ton_cay) || 0,
          tyLeHaoHut: Number(row.ty_le_hao_hut) || 0,
          kho: row.kho || "Kho phụ liệu",
          ghiChu: row.ghi_chu || "",
          hinhAnh: row.hinh_anh || readSharedImage(row.ghi_chu) || fallback?.hinhAnh || "",
        } satisfies KhoVai;
      });
      if (remote.length > 0) setWarehouseMaterials(remote);
    };

    loadCachedMaterials();
    void loadRemoteMaterials();
    return () => {
      mounted = false;
    };
  }, []);

  // Tổng hợp toàn bộ danh sách vật tư đa dạng: Bo cổ, Nút, Phụ liệu, Kho vải, Mẫu catalog
  const allMaterials = useMemo<UnifiedMaterialItem[]>(() => {
    const list: UnifiedMaterialItem[] = [];
    const seenCodes = new Set<string>();

    // 1. Kho Bo Cổ & Nút & Phụ Liệu (KHO_VAT_TU)
    warehouseMaterials.forEach((item) => {
      const code = item.maVT.toUpperCase();
      if (seenCodes.has(code)) return;
      seenCodes.add(code);

      let cat: UnifiedMaterialItem["category"] = "phu_lieu";
      const loaiLower = (item.loai || "").toLowerCase();
      if (loaiLower.includes("bo") || code.startsWith("BO-") || code.startsWith("BT-")) {
        cat = "bo_co";
      } else if (loaiLower.includes("nút") || loaiLower.includes("nut") || code.startsWith("NUT-") || code.startsWith("N-")) {
        cat = "nut";
      }

      list.push({
        id: `KHO-${item.maVT}`,
        maMau: item.maVT,
        tenMau: item.tenChuan || item.tenVT,
        loai: item.loai || (cat === "bo_co" ? "Bo cổ" : cat === "nut" ? "Nút" : "Phụ liệu"),
        category: cat,
        mauSac: item.mauChuan || item.mauSac || "",
        quyCach: readSharedNote(item.ghiChu) || (cat === "bo_co" ? "Bo cổ dệt theo vải chuẩn" : cat === "nut" ? "Nút áo đồng màu vải" : "Phụ liệu đóng gói / may"),
        donVi: item.dvt || (cat === "bo_co" || cat === "nut" ? "bộ" : "sp"),
        maNccMacDinh: "",
        giaMuaThamKhao: item.donGia || (cat === "bo_co" ? 6000 : cat === "nut" ? 1500 : 700),
        giaBanDeXuat: Math.ceil(((item.donGia || 6000) * 1.35) / 500) * 500,
        soLuongToiThieu: 1,
        hinhAnh: item.hinhAnh || "",
        trangThai: "Đang dùng",
        tonKho: item.tonKho || 0,
      });
    });

    // 2. Danh mục Phụ liệu may mặc mở rộng
    EXTRA_PHU_LIEU.forEach((item) => {
      const code = item.maMau.toUpperCase();
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        list.push(item);
      }
    });

    // 3. Kho Vải (KHO_VAI)
    KHO_VAI.forEach((item) => {
      const code = (item.maMoi || item.maVT).toUpperCase();
      if (seenCodes.has(code)) return;
      seenCodes.add(code);

      // Ảnh swatch vải
      const swatchNum = (item.maMoi || "").replace("VAI", "").replace("VAI-", "").trim();
      const localSwatch = swatchNum ? `/swatches/vai-${swatchNum.padStart(2, "0")}.jpg` : "";

      list.push({
        id: `VAI-${item.maVT}`,
        maMau: item.maMoi || item.maVT,
        tenMau: item.tenChuan || item.tenVT,
        loai: item.loai || "Vải thành phẩm",
        category: "kho_vai",
        mauSac: item.mauChuan || item.mauSac || "",
        quyCach: item.ghiChu || "Vải chính khổ 1m8, định lượng chuẩn",
        donVi: item.dvt || "kg",
        maNccMacDinh: "",
        giaMuaThamKhao: item.donGia || 75000,
        giaBanDeXuat: Math.ceil(((item.donGia || 75000) * 1.25) / 1000) * 1000,
        soLuongToiThieu: 10,
        hinhAnh: item.hinhAnh || localSwatch || "/swatches/vai-01.jpg",
        trangThai: "Đang dùng",
        tonKho: item.tonKho || 0,
      });
    });

    // 4. Mẫu từ Catalog Vật Tư Đặt Sản Xuất
    catalogMaterials.forEach((item) => {
      const code = item.maMau.toUpperCase();
      if (seenCodes.has(code)) return;
      seenCodes.add(code);

      const loaiLower = (item.loai || "").toLowerCase();
      let cat: UnifiedMaterialItem["category"] = "phu_lieu";
      if (loaiLower.includes("bo") || code.startsWith("BO-")) cat = "bo_co";
      else if (loaiLower.includes("nút") || loaiLower.includes("nut")) cat = "nut";
      else if (loaiLower.includes("vải") || loaiLower.includes("vai")) cat = "kho_vai";

      list.push({
        id: item.id,
        maMau: item.maMau,
        tenMau: item.tenMau,
        loai: item.loai,
        category: cat,
        mauSac: item.mauSac,
        quyCach: item.quyCach,
        donVi: item.donVi,
        maNccMacDinh: item.maNccMacDinh,
        giaMuaThamKhao: item.giaMuaThamKhao,
        giaBanDeXuat: item.giaBanDeXuat,
        soLuongToiThieu: item.soLuongToiThieu,
        hinhAnh: item.hinhAnh || "",
        trangThai: item.trangThai,
      });
    });

    return list;
  }, [warehouseMaterials, catalogMaterials]);

  // Bộ lọc theo Tab danh mục & Ô tìm kiếm
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return allMaterials
      .filter((item) => {
        if (item.trangThai !== "Đang dùng") return false;
        if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
        if (keyword) {
          const match = [item.maMau, item.tenMau, item.loai, item.mauSac, item.quyCach].some((v) =>
            v?.toLocaleLowerCase("vi").includes(keyword)
          );
          if (!match) return false;
        }
        return true;
      })
      .slice(0, 36);
  }, [allMaterials, categoryFilter, search]);

  const selected = allMaterials.find((item) => item.id === selectedId) || null;

  const update = (name: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (typeof value === "string" && selected && (name === "soLuong" || name === "donGiaMua" || name === "donGiaBan")) {
      setOrderItems((current) =>
        current.map((item) => (item.maVatTu === selected.maMau ? { ...item, [name]: num(value) } : item))
      );
    }
  };

  const totals = useMemo(() => {
    const tienMua = orderItems.reduce((sum, item) => sum + item.soLuong * item.donGiaMua, 0);
    const doanhThu = orderItems.reduce((sum, item) => sum + item.soLuong * item.donGiaBan, 0);
    const giaVon = tienMua + num(form.phiVanChuyen) + num(form.chiPhiKhac);
    const loiNhuan = orderPurpose === "internal" ? 0 : doanhThu - giaVon;
    const vatDauRa = orderPurpose === "internal" ? 0 : (doanhThu * num(form.thueVat)) / 100;
    return {
      tienMua,
      doanhThu,
      giaVon,
      loiNhuan,
      vatDauRa,
      tongHoaDon: doanhThu + vatDauRa,
      bienLoiNhuan: doanhThu > 0 ? (loiNhuan / doanhThu) * 100 : 0,
    };
  }, [form.chiPhiKhac, form.phiVanChuyen, form.thueVat, orderItems, orderPurpose]);

  const selectMaterial = (item: UnifiedMaterialItem) => {
    const existing = orderItems.find((line) => line.maVatTu === item.maMau);
    setSelectedId(item.id);

    // Thêm vào danh sách mặt hàng nếu chưa có
    if (!existing) {
      setOrderItems((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          maVatTu: item.maMau,
          tenVatTu: item.tenMau,
          mauSac: item.mauSac,
          quyCach: item.quyCach,
          donVi: item.donVi,
          soLuong: item.category === "kho_vai" ? 50 : Math.max(1, item.soLuongToiThieu || 100),
          donGiaMua: item.giaMuaThamKhao,
          donGiaBan: item.giaBanDeXuat,
          hinhAnh: item.hinhAnh,
        },
      ]);
    }

    setForm((current) => ({
      ...current,
      soLuong: String(existing?.soLuong || (item.category === "kho_vai" ? 50 : Math.max(1, item.soLuongToiThieu || 100))),
      donGiaMua: String(existing?.donGiaMua ?? item.giaMuaThamKhao),
      donGiaBan: String(existing?.donGiaBan ?? item.giaBanDeXuat),
      maNcc: item.maNccMacDinh || current.maNcc,
      quyCach: item.quyCach || current.quyCach,
    }));
  };

  const switchPurpose = (purpose: MucDichDatHang) => {
    setOrderPurpose(purpose);
    setSelectedId("");
    setOrderItems([]);
    setForm((current) => ({
      ...current,
      maKhachHang: purpose === "internal" ? "" : current.maKhachHang,
      donGiaMua: "0",
      donGiaBan: "0",
      giaoThangKhach: purpose === "customer",
      diaChiGiao: purpose === "internal" ? "Kho phụ liệu MIMIN" : current.diaChiGiao,
    }));
  };

  const updateLine = (id: string, field: "soLuong" | "donGiaMua" | "donGiaBan", value: string) => {
    setOrderItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: num(value) } : item)));
    const active = orderItems.find((item) => item.id === id);
    if (active?.maVatTu === selected?.maMau) setForm((current) => ({ ...current, [field]: value }));
  };

  const removeLine = (id: string) => setOrderItems((current) => current.filter((item) => item.id !== id));

  const addCustom = async (values: Record<string, string>) => {
    const item = await themMau({
      maMau: values.maMau,
      tenMau: values.tenMau,
      loai: values.loai,
      mauSac: values.mauSac,
      quyCach: "",
      donVi: values.donVi,
      maNccMacDinh: form.maNcc,
      giaMuaThamKhao: num(values.giaMuaThamKhao),
      giaBanDeXuat: num(values.giaBanDeXuat),
      soLuongToiThieu: 0,
      thoiGianSanXuat: 0,
      maKhachHangSoHuu: "",
      hinhAnh: values.hinhAnh || "",
      dungChung: true,
      trangThai: "Đang dùng",
    });
    selectMaterial({
      id: item.id,
      maMau: item.maMau,
      tenMau: item.tenMau,
      loai: item.loai,
      category: "phu_lieu",
      mauSac: item.mauSac,
      quyCach: item.quyCach,
      donVi: item.donVi,
      maNccMacDinh: item.maNccMacDinh,
      giaMuaThamKhao: item.giaMuaThamKhao,
      giaBanDeXuat: item.giaBanDeXuat,
      soLuongToiThieu: item.soLuongToiThieu,
      hinhAnh: item.hinhAnh,
      trangThai: item.trangThai,
    });
  };

  const buildOrder = (trangThai: TrangThaiPhieuDatNcc): PhieuDatNccPhuLieu | null => {
    if (orderPurpose === "customer" && !form.maKhachHang) {
      toast.error("Vui lòng chọn khách hàng/xưởng may");
      return null;
    }
    if (!form.maNcc) {
      toast.error("Vui lòng chọn nhà cung cấp");
      return null;
    }
    if (orderItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một mẫu vật tư từ danh sách bên trái");
      return null;
    }
    if (orderItems.some((item) => item.soLuong <= 0)) {
      toast.error("Số lượng mỗi vật tư phải lớn hơn 0");
      return null;
    }
    const first = orderItems[0];
    return {
      id: crypto.randomUUID(),
      maPhieu: form.maPhieu,
      ngayDat: form.ngayDat,
      ngayGiao: form.ngayGiao,
      nguoiTao: user?.name || user?.email || "Hồ Minh Sang",
      maKhachHang: form.maKhachHang,
      maNcc: form.maNcc,
      ownerOrganizationId: activeWorkspace?.id || "mimin",
      supplierOrganizationId: `ncc:${form.maNcc}`,
      customerOrganizationId: form.maKhachHang ? `kh:${form.maKhachHang}` : undefined,
      maVatTu: first.maVatTu,
      tenVatTu: first.tenVatTu,
      mauSac: first.mauSac,
      quyCach: first.quyCach,
      donVi: first.donVi,
      soLuong: orderItems.reduce((sum, item) => sum + item.soLuong, 0),
      donGiaMua: first.donGiaMua,
      donGiaBan: orderPurpose === "internal" ? 0 : first.donGiaBan,
      phiVanChuyen: num(form.phiVanChuyen),
      chiPhiKhac: num(form.chiPhiKhac),
      thueVat: orderPurpose === "internal" ? 0 : num(form.thueVat),
      giaoThangKhach: orderPurpose === "customer" && form.giaoThangKhach,
      diaChiGiao: form.diaChiGiao,
      ghiChu: `${orderPurpose === "internal" ? "[Đặt cho MIMIN] " : "[Đặt theo đơn khách] "}${form.ghiChu}`,
      hinhAnh: files,
      items: orderItems.map((item) => (orderPurpose === "internal" ? { ...item, donGiaBan: 0 } : item)),
      trangThai,
      createdAt: new Date().toISOString(),
    };
  };

  const saveDraft = async () => {
    const order = buildOrder("Nháp");
    if (!order) return;
    await saveOrder(order);
    toast.success(`Đã lưu thành công phiếu ${order.maPhieu}`);
    setActiveTab("list");
  };

  const printOrder = async (target: "ncc" | "customer") => {
    const order = buildOrder(target === "ncc" ? "Đã gửi NCC" : "Nháp");
    if (!order) return;
    if (target === "ncc") await saveOrder(order);
    const customer = khachHangList.find((item) => item.maKH === order.maKhachHang);
    const supplier = nccList.find((item) => item.ma_ncc === order.maNcc);
    const isSupplier = target === "ncc";
    const printItems = order.items || [];
    const subtotal = printItems.reduce(
      (sum, item) => sum + item.soLuong * (isSupplier ? item.donGiaMua : item.donGiaBan),
      0
    );
    const itemRows = printItems
      .map((item) => {
        const unitPrice = isSupplier ? item.donGiaMua : item.donGiaBan;
        return `<tr><td><b>${safe(item.maVatTu)}</b><br>${safe(item.tenVatTu)}</td><td>${safe(item.mauSac)}<br><span class="muted">${safe(item.quyCach || "Theo mẫu đính kèm")}</span></td><td class="right">${item.soLuong.toLocaleString("vi-VN")} ${safe(item.donVi)}</td><td class="right">${formatVND(unitPrice)}</td><td class="right"><b>${formatVND(item.soLuong * unitPrice)}</b></td></tr>`;
      })
      .join("");
    const vat = isSupplier ? 0 : totals.vatDauRa;
    const imageUrl = order.hinhAnh.find((file) => file.type.startsWith("image/"))?.dataUrl || selected?.hinhAnh || "";

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const popup = frame.contentWindow;
    if (!popup) {
      frame.remove();
      toast.error("Không khởi tạo được vùng in");
      return;
    }

    popup.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${safe(order.maPhieu)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #059669;padding-bottom:18px}h1{font-size:24px;margin:0;color:#047857}.muted{color:#64748b;font-size:12px}.box{border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin-top:18px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#ecfdf5}.right{text-align:right}.total{font-size:18px;font-weight:bold;color:#047857}.photo{max-width:220px;max-height:160px;border-radius:8px;margin-top:12px}.signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:50px;gap:80px}.note{white-space:pre-wrap}@media print{button{display:none}body{margin:15mm}}</style></head><body><header><div><div class="muted">MIMIN ERP · QUẢN LÝ SẢN XUẤT</div><h1>${isSupplier ? "LỆNH ĐẶT NHÀ CUNG CẤP & SẢN XUẤT VẬT TƯ" : "PHIẾU XÁC NHẬN ĐẶT HÀNG"}</h1><div class="muted">Mã phiếu: <b>${safe(order.maPhieu)}</b></div></div><div class="right"><b>Ngày đặt: ${safe(order.ngayDat)}</b><div>Hạn giao: ${safe(order.ngayGiao)}</div></div></header><div class="box"><b>${isSupplier ? "NHÀ CUNG CẤP / XƯỞNG DỆT" : "KHÁCH HÀNG / XƯỞNG MAY"}</b><div>${safe(isSupplier ? supplier?.ten_ncc || order.maNcc : customer?.ten || order.maKhachHang)}</div><div class="muted">SĐT: ${safe(isSupplier ? supplier?.sdt || "Chưa có" : customer?.sdt || "Chưa có")}</div><div class="muted">Địa chỉ: ${safe(isSupplier ? supplier?.dia_chi || "Theo thỏa thuận" : customer?.diaChi || order.diaChiGiao)}</div>${isSupplier ? `<div class="muted">Nơi giao hàng: ${safe(order.diaChiGiao || "Kho phụ liệu MIMIN")}</div>` : ""}</div><table><thead><tr><th>Mẫu vật tư</th><th>Màu / Quy cách</th><th class="right">Số lượng</th><th class="right">Đơn giá</th><th class="right">Thành tiền</th></tr></thead><tbody>${itemRows}</tbody></table>${imageUrl ? `<div class="box"><b>Hình mẫu vật tư:</b><br><img class="photo" src="${safe(imageUrl)}" alt="Hình mẫu"></div>` : ""}<div class="box right"><div>Tạm tính: <b>${formatVND(subtotal)}</b></div>${!isSupplier ? `<div>VAT ${order.thueVat}%: <b>${formatVND(vat)}</b></div><div class="total">Tổng thanh toán: ${formatVND(subtotal + vat)}</div>` : `<div class="total">Tổng giá trị đặt hàng: ${formatVND(subtotal)}</div>`}</div><div class="box note"><b>Ghi chú:</b> ${safe(order.ghiChu || "Không có ghi chú thêm.")}</div><div class="signatures"><div><b>${isSupplier ? "ĐẠI DIỆN MIMIN ĐẶT HÀNG" : "ĐẠI DIỆN MIMIN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div><div><b>${isSupplier ? "XÁC NHẬN CỦA NHÀ CUNG CẤP" : "XÁC NHẬN CỦA KHÁCH HÀNG"}</b><p class="muted">Ký và ghi rõ họ tên</p></div></div><script>window.onload=()=>window.print()</script></body></html>`
    );
    popup.document.close();
    window.setTimeout(() => frame.remove(), 60_000);
    if (isSupplier) toast.success(`Đã chuyển phiếu ${order.maPhieu} sang trạng thái Đã gửi NCC`);
  };

  const handleEdit = (order: PhieuDatNccPhuLieu) => {
    setActiveTab("create");
    setOrderPurpose(order.maKhachHang ? "customer" : "internal");
    setForm({
      maPhieu: order.maPhieu,
      ngayDat: order.ngayDat,
      ngayGiao: order.ngayGiao,
      maKhachHang: order.maKhachHang || "",
      maNcc: order.maNcc,
      soLuong: String(order.soLuong),
      donGiaMua: String(order.donGiaMua),
      donGiaBan: String(order.donGiaBan),
      phiVanChuyen: String(order.phiVanChuyen),
      chiPhiKhac: String(order.chiPhiKhac),
      thueVat: String(order.thueVat),
      quyCach: order.quyCach,
      diaChiGiao: order.diaChiGiao || "",
      ghiChu: order.ghiChu?.replace(/\[(Đặt cho MIMIN|Đặt theo đơn khách)\] /, "") || "",
      giaoThangKhach: order.giaoThangKhach || false,
    });
    setOrderItems(
      order.items || [
        {
          id: crypto.randomUUID(),
          maVatTu: order.maVatTu,
          tenVatTu: order.tenVatTu,
          mauSac: order.mauSac,
          quyCach: order.quyCach,
          donVi: order.donVi,
          soLuong: order.soLuong,
          donGiaMua: order.donGiaMua,
          donGiaBan: order.donGiaBan,
          hinhAnh: order.hinhAnh?.[0]?.dataUrl || "",
        },
      ]
    );
    setFiles(order.hinhAnh || []);
  };

  return (
    <div data-order-purpose={orderPurpose} className="min-h-[calc(100vh-7rem)] space-y-4 animate-fade-in">
      {/* ============================================================== */}
      {/* 1. TOP TABS NAVIGATION CHUYÊN NGHIỆP                           */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-900 shadow-xs w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition ${
              activeTab === "create"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
            }`}
          >
            <Plus className="h-4 w-4" /> Tạo Đơn Đặt NCC
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition ${
              activeTab === "list"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
            }`}
          >
            <List className="h-4 w-4" /> Danh Sách Đơn Hàng
            <span
              className={`ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === "list" ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
              }`}
            >
              {orders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs md:text-sm font-semibold transition ${
              activeTab === "progress"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60"
            }`}
          >
            <ListChecks className="h-4 w-4" /> Theo Dõi Tiến Độ
          </button>
        </div>

        {activeTab === "create" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustom(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition"
            >
              <Plus className="h-4 w-4 text-emerald-600" /> Thêm Mẫu Mới
            </button>
            <button
              onClick={saveDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Save className="h-4 w-4" /> Lưu Phiếu Đặt
            </button>
          </div>
        )}
      </div>

      {activeTab === "list" ? (
        <DanhSachDonHang user={user} onEdit={handleEdit} />
      ) : activeTab === "progress" ? (
        <TheoDoiTienDo user={user} />
      ) : (
        <>
          {/* ============================================================== */}
          {/* 2. CARD HEADER MÀU XANH LÁ SÁNG HƠN (THEO YÊU CẦU ANH SANG)     */}
          {/* ============================================================== */}
          <section className="overflow-hidden rounded-3xl border border-emerald-500/40 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <header className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-b border-emerald-500/40 px-5 py-5 text-white md:px-7 md:py-6 shadow-md">
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="h-fit rounded-2xl bg-white/20 border border-white/30 p-3 text-white shadow-inner">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-0.5 rounded-full bg-white/20 text-white border border-white/30 uppercase tracking-wider mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
                      PHIẾU ĐẶT NHÀ CUNG CẤP · SẢN XUẤT VẬT TƯ & DỆT
                    </div>
                    <h1 className="text-2xl font-black md:text-3xl tracking-tight text-white drop-shadow-xs">
                      Đặt Dệt Phụ Liệu & Cung Ứng Vật Tư
                    </h1>
                    <p className="mt-1 text-xs md:text-sm text-emerald-50/90 max-w-2xl">
                      Cập nhật toàn bộ danh mục từ Kho phụ liệu, Bo cổ, Nút, Phụ liệu và Kho vải thành phẩm. Đối soát
                      chính xác giá mua NCC, giá bán khách và lợi nhuận trên từng phiếu.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printOrder(orderPurpose === "internal" ? "ncc" : "customer")}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold shadow-xs transition backdrop-blur-md"
                  >
                    <Printer className="h-4 w-4" /> In Phiếu
                  </button>
                  <button
                    onClick={saveDraft}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md transition active:scale-95"
                  >
                    <Save className="h-4 w-4 text-emerald-700" /> Lưu Phiếu Nháp
                  </button>
                </div>
              </div>
            </header>

            {/* Chọn mục đích đặt hàng: Khách hàng / Nội bộ */}
            <div className="border-b border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 md:px-7">
              <div className="grid max-w-2xl gap-2 rounded-2xl bg-slate-200/70 p-1.5 dark:bg-slate-800 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => switchPurpose("customer")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    orderPurpose === "customer"
                      ? "border-emerald-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold ring-2 ring-emerald-500/20"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <b className="block text-xs md:text-sm text-emerald-700 dark:text-emerald-400">
                    Đặt theo đơn khách / xưởng may
                  </b>
                  <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                    Đầy đủ giá mua NCC, giá bán khách, tính lợi nhuận & xuất hóa đơn.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => switchPurpose("internal")}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    orderPurpose === "internal"
                      ? "border-emerald-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold ring-2 ring-emerald-500/20"
                      : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  <b className="block text-xs md:text-sm text-emerald-700 dark:text-emerald-400">
                    Đặt cho công ty MIMIN (Nội bộ)
                  </b>
                  <span className="text-[11px] text-slate-500 font-normal mt-0.5 block">
                    Chỉ tính giá vốn mua từ NCC, tự động nhập tồn kho MIMIN sau khi giao.
                  </span>
                </button>
              </div>
            </div>

            {/* Khối chính 2 cột: Cột 1 chọn vật tư (Full Bo cổ, Nút, Phụ liệu, Kho vải) | Cột 2 thông tin đơn & chi phí */}
            <div
              className={`grid border-b border-slate-200/80 dark:border-slate-800 ${
                orderPurpose === "internal" ? "xl:grid-cols-[1.1fr_1.9fr]" : "xl:grid-cols-[1.1fr_1.9fr]"
              }`}
            >
              {/* ============================================================== */}
              {/* CỘT 1: CHỌN VẬT TƯ ĐA DẠNG: KHO PHỤ LIỆU, NÚT, BO CỔ, KHO VẢI    */}
              {/* ============================================================== */}
              <section className="border-b p-4 dark:border-slate-800 md:p-6 xl:border-b-0 xl:border-r bg-slate-50/30 dark:bg-slate-900/30">
                <div className="flex items-center justify-between mb-2">
                  <Title
                    icon={Package}
                    text="1. Chọn Vật Tư / Kho Vải"
                    sub="Toàn bộ danh mục Bo cổ, Nút, Phụ liệu & Kho vải"
                  />
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    {filtered.length} mẫu
                  </span>
                </div>

                {/* Thanh Tabs phân loại danh mục nhanh theo yêu cầu anh Sang */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
                  {[
                    { id: "all", label: "Tất cả", icon: Layers },
                    { id: "bo_co", label: "Bo cổ", icon: Sparkles },
                    { id: "nut", label: "Nút", icon: CircleDot },
                    { id: "phu_lieu", label: "Phụ liệu", icon: Box },
                    { id: "kho_vai", label: "Kho vải", icon: Scissors },
                  ].map((tab) => {
                    const active = categoryFilter === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCategoryFilter(tab.id as MaterialCategory)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                          active
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-750"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Ô tìm kiếm thông minh */}
                <div className="relative mt-2.5">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    className="input pl-9 text-xs sm:text-sm bg-white dark:bg-slate-800"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo mã (BO-..., NUT-..., VAI-...), tên hoặc màu sắc..."
                  />
                </div>

                {/* Danh sách vật tư dạng card cuộn */}
                <div className="mt-3 grid max-h-[520px] overflow-y-auto pr-1 grid-cols-1 gap-2 no-scrollbar">
                  {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700 bg-white dark:bg-slate-800">
                      <Package className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Không tìm thấy vật tư phù hợp với từ khóa
                      </p>
                    </div>
                  ) : (
                    filtered.map((item) => {
                      const isSelected = item.id === selected?.id;
                      const inOrder = orderItems.some((line) => line.maVatTu === item.maMau);

                      return (
                        <button
                          key={item.id}
                          onClick={() => selectMaterial(item)}
                          className={`relative flex items-center gap-3 overflow-hidden rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20"
                              : inOrder
                              ? "border-teal-500/80 bg-white dark:bg-slate-900 shadow-2xs"
                              : "border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 shadow-2xs"
                          }`}
                        >
                          {/* Thumbnail hình ảnh hoặc Icon Phụ Liệu chuẩn chuyên nghiệp */}
                          <MaterialThumbnail
                            maMau={item.maMau}
                            tenMau={item.tenMau}
                            category={item.category}
                            loai={item.loai}
                            mauSac={item.mauSac}
                            hinhAnh={item.hinhAnh}
                            size="md"
                          />

                          {/* Thông tin vật tư */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                {item.maMau}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {item.category === "bo_co"
                                  ? "Bo cổ"
                                  : item.category === "nut"
                                  ? "Nút"
                                  : item.category === "kho_vai"
                                  ? "Vải"
                                  : "Phụ liệu"}
                              </span>
                            </div>
                            <div className="line-clamp-1 text-xs font-semibold text-slate-900 dark:text-white mt-0.5">
                              {item.tenMau}
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                              <span>
                                {item.mauSac ? `Màu: ${item.mauSac} · ` : ""}
                                {item.donVi}
                              </span>
                              <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                                {formatVND(item.giaMuaThamKhao)}
                              </span>
                            </div>
                          </div>

                          {/* Dấu check đang chọn */}
                          {isSelected && (
                            <span className="absolute right-2 top-2 rounded-full bg-emerald-600 p-1 text-white shadow-xs">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Thẻ Mẫu Đang Chọn - Thiết kế chuẩn ERP xanh lá sáng */}
                <div className="mt-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-800/60 p-3.5 text-slate-900 dark:text-white shadow-2xs">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Mẫu đang thao tác</span>
                    {selected && (
                      <span className="text-[10px] font-mono font-semibold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                        {selected.donVi}
                      </span>
                    )}
                  </div>
                  {selected ? (
                    <div className="flex items-center gap-3">
                      <MaterialThumbnail
                        maMau={selected.maMau}
                        tenMau={selected.tenMau}
                        category={selected.category}
                        loai={selected.loai}
                        mauSac={selected.mauSac}
                        hinhAnh={selected.hinhAnh}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight truncate">
                          {selected.tenMau}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                          <span>Mã: <b>{selected.maMau}</b></span>
                          {selected.mauSac && <span>· Màu: <b>{selected.mauSac}</b></span>}
                          <span>· Giá tham khảo: <b>{formatVND(selected.giaMuaThamKhao)}</b></span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Bấm vào một vật tư phía trên để nạp thông tin vào đơn đặt
                    </div>
                  )}
                </div>
              </section>

              {/* ============================================================== */}
              {/* CỘT 2: THÔNG TIN ĐƠN ĐẶT HÀNG & BẢNG KÊ CHI PHÍ                */}
              {/* ============================================================== */}
              <section className="p-4 md:p-6 space-y-4">
                <Title
                  icon={UserRound}
                  text="2. Thông Tin & Chi Phí Đặt Hàng"
                  sub={
                    orderPurpose === "internal"
                      ? "MIMIN → Nhà cung cấp → Nhập kho phụ liệu nội bộ"
                      : "Khách hàng đặt → MIMIN điều phối → Nhà cung cấp dệt/sản xuất"
                  }
                />

                {/* Form nhập thông tin đơn */}
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Mã phiếu đặt (PO)">
                    <input
                      className="input font-mono font-bold text-emerald-700 dark:text-emerald-400"
                      value={form.maPhieu}
                      onChange={(e) => update("maPhieu", e.target.value)}
                    />
                  </Field>

                  {orderPurpose === "customer" && (
                    <Field label="Khách hàng / Xưởng may" required>
                      <SearchableCustomerSelect
                        value={form.maKhachHang}
                        onChange={(val, kh) => {
                          update("maKhachHang", val);
                          if (kh?.diaChi) update("diaChiGiao", kh.diaChi);
                        }}
                        customers={khachHangList}
                        placeholder="-- Tìm khách hàng, SĐT hoặc mã KH --"
                      />
                    </Field>
                  )}

                  <Field label="Nhà cung cấp dệt / vật tư" required>
                    <select
                      className="input font-semibold"
                      value={form.maNcc}
                      onChange={(e) => update("maNcc", e.target.value)}
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {nccList.map((ncc) => (
                        <option key={ncc.ma_ncc} value={ncc.ma_ncc}>
                          {ncc.ma_ncc} · {ncc.ten_ncc} {ncc.sdt ? `(${ncc.sdt})` : ""}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={`Số lượng đặt (${selected?.donVi || "đơn vị"})`} required>
                    <input
                      type="number"
                      min="1"
                      className="input font-bold"
                      value={form.soLuong}
                      onChange={(e) => update("soLuong", e.target.value)}
                    />
                  </Field>

                  <Field label="Ngày đặt hàng">
                    <input
                      type="date"
                      className="input"
                      value={form.ngayDat}
                      onChange={(e) => update("ngayDat", e.target.value)}
                    />
                  </Field>

                  <Field label="Hạn giao hàng">
                    <input
                      type="date"
                      className="input"
                      value={form.ngayGiao}
                      onChange={(e) => update("ngayGiao", e.target.value)}
                    />
                  </Field>

                  <Money
                    label="Đơn giá mua từ NCC"
                    value={form.donGiaMua}
                    onChange={(v) => update("donGiaMua", v)}
                  />

                  {orderPurpose === "customer" && (
                    <Money
                      label="Đơn giá bán cho khách"
                      value={form.donGiaBan}
                      onChange={(v) => update("donGiaBan", v)}
                      accent
                    />
                  )}

                  <Money
                    label="Phí vận chuyển mình chịu"
                    value={form.phiVanChuyen}
                    onChange={(v) => update("phiVanChuyen", v)}
                  />

                  <Money
                    label="Chi phí khác (nếu có)"
                    value={form.chiPhiKhac}
                    onChange={(v) => update("chiPhiKhac", v)}
                  />

                  {orderPurpose === "customer" && (
                    <Field label="Thuế VAT (%)">
                      <select
                        className="input"
                        value={form.thueVat}
                        onChange={(e) => update("thueVat", e.target.value)}
                      >
                        <option value="0">0% (Không xuất hóa đơn)</option>
                        <option value="8">8% (Thuế suất ưu đãi)</option>
                        <option value="10">10% (Thuế suất tiêu chuẩn)</option>
                      </select>
                    </Field>
                  )}
                </div>

                {/* Bảng danh sách vật tư đã đưa vào đơn hàng này */}
                {orderItems.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-emerald-600" />
                        Danh sách các mặt hàng trong đơn ({orderItems.length})
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Chạm vào danh sách bên trái để thêm mặt hàng khác
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 text-left border-b border-slate-100 dark:border-slate-800">
                          <tr>
                            <th className="p-2.5">Vật tư / Mẫu</th>
                            <th className="p-2.5">Màu / Quy cách</th>
                            <th className="p-2.5 text-center w-24">Số lượng</th>
                            <th className="p-2.5 text-right w-28">Giá mua NCC</th>
                            {orderPurpose === "customer" && (
                              <th className="p-2.5 text-right w-28">Giá bán khách</th>
                            )}
                            <th className="p-2.5 text-right w-32">Thành tiền mua</th>
                            <th className="p-2.5 text-center w-12">Xóa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {orderItems.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="p-2.5">
                                <div className="flex items-center gap-2.5">
                                  <MaterialThumbnail
                                    maMau={item.maVatTu}
                                    tenMau={item.tenVatTu}
                                    mauSac={item.mauSac}
                                    size="sm"
                                  />
                                  <div>
                                    <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                                      {item.maVatTu}
                                    </div>
                                    <div className="font-medium text-slate-800 dark:text-slate-200">
                                      {item.tenVatTu}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-2.5 text-slate-600 dark:text-slate-400">
                                <div>{item.mauSac || "—"}</div>
                                <div className="text-[11px] opacity-75">{item.donVi}</div>
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  className="w-20 text-center font-bold p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  value={item.soLuong}
                                  onChange={(e) => updateLine(item.id, "soLuong", e.target.value)}
                                />
                              </td>
                              <td className="p-2.5 text-right font-mono font-semibold">
                                {formatVND(item.donGiaMua)}
                              </td>
                              {orderPurpose === "customer" && (
                                <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                                  {formatVND(item.donGiaBan)}
                                </td>
                              )}
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                {formatVND(item.soLuong * item.donGiaMua)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeLine(item.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                  title="Xóa mặt hàng này khỏi đơn"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Quy cách kỹ thuật & Địa chỉ nhận hàng */}
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label="Quy cách dệt / Thông số kỹ thuật">
                    <textarea
                      className="input min-h-20 text-xs"
                      value={form.quyCach}
                      onChange={(e) => update("quyCach", e.target.value)}
                      placeholder="Chiều cao bo, số sọc, độ co giãn, thành phần sợi hoặc khổ vải..."
                    />
                  </Field>
                  <Field label="Ghi chú nội bộ">
                    <textarea
                      className="input min-h-20 text-xs"
                      value={form.ghiChu}
                      onChange={(e) => update("ghiChu", e.target.value)}
                      placeholder="Ghi chú về thanh toán, đóng gói, tiến độ..."
                    />
                  </Field>
                </div>

                {/* Tùy chọn giao hàng */}
                <div className="rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={form.giaoThangKhach}
                        onChange={(e) => update("giaoThangKhach", e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        {orderPurpose === "customer" ? "NCC giao thẳng xưởng khách" : "Giao trực tiếp về kho MIMIN"}
                      </span>
                    </label>
                  </div>
                  <div className="mt-2.5">
                    <input
                      className="input text-xs"
                      value={form.diaChiGiao}
                      onChange={(e) => update("diaChiGiao", e.target.value)}
                      placeholder="Địa chỉ chi tiết nơi nhận hàng..."
                    />
                  </div>
                </div>

                {/* Đính kèm hình ảnh mẫu gửi NCC */}
                <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/30 p-4 dark:bg-emerald-950/10">
                  <ImageUploader
                    files={files}
                    onChange={setFiles}
                    category="Ảnh mẫu vật tư"
                    accept="image/*"
                    label="Hình mẫu gửi nhà dệt / NCC"
                    hint="Ảnh mẫu bo cổ, màu sắc thực tế hoặc tài liệu kỹ thuật."
                  />
                </div>

                {/* ============================================================== */}
                {/* 3. THẺ TỔNG KẾT TÀI CHÍNH - MÀU XANH LÁ SÁNG HƠN RỰC RỠ        */}
                {/* ============================================================== */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 text-white p-5 shadow-lg shadow-emerald-600/15">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-emerald-100 font-medium">Tiền mua NCC</div>
                        <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
                          {formatVND(totals.tienMua)}
                        </div>
                      </div>

                      <div>
                        <div className="text-emerald-100 font-medium">Tổng giá vốn</div>
                        <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
                          {formatVND(totals.giaVon)}
                        </div>
                      </div>

                      {orderPurpose === "customer" && (
                        <>
                          <div>
                            <div className="text-emerald-100 font-medium">Doanh thu bán</div>
                            <div className="text-lg sm:text-xl font-black font-mono mt-0.5">
                              {formatVND(totals.doanhThu)}
                            </div>
                          </div>

                          <div>
                            <div className="text-emerald-100 font-medium">Lợi nhuận dự kiến</div>
                            <div className="text-lg sm:text-xl font-black font-mono mt-0.5 text-amber-200">
                              {formatVND(totals.loiNhuan)}
                              <span className="text-xs font-normal text-emerald-100 ml-1">
                                ({totals.bienLoiNhuan.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => printOrder(orderPurpose === "internal" ? "ncc" : "customer")}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold shadow-xs transition cursor-pointer backdrop-blur-xs"
                      >
                        <Printer className="h-4 w-4" /> In Phiếu
                      </button>
                      <button
                        type="button"
                        onClick={saveDraft}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
                      >
                        <Save className="h-4 w-4 text-emerald-700" /> Lưu Đơn Đặt Hàng
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </>
      )}

      {/* Modal Thêm Mẫu Mới Nhanh */}
      <CrudModal
        open={showCustom}
        onClose={() => setShowCustom(false)}
        onSave={addCustom}
        title="Thêm Mẫu Vật Tư / Dệt Mới"
        fields={customFields}
      />
    </div>
  );
}

function Title({ icon: Icon, text, sub }: { icon: typeof Package; text: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{text}</h2>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.2">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Money({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  accent?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min="0"
          className={`input font-mono font-bold pr-7 ${
            accent ? "text-emerald-600 dark:text-emerald-400" : ""
          }`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono">đ</span>
      </div>
    </div>
  );
}
