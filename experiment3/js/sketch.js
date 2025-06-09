let seed = 0;
let tilesetImage;
let dungeonGrid = [];
let overworldGrid = [];
let numCols = 30;
let numRows = 30;
let clouds = [];

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

  drawDungeon(dungeonGrid, 0);
  drawOverworld(overworldGrid, numCols * 16 + 10);
}

function placeTile(i, j, ti, tj, offsetX = 0) {
  image(tilesetImage, offsetX + 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

// Utility Functions
function gridCheck(grid, i, j, target) {
  return (
    i >= 0 && j >= 0 && i < grid.length && j < grid[0].length && grid[i][j] === target
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

function drawContext(grid, i, j, target, dti, dtj, offsetX) {
  let code = gridCode(grid, i, j, target);
  let tile = lookup[code];
  if (tile) {
    placeTile(i, j, dti + tile[0], dtj + tile[1], offsetX);
  }
}

// Dungeon
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
    let x = floor(random(1, cols - w - 1));
    let y = floor(random(1, rows - h - 1));
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
    for (let j = min(c1, c2); j <= max(c1, c2); j++) {
      if (grid[r1] && grid[r1][j] !== undefined) grid[r1][j] = "+";
    }
  } else if (c1 === c2) {
    for (let i = min(r1, r2); i <= max(r1, r2); i++) {
      if (grid[i] && grid[i][c1] !== undefined) grid[i][c1] = "+";
    }
  }
}

function drawDungeon(grid, offsetX) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      let cell = grid[i][j];
      if (cell === ".") {
        const options = [ [1, 10], [2, 10], [3, 10] ];
        let [ti, tj] = random(options);
        placeTile(i, j, ti, tj, offsetX);
      } else if (cell === "+") {
        const anim = [ [4, 21], [3, 21], [2, 21] ];
        let [ti, tj] = anim[floor((frameCount + i + j) / 10) % anim.length];
        placeTile(i, j, ti, tj, offsetX);
      } else {
        const bg = [ [1, 16], [2, 16], [3, 16] ];
        let [ti, tj] = random(bg);
        placeTile(i, j, ti, tj, offsetX);
      }
    }
  }
}

// Overworld
function generateOverworld(cols, rows) {
  let grid = Array.from({ length: rows }, () => Array(cols).fill("w"));
  let centers = [];
  for (let c = 0; c < 3; c++) {
    let tries = 0;
    let cx, cy;
    let minDist = 20;
    do {
      cx = floor(random(cols * 0.2, cols * 0.8));
      cy = floor(random(rows * 0.2, rows * 0.8));
      tries++;
    } while (
      centers.some(other => dist(cx, cy, other.x, other.y) < minDist) && tries < 50
    );
    let biome = (c % 2 === 0) ? "g" : "i";
    centers.push({ x: cx, y: cy, biome });
  }

  for (let center of centers) {
    let { x, y, biome } = center;
    let maxRadius = 15 + floor(random(5, 10));
    for (let i = y - maxRadius; i <= y + maxRadius; i++) {
      for (let j = x - maxRadius; j <= x + maxRadius; j++) {
        if (i < 0 || i >= rows || j < 0 || j >= cols) continue;
        if (grid[i][j] !== "w") continue;
        let d = dist(j, i, x, y);
        if (d > maxRadius) continue;
        let n = noise(i * 0.1, j * 0.1);
        let falloff = 1 - d / maxRadius;
        let value = n * falloff;
        if (value > 0.25) {
          const neighbors = [
            grid[i - 1]?.[j],
            grid[i + 1]?.[j],
            grid[i]?.[j - 1],
            grid[i]?.[j + 1]
          ];
          const adjacentBiome = neighbors.some(n => n && n !== "w" && n !== biome);
          if (!adjacentBiome) {
            grid[i][j] = biome;
          }
        }
      }
    }
  }

  clouds = [];
  for (let c = 0; c < 5; c++) {
    clouds.push({ x: random(-100, 800), y: random(0, 16 * rows), speed: random(0.1, 0.3) });
  }

  return grid;
}

function drawOverworld(grid, offsetX) {
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      if (cell === "g") {
        let top = !gridCheck(grid, i - 1, j, "g");
        let bottom = !gridCheck(grid, i + 1, j, "g");
        let left = !gridCheck(grid, i, j - 1, "g");
        let right = !gridCheck(grid, i, j + 1, "g");
        let topleft = top && left;
        let topright = top && right;
        let bottomleft = bottom && left;
        let bottomright = bottom && right;
        if (topleft) placeTile(i, j, 6, 14, offsetX);
        else if (topright) placeTile(i, j, 4, 14, offsetX);
        else if (bottomleft) placeTile(i, j, 6, 12, offsetX);
        else if (bottomright) placeTile(i, j, 4, 12, offsetX);
        else if (top) placeTile(i, j, 5, 14, offsetX);
        else if (bottom) placeTile(i, j, 5, 12, offsetX);
        else if (left) placeTile(i, j, 6, 13, offsetX);
        else if (right) placeTile(i, j, 4, 13, offsetX);
        else {
          placeTile(i, j, 0, 12, offsetX);
          if (random() < 0.1) placeTile(i, j, 14, 12, offsetX);
        }
      } else if (cell === "i") {
        let top = !gridCheck(grid, i - 1, j, "i");
        let bottom = !gridCheck(grid, i + 1, j, "i");
        let left = !gridCheck(grid, i, j - 1, "i");
        let right = !gridCheck(grid, i, j + 1, "i");
        let topleft = top && left;
        let topright = top && right;
        let bottomleft = bottom && left;
        let bottomright = bottom && right;
        if (topleft) placeTile(i, j, 23, 14, offsetX);
        else if (topright) placeTile(i, j, 21, 14, offsetX);
        else if (bottomleft) placeTile(i, j, 23, 12, offsetX);
        else if (bottomright) placeTile(i, j, 21, 12, offsetX);
        else if (top) placeTile(i, j, 22, 14, offsetX);
        else if (bottom) placeTile(i, j, 22, 12, offsetX);
        else if (left) placeTile(i, j, 23, 13, offsetX);
        else if (right) placeTile(i, j, 21, 13, offsetX);
        else drawContext(grid, i, j, "i", 17, 9, offsetX);
      } else {
        let water = [ [0, 14], [1, 14], [2, 14] ];
        let tile = (random() < 0.7) ? water[0] : random([water[1], water[2]]);
        placeTile(i, j, tile[0], tile[1], offsetX);
      }
    }
  }

  noStroke();
  fill(100, 100, 100, 80);
  for (let c of clouds) {
    ellipse(c.x, c.y, 80, 40);
    ellipse(c.x + 25, c.y - 10, 60, 30);
    ellipse(c.x - 25, c.y - 5, 60, 35);
    c.x += c.speed;
    if (c.x > width + 100) c.x = -120;
  }
}
