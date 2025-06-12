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
  
    let count = 40;
  
    for (let i = 0; i < count; i++) {
      let x = random(width);
      let y = random(height);
      let size = random(10, 40);
      let angle = random(TWO_PI);
      let shape = random(["triangle", "square"]);
      let fill = { r: 0, g: 0, b: 0 };
  
      if (inspiration.name === "Pikachu") {
        fill = { r: 255, g: 220, b: 0 };
  
      } else if (inspiration.name === "Pokeball") {
        if (y < height / 2 - 10) {
          fill = { r: 230, g: 0, b: 0 }; // red
        } else if (y > height / 2 + 10) {
          fill = { r: 255, g: 255, b: 255 }; // white
        } else {
          fill = { r: 20, g: 20, b: 20 }; // black band
          shape = "square";
          size = random(10, 30);
        }
  
      } else if (inspiration.name === "Naruto") {
        // Naruto colors only
        let palette = [
          { r: 255, g: 140, b: 0 },   // orange
          { r: 20, g: 20, b: 20 },    // black
          { r: 240, g: 200, b: 160 }, // skin
          { r: 255, g: 225, b: 0 }    // yellow hair
        ];
        fill = random(palette);
  
        // Focused center layout
        x = random(width * 0.3, width * 0.7);
        y = random(height * 0.2, height * 0.9);
        shape = random(["square", "triangle"]);
      }
  
      design.elements.push({ x, y, size, angle, shape, fill });
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
  
      if (inspiration.name === "Pikachu") {
        elem.fill.r = mut(elem.fill.r, 200, 255, rate);
        elem.fill.g = mut(elem.fill.g, 180, 240, rate);
        elem.fill.b = mut(elem.fill.b, 0, 40, rate);
      }
  
      if (inspiration.name === "Pokeball") {
        let y = elem.y;
        if (y < height / 2 - 10) {
          elem.fill.r = mut(elem.fill.r, 200, 255, rate);
          elem.fill.g = mut(elem.fill.g, 0, 50, rate);
          elem.fill.b = mut(elem.fill.b, 0, 50, rate);
        } else if (y > height / 2 + 10) {
          elem.fill.r = mut(elem.fill.r, 240, 255, rate);
          elem.fill.g = mut(elem.fill.g, 240, 255, rate);
          elem.fill.b = mut(elem.fill.b, 240, 255, rate);
        } else {
          elem.fill.r = mut(elem.fill.r, 0, 50, rate);
          elem.fill.g = mut(elem.fill.g, 0, 50, rate);
          elem.fill.b = mut(elem.fill.b, 0, 50, rate);
        }
      }
  
      if (inspiration.name === "Naruto") {
        // Keep colors close to palette tones
        elem.fill.r = mut(elem.fill.r, 20, 255, rate * 0.6);
        elem.fill.g = mut(elem.fill.g, 20, 225, rate * 0.6);
        elem.fill.b = mut(elem.fill.b, 0, 180, rate * 0.6);
  
        // Keep form centered
        elem.x = mut(elem.x, width * 0.3, width * 0.7, rate);
        elem.y = mut(elem.y, height * 0.2, height * 0.9, rate);
      }
    }
  }
  
  function mut(num, min, max, rate) {
    return constrain(randomGaussian(num, (rate * (max - min)) / 20), min, max);
  }
  