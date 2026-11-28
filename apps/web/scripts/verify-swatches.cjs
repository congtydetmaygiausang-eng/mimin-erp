const path = require('path');
const { getFabricSwatchImage, VAI_28_SWATCH_MAP } = require(path.resolve('apps/web/src/lib/fabric-swatches.ts'));

const testCases = [
  { sku: 'VAI-01', color: 'Trắng', expected: 'swatch_VAI-01.jpg' },
  { sku: 'VAI-02', color: 'XÁM TRẮNG', expected: 'swatch_VAI-02.jpg' },
  { sku: 'VAI-03', color: 'KEM', expected: 'swatch_VAI-03.jpg' },
  { sku: 'VAI-04', color: 'GỪNG 040', expected: 'swatch_VAI-04.jpg' },
  { sku: 'VAI-05', color: 'ĐẬU (BEIGE SW7036)', expected: 'swatch_VAI-05.jpg' },
  { sku: 'VAI-06', color: 'XÁM 005', expected: 'swatch_VAI-06.jpg' },
  { sku: 'VAI-07', color: 'BÒ 027', expected: 'swatch_VAI-07.jpg' },
  { sku: 'VAI-08', color: 'RÊU', expected: 'swatch_VAI-08.jpg' },
  { sku: 'VAI-09', color: 'RÊU 036', expected: 'swatch_VAI-09.jpg' },
  { sku: 'VAI-10', color: 'XÁM CHÌ 035', expected: 'swatch_VAI-10.jpg' },
  { sku: 'VAI-11', color: 'CỔ VỊT 012', expected: 'swatch_VAI-11.jpg' },
  { sku: 'VAI-12', color: 'XANH ĐEN CM', expected: 'swatch_VAI-12.jpg' },
  { sku: 'VAI-13', color: 'ĐEN CM 030', expected: 'swatch_VAI-13.jpg' },
  { sku: 'VAI-14', color: 'ĐEN THƯỜNG', expected: 'swatch_VAI-14.jpg' },
  { sku: 'VAI-15', color: 'XANH ĐEN THƯỜNG', expected: 'swatch_VAI-15.jpg' },
  { sku: 'VAI-16', color: 'XANH ĐÁ 08', expected: 'swatch_VAI-16.jpg' },
  { sku: 'VAI-17', color: 'CÀ PHÊ', expected: 'swatch_VAI-17.jpg' },
  { sku: 'VAI-18', color: 'CỎ ÚA 044', expected: 'swatch_VAI-18.jpg' },
  { sku: 'VAI-19', color: 'XÁM LỢT 06', expected: 'swatch_VAI-19.jpg' },
  { sku: 'VAI-20', color: 'XÁM CHÌ 066', expected: 'swatch_VAI-20.jpg' },
  { sku: 'VAI-21', color: 'Ca Cao', expected: 'swatch_VAI-21.jpg' },
  { sku: 'VAI-22', color: 'BÒ 068', expected: 'swatch_VAI-22.jpg' },
  { sku: 'VAI-23', color: 'XANH NHỚT 069', expected: 'swatch_VAI-23.jpg' },
  { sku: 'VAI-24', color: 'KEM VÀNG', expected: 'swatch_VAI-24.jpg' },
  { sku: 'VAI-25', color: 'XÁM NHẠT', expected: 'swatch_VAI-25.jpg' },
  { sku: 'VAI-26', color: 'NÂU 11', expected: 'swatch_VAI-26.jpg' },
  { sku: 'VAI-27', color: 'Trắng · Bột 100', expected: 'swatch_VAI-27.jpg' },
  { sku: 'VAI-28', color: 'Trắng In', expected: 'swatch_VAI-28.jpg' },
];

let allPassed = true;
testCases.forEach((tc, idx) => {
  const resultBySku = getFabricSwatchImage(tc.color, tc.sku);
  const resultByColor = getFabricSwatchImage(tc.color);
  const matchSku = resultBySku.includes(tc.expected);
  const matchColor = resultByColor.includes(tc.expected);
  if (!matchSku || !matchColor) {
    allPassed = false;
    console.error(`❌ Case ${tc.sku} (${tc.color}): SkuMatch=${matchSku}, ColorMatch=${matchColor}. Got: ${resultBySku}`);
  } else {
    console.log(`✅ Case ${tc.sku} (${tc.color}) -> ${tc.expected}`);
  }
});

if (allPassed) {
  console.log('🎉 TẤT CẢ 28 MÃ VẢI ĐỀU KHỚP CHÍNH XÁC 100% VỚI ẢNH SWATCH IN TÊN MÀU!');
} else {
  process.exit(1);
}
