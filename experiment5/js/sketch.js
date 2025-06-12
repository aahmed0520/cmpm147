// sketch.js - Evolutionary Generator Controller
// Author: Your Name
// Date:

/* exported preload, setup, draw */
/* global memory, dropper, restart, rate, slider, activeScore, bestScore, fpsCounter */

let bestDesign;
let currentDesign;
let currentScore;
let currentInspiration;
let currentCanvas;
let currentInspirationPixels;

function preload() {
  let allInspirations = getInspirations();

  for (let i = 0; i < allInspirations.length; i++) {
    let insp = allInspirations[i];
    insp.image = loadImage(insp.assetUrl);
    let option = document.createElement("option");
    option.value = i;
    option.innerHTML = insp.name;
    dropper.appendChild(option);
  }

  dropper.onchange = e => inspirationChanged(allInspirations[e.target.value]);
  currentInspiration = allInspirations[0];

  restart.onclick = () =>
    inspirationChanged(allInspirations[dropper.value]);
}

function inspirationChanged(nextInspiration) {
  currentInspiration = nextInspiration;
  currentDesign = undefined;
  memory.innerHTML = "";
  setup();
}

function setup() {
    // Resize canvas to match the original image size
    let canvasContainer = $('.image-container');
    let canvasWidth = canvasContainer.width();
    let aspectRatio = currentInspiration.image.height / currentInspiration.image.width;
    let canvasHeight = canvasWidth * aspectRatio;
  
    resizeCanvas(canvasWidth, canvasHeight);
    currentCanvas = createCanvas(canvasWidth, canvasHeight);
    currentCanvas.parent(document.getElementById("active"));
  
    // ✨ Set individual image display size per inspiration
    let imageScale = 1.0;
  
    if (currentInspiration.name === "Naruto") {
      imageScale = 0.7;
    } else if (currentInspiration.name === "Pokeball") {
      imageScale = 0.85;
    } else if (currentInspiration.name === "Pikachu") {
      imageScale = 0.9;
    }
  
    const imgHTML = `<img src="${currentInspiration.assetUrl}" style="width:${canvasWidth * imageScale}px;">`;
    $('#original').empty();
    $('#original').append(imgHTML);
  
    $(".caption").text(currentInspiration.credit);
  
    currentScore = Number.NEGATIVE_INFINITY;
    currentDesign = initDesign(currentInspiration);
    bestDesign = currentDesign;
  
    image(currentInspiration.image, 0, 0, width, height);
    loadPixels();
    currentInspirationPixels = pixels;
  }
  
  

function evaluate() {
  loadPixels();

  let error = 0;
  let n = pixels.length;

  for (let i = 0; i < n; i++) {
    error += sq(pixels[i] - currentInspirationPixels[i]);
  }

  return 1 / (1 + error / n);
}

function memorialize() {
  let url = currentCanvas.canvas.toDataURL();

  let img = document.createElement("img");
  img.classList.add("memory");
  img.src = url;
  img.width = width;
  img.height = height;
  img.title = currentScore;

  // Update best image slot
  document.getElementById("best").innerHTML = "";
  document.getElementById("best").appendChild(img.cloneNode());

  // Also add to memory history
  img.width = width / 2;
  img.height = height / 2;
  memory.insertBefore(img, memory.firstChild);

  if (memory.childNodes.length > memory.dataset.maxItems) {
    memory.removeChild(memory.lastChild);
  }
}

let mutationCount = 0;

function draw() {
  if (!currentDesign) return;

  randomSeed(mutationCount++);
  currentDesign = JSON.parse(JSON.stringify(bestDesign));

  rate.innerHTML = slider.value;
  mutateDesign(currentDesign, currentInspiration, slider.value / 100.0);

  randomSeed(0);
  renderDesign(currentDesign, currentInspiration);

  let nextScore = evaluate();
  activeScore.innerHTML = nextScore;

  if (nextScore > currentScore) {
    currentScore = nextScore;
    bestDesign = currentDesign;
    memorialize();
    bestScore.innerHTML = currentScore;
  }

  fpsCounter.innerHTML = Math.round(frameRate());
}
