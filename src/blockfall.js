const ui = {
  grid: "grid",
  grid_container: "grid-container",
  falling_block: "falling-block",
  next_block: "next-block",
  paused_msg: "msg-paused",
  game_over_msg: "msg-gameover",
  score: "score-display",
  lines: "lines-display",
  level: "level-display",
  game_type_picker: "game-type-picker",
  sqr_tiles: "sqr-tiles",
  hex_tiles: "hex-tiles",
  tri_tiles: "tri-tiles",
};


var g_game = null;

// Details of the most recent game (which might now be over), stored so the next game can be the same type.
var g_width = 0;
var g_height = 0;
var g_tile_shape = null;
var g_block_sets_for_shape = null;


function toggle_pause() {
  if(g_game.is_paused) g_game.unpause();
  else g_game.pause();
}

function new_game(width, height, level) {
  if(g_game) g_game.end();
  ui.paused_msg.style.display = "none";
  ui.game_over_msg.style.display = "none";
  g_game = new_game_obj(width || g_width, height || g_height, level || 1, g_tile_shape, g_block_sets_for_shape);
  g_game.begin(g_tile_shape);
}

function end_game() {
  if(!g_game) return;
  g_game.end();
  g_game = null;
  ui.game_over_msg.style.display = "block";
}


function do_show_game_type_picker() {
  if(g_game) g_game.pause();
  ui.game_type_picker.style.display = "block";
}

function do_cancel_game_type_picker() {
  ui.game_type_picker.style.display = "none";
}

function do_pick_game_type(ev) {
  ev.preventDefault();
  if(g_game) g_game.end();
  do_cancel_game_type_picker();

  const form = ev.target.form;
  let shape = null;
  for(let el of form.elements["shape"]) if(el.checked) { shape = el.value; break; }
  const tiles = [];
  for(let el of form.elements["tiles-" + shape]) if(el.checked) tiles.push(+el.value);

  // xxx use this!
  let level = +form.elements["startinglevel"].value;

  tile_shape_changed(shape, tiles);
}

function tile_shape_changed(shape, sizes) {
  g_tile_shape = shape;
  g_block_sets_for_shape = sizes;
  // xxx hex and tri games make assumptions about their sizes.
  g_width = 10;
  g_height = { sqr: 25, hex: 50, tri: 51 }[shape];
  new_game();
}


window.onblur = function() {
  if(g_game) g_game.pause();
};


window.onload = function() {
  for(let i in ui) ui[i] = document.getElementById(ui[i]);
  init_tilesets();
  tile_shape_changed("sqr", [1]);
};


window.onkeypress = function(ev) {
  if(ev.ctrlKey || ev.metaKey) return; // don't interfere with browser shortcuts
  if(!g_game) return;

  if(g_game.is_paused) {
    // p for pause
    if(ev.charCode === 112) return do_toggle_pause(ev);
    return;
  }

  switch(ev.keyCode) {
    case 37: // left
      return do_move_left(ev);
    case 39: // right
      return do_move_right(ev);
    case 40: // down
      return do_move_down(ev);
    case 38: // up
      return do_rotate_clockwise(ev);
  }
  switch(ev.charCode) {
    case 112: // p
      return do_toggle_pause(ev);
    case 32: // spacebar
    case 104: // h
      return do_drop(ev);
    case 106: // j
    case 122: // z
      return do_rotate_anti_clockwise(ev);
    case 107: // k
    case 120: // x
      return do_rotate_clockwise(ev);
    case 44: // ","
      return do_move_left(ev);
    case 46: // "."
      return do_move_down(ev);
    case 47: // "/"
      return do_move_right(ev);
  }
};

function do_toggle_pause(ev) {
  ev.preventDefault();
  toggle_pause();
}

function do_move_left(ev) {
  ev.preventDefault();
  g_game.move_falling_block_left();
};

function do_move_right(ev) {
  ev.preventDefault();
  g_game.move_falling_block_right();
};

function do_move_down(ev) {
  ev.preventDefault();
  g_game.move_falling_block_down();
};

function do_drop(ev) {
  ev.preventDefault();
  g_game.drop_falling_block();
};

function do_rotate_clockwise(ev) {
  ev.preventDefault();
  g_game.rotate_falling_block_clockwise();
};

function do_rotate_anti_clockwise(ev) {
  ev.preventDefault();
  g_game.rotate_falling_block_anticlockwise();
};


function new_game_obj(width, height, level, shape, block_set_numbers) {
  const game = { __proto__: Games[shape] };
  game.is_paused = false;
  game.width = width;
  game.height = height;
  game.level = game.starting_level = level;
  const grid = game.grid = new Array(height);
  for(let y = 0; y != height; ++y) {
    let line = grid[y] = new Array(width);
    for(let x = 0; x != width; x++) line[x] = 0;
  }

  const sets = get_block_sets(shape, block_set_numbers);
  game._blocks = game._block_sets = null;
  if(sets.length > 1) game._block_sets = sets;
  else game._blocks = sets[0];

  return game;
};


const Games = {};


Games.base = {
  width: 0,
  height: 0,
  starting_level: 1,
  levels_completed: 0,
  score: 0,
  lines: 0,
  level: 1,
  grid: null, // y-x indexed
  _next_block: null,

  _falling_block_states: null,
  _falling_block_state: null,
  _falling_block_grid: null,
  _falling_block_x: null,
  _falling_block_y: null,

  _delay: null,
  _interval: null,

  begin: function(shape) {
    const tileset = k_tilesets[shape];
    this._main_view = new GridView(tileset, ui.grid);
    this._falling_block_view = new GridView(tileset, ui.falling_block);
    this._next_block_view = new GridView(tileset, ui.next_block);

    ui.level.textContent = this.level;
    ui.lines.textContent = this.lines;
    ui.score.textContent = this.score;
    this._main_view.resize(this.width, this.height);
    this._delay = 1000;
    for(let i = 1; i < this.starting_level; ++i) this._reduce_delay();
    this._update_grid_view(0, this.height);
    this._next_block = this._get_new_block();
    this.next_block();
    this._bound_timed_move_down = () => this.timed_move_down();
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
    ui.paused_msg.style.display = "block";
  },

  unpause: function() {
    if(!this.is_paused) return;
    this.is_paused = false;
    this._start_timer();
    ui.paused_msg.style.display = "none";
  },

  _start_timer: function() {
    this._interval = setInterval(this._bound_timed_move_down, this._delay);
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

  update_score_and_level: function(num_lines_removes, block_dropped) {
    if(num_lines_removes) {
      if(this.lines >= (this.levels_completed + 1) * 10) {
        this.levels_completed++;
        ui.level.textContent = ++this.level;
        this._reduce_delay();
      }
      ui.lines.textContent = this.lines += num_lines_removes;
      for(let i = 1; i <= num_lines_removes; i++) this.score += i * 20;
    }
    let score = this.level;
    if(block_dropped) score *= this.level / 4;
    this.score += Math.ceil(score);
    ui.score.textContent = this.score;
  },

  block_reached_bottom: function(block_dropped) {
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
    const num_lines_removes = this.remove_complete_lines(top, btm);
    if(num_lines_removes) top = 0; // everything's moved down
    this._update_grid_view(top, btm);
    this.update_score_and_level(num_lines_removes, block_dropped);
    if(this.next_block()) this._start_timer();
    else end_game();
  },

  next_block: function() {
    const block = this._falling_block_states = this._next_block;
    this._falling_block_state = 0;
    const grid = this._falling_block_grid = block[0];
    this._falling_block_x = Math.floor((this.width - grid[0].length) / 2);
    this._falling_block_y = 0;

    if(!this._falling_block_can_move_by(0, 0)) return false;
    this._next_block = this._get_new_block();
    this._redraw_falling_block();
    this._redraw_next_block();
    return true;
  },

  _remove_row: function(y) {
    let row = this.grid.splice(y, 1);
    for(let x = 0; x !== this.width; ++x) row[x] = 0;
    this.grid.unshift(row);
  },

  _line_is_full: function(y) {
    for(let val of this.grid[y]) if(!val) return false;
    return true;
  },

  // block[][] (y-x indexed) is a state of some block.  x and y are offsets into this grid
  can_add: function(block, x, y) {
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
    return this.can_add(this._falling_block_grid, this._falling_block_x + dx, this._falling_block_y + dy);
  },

  // note: block.length is the number of states this block has
  rotate_falling_block_clockwise: function() {
    let s = this._falling_block_state + 1;
    if(s === this._falling_block_states.length) s = 0;
    this._maybe_rotate_falling_block(s);
  },

  rotate_falling_block_anticlockwise: function() {
    let s = this._falling_block_state - 1;
    if(s === -1) s += this._falling_block_states.length;
    this._maybe_rotate_falling_block(s);
  },

  _maybe_rotate_falling_block: function(newstate) {
    const newgrid = this._falling_block_states[newstate];
    if(!this.can_add(newgrid, this._falling_block_x, this._falling_block_y)) return;
    this._falling_block_state = newstate;
    this._falling_block_grid = newgrid;
    this._redraw_falling_block();
  },

  drop_falling_block: function() {
    while(this._move_falling_block_down());
    this.block_reached_bottom(true);
  },

  timed_move_down: function() {
    if(!this.move_falling_block_down()) this.block_reached_bottom();
  },

  move_falling_block_down: function() {
    if(!this._move_falling_block_down()) return false;
    this._reposition_falling_block_view();
    return true;
  },

  _move_falling_block: function(dx, dy) {
    if(!this._falling_block_can_move_by(dx, dy)) return;
    this._falling_block_x += dx;
    this._falling_block_y += dy;
    this._reposition_falling_block_view();
  },

  _update_grid_view: function(top, bottom) {
    const first_tile_odd = top % 2;
    this._main_view.draw(this.grid.slice(top, bottom), first_tile_odd, { y: top, draw_empties: true });
  },

  _reposition_falling_block_view: function() {
    this._falling_block_view.position(this._falling_block_x, this._falling_block_y);
  },

  _redraw_falling_block: function() {
    const grid = this._falling_block_grid, x = this._falling_block_x, y = this._falling_block_y;
    this._falling_block_view.resize(grid[0].length, grid.length);
    this._falling_block_view.position(x, y);
    // note: conceptually this is ((x % 2) XOR (y % 2)), but since x can be negative (and thus lead to (-1 ^ 1) not giving the answer we want), it's easier to write it this way.
    const first_tile_odd = !!((x + y) % 2);
    this._falling_block_view.draw(grid, first_tile_odd, {});
  },

  _redraw_next_block: function() {
    const grid = this._next_block[0];
    this._next_block_view.resize(grid[0].length, grid.length);
    // This is the same calculation as when deciding the initial _falling_block_x
    const x = Math.floor((this.width - grid[0].length) / 2);
    const first_tile_odd = !!(x % 2);
    this._next_block_view.draw(grid, first_tile_odd, {});
  },
};


Games.sqr = {
  __proto__: Games.base,

  move_falling_block_left: function() { this._move_falling_block(-1, 0); },
  move_falling_block_right: function() { this._move_falling_block(1, 0); },

  // must return a boolean for the timed drop function
  _move_falling_block_down: function() {
    if(!this._falling_block_can_move_by(0, 1)) return false;
    this._falling_block_y += 1;
    return true;
  },

  remove_complete_lines: function(top, bottom) {
    let num = 0;
    for(let y = top; y != bottom; ++y) {
      if(!this._line_is_full(y)) continue;
      this._remove_row(y);
      ++num;
    }
    return num;
  },
};


Games.hex = {
  __proto__: Games.base,

  move_falling_block_left: function() { this._move_falling_block(-1, 1); },
  move_falling_block_right: function() { this._move_falling_block(1, 1); },

  _move_falling_block_down: function() {
    if(!this._falling_block_can_move_by(0, 2)) return false;
    this._falling_block_y += 2;
    return true;
  },

  remove_complete_lines: function(top, bottom) {
    let num = 0;
    if(bottom == this.height) --bottom;
    for(let y = top, odd = top % 2; y != bottom; ++y, odd = !odd) {
      // row of half-hexes is full <==> appropriate half-hexes in row above+below are full
      if(!this._line_is_full(y)) continue;
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

  move_falling_block_left: function() { this._move_falling_block(-1, 1); },
  move_falling_block_right: function() { this._move_falling_block(1, 1); },

  /*
  "Lines" start from the left at a tile pointing right, and then go either
  up or down for the next tile, and then proceed across and always form a
  solid block filling the two lines (which is why we just count in ones)
  */
  remove_complete_lines: function(top, bottom) {
    const h = this.height, w = this.width;
    if(bottom >= h - 2) bottom = h - 2;
    let num = 0;
    for(let y = bottom; y != top; --y) {
      if(!this._line_is_full(y) || !this._line_is_full(y+1)) continue;
      this._remove_row(y);
      this._remove_row(y + 1);
      ++num;
    }
    return num;
  },

  _move_falling_block_down: function() {
    // Don't allow tiles to drop through ones facing the other way
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
