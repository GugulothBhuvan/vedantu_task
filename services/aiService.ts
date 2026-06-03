import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Question } from '../store/useQuizStore';

// Dynamically resolve the backend URL so it works on Web, Android Emulator, and Physical Devices running Expo Go
const getBackendUrl = (): string => {
  return 'https://vedantu-task.onrender.com';
};

const BACKEND_URL = getBackendUrl();

interface ExplanationRequest {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  userAnswerIndex: number;
  subject: string;
  topic: string;
  difficulty: string;
  conceptualTags: string[];
}

export async function fetchAIExplanation(
  question: Question,
  userAnswerIndex: number
): Promise<string> {
  const payload: ExplanationRequest = {
    questionText: question.questionText,
    options: question.options,
    correctOptionIndex: question.correctOptionIndex,
    userAnswerIndex: userAnswerIndex,
    subject: question.subject,
    topic: question.topic,
    difficulty: question.difficulty,
    conceptualTags: question.conceptualTags,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.explanation;
  } catch (error) {
    console.warn('Backend connection failed, falling back to client-side explanation generation:', error);
    return generateOfflineExplanation(question, userAnswerIndex);
  }
}

function generateOfflineExplanation(question: Question, userAnswerIndex: number): string {
  const isCorrect = userAnswerIndex === question.correctOptionIndex;
  const correctOptionText = question.options[question.correctOptionIndex];
  const userOptionText = question.options[userAnswerIndex];

  return `### 💡 Conceptual Explanation (Offline Mode)

${isCorrect ? '🎉 **Excellent job!** You selected the correct answer.' : '⚠️ **Key Misconception Alert:** You selected an incorrect option.'}

#### 📘 Core Concept: **${question.topic}**
The question addresses the fundamental principles of **${question.topic}** in **${question.subject}** (${question.difficulty.toUpperCase()} level). Specifically, it deals with: *${question.conceptualTags.join(', ')}*.

---

#### 🔍 Step-by-Step Solution:
1. **Understand the Scenario:** The problem asks us to evaluate: 
   *"${question.questionText}"*
2. **Apply Core Relationships:** 
   * The correct choice is option **#${question.correctOptionIndex + 1}: "${correctOptionText}"**.
   * ${isCorrect ? `You correctly identified that "${correctOptionText}" represents the accurate scientific model.` : `You selected option #${userAnswerIndex + 1}: "${userOptionText}". However, this overlooks key boundaries of ${question.topic}.`}
3. **Key Equation/Principle:** Remember that in NEET, questions like this require checking the core variables. Ensure that you write down the units and verify consistency before solving!

---

#### 🧠 NEET Mnemonic / Quick Tip:
> [!TIP]
> **Study Aid:** Double check the conceptual tags: *${question.conceptualTags.join(' & ')}*. Under high stress, write out intermediate values step-by-step to prevent arithmetic errors.
`;
}
