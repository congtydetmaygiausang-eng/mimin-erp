const https = require('https');
const fs = require('fs');
const path = require('path');

const SWATCH_STORAGE_BASE = "https://ejcuqyaiwabfygyesvxj.supabase.co/storage/v1/object/public/san-pham-media/kho-vai-moi";

// All files in kho-vai-moi from storage listing:
const files = [
  '1787667608399-1.jpg',
  '1787667634096-2.jpg',
  '1787667647921-3.jpg',
  '1787667716897-4.jpg',
  '1787667732196-5.jpg',
  '1787667751406-7.jpg',
  '1787667827426-8.jpg',
  '1787667846833-9.jpg',
  '1787667855944-10.jpg',
  '1787667872598-11.jpg',
  '1787667890927-12.jpg',
  '1787667909002-13.jpg',
  '1787667927218-14.jpg',
  '1787667945911-15.jpg',
  '1787667961251-16.jpg',
  '1787667984772-17.jpg',
  '1787668009474-18.jpg'
];

const dir = path.join(__dirname, 'swatches');
if (!fs.existsSync(dir)) fs.mkdirSync(dir);

let pending = files.length;
files.forEach((file, index) => {
  const url = `${SWATCH_STORAGE_BASE}/${file}`;
  https.get(url, (res) => {
    const data = [];
    res.on('data', c => data.push(c));
    res.on('end', () => {
      const outPath = path.join(dir, `swatch_${index + 1}_${file}`);
      fs.writeFileSync(outPath, Buffer.concat(data));
      console.log(`Downloaded ${index + 1}: ${file}`);
      pending--;
      if (pending === 0) console.log('ALL DOWNLOADED');
    });
  });
});
