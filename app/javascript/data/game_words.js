import newDolchWords from "data/new_dolch_words"

const WORDS = {
  easy: [
    ["rabbit", "🐰", "Long ears, a fluffy tail, and a love for hopping!"],
    ["flower", "🌼", "I bloom in the garden and bees visit me."],
    ["turtle", "🐢", "I carry my home on my back."],
    ["rocket", "🚀", "Three, two, one… blast off into space!"],
    ["carrot", "🥕", "An orange vegetable that grows underground."],
    ["pencil", "✏️", "Use me to write, draw, and erase."],
    ["monkey", "🐵", "I swing through the trees with my long arms."],
    ["castle", "🏰", "A grand home with towers fit for royalty."],
    ["cookie", "🍪", "A crunchy baked treat with chocolate chips."],
    ["button", "🔘", "Push me through a little hole to fasten your coat."],
    ...newDolchWords.easy
  ],
  medium: [
    ["dolphin", "🐬", "A playful ocean mammal that leaps above the waves."],
    ["giraffe", "🦒", "My very long neck helps me reach the highest leaves."],
    ["pumpkin", "🎃", "An orange autumn vegetable you can carve into a lantern."],
    ["balloon", "🎈", "Fill me with air and tie me to a party string."],
    ["chicken", "🐔", "A farm bird that lays eggs and says “cluck!”"],
    ["tractor", "🚜", "A farmer drives me to pull heavy tools across a field."],
    ["diamond", "💎", "A sparkling gemstone with a very hard surface."],
    ["rainbow", "🌈", "A colorful arc that appears after the rain."],
    ["penguin", "🐧", "A waddling bird that swims but cannot fly."],
    ["sandwich", "🥪", "Put a tasty filling between two slices of bread."],
    ...newDolchWords.medium
  ],
  hard: [
    ["butterfly", "🦋", "I was a caterpillar. Now I have beautiful wings!"],
    ["elephant", "🐘", "Big ears, a long trunk, and a mighty trumpet!"],
    ["rainbow", "🌈", "A colorful arc that appears after the rain."],
    ["dinosaur", "🦕", "I roamed the Earth millions of years ago."],
    ["strawberry", "🍓", "A red fruit with tiny seeds on the outside."],
    ["penguin", "🐧", "A waddling bird that swims but cannot fly."],
    ["umbrella", "☂️", "Open me up to keep the rain off your head."],
    ["bicycle", "🚲", "Two wheels and pedals take you on an adventure."],
    ["telescope", "🔭", "Look through me to see the stars up close."],
    ["octopus", "🐙", "An ocean animal with eight amazing arms."]
  ],
  advanced: [
    ["beautiful", "🌺", "Something lovely to look at, like a garden full of flowers."],
    ["necessary", "🎒", "Something you must have, not just something you want."],
    ["knowledge", "📚", "The facts and understanding you gain by learning."],
    ["different", "🦓", "Not the same as something else."],
    ["important", "⭐", "Something that matters a great deal."],
    ["adventure", "🗺️", "An exciting journey with new things to discover."],
    ["dangerous", "⚠️", "Something that could cause harm, so you need to be careful."],
    ["surprise", "🎁", "Something unexpected, like a secret birthday gift."],
    ["disappointed", "😞", "How you might feel when something you hoped for does not happen."],
    ["experiment", "🧪", "A scientific test you do to discover how something works."]
  ],
  mastermind: [
    ["ocean", "🌊", "A vast body of salt water covering much of our planet."],
    ["planet", "🪐", "A large round world that travels around a star."],
    ["treasure", "💎", "A collection of valuable things hidden in a pirate's chest."],
    ["earthquake", "🌍", "A sudden shaking of the ground caused by moving rocks deep below."],
    ["lightning", "⚡", "A bright flash of electricity in the sky during a storm."],
    ["telescope", "🔭", "A tool that makes distant stars and planets look closer."],
    ["invisible", "👻", "Something that cannot be seen."],
    ["friendship", "🤝", "The caring bond between people who enjoy being together."],
    ["laboratory", "🧪", "A room where scientists carry out tests and discoveries."],
    ["dictionary", "📖", "A book that explains what words mean and how to spell them."],
    ["mysterious", "🕵️", "Something puzzling that is difficult to explain or understand."]
  ]
}

export default { ...WORDS, jumble: WORDS.mastermind }
