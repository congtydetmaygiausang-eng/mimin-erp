import * as fs from 'fs';
import { KHO_VAI } from '../src/lib/data/real-data';

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
-- CẬP NHẬT TỒN KHO ĐẦU KỲ CHO KHO VẢI VÀO BẢNG giao_dich_kho
-- Lấy dữ liệu 31 mã vải từ ứng dụng với số lượng tồn = 0

-- Xóa các giao dịch nhập tồn đầu kỳ cũ của Kho Vải (nếu có)
DELETE FROM giao_dich_kho WHERE loai_kho = 'vai' AND ghi_chu = 'Tồn kho đầu kỳ (từ app)';

INSERT INTO giao_dich_kho (id, ngay, ma_vt, ten_vt, loai_kho, loai, so_luong, don_gia, thanh_tien, don_vi, nguoi_thuc_hien, ghi_chu) VALUES
`;

const values: string[] = [];
const ngay = new Date().toISOString();

for (const vt of KHO_VAI) {
    // We insert 0 quantity to satisfy the user's request to "push it to Supabase" with inventory = 0
    values.push(`(${safeStr(generateUUID())}, ${safeStr(ngay)}, ${safeStr(vt.maVT)}, ${safeStr(vt.tenVT)}, 'vai', 'NHAP', 0, ${vt.donGia || 0}, 0, ${safeStr(vt.dvt)}, 'Hệ thống', 'Tồn kho đầu kỳ (từ app)')`);
}

sql += values.join(',\n') + ';';

fs.writeFileSync('CAP-NHAT-TON-KHO-VAI.sql', sql);
console.log('Done writing CAP-NHAT-TON-KHO-VAI.sql');
