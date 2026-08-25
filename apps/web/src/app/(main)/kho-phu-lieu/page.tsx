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

export default function KhoPhuLieuPage() {
  const { giaoDich, danhSachTrangThai, reset } = useKho();
  const [tab, setTab] = useState<Tab>("tongquan");
  const [search, setSearch] = useState("");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showXuat, setShowXuat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [selectedNhapMaVT, setSelectedNhapMaVT] = useState("");

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
    } catch {}

    const loadRemote = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      const { data, error } = await supabase
        .from("kho")
        .select("sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu")
        .eq("loai", "Phu lieu")
        .order("sku");
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
        } satisfies KhoVai;
      });
      setInventoryImages(Object.fromEntries((data || []).map((row) => [row.sku, readSharedImage(row.ghi_chu)]).filter(([, image]) => Boolean(image))));
      setInventory(remote);
      localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(remote));
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
          const metadata = JSON.stringify({ note: item?.ghiChu || "", imageUrl: url });
          const { error } = await supabase.from("kho").update({ ghi_chu: metadata, updated_at: new Date().toISOString() }).eq("sku", uploadingVT);
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
  const inventoryIds = new Set(inventory.map((item) => item.maVT));
  const dsTrangThai = danhSachTrangThai("phu-lieu").filter((item) => inventoryIds.has(item.maVT));
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

        {showNhap && <PLNhapKho maVT={showNhap} vatTu={inventory.find((item) => item.maVT === showNhap)} loai="phu-lieu" onClose={() => setShowNhap(null)} onImageSaved={(maVT, imageUrl) => setInventoryImages((prev) => ({ ...prev, [maVT]: imageUrl }))} />}
        {showXuat && <PLXuatKho maVT={showXuat} loai="phu-lieu" onClose={() => setShowXuat(null)} />}
        {showHistory && <PLLichSu maVT={showHistory} loai="phu-lieu" onClose={() => setShowHistory(null)} />}
      </div>
    </div>
  );
}
