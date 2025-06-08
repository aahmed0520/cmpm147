/* exported setup, draw */

let seed = 239;

// Color palette based on the image
const grassColor = "#2f4f1c";
const barnColor = "#302c2c";
const barnLightColor = "#e8b55b";
const treeColor = "#1a1a1a";
const bushColor = "#3e5e2f";

// Aurora color variations sampled from the reference image
const auroraColor1 = "#b2ff5f"; // bright yellow-green
const auroraColor2 = "#76f0a6"; // minty green
const auroraColor3 = "#4cb1d6"; // teal-cyan

let canvasContainer;

function setup() {
  // responsive canvas setup
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  $(window).resize(function () {
    resizeScreen();
  });

  createButton("reimagine").mousePressed(() => seed++);
  resizeScreen();
}

function draw() {
  randomSeed(seed);
  noStroke();

  background(10, 10, 20); // dark night sky

  // Animated aurora bands using sampled shades
  const numBands = 200;
  for (let i = 0; i < numBands; i++) {
    let baseX = width * random();
    let waveOffset = 30 * sin(millis() / 2000 + i);
    let x = baseX + waveOffset;
    let y = random(height / 2);
    let h = random(40, height / 2);
    let alpha = 140 + 60 * random();
    const auroraColor = random([auroraColor1, auroraColor2, auroraColor3]);
    fill(auroraColor + hex(floor(alpha), 2));
    rect(x, y, 4, h);
  }

  // Ground
  fill(grassColor);
  rect(0, height / 2, width, height / 2);

  // Static trees
  fill(treeColor);
  const treeCount = 10;
  for (let i = 0; i < treeCount; i++) {
    let x = random(width);
    let y = height / 2 + 10 + random(10);
    let s = random(12,18) ;
    triangle(x, y - s, x - s / 3, y, x + s / 3, y);
  }

  // Barn
  fill(barnColor);
  rect(width * 0.2, height * 0.55, width * 0.2, height * 0.25);
  triangle(
    width * 0.2,
    height * 0.55,
    width * 0.3,
    height * 0.45,
    width * 0.4,
    height * 0.55
  );

  // Windows
  fill(barnLightColor);
  rect(width * 0.5, height * 0.65, 8, 10);
  rect(width * 0.6, height * 0.65, 8, 10);
  rect(width * 0.54, height * 0.7, 6, 8);

  // Bushes
  fill(bushColor);
  for (let i = 0; i < 15; i++) {
    let bx = width * 0.2 + i * 15 + random(-3, 3);
    let by = height * 0.78 + random(-2, 30);
    ellipse(bx, by, 12 + random(4), 8 + random(2));
  }
}

function resizeScreen() {
  const containerRect = canvasContainer[0].getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;
  resizeCanvas(containerWidth, containerHeight);
}
