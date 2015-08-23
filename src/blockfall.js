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
  tri_tiles: "tri-tiles",
};


var gGame = null;

// Details of the most recent game (which might now be over), stored so the next game can be the same type.
var gWidth = 0;
var gHeight = 0;
var gTileShape = null;
var gBlockSetsForShape = null;


function togglePause() {
  if(gGame.is_paused) gGame.unpause();
  else gGame.pause();
}

function newGame(width, height, level) {
  if(gGame) gGame.end();
  ui.pausedMsg.style.display = "none";
  ui.gameOverMsg.style.display = "none";
  gGame = newGameObj(width || gWidth, height || gHeight, level || 1, gTileShape, gBlockSetsForShape);
  gGame.begin();
}

function endGame() {
  if(!gGame) return;
  gGame.end();
  gGame = null;
  ui.gameOverMsg.style.display = "block";
}


function doShowGameTypePicker() {
  if(gGame) gGame.pause();
  ui.game_type_picker.style.display = "block";
}

function doCancelGameTypePicker() {
  ui.game_type_picker.style.display = "none";
}

function doPickGameType(ev) {
  ev.preventDefault();
  if(gGame) gGame.end();
  doCancelGameTypePicker();

  const form = ev.target.form;
  let shape = null;
  for(let el of form.elements["shape"]) if(el.checked) { shape = el.value; break; }
  const tiles = [];
  for(let el of form.elements["tiles-" + shape]) if(el.checked) tiles.push(+el.value);

  // xxx use this!
  let level = +form.elements["startinglevel"].value;

  tileShapeChanged(shape, tiles);
}

function tileShapeChanged(shape, sizes) {
  gTileShape = shape;
  gBlockSetsForShape = sizes;
  // xxx hex and tri games make assumptions about their sizes.
  gWidth = 10;
  gHeight = { sqr: 25, hex: 50, tri: 51 }[shape];
  g_tileset = k_tilesets[shape];
  newGame();
}


window.onblur = function() {
  if(gGame) gGame.pause();
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
  if(!gGame) return;

  if(gGame.is_paused) {
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
  gGame.moveFallingBlockLeft();
};

function doMoveRight(ev) {
  ev.preventDefault();
  gGame.moveFallingBlockRight();
};

function doMoveDown(ev) {
  ev.preventDefault();
  gGame.moveFallingBlockDown();
};

function doDrop(ev) {
  ev.preventDefault();
  gGame.dropFallingBlock();
};

function doRotateClockwise(ev) {
  ev.preventDefault();
  gGame.rotateFallingBlockClockwise();
};

function doRotateAntiClockwise(ev) {
  ev.preventDefault();
  gGame.rotateFallingBlockAnticlockwise();
};


function FallingBlock(block) {
  this.states = block;
  this.state = 0;
  const grid = this.grid = block[0];
  this.height = grid.length;
  this.width = grid[0].length;
  this.left = Math.floor((gGame.width - this.width) / 2);
  this.top = 0;
};


function newGameObj(width, height, level, shape, blockSetNumbers) {
  const game = { __proto__: Games[shape] };
  game.is_paused = false;
  game.width = width;
  game.height = height;
  game.level = game.startingLevel = level;
  const grid = game.grid = new Array(height);
  for(let y = 0; y != height; ++y) {
    let line = grid[y] = new Array(width);
    for(let x = 0; x != width; x++) line[x] = 0;
  }

  const sets = get_block_sets(shape, blockSetNumbers);
  game._blocks = game._block_sets = null;
  if(sets.length > 1) game._block_sets = sets;
  else game._blocks = sets[0];

  return game;
};


const Games = {};


Games.base = {
  width: 0,
  height: 0,
  startingLevel: 1,
  levelsCompleted: 0,
  score: 0,
  lines: 0,
  level: 1,
  grid: null, // y-x indexed
  fallingBlock: null,
  _nextBlock: null,

  _delay: null,
  _interval: null,

  begin: function() {
    ui.level.textContent = this.level;
    ui.lines.textContent = this.lines;
    ui.score.textContent = this.score;
    GridView.setSize(this.width, this.height);
    this._delay = 1000;
    for(let i = 1; i < this.startingLevel; ++i) this._reduce_delay();
    GridView.update(0, this.height);
    this._nextBlock = this._get_new_block();
    this.nextBlock();
    this._bound_timedMoveDown = () => this.timedMoveDown();
    this._start_timer();
  },

  _reduce_delay: function() {
    this._delay = Math.ceil(this._delay * 0.8);
  },

  end: function() {
    this._stop_timer();
  },

  pause: function() {
    if(this.is_paused) return;
    this.is_paused = true;
    this._stop_timer();
    ui.pausedMsg.style.display = "block";
  },

  unpause: function() {
    if(!this.is_paused) return;
    this.is_paused = false;
    this._start_timer();
    ui.pausedMsg.style.display = "none";
  },

  _start_timer: function() {
    this._interval = setInterval(this._bound_timedMoveDown, this._delay);
  },

  _stop_timer: function() {
    if(!this._interval) return;
    clearInterval(this._interval);
    this._interval = null;
  },

  _get_new_block: function() {
    const blocks = this._blocks || random_element(this._block_sets);
    return random_element(blocks);
  },

  updateScoreAndLevel: function(numLinesRemoves, blockDropped) {
    if(numLinesRemoves) {
      if(this.lines >= (this.levelsCompleted+1)*10) {
        this.levelsCompleted++;
        ui.level.textContent = ++this.level;
        this._reduce_delay();
      }
      ui.lines.textContent = this.lines += numLinesRemoves;
      for(let i = 1; i <= numLinesRemoves; i++) this.score += i * 20;
    }
    let score = this.level;
    if(blockDropped) score *= this.level / 4;
    this.score += Math.ceil(score);
    ui.score.textContent = this.score;
  },

  blockReachedBottom: function(blockDropped) {
    this._stop_timer();

    const block = this.fallingBlock;
    const bx = block.left, by = block.top, bw = block.width, bh = block.height;
    const bgrid = block.grid, grid = this.grid;
    for(let yi = 0, yj = by; yi != bh; ++yi, ++yj) {
      for(let xi = 0, xj = bx; xi != bw; ++xi, ++xj) {
        let val = bgrid[yi][xi];
        if(val) grid[yj][xj] = val;
      }
    }

    let top = block.top ? block.top - 1 : 0;
    let btm = block.top + block.height;
    if(btm > this.height) btm = this.height;
    const numLinesRemoves = this.removeCompleteLines(top, btm);
    if(numLinesRemoves) top = 0; // everything's moved down
    GridView.update(top, btm);
    this.updateScoreAndLevel(numLinesRemoves, blockDropped);
    if(this.nextBlock()) this._start_timer();
    else endGame()
  },

  nextBlock: function() {
    this.fallingBlock = new FallingBlock(this._nextBlock);
    if(!this.fallingBlockFitsAt(0,0)) return false;
    this._nextBlock = this._get_new_block();
    FallingBlockView.update();
    return true;
  },

  _remove_row: function(y) {
    let row = this.grid.splice(y, 1);
    for(let x = 0; x !== this.width; ++x) row[x] = 0;
    this.grid.unshift(row);
  },

  _lineIsFull: function(y) {
    for(let val of this.grid[y]) if(!val) return false;
    return true;
  },

  // block[][] (y-x indexed) is a state of some block.  x and y are offsets into this grid
  canAdd: function(block, x, y) {
    const grid = this.grid;
    const height = block.length, width = block[0].length;
    for(let yi = 0, yj = y; yi != height; ++yi, ++yj) {
      if(yi < 0 || yj >= this.height) {
        // beyond bottom/top of grid, so all tiles of block must be empty
        for(let xi = 0; xi != width; ++xi)
          if(block[yi][xi]) return false;
      } else {
        // if block has a tile here must fall inside grid, and not on a tile in the grid
        for(let xi = 0, xj = x; xi != width; ++xi, ++xj) {
          if(block[yi][xi] && (xj < 0 || xj >= this.width || grid[yj][xj])) return false;
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
    let s = f.state;
    if(++s == f.states.length) s = 0;
    this._maybeRotateFallingBlock(s);
  },

  rotateFallingBlockAnticlockwise: function() {
    const f = this.fallingBlock;
    let s = f.state;
    if(s-- == 0) s += f.states.length;
    this._maybeRotateFallingBlock(s);
  },

  _maybeRotateFallingBlock: function(newstate) {
    const f = this.fallingBlock;
    const newgrid = f.states[newstate];
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
    if(!this.moveFallingBlockDown()) this.blockReachedBottom();
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
  },
};


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
    let num = 0;
    for(let y = top; y != bottom; ++y) {
      if(!this._lineIsFull(y)) continue;
      this._remove_row(y);
      ++num;
    }
    return num;
  },
};


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
    let num = 0;
    if(bottom == this.height) --bottom;
    for(let y = top, odd = top % 2; y != bottom; ++y, odd = !odd) {
      // row of half-hexes is full <==> appropriate half-hexes in row above+below are full
      if(!this._lineIsFull(y)) continue;
      /*
      Here we're trying to remove something like:
      .#.#.#.#.#.        #.#.#.#.#.    <-- y1
      ###########   or   ##########    <-- y
      #.#.#.#.#.#        .#.#.#.#.#    <-- y2
      So copy alternate values from y2 to y1, then remove y and y2
      */
      let y1 = y - 1;
      let y2 = y + 1;
      for(let x = odd ? 0 : 1; x < this.width; x += 2) this.grid[y1][x] = this.grid[y2][x];
      this._remove_row(y);
      this._remove_row(y2);
      ++num;
    }
    return num;
  },
};


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
    const h = this.height, w = this.width;
    if(bottom >= h - 2) bottom = h - 2;
    let num = 0;
    for(let y = bottom; y != top; --y) {
      if(!this._lineIsFull(y) || !this._lineIsFull(y+1)) continue;
      this._remove_row(y)
      this._remove_row(y + 1);
      ++num;
    }
    return num;
  },

  _moveFallingBlockDown: function() {
    // don't allow tiles to drop through ones facing the other way
    if(!this.fallingBlockFitsAt(0, 1) || !this.fallingBlockFitsAt(0, 2)) return false;
    this.fallingBlock.top += 2;
    return true;
  },
};


function random_element(xs) {
  let r;
  do { r = Math.random(); } while(r === 1.0);
  return xs[Math.floor(r * xs.length)];
};


const GridView = {
  init: function() {
    this._canvas = ui.grid;
    this._context = this._canvas.getContext("2d");
    this._container = ui.gridContainer;
  },

  // set size to a given number of *tiles*
  setSize: function(width, height) {
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    const w = this._canvas.width = width * g_tileset.xOffset - g_tileset.xOffset + g_tileset.width;
    const h = this._canvas.height = height * g_tileset.yOffset - g_tileset.yOffset + g_tileset.height;
    this._container.style.width = w + "px";
    this._container.style.height = h + "px";
  },

  update: function(top, bottom) {
    let firstTileOdd = top % 2;
    draw_tiles(this._context, gGame.grid.slice(top, bottom), firstTileOdd, { y: top, draw_empties: true });
  },
};


const FallingBlockView = {
  init: function() {
    this._canvas = ui.fallingBlock;
    this._context = this._canvas.getContext("2d");
  },

  update: function() {
    const fallingBlock = gGame.fallingBlock;
    // position canvas
    this._canvas.style.top = (fallingBlock.top * g_tileset.yOffset) + "px";
    this._canvas.style.left = (fallingBlock.left * g_tileset.xOffset) + "px";
    this._canvas.width = fallingBlock.width * g_tileset.xOffset - g_tileset.xOffset + g_tileset.width;
    this._canvas.height = fallingBlock.height * g_tileset.yOffset - g_tileset.yOffset + g_tileset.height;
    // draw the block
    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    let firstTileOdd = (fallingBlock.left % 2) ^ (fallingBlock.top % 2);
    draw_tiles(this._context, fallingBlock.grid, firstTileOdd, {});
  },

  move: function() {
    this._canvas.style.top = (gGame.fallingBlock.top * g_tileset.yOffset) + "px";
    this._canvas.style.left = (gGame.fallingBlock.left * g_tileset.xOffset) + "px";
  },
};
