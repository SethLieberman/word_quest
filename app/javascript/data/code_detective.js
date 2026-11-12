import { LEVELS, ROUND_LENGTH } from "data/code_breaker_puzzles"

export const DETECTIVE_SYMBOLS = [
  { id: "star", symbol: "★", name: "Star" },
  { id: "circle", symbol: "●", name: "Circle" },
  { id: "triangle", symbol: "▲", name: "Triangle" },
  { id: "square", symbol: "■", name: "Square" },
  { id: "diamond", symbol: "◆", name: "Diamond" },
  { id: "heart", symbol: "♥", name: "Heart" }
]

export function detectiveSettings(level) {
  if (!LEVELS.includes(level)) throw new Error(`Unknown detective level: ${level}`)
  return {
    length: level === "easy" ? 3 : 4,
    symbols: DETECTIVE_SYMBOLS.slice(0, level === "easy" ? 4 : 6),
    repeats: level === "hard"
  }
}

export function detectiveRound(level) {
  const { length, symbols, repeats } = detectiveSettings(level)
  const candidates = []
  function extend(prefix) {
    if (prefix.length === length) {
      candidates.push(prefix)
      return
    }
    symbols.forEach(({ id }) => {
      if (repeats || !prefix.includes(id)) extend([...prefix, id])
    })
  }
  extend([])
  return Array.from({ length: ROUND_LENGTH }, () => {
    const index = Math.floor(Math.random() * candidates.length)
    return candidates.splice(index, 1)[0]
  })
}

export function scoreGuess(secret, guess) {
  const valid = (code) => Array.isArray(code) && code.every((id) => DETECTIVE_SYMBOLS.some((symbol) => symbol.id === id))
  if (!valid(secret) || !valid(guess) || secret.length !== guess.length || ![3, 4].includes(secret.length)) {
    throw new Error("A detective guess must match the secret's length and use known symbols")
  }
  const remainingSecret = []
  const remainingGuess = []
  let exact = 0
  secret.forEach((id, index) => {
    if (id === guess[index]) exact += 1
    else {
      remainingSecret.push(id)
      remainingGuess.push(guess[index])
    }
  })
  let misplaced = 0
  remainingGuess.forEach((id) => {
    const index = remainingSecret.indexOf(id)
    if (index !== -1) {
      misplaced += 1
      remainingSecret.splice(index, 1)
    }
  })
  return { exact, misplaced }
}
