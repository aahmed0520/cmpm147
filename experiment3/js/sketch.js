let seed = 0;
let tilesetImage;
let dungeonGrid = [];
let overworldGrid = [];
let numCols = 20;
let numRows = 20;

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function setup() {
  createCanvas(16 * numCols * 2 + 10, 16 * numRows).parent("canvasContainer");
  noSmooth();

  select("#reseedButton").mousePressed(reseed);

  reseed();
}

function reseed() {
  seed = (seed | 0) + 1109;
  randomSeed(seed);
  noiseSeed(seed);
  select("#seedReport").html("seed " + seed);

  dungeonGrid = generateDungeon(numCols, numRows);
  overworldGrid = generateOverworld(numCols, numRows);
}

function draw() {
  background(0);
  randomSeed(seed);

  // Draw dungeon on left
  drawDungeon(dungeonGrid, 0);

  // Draw overworld on right
  drawOverworld(overworldGrid, numCols * 16 + 10);
}

function placeTile(i, j, ti, tj, offsetX = 0) {
  image(tilesetImage, offsetX + 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

// DUNGEON GENERATOR
function generateDungeon(cols, rows) {
  let grid = Array.from({ length: rows }, () => Array(cols).fill("_"));
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
    let w = floor(random(4, 8));
    let h = floor(random(4, 8));
    let x = floor(random(-5, cols - w - 5));
    let y = floor(random(-5, rows - h - 5));
    let newRoom = { x, y, w, h };

    if (rooms.some(r => overlaps(r, newRoom))) continue;

    rooms.push({ ...newRoom, row: floor(y + h / 2), col: floor(x + w / 2) });

    for (let i = y - 1; i <= y + h; i++) {
      for (let j = x - 1; j <= x + w; j++) {
        if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
        grid[i][j] = ".";
      }
    }
  }

  for (let i = 1; i < rooms.length; i++) {
    let a = rooms[i - 1];
    let b = rooms[i];
    if (random() < 0.5) {
      drawHallway(grid, a.row, a.col, b.row, a.col);
      drawHallway(grid, b.row, a.col, b.row, b.col);
    } else {
      drawHallway(grid, a.row, a.col, a.row, b.col);
      drawHallway(grid, a.row, b.col, b.row, b.col);
    }
  }
  return grid;
}

function drawHallway(grid, r1, c1, r2, c2) {
  if (r1 === r2) {
    for (let j = min(c1, c2); j <= max(c1, c2); j++) grid[r1][j] = "+";
  } else if (c1 === c2) {
    for (let i = min(r1, r2); i <= max(r1, r2); i++) grid[i][c1] = "+";
  }
}

function drawDungeon(grid, offsetX) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];
      if (cell === ".") {
        placeTile(i, j, 1, 10, offsetX);
      } else if (cell === "+") {
        const anim = [ [2, 21], [3, 21], [4, 21] ];
        const [ti, tj] = anim[floor((frameCount + i + j) / 10) % anim.length];
        placeTile(i, j, ti, tj, offsetX);
      } else {
        placeTile(i, j, 1, 16, offsetX);
      }
    }
  }
}

// OVERWORLD GENERATOR
function generateOverworld(cols, rows) {
  let grid = Array.from({ length: rows }, () => Array(cols).fill("w"));
  let centers = [];
  for (let c = 0; c < 2; c++) {
    let cx = floor(random(cols * 0.2, cols * 0.8));
    let cy = floor(random(rows * 0.2, rows * 0.8));
    let biome = c % 2 === 0 ? "g" : "i";
    centers.push({ x: cx, y: cy, biome });
  }

  for (let { x, y, biome } of centers) {
    let radius = 7;
    for (let i = y - radius; i <= y + radius; i++) {
      for (let j = x - radius; j <= x + radius; j++) {
        if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
        let d = dist(j, i, x, y);
        if (d < radius) grid[i][j] = biome;
      }
    }
  }
  return grid;
}

function drawOverworld(grid, offsetX) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];
      if (cell === "g") placeTile(i, j, 0, 12, offsetX);
      else if (cell === "i") placeTile(i, j, 17, 9, offsetX);
      else {
        let water = [ [0, 14], [1, 14], [2, 14] ];
        let [ti, tj] = random(water);
        placeTile(i, j, ti, tj, offsetX);
      }
    }
  }
}
