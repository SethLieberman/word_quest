import { Controller } from "@hotwired/stimulus"
import { detectiveSettings, detectiveRound, scoreGuess } from "data/code_detective"
import { ROUND_LENGTH } from "data/code_breaker_puzzles"

export default class extends Controller {
  static targets = ["round", "rule", "secret", "slots", "history", "feedback", "hint", "hintButton", "checkButton", "count", "bar", "fill"]

  connect() {
    this.startRound("easy")
  }

  startRound(level) {
    this.settings = detectiveSettings(level)
    this.level = level
    this.deck = detectiveRound(level)
    this.completed = 0
    this.showPuzzle()
  }

  get secret() {
    return this.deck[this.completed]
  }

  showPuzzle() {
    this.solved = false
    this.finished = false
    this.hintUsed = false
    this.roundTarget.textContent = `CODE ${this.completed + 1} OF ${ROUND_LENGTH}`
    this.ruleTarget.textContent = `Find the secret order of ${this.settings.length} symbols. Choose from ${this.settings.symbols.length} symbols. ${this.settings.repeats ? "Symbols may repeat, including several copies of the same symbol." : "Each symbol can appear only once."} You can make as many guesses as you need.`
    this.secretTarget.textContent = Array(this.settings.length).fill("?").join(" ")
    this.secretTarget.setAttribute("aria-label", `${this.settings.length} hidden symbols`)
    this.historyTarget.replaceChildren()
    this.feedbackTarget.textContent = ""
    this.hintTarget.textContent = ""
    this.hintButtonTarget.disabled = false
    this.checkButtonTarget.textContent = "Check my guess"
    this.slotsTarget.replaceChildren(...Array.from({ length: this.settings.length }, (_, index) => {
      const slot = document.createElement("div")
      const label = document.createElement("label")
      label.textContent = `Position ${index + 1}`
      label.htmlFor = `detective-position-${index + 1}`
      const select = document.createElement("select")
      select.id = label.htmlFor
      select.name = `position-${index + 1}`
      select.setAttribute("aria-describedby", "detective-rule detective-feedback")
      select.append(new Option("Choose a symbol", ""))
      this.settings.symbols.forEach(({ id, symbol, name }) => select.append(new Option(`${symbol} ${name}`, id)))
      slot.append(label, select)
      return slot
    }))
    this.updateProgress()
  }

  focusGuess() {
    this.slotsTarget.querySelector("select").focus()
  }

  hint() {
    if (this.solved || this.hintUsed) return
    this.hintUsed = true
    this.hintButtonTarget.disabled = true
    const symbol = this.settings.symbols.find(({ id }) => id === this.secret[0])
    this.hintTarget.textContent = `Your hint: Position 1 is ${symbol.name} (${symbol.symbol}).`
  }

  check(event) {
    event.preventDefault()
    if (this.finished) {
      this.startRound(this.level)
      this.focusGuess()
      return
    }
    if (this.solved) {
      this.showPuzzle()
      this.focusGuess()
      return
    }
    const selects = [...this.slotsTarget.querySelectorAll("select")]
    const guess = selects.map((select) => select.value)
    selects.forEach((select) => select.removeAttribute("aria-invalid"))
    const empty = guess.indexOf("")
    const duplicate = this.settings.repeats ? -1 : guess.findIndex((id, index) => guess.indexOf(id) !== index)
    if (empty !== -1 || duplicate !== -1) {
      this.feedbackTarget.textContent = empty !== -1
        ? "Choose a symbol for every position before checking your guess."
        : "Use each symbol only once at this level. Choose a different symbol for the repeated position."
      const invalid = selects[empty !== -1 ? empty : duplicate]
      invalid.setAttribute("aria-invalid", "true")
      invalid.focus()
      return
    }
    const { exact, misplaced } = scoreGuess(this.secret, guess)
    const result = `${exact + misplaced} correct symbols: ${exact} in the right position, ${misplaced} in a different position.`
    const entry = document.createElement("li")
    const code = document.createElement("span")
    code.className = "detective-guess"
    code.textContent = guess.map((id) => this.settings.symbols.find((symbol) => symbol.id === id).symbol).join(" ")
    code.setAttribute("role", "img")
    code.setAttribute("aria-label", guess.map((id) => this.settings.symbols.find((symbol) => symbol.id === id).name).join(", "))
    const feedback = document.createElement("p")
    feedback.textContent = result
    entry.append(code, feedback)
    this.historyTarget.append(entry)
    if (exact !== this.settings.length) {
      this.feedbackTarget.textContent = `${result} Use your guess history to plan your next try!`
      this.focusGuess()
      return
    }
    this.secretTarget.textContent = code.textContent
    this.secretTarget.setAttribute("aria-label", `Secret code: ${code.getAttribute("aria-label")}`)
    this.solved = true
    this.completed += 1
    this.finished = this.completed === ROUND_LENGTH
    selects.forEach((select) => { select.disabled = true })
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.textContent = `Code cracked! Great detective work!${this.finished ? " You cracked all ten codes!" : ""}`
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
