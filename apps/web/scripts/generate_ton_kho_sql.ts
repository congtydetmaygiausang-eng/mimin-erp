import * as fs from 'fs';

const rawText = fs.readFileSync('scripts/raw_bo_co.txt', 'utf-8');
const lines = rawText.trim().split('\n');

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function safeStr(val: string | null | undefined): string {
    if (!val || val.trim() === '') return "NULL";
    return `'${val.trim().replace(/'/g, "''")}'`;
}

let sql = `
-- CẬP NHẬT TỒN KHO ĐẦU KỲ CHO KHO NGUYÊN LIỆU (BO CỔ) VÀO BẢNG giao_dich_kho

-- Xóa các giao dịch nhập tồn đầu kỳ cũ của Bo Cổ (nếu có) để tránh bị nhân đôi số lượng
DELETE FROM giao_dich_kho WHERE loai_kho = 'phu-lieu' AND ghi_chu = 'Tồn kho đầu kỳ (chuẩn hóa)';

INSERT INTO giao_dich_kho (id, ngay, ma_vt, ten_vt, loai_kho, loai, so_luong, don_gia, thanh_tien, don_vi, nguoi_thuc_hien, ghi_chu) VALUES
`;

const values: string[] = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length >= 8) {
        const maVT = parts[0].trim();
        const tenVT = parts[1].trim();
        const loai = parts[2].trim();
        const dvt = parts[3].trim();
        const soLuong = parseFloat(parts[5].replace(/,/g, '')) || 0;
        const donGia = parseFloat(parts[6].replace(/[^\d]/g, '')) || 0;
        const thanhTien = soLuong * donGia;

        // Only insert if there's actual stock
        if (soLuong > 0) {
            const ngay = new Date().toISOString(); // Current time for NgayNhap
            values.push(`(${safeStr(generateUUID())}, ${safeStr(ngay)}, ${safeStr(maVT)}, ${safeStr(tenVT)}, 'phu-lieu', 'NHAP', ${soLuong}, ${donGia}, ${thanhTien}, ${safeStr(dvt)}, 'Hệ thống', 'Tồn kho đầu kỳ (chuẩn hóa)')`);
        }
    }
}

if (values.length > 0) {
    sql += values.join(',\n') + ';';
} else {
    sql = '-- Không có mã nào có số lượng > 0 để cập nhật.';
}

fs.writeFileSync('CAP-NHAT-TON-KHO-BO-CO.sql', sql);
console.log('Done writing CAP-NHAT-TON-KHO-BO-CO.sql');
