var constants = {
  SNES_WIDTH: 256,
  SNES_HEIGHT: 324,

  MAP_HEIGHT: 432,
  MAP_WIDTH: 5120,

  MAP_HEIGHT_16: 416,
  MAP_HEIGHT_32: 400,
  MAP_HEIGHT_48: 384,

  DEBUG_ON: false,

  MUSIC_ON: true,

  RESIZE_FACTOR: 2.1,

  SCALE: 2,

  // --- Gameplay ---
  START_LIVES: 3,
  START_TIME: 300,          // countdown units shown on HUD
  TIME_TICK_MS: 400,        // real ms per time unit (SMW time runs faster than realtime)

  PLAYER_GRAVITY: 1000,
  ENEMY_GRAVITY: 1000,

  ENEMY_SPEED: 35,          // goomba / koopa walk speed
  SHELL_SPEED: 220,         // kicked koopa shell speed
  MUSHROOM_SPEED: 60,

  STOMP_BOUNCE: 220,        // upward velocity given to Mario after a stomp
  INVULN_MS: 2000,          // invulnerability window after taking damage as Big Mario
  GROW_FLASH_MS: 600,

  // Points
  PTS_COIN: 100,
  PTS_LETTER: 200,
  PTS_STOMP: 100,
  PTS_SHELL_KILL: 200,
  PTS_MUSHROOM_BIG: 1000,   // mushroom collected while already Big
  PTS_NAME_BONUS: 5000,     // completing a full name (CAUÃ or AYLA)

  // Collectible names
  NAME_CAUA: ['C', 'A', 'U', 'Ã'],
  NAME_AYLA: ['A', 'Y', 'L', 'A']
};

export default constants;
