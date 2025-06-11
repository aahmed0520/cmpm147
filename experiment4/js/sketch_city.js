"use strict";

/* global XXH, p5 */

var citySketch = function(p) {
  let tile_width_step_main = 32;
  let tile_height_step_main = 16;
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  let worldSeed;
  let buildingMap = new Map();
  let mergeQueue = [];
  let treeMap = new Set();
  let lampMap = new Set();
  let [tw, th] = [tile_width_step_main, tile_height_step_main];

  p.setup = function () {
    let canvasContainer = p.select("#canvas-container");
    let height = p.select(".minor-section").elt.offsetHeight;
    let canvas = p.createCanvas(canvasContainer.width, height);
    canvas.parent("canvas-container");

    camera_offset = p.createVector(-p.width / 2, p.height / 2);
    camera_velocity = p.createVector(0, 0);

    let input = p.select("#world-key-input");
    input.input(() => rebuildWorld(input.value()));
    p.createP("Arrow keys scroll. Clicking places buildings.").parent("canvas-container");

    rebuildWorld(input.value());
    p.windowResized = resizeScreen;
    resizeScreen();
  };

  function rebuildWorld(key) {
    worldSeed = XXH.h32(key, 0);
    p.noiseSeed(worldSeed);
    p.randomSeed(worldSeed);

    buildingMap.clear();
    mergeQueue = [];
    treeMap.clear();
    lampMap.clear();

    tile_columns = Math.ceil(p.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(p.height / (tile_height_step_main * 2));

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
    p.background(100);

    combineBuildings();
    processMergeQueue();

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
    let key = `${i},${j}`;
    if (!isRoadTile(i, j) && !isSidewalkTile(i, j) && !treeMap.has(key)) {
      if (!buildingMap.has(key)) {
        buildingMap.set(key, 1);
      }
    }
    return false;
  };

  function combineBuildings() {
    let positions = Array.from(buildingMap.keys()).map(k => k.split(",").map(Number));
    let merged = new Set();

    for (let [i, j] of positions) {
      let key = `${i},${j}`;
      if (!buildingMap.has(key) || merged.has(key)) continue;

      let level = buildingMap.get(key);
      if (level >= 7) continue;

      let neighbors = [
        [i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1],
        [i + 1, j + 1], [i - 1, j - 1], [i + 1, j - 1], [i - 1, j + 1]
      ];

      let sameLevel = neighbors.filter(([x, y]) => buildingMap.get(`${x},${y}`) === level);
      if (sameLevel.length >= 1) {
        let [x, y] = sameLevel[0];
        mergeQueue.push({ key1: key, key2: `${x},${y}`, level, timestamp: p.millis() + 1000 });
        merged.add(key);
        merged.add(`${x},${y}`);
      }
    }
  }

  function processMergeQueue() {
    let now = p.millis();
    mergeQueue = mergeQueue.filter(({ key1, key2, level, timestamp }) => {
      if (now >= timestamp && buildingMap.get(key1) === level && buildingMap.get(key2) === level) {
        buildingMap.set(key1, level + 1);
        buildingMap.delete(key2);
        return false;
      }
      return true;
    });
  }

  function isRoadTile(i, j) {
    let hashX = XXH.h32(`roadX:${i}`, worldSeed);
    let hashY = XXH.h32(`roadY:${j}`, worldSeed);
    return (hashX % 20 === 0 || hashX % 20 === 1) || (hashY % 20 === 0 || hashY % 20 === 1);
  }

  function isSidewalkTile(i, j) {
    return [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]].some(([x, y]) => isRoadTile(x, y));
  }

  function drawTile([i, j], [cx, cy]) {
    let [sx, sy] = worldToScreen([i, j], [cx, cy]);
    p.push();
    p.translate(0 - sx, sy);

    let key = `${i},${j}`;
    let isRoad = isRoadTile(i, j);
    let isSidewalk = isSidewalkTile(i, j);
    p.noStroke();
    p.fill(isRoad ? 90 : isSidewalk ? 160 : p.lerpColor(p.color('#b8e994'), p.color('#38ada9'), p.noise(i * 0.1, j * 0.1)));
    p.beginShape();
    p.vertex(-tw, 0);
    p.vertex(0, th);
    p.vertex(tw, 0);
    p.vertex(0, -th);
    p.endShape(p.CLOSE);

    if (treeMap.has(key)) drawTree();
    if (lampMap.has(key)) drawLampPost();
    if (buildingMap.has(key)) drawBuilding(buildingMap.get(key));

    p.pop();
  }

  function drawTree() {
    p.fill(80, 50, 20);
    p.rect(0, 24, 8, 64);
    p.fill(30, 150, 50);
    p.ellipse(0, -16, 50, 50);
  }

  function drawLampPost() {
    p.fill(60);
    p.rect(0, -10, 2, 20);
    p.fill(255, 240, 100);
    p.ellipse(0, -20, 6, 6);
  }

  function drawBuilding(level) {
    const baseColor = ["#8b4513", "#a0522d", "#cd853f", "#deb887", "#cdaa7d", "#d2b48c", "#f5deb3"];
    const shadowColor = ["#5a3220", "#6b3e29", "#875e40", "#a07a4e", "#927350", "#a88d6e", "#cabfa3"];

    level = p.constrain(level, 1, 7);
    const wallHeight = 20;

    for (let i = 0; i < level; i++) {
      p.fill(shadowColor[level - 1]);
      p.quad(-tw, 0, 0, th, 0, th - wallHeight, -tw, -wallHeight);

      p.fill(baseColor[level - 1]);
      p.quad(tw, 0, 0, th, 0, th - wallHeight, tw, -wallHeight);

      p.translate(0, -wallHeight);
    }

    p.fill(p.lerpColor(p.color(baseColor[level - 1]), p.color("white"), 0.3));
    p.beginShape();
    p.vertex(-tw, 0);
    p.vertex(0, -th);
    p.vertex(tw, 0);
    p.vertex(0, th);
    p.endShape(p.CLOSE);
  }

  function describeMouseTile([i, j], [cx, cy]) {
    let [sx, sy] = worldToScreen([i, j], [cx, cy]);
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
};

var myp5_city = new p5(citySketch, 'p5sketch3');
