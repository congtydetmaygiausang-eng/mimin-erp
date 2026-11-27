/**
 * Bảng lương tự động Engine (2026-08-03 - Cập nhật)
 * Tính lương cho 17 NV mới từ Excel:
 * - Lương sản phẩm: SL đạt × đơn giá (theo NV)
 * - Phạt lỗi: 30% đơn giá / sp lỗi
 * - Thưởng vượt: 20% đơn giá / sp vượt
 * - Phạt trễ hạn: 50K / task trễ
 * - Lương theo ngày công (admin/kế toán/kho/content...): lương tháng × (ngày công thực tế / 28), không giới hạn trần, nghỉ phép = 0 công
 */

import { REAL_NHAN_VIEN, REAL_DON_GIA } from "./real-workflow-data";
import { KH_SI_FULL } from "./master-data-full";
import {
  CHUAN_NGAY_CONG_THANG,
  CHUAN_GIO_LAM_MOI_NGAY,
  TONG_GIO_CHUAN_THANG,
  tinhDonGiaGio,
  tinhTienTangCa,
  tinhLuongTheoNgayCong,
  tinhPhanTramNgayCong,
  tongHopChamCong,
  type ChamCongRecord,
} from "./cham-cong";
import type { GiaoDichThuChi } from "./data/thu-chi";

/**
 * Helper so khớp nhân viên giữa Bảng Lương và phiếu Thu Chi nội bộ (Tạm ứng)
 * Hỗ trợ khớp chính xác theo:
 * 1. Mã đối tác (maDoiTac) hoặc mã NV trong người nhận (nguoiNhan)
 * 2. Họ tên đầy đủ (có dấu/không dấu)
 * 3. Nội dung cụ thể chỉ đích danh nhân viên
 * Tuyệt đối không gán nhầm khi phiếu đã có mã nhân viên khác, hoặc từ đồng âm (như "chi phí", "lệ phí", "quản lý"...)
 */
export function matchNhanVienThuChi(
  nv: { ma: string; ten: string },
  nguoiNhanText?: string,
  noiDungText?: string,
  maDoiTac?: string,
  tenDoiTac?: string,
  loaiTamUng?: string
): boolean {
  // Loại trừ phiếu tạm ứng gia công ngoài (không tính vào lương nhân sự nội bộ)
  if (
    loaiTamUng === "gia_cong" ||
    (maDoiTac && maDoiTac.toUpperCase().startsWith("GC-")) ||
    (nguoiNhanText && (nguoiNhanText.toUpperCase().startsWith("GC-") || /xưởng/i.test(nguoiNhanText)))
  ) {
    return false;
  }

  const targetMa = nv.ma.trim().toUpperCase().replace(/-/g, "");
  const targetTen = nv.ten.trim().toLowerCase();

  const removeAccents = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

  const targetTenNo = removeAccents(targetTen);

  // 1. Kiểm tra mã đối tác trực tiếp (ưu tiên số 1)
  if (maDoiTac) {
    const dtMa = maDoiTac.trim().toUpperCase().replace(/-/g, "");
    if (dtMa.startsWith("NV")) {
      return dtMa === targetMa;
    }
  }

  // 2. Kiểm tra thông tin người nhận (nguoiNhanText)
  const nguoiNhan = (nguoiNhanText || "").trim();
  if (nguoiNhan) {
    // Nếu trong thông tin người nhận đã có mã NV (VD: "NV03 - Nguyễn Triết Khang")
    const matchMaNV = nguoiNhan.match(/\b(NV-?\d+)\b/i);
    if (matchMaNV) {
      const foundMa = matchMaNV[1].toUpperCase().replace(/-/g, "");
      return foundMa === targetMa;
    }

    // So khớp họ tên trong người nhận
    const nnLow = nguoiNhan.toLowerCase();
    const nnNo = removeAccents(nnLow);
    if (nnLow.includes(targetTen) || nnNo.includes(targetTenNo)) {
      return true;
    }
  }

  // 3. So khớp họ tên đối tác trực tiếp (tenDoiTac)
  if (tenDoiTac) {
    const tdtLow = tenDoiTac.trim().toLowerCase();
    const tdtNo = removeAccents(tdtLow);
    if (tdtLow.includes(targetTen) || tdtNo.includes(targetTenNo)) {
      return true;
    }
  }

  // 4. Nếu phiếu đã có người nhận ghi rõ tên nhân sự khác thì không match vào nội dung nữa
  if (nguoiNhan && nguoiNhan !== "null" && nguoiNhan !== "Chưa xác định") {
    // Có người nhận cụ thể nhưng không trùng mã hay tên của NV này -> không match
    return false;
  }

  // 5. Kiểm tra nội dung (noiDungText) khi chưa xác định người nhận
  const noiDung = (noiDungText || "").trim();
  if (!noiDung) return false;

  const ndLow = noiDung.toLowerCase();
  const ndNo = removeAccents(ndLow);

  // Khớp mã nhân viên trong nội dung (VD: "tạm ứng cho NV04", "NV-04")
  const maRegex = new RegExp(`(^|[^a-zA-Z0-9])${nv.ma.replace(/-/g, "-?")}([^a-zA-Z0-9]|$)`, "i");
  if (maRegex.test(noiDung)) return true;

  // Khớp họ tên đầy đủ trong nội dung (VD: "tạm ứng Lương Hoàng Phi")
  if (ndLow.includes(targetTen) || ndNo.includes(targetTenNo)) return true;

  // 6. So khớp tên riêng theo ngữ cảnh nhân sự (tránh nhầm lẫn các từ kế toán thông dụng)
  // Loại bỏ các cụm từ dễ nhầm lẫn trong tiếng Việt:
  // - "chi phí", "lệ phí", "học phí", "viện phí", "kinh phí", "cước phí", "phí ship" (tránh nhầm với "Phi")
  // - "thu chi", "chi tiêu", "chi trả", "chi lương", "chi tạm ứng" (tránh nhầm với "Chi")
  // - "quản lý", "xử lý", "hợp lý", "đại lý" (tránh nhầm với "Lý")
  const cleanedNoiDung = ndLow
    .replace(/(chi|học|lệ|viện|kinh|cước)\s+phí|phí\s+(ship|xe|vận\s+chuyển|phát\s+sinh|khác)/g, " ")
    .replace(/quản\s+lý|xử\s+lý|hợp\s+lý|đại\s+lý/g, " ")
    .replace(/thu\s+chi|chi\s+tiêu|chi\s+trả|chi\s+lương|chi\s+tạm\s+ứng/g, " ");

  const cleanedNoiDungNo = removeAccents(cleanedNoiDung);

  const tenParts = nv.ten.split(/\s+/).filter(Boolean);
  if (tenParts.length >= 2) {
    const lastNameTwo = `${tenParts[tenParts.length - 2]} ${tenParts[tenParts.length - 1]}`.toLowerCase();
    const lastNameTwoNo = removeAccents(lastNameTwo);
    // Khớp 2 từ cuối tên (VD: "Hoàng Phi", "Văn Lý", "Kim Chi", "Thái Hào")
    if (cleanedNoiDung.includes(lastNameTwo) || cleanedNoiDungNo.includes(lastNameTwoNo)) {
      return true;
    }

    const firstName = tenParts[tenParts.length - 1].toLowerCase();
    const firstNameNo = removeAccents(firstName);

    // Kiểm tra danh xưng + tên riêng (VD: "anh Phi", "em Phi", "bạn Phi", "anh Khang", "chị Hạnh"...)
    const titleRegex = new RegExp(`(^|[^a-zA-Z0-9À-ỹ])(anh|chị|chi|em|bạn|cô|chú)\\s+${firstName}([^a-zA-Z0-9À-ỹ]|$)`, "i");
    const titleRegexNo = new RegExp(`(^|[^a-zA-Z0-9])(anh|chi|em|ban|co|chu)\\s+${firstNameNo}([^a-zA-Z0-9]|$)`, "i");
    if (titleRegex.test(cleanedNoiDung) || titleRegexNo.test(cleanedNoiDungNo)) {
      return true;
    }
  }

  return false;
}

export interface BangLuongNV {
  maNV: string;
  tenNV: string;
  boPhan: string;          // Cắt / Gấp xếp / Ủi / Khuy nút / Content / Kho / ...
  donGia: number;          // đ/sp (0 nếu lương cứng)
  donVi: string;            // cái/sp
  luongCung: number;        // Lương cơ bản tháng (mức chuẩn 28 công)
  isLuongSP: boolean;      // true = lương sản phẩm, false = lương theo ngày công
  ngayCongThucTe: number;  // Số công thực tế trong tháng (đi-làm/đi-trễ=1, nửa-ngày=0.5, nghỉ-phép=0)
  ngayCongChuan: number;   // Chuẩn 28 ngày công/tháng
  tyLeNgayCong: number;    // % thực tế so với chuẩn 28 công (không giới hạn trần)
  ngayPhep: number;        // Số ngày nghỉ phép (0 công)
  ngayKhongPhep: number;
  soLanDiTre: number;
  gioTangCa: number;
  donGiaGioTangCa: number;  // Đơn giá 1h làm việc chuẩn = Lương cơ bản / (28 * 8.5)
  tienTangCa: number;       // Tiền tăng ca = gioTangCa * donGiaGioTangCa
  coDuLieuChamCong: boolean;
  soLuongGiao: number;      // Tổng SL được giao
  soLuongDat: number;       // SL hoàn thành đúng
  soLuongLoi: number;       // SL bị lỗi
  soLuongVuot: number;      // SL vượt (nếu có)
  tienCong: number;         // Tiền công = slDat × donGia (SP) hoặc lương × (công / 28)
  phatLoi: number;          // Phạt lỗi (30% đơn giá / sp lỗi)
  thuongVuot: number;       // Thưởng vượt (+20% đơn giá / sp vượt)
  phatTreHan: number;       // Phạt trễ hạn (nếu có)
  tamUng: number;           // Tổng số tiền tạm ứng trong tháng từ Thu Chi nội bộ
  danhSachTamUng: GiaoDichThuChi[]; // Danh sách các lần tạm ứng chi tiết trong tháng
  thucNhan: number;         // Thực nhận = Tiền công + Thưởng - Phạt - Tạm ứng
  ngayTra: string;          // Ngày trả dự kiến (ngày 5 tháng sau)
  tasks: string[];          // Danh sách task IDs đã làm
  ghiChu?: string;
}

const PHAT_LOI_RATE = 0.3;       // Phạt 30% đơn giá / sp lỗi
const THUONG_VUOT_RATE = 0.2;    // Thưởng 20% đơn giá / sp vượt
const PHAT_TRE_HAN = 50000;      // Phạt trễ hạn 50K / task

// Lương cứng mặc định (theo data Excel)
const LUONG_CUNG_DEFAULT: Record<string, number> = {
  "Content - Media": 8_000_000,
  "QL Khách hàng Sỉ": 7_000_000,
  "Kế toán điều phối SX": 8_000_000,
  "Nhân viên Kho": 7_000_000,
  "Media": 10_000_000,
};

export interface NhanSuLuongInput {
  ma: string;
  ten: string;
  boPhan: string;
  chucVu?: string;
  donGia?: number;
  luongCung?: number;
  ghiChu?: string;
}

/**
 * Tính bảng lương cho tất cả NV trong 1 tháng
 * @param thang 1-12
 * @param nam yyyy
 * @param allPhieu PhieuWorkflow[] (mặc định ALL_REAL_PHIEU - có thể truyền task từ localStorage)
 * @param customEmployees NhanSuLuongInput[] (danh sách nhân sự hiện tại từ Supabase / Store)
 * @returns BangLuongNV[]
 */
export function tinhBangLuongThang(
  thang: number,
  nam: number,
  allPhieu: any[] = [],
  customEmployees?: NhanSuLuongInput[],
  chamCongRecords?: ChamCongRecord[],
  danhSachThuChi?: GiaoDichThuChi[]
): BangLuongNV[] {
  // Lấy tasks trong tháng
  const startDate = new Date(nam, thang - 1, 1);
  const endDate = new Date(nam, thang, 0, 23, 59, 59);
  const monthPrefix = `${nam}-${String(thang).padStart(2, "0")}`;
  const monthAttendanceRecords = (chamCongRecords || []).filter(
    (r) => typeof r.ngay === "string" && r.ngay.startsWith(monthPrefix)
  );
  const hasMonthAttendanceData = monthAttendanceRecords.length > 0;

  // Lọc các giao dịch tạm ứng trong tháng từ sổ Thu Chi nội bộ (loai: "chi", danhMuc: "tam_ung")
  const monthTamUngRecords = (danhSachThuChi || []).filter(
    (tc) =>
      tc.loai === "chi" &&
      tc.danhMuc === "tam_ung" &&
      typeof tc.ngay === "string" &&
      tc.ngay.startsWith(monthPrefix)
  );

  const tasksTrongThang = allPhieu.filter((p) => {
    const taskDate = p.ngayHoanThanh ? new Date(p.ngayHoanThanh) :
                     p.ngayNhan ? new Date(p.ngayNhan) :
                     p.ngayGiao ? new Date(p.ngayGiao) : null;
    return taskDate && taskDate >= startDate && taskDate <= endDate;
  });

  const empList: NhanSuLuongInput[] = (customEmployees && customEmployees.length > 0)
    ? customEmployees
    : REAL_NHAN_VIEN;

  // Tính cho từng NV
  const result: BangLuongNV[] = [];

  for (const nv of empList) {
    // Lấy đơn giá từ NV info
    const donGia = nv.donGia || 0;

    // Lấy lương cơ bản tháng
    const luongCung = nv.luongCung !== undefined
      ? nv.luongCung
      : (LUONG_CUNG_DEFAULT[nv.boPhan] || 0);
    const isLuongSP = luongCung === 0;

    // Tổng hợp chấm công tháng của NV theo chuẩn 28 ngày (không giới hạn trần, nghỉ phép = 0 công)
    const normalizedMa = nv.ma.trim().toUpperCase();
    const myAttendance = monthAttendanceRecords.filter(
      (r) => r.maNV.trim().toUpperCase() === normalizedMa
    );
    const attSummary = tongHopChamCong(myAttendance);
    const ngayCongChuan = CHUAN_NGAY_CONG_THANG;
    const ngayCongThucTe = attSummary.ngayCong;
    const tyLeNgayCong = tinhPhanTramNgayCong(ngayCongThucTe, ngayCongChuan);

    // Lấy tasks của NV trong tháng
    const myTasks = tasksTrongThang.filter((t) =>
      t.nguoiNhan === nv.ma ||
      (t.tenNguoiNhan && t.tenNguoiNhan.toLowerCase() === nv.ten.toLowerCase())
    );
    const tasksMa = myTasks.map((t) => t.id);

    const soLuongGiao = myTasks.reduce((s, t) => s + (t.soLuongGiao || 0), 0);
    const soLuongDat = myTasks.reduce((s, t) => s + (t.soLuongDat || 0), 0);
    const soLuongLoi = myTasks.reduce((s, t) => s + (t.soLuongLoi || 0), 0);
    const soLuongVuot = Math.max(0, soLuongDat - soLuongGiao);

    // Phạt trễ hạn: task có deadline < ngayHoanThanh (nếu có)
    let phatTreHan = 0;
    for (const t of myTasks) {
      if (t.hanHoanThanh && t.ngayHoanThanh && t.ngayHoanThanh > t.hanHoanThanh) {
        phatTreHan += PHAT_TRE_HAN;
      }
    }

    // Lấy các lần tạm ứng trong tháng của NV từ Thu Chi nội bộ (khớp theo mã đối tác, người nhận hoặc nội dung chuẩn xác)
    const myTamUngRecords = monthTamUngRecords.filter((tc) =>
      matchNhanVienThuChi(
        { ma: nv.ma, ten: nv.ten },
        tc.nguoiNhan,
        tc.noiDung,
        tc.maDoiTac,
        tc.tenDoiTac,
        tc.loaiTamUng
      )
    );
    const tamUng = myTamUngRecords.reduce((sum, item) => sum + (Number(item.soTien) || 0), 0);

    // Tính tiền tăng ca:
    // Cơ sở 28 ngày công / 1 tháng, mỗi ngày 8.5 tiếng làm việc chuẩn.
    // Đơn giá 1 giờ = Lương cơ bản / (28 * 8.5) = Lương cơ bản / 238
    const luongCoBanTinhTangCa = luongCung > 0 ? luongCung : (LUONG_CUNG_DEFAULT[nv.boPhan] || 0);
    const donGiaGioTangCa = tinhDonGiaGio(luongCoBanTinhTangCa, ngayCongChuan, CHUAN_GIO_LAM_MOI_NGAY);
    const gioTangCa = attSummary.gioTangCa || 0;
    const tienTangCa = tinhTienTangCa(gioTangCa, luongCoBanTinhTangCa, ngayCongChuan, CHUAN_GIO_LAM_MOI_NGAY);

    // Tính tiền công & thực nhận (Tiền tăng ca được cộng thêm vào bảng lương)
    let tienCong = 0;
    let phatLoi = 0;
    let thuongVuot = 0;
    let thucNhan = 0;

    if (isLuongSP) {
      tienCong = soLuongDat * donGia;
      phatLoi = soLuongLoi * donGia * PHAT_LOI_RATE;
      thuongVuot = soLuongVuot * donGia * THUONG_VUOT_RATE;
      thucNhan = Math.max(0, tienCong + tienTangCa - phatLoi - phatTreHan + thuongVuot - tamUng);
    } else if (hasMonthAttendanceData) {
      tienCong = tinhLuongTheoNgayCong(luongCung, ngayCongThucTe, ngayCongChuan);
      thucNhan = Math.max(0, tienCong + tienTangCa - phatTreHan - tamUng);
    } else {
      // Tháng chưa có dữ liệu chấm công (hoặc caller chưa truyền dữ liệu chấm công): giữ nguyên mức cơ bản để không gãy lịch sử
      tienCong = luongCung;
      thucNhan = Math.max(0, luongCung + tienTangCa - phatTreHan - tamUng);
    }

    // Ngày trả: ngày 10 tháng sau (handle rollover năm khi thang = 12) - Quy định MIMIN: Mùng 10 hàng tháng
    const nextThang = thang === 12 ? 1 : thang + 1;
    const nextNam = thang === 12 ? nam + 1 : nam;
    const ngayTra = `${nextNam}-${String(nextThang).padStart(2, "0")}-10`;

    result.push({
      maNV: nv.ma,
      tenNV: nv.ten,
      boPhan: nv.boPhan,
      donGia,
      donVi: donGia > 0 ? "sp" : "tháng",
      luongCung,
      isLuongSP,
      ngayCongThucTe,
      ngayCongChuan,
      tyLeNgayCong,
      ngayPhep: attSummary.ngayPhep,
      ngayKhongPhep: attSummary.ngayKhongPhep,
      soLanDiTre: attSummary.soLanDiTre,
      gioTangCa,
      donGiaGioTangCa,
      tienTangCa: Math.round(tienTangCa),
      coDuLieuChamCong: hasMonthAttendanceData,
      soLuongGiao,
      soLuongDat,
      soLuongLoi,
      soLuongVuot,
      tienCong: Math.round(tienCong),
      phatLoi: Math.round(phatLoi),
      thuongVuot: Math.round(thuongVuot),
      phatTreHan: Math.round(phatTreHan),
      tamUng: Math.round(tamUng),
      danhSachTamUng: myTamUngRecords,
      thucNhan: Math.round(thucNhan),
      ngayTra,
      tasks: tasksMa,
      ghiChu: nv.ghiChu,
    });
  }

  return result;
}

/**
 * Tổng kết bảng lương tháng
 */
export interface TongKetBangLuong {
  tongNV: number;
  tongLuongCung: number;
  tongLuongSP: number;
  tongPhatLoi: number;
  tongThuongVuot: number;
  tongPhatTreHan: number;
  tongTamUng: number;           // Tổng số tiền tạm ứng đã chi trong tháng
  tongSoLuotTamUng: number;     // Tổng số lượt tạm ứng trong tháng
  tongGioTangCa: number;        // Tổng số giờ tăng ca của toàn bộ nhân viên
  tongTienTangCa: number;       // Tổng số tiền tăng ca phải trả trong tháng
  tongThucNhan: number;
  theoBoPhan: { boPhan: string; ten: string; tongNV: number; thucNhan: number; mau: string }[];
}

const BO_PHAN_INFO: Record<string, { ten: string; mau: string }> = {
  "Quản lý": { ten: "Quản lý", mau: "#2563eb" },
  "Kho vận": { ten: "Kho vận", mau: "#ea580c" },
  "Sản xuất": { ten: "Sản xuất", mau: "#059669" },
  "Kinh doanh": { ten: "Kinh doanh", mau: "#7c3aed" },
  "cắt": { ten: "Cắt", mau: "#0284c7" },
  "Cắt": { ten: "Cắt", mau: "#0284c7" },
  "Gấp xếp": { ten: "Gấp xếp", mau: "#7c3aed" },
  "Ủi": { ten: "Ủi", mau: "#e11d48" },
  "Khuy nút": { ten: "Khuy nút", mau: "#ca8a04" },
  "Content - Media": { ten: "Content - Media", mau: "#db2777" },
  "QL Khách hàng Sỉ": { ten: "QL Khách hàng Sỉ", mau: "#0891b2" },
  "Kế toán điều phối SX": { ten: "Kế toán", mau: "#2563eb" },
  "Nhân viên Kho": { ten: "Kho", mau: "#ea580c" },
  "Media": { ten: "Media", mau: "#db2777" },
};

export function tongKetBangLuong(blList: BangLuongNV[]): TongKetBangLuong {
  const byBoPhan: Record<string, { count: number; total: number }> = {};
  for (const bl of blList) {
    if (!byBoPhan[bl.boPhan]) byBoPhan[bl.boPhan] = { count: 0, total: 0 };
    byBoPhan[bl.boPhan].count++;
    byBoPhan[bl.boPhan].total += bl.thucNhan;
  }

  return {
    tongNV: blList.length,
    tongLuongCung: blList.filter(b => !b.isLuongSP).reduce((s, b) => s + b.luongCung, 0),
    tongLuongSP: blList.filter(b => b.isLuongSP).reduce((s, b) => s + b.thucNhan, 0),
    tongPhatLoi: blList.reduce((s, b) => s + b.phatLoi, 0),
    tongThuongVuot: blList.reduce((s, b) => s + b.thuongVuot, 0),
    tongPhatTreHan: blList.reduce((s, b) => s + b.phatTreHan, 0),
    tongTamUng: blList.reduce((s, b) => s + b.tamUng, 0),
    tongSoLuotTamUng: blList.reduce((s, b) => s + (b.danhSachTamUng ? b.danhSachTamUng.length : 0), 0),
    tongGioTangCa: blList.reduce((s, b) => s + (b.gioTangCa || 0), 0),
    tongTienTangCa: blList.reduce((s, b) => s + (b.tienTangCa || 0), 0),
    tongThucNhan: blList.reduce((s, b) => s + b.thucNhan, 0),
    theoBoPhan: Object.entries(byBoPhan).map(([bp, d]) => ({
      boPhan: bp,
      ten: BO_PHAN_INFO[bp]?.ten || bp,
      mau: BO_PHAN_INFO[bp]?.mau || "#64748b",
      tongNV: d.count,
      thucNhan: d.total,
    })),
  };
}

/**
 * Format VND
 */
export function fmtVND(n: number): string {
  if (n === 0) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + " tr";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString("vi-VN");
}

/**
 * Format VND đầy đủ (cho chi tiết)
 */
export function fmtVNDFull(n: number): string {
  return n.toLocaleString("vi-VN") + " đ";
}
