function setLevel(level) {
  Game.start(null, null, level);
}
function setSize(width, height) {
  Game.start(width, height, null);
}

function keyPressed(e) {
  var key = e.keyCode;
  if(Game.paused) {
    //p or pause
    if((key == 80)||(key == 19)) Game.pause();
    return;
  }
  switch(key) {
    case 40: // down
      FallingBlock.moveDown(); break;
    case 37: // left
      FallingBlock.moveLeft(); break;
    case 39: // right
      FallingBlock.moveRight(); break;
    case 38: // up
    case 75: // k
      FallingBlock.rotateClockwise(); break;
    case 74: // j
      FallingBlock.rotateAnticlockwise(); break;
    case e.DOM_VK_SPACE:
      FallingBlock.drop(); break;
    case 80: // p
    case 19: // pause
      Game.pause(); break;
  }
}



function changeBlocks(shape, event) {
  var shapeChanged = (shape!=Blocks.currentShape);
  // don't rebuild the blocks if user has clicked button for current game type
  if(event && event.originalTarget.localName=='toolbarbutton' && !shapeChanged) {
    Game.start();
    return;
  }
  //
  document.documentElement.setAttribute("pref-shape",shape);
  Blocks.change(shape);
  if(shapeChanged) changeMode(shape);
}

function changeMode(newshape) {
  Game.end();
  if(NextBlockDisplay) NextBlockDisplay.hide();
  if(GridDisplay) GridDisplay.hide();
  var height;
  if(newshape=="sqr") {
    height = 25;
  } else if(newshape=="hex") {
    height = 50;
  } else {
    height = 51;
  }
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
  for(var i = 0; i < shapes.length; i++) {
    shape = shapes[i];
    GridDisplays[shape] = new GridDisplayObj(shape);
    NextBlockDisplays[shape] = new NextBlockDisplayObj(shape);
  }
  NextBlockDisplays["sqr"].setSize(5,5);
  NextBlockDisplays["hex"].setSize(7,13);
  NextBlockDisplays["tri"].setSize(6,10);
  Game.init();
  changeBlocks(document.documentElement.getAttribute("pref-shape"));
}, false);



var Game = {
  width: 10,
  height: 25,
  startingLevel: 0,
  levelsCompleted: 0,
  paused: false,

  scoreDisplay: null,
  linesDisplay: null,
  levelDisplay: null,

  init: function() {
    this.scoreDisplay = document.getElementById("score-display");
    this.linesDisplay = document.getElementById("lines-display");
    this.levelDisplay = document.getElementById("level-display");
  },

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
    this.paused = false;

    Grid.newGrid(width, height);
    GridDisplay.setSize(width, height);

    Timer.resetDelay();
    for(var i = 1; i < startingLevel; i++) Timer.reduceDelay();

    window.sizeToContent();
    GridDisplay.updateAll();
    document.onkeydown = keyPressed;
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
    this.scoreDisplay.value = val;
  },

  _lines: 0,
  get lines() {
    return this._lines;
  },
  set lines(val) {
    this._lines = val;
    this.linesDisplay.value = val;
  },

  _level: 0,
  get level() {
    return this._level;
  },
  set level(val) {
    this._level = val;
    this.levelDisplay.value = val;
  },


  // actually pause/unpause
  pause: function() {
    if(Game.paused) Timer.start();
    else Timer.stop();
    Game.paused = !Game.paused;
  },


  // score 20 points for a line, 60 for 2 lines, 120 for 3 lines, 200 for 4 lines
  scoreRemovingLines: function(numlines) {
    this.lines += numlines;
    for(var i = 1; i <= numlines; i++) this.score += i * 20;
  },
  scoreBlockDropped: function(wasDropped) {
    var score = this.level;
    if(wasDropped) score *= 5;
    if(NextBlockDisplay.enabled) score = parseInt(score / 2);
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



var blocks = [];
var Blocks = {
  currentSet: [],
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
    var blockNumber = parseInt(Math.random() * this.currentSet.length);
    if(blockNumber == this.currentSet.length) blockNumber--;
    this._next = this.currentSet[blockNumber];
  },

  // first elt of array is shape, remaining elts are types (e.g. standard, pentris,...)
  change: function(shape, refreshTypes) {
    this.currentShape = shape;

    var menu = document.getElementById("blocks-"+shape+"-types");
    // iterate across each menuitem and add appropriate blocks if checked
    var set = [];
    var items = menu.childNodes;
    for(var i = 0; i < items.length; i++) {
      if(items[i].getAttribute("checked")!="true") continue;
      set = set.concat(blocks[shape][items[i].value]);
    }
    this.currentSet = set;
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
    this.delay = parseInt(this.delay * 0.8);
  }
}





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
    var left = parseInt((Game.width-width)/2);
    var right = left + width;
    // see if the block can be copied
    for(var y = 0; y < height; y++) {
      for(var x = 0, x2 = left; x < width; x++, x2++) {
        if(Grid.getElement(x2,y) && block[y][x]) {
          return false;
        }
      }
    }

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
    for(var x = 0, x2 = this.left; x < this.width; x++, x2++) {
      for(var y = 0, y2 = this.top; y < this.height; y++, y2++) {
        var val = this.grid[y][x];
        if(val) Grid.setElement(x2,y2,val);
      }
    }
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
    if(!this.canRotate(newgrid)) return;
    this.state = newstate;
    this.grid = newgrid;
    GridDisplay.safeUpdateArea(this.top, this.right, this.bottom, this.left);
  },
  canRotate: function(newgrid) {
    for(var x = 0, x2 = this.left; x < this.width; x++, x2++)
      for(var y = 0, y2 = this.top; y < this.height; y++, y2++)
        // if we have an element out of the grid, or overlapping another tile...
        if(newgrid[y][x] && !Grid.elementFree(x2,y2)) return false;
    return true;
  },

  canMoveTo: function(leftchange, topchange) {
    var newleft = this.left+leftchange;
    var newtop = this.top+topchange;
    for(var x = 0, x2 = newleft; x < this.width; x++, x2++)
      for(var y = 0, y2 = newtop; y < this.height; y++, y2++)
        // if we have an element out of the grid, or overlapping another tile...
        if(this.grid[y][x] && !Grid.elementFree(x2,y2)) return false;
    return true;
  },

  drop: function() {
    while(this.moveDown());
    Game.blockReachedBottom(true);
  },

  timedMoveDown: function() {
    if(!FallingBlock.moveDown()) Game.blockReachedBottom();
  }
}


var SquareFallingBlock = {
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
var HexFallingBlock = {
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


var TriFallingBlock = {
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


var FallingBlocks = [];
FallingBlocks["sqr"] = SquareFallingBlock;
FallingBlocks["hex"] = HexFallingBlock;
FallingBlocks["tri"] = TriFallingBlock;
var FallingBlock;





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
    return (x>=0 && x<this.width && y>=0 && y<this.height);
  },

  getElement: function(x, y) {
    return this.grid[y][x];
  },

  // false if coords out of bounds, or refer to an occupied element
  elementFree: function(x, y) {
    return (this.inBounds(x,y) && this.grid[y][x]===0);
  },

  setElement: function(x, y, val) {
    this.grid[y][x] = val;
  },
  
  lineIsFull: function(y) {
    var line = this.grid[y];
    for(var x = 0; x != this.width; x++) if(!line[x]) return false;
    return true;
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

  /* Here we're trying to remove something like this:
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
  
  /* "Lines" start from the left at a tile pointing right, and then go either
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
    for(var x = 0; x < width; x++) {
      this.grid[x] = new Array(height);
      var col = document.createElement("vbox");
      for(var y = 0; y < height; y++) {
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
    var prefix = "hex-" + (up ? "top-" : "btm-");
    var tile = document.createElement("image");
    tile.setState = function(state) {
      this.className = prefix + state;
    };
    tile.setState(0);
    return tile;
  },
  createTriTile: function(x, y) {
    var left = (x % 2 == y % 2);
    var prefix = "tri tri-" + (left ? "left-" : "right-");
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
    var top = parseInt((this.height-block.length)/2);
    var left = parseInt((this.width-block[0].length)/2);
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
