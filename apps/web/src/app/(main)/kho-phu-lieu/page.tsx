"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, Search, Boxes, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase, isSupabaseEnabled } from "@/lib/supabase/client";
import { useKho } from "@/lib/data/kho-store";
import { KHO_VAT_TU, type KhoVai } from "@/lib/data/real-data";
import { getInventory } from "@/lib/inventory-engine";
import type { Tab, LoaiKho } from "./data";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { InventoryTable } from "./components/InventoryTable";
import { InventoryGrid } from "./components/InventoryGrid";
import { TransactionTable } from "./components/TransactionTable";
import { PLNhapKho, PLXuatKho, PLLichSu } from "./components/Modals";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { uploadProductFile } from "@/lib/product-upload";

const NEW_ACCESSORY_FIELDS: FieldDef[] = [
  { name: "maVT", label: "Mã phụ liệu (tự động)", type: "text", required: true, readOnly: true },
  { name: "tenVT", label: "Tên phụ liệu", type: "text", required: true, placeholder: "VD: Nút áo đen" },
  { name: "loai", label: "Loại phụ liệu", type: "select", required: true, options: [
    { value: "Bo cổ", label: "Bo cổ" },
    { value: "Nút", label: "Nút / Cúc" },
    { value: "Dây kéo", label: "Dây kéo" },
    { value: "Thun", label: "Thun" },
    { value: "Chỉ may", label: "Chỉ may" },
    { value: "Nhãn", label: "Nhãn / Thẻ bài" },
    { value: "Bao bì", label: "Bao bì đóng gói" },
    { value: "Phụ liệu khác", label: "Phụ liệu khác" },
  ] },
  { name: "dvt", label: "Đơn vị tính", type: "select", required: true, options: [
    { value: "cái", label: "Cái" },
    { value: "bộ", label: "Bộ" },
    { value: "m", label: "Mét" },
    { value: "kg", label: "Kg" },
    { value: "cuộn", label: "Cuộn" },
    { value: "gói", label: "Gói" },
    { value: "thùng", label: "Thùng" },
  ] },
  { name: "donGia", label: "Đơn giá mặc định", type: "number", min: 0 },
  { name: "hinhAnh", label: "Hình ảnh phụ liệu", type: "image" },
  { name: "ghiChu", label: "Ghi chú", type: "textarea", rows: 2 },
];

export default function KhoPhuLieuPage() {
  const { giaoDich } = useKho();
  const [tab, setTab] = useState<Tab>("tongquan");
  const [search, setSearch] = useState("");
  const [showNhap, setShowNhap] = useState<string | null>(null);
  const [showXuat, setShowXuat] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [selectedNhapMaVT, setSelectedNhapMaVT] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Bộ lọc & Chế độ xem
  const [viewMode, setViewMode] = useState<"list" | "card">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mimin_phu_lieu_view_mode");
      if (saved === "card" || saved === "list") return saved;
    }
    return "list";
  });

  const [filterLoai, setFilterLoai] = useState<string>("all");
  const [filterTrangThai, setFilterTrangThai] = useState<"all" | "con-hang" | "canh-bao" | "het-hang">("all");
  const [filterDvt, setFilterDvt] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"ma" | "ton-desc" | "ton-asc" | "giatri-desc" | "dongia-desc" | "ten">("ma");
  const [isSyncingBo, setIsSyncingBo] = useState(false);

  const cleanAndMergeInventory = (rawList: KhoVai[]): KhoVai[] => {
    // 1. Phụ liệu khác (không phải bo và không phải nút)
    const otherItems = rawList.filter(
      (item) =>
        item.loai !== "Bo cổ" &&
        !item.maVT.startsWith("BO-") &&
        !item.maVT.startsWith("B2D-") &&
        item.loai !== "Nút" &&
        !item.maVT.startsWith("NUT-")
    );
    const finalOther =
      otherItems.length > 0
        ? otherItems
        : KHO_VAT_TU.filter(
            (item) =>
              item.loai !== "Bo cổ" &&
              !item.maVT.startsWith("BO-") &&
              item.loai !== "Nút" &&
              !item.maVT.startsWith("NUT-")
          );

    // 2. 28 bo chuẩn từ KHO_VAT_TU
    const standardBo = KHO_VAT_TU.filter((item) => /^BO-(0[1-9]|[12][0-9])$/.test(item.maVT));

    // 3. 28 nút chuẩn từ KHO_VAT_TU
    const standardNut = KHO_VAT_TU.filter((item) => /^NUT-(0[1-9]|[12][0-9])$/.test(item.maVT));

    // Giữ lại số lượng tồn kho hoặc thông tin đã cập nhật nếu có
    const existingMap = new Map<string, KhoVai>();
    rawList.forEach((item) => {
      if (/^(BO|NUT)-(0[1-9]|[12][0-9])$/.test(item.maVT)) {
        existingMap.set(item.maVT, item);
      }
    });

    const mergedBo = standardBo.map((bo) => {
      const existing = existingMap.get(bo.maVT);
      if (existing) {
        return {
          ...bo,
          tonKho: existing.tonKho ?? bo.tonKho,
          donGia: existing.donGia ?? bo.donGia,
          tonToiThieu: existing.tonToiThieu ?? bo.tonToiThieu,
          hinhAnh: existing.hinhAnh || bo.hinhAnh,
        };
      }
      return bo;
    });

    const mergedNut = standardNut.map((nut) => {
      const existing = existingMap.get(nut.maVT);
      if (existing) {
        return {
          ...nut,
          tonKho: existing.tonKho ?? nut.tonKho,
          donGia: existing.donGia ?? nut.donGia,
          tonToiThieu: existing.tonToiThieu ?? nut.tonToiThieu,
          hinhAnh: existing.hinhAnh || nut.hinhAnh,
        };
      }
      return nut;
    });

    return [...mergedBo, ...mergedNut, ...finalOther];
  };

  const [inventory, setInventory] = useState<KhoVai[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("mimin_kho_phuLieu_custom");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasOldBo = parsed.some(
              (item) => (item.maVT.startsWith("BO-0") && item.maVT.length === 6) ||
                        item.maVT.startsWith("B2D-") ||
                        (item.loai === "Bo cổ" && !/^BO-(0[1-9]|[12][0-9])$/.test(item.maVT))
            );
            const hasOldNut = parsed.some(
              (item) => (item.loai === "Nút" || item.maVT.startsWith("NUT-")) && !/^NUT-(0[1-9]|[12][0-9])$/.test(item.maVT)
            );
            if (hasOldBo || hasOldNut) {
              const cleaned = cleanAndMergeInventory(parsed);
              localStorage.setItem("mimin_kho_phuLieu_custom", JSON.stringify(cleaned));
              return cleaned;
            }
            return parsed;
          }
        }
      } catch {}
    }
    return KHO_VAT_TU;
  });
  const [editingVT, setEditingVT] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<KhoVai>>({});

  const [inventoryImages, setInventoryImages] = useState<Record<string, string>>({});
  const [uploadingVT, setUploadingVT] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PL_IMAGES_KEY = "mimin_kho_phuLieu_images";
  const PL_INVENTORY_KEY = "mimin_kho_phuLieu_custom";

  const handleSetViewMode = (mode: "list" | "card") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("mimin_phu_lieu_view_mode", mode);
    }
  };

  const readSharedImage = (ghiChu: string | null | undefined): string => {
    if (!ghiChu) return "";
    const trimmed = ghiChu.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed.imageUrl === "string") return parsed.imageUrl;
      } catch {}
    }
    const matchJson = trimmed.match(/"imageUrl"\s*:\s*"([^"]+)"/);
    if (matchJson?.[1]) return matchJson[1];
    const matchTag = trimmed.match(/\[IMG:(https?:\/\/[^\]]+)\]/);
    if (matchTag?.[1]) return matchTag[1];
    return "";
  };

  // Hàm đồng bộ danh sách Bo & Nút theo 28 màu Vải thành phẩm
  const dongBoBoTuKhoVai = async () => {
    setIsSyncingBo(true);
    try {
      // 1. Lấy danh sách 28 loại vải từ Vải thành phẩm (Supabase hoặc local)
      let dsVai: any[] = [];
      if (isSupabaseEnabled && supabase) {
        const { data, error } = await supabase
          .from("kho")
          .select("sku, ten_vt, mau_sac, ghi_chu")
          .eq("loai", "Vai")
          .order("sku");
        if (!error && data && data.length > 0) {
          dsVai = data;
        }
      }
      if (dsVai.length === 0) {
        const invObj = getInventory();
        const localList = Object.values(invObj);
        if (localList.length > 0) {
          dsVai = localList.map((v) => ({
            sku: v.maVT,
            ten_vt: v.tenVT,
            mau_sac: v.mauSac,
            ghi_chu: v.ghiChu,
            hinh_anh: (v as any).imageUrl || v.hinhAnh,
          }));
        }
      }

      // Tạo map 28 bo & 28 nút theo vải
      const standard28Bo = KHO_VAT_TU.filter((item) => /^BO-(0[1-9]|[12][0-9])$/.test(item.maVT));
      const standard28Nut = KHO_VAT_TU.filter((item) => /^NUT-(0[1-9]|[12][0-9])$/.test(item.maVT));

      const newBoList: KhoVai[] = standard28Bo.map((defaultBo, idx) => {
        const vaiItem = dsVai[idx];
        const colorName = vaiItem?.mau_sac || vaiItem?.ten_vt || defaultBo.mauSac;
        const img = vaiItem?.hinh_anh || readSharedImage(vaiItem?.ghi_chu) || defaultBo.hinhAnh;
        return {
          ...defaultBo,
          tenVT: `Bo Cổ Trơn - ${colorName}`,
          mauSac: colorName,
          hinhAnh: img,
          ghiChu: `Đồng bộ từ vải ${vaiItem?.sku || `VAI-${String(idx + 1).padStart(2, "0")}`} (${colorName})`,
        };
      });

      const newNutList: KhoVai[] = standard28Nut.map((defaultNut, idx) => {
        const vaiItem = dsVai[idx];
        const colorName = vaiItem?.mau_sac || vaiItem?.ten_vt || defaultNut.mauSac;
        const img = vaiItem?.hinh_anh || readSharedImage(vaiItem?.ghi_chu) || defaultNut.hinhAnh;
        return {
          ...defaultNut,
          tenVT: `Nút - ${colorName}`,
          mauSac: colorName,
          hinhAnh: img,
          ghiChu: `Đồng bộ từ vải ${vaiItem?.sku || `VAI-${String(idx + 1).padStart(2, "0")}`} (${colorName})`,
        };
      });

      // Lọc bỏ toàn bộ bo cũ và nút cũ trong inventory hiện tại
      const otherItems = inventory.filter(
        (item) =>
          item.loai !== "Bo cổ" &&
          !item.maVT.startsWith("BO-") &&
          !item.maVT.startsWith("B2D-") &&
          item.loai !== "Nút" &&
          !item.maVT.startsWith("NUT-")
      );
      const finalOther =
        otherItems.length > 0
          ? otherItems
          : KHO_VAT_TU.filter(
              (item) =>
                item.loai !== "Bo cổ" &&
                !item.maVT.startsWith("BO-") &&
                item.loai !== "Nút" &&
                !item.maVT.startsWith("NUT-")
            );

      const combined = [...newBoList, ...newNutList, ...finalOther];
      setInventory(combined);
      localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(combined));

      // Cập nhật ảnh bo và nút
      const newImages: Record<string, string> = { ...inventoryImages };
      [...newBoList, ...newNutList].forEach((item) => {
        if (item.hinhAnh) newImages[item.maVT] = item.hinhAnh;
      });
      setInventoryImages(newImages);
      localStorage.setItem(PL_IMAGES_KEY, JSON.stringify(newImages));

      // Đồng bộ lên Supabase nếu có
      if (isSupabaseEnabled && supabase) {
        for (const item of [...newBoList, ...newNutList]) {
          const payload = {
            sku: item.maVT,
            ten_vt: item.tenVT,
            loai: "Phu lieu",
            loai_chi_tiet: item.loai,
            mau_sac: item.mauSac,
            dvt: item.dvt,
            don_gia: item.donGia,
            ton_kho: item.tonKho || 0,
            ton_toi_thieu: item.tonToiThieu || 0,
            so_cay_nhap: 0,
            ton_cay: 0,
            ty_le_hao_hut: 0,
            kho: "Kho phụ liệu",
            ghi_chu: JSON.stringify({ note: item.ghiChu, imageUrl: item.hinhAnh }),
            updated_at: new Date().toISOString(),
          };
          await supabase.from("kho").upsert(payload, { onConflict: "sku" });
        }
      }

      toast.success("Đã đồng bộ 28 màu Bo và 28 màu Nút chuẩn theo 28 màu vải thành phẩm!");
    } catch (err: any) {
      console.error("Lỗi đồng bộ bo & nút:", err);
      toast.error(`Đồng bộ thất bại: ${err?.message || "Lỗi không xác định"}`);
    } finally {
      setIsSyncingBo(false);
    }
  };

  // Supabase là nguồn dữ liệu chính
  useEffect(() => {
    let mounted = true;
    try {
      const imgRaw = localStorage.getItem(PL_IMAGES_KEY);
      if (imgRaw) setInventoryImages(JSON.parse(imgRaw));
      const inventoryRaw = localStorage.getItem(PL_INVENTORY_KEY);
      if (inventoryRaw) {
        const cached = JSON.parse(inventoryRaw);
        if (Array.isArray(cached) && cached.length > 0) {
          const cleaned = cleanAndMergeInventory(cached);
          setInventory(cleaned);
        }
      }
    } catch {}

    const loadRemote = async () => {
      if (!isSupabaseEnabled || !supabase) return;
      try {
        const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
          setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 4500)
        );

        const fetchPromise = supabase
          .from("kho")
          .select("sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, so_cay_nhap, ton_cay, ty_le_hao_hut, kho, ghi_chu")
          .eq("loai", "Phu lieu")
          .order("sku")
          .limit(150);

        let { data, error }: { data: any; error: any } = await Promise.race([fetchPromise, timeoutPromise]);

        if (error) {
          console.warn("[KhoPhuLieu] Supabase remote query warning (using local cache):", error.message);
          // Thử câu query nhẹ nếu câu chính timeout
          if (error.message.includes("timeout") || error.message.includes("statement timeout")) {
            const { data: lightData } = await supabase
              .from("kho")
              .select("sku, ten_vt, loai_chi_tiet, mau_sac, dvt, don_gia, ton_kho, ton_toi_thieu, kho")
              .eq("loai", "Phu lieu")
              .order("sku")
              .limit(100);
            if (lightData && lightData.length > 0) {
              data = lightData;
              error = null;
            }
          }
        }

        if (error || !data || data.length === 0) {
          return;
        }

        if (!mounted) return;
        const remote = data.map((row: any) => {
          const fallback = KHO_VAT_TU.find((item) => item.maVT === row.sku);
          return {
            ...(fallback || {}),
            maVT: row.sku,
            tenVT: row.ten_vt,
            loai: row.loai_chi_tiet || fallback?.loai || "Phụ liệu",
            mauSac: row.mau_sac || "",
            dvt: row.dvt || "cái",
            donGia: Number(row.don_gia) || 0,
            tonKho: Number(row.ton_kho) || 0,
            tonToiThieu: Number(row.ton_toi_thieu) || 0,
            soCayNhap: Number(row.so_cay_nhap) || 0,
            tonCay: Number(row.ton_cay) || 0,
            tyLeHaoHut: Number(row.ty_le_hao_hut) || 0,
            kho: row.kho || "Kho phụ liệu",
            ghiChu: row.ghi_chu || "",
            hinhAnh: row.hinh_anh || readSharedImage(row.ghi_chu) || fallback?.hinhAnh,
          } satisfies KhoVai;
        });

        const cleanedRemote = cleanAndMergeInventory(remote);
        const remoteImages = Object.fromEntries(
          cleanedRemote
            .map((item) => [item.maVT, item.hinhAnh || readSharedImage(item.ghiChu)])
            .filter(([, image]) => Boolean(image))
        );
        setInventoryImages((current) => ({ ...current, ...remoteImages }));
        if (cleanedRemote.length > 0) {
          setInventory(cleanedRemote);
          localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(cleanedRemote));
        }
      } catch (err) {
        console.warn("[KhoPhuLieu] loadRemote exception:", err);
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
        setInventoryImages(prev => {
          const next = { ...prev, [uploadingVT]: url };
          localStorage.setItem(PL_IMAGES_KEY, JSON.stringify(next));
          return next;
        });
        if (isSupabaseEnabled && supabase) {
          const item = inventory.find((value) => value.maVT === uploadingVT);
          let { error } = await supabase.from("kho").update({ hinh_anh: url, updated_at: new Date().toISOString() }).eq("sku", uploadingVT);
          if (error?.code === "PGRST204" || error?.code === "42703" || error?.message?.includes("hinh_anh")) {
            const fallbackGhiChu = JSON.stringify({ note: item?.ghiChu || "", imageUrl: url });
            ({ error } = await supabase.from("kho").update({ ghi_chu: fallbackGhiChu, updated_at: new Date().toISOString() }).eq("sku", uploadingVT));
          }
          if (error) return toast.error(`Chưa lưu được ảnh lên Supabase: ${error.message}`);
        }
        toast.success("Đã tải ảnh và đồng bộ thành công!");
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploadingVT(null);
  };

  // KPIs
  const dsTrangThai = useMemo(() => {
    return inventory.map((item) => {
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
  }, [inventory, giaoDich]);

  const tongGiaTri = useMemo(() => dsTrangThai.reduce((s, t) => s + t.giaTriTon, 0), [dsTrangThai]);
  const dsCanhBao = useMemo(() => dsTrangThai.filter((t) => t.canhBao), [dsTrangThai]);
  const tongNhap = useMemo(() => {
    return giaoDich
      .filter((g) => g.loai === "NHAP" && inventory.find((v) => v.maVT === g.maVT))
      .reduce((s, g) => s + g.thanhTien, 0);
  }, [giaoDich, inventory]);

  const dsCanhBaoDetails = useMemo(() => {
    if (dsCanhBao.length === 0) return "";
    return dsCanhBao.slice(0, 5).map((t) => {
      const vt = inventory.find((v) => v.maVT === t.maVT);
      return `${vt?.tenVT || t.maVT} (còn ${t.tonKho.toLocaleString("vi-VN")})`;
    }).join(", ") + (dsCanhBao.length > 5 ? `, ... và ${dsCanhBao.length - 5} mã khác.` : ".");
  }, [dsCanhBao, inventory]);

  // Phân loại nhóm & ĐVT
  const dsLoaiCounts = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((item) => {
      const l = item.loai || "Khác";
      map[l] = (map[l] || 0) + 1;
    });
    return Object.entries(map).map(([loai, count]) => ({ loai, count }));
  }, [inventory]);

  const dsDvt = useMemo(() => {
    return Array.from(new Set(inventory.map((item) => item.dvt).filter(Boolean)));
  }, [inventory]);

  // Bộ lọc phụ liệu
  const filteredVT = useMemo(() => {
    return inventory
      .filter((v) => {
        // 1. Search text
        if (search) {
          const q = search.toLowerCase();
          const match = [v.tenVT, v.maVT, v.loai, v.mauSac, v.dvt, v.ghiChu].some((x) =>
            (x || "").toLowerCase().includes(q)
          );
          if (!match) return false;
        }

        // 2. Filter theo Loại
        if (filterLoai !== "all" && v.loai !== filterLoai) {
          return false;
        }

        // 3. Filter theo ĐVT
        if (filterDvt !== "all" && v.dvt !== filterDvt) {
          return false;
        }

        // 4. Filter theo Mức tồn kho
        if (filterTrangThai !== "all") {
          const st = dsTrangThai.find((t) => t.maVT === v.maVT);
          const ton = st ? st.tonKho : (Number(v.tonKho) || 0);

          if (filterTrangThai === "het-hang") {
            if (ton > 0) return false;
          } else if (filterTrangThai === "canh-bao") {
            if (!st?.canhBao) return false;
          } else if (filterTrangThai === "con-hang") {
            if (ton <= 0) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const stA = dsTrangThai.find((t) => t.maVT === a.maVT);
        const stB = dsTrangThai.find((t) => t.maVT === b.maVT);
        const tonA = stA ? stA.tonKho : (Number(a.tonKho) || 0);
        const tonB = stB ? stB.tonKho : (Number(b.tonKho) || 0);
        const gtA = stA ? stA.giaTriTon : (tonA * (Number(a.donGia) || 0));
        const gtB = stB ? stB.giaTriTon : (tonB * (Number(b.donGia) || 0));

        if (sortBy === "ton-desc") return tonB - tonA;
        if (sortBy === "ton-asc") return tonA - tonB;
        if (sortBy === "giatri-desc") return gtB - gtA;
        if (sortBy === "dongia-desc") return (Number(b.donGia) || 0) - (Number(a.donGia) || 0);
        if (sortBy === "ten") return a.tenVT.localeCompare(b.tenVT, "vi");
        return a.maVT.localeCompare(b.maVT, "vi");
      });
  }, [inventory, search, filterLoai, filterDvt, filterTrangThai, sortBy, dsTrangThai]);

  const { totalQtyFiltered, totalValFiltered } = useMemo(() => {
    let qty = 0;
    let val = 0;
    filteredVT.forEach((item) => {
      const st = dsTrangThai.find((t) => t.maVT === item.maVT);
      if (st) {
        qty += st.tonKho;
        val += st.giaTriTon;
      } else {
        const ton = Number(item.tonKho) || 0;
        qty += ton;
        val += ton * (Number(item.donGia) || 0);
      }
    });
    return { totalQtyFiltered: qty, totalValFiltered: val };
  }, [filteredVT, dsTrangThai]);

  const handleResetFilters = () => {
    setSearch("");
    setFilterLoai("all");
    setFilterTrangThai("all");
    setFilterDvt("all");
    setSortBy("ma");
  };

  const exportCSV = () => {
    if (inventory.length === 0) return toast.error("Chưa có phụ liệu để xuất");
    const headers = [
      "Mã phụ liệu",
      "Tên phụ liệu",
      "Loại",
      "Màu sắc / Quy cách",
      "ĐVT",
      "Tồn kho",
      "Tồn tối thiểu",
      "Đơn giá (VNĐ)",
      "Giá trị tồn (VNĐ)",
      "Trạng thái"
    ];
    const rows = inventory.map((v) => {
      const st = dsTrangThai.find((t) => t.maVT === v.maVT);
      const ton = st ? st.tonKho : (Number(v.tonKho) || 0);
      const tonMin = st ? st.tonToiThieu : (Number(v.tonToiThieu) || 0);
      const gt = st ? st.giaTriTon : (ton * (Number(v.donGia) || 0));
      const tt = ton <= 0 ? "Hết hàng" : (tonMin > 0 && ton < tonMin) ? "Sắp hết" : "Đạt chuẩn";
      return [
        `"${v.maVT}"`,
        `"${v.tenVT.replace(/"/g, '""')}"`,
        `"${v.loai || ""}"`,
        `"${v.mauSac || ""}"`,
        `"${v.dvt}"`,
        ton,
        tonMin,
        v.donGia || 0,
        gt,
        `"${tt}"`,
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kho-phu-lieu-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Đã xuất danh sách phụ liệu ra file CSV!");
  };

  const handleQuickNhap = () => {
    if (selectedNhapMaVT) {
      setShowNhap(selectedNhapMaVT);
    } else {
      toast.error("Vui lòng chọn phụ liệu cần nhập từ danh sách");
    }
  };

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
    try {
      setInventory((prev) => {
        const newInventory = prev.map((item) => (item.maVT === v.maVT ? updated : item));
        localStorage.setItem(PL_INVENTORY_KEY, JSON.stringify(newInventory));
        return newInventory;
      });
    } catch {}

    if (isSupabaseEnabled && supabase) {
      const payload = {
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
      };

      let { error } = await supabase.from("kho").update(payload).eq("sku", v.maVT);
      if (error?.code === "PGRST204" || error?.code === "42703" || error?.message?.includes("hinh_anh")) {
        const fallbackPayload = { ...payload, hinh_anh: undefined, ghi_chu: JSON.stringify({ note: updated.ghiChu || "", imageUrl: payload.hinh_anh || "" }) };
        ({ error } = await supabase.from("kho").update(fallbackPayload).eq("sku", v.maVT));
      }

      if (error) {
        toast.error("Lỗi đồng bộ Supabase: " + error.message);
        return;
      }
      toast.success("✅ Đã lưu thông tin phụ liệu lên hệ thống!");
    } else {
      toast.success("Đã lưu thông tin phụ liệu thành công!");
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
      if (error?.code === "PGRST204" || error?.code === "42703" || error?.message?.includes("hinh_anh")) {
        const fallbackPayload = { ...payload, hinh_anh: undefined, ghi_chu: JSON.stringify({ note: newItem.ghiChu || "", imageUrl: newItem.hinhAnh || "" }) };
        ({ error } = await supabase.from("kho").insert(fallbackPayload));
      }
      if (error) throw new Error(error.message);
    }
    setInventory((prev) => [...prev, newItem].sort((a, b) => a.maVT.localeCompare(b.maVT)));
    setSelectedNhapMaVT(newItem.maVT);
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden animate-fade-in">
      <div className="w-full max-w-[1800px] mx-auto px-2 sm:px-4 md:px-6 space-y-4">
        {/* Header Banner cao cấp & Thống kê KPI */}
        <Header
          inventoryCount={inventory.length}
          tongGiaTri={tongGiaTri}
          dsCanhBao={dsCanhBao}
          dsCanhBaoDetails={dsCanhBaoDetails}
          tongNhap={tongNhap}
          onAdd={() => setShowAdd(true)}
          onExportCSV={exportCSV}
          onSyncBo={dongBoBoTuKhoVai}
          isSyncingBo={isSyncingBo}
          tab={tab}
          setTab={setTab}
        />

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        {tab === "tongquan" && (
          <>
            {/* Toolbar & Bộ lọc đa năng */}
            <FilterBar
              search={search}
              setSearch={setSearch}
              filterLoai={filterLoai}
              setFilterLoai={setFilterLoai}
              dsLoaiCounts={dsLoaiCounts}
              filterTrangThai={filterTrangThai}
              setFilterTrangThai={setFilterTrangThai}
              filterDvt={filterDvt}
              setFilterDvt={setFilterDvt}
              dsDvt={dsDvt}
              sortBy={sortBy}
              setSortBy={setSortBy}
              selectedNhapMaVT={selectedNhapMaVT}
              setSelectedNhapMaVT={setSelectedNhapMaVT}
              onQuickNhap={handleQuickNhap}
              inventory={inventory}
              filteredCount={filteredVT.length}
              totalCount={inventory.length}
              totalQtyFiltered={totalQtyFiltered}
              totalValFiltered={totalValFiltered}
              viewMode={viewMode}
              setViewMode={handleSetViewMode}
              onResetFilters={handleResetFilters}
            />

            {/* Nội dung danh sách: Dạng Danh Sách vs Dạng Thẻ */}
            {viewMode === "card" ? (
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
                onShowHistory={setShowHistory}
              />
            ) : (
              <InventoryTable
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
                onShowHistory={setShowHistory}
              />
            )}
          </>
        )}

        {(tab === "nhap" || tab === "xuat" || tab === "lichsu") && (
          <div className="space-y-4">
            <div className="card p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                <input
                  className="input pl-9 w-full"
                  placeholder="Tìm giao dịch theo mã, tên, người thực hiện..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <TransactionTable filteredGD={filteredGD} />
          </div>
        )}

        {showNhap && (
          <PLNhapKho
            maVT={showNhap}
            vatTu={inventory.find((item) => item.maVT === showNhap)}
            loai="phu-lieu"
            simple
            onClose={() => setShowNhap(null)}
            onImageSaved={(maVT, imageUrl) => setInventoryImages((prev) => ({ ...prev, [maVT]: imageUrl }))}
          />
        )}
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

