new p5(() => {
    "use strict";
  
    /* global XXH */
  
    let worldSeed;
    let critter = [];
    let apples = [];
    let obstacles = [];
    let flowers = [];
    let mushrooms = [];
    let trail = [];
    let lastMoveTime = 0;
    let moveInterval = 500;
    let [tw, th] = [32, 16];
  
    window.p3_preload = () => {};
    window.p3_setup = () => {
      textFont("monospace", 16);
      textAlign(LEFT, TOP);
    };
    window.p3_tileWidth = () => tw;
    window.p3_tileHeight = () => th;
  
    window.p3_worldKeyChanged = (key) => {
      worldSeed = XXH.h32(key, 0);
      noiseSeed(worldSeed);
      randomSeed(worldSeed);
  
      let startX = Math.floor(random(-5, 5));
      let startY = Math.floor(random(-5, 5));
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
            let r = random();
            if (r < 0.04) obstacles.push({ i: x, j: y });
            else if (r < 0.09) flowers.push({ i: x, j: y });
            else if (r < 0.12) mushrooms.push({ i: x, j: y });
          }
        }
      }
  
      lastMoveTime = millis();
    };
  
    window.p3_tileClicked = (i, j) => {
      apples.push({ i, j });
    };
  
    window.p3_drawBefore = () => {
      if (millis() - lastMoveTime > moveInterval) {
        lastMoveTime = millis();
  
        let head = critter[0];
        let second = critter[1];
        let next = { i: head.i, j: head.j };
  
        let target = apples.length > 0
          ? apples.reduce((a, b) => dist(head.i, head.j, a.i, a.j) < dist(head.i, head.j, b.i, b.j) ? a : b)
          : null;
  
        if (target) {
          let options = [
            { i: head.i + 1, j: head.j },
            { i: head.i - 1, j: head.j },
            { i: head.i, j: head.j + 1 },
            { i: head.i, j: head.j - 1 }
          ];
  
          options = options.filter(o =>
            !(second && o.i === second.i && o.j === second.j) &&
            !obstacles.some(ob => ob.i === o.i && ob.j === o.j)
          );
  
          options.sort((a, b) =>
            dist(a.i, a.j, target.i, target.j) - dist(b.i, b.j, target.i, target.j)
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
    };
  
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
        let dx = dir.x - d.x, dy = dir.y - d.y;
        let distSq = dx * dx + dy * dy;
        return distSq < closest.distSq ? { vec: d, distSq } : closest;
      }, { vec: directions[0], distSq: Infinity }).vec;
    }
  
    window.p3_drawTile = (i, j) => {
      noStroke();
      fill(lerpColor(color('#d0ffb0'), color('#4caf50'), noise(i * 0.1, j * 0.1)));
  
      push();
      beginShape();
      vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th);
      endShape(CLOSE);
  
      if (trail.some(t => t.i === i && t.j === j)) {
        fill(255, 250, 240, 60);
        ellipse(0, 0, 12, 12);
      }
  
      if (flowers.some(f => f.i === i && f.j === j)) {
        fill('pink');
        ellipse(-3, -3, 6, 6); ellipse(3, -3, 6, 6);
        ellipse(-3, 3, 6, 6); ellipse(3, 3, 6, 6);
        fill('yellow'); ellipse(0, 0, 5, 5);
      }
  
      if (mushrooms.some(m => m.i === i && m.j === j)) {
        fill('brown'); ellipse(0, -2, 8, 6);
        fill('tan'); rect(-1, -2, 2, 6);
      }
  
      if (obstacles.some(o => o.i === i && o.j === j)) {
        fill('#444');
        beginShape(); vertex(-tw, 0); vertex(0, -th - 16); vertex(tw, 0); vertex(0, th); endShape(CLOSE);
        fill('#222');
        beginShape(); vertex(-tw, 0); vertex(0, th); vertex(0, th + 10); vertex(-tw, 10); endShape(CLOSE);
        beginShape(); vertex(tw, 0); vertex(0, th); vertex(0, th + 10); vertex(tw, 10); endShape(CLOSE);
      }
  
      if (apples.some(a => a.i === i && a.j === j)) {
        fill('red'); ellipse(0, -3, 16, 16);
        fill('green'); rect(-1, -12, 2, 5, 1);
      }
  
      for (let index = 0; index < critter.length; index++) {
        let seg = critter[index];
        if (seg.i === i && seg.j === j) {
          fill(index === 0 ? 'gold' : (index === critter.length - 1 ? '#e0a800' : '#f1c40f'));
          ellipse(0, 0, 28, 28);
  
          if (index === 0) {
            let dir = snapToDirectionVector(getCritterDirectionVector());
            let dx = (dir.x - dir.y) * 0.5;
            let dy = (dir.x + dir.y) * 0.25;
  
            fill(0);
            ellipse(-5 + dx * 4, -4 + dy * 4, 4, 4);
            ellipse(5 + dx * 4, -4 + dy * 4, 4, 4);
  
            noFill(); stroke(0); strokeWeight(1);
            arc(0, 4 + dy * 2, 10, 6, 0, PI);
            noStroke();
          }
        }
      }
  
      pop();
    };
  
    window.p3_drawSelectedTile = (i, j) => {
      noFill(); stroke(0, 255, 0, 128);
      beginShape();
      vertex(-tw, 0); vertex(0, th); vertex(tw, 0); vertex(0, -th);
      endShape(CLOSE);
    };
  
    window.p3_drawAfter = () => {
      noCursor();
      fill(0); noStroke(); textSize(16);
      text(critter.length, mouseX, mouseY);
    };
  }, "canvas-container");
  