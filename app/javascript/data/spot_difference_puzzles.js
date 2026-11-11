export const PICTURE_WIDTH = 600
export const PICTURE_HEIGHT = 400

const rect = (x, y, width, height, fill, extra = {}) => ({ tag: "rect", attrs: { x, y, width, height, fill, ...extra } })
const circle = (cx, cy, r, fill) => ({ tag: "circle", attrs: { cx, cy, r, fill } })
const ellipse = (cx, cy, rx, ry, fill) => ({ tag: "ellipse", attrs: { cx, cy, rx, ry, fill } })
const polygon = (points, fill) => ({ tag: "polygon", attrs: { points, fill } })
const line = (x1, y1, x2, y2, stroke, width = 5) => ({ tag: "line", attrs: { x1, y1, x2, y2, stroke, "stroke-width": width, "stroke-linecap": "round" } })
const cloud = (x, y) => [ellipse(x, y, 42, 16, "#fff"), circle(x - 15, y - 10, 18, "#fff"), circle(x + 13, y - 16, 23, "#fff")]
const star = (x, y, fill) => polygon(`${x},${y - 30} ${x + 9},${y - 9} ${x + 31},${y - 9} ${x + 14},${y + 6} ${x + 20},${y + 28} ${x},${y + 15} ${x - 20},${y + 28} ${x - 14},${y + 6} ${x - 31},${y - 9} ${x - 9},${y - 9}`, fill)
const flower = (x, y, fill) => [
  line(x, y + 10, x, y + 60, "#367a49"), ellipse(x + 12, y + 40, 15, 7, "#479555"),
  ...[[0, -16], [16, 0], [0, 16], [-16, 0]].map(([dx, dy]) => circle(x + dx, y + dy, 13, fill)),
  circle(x, y, 10, "#ffd45c")
]
const fish = (x, y, fill, left = false) => [
  polygon(left ? `${x + 22},${y} ${x + 48},${y - 23} ${x + 48},${y + 23}` : `${x - 22},${y} ${x - 48},${y - 23} ${x - 48},${y + 23}`, fill),
  ellipse(x, y, 30, 20, fill), circle(x + (left ? -14 : 14), y - 5, 4, "#303143")
]
const tree = (x, y) => [rect(x - 9, y, 18, 75, "#926347"), circle(x, y - 20, 45, "#58965c"), circle(x - 25, y, 28, "#68a869")]

function difference(id, bounds, description, original, changed) {
  return { id, bounds, description, original, changed }
}

// Original vector artwork, bundled locally. Bounds cover only the changed object.
export const PUZZLES = [
  {
    id: "garden", title: "Sunny garden", background: "#d8effa",
    shapes: [
      rect(0, 230, 600, 170, "#b8d995"), rect(0, 340, 600, 60, "#8fbd73"),
      ...tree(205, 190), ...tree(560, 205),
      rect(275, 175, 140, 120, "#f5d6a5", { rx: 5 }), polygon("255,180 345,110 435,180", "#bd6370"),
      rect(330, 225, 30, 70, "#95674e"), circle(353, 260, 3, "#f4d367"),
      rect(290, 200, 25, 30, "#a4d3e2"), rect(375, 200, 25, 30, "#a4d3e2"),
      ellipse(300, 370, 140, 16, "#9ac47c")
    ],
    differences: [
      difference("sun", [25, 20, 100, 100], "The sun is yellow in Picture 1 and orange in Picture 2.", [circle(75, 70, 32, "#ffd45c")], [circle(75, 70, 32, "#ef9958")]),
      difference("cloud", [230, 15, 120, 85], "The cloud is missing from Picture 2.", cloud(290, 65), []),
      difference("kite", [450, 35, 100, 130], "The kite is pink in Picture 1 and purple in Picture 2.", [polygon("500,45 532,80 500,112 468,80", "#df7c9c"), line(500,112,485,155,"#806b8e", 3)], [polygon("500,45 532,80 500,112 468,80", "#9480c5"), line(500,112,485,155,"#806b8e", 3)]),
      difference("flower", [35, 260, 100, 125], "The flower has pink petals in Picture 1 and blue petals in Picture 2.", flower(85, 300, "#de85ad"), flower(85, 300, "#78a6d9")),
      difference("pot", [410, 290, 105, 95], "The plant pot is missing its stripe in Picture 2.", [polygon("425,310 500,310 488,375 438,375", "#c3815c"), rect(431,330,63,12,"#f7d8a1")], [polygon("425,310 500,310 488,375 438,375", "#c3815c")])
    ],
    challengeDifferences: [
      difference("bird", [130,20,70,65], "The little bird's wing is missing in Picture 2.", [ellipse(165,55,18,10,"#8878aa"),line(160,55,170,48,"#51456d",3)], [ellipse(165,55,18,10,"#8878aa")]),
      difference("apple", [155,140,70,65], "The apple on the tree has a leaf only in Picture 1.", [circle(185,175,10,"#d45c64"),ellipse(194,161,8,4,"#376743")], [circle(185,175,10,"#d45c64")]),
      difference("window", [270,185,60,65], "The left window changes from blue to purple.", [rect(290,200,25,30,"#a4d3e2")], [rect(290,200,25,30,"#b09bc9")]),
      difference("knob", [330,235,65,65], "The door knob is larger in Picture 2.", [circle(353,260,3,"#f4d367")], [circle(353,260,8,"#f4d367")]),
      difference("stone", [200,305,85,65], "The stepping stone has a small spot only in Picture 1.", [ellipse(245,340,28,10,"#bbc2b3"),circle(250,338,4,"#8a9585")], [ellipse(245,340,28,10,"#bbc2b3")])
    ]
  },
  {
    id: "beach", title: "A day at the beach", background: "#d6eff7",
    shapes: [
      rect(0,170,600,115,"#78becb"), rect(0,285,600,115,"#f2dfb3"),
      line(0,240,600,240,"#c9e8e7", 9), line(0,278,600,278,"#eef7ed", 12),
      line(200,165,200,330,"#926b53", 6), polygon("100,175 200,95 300,175","#e68788"),
      polygon("200,95 200,175 300,175","#f3bd83"), rect(295,325,65,20,"#c59777", {rx:8}),
      ...cloud(360,65)
    ],
    differences: [
      difference("sun", [25,20,100,100], "The sun has a small cloud in front of it only in Picture 2.", [circle(72,65,30,"#ffd45c")], [circle(72,65,30,"#ffd45c"), ...cloud(80,90)]),
      difference("sail", [340,140,110,120], "The boat's sail is yellow in Picture 1 and pink in Picture 2.", [polygon("350,230 445,230 425,251 370,251","#98654c"), line(395,155,395,230,"#80644f",3), polygon("390,155 350,222 390,222","#f4d56d")], [polygon("350,230 445,230 425,251 370,251","#98654c"), line(395,155,395,230,"#80644f",3), polygon("390,155 350,222 390,222","#dd87a6")]),
      difference("bird", [470,35,100,85], "One bird becomes two birds in Picture 2.", [line(490,70,505,80,"#5b6885",4),line(505,80,520,70,"#5b6885",4)], [line(490,70,505,80,"#5b6885",4),line(505,80,520,70,"#5b6885",4),line(530,90,540,98,"#5b6885",4),line(540,98,550,90,"#5b6885",4)]),
      difference("ball", [35,285,110,100], "The beach ball's center changes from blue to red.", [circle(90,335,35,"#fff8dd"),circle(90,335,22,"#76aacb")], [circle(90,335,35,"#fff8dd"),circle(90,335,22,"#de7f87")]),
      difference("shell", [450,290,110,90], "A star-shaped shell becomes a round shell in Picture 2.", [star(505,335,"#d798ad")], [circle(505,335,29,"#d798ad")])
    ],
    challengeDifferences: [
      difference("flag", [150,25,70,65], "The beach flag has a dot only in Picture 1.", [line(170,40,170,80,"#926b53",3),polygon("170,40 205,50 170,60","#8cb59b"),circle(180,50,3,"#fff")], [line(170,40,170,80,"#926b53",3),polygon("170,40 205,50 170,60","#8cb59b")]),
      difference("umbrella", [165,110,70,65], "The umbrella has two small stripes in Picture 1 and one in Picture 2.", [line(185,145,195,135,"#fff1c8",4),line(205,145,215,135,"#fff1c8",4)], [line(185,145,195,135,"#fff1c8",4)]),
      difference("towel", [185,325,90,65], "The towel's stripe changes from pink to blue.", [rect(195,340,70,35,"#fff1ce"),rect(220,340,10,35,"#da92a7")], [rect(195,340,70,35,"#fff1ce"),rect(220,340,10,35,"#86b4cc")]),
      difference("crab", [365,305,70,75], "The crab has one raised claw only in Picture 1.", [ellipse(400,350,18,12,"#d88770"),line(388,344,380,327,"#d88770",5),circle(393,345,2,"#303143"),circle(407,345,2,"#303143")], [ellipse(400,350,18,12,"#d88770"),circle(393,345,2,"#303143"),circle(407,345,2,"#303143")]),
      difference("wave", [475,170,90,70], "The short wave has two strokes in Picture 1 and one in Picture 2.", [line(490,195,545,195,"#e8f4eb",4),line(505,207,535,207,"#e8f4eb",4)], [line(490,195,545,195,"#e8f4eb",4)])
    ]
  },
  {
    id: "space", title: "Space explorers", background: "#303e65",
    shapes: [
      ...[[160,30],[350,35],[410,110],[175,180],[300,250],[380,350],[240,365],[565,230]].map(([x,y]) => circle(x,y,3,"#f6e8b5")),
      circle(300,480,180,"#a4a6c9"), ellipse(260,340,35,12,"#8d90b5"), ellipse(345,365,25,10,"#8d90b5"),
      polygon("270,235 300,110 330,235","#f1eee4"), polygon("270,215 250,250 278,240","#dd8798"),
      polygon("330,215 350,250 322,240","#dd8798"), polygon("285,240 300,285 315,240","#efba68")
    ],
    differences: [
      difference("star", [25,20,100,100], "A yellow star becomes a pink star in Picture 2.", [star(75,70,"#f4d879")], [star(75,70,"#dd8eae")]),
      difference("planet", [420,20,145,115], "The planet's ring is missing in Picture 2.", [circle(495,75,35,"#b19bce"), {tag:"ellipse",attrs:{cx:495,cy:75,rx:62,ry:14,fill:"none",stroke:"#e6c19a","stroke-width":7}}], [circle(495,75,35,"#b19bce")]),
      difference("window", [250,140,100,95], "The rocket window is round in Picture 1 and square in Picture 2.", [circle(300,183,18,"#83cbd7")], [rect(282,165,36,36,"#83cbd7",{rx:3})]),
      difference("moon", [30,265,115,105], "The small moon has two craters in Picture 1 and one in Picture 2.", [circle(85,320,40,"#e1d9bf"),circle(70,305,10,"#b3ad9c"),circle(100,332,12,"#b3ad9c")], [circle(85,320,40,"#e1d9bf"),circle(70,305,10,"#b3ad9c")]),
      difference("satellite", [440,265,125,110], "The satellite has a blue panel in Picture 1 and a green panel in Picture 2.", [rect(485,300,35,35,"#d6d6e5"),rect(450,305,30,25,"#82aede"),rect(525,305,30,25,"#82aede"),line(502,300,502,280,"#e5e3db",3)], [rect(485,300,35,35,"#d6d6e5"),rect(450,305,30,25,"#90bd8b"),rect(525,305,30,25,"#82aede"),line(502,300,502,280,"#e5e3db",3)])
    ],
    challengeDifferences: [
      difference("comet", [175,65,70,65], "The comet has two tail lines in Picture 1 and one in Picture 2.", [line(190,110,225,80,"#b3cde5",4),line(200,115,230,90,"#b3cde5",3),circle(190,110,8,"#e0ebee")], [line(190,110,225,80,"#b3cde5",4),circle(190,110,8,"#e0ebee")]),
      difference("little-star", [355,160,70,65], "The little star is missing its center dot in Picture 2.", [star(390,193,"#c9b8de"),circle(390,193,4,"#fff4da")], [star(390,193,"#c9b8de")]),
      difference("saucer", [160,270,70,65], "The flying saucer has a light only in Picture 1.", [ellipse(195,305,26,8,"#9cc8be"),circle(195,293,12,"#a9cadd"),circle(195,308,3,"#f8df7b")], [ellipse(195,305,26,8,"#9cc8be"),circle(195,293,12,"#a9cadd")]),
      difference("tiny-planet", [370,265,65,65], "The tiny planet's spot changes sides.", [circle(402,297,18,"#dcb28e"),circle(395,292,5,"#b68272")], [circle(402,297,18,"#dcb28e"),circle(409,292,5,"#b68272")]),
      difference("constellation", [270,15,70,65], "The constellation has three stars in Picture 1 and two in Picture 2.", [circle(285,35,4,"#f6e8b5"),circle(305,55,4,"#f6e8b5"),circle(325,35,4,"#f6e8b5")], [circle(285,35,4,"#f6e8b5"),circle(325,35,4,"#f6e8b5")])
    ]
  },
  {
    id: "room", title: "Cozy reading room", background: "#f1e4d6",
    shapes: [
      rect(0,285,600,115,"#cba88c"), rect(15,275,570,10,"#ad8b75"),
      rect(215,60,150,120,"#fff7e6",{rx:5}),rect(225,70,130,100,"#a6d4e4"),
      line(290,70,290,170,"#fff7e6",7),line(225,120,355,120,"#fff7e6",7),
      rect(185,230,225,95,"#9fadc9",{rx:15}),rect(170,205,30,115,"#8e9dbb",{rx:12}),rect(395,205,30,115,"#8e9dbb",{rx:12}),
      ellipse(300,360,145,25,"#e6c8a9"),rect(220,250,70,45,"#dcc499",{rx:8}),rect(310,250,70,45,"#bd98b7",{rx:8})
    ],
    differences: [
      difference("clock", [30,30,110,100], "The clock's hand points right in Picture 1 and left in Picture 2.", [circle(85,80,35,"#fff7e6"),line(85,80,85,55,"#6b677d",4),line(85,80,108,80,"#6b677d",4)], [circle(85,80,35,"#fff7e6"),line(85,80,85,55,"#6b677d",4),line(85,80,62,80,"#6b677d",4)]),
      difference("frame", [455,30,105,110], "A picture of a star becomes a picture of a circle.", [rect(465,40,85,90,"#a37c60"),rect(473,48,69,74,"#fff4d8"),star(507,84,"#dcac62")], [rect(465,40,85,90,"#a37c60"),rect(473,48,69,74,"#fff4d8"),circle(507,84,25,"#dcac62")]),
      difference("books", [40,170,110,90], "Three books become two books in Picture 2.", [rect(50,230,90,15,"#a1bc8e"),rect(55,210,80,15,"#d9999e"),rect(60,190,75,15,"#93b7d1")], [rect(50,230,90,15,"#a1bc8e"),rect(55,210,80,15,"#d9999e")]),
      difference("ball", [35,295,110,90], "The ball is purple in Picture 1 and green in Picture 2.", [circle(90,340,30,"#ac94c4")], [circle(90,340,30,"#8eaf7d")]),
      difference("plant", [465,205,110,165], "One leaf is missing from the plant in Picture 2.", [rect(485,300,65,55,"#cf9979",{rx:5}),line(518,300,518,225,"#58945f"),ellipse(500,250,18,9,"#7da56a"),ellipse(536,273,18,9,"#7da56a")], [rect(485,300,65,55,"#cf9979",{rx:5}),line(518,300,518,225,"#58945f"),ellipse(500,250,18,9,"#7da56a")])
    ],
    challengeDifferences: [
      difference("decoration", [145,30,65,65], "The hanging decoration has a stripe only in Picture 1.", [circle(177,62,20,"#c6a9c9"),line(165,62,189,62,"#fff1df",3)], [circle(177,62,20,"#c6a9c9")]),
      difference("window-sun", [275,80,65,65], "The sun outside the window is larger in Picture 2.", [circle(325,98,8,"#f4d879")], [circle(325,98,13,"#f4d879")]),
      difference("cushion", [220,240,75,65], "The left cushion has a button only in Picture 1.", [circle(255,272,5,"#a7875d")], []),
      difference("rug", [330,325,70,65], "The rug has two small stitches in Picture 1 and one in Picture 2.", [line(350,355,360,360,"#b79979",3),line(370,355,380,360,"#b79979",3)], [line(350,355,360,360,"#b79979",3)]),
      difference("hook", [380,140,65,60], "The wall hook changes from a circle to a square.", [circle(412,170,7,"#947b67")], [rect(405,163,14,14,"#947b67")])
    ]
  },
  {
    id: "ocean", title: "Underwater friends", background: "#94cfdb",
    shapes: [
      rect(0,310,600,90,"#e7d4a9"),ellipse(295,340,100,18,"#d3bf96"),
      ...[160,195,350,380].flatMap((x) => [line(x,330,x-8,260,"#679f79",8),line(x-4,300,x+13,280,"#679f79",6)]),
      ...fish(290,220,"#e4b46a"), ...fish(380,140,"#af9fc9",true),
      ...[[215,55,9],[225,90,6],[330,35,7],[410,235,8]].map(([x,y,r]) => ({tag:"circle",attrs:{cx:x,cy:y,r,fill:"none",stroke:"#d3edf0","stroke-width":3}}))
    ],
    differences: [
      difference("fish", [30,40,125,95], "The fish is orange in Picture 1 and purple in Picture 2.", fish(100,85,"#e6a76f"), fish(100,85,"#ac91c2")),
      difference("bubbles", [460,20,100,125], "There are three large bubbles in Picture 1 and two in Picture 2.", [circle(505,45,12,"#d5eff0"),circle(525,80,16,"#d5eff0"),circle(500,115,10,"#d5eff0")], [circle(505,45,12,"#d5eff0"),circle(525,80,16,"#d5eff0")]),
      difference("direction", [440,180,130,90], "The yellow fish faces right in Picture 1 and left in Picture 2.", fish(505,225,"#f0ce72"), fish(505,225,"#f0ce72",true)),
      difference("starfish", [25,290,115,95], "The starfish is pink in Picture 1 and orange in Picture 2.", [star(80,338,"#d69ab2")], [star(80,338,"#dfac74")]),
      difference("pearl", [440,295,125,90], "The pearl inside the shell is missing in Picture 2.", [ellipse(500,350,45,20,"#b79bc7"),ellipse(500,335,38,15,"#ddcce5"),circle(500,333,12,"#fff7e5")], [ellipse(500,350,45,20,"#b79bc7"),ellipse(500,335,38,15,"#ddcce5")])
    ],
    challengeDifferences: [
      difference("jellyfish", [175,140,65,65], "The jellyfish has three short arms in Picture 1 and two in Picture 2.", [ellipse(207,163,20,13,"#c8afce"),line(195,174,195,192,"#c8afce",3),line(207,174,207,192,"#c8afce",3),line(219,174,219,192,"#c8afce",3)], [ellipse(207,163,20,13,"#c8afce"),line(195,174,195,192,"#c8afce",3),line(219,174,219,192,"#c8afce",3)]),
      difference("tiny-bubble", [270,25,60,65], "The small bubble has a highlight only in Picture 1.", [circle(300,55,15,"#d5eff0"),circle(295,50,4,"#fff")], [circle(300,55,15,"#d5eff0")]),
      difference("pebble", [270,285,70,70], "The pebble's spot is missing in Picture 2.", [ellipse(305,330,23,12,"#b3b0a7"),circle(300,326,4,"#8b8b85")], [ellipse(305,330,23,12,"#b3b0a7")]),
      difference("seaweed", [40,180,75,70], "The small seaweed has a leaf on the right only in Picture 1.", [line(77,237,77,195,"#467e69",5),ellipse(65,210,12,5,"#467e69"),ellipse(89,222,12,5,"#467e69")], [line(77,237,77,195,"#467e69",5),ellipse(65,210,12,5,"#467e69")]),
      difference("snail", [360,325,70,65], "The sea snail's shell has a center dot only in Picture 1.", [ellipse(395,368,25,6,"#9baf8c"),circle(392,355,13,"#d3a58a"),circle(392,355,4,"#947966")], [ellipse(395,368,25,6,"#9baf8c"),circle(392,355,13,"#d3a58a")])
    ]
  },
  {
    id: "park", title: "Picnic in the park", background: "#dceef6",
    shapes: [
      rect(0,230,600,170,"#b6d59a"),ellipse(300,365,145,22,"#8cb9c7"),
      ...tree(560,210),...tree(205,195),
      rect(270,210,155,14,"#b88c63"),rect(270,235,155,14,"#b88c63"),
      rect(260,260,175,16,"#a47b58"),line(280,275,280,315,"#80624f",8),line(415,275,415,315,"#80624f",8)
    ],
    differences: [
      difference("balloon", [25,20,100,130], "The balloon is red in Picture 1 and yellow in Picture 2.", [ellipse(75,65,28,35,"#d78088"),line(75,100,65,140,"#8c8095",2)], [ellipse(75,65,28,35,"#efcc6d"),line(75,100,65,140,"#8c8095",2)]),
      difference("cloud", [230,15,120,85], "The cloud is missing in Picture 2.", cloud(290,65), []),
      difference("birdhouse", [450,35,100,130], "The birdhouse has a round door in Picture 1 and a square door in Picture 2.", [rect(470,75,60,65,"#dab283"),polygon("460,75 500,45 540,75","#b97a80"),circle(500,105,12,"#806454")], [rect(470,75,60,65,"#dab283"),polygon("460,75 500,45 540,75","#b97a80"),rect(488,93,24,24,"#806454")]),
      difference("basket", [35,260,100,125], "The picnic basket loses its handle in Picture 2.", [ellipse(85,310,30,25,"#b78d65"),rect(48,310,74,55,"#d4ab7c"),rect(55,320,60,8,"#f7d8a1")], [rect(48,310,74,55,"#d4ab7c"),rect(55,320,60,8,"#f7d8a1")]),
      difference("flowers", [440,275,110,110], "Two daisies become one daisy in Picture 2.", [...flower(472,320,"#fff4d8"),...flower(510,310,"#fff4d8")], flower(472,320,"#fff4d8"))
    ],
    challengeDifferences: [
      difference("bee", [130,25,70,65], "The bee has a stripe only in Picture 1.", [ellipse(165,60,16,9,"#ebc96b"),line(165,53,165,67,"#806454",3)], [ellipse(165,60,16,9,"#ebc96b")]),
      difference("nest", [155,140,70,65], "The nest holds two eggs in Picture 1 and one in Picture 2.", [ellipse(190,185,24,9,"#ae865d"),ellipse(183,176,5,8,"#e8e3cc"),ellipse(196,176,5,8,"#e8e3cc")], [ellipse(190,185,24,9,"#ae865d"),ellipse(183,176,5,8,"#e8e3cc")]),
      difference("bench", [275,195,65,65], "The bench has a small nail only in Picture 1.", [circle(295,217,4,"#65574c")], []),
      difference("cup", [350,220,65,65], "The cup's stripe changes color.", [rect(370,235,22,30,"#fff5dc"),rect(370,247,22,5,"#b99bca")], [rect(370,235,22,30,"#fff5dc"),rect(370,247,22,5,"#80ad9a")]),
      difference("duck", [245,315,80,65], "The duck has a wing only in Picture 1.", [ellipse(285,350,22,11,"#efda94"),circle(301,337,10,"#efda94"),polygon("309,335 319,339 309,342","#d79a5a"),line(278,350,290,353,"#b9a268",3)], [ellipse(285,350,22,11,"#efda94"),circle(301,337,10,"#efda94"),polygon("309,335 319,339 309,342","#d79a5a")])
    ]
  },
  {
    id: "farm", title: "Friendly farm", background: "#dceff6",
    shapes: [
      rect(0,240,600,160,"#b8cd8e"),rect(260,170,170,140,"#cf8580"),
      polygon("240,175 345,95 450,175","#9c6d72"),rect(305,235,80,75,"#8d6455"),
      line(345,235,345,310,"#f1d8b2",4),line(305,235,385,310,"#f1d8b2",4),
      ...[160,200,550,585].map((x) => rect(x,255,10,75,"#ead3ac")),
      rect(150,270,65,10,"#ead3ac"),rect(540,270,60,10,"#ead3ac")
    ],
    differences: [
      difference("sun", [25,20,100,100], "The sun is round in Picture 1 and star-shaped in Picture 2.", [circle(75,70,30,"#f4d36d")], [star(75,70,"#f4d36d")]),
      difference("cloud", [230,15,120,80], "The cloud is smaller in Picture 2.", cloud(290,60), [ellipse(290,60,25,12,"#fff")]),
      difference("windmill", [450,35,105,135], "The windmill loses one blade in Picture 2.", [polygon("490,90 510,90 520,160 480,160","#c6ae8a"),line(470,65,530,115,"#8b7b68",8),line(530,65,470,115,"#8b7b68",8)], [polygon("490,90 510,90 520,160 480,160","#c6ae8a"),line(470,65,530,115,"#8b7b68",8),line(500,90,470,115,"#8b7b68",8)]),
      difference("hay", [30,280,110,105], "The hay bale's band changes from brown to blue.", [rect(45,305,80,60,"#e6c576",{rx:8}),rect(78,305,12,60,"#ad8b54")], [rect(45,305,80,60,"#e6c576",{rx:8}),rect(78,305,12,60,"#88a4b9")]),
      difference("pig", [440,290,110,95], "The pig has a curly tail only in Picture 1.", [ellipse(490,340,30,20,"#e6a4ad"),circle(521,332,16,"#e6a4ad"),circle(526,330,3,"#51464e"),circle(453,335,7,"#e6a4ad")], [ellipse(490,340,30,20,"#e6a4ad"),circle(521,332,16,"#e6a4ad"),circle(526,330,3,"#51464e")])
    ],
    challengeDifferences: [
      difference("bird", [140,25,65,65], "The little bird has a tail only in Picture 1.", [ellipse(175,60,15,8,"#a48cac"),polygon("160,60 148,51 148,68","#a48cac")], [ellipse(175,60,15,8,"#a48cac")]),
      difference("apple", [155,155,65,65], "The apple's leaf is missing in Picture 2.", [circle(185,190,13,"#cd7776"),ellipse(194,175,8,4,"#699868")], [circle(185,190,13,"#cd7776")]),
      difference("loft", [280,170,65,60], "The barn's loft window has a crossbar only in Picture 1.", [rect(295,185,30,30,"#eed6ae"),line(310,185,310,215,"#9c6d72",4)], [rect(295,185,30,30,"#eed6ae")]),
      difference("hinge", [350,240,65,65], "The barn door has two hinges in Picture 1 and one in Picture 2.", [rect(375,250,12,5,"#514f55"),rect(375,282,12,5,"#514f55")], [rect(375,250,12,5,"#514f55")]),
      difference("carrot", [230,320,90,65], "The carrot has two leaves in Picture 1 and one in Picture 2.", [polygon("250,350 295,350 270,375","#dfa066"),line(270,350,260,335,"#5e9260",4),line(270,350,282,335,"#5e9260",4)], [polygon("250,350 295,350 270,375","#dfa066"),line(270,350,260,335,"#5e9260",4)])
    ]
  },
  {
    id: "bakery", title: "Morning at the bakery", background: "#f6e8d5",
    shapes: [
      rect(0,290,600,110,"#d2b799"),rect(150,235,300,65,"#c49c7a"),
      rect(140,225,320,15,"#eee0c2"),rect(235,110,150,90,"#a0c6d0"),
      rect(225,100,170,12,"#ab8569"),rect(225,200,170,12,"#ab8569"),
      line(310,110,310,200,"#f4dfbb",6),rect(155,350,275,12,"#f1ddbd"),
      ...[170,245,320,395].map((x) => rect(x,362,12,25,"#f1ddbd"))
    ],
    differences: [
      difference("clock", [25,20,100,100], "The clock's short hand points down instead of right in Picture 2.", [circle(75,70,34,"#fff5dc"),line(75,70,75,46,"#847081",4),line(75,70,97,70,"#847081",4)], [circle(75,70,34,"#fff5dc"),line(75,70,75,46,"#847081",4),line(75,70,75,92,"#847081",4)]),
      difference("sign", [230,15,120,80], "The shop sign shows a heart in Picture 1 and a star in Picture 2.", [rect(240,25,100,60,"#c8949f",{rx:8}),circle(279,47,10,"#fff0cc"),circle(299,47,10,"#fff0cc"),polygon("269,48 309,48 289,73","#fff0cc")], [rect(240,25,100,60,"#c8949f",{rx:8}),star(290,55,"#fff0cc")]),
      difference("apron", [450,35,105,135], "The apron is blue in Picture 1 and green in Picture 2.", [line(480,70,500,50,"#8d7b6f",3),line(500,50,520,70,"#8d7b6f",3),polygon("480,75 520,75 535,155 465,155","#93b7cf")], [line(480,70,500,50,"#8d7b6f",3),line(500,50,520,70,"#8d7b6f",3),polygon("480,75 520,75 535,155 465,155","#97b78a")]),
      difference("cake", [30,265,110,120], "The cake has a cherry only in Picture 1.", [ellipse(85,365,45,9,"#fff0d6"),rect(50,315,70,45,"#e2af97"),rect(50,305,70,15,"#f2d5bf"),circle(85,295,10,"#cb7385")], [ellipse(85,365,45,9,"#fff0d6"),rect(50,315,70,45,"#e2af97"),rect(50,305,70,15,"#f2d5bf")]),
      difference("loaves", [460,285,110,100], "Three loaves become two loaves in Picture 2.", [ellipse(490,340,18,32,"#c99b63"),ellipse(520,340,18,32,"#c99b63"),ellipse(550,340,18,32,"#c99b63")], [ellipse(490,340,18,32,"#c99b63"),ellipse(520,340,18,32,"#c99b63")])
    ],
    challengeDifferences: [
      difference("cookie", [145,30,65,65], "The wall cookie has three chips in Picture 1 and two in Picture 2.", [circle(177,62,21,"#d9b37b"),circle(170,55,3,"#896651"),circle(186,60,3,"#896651"),circle(175,73,3,"#896651")], [circle(177,62,21,"#d9b37b"),circle(170,55,3,"#896651"),circle(186,60,3,"#896651")]),
      difference("mug", [150,155,65,65], "The mug's dot is missing in Picture 2.", [circle(193,190,12,"#b899c6"),rect(160,172,30,35,"#b899c6"),circle(173,187,4,"#fff3df")], [circle(193,190,12,"#b899c6"),rect(160,172,30,35,"#b899c6")]),
      difference("window", [250,120,65,65], "A small bird is missing outside the window in Picture 2.", [line(270,143,280,150,"#6b7b8b",3),line(280,150,290,143,"#6b7b8b",3)], []),
      difference("drawer", [330,240,65,65], "The drawer knob changes from a circle to a square.", [circle(362,270,6,"#826c58")], [rect(356,264,12,12,"#826c58")]),
      difference("biscuit", [250,310,85,65], "The biscuit on the stool has a stripe only in Picture 1.", [ellipse(290,340,22,10,"#dfbb83"),line(280,337,300,337,"#b28b5e",3)], [ellipse(290,340,22,10,"#dfbb83")])
    ]
  },
  {
    id: "camp", title: "Camping under the stars", background: "#435273",
    shapes: [
      rect(0,245,600,155,"#7e9c7d"),...tree(565,200),...tree(195,200),
      polygon("230,300 335,130 440,300","#d1b078"),polygon("280,300 335,190 390,300","#88765c"),
      line(335,130,335,190,"#e9cc94",3),ellipse(300,370,75,12,"#657e67"),
      ...[[160,30],[350,35],[410,110],[230,110],[410,45]].map(([x,y]) => circle(x,y,3,"#f6e8b5"))
    ],
    differences: [
      difference("moon", [25,20,100,100], "The moon has a crater only in Picture 1.", [circle(75,70,32,"#f5e4ad"),circle(65,60,9,"#d1c592")], [circle(75,70,32,"#f5e4ad")]),
      difference("star", [230,15,100,80], "The big star changes from yellow to pink.", [star(280,55,"#f4d879")], [star(280,55,"#d99ab3")]),
      difference("lantern", [450,35,100,130], "The lantern's light is missing in Picture 2.", [line(480,65,500,50,"#c6b89a",4),line(500,50,520,65,"#c6b89a",4),rect(475,70,50,75,"#9bacb0",{rx:5}),rect(485,82,30,50,"#f1d485")], [line(480,65,500,50,"#c6b89a",4),line(500,50,520,65,"#c6b89a",4),rect(475,70,50,75,"#9bacb0",{rx:5}),rect(485,82,30,50,"#677982")]),
      difference("fire", [30,270,110,115], "The campfire has two flames in Picture 1 and one in Picture 2.", [line(50,365,120,340,"#9a7354",9),line(50,340,120,365,"#9a7354",9),polygon("58,343 75,290 88,343","#e5a060"),polygon("85,345 103,305 114,345","#f4cd76")], [line(50,365,120,340,"#9a7354",9),line(50,340,120,365,"#9a7354",9),polygon("58,343 75,290 88,343","#e5a060")]),
      difference("backpack", [450,280,110,105], "The backpack loses its front pocket in Picture 2.", [rect(470,305,65,70,"#b69cc1",{rx:12}),rect(480,335,45,30,"#8d7fa6",{rx:6})], [rect(470,305,65,70,"#b69cc1",{rx:12})])
    ],
    challengeDifferences: [
      difference("shooting-star", [135,60,70,65], "The shooting star has a short tail only in Picture 1.", [line(150,107,185,78,"#d2dce4",3),circle(150,107,5,"#f4e3b2")], [circle(150,107,5,"#f4e3b2")]),
      difference("owl", [155,150,65,65], "The owl has a belly spot only in Picture 1.", [ellipse(187,182,17,22,"#bea791"),circle(180,175,4,"#f5e7cc"),circle(194,175,4,"#f5e7cc"),circle(187,192,5,"#e7d4b8")], [ellipse(187,182,17,22,"#bea791"),circle(180,175,4,"#f5e7cc"),circle(194,175,4,"#f5e7cc")]),
      difference("tent-patch", [260,215,65,65], "The tent patch has a stitch only in Picture 1.", [rect(280,240,20,20,"#c68f77"),line(285,245,295,255,"#f2dab5",2)], [rect(280,240,20,20,"#c68f77")]),
      difference("peg", [350,290,65,65], "The tent peg has two marks in Picture 1 and one in Picture 2.", [line(365,315,395,315,"#c7c1af",6),line(373,311,373,319,"#787d70",2),line(386,311,386,319,"#787d70",2)], [line(365,315,395,315,"#c7c1af",6),line(373,311,373,319,"#787d70",2)]),
      difference("mushroom", [180,320,70,65], "The mushroom has two spots in Picture 1 and one in Picture 2.", [rect(210,348,10,22,"#e5d6b7"),ellipse(215,346,22,12,"#c99087"),circle(207,343,4,"#f5e4cb"),circle(225,346,4,"#f5e4cb")], [rect(210,348,10,22,"#e5d6b7"),ellipse(215,346,22,12,"#c99087"),circle(207,343,4,"#f5e4cb")])
    ]
  },
  {
    id: "winter", title: "Snowy afternoon", background: "#dae9f4",
    shapes: [
      rect(0,250,600,150,"#f4f6ed"),ellipse(300,370,145,18,"#dde6e5"),
      rect(270,185,155,120,"#c4a484"),polygon("250,190 345,110 445,190","#a57d82"),
      polygon("250,190 345,110 445,190 425,190 345,130 270,190","#fff9ed"),
      rect(335,240,35,65,"#8d7766"),rect(375,205,30,30,"#accbd6"),
      ...tree(560,210),ellipse(560,185,40,12,"#f2f5ea")
    ],
    differences: [
      difference("sun", [25,20,100,100], "The winter sun changes from yellow to orange.", [circle(75,70,30,"#efda96")], [circle(75,70,30,"#e9ad7d")]),
      difference("cloud", [230,15,120,85], "The cloud is missing in Picture 2.", cloud(290,65), []),
      difference("snowflake", [450,35,100,115], "The big snowflake loses its diagonal arms in Picture 2.", [line(500,55,500,130,"#fff",6),line(465,92,535,92,"#fff",6),line(475,67,525,117,"#fff",6),line(525,67,475,117,"#fff",6)], [line(500,55,500,130,"#fff",6),line(465,92,535,92,"#fff",6)]),
      difference("snowman", [30,245,110,145], "The snowman's hat is purple in Picture 1 and green in Picture 2.", [circle(85,350,32,"#dbe6e7"),circle(85,300,23,"#dbe6e7"),circle(77,295,3,"#586371"),circle(94,295,3,"#586371"),rect(60,273,50,8,"#987da9"),rect(70,253,30,23,"#987da9")], [circle(85,350,32,"#dbe6e7"),circle(85,300,23,"#dbe6e7"),circle(77,295,3,"#586371"),circle(94,295,3,"#586371"),rect(60,273,50,8,"#729b8b"),rect(70,253,30,23,"#729b8b")]),
      difference("sled", [440,290,115,95], "The sled has three slats in Picture 1 and two in Picture 2.", [line(460,365,540,365,"#92785e",6),rect(465,325,70,8,"#cf9b80"),rect(465,340,70,8,"#cf9b80"),rect(465,355,70,8,"#cf9b80")], [line(460,365,540,365,"#92785e",6),rect(465,325,70,8,"#cf9b80"),rect(465,355,70,8,"#cf9b80")])
    ],
    challengeDifferences: [
      difference("snow-specks", [140,25,65,65], "Three little snow dots become two in Picture 2.", [circle(155,45,4,"#fff"),circle(185,55,4,"#fff"),circle(167,76,4,"#fff")], [circle(155,45,4,"#fff"),circle(185,55,4,"#fff")]),
      difference("mitten", [155,160,70,65], "The mitten has a stripe only in Picture 1.", [rect(175,175,26,34,"#c995a7",{rx:10}),circle(204,194,8,"#c995a7"),rect(175,199,26,5,"#f9ead2")], [rect(175,175,26,34,"#c995a7",{rx:10}),circle(204,194,8,"#c995a7")]),
      difference("window", [270,195,60,65], "The left window has a crossbar only in Picture 1.", [rect(285,210,30,30,"#accbd6"),line(300,210,300,240,"#e7d4b8",4)], [rect(285,210,30,30,"#accbd6")]),
      difference("door", [335,240,65,65], "The door knob is larger in Picture 2.", [circle(359,270,3,"#e6c37c")], [circle(359,270,7,"#e6c37c")]),
      difference("footprints", [210,310,85,65], "There are three footprints in Picture 1 and two in Picture 2.", [ellipse(230,325,6,9,"#b8cbd0"),ellipse(250,345,6,9,"#b8cbd0"),ellipse(275,361,6,9,"#b8cbd0")], [ellipse(230,325,6,9,"#b8cbd0"),ellipse(250,345,6,9,"#b8cbd0")])
    ]
  }
]
