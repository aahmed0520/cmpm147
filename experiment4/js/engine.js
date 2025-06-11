"use strict";


/* global p5 */

// Project base code provided by {amsmith,ikarth}@ucsc.edu
console.log("engine.js loaded");


window.engineSketch = function (sketch) {
  console.log("engineSketch executing");

  let tile_width_step_main;
  let tile_height_step_main;
  let tile_rows, tile_columns;
  let camera_offset;
  let camera_velocity;

  function worldToScreen([world_x, world_y], [camera_x, camera_y]) {
    let i = (world_x - world_y) * tile_width_step_main;
    let j = (world_x + world_y) * tile_height_step_main;
    return [i + camera_x, j + camera_y];
  }

  function tileRenderingOrder(offset) {
    return [offset[1] - offset[0], offset[0] + offset[1]];
  }

  function screenToWorld([screen_x, screen_y], [camera_x, camera_y]) {
    screen_x -= camera_x;
    screen_y -= camera_y;
    screen_x /= tile_width_step_main * 2;
    screen_y /= tile_height_step_main * 2;
    screen_y += 0.5;
    return [Math.floor(screen_y + screen_x), Math.floor(screen_y - screen_x)];
  }

  function cameraToWorldOffset([camera_x, camera_y]) {
    let world_x = camera_x / (tile_width_step_main * 2);
    let world_y = camera_y / (tile_height_step_main * 2);
    return { x: Math.round(world_x), y: Math.round(world_y) };
  }

  function rebuildWorld(key) {
    if (window.p3_worldKeyChanged) {
      window.p3_worldKeyChanged(key);
    }
    tile_width_step_main = window.p3_tileWidth ? window.p3_tileWidth() : 32;
    tile_height_step_main = window.p3_tileHeight ? window.p3_tileHeight() : 14.5;
    tile_columns = Math.ceil(sketch.width / (tile_width_step_main * 2));
    tile_rows = Math.ceil(sketch.height / (tile_height_step_main * 2));
  }

  sketch.preload = () => {
    if (window.p3_preload) window.p3_preload();
  };

  sketch.setup = () => {
    sketch.createCanvas(800, 400);

    camera_offset = sketch.createVector(-sketch.width / 2, sketch.height / 2);
    camera_velocity = sketch.createVector(0, 0);

    if (window.p3_setup) window.p3_setup();

    const label = sketch.createP("World key: ");
    label.parent("container");

    const input = sketch.createInput("xyzzy");
    input.parent(label);
    input.input(() => rebuildWorld(input.value()));

    sketch.createP("Arrow keys scroll. Clicking changes tiles.").parent("container");

    rebuildWorld(input.value());
  };

  sketch.draw = () => {
    if (sketch.keyIsDown(sketch.LEFT_ARROW)) camera_velocity.x -= 1;
    if (sketch.keyIsDown(sketch.RIGHT_ARROW)) camera_velocity.x += 1;
    if (sketch.keyIsDown(sketch.DOWN_ARROW)) camera_velocity.y -= 1;
    if (sketch.keyIsDown(sketch.UP_ARROW)) camera_velocity.y += 1;

    camera_offset.add(camera_velocity);
    camera_velocity.mult(0.95);
    if (camera_velocity.mag() < 0.01) camera_velocity.setMag(0);

    const world_pos = screenToWorld([
      0 - sketch.mouseX,
      sketch.mouseY
    ], [camera_offset.x, camera_offset.y]);

    const world_offset = cameraToWorldOffset([camera_offset.x, camera_offset.y]);

    sketch.background(100);
    if (window.p3_drawBefore) window.p3_drawBefore();

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

    describeMouseTile(world_pos, [camera_offset.x, camera_offset.y]);
    if (window.p3_drawAfter) window.p3_drawAfter();
  };

  sketch.mouseClicked = () => {
    const world_pos = screenToWorld([
      0 - sketch.mouseX,
      sketch.mouseY
    ], [camera_offset.x, camera_offset.y]);
    if (window.p3_tileClicked) window.p3_tileClicked(world_pos[0], world_pos[1]);
    return false;
  };

  function describeMouseTile([world_x, world_y], [camera_x, camera_y]) {
    const [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
    drawTileDescription([world_x, world_y], [0 - screen_x, screen_y]);
  }

  function drawTileDescription([world_x, world_y], [screen_x, screen_y]) {
    sketch.push();
    sketch.translate(screen_x, screen_y);
    if (window.p3_drawSelectedTile) {
      window.p3_drawSelectedTile(world_x, world_y, screen_x, screen_y);
    }
    sketch.pop();
  }

  function drawTile([world_x, world_y], [camera_x, camera_y]) {
    const [screen_x, screen_y] = worldToScreen([world_x, world_y], [camera_x, camera_y]);
    sketch.push();
    sketch.translate(0 - screen_x, screen_y);
    if (window.p3_drawTile) {
      window.p3_drawTile(world_x, world_y, -screen_x, screen_y);
    }
    sketch.pop();
  }
};
