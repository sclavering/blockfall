// Code related to drawing tiles (i.e. squares, or half-hexes).

var g_tileset = null;


const SQR_NUM_STYLES = 31;
const SQR_SIZE = 20;

const HEX_NUM_STYLES = 13;
const HEX_WIDTH = 24;
const HEX_HALF_HEIGHT = 10;
const HEX_X_OFFSET = 19;

const TRI_NUM_STYLES = 6;
const TRI_WIDTH = 19;
const TRI_HALF_HEIGHT = 10;

const k_tilesets = {
  sqr: {
    width: SQR_SIZE,
    height: SQR_SIZE,
    xOffset: SQR_SIZE,
    yOffset: SQR_SIZE,
  },
  hex: {
    width: HEX_WIDTH,
    height: HEX_HALF_HEIGHT,
    xOffset: HEX_X_OFFSET,
    yOffset: HEX_HALF_HEIGHT,
  },
  tri: {
    width: TRI_WIDTH,
    height: TRI_HALF_HEIGHT * 2,
    xOffset: TRI_WIDTH,
    yOffset: TRI_HALF_HEIGHT,
  },
};

function init_tilesets() {
  const sqr_tile_tops = [];
  // Note: the +1 is because there's an unused completely-black (no gridlines) version of the empty square.
  for(let i = 0; i <= SQR_NUM_STYLES; ++i) sqr_tile_tops[i] = (i + 1) * SQR_SIZE;
  k_tilesets.sqr.odd_tile_tops = sqr_tile_tops;
  k_tilesets.sqr.even_tile_tops = sqr_tile_tops;
  k_tilesets.sqr.image = ui.sqr_tiles;

  const hex_odd_tile_tops = [];
  const hex_even_tile_tops = [];
  for(let i = 0; i <= HEX_NUM_STYLES; ++i) {
    let h = hex_even_tile_tops[i] = (i + 1) * 2 * HEX_HALF_HEIGHT;
    hex_odd_tile_tops[i] = h + HEX_HALF_HEIGHT;
  }
  k_tilesets.hex.odd_tile_tops = hex_odd_tile_tops;
  k_tilesets.hex.even_tile_tops = hex_even_tile_tops;
  k_tilesets.hex.image = ui.hex_tiles;

  const tri_odd_tile_tops = [];
  const tri_even_tile_tops = [];
  for(let i = 0; i <= TRI_NUM_STYLES; ++i) {
    let h = tri_even_tile_tops[i] = (i + 1) * 4 * TRI_HALF_HEIGHT;
    tri_odd_tile_tops[i] = h + 2 * TRI_HALF_HEIGHT;
  }
  k_tilesets.tri.odd_tile_tops = tri_odd_tile_tops;
  k_tilesets.tri.even_tile_tops = tri_even_tile_tops;
  k_tilesets.tri.image = ui.tri_tiles;
};


function draw_tiles(context, grid, firstTileOdd, flags) {
  const y0 = flags.y || 0;
  const draw_empties = flags.draw_empties || false;
  const h = grid.length, w = grid[0].length;
  for(let y = 0; y !== h; ++y, firstTileOdd = !firstTileOdd) {
    for(let x = 0, tileOdd = firstTileOdd; x !== w; ++x, tileOdd = !tileOdd) {
      let val = grid[y][x];
      if(!val && !draw_empties) continue;
      let tile_top = (tileOdd ? g_tileset.odd_tile_tops : g_tileset.even_tile_tops)[val];
      let dx = x * g_tileset.xOffset, dy = (y + y0) * g_tileset.yOffset;
      context.drawImage(g_tileset.image, 0, tile_top, g_tileset.width, g_tileset.height, dx, dy, g_tileset.width, g_tileset.height);
    }
  }
};


function GridView(canvas) {
  this._canvas = canvas;
  this._context = this._canvas.getContext("2d");
};
GridView.prototype = {
  resize: function(w, h) {
    this._canvas.width = w * g_tileset.xOffset - g_tileset.xOffset + g_tileset.width;
    this._canvas.height = h * g_tileset.yOffset - g_tileset.yOffset + g_tileset.height;
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  },

  position: function(x, y) {
    this._canvas.style.left = (x * g_tileset.xOffset) + "px";
    this._canvas.style.top = (y * g_tileset.yOffset) + "px";
  },

  draw: function(grid, firstTileOdd, flags) {
    draw_tiles(this._context, grid, firstTileOdd, flags);
  },
};
