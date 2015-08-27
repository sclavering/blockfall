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
const HEX_SLOPE_WIDTH = 5;

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
  const grid_colours = ["#333333", "black", "black"];

  const sqr_filled_tiles = k_gradient_colours.map(create_sqr_tile);
  let sqr_tile_images = [create_sqr_tile(grid_colours)];
  // Pretty sure blocks.js assumes a certain number of styles are available, so make sure they are.
  while(sqr_tile_images.length < SQR_NUM_STYLES) sqr_tile_images = sqr_tile_images.concat(sqr_filled_tiles);
  k_tilesets.sqr.odd_tile_images = k_tilesets.sqr.even_tile_images = sqr_tile_images;

  const hex_filled_tiles = k_gradient_colours.map(create_hex_tile_pair);
  const hex_even_filled_tiles = hex_filled_tiles.map(x => x[0]);
  const hex_odd_filled_tiles = hex_filled_tiles.map(x => x[1]);
  const hex_empty_tiles = create_hex_tile_pair(grid_colours);
  let hex_even_tiles = [hex_empty_tiles[0]];
  let hex_odd_tiles = [hex_empty_tiles[1]];
  while(hex_odd_tiles.length < HEX_NUM_STYLES) {
    hex_odd_tiles = hex_odd_tiles.concat(hex_odd_filled_tiles);
    hex_even_tiles = hex_even_tiles.concat(hex_even_filled_tiles);
  }
  k_tilesets.hex.odd_tile_images = hex_odd_tiles;
  k_tilesets.hex.even_tile_images = hex_even_tiles;

  const tri_filled_left_tiles = k_gradient_colours.map(create_tri_left_tile);
  const tri_filled_right_tiles = k_gradient_colours.map(create_tri_right_tile);
  let tri_left_tiles = [create_tri_left_tile(grid_colours)];
  let tri_right_tiles = [create_tri_right_tile(grid_colours)];
  while(tri_left_tiles.length < TRI_NUM_STYLES) {
    tri_left_tiles = tri_left_tiles.concat(tri_filled_left_tiles);
    tri_right_tiles = tri_right_tiles.concat(tri_filled_right_tiles);
  }
  k_tilesets.tri.even_tile_images = tri_left_tiles;
  k_tilesets.tri.odd_tile_images = tri_right_tiles;
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
        let tile_image = (tile_odd ? this._tileset.odd_tile_images : this._tileset.even_tile_images)[val];
        let dx = x * this._tileset.x_offset, dy = (y + y0) * this._tileset.y_offset;
        this._context.drawImage(tile_image, 0, 0, this._tileset.width, this._tileset.height, dx, dy, this._tileset.width, this._tileset.height);
      }
    }
  },
};


function create_tile(colours, width, height, path_callback) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colours[1]);
  gradient.addColorStop(1, colours[2]);
  path_callback(ctx);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = colours[0];
  ctx.stroke();
  return canvas;
};


function create_sqr_tile(colours) {
  return create_tile(colours, SQR_SIZE, SQR_SIZE, ctx => {
    ctx.beginPath();
    ctx.moveTo(0.5, 0.5);
    ctx.lineTo(SQR_SIZE - 0.5, 0.5);
    ctx.lineTo(SQR_SIZE - 0.5, SQR_SIZE - 0.5);
    ctx.lineTo(0.5, SQR_SIZE - 0.5);
    ctx.closePath();
  });
};


function create_hex_tile_pair(colours) {
  const tmp = create_tile(colours, HEX_WIDTH, HEX_HALF_HEIGHT * 2, ctx => {
    ctx.beginPath();
    ctx.moveTo(0.5, HEX_HALF_HEIGHT - 0.5);
    ctx.lineTo(HEX_SLOPE_WIDTH + 0.5, 0.5);
    ctx.lineTo(HEX_WIDTH - HEX_SLOPE_WIDTH - 0.5, 0.5);
    ctx.lineTo(HEX_WIDTH - 0.5, HEX_HALF_HEIGHT - 0.5);
    ctx.lineTo(HEX_WIDTH - 0.5, HEX_HALF_HEIGHT + 0.5);
    ctx.lineTo(HEX_WIDTH - HEX_SLOPE_WIDTH - 0.5, 2 * HEX_HALF_HEIGHT - 0.5);
    ctx.lineTo(HEX_SLOPE_WIDTH + 0.5, 2 * HEX_HALF_HEIGHT - 0.5);
    ctx.lineTo(0.5, HEX_HALF_HEIGHT + 0.5);
    ctx.lineTo(0.5, HEX_HALF_HEIGHT - 0.5);
  });
  const top = document.createElement("canvas");
  const btm = document.createElement("canvas");
  top.width = btm.width = HEX_WIDTH;
  top.height = btm.height = HEX_HALF_HEIGHT;
  top.getContext("2d").drawImage(tmp, 0, 0, HEX_WIDTH, HEX_HALF_HEIGHT, 0, 0, HEX_WIDTH, HEX_HALF_HEIGHT);
  btm.getContext("2d").drawImage(tmp, 0, HEX_HALF_HEIGHT, HEX_WIDTH, HEX_HALF_HEIGHT, 0, 0, HEX_WIDTH, HEX_HALF_HEIGHT);
  return [top, btm];
};


function create_tri_left_tile(colours) {
  return create_tile(colours, TRI_WIDTH, TRI_HALF_HEIGHT * 2, ctx => {
    ctx.beginPath();
    ctx.moveTo(0.5, TRI_HALF_HEIGHT);
    ctx.lineTo(TRI_WIDTH - 0.5, 0.5);
    ctx.lineTo(TRI_WIDTH - 0.5, TRI_HALF_HEIGHT * 2 - 0.5);
    ctx.closePath();
  });
};


function create_tri_right_tile(colours) {
  return create_tile(colours, TRI_WIDTH, TRI_HALF_HEIGHT * 2, ctx => {
    ctx.beginPath();
    ctx.moveTo(TRI_WIDTH - 0.5, TRI_HALF_HEIGHT);
    ctx.lineTo(0.5, 0.5);
    ctx.lineTo(0.5, TRI_HALF_HEIGHT * 2 - 0.5);
    ctx.closePath();
  });
};
