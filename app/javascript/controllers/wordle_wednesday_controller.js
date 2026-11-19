import { Controller } from "@hotwired/stimulus"
import WORDS from "data/wordle_wednesday_words"

const WORD_LENGTH = 5
const MAX_GUESSES = 6

export default class extends Controller {
  static targets = ["round", "rows", "row", "input", "feedback", "hint", "hintButton", "keyboard", "key", "playAgain"]

  connect() {
    this.startRound()
  }

  startRound() {
    const choices = WORDS.filter(({ word }) => word !== this.answer?.word)
    this.answer = choices[Math.floor(Math.random() * choices.length)]
    this.guesses = []
    this.finished = false
    this.hintUsed = false
    this.roundTarget.textContent = "YOUR WORD"
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "wordle-feedback"
    this.hintTarget.textContent = ""
    this.hintButtonTarget.disabled = false
    this.inputTarget.disabled = false
    this.inputTarget.value = ""
    this.inputTarget.removeAttribute("aria-invalid")
    this.playAgainTarget.hidden = true
    this.keyTargets.forEach((key) => {
      key.disabled = false
      key.classList.remove("correct", "present", "absent")
      key.removeAttribute("aria-label")
    })
    this.rowTargets.forEach((row) => {
      row.replaceChildren(...Array.from({ length: WORD_LENGTH }, () => {
        const tile = document.createElement("span")
        tile.className = "wordle-tile"
        tile.setAttribute("role", "gridcell")
        tile.setAttribute("aria-label", "Empty")
        return tile
      }))
    })
  }

  sanitizeInput() {
    this.inputTarget.value = this.inputTarget.value.replace(/[^a-z]/gi, "").slice(0, WORD_LENGTH).toUpperCase()
    this.inputTarget.removeAttribute("aria-invalid")
  }

  pressKey(event) {
    const key = event.currentTarget.dataset.key
    if (this.finished) return

    if (key === "ENTER") {
      this.submitGuess()
    } else if (key === "BACKSPACE") {
      this.inputTarget.value = this.inputTarget.value.slice(0, -1)
      this.inputTarget.focus()
    } else if (this.inputTarget.value.length < WORD_LENGTH) {
      this.inputTarget.value += key
      this.inputTarget.focus()
    }
  }

  submit(event) {
    event.preventDefault()
    this.submitGuess()
  }

  submitGuess() {
    if (this.finished) return

    const guess = this.inputTarget.value.trim().toUpperCase()
    if (!/^[A-Z]{5}$/.test(guess)) {
      this.inputTarget.setAttribute("aria-invalid", "true")
      this.feedbackTarget.className = "wordle-feedback retry"
      this.feedbackTarget.textContent = "Type five letters to make your guess."
      this.inputTarget.focus()
      return
    }

    this.inputTarget.removeAttribute("aria-invalid")
    this.feedbackTarget.textContent = ""
    const row = this.rowTargets[this.guesses.length]
    const marks = this.markGuess(guess)
    const tiles = [...row.children]
    tiles.forEach((tile, index) => {
      tile.textContent = guess[index]
      tile.classList.add(marks[index])
      tile.setAttribute("aria-label", `${guess[index]}, ${this.markLabel(marks[index])}`)
    })
    row.setAttribute("aria-label", `Guess ${this.guesses.length + 1}: ${guess}`)
    this.guesses.push(guess)
    this.inputTarget.value = ""
    this.updateKeyboard(guess, marks)

    if (guess === this.answer.word) {
      this.finish(true)
    } else if (this.guesses.length === MAX_GUESSES) {
      this.finish(false)
    } else {
      this.roundTarget.textContent = `${MAX_GUESSES - this.guesses.length} ${MAX_GUESSES - this.guesses.length === 1 ? "guess" : "guesses"} left`
      this.inputTarget.focus()
    }
  }

  markGuess(guess) {
    const marks = Array(WORD_LENGTH).fill("absent")
    const remaining = {}

    for (const letter of this.answer.word) {
      remaining[letter] = (remaining[letter] || 0) + 1
    }

    for (let index = 0; index < WORD_LENGTH; index += 1) {
      if (guess[index] === this.answer.word[index]) {
        marks[index] = "correct"
        remaining[guess[index]] -= 1
      }
    }
    for (let index = 0; index < WORD_LENGTH; index += 1) {
      if (marks[index] !== "correct" && remaining[guess[index]] > 0) {
        marks[index] = "present"
        remaining[guess[index]] -= 1
      }
    }
    return marks
  }

  updateKeyboard(guess, marks) {
    const priority = { absent: 1, present: 2, correct: 3 }
    guess.split("").forEach((letter, index) => {
      const key = this.keyTargets.find((button) => button.dataset.key === letter)
      const current = ["correct", "present", "absent"].find((mark) => key.classList.contains(mark))
      if (!current || priority[marks[index]] > priority[current]) {
        key.classList.remove("correct", "present", "absent")
        key.classList.add(marks[index])
        key.setAttribute("aria-label", `${letter}, ${this.markLabel(marks[index])}`)
      }
    })
  }

  markLabel(mark) {
    return { correct: "right letter in the right place", present: "right letter in a different place", absent: "not in the word" }[mark]
  }

  hint() {
    if (this.finished || this.hintUsed) return
    this.hintUsed = true
    this.hintButtonTarget.disabled = true
    this.hintTarget.textContent = `Hint: ${this.answer.hint}`
  }

  finish(won) {
    this.finished = true
    this.inputTarget.disabled = true
    this.hintButtonTarget.disabled = true
    this.keyTargets.forEach((key) => { key.disabled = true })
    this.playAgainTarget.hidden = false
    this.feedbackTarget.className = `wordle-feedback ${won ? "success" : "retry"}`
    this.feedbackTarget.textContent = won
      ? `You got it! ${this.answer.word} — ${this.answer.hint}`
      : `Nice try! The word was ${this.answer.word}. ${this.answer.hint}`
    this.roundTarget.textContent = won ? "WORD SOLVED!" : "ROUND COMPLETE"
    this.playAgainTarget.focus()
  }
}
