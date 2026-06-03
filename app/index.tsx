import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { getNextAdaptiveQuestion } from '../services/adaptiveEngine';
import { useThemeColors } from '../constants/colors';
import {
  Target,
  ChevronRight,
  Brain,
  Atom,
  FlaskConical,
  Dna,
  Trophy,
  Pencil,
  Flame,
  FileText,
  Award,
  Bell,
  User,
  LogOut,
  Settings as SettingsIcon,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  Heart,
  RotateCw,
  Zap,
  Play,
} from 'lucide-react-native';
import questionsData from '../data/questions.json';
import TopBar from '../components/TopBar';

interface QuestionItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  conceptualTags: string[];
}

export default function HomeDashboard() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  // Progress states
  const {
    username,
    targetScore,
    preferredSubject,
    isOnboarded,
    streak,
    solvedQuestionIds,
    topicHistory,
    weakTopics,
    consecutiveCorrect,
    dailyProgress,
    onboardUser,
    resetProgress,
  } = useProgressStore();

  // Quiz state triggers
  const { setCurrentQuestion, resetSession } = useQuizStore();

  // Onboarding local states
  const [formName, setFormName] = useState('');
  const [formScore, setFormScore] = useState('650');
  const [formSubject, setFormSubject] = useState('Biology');
  const [nameFocused, setNameFocused] = useState(false);
  const [scoreFocused, setScoreFocused] = useState(false);

  // Dropdowns & Popovers local states
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  
  // Preferences settings local states
  const [dailyGoal, setDailyGoal] = useState(20);
  const [editName, setEditName] = useState(username);
  const [editScore, setEditScore] = useState(targetScore.toString());
  const [editSubject, setEditSubject] = useState(preferredSubject);

  // Recommendation refresh trigger counter
  const [recommendRefreshCount, setRecommendRefreshCount] = useState(0);

  // ─── Hero Carousel State ───
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenWidth = Dimensions.get('window').width - 48; // 24px padding * 2

  // Auto scroll timer for Hero Carousel
  useEffect(() => {
    if (!isOnboarded) return;
    carouselTimerRef.current = setInterval(() => {
      setActiveCarouselIndex((prev) => {
        const next = (prev + 1) % 3; // 3 is the number of hero slides
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [isOnboarded]);

  const handleOnboardSubmit = () => {
    if (!formName.trim()) return;
    onboardUser(formName, parseInt(formScore) || 650, formSubject);
    setEditName(formName);
    setEditScore((parseInt(formScore) || 650).toString());
    setEditSubject(formSubject);
  };

  const handleStartPractice = (subjectOverride?: string | null, topicOverride?: string | null, forceMode?: 'adaptive' | 'timed') => {
    resetSession();
    let finalSubject = subjectOverride || null;
    if (!finalSubject && topicOverride) {
      const matchedQ = (questionsData as QuestionItem[]).find(q => q.topic === topicOverride || q.topic.toLowerCase().includes(topicOverride.toLowerCase()));
      if (matchedQ) {
        finalSubject = matchedQ.subject;
      }
    }

    // Generate next adaptive question using the engine
    const nextQ = getNextAdaptiveQuestion(null, null, {
      preferredSubject,
      solvedQuestionIds,
      topicHistory,
      consecutiveCorrect,
      weakTopics,
    }, finalSubject, topicOverride || null);
    
    // Mount to active quiz session and navigate
    setCurrentQuestion(nextQ);
    router.push({
      pathname: '/practice',
      params: forceMode ? { forceMode } : {},
    });
  };

  const handleSaveProfile = () => {
    onboardUser(editName, parseInt(editScore) || 650, editSubject);
    setShowProfileModal(false);
  };

  // Calculate dynamic stats
  const totalSolved = solvedQuestionIds.length;
  let totalAttempts = 0;
  let correctAttempts = 0;
  
  Object.values(topicHistory).forEach((stat) => {
    totalAttempts += stat.total;
    correctAttempts += stat.correct;
  });

  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  
  // Calculate specific subject stats instead of hardcoding
  const getSubjectCount = (subject: string) => {
    const questions = questionsData as QuestionItem[];
    const subQ = questions.filter(q => q.subject === subject);
    const uniqueTopics = new Set(subQ.map(q => q.topic));
    return { questions: subQ.length, chapters: uniqueTopics.size };
  };
  
  const bioStats = getSubjectCount('Biology');
  const phyStats = getSubjectCount('Physics');
  const chemStats = getSubjectCount('Chemistry');

  const getHeatmapColor = (val: number) => {
    if (val === 0) return 'transparent';
    if (val <= 2) return '#FFEFEA'; // Light peach
    if (val <= 5) return '#FFAE99';
    if (val <= 10) return '#FF8261';
    return '#FF693D'; // Primary outrageous orange
  };

  // Generate 3-week daily progress grid (7 days x 3 weeks)
  const generateMiniHeatmap = () => {
    const grid: number[][] = Array.from({ length: 7 }, () => Array(3).fill(0));
    const today = new Date();
    let todayDow = today.getDay() - 1;
    if (todayDow < 0) todayDow = 6;
    
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dailyProgress?.[dateStr] || 0;
      
      const daysFromToday = i;
      let col = 2 - Math.floor((daysFromToday + (6 - todayDow)) / 7);
      let row = (todayDow - (daysFromToday % 7) + 7) % 7;
      
      if (col >= 0 && col < 3 && row >= 0 && row < 7) {
        grid[row][col] = count;
      }
    }
    return grid;
  };
  
  const miniHeatmap = generateMiniHeatmap();

  // Calculate Topics Mastered
  const allUniqueTopics = Array.from(new Set((questionsData as QuestionItem[]).map((q) => q.topic)));
  const totalUniqueTopicsCount = allUniqueTopics.length;
  const masteredTopicsCount = Object.keys(topicHistory).filter((topic) => {
    const stat = topicHistory[topic];
    return stat && stat.total > 0 && (stat.correct / stat.total) >= 0.8;
  }).length;

  const masteredPercentage = totalUniqueTopicsCount > 0 
    ? Math.round((masteredTopicsCount / totalUniqueTopicsCount) * 100) 
    : 0;

  // Get active adaptive context
  const nextQ = getNextAdaptiveQuestion(null, null, {
    preferredSubject,
    solvedQuestionIds,
    topicHistory,
    consecutiveCorrect,
    weakTopics,
  });

  const displaySubject = nextQ?.subject || preferredSubject || 'Physics';
  const displayTopic = nextQ?.topic || 'Thermodynamics';
  const displayDifficulty = nextQ?.difficulty || 'Medium';

  // Dynamic practice progress calculations
  const topicQuestions = (questionsData as QuestionItem[]).filter(q => q.topic === displayTopic);
  const totalTopicQuestions = topicQuestions.length;
  const solvedInTopic = topicQuestions.filter(q => solvedQuestionIds.includes(q.id)).length;
  const remainingQuestions = totalTopicQuestions - solvedInTopic;
  const topicProgress = totalTopicQuestions > 0 ? Math.round((solvedInTopic / totalTopicQuestions) * 100) : 0;

  // Dynamic Greeting based on time of day
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Streak/Goal calculations
  const dailyTarget = dailyGoal;
  const solvedToday = dailyProgress?.[new Date().toISOString().split('T')[0]] || 0;
  const goalProgressPercent = Math.min(100, Math.round((solvedToday / dailyTarget) * 100));

  // Recommended list based on counter (refresh mock simulation)
  const recommendations = [
    [
      {
        title: 'Weak Area Recovery',
        subtitle: weakTopics[0] || 'Electrostatics',
        questions: '8 Questions',
        theme: 'green',
        bgColor: 'rgba(240, 253, 244, 0.45)',
        iconColor: '#10B981',
        icon: <Target color="#10B981" size={16} />,
        action: () => handleStartPractice(null, weakTopics[0] || 'Electrostatics', 'adaptive'),
      },
      {
        title: '15 Minute Quiz',
        subtitle: 'Biology',
        questions: '15 Questions',
        theme: 'orange',
        bgColor: 'rgba(255, 247, 237, 0.45)',
        iconColor: '#FB923C',
        icon: <Clock color="#FB923C" size={16} />,
        action: () => handleStartPractice('Biology', null, 'timed'),
      },
      {
        title: 'Top NEET PYQs',
        subtitle: 'Physics',
        questions: '20 Questions',
        theme: 'blue',
        bgColor: 'rgba(239, 246, 255, 0.45)',
        iconColor: '#3B82F6',
        icon: <FileText color="#3B82F6" size={16} />,
        action: () => handleStartPractice('Physics', null, 'timed'),
      },
    ],
    [
      {
        title: 'Weak Area Recovery',
        subtitle: weakTopics[1] || 'Chemical Bonding',
        questions: '10 Questions',
        theme: 'green',
        bgColor: 'rgba(240, 253, 244, 0.45)',
        iconColor: '#10B981',
        icon: <Target color="#10B981" size={16} />,
        action: () => handleStartPractice(null, weakTopics[1] || 'Chemical Bonding and Molecular Structure', 'adaptive'),
      },
      {
        title: '15 Minute Quiz',
        subtitle: 'Chemistry',
        questions: '12 Questions',
        theme: 'orange',
        bgColor: 'rgba(255, 247, 237, 0.45)',
        iconColor: '#FB923C',
        icon: <Clock color="#FB923C" size={16} />,
        action: () => handleStartPractice('Chemistry', null, 'timed'),
      },
      {
        title: 'Top NEET PYQs',
        subtitle: 'Biology',
        questions: '25 Questions',
        theme: 'blue',
        bgColor: 'rgba(239, 246, 255, 0.45)',
        iconColor: '#3B82F6',
        icon: <FileText color="#3B82F6" size={16} />,
        action: () => handleStartPractice('Biology', null, 'timed'),
      },
    ]
  ];

  const activeRecommendList = recommendations[recommendRefreshCount % recommendations.length];

  return (
    <View style={styles.container}>
      {/* 1. Onboarding Overlay when not onboarded */}
      {!isOnboarded ? (
        <View style={styles.onboardContainer}>
          <View style={styles.glowOverlay} />
          
          <ScrollView contentContainerStyle={styles.onboardScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.iconContainer}>
              <Brain color={colors.primaryLight} size={50} />
            </View>
            
            <Text style={styles.onboardTitle}>Welcome to AdaptiveNEET</Text>
            <Text style={styles.onboardSubtitle}>
              Optimize your revision efficiency. Solve adaptive MCQs and get personalized conceptual feedback.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.label}>What should we call you?</Text>
              <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Target NEET Score (out of 720)</Text>
              <TextInput
                style={[styles.input, scoreFocused && styles.inputFocused]}
                onFocus={() => setScoreFocused(true)}
                onBlur={() => setScoreFocused(false)}
                placeholder="e.g. 680"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={formScore}
                onChangeText={setFormScore}
              />

              <Text style={styles.label}>Preferred Starting Subject</Text>
              <View style={styles.subjectSelector}>
                {['Biology', 'Chemistry', 'Physics'].map((sub) => {
                  const isSelected = formSubject === sub;
                  return (
                    <TouchableOpacity
                      key={sub}
                      style={[
                        styles.subjectButton,
                        isSelected && styles.subjectButtonSelected,
                      ]}
                      onPress={() => setFormSubject(sub)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.subjectButtonText,
                          isSelected && styles.subjectButtonTextSelected,
                        ]}
                      >
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleOnboardSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>Start Preparing</Text>
                <ChevronRight color="#FFF" size={18} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      ) : (
        /* 2. Main Dashboard view */
        <View style={{ flex: 1 }}>
          {/* Top Navigation Header */}
          <TopBar
            title={`${getGreeting()}, ${username || 'Aarav'} 👋`}
            subtitle="Consistency today, success tomorrow."
            onBellPress={() => setShowNotificationsModal(true)}
            onAvatarPress={() => setShowAvatarMenu(!showAvatarMenu)}
          />

          {/* Avatar Menu Dropdown Popover */}
          {showAvatarMenu && (
            <View style={styles.avatarMenuPopover}>
              <TouchableOpacity
                style={styles.popoverItem}
                onPress={() => {
                  setShowAvatarMenu(false);
                  setShowProfileModal(true);
                }}
              >
                <User color={colors.textSecondary} size={15} />
                <Text style={styles.popoverText}>Profile Details</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.popoverItem}
                onPress={() => {
                  setShowAvatarMenu(false);
                  router.push('/settings');
                }}
              >
                <SettingsIcon color={colors.textSecondary} size={15} />
                <Text style={styles.popoverText}>Settings</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.popoverItem}
                onPress={() => {
                  setShowAvatarMenu(false);
                  setShowPreferencesModal(true);
                }}
              >
                <Heart color={colors.textSecondary} size={15} />
                <Text style={styles.popoverText}>Preferences</Text>
              </TouchableOpacity>
              <View style={styles.popoverDivider} />
              <TouchableOpacity
                style={[styles.popoverItem, { marginBottom: 0 }]}
                onPress={() => {
                  setShowAvatarMenu(false);
                  resetProgress();
                }}
              >
                <LogOut color={colors.incorrect} size={15} />
                <Text style={[styles.popoverText, { color: colors.incorrect }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Dashboard ScrollView */}
          <ScrollView
            contentContainerStyle={styles.dashboardScroll}
            showsVerticalScrollIndicator={false}
            onTouchStart={() => {
              if (showAvatarMenu) setShowAvatarMenu(false);
            }}
          >
            {/* 3.1 Hero Auto-Scrolling Carousel */}
            {(() => {
              const heroSlides = [
                {
                  key: 'weekly-challenge',
                  gradient: ['#4F46E5', '#6366F1'],
                  bgColor: '#4F46E5',
                  accentBg: 'rgba(255,255,255,0.15)',
                  badge: 'WEEKLY CHALLENGE',
                  title: 'Weekly NEET Challenge',
                  subtitle: 'Solve 100 Biology questions this week',
                  btnText: 'Join Challenge',
                  btnIcon: <Zap color="#4F46E5" size={14} />,
                  icon: <Trophy color="rgba(255,255,255,0.85)" size={52} />,
                  action: () => handleStartPractice('Biology', null, 'adaptive'),
                },
                {
                  key: 'full-mock',
                  gradient: ['#0F172A', '#1E293B'],
                  bgColor: '#0F172A',
                  accentBg: 'rgba(255,255,255,0.08)',
                  badge: 'MOCK TEST',
                  title: 'NEET Full Mock',
                  subtitle: '180 Questions • 3 Hours • Real Exam Simulation',
                  btnText: 'Start Mock',
                  btnIcon: <Play color="#0F172A" size={14} />,
                  icon: <FileText color="rgba(255,255,255,0.7)" size={52} />,
                  action: () => router.push('/coming_soon'),
                },
                {
                  key: 'continue-practice',
                  gradient: ['#7C3AED', '#8B5CF6'],
                  bgColor: '#7C3AED',
                  accentBg: 'rgba(255,255,255,0.12)',
                  badge: 'CONTINUE',
                  title: `${displaySubject} Practice`,
                  subtitle: `${displayTopic} • ${solvedInTopic}/${totalTopicQuestions} Solved`,
                  btnText: 'Resume',
                  btnIcon: <ChevronRight color="#7C3AED" size={14} />,
                  icon: <Atom color="rgba(255,255,255,0.7)" size={52} />,
                  action: () => handleStartPractice(),
                },
              ];

              const onCarouselScroll = (e: any) => {
                const offsetX = e.nativeEvent.contentOffset.x;
                const idx = Math.round(offsetX / screenWidth);
                if (idx !== activeCarouselIndex && idx >= 0 && idx < heroSlides.length) {
                  setActiveCarouselIndex(idx);
                }
              };

              const resetAutoScroll = () => {
                if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
                carouselTimerRef.current = setInterval(() => {
                  setActiveCarouselIndex((prev) => {
                    const next = (prev + 1) % heroSlides.length;
                    carouselRef.current?.scrollToIndex({ index: next, animated: true });
                    return next;
                  });
                }, 4000);
              };

              return (
                <View style={{ marginBottom: 24 }}>
                  <FlatList
                    ref={carouselRef}
                    data={heroSlides}
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
                    renderItem={({ item }) => (
                      <View style={[styles.heroSlide, { width: screenWidth, backgroundColor: item.bgColor }]}>
                        {/* Background icon watermark */}
                        <View style={styles.heroSlideWatermark}>
                          {item.icon}
                        </View>

                        <View style={styles.heroSlideContent}>
                          <View style={[styles.heroSlideBadge, { backgroundColor: item.accentBg }]}>
                            <Text style={styles.heroSlideBadgeText}>{item.badge}</Text>
                          </View>
                          <Text style={styles.heroSlideTitle}>{item.title}</Text>
                          <Text style={styles.heroSlideSubtitle}>{item.subtitle}</Text>
                          <TouchableOpacity
                            style={styles.heroSlideBtn}
                            onPress={item.action}
                            activeOpacity={0.9}
                          >
                            {item.btnIcon}
                            <Text style={[styles.heroSlideBtnText, { color: item.bgColor }]}>{item.btnText}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  />

                  {/* Dot Indicators */}
                  <View style={styles.carouselDots}>
                    {heroSlides.map((_, idx) => (
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
              );
            })()}

            {/* 3.2 Your Progress — Streak & Stats */}
            <Text style={styles.sectionHeader}>Your Progress</Text>

            {/* Streak Card */}
            <View style={styles.streakCard}>
              <View style={styles.streakCardTopRow}>
                {/* Weekday flame icons */}
                <View style={styles.streakDaysScrollWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.streakDaysScrollContent}
                  >
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                      const isActive = idx < (streak % 7 || 3);
                      return (
                        <View key={idx} style={styles.streakDayCol}>
                          <View style={[
                            styles.streakDayCircle,
                            isActive && styles.streakDayCircleActive,
                          ]}>
                            {isActive ? (
                              <Flame color="#FF693D" fill="#FF693D" size={16} />
                            ) : (
                              <View style={styles.streakDayInactiveDot} />
                            )}
                          </View>
                          <Text style={[
                            styles.streakDayLabel,
                            isActive && styles.streakDayLabelActive,
                          ]}>{day}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                  <View style={styles.streakDaysFadeRight} pointerEvents="none" />
                </View>

                {/* Streak counter badge */}
                <View style={styles.streakCounterBadge}>
                  <Flame color="#FFFFFF" fill="#FFFFFF" size={16} />
                  <Text style={styles.streakCounterVal}>{streak}</Text>
                  <Text style={styles.streakCounterLabel}>Day{'\n'}Streak</Text>
                </View>
              </View>

              {/* Progress bar showing daily goal */}
              <View style={styles.streakProgressRow}>
                <Text style={styles.streakProgressLabel}>Today's Goal</Text>
                <Text style={styles.streakProgressFraction}>{solvedToday}/{dailyTarget}</Text>
              </View>
              <View style={styles.streakProgressBarTrack}>
                <View style={[styles.streakProgressBarFill, { width: `${goalProgressPercent}%` }]} />
              </View>
            </View>

            {/* Stats Row — 3 Mini Cards */}
            <View style={styles.statsRow}>
              {/* Questions Solved Today */}
              <View style={[styles.statMiniCard, { borderLeftColor: '#6366F1' }]}>
                <View style={[styles.statMiniIconBg, { backgroundColor: '#EEF2FF' }]}>
                  <Target color="#6366F1" size={18} />
                </View>
                <Text style={styles.statMiniVal}>{solvedToday}</Text>
                <Text style={styles.statMiniLabel}>Solved Today</Text>
              </View>

              {/* Overall Accuracy */}
              <View style={[styles.statMiniCard, { borderLeftColor: '#10B981' }]}>
                <View style={[styles.statMiniIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <TrendingUp color="#10B981" size={18} />
                </View>
                <Text style={styles.statMiniVal}>{accuracy}%</Text>
                <Text style={styles.statMiniLabel}>Accuracy</Text>
              </View>

              {/* Topics Mastered */}
              <View style={[styles.statMiniCard, { borderLeftColor: '#F59E0B' }]}>
                <View style={[styles.statMiniIconBg, { backgroundColor: '#FFFBEB' }]}>
                  <Trophy color="#F59E0B" size={18} />
                </View>
                <Text style={styles.statMiniVal}>{masteredTopicsCount}</Text>
                <Text style={styles.statMiniLabel}>Mastered</Text>
              </View>
            </View>

            {/* 3.3 Recommended For You */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Recommended For You</Text>
              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => setRecommendRefreshCount(prev => prev + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.refreshBtnText}>Refresh</Text>
                <RotateCw color={colors.primary} size={12} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendTray}
              style={{ marginBottom: 20 }}
            >
              {activeRecommendList.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.recommendCard, { backgroundColor: item.bgColor }]}
                  onPress={item.action}
                  activeOpacity={0.9}
                >
                  <View style={styles.recommendCardHeader}>
                    <View style={styles.recommendIconBubble}>
                      {item.icon}
                    </View>
                    <View style={styles.recommendBadgeMini}>
                      <Text style={[styles.recommendBadgeMiniText, { color: item.iconColor }]}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recommendCardTitle} numberOfLines={2} ellipsizeMode="tail">{item.subtitle}</Text>
                  
                  <View style={styles.recommendCardFooter}>
                    <Text style={styles.recommendCardFooterText}>{item.questions}</Text>
                    <View style={[styles.recommendCardCircleBtn, { backgroundColor: '#FFFFFF', borderColor: `${item.iconColor}40` }]}>
                      <ChevronRight color={item.iconColor} size={12} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* 3.4 Quick Access */}
            <Text style={styles.sectionHeader}>Quick Access</Text>
            <View style={styles.quickAccessRow}>
              {/* Practice */}
              <TouchableOpacity
                style={[styles.quickAccessPill, { backgroundColor: 'rgba(99, 102, 241, 0.05)' }]}
                onPress={() => router.push('/practice')}
                activeOpacity={0.8}
              >
                <Target color="#6366F1" size={20} />
                <Text style={styles.quickAccessPillText}>Practice</Text>
              </TouchableOpacity>

              {/* Quiz */}
              <TouchableOpacity
                style={[styles.quickAccessPill, { backgroundColor: 'rgba(16, 185, 129, 0.05)' }]}
                onPress={() => router.push({ pathname: '/practice', params: { tab: 'timed' } })}
                activeOpacity={0.8}
              >
                <Clock color="#10B981" size={20} />
                <Text style={styles.quickAccessPillText}>Quiz</Text>
              </TouchableOpacity>

              {/* Test */}
              <TouchableOpacity
                style={[styles.quickAccessPill, { backgroundColor: 'rgba(59, 130, 246, 0.05)' }]}
                onPress={() => router.push('/coming_soon')}
                activeOpacity={0.8}
              >
                <FileText color="#3B82F6" size={20} />
                <Text style={styles.quickAccessPillText}>Test</Text>
              </TouchableOpacity>

              {/* Question Bank */}
              <TouchableOpacity
                style={[styles.quickAccessPill, { backgroundColor: 'rgba(249, 115, 22, 0.05)' }]}
                onPress={() => router.push('/question_bank')}
                activeOpacity={0.8}
              >
                <BookOpen color="#F97316" size={20} />
                <Text style={styles.quickAccessPillText}>Question Bank</Text>
              </TouchableOpacity>
            </View>

            {/* 3.5 Recent Activity */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/analytics')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentActivityCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={styles.trendIconBg}>
                  <TrendingUp color="#6366F1" size={16} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.recentActivityTitleText}>
                    Solved {solvedQuestionIds.length} Questions This Week
                  </Text>
                  <Text style={styles.recentActivitySubText}>
                    {accuracy}% Overall Accuracy
                  </Text>
                </View>
                <View style={styles.recentActivityBadge}>
                  <Text style={styles.recentActivityBadgeText}>Active</Text>
                </View>
              </View>

              <View style={styles.activityProgressBarTrack}>
                <View style={[styles.activityProgressBarFill, { width: `${Math.min(100, (accuracy || 0))}%` }]} />
              </View>

              <View style={styles.recentBreakdownList}>
                {Object.keys(topicHistory).length > 0 ? (
                  Object.keys(topicHistory).slice(0, 2).map((topic) => {
                    const stats = topicHistory[topic];
                    return (
                      <View key={topic} style={styles.recentBreakdownItem}>
                        <CheckCircle2 color="#10B981" size={14} />
                        <Text style={styles.recentBreakdownText}>
                          {topic} • <Text style={{ fontWeight: '700' }}>{stats.correct}/{stats.total} correct</Text>
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ paddingVertical: 8 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined }}>No topics solved yet. Start practicing!</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 3.6 Daily Consistency Heatmap */}
            <Text style={styles.sectionHeader}>Consistency Map</Text>
            <View style={styles.heatmapCard}>
              <View style={styles.heatmapCardHeader}>
                <Flame color="#FF693D" size={16} />
                <Text style={styles.heatmapCardTitle}>Last 3 Weeks Activity</Text>
              </View>
              <View style={styles.heatmapMainContainer}>
                {/* Grid heatmap dots */}
                <View style={styles.heatmapRowContainer}>
                  {miniHeatmap.map((row, rIdx) => {
                    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                    return (
                      <View key={rIdx} style={styles.heatmapCol}>
                        <Text style={[styles.heatmapDayText, { marginBottom: 6 }]}>{days[rIdx]}</Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {row.map((val, cIdx) => (
                            <View
                              key={cIdx}
                              style={[styles.heatmapDotSquare, { backgroundColor: getHeatmapColor(val), borderColor: val === 0 ? 'rgba(15, 23, 42, 0.05)' : 'transparent' }]}
                            />
                          ))}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
              <View style={styles.heatmapLegend}>
                <Text style={styles.heatmapLegendText}>Less</Text>
                <View style={[styles.heatmapLegendDot, { backgroundColor: '#E2E8F0' }]} />
                <View style={[styles.heatmapLegendDot, { backgroundColor: '#FFEFEA' }]} />
                <View style={[styles.heatmapLegendDot, { backgroundColor: '#FFAE99' }]} />
                <View style={[styles.heatmapLegendDot, { backgroundColor: '#FF8261' }]} />
                <View style={[styles.heatmapLegendDot, { backgroundColor: '#FF693D' }]} />
                <Text style={styles.heatmapLegendText}>More</Text>
              </View>
            </View>
          </ScrollView>

          {/* Profile Modal */}
          <Modal
            visible={showProfileModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowProfileModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Profile Details</Text>
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>Student Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.modalLabel}>Target score (out of 720)</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    value={editScore}
                    onChangeText={setEditScore}
                    placeholder="e.g. 680"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.modalLabel}>Preferred Subject</Text>
                  <View style={styles.modalSelector}>
                    {['Biology', 'Chemistry', 'Physics'].map((sub) => {
                      const isSelected = editSubject === sub;
                      return (
                        <TouchableOpacity
                          key={sub}
                          style={[styles.modalSelectorBtn, isSelected && styles.modalSelectorBtnActive]}
                          onPress={() => setEditSubject(sub)}
                        >
                          <Text style={[styles.modalSelectorBtnText, isSelected && styles.modalSelectorBtnTextActive]}>
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => setShowProfileModal(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalSaveBtn]}
                    onPress={handleSaveProfile}
                  >
                    <Text style={styles.modalSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Preferences Modal */}
          <Modal
            visible={showPreferencesModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPreferencesModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Study Preferences</Text>
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>Daily Solved Target (Questions)</Text>
                  <View style={styles.goalSelectionRow}>
                    {[10, 20, 50, 100].map((val) => {
                      const isSelected = dailyGoal === val;
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[styles.modalGoalBtn, isSelected && styles.modalGoalBtnActive]}
                          onPress={() => setDailyGoal(val)}
                        >
                          <Text style={[styles.modalSelectorBtnText, isSelected && styles.modalSelectorBtnTextActive]}>
                            {val} Qs
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.goalSelectionDesc}>
                    Setting a higher target helps maintain higher learning focus. Progress trackers reset daily.
                  </Text>
                </View>
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalCancelBtn]}
                    onPress={() => setShowPreferencesModal(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Slate background matching standard Vedantu white theme
  },
  onboardContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },
  glowOverlay: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary + '18',
    ...Platform.select({
      web: { filter: 'blur(80px)' },
    }),
  },
  onboardScroll: {
    padding: 30,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: colors.primary + '15',
    padding: 20,
    borderRadius: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  onboardTitle: {
    color: colors.textPrimary,
    fontSize: 24, // standardized titleLarge
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  onboardSubtitle: {
    color: colors.textSecondary,
    fontSize: 14, // standardized bodyLarge
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
    maxWidth: 320,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13, // standardized bodySmall
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 6,
    color: colors.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14, // standardized bodyLarge
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  inputFocused: {
    borderColor: colors.primaryLight,
  },
  subjectSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 26,
  },
  subjectButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  subjectButtonSelected: {
    backgroundColor: colors.primaryLight + '1F',
    borderColor: colors.primaryLight,
  },
  subjectButtonText: {
    color: colors.textSecondary,
    fontSize: 13, // standardized bodySmall
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subjectButtonTextSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 6,
    gap: 6,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14, // standardized bodyLarge
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  
  // Header Style - Exact Mockup correspondence
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 54 : 24,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  headerGreetingCol: {
    flexDirection: 'column',
  },
  greetingTitle: {
    fontSize: 24, // standardized titleLarge
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  greetingSubtitle: {
    fontSize: 13, // standardized bodySmall
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 61, 0.08)',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF693D',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    borderWidth: 1.5,
    borderColor: colors.borderGlass,
    borderRadius: 20,
    padding: 1,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },

  // Avatar popover dropdown
  avatarMenuPopover: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 105 : 78,
    right: 24,
    width: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 10,
    zIndex: 9999,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 2,
  },
  popoverText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  popoverDivider: {
    height: 1,
    backgroundColor: colors.borderGlass,
    marginVertical: 4,
  },

  // Dashboard Scroll Area
  dashboardScroll: {
    padding: 24,
    paddingBottom: 80,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 18, // standardized titleMedium
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  viewAllText: {
    fontSize: 14, // standardized bodyLarge
    fontWeight: '700',
    color: '#4F46E5', // mockup deep blue/indigo
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },

  // Hero Auto-Scrolling Carousel
  heroSlide: {
    borderRadius: 14,
    padding: 24,
    minHeight: 190,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroSlideWatermark: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    opacity: 0.5,
  },
  heroSlideContent: {
    zIndex: 2,
    maxWidth: '75%',
  },
  heroSlideBadge: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  heroSlideBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  heroSlideTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  heroSlideSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 18,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  heroSlideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
  },
  heroSlideBtnText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  carouselDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 6,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  carouselDotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },

  // Your Progress — Streak Card
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderGlass,
    padding: 16,
    marginBottom: 16,
  },
  streakCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakDaysScrollWrapper: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  streakDaysScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 20,
  },
  streakDaysFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))',
      },
      default: {
        backgroundColor: 'transparent',
      },
    }),
  },
  streakDayCol: {
    alignItems: 'center',
    gap: 4,
  },
  streakDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakDayCircleActive: {
    backgroundColor: '#FFF5F2',
    borderColor: '#FDBA74',
    borderWidth: 2,
  },
  streakDayInactiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  streakDayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  streakDayLabelActive: {
    color: '#FF693D',
    fontWeight: '800',
  },
  streakCounterBadge: {
    backgroundColor: '#FF693D',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    minWidth: 54,
  },
  streakCounterVal: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 24,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  streakCounterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  streakProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  streakProgressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  streakProgressFraction: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  streakProgressBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  streakProgressBarFill: {
    height: '100%',
    backgroundColor: '#FF693D',
    borderRadius: 4,
  },

  // Stats Row — 3 Mini Cards
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statMiniCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderLeftWidth: 3,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(120%)',
        boxShadow: 'none',
      },
    }),
  },
  statMiniIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statMiniVal: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  statMiniLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },

  // Recommended For You
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtnText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '700',
    color: colors.primary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  recommendTray: {
    gap: 12,
    paddingRight: 20,
  },
  recommendCard: {
    width: 210,
    borderRadius: 10,
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
  recommendCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
    fontSize: 11, // standardized caption
    fontWeight: '800',
  },
  recommendCardTitle: {
    fontSize: 14, // standardized titleSmall
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
    fontSize: 13, // standardized bodySmall
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

  // Quick Access - 4 horizontal pills matching mockup
  quickAccessRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  quickAccessPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(120%)',
        boxShadow: 'none',
      },
    }),
  },
  quickAccessPillText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },

  // Recent Activity - Heatmap embedded
  recentActivityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(120%)',
        boxShadow: 'none',
      },
    }),
  },
  recentActivityBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  recentActivityBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  recentBreakdownList: {
    marginTop: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.04)',
    paddingTop: 12,
  },
  recentBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recentBreakdownText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  trendIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentActivityTitleText: {
    fontSize: 14, // standardized bodyLarge
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  recentActivitySubText: {
    fontSize: 12, // standardized caption
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 1,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  activityProgressBarTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginTop: 4,
  },
  activityProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2.5,
  },

  // Standalone Heatmap Card styles
  heatmapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(120%)',
        boxShadow: 'none',
      },
    }),
  },
  heatmapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    width: '100%',
    justifyContent: 'center',
  },
  heatmapCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  heatmapMainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heatmapRowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  heatmapCol: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  heatmapDotSquare: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  heatmapDayText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    width: 24,
    textAlign: 'center',
    marginTop: 8,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
  },
  heatmapLegendText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  heatmapLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },

  // Modal Custom Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16, // standardized titleSmall
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  modalBody: {
    gap: 12,
  },
  modalLabel: {
    fontSize: 12, // standardized caption
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: -4,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    fontSize: 14, // standardized bodyLarge
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  modalSelector: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modalSelectorBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalSelectorBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },
  modalSelectorBtnText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '800',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  modalSelectorBtnTextActive: {
    color: colors.primary,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 20,
  },
  modalBtn: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '800',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  modalSaveBtn: {
    backgroundColor: colors.primary,
  },
  modalSaveBtnText: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },

  // Preference goal styles
  goalSelectionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modalGoalBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalGoalBtnActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },
  goalSelectionDesc: {
    fontSize: 12, // standardized caption
    color: colors.textMuted,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 4,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },

  // Notification lists
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    paddingVertical: 10,
  },
  notifBadgeUnread: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 5,
    marginRight: 8,
  },
  notifContentCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13, // standardized bodySmall
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  notifBody: {
    fontSize: 12, // standardized caption
    color: colors.textSecondary,
    lineHeight: 15,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
});
