// Extract dominant colors from 3 reference images
const path = require("path");
const fs = require("fs");

(async () => {
  let sharp;
  try {
    sharp = require("sharp");
  } catch (e) {
    console.log("❌ sharp not installed. Run: npm install sharp");
    process.exit(1);
  }

  const imgs = [
    { name: "img1-bang-luong", path: "C:\\Users\\POLOMIN\\.minimax\\v2\\assets\\2026\\08\\07\\00-08-44-217-asset_20260807-000844-217_bee38bcb2406_3e29eb9f-image.png" },
    { name: "img2-teal-bird", path: "C:\\Users\\POLOMIN\\.minimax\\v2\\assets\\2026\\08\\07\\00-08-44-224-asset_20260807-000844-224_229bc837567c_c2acafe8-1786013026447_136342507777004710_1278156472832285950_1927c65137ceaa62adea39adec23d59c.jpg" },
    { name: "img3-be-teal", path: "C:\\Users\\POLOMIN\\.minimax\\v2\\assets\\2026\\08\\07\\00-08-44-226-asset_20260807-000844-226_1a94efdda422_c04b6fa8-1786013026509_136342507777004710_1278156472832285950_277b21b7f627318656da9079b0445efd.jpg" },
  ];

  for (const img of imgs) {
    if (!fs.existsSync(img.path)) {
      console.log(`❌ ${img.name}: file not found`);
      continue;
    }
    try {
      const { data, info } = await sharp(img.path)
        .resize(100, 100, { fit: "cover" })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Collect pixel frequencies
      const colorCount = new Map();
      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Quantize to nearest 16 for grouping
        const qr = Math.round(r / 16) * 16;
        const qg = Math.round(g / 16) * 16;
        const qb = Math.round(b / 16) * 16;
        const key = `${qr},${qg},${qb}`;
        colorCount.set(key, (colorCount.get(key) || 0) + 1);
      }

      // Top 5 colors
      const sorted = Array.from(colorCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      console.log(`\n=== ${img.name} (${info.width}x${info.height} → ${100}x${100}) ===`);
      for (const [color, count] of sorted) {
        const [r, g, b] = color.split(",").map(Number);
        const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        const pct = ((count / (100 * 100)) * 100).toFixed(1);
        console.log(`  ${hex}  rgb(${r},${g},${b})  ${pct}%`);
      }
    } catch (e) {
      console.log(`❌ ${img.name}: ${e.message}`);
    }
  }
})();
