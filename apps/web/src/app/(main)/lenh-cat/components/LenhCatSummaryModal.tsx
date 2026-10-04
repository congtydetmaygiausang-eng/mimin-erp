"use client";

import { Calculator, MessageCircle, Phone, Send, UserRound, UsersRound, X, Wallet, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import type { LenhCat } from "@/lib/data/lenh-cat-store";
import { useNhanSu } from "@/lib/data/nhan-su-store";
import { useDoiTac } from "@/lib/data/doi-tac-store";
import { usePhanCong } from "@/lib/data/cong-no-store";
import { toast } from "sonner";
import Link from "next/link";

export type LenhCatSummaryView = "cost" | "owners" | "debt";

function CostSummary({ lc }: { lc: LenhCat }) {
  const cogs = lc.bangCOGS;
  const tongSL = lc.tongSL || 0;
  const tongGiaCong = (cogs?.giaCong1SP || 0) * tongSL;
  const tongGiaVon = cogs?.tongGiaVon
    ?? (cogs?.giaVon1SP ?? cogs?.giaVonBinhQuan ?? 0) * tongSL;
  const rows = [
    { label: "Chi phí vải", value: cogs?.tongTienVai || 0 },
    { label: "Chi phí phụ liệu", value: cogs?.tongTienPhuLieu || 0 },
    { label: "Chi phí gia công", value: tongGiaCong },
    { label: "Chi phí cố định", value: cogs?.tongChiPhiCoDinh || 0 },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white shadow-sm">
        <div className="text-xs font-bold uppercase tracking-wider text-white/80">Tổng giá vốn lệnh cắt</div>
        <div className="mt-1 text-3xl font-black tabular-nums">{formatVND(tongGiaVon)}</div>
        <div className="mt-1 text-xs text-white/80">
          {tongSL.toLocaleString("vi-VN")} sản phẩm · {formatVND(cogs?.giaVon1SP ?? cogs?.giaVonBinhQuan ?? 0)}/SP
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-[11px] font-semibold text-slate-500">{row.label}</div>
            <div className="mt-1 font-black tabular-nums text-slate-800">{formatVND(row.value)}</div>
          </div>
        ))}
      </div>
      {!cogs && <p className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700">Lệnh cắt chưa có bảng tính giá vốn.</p>}
    </div>
  );
}

function normalizeCode(value: string): string {
  const match = value.trim().toUpperCase().match(/^([^0-9]+)0*([0-9]+)$/);
  return match ? `${match[1]}${Number(match[2])}` : value.trim().toUpperCase();
}

function normalizePhone(value?: string): string {
  const digits = (value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("84")) return `0${digits.slice(2)}`;
  return digits.startsWith("0") ? digits : `0${digits}`;
}

function initials(value: string): string {
  return value.split(/\s+/).filter(Boolean).slice(-2).map((part) => part[0]).join("").toUpperCase() || "?";
}

function OwnersSummary({ lc }: { lc: LenhCat }) {
  const { list: nhanSu } = useNhanSu();
  const { list: doiTac } = useDoiTac();
  const phanCong = lc.phanCong || [];
  const assignedCount = phanCong.filter((item) => item.nguoiMa || item.nguoiTen).length;
  const uniqueOwners = new Set(phanCong.filter((item) => item.nguoiMa || item.nguoiTen).map((item) => item.nguoiMa || item.nguoiTen)).size;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-sky-50 p-3 text-sky-800"><div className="text-[11px] font-bold">Đã phân công</div><div className="text-2xl font-black">{assignedCount}/{phanCong.length}</div></div>
        <div className="rounded-xl bg-violet-50 p-3 text-violet-800"><div className="text-[11px] font-bold">Tổng người phụ trách</div><div className="text-2xl font-black">{uniqueOwners}</div></div>
      </div>
      <div className="space-y-2">
        {phanCong.map((item) => {
          const code = normalizeCode(item.nguoiMa || "");
          const employee = nhanSu.find((record) => normalizeCode(record.maNV) === code);
          const partner = doiTac.find((record) => normalizeCode(record.ma) === code);
          const displayName = item.nguoiTen || employee?.hoTen || partner?.tenDonVi || "Chưa giao người phụ trách";
          const phone = normalizePhone(employee?.sdt || partner?.sdt);
          const avatar = employee?.avatar;
          return (
            <div key={item.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-100 to-cyan-200 font-black text-sky-700 ring-2 ring-white shadow-sm">
                  {avatar ? <img src={avatar} alt={`Avatar ${displayName}`} className="h-full w-full object-cover" /> : item.nguoiTen ? initials(displayName) : <UserRound className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800">{item.tenCongDoan}</div>
                  <div className={`truncate text-xs ${item.nguoiTen ? "text-slate-500" : "italic text-amber-600"}`}>{displayName}</div>
                  {phone && <div className="mt-0.5 text-xs font-semibold tabular-nums text-slate-600">{phone}</div>}
                </div>
                {item.nguoiMa && <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] font-bold text-slate-500">{item.nguoiMa}</span>}
              </div>
              {phone ? (
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  <a href={`tel:${phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-2 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"><Phone className="h-3.5 w-3.5" /> Gọi</a>
                  <a href={`sms:${phone}`} className="flex items-center justify-center gap-1.5 rounded-lg bg-sky-50 px-2 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100"><MessageCircle className="h-3.5 w-3.5" /> SMS</a>
                  <a href={`https://zalo.me/${phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"><Send className="h-3.5 w-3.5" /> Zalo</a>
                </div>
              ) : item.nguoiTen ? (
                <div className="mt-2 text-xs italic text-slate-400">Chưa có số điện thoại trong danh bạ.</div>
              ) : null}
            </div>
          );
        })}
        {phanCong.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Lệnh cắt chưa có công đoạn để phân công.</p>}
      </div>
    </div>
  );
}

function DebtSummary({ lc }: { lc: LenhCat }) {
  const { layTheoLenh, dongBoToanBoCongNoTuLenhCat } = usePhanCong();
  const dsCongNo = layTheoLenh(lc.id);
  const phanCong = lc.phanCong || [];

  const tongThanhTien = dsCongNo.reduce((acc, cur) => acc + (cur.donGiaGiao * cur.soLuongGiao), 0);
  const tongDaTT = dsCongNo.reduce((acc, cur) => acc + (cur.daThanhToan || 0), 0);
  const tongConNo = tongThanhTien - tongDaTT;

  const handleChotCongNo = () => {
    const count = dongBoToanBoCongNoTuLenhCat(lc);
    toast.success(`Đã đồng bộ ${count} công đoạn vào Sổ công nợ!`);
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng tiền công</div>
          <div className="text-sm sm:text-base font-black text-slate-800 mt-0.5">{formatVND(tongThanhTien)}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
          <div className="text-[10px] font-bold text-emerald-600 uppercase">Đã thanh toán</div>
          <div className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">{formatVND(tongDaTT)}</div>
        </div>
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
          <div className="text-[10px] font-bold text-rose-600 uppercase">Còn nợ</div>
          <div className="text-sm sm:text-base font-black text-rose-700 mt-0.5">{formatVND(tongConNo)}</div>
        </div>
      </div>

      {/* Button chốt công nợ & Xem sổ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-violet-50/70 rounded-xl border border-violet-100">
        <div className="text-xs text-violet-900">
          <span className="font-bold">{dsCongNo.length} / {phanCong.length} công đoạn</span> đã vào Sổ công nợ.
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleChotCongNo}
            className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-bold text-xs hover:bg-violet-700 transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Chốt / Đồng bộ lại
          </button>
          <Link
            href={`/cong-no?search=${lc.id}`}
            className="px-3 py-1.5 rounded-lg bg-white border border-violet-300 text-violet-700 font-bold text-xs hover:bg-violet-50 transition flex items-center justify-center gap-1 shadow-sm"
          >
            Sổ công nợ <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Danh sách công đoạn chi tiết */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {phanCong.map((pc) => {
          const matched = dsCongNo.find(c => c.congDoan === (pc.tenCongDoan || "Gia công") || (pc.nguoiMa && c.nguoiPhuTrach?.ma === pc.nguoiMa));
          const sl = matched ? matched.soLuongGiao : (pc.soLuongDatCuoi ?? pc.soLuongHoanThanh ?? (pc.soLuong && pc.soLuong > 0 ? pc.soLuong : (lc.tongSLThucTe || lc.tongSL || 0)));
          const dg = matched ? matched.donGiaGiao : (pc.donGia || 0);
          const tt = dg * sl;
          const daTT = matched ? matched.daThanhToan : (pc.daThanhToan || 0);
          const conLai = tt - daTT;
          const status = matched ? matched.trangThai : "Chưa vào sổ";

          return (
            <div key={pc.id} className="rounded-xl border border-slate-200 p-3 hover:bg-slate-50/50 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-800 text-sm">{pc.tenCongDoan}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Thợ/Xưởng: <span className="font-semibold text-slate-700">{pc.nguoiTen || "Chưa giao"}</span>
                    {pc.nguoiMa && <span className="ml-1 font-mono text-[10px] text-slate-400">({pc.nguoiMa})</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-sm text-slate-900">{formatVND(tt)}</div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                    status === "Đã thanh toán" ? "bg-emerald-100 text-emerald-700" :
                    status === "Hoàn thành" ? "bg-sky-100 text-sky-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>SL: <b>{sl.toLocaleString()}</b> × Đơn giá: <b>{formatVND(dg)}</b></div>
                <div>Đã trả: <b className="text-emerald-600">{formatVND(daTT)}</b> · Còn: <b className="text-rose-600">{formatVND(conLai)}</b></div>
              </div>
            </div>
          );
        })}
        {phanCong.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
            Lệnh cắt chưa có công đoạn nào.
          </p>
        )}
      </div>
    </div>
  );
}

export function LenhCatSummaryModal({ lc, view, onClose }: { lc: LenhCat; view: LenhCatSummaryView; onClose: () => void }) {
  const isCost = view === "cost";
  const isDebt = view === "debt";

  let headerIcon = <UsersRound className="h-5 w-5 text-sky-600" />;
  let headerTitle = "Người phụ trách công đoạn";

  if (isCost) {
    headerIcon = <Calculator className="h-5 w-5 text-amber-600" />;
    headerTitle = "Tổng giá vốn";
  } else if (isDebt) {
    headerIcon = <Wallet className="h-5 w-5 text-rose-600" />;
    headerTitle = "Công nợ công đoạn";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={headerTitle} className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {headerIcon}
            <div>
              <h2 className="font-black text-slate-900">{headerTitle}</h2>
              <p className="text-xs text-slate-500">{lc.id} · {lc.tenSP}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          {isCost && <CostSummary lc={lc} />}
          {isDebt && <DebtSummary lc={lc} />}
          {!isCost && !isDebt && <OwnersSummary lc={lc} />}
        </div>
      </div>
    </div>
  );
}
