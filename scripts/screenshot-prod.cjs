// Screenshot production mimin-erp.vercel.app
// Dùng Chrome có sẵn trên máy, không cần tải Chromium
// Mục đích: Verify UI thật (nút + bố cục) sau khi Vercel deploy

const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const PROD_URL = "https://mimin-erp.vercel.app";
const SHOTS_DIR = path.join(__dirname, "..", "screenshots");
const CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

(async () => {
  if (!fs.existsSync(SHOTS_DIR)) fs.mkdirSync(SHOTS_DIR, { recursive: true });

  // Tìm Chrome/Edge có sẵn
  let chromePath = null;
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) {
      chromePath = p;
      break;
    }
  }
  if (!chromePath) {
    console.error("❌ Không tìm thấy Chrome/Edge trên máy");
    process.exit(1);
  }
  console.log(`🔧 Dùng browser: ${chromePath}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();
  const log = (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);

  try {
    // 1) LOGIN PAGE
    log("1/8 Chụp /login (chưa login)");
    await page.goto(`${PROD_URL}/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: path.join(SHOTS_DIR, "01-login.png"), fullPage: false });
    log("   ✓ 01-login.png");

    // 2) LOGIN bằng quick login button "Anh Sang ADMIN" (form mặc định đã có sẵn sếp Sang)
    log("2/8 Click quick login 'Anh Sang ADMIN'");
    const quickLoginClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const target = buttons.find((b) => {
        const t = b.textContent || "";
        return /Anh Sang.*ADMIN|ADMIN.*Anh Sang/i.test(t);
      });
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    if (!quickLoginClicked) {
      log("   ⚠ Quick login button not found, fallback: type sang@mimin.vn");
      // Clear + type
      await page.click('input[type="email"]', { clickCount: 3 });
      await page.keyboard.press("Backspace");
      await page.type('input[type="email"]', "sang@mimin.vn", { delay: 30 });
      await page.type('input[type="password"]', "admin123", { delay: 30 });
      await page.click('button[type="submit"]');
    }
    log("   ✓ submitted, chờ 4s để redirect");
    await new Promise((r) => setTimeout(r, 4000));

    // 3) DASHBOARD / HOME
    log("3/8 Chụp dashboard sau login");
    await page.screenshot({ path: path.join(SHOTS_DIR, "02-dashboard.png"), fullPage: false });
    log("   ✓ 02-dashboard.png");

    // 4) DANH MUC SP - CYAN nền
    log("4/8 Chụp /danh-muc-sp (CYAN + horizontal card)");
    await page.goto(`${PROD_URL}/danh-muc-sp`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SHOTS_DIR, "03-danh-muc-sp.png"), fullPage: false });
    log("   ✓ 03-danh-muc-sp.png");

    // 4b) Scroll xuống xem các card khác
    await page.evaluate(() => window.scrollTo(0, 600));
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(SHOTS_DIR, "03b-danh-muc-sp-scroll.png"), fullPage: false });
    log("   ✓ 03b-danh-muc-sp-scroll.png");

    // 5) DON HANG
    log("5/8 Chụp /don-hang");
    await page.goto(`${PROD_URL}/don-hang`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SHOTS_DIR, "04-don-hang.png"), fullPage: false });
    log("   ✓ 04-don-hang.png");

    // 5b) Click "Tạo đơn hàng" để chụp modal
    log("5b/8 Click 'Tạo đơn hàng' → chụp modal");
    const taoDonHangClicked = await page.evaluate(() => {
      // Tìm nút có text "Tạo đơn" hoặc "Thêm đơn" hoặc "Tạo mới"
      const buttons = Array.from(document.querySelectorAll("button, a"));
      const target = buttons.find((b) => {
        const t = b.textContent || "";
        return /Tạo đơn|Thêm đơn|Tạo mới|\+ Đơn|Đơn mới/i.test(t);
      });
      if (target) {
        target.click();
        return target.textContent.trim();
      }
      return null;
    });
    if (taoDonHangClicked) {
      log(`   ✓ Clicked: ${taoDonHangClicked}`);
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(SHOTS_DIR, "05-don-hang-modal.png"), fullPage: false });
      log("   ✓ 05-don-hang-modal.png");

      // Click tab "Items" / "Sản phẩm" / tab 2
      const tab2Clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, [role='tab']"));
        const target = buttons.find((b) => {
          const t = b.textContent || "";
          return /Sản phẩm|Items|Hàng hóa|Chi tiết/i.test(t);
        });
        if (target) {
          target.click();
          return target.textContent.trim();
        }
        return null;
      });
      if (tab2Clicked) {
        log(`   ✓ Tab clicked: ${tab2Clicked}`);
        await new Promise((r) => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(SHOTS_DIR, "05b-don-hang-tab-items.png"), fullPage: false });
        log("   ✓ 05b-don-hang-tab-items.png");
      }

      // Đóng modal (ESC)
      await page.keyboard.press("Escape");
      await new Promise((r) => setTimeout(r, 800));
    } else {
      log("   ⚠ Không tìm thấy nút Tạo đơn hàng");
    }

    // 6) VAN CHUYEN
    log("6/8 Chụp /van-chuyen");
    await page.goto(`${PROD_URL}/van-chuyen`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(SHOTS_DIR, "06-van-chuyen.png"), fullPage: false });
    log("   ✓ 06-van-chuyen.png");

    // 7) LENH CAT
    log("7/8 Chụp /lenh-cat");
    await page.goto(`${PROD_URL}/lenh-cat`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(SHOTS_DIR, "07-lenh-cat.png"), fullPage: false });
    log("   ✓ 07-lenh-cat.png");

    // 8) FULL PAGE TOP NAV
    log("8/8 Chụp full home (top nav 2 hàng)");
    await page.goto(`${PROD_URL}/dashboard`, { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    // Chỉ chụp top portion để xem nav
    await page.screenshot({ path: path.join(SHOTS_DIR, "08-topnav.png"), fullPage: false, clip: { x: 0, y: 0, width: 1440, height: 280 } });
    log("   ✓ 08-topnav.png");

    log("");
    log("✅ Xong! Tất cả screenshots ở: " + SHOTS_DIR);
  } catch (e) {
    console.error("❌ Lỗi:", e.message);
    // Chụp page hiện tại để debug
    try {
      await page.screenshot({ path: path.join(SHOTS_DIR, "ERROR.png"), fullPage: false });
      log("📸 Saved ERROR.png");
    } catch {}
  } finally {
    await browser.close();
  }
})();
