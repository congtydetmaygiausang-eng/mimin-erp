// Click "Tạo đơn hàng" → chụp modal 4 tabs
const puppeteer = require("puppeteer-core");
const path = require("path");

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

  try {
    console.log("[1] Login...");
    await page.goto("https://mimin-erp.vercel.app/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const t = buttons.find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (t) t.click();
    });
    await new Promise((r) => setTimeout(r, 4000));

    console.log("[2] Go to /don-hang...");
    await page.goto("https://mimin-erp.vercel.app/don-hang?_=" + Date.now(), { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    console.log("[3] Click 'Tạo đơn hàng'...");
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const t = buttons.find((b) => {
        const txt = b.textContent || "";
        return /Tạo đơn hàng|Thêm đơn|Thêm mới|\+ Đơn/.test(txt);
      });
      if (t) { t.click(); return t.textContent.trim(); }
      return null;
    });
    console.log("    Clicked:", clicked);
    if (!clicked) { console.log("FAIL: button not found"); process.exit(1); }

    await new Promise((r) => setTimeout(r, 2500));

    // Screenshot tab 1 (Info)
    await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "10-modal-tab1-info.png") });
    console.log("[4] Screenshot tab 1 (Info)");

    // Click tab "Sản phẩm" / "Items"
    const tab2 = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='tab']"));
      const t = buttons.find((b) => {
        const txt = (b.textContent || "").trim();
        return /Sản phẩm|Items|Hàng hóa|Chi tiết/.test(txt);
      });
      if (t) { t.click(); return t.textContent.trim(); }
      return null;
    });
    console.log("    Tab 2 clicked:", tab2);
    if (tab2) {
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "11-modal-tab2-items.png") });
      console.log("[5] Screenshot tab 2 (Items)");
    }

    // Click tab "Thanh toán" / "Payment"
    const tab3 = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='tab']"));
      const t = buttons.find((b) => {
        const txt = (b.textContent || "").trim();
        return /Thanh toán|Payment/.test(txt);
      });
      if (t) { t.click(); return t.textContent.trim(); }
      return null;
    });
    console.log("    Tab 3 clicked:", tab3);
    if (tab3) {
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "12-modal-tab3-payment.png") });
      console.log("[6] Screenshot tab 3 (Payment)");
    }

    // Click tab "Vận chuyển" / "Shipping"
    const tab4 = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button, [role='tab']"));
      const t = buttons.find((b) => {
        const txt = (b.textContent || "").trim();
        return /Vận chuyển|Shipping|Giao hàng/.test(txt);
      });
      if (t) { t.click(); return t.textContent.trim(); }
      return null;
    });
    console.log("    Tab 4 clicked:", tab4);
    if (tab4) {
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "13-modal-tab4-shipping.png") });
      console.log("[7] Screenshot tab 4 (Shipping)");
    }

    console.log("\n✅ Done");
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await browser.close();
  }
})();
