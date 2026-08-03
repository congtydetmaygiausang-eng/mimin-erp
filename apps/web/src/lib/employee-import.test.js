const test = require('node:test');
const assert = require('node:assert/strict');
const { mapCsvRowsToEmployees } = require('./employee-import');

test('maps csv rows into employee records with normalized fields', () => {
  const rows = [
    ['STT', 'Mã NV', 'Họ tên', 'Bộ phận', 'Chức vụ', 'SĐT', 'Email', 'Lương cứng', 'Ngày vào làm', 'Trạng thái'],
    ['1', 'NV001', 'Nguyễn Thị A', 'Sản xuất', 'Tổ trưởng', '0901234567', 'a@mimin.vn', '8500000', '2024-01-01', 'dang_lam'],
  ];

  const employees = mapCsvRowsToEmployees(rows);

  assert.equal(employees.length, 1);
  assert.equal(employees[0].maNV, 'NV001');
  assert.equal(employees[0].hoTen, 'Nguyễn Thị A');
  assert.equal(employees[0].luongCung, 8500000);
  assert.equal(employees[0].trangThai, 'dang_lam');
});

test('maps avatar and cccd image headers from the real template', () => {
  const headerRow = ['STT', 'Mã NV', 'Họ tên', 'Vị trí', 'SĐT', 'Ảnh đại diện', 'Ảnh CCCD'];
  const dataRow = ['1', 'NV002', 'Trần Văn B', 'Cắt', '0901234567', 'https://cdn.example.com/avatar.jpg', 'https://cdn.example.com/cccd.jpg'];

  const employees = mapCsvRowsToEmployees([dataRow], headerRow);

  assert.equal(employees.length, 1);
  assert.equal(employees[0].avatar, 'https://cdn.example.com/avatar.jpg');
  assert.equal(employees[0].cccdFrontImage, 'https://cdn.example.com/cccd.jpg');
});
