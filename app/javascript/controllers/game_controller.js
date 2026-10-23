import { Controller } from "@hotwired/stimulus"

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
    ["button", "🔘", "Push me through a little hole to fasten your coat."]
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
    ["sandwich", "🥪", "Put a tasty filling between two slices of bread."]
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
const STORAGE_KEY = "word-quest-progress-v1"
const EMPTY_PROGRESS = () => ({ total: 0, stars: 0, days: {} })

function shuffle(items) {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[randomIndex]] = [result[randomIndex], result[index]]
  }
  return result
}

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default class extends Controller {
  static targets = ["level", "round", "points", "scene", "frog", "emoji", "prompt", "clue", "slots", "choices", "chooseLabel", "feedback", "hintButton", "checkButton", "goalCount", "goalBar", "goalFill", "goalMessage", "garden", "gardenMessage", "celebration", "trail", "trailCount", "streak", "soundButton", "storageNotice", "progressDialog", "helpDialog", "progressStats"]

  connect() {
    this.progress = this.loadProgress()
    this.sound = false
    this.keyHandler = this.handleKey.bind(this)
    document.addEventListener("keydown", this.keyHandler)
    this.startAdventure("easy", true)
  }

  disconnect() {
    document.removeEventListener("keydown", this.keyHandler)
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
  }

  loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (saved === null) return EMPTY_PROGRESS()
      if (!Number.isInteger(saved.total) || saved.total < 0 || !Number.isInteger(saved.stars) || saved.stars < 0 ||
          !saved.days || typeof saved.days !== "object" || Array.isArray(saved.days) ||
          !Object.entries(saved.days).every(([day, count]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isInteger(count) && count >= 0)) {
        throw new Error("Invalid saved progress")
      }
      return saved
    } catch (error) {
      this.showStorageError("Saved progress couldn't be loaded. You can still play; this adventure starts fresh.", error)
      return EMPTY_PROGRESS()
    }
  }

  showStorageError(message, error) {
    console.warn("Word Quest progress:", error)
    this.storageNoticeTarget.textContent = message
    this.storageNoticeTarget.hidden = false
  }

  changeLevel(event) {
    this.startAdventure(event.currentTarget.dataset.level)
  }

  startAdventure(level, firstVisit = false) {
    this.difficulty = level
    const bank = shuffle(WORDS[level])
    this.deck = firstVisit ? [WORDS.easy[0], ...bank.filter((entry) => entry !== WORDS.easy[0]).slice(0, 4)] : bank.slice(0, 5)
    this.completed = []
    this.levelTargets.forEach((button) => {
      const selected = button.dataset.level === level
      button.classList.toggle("selected", selected)
      button.setAttribute("aria-pressed", String(selected))
    })
    this.nextPuzzle()
  }

  nextPuzzle() {
    this.celebrationTarget.replaceChildren()
    this.solved = false
    this.finished = false
    this.hintsUsed = false
    this.entry = this.deck[this.completed.length]
    const [word, emoji, clue] = this.entry
    const missingCount = this.difficulty === "mastermind" ? word.length - 2 : { easy: 1, medium: 2, hard: 3, advanced: 4 }[this.difficulty]
    this.missing = shuffle(Array.from({ length: word.length }, (_, index) => index)).slice(0, missingCount).sort((a, b) => a - b)
    if (word === "rabbit" && this.completed.length === 0 && this.difficulty === "easy") this.missing = [2]
    this.answers = {}
    this.activeSlot = this.missing[0]
    const required = [...new Set(this.missing.map((index) => word[index]))]
    const distractors = shuffle([..."aeioubcdhlmnprst"].filter((letter) => !required.includes(letter)))
    this.letters = shuffle([...required, ...distractors.slice(0, Math.max(4, required.length + 1) - required.length)])
    this.frogTarget.toggleAttribute("hidden", word !== "frog")
    this.emojiTarget.hidden = word === "frog"
    this.emojiTarget.textContent = emoji
    this.sceneTarget.setAttribute("aria-label", `Picture clue: ${word}`)
    this.promptTarget.textContent = this.difficulty === "mastermind" ? "Two letters. Can you solve the rest?" :
      missingCount === 1 ? "What’s the missing letter?" : "What are the missing letters?"
    this.clueTarget.textContent = clue
    this.roundTarget.textContent = `WORD ${this.completed.length + 1} OF 5`
    this.chooseLabelTarget.textContent = missingCount === 1 ? "PICK A LETTER TO COMPLETE THE WORD" : "PICK LETTERS TO COMPLETE THE WORD"
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "feedback"
    this.hintButtonTarget.disabled = false
    this.checkButtonTarget.innerHTML = 'Check my word <span aria-hidden="true">→</span>'
    this.renderSlots()
    this.renderChoices()
    this.updateProgress()
  }

  renderSlots(focus = false) {
    const previousScroll = this.slotsTarget.scrollLeft
    this.slotsTarget.replaceChildren()
    ;[...this.entry[0]].forEach((letter, index) => {
      const missing = this.missing.includes(index)
      const tile = document.createElement(missing ? "button" : "span")
      tile.className = `letter-slot${missing ? " missing" : ""}${missing && index === this.activeSlot && !this.solved ? " focused" : ""}${this.solved ? " solved" : ""}`
      tile.textContent = missing ? (this.answers[index] || "").toUpperCase() : letter.toUpperCase()
      if (missing) {
        tile.type = "button"
        tile.disabled = this.solved
        tile.setAttribute("aria-label", `Missing letter ${index + 1}${this.answers[index] ? `: ${this.answers[index].toUpperCase()}` : ""}`)
        tile.setAttribute("aria-pressed", String(index === this.activeSlot))
        tile.addEventListener("click", () => { this.activeSlot = index; this.renderSlots(true) })
      }
      this.slotsTarget.append(tile)
    })
    this.slotsTarget.scrollLeft = previousScroll
    const activeTile = this.slotsTarget.children[this.activeSlot]
    if (!this.solved && window.matchMedia("(min-width: 801px)").matches && activeTile) {
      const container = this.slotsTarget.getBoundingClientRect()
      const tile = activeTile.getBoundingClientRect()
      if (tile.left < container.left || tile.right > container.right) {
        this.slotsTarget.scrollLeft += tile.left - container.left - (container.width - tile.width) / 2
      }
    }
    this.checkButtonTarget.disabled = !this.solved && !this.missing.every((index) => this.answers[index])
    if (focus) this.slotsTarget.children[this.activeSlot]?.focus()
  }

  renderChoices() {
    this.choicesTarget.replaceChildren()
    this.letters.forEach((letter) => {
      const button = document.createElement("button")
      button.className = "letter-choice"
      button.textContent = letter.toUpperCase()
      button.setAttribute("aria-label", `Choose ${letter.toUpperCase()}`)
      button.disabled = this.solved
      button.addEventListener("click", () => this.chooseLetter(letter))
      this.choicesTarget.append(button)
    })
  }

  chooseLetter(letter) {
    if (this.solved || this.finished) return
    this.answers[this.activeSlot] = letter
    this.activeSlot = this.missing.find((index) => !this.answers[index]) ?? this.activeSlot
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "feedback"
    this.renderSlots()
  }

  handleKey(event) {
    if (this.progressDialogTarget.open || this.helpDialogTarget.open || event.ctrlKey || event.metaKey || event.altKey) return
    const isLevelButton = event.target.closest("[data-game-target='level']")
    if (event.key === "Enter" && event.target.closest("button, a") &&
        !event.target.matches(".letter-slot, .letter-choice") &&
        !(isLevelButton && !this.checkButtonTarget.disabled)) return
    if (event.key === "Enter") {
      event.preventDefault()
      this.check()
    } else if (!this.solved && !this.finished && /^[a-z]$/i.test(event.key)) {
      event.preventDefault()
      this.chooseLetter(event.key.toLowerCase())
    } else if (!this.solved && !this.finished && event.key === "Backspace") {
      event.preventDefault()
      if (!this.answers[this.activeSlot]) {
        this.activeSlot = [...this.missing].reverse().find((index) => index < this.activeSlot) ?? this.activeSlot
      }
      delete this.answers[this.activeSlot]
      this.renderSlots()
    }
  }

  hint() {
    if (this.solved || this.finished) return
    const index = this.missing.find((position) => this.answers[position] !== this.entry[0][position])
    if (index === undefined) {
      this.feedbackTarget.textContent = "Looking good! Check your word to see."
      return
    }
    this.hintsUsed = true
    this.answers[index] = this.entry[0][index]
    this.activeSlot = this.missing.find((position) => !this.answers[position]) ?? index
    this.feedbackTarget.textContent = `A little help: ${this.entry[0][index].toUpperCase()} belongs in space ${index + 1}.`
    this.renderSlots()
  }

  check() {
    if (this.finished) return this.startAdventure(this.difficulty)
    if (this.solved) return this.nextPuzzle()
    if (!this.missing.every((index) => this.answers[index])) return
    if (!this.missing.every((index) => this.answers[index] === this.entry[0][index])) {
      this.feedbackTarget.textContent = "Not quite, little explorer. Try another letter — you've got this!"
      this.feedbackTarget.className = "feedback retry"
      this.activeSlot = this.missing.find((index) => this.answers[index] !== this.entry[0][index])
      this.renderSlots()
      return
    }
    this.solved = true
    this.completed.push(this.entry)
    this.progress.total += 1
    this.progress.stars += this.hintsUsed ? 1 : 2
    this.progress.days[today()] = (this.progress.days[today()] || 0) + 1
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress))
    } catch (error) {
      this.showStorageError("Your browser couldn't save progress. You can keep playing, but new progress may be lost when you leave.", error)
    }
    this.feedbackTarget.className = "feedback success"
    this.feedbackTarget.textContent = `You did it! ${this.entry[0].toUpperCase()} — ${this.hintsUsed ? "1 star" : "2 stars"} for growing your word power!`
    this.hintButtonTarget.disabled = true
    this.renderSlots()
    this.renderChoices()
    this.updateProgress(true)
    if (this.sound) this.speak()
    if (this.completed.length === 5) {
      this.finished = true
      this.promptTarget.textContent = "Look how far you've grown!"
      this.clueTarget.textContent = "Five words discovered. A whole adventure completed!"
      this.checkButtonTarget.innerHTML = 'Play again <span aria-hidden="true">↻</span>'
    } else {
      this.checkButtonTarget.innerHTML = 'Next word <span aria-hidden="true">→</span>'
    }
    this.checkButtonTarget.focus()
  }

  updateProgress(celebrate = false) {
    const count = Math.min(this.progress.days[today()] || 0, 5)
    this.goalCountTarget.textContent = count
    this.goalFillTarget.style.width = `${count * 20}%`
    this.goalBarTarget.setAttribute("aria-valuenow", count)
    this.goalMessageTarget.textContent = count === 5 ? "Daily goal complete. You're a growing star!" : "A little practice goes a long way!"
    const stages = ["A tiny seed, a big adventure!", "Your seed has sprouted!", "Look! Your first leaves!", "Growing taller with every word!", "A little bud, ready to bloom!", "Your word garden is in full bloom!"]
    const previousGrowth = Number(this.gardenTarget.dataset.growth || 0)
    this.gardenTarget.dataset.growth = count
    this.gardenTarget.setAttribute("aria-label", `Daily word garden: ${count} of 5 words. ${stages[count]}`)
    this.gardenMessageTarget.textContent = stages[count]
    this.gardenTarget.querySelectorAll("[data-stage]").forEach((part) => {
      const stage = Number(part.dataset.stage)
      part.toggleAttribute("hidden", stage > count)
      part.classList.toggle("just-grown", celebrate && stage === count && count > previousGrowth)
    })
    this.pointsTarget.textContent = `${this.progress.stars} ${this.progress.stars === 1 ? "star" : "stars"}`
    this.trailCountTarget.textContent = `${this.completed.length} of 5 discovered`
    this.trailTarget.replaceChildren()
    for (let index = 0; index < 5; index++) {
      const item = document.createElement("div")
      item.className = `trail-stop${index < this.completed.length ? " complete" : ""}${index === this.completed.length ? " current" : ""}${celebrate && index === this.completed.length - 1 ? " just-discovered" : ""}`
      const circle = document.createElement("span")
      circle.className = "trail-circle"
      circle.textContent = this.completed[index]?.[1] || (index === 4 ? "⚑" : index + 1)
      const label = document.createElement("span")
      label.textContent = this.completed[index]?.[0] || (index === this.completed.length ? "You're here" : index === 4 ? "You did it!" : "Keep going")
      item.append(circle, label)
      this.trailTarget.append(item)
    }
    this.streakTarget.textContent = `${this.streakCount()} day streak`
    if (celebrate) this.celebrate()
  }

  celebrate() {
    this.celebrationTarget.replaceChildren()
    const finale = this.completed.length === 5
    this.celebrationTarget.dataset.finale = String(finale)
    const message = document.createElement("strong")
    message.className = "celebration-message"
    message.textContent = finale ? "🌻 Five words! You bloomed!" : "🌱 One word stronger!"
    this.celebrationTarget.append(message)
    const confetti = document.createElement("span")
    confetti.className = "confetti"
    confetti.setAttribute("aria-hidden", "true")
    for (let index = 0; index < (finale ? 24 : 12); index++) {
      const piece = document.createElement("span")
      piece.className = "confetti-piece"
      piece.textContent = ["✦", "●", "✿"][index % 3]
      piece.style.setProperty("--x", `${(index + 0.5) / (finale ? 24 : 12) * 100}%`)
      piece.style.setProperty("--delay", `${index % 5 * 0.07}s`)
      piece.style.setProperty("--color", ["#9bb887", "#b39bd1", "#dfbd71", "#dca49b"][index % 4])
      confetti.append(piece)
    }
    this.celebrationTarget.append(confetti)
  }

  streakCount() {
    const date = new Date()
    if (!this.progress.days[today()]) date.setDate(date.getDate() - 1)
    let count = 0
    while (this.progress.days[`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`]) {
      count += 1
      date.setDate(date.getDate() - 1)
    }
    return count
  }

  toggleSound() {
    if (!("speechSynthesis" in window)) {
      this.feedbackTarget.textContent = "Spoken words aren't available in this browser. You can still play without sound."
      return
    }
    this.sound = !this.sound
    this.soundButtonTarget.setAttribute("aria-pressed", String(this.sound))
    this.soundButtonTarget.setAttribute("aria-label", `Turn spoken words ${this.sound ? "off" : "on"}`)
    this.soundButtonTarget.classList.toggle("sound-on", this.sound)
    if (!this.sound) window.speechSynthesis.cancel()
    if (this.sound && this.solved) this.speak()
  }

  speak() {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(this.entry[0])
    utterance.lang = "en-US"
    utterance.rate = 0.75
    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") {
        this.feedbackTarget.textContent = "Your word is correct! Audio couldn't play on this device."
      }
    }
    window.speechSynthesis.speak(utterance)
  }

  openProgress() {
    this.progressStatsTarget.replaceChildren()
    ;[[this.progress.total, "words discovered"], [this.progress.stars, "stars collected"], [this.streakCount(), "day streak"]].forEach(([value, label]) => {
      const stat = document.createElement("div")
      const number = document.createElement("strong")
      number.textContent = value
      const text = document.createElement("span")
      text.textContent = label
      stat.append(number, text)
      this.progressStatsTarget.append(stat)
    })
    this.progressDialogTarget.showModal()
  }

  openHelp() {
    this.helpDialogTarget.showModal()
  }

  closeDialog(event) {
    event.currentTarget.closest("dialog").close()
  }
}
