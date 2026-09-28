import GAME from '../game';
import constants from './constants';
import frames from './frames';
import gamestate from './gamestate';

var collectibles = {};

var GROUND_TOP = constants.MAP_HEIGHT - 48; // 384
var CAUA_COLOR = '#33ccff';
var AYLA_COLOR = '#ff66cc';

// 5×4 pixel-art font for coin formations (row strings of '0'/'1').
var PIXEL_FONT = {
  'C': ['0111',
        '1000',
        '1000',
        '1000',
        '0111'],
  'A': ['0110',
        '1001',
        '1111',
        '1001',
        '1001'],
  'U': ['1001',
        '1001',
        '1001',
        '1001',
        '0110'],
  'Ã': ['1010',  // tilde accent row
        '0110',
        '1001',
        '1111',
        '1001',
        '1001'],
  'Y': ['1001',
        '1001',
        '0110',
        '0010',
        '0010'],
  'L': ['1000',
        '1000',
        '1000',
        '1000',
        '1111']
};

collectibles.init = function () {
  GAME.coins = GAME.add.group();
  GAME.coins.enableBody = true;
  GAME.letterObjs = [];
};

// --- coins ---------------------------------------------------------------

collectibles.createCoin = function (x, y) {
  var c = GAME.coins.create(x, y, 'items', frames.coin[0]);
  c.anchor.setTo(0.5, 0.5);
  c.body.allowGravity = false;
  c.body.immovable = true;
  c.animations.add('spin', frames.coin, 8, true);
  c.animations.play('spin');
  return c;
};

collectibles.createCoinRow = function (x, y, count, step) {
  step = step || 24;
  for (var i = 0; i < count; i++) collectibles.createCoin(x + i * step, y);
};

// Renders a single pixel-art letter as coins.
// stepX/stepY: pixel grid spacing (default 14px square).
collectibles.createCoinLetter = function (x, y, char, stepX, stepY) {
  stepX = stepX || 14;
  stepY = stepY || 14;
  var pattern = PIXEL_FONT[char];
  if (!pattern) return;
  for (var row = 0; row < pattern.length; row++) {
    var rowStr = pattern[row];
    for (var col = 0; col < rowStr.length; col++) {
      if (rowStr[col] === '1') {
        collectibles.createCoin(x + col * stepX, y + row * stepY);
      }
    }
  }
};

// --- letters -------------------------------------------------------------

collectibles.createLetter = function (x, y, char, nameKey, id, color) {
  var t = GAME.add.text(x, y, char, {
    font: 'bold 15px Arial',
    fill: color,
    stroke: '#000000',
    strokeThickness: 3
  });
  t.anchor.setTo(0.5, 0.5);
  GAME.physics.arcade.enable(t);
  t.body.allowGravity = false;
  t.body.immovable = true;
  t.letterChar = char;
  t.nameKey = nameKey;
  t.letterId = id;
  t._color = color;
  // gentle bob (kept so it can be stopped on collection)
  t._bob = GAME.add.tween(t).to({ y: y - 4 }, 600, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
  GAME.letterObjs.push(t);
  return t;
};

collectibles.createLevel1 = function () {
  // --- Coin pixel-art letters ---
  // CAUÃ across the intermediate area (x 1000–1320), base y so bottom row
  // sits ~28px above ground. Ã has 6 rows so use a taller base offset.
  var SX = 14, SY = 14; // grid step
  var LW = 4 * SX + 10; // letter width + gap = 66px
  var baseY = GROUND_TOP - 100;

  collectibles.createCoinLetter(200,       baseY, 'C', SX, SY);
  collectibles.createCoinLetter(200 + LW,  baseY, 'A', SX, SY);
  collectibles.createCoinLetter(200 + LW * 2, baseY, 'U', SX, SY);
  collectibles.createCoinLetter(200 + LW * 3, baseY, 'Ã', SX, SY);

  // AYLA across the advanced area (x 2480–2800)
  collectibles.createCoinLetter(2480,       baseY, 'A', SX, SY);
  collectibles.createCoinLetter(2480 + LW,  baseY, 'Y', SX, SY);
  collectibles.createCoinLetter(2480 + LW * 2, baseY, 'L', SX, SY);
  collectibles.createCoinLetter(2480 + LW * 3, baseY, 'A', SX, SY);

  // CAUÃ — spread across the intermediate area
  var caua = constants.NAME_CAUA;          // ['C','A','U','Ã']
  collectibles.createLetter(680, GROUND_TOP - 36, caua[0], 'CAUA', 'CAUA0', CAUA_COLOR);
  collectibles.createLetter(1450, GROUND_TOP - 96, caua[1], 'CAUA', 'CAUA1', CAUA_COLOR);
  collectibles.createLetter(1780, GROUND_TOP - 36, caua[2], 'CAUA', 'CAUA2', CAUA_COLOR);
  collectibles.createLetter(1980, GROUND_TOP - 72, caua[3], 'CAUA', 'CAUA3', CAUA_COLOR);

  // AYLA — spread across the advanced area
  var ayla = constants.NAME_AYLA;          // ['A','Y','L','A']
  collectibles.createLetter(2350, GROUND_TOP - 40, ayla[0], 'AYLA', 'AYLA0', AYLA_COLOR);
  collectibles.createLetter(2650, GROUND_TOP - 88, ayla[1], 'AYLA', 'AYLA1', AYLA_COLOR);
  collectibles.createLetter(3320, GROUND_TOP - 40, ayla[2], 'AYLA', 'AYLA2', AYLA_COLOR);
  collectibles.createLetter(3760, GROUND_TOP - 64, ayla[3], 'AYLA', 'AYLA3', AYLA_COLOR);
};

// --- update / collection -------------------------------------------------

collectibles.update = function () {
  if (gamestate.frozen() || !GAME.player || GAME.player.dead) return;

  if (GAME.coins) {
    GAME.physics.arcade.overlap(GAME.player, GAME.coins, collectibles._collectCoin);
  }
  if (GAME.letterObjs) {
    // iterate backwards so collected letters can be spliced out safely
    for (var i = GAME.letterObjs.length - 1; i >= 0; i--) {
      var t = GAME.letterObjs[i];
      if (t.exists) {
        GAME.physics.arcade.overlap(GAME.player, t, collectibles._collectLetter);
      }
    }
  }
};

collectibles._collectCoin = function (playerSprite, coin) {
  coin.kill();
  gamestate.collectCoin();
};

collectibles._collectLetter = function (playerSprite, t) {
  if (!t.exists) return;
  var completed = gamestate.collectLetter(t.nameKey, t.letterId);
  collectibles._letterPop(t.x, t.y, t._color);
  if (t._bob) t._bob.stop();
  var idx = GAME.letterObjs.indexOf(t);
  if (idx >= 0) GAME.letterObjs.splice(idx, 1);
  t.destroy();
  if (completed) {
    var label = (t.nameKey === 'CAUA') ? 'CAUÃ' : 'AYLA';
    collectibles.message(label + ' COMPLETO!  +' + constants.PTS_NAME_BONUS, t._color);
  }
};

// Small per-letter visual feedback: a floating "+points" that rises and fades.
collectibles._letterPop = function (x, y, color) {
  var t = GAME.add.text(x, y, '+' + constants.PTS_LETTER, {
    font: 'bold 10px Arial', fill: color, stroke: '#000000', strokeThickness: 3
  });
  t.anchor.setTo(0.5, 1);
  GAME.add.tween(t).to({ y: y - 26 }, 550, Phaser.Easing.Quadratic.Out, true);
  GAME.add.tween(t).to({ alpha: 0 }, 550, Phaser.Easing.Linear.None, true)
    .onComplete.add(function () { t.destroy(); });
};

// Camera-fixed celebratory banner that rises and fades.
collectibles.message = function (text, color) {
  var cx = GAME.camera.width / 2;
  var m = GAME.add.text(cx, 70, text, {
    font: 'bold 14px Arial',
    fill: color || '#ffffff',
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center'
  });
  m.anchor.setTo(0.5, 0.5);
  m.fixedToCamera = true;
  m.cameraOffset.setTo(cx, 70);
  GAME.add.tween(m.cameraOffset).to({ y: 50 }, 1400, Phaser.Easing.Quadratic.Out, true);
  GAME.add.tween(m).to({ alpha: 0 }, 700, Phaser.Easing.Linear.None, true, 800)
    .onComplete.add(function () { m.destroy(); });
};

export default collectibles;
