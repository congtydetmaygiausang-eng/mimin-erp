// ============ 3 MODAL CONG NO ============
// Tach tu page.tsx (2026-08-05 - toi uu B.5)

import { useState, useEffect, useMemo } from "react";
import { X, CreditCard, Plus, Scissors, AlertTriangle, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePhanCong, layDanhSachNguoiPT, type PhanCongCongDoan, type CongDoanKey } from "@/lib/data/cong-no-store";
import { tinhCongNo } from "@/lib/data/cong-no";
import { formatVNDShort } from "@/lib/data/real-data";
import { CONG_DOAN_OPTIONS, STATUS_STYLE } from "../data";

// ============ MODAL THANH TOAN ============
export function ModalThanhToan({ pc, onClose, onSubmit }: { pc: PhanCongCongDoan; onClose: () => void; onSubmit: (soTien: number, ghiChu?: string) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const [soTien, setSoTien] = useState("");
  const [ghiChu, setGhiChu] = useState("");

  const thanhTien = pc.donGiaGiao * pc.soLuongGiao;
  const conNo = thanhTien - pc.daThanhToan;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tien = Number(soTien);
    if (!tien || tien <= 0) {
      toast.error("Vui lòng nhập số tiền > 0");
      return;
    }
    if (tien > conNo) {
      toast.error(`Số tiền vượt quá công nợ (${conNo.toLocaleString()}đ)`);
      return;
    }
    onSubmit(tien, ghiChu);
  };

  const quickAmounts = [Math.round(conNo / 2), conNo, 1000000, 5000000, 10000000].filter((x) => x > 0 && x <= conNo);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            Tạo thanh toán
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-brand-500/10 rounded-lg p-3 mb-4 text-sm space-y-1">
          <div><b>Mã PC:</b> <span className="font-mono">{pc.id}</span></div>
          <div><b>Người nhận:</b> {pc.nguoiPhuTrach.ten.split(" (")[0]} ({pc.nguoiPhuTrach.ma})</div>
          <div><b>Công đoạn:</b> {pc.congDoan} - Lệnh cắt {pc.lenhCatId}</div>
          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-brand-500/20">
            <div>
              <div className="text-[10px] opacity-70">Thành tiền</div>
              <div className="font-bold text-xs">{thanhTien.toLocaleString()}đ</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Đã trả</div>
              <div className="font-bold text-xs text-emerald-600">{pc.daThanhToan.toLocaleString()}đ</div>
            </div>
            <div>
              <div className="text-[10px] opacity-70">Còn nợ</div>
              <div className="font-bold text-xs text-red-600">{conNo.toLocaleString()}đ</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1">Số tiền thanh toán (đ) <span className="text-red-600">*</span></label>
            <input
              type="number"
              required
              min={1}
              max={conNo}
              className="input w-full"
              placeholder="VD: 5000000"
              value={soTien}
              onChange={(e) => setSoTien(e.target.value)}
            />
            {quickAmounts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-[10px] opacity-60">Nhanh:</span>
                {quickAmounts.map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setSoTien(String(amt))}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/40 hover:bg-white/60"
                  >
                    {amt >= 1000000 ? `${(amt / 1000000).toFixed(amt % 1000000 === 0 ? 0 : 1)}tr` : `${amt / 1000}k`}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú (tuỳ chọn)</label>
            <textarea
              className="input w-full min-h-[60px]"
              placeholder="VD: Tạm ứng đợt 2, Thanh toán khi giao hàng..."
              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1">Xác nhận thanh toán</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ MODAL PHAN CONG MOI ============
export function ModalPhanCongMoi({ onClose, onSubmit }: { onClose: () => void; onSubmit: (pc: Omit<PhanCongCongDoan, "id">) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dsNguoi = useMemo(() => layDanhSachNguoiPT(), []);
  const [form, setForm] = useState({
    lenhCatId: "",
    congDoan: "May áo" as CongDoanKey,
    nguoiMa: dsNguoi[0]?.ma || "",
    donGiaGiao: 0,
    soLuongGiao: 0,
    donVi: "bộ",
    ngayGiao: new Date().toISOString().split("T")[0],
    ngayXongDuKien: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    trangThai: "Chờ giao" as PhanCongCongDoan["trangThai"],
    ghiChu: "",
  });

  const nguoiSelected = dsNguoi.find((n) => n.ma === form.nguoiMa);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nguoiSelected) {
      toast.error("Vui lòng chọn người phụ trách");
      return;
    }
    if (form.donGiaGiao <= 0 || form.soLuongGiao <= 0) {
      toast.error("Đơn giá và số lượng phải > 0");
      return;
    }
    onSubmit({
      lenhCatId: form.lenhCatId,
      congDoan: form.congDoan,
      nguoiPhuTrach: nguoiSelected,
      donGiaGiao: form.donGiaGiao,
      soLuongGiao: form.soLuongGiao,
      donVi: form.donVi,
      ngayGiao: form.ngayGiao,
      ngayXongDuKien: form.ngayXongDuKien,
      trangThai: form.trangThai,
      daThanhToan: 0,
      ghiChu: form.ghiChu,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-brand-500" />
            Tạo phân công mới
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Lệnh cắt <span className="text-red-600">*</span></label>
              <input className="input w-full" required value={form.lenhCatId} onChange={(e) => setForm({ ...form, lenhCatId: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Công đoạn <span className="text-red-600">*</span></label>
              <select className="input w-full" value={form.congDoan} onChange={(e) => setForm({ ...form, congDoan: e.target.value as CongDoanKey })}>
                {CONG_DOAN_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Người phụ trách <span className="text-red-600">*</span></label>
            <select className="input w-full" required value={form.nguoiMa} onChange={(e) => setForm({ ...form, nguoiMa: e.target.value })}>
              <option value="">-- Chọn NV/Đối tác --</option>
              <optgroup label="Nhân viên nội bộ">
                {dsNguoi.filter((n) => n.loai === "Nhân viên nội bộ").map((n) => (
                  <option key={n.ma} value={n.ma}>{n.ten} - {n.ma}</option>
                ))}
              </optgroup>
              <optgroup label="Đối tác gia công">
                {dsNguoi.filter((n) => n.loai === "Đối tác gia công").map((n) => (
                  <option key={n.ma} value={n.ma}>{n.ten} - {n.ma}</option>
                ))}
              </optgroup>
            </select>
            {nguoiSelected && (
              <div className="text-[10px] opacity-60 mt-1">
                📞 {nguoiSelected.sdt || "Không có SĐT"} · Loại: {nguoiSelected.loai}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Số lượng <span className="text-red-600">*</span></label>
              <input type="number" required min={1} className="input w-full" value={form.soLuongGiao} onChange={(e) => setForm({ ...form, soLuongGiao: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Đơn vị</label>
              <select className="input w-full" value={form.donVi} onChange={(e) => setForm({ ...form, donVi: e.target.value })}>
                <option value="bộ">Bộ</option>
                <option value="áo">Áo</option>
                <option value="quần">Quần</option>
                <option value="cái">Cái</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Đơn giá (đ) <span className="text-red-600">*</span></label>
              <input type="number" required min={1} className="input w-full" value={form.donGiaGiao} onChange={(e) => setForm({ ...form, donGiaGiao: Number(e.target.value) })} />
            </div>
          </div>

          <div className="bg-brand-500/10 rounded p-2 text-sm">
            <span className="opacity-70">Thành tiền ước tính:</span>{" "}
            <b className="text-brand-700">{(form.donGiaGiao * form.soLuongGiao).toLocaleString()}đ</b>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Ngày giao <span className="text-red-600">*</span></label>
              <input type="date" required className="input w-full" value={form.ngayGiao} onChange={(e) => setForm({ ...form, ngayGiao: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Ngày xong dự kiến <span className="text-red-600">*</span></label>
              <input type="date" required className="input w-full" value={form.ngayXongDuKien} onChange={(e) => setForm({ ...form, ngayXongDuKien: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Trạng thái</label>
            <select className="input w-full" value={form.trangThai} onChange={(e) => setForm({ ...form, trangThai: e.target.value as PhanCongCongDoan["trangThai"] })}>
              <option value="Chờ giao">Chờ giao</option>
              <option value="Đang làm">Đang làm</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Ghi chú</label>
            <textarea className="input w-full min-h-[60px]" placeholder="Ghi chú thêm..." value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} />
          </div>

          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Huỷ</button>
            <button type="submit" className="btn-primary flex-1">Tạo phân công</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============ MODAL LENH CAT ============
export function ModalLenhCat({ lenhCatId, onClose, onThanhToan, isLate }: { lenhCatId: string; onClose: () => void; onThanhToan: (p: PhanCongCongDoan) => void; isLate: (p: PhanCongCongDoan) => boolean }) {
  const { layTheoLenh } = usePhanCong();
  const ds = layTheoLenh(lenhCatId);
  const tong = tinhCongNo(ds);
  const ngayHomNay = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Scissors className="w-5 h-5 text-brand-500" />
            Phân công & Công nợ: {lenhCatId}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/40 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-brand-500/10 rounded p-3">
            <div className="text-xs opacity-70">Tổng thành tiền</div>
            <div className="text-lg font-bold">{formatVNDShort(tong.tongThanhTien)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded p-3">
            <div className="text-xs opacity-70">Đã thanh toán</div>
            <div className="text-lg font-bold text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</div>
          </div>
          <div className="bg-red-500/10 rounded p-3">
            <div className="text-xs opacity-70">Còn nợ</div>
            <div className="text-lg font-bold text-red-600">{formatVNDShort(tong.tongConNo)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-white/30 dark:bg-white/5" style={{ borderColor: "var(--border)" }}>
                <th className="p-2">#</th>
                <th className="p-2">Công đoạn</th>
                <th className="p-2">Người PT</th>
                <th className="p-2 text-right">SL</th>
                <th className="p-2 text-right">Đơn giá</th>
                <th className="p-2 text-right">Thành tiền</th>
                <th className="p-2 text-right">Đã TT</th>
                <th className="p-2 text-right">Còn nợ</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {ds.map((p, i) => {
                const tt = p.donGiaGiao * p.soLuongGiao;
                const cn = tt - p.daThanhToan;
                const late = isLate(p);
                const s = STATUS_STYLE[p.trangThai];
                return (
                  <tr key={p.id} className={`border-b ${late ? "bg-red-500/5" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <td className="p-2 text-xs opacity-60">{i + 1}</td>
                    <td className="p-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-700 font-medium">
                        {p.congDoan}
                      </span>
                      {late && <AlertTriangle className="w-3 h-3 text-red-600 inline ml-1" />}
                    </td>
                    <td className="p-2 text-xs">
                      <div className="font-medium">{p.nguoiPhuTrach.ten.split(" (")[0]}</div>
                      <div className="text-[10px] opacity-60 font-mono">{p.nguoiPhuTrach.ma}</div>
                    </td>
                    <td className="p-2 text-right text-xs">{p.soLuongGiao.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono">{p.donGiaGiao.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono font-semibold">{tt.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono text-emerald-600">{p.daThanhToan.toLocaleString()}</td>
                    <td className="p-2 text-right text-xs font-mono font-semibold text-red-600">{cn > 0 ? cn.toLocaleString() : "✓"}</td>
                    <td className="p-2">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${s.bg} ${s.color}`}>
                        {p.trangThai}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {cn > 0 && (
                        <button
                          onClick={() => onThanhToan(p)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25"
                        >
                          Trả
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-brand-500/10 font-bold text-xs">
                <td colSpan={5} className="p-2 text-right">TỔNG</td>
                <td className="p-2 text-right">{formatVNDShort(tong.tongThanhTien)}</td>
                <td className="p-2 text-right text-emerald-600">{formatVNDShort(tong.tongDaThanhToan)}</td>
                <td className="p-2 text-right text-red-600">{formatVNDShort(tong.tongConNo)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="text-xs opacity-60 mt-3 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Ngày hôm nay: {ngayHomNay}
        </div>
      </div>
    </div>
  );
}
