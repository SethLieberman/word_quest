import { Controller } from "@hotwired/stimulus"
import { LEVELS, adventureQuestions } from "data/math_questions"

const STORAGE_KEY = "math-quest-progress-v1"
const ADVENTURE_LENGTH = 10

export default class extends Controller {
  static targets = ["level", "round", "expression", "answer", "feedback", "hintButton", "checkButton", "points", "count", "bar", "fill", "goalMessage", "trail", "celebration", "storageNotice", "progressDialog", "progressStats", "helpDialog"]

  connect() {
    this.progress = this.loadProgress()
    this.startAdventure(LEVELS[0].id)
  }

  loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (saved === null) return { total: 0, stars: 0 }
      if (!Number.isSafeInteger(saved.total) || saved.total < 0 ||
          !Number.isSafeInteger(saved.stars) || saved.stars < 0) throw new Error("Invalid saved math progress")
      return saved
    } catch (error) {
      this.storageError("Saved math progress couldn't be loaded. You can still play; this adventure starts fresh.", error)
      return { total: 0, stars: 0 }
    }
  }

  storageError(message, error) {
    console.warn("Math Quest progress:", error)
    this.storageNoticeTarget.textContent = message
    this.storageNoticeTarget.hidden = false
  }

  changeLevel(event) {
    this.startAdventure(event.currentTarget.dataset.level, true)
  }

  startAdventure(level, focus = false) {
    this.difficulty = level
    this.deck = adventureQuestions(level)
    this.completed = 0
    this.levelTargets.forEach((button) => {
      const selected = button.dataset.level === level
      button.classList.toggle("selected", selected)
      button.setAttribute("aria-pressed", String(selected))
    })
    this.nextQuestion(focus)
  }

  nextQuestion(focus = true) {
    this.solved = false
    this.finished = false
    this.hintsUsed = false
    this.question = this.deck[this.completed]
    this.roundTarget.textContent = `QUESTION ${this.completed + 1} OF ${ADVENTURE_LENGTH}`
    this.expressionTarget.textContent = this.question.expression
    this.answerTarget.value = ""
    this.answerTarget.disabled = false
    this.answerTarget.removeAttribute("aria-invalid")
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "feedback"
    this.celebrationTarget.textContent = ""
    this.hintButtonTarget.disabled = false
    this.checkButtonTarget.textContent = "Check my answer"
    this.updateProgress()
    if (focus) this.answerTarget.focus()
  }

  hint() {
    if (this.solved || this.finished) return
    this.hintsUsed = true
    this.feedbackTarget.className = "feedback"
    this.feedbackTarget.textContent = this.question.hint
    this.answerTarget.focus()
  }

  check(event) {
    event.preventDefault()
    if (this.finished) return this.startAdventure(this.difficulty, true)
    if (this.solved) return this.nextQuestion()
    const value = this.answerTarget.value.trim()
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      this.feedbackTarget.textContent = "Enter a whole number, such as 0, 5, or 12."
      this.feedbackTarget.className = "feedback retry"
      this.answerTarget.setAttribute("aria-invalid", "true")
      this.answerTarget.focus()
      return
    }
    if (Number(value) !== this.question.answer) {
      this.feedbackTarget.textContent = "Not quite. Try again — every try helps you grow!"
      this.feedbackTarget.className = "feedback retry"
      this.answerTarget.setAttribute("aria-invalid", "true")
      this.answerTarget.focus()
      this.answerTarget.select()
      return
    }
    this.solved = true
    this.completed += 1
    this.progress.total += 1
    const stars = this.hintsUsed ? 1 : 2
    this.progress.stars += stars
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress))
    } catch (error) {
      this.storageError("Your browser couldn't save math progress. New progress may be lost when you leave.", error)
    }
    this.answerTarget.removeAttribute("aria-invalid")
    this.answerTarget.disabled = true
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.className = "feedback success"
    this.feedbackTarget.textContent = `You did it! ${this.question.answer} is correct — ${stars} ${stars === 1 ? "star" : "stars"} for growing your number power!`
    this.finished = this.completed === ADVENTURE_LENGTH
    this.celebrationTarget.textContent = this.finished ? "Ten answers! Look how you've grown!" : "One step stronger!"
    this.checkButtonTarget.textContent = this.finished ? "Play again" : "Next question"
    if (this.finished) {
      const next = LEVELS[LEVELS.findIndex((level) => level.id === this.difficulty) + 1]
      this.feedbackTarget.textContent += next ?
        ` Ready for a new challenge? Try ${next.name} next!` :
        " Congratulations, you've completed the highest level!"
    }
    this.updateProgress()
    this.checkButtonTarget.focus()
  }

  updateProgress() {
    this.pointsTarget.textContent = `${this.progress.stars} ${this.progress.stars === 1 ? "star" : "stars"}`
    this.countTarget.textContent = this.completed
    this.barTarget.setAttribute("aria-valuenow", this.completed)
    this.fillTarget.style.width = `${this.completed * 10}%`
    this.goalMessageTarget.textContent = this.completed === ADVENTURE_LENGTH ? "Adventure goal complete. You're a growing star!" : "A little practice goes a long way!"
    this.trailTarget.replaceChildren()
    for (let index = 0; index < ADVENTURE_LENGTH; index++) {
      const stop = document.createElement("div")
      stop.className = `trail-stop${index < this.completed ? " complete" : ""}${index === this.completed ? " current" : ""}`
      const circle = document.createElement("span")
      circle.className = "trail-circle"
      circle.textContent = index < this.completed ? "✓" : index + 1
      const label = document.createElement("span")
      label.textContent = index < this.completed ? "Solved!" : index === this.completed ? "You're here" : "Keep going"
      stop.append(circle, label)
      this.trailTarget.append(stop)
    }
  }

  openProgress() {
    this.progressStatsTarget.replaceChildren()
    for (const [value, label] of [[this.progress.total, "questions solved"], [this.progress.stars, "stars earned"]]) {
      const item = document.createElement("div")
      const number = document.createElement("strong")
      number.textContent = value
      const caption = document.createElement("span")
      caption.textContent = label
      item.append(number, caption)
      this.progressStatsTarget.append(item)
    }
    this.progressDialogTarget.showModal()
  }

  openHelp() {
    this.helpDialogTarget.showModal()
  }

  closeDialog(event) {
    event.currentTarget.closest("dialog").close()
  }
}
