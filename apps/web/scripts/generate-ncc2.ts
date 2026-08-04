import { NHA_CUNG_CAP, NCCS } from '../src/lib/data/real-data';
import * as fs from 'fs';

function safeStr(val: string | null | undefined): string {
    if (!val || val.trim() === '') return "'thiếu'";
    return `'${val.trim().replace(/'/g, "''")}'`;
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const rawText = fs.readFileSync('scripts/raw_doi_tac.txt', 'utf-8');
const lines = rawText.trim().split('\n');

let sql = `
-- CẬP NHẬT LẠI DỮ LIỆU NHÀ CUNG CẤP & ĐỐI TÁC GIA CÔNG MỚI NHẤT
-- Bảng nha_cung_cap gộp chung cho cả 2 loại

TRUNCATE TABLE nha_cung_cap RESTART IDENTITY CASCADE;

INSERT INTO nha_cung_cap (id, stt, ma_ncc, ten_ncc, loai, chuyen_mon, nguoi_lh, sdt, email, dia_chi, so_tai_khoan, ngan_hang, ma_so_thue, cccd, cccd_ngay_cap, trang_thai, ghi_chu) VALUES
`;

const values: string[] = [];
let stt = 1;

// 1. Từ raw_doi_tac.txt (Bỏ qua header)
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    // STT(0) Mã ĐT/NCC(1) Tên Đơn Vị/Cơ Sở(2) Người Liên Hệ(3) SĐT(4) Email(5) Địa Chỉ(6) Bộ Phận / Công Đoạn(7) Chức vụ(8) Số Tài Khoản(9) Ngân Hàng(10) Mã Số Thuế(11) Loại Đối Tượng(12) Trạng Thái(13) Ghi Chú(14)
    if (parts.length >= 13) {
        const ma = parts[1];
        const ten = parts[2];
        const nguoiLH = parts[3];
        const sdt = parts[4];
        const email = parts[5];
        const diaChi = parts[6];
        const chuyenMon = parts[7]; // Mảng data cũ để congDoan ở đây
        // Mảng cũ dùng Cong Doan thay cho Bo phan. Ví dụ 'In / Thêu / Dập'. Nhưng ở đây text là 'Sản xuất' cho tất cả.
        // Phải phân tích từ Mã NCC: GC-IN -> In / Thêu / Dập, GC-QUAN -> May quần, GC-TRON -> May áo tròn, GC-TRU -> May áo trụ
        let congDoan = 'Gia công';
        if (ma.includes('GC-IN')) congDoan = 'In / Thêu / Dập';
        if (ma.includes('GC-QUAN')) congDoan = 'May quần';
        if (ma.includes('GC-TRON')) congDoan = 'May áo tròn';
        if (ma.includes('GC-TRU')) congDoan = 'May áo trụ';

        const soTK = parts[9];
        const nganHang = parts[10];
        const mst = parts[11];
        const loaiDT = parts[12];
        const trangThai = parts[13] === 'dang_hop_tac' ? 'dang_hop_tac' : parts[13];
        const ghiChu = parts[14] || '';

        // Extract CCCD and Ngay Cap from Ghi Chu: "CCCD: 079188007153 | Cấp: 12/01/2022 | MST: ---"
        let cccd = 'thiếu';
        let ngayCap = 'thiếu';
        let mstReal = mst === '---' || !mst ? 'thiếu' : mst;

        if (ghiChu.includes('CCCD:')) {
            const mCccd = ghiChu.match(/CCCD:\s*([0-9]+)/);
            if (mCccd) cccd = mCccd[1];
            const mCap = ghiChu.match(/Cấp:\s*([0-9/]+)/);
            if (mCap) ngayCap = mCap[1];
            const mMst = ghiChu.match(/MST:\s*([0-9\-]+)/);
            if (mMst && mstReal === 'thiếu') mstReal = mMst[1];
        }

        values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ma)}, ${safeStr(ten)}, ${safeStr(loaiDT)}, ${safeStr(congDoan)}, ${safeStr(nguoiLH)}, ${safeStr(sdt)}, ${safeStr(email)}, ${safeStr(diaChi)}, ${safeStr(soTK)}, ${safeStr(nganHang)}, ${safeStr(mstReal)}, ${safeStr(cccd)}, ${safeStr(ngayCap)}, ${safeStr(trangThai)}, ${safeStr(ghiChu)})`);
    }
}

// 2. Nhà Cung Cấp (từ mảng NCCS)
for (const ncc of NCCS) {
    const ma = `NCC-${stt.toString().padStart(3, '0')}`;
    values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ma)}, ${safeStr(ncc.ten)}, 'nha_cung_cap_vai', ${safeStr(ncc.vaiTro)}, 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'dang_hop_tac', 'thiếu')`);
}

// 3. Nhà Cung Cấp (từ mảng NHA_CUNG_CAP cũ)
for (const ncc of NHA_CUNG_CAP) {
    const ma = ncc.maNCC; // Có sẵn
    values.push(`(${safeStr(generateUUID())}, ${stt++}, ${safeStr(ma)}, ${safeStr(ncc.tenDonVi)}, 'nha_cung_cap_vai', 'Vải/Phụ liệu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'thiếu', 'dang_hop_tac', 'thiếu')`);
}

sql += values.join(',\n') + ';';

fs.writeFileSync('CAP-NHAT-NHA-CUNG-CAP-V2.sql', sql);
console.log('Done writing CAP-NHAT-NHA-CUNG-CAP-V2.sql');
