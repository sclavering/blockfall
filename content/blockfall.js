var Blocks;

function setLevel(level) {
  Game.start(null, null, level);
}
function setSize(width, height) {
  Game.start(width, height, null);
}
function newGame() {
  Game.start();
}

function keyPressed(e) {
  var key = e.keyCode;
  if(Game.paused) {
    if((key == 80)||(key == 19)) //p or pause
      Game.pause();
    return;
  }
  if(key == 40) // down
    FallingBlock.moveDown();
  else if(key == 37) // left
    FallingBlock.moveLeft();
  else if(key == 39) // right
    FallingBlock.moveRight();
  else if((key == 38)||(key == 75)) // up or k
    FallingBlock.rotateClockwise();
  else if(key == 74) // j
    FallingBlock.rotateAnticlockwise();
  else if(key == e.DOM_VK_SPACE)
    FallingBlock.drop();
  else if((key == 80)||(key == 19)) //p or pause
    Game.pause();
}


function changeBlocks(menu) {
  if(!menu) menu = document.getElementById("menu-blocktypes-popup");
  Blocks = [];
  // iterate across each menuitem and add appropriate blocks if checked
  var menuitems = menu.childNodes;
  for(var i = 0; i < menuitems.length; i++) {
    var item = menuitems[i];
    if(item.hasAttribute("checked"))
      Blocks = Blocks.concat(blocks_all[item.value]);
  }
}



window.onload = function() {
  changeBlocks();
  GridDisplay.init();
  NextBlockDisplay.create();
  newGame();
  Game.start();
}



var Game = {
  width: 10,
  height: 25,
  startingLevel: 0,
  level: 0,
  levelsCompleted: 0,
  lines: 0,
  score: 0,
  paused: false,

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
    this.updateDisplay();
    document.onkeydown = keyPressed;
    // add a block to top of grid
    this.setNextBlock();
    FallingBlock.setBlock(Game.nextBlock);
    this.setNextBlock();
  },

  end: function() {
    Timer.stop();
    document.onkeydown = null;
  },


  nextBlock: null,

  setNextBlock: function() {
    var blockNumber = parseInt(Math.random() * Blocks.length);
    if(blockNumber == Blocks.length) blockNumber--;
    this.nextBlock = Blocks[blockNumber];
    NextBlockDisplay.update(this.nextBlock[0]);
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
    for(var i = 1; i <= numlines; i++) Game.score += i * 20; 
  },
  scoreBlockDropped: function() {
    if(NextBlockDisplay.enabled)
      this.score += parseInt(this.level / 2);
    else
      // was getting string concatenation without the parseInt !
      this.score += parseInt(this.level);
  },
  
  // increase level if appropriate
  updateLevel: function() {
    if(this.lines >= (this.levelsCompleted+1)*10) {
      this.levelsCompleted++;
      this.level++;
      Timer.reduceDelay();
    }
  },
  
  
  blockReachedBottom: function() {
    Timer.stop();
    FallingBlock.addToGrid();
    Grid.removeCompleteLines();
    this.scoreBlockDropped();
    this.updateLevel();
    this.updateDisplay();
    FallingBlock.setBlock(this.nextBlock);
    this.setNextBlock();
  },
  
  updateDisplay: function() {
    GridDisplay.updateAll();
    document.getElementById("score-display").value = this.score;
    document.getElementById("lines-display").value = this.lines;
    document.getElementById("level-display").value = this.level;
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





var FallingBlock = {
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
          Game.end();
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

    Timer.start();
    GridDisplay.updateArea(0, right, height, left);
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
    var newstate = this.state - 1;
    if(newstate==-1) newstate += this.block.length;
    this.tryRotate(newstate);
  },
  rotateAnticlockwise: function() {
    var newstate = this.state + 1;
    if(newstate==this.block.length) newstate = 0;
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
        if(newgrid[y][x] && (!Grid.inBounds(x2,y2) || Grid.getElement(x2,y2))) return false;
    return true;
  },

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
  },
  canMoveTo: function(leftchange, topchange) {
    var newleft = this.left+leftchange;
    var newtop = this.top+topchange;
    for(var x = 0, x2 = newleft; x < this.width; x++, x2++)
      for(var y = 0, y2 = newtop; y < this.height; y++, y2++)
        // if we have an element out of the grid, or overlapping another tile...
        if(this.grid[y][x] && (!Grid.inBounds(x2,y2) || Grid.getElement(x2,y2))) return false;
    return true;
  },
  
  drop: function() {
    while(FallingBlock.moveDown());
    // XXX: should score more points for a drop
    Game.blockReachedBottom();
  },
  
  timedMoveDown: function() {
    if(!FallingBlock.moveDown()) Game.blockReachedBottom();
  }
}
  




var Grid = {
  width: 0,
  height: 0,

  // y,x indexed, because we often want to remove rows
  grid: [],

  newGrid: function(width, height) {
    this.width = width;
    this.height = height;
    this.grid = new Array(height);
    for(var y = 0; y < height; y++) {
      this.grid[y] = new Array(width);
      for(var x = 0; x < width; x++) this.grid[y][x] = 0;
    }
  },

  removeCompleteLines: function() {
    // work out which lines need removing
    var linesToRemove = [];
    for(var y = FallingBlock.top; y < this.height; y++)
      if(this.isLineComplete(y))
        linesToRemove.push(y);
    // remove each line and insert a blank one at top of array
    for(var i = 0; i < linesToRemove.length; i++) {
      this.grid.splice(linesToRemove[i],1);
      this.grid.unshift(this.newEmptyLine());
    }
    // update score and lines
    Game.scoreRemovingLines(linesToRemove.length);
  },
  isLineComplete: function(y) {
    var line = this.grid[y];
    for(var x = 0; x < this.width; x++)
      if(!line[x]) return false;
    return true;
  },
  newEmptyLine: function() {
    var line = new Array(this.width);
    for(var x = 0; x < this.width; x++) line[x] = 0;
    return line;
  },

  inBounds: function(x, y) {
    return (x>=0 && x<this.width && y>=0 && y<this.height);
  },
  
  getElement: function(x, y) {
    return this.grid[y][x];
  },
  
  safeGetElement: function(x, y) {
    if(!this.inBounds(x,y)) return null;
    return this.getElement(x,y);
  },
  
  setElement: function(x, y, val) {
    this.grid[y][x] = val;
  }
}





var GridDisplay = {
  container: null,

  width: 0,
  height: 0,
  grid: [],

  init: function() {
    this.container = document.getElementById("playing-field");
  },

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
        var el = document.createElement("image");
        el.className = "square-0";
        this.grid[x][y] = el;
        col.appendChild(el);
      }
      this.container.appendChild(col);
    }
  },

  clear: function() {
    for(var x = 0; x < this.width; x++)
      for(var y = 0; y < this.height; y++)
        this.grid[x][y].className = "square-0";
  },

  updateArea: function(top, right, bottom, left) {
    for(var x = left; x < right; x++) {
      for(var y = top; y < bottom; y++) {
        var val = FallingBlock.safeGetElement(x,y);
        if(!val) val = Grid.getElement(x,y);
        this.grid[x][y].className = "square-" + val;
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
    for(var x = 0; x < this.width; x++) {
      for(var y = 0; y < this.height; y++) {
        this.grid[x][y].className = "square-" + Grid.getElement(x,y);
      }
    }
  }
}





var NextBlockDisplay = {
  enabled: true,

  grid: [],
  container: null,
  width: 0,
  height: 0,

  create: function() {
    this.container = document.getElementById("next-block-display");
    this.setSize(5,5);
  },

  setSize: function(width, height) {
//    while(container.hasChildNodes()) container.removeChild(container.lastChild);
    this.width = width;
    this.height = height;

    this.grid = new Array(width);
    for(var x = 0; x < width; x++) {
      this.grid[x] = new Array(height);
      var col = document.createElement("vbox");
      for(var y = 0; y < height; y++) {
        var el = document.createElement("image");
        el.className = "square-0";
        this.grid[x][y] = el;
        col.appendChild(el);
      }
      this.container.appendChild(col);
    }
  },

  update: function(block) {
    if(!this.enabled) return;
    for(var x = 0; x < this.width; x++) {
      for(var y = 0; y < this.height; y++) {
        var num = ((y<block.length)&&(x<block[0].length)) ? block[y][x] : 0;
        this.grid[x][y].className = "square-"+num;
      }
    }
  },

  clear: function() {
    for(var x = 0; x < this.width; x++)
      for(var y = 0; y < this.height; y++)
        this.grid[x][y].className = "square-0";
  },

  // enable or disable
  toggle: function() {
    if(this.enabled)
      this.clear();
//    else
//      this.update([]);
    this.enabled = !this.enabled
  }
}
