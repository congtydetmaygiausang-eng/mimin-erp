// Tao 5 anh PNG placeholder cho 5 personas V6 moi
// PNG 1x1 pixel mau khac nhau de khac biet
const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Minimal PNG 1x1 pixel (transparent)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const personas = ['minh', 'ha', 'lan', 'vy', 'mimin-help'];

for (const name of personas) {
  const filePath = path.join(avatarsDir, `${name}.png`);
  fs.writeFileSync(filePath, Buffer.from(pngBase64, 'base64'));
  console.log(`✅ Created ${filePath}`);
}
console.log('Done!');
