"use client";

import { useState, useMemo } from "react";
import { Scissors, Package as PackageIcon, QrCode, Eye, Filter, Plus, Shirt, Layers, Calculator, X, TrendingUp, Users, Palette, FileSpreadsheet, Upload, ImageIcon, Paperclip, Camera, FileImage, Brush, Sparkles, Wallet, AlertTriangle, Link2, Package, Minus, Hammer, Boxes } from "lucide-react";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import NewOrderModal, { type NewOrderData } from "@/components/NewOrderModal";
import { toast } from "sonner";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { tinhCongNo } from "@/lib/data/cong-no";
import { KHO_VAT_TU } from "@/lib/data/real-data";
import { useRouter } from "next/navigation";
import { getCuttingOrdersFromRealData } from "@/lib/workflow-to-cutting-order";

type LoaiSanPham = "Áo" | "Bộ";

type GiaVon = {
  // ===== Chung cho Áo & Bộ =====
  vaiChinh: number;        // đơn giá vải (đ/kg)
  dinhMucVai: number;      // kg/bộ hoặc kg/áo
  boCo: number;            // đ/bộ (Bo 2 da = 6500, Bo trơn = 4500)
  phuLieu: number;         // đ/bộ (Cúc + Chỉ + Nhãn + Túi PE - trọn gói)
  congCat: number;         // đ/bộ (Tổ cắt xưởng nhà)
  congMayAo: number;       // đ/áo
  congUi: number;          // đ/bộ (Ủi + Đóng gói + QC)
  haoHut: number;          // %

  // ===== Riêng BỘ =====
  khoa?: number;           // đ/bộ (Khóa eo/quần)
  congMayQuan?: number;    // đ/quần
  congTheu?: number;       // đ/bộ (Thêu logo)

  // ===== Riêng ÁO =====
  congIn?: number;         // đ/áo (In thân + Tay)

  // ===== Phân bổ giá vải theo màu =====
  giaVaiTheoMau?: { ten: string; maVai: string; soLuong: number; tongKg: number; donGia: number; tongTien: number }[];
};

type CuttingOrder = {
  id: string;
  productCode: string;
  productName: string;
  loaiSanPham: LoaiSanPham;
  productImage: string;
  productGallery?: string[];
  fabricSwatch: string;
  fabricName: string;
  totalQty: number;
  soAo?: number;
  soQuan?: number;
  deadline: string;
  factory: string;
  status: "draft" | "cutting" | "waiting_fabric" | "completed";
  sizes: { size: string; qty: number }[];
  lsxCode: string;
  giaVon?: GiaVon;
  mauSac?: { ten: string; soLuong: number; hex?: string }[];
  // ===== MỚI: Files upload =====
  tepDinhKem?: UploadedFile[];
};

// ============ TÍNH GIÁ VỐN (giống format Excel a gửi) ============
type CostItem = {
  stt: number;
  danhMuc: string;
  dvt: string;
  dinhMuc: string;
  donGia: number;
  thanhTien: number;  // / 1 sản phẩm
  tongLo: number;    // tổng cả lô
  ghiChu: string;
};

function tinhGiaVonChiTiet(o: CuttingOrder): CostItem[] {
  if (!o.giaVon) return [];
  const g = o.giaVon;
  const qty = o.totalQty;
  const isBo = o.loaiSanPham === "Bộ";
  const items: CostItem[] = [];
  let stt = 1;

  // 1. Vải chính (luôn có)
  const cpVai = g.vaiChinh * g.dinhMucVai;
  items.push({
    stt: stt++,
    danhMuc: "Chi phí Vải Bình Quân" + (g.giaVaiTheoMau ? ` (${g.giaVaiTheoMau.length} màu)` : ""),
    dvt: isBo ? "Kg/Bộ" : "Kg/Áo",
    dinhMuc: `${g.dinhMucVai} kg/${isBo ? "bộ" : "áo"} tiêu hao`,
    donGia: g.vaiChinh,
    thanhTien: Math.round(cpVai * 1000) / 1000,
    tongLo: Math.round(cpVai * qty),
    ghiChu: g.giaVaiTheoMau
      ? `BQ từ ${g.giaVaiTheoMau.length} màu: ${g.giaVaiTheoMau.map((m) => m.ten).join(", ")}`
      : "Đơn giá vải / kg",
  });

  // 2. Bo cổ + Bo tay
  if (g.boCo > 0) {
    items.push({
      stt: stt++,
      danhMuc: isBo ? "Bo Cổ + Bo Tay (Bo 2 Da)" : "Bo Cổ + Bo Tay Trơn",
      dvt: isBo ? "Bộ" : "Bộ",
      dinhMuc: `1 bộ bo / ${isBo ? "sản phẩm" : "áo"}`,
      donGia: g.boCo,
      thanhTien: g.boCo,
      tongLo: g.boCo * qty,
      ghiChu: isBo ? "Nhân đơn giá bo 2 da" : "Nhân đơn giá bo trơn",
    });
  }

  // 3. Khóa eo/quần (chỉ BỘ)
  if (isBo && g.khoa) {
    items.push({
      stt: stt++,
      danhMuc: "Khóa Eo / Khóa Quần",
      dvt: "Cái",
      dinhMuc: "1 cái / quần",
      donGia: g.khoa,
      thanhTien: g.khoa,
      tongLo: g.khoa * qty,
      ghiChu: "Nhân đơn giá khóa",
    });
  }

  // 4. Phụ liệu cố định
  if (g.phuLieu > 0) {
    items.push({
      stt: stt++,
      danhMuc: "Phụ liệu Cố định (Cúc, chỉ, nhãn, túi PE)",
      dvt: isBo ? "Bộ" : "Bộ",
      dinhMuc: "Trọn gói Cúc + Chỉ + Nhãn + Túi PE",
      donGia: g.phuLieu,
      thanhTien: g.phuLieu,
      tongLo: g.phuLieu * qty,
      ghiChu: "Chi phí CỐ ĐỊNH trọn gói",
    });
  }

  // 5. Công tổ cắt
  items.push({
    stt: stt++,
    danhMuc: "Công Tổ Cắt",
    dvt: isBo ? "Bộ" : "Cái",
    dinhMuc: isBo ? `Sơ đồ 8.4m/8 bộ + Cắt xưởng nhà` : "Sơ đồ + Trải + Cắt xưởng nhà",
    donGia: g.congCat,
    thanhTien: g.congCat,
    tongLo: g.congCat * qty,
    ghiChu: "Tổ cắt xưởng nhà",
  });

  // 6. May áo
  items.push({
    stt: stt++,
    danhMuc: "Gia công May Áo",
    dvt: isBo ? "Áo" : "Cái",
    dinhMuc: isBo ? "May áo trụ" : "May hoàn thiện áo trụ",
    donGia: g.congMayAo,
    thanhTien: g.congMayAo,
    tongLo: g.congMayAo * qty,
    ghiChu: isBo ? "Gia công Chị Liễu" : "Gia công Chị Cúc",
  });

  // 7. May quần (chỉ BỘ)
  if (isBo && g.congMayQuan) {
    items.push({
      stt: stt++,
      danhMuc: "Gia công May Quần",
      dvt: "Quần",
      dinhMuc: "May quần bộ",
      donGia: g.congMayQuan,
      thanhTien: g.congMayQuan,
      tongLo: g.congMayQuan * qty,
      ghiChu: "Gia công Chị Hương",
    });
  }

  // 8. Thêu (chỉ BỘ)
  if (isBo && g.congTheu) {
    items.push({
      stt: stt++,
      danhMuc: "Gia công Thêu",
      dvt: "Bộ",
      dinhMuc: "Thêu logo/họa tiết",
      donGia: g.congTheu,
      thanhTien: g.congTheu,
      tongLo: g.congTheu * qty,
      ghiChu: "Thêu Chị Hạnh",
    });
  }

  // 9. In (chỉ ÁO)
  if (!isBo && g.congIn) {
    items.push({
      stt: stt++,
      danhMuc: "Gia công In Thân + Tay",
      dvt: "Cái",
      dinhMuc: "In lụa/chuyển nhiệt logo + tay",
      donGia: g.congIn,
      thanhTien: g.congIn,
      tongLo: g.congIn * qty,
      ghiChu: "In Bảo Ngân",
    });
  }

  // 10. Ủi
  items.push({
    stt: stt++,
    danhMuc: "Ủi, Đóng gói, QC",
    dvt: isBo ? "Bộ" : "Cái",
    dinhMuc: "Ủi hơi, gấp xếp, đóng túi, kiểm hàng",
    donGia: g.congUi,
    thanhTien: g.congUi,
    tongLo: g.congUi * qty,
    ghiChu: "Tổ Ủi xưởng nhà",
  });

  // 11. Dự phòng hao hụt
  const tongTruocHH = items.reduce((s, x) => s + x.thanhTien, 0);
  const hhValue = Math.round((tongTruocHH * g.haoHut / 100) * 1000) / 1000;
  items.push({
    stt: stt++,
    danhMuc: "Dự phòng hao hụt / Bù lỗi",
    dvt: isBo ? "Bộ" : "Cái",
    dinhMuc: `${g.haoHut}% tổng chi phí trực tiếp`,
    donGia: 0,
    thanhTien: hhValue,
    tongLo: Math.round(hhValue * qty),
    ghiChu: "Dự phòng xưởng",
  });

  return items;
}

// P0-02 FIX: Dùng data thật từ ALL_REAL_PHIEU thay vì hardcoded
const ORDERS: CuttingOrder[] = getCuttingOrdersFromRealData();

const STATUS_MAP = {
  draft: { label: "Nháp", color: "bg-slate-500" },
  cutting: { label: "Đang cắt", color: "bg-emerald-500" },
  waiting_fabric: { label: "Chờ vải", color: "bg-amber-500" },
  completed: { label: "Hoàn thành", color: "bg-sky-500" },
} as const;

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800">
        <Shirt className="w-12 h-12 opacity-30" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
  );
}

function ProductCard({ order, onSelect, onShowGiaVon }: { order: CuttingOrder; onSelect: (o: CuttingOrder) => void; onShowGiaVon: (o: CuttingOrder) => void }) {
  const status = STATUS_MAP[order.id as keyof typeof STATUS_MAP] || STATUS_MAP[order.status];
  const chiTiet = order.giaVon ? tinhGiaVonChiTiet(order) : [];
  const tong = chiTiet.reduce((s, x) => s + x.thanhTien, 0);
  const tongLo = chiTiet.reduce((s, x) => s + x.tongLo, 0);
  const fileCount = order.tepDinhKem?.length || 0;
  const inTheuCount = order.tepDinhKem?.filter((f) => f.category === "Ảnh in/thêu").length || 0;
  const sanPhamCount = order.tepDinhKem?.filter((f) => f.category === "Ảnh sản phẩm").length || 0;
  return (
    <div
      className="card card-hover overflow-hidden cursor-pointer group"
      onClick={() => onSelect(order)}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <ProductImage src={order.productImage} alt={order.productName} />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-lg ${order.loaiSanPham === "Bộ" ? "bg-violet-500" : "bg-sky-500"}`}>
            {order.loaiSanPham === "Bộ" ? "👔 BỘ" : "👕 ÁO"}
          </span>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs text-white shadow-lg ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
          {order.productGallery && order.productGallery.length > 0 && (
            <div className="px-2 py-1 rounded-full bg-black/40 backdrop-blur text-white text-xs">
              🖼 +{order.productGallery.length} ảnh
            </div>
          )}
          {inTheuCount > 0 && (
            <div className="px-2 py-1 rounded-full bg-pink-500/80 backdrop-blur text-white text-xs flex items-center gap-1">
              <Brush className="w-3 h-3" /> {inTheuCount} mẫu thêu
            </div>
          )}
          {sanPhamCount > 0 && (
            <div className="px-2 py-1 rounded-full bg-amber-500/80 backdrop-blur text-white text-xs flex items-center gap-1">
              <Camera className="w-3 h-3" /> {sanPhamCount} ảnh SP
            </div>
          )}
        </div>
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/40 backdrop-blur text-white text-xs font-mono">
          {order.id} · {order.lsxCode}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="text-xs text-brand-600 dark:text-brand-400 font-mono">{order.productCode}</div>
          {order.loaiSanPham === "Bộ" && order.soAo && order.soQuan && (
            <div className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 font-mono">
              📐 {order.soAo} áo + {order.soQuan} quần
            </div>
          )}
        </div>
        <div className="font-semibold text-base mb-2 line-clamp-1">{order.productName}</div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full border-2 border-white shadow shrink-0" style={{ background: order.fabricSwatch }} />
          <span className="text-xs opacity-70 truncate">{order.fabricName}</span>
        </div>
        {order.mauSac && order.mauSac.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {order.mauSac.slice(0, 4).map((m, i) => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/40 dark:bg-white/5 flex items-center gap-1">
                {m.hex && <span className="w-2 h-2 rounded-full" style={{ background: m.hex }} />}
                {m.ten} <b>{m.soLuong}</b>
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {order.sizes.slice(0, 4).map((s) => (
            <span key={s.size} className="text-[10px] px-1.5 py-0.5 rounded bg-white/40 dark:bg-white/5">
              {s.size}: <b>{s.qty}</b>
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-xs opacity-70 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <span>Tổng: <b className="text-foreground">{order.totalQty.toLocaleString()}</b></span>
          <span className="truncate ml-2 max-w-[50%] text-right">{order.factory}</span>
        </div>
        {tong > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onShowGiaVon(order); }}
            className="mt-2 w-full text-xs flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 transition"
          >
            <Calculator className="w-3 h-3" />
            <b>{tong.toLocaleString()}đ</b>/{order.loaiSanPham.toLowerCase()} · Tổng <b>{(tongLo/1_000_000).toFixed(2)}tr</b>
          </button>
        )}
      </div>
    </div>
  );
}

export default function LenhCatPage() {
  const router = useRouter();
  const { layTheoLenh, isLate } = usePhanCong();
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [orders, setOrders] = useState<CuttingOrder[]>(ORDERS);
  const [selected, setSelected] = useState<CuttingOrder | null>(null);
  const [giaVonOrder, setGiaVonOrder] = useState<CuttingOrder | null>(null);
  const [loaiFilter, setLoaiFilter] = useState<"all" | LoaiSanPham>("all");
  const [openNew, setOpenNew] = useState(false);
  const [newLoai, setNewLoai] = useState<LoaiSanPham>("Bộ");
  const [newFiles, setNewFiles] = useState<UploadedFile[]>([]);

  // Handler tạo lệnh cắt mới (sử dụng NewOrderModal)
  const handleCreateNewOrder = (data: NewOrderData) => {
    const newOrder: any = {
      id: `LC-${data.maSP}-${Date.now().toString().slice(-4)}`,
      ma: data.maSP,
      ten: data.tenSP,
      loai: data.loaiSanPham === "Áo" ? "Áo" : "Bộ",
      loaiSanPham: data.loaiSanPham,
      hinh: newFiles[0]?.dataUrl || (data.loaiSanPham === "Áo" ? "/images/ao-thun-trang.jpg" : "/images/bo-the-thao.jpg"),
      dinhMuc: data.loaiSanPham === "Áo" ? 0.27 : 0.56,
      donVi: data.loaiSanPham === "Áo" ? "kg/áo" : "kg/bộ",
      hienCo: 0,
      tepDinhKem: newFiles,
      soLuong: data.soLuong,
      mauSac: [{ ten: data.mau, soLuong: data.soLuong, hex: "#3b82f6" }],
      kieuMay: data.kieuMay,
      ngayTao: new Date().toISOString().slice(0, 10),
      hanHoanThanh: data.hanHoanThanh,
      nguoiPhuTrach: data.nguoiPhuTrach,
      ghiChu: data.ghiChu,
      donGiaMucTieu: data.donGiaMucTieu,
    };
    setOrders([newOrder, ...orders]);
    setOpenNew(false);
    setNewFiles([]);
    toast.success(`Đã tạo lệnh cắt: ${data.maSP} - ${data.tenSP} (${data.soLuong} ${data.loaiSanPham === "Bộ" ? "bộ" : "áo"})`);
  };





  const soBo = orders.filter((o) => o.loaiSanPham === "Bộ").length;
  const soAo = orders.filter((o) => o.loaiSanPham === "Áo").length;
  const filtered = orders.filter((o) => loaiFilter === "all" || o.loaiSanPham === loaiFilter);

  // Tổng giá trị lệnh cắt (chỉ lệnh có giaVon)
  const ordersWithGiaVon = orders.filter((o) => o.giaVon);
  const tongGiaTriLenCat = ordersWithGiaVon.reduce((sum, o) => {
    const ct = tinhGiaVonChiTiet(o);
    return sum + ct.reduce((s, x) => s + x.tongLo, 0);
  }, 0);

  // Update files cho 1 order
  const updateOrderFiles = (orderId: string, files: UploadedFile[]) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, tepDinhKem: files } : o));
    if (selected?.id === orderId) {
      setSelected({ ...selected, tepDinhKem: files });
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Scissors className="w-7 h-7 text-brand-500" />
            Lệnh cắt
          </h1>
          <p className="opacity-70 mt-1 text-sm">
            {ORDERS.length} lệnh cắt · {ordersWithGiaVon.length} lệnh có bảng giá vốn · Tổng <b>{(tongGiaTriLenCat/1_000_000).toFixed(2)} triệu</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary inline-flex items-center gap-1.5 text-sm">
            <Filter className="w-4 h-4" /> Lọc
          </button>
          <button onClick={() => setOpenNew(true)} className="btn-primary inline-flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Tạo lệnh cắt
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setLoaiFilter("all")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
            loaiFilter === "all" ? "bg-brand-500 text-white shadow" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
          }`}
        >
          Tất cả ({ORDERS.length})
        </button>
        <button
          onClick={() => setLoaiFilter("Áo")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
            loaiFilter === "Áo" ? "bg-sky-500 text-white shadow" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
          }`}
        >
          👕 Áo ({soAo})
        </button>
        <button
          onClick={() => setLoaiFilter("Bộ")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
            loaiFilter === "Bộ" ? "bg-violet-500 text-white shadow" : "bg-white/40 dark:bg-white/5 hover:bg-white/60"
          }`}
        >
          👔 Bộ ({soBo})
        </button>
      </div>

      <div className="card p-1.5 inline-flex">
        <button
          onClick={() => setTab("products")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            tab === "products" ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"
          }`}
        >
          <Shirt className="w-4 h-4" />
          Sản phẩm ({filtered.length})
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
            tab === "orders" ? "bg-brand-500 text-white shadow" : "hover:bg-white/40 dark:hover:bg-white/5"
          }`}
        >
          <PackageIcon className="w-4 h-4" />
          Bảng lệnh cắt
        </button>
      </div>

      {tab === "products" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((o) => (
            <ProductCard key={o.id} order={o} onSelect={setSelected} onShowGiaVon={setGiaVonOrder} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="p-3">Loại</th>
                  <th className="p-3">Mã lệnh</th>
                  <th className="p-3">Sản phẩm</th>
                  <th className="p-3 text-right">SL</th>
                  <th className="p-3 text-right">Giá vốn</th>
                  <th className="p-3 text-right">Tổng lô</th>
                  <th className="p-3">Vải</th>
                  <th className="p-3">Xưởng</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const s = STATUS_MAP[o.status];
                  const ct = o.giaVon ? tinhGiaVonChiTiet(o) : [];
                  const tong = ct.reduce((sum, x) => sum + x.thanhTien, 0);
                  const tongLo = ct.reduce((sum, x) => sum + x.tongLo, 0);
                  return (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${o.loaiSanPham === "Bộ" ? "bg-violet-500" : "bg-sky-500"}`}>
                          {o.loaiSanPham}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-xs">{o.id}</td>
                      <td className="p-3 font-medium">{o.productName}</td>
                      <td className="p-3 text-right">
                        {o.totalQty.toLocaleString()}
                        {o.loaiSanPham === "Bộ" && o.soAo && o.soQuan && (
                          <div className="text-[10px] opacity-60">{o.soAo} áo + {o.soQuan} quần</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-xs">
                        {tong > 0 ? (
                          <div className="font-semibold text-emerald-600">{tong.toLocaleString()}đ</div>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-xs">
                        {tongLo > 0 ? (
                          <div className="font-semibold text-brand-600">{(tongLo/1_000_000).toFixed(2)}tr</div>
                        ) : (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                      <td className="p-3 text-xs">{o.fabricName}</td>
                      <td className="p-3 text-xs">{o.factory}</td>
                      <td className="p-3 text-xs">{o.deadline}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs text-white ${s.color}`}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative card w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="relative aspect-[4/3] overflow-hidden">
              <ProductImage src={selected.productImage} alt={selected.productName} />
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur text-white hover:bg-black/60" aria-label="Đóng">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="text-xs text-brand-600 font-mono">{selected.productCode} · {selected.lsxCode}</div>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${selected.loaiSanPham === "Bộ" ? "bg-violet-500" : "bg-sky-500"}`}>
                  {selected.loaiSanPham === "Bộ" ? "👔 BỘ" : "👕 ÁO"}
                </span>
                {selected.loaiSanPham === "Bộ" && selected.soAo && selected.soQuan && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-700 font-mono">
                    📐 {selected.soAo} áo + {selected.soQuan} quần
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold mb-3">{selected.productName}</h2>

              {selected.mauSac && selected.mauSac.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs opacity-60 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />
                    Phân bổ màu:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.mauSac.map((m, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-white/40 dark:bg-white/5 flex items-center gap-1.5">
                        {m.hex && <span className="w-3 h-3 rounded-full border" style={{ background: m.hex }} />}
                        {m.ten}: <b>{m.soLuong}</b>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-5">
                {selected.giaVon && (
                  <button
                    onClick={() => { setGiaVonOrder(selected); setSelected(null); }}
                    className="btn-secondary inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Bảng giá vốn
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="btn-secondary">Đóng</button>
              </div>

              {/* Tệp đính kèm - Upload ảnh sản phẩm & in thêu */}
              <div className="mt-5 pt-5 border-t space-y-4" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 text-base font-semibold">
                  <Paperclip className="w-4 h-4 text-brand-500" />
                  Tệp đính kèm & Ảnh mẫu
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <ImageUploader
                    files={selected.tepDinhKem || []}
                    onChange={(files) => updateOrderFiles(selected.id, files)}
                    category="Ảnh sản phẩm"
                    label="📸 Ảnh sản phẩm"
                    hint="Upload ảnh chụp sản phẩm thực tế, ảnh mẫu, ảnh reference"
                    accept="image/*"
                  />
                  <ImageUploader
                    files={selected.tepDinhKem || []}
                    onChange={(files) => updateOrderFiles(selected.id, files)}
                    category="Ảnh in/thêu"
                    label="🎨 Ảnh in / thêu"
                    hint="Upload logo, họa tiết in/thêu, file thiết kế AI/PSD/PDF"
                    accept="image/*,.ai,.psd,.pdf,.svg"
                  />
                </div>
                <ImageUploader
                  files={selected.tepDinhKem || []}
                  onChange={(files) => updateOrderFiles(selected.id, files)}
                  category="Tài liệu"
                  label="📄 Tài liệu khác"
                  hint="Hợp đồng, báo giá, PO, xác nhận đơn hàng..."
                />
              </div>

              {/* Phụ liệu tiêu hao - Trừ kho tự động */}
              <PhuLieuTieuHau
                lenhCat={selected}
                onTruKho={(loai, sl) => {
                  toast.success(`Đã trừ kho ${loai}: ${sl.toLocaleString()} cái`);
                }}
              />

              {/* Phân công & Công nợ công đoạn */}
              <PhanCongCongNoSection
                lenhCatId={selected.id}
                isLate={isLate}
                onViewDetail={() => {
                  setSelected(null);
                  router.push(`/cong-no?lenh=${selected.id}`);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Bảng giá vốn Excel-style */}
      {giaVonOrder && giaVonOrder.giaVon && (() => {
        const ct = tinhGiaVonChiTiet(giaVonOrder);
        const tong = ct.reduce((s, x) => s + x.thanhTien, 0);
        const tongLo = ct.reduce((s, x) => s + x.tongLo, 0);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGiaVonOrder(null)} />
            <div className="relative card w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slide-up">
              <div className="sticky top-0 card p-5 border-b flex items-start gap-3 z-10" style={{ borderColor: "var(--border)" }}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-brand-600 font-mono">{giaVonOrder.id} · {giaVonOrder.lsxCode}</div>
                  <h2 className="text-lg font-bold">Bảng tính giá vốn — {giaVonOrder.productName}</h2>
                  <div className="text-xs opacity-70 mt-0.5">
                    {giaVonOrder.totalQty.toLocaleString()} {giaVonOrder.loaiSanPham.toLowerCase()} · Giá vốn BQ: <b className="text-emerald-600">{tong.toLocaleString()}đ</b>/{giaVonOrder.loaiSanPham.toLowerCase()} · Tổng lô: <b className="text-brand-600">{(tongLo/1_000_000).toFixed(2)} triệu</b>
                  </div>
                </div>
                <button onClick={() => setGiaVonOrder(null)} className="p-1.5 rounded-lg hover:bg-white/30" aria-label="Đóng">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Bảng giá vải theo màu */}
                {giaVonOrder.giaVon.giaVaiTheoMau && giaVonOrder.giaVon.giaVaiTheoMau.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold opacity-70 mb-2 flex items-center gap-1.5">
                      📊 Bảng giá vải bình quân {giaVonOrder.giaVon.giaVaiTheoMau.length} màu
                    </div>
                    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                      <table className="w-full text-xs">
                        <thead className="bg-emerald-500/10">
                          <tr>
                            <th className="p-2 text-left">STT</th>
                            <th className="p-2 text-left">Màu vải</th>
                            <th className="p-2 text-left">Mã vải</th>
                            <th className="p-2 text-right">SL ({giaVonOrder.loaiSanPham === "Bộ" ? "bộ" : "áo"})</th>
                            <th className="p-2 text-right">Tổng vải (kg)</th>
                            <th className="p-2 text-right">Đơn giá (đ/kg)</th>
                            <th className="p-2 text-right">Tổng tiền (đ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {giaVonOrder.giaVon.giaVaiTheoMau.map((m, i) => (
                            <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                              <td className="p-2">{i + 1}</td>
                              <td className="p-2 font-medium">{m.ten}</td>
                              <td className="p-2 font-mono text-[10px] opacity-70">{m.maVai}</td>
                              <td className="p-2 text-right">{m.soLuong}</td>
                              <td className="p-2 text-right">{m.tongKg.toFixed(2)}</td>
                              <td className="p-2 text-right">{m.donGia.toLocaleString()}</td>
                              <td className="p-2 text-right font-mono">{m.tongTien.toLocaleString()}</td>
                            </tr>
                          ))}
                          <tr className="bg-emerald-500/10 font-semibold">
                            <td colSpan={3} className="p-2 text-right">BÌNH QUÂN LÔ</td>
                            <td className="p-2 text-right">{giaVonOrder.giaVon.giaVaiTheoMau.reduce((s, m) => s + m.soLuong, 0)}</td>
                            <td className="p-2 text-right">{giaVonOrder.giaVon.giaVaiTheoMau.reduce((s, m) => s + m.tongKg, 0).toFixed(2)}</td>
                            <td className="p-2 text-right">{Math.round(giaVonOrder.giaVon.vaiChinh).toLocaleString()}</td>
                            <td className="p-2 text-right font-mono">{giaVonOrder.giaVon.giaVaiTheoMau.reduce((s, m) => s + m.tongTien, 0).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Bảng giá vốn chi tiết */}
                <div>
                  <div className="text-xs uppercase font-semibold opacity-70 mb-2 flex items-center gap-1.5">
                    📋 Chi tiết giá vốn / 1 {giaVonOrder.loaiSanPham.toLowerCase()}
                  </div>
                  <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-xs">
                      <thead className="bg-brand-500/10">
                        <tr>
                          <th className="p-2 text-left w-10">STT</th>
                          <th className="p-2 text-left">Danh mục chi phí</th>
                          <th className="p-2 text-left w-16">ĐVT</th>
                          <th className="p-2 text-left">Định mức / Cách tính</th>
                          <th className="p-2 text-right">Đơn giá</th>
                          <th className="p-2 text-right">Thành tiền / 1 SP</th>
                          <th className="p-2 text-right">Tổng lô</th>
                          <th className="p-2 text-left">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ct.map((c, i) => (
                          <tr key={i} className="border-t hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                            <td className="p-2 font-mono opacity-60">{c.stt}</td>
                            <td className="p-2 font-medium">{c.danhMuc}</td>
                            <td className="p-2 text-[10px] opacity-70">{c.dvt}</td>
                            <td className="p-2 text-[10px] opacity-70">{c.dinhMuc}</td>
                            <td className="p-2 text-right font-mono">{c.donGia > 0 ? c.donGia.toLocaleString() : "—"}</td>
                            <td className="p-2 text-right font-mono font-semibold">{c.thanhTien.toLocaleString()}</td>
                            <td className="p-2 text-right font-mono opacity-80">{c.tongLo.toLocaleString()}</td>
                            <td className="p-2 text-[10px] opacity-70">{c.ghiChu}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-500/15 font-bold border-t-2" style={{ borderColor: "var(--border)" }}>
                          <td colSpan={5} className="p-3 text-right">GIÁ VỐN (COGS) / 1 {giaVonOrder.loaiSanPham.toUpperCase()}</td>
                          <td className="p-3 text-right text-base text-emerald-600">{tong.toLocaleString()} đ</td>
                          <td className="p-3 text-right text-base text-brand-600">{tongLo.toLocaleString()} đ</td>
                          <td className="p-3 text-[10px] opacity-70">Hoàn thiện 1 {giaVonOrder.loaiSanPham} {giaVonOrder.productCode}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-xs opacity-50 italic">
                  * Chưa bao gồm chi phí QLDN & MKT. Có thể chỉnh sửa đơn giá từng mục để tính lại.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      <NewOrderModal open={openNew} onClose={() => setOpenNew(false)} onCreate={handleCreateNewOrder} />
    </div>
  );
}

// ============ PHỤ LIỆU TIÊU HAO (Trừ kho tự động) ============
type PhuLieuItem = {
  loai: string;
  ma: string;          // Mã phụ liệu trong KHO_VAT_TU
  dinhMuc: number;     // Cái / 1 sản phẩm
  donVi: string;
  hienCo: number;
  ghiChu: string;
};

function PhuLieuTieuHau({ lenhCat, onTruKho }: { lenhCat: CuttingOrder; onTruKho: (loai: string, sl: number) => void }) {
  const isBo = lenhCat.loaiSanPham === "Bộ";
  const [daTru, setDaTru] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  // Danh sách 6 loại phụ liệu tiêu hao
  const dsPhuLieu: PhuLieuItem[] = useMemo(() => {
    // Mapping thật với KHO_VAT_TU
    const findKho = (keyword: string) => KHO_VAT_TU.find((k) => k.tenVT.toLowerCase().includes(keyword.toLowerCase()) || k.maVT.toLowerCase().includes(keyword.toLowerCase()));
    return [
      {
        loai: "Cúc áo",
        ma: findKho("cúc")?.maVT || "VT-CUC-001",
        dinhMuc: 8,
        donVi: "cúc",
        hienCo: findKho("cúc")?.tonKho || 5000,
        ghiChu: "8 cúc/áo (4 trước + 4 tay áo)",
      },
      {
        loai: "Chỉ may",
        ma: findKho("chỉ")?.maVT || "VT-CHI-001",
        dinhMuc: 50,
        donVi: "m",
        hienCo: findKho("chỉ")?.tonKho || 50000,
        ghiChu: "50m/bộ hoặc 35m/áo",
      },
      {
        loai: "Nhãn mác",
        ma: findKho("nhãn")?.maVT || "VT-NHAN-001",
        dinhMuc: 1,
        donVi: "cái",
        hienCo: findKho("nhãn")?.tonKho || 10000,
        ghiChu: "1 nhãn size + 1 nhãn thành phẩm",
      },
      {
        loai: "Túi PE đóng gói",
        ma: findKho("túi")?.maVT || "VT-TUI-001",
        dinhMuc: 1,
        donVi: "cái",
        hienCo: findKho("túi")?.tonKho || 8000,
        ghiChu: "1 túi/sản phẩm",
      },
      {
        loai: "Bo cổ",
        ma: findKho("bo cổ")?.maVT || "VT-BOCO-001",
        dinhMuc: 1,
        donVi: "cái",
        hienCo: findKho("bo cổ")?.tonKho || 3000,
        ghiChu: "1 bo cổ/áo (Bo 2 da 6500đ, Bo trơn 4500đ)",
      },
      ...(isBo ? [{
        loai: "Khóa eo quần",
        ma: findKho("khóa")?.maVT || "VT-KHOA-001",
        dinhMuc: 1,
        donVi: "cái",
        hienCo: findKho("khóa")?.tonKho || 2000,
        ghiChu: "1 khóa/quần",
      }] : []),
    ];
  }, [isBo]);

  const sl = lenhCat.totalQty;
  const tongTieuHao = dsPhuLieu.reduce((s, p) => s + p.dinhMuc * sl, 0);

  return (
    <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-base font-semibold hover:opacity-80"
      >
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4 text-brand-500" />
          Trừ kho Phụ liệu tự động ({dsPhuLieu.length} loại)
        </div>
        <span className="text-xs opacity-60">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <div className="text-xs opacity-70 bg-amber-500/10 border border-amber-500/30 rounded p-2">
            ⚠️ <b>Cảnh báo:</b> Hệ thống sẽ tự động trừ <b>{tongTieuHao.toLocaleString()}</b> đơn vị từ {dsPhuLieu.length} mã phụ liệu
            trong kho. Đảm bảo đã chốt SL trước khi trừ.
          </div>
          <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-xs">
              <thead className="bg-brand-500/10">
                <tr>
                  <th className="p-2 text-left">Loại phụ liệu</th>
                  <th className="p-2 text-left">Mã VT</th>
                  <th className="p-2 text-right">Định mức</th>
                  <th className="p-2 text-right">SL lệnh</th>
                  <th className="p-2 text-right">Tổng tiêu hao</th>
                  <th className="p-2 text-right">Tồn kho</th>
                  <th className="p-2 text-right">Còn lại sau trừ</th>
                  <th className="p-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {dsPhuLieu.map((p) => {
                  const tongTieuHaoPL = p.dinhMuc * sl;
                  const conLai = p.hienCo - tongTieuHaoPL;
                  const duKho = conLai >= 0;
                  const daTruPL = daTru[p.ma] || 0;
                  return (
                    <tr key={p.ma} className={`border-t ${daTruPL > 0 ? "bg-emerald-500/5" : !duKho ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                      <td className="p-2 font-medium">{p.loai}</td>
                      <td className="p-2 font-mono text-[10px] opacity-70">{p.ma}</td>
                      <td className="p-2 text-right">{p.dinhMuc} {p.donVi}</td>
                      <td className="p-2 text-right">{sl.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold">{tongTieuHaoPL.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono opacity-70">{p.hienCo.toLocaleString()}</td>
                      <td className="p-2 text-right font-mono font-semibold">
                        {daTruPL > 0 ? (
                          <span className="text-emerald-600">{(p.hienCo - daTruPL).toLocaleString()}</span>
                        ) : (
                          <span className={duKho ? "text-sky-600" : "text-red-600"}>
                            {conLai.toLocaleString()} {!duKho && "⚠️"}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {daTruPL > 0 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 font-semibold">✓ Đã trừ</span>
                        ) : (
                          <button
                            disabled={!duKho}
                            onClick={() => {
                              setDaTru({ ...daTru, [p.ma]: tongTieuHaoPL });
                              onTruKho(p.loai, tongTieuHaoPL);
                            }}
                            className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 mx-auto ${
                              duKho
                                ? "bg-red-500/15 text-red-700 hover:bg-red-500/25"
                                : "bg-slate-500/10 text-slate-500 cursor-not-allowed"
                            }`}
                          >
                            <Minus className="w-3 h-3" /> Trừ kho
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="text-[10px] opacity-60 italic">
            💡 Mẹo: Sau khi "Trừ kho", báo cho thủ kho kiểm tra & xuất kho vật lý. Nếu cần điều chỉnh SL, vào trang <a className="underline" href="/kho-phu-lieu">Kho phụ liệu</a>.
          </div>
        </div>
      )}
    </div>
  );
}

// ============ PHÂN CÔNG & CÔNG NỢ SECTION ============
import type { PhanCongCongDoan as PhanCongCongDoanType } from "@/lib/data/cong-no";
function PhanCongCongNoSection({
  lenhCatId,
  isLate,
  onViewDetail,
}: {
  lenhCatId: string;
  isLate: (p: PhanCongCongDoanType) => boolean;
  onViewDetail: () => void;
}) {
  const { layTheoLenh } = usePhanCong();
  const ds = layTheoLenh(lenhCatId);
  const tong = tinhCongNo(ds);

  if (ds.length === 0) {
    return (
      <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2 text-base font-semibold mb-3">
          <Wallet className="w-4 h-4 text-brand-500" />
          Phân công & Công nợ công đoạn
        </div>
        <div className="text-center py-6 text-sm opacity-60 bg-white/30 dark:bg-white/5 rounded-lg">
          Chưa có phân công nào cho lệnh cắt này. Bấm "Xem chi tiết công nợ" để tạo.
        </div>
        <button onClick={onViewDetail} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
          <Link2 className="w-4 h-4" /> Tạo phân công trong module Công nợ
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-base font-semibold">
          <Wallet className="w-4 h-4 text-brand-500" />
          Phân công & Công nợ công đoạn ({ds.length} công đoạn)
        </div>
        <button onClick={onViewDetail} className="text-xs px-2.5 py-1 rounded bg-brand-500/15 text-brand-700 hover:bg-brand-500/25 flex items-center gap-1">
          <Link2 className="w-3 h-3" /> Xem chi tiết công nợ
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-brand-500/10 rounded p-2 text-center">
          <div className="text-[10px] opacity-70">Tổng thành tiền</div>
          <div className="text-sm font-bold">{(tong.tongThanhTien / 1_000_000).toFixed(2)}tr</div>
        </div>
        <div className="bg-emerald-500/10 rounded p-2 text-center">
          <div className="text-[10px] opacity-70">Đã thanh toán</div>
          <div className="text-sm font-bold text-emerald-600">{(tong.tongDaThanhToan / 1_000_000).toFixed(2)}tr</div>
        </div>
        <div className="bg-red-500/10 rounded p-2 text-center">
          <div className="text-[10px] opacity-70">Còn nợ</div>
          <div className="text-sm font-bold text-red-600">{(tong.tongConNo / 1_000_000).toFixed(2)}tr</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-xs">
          <thead className="bg-white/40 dark:bg-white/5">
            <tr>
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Công đoạn</th>
              <th className="p-2 text-left">Người PT</th>
              <th className="p-2 text-right">SL</th>
              <th className="p-2 text-right">Đơn giá</th>
              <th className="p-2 text-right">Thành tiền</th>
              <th className="p-2 text-right">Còn nợ</th>
              <th className="p-2 text-center">TT</th>
            </tr>
          </thead>
          <tbody>
            {ds.map((p, i) => {
              const tt = p.donGiaGiao * p.soLuongGiao;
              const cn = tt - p.daThanhToan;
              const late = isLate(p);
              return (
                <tr key={p.id} className={`border-t ${late ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                  <td className="p-2 opacity-60">{i + 1}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 font-medium inline-flex items-center gap-1">
                      {p.congDoan}
                      {late && <AlertTriangle className="w-3 h-3 text-red-600" />}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                    <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                  </td>
                  <td className="p-2 text-right">{p.soLuongGiao.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono">{p.donGiaGiao.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono font-semibold">{tt.toLocaleString()}</td>
                  <td className="p-2 text-right font-mono font-semibold text-red-600">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                  <td className="p-2 text-center">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/40 dark:bg-white/5 font-medium">
                      {p.trangThai}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
