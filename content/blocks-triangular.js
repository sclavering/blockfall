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


// XXX: obsolete.  switch to createTriBlock
function createTriState(width, height, x, y, directions) {
  var block = new Array(height);
  for(var i = 0; i < height; i++) {
    block[i] = new Array(width);
    for(var j = 0; j < width; j++) block[i][j] = 0;
  }
  block[y][x] = 1;
  for(var k = 0; k < directions.length; k++) {
    switch(directions[k]) {
      case N: y--; break;
      case S: y++; break;
      case E: x++; break;
      case W: x--;
    }
    block[y][x] = 1;
  }
  return block;
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
  [
  createTriState(2,5,0,2,[E,S,W,S,E])
  ],

  [
  createTriState(4,6,1,1,[E,S,W,S,E]),
  createTriState(4,6,2,1,[S,W,E,S,E,W,S]),
  createTriState(4,6,2,2,[S,E,W,S,S,N,W]),
  createTriState(4,6,2,3,[W,S,E,S,W]),
  createTriState(4,6,2,4,[W,S,N,N,W,E,N]),
  createTriState(4,6,1,4,[N,W,E,N,E,W,N])
  ],

  [
  createTriState(4,8,0,3,[E,N,E,N,E]),
  createTriState(4,8,1,1,[S,E,S,E,S]),
  createTriState(4,8,2,1,[S,S,S,S,S]),
  createTriState(4,8,3,3,[W,S,W,S,W]),
  createTriState(4,8,2,5,[N,W,N,W,N]),
  createTriState(4,8,1,5,[N,N,N,N,N])
  ],

  [
  createTriState(4,8,0,1,[E,S,E,S,E]),
  createTriState(4,8,2,0,[S,S,S,S,S]),
  createTriState(4,8,3,2,[S,W,S,W,S]),
  createTriState(4,8,3,5,[W,N,W,N,W]),
  createTriState(4,8,1,6,[N,N,N,N,N]),
  createTriState(4,8,0,4,[N,E,N,E,N])
  ],

  [
  createTriState(4,6,1,2,[E,S,E,W,S,W]),
  createTriState(4,6,2,2,[S,S,S,N,W,N]),
  createTriState(4,6,2,3,[S,W,S,N,N,N]),
  createTriState(4,6,2,4,[W,N,W,E,N,E]),
  createTriState(4,6,1,4,[N,N,N,S,E,S]),
  createTriState(4,6,1,3,[N,E,N,S,S,S])
  ],

  [
  createTriState(4,6,1,3,[S,E,N,N,N]),
  createTriState(4,6,1,2,[S,S,E,N,E]),
  createTriState(4,6,2,2,[W,S,S,E,S]),
  createTriState(4,6,2,3,[N,W,S,S,S]),
  createTriState(4,6,2,4,[N,N,W,S,W]),
  createTriState(4,6,1,4,[E,N,N,W,N])
  ],

  [
  createTriState(4,6,2,3,[S,W,N,N,N]),
  createTriState(4,6,2,4,[W,N,N,E,N]),
  createTriState(4,6,1,4,[N,N,E,S,E]),
  createTriState(4,6,1,3,[N,E,S,S,S]),
  createTriState(4,6,1,2,[E,S,S,W,S]),
  createTriState(4,6,2,2,[S,S,W,N,W])
  ],

  [
  createTriState(4,7,1,4,[E,N,N,N,E]),
  createTriState(4,7,1,3,[S,E,N,E,S]),
  createTriState(4,7,1,2,[S,S,E,S,S]),
  createTriState(4,7,2,2,[W,S,S,S,W]),
  createTriState(4,7,2,3,[N,W,S,W,N]),
  createTriState(4,7,2,4,[N,N,W,N,N])
  ],

  [
  createTriState(4,7,2,4,[W,N,N,N,W]),
  createTriState(4,7,1,4,[N,N,E,N,N]),
  createTriState(4,7,1,3,[N,E,S,E,N]),
  createTriState(4,7,1,2,[E,S,S,S,E]),
  createTriState(4,7,2,2,[S,S,W,S,S]),
  createTriState(4,7,2,3,[S,W,N,W,S])
  ],

  [
  createTriState(4,7,0,3,[E,S,E,N,E]),
  createTriState(4,7,1,1,[S,S,S,E,S]),
  createTriState(4,7,2,1,[S,W,S,S,S]),
  createTriState(4,7,3,3,[W,N,W,S,W]),
  createTriState(4,7,2,5,[N,N,N,W,N]),
  createTriState(4,7,1,5,[N,E,N,N,N])
  ],

  [
  createTriState(4,7,1,3,[N,E,S,N,N,E]),
  createTriState(4,7,1,2,[E,S,S,N,E,S]),
  createTriState(4,7,2,2,[S,S,W,E,S,S]),
  createTriState(4,7,2,3,[S,W,N,S,S,W]),
  createTriState(4,7,2,4,[W,N,N,S,W,N]),
  createTriState(4,7,1,4,[N,N,E,W,N,N])
  ],

  [
  createTriState(4,6,0,3,[E,N,E,N,S,S]),
  createTriState(4,6,1,1,[S,E,S,E,W,S]),
  createTriState(4,6,2,1,[S,S,S,S,N,W]),
  createTriState(4,6,3,3,[W,S,W,S,N,N]),
  createTriState(4,6,2,5,[N,W,N,W,E,N]),
  createTriState(4,6,1,5,[N,N,N,N,S,E])
  ],

  [
  createTriState(4,6,1,1,[S,E,S,E,W,S]),
  createTriState(4,6,2,1,[S,S,S,S,N,W]),
  createTriState(4,6,3,3,[W,S,W,S,N,N]),
  createTriState(4,6,2,5,[N,W,N,W,E,N]),
  createTriState(4,6,1,5,[N,N,N,N,S,E]),
  createTriState(4,6,0,3,[E,N,E,N,S,S])
  ],

  [
  createTriState(4,6,2,3,[N,W,S,W,E,S]),
  createTriState(4,6,2,4,[N,N,W,N,S,S]),
  createTriState(4,6,1,4,[E,N,N,N,S,W]),
  createTriState(4,6,1,3,[S,E,N,E,W,N]),
  createTriState(4,6,1,2,[S,S,E,S,N,N]),
  createTriState(4,6,2,2,[W,S,S,S,N,E])
  ],

  [
  createTriState(4,6,1,3,[N,E,S,E,W,S]),
  createTriState(4,6,1,2,[E,S,S,W,E,S]),
  createTriState(4,6,2,2,[S,S,W,S,N,N]),
  createTriState(4,6,2,3,[S,W,N,W,E,N]),
  createTriState(4,6,2,4,[W,N,N,N,S,E]),
  createTriState(4,6,1,4,[N,N,E,N,S,S])
  ],

  [
  createTriState(4,7,1,4,[N,N,E,N,E]),
  createTriState(4,7,1,3,[N,E,S,E,S]),
  createTriState(4,7,1,2,[E,S,S,S,S]),
  createTriState(4,7,2,2,[S,S,W,S,W]),
  createTriState(4,7,2,3,[S,W,N,W,N]),
  createTriState(4,7,2,4,[W,N,N,N,N])
  ],

  [
  createTriState(4,7,2,4,[N,N,W,N,W]),
  createTriState(4,7,1,4,[E,N,N,N,N]),
  createTriState(4,7,1,3,[S,E,N,E,N]),
  createTriState(4,7,1,2,[S,S,E,S,E]),
  createTriState(4,7,2,2,[W,S,S,S,S]),
  createTriState(4,7,2,3,[N,W,S,W,S])
  ],

  [
  createTriState(4,7,2,4,[N,N,W,E,N,E]),
  createTriState(4,7,1,4,[E,N,N,S,E,S]),
  createTriState(4,7,1,3,[S,E,N,S,S,S]),
  createTriState(4,7,1,2,[S,S,E,W,S,W]),
  createTriState(4,7,2,2,[W,S,S,N,W,N]),
  createTriState(4,7,2,3,[N,W,S,N,N,N])
  ],

  [
  createTriState(4,7,1,4,[N,N,E,W,N,W]),
  createTriState(4,7,1,3,[N,E,S,N,N,N]),
  createTriState(4,7,1,2,[E,S,S,N,E,N]),
  createTriState(4,7,2,2,[S,S,W,E,S,E]),
  createTriState(4,7,2,3,[S,W,N,S,S,S]),
  createTriState(4,7,2,4,[W,N,N,S,W,S])
  ]
];



blocks["tri"]["current"] = blocks["tri"]["4"];
