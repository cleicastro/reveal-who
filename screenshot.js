import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.log('PAGE ERROR CAUGHT:', err.stack);
  });
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));
  
  if (errors.length > 0) {
    console.log('ERRORS FOUND:');
    errors.forEach((e, i) => console.log(`  ${i+1}. ${e}`));
  }
  
  // Try to check if game is running
  const gameState = await page.evaluate(() => {
    return {
      hasPhaser: typeof window.Phaser !== 'undefined',
      hasGAME: typeof window.GAME !== 'undefined',
      gameExists: window.GAME ? true : false
    };
  });
  console.log('GAME STATE:', gameState);
  
  await page.screenshot({ path: '/tmp/game.png' });
  console.log('✅ Screenshot saved');
  await browser.close();
})();
