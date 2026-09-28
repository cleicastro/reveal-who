import GAME from '../game';
import constants from './constants';
import frames from './frames';
import sound from './sound';
import gamestate from './gamestate';

var player = {};

player.createPlayer = function () {
  var p = GAME.add.sprite(24, GAME.world.height - 48, 'mario');
  GAME.physics.arcade.enable(p);
  p.body.bounce.y = 0;
  p.body.gravity.y = constants.PLAYER_GRAVITY;
  p.body.collideWorldBounds = true;

  p.anchor.setTo(0.5, 1);

  // State machine
  p.marioSize = 'small';
  p.frames = frames.mario.small;
  p.direction = 'right';
  p.invulnUntil = 0;   // damage immunity window (after a hit)
  p.flashUntil = 0;    // purely visual flicker (e.g. grow) — does NOT block damage
  p.dead = false;

  // Body sized for small Mario; mechanics keeps body.height in sync with the
  // current frame height each tick.
  p.body.width = p.frames.bodyW;
  p.body.height = p.frames.bodyH;

  // Default frame
  p.frame = p.frames.stand;

  // Size-specific animations (atlasJSONArray numeric frame indices)
  var ms = frames.mario.small, mb = frames.mario.big;
  p.animations.add('walk-small', ms.walk, 10, true);
  p.animations.add('run-small',  ms.run, 16, true);
  p.animations.add('spin-small', ms.spin, 20, true);
  p.animations.add('walk-big',   mb.walk, 10, true);
  p.animations.add('run-big',    mb.run, 16, true);
  p.animations.add('spin-big',   mb.spin, 20, true);

  p.hitPlatform = false;
  p.jumptimeStart = -1;
  p.jumpType = 0;

  p.body.drag.setTo(250, 0);

  GAME.player = p;
};

// Play a movement animation appropriate to the current size.
player.playAnim = function (base) {
  GAME.player.animations.play(base + '-' + GAME.player.marioSize);
};

player.isInvulnerable = function () {
  return GAME.player.invulnUntil > GAME.time.now;
};

player.isBig = function () {
  return GAME.player.marioSize === 'big';
};

// Apply a size's collision body dimensions and standing frame.
player._applySize = function (size) {
  var p = GAME.player;
  p.marioSize = size;
  p.frames = frames.mario[size];
  p.body.width = p.frames.bodyW;
  p.body.height = p.frames.bodyH;
  p.frame = p.frames.stand;
};

// Per-frame upkeep: flicker while flashing or invulnerable.
player.update = function () {
  var p = GAME.player;
  if (player.isInvulnerable() || p.flashUntil > GAME.time.now) {
    p.alpha = (Math.floor(GAME.time.now / 70) % 2) ? 0.35 : 1;
  } else if (p.alpha !== 1) {
    p.alpha = 1;
  }
};

// Small -> Big (mushroom). If already big, caller awards points instead.
player.grow = function () {
  var p = GAME.player;
  if (p.marioSize === 'big') return false;
  player._applySize('big');
  sound.play('powerup');
  // celebratory flash only — this must NOT grant damage immunity
  p.flashUntil = GAME.time.now + constants.GROW_FLASH_MS;
  return true;
};

// Big -> Small, with damage-immunity window.
player.shrink = function () {
  var p = GAME.player;
  player._applySize('small');
  p.invulnUntil = Math.max(p.invulnUntil, GAME.time.now + constants.INVULN_MS);
  sound.play('shrink');
};

// Entry point for taking a hit from an enemy.
player.damage = function () {
  var p = GAME.player;
  if (p.dead || gamestate.frozen() || player.isInvulnerable()) return;
  if (player.isBig()) {
    player.shrink();
  } else {
    player.die();
  }
};

// Small Mario death (enemy hit, fall, or timeout).
player.die = function () {
  var p = GAME.player;
  if (p.dead || gamestate.frozen()) return;
  p.dead = true;
  p.body.velocity.x = 0;
  p.body.velocity.y = -250;          // little death hop
  p.body.checkCollision.none = true; // fall through the world
  sound.play('shrink');
  GAME.time.events.add(700, gamestate.loseLife);
};

// Respawn at the last checkpoint as Small Mario.
player.respawn = function () {
  var p = GAME.player;
  p.dead = false;
  player._applySize('small');
  p.body.checkCollision.none = false;
  p.body.velocity.set(0, 0);
  p.body.acceleration.set(0, 0);
  p.x = GAME.checkpoint.x;
  p.y = GAME.checkpoint.y;
  p.direction = 'right';
  p.scale.setTo(1, 1);
  p.alpha = 1;
  p.jumpType = 0;
  p.jumptimeStart = -1;
  p.animations.stop();
  p.invulnUntil = GAME.time.now + constants.INVULN_MS;

  // Fresh attempt: restore the countdown (it may have hit 0 / been stopped).
  if (GAME.timeLeft <= 0) GAME.timeLeft = constants.START_TIME;
  gamestate.startTimer();
};

export default player;
