// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  // Press T in game to switch. `glow: true` outlines the player, coin and drones and adds a glow where supported.
  startTheme: 'classic',
  themes: {
    classic: {
      background: 0x101c31, gridLine: 0x24334b, gridAlpha: 0.45, page: '#0a1120',
      player: 0x71e8ce, coin: 0xffd166, drone: 0xff657a, glow: null, text: '#ffffff'
    },
    neon: {
      background: 0x07030f, gridLine: 0xb026ff, gridAlpha: 0.35, page: '#04010a',
      player: 0x00fff0, coin: 0xfff200, drone: 0xff2d95, glow: true, text: '#e8fbff'
    }
  }
};
