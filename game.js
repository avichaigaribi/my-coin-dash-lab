/* global Phaser, COIN_DASH */
const HIGH_SCORE_KEY = 'coinDashHighScore';

function loadHighScore() {
  try {
    const value = parseInt(localStorage.getItem(HIGH_SCORE_KEY), 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch (e) { return 0; } // storage unavailable (private mode, blocked)
}

function saveHighScore(value) {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(value)); } catch (e) { /* ignore */ }
}

class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.highScore = loadHighScore();
    this.finished = false;
    this.banner = null;
    this.themeName = this.themeName || c.startTheme;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.grid = this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveHighScore(this.highScore);
      }
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-T', () => this.toggleTheme());
    this.applyTheme();
  }

  toggleTheme() {
    const names = Object.keys(COIN_DASH.themes);
    this.themeName = names[(names.indexOf(this.themeName) + 1) % names.length];
    this.applyTheme();
  }

  // Recolour everything that is already on screen; new objects pick the theme up via style().
  applyTheme() {
    const t = COIN_DASH.themes[this.themeName];
    this.cameras.main.setBackgroundColor(t.background);
    document.body.style.background = t.page;
    this.grid.setFillStyle(t.background, 1).setOutlineStyle(t.gridLine, t.gridAlpha);
    this.hud.setColor(t.text);
    this.style(this.player, t.player);
    this.style(this.coin, t.coin);
    this.drones.getChildren().forEach(drone => this.style(drone, t.drone));
    if (this.banner) this.banner.setColor(t.text);
  }

  // Fill a shape with `color`; in a glowing theme also outline it and add a soft glow where the renderer allows.
  style(shape, color) {
    const t = COIN_DASH.themes[this.themeName];
    shape.setFillStyle(color);
    shape.postFX?.clear();
    if (!t.glow) return shape.setStrokeStyle();
    shape.setStrokeStyle(2, 0xffffff, 0.9);
    shape.postFX?.addGlow(color, 4, 0, false, 0.2, 12);
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}   Best: ${this.highScore}   Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 150, 0x0a1120, 0.95);
    this.banner = this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected\nPress R to try again`,
      { font: '24px monospace', color: COIN_DASH.themes[this.themeName].text, align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.themes[COIN_DASH.startTheme].background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
