import GAME from '../game';
import constants from './constants';
import sound from './sound';
import gamestate from './gamestate';
import collectibles from './collectibles';

var goal = {};

var GROUND_TOP = constants.MAP_HEIGHT - 48; // 384
var GOAL_X = 4250;
var POLE_H = 130;

goal.create = function () {
  // Castle first so it renders behind the staircase and flagpole.
  goal._buildCastle();
  goal._buildStaircase();
  goal._buildFlagpole();
  GAME.goalX = GOAL_X;
};

goal._buildStaircase = function () {
  // 5-step classic staircase leading up to the goal.
  for (var s = 0; s < 5; s++) {
    var height = s + 1;
    var tx = 4080 + s * 16;
    for (var h = 0; h < height; h++) {
      var ty = (GROUND_TOP - 16) - h * 16;
      var tile = GAME.groundTilesGroup.create(tx, ty, 'groundTiles', 84);
      tile.body.immovable = true;
    }
  }
};

goal._buildFlagpole = function () {
  var g = GAME.add.graphics(GOAL_X, GROUND_TOP);
  // pole
  g.beginFill(0x4caf50);
  g.drawRect(-2, -POLE_H, 4, POLE_H);
  g.endFill();
  // ball on top
  g.beginFill(0xffeb3b);
  g.drawCircle(0, -POLE_H, 9);
  g.endFill();

  // The flag (tweened down on completion).
  var flag = GAME.add.graphics(GOAL_X, GROUND_TOP - POLE_H + 12);
  flag.beginFill(0xe53935);
  flag.moveTo(0, 0);
  flag.lineTo(-26, 8);
  flag.lineTo(0, 16);
  flag.endFill();
  GAME.goalFlag = flag;
};

goal._buildCastle = function () {
  var cx = 4430, base = GROUND_TOP;
  var g = GAME.add.graphics(0, 0);
  // body
  g.beginFill(0x9e6b3a);
  g.drawRect(cx, base - 96, 128, 96);
  g.endFill();
  // battlements
  g.beginFill(0x9e6b3a);
  for (var i = 0; i < 7; i++) g.drawRect(cx + i * 19, base - 112, 12, 16);
  g.endFill();
  // door
  g.beginFill(0x3a2410);
  g.drawRect(cx + 52, base - 40, 24, 40);
  g.endFill();
  // window
  g.beginFill(0x1b1b1b);
  g.drawRect(cx + 56, base - 80, 16, 16);
  g.endFill();
};

goal.update = function () {
  if (GAME.levelComplete || !GAME.player || GAME.player.dead) return;
  // Crossing the flagpole completes the level (SMW goal-tape style).
  if (GAME.player.x >= GOAL_X - 8) goal.complete();
};

goal.complete = function () {
  if (GAME.levelComplete) return;
  GAME.levelComplete = true;
  GAME.victory = true;
  gamestate.stopTimer();

  var p = GAME.player;
  p.body.velocity.x = 0;
  p.body.acceleration.x = 0;

  if (sound.music && sound.music.isPlaying) sound.music.stop();
  sound.play('levelclear');

  // Time bonus.
  gamestate.addScore(GAME.timeLeft * 50);

  if (GAME.goalFlag) {
    GAME.add.tween(GAME.goalFlag).to({ y: GROUND_TOP - 20 }, 900, Phaser.Easing.Bounce.Out, true);
  }
  collectibles.message('FASE COMPLETA!', '#ffff66');

  GAME.time.events.add(2600, function () {
    GAME.state.start('Over');
  });
};

export default goal;
