// make blocks a different colour
var hexLastBlockNumber = 0;
// update to match number of available hex tile images
var hexMaxBlockNumber = 14;


// direction constants for use with function below.
// North, North East, South East etc.
const hN = 0, hNE = 1, hSE = 2, hS = 3, hSW = 4, hNW = 5;

/** size is the width in hexes.  height will be derived to make a big container hex
  * of correct size. centre of rotation is always the centre of the container hex.
  *
  * prepath is a list of directions to take from (x,y) to get to the first coloured hex
  * path is the list of directions to move from there, colouring each hex entered
  *
  * the path will be rotated to generate all 6 states for the block
  * (some blocks don't need all six, but it's not a big deal)
  */
function createHexBlock(size, prepath, path) {
  // these are weird because of representation being based on half-hexes
  var x = Math.floor(size/2);
  var y = Math.floor(size/2) * 2;
  var width = size;
  var height = size * 2 + 1;

  hexLastBlockNumber++;
  var blockNum = hexLastBlockNumber;
  hexLastBlockNumber = hexLastBlockNumber % hexMaxBlockNumber;

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




// Note: Each hexagon is represented as two half-hexagons (top and bottom)
// because it makes manipulation of the falling block much easier

blocks["hex"] = [];

blocks["hex"]["triples"] = [
  createHexBlock(3, [], [hNE,hS]),
  createHexBlock(3, [hSW], [hNE,hNE]),
  createHexBlock(3, [hSW], [hNE,hSE]),
];



blocks["hex"]["standard"] = [
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
];




blocks["hex"]["pentris"] = [
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
];

blocks["hex"]["current"] = blocks["hex"]["standard"];
