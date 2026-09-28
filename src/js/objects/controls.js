import GAME from '../game';
import mechanics from './mechanics';

var controls = {};

controls.buttons = {};

controls.createControls = function () {
  // Load arrow key controls
  controls.cursors = GAME.input.keyboard.createCursorKeys();
  controls.buttons = {
    'A': GAME.input.keyboard.addKey(Phaser.Keyboard.D),
    'B': GAME.input.keyboard.addKey(Phaser.Keyboard.S),
    'Y': GAME.input.keyboard.addKey(Phaser.Keyboard.A)
  };
  // Phaser caches Key objects by keycode, so on a Play restart addKey() returns
  // the SAME Key — clear old listeners first to avoid stacking (e.g. double jump).
  controls.buttons.B.onDown.removeAll();
  controls.buttons.A.onDown.removeAll();
  controls.buttons.B.onDown.add(mechanics.jump, this);
  controls.buttons.A.onDown.add(mechanics.spin, this);
}

export default controls;
