import puppeteer from 'puppeteer-core';

const W = 1280, H = 720;

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H },
  headless: true,
});

const page = await browser.newPage();
await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
await new Promise(r => setTimeout(r, 9000));

// --- Tela normal ---
const normal = await page.evaluate(() => ({
  attrW: GAME.canvas.width, attrH: GAME.canvas.height,
  cssW: GAME.canvas.offsetWidth, cssH: GAME.canvas.offsetHeight,
  innerW: window.innerWidth, innerH: window.innerHeight,
}));
console.log(`Tela normal : attr=${normal.attrW}x${normal.attrH} | css=${normal.cssW}x${normal.cssH} | inner=${normal.innerW}x${normal.innerH}`);

// --- Simula fullscreenchange (innerWidth/Height mudam para tela cheia) ---
// Emula mudança de viewport para tamanho de tela cheia
await page.setViewport({ width: W, height: H });

const fs = await page.evaluate((SCALE) => {
  // Simula exatamente o que applyFullscreenScale faz
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  const w = Math.round(sw / SCALE);
  const h = Math.round(sh / SCALE);
  GAME.width = w; GAME.height = h;
  GAME.canvas.width = w; GAME.canvas.height = h;
  GAME.scale.width = w; GAME.scale.height = h;
  GAME.scale.setUserScale(SCALE, SCALE);
  GAME.renderer.resize(w, h);
  GAME.camera.setSize(w, h);
  GAME.camera.height = h;

  // Aguarda ScaleManager aplicar CSS
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = GAME.canvas;
    resolve({
      attrW: c.width, attrH: c.height,
      cssW: c.offsetWidth, cssH: c.offsetHeight,
      cssStyleW: c.style.width, cssStyleH: c.style.height,
      expectedW: sw, expectedH: sh,
    });
  })));
}, 2);

console.log(`Fullscreen  : attr=${fs.attrW}x${fs.attrH} | css=${fs.cssW}x${fs.cssH}`);
console.log(`            : style.width="${fs.cssStyleW}" style.height="${fs.cssStyleH}"`);
console.log(`            : esperado ${fs.expectedW}x${fs.expectedH}`);

// Usa style.width (sem border) em vez de offsetWidth
const fillsW = fs.cssStyleW === fs.expectedW + 'px';
const fillsH = fs.cssStyleH === fs.expectedH + 'px';
const noDistortion = Math.abs(fs.attrW / fs.attrH - fs.expectedW / fs.expectedH) < 0.02;

console.log(`            : preenche largura=${fillsW} | preenche altura=${fillsH} | sem distorção=${noDistortion}`);

// --- Restaura ---
const res = await page.evaluate(() => {
  const RESIZE_FACTOR = 2.1, SNES_HEIGHT = 324, SCALE = 2;
  const w = Math.round(window.innerWidth / RESIZE_FACTOR);
  const h = SNES_HEIGHT;
  GAME.width = w; GAME.height = h;
  GAME.canvas.width = w; GAME.canvas.height = h;
  GAME.scale.width = w; GAME.scale.height = h;
  GAME.scale.setUserScale(SCALE, SCALE);
  GAME.renderer.resize(w, h);
  GAME.camera.setSize(w, h);
  GAME.camera.height = h + 16;
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
    const c = GAME.canvas;
    resolve({ attrH: c.height, cssW: c.offsetWidth, cssH: c.offsetHeight });
  })));
});
console.log(`Restaurado  : attrH=${res.attrH} (esperado 324) | css=${res.cssW}x${res.cssH}`);

const ok = fillsW && fillsH && noDistortion && res.attrH === 324;
console.log(ok ? '\n✓ PASSOU' : '\n✗ FALHOU');

await browser.close();
