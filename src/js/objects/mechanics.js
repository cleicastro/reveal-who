import GAME from '../game';
import controls from './controls';
import sound from './sound';
import player from './player';
import gamestate from './gamestate';

var mechanics = {};

mechanics.updateMechanics = function (p) {
  p.body.height = p.height;

  // Terrain collisions (always, so physics stays consistent).
  p.touchGroundTile = GAME.physics.arcade.collide(p, GAME.groundTilesGroup);
  p.touchPlatform = GAME.physics.arcade.collide(p, GAME.platforms);
  GAME.physics.arcade.collide(p, GAME.tilesGroup);
  GAME.physics.arcade.collide(p, GAME.blocksGroup);

  p.hitPlatform = p.touchGroundTile || p.touchPlatform;
  p.body.drag.setTo(250, 0);
  p.jumpType = p.body.touching.down && p.hitPlatform ? 0 : p.jumpType;

  // Smooth slope rider: declining staircase terrain at x=2912–3008.
  // Surface Y is a 1:1 gradient — for each pixel right, 1 pixel lower.
  // When the player's feet are at or below the surface and not jumping,
  // snap Y to the surface so ascent/descent feel fluid instead of stair-stepped.
  var SLOPE_X1 = 2912, SLOPE_X2 = 3008;
  if (!p.dead && p.x > SLOPE_X1 && p.x < SLOPE_X2) {
    var slopeY = (GAME.world.height - 176) + (p.x - SLOPE_X1);
    if (p.y >= slopeY && p.body.velocity.y >= 0) {
      p.y = slopeY;
      p.body.velocity.y = 0;
      p.body.touching.down = true;
      p.hitPlatform = true;
      p.jumpType = 0;
    }
  }

  // Fall into a hole -> death.
  if (!p.dead && p.y > GAME.world.height + 50) {
    player.die();
  }

  // Update invulnerability flashing.
  player.update();

  // Freeze input when dead or when the level/run is over.
  if (p.dead || gamestate.frozen()) {
    p.body.acceleration.x = 0;
    return;
  }

  if (p.direction === 'right') {
    p.scale.x = 1;
  } else if (p.direction === 'left') {
    p.scale.x = -1;
  }

  // Variable-height jump (B = jump, A = spin).
  if (controls.buttons.B.isDown && (p.jumptimeStart != -1)) {
    if (GAME.time.time - p.jumptimeStart > 175) {
      p.jumptimeStart = -1;
    } else {
      p.body.velocity.y = (Math.abs(p.body.velocity.x) >= 125) ? -290 : ((Math.abs(p.body.velocity.x) >= 75) ? -265 : -250);
    }
  }

  if (controls.buttons.A.isDown && (p.jumptimeStart != -1)) {
    if (GAME.time.time - p.jumptimeStart > 200) {
      p.jumptimeStart = -1;
    } else {
      p.body.velocity.y = (Math.abs(p.body.velocity.x) >= 125) ? -240 : ((Math.abs(p.body.velocity.x) >= 75) ? -215 : -200);
    }
  }

  if (controls.cursors.left.isDown && !(controls.cursors.up.isDown || controls.cursors.down.isDown)) {
    p.direction = 'left';
    p.body.maxVelocity.x = controls.buttons.Y.isDown ? 125 : 75;
    p.body.acceleration.x = -500;
  } else if (controls.cursors.right.isDown && !(controls.cursors.up.isDown || controls.cursors.down.isDown)) {
    p.direction = 'right';
    p.body.maxVelocity.x = controls.buttons.Y.isDown ? 125 : 75;
    p.body.acceleration.x = 500;
  } else if (p.jumpType === 2) {
    if (p.body.acceleration.x > 0) {
      p.body.acceleration.x = p.body.acceleration.x <= 0 ? 0 : p.body.acceleration.x - 50;
    } else if (p.body.acceleration.x < 0) {
      p.body.acceleration.x = p.body.acceleration.x >= 0 ? 0 : p.body.acceleration.x + 50;
    }
    player.playAnim('spin');
  } else if (p.jumpType === 1) {
    if (p.body.acceleration.x > 0) {
      p.body.acceleration.x = p.body.acceleration.x <= 0 ? 0 : p.body.acceleration.x - 100;
    } else if (p.body.acceleration.x < 0) {
      p.body.acceleration.x = p.body.acceleration.x >= 0 ? 0 : p.body.acceleration.x + 100;
    }
  } else {
    p.body.acceleration.x = 0;
  }

  // Movement animation (size-aware).
  if (Math.abs(p.body.velocity.x) > 75) {
    if (p.jumpType === 0) player.playAnim('run');
  } else if (Math.abs(p.body.velocity.x) > 0) {
    if (p.jumpType === 0) player.playAnim('walk');
  } else {
    if (p.jumpType != 2) {
      p.animations.stop();
      p.frame = p.frames.stand;
    }
  }

  // Airborne frames.
  if (p.jumpType === 1) {
    if (p.body.velocity.y < 0) {
      p.frame = p.frames.jumpUp;
    } else if (p.body.velocity.y > 0) {
      p.frame = p.frames.jumpDown;
    }
  }

  if (controls.cursors.up.isDown && p.body.touching.down && p.hitPlatform) {
    p.frame = p.frames.lookUp;
  } else if (controls.cursors.down.isDown && p.body.touching.down && p.hitPlatform) {
    p.frame = p.frames.crouch;
  }
};

mechanics.spin = function () {
  var p = GAME.player;
  if (p.dead || gamestate.frozen()) return;
  p.jumpType = 2;
  if (p.hitPlatform) {
    p.jumptimeStart = GAME.time.time;
    p.body.velocity.y = -200;
    sound.play('spin');
    player.playAnim('spin');
  }
};

mechanics.jump = function () {
  var p = GAME.player;
  if (p.dead || gamestate.frozen()) return;
  p.jumpType = 1;
  if (p.hitPlatform) {
    p.jumptimeStart = GAME.time.time;
    p.body.velocity.y = -250;
    sound.play('jump');
  }
};

export default mechanics;
