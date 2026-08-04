import * as fs from 'fs';

const rawText = fs.readFileSync('scripts/raw_bo_co.txt', 'utf-8');
const lines = rawText.trim().split('\n');

const vatTuList = [];

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
        const ghiChu = parts[8] ? parts[8].trim() : '';

        // Derive color from name
        let mauSac = '';
        if (tenVT.includes('-')) {
            mauSac = tenVT.split('-')[1].trim();
            if (mauSac.includes('(')) mauSac = mauSac.split('(')[0].trim();
            if (mauSac.match(/^\d/)) mauSac = "(Theo mã số)";
        } else {
            mauSac = "(Nhiều màu)";
        }

        vatTuList.push(`  { maVT: "${maVT}", tenVT: "${tenVT}", loai: "${loai}", dvt: "${dvt}", donGia: ${donGia}, tonKho: ${soLuong}, tonToiThieu: 0.0, kho: "Kho phụ liệu", mauSac: "${mauSac}", ghiChu: "${ghiChu}", soCayNhap: 0.0, tonCay: 0.0 }`);
    }
}

const vatTuCode = `export const KHO_VAT_TU: KhoVatTu[] = [\n${vatTuList.join(',\n')}\n];`;

// Replace in real-data.ts
const realDataPath = './src/lib/data/real-data.ts';
let realData = fs.readFileSync(realDataPath, 'utf-8');

const regex = /export const KHO_VAT_TU: KhoVatTu\[\] = \[[\s\S]*?\];/;
realData = realData.replace(regex, vatTuCode);

fs.writeFileSync(realDataPath, realData);
console.log('Successfully updated KHO_VAT_TU in real-data.ts');
