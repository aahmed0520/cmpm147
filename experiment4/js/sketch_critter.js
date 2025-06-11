"use strict";

/* global XXH, p5 */

var critterSketch = function(p) {
  let tile_width_step_main;
  let tile_height_step_main;
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  let worldSeed;
  let clicks = {};
  let [tw, th] = [32, 16];

  let critter = [];
  let apples = [];
  let obstacles = [];
  let flowers = [];
  let mushrooms = [];
  let trail = [];
  let lastMoveTime = 0;
  let moveInterval = 500;

  p.setup = function () {
    let canvasContainer = p.select("#canvas-container");
    let height = p.select(".minor-section").elt.offsetHeight;
    let canvas = p.createCanvas(canvasContainer.width, height);
    canvas.parent("canvas-container");

    camera_offset = p.createVector(-p.width / 2, p.height / 2);
    camera_velocity = p.createVector(0, 0);

    let input = p.select('#world-key-input');
    input.input(() => {
      rebuildWorld(input.value());
    });

    p.createP("Arrow keys scroll. Clicking drops apples.").parent("canvas-container");
    rebuildWorld(input.value());

    p.windowResized = resizeScreen;
    resizeScreen();
  };

  function rebuildWorld(key) {
    worldSeed = XXH.h32(key, 0);
    p.noiseSeed(worldSeed);
    p.randomSeed(worldSeed);

    tile_width_step_main = 32;
    tile_height_step_main = 16;
    tile_columns = Math.ceil(p.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(p.height / (tile_height_step_main * 2));

    let startX = Math.floor(p.random(-5, 5));
    let startY = Math.floor(p.random(-5, 5));
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
          if (p.random() < 0.04) obstacles.push({ i: x, j: y });
          else if (p.random() < 0.05) flowers.push({ i: x, j: y });
          else if (p.random() < 0.03) mushrooms.push({ i: x, j: y });
        }
      }
    }
    lastMoveTime = p.millis();
  }

  p.draw = function () {
    if (p.keyIsDown(p.LEFT_ARROW)) camera_velocity.x -= 1;
    if (p.keyIsDown(p.RIGHT_ARROW)) camera_velocity.x += 1;
    if (p.keyIsDown(p.DOWN_ARROW)) camera_velocity.y -= 1;
    if (p.keyIsDown(p.UP_ARROW)) camera_velocity.y += 1;

    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95);
    if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

    if (p.millis() - lastMoveTime > moveInterval) {
      lastMoveTime = p.millis();
      moveCritter();
    }

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
    apples.push({ i, j });
    return false;
  };

  // Helper functions
  function moveCritter() {
    let head = critter[0];
    let second = critter[1];
    let next = { i: head.i, j: head.j };

    if (apples.length > 0) {
      let target = apples.reduce((a, b) => p.dist(head.i, head.j, a.i, a.j) < p.dist(head.i, head.j, b.i, b.j) ? a : b);
      let options = [
        { i: head.i + 1, j: head.j },
        { i: head.i - 1, j: head.j },
        { i: head.i, j: head.j + 1 },
        { i: head.i, j: head.j - 1 }
      ].filter(o => !(second && o.i === second.i && o.j === second.j) && !obstacles.some(ob => ob.i === o.i && ob.j === o.j));

      options.sort((a, b) => p.dist(a.i, a.j, target.i, target.j) - p.dist(b.i, b.j, target.i, target.j));
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

  function resizeScreen() {
    let canvasContainer = p.select("#canvas-container");
    let height = p.select(".minor-section").elt.offsetHeight;
    p.resizeCanvas(canvasContainer.width, height);
    rebuildWorld(p.select("#world-key-input").value());
  }

  function cameraToWorldOffset([cx, cy]) {
    let wx = cx / (tile_width_step_main * 2);
    let wy = cy / (tile_height_step_main * 2);
    return { x: Math.round(wx), y: Math.round(wy) };
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
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

  function describeMouseTile([i, j], [cx, cy]) {
    let [sx, sy] = worldToScreen([i, j], [cx, cy]);
    p.push();
    p.translate(0 - sx, sy);
    p.noFill();
    p.stroke(0, 255, 0, 128);
    p.beginShape();
    p.vertex(-tw, 0); p.vertex(0, th); p.vertex(tw, 0); p.vertex(0, -th);
    p.endShape(p.CLOSE);
    p.noStroke();
    p.fill(0);
    p.text("tile " + [i, j], 0, 0);
    p.pop();
  }

  function drawTile([i, j], [cx, cy]) {
    let [sx, sy] = worldToScreen([i, j], [cx, cy]);
    p.push();
    p.translate(0 - sx, sy);
    drawTerrainTile(i, j);
    p.pop();
  }

  function drawTerrainTile(i, j) {
    p.noStroke();
    let n = p.noise(i * 0.1, j * 0.1);
    p.fill(p.lerpColor(p.color('#d0ffb0'), p.color('#4caf50'), n));

    p.beginShape();
    p.vertex(-tw, 0); p.vertex(0, th); p.vertex(tw, 0); p.vertex(0, -th);
    p.endShape(p.CLOSE);

    if (trail.some(t => t.i === i && t.j === j)) {
      p.fill(255, 250, 240, 60);
      p.ellipse(0, 0, 12, 12);
    }

    if (flowers.some(f => f.i === i && f.j === j)) {
      p.fill('pink');
      p.ellipse(-3, -3, 6, 6); p.ellipse(3, -3, 6, 6);
      p.ellipse(-3, 3, 6, 6); p.ellipse(3, 3, 6, 6);
      p.fill('yellow');
      p.ellipse(0, 0, 5, 5);
    }

    if (mushrooms.some(m => m.i === i && m.j === j)) {
      p.fill('brown'); p.ellipse(0, -2, 8, 6);
      p.fill('tan'); p.rect(-1, -2, 2, 6);
    }

    if (obstacles.some(o => o.i === i && o.j === j)) {
      p.fill('#444');
      p.beginShape(); p.vertex(-tw, 0); p.vertex(0, -th - 16); p.vertex(tw, 0); p.vertex(0, th); p.endShape(p.CLOSE);
      p.fill('#222');
      p.beginShape(); p.vertex(-tw, 0); p.vertex(0, th); p.vertex(0, th + 10); p.vertex(-tw, 10); p.endShape(p.CLOSE);
      p.beginShape(); p.vertex(tw, 0); p.vertex(0, th); p.vertex(0, th + 10); p.vertex(tw, 10); p.endShape(p.CLOSE);
    }

    if (apples.some(a => a.i === i && a.j === j)) {
      p.fill('red'); p.ellipse(0, -3, 16, 16);
      p.fill('green'); p.rect(-1, -12, 2, 5, 1);
    }

    for (let index = 0; index < critter.length; index++) {
      let seg = critter[index];
      if (seg.i === i && seg.j === j) {
        p.fill(index === 0 ? 'gold' : (index === critter.length - 1 ? '#e0a800' : '#f1c40f'));
        p.ellipse(0, 0, 28, 28);

        if (index === 0) {
          let dir = getCritterDirectionVector();
          dir = snapToDirectionVector(dir);
          let dx = (dir.x - dir.y) * 0.5;
          let dy = (dir.x + dir.y) * 0.25;
          let angle = p.atan2(-dir.y, dir.x);

          if (angle < p.radians(60) || angle > p.radians(120)) {
            p.fill(0);
            p.ellipse(-5 + dx * 4, -4 + dy * 4, 4, 4);
            p.ellipse(5 + dx * 4, -4 + dy * 4, 4, 4);

            p.noFill();
            p.stroke(0);
            p.strokeWeight(1);
            p.arc(0, 4 + dy * 2, 10, 6, 0, p.PI);
            p.noStroke();
          }
        }
      }
    }
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
};

var myp5_critter = new p5(critterSketch, 'p5sketch2');
