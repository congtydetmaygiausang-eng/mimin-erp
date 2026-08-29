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
  
  await page.screenshot({path: 'C:/Users/POLOMIMIN/.gemini/antigravity-ide/brain/658138e4-1d8d-4352-8960-fe30bc647132/mobile_screenshot.png'});
  await browser.close();
  console.log('Screenshot saved!');
})();
