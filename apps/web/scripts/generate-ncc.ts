import { DOI_TAC, NHA_CUNG_CAP, NCCS } from '../src/lib/data/real-data';
import * as fs from 'fs';

function safeStr(val: string | null | undefined): string {
    if (!val || val.trim() === '') return "'thiếu'";
    return `'${val.replace(/'/g, "''")}'`;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

let sql = `
-- CẬP NHẬT DỮ LIỆU NHÀ CUNG CẤP & ĐỐI TÁC GIA CÔNG
-- Bảng nha_cung_cap gộp chung cho cả 2 loại

TRUNCATE TABLE nha_cung_cap RESTART IDENTITY CASCADE;

INSERT INTO nha_cung_cap (id, stt, ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt, email, dia_chi, so_tai_khoan, ngan_hang, ma_so_thue, cccd, cccd_ngay_cap, trang_thai, ghi_chu) VALUES
`;

const values: string[] = [];
let stt = 1;

// 1. Đối Tác Gia Công
for (const dt of DOI_TAC) {
    if (dt.loaiDT === 'doi_tac_gia_cong') {
        let cccd = 'thiếu';
        if (dt.ghiChu && dt.ghiChu.includes('CCCD:')) {
            const match = dt.ghiChu.match(/CCCD:\s*([0-9\-]+)/);
            if (match) cccd = match[1];
        }
        
        const ma = dt.maDT || `GC-${stt.toString().padStart(3, '0')}`;
        
        values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ma)}, ${safeStr(dt.tenDonVi)}, 'doi_tac_gia_cong', ${safeStr(dt.congDoan)}, ${safeStr(dt.nguoiLH)}, ${safeStr(dt.sdt)}, ${safeStr(dt.email)}, ${safeStr(dt.diaChi)}, ${safeStr(dt.soTK)}, ${safeStr(dt.nganHang)}, ${safeStr(dt.mst)}, ${safeStr(cccd)}, 'thiếu', 'dang_hop_tac', ${safeStr(dt.ghiChu)})`);
    }
}

// 2. Nhà Cung Cấp (từ mảng NCCS)
for (const ncc of NCCS) {
    const ma = `NCC-${stt.toString().padStart(3, '0')}`;
    values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ma)}, ${safeStr(ncc.ten)}, 'nha_cung_cap_vai', ${safeStr(ncc.vaiTro)}, 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'dang_hop_tac', 'thiếu')`);
}

// 3. Nhà Cung Cấp (từ mảng NHA_CUNG_CAP cũ)
for (const ncc of NHA_CUNG_CAP) {
    values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ncc.maNCC)}, ${safeStr(ncc.tenDonVi)}, 'nha_cung_cap_vai', 'Vải/Phụ liệu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'dang_hop_tac', 'thiếu')`);
}

sql += values.join(',\n') + ';';

fs.writeFileSync('CAP-NHAT-NHA-CUNG-CAP.sql', sql);
console.log('Done writing CAP-NHAT-NHA-CUNG-CAP.sql');
