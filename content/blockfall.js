const CLOCKWISE = 1, ANTICLOCKWISE = 2;

// global vars. (some declared in BlockFall-ui.js as well
var BlockFall, Blocks;


// ##############################################
// BlockFall constructor
// ##############################################
function BlockFallGame(width, height, startingLevel, showNextBlock) {
  // parameters
  this.width = width;
  this.height = height;
  this.level = startingLevel; // game level, affects length of interval for this.timer
  this.levelsCompleted = 0; // used in working out when to increase the level
  this.lines = 0;
  this.score = 0;
  this.paused = false; // checked whenever user does anything
  this.showNextBlock = showNextBlock; // sets whether a display of the next block should be shown
  // arrays
  this.board = createArray(width, height, 0);
  this.fallingBlock = createArray(width, height, 0);
  // ref to interval that makes block drop
  this.timer;
  // calculate starting timeInterval
  var timeInterval = 1000;
  for(var i = 1; i < startingLevel; i++) {
    timeInterval = parseInt(timeInterval * 0.8);
  }
  this.timeInterval = timeInterval; // millisecs, reduced by one 5th each level
  // updated whenever a block is added
  this.nextBlock;
  // used to track position of falling block within the falling block array
  this.fallingBlockLeft;
  this.fallingBlockRight;
  this.fallingBlockTop;
  this.fallingBlockBottom;
  // edges of a square box round the current piece that is used in rotations
  this.rotationBoxLeft;
  this.rotationBoxRight;
  this.rotationBoxTop;
  this.rotationBoxBottom;
}
// creates a 2d array indexed by y then x, with all elements initially 0
function createArray(width, height, initialElementValue) {
  var anArray = new Array(height);
  for(var y = 0; y < height; y++) {
    anArray[y] = new Array(width);
    for(var x = 0; x < width; x++) {
      anArray[y][x] = initialElementValue;
    }
  }
  return anArray;
}



// ##############################################
// Main
// ##############################################
window.onload = function() {
  Blocks = getStandardBlocks();
  createNextBlockDisplay();
  newGame();
}


function newGame(width, height, level) {
  var newWidth = width || ((BlockFall&&BlockFall.width) ? BlockFall.width : 10);
  var newHeight = height || ((BlockFall&&BlockFall.height) ? BlockFall.height : 25);
  var newLevel = level || ((BlockFall&&BlockFall.level) ? BlockFall.level - BlockFall.levelsCompleted : 0);
  startGame(newWidth, newHeight, newLevel, true);
}
function startGame(width, height, startingLevel, showNextBlock) {
  endGame();
  // create and display the new game
  BlockFall = new BlockFallGame(width,height,startingLevel,showNextBlock);
  displayBoard(width,height);
  updateDisplay(BlockFall.score, BlockFall.lines, BlockFall.level);
  // add key listener
  document.onkeydown = keyPressed; //defined in playeractions.js
  // add a block to top of grid
  setNextBlock();
  addBlock();
  setNextBlock();
}
function endGame() {
  if(BlockFall&&BlockFall.timer)
    clearInterval(BlockFall.timer);
  document.onkeydown = null;
}

// called from menus, call newGame but change the parameters
function setLevel(level) {
  newGame(null, null, level);
}
function setSize(width, height) {
  newGame(width, height, null);
}


// ##############################################
// Timed actions
// ##############################################

function timedShiftFallingBlockDown() {
  if(canMoveDown()) {
    shiftDown();
  } else {
    clearInterval(BlockFall.timer);
    transferFallingBlockToBoard();
    removeCompleteLines();
    increaseLevelIfEnoughLinesCompleted();
    updateDisplay(BlockFall.score, BlockFall.lines, BlockFall.level);
    addBlock();
    setNextBlock();
  }
}


// removes the actual block from the fallingBlock array and writes it into the board array
function transferFallingBlockToBoard() {
  for(var y = BlockFall.fallingBlockTop; y < BlockFall.fallingBlockBottom; y++) {
    for(var x = BlockFall.fallingBlockLeft; x < BlockFall.fallingBlockRight; x++) {
      if(BlockFall.fallingBlock[y][x]!=0) {
        BlockFall.board[y][x] = BlockFall.fallingBlock[y][x];
        BlockFall.fallingBlock[y][x] = 0;
      }
    }
  }
}


// === removing completed lines =================
function checkIfLineComplete(y) {
  // if any element on line is empty return false
  for(var x = 0; x < BlockFall.width; x++)
    if(BlockFall.board[y][x]==0)
      return false;
  return true;
}
// creates an array of 0's to use as a line in the board array
function createEmptyLine() {
  var emptyLine = new Array(BlockFall.width);
  for(var x = 0; x < BlockFall.width; x++)
    emptyLine[x] = 0;
  return emptyLine;
}
// removes any empty lines between bottom of board and fallingBlockTopEdge (which is left intact until new block added for this purpose)
function removeCompleteLines() {
  // work out which lines need removing
  var linesToRemove = new Array();
  for(var y = BlockFall.fallingBlockTop; y < BlockFall.height; y++)
    if(checkIfLineComplete(y))
      linesToRemove.push(y);
  // remove them
  for(var i = 0; i < linesToRemove.length; i++) {
    // remove line and insert a blank one at top of array
    BlockFall.board.splice(linesToRemove[i],1);
    BlockFall.board.unshift(createEmptyLine());
    // update score and lines
    BlockFall.lines++;
    BlockFall.score += (i+1)*20; // so get 20 pt for a line, 60 for 2 lines, 120 for 3 lines, 200 for 4 lines;
  }
  // add points for this block (equal to level number, or half if next block visible) and update score display
  if(BlockFall.showNextBlock)
    BlockFall.score += parseInt(BlockFall.level / 2);
  else
    BlockFall.score += BlockFall.level;
}

// === going up a level =========================
function increaseLevelIfEnoughLinesCompleted() {
  if((BlockFall.lines-(BlockFall.levelsCompleted*10))>=10) {
    // update level
    BlockFall.levelsCompleted++;
    BlockFall.level++;
    // adjust speed at which block falls
    BlockFall.timeInterval = parseInt(BlockFall.timeInterval * 0.8);
  }
}

// === add next block ===========================
function addBlock() {
  // get the block
  var block = BlockFall.nextBlock;
  var blockHeight = block.length;
  var blockWidth = block[0].length
  // determine left edge where block will be placed from
  var blockLeft = parseInt((BlockFall.width-blockWidth)/2);
  var blockRight = blockLeft + blockWidth;
  // see if the block can be copied
  for(var y = 0; y < blockHeight; y++) {
    for(var x = 0; x < blockWidth; x++) {
      if((BlockFall.board[y][x+blockLeft]!=0)&&(block[y][x]!=0)) {
        // disable keys then don't add a block (effectively ending the game)
        endGame();
        return false;
      }
    }
  }
  // copy block into fallingBlock array
  for(var y = 0; y < blockHeight; y++)
    for(var x = 0; x < blockWidth; x++)
      BlockFall.fallingBlock[y][x+blockLeft] = block[y][x];
  // set edged of falling block
  BlockFall.fallingBlockLeft = blockLeft;
  BlockFall.fallingBlockRight = blockRight;
  BlockFall.fallingBlockTop = 0;
  BlockFall.fallingBlockBottom = blockHeight;
  // set edges of rotation box
  BlockFall.rotationBoxLeft = blockLeft;
  BlockFall.rotationBoxRight = blockRight;
  BlockFall.rotationBoxTop = (block.boxTop) ? (block.boxTop) : 0;
  BlockFall.rotationBoxBottom = (block.boxBottom) ? (blockHeight + block.boxBottom) : blockHeight;
  // update the display so block is visible
  BlockFall.timer = setInterval(timedShiftFallingBlockDown, BlockFall.timeInterval);
  updateDisplayInArea(0, blockLeft, blockHeight, blockRight);
}
function setNextBlock() {
  var blockNumber = parseInt(Math.random() * Blocks.length);
  if(blockNumber == Blocks.length) { blockNum--; }
  BlockFall.nextBlock = Blocks[blockNumber];
  if(BlockFall.showNextBlock)
    updateNextBlockDisplay(BlockFall.nextBlock);
}





// ##############################################
// Actions - shifting block
// ##############################################

// === checking if block can be shifted =========
function canMoveLeft() {
  if(BlockFall.fallingBlockLeft == 0)
    return false;
  // for all elements of falling block check if there is a space to the left, and if it is empty
  for(var y = BlockFall.fallingBlockTop; y < BlockFall.fallingBlockBottom; y++)
    for(var x = BlockFall.fallingBlockLeft; x < BlockFall.fallingBlockRight; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(BlockFall.board[y][x-1]!=0))
        return false;
  return true;
}
function canMoveRight() {
  if(BlockFall.fallingBlockRight == BlockFall.width)
    return false;
  // for all elements of falling block check if there is space to the right
  for(var y = BlockFall.fallingBlockTop; y < BlockFall.fallingBlockBottom; y++)
    for(var x = BlockFall.fallingBlockLeft; x < BlockFall.fallingBlockRight; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(BlockFall.board[y][x+1]!=0))
        return false;
  return true;
}
function canMoveDown() {
  if(BlockFall.fallingBlockBottom == BlockFall.height)
    return false;
  // for all elements of falling block check if there is space below
  for(var y = BlockFall.fallingBlockTop; y < BlockFall.fallingBlockBottom; y++)
    for(var x = BlockFall.fallingBlockLeft; x < BlockFall.fallingBlockRight; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(BlockFall.board[y+1][x]!=0))
        return false;
  return true;
}


// === shifting block ===========================
function moveLeft() {
  if(!BlockFall.paused&&canMoveLeft()) {
    for(var y = 0; y < BlockFall.height; y++) {
      // remove first item from each row and insert at end of row
      BlockFall.fallingBlock[y].push(BlockFall.fallingBlock[y].shift());
    }
    // update block and box edges
    BlockFall.fallingBlockLeft--;
    BlockFall.fallingBlockRight--;
    BlockFall.rotationBoxLeft--;
    BlockFall.rotationBoxRight--;
    //
    updateDisplayInArea(BlockFall.fallingBlockTop,BlockFall.fallingBlockLeft,BlockFall.fallingBlockBottom,BlockFall.fallingBlockRight+1);
  }
}
function moveRight() {
  if(!BlockFall.paused&&canMoveRight()) {
    for(var y = 0; y < BlockFall.height; y++) {
      // remove last item from each row and insert at start of row
      BlockFall.fallingBlock[y].unshift(BlockFall.fallingBlock[y].pop());
    }
    // update block and box edges
    BlockFall.fallingBlockLeft++;
    BlockFall.fallingBlockRight++;
    BlockFall.rotationBoxLeft++;
    BlockFall.rotationBoxRight++;
    //
    updateDisplayInArea(BlockFall.fallingBlockTop,BlockFall.fallingBlockLeft-1,BlockFall.fallingBlockBottom,BlockFall.fallingBlockRight);
  }
}
function moveDown() {
  if(!BlockFall.paused&&canMoveDown()) {
    shiftDown();
  }
}
function shiftDown() {
  BlockFall.fallingBlock.unshift(BlockFall.fallingBlock.pop());
  // update block and box edges
  BlockFall.fallingBlockTop++;
  BlockFall.fallingBlockBottom++;
  BlockFall.rotationBoxTop++;
  BlockFall.rotationBoxBottom++;
  //
  updateDisplayInArea(BlockFall.fallingBlockTop-1,BlockFall.fallingBlockLeft,BlockFall.fallingBlockBottom,BlockFall.fallingBlockRight);
}


// ##############################################
// Actions - rotation
// ##############################################
function rotateClockwise() {
  rotate(CLOCKWISE);
}
function rotateAnticlockwise() {
  rotate(ANTICLOCKWISE);
}

function rotate(direction) {
  if(BlockFall.paused)
    return;
  // if rotationBox overhangs side of board then cannot rotate
  // cannot rotate as is, if near edge of board may be possible to move box if p
  if((BlockFall.rotationBoxLeft<0)||(BlockFall.rotationBoxTop<0)||(BlockFall.rotationBoxRight>BlockFall.width)||(BlockFall.rotationBoxBottom>BlockFall.height))
    return false;
  // create a small array to rotate without worrying about offsets
  var boxDimension = BlockFall.rotationBoxRight - BlockFall.rotationBoxLeft;
  // create the rotated piece (y->x indexed)
  var rotation = createRotation(direction, boxDimension);
  // see if rotation conflicts with board (could integrate into previous loops but would confuse the code)
  for(var y = 0; y < boxDimension; y++)
    for(var x = 0; x < boxDimension; x++)
      if((rotation[y][x]!=0)&&(BlockFall.board[y+BlockFall.rotationBoxTop][x+BlockFall.rotationBoxLeft]!=0))
        return false; // can't rotate, give up
  // can rotate, so copy rotation completely into corresponding location in fallingBlock (incl 0's to wipe original)
  for(var y = 0; y < boxDimension; y++)
    for(var x = 0; x < boxDimension; x++)
      BlockFall.fallingBlock[y+BlockFall.rotationBoxTop][x+BlockFall.rotationBoxLeft] = rotation[y][x];
  // update edge points
  BlockFall.fallingBlockLeft = getNewFallingBlockLeft();
  BlockFall.fallingBlockRight = getNewFallingBlockRight();
  BlockFall.fallingBlockTop = getNewFallingBlockTop();
  BlockFall.fallingBlockBottom = getNewFallingBlockBottom();
  // update the display round here
  updateDisplayInArea(BlockFall.rotationBoxTop,BlockFall.rotationBoxLeft,BlockFall.rotationBoxBottom,BlockFall.rotationBoxRight);
}

function createRotation(direction, dimension) {
  var rotation = new Array(dimension); //height
  if(direction==CLOCKWISE){
    for(var y = 0; y < dimension; y++) {
      rotation[y] = new Array(dimension); //width
      for(var x = 0; x < dimension; x++) {
        // y'=x x'=width-1-y, where x' means index on rotation, x the original
        // y'=(x+boxLeft) x'=width-1-(y+boxTop) incl offset of original in fallingBlockArray
        rotation[y][x] = BlockFall.fallingBlock[(dimension-1-x) + BlockFall.rotationBoxTop][y + BlockFall.rotationBoxLeft];
      }
    }
  } else {
    for(var y = 0; y < dimension; y++) {
      rotation[y] = new Array(dimension); //width
      for(var x = 0; x < dimension; x++) {
        rotation[y][x] = BlockFall.fallingBlock[x + BlockFall.rotationBoxTop][(dimension-1-y) + BlockFall.rotationBoxLeft]; // anticlockwise
      }
    }
  }
  return rotation;
}

// gets the new left edge of the fallingBox
function getNewFallingBlockLeft() {
  var newLeft = Number.POSITIVE_INFINITY; // make sure it's too big
  // block will still be in rotation box
  var top = BlockFall.rotationBoxTop;
  var bottom = BlockFall.rotationBoxBottom;
  var left = BlockFall.rotationBoxLeft;
  var right = BlockFall.rotationBoxRight;
  for(var y = top; y < bottom; y++)
    for(var x = left; x < right; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(x<newLeft))
        newLeft = x;
  return newLeft;
}

// gets the new right edge of the fallingBox
function getNewFallingBlockRight() {
  var newRight = 0; // make sure it's too big
  // block will still be in rotation box
  var top = BlockFall.rotationBoxTop;
  var bottom = BlockFall.rotationBoxBottom;
  var left = BlockFall.rotationBoxLeft;
  var right = BlockFall.rotationBoxRight;
  for(var y = top; y < bottom; y++)
    for(var x = left; x < right; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(x>newRight))
        newRight = x;
  return (newRight+1); // would otherwise return the inside right edge, we want outside right edge
}

// gets the new top edge of the fallingBox
function getNewFallingBlockTop() {
  var newTop = Number.POSITIVE_INFINITY; // make sure it's too big
  // block will still be in rotation box
  var top = BlockFall.rotationBoxTop;
  var bottom = BlockFall.rotationBoxBottom;
  var left = BlockFall.rotationBoxLeft;
  var right = BlockFall.rotationBoxRight;
  for(var y = top; y < bottom; y++)
    for(var x = left; x < right; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(y<newTop))
        newTop = y;
  return newTop;
}

// gets the new right edge of the fallingBox
function getNewFallingBlockBottom() {
  var newBottom = 0; // make sure it's too small
  // block will still be in rotation box
  var top = BlockFall.rotationBoxTop;
  var bottom = BlockFall.rotationBoxBottom;
  var left = BlockFall.rotationBoxLeft;
  var right = BlockFall.rotationBoxRight;
  for(var y = top; y < bottom; y++)
    for(var x = left; x < right; x++)
      if((BlockFall.fallingBlock[y][x]!=0)&&(y>newBottom))
        newBottom = y;
  return (newBottom+1);
}


// ##############################################
// Actions - Pause
// ##############################################
function pausePressed() {
  if(BlockFall.paused) {
    BlockFall.timer = setInterval(timedShiftFallingBlockDown, BlockFall.timeInterval);
    BlockFall.paused = false;
  } else {
    clearInterval(BlockFall.timer);
    BlockFall.paused = true;
  }
}


// ##############################################
// Actions - show/hide next nlock
// ##############################################
function toggleNextBlockDisplay() {
  if(BlockFall.showNextBlock) {
    clearNextBlockDisplay();
    BlockFall.showNextBlock = false;
  } else {
    updateNextBlockDisplay();
    BlockFall.showNextBlock = true;
  }
}





// ------------  what was blockfall-display.js ? --------------------------



// 2d array of <image> objects, referenced (y,x)
var Display, NextBlockDisplay;


// creates and returns a 2d array of <image>s, adds them to a <grid> and appends that
// to an element with an id of the 3rd argument to the function
function createImageArray(width, height, boxToAppendTo) {
  var box = document.getElementById(boxToAppendTo);
  // create a grid and add the colums
  var vbox = document.createElement("vbox");
  // create the rows of images, adding each image to NextBlockDisplay[y][x];
  var imageArray = new Array(height);
  // add <row>s to rows, and 2nd dimension to array
  for(var y = 0; y < height; y++) {
    var row = document.createElement("hbox");
    imageArray[y] = new Array(width);
    // add images to row and to array
    for(var x = 0; x < width; x++) {
      imageArray[y][x] = document.createElement("image");
      imageArray[y][x].className = "block-0";
      row.appendChild(imageArray[y][x]);
    }
    vbox.appendChild(row);
  }
  // add rows and columns to grid, append grid to box, and return imageArray
  box.appendChild(vbox);
  return imageArray;
}


// ##############################################
// Next Block Display
// ##############################################

function createNextBlockDisplay() {
  // remove if it already exists, then create
  var el = document.getElementById("next-block-display");
  if(el.hasChildNodes()) {
    el.removeChild(el.firstChild);
  }
  NextBlockDisplay = null;
  NextBlockDisplay = createImageArray(4,2,"next-block-display");
}
function updateNextBlockDisplay(block) {
  for(var y = 0; y < NextBlockDisplay.length; y++) {
    for(var x = 0; x < NextBlockDisplay[0].length; x++) {
      var num = ((y<block.length)&&(x<block[0].length)) ? block[y][x] : 0;
      NextBlockDisplay[y][x].className = "block-"+num;
    }
  }
}
// called when a new game is started for when this is not to be shown any more, but was shown previously
function clearNextBlockDisplay() {
  for(var y = 0; y < NextBlockDisplay.length; y++)
    for(var x = 0; x < NextBlockDisplay[0].length; x++)
      NextBlockDisplay[y][x].className = "block-clear";
}



// ##############################################
// Board Display
// ##############################################
function displayBoard(width, height) {
  var board = document.getElementById("playing-field");
  // remove old board
  if(board.hasChildNodes()) {
    board.removeChild(board.firstChild);
  }
  // create new board
  Display = createImageArray(width, height, "playing-field");
  window.sizeToContent();
}

// updates the whole display, called after removing complete lines
function updateDisplay(score, lines, level) {
  for(var y = 0; y < BlockFall.height; y++) {
    for(var x = 0; x < BlockFall.width; x++) {
      if(BlockFall.fallingBlock[y][x] != 0) {
        Display[y][x].className = "block-" + BlockFall.fallingBlock[y][x];
      } else {
        Display[y][x].className = "block-" + BlockFall.board[y][x];
      }
    }
  }
  // update Score, Lines and Level display
  document.getElementById("score-display").value = score;
  document.getElementById("lines-display").value = lines;
  document.getElementById("level-display").value = level;
}

// saves time as only a small area is updated, used when block moved, rotated or added
function updateDisplayInArea(top, left, bottom, right) {
  for(var y = top; y < bottom; y++) {
    for(var x = left; x < right; x++) {
      if(BlockFall.fallingBlock[y][x] != 0) {
        Display[y][x].className = "block-" + BlockFall.fallingBlock[y][x];
      } else {
        Display[y][x].className = "block-" + BlockFall.board[y][x];
      }
    }
  }
}



// ##############################################
// Key Handlers
// ##############################################


// === key pressed ==============================
function keyPressed(eventObj) {
  var key = eventObj.keyCode;
  if(key == 40) // down
    moveDown();
  else if(key == 37) // left
    moveLeft();
  else if(key == 39) // right
    moveRight();
  else if((key == 38)||(key == 75)) // up or k
    rotateClockwise();
  else if(key == 74) // j
    rotateAnticlockwise();
  else if((key == 80)||(key == 19)) //p or pause
    pausePressed();
}
