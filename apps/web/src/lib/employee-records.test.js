const assert = require('assert');
const { normalizeEmployeeRecord, toSupabaseEmployeeRecord } = require('./employee-records');

const supabaseRecord = {
  stt: 1,
  ma_nv: 'NV001',
  ho_ten: 'Nguyễn Văn A',
  bo_phan: 'Sản xuất',
  chuc_vu: 'Công nhân',
  sdt: '0901234567',
  email: 'a@example.com',
  luong_cung: 9000000,
  rating: 4,
  trang_thai: 'dang_lam',
  avatar_url: 'https://example.com/a.png',
  cccd_front_url: 'https://example.com/f.png',
  cccd_back_url: 'https://example.com/b.png',
  ngay_sinh: '2001-01-01',
  gioi_tinh: 'Nam',
  cccd: '123456789',
  dia_chi_tt: 'HCM',
  dia_chi_tam_tru: 'Long An',
  ngay_vao: '2024-01-01',
  tai_khoan: '001',
};

const normalized = normalizeEmployeeRecord(supabaseRecord);
assert.strictEqual(normalized.maNV, 'NV001');
assert.strictEqual(normalized.hoTen, 'Nguyễn Văn A');
assert.strictEqual(normalized.avatar, 'https://example.com/a.png');
assert.strictEqual(normalized.cccdFrontImage, 'https://example.com/f.png');

const payload = {
  maNV: 'NV002',
  hoTen: 'Nguyễn Văn B',
  boPhan: 'Kho vận',
  chucVu: 'Thủ kho',
  sdt: '0912345678',
  email: 'b@example.com',
  luongCung: 8000000,
  rating: 5,
  trangThai: 'dang_lam',
  avatar: 'https://example.com/b.png',
  cccdFrontImage: 'https://example.com/f2.png',
  cccdBackImage: 'https://example.com/b2.png',
  ngaySinh: '2002-02-02',
  gioiTinh: 'Nữ',
  cccd: '987654321',
  diaChiTT: 'Đà Nẵng',
  diaChiTamTru: 'Quảng Nam',
  ngayVao: '2024-02-02',
  taiKhoan: '002',
};

const saved = toSupabaseEmployeeRecord(payload);
assert.strictEqual(saved.ma_nv, 'NV002');
assert.strictEqual(saved.ho_ten, 'Nguyễn Văn B');
assert.strictEqual(saved.luong_cung, 8000000);
assert.strictEqual(saved.avatar_url, 'https://example.com/b.png');

console.log('employee-records tests passed');
