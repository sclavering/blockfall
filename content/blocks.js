// direction consts.
const sN = 0, sE = 1, sS = 2, sW = 3;

var sqrLastBlockNumber = 0;
// update to match number of available hex tile images
var sqrMaxBlockNumber = 31;



function createSqrBlock(size, prepath, path, numstates) {
  // use the square in the middle, or above and to the left of the middle
  var origin = Math.ceil(size/2) - 1;
  if(!numstates) numstates = 4;

  sqrLastBlockNumber++;
  var blockNum = sqrLastBlockNumber;
  sqrLastBlockNumber %= sqrMaxBlockNumber;

  var block = new Array(numstates);
  block[0] = createSqrBlockState(size, size, origin, origin, prepath, path, blockNum);
  for(var i = 1; i < numstates; i++) {
    // rotate the paths
    for(var j = 0; j < prepath.length; j++) prepath[j] = (prepath[j]+1)%4;
    for(var k = 0; k < path.length; k++) path[k] = (path[k]+1)%4;
    block[i] = createSqrBlockState(size, size, origin, origin, prepath, path, blockNum);
  }

  return block;
}

function createSqrBlockState(width, height, x, y, prepath, path, blockNum) {
  var state = new Array(height);
  for(var i = 0; i < height; i++) {
    state[i] = new Array(width);
    for(var j = 0; j < width; j++) state[i][j] = 0;
  }

  // changes in x and y directions for hN, hNE, hSE, hS, hSW, hNW (in that order).
  var ys = [-1,0,1,0];
  var xs = [0,1,0,-1];

  for(var n = 0; n < prepath.length; n++) {
    x += xs[prepath[n]];
    y += ys[prepath[n]];
  }

  state[y][x] = blockNum;
  for(var k = 0; k < path.length; k++) {
    x += xs[path[k]];
    y += ys[path[k]];
//    alert("("+x+","+y+")");
    state[y][x] = blockNum;
  }

  return state;
}



blocks["sqr"] = [];

blocks["sqr"]["triples"] = [
  [[
  [ 0, 0, 0],
  [26,26,26],
  [ 0, 0, 0]
  ],[
  [ 0,26, 0],
  [ 0,26, 0],
  [ 0,26, 0]
  ]],

  [[
  [ 0, 0, 0],
  [ 0,27,27],
  [ 0,27, 0]
  ],[
  [ 0, 0, 0],
  [27,27, 0],
  [ 0,27, 0]
  ],[
  [ 0,27, 0],
  [27,27, 0],
  [ 0, 0, 0]
  ],[
  [ 0,27, 0],
  [ 0,27,27],
  [ 0, 0, 0]
  ]]
];

// 4 triples where diagonal joins are allowed
blocks["sqr"]["triples-strange"] = [
  [[
  [ 0, 0, 0],
  [28, 0,28],
  [ 0,28, 0]
  ],[
  [ 0,28, 0],
  [28, 0, 0],
  [ 0,28, 0]
  ],[
  [ 0,28, 0],
  [28, 0,28],
  [ 0, 0, 0]
  ],[
  [ 0,28, 0],
  [ 0, 0,28],
  [ 0,28, 0]
  ]],

  [[
  [ 0, 0, 0],
  [29,29, 0],
  [ 0, 0,29]
  ],[
  [ 0,29, 0],
  [ 0,29, 0],
  [29, 0, 0]
  ],[
  [29, 0, 0],
  [ 0,29,29],
  [ 0, 0, 0]
  ],[
  [ 0, 0,29],
  [ 0,29, 0],
  [ 0,29, 0]
  ]],

  [[
  [ 0, 0, 0],
  [ 0,30,30],
  [30, 0, 0]
  ],[
  [30, 0, 0],
  [ 0,30, 0],
  [ 0,30, 0]
  ],[
  [ 0, 0,30],
  [30,30, 0],
  [ 0, 0, 0]
  ],[
  [ 0,30, 0],
  [ 0,30, 0],
  [ 0, 0,30]
  ]],

  [[
  [ 0, 0, 0],
  [ 0, 0,31],
  [ 0,31, 0],
  [31, 0, 0]
  ],[
  [ 0, 0, 0],
  [31, 0, 0],
  [ 0,31, 0],
  [ 0, 0,31]
  ]]
];




// 7 standard blocks
blocks["sqr"]["standard"] = [
  // l
  createSqrBlock(3, [sE], [sW,sW,sS]),
  // f
  createSqrBlock(3, [sW], [sE,sE,sS]),
  // o
  createSqrBlock(3, [], [sS,sE,sN], 1),
  // t
  createSqrBlock(3, [], [sW,sE,sS,sN,sE]),
  // XXX: the rotations for s+z don't match the tetris standard any more
  // http://www.colinfahey.com/2003jan_tetris/tetris_standard_specifications.htm
  // s
  createSqrBlock(3, [sE], [sW,sS,sW], 2),
  // z
  createSqrBlock(3, [sW], [sE,sS,sE], 2),
  // i
  createSqrBlock(4, [sW], [sE,sE,sE], 2),
];



// 18 sqr pentris blocks
blocks["sqr"]["pentris"] = [
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
  createSqrBlock(5, [], [sN,sS,sE,sW,sS,sN,sW], 1),
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
];

blocks["sqr"]["current"] = blocks["sqr"]["standard"];
