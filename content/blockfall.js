// ui bits

var gMsgPaused = "msg-paused";
var gScoreDisplay = "score-display";
var gLinesDisplay = "lines-display";
var gLevelDisplay = "level-display";

const gUiBits = ["gMsgPaused", "gScoreDisplay", "gLinesDisplay", "gLevelDisplay"];

// globals

var gPaused = false;



function pause() {
  if(gPaused) return;
  Timer.stop();
  gMsgPaused.hidden = false;
  gPaused = true;
}

function unpause() {
  if(!gPaused) return;
  Timer.start()
  gMsgPaused.hidden = true;
  gPaused = false;
}

function togglePause() {
  if(gPaused) unpause();
  else pause();
}

function newGame() {
  unpause();
  Game.start();
}



// settings dialogue

function showSettingsDialogue() {
  const url = "chrome://blockfall/content/settings.xul";
  const flags = "dialog,dependent,modal,chrome";//,resizable";

  pause();
  openDialog(url, "flibble", flags);
}

function onSettingsCancel() {
  unpause();
}

function onSettingsAccept(shape, sizes) {
  changeBlocks(shape, sizes);
  unpause();
}



// ugly things

function changeBlocks(shape, sizes) {
  var shapeChanged = (shape!=Blocks.currentShape);
  document.documentElement.setAttribute("pref-shape",shape);
  Blocks.change(shape, sizes);
  if(shapeChanged) changeMode(shape);
}

function changeMode(newshape) {
  Game.end();
  if(NextBlockDisplay) NextBlockDisplay.hide();
  if(GridDisplay) GridDisplay.hide();
  var height = {sqr: 25, hex: 50, tri: 51}[newshape];
  NextBlockDisplay = NextBlockDisplays[newshape];
  GridDisplay = GridDisplays[newshape];
  FallingBlock = FallingBlocks[newshape];
  Grid = Grids[newshape];
  NextBlockDisplay.show();
  GridDisplay.show();
  Game.start(10,height);
}


window.addEventListener("load", function() {
  var shapes = ["sqr","hex","tri"];
  for(var i = 0; i != shapes.length; i++) {
    shape = shapes[i];
    GridDisplays[shape] = new GridDisplayObj(shape);
    NextBlockDisplays[shape] = new NextBlockDisplayObj(shape);
  }
  NextBlockDisplays.sqr.setSize(5,5);
  NextBlockDisplays.hex.setSize(7,13);
  NextBlockDisplays.tri.setSize(6,10);
  changeBlocks(document.documentElement.getAttribute("pref-shape"), [1]); //xxx

  for(i = 0; i != gUiBits.length; ++i) {
    var bit = gUiBits[i];
    window[bit] = document.getElementById(window[bit]);
  }
  gMsgPaused.hidden = true;
}, false);




// bad OOP (rest of file)

var Game = {
  width: 10,
  height: 25,
  startingLevel: 0,
  levelsCompleted: 0,


  start: function(width, height, startingLevel) {
    this.end();

    if(width) this.width = width;
    else width = this.width;
    if(height) this.height = height;
    else height = this.height;

    if(startingLevel || startingLevel===0) this.startingLevel = startingLevel;
    this.level = this.startingLevel;

    this.levelsCompleted = 0;
    this.lines = 0;
    this.score = 0;

    Grid.newGrid(width, height);
    GridDisplay.setSize(width, height);

    Timer.resetDelay();
    // < matters
    for(var i = 1; i < startingLevel; i++) Timer.reduceDelay();

    window.sizeToContent();
    GridDisplay.updateAll();
    // add a block to top of grid
    Blocks.setNext();
    Blocks.next();
  },

  end: function() {
    Timer.stop();
    document.onkeydown = null;
  },


  _score: 0,
  get score() {
    return this._score;
  },
  set score(val) {
    this._score = val;
    gScoreDisplay.value = val;
  },

  _lines: 0,
  get lines() {
    return this._lines;
  },
  set lines(val) {
    this._lines = val;
    gLinesDisplay.value = val;
  },

  _level: 0,
  get level() {
    return this._level;
  },
  set level(val) {
    this._level = val;
    gLevelDisplay.value = val;
  },


  // score 20 points for a line, 60 for 2 lines, 120 for 3 lines, 200 for 4 lines
  scoreRemovingLines: function(numlines) {
    this.lines += numlines;
    for(var i = 1; i <= numlines; i++) this.score += i * 20;
  },
  scoreBlockDropped: function(wasDropped) {
    var score = this.level;
    if(wasDropped) score *= 5;
    if(NextBlockDisplay.enabled) score = Math.floor(score / 2);
    this.score += score;
  },

  // increase level if appropriate
  updateLevel: function() {
    if(this.lines >= (this.levelsCompleted+1)*10) {
      this.levelsCompleted++;
      this.level++;
      Timer.reduceDelay();
    }
  },

  blockReachedBottom: function(wasDropped) {
    Timer.stop();
    FallingBlock.addToGrid();
    Grid.removeCompleteLines();
    this.scoreBlockDropped(wasDropped);
    this.updateLevel();
    GridDisplay.updateAll();
    Blocks.next();
  }
}



var Blocks = {
  currentSet: null, // an array of blocks, if using just one size
  currentSets: null, // an array of arrays, if using several sizes
  currentShape: null,

  _next: null,

  next: function() {
    var gameNotLost = FallingBlock.setBlock(this._next);
    this.setNext();
    NextBlockDisplay.update(this._next[0]);
    if(gameNotLost) Timer.start();
    else Game.end();
  },

  setNext: function() {
    var set = this.currentSet, num, n;
    if(!set) {
      sets = this.currentSets;
      num = sets.length;
      do { n = Math.random(); } while(n == 1.0);
      n = Math.floor(n * num);
      set = sets[n];
    }
    num = set.length;
    do { n = Math.random() } while(n == 1.0);
    n = Math.floor(n * num);
    this._next = set[n];
  },

  // shape is from {"sqr","hex","tri"}.  sizes is an int array
  change: function(shape, sizes) {
    this.currentShape = shape;

    var all = blocks[shape];
    if(sizes.length==1) {
      this.currentSet = all[sizes[0]];
      this.currentSets = null;
    } else {
      this.currentSet = null;
      var current = this.currentSets = [];
      for(var i = 0; i != sizes.length; ++i) current.push(all[sizes[i]]);
    }
  }
}



var Timer = {
  interval: null,
  delay: 0,

  start: function() {
    this.interval = setInterval(FallingBlock.timedMoveDown, this.delay);
  },
  stop: function() {
    if(!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  },
  // these are only ever called while the timer is stopped, so we don't need to restart it
  resetDelay: function() {
    this.delay = 1000;
  },
  reduceDelay: function() {
    this.delay = Math.ceil(this.delay * 0.8);
  }
}





var FallingBlocks = {}; // shape -> obj map
var FallingBlock = null;

var BaseFallingBlock = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  bottom: 0,
  right: 0,

  blockState: 0,
  block: [[]],

  // y-x indexed
  grid: null,

  // returns a bool for if the new block can be added
  setBlock: function(newblock) {
    // get the block
    var block = newblock[0];
    var height = block.length;
    var width = block[0].length;
    // determine left edge where block will be placed from
    var left = Math.floor((Game.width-width)/2);
    var right = left + width;

    if(!Grid.canAdd(block, left, 0)) return false;

    this.state = 0;
    this.block = newblock;
    this.grid = block;
    this.left = left;
    this.right = right;
    this.top = 0;
    this.bottom = height;
    this.width = width;
    this.height = height;

    GridDisplay.updateArea(0, right, height, left);
    return true;
  },

  addToGrid: function() {
    Grid.addBlock(this.grid, this.left, this.top);
  },

  // bounds checked.  coords in terms of the whole grid
  safeGetElement: function(x, y) {
    x = x - this.left;
    y = y - this.top;
    if(x>=0 && x<this.width && y>=0 && y<this.height)
      return this.grid[y][x];
    return null;
  },

  // note: block.length is the number of states this block has
  rotateClockwise: function() {
    var newstate = this.state + 1;
    if(newstate==this.block.length) newstate = 0;
    this.tryRotate(newstate);
  },

  rotateAnticlockwise: function() {
    var newstate = this.state - 1;
    if(newstate==-1) newstate += this.block.length;
    this.tryRotate(newstate);
  },

  tryRotate: function(newstate) {
    var newgrid = this.block[newstate];
    //if(!this.canRotate(newgrid)) return;
    if(!Grid.canAdd(newgrid, this.left, this.top)) return;
    this.state = newstate;
    this.grid = newgrid;
    GridDisplay.safeUpdateArea(this.top, this.right, this.bottom, this.left);
  },

  canMoveTo: function(leftchange, topchange) {
    return Grid.canAdd(this.grid, this.left+leftchange, this.top+topchange);
  },

  drop: function() {
    while(this.moveDown());
    Game.blockReachedBottom(true);
  },

  timedMoveDown: function() {
    if(!FallingBlock.moveDown()) Game.blockReachedBottom();
  }
}


FallingBlocks.sqr = {
  __proto__: BaseFallingBlock,

  moveLeft: function() {
    if(!this.canMoveTo(-1,0)) return;
    this.left--;
    this.right--;
    GridDisplay.safeUpdateArea(this.top, this.right+1, this.bottom, this.left);
  },

  moveRight: function() {
    if(!this.canMoveTo(+1,0)) return;
    this.left++;
    this.right++;
    GridDisplay.safeUpdateArea(this.top, this.right, this.bottom, this.left-1);
  },

  // must return a boolean for the timed drop function
  moveDown: function() {
    var can = this.canMoveTo(0,+1);
    if(can) {
      this.top++;
      this.bottom++;
      GridDisplay.safeUpdateArea(this.top-1, this.right, this.bottom, this.left);
    }
    return can;
  }
}


// in the hexagonal grid it is impossible to just move left or right, we must move down a line too.
// also moving down a line actually means moving down 2 lines, because the arrays are of half hexes
var HexFallingBlock = FallingBlocks.hex = {
  __proto__: BaseFallingBlock,

  moveLeft: function() {
    if(!this.canMoveTo(-1,+1)) return;
    this.left--;
    this.right--;
    this.top++;
    this.bottom++;
    GridDisplay.safeUpdateArea(this.top-1, this.right+1, this.bottom, this.left);
  },

  moveRight: function() {
    if(!this.canMoveTo(+1,+1)) return;
    this.left++;
    this.right++;
    this.top++;
    this.bottom++;
    GridDisplay.safeUpdateArea(this.top-1, this.right, this.bottom, this.left-1);
  },

  // must return a boolean for the timed drop function
  moveDown: function() {
    var can = this.canMoveTo(0,+2);
    if(can) {
      this.top += 2;
      this.bottom += 2;
      GridDisplay.safeUpdateArea(this.top-2, this.right, this.bottom, this.left);
    }
    return can;
  }
}


FallingBlocks.tri = {
  // as for hex games, move left or right also goes down a line, so share code
  __proto__: HexFallingBlock,

  moveDown: function() {
    // testing both lines ensures a triangle can't drop through a bunch facing
    // the other direction.
    var can = this.canMoveTo(0,+1) && this.canMoveTo(0,+2);
    if(can) {
      this.top += 2;
      this.bottom += 2;
      GridDisplay.safeUpdateArea(this.top-2, this.right, this.bottom, this.left);
    }
    return can;
  }
}





var BaseGrid = {
  width: 0,
  height: 0,

  // y,x indexed, because we often want to remove rows
  grid: [],

  newGrid: function(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(height);
    for(var y = 0; y < height; y++) {
      var line = new Array(width);
      for(var x = 0; x != width; x++) line[x] = 0;
      this.grid[y] = line;
    }
  },

  newEmptyRow: function() {
    var line = new Array(this.width);
    for(var x = 0; x != this.width; x++) line[x] = 0;
    this.grid.unshift(line);
  },

  inBounds: function(x, y) {
    return x>=0 && x<this.width && y>=0 && y<this.height;
  },

  getElement: function(x, y) {
    return this.grid[y][x];
  },

  lineIsFull: function(y) {
    var line = this.grid[y];
    for(var x = 0; x != this.width; x++) if(!line[x]) return false;
    return true;
  },

  canAdd: function(block, x, y) {
    const grid = this.grid, gwidth = this.width, gheight = this.height;
    const height = block.length, width = block[0].length;
    var yi, yj, xi, xj;
    for(yi = 0, yj = y; yi != height; ++yi, ++yj) {
      if(yj < 0 || yj >= gheight) {
        // beyond bottom/top of grid, so all tiles of block must be empty
        for(xi = 0; xi != width; ++xi)
          if(block[yi][xi]) return false;
      } else {
        // if block has a tile here must fall inside grid, and not on a tile in the grid
        for(xi = 0, xj = x; xi != width; ++xi, ++xj) {
          if(block[yi][xi] && (xj < 0 || xj >= gwidth || grid[yj][xj])) return false;
        }
      }
    }
    return true;
  },

  // assumes canAdd(...) is true
  addBlock: function(block, x, y) {
    const grid = this.grid, height = block.length, width = block[0].length;
    for(var yi = 0, yj = y; yi != height; ++yi, ++yj) {
      for(var xi = 0, xj = x; xi != width; ++xi, ++xj) {
        var val = block[yi][xi];
        if(val) grid[yj][xj] = val;
      }
    }
  }
}


var SquareGrid = {
  __proto__: BaseGrid,

  removeCompleteLines: function() {
    // work out which lines need removing
    var linesToRemove = [];
    for(var y = FallingBlock.top; y < this.height; y++)
      if(this.lineIsFull(y))
        linesToRemove.push(y);
    // remove each line and insert a blank one at top of array
    for(var i = 0; i < linesToRemove.length; i++) {
      this.grid.splice(linesToRemove[i],1);
      this.newEmptyRow();
    }
    // update score and lines
    Game.scoreRemovingLines(linesToRemove.length);
  }
}


var HexGrid = {
  __proto__: BaseGrid,

  removeCompleteLines: function() {
    var numLinesRemoved = 0;
    var y = this.height - 2, odd = false;
    while(y != 0) {
      // The "line" that is checked consists of the bottom halves of some hexes
      // and the top halves of others.  Half-hexes should never be created, so
      // it's sufficient to check this.
      if(this.lineIsFull(y)) {
        // on an odd numbered row the line wiggles down initially
        this.removeLine(y, odd);
        numLinesRemoved++;
        // the stuff that drop down might allow for a new upward-wiggling line
        // xxx is this correct?
        if(odd) { y++; odd = !odd; }
      } else {
        y--;
        odd = !odd;
      }
    }
    // update score and lines
    Game.scoreRemovingLines(numLinesRemoved);
  },

  /*
  Here we're trying to remove something like this:
  .#.#.#.#.#.        #.#.#.#.#.
  ###########   or   ##########    <--- y
  #.#.#.#.#.#        .#.#.#.#.#
  from a y-x indexed array.
  We copy alternate elements of the bottom line into the top one, remove the
  bottom two lines, then insert two blank rows at y = 0.
  */
  removeLine: function(row, wigglesUp) {
    var top = row - 1;
    var btm = row + 1;
    for(var x = wigglesUp ? 0 : 1; x < this.width; x += 2)
      this.grid[top][x] = this.grid[btm][x];
    this.grid.splice(row,2);
    this.newEmptyRow();
    this.newEmptyRow();
  }
}


var TriGrid = {
  __proto__: BaseGrid,

  /*
  "Lines" start from the left at a tile pointing right, and then go either
  up or down for the next tile, and then procede across and always form a
  solid block filling the two lines (which is why we just count down in 1s)
  */
  removeCompleteLines: function() {
    var numLinesRemoved = 0;
    for(var y = this.height - 2; y >= 0; y--)
      while(this.tryRemoveLine(y)) numLinesRemoved++;
    // update score and lines
    Game.scoreRemovingLines(numLinesRemoved);
  },

  tryRemoveLine: function(y) {
    var line = this.grid[y];
    var line2 = this.grid[y+1];
    for(var x = 0; x < this.width; x++)
      if(!line[x] || !line2[x]) return false;
    // remove
    this.grid.splice(y, 2);
    this.newEmptyRow();
    this.newEmptyRow();
    return true;
  }
}


var Grids = [];
Grids["sqr"] = SquareGrid;
Grids["hex"] = HexGrid;
Grids["tri"] = TriGrid;
var Grid;





var BaseGridDisplay = {
  width: 0,
  height: 0,
  grid: [],

  container: null,

  setSize: function(width, height) {
    if(width==this.width && height==this.height) {
      this.clear();
      return;
    }

    // remove old grid
    while(this.container.hasChildNodes()) this.container.removeChild(this.container.lastChild);

    this.width = width;
    this.height = height;

    this.grid = new Array(width);
    for(var x = 0; x != width; x++) {
      this.grid[x] = new Array(height);
      var col = document.createElement("vbox");
      for(var y = 0; y != height; y++) {
        var el = this.createTile(x, y);
        this.grid[x][y] = el;
        col.appendChild(el);
      }
      this.container.appendChild(col);
    }
  },

  clear: function() {
    for(var x = 0; x < this.width; x++)
      for(var y = 0; y < this.height; y++)
        this.grid[x][y].setState(0);
  },

  // for when we switch between square and hex games.
  hide: function() {
    this.container.hidden = true;
  },
  show: function() {
    this.container.hidden = false;
  },

  // no multiple inheritance, so to avoid having to duplicate these, we
  // just include both and assign one to createTile in the subclasses
  createSquareTile: function(x, y) {
    var tile = document.createElement("image");
    tile.setState = function(state) {
      this.className = "square-" + state;
    };
    tile.setState(0);
    return tile;
  },
  createHexTile: function(x, y) {
    var up = (x % 2 == y % 2);
    const prefix = "hex-" + (up ? "top-" : "btm-");
    var tile = document.createElement("image");
    tile.setState = function(state) {
      this.className = prefix + state;
    };
    tile.setState(0);
    return tile;
  },
  createTriTile: function(x, y) {
    var left = (x % 2 == y % 2);
    const prefix = "tri tri-" + (left ? "left-" : "right-");
    var tile = document.createElement("image");
    tile.setState = function(state) {
      this.className = prefix + state;
    };
    tile.setState(0);
    return tile;
  }
}





var BasePlayingField = {
  __proto__: BaseGridDisplay,

  updateArea: function(top, right, bottom, left) {
    for(var x = left; x < right; x++) {
      for(var y = top; y < bottom; y++) {
        var val = FallingBlock.safeGetElement(x,y);
        if(!val) val = Grid.getElement(x,y);
        this.grid[x][y].setState(val);
      }
    }
  },

  // restricts the area to be in bounds
  safeUpdateArea: function(top, right, bottom, left) {
    if(top < 0) top = 0;
    if(left < 0) left = 0;
    if(right > GridDisplay.width) right = GridDisplay.width;
    if(bottom > GridDisplay.height) bottom = GridDisplay.height;
    this.updateArea(top, right, bottom, left);
  },

  // this is called after lines have been removed from the grid.  we *want* it to ignore
  // FallingBlock, which has now been incorporated into the grid, but also still exists
  updateAll: function() {
    for(var x = 0; x < this.width; x++)
      for(var y = 0; y < this.height; y++)
        this.grid[x][y].setState(Grid.getElement(x,y));
  }
}


function GridDisplayObj(shape) {
  var id = shape + "-playing-field";
  this.container = document.getElementById(id);
  this.container.hidden = true;

  this.createTile =
    (shape=="sqr") ? this.createSquareTile :
    (shape=="hex") ? this.createHexTile :
    this.createTriTile;
}
GridDisplayObj.prototype = BasePlayingField;


var GridDisplays = [];
var GridDisplay = null;




var BaseNextBlockDisplay = {
  __proto__: BaseGridDisplay,

  enabled: true,

  update: function(block) {
    if(!this.enabled) return;
    this.clear();
    // Position the block in the centre of the space.
    // This is *essential* for hexagonal games because otherwise the display
    // ends up half a hex out, and it looks nice on square ones.
    var top = Math.floor((this.height-block.length)/2);
    var left = Math.floor((this.width-block[0].length)/2);
    for(var y = 0, y2 = top; y < block.length && y2 < this.height; y++, y2++)
      for(var x = 0, x2 = left; x < block[0].length && x2 < this.width; x++, x2++)
        this.grid[x2][y2].setState(block[y][x]);
  },

  // enable or disable
  toggle: function() {
    if(this.enabled) this.clear();
    this.enabled = !this.enabled;
  }
}


function NextBlockDisplayObj(shape) {
  var id = "next-" + shape + "-block-display";
  this.container = document.getElementById(id);
  this.container.hidden = true;

  this.createTile =
    (shape=="sqr") ? this.createSquareTile :
    (shape=="hex") ? this.createHexTile :
    this.createTriTile;
}
NextBlockDisplayObj.prototype = BaseNextBlockDisplay;


var NextBlockDisplays = [];
var NextBlockDisplay = null;
