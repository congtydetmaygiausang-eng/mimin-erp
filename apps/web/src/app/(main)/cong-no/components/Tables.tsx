// ============ 4 BANG CONG NO ============
// Tach tu page.tsx (2026-08-05 - toi uu B.5)

import { Users, Scissors, AlertTriangle, Phone, CheckCircle2 } from "lucide-react";
import { formatVND } from "@/lib/data/real-data";
import { congNoTheoNguoi, congNoTheoCongDoan, tinhCongNo } from "@/lib/data/cong-no";
import type { PhanCongCongDoan } from "@/lib/data/cong-no-store";
import { STATUS_STYLE } from "../data";

// ============ BANG THEO NGUOI ============
export function BangTheoNguoi({ phanCong }: { phanCong: PhanCongCongDoan[] }) {
  const data = congNoTheoNguoi(phanCong);
  const tongNo = data.reduce((s, x) => s + x.conNo, 0);
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-500" />
          Công nợ theo người phụ trách ({data.length} người)
        </h3>
        <div className="text-xs opacity-70 mt-1">Tổng còn nợ: <b className="text-red-600">{formatVND(tongNo)}</b></div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Mã</th>
              <th className="p-3">Tên</th>
              <th className="p-3">Loại</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
              <th className="p-3 text-center">% Đã TT</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => {
              const pct = d.thanhTien > 0 ? (d.daThanhToan / d.thanhTien) * 100 : 0;
              return (
                <tr key={d.nguoi.ma} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{d.nguoi.ma}</td>
                  <td className="p-3">
                    <div className="font-medium">{d.nguoi.ten.split(" (")[0]}</div>
                    {d.nguoi.sdt && (
                      <div className="text-[10px] opacity-60 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {d.nguoi.sdt}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {d.nguoi.loai === "Đối tác gia công" ? (
                      <span className="px-2 py-0.5 rounded bg-violet-500/15 text-violet-700 text-xs">Đối tác</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-700 text-xs">Nội bộ</span>
                    )}
                  </td>
                  <td className="p-3 text-center font-mono">{d.soPC}</td>
                  <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">{d.daThanhToan.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-semibold text-red-600">{d.conNo.toLocaleString()}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/40 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] opacity-60 w-10 text-right">{pct.toFixed(0)}%</span>
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
    <div className="card overflow-hidden">
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h3 className="font-semibold flex items-center gap-2">
          <Scissors className="w-4 h-4 text-brand-500" />
          Công nợ theo công đoạn
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
              <th className="p-3">Công đoạn</th>
              <th className="p-3 text-center">Số PC</th>
              <th className="p-3 text-right">Tổng SL</th>
              <th className="p-3 text-right">Thành tiền</th>
              <th className="p-3 text-right">Đã TT</th>
              <th className="p-3 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.congDoan} className="border-b last:border-0 hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-brand-500/15 text-brand-700 text-xs font-medium">{d.congDoan}</span>
                </td>
                <td className="p-3 text-center font-mono">{phanCong.filter(p => p.congDoan === d.congDoan).length}</td>
                <td className="p-3 text-right font-mono">{d.soLuong.toLocaleString()}</td>
                <td className="p-3 text-right font-mono">{d.thanhTien.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-emerald-600">{d.daThanhToan.toLocaleString()}</td>
                <td className="p-3 text-right font-mono font-semibold text-red-600">{d.conNo.toLocaleString()}</td>
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
          <div key={g.lenhCatId} className="card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between cursor-pointer hover:bg-white/30 dark:hover:bg-white/5" style={{ borderColor: "var(--border)" }} onClick={() => onSelect(g.lenhCatId)}>
              <div>
                <div className="text-xs text-brand-600 font-mono">{g.lenhCatId}</div>
                <div className="text-sm font-semibold mt-0.5">{g.phanCong.length} công đoạn</div>
              </div>
              <div className="text-right">
                <div className="text-xs opacity-60">Tổng còn nợ</div>
                <div className="text-lg font-bold text-red-600">{formatVND(t.tongConNo)}</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-white/30 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                    <th className="p-3">Công đoạn</th>
                    <th className="p-3">Người PT</th>
                    <th className="p-3 text-right">SL</th>
                    <th className="p-3 text-right">Đơn giá</th>
                    <th className="p-3 text-right">Thành tiền</th>
                    <th className="p-3 text-right">Đã TT</th>
                    <th className="p-3 text-right">Còn nợ</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {g.phanCong.map((p) => {
                    const tt = p.donGiaGiao * p.soLuongGiao;
                    const cn = tt - p.daThanhToan;
                    const s = STATUS_STYLE[p.trangThai];
                    return (
                      <tr key={p.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                        <td className="p-3 text-xs">{p.congDoan}</td>
                        <td className="p-3 text-xs">
                          <div className="font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                          <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                        </td>
                        <td className="p-3 text-right text-xs">{p.soLuongGiao.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono">{tt.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                        <td className="p-3 text-right text-xs font-mono font-semibold text-red-600">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${s.bg} ${s.color}`}>
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
export function BangTreHan({ phanCong, onThanhToan, isLate }: { phanCong: PhanCongCongDoan[]; onThanhToan: (p: PhanCongCongDoan) => void; isLate: (p: PhanCongCongDoan) => boolean }) {
  if (phanCong.length === 0) {
    return (
      <div className="card p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <div className="text-lg font-semibold text-emerald-600">Tuyệt vời! Không có công đoạn nào trễ hạn</div>
        <div className="text-sm opacity-70 mt-1">Tất cả các công đoạn đều đang đúng tiến độ</div>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden border-red-500/40">
      <div className="p-4 border-b bg-red-500/10 flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="font-semibold text-red-700 dark:text-red-400">
          Công đoạn trễ hạn deadline ({phanCong.length})
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b" style={{ borderColor: "var(--border)" }}>
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
          <tbody>
            {phanCong.map((p) => {
              const tt = p.donGiaGiao * p.soLuongGiao;
              const cn = tt - p.daThanhToan;
              const today = new Date();
              const deadline = new Date(p.ngayXongDuKien);
              const soNgayTre = Math.floor((today.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
              return (
                <tr key={p.id} className="border-b last:border-0 bg-red-500/5" style={{ borderColor: "var(--border)" }}>
                  <td className="p-3 font-mono text-xs text-brand-600 font-semibold">{p.lenhCatId}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-700 text-xs font-medium">{p.congDoan}</span>
                  </td>
                  <td className="p-3 text-xs font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</td>
                  <td className="p-3 text-xs">
                    {p.nguoiPhuTrach.sdt && (
                      <a href={`tel:${p.nguoiPhuTrach.sdt}`} className="flex items-center gap-1 text-brand-600 hover:underline">
                        <Phone className="w-3 h-3" /> {p.nguoiPhuTrach.sdt}
                      </a>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono">{tt.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono font-semibold text-red-600">{cn.toLocaleString()}</td>
                  <td className="p-3 text-xs text-red-600 font-medium">{p.ngayXongDuKien}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-red-500 text-white text-xs font-bold">-{soNgayTre} ngày</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col gap-1">
                      {p.nguoiPhuTrach.sdt && (
                        <a
                          href={`tel:${p.nguoiPhuTrach.sdt}`}
                          className="text-xs px-2 py-1 rounded bg-blue-500/15 text-blue-700 hover:bg-blue-500/25"
                        >
                          📞 Gọi
                        </a>
                      )}
                      {cn > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="text-xs px-2 py-1 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        >
                          💰 Trả
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
