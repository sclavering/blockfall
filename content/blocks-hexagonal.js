// XXX: kill this.  use createHexBlock instead
function createHexState(width, height, x, y, path) {
  // because of representation being based on half-hexes
  height = height * 2 + 1;
  y = y * 2;
  if(x%2==0) y++;

  var state = new Array(height);
  for(var i = 0; i < height; i++) {
    state[i] = new Array(width);
    for(var j = 0; j < width; j++) state[i][j] = 0;
  }

  state[y][x] = 1;
  state[y+1][x] = 1;
  for(var k = 0; k < path.length; k++) {
    switch(path[k]) {
      case N:  y-=2; break;
      case NE: y--; x++; break;
      case SE: y++; x++; break;
      case S:  y+=2; break;
      case SW: y++; x--; break;
      case NW: y--; x--; break;
    }
    state[y][x] = 1;
    state[y+1][x] = 1;
  }

  return state;
}


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
  [
  createHexState(3,3,1,1,[NE,S]),
  createHexState(3,3,1,1,[S,NE])
  ],

  [
  createHexState(3,3,0,1,[NE,NE]),
  createHexState(3,3,0,0,[SE,SE]),
  createHexState(3,3,1,0,[S,S])
  ],

  [
  createHexState(3,3,0,1,[NE,SE]),
  createHexState(3,3,0,0,[SE, S]),
  createHexState(3,3,1,0,[ S,SW]),
  createHexState(3,3,2,0,[SW,NW]),
  createHexState(3,3,2,1,[NW, N]),
  createHexState(3,3,1,2,[ N,NE])
  ]
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

  // xxx: incomplete
];

blocks["hex"]["current"] = blocks["hex"]["standard"];
