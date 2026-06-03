import questionsData from '../data/questions.json';
import { Question } from '../store/useQuizStore';

interface UserProgressInfo {
  preferredSubject: string;
  solvedQuestionIds: string[];
  topicHistory: Record<string, { total: number; correct: number }>;
  consecutiveCorrect: Record<string, number>;
  weakTopics: string[];
}

export function getNextAdaptiveQuestion(
  currentQuestion: Question | null,
  wasLastCorrect: boolean | null,
  progress: UserProgressInfo,
  subjectOverride?: string | null,
  topicOverride?: string | null,
  allowedTopics?: string[] | null,
  customDifficulty?: 'easy' | 'medium' | 'hard' | 'adaptive' | null
): Question {
  const allQuestions = questionsData as Question[];

  // 1. Filter by allowed topics or override topic/subject first
  let pool = allQuestions;
  if (allowedTopics && allowedTopics.length > 0) {
    pool = allQuestions.filter((q) => allowedTopics.includes(q.topic));
  } else if (topicOverride) {
    pool = allQuestions.filter((q) => q.topic === topicOverride);
    if (pool.length === 0) {
      const lowerTopic = topicOverride.toLowerCase();
      pool = allQuestions.filter((q) => q.topic.toLowerCase().includes(lowerTopic));
    }
  } else if (subjectOverride) {
    pool = allQuestions.filter((q) => q.subject === subjectOverride);
  } else if (progress.preferredSubject) {
    pool = allQuestions.filter((q) => q.subject === progress.preferredSubject);
  }

  if (pool.length === 0) {
    pool = allQuestions; // Fallback to all if pool ends up completely empty
  }

  // 2. Filter out solved questions from this pool (fallback to all in pool if everything is solved)
  let availableQuestions = pool.filter(
    (q) => !progress.solvedQuestionIds.includes(q.id)
  );
  if (availableQuestions.length === 0) {
    availableQuestions = pool; // Reset pool if exhausted
  }

  // 3. Determine target difficulty
  let targetDifficulty: 'easy' | 'medium' | 'hard' = 'easy';

  if (customDifficulty && customDifficulty !== 'adaptive') {
    targetDifficulty = customDifficulty;
  } else {
    // Adaptive difficulty logic
    if (currentQuestion && wasLastCorrect !== null) {
      const currentTopic = currentQuestion.topic;
      const currentDiff = currentQuestion.difficulty;
      const consecutive = progress.consecutiveCorrect[currentTopic] || 0;

      if (wasLastCorrect) {
        // Correct answer: check if we should step up difficulty
        if (consecutive >= 2) {
          if (currentDiff === 'easy') targetDifficulty = 'medium';
          else if (currentDiff === 'medium') targetDifficulty = 'hard';
          else targetDifficulty = 'hard';
        } else {
          targetDifficulty = currentDiff;
        }
      } else {
        // Incorrect answer: step down difficulty
        if (currentDiff === 'hard') targetDifficulty = 'medium';
        else if (currentDiff === 'medium') targetDifficulty = 'easy';
        else targetDifficulty = 'easy';
      }
    } else {
      targetDifficulty = 'easy';
    }
  }

  // 4. Determine target topic
  let targetTopic: string | null = null;
  if (topicOverride) {
    targetTopic = topicOverride;
  } else if (allowedTopics && allowedTopics.length > 0) {
    if (currentQuestion && wasLastCorrect !== null) {
      // Stick to same topic to reinforce or step up difficulty
      targetTopic = currentQuestion.topic;
    }
    if (!targetTopic || !allowedTopics.includes(targetTopic)) {
      // Pick a random topic from allowed topics
      targetTopic = allowedTopics[Math.floor(Math.random() * allowedTopics.length)];
    }
  } else {
    // Pull from weak topics of target subject (50% chance)
    const targetSubject = subjectOverride || progress.preferredSubject;
    const subjectWeakTopics = progress.weakTopics.filter((topic) => {
      const sampleQ = allQuestions.find((q) => q.topic === topic);
      return sampleQ && sampleQ.subject === targetSubject;
    });

    if (subjectWeakTopics.length > 0 && Math.random() < 0.5) {
      targetTopic = subjectWeakTopics[Math.floor(Math.random() * subjectWeakTopics.length)];
    } else if (currentQuestion && wasLastCorrect !== null) {
      targetTopic = currentQuestion.topic;
    }
  }

  // 5. Query matching questions
  // Strategy: Try narrowest filters first (topic + difficulty), then fallback
  let candidates = availableQuestions.filter(
    (q) =>
      (targetTopic ? q.topic === targetTopic : true) &&
      q.difficulty === targetDifficulty
  );

  // Fallback 1: Ignore topic, match difficulty in the available pool
  if (candidates.length === 0) {
    candidates = availableQuestions.filter((q) => q.difficulty === targetDifficulty);
  }

  // Fallback 2: Ignore difficulty, match topic in the available pool
  if (candidates.length === 0 && targetTopic) {
    candidates = availableQuestions.filter((q) => q.topic === targetTopic);
  }

  // Fallback 3: Return any available question in the pool
  if (candidates.length === 0) {
    candidates = availableQuestions;
  }

  // Fallback 4: If still empty, return any question from the base pool (even if solved)
  if (candidates.length === 0) {
    candidates = pool;
  }

  // Pick a random question from candidates
  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return selected || allQuestions[0];
}
