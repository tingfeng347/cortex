// Fix explanation text in question banks: replace option position references
// (选项A/B/C/D, 答案为A, Option A, etc.) with the actual option content.
// This ensures explanations remain correct after options are shuffled.

import { readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const FILES = [
  "src/lib/question-bank/zh-CN.ts",
  "src/lib/question-bank/en.ts",
  "src/lib/question-bank/ja.ts",
]

// Extract question-like objects from TypeScript source
interface QuestionLike {
  options: string[]
  answer: number | number[]
  explanation: string
}

function extractExplanations(source: string): Array<{ start: number; end: number; text: string; options: string[] }> {
  const results: Array<{ start: number; end: number; text: string; options: string[] }> = []

  // Find all explanation fields
  const explRe = /explanation:\s*(["'`])([\s\S]*?)\1/g
  let match: RegExpExecArray | null

  while ((match = explRe.exec(source)) !== null) {
    const explStart = match.index + match[0].indexOf(match[2])
    const explText = match[2]
    const explEnd = explStart + explText.length

    // Find the corresponding options array for this question
    // Look backwards from the explanation to find the options array
    const before = source.slice(0, match.index)
    const optMatch = before.match(/options:\s*\[([\s\S]*?)\]/)
    let options: string[] = []
    if (optMatch) {
      const optStr = optMatch[1]
      // Parse string array: "a", "b", "c"
      const strRe = /["'`]([^"'`]*)["'`]/g
      let sm: RegExpExecArray | null
      while ((sm = strRe.exec(optStr)) !== null) {
        options.push(sm[1])
      }
    }

    if (options.length > 0) {
      results.push({ start: explStart, end: explEnd, text: explText, options })
    }
  }

  return results
}

// Map option letter to index: A→0, B→1, C→2, D→3
function letterToIndex(letter: string): number {
  return letter.toUpperCase().charCodeAt(0) - 65
}

function indexToLetter(idx: number): string {
  return String.fromCharCode(65 + idx)
}

// Replace position references in explanation text with actual option content
function fixExplanation(text: string, options: string[]): string {
  let result = text

  // Pattern 1: "选项X" / "选项 X" → "「{option content}」" (generic reference)
  result = result.replace(/选项\s*([A-Da-d])/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `「${options[idx]}」`
    }
    return _ // keep original if index out of range
  })

  // Pattern 2: "答案[为是]X" → "答案为「{option}」"
  result = result.replace(/答案([为是：:])\s*([A-Da-d])\b/g, (_, sep: string, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `答案${sep}「${options[idx]}」`
    }
    return _
  })

  // Pattern 3: "正确[的]?答案[为是：:]?\s*[A-Da-d]" → reference to correct option
  result = result.replace(/正确(?:的)?答案(?:[为是：:])?\s*([A-Da-d])\b/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `正确答案为「${options[idx]}」`
    }
    return _
  })

  // Pattern 4: "故[应]?选[A-Da-d]" → "故应选「{option}」"
  result = result.replace(/(故(?:应)?)\s*选\s*([A-Da-d])\b/g, (_, prefix: string, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${prefix}选「${options[idx]}」`
    }
    return _
  })

  // Pattern 5: "[仅只]?有?(选项)?[A-Da-d]\s*(正确|符合|是正确答案)" → reference to correct
  result = result.replace(/(?:仅|只)?有?\s*(?:选项)?\s*([A-Da-d])\s*(正确|符合|是正确答案)/g, (_, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `「${options[idx]}」${suffix}`
    }
    return _
  })

  // Pattern 6: "对应选项A" / "对应选项 A"
  result = result.replace(/对应\s*选项\s*([A-Da-d])/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `对应「${options[idx]}」`
    }
    return _
  })

  // Pattern 7: English "Option A/B/C/D" followed by text
  result = result.replace(/\b[Oo]ption\s+([A-D])\b/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `「${options[idx]}」`
    }
    return _
  })

  // Pattern 8: "干扰项B" / "干扰项 B" etc
  result = result.replace(/干扰项\s*([A-Da-d])\b/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `干扰项「${options[idx]}」`
    }
    return _
  })

  // Pattern 9: Standalone letter reference like "故为B" or ",B正确"
  result = result.replace(/([，,])\s*([A-Da-d])\s*(正确|是正确答案|为正确答案)\b/g, (_, sep: string, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${sep}「${options[idx]}」${suffix}`
    }
    return _
  })

  // Pattern 10: "故选X" where X is a letter
  result = result.replace(/(故选)\s*([A-Da-d])\b/g, (_, prefix: string, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${prefix}「${options[idx]}」`
    }
    return _
  })

  // Pattern 11: "X项" / "X是" where X is A-D
  result = result.replace(/([A-Da-d])\s*(项|是)\s*(正确|为正确答案)\b/g, (_, letter: string, mid: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `「${options[idx]}」${mid}${suffix}`
    }
    return _
  })

  // Pattern 12: "B符合其" style
  result = result.replace(/([，,。\s])([A-Da-d])\s*(符合|是|为)\b/g, (_, prefix: string, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${prefix}「${options[idx]}」${suffix}`
    }
    return _
  })

  // Pattern 13: "而非A" "不如A" etc
  result = result.replace(/而非\s*([A-Da-d])\b/g, (_, letter: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `而非「${options[idx]}」`
    }
    return _
  })
  result = result.replace(/不如\s*([A-Da-d])\s*(贴切)?/g, (_, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `不如「${options[idx]}」${suffix || ''}`
    }
    return _
  })

  // Pattern 14: "A是正确答案" / "A是最合理解释" / "A为最合理解释"
  result = result.replace(/([，,。\s])([A-Da-d])\s*(是|为)\s*(最|更)/g, (_, prefix: string, letter: string, mid: string, adv: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${prefix}「${options[idx]}」${mid}${adv}`
    }
    return _
  })

  // Pattern 15: "B正确" / "A错误" standalone after period
  result = result.replace(/[。，,]\s*([A-Da-d])\s*(正确|错误)/g, (_, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `。「${options[idx]}」${suffix}`
    }
    return _
  })

  // Pattern 16: "A是常见的" etc
  result = result.replace(/(\s|^)([A-Da-d])\s*(是|为|将)/g, (_, prefix: string, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      return `${prefix}「${options[idx]}」${suffix}`
    }
    return _
  })

  // Pattern 17: "C正确" / "D与成语无关"
  result = result.replace(/[，,。\s]([A-Da-d])\s*(正确|错误|与|完全|是|为)\b/g, (match: string, letter: string, suffix: string) => {
    const idx = letterToIndex(letter)
    if (idx >= 0 && idx < options.length) {
      const prefix = match[0]
      return `${prefix}「${options[idx]}」${suffix}`
    }
    return match
  })

  return result
}

for (const file of FILES) {
  const filePath = resolve(process.cwd(), file)
  let source = readFileSync(filePath, "utf-8")
  const original = source

  const explanations = extractExplanations(source)

  // Process in reverse order so offsets stay valid
  for (const expl of [...explanations].reverse()) {
    const fixed = fixExplanation(expl.text, expl.options)
    if (fixed !== expl.text) {
      source = source.slice(0, expl.start) + fixed + source.slice(expl.end)
      console.log(`[${file}] Fixed:`)
      console.log(`  Before: ${expl.text.slice(0, 120)}...`)
      console.log(`  After:  ${fixed.slice(0, 120)}...`)
      console.log()
    }
  }

  if (source !== original) {
    writeFileSync(filePath, source, "utf-8")
    console.log(`✅ Written: ${file}`)
  } else {
    console.log(`⏭️  No changes: ${file}`)
  }
}

console.log("\nDone.")
