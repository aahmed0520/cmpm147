const fillers = {
  planetName: ["Glorvax-9", "Zentha Prime", "Orbital Drift Delta", "Xeelee's Cradle"],
  attraction: ["floating lava gardens", "zero-gravity coral reefs", "time-loop markets", "bioluminescent ice caves", "gravity-inverted jungles"],
  worldType: ["crystal-based hive world", "sentient oceanic planet", "bioluminescent gas world", "modular asteroid habitat"],
  creature: ["singing crystal crabs", "hyperintelligent fungi", "three-eyed space lemurs", "orb-weaving data spiders"],
  transport: ["telekinetic gondola", "hover-ferry", "biopod taxi", "thought-propelled scooter"],
  landmark: ["Temple of Ten Thousand Screams", "Hollow Moon Observatory", "Whispering Nebula Spa", "Skybones Cathedral"],
  event: ["quantum fire opera", "telepathy slam poetry", "plasma-surfing ritual", "chronowarp symphony"],
  souvenir: ["transdimensional pollen", "fractal coin", "liquid magnet souvenir", "glowing antimatter trinket"]
};

const template = `
Welcome to $planetName!

Experience the $attraction of this $worldType, home to the $creature.

Our local guides will escort you via $transport to the $landmark, where you can witness a live $event.

Book now and receive a free vial of $souvenir!
`;

const slotPattern = /\$(\w+)/;

function replacer(match, name) {
  let options = fillers[name];
  if (options) {
    return options[Math.floor(Math.random() * options.length)];
  } else {
    return `<UNKNOWN:${name}>`;
  }
}

function generate() {
  let story = template;
  while (story.match(slotPattern)) {
    story = story.replace(slotPattern, replacer);
  }

  // Use jQuery to update the HTML on your portfolio site
  $("#box").text(story);
}

function main() {
  $("#clicker").click(generate);
  generate(); // run once on page load
}

// Start the generator
main();