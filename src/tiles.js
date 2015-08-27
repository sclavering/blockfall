// Code related to drawing tiles (i.e. squares, or half-hexes).

const k_gradient_colours = [
  ["hsl( 41, 66%, 53%)", "hsl( 44, 99%, 72%)", "hsl( 38, 99%, 65%)"],
  ["hsl( 88, 48%, 51%)", "hsl( 85, 90%, 68%)", "hsl( 85, 69%, 61%)"],
  ["hsl( 50, 66%, 57%)", "hsl( 52, 99%, 74%)", "hsl( 47, 99%, 68%)"],
  ["hsl(195, 66%, 57%)", "hsl(198, 96%, 73%)", "hsl(193, 80%, 65%)"],
  ["hsl(  1, 66%, 59%)", "hsl(  3, 98%, 75%)", "hsl(358, 99%, 68%)"],
  ["hsl(306, 66%, 59%)", "hsl(309, 97%, 75%)", "hsl(303, 85%, 67%)"],
];

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
    x_offset: SQR_SIZE,
    y_offset: SQR_SIZE,
  },
  hex: {
    width: HEX_WIDTH,
    height: HEX_HALF_HEIGHT,
    x_offset: HEX_X_OFFSET,
    y_offset: HEX_HALF_HEIGHT,
  },
  tri: {
    width: TRI_WIDTH,
    height: TRI_HALF_HEIGHT * 2,
    x_offset: TRI_WIDTH,
    y_offset: TRI_HALF_HEIGHT,
  },
};

function init_tilesets() {
  const sqr_empty_tile = create_sqr_tile(["#333333", "black", "black"]);
  const sqr_filled_tiles = k_gradient_colours.map(create_sqr_tile);
  const sqr_tile_tops = [];
  for(let i = 0; i <= SQR_NUM_STYLES; ++i) sqr_tile_tops[i] = 0;
  let sqr_tile_images = [].concat(sqr_empty_tile, sqr_filled_tiles);
  // Pretty sure blocks.js assumes a certain number of styles are available, so make sure they are.
  while(sqr_tile_images.length < SQR_NUM_STYLES) sqr_tile_images = sqr_tile_images.concat(sqr_filled_tiles);
  k_tilesets.sqr.odd_tile_images = k_tilesets.sqr.even_tile_images = sqr_tile_images;
  k_tilesets.sqr.odd_tile_tops = k_tilesets.sqr.even_tile_tops = sqr_tile_tops;

  const hex_odd_tile_tops = [];
  const hex_even_tile_tops = [];
  const hex_tile_images = [];
  for(let i = 0; i <= HEX_NUM_STYLES; ++i) {
    // Note: the +1 is because there's an unused completely-black (no gridlines) version of the empty hex
    let h = hex_even_tile_tops[i] = (i + 1) * 2 * HEX_HALF_HEIGHT;
    hex_odd_tile_tops[i] = h + HEX_HALF_HEIGHT;
    hex_tile_images[i] = ui.hex_tiles;
  }
  k_tilesets.hex.odd_tile_tops = hex_odd_tile_tops;
  k_tilesets.hex.even_tile_tops = hex_even_tile_tops;
  k_tilesets.hex.odd_tile_images = hex_tile_images;
  k_tilesets.hex.even_tile_images = hex_tile_images;

  const tri_odd_tile_tops = [];
  const tri_even_tile_tops = [];
  const tri_tile_images = [];
  for(let i = 0; i <= TRI_NUM_STYLES; ++i) {
    // Note: the +1 is because there's an unused completely-black (no gridlines) version of the empty triangle
    let h = tri_even_tile_tops[i] = (i + 1) * 4 * TRI_HALF_HEIGHT;
    tri_odd_tile_tops[i] = h + 2 * TRI_HALF_HEIGHT;
    tri_tile_images[i] = ui.tri_tiles;
  }
  k_tilesets.tri.odd_tile_tops = tri_odd_tile_tops;
  k_tilesets.tri.even_tile_tops = tri_even_tile_tops;
  k_tilesets.tri.odd_tile_images = tri_tile_images;
  k_tilesets.tri.even_tile_images = tri_tile_images;
};


function GridView(tileset, canvas) {
  this._tileset = tileset;
  this._canvas = canvas;
  this._context = this._canvas.getContext("2d");
};
GridView.prototype = {
  resize: function(w, h) {
    this._canvas.width = w * this._tileset.x_offset - this._tileset.x_offset + this._tileset.width;
    this._canvas.height = h * this._tileset.y_offset - this._tileset.y_offset + this._tileset.height;
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  },

  position: function(x, y) {
    this._canvas.style.left = (x * this._tileset.x_offset) + "px";
    this._canvas.style.top = (y * this._tileset.y_offset) + "px";
  },

  draw: function(grid, first_tile_odd, flags) {
    const y0 = flags.y || 0;
    const draw_empties = flags.draw_empties || false;
    const h = grid.length, w = grid[0].length;
    for(let y = 0; y !== h; ++y, first_tile_odd = !first_tile_odd) {
      for(let x = 0, tile_odd = first_tile_odd; x !== w; ++x, tile_odd = !tile_odd) {
        let val = grid[y][x];
        if(!val && !draw_empties) continue;
        let tile_top = (tile_odd ? this._tileset.odd_tile_tops : this._tileset.even_tile_tops)[val];
        let tile_image = (tile_odd ? this._tileset.odd_tile_images : this._tileset.even_tile_images)[val];
        let dx = x * this._tileset.x_offset, dy = (y + y0) * this._tileset.y_offset;
        this._context.drawImage(tile_image, 0, tile_top, this._tileset.width, this._tileset.height, dx, dy, this._tileset.width, this._tileset.height);
      }
    }
  },
};


function create_sqr_tile(colours) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SQR_SIZE;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, SQR_SIZE);
  gradient.addColorStop(0, colours[1]);
  gradient.addColorStop(1, colours[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SQR_SIZE, SQR_SIZE);
  ctx.strokeStyle = colours[0];
  ctx.strokeRect(0.5, 0.5, SQR_SIZE - 1, SQR_SIZE - 1);
  return canvas;
};
