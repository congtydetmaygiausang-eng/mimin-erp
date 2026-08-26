"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { useKho } from "@/lib/data/kho-store";
import { KHO_VAT_TU, type KhoVai } from "@/lib/data/real-data";
import type { Tab, LoaiKho } from "./data";
import { Header } from "./components/Header";
import { InventoryGrid } from "./components/InventoryGrid";
import { TransactionTable } from "./components/TransactionTable";
import { PLNhapKho, PLXuatKho, PLLichSu } from "./components/Modals";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { uploadProductFile } from "@/lib/product-upload";

const NEW_ACCESSORY_FIELDS: FieldDef[] = [
  { name: "maVT", label: "Mã phụ liệu (tự động)", type: "text", required: true, readOnly: true },
  { name: "tenVT", label: "Tên phụ liệu", type: "text", required: true, placeholder: "VD: Nút áo đen" },
  { name: "loai", label: "Loại phụ liệu", type: "select", required: true, options: [
    { value: "Nút", label: "Nút" }, { value: "Dây kéo", label: "Dây kéo" },
    { value: "Thun", label: "Thun" }, { value: "Bo cổ", label: "Bo cổ" },
    { value: "Nhãn", label: "Nhãn / Thẻ bài" }, { value: "Bao bì", label: "Bao bì" },
    { value: "Phụ liệu khác", label: "Phụ liệu khác" },
  ] },
  { name: "dvt", label: "Đơn vị tính", type: "select", required: true, options: [
    { value: "cái", label: "Cái" }, { value: "bộ", label: "Bộ" },
    { value: "m", label: "Mét" }, { value: "kg", label: "Kg" },
    { value: "cuộn", label: "Cuộn" }, { value: "gói", label: "Gói" },
  ] },
  { name: "donGia", label: "Đơn giá mặc định", type: "number", min: 0 },
  { name: "hinhAnh", label: "Hình ảnh phụ liệu", type: "image" },
  { name: "ghiChu", label: "Ghi chú", type: "textarea", rows: 2 },
];

export default function KhoPhuLieuPage() {
  const { giaoDich, reset } = useKho();
  const [tab, setTab] = useState<Tab>("tongquan");
  const [search, setSearch] = useState("");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showXuat, setShowXuat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [selectedNhapMaVT, setSelectedNhapMaVT] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [inventory, setInventory] = useState<KhoVai[]>([]);
  const [editingVT, setEditingVT] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KhoVai>>({});

  const [inventoryImages, setInventoryImages] = useState<Record<string, string>>({});
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PL_IMAGES_KEY = "mimin_kho_phuLieu_images";
  const PL_INVENTORY_KEY = "mimin_kho_phuLieu_custom";

  const readSharedImage = (ghiChu: string | null | undefined) => {
    if (!ghiChu) return "";
    try {
      const parsed = JSON.parse(ghiChu) as { imageUrl?: unknown };
      return typeof parsed.imageUrl === "string" ? parsed.imageUrl : "";
    } catch { return ""; }
  };

  // Supabase là nguồn dữ liệu chính; không tự sinh lại danh mục phụ liệu mẫu.
  useEffect(() => {
    let mounted = true;
    try {
      const imgRaw = localStorage.getItem(PL_IMAGES_KEY);
      if (imgRaw) setInventoryImages(JSON.parse(imgRaw));
      const inventoryRaw = localStorage.getItem(PL_INVENTORY_KEY);
      if (inventoryRaw) {
        const cached = JSON.parse(inventoryRaw);
        if (Array.isArray(cached) && cached.length > 0) setInventory(cached);
      }
    } catch {}

    const loadRemote = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      const baseQuery = supabase
        .from("kho")
        .select("sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu")
        .eq("loai", "Phu lieu")
        .order("sku");
      let { data, error } = await supabase
        .from("kho")
        .select("sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu, hinh_anh")
        .eq("loai", "Phu lieu")
        .order("sku");
      if (error?.code === "PGRST204" || error?.code === "42703") {
        ({ data, error } = await baseQuery);
      }
      if (error) {
        toast.error(`Không tải được Kho phụ liệu: ${error.message}`);
        return;
      }
      if (!mounted) return;
      const remote = (data || []).map((row) => {
        const fallback = KHO_VAT_TU.find((item) => item.maVT === row.sku);
        return {
          ...(fallback || {}),
          maVT: row.sku,
          tenVT: row.ten_vt,
          loai: row.loai_chi_tiet || fallback?.loai || "Phụ liệu",
          mauSac: row.mau_sac || "",
          dvt: row.dvt || "sp",
          donGia: Number(row.don_gia) || 0,
          tonKho: Number(row.ton_kho) || 0,
          tonToiThieu: Number(row.ton_toi_thieu) || 0,
          soCayNhap: Number(row.so_cay_nhap) || 0,
          tonCay: Number(row.ton_cay) || 0,
          tyLeHaoHut: Number(row.ty_le_hao_hut) || 0,
          kho: row.kho || "Kho phụ liệu",
          ghiChu: row.ghi_chu || "",
          hinhAnh: row.hinh_anh || readSharedImage(row.ghi_chu),
        } satisfies KhoVai;
      });
      const remoteImages = Object.fromEntries((data || []).map((row) => [row.sku, row.hinh_anh || readSharedImage(row.ghi_chu)]).filter(([, image]) => Boolean(image)));
      setInventoryImages((current) => ({ ...current, ...remoteImages }));
      if (remote.length > 0) {
        setInventory(remote);
        localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(remote));
      }
    };

    void loadRemote();
    if (!isSupabaseEnabled || !supabase) return () => { mounted = false; };
    const channel = supabase
      .channel(`kho-phu-lieu-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kho", filter: "loai=eq.Phu lieu" },
        () => { void loadRemote(); }
      )
      .subscribe();
    return () => {
      mounted = false;
      void supabase?.removeChannel(channel);
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const url = ev.target?.result as string;
        // Persist ảnh qua F5
        setInventoryImages(prev => {
          const next = { ...prev, [uploadingVT]: url };
          localStorage.setItem(PL_IMAGES_KEY, JSON.stringify(next));
          return next;
        });
        if (isSupabaseEnabled && supabase) {
          const item = inventory.find((value) => value.maVT === uploadingVT);
          const { error } = await supabase.from("kho").update({ hinh_anh: url, updated_at: new Date().toISOString() }).eq("sku", uploadingVT);
          if (error) return toast.error(`Chưa lưu được ảnh lên Supabase: ${error.message}`);
        }
        toast.success("Đã tải ảnh và đồng bộ cho tất cả nhân viên!");
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingVT(null);
  };

  // KPIs
  const dsTrangThai = inventory.map((item) => {
    const tonKho = Number(item.tonKho) || 0;
    const tonToiThieu = Number(item.tonToiThieu) || 0;
    const giaoDichVatTu = giaoDich.filter((row) => row.maVT === item.maVT);
    return {
      maVT: item.maVT,
      tonKho,
      tonToiThieu,
      canhBao: tonToiThieu > 0 && tonKho < tonToiThieu,
      giaTriTon: tonKho * (Number(item.donGia) || 0),
      tongNhap: giaoDichVatTu.filter((row) => row.loai === "NHAP").reduce((sum, row) => sum + row.soLuong, 0),
      tongXuat: giaoDichVatTu.filter((row) => row.loai === "XUAT").reduce((sum, row) => sum + row.soLuong, 0),
    };
  });
  const tongGiaTri = dsTrangThai.reduce((s, t) => s + t.giaTriTon, 0);
  const dsCanhBao = dsTrangThai.filter((t) => t.canhBao);
  const tongNhap = giaoDich.filter((g) => g.loai === "NHAP" && inventory.find((v) => v.maVT === g.maVT)).reduce((s, g) => s + g.thanhTien, 0);
  const dsCanhBaoDetails = dsCanhBao.slice(0, 5).map((t) => {
    const vt = inventory.find((v) => v.maVT === t.maVT);
    return `${vt?.tenVT} (còn ${t.tonKho.toFixed(0)})`;
  }).join(", ") + ".";

  // Filter
  const filteredVT = useMemo(() => inventory.filter((v) => {
    const matchSearch = [v.tenVT, v.maVT, v.loai].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  }), [search, inventory]);

  const filteredGD = useMemo(() => giaoDich
    .filter((g) => inventory.find((v) => v.maVT === g.maVT))
    .filter((g) => {
      const matchSearch = [g.maVT, g.tenVT, g.nguonNhap, g.nguoiThucHien].some((x) => (x || "").toLowerCase().includes(search.toLowerCase()));
      const matchLoai = tab === "nhap" ? g.loai === "NHAP" : tab === "xuat" ? g.loai === "XUAT" : true;
      return matchSearch && matchLoai;
    })
    .sort((a, b) => b.ngay.localeCompare(a.ngay)),
  [giaoDich, search, tab, inventory]);

  const nextAccessoryCode = useMemo(() => {
    const maxSequence = inventory.reduce((max, item) => {
      const sequence = Number(item.maVT.match(/^PL-(\d+)$/i)?.[1] || 0);
      return Math.max(max, sequence);
    }, 0);
    return `PL-${String(Math.max(maxSequence, inventory.length) + 1).padStart(3, "0")}`;
  }, [inventory]);

  const handleSaveEdit = async (v: KhoVai) => {
    const updated = { ...v, ...editForm };
    // 1. Cập nhật state React
    setInventory((prev) => prev.map((item) => (item.maVT === v.maVT ? updated : item)));

    // 2. Persist vào localStorage (survive F5)
    try {
      const raw = localStorage.getItem(PL_INVENTORY_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      saved[v.maVT] = { tenVT: updated.tenVT, donGia: updated.donGia };
      localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(saved));
    } catch {}

    // 3. Chỉ báo thành công sau khi Supabase xác nhận.
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase.from("kho").upsert(
        {
          sku: v.maVT,
          ten_vt: updated.tenVT,
          loai: "Phu lieu",
          loai_chi_tiet: updated.loai,
          mau_sac: updated.mauSac,
          dvt: updated.dvt,
          don_gia: updated.donGia,
          ton_kho: updated.tonKho,
          ton_toi_thieu: updated.tonToiThieu,
          kho: updated.kho || "Kho phụ liệu",
          ghi_chu: updated.ghiChu || null,
          hinh_anh: updated.hinhAnh || inventoryImages[v.maVT] || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "sku" }
      );
      if (error) {
        toast.error("Lỗi đồng bộ Supabase: " + error.message);
        return;
      }
      toast.success("✅ Đã lưu thông tin phụ liệu lên Supabase!");
    } else {
      toast.success("Đã lưu thông tin phụ liệu (localStorage)!");
    }

    setEditingVT(null);
  };

  const handleAddAccessory = async (values: Record<string, string>) => {
    const maVT = nextAccessoryCode;
    if (inventory.some((item) => item.maVT.toUpperCase() === maVT)) {
      throw new Error(`Mã phụ liệu ${maVT} đã tồn tại`);
    }
    const newItem: KhoVai = {
      maVT,
      tenVT: values.tenVT.trim(),
      loai: values.loai,
      mauSac: "",
      dvt: values.dvt,
      donGia: Number(values.donGia) || 0,
      tonKho: 0,
      tonToiThieu: 0,
      soCayNhap: 0,
      tonCay: 0,
      tyLeHaoHut: 0,
      kho: "Kho phụ liệu",
      hinhAnh: values.hinhAnh || undefined,
      ghiChu: values.ghiChu?.trim() || "",
    };
    if (isSupabaseEnabled && supabase) {
      const payload = {
        sku: newItem.maVT,
        ten_vt: newItem.tenVT,
        loai: "Phu lieu",
        loai_chi_tiet: newItem.loai,
        mau_sac: newItem.mauSac,
        dvt: newItem.dvt,
        don_gia: newItem.donGia,
        ton_kho: 0,
        ton_toi_thieu: 0,
        so_cay_nhap: 0,
        ton_cay: 0,
        ty_le_hao_hut: 0,
        kho: newItem.kho,
        ghi_chu: newItem.ghiChu || null,
        hinh_anh: newItem.hinhAnh || null,
        updated_at: new Date().toISOString(),
      };
      let { error } = await supabase.from("kho").insert(payload);
      if (error?.code === "PGRST204" || error?.code === "42703") {
        const fallbackPayload = { ...payload, hinh_anh: undefined, ghi_chu: JSON.stringify({ note: newItem.ghiChu || "", imageUrl: newItem.hinhAnh || "" }) };
        ({ error } = await supabase.from("kho").insert(fallbackPayload));
      }
      if (error) throw new Error(error.message);
    }
    setInventory((prev) => [...prev, newItem].sort((a, b) => a.maVT.localeCompare(b.maVT)));
    setSelectedNhapMaVT(newItem.maVT);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 md:-m-6 p-4 md:p-6 bg-gradient-to-br from-cyan-600 via-cyan-700 to-cyan-800">
      <div className="max-w-7xl mx-auto space-y-5 animate-fade-in relative z-10">
        <Header
          inventoryCount={inventory.length}
          tongGiaTri={tongGiaTri}
          dsCanhBao={dsCanhBao}
          dsCanhBaoDetails={dsCanhBaoDetails}
          tongNhap={tongNhap}
          onReset={() => { if (confirm("Reset?")) { reset(); toast.success("Đã reset"); } }}
          tab={tab}
          setTab={setTab}
        />

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        <div className="card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              className="input pl-9"
              placeholder="Tìm theo tên, mã, loại, NCC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input md:w-64" value={selectedNhapMaVT} onChange={(e) => setSelectedNhapMaVT(e.target.value)}>
            <option value="">-- Chọn phụ liệu nhập --</option>
            {inventory.map((item) => <option key={item.maVT} value={item.maVT}>{item.maVT} — {item.tenVT}</option>)}
          </select>
          <button
            type="button"
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
            onClick={() => selectedNhapMaVT ? setShowNhap(selectedNhapMaVT) : toast.error("Vui lòng chọn phụ liệu cần nhập")}
          >
            <Plus className="h-4 w-4" /> Nhập phụ liệu từ NCC
          </button>
          <button
            type="button"
            className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
            onClick={() => setShowAdd(true)}
          >
            <Plus className="h-4 w-4" /> Thêm phụ liệu mới
          </button>
          </div>
        </div>

        {tab === "tongquan" && (
          <InventoryGrid
            filteredVT={filteredVT}
            dsTrangThai={dsTrangThai}
            inventoryImages={inventoryImages}
            editingVT={editingVT}
            editForm={editForm}
            setEditingVT={setEditingVT}
            setEditForm={setEditForm}
            onSaveEdit={handleSaveEdit}
            onUploadImage={(maVT) => { setUploadingVT(maVT); fileInputRef.current?.click(); }}
            onShowNhap={setShowNhap}
            onShowXuat={setShowXuat}
          />
        )}

        {(tab === "nhap" || tab === "xuat" || tab === "lichsu") && <TransactionTable filteredGD={filteredGD} />}

        {showNhap && <PLNhapKho maVT={showNhap} vatTu={inventory.find((item) => item.maVT === showNhap)} loai="phu-lieu" simple onClose={() => setShowNhap(null)} onImageSaved={(maVT, imageUrl) => setInventoryImages((prev) => ({ ...prev, [maVT]: imageUrl }))} />}
        {showXuat && <PLXuatKho maVT={showXuat} loai="phu-lieu" onClose={() => setShowXuat(null)} />}
        {showHistory && <PLLichSu maVT={showHistory} loai="phu-lieu" onClose={() => setShowHistory(null)} />}
        <CrudModal
          open={showAdd}
          onClose={() => setShowAdd(false)}
          title="Thêm phụ liệu mới"
          fields={NEW_ACCESSORY_FIELDS}
          initial={{ maVT: nextAccessoryCode, loai: "Phụ liệu khác", dvt: "cái", donGia: "0" }}
          submitLabel="Tạo mã phụ liệu"
          onImageUpload={(file) => uploadProductFile(file, `kho-phu-lieu-${nextAccessoryCode}`)}
          onSubmit={handleAddAccessory}
        />
      </div>
    </div>
  );
}
