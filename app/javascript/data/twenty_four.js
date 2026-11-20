import jsep from "jsep"

const TARGET = 24
const OPERATIONS = [ "+", "-", "×", "÷" ]

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left)
  let b = Math.abs(right)
  while (b !== 0) [ a, b ] = [ b, a % b ]
  return a || 1
}

export function rational(numerator, denominator = 1) {
  if (denominator === 0) return null
  const sign = denominator < 0 ? -1 : 1
  const divisor = greatestCommonDivisor(numerator, denominator)
  return { numerator: sign * numerator / divisor, denominator: sign * denominator / divisor }
}

export function applyOperation(left, right, operation) {
  switch (operation) {
    case "+":
      return rational(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator)
    case "-":
      return rational(left.numerator * right.denominator - right.numerator * left.denominator, left.denominator * right.denominator)
    case "×":
      return rational(left.numerator * right.numerator, left.denominator * right.denominator)
    case "÷":
      return right.numerator === 0 ? null : rational(left.numerator * right.denominator, left.denominator * right.numerator)
    default:
      return null
  }
}

export function formatValue(value) {
  return value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`
}

export function isTwentyFour(value) {
  return value.numerator === TARGET * value.denominator
}

export function checkExpression(expression, numbers) {
  const input = expression.trim().replace(/\s*=\s*24\s*$/, "").replaceAll("×", "*").replaceAll("÷", "/")
  if (!input || input.length > 80 || !/^[1-9+*/()\s-]+$/.test(input)) return { error: "Enter an equation using the cards and +, -, *, or /." }

  const used = []
  const operators = { "+": "+", "-": "-", "*": "×", "/": "÷" }
  function evaluate(node) {
    if (node.type === "Literal" && /^[1-9]$/.test(node.raw)) {
      used.push(node.value)
      return rational(node.value)
    }
    if (node.type !== "BinaryExpression" || !operators[node.operator]) throw new Error("invalid expression")
    const result = applyOperation(evaluate(node.left), evaluate(node.right), operators[node.operator])
    if (!result) throw new Error("division by zero")
    return result
  }

  try {
    const value = evaluate(jsep(input))
    if (used.length !== 4 || used.sort().join(",") !== [...numbers].sort().join(",")) {
      return { error: "Use each of the four original cards exactly once." }
    }
    return { correct: isTwentyFour(value), value }
  } catch (error) {
    return { error: error.message === "division by zero" ? "You cannot divide by zero." : "Check your equation and parentheses, then try again." }
  }
}

export function canMakeTwentyFour(numbers) {
  const memo = new Set()

  function search(values) {
    if (values.length === 1) return isTwentyFour(values[0])
    const signature = values.map(formatValue).sort().join(",")
    if (memo.has(signature)) return false
    memo.add(signature)

    for (let leftIndex = 0; leftIndex < values.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < values.length; rightIndex += 1) {
        const left = values[leftIndex]
        const right = values[rightIndex]
        const remaining = values.filter((_, index) => index !== leftIndex && index !== rightIndex)
        const results = [
          applyOperation(left, right, "+"),
          applyOperation(left, right, "-"),
          applyOperation(right, left, "-"),
          applyOperation(left, right, "×"),
          applyOperation(left, right, "÷"),
          applyOperation(right, left, "÷")
        ]
        if (results.some((result) => result && search([ ...remaining, result ]))) return true
      }
    }
    return false
  }

  return numbers.length === 4 && search(numbers.map((number) => rational(number)))
}

export function createDeal(random = Math.random) {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const numbers = Array.from({ length: 4 }, () => 1 + Math.floor(random() * 9))
    if (canMakeTwentyFour(numbers)) return numbers
  }
  return [ 3, 3, 8, 8 ]
}

export const OPERATORS = OPERATIONS