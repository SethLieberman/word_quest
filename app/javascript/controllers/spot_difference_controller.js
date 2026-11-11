import { Controller } from "@hotwired/stimulus"
import { PUZZLES, PICTURE_WIDTH, PICTURE_HEIGHT } from "data/spot_difference_puzzles"

export default class extends Controller {
  static targets = ["level", "goal", "round", "title", "pictures", "count", "bar", "fill", "feedback", "discoveries", "next"]

  connect() {
    this.difficulty = "easy"
    this.index = 0
    this.showPuzzle()
  }

  get puzzle() {
    return PUZZLES[this.index]
  }

  get differences() {
    return this.difficulty === "challenge"
      ? [...this.puzzle.differences, ...this.puzzle.challengeDifferences]
      : this.puzzle.differences
  }

  changeLevel(event) {
    const difficulty = event.currentTarget.dataset.level
    if (!["easy", "challenge"].includes(difficulty)) throw new Error(`Unknown picture difficulty: ${difficulty}`)
    if (difficulty === this.difficulty) return
    this.difficulty = difficulty
    this.index = 0
    this.showPuzzle()
    this.feedbackTarget.textContent = `${difficulty === "challenge" ? "Challenging" : "Easy"} level. Find ${this.differences.length} differences in each puzzle.`
  }

  showPuzzle() {
    this.found = new Set()
    this.levelTargets.forEach((button) => button.setAttribute("aria-pressed", button.dataset.level === this.difficulty))
    this.goalTarget.textContent = `Compare the pictures. Find ${this.differences.length} differences and click them in either picture!`
    this.roundTarget.textContent = `PUZZLE ${this.index + 1} OF ${PUZZLES.length}`
    this.titleTarget.textContent = this.puzzle.title
    this.feedbackTarget.textContent = ""
    this.discoveriesTarget.replaceChildren()
    this.nextTarget.disabled = true
    this.nextTarget.textContent = this.index === PUZZLES.length - 1 ? "Play again" : "Next puzzle"
    this.picturesTarget.replaceChildren(...["original", "changed"].map((version, index) => this.buildPicture(version, index + 1)))
    this.updateProgress()
  }

  buildPicture(version, number) {
    const figure = document.createElement("figure")
    figure.className = "spot-picture"
    const caption = document.createElement("figcaption")
    caption.textContent = `Picture ${number}`
    const board = document.createElement("div")
    board.className = "spot-board"
    board.dataset.picture = number
    board.addEventListener("click", (event) => {
      if (event.target.closest(".spot-hotspot")) return
      this.feedbackTarget.textContent = this.found.size === this.differences.length
        ? "You found them all! Choose the next puzzle or play again."
        : "Keep looking! Compare the colors, shapes, and objects in both pictures."
    })
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("viewBox", `0 0 ${PICTURE_WIDTH} ${PICTURE_HEIGHT}`)
    svg.setAttribute("role", "img")
    svg.setAttribute("aria-label", `${this.puzzle.title}, Picture ${number}`)
    const shapes = [
      { tag: "rect", attrs: { width: PICTURE_WIDTH, height: PICTURE_HEIGHT, fill: this.puzzle.background } },
      ...this.puzzle.shapes,
      ...this.puzzle.differences.flatMap((difference) => difference[version]),
      ...this.puzzle.challengeDifferences.flatMap((difference) => difference[this.difficulty === "challenge" ? version : "original"])
    ]
    shapes.forEach(({ tag, attrs }) => {
      const shape = document.createElementNS("http://www.w3.org/2000/svg", tag)
      Object.entries(attrs).forEach(([name, value]) => shape.setAttribute(name, value))
      svg.append(shape)
    })
    board.append(svg)
    this.differences.forEach((difference, index) => {
      const button = document.createElement("button")
      const [x, y, width, height] = difference.bounds
      button.type = "button"
      button.className = "spot-hotspot"
      button.dataset.difference = difference.id
      button.style.left = `${x / PICTURE_WIDTH * 100}%`
      button.style.top = `${y / PICTURE_HEIGHT * 100}%`
      button.style.width = `${width / PICTURE_WIDTH * 100}%`
      button.style.height = `${height / PICTURE_HEIGHT * 100}%`
      button.setAttribute("aria-label", `Explore area ${index + 1} in Picture ${number}`)
      button.setAttribute("aria-pressed", "false")
      button.addEventListener("click", () => this.findDifference(difference))
      board.append(button)
    })
    figure.append(caption, board)
    return figure
  }

  findDifference(difference) {
    if (this.found.has(difference.id)) {
      this.feedbackTarget.textContent = "You already found that difference. Look for another one!"
      return
    }
    this.found.add(difference.id)
    this.picturesTarget.querySelectorAll(`[data-difference="${difference.id}"]`).forEach((button) => {
      button.classList.add("is-found")
      button.textContent = "✓"
      button.setAttribute("aria-pressed", "true")
      button.setAttribute("aria-label", `Found: ${difference.description}`)
    })
    const discovery = document.createElement("li")
    discovery.textContent = difference.description
    this.discoveriesTarget.append(discovery)
    this.updateProgress()
    const complete = this.found.size === this.differences.length
    this.feedbackTarget.textContent = complete
      ? (this.index === PUZZLES.length - 1 ? "You finished every puzzle! Wonderful noticing!" : `You found all ${this.differences.length} differences! Great noticing!`)
      : `You found a difference! ${difference.description}`
    if (complete) {
      this.nextTarget.disabled = false
      this.nextTarget.focus()
    }
  }

  updateProgress() {
    const total = this.differences.length
    this.countTarget.textContent = `${this.found.size} of ${total} differences found`
    this.barTarget.setAttribute("aria-valuemax", total)
    this.barTarget.setAttribute("aria-valuenow", this.found.size)
    this.fillTarget.style.width = `${this.found.size / total * 100}%`
  }

  nextPuzzle() {
    if (this.found.size !== this.differences.length) return
    this.index = (this.index + 1) % PUZZLES.length
    this.showPuzzle()
    this.titleTarget.focus()
  }
}
