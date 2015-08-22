const shapes = ["sqr", "hex", "tri"];

const tilePropertiess = {
  sqr: { width: 20, height: 20, xOffset: 20, yOffset: 20 },
  hex: { width: 24, height: 10, xOffset: 19, yOffset: 10 },
  tri: { width: 19, height: 20, xOffset: 19, yOffset: 10 }
};
var tileProperties = null;

const ui = {
  grid: "grid",
  gridContainer: "grid-container",
  fallingBlock: "falling-block",
  nextBlock: "next-block",
  pausedMsg: "msg-paused",
  gameOverMsg: "msg-gameover",
  score: "score-display",
  lines: "lines-display",
  level: "level-display"
};

var gCommandsEnabled = false;

var game = null; // a Game
var gPaused = false;

// width/height of the most-recently started game (which might now be over)
var gWidth = 0;
var gHeight = 0;
var gGameType = null; // 4th arg of newGameObj

var gTileShape = null; // sqr/hex/tri usually
var gBlockSizes = {}; // shape -> int array



function pause() {
  if(gPaused) return;
  Timer.stop();
  ui.pausedMsg.style.display = "block";
  gPaused = true;
  gCommandsEnabled = false;
}

function unpause() {
  if(!gPaused) return;
  Timer.start();
  ui.pausedMsg.style.display = "none";
  gPaused = false;
  gCommandsEnabled = true;
}

function togglePause() {
  if(gPaused) unpause();
  else pause();
}

function newGame(width, height, level) {
  if(game) game.end();
  ui.pausedMsg.style.display = "none";
  ui.gameOverMsg.style.display = "none";
  game = newGameObj(width || gWidth, height || gHeight, level || 1, gGameType);
  game.begin();
  gCommandsEnabled = true;
}

function endGame() {
  if(!game) return;
  game.end();
  game = null;
  gCommandsEnabled = false;
  ui.gameOverMsg.style.display = "block";
}


// settings dialogue

var wasPausedBeforeSettings = false;

function showSettingsDialogue() {
  const url = "chrome://blockfall/content/settings.xul";
  const flags = "dialog,dependent,modal,chrome";//,resizable";

  if(game) {
    wasPausedBeforeSettings = gPaused;
    if(!wasPausedBeforeSettings) pause();
  }
  openDialog(url, "flibble", flags, gTileShape, gBlockSizes);
}

function onSettingsCancel() {
  if(game && !wasPausedBeforeSettings) unpause();
}

function onSettingsAccept(shape, sizes) {
  // save prefs (using attribute persistence)
  const root = document.documentElement;
  root.setAttribute("pref2-tileshape", shape);
  for(var i in sizes)
    root.setAttribute("pref2-"+i+"-sizes", sizes[i]); // array->string

  // apply pref changes
  var old = gTileShape;
  gBlockSizes = sizes;
  Blocks.use(shape, sizes[shape]);

  // continue, or not
  if(game && !wasPausedBeforeSettings) unpause();
  if(old != shape) {
    endGame();
    tileShapeChanged(shape);
  }
}

function tileShapeChanged(shape) {
  gTileShape = shape;
  // xxx hex and tri games make assumptions about their sizes.
  gWidth = 10;
  gHeight = {sqr: 25, hex: 50, tri: 51}[shape];
  gGameType = Games[shape];
  tileProperties = tilePropertiess[shape];
  newGame();
}


window.onblur = function() {
  if(game) pause();
};


window.onload = function onLoad() {
  for(var i in ui) ui[i] = document.getElementById(ui[i]);

  const sqrTp = tilePropertiess.sqr, hexTp = tilePropertiess.hex, triTp = tilePropertiess.tri;
  sqrTp.oddImages = sqrTp.evenImages = _initTileSet("sqr");
  hexTp.oddImages = _initTileSet("hexb");
  hexTp.evenImages = _initTileSet("hex");
  triTp.oddImages = [];
  triTp.evenImages = [];

  GridView.init();
  FallingBlockView.init();

  // read prefs (from attributes)
  const root = document.documentElement;
  var shape = root.getAttribute("pref2-tileshape");
  for(i = 0; i != 3; ++i) {
    var sh = shapes[i];
    var sizes = gBlockSizes[sh] = root.getAttribute("pref2-"+sh+"-sizes").split(",");
    for(var j = 0; j != sizes.length; ++j) sizes[j] = parseInt(sizes[j]);
  }

/*
  var shape = "sqr";
  gBlockSizes = { sqr: [1], hex: [1], tri: [1,2]};
*/

  Blocks.use(shape, gBlockSizes[shape]);
  tileShapeChanged(shape);
};

window.onkeypress = function(ev) {
  if(ev.ctrlKey || ev.metaKey) return; // don't interfere with browser shortcuts

  if(!gCommandsEnabled) {
    // p for pause
    if(ev.charCode === 112) return doTogglePause(ev);
    return;
  }

  switch(ev.keyCode) {
    case 37: // left
      return doMoveLeft(ev);
    case 39: // right
      return doMoveRight(ev);
    case 40: // down
      return doMoveDown(ev);
    case 38: // up
      return doRotateClockwise(ev);
  }
  switch(ev.charCode) {
    case 112: // p
      return doTogglePause(ev);
    case 32: // spacebar
    case 104: // h
      return doDrop(ev);
    case 106: // j
    case 122: // z
      return doRotateAntiClockwise(ev);
    case 107: // k
    case 120: // x
      return doRotateClockwise(ev);
    case 44: // ","
      return doMoveLeft(ev);
    case 46: // "."
      return doMoveDown(ev);
    case 47: // "/"
      return doMoveRight(ev);
  }
};

function doTogglePause(ev) {
  ev.preventDefault();
  togglePause();
}

function doMoveLeft(ev) {
  ev.preventDefault();
  game.moveFallingBlockLeft();
};

function doMoveRight(ev) {
  ev.preventDefault();
  game.moveFallingBlockRight();
};

function doMoveDown(ev) {
  ev.preventDefault();
  game.moveFallingBlockDown();
};

function doDrop(ev) {
  ev.preventDefault();
  game.dropFallingBlock();
};

function doRotateClockwise(ev) {
  ev.preventDefault();
  game.rotateFallingBlockClockwise();
};

function doRotateAntiClockwise(ev) {
  ev.preventDefault();
  game.rotateFallingBlockAnticlockwise();
};



function _initTileSet(idPrefix) {
  const images = [];
  for(var i = 0; true; ++i) {
    var el = document.getElementById(idPrefix + i);
    if(!el) break;
    images.push(el);
    el.parentNode.removeChild(el);
  }
  return images;
}


const Timer = {
  interval: null,
  delay: 0,

  start: function() {
    this.interval = setInterval(game.timedMoveDown, this.delay);
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



function FallingBlock(block) {
  this.states = block;
  this.state = 0;
  var grid = this.grid = block[0];
  var height = this. height = grid.length;
  var width = this.width = grid[0].length;
  // position matters a lot in hex/tri games
  var left = this.left = Math.floor((game.width-width)/2);
  this.top = 0;
};



function newGameObj(width, height, level, basis) {
  const game = {};
  game.__proto__ = basis;
  game.width = width;
  game.height = height;
  game.level = game.startingLevel = level;
  const gr = game.grid = new Array(height);
  for(var y = 0; y != height; ++y) {
    var line = gr[y] = new Array(width);
    for(var x = 0; x != width; x++) line[x] = 0;
  }
  return game;
}


const Games = {};
Games.base = {
  width: 0,
  height: 0,
  startingLevel: 1,
  levelsCompleted: 0,
  score: 0,
  lines: 0,
  level: 1,
  grid: [[]], // y-x indexed
  fallingBlock: null,
  _nextBlock: null,

  begin: function() {
    ui.level.textContent = this.level;
    ui.lines.textContent = this.lines;
    ui.score.textContent = this.score;
    GridView.setSize(this.width, this.height);
    Timer.setDelay(this.startingLevel);
    window.sizeToContent();
    GridView.update();
    this._nextBlock = Blocks.getRandom();
    this.nextBlock();
    Timer.start();
  },

  end: function() {
    Timer.stop();
  },

  updateScoreAndLevel: function(numLinesRemoves, blockDropped) {
    if(numLinesRemoves) {
      if(this.lines >= (this.levelsCompleted+1)*10) {
        this.levelsCompleted++;
        ui.level.textContent = ++this.level;
        Timer.reduceDelay();
      }
      ui.lines.textContent = this.lines += numLinesRemoves;
      for(var i = 1; i <= numLinesRemoves; i++) this.score += i * 20;
    }
    var score = this.level;
    if(blockDropped) score *= this.level / 4;
    this.score += Math.ceil(score);
    ui.score.textContent = this.score;
  },

  blockReachedBottom: function(blockDropped) {
    Timer.stop();

    const block = this.fallingBlock;
    const bx = block.left, by = block.top, bw = block.width, bh = block.height;
    const bgrid = block.grid, grid = this.grid;
    for(var yi = 0, yj = by; yi != bh; ++yi, ++yj) {
      for(var xi = 0, xj = bx; xi != bw; ++xi, ++xj) {
        var val = bgrid[yi][xi];
        if(val) grid[yj][xj] = val;
      }
    }

    var top = block.top ? block.top - 1 : 0;
    var btm = block.top + block.height;
    if(btm > this.height) btm = this.height;
    var numLinesRemoves = this.removeCompleteLines(top, btm);
    if(numLinesRemoves) top = 0; // everything's moved down
    GridView.update(top, btm);
    this.updateScoreAndLevel(numLinesRemoves, blockDropped);
    if(this.nextBlock()) Timer.start();
    else endGame()
  },

  nextBlock: function() {
    const fb = new FallingBlock(this._nextBlock);
    this.fallingBlock = fb;
    if(!this.fallingBlockFitsAt(0,0)) return false;
    this._nextBlock = Blocks.getRandom();
    FallingBlockView.update();
    //NextBlockView.update(fb);
    return true;
  },

  // takes abitrary num of row indices (sorted in increasing order) as args
  _removeRows: function() {
    const a = arguments, n = a.length, g = this.grid, w = this.width;
    for(var i = 0; i != n; ++i) {
      var r = g.splice(a[i], 1);
      for(var x = 0; x != w; ++x) r[x] = 0;
      g.unshift(r);
    }
  },

  _lineIsFull: function(y) {
    const w = this.width;
    const line = this.grid[y];
    for(var x = 0; x != w; ++x) if(!line[x]) return false;
    return true;
  },

  // block[][] (y-x indexed) is a state of some block.  x and y are offsets into this grid
  canAdd: function(block, x, y) {
    const grid = this.grid, gwidth = this.width, gheight = this.height;
    const height = block.length, width = block[0].length;
    var yi, yj, xi, xj;
    for(yi = 0, yj = y; yi != height; ++yi, ++yj) {
      if(yi < 0 || yj >= gheight) {
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

  // fallingBlock fits into gird at given offset from current position
  fallingBlockFitsAt: function(dx, dy) {
    const f = this.fallingBlock;
    return this.canAdd(f.grid, f.left + dx, f.top + dy)
  },

  // note: block.length is the number of states this block has
  rotateFallingBlockClockwise: function() {
    const f = this.fallingBlock;
    var s = f.state;
    if(++s == f.states.length) s = 0;
    this._maybeRotateFallingBlock(s);
  },

  rotateFallingBlockAnticlockwise: function() {
    const f = this.fallingBlock;
    var s = f.state;
    if(s-- == 0) s += f.states.length;
    this._maybeRotateFallingBlock(s);
  },

  _maybeRotateFallingBlock: function(newstate) {
    const f = this.fallingBlock;
    var newgrid = f.states[newstate];
    if(!this.canAdd(newgrid, f.left, f.top)) return;
    f.state = newstate;
    f.grid = newgrid;
    FallingBlockView.update()
  },

  dropFallingBlock: function() {
    while(this._moveFallingBlockDown());
    this.blockReachedBottom(true);
  },

  timedMoveDown: function() {
    // |this|==window because function is called via setInterval
    if(!game.moveFallingBlockDown()) game.blockReachedBottom();
  },

  moveFallingBlockDown: function() {
    if(!this._moveFallingBlockDown()) return false;
    FallingBlockView.move();
    return true;
  },

  _moveFallingBlock: function(dx, dy) {
    const f = this.fallingBlock;
    if(!this.fallingBlockFitsAt(dx, dy)) return;
    f.left += dx;
    f.top += dy;
    FallingBlockView.move();
  }
}


Games.sqr = {
  __proto__: Games.base,

  moveFallingBlockLeft: function() { this._moveFallingBlock(-1, 0); },
  moveFallingBlockRight: function() { this._moveFallingBlock(1, 0); },

  // must return a boolean for the timed drop function
  _moveFallingBlockDown: function() {
    if(!this.fallingBlockFitsAt(0, 1)) return false;
    this.fallingBlock.top += 1;
    return true;
  },

  removeCompleteLines: function(top, bottom) {
    for(var y = top, num = 0; y != bottom; ++y) {
      if(!this._lineIsFull(y)) continue;
      this._removeRows(y);
      ++num;
    }
    return num;
  }
}


Games.hex = {
  __proto__: Games.base,

  moveFallingBlockLeft: function() { this._moveFallingBlock(-1, 1); },
  moveFallingBlockRight: function() { this._moveFallingBlock(1, 1); },

  _moveFallingBlockDown: function() {
    if(!this.fallingBlockFitsAt(0, 2)) return false;
    this.fallingBlock.top += 2;
    return true;
  },

  removeCompleteLines: function(top, bottom) {
    const g = this.grid, w = this.width;
    var num = 0;
    if(bottom == this.height) --bottom;
    for(var y = top, odd = top % 2; y != bottom; ++y, odd = !odd) {
      // row of half-hexes is full <==> appropriate half-hexes in row above+below are full
      if(!this._lineIsFull(y)) continue;
      /*
      Here we're trying to remove something like:
      .#.#.#.#.#.        #.#.#.#.#.    <-- y1
      ###########   or   ##########    <-- y
      #.#.#.#.#.#        .#.#.#.#.#    <-- y2
      So copy alternate values from y2 to y1, then remove y and y2
      */
      var y1 = y - 1;
      var y2 = y + 1;
      for(var x = odd ? 0 : 1; x < w; x += 2) g[y1][x] = g[y2][x];
      this._removeRows(y, y2);
      ++num;
    }
    return num;
  }
}


Games.tri = {
  __proto__: Games.base,

  moveFallingBlockLeft: function() { this._moveFallingBlock(-1, 1); },
  moveFallingBlockRight: function() { this._moveFallingBlock(1, 1); },

  /*
  "Lines" start from the left at a tile pointing right, and then go either
  up or down for the next tile, and then proceed across and always form a
  solid block filling the two lines (which is why we just count in ones)
  */
  removeCompleteLines: function(top, bottom) {
    const h = this.height, w = this.width, g = this.grid;
    if(bottom >= h - 2) bottom = h - 2;
    var num = 0;
    for(var y = bottom; y != top; --y) {
      if(!this._lineIsFull(y) || !this._lineIsFull(y+1)) continue;
      this._removeRows(y, y+1);
      ++num;
    }
    return num;
  },

  _moveFallingBlockDown: function() {
    // don't allow tiles to drop through ones facing the other way
    if(!this.fallingBlockFitsAt(0, 1) || !this.fallingBlockFitsAt(0, 2)) return false;
    this.fallingBlock.top += 2;
    return true;
  }
}




const GridView = {
  width: 0, // in tiles
  height: 0,
  _context: null, // a CanvasRenderingContext2D
  _canvas: null,
  _container: null,

  init: function() {
    this._canvas = ui.grid;
    this._context = this._canvas.getContext("2d");
    this._container = ui.gridContainer;
  },

  // set size to a given number of *tiles*
  setSize: function(width, height) {
    const cx = this._context, canvas = this._canvas;
    const tp = tileProperties;
    const tw = tp.width, th = tp.height, tx = tp.xOffset, ty = tp.yOffset;
    cx.clearRect(0, 0, canvas.width, canvas.height);
    this.width = width;
    this.height = height;
    const w = this._canvas.width = width * tx - tx + tw;
    const h = this._canvas.height = height * ty - ty + th;
    this._container.style.width = w + "px";
    this._container.style.height = h + "px";
  },

  update: function(top, bottom) {
    if(!top) top = 0;
    const tp = tileProperties, cx = this._context, w = this.width, h = this.height, grid = game.grid;
    const oImages = tp.oddImages, eImages = tp.evenImages, tx = tp.xOffset, ty = tp.yOffset;
    if(!bottom) bottom = h;
    for(var y = top, firstTileOdd = top % 2; y != bottom; ++y, firstTileOdd = !firstTileOdd)
      for(var x = 0, tileOdd = firstTileOdd; x != w; ++x, tileOdd = !tileOdd)
        cx.drawImage((tileOdd ? oImages : eImages)[grid[y][x]], x * tx, y * ty);
  }
};



var FallingBlockView = {
  // in tiles
  width: 0,
  height: 0,
  _context: null, // a CanvasRenderingContext2D
  _canvas: null,

  init: function() {
    this._canvas = ui.fallingBlock;
    this._context = this._canvas.getContext("2d");
  },

  update: function() {
    const cx = this._context, fb = game.fallingBlock;
    const w = fb.width, h = fb.height, t = fb.top, l = fb.left, grid = fb.grid;
    const tp = tileProperties, oImages = tp.oddImages, eImages = tp.evenImages,
          tw = tp.width, th = tp.height, tx = tp.xOffset, ty = tp.yOffset;
    // position canvas
    const canvas = this._canvas;
    canvas.style.top = (t * ty) + "px";
    canvas.style.left = (l * tx) + "px";
    canvas.width = w * tx - tx + tw;
    canvas.height = h * ty - ty + th;
    // draw the block
    cx.clearRect(0, 0, canvas.width, canvas.height);
    var firstTileOdd = (l % 2) ^ (t % 2);
    for(var y = 0; y != h; ++y, firstTileOdd = !firstTileOdd) {
      for(var x = 0, tileOdd = firstTileOdd; x != w; ++x, tileOdd = !tileOdd) {
        var val = grid[y][x];
        if(val) cx.drawImage((tileOdd ? oImages : eImages)[val], x * tx, y * ty);
      }
    }
  },

  move: function() {
    const canvas = this._canvas;
    canvas.style.top = (game.fallingBlock.top * tileProperties.yOffset) + "px";
    canvas.style.left = (game.fallingBlock.left * tileProperties.xOffset) + "px";
  },
};
