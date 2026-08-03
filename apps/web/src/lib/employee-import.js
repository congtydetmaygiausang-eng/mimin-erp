function normalizeHeader(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function getValueByHeader(headers, row, candidates) {
  const normalizedCandidates = candidates.map(normalizeHeader);
  const index = headers.findIndex((header) => normalizedCandidates.includes(header));
  if (index === -1) return "";
  return row[index] || "";
}

function parseNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").replace(/[^0-9.-]/g, "");
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (["active", "dang_lam", "đang làm", "working"].includes(raw)) return "dang_lam";
  if (["inactive", "nghi_viec", "nghỉ việc", "left"].includes(raw)) return "nghi_viec";
  return raw || "dang_lam";
}

function mapCsvRowsToEmployees(rows, headerRowOverride) {
  if (!Array.isArray(rows) || rows.length === 0) return [];

  const firstRow = rows[0] || [];
  const hasHeaderLikeValues = Array.isArray(firstRow) && firstRow.some((cell) => {
    const value = String(cell || "").trim().toLowerCase();
    return ["ma", "họ tên", "sđt", "email", "ngày sinh", "trạng thái", "lương", "cccd", "địa chỉ", "ảnh"].some((keyword) => value.includes(keyword));
  });

  const hasProvidedHeader = Array.isArray(headerRowOverride) && headerRowOverride.some((cell) => String(cell || "").trim());
  const headerRow = hasProvidedHeader ? headerRowOverride : (hasHeaderLikeValues ? firstRow : []);
  const dataRows = hasProvidedHeader ? rows : (hasHeaderLikeValues ? rows.slice(1) : rows);
  const headers = (headerRow || []).map(normalizeHeader);

  return dataRows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim()))
    .map((row, index) => {
      const maNV = String(getValueByHeader(headers, row, ["manv", "mav", "ma nv", "mã nv", "ma", "employee code", "macode", "manhanvien"]) || `NV${String(index + 1).padStart(3, "0")}`).trim();
      const hoTen = String(getValueByHeader(headers, row, ["hoten", "ho ten", "họ tên", "name", "ten", "tennhanvien"]) || "").trim();
      const boPhan = String(getValueByHeader(headers, row, ["bophan", "bo phan", "phòng ban", "department", "bộ phận", "bophan1"]) || "Sản xuất").trim();
      const chucVu = String(getValueByHeader(headers, row, ["chucvu", "chuc vu", "vị trí", "position", "vitri", "chucdanh", "chucvu1"]) || "Công nhân").trim();
      const sdt = String(getValueByHeader(headers, row, ["sdt", "so dien thoai", "điện thoại", "phone", "sodienthoai"]) || "").trim();
      const email = String(getValueByHeader(headers, row, ["email", "mail"]) || "").trim();
      const luongCung = parseNumber(getValueByHeader(headers, row, ["luongcung", "luong cung", "lương cứng", "luong cb", "lương cb", "luongcb", "luongcoban", "luongcoban"]))
      const ngayVao = String(getValueByHeader(headers, row, ["ngayvaolam", "ngay vao lam", "ngay vao", "ngày vào làm", "hire date", "ngayvaolam1"]) || "").trim();
      const trangThai = normalizeStatus(getValueByHeader(headers, row, ["trangthai", "trang thai", "status", "trangthai1"]));
      const ngaySinh = String(getValueByHeader(headers, row, ["ngaysinh", "ngày sinh", "birthday", "dob", "ngaysinh1"]) || "").trim();
      const gioiTinh = String(getValueByHeader(headers, row, ["gioitinh", "giới tính", "gender", "gioitinh1"]) || "").trim();
      const cccd = String(getValueByHeader(headers, row, ["cccd", "so cccd", "id card", "cmnd", "socccd", "cccd1"]) || "").trim();
      const diaChiTT = String(getValueByHeader(headers, row, ["diachithuongtru", "địa chỉ thường trú", "dia chi thuong tru", "address", "diachi", "diachithuongtru1"]) || "").trim();
      const diaChiTamTru = String(getValueByHeader(headers, row, ["diachitamtru", "địa chỉ tạm trú", "dia chi tam tru", "diachitamtru1"]) || "").trim();
      const bhxh = String(getValueByHeader(headers, row, ["bhxh", "số bhxh", "social insurance", "sobhxh", "bhxh1"]) || "").trim();
      const taiKhoan = String(getValueByHeader(headers, row, ["sotk", "so tai khoan", "tài khoản", "bank account", "taikhoan", "sotaikhoan", "sotk1"]) || "").trim();
      const nganHang = String(getValueByHeader(headers, row, ["nganhang", "bank", "ngân hàng", "nganhang1"]) || "").trim();
      const ghiChu = String(getValueByHeader(headers, row, ["ghichu", "ghi chú", "note", "notes", "ghichu1"]) || "").trim();
      const avatar = String(getValueByHeader(headers, row, ["avatar", "avatarurl", "avatar url", "anhdaidien", "ảnh đại diện", "photo", "picture", "anhdaidien1"]) || "").trim();
      const cccdFrontImage = String(getValueByHeader(headers, row, ["cccdfront", "cccd front", "cccd mat truoc", "cccd mặt trước", "cccdfrontimage", "anhcccdmattruoc", "ảnh cccd mặt trước", "anhcccdmattruoc", "anhcccd", "cccdfront1"]) || "").trim();
      const cccdBackImage = String(getValueByHeader(headers, row, ["cccdback", "cccd back", "cccd mat sau", "cccd mặt sau", "cccdbackimage", "anhcccdmatsau", "ảnh cccd mặt sau", "anhcccdmatsau", "cccdback1"]) || "").trim();

      return {
        stt: index + 1,
        maNV,
        hoTen,
        boPhan: boPhan || "Sản xuất",
        chucVu: chucVu || "Công nhân",
        sdt,
        email,
        luongCung,
        ngayVao: ngayVao || "",
        ngayVaoLam: ngayVao || "",
        trangThai,
        luongCB: luongCung,
        loaiLuong: "Thời gian + Sản phẩm",
        rating: 4,
        ngaySinh,
        gioiTinh,
        cccd,
        diaChiTT,
        diaChiTamTru,
        taiKhoan,
        nganHang,
        bhxh,
        ghiChu,
        avatar,
        cccdFrontImage,
        cccdBackImage,
      };
    });
}

module.exports = {
  mapCsvRowsToEmployees,
};
