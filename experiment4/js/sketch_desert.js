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

window.preload = function () {};

window.setup = function () {
  let canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  camera_offset = new p5.Vector(-width / 2, height / 2);
  camera_velocity = new p5.Vector(0, 0);

  let label = createP("World key: ");
  label.parent("canvas-container");

  let input = createInput("xyzzy");
  input.parent(label);
  input.input(() => rebuildWorld(input.value()));

  createP("Arrow keys scroll. Clicking changes tiles.").parent("canvas-container");

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
}

window.draw = function () {
  if (keyIsDown(LEFT_ARROW)) camera_velocity.x -= 1;
  if (keyIsDown(RIGHT_ARROW)) camera_velocity.x += 1;
  if (keyIsDown(DOWN_ARROW)) camera_velocity.y -= 1;
  if (keyIsDown(UP_ARROW)) camera_velocity.y += 1;

  camera_offset.add(camera_velocity);
  camera_velocity.mult(0.95);
  if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

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
  let key = [i, j];
  clicks[key] = millis();
  return false;
};

function drawTile([i, j], [camera_x, camera_y]) {
  let [screen_x, screen_y] = worldToScreen([i, j], [camera_x, camera_y]);
  push();
  translate(0 - screen_x, screen_y);
  drawTerrainTile(i, j);
  pop();
}

function describeMouseTile([i, j], [camera_x, camera_y]) {
  let [sx, sy] = worldToScreen([i, j], [camera_x, camera_y]);
  drawTileDescription([i, j], [0 - sx, sy]);
}

function drawTileDescription([i, j], [sx, sy]) {
  push();
  translate(sx, sy);
  noFill();
  stroke(0, 255, 0, 128);
  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);
  noStroke();
  fill(0);
  text("tile " + [i, j], 0, 0);
  pop();
}

function drawTerrainTile(i, j) {
  let n = noise(i * 0.1, j * 0.1);
  let rock = color('#8AAAB2'), dust = color('#CFCFC6'), rust = color('#B86D46'), dune = color('#6B3E2E');
  fill(n < 0.35 ? dust : n < 0.55 ? rust : n < 0.75 ? rock : dune);

  push();
  let h = (noise(i * 0.15 + 100, j * 0.15 + 100) - 0.5) * 12;
  let top = (noise(i + 1, j + 1) - 0.5) * 10;
  let right = (noise(i + 2, j) - 0.5) * 10;
  let bottom = (noise(i - 1, j - 2) - 0.5) * 10;
  let left = (noise(i, j + 3) - 0.5) * 10;

  push();
  noStroke();
  fill(0, 0, 0, 40);
  beginShape();
  vertex(-tw + 2, 0 + left + h + 4);
  vertex(0 + 2, th + bottom + h + 4);
  vertex(tw + 2, 0 + right + h + 4);
  vertex(0 + 2, -th + top + h + 4);
  endShape(CLOSE);
  pop();

  noStroke();
  beginShape();
  vertex(-tw, 0 + left + h);
  vertex(0, th + bottom + h);
  vertex(tw, 0 + right + h);
  vertex(0, -th + top + h);
  endShape(CLOSE);

  if (n >= 0.75) {
    stroke(60, 30, 20, 180);
    strokeWeight(1);
    noFill();
    let t = millis() * 0.0002;
    for (let r = -th + 4; r < th - 4; r += 6) {
      beginShape();
      for (let x = -tw + 2; x <= tw - 2; x += 4) {
        let wave = sin((i + x) * 0.3 + (j + r) * 0.2 + t) * 2;
        let y = r + wave;
        curveVertex(x, y + h);
      }
      endShape();
    }
  }

  if (n >= 0.55 && n < 0.75) {
    stroke(30, 30, 30, 80);
    strokeWeight(0.5);
    randomSeed(XXH.h32("crack:" + [i, j], worldSeed));
    for (let k = 0; k < 2; k++) {
      let x1 = random(-tw * 0.8, tw * 0.8);
      let y1 = random(-th, th);
      let x2 = x1 + random(-5, 5);
      let y2 = y1 + random(-5, 5);
      line(x1, y1 + h, x2, y2 + h);
    }
  }

  let t = clicks[[i, j]];
  if (t !== undefined) {
    let pulse = sin((millis() - t) / 300.0) * 5 + 7;
    fill(200, 255, 255, 180);
    ellipse(0, 0 + h, pulse, pulse / 2);
  }

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
  resizeCanvas(canvasContainer.width(), canvasContainer.height());
  rebuildWorld($("#canvas-container input").val());
}
