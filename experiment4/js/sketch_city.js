"use strict";

/* global XXH, p5 */

window.citySketch = function (p) {
  let tile_width_step_main;
  let tile_height_step_main;
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  let worldSeed;
  let buildingMap = new Map();
  let mergeQueue = [];
  let treeMap = new Set();
  let lampMap = new Set();

  let [tw, th] = [32, 16];

  p.setup = function () {
    let canvasContainer = p.select("#canvas-container");
    let canvas = p.createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent("canvas-container");

    camera_offset = p.createVector(-p.width / 2, p.height / 2);
    camera_velocity = p.createVector(0, 0);

    let input = p.select('#world-key-input');
    input.input(() => {
      rebuildWorld(input.value());
    });

    rebuildWorld(input.value());

    window.addEventListener("resize", resizeScreen);
    resizeScreen();
  };

  function rebuildWorld(key) {
    worldSeed = XXH.h32(key, 0);
    p.noiseSeed(worldSeed);
    p.randomSeed(worldSeed);

    tile_width_step_main = tw;
    tile_height_step_main = th;
    tile_columns = Math.ceil(p.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(p.height / (tile_height_step_main * 2));

    buildingMap.clear();
    mergeQueue = [];
    treeMap.clear();
    lampMap.clear();

    for (let i = -100; i <= 100; i++) {
      for (let j = -100; j <= 100; j++) {
        if (!isRoadTile(i, j) && !isSidewalkTile(i, j)) {
          let hash = XXH.h32(`tree:${i},${j}`, worldSeed);
          if (hash % 70 === 0) treeMap.add(`${i},${j}`);
        } else if (isSidewalkTile(i, j) && !isRoadTile(i, j)) {
          let hash = XXH.h32(`lamp:${i},${j}`, worldSeed);
          if (hash % 30 === 0) lampMap.add(`${i},${j}`);
        }
      }
    }
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

    p.background(220);

    let overdraw = 0.1;
    let y0 = Math.floor((0 - overdraw) * tile_rows);
    let y1 = Math.floor((1 + overdraw) * tile_rows);
    let x0 = Math.floor((0 - overdraw) * tile_columns);
    let x1 = Math.floor((1 + overdraw) * tile_columns);

    combineBuildings();
    processMergeQueue();

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        drawTile(tileRenderingOrder([x + world_offset.x, y - world_offset.y]), [camera_offset.x, camera_offset.y]);
      }
      for (let x = x0; x < x1; x++) {
        drawTile(tileRenderingOrder([x + 0.5 + world_offset.x, y + 0.5 - world_offset.y]), [camera_offset.x, camera_offset.y]);
      }
    }
  };

  p.mouseClicked = function () {
    let [i, j] = screenToWorld([0 - p.mouseX, p.mouseY], [camera_offset.x, camera_offset.y]);
    if (isRoadTile(i, j) || isSidewalkTile(i, j) || treeMap.has(`${i},${j}`)) return;

    let key = `${i},${j}`;
    if (!buildingMap.has(key)) {
      buildingMap.set(key, 1);
    }
    return false;
  };

  function drawTile([i, j], [camera_x, camera_y]) {
    let [screen_x, screen_y] = worldToScreen([i, j], [camera_x, camera_y]);
    p.push();
    p.translate(0 - screen_x, screen_y);
    p3_drawTile(i, j);
    p.pop();
  }

  function p3_drawTile(i, j) {
    if (treeMap.has(`${i},${j}`)) {
      p.fill(60, 120, 60);
      p.ellipse(0, 0, 48);
      return;
    }

    if (lampMap.has(`${i},${j}`)) {
      p.stroke(50);
      p.line(0, 0, 0, -20);
      p.noStroke();
      p.fill(255, 255, 100);
      p.ellipse(0, -24, 6);
      return;
    }

    if (isRoadTile(i, j)) {
      p.fill("#999");
    } else if (isSidewalkTile(i, j)) {
      p.fill("#bbb");
    } else {
      p.fill("#aad");
    }

    p.beginShape();
    p.vertex(-tw, 0);
    p.vertex(0, th);
    p.vertex(tw, 0);
    p.vertex(0, -th);
    p.endShape(p.CLOSE);

    let key = `${i},${j}`;
    let level = buildingMap.get(key);
    if (level) {
      p.fill(["#6e4", "#4b8", "#37f", "#80f"][level - 1]);
      p.rect(0, -th - level * 6, 12, level * 12);
    }
  }

  function isRoadTile(i, j) {
    return i % 5 === 0 || j % 5 === 0;
  }

  function isSidewalkTile(i, j) {
    return i % 5 === 1 || j % 5 === 1;
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  }

  function cameraToWorldOffset([cx, cy]) {
    let wx = cx / (tile_width_step_main * 2);
    let wy = cy / (tile_height_step_main * 2);
    return { x: Math.round(wx), y: Math.round(wy) };
  }

  function screenToWorld([sx, sy], [cx, cy]) {
    sx -= cx;
    sy -= cy;
    sx /= tile_width_step_main * 2;
    sy /= tile_height_step_main * 2;
    sy += 0.5;
    return [Math.floor(sy + sx), Math.floor(sy - sx)];
  }

  function worldToScreen([x, y], [cx, cy]) {
    let i = (x - y) * tile_width_step_main;
    let j = (x + y) * tile_height_step_main;
    return [i + cx, j + cy];
  }

  function resizeScreen() {
    let canvasContainer = p.select("#canvas-container");
    p.resizeCanvas(canvasContainer.width, canvasContainer.height);
    rebuildWorld(p.select("#world-key-input").value());
  }

  function combineBuildings() {
    for (let [key, level] of buildingMap) {
      if (level >= 4) continue;
      let [i, j] = key.split(",").map(Number);
      let neighbors = [
        [i + 1, j], [i - 1, j],
        [i, j + 1], [i, j - 1]
      ];
      for (let [ni, nj] of neighbors) {
        let nKey = `${ni},${nj}`;
        if (buildingMap.get(nKey) === level) {
          mergeQueue.push({ key1: key, key2: nKey, level, timestamp: p.millis() });
          break;
        }
      }
    }
  }

  function processMergeQueue() {
    let now = p.millis();
    mergeQueue = mergeQueue.filter(entry => {
      if (now - entry.timestamp > 300) {
        buildingMap.delete(entry.key1);
        buildingMap.delete(entry.key2);

        let [i1, j1] = entry.key1.split(",").map(Number);
        let [i2, j2] = entry.key2.split(",").map(Number);
        let centerKey = `${Math.floor((i1 + i2) / 2)},${Math.floor((j1 + j2) / 2)}`;
        buildingMap.set(centerKey, entry.level + 1);
        return false;
      }
      return true;
    });
  }
};
