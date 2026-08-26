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
  const { giaoDich, reset } = useKho();
  const [tab, setTab] = useState<Tab>("tongquan");
  const [search, setSearch] = useState("");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showXuat, setShowXuat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const [inventory, setInventory] = useState<KhoVai[]>(KHO_VAT_TU);
  const [editingVT, setEditingVT] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KhoVai>>({});

  const [inventoryImages, setInventoryImages] = useState<Record<string, string>>({});
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PL_IMAGES_KEY = "mimin_kho_phuLieu_images";
  const PL_INVENTORY_KEY = "mimin_kho_phuLieu_custom";

  // Đồng bộ kho_phu_lieu từ Supabase
  useEffect(() => {
    if (isSupabaseEnabled && supabase) {
      supabase.from("kho_phu_lieu").select("*").then(({ data, error }) => {
        if (data && data.length > 0) {
          const mapped: KhoVai[] = data.map((d: any) => ({
            maVT: d.sku || "",
            tenVT: d.ten_vt || "",
            loai: d.loai || "Phụ liệu",
            dvt: d.dvt || "cái",
            donGia: d.don_gia || 0,
            tonKho: d.ton_kho || 0,
            tonToiThieu: d.ton_toi_thieu || 0,
            kho: "Kho phụ liệu",
            mauSac: d.mau_sac || "",
            ghiChu: d.ghi_chu || "",
            soCayNhap: d.so_cay_nhap || 0,
            tonCay: d.ton_cay || 0,
          }));
          setInventory(mapped);
          
          // Khôi phục hình ảnh cũ (migrate BO-XXX to PL-XXX)
          try {
            const imgRaw = localStorage.getItem(PL_IMAGES_KEY);
            if (imgRaw) {
              const oldImgs = JSON.parse(imgRaw);
              const newImgs = { ...oldImgs };
              let migrated = false;
              mapped.forEach(nv => {
                if (!newImgs[nv.maVT]) {
                  // Find old item by name
                  const oldItem = KHO_VAT_TU.find(o => o.tenVT.toLowerCase() === nv.tenVT.toLowerCase());
                  if (oldItem && oldImgs[oldItem.maVT]) {
                    newImgs[nv.maVT] = oldImgs[oldItem.maVT];
                    migrated = true;
                  }
                }
              });
              if (migrated) {
                localStorage.setItem(PL_IMAGES_KEY, JSON.stringify(newImgs));
                setInventoryImages(newImgs);
              }
            }
          } catch {}
        } else {
          // Fallback localStorage if Supabase is empty or fails
          try {
            const invRaw = localStorage.getItem(PL_INVENTORY_KEY);
            if (invRaw) {
              const saved = JSON.parse(invRaw) as Record<string, Partial<KhoVai>>;
              setInventory(prev => prev.map(v => saved[v.maVT] ? { ...v, ...saved[v.maVT] } : v));
            }
          } catch {}
        }
      });
    }

    try {
      const imgRaw = localStorage.getItem(PL_IMAGES_KEY);
      if (imgRaw) setInventoryImages(JSON.parse(imgRaw));
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
  const dsTrangThai = useMemo(() => {
    return inventory.map(v => {
      const gd = giaoDich.filter((g) => g.maVT === v.maVT);
      const tongNhap = gd.filter((g) => g.loai === "NHAP").reduce((s, g) => s + g.soLuong, 0);
      const tongXuat = gd.filter((g) => g.loai === "XUAT").reduce((s, g) => s + g.soLuong, 0);
      const tonKho = v.tonKho + tongNhap - tongXuat;
      return {
        maVT: v.maVT,
        tonKho,
        tonToiThieu: v.tonToiThieu || 0,
        canhBao: tonKho < (v.tonToiThieu || 0),
        giaTriTon: tonKho * v.donGia,
        lanNhapGanNhat: gd.filter((g) => g.loai === "NHAP").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay,
        lanXuatGanNhat: gd.filter((g) => g.loai === "XUAT").sort((a, b) => b.ngay.localeCompare(a.ngay))[0]?.ngay,
        tongNhap,
        tongXuat,
      };
    });
  }, [inventory, giaoDich]);
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

  const handleSaveEdit = (v: KhoVai) => {
    const updated = { ...v, ...editForm };
    // 1. Cập nhật state React
    setInventory((prev) => prev.map((item) => (item.maVT === v.maVT ? updated : item)));

    // 2. Persist vào localStorage (survive F5)
    try {
      const raw = localStorage.getItem(PL_INVENTORY_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      saved[v.maVT] = updated;
      localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(saved));
    } catch {}

    // 3. Cập nhật lên Supabase
    if (isSupabaseEnabled && supabase) {
      supabase.from("kho_phu_lieu").upsert({
        sku: v.maVT,
        ten_vt: updated.tenVT,
        loai: updated.loai || "Phụ liệu",
        dvt: updated.dvt || "cái",
        don_gia: updated.donGia,
        ton_kho: v.tonKho,
        ton_toi_thieu: v.tonToiThieu,
      }, { onConflict: "sku" }).then(({ error }) => {
        if (error) {
          toast.error("Lỗi đồng bộ Supabase: " + error.message);
        } else {
          toast.success("✅ Đã lưu thông tin phụ liệu lên Supabase!");
        }
      });
    }

    setEditingVT(null);
    setEditForm({});
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

        {showNhap && <PLNhapKho maVT={showNhap} inventory={inventory} loai="phu-lieu" onClose={() => setShowNhap(null)} />}
        {showXuat && <PLXuatKho maVT={showXuat} inventory={inventory} loai="phu-lieu" onClose={() => setShowXuat(null)} />}
        {showHistory && <PLLichSu maVT={showHistory} inventory={inventory} loai="phu-lieu" onClose={() => setShowHistory(null)} />}
      </div>
    </div>
  );
}
