// block state reallly
function createTriBlock(width, height, x, y, directions) {
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
  [[
  [0,0],
  [0,0],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [1,0]
  ]],

  [[
  [0,0],
  [0,0],
  [1,1],
  [0,0],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [0,1],
  [0,1],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [0,1],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [0,0],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [1,0],
  [1,0]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [1,0],
  [0,0]
  ]],

  [[
  [0,0],
  [0,0],
  [1,1],
  [1,0],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [1,1],
  [0,1],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [0,1],
  [0,1],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [0,1],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [1,0],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [1,0],
  [1,0]
  ]],

  [[
  [0,0],
  [0,0],
  [0,1],
  [1,0],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [0,1],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [0,1],
  [0,0],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [0,1],
  [1,0]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [1,0],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [0,0],
  [1,0]
  ]],

  [[
  [0,0],
  [0,0],
  [0,0],
  [1,1],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [0,0],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [0,1],
  [0,0],
  [1,0]
  ]]
];


blocks["tri"]["4"] = [
  [[
  [0,0,0,0],
  [0,2,0,0],
  [0,2,2,0],
  [0,2,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,2,0,0],
  [2,2,0,0],
  [0,2,0,0]
  ]],

  [[
  [0,0],
  [0,0],
  [3,3],
  [3,3],
  [0,0]
  ],[
  [0,0],
  [0,0],
  [3,3],
  [0,3],
  [0,3]
  ],[
  [0,0],
  [0,0],
  [0,3],
  [0,3],
  [3,3]
  ],[
  [0,0],
  [0,0],
  [0,0],
  [3,3],
  [3,3]
  ],[
  [0,0],
  [0,0],
  [3,0],
  [3,0],
  [3,3]
  ],[
  [0,0],
  [0,0],
  [3,3],
  [3,0],
  [3,0]
  ]],

  [[
  [0,0,0,0],
  [0,0,0,0],
  [0,4,4,0],
  [4,4,0,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,4,0,0],
  [0,4,4,0],
  [0,0,4,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,4,0],
  [0,0,4,0],
  [0,0,4,0],
  [0,0,4,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,4,4],
  [0,4,4,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,4,0,0],
  [0,4,4,0],
  [0,0,4,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,4,0,0],
  [0,4,0,0],
  [0,4,0,0],
  [0,4,0,0]
  ]],

  [[
  [0,0,0,0],
  [0,0,5,0],
  [0,5,5,0],
  [0,5,0,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,5,5,0],
  [0,0,5,5],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,5,0],
  [0,0,5,0],
  [0,0,5,0],
  [0,0,5,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,5,0],
  [0,5,5,0],
  [0,5,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [5,5,0,0],
  [0,5,5,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,5,0,0],
  [0,5,0,0],
  [0,5,0,0],
  [0,5,0,0],
  [0,0,0,0]
  ]]
];


blocks["tri"]["5"] = [
  [[
  [0,0],
  [0,0],
  [1,1],
  [1,1],
  [1,0]
  ],[
  [0,0],
  [0,0],
  [1,1],
  [1,1],
  [0,1]
  ],[
  [0,0],
  [0,0],
  [1,1],
  [0,1],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [0,1],
  [1,1],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [1,0],
  [1,1],
  [1,1]
  ],[
  [0,0],
  [0,0],
  [1,1],
  [1,0],
  [1,1]
  ]],

  [[
  [0,0,0,0],
  [0,0,1,0],
  [0,1,1,0],
  [1,1,0,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,0,1,1],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,0,1,1],
  [0,1,1,0],
  [0,1,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [1,1,0,0],
  [0,1,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,0,0]
  ]],

  [[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [1,1,1,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,1],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,0,0]
  ]],

  [[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,1,1,1],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,1,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [1,1,1,0],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,0,0,0]
  ]],

  [[
  [0,0,0,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,0,1,1],
  [0,0,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,1,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,0,0],
  [1,1,0,0],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,0,0,0]
  ]],

  [[
  [0,0,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,0,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,1,0],
  [0,1,1,0],
  [0,0,1,0],
  [0,0,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,1,0],
  [0,0,1,1],
  [0,1,1,0],
  [0,0,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [0,1,1,0],
  [0,0,1,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,0,0],
  [0,1,0,0],
  [0,1,1,0],
  [0,1,0,0]
  ],[
  [0,0,0,0],
  [0,0,0,0],
  [0,1,1,0],
  [1,1,0,0],
  [0,1,0,0],
  [0,0,0,0]
  ]]
];


blocks["tri"]["6"] = [
  [
  createTriBlock(2,5,0,2,[E,S,W,S,E])
  ],

  [
  createTriBlock(4,6,1,1,[E,S,W,S,E]),
  createTriBlock(4,6,2,1,[S,W,E,S,E,W,S]),
  createTriBlock(4,6,2,2,[S,E,W,S,S,N,W]),
  createTriBlock(4,6,2,3,[W,S,E,S,W]),
  createTriBlock(4,6,2,4,[W,S,N,N,W,E,N]),
  createTriBlock(4,6,1,4,[N,W,E,N,E,W,N])
  ],

  [
  createTriBlock(4,8,0,3,[E,N,E,N,E]),
  createTriBlock(4,8,1,1,[S,E,S,E,S]),
  createTriBlock(4,8,2,1,[S,S,S,S,S]),
  createTriBlock(4,8,3,3,[W,S,W,S,W]),
  createTriBlock(4,8,2,5,[N,W,N,W,N]),
  createTriBlock(4,8,1,5,[N,N,N,N,N])
  ],

  [
  createTriBlock(4,8,0,1,[E,S,E,S,E]),
  createTriBlock(4,8,2,0,[S,S,S,S,S]),
  createTriBlock(4,8,3,2,[S,W,S,W,S]),
  createTriBlock(4,8,3,5,[W,N,W,N,W]),
  createTriBlock(4,8,1,6,[N,N,N,N,N]),
  createTriBlock(4,8,0,4,[N,E,N,E,N])
  ],

  [
  createTriBlock(4,6,1,2,[E,S,E,W,S,W]),
  createTriBlock(4,6,2,2,[S,S,S,N,W,N]),
  createTriBlock(4,6,2,3,[S,W,S,N,N,N]),
  createTriBlock(4,6,2,4,[W,N,W,E,N,E]),
  createTriBlock(4,6,1,4,[N,N,N,S,E,S]),
  createTriBlock(4,6,1,3,[N,E,N,S,S,S])
  ],

  [
  createTriBlock(4,6,1,3,[S,E,N,N,N]),
  createTriBlock(4,6,1,2,[S,S,E,N,E]),
  createTriBlock(4,6,2,2,[W,S,S,E,S]),
  createTriBlock(4,6,2,3,[N,W,S,S,S]),
  createTriBlock(4,6,2,4,[N,N,W,S,W]),
  createTriBlock(4,6,1,4,[E,N,N,W,N])
  ],

  [
  createTriBlock(4,6,2,3,[S,W,N,N,N]),
  createTriBlock(4,6,2,4,[W,N,N,E,N]),
  createTriBlock(4,6,1,4,[N,N,E,S,E]),
  createTriBlock(4,6,1,3,[N,E,S,S,S]),
  createTriBlock(4,6,1,2,[E,S,S,W,S]),
  createTriBlock(4,6,2,2,[S,S,W,N,W])
  ],

  [
  createTriBlock(4,7,1,4,[E,N,N,N,E]),
  createTriBlock(4,7,1,3,[S,E,N,E,S]),
  createTriBlock(4,7,1,2,[S,S,E,S,S]),
  createTriBlock(4,7,2,2,[W,S,S,S,W]),
  createTriBlock(4,7,2,3,[N,W,S,W,N]),
  createTriBlock(4,7,2,4,[N,N,W,N,N])
  ],

  [
  createTriBlock(4,7,2,4,[W,N,N,N,W]),
  createTriBlock(4,7,1,4,[N,N,E,N,N]),
  createTriBlock(4,7,1,3,[N,E,S,E,N]),
  createTriBlock(4,7,1,2,[E,S,S,S,E]),
  createTriBlock(4,7,2,2,[S,S,W,S,S]),
  createTriBlock(4,7,2,3,[S,W,N,W,S])
  ],

  [
  createTriBlock(4,7,0,3,[E,S,E,N,E]),
  createTriBlock(4,7,1,1,[S,S,S,E,S]),
  createTriBlock(4,7,2,1,[S,W,S,S,S]),
  createTriBlock(4,7,3,3,[W,N,W,S,W]),
  createTriBlock(4,7,2,5,[N,N,N,W,N]),
  createTriBlock(4,7,1,5,[N,E,N,N,N])
  ],

  [
  createTriBlock(4,7,1,3,[N,E,S,N,N,E]),
  createTriBlock(4,7,1,2,[E,S,S,N,E,S]),
  createTriBlock(4,7,2,2,[S,S,W,E,S,S]),
  createTriBlock(4,7,2,3,[S,W,N,S,S,W]),
  createTriBlock(4,7,2,4,[W,N,N,S,W,N]),
  createTriBlock(4,7,1,4,[N,N,E,W,N,N])
  ],

  [
  createTriBlock(4,6,0,3,[E,N,E,N,S,S]),
  createTriBlock(4,6,1,1,[S,E,S,E,W,S]),
  createTriBlock(4,6,2,1,[S,S,S,S,N,W]),
  createTriBlock(4,6,3,3,[W,S,W,S,N,N]),
  createTriBlock(4,6,2,5,[N,W,N,W,E,N]),
  createTriBlock(4,6,1,5,[N,N,N,N,S,E])
  ],

  [
  createTriBlock(4,6,1,1,[S,E,S,E,W,S]),
  createTriBlock(4,6,2,1,[S,S,S,S,N,W]),
  createTriBlock(4,6,3,3,[W,S,W,S,N,N]),
  createTriBlock(4,6,2,5,[N,W,N,W,E,N]),
  createTriBlock(4,6,1,5,[N,N,N,N,S,E]),
  createTriBlock(4,6,0,3,[E,N,E,N,S,S])
  ],

  [
  createTriBlock(4,6,2,3,[N,W,S,W,E,S]),
  createTriBlock(4,6,2,4,[N,N,W,N,S,S]),
  createTriBlock(4,6,1,4,[E,N,N,N,S,W]),
  createTriBlock(4,6,1,3,[S,E,N,E,W,N]),
  createTriBlock(4,6,1,2,[S,S,E,S,N,N]),
  createTriBlock(4,6,2,2,[W,S,S,S,N,E])
  ],

  [
  createTriBlock(4,6,1,3,[N,E,S,E,W,S]),
  createTriBlock(4,6,1,2,[E,S,S,W,E,S]),
  createTriBlock(4,6,2,2,[S,S,W,S,N,N]),
  createTriBlock(4,6,2,3,[S,W,N,W,E,N]),
  createTriBlock(4,6,2,4,[W,N,N,N,S,E]),
  createTriBlock(4,6,1,4,[N,N,E,N,S,S])
  ],

  [
  createTriBlock(4,7,1,4,[N,N,E,N,E]),
  createTriBlock(4,7,1,3,[N,E,S,E,S]),
  createTriBlock(4,7,1,2,[E,S,S,S,S]),
  createTriBlock(4,7,2,2,[S,S,W,S,W]),
  createTriBlock(4,7,2,3,[S,W,N,W,N]),
  createTriBlock(4,7,2,4,[W,N,N,N,N])
  ],

  [
  createTriBlock(4,7,2,4,[N,N,W,N,W]),
  createTriBlock(4,7,1,4,[E,N,N,N,N]),
  createTriBlock(4,7,1,3,[S,E,N,E,N]),
  createTriBlock(4,7,1,2,[S,S,E,S,E]),
  createTriBlock(4,7,2,2,[W,S,S,S,S]),
  createTriBlock(4,7,2,3,[N,W,S,W,S])
  ],

  [
  createTriBlock(4,7,2,4,[N,N,W,E,N,E]),
  createTriBlock(4,7,1,4,[E,N,N,S,E,S]),
  createTriBlock(4,7,1,3,[S,E,N,S,S,S]),
  createTriBlock(4,7,1,2,[S,S,E,W,S,W]),
  createTriBlock(4,7,2,2,[W,S,S,N,W,N]),
  createTriBlock(4,7,2,3,[N,W,S,N,N,N])
  ],

  [
  createTriBlock(4,7,1,4,[N,N,E,W,N,W]),
  createTriBlock(4,7,1,3,[N,E,S,N,N,N]),
  createTriBlock(4,7,1,2,[E,S,S,N,E,N]),
  createTriBlock(4,7,2,2,[S,S,W,E,S,E]),
  createTriBlock(4,7,2,3,[S,W,N,S,S,S]),
  createTriBlock(4,7,2,4,[W,N,N,S,W,S])
  ]
];



blocks["tri"]["current"] = blocks["tri"]["4"];
