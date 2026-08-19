"use client";

import { createContext, useContext, useCallback, ReactNode } from "react";
import { type PhanCongCongDoan, type CongDoanKey, type NguoiPhuTrach } from "./cong-no";
import { layDanhSachNguoiPT } from "./cong-no";
import { useSupabaseSync, camelToSnake } from "@/lib/supabase/client";

// Bảng phan_cong trên Supabase có 4 cột phẳng `nguoi_ma` (NOT NULL), `nguoi_ten`,
// `nguoi_loai`, `nguoi_sdt` nằm ngoài model app (app chỉ có object `nguoiPhuTrach`).
// camelToSnake không tự sinh được các cột này (nó lồng thành object `nguoi_phu_trach`)
// -> mọi upsert đều fail NOT NULL và chỉ báo ở console. Rút thẳng từ nguoiPhuTrach khi
// ghi lên. `nguoi_loai` bắt buộc phải có để FK điều kiện phân biệt "Nhân viên nội bộ"
// (khớp nhan_su) với "Đối tác gia công" (khớp nha_cung_cap) - thiếu cột này thì mọi
// dòng "Đối tác gia công" đều bị FK từ chối vì bị kiểm tra nhầm với bảng nhan_su.
function phanCongToRow(pc: PhanCongCongDoan) {
  return {
    ...camelToSnake(pc),
    id: pc.id,
    nguoi_ma: pc.nguoiPhuTrach?.ma || "",
    nguoi_ten: pc.nguoiPhuTrach?.ten || "",
    nguoi_loai: pc.nguoiPhuTrach?.loai || "",
    nguoi_sdt: pc.nguoiPhuTrach?.sdt || "",
  };
}

// ============ STORE CONTEXT ============
type StoreContext = {
  phanCong: PhanCongCongDoan[];
  themThanhToan: (id: string, soTien: number, ghiChu?: string) => void;
  themPhanCong: (pc: Omit<PhanCongCongDoan, "id">) => void;
  capNhatPhanCong: (id: string, patch: Partial<PhanCongCongDoan>) => void;
  xoaPhanCong: (id: string) => void;
  upsertTuLenhCat: (params: {
    lenhCatId: string;
    congDoan: string;
    nguoiMa: string;
    nguoiTen: string;
    donGia: number;
    soLuongGiao: number;
    ngayGiao?: string;
    daThanhToan?: number;
  }) => void;
  reset: () => void;
  layTheoLenh: (lenhCatId: string) => PhanCongCongDoan[];
  isLate: (pc: PhanCongCongDoan) => boolean;
};

const Ctx = createContext<StoreContext | null>(null);

const STORAGE_KEY = "mimin_phan_cong_v2";

export function PhanCongProvider({ children }: { children: ReactNode }) {
  const { data: phanCong, setData: setPhanCong } = useSupabaseSync<PhanCongCongDoan>(
    STORAGE_KEY,
    "phan_cong",
    [],
    { mapOut: phanCongToRow }
  );

  // KHÔNG auto-seed dữ liệu mẫu nữa. Dữ liệu thật phải do người dùng nhập
  // hoặc import có chủ đích, không để code tự seed lên Supabase.


  const themThanhToan = useCallback((id: string, soTien: number, ghiChu?: string) => {
    setPhanCong((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newDaTT = p.daThanhToan + soTien;
        const thanhTien = p.donGiaGiao * p.soLuongGiao;
        const newTrangThai = newDaTT >= thanhTien ? "Đã thanh toán" : p.trangThai;
        return {
          ...p,
          daThanhToan: newDaTT,
          trangThai: newTrangThai,
          ghiChu: ghiChu ? `${p.ghiChu ? p.ghiChu + " | " : ""}${new Date().toLocaleDateString("vi-VN")}: +${soTien.toLocaleString()}đ ${ghiChu}` : p.ghiChu,
        };
      })
    );
  }, [setPhanCong]);

  const themPhanCong = useCallback((pc: Omit<PhanCongCongDoan, "id">) => {
    setPhanCong((prev) => {
      const nextNum = prev.length + 1;
      const newId = `PC-${pc.lenhCatId.replace("LC-", "")}-${String(nextNum).padStart(2, "0")}`;
      return [...prev, { ...pc, id: newId }];
    });
  }, [setPhanCong]);

  const capNhatPhanCong = useCallback((id: string, patch: Partial<PhanCongCongDoan>) => {
    setPhanCong((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, [setPhanCong]);

  const xoaPhanCong = useCallback((id: string) => {
    setPhanCong((prev) => prev.filter((p) => p.id !== id));
  }, [setPhanCong]);

  /**
   * Tạo/cập nhật 1 dòng công nợ công đoạn khi 1 công đoạn trong Lệnh cắt được
   * đánh dấu hoàn thành. Trước đây lenh-cat-store ghi thẳng vào
   * localStorage["mimin_phan_cong_v2"] bằng JSON.parse/stringify, không qua
   * setPhanCong (=useSupabaseSync) nên KHÔNG lên Supabase - lần useSupabaseSync
   * tải lại từ Supabase (nguồn sự thật) sẽ ghi đè mất dòng vừa tạo. Dùng
   * setPhanCong ở đây để đẩy đúng lên Supabase và tìm bản ghi trùng trên state
   * mới nhất (tránh đọc closure cũ).
   */
  const upsertTuLenhCat = useCallback((params: {
    lenhCatId: string;
    congDoan: string;
    nguoiMa: string;
    nguoiTen: string;
    donGia: number;
    soLuongGiao: number;
    ngayGiao?: string;
    daThanhToan?: number;
  }) => {
    setPhanCong((prev) => {
      const idx = prev.findIndex(
        (c) => c.lenhCatId === params.lenhCatId &&
          (c.congDoan === params.congDoan || c.nguoiPhuTrach?.ma === params.nguoiMa)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], trangThai: "Hoàn thành", soLuongGiao: params.soLuongGiao };
        return next;
      }
      const nextNum = prev.length + 1;
      const newId = `PC-${params.lenhCatId.replace("LC-", "")}-${String(nextNum).padStart(2, "0")}`;
      const newPc: PhanCongCongDoan = {
        id: newId,
        lenhCatId: params.lenhCatId,
        congDoan: params.congDoan || "Gia công",
        nguoiPhuTrach: {
          loai: params.nguoiMa.startsWith("GC") ? "Đối tác gia công" : "Nhân viên nội bộ",
          ma: params.nguoiMa,
          ten: params.nguoiTen || "Chưa rõ",
        },
        donGiaGiao: params.donGia || 0,
        soLuongGiao: params.soLuongGiao,
        donVi: "SP",
        ngayGiao: params.ngayGiao || new Date().toISOString().slice(0, 10),
        ngayXongDuKien: new Date().toISOString().slice(0, 10),
        trangThai: "Hoàn thành",
        daThanhToan: params.daThanhToan || 0,
        ghiChu: "Tự động đồng bộ từ Lệnh cắt",
      };
      return [...prev, newPc];
    });
  }, [setPhanCong]);

  const reset = useCallback(() => {
    setPhanCong([]);
  }, [setPhanCong]);

  const layTheoLenh = useCallback(
    (lenhCatId: string) => phanCong.filter((p) => p.lenhCatId === lenhCatId),
    [phanCong]
  );

  const isLate = useCallback((pc: PhanCongCongDoan) => {
    if (pc.trangThai === "Đã thanh toán" || pc.trangThai === "Hoàn thành") return false;
    const today = new Date().toISOString().split("T")[0];
    return pc.ngayXongDuKien < today;
  }, []);

  return (
    <Ctx.Provider
      value={{ phanCong, themThanhToan, themPhanCong, capNhatPhanCong, xoaPhanCong, upsertTuLenhCat, reset, layTheoLenh, isLate }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePhanCong() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePhanCong must be used within PhanCongProvider");
  return ctx;
}

// ============ EXPORT EXCEL HELPER ============
// Tạo file Excel từ array of objects, dùng CSV với BOM để Excel mở đúng UTF-8
export function exportCongNoExcel(phanCong: PhanCongCongDoan[], tenFile: string = "CongNoCongDoan") {
  const header = [
    "Mã PC",
    "Lệnh cắt",
    "Công đoạn",
    "Người PT",
    "Loại",
    "SĐT",
    "Số lượng",
    "Đơn vị",
    "Đơn giá",
    "Thành tiền",
    "Đã TT",
    "Còn nợ",
    "Trạng thái",
    "Ngày giao",
    "Ngày xong DK",
    "Ghi chú",
  ];
  const rows = phanCong.map((p) => {
    const tt = p.donGiaGiao * p.soLuongGiao;
    return [
      p.id,
      p.lenhCatId,
      p.congDoan,
      p.nguoiPhuTrach.ten,
      p.nguoiPhuTrach.loai,
      p.nguoiPhuTrach.sdt || "",
      p.soLuongGiao,
      p.donVi,
      p.donGiaGiao,
      tt,
      p.daThanhToan,
      tt - p.daThanhToan,
      p.trangThai,
      p.ngayGiao,
      p.ngayXongDuKien,
      p.ghiChu || "",
    ];
  });
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  // BOM để Excel nhận UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tenFile}_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Re-export cho tiện
export { layDanhSachNguoiPT };
export type { PhanCongCongDoan, CongDoanKey, NguoiPhuTrach };
