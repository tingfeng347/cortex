import type { Question } from "./types";

export const bank: Question[] = [
  // ════════════════════════════════════════════
  //  Logic (9 questions)
  // ════════════════════════════════════════════
  {
    id: 1,
    type: "logic",
    category: "logic",
    question:
      'In a warehouse theft investigation, four suspects are questioned. Their statements are:\n\nA says: "It wasn\'t me."\nB says: "C did it."\nC says: "It wasn\'t me."\nD says: "A is telling the truth."\n\nIf only one of the four is telling the truth, who is the thief?',
    options: ["A", "B", "C", "D"],
    answer: 0,
    difficulty: 0.0,
    explanation:
      "Working through each assumption:\nIf A is the thief: A lies, B lies, C tells truth, D lies → exactly one true ✅\nIf B is the thief: A tells truth, B lies, C tells truth, D tells truth → three true ❌\nIf C is the thief: A tells truth, B tells truth, C lies, D tells truth → three true ❌\nIf D is the thief: A tells truth, B lies, C tells truth, D tells truth → three true ❌\n\nTherefore the thief is A.",
  },
  {
    id: 2,
    type: "logic",
    category: "sequence",
    question:
      "Observe the sequence and find the pattern:\n\n3, 8, 15, 24, 35, ?\n\nWhat number should replace the question mark?",
    options: ["42", "46", "48", "50"],
    answer: 2,
    difficulty: -0.3,
    explanation:
      "Differences between consecutive terms:\n8 − 3 = 5, 15 − 8 = 7, 24 − 15 = 9, 35 − 24 = 11\nThe differences form an arithmetic sequence: 5, 7, 9, 11, 13...\nSo the next number = 35 + 13 = 48\n\nThis can also be seen as: 1×3, 2×4, 3×5, 4×6, 5×7, 6×8 = 48",
  },
  {
    id: 3,
    type: "logic",
    category: "logic",
    question:
      "At a class reunion, five old classmates meet and shake hands. Each pair shakes hands exactly once. How many handshakes occur in total?",
    options: ["8", "10", "12", "15"],
    answer: 1,
    difficulty: -0.5,
    explanation:
      "Choosing 2 people out of 5 to shake hands uses the combination formula:\nC(5,2) = 5 × 4 ÷ 2 = 10\n\nAnother way: each person shakes hands with 4 others, but each handshake is counted twice:\n5 × 4 ÷ 2 = 10",
  },
  {
    id: 4,
    type: "logic",
    category: "logic",
    question:
      'On an island, there are two types of people: Truth-tellers (always tell the truth) and Liars (always lie). You meet three people A, B, and C.\n\nA says: "All three of us are liars."\nB says: "Exactly one of us is a truth-teller."\n\nWhich of the following is correct?',
    options: [
      "A is a truth-teller, B and C are liars",
      "B is a truth-teller, A and C are liars",
      "C is a truth-teller, A and B are liars",
      "Cannot be determined",
    ],
    answer: 1,
    difficulty: 0.8,
    explanation:
      'If A were telling the truth, then A would be a liar — a contradiction, so A must be a liar.\nSince A is lying, "all three are liars" is false — there is at least one truth-teller.\nAssume B is telling the truth: exactly one person (B) is truthful, so A and C are liars. Then "all three are liars" is false (since B is truthful), and A lying holds. ✅\nAssume C is the only truth-teller: then B is lying, but B\'s statement "exactly one truth-teller" would actually be true (C), creating a contradiction.\n\nTherefore B is the truth-teller, and A and C are liars.',
  },
  {
    id: 5,
    type: "logic",
    category: "logic",
    question:
      "Using each of the digits 2, 3, 5, 9 exactly once, form a two-digit number multiplied by another two-digit number. Which multiplication gives the largest product?",
    options: ["32 × 59", "35 × 29", "39 × 25", "52 × 39"],
    answer: 3,
    difficulty: 0.2,
    explanation:
      "To maximize the product, the two numbers should be as close as possible while keeping the tens digits large.\n32 × 59 = 1888\n35 × 29 = 1015\n39 × 25 = 975\n52 × 39 = 2028\n\n52 × 39 = 2028 is the largest combination.\n\nGeneral principle: place the largest digits in the tens place and keep the two numbers as close as possible.",
  },
  {
    id: 6,
    type: "logic",
    category: "logic",
    question:
      'A, B, and C participate in a 100-meter race. After the results are announced, each makes a statement:\n\nA says: "I am not in first place."\nB says: "C is in first place."\nC says: "I am not in first place."\n\nIf only one of them is telling the truth, who is truly in first place?',
    options: ["A", "B", "C", "Cannot be determined"],
    answer: 0,
    difficulty: 0.0,
    explanation:
      'Assume A is first:\n- A says "I am not first" → false\n- B says "C is first" → false\n- C says "I am not first" → true (C is not first, A is)\n→ exactly one true ✅\n\nAssume B is first:\n- A says "I am not first" → true (A is not first, B is)\n- B says "C is first" → false\n- C says "I am not first" → true (C is not first)\n→ two true ❌\n\nAssume C is first:\n- A true (A is not first), B true (C is first), C false (C claims not first)\n→ two true ❌\n\nTherefore A is in first place.',
  },
  {
    id: 7,
    type: "logic",
    category: "sequence",
    question:
      "Find the next number in the sequence:\n\n1, 1, 2, 3, 5, 8, 13, ?\n\nWhat number should replace the question mark?",
    options: ["18", "20", "21", "24"],
    answer: 2,
    difficulty: -1.0,
    explanation:
      "This is the Fibonacci sequence, where each term is the sum of the two preceding terms:\n1 + 1 = 2\n1 + 2 = 3\n2 + 3 = 5\n3 + 5 = 8\n5 + 8 = 13\n8 + 13 = 21\n\nSo the next number is 21.",
  },
  {
    id: 8,
    type: "logic",
    category: "logic",
    question:
      "A company has 100 employees. 80 speak English, 60 speak French, and 5 speak neither language. How many employees speak both languages?",
    options: ["35", "40", "45", "50"],
    answer: 2,
    difficulty: -0.3,
    explanation:
      "Number of employees who speak at least one language: 100 − 5 = 95\n\nUsing the set formula:\n|A ∪ B| = |A| + |B| − |A ∩ B|\n95 = 80 + 60 − |A ∩ B|\n|A ∩ B| = 140 − 95 = 45\n\nSo 45 employees speak both languages.",
  },
  {
    id: 9,
    type: "logic",
    category: "logic",
    question:
      'There are three boxes A, B, and C, one of which contains a prize. Each box has a statement written on it, and only one statement is true:\n\nA: "The prize is here."\nB: "The prize is not in A."\nC: "The prize is not in here."\n\nWhich box contains the prize?',
    options: ["A", "B", "C", "Cannot be determined"],
    answer: 2,
    difficulty: 0.3,
    explanation:
      "Assume prize in A: A true, B false, C true → two true ❌\nAssume prize in B: A false, B true, C true → two true ❌\nAssume prize in C: A false, B true (prize not in A), C false (prize is in C) → exactly one true ✅\n\nSo the prize is in box C.",
  },

  // ════════════════════════════════════════════
  //  Math (8 questions)
  // ════════════════════════════════════════════
  {
    id: 10,
    type: "math",
    category: "math",
    question:
      "A book is priced at $240. The store first increases the price by 25%, then offers a 20% discount. Compared to the original price, the final price is:",
    options: [
      "Higher than the original",
      "Lower than the original",
      "The same as the original",
      "Cannot be determined",
    ],
    answer: 2,
    difficulty: 0.6,
    explanation:
      "After 25% increase: 240 × 1.25 = $300\nAfter 20% discount: 300 × 0.8 = $240\nThe final price is the same as the original price.\n\nA 25% increase and a 20% discount are reciprocals — many people intuitively think the price must change, but mathematically they cancel out exactly.",
  },
  {
    id: 11,
    type: "math",
    category: "math",
    question:
      "A construction job can be completed by worker A alone in 6 days, and by worker B alone in 12 days. How many days will it take if they work together?",
    options: ["3 days", "4 days", "6 days", "9 days"],
    answer: 1,
    difficulty: -1.0,
    explanation:
      "A completes 1/6 of the job per day, B completes 1/12 per day.\nTogether they complete: 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4 of the job per day.\nDays needed: 1 ÷ 1/4 = 4 days.",
  },
  {
    id: 12,
    type: "math",
    category: "math",
    question:
      "A rope is folded in half 3 times, then cut through the middle with a single cut. How many pieces of rope result?",
    options: ["7", "8", "9", "12"],
    answer: 2,
    difficulty: 0.4,
    explanation:
      "Folding 3 times creates 2³ = 8 layers. Cutting through the middle cuts all 8 layers, creating one cut.\n\nHowever, the folded ends remain connected. When folded n times and cut through the middle, you get 2ⁿ + 1 pieces.\n2³ + 1 = 8 + 1 = 9 pieces.\n\nIf this is hard to visualize, try it with a strip of paper folded 3 times and cut.",
  },
  {
    id: 13,
    type: "math",
    category: "math",
    question:
      "Tom rides his bike to school at 12 km/h and returns home at 8 km/h. Assuming the distance is the same both ways, what is the average speed for the round trip?",
    options: ["9.0 km/h", "9.6 km/h", "10.0 km/h", "10.5 km/h"],
    answer: 1,
    difficulty: 0.7,
    explanation:
      "The average speed is NOT (12 + 8) ÷ 2 = 10! The time taken differs for each leg.\n\nUse the harmonic mean:\nLet the one-way distance be d.\nTime going = d/12, time returning = d/8\nTotal distance = 2d, total time = d/12 + d/8 = 2d/24 + 3d/24 = 5d/24\n\nAverage speed = 2d ÷ (5d/24) = 48/5 = 9.6 km/h\n\nMany people instinctively pick 10, but the correct answer is 9.6 — the slower leg takes more time, pulling the average down.",
  },
  {
    id: 14,
    type: "math",
    category: "math",
    question:
      "If the side length of a square increases by 50%, by what percentage does its area increase?",
    options: ["50%", "100%", "125%", "225%"],
    answer: 2,
    difficulty: -0.2,
    explanation:
      "Let original side = a, original area = a².\nNew side = a × 1.5 = 1.5a\nNew area = (1.5a)² = 2.25a²\nIncrease = (2.25 − 1) × 100% = 125%",
  },
  {
    id: 15,
    type: "math",
    category: "math",
    question:
      "What is the sum of all numbers divisible by 3 between 1 and 100?",
    options: ["1583", "1683", "1783", "1883"],
    answer: 1,
    difficulty: -0.5,
    explanation:
      "Numbers divisible by 3 from 1 to 100: 3, 6, 9, ..., 99\nThis is an arithmetic sequence: first term 3, last term 99, 33 terms.\n\nSum = (3 + 99) × 33 ÷ 2 = 102 × 33 ÷ 2 = 102 × 16.5 = 1683",
  },
  {
    id: 16,
    type: "math",
    category: "math",
    question:
      "Three apples and two pears cost $36. One apple and three pears cost $26. How much does one apple cost?",
    options: ["$6", "$8", "$10", "$12"],
    answer: 1,
    difficulty: 0.2,
    explanation:
      "Let apple = a, pear = b\n3a + 2b = 36 … ①\na + 3b = 26 … ②\n\nMultiply ② by 3: 3a + 9b = 78\nSubtract ①: (3a + 9b) − (3a + 2b) = 78 − 36\n7b = 42 → b = 6\nSubstitute into ②: a + 18 = 26 → a = 8\n\nOne apple costs $8.",
  },
  {
    id: 17,
    type: "math",
    category: "math",
    question:
      "A bag contains 50 red and blue balls in total. After removing 5 red balls, the number of red balls is twice the number of blue balls. How many red balls were there originally?",
    options: ["30", "32", "35", "38"],
    answer: 2,
    difficulty: -0.1,
    explanation:
      "Let the original number of red balls be x, and blue balls be (50 − x).\nAfter removing 5 red balls: red = x − 5, blue = 50 − x.\n\nx − 5 = 2(50 − x)\nx − 5 = 100 − 2x\n3x = 105\nx = 35\n\nThere were originally 35 red balls.",
  },

  // ════════════════════════════════════════════
  //  English Language (8 questions)
  // ════════════════════════════════════════════
  {
    id: 18,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following words has a different connotation from the others?",
    options: ["thrifty", "stingy", "frugal", "economical"],
    answer: 1,
    difficulty: -0.4,
    explanation:
      '"Stingy" has a negative connotation, describing someone unwilling to spend money.\n"Thrifty," "frugal," and "economical" are positive or neutral, describing careful and efficient use of resources.\n\nThis question tests the distinction between positive and negative connotations in word choice.',
  },
  {
    id: 19,
    type: "vocab",
    category: "vocab",
    question:
      'In which sentence does the word "grave" have a different meaning from the other three?',
    options: [
      "He wore a grave expression on his face.",
      "This is a grave situation for the company.",
      "She made a grave error in judgment.",
      "They dug a grave in the cemetery.",
    ],
    answer: 3,
    difficulty: -0.6,
    explanation:
      'In A, B, and C, "grave" means "serious or solemn."\nIn D, "grave" refers to "a burial site," which is a different meaning entirely.\n\nThis tests the ability to distinguish between homonyms — words with the same spelling but different meanings.',
  },
  {
    id: 20,
    type: "vocab",
    category: "vocab",
    question:
      'What does the phrase "beg the question" traditionally mean in formal logic?',
    options: [
      "To raise a new question that needs to be asked",
      "To assume the truth of the conclusion within the premise itself",
      "To request that someone ask a question",
      "To avoid answering a difficult question",
    ],
    answer: 1,
    difficulty: 0.1,
    explanation:
      '"Beg the question" (from Latin petitio principii) is a logical fallacy where an argument assumes the very point it is trying to prove.\n\nThis is one of the most commonly misused phrases in English — many people use it to mean "raises the question," but its traditional meaning refers to circular reasoning.',
  },
  {
    id: 21,
    type: "vocab",
    category: "vocab",
    question: "Which word is a different part of speech from the others?",
    options: ["kindness", "happiness", "darkness", "cautious"],
    answer: 3,
    difficulty: 0.3,
    explanation:
      '"Kindness," "happiness," and "darkness" are all nouns (formed by adding the suffix -ness to adjectives).\n"Cautious" is an adjective, making it the odd one out.',
  },
  {
    id: 22,
    type: "vocab",
    category: "vocab",
    question:
      'Which of the following best describes the origin of the word "salary"?',
    options: [
      'It comes from a Latin word meaning "payment for work done"',
      'It comes from the Latin word for "salt money," a ration given to Roman soldiers',
      'It comes from an Old French word for "yearly income"',
      'It comes from a Greek word meaning "coins stamped with metal"',
    ],
    answer: 1,
    difficulty: 0.1,
    explanation:
      '"Salary" derives from Latin "salarium" (salt money), which was an allowance given to Roman soldiers to purchase salt. Salt was highly valuable in ancient times.\n\nOver centuries, the word came to mean any regular payment for work.',
  },
  {
    id: 23,
    type: "vocab",
    category: "vocab",
    question:
      "Which pair of words has a different semantic relationship from the others?",
    options: [
      "begin : commence",
      "quick : rapid",
      "big : enormous",
      "hot : cold",
    ],
    answer: 3,
    difficulty: -0.4,
    explanation:
      '"Begin/commence," "quick/rapid," and "big/enormous" are all pairs of synonyms — words with similar meanings.\n\n"Hot/cold" are antonyms — words with opposite meanings. This makes option D the odd one out.',
  },
  {
    id: 24,
    type: "vocab",
    category: "vocab",
    question:
      'What did the word "nice" originally mean when it entered the English language?',
    options: [
      "pleasant and agreeable",
      "foolish or ignorant",
      "kind and friendly",
      "precise or accurate",
    ],
    answer: 1,
    difficulty: 0.0,
    explanation:
      '"Nice" comes from Latin "nescius" meaning "ignorant" (ne- "not" + scire "to know").\nOver centuries, its meaning shifted dramatically: from "foolish" (13th c.) to "shy" to "precise" to "agreeable, pleasant" (18th c.).\n\nThis is a classic example of semantic drift in the English language.',
  },
  {
    id: 25,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following lines expresses a happy or joyful tone, while the others express sorrow, loss, or mortality?",
    options: [
      '"O Captain! my Captain! our fearful trip is done" — Walt Whitman',
      '"Because I could not stop for Death — / He kindly stopped for me" — Emily Dickinson',
      '"I wandered lonely as a cloud / That floats on high o\'er vales and hills" — William Wordsworth',
      '"Do not go gentle into that good night / Old age should burn and rave at close of day" — Dylan Thomas',
    ],
    answer: 2,
    difficulty: 0.2,
    explanation:
      'Wordsworth\'s "I wandered lonely as a cloud" describes the joyful memory of seeing a field of daffodils — a tone of peaceful happiness and appreciation of nature.\n\nThe other three all deal with death or mortality: Whitman mourns Abraham Lincoln, Dickinson calmly personifies Death, and Thomas urges defiant resistance against dying.',
  },

  // ════════════════════════════════════════════
  //  Logic (6 new questions)
  // ════════════════════════════════════════════
  {
    id: 26,
    type: "logic",
    category: "logic",
    question:
      'In a government office, the department head says: "Every employee in our department is a party member."\nThe deputy head says: "If Smith is not a party member, then Johnson is not a party member either."\nSmith says: "I am not a party member."\nJohnson says: "There is someone in this department who is not a party member."\n\nIf exactly one of the four is lying, which statement must be true?',
    options: [
      "The department head is lying",
      "Smith is not a party member",
      "Johnson is a party member",
      "The deputy head is lying",
    ],
    answer: 0,
    difficulty: 0.6,
    explanation:
      'The department head says "everyone is a member" and Johnson says "someone is not a member" — these two statements contradict each other, so one must be true and one false.\n\nSince exactly one person is lying, the lie must be between these two. Therefore the deputy head and Smith are both telling the truth.\n\nSmith says "I am not a party member" which is true, so the department head\'s claim that "everyone is a member" is false.',
  },
  {
    id: 27,
    type: "logic",
    category: "logic",
    question:
      "A, B, C, and D play a chess tournament where each pair plays exactly one game. A beats D, and A, B, and C all have the same number of wins. How many games does D win?",
    options: ["0", "1", "2", "3"],
    answer: 0,
    difficulty: 0.5,
    explanation:
      "With four players, each pair plays once: 6 games total, so total wins = 6.\nA, B, and C have the same number of wins. They must each have 2 wins (0 or 1 would create contradictions).\nThat accounts for 3 × 2 = 6 wins among A, B, C, leaving D with 0 wins.",
  },
  {
    id: 28,
    type: "logic",
    category: "sequence",
    question:
      "Find the pattern and determine the missing number:\n\n2, 6, 12, 20, 30, 42, ?",
    options: ["48", "52", "56", "60"],
    answer: 2,
    difficulty: 0.0,
    explanation:
      "Consecutive differences: 4, 6, 8, 10, 12 → the next difference is 14.\nSo ? = 42 + 14 = 56\n\nThis can also be seen as: 1×2, 2×3, 3×4, 4×5, 5×6, 6×7, 7×8 = 56",
  },
  {
    id: 29,
    type: "logic",
    category: "logic",
    question:
      "A teacher brings three red hats and two blue hats. Three students each put on a hat, and the remaining two hats are hidden. Each student can see the others' hats but not their own, and all students are perfectly logical and know that everyone else is perfectly logical. The teacher asks if anyone knows their hat color. After a few seconds of silence, someone raises their hand. How did they figure it out?",
    options: [
      "They saw two red hats",
      "They saw two blue hats",
      "They saw one red and one blue hat",
      "They guessed randomly",
    ],
    answer: 0,
    difficulty: 1.2,
    explanation:
      "Premise: every student is perfectly logical and knows the others are too.\n\nThree levels of reasoning:\n\u2460 If a student saw two blue hats, they would instantly know their own hat is red (only two blue hats exist), and raise their hand immediately. No one did → nobody saw two blue hats.\n\u2461 If a student saw one red and one blue: suppose their own hat were blue. Then the person wearing red would see two blue hats and, by \u2460, would raise their hand immediately. After a brief pause with no hand raised → the assumption \"I am blue\" is false → they must be red. Someone at this level would raise their hand after a short delay.\n\u2462 In reality, all three wear red, so everyone sees two red hats. Each thinks: if I were blue, the other two would be in scenario \u2461 and someone would raise their hand shortly. After a few seconds of silence → the \"I am blue\" assumption fails → I must be red.\n\nSo the student who raised their hand saw two red hats and deduced through three-level recursive reasoning.",
  },
  {
    id: 30,
    type: "logic",
    category: "logic",
    question:
      'After an exam, a teacher writes four scores on the board: 85, 90, 95, 100. These belong to students A, B, C, and D.\n\nA says: "I am not the lowest."\nB says: "C scored higher than me."\nC says: "I scored higher than D."\nD says: "B scored higher than me."\n\nIf all four are telling the truth, what is D\'s score?',
    options: ["85", "90", "95", "100"],
    answer: 0,
    difficulty: 0.8,
    explanation:
      "From B: B < C (C scored higher)\nFrom C: D < C (C scored higher than D)\nFrom D: D < B (B scored higher than D)\nCombining: D < B < C. A is not the lowest, and since D is the lowest, this is satisfied.\nAssigning scores 85/90/95/100 to D/B/C/A: A = 100, C = 95, B = 90, D = 85.\nSo D's score is 85.",
  },
  {
    id: 31,
    type: "logic",
    category: "logic",
    question:
      'A says: "I am 3 years older than B."\nB says: "I am 2 years older than C."\nC says: "I am 1 year older than D."\nD says: "I am 5 years younger than A."\n\nIf all four are telling the truth, who is the oldest?',
    options: ["A", "B", "C", "D"],
    answer: 0,
    difficulty: -0.5,
    explanation:
      "A = B + 3, B = C + 2 → A = C + 5\nC = D + 1 → A = D + 6, B = D + 3\nD = A − 5 → consistent with A = D + 6 (not contradictory)\n\nAge order: A > B > C > D\nSo A is the oldest.",
  },

  // ════════════════════════════════════════════
  //  Math (7 new questions)
  // ════════════════════════════════════════════
  {
    id: 32,
    type: "math",
    category: "math",
    question:
      "How many grams of water must be evaporated from 200 grams of a 10% saline solution to obtain a 25% saline solution?",
    options: ["80 g", "100 g", "120 g", "150 g"],
    answer: 2,
    difficulty: 0.2,
    explanation:
      "The mass of salt remains constant: 200 × 10% = 20 grams.\n20 ÷ (200 − x) = 25%\n20 = 0.25(200 − x)\n20 = 50 − 0.25x\nx = 120\n\n120 grams of water must be evaporated.",
  },
  {
    id: 33,
    type: "math",
    category: "math",
    question:
      "A refrigerator's price increases by 10%, then decreases by 10%. The final price is what percent of the original price?",
    options: ["99%", "100%", "101%", "Cannot be determined"],
    answer: 0,
    difficulty: 0.1,
    explanation:
      "P × 1.1 × 0.9 = P × 0.99\nThe final price is 99% of the original price.\nThe 10% decrease is applied to the increased price, resulting in a net loss of 1%.",
  },
  {
    id: 34,
    type: "math",
    category: "math",
    question:
      "Between 6:00 and 7:00, at what time do the hour and minute hands first overlap exactly?",
    options: ["6:30", "6:32 and 8/11 minutes", "6:33", "6:35"],
    answer: 1,
    difficulty: 0.7,
    explanation:
      "At 6:00, the hands are 180° apart.\nThe minute hand moves 6°/min, the hour hand moves 0.5°/min, with a relative speed of 5.5°/min.\nCatch-up time = 180 ÷ 5.5 = 360/11 = 32 and 8/11 minutes.\n\nSo the hands overlap at 6:32 and 8/11 minutes.",
  },
  {
    id: 35,
    type: "math",
    category: "math",
    question:
      "A class of 40 students has an average score of 75. The boys' average is 70 and the girls' average is 80. How many boys are in the class?",
    options: ["16", "20", "24", "28"],
    answer: 1,
    difficulty: -0.3,
    explanation:
      "Let x = number of boys:\n70x + 80(40 − x) = 75 × 40\n70x + 3200 − 80x = 3000\n−10x = −200\nx = 20\n\nThere are 20 boys and 20 girls.",
  },
  {
    id: 36,
    type: "math",
    category: "math",
    question:
      "A rectangle's length increases by 20% and its width decreases by 20%. The new area is what percent of the original area?",
    options: ["96%", "100%", "104%", "144%"],
    answer: 0,
    difficulty: -0.2,
    explanation:
      "Original area = L × W.\nNew area = 1.2L × 0.8W = 0.96 × L × W = 96% of the original area.\n\nThe net effect is a 4% decrease in area.",
  },
  {
    id: 37,
    type: "math",
    category: "math",
    question:
      "The product of two consecutive odd numbers is 323. What are the two numbers?",
    options: ["15 and 17", "17 and 19", "19 and 21", "13 and 15"],
    answer: 1,
    difficulty: -0.8,
    explanation:
      "Let the numbers be n and n + 2:\nn(n + 2) = 323 → n² + 2n − 323 = 0 → (n − 17)(n + 19) = 0\nn = 17\n\nSo the numbers are 17 and 19 (17 × 19 = 323).",
  },
  {
    id: 38,
    type: "math",
    category: "math",
    question:
      "A father is 45 years old and his son is 15. How many years ago was the father exactly five times as old as his son?",
    options: ["5 years ago", "7.5 years ago", "10 years ago", "Never"],
    answer: 1,
    difficulty: -0.5,
    explanation:
      "Let x be the number of years ago:\n45 − x = 5(15 − x)\n45 − x = 75 − 5x\n4x = 30\nx = 7.5\n\nSo it was 7.5 years ago.",
  },

  // ════════════════════════════════════════════
  //  English Vocabulary (16 new questions)
  // ════════════════════════════════════════════
  {
    id: 39,
    type: "vocab",
    category: "vocab",
    question: 'What does the idiom "break the ice" mean?',
    options: [
      "To literally shatter frozen water",
      "To initiate conversation and make people feel more comfortable in a social setting",
      "To abruptly end a conversation or relationship",
      "To cool down a tense or heated argument",
    ],
    answer: 1,
    difficulty: 0.0,
    explanation:
      '"Break the ice" means to do or say something that reduces tension and helps people feel more relaxed when meeting for the first time or in an awkward social situation. The phrase likely originates from the idea of breaking ice to create a passage for ships.',
  },
  {
    id: 40,
    type: "vocab",
    category: "vocab",
    question: 'What does the idiom "hit the nail on the head" mean?',
    options: [
      "To hammer a nail perfectly straight into wood",
      "To be exactly right about something or accurately identify the core issue",
      "To accidentally injure oneself while working",
      "To complete a construction task efficiently",
    ],
    answer: 1,
    difficulty: 0.0,
    explanation:
      '"Hit the nail on the head" means to describe exactly what is causing a situation or problem, or to be precisely correct about something. The metaphor comes from carpentry — striking the nail\'s head squarely drives it in perfectly.',
  },
  {
    id: 41,
    type: "vocab",
    category: "vocab",
    question: "Which sentence contains a subject-verb agreement error?",
    options: [
      "The dog runs in the park every morning.",
      "She go to school by bus every day.",
      "They are playing soccer in the yard.",
      "He has finished his homework already.",
    ],
    answer: 1,
    difficulty: -0.5,
    explanation:
      '"She go" is incorrect. The third-person singular subject "she" requires the verb "goes" (with the -s ending). The correct sentence is "She goes to school by bus every day."\n\nThis is a common error for English language learners, as most other verb forms do not change for person.',
  },
  {
    id: 42,
    type: "vocab",
    category: "vocab",
    question: "Which sentence has a tense consistency error?",
    options: [
      "I went to the store and bought some milk.",
      "She was reading when the phone rang.",
      "Yesterday, I walk to the park and played soccer.",
      "He will finish his work and then go home.",
    ],
    answer: 2,
    difficulty: -0.4,
    explanation:
      '"Yesterday" establishes a past time frame, so "I walk" should be "I walked." The sentence mixes present tense ("walk") with past tense ("played"), creating a tense inconsistency.\n\nThe corrected sentence: "Yesterday, I walked to the park and played soccer."',
  },
  {
    id: 43,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following plays was NOT written by William Shakespeare?",
    options: ["Hamlet", "Macbeth", "Doctor Faustus", "Romeo and Juliet"],
    answer: 2,
    difficulty: 0.2,
    explanation:
      '"Doctor Faustus" was written by Christopher Marlowe, a contemporary of Shakespeare who also wrote "Tamburlaine the Great" and "The Jew of Malta."\n\n"Hamlet," "Macbeth," and "Romeo and Juliet" are all among Shakespeare\'s most famous plays.',
  },
  {
    id: 44,
    type: "vocab",
    category: "vocab",
    question: 'Who wrote the dystopian novel "1984"?',
    options: ["Aldous Huxley", "George Orwell", "Jules Verne", "H. G. Wells"],
    answer: 1,
    difficulty: -0.8,
    explanation:
      'George Orwell (Eric Blair) wrote "1984," published in 1949. It is a dystopian novel about totalitarianism, surveillance, and government control.\n\nAldous Huxley wrote "Brave New World" (another famous dystopian novel), Jules Verne wrote adventure sci-fi, and H. G. Wells wrote "The War of the Worlds."',
  },
  {
    id: 45,
    type: "vocab",
    category: "vocab",
    question:
      'Which word correctly completes the sentence: "The weather will _____ our travel plans."',
    options: ["affect", "effect", "infect", "defect"],
    answer: 0,
    difficulty: -0.3,
    explanation:
      '"Affect" (verb) means to influence or have an impact on something. "Effect" is most commonly used as a noun (e.g., "the effect was dramatic") and rarely as a verb meaning "to bring about."\n\n"Affect" and "effect" are among the most commonly confused word pairs in English.',
  },
  {
    id: 46,
    type: "vocab",
    category: "vocab",
    question: 'Which word is a synonym of "ubiquitous"?',
    options: ["omnipresent", "rare", "unique", "scarce"],
    answer: 0,
    difficulty: 0.0,
    explanation:
      '"Ubiquitous" means present, appearing, or found everywhere at once. "Omnipresent" is its direct synonym.\n\n"Rare," "unique," and "scarce" are all antonyms of "ubiquitous" — they describe things that are not commonly found.',
  },
  {
    id: 47,
    type: "vocab",
    category: "vocab",
    question: 'What does the idiom "bite the bullet" mean?',
    options: [
      "To literally bite a metal projectile",
      "To endure a painful or unpleasant situation with courage and resolve",
      "To eat food extremely quickly without chewing",
      "To prepare oneself for physical combat or a fight",
    ],
    answer: 1,
    difficulty: 0.0,
    explanation:
      '"Bite the bullet" means to face a difficult, unpleasant, or painful situation with bravery and determination.\n\nThe phrase originates from battlefield surgery before anesthesia, where soldiers would literally bite on a bullet to cope with the pain during operations.',
  },
  {
    id: 48,
    type: "vocab",
    category: "vocab",
    question: "Which sentence contains a dangling modifier?",
    options: [
      "Running quickly, she caught the bus just in time.",
      "Having finished dinner, the dishes were washed.",
      "Exhausted after the long day, he fell asleep immediately.",
      "Excited about the trip, the children packed their bags.",
    ],
    answer: 1,
    difficulty: 0.5,
    explanation:
      'In option B, the modifier "Having finished dinner" logically should refer to a person, but the subject of the main clause is "the dishes," which cannot finish dinner. This is a dangling modifier — a modifying phrase that does not clearly and logically attach to the word it is meant to modify.\n\nThe corrected version: "Having finished dinner, she washed the dishes."',
  },
  {
    id: 49,
    type: "vocab",
    category: "vocab",
    question: 'Who wrote the novel "The Great Gatsby"?',
    options: [
      "Ernest Hemingway",
      "F. Scott Fitzgerald",
      "John Steinbeck",
      "William Faulkner",
    ],
    answer: 1,
    difficulty: -0.8,
    explanation:
      'F. Scott Fitzgerald wrote "The Great Gatsby" in 1925, a novel that explores themes of wealth, love, and the American Dream during the Jazz Age.\n\nAll four options are famous 20th-century American novelists: Hemingway wrote "The Old Man and the Sea," Steinbeck wrote "The Grapes of Wrath," and Faulkner wrote "The Sound and the Fury."',
  },
  {
    id: 50,
    type: "vocab",
    category: "vocab",
    question: 'Which word is an antonym of "ephemeral"?',
    options: ["temporary", "fleeting", "permanent", "brief"],
    answer: 2,
    difficulty: -0.3,
    explanation:
      '"Ephemeral" means lasting for a very short time or fleeting. "Permanent" is its direct antonym, meaning lasting indefinitely.\n\n"Temporary," "fleeting," and "brief" are all synonyms of "ephemeral" — they all describe things that do not last long.',
  },
  {
    id: 51,
    type: "vocab",
    category: "vocab",
    question: 'What does the idiom "let the cat out of the bag" mean?',
    options: [
      "To free a trapped animal from a container",
      "To accidentally or carelessly reveal a secret",
      "To create a messy or chaotic situation",
      "To play a harmless prank or trick on someone",
    ],
    answer: 1,
    difficulty: 0.0,
    explanation:
      '"Let the cat out of the bag" means to reveal a secret, usually unintentionally or prematurely.\n\nThe phrase likely originates from an old market trick where a dishonest seller would place a cat in a bag instead of a pig; if someone "let the cat out of the bag," the deception would be exposed.',
  },
  {
    id: 52,
    type: "vocab",
    category: "vocab",
    question:
      'Which pronoun correctly completes the sentence: "She is the person _____ won the award."',
    options: ["who", "whom", "which", "whose"],
    answer: 0,
    difficulty: 0.2,
    explanation:
      '"Who" is the subject of the relative clause "who won the award" — the person performed the action of winning.\n\n"Whom" is the objective case, used for the object of a verb or preposition (e.g., "the person to whom the award was given"). "Which" refers to things, not people. "Whose" indicates possession.',
  },
  {
    id: 53,
    type: "vocab",
    category: "vocab",
    question: 'Who wrote the epic poem "Paradise Lost"?',
    options: [
      "William Wordsworth",
      "John Milton",
      "Geoffrey Chaucer",
      "John Keats",
    ],
    answer: 1,
    difficulty: 0.1,
    explanation:
      'John Milton wrote "Paradise Lost" (first published in 1667), an epic poem in blank verse that tells the biblical story of the Fall of Man — the temptation of Adam and Eve by Satan and their expulsion from the Garden of Eden.\n\nChaucer wrote "The Canterbury Tales" (Middle English), while Wordsworth and Keats were Romantic poets of the 19th century.',
  },
  {
    id: 54,
    type: "vocab",
    category: "vocab",
    question: 'What does the word "ambiguous" mean?',
    options: [
      "Clear and straightforward in meaning",
      "Having more than one possible meaning or interpretation",
      "Extremely angry or hostile in demeanor",
      "Moving or acting without a clear purpose or direction",
    ],
    answer: 1,
    difficulty: -1.0,
    explanation:
      '"Ambiguous" describes something that can be understood or interpreted in more than one way, making its meaning unclear or uncertain. It is commonly used to describe language, statements, or situations that are open to multiple interpretations.\n\nFor example: "The ending of the film was ambiguous, leaving viewers to decide what really happened."',
  },

  // ════════════════════════════════════════════
  //  LLM 批量生成 · 2026-05-07
  //  Math 32 题、Vocabulary 33 题、Logic 29 题
  // ════════════════════════════════════════════
  {
    id: 55,
    type: "math",
    category: "math",
    question:
      "A jacket originally costs $80. It is now on sale for 25% off. What is the sale price?",
    options: [
      "$60",
      "$55",
      "$20",
      "$65"
    ],
    answer: 0,
    explanation:
      "25% of $80 is $20 (since 80 × 0.25 = 20). Subtract the discount from the original price: $80 - $20 = $60.",
    difficulty: -1.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 56,
    type: "vocab",
    category: "vocab",
    question:
      "In Shakespeare's Romeo and Juliet, when Juliet says 'O Romeo, Romeo! wherefore art thou Romeo?' what does 'wherefore' mean?",
    options: [
      "why",
      "where",
      "how",
      "when"
    ],
    answer: 0,
    explanation:
      "In early modern English, 'wherefore' means 'why' or 'for what reason', not 'where'. Juliet is lamenting the reason Romeo is a Montague, not asking his location. This is a common misconception.",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 57,
    type: "math",
    category: "math",
    question:
      "You have a dinner bill of $45.60 and want to leave a 15% tip. Approximately how much is the tip?",
    options: [
      "$6.80",
      "$6.84",
      "$7.00",
      "$5.60"
    ],
    answer: 1,
    explanation:
      "To find 15% of $45.60, multiply by 0.15: 45.60 × 0.15 = 6.84. So the tip is $6.84.",
    difficulty: -1.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 58,
    type: "math",
    category: "math",
    question:
      "You invest $10,000 in a bond that pays 4% annual interest compounded quarterly. After 3 years, you sell the bond and pay a 1% commission on the sale proceeds. What is your net profit (in dollars)?",
    options: [
      "$1,155.57",
      "$1,126.83",
      "$1,268.25",
      "$1,000.00"
    ],
    answer: 0,
    explanation:
      "First, calculate the account balance after 3 years of quarterly compounding: Principal P = $10,000, annual rate r = 0.04, compounding periods per year n = 4, time t = 3 years. The amount A = P(1 + r/n)^(nt) = 10000 * (1 + 0.04/4)^(4*3) = 10000 * (1.01)^12. Using (1.01)^12 ≈ 1.126825, A ≈ 10000 * 1.126825 = $11,268.25. Then, a 1% commission on the sale reduces the proceeds to 99% of A: 11268.25 * 0.99 = $11,155.57. The net profit is the final amount minus the initial investment: 11155.57 - 10000 = $1,155.57.",
    difficulty: 2.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 59,
    type: "math",
    category: "math",
    question:
      "A television originally costs $600. The store offers a 20% discount, and you have a coupon for an additional 15% off the discounted price. What is the final price?",
    options: [
      "$390",
      "$408",
      "$480",
      "$510"
    ],
    answer: 1,
    explanation:
      "First, apply the 20% discount: 100% - 20% = 80% of $600 = $480. Then apply the additional 15% off the discounted price: 100% - 15% = 85% of $480 = $408. Alternatively, multiply the original price by (0.8 × 0.85) = 0.68, giving $600 × 0.68 = $408. A common mistake is to add the percentages (20% + 15% = 35%) and apply a single 35% discount, resulting in $600 × 0.65 = $390. The other options represent applying only one of the discounts: $480 (only the 20% off) and $510 (only the 15% off).",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 60,
    type: "vocab",
    category: "vocab",
    question:
      "What does the Latin phrase 'ad hoc' most commonly mean in English?",
    options: [
      "For this specific purpose",
      "In the middle of",
      "At first sight",
      "Without end"
    ],
    answer: 0,
    explanation:
      "'Ad hoc' is a Latin phrase meaning 'to this' or 'for this purpose'. In English, it is used to describe something created or done for a specific, often temporary, situation, rather than as a general solution. The other options are incorrect: 'in the middle of' refers to 'in medias res', 'at first sight' is 'prima facie', and 'without end' is 'ad infinitum'.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 61,
    type: "math",
    category: "math",
    question:
      "You drive 240 miles. For the first 120 miles, you travel at 60 mph, and for the remaining 120 miles, you travel at 40 mph. What is your average speed for the entire trip?",
    options: [
      "48 mph",
      "50 mph",
      "52 mph",
      "45 mph"
    ],
    answer: 0,
    explanation:
      "Average speed is total distance divided by total time. Time for first 120 miles at 60 mph: 120/60 = 2 hours. Time for next 120 miles at 40 mph: 120/40 = 3 hours. Total time = 5 hours. Total distance = 240 miles. Average speed = 240/5 = 48 mph. Note that averaging the speeds (60 and 40) to get 50 mph is incorrect because time spent at each speed differs.",
    difficulty: -0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 62,
    type: "math",
    category: "math",
    question:
      "Your garden is 12 feet by 15 feet. You want to add a 6-inch layer of topsoil. The topsoil costs $2.50 per cubic foot. How much will the topsoil cost?",
    options: [
      "$225",
      "$270",
      "$180",
      "$300"
    ],
    answer: 0,
    explanation:
      "First, find the area: 12 ft × 15 ft = 180 sq ft. Convert depth to feet: 6 inches = 0.5 ft. Volume = 180 × 0.5 = 90 cubic ft. Cost = 90 × $2.50 = $225.",
    difficulty: 0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 63,
    type: "logic",
    category: "logic",
    question:
      "At a company, all managers have a company car. Lisa has a company car. Which of the following can be logically concluded?",
    options: [
      "Lisa is a manager.",
      "Lisa is not a manager.",
      "Some managers do not have a company car.",
      "None of the above."
    ],
    answer: 3,
    explanation:
      "The statement 'all managers have a company car' does not prevent non-managers from having company cars. Therefore, from 'Lisa has a company car' we cannot conclude whether she is a manager or not. Option C contradicts the premise. Thus, no conclusion can be drawn, so 'None of the above' is correct.",
    difficulty: -2.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 64,
    type: "vocab",
    category: "vocab",
    question:
      "Choose the correct word to complete the sentence: 'The detective tried to _____ a confession from the suspect.'",
    options: [
      "illicit",
      "elicit",
      "explicit",
      "implicate"
    ],
    answer: 1,
    explanation:
      "'Elicit' means to draw out or evoke, often information or a response. 'Illicit' means illegal or forbidden. 'Explicit' means clearly stated. 'Implicate' means to show someone is involved in a crime. Only 'elicit' fits the context of obtaining a confession.",
    difficulty: 1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 65,
    type: "math",
    category: "math",
    question:
      "You deposit $800 in a savings account that earns 2.5% simple interest per year. How much interest will you earn after 3 years?",
    options: [
      "$20",
      "$50",
      "$60",
      "$80"
    ],
    answer: 2,
    explanation:
      "Simple interest is calculated as principal × rate × time. Here, principal = $800, rate = 2.5% = 0.025, time = 3 years. Interest = 800 × 0.025 × 3 = $60. The correct answer is $60.",
    difficulty: -1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 66,
    type: "logic",
    category: "logic",
    question:
      "On an island where every inhabitant is either a knight (always tells the truth) or a knave (always lies), you meet two inhabitants, Alice and Bob. Alice says, \"Bob is a knight.\" Bob says, \"We are of different types.\" What can you conclude?",
    options: [
      "Both are knights.",
      "Both are knaves.",
      "Alice is a knight and Bob is a knave.",
      "Alice is a knave and Bob is a knight."
    ],
    answer: 1,
    explanation:
      "If Alice were a knight, then Bob would be a knight (since Alice tells the truth). But then Bob would say they are different types, which would be false because they are both knights, contradicting Bob being a knight. So Alice cannot be a knight; she must be a knave. Therefore, her statement is false, meaning Bob is not a knight; Bob is a knave. Then Bob's statement that they are different types is false because they are both knaves, consistent with Bob being a knave. So both are knaves.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 67,
    type: "math",
    category: "math",
    question:
      "You drive 150 miles at 60 mph, stop for 30 minutes, then drive 120 miles at 50 mph. What is your average speed for the entire trip?",
    options: [
      "50 mph",
      "52 mph",
      "55 mph",
      "48 mph"
    ],
    answer: 0,
    explanation:
      "Total distance = 150 + 120 = 270 miles. First leg time = 150/60 = 2.5 hours. Stop = 0.5 hours. Second leg time = 120/50 = 2.4 hours. Total time = 2.5 + 0.5 + 2.4 = 5.4 hours. Average speed = 270 / 5.4 = 50 mph.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 68,
    type: "math",
    category: "math",
    question:
      "An item originally costs $50. The store offers a 30% discount on all items. You also have a coupon for an additional 10% off the discounted price. What is the final price you pay?",
    options: [
      "$30.00",
      "$31.50",
      "$35.00",
      "$32.50"
    ],
    answer: 1,
    explanation:
      "First apply the 30% discount: 50 * 0.7 = 35. Then apply the additional 10% off: 35 * 0.9 = 31.5. So the final price is $31.50. A common mistake is to add the discounts (40% off) leading to $30, or only applying the first discount.",
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 69,
    type: "vocab",
    category: "vocab",
    question:
      "What does the Latin phrase 'bona fide' mean in English?",
    options: [
      "In good faith",
      "One-time",
      "Without payment",
      "After the fact"
    ],
    answer: 0,
    explanation:
      "'Bona fide' is Latin for 'in good faith.' It is used to describe something genuine or sincere, as in 'a bona fide offer.' The other options are incorrect: 'one-time' is 'ad hoc,' 'without payment' is 'pro bono,' and 'after the fact' is 'post hoc.'",
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 70,
    type: "vocab",
    category: "vocab",
    question:
      "What is the meaning of the word 'garrulous'?",
    options: [
      "talkative",
      "secretive",
      "quarrelsome",
      "sleepy"
    ],
    answer: 0,
    explanation:
      "'Garrulous' means excessively talkative, especially on trivial matters. It comes from the Latin 'garrire' (to chatter). The other options are common distractors: 'secretive' is opposite, 'quarrelsome' is confused with 'pugnacious', and 'sleepy' is unrelated.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 71,
    type: "vocab",
    category: "vocab",
    question:
      "In literary criticism, what does the term 'deus ex machina' refer to?",
    options: [
      "A sudden introduction of a new character or event to resolve a seemingly impossible situation",
      "A tragic flaw in the protagonist that leads to their downfall",
      "A symbolic representation of a deity or divine intervention",
      "An unexpected twist that reveals a hidden identity"
    ],
    answer: 0,
    explanation:
      "'Deus ex machina' is Latin for 'god from the machine.' It originated from ancient Greek theater where a crane (machina) would lower a god onto the stage to resolve a complex plot. In literary criticism, it refers to an implausible or unexpected introduction of a new character or event used to resolve a difficult situation, often seen as a weak plot device.",
    difficulty: 0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 72,
    type: "math",
    category: "math",
    question:
      "You drive a car that gets 28 miles per gallon on the highway and 22 miles per gallon in the city. On a 200-mile trip, 40% of the distance is on the highway and 60% in the city. If gas costs $3.80 per gallon, what is the total cost of gas for the trip?",
    options: [
      "$31.58",
      "$31.15",
      "$30.40",
      "$27.14"
    ],
    answer: 0,
    explanation:
      "Highway distance = 0.4 × 200 = 80 miles. City distance = 0.6 × 200 = 120 miles. Gallons used on highway = 80/28 ≈ 2.8571. Gallons used in city = 120/22 ≈ 5.4545. Total gallons = 2.8571 + 5.4545 = 8.3116. Cost = 8.3116 × $3.80 = $31.584, rounded to $31.58. Alternatively, effective mpg = 1/(0.4/28 + 0.6/22) ≈ 24.06 mpg, gallons = 200/24.06 ≈ 8.312, cost = $31.58.",
    difficulty: 0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 73,
    type: "logic",
    category: "logic",
    question:
      "All dogs are mammals. Buddy is a dog. Therefore, which of the following must be true?",
    options: [
      "Buddy is a mammal.",
      "Buddy is not a mammal.",
      "All mammals are dogs.",
      "Some mammals are dogs."
    ],
    answer: 0,
    explanation:
      "The first premise states that all dogs belong to the set of mammals. The second premise states that Buddy is a dog. Therefore, Buddy must belong to the set of mammals. Option A is the most direct conclusion. Option C overreaches (the converse). While option D ('some mammals are dogs') is also logically valid (Buddy is both a dog and a mammal), A is the most direct and strongest deduction.",
    difficulty: -1.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 74,
    type: "vocab",
    category: "vocab",
    question:
      "Choose the correct meaning of the word 'ostensible'.",
    options: [
      "genuine",
      "apparent",
      "secret",
      "ambiguous"
    ],
    answer: 1,
    explanation:
      "'Ostensible' means seeming or appearing to be true, but not necessarily so. It is derived from Latin 'ostendere' (to show). The correct meaning is 'apparent' or 'seeming', not genuine, secret, or ambiguous.",
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 75,
    type: "math",
    category: "math",
    question:
      "You drive 120 miles at 40 mph, then 180 miles at 60 mph. What must your speed be for the next 100 miles to have an overall average speed of 55 mph for the entire trip? Round to the nearest whole number.",
    options: [
      "68 mph",
      "72 mph",
      "79 mph",
      "82 mph"
    ],
    answer: 2,
    explanation:
      "First leg: time = 120/40 = 3 hours. Second leg: time = 180/60 = 3 hours. Total distance so far = 300 miles, total time = 6 hours. Desired average speed 55 mph for 400 miles (adding 100 miles) gives total time = 400/55 ≈ 7.2727 hours. Remaining time for last 100 miles = 7.2727 - 6 = 1.2727 hours. Required speed = 100/1.2727 ≈ 78.57 mph, rounded to 79 mph.",
    difficulty: 2.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 76,
    type: "vocab",
    category: "vocab",
    question:
      "Choose the correct word to complete the sentence: 'The professor was completely _____ in the outcome of the debate, as she had no personal stake.'",
    options: [
      "disinterested",
      "uninterested",
      "biased",
      "apathetic"
    ],
    answer: 0,
    explanation:
      "'Disinterested' means impartial or unbiased, which fits the context of having no personal stake. 'Uninterested' means not interested or bored. 'Biased' is the opposite of impartial. 'Apathetic' means lacking emotion or concern, but it does not specifically imply impartiality.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 77,
    type: "logic",
    category: "logic",
    question:
      "You meet three people on an island: X, Y, and Z. Each is either a knight (always tells the truth) or a knave (always lies). They make the following statements:\nX says: 'Y is a knight.'\nY says: 'Z is a knave.'\nZ says: 'X is a knave.'\nIf exactly one of them is a knight, who is the knight?",
    options: [
      "X",
      "Y",
      "Z",
      "None of them"
    ],
    answer: 2,
    explanation:
      "Assume X is the knight. Then Y is a knight (since X tells truth), but that gives two knights, contradicting exactly one knight. So X is not a knight.\n\nAssume Y is the knight. Then Z is a knave (since Y tells truth). Z says 'X is a knave'. If Z is a knave, that statement is false, so X is actually a knight. That gives two knights (Y and X), contradiction. So Y is not a knight.\n\nAssume Z is the knight. Then X is a knave (since Z tells truth). X says 'Y is a knight'. Since X is a knave, that statement is false, so Y is a knave. Y says 'Z is a knave'. Since Y is a knave, that statement is false, so Z is a knight, consistent. Thus, only Z is a knight.\n\nTherefore, Z is the knight.",
    difficulty: 1.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 78,
    type: "math",
    category: "math",
    question:
      "You buy a meal that costs $45. You want to leave a 15% tip. How much is the tip?",
    options: [
      "$6.75",
      "$5.75",
      "$7.50",
      "$6.00"
    ],
    answer: 0,
    explanation:
      "To find 15% of $45, multiply 45 by 0.15: 45 × 0.15 = 6.75. So the tip is $6.75.",
    difficulty: -2.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 79,
    type: "logic",
    category: "logic",
    question:
      "You meet two people, Alice and Bob, who are either always truthful or always liars. Alice says: 'If Bob is a liar, then I am a liar.' Bob says: 'If Alice is a truth-teller, then I am a truth-teller.' What can you conclude?",
    options: [
      "Both are truth-tellers.",
      "Both are liars.",
      "Alice is a truth-teller and Bob is a liar.",
      "Alice is a liar and Bob is a truth-teller."
    ],
    answer: 0,
    explanation:
      "Assume Alice is a truth-teller. Then her conditional statement must be true: 'If Bob is a liar, then I am a liar.' Since Alice is truthful, the consequent 'I am a liar' is false, so the antecedent 'Bob is a liar' must be false. Thus Bob is truthful. Bob's statement is 'If Alice is a truth-teller, then I am a truth-teller.' Since Alice is truthful, the antecedent is true, and Bob is truthful, so the consequent is true, making the conditional true. Consistency holds. Now assume Alice is a liar. Then her conditional statement is false. A conditional is false only when the antecedent is true and the consequent is false. Antecedent: 'Bob is a liar' must be true, so Bob is a liar. Consequent: 'I am a liar' must be false, but Alice is a liar, so the consequent is true, not false. Contradiction. Therefore Alice cannot be a liar, so both are truth-tellers.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 80,
    type: "logic",
    category: "logic",
    question:
      "Four friends—Alice, Bob, Carol, and Dave—each ordered a different dish: pizza, pasta, salad, and soup. All of them are telling the truth.\n\n- Alice says: \"I did not order pizza or pasta.\"\n- Bob says: \"I ordered soup.\"\n- Carol says: \"I did not order salad.\"\n\nWhich dish did Alice order?",
    options: [
      "pizza",
      "pasta",
      "salad",
      "soup"
    ],
    answer: 2,
    explanation:
      "Bob ordered soup. Alice did not order pizza or pasta, so Alice must have ordered salad or soup. Since Bob ordered soup, Alice cannot have soup — so Alice ordered salad.\n\nCarol did not order salad (consistent). The remaining dishes (pizza and pasta) go to Carol and Dave. Dave's dish is not constrained, so either assignment works, but Alice's dish is uniquely salad.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 81,
    type: "logic",
    category: "logic",
    question:
      "On an island where knights always tell the truth and knaves always lie, you meet two inhabitants: Alex and Blake. Alex says: 'Blake is a knave.' Blake says: 'We are both knights.' Which of the following is correct?",
    options: [
      "Alex is a knight, Blake is a knave.",
      "Alex is a knave, Blake is a knight.",
      "Both are knights.",
      "Both are knaves."
    ],
    answer: 0,
    explanation:
      "If Blake were a knight, his statement 'We are both knights' would be true, meaning Alex is also a knight. But then Alex's statement 'Blake is a knave' would be false, contradicting that Alex is a knight. Therefore, Blake cannot be a knight, so he must be a knave. Blake's statement is then false, so they are not both knights. Since Blake is a knave, Alex's statement 'Blake is a knave' is true, making Alex a knight. Thus Alex is a knight and Blake is a knave.",
    difficulty: -1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 82,
    type: "vocab",
    category: "vocab",
    question:
      "Choose the correct word to complete the sentence: 'Based on the data, economists ____ that the market will recover within the next quarter.'",
    options: [
      "infer",
      "imply",
      "allude",
      "elude"
    ],
    answer: 0,
    explanation:
      "'Infer' means to deduce or conclude from evidence, which fits the context of economists making a conclusion from data. 'Imply' means to suggest indirectly, which is what the data might do, but the subject is the economists, not the data. 'Allude' means to refer indirectly, and 'elude' means to evade or escape. Therefore, 'infer' is correct.",
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 83,
    type: "logic",
    category: "logic",
    question:
      "Four teachers—Mr. Smith, Mrs. Jones, Ms. Brown, and Dr. Lee—each teach a different subject: Math, English, Physics, and Chemistry. Dr. Lee teaches Physics. Additionally, the following conditions hold:\n- If Mr. Smith teaches Math, then Mrs. Jones teaches English.\n- If Mrs. Jones teaches English, then Ms. Brown does not teach Chemistry.\n- Exactly one of the following statements is true: Mr. Smith teaches Math or Mrs. Jones teaches English.\n\nWhich subject does Ms. Brown teach?",
    options: [
      "Math",
      "English",
      "Physics",
      "Chemistry"
    ],
    answer: 0,
    explanation:
      "Let S, J, B represent the subjects taught by Smith, Jones, Brown respectively. Given Lee teaches Physics. The conditions: (1) S=Math → J=English; (2) J=English → B≠Chemistry; (3) Exactly one of S=Math or J=English is true. If S=Math were true, then from (1) J=English must be true, contradicting exactly one true. Therefore S=Math is false and J=English is true. From (2), since J=English, B≠Chemistry. With J=English and Lee=Physics, remaining subjects are Math and Chemistry for Smith and Brown. Since S≠Math, Smith must take Chemistry, so Brown takes Math. Thus Ms. Brown teaches Math.",
    difficulty: -0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 84,
    type: "math",
    category: "math",
    question:
      "A store offers a 'buy two, get one free' promotion on items priced at $15 each. You buy 6 items. You have a coupon for 15% off your total purchase after the promotion. Sales tax is 7%. How much do you pay in total? (Round to the nearest cent.)",
    options: [
      "$54.57",
      "$64.20",
      "$45.00",
      "$48.15"
    ],
    answer: 0,
    explanation:
      "With 'buy two, get one free', for every 2 items you pay for, you get 1 free. For 6 items, you pay for 4 and get 2 free: 4 × $15 = $60. After the 15% coupon: $60 × 0.85 = $51. Sales tax of 7%: $51 × 1.07 = $54.57.",
    difficulty: 1.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 85,
    type: "math",
    category: "math",
    question:
      "You buy a pair of shoes for $85. The store offers a 20% discount, and then you must pay 6% sales tax on the discounted price. How much do you pay in total?",
    options: [
      "$68.00",
      "$72.08",
      "$71.60",
      "$74.80"
    ],
    answer: 1,
    explanation:
      "First, calculate the discounted price: 20% off $85 = 0.20 × 85 = $17 off, so discounted price = $85 - $17 = $68. Then add 6% sales tax on $68: 0.06 × 68 = $4.08. Total = $68 + $4.08 = $72.08.",
    difficulty: -1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 86,
    type: "logic",
    category: "logic",
    question:
      "In a race, five runners—Tom, Jerry, Spike, Tyke, and Nibbles—completed the course. The following facts are known:\n1. Spike finished ahead of Tom but behind Jerry.\n2. Tyke finished ahead of Jerry.\n3. Nibbles finished behind Tom.\nAssuming no ties, who finished first?",
    options: [
      "Tom",
      "Jerry",
      "Spike",
      "Tyke"
    ],
    answer: 3,
    explanation:
      "From clue 1: Jerry > Spike > Tom. From clue 2: Tyke > Jerry. So Tyke > Jerry > Spike > Tom. From clue 3: Tom > Nibbles. Thus the complete order is Tyke > Jerry > Spike > Tom > Nibbles. Therefore Tyke finished first.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 87,
    type: "logic",
    category: "logic",
    question:
      "Four friends—Alice, Bob, Carol, and Dave—sit in a row of four chairs from left to right. Alice sits to the left of Bob. Carol sits to the right of Bob. Dave sits to the left of Alice. Who sits in the third chair?",
    options: [
      "Alice",
      "Bob",
      "Carol",
      "Dave"
    ],
    answer: 1,
    explanation:
      "From the conditions, we deduce the order: Dave is left of Alice, Alice left of Bob, Bob left of Carol. So the order from left to right is Dave, Alice, Bob, Carol. Therefore, Bob sits in the third chair.",
    difficulty: -1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 88,
    type: "logic",
    category: "logic",
    question:
      "A crime has been committed. Four suspects—Alice, Bob, Carol, and Dave—are questioned. Only one of them is guilty. They make the following statements:\n\nAlice: \"Bob is guilty.\"\nBob: \"Dave is guilty.\"\nCarol: \"I am not guilty.\"\nDave: \"Alice is lying.\"\n\nOnly one statement is true. Who is guilty?",
    options: [
      "Alice",
      "Bob",
      "Carol",
      "Dave"
    ],
    answer: 2,
    explanation:
      "Assume each person is guilty and count the true statements. Only one statement should be true.\n- If Alice is guilty: Alice's statement is false (Bob not guilty), Bob's false (Dave not guilty), Carol's true (she is not guilty), Dave's true (Alice lying). Two truths, contradiction.\n- If Bob is guilty: Alice's true, Bob's false, Carol's true (she is not guilty), Dave's false (Alice told truth). Two truths, contradiction.\n- If Carol is guilty: Alice's false, Bob's false, Carol's false (she is guilty), Dave's true (Alice lying). Exactly one truth, works.\n- If Dave is guilty: Alice's false, Bob's true, Carol's true (she is not guilty), Dave's true (Alice lying). Three truths, contradiction.\nThus Carol is guilty.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 89,
    type: "logic",
    category: "logic",
    question:
      "Four friends—Alex, Beth, Chris, and Dana—each have a different favorite season: spring, summer, fall, winter. Alex does not like summer or winter. Beth likes fall. Chris does not like spring. Dana likes winter. What is Alex's favorite season?",
    options: [
      "spring",
      "summer",
      "fall",
      "winter"
    ],
    answer: 0,
    explanation:
      "Beth likes fall, Dana likes winter. Chris does not like spring, so Chris must like summer (the only remaining season after assigning fall and winter). Then Alex, who does not like summer or winter, must like spring.",
    difficulty: -1.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 90,
    type: "logic",
    category: "logic",
    question:
      "Three employees—Alex, Bailey, and Casey—each work on a different floor: 1st, 2nd, or 3rd. They each have a different job title: Analyst, Coordinator, or Manager. It is known that: 1. The Manager works on the 2nd floor. 2. Bailey is not the Coordinator. 3. Casey works on the 1st floor. 4. The Analyst works on the 3rd floor. Who is the Coordinator?",
    options: [
      "Alex",
      "Bailey",
      "Casey",
      "Cannot be determined"
    ],
    answer: 2,
    explanation:
      "From clue 1, Manager is on floor 2. From clue 4, Analyst is on floor 3. So the remaining floor 1 must be the Coordinator. Clue 3 says Casey works on floor 1, so Casey is the Coordinator. Clue 2 (Bailey is not the Coordinator) is consistent but doesn't affect the deduction.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 91,
    type: "logic",
    category: "logic",
    question:
      "Five students—Amy, Ben, Carl, Dana, and Eric—line up for a photo. Amy is not first. Ben is somewhere before Carl. Dana is immediately after Eric. Carl is third. Who is first?",
    options: [
      "Amy",
      "Ben",
      "Carl",
      "Dana"
    ],
    answer: 1,
    explanation:
      "Carl is third. Ben is before Carl, so Ben could be first or second. Dana is immediately after Eric, so they form a consecutive pair. If Eric were first, then Dana second, leaving no position before Carl for Ben (since Carl is third). Thus Eric cannot be first. Therefore Ben must be first. The only consistent order is Ben (first), Amy (second), Carl (third), Eric (fourth), Dana (fifth), satisfying all conditions.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 92,
    type: "logic",
    category: "logic",
    question:
      "Four friends—John, Mary, Paul, and Susan—each have a different favorite color (red, blue, green, yellow) and a different favorite number from 1 to 4. They give the following statements:\n1. The person who likes red has the favorite number 2.\n2. Mary's favorite number is not 1, and she does not like blue.\n3. Paul's favorite color is either yellow or green.\n4. The person who likes green has the favorite number 3.\n5. The person who likes yellow does not have the favorite number 4.\n6. John's favorite number is not 2.\nBased on this information, which of the following must be true?",
    options: [
      "Mary's favorite color is green.",
      "Paul's favorite number is 3.",
      "John's favorite color is yellow.",
      "Susan's favorite number is 1."
    ],
    answer: 0,
    explanation:
      "From clues 1, 4, and 5, we deduce the color-number mapping: red=2, green=3, blue=4, yellow=1. From clue 2, Mary is not blue and not number 1 (yellow), so Mary must be red or green. From clue 3, Paul is yellow or green. Clue 6 says John is not number 2 (red). Now consider cases: if Mary were red (2), then Paul could be yellow (1) or green (3), leading to multiple possibilities. But if Mary is green (3), then Paul must be yellow (1) because green is taken. Then John cannot be red, so John is blue (4), and Susan is red (2). This yields a unique assignment: Mary: green/3, Paul: yellow/1, John: blue/4, Susan: red/2. Thus Mary's favorite color is green must be true. The other options are false.",
    difficulty: 3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 93,
    type: "vocab",
    category: "vocab",
    question:
      "What is the meaning of the word 'perspicacious'?",
    options: [
      "Easily deceived or fooled",
      "Having a keen mental perception or understanding",
      "Tending to be overly critical or harsh",
      "Lacking energy or enthusiasm"
    ],
    answer: 1,
    explanation:
      "'Perspicacious' comes from Latin 'perspicax' meaning 'sharp-sighted'. It describes someone who has a penetrating insight or acute understanding. Option B is the correct definition. Option A is the opposite (credulous), option C is 'censorious', and option D is 'listless' or 'enervated'.",
    difficulty: 0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 94,
    type: "math",
    category: "math",
    question:
      "A shirt costs $25, and it's on sale for 20% off. What is the sale price?",
    options: [
      "$20",
      "$18",
      "$22",
      "$24"
    ],
    answer: 0,
    explanation:
      "20% of $25 is $5 (since 0.20 × 25 = 5). Subtract $5 from $25 to get the sale price of $20.",
    difficulty: -2.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 95,
    type: "math",
    category: "math",
    question:
      "A water tank holds 30 gallons. It is currently 40% full. How many gallons of water are in the tank?",
    options: [
      "12 gallons",
      "10 gallons",
      "15 gallons",
      "18 gallons"
    ],
    answer: 0,
    explanation:
      "40% of 30 gallons is calculated as 0.4 × 30 = 12 gallons.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 96,
    type: "logic",
    category: "logic",
    question:
      "Four colleagues—Alex, Bailey, Casey, and Dana—each work in a different department: Marketing, Sales, IT, and HR. Each also has a different preferred drink: coffee, tea, water, and soda. Given:\n(1) The person from IT does not drink coffee.\n(2) Bailey works in Sales and prefers tea.\n(3) The person who prefers water works in Marketing.\n(4) Alex does not work in IT and does not drink soda.\n(5) Casey prefers coffee.\n\nWhich department does Alex work in?",
    options: [
      "Marketing",
      "Sales",
      "IT",
      "HR"
    ],
    answer: 0,
    explanation:
      "From (2), Bailey works in Sales and prefers tea. From (5), Casey prefers coffee. From (4), Alex does not drink soda and does not work in IT, so Alex's drink must be water (since tea and coffee are taken). From (3), the person who prefers water works in Marketing, so Alex works in Marketing. The remaining people: Dana works in IT and drinks soda (only drink left), which satisfies (1) since soda is not coffee. Casey works in HR (only department left) and drinks coffee. Thus, Alex is in Marketing.",
    difficulty: 1.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 97,
    type: "logic",
    category: "logic",
    question:
      "If it rains, then the outdoor concert will be canceled. The concert was not canceled. Based on this information, which of the following must be true?",
    options: [
      "It did not rain.",
      "The weather was sunny.",
      "The concert was held indoors.",
      "It rained but the concert was not canceled."
    ],
    answer: 0,
    explanation:
      "The conditional statement 'If it rains, then the concert will be canceled' means that rain is a sufficient condition for cancellation. Given that the concert was not canceled, we can conclude that it did not rain (modus tollens). Option B is not necessarily true because it could have been cloudy without rain. Option C is not stated; the concert could have been canceled or not, regardless of location. Option D contradicts the conditional because if it rained, the concert should have been canceled, but it was not.",
    difficulty: -1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 98,
    type: "vocab",
    category: "vocab",
    question:
      "Choose the correct word to complete the sentence: 'The long, tedious meeting seemed to ____ the entire staff, leaving them drained and listless.'",
    options: [
      "invigorate",
      "enervate",
      "stimulate",
      "energize"
    ],
    answer: 1,
    explanation:
      "'Enervate' means to weaken or drain of energy, which fits the context of leaving the staff drained and listless. The other options all mean to give energy or vitality, which is the opposite of what the sentence describes.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 99,
    type: "math",
    category: "math",
    question:
      "Jessica invested $5,000 in a stock that appreciated by 12% in the first year. In the second year, the stock lost 8% of its value. She then sold the stock and had to pay a 15% capital gains tax on the profit (the increase from her original investment). How much profit did she make after taxes?",
    options: [
      "$152.00",
      "$129.20",
      "$22.80",
      "$120.40"
    ],
    answer: 1,
    explanation:
      "After first year: $5,000 * 1.12 = $5,600. After second year: $5,600 * 0.92 = $5,152. Profit before tax: $5,152 - $5,000 = $152. Tax: 15% of $152 = $22.80. After-tax profit: $152 - $22.80 = $129.20.",
    difficulty: 1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 100,
    type: "logic",
    category: "logic",
    question:
      "Four families—the Smiths, Joneses, Browns, and Davises—each own a different pet: a dog, a cat, a bird, or a fish. The Smiths own the dog. The Joneses do not own the cat. The Browns own the bird. The family that owns the fish is not the Davises. Which family owns the cat?",
    options: [
      "The Smiths",
      "The Joneses",
      "The Browns",
      "The Davises"
    ],
    answer: 3,
    explanation:
      "We know Smiths own dog and Browns own bird. So cat and fish remain for Joneses and Davises. Joneses do not own cat, so they must own fish. Then Davises own cat. Thus, the Davises own the cat.",
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 101,
    type: "vocab",
    category: "vocab",
    question:
      "What does the word 'enervate' mean?",
    options: [
      "to invigorate",
      "to weaken",
      "to energize",
      "to stimulate"
    ],
    answer: 1,
    explanation:
      "The word 'enervate' means to weaken or drain of energy, often confused with 'energize' which means to invigorate. It comes from Latin 'enervare' (to remove sinew). Many incorrectly think it means to energize due to similarity with 'energize'.",
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 102,
    type: "vocab",
    category: "vocab",
    question:
      "In Shakespeare's 'Hamlet', what does Hamlet mean by 'the slings and arrows of outrageous fortune'?",
    options: [
      "The unfairness of life's hardships",
      "Weapons used in battle",
      "The cruelty of his uncle",
      "The inevitability of death"
    ],
    answer: 0,
    explanation:
      "In this line from Hamlet's 'To be, or not to be' soliloquy, 'slings and arrows' are metaphors for the various hardships and misfortunes that life throws at a person. Hamlet is contemplating whether it is better to endure these difficulties or to fight against them. The phrase 'outrageous fortune' emphasizes the unfairness and randomness of suffering. The correct interpretation is that Hamlet is referring to the general hardships of life, not literal weapons, specific characters, or death itself.",
    difficulty: -0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 103,
    type: "vocab",
    category: "vocab",
    question:
      "In standard English usage, what does the word 'disinterested' mean?",
    options: [
      "Uninterested",
      "Impartial",
      "Bored",
      "Confused"
    ],
    answer: 1,
    explanation:
      "Although 'disinterested' is sometimes used informally to mean 'uninterested,' its traditional and formal meaning is 'impartial' or 'neutral.' It refers to someone who has no personal stake or bias in a situation. For example, a judge should be disinterested in the case they are presiding over. The other options are incorrect: 'uninterested' and 'bored' imply a lack of interest or engagement, while 'confused' implies mental disarray.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 104,
    type: "math",
    category: "math",
    question:
      "A smartphone is priced at $600. The store has a 20% off sale. After the discount, a 6% sales tax is added. What is the total cost?",
    options: [
      "$508.80",
      "$480.00",
      "$496.80",
      "$504.00"
    ],
    answer: 0,
    explanation:
      "First, calculate the discount: 20% of $600 is $120, so the sale price is $600 - $120 = $480. Then, add 6% sales tax: 6% of $480 is $28.80. The total cost is $480 + $28.80 = $508.80.",
    difficulty: -0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 105,
    type: "logic",
    category: "logic",
    question:
      "On an island, every inhabitant is either a knight (always tells the truth) or a knave (always lies). Three inhabitants—Alex, Bailey, and Casey—make the following statements:\n- Alex says: 'Bailey is a knave.'\n- Bailey says: 'Alex and Casey are of the same type.'\n- Casey says: 'Bailey is a knave.'\nHow many knights are there?",
    options: [
      "0",
      "1",
      "2",
      "3"
    ],
    answer: 1,
    explanation:
      "We test possibilities. Assume Alex is a knight. Then his statement is true, so Bailey is a knave. Bailey's statement must be false, so Alex and Casey are not of the same type. Since Alex is a knight, Casey must be a knave. Then Casey's statement 'Bailey is a knave' is true, but as a knave she must lie, contradiction. Thus Alex cannot be a knight. So Alex is a knave. Then his statement 'Bailey is a knave' is false, so Bailey is a knight. Bailey's statement is true, so Alex and Casey are of the same type. Since Alex is a knave, Casey must also be a knave. Then Casey's statement 'Bailey is a knave' is false (Bailey is a knight), and as a knave she lies, consistent. So we have Alex (knave), Bailey (knight), Casey (knave) — exactly one knight.",
    difficulty: 2.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 106,
    type: "vocab",
    category: "vocab",
    question:
      "What is the correct meaning of the word 'nonplussed'?",
    options: [
      "calm and unbothered",
      "confused and puzzled",
      "indifferent",
      "angry"
    ],
    answer: 1,
    explanation:
      "The word 'nonplussed' is commonly misused to mean 'unfazed' or 'unbothered', but its actual meaning is 'confused or perplexed'. It comes from Latin 'non plus' meaning 'no more', so being 'nonplussed' means being at a loss or unable to proceed. Option B is correct.",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 107,
    type: "math",
    category: "math",
    question:
      "You buy 100 shares of a stock at $42 per share, paying a 2% commission on the purchase. Later, you sell all 100 shares at $48 per share, paying a 1.5% commission on the sale. What is your total profit from this transaction?",
    options: [
      "$444",
      "$600",
      "$528",
      "$396"
    ],
    answer: 0,
    explanation:
      "Purchase cost: 100 shares × $42 = $4200. Commission on purchase: 2% of $4200 = $84. Total purchase cost: $4200 + $84 = $4284. Sale proceeds: 100 shares × $48 = $4800. Commission on sale: 1.5% of $4800 = $72. Net sale proceeds: $4800 - $72 = $4728. Profit = net sale proceeds - total purchase cost = $4728 - $4284 = $444.",
    difficulty: 2.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 108,
    type: "math",
    category: "math",
    question:
      "A car travels 240 miles on a full tank of 15 gallons. If gas costs $3.50 per gallon, how much does it cost per mile to drive this car?",
    options: [
      "$0.22",
      "$0.35",
      "$0.19",
      "$0.28"
    ],
    answer: 0,
    explanation:
      "First, find fuel consumption per mile: 15 gallons / 240 miles = 0.0625 gallons per mile. Then multiply by cost per gallon: 0.0625 * $3.50 = $0.21875, which rounds to $0.22 per mile.",
    difficulty: 0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 109,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following best defines the word 'enormity'?",
    options: [
      "Great size or magnitude",
      "A monstrous or evil act",
      "A huge building",
      "A measure of mass"
    ],
    answer: 1,
    explanation:
      "Enormity is often misused to mean largeness, but its primary meaning is extreme evil or wickedness. It derives from Latin 'enormitas' meaning 'irregularity, deviation from normal', and in English, it has come to refer to something monstrously evil.",
    difficulty: 2.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 110,
    type: "math",
    category: "math",
    question:
      "A laptop is priced at $800. During a sale, the price is reduced by 20%. After the sale, an additional 10% discount is applied to the sale price. Then 8% sales tax is added. What is the final price paid?",
    options: [
      "$576.00",
      "$622.08",
      "$640.00",
      "$691.20"
    ],
    answer: 1,
    explanation:
      "First, apply the 20% discount: $800 × 0.80 = $640. Then apply the additional 10% discount on the sale price: $640 × 0.90 = $576. Finally, add 8% sales tax: $576 × 1.08 = $622.08. Option B is correct. Option A is the price before tax, option C is only the first discount, and option D results from applying tax to the original price after a 20% discount (i.e., $800 × 0.80 × 1.08 = $691.20).",
    difficulty: 0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 111,
    type: "vocab",
    category: "vocab",
    question:
      "Which word best completes the sentence? 'She felt ___ about accepting the job offer, as it had both advantages and drawbacks.'",
    options: [
      "ambivalent",
      "ambiguous",
      "ambidextrous",
      "ambulatory"
    ],
    answer: 0,
    explanation:
      "'Ambivalent' means having mixed or contradictory feelings about something, which fits the context of both advantages and drawbacks. 'Ambiguous' means unclear or open to interpretation, not appropriate for describing feelings. 'Ambidextrous' refers to using both hands equally well, and 'ambulatory' relates to walking, both unrelated.",
    difficulty: -0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 112,
    type: "math",
    category: "math",
    question:
      "A recipe requires 3 cups of sugar to make 24 cupcakes. How many cups of sugar are needed to make 40 cupcakes?",
    options: [
      "4",
      "5",
      "6",
      "7"
    ],
    answer: 1,
    explanation:
      "Set up a proportion: 3 cups / 24 cupcakes = x cups / 40 cupcakes. Cross-multiply: 3 * 40 = 24 * x → 120 = 24x → x = 5. So 5 cups of sugar are needed.",
    difficulty: -1.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 113,
    type: "math",
    category: "math",
    question:
      "If a train travels at 60 miles per hour, how far does it travel in 30 minutes?",
    options: [
      "30 miles",
      "60 miles",
      "90 miles",
      "120 miles"
    ],
    answer: 0,
    explanation:
      "Since speed is 60 miles per hour, and 30 minutes is half an hour, the distance is 60 × 0.5 = 30 miles.",
    difficulty: -3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 114,
    type: "logic",
    category: "logic",
    question:
      "Three statements are made: A, B, and C. Exactly one of them is true. A says: 'B is false.' B says: 'C is false.' C says: 'A and B are both false.' Which statement is true?",
    options: [
      "A",
      "B",
      "C",
      "None"
    ],
    answer: 1,
    explanation:
      "Assume A is true. Then B is false. Since B is false, its statement 'C is false' is false, so C is true. Then C says 'A and B are both false', but A is true, contradiction. So A cannot be true.\n\nAssume B is true. Then C is false, so C's statement is false, meaning it is not the case that both A and B are false, i.e., at least one of A or B is true. Since B is true, that condition holds. Also, A says 'B is false', which is false because B is true, so A is false. All conditions are satisfied: only B is true.\n\nAssume C is true. Then A and B are both false. But if A is false, its statement 'B is false' is false, meaning B is actually true, which contradicts B being false. So C cannot be true.\n\nThus, only B is true.",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 115,
    type: "math",
    category: "math",
    question:
      "A jacket is on sale for 30% off. After the discount, an 8% sales tax is applied, and the final price is $75.60. What was the original price?",
    options: [
      "$90",
      "$100",
      "$110",
      "$120"
    ],
    answer: 1,
    explanation:
      "Let the original price be x. After a 30% discount, the price is 0.7x. Then 8% sales tax means multiplying by 1.08, so final price = 0.7x * 1.08 = 0.756x. Set equal to $75.60: 0.756x = 75.60, so x = 75.60 / 0.756 = 100. Thus original price is $100.",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 116,
    type: "math",
    category: "math",
    question:
      "John deposits $5,000 into a savings account that earns 4% annual interest compounded annually. How much will be in the account after 2 years?",
    options: [
      "$5,400",
      "$5,408",
      "$5,420",
      "$5,200"
    ],
    answer: 1,
    explanation:
      "The formula for compound interest is A = P(1 + r)^t, where P = $5,000, r = 0.04, and t = 2. So A = 5000 * (1.04)^2 = 5000 * 1.0816 = $5,408. Option A is simple interest ($5,400), option C is a common miscalculation (either using 1.04*1.04 incorrectly as 1.084 or adding 1.04 twice), and option D only applies one year of interest.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 117,
    type: "vocab",
    category: "vocab",
    question:
      "What does the word 'ameliorate' mean?",
    options: [
      "to worsen",
      "to improve",
      "to complicate",
      "to simplify"
    ],
    answer: 1,
    explanation:
      "'Ameliorate' comes from the Latin 'melior' meaning 'better'. It means to make something bad or unsatisfactory better. Thus, the correct definition is 'to improve'. The other options are plausible but incorrect: 'to worsen' is an antonym, while 'to complicate' and 'to simplify' are unrelated actions.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 118,
    type: "logic",
    category: "logic",
    question:
      "Three friends, Amy, Brian, and Claire, each have a different favorite among the following types of music: jazz, rock, classical. They make the following statements:\n- Amy says: \"Brian's favorite is not rock.\"\n- Brian says: \"Claire's favorite is classical.\"\n- Claire says: \"Amy's favorite is jazz.\"\nIf exactly one of them is telling the truth, what is Brian's favorite music?",
    options: [
      "jazz",
      "rock",
      "classical",
      "cannot be determined"
    ],
    answer: 3,
    explanation:
      "Assume exactly one statement is true. Test each possibility.\n\nCase 1: Amy is truthful. Then Brian's favorite is not rock. Brian lies, so Claire's favorite is not classical. Claire lies, so Amy's favorite is not jazz. The remaining assignments: If Brian is jazz, then Amy must be classical and Claire rock (since not classical). Check: Amy true (Brian not rock), Brian false (Claire not classical), Claire false (Amy not jazz). Consistent. If Brian is classical, then Amy must be rock and Claire jazz. Check: Amy true (Brian not rock), Brian false (Claire not classical), Claire false (Amy not jazz). Also consistent. So Brian could be jazz or classical.\n\nCase 2: Brian is truthful. Then Claire's favorite is classical. Amy lies, so Brian's favorite is rock. Claire lies, so Amy's favorite is not jazz. Then Amy's favorite must be jazz? No, remaining is jazz but Claire's lie says Amy not jazz. Contradiction.\n\nCase 3: Claire is truthful. Then Amy's favorite is jazz. Amy lies, so Brian's favorite is rock. Brian lies, so Claire's favorite is not classical. Then Claire's favorite must be jazz or rock? But Amy has jazz, Brian has rock, so Claire must be classical, contradicting Brian's lie. \n\nThus only Case 1 yields consistent scenarios, but Brian's favorite is not uniquely determined; it could be jazz or classical. Therefore, the answer is \"cannot be determined.\"",
    difficulty: 1.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 119,
    type: "vocab",
    category: "vocab",
    question:
      "Which word means 'something that completes or brings to perfection'?",
    options: [
      "Compliment",
      "Complement",
      "Implement",
      "Supplement"
    ],
    answer: 1,
    explanation:
      "'Complement' refers to something that completes or makes perfect, whereas 'compliment' is a polite expression of praise. 'Implement' means to put into effect or a tool, and 'supplement' is something added to complete or enhance. Therefore, 'complement' is the correct choice.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 120,
    type: "math",
    category: "math",
    question:
      "You are planning a road trip. The distance is 1,200 miles. Your car gets 25 miles per gallon on the highway and 18 miles per gallon in the city. You estimate that 80% of the trip is highway and 20% is city. Gas costs $3.20 per gallon. How much will you spend on gas? (Round to the nearest cent.)",
    options: [
      "$160.00",
      "$165.55",
      "$170.00",
      "$175.50"
    ],
    answer: 1,
    explanation:
      "First, compute highway miles: 1200 * 0.8 = 960 miles. Highway gallons: 960 / 25 = 38.4 gallons. City miles: 1200 * 0.2 = 240 miles. City gallons: 240 / 18 = 13.333... gallons. Total gallons: 38.4 + 13.333... = 51.7333... gallons. Total cost: 51.7333... * 3.20 = 165.54666..., which rounds to $165.55.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 121,
    type: "logic",
    category: "logic",
    question:
      "Three people, Alice, Bob, and Charlie, are each either always truthful or always lying. They make the following statements:\n\nAlice says, 'Bob is a liar.'\nBob says, 'Charlie is a liar.'\nCharlie says, 'Alice and Bob are both liars.'\n\nWho is telling the truth?",
    options: [
      "Alice",
      "Bob",
      "Charlie",
      "None of them"
    ],
    answer: 1,
    explanation:
      "Assume Alice is truthful. Then Bob is a liar. Since Bob lies, his statement 'Charlie is a liar' is false, so Charlie is truthful. Then Charlie's statement 'Alice and Bob are both liars' would be false because Alice is truthful, contradiction. So Alice must be a liar. Then Bob is truthful (since Alice's lie implies the opposite). Bob truthful means Charlie is a liar. Charlie's statement 'Alice and Bob are both liars' is false because Bob is truthful, so consistent. Thus only Bob tells the truth.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 122,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following best defines the word 'inchoate'?",
    options: [
      "Partially developed or just begun",
      "Completely finished and perfect",
      "Chaotic and disorderly",
      "Repeated many times"
    ],
    answer: 0,
    explanation:
      "'Inchoate' comes from Latin 'inchoatus', past participle of 'inchoare' meaning 'to begin'. It describes something that is just beginning or not fully formed, synonymous with 'incipient' or 'rudimentary'. Option A is correct. Option B is the opposite (complete). Option C confuses with 'chaotic', which is unrelated. Option D confuses with 'iterate' (to repeat).",
    difficulty: 2.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 123,
    type: "logic",
    category: "logic",
    question:
      "Three friends, Alex, Bailey, and Casey, are each taking a different elective: Art, Biology, and Chemistry. They each have a favorite color: red, blue, and green. We know: 1. The person who takes Art does not have favorite color red. 2. Bailey does not take Biology. 3. The person who takes Chemistry has favorite color blue. Which of the following must be true?",
    options: [
      "Alex takes Art",
      "Bailey's favorite is green",
      "Casey takes Biology",
      "The person taking Art has favorite color green"
    ],
    answer: 3,
    explanation:
      "From clue 3, Chemistry has blue. From clue 1, Art cannot be red, so Art must be green (since blue is taken). Therefore, the person taking Art has favorite color green. This is a necessary conclusion. The other options are not necessarily true: Alex could take any elective, Bailey's favorite could be blue or green, and Casey could take Biology or something else.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 124,
    type: "math",
    category: "math",
    question:
      "You are driving a total of 450 miles. Your car gets 30 miles per gallon on the highway and 20 miles per gallon in the city. If you drive two-thirds of the distance on the highway and the rest in the city, how many gallons of gas will you use?",
    options: [
      "15 gallons",
      "17.5 gallons",
      "18 gallons",
      "20 gallons"
    ],
    answer: 1,
    explanation:
      "Highway distance: 2/3 × 450 = 300 miles. City distance: 450 - 300 = 150 miles. Gallons on highway: 300/30 = 10. Gallons in city: 150/20 = 7.5. Total: 10 + 7.5 = 17.5 gallons.",
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 125,
    type: "math",
    category: "math",
    question:
      "A television is on sale for 25% off. The sale price is $375. What was the original price?",
    options: [
      "$500",
      "$450",
      "$400",
      "$425"
    ],
    answer: 0,
    explanation:
      "The sale price is 75% of the original price (100% - 25% = 75%). So original price = sale price / 0.75 = 375 / 0.75 = 500.",
    difficulty: -1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 126,
    type: "logic",
    category: "logic",
    question:
      "Four friends - Emily, Jack, Olivia, and Ryan - are sitting in a row. Their ages are 22, 25, 28, and 31, but not necessarily in that order. Given the following clues: (1) Emily is not the youngest. (2) Jack is older than Olivia. (3) Ryan is younger than Jack but older than Emily. Who is 28 years old?",
    options: [
      "Emily",
      "Jack",
      "Olivia",
      "Ryan"
    ],
    answer: 3,
    explanation:
      "From clue (3), Jack is older than Ryan, and Ryan is older than Emily, so the age order among these three is Jack > Ryan > Emily. Since Emily is not the youngest (clue 1), the youngest person (22) must be Olivia. Then Emily can be 25, Ryan 28, and Jack 31, satisfying all clues. Thus Ryan is 28.",
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 127,
    type: "vocab",
    category: "vocab",
    question:
      "Which word means 'to examine or inspect closely and thoroughly'?",
    options: [
      "Scrutinize",
      "Ignore",
      "Neglect",
      "Admire"
    ],
    answer: 0,
    explanation:
      "'Scrutinize' comes from the Latin 'scrutari' meaning 'to search' and means to examine very carefully. 'Ignore' means to refuse to take notice, 'neglect' means to fail to care for properly, and 'admire' means to regard with respect or warm approval. Only 'scrutinize' matches the definition of close examination.",
    difficulty: -1.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 128,
    type: "vocab",
    category: "vocab",
    question:
      "The word 'egregious' originally meant 'remarkably good' but is now used to mean 'outstandingly bad.' What is this type of semantic change called?",
    options: [
      "Pejoration",
      "Amelioration",
      "Semantic shift",
      "Synecdoche"
    ],
    answer: 0,
    explanation:
      "Pejoration is the process by which a word's meaning shifts to a less favorable sense, as with 'egregious' (from Latin 'egregius' meaning 'distinguished' to its modern negative sense). Amelioration is the opposite (e.g., 'nice' from 'foolish' to 'pleasant'). Semantic shift is a broader term encompassing all meaning changes, while synecdoche is a figure of speech where a part represents the whole or vice versa.",
    difficulty: 1.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 129,
    type: "vocab",
    category: "vocab",
    question:
      "What does the idiom 'to take something with a grain of salt' mean?",
    options: [
      "To accept something with skepticism or doubt",
      "To add flavor to food",
      "To agree enthusiastically",
      "To ignore completely"
    ],
    answer: 0,
    explanation:
      "The idiom 'to take something with a grain of salt' means to view something with skepticism, not taking it literally or too seriously. It originates from the ancient practice of using salt as a preservative or antidote, suggesting that a pinch of salt makes information easier to swallow, implying that one should be cautious about accepting it as true.",
    difficulty: -0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 130,
    type: "math",
    category: "math",
    question:
      "A driver travels the first 60 miles of a trip at 40 miles per hour, and the next 60 miles at 60 miles per hour. What is the average speed for the entire 120-mile trip?",
    options: [
      "48 mph",
      "50 mph",
      "45 mph",
      "52 mph"
    ],
    answer: 0,
    explanation:
      "The time for the first 60 miles is 60/40 = 1.5 hours. The time for the next 60 miles is 60/60 = 1 hour. Total time = 2.5 hours. Total distance = 120 miles. Average speed = 120/2.5 = 48 mph. The common mistake is to average 40 and 60, giving 50 mph, but that ignores the different times spent at each speed.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 131,
    type: "vocab",
    category: "vocab",
    question:
      "Which sentence uses 'infer' correctly?",
    options: [
      "The speaker inferred that the audience was bored.",
      "The data infers a strong correlation.",
      "I inferred from his tone that he was angry.",
      "She inferred her opinion in the debate."
    ],
    answer: 2,
    explanation:
      "The verb 'infer' means to deduce or conclude from evidence, not to hint or suggest. The speaker implies; the listener infers. In option C, the subject is the listener drawing a conclusion from tone, which is correct. Option A uses 'inferred' where 'implied' would be correct. Option B uses 'infers' for data, which is incorrect because data does not imply; it suggests. Option D uses 'inferred' to mean 'stated indirectly,' which is incorrect; she should have 'implied' her opinion.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 132,
    type: "logic",
    category: "logic",
    question:
      "Three friends—Alice, Ben, and Carol—each have a different favorite subject among Math, Science, and History. They also each have a different favorite sport among Tennis, Basketball, and Soccer. We know that:\n1. Alice's favorite subject is not Math.\n2. The person who likes Science also likes Tennis.\n3. Ben's favorite sport is not Basketball.\n4. Carol's favorite subject is History.\nWhat is Ben's favorite sport?",
    options: [
      "Tennis",
      "Basketball",
      "Soccer",
      "None of the above"
    ],
    answer: 2,
    explanation:
      "From clue 4, Carol's favorite subject is History. Therefore, the remaining subjects (Math and Science) are for Alice and Ben. Clue 1 says Alice does not like Math, so Alice must like Science, and consequently Ben likes Math. Clue 2 states that the person who likes Science (Alice) also likes Tennis, so Alice's favorite sport is Tennis. The remaining sports are Basketball and Soccer for Ben and Carol. Clue 3 says Ben's favorite sport is not Basketball, so Ben's favorite sport must be Soccer.",
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 133,
    type: "math",
    category: "math",
    question:
      "The temperature in a city is 68°F. If it rises by 10°C, what is the new temperature in Fahrenheit?",
    options: [
      "78°F",
      "86°F",
      "54°F",
      "118°F"
    ],
    answer: 1,
    explanation:
      "First, convert 68°F to Celsius: C = (68 - 32) × 5/9 = 36 × 5/9 = 20°C. Adding 10°C gives 30°C. Then convert back to Fahrenheit: F = 30 × 9/5 + 32 = 54 + 32 = 86°F. Option A (78°F) results from simply adding 10 without conversion. Option C (54°F) comes from converting 30°C to Fahrenheit but forgetting to add 32. Option D (118°F) occurs if one fails to subtract 32 in the initial conversion.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 134,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following best defines the word 'meticulous'?",
    options: [
      "Careful and precise",
      "Careless and sloppy",
      "Quick and energetic",
      "Loud and forceful"
    ],
    answer: 0,
    explanation:
      "The word 'meticulous' means showing great attention to detail, being very careful and precise. Therefore, option A is correct. The other options are opposite or unrelated in meaning.",
    difficulty: -1.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 135,
    type: "logic",
    category: "logic",
    question:
      "You meet two people: Alice and Bob. Alice says, 'Bob is a liar.' Bob says, 'Alice is truthful.' If one of them always tells the truth and the other always lies, who is the truth-teller?",
    options: [
      "Alice is the truth-teller.",
      "Bob is the truth-teller.",
      "Both are truth-tellers.",
      "Both are liars."
    ],
    answer: 0,
    explanation:
      "Assume Alice is truthful. Then her statement 'Bob is a liar' is true, so Bob lies. Bob's statement 'Alice is truthful' would then be false, which is consistent because Alice is actually truthful. Now assume Alice is a liar. Then her statement 'Bob is a liar' is false, meaning Bob is truthful. Then Bob's statement 'Alice is truthful' would be true, but that contradicts that Alice is a liar. So the only consistent scenario is that Alice is truthful and Bob lies.",
    difficulty: -1.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 136,
    type: "math",
    category: "math",
    question:
      "A store is having a 20% off sale. After the discount, an additional 5% is taken off the sale price. What is the final price of an item originally priced at $200?",
    options: [
      "$150",
      "$152",
      "$154",
      "$156"
    ],
    answer: 1,
    explanation:
      "First, apply the 20% discount: 20% of $200 = $40, so the sale price is $200 - $40 = $160. Then apply the additional 5% discount on the sale price: 5% of $160 = $8, so the final price is $160 - $8 = $152.",
    difficulty: 0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 137,
    type: "vocab",
    category: "vocab",
    question:
      "Which word best fits the sentence: 'Despite his reputation as a talkative person, he was surprisingly _____ about his childhood.'",
    options: [
      "reluctant",
      "reticent",
      "redundant",
      "irrelevant"
    ],
    answer: 1,
    explanation:
      "'Reticent' means inclined to be silent or uncommunicative, which matches the context of being reserved about one's childhood. 'Reluctant' implies unwillingness to act, which is close but less precise for describing speech. 'Redundant' and 'irrelevant' do not fit the intended meaning.",
    difficulty: 0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 138,
    type: "math",
    category: "math",
    question:
      "A furniture store increases the price of a sofa by 20%. Later, during a sale, they decrease the new price by 20%. If the original price was $500, what is the final price?",
    options: [
      "$480",
      "$500",
      "$520",
      "$460"
    ],
    answer: 0,
    explanation:
      "A 20% increase multiplies the original price by 1.2, resulting in $600. Then a 20% decrease multiplies that by 0.8, giving $480. Note that the two percentage changes do not cancel because the decrease is applied to the increased price.",
    difficulty: -0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 139,
    type: "logic",
    category: "logic",
    question:
      "Four employees—Tom, Jerry, Spike, and Tyke—each take a different day off from Monday to Thursday. Tom does not take Monday off. Jerry takes off the day before Spike. Tyke takes off the day after Tom. Which day does Tom take off?",
    options: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday"
    ],
    answer: 2,
    explanation:
      "Let Monday=1, Tuesday=2, Wednesday=3, Thursday=4. Tom ≠1. Tyke = Tom +1. Jerry = Spike -1. All days distinct. If Tom=2, then Tyke=3. Then Jerry and Spike must be 1 and 4, but Jerry = Spike-1: if Spike=4, Jerry=3 (taken); if Spike=1, Jerry=0 (invalid). So Tom=2 fails. If Tom=3, then Tyke=4. Then Jerry and Spike are 1 and 2: if Spike=2, Jerry=1 works. If Tom=4, Tyke=5 invalid. Thus Tom=3 (Wednesday).",
    difficulty: -0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 140,
    type: "vocab",
    category: "vocab",
    question:
      "Which word best describes a person who is exceedingly idealistic, unrealistic, and motivated by lofty but impractical ideals?",
    options: [
      "Utopian",
      "Quixotic",
      "Romantic",
      "Fanciful"
    ],
    answer: 1,
    explanation:
      "The word 'quixotic' derives from the character Don Quixote in Cervantes' novel, known for his impractical chivalrous pursuits. While 'utopian' refers to an idealized society, 'romantic' emphasizes emotion and imagination, and 'fanciful' suggests whimsy, only 'quixotic' specifically captures the blend of idealism and impracticality in a person's actions or ideas.",
    difficulty: 0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 141,
    type: "vocab",
    category: "vocab",
    question:
      "What is the meaning of the word 'bemused'?",
    options: [
      "Amused",
      "Confused",
      "Bored",
      "Annoyed"
    ],
    answer: 1,
    explanation:
      "Bemused means bewildered, confused, or lost in thought, not amused. It is a common error to think it means 'amused' because of the similarity in sound, but the prefix 'be-' intensifies 'muse' (to ponder), leading to a state of confusion or puzzlement.",
    difficulty: -0.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 142,
    type: "logic",
    category: "logic",
    question:
      "John is taller than Mary. Mary is taller than Sue. Who is the tallest?",
    options: [
      "John",
      "Mary",
      "Sue",
      "Cannot be determined"
    ],
    answer: 0,
    explanation:
      "Since John is taller than Mary, and Mary is taller than Sue, we can deduce that John is taller than Sue as well. Therefore, John is the tallest among the three.",
    difficulty: -2.8,
    discrimination: 1,
    guessing: 0.25,
  },

  // ════════════════════════════════════════════
  //  事件事理分析
  // ════════════════════════════════════════════
  {
    id: 143,
    type: "event",
    category: "event",
    question:
      "Order these events by cause and effect:\n① The company quarterly earnings report shows a major loss\n② The CEO announces resignation\n③ The stock price drops sharply\n④ Investors sell off shares\n\nWhat is the correct causal order?",
    options: ["①→②→③→④","②→①→④→③","③→④→①→②","④→③→②→①"],
    answer: 0,
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "The earnings loss (①) is the root cause, leading to the CEO resignation (②), which triggers the stock price drop (③), and then investor sell-off (④). The chain is ①→②→③→④.",
  },
  {
    id: 144,
    type: "event",
    category: "event",
    question:
      "Order these events chronologically:\n① A new social media app goes viral among teenagers\n② Major brands create accounts on the platform\n③ The platform launches a creator monetization program\n④ Influencers and content creators flock to the platform\n\nWhat is the correct order?",
    options: ["①→②→③→④","①→③→②→④","③→①→②→④","②→①→④→③"],
    answer: 0,
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "The app gains users first (①), brands follow the audience (②), the platform then incentivizes creators (③), and creators join (④). Correct order: ①→②→③→④.",
  },
  {
    id: 145,
    type: "event",
    category: "event",
    question:
      "Order these events by cause and effect:\n① A city implements a fare-free public transit policy\n② Public transit ridership increases by 35%\n③ Traffic congestion during peak hours drops significantly\n④ Air quality measurements show a measurable improvement\n\nWhat is the correct causal order?",
    options: ["①→②→③→④","②→①→③→④","①→③→②→④","③→②→①→④"],
    answer: 0,
    difficulty: 0,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "The policy change (①) causes more people to ride transit (②), which reduces cars on the road (③), leading to better air quality (④). Chain: ①→②→③→④.",
  },
  {
    id: 146,
    type: "event",
    category: "event",
    question:
      "Order these events chronologically in a scientific discovery process:\n① A graduate student notices an anomaly in experimental data\n② The research team replicates the finding across multiple labs\n③ A paper is submitted to a peer-reviewed journal\n④ The discovery is widely reported in mainstream media\n\nWhat is the correct order?",
    options: ["①→②→③→④","②→①→④→③","①→③→②→④","④→①→②→③"],
    answer: 0,
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "Discovery starts with noticing an anomaly (①), then replication validates it (②), then peer-reviewed publication (③), and finally media coverage (④). Correct order: ①→②→③→④.",
  },

  // ════════════════════════════════════════════
  //  LLM 批量生成 · 2026-06-12
  //  Event 23 题
  // ════════════════════════════════════════════
  {
    id: 147,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence:\n1. Farmers experience lower crop yields.\n2. The city imposes water restrictions.\n3. Food prices rise.\n4. The region suffers a severe drought.",
    options: [
      "Severe drought, Water restrictions, Lower crop yields, Higher food prices",
      "Water restrictions, Severe drought, Lower crop yields, Higher food prices",
      "Lower crop yields, Severe drought, Water restrictions, Higher food prices",
      "Severe drought, Lower crop yields, Water restrictions, Higher food prices"
    ],
    answer: 0,
    explanation:
      "The drought is the initial cause, leading to water restrictions as a response. The restrictions reduce water for irrigation, causing lower crop yields. The reduced supply then drives up food prices.",
    difficulty: -0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 148,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical chronological order based on cause and effect:\n1. Company A launches a new smartphone.\n2. Sales of Company A's phone drop significantly.\n3. Competitor B releases a similar phone at a lower price.\n4. Sales skyrocket in the first month.\n5. Company A reduces the price of its phone.",
    options: [
      "1, 4, 3, 2, 5",
      "1, 3, 4, 2, 5",
      "1, 4, 2, 3, 5",
      "1, 3, 5, 4, 2"
    ],
    answer: 0,
    explanation:
      "The correct sequence starts with the launch (1) causing high sales (4). Then, competitor's release (3) leads to a sales drop (2), prompting a price reduction (5). Option 2 has competitor before high sales, option 3 has drop before competitor, and option 4 has price reduction before drop, which are illogical.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 149,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Software company releases new product version. (2) Customer complaints about bugs increase. (3) Company hires additional developers. (4) Product performance improves. (5) Customer satisfaction ratings rise.",
    options: [
      "Release → Complaints → Hire → Improve → Satisfaction",
      "Complaints → Release → Hire → Improve → Satisfaction",
      "Release → Hire → Complaints → Improve → Satisfaction",
      "Release → Complaints → Improve → Hire → Satisfaction"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the release of a new version (1), which introduces bugs leading to increased complaints (2). In response, the company hires more developers (3) to fix the issues, resulting in improved performance (4), and ultimately higher customer satisfaction (5). Any other order breaks the logical cause-and-effect relationships, such as hiring before complaints or improving performance before fixing bugs.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 150,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The company launched a new smartphone. (2) Sales of the smartphone exceeded projections. (3) The marketing team released an online advertising campaign for the smartphone. (4) Website traffic to the product page increased significantly.",
    options: [
      "1, 3, 4, 2",
      "3, 1, 4, 2",
      "1, 2, 3, 4",
      "3, 4, 1, 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the product launch (1), which enables the marketing team to create an advertising campaign (3). The campaign then drives an increase in website traffic (4), which subsequently leads to higher sales (2). Option A (1,3,4,2) reflects this logical chain. Other options either place marketing before the product is available (B), imply sales occurred before traffic increased (C), or suggest traffic increased before the launch or campaign (D).",
    difficulty: 0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 151,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) The company recalls the product. (2) Health inspectors confirm contamination. (3) Consumers report food poisoning. (4) The company issues a public apology.",
    options: [
      "3 → 2 → 1 → 4",
      "1 → 3 → 2 → 4",
      "3 → 1 → 2 → 4",
      "2 → 3 → 1 → 4"
    ],
    answer: 0,
    explanation:
      "The correct sequence begins with consumers reporting food poisoning (3). Health inspectors then investigate and confirm contamination (2). Following confirmation, the company recalls the product (1). Finally, the company issues a public apology (4). Thus, the order is 3-2-1-4.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 152,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence:\n(1) The company's sales decline significantly.\n(2) The company announces a price reduction campaign.\n(3) Competitors lower their prices as well.\n(4) The company's profit margins shrink.",
    options: [
      "1, 2, 3, 4",
      "2, 1, 3, 4",
      "1, 3, 2, 4",
      "3, 2, 1, 4"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence is that initial sales decline triggers a price reduction campaign, which prompts competitors to also lower prices, ultimately leading to reduced profit margins. Options B, C, and D place events out of order, violating the cause-effect relationships (e.g., price reduction cannot precede sales decline that caused it).",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 153,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Company hires external safety consultants. (2) Regulatory fines are imposed. (3) Company issues a product recall. (4) Widespread media coverage of the recall. (5) Consumer complaints about product malfunctions increase.",
    options: [
      "5 → 1 → 3 → 4 → 2",
      "5 → 3 → 1 → 4 → 2",
      "1 → 5 → 3 → 4 → 2",
      "5 → 1 → 4 → 3 → 2"
    ],
    answer: 0,
    explanation:
      "The causal chain begins with an increase in consumer complaints (5), which prompts the company to investigate by hiring external safety consultants (1). The consultants likely identify a serious defect, leading the company to issue a recall (3). The recall attracts widespread media coverage (4), and subsequently, regulatory authorities impose fines (2). Alternative sequences violate causality: for instance, issuing a recall before hiring consultants (option 2) skips the necessary investigation; hiring consultants before complaints arise (option 3) lacks a trigger; and media coverage before the recall (option 4) is implausible because the recall itself is the news event.",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 154,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Traffic congestion decreases during peak hours. (2) Citizens start using bikes for short trips. (3) Bike-sharing stations are installed across the city. (4) City council approves funding for bike-sharing program.",
    options: [
      "4 → 3 → 2 → 1",
      "3 → 4 → 2 → 1",
      "4 → 2 → 3 → 1",
      "4 → 3 → 1 → 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence is: first, the city council approves funding (4), which enables the installation of bike-sharing stations (3). Once stations are in place, citizens start using bikes for short trips (2). Finally, increased bike usage leads to reduced traffic congestion (1). Option A follows this logic. Option B has installation before approval, which is implausible. Option C has citizen usage before station installation, which is illogical. Option D has congestion decreasing before citizens start using bikes, reversing the cause and effect.",
    difficulty: -0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 155,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Mark is offered a job at a top company. (2) Mark studies hard for several weeks. (3) Mark passes his final exams.",
    options: [
      "2, 3, 1",
      "3, 2, 1",
      "1, 2, 3",
      "2, 1, 3"
    ],
    answer: 0,
    explanation:
      "Studying hard leads to passing exams, which then leads to being offered a job. The correct causal sequence is: Mark studies hard (2) → passes exams (3) → gets job offer (1). Thus, the order is 2, 3, 1.",
    difficulty: -2.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 156,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) City officials approve funding for subway construction. (2) Construction of subway tunnels begins. (3) Subway stations are built. (4) Subway service starts. (5) Commuters shift from cars to subway.",
    options: [
      "1,2,3,4,5",
      "2,1,3,4,5",
      "1,3,2,4,5",
      "1,2,4,3,5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with approval of funding (1), which enables tunnel construction (2). After tunnels are built, stations are constructed (3). Only then can subway service start (4), leading to commuters shifting from cars to subway (5). Any other order violates the temporal and causal dependencies between these events.",
    difficulty: -0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 157,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Chatter updates its algorithm to prioritize paid content. (2) Users complain of reduced organic reach and many migrate to Talk. (3) Chatter's ad revenue declines as user engagement drops. (4) Chatter's stock price falls sharply. (5) A hedge fund launches a hostile takeover bid for Chatter.",
    options: [
      "1, 2, 3, 4, 5",
      "1, 3, 2, 4, 5",
      "2, 1, 3, 4, 5",
      "1, 2, 4, 3, 5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with the algorithm update (1), which directly causes user dissatisfaction and migration to a rival platform (2). This decline in active users leads to reduced ad revenue (3), as fewer users mean less engagement and fewer ad impressions. The revenue drop negatively impacts investor confidence, causing the stock price to fall (4). Finally, the low stock price makes Chatter an attractive target for a hostile takeover bid (5). Other options misplace the order: option B puts ad revenue decline before user migration, which is illogical since revenue depends on user engagement; option C starts with user complaints before the algorithm update; option D incorrectly places the stock price fall before the ad revenue decline.",
    difficulty: 3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 158,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) City council passes a law requiring residents to separate recyclables. (2) Recycling contamination rates decrease. (3) Residents receive educational pamphlets on proper recycling. (4) Recycling processing facility reports higher quality materials. (5) City's recycling revenue increases.",
    options: [
      "1-2-3-4-5",
      "1-3-2-4-5",
      "3-1-2-4-5",
      "1-3-4-2-5"
    ],
    answer: 1,
    explanation:
      "The law (1) is the initial cause, which leads to the distribution of educational pamphlets (3) to inform residents. Proper education results in decreased contamination (2), which in turn leads to higher quality materials at the facility (4). Finally, higher quality materials increase recycling revenue (5). Thus, the correct sequence is 1-3-2-4-5.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 159,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Several customers report fires caused by the battery pack. (2) The company issues a formal recall of all affected units. (3) Engineers identify a manufacturing defect in the battery pack. (4) A news article highlights the potential danger of the batteries.",
    options: [
      "1 → 3 → 4 → 2",
      "3 → 1 → 2 → 4",
      "4 → 1 → 3 → 2",
      "1 → 4 → 2 → 3"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with customer reports of fires (1), which triggers an investigation by engineers who identify the defect (3). The defect information is then publicized via a news article (4), leading to the company's recall decision (2).",
    difficulty: -0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 160,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Anna's phone battery starts lasting longer. (2) Anna installs a battery optimization app. (3) Anna reads online about battery-saving tips. (4) Anna notices her phone battery drains quickly.",
    options: [
      "4, 3, 2, 1",
      "1, 2, 3, 4",
      "3, 4, 2, 1",
      "2, 1, 4, 3"
    ],
    answer: 0,
    explanation:
      "The correct sequence is 4 (notice problem) → 3 (read tips) → 2 (install app) → 1 (battery lasts longer). Anna first notices the battery draining quickly, which motivates her to read online about solutions. After learning about battery-saving tips, she installs an optimization app, which then causes the battery to last longer. The other orders are illogical because they place events out of causal order (e.g., the battery lasting longer before installing the app, or reading tips before noticing the problem).",
    difficulty: -2.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 161,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The coffee shop introduces a loyalty program. (2) The coffee shop experiences a decline in customer visits. (3) The cost of coffee beans increases significantly. (4) The owner raises the prices of all beverages. (5) Customers complain about the higher prices.",
    options: [
      "3 → 4 → 5 → 2 → 1",
      "3 → 4 → 2 → 5 → 1",
      "4 → 3 → 5 → 2 → 1",
      "3 → 5 → 4 → 2 → 1"
    ],
    answer: 0,
    explanation:
      "The causal chain starts with the increase in coffee bean costs (3), which forces the owner to raise prices (4). Higher prices lead to customer complaints (5), which cause a decline in customer visits (2). The owner then introduces a loyalty program (1) to attract customers back. Option A correctly follows this cause-and-effect sequence.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 162,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Reports of injuries surface, (2) Company issues a product recall, (3) Safety defect is identified in manufacturing, (4) Sales of the product decline.",
    options: [
      "1, 2, 3, 4",
      "3, 1, 2, 4",
      "2, 4, 1, 3",
      "4, 3, 1, 2"
    ],
    answer: 1,
    explanation:
      "The causal sequence begins with the safety defect being identified in manufacturing (3), which leads to injuries caused by the defect, prompting reports to surface (1). In response to the reports, the company issues a recall (2), and as a result of the recall and negative publicity, sales decline (4). Thus, the correct order is 3, 1, 2, 4.",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 163,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The company expands production capacity. (2) The company's electricity costs decrease. (3) The government announces tax credits for solar energy investment. (4) The company installs solar panels.",
    options: [
      "3, 4, 2, 1",
      "3, 2, 4, 1",
      "1, 3, 4, 2",
      "4, 3, 2, 1"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the government announcing tax credits (3), which incentivizes the company to install solar panels (4). The solar panels then cause a decrease in electricity costs (2), and the cost savings enable the company to expand production capacity (1). Option A is the only order that follows this logic. Option B incorrectly places the cost decrease before the installation. Option C starts with expansion, which is an effect, not a cause. Option D starts with installation before the tax credits that motivated it.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 164,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Strong winds knock down a tree onto power lines, (2) The power outage lasts for several hours, (3) Residents start using generators to power their homes, (4) Carbon monoxide poisoning cases are reported at the local hospital.",
    options: [
      "1, 2, 3, 4",
      "1, 3, 2, 4",
      "2, 1, 3, 4",
      "4, 3, 2, 1"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the storm causing the tree to fall on power lines (1), which leads to a power outage (2). Because of the outage, residents use generators (3), and improper use of generators causes carbon monoxide poisoning (4). Therefore, the order is 1, 2, 3, 4.",
    difficulty: 0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 165,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) A major social media platform announces a new privacy policy that restricts data sharing with third-party advertisers. (2) The platform's advertising revenue declines significantly. (3) Many users express outrage and delete their accounts. (4) The company hires a public relations firm to improve its image.",
    options: [
      "1, 3, 2, 4",
      "1, 2, 3, 4",
      "3, 1, 2, 4",
      "1, 3, 4, 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the announcement of the new privacy policy (1). This leads to user outrage and account deletions (3), which then causes a decline in advertising revenue (2) because fewer users mean less data and ad impressions. Finally, the company hires a PR firm (4) in response to the revenue decline and negative publicity. Option A (1,3,2,4) is the only order that follows this logical chain.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 166,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Harmony introduces a personalized playlist algorithm. (2) Users spend more time on the platform, increasing ad revenue. (3) Competitors replicate the feature, leading to market saturation. (4) Harmony's user growth slows, so they reduce investment in algorithm improvement. (5) User engagement declines as algorithm quality stagnates.",
    options: [
      "1,2,3,4,5",
      "1,3,2,4,5",
      "1,2,4,3,5",
      "2,1,3,4,5"
    ],
    answer: 0,
    explanation:
      "The correct sequence starts with Harmony introducing a new algorithm (1), which leads to increased user time and ad revenue (2). This success attracts competitors who copy the feature (3), causing market saturation and slowing Harmony's growth. In response, Harmony cuts investment in the algorithm (4), leading to stagnation and declining user engagement (5). Other orders break the cause-effect chain, e.g., competitors copying before user growth is implausible.",
    difficulty: 2.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 167,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Student studies regularly. (2) Student performs well on the test. (3) Student understands the material. (4) Student gets a good grade.",
    options: [
      "1, 3, 2, 4",
      "2, 1, 3, 4",
      "3, 1, 4, 2",
      "1, 2, 3, 4"
    ],
    answer: 0,
    explanation:
      "Studying regularly (1) leads to understanding the material (3), which leads to performing well on the test (2), which then leads to getting a good grade (4). Thus the correct order is 1, 3, 2, 4.",
    difficulty: -1.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 168,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Jane updates her resume. (2) Jane interviews and receives a job offer. (3) Jane's company announces layoffs. (4) Jane resigns from her current position. (5) Jane applies for several positions.",
    options: [
      "3, 1, 5, 2, 4",
      "1, 3, 5, 2, 4",
      "3, 5, 1, 2, 4",
      "1, 5, 3, 2, 4"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with layoff announcements (3), which prompts Jane to update her resume (1). She then applies for jobs (5), interviews and gets an offer (2), and finally resigns (4). Option A (3,1,5,2,4) is the only one that follows this logical cause-effect chain.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 169,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence:\n1. A tech company releases a new AI-powered customer service system.\n2. The company eliminates several human customer service positions.\n3. Customer satisfaction ratings decline sharply.\n4. The AI system is updated with better natural language processing.\n5. Customer satisfaction ratings recover and exceed previous levels.",
    options: [
      "1 → 2 → 3 → 4 → 5",
      "1 → 3 → 2 → 4 → 5",
      "2 → 1 → 3 → 4 → 5",
      "1 → 2 → 4 → 3 → 5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with the release of the AI system (1), which directly leads to the elimination of human customer service positions (2) as the company relies on the new technology. Subsequently, customers experience impersonal service, causing satisfaction to decline sharply (3). In response, the company updates the AI system with better language processing (4), which eventually improves service quality, leading to a recovery and rise in satisfaction (5). The other options contain logical inconsistencies: option B places satisfaction decline before layoffs, despite the layoffs being a direct consequence of the system release and a likely cause of the decline; option C has layoffs before the system release; option D has the AI update before the satisfaction decline, which is implausible because the decline typically motivates the update.",
    difficulty: 0.6,
    discrimination: 1,
    guessing: 0.25,
  },

  // Causal Inference
  {
    id: 170,
    type: "event-cause",
    category: "event-cause",
    question:
      "After a company introduced a four-day workweek, employee satisfaction scores rose by 35%, but overall productivity remained flat compared to the previous year. Which of the following best explains this outcome?",
    options: ["Employees used the extra day off for leisure rather than rest","The company simultaneously reduced headcount by 10%","Employees condensed five days of work into four, leading to burnout","The productivity measurement included only output quantity, not quality"],
    answer: 0,
    difficulty: 0.2,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "If employees use the extra day for leisure rather than deep rest or skill development, satisfaction rises but productivity gains are minimal. A is the most direct explanation. B would suggest productivity per person increased. C would likely decrease satisfaction. D shifts the measurement criteria but does not explain the flat productivity.",
  },
  {
    id: 171,
    type: "event-cause",
    category: "event-cause",
    question:
      "A national park introduced a mandatory reservation system to reduce overcrowding. Visitor numbers dropped by 45%, but visitor satisfaction scores also decreased. Which of the following best explains the decrease in satisfaction?",
    options: ["The reservation system created access barriers for spontaneous visitors","Fewer visitors meant less revenue for park maintenance","Nearby parks without reservations saw increased attendance","Weather conditions were particularly poor during the study period"],
    answer: 0,
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "The reservation system, while reducing crowding, created friction for visitors who preferred spontaneous trips. Those who did visit may have been frustrated by the booking process itself. A directly explains the paradox. B concerns maintenance, not visitor experience. C is about other parks. D is an external factor.",
  },

  // Argument Analysis
  {
    id: 172,
    type: "event-argument",
    category: "event-argument",
    question:
      "A study tracked 10,000 adults for 15 years and found that those who owned pets had a 25% lower risk of heart disease. The researchers concluded: 'Pet ownership reduces the risk of heart disease.'\n\nWhich of the following is an assumption the argument depends on?",
    options: ["People who choose to own pets do not already have characteristics that lower heart disease risk","Dog ownership provides more cardiovascular benefit than cat ownership","The study participants accurately reported their pet ownership status","Heart disease risk does not vary significantly across different age groups"],
    answer: 0,
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "The argument moves from correlation (pet owners have lower risk) to causation (pet ownership reduces risk). This requires assuming no confounding variable — that people who choose pets are not inherently healthier. A correctly identifies this assumption. B is irrelevant. C is a minor methodological detail. D is too broad.",
  },
  {
    id: 173,
    type: "event-argument",
    category: "event-argument",
    question:
      "A city council member argues: 'Since we installed security cameras in the downtown area, reported crimes have decreased by 20%. Security cameras are clearly effective at preventing crime.'\n\nWhich of the following, if true, most weakens the argument?",
    options: ["Police patrols in the downtown area were doubled during the same period","The security cameras have frequent technical malfunctions","Reported crimes decreased by a similar percentage in nearby cities without cameras","Some crimes may have shifted to areas without cameras rather than being prevented"],
    answer: 2,
    difficulty: 1,
    discrimination: 1,
    guessing: 0.25,
    explanation:
      "If nearby cities without cameras experienced similar crime drops, the decrease is likely due to broader trends (e.g., economic improvement) rather than cameras. C is the strongest weakener, providing a controlled comparison. A weakens (alternative cause) but less strongly. B is about malfunction rate. D suggests crime displacement, not prevention failure.",
  },

  // ════════════════════════════════════════════
  //  LLM 批量生成 · 2026-06-12
  //  Event Seq 23 题、Argument 13 题、Cause/Effect 13 题
  // ════════════════════════════════════════════
  {
    id: 174,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence:\n1. Farmers experience lower crop yields.\n2. The city imposes water restrictions.\n3. Food prices rise.\n4. The region suffers a severe drought.",
    options: [
      "Severe drought, Water restrictions, Lower crop yields, Higher food prices",
      "Water restrictions, Severe drought, Lower crop yields, Higher food prices",
      "Lower crop yields, Severe drought, Water restrictions, Higher food prices",
      "Severe drought, Lower crop yields, Water restrictions, Higher food prices"
    ],
    answer: 0,
    explanation:
      "The drought is the initial cause, leading to water restrictions as a response. The restrictions reduce water for irrigation, causing lower crop yields. The reduced supply then drives up food prices.",
    difficulty: -0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 175,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical chronological order based on cause and effect:\n1. Company A launches a new smartphone.\n2. Sales of Company A's phone drop significantly.\n3. Competitor B releases a similar phone at a lower price.\n4. Sales skyrocket in the first month.\n5. Company A reduces the price of its phone.",
    options: [
      "1, 4, 3, 2, 5",
      "1, 3, 4, 2, 5",
      "1, 4, 2, 3, 5",
      "1, 3, 5, 4, 2"
    ],
    answer: 0,
    explanation:
      "The correct sequence starts with the launch (1) causing high sales (4). Then, competitor's release (3) leads to a sales drop (2), prompting a price reduction (5). Option 2 has competitor before high sales, option 3 has drop before competitor, and option 4 has price reduction before drop, which are illogical.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 176,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Software company releases new product version. (2) Customer complaints about bugs increase. (3) Company hires additional developers. (4) Product performance improves. (5) Customer satisfaction ratings rise.",
    options: [
      "Release → Complaints → Hire → Improve → Satisfaction",
      "Complaints → Release → Hire → Improve → Satisfaction",
      "Release → Hire → Complaints → Improve → Satisfaction",
      "Release → Complaints → Improve → Hire → Satisfaction"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the release of a new version (1), which introduces bugs leading to increased complaints (2). In response, the company hires more developers (3) to fix the issues, resulting in improved performance (4), and ultimately higher customer satisfaction (5). Any other order breaks the logical cause-and-effect relationships, such as hiring before complaints or improving performance before fixing bugs.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 177,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The company launched a new smartphone. (2) Sales of the smartphone exceeded projections. (3) The marketing team released an online advertising campaign for the smartphone. (4) Website traffic to the product page increased significantly.",
    options: [
      "1, 3, 4, 2",
      "3, 1, 4, 2",
      "1, 2, 3, 4",
      "3, 4, 1, 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the product launch (1), which enables the marketing team to create an advertising campaign (3). The campaign then drives an increase in website traffic (4), which subsequently leads to higher sales (2). Option A (1,3,4,2) reflects this logical chain. Other options either place marketing before the product is available (B), imply sales occurred before traffic increased (C), or suggest traffic increased before the launch or campaign (D).",
    difficulty: 0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 178,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) The company recalls the product. (2) Health inspectors confirm contamination. (3) Consumers report food poisoning. (4) The company issues a public apology.",
    options: [
      "3 → 2 → 1 → 4",
      "1 → 3 → 2 → 4",
      "3 → 1 → 2 → 4",
      "2 → 3 → 1 → 4"
    ],
    answer: 0,
    explanation:
      "The correct sequence begins with consumers reporting food poisoning (3). Health inspectors then investigate and confirm contamination (2). Following confirmation, the company recalls the product (1). Finally, the company issues a public apology (4). Thus, the order is 3-2-1-4.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 179,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence:\n(1) The company's sales decline significantly.\n(2) The company announces a price reduction campaign.\n(3) Competitors lower their prices as well.\n(4) The company's profit margins shrink.",
    options: [
      "1, 2, 3, 4",
      "2, 1, 3, 4",
      "1, 3, 2, 4",
      "3, 2, 1, 4"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence is that initial sales decline triggers a price reduction campaign, which prompts competitors to also lower prices, ultimately leading to reduced profit margins. Options B, C, and D place events out of order, violating the cause-effect relationships (e.g., price reduction cannot precede sales decline that caused it).",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 180,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Company hires external safety consultants. (2) Regulatory fines are imposed. (3) Company issues a product recall. (4) Widespread media coverage of the recall. (5) Consumer complaints about product malfunctions increase.",
    options: [
      "5 → 1 → 3 → 4 → 2",
      "5 → 3 → 1 → 4 → 2",
      "1 → 5 → 3 → 4 → 2",
      "5 → 1 → 4 → 3 → 2"
    ],
    answer: 0,
    explanation:
      "The causal chain begins with an increase in consumer complaints (5), which prompts the company to investigate by hiring external safety consultants (1). The consultants likely identify a serious defect, leading the company to issue a recall (3). The recall attracts widespread media coverage (4), and subsequently, regulatory authorities impose fines (2). Alternative sequences violate causality: for instance, issuing a recall before hiring consultants (option 2) skips the necessary investigation; hiring consultants before complaints arise (option 3) lacks a trigger; and media coverage before the recall (option 4) is implausible because the recall itself is the news event.",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 181,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Traffic congestion decreases during peak hours. (2) Citizens start using bikes for short trips. (3) Bike-sharing stations are installed across the city. (4) City council approves funding for bike-sharing program.",
    options: [
      "4 → 3 → 2 → 1",
      "3 → 4 → 2 → 1",
      "4 → 2 → 3 → 1",
      "4 → 3 → 1 → 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence is: first, the city council approves funding (4), which enables the installation of bike-sharing stations (3). Once stations are in place, citizens start using bikes for short trips (2). Finally, increased bike usage leads to reduced traffic congestion (1). Option A follows this logic. Option B has installation before approval, which is implausible. Option C has citizen usage before station installation, which is illogical. Option D has congestion decreasing before citizens start using bikes, reversing the cause and effect.",
    difficulty: -0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 182,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Mark is offered a job at a top company. (2) Mark studies hard for several weeks. (3) Mark passes his final exams.",
    options: [
      "2, 3, 1",
      "3, 2, 1",
      "1, 2, 3",
      "2, 1, 3"
    ],
    answer: 0,
    explanation:
      "Studying hard leads to passing exams, which then leads to being offered a job. The correct causal sequence is: Mark studies hard (2) → passes exams (3) → gets job offer (1). Thus, the order is 2, 3, 1.",
    difficulty: -2.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 183,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) City officials approve funding for subway construction. (2) Construction of subway tunnels begins. (3) Subway stations are built. (4) Subway service starts. (5) Commuters shift from cars to subway.",
    options: [
      "1,2,3,4,5",
      "2,1,3,4,5",
      "1,3,2,4,5",
      "1,2,4,3,5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with approval of funding (1), which enables tunnel construction (2). After tunnels are built, stations are constructed (3). Only then can subway service start (4), leading to commuters shifting from cars to subway (5). Any other order violates the temporal and causal dependencies between these events.",
    difficulty: -0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 184,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Chatter updates its algorithm to prioritize paid content. (2) Users complain of reduced organic reach and many migrate to Talk. (3) Chatter's ad revenue declines as user engagement drops. (4) Chatter's stock price falls sharply. (5) A hedge fund launches a hostile takeover bid for Chatter.",
    options: [
      "1, 2, 3, 4, 5",
      "1, 3, 2, 4, 5",
      "2, 1, 3, 4, 5",
      "1, 2, 4, 3, 5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with the algorithm update (1), which directly causes user dissatisfaction and migration to a rival platform (2). This decline in active users leads to reduced ad revenue (3), as fewer users mean less engagement and fewer ad impressions. The revenue drop negatively impacts investor confidence, causing the stock price to fall (4). Finally, the low stock price makes Chatter an attractive target for a hostile takeover bid (5). Other options misplace the order: option B puts ad revenue decline before user migration, which is illogical since revenue depends on user engagement; option C starts with user complaints before the algorithm update; option D incorrectly places the stock price fall before the ad revenue decline.",
    difficulty: 3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 185,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) City council passes a law requiring residents to separate recyclables. (2) Recycling contamination rates decrease. (3) Residents receive educational pamphlets on proper recycling. (4) Recycling processing facility reports higher quality materials. (5) City's recycling revenue increases.",
    options: [
      "1-2-3-4-5",
      "1-3-2-4-5",
      "3-1-2-4-5",
      "1-3-4-2-5"
    ],
    answer: 1,
    explanation:
      "The law (1) is the initial cause, which leads to the distribution of educational pamphlets (3) to inform residents. Proper education results in decreased contamination (2), which in turn leads to higher quality materials at the facility (4). Finally, higher quality materials increase recycling revenue (5). Thus, the correct sequence is 1-3-2-4-5.",
    difficulty: 1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 186,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Several customers report fires caused by the battery pack. (2) The company issues a formal recall of all affected units. (3) Engineers identify a manufacturing defect in the battery pack. (4) A news article highlights the potential danger of the batteries.",
    options: [
      "1 → 3 → 4 → 2",
      "3 → 1 → 2 → 4",
      "4 → 1 → 3 → 2",
      "1 → 4 → 2 → 3"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with customer reports of fires (1), which triggers an investigation by engineers who identify the defect (3). The defect information is then publicized via a news article (4), leading to the company's recall decision (2).",
    difficulty: -0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 187,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Anna's phone battery starts lasting longer. (2) Anna installs a battery optimization app. (3) Anna reads online about battery-saving tips. (4) Anna notices her phone battery drains quickly.",
    options: [
      "4, 3, 2, 1",
      "1, 2, 3, 4",
      "3, 4, 2, 1",
      "2, 1, 4, 3"
    ],
    answer: 0,
    explanation:
      "The correct sequence is 4 (notice problem) → 3 (read tips) → 2 (install app) → 1 (battery lasts longer). Anna first notices the battery draining quickly, which motivates her to read online about solutions. After learning about battery-saving tips, she installs an optimization app, which then causes the battery to last longer. The other orders are illogical because they place events out of causal order (e.g., the battery lasting longer before installing the app, or reading tips before noticing the problem).",
    difficulty: -2.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 188,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The coffee shop introduces a loyalty program. (2) The coffee shop experiences a decline in customer visits. (3) The cost of coffee beans increases significantly. (4) The owner raises the prices of all beverages. (5) Customers complain about the higher prices.",
    options: [
      "3 → 4 → 5 → 2 → 1",
      "3 → 4 → 2 → 5 → 1",
      "4 → 3 → 5 → 2 → 1",
      "3 → 5 → 4 → 2 → 1"
    ],
    answer: 0,
    explanation:
      "The causal chain starts with the increase in coffee bean costs (3), which forces the owner to raise prices (4). Higher prices lead to customer complaints (5), which cause a decline in customer visits (2). The owner then introduces a loyalty program (1) to attract customers back. Option A correctly follows this cause-and-effect sequence.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 189,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Reports of injuries surface, (2) Company issues a product recall, (3) Safety defect is identified in manufacturing, (4) Sales of the product decline.",
    options: [
      "1, 2, 3, 4",
      "3, 1, 2, 4",
      "2, 4, 1, 3",
      "4, 3, 1, 2"
    ],
    answer: 1,
    explanation:
      "The causal sequence begins with the safety defect being identified in manufacturing (3), which leads to injuries caused by the defect, prompting reports to surface (1). In response to the reports, the company issues a recall (2), and as a result of the recall and negative publicity, sales decline (4). Thus, the correct order is 3, 1, 2, 4.",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 190,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) The company expands production capacity. (2) The company's electricity costs decrease. (3) The government announces tax credits for solar energy investment. (4) The company installs solar panels.",
    options: [
      "3, 4, 2, 1",
      "3, 2, 4, 1",
      "1, 3, 4, 2",
      "4, 3, 2, 1"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the government announcing tax credits (3), which incentivizes the company to install solar panels (4). The solar panels then cause a decrease in electricity costs (2), and the cost savings enable the company to expand production capacity (1). Option A is the only order that follows this logic. Option B incorrectly places the cost decrease before the installation. Option C starts with expansion, which is an effect, not a cause. Option D starts with installation before the tax credits that motivated it.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 191,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Strong winds knock down a tree onto power lines, (2) The power outage lasts for several hours, (3) Residents start using generators to power their homes, (4) Carbon monoxide poisoning cases are reported at the local hospital.",
    options: [
      "1, 2, 3, 4",
      "1, 3, 2, 4",
      "2, 1, 3, 4",
      "4, 3, 2, 1"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the storm causing the tree to fall on power lines (1), which leads to a power outage (2). Because of the outage, residents use generators (3), and improper use of generators causes carbon monoxide poisoning (4). Therefore, the order is 1, 2, 3, 4.",
    difficulty: 0.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 192,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) A major social media platform announces a new privacy policy that restricts data sharing with third-party advertisers. (2) The platform's advertising revenue declines significantly. (3) Many users express outrage and delete their accounts. (4) The company hires a public relations firm to improve its image.",
    options: [
      "1, 3, 2, 4",
      "1, 2, 3, 4",
      "3, 1, 2, 4",
      "1, 3, 4, 2"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with the announcement of the new privacy policy (1). This leads to user outrage and account deletions (3), which then causes a decline in advertising revenue (2) because fewer users mean less data and ad impressions. Finally, the company hires a PR firm (4) in response to the revenue decline and negative publicity. Option A (1,3,2,4) is the only order that follows this logical chain.",
    difficulty: -0.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 193,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Harmony introduces a personalized playlist algorithm. (2) Users spend more time on the platform, increasing ad revenue. (3) Competitors replicate the feature, leading to market saturation. (4) Harmony's user growth slows, so they reduce investment in algorithm improvement. (5) User engagement declines as algorithm quality stagnates.",
    options: [
      "1,2,3,4,5",
      "1,3,2,4,5",
      "1,2,4,3,5",
      "2,1,3,4,5"
    ],
    answer: 0,
    explanation:
      "The correct sequence starts with Harmony introducing a new algorithm (1), which leads to increased user time and ad revenue (2). This success attracts competitors who copy the feature (3), causing market saturation and slowing Harmony's growth. In response, Harmony cuts investment in the algorithm (4), leading to stagnation and declining user engagement (5). Other orders break the cause-effect chain, e.g., competitors copying before user growth is implausible.",
    difficulty: 2.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 194,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the correct causal sequence: (1) Student studies regularly. (2) Student performs well on the test. (3) Student understands the material. (4) Student gets a good grade.",
    options: [
      "1, 3, 2, 4",
      "2, 1, 3, 4",
      "3, 1, 4, 2",
      "1, 2, 3, 4"
    ],
    answer: 0,
    explanation:
      "Studying regularly (1) leads to understanding the material (3), which leads to performing well on the test (2), which then leads to getting a good grade (4). Thus the correct order is 1, 3, 2, 4.",
    difficulty: -1.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 195,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence: (1) Jane updates her resume. (2) Jane interviews and receives a job offer. (3) Jane's company announces layoffs. (4) Jane resigns from her current position. (5) Jane applies for several positions.",
    options: [
      "3, 1, 5, 2, 4",
      "1, 3, 5, 2, 4",
      "3, 5, 1, 2, 4",
      "1, 5, 3, 2, 4"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence starts with layoff announcements (3), which prompts Jane to update her resume (1). She then applies for jobs (5), interviews and gets an offer (2), and finally resigns (4). Option A (3,1,5,2,4) is the only one that follows this logical cause-effect chain.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 196,
    type: "event",
    category: "event",
    question:
      "Arrange the following events in the most logical causal sequence:\n1. A tech company releases a new AI-powered customer service system.\n2. The company eliminates several human customer service positions.\n3. Customer satisfaction ratings decline sharply.\n4. The AI system is updated with better natural language processing.\n5. Customer satisfaction ratings recover and exceed previous levels.",
    options: [
      "1 → 2 → 3 → 4 → 5",
      "1 → 3 → 2 → 4 → 5",
      "2 → 1 → 3 → 4 → 5",
      "1 → 2 → 4 → 3 → 5"
    ],
    answer: 0,
    explanation:
      "The correct causal sequence begins with the release of the AI system (1), which directly leads to the elimination of human customer service positions (2) as the company relies on the new technology. Subsequently, customers experience impersonal service, causing satisfaction to decline sharply (3). In response, the company updates the AI system with better language processing (4), which eventually improves service quality, leading to a recovery and rise in satisfaction (5). The other options contain logical inconsistencies: option B places satisfaction decline before layoffs, despite the layoffs being a direct consequence of the system release and a likely cause of the decline; option C has layoffs before the system release; option D has the AI update before the satisfaction decline, which is implausible because the decline typically motivates the update.",
    difficulty: 0.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 197,
    type: "event-argument",
    category: "event-argument",
    question:
      "A recent study found that people who attend religious services at least once a week have lower blood pressure on average than those who attend less frequently. Therefore, attending religious services causes a reduction in blood pressure. Which of the following is the most significant logical flaw in this argument?",
    options: [
      "The argument fails to consider that people with lower blood pressure might be more inclined to attend religious services.",
      "The argument assumes that attending religious services is the cause of lower blood pressure, but other factors such as diet or exercise could be responsible.",
      "The argument relies on a sample that may not be representative of the general population.",
      "The argument confuses correlation with causation, but does not specify which direction."
    ],
    answer: 1,
    explanation:
      "The argument's flaw is that it assumes a causal relationship based solely on a correlation, without considering alternative explanations. Option B correctly identifies that the observed difference in blood pressure could be due to confounding variables (e.g., healthier lifestyle choices among regular attendees) rather than the act of attending services itself. Option A is a potential reverse causation but is less likely given the argument's direction; Option C addresses sample representativeness, which is not explicitly challenged; Option D is too vague and does not specify the nature of the flaw as precisely as B.",
    difficulty: 0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 198,
    type: "event-cause",
    category: "event-cause",
    question:
      "In the coastal town of Seaview, residents have noticed a dramatic increase in the frequency of dense fog over the past year. Local meteorologists have verified that regional weather patterns, ocean currents, and sea surface temperatures have remained stable. Which of the following is the most plausible cause of the increased fog?",
    options: [
      "A nearby shipping company shifted its route closer to shore, and ship emissions have increased the concentration of aerosol particles that serve as cloud condensation nuclei.",
      "The town constructed a new desalination plant that releases large amounts of warm, moist air, increasing local humidity.",
      "A major reforestation project has significantly increased tree cover, leading to higher rates of transpiration and local humidity.",
      "The local airport extended its runway and now handles more flights, increasing contrails and cirrus clouds."
    ],
    answer: 0,
    explanation:
      "Fog forms when moist air cools to its dew point and water vapor condenses on aerosol particles (cloud condensation nuclei). With stable weather patterns and sea temperatures, the most plausible cause is an increase in condensation nuclei. Ship emissions release abundant aerosols (e.g., sulfates) that enhance fog formation. Desalination releases warm, moist air, but warm air rises and disperses, and the effect is localized; it would not explain widespread fog. Reforestation increases humidity via transpiration, but without a concurrent increase in condensation nuclei or cooling mechanism, it is insufficient to cause dense fog. Airport contrails form high-altitude cirrus clouds, not ground-level fog. Therefore, option A is the most plausible.",
    difficulty: 2.6,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 199,
    type: "event-cause",
    category: "event-cause",
    question:
      "A large corporation implemented a four-day workweek (Monday-Thursday) for all employees. After one year, the company reported a 15% increase in overall productivity. Which of the following is the most plausible explanation for this productivity increase?",
    options: [
      "Employees worked longer shifts on the four days to compensate for the lost day.",
      "The reduced workweek allowed employees to rest more, increasing their efficiency.",
      "The company also introduced new automation software during the same period.",
      "The company fired low-performing employees and rehired more productive ones."
    ],
    answer: 1,
    explanation:
      "The correct answer is that the reduced workweek improved employee well-being and focus, leading to higher productivity per hour. Studies on four-day workweeks show that employees often maintain similar output despite fewer hours due to reduced burnout and better work-life balance. Option 1 is a common but mistaken assumption; in practice, employees typically do not significantly extend their shifts, so total hours decrease. Option 3 introduces a confounding factor that is not the direct result of the schedule change, and without evidence, it is less plausible as the primary cause. Option 4 is unsupported and unlikely to account for a broad 15% increase across all employees. Therefore, option 2 is the most direct and evidence-based explanation.",
    difficulty: -0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 200,
    type: "event-argument",
    category: "event-argument",
    question:
      "A company introduced a new training program for its sales staff. After six months, sales increased by 15%. The CEO concluded that the training program was effective. Which of the following is a logical flaw in this reasoning?",
    options: [
      "The CEO assumes that the training program was the only factor affecting sales.",
      "The CEO fails to consider that sales might have increased even without the training program.",
      "The CEO incorrectly believes that correlation implies causation.",
      "The CEO ignores the possibility that the training program could have long-term negative effects."
    ],
    answer: 0,
    explanation:
      "The argument concludes that the training program caused the sales increase based solely on a temporal correlation. However, the increase could be due to other factors (e.g., seasonal demand, improved economy). The flaw is assuming that the program was the only cause. Option 0 directly states this assumption. Option 1 is similar but less precise; option 2 is a general statement but not as specific to the argument; option 3 introduces an irrelevant possibility.",
    difficulty: -0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 201,
    type: "event-argument",
    category: "event-argument",
    question:
      "City council: 'Increasing the number of public parks will reduce crime rates in urban neighborhoods. Studies show that areas with more green spaces have lower crime. Therefore, we should allocate more funds to park development.' Which of the following is a necessary assumption for this argument?",
    options: [
      "The correlation between green spaces and lower crime is causal.",
      "Other factors that reduce crime are already at optimal levels.",
      "Parks are more effective at reducing crime than community policing.",
      "The funds for park development will not be taken from other crime prevention programs."
    ],
    answer: 0,
    explanation:
      "The argument assumes that the observed correlation between green spaces and lower crime indicates causation. Without this assumption, the council cannot conclude that increasing parks will cause crime to decrease. Option A identifies this necessary assumption. Option B is not required; the argument does not depend on other factors being optimal. Option C is a comparison not made in the argument. Option D is a practical concern but not a logical necessity for the causal claim.",
    difficulty: 0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 202,
    type: "event-argument",
    category: "event-argument",
    question:
      "Our company's sales have increased by 20% since we started our new online advertising campaign. Therefore, the campaign is effective and we should increase its budget. Which of the following is a logical flaw in this argument?",
    options: [
      "The argument assumes that the sales increase is due solely to the campaign, ignoring other factors.",
      "The argument confuses cause and effect.",
      "The argument relies on a small sample size.",
      "The argument fails to consider that the campaign might have increased sales but also increased costs."
    ],
    answer: 0,
    explanation:
      "The argument infers a causal relationship from a mere correlation: because sales increased after the campaign began, it concludes the campaign caused the increase. This ignores alternative explanations (e.g., seasonal trends, market changes), making it an example of the post hoc ergo propter hoc fallacy. Option A correctly identifies this hidden assumption. Option B is inaccurate because the argument does not confuse which is cause and which is effect; it simply assumes causation. Option C is irrelevant; sample size is not at issue. Option D discusses cost, which is not part of the argument's reasoning.",
    difficulty: 0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 203,
    type: "event-argument",
    category: "event-argument",
    question:
      "A school district implemented a new homework policy that reduced the amount of homework assigned. After one year, average test scores increased. The school board claims that the reduction in homework caused the increase in test scores. What is the logical flaw in this argument?",
    options: [
      "It assumes without evidence that the amount of homework affects test scores.",
      "It fails to consider that other factors, such as changes in teaching methods or student demographics, could have caused the increase.",
      "It confuses cause and effect by suggesting that higher test scores led to less homework.",
      "It relies on a sample size that is too small to draw any meaningful conclusions."
    ],
    answer: 1,
    explanation:
      "The argument concludes that reducing homework caused test scores to increase based solely on a temporal correlation. The flaw is ignoring alternative explanations: other changes might have occurred simultaneously (e.g., new curriculum, better teachers, or different student body) that could account for the rise in scores. Option B correctly identifies this failure to consider confounding factors. Option A is too vague; the argument does assume homework affects scores, but the central flaw is neglecting other potential causes. Option C reverses cause and effect, which is not supported by the argument. Option D introduces an issue of sample size not mentioned in the argument.",
    difficulty: -1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 204,
    type: "event-cause",
    category: "event-cause",
    question:
      "A large manufacturing company replaced some assembly line workers with robots. After six months, overall production output increased by 15%, but the number of defective products also increased by 10%. Which of the following is the most likely explanation for this pattern?",
    options: [
      "The robots were not calibrated properly for precision tasks.",
      "The remaining workers became demotivated and made more errors.",
      "The robots worked faster but with less accuracy than humans.",
      "The company reduced quality control staff to cut costs."
    ],
    answer: 2,
    explanation:
      "The correct answer is C. The scenario describes two simultaneous outcomes: increased output and increased defects. The most direct causal explanation is that the robots, while faster, are less precise than the humans they replaced. This accounts for both the rise in production (due to speed) and the rise in defects (due to lower accuracy). Option A suggests a calibration issue, but if robots were not calibrated properly, they might produce more defects but likely not increase overall output unless they are faster. Option B relies on an unstated assumption about worker morale, and it does not directly link to the introduction of robots. Option D introduces a separate change (reducing quality control) that is not mentioned in the scenario and is less parsimonious than the direct effect of the robots. Therefore, C is the most plausible explanation.",
    difficulty: 1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 205,
    type: "event-argument",
    category: "event-argument",
    question:
      "A coffee shop chain introduced a new loyalty program. After six months, they surveyed customers and found that 70% of loyalty program members reported higher satisfaction than before. The CEO concludes that the loyalty program caused an increase in customer satisfaction. Which of the following is a logical flaw in the argument?",
    options: [
      "The survey only included loyalty program members, not all customers.",
      "The CEO did not consider that customers who joined the program might already have been more satisfied.",
      "The time period of six months is too short to measure satisfaction accurately.",
      "The increase in satisfaction could be due to improved coffee quality."
    ],
    answer: 1,
    explanation:
      "The argument assumes that the loyalty program caused the increase in satisfaction, but it fails to consider that customers who chose to join the program may have been more satisfied to begin with (selection bias). This is a classic correlation-causation flaw. The other options are potential concerns but not the central logical flaw: the survey only included members, but the CEO's conclusion is about the program's effect; the time period is not necessarily too short; and improved coffee quality is another possible cause, but the flaw is the lack of consideration of pre-existing differences.",
    difficulty: -2.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 206,
    type: "event-cause",
    category: "event-cause",
    question:
      "A software company replaced the fluorescent lighting in its open-plan office with full-spectrum LED lighting that mimics natural daylight. Over the next three months, employee productivity increased by 15%. Which of the following is the most likely cause of this increase?",
    options: [
      "Employees felt more valued because the company invested in their comfort, boosting morale.",
      "Full-spectrum lighting reduces eye strain and fatigue, improving concentration and efficiency.",
      "The new lighting made the office look more modern, attracting more clients and increasing revenue.",
      "The installation required employees to work from home for a week, which reduced burnout."
    ],
    answer: 1,
    explanation:
      "The most direct causal mechanism is that full-spectrum LED lighting reduces eye strain and fatigue, which enhances concentration and work efficiency, leading to higher productivity. Option A is plausible but less direct: feeling valued might improve morale, but the primary effect of lighting is physiological. Option C incorrectly links office appearance to client attraction and revenue, which does not directly increase productivity. Option D is unlikely because working from home for a week would disrupt work, not sustainably boost productivity over three months.",
    difficulty: -1.2,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 207,
    type: "event-argument",
    category: "event-argument",
    question:
      "A company recently provided free snacks in the break room. Over the following year, employee turnover decreased by 15%. The company concludes that the free snacks caused the decrease in turnover. Which of the following most accurately describes a logical flaw in this argument?",
    options: [
      "It confuses correlation with causation.",
      "It overlooks the possibility that the snacks were not popular.",
      "It assumes that the turnover rate was high before.",
      "It fails to consider that employees might have left for other reasons anyway."
    ],
    answer: 0,
    explanation:
      "The argument observes a correlation between offering free snacks and a decrease in employee turnover, and concludes that the snacks caused the decrease. This is a classic example of confusing correlation with causation. Other factors, such as changes in management, economic conditions, or other benefits, could have contributed to the turnover reduction. The flaw is not simply that the snacks were unpopular (B), nor does the argument assume the turnover rate was high before (C). Option D is a specific instance of the correlation-causation confusion, but A is the more precise and general description of the flaw.",
    difficulty: -1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 208,
    type: "event-argument",
    category: "event-argument",
    question:
      "Since the city started its recycling program last year, recycling rates have increased by 30%. Therefore, the program is highly effective and should be expanded. Which of the following best describes the logical flaw in this argument?",
    options: [
      "The argument overlooks the possibility that the increase in recycling rates might be due to a new state law that mandates recycling.",
      "The argument assumes that the recycling program is the only factor affecting recycling rates.",
      "The argument fails to consider that the program may not be cost-effective.",
      "The argument concludes that the program should be expanded without providing data on its costs."
    ],
    answer: 1,
    explanation:
      "The argument concludes that the recycling program caused the increase in recycling rates, but it does not consider alternative explanations. By implicitly assuming that the program is the sole cause, the argument commits the flaw of ignoring other possible factors (e.g., a new state law, public awareness campaigns). This is a classic causal oversimplification error. Options 3 and 4 discuss cost, which is not the logical flaw. Option 1 points to a specific alternative, but the general flaw is the assumption of exclusive causation, which option 2 best captures.",
    difficulty: -2.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 209,
    type: "event-argument",
    category: "event-argument",
    question:
      "City council installed speed bumps on a busy road. In the six months after installation, the number of accidents on that road decreased by 30%. Therefore, the speed bumps were effective in reducing accidents. Which of the following most accurately describes a logical flaw in the argument?",
    options: [
      "It assumes that the decrease in accidents is due solely to the speed bumps, without considering other possible causes.",
      "It concludes that the speed bumps were effective without considering the cost of installation.",
      "It relies on data from only one road, which may not be representative.",
      "It ignores the possibility that accidents might have increased on other roads."
    ],
    answer: 0,
    explanation:
      "The argument presents a correlation (speed bumps followed by accident decrease) and concludes causation. The flaw is that it ignores other factors that could have caused the decrease, such as changes in traffic volume, weather, or driver behavior. Option 1 identifies this unwarranted causal assumption. Option 2 is irrelevant to effectiveness in reducing accidents; cost is a separate consideration. Option 3 is about representativeness, but the argument is about this specific road. Option 4 discusses displacement, which is a different issue and does not directly address the flawed causal reasoning on this road.",
    difficulty: -0.9,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 210,
    type: "event-cause",
    category: "event-cause",
    question:
      "A city introduced a new light rail system to reduce traffic congestion. After one year, traffic congestion decreased by 15% compared to the previous year. Which of the following is the most likely explanation for this decrease?",
    options: [
      "The light rail system provided a convenient alternative, leading many commuters to switch from driving to public transit.",
      "The city also implemented a new parking pricing policy that increased rates in the downtown area during the same period.",
      "A major employer relocated its headquarters from the city center to the suburbs, reducing the number of commuters.",
      "The city experienced a mild winter, resulting in fewer weather-related traffic disruptions and smoother traffic flow."
    ],
    answer: 0,
    explanation:
      "The most likely explanation is that the light rail system directly caused the decrease in traffic congestion by providing a convenient alternative to driving. Option 0 is the direct causal effect the city intended. Option 1 is a plausible confounder but could be part of a package of policies; however, the question asks for the most likely explanation given the introduction of the light rail. Option 2 could reduce congestion but is less likely because a major employer relocation would be a notable event, not mentioned. Option 3 is a natural factor that could temporarily affect traffic, but it is less directly linked to the light rail introduction and a mild winter alone is unlikely to produce a 15% decrease sustained over a year.",
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 211,
    type: "event-argument",
    category: "event-argument",
    question:
      "The city lowered the speed limit on Main Street from 40 mph to 30 mph. Since then, the number of accidents on Main Street has decreased by 15%. Therefore, lowering the speed limit effectively reduced accidents. Which of the following, if true, most weakens the argument?",
    options: [
      "During the same period, the city also added more traffic lights and crosswalks on Main Street.",
      "The number of accidents on nearby streets increased by 10% over the same period.",
      "Surveys show that drivers on Main Street now drive an average of 5 mph slower than before the change.",
      "The city's overall accident rate across all streets has remained unchanged."
    ],
    answer: 0,
    explanation:
      "The argument assumes that the reduction in accidents on Main Street was caused solely by lowering the speed limit. Option A introduces an alternative cause: the installation of more traffic lights and crosswalks, which could have contributed to the decrease. This weakens the causal claim by suggesting that the speed limit change may not be the primary factor. Option B does not directly weaken because an increase on nearby streets could indicate displacement rather than a failure of the speed limit. Option C actually strengthens the argument by showing that driving behavior changed as intended. Option D is neutral; if the overall rate is unchanged but Main Street decreased, it could mean other streets worsened, but that doesn't undermine the effect on Main Street.",
    difficulty: 1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 212,
    type: "event-cause",
    category: "event-cause",
    question:
      "A mid-sized tech company switched from a fully in-office schedule to a hybrid model requiring three days in the office. Three months later, employee satisfaction scores increased by 20%. During the same period, the company also gave each employee a $100 allowance to improve their home office setup. Which of the following is the most likely cause of the increase in employee satisfaction?",
    options: [
      "The hybrid model provided employees with greater flexibility and work-life balance.",
      "The home office allowance allowed employees to purchase better equipment.",
      "Both the hybrid model and the home office allowance contributed equally.",
      "The increase was part of a broader trend of rising satisfaction in the tech industry during that quarter."
    ],
    answer: 0,
    explanation:
      "The hybrid model is a major change that directly improves work-life balance, a key driver of employee satisfaction. The $100 allowance is a relatively small amount that is unlikely to have a significant impact on overall satisfaction. The option claiming equal contribution is less plausible given the trivial size of the allowance. The broader trend is speculative and not supported by evidence in the scenario. Therefore, the hybrid model is the most likely cause.",
    difficulty: 0.3,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 213,
    type: "event-cause",
    category: "event-cause",
    question:
      "A study found that employees who take short breaks every hour are more productive than those who work continuously. What is the most likely causal explanation for this finding?",
    options: [
      "Taking breaks prevents mental fatigue, allowing employees to maintain focus and energy throughout the day.",
      "Employees who take breaks are more conscientious and thus more productive for reasons unrelated to breaks.",
      "The study measured productivity over a short period, so the results may not reflect long-term effects.",
      "Employees who take breaks are often in managerial roles, which involve higher productivity."
    ],
    answer: 0,
    explanation:
      "The correct answer is option 0. Regular breaks help prevent mental fatigue, which improves sustained focus and productivity—a direct causal mechanism. Option 1 is a plausible confounder (conscientiousness), but it does not explain how breaks themselves cause higher productivity; it suggests reverse causation. Option 2 is a methodological limitation, not a causal explanation. Option 3 is a confounder (job role), but the study likely compared employees with similar roles; even if not, the most direct causal link is through fatigue reduction.",
    difficulty: -0.8,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 214,
    type: "event-cause",
    category: "event-cause",
    question:
      "In the city of Oakville, a public health program provided free gas stove replacements to low-income households that used old wood-burning stoves. The following winter, the rate of respiratory-related emergency room visits among participants dropped by 15% compared to a similar control group that did not receive stoves. Interestingly, the city's overall outdoor air quality, measured at central monitoring stations, showed no significant improvement. Which of the following best explains this result?",
    options: [
      "The reduction in respiratory visits was likely due to a milder winter that year.",
      "The control group also replaced their stoves independently, so the comparison is flawed.",
      "The new gas stoves reduced indoor air pollution directly, but outdoor air quality is influenced by many other sources.",
      "The program was implemented only in neighborhoods with already low respiratory rates."
    ],
    answer: 2,
    explanation:
      "The correct answer is C. The program directly reduced indoor air pollution from wood stoves, which is a known trigger for respiratory issues. Since the control group was similar, weather and other factors affect both equally, ruling out A. Option B is incorrect because if the control group also replaced stoves, the observed difference would be smaller or nonexistent. Option D is not supported as the program targeted low-income households regardless of baseline rates, and the control group was similar.",
    difficulty: 1.4,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 215,
    type: "event-cause",
    category: "event-cause",
    question:
      "A coffee shop moved from a busy downtown intersection to a quieter residential street. After the move, its monthly sales dropped by 40%. Which of the following is the most likely explanation for the decrease in sales?",
    options: [
      "The new location had lower foot traffic, reducing the number of walk-in customers.",
      "The coffee shop raised its prices at the same time as the move.",
      "The new neighborhood had a higher crime rate, deterring customers.",
      "The coffee shop changed its coffee blend shortly before the move."
    ],
    answer: 0,
    explanation:
      "The most direct and plausible cause is the reduction in foot traffic. A busy downtown intersection naturally attracts more spontaneous customers, while a quieter residential street relies more on destination visits. The other options are possible confounds, but there is no evidence provided in the scenario that any of them actually occurred. Even if they did, the primary effect of moving to a less visible location is a decline in walk-in business, making option A the most likely explanation.",
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 216,
    type: "event-argument",
    category: "event-argument",
    question:
      "School board member: \"A recent survey of 100 high schools found that those with a uniform policy have average test scores that are 10% higher than those without. Therefore, requiring uniforms will improve academic performance at our school.\" Which of the following best describes the logical flaw in this argument?",
    options: [
      "It assumes that a correlation between uniforms and test scores implies a causal relationship.",
      "It relies on a sample that is too small to draw any reliable conclusions.",
      "It fails to consider that the schools with uniforms might have had higher test scores before adopting uniforms.",
      "It confuses the cause of improved test scores with the effect of higher socioeconomic status."
    ],
    answer: 0,
    explanation:
      "The argument concludes that uniforms cause higher test scores based solely on a correlation observed in a survey. This is a classic post hoc ergo propter hoc fallacy, assuming causation from correlation without considering alternative explanations. Option A correctly identifies this flaw. Option B is incorrect because a sample of 100 schools is generally adequate for such a survey. Option C is a possible alternative explanation but does not describe the flaw in the reasoning, which is the causal leap. Option D is too specific and assumes socioeconomic status is the cause, which is not identified in the argument.",
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 217,
    type: "event-cause",
    category: "event-cause",
    question:
      "A tech company implemented an unlimited vacation policy for all employees. After one year, the company's overall productivity increased by 15%. Which of the following is the most likely explanation?",
    options: [
      "Employees began working longer hours to compensate for taking more time off.",
      "The company hired additional staff during the same period.",
      "Employees felt more rested and motivated, leading to higher efficiency.",
      "The policy attracted more skilled workers who replaced less productive ones."
    ],
    answer: 2,
    explanation:
      "Unlimited vacation policies often improve work-life balance, reducing burnout and increasing motivation, which directly boosts productivity. Option 1 is unlikely because unlimited vacation usually encourages taking time off, not longer hours. Option 2, while possible, is not directly caused by the policy and could be a separate factor. Option 4 might occur over a longer period, but the productivity increase within one year is more likely due to existing employees' improved morale and efficiency.",
    difficulty: -0.5,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 218,
    type: "event-cause",
    category: "event-cause",
    question:
      "A city increased the frequency of bus service on a major route from every 30 minutes to every 15 minutes. After six months, the average number of daily passengers on that route increased by 25%. What is the most likely cause of the increase?",
    options: [
      "More frequent service attracted more riders.",
      "The city lowered bus fares.",
      "Gas prices increased significantly.",
      "A new shopping mall opened near the route."
    ],
    answer: 0,
    explanation:
      "The most direct and plausible cause is the increased frequency of bus service, as it reduces wait times and makes the bus more convenient, likely attracting more passengers. The other options are not mentioned as having occurred during the same period, so they are less plausible as causes.",
    difficulty: -1.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 219,
    type: "event-argument",
    category: "event-argument",
    question:
      "Political analyst: 'To win the election, the candidate must secure at least 60% of the female vote. Recent polls show the candidate now has exactly 60% support among women. Therefore, the candidate will win the election.'\n\nWhich of the following best identifies the logical flaw in the argument above?",
    options: [
      "The argument treats a necessary condition as if it were a sufficient condition.",
      "The argument assumes that the poll is accurate despite possible sampling errors.",
      "The argument overlooks the possibility that the candidate's support among women might decrease before the election.",
      "The argument concludes that because the candidate has achieved a milestone, victory is certain, which is a post hoc fallacy."
    ],
    answer: 0,
    explanation:
      "The argument states that securing 60% of the female vote is necessary for winning, and that the candidate has achieved this. However, satisfying a necessary condition does not guarantee the outcome; other conditions (e.g., support from other demographics, turnout) may also be required. The flaw is the assumption that a necessary condition is sufficient.",
    difficulty: 2.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 220,
    type: "event-cause",
    category: "event-cause",
    question:
      "A local gym began offering free yoga classes every Saturday morning. After two months, the gym's membership increased by 10%. Which of the following is the most likely explanation?",
    options: [
      "The free yoga classes attracted new people to join the gym.",
      "The gym lowered its monthly membership fee.",
      "The gym renovated its locker rooms.",
      "The weather improved, encouraging more people to exercise."
    ],
    answer: 0,
    explanation:
      "The most likely explanation is that the free yoga classes attracted new members, directly causing the increase in membership. The scenario does not mention any fee reduction, renovation, or weather change, and exercise is indoor, so weather is irrelevant. Other options are unsupported and less plausible as the primary cause.",
    difficulty: -2.7,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 221,
    type: "event-argument",
    category: "event-argument",
    question:
      "Last year, the town of Greenfield implemented a program that gives households a small cash reward for recycling more. Since then, recycling rates have increased by 30%. Therefore, the cash reward program is effective at increasing recycling. Which of the following is the most significant logical flaw in this argument?",
    options: [
      "It assumes that the program is the only possible cause of the increase.",
      "It overlooks the possibility that households might have recycled more even without the program.",
      "It mistakenly interprets a correlation as a causal relationship.",
      "It fails to consider that the cash reward might be too small to motivate significant change."
    ],
    answer: 2,
    explanation:
      "The argument notes that recycling rates increased after the program was implemented and concludes the program caused the increase. This is a classic post hoc ergo propter hoc fallacy, which confuses correlation with causation. There could be other factors (e.g., a concurrent environmental campaign, seasonal changes, or increased public awareness) that caused the increase. Option C correctly identifies this flaw. Option A is too extreme—the argument does not explicitly assume the program is the only possible cause, but it fails to consider alternatives. Option B is a specific alternative, but the flaw is broader. Option D discusses the reward size, which is not relevant to the logical flaw.",
    difficulty: 0.1,
    discrimination: 1,
    guessing: 0.25,
  },
  {
    id: 222,
    type: "event-cause",
    category: "event-cause",
    question:
      "In the city of Lakeside, a new highway was built to reduce travel time between the suburbs and downtown. After the highway opened, the average travel time during rush hour actually increased by 10% compared to before. Which of the following is the most likely explanation?",
    options: [
      "The highway construction was poorly designed and caused bottlenecks.",
      "The highway attracted more drivers, leading to induced demand and congestion.",
      "The highway was built with fewer lanes than the old road.",
      "The old road was closed for repairs during the construction."
    ],
    answer: 1,
    explanation:
      "The phenomenon of induced demand is well-documented: expanding road capacity initially reduces travel time but attracts additional drivers, often resulting in congestion levels similar to or worse than before. While poor design, fewer lanes, or temporary closures could cause delays, induced demand is the most common and plausible explanation for a sustained increase after adding capacity.",
    difficulty: 0.6,
    discrimination: 1,
    guessing: 0.25,
  },
];
