import { create } from 'zustand';

export interface Question {
  id: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  conceptualTags: string[];
}

interface QuizState {
  currentQuestion: Question | null;
  userAnswer: number | null;
  isEvaluated: boolean;
  attemptsCount: number;
  sessionQuestionsCount: number;
  aiExplanation: string | null;
  isLoadingExplanation: boolean;
  customQuestionLimit: number | null;
  allowedTopics: string[] | null;
  customDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive' | null;
  setCurrentQuestion: (question: Question | null) => void;
  submitAnswer: (optionIndex: number) => void;
  setAIExplanation: (explanation: string | null) => void;
  setIsLoadingExplanation: (isLoading: boolean) => void;
  setCustomConfig: (
    limit: number | null,
    allowedTopics: string[] | null,
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive' | null
  ) => void;
  resetSession: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  currentQuestion: null,
  userAnswer: null,
  isEvaluated: false,
  attemptsCount: 0,
  sessionQuestionsCount: 0,
  aiExplanation: null,
  isLoadingExplanation: false,
  customQuestionLimit: null,
  allowedTopics: null,
  customDifficulty: null,

  setCurrentQuestion: (question) => set({
    currentQuestion: question,
    userAnswer: null,
    isEvaluated: false,
    aiExplanation: null,
    isLoadingExplanation: false,
  }),

  submitAnswer: (optionIndex) => set((state) => ({
    userAnswer: optionIndex,
    isEvaluated: true,
    attemptsCount: state.attemptsCount + 1,
    sessionQuestionsCount: state.sessionQuestionsCount + 1,
  })),

  setAIExplanation: (explanation) => set({ aiExplanation: explanation }),
  
  setIsLoadingExplanation: (isLoading) => set({ isLoadingExplanation: isLoading }),

  setCustomConfig: (limit, allowedTopics, difficulty) => set({
    customQuestionLimit: limit,
    allowedTopics: allowedTopics,
    customDifficulty: difficulty,
  }),

  resetSession: () => set({
    currentQuestion: null,
    userAnswer: null,
    isEvaluated: false,
    attemptsCount: 0,
    sessionQuestionsCount: 0,
    aiExplanation: null,
    isLoadingExplanation: false,
    customQuestionLimit: null,
    allowedTopics: null,
    customDifficulty: null,
  }),
}));
