import GAME from '../game';

export default class Over extends Phaser.State {

    preload() {
        this.load.audio('music-menino', 'assets/audio/music/menino.mp3');
        this.load.audio('music-menina', 'assets/audio/music/menina.mp3');
    }

    create() {
        const victory = !!GAME.victory;
        const score   = GAME.score || 0;
        const gender  = window.PLAYER_GENDER; // 'caua' | 'ayla' | undefined

        const cx = Math.floor(this.game.camera.width  / 2);
        const cy = Math.floor(this.game.camera.height / 2);
        const W  = this.game.camera.width;
        const H  = this.game.camera.height;

        this._rockets  = null;
        this._fwLayer  = null;
        this._revealed = false;
        this._gender   = gender;
        this._W = W;
        this._H = H;

        if (victory && gender) {
            this._buildReveal(cx, cy, W, H, score);
        } else if (victory) {
            this._buildVictory(cx, cy, score);
        } else {
            this._buildGameOver(cx, cy, score);
        }
    }

    // ─── Reveal sequence ─────────────────────────────────────────────────────

    _buildReveal(cx, cy, W, H, score) {
        this.game.stage.backgroundColor = '#06061A';
        this._rockets = [];

        // Fireworks layer FIRST so text renders on top
        this._fwLayer = this.game.add.graphics(0, 0);

        // "A revelação em..."
        this._labelTxt = this.add.text(cx, cy - 75, 'A REVELAÇÃO EM...', {
            font: 'bold 15px "Courier New", monospace',
            fill: '#CCCCFF',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        });
        this._labelTxt.anchor.setTo(0.5, 0.5);

        // Countdown number
        this._countTxt = this.add.text(cx, cy + 5, '10', {
            font: 'bold 90px "Courier New", monospace',
            fill: '#FFFF55',
            stroke: '#000000',
            strokeThickness: 10,
            align: 'center'
        });
        this._countTxt.anchor.setTo(0.5, 0.5);

        // Reveal banner (hidden until triggered)
        const isCaua      = this._gender === 'caua';
        const revealLabel = isCaua ? 'OI, EU SOU O CAUÃ!' : 'OI, EU SOU A AYLA!';
        const revealColor = isCaua ? '#66CCFF' : '#FF66BB';

        this._revealTxt = this.add.text(cx, cy - 35, revealLabel, {
            font: 'bold 46px "Courier New", monospace',
            fill: revealColor,
            stroke: '#000000',
            strokeThickness: 9,
            align: 'center'
        });
        this._revealTxt.anchor.setTo(0.5, 0.5);
        this._revealTxt.visible = false;
        this._revealTxt.scale.setTo(0, 0);

        // Score / letters (hidden until reveal)
        const caua = GAME.progress ? GAME.progress.CAUA.count : 0;
        const ayla = GAME.progress ? GAME.progress.AYLA.count : 0;

        this._scoreTxt = this.add.text(cx, cy + 30, 'PONTUAÇÃO: ' + (GAME.score || 0), {
            font: 'bold 15px "Courier New", monospace',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this._scoreTxt.anchor.setTo(0.5, 0.5);
        this._scoreTxt.visible = false;

        this._lettersTxt = this.add.text(cx, cy + 56, 'CAUÃ ' + caua + '/4     AYLA ' + ayla + '/4', {
            font: '13px "Courier New", monospace',
            fill: '#9ADFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this._lettersTxt.anchor.setTo(0.5, 0.5);
        this._lettersTxt.visible = false;

        this._hintTxt = this.add.text(cx, cy + 92, 'Pressione  R  para jogar novamente', {
            font: '11px "Courier New", monospace',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        this._hintTxt.anchor.setTo(0.5, 0.5);
        this._hintTxt.visible = false;

        // Countdown: tick once per second (fireworks only start after reveal)
        this._countdown = 10;
        this._countEvent = this.game.time.events.loop(1000, this._tickCountdown, this);
    }

    _tickCountdown() {
        this._countdown--;
        if (this._countdown > 0) {
            this._countTxt.setText(String(this._countdown));
            this._countTxt.scale.setTo(1.7, 1.7);
            this.game.add.tween(this._countTxt.scale)
                .to({ x: 1, y: 1 }, 550, Phaser.Easing.Bounce.Out, true);
        } else {
            this.game.time.events.remove(this._countEvent);
            this._triggerReveal();
        }
    }

    _triggerReveal() {
        const isCaua = this._gender === 'caua';
        this._revealed = true;

        this.game.stage.backgroundColor = isCaua ? '#020E22' : '#220210';

        // Stop gameplay music and play reveal music
        GAME.sound.stopAll();
        const musicKey = isCaua ? 'music-menino' : 'music-menina';
        this.game.add.audio(musicKey).loopFull();

        // Hide countdown, show banner
        this._labelTxt.visible = false;
        this._countTxt.visible = false;

        this._revealTxt.visible = true;
        this._revealTxt.scale.setTo(0.1, 0.1);

        const tw = this.game.add.tween(this._revealTxt.scale)
            .to({ x: 1.08, y: 1.08 }, 560, Phaser.Easing.Back.Out, true);
        tw.onComplete.add(() => {
            this.game.add.tween(this._revealTxt.scale)
                .to({ x: 1, y: 1 }, 160, Phaser.Easing.Linear.None, true);
        });

        // Burst of rockets on reveal
        for (let i = 0; i < 8; i++) {
            this.game.time.events.add(i * 90, this._spawnRocket, this);
        }

        // Increase firework frequency
        this.game.time.events.remove(this._fwTimer);
        this._fwTimer = this.game.time.events.loop(260, this._spawnRocket, this);

        // Show score & hint after 1.3 s
        this.game.time.events.add(1300, function () {
            this._scoreTxt.visible = true;
            this._lettersTxt.visible = true;
            this._hintTxt.visible = true;

            var restart = function () {
                GAME.victory = false;
                this.state.start('Play');
            };
            this.game.input.keyboard.addKey(Phaser.Keyboard.R).onDown.addOnce(restart, this);
            this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(restart, this);
        }, this);
    }

    // ─── Fireworks ───────────────────────────────────────────────────────────

    _spawnRocket() {
        const W = this._W;
        const H = this._H;
        const isCaua = this._gender === 'caua';

        var color;
        if (this._revealed) {
            color = isCaua ? 0x44AAFF : 0xFF44BB;
        } else {
            var palette = [0xFF5555, 0xFFFF55, 0x55FF99, 0x55DDFF, 0xFF88FF, 0xFFAA44, 0xFF88CC, 0x88CCFF];
            color = palette[Math.floor(Math.random() * palette.length)];
        }

        this._rockets.push({
            x:       W * 0.08 + Math.random() * W * 0.84,
            y:       H + 8,
            targetY: H * 0.04 + Math.random() * H * 0.44,
            vy:      -(6 + Math.random() * 4),
            exploded: false,
            color:   color,
            sparks:  []
        });
    }

    update() {
        if (!this._fwLayer || !this._rockets) return;

        var g = this._rockets;
        var fw = this._fwLayer;
        fw.clear();

        for (var i = this._rockets.length - 1; i >= 0; i--) {
            var r = this._rockets[i];

            if (!r.exploded) {
                r.y += r.vy;

                // Rocket dot
                fw.beginFill(r.color, 0.92);
                fw.drawCircle(r.x, r.y, 3);
                fw.endFill();
                // Trail
                fw.beginFill(r.color, 0.32);
                fw.drawCircle(r.x, r.y + 6, 2);
                fw.endFill();

                if (r.y <= r.targetY) {
                    r.exploded = true;
                    var n = 18;
                    for (var j = 0; j < n; j++) {
                        var angle = (j / n) * Math.PI * 2;
                        var spd   = 1.8 + Math.random() * 3.0;
                        r.sparks.push({
                            x:  r.x,
                            y:  r.y,
                            vx: Math.cos(angle) * spd,
                            vy: Math.sin(angle) * spd,
                            alpha: 1,
                            sz: 2 + Math.random() * 2.5
                        });
                    }
                }
            } else {
                var alive = false;
                for (var s = 0; s < r.sparks.length; s++) {
                    var sp = r.sparks[s];
                    if (sp.alpha <= 0) continue;
                    sp.x  += sp.vx;
                    sp.y  += sp.vy;
                    sp.vy += 0.08;   // gravity
                    sp.alpha -= 0.018;
                    if (sp.alpha > 0) {
                        alive = true;
                        fw.beginFill(r.color, sp.alpha);
                        fw.drawCircle(sp.x, sp.y, sp.sz);
                        fw.endFill();
                    }
                }
                if (!alive) this._rockets.splice(i, 1);
            }
        }
    }

    // ─── Classic screens (game over / victory sem gênero) ────────────────────

    _buildVictory(cx, cy, score) {
        this.game.stage.backgroundColor = '#1a2a6c';
        var t = this.add.text(cx, cy - 46, 'VOCÊ VENCEU!',
            { font: 'bold 26px Arial', fill: '#ffeb3b', stroke: '#000', strokeThickness: 5 });
        t.anchor.setTo(0.5);
        this._addScoreAndRestart(cx, cy, score);
    }

    _buildGameOver(cx, cy, score) {
        this.game.stage.backgroundColor = '#101010';
        var t = this.add.text(cx, cy - 46, 'GAME OVER',
            { font: 'bold 26px Arial', fill: '#ff5252', stroke: '#000', strokeThickness: 5 });
        t.anchor.setTo(0.5);
        this._addScoreAndRestart(cx, cy, score);
    }

    _addScoreAndRestart(cx, cy, score) {
        var caua = GAME.progress ? GAME.progress.CAUA.count : 0;
        var ayla = GAME.progress ? GAME.progress.AYLA.count : 0;

        this.add.text(cx, cy - 2, 'PONTUAÇÃO: ' + score,
            { font: 'bold 14px Arial', fill: '#fff', stroke: '#000', strokeThickness: 3 })
            .anchor.setTo(0.5);

        this.add.text(cx, cy + 22, 'CAUÃ ' + caua + '/4     AYLA ' + ayla + '/4',
            { font: '12px Arial', fill: '#9adfff', stroke: '#000', strokeThickness: 3 })
            .anchor.setTo(0.5);

        this.add.text(cx, cy + 58, 'Pressione  R  para jogar novamente',
            { font: '12px Arial', fill: '#ffffff', stroke: '#000', strokeThickness: 3 })
            .anchor.setTo(0.5);

        var restart = function () {
            GAME.victory = false;
            this.state.start('Play');
        };
        this.game.input.keyboard.addKey(Phaser.Keyboard.R).onDown.addOnce(restart, this);
        this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.addOnce(restart, this);
    }
}
