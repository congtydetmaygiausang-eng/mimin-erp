"use client";

import { useState, useMemo, useRef } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingVT) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInventoryImages((prev) => ({ ...prev, [uploadingVT]: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
    setInventory((prev) => prev.map((item) => (item.maVT === v.maVT ? { ...item, ...editForm } : item)));
    toast.success("Đã lưu thông tin phụ liệu!");
    setEditingVT(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] -m-4 md:-m-6 p-4 md:p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-400/20 via-teal-200/10 to-transparent dark:from-teal-900/30 dark:via-slate-900 dark:to-slate-900">
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
