// ============ SAN XUAT SCREENS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)
// 4. Lenh det, 5. Nghiem thu vai moc, 7. Me nhuom, 8. Nghiem thu vai mau

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Truck, CheckCircle2, Palette } from "lucide-react";
import {
  taoLenhDet, capNhatTrangThaiLenhDet, nghiemThuDet_V2,
  taoMeNhuom, nghiemThuMau_V2,
  getAllLenhDet, getAllMeNhuom,
  type LenhDet, type MeNhuom, type MauNhuom, type NghiemThuMau,
} from "@/lib/yarn-production-chain";
import { Field } from "./ui-blocks";

// ============ 4. LENH DET ============
export function LenhDet({ user }: { user: any }) {
  const [list, setList] = useState<LenhDet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongDet: "DNT Dệt Bắc Ninh",
    maLoSoi: "LSOI-001",
    loaiSoi: "SOI-COTTON-30",
    soKgGiao: 1000,
    donGiaDet: 8000,
    nguoiPhuTrach: "",
    ghiChu: "",
  });

  useEffect(() => { setList(getAllLenhDet()); }, []);

  const handleTao = useCallback(() => {
    const r = taoLenhDet({ ...form, tienDuKien: form.soKgGiao * form.donGiaDet, soMetDuKien: form.soKgGiao * 4 }, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllLenhDet());
      setShowForm(false);
    } else toast.error(r.message);
  }, [form, user]);

  const handleCapNhatTrangThai = useCallback((id: string, trangThai: string) => {
    capNhatTrangThaiLenhDet(id, trangThai as any, user);
    setList(getAllLenhDet());
    toast.success("Đã cập nhật");
  }, [user]);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Truck className="w-5 h-5 text-violet-500" /> 4. Lệnh dệt ({list.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-violet-500 hover:bg-violet-600">
          + Tạo lệnh dệt
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Ngày giao" value={form.ngayGiao} onChange={(v: any) => setForm({ ...form, ngayGiao: v })} type="date" />
            <Field label="Ngày dự kiến nhận" value={form.ngayDuKienNhan} onChange={(v: any) => setForm({ ...form, ngayDuKienNhan: v })} type="date" />
            <Field label="Xưởng dệt" value={form.xuongDet} onChange={(v: any) => setForm({ ...form, xuongDet: v })} />
            <Field label="Lô sợi" value={form.maLoSoi} onChange={(v: any) => setForm({ ...form, maLoSoi: v })} />
            <Field label="Kg giao" value={form.soKgGiao} onChange={(v: any) => setForm({ ...form, soKgGiao: Number(v) })} type="number" />
            <Field label="Đơn giá dệt/kg" value={form.donGiaDet} onChange={(v: any) => setForm({ ...form, donGiaDet: Number(v) })} type="number" />
            <Field label="Người phụ trách" value={form.nguoiPhuTrach} onChange={(v: any) => setForm({ ...form, nguoiPhuTrach: v })} />
          </div>
          <div className="text-sm p-2 rounded bg-white dark:bg-slate-800">
            Tiền dệt dự kiến: <strong>{(form.soKgGiao * form.donGiaDet).toLocaleString()}đ</strong>
          </div>
          <button onClick={handleTao} className="btn-primary w-full bg-violet-500">✅ Tạo lệnh dệt + Giảm kho sợi</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã LD</th>
              <th className="p-2 text-left">Xưởng</th>
              <th className="p-2 text-right">Kg sợi</th>
              <th className="p-2 text-right">Kg mộc</th>
              <th className="p-2 text-right">Hao hụt</th>
              <th className="p-2 text-right">Tiền dệt</th>
              <th className="p-2 text-center">Trạng thái</th>
              <th className="p-2 text-center">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.id}</td>
                <td className="p-2">{l.xuongDet}</td>
                <td className="p-2 text-right">{l.soKgGiao}</td>
                <td className="p-2 text-right">{l.soKgMocNhan || "-"}</td>
                <td className="p-2 text-right text-rose-600">{l.haoHutPt ? `${l.haoHutPt.toFixed(1)}%` : "-"}</td>
                <td className="p-2 text-right">{(l.soKgGiao * l.donGiaDet / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-center">
                  <span className="px-1.5 py-0.5 rounded text-white bg-blue-500 text-[10px]">{l.trangThai}</span>
                </td>
                <td className="p-2 text-center">
                  <select
                    value={l.trangThai}
                    onChange={(e) => handleCapNhatTrangThai(l.id, e.target.value)}
                    className="text-[10px] px-1 py-0.5 rounded border"
                  >
                    {["Nháp", "Đã giao sợi", "Đang dệt", "Chờ nghiệm thu", "Hoàn thành", "Hủy"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 5. NGHIEM THU VAI MOC ============
export function NghiemThuMoc({ user }: { user: any }) {
  const [list, setList] = useState<LenhDet[]>([]);
  useEffect(() => {
    setList(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy"));
  }, []);

  const handleNghiemThu = useCallback((l: LenhDet) => {
    const kg = parseInt(prompt(`Số kg vải mộc nhận cho ${l.id} (đã giao ${l.soKgGiao}kg):`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
    if (kg > 0) {
      const cay = parseInt(prompt(`Số cây vải mộc:`, String(Math.floor(kg / 20))) || "0");
      const loi = parseInt(prompt(`Kg lỗi:`, "0") || "0");
      const phatSinh = parseInt(prompt(`Chi phí phát sinh (VNĐ):`, "0") || "0");
      const daTra = parseInt(prompt(`Đã thanh toán (VNĐ):`, "0") || "0");
      const r = nghiemThuDet_V2(l.id, {
        soKgMocNhan: kg, soCayMoc: cay, soKgLoi: loi,
        chiPhiPhatSinh: phatSinh, daThanhToan: daTra,
        khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
      }, user);
      if (r.ok) {
        toast.success(r.message);
        setList(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy"));
      } else toast.error(r.message);
    }
  }, [user]);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 5. Nghiệm thu vải mộc
      </h3>
      <p className="text-xs opacity-70">Chọn lệnh dệt → Nhập số liệu nghiệm thu → Tự động tính hao hụt + công nợ xưởng</p>

      <div className="space-y-2">
        {list.map((l) => (
          <div key={l.id} className="p-3 rounded border border-slate-200 dark:border-slate-700">
            <div className="font-mono text-sm font-bold">{l.id} - {l.xuongDet}</div>
            <div className="text-xs opacity-80">Giao: {l.soKgGiao}kg sợi {l.loaiSoi} · Đơn giá: {l.donGiaDet.toLocaleString()}đ/kg</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
              <button
                onClick={() => handleNghiemThu(l)}
                className="text-xs py-1.5 rounded bg-emerald-500 text-white"
              >
                ✅ Nghiệm thu
              </button>
              <div className="text-xs flex items-center">Đơn giá: {l.donGiaDet.toLocaleString()}đ</div>
              <div className="text-xs flex items-center">Phí DT: {(l.soKgGiao * l.donGiaDet).toLocaleString()}đ</div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="text-center text-sm opacity-60 py-4">Không có lệnh dệt chờ nghiệm thu</div>}
      </div>
    </div>
  );
}

// ============ 7. ME NHUOM (NHIEU MAU) ============
export function MeNhuom({ user }: { user: any }) {
  const [list, setList] = useState<MeNhuom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongNhuom: "Cty Nhuộm Hà Đông",
    maLoMoc: "LM-LD_001",
    nguoiPhuTrach: "",
    ghiChu: "",
    danhSachMau: [
      { mau: "Đen", soKg: 200, donGiaNhuom: 15000 },
      { mau: "Trắng", soKg: 150, donGiaNhuom: 12000 },
      { mau: "Navy", soKg: 100, donGiaNhuom: 14000 },
    ] as MauNhuom[],
  });

  useEffect(() => { setList(getAllMeNhuom()); }, []);

  const tongKg = useMemo(() => form.danhSachMau.reduce((s, m) => s + m.soKg, 0), [form.danhSachMau]);
  const tongTienDuKien = useMemo(() => form.danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0), [form.danhSachMau]);

  const handleTao = useCallback(() => {
    const r = taoMeNhuom(form, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllMeNhuom());
      setShowForm(false);
    } else toast.error(r.message);
  }, [form, user]);

  const updateMau = useCallback((idx: number, field: keyof MauNhuom, val: any) => {
    setForm((prev) => {
      const newMau = [...prev.danhSachMau];
      newMau[idx] = { ...newMau[idx], [field]: field === "soKg" || field === "donGiaNhuom" ? Number(val) : val };
      return { ...prev, danhSachMau: newMau };
    });
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Palette className="w-5 h-5 text-rose-500" /> 7. Mẻ nhuộm ({list.length})
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-rose-500 hover:bg-rose-600">
          + Tạo mẻ nhuộm
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Xưởng nhuộm" value={form.xuongNhuom} onChange={(v: any) => setForm({ ...form, xuongNhuom: v })} />
            <Field label="Lô mộc" value={form.maLoMoc} onChange={(v: any) => setForm({ ...form, maLoMoc: v })} />
            <Field label="Ngày giao" value={form.ngayGiao} onChange={(v: any) => setForm({ ...form, ngayGiao: v })} type="date" />
            <Field label="Người phụ trách" value={form.nguoiPhuTrach} onChange={(v: any) => setForm({ ...form, nguoiPhuTrach: v })} />
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-2">🎨 Danh sách màu (1 mẻ có thể nhiều màu):</div>
            {form.danhSachMau.map((m, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-1.5 mb-1.5 text-xs">
                <input value={m.mau} onChange={(e) => updateMau(idx, "mau", e.target.value)} className="px-2 py-1 rounded border" placeholder="Màu" />
                <input type="number" value={m.soKg} onChange={(e) => updateMau(idx, "soKg", e.target.value)} className="px-2 py-1 rounded border text-right" placeholder="Kg" />
                <input type="number" value={m.donGiaNhuom} onChange={(e) => updateMau(idx, "donGiaNhuom", e.target.value)} className="px-2 py-1 rounded border text-right" placeholder="đ/kg" />
                <div className="flex items-center justify-end text-xs opacity-70">
                  = {(m.soKg * m.donGiaNhuom).toLocaleString()}đ
                </div>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, danhSachMau: [...form.danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 0 }] })} className="text-xs text-blue-600">+ Thêm màu</button>
          </div>

          <div className="text-sm p-2 rounded bg-white dark:bg-slate-800">
            Tổng: <strong>{tongKg}kg</strong> · Phí dự kiến: <strong>{tongTienDuKien.toLocaleString()}đ</strong>
          </div>

          <button onClick={handleTao} className="btn-primary w-full bg-rose-500">✅ Tạo mẻ nhuộm (nhiều màu)</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã MN</th>
              <th className="p-2 text-left">Xưởng</th>
              <th className="p-2 text-left">Lô mộc</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-left">Danh sách màu</th>
              <th className="p-2 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="p-2 font-mono">{m.id}</td>
                <td className="p-2">{m.xuongNhuom}</td>
                <td className="p-2 font-mono text-blue-600">{m.maLoMoc}</td>
                <td className="p-2 text-right">{m.tongKgXuat}</td>
                <td className="p-2 text-xs">
                  {m.danhSachMau.map((x) => (
                    <span key={x.mau} className="inline-block px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 mr-1 mb-1">
                      {x.mau}: {x.soKg}kg
                    </span>
                  ))}
                </td>
                <td className="p-2 text-center text-xs">
                  <span className="px-1.5 py-0.5 rounded text-white bg-rose-500">{m.trangThai}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 8. NGHIEM THU VAI MAU (TUNG MAU RIENG) ============
export function NghiemThuMau({ user }: { user: any }) {
  const [list, setList] = useState<MeNhuom[]>([]);
  useEffect(() => { setList(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành")); }, []);

  const handleNghiemThuMau = useCallback((m: MeNhuom, x: MauNhuom) => {
    const kgNhan = parseInt(prompt(`${x.mau}: Kg vải màu nhận (đã giao ${x.soKg}kg):`, String(Math.floor(x.soKg * 0.95))) || "0");
    if (kgNhan > 0) {
      const cay = parseInt(prompt("Số cây:", String(Math.floor(kgNhan / 20))) || "0");
      const loi = parseInt(prompt("Kg lỗi:", "0") || "0");
      const hc = parseInt(prompt("Chi phí hóa chất:", "200000") || "0");
      const ht = parseInt(prompt("Chi phí hoàn thiện:", "100000") || "0");
      const ps = parseInt(prompt("Chi phí phát sinh:", "0") || "0");
      const daTra = parseInt(prompt("Đã thanh toán:", "0") || "0");
      const ds: NghiemThuMau[] = [{
        mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: kgNhan,
        soCayNhan: cay, soKgLoi: loi, donGiaNhuom: x.donGiaNhuom,
        chiPhiHoaChat: hc, chiPhiHoanThien: ht, chiPhiPhatSinh: ps, daThanhToan: daTra,
      }];
      const r = nghiemThuMau_V2(m.id, ds, m.nguoiPhuTrach || user?.name || "system", user);
      if (r.ok) {
        toast.success(r.message);
        setList(getAllMeNhuom().filter((x) => x.trangThai !== "Hoàn thành"));
      } else toast.error(r.message);
    }
  }, [user]);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <CheckCircle2 className="w-5 h-5 text-pink-500" /> 8. Nghiệm thu vải màu (từng màu riêng)
      </h3>
      <p className="text-xs opacity-70">Mỗi màu có đơn giá, sản lượng, hao hụt, giá vốn riêng</p>

      {list.map((m) => (
        <div key={m.id} className="p-3 rounded border border-slate-200 dark:border-slate-700">
          <div className="font-mono text-sm font-bold mb-1">{m.id} - {m.xuongNhuom}</div>
          <div className="text-xs opacity-80">Mẻ {m.tongKgXuat}kg mộc, {m.danhSachMau.length} màu</div>
          <div className="mt-2">
            {m.danhSachMau.map((x) => (
              <div key={x.mau} className="text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-800/50 mb-1 flex items-center justify-between">
                <span><strong>{x.mau}</strong> - {x.soKg}kg × {x.donGiaNhuom.toLocaleString()}đ/kg</span>
                <button
                  onClick={() => handleNghiemThuMau(m, x)}
                  className="text-xs px-2 py-1 rounded bg-pink-500 text-white"
                >
                  Nghiệm thu {x.mau}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      {list.length === 0 && <div className="text-center text-sm opacity-60 py-4">Không có mẻ nhuộm chờ nghiệm thu</div>}
    </div>
  );
}
