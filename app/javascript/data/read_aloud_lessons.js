import NEW_DOLCH from "data/new_dolch_words"

// Browser speech is an approximation, not a recording of a phoneme.
export const SOUNDS = {
  a: ["ah", "Short a, as in cat"], e: ["eh", "Short e, as in bed"],
  i: ["ih", "Short i, as in pig"], o: ["aw", "Short o, as in dog"],
  u: ["uh", "Short u, as in sun"],
  b: ["buh", "b, as in bed"], c: ["kuh", "c, as in cat"],
  d: ["duh", "d, as in dog"], f: ["fff", "f, as in fan"],
  g: ["guh", "g, as in bug"], h: ["huh", "h, as in hat"],
  j: ["juh", "j, as in jam"], k: ["kuh", "k, as in skip"],
  l: ["lll", "l, as in leg"], m: ["mmm", "m, as in map"],
  n: ["nnn", "n, as in net"], p: ["puh", "p, as in pig"],
  r: ["rrr", "r, as in red"], s: ["sss", "s, as in sun"],
  t: ["tuh", "t, as in top"], v: ["vvv", "v, as in van"],
  w: ["wuh", "w, as in web"], x: ["ks", "x makes k and s together, as in box"],
  sh: ["shh", "sh makes one sound, as in ship"],
  ch: ["ch", "ch makes one sound, as in chip"],
  th: ["th", "th, with your tongue gently between your teeth, as in thin"],
  ck: ["kuh", "ck makes one sound, as in duck"],
  longA: ["ay", "Long a says its name, as in cape"],
  longI: ["eye", "Long i says its name, as in kite"],
  longO: ["oh", "Long o says its name, as in home"],
  longU: ["you", "Long u says its name, as in cube"]
}

function word(text, emoji, clue, groups = [...text]) {
  return { text, emoji, clue, units: groups.map((letters) => ({ letters, sound: letters })) }
}

function silentE(text, emoji, clue, contrast) {
  const entry = word(text, emoji, clue)
  entry.units[1].sound = `long${text[1].toUpperCase()}`
  entry.units[entry.units.length - 1].sound = null
  return { ...entry, contrast }
}

function family(ending, entries) {
  return entries.map(([text, emoji, clue]) => ({ ...word(text, emoji, clue), family: ending }))
}

const beginner = [
  ...NEW_DOLCH.beginner.map((entry) => word(...entry)),
  word("bat", "🦇", "An animal that flies at night."),
  word("dad", "👨", "A friendly name for your father."),
  word("dig", "⛏️", "To make a hole in the ground."),
  word("hop", "🐇", "To make a little jump."),
  word("lid", "🫙", "A cover for the top of a container."),
  word("log", "🪵", "A thick piece of wood from a tree."),
  word("mud", "🟤", "Wet, soft earth."),
  word("nut", "🥜", "A food with a hard shell."),
  word("pin", "📌", "A small pointed tool that holds things in place."),
  word("tap", "👆", "To touch something lightly.")
]

const families = [
  ...family("at", [
    ["cat", "🐈", "A furry pet that says meow."],
    ["hat", "🎩", "You wear this on your head."],
    ["mat", "🧶", "A small covering for a floor."],
    ["sat", "🪑", "Someone sat down on a chair."]
  ]),
  ...family("an", [
    ["can", "🥫", "A metal container for food."],
    ["fan", "🪭", "This moves air to keep you cool."],
    ["man", "🧑", "A grown-up man."],
    ["pan", "🍳", "You can cook food in this."]
  ]),
  ...family("en", [
    ["hen", "🐔", "A chicken that lays eggs."],
    ["men", "🧑‍🤝‍🧑", "More than one man."],
    ["pen", "🖊️", "Something you write with."],
    ["ten", "🔟", "The number after nine."]
  ]),
  ...family("ug", [
    ["bug", "🐞", "A tiny insect."],
    ["hug", "🤗", "Putting your arms around someone."],
    ["mug", "☕", "A cup with a handle."],
    ["rug", "🧶", "A soft covering for a floor."]
  ]),
  ...family("it", [
    ["bit", "🍰", "A small piece of something."],
    ["fit", "🧩", "To be the right size for a space."],
    ["hit", "🥎", "To strike a ball with a bat."],
    ["sit", "🪑", "To rest on a chair."]
  ]),
  ...family("in", [
    ["bin", "🗑️", "A container for storing things or collecting rubbish."],
    ["fin", "🐟", "A part of a fish that helps it swim."],
    ["tin", "🥫", "A metal used to make some containers."]
  ]),
  ...family("op", [
    ["hop", "🐇", "To make a little jump."],
    ["mop", "🧹", "A tool for cleaning a wet floor."],
    ["top", "🔝", "The highest part of something."]
  ])
]

const blends = [
  word("stop", "🛑", "To come to a halt."),
  word("frog", "🐸", "A hopping animal that lives near water."),
  word("flag", "🏳️", "A piece of cloth on a pole."),
  word("clap", "👏", "To bring your hands together."),
  word("drum", "🥁", "An instrument you tap to make music."),
  word("swim", "🏊", "To move through water."),
  word("spin", "🌀", "To turn around and around."),
  word("skip", "🚶", "To move with little steps and hops."),
  word("nest", "🪺", "A bird's home."),
  word("lamp", "💡", "A light for a room."),
  word("hand", "✋", "The part of your arm with fingers."),
  word("tent", "⛺", "A shelter you can sleep in outdoors."),
  word("crab", "🦀", "An animal with claws that lives near water."),
  word("grin", "😁", "A wide smile."),
  word("trip", "🧳", "A journey to another place."),
  word("plug", "🔌", "Something that fits into a socket."),
  word("sled", "🛷", "You can ride this down a snowy hill."),
  word("snap", "🫰", "To make a quick clicking sound with your fingers."),
  word("spot", "🔴", "A small round mark."),
  word("step", "👣", "One movement of your foot when you walk."),
  word("bend", "↪️", "To make something curve or turn."),
  word("pond", "🏞️", "A small area of still water.")
]

const digraphs = [
  word("ship", "🚢", "A large boat.", ["sh", "i", "p"]),
  word("shop", "🏪", "A place where you can buy things.", ["sh", "o", "p"]),
  word("fish", "🐟", "An animal that swims.", ["f", "i", "sh"]),
  word("dish", "🍽️", "You can put food on this.", ["d", "i", "sh"]),
  word("chip", "🥔", "A thin, crisp piece of potato.", ["ch", "i", "p"]),
  word("chin", "🙂", "The part of your face below your mouth.", ["ch", "i", "n"]),
  word("chop", "🥕", "To cut food into pieces.", ["ch", "o", "p"]),
  word("much", "📚", "A large amount of something.", ["m", "u", "ch"]),
  word("thin", "📏", "Not thick.", ["th", "i", "n"]),
  word("bath", "🛁", "You can wash yourself in this.", ["b", "a", "th"]),
  word("duck", "🦆", "A bird that swims.", ["d", "u", "ck"]),
  word("sock", "🧦", "You wear this on your foot.", ["s", "o", "ck"]),
  word("shed", "🏡", "A small building for keeping tools.", ["sh", "e", "d"]),
  word("shut", "🚪", "To close something.", ["sh", "u", "t"]),
  word("rush", "🏃", "To move or do something quickly.", ["r", "u", "sh"]),
  word("cash", "💵", "Money in coins or notes.", ["c", "a", "sh"]),
  word("chat", "💬", "To talk with someone.", ["ch", "a", "t"]),
  word("rich", "💰", "Having a lot of money.", ["r", "i", "ch"]),
  word("math", "➕", "Learning about numbers and shapes.", ["m", "a", "th"]),
  word("moth", "🦋", "An insect with wings that often flies at night.", ["m", "o", "th"]),
  word("rock", "🪨", "A hard piece of stone.", ["r", "o", "ck"]),
  word("lock", "🔒", "Something that keeps a door or box closed.", ["l", "o", "ck"])
]

const silentWords = [
  silentE("cape", "🦸", "A loose piece of clothing worn over your shoulders.", "cap"),
  silentE("tape", "🩹", "A sticky strip that holds things together.", "tap"),
  silentE("made", "🛠️", "Created or built something.", "mad"),
  silentE("name", "🏷️", "What someone or something is called.", null),
  silentE("kite", "🪁", "You can fly this on a windy day.", "kit"),
  silentE("pine", "🌲", "A tree with needles instead of flat leaves.", "pin"),
  silentE("ride", "🚲", "To travel on a bike or horse.", "rid"),
  silentE("time", "🕒", "We use a clock to tell this.", null),
  silentE("home", "🏠", "The place where you live.", null),
  silentE("rope", "🪢", "A thick cord you can tie.", null),
  silentE("hope", "🌟", "To wish that something good will happen.", "hop"),
  silentE("cube", "🧊", "A solid shape with six square faces.", "cub"),
  silentE("bake", "🍞", "To cook food in an oven.", null),
  silentE("lake", "🏞️", "A large area of water surrounded by land.", null),
  silentE("rake", "🍂", "A garden tool for gathering leaves.", null),
  silentE("gate", "🚪", "A door in a fence.", null),
  silentE("late", "🕒", "After the expected time.", null),
  silentE("dime", "🪙", "A coin worth ten cents.", "dim"),
  silentE("lime", "🍋‍🟩", "A green citrus fruit.", null),
  silentE("fine", "👍", "Doing well or feeling okay.", "fin"),
  silentE("cone", "🍦", "A pointed holder for ice cream.", "con"),
  silentE("tube", "🧪", "A long hollow container.", "tub")
]

const sentences = [
  ["a red hat", "🎩", "Start with a short phrase."],
  ["a big pig", "🐖", "Read these three words together."],
  ["a wet dog", "🐕", "Read these three words together."],
  ["The cat sat.", "🐈", "Picture a cat sitting down."],
  ["The bug is in a cup.", "🐞", "Where is the bug?"],
  ["I can clap.", "👏", "Read it, then try it!"],
  ["The frog can swim.", "🐸", "What can the frog do?"],
  ["The fish is in a dish.", "🐟", "Find the two words with sh."],
  ["The kite is red.", "🪁", "What color is the kite?"],
  ["I can ride a bike.", "🚲", "Find the two words with silent e."],
  ["a hot pan", "🍳", "Read these three words together."],
  ["a small step", "👣", "Find the blend in step."],
  ["The hen is in a pen.", "🐔", "Find the two words that rhyme."],
  ["The dog can hop.", "🐕", "What can the dog do?"],
  ["I can dig in mud.", "⛏️", "What can you dig in?"],
  ["The crab is on a rock.", "🦀", "Find the word with ck."],
  ["The moth is in the shed.", "🦋", "Find the words with th and sh."],
  ["I can shut the gate.", "🚪", "Which word ends with a silent e?"],
  ["The kite is in a tree.", "🪁", "Ask an adult about ee in tree."],
  ["I can bake a cake.", "🍰", "Find the two words with silent e."]
].map(([text, emoji, clue]) => ({
  text, emoji, clue,
  units: text.split(" ").map((letters) => ({ letters, sound: null }))
}))

const easyWords = [
  ...NEW_DOLCH.easy,
  ["basket", "🧺", "A container you can use to carry things."],
  ["button", "🔘", "A small fastener on clothing, or something you press."],
  ["candle", "🕯️", "A stick of wax with a wick that can burn."],
  ["carrot", "🥕", "A crunchy orange vegetable that grows underground."],
  ["coffee", "☕", "A drink made from roasted beans."],
  ["helmet", "⛑️", "A hard hat that protects your head."],
  ["kitten", "🐈", "A young cat."],
  ["planet", "🪐", "A large round object that travels around a star."],
  ["rocket", "🚀", "A vehicle that can travel into space."],
  ["tomato", "🍅", "A juicy red fruit often used in salads."]
]

const mediumWords = [
  ...NEW_DOLCH.medium,
  ["balloon", "🎈", "A colorful bag that you fill with air."],
  ["blanket", "🛌", "A soft covering that keeps you warm."],
  ["chicken", "🐔", "A farm bird that can lay eggs."],
  ["dolphin", "🐬", "A mammal that swims in the sea."],
  ["hamster", "🐹", "A small furry pet with round cheeks."],
  ["journey", "🧳", "Travel from one place to another."],
  ["library", "📚", "A place where you can borrow books."],
  ["pancake", "🥞", "A flat cake cooked in a pan."],
  ["rainbow", "🌈", "An arc of colors in the sky after rain."],
  ["tractor", "🚜", "A farm vehicle used to pull equipment."]
]

export const LESSONS = {
  beginner: { label: "Beginning words", help: "Short vowels: hear each letter group, slide the sounds together, then read the word.", entries: beginner, phonics: true },
  families: { label: "Word families", help: "Keep the ending. Change the first sound: cat, hat, mat, sat.", entries: families, phonics: true },
  blends: { label: "Blends", help: "In a blend, you can still hear each consonant: s-t in stop and f-r in frog.", entries: blends, phonics: true },
  digraphs: { label: "Two-letter sounds", help: "Two letters can work together: sh, ch, th, and ck. Keep each pair together.", entries: digraphs, phonics: true },
  silent_e: { label: "Silent e", help: "The final e stays quiet and helps the vowel say its name: cap becomes cape.", entries: silentWords, phonics: true },
  sentences: { label: "Phrases & sentences", help: "Tap a word to hear it. Hear each word, then read the whole sentence. Ask an adult about helper words a, the, I, and is.", entries: sentences, phonics: false },
  easy: { label: "Easy words", help: "Longer familiar words. Hear the whole word and ask an adult to help with unfamiliar spelling patterns.", entries: easyWords.map(([text, emoji, clue]) => ({ text, emoji, clue, units: [{ letters: text, sound: null }] })), phonics: false },
  medium: { label: "Medium words", help: "Build confidence with longer words. Hear the whole word before trying it yourself.", entries: mediumWords.map(([text, emoji, clue]) => ({ text, emoji, clue, units: [{ letters: text, sound: null }] })), phonics: false }
}
