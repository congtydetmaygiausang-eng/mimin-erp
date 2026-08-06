// Quick screenshot kho-vai + kho-phu-lieu
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
    console.log("Login...");
    await page.goto("https://mimin-erp.vercel.app/login?_=" + Date.now(), { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 4000));
    for (const m of ["kho-vai-tinhmann", "kho-phu-lieu"]) {
      console.log("Screenshot " + m);
      await page.goto("https://mimin-erp.vercel.app/" + m + "?_=" + Date.now(), { waitUntil: "networkidle2" });
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: path.join("screenshots-redesign", m + "-v2.png") });
      console.log("  ok");
    }
  } catch (e) { console.error("Err:", e.message); }
  await browser.close();
})();
