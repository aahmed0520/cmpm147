// sketch_desert.js
"use strict";

window.addEventListener("load", () => {
  new p5((sketch) => {
    /* global XXH */

    window.p3_preload = function () {};

    window.p3_setup = function () {};

    window.p3_tileWidth = () => 32;
    window.p3_tileHeight = () => 16;

    let [tw, th] = [window.p3_tileWidth(), window.p3_tileHeight()];
    let worldSeed;
    let clicks = {};

    window.p3_worldKeyChanged = function (key) {
      worldSeed = XXH.h32(key, 0);
      sketch.noiseSeed(worldSeed);
      sketch.randomSeed(worldSeed);
      console.log("Seed set:", key);

    };

    window.p3_tileClicked = function (i, j) {
      let key = [i, j];
      clicks[key] = sketch.millis(); // store time of click
    };

    window.p3_drawBefore = function () {};

    window.p3_drawTile = function (i, j) {
      console.log("Drawing tile:", i, j);

      let n = sketch.noise(i * 0.1, j * 0.1);
      let rockColor = sketch.color('#8AAAB2');
      let dustColor = sketch.color('#CFCFC6');
      let rustColor = sketch.color('#B86D46');
      let duneColor = sketch.color('#6B3E2E');

      if (n < 0.35) sketch.fill(dustColor);
      else if (n < 0.55) sketch.fill(rustColor);
      else if (n < 0.75) sketch.fill(rockColor);
      else sketch.fill(duneColor);

      sketch.push();

      let h = (sketch.noise(i * 0.15 + 100, j * 0.15 + 100) - 0.5) * 12;
      let top = (sketch.noise(i + 1, j + 1) - 0.5) * 10;
      let right = (sketch.noise(i + 2, j) - 0.5) * 10;
      let bottom = (sketch.noise(i - 1, j - 2) - 0.5) * 10;
      let left = (sketch.noise(i, j + 3) - 0.5) * 10;

      // Shadow
      sketch.push();
      sketch.noStroke();
      sketch.fill(0, 0, 0, 40);
      sketch.beginShape();
      sketch.vertex(-tw + 2, 0 + left + h + 4);
      sketch.vertex(0 + 2, th + bottom + h + 4);
      sketch.vertex(tw + 2, 0 + right + h + 4);
      sketch.vertex(0 + 2, -th + top + h + 4);
      sketch.endShape(sketch.CLOSE);
      sketch.pop();

      // Main shape
      sketch.noStroke();
      sketch.beginShape();
      sketch.vertex(-tw, 0 + left + h);
      sketch.vertex(0, th + bottom + h);
      sketch.vertex(tw, 0 + right + h);
      sketch.vertex(0, -th + top + h);
      sketch.endShape(sketch.CLOSE);

      // Dune ripple animation
      if (n >= 0.75) {
        sketch.stroke(60, 30, 20, 180);
        sketch.strokeWeight(1);
        sketch.noFill();
        let t = sketch.millis() * 0.0002;

        for (let r = -th + 4; r < th - 4; r += 6) {
          sketch.beginShape();
          for (let x = -tw + 2; x <= tw - 2; x += 4) {
            let wave = sketch.sin((i + x) * 0.3 + (j + r) * 0.2 + t) * 2;
            let y = r + wave;
            sketch.curveVertex(x, y + h);
          }
          sketch.endShape();
        }
      }

      // Rock cracks
      if (n >= 0.55 && n < 0.75) {
        sketch.stroke(30, 30, 30, 80);
        sketch.strokeWeight(0.5);
        sketch.randomSeed(XXH.h32("crack:" + [i, j], worldSeed));
        for (let k = 0; k < 2; k++) {
          let x1 = sketch.random(-tw * 0.8, tw * 0.8);
          let y1 = sketch.random(-th, th);
          let x2 = x1 + sketch.random(-5, 5);
          let y2 = y1 + sketch.random(-5, 5);
          sketch.line(x1, y1 + h, x2, y2 + h);
        }
      }

      // Click glow
      let t = clicks[[i, j]];
      if (t !== undefined) {
        let pulse = sketch.sin((sketch.millis() - t) / 300.0) * 5 + 7;
        sketch.fill(200, 255, 255, 180);
        sketch.ellipse(0, 0 + h, pulse, pulse / 2);
      }

      sketch.pop();
    };

    window.p3_drawSelectedTile = function (i, j) {
      sketch.noFill();
      sketch.stroke(0, 255, 0, 128);
      sketch.beginShape();
      sketch.vertex(-tw, 0);
      sketch.vertex(0, th);
      sketch.vertex(tw, 0);
      sketch.vertex(0, -th);
      sketch.endShape(sketch.CLOSE);
      sketch.noStroke();
      sketch.fill(0);
      sketch.text("tile " + [i, j], 0, 0);
    };

    window.p3_drawAfter = function () {};
  }, "canvas-container");
});
