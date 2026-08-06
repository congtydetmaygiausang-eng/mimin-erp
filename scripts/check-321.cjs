// Check React #321 chi tiết
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

  // Catch console errors
  const errors = [];
  page.on("pageerror", (err) => errors.push("PAGEERROR: " + err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push("CONSOLE: " + msg.text().slice(0, 500));
  });

  try {
    // Login first
    console.log("[1] Login...");
    await page.goto("https://mimin-erp.vercel.app/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const t = buttons.find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (t) { t.click(); return true; }
      return false;
    });
    if (clicked) {
      await new Promise((r) => setTimeout(r, 4000));
    }

    // Go to /don-hang
    console.log("[2] Go to /don-hang (no cache)...");
    await page.goto("https://mimin-erp.vercel.app/don-hang?_=" + Date.now(), { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 3000));

    // Check current state
    const hasError = await page.evaluate(() => {
      return document.body.textContent.includes("Maximum update depth") ||
             document.body.textContent.includes("Co loi xay ra") ||
             document.body.textContent.includes("React error #321");
    });
    console.log("[3] Has error on don-hang:", hasError);

    // Save screenshot
    await page.screenshot({ path: path.join(__dirname, "..", "screenshots", "09-don-hang-nocache.png") });
    console.log("[4] Screenshot saved");

    // Print errors
    if (errors.length) {
      console.log("\n=== ERRORS ===");
      errors.slice(0, 5).forEach((e) => console.log(e));
    } else {
      console.log("\nNo errors caught");
    }

    // Get HTML to see what's rendered
    const html = await page.content();
    const hasModal = html.includes("Tạo đơn hàng");
    const hasErrorDiv = html.includes("error") || html.includes("Error");
    console.log("\nHas 'Tạo đơn hàng' text:", hasModal);
    console.log("Has 'error' in HTML:", hasErrorDiv);
  } catch (e) {
    console.error("Failed:", e.message);
  } finally {
    await browser.close();
  }
})();
