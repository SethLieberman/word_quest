export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
export const ROUND_LENGTH = 10
export const TYPES = ["symbols", "numbers", "shifts"]
export const LEVELS = ["easy", "medium", "hard"]

const SYMBOLS = [
  ["★", "star"], ["●", "filled circle"], ["▲", "filled triangle"], ["■", "filled square"],
  ["◆", "filled diamond"], ["♥", "heart"], ["☀", "sun"], ["☁", "cloud"],
  ["☂", "umbrella"], ["☾", "moon"], ["♫", "music notes"], ["✿", "flower"],
  ["✦", "four-pointed star"], ["○", "open circle"], ["△", "open triangle"],
  ["□", "open square"], ["◇", "open diamond"], ["♡", "open heart"],
  ["☘", "shamrock"], ["☯", "yin-yang"], ["♠", "spade"], ["♣", "club"],
  ["♦", "diamond suit"], ["♟", "chess pawn"], ["⚑", "flag"], ["⚓", "anchor"]
]

const MESSAGES = {
  easy: [
    ["CAT", "An animal that meows."], ["DOG", "An animal that barks."],
    ["SUN", "Our daytime star."], ["HAT", "You wear this on your head."],
    ["BUS", "A large vehicle that carries people."], ["CUP", "You can drink water from this."],
    ["PIG", "A farm animal that oinks."], ["BED", "A place to sleep."],
    ["FOX", "An animal with a bushy tail."], ["MAP", "It shows where places are."]
  ],
  medium: [
    ["RABBIT", "An animal with long ears that hops."], ["GARDEN", "A place to grow flowers and vegetables."],
    ["PLANET", "Earth is one of these."], ["ROCKET", "A vehicle that travels into space."],
    ["BASKET", "A container you might take on a picnic."], ["PENCIL", "You write with this and can erase it."],
    ["TURTLE", "An animal that carries a shell on its back."], ["WINTER", "The season after fall."],
    ["FLOWER", "The colorful part of many plants."], ["BRIDGE", "A structure that helps you cross a river."]
  ],
  hard: [
    ["READ A BOOK", "Open a story and enjoy its pages."], ["PLANT A SEED", "Begin growing a new plant."],
    ["FOLLOW THE MAP", "Use a drawing of places to find your way."], ["LOOK AT THE STARS", "Watch the bright points in the night sky."],
    ["SHARE A SMILE", "Give someone a happy, friendly expression."], ["HELP A FRIEND", "Give someone you like a helping hand."],
    ["EXPLORE THE PARK", "Discover the paths and trees in a public green space."], ["BUILD A BRIDGE", "Make a way to cross a river."],
    ["SOLVE THE PUZZLE", "Work out the answer to a tricky challenge."], ["FIND THE TREASURE", "Discover the hidden prize."]
  ]
}

export function puzzlesFor(type, level) {
  if (!TYPES.includes(type)) throw new Error(`Unknown code type: ${type}`)
  if (!LEVELS.includes(level)) throw new Error(`Unknown code level: ${level}`)

  return MESSAGES[level].map(([answer, clue], index) => {
    const shift = level === "easy" ? 1 : level === "medium" ? 3 : 7 + index
    const key = [...ALPHABET].map((letter, position) => {
      if (type === "numbers") {
        const code = String(level === "hard" ? 26 - position : position + 1)
        return { letter, code, name: code }
      }
      if (type === "shifts") {
        const code = ALPHABET[(position + shift) % 26]
        return { letter, code, name: code }
      }
      const [code, name] = SYMBOLS[(position + index) % SYMBOLS.length]
      return { letter, code, name }
    })
    const words = answer.split(" ").map((word) => [...word].map((letter) => key[ALPHABET.indexOf(letter)]))
    const missingLetter = answer[0]
    const visibleKey = level !== "hard" ? key
      : type === "symbols" ? key.filter(({ letter }) => answer.includes(letter) && letter !== missingLetter)
      : []
    const rule = type === "symbols"
      ? (level === "hard"
        ? "Each symbol always stands for the same letter. One letter is missing from the key. Use the clue and repeated symbols to work it out."
        : "Each symbol stands for a letter. Find each symbol in the key to read the message.")
      : type === "numbers"
        ? (level === "hard"
          ? "Count backward through the alphabet: Z = 1, Y = 2, all the way to A = 26. The full key is hidden."
          : "Count forward through the alphabet: A = 1, B = 2, all the way to Z = 26.")
        : `The message was encoded by moving each letter ${shift} ${shift === 1 ? "step" : "steps"} forward. Decode by moving ${shift} ${shift === 1 ? "step" : "steps"} backward. Wrap from A to Z.`
    const first = key[ALPHABET.indexOf(missingLetter)]
    return {
      id: `${type}-${level}-${index + 1}`, answer, clue, words, key, visibleKey, rule,
      hint: `The first code, ${first.code} (${first.name}), means ${first.letter}. The message starts with ${first.letter}.`
    }
  })
}
