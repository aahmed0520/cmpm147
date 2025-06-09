// sketch.js - purpose and description here
// Author: Your Name
// Date:

// Constants - User-servicable parts
const VALUE1 = 1;
const VALUE2 = 2;

// Globals
let myInstance;
let canvasContainer;
let centerHorz, centerVert;

class MyClass {
  constructor(param1, param2) {
    this.property1 = param1;
    this.property2 = param2;
  }

  myMethod() {
    // code to run when method is called
  }
}

function resizeScreen() {
  const containerRect = canvasContainer[0].getBoundingClientRect();
  const containerWidth = containerRect.width;
  const containerHeight = containerRect.height;

  centerHorz = containerWidth / 2;
  centerVert = containerHeight / 2;

  resizeCanvas(containerWidth, containerHeight);
}

function setup() {
  canvasContainer = $("#canvas-container");
  let canvas = createCanvas(canvasContainer.width(), canvasContainer.height());
  canvas.parent("canvas-container");

  myInstance = new MyClass(VALUE1, VALUE2);

  $(window).resize(function () {
    resizeScreen();
  });

  resizeScreen();
}

function draw() {
  background(220);
  myInstance.myMethod();

  push();
  translate(centerHorz, centerVert);
  rotate(frameCount / 100.0);
  fill(234, 31, 81);
  noStroke();
  rect(-125, -125, 250, 250);
  pop();

  fill(255);
  textStyle(BOLD);
  textSize(140);
  text("p5*", centerHorz - 105, centerVert + 40);
}
