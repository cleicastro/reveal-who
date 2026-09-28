import resize from './objects/resize';
import constants from './objects/constants';

var GAME = new Phaser.Game(window.innerWidth/constants.RESIZE_FACTOR, constants.SNES_HEIGHT, Phaser.AUTO, 'phaser-window');
GAME.antialias = false;

// Make GAME globally available for circular imports
window.GAME = GAME;

// Import states after GAME is created
import('./states').then(statesModule => {
  Object.keys(statesModule).forEach(state => GAME.state.add(state, statesModule[state]));
  GAME.state.start('Boot');
});

$(window).resize(function() { resize.resizeGame(); } );

document.addEventListener('keydown', function(e) {
  if (e.key === 'm' || e.key === 'M') {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      var req = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (req) req.call(document.documentElement);
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) exit.call(document);
    }
  }
});

function applyFullscreenScale() {
  // Usa window.innerWidth/innerHeight pois no fullscreenchange já refletem o viewport fullscreen
  var sw = window.innerWidth;
  var sh = window.innerHeight;
  var w = Math.round(sw / constants.SCALE);
  var h = Math.round(sh / constants.SCALE);
  GAME.width = w;
  GAME.height = h;
  GAME.canvas.width = w;
  GAME.canvas.height = h;
  GAME.scale.width = w;
  GAME.scale.height = h;
  // Atualiza USER_SCALE para que o ScaleManager não sobrescreva o CSS
  GAME.scale.setUserScale(constants.SCALE, constants.SCALE);
  GAME.renderer.resize(w, h);
  GAME.camera.setSize(w, h);
  GAME.camera.height = h;
  if (GAME.player) GAME.camera.follow(GAME.player, Phaser.Camera.FOLLOW_PLATFORMER);
  GAME.canvas.style.border = 'none';
  GAME.canvas.style.margin = '0';
}

function removeFullscreenScale() {
  GAME.canvas.style.border = '';
  GAME.canvas.style.margin = '';
  resize.resizeGame();
}

document.addEventListener('fullscreenchange', function() {
  if (document.fullscreenElement) {
    applyFullscreenScale();
  } else {
    removeFullscreenScale();
  }
});
document.addEventListener('webkitfullscreenchange', function() {
  if (document.webkitFullscreenElement) {
    applyFullscreenScale();
  } else {
    removeFullscreenScale();
  }
});

export default GAME;
