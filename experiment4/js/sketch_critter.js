"use strict";

/* global XXH, p5 */

let tile_width_step_main;
let tile_height_step_main;
let tile_rows, tile_columns;
let camera_offset;
let camera_velocity;

let worldSeed;
let clicks = {};
let [tw, th] = [32, 16];

let critter = []; // list of segments: each {i, j}
let apples = [];  // list of {i, j}
let obstacles = []; // list of {i, j}
let flowers = [];   // list of {i, j}
let mushrooms = []; // list of {i, j}
let trail = [];     // list of previous head positions
let lastMoveTime = 0;
let moveInterval = 500;

window.preload = function () {};

window.setup = function () {
  let canvasContainer = $("#canvas-container");
  let height = $(".minor-section:first-of-type").height();
  let canvas = createCanvas(canvasContainer.width(), height);
  canvas.parent("canvas-container");

  camera_offset = new p5.Vector(-width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  let input = select('#world-key-input');
  input.input(() => {
    rebuildWorld(input.value());
  });

  createP("Arrow keys scroll. Clicking drops apples.").parent("canvas-container");

  rebuildWorld(input.value());

  $(window).resize(() => resizeScreen());
  resizeScreen();
};

function rebuildWorld(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);

  tile_width_step_main = 32;
  tile_height_step_main = 16;
  tile_columns = Math.ceil(width / (tile_width_step_main * 2));
  tile_rows = Math.ceil(height / (tile_height_step_main * 2));

  let startX = Math.floor(random(-5, 5));
  let startY = Math.floor(random(-5, 5));
  critter = [
    { i: startX, j: startY },
    { i: startX - 1, j: startY },
    { i: startX - 2, j: startY }
  ];

  trail = [];
  apples = [];
  obstacles = [];
  flowers = [];
  mushrooms = [];

  for (let x = -10; x < 10; x++) {
    for (let y = -10; y < 10; y++) {
      if (!critter.some(seg => seg.i === x && seg.j === y)) {
        if (random() < 0.04) obstacles.push({ i: x, j: y });
        else if (random() < 0.05) flowers.push({ i: x, j: y });
        else if (random() < 0.03) mushrooms.push({ i: x, j: y });
      }
    }
  }

  lastMoveTime = millis();
}

window.draw = function () {
  if (keyIsDown(LEFT_ARROW)) camera_velocity.x -= 1;
  if (keyIsDown(RIGHT_ARROW)) camera_velocity.x += 1;
  if (keyIsDown(DOWN_ARROW)) camera_velocity.y -= 1;
  if (keyIsDown(UP_ARROW)) camera_velocity.y += 1;

  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95);
  if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

  if (millis() - lastMoveTime > moveInterval) {
    lastMoveTime = millis();
    moveCritter();
  }

  let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
  background(100);

  let overdraw = 0.1;
  let y0 = Math.floor((0 - overdraw) * tile_rows);
  let y1 = Math.floor((1 + overdraw) * tile_rows);
  let x0 = Math.floor((0 - overdraw) * tile_columns);
  let x1 = Math.floor((1 + overdraw) * tile_columns);

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [camera_offset.x, camera_offset.y]);
    }
    for (let x = x0; x < x1; x++) {
      drawTile(tileRenderingOrder([x + 0.5 + world_offset.x, y + 0.5 - world_offset.y]), [camera_offset.x, camera_offset.y]);
    }
  }

  let mouseWorld = screenToWorld([0 - mouseX, mouseY], [camera_offset.x, camera_offset.y]);
  describeMouseTile(mouseWorld, [camera_offset.x, camera_offset.y]);
};

window.mouseClicked = function () {
  let [i, j] = screenToWorld([0 - mouseX, mouseY], [camera_offset.x, camera_offset.y]);
  apples.push({ i, j });
  return false;
};

function moveCritter() {
  let head = critter[0];
  let second = critter[1];
  let next = { i: head.i, j: head.j };

  if (apples.length > 0) {
    let target = apples.reduce((a, b) => dist(head.i, head.j, a.i, a.j) < dist(head.i, head.j, b.i, b.j) ? a : b);
    let options = [
      { i: head.i + 1, j: head.j },
      { i: head.i - 1, j: head.j },
      { i: head.i, j: head.j + 1 },
      { i: head.i, j: head.j - 1 }
    ].filter(o => !(second && o.i === second.i && o.j === second.j) && !obstacles.some(ob => ob.i === o.i && ob.j === o.j));

    options.sort((a, b) => dist(a.i, a.j, target.i, target.j) - dist(b.i, b.j, target.i, target.j));
    next = options[0] || next;
  } else {
    let dx = head.i - second.i || 1;
    let dy = head.j - second.j || 0;
    let forward = { i: head.i + dx, j: head.j + dy };
    if (!obstacles.some(ob => ob.i === forward.i && ob.j === forward.j)) next = forward;
  }

  trail.push({ i: head.i, j: head.j });
  if (trail.length > 30) trail.shift();
  critter.unshift(next);

  let eatenIndex = apples.findIndex(a => a.i === next.i && a.j === next.j);
  if (eatenIndex !== -1) apples.splice(eatenIndex, 1);
  else critter.pop();
}

function drawTile([i, j], [cx, cy]) {
  let [sx, sy] = worldToScreen([i, j], [cx, cy]);
  push();
  translate(0 - sx, sy);
  drawTerrainTile(i, j);
  pop();
}

function drawTerrainTile(i, j) {
  noStroke();
  let n = noise(i * 0.1, j * 0.1);
  fill(lerpColor(color('#d0ffb0'), color('#4caf50'), n));

  push();
  beginShape();
  vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th);
  endShape(CLOSE);

  if (trail.some(t => t.i === i && t.j === j)) {
    fill(255, 250, 240, 60);
    ellipse(0, 0, 12, 12);
  }

  if (flowers.some(f => f.i === i && f.j === j)) {
    fill('pink');
    ellipse(-3, -3, 6, 6); ellipse(3, -3, 6, 6);
    ellipse(-3, 3, 6, 6); ellipse(3, 3, 6, 6);
    fill('yellow');
    ellipse(0, 0, 5, 5);
  }

  if (mushrooms.some(m => m.i === i && m.j === j)) {
    fill('brown'); ellipse(0, -2, 8, 6);
    fill('tan'); rect(-1, -2, 2, 6);
  }

  if (obstacles.some(o => o.i === i && o.j === j)) {
    fill('#444');
    beginShape(); vertex(-tw, 0); vertex(0, -th - 16); vertex(tw, 0); vertex(0, th); endShape(CLOSE);
    fill('#222');
    beginShape(); vertex(-tw, 0); vertex(0, th); vertex(0, th + 10); vertex(-tw, 10); endShape(CLOSE);
    beginShape(); vertex(tw, 0); vertex(0, th); vertex(0, th + 10); vertex(tw, 10); endShape(CLOSE);
  }

  if (apples.some(a => a.i === i && a.j === j)) {
    fill('red'); ellipse(0, -3, 16, 16);
    fill('green'); rect(-1, -12, 2, 5, 1);
  }

  for (let index = 0; index < critter.length; index++) {
    let seg = critter[index];
    if (seg.i === i && seg.j === j) {
      fill(index === 0 ? 'gold' : (index === critter.length - 1 ? '#e0a800' : '#f1c40f'));
      ellipse(0, 0, 28, 28);

      if (index === 0) {
        let dir = getCritterDirectionVector();
        dir = snapToDirectionVector(dir);
        let dx = (dir.x - dir.y) * 0.5;
        let dy = (dir.x + dir.y) * 0.25;
        let angle = atan2(-dir.y, dir.x);

        if (angle < radians(60) || angle > radians(120)) {
          fill(0);
          ellipse(-5 + dx * 4, -4 + dy * 4, 4, 4);
          ellipse(5 + dx * 4, -4 + dy * 4, 4, 4);

          noFill();
          stroke(0);
          strokeWeight(1);
          arc(0, 4 + dy * 2, 10, 6, 0, PI);
          noStroke();
        }
      }
    }
  }
  pop();
}

function getCritterDirectionVector() {
  if (critter.length < 3) return { x: 1, y: 0 };
  let xTotal = 0, yTotal = 0;
  let count = Math.min(5, critter.length - 1);
  for (let i = 0; i < count; i++) {
    let a = critter[i];
    let b = critter[i + 1];
    xTotal += a.i - b.i;
    yTotal += a.j - b.j;
  }
  return { x: xTotal / count, y: yTotal / count };
}

function snapToDirectionVector(dir) {
  const directions = [
    { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 },
    { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }, { x: -1, y: -1 }
  ];
  let closest = directions[0];
  let bestDist = Infinity;
  for (let d of directions) {
    let dx = dir.x - d.x, dy = dir.y - d.y;
    let distSq = dx * dx + dy * dy;
    if (distSq < bestDist) {
      bestDist = distSq;
      closest = d;
    }
  }
  return closest;
}

function describeMouseTile([i, j], [cx, cy]) {
  let [sx, sy] = worldToScreen([i, j], [cx, cy]);
  drawTileDescription([i, j], [0 - sx, sy]);
}

function drawTileDescription([i, j], [sx, sy]) {
  push();
  translate(sx, sy);
  noFill();
  stroke(0, 255, 0, 128);
  beginShape();
  vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th);
  endShape(CLOSE);
  noStroke();
  fill(0);
  text("tile " + [i, j], 0, 0);
  pop();
}

function worldToScreen([x, y], [cx, cy]) {
  let i = (x - y) * tile_width_step_main;
  let j = (x + y) * tile_height_step_main;
  return [i + cx, j + cy];
}

function screenToWorld([sx, sy], [cx, cy]) {
  sx -= cx;
  sy -= cy;
  sx /= tile_width_step_main * 2;
  sy /= tile_height_step_main * 2;
  sy += 0.5;
  return [Math.floor(sy + sx), Math.floor(sy - sx)];
}

function tileRenderingOrder(offset) {
  return [offset[1] - offset[0], offset[0] + offset[1]];
}

function cameraToWorldOffset([cx, cy]) {
  let wx = cx / (tile_width_step_main * 2);
  let wy = cy / (tile_height_step_main * 2);
  return { x: Math.round(wx), y: Math.round(wy) };
}

function resizeScreen() {
  let canvasContainer = $("#canvas-container");
  let height = $(".minor-section:first-of-type").height();
  resizeCanvas(canvasContainer.width(), height);
  rebuildWorld($("#canvas-container input").val());
}
