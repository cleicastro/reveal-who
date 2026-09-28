import GAME from '../game';
import constants from './constants'

var sound = {};

// logical name -> loaded asset key (see preload.js)
var SFX_DEFS = {
  jump:       'Jump Wav',
  coin:       'Coin Wav',
  spin:       'Spin Wav',
  stomp:      'sfx-stomp',
  kick:       'sfx-kick',
  letter:     'sfx-letter',
  powerup:    'sfx-powerup',
  shrink:     'sfx-shrink',
  oneup:      'sfx-oneup',
  levelclear: 'sfx-levelclear',
  namebonus:  'sfx-namebonus'
};

sound.createSound = function() {
  // Build the Sound objects once. The audio cache persists across state
  // restarts, but the SoundManager is not cleared by clearWorld, so rebuilding
  // every Play.create would leak Phaser.Sound instances into GAME.sound._sounds.
  if (sound.fx) {
    if (sound.music && constants.MUSIC_ON && !sound.music.isPlaying) sound.music.loopFull();
    return;
  }

  // Music
  sound.music = GAME.add.audio('Overworld Theme');
  if (constants.MUSIC_ON) {
    sound.music.loopFull();
  }

  // Sound effects registry
  sound.fx = {};
  Object.keys(SFX_DEFS).forEach(function (name) {
    sound.fx[name] = GAME.add.audio(SFX_DEFS[name]);
  });

  // Back-compat aliases used by older code paths
  sound.jumpSFX = sound.fx.jump;
  sound.coinSFX = sound.fx.coin;
  sound.spinSFX = sound.fx.spin;
};

// Safe play: no-op if not created yet or name unknown.
sound.play = function (name) {
  var o = sound.fx && sound.fx[name];
  if (o) {
    o.play();
  }
};

export default sound;
