"use client";

// ============================================================
// STAGE TABS VIEW - 9 Tab Công Đoạn Sản Xuất
// ============================================================

import { useState } from "react";
import type { LenhCat, MauVai, CongDoanItem } from "@/lib/data/lenh-cat-store";
import { formatVND } from "@/lib/data/real-data";
import { MauCardStage } from "./MauCardStage";

// === TYPES ===
export type StageKey =
  | "cat"
  | "in_theu"
  | "may_ao"
  | "may_quan"
  | "qc_ao"
  | "qc_quan"
  | "khuy_nut"
  | "ui"
  | "dong_goi"
  | "nhap_kho"
  | "danh_muc";

type TabConfig = {
  key: StageKey;
  label: string;
  icon: string;
  onlyBo?: boolean; // Tab này chỉ hiện khi hàng Bộ
  hideForBo?: boolean;
};

const ALL_TABS: TabConfig[] = [
  { key: "cat",       label: "Cắt",       icon: "✂️" },
  { key: "in_theu",   label: "In/Thêu",   icon: "🖨️" },
  { key: "may_ao",    label: "May Áo",     icon: "👔" },
  { key: "may_quan",  label: "May Quần",   icon: "👖", onlyBo: true },
  { key: "qc_ao",     label: "QC Áo",      icon: "🔍" },
  { key: "qc_quan",   label: "QC Quần",    icon: "🔍", onlyBo: true },
  { key: "khuy_nut",  label: "Khuy Nút",   icon: "🧵" },
  { key: "ui",        label: "Ủi",         icon: "🔥" },
  { key: "dong_goi",  label: "Đóng Gói",   icon: "📦" },
  { key: "nhap_kho",  label: "Nhập Kho",   icon: "🏭" },
  { key: "danh_muc",  label: "Danh Mục SP",icon: "📋" },
];

// Helper lấy công đoạn từ phanCong theo id keyword
function getPhanCong(lc: LenhCat, keyword: string): CongDoanItem | undefined {
  return lc.phanCong?.find((p) => p.id.toLowerCase().includes(keyword));
}

// Helper lấy tổng SL size (từ khâu cắt, hoặc phanBoSize)
function getSizeData(mau: MauVai, khauKey?: string) {
  if (khauKey && mau.tyLeSizeChiTiet?.[khauKey]?.some((s) => s.sl > 0)) {
    return mau.tyLeSizeChiTiet[khauKey];
  }
  // Fallback: tìm khâu cắt
  if (mau.tyLeSizeChiTiet) {
    const catKey = Object.keys(mau.tyLeSizeChiTiet).find((k) => k.toLowerCase().includes("cat"));
    if (catKey && mau.tyLeSizeChiTiet[catKey]?.some((s) => s.sl > 0)) {
      return mau.tyLeSizeChiTiet[catKey];
    }
  }
  return mau.phanBoSize || [];
}

// ============================================================
// STAGE CONTENT RENDERERS
// ============================================================

// 1. Tab Cắt
function StageCat({ lc }: { lc: LenhCat }) {
  const pcCat = getPhanCong(lc, "cat");
  const isBo = lc.dsMau.some((m) => m.maVaiQuan);

  return (
    <div className="space-y-4">
      {/* Thanh tóm tắt người phụ trách + tiến độ */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <InfoItem label="Người phụ trách cắt" value={pcCat?.nguoiTen || "Chưa giao"} />
        {pcCat?.ngayNhanViec && (
          <InfoItem label="Ngày nhận việc" value={new Date(pcCat.ngayNhanViec).toLocaleDateString("vi-VN")} />
        )}
        {pcCat?.soLuongHoanThanh != null && (
          <InfoItem
            label="Tiến độ cắt"
            value={`${pcCat.soLuongHoanThanh.toLocaleString()} / ${lc.tongSL.toLocaleString()} SP`}
            highlight
          />
        )}
        {pcCat?.ghiChu && (
          <div className="w-full text-xs text-slate-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            📝 {pcCat.ghiChu}
          </div>
        )}
      </div>

      {/* Cards Áo — mỗi màu 1 card */}
      <SectionTitle title={isBo ? "Vải Áo — từng màu" : "Vải — từng màu"} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage
            key={`ao-${idx}`}
            mau={mau}
            type="ao"
            khauKey="cat"
            label={`Màu ${idx + 1}`}
            donGia={pcCat?.donGia}
            trangThai={pcCat?.trangThaiCD}
          />
        ))}
      </div>

      {/* Cards Quần — chỉ hiện khi hàng Bộ */}
      {isBo && (
        <>
          <SectionTitle title="Vải Quần — từng màu" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lc.dsMau.map((mau, idx) => (
              <MauCardStage
                key={`quan-${idx}`}
                mau={mau}
                type="quan"
                khauKey="cat"
                label={`Màu ${idx + 1}`}
                donGia={pcCat?.donGia}
                trangThai={pcCat?.trangThaiCD}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// 2. Tab In/Thêu
function StageInTheu({ lc }: { lc: LenhCat }) {
  const pcInTheu = getPhanCong(lc, "in") || getPhanCong(lc, "theu") || getPhanCong(lc, "in_theu");
  let hinhInTheu: { url?: string; name?: string } | null = null;
  try { if (lc.hinhMauInTheu) hinhInTheu = JSON.parse(lc.hinhMauInTheu); } catch {}

  return (
    <div className="space-y-4">
      {/* Thông tin chung khâu In/Thêu */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-start">
        {hinhInTheu?.url && (
          <div className="w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={hinhInTheu.url} alt="Hình mẫu In/Thêu" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex flex-wrap gap-4 flex-1">
          <InfoItem label="Nhà In/Thêu" value={pcInTheu?.nguoiTen || "Chưa giao"} />
          <InfoItem label="Đơn giá In/Thêu" value={pcInTheu ? formatVND(pcInTheu.donGia) + "/SP" : "—"} highlight />
          <InfoItem label="Trạng thái" value={pcInTheu?.trangThaiCD === "hoan_thanh" ? "✅ Hoàn thành" : "⏳ Chờ"} />
          {lc.ghiChuInTheu && (
            <div className="w-full">
              <div className="text-[11px] text-slate-400 font-bold uppercase mb-1">Ghi chú In/Thêu</div>
              <div className="text-sm text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">
                {lc.ghiChuInTheu}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SL size theo màu (thông tin chung) */}
      <SectionTitle title="SL Tỉ lệ size theo màu (thông tin chung)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="ao" khauKey="in_theu" label={`Màu ${idx + 1}`} showSizeOnly />
        ))}
      </div>
    </div>
  );
}

// 3-1. Tab May Áo
function StageMayAo({ lc }: { lc: LenhCat }) {
  const pcMay = getPhanCong(lc, "may_ao") || getPhanCong(lc, "may");
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <InfoItem label="Xưởng / Tổ May Áo" value={pcMay?.nguoiTen || "Chưa giao"} />
        <InfoItem label="Đơn giá May Áo" value={pcMay ? formatVND(pcMay.donGia) + "/SP" : "—"} highlight />
        <InfoItem label="Trạng thái" value={pcMay?.trangThaiCD === "hoan_thanh" ? "✅ Hoàn thành" : "⏳ Chờ"} />
        {pcMay?.soLuongHoanThanh != null && (
          <InfoItem label="SL May xong" value={`${pcMay.soLuongHoanThanh.toLocaleString()} SP`} highlight />
        )}
        {pcMay?.soLuongLoi != null && pcMay.soLuongLoi > 0 && (
          <InfoItem label="SL Lỗi" value={`${pcMay.soLuongLoi.toLocaleString()} SP`} danger />
        )}
      </div>

      <SectionTitle title="Vải Áo — Từng màu" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="ao" khauKey="may_ao" label={`Màu ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}

// 3-2. Tab May Quần
function StageMayQuan({ lc }: { lc: LenhCat }) {
  const pcMayQ = getPhanCong(lc, "may_quan");
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <InfoItem label="Xưởng / Tổ May Quần" value={pcMayQ?.nguoiTen || "Chưa giao"} />
        <InfoItem label="Đơn giá May Quần" value={pcMayQ ? formatVND(pcMayQ.donGia) + "/SP" : "—"} highlight />
        <InfoItem label="Trạng thái" value={pcMayQ?.trangThaiCD === "hoan_thanh" ? "✅ Hoàn thành" : "⏳ Chờ"} />
      </div>

      <SectionTitle title="Vải Quần — Từng màu" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="quan" khauKey="may_quan" label={`Màu ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}

// 4. Tab QC Áo & Quần
function StageQC({ lc, forQuan = false }: { lc: LenhCat; forQuan?: boolean }) {
  const pcMay = forQuan
    ? (getPhanCong(lc, "may_quan"))
    : (getPhanCong(lc, "may_ao") || getPhanCong(lc, "may"));
  const title = forQuan ? "Quần" : "Áo";

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap gap-4">
        <InfoItem label={`SL Gia công ${title} đã giao`} value={pcMay?.soLuong != null ? `${pcMay.soLuong.toLocaleString()} SP` : "—"} />
        <InfoItem label="SL Đạt (QC xác nhận)" value={pcMay?.soLuongHoanThanh != null ? `${pcMay.soLuongHoanThanh.toLocaleString()} SP` : "—"} highlight />
        <InfoItem label="SL Lỗi / Trả lại" value={pcMay?.soLuongLoi != null ? `${pcMay.soLuongLoi.toLocaleString()} SP` : "—"} danger />
      </div>

      <SectionTitle title={`Vải ${title} — Từng màu (QC kiểm)`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage
            key={idx}
            mau={mau}
            type={forQuan ? "quan" : "ao"}
            khauKey={forQuan ? "may_quan" : "may_ao"}
            label={`Màu ${idx + 1}`}
            showQC
          />
        ))}
      </div>
    </div>
  );
}

// 5. Tab Khuy Nút (chỉ Áo)
function StageKhuyNut({ lc }: { lc: LenhCat }) {
  const pcKN = getPhanCong(lc, "khuy");
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4">
        <InfoItem label="Người phụ trách" value={pcKN?.nguoiTen || "Chưa giao"} />
        <InfoItem label="Đơn giá" value={pcKN ? formatVND(pcKN.donGia) + "/SP" : "—"} highlight />
        <div className="w-full text-xs text-amber-600 font-bold bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          ℹ️ Khuy nút chỉ áp dụng cho Áo. Không tính cho Quần.
        </div>
      </div>

      <SectionTitle title="Áo — Từng màu (Chỉ áo, không có quần)" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="ao" label={`Màu ${idx + 1}`} showSizeOnly />
        ))}
      </div>
    </div>
  );
}

// 6-7. Tab Ủi / Đóng Gói (cả Áo + Quần ghép thành Bộ)
function StageBo({ lc, stageName }: { lc: LenhCat; stageName: string }) {
  const isBo = lc.dsMau.some((m) => m.maVaiQuan);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="text-sm font-bold text-slate-700">
          {isBo ? "📦 Hàng Bộ — Áo + Quần ghép thành bộ hoàn chỉnh" : "👔 Hàng Áo đơn"}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          Tổng: <span className="font-black text-slate-800">{lc.tongSL.toLocaleString()}</span> SP
        </div>
      </div>

      <SectionTitle title={`${stageName} — SL tỉ lệ size từng màu`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="bo" label={`Màu ${idx + 1}`} showSizeOnly />
        ))}
      </div>
    </div>
  );
}

// 8. Tab Nhập Kho
function StageNhapKho({ lc }: { lc: LenhCat }) {
  const giaBan = (lc.bangCOGS as any)?.giaBan || 0;
  const giaVon = lc.bangCOGS?.giaVonBinhQuan || 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex flex-wrap gap-4">
        <InfoItem label="Giá Vốn bình quân" value={formatVND(giaVon) + "/SP"} />
        <InfoItem label="Giá Bán (nếu đã nhập)" value={giaBan ? formatVND(giaBan) + "/SP" : "Chưa nhập"} highlight />
        <InfoItem label="Tổng SL nhập kho" value={`${(lc.tongSLThucTe || lc.tongSL).toLocaleString()} SP`} highlight />
        <div className="w-full text-xs text-emerald-700 font-bold bg-emerald-100 rounded-lg px-3 py-2 border border-emerald-200">
          ✅ Sau khi xác nhận nhập kho, toàn bộ công đoạn sẽ được ghi vào Công Nợ tương ứng.
        </div>
      </div>

      <SectionTitle title="Tổng SL nhập kho theo màu" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="bo" label={`Màu ${idx + 1}`} showSizeOnly />
        ))}
      </div>
    </div>
  );
}

// 9. Tab Danh Mục SP
function StageDanhMuc({ lc }: { lc: LenhCat }) {
  const giaBanSi = (lc.bangCOGS as any)?.giaBanSi || 0;
  const giaBanLe = (lc.bangCOGS as any)?.giaBanLe || 0;
  const giaVon = lc.bangCOGS?.giaVonBinhQuan || 0;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-4">
        <InfoItem label="Giá Vốn" value={giaVon ? formatVND(giaVon) + "/SP" : "—"} />
        <InfoItem label="Giá Bán Sỉ" value={giaBanSi ? formatVND(giaBanSi) + "/SP" : "Chưa nhập"} highlight />
        <InfoItem label="Giá Bán Lẻ" value={giaBanLe ? formatVND(giaBanLe) + "/SP" : "Chưa nhập"} highlight />
        <InfoItem label="Tổng SL" value={`${lc.tongSL.toLocaleString()} SP`} />
      </div>

      <SectionTitle title="Sản phẩm theo màu" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {lc.dsMau.map((mau, idx) => (
          <MauCardStage key={idx} mau={mau} type="bo" label={`Màu ${idx + 1}`} showSizeOnly />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
      {title}
    </h3>
  );
}

function InfoItem({ label, value, highlight = false, danger = false }: {
  label: string;
  value: string | React.ReactNode;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-slate-400 font-bold uppercase mb-0.5">{label}</div>
      <div className={`text-sm font-black ${danger ? "text-rose-600" : highlight ? "text-sky-700" : "text-slate-800"}`}>
        {value}
      </div>
    </div>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================

export function StageTabsView({ lc }: { lc: LenhCat }) {
  const isBo = lc.dsMau?.some((m) => m.maVaiQuan) || lc.loaiSP.toLowerCase().includes("bo");

  const tabs = ALL_TABS.filter((t) => {
    if (t.onlyBo && !isBo) return false;
    return true;
  });

  const [activeKey, setActiveKey] = useState<StageKey>("cat");

  // Active tab indicator — which stage current lc is at
  const getTabStatus = (key: StageKey): "done" | "active" | "pending" => {
    const pc = lc.phanCong?.find((p) => p.id.toLowerCase().includes(key.replace("qc_ao", "qc").replace("qc_quan", "qc")));
    if (pc?.trangThaiCD === "hoan_thanh") return "done";
    if (pc?.trangThaiCD === "dang_lam" || pc?.trangThaiCD === "cho_qc") return "active";
    return "pending";
  };

  const renderContent = () => {
    switch (activeKey) {
      case "cat":       return <StageCat lc={lc} />;
      case "in_theu":   return <StageInTheu lc={lc} />;
      case "may_ao":    return <StageMayAo lc={lc} />;
      case "may_quan":  return <StageMayQuan lc={lc} />;
      case "qc_ao":     return <StageQC lc={lc} forQuan={false} />;
      case "qc_quan":   return <StageQC lc={lc} forQuan={true} />;
      case "khuy_nut":  return <StageKhuyNut lc={lc} />;
      case "ui":        return <StageBo lc={lc} stageName="Ủi" />;
      case "dong_goi":  return <StageBo lc={lc} stageName="Đóng Gói" />;
      case "nhap_kho":  return <StageNhapKho lc={lc} />;
      case "danh_muc":  return <StageDanhMuc lc={lc} />;
      default:          return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Bar — horizontal scroll trên mobile */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <div className="flex min-w-max px-2 py-2 gap-1">
          {tabs.map((tab) => {
            const status = getTabStatus(tab.key);
            const isActive = activeKey === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveKey(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all relative ${
                  isActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {/* Status dot */}
                {status === "done" && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
                )}
                {status === "active" && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 border border-white animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-64">
        {renderContent()}
      </div>
    </div>
  );
}
