// A block is represented as an array of its possible orientations.  Each orientation consists of a y-x-indexed grid of tiles.  Tiles are just ints, with zero meaning empty, and any other number representing a solid tile (the value just determines the colour used).  For hexagonal games, a tile is either the top half or bottom half of a hexagon (depending on position in the grid).  For triangular games, it is always a whole triangle, but is either a left-pointing or right-pointing one depending on position in the grid.

// The API to this file is just a single function: get_block_sets(shape, sizes), where shape is "sqr"/"hex"/"tri", and sizes is an array of ordinals into the defined sets of blocks for that shape.

var get_block_sets = (function() {

var blocks = {};



// Square blocks ==========================================

// direction consts.
const sN = 0, sNE = 1, sE = 2, sSE = 3, sS = 4, sSW = 5, sW = 6, sNW = 7;

var sqrLastBlockNumber = 25; // use the nice colours for the 4-tile blocks
// update to match number of available sqr tile images
const sqrMaxBlockNumber = 31;

function createSqrBlock(size, prepath, path, numstates) {
  // use the square in the middle, or above and to the left of the middle
  var origin = Math.ceil(size/2) - 1;
  if(!numstates) numstates = 4;

  var blockNum = sqrLastBlockNumber++;
  if(sqrLastBlockNumber==sqrMaxBlockNumber) sqrLastBlockNumber = 2;

  var block = new Array(numstates);

  var i = 0;
  while(true) {
    block[i] = createSqrBlockState(size, origin, origin, prepath, path, blockNum);
    if(++i == numstates) break;
    // rotate the paths
    for(var j = 0; j != prepath.length; j++) prepath[j] = (prepath[j] + 2) % 8;
    for(var k = 0; k != path.length; k++) path[k] = (path[k] + 2) % 8;
  }

  return block;
}

function createSqrBlockState(size, x, y, prepath, path, blockNum) {
  var state = new Array(size);
  for(var i = 0; i < size; i++) {
    state[i] = new Array(size);
    for(var j = 0; j < size; j++) state[i][j] = 0;
  }

  // changes in x and y directions
  const ys = [-1,-1,0,1,1,1,0,-1];
  const xs = [0,1,1,1,0,-1,-1,-1];

  for(var n = 0; n != prepath.length; n++) {
    x += xs[prepath[n]];
    y += ys[prepath[n]];
  }

  state[y][x] = blockNum;
  for(var k = 0; k != path.length; k++) {
    x += xs[path[k]];
    y += ys[path[k]];
    state[y][x] = blockNum;
  }

  return state;
}

blocks.sqr = {
  // 3-tile blocks.  diagonal joins allowed
  small: [
    createSqrBlock(3, [sW], [sE,sE], 2),
    createSqrBlock(3, [sS], [sN,sE]),
    createSqrBlock(3, [sW], [sSE,sNE]),
    createSqrBlock(3, [sW], [sE,sSE]),
    createSqrBlock(3, [sSW], [sNE,sE]),
    createSqrBlock(3, [sSW], [sNE,sNE], 2)
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

// Note: Each hexagon is represented as two half-hexagons (top and bottom) because it's much easier to work with.

// make blocks a different colour
var hexLastBlockNumber = 2;
// update to match number of available hex tile images
var hexMaxBlockNumber = 13;

// direction constants for use with function below.
// North, North East, South East etc.
const hN = 0, hNE = 1, hSE = 2, hS = 3, hSW = 4, hNW = 5;

/*
size is the width in hexes.  height will be derived to make a big container hex
of correct size. centre of rotation is always the centre of the container hex.

prepath is a list of directions to take from (x,y) to get to the first coloured
hex path is the list of directions to move from there, colouring each hex entered

the path will be rotated to generate all 6 states for the block
(some blocks don't need all six, but it's not a big deal)
*/
function createHexBlock(size, prepath, path) {
  // these are weird because of representation being based on half-hexes
  var x = Math.floor(size/2);
  var y = Math.floor(size/2) * 2;
  var width = size;
  var height = size * 2 + 1;

  var blockNum = hexLastBlockNumber++;
  if(hexLastBlockNumber==hexMaxBlockNumber) hexLastBlockNumber = 2;

  var block = new Array(6);
  block[0] = createHexBlockState(width, height, x, y, prepath, path, blockNum);
  for(var i = 1; i < 6; i++) {
    // rotate the paths
    for(var j = 0; j < prepath.length; j++) prepath[j] = (prepath[j]+1)%6;
    for(var k = 0; k < path.length; k++) path[k] = (path[k]+1)%6;
    block[i] = createHexBlockState(width, height, x, y, prepath, path, blockNum);
  }

  return block;
}

function createHexBlockState(width, height, x, y, prepath, path, blockNum) {
  var state = new Array(height);
  for(var i = 0; i < height; i++) {
    state[i] = new Array(width);
    for(var j = 0; j < width; j++) state[i][j] = 0;
  }

  // changes in x and y directions for hN, hNE, hSE, hS, hSW, hNW (in that order).
  var ys = [-2,-1,1,2,1,-1];
  var xs = [0,1,1,0,-1,-1];

  for(var n = 0; n < prepath.length; n++) {
    x += xs[prepath[n]];
    y += ys[prepath[n]];
  }

  state[y][x] = blockNum;
  state[y+1][x] = blockNum;
  for(var k = 0; k < path.length; k++) {
    x += xs[path[k]];
    y += ys[path[k]];
    state[y][x] = blockNum;
    state[y+1][x] = blockNum;
  }

  return state;
}

blocks.hex = {
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
    // maybe this should have another ver with the other centre of rotation?
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
// Warning: the following code can cause brain damage

const tNE = 0, tE = 1, tSE = 2, tSW = 3, tW = 4, tNW = 5;

var triLastBlockNumber = 2;
// update to match number of available triangular tile images
var triMaxBlockNumber = 6;

/*
The block grid has an even width, and triangles in each column face
alternate directions.  the middle pair of columns always has a pair
of triangles that face away from one another at the top, which is
the reason for the odd expr. for y.

the prepath and path should be based on the block being drawn from
the top right triangle in the first hexagon (of 6 triangles) in the
middle column of the block.

the successive states created for the block place the first triangle
in each following tri of the hex moving clockwise, and adjusting
prepath and path accordingly.

the biggest possible hexagon within the grid is what the block will
rotate within, and to get the hexagon to be the specified width the
height must be 1.5 times that width
*/
function createTriBlock(size, prepath, path, numstates) {
  var x = size / 2 - 1;
  var y = (size%4==0) ? x+1 : x;
  if(!numstates) numstates = 6;
  var width = size;
  var height = size*1.5;

  var blockNum = triLastBlockNumber++;
  if(triLastBlockNumber==triMaxBlockNumber) triLastBlockNumber = 2;

  // triangular blocks rotate about a vertex, not about a tile.
  // so we pass different x,y coords to each call to createTriBlockState
  var xs = [0,1,1,1,0,0];
  var ys = [0,0,1,2,2,1];

  var block = new Array(numstates);
  block[0] = createTriBlockState(width, height, x, y, prepath, path, blockNum);
  for(var i = 1; i < numstates; i++) {
    // rotate the paths
    for(var j = 0; j < prepath.length; j++) prepath[j] = (prepath[j]+1)%6;
    for(var k = 0; k < path.length; k++) path[k] = (path[k]+1)%6;
    // get start coords
    var x2 = x + xs[i];
    var y2 = y + ys[i];
    block[i] = createTriBlockState(width, height, x2, y2, prepath, path, blockNum);
  }

  return block;
}

function createTriBlockState(width, height, x, y, prepath, path, blockNum) {
  var state = new Array(height);
  for(var i = 0; i < height; i++) {
    state[i] = new Array(width);
    for(var j = 0; j < width; j++) state[i][j] = 0;
  }

  // NE and NW result in the same moves in the square grid representation, but
  // must be distinct so that rotatated states can be produced. (same for SE, SW)
  var xs = [0,1,0,0,-1,0];
  var ys = [-1,0,1,1,0,-1];

  for(var n = 0; n < prepath.length; n++) {
    x += xs[prepath[n]];
    y += ys[prepath[n]];
  }

  state[y][x] = blockNum;
  for(var k = 0; k < path.length; k++) {
    x += xs[path[k]];
    y += ys[path[k]];
    state[y][x] = blockNum;
  }

  return state;
}

blocks.tri = {
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
  return [for(k of set_names) blocks[shape][k]];
};

})();
