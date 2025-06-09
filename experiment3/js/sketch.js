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
