// Instance mode conversion of the City Generator
// Paste into your engine-based portfolio setup

let citySketch = function (sketch) {
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
  
    let tw = 32, th = 16;
  
    sketch.preload = function () {};
  
    sketch.setup = function () {
      let canvasContainer = sketch.select("#canvas-container");
      let canvas = sketch.createCanvas(canvasContainer.width, canvasContainer.height);
      canvas.parent("canvas-container");
  
      camera_offset = sketch.createVector(-sketch.width / 2, sketch.height / 2);
      camera_velocity = sketch.createVector(0, 0);
  
      let input = sketch.select('#world-key-input');
      input.input(() => rebuildWorld(input.value()));
  
      sketch.createP("Arrow keys scroll. Clicking places buildings.").parent("canvas-container");
  
      rebuildWorld(input.value());
  
      $(window).resize(() => resizeScreen());
      resizeScreen();
    };
  
    function rebuildWorld(key) {
      worldSeed = XXH.h32(key, 0);
      sketch.noiseSeed(worldSeed);
      sketch.randomSeed(worldSeed);
  
      tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
      tile_rows = Math.ceil(sketch.height / (tile_height_step_main * 2));
  
      buildingMap.clear();
      mergeQueue = [];
      treeMap.clear();
      lampMap.clear();
  
      for (let i = -100; i <= 100; i++) {
        for (let j = -100; j <= 100; j++) {
          if (!isRoadTile(i, j) && !isSidewalkTile(i, j)) {
            let hash = XXH.h32(`tree:${i},${j}`, worldSeed);
            if (hash % 70 === 0) {
              treeMap.add(`${i},${j}`);
            }
          } else if (isSidewalkTile(i, j) && !isRoadTile(i, j)) {
            let hash = XXH.h32(`lamp:${i},${j}`, worldSeed);
            if (hash % 30 === 0) {
              lampMap.add(`${i},${j}`);
            }
          }
        }
      }
    }
  
    sketch.draw = function () {
      if (sketch.keyIsDown(sketch.LEFT_ARROW)) camera_velocity.x -= 1;
      if (sketch.keyIsDown(sketch.RIGHT_ARROW)) camera_velocity.x += 1;
      if (sketch.keyIsDown(sketch.DOWN_ARROW)) camera_velocity.y -= 1;
      if (sketch.keyIsDown(sketch.UP_ARROW)) camera_velocity.y += 1;
  
      camera_offset.add(camera_velocity);
      camera_velocity.mult(0.95);
      if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);
  
      let world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);
  
      sketch.background(220);
  
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
  
      let mouseWorld = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
      describeMouseTile(mouseWorld, [camera_offset.x, camera_offset.y]);
    };
  
    sketch.mouseClicked = function () {
      let [i, j] = screenToWorld([0 - sketch.mouseX, sketch.mouseY], [camera_offset.x, camera_offset.y]);
      if (isRoadTile(i, j) || isSidewalkTile(i, j) || treeMap.has(`${i},${j}`)) return;
  
      let key = `${i},${j}`;
      if (!buildingMap.has(key)) {
        buildingMap.set(key, 1);
      }
      return false;
    };
  
    function drawTile([i, j], [camera_x, camera_y]) {
      let [screen_x, screen_y] = worldToScreen([i, j], [camera_x, camera_y]);
      sketch.push();
      sketch.translate(0 - screen_x, screen_y);
      p3_drawTile(i, j, sketch);
      sketch.pop();
    }
  
    function describeMouseTile([i, j], [camera_x, camera_y]) {
      let [sx, sy] = worldToScreen([i, j], [camera_x, camera_y]);
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
      sketch.resizeCanvas(canvasContainer.width, canvasContainer.height);
      rebuildWorld(sketch.select("#canvas-container input").value());
    }
  
    // These utility functions assumed to be defined in shared engine:
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
  
  new p5(citySketch);
  