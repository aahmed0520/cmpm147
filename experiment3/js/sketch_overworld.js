var seedO = 0;
var tilesetImageO;
var currentGridO = [];
var numColsO = 30;
var numRowsO = 30;
var cloudsO = [];

function preloadO() {
  tilesetImageO = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function setupO() {
  let canvasO = createCanvas(16 * numColsO, 16 * numRowsO);
  canvasO.parent("canvas-container");
  noSmooth();
  select("#reseedButton").mousePressed(reseedO);
  reseedO();
}

function reseedO() {
  seedO = (seedO | 0) + 1109;
  randomSeed(seedO);
  noiseSeed(seedO);
  select("#seedReport").html("seed " + seedO);
  currentGridO = generateGridO(numColsO, numRowsO);
}

function drawO() {
  randomSeed(seedO);
  drawGridO(currentGridO);
}

function placeTileO(i, j, ti, tj) {
  image(tilesetImageO, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}

function gridCheckO(grid, i, j, target) {
  return (
    i >= 0 &&
    j >= 0 &&
    i < grid.length &&
    j < grid[0].length &&
    grid[i][j] === target
  );
}

function gridCodeO(grid, i, j, target) {
  let north = gridCheckO(grid, i - 1, j, target) ? 1 : 0;
  let south = gridCheckO(grid, i + 1, j, target) ? 2 : 0;
  let east = gridCheckO(grid, i, j + 1, target) ? 4 : 0;
  let west = gridCheckO(grid, i, j - 1, target) ? 8 : 0;
  return north + south + east + west;
}

const lookupOverworld = [
  [0, 0], [1, 0], [2, 0], [3, 0],
  [0, 1], [1, 1], [2, 1], [3, 1],
  [0, 2], [1, 2], [2, 2], [3, 2],
  [0, 3], [1, 3], [2, 3], [3, 3]
];

function drawContextO(grid, i, j, target, dti, dtj) {
  let code = gridCodeO(grid, i, j, target);
  let tile = lookupOverworld[code];
  if (tile) {
    placeTileO(i, j, dti + tile[0], dtj + tile[1]);
  }
}

function generateGridO(numCols, numRows) {
  let grid = [];

  for (let i = 0; i < numRows; i++) {
    let row = [];
    for (let j = 0; j < numCols; j++) {
      row.push("w");
    }
    grid.push(row);
  }

  const numContinents = 3;
  let centers = [];

  for (let c = 0; c < numContinents; c++) {
    let tries = 0;
    let cx, cy;
    let minDist = 20;

    do {
      cx = floor(random(numCols * 0.2, numCols * 0.8));
      cy = floor(random(numRows * 0.2, numRows * 0.8));
      tries++;
    } while (
      centers.some(other => dist(cx, cy, other.x, other.y) < minDist) &&
      tries < 50
    );

    let biome = (c % 2 === 0) ? "g" : "i";
    centers.push({ x: cx, y: cy, biome });
  }

  for (let center of centers) {
    let { x, y, biome } = center;
    let maxRadius = 15 + floor(random(5, 10));

    for (let i = y - maxRadius; i <= y + maxRadius; i++) {
      for (let j = x - maxRadius; j <= x + maxRadius; j++) {
        if (
          i < 0 || i >= numRows ||
          j < 0 || j >= numCols
        ) continue;

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

  cloudsO = [];
  for (let c = 0; c < 5; c++) {
    cloudsO.push({
      x: random(-100, 800),
      y: random(0, height),
      speed: random(0.1, 0.3)
    });
  }

  return grid;
}

function drawGridO(grid) {
  background('#1f2d75');

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];

      if (cell === "g") {
        let top = !gridCheckO(grid, i - 1, j, "g");
        let bottom = !gridCheckO(grid, i + 1, j, "g");
        let left = !gridCheckO(grid, i, j - 1, "g");
        let right = !gridCheckO(grid, i, j + 1, "g");

        let topleft = top && left;
        let topright = top && right;
        let bottomleft = bottom && left;
        let bottomright = bottom && right;

        if (topleft) placeTileO(i, j, 6, 14);
        else if (topright) placeTileO(i, j, 4, 14);
        else if (bottomleft) placeTileO(i, j, 6, 12);
        else if (bottomright) placeTileO(i, j, 4, 12);
        else if (top) placeTileO(i, j, 5, 14);
        else if (bottom) placeTileO(i, j, 5, 12);
        else if (left) placeTileO(i, j, 6, 13);
        else if (right) placeTileO(i, j, 4, 13);
        else {
          placeTileO(i, j, 0, 12);
          if (random() < 0.1) placeTileO(i, j, 14, 12);
        }
      } else if (cell === "i") {
        let top = !gridCheckO(grid, i - 1, j, "i");
        let bottom = !gridCheckO(grid, i + 1, j, "i");
        let left = !gridCheckO(grid, i, j - 1, "i");
        let right = !gridCheckO(grid, i, j + 1, "i");

        let topleft = top && left;
        let topright = top && right;
        let bottomleft = bottom && left;
        let bottomright = bottom && right;

        if (topleft) placeTileO(i, j, 23, 14);
        else if (topright) placeTileO(i, j, 21, 14);
        else if (bottomleft) placeTileO(i, j, 23, 12);
        else if (bottomright) placeTileO(i, j, 21, 12);
        else if (top) placeTileO(i, j, 22, 14);
        else if (bottom) placeTileO(i, j, 22, 12);
        else if (left) placeTileO(i, j, 23, 13);
        else if (right) placeTileO(i, j, 21, 13);
        else drawContextO(grid, i, j, "i", 17, 9);
      } else {
        let waterOptions = [
          [0, 14],
          [1, 14],
          [2, 14]
        ];
        let choice = random();
        let tile = (choice < 0.7) ? waterOptions[0] : random([waterOptions[1], waterOptions[2]]);
        placeTileO(i, j, tile[0], tile[1]);
      }
    }
  }

  noStroke();
  fill(100, 100, 100, 80);
  for (let c of cloudsO) {
    ellipse(c.x, c.y, 80, 40);
    ellipse(c.x + 25, c.y - 10, 60, 30);
    ellipse(c.x - 25, c.y - 5, 60, 35);
    c.x += c.speed;
    if (c.x > width + 100) c.x = -120;
  }
}
