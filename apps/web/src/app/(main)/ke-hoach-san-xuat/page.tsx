"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/components/session-provider";
import { useKHSX, type KHSX, type TrangThaiKHSX } from "@/lib/data/khsx-store";
import { useLenhCat, generateLenhCatId, type LoaiSP } from "@/lib/data/lenh-cat-store";
import { useDanhMucSP } from "@/lib/data/danh-muc-sp-store";
import ImageLightbox from "@/components/ui/ImageLightbox";
import type { ViewMode } from "@/components/DataViewToggle";

import { KeHoachSXHeader } from "./components/KeHoachSXHeader";
import { KeHoachSXFilterBar } from "./components/KeHoachSXFilterBar";
import { KeHoachSXTableView } from "./components/KeHoachSXTableView";
import { KeHoachSXCardView } from "./components/KeHoachSXCardView";
import { KeHoachSXModal } from "./components/KeHoachSXModal";
import { KeHoachSXTongHopView } from "./components/KeHoachSXTongHopView";

export default function KeHoachSXPage() {
  const router = useRouter();
  const { user } = useSession();
  const { khsx, themKHSX, suaKHSX, xoaKHSX } = useKHSX();
  const { dsLenhCat, themLenhCat } = useLenhCat();
  const { dsSanPham } = useDanhMucSP();

  // Tab chính: Kế hoạch sản xuất ("khsx") HOẶC Kế Hoạch SX Tổng Hợp ("tong_hop")
  const [mainTab, setMainTab] = useState<"khsx" | "tong_hop">("khsx");

  // Chế độ xem: Mặc định Dạng Danh Sách (list)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // State Bộ Lọc & Tìm Kiếm
  const [filterTrangThai, setFilterTrangThai] = useState<TrangThaiKHSX | "Tất cả">("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoaiSP, setSelectedLoaiSP] = useState("ALL");
  const [selectedXuong, setSelectedXuong] = useState("ALL");
  const [sortBy, setSortBy] = useState("id_desc");

  // State Modal & Lightbox
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<KHSX | null>(null);
  const [activeEditors, setActiveEditors] = useState<Record<string, string[]>>({});
  const [zoomImg, setZoomImg] = useState<{ url: string; alt?: string; badge?: string } | null>(null);

  // Tự động đồng bộ hình ảnh từ Lệnh Cắt sang KHSX (khi có bổ sung ảnh ở Lệnh Cắt)
  useEffect(() => {
    if (!khsx || khsx.length === 0 || !dsLenhCat || dsLenhCat.length === 0) return;
    khsx.forEach((kItem) => {
      const matched = dsLenhCat.find(
        (lc: any) =>
          (kItem.lenhCatId && lc.id === kItem.lenhCatId) ||
          (kItem.maSP && (lc.maSP === kItem.maSP || lc.id.endsWith(kItem.maSP)))
      );
      if (matched?.dsMau && matched.dsMau.length > 0) {
        const lcImg = matched.dsMau[0]?.img;
        const khsxImg = kItem.dsMau?.[0]?.img;
        if (lcImg && lcImg !== khsxImg) {
          suaKHSX(kItem.id, { dsMau: matched.dsMau }, null);
        }
      }
    });
  }, [khsx, dsLenhCat, suaKHSX]);

  // Lắng nghe người đang chỉnh sửa real-time qua Supabase Channel
  useEffect(() => {
    let channel: any = null;
    let sb: any = null;

    import("@/lib/supabase/client").then(({ supabase }) => {
      if (!supabase) return;
      sb = supabase;
      channel = supabase.channel("global_lenh_cat_presence", {
        config: { presence: { key: "watcher-" + Math.random() } },
      });
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const newMap: Record<string, string[]> = {};
          for (const key in state) {
            const presences = state[key] as any[];
            for (const p of presences) {
              if (p.editingId && p.name) {
                if (!newMap[p.editingId]) newMap[p.editingId] = [];
                if (!newMap[p.editingId].includes(p.name)) {
                  newMap[p.editingId].push(p.name);
                }
              }
            }
          }
          setActiveEditors(newMap);
        })
        .subscribe();
    });

    return () => {
      if (sb && channel) {
        sb.removeChannel(channel);
      }
    };
  }, []);

  // Tự động trigger "Tạo Lệnh Cắt" nếu chuyển trang từ Danh mục SP với "Đặt Sản Xuất"
  useEffect(() => {
    if (khsx.length > 0) {
      const autoId = localStorage.getItem("mimin_auto_tao_lenh_cat_khsx_id");
      if (autoId) {
        const item = khsx.find((x) => x.id === autoId);
        if (item && !item.lenhCatId) {
          localStorage.removeItem("mimin_auto_tao_lenh_cat_khsx_id");
          setTimeout(() => {
            taoLenhCat(item);
          }, 300);
        }
      }
    }
  }, [khsx]);

  // Thu thập danh sách Loại SP độc nhất
  const danhSachLoaiSP = useMemo(() => {
    const set = new Set<string>();
    khsx.forEach((item) => {
      if (item.loai) set.add(item.loai);
      if (item.loaiSP) set.add(item.loaiSP);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [khsx]);

  // Thu thập danh sách Xưởng độc nhất
  const danhSachXuong = useMemo(() => {
    const set = new Set<string>();
    khsx.forEach((item) => {
      if (item.xuongPhuTrach) set.add(item.xuongPhuTrach.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
  }, [khsx]);

  // Bộ đếm số lượng cho từng Tab Trạng thái
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      "Lên kế hoạch": 0,
      "Đang SX": 0,
      "Hoàn thành": 0,
      "Trễ hạn": 0,
    };
    khsx.forEach((item) => {
      if (map[item.trangThai] !== undefined) {
        map[item.trangThai]++;
      }
    });
    return map;
  }, [khsx]);

  // Lọc và Sắp xếp danh sách KHSX
  const filteredKHSX = useMemo(() => {
    let result = khsx.filter((item) => {
      // 1. Lọc theo Tab trạng thái
      if (filterTrangThai !== "Tất cả" && item.trangThai !== filterTrangThai) return false;

      // 2. Lọc theo từ khóa tìm kiếm (Mã KHSX, Mã SP, Tên SP, Lệnh cắt, Tên màu, Xưởng)
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchKHSX = (item.maKHSX || item.id || "").toLowerCase().includes(q);
        const matchMaSP = (item.maSP || "").toLowerCase().includes(q);
        const matchTenSP = (item.sanPham || item.tenSP || "").toLowerCase().includes(q);
        const matchLC = (item.lenhCatId || "").toLowerCase().includes(q);
        const matchXuong = (item.xuongPhuTrach || "").toLowerCase().includes(q);
        const matchMau = (item.dsMau || []).some(
          (m) => (m.ten || "").toLowerCase().includes(q) || (m.maSKU || "").toLowerCase().includes(q)
        );

        if (!matchKHSX && !matchMaSP && !matchTenSP && !matchLC && !matchXuong && !matchMau) {
          return false;
        }
      }

      // 3. Lọc theo Loại SP
      if (selectedLoaiSP !== "ALL") {
        if (item.loai !== selectedLoaiSP && item.loaiSP !== selectedLoaiSP) return false;
      }

      // 4. Lọc theo Xưởng phụ trách
      if (selectedXuong !== "ALL") {
        if (!item.xuongPhuTrach || !item.xuongPhuTrach.includes(selectedXuong)) return false;
      }

      return true;
    });

    // 5. Sắp xếp
    result = [...result].sort((a, b) => {
      if (sortBy === "id_desc") {
        return (b.maKHSX || b.id).localeCompare(a.maKHSX || a.id, undefined, { numeric: true });
      }
      if (sortBy === "id_asc") {
        return (a.maKHSX || a.id).localeCompare(b.maKHSX || b.id, undefined, { numeric: true });
      }
      if (sortBy === "deadline_asc") {
        return (a.denNgay || "").localeCompare(b.denNgay || "");
      }
      if (sortBy === "qty_desc") {
        return (b.soLuong || 0) - (a.soLuong || 0);
      }
      if (sortBy === "qty_asc") {
        return (a.soLuong || 0) - (b.soLuong || 0);
      }
      return 0;
    });

    return result;
  }, [khsx, filterTrangThai, searchTerm, selectedLoaiSP, selectedXuong, sortBy]);

  const hasActiveFilters =
    filterTrangThai !== "Tất cả" || searchTerm.trim() !== "" || selectedLoaiSP !== "ALL" || selectedXuong !== "ALL";

  const handleResetFilters = () => {
    setFilterTrangThai("Tất cả");
    setSearchTerm("");
    setSelectedLoaiSP("ALL");
    setSelectedXuong("ALL");
    setSortBy("id_desc");
  };

  // Logic Tạo Lệnh Cắt từ KHSX
  const taoLenhCat = async (item: KHSX) => {
    try {
      const newId = generateLenhCatId(dsLenhCat);
      const { supabase } = await import("@/lib/supabase/client");

      if (supabase) {
        // Fast-fail check
        const { data: checkData } = await supabase.from("khsx").select("lenhCatId").eq("id", item.id).single();
        const existingLenhCatId = checkData ? checkData.lenhCatId : null;
        if (existingLenhCatId) {
          toast.error(`Kế hoạch này đã được tạo Lệnh Cắt (${existingLenhCatId}) bởi người khác!`);
          suaKHSX(item.id, { lenhCatId: existingLenhCatId }, null);
          return;
        }
      }

      const now = new Date().toISOString().slice(0, 10);

      let sp: any = null;
      if (item.maSP || item.sanPham || item.tenSP) {
        try {
          const spRaw = localStorage.getItem("mimin_danh_muc_v2") || localStorage.getItem("mimin_danh_muc_sp");
          if (spRaw) {
            const spList = JSON.parse(spRaw);
            sp = spList.find(
              (s: any) =>
                (item.maSP && (s.id === item.maSP || s.ma_sp === item.maSP)) ||
                ((item.tenSP || item.sanPham) && s.tenSP === (item.tenSP || item.sanPham))
            );
          }
        } catch (e) {}
      }

      const newLenhCat = {
        id: newId,
        loaiLenh: "HangNha" as const,
        loaiSP: (function () {
          let val = item.loaiSP;
          if (sp && sp.loaiSP) val = sp.loaiSP;

          if (!val || val === "BoTru") {
            const checkStr = (item.sanPham || item.tenSP || "").toLowerCase();
            if (checkStr.includes("áo polo") || checkStr.includes("ao polo")) val = "AoPolo";
            else if (checkStr.includes("áo trụ") || checkStr.includes("ao tru") || checkStr.includes("cổ trụ") || checkStr.includes("co tru")) val = "AoTru";
            else if (checkStr.includes("áo tròn") || checkStr.includes("áo cổ tròn") || checkStr.includes("cổ tròn") || checkStr.includes("co tron")) val = "AoCoTron";
            else if (checkStr.includes("bộ tròn") || checkStr.includes("bộ cổ tròn") || checkStr.includes("bo tron") || checkStr.includes("bo co tron")) val = "BoCoTron";
            else if (checkStr.includes("phụ kiện") || checkStr.includes("quần") || checkStr.includes("quan")) val = "PhuKien";
            else if (checkStr.includes("áo thun") || checkStr.includes("áo") || checkStr.includes("ao")) val = "AoCoTron";
          }
          return (["AoTru", "AoCoTron", "BoTru", "BoCoTron", "AoPolo", "PhuKien"].includes(val as string)
            ? val
            : "BoTru") as LoaiSP;
        })(),
        maSP: item.maSP || sp?.id || "",
        tenSP: item.tenSP || item.sanPham || sp?.tenSP || "",
        tongSL: item.soLuong,
        hanHoanThanh: item.denNgay,
        tiLeSize: item.tiLeSize || sp?.tiLeSize || "1:2:2:1",
        dsMau: (item.dsMau || []).map((mau) => {
          let mergedImg = mau.img;
          let mergedImgQuan = (mau as any).imgQuan;
          if (!mergedImg && sp && sp.dsMau) {
            const spMau = sp.dsMau.find((sm: any) => sm.ten === mau.ten || sm.maSKU === mau.maSKU);
            if (spMau) {
              mergedImg = spMau.img || "";
              mergedImgQuan = spMau.imgQuan || "";
            }
          }
          return {
            ...mau,
            img: mergedImg || "",
            imgQuan: mergedImgQuan || "",
          };
        }),
        dsPhuLieu: sp?.dsPhuLieu || [],
        phanCong: sp?.phanCong || [],
        chiPhiCoDinh: sp?.chiPhiCoDinh || {},
        phuTrachCat: "NV006",
        ghiChu: `Tạo từ kế hoạch ${item.maKHSX} bởi ${user?.name || "Người dùng"} lúc ${new Date().toLocaleTimeString(
          "vi-VN",
          { hour: "2-digit", minute: "2-digit" }
        )} ngày ${new Date().toLocaleDateString("vi-VN")}`,
        trangThai: "Nhap" as const,
        phienBanDinhMuc: 1,
        ngayTao: now,
      };

      await themLenhCat(newLenhCat, user as any);

      if (supabase) {
        const { data: updateData } = await supabase
          .from("khsx")
          .update({ lenhCatId: newId })
          .eq("id", item.id)
          .or('lenhCatId.is.null,lenhCatId.eq.""')
          .select();

        if (!updateData || updateData.length === 0) {
          await supabase.from("lenh_cat").delete().eq("id", newId);
          const { data: checkData } = await supabase.from("khsx").select("lenhCatId").eq("id", item.id).single();
          const existingLenhCatId = checkData && checkData.lenhCatId !== "" ? checkData.lenhCatId : null;

          toast.error(`Trùng lặp: Kế hoạch này vừa được tạo Lệnh Cắt (${existingLenhCatId || "khác"}) cùng lúc!`);
          if (existingLenhCatId) {
            suaKHSX(item.id, { lenhCatId: existingLenhCatId }, null);
          }
          return;
        }
      }

      suaKHSX(item.id, { lenhCatId: newId }, user as any);
      toast.success(`Đã chuyển ${item.maSP || item.sanPham} thành Lệnh cắt ${newId}`);
      localStorage.setItem("mimin_edit_lenh_cat_id", newId);
      router.push("/lenh-cat");
    } catch (err: any) {
      if (err.message && err.message.includes("đã tồn tại")) {
        const { supabase } = await import("@/lib/supabase/client");
        if (supabase) {
          const { data: checkData } = await supabase.from("khsx").select("lenhCatId").eq("id", item.id).single();
          if (checkData && checkData.lenhCatId) {
            toast.error(`Trùng lặp: Kế hoạch này vừa được tạo Lệnh Cắt (${checkData.lenhCatId}) bởi người khác!`);
            suaKHSX(item.id, { lenhCatId: checkData.lenhCatId }, null);
            return;
          }
        }
      }
      toast.error(err.message || "Lỗi tạo lệnh cắt");
    }
  };

  const handleViewLenhCat = (lenhCatId: string) => {
    localStorage.setItem("mimin_edit_lenh_cat_id", lenhCatId);
    router.push("/lenh-cat");
  };

  const handleDelete = (item: KHSX) => {
    if (confirm(`Anh có chắc chắn muốn xóa kế hoạch sản xuất ${item.maKHSX} (${item.sanPham})?`)) {
      xoaKHSX(item.id, user);
      toast.success(`Đã xóa kế hoạch sản xuất ${item.maKHSX}`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in w-full max-w-full overflow-x-hidden">
      {/* 1. HEADER & KPI CARDS & TAB CHUYỂN ĐỔI TỔNG HỢP */}
      <KeHoachSXHeader
        khsx={khsx}
        activeTab={mainTab}
        onChangeTab={setMainTab}
        soLenhCanDieuPhoi={dsLenhCat.filter((lc) => lc.trangThai !== "HoanThanh").length}
        onOpenCreate={() => {
          setEditing(null);
          setShowForm(true);
        }}
      />

      {/* 2. HIỂN THỊ NỘI DUNG THEO TAB */}
      {mainTab === "tong_hop" ? (
        /* GIAO DIỆN KẾ HOẠCH SX TỔNG HỢP: ĐIỀU PHỐI VẢI, BO, XƯỞNG, TIẾN ĐỘ TỪNG LỆNH CẮT */
        <KeHoachSXTongHopView
          dsLenhCat={dsLenhCat}
          onZoomImg={(url) => setZoomImg({ url })}
          onViewLenhCat={handleViewLenhCat}
        />
      ) : (
        /* GIAO DIỆN KẾ HOẠCH SẢN XUẤT TRUYỀN THỐNG */
        <>
          {/* THANH TÌM KIẾM, BỘ LỌC ĐA NĂNG & ĐIỀU HƯỚNG VIEW (DANH SÁCH / THẺ) */}
          <KeHoachSXFilterBar
            filterTrangThai={filterTrangThai}
            setFilterTrangThai={setFilterTrangThai}
            totalCount={khsx.length}
            filteredCount={filteredKHSX.length}
            counts={counts}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLoaiSP={selectedLoaiSP}
            setSelectedLoaiSP={setSelectedLoaiSP}
            danhSachLoaiSP={danhSachLoaiSP}
            selectedXuong={selectedXuong}
            setSelectedXuong={setSelectedXuong}
            danhSachXuong={danhSachXuong}
            sortBy={sortBy}
            setSortBy={setSortBy}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* NỘI DUNG DANH SÁCH HOẶC THẺ */}
          {viewMode === "list" || viewMode === "table" ? (
            <KeHoachSXTableView
              list={filteredKHSX}
              dsLenhCat={dsLenhCat}
              dsSanPham={dsSanPham}
              activeEditors={activeEditors}
              onEdit={(item) => {
                setEditing(item);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onViewLenhCat={handleViewLenhCat}
              onTaoLenhCat={taoLenhCat}
              onZoomImg={(url, alt, badge) => setZoomImg({ url, alt, badge })}
            />
          ) : (
            <KeHoachSXCardView
              list={filteredKHSX}
              dsLenhCat={dsLenhCat}
              dsSanPham={dsSanPham}
              activeEditors={activeEditors}
              onEdit={(item) => {
                setEditing(item);
                setShowForm(true);
              }}
              onDelete={handleDelete}
              onViewLenhCat={handleViewLenhCat}
              onTaoLenhCat={taoLenhCat}
              onZoomImg={(url, alt, badge) => setZoomImg({ url, alt, badge })}
            />
          )}
        </>
      )}

      {/* 5. MODAL TẠO / SỬA KHSX (GIAO DIỆN CHUYÊN NGHIỆP, LOGIC CHÍNH XÁC) */}
      <KeHoachSXModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        editing={editing}
        khsxList={khsx}
        dsSanPham={dsSanPham}
        dsLenhCat={dsLenhCat}
        onSave={async (patch) => {
          if (editing) {
            suaKHSX(editing.id, patch as any, user);
            toast.success(`Đã cập nhật kế hoạch sản xuất ${patch.maKHSX || editing.maKHSX}`);
          } else {
            themKHSX(patch as any, user);
            toast.success(`Đã tạo kế hoạch sản xuất ${patch.maKHSX}`);
          }
          setShowForm(false);
          setEditing(null);
        }}
      />

      {/* 6. MODAL PHÓNG TO ẢNH FULL MÀN HÌNH CÓ CON DẤU MÃ SP */}
      {zoomImg && (
        <ImageLightbox
          src={zoomImg.url}
          alt={zoomImg.alt}
          badge={zoomImg.badge}
          onClose={() => setZoomImg(null)}
        />
      )}
    </div>
  );
}
