const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve('apps/web/node_modules/sharp'));
const { createClient } = require(path.resolve('apps/web/node_modules/@supabase/supabase-js'));

const envLocal = fs.readFileSync('.env.local', 'utf8');
const lines = envLocal.split('\n');
let serviceKey = '';
for (const line of lines) {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    serviceKey = line.replace('SUPABASE_SERVICE_ROLE_KEY=', '').trim().replace(/^["']|["']$/g, '');
  }
}
const supabaseUrl = 'https://ejcuqyaiwabfygyesvxj.supabase.co';
const supabase = createClient(supabaseUrl, serviceKey);

const SWATCHES_SRC = path.resolve('apps/web/scripts/swatches');
const PUBLIC_DIR = path.resolve('apps/web/public/swatches');
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// 17 Base textures mapped to source files
const BASES = {
  TRANG: path.join(SWATCHES_SRC, 'swatch_5_1787667732196-5.jpg'),
  XAM_LOT: path.join(SWATCHES_SRC, 'swatch_6_1787667751406-7.jpg'),
  KEM: path.join(SWATCHES_SRC, 'swatch_13_1787667927218-14.jpg'),
  GUNG: path.join(SWATCHES_SRC, 'swatch_14_1787667945911-15.jpg'),
  BEIGE: path.join(SWATCHES_SRC, 'swatch_7_1787667827426-8.jpg'),
  XAM_066: path.join(SWATCHES_SRC, 'swatch_11_1787667890927-12.jpg'),
  BO: path.join(SWATCHES_SRC, 'swatch_4_1787667716897-4.jpg'),
  REU: path.join(SWATCHES_SRC, 'swatch_15_1787667961251-16.jpg'),
  XAM_CHI: path.join(SWATCHES_SRC, 'swatch_12_1787667909002-13.jpg'),
  CO_VIT: path.join(SWATCHES_SRC, 'swatch_9_1787667855944-10.jpg'),
  XANH_DEN: path.join(SWATCHES_SRC, 'swatch_2_1787667634096-2.jpg'),
  DEN: path.join(SWATCHES_SRC, 'swatch_10_1787667872598-11.jpg'),
  XANH_BICH: path.join(SWATCHES_SRC, 'swatch_8_1787667846833-9.jpg'),
  CA_CAO: path.join(SWATCHES_SRC, 'swatch_1_1787667608399-1.jpg'),
  CO_UA: path.join(SWATCHES_SRC, 'swatch_3_1787667647921-3.jpg'),
  XANH_NHOT: path.join(SWATCHES_SRC, 'swatch_16_1787667984772-17.jpg'),
  XAM_81: path.join(SWATCHES_SRC, 'swatch_17_1787668009474-18.jpg'),
};

const FABRIC_SPECS = [
  { code: 'VAI-01', name: 'Trắng', title: 'TRẮNG', base: BASES.TRANG, light: true },
  { code: 'VAI-02', name: 'XÁM TRẮNG', title: 'XÁM TRẮNG', base: BASES.XAM_LOT, light: true },
  { code: 'VAI-03', name: 'KEM', title: 'KEM', base: BASES.KEM, light: true },
  { code: 'VAI-04', name: 'GỪNG 040', title: 'GỪNG 040', base: BASES.GUNG, light: false },
  { code: 'VAI-05', name: 'ĐẬU (BEIGE SW7036)', title: 'ĐẬU (BEIGE 7036)', base: BASES.BEIGE, light: false },
  { code: 'VAI-06', name: 'XÁM 005', title: 'XÁM 005', base: BASES.XAM_066, light: false },
  { code: 'VAI-07', name: 'BÒ 027', title: 'BÒ 027', base: BASES.BO, light: false },
  { code: 'VAI-08', name: 'RÊU', title: 'RÊU', base: BASES.REU, light: false },
  { code: 'VAI-09', name: 'RÊU 036', title: 'RÊU 036', base: BASES.REU, light: false },
  { code: 'VAI-10', name: 'XÁM CHÌ 035', title: 'XÁM CHÌ 035', base: BASES.XAM_CHI, light: false },
  { code: 'VAI-11', name: 'CỔ VỊT 012', title: 'CỔ VỊT 012', base: BASES.CO_VIT, light: false },
  { code: 'VAI-12', name: 'XANH ĐEN CM', title: 'XANH ĐEN CM', base: BASES.XANH_DEN, light: false },
  { code: 'VAI-13', name: 'ĐEN CM 030', title: 'ĐEN CM 030', base: BASES.DEN, light: false },
  { code: 'VAI-14', name: 'ĐEN THƯỜNG', title: 'ĐEN THƯỜNG', base: BASES.DEN, light: false },
  { code: 'VAI-15', name: 'XANH ĐEN THƯỜNG', title: 'XANH ĐEN THƯỜNG', base: BASES.XANH_DEN, light: false },
  { code: 'VAI-16', name: 'XANH ĐÁ 08', title: 'XANH ĐÁ 08', base: BASES.XANH_BICH, light: false },
  { code: 'VAI-17', name: 'CÀ PHÊ', title: 'CÀ PHÊ', base: BASES.CA_CAO, light: false },
  { code: 'VAI-18', name: 'CỎ ÚA 044', title: 'CỎ ÚA 044', base: BASES.CO_UA, light: false },
  { code: 'VAI-19', name: 'XÁM LỢT 06', title: 'XÁM LỢT 06', base: BASES.XAM_LOT, light: true },
  { code: 'VAI-20', name: 'XÁM CHÌ 066', title: 'XÁM CHÌ 066', base: BASES.XAM_066, light: false },
  { code: 'VAI-21', name: 'Ca Cao', title: 'CA CAO 063', base: BASES.CA_CAO, light: false },
  { code: 'VAI-22', name: 'BÒ 068', title: 'BÒ 068', base: BASES.BO, light: false },
  { code: 'VAI-23', name: 'XANH NHỚT 069', title: 'XANH NHỚT 069', base: BASES.XANH_NHOT, light: false },
  { code: 'VAI-24', name: 'KEM VÀNG', title: 'KEM VÀNG', base: BASES.GUNG, light: false },
  { code: 'VAI-25', name: 'XÁM NHẠT', title: 'XÁM NHẠT 81', base: BASES.XAM_81, light: false },
  { code: 'VAI-26', name: 'NÂU 11', title: 'NÂU 11', base: BASES.CA_CAO, light: false },
  { code: 'VAI-27', name: 'Trắng · Bột 100', title: 'TRẮNG BỘT 100', base: BASES.TRANG, light: true },
  { code: 'VAI-28', name: 'Trắng In', title: 'TRẮNG IN', base: BASES.TRANG, light: true },
  // Các mã mở rộng
  { code: 'VAI-31', name: 'XÁM XANH 111', title: 'XÁM XANH 111', base: BASES.XAM_CHI, light: false },
  { code: 'VAI-32', name: 'XÁM MÔN 109', title: 'XÁM MÔN 109', base: BASES.XAM_LOT, light: true },
  { code: 'VAI-33', name: 'ĐẬU XANH 114', title: 'ĐẬU XANH 114', base: BASES.XANH_NHOT, light: false },
  { code: 'VAI-34', name: 'ĐỎ 112', title: 'ĐỎ 112', base: BASES.CA_CAO, light: false },
  { code: 'VAI-38', name: '2DA ĐEN', title: '2DA ĐEN', base: BASES.DEN, light: false },
  { code: 'VAI-39', name: 'XANH BÍCH', title: 'XANH BÍCH', base: BASES.XANH_BICH, light: false },
  { code: 'VAI-40', name: 'XANH NGỌC', title: 'XANH NGỌC', base: BASES.CO_VIT, light: false },
  { code: 'VAI-41', name: '2DA RÊU', title: '2DA RÊU', base: BASES.REU, light: false },
  { code: 'VAI-42', name: '2DA NÂU ĐẤT', title: '2DA NÂU ĐẤT', base: BASES.CA_CAO, light: false },
  { code: 'VAI-43', name: '2DA XÁM CHÌ', title: '2DA XÁM CHÌ', base: BASES.XAM_CHI, light: false },
];

async function generateSwatch(spec) {
  const maskSvg = `
    <svg width="500" height="140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="20%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="80%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="500" height="140" fill="url(#fade)"/>
    </svg>
  `;
  const maskPng = await sharp(Buffer.from(maskSvg)).toFormat('png').toBuffer();

  const texturePatch = await sharp(spec.base)
    .extract({ left: 0, top: 35, width: 500, height: 140 })
    .toFormat('png')
    .toBuffer();

  const featheredPatch = await sharp(texturePatch)
    .composite([{ input: maskPng, blend: 'dest-in' }])
    .toFormat('png')
    .toBuffer();

  // Dynamic font sizing based on length
  const titleLen = spec.title.length;
  const fontSize = titleLen > 15 ? 24 : titleLen > 11 ? 27 : 33;
  const cardFill = spec.light ? '#0f172a' : '#000000';
  const cardOpacity = spec.light ? '0.45' : '0.30';
  const strokeOpacity = spec.light ? '0.35' : '0.25';

  const badgeSvg = `
    <svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000000" flood-opacity="0.7"/>
        </filter>
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      
      <rect x="40" y="185" width="420" height="130" rx="14" fill="${cardFill}" fill-opacity="${cardOpacity}" filter="url(#cardShadow)"/>
      <rect x="40" y="185" width="420" height="130" rx="14" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="${strokeOpacity}"/>

      <text x="250" y="213" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="700" letter-spacing="3" fill="#ffffff" filter="url(#shadow)" opacity="0.95">MÀU VẢI POLOMIN</text>
      <text x="250" y="258" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" letter-spacing="1" fill="#ffffff" filter="url(#shadow)">${spec.title}</text>
      <text x="250" y="284" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="600" letter-spacing="1.5" fill="#ffffff" filter="url(#shadow)" opacity="0.9">SỢI POLYESTER 96% + SPANDEX 4%</text>
      <text x="250" y="300" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="10.5" font-weight="600" letter-spacing="1.5" fill="#ffffff" filter="url(#shadow)" opacity="0.9">CO GIÃN 4 CHIỀU THOÁNG MÁT</text>
    </svg>
  `;

  const outputBuffer = await sharp(spec.base)
    .composite([
      { input: featheredPatch, top: 180, left: 0 },
      { input: Buffer.from(badgeSvg), top: 0, left: 0 }
    ])
    .jpeg({ quality: 95 })
    .toBuffer();

  return outputBuffer;
}

async function main() {
  console.log(`Bắt đầu tạo ${FABRIC_SPECS.length} ảnh Swatch chuẩn màu vải...`);
  const mapping = {};

  for (const spec of FABRIC_SPECS) {
    const buffer = await generateSwatch(spec);
    
    // 1. Lưu local trong apps/web/public/swatches/
    const localFileName = `${spec.code.toLowerCase()}.jpg`;
    const localPath = path.join(PUBLIC_DIR, localFileName);
    fs.writeFileSync(localPath, buffer);

    // 2. Upload lên Supabase Storage
    const storagePath = `kho-vai-moi/swatch_${spec.code}.jpg`;
    const { error } = await supabase.storage
      .from('san-pham-media')
      .upload(storagePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/san-pham-media/${storagePath}`;
    mapping[spec.code] = {
      name: spec.name,
      title: spec.title,
      supabaseUrl: publicUrl,
      localUrl: `/swatches/${localFileName}`
    };

    if (error) {
      console.error(`❌ [${spec.code}] Lỗi upload Supabase:`, error.message);
    } else {
      console.log(`✅ [${spec.code}] ${spec.title} -> ${publicUrl}`);
    }
  }

  // Ghi kết quả mapping ra file JSON để tham chiếu
  fs.writeFileSync(
    path.resolve('apps/web/scripts/swatch-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );
  console.log('Hoàn thành tất cả các swatch vải!');
}

main();
