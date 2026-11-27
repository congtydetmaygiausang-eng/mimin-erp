// ============ 4 BANG CONG NO ============
// Tach tu page.tsx (2026-08-05 - toi uu B.5)

import { Users, Scissors, AlertTriangle, Phone, CheckCircle2, ChevronRight, CreditCard } from "lucide-react";
import { formatVND, formatVNDShort } from "@/lib/data/real-data";
import { congNoTheoNguoi, congNoTheoCongDoan, tinhCongNo } from "@/lib/data/cong-no";
import type { PhanCongCongDoan } from "@/lib/data/cong-no-store";
import { STATUS_STYLE } from "../data";

// ============ BANG THEO NGUOI ============
export function BangTheoNguoi({ phanCong }: { phanCong: PhanCongCongDoan[] }) {
  const data = congNoTheoNguoi(phanCong);
  const tongNo = data.reduce((s, x) => s + x.conNo, 0);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-bold text-sm md:text-base flex items-center gap-2 text-slate-900 dark:text-white">
          <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Công nợ theo người phụ trách ({data.length} người)</span>
        </h3>
        <div className="text-xs text-slate-500">
          Tổng còn nợ: <b className="text-rose-600 dark:text-rose-400 font-mono text-sm">{formatVND(tongNo)}</b>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs md:text-sm">
          <thead>
            <tr className="text-left bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <th className="p-3">Mã</th>
              <th className="p-3">Tên người PT</th>
              <th className="p-3">Phân loại</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
              <th className="p-3 text-center min-w-[130px]">% Đã TT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((d) => {
              const pct = d.thanhTien > 0 ? (d.daThanhToan / d.thanhTien) * 100 : 0;
              return (
                <tr key={d.nguoi.ma} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-xs text-slate-500 font-semibold">{d.nguoi.ma}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{d.nguoi.ten.split(" (")[0]}</div>
                    {d.nguoi.sdt && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {d.nguoi.sdt}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {d.nguoi.loai === "Đối tác gia công" ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-[11px] font-bold">
                        Đối tác
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/40 text-[11px] font-bold">
                        Nội bộ
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono font-medium">{d.soPC}</td>
                  <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{d.daThanhToan.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                    {d.conNo > 0 ? d.conNo.toLocaleString() : "✓"}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 w-9 text-right font-medium">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ BANG THEO CONG DOAN ============
export function BangTheoCongDoan({ phanCong }: { phanCong: PhanCongCongDoan[] }) {
  const data = congNoTheoCongDoan(phanCong);
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-sm md:text-base flex items-center gap-2 text-slate-900 dark:text-white">
          <Scissors className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Công nợ theo công đoạn sản xuất</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs md:text-sm">
          <thead>
            <tr className="text-left bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <th className="p-3">Công đoạn</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Tổng SL</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((d) => (
              <tr key={d.congDoan} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    {d.congDoan}
                  </span>
                </td>
                <td className="p-3 text-center font-mono font-medium">{phanCong.filter((p) => p.congDoan === d.congDoan).length}</td>
                <td className="p-3 text-right font-mono">{d.soLuong.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-emerald-600 dark:text-emerald-400">{d.daThanhToan.toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                  {d.conNo > 0 ? d.conNo.toLocaleString() : "✓"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ BANG THEO LENH CAT ============
export function BangTheoLenhCat({ phanCong, onSelect }: { phanCong: PhanCongCongDoan[]; onSelect: (id: string) => void }) {
  const grouped: Record<string, { lenhCatId: string; phanCong: PhanCongCongDoan[] }> = {};
  for (const p of phanCong) {
    if (!grouped[p.lenhCatId]) grouped[p.lenhCatId] = { lenhCatId: p.lenhCatId, phanCong: [] };
    grouped[p.lenhCatId].phanCong.push(p);
  }
  return (
    <div className="space-y-4">
      {Object.values(grouped).map((g) => {
        const t = tinhCongNo(g.phanCong);
        return (
          <div key={g.lenhCatId} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div
              className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition"
              onClick={() => onSelect(g.lenhCatId)}
            >
              <div>
                <div className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono">{g.lenhCatId}</div>
                <div className="text-sm font-bold mt-0.5 text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{g.phanCong.length} công đoạn</span>
                  <span className="text-slate-400 text-xs font-normal">· Bấm để mở chi tiết</span>
                </div>
              </div>
              <div className="text-right flex items-center gap-6">
                <div>
                  <div className="text-[11px] text-slate-400">Giá GC bình quân / SP</div>
                  <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
                    {formatVND(g.phanCong.reduce((sum, p) => sum + p.donGiaGiao, 0))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400">Tổng còn nợ</div>
                  <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">{formatVND(t.tongConNo)}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-xs">
                <thead>
                  <tr className="text-left bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="p-2.5">Công đoạn</th>
                    <th className="p-2.5">Người PT</th>
                    <th className="p-2.5 text-right">SL</th>
                    <th className="p-2.5 text-right">Đơn giá</th>
                    <th className="p-2.5 text-right">Thành tiền</th>
                    <th className="p-2.5 text-right">Đã TT</th>
                    <th className="p-2.5 text-right">Còn nợ</th>
                    <th className="p-2.5">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {g.phanCong.map((p) => {
                    const tt = p.donGiaGiao * p.soLuongGiao;
                    const cn = tt - p.daThanhToan;
                    const s = STATUS_STYLE[p.trangThai];
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition">
                        <td className="p-2.5 font-medium">{p.congDoan}</td>
                        <td className="p-2.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.nguoiPhuTrach.ma}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono">{p.soLuongGiao.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono">{p.donGiaGiao.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono">{tt.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">{p.daThanhToan.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                        <td className="p-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${s.bg} ${s.color}`}>
                            {p.trangThai}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ BANG TRE HAN ============
export function BangTreHan({
  phanCong,
  onThanhToan,
  isLate,
}: {
  phanCong: PhanCongCongDoan[];
  onThanhToan: (p: PhanCongCongDoan) => void;
  isLate: (p: PhanCongCongDoan) => boolean;
}) {
  if (phanCong.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">Tuyệt vời! Không có công đoạn nào trễ hạn</div>
        <div className="text-xs text-slate-400 mt-1">Tất cả các công đoạn sản xuất & gia công đều đang đúng tiến độ cam kết.</div>
      </div>
    );
  }
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-300 dark:border-rose-900 shadow-xs overflow-hidden">
      <div className="p-4 border-b border-rose-100 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <h3 className="font-bold text-sm text-rose-900 dark:text-rose-200">
          Công đoạn trễ hạn deadline ({phanCong.length}) — Cần đôn đốc xử lý gấp
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs md:text-sm">
          <thead>
            <tr className="text-left bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <th className="p-3">Lệnh cắt</th>
              <th className="p-3">Công đoạn</th>
              <th className="p-3">Người PT</th>
              <th className="p-3">SĐT</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Còn nợ</th>
              <th className="p-3">Deadline</th>
              <th className="p-3 text-center">Trễ</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {phanCong.map((p) => {
              const tt = p.donGiaGiao * p.soLuongGiao;
              const cn = tt - p.daThanhToan;
              const today = new Date();
              const deadline = new Date(p.ngayXongDuKien);
              const soNgayTre = Math.floor((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <tr key={p.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20 transition">
                  <td className="p-3 font-mono text-xs font-bold text-teal-600 dark:text-teal-400">{p.lenhCatId}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 text-xs font-semibold">
                      {p.congDoan}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900 dark:text-white">{p.nguoiPhuTrach.ten.split(" (")[0]}</td>
                  <td className="p-3 text-xs">
                    {p.nguoiPhuTrach.sdt && (
                      <a href={`tel:${p.nguoiPhuTrach.sdt}`} className="inline-flex items-center gap-1 text-sky-600 hover:underline">
                        <Phone className="w-3 h-3" /> {p.nguoiPhuTrach.sdt}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">{tt.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{cn.toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs text-rose-600 font-semibold">{p.ngayXongDuKien}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold">
                      -{soNgayTre} ngày
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {p.nguoiPhuTrach.sdt && (
                        <a
                          href={`tel:${p.nguoiPhuTrach.sdt}`}
                          className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold border border-sky-200"
                        >
                          Gọi điện
                        </a>
                      )}
                      {cn > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs"
                        >
                          Trả nợ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}