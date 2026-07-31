// Yarn Me Soi Engine - Theo dõi 1 mẻ sợi từ A→Z
// Workflow thực tế: 1 LSOI → nhiều lệnh dệt → gộp lô mộc → 1 mẻ nhuộm nhiều màu → QC

import {
  getAllPhieuNhapSoi, getAllLenhDet, getAllMeNhuom,
  getAllPhieuNghiemThuMau, getAllLoVaiTP,
  type PhieuNhapSoi, type LenhDet, type MeNhuom, type PhieuNghiemThuMau, type LoVaiTP,
} from "./yarn-production-chain";

// ============ MẺ SỢI TỔNG QUAN ============
export interface MeSoiTongQuan {
  maLoSoi: string;            // LSOI-001
  phieuNhap?: PhieuNhapSoi;
  // Dệt
  lenhDet: LenhDet[];
  tongKgSoiDaGiao: number;
  tongKgMocNhan: number;
  haoHutDetKg: number;
  haoHutDetPt: number;
  // Nhuộm
  meNhuomList: MeNhuom[];
  phieuNghiemThuMau: PhieuNghiemThuMau[];
  tongKgMocDaNhuom: number;
  tongKgMauThanhPham: number;
  haoHutNhuomKg: number;
  haoHutNhuomPt: number;
  // TP
  loVaiTP: LoVaiTP[];
  tongKgTP: number;
  tongGiaTriTP: number;
  // QC
  chatLuong: ChatLuongMeSoi;
  trangThai: TrangThaiMeSoi;
}

export type TrangThaiMeSoi =
  | "Mới nhập"           // vừa nhập kho
  | "Đang dệt"           // đã có lệnh dệt, chưa nghiệm thu
  | "Đã dệt xong"        // tất cả lệnh dệt hoàn thành
  | "Đang nhuộm"         // đã có mẻ nhuộm
  | "Đã nhuộm xong"      // tất cả nhuộm hoàn thành
  | "Đã nhập kho TP"     // đã có lô vải TP
  | "Hoàn tất";          // đã QC xong

export interface ChatLuongMeSoi {
  // Tổng hợp chất lượng cả mẻ sợi
  xepLoai: "A" | "B" | "C" | "Đạt" | "Cảnh báo" | "Kém";
  diem: number;             // 0-100
  // Chi tiết
  chatLuongDet: "Tốt" | "Bình thường" | "Kém";
  haoHutDetAccept: boolean;  // ≤ 4%
  chatLuongNhuom: "Tốt" | "Bình thường" | "Kém";
  haoHutNhuomAccept: boolean; // ≤ 5%
  chatLuongTP: "Tốt" | "Bình thường" | "Kém";
  // Số liệu
  tongKgSoi: number;
  tongKgTP: number;
  tongHaoHutPt: number;    // tổng hao hụt từ sợi → TP
  // Ghi chú QC
  nguoiQC?: string;
  ngayQC?: string;
  ghiChuQC?: string;
  daPheDuyet: boolean;
}

// ============ BUILD MẺ SỚI TỔNG QUAN ============
export function buildMeSoiTongQuan(maLoSoi: string): MeSoiTongQuan | null {
  const pnss = getAllPhieuNhapSoi();
  const phieuNhap = pnss.find((p) => p.maLoSoi === maLoSoi);

  const lds = getAllLenhDet().filter((l) => l.maLoSoi === maLoSoi);
  const tongKgSoiDaGiao = lds.reduce((s, l) => s + l.soKgGiao, 0);
  const tongKgMocNhan = lds.reduce((s, l) => s + (l.soKgMocNhan || 0), 0);
  const haoHutDetKg = tongKgSoiDaGiao - tongKgMocNhan;
  const haoHutDetPt = tongKgSoiDaGiao > 0 ? (haoHutDetKg / tongKgSoiDaGiao) * 100 : 0;

  // Tìm mẻ nhuộm: qua các lô mộc của các lệnh dệt
  const maLoMocCacLenh = lds.map((l) => `LM-${l.id}`);
  const mns = getAllMeNhuom().filter((m) => maLoMocCacLenh.includes(m.maLoMoc));
  const phieuNghiemThuMau = getAllPhieuNghiemThuMau().filter((n) =>
    mns.some((m) => m.id === n.meNhuomId)
  );

  const tongKgMocDaNhuom = mns.reduce((s, m) => s + m.tongKgXuat, 0);
  const tongKgMauThanhPham = phieuNghiemThuMau.reduce(
    (s, n) => s + n.danhSachMau.reduce((x, mau) => x + mau.soKgMauNhan, 0),
    0
  );
  const haoHutNhuomKg = tongKgMocDaNhuom - tongKgMauThanhPham;
  const haoHutNhuomPt = tongKgMocDaNhuom > 0 ? (haoHutNhuomKg / tongKgMocDaNhuom) * 100 : 0;

  // Lô vải TP: tìm qua phiếu nghiệm thu
  const ntmIds = phieuNghiemThuMau.map((n) => n.id);
  const loVaiTP = getAllLoVaiTP().filter((l) => ntmIds.includes(l.nghiemThuMauId));
  const tongKgTP = loVaiTP.reduce((s, l) => s + l.tongKg, 0);
  const tongGiaTriTP = loVaiTP.reduce((s, l) => s + l.tongGiaTri, 0);

  // Tính QC tự động
  const chatLuong = tinhChatLuongMeSoi({
    haoHutDetPt, haoHutNhuomPt, tongKgSoi: phieuNhap?.soKg || 0, tongKgTP,
  });

  // Xác định trạng thái
  let trangThai: TrangThaiMeSoi = "Mới nhập";
  if (lds.length > 0 && lds.some((l) => l.trangThai !== "Hoàn thành" && l.trangThai !== "Hủy")) {
    trangThai = "Đang dệt";
  }
  if (lds.length > 0 && lds.every((l) => l.trangThai === "Hoàn thành")) {
    trangThai = "Đã dệt xong";
  }
  if (mns.length > 0 && mns.some((m) => m.trangThai !== "Hoàn thành")) {
    trangThai = "Đang nhuộm";
  }
  if (mns.length > 0 && mns.every((m) => m.trangThai === "Hoàn thành")) {
    trangThai = "Đã nhuộm xong";
  }
  if (loVaiTP.length > 0) {
    trangThai = "Đã nhập kho TP";
  }
  if (chatLuong.daPheDuyet) {
    trangThai = "Hoàn tất";
  }

  return {
    maLoSoi, phieuNhap, lenhDet: lds,
    tongKgSoiDaGiao, tongKgMocNhan, haoHutDetKg, haoHutDetPt,
    meNhuomList: mns, phieuNghiemThuMau,
    tongKgMocDaNhuom, tongKgMauThanhPham, haoHutNhuomKg, haoHutNhuomPt,
    loVaiTP, tongKgTP, tongGiaTriTP,
    chatLuong, trangThai,
  };
}

// ============ TÍNH CHẤT LƯỢNG MẺ SỢI ============
export function tinhChatLuongMeSoi(data: {
  haoHutDetPt: number;
  haoHutNhuomPt: number;
  tongKgSoi: number;
  tongKgTP: number;
}): ChatLuongMeSoi {
  const { haoHutDetPt, haoHutNhuomPt, tongKgSoi, tongKgTP } = data;
  const tongHaoHutPt = tongKgSoi > 0 ? ((tongKgSoi - tongKgTP) / tongKgSoi) * 100 : 0;

  // Chất lượng dệt: hao hụt ≤ 4% tốt, 4-10% bình thường, > 10% kém
  const chatLuongDet: "Tốt" | "Bình thường" | "Kém" =
    haoHutDetPt <= 4 ? "Tốt" : haoHutDetPt <= 10 ? "Bình thường" : "Kém";
  const haoHutDetAccept = haoHutDetPt <= 4;

  // Chất lượng nhuộm: hao hụt ≤ 3% tốt, 3-5% bình thường, > 5% kém
  const chatLuongNhuom: "Tốt" | "Bình thường" | "Kém" =
    haoHutNhuomPt <= 3 ? "Tốt" : haoHutNhuomPt <= 5 ? "Bình thường" : "Kém";
  const haoHutNhuomAccept = haoHutNhuomPt <= 5;

  // Chất lượng TP: dựa vào tổng hao hụt
  const chatLuongTP: "Tốt" | "Bình thường" | "Kém" =
    tongHaoHutPt <= 8 ? "Tốt" : tongHaoHutPt <= 15 ? "Bình thường" : "Kém";

  // Tính điểm tổng hợp (0-100)
  let diem = 100;
  diem -= haoHutDetPt * 3;        // mỗi % hao hụt dệt trừ 3 điểm
  diem -= haoHutNhuomPt * 5;      // mỗi % hao hụt nhuộm trừ 5 điểm
  diem = Math.max(0, diem);

  // Xếp loại
  let xepLoai: ChatLuongMeSoi["xepLoai"];
  if (diem >= 90 && haoHutDetAccept && haoHutNhuomAccept) xepLoai = "A";
  else if (diem >= 80) xepLoai = "B";
  else if (diem >= 70) xepLoai = "C";
  else if (diem >= 60) xepLoai = "Đạt";
  else if (diem >= 50) xepLoai = "Cảnh báo";
  else xepLoai = "Kém";

  return {
    xepLoai, diem: Math.round(diem),
    chatLuongDet, haoHutDetAccept,
    chatLuongNhuom, haoHutNhuomAccept,
    chatLuongTP, tongKgSoi, tongKgTP, tongHaoHutPt,
    daPheDuyet: false,
  };
}

// ============ GỢI Ý TÁCH LỆNH DỆT ============
export interface GoiYTachLenh {
  maLoSoi: string;
  kgConLai: number;
  goiY: {
    soLenh: number;
    kgMoiLenh: number;
    xuongDetDeXuat: string[];
    lyDo: string;
  }[];
}

/**
 * Gợi ý tách lệnh dệt: Nếu mẻ sợi > 500kg, tách thành 2-3 lệnh để giảm rủi ro
 */
export function goiYTachLenhDet(maLoSoi: string): GoiYTachLenh | null {
  const pnss = getAllPhieuNhapSoi();
  const phieuNhap = pnss.find((p) => p.maLoSoi === maLoSoi);
  if (!phieuNhap) return null;

  const lds = getAllLenhDet().filter((l) => l.maLoSoi === maLoSoi);
  const kgDaGiao = lds.reduce((s, l) => s + l.soKgGiao, 0);
  const kgConLai = phieuNhap.soKg - kgDaGiao;

  if (kgConLai <= 0) return null;

  const goiY: GoiYTachLenh["goiY"] = [];

  if (kgConLai <= 300) {
    // Ít - 1 lệnh
    goiY.push({
      soLenh: 1, kgMoiLenh: kgConLai,
      xuongDetDeXuat: ["DNT Dệt Bắc Ninh"],
      lyDo: "Mẻ nhỏ - 1 lệnh dệt là đủ",
    });
  } else if (kgConLai <= 800) {
    // Trung bình - 1-2 lệnh
    goiY.push({
      soLenh: 1, kgMoiLenh: kgConLai,
      xuongDetDeXuat: ["DNT Dệt Bắc Ninh"],
      lyDo: "Mẻ trung bình - 1 lệnh dệt",
    });
    goiY.push({
      soLenh: 2, kgMoiLenh: Math.ceil(kgConLai / 2),
      xuongDetDeXuat: ["DNT Dệt Bắc Ninh", "DNT Dệt Thái Bình"],
      lyDo: "Chia 2 xưởng để so sánh chất lượng",
    });
  } else {
    // Lớn - tách 2-3 lệnh
    goiY.push({
      soLenh: 2, kgMoiLenh: Math.ceil(kgConLai / 2),
      xuongDetDeXuat: ["DNT Dệt Bắc Ninh", "DNT Dệt Thái Bình"],
      lyDo: "Mẻ lớn - chia 2 xưởng để giảm rủi ro",
    });
    goiY.push({
      soLenh: 3, kgMoiLenh: Math.ceil(kgConLai / 3),
      xuongDetDeXuat: ["DNT Dệt Bắc Ninh", "DNT Dệt Thái Bình", "DNT Dệt Hà Nội"],
      lyDo: "Mẻ rất lớn - chia 3 xưởng để kiểm tra chất lượng từng phần",
    });
  }

  return { maLoSoi, kgConLai, goiY };
}

// ============ GỢI Ý GỘP LÔ MỘC ĐỂ NHUỘM ============
export interface GoiYGopMeNhuom {
  cacLenhDet: LenhDet[];
  tongKgMoc: number;
  goiY: {
    meNhuomId: string;
    cacMaLoMoc: string[];
    tongKg: number;
    soMauDeXuat: number;
    cacMauPhoBien: string[];
    lyDo: string;
  }[];
}

/**
 * Gợi ý gộp các lô mộc từ cùng 1 mẻ sợi LSOI → 1 mẻ nhuộm nhiều màu
 */
export function goiYGopMeNhuom(maLoSoi: string): GoiYGopMeNhuom | null {
  const lds = getAllLenhDet().filter((l) =>
    l.maLoSoi === maLoSoi && l.trangThai === "Hoàn thành" && l.soKgMocNhan
  );
  if (lds.length === 0) return null;

  const tongKgMoc = lds.reduce((s, l) => s + (l.soKgMocNhan || 0), 0);
  const cacMaLoMoc = lds.map((l) => `LM-${l.id}`);

  // Màu phổ biến theo loại sợi
  const loaiSoi = lds[0]?.loaiSoi || "";
  let cacMauPhoBien: string[] = [];
  if (loaiSoi.includes("COTTON")) {
    cacMauPhoBien = ["Trắng", "Đen", "Xám", "Navy", "Đỏ"];
  } else if (loaiSoi.includes("POLY")) {
    cacMauPhoBien = ["Đen", "Navy", "Xám", "Xanh dương"];
  } else {
    cacMauPhoBien = ["Đen", "Trắng", "Navy"];
  }

  // Gợi ý số màu theo tổng kg
  const soMauDeXuat = tongKgMoc <= 500 ? 2 : tongKgMoc <= 1000 ? 3 : 4;

  return {
    cacLenhDet: lds,
    tongKgMoc,
    goiY: [
      {
        meNhuomId: `MN_AUTO_${Date.now().toString().slice(-6)}`,
        cacMaLoMoc,
        tongKg: tongKgMoc,
        soMauDeXuat,
        cacMauPhoBien: cacMauPhoBien.slice(0, soMauDeXuat),
        lyDo: `Gộp ${lds.length} lô mộc từ ${maLoSoi} → 1 mẻ nhuộm ${soMauDeXuat} màu phổ biến`,
      },
      {
        meNhuomId: `MN_NHUOMDON_${Date.now().toString().slice(-6)}`,
        cacMaLoMoc,
        tongKg: tongKgMoc,
        soMauDeXuat: 1,
        cacMauPhoBien: ["Đen"],
        lyDo: `Hoặc nhuộm 1 màu (Đen) để dễ kiểm soát chất lượng mẻ sợi`,
      },
    ],
  };
}

// ============ QC TỔNG HỢP MẺ SỢI ============
export function pheDuyetQCMeSoi(maLoSoi: string, nguoiQC: string, ghiChu: string): ChatLuongMeSoi | null {
  const me = buildMeSoiTongQuan(maLoSoi);
  if (!me) return null;

  // Lưu QC
  const qcData = {
    ...me.chatLuong,
    nguoiQC, ngayQC: new Date().toISOString().slice(0, 10),
    ghiChuQC: ghiChu, daPheDuyet: true,
  };

  // Lưu vào localStorage
  const qcAll = JSON.parse(localStorage.getItem("mimin_qc_me_soi") || "{}");
  qcAll[maLoSoi] = qcData;
  localStorage.setItem("mimin_qc_me_soi", JSON.stringify(qcAll));

  return qcData;
}

export function getQCMeSoi(maLoSoi: string): ChatLuongMeSoi | null {
  try {
    const qcAll = JSON.parse(localStorage.getItem("mimin_qc_me_soi") || "{}");
    return qcAll[maLoSoi] || null;
  } catch { return null; }
}

// ============ DANH SÁCH TẤT CẢ MẺ SỢI ============
export function getAllMeSoi(): string[] {
  const pnss = getAllPhieuNhapSoi();
  const lds = getAllLenhDet();
  const set = new Set<string>();
  pnss.forEach((p) => set.add(p.maLoSoi));
  lds.forEach((l) => set.add(l.maLoSoi));
  return Array.from(set);
}
