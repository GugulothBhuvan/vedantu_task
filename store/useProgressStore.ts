import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TopicStat {
  total: number;
  correct: number;
}

interface ProgressState {
  username: string;
  targetScore: number;
  preferredSubject: string;
  isOnboarded: boolean;
  streak: number;
  lastActiveDate: string | null;
  solvedQuestionIds: string[];
  topicHistory: Record<string, TopicStat>;
  consecutiveCorrect: Record<string, number>;
  weakTopics: string[];
  dailyProgress: Record<string, number>;
  
  onboardUser: (username: string, targetScore: number, preferredSubject: string) => void;
  recordAnswer: (questionId: string, topic: string, isCorrect: boolean) => void;
  updateStreak: () => void;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      username: '',
      targetScore: 650,
      preferredSubject: 'Biology',
      isOnboarded: false,
      streak: 0,
      lastActiveDate: null,
      solvedQuestionIds: [],
      topicHistory: {},
      consecutiveCorrect: {},
      weakTopics: [],
      dailyProgress: {},

      onboardUser: (username, targetScore, preferredSubject) => set({
        username,
        targetScore,
        preferredSubject,
        isOnboarded: true,
        streak: 1,
        lastActiveDate: new Date().toDateString(),
      }),

      recordAnswer: (questionId, topic, isCorrect) => set((state) => {
        // Update solved list
        const solved = state.solvedQuestionIds.includes(questionId)
          ? state.solvedQuestionIds
          : [...state.solvedQuestionIds, questionId];

        // Update topic stats
        const currentStats = state.topicHistory[topic] || { total: 0, correct: 0 };
        const updatedStats = {
          total: currentStats.total + 1,
          correct: currentStats.correct + (isCorrect ? 1 : 0),
        };

        // Calculate accuracy
        const topicAccuracy = updatedStats.correct / updatedStats.total;
        
        // Update weak topics list
        let weak = [...state.weakTopics];
        if (updatedStats.total >= 2) {
          if (topicAccuracy < 0.5 && !weak.includes(topic)) {
            weak.push(topic);
          } else if (topicAccuracy >= 0.5 && weak.includes(topic)) {
            weak = weak.filter((t) => t !== topic);
          }
        }

        // Update consecutive corrects per topic
        const currentConsecutive = state.consecutiveCorrect[topic] || 0;
        const updatedConsecutive = isCorrect ? currentConsecutive + 1 : 0;

        // Perform active streak update
        const todayStr = new Date().toDateString();
        let newStreak = state.streak;
        if (!state.lastActiveDate) {
          newStreak = 1;
        } else {
          const lastActive = new Date(state.lastActiveDate);
          const today = new Date(todayStr);
          const diffTime = Math.abs(today.getTime() - lastActive.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
        }

        // Update daily progress
        const todayISODate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        const currentDaily = state.dailyProgress?.[todayISODate] || 0;
        
        return {
          solvedQuestionIds: solved,
          topicHistory: {
            ...state.topicHistory,
            [topic]: updatedStats,
          },
          consecutiveCorrect: {
            ...state.consecutiveCorrect,
            [topic]: updatedConsecutive,
          },
          weakTopics: weak,
          streak: newStreak,
          lastActiveDate: todayStr,
          dailyProgress: {
            ...state.dailyProgress,
            [todayISODate]: currentDaily + 1
          }
        };
      }),

      updateStreak: () => set((state) => {
        const todayStr = new Date().toDateString();
        if (!state.lastActiveDate) {
          return { streak: 1, lastActiveDate: todayStr };
        }
        
        const lastActive = new Date(state.lastActiveDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - lastActive.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          return { streak: state.streak + 1, lastActiveDate: todayStr };
        } else if (diffDays > 1) {
          return { streak: 1, lastActiveDate: todayStr };
        }
        return {};
      }),

      resetProgress: () => set({
        username: '',
        targetScore: 650,
        preferredSubject: 'Biology',
        isOnboarded: false,
        streak: 0,
        lastActiveDate: null,
        solvedQuestionIds: [],
        topicHistory: {},
        consecutiveCorrect: {},
        weakTopics: [],
        dailyProgress: {},
      }),
    }),
    {
      name: 'adaptiveneet-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
