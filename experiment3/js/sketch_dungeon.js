let seedD = 0;
let tilesetImageD;
let currentGridD = [];
let numColsD = 30;
let numRowsD = 30;

function preload() {
  tilesetImageD = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function setup() {
  createCanvas(16 * numColsD, 16 * numRowsD).parent("canvas-container");
  noSmooth();
  select("#reseedButtonD").mousePressed(reseed);
  reseed();
}

function reseed() {
  seedD = (seedD | 0) + 1109;
  randomSeed(seedD);
  noiseSeed(seedD);
  select("#seedReportD").html("seed " + seedD);
  currentGridD = generateGrid(numColsD, numRowsD);
}

function draw() {
  randomSeed(seedD);
  drawGrid(currentGridD);
}

function placeTile(i, j, ti, tj) {
  image(tilesetImageD, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function gridCheck(grid, i, j, target) {
  return (
    i >= 0 &&
    j >= 0 &&
    i < grid.length &&
    j < grid[0].length &&
    grid[i][j] === target
  );
}

function gridCode(grid, i, j, target) {
  let north = gridCheck(grid, i - 1, j, target) ? 1 : 0;
  let south = gridCheck(grid, i + 1, j, target) ? 2 : 0;
  let east = gridCheck(grid, i, j + 1, target) ? 4 : 0;
  let west = gridCheck(grid, i, j - 1, target) ? 8 : 0;
  return north + south + east + west;
}

const lookup = [
  [0, 0], [1, 0], [2, 0], [3, 0],
  [0, 1], [1, 1], [2, 1], [3, 1],
  [0, 2], [1, 2], [2, 2], [3, 2],
  [0, 3], [1, 3], [2, 3], [3, 3]
];

function drawContext(grid, i, j, target, dti, dtj) {
  let code = gridCode(grid, i, j, target);
  let tile = lookup[code];
  if (tile) {
    placeTile(i, j, dti + tile[0], dtj + tile[1]);
  }
}

function drawHallway(grid, r1, c1, r2, c2) {
  let numRows = grid.length;
  let numCols = grid[0].length;

  if (r1 === r2) {
    for (let j = min(c1, c2); j <= max(c1, c2); j++) {
      if (r1 >= 0 && r1 < numRows && j >= 0 && j < numCols) {
        if (grid[r1][j] === "_") grid[r1][j] = "+";
      }
    }
  } else if (c1 === c2) {
    for (let i = min(r1, r2); i <= max(r1, r2); i++) {
      if (i >= 0 && i < numRows && c1 >= 0 && c1 < numCols) {
        if (grid[i][c1] === "_") grid[i][c1] = "+";
      }
    }
  }
}

function generateGrid(numCols, numRows) {
  let grid = [];

  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("_");
    }
    grid.push(row);
  }

  let rooms = [];
  let maxRooms = 8;
  let attempts = 0;

  function overlaps(r1, r2) {
    return (
      r1.x <= r2.x + r2.w + 1 &&
      r1.x + r1.w + 1 >= r2.x &&
      r1.y <= r2.y + r2.h + 1 &&
      r1.y + r1.h + 1 >= r2.y
    );
  }

  while (rooms.length < maxRooms && attempts < 50) {
    attempts++;

    let width = floor(random(4, 8));
    let height = floor(random(4, 8));
    let x = floor(random(-5, numCols - width - 5));
    let y = floor(random(-5, numRows - height - 5));

    let newRoom = { x, y, w: width, h: height };

    let conflict = rooms.some(room => overlaps(room, newRoom));
    if (conflict) continue;

    let centerRow = floor(y + height / 2);
    let centerCol = floor(x + width / 2);
    rooms.push({ ...newRoom, row: centerRow, col: centerCol });

    for (let i = y - 1; i <= y + height; i++) {
      for (let j = x - 1; j <= x + width; j++) {
        if (i < 0 || i >= numRows || j < 0 || j >= numCols) continue;

        if (i === y - 1 && j === x - 1) grid[i][j] = "1";
        else if (i === y - 1 && j === x + width) grid[i][j] = "2";
        else if (i === y + height && j === x - 1) grid[i][j] = "3";
        else if (i === y + height && j === x + width) grid[i][j] = "4";
        else if (i === y - 1) grid[i][j] = "A";
        else if (i === y + height) grid[i][j] = "B";
        else if (j === x - 1) grid[i][j] = "L";
        else if (j === x + width) grid[i][j] = "R";
        else grid[i][j] = ".";
      }
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    let prev = rooms[i - 1];
    let curr = rooms[i];

    if (random() < 0.5) {
      drawHallway(grid, prev.row, prev.col, curr.row, prev.col);
      drawHallway(grid, curr.row, prev.col, curr.row, curr.col);
    } else {
      drawHallway(grid, prev.row, prev.col, prev.row, curr.col);
      drawHallway(grid, prev.row, curr.col, curr.row, curr.col);
    }
  }

  return grid;
}

function drawGrid(grid) {
  background(13);

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];

      if (cell === ".") {
        const floorOptions = [
          [1, 10],
          [2, 10],
          [3, 10]
        ];
        const [ti, tj] = random(floorOptions);
        placeTile(i, j, ti, tj);
      } else if (cell === "+") {
        const tileCycle = [
          [4, 21],
          [3, 21],
          [2, 21]
        ];
        const speed = 10;
        let index = floor((frameCount + i + j) / speed) % tileCycle.length;
        let [ti, tj] = tileCycle[index];
        placeTile(i, j, ti, tj);
      } else if (cell === "1") placeTile(i, j, 9, 15);
      else if (cell === "2") placeTile(i, j, 11, 15);
      else if (cell === "3") placeTile(i, j, 9, 17);
      else if (cell === "4") placeTile(i, j, 11, 17);
      else if (cell === "A") placeTile(i, j, 10, 15);
      else if (cell === "B") placeTile(i, j, 10, 17);
      else if (cell === "L") placeTile(i, j, 9, 16);
      else if (cell === "R") placeTile(i, j, 11, 16);
      else if (cell === "W") placeTile(i, j, 2, 16);
      else {
        const bgOptions = [
          [1, 16],
          [2, 16],
          [3, 16]
        ];
        const [ti, tj] = random(bgOptions);
        placeTile(i, j, ti, tj);
      }
    }
  }
}
