// ============ LENH TONG FORM ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  nhapKhoSoi_V2, taoLenhDet, taoMeNhuom,
  type LoVaiTP,
} from "@/lib/yarn-production-chain";
import {
  getNCCByLoai, getXuongByLoai, getNCCById, getXuongById, themCongNo,
} from "@/lib/master-data";
import { F, Card } from "./ui-blocks";

export function LenhTongForm({ user }: { user: any }) {
  const nccs = getNCCByLoai("sợi");
  const dsXuongDet = getXuongByLoai("dệt");
  const dsXuongNhuom = getXuongByLoai("nhuộm");

  const [nccId, setNccId] = useState(nccs[0]?.id || "");
  const [loaiSoi, setLoaiSoi] = useState("Cotton 32s");
  const [maLoSoi, setMaLoSoi] = useState("LSOI-001");
  const [soKgSoi, setSoKgSoi] = useState(1000);
  const [donGiaSoi, setDonGiaSoi] = useState(130000);

  const [xuongDetId, setXuongDetId] = useState(dsXuongDet[0]?.id || "");
  const [donGiaDet, setDonGiaDet] = useState(8000);

  const [xuongNhuomId, setXuongNhuomId] = useState(dsXuongNhuom[0]?.id || "");
  const [danhSachMau, setDanhSachMau] = useState([
    { mau: "Đen", soKg: 200, donGiaNhuom: 15000, chiPhiHoaChat: 1200000 },
    { mau: "Trắng", soKg: 150, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 },
  ]);

  const [kho, setKho] = useState("Kho Vải TP");
  const [khu, setKhu] = useState("Khu A");
  const [ke, setKe] = useState("A03");

  const chiSoi = soKgSoi * donGiaSoi;
  const chiDet = soKgSoi * donGiaDet;
  const chiNhuom = danhSachMau.reduce((s, m) => s + m.soKg * m.donGiaNhuom, 0);
  const chiHoaChat = danhSachMau.reduce((s, m) => s + m.chiPhiHoaChat, 0);
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat;

  const ncc = getNCCById(nccId);
  const xDet = getXuongById(xuongDetId);
  const xNhuom = getXuongById(xuongNhuomId);

  const handleTao = () => {
    if (!ncc || !xDet || !xNhuom) {
      toast.error("Vui lòng chọn NCC và xưởng");
      return;
    }
    const r1 = nhapKhoSoi_V2({
      ngayNhap: new Date().toISOString().slice(0, 10),
      nccId: ncc.id, tenNCC: ncc.tenNCC,
      loaiSoi: `SOI-${loaiSoi.replace(/\s/g, "")}`,
      tenSoi: `Sợi ${loaiSoi}`, maLoSoi, soKg: soKgSoi, donGia: donGiaSoi,
      daThanhToan: 0, khoNhap: "Kho Sợi",
      nguoiPhuTrach: user?.name || "Admin", ghiChu: "", khoa: false,
    } as any, user);

    if (r1.ok) {
      themCongNo({
        ngayPhatSinh: new Date().toISOString().slice(0, 10),
        doiTuongId: ncc.id, tenDoiTuong: ncc.tenNCC,
        loai: "NCC sợi", maPhieuGoc: r1.phieu?.id || "",
        moTa: `Nhập ${soKgSoi}kg ${loaiSoi} từ ${ncc.tenNCC}`,
        phatSinh: chiSoi, thanhToan: 0,
      });
    }

    if (r1.ok) {
      const r2 = taoLenhDet({
        ngayGiao: new Date().toISOString().slice(0, 10),
        ngayDuKienNhan: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
        xuongDet: xDet.tenXuong, maLoSoi, loaiSoi,
        soKgGiao: soKgSoi, donGiaDet, tienDuKien: soKgSoi * donGiaDet, soMetDuKien: soKgSoi * 4,
        nguoiPhuTrach: user?.name || "Admin", ghiChu: "",
      }, user);

      if (r2.ok) {
        themCongNo({
          ngayPhatSinh: new Date().toISOString().slice(0, 10),
          doiTuongId: xDet.id, tenDoiTuong: xDet.tenXuong,
          loai: "Xưởng dệt", maPhieuGoc: r2.lenh?.id || "",
          moTa: `Dệt ${soKgSoi}kg sợi → ${xDet.tenXuong}`,
          phatSinh: chiDet, thanhToan: 0,
        });
      }

      if (danhSachMau.length > 0) {
        const r3 = taoMeNhuom({
          ngayGiao: new Date().toISOString().slice(0, 10),
          ngayDuKienNhan: new Date(Date.now() + 14 * 86400_000).toISOString().slice(0, 10),
          xuongNhuom: xNhuom.tenXuong,
          maLoMoc: `LM-${r2.lenh?.id}`,
          danhSachMau: danhSachMau.map((m) => ({ mau: m.mau, soKg: m.soKg, donGiaNhuom: m.donGiaNhuom })),
          nguoiPhuTrach: user?.name || "Admin",
          ghiChu: "",
        }, user);

        if (r3.ok) {
          themCongNo({
            ngayPhatSinh: new Date().toISOString().slice(0, 10),
            doiTuongId: xNhuom.id, tenDoiTuong: xNhuom.tenXuong,
            loai: "Xưởng nhuộm", maPhieuGoc: r3.me?.id || "",
            moTa: `Nhuộm ${danhSachMau.length} màu → ${xNhuom.tenXuong}`,
            phatSinh: chiNhuom + chiHoaChat, thanhToan: 0,
          });
        }
      }
    }

    toast.success(`✅ Tạo lệnh tổng thành công! Tổng: ${tongCong.toLocaleString()}đ | 3 công nợ đã tạo`);
  };

  return (
    <div className="space-y-3 p-3">
      {/* Bước 1: Sợi */}
      <div className="card p-3 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300">
        <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
          SỢI + NCC
        </h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs font-semibold opacity-70">Nhà cung cấp sợi</label>
            <select value={nccId} onChange={(e) => setNccId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
              {nccs.map((n) => <option key={n.id} value={n.id}>{n.tenNCC} ({n.maNCC})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <F label="Loại sợi" v={loaiSoi} on={setLoaiSoi} />
            <F label="Mã lô" v={maLoSoi} on={setMaLoSoi} />
            <F label="Số kg" v={soKgSoi} on={setSoKgSoi} type="number" />
            <F label="Đơn giá (đ/kg)" v={donGiaSoi} on={setDonGiaSoi} type="number" />
          </div>
        </div>
      </div>

      {/* Bước 2: Dệt */}
      <div className="card p-3 bg-violet-50 dark:bg-violet-900/20 border-2 border-violet-300">
        <h3 className="font-bold text-violet-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center">2</span>
          DỆT - GIA CÔNG
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng dệt</label>
          <select value={xuongDetId} onChange={(e) => setXuongDetId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
            {dsXuongDet.map((x) => <option key={x.id} value={x.id}>{x.tenXuong} ({x.maXuong})</option>)}
          </select>
        </div>
        <F label="Đơn giá dệt (đ/kg)" v={donGiaDet} on={setDonGiaDet} type="number" />
      </div>

      {/* Bước 3: Nhuộm */}
      <div className="card p-3 bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-300">
        <h3 className="font-bold text-rose-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">3</span>
          NHUỘM
        </h3>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng nhuộm</label>
          <select value={xuongNhuomId} onChange={(e) => setXuongNhuomId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold">
            {dsXuongNhuom.map((x) => <option key={x.id} value={x.id}>{x.tenXuong} ({x.maXuong})</option>)}
          </select>
        </div>
        <div className="text-[10px] font-semibold opacity-70 mt-2 mb-1">Danh sách màu nhuộm:</div>
        {danhSachMau.map((m, i) => (
          <div key={i} className="grid grid-cols-12 gap-1 mb-1 text-xs">
            <input value={m.mau} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, mau: e.target.value }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border" />
            <input type="number" value={m.soKg} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, soKg: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-2 px-2 py-1 rounded border text-right" />
            <input type="number" value={m.donGiaNhuom} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, donGiaNhuom: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border text-right" />
            <input type="number" value={m.chiPhiHoaChat} onChange={(e) => {
              const newM = [...danhSachMau]; newM[i] = { ...m, chiPhiHoaChat: Number(e.target.value) }; setDanhSachMau(newM);
            }} className="col-span-3 px-2 py-1 rounded border text-right" />
            <button onClick={() => setDanhSachMau(danhSachMau.filter((_, idx) => idx !== i))} className="col-span-1 text-rose-600 p-1">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button onClick={() => setDanhSachMau([...danhSachMau, { mau: "Mới", soKg: 0, donGiaNhuom: 12000, chiPhiHoaChat: 1000000 }])} className="text-xs text-blue-600 mt-1">
          <Plus className="w-3 h-3 inline" /> Thêm màu
        </button>
      </div>

      {/* Bước 4: Kho TP */}
      <div className="card p-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-300">
        <h3 className="font-bold text-emerald-700 flex items-center gap-2 mb-2">
          <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">4</span>
          KHO VẢI TP
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <F label="Kho" v={kho} on={setKho} />
          <F label="Khu" v={khu} on={setKhu} />
          <F label="Kệ" v={ke} on={setKe} />
        </div>
      </div>

      {/* Tổng kết */}
      <div className="card p-3 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-2 border-amber-500">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Card label="Chi sợi" v={chiSoi} c="blue" sub={ncc?.tenNCC} />
          <Card label="Chi dệt" v={chiDet} c="violet" sub={xDet?.tenXuong} />
          <Card label="Chi nhuộm" v={chiNhuom + chiHoaChat} c="rose" sub={xNhuom?.tenXuong} />
          <Card label="Tổng" v={tongCong} c="amber" />
        </div>
        <div className="mt-2 text-center text-2xl font-bold text-amber-600">
          {tongCong.toLocaleString()}đ
        </div>
      </div>

      <button onClick={handleTao} className="btn-primary w-full py-3 bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500 text-base">
        <Sparkles className="w-4 h-4 inline" /> TẠO LỆNH + 3 CÔNG NỢ
      </button>
    </div>
  );
}
