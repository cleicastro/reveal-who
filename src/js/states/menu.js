export default class Menu extends Phaser.State {

    preload() {
        this.load.atlasJSONHash('peach', 'assets/images/sprites/peach.png', 'assets/images/sprites/peach.json');
    }

    create() {
        this.selected = 0; // 0=Menino, 1=Menina
        this._confirmed = false;

        // Reset camera scroll from any previous Play state (world bounds stay at MAP size from boot.js)
        this.camera.setPosition(0, 0);

        const cx = Math.floor(this.game.width / 2);
        const W  = this.game.width;
        const H  = this.game.height;

        // Card layout
        const cardW = 90;
        const cardH = 155;
        const gap   = 30;
        const cardY = 48;

        this._leftX  = cx - gap / 2 - cardW;
        this._rightX = cx + gap / 2;
        this._cardY  = cardY;
        this._cardW  = cardW;
        this._cardH  = cardH;
        this._cardCenters = [this._leftX + cardW / 2, this._rightX + cardW / 2];
        this._cardBounds  = [
            { x: this._leftX,  y: cardY, w: cardW, h: cardH },
            { x: this._rightX, y: cardY, w: cardW, h: cardH }
        ];

        this._drawBackground(W, H, cx);
        this._drawTitle(cx);
        this._drawCards(cardY, cardW, cardH);
        this._createCursor();
        this._drawHint(cx, H);
        this._setupInput();
    }

    // ─── Background ──────────────────────────────────────────────────────────

    _drawBackground(W, H, cx) {
        const g = this.game.add.graphics(0, 0);

        g.beginFill(0x5080EE);
        g.drawRect(0, 0, W, H);
        g.endFill();

        // Clouds
        this._drawCloud(g, W * 0.12, 28);
        this._drawCloud(g, W * 0.52, 18);
        this._drawCloud(g, W * 0.78, 35);

        // Stars decoration
        const starStyle = { font: '12px monospace', fill: '#FFFF88', align: 'center' };
        this.game.add.text(cx - 120, 8, '✦', starStyle).anchor.setTo(0.5, 0);
        this.game.add.text(cx + 120, 8, '✦', starStyle).anchor.setTo(0.5, 0);

        // Ground
        g.beginFill(0x44AA44);
        g.drawRect(0, H - 28, W, 8);
        g.endFill();
        g.beginFill(0x7B5228);
        g.drawRect(0, H - 20, W, 20);
        g.endFill();
    }

    _drawCloud(g, x, y) {
        g.beginFill(0xFFFFFF, 0.88);
        g.drawEllipse(x,      y,      28, 14);
        g.drawEllipse(x + 14, y - 5,  22, 12);
        g.drawEllipse(x + 26, y + 2,  24, 12);
        g.endFill();
    }

    // ─── Title ───────────────────────────────────────────────────────────────

    _drawTitle(cx) {
        const title = this.game.add.text(cx, 10, 'CAUÃ OU AYLA?', {
            font: 'bold 18px "Courier New", monospace',
            fill: '#FFFF44',
            stroke: '#333300',
            strokeThickness: 4,
            align: 'center'
        });
        title.anchor.setTo(0.5, 0);
        this.game.add.tween(title.scale)
            .to({ x: 1.06, y: 1.06 }, 700, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    }

    // ─── Character cards ─────────────────────────────────────────────────────

    _drawCards(cardY, cardW, cardH) {
        const { _leftX: leftX, _rightX: rightX } = this;
        const charCY = cardY + 74;

        // Blue card – Menino
        const gL = this.game.add.graphics(0, 0);
        gL.beginFill(0x0E4FBE, 0.90);
        gL.lineStyle(3, 0xFFFFFF, 1);
        gL.drawRoundedRect(leftX, cardY, cardW, cardH, 8);
        gL.endFill();

        // Pink card – Menina
        const gR = this.game.add.graphics(0, 0);
        gR.beginFill(0xCC3388, 0.90);
        gR.lineStyle(3, 0xFFFFFF, 1);
        gR.drawRoundedRect(rightX, cardY, cardW, cardH, 8);
        gR.endFill();

        // Mario sprite (big, standing)
        const mario = this.game.add.sprite(leftX + cardW / 2, charCY, 'mario', 105);
        mario.scale.setTo(2, 2);
        mario.anchor.setTo(0.5, 0.5);
        // Subtle idle bounce
        this.game.add.tween(mario)
            .to({ y: charCY - 4 }, 550, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

        // Peach sprite – Salute (loop) animation
        const peach = this.game.add.sprite(rightX + cardW / 2, charCY, 'peach', 'salute_0');
        peach.scale.setTo(2, 2);
        peach.anchor.setTo(0.5, 0.5);
        peach.animations.add('salute', ['salute_0', 'salute_1'], 4, true);
        peach.animations.play('salute');
        this.game.add.tween(peach)
            .to({ y: charCY - 4 }, 550, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

        // Labels
        const baseLabel = {
            font: 'bold 13px "Courier New", monospace',
            fill: '#FFFFFF',
            strokeThickness: 3,
            align: 'center'
        };

        const lm = this.game.add.text(leftX + cardW / 2, cardY + 126, 'CAUÃ',
            Object.assign({}, baseLabel, { stroke: '#001166' }));
        lm.anchor.setTo(0.5, 0.5);

        const lf = this.game.add.text(rightX + cardW / 2, cardY + 126, 'AYLA',
            Object.assign({}, baseLabel, { stroke: '#440022' }));
        lf.anchor.setTo(0.5, 0.5);
    }

    // ─── Selection cursor ────────────────────────────────────────────────────

    _createCursor() {
        const baseY = this._cardY - 5;
        const g     = this.game.add.graphics(this._cardCenters[this.selected], baseY);

        g.beginFill(0xFFFF00, 1);
        g.lineStyle(2, 0x555500, 1);
        g.moveTo(-8, -13);
        g.lineTo( 8, -13);
        g.lineTo( 0,   0);
        g.lineTo(-8, -13); // close triangle manually (PIXI v1 has no closePath)
        g.endFill();

        this.cursor      = g;
        this._cursorBaseY = baseY;
        this._startCursorTween();
    }

    _startCursorTween() {
        this.game.add.tween(this.cursor)
            .to({ y: this._cursorBaseY - 7 }, 420, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    }

    _updateCursor() {
        this.game.tweens.removeFrom(this.cursor);
        this.cursor.x = this._cardCenters[this.selected];
        this.cursor.y = this._cursorBaseY;
        this._startCursorTween();
    }

    // ─── Hint ────────────────────────────────────────────────────────────────

    _drawHint(cx, H) {
        const hint = this.game.add.text(cx, H - 26,
            '◄ ►  escolher     ENTER  revelar', {
            font: '10px "Courier New", monospace',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 2,
            align: 'center'
        });
        hint.anchor.setTo(0.5, 0);
    }

    // ─── Input ───────────────────────────────────────────────────────────────

    _setupInput() {
        const left  = this.game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        const right = this.game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        const enter = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        const s     = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        const space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        left.onDown.add(() => {
            if (this.selected !== 0) { this.selected = 0; this._updateCursor(); }
        });
        right.onDown.add(() => {
            if (this.selected !== 1) { this.selected = 1; this._updateCursor(); }
        });
        enter.onDown.add(this._confirm, this);
        s.onDown.add(this._confirm, this);
        space.onDown.add(this._confirm, this);

        this.game.input.onDown.add(this._onPointerDown, this);
    }

    _onPointerDown(pointer) {
        if (this._confirmed) return;
        const px = pointer.worldX;
        const py = pointer.worldY;

        for (let i = 0; i < 2; i++) {
            const b = this._cardBounds[i];
            if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) {
                if (this.selected !== i) {
                    this.selected = i;
                    this._updateCursor();
                } else {
                    this._confirm();
                }
                return;
            }
        }
    }

    // ─── Confirm / reveal ────────────────────────────────────────────────────

    _confirm() {
        if (this._confirmed) return;
        this._confirmed = true;

        const isCaua = this.selected === 0;
        window.PLAYER_GENDER = isCaua ? 'caua' : 'ayla';

        const label = isCaua ? 'CAUÃ!' : 'AYLA!';
        const color = isCaua ? '#44AAFF' : '#FF44AA';

        const banner = this.game.add.text(
            Math.floor(this.game.width / 2), Math.floor(this.game.height / 2), label, {
            font: 'bold 38px "Courier New", monospace',
            fill: color,
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        });
        banner.anchor.setTo(0.5, 0.5);
        banner.scale.setTo(0.1, 0.1);

        const tw = this.game.add.tween(banner.scale)
            .to({ x: 1.15, y: 1.15 }, 420, Phaser.Easing.Back.Out, true);
        tw.onComplete.add(() => {
            this.game.time.events.add(650, () => this.state.start('Play'), this);
        });
    }
}
