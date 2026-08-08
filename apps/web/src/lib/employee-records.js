function normalizeEmployeeRecord(record) {
  return {
    ...record,
    id: record.id,
    stt: Number(record.stt || 0),
    maNV: record.ma_nv || record.maNV,
    hoTen: record.ho_ten || record.hoTen,
    boPhan: record.bo_phan || record.boPhan,
    chucVu: record.chuc_vu || record.chucVu,
    sdt: record.sdt,
    email: record.email,
    luongCung: Number(record.luong_cung || record.luongCung || 0),
    rating: Number(record.rating || 4),
    trangThai: record.trang_thai || record.trangThai || 'dang_lam',
    avatar: record.avatar_url || record.avatar,
    cccdFrontImage: record.cccd_front_url || record.cccdFrontImage,
    cccdBackImage: record.cccd_back_url || record.cccdBackImage,
    ngaySinh: record.ngay_sinh || record.ngaySinh,
    gioiTinh: record.gioi_tinh || record.gioiTinh,
    cccd: record.cccd,
    diaChiTT: record.dia_chi_tt || record.diaChiTT,
    diaChiTamTru: record.dia_chi_tam_tru || record.diaChiTamTru,
    ngayVao: record.ngay_vao || record.ngayVao,
    taiKhoan: record.tai_khoan || record.taiKhoan,
  };
}

function toSupabaseEmployeeRecord(payload) {
  return {
    id: payload.id,
    stt: Number(payload.stt || 0),
    ma_nv: payload.maNV,
    ho_ten: payload.hoTen,
    bo_phan: payload.boPhan,
    chuc_vu: payload.chucVu,
    sdt: payload.sdt,
    email: payload.email || null,
    luong_cung: Number(payload.luongCung || 0),
    rating: Math.round(Number(payload.rating || 4)),
    trang_thai: payload.trangThai || 'dang_lam',
    avatar_url: payload.avatar || null,
    cccd_front_url: payload.cccdFrontImage || null,
    cccd_back_url: payload.cccdBackImage || null,
    ngay_sinh: payload.ngaySinh || null,
    gioi_tinh: payload.gioiTinh || null,
    cccd: payload.cccd || null,
    dia_chi_tt: payload.diaChiTT || null,
    dia_chi_tam_tru: payload.diaChiTamTru || null,
    ngay_vao: payload.ngayVao || null,
    tai_khoan: payload.taiKhoan || null,
  };
}

module.exports = {
  normalizeEmployeeRecord,
  toSupabaseEmployeeRecord,
};
