// Verify Tab 4 (doi-tac-gia-cong) co section Cong no moi
const path = require('path');
const puppeteer = require(path.join(__dirname, '..', 'apps', 'web', 'node_modules', 'puppeteer-core'));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });

  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push('PAGEERR: ' + e.message));

  // Login
  await page.goto('https://mimin-erp.vercel.app/login', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const sang = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Anh Sang'));
    if (btn) { const r = btn.getBoundingClientRect(); return { x: r.x+r.width/2, y: r.y+r.height/2 }; }
  });
  if (sang) await page.mouse.click(sang.x, sang.y);
  await new Promise(r => setTimeout(r, 3000));

  // Tab 4 - doi-tac-gia-cong
  await page.goto('https://mimin-erp.vercel.app/doi-tac-gia-cong', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  const dtShot = path.join(__dirname, '..', 'audit-shots', 'verify-fk-doi-tac.png');
  await page.screenshot({ path: dtShot, fullPage: false });
  console.log('Screenshot Tab 4:', dtShot);

  // Count cards
  const dtCards = await page.evaluate(() => document.querySelectorAll('[class*="card"], tr').length);
  console.log('Cards/Rows:', dtCards);

  // Click first doi tac -> Detail
  const firstCard = await page.evaluate(() => {
    const card = document.querySelector('[class*="card"][onclick], tr[class*="cursor"]');
    if (card) { const r = card.getBoundingClientRect(); return { x: r.x+r.width/2, y: r.y+r.height/2 }; }
    return null;
  });
  if (firstCard) {
    await page.mouse.click(firstCard.x, firstCard.y);
    await new Promise(r => setTimeout(r, 1500));
    const detailShot = path.join(__dirname, '..', 'audit-shots', 'verify-fk-doi-tac-detail.png');
    await page.screenshot({ path: detailShot, fullPage: false });
    console.log('Detail screenshot:', detailShot);
  }

  // Close + go to Tab 3 NCC
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));
  await page.goto('https://mimin-erp.vercel.app/nha-cung-cap', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 3000));
  const nccShot = path.join(__dirname, '..', 'audit-shots', 'verify-fk-ncc.png');
  await page.screenshot({ path: nccShot, fullPage: false });
  console.log('Screenshot Tab 3:', nccShot);

  console.log('\n=== Errors:', errs.length);
  errs.slice(0, 5).forEach((e, i) => console.log(' -', i+1, ':', e.substring(0, 150)));

  await browser.close();
}
main().catch(e => { console.error('FATAL:', e); process.exit(1); });
