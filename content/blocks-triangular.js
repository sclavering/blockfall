const tNE = 0, tE = 1, tSE = 2, tSW = 3, tW = 4, tNW = 5;

var triLastBlockNumber = 0;
// update to match number of available triangular tile images
var triMaxBlockNumber = 6;


/** the block grid has an even width, and triangles in each column face
  * alternate directions.  the middle pair of columns always has a pair
  * of triangles that face away from one another at the top, which is
  * the reason for the odd expr. for y.
  *
  * the prepath and path should be based on the block being drawn from
  * the top right triangle in the first hexagon (of 6 triangles) in the
  * middle column of the block.
  *
  * the successive states created for the block place the first triangle
  * in each following tri of the hex moving clockwise, and adjusting
  * prepath and path accordingly.
  *
  * the biggest possible hexagon within the grid is what the block will
  * rotate within, and to get the hexagon to be the specified width the
  * height must be 1.5 times that width
  *
  * </probably-incomprehensible-comment>
  */
function createTriBlock(size, prepath, path, numstates) {
  var x = size/2 - 1;
  var y = (size%4==0) ? x+1 : x;
  if(!numstates) numstates = 6;
  var width = size;
  var height = size*1.5;


  triLastBlockNumber++;
  var blockNum = triLastBlockNumber;
  triLastBlockNumber %= triMaxBlockNumber;

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

const N = 1, E = 2, S = 3, W = 4;
function createTriBlockState(width, height, x, y, prepath, path, blockNum) {
//  alert("state, starting at ("+x+","+y+"), prepath="+prepath+", path="+path);
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
//    alert("("+x+","+y+")");
    state[y][x] = blockNum;
  }

  return state;
}




blocks["tri"] = [];


blocks["tri"]["tiny"] = [
  // single triangle.  could restrict to 2 states
  createTriBlock(2, [], []),
  // pair
  createTriBlock(2, [], [tE]),
  // triple
  createTriBlock(2, [tE], [tW,tSW]),
];


blocks["tri"]["4"] = [
  // large triangle
  createTriBlock(4, [tE], [tSE,tE,tW,tSW], 2),
  // <
  createTriBlock(4, [tSW], [tNE,tE,tSE]),
  // beam
  createTriBlock(4, [tNW], [tSE,tE,tSE]),
  createTriBlock(4, [tSW], [tNE,tE,tNE]),
];


blocks["tri"]["5"] = [
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
];


blocks["tri"]["6"] = [
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
];
