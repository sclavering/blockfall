const shapes = ["sqr", "hex", "tri"];

const ui = {
  grid: "grid",
  gridContainer: "grid-container",
  fallingBlock: "falling-block",
  nextBlock: "next-block",
  pausedMsg: "msg-paused",
  gameOverMsg: "msg-gameover",
  score: "score-display",
  lines: "lines-display",
  level: "level-display",
  game_type_picker: "game-type-picker",
  sqr_tiles: "sqr-tiles",
  hex_tiles: "hex-tiles",
};

var gCommandsEnabled = false;

var game = null; // a Game
var gPaused = false;

// width/height of the most-recently started game (which might now be over)
var gWidth = 0;
var gHeight = 0;
var gGameType = null; // 4th arg of newGameObj

var gTileShape = null; // sqr/hex/tri usually


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


function doShowGameTypePicker() {
  if(game) pause();
  ui.game_type_picker.style.display = "block";
}

function doCancelGameTypePicker() {
  ui.game_type_picker.style.display = "none";
}

function doPickGameType(ev) {
  ev.preventDefault();
  endGame();
  doCancelGameTypePicker();

  const form = ev.target.form;
  let shape = null;
  for(let el of form.elements["shape"]) if(el.checked) { shape = el.value; break; }
  let tiles = [];
  for(let el of form.elements["tiles-" + shape]) if(el.checked) tiles.push(+el.value);

  // xxx use this!
  let level = +form.elements["startinglevel"].value;

  tileShapeChanged(shape, tiles);
}

function tileShapeChanged(shape, sizes) {
  Blocks.use(shape, sizes);

  gTileShape = shape;
  // xxx hex and tri games make assumptions about their sizes.
  gWidth = 10;
  gHeight = {sqr: 25, hex: 50, tri: 51}[shape];
  gGameType = Games[shape];
  g_tileset = k_tilesets[shape];
  newGame();
}


window.onblur = function() {
  if(game) pause();
};


window.onload = function onLoad() {
  for(let i in ui) ui[i] = document.getElementById(ui[i]);

  init_tilesets();
  GridView.init();
  FallingBlockView.init();

  tileShapeChanged("sqr", [1]);
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
  this.left = Math.floor((game.width - width) / 2);
  this.top = 0;
};



function newGameObj(width, height, level, basis) {
  const game = { __proto__: basis };
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
    FallingBlockView.update();
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
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.width = width;
    this.height = height;
    const w = this._canvas.width = width * g_tileset.xOffset - g_tileset.xOffset + g_tileset.width;
    const h = this._canvas.height = height * g_tileset.yOffset - g_tileset.yOffset + g_tileset.height;
    this._container.style.width = w + "px";
    this._container.style.height = h + "px";
  },

  update: function(top, bottom) {
    if(!top) top = 0;
    if(!bottom) bottom = this.height;
    const grid = game.grid;
    for(let y = top, firstTileOdd = top % 2; y != bottom; ++y, firstTileOdd = !firstTileOdd) {
      for(let x = 0, tileOdd = firstTileOdd; x != this.width; ++x, tileOdd = !tileOdd) {
        let tile_top = (tileOdd ? g_tileset.odd_tile_tops : g_tileset.even_tile_tops)[grid[y][x]];
        let dx = x * g_tileset.xOffset, dy = y * g_tileset.yOffset;
        this._context.drawImage(g_tileset.image, 0, tile_top, g_tileset.width, g_tileset.height, dx, dy, g_tileset.width, g_tileset.height);
      }
    }
  },
};



const FallingBlockView = {
  init: function() {
    this._canvas = ui.fallingBlock;
    this._context = this._canvas.getContext("2d");
  },

  update: function() {
    const fb = game.fallingBlock;
    const w = fb.width, h = fb.height, t = fb.top, l = fb.left, grid = fb.grid;
    // position canvas
    this._canvas.style.top = (t * g_tileset.yOffset) + "px";
    this._canvas.style.left = (l * g_tileset.xOffset) + "px";
    this._canvas.width = w * g_tileset.xOffset - g_tileset.xOffset + g_tileset.width;
    this._canvas.height = h * g_tileset.yOffset - g_tileset.yOffset + g_tileset.height;
    // draw the block
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    let firstTileOdd = (l % 2) ^ (t % 2);
    for(let y = 0; y != h; ++y, firstTileOdd = !firstTileOdd) {
      for(let x = 0, tileOdd = firstTileOdd; x != w; ++x, tileOdd = !tileOdd) {
        let val = grid[y][x];
        if(!val) continue;
        let tile_top = (tileOdd ? g_tileset.odd_tile_tops : g_tileset.even_tile_tops)[val];
        let dx = x * g_tileset.xOffset, dy = y * g_tileset.yOffset;
        this._context.drawImage(g_tileset.image, 0, tile_top, g_tileset.width, g_tileset.height, dx, dy, g_tileset.width, g_tileset.height);
      }
    }
  },

  move: function() {
    this._canvas.style.top = (game.fallingBlock.top * g_tileset.yOffset) + "px";
    this._canvas.style.left = (game.fallingBlock.left * g_tileset.xOffset) + "px";
  },
};
