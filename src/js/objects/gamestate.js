import GAME from '../game';
import constants from './constants';
import player from './player';
import sound from './sound';

// Centralized run state: score, lives, time, coins, letter progress, flags.
var gamestate = {};

gamestate.init = function () {
  GAME.score = 0;
  GAME.lives = constants.START_LIVES;
  GAME.coinCount = 0;
  GAME.timeLeft = constants.START_TIME;

  // Letter progress. Each placed letter has a unique id; we store collected ids
  // in a set so progress is order-independent and never double counts.
  GAME.progress = {
    CAUA: { collected: {}, count: 0, total: constants.NAME_CAUA.length, done: false },
    AYLA: { collected: {}, count: 0, total: constants.NAME_AYLA.length, done: false }
  };

  GAME.levelComplete = false;
  GAME.gameOver = false;
  GAME.checkpoint = { x: 24, y: GAME.world.height - 48 };
};

gamestate.frozen = function () {
  return GAME.levelComplete || GAME.gameOver;
};

gamestate.addScore = function (points) {
  GAME.score += points;
};

gamestate.collectCoin = function () {
  GAME.coinCount += 1;
  GAME.score += constants.PTS_COIN;
  sound.play('coin');
  // Classic 100-coin 1up.
  if (GAME.coinCount >= 100) {
    GAME.coinCount -= 100;
    gamestate.addLife();
  }
};

gamestate.addLife = function () {
  GAME.lives += 1;
  sound.play('oneup');
};

// Returns true if a name was just completed.
gamestate.collectLetter = function (nameKey, letterId) {
  var p = GAME.progress[nameKey];
  if (!p || p.collected[letterId]) return false;
  p.collected[letterId] = true;
  p.count += 1;
  GAME.score += constants.PTS_LETTER;
  var completed = !p.done && p.count >= p.total;
  if (completed) {
    p.done = true;
    GAME.score += constants.PTS_NAME_BONUS;
    sound.play('namebonus'); // play only the bonus chime, not the plain letter SFX
  } else {
    sound.play('letter');
  }
  return completed;
};

gamestate.setCheckpoint = function (x, y) {
  GAME.checkpoint = { x: x, y: y };
};

// Called when Small Mario dies (enemy hit, fall, or timeout).
gamestate.loseLife = function () {
  if (gamestate.frozen()) return;
  // START_LIVES reserves shown on the HUD; dying with none left ends the game.
  if (GAME.lives <= 0) {
    gamestate.triggerGameOver();
  } else {
    GAME.lives -= 1;
    player.respawn();
  }
};

gamestate.triggerGameOver = function () {
  GAME.gameOver = true;
  gamestate.stopTimer();
  GAME.time.events.add(1200, function () {
    GAME.state.start('Over');
  });
};

// --- Countdown timer ---
gamestate.startTimer = function () {
  gamestate.stopTimer();
  GAME.timerEvent = GAME.time.events.loop(constants.TIME_TICK_MS, gamestate.tickTime);
};

gamestate.stopTimer = function () {
  if (GAME.timerEvent) {
    GAME.time.events.remove(GAME.timerEvent);
    GAME.timerEvent = null;
  }
};

gamestate.tickTime = function () {
  if (gamestate.frozen()) return;
  GAME.timeLeft -= 1;
  if (GAME.timeLeft <= 0) {
    GAME.timeLeft = 0;
    gamestate.stopTimer();
    player.die();
  }
};

export default gamestate;
