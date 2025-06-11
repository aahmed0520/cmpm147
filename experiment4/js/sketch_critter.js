"use strict";

/* global XXH, p5 */

let critterSketch = function (sketch) {
  let tile_width_step_main, tile_height_step_main;
  let tile_rows, tile_columns;
  let camera_offset, camera_velocity;

  let worldSeed;
  let tw = 32, th = 16;
  let critter = [], apples = [], obstacles = [], flowers = [], mushrooms = [], trail = [];
  let lastMoveTime = 0;
  let moveInterval = 500;

  sketch.preload = function () {};

  sketch.setup = function () {
    let canvasContainer = sketch.select("#canvas-container");
    let height = $(".minor-section:first-of-type").height();
    let canvas = sketch.createCanvas(canvasContainer.width, height);
    canvas.parent("canvas-container");

    camera_offset = sketch.createVector(-sketch.width / 2, sketch.height / 2);
    camera_velocity = sketch.createVector(0, 0);

    let input = sketch.select('#world-key-input');
    input.input(() => rebuildWorld(input.value()));

    sketch.createP("Click to drop apples. Critter follows them.").parent("canvas-container");

    rebuildWorld(input.value());

    $(window).resize(() => resizeScreen());
    resizeScreen();
  };

  function rebuildWorld(key) {
    worldSeed = XXH.h32(key, 0);
    sketch.noiseSeed(worldSeed);
    sketch.randomSeed(worldSeed);

    let startX = Math.floor(sketch.random(-5, 5));
    let startY = Math.floor(sketch.random(-5, 5));
    critter = [
      { i: startX, j: startY },
      { i: startX - 1, j: startY },
      { i: startX - 2, j: startY }
    ];
    apples = [];
    obstacles = [];
    flowers = [];
    mushrooms = [];
    trail = [];

    for (let x = -10; x < 10; x++) {
      for (let y = -10; y < 10; y++) {
        if (!critter.some(seg => seg.i === x && seg.j === y)) {
          if (sketch.random() < 0.04) obstacles.push({ i: x, j: y });
          else if (sketch.random() < 0.05) flowers.push({ i: x, j: y });
          else if (sketch.random() < 0.03) mushrooms.push({ i: x, j: y });
        }
      }
    }

    lastMoveTime = sketch.millis();
    tile_width_step_main = tw;
    tile_height_step_main = th;
    tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(sketch.height / (tile_height_step_main * 2));
  }

  sketch.draw = function () {
    if (sketch.keyIsDown(sketch.LEFT_ARROW)) camera_velocity.x -= 1;
    if (sketch.keyIsDown(sketch.RIGHT_ARROW)) camera_velocity.x += 1;
    if (sketch.keyIsDown(sketch.DOWN_ARROW)) camera_velocity.y -= 1;
    if (sketch.keyIsDown(sketch.UP_ARROW)) camera_velocity.y += 1;

    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95);
    if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

    if (sketch.millis() - lastMoveTime > moveInterval) {
      moveCritter();
      lastMoveTime = sketch.millis();
    }

    let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
    sketch.background(200);

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

    let mouseWorld = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
    describeMouseTile(mouseWorld, [camera_offset.x, camera_offset.y]);
  };

  sketch.mouseClicked = function () {
    let [i, j] = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
    apples.push({ i, j });
    return false;
  };

  function drawTile([i, j], [camera_x, camera_y]) {
    let [sx, sy] = worldToScreen([i, j], [camera_x, camera_y]);
    sketch.push();
    sketch.translate(0 - sx, sy);
    p3_drawTile(i, j);
    sketch.pop();
  }

  function describeMouseTile([i, j], [cx, cy]) {
    let [sx, sy] = worldToScreen([i, j], [cx, cy]);
    drawTileDescription([i, j], [0 - sx, sy]);
  }

  function drawTileDescription([i, j], [sx, sy]) {
    sketch.push();
    sketch.translate(sx, sy);
    sketch.noFill();
    sketch.stroke(0, 255, 0, 128);
    sketch.beginShape();
    sketch.vertex(-tw, 0); sketch.vertex(0, th); sketch.vertex(tw, 0); sketch.vertex(0, -th);
    sketch.endShape(sketch.CLOSE);
    sketch.noStroke();
    sketch.fill(0);
    sketch.text("tile " + [i, j], 0, 0);
    sketch.pop();
  }

  function resizeScreen() {
    let canvasContainer = sketch.select("#canvas-container");
    let height = $(".minor-section:first-of-type").height();
    sketch.resizeCanvas(canvasContainer.width, height);
    rebuildWorld(sketch.select("#canvas-container input").value());
  }

  function moveCritter() {
    let head = critter[0];
    let second = critter[1];
    let next = { i: head.i, j: head.j };

    let target = apples.length > 0
      ? apples.reduce((a, b) =>
          sketch.dist(head.i, head.j, a.i, a.j) < sketch.dist(head.i, head.j, b.i, b.j) ? a : b)
      : null;

    if (target) {
      let options = [
        { i: head.i + 1, j: head.j },
        { i: head.i - 1, j: head.j },
        { i: head.i, j: head.j + 1 },
        { i: head.i, j: head.j - 1 }
      ].filter(o =>
        !(second && o.i === second.i && o.j === second.j) &&
        !obstacles.some(ob => ob.i === o.i && ob.j === o.j)
      );

      options.sort((a, b) =>
        sketch.dist(a.i, a.j, target.i, target.j) - sketch.dist(b.i, b.j, target.i, target.j)
      );
      next = options[0] || next;
    } else {
      let dx = head.i - second.i || 1;
      let dy = head.j - second.j || 0;
      let forward = { i: head.i + dx, j: head.j + dy };
      if (!obstacles.some(ob => ob.i === forward.i && ob.j === forward.j)) {
        next = forward;
      }
    }

    trail.push({ i: head.i, j: head.j });
    if (trail.length > 30) trail.shift();
    critter.unshift(next);

    let eatenIndex = apples.findIndex(a => a.i === next.i && a.j === next.j);
    if (eatenIndex !== -1) apples.splice(eatenIndex, 1);
    else critter.pop();
  }

  function p3_drawTile(i, j) {
    let n = sketch.noise(i * 0.1, j * 0.1);
    sketch.fill(sketch.lerpColor(sketch.color('#d0ffb0'), sketch.color('#4caf50'), n));
    sketch.beginShape();
    sketch.vertex(-tw, 0); sketch.vertex(0, th); sketch.vertex(tw, 0); sketch.vertex(0, -th);
    sketch.endShape(sketch.CLOSE);

    if (trail.some(t => t.i === i && t.j === j)) {
      sketch.fill(255, 250, 240, 60);
      sketch.ellipse(0, 0, 12, 12);
    }

    if (flowers.some(f => f.i === i && f.j === j)) {
      sketch.fill('pink');
      sketch.ellipse(-3, -3, 6); sketch.ellipse(3, -3, 6);
      sketch.ellipse(-3, 3, 6); sketch.ellipse(3, 3, 6);
      sketch.fill('yellow'); sketch.ellipse(0, 0, 5);
    }

    if (mushrooms.some(m => m.i === i && m.j === j)) {
      sketch.fill('brown'); sketch.ellipse(0, -2, 8, 6);
      sketch.fill('tan'); sketch.rect(-1, -2, 2, 6);
    }

    if (obstacles.some(o => o.i === i && o.j === j)) {
      sketch.fill('#444');
      sketch.beginShape();
      sketch.vertex(-tw, 0); sketch.vertex(0, -th - 16); sketch.vertex(tw, 0); sketch.vertex(0, th);
      sketch.endShape(sketch.CLOSE);
      sketch.fill('#222');
      sketch.beginShape();
      sketch.vertex(-tw, 0); sketch.vertex(0, th); sketch.vertex(0, th + 10); sketch.vertex(-tw, 10);
      sketch.endShape(sketch.CLOSE);
      sketch.beginShape();
      sketch.vertex(tw, 0); sketch.vertex(0, th); sketch.vertex(0, th + 10); sketch.vertex(tw, 10);
      sketch.endShape(sketch.CLOSE);
    }

    if (apples.some(a => a.i === i && a.j === j)) {
      sketch.fill('red'); sketch.ellipse(0, -3, 16);
      sketch.fill('green'); sketch.rect(-1, -12, 2, 5, 1);
    }

    for (let index = 0; index < critter.length; index++) {
      let seg = critter[index];
      if (seg.i === i && seg.j === j) {
        sketch.fill(index === 0 ? 'gold' : (index === critter.length - 1 ? '#e0a800' : '#f1c40f'));
        sketch.ellipse(0, 0, 28);

        if (index === 0) {
          let dir = snapToDirectionVector(getCritterDirectionVector());
          let dx = (dir.x - dir.y) * 0.5;
          let dy = (dir.x + dir.y) * 0.25;
          sketch.fill(0);
          sketch.ellipse(-5 + dx * 4, -4 + dy * 4, 4);
          sketch.ellipse(5 + dx * 4, -4 + dy * 4, 4);
          sketch.noFill(); sketch.stroke(0); sketch.strokeWeight(1);
          sketch.arc(0, 4 + dy * 2, 10, 6, 0, sketch.PI);
          sketch.noStroke();
        }
      }
    }
  }

  function getCritterDirectionVector() {
    if (critter.length < 3) return { x: 1, y: 0 };
    let xTotal = 0, yTotal = 0, count = Math.min(5, critter.length - 1);
    for (let i = 0; i < count; i++) {
      let a = critter[i], b = critter[i + 1];
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
    return directions.reduce((closest, d) => {
      let distSq = (dir.x - d.x) ** 2 + (dir.y - d.y) ** 2;
      return distSq < (closest.distSq ?? Infinity) ? { ...d, distSq } : closest;
    });
  }

  function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i + camera_x, j + camera_y];
  }

  function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    let world_x = Math.floor((screen_x / tile_width_step_main + screen_y / tile_height_step_main) / 2);
    let world_y = Math.floor((screen_y / tile_height_step_main - screen_x / tile_width_step_main) / 2);
    return [world_x, world_y];
  }

  function tileRenderingOrder([x, y]) {
    return [x, y];
  }

  function cameraToWorldOffset([x, y]) {
    return {
      x: Math.floor(x / (2 * tile_width_step_main)),
      y: Math.floor(y / (2 * tile_height_step_main))
    };
  }
};

new p5(critterSketch);
