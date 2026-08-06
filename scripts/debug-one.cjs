// Debug 1 route - dashboard
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

  const consoleMsgs = [];
  page.on("console", (msg) => {
    consoleMsgs.push({ type: msg.type(), text: msg.text().slice(0, 200) });
  });
  page.on("pageerror", (e) => {
    consoleMsgs.push({ type: "pageerror", text: e.message.slice(0, 200) });
  });

  try {
    console.log("Login...");
    await page.goto("https://mimin-erp.vercel.app/login", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (b) b.click();
    });
    await new Promise((r) => setTimeout(r, 4000));

    console.log("Go to dashboard...");
    await page.goto("https://mimin-erp.vercel.app/dashboard", { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 2000));

    const check = await page.evaluate(() => {
      const body = document.body;
      const text = body ? body.textContent || "" : "";
      const hasErrorBoundary = /\bCó lỗi xảy ra\b/.test(text) && /\bThu lại\b/.test(text);
      const titleIs404 = document.title === "404: This page could not be found.";
      const has404Content = text.includes("This page could not be found");
      const has500 = text.includes("Application error") || text.includes("Internal Server Error");
      const hasReactErrorOverlay = !!document.querySelector("nextjs-portal") || !!document.querySelector("[data-nextjs-dialog]");
      return {
        textLength: text.length,
        hasErrorBoundary,
        titleIs404,
        has404Content,
        has500,
        hasReactErrorOverlay,
        hasError: hasErrorBoundary || titleIs404 || has404Content || has500 || hasReactErrorOverlay,
        bodyText: text.slice(0, 500),
      };
    });

    console.log("\n=== CHECK ===");
    console.log("Text length:", check.textLength);
    console.log("hasError:", check.hasError);
    console.log("hasErrorBoundary:", check.hasErrorBoundary);
    console.log("titleIs404:", check.titleIs404);
    console.log("has404Content:", check.has404Content);
    console.log("has500:", check.has500);
    console.log("hasReactErrorOverlay:", check.hasReactErrorOverlay);
    console.log("Body text first 500 chars:", check.bodyText);

    console.log("\n=== CONSOLE MESSAGES ===");
    consoleMsgs.slice(0, 10).forEach((m) => console.log(`[${m.type}] ${m.text}`));
  } catch (e) {
    console.error("Err:", e.message);
  } finally {
    await browser.close();
  }
})();
