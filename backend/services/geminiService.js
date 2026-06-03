import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates an educational, highly-engaging NEET-specific explanation using Gemini.
 * @param {Object} details
 * @param {string} details.questionText
 * @param {string[]} details.options
 * @param {number} details.correctOptionIndex
 * @param {number} details.userAnswerIndex
 * @param {string} details.subject
 * @param {string} details.topic
 * @param {string} details.difficulty
 * @param {string[]} details.conceptualTags
 */
export async function generateGeminiExplanation(details) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the backend environment.');
  }

  const isCorrect = details.correctOptionIndex === details.userAnswerIndex;
  const correctOptionText = details.options[details.correctOptionIndex];
  const userOptionText = details.options[details.userAnswerIndex];

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

  const prompt = `System Instruction: You are a supportive, expert AI tutor for NEET (National Eligibility cum Entrance Test) aspirants preparing under high-pressure scenarios. 
Your goal is to explain multiple-choice questions conceptually, identify core student misconceptions, use supportive encouraging language, and provide smart memory shortcuts (mnemonics).
Format your entire output using clean markdown. Do not include standard HTML tags, use standard markdown alerts if needed (e.g. > [!NOTE], > [!TIP], > [!WARNING]).

---

Please provide a personalized conceptual review for a NEET student who answered a question on "${details.topic}" in "${details.subject}".

Student Performance Status:
- Difficulty Level: ${details.difficulty.toUpperCase()}
- Subject: ${details.subject}
- Topic: ${details.topic}
- Core Concepts covered: ${details.conceptualTags.join(', ')}
- Question: "${details.questionText}"
- Provided Options:
  1. ${details.options[0]}
  2. ${details.options[1]}
  3. ${details.options[2]}
  4. ${details.options[3]}
- Correct Option: #${details.correctOptionIndex + 1} ("${correctOptionText}")
- Option Selected by Student: #${details.userAnswerIndex + 1} ("${userOptionText}")
- Status: ${isCorrect ? 'CORRECT' : 'INCORRECT'}

Please structure your explanation using the following markdown format:

### 💡 Core Concept
A clear, simple 2-sentence explanation of the primary conceptual scientific principles in action.

### 🔍 Step-by-Step Solution
1. **Analyze the setup:** What parameters are we given?
2. **Apply the rule/equation:** Explain the math, biology facts, or chemical mechanisms. Show equations clearly.
3. **Select the correct path:** Why does this lead directly to Option #${details.correctOptionIndex + 1} ("${correctOptionText}")?

### ❌ Misconception Breakdown
${isCorrect
      ? `Confirm why Option #${details.correctOptionIndex + 1} is absolutely correct and why the other distractor options are incorrect.`
      : `The student chose Option #${details.userAnswerIndex + 1} ("${userOptionText}"). Explain exactly why this is a common trap, what misconception led to it, and how they can distinguish it from the correct Option #${details.correctOptionIndex + 1} next time.`
    }

### 🧠 NEET Mnemonic / Quick Tip
Provide an encouraging study shortcut, memory aid, or high-yield NEET exam trap warning related to this topic. Use a standard markdown TIP block.`;

  try {
    const result = await model.generateContent([prompt]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[AI SDK Error]", error);
    throw error;
  }
}
