import GAME from '../game';
import constants from './constants';
import frames from './frames';
import sound from './sound';
import gamestate from './gamestate';
import player from './player';

var powerups = {};

var GROUND_TOP = constants.MAP_HEIGHT - 48; // 384

powerups.init = function () {
  GAME.qblocks = GAME.add.group();
  GAME.qblocks.enableBody = true;
  GAME.mushrooms = GAME.add.group();
  GAME.mushrooms.enableBody = true;
  GAME.popups = GAME.add.group(); // purely visual coin pops
};

// content: 'mushroom' | 'coin'
powerups.createBlock = function (x, y, content) {
  var b = GAME.qblocks.create(x, y, 'items', frames.qblock[0]);
  b.body.immovable = true;
  b.body.allowGravity = false;
  b.used = false;
  b.content = content || 'coin';
  b.animations.add('shine', frames.qblock, 8, true);
  b.animations.play('shine');
  return b;
};

powerups.createLevel1 = function () {
  // Intermediate area: coin / mushroom / coin row + a high coin block.
  // powerups.createBlock(1200, GROUND_TOP - 64, 'coin');
  powerups.createBlock(1232, GROUND_TOP - 64, 'mushroom'); // first growth mushroom
  // powerups.createBlock(1264, GROUND_TOP - 64, 'coin');
  // powerups.createBlock(1700, GROUND_TOP - 80, 'coin');
  // Advanced area: a backup mushroom before the Koopas
  powerups.createBlock(2300, GROUND_TOP - 64, 'mushroom');
};

powerups.update = function () {
  if (GAME.qblocks && GAME.player && !GAME.player.dead) {
    GAME.physics.arcade.collide(GAME.player, GAME.qblocks, powerups._onBlockHit);
  }

  if (GAME.mushrooms) {
    GAME.physics.arcade.collide(GAME.mushrooms, GAME.groundTilesGroup);
    GAME.physics.arcade.collide(GAME.mushrooms, GAME.platforms);
    GAME.physics.arcade.collide(GAME.mushrooms, GAME.tilesGroup);
    GAME.physics.arcade.collide(GAME.mushrooms, GAME.blocksGroup);
    GAME.physics.arcade.collide(GAME.mushrooms, GAME.qblocks, null, function (m, b) {
      return m.parentBlock !== b;
    });
    GAME.mushrooms.forEachAlive(powerups._stepMushroom);
    if (!gamestate.frozen() && GAME.player && !GAME.player.dead) {
      GAME.physics.arcade.overlap(GAME.player, GAME.mushrooms, powerups._collectMushroom);
    }
  }
};

powerups._onBlockHit = function (playerSprite, b) {
  if (b.used) return;
  // Mario must hit it from below.
  if (!(b.body.touching.down && playerSprite.body.touching.up)) return;

  b.used = true;
  b.animations.stop();
  b.frame = frames.usedBlock;
  // little bump
  var by = b.y;
  GAME.add.tween(b).to({ y: by - 5 }, 70, Phaser.Easing.Quadratic.Out, true, 0, 0, true);

  if (b.content === 'mushroom') {
    powerups._emergeMushroom(b);
  } else {
    powerups._popCoin(b.x, b.y);
    gamestate.collectCoin();
  }
};

powerups._popCoin = function (x, y) {
  var c = GAME.popups.create(x, y, 'items', frames.coin[0]);
  c.body.allowGravity = false;
  c.body.enable = false;
  GAME.add.tween(c).to({ y: y - 28 }, 260, Phaser.Easing.Quadratic.Out, true);
  GAME.add.tween(c).to({ alpha: 0 }, 260, Phaser.Easing.Linear.None, true).onComplete.add(function () {
    c.kill();
  });
};

powerups._emergeMushroom = function (b) {
  var m = GAME.mushrooms.create(b.x, b.y, 'items', frames.mushroom);
  m.parentBlock = b;
  m.body.enable = false;       // hidden inside the block while emerging
  m.body.allowGravity = false;
  m.emerging = true;
  m.dir = 1;
  var topY = b.y - 16;
  GAME.add.tween(m).to({ y: topY }, 400, Phaser.Easing.Linear.None, true)
    .onComplete.add(function () {
      m.emerging = false;
      m.body.enable = true;
      m.body.allowGravity = true;
      m.body.gravity.y = constants.PLAYER_GRAVITY;
      m.body.velocity.x = constants.MUSHROOM_SPEED * m.dir;
    });
};

powerups._stepMushroom = function (m) {
  if (m.emerging) return;
  if (m.y > GAME.world.height + 40) { m.kill(); return; }
  if (m.body.blocked.left || m.body.touching.left) m.dir = 1;
  else if (m.body.blocked.right || m.body.touching.right) m.dir = -1;
  m.body.velocity.x = constants.MUSHROOM_SPEED * m.dir;
};

powerups._collectMushroom = function (playerSprite, m) {
  m.kill();
  if (player.isBig()) {
    gamestate.addScore(constants.PTS_MUSHROOM_BIG);
    sound.play('powerup');
  } else {
    player.grow();
  }
};

export default powerups;
