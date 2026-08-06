// Screenshot 10 modules sau redesign teal/cyan
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOTS = path.join(__dirname, "..", "screenshots-redesign");
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const MODULES = [
  { name: "khach-hang", url: "/khach-hang" },
  { name: "nha-cung-cap", url: "/nha-cung-cap" },
  { name: "nhan-su", url: "/nhan-su" },
  { name: "kho-vai-tinhmann", url: "/kho-vai-tinhmann" },
  { name: "kho-phu-lieu", url: "/kho-phu-lieu" },
  { name: "lenh-cat", url: "/lenh-cat" },
  { name: "ke-hoach-san-xuat", url: "/ke-hoach-san-xuat" },
  { name: "cham-cong", url: "/cham-cong" },
  { name: "bang-luong", url: "/bang-luong" },
  { name: "doi-tac-gia-cong", url: "/doi-tac-gia-cong" },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.setDefaultTimeout(60000);

  const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

  try {
    // Login
    log("Login...");
    await page.goto("https://mimin-erp.vercel.app/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const t = buttons.find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (t) t.click();
    });
    await new Promise((r) => setTimeout(r, 4000));

    for (const m of MODULES) {
      log(`Screenshot ${m.name}...`);
      try {
        await page.goto(`https://mimin-erp.vercel.app${m.url}?_=${Date.now()}`, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        await new Promise((r) => setTimeout(r, 2500));
        await page.screenshot({
          path: path.join(SHOTS, `${m.name}.png`),
          fullPage: false,
        });
        log(`  ✓ ${m.name}.png`);
      } catch (e) {
        log(`  ❌ ${m.name}: ${e.message}`);
      }
    }

    log("\n✅ Done. Screenshots: " + SHOTS);
  } catch (e) {
    console.error("Fatal:", e.message);
  } finally {
    await browser.close();
  }
})();
