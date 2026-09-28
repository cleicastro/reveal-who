import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  // Press S key to jump
  await page.keyboard.press('KeyS');
  console.log('Pressed S (jump)');
  
  await new Promise(r => setTimeout(r, 500));
  
  // Press A to run right
  await page.keyboard.down('KeyA');
  await page.keyboard.press('ArrowRight');
  console.log('Pressed Right Arrow + A (running)');
  
  await new Promise(r => setTimeout(r, 1500));
  await page.keyboard.up('KeyA');
  
  await page.screenshot({ path: '/tmp/game2.png' });
  console.log('✅ Screenshot after interaction');
  await browser.close();
})();
