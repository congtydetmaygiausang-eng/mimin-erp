const fs = require('fs');
const path = require('path');

const targetDir = 'apps/web/public/product-models';
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy primary product image for each M code
const map = {
  'M01': 'image12.png', // M01 is similar or uses M02
  'M02': 'image12.png',
  'M03': 'image13.png',
  'M04': 'image14.png',
  'M05': 'image15.png',
  'M06': 'image16.png',
  'M07': 'image17.png',
  'M08': 'image10.png',
  'M09': 'image2.png',
  'M10': 'image1.png',
  'M11': 'image11.png',
  'M12': 'image3.png',
  'M13': 'image5.png',
  'M14': 'image6.png',
  'M15': 'image7.png',
  'M16': 'image4.png',
};

for (const [code, img] of Object.entries(map)) {
  const src = path.join('apps/web/public/excel_media/xl/media', img);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(targetDir, `${code}.png`));
    console.log(`Copied ${img} to ${code}.png`);
  } else {
    console.log(`Missing ${src}`);
  }
}
