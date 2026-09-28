import GAME from '../game';
import constants from './constants';

// Moving platforms. Each platform is a row of immovable ground tiles that move
// together via body velocity (so Arcade collisions resolve correctly). Riders
// on a horizontal platform are carried manually using the lead tile's deltaX.

var movingplatform = {};

var GROUND_TOP = constants.MAP_HEIGHT - 48; // 384

movingplatform.init = function () {
  GAME.movingPlatforms = GAME.add.group();
  GAME.movingPlatforms.enableBody = true;
  GAME.platformList = [];
};

// axis: 'h' or 'v'.  (lo, hi) are the travel bounds of the lead tile on that axis.
movingplatform.create = function (x, y, widthTiles, axis, lo, hi, speed) {
  var plat = {
    tiles: [],
    axis: axis,
    lo: lo,
    hi: hi,
    dir: 1,
    speed: speed || 40
  };
  for (var i = 0; i < widthTiles; i++) {
    var t = GAME.movingPlatforms.create(x + i * 16, y, 'groundTiles', 109);
    t.body.immovable = true;
    t.body.allowGravity = false;
    plat.tiles.push(t);
  }
  GAME.platformList.push(plat);
  return plat;
};

movingplatform.createLevel1 = function () {
  // Vertical elevator to an optional high bonus stash (advanced area).
  movingplatform.create(3480, GROUND_TOP - 8, 3, 'v', GROUND_TOP - 120, GROUND_TOP - 8, 35);
  // Horizontal ferry over a small gap.
  movingplatform.create(3360, GROUND_TOP - 12, 3, 'h', 3320, 3460, 45);
};

movingplatform.update = function () {
  if (!GAME.movingPlatforms) return;

  GAME.physics.arcade.collide(GAME.player, GAME.movingPlatforms);
  if (GAME.enemies) GAME.physics.arcade.collide(GAME.enemies, GAME.movingPlatforms);

  for (var i = 0; i < GAME.platformList.length; i++) {
    var plat = GAME.platformList[i];
    var lead = plat.tiles[0];
    var cur = (plat.axis === 'h') ? lead.body.x : lead.body.y;

    if (cur <= plat.lo) plat.dir = 1;
    else if (cur >= plat.hi) plat.dir = -1;

    var v = plat.dir * plat.speed;
    for (var j = 0; j < plat.tiles.length; j++) {
      var t = plat.tiles[j];
      if (plat.axis === 'h') { t.body.velocity.x = v; t.body.velocity.y = 0; }
      else { t.body.velocity.y = v; t.body.velocity.x = 0; }
    }

    // Carry a rider on a horizontal platform.
    if (plat.axis === 'h' && GAME.player && !GAME.player.dead) {
      var last = plat.tiles[plat.tiles.length - 1];
      var pb = GAME.player.body;
      var onTop = pb.touching.down &&
                  pb.bottom <= lead.body.top + 8 &&
                  pb.right > lead.body.left &&
                  pb.left < last.body.right;
      if (onTop) GAME.player.x += lead.body.deltaX();
    }
  }
};

export default movingplatform;
