"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search } from "lucide-react";
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

  const [inventory, setInventory] = useState(KHO_VAT_TU);
  const [editingVT, setEditingVT] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KhoVai>>({});

  const [inventoryImages, setInventoryImages] = useState<Record<string, string>>({});
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PL_IMAGES_KEY = "mimin_kho_phuLieu_images";
  const PL_INVENTORY_KEY = "mimin_kho_phuLieu_custom";

  // Load ảnh + inventory đã sửa từ localStorage khi mount
  useEffect(() => {
    try {
      const imgRaw = localStorage.getItem(PL_IMAGES_KEY);
      if (imgRaw) setInventoryImages(JSON.parse(imgRaw));
      const invRaw = localStorage.getItem(PL_INVENTORY_KEY);
      if (invRaw) {
        const saved = JSON.parse(invRaw) as Record<string, Partial<KhoVai>>;
        setInventory(prev => prev.map(v => saved[v.maVT] ? { ...v, ...saved[v.maVT] } : v));
      }
    } catch {}
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        // Persist ảnh qua F5
        setInventoryImages(prev => {
          const next = { ...prev, [uploadingVT]: url };
          localStorage.setItem(PL_IMAGES_KEY, JSON.stringify(next));
          return next;
        });
        toast.success("Đã tải ảnh và lưu thành công!");
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingVT(null);
  };

  // KPIs
  const dsTrangThai = danhSachTrangThai("phu-lieu");
  const tongGiaTri = dsTrangThai.reduce((s, t) => s + t.giaTriTon, 0);
  const dsCanhBao = dsTrangThai.filter((t) => t.canhBao);
  const tongNhap = giaoDich.filter((g) => g.loai === "NHAP" && inventory.find((v) => v.maVT === g.maVT)).reduce((s, g) => s + g.thanhTien, 0);
  const dsCanhBaoDetails = dsCanhBao.slice(0, 5).map((t) => {
    const vt = KHO_VAT_TU.find((v) => v.maVT === t.maVT);
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

  const handleSaveEdit = (v: KhoVai) => {
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

    // 3. Sync lên Supabase (fire-and-forget, có guard)
    if (isSupabaseEnabled && supabase) {
      supabase.from("kho").upsert(
        { sku: v.maVT, ten: updated.tenVT, don_gia: updated.donGia, loai: "phu-lieu" },
        { onConflict: "sku" }
      ).then(({ error }) => {
        if (error) console.warn("[kho-phu-lieu] Supabase upsert error:", error.message);
      });
    }

    toast.success("Đã lưu thông tin phụ liệu! (localStorage + Supabase)");
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              className="input pl-9"
              placeholder="Tìm theo tên, mã, loại, NCC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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

        {showNhap && <PLNhapKho maVT={showNhap} loai="phu-lieu" onClose={() => setShowNhap(null)} />}
        {showXuat && <PLXuatKho maVT={showXuat} loai="phu-lieu" onClose={() => setShowXuat(null)} />}
        {showHistory && <PLLichSu maVT={showHistory} loai="phu-lieu" onClose={() => setShowHistory(null)} />}
      </div>
    </div>
  );
}
