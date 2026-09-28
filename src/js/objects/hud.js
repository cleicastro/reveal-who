import GAME from '../game';
import player from './player';

var hud = {};

function pad(n, width) {
  n = '' + Math.max(0, Math.floor(n));
  while (n.length < width) n = '0' + n;
  return n;
}

function mkText(x, y, str, fill, anchorX) {
  var t = GAME.add.text(x, y, str, {
    font: 'bold 10px Arial',
    fill: fill || '#ffffff',
    stroke: '#000000',
    strokeThickness: 3
  });
  t.fixedToCamera = true;
  t.cameraOffset.setTo(x, y);
  if (anchorX) t.anchor.setTo(anchorX, 0);
  return t;
}

hud.create = function () {
  var right = GAME.camera.width - 8;

  // Left column
  hud.score = mkText(8, 6, 'MARIO 000000', '#ffffff');
  hud.coins = mkText(8, 20, '@x00', '#ffd700');

  // Right column
  hud.time = mkText(right, 6, 'TIME 300', '#ffffff', 1);
  hud.lives = mkText(right, 20, 'LIVES x3', '#ffffff', 1);

  // Letter progress + state row
  hud.caua = mkText(8, 34, 'CAUÃ 0/4', '#33ccff');
  hud.ayla = mkText(120, 34, 'AYLA 0/4', '#ff66cc');
  hud.state = mkText(right, 34, 'PEQUENO', '#ffffff', 1);
};

hud.update = function () {
  if (!hud.score) return;
  hud.score.text = 'MARIO ' + pad(GAME.score, 6);
  hud.coins.text = '@x' + pad(GAME.coinCount, 2);
  hud.time.text = 'TIME ' + pad(GAME.timeLeft, 3);
  hud.lives.text = 'LIVES x' + Math.max(0, GAME.lives);
  hud.caua.text = 'CAUÃ ' + GAME.progress.CAUA.count + '/' + GAME.progress.CAUA.total;
  hud.ayla.text = 'AYLA ' + GAME.progress.AYLA.count + '/' + GAME.progress.AYLA.total;
  hud.state.text = player.isBig() ? 'GRANDE' : 'PEQUENO';
};

export default hud;
