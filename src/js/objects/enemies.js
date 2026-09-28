import GAME from '../game';
import constants from './constants';
import frames from './frames';
import sound from './sound';
import gamestate from './gamestate';
import player from './player';

var enemies = {};

var GROUND_TOP = constants.MAP_HEIGHT - 48; // 384
var TURN_COOLDOWN = 150; // ms — stops a fast shell flipping every frame on tile seams

enemies.init = function () {
  GAME.enemies = GAME.add.group();
  GAME.enemies.enableBody = true;
};

// --- spawning -------------------------------------------------------------

enemies._initBody = function (e) {
  e.anchor.setTo(0.5, 1);
  e.body.gravity.y = constants.ENEMY_GRAVITY;
  e.body.collideWorldBounds = false;
  e.speed = constants.ENEMY_SPEED;
  e.dir = -1;        // start walking left
  e._turnAt = 0;
  e.kickGuard = 0;
};

enemies.spawnGoomba = function (x, y) {
  var e = GAME.enemies.create(x, y, 'enemies', frames.goomba.walk[0]);
  enemies._initBody(e);
  e.enemyType = 'goomba';
  e.enemyState = 'walk';
  e.baseScaleX = 1;   // sprite faces left naturally
  e.animations.add('walk', frames.goomba.walk, 6, true);
  e.animations.play('walk');
  return e;
};

enemies.spawnKoopa = function (x, y) {
  var e = GAME.enemies.create(x, y, 'enemies', frames.koopa.walk[0]);
  enemies._initBody(e);
  e.enemyType = 'koopa';
  e.enemyState = 'walk';
  e.baseScaleX = -1;  // sprite faces right naturally — invert flip axis
  e.animations.add('walk', frames.koopa.walk, 6, true);
  e.animations.add('shellspin', frames.koopa.shellSpin, 16, true);
  e.animations.play('walk');
  return e;
};

// Place all enemies for Level 1.
enemies.spawnLevel1 = function () {
  // Initial area — teach stomping
  enemies.spawnGoomba(420, GROUND_TOP);
  enemies.spawnGoomba(760, GROUND_TOP);
  // Intermediate — a small squad of Goombas
  enemies.spawnGoomba(1360, GROUND_TOP);
  enemies.spawnGoomba(1480, GROUND_TOP);
  enemies.spawnGoomba(1900, GROUND_TOP);
  // Advanced — Green Koopa Troopas, with a Goomba beside the first koopa so a
  // kicked shell has something to plow into (demonstrates shell-kills-enemy).
  enemies.spawnKoopa(2380, GROUND_TOP);
  enemies.spawnGoomba(2560, GROUND_TOP);
  enemies.spawnKoopa(2760, GROUND_TOP);
};

// --- per-frame update -----------------------------------------------------

enemies.update = function () {
  if (!GAME.enemies) return;

  GAME.physics.arcade.collide(GAME.enemies, GAME.groundTilesGroup);
  GAME.physics.arcade.collide(GAME.enemies, GAME.platforms);
  GAME.physics.arcade.collide(GAME.enemies, GAME.tilesGroup);
  GAME.physics.arcade.collide(GAME.enemies, GAME.blocksGroup);
  // Overlap (not collide) so a moving shell plows through enemies without being
  // bounced back by the separation.
  GAME.physics.arcade.overlap(GAME.enemies, GAME.enemies, enemies._onEnemyEnemy, enemies._enemyProcess);

  GAME.enemies.forEachAlive(function (e) {
    enemies._stepEnemy(e);
  });

  if (!gamestate.frozen() && GAME.player && !GAME.player.dead) {
    GAME.physics.arcade.collide(GAME.player, GAME.enemies, enemies._onPlayerHit, enemies._playerProcess);
  }
};

enemies._stepEnemy = function (e) {
  // fell into a hole -> recycle
  if (e.y > GAME.world.height + 40) { e.kill(); return; }

  if (e.enemyState === 'dead') return;
  if (e.enemyState === 'shell') { e.body.velocity.x = 0; return; }

  var moving = (e.enemyState === 'shellMoving');
  var spd = moving ? constants.SHELL_SPEED : e.speed;
  var now = GAME.time.now;

  // Turn at walls. A cooldown stops a fast shell from flipping direction every
  // frame when its bottom corner catches a ground-tile seam.
  if (now - e._turnAt > TURN_COOLDOWN) {
    if (e.body.blocked.left) { e.dir = 1; e._turnAt = now; }
    else if (e.body.blocked.right) { e.dir = -1; e._turnAt = now; }
    else if (!moving) {
      // walking enemies (slow, no seam issue) also turn on incidental contact
      if (e.body.touching.left) { e.dir = 1; e._turnAt = now; }
      else if (e.body.touching.right) { e.dir = -1; e._turnAt = now; }
    }
  }

  e.body.velocity.x = e.dir * spd;
  e.scale.x = e.baseScaleX * ((e.dir < 0) ? 1 : -1);
};

// --- player <-> enemy -----------------------------------------------------

enemies._playerProcess = function (playerSprite, e) {
  return e.enemyState !== 'dead';
};

// Velocity-independent stomp test: was Mario's body bottom at/above the enemy's
// top on the previous frame? Robust to Arcade zeroing velocity.y on separation
// and to X-axis separation on diagonal landings.
enemies._isStomp = function (playerSprite, e) {
  var pb = playerSprite.body;
  return (pb.prev.y + pb.height) <= (e.body.y + 8);
};

enemies._onPlayerHit = function (playerSprite, e) {
  if (e.enemyState === 'dead') return;
  var stomp = enemies._isStomp(playerSprite, e);

  if (e.enemyType === 'goomba') {
    if (stomp) {
      enemies._squash(e);
      enemies._bounce();
      gamestate.addScore(constants.PTS_STOMP);
      sound.play('stomp');
    } else {
      player.damage();
    }
    return;
  }

  // koopa
  if (e.enemyState === 'walk') {
    if (stomp) {
      enemies._toShell(e);
      enemies._bounce();
      gamestate.addScore(constants.PTS_STOMP);
      sound.play('stomp');
    } else {
      player.damage();
    }
  } else if (e.enemyState === 'shell') {
    if (stomp) {
      // tapped from the top: just rest/bounce, don't launch under Mario
      enemies._bounce();
    } else {
      enemies._kickShell(e, playerSprite);
    }
  } else if (e.enemyState === 'shellMoving') {
    if (stomp) {
      e.enemyState = 'shell';
      e.body.velocity.x = 0;
      e.animations.stop();
      e.frame = frames.koopa.shell;
      enemies._bounce();
      sound.play('stomp');
    } else if (GAME.time.now >= e.kickGuard) {
      player.damage();
    }
  }
};

enemies._bounce = function () {
  GAME.player.body.velocity.y = -constants.STOMP_BOUNCE;
  GAME.player.jumptimeStart = -1;
};

enemies._squash = function (e) {
  e.enemyState = 'dead';
  e.body.enable = false;
  e.animations.stop();
  e.frame = frames.goomba.squashed;
  // squash animation — flatten the sprite
  GAME.add.tween(e.scale).to({ y: 0.4 }, 120, Phaser.Easing.Quadratic.Out, true);
  GAME.time.events.add(500, function () { if (e && e.game) e.kill(); });
};

enemies._toShell = function (e) {
  e.enemyState = 'shell';
  e.body.velocity.x = 0;
  e.animations.stop();
  e.frame = frames.koopa.shell;
};

enemies._kickShell = function (e, fromSprite) {
  e.enemyState = 'shellMoving';
  // kick away based on which side Mario touched
  if (e.body.touching.left || fromSprite.body.touching.right) e.dir = 1;
  else if (e.body.touching.right || fromSprite.body.touching.left) e.dir = -1;
  else e.dir = (fromSprite.x < e.x) ? 1 : -1;
  e._turnAt = GAME.time.now;
  e.kickGuard = GAME.time.now + 150; // brief grace so the kicker isn't hit
  e.animations.play('shellspin');
  sound.play('kick');
};

// --- shell <-> enemy ------------------------------------------------------

enemies._enemyProcess = function (a, b) {
  return a.enemyState !== 'dead' && b.enemyState !== 'dead';
};

enemies._onEnemyEnemy = function (a, b) {
  if (a.enemyState === 'shellMoving' && b.enemyState !== 'shellMoving') {
    enemies._killByShell(b);
  } else if (b.enemyState === 'shellMoving' && a.enemyState !== 'shellMoving') {
    enemies._killByShell(a);
  }
};

enemies._killByShell = function (e) {
  e.enemyState = 'dead';
  e.body.enable = false;
  e.animations.stop();
  e.scale.y = -1; // knocked over
  gamestate.addScore(constants.PTS_SHELL_KILL);
  sound.play('kick');
  GAME.time.events.add(600, function () { if (e && e.game) e.kill(); });
};

export default enemies;
