// ============ FLOW QUICK (6 STEP) ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getAllLenhDet, getAllMeNhuom, getAllLoVaiTP,
  nghiemThuDet_V2, nghiemThuMau_V2, nhapKhoVaiTP,
  xacNhanXuongDetNhanSoi, xacNhanNhuomNhanMoc,
  type LenhDet, type MeNhuom, type MauNhuom,
  type LoVaiTP,
} from "@/lib/yarn-production-chain";
import { FLOW_STEPS, type FlowStep } from "../data";
import { ImageUploader, type UploadedFile } from "@/components/ui/ImageUploader";
import {
  getAllInventory,
  getInventoryByMaVT,
  getVaiImages,
  nhapKho,
  subscribeInventoryChanges,
  syncInventoryWithSupabase,
  updateVaiInfo,
  upsertInventoryItem,
} from "@/lib/inventory-engine";
import type { KhoVai } from "@/lib/data/real-data";
import { createFabricDyeLot } from "@/lib/data/fabric-dye-lots";

type KhoVaiWithImage = KhoVai & { imageUrl?: string };

export function FlowQuick({ user }: { user: any }) {
  const [step, setStep] = useState<FlowStep>("khosoi");

  return (
    <div className="space-y-3 p-3">
      <div className="card p-3">
        <h3 className="mb-2 text-base font-bold">Quy trình bàn giao sản xuất vải</h3>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {FLOW_STEPS.map((s) => {
            const Icon = s.i;
            return (
              <button
                key={s.k}
                onClick={() => setStep(s.k)}
                className={`p-3 rounded-lg border-2 ${
                  step === s.k ? `border-${s.c}-500 bg-${s.c}-500/10` : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <Icon className={`w-5 h-5 text-${s.c}-600 mx-auto mb-1`} />
                <div className="text-sm font-semibold">{s.l}</div>
                <div className="text-[10px] opacity-60">{s.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {step === "khosoi" && <KhoSoiStep />}
      {step === "lenhdet" && <LenhDetStep />}
      {step === "nghiemthumoc" && <NghiemThuMocStep user={user} />}
      {step === "menhuom" && <MeNhuomStep user={user} onChuyenTiep={() => setStep("nghiemthumau")} />}
      {step === "nghiemthumau" && <NghiemThuMauStep user={user} onNhapKho={() => setStep("khotp")} />}
      {step === "khotp" && <KhoTPStep />}
    </div>
  );
}

function KhoSoiStep() {
  const [list, setList] = useState<any[]>([]);
  useEffect(() => { setList(JSON.parse(localStorage.getItem("mimin_lo_soi") || "[]")); }, []);
  return (
    <div className="card p-3 bg-blue-50 dark:bg-blue-900/20">
      <h3 className="font-bold text-blue-700 mb-2">📦 Kho sợi ({list.length} lô)</h3>
      {list.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô sợi nào. Tạo lệnh tổng trước.</p>
      ) : (
        list.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="font-mono font-bold">{l.maLoSoi}</span>
              <span>{l.soKgConLai}/{l.soKgBanDau}kg</span>
            </div>
            <div className="opacity-70">{l.tenSoi}</div>
          </div>
        ))
      )}
    </div>
  );
}

function LenhDetStep() {
  const [lds, setLds] = useState(getAllLenhDet());
  const [soKgNhan, setSoKgNhan] = useState<Record<string, number>>({});
  const [chungTu, setChungTu] = useState<Record<string, UploadedFile[]>>({});
  return (
    <div className="card p-3 bg-violet-50 dark:bg-violet-900/20">
      <h3 className="font-bold text-violet-700 mb-2">🚛 Lệnh dệt ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{l.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500 text-white">{l.trangThai}</span>
          </div>
          <div className="opacity-70">{l.xuongDet} - {l.soKgGiao}kg</div>
          {l.soKgXuongXacNhan ? (
            <div className="mt-2 rounded bg-emerald-50 p-2 font-semibold text-emerald-700">
              Đã nhận {l.soKgXuongXacNhan}kg · Chênh lệch {l.haoHutBanGiaoSoiKg || 0}kg
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <ImageUploader files={chungTu[l.id] || []} onChange={(files) => setChungTu((prev) => ({ ...prev, [l.id]: files.slice(-1) }))} category={`Xuất-nhận-sợi-${l.id}`} accept="image/*,.pdf" maxSize={600 * 1024} label="Ảnh phiếu xuất kho sợi / biên bản nhận" hint="01 ảnh/PDF, tối đa 600KB" />
              <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={l.soKgGiao}
                value={soKgNhan[l.id] ?? l.soKgGiao}
                onChange={(event) => setSoKgNhan((prev) => ({ ...prev, [l.id]: Number(event.target.value) }))}
                className="min-w-0 flex-1 rounded border px-2 py-1.5"
                aria-label={`Kg sợi thực nhận ${l.id}`}
              />
              <button
                onClick={() => {
                  if (!(chungTu[l.id]?.length)) { toast.error("Vui lòng thêm ảnh chứng từ xuất/nhận sợi"); return; }
                  const result = xacNhanXuongDetNhanSoi(l.id, soKgNhan[l.id] ?? l.soKgGiao, chungTu[l.id], null);
                  result.ok ? toast.success(result.message) : toast.error(result.message);
                  if (result.ok) setLds(getAllLenhDet());
                }}
                className="rounded bg-violet-600 px-3 py-1.5 font-semibold text-white"
              >Xác nhận nhận sợi</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function chiaTrongLuongCay(tongKg: number, soCay: number): number[] {
  if (soCay <= 0) return [];
  const kgCoBan = Number((tongKg / soCay).toFixed(2));
  const rows = Array.from({ length: soCay }, () => kgCoBan);
  rows[soCay - 1] = Number((tongKg - kgCoBan * (soCay - 1)).toFixed(2));
  return rows;
}

const KG_UOC_TINH_MOI_CAY_MOC = 20;

function uocTinhSoCayMoc(soKgMoc: number): number {
  if (soKgMoc <= 0) return 0;
  return Math.max(Math.round(soKgMoc / KG_UOC_TINH_MOI_CAY_MOC), 1);
}

function NghiemThuMocStep({ user }: { user: any }) {
  const [lds, setLds] = useState(getAllLenhDet().filter((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy"));
  const [ketQua, setKetQua] = useState<Record<string, { kg: number; cay: number }>>({});
  const [chungTu, setChungTu] = useState<Record<string, UploadedFile[]>>({});
  const [trongLuongCay, setTrongLuongCay] = useState<Record<string, number[]>>({});
  const cayMocOf = (lenh: LenhDet) => {
    const kg = ketQua[lenh.id]?.kg ?? Math.floor((lenh.soKgXuongXacNhan || lenh.soKgGiao) * 0.9);
    const cay = ketQua[lenh.id]?.cay ?? uocTinhSoCayMoc(kg);
    return trongLuongCay[lenh.id] || chiaTrongLuongCay(kg, cay);
  };
  return (
    <div className="card p-3 bg-purple-50 dark:bg-purple-900/20">
      <h3 className="font-bold text-purple-700 mb-2">✅ NT mộc ({lds.length})</h3>
      {lds.map((l) => (
        <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{l.id}</div>
          <div className="opacity-70">Giao {l.soKgGiao}kg - {l.xuongDet}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label>Kg vải mộc
              <input type="number" min={0} value={ketQua[l.id]?.kg ?? Math.floor((l.soKgXuongXacNhan || l.soKgGiao) * 0.9)} onChange={(event) => {
                const kg = Number(event.target.value); const cay = uocTinhSoCayMoc(kg);
                setKetQua((prev) => ({ ...prev, [l.id]: { kg, cay } }));
                setTrongLuongCay((prev) => ({ ...prev, [l.id]: chiaTrongLuongCay(kg, cay) }));
              }} className="mt-1 w-full rounded border px-2 py-1.5" />
            </label>
            <label>Số cây mộc ước tính
              <input type="number" min={1} value={ketQua[l.id]?.cay ?? uocTinhSoCayMoc(Math.floor((l.soKgXuongXacNhan || l.soKgGiao) * 0.9))} onChange={(event) => {
                const cay = Number(event.target.value); const kg = ketQua[l.id]?.kg ?? Math.floor((l.soKgXuongXacNhan || l.soKgGiao) * 0.9);
                setKetQua((prev) => ({ ...prev, [l.id]: { kg, cay } }));
                setTrongLuongCay((prev) => ({ ...prev, [l.id]: chiaTrongLuongCay(kg, cay) }));
              }} className="mt-1 w-full rounded border px-2 py-1.5" />
              <span className="mt-1 block text-[10px] text-slate-500">Quy đổi ước tính 20 kg/cây, có thể chỉnh theo thực tế.</span>
            </label>
          </div>
          <div className="mt-2 rounded border border-purple-200 p-2">
            <div className="mb-2 flex justify-between font-bold"><span>Mã cây và trọng lượng thực tế</span><span>{cayMocOf(l).reduce((sum, kg) => sum + kg, 0).toFixed(2)}kg</span></div>
            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-4">
              {cayMocOf(l).map((kgCay, index) => (
                <label key={`${l.id}-M${index + 1}`} className="rounded bg-white p-1">{`${l.id}-M${String(index + 1).padStart(3, "0")}`}
                  <input type="number" min={0.01} step="0.01" value={kgCay} onChange={(event) => {
                    const rows = [...cayMocOf(l)]; rows[index] = Number(event.target.value); setTrongLuongCay((prev) => ({ ...prev, [l.id]: rows }));
                  }} className="mt-1 w-full rounded border px-2 py-1" />
                </label>
              ))}
            </div>
          </div>
          <div className="mt-2"><ImageUploader files={chungTu[l.id] || []} onChange={(files) => setChungTu((prev) => ({ ...prev, [l.id]: files.slice(-1) }))} category={`Dệt-giao-mộc-${l.id}`} accept="image/*,.pdf" maxSize={600 * 1024} label="Ảnh phiếu dệt hoàn thành / bàn giao vải mộc" hint="01 ảnh/PDF, tối đa 600KB" /></div>
          <button
            onClick={() => {
              if (!(chungTu[l.id]?.length)) { toast.error("Vui lòng thêm ảnh chứng từ bàn giao vải mộc"); return; }
              const kg = ketQua[l.id]?.kg ?? Math.floor((l.soKgXuongXacNhan || l.soKgGiao) * 0.9);
              const cay = ketQua[l.id]?.cay ?? uocTinhSoCayMoc(kg);
              const danhSachCayMoc = cayMocOf(l).map((kgCay, index) => ({ maCay: `${l.id}-M${String(index + 1).padStart(3, "0")}`, kg: kgCay }));
              const tongKgCay = danhSachCayMoc.reduce((sum, item) => sum + item.kg, 0);
              if (danhSachCayMoc.length !== cay || Math.abs(tongKgCay - kg) > 0.1) { toast.error(`Tổng trọng lượng từng cây phải bằng ${kg}kg`); return; }
              if (kg > 0) {
                const r = nghiemThuDet_V2(l.id, {
                  soKgMocNhan: kg, soCayMoc: cay, danhSachCayMoc, soKgLoi: 0,
                  chiPhiPhatSinh: 0, daThanhToan: 0,
                  khoMocNhap: "Kho Vải Mộc", ketQuaKiemTra: "Đạt",
                  chungTuBanGiaoMoc: chungTu[l.id],
                }, user);
                if (r.ok) { toast.success(r.message); setLds(getAllLenhDet().filter((x) => x.trangThai !== "Hoàn thành" && x.trangThai !== "Hủy")); }
              }
            }}
            className="text-xs w-full mt-1 py-1 rounded bg-purple-500 text-white"
          >
            Xác nhận kết quả dệt & bàn giao nhuộm
          </button>
          <div className="mt-1 text-[11px] font-semibold text-amber-700">
            Hao hụt dệt dự kiến: {Math.max((l.soKgXuongXacNhan || l.soKgGiao) - (ketQua[l.id]?.kg ?? Math.floor((l.soKgXuongXacNhan || l.soKgGiao) * 0.9)), 0)}kg
          </div>
        </div>
      ))}
    </div>
  );
}

interface NhanMocDraft {
  kg: number;
  cay: number;
  mau: MauNhuom[];
}

interface CayMocTrongKho { maCay: string; kg: number }

function getCayMocCuaMe(me: MeNhuom): CayMocTrongKho[] {
  if (typeof window === "undefined") return [];
  try {
    const loMoc = (JSON.parse(localStorage.getItem("mimin_lo_moc") || "[]") as Array<{ maLoMoc?: string; danhSachCay?: CayMocTrongKho[] }>).find((item) => item.maLoMoc === me.maLoMoc);
    return loMoc?.danhSachCay || [];
  } catch { return []; }
}

function taoNhanMocDraft(me: MeNhuom): NhanMocDraft {
  const kgGiao = me.soKgMocGiao || me.tongKgXuat;
  const tongCay = me.soCayMocNhan || me.soCayMocGiao || Math.max(Math.round(kgGiao / 20), me.danhSachMau.length);
  let cayDaPhan = 0;
  const cayMoc = getCayMocCuaMe(me);
  let viTriCay = 0;
  return {
    kg: me.soKgMocNhan || kgGiao,
    cay: tongCay,
    mau: me.danhSachMau.map((item, index) => {
      const soCay = index === me.danhSachMau.length - 1
        ? tongCay - cayDaPhan
        : Math.round((item.soKg / Math.max(me.tongKgXuat, 1)) * tongCay);
      cayDaPhan += soCay;
      const maCayMoc = item.maCayMoc?.length ? item.maCayMoc : cayMoc.slice(viTriCay, viTriCay + soCay).map((cay) => cay.maCay);
      viTriCay += soCay;
      const kgTheoCay = cayMoc.filter((cay) => maCayMoc.includes(cay.maCay)).reduce((sum, cay) => sum + cay.kg, 0);
      return { ...item, soCay: maCayMoc.length || soCay, soKg: kgTheoCay > 0 ? kgTheoCay : item.soKg, maCayMoc };
    }),
  };
}

function MeNhuomStep({ user, onChuyenTiep }: { user: any; onChuyenTiep: () => void }) {
  const [mns, setMns] = useState(getAllMeNhuom());
  const [drafts, setDrafts] = useState<Record<string, NhanMocDraft>>({});
  const [chungTu, setChungTu] = useState<Record<string, UploadedFile[]>>({});
  const [maMauKhoThanhPham, setMaMauKhoThanhPham] = useState<KhoVai[]>(() => getAllInventory());
  const [anhMauKho, setAnhMauKho] = useState<Record<string, string>>(() => getVaiImages());
  useEffect(() => {
    const refresh = () => {
      setMaMauKhoThanhPham(getAllInventory());
      setAnhMauKho(getVaiImages());
    };
    void syncInventoryWithSupabase().then(refresh);
    return subscribeInventoryChanges(refresh);
  }, []);
  const vaiMauOf = (mau: MauNhuom) => maMauKhoThanhPham.find((vai) =>
    (mau.maMau && (vai.maMoi || vai.maVT) === mau.maMau)
    || (!mau.maMau && (vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT) === mau.mau),
  );
  const draftOf = (me: MeNhuom) => drafts[me.id] || taoNhanMocDraft(me);
  const updateDraft = (me: MeNhuom, patch: Partial<NhanMocDraft>) => {
    setDrafts((prev) => ({ ...prev, [me.id]: { ...draftOf(me), ...patch } }));
  };
  const phanLaiCayTheoSoLuong = (me: MeNhuom, danhSachMau: MauNhuom[]): MauNhuom[] => {
    const cayMoc = getCayMocCuaMe(me);
    if (cayMoc.length === 0) return danhSachMau;
    let viTriBatDau = 0;
    return danhSachMau.map((item) => {
      const soCayCanPhan = Math.max(Math.round(item.soCay || 0), 0);
      const dsCay = cayMoc.slice(viTriBatDau, viTriBatDau + soCayCanPhan);
      viTriBatDau += soCayCanPhan;
      return {
        ...item,
        soCay: dsCay.length,
        maCayMoc: dsCay.map((cay) => cay.maCay),
      };
    });
  };
  const capNhatPhanMau = (me: MeNhuom, index: number, patch: Partial<MauNhuom>, phanLaiCay = false) => {
    const danhSachMau = draftOf(me).mau.map((item, i) => i === index ? { ...item, ...patch } : item);
    const danhSachMauDongBo = danhSachMau.map((item) => {
      if (!item.maMau) return item;
      const vai = maMauKhoThanhPham.find((record) => (record.maMoi || record.maVT) === item.maMau);
      return vai
        ? { ...item, mau: vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT }
        : item;
    });
    const mauDaCapNhat = phanLaiCay ? phanLaiCayTheoSoLuong(me, danhSachMauDongBo) : danhSachMauDongBo;
    updateDraft(me, {
      mau: mauDaCapNhat,
      kg: Number(mauDaCapNhat.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0).toFixed(2)),
      cay: mauDaCapNhat.reduce((sum, item) => sum + Math.max(item.soCay || 0, 0), 0),
    });
  };
  return (
    <div className="card p-3 bg-rose-50 dark:bg-rose-900/20">
      <h3 className="font-bold text-rose-700 mb-2">🎨 Mẻ nhuộm ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="flex justify-between">
            <span className="font-mono font-bold">{m.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500 text-white">{m.trangThai}</span>
          </div>
          <div className="opacity-70">{m.xuongNhuom} - {m.tongKgXuat}kg - {m.danhSachMau.length} màu</div>
          {m.soKgMocNhan ? (
            <div className="mt-2 rounded bg-emerald-50 p-2 font-semibold text-emerald-700">
              Đã nhận {m.soKgMocNhan}kg/{m.soCayMocNhan} cây · {m.danhSachMau.length} màu
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <label>Tổng kg mộc theo màu<input type="number" min={0} value={draftOf(m).kg} readOnly className="mt-1 w-full rounded border bg-slate-100 px-2 py-1.5 font-semibold" /></label>
                <label>Tổng số cây tự tính<input type="number" min={0} value={draftOf(m).cay} readOnly className="mt-1 w-full rounded border bg-slate-100 px-2 py-1.5 font-semibold" /></label>
              </div>
              <div className="rounded border border-rose-200 p-2">
                <div className="mb-1 grid grid-cols-[56px_1fr_100px_90px] items-end gap-2 font-bold">
                  <span />
                  <span>Phân toàn bộ cây mộc theo màu</span>
                  <span className="text-right text-[10px] text-slate-500">Kg theo màu</span>
                  <span className="text-right text-[10px] text-slate-500">Cây tự tính</span>
                </div>
                {draftOf(m).mau.map((mau, index) => (
                  <div key={`${m.id}-${index}`} className="mb-1 grid grid-cols-[56px_1fr_100px_90px] items-center gap-2">
                    <div className="h-14 w-14 overflow-hidden rounded-lg border bg-slate-100">
                      {(() => {
                        const vai = vaiMauOf(mau) as KhoVaiWithImage | undefined;
                        const src = vai?.imageUrl || vai?.hinhAnh || (vai ? anhMauKho[vai.maVT] : "");
                        return src ? (
                          <img src={src} alt={`Mẫu màu ${mau.maMau || mau.mau}`} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-slate-400">Chưa có ảnh</div>
                        );
                      })()}
                    </div>
                    <select
                      value={mau.maMau || maMauKhoThanhPham.find((vai) => (vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT) === mau.mau)?.maMoi || maMauKhoThanhPham.find((vai) => (vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT) === mau.mau)?.maVT || ""}
                      onChange={(event) => {
                        const vai = maMauKhoThanhPham.find((item) => (item.maMoi || item.maVT) === event.target.value);
                        if (!vai) return;
                        capNhatPhanMau(m, index, {
                          maMau: vai.maMoi || vai.maVT,
                          mau: vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT,
                        }, true);
                      }}
                      className="rounded border px-2 py-1"
                      aria-label={`Mã màu kho thành phẩm dòng ${index + 1}`}
                    >
                      <option value="">Chọn mã màu kho TP</option>
                      {maMauKhoThanhPham.map((vai) => (
                        <option key={vai.maVT} value={vai.maMoi || vai.maVT}>
                          {vai.maMoi || vai.maVT} - {vai.mauChuan || vai.mauSac || vai.tenChuan || vai.tenVT}
                        </option>
                      ))}
                    </select>
                    <input type="number" min={0} value={mau.soKg} onChange={(event) => {
                      const soKg = Number(event.target.value);
                      capNhatPhanMau(m, index, { soKg, soCay: uocTinhSoCayMoc(soKg) }, true);
                    }} className="rounded border px-2 py-1" aria-label={`Kg màu ${mau.mau}`} />
                    <input type="number" min={0} value={mau.soCay || 0} readOnly className="rounded border bg-slate-100 px-2 py-1 text-slate-600" aria-label={`Số cây tự tính màu ${mau.mau}`} />
                  </div>
                ))}
                {getCayMocCuaMe(m).length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    <div className="mb-1 font-bold">Chọn màu cho từng cây mộc</div>
                    <div className="grid max-h-64 grid-cols-1 gap-1 overflow-y-auto md:grid-cols-2">
                      {getCayMocCuaMe(m).map((cay) => {
                        const mauIndex = draftOf(m).mau.findIndex((item) => item.maCayMoc?.includes(cay.maCay));
                        const mauDaGan = draftOf(m).mau[mauIndex];
                        const vaiDaGan = mauDaGan ? vaiMauOf(mauDaGan) as KhoVaiWithImage | undefined : undefined;
                        const anhDaGan = vaiDaGan?.imageUrl || vaiDaGan?.hinhAnh || (vaiDaGan ? anhMauKho[vaiDaGan.maVT] : "");
                        return <label key={cay.maCay} className="grid grid-cols-[1fr_44px_210px] items-center gap-2 rounded bg-white p-1"><span><b>{cay.maCay}</b> · {cay.kg.toFixed(2)}kg</span>
                          <span className="h-10 w-10 overflow-hidden rounded border bg-slate-100">
                            {anhDaGan ? <img src={anhDaGan} alt={`Mẫu ${mauDaGan?.maMau || mauDaGan?.mau || "màu"}`} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[8px] text-slate-400">Chưa ảnh</span>}
                          </span>
                          <select value={mauDaGan?.maMau || ""} onChange={(event) => {
                            const nextIndex = draftOf(m).mau.findIndex((item) => item.maMau === event.target.value);
                            if (nextIndex < 0) return;
                            const nextMau = draftOf(m).mau.map((item, index) => {
                              const maCayMoc = (item.maCayMoc || []).filter((maCay) => maCay !== cay.maCay);
                              if (index === nextIndex) maCayMoc.push(cay.maCay);
                              const dsCay = getCayMocCuaMe(m).filter((cayMoc) => maCayMoc.includes(cayMoc.maCay));
                              return { ...item, maCayMoc, soCay: dsCay.length, soKg: Number(dsCay.reduce((sum, cayMoc) => sum + cayMoc.kg, 0).toFixed(2)) };
                            });
                            updateDraft(m, { mau: nextMau });
                          }} className="rounded border px-2 py-1">{draftOf(m).mau.map((item, index) => {
                            const vai = vaiMauOf(item);
                            const tenMau = vai?.mauChuan || vai?.mauSac || vai?.tenChuan || vai?.tenVT || item.mau;
                            return <option key={`${item.maMau || item.mau}-${index}`} value={item.maMau || ""}>{item.maMau ? `${item.maMau} - ${tenMau}` : tenMau}</option>;
                          })}</select>
                        </label>;
                      })}
                    </div>
                  </div>
                )}
                <div className="text-right font-semibold">
                  Đã phân {draftOf(m).mau.reduce((sum, item) => sum + item.soKg, 0)}/{draftOf(m).kg}kg · {draftOf(m).mau.reduce((sum, item) => sum + (item.soCay || 0), 0)}/{draftOf(m).cay} cây
                </div>
              </div>
              <ImageUploader files={chungTu[m.id] || []} onChange={(files) => setChungTu((prev) => ({ ...prev, [m.id]: files.slice(-1) }))} category={`Nhuộm-nhận-mộc-${m.id}`} accept="image/*,.pdf" maxSize={600 * 1024} label="Ảnh phiếu dệt giao / nhuộm nhận vải mộc" hint="01 ảnh/PDF, tối đa 600KB" />
              <button onClick={() => {
                if (!(chungTu[m.id]?.length)) { toast.error("Vui lòng thêm ảnh chứng từ nhuộm nhận mộc"); return; }
                const draft = draftOf(m);
                if (draft.mau.some((item) => !item.maMau)) { toast.error("Vui lòng chọn mã màu từ Kho vải thành phẩm cho tất cả màu nhuộm"); return; }
                const cayMoc = getCayMocCuaMe(m);
                const tongCayDaGan = draft.mau.reduce((sum, item) => sum + (item.maCayMoc?.length || 0), 0);
                if (cayMoc.length > 0 && tongCayDaGan !== cayMoc.length) { toast.error(`Còn ${cayMoc.length - tongCayDaGan} cây mộc chưa phân màu`); return; }
                const result = xacNhanNhuomNhanMoc(m.id, { soKgMocNhan: draft.kg, soCayMocNhan: draft.cay, danhSachMau: draft.mau, chungTu: chungTu[m.id] }, user);
                result.ok ? toast.success(result.message) : toast.error(result.message);
                if (result.ok) {
                  setMns(getAllMeNhuom());
                  onChuyenTiep();
                }
              }} className="w-full rounded bg-rose-600 py-2 font-bold text-white">Xác nhận nhận mộc & bắt đầu nhuộm</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function NghiemThuMauStep({ user, onNhapKho }: { user: any; onNhapKho: () => void }) {
  const [mns, setMns] = useState(getAllMeNhuom().filter((m) => m.trangThai !== "Hoàn thành"));
  const [thucNhan, setThucNhan] = useState<Record<string, Array<{ kg: number; cay: number }>>>({});
  const [chungTu, setChungTu] = useState<Record<string, UploadedFile[]>>({});
  const rowsOf = (me: MeNhuom) => thucNhan[me.id] || me.danhSachMau.map((item) => ({ kg: Math.floor(item.soKg * 0.95), cay: item.soCay || Math.max(Math.round(item.soKg / 20), 1) }));
  return (
    <div className="card p-3 bg-pink-50 dark:bg-pink-900/20">
      <h3 className="font-bold text-pink-700 mb-2">🎨 NT màu ({mns.length})</h3>
      {mns.map((m) => (
        <div key={m.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
          <div className="font-mono font-bold">{m.id}</div>
          <div className="mt-2 overflow-x-auto">
            <div className="grid min-w-[580px] grid-cols-[1fr_110px_110px_110px_110px] gap-2 rounded bg-pink-100 p-2 font-bold">
              <span>Màu</span><span>Kg mộc</span><span>Cây giao</span><span>Kg TP nhận</span><span>Cây TP</span>
            </div>
            {m.danhSachMau.map((x, index) => (
              <div key={`${x.mau}-${index}`} className="grid min-w-[580px] grid-cols-[1fr_110px_110px_110px_110px] items-center gap-2 border-b p-2">
                <strong>{x.mau}</strong><span>{x.soKg}</span><span>{x.soCay || 0}</span>
                <input type="number" min={0} max={x.soKg} value={rowsOf(m)[index]?.kg || 0} onChange={(event) => {
                  const rows = rowsOf(m).map((item) => ({ ...item })); rows[index].kg = Number(event.target.value); setThucNhan((prev) => ({ ...prev, [m.id]: rows }));
                }} className="rounded border px-2 py-1" />
                <input type="number" min={0} max={x.soCay || undefined} value={rowsOf(m)[index]?.cay || 0} onChange={(event) => {
                  const rows = rowsOf(m).map((item) => ({ ...item })); rows[index].cay = Number(event.target.value); setThucNhan((prev) => ({ ...prev, [m.id]: rows }));
                }} className="rounded border px-2 py-1" />
              </div>
            ))}
          </div>
          <div className="mt-2 rounded bg-amber-50 p-2 font-semibold text-amber-800">
            Hao hụt nhuộm: {Math.max(m.danhSachMau.reduce((sum, item) => sum + item.soKg, 0) - rowsOf(m).reduce((sum, item) => sum + item.kg, 0), 0).toFixed(1)}kg
          </div>
          <div className="mt-2"><ImageUploader files={chungTu[m.id] || []} onChange={(files) => setChungTu((prev) => ({ ...prev, [m.id]: files.slice(-1) }))} category={`Nhuộm-xuất-kho-${m.id}`} accept="image/*,.pdf" maxSize={600 * 1024} label="Ảnh phiếu nhuộm hoàn thành / phiếu nhập kho TP" hint="01 ảnh/PDF, tối đa 600KB" /></div>
          <button onClick={async () => {
            if (!(chungTu[m.id]?.length)) { toast.error("Vui lòng thêm ảnh chứng từ nhuộm và nhập kho"); return; }
            const rows = rowsOf(m);
            if (rows.some((item) => item.kg <= 0 || item.cay <= 0)) { toast.error("Nhập đầy đủ kg và số cây thành phẩm cho tất cả màu"); return; }
            const danhMucKho = getAllInventory();
            const vaiKhoTheoMau = m.danhSachMau.map((item) => danhMucKho.find((vai) =>
              (item.maMau && (vai.maMoi || vai.maVT) === item.maMau)
              || (!item.maMau && (vai.mauChuan || vai.mauSac) === item.mau),
            ));
            const mauChuaCoTrongKho = m.danhSachMau.find((_, index) => !vaiKhoTheoMau[index]);
            if (mauChuaCoTrongKho) { toast.error(`Mã màu ${mauChuaCoTrongKho.maMau || mauChuaCoTrongKho.mau} chưa có trong Kho vải thành phẩm`); return; }
            const nghiemThu = m.danhSachMau.map((x, index) => ({
              mau: x.mau, soKgMocGiao: x.soKg, soKgMauNhan: rows[index].kg,
              soCayNhan: rows[index].cay, soKgLoi: 0, donGiaNhuom: x.donGiaNhuom,
              chiPhiHoaChat: 0, chiPhiHoanThien: 0, chiPhiPhatSinh: 0, daThanhToan: 0,
            }));
            const result = nghiemThuMau_V2(m.id, nghiemThu, user?.name || "system", user, chungTu[m.id]);
            if (!result.ok || !result.phieu) { toast.error(result.message); return; }
            const ketQuaNhapKho = await Promise.all(m.danhSachMau.map(async (x, index) => {
              const soCay = rows[index].cay;
              const kgMoiCay = rows[index].kg / soCay;
              const vaiKho = vaiKhoTheoMau[index]!;
              try {
                await createFabricDyeLot({
                  maMe: `${m.id}-${x.maMau || index + 1}`,
                  sku: vaiKho.maVT,
                  mauSac: x.mau,
                  ngayNhap: new Date().toISOString().slice(0, 10),
                  xuongNhuom: m.xuongNhuom,
                  donGia: x.giaVonDuKien || x.donGiaNhuom,
                  soKgNhap: rows[index].kg,
                  tonKg: rows[index].kg,
                  soCay,
                  khu: "C",
                  ke: "",
                  tang: "",
                  o: "",
                  trangThai: "CHO_KIEM",
                  ghiChu: `Tự động nhập từ nghiệm thu mẻ ${m.id}`,
                });
              } catch (error: unknown) {
                return { ok: false, message: error instanceof Error ? error.message : "Chưa tạo được mẻ chờ kiểm tại Khu C" };
              }
              const ketQuaLo = nhapKhoVaiTP({
                ngayNhap: new Date().toISOString().slice(0, 10), meNhuomId: m.id, nghiemThuMauId: result.phieu!.id,
                loaiVai: "Vải thành phẩm", mau: x.mau, maMau: x.maMau || x.mau.toUpperCase().replace(/\s+/g, "-"), maLo: `${m.id}-${index + 1}`,
                danhSachCay: Array.from({ length: soCay }, (_, cayIndex) => ({ stt: cayIndex + 1, kg: kgMoiCay })),
                giaVonPerKg: x.giaVonDuKien || x.donGiaNhuom, kho: "Kho Vải TP", khu: "Khu C", ke: "Chưa xếp", tang: "",
                viTri: "Chờ sắp xếp", trangThaiChatLuong: "Chờ kiểm", nguoiPhuTrach: user?.name || "system", ghiChu: `Từ mẻ ${m.id}`,
                chungTuNhapKho: chungTu[m.id],
              }, user);
              if (!ketQuaLo.ok) return ketQuaLo;
              const ketQuaTon = nhapKho(vaiKho.maVT, rows[index].kg, user, `Nhập từ mẻ nhuộm ${m.id}`, {
                ngay: new Date().toISOString().slice(0, 10),
                donGia: x.giaVonDuKien || x.donGiaNhuom,
                nguonNhap: m.xuongNhuom,
                nguoiThucHien: user?.name || "system",
              });
              if (!ketQuaTon.ok) return ketQuaTon;
              const tonKhoHienTai = getInventoryByMaVT(vaiKho.maVT);
              updateVaiInfo(vaiKho.maVT, {
                tonCay: (tonKhoHienTai?.tonCay || 0) + soCay,
                soCayNhap: (tonKhoHienTai?.soCayNhap || 0) + soCay,
              });
              const vaiDaCapNhat = getInventoryByMaVT(vaiKho.maVT);
              if (vaiDaCapNhat) await upsertInventoryItem(vaiDaCapNhat);
              return ketQuaLo;
            }));
            const loiNhapKho = ketQuaNhapKho.find((item) => !item.ok);
            if (loiNhapKho) { toast.error(loiNhapKho.message); return; }
            toast.success(`Đã nghiệm thu và nhập kho ${m.danhSachMau.length} màu`);
            setMns(getAllMeNhuom().filter((item) => item.trangThai !== "Hoàn thành"));
            onNhapKho();
          }} className="mt-2 w-full rounded bg-pink-600 py-2 font-bold text-white">Xác nhận nhuộm & nhập kho thành phẩm</button>
        </div>
      ))}
    </div>
  );
}

function KhoTPStep() {
  const [ltps, setLtps] = useState<LoVaiTP[]>([]);
  useEffect(() => { setLtps(getAllLoVaiTP()); }, []);
  return (
    <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20">
      <h3 className="font-bold text-emerald-700 mb-2">📦 Kho vải TP ({ltps.length})</h3>
      {ltps.length === 0 ? (
        <p className="text-xs opacity-60 text-center py-4">Chưa có lô vải TP</p>
      ) : (
        ltps.map((l) => (
          <div key={l.id} className="p-2 mb-1 rounded bg-white dark:bg-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold">{l.maLo}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded text-white bg-emerald-500">{l.mau}</span>
            </div>
            <div className="opacity-70">{l.tongKg.toFixed(0)}kg · {l.giaVonPerKg.toFixed(0)}đ/kg · {l.khu}/{l.ke}</div>
          </div>
        ))
      )}
    </div>
  );
}
