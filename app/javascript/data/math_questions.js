export const LEVELS = [
  { id: "sprout", name: "Number sprout" },
  { id: "explorer", name: "Number explorer" },
  { id: "multiply", name: "Multiplication magic" },
  { id: "divide", name: "Division detective" },
  { id: "mixed", name: "Operation expert" },
  { id: "equations", name: "Equation mastermind" }
]

export function questionBank(level) {
  const questions = []
  if (level === "sprout" || level === "explorer") {
    const limit = level === "sprout" ? 20 : 100
    for (let a = 1; a < limit; a++) {
      for (let b = 1; b <= limit - a; b++) {
        if (level === "explorer" && a + b <= 20) continue
        questions.push({
          expression: `${a} + ${b}`, answer: a + b,
          hint: `Start at ${a}, then count forward ${b}. Try adding tens first, then ones.`
        })
        questions.push({
          expression: `${a + b} − ${b}`, answer: a,
          hint: `Start at ${a + b} and count back ${b}. You can subtract tens and then ones.`
        })
      }
    }
  } else if (level === "multiply" || level === "divide") {
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        questions.push(level === "multiply" ? {
          expression: `${a} × ${b}`, answer: a * b,
          hint: `Think of ${a} equal groups of ${b}. Add ${b} a total of ${a} times.`
        } : {
          expression: `${a * b} ÷ ${b}`, answer: a,
          hint: `How many groups of ${b} make ${a * b}? Use your multiplication facts.`
        })
      }
    }
  } else if (level === "mixed") {
    for (let a = 2; a <= 12; a++) {
      for (let b = 2; b <= 12; b++) {
        const c = (a + b) % 9 + 1
        questions.push(
          { expression: `${c} + ${a} × ${b}`, answer: c + a * b, hint: `Multiply ${a} × ${b} first, then add ${c}.` },
          { expression: `(${a} + ${b}) × ${c}`, answer: (a + b) * c, hint: `Work inside the parentheses first: add ${a} and ${b}, then multiply by ${c}.` },
          { expression: `${a * b} ÷ ${b} + ${c}`, answer: a + c, hint: `Divide ${a * b} by ${b} first, then add ${c}.` },
          { expression: `${a * b + c} − ${a} × ${b}`, answer: c, hint: `Multiply ${a} × ${b} before subtracting it from ${a * b + c}.` }
        )
      }
    }
  } else if (level === "equations") {
    for (let a = 1; a <= 12; a++) {
      for (let b = 1; b <= 12; b++) {
        questions.push(
          { expression: `? + ${b} = ${a + b}`, answer: a, hint: `Undo the addition: subtract ${b} from ${a + b}.` },
          { expression: `${a + b} − ? = ${b}`, answer: a, hint: `What must you take away from ${a + b} to leave ${b}?` },
          { expression: `? × ${b} = ${a * b}`, answer: a, hint: `Undo the multiplication: divide ${a * b} by ${b}.` },
          { expression: `${a * b} ÷ ? = ${a}`, answer: b, hint: `Find the number that, multiplied by ${a}, makes ${a * b}.` }
        )
      }
    }
  } else {
    throw new Error(`Unknown math level: ${level}`)
  }
  return questions
}

export function adventureQuestions(level) {
  const questions = questionBank(level)
  for (let index = questions.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[questions[index], questions[other]] = [questions[other], questions[index]]
  }
  return questions.slice(0, 10)
}
