// Code related to drawing tiles (i.e. squares, or half-hexes).

const k_tile_colours = [
  // The colours for the special background-with-gridlines tile:
  ["#333333", "black", "black"],
  // Actual tiles:
  ["hsl( 41, 66%, 53%)", "hsl( 44, 99%, 72%)", "hsl( 38, 99%, 65%)"],
  ["hsl( 88, 48%, 51%)", "hsl( 85, 90%, 68%)", "hsl( 85, 69%, 61%)"],
  ["hsl( 50, 66%, 57%)", "hsl( 52, 99%, 74%)", "hsl( 47, 99%, 68%)"],
  ["hsl(195, 66%, 57%)", "hsl(198, 96%, 73%)", "hsl(193, 80%, 65%)"],
  ["hsl(  1, 66%, 59%)", "hsl(  3, 98%, 75%)", "hsl(358, 99%, 68%)"],
  ["hsl(306, 66%, 59%)", "hsl(309, 97%, 75%)", "hsl(303, 85%, 67%)"],
];

const SQR_SIZE = 20;

const HEX_WIDTH = 24;
const HEX_HALF_HEIGHT = 10;
const HEX_X_OFFSET = 19;
const HEX_SLOPE_WIDTH = 5;

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
  k_tilesets.sqr.odd_tile_images = k_tilesets.sqr.even_tile_images = k_tile_colours.map(create_sqr_tile);

  const hex_tile_pairs = k_tile_colours.map(create_hex_tile_pair);
  k_tilesets.hex.even_tile_images = hex_tile_pairs.map(x => x[0]);
  k_tilesets.hex.odd_tile_images = hex_tile_pairs.map(x => x[1]);

  k_tilesets.tri.even_tile_images = k_tile_colours.map(create_tri_left_tile);
  k_tilesets.tri.odd_tile_images = k_tile_colours.map(create_tri_right_tile);
};


class GridView {
  constructor(tileset, canvas) {
    this._tileset = tileset;
    this._canvas = canvas;
    this._context = this._canvas.getContext("2d");
  }

  resize(w, h) {
    this._canvas.width = w * this._tileset.x_offset - this._tileset.x_offset + this._tileset.width;
    this._canvas.height = h * this._tileset.y_offset - this._tileset.y_offset + this._tileset.height;
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  position(x, y) {
    this._canvas.style.left = (x * this._tileset.x_offset) + "px";
    this._canvas.style.top = (y * this._tileset.y_offset) + "px";
  }

  draw(grid, first_tile_odd, flags) {
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
  }
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
