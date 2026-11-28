import test from "node:test";
import assert from "node:assert/strict";
import {
  CHUAN_NGAY_CONG_THANG,
  CHUAN_GIO_LAM_MOI_NGAY,
  TONG_GIO_CHUAN_THANG,
  tinhDonGiaGio,
  tinhTienTangCa,
  GIO_KET_THUC_CA_CHUAN,
  GIO_VAO_CA_CHUAN,
  isEarlyLeave,
  isLateArrival,
  mergeChamCongRecords,
  normalizeChamCongFromDB,
  tinhLuongTheoNgayCong,
  tinhPhanTramNgayCong,
  tinhTyLeNgayCong,
  tongHopChamCong,
  type ChamCongRecord,
  type TrangThaiChamCong,
} from "./cham-cong";
import { tinhBangLuongThang } from "./bang-luong-engine";
import { canView, getAccessibleModules, getDefaultLandingRoute, getEffectivePermissions, normalizeMatrix, type Role } from "./permissions";

const TS = "2026-11-12T00:00:00.000Z";

function makeRecord(
  id: string,
  maNV: string,
  ngay: string,
  trangThai: TrangThaiChamCong,
  extra: Partial<ChamCongRecord> = {}
): ChamCongRecord {
  return {
    id,
    maNV,
    ngay,
    trangThai,
    soGioTangCa: 0,
    createdAt: TS,
    updatedAt: TS,
    ...extra,
  };
}

test("hang so ca lam viec 07:30 - 17:30 va chuan 28 ngay cong", () => {
  assert.equal(CHUAN_NGAY_CONG_THANG, 28);
  assert.equal(GIO_VAO_CA_CHUAN, "07:30:00");
  assert.equal(GIO_KET_THUC_CA_CHUAN, "17:30:00");

  assert.equal(isLateArrival("07:29:59"), false);
  assert.equal(isLateArrival("07:30:00"), false);
  assert.equal(isLateArrival("07:30:45"), false);
  assert.equal(isLateArrival("07:31:00"), true);
  assert.equal(isLateArrival("08:00:00"), true);

  assert.equal(isEarlyLeave("17:29:59"), true);
  assert.equal(isEarlyLeave("17:30:00"), false);
  assert.equal(isEarlyLeave("18:10:00"), false);
});

test("nghi phep tinh 0 cong va tong hop day du cac trang thai", () => {
  const sample: ChamCongRecord[] = [
    makeRecord("1", "NV02", "2026-11-01", "di-lam", { soGioTangCa: 2 }),
    makeRecord("2", "NV02", "2026-11-02", "di-tre"),
    makeRecord("3", "NV02", "2026-11-03", "nua-cong"),
    makeRecord("4", "NV02", "2026-11-04", "nghi-phep"),
    makeRecord("5", "NV02", "2026-11-05", "nghi-khong-phep"),
  ];

  const summary = tongHopChamCong(sample);
  assert.equal(summary.ngayCong, 2.5);
  assert.equal(summary.ngayPhep, 1);
  assert.equal(summary.ngayKhongPhep, 1);
  assert.equal(summary.soLanDiTre, 1);
  assert.equal(summary.gioTangCa, 2);
});

test("ty le ngay cong chia chuan 28 khong gioi han tran", () => {
  assert.equal(tinhTyLeNgayCong(14), 0.5);
  assert.equal(tinhPhanTramNgayCong(14), 50);
  assert.equal(tinhLuongTheoNgayCong(10_000_000, 14), 5_000_000);

  assert.equal(tinhTyLeNgayCong(28), 1);
  assert.equal(tinhPhanTramNgayCong(28), 100);
  assert.equal(tinhLuongTheoNgayCong(10_000_000, 28), 10_000_000);

  // Thang co 30 ngay di lam du 30 ngay -> tinh dung 30/28 (> 100%)
  assert.equal(tinhTyLeNgayCong(30), 30 / 28);
  assert.equal(tinhPhanTramNgayCong(30), 107.1);
  assert.equal(tinhLuongTheoNgayCong(14_000_000, 30), 15_000_000);

  assert.equal(tinhLuongTheoNgayCong(10_000_000, 0), 0);
});

test("mergeChamCongRecords giu nguyen du lieu sang/chieu cho dong bo khi F5", () => {
  const remote = [
    normalizeChamCongFromDB({
      id: "CC-NV03-2026-11-12",
      ma_nv: "NV03",
      ngay: "2026-11-12",
      trang_thai: "di-lam",
      gio_vao: "07:24:00",
      gio_ra: null,
      updated_at: "2026-11-12T00:24:00.000Z",
    }),
  ];

  const localPending: ChamCongRecord[] = [
    makeRecord("CC-NV03-2026-11-12", "nv03", "2026-11-12", "di-lam", {
      gioVao: "07:24:00",
      gioRa: "17:35:00",
      updatedAt: "2026-11-12T10:35:00.000Z",
    }),
    makeRecord("CC-NV06-2026-11-12", "NV06", "2026-11-12", "di-tre", {
      gioVao: "07:45:00",
      updatedAt: "2026-11-12T00:45:00.000Z",
    }),
  ];

  const merged = mergeChamCongRecords(remote, localPending);
  assert.equal(merged.length, 2);
  const nv03 = merged.find((r) => r.maNV === "NV03");
  const nv06 = merged.find((r) => r.maNV === "NV06");
  assert.equal(nv03?.gioRa, "17:35:00");
  assert.equal(nv06?.trangThai, "di-tre");
});

test("tinhBangLuongThang tich hop ngay cong chuan 28, ho tro NV06+ va giu tuong thich lich su", () => {
  const employees = [
    { ma: "NV02", ten: "Lê Định", boPhan: "Kho vận", donGia: 0, luongCung: 14_000_000 },
    { ma: "NV06", ten: "Nguyễn Văn A", boPhan: "Sản xuất", donGia: 0, luongCung: 7_000_000 },
    { ma: "CN01", ten: "Trần Thị May", boPhan: "Cắt", donGia: 2_000, luongCung: 0 },
  ];

  const records: ChamCongRecord[] = [
    // NV02 di lam 30 ngay (thang 11 co 30 ngay) -> 14M * 30 / 28 = 15M
    ...Array.from({ length: 30 }, (_, idx) =>
      makeRecord(`NV02-${idx + 1}`, "NV02", `2026-11-${String(idx + 1).padStart(2, "0")}`, "di-lam")
    ),
    // NV06 di lam 14 ngay + 2 ngay nghi phep huong luong -> 7M * (14 + 2) / 28 = 4M
    ...Array.from({ length: 14 }, (_, idx) =>
      makeRecord(`NV06-${idx + 1}`, "NV06", `2026-11-${String(idx + 1).padStart(2, "0")}`, "di-lam")
    ),
    makeRecord("NV06-p1", "NV06", "2026-11-15", "nghi-phep"),
    makeRecord("NV06-p2", "NV06", "2026-11-16", "nghi-phep"),
    // CN01 luong SP co tang ca 2 gio (du luongCung = 0 van duoc huong tien tang ca theo muc san co ban)
    makeRecord("CN01-1", "CN01", "2026-11-01", "di-lam", { soGioTangCa: 2 }),
  ];

  const phieu = [
    { id: "PC-1", nguoiNhan: "CN01", ngayHoanThanh: "2026-11-10", soLuongGiao: 100, soLuongDat: 100, soLuongLoi: 0 },
  ];

  const payroll = tinhBangLuongThang(11, 2026, phieu, employees, records);
  const nv02 = payroll.find((r) => r.maNV === "NV02")!;
  const nv06 = payroll.find((r) => r.maNV === "NV06")!;
  const cn01 = payroll.find((r) => r.maNV === "CN01")!;

  assert.equal(nv02.ngayCongThucTe, 30);
  assert.equal(nv02.tyLeNgayCong, 107.1);
  assert.equal(nv02.thucNhan, 15_000_000);
  assert.equal(nv02.coDuLieuChamCong, true);

  assert.equal(nv06.ngayCongThucTe, 14);
  assert.equal(nv06.ngayPhep, 2);
  assert.equal(nv06.ngayCongHuongLuong, 16);
  assert.equal(nv06.tyLeNgayCong, 57.1);
  assert.equal(nv06.thucNhan, 4_000_000);

  assert.equal(cn01.isLuongSP, true);
  assert.equal(cn01.ngayCongThucTe, 1);
  assert.equal(cn01.gioTangCa, 2);
  assert.equal(cn01.tienTangCa, 58_824);
  assert.equal(cn01.thucNhan, 258_824);

  // Thang chua co du lieu cham cong: giu nguyen muc luong co ban lich su
  const legacyPayroll = tinhBangLuongThang(10, 2026, [], employees, []);
  const legacyNv02 = legacyPayroll.find((r) => r.maNV === "NV02")!;
  assert.equal(legacyNv02.coDuLieuChamCong, false);
  assert.equal(legacyNv02.thucNhan, 14_000_000);
});

test("quyen cham-cong mo cho toan bo nhan su noi bo va chan doi tac/khach ngoai", () => {
  const internalRoles: Role[] = [
    "admin",
    "planner",
    "warehouse",
    "sewing",
    "qc",
    "finishing",
    "accountant",
    "content",
    "cutting",
    "printing",
    "buttoning",
    "ironing",
    "packaging",
  ];
  const externalRoles: Role[] = ["partner", "supplier", "workshop_customer", "buyer_customer"];

  for (const role of internalRoles) {
    assert.equal(canView(role, "cham-cong"), true, `${role} phai xem duoc /cham-cong`);
  }
  for (const role of externalRoles) {
    assert.equal(canView(role, "cham-cong"), false, `${role} khong duoc vao /cham-cong`);
  }

  // Ma tran cu trong DB/localStorage khong co cham-cong cho warehouse/qc/content/cutting phai tu dong auto-heal
  const staleMatrix = structuredClone(getEffectivePermissions());
  staleMatrix.warehouse["cham-cong"] = "";
  staleMatrix.qc["cham-cong"] = "";
  staleMatrix.content["cham-cong"] = "";
  staleMatrix.cutting["cham-cong"] = "";
  const healed = normalizeMatrix(staleMatrix);

  assert.equal(healed.warehouse["cham-cong"], "rcu");
  assert.equal(healed.qc["cham-cong"], "rcu");
  assert.equal(healed.content["cham-cong"], "rcu");
  assert.equal(healed.cutting["cham-cong"], "rcu");
  assert.equal(healed.partner["cham-cong"], "");
});

test("role attendance chi vao duoc cham-cong va redirect mac dinh ve /cham-cong", () => {
  const attendanceRoles: Role[] = ["attendance"];
  assert.equal(canView("attendance", "cham-cong"), true);
  assert.equal(getAccessibleModules("attendance").join(","), "cham-cong");

  const blockedModules = [
    "dashboard",
    "nhan-su",
    "bang-luong",
    "lenh-cat",
    "ke-hoach-sx",
    "don-hang",
    "kho-vai",
    "kho-thanh-pham",
    "thu-chi",
    "cai-dat",
    "tin-nhan",
    "workspace",
  ] as const;
  for (const mod of blockedModules) {
    assert.equal(canView("attendance", mod), false, `attendance khong duoc xem ${mod}`);
  }

  for (const role of attendanceRoles) {
    assert.equal(getDefaultLandingRoute(role).replace(/\/$/, ""), "/cham-cong");
  }
  assert.equal(getDefaultLandingRoute("admin").replace(/\/$/, ""), "/dashboard");
  assert.equal(getDefaultLandingRoute("partner").replace(/\/$/, ""), "/trang-chu-gia-cong");
  assert.equal(getDefaultLandingRoute(null).replace(/\/$/, ""), "/login");

  const staleMatrix = structuredClone(getEffectivePermissions());
  delete (staleMatrix as Record<string, unknown>).attendance;
  const healed = normalizeMatrix(staleMatrix);
  assert.equal(healed.attendance["cham-cong"], "rcu");

  // Ma trận thiếu attendance trong DB nhưng đã có cutting/warehouse vẫn phải tự heal cho attendance
  const missingAttendanceMatrix = structuredClone(getEffectivePermissions());
  missingAttendanceMatrix.warehouse["cham-cong"] = "rcu";
  missingAttendanceMatrix.cutting["cham-cong"] = "rcu";
  delete (missingAttendanceMatrix.attendance as Record<string, unknown>)["cham-cong"];
  const healedAttendance = normalizeMatrix(missingAttendanceMatrix);
  assert.equal(healedAttendance.attendance["cham-cong"], "rcu");
});

test("tam ung khong bi nham lan cho Luong Hoang Phi (NV04) khi noi dung chua tu 'chi phi' va han tra luong mung 10", () => {
  const employees = [
    { ma: "NV03", ten: "Nguyễn Triết Khang", boPhan: "Sản xuất", donGia: 0, luongCung: 7_000_000 },
    { ma: "NV04", ten: "Lương Hoàng Phi", boPhan: "Quản lý", donGia: 0, luongCung: 7_000_000 },
  ];

  const thuChi = [
    {
      id: "TC-20261118-002",
      loai: "chi" as const,
      danhMuc: "tam_ung" as const,
      loaiTamUng: "nhan_su" as const,
      maDoiTac: "NV03",
      tenDoiTac: "Nguyễn Triết Khang",
      soTien: 1_500_000,
      hinhThuc: "chuyen_khoan" as const,
      ngay: "2026-11-18",
      nguoiThucHien: "Anh Sang",
      nguoiNhan: "NV03 - Nguyễn Triết Khang",
      noiDung: "Tạm ứng chi phí sinh hoạt gia đình giữa tháng 11/2026",
      ngayTao: "2026-11-18T14:15:20.000Z",
    },
  ];

  const payroll = tinhBangLuongThang(11, 2026, [], employees, [], thuChi);
  const nv03 = payroll.find((r) => r.maNV === "NV03")!;
  const nv04 = payroll.find((r) => r.maNV === "NV04")!;

  // NV03 phai duoc tru dung 1.5M tam ung
  assert.equal(nv03.tamUng, 1_500_000);
  assert.equal(nv03.thucNhan, 5_500_000);
  assert.equal(nv03.ngayTra, "2026-12-10");

  // NV04 khong co tam ung (tamUng = 0, khong bi match nham tu 'chi phi')
  assert.equal(nv04.tamUng, 0);
  assert.equal(nv04.danhSachTamUng.length, 0);
  assert.equal(nv04.thucNhan, 7_000_000);
  assert.equal(nv04.ngayTra, "2026-12-10");
});

test("tinh tang ca tren co so 28 ngay cong / 1 thang chia 8.5 tieng moi ngay va cong vao bang luong", () => {
  // 1. Kiem tra cong thuc don gia gio
  // 28 * 8.5 = 238 gio chuan / thang
  // Luong 14,000,000 / 238 = 58,823.53 -> 58,824 d/gio
  assert.equal(CHUAN_GIO_LAM_MOI_NGAY, 8.5);
  assert.equal(TONG_GIO_CHUAN_THANG, 238);
  assert.equal(tinhDonGiaGio(14_000_000), Math.round(14_000_000 / 238));
  assert.equal(tinhDonGiaGio(7_000_000), Math.round(7_000_000 / 238));

  // 2. Tien tang ca = soGio * donGiaGio
  // 10 gio tang ca voi muc luong 7,000,000: 10 * 29,412 = 294,120 d
  const donGia7M = tinhDonGiaGio(7_000_000); // 29,412
  assert.equal(tinhTienTangCa(10, 7_000_000), 10 * donGia7M);

  // 3. Tich hop vao tinhBangLuongThang: tien tang ca duoc cong vao thucLinh
  const employees = [
    { ma: "NV03", ten: "Nguyễn Triết Khang", boPhan: "Sản xuất", donGia: 0, luongCung: 7_000_000 },
  ];
  const chamCong = [
    makeRecord("1", "NV03", "2026-11-01", "di-lam", { soGioTangCa: 2 }),
    makeRecord("2", "NV03", "2026-11-02", "di-lam", { soGioTangCa: 3 }),
  ];

  const payroll = tinhBangLuongThang(11, 2026, [], employees, chamCong);
  const nv03 = payroll.find((r) => r.maNV === "NV03")!;

  assert.equal(nv03.gioTangCa, 5);
  assert.equal(nv03.donGiaGioTangCa, donGia7M);
  assert.equal(nv03.tienTangCa, 5 * donGia7M);
  // Tien cong 2 ngay: 7,000,000 * (2/28) = 500,000
  // Thuc nhan = tienCong + tienTangCa
  assert.equal(nv03.tienCong, 500_000);
  assert.equal(nv03.thucNhan, 500_000 + 5 * donGia7M);
});
