// Screenshot danh-muc-sp sau redesign
const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  page.setDefaultTimeout(30000);
  try {
    console.log("Login...");
    await page.goto("https://mimin-erp.vercel.app/login?_=" + Date.now(), { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 4000));

    console.log("Go to danh-muc-sp...");
    await page.goto("https://mimin-erp.vercel.app/danh-muc-sp?_=" + Date.now(), { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2500));
    await page.screenshot({ path: "../audit-shots/danh-muc-sp-LIBRARY.png" });
    console.log("OK shot 1");

    // Scroll xuong xem them cards
    await page.evaluate(() => window.scrollTo(0, 600));
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: "../audit-shots/danh-muc-sp-LIBRARY-scroll.png" });
    console.log("OK shot 2");
  } catch (e) {
    console.error("Err:", e.message);
  } finally {
    await browser.close();
  }
})();
