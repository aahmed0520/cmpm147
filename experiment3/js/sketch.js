// sketch.js - Combined Dungeon and Overworld Viewer with Buttons

let tilesetImage;
let currentGrid = [];
let viewMode = "overworld";
let clouds = [];
let seed = 0;
let numCols = 30;
let numRows = 20;
let canvasContainer;

function preload() {
  tilesetImage = loadImage(
    "https://cdn.glitch.com/25101045-29e2-407a-894c-e0243cd8c7c6%2FtilesetP8.png?v=1611654020438"
  );
}

function setup() {
  canvasContainer = select("#canvasContainer");

  const canvas = createCanvas(16 * numCols, 16 * numRows);
  canvas.parent(canvasContainer);
  noSmooth();

  createButton("Show Dungeon").parent("controls").mousePressed(() => {
    viewMode = "dungeon";
    generateView();
  });

  createButton("Show Overworld").parent("controls").mousePressed(() => {
    viewMode = "overworld";
    generateView();
  });

  createButton("Reseed").parent("controls").mousePressed(() => {
    seed = (seed | 0) + 1109;
    randomSeed(seed);
    noiseSeed(seed);
    generateView();
  });

  seed = floor(random(99999));
  randomSeed(seed);
  noiseSeed(seed);
  generateView();

  centerCanvas();
}

function windowResized() {
  centerCanvas();
}

function centerCanvas() {
  const canvasElt = select("canvas").elt;
  const x = (windowWidth - width) / 2;
  const y = (windowHeight - height) / 2;
  canvasElt.style.position = "absolute";
  canvasElt.style.left = `${x}px`;
  canvasElt.style.top = `${y}px`;
}

function draw() {
  randomSeed(seed);
  drawView();
}

function generateView() {
  if (viewMode === "overworld") {
    currentGrid = generateOverworld(numCols, numRows);
  } else {
    currentGrid = generateDungeon(numCols, numRows);
  }
}

function drawView() {
  if (viewMode === "overworld") {
    drawOverworld(currentGrid);
  } else {
    drawDungeon(currentGrid);
  }
}

function placeTile(i, j, ti, tj) {
  image(tilesetImage, 16 * j, 16 * i, 16, 16, 8 * ti, 8 * tj, 8, 8);
}





// Dungeon Code Starts //


function generateDungeon(numCols, numRows) {
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

function drawDungeon(grid) {
  background(13);
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const cell = grid[i][j];
      if (cell === ".") {
        const [ti, tj] = random([[1,10],[2,10],[3,10]]);
        placeTile(i, j, ti, tj);
      } else if (cell === "+") {
        const tileCycle = [[4,21],[3,21],[2,21]];
        let idx = floor((frameCount + i + j) / 10) % tileCycle.length;
        let [ti, tj] = tileCycle[idx];
        placeTile(i, j, ti, tj);
      } else if (cell === "1") placeTile(i, j, 9, 15);
      else if (cell === "2") placeTile(i, j, 11, 15);
      else if (cell === "3") placeTile(i, j, 9, 17);
      else if (cell === "4") placeTile(i, j, 11, 17);
      else if (cell === "A") placeTile(i, j, 10, 15);
      else if (cell === "B") placeTile(i, j, 10, 17);
      else if (cell === "L") placeTile(i, j, 9, 16);
      else if (cell === "R") placeTile(i, j, 11, 16);
      else {
        const [ti, tj] = random([[1,16],[2,16],[3,16]]);
        placeTile(i, j, ti, tj);
      }
    }
  }
}

function drawHallway(grid, r1, c1, r2, c2) {
  if (r1 === r2) {
    for (let j = min(c1, c2); j <= max(c1, c2); j++) {
      if (grid[r1][j] === "_") grid[r1][j] = "+";
    }
  } else if (c1 === c2) {
    for (let i = min(r1, r2); i <= max(r1, r2); i++) {
      if (grid[i][c1] === "_") grid[i][c1] = "+";
    }
  }
}



// Overworld Code //


function generateOverworld(numCols, numRows) {
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
        if (i < 0 || i >= numRows || j < 0 || j >= numCols) continue;
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
    clouds.push({ x: random(-100, 800), y: random(0, height), speed: random(0.1, 0.3) });
  }

  return grid;
}

function drawOverworld(grid) {
  background('#1f2d75');

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

        if (topleft) placeTile(i, j, 6, 14);
        else if (topright) placeTile(i, j, 4, 14);
        else if (bottomleft) placeTile(i, j, 6, 12);
        else if (bottomright) placeTile(i, j, 4, 12);
        else if (top) placeTile(i, j, 5, 14);
        else if (bottom) placeTile(i, j, 5, 12);
        else if (left) placeTile(i, j, 6, 13);
        else if (right) placeTile(i, j, 4, 13);
        else {
          placeTile(i, j, 0, 12);
          if (random() < 0.1) placeTile(i, j, 14, 12);
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

        if (topleft) placeTile(i, j, 23, 14);
        else if (topright) placeTile(i, j, 21, 14);
        else if (bottomleft) placeTile(i, j, 23, 12);
        else if (bottomright) placeTile(i, j, 21, 12);
        else if (top) placeTile(i, j, 22, 14);
        else if (bottom) placeTile(i, j, 22, 12);
        else if (left) placeTile(i, j, 23, 13);
        else if (right) placeTile(i, j, 21, 13);
        else drawContext(grid, i, j, "i", 17, 9);
      } else {
        const tile = random() < 0.7 ? [0,14] : random([[1,14],[2,14]]);
        placeTile(i, j, tile[0], tile[1]);
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
