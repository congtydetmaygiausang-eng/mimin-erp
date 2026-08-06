// AUDIT FULL: Test 35+ routes + capture console errors + screenshots
// Usage: node scripts/audit-full.cjs

const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require("fs");

const SHOTS = path.join(__dirname, "..", "audit-shots");
if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

const REPORT = path.join(__dirname, "..", "audit-report.json");

// 35+ routes quan trong nhat
const ROUTES = [
  // Tổng Quan
  { group: "Tong-Quan", path: "dashboard" },
  { group: "Tong-Quan", path: "bang-dieu-hanh-sx" },
  { group: "Tong-Quan", path: "realtime" },
  { group: "Tong-Quan", path: "canh-bao" },
  // Sản Xuất
  { group: "San-Xuat", path: "ke-hoach-san-xuat" },
  { group: "San-Xuat", path: "lenh-cat" },
  { group: "San-Xuat", path: "may" },
  { group: "San-Xuat", path: "hoan-thien" },
  { group: "San-Xuat", path: "qc" },
  { group: "San-Xuat", path: "gia-cong-ngoai" },
  { group: "San-Xuat", path: "lsx-m758-demo" },
  { group: "San-Xuat", path: "ban-giao-hoan-thien" },
  // Kho
  { group: "Kho", path: "kho-vai-tinhmann" },
  { group: "Kho", path: "kho-phu-lieu" },
  { group: "Kho", path: "kho-thanh-pham" },
  { group: "Kho", path: "giao-hang" },
  { group: "Kho", path: "van-chuyen" },
  // Kế Toán
  { group: "Ke-Toan", path: "cham-cong" },
  { group: "Ke-Toan", path: "bang-luong" },
  { group: "Ke-Toan", path: "doi-soat-tien-cong" },
  { group: "Ke-Toan", path: "cong-no" },
  { group: "Ke-Toan", path: "don-hang" },
  // Danh Mục
  { group: "Danh-Muc", path: "danh-muc-sp" },
  { group: "Danh-Muc", path: "nhan-su" },
  { group: "Danh-Muc", path: "khach-hang" },
  { group: "Danh-Muc", path: "nha-cung-cap" },
  { group: "Danh-Muc", path: "doi-tac-gia-cong" },
  { group: "Danh-Muc", path: "cong-nhan-gia-cong" },
  { group: "Danh-Muc", path: "master-data" },
  // Hệ Thống
  { group: "He-Thong", path: "quan-ly-tai-khoan" },
  { group: "He-Thong", path: "phan-quyen-tuy-chinh" },
  { group: "He-Thong", path: "ai-assistant" },
  { group: "He-Thong", path: "agents" },
  { group: "He-Thong", path: "audit-log" },
  { group: "He-Thong", path: "cai-dat" },
  { group: "He-Thong", path: "backup-restore" },
  // Test
  { group: "Test", path: "test-kiem-thu" },
  { group: "Test", path: "supabase-status" },
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
  page.setDefaultTimeout(45000);

  const report = { routes: [], summary: { total: 0, ok: 0, fail: 0, warn: 0, totalErrors: 0 } };

  const log = (m) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${m}`);

  // Capture console errors per route
  let currentErrors = [];
  const errorHandler = (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon") && !text.includes("404")) {
        currentErrors.push(text.slice(0, 200));
      }
    }
  };
  page.on("console", errorHandler);
  page.on("pageerror", (e) => currentErrors.push("PAGEERROR: " + e.message.slice(0, 200)));

  try {
    // Login
    log("Login...");
    await page.goto("https://mimin-erp.vercel.app/login", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    const loginOk = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((b) => /Anh Sang.*ADMIN/i.test(b.textContent || ""));
      if (b) { b.click(); return true; }
      return false;
    });
    if (!loginOk) {
      log("❌ Login failed");
      await browser.close();
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 4000));
    log("✓ Logged in");

    // Test each route
    for (const route of ROUTES) {
      currentErrors = [];
      const url = `https://mimin-erp.vercel.app/${route.path}?_=${Date.now()}`;
      log(`Testing /${route.path}...`);

      const startTime = Date.now();
      let status = "ok";
      let errorMsg = "";
      let hasError = false;
      let hasContent = false;

      try {
        const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const httpStatus = resp ? resp.status() : 0;
        await new Promise((r) => setTimeout(r, 1500));

        // Check content
        const contentCheck = await page.evaluate(() => {
          const body = document.body;
          const text = body ? body.textContent || "" : "";
          // Strict check: must find "Có lỗi xảy ra" as standalone phrase
          const hasErrorBoundary = /\bCó lỗi xảy ra\b/.test(text) && /\bThu lại\b/.test(text);
          // Check 404 / 500 page - check title ONLY (body text may have URLs with 404/500)
          const titleIs404 = document.title === "404: This page could not be found.";
          const has500 = text.includes("Application error") || text.includes("Internal Server Error");
          // Check Next.js error overlay (dev mode)
          const hasReactErrorOverlay = !!document.querySelector('nextjs-portal') ||
            !!document.querySelector('[data-nextjs-dialog]') ||
            !!document.querySelector('nextjs-error-overlay');
          return {
            hasError: hasErrorBoundary || titleIs404 || has500 || hasReactErrorOverlay,
            hasContent: text.length > 200,
            textLength: text.length,
            title: document.title,
            hasErrorBoundary,
            has404: titleIs404,
            has500,
            hasReactErrorOverlay,
          };
        });

        if (httpStatus >= 400) {
          status = "fail";
          errorMsg = `HTTP ${httpStatus}`;
        } else if (contentCheck.hasError) {
          status = "fail";
          errorMsg = "Render error";
          hasError = true;
        } else if (!contentCheck.hasContent) {
          status = "warn";
          errorMsg = "Empty content";
        } else if (currentErrors.length > 0) {
          status = "warn";
          errorMsg = `${currentErrors.length} console error(s)`;
        }

        hasContent = contentCheck.hasContent;

        // Screenshot
        await page.screenshot({
          path: path.join(SHOTS, `${route.path.replace(/\//g, "_")}.png`),
        });
      } catch (e) {
        status = "fail";
        errorMsg = e.message.slice(0, 100);
        log(`  ❌ ${errorMsg}`);
      }

      const duration = Date.now() - startTime;
      const routeReport = {
        group: route.group,
        path: route.path,
        status,
        duration,
        error: errorMsg,
        consoleErrors: currentErrors.slice(0, 5),
        consoleErrorCount: currentErrors.length,
      };
      report.routes.push(routeReport);
      report.summary.total++;
      if (status === "ok") report.summary.ok++;
      else if (status === "fail") report.summary.fail++;
      else report.summary.warn++;
      report.summary.totalErrors += currentErrors.length;

      const icon = status === "ok" ? "✓" : status === "fail" ? "❌" : "⚠";
      log(`  ${icon} ${status.toUpperCase()} (${duration}ms) ${errorMsg ? "- " + errorMsg : ""}`);
    }
  } catch (e) {
    log("FATAL: " + e.message);
  } finally {
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));
    log("");
    log("=== SUMMARY ===");
    log(`Total: ${report.summary.total}`);
    log(`OK: ${report.summary.ok}`);
    log(`Fail: ${report.summary.fail}`);
    log(`Warn: ${report.summary.warn}`);
    log(`Total console errors: ${report.summary.totalErrors}`);
    log(`Report saved: ${REPORT}`);
    log(`Screenshots: ${SHOTS}`);
    await browser.close();
  }
})();
