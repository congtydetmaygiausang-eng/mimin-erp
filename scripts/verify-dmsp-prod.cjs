// Verify danh-muc-sp hien thi 17 SP that tu Supabase (login first)
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'puppeteer-core'));

async function main() {
  console.log('=== Verify production: danh-muc-sp (with login) ===');
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push('PAGEERR: ' + err.message));

  // 1. Go to login page
  console.log('1. Navigate to login...');
  await page.goto('https://mimin-erp.vercel.app/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 2. Click "Anh Sang ADMIN" quick login button
  console.log('2. Click Anh Sang ADMIN quick login...');
  const sangBtn = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.includes('Anh Sang'));
    if (btn) {
      const rect = btn.getBoundingClientRect();
      return { x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
    }
    return null;
  });
  if (sangBtn) {
    await page.mouse.click(sangBtn.x, sangBtn.y);
    console.log('   Clicked at', sangBtn);
  } else {
    console.log('   ❌ No Anh Sang button found, try input email/password');
    await page.type('input[type="email"]', 'sang@mimin.vn');
    await page.type('input[type="password"]', 'sang123');
    await page.click('button[type="submit"]');
  }

  // 3. Wait for login
  console.log('3. Wait for login redirect...');
  await new Promise(r => setTimeout(r, 4000));
  const urlAfterLogin = page.url();
  console.log('   URL after login:', urlAfterLogin);

  // 4. Navigate to danh-muc-sp
  console.log('4. Navigate to /danh-muc-sp...');
  await page.goto('https://mimin-erp.vercel.app/danh-muc-sp', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  // 5. Take screenshot
  const shotPath = path.join(__dirname, '..', 'audit-shots', 'dmsp-real-data-1.png');
  await page.screenshot({ path: shotPath, fullPage: false });
  console.log('5. Screenshot 1:', shotPath);

  // 6. Count products
  const productCards = await page.evaluate(() => {
    const cards = document.querySelectorAll('.group.relative.bg-white.rounded-2xl');
    return cards.length;
  });
  console.log('6. Product cards:', productCards);

  // 7. Get header text
  const headerText = await page.$eval('h1', el => el.textContent);
  console.log('7. Header:', headerText.trim().substring(0, 100));

  // 8. Get first 5 product names
  const firstNames = await page.evaluate(() => {
    const cards = document.querySelectorAll('.group.relative.bg-white.rounded-2xl');
    return Array.from(cards).slice(0, 7).map(c => {
      const h3 = c.querySelector('h3');
      const idEl = c.querySelector('.font-mono');
      const id = idEl ? idEl.textContent.trim() : 'NO ID';
      const name = h3 ? h3.textContent.trim() : 'NO NAME';
      return `${id}: ${name.substring(0, 30)}`;
    });
  });
  console.log('8. First 7 SP:');
  firstNames.forEach(n => console.log('   -', n));

  // 9. Check Live badge
  const liveBadge = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('span'));
    const found = els.find(e => e.textContent.includes('Live data'));
    return found ? found.textContent.trim() : 'NOT FOUND';
  });
  console.log('9. Live badge:', liveBadge);

  // 10. Full page screenshot
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));
  const shotFull = path.join(__dirname, '..', 'audit-shots', 'dmsp-real-data-full.png');
  await page.screenshot({ path: shotFull, fullPage: true });
  console.log('10. Full screenshot:', shotFull);

  // 11. Scroll down
  await page.evaluate(() => window.scrollBy(0, 800));
  await new Promise(r => setTimeout(r, 800));
  const shot2 = path.join(__dirname, '..', 'audit-shots', 'dmsp-real-data-scroll.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('11. Scrolled screenshot:', shot2);

  console.log('\n=== Console errors (first 10) ===');
  console.log('Total:', consoleErrors.length);
  consoleErrors.slice(0, 10).forEach((e, i) => console.log(' -', i+1, ':', e.substring(0, 180)));

  await browser.close();
  console.log('\n✅ Done');
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
