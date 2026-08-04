import * as fs from 'fs';
import { KHO_VAI, KHO_VAT_TU } from '../src/lib/data/real-data';

function safeStr(val: string | null | undefined): string {
    if (!val || val.trim() === '') return "NULL";
    return `'${val.trim().replace(/'/g, "''")}'`;
}

let sql = `
-- CẬP NHẬT 100+ MÃ VẬT TƯ VÀO BẢNG vat_tu (MASTER DATA)
-- Chạy ĐOẠN NÀY SAU KHI ĐÃ TẠO BẢNG vat_tu

DELETE FROM vat_tu; -- Làm sạch nếu lỡ chạy nhiều lần

INSERT INTO vat_tu (ma_vt, ten_vt, loai_vat_tu, don_vi_tinh, don_gia_mac_dinh, mau_sac, ghi_chu) VALUES
`;

const values: string[] = [];

// Xử lý kho vải
for (const vt of KHO_VAI) {
    values.push(`(${safeStr(vt.maVT)}, ${safeStr(vt.tenVT)}, 'vai', ${safeStr(vt.dvt)}, ${vt.donGia || 0}, ${safeStr(vt.mauSac)}, ${safeStr(vt.ghiChu)})`);
}

// Xử lý kho phụ liệu
for (const vt of KHO_VAT_TU) {
    values.push(`(${safeStr(vt.maVT)}, ${safeStr(vt.tenVT)}, 'phu-lieu', ${safeStr(vt.dvt)}, ${vt.donGia || 0}, ${safeStr(vt.mauSac)}, ${safeStr(vt.ghiChu)})`);
}

sql += values.join(',\n') + ';';

fs.writeFileSync('NAP-DU-LIEU-GOC-VAT-TU.sql', sql);
console.log('Done writing NAP-DU-LIEU-GOC-VAT-TU.sql');
