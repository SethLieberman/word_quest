import { Controller } from "@hotwired/stimulus"
import NEW_DOLCH from "data/new_dolch_words"

const LEVELS = {
  beginner: NEW_DOLCH.beginner,
  easy: NEW_DOLCH.easy,
  medium: NEW_DOLCH.medium
}
const ADVANCE_DELAY_MS = 1400
const HINT_AFTER_MISSES = 2

// Approximate sounds for letters so "sound it out" plays sounds, not letter names.
const LETTER_SOUNDS = {
  a: "ah", b: "buh", c: "kuh", d: "duh", e: "eh", f: "fff", g: "guh", h: "huh", i: "ih",
  j: "juh", k: "kuh", l: "lll", m: "mmm", n: "nnn", o: "aw", p: "puh", q: "kwuh", r: "rrr",
  s: "sss", t: "tuh", u: "uh", v: "vvv", w: "wuh", x: "ks", y: "yuh", z: "zzz"
}

const RECOGNITION_ERRORS = {
  "no-speech": "I didn't hear anything. Tap Say it and speak a little louder.",
  "aborted": "Listening was stopped. Tap Say it to try again.",
  "audio-capture": "No microphone was found. Check that one is plugged in and selected in your browser settings. You can type the word instead.",
  "network": "Speech recognition couldn't reach its service. Check your internet connection. You can type the word instead.",
  "not-allowed": "Microphone access is blocked. Allow the microphone for this site in your browser's address bar, then reload. You can type the word instead.",
  "service-not-allowed": "Speech recognition is blocked by the browser or site settings. You can type the word instead.",
  "bad-grammar": "The speech recognizer had a problem setting up. Try again.",
  "language-not-supported": "Speech recognition doesn't support English (en-US) in this browser. You can type the word instead."
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z]/g, "")
}

export default class extends Controller {
  static targets = ["level", "progress", "mastered", "card", "emoji", "clue", "word", "letters", "mic", "unsupported", "typed", "feedback", "finished"]

  connect() {
    this.RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition || null
    this.recognition = null
    this.timers = []
    this.level = "beginner"
    this.mastered = new Set()
    this.words = LEVELS[this.level]
    this.index = 0

    if (!this.RecognitionClass) {
      this.micTarget.disabled = true
      this.unsupportedTarget.hidden = false
    }

    this.showWord()
  }

  disconnect() {
    this.stopListening()
    this.clearTimers()
    if ("speechSynthesis" in window) window.speechSynthesis.cancel()
  }

  chooseLevel(event) {
    this.level = event.currentTarget.dataset.level
    this.words = LEVELS[this.level]
    this.index = 0
    this.mastered = new Set()
    this.levelTargets.forEach((button) => {
      button.setAttribute("aria-pressed", String(button === event.currentTarget))
    })
    this.showWord()
  }

  restart() {
    this.index = 0
    this.mastered = new Set()
    this.showWord()
  }

  get currentEntry() {
    return this.words[this.index]
  }

  showWord() {
    this.clearTimers()
    this.stopListening()
    this.attempts = 0
    this.finishedTarget.hidden = true
    this.cardTarget.hidden = false

    const [word, emoji, clue] = this.currentEntry
    this.currentWord = word
    this.emojiTarget.textContent = emoji
    this.clueTarget.textContent = clue
    this.wordTarget.textContent = word
    this.typedTarget.value = ""
    this.cardTarget.classList.remove("is-correct", "is-shake")
    this.setFeedback("", "")

    this.lettersTarget.replaceChildren(...this.buildLetterChips(word))

    this.progressTarget.textContent = `WORD ${this.index + 1} OF ${this.words.length}`
    this.masteredTarget.textContent = `${this.mastered.size} read`
  }

  buildLetterChips(word) {
    return [...word].map((letter) => {
      const chip = document.createElement("button")
      chip.type = "button"
      chip.className = "read-aloud-letter"
      chip.textContent = letter
      chip.setAttribute("aria-label", `Hear the sound of ${letter}`)
      chip.addEventListener("click", () => this.speak([LETTER_SOUNDS[letter] || letter], 0.6))
      return chip
    })
  }

  listen() {
    this.speak([this.currentWord], 0.85)
  }

  soundOut() {
    const sounds = [...this.currentWord].map((letter) => LETTER_SOUNDS[letter] || letter)
    this.speak([...sounds, this.currentWord], 0.6)
  }

  // Queues each part as its own utterance so the sounds are spoken with short pauses.
  speak(parts, rate) {
    if (!("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    parts.forEach((text) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = rate
      window.speechSynthesis.speak(utterance)
    })
  }

  startListening() {
    if (!this.RecognitionClass || this.isDone()) return

    this.stopListening()
    const recognition = new this.RecognitionClass()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 5

    recognition.onstart = () => {
      this.setMicPressed(true)
      this.setFeedback("Listening… say the word!", "info")
    }
    recognition.onresult = (event) => {
      const result = event.results[0]
      if (!result) return
      const heard = Array.from(result).map((alternative) => normalize(alternative.transcript))
      this.handleAttempt(heard)
    }
    recognition.onerror = (event) => {
      const reason = RECOGNITION_ERRORS[event.error] || "I couldn't hear that. Try again or type the word."
      console.warn("Speech recognition error:", event.error, event.message)
      this.setFeedback(`${reason} (error code: ${event.error})`, "info")
    }
    recognition.onend = () => {
      this.setMicPressed(false)
      if (this.recognition === recognition) this.recognition = null
    }

    this.recognition = recognition
    recognition.start()
  }

  stopListening() {
    if (!this.recognition) return
    const recognition = this.recognition
    this.recognition = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognition.abort()
    this.setMicPressed(false)
  }

  checkTyped(event) {
    event.preventDefault()
    const value = normalize(this.typedTarget.value)
    if (!value || this.isDone()) return
    this.handleAttempt([value])
  }

  handleAttempt(heardWords) {
    if (this.isDone()) return
    this.stopListening()

    if (heardWords.includes(normalize(this.currentWord))) {
      this.succeed()
    } else {
      this.miss()
    }
  }

  succeed() {
    this.mastered.add(this.currentWord)
    this.masteredTarget.textContent = `${this.mastered.size} read`
    this.cardTarget.classList.add("is-correct")
    this.setFeedback(`Yes! ${this.currentWord} is right. 🌟`, "success")

    const isLast = this.index === this.words.length - 1
    this.schedule(() => {
      this.cardTarget.classList.remove("is-correct")
      if (isLast) {
        this.showFinished()
      } else {
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
      this.setFeedback(`Almost! Let's sound it out together.`, "info")
      this.soundOut()
    } else {
      this.setFeedback("Almost! Try again. Tap Hear the word to listen first.", "info")

    }
  }

  showFinished() {
    this.cardTarget.hidden = true
    this.finishedTarget.hidden = false
    this.progressTarget.textContent = `ALL ${this.words.length} WORDS DONE`
  }

  isDone() {
    return this.cardTarget.hidden
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
