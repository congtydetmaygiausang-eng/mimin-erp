"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Calculator, Check, Image as ImageIcon, ListChecks, Package, Plus, Printer, Save, Search, Send, ShoppingBag, Trash2, Truck, UserRound, List } from "lucide-react";
import { toast } from "sonner";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { useSession } from "@/components/session-provider";
import { formatVND, KHO_VAT_TU, type KhoVai } from "@/lib/data/real-data";
import { isSupabaseEnabled, supabase } from "@/lib/supabase/client";
import { useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { useKhachHang } from "@/lib/data/khach-hang-store";
import { type PhieuDatNccLineItem, type PhieuDatNccPhuLieu, type TrangThaiPhieuDatNcc } from "@/lib/data/phieu-dat-ncc";
import { useVatTuDatSanXuat } from "@/lib/data/vat-tu-dat-san-xuat-store";
import { uploadProductFile } from "@/lib/product-upload";
import { usePhieuDatNcc } from "@/lib/data/phieu-dat-ncc-store";
import { TheoDoiTienDo } from "./theo-doi-tien-do";
import { DanhSachDonHang } from "./danh-sach-don-hang";
import { useWorkspace } from "@/lib/workspace-context";

const today = new Date().toISOString().slice(0, 10);
const deliveryDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
const customFields: FieldDef[] = [
  { name: "maMau", label: "Mã mẫu", type: "text", required: true },
  { name: "tenMau", label: "Tên mẫu vật tư", type: "text", required: true },
  { name: "loai", label: "Loại", type: "select", required: true, options: ["Bo cổ", "Bo tay", "Dây dệt", "Nhãn", "Khác"].map((value) => ({ value, label: value })) },
  { name: "mauSac", label: "Màu sắc", type: "text", required: true },
  { name: "donVi", label: "Đơn vị", type: "select", required: true, options: ["bộ", "cái", "kg", "mét", "cuộn"].map((value) => ({ value, label: value })) },
  { name: "giaMuaThamKhao", label: "Giá mua tham khảo", type: "number", min: 0 },
  { name: "giaBanDeXuat", label: "Giá bán đề xuất", type: "number", min: 0 },
  { name: "hinhAnh", label: "Hình vật tư", type: "image" },
];

const num = (value: string) => Math.max(0, Number(value) || 0);
const safe = (value: string) => value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] || char);
type MucDichDatHang = "customer" | "internal";
type SelectableMaterial = {
  id: string; maMau: string; tenMau: string; loai: string; mauSac: string; quyCach: string; donVi: string;
  maNccMacDinh: string; giaMuaThamKhao: number; giaBanDeXuat: number; soLuongToiThieu: number; hinhAnh: string; trangThai: "Đang dùng" | "Tạm ngưng";
};

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

const readSharedImage = (ghiChu: string | null | undefined): string => {
  if (!ghiChu) return "";
  try {
    const parsed = JSON.parse(ghiChu) as { imageUrl?: unknown };
    return typeof parsed.imageUrl === "string" ? parsed.imageUrl : "";
  } catch {
    return "";
  }
};

const readSharedNote = (ghiChu: string | null | undefined): string => {
  if (!ghiChu) return "";
  try {
    const parsed = JSON.parse(ghiChu);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return typeof parsed.note === "string" ? parsed.note : "";
    }
    return ghiChu;
  } catch {
    return ghiChu;
  }
};

export default function PhieuDatNccPhuLieuPage() {
  const { user } = useSession();
  const { list: nccList } = useNhaCungCap();
  const { list: khachHangList } = useKhachHang();
  const { list: catalogMaterials, themMau } = useVatTuDatSanXuat();
  const { saveOrder } = usePhieuDatNcc();
  const { activeWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"create" | "progress" | "list">("create");
  const [orderPurpose, setOrderPurpose] = useState<MucDichDatHang>("customer");
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [orderItems, setOrderItems] = useState<PhieuDatNccLineItem[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [warehouseMaterials, setWarehouseMaterials] = useState<KhoVai[]>(KHO_VAT_TU);
  const [form, setForm] = useState({
    maPhieu: `PO-${today.replaceAll("-", "")}-${String(Date.now()).slice(-4)}`,
    ngayDat: today, ngayGiao: deliveryDate, maKhachHang: "", maNcc: "", soLuong: "1000",
    donGiaMua: "0", donGiaBan: "0",
    phiVanChuyen: "0", chiPhiKhac: "0", thueVat: "10", quyCach: "", diaChiGiao: "", ghiChu: "", giaoThangKhach: true,
  });
  useEffect(() => {
    let mounted = true;

    const loadCachedMaterials = () => {
      try {
        const cachedRaw = localStorage.getItem(PL_INVENTORY_KEY);
        const imageRaw = localStorage.getItem(PL_IMAGES_KEY);
        const cached = cachedRaw ? JSON.parse(cachedRaw) as unknown : null;
        const images = imageRaw ? JSON.parse(imageRaw) as unknown : null;
        const imageMap = images && typeof images === "object" ? images as Record<string, unknown> : {};
        if (Array.isArray(cached) && cached.length > 0) {
          setWarehouseMaterials((cached as KhoVai[]).map((item) => ({
            ...item,
            hinhAnh: typeof imageMap[item.maVT] === "string" ? String(imageMap[item.maVT]) : item.hinhAnh,
          })));
        }
      } catch {
        // Cache lỗi không chặn việc tải dữ liệu thật từ Supabase.
      }
    };

    const loadRemoteMaterials = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      const baseFields = "sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu";
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
    return () => { mounted = false; };
  }, []);

  const materials = useMemo<SelectableMaterial[]>(() => orderPurpose === "customer" ? catalogMaterials : warehouseMaterials.map((item) => ({ id: `KHO-${item.maVT}`, maMau: item.maVT, tenMau: item.tenChuan || item.tenVT, loai: item.loai, mauSac: item.mauChuan || item.mauSac, quyCach: readSharedNote(item.ghiChu) || "", donVi: item.dvt, maNccMacDinh: "", giaMuaThamKhao: item.donGia, giaBanDeXuat: 0, soLuongToiThieu: 1, hinhAnh: item.hinhAnh || "", trangThai: "Đang dùng" })), [catalogMaterials, orderPurpose, warehouseMaterials]);
  const selected = materials.find((item) => item.id === selectedId) || null;
  const update = (name: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (typeof value === "string" && selected && (name === "soLuong" || name === "donGiaMua" || name === "donGiaBan")) {
      setOrderItems((current) => current.map((item) => item.maVatTu === selected.maMau ? { ...item, [name]: num(value) } : item));
    }
  };
  const filtered = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");
    return materials.filter((item) => item.trangThai === "Đang dùng" && (!keyword || [item.maMau, item.tenMau, item.loai, item.mauSac].some((v) => v.toLocaleLowerCase("vi").includes(keyword)))).slice(0, 24);
  }, [materials, search]);
  const totals = useMemo(() => {
    const tienMua = orderItems.reduce((sum, item) => sum + item.soLuong * item.donGiaMua, 0);
    const doanhThu = orderItems.reduce((sum, item) => sum + item.soLuong * item.donGiaBan, 0);
    const giaVon = tienMua + num(form.phiVanChuyen) + num(form.chiPhiKhac);
    const loiNhuan = orderPurpose === "internal" ? 0 : doanhThu - giaVon;
    const vatDauRa = orderPurpose === "internal" ? 0 : doanhThu * num(form.thueVat) / 100;
    return { tienMua, doanhThu, giaVon, loiNhuan, vatDauRa, tongHoaDon: doanhThu + vatDauRa, bienLoiNhuan: doanhThu > 0 ? loiNhuan / doanhThu * 100 : 0 };
  }, [form.chiPhiKhac, form.phiVanChuyen, form.thueVat, orderItems, orderPurpose]);

  const selectMaterial = (item: typeof materials[number]) => {
    const existing = orderItems.find((line) => line.maVatTu === item.maMau);
    setSelectedId(item.id);
    setOrderItems((current) => current.some((line) => line.maVatTu === item.maMau) ? current : [...current, { id: crypto.randomUUID(), maVatTu: item.maMau, tenVatTu: item.tenMau, mauSac: item.mauSac, quyCach: item.quyCach, donVi: item.donVi, soLuong: Math.max(1, item.soLuongToiThieu), donGiaMua: item.giaMuaThamKhao, donGiaBan: item.giaBanDeXuat, hinhAnh: item.hinhAnh }]);
    setForm((current) => ({ ...current, soLuong: String(existing?.soLuong || Math.max(1, item.soLuongToiThieu)), donGiaMua: String(existing?.donGiaMua ?? item.giaMuaThamKhao), donGiaBan: String(existing?.donGiaBan ?? item.giaBanDeXuat), maNcc: item.maNccMacDinh || current.maNcc, quyCach: item.quyCach || current.quyCach }));
  };
  const switchPurpose = (purpose: MucDichDatHang) => {
    setOrderPurpose(purpose);
    setSelectedId("");
    setOrderItems([]);
    setForm((current) => ({ ...current, maKhachHang: purpose === "internal" ? "" : current.maKhachHang, donGiaMua: "0", donGiaBan: "0", giaoThangKhach: purpose === "customer", diaChiGiao: purpose === "internal" ? "Kho phụ liệu MIMIN" : current.diaChiGiao }));
  };
  const updateLine = (id: string, field: "soLuong" | "donGiaMua" | "donGiaBan", value: string) => {
    setOrderItems((current) => current.map((item) => item.id === id ? { ...item, [field]: num(value) } : item));
    const active = orderItems.find((item) => item.id === id);
    if (active?.maVatTu === selected?.maMau) setForm((current) => ({ ...current, [field]: value }));
  };
  const removeLine = (id: string) => setOrderItems((current) => current.filter((item) => item.id !== id));
  const addCustom = async (values: Record<string, string>) => {
    const item = await themMau({ maMau: values.maMau, tenMau: values.tenMau, loai: values.loai, mauSac: values.mauSac, quyCach: "", donVi: values.donVi, maNccMacDinh: form.maNcc, giaMuaThamKhao: num(values.giaMuaThamKhao), giaBanDeXuat: num(values.giaBanDeXuat), soLuongToiThieu: 0, thoiGianSanXuat: 0, maKhachHangSoHuu: "", hinhAnh: values.hinhAnh || "", dungChung: true, trangThai: "Đang dùng" });
    selectMaterial(item);
  };
  const importWarehouseTemplates = async () => {
    const existingCodes = new Set(materials.map((item) => item.maMau));
    const source = KHO_VAT_TU.filter((item) => !existingCodes.has(`VTSX-${item.maMoi || item.maVT}`));
    if (source.length === 0) { toast.info("Các mẫu Kho phụ liệu đã có trong danh mục sản xuất"); return; }
    for (const item of source) {
      await themMau({ maMau: `VTSX-${item.maMoi || item.maVT}`, tenMau: item.tenChuan || item.tenVT, loai: item.loai, mauSac: item.mauChuan || item.mauSac, quyCach: "", donVi: item.dvt, maNccMacDinh: "", giaMuaThamKhao: item.donGia, giaBanDeXuat: Math.ceil(item.donGia * 1.3 / 100) * 100, soLuongToiThieu: 1, thoiGianSanXuat: 7, maKhachHangSoHuu: "", hinhAnh: item.hinhAnh || "", dungChung: true, trangThai: "Đang dùng" });
    }
    toast.success(`Đã sao chép ${source.length} mẫu sang Danh mục vật tư đặt sản xuất`);
  };
  const buildOrder = (trangThai: TrangThaiPhieuDatNcc): PhieuDatNccPhuLieu | null => {
    if (orderPurpose === "customer" && !form.maKhachHang) { toast.error("Vui lòng chọn khách hàng/xưởng may"); return null; }
    if (!form.maNcc) { toast.error("Vui lòng chọn nhà cung cấp dệt"); return null; }
    if (orderItems.length === 0) { toast.error("Vui lòng chọn ít nhất một mẫu vật tư sản xuất"); return null; }
    if (orderItems.some((item) => item.soLuong <= 0)) { toast.error("Số lượng mỗi vật tư phải lớn hơn 0"); return null; }
    const first = orderItems[0];
    return { id: crypto.randomUUID(), maPhieu: form.maPhieu, ngayDat: form.ngayDat, ngayGiao: form.ngayGiao, nguoiTao: user?.name || user?.email || "Nhân viên MIMIN", maKhachHang: form.maKhachHang, maNcc: form.maNcc, ownerOrganizationId: activeWorkspace?.id || "mimin", supplierOrganizationId: `ncc:${form.maNcc}`, customerOrganizationId: form.maKhachHang ? `kh:${form.maKhachHang}` : undefined, maVatTu: first.maVatTu, tenVatTu: first.tenVatTu, mauSac: first.mauSac, quyCach: first.quyCach, donVi: first.donVi, soLuong: orderItems.reduce((sum, item) => sum + item.soLuong, 0), donGiaMua: first.donGiaMua, donGiaBan: orderPurpose === "internal" ? 0 : first.donGiaBan, phiVanChuyen: num(form.phiVanChuyen), chiPhiKhac: num(form.chiPhiKhac), thueVat: orderPurpose === "internal" ? 0 : num(form.thueVat), giaoThangKhach: orderPurpose === "customer" && form.giaoThangKhach, diaChiGiao: form.diaChiGiao, ghiChu: `${orderPurpose === "internal" ? "[Đặt cho MIMIN] " : "[Đặt theo đơn khách] "}${form.ghiChu}`, hinhAnh: files, items: orderItems.map((item) => orderPurpose === "internal" ? { ...item, donGiaBan: 0 } : item), trangThai, createdAt: new Date().toISOString() };
  };
  const saveDraft = async () => {
    const order = buildOrder("Nháp");
    if (!order) return;
    await saveOrder(order);
    toast.success(`Đã lưu nháp ${order.maPhieu}`);
    setActiveTab("progress");
  };

  const printOrder = async (target: "ncc" | "customer") => {
    const order = buildOrder(target === "ncc" ? "Đã gửi NCC" : "Nháp");
    if (!order) return;
    if (target === "ncc") await saveOrder(order);
    const customer = khachHangList.find((item) => item.maKH === order.maKhachHang);
    const supplier = nccList.find((item) => item.ma_ncc === order.maNcc);
    const isSupplier = target === "ncc";
    const printItems = order.items || [];
    const subtotal = printItems.reduce((sum, item) => sum + item.soLuong * (isSupplier ? item.donGiaMua : item.donGiaBan), 0);
    const itemRows = printItems.map((item) => {
      const unitPrice = isSupplier ? item.donGiaMua : item.donGiaBan;
      return `<tr><td><b>${safe(item.maVatTu)}</b><br>${safe(item.tenVatTu)}</td><td>${safe(item.mauSac)}<br><span class="muted">${safe(item.quyCach || "Theo mẫu đính kèm")}</span></td><td class="right">${item.soLuong.toLocaleString("vi-VN")} ${safe(item.donVi)}</td><td class="right">${formatVND(unitPrice)}</td><td class="right"><b>${formatVND(item.soLuong * unitPrice)}</b></td></tr>`;
    }).join("");
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
    if (!popup) { frame.remove(); toast.error("Không khởi tạo được vùng in"); return; }
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safe(order.maPhieu)}</title><style>body{font-family:Arial,sans-serif;color:#17202a;margin:36px}header{display:flex;justify-content:space-between;border-bottom:3px solid #047857;padding-bottom:18px}h1{font-size:24px;margin:0;color:#065f46}.muted{color:#64748b;font-size:12px}.box{border:1px solid #cbd5e1;border-radius:10px;padding:14px;margin-top:18px}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#ecfdf5}.right{text-align:right}.total{font-size:18px;font-weight:bold;color:#065f46}.photo{max-width:220px;max-height:160px;border-radius:8px;margin-top:12px}.signatures{display:grid;grid-template-columns:1fr 1fr;text-align:center;margin-top:50px;gap:80px}.note{white-space:pre-wrap}@media print{button{display:none}body{margin:15mm}}</style></head><body><header><div><div class="muted">MIMIN ERP</div><h1>${isSupplier ? "LỆNH ĐẶT SẢN XUẤT" : "PHIẾU XÁC NHẬN ĐẶT HÀNG"}</h1><div class="muted">Mã phiếu: ${safe(order.maPhieu)}</div></div><div class="right"><b>Ngày đặt: ${safe(order.ngayDat)}</b><div>Hạn giao: ${safe(order.ngayGiao)}</div></div></header><div class="box"><b>${isSupplier ? "NHÀ CUNG CẤP" : "KHÁCH HÀNG / XƯỞNG MAY"}</b><div>${safe(isSupplier ? supplier?.ten_ncc || order.maNcc : customer?.ten || order.maKhachHang)}</div><div class="muted">${safe(isSupplier ? supplier?.sdt || "" : customer?.sdt || "")}</div>${isSupplier ? `<div class="muted">Nơi giao: ${safe(order.diaChiGiao || "Theo thỏa thuận")}</div>` : ""}</div><table><thead><tr><th>Mẫu vật tư</th><th>Màu / quy cách</th><th class="right">Số lượng</th><th class="right">Đơn giá</th><th class="right">Thành tiền</th></tr></thead><tbody>${itemRows}</tbody></table>${imageUrl ? `<div class="box"><b>Hình mẫu</b><br><img class="photo" src="${safe(imageUrl)}" alt="Hình mẫu"></div>` : ""}<div class="box right"><div>Tạm tính: <b>${formatVND(subtotal)}</b></div>${!isSupplier ? `<div>VAT ${order.thueVat}%: <b>${formatVND(vat)}</b></div><div class="total">Tổng thanh toán: ${formatVND(subtotal + vat)}</div>` : `<div class="total">Giá trị đặt NCC: ${formatVND(subtotal)}</div>`}</div><div class="box note"><b>Ghi chú:</b> ${safe(order.ghiChu || "Không có")}</div><div class="signatures"><div><b>${isSupplier ? "MIMIN ĐẶT HÀNG" : "ĐẠI DIỆN MIMIN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div><div><b>${isSupplier ? "NHÀ CUNG CẤP XÁC NHẬN" : "KHÁCH HÀNG XÁC NHẬN"}</b><p class="muted">Ký và ghi rõ họ tên</p></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    popup.document.close();
    const headerMeta = popup.document.querySelector<HTMLElement>("header .right");
    if (headerMeta) {
      headerMeta.innerHTML = `<div><b>Người tạo:</b> ${safe(order.nguoiTao || "Nhân viên MIMIN")}</div><div><b>Ngày bắt đầu:</b> ${safe(order.ngayDat)}</div><div><b>Ngày kết thúc:</b> ${safe(order.ngayGiao)}</div>`;
    }
    const contactBox = popup.document.querySelector<HTMLElement>(".box");
    if (contactBox) {
      const contactCode = isSupplier ? order.maNcc : order.maKhachHang;
      const contactAddress = isSupplier ? supplier?.dia_chi || "" : customer?.diaChi || order.diaChiGiao;
      contactBox.insertAdjacentHTML("beforeend", `<div class="muted">Mã: ${safe(contactCode)}</div>${contactAddress ? `<div class="muted">Địa chỉ: ${safe(contactAddress)}</div>` : ""}`);
    }
    const printedRows = popup.document.querySelectorAll<HTMLTableRowElement>("tbody tr");
    printItems.forEach((item, index) => {
      if (!item.hinhAnh) return;
      const firstCell = printedRows[index]?.querySelector<HTMLTableCellElement>("td");
      if (!firstCell) return;
      const image = popup.document.createElement("img");
      image.src = item.hinhAnh;
      image.alt = `Mẫu ${item.tenVatTu}`;
      image.style.cssText = "display:block;width:150px;height:100px;object-fit:cover;border-radius:8px;margin-top:8px;border:1px solid #cbd5e1";
      firstCell.appendChild(image);
    });
    window.setTimeout(() => frame.remove(), 60_000);
    if (isSupplier) toast.success(`Đã chuyển ${order.maPhieu} sang trạng thái Đã gửi NCC`);
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
    setOrderItems(order.items || [{
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
    }]);
    setFiles(order.hinhAnh || []);
  };

  return <div data-order-purpose={orderPurpose} className="min-h-[calc(100vh-7rem)] space-y-4 animate-fade-in">
    <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-slate-900">
      <button type="button" onClick={() => setActiveTab("create")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === "create" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}><Plus className="h-4 w-4" /> Tạo đơn đặt</button>
      <button type="button" onClick={() => setActiveTab("list")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === "list" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}><List className="h-4 w-4" /> Danh sách đơn hàng</button>
      <button type="button" onClick={() => setActiveTab("progress")} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${activeTab === "progress" ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"}`}><ListChecks className="h-4 w-4" /> Theo dõi tiến độ</button>
    </div>
    {activeTab === "list" ? <DanhSachDonHang user={user} onEdit={handleEdit} /> : activeTab === "progress" ? <TheoDoiTienDo user={user} /> : <>
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900">
      <header className="bg-gradient-to-r from-slate-950 via-emerald-950 to-teal-900 px-4 py-5 text-white md:px-7 md:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-3"><div className="h-fit rounded-2xl bg-white/10 p-3"><ShoppingBag className="h-7 w-7 text-emerald-300" /></div><div><div className="text-xs font-bold text-emerald-300">PHIẾU ĐẶT NHÀ CUNG CẤP · NHÁP</div><h1 className="text-2xl font-bold md:text-3xl">Đặt dệt phụ liệu & vật tư</h1><p className="mt-1 text-sm text-slate-300">Chọn hình mẫu, đặt nhà dệt và tính lợi nhuận trên cùng một phiếu.</p></div></div><div className="flex gap-2"><button onClick={() => setShowCustom(true)} className="btn-secondary border-white/20 bg-white/10 text-white"><Plus className="h-4 w-4" /> Vật tư khác</button><button onClick={saveDraft} className="btn-primary bg-emerald-500"><Save className="h-4 w-4" /> Lưu phiếu</button></div></div>
      </header>
      <div className="border-b border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900 md:px-7">
        <div className="grid max-w-3xl gap-2 rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800 sm:grid-cols-2">
          <button type="button" onClick={() => switchPurpose("customer")} className={`rounded-xl border px-4 py-3 text-left transition ${orderPurpose === "customer" ? "border-blue-600 bg-blue-600 text-white shadow-md" : "border-transparent bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}><b className="block text-sm">Đặt theo đơn khách/xưởng</b><span className={`text-xs ${orderPurpose === "customer" ? "text-blue-100" : "text-slate-500"}`}>Có giá mua, giá bán và lợi nhuận</span></button>
          <button type="button" onClick={() => switchPurpose("internal")} className={`rounded-xl border px-4 py-3 text-left transition ${orderPurpose === "internal" ? "border-emerald-600 bg-emerald-600 text-white shadow-md" : "border-transparent bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}><b className="block text-sm">Đặt cho công ty MIMIN</b><span className={`text-xs ${orderPurpose === "internal" ? "text-emerald-100" : "text-slate-500"}`}>Chỉ giá mua, nhận hàng vào Kho phụ liệu</span></button>
        </div>
      </div>
      <div className={`grid border-b border-slate-200 dark:border-white/10 ${orderPurpose === "internal" ? "xl:grid-cols-[1fr_2fr]" : "xl:grid-cols-[1.2fr_1.35fr_0.9fr]"}`}>
        <section className="border-b p-4 dark:border-white/10 md:p-6 xl:border-b-0 xl:border-r">
          <Title icon={Package} text={orderPurpose === "customer" ? "1. Chọn mẫu sản xuất" : "1. Chọn vật tư Kho phụ liệu"} sub={orderPurpose === "customer" ? "Danh mục mẫu đặt theo đơn khách" : "Danh mục Kho phụ liệu hiện tại của MIMIN"} />
          <div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm mã mẫu, tên hoặc màu..." /></div>
          {filtered.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed p-6 text-center"><Package className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-2 text-sm font-semibold">Chưa có mẫu vật tư sản xuất</p><div className="mt-3 flex flex-col justify-center gap-2 sm:flex-row"><button onClick={importWarehouseTemplates} className="btn-primary"><Package className="h-4 w-4" /> Sao chép mẫu từ Kho phụ liệu</button><button onClick={() => setShowCustom(true)} className="btn-secondary"><Plus className="h-4 w-4" /> Tạo mẫu mới</button></div><p className="mt-2 text-[11px] text-slate-500">Chỉ sao chép thông tin mẫu và giá tham khảo, không cộng tồn kho.</p></div> : <div className="mt-3 grid max-h-[560px] overflow-y-auto pr-1 grid-cols-1 gap-2">{filtered.map((item) => <button key={item.id} onClick={() => selectMaterial(item)} className={`relative flex items-center gap-3 overflow-hidden rounded-xl border bg-white p-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${item.id === selected?.id ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200 dark:border-white/10"}`}><div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">{item.hinhAnh ? <img src={item.hinhAnh} alt={item.tenMau} className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7 text-slate-400" />}</div><div className="min-w-0 flex-1"><div className="text-xs font-bold text-emerald-700">{item.maMau}</div><div className="line-clamp-2 min-h-0 text-sm font-semibold">{item.tenMau}</div><div className="mt-1 text-xs text-slate-500">{item.mauSac} · {item.donVi}</div></div>{item.id === selected?.id && <span className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-white shadow"><Check className="h-3.5 w-3.5" /></span>}</button>)}</div>}
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white"><div className="text-xs text-emerald-300">ĐÃ CHỌN</div>{selected ? <><div className="font-bold">{selected.tenMau}</div><div className="mt-1 text-xs text-slate-300">{selected.maMau} · {selected.mauSac}</div></> : <div className="mt-1 text-sm text-slate-400">Chưa chọn mẫu</div>}</div>
        </section>

        {orderPurpose === "internal" ? (
          <section className="border-b p-4 dark:border-white/10 md:p-6 xl:border-b-0">
            <Title icon={UserRound} text="2. Thông tin & Chi phí đặt hàng" sub="MIMIN → nhà cung cấp → nhập kho" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Mã phiếu"><input className="input" value={form.maPhieu} onChange={(e) => update("maPhieu", e.target.value)} /></Field>
              <Field label="Nhà cung cấp dệt" required><select className="input" value={form.maNcc} onChange={(e) => update("maNcc", e.target.value)}><option value="">-- Chọn nhà cung cấp --</option>{nccList.map((ncc) => <option key={ncc.ma_ncc} value={ncc.ma_ncc}>{ncc.ma_ncc} · {ncc.ten_ncc}</option>)}</select></Field>
              <Field label={`Số lượng (${selected?.donVi || "đơn vị"})`} required><input type="number" min="1" className="input" value={form.soLuong} onChange={(e) => update("soLuong", e.target.value)} /></Field>
              <Field label="Ngày đặt"><input type="date" className="input" value={form.ngayDat} onChange={(e) => update("ngayDat", e.target.value)} /></Field>
              <Field label="Hạn giao"><input type="date" className="input" value={form.ngayGiao} onChange={(e) => update("ngayGiao", e.target.value)} /></Field>
              <Money label="Đơn giá mua NCC" value={form.donGiaMua} onChange={(v) => update("donGiaMua", v)} />
              <Money label="Phí vận chuyển mình chịu" value={form.phiVanChuyen} onChange={(v) => update("phiVanChuyen", v)} />
              <Money label="Chi phí khác" value={form.chiPhiKhac} onChange={(v) => update("chiPhiKhac", v)} />
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Quy cách dệt"><textarea className="input min-h-20" value={form.quyCach} onChange={(e) => update("quyCach", e.target.value)} placeholder="Chiều cao bo, số sọc, độ co giãn, thành phần sợi..." /></Field>
              <Field label="Ghi chú nội bộ"><textarea className="input min-h-20" value={form.ghiChu} onChange={(e) => update("ghiChu", e.target.value)} /></Field>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 dark:bg-emerald-950/10"><ImageUploader files={files} onChange={setFiles} category="Ảnh mẫu vật tư" accept="image/*" label="Hình mẫu gửi nhà dệt" hint="Ảnh bo cổ, phối màu hoặc thông số kỹ thuật." /></div>
            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-slate-950 p-4 text-white shadow-xl">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div><div className="text-slate-400">Tiền mua NCC</div><div className="text-xl font-bold">{formatVND(totals.tienMua)}</div></div>
                <div><div className="text-slate-400">Tổng giá vốn</div><div className="text-xl font-bold text-emerald-400">{formatVND(totals.giaVon)}</div></div>
              </div>
              <button onClick={saveDraft} className="btn-primary min-w-[200px] justify-center py-3 text-center"><Save className="mr-2 h-4 w-4 inline" /> Lưu phiếu đặt NCC</button>
            </div>
          </section>
        ) : (
          <>
            <section className="border-b p-4 dark:border-white/10 md:p-6 xl:border-b-0 xl:border-r"><Title icon={UserRound} text="2. Thông tin đặt hàng" sub="Khách đặt → MIMIN → nhà dệt" /><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Mã phiếu"><input className="input" value={form.maPhieu} onChange={(e) => update("maPhieu", e.target.value)} /></Field><Field label="Khách hàng / xưởng may" required><select className="input" value={form.maKhachHang} onChange={(e) => { update("maKhachHang", e.target.value); const kh = khachHangList.find((x) => x.maKH === e.target.value); if (kh) update("diaChiGiao", kh.diaChi); }}><option value="">-- Chọn khách hàng --</option>{khachHangList.map((kh) => <option key={kh.maKH} value={kh.maKH}>{kh.maKH} · {kh.ten}</option>)}</select></Field><Field label="Nhà cung cấp dệt" required><select className="input" value={form.maNcc} onChange={(e) => update("maNcc", e.target.value)}><option value="">-- Chọn nhà cung cấp --</option>{nccList.map((ncc) => <option key={ncc.ma_ncc} value={ncc.ma_ncc}>{ncc.ma_ncc} · {ncc.ten_ncc}</option>)}</select></Field><Field label={`Số lượng (${selected?.donVi || "đơn vị"})`} required><input type="number" min="1" className="input" value={form.soLuong} onChange={(e) => update("soLuong", e.target.value)} /></Field><Field label="Ngày đặt"><input type="date" className="input" value={form.ngayDat} onChange={(e) => update("ngayDat", e.target.value)} /></Field><Field label="Hạn giao"><input type="date" className="input" value={form.ngayGiao} onChange={(e) => update("ngayGiao", e.target.value)} /></Field></div><div className="mt-4"><Field label="Quy cách dệt"><textarea className="input min-h-20" value={form.quyCach} onChange={(e) => update("quyCach", e.target.value)} placeholder="Chiều cao bo, số sọc, độ co giãn, thành phần sợi..." /></Field></div><div className="mt-4 rounded-2xl border p-4 dark:border-white/10"><label className="flex gap-3"><input type="checkbox" checked={form.giaoThangKhach} onChange={(e) => update("giaoThangKhach", e.target.checked)} className="mt-0.5 h-5 w-5" /><span><b className="flex items-center gap-1 text-sm"><Truck className="h-4 w-4 text-emerald-600" /> NCC giao thẳng cho khách</b><small className="text-slate-500">Không nhập tồn kho MIMIN, vẫn ghi mua bán và công nợ.</small></span></label><div className="mt-3"><Field label="Địa chỉ giao"><input className="input" value={form.diaChiGiao} onChange={(e) => update("diaChiGiao", e.target.value)} placeholder="Địa chỉ xưởng nhận hàng" /></Field></div></div><div className="mt-4 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/40 p-4 dark:bg-emerald-950/10"><ImageUploader files={files} onChange={setFiles} category="Ảnh mẫu vật tư" accept="image/*" label="Hình mẫu gửi nhà dệt" hint="Ảnh bo cổ, phối màu hoặc thông số kỹ thuật." /></div></section>
            <aside className="bg-slate-50/80 p-4 dark:bg-slate-950/40 md:p-6"><Title icon={Calculator} text="3. Giá & lợi nhuận" sub="Tự động tính theo số lượng" /><div className="mt-4 space-y-3"><Money label="Đơn giá mua NCC" value={form.donGiaMua} onChange={(v) => update("donGiaMua", v)} /><Money label="Đơn giá bán khách" value={form.donGiaBan} onChange={(v) => update("donGiaBan", v)} accent /><Money label="Phí vận chuyển mình chịu" value={form.phiVanChuyen} onChange={(v) => update("phiVanChuyen", v)} /><Money label="Chi phí khác" value={form.chiPhiKhac} onChange={(v) => update("chiPhiKhac", v)} /><Field label="VAT đầu ra"><select className="input" value={form.thueVat} onChange={(e) => update("thueVat", e.target.value)}>{[0, 5, 8, 10].map((v) => <option key={v} value={v}>{v}%</option>)}</select></Field></div><div className="mt-5 overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl"><div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4"><div className="text-xs font-bold">LỢI NHUẬN DỰ KIẾN</div><div className="mt-1 text-3xl font-black">{formatVND(totals.loiNhuan)}</div><div className="text-sm text-emerald-100">Biên lợi nhuận {totals.bienLoiNhuan.toFixed(1)}%</div></div><div className="space-y-2.5 p-4 text-sm"><Row label="Tiền mua NCC" value={totals.tienMua} /><Row label="Tổng giá vốn" value={totals.giaVon} /><Row label="Doanh thu trước VAT" value={totals.doanhThu} /><Row label="VAT đầu ra" value={totals.vatDauRa} /><div className="border-t border-white/10" /><Row label="Tổng hóa đơn khách" value={totals.tongHoaDon} strong /></div></div><div className="mt-4"><Field label="Ghi chú nội bộ"><textarea className="input min-h-20" value={form.ghiChu} onChange={(e) => update("ghiChu", e.target.value)} /></Field></div><button onClick={saveDraft} className="btn-primary mt-5 flex w-full justify-center py-3"><Save className="h-4 w-4" /> Lưu phiếu đặt NCC</button></aside>
          </>
        )}
      </div>

      <section className="order-items-table p-4 md:px-7 md:py-5">
        <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold">Danh sách vật tư trong đơn</h2><p className="text-xs text-slate-500">{orderPurpose === "customer" ? "Bấm mẫu bên dưới để thêm nhiều vật tư; mỗi dòng có giá mua và giá bán riêng." : "Bấm vật tư Kho phụ liệu bên dưới để thêm vào phiếu; mỗi dòng chỉ có giá mua NCC."}</p></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{orderItems.length} vật tư</span></div>
        {orderItems.length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-slate-500">Chưa chọn vật tư nào.</div> : <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/10"><table className="w-full min-w-[880px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-white/5"><tr><th className="p-3">Vật tư/phụ liệu</th><th className="p-3">Số lượng</th><th className="p-3">Đơn giá mua NCC</th>{orderPurpose === "customer" && <th className="p-3">Đơn giá bán khách</th>}{orderPurpose === "customer" && <th className="p-3 text-right">Lợi nhuận</th>}<th className="w-12 p-3" /></tr></thead><tbody>{orderItems.map((item) => <tr key={item.id} className="border-t border-slate-100 dark:border-white/10"><td className="p-3"><button type="button" onClick={() => { const material = materials.find((entry) => entry.maMau === item.maVatTu); if (material) selectMaterial(material); }} className="flex items-center gap-2 text-left">{item.hinhAnh ? <img src={item.hinhAnh} alt={item.tenVatTu} className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-white/10" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"><ImageIcon className="h-5 w-5 text-slate-400" /></span>}<span><b className="block text-emerald-700">{item.maVatTu}</b><span className="font-semibold">{item.tenVatTu}</span><small className="block text-slate-500">{item.mauSac} · {item.donVi}</small></span></button></td><td className="p-3"><input type="number" min="1" className="input w-28" value={item.soLuong} onChange={(e) => updateLine(item.id, "soLuong", e.target.value)} /></td><td className="p-3"><input type="number" min="0" className="input w-36 font-semibold" value={item.donGiaMua} onChange={(e) => updateLine(item.id, "donGiaMua", e.target.value)} /></td>{orderPurpose === "customer" && <td className="p-3"><input type="number" min="0" className="input w-36 border-emerald-300 bg-emerald-50 font-semibold dark:bg-emerald-950/20" value={item.donGiaBan} onChange={(e) => updateLine(item.id, "donGiaBan", e.target.value)} /></td>}{orderPurpose === "customer" && <td className={`p-3 text-right font-bold ${item.soLuong * (item.donGiaBan - item.donGiaMua) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>{formatVND(item.soLuong * (item.donGiaBan - item.donGiaMua))}</td>}<td className="p-3"><button type="button" onClick={() => removeLine(item.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50" title="Xóa vật tư"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>}
      </section>

      <div className="grid gap-3 border-t border-slate-200 bg-emerald-50/60 p-4 dark:border-white/10 dark:bg-emerald-950/20 md:grid-cols-2 md:px-7">
        <button type="button" onClick={() => printOrder("ncc")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"><Send className="h-5 w-5" /> In phiếu đặt sản xuất gửi NCC</button>
        {orderPurpose === "customer" ? <button type="button" onClick={() => printOrder("customer")} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"><Printer className="h-5 w-5" /> In phiếu bán hàng gửi khách/xưởng</button> : <div className="flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-slate-900">Hàng hoàn thành sẽ nhập Kho phụ liệu MIMIN</div>}
      </div>
    </section>
    {orderPurpose === "customer" ? <div className="grid gap-3 md:grid-cols-3"><Flow icon={UserRound} title="Khách hàng đặt" detail="Chốt mẫu, số lượng và giá bán" /><Flow icon={Building2} title="Nhà dệt sản xuất" detail="Nhận mẫu và giá mua từ phiếu" /><Flow icon={Truck} title="Giao hàng & hóa đơn" detail="Chốt số đạt và công nợ" /></div> : <div className="grid gap-3 md:grid-cols-3"><Flow icon={Package} title="Chọn hàng trong kho" detail="Dùng danh mục Kho phụ liệu hiện tại" /><Flow icon={Building2} title="Đặt nhà cung cấp" detail="Phiếu chỉ hiển thị giá mua NCC" /><Flow icon={Truck} title="Nhập kho MIMIN" detail="Nhận hàng về Kho phụ liệu công ty" /></div>}
    </>}
    <CrudModal open={showCustom} onClose={() => setShowCustom(false)} title="Tạo nhanh mẫu vật tư sản xuất" fields={customFields} onSubmit={addCustom} submitLabel="Lưu vào danh mục và chọn" onImageUpload={(file) => uploadProductFile(file, "vat-tu-dat-san-xuat")} />
  </div>;
}

function Title({ icon: Icon, text, sub }: { icon: typeof Package; text: string; sub: string }) { return <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950"><Icon className="h-5 w-5" /></div><div><h2 className="font-bold">{text}</h2><p className="text-xs text-slate-500">{sub}</p></div></div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { const customerOnly = label.includes("Khách hàng") || label.includes("Địa chỉ giao") || label.includes("VAT đầu ra"); return <label className={`block ${customerOnly ? "customer-only" : ""}`}><span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}{required && <b className="text-rose-500"> *</b>}</span>{children}</label>; }
function Money({ label, value, onChange, accent }: { label: string; value: string; onChange: (value: string) => void; accent?: boolean }) { return <div className={label.includes("bán khách") ? "customer-only" : ""}><Field label={label}><div className="relative"><input type="number" min="0" className={`input pr-8 font-semibold ${accent ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20" : ""}`} value={value} onChange={(e) => onChange(e.target.value)} /><span className="absolute right-3 top-3 text-xs text-slate-500">đ</span></div></Field></div>; }
function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) { const customerOnly = label.includes("Doanh thu") || label.includes("VAT") || label.includes("hóa đơn"); return <div className={`flex justify-between gap-2 ${strong ? "font-bold" : "text-slate-300"} ${customerOnly ? "customer-only" : ""}`}><span>{label}</span><span className="text-white">{formatVND(value)}</span></div>; }
function Flow({ icon: Icon, title, detail }: { icon: typeof Package; title: string; detail: string }) { return <div className="card flex items-center gap-3 p-4"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950"><Icon className="h-5 w-5" /></div><div><b className="text-sm">{title}</b><div className="text-xs text-slate-500">{detail}</div></div></div>; }
