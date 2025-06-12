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
  
  let inspirations = getInspirations();
  
  function preload() {
    for (let insp of inspirations) {
      insp.image = loadImage(insp.assetUrl);
    }
  }
  
  function initDesign(inspiration) {
    resizeCanvas(inspiration.image.width / 4, inspiration.image.height / 4);
  
    let design = {
      name: inspiration.name,
      elements: []
    };
  
    let count = 20;
    if (inspiration.name === "Pokeball") count = 10;
    if (inspiration.name === "Naruto") count = 25;
    if (inspiration.name === "Pikachu") count = 40;
  
    for (let i = 0; i < count; i++) {
      design.elements.push({
        x: random(width),
        y: random(height),
        size: random(10, 40),
        angle: random(TWO_PI),
        shape: random(["circle", "triangle", "square"]),
        fill: {
            r: inspiration.name === "Pikachu" ? 255 : 0,
            g: inspiration.name === "Pikachu" ? 220 : 0,
            b: inspiration.name === "Pikachu" ? 0 : 0
          }
      });
    }
  
    return design;
  }
  
  function renderDesign(design, inspiration) {
    background(255);
    noStroke();
  
    for (let elem of design.elements) {
      push();
      translate(elem.x, elem.y);
      rotate(elem.angle);
      fill(elem.fill.r, elem.fill.g, elem.fill.b);

  
      if (elem.shape === "circle") {
        ellipse(0, 0, elem.size, elem.size);
      } else if (elem.shape === "triangle") {
        triangle(
          -elem.size / 2, elem.size / 2,
          0, -elem.size / 2,
          elem.size / 2, elem.size / 2
        );
      } else if (elem.shape === "square") {
        rectMode(CENTER);
        rect(0, 0, elem.size, elem.size);
      }
  
      pop();
    }
  }
  
  function mutateDesign(design, inspiration, rate) {
    for (let elem of design.elements) {
      elem.x = mut(elem.x, 0, width, rate);
      elem.y = mut(elem.y, 0, height, rate);
      elem.size = mut(elem.size, 10, 100, rate);
      elem.angle = mut(elem.angle, 0, TWO_PI, rate);
  
      // Mutate fill color if Pikachu
      if (inspiration.name === "Pikachu") {
        elem.fill.r = mut(elem.fill.r, 200, 255, rate);
        elem.fill.g = mut(elem.fill.g, 180, 240, rate);
        elem.fill.b = mut(elem.fill.b, 0, 40, rate);
      }
    }
  }
  
  function mut(num, min, max, rate) {
    return constrain(randomGaussian(num, (rate * (max - min)) / 20), min, max);
  }
  