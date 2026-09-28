import map from '../objects/map';
import player from '../objects/player';
import camera from '../objects/camera';
import controls from '../objects/controls';
import sound from '../objects/sound';
import mechanics from '../objects/mechanics';
import GAME from '../game';
import gamestate from '../objects/gamestate';
import enemies from '../objects/enemies';
import powerups from '../objects/powerups';
import collectibles from '../objects/collectibles';
import goal from '../objects/goal';
import hud from '../objects/hud';

var GROUND_TOP = 384;
var CHECKPOINT_X = 2200;

export default class Play extends Phaser.State {

    create() {
        // Clear any timer callbacks left over from a previous run.
        GAME.time.events.removeAll();

        // MAP (terrain + collision groups)
        map.buildYoshisIsland1();
        GAME.physics.arcade.checkCollision.down = false;

        // AUDIO
        sound.createSound();

        // RUN STATE
        gamestate.init();

        // PLAYER
        player.createPlayer();

        // CONTROLS
        controls.createControls();

        // CAMERA
        camera.configCamera(GAME.player);

        // ENTITIES
        enemies.init();
        enemies.spawnLevel1();

        powerups.init();
        powerups.createLevel1();

        collectibles.init();
        collectibles.createLevel1();

        // GOAL (staircase + flag + castle). Built after map so ground group exists.
        goal.create();

        // HUD (added last so it renders on top) + timer
        hud.create();
        gamestate.startTimer();
    }

    update() {
        mechanics.updateMechanics(GAME.player);
        enemies.update();
        powerups.update();
        collectibles.update();
        goal.update();
        hud.update();

        // Checkpoint when entering the advanced area.
        if (!GAME.player.dead && !gamestate.frozen() &&
            GAME.player.x > CHECKPOINT_X && GAME.checkpoint.x < CHECKPOINT_X) {
            gamestate.setCheckpoint(CHECKPOINT_X, GROUND_TOP);
        }
    }
}
