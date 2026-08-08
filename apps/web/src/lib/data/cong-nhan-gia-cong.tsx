
// ============ CONG NHAN GIA CONG STORE ============
// Quan ly cong nhan / xuong gia cong du phong (27 nguoi)
// Luu localStorage `mimin_cong_nhan_gia_cong` + sync Supabase (camelCase)
// CRUD: themCongNhan, suaCongNhan, xoaCongNhan
// Phan biet voi DoiTacGiaCong (20 NCC chinh thuc, on dinh)
// 2026-08-04: Khoi tao tu file Excel "gia cong du phong.xlsx"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseUpsert, supabaseDelete, supabaseFetchAll, isSupabaseEnabled } from "@/lib/supabase/client";
import { logWorkflow } from "../audit-log";
import type { AppUser } from "@/components/session-provider";

// ============ TYPES ============
export type LoaiHang =
  | "cổ tròn"        // cổ tròn, áo tròn, thun cổ tròn
  | "cổ trụ"         // cổ trụ, áo trụ, trụ
  | "polo"           // polo, cổ polo, trụ polo
  | "thun"           // thun, áo thun
  | "sơ mi"
  | "áo khoác"
  | "móc xích"       // móc xích, cổ tròn móc xích
  | "váy"            // skirt
  | "đa dạng";       // nhận nhiều loại

export type TrangThaiCongNhan = "san_sang" | "tam_ngung" | "het_viec";

export type CongNhanGiaCong = {
  id: string;              // CNGC-001 → CNGC-027
  stt: number;             // 1-27
  hoTen: string;           // Tên công nhân / xưởng
  sdt: string;             // SĐT liên hệ (10 số)
  loaiHang: LoaiHang;      // Chuyên môn chính
  soTho: number;           // Số lượng thợ
  diaChi?: string;
  ghiChu?: string;
  trangThai: TrangThaiCongNhan;
  facebookUrl?: string;    // Link Facebook (https://facebook.com/...)
  nguoiTao?: string;
  ngayTao?: string;
};

// ============ CONSTANTS ============
export const LOAI_HANG_LABELS: Record<LoaiHang, string> = {
  "cổ tròn": "👕 Cổ tròn",
  "cổ trụ": "👔 Cổ trụ",
  "polo": "👗 Polo",
  "thun": "👚 Thun",
  "sơ mi": "👔 Sơ mi",
  "áo khoác": "🧥 Áo khoác",
  "móc xích": "🔗 Móc xích",
  "váy": "👗 Váy",
  "đa dạng": "🎨 Đa dạng",
};

export const TRANG_THAI_CNGC_LABELS: Record<TrangThaiCongNhan, string> = {
  "san_sang": "Sẵn sàng",
  "tam_ngung": "Tạm ngưng",
  "het_viec": "Hết việc",
};

export const TRANG_THAI_CNGC_STYLE: Record<TrangThaiCongNhan, { bg: string; color: string; emoji: string }> = {
  "san_sang": { bg: "bg-emerald-500/15", color: "text-emerald-700", emoji: "✅" },
  "tam_ngung": { bg: "bg-amber-500/15", color: "text-amber-700", emoji: "⏸️" },
  "het_viec": { bg: "bg-slate-500/15", color: "text-slate-700", emoji: "🚫" },
};

// Helper: Chuan hoa loai hang tu text tho
export function chuanHoaLoaiHang(text: string): LoaiHang {
  const t = text.toLowerCase().trim();
  // Đa dạng / nhiều loại
  if (t.includes(",") || t.includes("đa dạng") || t.includes("áo khoác")) return "đa dạng";
  // Móc xích
  if (t.includes("móc xích") || t.includes("moc xich")) return "móc xích";
  // Cổ tròn
  if (t.includes("cổ tròn") || t.includes("co tron") || t === "tròn" || t === "áo tròn" || t === "thun cổ tròn") return "cổ tròn";
  // Cổ trụ
  if (t.includes("cổ trụ") || t.includes("co tru") || t === "trụ" || t === "áo trụ") return "cổ trụ";
  // Polo
  if (t.includes("polo")) return "polo";
  // Sơ mi
  if (t.includes("sơ mi") || t.includes("so mi")) return "sơ mi";
  // Váy
  if (t.includes("váy") || t.includes("vay") || t.includes("skirt")) return "váy";
  // Áo khoác
  if (t.includes("áo khoác") || t.includes("ao khoac") || t.includes("khoác")) return "áo khoác";
  // Thun
  if (t.includes("thun") || t.includes("áo thun")) return "thun";
  return "đa dạng";
}

// Helper: Format SĐT (them 0 neu thieu)
export function formatSDT(sdt: string | number): string {
  const s = String(sdt).replace(/\D/g, "");
  if (s.length === 9) return "0" + s;
  if (s.length === 10 && s.startsWith("0")) return s;
  return s;
}

const STORAGE_KEY = "mimin_cong_nhan_gia_cong_v1";

// ============ 27 CONG NHAN GIA CONG MAC DINH (tu Excel 2026-08-04) ============
const DEFAULT_CNGC: Omit<CongNhanGiaCong, "nguoiTao" | "ngayTao">[] = [
  { id: "CNGC-001", stt: 1, hoTen: "Trần Liên", sdt: "0333270997", loaiHang: "đa dạng", soTho: 22, diaChi: "Bình Phước (giáp ranh BD)", ghiChu: "Xưởng lớn, đa dạng", trangThai: "san_sang" },
  { id: "CNGC-002", stt: 2, hoTen: "Minh Thuy", sdt: "0902310887", loaiHang: "đa dạng", soTho: 28, diaChi: "Quận 8", ghiChu: "Lớn nhất, nhận đơn đa dạng", trangThai: "san_sang" },
  { id: "CNGC-003", stt: 3, hoTen: "Hiền Vũ", sdt: "0352186386", loaiHang: "cổ tròn", soTho: 18, diaChi: "Ngã 3 Mỹ Hạnh, Long An", ghiChu: "Xưởng lớn, gần TP.HCM", trangThai: "san_sang" },
  { id: "CNGC-004", stt: 4, hoTen: "Quang Vinh", sdt: "0978939078", loaiHang: "polo", soTho: 20, diaChi: "Dĩ An, Bình Dương", ghiChu: "Chuyên polo, quy mô tốt", trangThai: "san_sang" },
  { id: "CNGC-005", stt: 5, hoTen: "Delisngo", sdt: "0919919767", loaiHang: "đa dạng", soTho: 10, diaChi: "Đức Hòa, Long An", ghiChu: "Thầu đa dạng", trangThai: "san_sang" },
  { id: "CNGC-006", stt: 6, hoTen: "Nguyễn Văn Cường", sdt: "0969423170", loaiHang: "cổ trụ", soTho: 10, diaChi: "Bình Chánh - Vĩnh Lộc A", ghiChu: "Gần khu công nghiệp", trangThai: "san_sang" },
  { id: "CNGC-007", stt: 7, hoTen: "Sang Vo", sdt: "0985070815", loaiHang: "cổ tròn", soTho: 10, diaChi: "Vĩnh Lộc A", ghiChu: "Có thể so giá với Cường", trangThai: "san_sang" },
  { id: "CNGC-008", stt: 8, hoTen: "Thanh Trần", sdt: "0988678351", loaiHang: "cổ tròn", soTho: 10, diaChi: "Hóc Môn", ghiChu: "Khu vực trung tâm huyện", trangThai: "san_sang" },
  { id: "CNGC-009", stt: 9, hoTen: "Lý Nguyên", sdt: "0765618968", loaiHang: "cổ trụ", soTho: 10, diaChi: "Hóc Môn", ghiChu: "Cạnh tranh khu vực", trangThai: "san_sang" },
  { id: "CNGC-010", stt: 10, hoTen: "Cuc Nguyen", sdt: "0386226824", loaiHang: "cổ trụ", soTho: 10, diaChi: "Xuân Thới Thượng", ghiChu: "Chi phí nhân công rẻ", trangThai: "san_sang" },
  { id: "CNGC-011", stt: 11, hoTen: "Xưởng may Nam Việt", sdt: "0903147259", loaiHang: "polo", soTho: 10, diaChi: "Quận 12", ghiChu: "Có thương hiệu xưởng", trangThai: "san_sang" },
  { id: "CNGC-012", stt: 12, hoTen: "Anh Minh", sdt: "0983332294", loaiHang: "cổ tròn", soTho: 8, diaChi: "Gò Vấp", ghiChu: "Linh hoạt số lượng ít", trangThai: "san_sang" },
  { id: "CNGC-013", stt: 13, hoTen: "Nguyễn Thị Tịnh", sdt: "0344015210", loaiHang: "móc xích", soTho: 8, diaChi: "Vĩnh Lộc", ghiChu: "Chuyên móc xích (hiếm)", trangThai: "san_sang" },
  { id: "CNGC-014", stt: 14, hoTen: "Lê Thị Thu Phương", sdt: "0902908053", loaiHang: "polo", soTho: 6, diaChi: "Bình Thuận", ghiChu: "Xưởng nhỏ, chuyên polo", trangThai: "san_sang" },
  { id: "CNGC-015", stt: 15, hoTen: "Trương Tuấn Phong", sdt: "0985988901", loaiHang: "đa dạng", soTho: 6, diaChi: "Thủ Đức", ghiChu: "Đa dạng, có áo khoác", trangThai: "san_sang" },
  { id: "CNGC-016", stt: 16, hoTen: "Kim Nguyễn", sdt: "0934137991", loaiHang: "cổ tròn", soTho: 6, diaChi: "Quận 7", ghiChu: "Xưởng nhỏ, nội thành", trangThai: "san_sang" },
  { id: "CNGC-017", stt: 17, hoTen: "Nguyễn Sang", sdt: "0934157917", loaiHang: "cổ tròn", soTho: 8, diaChi: "Quận 7", ghiChu: "Gần Kim Nguyễn, có thể so giá", trangThai: "san_sang" },
  { id: "CNGC-018", stt: 18, hoTen: "Nguyễn Chương", sdt: "0703549098", loaiHang: "cổ tròn", soTho: 16, diaChi: "Vĩnh Lộc", ghiChu: "Xưởng vừa, số thợ ổn định", trangThai: "san_sang" },
  { id: "CNGC-019", stt: 19, hoTen: "Vinh", sdt: "0384854479", loaiHang: "cổ trụ", soTho: 20, diaChi: "TP.HCM (không rõ quận)", ghiChu: "Xưởng lớn nhưng thiếu địa chỉ", trangThai: "san_sang" },
  { id: "CNGC-020", stt: 20, hoTen: "Mai Hậu", sdt: "0973018817", loaiHang: "móc xích", soTho: 8, diaChi: "(chưa rõ)", ghiChu: "Cần hỏi lại kho bãi", trangThai: "san_sang" },
  { id: "CNGC-021", stt: 21, hoTen: "Hoàng Trần", sdt: "0867796951", loaiHang: "móc xích", soTho: 8, diaChi: "(chưa rõ)", ghiChu: "Cần hỏi lại địa chỉ", trangThai: "san_sang" },
  { id: "CNGC-022", stt: 22, hoTen: "Đặng Quốc Phong", sdt: "0906389774", loaiHang: "thun", soTho: 8, diaChi: "Nga Tư Gò Mây (?)", ghiChu: "Khu vực nào? có thể là Gò Vấp?", trangThai: "san_sang" },
  { id: "CNGC-023", stt: 23, hoTen: "(SĐT 968898952)", sdt: "0968898952", loaiHang: "thun", soTho: 20, diaChi: "Tân Phú", ghiChu: "Xưởng lớn, chỉ có số", trangThai: "san_sang" },
  { id: "CNGC-024", stt: 24, hoTen: "Ngọc", sdt: "0979630047", loaiHang: "móc xích", soTho: 8, diaChi: "Cầu Sáng, Hóc Môn", ghiChu: "Chuyên móc xích", trangThai: "san_sang" },
  { id: "CNGC-025", stt: 25, hoTen: "Đầm Lê", sdt: "0965000281", loaiHang: "cổ tròn", soTho: 9, diaChi: "Thủ Đức", ghiChu: "Xưởng nhỏ gần trường", trangThai: "san_sang" },
  { id: "CNGC-026", stt: 26, hoTen: "(SĐT 372639336)", sdt: "0372639336", loaiHang: "cổ tròn", soTho: 10, diaChi: "Bà Điểm", ghiChu: "Khu vực Hóc Môn", trangThai: "san_sang" },
  { id: "CNGC-027", stt: 27, hoTen: "Duy Tú", sdt: "0345635667", loaiHang: "đa dạng", soTho: 7, diaChi: "Bệnh viện Hóc Môn", ghiChu: "Gần bệnh viện, tiện liên hệ", trangThai: "san_sang" },
];

// ============ STORE ============
interface CongNhanGiaCongStore {
  dsCongNhan: CongNhanGiaCong[];
  themCongNhan: (cn: CongNhanGiaCong, u: AppUser) => void;
  suaCongNhan: (id: string, cn: Partial<CongNhanGiaCong>, u: AppUser) => void;
  xoaCongNhan: (id: string, u: AppUser) => void;
  reset: () => void;
  loading: boolean;
}

const CongNhanContext = createContext<CongNhanGiaCongStore | null>(null);

export function CongNhanGiaCongProvider({ children }: { children: ReactNode }) {
  const [dsCongNhan, setDsCongNhan] = useState<CongNhanGiaCong[]>([]);
  const [loading, setLoading] = useState(true);

  // Load lan dau: uu tien Supabase, fallback localStorage, fallback DEFAULT
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Thu Supabase
        if (isSupabaseEnabled) {
          try {
            const remote = await supabaseFetchAll<CongNhanGiaCong>("cong_nhan_gia_cong", "stt", true);
            if (!cancelled && remote && remote.length > 0) {
              setDsCongNhan(remote);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn("[CongNhanStore] Supabase fetch failed, fallback localStorage:", err);
          }
        }
        // 2. Fallback localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!cancelled) {
            setDsCongNhan(parsed);
            setLoading(false);
            return;
          }
        }
        // 3. Fallback DEFAULT
        if (!cancelled) {
          setDsCongNhan(DEFAULT_CNGC);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CNGC));
          // Dong bo len Supabase lan dau
          if (isSupabaseEnabled) {
            for (const cn of DEFAULT_CNGC) {
              supabaseUpsert("cong_nhan_gia_cong", cn as any).catch((err) =>
                console.error("[CongNhanStore] Initial sync error:", err)
              );
            }
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("[CongNhanStore] Load error:", err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const themCongNhan = useCallback((cn: CongNhanGiaCong, u: AppUser) => {
    setDsCongNhan((prev) => {
      const next = [cn, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "create", `Thêm công nhân gia công ${cn.hoTen}`, cn.id, { module: "gia-cong-ngoai" });
    if (isSupabaseEnabled) {
      supabaseUpsert("cong_nhan_gia_cong", cn as any).catch((err) =>
        console.error("[CongNhanStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const suaCongNhan = useCallback((id: string, cn: Partial<CongNhanGiaCong>, u: AppUser) => {
    let updated: CongNhanGiaCong | null = null;
    setDsCongNhan((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          updated = { ...item, ...cn };
          return updated;
        }
        return item;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "update", `Cập nhật công nhân gia công ${id}`, id, { module: "gia-cong-ngoai" });
    if (isSupabaseEnabled && updated) {
      supabaseUpsert("cong_nhan_gia_cong", updated as any).catch((err) =>
        console.error("[CongNhanStore] Supabase upsert error:", err)
      );
    }
  }, []);

  const xoaCongNhan = useCallback((id: string, u: AppUser) => {
    setDsCongNhan((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    logWorkflow(u, "delete", `Xoá công nhân gia công ${id}`, id, { module: "gia-cong-ngoai" });
    if (isSupabaseEnabled) {
      supabaseDelete("cong_nhan_gia_cong", id).catch((err) =>
        console.error("[CongNhanStore] Supabase delete error:", err)
      );
    }
  }, []);

  const reset = useCallback(() => {
    setDsCongNhan(DEFAULT_CNGC);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CNGC));
  }, []);

  return (
    <CongNhanContext.Provider value={{ dsCongNhan, themCongNhan, suaCongNhan, xoaCongNhan, reset, loading }}>
      {children}
    </CongNhanContext.Provider>
  );
}

export function useCongNhanGiaCong() {
  const ctx = useContext(CongNhanContext);
  if (!ctx) throw new Error("useCongNhanGiaCong must be used within CongNhanGiaCongProvider");
  return ctx;
}

// ============ STATS HELPERS ============
export function thongKeCongNhan(ds: CongNhanGiaCong[]) {
  return {
    tong: ds.length,
    sanSang: ds.filter((c) => c.trangThai === "san_sang").length,
    tamNgung: ds.filter((c) => c.trangThai === "tam_ngung").length,
    hetViec: ds.filter((c) => c.trangThai === "het_viec").length,
    tongTho: ds.reduce((sum, c) => sum + (c.soTho || 0), 0),
    theoLoai: ds.reduce<Record<string, number>>((acc, c) => {
      acc[c.loaiHang] = (acc[c.loaiHang] || 0) + 1;
      return acc;
    }, {}),
  };
}
