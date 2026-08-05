// ============ NHAP KHO SCREENS ============
// Tach tu page.tsx (2026-08-05 - toi uu B.1)
// 2. Nhap kho soi, 3. Kho soi, 6. Kho vai moc, 9. Kho vai TP

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Boxes, Lock } from "lucide-react";
import {
  nhapKhoSoi_V2, nhapKhoVaiTP,
  getAllPhieuNhapSoi, getAllLoVaiTP, KHU_KHO_TP,
  type PhieuNhapSoi, type LoVaiTP,
} from "@/lib/yarn-production-chain";
import { Field, FormulaBlock } from "./ui-blocks";

// ============ 2. NHAP KHO SOI ============
export function NhapSoi({ user, onSuccess }: { user: any; onSuccess?: () => void }) {
  const [ncc, setNcc] = useState("Cty Sợi Việt Nam");
  const [loaiSoi, setLoaiSoi] = useState("SOI-COTTON-30");
  const [tenSoi, setTenSoi] = useState("Sợi cotton 30s");
  const [maLoSoi, setMaLoSoi] = useState("LSOI-001");
  const [soKg, setSoKg] = useState(1000);
  const [donGia, setDonGia] = useState(145000);
  const [daThanhToan, setDaThanhToan] = useState(0);
  const [khoNhap, setKhoNhap] = useState("Kho Sợi");
  const [nguoiPhuTrach, setNguoiPhuTrach] = useState("");
  const [ngayNhap, setNgayNhap] = useState(new Date().toISOString().slice(0, 10));
  const [ghiChu, setGhiChu] = useState("");
  const [list, setList] = useState<PhieuNhapSoi[]>([]);

  useEffect(() => { setList(getAllPhieuNhapSoi()); }, []);

  const thanhTien = useMemo(() => soKg * donGia, [soKg, donGia]);
  const conNo = useMemo(() => thanhTien - daThanhToan, [thanhTien, daThanhToan]);

  const handleSave = useCallback(() => {
    const r = nhapKhoSoi_V2({
      ngayNhap, nccId: ncc, tenNCC: ncc,
      loaiSoi, tenSoi, maLoSoi, soKg, donGia,
      daThanhToan, khoNhap, nguoiPhuTrach, ghiChu, khoa: false,
    } as any, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllPhieuNhapSoi());
      onSuccess?.();
      setSoKg(0); setDonGia(0); setDaThanhToan(0);
    } else toast.error(r.message);
  }, [ngayNhap, ncc, loaiSoi, tenSoi, maLoSoi, soKg, donGia, daThanhToan, khoNhap, nguoiPhuTrach, ghiChu, user, onSuccess]);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Plus className="w-5 h-5 text-blue-500" /> 2. Nhập kho sợi
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="NCC" value={ncc} onChange={setNcc} />
        <Field label="Loại sợi" value={loaiSoi} onChange={setLoaiSoi} />
        <Field label="Tên sợi" value={tenSoi} onChange={setTenSoi} />
        <Field label="Mã lô sợi" value={maLoSoi} onChange={setMaLoSoi} />
        <Field label="Số kg" value={soKg} onChange={setSoKg} type="number" />
        <Field label="Đơn giá (VNĐ/kg)" value={donGia} onChange={setDonGia} type="number" />
        <Field label="Đã thanh toán" value={daThanhToan} onChange={setDaThanhToan} type="number" />
        <Field label="Kho nhập" value={khoNhap} onChange={setKhoNhap} />
        <Field label="Người phụ trách" value={nguoiPhuTrach} onChange={setNguoiPhuTrach} />
        <Field label="Ngày nhập" value={ngayNhap} onChange={setNgayNhap} type="date" />
      </div>
      <Field label="Ghi chú" value={ghiChu} onChange={setGhiChu} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-500/30">
        <FormulaBlock label="Thành tiền" formula={`${soKg} × ${donGia.toLocaleString()}`} value={thanhTien.toLocaleString() + "đ"} color="blue" />
        <FormulaBlock label="Đã thanh toán" formula="nhập" value={daThanhToan.toLocaleString() + "đ"} color="emerald" />
        <FormulaBlock label="Còn công nợ" formula={`${thanhTien.toLocaleString()} - ${daThanhToan.toLocaleString()}`} value={conNo.toLocaleString() + "đ"} color="rose" />
      </div>

      <button onClick={handleSave} className="btn-primary w-full py-3 bg-blue-500 hover:bg-blue-600 text-base">
        ✅ Lưu phiếu nhập + Tăng kho sợi + Tạo công nợ NCC
      </button>

      <div className="overflow-x-auto">
        <h4 className="font-semibold mb-2 text-sm">📋 Phiếu nhập ({list.length})</h4>
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã phiếu</th>
              <th className="p-2 text-left">Lô</th>
              <th className="p-2 text-left">Sợi</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Thành tiền</th>
              <th className="p-2 text-right">Đã TT</th>
              <th className="p-2 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono">{p.id}</td>
                <td className="p-2 font-mono">{p.maLoSoi}</td>
                <td className="p-2">{p.tenSoi}</td>
                <td className="p-2 text-right">{p.soKg}</td>
                <td className="p-2 text-right font-semibold">{(p.thanhTien / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right text-emerald-600">{(p.daThanhToan / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right text-rose-600">{(p.conCongNo / 1_000_000).toFixed(2)}tr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 3. KHO SOI ============
export function KhoSoi() {
  const [loSois, setLoSois] = useState<any[]>([]);
  useEffect(() => {
    setLoSois(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]"));
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Boxes className="w-5 h-5 text-indigo-500" /> 3. Kho sợi ({loSois.length} lô)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô</th>
              <th className="p-2 text-left">Loại sợi</th>
              <th className="p-2 text-left">NCC</th>
              <th className="p-2 text-right">Ban đầu</th>
              <th className="p-2 text-right">Còn lại</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {loSois.map((l: any) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono text-xs">{l.maLoSoi}</td>
                <td className="p-2 text-xs">{l.tenSoi}</td>
                <td className="p-2 text-xs">{l.nhaCungCap}</td>
                <td className="p-2 text-right">{l.soKgBanDau}kg</td>
                <td className="p-2 text-right font-semibold">{l.soKgConLai}kg</td>
                <td className="p-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${l.trangThai === "Tồn kho" ? "bg-emerald-500" : "bg-slate-500"}`}>
                    {l.trangThai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 6. KHO VAI MOC ============
export function KhoMoc() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]")); }, []);

  return (
    <div className="card p-4 space-y-3">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Boxes className="w-5 h-5 text-fuchsia-500" /> 6. Kho vải mộc ({list.length} lô)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô mộc</th>
              <th className="p-2 text-left">Lệnh dệt</th>
              <th className="p-2 text-left">Loại vải</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Cây</th>
              <th className="p-2 text-right">Kg lỗi</th>
              <th className="p-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.maLoMoc}</td>
                <td className="p-2 font-mono text-blue-600">{l.maLenhDet}</td>
                <td className="p-2">{l.loaiVai}</td>
                <td className="p-2 text-right">{l.soKg}kg</td>
                <td className="p-2 text-right">{l.soCay}</td>
                <td className="p-2 text-right text-rose-600">{l.soKgLoi}kg</td>
                <td className="p-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-white ${l.trangThai === "Chờ nhuộm" ? "bg-blue-500" : "bg-rose-500"}`}>
                    {l.trangThai}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ 9. KHO VAI TP ============
export function KhoTP({ user }: { user: any }) {
  const [list, setList] = useState<LoVaiTP[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    meNhuomId: "MN_001",
    nghiemThuMauId: "NTM_001",
    loaiVai: "Vải thun cotton 4 chiều",
    mau: "Trắng",
    maMau: "M-TRANG-001",
    maLo: "LTP-001-TRANG",
    kho: "Kho Vải TP",
    khu: "Khu A",
    ke: "A03",
    tang: "Tầng 2",
    viTri: "Vị trí 1",
    trangThaiChatLuong: "Đạt" as const,
    nguoiPhuTrach: "",
    ghiChu: "",
    giaVonPerKg: 200000,
    danhSachCay: [
      { stt: 1, kg: 19.6 }, { stt: 2, kg: 20.3 }, { stt: 3, kg: 18.9 },
    ] as { stt: number; kg: number }[],
  });

  useEffect(() => { setList(getAllLoVaiTP()); }, []);

  const tongKg = useMemo(() => form.danhSachCay.reduce((s, c) => s + c.kg, 0), [form.danhSachCay]);

  const handleSave = useCallback(() => {
    const r = nhapKhoVaiTP(form, user);
    if (r.ok) {
      toast.success(r.message);
      setList(getAllLoVaiTP());
      setShowForm(false);
    } else toast.error(r.message);
  }, [form, user]);

  const updateCay = useCallback((idx: number, kg: number) => {
    setForm((prev) => {
      const newCay = [...prev.danhSachCay];
      newCay[idx] = { ...newCay[idx], kg };
      return { ...prev, danhSachCay: newCay };
    });
  }, []);

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Boxes className="w-5 h-5 text-emerald-500" /> 9. Kho vải TP ({list.length} lô)
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs bg-emerald-500 hover:bg-emerald-600">
          <Plus className="w-3.5 h-3.5 inline" /> Nhập lô vải
        </button>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Field label="Mã lô vải TP" value={form.maLo} onChange={(v: any) => setForm({ ...form, maLo: v })} />
            <Field label="Loại vải" value={form.loaiVai} onChange={(v: any) => setForm({ ...form, loaiVai: v })} />
            <Field label="Màu" value={form.mau} onChange={(v: any) => setForm({ ...form, mau: v })} />
            <Field label="Mã màu" value={form.maMau} onChange={(v: any) => setForm({ ...form, maMau: v })} />
            <Field label="Giá vốn/kg" value={form.giaVonPerKg} onChange={(v: any) => setForm({ ...form, giaVonPerKg: Number(v) })} type="number" />
            <div>
              <label className="text-xs font-semibold">Kho</label>
              <select value={form.kho} onChange={(e) => setForm({ ...form, kho: e.target.value })} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO_TP).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold">Khu (theo trạng thái)</label>
              <select value={form.khu} onChange={(e) => setForm({ ...form, khu: e.target.value })} className="w-full mt-1 px-3 py-2 rounded border">
                {Object.keys(KHU_KHO_TP[form.kho as keyof typeof KHU_KHO_TP] || {}).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <Field label="Kệ" value={form.ke} onChange={(v: any) => setForm({ ...form, ke: v })} />
            <Field label="Tầng" value={form.tang} onChange={(v: any) => setForm({ ...form, tang: v })} />
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-2">📦 Quản lý từng cây (không chỉ chia INT):</div>
            {form.danhSachCay.map((c, idx) => (
              <div key={c.stt} className="grid grid-cols-3 gap-1.5 mb-1.5 text-xs">
                <div className="flex items-center">Cây {String(c.stt).padStart(2, "0")}</div>
                <input type="number" step="0.1" value={c.kg} onChange={(e) => updateCay(idx, parseFloat(e.target.value))} className="px-2 py-1 rounded border text-right" />
                <div className="opacity-70 flex items-center">kg</div>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, danhSachCay: [...form.danhSachCay, { stt: form.danhSachCay.length + 1, kg: 20 }] })} className="text-xs text-blue-600">+ Thêm cây</button>
            <div className="mt-2 text-sm">Tổng: <strong>{tongKg.toFixed(1)}kg</strong> · {(tongKg * form.giaVonPerKg).toLocaleString()}đ</div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full bg-emerald-500">✅ Nhập kho + Khóa giá vốn</button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">Mã lô</th>
              <th className="p-2 text-left">Màu</th>
              <th className="p-2 text-right">Kg</th>
              <th className="p-2 text-right">Cây</th>
              <th className="p-2 text-right">Giá vốn/kg</th>
              <th className="p-2 text-right">Tổng GT</th>
              <th className="p-2 text-left">Vị trí</th>
              <th className="p-2 text-center">Khóa</th>
            </tr>
          </thead>
          <tbody>
            {list.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="p-2 font-mono">{l.maLo}</td>
                <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700">{l.mau}</span></td>
                <td className="p-2 text-right">{l.tongKg.toFixed(1)}</td>
                <td className="p-2 text-right">{l.danhSachCay.length}</td>
                <td className="p-2 text-right font-bold text-emerald-600">{l.giaVonPerKg.toFixed(0)}đ</td>
                <td className="p-2 text-right">{(l.tongGiaTri / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-xs">{l.khu}/{l.ke}/{l.tang}</td>
                <td className="p-2 text-center">
                  {l.khoa ? <Lock className="w-3 h-3 text-rose-500 inline" /> : <span className="text-amber-500">⚠</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
