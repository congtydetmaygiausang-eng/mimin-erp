// ============ LENH TONG FORM ============
// Tach tu page.tsx (2026-08-05 - toi uu B.4)

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, Printer, Sparkles, Trash2, Eye, History, FileText, Image as ImageIcon, Calendar, Factory, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  nhapKhoSoi_V2,
  taoLenhDet,
  taoMeNhuom,
  nghiemThuDet_V2,
  nghiemThuMau_V2,
  nhapKhoVaiTP,
  type LoVaiTP,
  getAllPhieuSanXuatVai,
  savePhieuSanXuatVai,
  deletePhieuSanXuatVai,
  saveCollection,
  YARN_PRODUCTION_SYNCED_EVENT,
} from "@/lib/yarn-production-chain";
import { themCongNo } from "@/lib/master-data";
import { thuocNhomSanXuatVai, useNhaCungCap } from "@/lib/data/nha-cung-cap-store";
import { type KhoVai } from "@/lib/data/real-data";
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
import { KHU_ME_NHUOM, createFabricDyeLot, type KhuMeNhuom } from "@/lib/data/fabric-dye-lots";
import { Card, F, Modal } from "./ui-blocks";
import PhieuNhapSoiPrint from "./PhieuNhapSoiPrint";
import PhieuGiaoDetPrint from "./PhieuGiaoDetPrint";
import { ChungTuUploaderCompact } from "./ChungTuUploaderCompact";
import type { UploadedFile } from "@/components/ui/ImageUploader";
import ImageLightbox from "@/components/ui/ImageLightbox";

type MauNhuomInput = {
  maVai: string;
  mau: string;
  soKg: number;
  soCay?: number;
  donGiaNhuom: number;
  chiPhiHoaChat: number;
  vat?: number;
};

type SoiInput = {
  id: string;
  loaiSoi: string;
  maLoSoi: string;
  soKg: number;
  donGia: number;
  vat?: number;
  soThung?: number;
  kgMoiThung?: number;
};

type PhieuSanXuatVai = {
  id?: string;
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
  anhChungTuGiaoDet?: UploadedFile[];
  anhChungTuGiaoNhuom?: UploadedFile[];
  anhChungTuGiaoKhoTP?: UploadedFile[];
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
    { id: "soi-1", loaiSoi: "Cotton 32s", maLoSoi: "LSOI-001", soKg: 1000, donGia: 130000, vat: 8 },
  ]);

  const [xuongDetId, setXuongDetId] = useState("");
  const [donGiaDet, setDonGiaDet] = useState(8000);
  const [vatDet, setVatDet] = useState(8); // % VAT dệt

  const [xuongNhuomId, setXuongNhuomId] = useState("");
  const [vatNhuomChung, setVatNhuomChung] = useState(8); // % VAT nhuộm mặc định
  const [danhSachVaiKho, setDanhSachVaiKho] = useState<KhoVai[]>(() => getAllInventory());
  const [anhVaiCu, setAnhVaiCu] = useState<Record<string, string>>(() => getVaiImages());
  const [danhSachMau, setDanhSachMau] = useState<MauNhuomInput[]>([]);

  const kho = "Kho vải thành phẩm";
  const [khu, setKhu] = useState<KhuMeNhuom>("C");
  const [ke, setKe] = useState("C01");
  const [nhapKhoNgay, setNhapKhoNgay] = useState(true);
  const [daTaoLenh, setDaTaoLenh] = useState(false);
  const [hienPhieu, setHienPhieu] = useState(false);
  const [hienPhieuNhapSoi, setHienPhieuNhapSoi] = useState(false);
  const [hienPhieuGiaoDet, setHienPhieuGiaoDet] = useState(false);
  const [dongDangChonVai, setDongDangChonVai] = useState<number | null>(null);
  const [phieuDaTao, setPhieuDaTao] = useState<PhieuSanXuatVai | null>(null);

  // Ảnh chứng từ 3 khâu (Sợi giao dệt, Dệt giao nhuộm, Nhuộm giao kho vải TP)
  const [anhChungTuGiaoDet, setAnhChungTuGiaoDet] = useState<UploadedFile[]>([]);
  const [anhChungTuGiaoNhuom, setAnhChungTuGiaoNhuom] = useState<UploadedFile[]>([]);
  const [anhChungTuGiaoKhoTP, setAnhChungTuGiaoKhoTP] = useState<UploadedFile[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Lịch sử Lệnh Sản Xuất Vải đã lưu (lưu vĩnh viễn cả LocalStorage + Supabase)
  const [danhSachLichSu, setDanhSachLichSu] = useState<PhieuSanXuatVai[]>(() => getAllPhieuSanXuatVai());

  useEffect(() => {
    const handleSync = () => {
      setDanhSachLichSu(getAllPhieuSanXuatVai());
    };
    window.addEventListener(YARN_PRODUCTION_SYNCED_EVENT, handleSync);
    return () => window.removeEventListener(YARN_PRODUCTION_SYNCED_EVENT, handleSync);
  }, []);

  const tongKgSoi = danhSachSoi.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0);

  // 1. Khâu SỢI
  const chiSoi = danhSachSoi.reduce((sum, item) => sum + Math.max(item.soKg, 0) * Math.max(item.donGia, 0), 0);
  const vatSoi = danhSachSoi.reduce(
    (sum, item) => sum + (Math.max(item.soKg, 0) * Math.max(item.donGia, 0) * (item.vat ?? 8)) / 100,
    0
  );
  const chiSoiCoVAT = chiSoi + vatSoi;

  // 2. Khâu DỆT
  const chiDet = tongKgSoi * donGiaDet;
  const vatDetTien = (chiDet * vatDet) / 100;
  const chiDetCoVAT = chiDet + vatDetTien;
  const donGiaDetCoVAT = donGiaDet * (1 + vatDet / 100);

  // 3. Khâu NHUỘM & HÓA CHẤT
  const chiNhuom = danhSachMau.reduce((sum, item) => sum + Math.max(item.soKg, 0) * Math.max(item.donGiaNhuom, 0), 0);
  const chiHoaChat = danhSachMau.reduce((sum, item) => sum + Math.max(item.chiPhiHoaChat, 0), 0);
  const vatNhuomTien = danhSachMau.reduce((sum, item) => {
    const tongTienMau = Math.max(item.soKg, 0) * Math.max(item.donGiaNhuom, 0) + Math.max(item.chiPhiHoaChat, 0);
    return sum + (tongTienMau * (item.vat ?? vatNhuomChung)) / 100;
  }, 0);
  const chiNhuomCoVAT = chiNhuom + chiHoaChat + vatNhuomTien;

  // TỔNG HỢP CHI PHÍ & VAT 3 KHÂU
  const tongCong = chiSoi + chiDet + chiNhuom + chiHoaChat; // Chưa VAT
  const tongVAT = vatSoi + vatDetTien + vatNhuomTien; // Tổng tiền VAT từng khâu
  const tongChiPhiCoVAT = tongCong + tongVAT; // Có VAT
  const vatBinhQuanPt = tongCong > 0 ? (tongVAT / tongCong) * 100 : 0; // % VAT bình quân

  const tongKgVaiTP = danhSachMau.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0);
  const tongCayVaiTP = danhSachMau.reduce((sum, item) => sum + (item.soCay || (item.soKg > 0 ? Math.max(1, Math.ceil(item.soKg / 20)) : 0)), 0);
  const haoHutTongKg = tongKgSoi - tongKgVaiTP;
  const haoHutTongPt = tongKgSoi > 0 ? (haoHutTongKg / tongKgSoi) * 100 : 0;

  // ===== TÍNH GIÁ VỐN 1 KG VẢI THÀNH PHẨM (có trừ hao hụt + VAT từng khâu) =====
  // Giá vốn 1 kg vải TP = Tổng chi phí / số kg TP thực nhận (hao hụt đã hấp thụ)
  const giaVon1KgTP_chuaVAT = tongKgVaiTP > 0 ? tongCong / tongKgVaiTP : 0;
  const giaVon1KgTP_coVAT = tongKgVaiTP > 0 ? tongChiPhiCoVAT / tongKgVaiTP : 0;
  // Chi phí trung bình trên 1 kg sợi đầu vào
  const chiPhi1KgSoi = tongKgSoi > 0 ? tongCong / tongKgSoi : 0;
  // Hệ số hao hụt (sợi gốc → vải TP): dùng để quy đổi giá gốc sang giá sau hao hụt
  const heSoHaoHut = tongKgVaiTP > 0 ? tongKgSoi / tongKgVaiTP : 1;

  const giaVonTheoMau = useMemo(() => {
    const tongKg = danhSachMau.reduce((sum, item) => sum + Math.max(item.soKg, 0), 0);
    let chiSoiDaPhanBo = 0;
    let vatSoiDaPhanBo = 0;
    let chiDetDaPhanBo = 0;
    let vatDetDaPhanBo = 0;

    return danhSachMau.map((item, index) => {
      const laMauCuoi = index === danhSachMau.length - 1;
      const tyTrong = tongKg > 0 ? Math.max(item.soKg, 0) / tongKg : 0;

      const chiSoiPhanBo = tongKg <= 0 ? 0 : laMauCuoi ? chiSoi - chiSoiDaPhanBo : Math.round(chiSoi * tyTrong);
      const vatSoiPhanBo = tongKg <= 0 ? 0 : laMauCuoi ? vatSoi - vatSoiDaPhanBo : Math.round(vatSoi * tyTrong);

      const chiDetPhanBo = tongKg <= 0 ? 0 : laMauCuoi ? chiDet - chiDetDaPhanBo : Math.round(chiDet * tyTrong);
      const vatDetPhanBo = tongKg <= 0 ? 0 : laMauCuoi ? vatDetTien - vatDetDaPhanBo : Math.round(vatDetTien * tyTrong);

      chiSoiDaPhanBo += chiSoiPhanBo;
      vatSoiDaPhanBo += vatSoiPhanBo;
      chiDetDaPhanBo += chiDetPhanBo;
      vatDetDaPhanBo += vatDetPhanBo;

      const tienNhuom = item.soKg * item.donGiaNhuom;
      const vatMauRate = item.vat ?? vatNhuomChung;
      const vatNhuomPhanBo = ((tienNhuom + item.chiPhiHoaChat) * vatMauRate) / 100;

      const tongGiaVon = chiSoiPhanBo + chiDetPhanBo + tienNhuom + item.chiPhiHoaChat;
      const tongVATMau = vatSoiPhanBo + vatDetPhanBo + vatNhuomPhanBo;
      const tongGiaVonCoVAT = tongGiaVon + tongVATMau;

      const giaVonMoiKg = item.soKg > 0 ? tongGiaVon / item.soKg : 0;
      const giaVonMoiKgCoVAT = item.soKg > 0 ? tongGiaVonCoVAT / item.soKg : 0;

      return {
        ...item,
        chiSoiPhanBo,
        vatSoiPhanBo,
        chiDetPhanBo,
        vatDetPhanBo,
        tienNhuom,
        vatNhuomPhanBo,
        tongGiaVon,
        tongVATMau,
        tongGiaVonCoVAT,
        giaVonMoiKg,
        giaVonMoiKgCoVAT,
      };
    });
  }, [chiDet, chiSoi, danhSachMau, vatSoi, vatDetTien, vatNhuomChung]);

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
        vat: 8,
        soThung: 0,
        kgMoiThung: 0,
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

  const handleTao = async () => {
    setDaTaoLenh(false);
    if (!ncc || !xDet || !xNhuom) {
      toast.error("Vui lòng cập nhật danh bạ NCC sợi, dệt, nhuộm trước");
      return;
    }

    if (danhSachSoi.length === 0 || danhSachSoi.some((item) => !item.loaiSoi.trim() || !item.maLoSoi.trim() || item.soKg <= 0 || item.donGia < 0)) {
      toast.error("Vui lòng nhập đầy đủ loại sợi, mã lô, số kg và đơn giá");
      return;
    }

    if (nhapKhoNgay && danhSachMau.length === 0) {
      toast.error("Vui lòng thêm ít nhất một mã màu nhuộm để nhập kho thành phẩm");
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
        chungTu: anhChungTuGiaoDet,
        khoa: false,
      } as any, user);

      if (ketQua.ok) {
        const tienSoiCoVAT = Math.round(soi.soKg * soi.donGia * (1 + (soi.vat ?? 8) / 100));
        themCongNo({
          ngayPhatSinh: new Date().toISOString().slice(0, 10),
          doiTuongId: ncc.id,
          tenDoiTuong: ncc.ten_ncc,
          loai: "NCC sợi",
          maPhieuGoc: ketQua.phieu?.id || "",
          moTa: `Nhập ${soi.soKg}kg ${soi.loaiSoi} - lô ${soi.maLoSoi} từ ${ncc.ten_ncc}${soi.vat ? ` (VAT ${soi.vat}%)` : ""}`,
          phatSinh: tienSoiCoVAT,
          thanhToan: 0,
        });
      }
      return ketQua;
    });

    if (ketQuaNhapSoi.some((ketQua) => !ketQua.ok)) {
      toast.error("Có lô sợi chưa nhập được; chưa tạo lệnh dệt");
      return;
    }

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
      chungTuXuatNhanSoi: anhChungTuGiaoDet,
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
      moTa: `Dệt ${tongKgSoi}kg từ ${danhSachSoi.length} loại sợi → ${xDet.ten_ncc}${vatDet ? ` (VAT ${vatDet}%)` : ""}`,
      phatSinh: Math.round(chiDetCoVAT),
      thanhToan: 0,
    });

    let r3MeNhuom: any = null;

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
          soCay: m.soCay || (m.soKg > 0 ? Math.max(1, Math.ceil(m.soKg / 20)) : 1),
          donGiaNhuom: m.donGiaNhuom,
          giaVonDuKien: giaVonTheoMau[index]?.giaVonMoiKgCoVAT || giaVonTheoMau[index]?.giaVonMoiKg || 0,
        })),
        nguoiPhuTrach: user?.name || "Admin",
        chungTuNhanMoc: anhChungTuGiaoNhuom,
        ghiChu: [
          `Mã vải TP: ${danhSachMau.map((m) => `${m.maVai}-${m.mau}`).join(", ")}`,
          `Vị trí dự kiến: ${kho} · Khu ${khu} - ${KHU_ME_NHUOM[khu].ten} · Kệ ${ke || "chưa xếp"}`,
        ].join(" | "),
      }, user);

      if (!r3.ok) {
        toast.error(r3.message || "Chưa tạo được mẻ nhuộm");
        return;
      }

      r3MeNhuom = r3;

      themCongNo({
        ngayPhatSinh: new Date().toISOString().slice(0, 10),
        doiTuongId: xNhuom.id,
        tenDoiTuong: xNhuom.ten_ncc,
        loai: "Xưởng nhuộm",
        maPhieuGoc: r3.me?.id || "",
        moTa: `Nhuộm ${danhSachMau.length} màu → ${xNhuom.ten_ncc} (gồm VAT)`,
        phatSinh: Math.round(chiNhuomCoVAT),
        thanhToan: 0,
      });

      // ============ TỰ ĐỘNG NGHIỆM THU & NHẬP KHO THÀNH PHẨM (GIAI ĐOẠN 1) ============
      if (nhapKhoNgay && r2.lenh && r3.me) {
        // 1. Tự động nghiệm thu lệnh dệt vải mộc
        const tongKgMoc = tongKgSoi;
        const soCayMoc = Math.max(1, Math.ceil(tongKgMoc / 20));
        const danhSachCayMoc = Array.from({ length: soCayMoc }, (_, idx) => ({
          maCay: `MOC-${r2.lenh!.id}-${String(idx + 1).padStart(2, "0")}`,
          kg: Number((tongKgMoc / soCayMoc).toFixed(2)),
        }));

        nghiemThuDet_V2(r2.lenh.id, {
          soKgMocNhan: tongKgMoc,
          soCayMoc,
          danhSachCayMoc,
          soKgLoi: 0,
          chiPhiPhatSinh: 0,
          daThanhToan: 0,
          khoMocNhap: "Kho Vải Mộc",
          ketQuaKiemTra: "Đạt chuẩn",
          chungTuBanGiaoMoc: anhChungTuGiaoNhuom,
        }, user);

        // 2. Tự động nghiệm thu vải màu cho mẻ nhuộm
        const nghiemThuData = danhSachMau.map((m) => {
          const soCay = m.soCay || (m.soKg > 0 ? Math.max(1, Math.ceil(m.soKg / 20)) : 1);
          return {
            mau: m.mau,
            soKgMocGiao: m.soKg,
            soKgMauNhan: m.soKg,
            soCayNhan: soCay,
            soKgLoi: 0,
            donGiaNhuom: m.donGiaNhuom,
            chiPhiHoaChat: m.chiPhiHoaChat,
            chiPhiHoanThien: 0,
            chiPhiPhatSinh: 0,
            daThanhToan: 0,
          };
        });

        const rNghiemThu = nghiemThuMau_V2(
          r3.me.id,
          nghiemThuData,
          user?.name || "Admin",
          user,
          anhChungTuGiaoKhoTP
        );

        // 3. Tự động nhập kho thành phẩm chi tiết và đồng bộ tồn kho
        for (let idx = 0; idx < danhSachMau.length; idx++) {
          const m = danhSachMau[idx];
          const vaiKho = danhSachVaiKho.find((vai) => vai.maVT === m.maVai);
          if (!vaiKho) continue;

          const soCay = m.soCay || (m.soKg > 0 ? Math.max(1, Math.ceil(m.soKg / 20)) : 1);
          const kgMoiCay = Number((m.soKg / soCay).toFixed(2));
          const giaVon = Math.round(giaVonTheoMau[idx]?.giaVonMoiKgCoVAT || giaVonTheoMau[idx]?.giaVonMoiKg || m.donGiaNhuom);

          // Tạo Dye Lot chờ kiểm hoặc lưu trữ ở Khu C / khu được chọn
          try {
            await createFabricDyeLot({
              maMe: `${r3.me.id}-${m.maVai || idx + 1}`,
              sku: vaiKho.maVT,
              mauSac: m.mau,
              ngayNhap: new Date().toISOString().slice(0, 10),
              xuongNhuom: xNhuom.ten_ncc,
              donGia: giaVon,
              soKgNhap: m.soKg,
              tonKg: m.soKg,
              soCay,
              khu,
              ke: ke || "C01",
              tang: "",
              o: "",
              trangThai: "CHO_KIEM",
              ghiChu: `Tự động nhập từ Lệnh tổng SX ${r2.lenh.id} / Mẻ ${r3.me.id}`,
            });
          } catch (err) {
            console.warn("[LenhTongForm] createFabricDyeLot skipped/fallback:", err);
          }

          // Tạo lô vải thành phẩm cây chi tiết
          nhapKhoVaiTP({
            ngayNhap: new Date().toISOString().slice(0, 10),
            meNhuomId: r3.me.id,
            nghiemThuMauId: rNghiemThu.phieu?.id || `NTM_${r3.me.id}`,
            loaiVai: "Vải thành phẩm",
            mau: m.mau,
            maMau: vaiKho.maMoi || m.maVai,
            maLo: `${r3.me.id}-${idx + 1}`,
            danhSachCay: Array.from({ length: soCay }, (_, cIdx) => ({
              stt: cIdx + 1,
              kg: kgMoiCay,
            })),
            giaVonPerKg: giaVon,
            kho: "Kho Vải TP",
            khu: `Khu ${khu}`,
            ke: ke || "Chưa xếp",
            tang: "",
            viTri: `Khu ${khu} - Kệ ${ke || "C01"}`,
            trangThaiChatLuong: "Chờ kiểm",
            nguoiPhuTrach: user?.name || "Admin",
            ghiChu: `Nhập từ Lệnh tổng SX (Sợi ➔ Dệt ➔ Nhuộm ${m.mau})`,
            chungTuNhapKho: anhChungTuGiaoKhoTP,
          }, user);

          // Cập nhật tồn kho và số cây
          nhapKho(vaiKho.maVT, m.soKg, user, `Nhập từ Lệnh tổng SX Vải (Mẻ ${r3.me.id})`, {
            ngay: new Date().toISOString().slice(0, 10),
            donGia: giaVon,
            nguonNhap: xNhuom.ten_ncc,
            nguoiThucHien: user?.name || "Admin",
          });

          const tonKhoHienTai = getInventoryByMaVT(vaiKho.maVT);
          updateVaiInfo(vaiKho.maVT, {
            tonCay: (tonKhoHienTai?.tonCay || 0) + soCay,
            soCayNhap: (tonKhoHienTai?.soCayNhap || 0) + soCay,
            donGia: giaVon,
          });

          const vaiDaCapNhat = getInventoryByMaVT(vaiKho.maVT);
          if (vaiDaCapNhat) {
            await upsertInventoryItem(vaiDaCapNhat);
          }
        }
      }

      const phieuMoi: PhieuSanXuatVai = {
        id: `PSX-${r2.lenh?.id || Date.now()}`,
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
        anhChungTuGiaoDet,
        anhChungTuGiaoNhuom,
        anhChungTuGiaoKhoTP,
      };

      savePhieuSanXuatVai(phieuMoi);
      setPhieuDaTao(phieuMoi);
      setDanhSachLichSu(getAllPhieuSanXuatVai());
    }

    setDaTaoLenh(true);
    if (nhapKhoNgay) {
      toast.success(
        `Đã tạo lệnh & tự động nhập kho TP: ${tongKgVaiTP.toLocaleString()}kg (${tongCayVaiTP} cây) vào Khu ${khu}! Tổ Cắt có thể lấy vải cắt ngay.`
      );
    } else {
      toast.success(`Đã lưu và tạo lệnh thành công. Tổng: ${tongCong.toLocaleString()}đ | ${danhSachSoi.length + 2} công nợ đã tạo`);
    }
  };

  return (
    <div className="space-y-3 p-3">
      {thieuDanhBa && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
          Danh bạ chưa đủ NCC thuộc nhóm sợi, dệt, nhuộm. Anh cập nhật trong Danh bạ NCC rồi quay lại tạo lệnh SX vải.
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 md:p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="flex items-center gap-2.5 font-bold text-slate-800 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm">1</span>
            SỢI + NHÀ CUNG CẤP
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setHienPhieuNhapSoi(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-blue-700"
            >
              <Printer className="h-4 w-4" /> IN PHIẾU
            </button>
            <button
              type="button"
              onClick={themDongSoi}
              className="inline-flex items-center gap-1 rounded-lg bg-[#EA990C] px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-[#D98200]"
            >
              <Plus className="h-4 w-4" /> THÊM SỢI MỚI
            </button>
          </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-12 gap-2 items-start">
                  <div className="col-span-2 md:col-span-2">
                    <F label="Loại sợi" v={soi.loaiSoi} on={(value) => capNhatSoi(soi.id, { loaiSoi: value })} />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <F label="Mã lô" v={soi.maLoSoi} on={(value) => capNhatSoi(soi.id, { maLoSoi: value })} />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <F label="Số thùng" v={soi.soThung || 0} on={(value) => {
                      const newSoThung = Number(value);
                      const newKgMoiThung = soi.kgMoiThung || 0;
                      capNhatSoi(soi.id, { soThung: newSoThung, soKg: newSoThung > 0 && newKgMoiThung > 0 ? newSoThung * newKgMoiThung : soi.soKg });
                    }} type="number" />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <F label="Kg/thùng" v={soi.kgMoiThung || 0} on={(value) => {
                      const newKgMoiThung = Number(value);
                      const newSoThung = soi.soThung || 0;
                      capNhatSoi(soi.id, { kgMoiThung: newKgMoiThung, soKg: newSoThung > 0 && newKgMoiThung > 0 ? newSoThung * newKgMoiThung : soi.soKg });
                    }} type="number" />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <F label="Số kg" v={soi.soKg} on={(value) => capNhatSoi(soi.id, { soKg: value })} type="number" />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <F label="Đơn giá (đ/kg)" v={soi.donGia} on={(value) => capNhatSoi(soi.id, { donGia: value })} type="number" />
                  </div>
                  <div className="col-span-2 md:col-span-2">
                    <label className="text-[11px] font-bold text-blue-900 block mb-1">
                      % VAT Sợi
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={soi.vat ?? 8}
                        onChange={(e) => capNhatSoi(soi.id, { vat: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-full px-2 py-2 rounded-lg border-2 border-blue-400 bg-blue-50/40 text-center text-sm font-black text-blue-950 focus:ring-2 focus:ring-blue-500 shadow-inner"
                        placeholder="% VAT"
                        title="Thuế suất % VAT sợi"
                      />
                      <span className="text-xs font-bold text-blue-800">%</span>
                    </div>
                  </div>
                </div>

                {(() => {
                  const vatRateSoi = soi.vat ?? 8;
                  const thanhTienChuaVat = soi.soKg * soi.donGia;
                  const vatTienSoi = (thanhTienChuaVat * vatRateSoi) / 100;
                  const thanhTienCoVat = thanhTienChuaVat + vatTienSoi;
                  const donGiaCoVat = soi.donGia * (1 + vatRateSoi / 100);
                  return (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-blue-50/80 border border-blue-200 px-3 py-1.5 text-xs text-blue-950">
                      <div>
                        Đơn giá sợi có VAT: <b className="text-blue-900">{Math.round(donGiaCoVat).toLocaleString("vi-VN")} đ/kg</b>
                        {vatRateSoi > 0 && <span className="text-[10px] text-blue-700 font-semibold ml-1.5">(Đã gồm {vatRateSoi}% VAT)</span>}
                      </div>
                      <div className="text-right">
                        <span>Tiền sợi: <b>{thanhTienChuaVat.toLocaleString("vi-VN")}đ</b></span>
                        {vatRateSoi > 0 && (
                          <>
                            <span className="mx-1.5 text-blue-300">|</span>
                            <span>VAT {vatRateSoi}%: <b className="text-amber-700">+{Math.round(vatTienSoi).toLocaleString("vi-VN")}đ</b></span>
                            <span className="mx-1.5 text-blue-300">|</span>
                            <span>Tổng có VAT: <b className="text-blue-950 font-black">{Math.round(thanhTienCoVat).toLocaleString("vi-VN")}đ</b></span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={themDongSoi}
                className="shrink-0 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                <Plus className="mr-1 inline h-4 w-4" /> Thêm sợi mới
              </button>

              {/* Ô upload ảnh chứng từ giao dệt (đúng vị trí khung đỏ anh Cường yêu cầu) */}
              <div className="flex-1 min-w-[260px] max-w-xl">
                <ChungTuUploaderCompact
                  files={anhChungTuGiaoDet}
                  onChange={setAnhChungTuGiaoDet}
                  title="Ảnh chứng từ giao sợi cho xưởng dệt"
                  subTitle="Phiếu giao sợi, biên bản bàn giao xưởng dệt"
                  themeColor="blue"
                  compact
                />
              </div>

              <div className="shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-right text-white shadow-sm">
                <div className="text-[10px] font-medium text-white/80">Tổng {tongKgSoi.toLocaleString("vi-VN")} kg sợi chuyển dệt</div>
                <div className="text-sm font-black">
                  Tiền sợi: {chiSoi.toLocaleString("vi-VN")}đ
                  {vatSoi > 0 && (
                    <span className="text-blue-100 text-xs font-semibold block">
                      VAT sợi: +{Math.round(vatSoi).toLocaleString("vi-VN")}đ | Tổng có VAT: {Math.round(chiSoiCoVAT).toLocaleString("vi-VN")}đ
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 md:p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="flex items-center gap-2.5 font-bold text-slate-800 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-violet-600 text-xs font-bold text-white shadow-sm">2</span>
            DỆT VẢI MỘC (GIA CÔNG)
          </h3>
          <button
            type="button"
            onClick={() => setHienPhieuGiaoDet(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-md transition hover:bg-violet-700"
          >
            <Printer className="h-4 w-4" /> IN PHIẾU
          </button>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng dệt</label>
          <select value={xuongDetId} onChange={(e) => setXuongDetId(e.target.value)} disabled={loading || dsXuongDet.length === 0} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60">
            {dsXuongDet.length === 0 && <option value="">Chưa có NCC dệt</option>}
            {dsXuongDet.map((x) => <option key={x.id} value={x.id}>{x.ten_ncc} ({x.ma_ncc})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <F label="Đơn giá dệt (đ/kg) - Chưa VAT" v={donGiaDet} on={setDonGiaDet} type="number" />
          <div>
            <label className="text-xs font-semibold opacity-70 block mb-1">% VAT dệt gia công</label>
            <div className="flex items-center gap-1.5 bg-violet-50 rounded-xl p-1 border border-violet-200">
              {[0, 5, 8, 10].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setVatDet(rate)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    vatDet === rate ? "bg-violet-600 text-white shadow-xs" : "bg-white text-violet-900 hover:bg-violet-100"
                  }`}
                >
                  {rate}%
                </button>
              ))}
              <div className="flex items-center ml-auto">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={vatDet}
                  onChange={(e) => setVatDet(Math.max(0, Number(e.target.value) || 0))}
                  className="w-14 rounded-lg border border-violet-300 bg-white px-1.5 py-1 text-center text-xs font-black text-violet-900 focus:ring-2 focus:ring-violet-400"
                  title="Nhập % VAT dệt"
                />
                <span className="text-xs font-bold text-violet-700 ml-1 mr-1">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-950">
          <div>
            Đơn giá dệt có VAT: <b className="text-violet-800">{Math.round(donGiaDetCoVAT).toLocaleString("vi-VN")} đ/kg</b>
            <span className="text-[10px] text-violet-600 ml-1.5">(Chưa VAT: {donGiaDet.toLocaleString("vi-VN")}đ/kg)</span>
          </div>
          <div>
            Tiền dệt chưa VAT: <b>{chiDet.toLocaleString("vi-VN")}đ</b>
            {vatDet > 0 && (
              <>
                <span className="mx-1.5 text-violet-300">|</span>
                <span>VAT {vatDet}%: <b className="text-amber-700">+{Math.round(vatDetTien).toLocaleString("vi-VN")}đ</b></span>
                <span className="mx-1.5 text-violet-300">|</span>
                <span>Tổng có VAT: <b className="text-violet-950 font-black">{Math.round(chiDetCoVAT).toLocaleString("vi-VN")}đ</b></span>
              </>
            )}
          </div>
        </div>

        <div className="mt-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-white shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Tổng giao xưởng dệt</div>
            <div className="text-xl font-black">{tongKgSoi.toLocaleString("vi-VN")} kg · {danhSachSoi.length} loại sợi</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-white/80">Tổng chi dệt dự kiến</div>
            <div className="text-base font-black">{Math.round(chiDetCoVAT).toLocaleString("vi-VN")}đ {vatDet > 0 && <span className="text-xs font-normal text-violet-200">(gồm VAT)</span>}</div>
          </div>
        </div>

        {/* Ô upload ảnh chứng từ dệt giao nhuộm */}
        <div className="mt-3 border-t border-violet-100 pt-3">
          <ChungTuUploaderCompact
            files={anhChungTuGiaoNhuom}
            onChange={setAnhChungTuGiaoNhuom}
            title="Ảnh chứng từ dệt giao xưởng nhuộm"
            subTitle="Phiếu xuất vải mộc, biên bản bàn giao mộc cho xưởng nhuộm"
            themeColor="violet"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 md:p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-rose-600 text-xs font-bold text-white shadow-sm">3</span>
            <h3 className="font-bold text-slate-800 text-sm">NHUỘM MÀU HOÀN TẤT</h3>
          </div>
          <div className="flex items-center gap-1.5 bg-rose-50 rounded-xl px-2 py-1 border border-rose-200">
            <span className="text-xs font-bold text-rose-900">% VAT Nhuộm mặc định:</span>
            {[0, 5, 8, 10].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setVatNhuomChung(rate);
                  setDanhSachMau((prev) => prev.map((m) => ({ ...m, vat: rate })));
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  vatNhuomChung === rate ? "bg-rose-600 text-white shadow-xs" : "bg-white text-rose-900 hover:bg-rose-100"
                }`}
              >
                {rate}%
              </button>
            ))}
            <input
              type="number"
              min="0"
              max="100"
              value={vatNhuomChung}
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value) || 0);
                setVatNhuomChung(val);
                setDanhSachMau((prev) => prev.map((m) => ({ ...m, vat: val })));
              }}
              className="w-12 rounded-lg border border-rose-300 bg-white px-1 py-0.5 text-center text-xs font-black text-rose-900 focus:ring-2 focus:ring-rose-400"
              title="Đổi % VAT cho tất cả các màu nhuộm"
            />
            <span className="text-xs font-bold text-rose-700">%</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold opacity-70">Xưởng nhuộm</label>
          <select value={xuongNhuomId} onChange={(e) => setXuongNhuomId(e.target.value)} disabled={loading || dsXuongNhuom.length === 0} className="w-full px-3 py-2 rounded-lg border text-sm font-semibold disabled:opacity-60">
            {dsXuongNhuom.length === 0 && <option value="">Chưa có NCC nhuộm</option>}
            {dsXuongNhuom.map((x) => <option key={x.id} value={x.id}>{x.ten_ncc} ({x.ma_ncc})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-12 gap-1 text-[10px] font-semibold opacity-70 mt-3 mb-1">
          <div className="col-span-3">Mã màu kho TP</div>
          <div className="col-span-2">Màu</div>
          <div className="col-span-1 text-right">Số kg TP</div>
          <div className="col-span-1 text-right">Số cây</div>
          <div className="col-span-2 text-right">Đơn giá nhuộm</div>
          <div className="col-span-1 text-right">Hóa chất</div>
          <div className="col-span-1 text-center">% VAT</div>
          <div className="col-span-1 text-center">Xóa</div>
        </div>
        {danhSachMau.map((m, i) => (
          <div key={`${m.maVai}-${i}`} className="mb-2 rounded-lg border border-rose-200 bg-white/50 p-1.5 text-xs">
            <div className="grid grid-cols-12 gap-1 items-center">
              <div className="col-span-3">
                <button
                  type="button"
                  onClick={() => setDongDangChonVai(i)}
                  className="w-full rounded border bg-white px-2 py-1 text-left font-semibold truncate hover:border-rose-400 hover:bg-rose-50"
                  title="Chọn mã màu từ Kho vải thành phẩm"
                >
                  {m.maVai
                    ? `${danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.maMoi || m.maVai} - ${danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.tenChuan || danhSachVaiKho.find((vai) => vai.maVT === m.maVai)?.tenVT || m.mau}`
                    : "Chọn mã màu"}
                </button>
              </div>
              <div className="col-span-2 flex items-center rounded border bg-slate-50 px-2 py-1 font-medium truncate">
                {m.mau || "Chưa có màu"}
              </div>
              <input
                type="number"
                value={m.soKg}
                onChange={(e) => {
                  const newKg = Number(e.target.value);
                  capNhatMau(i, {
                    soKg: newKg,
                    soCay: m.soCay && m.soCay > 0 ? m.soCay : (newKg > 0 ? Math.max(1, Math.ceil(newKg / 20)) : 0),
                  });
                }}
                className="col-span-1 px-1.5 py-1 rounded border text-right font-bold text-slate-800"
                placeholder="Số kg"
              />
              <input
                type="number"
                value={m.soCay ?? (m.soKg > 0 ? Math.max(1, Math.ceil(m.soKg / 20)) : "")}
                onChange={(e) => capNhatMau(i, { soCay: Number(e.target.value) })}
                className="col-span-1 px-1 py-1 rounded border text-right font-black text-emerald-700 bg-emerald-50/50"
                placeholder="Cây"
                title="Số cây thành phẩm thực nhận"
              />
              <input
                type="number"
                value={m.donGiaNhuom}
                onChange={(e) => capNhatMau(i, { donGiaNhuom: Number(e.target.value) })}
                className="col-span-2 px-2 py-1 rounded border text-right"
              />
              <input
                type="number"
                value={m.chiPhiHoaChat}
                onChange={(e) => capNhatMau(i, { chiPhiHoaChat: Number(e.target.value) })}
                className="col-span-1 px-1 py-1 rounded border text-right text-[11px]"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={m.vat ?? vatNhuomChung}
                onChange={(e) => capNhatMau(i, { vat: Math.max(0, Number(e.target.value) || 0) })}
                className="col-span-1 px-1 py-1 rounded border text-center font-bold text-rose-900 bg-rose-50/50 text-xs"
                placeholder="% VAT"
                title="% VAT riêng của màu này"
              />
              <button
                type="button"
                onClick={() => setDanhSachMau(danhSachMau.filter((_, idx) => idx !== i))}
                className="col-span-1 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded p-1"
                aria-label="Xóa màu"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {(() => {
              const vatMau = m.vat ?? vatNhuomChung;
              const tienNhuomChuaVat = m.soKg * m.donGiaNhuom + m.chiPhiHoaChat;
              const vatTienMau = (tienNhuomChuaVat * vatMau) / 100;
              const tienNhuomCoVat = tienNhuomChuaVat + vatTienMau;
              const donGiaNhuomCoVat = m.donGiaNhuom * (1 + vatMau / 100);
              return (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-1 text-[11px] text-rose-900 bg-rose-50/60 rounded px-2 py-0.5">
                  <div>
                    Đơn giá nhuộm có VAT: <b>{Math.round(donGiaNhuomCoVat).toLocaleString("vi-VN")} đ/kg</b>
                    {vatMau > 0 && <span className="text-[10px] text-rose-600 ml-1">(gồm {vatMau}% VAT)</span>}
                  </div>
                  <div>
                    Tiền nhuộm+HC: <b>{tienNhuomChuaVat.toLocaleString("vi-VN")}đ</b>
                    {vatMau > 0 && (
                      <>
                        <span className="mx-1 text-rose-300">|</span>
                        <span>VAT {vatMau}%: <b>+{Math.round(vatTienMau).toLocaleString("vi-VN")}đ</b></span>
                        <span className="mx-1 text-rose-300">|</span>
                        <span>Tổng có VAT: <b className="text-rose-950 font-bold">{Math.round(tienNhuomCoVat).toLocaleString("vi-VN")}đ</b></span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

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
                    <div className="text-[11px] text-slate-500">Màu: {tenMauTuVai(vai)} · Tồn kho hiện tại: {(vai?.tonKho || 0).toLocaleString("vi-VN")} {vai?.dvt || "kg"} ({vai?.tonCay || 0} cây)</div>
                    <div className="text-[10px] text-slate-400">Mã màu lấy trực tiếp từ Kho vải thành phẩm</div>
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            const vai = danhSachVaiKho[0];
            setDanhSachMau([
              ...danhSachMau,
              {
                maVai: vai?.maVT || "",
                mau: tenMauTuVai(vai),
                soKg: 0,
                soCay: 0,
                donGiaNhuom: 12000,
                chiPhiHoaChat: 1000000,
              },
            ]);
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 mt-1"
        >
          <Plus className="w-3.5 h-3.5 inline" /> Thêm mã màu nhuộm
        </button>

        {/* Ô upload ảnh chứng từ nhuộm giao kho vải TP */}
        <div className="mt-4 border-t border-rose-100 pt-3">
          <ChungTuUploaderCompact
            files={anhChungTuGiaoKhoTP}
            onChange={setAnhChungTuGiaoKhoTP}
            title="Ảnh chứng từ nhuộm giao kho vải thành phẩm"
            subTitle="Phiếu xuất xưởng nhuộm, biên bản bàn giao kiểm phẩm nhập kho vải TP"
            themeColor="rose"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 md:p-5 shadow-sm backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold text-white shadow-sm">4</span>
          <h3 className="font-bold text-slate-800 text-sm">NHẬP KHO VẢI THÀNH PHẨM</h3>
        </div>
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

        {/* Tùy chọn Vận hành Giai đoạn 1 */}
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50/90 p-3.5 shadow-sm">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={nhapKhoNgay}
              onChange={(e) => setNhapKhoNgay(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <div className="text-xs font-black text-emerald-950 flex flex-wrap items-center gap-2">
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Giai đoạn 1
                </span>
                TỰ ĐỘNG NGHIỆM THU & CẬP NHẬT KHO THÀNH PHẨM NGAY
              </div>
              <p className="mt-1 text-[11px] text-emerald-800 leading-relaxed font-medium">
                Khi kích hoạt, hệ thống sẽ tự động hoàn tất khâu Dệt, Mẻ Nhuộm, sinh mã lô mẻ (<code className="font-mono font-bold text-emerald-950">LTP_...</code>), đưa vào Khu {khu} và cộng tồn kho vải (số kg, số cây, khóa giá vốn) để <b>Tổ Cắt có thể lấy vải cắt ngay</b> mà không cần thao tác thủ công từng bước ở tab Quy trình.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Bảng Tính Giá Vốn & Dự Toán Chi Phí
          </div>
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Tổng chi phí dự toán (chưa VAT)</span>
            <span className="text-2xl font-black text-amber-600 drop-shadow-sm">{tongCong.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        {/* Thanh tóm tắt hao hụt Sợi ➔ Vải TP */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100/90 p-3 border border-slate-200/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Hao hụt tổng (Sợi ➔ Vải TP):</span>
            <span className="text-sm font-black text-slate-900">{haoHutTongKg.toLocaleString("vi-VN")} kg</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
              haoHutTongPt >= 7 && haoHutTongPt <= 13
                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                : haoHutTongPt > 13
                ? "bg-rose-100 text-rose-800 border border-rose-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}>
              {haoHutTongPt.toFixed(1)}% {haoHutTongPt >= 7 && haoHutTongPt <= 13 ? "(Đạt chuẩn 7-13%)" : haoHutTongPt > 13 ? "(Cảnh báo hao hụt cao)" : ""}
            </span>
            {tongKgSoi > 0 && tongKgVaiTP > 0 && (
              <span className="text-[10px] text-slate-500 font-medium">Hệ số hao hụt: ×{heSoHaoHut.toFixed(3)}</span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Tổng vải TP nhận: <b className="text-emerald-700 font-black">{tongKgVaiTP.toLocaleString("vi-VN")} kg</b> · <b className="text-emerald-700 font-black">{tongCayVaiTP} cây</b>
          </div>
        </div>

        {/* ===== GIÁ VỐN 1 KG VẢI TP ===== */}
        <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="font-black text-amber-900 text-sm uppercase tracking-wide flex items-center gap-1.5">
              <span>🧮</span>
              <span>Giá Vốn 1 kg Vải Thành Phẩm (Đã trừ hao hụt & VAT từng khâu)</span>
            </div>
            <div className="text-xs font-bold text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-300">
              Tổng VAT 3 khâu: <b className="text-amber-950">+{Math.round(tongVAT).toLocaleString("vi-VN")}đ</b> (Bình quân {vatBinhQuanPt.toFixed(1)}%)
            </div>
          </div>

          {/* Công thức hiển thị */}
          <div className="mb-3 rounded-xl bg-white/90 border border-amber-200 p-3 text-[11px] leading-relaxed text-slate-700 shadow-inner">
            <div className="font-bold text-amber-900 mb-1.5 font-sans text-xs flex items-center gap-1">
              <span>📐</span>
              <span>Chi tiết 2 công thức tính đối chiếu (Kết quả tương đương 100%):</span>
            </div>

            {/* Công thức 1 */}
            <div className="rounded-lg bg-amber-50/60 p-2 border border-amber-100 mb-2 font-mono">
              <div className="font-sans font-bold text-slate-800 text-[11px] mb-0.5">
                Cách 1: Tính trực tiếp trên sản lượng vải TP thực nhận
              </div>
              <div className="text-slate-600">
                Giá vốn/kg (chưa VAT) = <span className="font-bold text-blue-700">Tổng chi phí</span> ÷ <span className="font-bold text-emerald-700">Số kg vải TP thực thu</span>
              </div>
              <div className="mt-0.5 text-slate-800 font-semibold">
                = {tongCong.toLocaleString("vi-VN")}đ ÷ {tongKgVaiTP.toLocaleString("vi-VN")} kg = <span className="text-amber-800 font-black">{Math.round(giaVon1KgTP_chuaVAT).toLocaleString("vi-VN")} đ/kg</span>
              </div>
            </div>

            {/* Công thức 2 */}
            <div className="rounded-lg bg-orange-50/60 p-2 border border-orange-100 mb-2 font-mono">
              <div className="font-sans font-bold text-slate-800 text-[11px] mb-0.5">
                Cách 2: Tính theo chi phí 1 kg sợi đầu vào trừ % hao hụt
              </div>
              <div className="text-slate-600">
                Giá vốn/kg (chưa VAT) = <span className="font-bold text-blue-700">Chi phí trên 1kg sợi gốc</span> ÷ <span className="font-bold text-rose-700">(1 - % Hao hụt)</span>
              </div>
              <div className="mt-0.5 text-slate-800 font-semibold">
                = {Math.round(chiPhi1KgSoi).toLocaleString("vi-VN")} đ/kg sợi ÷ (1 - {haoHutTongPt.toFixed(1)}%)
                {tongKgSoi > 0 && tongKgVaiTP > 0 && ` = ${Math.round(chiPhi1KgSoi).toLocaleString("vi-VN")} ÷ ${(tongKgVaiTP / tongKgSoi).toFixed(4)}`}
                = <span className="text-amber-800 font-black">{Math.round(giaVon1KgTP_chuaVAT).toLocaleString("vi-VN")} đ/kg</span>
              </div>
            </div>

            {/* Chi tiết VAT từng khâu */}
            <div className="rounded-lg bg-emerald-50/60 p-2 border border-emerald-100 font-mono">
              <div className="font-sans font-bold text-emerald-900 text-[11px] mb-0.5">
                Cộng dồn Thuế VAT từ từng khâu (Sợi + Dệt + Nhuộm):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 my-1 text-[11px]">
                <div className="rounded bg-white/80 px-2 py-0.5 border border-blue-200 text-blue-900">VAT Sợi: <b>+{Math.round(vatSoi).toLocaleString("vi-VN")}đ</b></div>
                <div className="rounded bg-white/80 px-2 py-0.5 border border-violet-200 text-violet-900">VAT Dệt: <b>+{Math.round(vatDetTien).toLocaleString("vi-VN")}đ</b></div>
                <div className="rounded bg-white/80 px-2 py-0.5 border border-rose-200 text-rose-900">VAT Nhuộm+HC: <b>+{Math.round(vatNhuomTien).toLocaleString("vi-VN")}đ</b></div>
              </div>
              <div className="mt-0.5 font-bold text-emerald-950">
                Giá vốn 1 kg vải TP (Có VAT từng khâu) = {Math.round(tongChiPhiCoVAT).toLocaleString("vi-VN")}đ ÷ {tongKgVaiTP.toLocaleString("vi-VN")} kg = <span className="text-orange-700 font-black text-xs">{Math.round(giaVon1KgTP_coVAT).toLocaleString("vi-VN")} đ/kg</span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 font-sans italic">
              ℹ️ Ghi chú: Xuất {tongKgSoi.toLocaleString("vi-VN")} kg sợi, thu về {tongKgVaiTP.toLocaleString("vi-VN")} kg vải TP (hao hụt {haoHutTongPt.toFixed(1)}% = {haoHutTongKg.toFixed(1)} kg). Toàn bộ hao hụt và VAT từng khâu đã được tự động phân bổ vào từng kg vải thành phẩm.
            </div>
          </div>

          {/* Kết quả lớn */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-xl bg-amber-100/90 border border-amber-300 p-3 shadow-xs">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Giá vốn 1 kg vải TP (Chưa VAT)</div>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {tongKgVaiTP > 0 ? Math.round(giaVon1KgTP_chuaVAT).toLocaleString("vi-VN") : "—"}
                <span className="text-sm font-bold text-amber-700"> đ/kg</span>
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Tổng chi phí: <b>{tongCong.toLocaleString("vi-VN")}đ</b> ÷ <b>{tongKgVaiTP.toLocaleString("vi-VN")} kg</b> vải TP
              </div>
            </div>
            <div className="rounded-xl border p-3 shadow-xs bg-orange-100/90 border-orange-300">
              <div className="text-[10px] font-bold text-orange-800 uppercase tracking-wider">Giá vốn 1 kg vải TP (Có VAT từng khâu)</div>
              <div className="text-2xl font-black text-orange-900 mt-1">
                {tongKgVaiTP > 0 ? Math.round(giaVon1KgTP_coVAT).toLocaleString("vi-VN") : "—"}
                <span className="text-sm font-bold text-orange-700"> đ/kg</span>
              </div>
              <div className="text-[11px] text-orange-700 mt-0.5">
                Gồm VAT: <b>+{Math.round(tongVAT).toLocaleString("vi-VN")}đ</b> ({vatBinhQuanPt.toFixed(1)}%) | Tổng có VAT: <b>{Math.round(tongChiPhiCoVAT).toLocaleString("vi-VN")}đ</b>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <Card label="Chi sợi" v={chiSoi} c="blue" sub={`VAT: +${Math.round(vatSoi).toLocaleString("vi-VN")}đ`} />
          <Card label="Chi dệt" v={chiDet} c="violet" sub={`VAT: +${Math.round(vatDetTien).toLocaleString("vi-VN")}đ`} />
          <Card label="Chi nhuộm+HC" v={chiNhuom + chiHoaChat} c="rose" sub={`VAT: +${Math.round(vatNhuomTien).toLocaleString("vi-VN")}đ`} />
          <Card label="Tổng VAT 3 khâu" v={tongVAT} c="amber" sub={`Bình quân ${vatBinhQuanPt.toFixed(1)}%`} />
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="mb-2 text-xs font-bold text-slate-700 uppercase tracking-wide">Giá vốn phân bổ theo từng màu vải</h4>
          <div className="space-y-2">
            {giaVonTheoMau.map((item, index) => {
              const vai = danhSachVaiKho.find((record) => record.maVT === item.maVai);
              return (
                <div key={`${item.maVai}-${index}-gia-von`} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900">{vai?.maMoi || item.maVai} - {item.mau}</div>
                      <div className="text-[11px] text-slate-500">{vai?.tenChuan || vai?.tenVT || "Mã vải thành phẩm"} · {item.soKg.toLocaleString("vi-VN")} kg ({item.soCay || (item.soKg > 0 ? Math.max(1, Math.ceil(item.soKg / 20)) : 0)} cây)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-amber-700">{lamTronTheo100Dong(item.tongGiaVon).toLocaleString("vi-VN")}đ</div>
                      <div className="text-xs font-bold text-emerald-700">
                        {lamTronTheo100Dong(item.giaVonMoiKg).toLocaleString("vi-VN")}đ/kg
                      </div>
                      {item.tongVATMau > 0 && (
                        <div className="text-[10px] font-semibold text-orange-600">
                          (Có VAT: {lamTronTheo100Dong(item.giaVonMoiKgCoVAT).toLocaleString("vi-VN")}đ/kg)
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-600 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50/80 border border-blue-100 px-2.5 py-1">
                      Sợi: <b>{lamTronTheo100Dong(item.chiSoiPhanBo).toLocaleString("vi-VN")}đ</b>
                      {item.vatSoiPhanBo > 0 && <span className="text-[10px] text-blue-600 block">(VAT: +{lamTronTheo100Dong(item.vatSoiPhanBo).toLocaleString("vi-VN")}đ)</span>}
                    </div>
                    <div className="rounded-lg bg-violet-50/80 border border-violet-100 px-2.5 py-1">
                      Dệt: <b>{lamTronTheo100Dong(item.chiDetPhanBo).toLocaleString("vi-VN")}đ</b>
                      {item.vatDetPhanBo > 0 && <span className="text-[10px] text-violet-600 block">(VAT: +{lamTronTheo100Dong(item.vatDetPhanBo).toLocaleString("vi-VN")}đ)</span>}
                    </div>
                    <div className="rounded-lg bg-rose-50/80 border border-rose-100 px-2.5 py-1">
                      Nhuộm+HC: <b>{lamTronTheo100Dong(item.tienNhuom + item.chiPhiHoaChat).toLocaleString("vi-VN")}đ</b>
                      {item.vatNhuomPhanBo > 0 && <span className="text-[10px] text-rose-600 block">(VAT: +{lamTronTheo100Dong(item.vatNhuomPhanBo).toLocaleString("vi-VN")}đ)</span>}
                    </div>
                    <div className="rounded-lg bg-orange-50/80 border border-orange-100 px-2.5 py-1">
                      Tổng VAT màu: <b>+{lamTronTheo100Dong(item.tongVATMau).toLocaleString("vi-VN")}đ</b>
                      <span className="text-[10px] text-orange-600 block">Tổng có VAT: {lamTronTheo100Dong(item.tongGiaVonCoVAT).toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 print:hidden md:grid-cols-3 pt-2">
        <button onClick={handleTao} className="w-full rounded-2xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 py-3.5 text-base font-black text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2">
          <Sparkles className="h-5 w-5" /> LƯU & TẠO LỆNH
        </button>
        <button
          type="button"
          onClick={() => setHienPhieu(true)}
          disabled={!daTaoLenh}
          className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 py-3.5 text-base font-black text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Printer className="h-5 w-5" /> IN PHIẾU
        </button>
        <button
          type="button"
          onClick={onChuyenTiep}
          disabled={!daTaoLenh}
          className="w-full rounded-2xl bg-slate-800 hover:bg-slate-900 py-3.5 text-base font-black text-white shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 flex items-center justify-center gap-2"
        >
          CHUYỂN TIẾP <ArrowRight className="h-5 w-5" />
        </button>
      </div>
      {daTaoLenh && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-sm font-bold text-emerald-700 print:hidden">
          Lệnh đã được lưu thành công. Anh có thể in phiếu hoặc chuyển sang tab Quy trình.
        </div>
      )}

      {/* ================= KHỐI LỊCH SỬ LỆNH SẢN XUẤT VẢI ĐÃ TẠO ================= */}
      <div className="mt-8 border-t border-slate-200 pt-6 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-teal-100 p-2 text-teal-700">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">
                Lịch sử Lệnh Sản Xuất Vải đã lưu ({danhSachLichSu.length})
              </h3>
              <p className="text-xs text-slate-500">
                Lưu trữ bền vững trên LocalStorage & Supabase kèm chứng từ 3 khâu (Sợi - Dệt - Nhuộm)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Đồng bộ đám mây Supabase
          </div>
        </div>

        {danhSachLichSu.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-slate-400">
            <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-medium">Chưa có lệnh sản xuất vải nào được lưu</p>
            <p className="text-xs text-slate-400 mt-1">Khi anh tạo lệnh ở trên, hệ thống sẽ tự động lưu lại vào đây và đồng bộ lên Supabase.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {danhSachLichSu.map((item, idx) => {
              const tongKgTP = item.danhSachMau?.reduce((s, m) => s + (m.soKg || 0), 0) || 0;
              const haoHutKg = (item.tongKgSoi || 0) - tongKgTP;
              const haoHutPt = item.tongKgSoi > 0 ? (haoHutKg / item.tongKgSoi) * 100 : 0;
              const giaVonKg = tongKgTP > 0 ? (item.tongCong || 0) / tongKgTP : 0;
              
              const cntAnhGiaoDet = item.anhChungTuGiaoDet?.length || 0;
              const cntAnhGiaoNhuom = item.anhChungTuGiaoNhuom?.length || 0;
              const cntAnhGiaoKhoTP = item.anhChungTuGiaoKhoTP?.length || 0;
              const tongSoAnh = cntAnhGiaoDet + cntAnhGiaoNhuom + cntAnhGiaoKhoTP;

              return (
                <div
                  key={item.id || item.maLenhDet || idx}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Top Bar của Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-black text-teal-800">
                        Lệnh dệt: {item.maLenhDet || "Chưa có"}
                      </span>
                      <span className="rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-1 text-xs font-black text-rose-800">
                        Mẻ nhuộm: {item.maMeNhuom || "Chưa có"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500 font-medium ml-1">
                        <Calendar className="h-3.5 w-3.5" /> {item.ngayTao || "Hôm nay"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPhieuDaTao(item);
                          setHienPhieu(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition"
                      >
                        <Printer className="h-3.5 w-3.5" /> Xem & In phiếu
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const maHienThi = item.maLenhDet || item.id || "này";
                          if (confirm(`Anh có chắc muốn xóa lệnh ${maHienThi} khỏi lịch sử không?`)) {
                            deletePhieuSanXuatVai(item.id || item.maLenhDet);
                            setDanhSachLichSu(getAllPhieuSanXuatVai());
                            toast.success("Đã xóa lệnh khỏi lịch sử");
                          }
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition"
                        title="Xóa lệnh này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Body Thông tin sản xuất */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1">
                        <Factory className="h-3.5 w-3.5 text-teal-600" /> Đối tác chuỗi sản xuất
                      </div>
                      <div className="text-slate-600">NCC Sợi: <span className="font-bold text-slate-800">{item.tenNccSoi || "Chưa chọn"}</span></div>
                      <div className="text-slate-600">Xưởng dệt: <span className="font-bold text-slate-800">{item.tenXuongDet || "Chưa chọn"}</span></div>
                      <div className="text-slate-600">Xưởng nhuộm: <span className="font-bold text-slate-800">{item.tenXuongNhuom || "Chưa chọn"}</span></div>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-2.5 space-y-1">
                      <div className="font-bold text-slate-700 flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-600" /> Khối lượng & Hao hụt
                      </div>
                      <div className="text-slate-600">Đầu vào sợi: <span className="font-bold text-teal-700">{(item.tongKgSoi || 0).toLocaleString("vi-VN")} kg</span></div>
                      <div className="text-slate-600">Vải thành phẩm: <span className="font-bold text-indigo-700">{tongKgTP.toLocaleString("vi-VN")} kg</span></div>
                      <div className="text-slate-600">
                        Hao hụt: <span className={`font-bold ${haoHutPt > 10 ? "text-rose-600" : "text-amber-600"}`}>
                          {haoHutKg.toLocaleString("vi-VN")} kg ({haoHutPt.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-2.5 space-y-1">
                      <div className="font-bold text-amber-900">Chi phí & Giá vốn vải TP</div>
                      <div className="text-slate-600">Tổng chi phí: <span className="font-black text-rose-600">{(item.tongCong || 0).toLocaleString("vi-VN")}đ</span></div>
                      <div className="text-slate-600">Giá vốn 1kg TP: <span className="font-black text-emerald-700">{Math.round(giaVonKg).toLocaleString("vi-VN")}đ/kg</span></div>
                      <div className="text-[11px] text-slate-500">Màu: {item.danhSachMau?.map(m => `${m.mau} (${m.soKg}kg)`).join(", ") || "—"}</div>
                    </div>
                  </div>

                  {/* Khu vực Ảnh Chứng Từ 3 Khâu */}
                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-slate-500" /> Ảnh chứng từ đính kèm ({tongSoAnh} ảnh)
                      </span>
                      <span className="text-[11px] text-slate-400">Nhấp vào ảnh để phóng to xem chi tiết</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                      {/* Khâu 1: Sợi giao dệt */}
                      <div className="rounded-lg bg-white border border-slate-200/80 p-2">
                        <div className="text-[11px] font-bold text-teal-800 mb-1 flex items-center justify-between">
                          <span>1. Sợi giao dệt</span>
                          <span className="text-[10px] text-slate-400">({cntAnhGiaoDet} ảnh)</span>
                        </div>
                        {cntAnhGiaoDet === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1">Chưa có ảnh chứng từ</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.anhChungTuGiaoDet?.map((img, i) => (
                              <button
                                key={img.id || i}
                                type="button"
                                onClick={() => {
                                  const urls = item.anhChungTuGiaoDet?.map((x) => x.dataUrl).filter(Boolean) || [];
                                  setLightboxImages(urls);
                                  setLightboxIndex(i);
                                }}
                                className="group relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 hover:ring-2 hover:ring-teal-400 transition"
                              >
                                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Khâu 2: Dệt giao nhuộm */}
                      <div className="rounded-lg bg-white border border-slate-200/80 p-2">
                        <div className="text-[11px] font-bold text-indigo-800 mb-1 flex items-center justify-between">
                          <span>2. Dệt giao nhuộm</span>
                          <span className="text-[10px] text-slate-400">({cntAnhGiaoNhuom} ảnh)</span>
                        </div>
                        {cntAnhGiaoNhuom === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1">Chưa có ảnh chứng từ</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.anhChungTuGiaoNhuom?.map((img, i) => (
                              <button
                                key={img.id || i}
                                type="button"
                                onClick={() => {
                                  const urls = item.anhChungTuGiaoNhuom?.map((x) => x.dataUrl).filter(Boolean) || [];
                                  setLightboxImages(urls);
                                  setLightboxIndex(i);
                                }}
                                className="group relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 hover:ring-2 hover:ring-indigo-400 transition"
                              >
                                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Khâu 3: Nhuộm giao kho TP */}
                      <div className="rounded-lg bg-white border border-slate-200/80 p-2">
                        <div className="text-[11px] font-bold text-rose-800 mb-1 flex items-center justify-between">
                          <span>3. Nhuộm giao kho TP</span>
                          <span className="text-[10px] text-slate-400">({cntAnhGiaoKhoTP} ảnh)</span>
                        </div>
                        {cntAnhGiaoKhoTP === 0 ? (
                          <div className="text-[11px] text-slate-400 italic py-1">Chưa có ảnh chứng từ</div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.anhChungTuGiaoKhoTP?.map((img, i) => (
                              <button
                                key={img.id || i}
                                type="button"
                                onClick={() => {
                                  const urls = item.anhChungTuGiaoKhoTP?.map((x) => x.dataUrl).filter(Boolean) || [];
                                  setLightboxImages(urls);
                                  setLightboxIndex(i);
                                }}
                                className="group relative h-12 w-12 overflow-hidden rounded-md border border-slate-200 hover:ring-2 hover:ring-rose-400 transition"
                              >
                                <img src={img.dataUrl} alt={img.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
                <thead><tr className="bg-slate-100"><th className="border p-2 text-left">Loại sợi</th><th className="border p-2">Mã lô</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Đơn giá</th><th className="border p-2 text-right">Thành tiền</th></tr></thead>
                <tbody>{phieuDaTao.danhSachSoi.map((item) => (
                  <tr key={item.id}><td className="border p-2">{item.loaiSoi}</td><td className="border p-2 text-center">{item.maLoSoi}</td><td className="border p-2 text-right">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right">{item.donGia.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right font-bold">{(item.soKg * item.donGia).toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            <h3 className="mt-4 rounded bg-[#EA990C] px-3 py-2 font-bold text-white">2. DANH SÁCH MÀU NHUỘM</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead><tr className="bg-slate-100"><th className="border p-2 text-left">Mã vải</th><th className="border p-2">Màu</th><th className="border p-2 text-right">Số kg</th><th className="border p-2 text-right">Số cây</th><th className="border p-2 text-right">Đơn giá nhuộm</th><th className="border p-2 text-right">Hóa chất</th></tr></thead>
                <tbody>{phieuDaTao.danhSachMau.map((item, index) => (
                  <tr key={`${item.maVai}-${index}`}><td className="border p-2">{item.maVai}</td><td className="border p-2 text-center">{item.mau}</td><td className="border p-2 text-right font-bold">{item.soKg.toLocaleString("vi-VN")}</td><td className="border p-2 text-right text-emerald-700 font-bold">{item.soCay || (item.soKg > 0 ? Math.max(1, Math.ceil(item.soKg / 20)) : 0)}</td><td className="border p-2 text-right">{item.donGiaNhuom.toLocaleString("vi-VN")}đ</td><td className="border p-2 text-right">{item.chiPhiHoaChat.toLocaleString("vi-VN")}đ</td></tr>
                ))}</tbody>
              </table>
            </div>

            {/* 3. CHỨNG TỪ & BIÊN BẢN BÀN GIAO ĐÍNH KÈM */}
            {((phieuDaTao.anhChungTuGiaoDet && phieuDaTao.anhChungTuGiaoDet.length > 0) ||
              (phieuDaTao.anhChungTuGiaoNhuom && phieuDaTao.anhChungTuGiaoNhuom.length > 0) ||
              (phieuDaTao.anhChungTuGiaoKhoTP && phieuDaTao.anhChungTuGiaoKhoTP.length > 0)) && (
              <div className="mt-4">
                <h3 className="rounded bg-slate-700 px-3 py-2 font-bold text-white text-xs uppercase tracking-wider">
                  3. CHỨNG TỪ & BIÊN BẢN BÀN GIAO ĐÍNH KÈM
                </h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3">
                  {phieuDaTao.anhChungTuGiaoDet && phieuDaTao.anhChungTuGiaoDet.length > 0 && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5">
                      <div className="font-bold text-xs text-blue-900 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Giao sợi xưởng dệt ({phieuDaTao.anhChungTuGiaoDet.length} ảnh)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phieuDaTao.anhChungTuGiaoDet.map((f, i) => (
                          <div
                            key={f.id || i}
                            onClick={() => {
                              setLightboxImages(phieuDaTao.anhChungTuGiaoDet!.map((x) => x.dataUrl));
                              setLightboxIndex(i);
                            }}
                            className="w-16 h-16 rounded-lg border border-blue-300 overflow-hidden cursor-pointer hover:opacity-80 transition bg-white"
                            title="Bấm để xem phóng to"
                          >
                            <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {phieuDaTao.anhChungTuGiaoNhuom && phieuDaTao.anhChungTuGiaoNhuom.length > 0 && (
                    <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-2.5">
                      <div className="font-bold text-xs text-violet-900 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-600" />
                        Dệt giao xưởng nhuộm ({phieuDaTao.anhChungTuGiaoNhuom.length} ảnh)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phieuDaTao.anhChungTuGiaoNhuom.map((f, i) => (
                          <div
                            key={f.id || i}
                            onClick={() => {
                              setLightboxImages(phieuDaTao.anhChungTuGiaoNhuom!.map((x) => x.dataUrl));
                              setLightboxIndex(i);
                            }}
                            className="w-16 h-16 rounded-lg border border-violet-300 overflow-hidden cursor-pointer hover:opacity-80 transition bg-white"
                            title="Bấm để xem phóng to"
                          >
                            <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {phieuDaTao.anhChungTuGiaoKhoTP && phieuDaTao.anhChungTuGiaoKhoTP.length > 0 && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-2.5">
                      <div className="font-bold text-xs text-rose-900 mb-1.5 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        Nhuộm giao kho vải TP ({phieuDaTao.anhChungTuGiaoKhoTP.length} ảnh)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phieuDaTao.anhChungTuGiaoKhoTP.map((f, i) => (
                          <div
                            key={f.id || i}
                            onClick={() => {
                              setLightboxImages(phieuDaTao.anhChungTuGiaoKhoTP!.map((x) => x.dataUrl));
                              setLightboxIndex(i);
                            }}
                            className="w-16 h-16 rounded-lg border border-rose-300 overflow-hidden cursor-pointer hover:opacity-80 transition bg-white"
                            title="Bấm để xem phóng to"
                          >
                            <img src={f.dataUrl} alt={f.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-between rounded-xl border border-amber-300 bg-amber-50 p-3 text-lg font-black">
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

      {hienPhieuNhapSoi && (
        <PhieuNhapSoiPrint
          ncc={ncc}
          danhSachSoi={danhSachSoi}
          chungTu={anhChungTuGiaoDet}
          onClose={() => setHienPhieuNhapSoi(false)}
        />
      )}
      
      {hienPhieuGiaoDet && (
        <PhieuGiaoDetPrint
          xDet={xDet}
          danhSachSoi={danhSachSoi}
          chungTu={anhChungTuGiaoDet}
          onClose={() => setHienPhieuGiaoDet(false)}
        />
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          src={lightboxImages[lightboxIndex] || null}
          gallery={lightboxImages}
          onChange={(_newSrc, newIdx) => setLightboxIndex(newIdx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
