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

function p3_preload() {}

function p3_setup() {
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  textFont("monospace", 12);
}

let worldSeed;
let buildingMap = new Map();
let mergeQueue = []; // stores [{ key1, key2, level, timestamp }]
let treeMap = new Set();
let lampMap = new Set();

function p3_worldKeyChanged(key) {
  worldSeed = XXH.h32(key, 0);
  noiseSeed(worldSeed);
  randomSeed(worldSeed);
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

function p3_tileWidth() {
  return 32;
}
function p3_tileHeight() {
  return 16;
}

let [tw, th] = [p3_tileWidth(), p3_tileHeight()];

function p3_tileClicked(i, j) {
  if (isRoadTile(i, j) || isSidewalkTile(i, j) || treeMap.has(`${i},${j}`)) return;

  let key = `${i},${j}`;
  if (!buildingMap.has(key)) {
    buildingMap.set(key, 1);
  }
}

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
      let pairKey = `${x},${y}`;
      let now = millis();

      mergeQueue.push({ key1: key, key2: pairKey, level, timestamp: now + 1000 });
      merged.add(key);
      merged.add(pairKey);
    }
  }
}

function processMergeQueue() {
  let now = millis();
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
  return [
    [i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]
  ].some(([x, y]) => isRoadTile(x, y));
}

function p3_drawBefore() {
  combineBuildings();
  processMergeQueue();
}

function p3_drawTile(i, j) {
  noStroke();

  let isRoad = isRoadTile(i, j);
  let isSidewalk = isSidewalkTile(i, j);
  let tileColor;

  if (isRoad) {
    tileColor = color(90);
  } else if (isSidewalk) {
    tileColor = color(160);
  } else {
    let n = noise(i * 0.1, j * 0.1);
    tileColor = lerpColor(color('#b8e994'), color('#38ada9'), n);
  }
  fill(tileColor);

  push();
  beginShape();
  vertex(-tw, 0);
  vertex(0, th);
  vertex(tw, 0);
  vertex(0, -th);
  endShape(CLOSE);

  let key = `${i},${j}`;
  if (treeMap.has(key)) {
    drawTree();
  }
  if (lampMap.has(key)) {
    drawLampPost();
  }
  if (buildingMap.has(key)) {
    let level = buildingMap.get(key);
    drawBuilding(level);
  }
  pop();
}

function drawTree() {
  fill(80, 50, 20);
  rect(0, 24, 8, 64);
  fill(30, 150, 50);
  ellipse(0, -16, 50, 50);
}

function drawLampPost() {
  fill(60);
  rect(0, -10, 2, 20);
  fill(255, 240, 100);
  ellipse(0, -20, 6, 6);
}

function drawBuilding(level) {
  const baseColor = [
    "#8b4513", "#a0522d", "#cd853f", "#deb887",
    "#cdaa7d", "#d2b48c", "#f5deb3"
  ];
  const shadowColor = [
    "#5a3220", "#6b3e29", "#875e40", "#a07a4e",
    "#927350", "#a88d6e", "#cabfa3"
  ];

  level = constrain(level, 1, 7);
  const wallHeight = 20;

  for (let i = 0; i < level; i++) {
    fill(shadowColor[level - 1]);
    quad(-tw, 0, 0, th, 0, th - wallHeight, -tw, -wallHeight);

    fill(baseColor[level - 1]);
    quad(tw, 0, 0, th, 0, th - wallHeight, tw, -wallHeight);

    translate(0, -wallHeight);
  }

  fill(lerpColor(color(baseColor[level - 1]), color("white"), 0.3));
  beginShape();
  vertex(-tw, 0);
  vertex(0, -th);
  vertex(tw, 0);
  vertex(0, th);
  endShape(CLOSE);
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
  text("tile " + [i, j], 0, 0);
}

function p3_drawAfter() {}
