new p5(() =>{
    "use strict";

    /* global XXH */
    /* exported --
        p3_preload
        p3_setup
        p3_worldKeyChanged
        p3_tileWidth
        p3_tileHeight
        p3_tileClicked
        p3_drawBefore
        p3_drawTile
        p3_drawSelectedTile
        p3_drawAfter
    */

    let critter = []; // list of segments: each {i, j}
    let apples = [];  // list of {i, j}
    let obstacles = []; // list of {i, j}
    let flowers = [];   // list of {i, j}
    let mushrooms = []; // list of {i, j}
    let trail = [];     // list of previous head positions
    let lastMoveTime = 0;
    let moveInterval = 500; // in milliseconds

    function p3_preload() {}

    function p3_setup() {
    textFont("monospace", 16);
    textAlign(LEFT, TOP);
    }

    let worldSeed;

    function p3_worldKeyChanged(key) {
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
            if (random() < 0.04) {
            obstacles.push({ i: x, j: y });
            } else if (random() < 0.05) {
            flowers.push({ i: x, j: y });
            } else if (random() < 0.03) {
            mushrooms.push({ i: x, j: y });
            }
        }
        }
    }

    lastMoveTime = millis();
    }

    function p3_tileWidth() {
    return 32;
    }
    function p3_tileHeight() {
    return 16;
    }

    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

    let clicks = {};

    function p3_tileClicked(i, j) {
    apples.push({ i, j });
    }

    function p3_drawBefore() {
    if (millis() - lastMoveTime > moveInterval) {
        lastMoveTime = millis();

        let head = critter[0];
        let second = critter[1];
        let next = { i: head.i, j: head.j };

        let target = null;
        if (apples.length > 0) {
        target = apples.reduce((a, b) =>
            dist(head.i, head.j, a.i, a.j) < dist(head.i, head.j, b.i, b.j) ? a : b
        );

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

        options.sort((a, b) => dist(a.i, a.j, target.i, target.j) - dist(b.i, b.j, target.i, target.j));
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
        if (eatenIndex !== -1) {
        apples.splice(eatenIndex, 1);
        } else {
        critter.pop();
        }
    }
    }

    function getCritterDirectionVector() {
    if (critter.length < 3) return { x: 1, y: 0 };

    let xTotal = 0;
    let yTotal = 0;
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
        let dx = dir.x - d.x;
        let dy = dir.y - d.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < bestDist) {
        bestDist = distSq;
        closest = d;
        }
    }

    return closest;
    }

    function p3_drawTile(i, j) {
    noStroke();

    let n = noise(i * 0.1, j * 0.1);
    fill(lerpColor(color('#d0ffb0'), color('#4caf50'), n));
    let [tw, th] = [p3_tileWidth(), p3_tileHeight()];
    push();
    beginShape();
    vertex(-tw, 0);
    vertex(0, th);
    vertex(tw, 0);
    vertex(0, -th);
    endShape(CLOSE);

    // Trail
    if (trail.some(t => t.i === i && t.j === j)) {
        fill(255, 250, 240, 60); // Off-white trail
        ellipse(0, 0, 12, 12);
    }

    if (flowers.some(f => f.i === i && f.j === j)) {
        fill('pink');
        ellipse(-3, -3, 6, 6);
        ellipse(3, -3, 6, 6);
        ellipse(-3, 3, 6, 6);
        ellipse(3, 3, 6, 6);
        fill('yellow');
        ellipse(0, 0, 5, 5);
    }

    if (mushrooms.some(m => m.i === i && m.j === j)) {
        fill('brown');
        ellipse(0, -2, 8, 6);
        fill('tan');
        rect(-1, -2, 2, 6);
    }

    if (obstacles.some(o => o.i === i && o.j === j)) {
        fill('#444');
        beginShape();
        vertex(-tw, 0);
        vertex(0, -th - 16);
        vertex(tw, 0);
        vertex(0, th);
        endShape(CLOSE);

        fill('#222');
        beginShape();
        vertex(-tw, 0);
        vertex(0, th);
        vertex(0, th + 10);
        vertex(-tw, 10);
        endShape(CLOSE);

        beginShape();
        vertex(tw, 0);
        vertex(0, th);
        vertex(0, th + 10);
        vertex(tw, 10);
        endShape(CLOSE);
    }

    if (apples.some(a => a.i === i && a.j === j)) {
        fill('red');
        ellipse(0, -3, 16, 16);
        fill('green');
        rect(-1, -12, 2, 5, 1);
    }

    for (let index = 0; index < critter.length; index++) {
        let seg = critter[index];
        if (seg.i === i && seg.j === j) {
        fill(index === 0 ? 'gold' : (index === critter.length - 1 ? '#e0a800' : '#f1c40f'));
        ellipse(0, 0, 28, 28);

        if (index === 0) {
            let dir = getCritterDirectionVector();
            dir = snapToDirectionVector(dir);
            let dx = (dir.x - dir.y) * 0.5;
            let dy = (dir.x + dir.y) * 0.25;
            let angle = atan2(-dir.y, dir.x);

            if (angle < radians(60) || angle > radians(120)) {
            fill(0);
            ellipse(-5 + dx * 4, -4 + dy * 4, 4, 4);
            ellipse(5 + dx * 4, -4 + dy * 4, 4, 4);

            noFill();
            stroke(0);
            strokeWeight(1);
            arc(0, 4 + dy * 2, 10, 6, 0, PI);
            noStroke();
            }
        }
        }
    }

    pop();
    }

    function p3_drawSelectedTile(i, j) {
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
    }

    function p3_drawAfter() {
    noCursor();
    fill(0);
    noStroke();
    textSize(16);
    text(critter.length, mouseX , mouseY ); // Draws length near mouse
    }

}, "canvas-container");