const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 375, height: 812});
  await page.goto('http://localhost:3000/lenh-cat', {waitUntil: 'networkidle0'});
  
  const btns = await page.$$('button');
  for (let btn of btns) {
     const text = await page.evaluate(el => el.innerText, btn);
     if (text && text.includes('Tạo')) {
        await btn.click();
        break;
     }
  }
  await new Promise(r => setTimeout(r, 2000));
  
  // Find all elements that are wider than 375px or are causing scroll
  const overflowingElements = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const elements = document.querySelectorAll('*');
    const results = [];
    for (let i = 0; i < elements.length; i++) {
       const el = elements[i];
       const rect = el.getBoundingClientRect();
       if (rect.width > 375 || rect.right > 375) {
          // ignore html, body, and the portal root itself if it's just 100%
          if (el.tagName !== 'HTML' && el.tagName !== 'BODY') {
             // Let's get a summary of the element
             const clone = el.cloneNode(false);
             results.push({
                tag: clone.outerHTML,
                width: rect.width,
                right: rect.right
             });
          }
       }
    }
    return results;
  });
  
  console.log(JSON.stringify(overflowingElements, null, 2));
  await browser.close();
})();
