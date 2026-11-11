import { Controller } from "@hotwired/stimulus"
import { GRADES, ROUND_LENGTH, adventureQuestions, shuffled } from "data/trivia_questions"

const STORAGE_KEY = "trivia-progress-v1"
export const COMPUTER_DIFFICULTIES = { easy: 0.4, medium: 0.65, hard: 0.85 }

export function computerAnswer(question, difficulty) {
  if (!Object.hasOwn(COMPUTER_DIFFICULTIES, difficulty)) throw new Error(`Unknown computer difficulty: ${difficulty}`)
  return Math.random() < COMPUTER_DIFFICULTIES[difficulty]
    ? question.answer
    : shuffled(question.choices.filter((choice) => choice !== question.answer))[0]
}

export default class extends Controller {
  static targets = ["level", "mode", "difficulty", "computerOptions", "scoreboard", "playerScore", "computerScore", "computerFeedback", "matchResult", "round", "category", "question", "choices", "feedback", "hintButton", "checkButton", "points", "count", "bar", "fill", "goalMessage", "trail", "storageNotice", "progressDialog", "progressStats", "helpDialog"]

  connect() {
    this.progress = this.loadProgress()
    this.mode = "solo"
    this.computerDifficulty = "easy"
    this.startAdventure(GRADES[0])
  }

  loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
      if (saved === null) return { total: 0, stars: 0 }
      if (!Number.isSafeInteger(saved.total) || saved.total < 0 ||
          !Number.isSafeInteger(saved.stars) || saved.stars < 0) throw new Error("Invalid saved trivia progress")
      return { total: saved.total, stars: saved.stars }
    } catch (error) {
      this.storageError("Saved trivia progress couldn't be loaded. You can still play; this round starts fresh.", error)
      return { total: 0, stars: 0 }
    }
  }

  storageError(message, error) {
    console.warn("Trivia progress:", error)
    this.storageNoticeTarget.textContent = message
    this.storageNoticeTarget.hidden = false
  }

  changeLevel(event) {
    this.startAdventure(Number(event.currentTarget.dataset.grade), true)
  }

  changeMode(event) {
    this.mode = event.currentTarget.dataset.mode
    this.startAdventure(this.grade)
  }

  changeDifficulty(event) {
    this.computerDifficulty = event.currentTarget.value
    this.startAdventure(this.grade)
  }

  get againstComputer() {
    return this.mode === "computer"
  }

  startAdventure(grade, focus = false) {
    this.grade = grade
    this.deck = adventureQuestions(grade)
    this.completed = 0
    this.playerScore = 0
    this.computerScore = 0
    this.results = []
    this.matchResultTarget.textContent = ""
    this.modeTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === this.mode))
    })
    this.difficultyTarget.value = this.computerDifficulty
    this.computerOptionsTarget.hidden = !this.againstComputer
    this.scoreboardTarget.hidden = !this.againstComputer
    this.levelTargets.forEach((button) => {
      const selected = Number(button.dataset.grade) === grade
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
    this.roundTarget.textContent = `QUESTION ${this.completed + 1} OF ${ROUND_LENGTH}`
    this.categoryTarget.textContent = `GRADE ${this.grade} · ${this.question.category}`
    this.questionTarget.textContent = this.question.prompt
    this.feedbackTarget.textContent = ""
    this.feedbackTarget.className = "feedback"
    this.computerFeedbackTarget.textContent = ""
    this.computerFeedbackTarget.hidden = !this.againstComputer
    this.hintButtonTarget.disabled = false
    this.checkButtonTarget.textContent = "Check my answer"
    this.choicesTarget.replaceChildren(...shuffled(this.question.choices).map((choice, index) => {
      const label = document.createElement("label")
      label.className = "trivia-choice"
      const input = document.createElement("input")
      input.type = "radio"
      input.name = "trivia-answer"
      input.id = `trivia-answer-${index}`
      input.value = choice
      const text = document.createElement("span")
      text.textContent = choice
      label.append(input, text)
      return label
    }))
    this.updateProgress()
    if (focus) this.choicesTarget.querySelector("input").focus()
  }

  hint() {
    if (this.solved || this.finished) return
    if (this.hintsUsed) {
      this.feedbackTarget.textContent = "You've used your hint for this question. Keep trying!"
      return
    }
    this.hintsUsed = true
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.className = "feedback"
    this.feedbackTarget.textContent = this.question.hint
  }

  check(event) {
    event.preventDefault()
    if (this.finished) return this.startAdventure(this.grade, true)
    if (this.solved) return this.nextQuestion()
    const selected = this.choicesTarget.querySelector("input:checked")
    if (!selected) {
      this.feedbackTarget.className = "feedback retry"
      this.feedbackTarget.textContent = "Choose an answer, then check it."
      this.choicesTarget.querySelector("input").focus()
      return
    }
    const correct = selected.value === this.question.answer
    if (!correct && !this.againstComputer) {
      this.feedbackTarget.className = "feedback retry"
      this.feedbackTarget.textContent = "Not quite. Try another answer — every try helps you learn!"
      selected.focus()
      return
    }
    this.solved = true
    this.completed += 1
    this.results.push(correct)
    const stars = correct ? (this.hintsUsed ? 1 : 2) : 0
    if (correct) {
      this.progress.total += 1
      this.progress.stars += stars
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress))
      } catch (error) {
        this.storageError("Your browser couldn't save trivia progress. New progress may be lost when you leave.", error)
      }
    }
    if (this.againstComputer) {
      if (correct) this.playerScore += 1
      const answer = computerAnswer(this.question, this.computerDifficulty)
      const computerCorrect = answer === this.question.answer
      if (computerCorrect) this.computerScore += 1
      this.computerFeedbackTarget.textContent = `Computer chose ${answer}. ${computerCorrect ? "One point for the computer." : "No point this time."}`
    }
    this.choicesTarget.querySelectorAll("input").forEach((input) => { input.disabled = true })
    this.hintButtonTarget.disabled = true
    this.feedbackTarget.className = correct ? "feedback success" : "feedback retry"
    this.feedbackTarget.textContent = correct
      ? `You did it! ${this.question.explanation} ${stars} ${stars === 1 ? "star" : "stars"} earned!`
      : `Good try! The answer is ${this.question.answer}. ${this.question.explanation} No point this time — keep exploring!`
    this.finished = this.completed === ROUND_LENGTH
    this.checkButtonTarget.textContent = this.finished ? "Play again" : "Next question"
    if (this.finished) {
      if (this.againstComputer) {
        const result = this.playerScore > this.computerScore ? "You won! Great exploring!"
          : this.playerScore === this.computerScore ? "It's a tie! Great teamwork learning new things!"
          : "The computer won this round. You made new discoveries — try again!"
        this.matchResultTarget.textContent = `${result} You: ${this.playerScore}. Computer: ${this.computerScore}.`
      }
      this.feedbackTarget.textContent += this.grade < GRADES[GRADES.length - 1]
        ? ` Ten discoveries! Try Grade ${this.grade + 1} next!`
        : " Ten discoveries! You've completed the highest trivia level!"
    }
    this.updateProgress()
    this.checkButtonTarget.focus()
  }

  updateProgress() {
    this.playerScoreTarget.textContent = this.playerScore
    this.computerScoreTarget.textContent = this.computerScore
    this.pointsTarget.textContent = `${this.progress.stars} ${this.progress.stars === 1 ? "star" : "stars"}`
    this.countTarget.textContent = this.completed
    this.barTarget.setAttribute("aria-valuenow", this.completed)
    this.fillTarget.style.width = `${this.completed / ROUND_LENGTH * 100}%`
    this.goalMessageTarget.textContent = this.finished ? "Round complete. Keep being curious!" : "Every question is a new discovery."
    this.trailTarget.replaceChildren(...Array.from({ length: ROUND_LENGTH }, (_, index) => {
      const stop = document.createElement("div")
      stop.className = `trail-stop${index < this.completed ? " complete" : ""}${index === this.completed ? " current" : ""}`
      const circle = document.createElement("span")
      circle.className = "trail-circle"
      circle.textContent = index < this.completed ? (this.results[index] ? "✓" : "·") : index + 1
      const label = document.createElement("span")
      label.textContent = index < this.completed ? (this.results[index] ? "Solved!" : "Explored!") : index === this.completed ? "You're here" : "Keep going"
      stop.append(circle, label)
      return stop
    }))
  }

  openProgress() {
    this.progressStatsTarget.replaceChildren(...[
      [this.progress.total, "questions solved"], [this.progress.stars, "stars earned"]
    ].map(([value, label]) => {
      const item = document.createElement("div")
      const number = document.createElement("strong")
      number.textContent = value
      const caption = document.createElement("span")
      caption.textContent = label
      item.append(number, caption)
      return item
    }))
    this.progressDialogTarget.showModal()
  }

  openHelp() {
    this.helpDialogTarget.showModal()
  }

  closeDialog(event) {
    event.currentTarget.closest("dialog").close()
  }
}
