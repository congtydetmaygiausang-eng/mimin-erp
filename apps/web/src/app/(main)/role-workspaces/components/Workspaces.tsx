// ============ 7 WORKSPACE FUNCTIONS (KhoSoi, XuongDet, XuongNhuom, KhoTP, QC, KeToan, Admin) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.6)

import { useState, useEffect } from "react";
import { Sparkles, Lock, GitBranch } from "lucide-react";
import { toast } from "sonner";
import {
  nhapKhoSoi_V2, taoLenhDet, nghiemThuDet_V2, taoMeNhuom, nghiemThuMau_V2, nhapKhoVaiTP,
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom, getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type LoVaiTP, type NghiemThuMau,
} from "@/lib/yarn-production-chain";
import {
  buildMeSoiTongQuan, goiYTachLenhDet, goiYGopMeNhuom, pheDuyetQCMeSoi,
  getAllMeSoi, type MeSoiTongQuan,
} from "@/lib/yarn-me-soi-engine";
import { WorkspaceHeader, Stat, TimelineRow, LinkToMeSoi, F } from "./ui-blocks";

// ============ KHO SOI WORKSPACE ============
export function KhoSoiWorkspace({ user }: any) {
  const [loSois, setLoSois] = useState<any[]>([]);
  const [pnss, setPnss] = useState<PhieuNhapSoi[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    ncc: "Cty Sợi Việt Nam", loaiSoi: "SOI-COTTON-30", tenSoi: "Sợi cotton 30s",
    maLoSoi: "LSOI-002", soKg: 1000, donGia: 145000, daThanhToan: 0,
    khoNhap: "Kho Sợi", nguoiPhuTrach: user?.name || "Kho sợi", ghiChu: "",
  });

  const refresh = () => {
    setLoSois(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]"));
    setPnss(getAllPhieuNhapSoi());
  };
  useEffect(() => { refresh(); }, []);

  const handleNhap = () => {
    const r = nhapKhoSoi_V2({
      ...form, nccId: form.ncc, tenNCC: form.ncc, khoa: false,
    } as any, user);
    if (r.ok) {
      toast.success(r.message);
      refresh();
      setShowForm(false);
    } else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="🏭 Kho sợi" subtitle="Nhập sợi, theo dõi tồn kho theo lô, lịch sử xuất"
        color="blue" action={{ label: "+ Nhập lô sợi mới", onClick: () => setShowForm(!showForm) }} />

      {showForm && (
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 space-y-2">
          <h3 className="font-bold text-blue-700">📦 Nhập lô sợi mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Mã lô" v={form.maLoSoi} on={(v) => setForm({ ...form, maLoSoi: v })} />
            <F label="Loại sợi" v={form.loaiSoi} on={(v) => setForm({ ...form, loaiSoi: v })} />
            <F label="Tên sợi" v={form.tenSoi} on={(v) => setForm({ ...form, tenSoi: v })} />
            <F label="Số kg" v={form.soKg} on={(v) => setForm({ ...form, soKg: Number(v) })} type="number" />
            <F label="Đơn giá/kg" v={form.donGia} on={(v) => setForm({ ...form, donGia: Number(v) })} type="number" />
            <F label="NCC" v={form.ncc} on={(v) => setForm({ ...form, ncc: v })} />
          </div>
          <div className="p-2 rounded bg-white dark:bg-slate-800 text-sm">
            Thành tiền: <strong>{(form.soKg * form.donGia).toLocaleString()}đ</strong> ·
            Công nợ NCC: <strong className="text-rose-600">{form.soKg * form.donGia - form.daThanhToan}đ</strong>
          </div>
          <button onClick={handleNhap} className="btn-primary w-full bg-blue-500">✅ Lưu phiếu nhập + Tăng tồn kho</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {loSois.map((l: any) => (
          <div key={l.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono font-bold text-sm">{l.maLoSoi}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${l.trangThai === "Tồn kho" ? "bg-emerald-500" : "bg-amber-500"}`}>
                {l.trangThai}
              </span>
            </div>
            <div className="text-xs opacity-80">{l.tenSoi} - {l.nhaCungCap}</div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  style={{ width: `${(l.soKgConLai / l.soKgBanDau) * 100}%` }}
                />
              </div>
              <div className="text-xs font-semibold whitespace-nowrap">{l.soKgConLai}/{l.soKgBanDau}kg</div>
            </div>
            <LinkToMeSoi maLo={l.maLoSoi} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ XUONG DET WORKSPACE ============
export function XuongDetWorkspace({ user }: any) {
  const [lds, setLds] = useState<LenhDet[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongDet: "DNT Dệt Bắc Ninh",
    maLoSoi: "LSOI-001", loaiSoi: "SOI-COTTON-30",
    soKgGiao: 500, donGiaDet: 8000,
    nguoiPhuTrach: user?.name || "Xưởng dệt", ghiChu: "",
  });
  const [meSoiInfo, setMeSoiInfo] = useState<any>(null);
  const [goiY, setGoiY] = useState<any>(null);

  useEffect(() => { setLds(getAllLenhDet()); }, []);

  useEffect(() => {
    if (form.maLoSoi) {
      const meSoi = buildMeSoiTongQuan(form.maLoSoi);
      setMeSoiInfo(meSoi);
      const g = goiYTachLenhDet(form.maLoSoi);
      setGoiY(g);
    }
  }, [form.maLoSoi]);

  const handleTao = () => {
    const r = taoLenhDet({ ...form, tienDuKien: form.soKgGiao * form.donGiaDet, soMetDuKien: form.soKgGiao * 4 }, user);
    if (r.ok) {
      toast.success(r.message);
      setLds(getAllLenhDet());
      setShowForm(false);
    } else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="🧵 Xưởng dệt" subtitle="Nhận sợi từ kho, dệt, nghiệm thu mộc"
        color="violet" action={{ label: "+ Tạo lệnh dệt", onClick: () => setShowForm(!showForm) }} />

      {showForm && (
        <div className="card p-4 bg-violet-50 dark:bg-violet-900/20 space-y-2">
          <h3 className="font-bold text-violet-700">🚛 Tạo lệnh dệt mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Lô sợi nhận" v={form.maLoSoi} on={(v) => setForm({ ...form, maLoSoi: v })} />
            <F label="Xưởng dệt" v={form.xuongDet} on={(v) => setForm({ ...form, xuongDet: v })} />
            <F label="Kg nhận" v={form.soKgGiao} on={(v) => setForm({ ...form, soKgGiao: Number(v) })} type="number" />
            <F label="Đơn giá dệt/kg" v={form.donGiaDet} on={(v) => setForm({ ...form, donGiaDet: Number(v) })} type="number" />
            <F label="Ngày giao" v={form.ngayGiao} on={(v) => setForm({ ...form, ngayGiao: v })} type="date" />
            <F label="Ngày dự kiến" v={form.ngayDuKienNhan} on={(v) => setForm({ ...form, ngayDuKienNhan: v })} type="date" />
          </div>

          {meSoiInfo && (
            <div className="p-3 rounded bg-white dark:bg-slate-800 border border-violet-300">
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Thông tin mẻ sợi {form.maLoSoi}:
              </div>
              <div className="text-xs opacity-80">
                Tổng sợi: <strong>{meSoiInfo.phieuNhap?.soKg || 0}kg</strong> ·
                Đã dệt: <strong>{meSoiInfo.tongKgSoiDaGiao}kg</strong> ·
                Còn lại: <strong className="text-amber-600">{goiY?.kgConLai || 0}kg</strong> ·
                Trạng thái: <strong className="text-violet-600">{meSoiInfo.trangThai}</strong>
              </div>
            </div>
          )}

          {goiY && goiY.goiY.length > 0 && (
            <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300">
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> 💡 Gợi ý tách lệnh:
              </div>
              {goiY.goiY.map((g: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setForm({ ...form, soKgGiao: g.kgMoiLenh });
                    toast.success(`Đã điền ${g.kgMoiLenh}kg theo gợi ý`);
                  }}
                  className="block w-full text-left p-2 mb-1 rounded bg-white dark:bg-slate-800 hover:bg-amber-100 text-xs"
                >
                  <div className="font-semibold">{g.soLenh} lệnh × {g.kgMoiLenh}kg mỗi lệnh</div>
                  <div className="opacity-70">{g.lyDo}</div>
                  <div className="opacity-60">→ Xưởng: {g.xuongDetDeXuat.join(", ")}</div>
                </button>
              ))}
            </div>
          )}

          <div className="p-2 rounded bg-white dark:bg-slate-800 text-sm">
            Phí dệt dự kiến: <strong>{(form.soKgGiao * form.donGiaDet).toLocaleString()}đ</strong>
          </div>
          <button onClick={handleTao} className="btn-primary w-full bg-violet-500">✅ Tạo lệnh + Giảm kho sợi</button>
        </div>
      )}

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📋 Lệnh dệt của tôi ({lds.length})</h3>
        <div className="space-y-2">
          {lds.map((l) => (
            <div key={l.id} className="p-2 rounded border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold">{l.id} - {l.xuongDet}</div>
                  <div className="text-xs opacity-80">Sợi: {l.soKgGiao}kg {l.loaiSoi}</div>
                </div>
                <div className="flex gap-1">
                  {l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy" && (
                    <button
                      onClick={() => {
                        const kg = parseInt(prompt(`Số kg vải mộc nhận cho ${l.id} (đã giao ${l.soKgGiao}kg):`, String(Math.floor(l.soKgGiao * 0.92))) || "0");
                        if (kg > 0) {
                          const cay = parseInt(prompt("Số cây:", String(Math.floor(kg / 20))) || "0");
                          const r = nghiemThuDet_V2(l.id, {
                            soKgMocNhan: kg, soCayMoc: cay, soKgLoi: 0,
                            chiPhiPhatSinh: 0, daThanhToan: 0,
                            khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                          }, user);
                          if (r.ok) { toast.success(`Nghiệm thu: ${kg}kg mộc, hao hụt ${r.haoHutPt.toFixed(1)}%`); setLds(getAllLenhDet()); }
                          else toast.error(r.message);
                        }
                      }}
                      className="text-xs px-2 py-1 rounded bg-emerald-500 text-white"
                    >
                      Nghiệm thu mộc
                    </button>
                  )}
                  <span className={`text-[10px] px-2 py-1 rounded text-white ${
                    l.trangThai === "Hoàn thành" ? "bg-emerald-500" :
                    l.trangThai === "Đang dệt" ? "bg-amber-500" : "bg-blue-500"
                  }`}>
                    {l.trangThai}
                  </span>
                </div>
              </div>
              {l.haoHutPt !== undefined && (
                <div className="mt-1 text-xs">
                  Hao hụt: <strong className={l.haoHutPt > 4 ? "text-rose-600" : "text-emerald-600"}>
                    {l.haoHutPt.toFixed(1)}%
                  </strong> ({l.soKgMocNhan}/{l.soKgGiao}kg)
                </div>
              )}
              <LinkToMeSoi maLo={l.maLoSoi} small />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ XUONG NHUOM WORKSPACE ============
export function XuongNhuomWorkspace({ user }: any) {
  const [mns, setMns] = useState<MeNhuom[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<MeNhuom>({
    id: "", ngayGiao: new Date().toISOString().slice(0, 10),
    ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
    xuongNhuom: "Cty Nhuộm Hà Đông", maLoMoc: "LM-LD_001",
    tongKgXuat: 0, nguoiPhuTrach: user?.name || "Xưởng nhuộm",
    trangThai: "Đã giao mộc", ghiChu: "",
    danhSachMau: [
      { mau: "Đen", soKg: 200, donGiaNhuom: 15000 },
      { mau: "Trắng", soKg: 150, donGiaNhuom: 12000 },
    ],
  });
  const [goiY, setGoiY] = useState<any>(null);

  useEffect(() => { setMns(getAllMeNhuom()); }, []);

  useEffect(() => {
    if (form.maLoMoc) {
      const lenhId = form.maLoMoc.replace("LM-", "");
      const lds = getAllLenhDet();
      const ld = lds.find((l) => l.id === lenhId);
      if (ld) {
        const g = goiYGopMeNhuom(ld.maLoSoi);
        setGoiY(g);
      }
    }
  }, [form.maLoMoc]);

  const handleTao = () => {
    const r = taoMeNhuom(form, user);
    if (r.ok) {
      toast.success(r.message);
      setMns(getAllMeNhuom());
      setShowForm(false);
    } else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="🎨 Xưởng nhuộm" subtitle="Nhận mộc, pha màu, nghiệm thu từng màu riêng"
        color="rose" action={{ label: "+ Tạo mẻ nhuộm", onClick: () => setShowForm(!showForm) }} />

      {showForm && (
        <div className="card p-4 bg-rose-50 dark:bg-rose-900/20 space-y-2">
          <h3 className="font-bold text-rose-700">🎨 Tạo mẻ nhuộm mới</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Lô mộc nhận" v={form.maLoMoc} on={(v) => setForm({ ...form, maLoMoc: v })} />
            <F label="Xưởng nhuộm" v={form.xuongNhuom} on={(v) => setForm({ ...form, xuongNhuom: v })} />
            <F label="Ngày giao" v={form.ngayGiao} on={(v) => setForm({ ...form, ngayGiao: v })} type="date" />
          </div>

          {goiY && goiY.goiY.length > 0 && (
            <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-300">
              <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> 💡 Gợi ý gộp lô mộc:
              </div>
              {goiY.goiY.map((g: any, i: number) => (
                <div key={i} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
                  <div className="font-semibold">{g.tongKg}kg mộc → {g.soMauDeXuat} màu</div>
                  <div className="opacity-70">{g.lyDo}</div>
                  <div className="opacity-60">Gợi ý màu: {g.cacMauPhoBien.join(", ")}</div>
                  <button
                    onClick={() => {
                      const mauList = g.cacMauPhoBien.map((mau: string) => ({
                        mau, soKg: Math.floor(g.tongKg / g.cacMauPhoBien.length),
                        donGiaNhuom: 12000,
                      }));
                      setForm({ ...form, danhSachMau: mauList, tongKgXuat: g.tongKg });
                      toast.success("Đã điền danh sách màu theo gợi ý");
                    }}
                    className="text-[10px] mt-1 px-2 py-0.5 rounded bg-rose-500 text-white"
                  >
                    Áp dụng gợi ý
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-1">🎨 Danh sách màu nhuộm:</div>
            {form.danhSachMau.map((m, i) => (
              <div key={i} className="grid grid-cols-4 gap-1.5 mb-1 text-xs">
                <input value={m.mau} onChange={(e) => {
                  const newM = [...form.danhSachMau];
                  newM[i] = { ...m, mau: e.target.value };
                  setForm({ ...form, danhSachMau: newM });
                }} className="px-2 py-1 rounded border" />
                <input type="number" value={m.soKg} onChange={(e) => {
                  const newM = [...form.danhSachMau];
                  newM[i] = { ...m, soKg: Number(e.target.value) };
                  setForm({ ...form, danhSachMau: newM });
                }} className="px-2 py-1 rounded border text-right" />
                <input type="number" value={m.donGiaNhuom} onChange={(e) => {
                  const newM = [...form.danhSachMau];
                  newM[i] = { ...m, donGiaNhuom: Number(e.target.value) };
                  setForm({ ...form, danhSachMau: newM });
                }} className="px-2 py-1 rounded border text-right" />
                <div className="text-xs flex items-center opacity-70">= {(m.soKg * m.donGiaNhuom).toLocaleString()}đ</div>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, danhSachMau: [...form.danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 10000 }] })}
              className="text-xs text-blue-600">+ Thêm màu</button>
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800 text-sm">
            Tổng: <strong>{form.danhSachMau.reduce((s, m) => s + m.soKg, 0)}kg</strong> ·
            Phí nhuộm: <strong className="text-rose-600">{form.danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0).toLocaleString()}đ</strong>
          </div>

          <button onClick={handleTao} className="btn-primary w-full bg-rose-500">✅ Tạo mẻ nhuộm (nhiều màu)</button>
        </div>
      )}

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📋 Mẻ nhuộm của tôi ({mns.length})</h3>
        <div className="space-y-2">
          {mns.map((m) => (
            <div key={m.id} className="p-2 rounded border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs font-bold">{m.id} - {m.xuongNhuom}</div>
                  <div className="text-xs opacity-80">{m.tongKgXuat}kg mộc, {m.danhSachMau.length} màu</div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded text-white ${
                  m.trangThai === "Hoàn thành" ? "bg-emerald-500" :
                  m.trangThai === "Đang nhuộm" ? "bg-amber-500" : "bg-rose-500"
                }`}>
                  {m.trangThai}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {m.danhSachMau.map((x) => (
                  <span key={x.mau} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700">
                    {x.mau}: {x.soKg}kg
                  </span>
                ))}
              </div>
              {m.trangThai !== "Hoàn thành" && m.trangThai !== "Hủy" && (
                <button
                  onClick={() => {
                    const ds: NghiemThuMau[] = m.danhSachMau.map((x) => ({
                      mau: x.mau, soKgMocGiao: x.soKg,
                      soKgMauNhan: Math.floor(x.soKg * 0.95),
                      soCayNhan: Math.floor(x.soKg * 0.95 / 20),
                      soKgLoi: Math.floor(x.soKg * 0.01),
                      donGiaNhuom: x.donGiaNhuom,
                      chiPhiHoaChat: 200000, chiPhiHoanThien: 100000,
                      chiPhiPhatSinh: 0, daThanhToan: 0,
                    }));
                    const r = nghiemThuMau_V2(m.id, ds, user?.name || "system", user);
                    if (r.ok) { toast.success(r.message); setMns(getAllMeNhuom()); }
                    else toast.error(r.message);
                  }}
                  className="text-xs mt-2 px-2 py-1 rounded bg-pink-500 text-white w-full"
                >
                  Nghiệm thu từng màu
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ KHO TP WORKSPACE ============
export function KhoTPWorkspace({ user }: any) {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ngayNhap: new Date().toISOString().slice(0, 10),
    meNhuomId: "", nghiemThuMauId: "",
    loaiVai: "Vải thun cotton 4 chiều", mau: "Trắng",
    maMau: "M-TRANG-001", maLo: "LTP-001",
    kho: "Kho Vải TP", khu: "Khu A", ke: "A03", tang: "Tầng 2", viTri: "Vị trí 1",
    trangThaiChatLuong: "Đạt" as const,
    nguoiPhuTrach: user?.name || "Kho TP", ghiChu: "",
    giaVonPerKg: 200000,
    danhSachCay: [{ stt: 1, kg: 19.6 }, { stt: 2, kg: 20.3 }, { stt: 3, kg: 18.9 }],
  });

  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);

  const handleSave = () => {
    const r = nhapKhoVaiTP(form, user);
    if (r.ok) { toast.success(r.message); setLtps(getAllLoVaiTP()); setShowForm(false); }
    else toast.error(r.message);
  };

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="📦 Kho vải TP" subtitle="Nhập kho từng cây, quản lý theo Khu/Kệ/Tầng"
        color="emerald" action={{ label: "+ Nhập lô vải", onClick: () => setShowForm(!showForm) }} />

      {showForm && (
        <div className="card p-4 bg-emerald-50 dark:bg-emerald-900/20 space-y-2">
          <h3 className="font-bold text-emerald-700">📦 Nhập lô vải thành phẩm</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <F label="Mã lô" v={form.maLo} on={(v) => setForm({ ...form, maLo: v })} />
            <F label="Loại vải" v={form.loaiVai} on={(v) => setForm({ ...form, loaiVai: v })} />
            <F label="Màu" v={form.mau} on={(v) => setForm({ ...form, mau: v })} />
            <F label="Giá vốn/kg" v={form.giaVonPerKg} on={(v) => setForm({ ...form, giaVonPerKg: Number(v) })} type="number" />
            <F label="Khu" v={form.khu} on={(v) => setForm({ ...form, khu: v })} />
            <F label="Kệ" v={form.ke} on={(v) => setForm({ ...form, ke: v })} />
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-800">
            <div className="font-semibold text-sm mb-1">📦 Từng cây (không dùng INT):</div>
            {form.danhSachCay.map((c, i) => (
              <div key={i} className="grid grid-cols-3 gap-1 mb-1 text-xs">
                <div className="flex items-center">Cây {String(c.stt).padStart(2, "0")}</div>
                <input type="number" step="0.1" value={c.kg} onChange={(e) => {
                  const newC = [...form.danhSachCay];
                  newC[i] = { ...c, kg: parseFloat(e.target.value) };
                  setForm({ ...form, danhSachCay: newC });
                }} className="px-2 py-1 rounded border text-right" />
                <div className="opacity-70">kg</div>
              </div>
            ))}
            <div className="text-sm mt-2">Tổng: <strong>{form.danhSachCay.reduce((s, c) => s + c.kg, 0).toFixed(1)}kg</strong> · Giá trị: <strong>{(form.danhSachCay.reduce((s, c) => s + c.kg, 0) * form.giaVonPerKg).toLocaleString()}đ</strong></div>
          </div>

          <button onClick={handleSave} className="btn-primary w-full bg-emerald-500">✅ Nhập kho + Khóa giá vốn 🔒</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ltps.map((l) => (
          <div key={l.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-mono font-bold text-sm">{l.maLo}</div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-500" />
                <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-emerald-500">{l.trangThaiChatLuong}</span>
              </div>
            </div>
            <div className="text-xs">
              <div><strong>{l.mau}</strong> - {l.loaiVai}</div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                <div>Tổng: <strong>{l.tongKg.toFixed(1)}kg</strong></div>
                <div>Cây: <strong>{l.danhSachCay.length}</strong></div>
                <div className="text-emerald-600 font-bold">{l.giaVonPerKg.toFixed(0)}đ/kg</div>
              </div>
              <div className="opacity-70 mt-1">📍 {l.khu}/{l.ke}/{l.tang}</div>
            </div>
            <div className="mt-2 p-1.5 rounded bg-slate-50 dark:bg-slate-800/50 text-[10px]">
              {l.danhSachCay.slice(0, 3).map((c) => `Cây ${String(c.stt).padStart(2, "0")}: ${c.kg}kg`).join(" · ")}
              {l.danhSachCay.length > 3 && ` ... +${l.danhSachCay.length - 3}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ QC WORKSPACE ============
export function QCWorkspace({ user }: any) {
  const [meSois, setMeSois] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [tongQuan, setTongQuan] = useState<MeSoiTongQuan | null>(null);

  useEffect(() => { setMeSois(getAllMeSoi()); }, []);

  useEffect(() => {
    if (selected) {
      const me = buildMeSoiTongQuan(selected);
      setTongQuan(me);
    }
  }, [selected]);

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="✅ QC - Kiểm tra chất lượng mẻ sợi" subtitle="Tổng hợp toàn bộ mẻ sợi từ sợi → dệt → nhuộm → TP"
        color="amber" />

      <div className="card p-3">
        <label className="text-xs font-semibold">Chọn mẻ sợi cần QC:</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full mt-1 px-3 py-2 rounded border">
          <option value="">-- Chọn LSOI --</option>
          {meSois.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {tongQuan && (
        <div className="space-y-3">
          <div className={`card p-4 bg-gradient-to-br ${
            tongQuan.chatLuong.diem >= 80 ? "from-emerald-500/10 to-green-500/10" :
            tongQuan.chatLuong.diem >= 60 ? "from-amber-500/10 to-yellow-500/10" :
            "from-rose-500/10 to-red-500/10"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs opacity-70">Điểm chất lượng mẻ sợi</div>
                <div className="text-4xl font-bold">{tongQuan.chatLuong.diem}/100</div>
              </div>
              <div className="text-3xl font-bold">
                {tongQuan.chatLuong.xepLoai === "A" ? "🅰️" :
                 tongQuan.chatLuong.xepLoai === "B" ? "🅱️" :
                 tongQuan.chatLuong.xepLoai === "C" ? "©️" :
                 tongQuan.chatLuong.xepLoai === "Đạt" ? "✅" :
                 tongQuan.chatLuong.xepLoai === "Cảnh báo" ? "⚠️" : "❌"}
              </div>
            </div>
            <div className="text-sm">
              Trạng thái: <strong>{tongQuan.trangThai}</strong>
            </div>
          </div>

          <div className="card p-3">
            <h3 className="font-semibold text-sm mb-2">📊 Dòng chảy mẻ sợi {selected}</h3>
            <div className="space-y-1.5 text-xs">
              <TimelineRow label="1. Sợi nhập" value={`${tongQuan.phieuNhap?.soKg || 0}kg`} status="ok" />
              <TimelineRow label="2. Dệt (hao hụt)" value={`${tongQuan.tongKgMocNhan}kg (${tongQuan.haoHutDetPt.toFixed(1)}%)`}
                status={tongQuan.haoHutDetPt <= 4 ? "ok" : tongQuan.haoHutDetPt <= 10 ? "warn" : "fail"} />
              <TimelineRow label="3. Nhuộm (hao hụt)" value={`${tongQuan.tongKgMauThanhPham}kg (${tongQuan.haoHutNhuomPt.toFixed(1)}%)`}
                status={tongQuan.haoHutNhuomPt <= 3 ? "ok" : tongQuan.haoHutNhuomPt <= 5 ? "warn" : "fail"} />
              <TimelineRow label="4. Vải TP" value={`${tongQuan.tongKgTP.toFixed(1)}kg`} status="ok" />
              <TimelineRow label="Tổng hao hụt sợi → TP" value={`${tongQuan.chatLuong.tongHaoHutPt.toFixed(1)}%`}
                status={tongQuan.chatLuong.tongHaoHutPt <= 15 ? "ok" : "warn"} />
            </div>
          </div>

          <div className="card p-3">
            <h3 className="font-semibold text-sm mb-2">📋 Chi tiết</h3>
            <div className="text-xs space-y-1">
              <div>• <strong>{tongQuan.lenhDet.length} lệnh dệt</strong> cho {tongQuan.tongKgSoiDaGiao}kg sợi</div>
              <div>• <strong>{tongQuan.meNhuomList.length} mẻ nhuộm</strong> với {tongQuan.phieuNghiemThuMau.length} phiếu nghiệm thu</div>
              <div>• <strong>{tongQuan.loVaiTP.length} lô vải TP</strong>, tổng {(tongQuan.tongGiaTriTP / 1_000_000).toFixed(1)}tr</div>
            </div>
          </div>

          {!tongQuan.chatLuong.daPheDuyet && tongQuan.loVaiTP.length > 0 && (
            <div className="card p-3 bg-amber-50 dark:bg-amber-900/20">
              <h3 className="font-semibold text-sm mb-2">📝 Phê duyệt QC cuối</h3>
              <button
                onClick={() => {
                  const ghiChu = prompt("Ghi chú QC (nếu có):") || "";
                  const r = pheDuyetQCMeSoi(selected, user?.name || "QC", ghiChu);
                  if (r) {
                    toast.success(`✅ Đã phê duyệt QC. Xếp loại ${r.xepLoai}, điểm ${r.diem}/100`);
                    setTongQuan(buildMeSoiTongQuan(selected));
                  }
                }}
                className="btn-primary w-full bg-amber-500"
              >
                ✅ Phê duyệt QC mẻ sợi {selected}
              </button>
            </div>
          )}

          {tongQuan.chatLuong.daPheDuyet && (
            <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20">
              <div className="text-sm">
                ✅ Đã phê duyệt QC bởi <strong>{tongQuan.chatLuong.nguoiQC}</strong> ngày {tongQuan.chatLuong.ngayQC}
                {tongQuan.chatLuong.ghiChuQC && <div className="mt-1 text-xs opacity-80">Ghi chú: {tongQuan.chatLuong.ghiChuQC}</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ KE TOAN WORKSPACE ============
export function KeToanWorkspace() {
  const [pnss, setPnss] = useState<PhieuNhapSoi[]>([]);
  const [lds, setLds] = useState<LenhDet[]>([]);

  useEffect(() => {
    setPnss(getAllPhieuNhapSoi());
    setLds(getAllLenhDet());
  }, []);

  const tongNCC = pnss.reduce((s, p) => s + p.conCongNo, 0);
  const tongXuongDet = lds.reduce((s, l) => s + (l.congNoXuong || 0), 0);

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="💰 Kế toán" subtitle="Theo dõi công nợ NCC sợi, xưởng dệt, xưởng nhuộm"
        color="cyan" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Nợ NCC sợi" value={`${(tongNCC / 1_000_000).toFixed(1)}tr`} sub={`${pnss.length} phiếu`} color="blue" />
        <Stat label="Nợ xưởng dệt" value={`${(tongXuongDet / 1_000_000).toFixed(1)}tr`} sub={`${lds.filter((l) => l.congNoXuong).length} lệnh`} color="violet" />
        <Stat label="Tổng công nợ" value={`${((tongNCC + tongXuongDet) / 1_000_000).toFixed(1)}tr`} sub="cần thanh toán" color="rose" />
      </div>

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📋 Công nợ NCC sợi</h3>
        <table className="w-full text-xs">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">NCC</th>
              <th className="p-2 text-left">Lô sợi</th>
              <th className="p-2 text-right">Thành tiền</th>
              <th className="p-2 text-right">Còn nợ</th>
            </tr>
          </thead>
          <tbody>
            {pnss.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.tenNCC}</td>
                <td className="p-2 font-mono">{p.maLoSoi}</td>
                <td className="p-2 text-right">{(p.thanhTien / 1_000_000).toFixed(2)}tr</td>
                <td className="p-2 text-right font-bold text-rose-600">{(p.conCongNo / 1_000_000).toFixed(2)}tr</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ADMIN WORKSPACE ============
export function AdminWorkspace() {
  const [pnss] = useState(() => getAllPhieuNhapSoi());
  const [lds] = useState(() => getAllLenhDet());
  const [mns] = useState(() => getAllMeNhuom());
  const [ltps] = useState(() => getAllLoVaiTP());
  const [meSois] = useState(() => getAllMeSoi());

  return (
    <div className="space-y-3">
      <WorkspaceHeader title="🛡️ Admin - Tổng quan" subtitle="Toàn bộ mẻ sợi + cảnh báo QC"
        color="slate" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Mẻ sợi" value={meSois.length} sub="đang theo dõi" color="blue" />
        <Stat label="Phiếu nhập" value={pnss.length} sub="đã nhập" color="emerald" />
        <Stat label="Lệnh dệt" value={lds.length} sub="đang chạy" color="violet" />
        <Stat label="Mẻ nhuộm" value={mns.length} sub="đang nhuộm" color="rose" />
      </div>

      <div className="card p-3">
        <h3 className="font-semibold text-sm mb-2">📊 Tổng quan các mẻ sợi</h3>
        <div className="space-y-2">
          {meSois.slice(0, 5).map((m) => {
            const me = buildMeSoiTongQuan(m);
            if (!me) return null;
            return (
              <div key={m} className="p-2 rounded border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono font-bold text-sm">{m} - {me.phieuNhap?.tenSoi}</div>
                    <div className="text-xs opacity-80">
                      Sợi: {me.phieuNhap?.soKg}kg → Dệt: {me.tongKgMocNhan}kg → Nhuộm: {me.tongKgMauThanhPham}kg → TP: {me.tongKgTP.toFixed(1)}kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{me.chatLuong.diem}</div>
                    <div className="text-[10px] opacity-70">{me.trangThai}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
