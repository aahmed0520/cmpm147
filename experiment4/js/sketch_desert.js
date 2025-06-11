// js/sketch_desert.js

"use strict";

/* global XXH, p5 */

window.sketch_desert = function (p) {
  let tile_width_step_main = 32;
  let tile_height_step_main = 16;
  let tile_rows, tile_columns;
  let camera_offset, camera_velocity;
  let worldSeed;
  let clicks = {};
  let [tw, th] = [tile_width_step_main, tile_height_step_main];

  p.preload = function () {};

  p.setup = function () {
    const container = p.select("#canvas-container");
    let h = container.height;
    let canvas = p.createCanvas(container.width, h);
    canvas.parent("canvas-container");

    camera_offset = p.createVector(-p.width / 2, p.height / 2);
    camera_velocity = p.createVector(0, 0);

    let input = p.select("#world-key-input");
    input.input(() => rebuildWorld(input.value()));

    rebuildWorld(input.value());

    p.windowResized = resizeScreen;
    resizeScreen();
  };

  function rebuildWorld(key) {
    worldSeed = XXH.h32(key, 0);
    p.noiseSeed(worldSeed);
    p.randomSeed(worldSeed);

    tile_columns = Math.ceil(p.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(p.height / (tile_height_step_main * 2));
  }

  p.draw = function () {
    if (p.keyIsDown(p.LEFT_ARROW)) camera_velocity.x -= 1;
    if (p.keyIsDown(p.RIGHT_ARROW)) camera_velocity.x += 1;
    if (p.keyIsDown(p.DOWN_ARROW)) camera_velocity.y -= 1;
    if (p.keyIsDown(p.UP_ARROW)) camera_velocity.y += 1;

    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95);
    if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    p.background(100);

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

    let mouseWorld = screenToWorld([0 - p.mouseX, p.mouseY], [camera_offset.x, camera_offset.y]);
    describeMouseTile(mouseWorld, [camera_offset.x, camera_offset.y]);
  };

  p.mouseClicked = function () {
    let [i, j] = screenToWorld([0 - p.mouseX, p.mouseY], [camera_offset.x, camera_offset.y]);
    let key = [i, j];
    clicks[key] = p.millis();
    return false;
  };

  function drawTile([i, j], [camera_x, camera_y]) {
    let [sx, sy] = worldToScreen([i, j], [camera_x, camera_y]);
    p.push();
    p.translate(0 - sx, sy);
    drawTerrainTile(i, j);
    p.pop();
  }

  function describeMouseTile([i, j], [camera_x, camera_y]) {
    let [sx, sy] = worldToScreen([i, j], [camera_x, camera_y]);
    drawTileDescription([i, j], [0 - sx, sy]);
  }

  function drawTileDescription([i, j], [sx, sy]) {
    p.push();
    p.translate(sx, sy);
    p.noFill();
    p.stroke(0, 255, 0, 128);
    p.beginShape();
    p.vertex(-tw, 0);
    p.vertex(0, th);
    p.vertex(tw, 0);
    p.vertex(0, -th);
    p.endShape(p.CLOSE);
    p.noStroke();
    p.fill(0);
    p.text("tile " + [i, j], 0, 0);
    p.pop();
  }

  function drawTerrainTile(i, j) {
    let n = p.noise(i * 0.1, j * 0.1);
    let rock = p.color('#8AAAB2'), dust = p.color('#CFCFC6'), rust = p.color('#B86D46'), dune = p.color('#6B3E2E');
    p.fill(n < 0.35 ? dust : n < 0.55 ? rust : n < 0.75 ? rock : dune);

    p.push();
    let h = (p.noise(i * 0.15 + 100, j * 0.15 + 100) - 0.5) * 12;
    let top = (p.noise(i + 1, j + 1) - 0.5) * 10;
    let right = (p.noise(i + 2, j) - 0.5) * 10;
    let bottom = (p.noise(i - 1, j - 2) - 0.5) * 10;
    let left = (p.noise(i, j + 3) - 0.5) * 10;

    p.noStroke();
    p.fill(0, 0, 0, 40);
    p.beginShape();
    p.vertex(-tw + 2, 0 + left + h + 4);
    p.vertex(0 + 2, th + bottom + h + 4);
    p.vertex(tw + 2, 0 + right + h + 4);
    p.vertex(0 + 2, -th + top + h + 4);
    p.endShape(p.CLOSE);

    p.noStroke();
    p.beginShape();
    p.vertex(-tw, 0 + left + h);
    p.vertex(0, th + bottom + h);
    p.vertex(tw, 0 + right + h);
    p.vertex(0, -th + top + h);
    p.endShape(p.CLOSE);

    if (n >= 0.75) {
      p.stroke(60, 30, 20, 180);
      p.strokeWeight(1);
      p.noFill();
      let t = p.millis() * 0.0002;
      for (let r = -th + 4; r < th - 4; r += 6) {
        p.beginShape();
        for (let x = -tw + 2; x <= tw - 2; x += 4) {
          let wave = p.sin((i + x) * 0.3 + (j + r) * 0.2 + t) * 2;
          let y = r + wave;
          p.curveVertex(x, y + h);
        }
        p.endShape();
      }
    }

    if (n >= 0.55 && n < 0.75) {
      p.stroke(30, 30, 30, 80);
      p.strokeWeight(0.5);
      p.randomSeed(XXH.h32("crack:" + [i, j], worldSeed));
      for (let k = 0; k < 2; k++) {
        let x1 = p.random(-tw * 0.8, tw * 0.8);
        let y1 = p.random(-th, th);
        let x2 = x1 + p.random(-5, 5);
        let y2 = y1 + p.random(-5, 5);
        p.line(x1, y1 + h, x2, y2 + h);
      }
    }

    let t = clicks[[i, j]];
    if (t !== undefined) {
      let pulse = p.sin((p.millis() - t) / 300.0) * 5 + 7;
      p.fill(200, 255, 255, 180);
      p.ellipse(0, 0 + h, pulse, pulse / 2);
    }

    p.pop();
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
    const container = p.select("#canvas-container");
    let h = container.elt.offsetHeight;
    p.resizeCanvas(container.width, h);
    rebuildWorld(p.select("#world-key-input").value());
  }
};

new p5(desertSketch);
