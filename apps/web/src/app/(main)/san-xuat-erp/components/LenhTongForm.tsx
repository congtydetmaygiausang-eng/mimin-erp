// ============ LENH TONG FORM ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Printer, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  nhapKhoSoi_V2,
  taoLenhDet,
  taoMeNhuom,
  type LoVaiTP,
} from "@/lib/yarn-production-chain";
import { themCongNo } from "@/lib/master-data";
import { thuocNhomSanXuatVai, useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { type KhoVai } from "@/lib/data/real-data";
import {
  getAllInventory,
  getVaiImages,
  subscribeInventoryChanges,
  syncInventoryWithSupabase,
} from "@/lib/inventory-engine";
import { KHU_ME_NHUOM, type KhuMeNhuom } from "@/lib/data/fabric-dye-lots";
import { Card, F, Modal } from "./ui-blocks";

type MauNhuomInput = {
  maVai: string;
  mau: string;
  soKg: number;
  donGiaNhuom: number;
  chiPhiHoaChat: number;
};

type SoiInput = {
  id: string;
  loaiSoi: string;
  maLoSoi: string;
  soKg: number;
  donGia: number;
};

type PhieuSanXuatVai = {
  maLenhDet: string;
  maMeNhuom: string;
  ngayTao: string;
  tenNccSoi: string;
  tenXuongDet: string;
  tenXuongNhuom: string;
  danhSachSoi: SoiInput[];
  danhSachMau: MauNhuomInput[];
  tongKgSoi: number;
  donGiaDet: number;
  tongCong: number;
  khu: KhuMeNhuom;
  ke: string;
};

type KhoVaiWithImage = KhoVai & { imageUrl?: string };

const tenMauTuVai = (vai?: KhoVai) => vai?.mauChuan || vai?.mauSac || vai?.tenChuan || vai?.tenVT || "";
const lamTronTheo100Dong = (value: number) => Math.round(value / 100) * 100;

export function LenhTongForm({ user, onChuyenTiep }: { user: any; onChuyenTiep: () => void }) {
  const { list: danhBa, loading } = useNhaCungCap();
  const nccs = useMemo(
    () => danhBa.filter((item) => thuocNhomSanXuatVai(item, "soi")),
    [danhBa],
  );
  const dsXuongDet = useMemo(
    () => danhBa.filter((item) => thuocNhomSanXuatVai(item, "det")),
    [danhBa],
  );
  const dsXuongNhuom = useMemo(
    () => danhBa.filter((item) => thuocNhomSanXuatVai(item, "nhuom")),
    [danhBa],
  );

  const [nccId, setNccId] = useState("");
  const [danhSachSoi, setDanhSachSoi] = useState<SoiInput[]>([
    { id: "soi-1", loaiSoi: "Cotton 32s", maLoSoi: "LSOI-001", soKg: 1000, donGia: 130000 },
  ]);

  const [xuongDetId, setXuongDetId] = useState("");
  const [donGiaDet, setDonGiaDet] = useState(8000);

  const [xuongNhuomId, setXuongNhuomId] = useState("");
  const [danhSachVaiKho, setDanhSachVaiKho] = useState<KhoVai[]>(() => getAllInventory());
  const [anhVaiCu, setAnhVaiCu] = useState<Record<string, string>>(() => getVaiImages());
  const [danhSachMau, setDanhSachMau] = useState<MauNhuomInput[]>([]);

  const kho = "Kho vải thành phẩm";
  const [khu, setKhu] = useState<KhuMeNhuom>("C");
  const [ke, setKe] = useState("C01");
  const [daTaoLenh, setDaTaoLenh] = useState(false);
  const [hienPhieu, setHienPhieu] = useState(false);
  const [dongDangChonVai, setDongDangChonVai] = useState<number | null>(null);
  const [phieuDaTao, setPhieuDaTao] = useState<PhieuSanXuatVai | null>(null);

  const tongKgSoi = danhSachSoi.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0);
  const chiSoi = danhSachSoi.reduce((sum, item) => sum + Math.max(item.soKg, 0) * Math.max(item.donGia, 0), 0);
  const chiDet = tongKgSoi * donGiaDet;
  const chiNhuom = 0;
  const chiHoaChat = 0;
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat;
  const giaVonTheoMau = useMemo(() => {
    const tongKg = danhSachMau.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0);
    let chiSoiDaPhanBo = 0;
    let chiDetDaPhanBo = 0;

    return danhSachMau.map((item, index) => {
      const laMauCuoi = index === danhSachMau.length - 1;
      const tyTrong = tongKg > 0 ? Math.max(item.soKg, 0) / tongKg : 0;
      const chiSoiPhanBo = tongKg <= 0
        ? 0
        : laMauCuoi
        ? chiSoi - chiSoiDaPhanBo
        : Math.round(chiSoi * tyTrong);
      const chiDetPhanBo = tongKg <= 0
        ? 0
        : laMauCuoi
        ? chiDet - chiDetDaPhanBo
        : Math.round(chiDet * tyTrong);
      chiSoiDaPhanBo += chiSoiPhanBo;
      chiDetDaPhanBo += chiDetPhanBo;

      const tienNhuom = item.soKg * item.donGiaNhuom;
      const tongGiaVon = chiSoiPhanBo + chiDetPhanBo + tienNhuom + item.chiPhiHoaChat;
      return {
        ...item,
        chiSoiPhanBo,
        chiDetPhanBo,
        tienNhuom,
        tongGiaVon,
        giaVonMoiKg: item.soKg > 0 ? tongGiaVon / item.soKg : 0,
      };
    });
  }, [chiDet, chiSoi, danhSachMau]);

  useEffect(() => {
    if (!nccId && nccs[0]) setNccId(nccs[0].id);
    if (!xuongDetId && dsXuongDet[0]) setXuongDetId(dsXuongDet[0].id);
    if (!xuongNhuomId && dsXuongNhuom[0]) setXuongNhuomId(dsXuongNhuom[0].id);
  }, [nccId, nccs, xuongDetId, dsXuongDet, xuongNhuomId, dsXuongNhuom]);

  useEffect(() => {
    const refreshKhoVai = () => {
      setDanhSachVaiKho(getAllInventory());
      setAnhVaiCu(getVaiImages());
    };
    refreshKhoVai();
    void syncInventoryWithSupabase().then(refreshKhoVai);
    return subscribeInventoryChanges(refreshKhoVai);
  }, []);

  useEffect(() => {
    if (danhSachVaiKho.length === 0) return;
    setDanhSachMau((prev) => prev.map((item, index) => {
      if (item.maVai && danhSachVaiKho.some((vai) => vai.maVT === item.maVai)) return item;
      const vai = danhSachVaiKho[index] || danhSachVaiKho[0];
      return { ...item, maVai: vai.maVT, mau: tenMauTuVai(vai) };
    }));
  }, [danhSachVaiKho]);

  const ncc = nccs.find((item) => item.id === nccId);
  const xDet = dsXuongDet.find((item) => item.id === xuongDetId);
  const xNhuom = dsXuongNhuom.find((item) => item.id === xuongNhuomId);
  const thieuDanhBa = !loading && (!ncc || !xDet || !xNhuom);

  const capNhatMau = (index: number, patch: Partial<MauNhuomInput>) => {
    setDanhSachMau((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)));
  };

  const capNhatSoi = (id: string, patch: Partial<SoiInput>) => {
    setDanhSachSoi((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const themDongSoi = () => {
    setDanhSachSoi((prev) => [
      ...prev,
      {
        id: `soi-${Date.now()}`,
        loaiSoi: "",
        maLoSoi: `LSOI-${String(prev.length + 1).padStart(3, "0")}`,
        soKg: 0,
        donGia: 0,
      },
    ]);
  };

  const chonMaVai = (index: number, maVai: string) => {
    const vai = danhSachVaiKho.find((item) => item.maVT === maVai);
    capNhatMau(index, {
      maVai,
      mau: tenMauTuVai(vai) || danhSachMau[index]?.mau || "",
    });
  };

  const handleTao = () => {
    setDaTaoLenh(false);
    if (!ncc || !xDet || !xNhuom) {
      toast.error("Vui lòng cập nhật danh bạ NCC sợi, dệt, nhuộm trước");
      return;
    }

    if (danhSachSoi.length === 0 || danhSachSoi.some((item) => !item.loaiSoi.trim() || !item.maLoSoi.trim() || item.soKg <= 0 || item.donGia < 0)) {
      toast.error("Vui lòng nhập đầy đủ loại sợi, mã lô, số kg và đơn giá");
      return;
    }
    const ketQuaNhapSoi = danhSachSoi.map((soi) => {
      const ketQua = nhapKhoSoi_V2({
        ngayNhap: new Date().toISOString().slice(0, 10),
        nccId: ncc.id,
        tenNCC: ncc.ten_ncc,
        loaiSoi: `SOI-${soi.loaiSoi.replace(/\s/g, "")}`,
        tenSoi: `Sợi ${soi.loaiSoi}`,
        maLoSoi: soi.maLoSoi,
        soKg: soi.soKg,
        donGia: soi.donGia,
        daThanhToan: 0,
        khoNhap: "Kho Sợi",
        nguoiPhuTrach: user?.name || "Admin",
        ghiChu: `Chuyển dệt chung ${tongKgSoi.toLocaleString("vi-VN")}kg`,
        khoa: false,
      } as any, user);

      if (ketQua.ok) {
        themCongNo({
          ngayPhatSinh: new Date().toISOString().slice(0, 10),
          doiTuongId: ncc.id,
          tenDoiTuong: ncc.ten_ncc,
          loai: "NCC sợi",
          maPhieuGoc: ketQua.phieu?.id || "",
          moTa: `Nhập ${soi.soKg}kg ${soi.loaiSoi} - lô ${soi.maLoSoi} từ ${ncc.ten_ncc}`,
          phatSinh: soi.soKg * soi.donGia,
          thanhToan: 0,
        });

      }
      return ketQua;
    });

    if (ketQuaNhapSoi.some((ketQua) => !ketQua.ok)) {
      toast.error("Có lô sợi chưa nhập được; chưa tạo lệnh dệt");
      return;
    }

    if (ketQuaNhapSoi.every((ketQua) => ketQua.ok)) {
      const danhSachLoaiSoi = danhSachSoi.map((item) => item.loaiSoi).join(" + ");
      const danhSachMaLo = danhSachSoi.map((item) => item.maLoSoi).join(" + ");
      const r2 = taoLenhDet({
        ngayGiao: new Date().toISOString().slice(0, 10),
        ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
        xuongDet: xDet.ten_ncc,
        maLoSoi: danhSachMaLo,
        loaiSoi: danhSachLoaiSoi,
        soKgGiao: tongKgSoi,
        donGiaDet,
        tienDuKien: tongKgSoi * donGiaDet,
        soMetDuKien: tongKgSoi * 4,
        nguoiPhuTrach: user?.name || "Admin",
        ghiChu: `${danhSachSoi.length} loại sợi: ${danhSachSoi.map((item) => `${item.loaiSoi} ${item.soKg}kg`).join(", ")}`,
      }, user);

      if (!r2.ok) {
        toast.error(r2.message || "Chưa tạo được lệnh dệt gia công");
        return;
      }

      themCongNo({
        ngayPhatSinh: new Date().toISOString().slice(0, 10),
        doiTuongId: xDet.id,
        tenDoiTuong: xDet.ten_ncc,
        loai: "Xưởng dệt",
        maPhieuGoc: r2.lenh?.id || "",
        moTa: `Dệt ${tongKgSoi}kg từ ${danhSachSoi.length} loại sợi → ${xDet.ten_ncc}`,
        phatSinh: chiDet,
        thanhToan: 0,
      });

      if (danhSachMau.length > 0) {
        const r3 = taoMeNhuom({
          ngayGiao: new Date().toISOString().slice(0, 10),
          ngayDuKienNhan: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
          xuongNhuom: xNhuom.ten_ncc,
          maLoMoc: `LM-${r2.lenh?.id}`,
          danhSachMau: danhSachMau.map((m, index) => ({
            maMau: danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.maMoi || m.maVai,
            mau: m.mau,
            soKg: m.soKg,
            donGiaNhuom: m.donGiaNhuom,
            giaVonDuKien: giaVonTheoMau[index]?.giaVonMoiKg || 0,
          })),
          nguoiPhuTrach: user?.name || "Admin",
          ghiChu: [
            `Mã vải TP: ${danhSachMau.map((m) => `${m.maVai}-${m.mau}`).join(", ")}`,
            `Vị trí dự kiến: ${kho} · Khu ${khu} - ${KHU_ME_NHUOM[khu].ten} · Kệ ${ke || "chưa xếp"}`,
          ].join(" | "),
        }, user);

        if (!r3.ok) {
          toast.error(r3.message || "Chưa tạo được mẻ nhuộm");
          return;
        }

        themCongNo({
          ngayPhatSinh: new Date().toISOString().slice(0, 10),
          doiTuongId: xNhuom.id,
          tenDoiTuong: xNhuom.ten_ncc,
          loai: "Xưởng nhuộm",
          maPhieuGoc: r3.me?.id || "",
          moTa: `Nhuộm ${danhSachMau.length} màu → ${xNhuom.ten_ncc}`,
          phatSinh: chiNhuom + chiHoaChat,
          thanhToan: 0,
        });

        setPhieuDaTao({
          maLenhDet: r2.lenh?.id || "",
          maMeNhuom: r3.me?.id || "",
          ngayTao: new Date().toISOString().slice(0, 10),
          tenNccSoi: ncc.ten_ncc,
          tenXuongDet: xDet.ten_ncc,
          tenXuongNhuom: xNhuom.ten_ncc,
          danhSachSoi: danhSachSoi.map((item) => ({ ...item })),
          danhSachMau: danhSachMau.map((item) => ({ ...item })),
          tongKgSoi,
          donGiaDet,
          tongCong,
          khu,
          ke,
        });
      }
    }

    setDaTaoLenh(true);
    toast.success(`Đã lưu và tạo lệnh thành công. Tổng: ${tongCong.toLocaleString()}đ | ${danhSachSoi.length + 2} công nợ đã tạo`);
  };

  return (
    <div className="space-y-3 p-3">
      {thieuDanhBa && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Danh bạ chưa đủ NCC thuộc nhóm sợi, dệt, nhuộm. Anh cập nhật trong Danh bạ NCC rồi quay lại tạo lệnh SX vải.
        </div>
      )}

      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-bold text-blue-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">1</span>
            SỢI + NCC
          </h3>
          <button
            type="button"
            onClick={themDongSoi}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EA990C] px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-[#D98200]"
          >
            <Plus className="h-4 w-4" /> THÊM SỢI MỚI
          </button>
        </div>
        <div className="space-y-2">
          <div>
            <label className="text-xs font-semibold opacity-70">Nhà cung cấp sợi</label>
            <select value={nccId} onChange={(e) => setNccId(e.target.value)} disabled={loading || nccs.length === 0} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60">
              {nccs.length === 0 && <option value="">Chưa có NCC sợi</option>}
              {nccs.map((n) => <option key={n.id} value={n.id}>{n.ten_ncc} ({n.ma_ncc})</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {danhSachSoi.map((soi, index) => (
              <div key={soi.id} className="rounded-xl border border-blue-200 bg-white/70 p-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700">Loại sợi {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => setDanhSachSoi((prev) => prev.filter((item) => item.id !== soi.id))}
                    disabled={danhSachSoi.length === 1}
                    className="rounded p-1 text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Xóa loại sợi ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <F label="Loại sợi" v={soi.loaiSoi} on={(value) => capNhatSoi(soi.id, { loaiSoi: value })} />
                  <F label="Mã lô" v={soi.maLoSoi} on={(value) => capNhatSoi(soi.id, { maLoSoi: value })} />
                  <F label="Số kg" v={soi.soKg} on={(value) => capNhatSoi(soi.id, { soKg: value })} type="number" />
                  <F label="Đơn giá (đ/kg)" v={soi.donGia} on={(value) => capNhatSoi(soi.id, { donGia: value })} type="number" />
                </div>
                <div className="mt-1 text-right text-xs font-semibold text-blue-700">
                  Thành tiền: {(soi.soKg * soi.donGia).toLocaleString("vi-VN")}đ
                </div>
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={themDongSoi}
                className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm"
              >
                <Plus className="mr-1 inline h-4 w-4" /> Thêm sợi mới
              </button>
              <div className="rounded-lg bg-blue-600 px-3 py-2 text-right text-white">
                <div className="text-[10px] font-medium text-white/80">Tổng sợi chuyển dệt gia công</div>
                <div className="text-lg font-black">{tongKgSoi.toLocaleString("vi-VN")} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-3 bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300">
        <h3 className="font-bold text-violet-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
          DỆT - GIA CÔNG
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng dệt</label>
          <select value={xuongDetId} onChange={(e) => setXuongDetId(e.target.value)} disabled={loading || dsXuongDet.length === 0} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60">
            {dsXuongDet.length === 0 && <option value="">Chưa có NCC dệt</option>}
            {dsXuongDet.map((x) => <option key={x.id} value={x.id}>{x.ten_ncc} ({x.ma_ncc})</option>)}
          </select>
        </div>
        <F label="Đơn giá dệt (đ/kg)" v={donGiaDet} on={setDonGiaDet} type="number" />
        <div className="mt-2 rounded-lg bg-violet-600 px-3 py-2 text-white">
          <div className="text-[10px] font-medium text-white/80">Tổng giao xưởng dệt</div>
          <div className="text-xl font-black">{tongKgSoi.toLocaleString("vi-VN")} kg · {danhSachSoi.length} loại sợi</div>
        </div>
      </div>

      <div className="card p-3 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300">
        <h3 className="font-bold text-rose-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">3</span>
          NHUỘM
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng nhuộm</label>
          <select value={xuongNhuomId} onChange={(e) => setXuongNhuomId(e.target.value)} disabled={loading || dsXuongNhuom.length === 0} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60">
            {dsXuongNhuom.length === 0 && <option value="">Chưa có NCC nhuộm</option>}
            {dsXuongNhuom.map((x) => <option key={x.id} value={x.id}>{x.ten_ncc} ({x.ma_ncc})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-12 gap-1 text-[10px] font-semibold opacity-70 mt-2 mb-1">
          <div className="col-span-4">Mã màu kho TP</div>
          <div className="col-span-2">Màu</div>
          <div className="col-span-2 text-right">Số kg</div>
          <div className="col-span-2 text-right">Đơn giá</div>
          <div className="col-span-1 text-right">Hóa chất</div>
        </div>
        {danhSachMau.map((m, i) => (
          <div key={`${m.maVai}-${i}`} className="mb-2 rounded-lg border border-rose-200 bg-white/50 p-1.5 text-xs">
            <div className="grid grid-cols-12 gap-1">
              <div className="col-span-4">
                <button
                  type="button"
                  onClick={() => setDongDangChonVai(i)}
                  className="w-full rounded border bg-white px-2 py-1 text-left font-semibold hover:border-rose-400 hover:bg-rose-50"
                >
                  {m.maVai
                    ? `${danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.maMoi || m.maVai} - ${danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.tenChuan || danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.tenVT || m.mau}`
                    : "Chọn mã màu từ Kho vải thành phẩm"}
                </button>
              </div>
              <div className="col-span-2 flex items-center rounded border bg-slate-50 px-2 py-1 font-medium">
                {m.mau || "Chưa có màu"}
              </div>
              <input type="number" value={m.soKg} onChange={(e) => capNhatMau(i, { soKg: Number(e.target.value) })} className="col-span-2 px-2 py-1 rounded border text-right" />
              <input type="number" value={m.donGiaNhuom} onChange={(e) => capNhatMau(i, { donGiaNhuom: Number(e.target.value) })} className="col-span-2 px-2 py-1 rounded border text-right" />
              <input type="number" value={m.chiPhiHoaChat} onChange={(e) => capNhatMau(i, { chiPhiHoaChat: Number(e.target.value) })} className="col-span-1 px-2 py-1 rounded border text-right" />
              <button onClick={() => setDanhSachMau(danhSachMau.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-600 p-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {(() => {
              const vai = danhSachVaiKho.find((item) => item.maVT === m.maVai) as KhoVaiWithImage | undefined;
              const src = vai?.imageUrl || vai?.hinhAnh || anhVaiCu[m.maVai];
              return (
                <div className="mt-1.5 flex items-center gap-3 rounded-md bg-rose-50/70 p-2">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white">
                    {src ? (
                      <img src={src} alt={`Mẫu vải ${vai?.tenVT || m.maVai}`} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-slate-400">Chưa có ảnh</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{vai?.tenChuan || vai?.tenVT || m.maVai}</div>
                    <div className="text-[11px] text-slate-500">Màu: {tenMauTuVai(vai)} · Tồn kho: {(vai?.tonKho || 0).toLocaleString("vi-VN")} {vai?.dvt || "kg"}</div>
                    <div className="text-[10px] text-slate-400">Mã màu lấy trực tiếp từ Kho vải thành phẩm</div>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
        <button onClick={() => {
          const vai = danhSachVaiKho[0];
          setDanhSachMau([...danhSachMau, { maVai: vai?.maVT || "", mau: tenMauTuVai(vai), soKg: 0, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 }]);
        }} className="text-xs text-blue-600 mt-1">
          <Plus className="w-3 h-3 inline" /> Thêm mã màu nhuộm
        </button>
      </div>

      <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300">
        <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">4</span>
          KHO VẢI TP
        </h3>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold opacity-70">Kho</label>
            <div className="mt-0.5 rounded-lg border bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
              {kho}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold opacity-70">Khu mẻ nhuộm</label>
            <select
              value={khu}
              onChange={(event) => {
                const nextKhu = event.target.value as KhuMeNhuom;
                setKhu(nextKhu);
                setKe((current) => current.replace(/^[A-E]/, nextKhu));
              }}
              className="mt-0.5 w-full rounded-lg border bg-white px-3 py-2 text-sm font-semibold"
            >
              {(Object.keys(KHU_ME_NHUOM) as KhuMeNhuom[]).map((maKhu) => (
                <option key={maKhu} value={maKhu}>
                  Khu {maKhu} - {KHU_ME_NHUOM[maKhu].ten}
                </option>
              ))}
            </select>
          </div>
          <F label="Kệ" v={ke} on={setKe} />
        </div>
        <p className="mt-2 text-[11px] text-emerald-700">
          Mẻ nhuộm mới mặc định vào Khu C để chờ kiểm màu và chất lượng; dữ liệu tồn kho hiện tại không bị thay đổi.
        </p>
      </div>

      <div className="card p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Card label="Chi sợi" v={chiSoi} c="blue" sub={ncc?.ten_ncc} />
          <Card label="Chi dệt" v={chiDet} c="violet" sub={xDet?.ten_ncc} />
          <Card label="Chi nhuộm" v={chiNhuom + chiHoaChat} c="rose" sub={xNhuom?.ten_ncc} />
          <Card label="Tổng" v={tongCong} c="amber" />
        </div>
        <div className="mt-2 text-center text-2xl font-bold text-amber-600">
          {tongCong.toLocaleString()}đ
        </div>

        <div className="mt-3 border-t border-amber-300 pt-3">
          <h4 className="mb-2 text-sm font-bold text-amber-800">Tổng chi phí giá vốn theo từng màu vải</h4>
          <div className="space-y-2">
            {giaVonTheoMau.map((item, index) => {
              const vai = danhSachVaiKho.find((record) => record.maVT === item.maVai);
              return (
                <div key={`${item.maVai}-${index}-gia-von`} className="rounded-xl border border-amber-200 bg-white/80 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800">{vai?.maMoi || item.maVai} - {item.mau}</div>
                      <div className="text-[11px] text-slate-500">{vai?.tenChuan || vai?.tenVT || "Mã vải thành phẩm"} · {item.soKg.toLocaleString("vi-VN")} kg</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-amber-700">{lamTronTheo100Dong(item.tongGiaVon).toLocaleString("vi-VN")}đ</div>
                      <div className="text-xs font-semibold text-emerald-700">{lamTronTheo100Dong(item.giaVonMoiKg).toLocaleString("vi-VN")}đ/kg</div>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-600 md:grid-cols-4">
                    <div className="rounded bg-blue-50 px-2 py-1">Sợi: <b>{lamTronTheo100Dong(item.chiSoiPhanBo).toLocaleString("vi-VN")}đ</b></div>
                    <div className="rounded bg-violet-50 px-2 py-1">Dệt: <b>{lamTronTheo100Dong(item.chiDetPhanBo).toLocaleString("vi-VN")}đ</b></div>
                    <div className="rounded bg-rose-50 px-2 py-1">Nhuộm: <b>{lamTronTheo100Dong(item.tienNhuom).toLocaleString("vi-VN")}đ</b></div>
                    <div className="rounded bg-orange-50 px-2 py-1">Hóa chất: <b>{lamTronTheo100Dong(item.chiPhiHoaChat).toLocaleString("vi-VN")}đ</b></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 print:hidden md:grid-cols-3">
        <button onClick={handleTao} className="btn-primary w-full bg-gradient-to-r from-[#307082] to-[#6CA3A2] py-3 text-base font-black">
          <Sparkles className="mr-1 inline h-4 w-4" /> LƯU & TẠO LỆNH
        </button>
        <button
          type="button"
          onClick={() => setHienPhieu(true)}
          disabled={!daTaoLenh}
          className="w-full rounded-xl bg-[#EA990C] py-3 text-base font-black text-white shadow-md transition hover:bg-[#D98200] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Printer className="mr-1 inline h-4 w-4" /> IN PHIẾU
        </button>
        <button
          type="button"
          onClick={onChuyenTiep}
          disabled={!daTaoLenh}
          className="w-full rounded-xl bg-[#307082] py-3 text-base font-black text-white shadow-md transition hover:bg-[#286575] disabled:cursor-not-allowed disabled:opacity-40"
        >
          CHUYỂN TIẾP <ArrowRight className="ml-1 inline h-4 w-4" />
        </button>
      </div>
      {daTaoLenh && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-700 print:hidden">
          Lệnh đã được lưu. Anh có thể in phiếu hoặc chuyển sang tab Quy trình.
        </div>
      )}

      {dongDangChonVai !== null && (
        <Modal onClose={() => setDongDangChonVai(null)}>
          <div className="mb-4">
            <h3 className="text-lg font-black text-rose-700">Chọn mã màu từ Kho vải thành phẩm</h3>
            <p className="text-xs text-slate-500">Chọn mã màu đã có trong kho; hình ảnh mẫu dùng để đối chiếu màu thực tế.</p>
          </div>
          {danhSachVaiKho.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-500">
              Kho vải thành phẩm chưa có mẫu. Anh thêm mã màu và ảnh mẫu trong Kho vải thành phẩm trước.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {danhSachVaiKho.map((vai) => {
                const vaiCoAnh = vai as KhoVaiWithImage;
                const src = vaiCoAnh.imageUrl || vai.hinhAnh || anhVaiCu[vai.maVT];
                const dangChon = danhSachMau[dongDangChonVai]?.maVai === vai.maVT;
                return (
                  <button
                    key={vai.maVT}
                    type="button"
                    onClick={() => {
                      chonMaVai(dongDangChonVai, vai.maVT);
                      setDongDangChonVai(null);
                    }}
                    className={`overflow-hidden rounded-xl border-2 bg-white text-left transition hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md ${dangChon ? "border-rose-500 ring-2 ring-rose-200" : "border-slate-200"}`}
                  >
                    <div className="aspect-square w-full bg-slate-100">
                      {src ? (
                        <img src={src} alt={`Mẫu vải ${vai.tenVT}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-400">Chưa có ảnh vải</div>
                      )}
                    </div>
                    <div className="p-2">
                      <div className="font-black text-slate-800">Mã màu: {vai.maMoi || vai.maVT}</div>
                      <div className="line-clamp-2 text-xs font-semibold text-slate-600">{vai.tenChuan || vai.tenVT}</div>
                      <div className="mt-1 text-xs text-rose-600">Màu: {tenMauTuVai(vai)}</div>
                      <div className="text-[10px] text-slate-400">Tồn: {(vai.tonKho || 0).toLocaleString("vi-VN")} {vai.dvt || "kg"}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {hienPhieu && phieuDaTao && (
        <Modal onClose={() => setHienPhieu(false)}>
          <style>{`@media print {
            body * { visibility: hidden !important; }
            #phieu-san-xuat-vai, #phieu-san-xuat-vai * { visibility: visible !important; }
            #phieu-san-xuat-vai { position: absolute; inset: 0; width: 100%; background: white; }
            .khong-in { display: none !important; }
          }`}</style>
          <div id="phieu-san-xuat-vai" className="bg-white p-4 text-slate-900">
            <div className="border-b-2 border-[#307082] pb-3 text-center">
              <div className="text-sm font-bold text-[#307082]">MIMIN ERP</div>
              <h2 className="text-2xl font-black">PHIẾU SẢN XUẤT VẢI</h2>
              <div className="mt-1 text-xs text-slate-500">Ngày tạo: {phieuDaTao.ngayTao}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-slate-500">Lệnh dệt:</span> <b>{phieuDaTao.maLenhDet}</b></div>
              <div><span className="text-slate-500">Mẻ nhuộm:</span> <b>{phieuDaTao.maMeNhuom}</b></div>
              <div><span className="text-slate-500">NCC sợi:</span> <b>{phieuDaTao.tenNccSoi}</b></div>
              <div><span className="text-slate-500">Xưởng dệt:</span> <b>{phieuDaTao.tenXuongDet}</b></div>
              <div><span className="text-slate-500">Xưởng nhuộm:</span> <b>{phieuDaTao.tenXuongNhuom}</b></div>
              <div><span className="text-slate-500">Kho dự kiến:</span> <b>Khu {phieuDaTao.khu} · Kệ {phieuDaTao.ke}</b></div>
            </div>

            <h3 className="mt-4 rounded bg-[#307082] px-3 py-2 font-bold text-white">1. DANH SÁCH SỢI – TỔNG {phieuDaTao.tongKgSoi.toLocaleString("vi-VN")} KG</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Loại sợi</th><th className="border p-2">Mã lô</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá</th><th className="border p-2 text-right">Thành tiền</th></tr></thead>
                <tbody>{phieuDaTao.danhSachSoi.map((item) => (
                  <tr key={item.id}><td className="border p-2">{item.loaiSoi}</td><td className="border p-2 text-center">{item.maLoSoi}</td><td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGia.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold">{(item.soKg * item.donGia).toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <h3 className="mt-4 rounded bg-[#EA990C] px-3 py-2 font-bold text-white">2. DANH SÁCH MÀU NHUỘM</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-[#ECE7DC]"><th className="border p-2 text-left">Mã vải</th><th className="border p-2">Màu</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá nhuộm</th><th className="border p-2 text-right">Hóa chất</th></tr></thead>
                <tbody>{phieuDaTao.danhSachMau.map((item, index) => (
                  <tr key={`${item.maVai}-${index}`}><td className="border p-2">{item.maVai}</td><td className="border p-2 text-center">{item.mau}</td><td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGiaNhuom.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right">{item.chiPhiHoaChat.toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between rounded-xl border-2 border-[#EA990C] bg-[#ECE7DC] p-3 text-lg font-black">
              <span>TỔNG CHI PHÍ</span><span>{phieuDaTao.tongCong.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-8 text-center text-sm font-bold">
              <div>Người lập phiếu<br /><span className="font-normal text-slate-400">(Ký, ghi rõ họ tên)</span></div>
              <div>Xưởng dệt<br /><span className="font-normal text-slate-400">(Ký nhận)</span></div>
              <div>Quản lý<br /><span className="font-normal text-slate-400">(Ký duyệt)</span></div>
            </div>
          </div>
          <div className="khong-in mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setHienPhieu(false)} className="btn-secondary">Quay lại</button>
            <button type="button" onClick={() => window.print()} className="btn-primary inline-flex items-center gap-2 bg-[#EA990C]">
              <Printer className="h-4 w-4" /> In phiếu này
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
