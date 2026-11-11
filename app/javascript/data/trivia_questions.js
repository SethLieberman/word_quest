export const ROUND_LENGTH = 10
export const GRADES = [1, 2, 3, 4, 5]

// Each row has a category, question, correct answer, three distractors, hint, and explanation.
const BANKS = {
  1: [
    ["Animals", "Which animal says meow?", "Cat", "Dog", "Cow", "Duck", "Think of a pet with whiskers.", "Cats communicate with sounds including meows."],
    ["Nature", "Which part of a plant usually grows under the ground?", "Roots", "Flowers", "Leaves", "Fruit", "This part takes in water from the soil.", "Roots anchor a plant and take in water and nutrients."],
    ["Science", "Which body part helps us hear?", "Ears", "Eyes", "Knees", "Toes", "Think about listening to music.", "Our ears help us hear sounds."],
    ["Shapes", "How many sides does a triangle have?", "Three", "Two", "Four", "Five", "Count the sides of a shape with three corners.", "A triangle has three straight sides."],
    ["Language", "Which word rhymes with cat?", "Hat", "Dog", "Sun", "Pen", "Listen for the same ending sound.", "Cat and hat both end with the at sound."],
    ["Everyday life", "What do we use to tell the time?", "Clock", "Spoon", "Pillow", "Comb", "It may have hands or show numbers.", "A clock shows the time."],
    ["Animals", "Which animal has feathers?", "Chicken", "Rabbit", "Horse", "Frog", "Look for a bird.", "Chickens are birds, and birds have feathers."],
    ["Nature", "Which object gives Earth light during the day?", "The Sun", "A cloud", "A mountain", "A rainbow", "It is the star closest to Earth.", "The Sun is a star that gives Earth light and warmth."],
    ["Science", "What does water become when it freezes?", "Ice", "Sand", "Smoke", "Wood", "Think of what is in an ice cube tray.", "When liquid water freezes, it becomes solid ice."],
    ["Numbers", "Which number comes just after nine?", "Ten", "Eight", "Seven", "Six", "Count one more than nine.", "The counting numbers go eight, nine, ten."],
    ["Language", "Which letter begins the word dog?", "D", "B", "C", "M", "Say the first sound slowly.", "Dog begins with the letter d."],
    ["Shapes", "Which shape has no corners?", "Circle", "Square", "Triangle", "Rectangle", "Think of a round wheel.", "A circle is round and has no corners."],
    ["Everyday life", "Which tool do we use to brush our teeth?", "Toothbrush", "Paintbrush", "Ruler", "Scissors", "This tool helps clean your mouth.", "A toothbrush helps remove food and plaque from teeth."],
    ["Nature", "What falls from clouds as drops of water?", "Rain", "Leaves", "Pebbles", "Seeds", "You may use an umbrella when it falls.", "Rain is water that falls from clouds."],
    ["Animals", "Which animal has a very long neck?", "Giraffe", "Pig", "Mouse", "Sheep", "This tall animal can reach leaves high in trees.", "Giraffes have long necks that help them reach leaves."],
    ["Language", "What is the opposite of hot?", "Cold", "Warm", "Tall", "Fast", "Think about snow rather than a warm oven.", "Hot and cold are opposites."],
    ["Everyday life", "Which meal is often eaten first in the morning?", "Breakfast", "Lunch", "Dinner", "Dessert", "Its name means breaking the overnight fast.", "Breakfast is usually the first meal of the day."],
    ["Science", "Which body part helps us see?", "Eyes", "Elbows", "Fingers", "Ankles", "You use these to look at a picture.", "Our eyes detect light and help us see."],
    ["Nature", "Which of these grows on an apple tree?", "Apples", "Carrots", "Potatoes", "Lettuce", "The tree's name gives you a clue.", "Apples are fruits that grow on apple trees."],
    ["Numbers", "How many days are in one week?", "Seven", "Five", "Ten", "Twelve", "Count from Monday through Sunday.", "A week has seven days."]
  ],
  2: [
    ["Animals", "What is a young frog called?", "Tadpole", "Calf", "Cub", "Chick", "It lives in water and starts with a tail.", "A frog starts life as a tadpole before developing legs."],
    ["Science", "Which organ pumps blood around the body?", "Heart", "Lung", "Stomach", "Brain", "You can feel its beat in your chest.", "The heart pumps blood through the body's blood vessels."],
    ["Geography", "Which direction is opposite to north?", "South", "East", "West", "Up", "Look at opposite ends of a compass.", "South is opposite north on a compass."],
    ["Language", "Which word names an action?", "Jump", "Chair", "Blue", "Table", "Look for something a person can do.", "Jump is a verb, a word that names an action."],
    ["Time", "How many minutes are in an hour?", "60", "30", "24", "100", "A minute hand makes one full turn in an hour.", "One hour equals 60 minutes."],
    ["Nature", "Which season comes after summer and before winter?", "Autumn", "Spring", "Summer", "Winter", "Leaves often change color in this season.", "Autumn, also called fall, comes between summer and winter."],
    ["Science", "Which material is usually attracted to a magnet?", "Iron", "Wood", "Glass", "Paper", "Think of a metal used in many nails.", "Magnets attract iron and some other metals."],
    ["Animals", "Which animal is an insect?", "Ant", "Spider", "Snail", "Worm", "Insects have six legs.", "Ants are insects and have six legs. Spiders have eight."],
    ["Language", "What is the plural of child?", "Children", "Childs", "Childes", "Child", "This plural changes more than just the ending.", "The plural of child is children."],
    ["Numbers", "How many objects are in a dozen?", "12", "10", "20", "6", "Eggs are often sold in boxes of this many.", "A dozen means twelve."],
    ["Geography", "What does a map show?", "Places and where they are", "Only the time", "Only musical notes", "How food tastes", "You can use it to find a route.", "A map represents an area and the positions of places within it."],
    ["Nature", "Which part of a plant makes most of its food?", "Leaves", "Roots", "Seeds", "Bark", "This green part catches sunlight.", "Leaves use sunlight to help plants make food."],
    ["Science", "Which state of matter has a fixed shape?", "Solid", "Liquid", "Gas", "Water vapor", "A wooden block keeps its shape when moved.", "A solid keeps its own shape, unlike a liquid or gas."],
    ["Language", "Which punctuation mark usually ends a question?", "Question mark", "Comma", "Period", "Apostrophe", "Think of the mark after Why?", "A question mark signals that a sentence asks a question."],
    ["Animals", "What do caterpillars become after the pupa stage?", "Butterflies or moths", "Frogs", "Beetles", "Birds", "Think of insects with broad wings.", "Caterpillars develop into butterflies or moths."],
    ["Everyday life", "Which item can usually be recycled as paper?", "A clean newspaper", "A banana peel", "A glass jar", "A metal spoon", "Look for something made from printed sheets.", "Clean newspapers can usually be recycled with paper."],
    ["Numbers", "Which number is even?", "14", "11", "13", "15", "An even number can be split into two equal whole-number groups.", "Fourteen is even because it divides evenly by two."],
    ["Geography", "What is land with water all around it called?", "Island", "Valley", "Hill", "Desert", "Think of land completely surrounded by the sea or a lake.", "An island is land surrounded by water."],
    ["Science", "Which sense helps you notice a flower's scent?", "Smell", "Sight", "Hearing", "Touch", "You use your nose for this.", "Our sense of smell detects scents."],
    ["Time", "How many months are in a year?", "12", "7", "10", "24", "Count from January through December.", "A calendar year has twelve months."]
  ],
  3: [
    ["Science", "What is the change from liquid water to water vapor called?", "Evaporation", "Freezing", "Melting", "Condensation", "A puddle can get smaller on a warm day.", "Evaporation changes a liquid into a gas."],
    ["Space", "Which planet do we live on?", "Earth", "Mars", "Venus", "Jupiter", "It is the third planet from the Sun.", "Earth is the third planet from the Sun and our home."],
    ["Geography", "Which is the largest ocean on Earth?", "Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "It lies between Asia and the Americas.", "The Pacific is Earth's largest ocean."],
    ["Animals", "An animal with a backbone is called what?", "Vertebrate", "Invertebrate", "Producer", "Mineral", "The name comes from the bones in a spine.", "Vertebrates have a backbone or spinal column."],
    ["Language", "Which word is an adjective in 'the bright star'?", "Bright", "The", "Star", "None", "Look for the word describing the star.", "Bright is an adjective because it describes the noun star."],
    ["Numbers", "How many sides does a hexagon have?", "6", "5", "7", "8", "The prefix hex means six.", "A hexagon is a polygon with six sides."],
    ["Nature", "What do we call an animal that eats only plants?", "Herbivore", "Carnivore", "Omnivore", "Predator", "Herb is related to plants.", "Herbivores eat plants."],
    ["Science", "Which force pulls objects toward Earth?", "Gravity", "Friction", "Magnetism", "Sound", "It makes a dropped ball fall down.", "Gravity attracts objects toward Earth's center."],
    ["Geography", "On which continent is Egypt?", "Africa", "Europe", "South America", "Australia", "The Nile runs through this continent.", "Egypt is in northeastern Africa."],
    ["History", "What did the ancient Egyptians build as tombs for some rulers?", "Pyramids", "Lighthouses", "Skyscrapers", "Railways", "These structures have triangular sides.", "Some Egyptian pyramids were built as tombs for pharaohs."],
    ["Science", "Which of these is a source of light?", "A lit candle", "A mirror", "The Moon", "A book", "Look for something that makes light rather than reflects it.", "A lit candle produces light. Mirrors and the Moon reflect light."],
    ["Language", "Which word is a synonym for happy?", "Joyful", "Angry", "Tired", "Lonely", "A synonym has a similar meaning.", "Joyful and happy have similar meanings."],
    ["Numbers", "What is one half of 20?", "10", "5", "15", "40", "Split twenty into two equal groups.", "Twenty divided into two equal groups gives ten in each."],
    ["Space", "What is Earth's natural satellite?", "The Moon", "The Sun", "Mars", "A cloud", "It travels around Earth.", "The Moon is Earth's natural satellite."],
    ["Nature", "What is the place where an animal normally lives called?", "Habitat", "Orbit", "Climate", "Skeleton", "It provides food, shelter, and space.", "A habitat is the environment where an organism lives."],
    ["Science", "Which simple machine is a ramp?", "Inclined plane", "Pulley", "Wheel and axle", "Lever", "A ramp is a sloping flat surface.", "An inclined plane is a sloping surface that helps move loads."],
    ["Geography", "Which imaginary line divides Earth into northern and southern halves?", "Equator", "Prime meridian", "North Pole", "Arctic Circle", "It circles Earth halfway between the poles.", "The equator separates the Northern and Southern Hemispheres."],
    ["Language", "Which word is a compound word?", "Sunflower", "Yellow", "Flower", "Shiny", "Look for two smaller words joined together.", "Sunflower combines sun and flower."],
    ["Science", "Which material lets light pass through it clearly?", "Clear glass", "Cardboard", "Wood", "Brick", "You can see through a clean window.", "Clear glass is transparent, so light passes through it."],
    ["Time", "How many days are in a leap year?", "366", "365", "364", "360", "February has one extra day that year.", "A leap year has 366 days because February has 29 days."]
  ],
  4: [
    ["Science", "What process do plants use to make food with sunlight?", "Photosynthesis", "Digestion", "Evaporation", "Erosion", "Its name includes a word part meaning light.", "Photosynthesis uses light energy to make sugars from water and carbon dioxide."],
    ["Geography", "What is the capital city of France?", "Paris", "Rome", "Madrid", "Berlin", "The Eiffel Tower is in this city.", "Paris is the capital of France."],
    ["Space", "Which planet is known as the Red Planet?", "Mars", "Venus", "Saturn", "Neptune", "Iron-rich dust gives its surface a reddish color.", "Mars looks red because of iron oxide on its surface."],
    ["Science", "Which change forms water droplets on a cold glass?", "Condensation", "Evaporation", "Melting", "Freezing", "Water vapor cools and changes into liquid.", "Condensation changes a gas into a liquid."],
    ["Nature", "Which organism is a producer in a food chain?", "Grass", "Rabbit", "Fox", "Owl", "A producer makes its own food.", "Grass makes its own food through photosynthesis."],
    ["Numbers", "What is the perimeter of a square with sides of 4 centimeters?", "16 centimeters", "8 centimeters", "12 centimeters", "4 centimeters", "Add the lengths of all four sides.", "Four sides of four centimeters total sixteen centimeters."],
    ["Language", "Which sentence contains a simile?", "The cloud is like cotton.", "The cloud is white.", "The cloud moved.", "The cloud is high.", "A simile compares things using like or as.", "Comparing a cloud to cotton using like is a simile."],
    ["History", "Which civilization is associated with the ancient Olympic Games?", "Ancient Greece", "Ancient Egypt", "The Inca", "Ancient China", "The games began at Olympia.", "The ancient Olympic Games were held in Greece."],
    ["Science", "What is the wearing away of rock and soil by moving water or wind called?", "Erosion", "Condensation", "Germination", "Pollination", "Think of soil being carried away.", "Erosion moves weathered rock and soil from one place to another."],
    ["Geography", "Which is the largest continent by land area?", "Asia", "Africa", "Europe", "Antarctica", "China and India are on this continent.", "Asia has the largest land area of the continents."],
    ["Space", "About how long does Earth take to orbit the Sun once?", "One year", "One day", "One month", "One week", "This journey marks a full calendar cycle.", "Earth completes one orbit around the Sun in about a year."],
    ["Science", "Which is a renewable energy source?", "Sunlight", "Coal", "Oil", "Natural gas", "Look for a source that is naturally replenished.", "Sunlight is replenished naturally and is a renewable energy source."],
    ["Numbers", "Which fraction equals one half?", "2/4", "1/4", "3/4", "4/4", "Multiply the top and bottom of one half by two.", "Two fourths and one half represent the same amount."],
    ["Language", "What is the main idea of a paragraph?", "Its central point", "Its longest word", "Its last punctuation mark", "Its page number", "Details in the paragraph support this idea.", "The main idea is the central point the paragraph communicates."],
    ["Nature", "What is the transfer of pollen between flower parts called?", "Pollination", "Evaporation", "Hibernation", "Erosion", "Bees often help with this process.", "Pollination transfers pollen to the part of a flower that can receive it."],
    ["Science", "Which body system includes the brain and nerves?", "Nervous system", "Digestive system", "Respiratory system", "Skeletal system", "It carries messages around the body.", "The nervous system includes the brain, spinal cord, and nerves."],
    ["Geography", "Which instrument shows direction using Earth's magnetic field?", "Compass", "Thermometer", "Barometer", "Stopwatch", "Its needle points approximately north.", "A magnetic compass uses Earth's magnetic field to indicate direction."],
    ["Science", "Which tool measures temperature?", "Thermometer", "Ruler", "Balance", "Compass", "Its reading may use degrees Celsius or Fahrenheit.", "A thermometer measures temperature."],
    ["Numbers", "How many degrees are in a right angle?", "90", "45", "180", "360", "Think of the corner of a square.", "A right angle measures ninety degrees."],
    ["Language", "Which prefix usually means not in the word unhappy?", "Un-", "Re-", "Pre-", "Disco-", "Remove the beginning to leave happy.", "The prefix un- changes happy to its opposite."]
  ],
  5: [
    ["Science", "Which gas do plants take in for photosynthesis?", "Carbon dioxide", "Helium", "Hydrogen", "Neon", "People breathe out some of this gas.", "Plants use carbon dioxide and water to make sugars during photosynthesis."],
    ["Space", "Which is the largest planet in our solar system?", "Jupiter", "Earth", "Mars", "Mercury", "This gas giant has a Great Red Spot.", "Jupiter is the largest planet in our solar system."],
    ["Geography", "What does latitude measure?", "Distance north or south of the equator", "Distance east or west of the prime meridian", "Height above sea level", "Depth below the ocean", "Latitude lines run parallel to the equator.", "Latitude measures angular distance north or south of the equator."],
    ["Science", "Which part of a cell contains most of its DNA in plants and animals?", "Nucleus", "Cell membrane", "Cytoplasm", "Cell wall", "This structure stores genetic instructions.", "The nucleus holds most of a plant or animal cell's DNA."],
    ["Numbers", "What is 25 percent of 100?", "25", "4", "50", "75", "Percent means out of one hundred.", "Twenty-five percent of one hundred is twenty-five."],
    ["Language", "Which sentence uses a metaphor?", "The classroom was a zoo.", "The classroom had desks.", "The classroom was quiet.", "The classroom looked like a zoo.", "A metaphor compares without using like or as.", "Calling a busy classroom a zoo is a metaphor, not a literal statement."],
    ["Science", "Which force resists motion when surfaces rub together?", "Friction", "Gravity", "Buoyancy", "Magnetism", "It helps your shoes grip the ground.", "Friction resists sliding between surfaces in contact."],
    ["History", "What invention helped spread printed books in Europe in the 1400s?", "Gutenberg's printing press", "The steam engine", "The telephone", "The airplane", "It used movable metal type.", "Johannes Gutenberg developed a movable-type printing press in Europe in the 1400s."],
    ["Geography", "What is the capital city of Japan?", "Tokyo", "Beijing", "Seoul", "Bangkok", "It is a large city on the island of Honshu.", "Tokyo is the capital of Japan."],
    ["Nature", "What do decomposers do in an ecosystem?", "Break down dead organisms", "Make sunlight", "Stop all plant growth", "Create rocks from air", "Fungi and many bacteria play this role.", "Decomposers break down dead material and return nutrients to the environment."],
    ["Science", "Which is an example of a chemical change?", "Iron rusting", "Ice melting", "Paper being cut", "Water freezing", "Look for a change that makes a new substance.", "Rusting produces iron oxide, a new substance."],
    ["Numbers", "What is the volume of a cube with edges of 3 centimeters?", "27 cubic centimeters", "9 cubic centimeters", "12 cubic centimeters", "18 cubic centimeters", "Multiply length by width by height.", "Three times three times three is twenty-seven cubic centimeters."],
    ["Space", "What mainly causes Earth's seasons?", "Its tilted axis as it orbits the Sun", "Its changing distance from the Moon", "Clouds covering the Sun", "The Sun switching on and off", "Different hemispheres receive more direct sunlight at different times.", "Earth's axial tilt changes sunlight angles and daylight length throughout the year."],
    ["Science", "What is the smallest basic unit of a chemical element?", "Atom", "Organ", "Cell", "Tissue", "Atoms can join together to make molecules.", "An atom is the basic unit of an element."],
    ["Language", "In a story, what is the setting?", "Where and when the story happens", "Only the main character's name", "Only the problem", "The book's price", "Think about the place and time.", "The setting tells readers where and when a story takes place."],
    ["Geography", "Which imaginary line is at zero degrees longitude?", "Prime meridian", "Equator", "Tropic of Cancer", "Antarctic Circle", "The standard reference passes through Greenwich in London.", "The prime meridian is the zero-degree reference for longitude."],
    ["Science", "In an experiment, what should a fair test usually change?", "One independent variable", "Every variable at once", "Only the written conclusion", "Nothing at all", "Keep other conditions the same to compare results.", "Changing one independent variable helps reveal its effect while other conditions are controlled."],
    ["Numbers", "Which number is prime?", "17", "15", "21", "27", "A prime number has exactly two positive factors.", "Seventeen has only two positive factors: one and seventeen."],
    ["Nature", "Which adaptation helps a polar bear stay warm?", "Thick fur and a layer of fat", "Large thin leaves", "Feathers on its wings", "Gills under its skin", "Think of insulation against the cold.", "Thick fur and fat help insulate polar bears in cold environments."],
    ["Science", "What carries energy through a sound wave?", "Vibrations traveling through matter", "Only sunlight", "A stream of tiny planets", "Empty space with no matter", "Sound needs a medium such as air or water.", "Sound travels as vibrations through a medium and cannot travel through a vacuum."]
  ]
}

export function questionBank(grade) {
  if (!GRADES.includes(grade)) throw new Error(`Unknown trivia grade: ${grade}`)
  return BANKS[grade].map(([category, prompt, answer, ...rest], index) => ({
    id: `grade-${grade}-${index + 1}`, grade, category, prompt, answer,
    choices: [answer, ...rest.slice(0, 3)], hint: rest[3], explanation: rest[4]
  }))
}

export function shuffled(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  return result
}

export function adventureQuestions(grade) {
  return shuffled(questionBank(grade)).slice(0, ROUND_LENGTH)
}
