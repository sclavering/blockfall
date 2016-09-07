// A block is represented as an array of its possible orientations.  Each orientation consists of a y-x-indexed grid of tiles.  Tiles are just ints, with zero meaning empty, and any other number representing a solid tile (the value just determines the colour used).  For hexagonal games, a tile is either the top half or bottom half of a hexagon (depending on position in the grid).  For triangular games, it is always a whole triangle, but is either a left-pointing or right-pointing one depending on position in the grid.

// The API to this file is just a single function: get_block_sets(shape, sizes), where shape is "sqr"/"hex"/"tri", and sizes is an array of ordinals into the defined sets of blocks for that shape.

var get_block_sets = (function() {

const max_block_number = k_tile_colours.length;

const blocks = {};


function new_empty_block_state(width, height) {
  const rv = new Array(height);
  for(let y = 0; y !== height; ++y) {
    rv[y] = new Array(width);
    for(let x = 0; x !== width; ++x) rv[y][x] = 0;
  }
  return rv;
}

function new_block_state(width, height, x, y, xmoves, ymoves, prepath, path, block_colour_num, for_hex) {
  const state = new_empty_block_state(width, height);
  for(let n = 0; n != prepath.length; ++n) {
    x += xmoves[prepath[n]];
    y += ymoves[prepath[n]];
  }
  state[y][x] = block_colour_num;
  if(for_hex) state[y + 1][x] = block_colour_num;
  for(let k = 0; k != path.length; ++k) {
    x += xmoves[path[k]];
    y += ymoves[path[k]];
    state[y][x] = block_colour_num;
    if(for_hex) state[y + 1][x] = block_colour_num;
  }
  return state;
}

function create_block_rotations(num_states, pre_path, path, direction_rotator, state_func) {
  const block = new Array(num_states);
  let s = 0;
  while(true) {
    block[s] = state_func(s, pre_path, path);
    if(++s === num_states) break;
    pre_path = pre_path.map(direction_rotator);
    path = path.map(direction_rotator);
  }
  return block;
}



// Square blocks ==========================================

// Direction consts for square blocks (they're compass directions).
const sN = 0, sNE = 1, sE = 2, sSE = 3, sS = 4, sSW = 5, sW = 6, sNW = 7;
// These map one of the above consts to the x-y coordinate changes needed to move in that direction.  (They're trivial for square tiles, but not for hex/tri tiles.)
const sqr_xmoves = [0, 1, 1, 1, 0, -1, -1, -1];
const sqr_ymoves = [-1, -1, 0, 1, 1, 1, 0, -1];

let sqr_prev_number = 1;

function createSqrBlock(size: number, pre_path: number[], path: number[], num_states?: number) {
  // use the square in the middle, or above and to the left of the middle
  const origin = Math.ceil(size / 2) - 1;

  const block_num = sqr_prev_number++;
  if(sqr_prev_number === max_block_number) sqr_prev_number = 1;

  return create_block_rotations(num_states || 4, pre_path, path, dir => (dir + 2) % 8, (s, pre_path, path) => {
    return new_block_state(size, size, origin, origin, sqr_xmoves, sqr_ymoves, pre_path, path, block_num, false);
  });
}

blocks["sqr"] = {
  // 3-tile blocks.  diagonal joins allowed
  small: [
    createSqrBlock(3, [sW], [sE,sE], 2),
    createSqrBlock(3, [sS], [sN,sE]),
    createSqrBlock(3, [sW], [sSE,sNE]),
    createSqrBlock(3, [sW], [sE,sSE]),
    createSqrBlock(3, [sSW], [sNE,sE]),
    createSqrBlock(3, [sSW], [sNE,sNE], 2),
  ],
  // 4-tile blocks
  std: [
    // l
    createSqrBlock(3, [sE], [sW,sW,sS]),
    // f
    createSqrBlock(3, [sW], [sE,sE,sS]),
    // o
    createSqrBlock(3, [], [sS,sE,sN], 1),
    // t
    createSqrBlock(3, [], [sW,sE,sS,sN,sE]),
    // s
    createSqrBlock(3, [sE], [sW,sS,sW], 2),
    // z
    createSqrBlock(3, [sW], [sE,sS,sE], 2),
    // i
    createSqrBlock(4, [sW], [sE,sE,sE], 2),
  ],
  // 5-tile blocks
  large: [
    // f
    createSqrBlock(5, [sE,sS], [sN,sW,sW,sW]),
    createSqrBlock(5, [sW,sS], [sN,sE,sE,sE]),
    // t
    createSqrBlock(5, [sS], [sN,sE,sW,sW,sW]),
    createSqrBlock(5, [sS], [sN,sW,sE,sE,sE]),
    // I
    createSqrBlock(5, [sE,sE], [sW,sW,sW,sW]),
    // b
    createSqrBlock(5, [sE], [sW,sW,sS,sE]),
    createSqrBlock(5, [sW], [sE,sE,sS,sW]),
    // +
    createSqrBlock(5, [], [sN,sSE,sSW,sNW], 1),
    // S
    createSqrBlock(3, [sW,sN], [sS,sE,sE,sS], 2),
    createSqrBlock(5, [sW,sS], [sN,sE,sE,sN], 2),
    // u
    createSqrBlock(5, [sW,sS], [sN,sE,sE,sS]),
    // r (corner)
    createSqrBlock(5, [sS,sS], [sN,sN,sE,sE]),
    // w
    createSqrBlock(5, [sW,sS], [sN,sE,sN,sE]),
    // T
    createSqrBlock(5, [sN], [sS,sS,sN,sE,sE]),
    // squiggle
    createSqrBlock(5, [sN,sE], [sW,sS,sW,sW]),
    createSqrBlock(5, [sN,sW], [sE,sS,sE,sE]),
    // 4
    createSqrBlock(5, [sS], [sN,sE,sW,sW,sN]),
    createSqrBlock(5, [sS], [sN,sW,sE,sE,sN]),
  ],
};



// Hexagonal blocks =======================================

// In hexagonal games, each cell in the grid is either the top or bottom *half* of a hexagon, with the top-left cell being the top half of a hexagon.  A move down thus moves two cells, and a move left or right is actually diagonally-downward.  The pre-path and path used to generate the blocks works in terms of the top halves of the hexes, with the bottom halves being handled automatically.  Rotations pivot the block around a full hexagon.

const hN = 0, hNE = 1, hSE = 2, hS = 3, hSW = 4, hNW = 5;
const hex_ymoves = [-2, -1, 1, 2, 1, -1];
const hex_xmoves = [0, 1, 1, 0, -1, -1];

let hex_prev_number = 2;

function createHexBlock(size: number, pre_path: number[], path: number[]) {
  const x0 = Math.floor(size / 2);
  const y0 = Math.floor(size / 2) * 2;
  const width = size;
  const height = size * 2 + 1;

  const block_num = hex_prev_number++;
  if(hex_prev_number === max_block_number) hex_prev_number = 1;

  return create_block_rotations(6, pre_path, path, dir => (dir + 1) % 6, (s, pre_path, path) => {
    return new_block_state(width, height, x0, y0, hex_xmoves, hex_ymoves, pre_path, path, block_num, true);
  });
}

blocks["hex"] = {
  // 3-tile blocks
  small: [
    createHexBlock(3, [], [hNE,hS]),
    createHexBlock(3, [hSW], [hNE,hNE]),
    createHexBlock(3, [hSW], [hNE,hSE]),
  ],
  // 4-tile blocks
  std: [
    // o
    createHexBlock(3, [], [hSW,hSE,hNE]),
    // t
    createHexBlock(3, [hSW], [hNE,hNE,hS]),
    createHexBlock(3, [hSE], [hNW,hNW,hS]),
    // c
    createHexBlock(3, [hSW], [hN,hNE,hSE]),
    // y
    createHexBlock(3, [hS], [hN,hNW,hSE,hNE]),
    // I
    createHexBlock(5, [hSW], [hNE,hNE,hNE]),
    // z/s
    createHexBlock(5, [hSW], [hNE,hSE,hNE]),
    createHexBlock(5, [hSE], [hNW,hSW,hNW]),
    // f
    createHexBlock(5, [hSW], [hNE,hNE,hSE]),
    createHexBlock(5, [hSE], [hNW,hNW,hSW]),
  ],
  // 5-tile blocks
  large: [
    // D
    createHexBlock(3, [], [hNE,hS,hSW,hNW]),
    // x/H
    createHexBlock(3, [], [hNE,hS,hNW,hNW,hS]),
    // T
    createHexBlock(5, [], [hS,hN,hNW,hNE,hSE]),
    // t
    // maybe this should have another version with the other centre of rotation?
    createHexBlock(5, [hNE], [hSW,hS,hNW,hSW]),
    // b
    createHexBlock(5, [], [hSW,hN,hNE,hNE]),
    createHexBlock(5, [], [hSE,hN,hNW,hNW]),
    // I
    createHexBlock(5, [hNE,hNE], [hSW,hSW,hSW,hSW]),
    // l
    createHexBlock(5, [hNE,hSE], [hNW,hSW,hSW,hSW]),
    createHexBlock(5, [hNW,hSW], [hNE,hSE,hSE,hSE]),
    // C
    createHexBlock(5, [hSW,hS], [hN,hNE,hNE,hSE]),
    // Vs
    createHexBlock(5, [hS,hS], [hN,hN,hNE,hNE]),
    createHexBlock(5, [hSE,hSE], [hNW,hNW,hNE,hNE]),
    // w
    createHexBlock(5, [hNW,hSW], [hNE,hSE,hNE,hSE]),
    // squiggle
    createHexBlock(5, [hSW,hSW], [hNE,hNE,hSE,hNE]),
    createHexBlock(5, [hSE,hSE], [hNW,hNW,hSW,hNW]),
    // f
    createHexBlock(5, [], [hS,hNW,hNE,hNE,hSE]),
    createHexBlock(5, [], [hS,hNE,hNW,hNW,hSW]),
    // j
    createHexBlock(5, [hSW], [hNE,hNE,hSE,hS]),
    createHexBlock(5, [hSE], [hNW,hNW,hSW,hS]),
    // r
    createHexBlock(5, [hS], [hN,hN,hSE,hNE]),
    createHexBlock(5, [hS], [hN,hN,hSW,hNW]),
    // y
    createHexBlock(5, [], [hSW,hN,hSE,hNE,hSE]),
    createHexBlock(5, [], [hSE,hN,hSW,hNW,hSW]),
    // c
    createHexBlock(5, [hS], [hNW,hN,hNE,hSE]),
    // Y
    createHexBlock(5, [], [hS,hN,hNW,hSE,hNE,hNE]),
    // ~
    createHexBlock(5, [hSW,hNW], [hSE,hNE,hNE,hSE]),
    createHexBlock(5, [hNW,hSW], [hNE,hSE,hSE,hNE]),
    // t
    createHexBlock(5, [hSE], [hN,hSW,hSW,hSW]),
    createHexBlock(5, [hSW], [hN,hSE,hSE,hSE]),
  ],
};



// Triangular blocks ======================================

// In triangular games, each cell in the grid is a full triangle, but could be either a left- or right-pointing one, with the top-left cell being a left-pointing triangle.  Rows in the grid overlap by half their height (i.e. row n+2 starts just below row n, with row n+1 overlapping both of them).  Moves down thus skip a row, and moves sideways are actually diagonal.  Rotations have to be relative to a *vertex* rather than a tile (or we'd have half as many as is sensible), which complicates things.  We create a blocks's first state starting from the top-right triangle of a six-triangle hexagon occurring in the middle two columns.  Subsequent state start further round that hexagon.

// Note: NE and NW (and SE and SW) result in the same moves in the grid, but give different results when the path is rotated.
const tNE = 0, tE = 1, tSE = 2, tSW = 3, tW = 4, tNW = 5;
const tri_xmoves = [0, 1, 0, 0, -1, 0];
const tri_ymoves = [-1, 0, 1, 1, 0, -1];

let tri_prev_number = 1;

function createTriBlock(size: number, pre_path: number[], path: number[], num_states?: number) {
  const x0 = size / 2 - 1;
  const y0 = (size % 4 === 0) ? x0 + 1 : x0;
  const width = size;
  const height = size * 1.5;

  const block_num = tri_prev_number++;
  if(tri_prev_number === max_block_number) tri_prev_number = 1;

  // We must adjust the origin for each state, because we rotate around a vertex rather than a tile.
  const xs = [0, 1, 1, 1, 0, 0];
  const ys = [0, 0, 1, 2, 2, 1];
  return create_block_rotations(num_states || 6, pre_path, path, dir => (dir + 1) % 6, (s, pre_path, path) => {
    return new_block_state(width, height, x0 + xs[s], y0 + ys[s], tri_xmoves, tri_ymoves, pre_path, path, block_num, false);
  });
}

blocks["tri"] = {
  // 1–5 tiles
  std: [
    // single triangle
    createTriBlock(2, [], []),
    // pair
    createTriBlock(2, [], [tE]),
    // triple
    createTriBlock(2, [tE], [tW,tSW]),
    // 4-tile blocks
    // large triangle
    createTriBlock(4, [tE], [tSE,tE,tW,tSW], 2),
    // <
    createTriBlock(4, [tSW], [tNE,tE,tSE]),
    // beam
    createTriBlock(4, [tNW], [tSE,tE,tSE]),
    createTriBlock(4, [tSW], [tNE,tE,tNE]),
    // 5-tile blocks
    // c
    createTriBlock(4, [tE], [tW,tSW,tSE,tE]),
    // beam
    createTriBlock(4, [tE,tNE], [tSW,tW,tSW,tW]),
    // hook
    createTriBlock(4, [tE,tSE], [tNW,tW,tSW,tW]),
    createTriBlock(4, [tSW], [tNE,tE,tSE,tE]),
    // h / f / weird thing
    createTriBlock(4, [tNW], [tSE,tSW,tNE,tE,tSE]),
    createTriBlock(4, [tSW], [tNE,tE,tNE,tSW,tSE]),
  ],
  // 6-tile blocks
  large: [
    // hex
    createTriBlock(4, [], [tE,tSE,tSE,tW,tNE], 1),
    // h/x (2 half hexes)
    createTriBlock(4, [tNW], [tSE,tSW,tNE,tE,tSE,tNW,tNE]),
    // beam
    createTriBlock(6, [tSW,tW], [tE,tNE,tE,tNE,tE]),
    createTriBlock(6, [tNW,tW], [tE,tSE,tE,tSE,tE]),
    // V+v
    createTriBlock(4, [], [tE,tSE,tE,tW,tSW,tW]),
    createTriBlock(4, [tSW,tW], [tE,tSE,tE,tNE,tE]),
    // hook
    createTriBlock(4, [tSW], [tSE,tE,tNE,tNW,tNE]),
    createTriBlock(4, [tE,tSE], [tSW,tW,tNW,tNE,tNW]),
    // s
    createTriBlock(6, [tSW,tSE], [tE,tNE,tNW,tNE,tE]),
    createTriBlock(6, [tSW,tSE,tE], [tW,tNW,tNE,tNW,tW]),
    // t
    createTriBlock(6, [tSW], [tNE,tE,tSE,tNW,tNE,tE]),
    // p/q (on their sides)
    createTriBlock(4, [tSW,tW], [tE,tNE,tE,tNE,tSW,tSE]),
    createTriBlock(4, [tSW], [tNE,tNW,tSE,tE,tSE,tE]),
    // f
    createTriBlock(6, [tSW,tW], [tE,tSE,tNW,tNE,tE,tSE]),
    createTriBlock(6, [tSW], [tNE,tE,tSE,tSW,tNE,tE]),
    // j
    createTriBlock(6, [tNW,tW], [tE,tSE,tE,tSE,tSW]),
    createTriBlock(6, [tSW,tSE], [tNW,tNE,tE,tNE,tE]),
    // h
    createTriBlock(6, [tE], [tW,tSW,tSE,tNW,tW,tNW]),
    createTriBlock(6, [], [tE,tSE,tSW,tNE,tE,tNE]),
  ],
};



return function get_block_sets(shape, set_names) {
  return set_names.map(name => blocks[shape][name]);
};

})();
