let inspirations = getInspirations();

function preload() {
  for (let insp of inspirations) {
    insp.image = loadImage(insp.assetUrl);
  }
}

function getInspirations() {
  return [
    {
      name: "Pokeball",
      assetUrl: "img/pokeball.webp",
      credit: "Pokémon"
    },
    {
      name: "Naruto",
      assetUrl: "img/Naruto.jpg",
      credit: "Masashi Kishimoto"
    },
    {
      name: "Pikachu",
      assetUrl: "img/pikachu.jpg.svg",
      credit: "Pokémon"
    }
  ];
}

function initDesign(inspiration) {
  resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);

  let design = {
    name: inspiration.name,
    elements: []
  };

  if (inspiration.name === "Pokeball") {
    design.shape = "circle";
    design.count = 10;
  } else if (inspiration.name === "Naruto") {
    design.shape = "line";
    design.count = 20;
  } else if (inspiration.name === "Pikachu") {
    design.shape = "triangle";
    design.count = 15;
  }

  for (let i = 0; i < design.count; i++) {
    design.elements.push({
      x: random(width),
      y: random(height),
      size: random(10, 50),
      angle: random(TWO_PI)
    });
  }

  return design;
}

function renderDesign(design, inspiration) {
  background(255);
  noStroke();
  fill(0);

  for (let elem of design.elements) {
    push();
    translate(elem.x, elem.y);
    rotate(elem.angle);

    if (design.shape === "circle") {
      ellipse(0, 0, elem.size, elem.size);
    } else if (design.shape === "line") {
      stroke(0);
      line(-elem.size / 2, 0, elem.size / 2, 0);
      noStroke();
    } else if (design.shape === "triangle") {
      triangle(
        -elem.size / 2, elem.size / 2,
        0, -elem.size / 2,
        elem.size / 2, elem.size / 2
      );
    }

    pop();
  }
  function mutateDesign(design, inspiration, rate) {
    // rate is from 0.01 to 1.0 (slider)
    let mutationAmount = rate / 100;
  
    for (let elem of design.elements) {
      // Slightly move positions
      elem.x = mut(elem.x, 0, width, mutationAmount);
      elem.y = mut(elem.y, 0, height, mutationAmount);
  
      // Slightly change size
      elem.size = mut(elem.size, 10, 100, mutationAmount);
  
      // Slightly change angle
      elem.angle = mut(elem.angle, 0, TWO_PI, mutationAmount);
    }
  }
  
  // Gaussian mutation helper
  function mut(num, min, max, rate) {
    return constrain(randomGaussian(num, (rate * (max - min)) / 20), min, max);
  }
}
