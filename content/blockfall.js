const shapes = ["sqr", "hex", "tri"];

var ui = {
  grids: "stack-grids",
  pausedMsg: "msg-paused",
  gameOverMsg: "msg-gameover",
  score: "score-display",
  lines: "lines-display",
  level: "level-display",
};

var commands = {
  left: "cmd.left",
  right: "cmd.right",
  down: "cmd.down",
  drop: "cmd.drop",
  rotateClockwise: "cmd.rotate.clockwise",
  rotateAnticlockwise: "cmd.rotate.anticlockwise",
  pause: "cmd.pause",
};

var game = null; // a Game

// width/height of the most-recently started game (which might now be over)
var gWidth = 0;
var gHeight = 0;

var gTileShape = null; // sqr/hex/tri usually
var gBlockSizes = {}; // shape -> int array
var gShowGridLines = false;

// shape -> obj maps
var FallingBlocks = {};
var Grids = {};
var NextBlockDisplays = {};
var GridDisplays = {};
// objs for the current shape
var FallingBlock = null;
var Grid = null;
var NextBlockDisplay = null;
var GridDisplay = null;



function pause() {
  if(game.paused) return;
  Timer.stop();
  ui.pausedMsg.hidden = false;
  game.paused = true;
  for(var i in commands)
    if(i != "pause")
      commands[i].setAttribute("disabled", "true");
}

function unpause() {
  if(!game.paused) return;
  Timer.start()
  ui.pausedMsg.hidden = true;
  game.paused = false;
  for(var i in commands)
    if(i != "pause")
      commands[i].removeAttribute("disabled");
}

function togglePause() {
  if(game.paused) unpause();
  else pause();
}

function newGame(width, height, level) {
  if(game) game.end();
  ui.pausedMsg.hidden = true;
  ui.gameOverMsg.hidden = true;
  game = new Game(width || gWidth, height || gHeight, level || 1);
  game.begin();
  for(var i in commands) commands[i].removeAttribute("disabled");
}

function endGame() {
  if(!game) return;
  game.end();
  game = null;
  for(var i in commands) commands[i].setAttribute("disabled", "true");
  ui.gameOverMsg.hidden = false;
}


// settings dialogue

var wasPausedBeforeSettings = false;

function showSettingsDialogue() {
  const url = "chrome://blockfall/content/settings.xul";
  const flags = "dialog,dependent,modal,chrome";//,resizable";

  if(game) {
    wasPausedBeforeSettings = game.paused;
    if(!wasPausedBeforeSettings) pause();
  }
  openDialog(url, "flibble", flags, gTileShape, gBlockSizes, gShowGridLines);
}

function onSettingsCancel() {
  if(game && !wasPausedBeforeSettings) unpause();
}

function onSettingsAccept(shape, sizes, showgridlines) {
  // save prefs (using attribute persistence)
  const root = document.documentElement;
  root.setAttribute("pref-tileshape", shape);
  for(var i in sizes)
    root.setAttribute("pref-"+i+"-sizes", sizes[i]); // array->string
  root.setAttribute("pref-gridlines", showgridlines);

  // apply pref changes
  var old = gTileShape;
  gBlockSizes = sizes;
  Blocks.use(shape, sizes[shape]);

  if(gShowGridLines != showgridlines)
    ui.grids.className = showgridlines ? "gridlines" : "";
  gShowGridLines = showgridlines;

  // continue, or not
  if(!wasPausedBeforeSettings) unpause();
  if(old != shape) {
    endGame();
    NextBlockDisplay.hide();
    GridDisplay.hide();
    tileShapeChanged(shape);
  }
}



function tileShapeChanged(shape) {
  gTileShape = shape;
  NextBlockDisplay = NextBlockDisplays[shape];
  GridDisplay = GridDisplays[shape];
  FallingBlock = FallingBlocks[shape];
  Grid = Grids[shape];
  NextBlockDisplay.show();
  GridDisplay.show();
  // xxx hex and tri games make assumptions about their sizes.
  gWidth = 10;
  gHeight = {sqr: 25, hex: 50, tri: 51}[shape];
  newGame();
}


function onWindowBlur() {
  if(game) pause();
}


window.onload = function onLoad() {
  for(var i in ui) ui[i] = document.getElementById(ui[i]);
  for(i in commands) commands[i] = document.getElementById(commands[i]);

  // random init fun
  GridDisplays.sqr = new GridDisplayObj("sqr");
  GridDisplays.hex = new GridDisplayObj("hex");
  GridDisplays.tri = new GridDisplayObj("tri");
  NextBlockDisplays.sqr = new NextBlockDisplayObj("sqr", 5, 5);
  NextBlockDisplays.hex = new NextBlockDisplayObj("hex", 7, 13);
  NextBlockDisplays.tri = new NextBlockDisplayObj("tri", 6, 10);

  // read prefs (from attributes)
  const root = document.documentElement;
  var shape = root.getAttribute("pref-tileshape");
  for(i = 0; i != 3; ++i) {
    var sh = shapes[i];
    var sizes = gBlockSizes[sh] = root.getAttribute("pref-"+sh+"-sizes").split(",");
    for(var j = 0; j != sizes.length; ++j) sizes[j] = parseInt(sizes[j]);
  }
  gShowGridLines = root.getAttribute("pref-gridlines")=="true";
  if(gShowGridLines) ui.grids.className = "gridlines";
/*
  shape = "sqr";
  gBlockSizes = { sqr: [1], hex: [1], tri: [1,2]};
  */

  Blocks.use(shape, gBlockSizes[shape]);
  tileShapeChanged(shape);
};




// bad OOP (rest of file)

function Game(width, height, startingLevel) {
  this.width = width;
  this.height = height;
  this.startingLevel = startingLevel;
}


Game.prototype = {
  paused: false,

  width: 0,
  height: 0,
  startingLevel: 1,
  levelsCompleted: 0,

  score: 0,
  lines: 0,
  level: 1,

  _nextBlock: null,

  begin: function() {
    const width = this.width, height = this.height, startingLevel = this.startingLevel;

    ui.level.value = this.level = this.startingLevel;
    this.levelsCompleted = 0;
    ui.lines.value = this.lines = 0;
    ui.score.value = this.score = 0;

    Grid.newGrid(width, height);
    GridDisplay.setSize(width, height);

    Timer.setDelay(startingLevel);
    window.sizeToContent();
    GridDisplay.updateAll();
    this._nextBlock = Blocks.getRandom();
    this.addNextBlock();
  },

  end: function() {
    Timer.stop();
  },

  // score 20 points for a line, 60 for 2 lines, 120 for 3 lines, 200 for 4 lines
  scoreRemovingLines: function(numlines) {
    ui.lines.value = this.lines += numlines;
    for(var i = 1; i <= numlines; i++) this.score += i * 20;
    ui.score.value = this.score;
  },

  scoreBlockDropped: function(wasDropped) {
    var score = this.level;
    if(wasDropped) score *= this.level / 4;
    if(NextBlockDisplay.enabled) score /= 2;
    ui.score.value = this.score += Math.ceil(score);
  },

  // increase level if appropriate
  updateLevel: function() {
    if(this.lines >= (this.levelsCompleted+1)*10) {
      this.levelsCompleted++;
      ui.level.value = ++this.level;
      Timer.reduceDelay();
    }
  },

  blockReachedBottom: function(wasDropped) {
    Timer.stop();
    Grid.addBlock(FallingBlock);
    this.scoreBlockDropped(wasDropped);
    this.updateLevel();
    GridDisplay.updateAll();
    this.addNextBlock();
  },

  addNextBlock: function() {
    if(FallingBlock.setBlock(this._nextBlock)) {
      this._nextBlock = Blocks.getRandom();
      NextBlockDisplay.update(this._nextBlock);
      Timer.start();
    } else {
      endGame();
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
  setDelay: function(level) {
    var delay = 1000;
    for(var i = 1; i != level; ++i) delay *= 0.8;
    this.delay = delay;
  },
  reduceDelay: function() {
    this.delay = Math.ceil(this.delay * 0.8);
  }
}





FallingBlocks.base = {
  // Grid.addBlock relies on these 5
  top: 0,
  left: 0,
  width: 0,
  height: 0,
  // y-x indexed
  grid: null,

  bottom: 0,
  right: 0,

  blockState: 0,
  block: [[]],

  // returns a bool for if the new block can be added
  setBlock: function(newblock) {
    // get the block
    var block = newblock[0];
    var height = block.length;
    var width = block[0].length;
    // determine left edge where block will be placed from
    var left = Math.floor((game.width-width)/2);
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

  drop: function() {
    while(this.moveDown());
    game.blockReachedBottom(true);
  },

  timedMoveDown: function() {
    if(!FallingBlock.moveDown()) game.blockReachedBottom();
  }
}


FallingBlocks.sqr = {
  __proto__: FallingBlocks.base,

  moveLeft: function() {
    if(!Grid.canAdd(this.grid, this.left - 1, this.top)) return;
    this.left--;
    this.right--;
    GridDisplay.safeUpdateArea(this.top, this.right+1, this.bottom, this.left);
  },

  moveRight: function() {
    if(!Grid.canAdd(this.grid, this.left + 1, this.top)) return;
    this.left++;
    this.right++;
    GridDisplay.safeUpdateArea(this.top, this.right, this.bottom, this.left-1);
  },

  // must return a boolean for the timed drop function
  moveDown: function() {
    var can = Grid.canAdd(this.grid, this.left, this.top + 1);
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
FallingBlocks.hex = {
  __proto__: FallingBlocks.base,

  canMoveTo: function(leftchange, topchange) {
    return Grid.canAdd(this.grid, this.left+leftchange, this.top+topchange);
  },

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
  __proto__: FallingBlocks.hex,

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





Grids.base = {
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

  // takes abitrary num of row indices (sorted in increasing order) as args
  removeRows: function() {
    const a = arguments, n = a.length, g = this.grid, w = this.width;
    //alert(a+"\n"+a.length);
    for(var i = 0; i != n; ++i) {
      var r = g.splice(a[i], 1);
      for(var x = 0; x != w; ++x) r[x] = 0;
      g.unshift(r);
    }
  },

  inBounds: function(x, y) {
    return x>=0 && x<this.width && y>=0 && y<this.height;
  },

  getElement: function(x, y) {
    return this.grid[y][x];
  },

  lineIsFull: function(y) {
    const w = this.width;
    var line = this.grid[y];
    for(var x = 0; x != w; ++x) if(!line[x]) return false;
    return true;
  },

  // block[][] (y-x indexed) is a state of some block.  x and y are offsets into this grid
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

  // block is a FallingBlock
  addBlock: function(block) {
    const bx = block.left, by = block.top, bw = block.width, bh = block.height;
    const bgrid = block.grid, grid = this.grid;
    for(var yi = 0, yj = by; yi != bh; ++yi, ++yj) {
      for(var xi = 0, xj = bx; xi != bw; ++xi, ++xj) {
        var val = bgrid[yi][xi];
        if(val) grid[yj][xj] = val;
      }
    }

    this.removeCompleteLines();
  }
}


Grids.sqr = {
  __proto__: Grids.base,

  removeCompleteLines: function() {
    const y0 = FallingBlock.top;
    var y1 = FallingBlock.bottom;
    if(y1 > this.height) y1 = this.height;
    var num = 0;
    for(var y = y0; y != y1; ++y) {
      if(!this.lineIsFull(y)) continue;
      this.removeRows(y);
      ++num;
    }
    game.scoreRemovingLines(num);
  }
}


Grids.hex = {
  __proto__: Grids.base,

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
    game.scoreRemovingLines(numLinesRemoved);
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
    this.removeRows(row, row+1);
  }
}


Grids.tri = {
  __proto__: Grids.base,

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
    game.scoreRemovingLines(numLinesRemoved);
  },

  tryRemoveLine: function(y) {
    var line = this.grid[y];
    var line2 = this.grid[y+1];
    for(var x = 0; x < this.width; x++)
      if(!line[x] || !line2[x]) return false;
    this.removeRows(y, y+1);
    return true;
  }
}





// various forms of createTile for different shapes
const createTiles = {
  sqr: function(x, y) {
    var tile = document.createElement("image");
    tile.classPrefix = "square-";
    tile.className = "square-0";
    return tile;
  },

  hex: function(x, y) {
    var up = (x % 2 == y % 2);
    var tile = document.createElement("image");
    var prefix = tile.classPrefix = "hex-" + (up ? "top-" : "btm-");
    tile.className = prefix + "0";
    return tile;
  },

  tri: function(x, y) {
    var left = (x % 2 == y % 2);
    var tile = document.createElement("image");
    var prefix = tile.classPrefix = "tri tri-" + (left ? "left-" : "right-");
    tile.className = prefix + "0";
    return tile;
  }
}




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

    const cont = this.container;
    // remove old grid
    while(cont.hasChildNodes()) cont.removeChild(cont.firstChild);

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
    const w = this.width, h = this.height;
    for(var x = 0; x != w; x++) {
      for(var y = 0; y != h; y++) {
        var tile = this.grid[x][y];
        tile.className = tile.classPrefix + "0";
      }
    }
  },

  // for when we switch between square and hex games.
  hide: function() {
    this.container.hidden = true;
  },

  show: function() {
    this.container.hidden = false;
  }
}





var BasePlayingField = {
  __proto__: BaseGridDisplay,

  updateArea: function(top, right, bottom, left) {
    for(var x = left; x < right; x++) {
      for(var y = top; y < bottom; y++) {
        var val = FallingBlock.safeGetElement(x,y);
        if(!val) val = Grid.getElement(x,y);
        var tile = this.grid[x][y];
        tile.className = tile.classPrefix + val;
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
    const w = this.width, h = this.height;
    for(var x = 0; x != w; x++) {
      for(var y = 0; y != h; y++) {
        var tile = this.grid[x][y];
        tile.className = tile.classPrefix + Grid.getElement(x,y);
      }
    }
  }
}


function GridDisplayObj(shape) {
  var id = shape + "-playing-field";
  this.container = document.getElementById(id);
  this.container.hidden = true;
  this.createTile = createTiles[shape];
}
GridDisplayObj.prototype = BasePlayingField;




var BaseNextBlockDisplay = {
  __proto__: BaseGridDisplay,

  enabled: true,

  update: function(block) {
    if(!this.enabled) return;
    block = block[0]; // go from block to state
    const h = this.height, w = this.width;
    this.clear();
    // Position the block in the centre of the space.
    // This is *essential* for hexagonal games because otherwise the display
    // ends up half a hex out, and it looks nice on square ones.
    var top = Math.floor((h - block.length) / 2);
    var left = Math.floor((w - block[0].length) / 2);
    for(var y = 0, y2 = top; y < block.length && y2 < h; y++, y2++) {
      for(var x = 0, x2 = left; x < block[0].length && x2 < w; x++, x2++) {
        var tile = this.grid[x2][y2];
        tile.className = tile.classPrefix + block[y][x];
      }
    }
  },

  // enable or disable
  toggle: function() {
    if(this.enabled) this.clear();
    this.enabled = !this.enabled;
  }
}


function NextBlockDisplayObj(shape, width, height) {
  var id = "next-" + shape + "-block-display";
  this.container = document.getElementById(id);
  this.container.hidden = true;
  this.createTile = createTiles[shape];
  this.setSize(width, height);
}
NextBlockDisplayObj.prototype = BaseNextBlockDisplay;
