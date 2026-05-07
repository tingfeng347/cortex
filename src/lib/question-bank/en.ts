import type { Question } from "./types"

export const bank: Question[] = [
  // ════════════════════════════════════════════
  //  Logic (9 questions)
  // ════════════════════════════════════════════
  {
    id: 1,
    type: "logic",
    category: "logic",
    question:
      "In a warehouse theft investigation, four suspects are questioned. Their statements are:\n\nA says: \"It wasn't me.\"\nB says: \"C did it.\"\nC says: \"It wasn't me.\"\nD says: \"A is telling the truth.\"\n\nIf only one of the four is telling the truth, who is the thief?",
    options: ["A", "B", "C", "D"],
    answer: 0,
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
    explanation:
      "Choosing 2 people out of 5 to shake hands uses the combination formula:\nC(5,2) = 5 × 4 ÷ 2 = 10\n\nAnother way: each person shakes hands with 4 others, but each handshake is counted twice:\n5 × 4 ÷ 2 = 10",
  },
  {
    id: 4,
    type: "logic",
    category: "logic",
    question:
      "On an island, there are two types of people: Truth-tellers (always tell the truth) and Liars (always lie). You meet three people A, B, and C.\n\nA says: \"All three of us are liars.\"\nB says: \"Exactly one of us is a truth-teller.\"\n\nWhich of the following is correct?",
    options: [
      "A is a truth-teller, B and C are liars",
      "B is a truth-teller, A and C are liars",
      "C is a truth-teller, A and B are liars",
      "Cannot be determined",
    ],
    answer: 1,
    explanation:
      "If A were telling the truth, then A would be a liar — a contradiction, so A must be a liar.\nSince A is lying, \"all three are liars\" is false — there is at least one truth-teller.\nAssume B is telling the truth: exactly one person (B) is truthful, so A and C are liars. Then \"all three are liars\" is false (since B is truthful), and A lying holds. ✅\nAssume C is the only truth-teller: then B is lying, but B's statement \"exactly one truth-teller\" would actually be true (C), creating a contradiction.\n\nTherefore B is the truth-teller, and A and C are liars.",
  },
  {
    id: 5,
    type: "logic",
    category: "logic",
    question:
      "Using each of the digits 2, 3, 5, 9 exactly once, form a two-digit number multiplied by another two-digit number. Which multiplication gives the largest product?",
    options: ["32 × 59", "35 × 29", "39 × 25", "52 × 39"],
    answer: 3,
    explanation:
      "To maximize the product, the two numbers should be as close as possible while keeping the tens digits large.\n32 × 59 = 1888\n35 × 29 = 1015\n39 × 25 = 975\n52 × 39 = 2028\n\n52 × 39 = 2028 is the largest combination.\n\nGeneral principle: place the largest digits in the tens place and keep the two numbers as close as possible.",
  },
  {
    id: 6,
    type: "logic",
    category: "logic",
    question:
      "A, B, and C participate in a 100-meter race. After the results are announced, each makes a statement:\n\nA says: \"I am not in first place.\"\nB says: \"C is in first place.\"\nC says: \"I am not in first place.\"\n\nIf only one of them is telling the truth, who is truly in first place?",
    options: ["A", "B", "C", "Cannot be determined"],
    answer: 0,
    explanation:
      "Assume A is first:\n- A says \"I am not first\" → false\n- B says \"C is first\" → false\n- C says \"I am not first\" → true (C is not first, A is)\n→ exactly one true ✅\n\nAssume B is first:\n- A says \"I am not first\" → true (A is not first, B is)\n- B says \"C is first\" → false\n- C says \"I am not first\" → true (C is not first)\n→ two true ❌\n\nAssume C is first:\n- A true (A is not first), B true (C is first), C false (C claims not first)\n→ two true ❌\n\nTherefore A is in first place.",
  },
  {
    id: 7,
    type: "logic",
    category: "sequence",
    question:
      "Find the next number in the sequence:\n\n1, 1, 2, 3, 5, 8, 13, ?\n\nWhat number should replace the question mark?",
    options: ["18", "20", "21", "24"],
    answer: 2,
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
    explanation:
      "Number of employees who speak at least one language: 100 − 5 = 95\n\nUsing the set formula:\n|A ∪ B| = |A| + |B| − |A ∩ B|\n95 = 80 + 60 − |A ∩ B|\n|A ∩ B| = 140 − 95 = 45\n\nSo 45 employees speak both languages.",
  },
  {
    id: 9,
    type: "logic",
    category: "logic",
    question:
      "There are three boxes A, B, and C, one of which contains a prize. Each box has a statement written on it, and only one statement is true:\n\nA: \"The prize is here.\"\nB: \"The prize is not in A.\"\nC: \"The prize is not in here.\"\n\nWhich box contains the prize?",
    options: ["A", "B", "C", "Cannot be determined"],
    answer: 2,
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
    options: ["Higher than the original", "Lower than the original", "The same as the original", "Cannot be determined"],
    answer: 2,
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
    explanation:
      "\"Stingy\" has a negative connotation, describing someone unwilling to spend money.\n\"Thrifty,\" \"frugal,\" and \"economical\" are positive or neutral, describing careful and efficient use of resources.\n\nThis question tests the distinction between positive and negative connotations in word choice.",
  },
  {
    id: 19,
    type: "vocab",
    category: "vocab",
    question:
      "In which sentence does the word \"grave\" have a different meaning from the other three?",
    options: [
      "He wore a grave expression on his face.",
      "This is a grave situation for the company.",
      "She made a grave error in judgment.",
      "They dug a grave in the cemetery.",
    ],
    answer: 3,
    explanation:
      "In A, B, and C, \"grave\" means \"serious or solemn.\"\nIn D, \"grave\" refers to \"a burial site,\" which is a different meaning entirely.\n\nThis tests the ability to distinguish between homonyms — words with the same spelling but different meanings.",
  },
  {
    id: 20,
    type: "vocab",
    category: "vocab",
    question:
      "What does the phrase \"beg the question\" traditionally mean in formal logic?",
    options: [
      "To raise a new question that needs to be asked",
      "To assume the truth of the conclusion within the premise itself",
      "To request that someone ask a question",
      "To avoid answering a difficult question",
    ],
    answer: 1,
    explanation:
      "\"Beg the question\" (from Latin petitio principii) is a logical fallacy where an argument assumes the very point it is trying to prove.\n\nThis is one of the most commonly misused phrases in English — many people use it to mean \"raises the question,\" but its traditional meaning refers to circular reasoning.",
  },
  {
    id: 21,
    type: "vocab",
    category: "vocab",
    question:
      "Which word is a different part of speech from the others?",
    options: ["kindness", "happiness", "darkness", "cautious"],
    answer: 3,
    explanation:
      "\"Kindness,\" \"happiness,\" and \"darkness\" are all nouns (formed by adding the suffix -ness to adjectives).\n\"Cautious\" is an adjective, making it the odd one out.",
  },
  {
    id: 22,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following best describes the origin of the word \"salary\"?",
    options: [
      "It comes from a Latin word meaning \"payment for work done\"",
      "It comes from the Latin word for \"salt money,\" a ration given to Roman soldiers",
      "It comes from an Old French word for \"yearly income\"",
      "It comes from a Greek word meaning \"coins stamped with metal\"",
    ],
    answer: 1,
    explanation:
      "\"Salary\" derives from Latin \"salarium\" (salt money), which was an allowance given to Roman soldiers to purchase salt. Salt was highly valuable in ancient times.\n\nOver centuries, the word came to mean any regular payment for work.",
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
    explanation:
      "\"Begin/commence,\" \"quick/rapid,\" and \"big/enormous\" are all pairs of synonyms — words with similar meanings.\n\n\"Hot/cold\" are antonyms — words with opposite meanings. This makes option D the odd one out.",
  },
  {
    id: 24,
    type: "vocab",
    category: "vocab",
    question:
      "What did the word \"nice\" originally mean when it entered the English language?",
    options: [
      "pleasant and agreeable",
      "foolish or ignorant",
      "kind and friendly",
      "precise or accurate",
    ],
    answer: 1,
    explanation:
      "\"Nice\" comes from Latin \"nescius\" meaning \"ignorant\" (ne- \"not\" + scire \"to know\").\nOver centuries, its meaning shifted dramatically: from \"foolish\" (13th c.) to \"shy\" to \"precise\" to \"agreeable, pleasant\" (18th c.).\n\nThis is a classic example of semantic drift in the English language.",
  },
  {
    id: 25,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following lines expresses a happy or joyful tone, while the others express sorrow, loss, or mortality?",
    options: [
      "\"O Captain! my Captain! our fearful trip is done\" — Walt Whitman",
      "\"Because I could not stop for Death — / He kindly stopped for me\" — Emily Dickinson",
      "\"I wandered lonely as a cloud / That floats on high o'er vales and hills\" — William Wordsworth",
      "\"Do not go gentle into that good night / Old age should burn and rave at close of day\" — Dylan Thomas",
    ],
    answer: 2,
    explanation:
      "Wordsworth's \"I wandered lonely as a cloud\" describes the joyful memory of seeing a field of daffodils — a tone of peaceful happiness and appreciation of nature.\n\nThe other three all deal with death or mortality: Whitman mourns Abraham Lincoln, Dickinson calmly personifies Death, and Thomas urges defiant resistance against dying.",
  },

  // ════════════════════════════════════════════
  //  Logic (6 new questions)
  // ════════════════════════════════════════════
  {
    id: 26,
    type: "logic",
    category: "logic",
    question:
      "In a government office, the department head says: \"Every employee in our department is a party member.\"\nThe deputy head says: \"If Smith is not a party member, then Johnson is not a party member either.\"\nSmith says: \"I am not a party member.\"\nJohnson says: \"There is someone in this department who is not a party member.\"\n\nIf exactly one of the four is lying, which statement must be true?",
    options: ["The department head is lying", "Smith is not a party member", "Johnson is a party member", "The deputy head is lying"],
    answer: 0,
    explanation:
      "The department head says \"everyone is a member\" and Johnson says \"someone is not a member\" — these two statements contradict each other, so one must be true and one false.\n\nSince exactly one person is lying, the lie must be between these two. Therefore the deputy head and Smith are both telling the truth.\n\nSmith says \"I am not a party member\" which is true, so the department head's claim that \"everyone is a member\" is false.",
  },
  {
    id: 27,
    type: "logic",
    category: "logic",
    question:
      "A, B, C, and D play a chess tournament where each pair plays exactly one game. A beats D, and A, B, and C all have the same number of wins. How many games does D win?",
    options: ["0", "1", "2", "3"],
    answer: 0,
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
    explanation:
      "Consecutive differences: 4, 6, 8, 10, 12 → the next difference is 14.\nSo ? = 42 + 14 = 56\n\nThis can also be seen as: 1×2, 2×3, 3×4, 4×5, 5×6, 6×7, 7×8 = 56",
  },
  {
    id: 29,
    type: "logic",
    category: "logic",
    question:
      "A teacher brings three red hats and two blue hats. Three students each put on a hat (all three end up wearing red), and the remaining two hats are hidden. Each student can see the others' hats but not their own. The teacher asks if anyone knows their hat color. After a few seconds of silence, someone raises their hand. How did they figure it out?",
    options: [
      "They saw two red hats",
      "They saw two blue hats",
      "They saw one red and one blue hat",
      "They guessed randomly",
    ],
    answer: 0,
    explanation:
      "If a student saw two blue hats, they would instantly know their own hat must be red (since only two blue hats exist) → but nobody immediately raised their hand.\n\nIf a student saw one red and one blue: if they themselves were blue, then the person wearing the red hat would have seen two blue hats and would have known their own color. Since no one spoke up, the student realizes they must be wearing red.\n\nIn reality, each student sees two red hats. After a moment of silence (eliminating the other possibilities), each can deduce they must be wearing red.",
  },
  {
    id: 30,
    type: "logic",
    category: "logic",
    question:
      "After an exam, a teacher writes four scores on the board: 85, 90, 95, 100. These belong to students A, B, C, and D.\n\nA says: \"I am not the lowest.\"\nB says: \"C scored higher than me.\"\nC says: \"I scored higher than D.\"\nD says: \"B scored higher than me.\"\n\nIf all four are telling the truth, what is D's score?",
    options: ["85", "90", "95", "100"],
    answer: 0,
    explanation:
      "From B: B < C\nFrom C: C < D\nFrom D: D < B\nThis creates a cycle: B < C < D < B — contradictory!\n\nThe only resolution is that A is not the lowest — in fact, A is the highest. The true order is:\nD < B < C < A\n\nSo D = 85, B = 90, C = 95, A = 100.",
  },
  {
    id: 31,
    type: "logic",
    category: "logic",
    question:
      "A says: \"I am 3 years older than B.\"\nB says: \"I am 2 years older than C.\"\nC says: \"I am 1 year older than D.\"\nD says: \"I am 5 years younger than A.\"\n\nIf all four are telling the truth, who is the oldest?",
    options: ["A", "B", "C", "D"],
    answer: 0,
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
    explanation:
      "P × 1.1 × 0.9 = P × 0.99\nThe final price is 99% of the original price.\nThe 10% decrease is applied to the increased price, resulting in a net loss of 1%.",
  },
  {
    id: 34,
    type: "math",
    category: "math",
    question:
      "Between 6:00 and 7:00, at what time do the hour and minute hands first overlap exactly?",
    options: [
      "6:30",
      "6:32 and 8/11 minutes",
      "6:33",
      "6:35",
    ],
    answer: 1,
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
    question:
      "What does the idiom \"break the ice\" mean?",
    options: [
      "To literally shatter frozen water",
      "To initiate conversation and make people feel more comfortable in a social setting",
      "To abruptly end a conversation or relationship",
      "To cool down a tense or heated argument",
    ],
    answer: 1,
    explanation:
      "\"Break the ice\" means to do or say something that reduces tension and helps people feel more relaxed when meeting for the first time or in an awkward social situation. The phrase likely originates from the idea of breaking ice to create a passage for ships.",
  },
  {
    id: 40,
    type: "vocab",
    category: "vocab",
    question:
      "What does the idiom \"hit the nail on the head\" mean?",
    options: [
      "To hammer a nail perfectly straight into wood",
      "To be exactly right about something or accurately identify the core issue",
      "To accidentally injure oneself while working",
      "To complete a construction task efficiently",
    ],
    answer: 1,
    explanation:
      "\"Hit the nail on the head\" means to describe exactly what is causing a situation or problem, or to be precisely correct about something. The metaphor comes from carpentry — striking the nail's head squarely drives it in perfectly.",
  },
  {
    id: 41,
    type: "vocab",
    category: "vocab",
    question:
      "Which sentence contains a subject-verb agreement error?",
    options: [
      "The dog runs in the park every morning.",
      "She go to school by bus every day.",
      "They are playing soccer in the yard.",
      "He has finished his homework already.",
    ],
    answer: 1,
    explanation:
      "\"She go\" is incorrect. The third-person singular subject \"she\" requires the verb \"goes\" (with the -s ending). The correct sentence is \"She goes to school by bus every day.\"\n\nThis is a common error for English language learners, as most other verb forms do not change for person.",
  },
  {
    id: 42,
    type: "vocab",
    category: "vocab",
    question:
      "Which sentence has a tense consistency error?",
    options: [
      "I went to the store and bought some milk.",
      "She was reading when the phone rang.",
      "Yesterday, I walk to the park and played soccer.",
      "He will finish his work and then go home.",
    ],
    answer: 2,
    explanation:
      "\"Yesterday\" establishes a past time frame, so \"I walk\" should be \"I walked.\" The sentence mixes present tense (\"walk\") with past tense (\"played\"), creating a tense inconsistency.\n\nThe corrected sentence: \"Yesterday, I walked to the park and played soccer.\"",
  },
  {
    id: 43,
    type: "vocab",
    category: "vocab",
    question:
      "Which of the following plays was NOT written by William Shakespeare?",
    options: [
      "Hamlet",
      "Macbeth",
      "Doctor Faustus",
      "Romeo and Juliet",
    ],
    answer: 2,
    explanation:
      "\"Doctor Faustus\" was written by Christopher Marlowe, a contemporary of Shakespeare who also wrote \"Tamburlaine the Great\" and \"The Jew of Malta.\"\n\n\"Hamlet,\" \"Macbeth,\" and \"Romeo and Juliet\" are all among Shakespeare's most famous plays.",
  },
  {
    id: 44,
    type: "vocab",
    category: "vocab",
    question:
      "Who wrote the dystopian novel \"1984\"?",
    options: [
      "Aldous Huxley",
      "George Orwell",
      "Jules Verne",
      "H. G. Wells",
    ],
    answer: 1,
    explanation:
      "George Orwell (Eric Blair) wrote \"1984,\" published in 1949. It is a dystopian novel about totalitarianism, surveillance, and government control.\n\nAldous Huxley wrote \"Brave New World\" (another famous dystopian novel), Jules Verne wrote adventure sci-fi, and H. G. Wells wrote \"The War of the Worlds.\"",
  },
  {
    id: 45,
    type: "vocab",
    category: "vocab",
    question:
      "Which word correctly completes the sentence: \"The weather will _____ our travel plans.\"",
    options: ["affect", "effect", "infect", "defect"],
    answer: 0,
    explanation:
      "\"Affect\" (verb) means to influence or have an impact on something. \"Effect\" is most commonly used as a noun (e.g., \"the effect was dramatic\") and rarely as a verb meaning \"to bring about.\"\n\n\"Affect\" and \"effect\" are among the most commonly confused word pairs in English.",
  },
  {
    id: 46,
    type: "vocab",
    category: "vocab",
    question:
      "Which word is a synonym of \"ubiquitous\"?",
    options: ["omnipresent", "rare", "unique", "scarce"],
    answer: 0,
    explanation:
      "\"Ubiquitous\" means present, appearing, or found everywhere at once. \"Omnipresent\" is its direct synonym.\n\n\"Rare,\" \"unique,\" and \"scarce\" are all antonyms of \"ubiquitous\" — they describe things that are not commonly found.",
  },
  {
    id: 47,
    type: "vocab",
    category: "vocab",
    question:
      "What does the idiom \"bite the bullet\" mean?",
    options: [
      "To literally bite a metal projectile",
      "To endure a painful or unpleasant situation with courage and resolve",
      "To eat food extremely quickly without chewing",
      "To prepare oneself for physical combat or a fight",
    ],
    answer: 1,
    explanation:
      "\"Bite the bullet\" means to face a difficult, unpleasant, or painful situation with bravery and determination.\n\nThe phrase originates from battlefield surgery before anesthesia, where soldiers would literally bite on a bullet to cope with the pain during operations.",
  },
  {
    id: 48,
    type: "vocab",
    category: "vocab",
    question:
      "Which sentence contains a dangling modifier?",
    options: [
      "Running quickly, she caught the bus just in time.",
      "Having finished dinner, the dishes were washed.",
      "Exhausted after the long day, he fell asleep immediately.",
      "Excited about the trip, the children packed their bags.",
    ],
    answer: 1,
    explanation:
      "In option B, the modifier \"Having finished dinner\" logically should refer to a person, but the subject of the main clause is \"the dishes,\" which cannot finish dinner. This is a dangling modifier — a modifying phrase that does not clearly and logically attach to the word it is meant to modify.\n\nThe corrected version: \"Having finished dinner, she washed the dishes.\"",
  },
  {
    id: 49,
    type: "vocab",
    category: "vocab",
    question:
      "Who wrote the novel \"The Great Gatsby\"?",
    options: [
      "Ernest Hemingway",
      "F. Scott Fitzgerald",
      "John Steinbeck",
      "William Faulkner",
    ],
    answer: 1,
    explanation:
      "F. Scott Fitzgerald wrote \"The Great Gatsby\" in 1925, a novel that explores themes of wealth, love, and the American Dream during the Jazz Age.\n\nAll four options are famous 20th-century American novelists: Hemingway wrote \"The Old Man and the Sea,\" Steinbeck wrote \"The Grapes of Wrath,\" and Faulkner wrote \"The Sound and the Fury.\"",
  },
  {
    id: 50,
    type: "vocab",
    category: "vocab",
    question:
      "Which word is an antonym of \"ephemeral\"?",
    options: ["temporary", "fleeting", "permanent", "brief"],
    answer: 2,
    explanation:
      "\"Ephemeral\" means lasting for a very short time or fleeting. \"Permanent\" is its direct antonym, meaning lasting indefinitely.\n\n\"Temporary,\" \"fleeting,\" and \"brief\" are all synonyms of \"ephemeral\" — they all describe things that do not last long.",
  },
  {
    id: 51,
    type: "vocab",
    category: "vocab",
    question:
      "What does the idiom \"let the cat out of the bag\" mean?",
    options: [
      "To free a trapped animal from a container",
      "To accidentally or carelessly reveal a secret",
      "To create a messy or chaotic situation",
      "To play a harmless prank or trick on someone",
    ],
    answer: 1,
    explanation:
      "\"Let the cat out of the bag\" means to reveal a secret, usually unintentionally or prematurely.\n\nThe phrase likely originates from an old market trick where a dishonest seller would place a cat in a bag instead of a pig; if someone \"let the cat out of the bag,\" the deception would be exposed.",
  },
  {
    id: 52,
    type: "vocab",
    category: "vocab",
    question:
      "Which pronoun correctly completes the sentence: \"She is the person _____ won the award.\"",
    options: ["who", "whom", "which", "whose"],
    answer: 0,
    explanation:
      "\"Who\" is the subject of the relative clause \"who won the award\" — the person performed the action of winning.\n\n\"Whom\" is the objective case, used for the object of a verb or preposition (e.g., \"the person to whom the award was given\"). \"Which\" refers to things, not people. \"Whose\" indicates possession.",
  },
  {
    id: 53,
    type: "vocab",
    category: "vocab",
    question:
      "Who wrote the epic poem \"Paradise Lost\"?",
    options: [
      "William Wordsworth",
      "John Milton",
      "Geoffrey Chaucer",
      "John Keats",
    ],
    answer: 1,
    explanation:
      "John Milton wrote \"Paradise Lost\" (first published in 1667), an epic poem in blank verse that tells the biblical story of the Fall of Man — the temptation of Adam and Eve by Satan and their expulsion from the Garden of Eden.\n\nChaucer wrote \"The Canterbury Tales\" (Middle English), while Wordsworth and Keats were Romantic poets of the 19th century.",
  },
  {
    id: 54,
    type: "vocab",
    category: "vocab",
    question:
      "What does the word \"ambiguous\" mean?",
    options: [
      "Clear and straightforward in meaning",
      "Having more than one possible meaning or interpretation",
      "Extremely angry or hostile in demeanor",
      "Moving or acting without a clear purpose or direction",
    ],
    answer: 1,
    explanation:
      "\"Ambiguous\" describes something that can be understood or interpreted in more than one way, making its meaning unclear or uncertain. It is commonly used to describe language, statements, or situations that are open to multiple interpretations.\n\nFor example: \"The ending of the film was ambiguous, leaving viewers to decide what really happened.\"",
  },
]
