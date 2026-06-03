import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuizStore, Question } from '../store/useQuizStore';
import { useProgressStore } from '../store/useProgressStore';
import { getNextAdaptiveQuestion } from '../services/adaptiveEngine';
import { fetchAIExplanation } from '../services/aiService';
import { useThemeColors } from '../constants/colors';
import {
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Atom,
  FlaskConical,
  Dna,
  Trophy,
  Clock,
  Bookmark,
  Lightbulb,
  Clipboard,
  Award,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Menu,
  Brain,
  Search,
  Bell,
  Flame,
  Sliders,
  FileText,
  Target,
  Calendar,
  Zap,
  BookOpen,
} from 'lucide-react-native';
import questionsData from '../data/questions.json';
import TopBar from '../components/TopBar';

export default function PracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ topicOverride?: string; subjectOverride?: string; tab?: string; forceMode?: string }>();
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  // Zustand Store integrations
  const {
    currentQuestion,
    userAnswer,
    isEvaluated,
    aiExplanation,
    isLoadingExplanation,
    setCurrentQuestion,
    submitAnswer,
    setAIExplanation,
    setIsLoadingExplanation,
    resetSession,
    sessionQuestionsCount,
    customQuestionLimit,
    allowedTopics,
    customDifficulty,
    setCustomConfig,
  } = useQuizStore();

  const progress = useProgressStore();

  // Local state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes default
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'adaptive' | 'timed' | 'test'>('adaptive');
  const [practiceMode, setPracticeMode] = useState<'adaptive' | 'timed' | 'test'>('adaptive');
  const [practiceSubject, setPracticeSubject] = useState<string | null>(null);
  const [practiceTopic, setPracticeTopic] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null); // For showing chapter list
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Custom Practice & Completion states
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSubject, setCustomSubject] = useState<'Physics' | 'Chemistry' | 'Biology'>('Physics');
  const [customLimit, setCustomLimit] = useState<number>(10);
  const [customDiff, setCustomDiff] = useState<'easy' | 'medium' | 'hard' | 'adaptive'>('adaptive');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const getTopicsForSubject = (subject: string) => {
    const topics = new Set<string>();
    (questionsData as Question[]).forEach(q => {
      if (q.subject === subject) {
        topics.add(q.topic);
      }
    });
    return Array.from(topics).sort();
  };

  useEffect(() => {
    const topics = getTopicsForSubject(customSubject);
    setSelectedTopics(topics);
  }, [customSubject]);

  // ─── Hero Carousel State ───
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselRef = React.useRef<FlatList>(null);
  const carouselTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const screenWidth = width - 48; // 24px padding on each side

  // Load bookmarks on mount
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const stored = await AsyncStorage.getItem('bookmarked_questions');
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch (e) {
        console.warn(e);
      }
    };
    loadBookmarks();
  }, []);

  // Dynamic stats calculation for Continue Practicing slide
  const lastSolvedTopic = Object.keys(progress.topicHistory)[0] || 'Electrostatics';
  const lastSolvedSubject = (questionsData as Question[]).find(q => q.topic === lastSolvedTopic || q.topic.toLowerCase().includes(lastSolvedTopic.toLowerCase()))?.subject || progress.preferredSubject || 'Physics';
  const totalTopicQs = (questionsData as Question[]).filter(q => q.topic === lastSolvedTopic || q.topic.toLowerCase().includes(lastSolvedTopic.toLowerCase())).length;
  const solvedTopicQs = (questionsData as Question[]).filter(q => (q.topic === lastSolvedTopic || q.topic.toLowerCase().includes(lastSolvedTopic.toLowerCase())) && progress.solvedQuestionIds.includes(q.id)).length;

  const displaySolved = solvedTopicQs;
  const displayTotal = totalTopicQs > 0 ? totalTopicQs : 1; // Prevent division by zero
  const progressPercent = Math.min(100, Math.round((displaySolved / displayTotal) * 100));

  const getSubjectTheme = (subject: string) => {
    switch (subject) {
      case 'Physics':
        return {
          icon: <Atom color="#6366F1" size={22} />,
          color: '#6366F1',
          bgColor: 'rgba(99, 102, 241, 0.08)',
        };
      case 'Chemistry':
        return {
          icon: <FlaskConical color="#FF693D" size={22} />,
          color: '#FF693D',
          bgColor: 'rgba(255, 105, 61, 0.08)',
        };
      case 'Biology':
        return {
          icon: <Dna color="#10B981" size={22} />,
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.08)',
        };
      default:
        return {
          icon: <Atom color="#6366F1" size={22} />,
          color: '#6366F1',
          bgColor: 'rgba(99, 102, 241, 0.08)',
        };
    }
  };

  const continueTheme = getSubjectTheme(lastSolvedSubject);

  const carouselSlides = [
    {
      key: 'continue-practicing',
      type: 'continue',
    },
    {
      key: 'mega-series',
      type: 'banner',
      badge: 'MEGA SERIES',
      title: 'Vedantu NEET Mega Practice Series',
      subtitle: 'Over 5,000+ chapter-wise questions curated by top experts',
      btnText: 'Start Series',
      bgColor: '#4F46E5', // Indigo
      action: () => startPractice(null),
    },
    {
      key: 'mock-series',
      type: 'banner',
      badge: 'MOCK SERIES',
      title: 'NEET Mock Test Series 2026',
      subtitle: '20 Full-length simulation tests with detailed performance reports',
      btnText: 'Take Mock',
      bgColor: '#0F172A', // Slate
      action: () => router.push('/coming_soon'),
    },
  ];

  useEffect(() => {
    if (selectedSubject || currentQuestion) return;

    carouselTimerRef.current = setInterval(() => {
      setActiveCarouselIndex((prev) => {
        const next = (prev + 1) % carouselSlides.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [selectedSubject, currentQuestion]);

  const onCarouselScroll = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / screenWidth);
    if (idx !== activeCarouselIndex && idx >= 0 && idx < carouselSlides.length) {
      setActiveCarouselIndex(idx);
    }
  };

  const resetAutoScroll = () => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setActiveCarouselIndex((prev) => {
        const next = (prev + 1) % carouselSlides.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
  };

  // Sync selectedOption to a ref to prevent resetting the countdown timer interval on choice selection
  const selectedOptionRef = React.useRef<number | null>(null);
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  const handleTimeUp = () => {
    const latestState = useQuizStore.getState();
    const currentQ = latestState.currentQuestion;
    if (!currentQ) return;

    const chosen = selectedOptionRef.current;
    const isCorrect = chosen !== null && chosen === currentQ.correctOptionIndex;
    progress.recordAnswer(currentQ.id, currentQ.topic, isCorrect);

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }

    const limit = customQuestionLimit || 20;
    const newCount = latestState.sessionQuestionsCount + 1;
    useQuizStore.setState({ sessionQuestionsCount: newCount });

    if (newCount >= limit) {
      setShowCompletionModal(true);
      return;
    }

    const nextQ = getNextAdaptiveQuestion(
      currentQ,
      isCorrect,
      {
        preferredSubject: progress.preferredSubject,
        solvedQuestionIds: progress.solvedQuestionIds,
        topicHistory: progress.topicHistory,
        consecutiveCorrect: progress.consecutiveCorrect,
        weakTopics: progress.weakTopics,
      },
      practiceSubject,
      practiceTopic,
      allowedTopics,
      customDifficulty
    );

    setSelectedOption(null);
    setCurrentQuestion(nextQ);
  };

  // Timer logic for active session
  useEffect(() => {
    if (currentQuestion && !isEvaluated) {
      setSecondsLeft(practiceMode === 'timed' ? 45 : 600); // 45s for timed mode, 10 mins (600s) for adaptive
      setSelectedOption(null); // Reset selection
      setShowHint(false); // Hide hint
    }
  }, [currentQuestion, practiceMode]);

  useEffect(() => {
    if (!currentQuestion || isEvaluated) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (practiceMode === 'timed') {
            setTimeout(() => {
              handleTimeUp();
            }, 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestion, isEvaluated, practiceMode]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleBookmark = async (qId: string) => {
    const updated = bookmarks.includes(qId)
      ? bookmarks.filter((id) => id !== qId)
      : [...bookmarks, qId];
    setBookmarks(updated);
    try {
      await AsyncStorage.setItem('bookmarked_questions', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  // Subject statistics calculation for Landing Page
  const getSubjectStats = (subject: string) => {
    const questions = (questionsData as Question[]).filter((q) => q.subject === subject);
    const solved = questions.filter((q) => progress.solvedQuestionIds.includes(q.id));
    return {
      solved: solved.length,
      total: questions.length,
    };
  };

  const physicsStats = getSubjectStats('Physics');
  const chemistryStats = getSubjectStats('Chemistry');
  const biologyStats = getSubjectStats('Biology');

  // Handle Practice Initiation
  const startPractice = (
    subjectOverride?: string | null,
    topicOverride?: string | null,
    forceModeOverride?: 'adaptive' | 'timed' | 'test',
    customLimitOverride?: number | null,
    customAllowedTopics?: string[] | null,
    customDiffOverride?: 'easy' | 'medium' | 'hard' | 'adaptive' | null
  ) => {
    resetSession();
    setCorrectAnswersCount(0);
    setShowCompletionModal(false);

    let finalSubject = subjectOverride || null;
    if (!finalSubject && topicOverride) {
      const matchedQ = (questionsData as Question[]).find(q => q.topic === topicOverride || q.topic.toLowerCase().includes(topicOverride.toLowerCase()));
      if (matchedQ) {
        finalSubject = matchedQ.subject;
      }
    }

    setCustomConfig(
      customLimitOverride || null,
      customAllowedTopics || null,
      customDiffOverride || null
    );

    // Set practice mode from activeTab or forceModeOverride (e.g. for mock tests)
    setPracticeMode(forceModeOverride || activeTab);
    setPracticeSubject(finalSubject);
    setPracticeTopic(topicOverride || null);

    const nextQ = getNextAdaptiveQuestion(
      null,
      null,
      {
        preferredSubject: progress.preferredSubject,
        solvedQuestionIds: progress.solvedQuestionIds,
        topicHistory: progress.topicHistory,
        consecutiveCorrect: progress.consecutiveCorrect,
        weakTopics: progress.weakTopics,
      },
      finalSubject,
      topicOverride,
      customAllowedTopics || null,
      customDiffOverride || null
    );

    setCurrentQuestion(nextQ);
  };

  useEffect(() => {
    if (params?.topicOverride) {
      const topicVal = params.topicOverride;
      // Clear route parameters to avoid repeating this effect
      router.setParams({ topicOverride: undefined, subjectOverride: undefined });

      const topicQuestion = (questionsData as Question[]).find(q => q.topic === topicVal);
      const subject = topicQuestion ? topicQuestion.subject : null;
      startPractice(subject, topicVal);
    }
  }, [params?.topicOverride]);

  useEffect(() => {
    if (params?.tab) {
      const tabVal = params.tab;
      router.setParams({ tab: undefined });
      if (tabVal === 'adaptive' || tabVal === 'timed' || tabVal === 'test') {
        setActiveTab(tabVal);
      }
    }
  }, [params?.tab]);

  useEffect(() => {
    if (params?.forceMode) {
      const forceModeVal = params.forceMode;
      router.setParams({ forceMode: undefined });
      if (forceModeVal === 'adaptive' || forceModeVal === 'timed' || forceModeVal === 'test') {
        setActiveTab(forceModeVal);
        setPracticeMode(forceModeVal);
      }
    }
  }, [params?.forceMode]);

  const handleOptionSelect = (index: number) => {
    if (isEvaluated) return;
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null || isEvaluated || !currentQuestion) return;

    // Read the latest state to avoid race conditions
    const latestState = useQuizStore.getState();
    if (latestState.isEvaluated) return;

    // 1. Submit answer in active session
    submitAnswer(selectedOption);

    // 2. Log result in progress store
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;
    progress.recordAnswer(currentQuestion.id, currentQuestion.topic, isCorrect);

    if (isCorrect) {
      setCorrectAnswersCount((prev) => prev + 1);
    }

    // 3. Fetch Gemini explanation
    setIsLoadingExplanation(true);
    try {
      const explanation = await fetchAIExplanation(currentQuestion, selectedOption);
      setAIExplanation(explanation);
    } catch (err) {
      console.error('Explanation load failed:', err);
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  const handleNext = () => {
    const latestState = useQuizStore.getState();
    const currentQ = latestState.currentQuestion;
    if (!currentQ) return;

    const limit = customQuestionLimit || 20;
    if (sessionQuestionsCount >= limit) {
      setShowCompletionModal(true);
      return;
    }

    const nextQ = getNextAdaptiveQuestion(
      currentQ,
      latestState.userAnswer === currentQ.correctOptionIndex,
      {
        preferredSubject: progress.preferredSubject,
        solvedQuestionIds: progress.solvedQuestionIds,
        topicHistory: progress.topicHistory,
        consecutiveCorrect: progress.consecutiveCorrect,
        weakTopics: progress.weakTopics,
      },
      practiceSubject,
      practiceTopic,
      allowedTopics,
      customDifficulty
    );

    setCurrentQuestion(nextQ);
  };

  const handleExit = () => {
    resetSession();
    setCurrentQuestion(null);
    setShowCompletionModal(false);
  };

  // Render Sub-components
  const renderFormattedExplanation = (text: string | null) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('###')) {
        return <Text key={idx} style={styles.expHeader}>{trimmed.replace(/^###\s*/, '')}</Text>;
      }
      if (trimmed.startsWith('####')) {
        return <Text key={idx} style={styles.expSubHeader}>{trimmed.replace(/^####\s*/, '')}</Text>;
      }
      if (trimmed.startsWith('---')) {
        return <View key={idx} style={styles.expDivider} />;
      }
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        return (
          <View key={idx} style={styles.expBulletRow}>
            <Text style={styles.expBulletDot}>•</Text>
            <Text style={styles.expBulletText}>{trimmed.replace(/^[\*\-]\s*/, '')}</Text>
          </View>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <View key={idx} style={styles.expBulletRow}>
            <Text style={styles.expNumber}>{trimmed.match(/^\d+/)?.[0]}.</Text>
            <Text style={styles.expBulletText}>{trimmed.replace(/^\d+\.\s*/, '')}</Text>
          </View>
        );
      }
      if (trimmed.length > 0) {
        return <Text key={idx} style={styles.expParagraph}>{trimmed}</Text>;
      }
      return null;
    });
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'hard': return colors.incorrect;
      case 'medium': return colors.gold;
      default: return colors.correct;
    }
  };

  const dynamicPoints = progress.solvedQuestionIds.length * 10;
  const currentQuestionNum = sessionQuestionsCount + 1;
  const isSplit = Platform.OS === 'web' && width >= 900;

  const renderChapterSelection = () => {
    if (!selectedSubject) return null;

    // 1. Get all questions for the selected subject
    const subjectQuestions = (questionsData as Question[]).filter(
      (q) => q.subject === selectedSubject
    );

    // 2. Group by topic (chapter name)
    const chapterMap: Record<string, Question[]> = {};
    subjectQuestions.forEach((q) => {
      if (!chapterMap[q.topic]) {
        chapterMap[q.topic] = [];
      }
      chapterMap[q.topic].push(q);
    });

    // 3. Convert to array and sort alphabetically
    const chapters = Object.keys(chapterMap).map((chapterName) => {
      const questions = chapterMap[chapterName];
      const solved = questions.filter((q) => progress.solvedQuestionIds.includes(q.id));
      return {
        name: chapterName,
        total: questions.length,
        solved: solved.length,
        percentage: questions.length > 0 ? Math.round((solved.length / questions.length) * 100) : 0,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // 4. Calculate subject totals
    const totalQuestions = subjectQuestions.length;
    const totalSolved = subjectQuestions.filter((q) => progress.solvedQuestionIds.includes(q.id)).length;
    const subjectPercentage = totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0;

    // Icon helper
    const getSubjectIcon = () => {
      switch (selectedSubject) {
        case 'Physics': return <Atom color={colors.primary} size={28} />;
        case 'Chemistry': return <FlaskConical color="#3B82F6" size={28} />;
        default: return <Dna color="#10B981" size={28} />;
      }
    };

    const subjectColor = selectedSubject === 'Physics' ? colors.primary : selectedSubject === 'Chemistry' ? '#3B82F6' : '#10B981';

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setSelectedSubject(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{selectedSubject} Chapters</Text>
            <Text style={styles.headerModeText}>Select a chapter test to practice</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.hubScroll} showsVerticalScrollIndicator={false}>
          {/* Progress Summary Card */}
          <View style={[styles.subjectSummaryCard, { borderColor: `${subjectColor}20` }]}>
            <View style={styles.subjectSummaryHeader}>
              <View style={[styles.subjectIconWrapper, { backgroundColor: `${subjectColor}10`, marginBottom: 0 }]}>
                {getSubjectIcon()}
              </View>
              <View style={styles.subjectSummaryInfo}>
                <Text style={styles.subjectSummaryTitle}>{selectedSubject} Syllabus Progress</Text>
                <Text style={styles.subjectSummarySub}>
                  {totalSolved} of {totalQuestions} questions completed ({subjectPercentage}%)
                </Text>
              </View>
            </View>
            <View style={[styles.progressBarBg, { marginTop: 16, marginBottom: 16 }]}>
              <View style={[styles.progressBarFill, { width: `${subjectPercentage}%`, backgroundColor: subjectColor }]} />
            </View>

            {/* Quick Actions Row */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: `${subjectColor}10` }]}
                onPress={() => router.push('/coming_soon')}
              >
                <Sparkles color={subjectColor} size={14} />
                <Text style={[styles.quickActionText, { color: subjectColor }]}>Subject Adaptive Test</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, { backgroundColor: `${subjectColor}10` }]}
                onPress={() => router.push('/coming_soon')}
              >
                <Clock color={subjectColor} size={14} />
                <Text style={[styles.quickActionText, { color: subjectColor }]}>Subject Mock Test</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Chapters List Header */}
          <Text style={styles.sectionHeader}>Chapters ({chapters.length})</Text>

          {/* List of Chapters */}
          <View style={styles.chaptersList}>
            {chapters.map((chapter, index) => (
              <View key={index} style={styles.chapterCard}>
                <View style={styles.chapterCardLeft}>
                  <Text style={styles.chapterName}>{chapter.name}</Text>
                  <Text style={styles.chapterProgressText}>
                    {chapter.solved} / {chapter.total} questions ({chapter.percentage}%)
                  </Text>
                  <View style={[styles.progressBarBg, { marginTop: 8, height: 4 }]}>
                    <View style={[styles.progressBarFill, { width: `${chapter.percentage}%`, backgroundColor: subjectColor }]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.chapterStartBtn, { backgroundColor: subjectColor }]}
                  onPress={() => startPractice(selectedSubject, chapter.name)}
                >
                  <Text style={styles.chapterStartBtnText}>Start</Text>
                  <ChevronRight color="#FFFFFF" size={12} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render Practice Landing / Hub
  if (!currentQuestion) {
    if (selectedSubject) {
      return renderChapterSelection();
    }
    return (
      <View style={styles.container}>
        {/* Header */}
        <TopBar
          title="Practice"
          subtitle="Choose a mode and start your preparation"
          onBellPress={() => setShowNotificationsModal(true)}
        />

        {/* Practice Modes Segmented Control */}
        <View style={styles.tabSelectorContainer}>
          <View style={styles.tabSelectorCard}>
            {/* Practice Tab */}
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'adaptive' && styles.tabItemActive]}
              onPress={() => setActiveTab('adaptive')}
              activeOpacity={0.8}
            >
              <Target color={activeTab === 'adaptive' ? '#FF693D' : colors.textSecondary} size={20} />
              <Text style={[styles.tabItemTitle, activeTab === 'adaptive' && styles.tabItemTitleActive]}>Practice</Text>
              <Text style={styles.tabItemSub}>Learn & Improve</Text>
              {activeTab === 'adaptive' && <View style={styles.tabActiveIndicator} />}
            </TouchableOpacity>

            {/* Quiz Tab */}
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'timed' && styles.tabItemActive]}
              onPress={() => setActiveTab('timed')}
              activeOpacity={0.8}
            >
              <Clock color={activeTab === 'timed' ? '#3B82F6' : colors.textSecondary} size={20} />
              <Text style={[styles.tabItemTitle, activeTab === 'timed' && styles.tabItemTitleActive]}>Quiz</Text>
              <Text style={styles.tabItemSub}>Quick Evaluation</Text>
              {activeTab === 'timed' && <View style={[styles.tabActiveIndicator, { backgroundColor: '#3B82F6' }]} />}
            </TouchableOpacity>

            {/* Test Tab */}
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'test' && styles.tabItemActive]}
              onPress={() => setActiveTab('test')}
              activeOpacity={0.8}
            >
              <FileText color={activeTab === 'test' ? '#10B981' : colors.textSecondary} size={20} />
              <Text style={[styles.tabItemTitle, activeTab === 'test' && styles.tabItemTitleActive]}>Test</Text>
              <Text style={styles.tabItemSub}>Exam Simulation</Text>
              {activeTab === 'test' && <View style={[styles.tabActiveIndicator, { backgroundColor: '#10B981' }]} />}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.hubScroll} showsVerticalScrollIndicator={false}>
          {activeTab === 'adaptive' ? (
            <>
              {/* Carousel Section */}
              <View style={{ marginBottom: 24 }}>
                <FlatList
                  ref={carouselRef}
                  data={carouselSlides}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={screenWidth}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    onCarouselScroll(e);
                    resetAutoScroll();
                  }}
                  getItemLayout={(_, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                  })}
                  keyExtractor={(item) => item.key}
                  renderItem={({ item }) => {
                    if (item.type === 'continue') {
                      return (
                        <View style={[styles.continuePracticingCard, { width: screenWidth }]}>
                          <Text style={styles.continueHeader}>Continue Practicing</Text>
                          <View style={styles.continueTopicRow}>
                            <View style={[styles.continueIconWrapper, { backgroundColor: continueTheme.bgColor }]}>
                              {continueTheme.icon}
                            </View>
                            <View style={{ marginLeft: 12, flex: 1 }}>
                              <Text style={styles.continueTopicName}>{lastSolvedTopic}</Text>
                              <Text style={styles.continueTopicSub}>{lastSolvedSubject} • Practice Mode</Text>
                            </View>
                          </View>

                          <View style={styles.continueProgressBox}>
                            <Text style={styles.continueProgressText}>
                              <Text style={{ color: '#FF693D', fontWeight: '800' }}>{displaySolved} / {displayTotal}</Text> Questions Completed
                            </Text>
                            <View style={styles.continueProgressBarTrack}>
                              <View style={[styles.continueProgressBarFill, { width: `${progressPercent}%` }]} />
                            </View>
                          </View>

                          <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={() => startPractice(lastSolvedSubject, lastSolvedTopic)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.continueBtnText}>Continue Practice</Text>
                            <ChevronRight color="#FFFFFF" size={12} />
                          </TouchableOpacity>
                        </View>
                      );
                    }

                    return (
                      <View style={[styles.practiceBannerSlide, { width: screenWidth, backgroundColor: item.bgColor }]}>
                        <View style={styles.practiceSlideContent}>
                          <View style={styles.practiceSlideBadge}>
                            <Text style={styles.practiceSlideBadgeText}>{item.badge}</Text>
                          </View>
                          <Text style={styles.practiceSlideTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.practiceSlideSubtitle} numberOfLines={2}>{item.subtitle}</Text>
                          <TouchableOpacity
                            style={styles.practiceSlideBtn}
                            onPress={item.action}
                            activeOpacity={0.9}
                          >
                            <Text style={[styles.practiceSlideBtnText, { color: item.bgColor }]}>{item.btnText}</Text>
                            <ChevronRight color={item.bgColor} size={14} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  }}
                />

                {/* Dot Indicators */}
                <View style={styles.carouselDots}>
                  {carouselSlides.map((_, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        setActiveCarouselIndex(idx);
                        carouselRef.current?.scrollToIndex({ index: idx, animated: true });
                        resetAutoScroll();
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.carouselDot,
                          activeCarouselIndex === idx && styles.carouselDotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Practice by Subject */}
              <Text style={styles.sectionHeader}>Practice by Subject</Text>
              <View style={styles.subjectRowGrid}>
                <View style={styles.subjectGridRow}>
                  {/* Physics */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Physics')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
                      <Atom color="#6366F1" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Physics</Text>
                    <Text style={styles.subjectCardSub}>128 Chapters</Text>
                  </TouchableOpacity>

                  {/* Chemistry */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Chemistry')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                      <FlaskConical color="#10B981" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Chemistry</Text>
                    <Text style={styles.subjectCardSub}>118 Chapters</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subjectGridRow}>
                  {/* Biology */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Biology')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                      <Dna color="#FF693D" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Biology</Text>
                    <Text style={styles.subjectCardSub}>96 Chapters</Text>
                  </TouchableOpacity>

                  {/* Mixed Practice */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => startPractice(null)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                      <Award color="#3B82F6" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Mixed Practice</Text>
                    <Text style={styles.subjectCardSub}>All Subjects</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Practice Utilities */}
              <Text style={styles.sectionHeader}>Practice Utilities</Text>
              <View style={styles.utilitiesCard}>
                {/* Custom Practice */}
                <TouchableOpacity
                  style={styles.utilityRow}
                  onPress={() => setShowCustomModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                    <Sliders color="#FF693D" size={18} />
                  </View>
                  <View style={styles.utilityTextCol}>
                    <Text style={styles.utilityTitle}>Custom Practice</Text>
                    <Text style={styles.utilityDesc}>Choose chapter, difficulty, question count & more</Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={16} />
                </TouchableOpacity>

                <View style={styles.utilityDivider} />

                {/* Weak Areas */}
                <TouchableOpacity
                  style={styles.utilityRow}
                  onPress={() => startPractice(progress.weakTopics[0] || null)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                    <Target color="#10B981" size={18} />
                  </View>
                  <View style={styles.utilityTextCol}>
                    <Text style={styles.utilityTitle}>Weak Areas</Text>
                    <Text style={styles.utilityDesc}>Focus on your weak topics</Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={16} />
                </TouchableOpacity>

                <View style={styles.utilityDivider} />

                {/* Wrong Questions */}
                <TouchableOpacity
                  style={styles.utilityRow}
                  onPress={() => startPractice(null)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}>
                    <XCircle color="#F43F5E" size={18} />
                  </View>
                  <View style={styles.utilityTextCol}>
                    <Text style={styles.utilityTitle}>Wrong Questions</Text>
                    <Text style={styles.utilityDesc}>Revise questions you answered incorrectly</Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={16} />
                </TouchableOpacity>

                <View style={styles.utilityDivider} />

                {/* Saved Questions */}
                <TouchableOpacity
                  style={styles.utilityRow}
                  onPress={() => startPractice(null)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.utilityIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                    <Bookmark color="#3B82F6" size={18} />
                  </View>
                  <View style={styles.utilityTextCol}>
                    <Text style={styles.utilityTitle}>Saved Questions</Text>
                    <Text style={styles.utilityDesc}>Practice your bookmarked questions</Text>
                  </View>
                  <ChevronRight color={colors.textMuted} size={16} />
                </TouchableOpacity>
              </View>

              {/* Recommended for You */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Recommended for You</Text>
                <TouchableOpacity onPress={() => router.push('/analytics')}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendTray}
                style={{ marginBottom: 28 }}
              >
                {/* Recommendation 1 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(240, 253, 244, 0.45)' }]}
                  onPress={() => startPractice('Physics', 'Current Electricity')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Atom color="#10B981" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#10B981' }]}>Weak Area</Text>
                      </View>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)', marginTop: 4 }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#10B981' }]}>Physics</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Current Electricity</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>20 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                      <ChevronRight color="#10B981" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Recommendation 2 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(239, 246, 255, 0.45)' }]}
                  onPress={() => startPractice('Chemistry', 'Chemical Bonding')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <FlaskConical color="#3B82F6" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#3B82F6' }]}>Chemistry</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Chemical Bonding</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>15 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
                      <ChevronRight color="#3B82F6" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Recommendation 3 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(255, 247, 237, 0.45)' }]}
                  onPress={() => startPractice('Biology', 'Human Physiology')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Dna color="#FB923C" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#FB923C' }]}>Biology</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Human Physiology</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>18 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(251, 146, 96, 0.25)' }]}>
                      <ChevronRight color="#FB923C" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : activeTab === 'timed' ? (
            <>
              {/* QUIZ TAB LAYOUT */}
              {/* Continue Quiz */}
              <Text style={styles.sectionHeader}>Continue Quiz</Text>
              <View style={styles.quizHeroCard}>
                <View style={styles.quizHeroMainRow}>
                  <View style={styles.quizHeroLeftCol}>
                    <Text style={styles.quizHeroCategory}>Continue Quiz</Text>
                    <Text style={styles.quizHeroTitle}>Chemical Bonding Quiz</Text>
                    <Text style={styles.quizHeroSub}>Chemistry • 10 Questions</Text>

                    <View style={styles.quizHeroProgressBox}>
                      <Text style={styles.quizHeroProgressText}>
                        <Text style={{ color: '#FF693D', fontWeight: '800' }}>6 / 10</Text> Completed
                      </Text>
                      <View style={styles.quizHeroProgressTrack}>
                        <View style={[styles.quizHeroProgressFill, { width: '60%' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Decorative Clock and Clipboard layout */}
                  <View style={styles.quizHeroRightCol}>
                    <View style={styles.quizHeroGraphicWrapper}>
                      <View style={styles.quizHeroCircleBehind} />
                      <Clipboard color="#FF8A65" size={44} style={styles.quizHeroClipboardIcon} />
                      <Clock color="#FFD54F" size={24} style={styles.quizHeroClockIcon} />
                    </View>

                    <TouchableOpacity
                      style={styles.quizHeroBtn}
                      onPress={() => startPractice('Chemistry', 'Chemical Bonding', 'timed')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.quizHeroBtnText}>Continue</Text>
                      <ChevronRight color="#FF693D" size={14} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Quick Challenges ⚡ */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Quick Challenges ⚡</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendTray}
                style={{ marginBottom: 24 }}
              >
                {/* Challenge 1 */}
                <View style={[styles.challengeCard, { backgroundColor: 'rgba(255, 237, 213, 0.45)' }]}>
                  <View style={styles.challengeBadge}>
                    <Text style={[styles.challengeBadgeText, { color: '#EA580C' }]}>⏱️ 5 MINUTES</Text>
                  </View>
                  <Text style={styles.challengeTitle}>5 Question Sprint</Text>
                  <Text style={styles.challengeDesc}>5 Questions • Easy</Text>

                  <View style={styles.challengeCardFooter}>
                    <TouchableOpacity
                      style={[styles.challengeBtn, { borderColor: '#EA580C' }]}
                      onPress={() => startPractice(null, null, 'timed')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.challengeBtnText, { color: '#EA580C' }]}>Start</Text>
                      <ChevronRight color="#EA580C" size={12} />
                    </TouchableOpacity>
                    <Target color="rgba(234, 88, 12, 0.15)" size={48} style={styles.challengeGraphicIcon} />
                  </View>
                </View>

                {/* Challenge 2 */}
                <View style={[styles.challengeCard, { backgroundColor: 'rgba(224, 231, 255, 0.45)' }]}>
                  <View style={styles.challengeBadge}>
                    <Text style={[styles.challengeBadgeText, { color: '#4F46E5' }]}>⏱️ 15 MINUTES</Text>
                  </View>
                  <Text style={styles.challengeTitle}>15 Minute Quiz</Text>
                  <Text style={styles.challengeDesc}>12 Questions • Mixed</Text>

                  <View style={styles.challengeCardFooter}>
                    <TouchableOpacity
                      style={[styles.challengeBtn, { borderColor: '#4F46E5' }]}
                      onPress={() => startPractice(null, null, 'timed')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.challengeBtnText, { color: '#4F46E5' }]}>Start</Text>
                      <ChevronRight color="#4F46E5" size={12} />
                    </TouchableOpacity>
                    <Clock color="rgba(79, 70, 229, 0.15)" size={48} style={styles.challengeGraphicIcon} />
                  </View>
                </View>

                {/* Challenge 3 */}
                <View style={[styles.challengeCard, { backgroundColor: 'rgba(209, 250, 229, 0.45)' }]}>
                  <View style={styles.challengeBadge}>
                    <Text style={[styles.challengeBadgeText, { color: '#059669' }]}>📅 DAILY QUIZ</Text>
                  </View>
                  <Text style={styles.challengeTitle}>Daily Quiz</Text>
                  <Text style={styles.challengeDesc}>10 Questions • Mixed</Text>

                  <View style={styles.challengeCardFooter}>
                    <TouchableOpacity
                      style={[styles.challengeBtn, { borderColor: '#059669' }]}
                      onPress={() => startPractice(null, null, 'timed')}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.challengeBtnText, { color: '#059669' }]}>Start</Text>
                      <ChevronRight color="#059669" size={12} />
                    </TouchableOpacity>
                    <Calendar color="rgba(5, 150, 105, 0.15)" size={48} style={styles.challengeGraphicIcon} />
                  </View>
                </View>
              </ScrollView>

              {/* Quiz by Subject */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Quiz by Subject</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.subjectRowGrid}>
                <View style={styles.subjectGridRow}>
                  {/* Physics */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Physics')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
                      <Atom color="#6366F1" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Physics</Text>
                    <Text style={styles.subjectCardSub}>120 Quizzes</Text>
                  </TouchableOpacity>

                  {/* Chemistry */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Chemistry')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                      <FlaskConical color="#10B981" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Chemistry</Text>
                    <Text style={styles.subjectCardSub}>98 Quizzes</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subjectGridRow}>
                  {/* Biology */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => setSelectedSubject('Biology')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                      <Dna color="#FF693D" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Biology</Text>
                    <Text style={styles.subjectCardSub}>86 Quizzes</Text>
                  </TouchableOpacity>

                  {/* Mixed */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => startPractice(null, null, 'timed')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                      <Award color="#3B82F6" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Mixed</Text>
                    <Text style={styles.subjectCardSub}>60 Quizzes</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Topic Quizzes */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Topic Quizzes</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.topicQuizContainer}>
                {/* Quiz 1 */}
                <View style={styles.topicQuizRow}>
                  <View style={[styles.topicQuizIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
                    <BookOpen color="#6366F1" size={18} />
                  </View>
                  <View style={styles.topicQuizInfo}>
                    <Text style={styles.topicQuizTitle}>Thermodynamics Quiz</Text>
                    <Text style={styles.topicQuizMeta}>Physics • 15 Questions • Medium</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.topicQuizStartBtn}
                    onPress={() => startPractice('Physics', 'Thermodynamics', 'timed')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicQuizStartBtnText}>Start</Text>
                    <ChevronRight color="#FF693D" size={12} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topicQuizDivider} />

                {/* Quiz 2 */}
                <View style={styles.topicQuizRow}>
                  <View style={[styles.topicQuizIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                    <FlaskConical color="#10B981" size={18} />
                  </View>
                  <View style={styles.topicQuizInfo}>
                    <Text style={styles.topicQuizTitle}>Organic Chemistry Quiz</Text>
                    <Text style={styles.topicQuizMeta}>Chemistry • 12 Questions • Medium</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.topicQuizStartBtn}
                    onPress={() => startPractice('Chemistry', 'Organic Chemistry', 'timed')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicQuizStartBtnText}>Start</Text>
                    <ChevronRight color="#FF693D" size={12} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topicQuizDivider} />

                {/* Quiz 3 */}
                <View style={styles.topicQuizRow}>
                  <View style={[styles.topicQuizIconBg, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                    <Dna color="#FF693D" size={18} />
                  </View>
                  <View style={styles.topicQuizInfo}>
                    <Text style={styles.topicQuizTitle}>Human Physiology Quiz</Text>
                    <Text style={styles.topicQuizMeta}>Biology • 10 Questions • Easy</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.topicQuizStartBtn}
                    onPress={() => startPractice('Biology', 'Human Physiology', 'timed')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicQuizStartBtnText}>Start</Text>
                    <ChevronRight color="#FF693D" size={12} />
                  </TouchableOpacity>
                </View>
                <View style={styles.topicQuizDivider} />

                {/* Quiz 4 */}
                <View style={styles.topicQuizRow}>
                  <View style={[styles.topicQuizIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
                    <Atom color="#6366F1" size={18} />
                  </View>
                  <View style={styles.topicQuizInfo}>
                    <Text style={styles.topicQuizTitle}>Current Electricity Quiz</Text>
                    <Text style={styles.topicQuizMeta}>Physics • 12 Questions • Medium</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.topicQuizStartBtn}
                    onPress={() => startPractice('Physics', 'Current Electricity', 'timed')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.topicQuizStartBtnText}>Start</Text>
                    <ChevronRight color="#FF693D" size={12} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recommended Quizzes */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Recommended Quizzes</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendTray}
                style={{ marginBottom: 28 }}
              >
                {/* Rec 1 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(255, 237, 213, 0.45)' }]}
                  onPress={() => startPractice('Chemistry', 'Coordination Compounds', 'timed')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <FlaskConical color="#FF693D" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#FF693D' }]}>Weak Area</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Coordination Compounds</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>10 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(255, 105, 61, 0.25)' }]}>
                      <ChevronRight color="#FF693D" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Rec 2 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(224, 231, 255, 0.45)' }]}
                  onPress={() => startPractice('Physics', 'Work, Energy & Power', 'timed')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Atom color="#6366F1" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#6366F1' }]}>Revision</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Work, Energy & Power</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>15 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(99, 102, 241, 0.25)' }]}>
                      <ChevronRight color="#6366F1" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Rec 3 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(209, 250, 229, 0.45)' }]}
                  onPress={() => startPractice('Biology', 'Plant Physiology', 'timed')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Dna color="#10B981" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#10B981' }]}>Popular</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Plant Physiology Quiz</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>12 Questions</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                      <ChevronRight color="#10B981" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </>
          ) : (
            <>
              {/* TEST TAB LAYOUT */}
              {/* Continue Test ⭐ */}
              <Text style={styles.sectionHeader}>Continue Test ⭐</Text>
              <View style={styles.testHeroCard}>
                <View style={styles.testHeroHeaderRow}>
                  <Text style={styles.testHeroCategory}>Active Simulation</Text>
                  <View style={styles.testHeroTimeBadge}>
                    <Clock color="#10B981" size={12} style={{ marginRight: 4 }} />
                    <Text style={styles.testHeroTimeBadgeText}>1h 45m left</Text>
                  </View>
                </View>

                <Text style={styles.testHeroTitle}>NEET Full Syllabus Mock Test 05</Text>
                <Text style={styles.testHeroSub}>Physics, Chemistry, Biology • 180 Questions • 3 Hours</Text>

                <View style={styles.testHeroProgressBox}>
                  <Text style={styles.testHeroProgressText}>
                    <Text style={{ color: '#10B981', fontWeight: '800' }}>45 / 180</Text> Questions Completed
                  </Text>
                  <View style={styles.testHeroProgressTrack}>
                    <View style={[styles.testHeroProgressFill, { width: '25%' }]} />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.testHeroBtn}
                  onPress={() => router.push('/coming_soon')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.testHeroBtnText}>Resume Test</Text>
                  <ChevronRight color="#FFFFFF" size={12} />
                </TouchableOpacity>
              </View>

              {/* Test Categories */}
              <Text style={styles.sectionHeader}>Test Categories</Text>
              <View style={styles.testCategoriesGrid}>
                <View style={styles.subjectGridRow}>
                  {/* Full Mock Tests */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => router.push('/coming_soon')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                      <Award color="#10B981" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Full Mock Tests</Text>
                    <Text style={styles.subjectCardSub}>10 Tests Available</Text>
                  </TouchableOpacity>

                  {/* Subject Tests */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => router.push('/coming_soon')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                      <Sliders color="#FF693D" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Subject Tests</Text>
                    <Text style={styles.subjectCardSub}>24 Tests Available</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.subjectGridRow}>
                  {/* Chapter Tests */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => router.push('/coming_soon')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.08)' }]}>
                      <Atom color="#3B82F6" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Chapter Tests</Text>
                    <Text style={styles.subjectCardSub}>64 Tests Available</Text>
                  </TouchableOpacity>

                  {/* Previous Year Papers */}
                  <TouchableOpacity
                    style={styles.subjectCircleCard}
                    onPress={() => router.push('/coming_soon')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.subjectIconCircle, { backgroundColor: 'rgba(217, 119, 6, 0.08)' }]}>
                      <Trophy color="#D97706" size={20} />
                    </View>
                    <Text style={styles.subjectCardTitle}>Previous Years</Text>
                    <Text style={styles.subjectCardSub}>8 Papers (2018-2025)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recommended Tests */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Recommended Tests</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recommendTray}
                style={{ marginBottom: 24 }}
              >
                {/* Rec 1 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(209, 250, 229, 0.45)' }]}
                  onPress={() => router.push('/coming_soon')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Award color="#10B981" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#10B981' }]}>High Yield</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>NEET 2026 Prediction Test 1</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>180 Qs • 3 Hrs</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(16, 185, 129, 0.25)' }]}>
                      <ChevronRight color="#10B981" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Rec 2 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(224, 231, 255, 0.45)' }]}
                  onPress={() => router.push('/coming_soon')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <Atom color="#3B82F6" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#3B82F6' }]}>Physics</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Physics Mechanics Sectional</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>45 Qs • 1 Hr</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
                      <ChevronRight color="#3B82F6" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Rec 3 */}
                <TouchableOpacity
                  style={[styles.recommendCard, { backgroundColor: 'rgba(255, 237, 213, 0.45)' }]}
                  onPress={() => router.push('/coming_soon')}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendHeaderRow}>
                    <View style={[styles.recommendIconBubble, { backgroundColor: '#FFFFFF' }]}>
                      <FlaskConical color="#FF693D" size={16} />
                    </View>
                    <View style={styles.recommendBadgeCol}>
                      <View style={[styles.recommendBadgeMini, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}>
                        <Text style={[styles.recommendBadgeMiniText, { color: '#FF693D' }]}>Chemistry</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle}>Organic Chemistry Revision</Text>
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>30 Qs • 45 Mins</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: 'rgba(255, 105, 61, 0.25)' }]}>
                      <ChevronRight color="#FF693D" size={12} />
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>

              {/* Recent Results */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeader}>Recent Results</Text>
                <TouchableOpacity onPress={() => router.push('/analytics')}>
                  <Text style={styles.viewAllBtnText}>View History</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.recentResultsContainer}>
                {/* Result 1 */}
                <View style={styles.recentResultRow}>
                  <View style={[styles.recentResultIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                    <CheckCircle2 color="#10B981" size={18} />
                  </View>
                  <View style={styles.recentResultInfo}>
                    <Text style={styles.recentResultTitle}>NEET Mock Test 04</Text>
                    <Text style={styles.recentResultMeta}>Correct: 148 | Incorrect: 20 | Left: 12</Text>
                  </View>
                  <View style={styles.recentResultScoreContainer}>
                    <Text style={styles.recentResultScore}>580/720</Text>
                    <TouchableOpacity
                      style={styles.recentResultViewBtn}
                      onPress={() => router.push('/analytics')}
                    >
                      <Text style={styles.recentResultViewBtnText}>Analysis</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.recentResultDivider} />

                {/* Result 2 */}
                <View style={styles.recentResultRow}>
                  <View style={[styles.recentResultIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                    <CheckCircle2 color="#10B981" size={18} />
                  </View>
                  <View style={styles.recentResultInfo}>
                    <Text style={styles.recentResultTitle}>Physics Electrostatics Test</Text>
                    <Text style={styles.recentResultMeta}>Correct: 36 | Incorrect: 8 | Left: 1</Text>
                  </View>
                  <View style={styles.recentResultScoreContainer}>
                    <Text style={styles.recentResultScore}>140/180</Text>
                    <TouchableOpacity
                      style={styles.recentResultViewBtn}
                      onPress={() => router.push('/analytics')}
                    >
                      <Text style={styles.recentResultViewBtnText}>Analysis</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Performance Insights */}
              <Text style={styles.sectionHeader}>Performance Insights</Text>
              <View style={styles.performanceInsightsContainer}>
                {/* Insight 1 */}
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Clock color="#3B82F6" size={16} />
                    <Text style={styles.insightTitle}>Average Speed</Text>
                  </View>
                  <Text style={styles.insightVal}>52s / question</Text>
                  <Text style={styles.insightSub}>Target is &lt;60s. Your pacing is excellent!</Text>
                </View>

                {/* Insight 2 */}
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Zap color="#10B981" size={16} />
                    <Text style={styles.insightTitle}>Section Strength</Text>
                  </View>
                  <Text style={styles.insightVal}>Biology (88% Acc)</Text>
                  <Text style={styles.insightSub}>Organic Chemistry needs immediate revision (48% Acc).</Text>
                </View>

                {/* Insight 3 */}
                <View style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <Award color="#D97706" size={16} />
                    <Text style={styles.insightTitle}>Estimated Score</Text>
                  </View>
                  <Text style={styles.insightVal}>590 - 620</Text>
                  <Text style={styles.insightSub}>Calibrated across your last 3 simulated sessions.</Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Notifications Modal */}
        <Modal
          visible={showNotificationsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <View style={styles.modalBody}>
                <View style={styles.notificationItem}>
                  <View style={styles.notifBadgeUnread} />
                  <View style={styles.notifContentCol}>
                    <Text style={styles.notifTitle}>Weekly performance insight ready!</Text>
                    <Text style={styles.notifBody}>Our AI has prepared recommendations for Physics - Thermodynamics.</Text>
                  </View>
                </View>
                <View style={styles.notificationItem}>
                  <View style={styles.notifBadgeUnread} />
                  <View style={styles.notifContentCol}>
                    <Text style={styles.notifTitle}>Daily Streak warning ⚠️</Text>
                    <Text style={styles.notifBody}>Complete 1 practice session to maintain consistency streak.</Text>
                  </View>
                </View>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setShowNotificationsModal(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Active Practice Session Rendering
  const difficultyColor = getDifficultyColor(currentQuestion.difficulty);
  const isBookmarked = bookmarks.includes(currentQuestion.id);

  const mainPracticeLayout = (
    <View style={{ flex: 1 }}>
      {/* progress tracking */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeaderRow}>
          <Text style={styles.progressText}>Question {currentQuestionNum}/{customQuestionLimit || 20}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>🏆 {dynamicPoints} pts</Text>
          </View>
        </View>
        {/* progress bar */}
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, (currentQuestionNum / (customQuestionLimit || 20)) * 100)}%` },
            ]}
          />
        </View>
      </View>

      {/* metadata badges */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgesRow}
      >
        <View style={[styles.badgeItem, { backgroundColor: `${colors.primary}10` }]}>
          <Atom color={colors.primary} size={14} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>{currentQuestion.subject}</Text>
        </View>
        <View style={[styles.badgeItem, { backgroundColor: '#3B82F610' }]}>
          <FlaskConical color="#3B82F6" size={14} />
          <Text style={[styles.badgeText, { color: '#3B82F6' }]}>{currentQuestion.topic}</Text>
        </View>
        <View style={[styles.badgeItem, { backgroundColor: `${difficultyColor}10` }]}>
          <Dna color={difficultyColor} size={14} />
          <Text style={[styles.badgeText, { color: difficultyColor }]}>
            {currentQuestion.difficulty.toUpperCase()}
          </Text>
        </View>
        <View style={[styles.badgeItem, { backgroundColor: `${colors.primary}10` }]}>
          <Clock color={colors.primary} size={14} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>{formatTime(secondsLeft)}</Text>
        </View>
      </ScrollView>

      {/* Question Card */}
      <View style={styles.questionCard}>
        <View style={styles.questionCardHeader}>
          <Text style={styles.questionIdText}>Q{currentQuestionNum}.</Text>
          <TouchableOpacity onPress={() => toggleBookmark(currentQuestion.id)}>
            <Bookmark
              color={isBookmarked ? colors.primary : colors.textMuted}
              fill={isBookmarked ? colors.primary : 'none'}
              size={20}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.questionBody}>{currentQuestion.questionText}</Text>

        {/* Options stack */}
        <View style={styles.optionsStack}>
          {currentQuestion.options.map((option, index) => {
            const isOptSelected = selectedOption === index;
            const isOptCorrect = currentQuestion.correctOptionIndex === index;
            const alphabet = String.fromCharCode(65 + index);

            let optionStyle = styles.optionNormal;
            let badgeStyle = styles.prefixNormal;
            let badgeTextStyle = styles.prefixTextNormal;
            let optionTextStyle = styles.optionTextNormal;
            let rightIcon = null;

            if (isEvaluated) {
              if (isOptCorrect) {
                optionStyle = styles.optionCorrect;
                badgeStyle = styles.prefixCorrect;
                badgeTextStyle = styles.prefixTextCorrect;
                optionTextStyle = styles.optionTextCorrect;
                rightIcon = <CheckCircle2 color={colors.correct} size={20} />;
              } else if (isOptSelected) {
                optionStyle = styles.optionIncorrect;
                badgeStyle = styles.prefixIncorrect;
                badgeTextStyle = styles.prefixTextIncorrect;
                optionTextStyle = styles.optionTextIncorrect;
                rightIcon = <XCircle color={colors.incorrect} size={20} />;
              } else {
                optionStyle = styles.optionFaded;
                badgeStyle = styles.prefixFaded;
                badgeTextStyle = styles.prefixTextFaded;
                optionTextStyle = styles.optionTextFaded;
              }
            } else if (isOptSelected) {
              optionStyle = styles.optionSelected;
              badgeStyle = styles.prefixSelected;
              badgeTextStyle = styles.prefixTextSelected;
              optionTextStyle = styles.optionTextSelected;
            }

            return (
              <TouchableOpacity
                key={index}
                style={[styles.optionBase, optionStyle]}
                onPress={() => handleOptionSelect(index)}
                disabled={isEvaluated}
                activeOpacity={0.75}
              >
                <View style={styles.optionLeftContainer}>
                  <View style={[styles.prefixBadge, badgeStyle]}>
                    <Text style={[styles.prefixBadgeText, badgeTextStyle]}>{alphabet}</Text>
                  </View>
                  <Text style={[styles.optionContentText, optionTextStyle]}>{option}</Text>
                </View>
                {rightIcon}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Submit Button */}
        {!isEvaluated && (
          <TouchableOpacity
            style={[styles.submitBtn, selectedOption === null && styles.submitBtnDisabled]}
            disabled={selectedOption === null}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Submit Answer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hint Section */}
      <View style={styles.hintContainer}>
        <View style={styles.hintHeader}>
          <View style={styles.hintTitleRow}>
            <Lightbulb color={colors.gold} size={20} />
            <Text style={styles.hintTitle}>Need a hint?</Text>
          </View>
          <TouchableOpacity
            style={styles.hintActionBtn}
            onPress={() => setShowHint(!showHint)}
          >
            <Text style={styles.hintActionBtnText}>{showHint ? 'Hide Hint' : 'Show Hint'}</Text>
          </TouchableOpacity>
        </View>
        {showHint && (
          <Text style={styles.hintBody}>
            {currentQuestion.subject === 'Physics'
              ? `Eliminate the options using the fundamental equations and variables in ${currentQuestion.topic}.`
              : currentQuestion.subject === 'Chemistry'
                ? `Think about the bonding setups, periodic states, or oxidation coefficients for ${currentQuestion.topic}.`
                : `Recall the NCERT facts and physiological pathways regarding ${currentQuestion.topic}.`}
          </Text>
        )}
      </View>

      {/* Previous Answer Comparison Box */}
      {isEvaluated && (
        <View style={styles.comparisonBox}>
          <View style={[styles.comparisonCol, styles.comparisonLeft]}>
            <Text style={styles.comparisonLabel}>Previous Answer</Text>
            <Text style={styles.comparisonSub}>You answered</Text>
            <View style={[styles.comparisonBadge, { backgroundColor: userAnswer === currentQuestion.correctOptionIndex ? '#E6F4EA' : '#FCE8E6' }]}>
              <Text style={[styles.comparisonBadgeText, { color: userAnswer === currentQuestion.correctOptionIndex ? colors.correct : colors.incorrect }]}>
                [{String.fromCharCode(65 + (userAnswer || 0))}] {userAnswer === currentQuestion.correctOptionIndex ? 'Correct' : 'Incorrect'}
              </Text>
            </View>
          </View>
          <View style={[styles.comparisonCol, styles.comparisonRight]}>
            <Text style={styles.comparisonLabel}>Correct Answer</Text>
            <View style={[styles.comparisonBadge, { backgroundColor: '#E6F4EA' }]}>
              <Text style={[styles.comparisonBadgeText, { color: colors.correct }]}>
                [{String.fromCharCode(65 + currentQuestion.correctOptionIndex)}] {currentQuestion.options[currentQuestion.correctOptionIndex]}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Session Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleExit}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.textSecondary} size={20} />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Practice</Text>
          <View style={styles.headerModeBox}>
            <Text style={styles.headerModeText}>
              {practiceMode === 'timed' ? 'Timed Test' : 'Adaptive Mode'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={12} />
          </View>
        </View>

        <View style={styles.headerRightBox}>
          <View style={styles.headerStreakBadge}>
            <Text style={styles.headerStreakText}>🔥 {progress.streak}</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn}>
            <Menu color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {isSplit ? (
        <View style={styles.splitContent}>
          {/* Left Column: Question Layout */}
          <ScrollView
            style={styles.leftPane}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {mainPracticeLayout}
          </ScrollView>

          {/* Right Column: AI Explanation */}
          <View style={styles.rightPane}>
            <View style={styles.explanationCard}>
              <View style={styles.explanationCardHeader}>
                <View style={styles.explanationCardHeaderLeft}>
                  <Brain color={colors.primary} size={20} />
                  <Text style={styles.explanationCardTitle}>Ved Explanation</Text>
                </View>
                <View style={styles.aiTag}>
                  <Text style={styles.aiTagText}>AI Powered by Vedantu</Text>
                </View>
              </View>

              <ScrollView
                style={styles.explanationScroll}
                contentContainerStyle={styles.explanationContent}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingExplanation ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Analyzing choices & generating review...</Text>
                  </View>
                ) : aiExplanation ? (
                  renderFormattedExplanation(aiExplanation)
                ) : (
                  <View style={styles.explanationEmptyState}>
                    <Brain color={colors.textMuted} size={40} />
                    <Text style={styles.explanationEmptyText}>
                      Submit your answer to receive a conceptual AI-powered explanation.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {mainPracticeLayout}

          {/* AI Explanation Card (stacked under) */}
          {isEvaluated && (
            <View style={[styles.explanationCard, { marginTop: 12, height: 'auto' }]}>
              <View style={styles.explanationCardHeader}>
                <View style={styles.explanationCardHeaderLeft}>
                  <Brain color={colors.primary} size={20} />
                  <Text style={styles.explanationCardTitle}>AI Explanation</Text>
                </View>
                <View style={styles.aiTag}>
                  <Text style={styles.aiTagText}>Powered by AI</Text>
                </View>
              </View>
              <View style={styles.explanationContent}>
                {isLoadingExplanation ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Analyzing choices & generating review...</Text>
                  </View>
                ) : (
                  renderFormattedExplanation(aiExplanation)
                )}
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Bottom Action Control Bar */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.footerOutlineBtn}
          onPress={handleExit}
          activeOpacity={0.7}
        >
          <Text style={styles.footerOutlineText}>Exit Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerOutlineBtn}
          onPress={() => toggleBookmark(currentQuestion.id)}
          activeOpacity={0.7}
        >
          <Bookmark
            color={isBookmarked ? colors.primary : colors.textSecondary}
            fill={isBookmarked ? colors.primary : 'none'}
            size={14}
            style={{ marginRight: 4 }}
          />
          <Text style={styles.footerOutlineText}>Mark for Review</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerFilledBtn, !isEvaluated && styles.footerFilledBtnDisabled]}
          disabled={!isEvaluated}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.footerFilledText}>Next Question</Text>
          <ChevronRight color="#FFFFFF" size={16} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      {/* Custom Config and Completion Modals */}
      {renderCustomPracticeModal()}
      {renderCompletionModal()}
    </View>
  );

  function renderCustomPracticeModal() {
    const allTopics = getTopicsForSubject(customSubject);
    
    const handleToggleTopic = (topic: string) => {
      if (selectedTopics.includes(topic)) {
        setSelectedTopics(selectedTopics.filter(t => t !== topic));
      } else {
        setSelectedTopics([...selectedTopics, topic]);
      }
    };
    
    const handleSelectAll = () => {
      setSelectedTopics(allTopics);
    };
    
    const handleDeselectAll = () => {
      setSelectedTopics([]);
    };
    
    const handleStart = () => {
      if (selectedTopics.length === 0) {
        alert("Please select at least one chapter to practice.");
        return;
      }
      setShowCustomModal(false);
      startPractice(
        customSubject,
        null,
        customDiff === 'adaptive' ? 'adaptive' : 'timed',
        customLimit,
        selectedTopics,
        customDiff
      );
    };

    return (
      <Modal
        visible={showCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 500, maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>Configure Custom Practice</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 8 }}>
              {/* Subject Selector */}
              <Text style={styles.customModalLabel}>Select Subject</Text>
              <View style={styles.customModalTabRow}>
                {(['Physics', 'Chemistry', 'Biology'] as const).map(sub => (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.customModalTab, customSubject === sub && styles.customModalTabActive]}
                    onPress={() => setCustomSubject(sub)}
                  >
                    <Text style={[styles.customModalTabText, customSubject === sub && styles.customModalTabTextActive]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Question Count Selector */}
              <Text style={styles.customModalLabel}>Number of Questions</Text>
              <View style={styles.customModalTabRow}>
                {([5, 10, 15, 20] as const).map(lim => (
                  <TouchableOpacity
                    key={lim}
                    style={[styles.customModalTab, customLimit === lim && styles.customModalTabActive]}
                    onPress={() => setCustomLimit(lim)}
                  >
                    <Text style={[styles.customModalTabText, customLimit === lim && styles.customModalTabTextActive]}>
                      {lim} Qs
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty Selector */}
              <Text style={styles.customModalLabel}>Difficulty Mode</Text>
              <View style={styles.customModalTabRow}>
                {(['adaptive', 'easy', 'medium', 'hard'] as const).map(d => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.customModalTab, customDiff === d && styles.customModalTabActive]}
                    onPress={() => setCustomDiff(d)}
                  >
                    <Text style={[styles.customModalTabText, customDiff === d && styles.customModalTabTextActive]}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chapters Checklist */}
              <View style={styles.customModalLabelRow}>
                <Text style={styles.customModalLabel}>Select Chapters ({selectedTopics.length}/{allTopics.length})</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={handleSelectAll}>
                    <Text style={styles.customModalLinkText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeselectAll}>
                    <Text style={styles.customModalLinkText}>None</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.checklistContainer}>
                {allTopics.map(topic => {
                  const isChecked = selectedTopics.includes(topic);
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={styles.checklistItem}
                      onPress={() => handleToggleTopic(topic)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Text style={styles.checkboxTick}>✓</Text>}
                      </View>
                      <Text style={styles.checklistItemText}>{topic}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { gap: 12, marginTop: 12 }]}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn, { flex: 1 }]}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { flex: 1, backgroundColor: '#FF693D' }]}
                onPress={handleStart}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderCompletionModal() {
    const accuracy = sessionQuestionsCount > 0 ? Math.round((correctAnswersCount / sessionQuestionsCount) * 100) : 0;
    const pointsEarned = correctAnswersCount * 10;

    const handleRestartSession = () => {
      startPractice(
        practiceSubject,
        practiceTopic,
        practiceMode,
        customQuestionLimit,
        allowedTopics,
        customDifficulty
      );
    };

    return (
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 400, alignItems: 'center', padding: 32 }]}>
            <View style={[styles.successIconWrapper, { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 32, marginBottom: 16 }]}>
              <Trophy color="#10B981" size={48} />
            </View>
            
            <Text style={[styles.modalTitle, { textAlign: 'center', fontSize: 22, marginBottom: 8 }]}>
              Session Completed!
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 24, fontSize: 14, lineHeight: 20 }}>
              Excellent effort! Here is your performance summary for this session:
            </Text>

            <View style={styles.resultsGrid}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Solved</Text>
                <Text style={styles.resultValue}>{sessionQuestionsCount}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Correct</Text>
                <Text style={styles.resultValue}>{correctAnswersCount}</Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Accuracy</Text>
                <Text style={[styles.resultValue, { color: accuracy >= 70 ? '#10B981' : '#F59E0B' }]}>
                  {accuracy}%
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>Points</Text>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  +{pointsEarned} pts
                </Text>
              </View>
            </View>

            <View style={{ width: '100%', gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#FF693D', width: '100%' }]}
                onPress={handleRestartSession}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Practice Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn, { width: '100%' }]}
                onPress={handleExit}
              >
                <Text style={styles.modalCancelBtnText}>Back to Practice Hub</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // Hub landing page styles
    hubHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: Platform.OS === 'ios' ? 50 : 20,
      paddingBottom: 15,
      backgroundColor: colors.backgroundCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlass,
    },
    hubTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    hubSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
      fontWeight: '500',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    streakBadge: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF5F2',
      borderWidth: 1,
      borderColor: 'rgba(255, 105, 61, 0.15)',
      borderRadius: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    streakBadgeText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    streakBadgeSub: {
      fontSize: 8,
      color: colors.textSecondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 1,
      letterSpacing: 0.3,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    hubScroll: {
      padding: 24,
      paddingBottom: 100,
    },
    practiceBannerSlide: {
      borderRadius: 14,
      padding: 20,
      minHeight: 155,
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    practiceSlideContent: {
      zIndex: 2,
      maxWidth: '85%',
    },
    practiceSlideBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginBottom: 8,
    },
    practiceSlideBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.8,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    practiceSlideTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#FFFFFF',
      marginBottom: 4,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    practiceSlideSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.85)',
      marginBottom: 12,
      lineHeight: 16,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    practiceSlideBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      gap: 4,
    },
    practiceSlideBtnText: {
      fontSize: 11,
      fontWeight: '800',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    carouselDots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      gap: 6,
    },
    carouselDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: '#CBD5E1',
    },
    carouselDotActive: {
      width: 18,
      borderRadius: 3.5,
      backgroundColor: '#4F46E5',
    },
    continuePracticingCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      minHeight: 180,
      justifyContent: 'space-between',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    continueHeader: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FF693D',
      marginBottom: 4,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    continueMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    continueLeftCol: {
      flex: 1,
      gap: 12,
    },
    continueTopicRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    continueIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(255, 105, 61, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 105, 61, 0.15)',
    },
    continueTopicName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    continueTopicSub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    continueProgressBox: {
      gap: 6,
      marginTop: 8,
    },
    continueProgressText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    continueProgressBarTrack: {
      width: '100%',
      height: 6,
      backgroundColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    continueProgressBarFill: {
      height: '100%',
      backgroundColor: '#FF693D',
      borderRadius: 3,
    },
    continueBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#FF693D',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      gap: 4,
      marginTop: 12,
    },
    continueBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 11,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    subjectIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    headerControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    topBarStreakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 105, 61, 0.08)',
      borderRadius: 12,
      paddingVertical: 5,
      paddingHorizontal: 10,
      gap: 4,
    },
    topBarStreakText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FF693D',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    avatarBtn: {
      borderWidth: 1.5,
      borderColor: colors.borderGlass,
      borderRadius: 20,
      padding: 1,
      width: 38,
      height: 38,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 24,
      width: '100%',
      maxWidth: 400,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1E293B',
      marginBottom: 16,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    modalBody: {
      gap: 16,
      marginBottom: 24,
    },
    notificationItem: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(15, 23, 42, 0.04)',
    },
    notifBadgeUnread: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FF693D',
      marginTop: 6,
    },
    notifContentCol: {
      flex: 1,
      gap: 4,
    },
    notifTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1E293B',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    notifBody: {
      fontSize: 12,
      color: '#64748B',
      lineHeight: 18,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    modalFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    modalBtn: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCancelBtn: {
      backgroundColor: '#F1F5F9',
    },
    modalCancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#475569',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    headerIconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    notificationDot: {
      position: 'absolute',
      top: 8,
      right: 9,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#EF4444',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    },
    sectionHeader: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 12,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    tabSelectorContainer: {
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 0,
      backgroundColor: colors.background,
    },
    tabSelectorCard: {
      flexDirection: 'row',
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 14,
      marginBottom: 0,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      borderRightWidth: 1,
      borderRightColor: 'rgba(15, 23, 42, 0.04)',
    },
    tabItemActive: {
      // highlighted properties
    },
    tabItemTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 6,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    tabItemTitleActive: {
      color: colors.textPrimary,
    },
    tabItemSub: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    tabActiveIndicator: {
      position: 'absolute',
      bottom: -14,
      width: 40,
      height: 3,
      backgroundColor: '#FF693D',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    subjectRowGrid: {
      flexDirection: 'column',
      gap: 12,
      marginBottom: 24,
    },
    subjectGridRow: {
      flexDirection: 'row',
      gap: 12,
    },
    subjectCircleCard: {
      flex: 1,
      aspectRatio: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    subjectIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    subjectCardTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    subjectCardSub: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    subjectCardChevron: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    utilitiesCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 24,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    utilityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    utilityIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    utilityTextCol: {
      flex: 1,
      marginLeft: 12,
    },
    utilityTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    utilityDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 1,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    utilityDivider: {
      height: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    viewAllBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#4F46E5',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recommendHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 12,
    },
    recommendBadgeCol: {
      alignItems: 'flex-end',
    },

    // Session Page Styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      height: Platform.OS === 'ios' ? 80 : 64,
      paddingTop: Platform.OS === 'ios' ? 36 : 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlass,
      backgroundColor: colors.backgroundCard,
    },
    backBtn: {
      padding: 6,
    },
    headerTitleBox: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    headerModeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 1,
    },
    headerModeText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    headerRightBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    headerStreakBadge: {
      backgroundColor: '#FFF5F2',
      borderWidth: 1,
      borderColor: 'rgba(255, 105, 61, 0.15)',
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 6,
    },
    headerStreakText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    menuBtn: {
      padding: 2,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },
    progressContainer: {
      marginBottom: 12,
    },
    progressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    progressText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    pointsBadge: {
      backgroundColor: '#FFFDF0',
      borderWidth: 1,
      borderColor: '#FFF3C2',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    pointsText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.gold,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    progressBarBg: {
      height: 4,
      backgroundColor: colors.backgroundCardAlt,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    badgesRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 12,
      paddingBottom: 2,
    },
    badgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      gap: 4,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    questionCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlass,
      padding: 16,
      marginBottom: 12,
    },
    questionCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    questionIdText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    questionBody: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: 16,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    optionsStack: {
      gap: 8,
      marginBottom: 16,
    },
    optionBase: {
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionNormal: {
      backgroundColor: colors.backgroundCardAlt,
      borderColor: colors.borderGlass,
    },
    optionSelected: {
      backgroundColor: `${colors.primary}0D`,
      borderColor: colors.primary,
    },
    optionCorrect: {
      backgroundColor: colors.correctLight,
      borderColor: colors.correctBorder,
    },
    optionIncorrect: {
      backgroundColor: colors.incorrectLight,
      borderColor: colors.incorrectBorder,
    },
    optionFaded: {
      backgroundColor: colors.backgroundCardAlt,
      borderColor: 'transparent',
      opacity: 0.5,
    },
    optionLeftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    prefixBadge: {
      width: 22,
      height: 22,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
      borderWidth: 1,
    },
    prefixNormal: {
      backgroundColor: '#FFFFFF',
      borderColor: colors.borderGlass,
    },
    prefixSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    prefixCorrect: {
      backgroundColor: colors.correct,
      borderColor: colors.correct,
    },
    prefixIncorrect: {
      backgroundColor: colors.incorrect,
      borderColor: colors.incorrect,
    },
    prefixFaded: {
      backgroundColor: '#FFFFFF',
      borderColor: 'transparent',
    },
    prefixBadgeText: {
      fontSize: 12,
      fontWeight: '800',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    prefixTextNormal: {
      color: colors.textSecondary,
    },
    prefixTextSelected: {
      color: '#FFFFFF',
    },
    prefixTextCorrect: {
      color: '#FFFFFF',
    },
    prefixTextIncorrect: {
      color: '#FFFFFF',
    },
    prefixTextFaded: {
      color: colors.textMuted,
    },
    optionContentText: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
      lineHeight: 18,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    optionTextNormal: {
      color: colors.textPrimary,
    },
    optionTextSelected: {
      color: colors.textPrimary,
    },
    optionTextCorrect: {
      color: colors.correct,
    },
    optionTextIncorrect: {
      color: colors.incorrect,
    },
    optionTextFaded: {
      color: colors.textMuted,
    },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    submitBtnDisabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.6,
    },
    submitBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    hintContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderWidth: 1,
      borderColor: colors.borderGlass,
      borderRadius: 10,
      padding: 14,
      marginBottom: 12,
    },
    hintHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    hintTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    hintTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.gold,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    hintActionBtn: {
      borderWidth: 1,
      borderColor: colors.gold,
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 8,
      backgroundColor: '#FFFFFF',
    },
    hintActionBtnText: {
      fontSize: 12,
      color: colors.gold,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    hintBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 17,
      marginTop: 8,
      fontWeight: '500',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    comparisonBox: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    comparisonCol: {
      flex: 1,
      borderRadius: 8,
      borderWidth: 1,
      padding: 12,
    },
    comparisonLeft: {
      backgroundColor: '#FDF7F7',
      borderColor: '#FBD5D5',
    },
    comparisonRight: {
      backgroundColor: '#F4FBF7',
      borderColor: '#D1F2E0',
    },
    comparisonLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    comparisonSub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginTop: 1,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    comparisonBadge: {
      alignSelf: 'flex-start',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      marginTop: 6,
    },
    comparisonBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    splitContent: {
      flexDirection: 'row',
      flex: 1,
      gap: 16,
      paddingHorizontal: 16,
    },
    leftPane: {
      flex: 1.2,
    },
    rightPane: {
      flex: 1,
      paddingVertical: 16,
    },
    explanationCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderWidth: 1,
      borderColor: colors.borderGlass,
      borderRadius: 10,
      padding: 16,
      flex: 1,
      height: '100%',
    },
    explanationCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderGlass,
      paddingBottom: 8,
      marginBottom: 10,
    },
    explanationCardHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    explanationCardTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    aiTag: {
      backgroundColor: '#FFF2EB',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    aiTagText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    explanationScroll: {
      flex: 1,
    },
    explanationContent: {
      paddingBottom: 10,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      fontWeight: '600',
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    explanationEmptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    },
    explanationEmptyText: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 17,
      maxWidth: 200,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    expHeader: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 10,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    expSubHeader: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginTop: 8,
      marginBottom: 3,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    expParagraph: {
      fontSize: 13,
      color: colors.paragraphText,
      lineHeight: 18,
      marginBottom: 6,
      fontWeight: '500',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    expBulletRow: {
      flexDirection: 'row',
      marginBottom: 4,
      paddingLeft: 2,
    },
    expBulletDot: {
      color: colors.primary,
      fontSize: 12,
      marginRight: 4,
      lineHeight: 14,
    },
    expNumber: {
      color: colors.primary,
      fontSize: 12,
      fontWeight: '800',
      marginRight: 4,
      lineHeight: 14,
    },
    expBulletText: {
      fontSize: 13,
      color: colors.paragraphText,
      lineHeight: 17,
      flex: 1,
      fontWeight: '500',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    expDivider: {
      height: 1,
      backgroundColor: colors.borderGlass,
      marginVertical: 10,
    },
    footerBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.borderGlass,
      backgroundColor: colors.backgroundCard,
      height: Platform.OS === 'ios' ? 76 : 60,
      paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    },
    footerOutlineBtn: {
      borderWidth: 1,
      borderColor: colors.borderGlass,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
    },
    footerOutlineText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    footerFilledBtn: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    footerFilledBtnDisabled: {
      backgroundColor: colors.textMuted,
      opacity: 0.6,
    },
    footerFilledText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    subjectSummaryCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlass,
      padding: 16,
      marginBottom: 20,
    },
    subjectSummaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    subjectSummaryInfo: {
      flex: 1,
    },
    subjectSummaryTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    subjectSummarySub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    quickActionsRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    quickActionBtn: {
      flex: 1,
      borderRadius: 6,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '800',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    chaptersList: {
      gap: 10,
      marginBottom: 24,
    },
    chapterCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.borderGlass,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    chapterCardLeft: {
      flex: 1,
    },
    chapterName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    chapterProgressText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    chapterStartBtn: {
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    chapterStartBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    mockScrollContainer: {
      gap: 12,
      paddingBottom: 6,
    },
    mockTestCard: {
      width: 240,
      backgroundColor: 'rgba(255, 255, 255, 0.75)',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.borderGlass,
      padding: 14,
      justifyContent: 'space-between',
      height: 190,
    },
    mockBadge: {
      alignSelf: 'flex-start',
      backgroundColor: '#FFF9E6',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      marginBottom: 10,
    },
    mockBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.gold,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    mockTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 4,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    mockDesc: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      lineHeight: 16,
      marginBottom: 12,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    mockStartBtn: {
      backgroundColor: colors.gold,
      borderRadius: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      width: '100%',
    },
    mockStartBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recommendTray: {
      gap: 12,
      paddingRight: 20,
    },
    recommendCard: {
      width: 210,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 14,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    recommendIconBubble: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.04)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    recommendBadgeMini: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.04)',
    },
    recommendBadgeMiniText: {
      fontSize: 11,
      fontWeight: '800',
    },
    recommendCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 10,
      lineHeight: 18,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recommendCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    recommendCardFooterText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recommendCardCircleBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Quiz tab styles
    quizHeroCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 16,
      marginBottom: 24,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    quizHeroMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    quizHeroLeftCol: {
      flex: 1.2,
      gap: 6,
    },
    quizHeroCategory: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FF693D',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    quizHeroTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    quizHeroSub: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    quizHeroProgressBox: {
      marginTop: 12,
      gap: 6,
    },
    quizHeroProgressText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    quizHeroProgressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: '#F1F5F9',
      borderRadius: 3,
      overflow: 'hidden',
    },
    quizHeroProgressFill: {
      height: '100%',
      backgroundColor: '#FF693D',
      borderRadius: 3,
    },
    quizHeroRightCol: {
      flex: 0.8,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    quizHeroGraphicWrapper: {
      width: 70,
      height: 70,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    quizHeroCircleBehind: {
      position: 'absolute',
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: 'rgba(255, 105, 61, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 105, 61, 0.15)',
    },
    quizHeroClipboardIcon: {
      position: 'absolute',
      top: 8,
      left: 10,
    },
    quizHeroClockIcon: {
      position: 'absolute',
      bottom: 6,
      right: 6,
    },
    quizHeroBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FF693D',
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 16,
      gap: 4,
    },
    quizHeroBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 12,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    challengeCard: {
      width: 210,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 14,
      justifyContent: 'space-between',
      minHeight: 140,
      position: 'relative',
      overflow: 'hidden',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    challengeBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.04)',
      borderRadius: 4,
      paddingVertical: 2,
      paddingHorizontal: 6,
      marginBottom: 8,
    },
    challengeBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    challengeTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    challengeDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 16,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    challengeCardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    challengeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 4,
      paddingHorizontal: 12,
      gap: 2,
      backgroundColor: '#FFFFFF',
    },
    challengeBtnText: {
      fontWeight: '800',
      fontSize: 11,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    challengeGraphicIcon: {
      position: 'absolute',
      right: -8,
      bottom: -8,
      opacity: 0.9,
    },
    topicQuizContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 24,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    topicQuizRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    topicQuizIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topicQuizInfo: {
      flex: 1,
      marginLeft: 12,
    },
    topicQuizTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    topicQuizMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 1,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    topicQuizStartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#FF693D',
      borderRadius: 14,
      paddingVertical: 4,
      paddingHorizontal: 12,
      gap: 2,
    },
    topicQuizStartBtnText: {
      color: '#FF693D',
      fontWeight: '800',
      fontSize: 11,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    topicQuizDivider: {
      height: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
    },
    // Test tab styles
    testHeroCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 20,
      marginBottom: 24,
      gap: 12,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    testHeroHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    testHeroCategory: {
      fontSize: 12,
      fontWeight: '800',
      color: '#10B981',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testHeroTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
      borderRadius: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    testHeroTimeBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: '#10B981',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testHeroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testHeroSub: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600',
      lineHeight: 18,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testHeroProgressBox: {
      gap: 6,
      marginVertical: 4,
    },
    testHeroProgressText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testHeroProgressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: '#E2E8F0',
      borderRadius: 3,
      overflow: 'hidden',
    },
    testHeroProgressFill: {
      height: '100%',
      backgroundColor: '#10B981',
      borderRadius: 3,
    },
    testHeroBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      backgroundColor: '#10B981',
      borderRadius: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
      gap: 4,
      marginTop: 8,
    },
    testHeroBtnText: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 12,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    testCategoriesGrid: {
      flexDirection: 'column',
      gap: 12,
      marginBottom: 24,
    },
    recentResultsContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 24,
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    recentResultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    recentResultIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recentResultInfo: {
      flex: 1,
      marginLeft: 12,
    },
    recentResultTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recentResultMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recentResultScoreContainer: {
      alignItems: 'flex-end',
      gap: 4,
    },
    recentResultScore: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recentResultViewBtn: {
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
      borderRadius: 10,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    recentResultViewBtnText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    recentResultDivider: {
      height: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.04)',
    },
    performanceInsightsContainer: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 28,
    },
    insightCard: {
      flex: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.45)',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(15, 23, 42, 0.08)',
      padding: 12,
      minHeight: 120,
      justifyContent: 'space-between',
      ...Platform.select({
        web: {
          backdropFilter: 'blur(16px) saturate(120%)',
          boxShadow: 'none',
        },
      }),
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    insightTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    insightVal: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginVertical: 4,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    insightSub: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
      lineHeight: 13,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    // Custom Modal Styles
    customModalLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: '#475569',
      marginTop: 14,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    customModalTabRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 6,
    },
    customModalTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      backgroundColor: '#F8FAFC',
      alignItems: 'center',
      justifyContent: 'center',
    },
    customModalTabActive: {
      borderColor: '#FF693D',
      backgroundColor: 'rgba(255, 105, 61, 0.06)',
    },
    customModalTabText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#64748B',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    customModalTabTextActive: {
      color: '#FF693D',
    },
    customModalLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 14,
      marginBottom: 8,
    },
    customModalLinkText: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FF693D',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    checklistContainer: {
      borderWidth: 1.5,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      maxHeight: 180,
      padding: 8,
      backgroundColor: '#F8FAFC',
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 8,
      gap: 10,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 4,
      borderWidth: 1.5,
      borderColor: '#CBD5E1',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    },
    checkboxChecked: {
      backgroundColor: '#FF693D',
      borderColor: '#FF693D',
    },
    checkboxTick: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '900',
      lineHeight: 14,
    },
    checklistItemText: {
      fontSize: 13,
      fontWeight: '600',
      color: '#334155',
      flex: 1,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    // Completion Modal / Results Styles
    successIconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      width: '100%',
      marginBottom: 20,
    },
    resultItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    resultLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
    resultValue: {
      fontSize: 18,
      fontWeight: '800',
      color: '#1E293B',
      fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    },
  });


