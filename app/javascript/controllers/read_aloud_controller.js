import { Controller } from "@hotwired/stimulus"
import { LESSONS, SOUNDS } from "data/read_aloud_lessons"

const ADVANCE_DELAY_MS = 1400
const HINT_AFTER_MISSES = 2
const RECOGNITION_ERRORS = {
  "no-speech": "I didn't hear anything. Tap Say it and try again.",
  "aborted": "Listening was stopped. Tap Say it to try again.",
  "audio-capture": "No microphone was found. You can type or mark your reading practice instead.",
  "network": "Speech recognition couldn't reach its service. Check your internet connection.",
  "not-allowed": "Microphone access is blocked. Allow the microphone in your browser settings to try again.",
  "service-not-allowed": "Speech recognition is blocked by the browser or site settings.",
  "bad-grammar": "The speech recognizer had a problem setting up. Try again.",
  "language-not-supported": "Speech recognition doesn't support English in this browser."
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, "").trim().replace(/\s+/g, " ")
}

export default class extends Controller {
  static targets = [
    "level", "mode", "help", "progress", "mastered", "card", "emoji", "clue",
    "word", "letters", "family", "pattern", "stage", "builder", "slots", "tiles",
    "buildCheck", "mic", "unsupported", "audio", "audioNotice", "typed",
    "reading", "feedback", "finished"
  ]

  connect() {
    this.RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition || null
    this.recognition = null
    this.timers = []
    this.speechGeneration ??= 0
    this.level = "beginner"
    this.mode = "read"
    this.mastered = new Set()
    this.index = 0

    this.micTarget.disabled = !this.RecognitionClass
    this.unsupportedTarget.hidden = Boolean(this.RecognitionClass)
    this.audioAvailable = Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === "function"
    this.audioTargets.forEach((button) => { button.disabled = !this.audioAvailable })
    this.audioNoticeTarget.hidden = this.audioAvailable
    this.showWord()
  }

  disconnect() {
    this.stopListening()
    this.clearTimers()
    this.stopSpeech()
  }

  get lesson() {
    return LESSONS[this.level]
  }

  get words() {
    return this.lesson.entries
  }

  get currentEntry() {
    return this.words[this.index]
  }

  chooseLevel(event) {
    this.level = event.currentTarget.dataset.level
    this.index = 0
    this.mastered = new Set()
    if (!this.lesson.phonics) this.mode = "read"
    this.showWord()
  }

  chooseMode(event) {
    this.mode = event.currentTarget.dataset.mode
    this.showWord()
  }

  chooseFamilyWord(event) {
    this.index = Number(event.currentTarget.dataset.index)
    this.showWord()
  }

  restart() {
    this.index = 0
    this.mastered = new Set()
    this.showWord()
  }

  showWord() {
    this.clearTimers()
    this.stopListening()
    this.stopSpeech()
    this.attempts = 0
    this.resolved = false
    this.finishedTarget.hidden = true
    this.cardTarget.hidden = false
    this.currentWord = this.currentEntry.text
    this.emojiTarget.textContent = this.currentEntry.emoji
    this.clueTarget.textContent = this.currentEntry.clue
    this.helpTarget.textContent = this.lesson.help
    this.typedTarget.value = ""
    this.cardTarget.classList.remove("is-correct", "is-shake")
    this.setFeedback("", "")
    this.stageTarget.textContent = this.lesson.phonics ? "Hear → blend → read" : "Hear → read"
    this.levelTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.level === this.level))
    })
    this.modeTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.mode === this.mode))
      button.disabled = button.dataset.mode === "build" && !this.lesson.phonics
    })

    this.wordTarget.replaceChildren(...this.currentEntry.units.map((unit, index) => {
      const part = document.createElement("span")
      part.textContent = unit.letters + (this.level === "sentences" && index < this.currentEntry.units.length - 1 ? " " : "")
      part.dataset.unit = index
      if (unit.sound === null && this.lesson.phonics) part.classList.add("is-silent")
      if (this.currentEntry.family && index === 0) part.classList.add("is-changing")
      return part
    }))
    this.wordTarget.classList.toggle("is-sentence", this.level === "sentences")
    this.lettersTarget.replaceChildren(...this.currentEntry.units.map((unit, index) => {
      const chip = document.createElement("button")
      chip.type = "button"
      chip.className = "read-aloud-letter"
      chip.textContent = unit.letters
      chip.dataset.unit = index
      const cue = this.soundCue(unit)
      chip.setAttribute("aria-label", cue ? `Hear ${cue}` : "Final e is silent")
      chip.disabled = !this.audioAvailable
      chip.addEventListener("click", () => {
        if (this.isDone()) return
        if (!cue) {
          this.setFeedback("Final e stays quiet and helps the vowel say its name.", "info")
          return
        }
        this.speak([{ text: this.soundText(unit), indices: this.highlightIndices(index) }], 0.65)
      })
      return chip
    }))

    this.renderFamily()
    this.patternTarget.textContent = this.currentEntry.contrast
      ? `${this.currentEntry.contrast} → ${this.currentWord}: final e is silent; the vowel says its name.`
      : (this.level === "silent_e" ? "Final e is silent; the vowel says its name." : "")
    const building = this.mode === "build"
    this.wordTarget.hidden = building
    this.lettersTarget.hidden = building
    this.familyTarget.hidden = building || !this.currentEntry.family
    this.patternTarget.hidden = building || !this.patternTarget.textContent
    this.readingTarget.hidden = building
    this.builderTarget.hidden = !building
    if (building) this.prepareBuilder()

    const noun = this.level === "sentences" ? "READING" : "WORD"
    this.progressTarget.textContent = `${noun} ${this.index + 1} OF ${this.words.length}`
    this.masteredTarget.textContent = `${this.mastered.size} practiced`
  }

  renderFamily() {
    const ending = this.currentEntry.family
    this.familyTarget.replaceChildren()
    if (!ending) return
    this.words.forEach((entry, index) => {
      if (entry.family !== ending) return
      const button = document.createElement("button")
      button.type = "button"
      button.className = "read-aloud-family-word"
      button.dataset.index = index
      button.setAttribute("aria-label", `Practice ${entry.text}`)
      button.setAttribute("aria-pressed", String(index === this.index))
      const first = document.createElement("span")
      first.className = "is-changing"
      first.textContent = entry.text.slice(0, -ending.length)
      button.append(first, ending)
      button.addEventListener("click", (event) => this.chooseFamilyWord(event))
      this.familyTarget.append(button)
    })
  }

  prepareBuilder() {
    this.selectedTiles = []
    this.bank = this.currentEntry.units.map((unit) => unit.letters)
    const distractors = ["a", "e", "i", "o", "u", "m", "s", "t"].filter((letters) => !this.bank.includes(letters))
    this.bank.push(...distractors.slice(0, 2))
    for (let index = this.bank.length - 1; index > 0; index -= 1) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[this.bank[index], this.bank[other]] = [this.bank[other], this.bank[index]]
    }
    this.renderBuilder()
  }

  renderBuilder() {
    this.slotsTarget.replaceChildren(...this.currentEntry.units.map((unit, index) => {
      const slot = document.createElement("button")
      slot.type = "button"
      slot.className = "read-aloud-letter"
      slot.dataset.unit = index
      const tile = this.selectedTiles[index]
      slot.textContent = tile === undefined ? "·" : this.bank[tile]
      slot.setAttribute("aria-label", tile === undefined ? `Empty group ${index + 1}` : `Return ${this.bank[tile]} from group ${index + 1}`)
      slot.disabled = tile === undefined || this.resolved
      slot.addEventListener("click", () => {
        this.selectedTiles.splice(index, 1)
        this.renderBuilder()
        this.tilesTarget.querySelector(`[data-tile="${tile}"]`).focus()
      })
      return slot
    }))
    this.tilesTarget.replaceChildren(...this.bank.map((letters, tile) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "read-aloud-letter"
      button.dataset.tile = tile
      button.textContent = letters
      button.setAttribute("aria-label", `Add ${letters}`)
      button.disabled = this.resolved || this.selectedTiles.includes(tile) || this.selectedTiles.length === this.currentEntry.units.length
      button.addEventListener("click", () => {
        this.selectedTiles.push(tile)
        this.renderBuilder()
        const next = this.tilesTarget.querySelector("button:not(:disabled)") || this.buildCheckTarget
        next.focus()
      })
      return button
    }))
    this.buildCheckTarget.disabled = this.resolved || this.selectedTiles.length !== this.currentEntry.units.length
    this.highlight(this.activeIndices)
  }

  checkBuilt() {
    if (this.isDone() || this.selectedTiles.length !== this.currentEntry.units.length) return
    if (this.currentEntry.units.every((unit, index) => unit.letters === this.bank[this.selectedTiles[index]])) {
      this.succeed()
    } else {
      this.miss()
    }
  }

  hintBuilt() {
    if (this.isDone()) return
    const index = this.currentEntry.units.findIndex((unit, position) => unit.letters !== this.bank[this.selectedTiles[position]])
    if (index < 0) {
      this.setFeedback("Your groups are ready. Tap Check my word!", "info")
      return
    }
    const letters = this.currentEntry.units[index].letters
    const tile = this.bank.findIndex((candidate, position) => candidate === letters && !this.selectedTiles.slice(0, index).includes(position))
    // Keep only the correct prefix so a repeated letter tile is never used twice.
    this.selectedTiles = [...this.selectedTiles.slice(0, index), tile]
    this.renderBuilder()
    this.setFeedback(`Try ${letters} in group ${index + 1}. Hear it again, then keep building.`, "info")
  }

  soundCue(unit) {
    if (!this.lesson.phonics) return unit.letters
    return unit.sound === null ? null : SOUNDS[unit.sound][1]
  }

  soundText(unit) {
    return this.lesson.phonics ? SOUNDS[unit.sound][0] : unit.letters
  }

  highlightIndices(index) {
    const indices = [index]
    if (this.currentEntry.units[index].sound?.startsWith("long")) indices.push(this.currentEntry.units.length - 1)
    return indices
  }

  listen() {
    if (this.isDone()) return
    this.speak([{ text: this.currentWord, indices: this.currentEntry.units.map((_, index) => index), whole: true }], 0.85)
  }

  soundOut() {
    if (this.isDone()) return
    const parts = this.currentEntry.units.flatMap((unit, index) => {
      if (this.lesson.phonics && unit.sound === null) return []
      return [{ text: this.soundText(unit), indices: this.highlightIndices(index) }]
    })
    this.speak([
      ...parts,
      { text: this.currentWord, indices: this.currentEntry.units.map((_, index) => index), blend: true }
    ], 0.65)
  }

  highlight(indices) {
    this.activeIndices = indices
    this.element.querySelectorAll("[data-unit]").forEach((part) => {
      part.classList.toggle("is-speaking", indices.includes(Number(part.dataset.unit)))
    })
  }

  stopSpeech() {
    this.speechGeneration += 1
    window.speechSynthesis?.cancel()
    this.highlight([])
  }

  speak(parts, rate) {
    this.stopListening()
    this.stopSpeech()
    if (!this.audioAvailable) {
      this.setFeedback("Audio isn't available in this browser. Ask an adult to model the sounds.", "info")
      return
    }
    const generation = this.speechGeneration
    parts.forEach((part, index) => {
      const utterance = new SpeechSynthesisUtterance(part.text)
      utterance.lang = "en-US"
      utterance.rate = rate
      utterance.onstart = () => {
        if (generation !== this.speechGeneration) return
        this.highlight(part.indices)
        this.stageTarget.textContent = part.whole ? "Hear the reading" : part.blend
          ? (this.lesson.phonics ? "Blend the sounds into the word" : "Read it all together")
          : (this.lesson.phonics ? "Hear each sound group" : "Hear the words")
      }
      utterance.onend = () => {
        if (generation !== this.speechGeneration) return
        this.highlight([])
        if (index === parts.length - 1) this.stageTarget.textContent = "Your turn to read!"
      }
      utterance.onerror = (event) => {
        if (generation !== this.speechGeneration) return
        console.warn("Read Aloud speech playback error:", event.error)
        this.stopSpeech()
        this.setFeedback("Audio couldn't play. Try again or ask an adult to read with you.", "info")
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  startListening() {
    if (!this.RecognitionClass || this.isDone()) return
    this.stopListening()
    this.stopSpeech()
    const recognition = new this.RecognitionClass()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 5
    recognition.onstart = () => {
      if (this.recognition !== recognition) return
      this.setMicPressed(true)
      this.setFeedback("Listening… your turn to read!", "info")
    }
    recognition.onresult = (event) => {
      if (this.recognition !== recognition) return
      const result = event.results[0]
      if (!result) {
        this.setFeedback("The microphone didn't return any words. You can try again or mark your practice.", "info")
        return
      }
      const heard = Array.from(result).map((alternative) => normalize(alternative.transcript))
      this.stopListening()
      if (heard.includes(normalize(this.currentWord))) {
        this.succeed()
      } else {
        this.setFeedback("Thanks for reading! The microphone may have heard differently. Listen again, or tap I practiced reading.", "info")
      }
    }
    recognition.onerror = (event) => {
      if (this.recognition !== recognition) return
      console.warn("Speech recognition error:", event.error, event.message)
      this.setFeedback(`${RECOGNITION_ERRORS[event.error] || "Speech recognition couldn't hear that."} You can type or mark your practice instead. (error code: ${event.error})`, "info")
    }
    recognition.onend = () => {
      if (this.recognition !== recognition) return
      this.setMicPressed(false)
      this.recognition = null
    }
    this.recognition = recognition
    try {
      recognition.start()
    } catch (error) {
      this.stopListening()
      console.warn("Speech recognition could not start:", error)
      this.setFeedback("The microphone couldn't start. Try again or mark your reading practice.", "info")
    }
  }

  stopListening() {
    if (!this.recognition) return
    const recognition = this.recognition
    this.recognition = null
    recognition.onstart = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.abort()
    this.setMicPressed(false)
  }

  checkTyped(event) {
    event.preventDefault()
    if (this.isDone()) return
    const value = normalize(this.typedTarget.value)
    if (!value) {
      this.setFeedback("Type what you read, or tap I practiced reading.", "info")
      return
    }
    this.stopListening()
    if (value === normalize(this.currentWord)) this.succeed()
    else this.miss()
  }

  markPracticed() {
    if (!this.isDone()) this.succeed(true)
  }

  succeed(practiced = false) {
    if (this.isDone()) return
    this.resolved = true
    this.stopListening()
    this.stopSpeech()
    this.clearTimers()
    this.mastered.add(this.currentWord)
    this.masteredTarget.textContent = `${this.mastered.size} practiced`
    this.cardTarget.classList.add("is-correct")
    if (this.mode === "build") this.renderBuilder()
    this.setFeedback(practiced ? "Well done practicing your reading! 🌟" : `Yes! ${this.currentWord} is right. 🌟`, "success")
    this.schedule(() => {
      if (this.index === this.words.length - 1) this.showFinished()
      else {
        this.index += 1
        this.showWord()
      }
    }, ADVANCE_DELAY_MS)
  }

  miss() {
    this.attempts += 1
    this.cardTarget.classList.add("is-shake")
    this.schedule(() => this.cardTarget.classList.remove("is-shake"), 500)
    if (this.attempts >= HINT_AFTER_MISSES) {
      if (this.mode === "build") this.hintBuilt()
      else this.setFeedback("Let's try it together. Tap Hear & blend or ask an adult to help.", "info")
      this.soundOut()
    } else {
      this.setFeedback("Keep trying! Listen again and check the letters or words.", "info")
    }
  }

  showFinished() {
    this.stopSpeech()
    this.stopListening()
    this.cardTarget.hidden = true
    this.finishedTarget.hidden = false
    this.progressTarget.textContent = `ALL ${this.words.length} READINGS PRACTICED`
  }

  isDone() {
    return this.cardTarget.hidden || this.resolved
  }

  setMicPressed(pressed) {
    this.micTarget.setAttribute("aria-pressed", String(pressed))
  }

  setFeedback(message, tone) {
    this.feedbackTarget.textContent = message
    this.feedbackTarget.dataset.tone = tone
  }

  schedule(callback, delay) {
    this.timers.push(setTimeout(callback, delay))
  }

  clearTimers() {
    this.timers.forEach(clearTimeout)
    this.timers = []
  }
}
