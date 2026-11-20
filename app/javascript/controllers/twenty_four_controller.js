import { Controller } from "@hotwired/stimulus"
import { applyOperation, checkExpression, createDeal, formatValue, isTwentyFour, rational } from "data/twenty_four"

export default class extends Controller {
  static targets = [
    "practiceMode", "timedMode", "modeDescription", "cards", "timer", "startButton", "newDealButton",
    "operation", "equation", "combineButton", "undoButton", "moves", "feedback", "typedAnswer", "checkAnswer"
  ]

  connect() {
    this.mode = "practice"
    this.timerInterval = null
    this.startNewDeal()
  }

  disconnect() {
    this.stopTimer()
  }

  chooseMode(event) {
    this.mode = event.currentTarget.dataset.mode
    this.practiceModeTarget.setAttribute("aria-pressed", String(this.mode === "practice"))
    this.timedModeTarget.setAttribute("aria-pressed", String(this.mode === "timed"))
    this.startNewDeal()
  }

  startNewDeal(numbers = createDeal()) {
    this.stopTimer()
    this.deal = [...numbers]
    this.typedAnswerTarget.value = ""
    this.typedAnswerTarget.removeAttribute("aria-invalid")
    this.cards = numbers.map((number, index) => ({ id: index, value: rational(number) }))
    this.nextCardId = this.cards.length
    this.moves = []
    this.undoStack = []
    this.selectedCardIds = []
    this.operation = "+"
    this.startedAt = null
    this.elapsed = 0
    this.revealed = this.mode === "practice"
    this.timedStarted = false
    this.solved = false
    this.setFeedback(this.mode === "practice"
      ? "Use each card once. Combine cards until one card shows 24."
      : "Start the timer when you are ready to reveal your cards.", "info")
    this.render()
  }

  startTimedRound() {
    if (this.mode !== "timed") return
    this.startNewDeal()
    this.timedStarted = true
    this.revealed = true
    this.startedAt = performance.now()
    this.timerInterval = window.setInterval(() => this.updateTimer(), 100)
    this.setFeedback("Go! Combine all four cards to make 24.", "info")
    this.render()
  }

  newPracticeDeal() {
    if (this.mode === "practice") this.startNewDeal()
  }

  selectCard(event) {
    if (!this.revealed || this.solved) return
    const cardId = Number(event.currentTarget.dataset.cardId)
    if (this.selectedCardIds.includes(cardId)) {
      this.selectedCardIds = this.selectedCardIds.filter((selectedId) => selectedId !== cardId)
    } else if (this.selectedCardIds.length === 2) {
      this.selectedCardIds = [ cardId ]
    } else {
      this.selectedCardIds = [ ...this.selectedCardIds, cardId ]
    }
    this.render()
  }

  selectOperation(event) {
    if (this.solved) return
    this.operation = event.currentTarget.dataset.operation
    this.render()
  }

  combine() {
    if (this.selectedCardIds.length !== 2 || !this.revealed || this.solved) return
    const [ leftId, rightId ] = this.selectedCardIds
    const left = this.cards.find((card) => card.id === leftId)
    const right = this.cards.find((card) => card.id === rightId)
    const result = applyOperation(left.value, right.value, this.operation)
    if (!result) {
      this.setFeedback("You cannot divide by zero. Choose another operation or pair of cards.", "error")
      return
    }

    this.undoStack.push({
      cards: this.cards.map((card) => ({ ...card, value: { ...card.value } })),
      moves: [ ...this.moves ]
    })
    const move = `${formatValue(left.value)} ${this.operation} ${formatValue(right.value)} = ${formatValue(result)}`
    this.moves = [ ...this.moves, move ]
    this.cards = [
      ...this.cards.filter((card) => card.id !== leftId && card.id !== rightId),
      { id: this.nextCardId, value: result }
    ]
    this.nextCardId += 1
    this.selectedCardIds = []

    if (this.cards.length === 1 && isTwentyFour(result)) {
      this.finish()
    } else if (this.cards.length === 1) {
      this.setFeedback(`Your final card is ${formatValue(result)}, not 24. Undo a move or start a new deal.`, "error")
    } else {
      this.setFeedback(`${this.cards.length} cards left. Keep going until all four numbers make 24.`, "info")
    }
    this.render()
  }

  checkTypedAnswer(event) {
    event.preventDefault()
    if (!this.revealed || this.solved) return
    const result = checkExpression(this.typedAnswerTarget.value, this.deal)
    if (result.error || !result.correct) {
      this.typedAnswerTarget.setAttribute("aria-invalid", "true")
      this.setFeedback(result.error || `That makes ${formatValue(result.value)}, not 24. Try again.`, "error")
      return
    }
    this.typedAnswerTarget.removeAttribute("aria-invalid")
    this.finish()
    this.render()
  }

  finish() {
    this.solved = true
    this.stopTimer()
    this.setFeedback(this.mode === "timed"
      ? `You made 24 in ${this.formatTime(this.elapsed)}!`
      : "You made 24! Nicely done.", "success")
  }

  undo() {
    const previous = this.undoStack.pop()
    if (!previous || this.solved) return
    this.cards = previous.cards
    this.moves = previous.moves
    this.selectedCardIds = []
    this.setFeedback("Last move undone. Try another operation.", "info")
    this.render()
  }

  render() {
    const hidden = !this.revealed
    this.cardsTarget.replaceChildren(...this.cards.map((card, index) => {
      const selectedIndex = this.selectedCardIds.indexOf(card.id)
      const button = document.createElement("button")
      button.type = "button"
      button.className = `twenty-four-card${hidden ? " is-hidden" : " is-revealed"}${selectedIndex >= 0 ? ` is-selected is-selected-${selectedIndex + 1}` : ""}`
      button.dataset.cardId = card.id
      button.dataset.action = "twenty-four#selectCard"
      button.disabled = hidden || this.solved
      button.setAttribute("aria-pressed", String(selectedIndex >= 0))
      button.setAttribute("aria-label", hidden ? `Hidden number card ${index + 1}` : `Number ${formatValue(card.value)}${selectedIndex >= 0 ? `, selected ${selectedIndex + 1}` : ""}`)

      const inner = document.createElement("span")
      inner.className = "twenty-four-card-inner"
      const back = document.createElement("span")
      back.className = "twenty-four-card-back"
      back.setAttribute("aria-hidden", "true")
      back.textContent = "24"
      const front = document.createElement("span")
      front.className = "twenty-four-card-front"
      front.setAttribute("aria-hidden", "true")
      front.textContent = hidden ? "?" : formatValue(card.value)
      inner.append(back, front)
      button.append(inner)
      return button
    }))

    this.operationTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.operation === this.operation))
      button.disabled = hidden || this.solved
    })
    this.combineButtonTarget.disabled = hidden || this.solved || this.selectedCardIds.length !== 2
    this.undoButtonTarget.disabled = this.undoStack.length === 0 || this.solved
    this.typedAnswerTarget.disabled = hidden || this.solved
    this.checkAnswerTarget.disabled = hidden || this.solved
    this.newDealButtonTarget.hidden = this.mode !== "practice"
    this.startButtonTarget.hidden = this.mode !== "timed"
    this.startButtonTarget.textContent = this.timedStarted ? "New timed deal" : "Start timer and reveal cards"
    this.timerTarget.textContent = this.mode === "practice" ? "No timer" : this.timedStarted ? this.formatTime(this.elapsed) : "Ready"
    this.modeDescriptionTarget.textContent = this.mode === "practice"
      ? "Take your time. You can undo a move or draw a fresh deal whenever you like."
      : "The clock starts and the cards flip when you press Start. Solve 24 as fast as you can."
    this.equationTarget.textContent = this.selectedCardIds.length === 2
      ? `${formatValue(this.cards.find((card) => card.id === this.selectedCardIds[0]).value)} ${this.operation} ${formatValue(this.cards.find((card) => card.id === this.selectedCardIds[1]).value)} = ?`
      : "Choose two cards, then choose an operation."
    this.movesTarget.replaceChildren(...this.moves.map((move) => {
      const item = document.createElement("li")
      item.textContent = move
      return item
    }))
  }

  updateTimer() {
    if (!this.startedAt || this.solved) return
    this.elapsed = performance.now() - this.startedAt
    this.timerTarget.textContent = this.formatTime(this.elapsed)
  }

  stopTimer() {
    if (this.timerInterval) window.clearInterval(this.timerInterval)
    this.timerInterval = null
    if (this.startedAt) this.elapsed = performance.now() - this.startedAt
    this.startedAt = null
  }

  formatTime(milliseconds) {
    const totalTenths = Math.floor(milliseconds / 100)
    const minutes = Math.floor(totalTenths / 600)
    const seconds = Math.floor(totalTenths / 10) % 60
    const tenths = totalTenths % 10
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
  }

  setFeedback(message, tone) {
    this.feedbackTarget.textContent = message
    this.feedbackTarget.dataset.tone = tone
  }
}