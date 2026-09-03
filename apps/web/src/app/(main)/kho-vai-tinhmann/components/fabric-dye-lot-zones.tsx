"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { CrudModal, type FieldDef } from "@/components/ui/CrudModal";
import { formatVND, type KhoVai } from "@/lib/data/real-data";
import {
  approveFabricDyeLot,
  createFabricDyeLot,
  FABRIC_DYE_LOTS_CHANGED_EVENT,
  fetchFabricDyeLots,
  KHU_ME_NHUOM,
  type FabricDyeLot,
  type KhuMeNhuom,
  type TrangThaiMeNhuom,
} from "@/lib/data/fabric-dye-lots";

const KHU_ORDER: KhuMeNhuom[] = ["A", "B", "C", "D", "E"];
const TRANG_THAI_THEO_KHU: Record<KhuMeNhuom, TrangThaiMeNhuom> = {
  A: "DANG_SU_DUNG", B: "ME_KE_TIEP", C: "CHO_KIEM", D: "GIU_RIENG", E: "CHO_TRA",
};

export function FabricDyeLotZones({ inventory }: { inventory: KhoVai[] }) {
  const [lots, setLots] = useState<FabricDyeLot[]>([]);
  const [open, setOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const refresh = async () => setLots(await fetchFabricDyeLots());
  useEffect(() => {
    const handleChange = () => { void refresh(); };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "mimin_kho_vai_me_nhuom") handleChange();
    };
    void refresh();
    window.addEventListener(FABRIC_DYE_LOTS_CHANGED_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(FABRIC_DYE_LOTS_CHANGED_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const fields = useMemo<FieldDef[]>(() => [
    { name: "maMe", label: "Mã mẻ nhuộm", type: "text", required: true, placeholder: "MN-20260829-01" },
    { name: "sku", label: "Mã vải trong kho", type: "select", required: true, options: inventory.map((vai) => ({ value: vai.maVT, label: `${vai.maVT} - ${vai.tenVT}` })) },
    { name: "ngayNhap", label: "Ngày nhập", type: "date", required: true },
    { name: "xuongNhuom", label: "Xưởng nhuộm", type: "text" },
    { name: "donGia", label: "Giá vốn mỗi kg", type: "number", required: true, min: 0 },
    { name: "soKgNhap", label: "Số kg nhập", type: "number", required: true, min: 0, step: "any" },
    { name: "soCay", label: "Số cây", type: "number", min: 0 },
    { name: "khu", label: "Khu ban đầu", type: "select", required: true, options: KHU_ORDER.map((khu) => ({ value: khu, label: `Khu ${khu} - ${KHU_ME_NHUOM[khu].ten}` })) },
    { name: "ke", label: "Kệ", type: "text", placeholder: "A01" },
    { name: "ghiChu", label: "Ghi chú", type: "textarea", rows: 2 },
  ], [inventory]);

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><Boxes className="h-5 w-5 text-teal-600" /> Khu vải theo mẻ nhuộm</h2>
          <p className="text-sm text-slate-500">Tách giá vốn và tồn theo từng mẻ; không thay đổi tồn kho tổng hiện tại.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Thêm mẻ nhuộm</button>
      </div>

      {lots.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Chưa có mẻ nhuộm được phân khu. Dữ liệu kho vải cũ vẫn giữ nguyên và không bị tự động chuyển khu.
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {KHU_ORDER.map((khu) => {
          const items = lots.filter((lot) => lot.khu === khu && lot.trangThai !== "DA_HET");
          const tongKg = items.reduce((sum, lot) => sum + lot.tonKg, 0);
          return (
            <section key={khu} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <header className="border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="font-bold">Khu {khu} - {KHU_ME_NHUOM[khu].ten}</h3><p className="text-xs text-slate-500">{KHU_ME_NHUOM[khu].moTa}</p></div>
                  <div className="text-right"><div className="font-black text-teal-700">{tongKg.toLocaleString("vi-VN")} kg</div><div className="text-[11px] text-slate-500">{items.length} mẻ</div></div>
                </div>
              </header>
              <div className="space-y-2 p-3">
                {items.length === 0 && <div className="py-5 text-center text-xs text-slate-400">Chưa có mẻ trong khu này</div>}
                {items.map((lot) => {
                  const vai = inventory.find((item) => item.maVT === lot.sku);
                  return (
                    <article key={lot.id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <div className="flex justify-between gap-3"><div><div className="font-bold text-slate-800 dark:text-slate-100">{lot.mauSac} · {lot.maMe}</div><div className="text-xs text-slate-500">{vai?.tenVT || lot.sku}</div></div><div className="text-right"><div className="font-black text-emerald-700">{lot.tonKg.toLocaleString("vi-VN")} kg</div><div className="text-xs text-slate-500">{formatVND(lot.donGia)}/kg</div></div></div>
                      <div className="mt-2 text-[11px] text-slate-500">Nhập {lot.ngayNhap} · {lot.soCay} cây · Kệ {lot.ke || "chưa xếp"} · {lot.xuongNhuom || "Chưa ghi xưởng"}</div>
                      {lot.khu === "C" && lot.trangThai === "CHO_KIEM" && (
                        <button
                          type="button"
                          disabled={approvingId === lot.id}
                          onClick={async () => {
                            setApprovingId(lot.id);
                            try {
                              await approveFabricDyeLot(lot);
                              await refresh();
                              toast.success(`Đã kiểm đạt mẻ ${lot.maMe} và chuyển sang Khu A`);
                            } catch (error: unknown) {
                              toast.error(error instanceof Error ? error.message : "Chưa chuyển được mẻ sang Khu A");
                            } finally {
                              setApprovingId(null);
                            }
                          }}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          <CheckCircle2 className="h-4 w-4" /> {approvingId === lot.id ? "Đang chuyển Khu A..." : "Kiểm đạt → Chuyển Khu A"}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <CrudModal
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm mẻ nhuộm vào khu vải"
        fields={fields}
        initial={{ ngayNhap: new Date().toISOString().slice(0, 10), khu: "C" }}
        onSubmit={async (values) => {
          const vai = inventory.find((item) => item.maVT === values.sku);
          if (!vai) throw new Error("Mã vải không còn trong Kho vải hiện tại");
          const khu = values.khu as KhuMeNhuom;
          const soKgNhap = Number(values.soKgNhap);
          await createFabricDyeLot({
            maMe: values.maMe.trim(), sku: vai.maVT, mauSac: vai.mauChuan || vai.mauSac,
            ngayNhap: values.ngayNhap, xuongNhuom: values.xuongNhuom || "", donGia: Number(values.donGia),
            soKgNhap, tonKg: soKgNhap, soCay: Number(values.soCay || 0), khu, ke: values.ke || "",
            tang: "", o: "", trangThai: TRANG_THAI_THEO_KHU[khu], ghiChu: values.ghiChu || "",
          });
          await refresh();
        }}
        submitLabel="Lưu mẻ nhuộm"
      />
    </div>
  );
}
