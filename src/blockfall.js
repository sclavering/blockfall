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
var g_grid_view = null;
var g_falling_block_view = null;

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
  g_grid_view = new GridView(ui.grid);
  g_falling_block_view = new GridView(ui.fallingBlock);

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
  _nextBlock: null,

  _falling_block_states: null,
  _falling_block_state: null,
  _falling_block_grid: null,
  _falling_block_x: null,
  _falling_block_y: null,

  _delay: null,
  _interval: null,

  begin: function() {
    ui.level.textContent = this.level;
    ui.lines.textContent = this.lines;
    ui.score.textContent = this.score;
    g_grid_view.resize(this.width, this.height);
    this._delay = 1000;
    for(let i = 1; i < this.startingLevel; ++i) this._reduce_delay();
    this._update_grid_view(0, this.height);
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

    const x0 = this._falling_block_x;
    const y0 = this._falling_block_y;
    const fgrid = this._falling_block_grid;
    for(let y = 0; y !== fgrid.length; ++y) {
      for(let x = 0; x !== fgrid[y].length; ++x) {
        let val = fgrid[y][x];
        if(val) this.grid[y0 + y][x0 + x] = val;
      }
    }

    let top = this._falling_block_y ? this._falling_block_y - 1 : 0;
    let btm = this._falling_block_y + this._falling_block_grid.length;
    if(btm > this.height) btm = this.height;
    const numLinesRemoves = this.removeCompleteLines(top, btm);
    if(numLinesRemoves) top = 0; // everything's moved down
    this._update_grid_view(top, btm);
    this.updateScoreAndLevel(numLinesRemoves, blockDropped);
    if(this.nextBlock()) this._start_timer();
    else endGame()
  },

  nextBlock: function() {
    const block = this._falling_block_states = this._nextBlock;
    this._falling_block_state = 0;
    const grid = this._falling_block_grid = block[0];
    this._falling_block_x = Math.floor((this.width - grid[0].length) / 2);
    this._falling_block_y = 0;

    if(!this._falling_block_can_move_by(0, 0)) return false;
    this._nextBlock = this._get_new_block();
    this._redraw_falling_block();
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

  _falling_block_can_move_by: function(dx, dy) {
    return this.canAdd(this._falling_block_grid, this._falling_block_x + dx, this._falling_block_y + dy)
  },

  // note: block.length is the number of states this block has
  rotateFallingBlockClockwise: function() {
    let s = this._falling_block_state + 1;
    if(s === this._falling_block_states.length) s = 0;
    this._maybeRotateFallingBlock(s);
  },

  rotateFallingBlockAnticlockwise: function() {
    let s = this._falling_block_state - 1;
    if(s === -1) s += this._falling_block_states.length;
    this._maybeRotateFallingBlock(s);
  },

  _maybeRotateFallingBlock: function(newstate) {
    const newgrid = this._falling_block_states[newstate];
    if(!this.canAdd(newgrid, this._falling_block_x, this._falling_block_y)) return;
    this._falling_block_state = newstate;
    this._falling_block_grid = newgrid;
    this._redraw_falling_block();
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
    this._reposition_falling_block_view();
    return true;
  },

  _moveFallingBlock: function(dx, dy) {
    if(!this._falling_block_can_move_by(dx, dy)) return;
    this._falling_block_x += dx;
    this._falling_block_y += dy;
    this._reposition_falling_block_view();
  },

  _update_grid_view: function(top, bottom) {
    const firstTileOdd = top % 2;
    g_grid_view.draw(this.grid.slice(top, bottom), firstTileOdd, { y: top, draw_empties: true });
  },

  _reposition_falling_block_view: function() {
    g_falling_block_view.position(this._falling_block_x, this._falling_block_y);
  },

  _redraw_falling_block: function() {
    const grid = this._falling_block_grid, x = this._falling_block_x, y = this._falling_block_y;
    g_falling_block_view.resize(grid[0].length, grid.length);
    g_falling_block_view.position(x, y);
    // note: conceptually this is ((x % 2) XOR (y % 2)), but since x can be negative (and thus lead to (-1 ^ 1) not giving the answer we want), it's easier to write it this way.
    const firstTileOdd = !!((x + y) % 2);
    g_falling_block_view.draw(grid, firstTileOdd, {});
  },
};


Games.sqr = {
  __proto__: Games.base,

  moveFallingBlockLeft: function() { this._moveFallingBlock(-1, 0); },
  moveFallingBlockRight: function() { this._moveFallingBlock(1, 0); },

  // must return a boolean for the timed drop function
  _moveFallingBlockDown: function() {
    if(!this._falling_block_can_move_by(0, 1)) return false;
    this._falling_block_y += 1;
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
    if(!this._falling_block_can_move_by(0, 2)) return false;
    this._falling_block_y += 2;
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
      this._remove_row(y);
      this._remove_row(y + 1);
      ++num;
    }
    return num;
  },

  _moveFallingBlockDown: function() {
    // don't allow tiles to drop through ones facing the other way
    if(!this._falling_block_can_move_by(0, 1) || !this._falling_block_can_move_by(0, 2)) return false;
    this._falling_block_y += 2;
    return true;
  },
};


function random_element(xs) {
  let r;
  do { r = Math.random(); } while(r === 1.0);
  return xs[Math.floor(r * xs.length)];
};
