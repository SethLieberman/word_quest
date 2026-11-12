import { Controller } from "@hotwired/stimulus"
import { puzzlesFor, ROUND_LENGTH, LEVELS } from "data/code_breaker_puzzles"

export default class extends Controller {
  static targets = ["type", "level", "levelDescription", "cipher", "detective", "round", "rule", "clue", "message", "pattern", "key", "keyNote", "answer", "feedback", "hintButton", "checkButton", "count", "bar", "fill"]

  connect() {
    this.type = "symbols"
    this.level = "easy"
    this.startRound()
  }

  changeType(event) {
    const type = event.currentTarget.value
    if (type === this.type) return
    this.startRound(type, this.level)
  }

  changeLevel(event) {
    const level = event.currentTarget.dataset.level
    if (level === this.level) return
    this.startRound(this.type, level)
  }

  startRound(type = this.type, level = this.level) {
    if (!LEVELS.includes(level)) throw new Error(`Unknown code level: ${level}`)
    this.deck = type === "detective" ? [] : puzzlesFor(type, level)
    this.type = type
    this.level = level
    this.completed = 0
    this.typeTarget.value = this.type
    this.levelTargets.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.level === this.level)))
    const detective = type === "detective"
    const descriptions = detective
      ? ["3 positions, 4 symbols, no repeats", "4 positions, 6 symbols, no repeats", "4 positions, 6 symbols, repeats allowed"]
      : ["Short words and a full key", "Longer words and more decoding", "Short phrases and fewer clues"]
    this.levelDescriptionTargets.forEach((description, index) => { description.textContent = descriptions[index] })
    this.cipherTarget.hidden = detective
    this.detectiveTarget.hidden = !detective
    if (detective) {
      this.application.getControllerForElementAndIdentifier(this.detectiveTarget, "code-detective").startRound(level)
      return
    }
    this.showPuzzle()
  }

  get puzzle() {
    return this.deck[this.completed]
  }

  showPuzzle() {
    this.solved = false
    this.finished = false
    this.hintUsed = false
    this.roundTarget.textContent = `CODE ${this.completed + 1} OF ${ROUND_LENGTH}`
    this.ruleTarget.textContent = this.puzzle.rule
    this.clueTarget.textContent = `Message clue: ${this.puzzle.clue}`
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "code-feedback"
    this.answerTarget.value = ""
    this.answerTarget.disabled = false
    this.answerTarget.removeAttribute("aria-invalid")
    this.hintButtonTarget.disabled = false
    this.checkButtonTarget.textContent = "Check my answer"
    this.messageTarget.replaceChildren(...this.puzzle.words.map((word) => {
      const group = document.createElement("span")
      group.className = "code-word"
      word.forEach(({ code, name }) => {
        const token = document.createElement("span")
        token.className = "code-token"
        token.textContent = code
        token.setAttribute("role", "img")
        token.setAttribute("aria-label", name)
        group.append(token)
      })
      return group
    }))
    this.patternTarget.textContent = `Message length: ${this.puzzle.words.map((word) => `${word.length} letters`).join(" / ")}. Spaces separate words.`
    this.keyTarget.replaceChildren(...this.puzzle.visibleKey.map(({ letter, code, name }) => {
      const entry = document.createElement("li")
      entry.textContent = `${code} = ${letter}`
      entry.setAttribute("aria-label", `${name} means ${letter}`)
      return entry
    }))
    this.keyNoteTarget.textContent = this.level === "hard"
      ? (this.type === "symbols" ? "Partial key: work out the missing letter using the clue." : "No full key at this level. Use the decoding rule above.")
      : "Full key: code on the left, decoded letter on the right."
    this.updateProgress()
  }

  hint() {
    if (this.solved || this.hintUsed) return
    this.hintUsed = true
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.className = "code-feedback"
    this.feedbackTarget.textContent = this.puzzle.hint
  }

  check(event) {
    event.preventDefault()
    if (this.finished) {
      this.startRound()
      this.answerTarget.focus()
      return
    }
    if (this.solved) {
      this.showPuzzle()
      this.answerTarget.focus()
      return
    }
    const answer = this.answerTarget.value.trim().replace(/\s+/g, " ").toUpperCase()
    if (!answer || answer !== this.puzzle.answer) {
      this.feedbackTarget.className = "code-feedback retry"
      this.feedbackTarget.textContent = answer
        ? "Not quite. Check each code and try again. Every try helps you learn!"
        : "Type your decoded message, then check it."
      this.answerTarget.setAttribute("aria-invalid", "true")
      this.answerTarget.focus()
      return
    }
    this.solved = true
    const answerText = this.puzzle.answer
    this.completed += 1
    this.finished = this.completed === ROUND_LENGTH
    this.answerTarget.disabled = true
    this.answerTarget.removeAttribute("aria-invalid")
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.className = "code-feedback success"
    this.feedbackTarget.textContent = `Code cracked! The message is ${answerText}.${this.finished ? " You cracked all ten codes! Try another level or code type." : ""}`
    this.checkButtonTarget.textContent = this.finished ? "Play again" : "Next code"
    this.updateProgress()
    this.checkButtonTarget.focus()
  }

  updateProgress() {
    this.countTarget.textContent = `${this.completed} of ${ROUND_LENGTH} codes cracked`
    this.barTarget.setAttribute("aria-valuenow", this.completed)
    this.fillTarget.style.width = `${this.completed / ROUND_LENGTH * 100}%`
  }
}
