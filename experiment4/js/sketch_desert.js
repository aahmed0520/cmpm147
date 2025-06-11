new p5(() => {
    "use strict";
  
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
      noiseSeed(worldSeed);
      randomSeed(worldSeed);
    };
  
    window.p3_tileClicked = function (i, j) {
      let key = [i, j];
      clicks[key] = millis(); // store time of click
    };
  
    window.p3_drawBefore = function () {};
  
    window.p3_drawTile = function (i, j) {
      let n = noise(i * 0.1, j * 0.1);
      let rockColor = color('#8AAAB2');
      let dustColor = color('#CFCFC6');
      let rustColor = color('#B86D46');
      let duneColor = color('#6B3E2E');
  
      if (n < 0.35) fill(dustColor);
      else if (n < 0.55) fill(rustColor);
      else if (n < 0.75) fill(rockColor);
      else fill(duneColor);
  
      push();
  
      let h = (noise(i * 0.15 + 100, j * 0.15 + 100) - 0.5) * 12;
      let top = (noise(i + 1, j + 1) - 0.5) * 10;
      let right = (noise(i + 2, j) - 0.5) * 10;
      let bottom = (noise(i - 1, j - 2) - 0.5) * 10;
      let left = (noise(i, j + 3) - 0.5) * 10;
  
      // Shadow
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
  
      // Main shape
      noStroke();
      beginShape();
      vertex(-tw, 0 + left + h);
      vertex(0, th + bottom + h);
      vertex(tw, 0 + right + h);
      vertex(0, -th + top + h);
      endShape(CLOSE);
  
      // Dune ripple animation
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
  
      // Rock cracks
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
  
      // Click glow
      let t = clicks[[i, j]];
      if (t !== undefined) {
        let pulse = sin((millis() - t) / 300.0) * 5 + 7;
        fill(200, 255, 255, 180);
        ellipse(0, 0 + h, pulse, pulse / 2);
      }
  
      pop();
    };
  
    window.p3_drawSelectedTile = function (i, j) {
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
    };
  
    window.p3_drawAfter = function () {};
  }, "canvas-container");
  