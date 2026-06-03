import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgressStore } from '../store/useProgressStore';
import { useThemeColors } from '../constants/colors';
import {
  FileText,
  Target,
  Flame,
  Clock,
  Compass,
  Atom,
  FlaskConical,
  Dna,
  ChevronRight,
  Sparkles,
  Award,
  Trophy,
  HelpCircle,
  TrendingUp,
} from 'lucide-react-native';
import questionsData from '../data/questions.json';
import TopBar from '../components/TopBar';

interface QuestionItem {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
}

export default function ProgressScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { solvedQuestionIds, topicHistory, streak, weakTopics, dailyProgress } = useProgressStore();

  const [timeframe, setTimeframe] = useState<'Last 120 Days' | 'Last 30 Days' | 'Last Year'>('Last 120 Days');
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  // Dynamic statistics calculations
  let totalAttempts = 0;
  let correctAttempts = 0;
  Object.values(topicHistory).forEach((stat) => {
    totalAttempts += stat.total;
    correctAttempts += stat.correct;
  });
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // 1. Stat Card Values (react directly to store, no fallbacks)
  const displaySolved = solvedQuestionIds.length;
  const displayAccuracy = accuracy;
  const displayStreak = streak;
  const displayTime = Math.round(solvedQuestionIds.length * 2 / 60); // approx 2 mins per question

  // 2. Subject progress calculator
  const getSubjectCompletion = (subject: string) => {
    const questions = (questionsData as QuestionItem[]).filter(q => q.subject === subject);
    const solved = questions.filter(q => solvedQuestionIds.includes(q.id));
    
    // Remove mockup defaults, use genuine data only
    let solvedCount = solved.length;
    let totalCount = questions.length;
    let percent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

    return { solved: solvedCount, total: totalCount, percent };
  };

  const physicsComp = getSubjectCompletion('Physics');
  const chemistryComp = getSubjectCompletion('Chemistry');
  const biologyComp = getSubjectCompletion('Biology');

  // 3. Activity Heatmap Grid responsive to timeframe
  const generateHeatmapGrid = () => {
    let weeks = 18; // Default 120 Days
    if (timeframe === 'Last 30 Days') weeks = 5;
    if (timeframe === 'Last Year') weeks = 52;
    
    const grid: number[][] = Array.from({ length: weeks }, () => Array(7).fill(0));
    const today = new Date();
    // Monday = 0, Sunday = 6
    let todayDow = today.getDay() - 1;
    if (todayDow < 0) todayDow = 6;
    
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = dailyProgress?.[dateStr] || 0;
      let val = 0;
      if (count > 0 && count <= 5) val = 1;
      else if (count > 5 && count <= 15) val = 2;
      else if (count > 15 && count <= 30) val = 3;
      else if (count > 30) val = 4;
      
      const daysFromToday = i;
      let col = (weeks - 1) - Math.floor((daysFromToday + (6 - todayDow)) / 7);
      let row = (todayDow - (daysFromToday % 7) + 7) % 7;
      
      if (col >= 0 && col < weeks && row >= 0 && row < 7) {
        grid[col][row] = val;
      }
    }
    return grid;
  };

  const heatmapGrid = generateHeatmapGrid();

  const getMonthLabels = () => {
    let weeks = 18;
    if (timeframe === 'Last 30 Days') weeks = 5;
    if (timeframe === 'Last Year') weeks = 52;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const today = new Date();
    let todayDow = today.getDay() - 1;
    if (todayDow < 0) todayDow = 6;
    let lastMonth = -1;

    for (let i = 0; i < weeks; i++) {
      const daysFromToday = (weeks - 1 - i) * 7 + todayDow;
      const d = new Date(today);
      d.setDate(d.getDate() - daysFromToday);
      const m = d.getMonth();
      if (m !== lastMonth) {
        labels.push({ label: monthNames[m], index: i });
        lastMonth = m;
      }
    }
    return labels;
  };

  const monthLabels = getMonthLabels();
  
  const heatmapWeeksCount = timeframe === 'Last 30 Days' ? 5 : timeframe === 'Last Year' ? 52 : 18;
  const heatmapCellSize = timeframe === 'Last 30 Days' ? 32 : timeframe === 'Last Year' ? 9 : 14;
  const heatmapCellGap = timeframe === 'Last 30 Days' ? 8 : timeframe === 'Last Year' ? 3 : 4;
  const heatmapColWidth = heatmapCellSize + heatmapCellGap;

  const getHeatmapColor = (val: number) => {
    switch (val) {
      case 1: return '#FFEFEA'; // Light peach
      case 2: return '#FFAE99';
      case 3: return '#FF8261';
      case 4: return '#FF693D'; // Primary outrageous orange
      default: return '#FFFFFF'; // Blank white
    }
  };

  // 4. Weak Areas Cards (pre-populate or fallback to mockup if empty)
  const getWeakAreas = () => {
    const list = weakTopics.map((topic) => {
      const stat = topicHistory[topic] || { total: 10, correct: 4 };
      const acc = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 40;
      const count = stat.total > 0 ? stat.total : 60;
      return { name: topic, accuracy: acc, questionsCount: count };
    });

    return list;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopBar
        title="Progress"
        subtitle="Track your preparation. Stay consistent. Crack NEET."
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Horizontal Stats Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topStatsContainer}
        >
          {/* Card 1: Solved */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
                <FileText color="#FF693D" size={16} />
              </View>
              <Text style={styles.statVal}>{displaySolved.toLocaleString()}</Text>
            </View>
            <Text style={styles.statLabel}>Questions Solved</Text>
            <Text style={styles.statTrendGreen}>↑ 18% vs last 7 days</Text>
          </View>

          {/* Card 2: Accuracy */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
                <Target color="#10B981" size={16} />
              </View>
              <Text style={styles.statVal}>{displayAccuracy}%</Text>
            </View>
            <Text style={styles.statLabel}>Overall Accuracy</Text>
            <Text style={styles.statTrendGreen}>↑ 5% vs last 7 days</Text>
          </View>

          {/* Card 3: Streak */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(244, 63, 94, 0.08)' }]}>
                <Flame color="#F43F5E" size={16} />
              </View>
              <Text style={styles.statVal}>{displayStreak}</Text>
            </View>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Text style={styles.statTrendGray}>Best: 28 days 🔥</Text>
          </View>

          {/* Card 4: Time Spent */}
          <View style={styles.statCard}>
            <View style={styles.statCardTopRow}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}>
                <Clock color="#8B5CF6" size={16} />
              </View>
              <Text style={styles.statVal}>{displayTime} hr</Text>
            </View>
            <Text style={styles.statLabel}>Total Time Spent</Text>
            <Text style={styles.statTrendGreen}>↑ 12 hr vs last 7 days</Text>
          </View>
        </ScrollView>

        {/* Activity Calendar Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.cardTitle}>Activity Calendar</Text>
              <HelpCircle size={14} color="#94A3B8" />
            </View>
            <TouchableOpacity 
              style={styles.timeframeSelector}
              onPress={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
            >
              <Text style={styles.timeframeText}>{timeframe}</Text>
              <ChevronRight color={colors.textSecondary} size={14} style={{ transform: [{ rotate: '90deg' }] }} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardSubtitle}>Solve questions daily to build your streak.</Text>

          {/* Dropdown Box */}
          {showTimeframeDropdown && (
            <View style={styles.timeframeDropdown}>
              {(['Last 30 Days', 'Last 120 Days', 'Last Year'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.timeframeDropdownItem}
                  onPress={() => {
                    setTimeframe(opt);
                    setShowTimeframeDropdown(false);
                  }}
                >
                  <Text style={[styles.timeframeDropdownText, timeframe === opt && { color: '#FF693D' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Heatmap Layout Scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.heatmapScrollContainer, timeframe === 'Last 30 Days' && { flexGrow: 1, justifyContent: 'center' }]}>
            <View style={styles.heatmapOuterWrapper}>
              
              {/* Monthly headers */}
              <View style={styles.monthLabelRow}>
                {monthLabels.map((m, idx) => (
                  <Text key={idx} style={[styles.monthLabel, { left: m.index * heatmapColWidth }]}>
                    {m.label}
                  </Text>
                ))}
              </View>

              <View style={styles.heatmapRow}>
                {/* Weekday indicators */}
                <View style={[styles.weekdayColumn, { height: 'auto', justifyContent: 'flex-start', paddingVertical: 0 }]}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <View
                      key={day}
                      style={{
                        height: heatmapCellSize,
                        justifyContent: 'center',
                        marginBottom: idx < 6 ? heatmapCellGap : 0,
                      }}
                    >
                      <Text
                        style={[
                          styles.weekdayText,
                          {
                            fontSize: timeframe === 'Last 30 Days' ? 11 : timeframe === 'Last Year' ? 8 : 9,
                            lineHeight: heatmapCellSize,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Heatmap Grid Columns */}
                <View style={[styles.heatmapGrid, { gap: heatmapCellGap }]}>
                  {heatmapGrid.map((week, wIdx) => (
                    <View key={wIdx} style={[styles.heatmapWeekColumn, { gap: heatmapCellGap }]}>
                      {week.map((cellValue, dIdx) => (
                        <View
                          key={dIdx}
                          style={[
                            styles.heatmapCell,
                            { 
                              width: heatmapCellSize,
                              height: heatmapCellSize,
                              backgroundColor: getHeatmapColor(cellValue),
                              borderColor: cellValue === 0 ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                            }
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Legend and Caption row */}
          <View style={styles.heatmapLegendRow}>
            <Text style={styles.legendCaptionText}>More intensity = More questions solved</Text>
            <View style={styles.legendScale}>
              <Text style={styles.legendScaleText}>0</Text>
              <View style={[styles.legendCell, { backgroundColor: '#FFFFFF', borderColor: 'rgba(15, 23, 42, 0.05)', borderWidth: 1 }]} />
              <View style={[styles.legendCell, { backgroundColor: '#FFEFEA' }]} />
              <View style={[styles.legendCell, { backgroundColor: '#FFAE99' }]} />
              <View style={[styles.legendCell, { backgroundColor: '#FF8261' }]} />
              <View style={[styles.legendCell, { backgroundColor: '#FF693D' }]} />
              <Text style={styles.legendScaleText}>60+</Text>
            </View>
          </View>
        </View>

        {/* Subject Progress */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>Subject Progress</Text>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <Text style={styles.viewDetailedLink}>View Detailed</Text>
            </TouchableOpacity>
          </View>

          {/* Physics */}
          <View style={styles.subjectRow}>
            <View style={[styles.subjectIconBg, { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}>
              <Atom color="#6366F1" size={16} />
            </View>
            <Text style={styles.subjectName}>Physics</Text>
            <Text style={[styles.subjectPercent, { color: '#6366F1' }]}>{physicsComp.percent}%</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${physicsComp.percent}%`, backgroundColor: '#6366F1' }]} />
            </View>
            <Text style={styles.subjectRatio}>{physicsComp.solved.toLocaleString()} / {physicsComp.total.toLocaleString()}</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </View>

          {/* Chemistry */}
          <View style={styles.subjectRow}>
            <View style={[styles.subjectIconBg, { backgroundColor: 'rgba(255, 105, 61, 0.08)' }]}>
              <FlaskConical color="#FF693D" size={16} />
            </View>
            <Text style={styles.subjectName}>Chemistry</Text>
            <Text style={[styles.subjectPercent, { color: '#FF693D' }]}>{chemistryComp.percent}%</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${chemistryComp.percent}%`, backgroundColor: '#FF693D' }]} />
            </View>
            <Text style={styles.subjectRatio}>{chemistryComp.solved.toLocaleString()} / {chemistryComp.total.toLocaleString()}</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </View>

          {/* Biology */}
          <View style={styles.subjectRow}>
            <View style={[styles.subjectIconBg, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <Dna color="#10B981" size={16} />
            </View>
            <Text style={styles.subjectName}>Biology</Text>
            <Text style={[styles.subjectPercent, { color: '#10B981' }]}>{biologyComp.percent}%</Text>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${biologyComp.percent}%`, backgroundColor: '#10B981' }]} />
            </View>
            <Text style={styles.subjectRatio}>{biologyComp.solved.toLocaleString()} / {biologyComp.total.toLocaleString()}</Text>
            <ChevronRight size={16} color="#94A3B8" />
          </View>
        </View>

        {/* Weak Areas */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>Weak Areas</Text>
            <TouchableOpacity onPress={() => router.push('/analytics')}>
              <Text style={styles.viewDetailedLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weakTrayContainer}>
            {getWeakAreas().length > 0 ? getWeakAreas().map((wa) => (
              <View key={wa.name} style={styles.weakAreaCard}>
                <Text style={styles.weakChapterName} numberOfLines={1}>{wa.name}</Text>
                <Text style={styles.weakChapterAccuracy}>{wa.accuracy}% Accuracy</Text>
                <Text style={styles.weakChapterQuestions}>{wa.questionsCount} Questions</Text>
                <TouchableOpacity
                  style={styles.weakCardBtn}
                  onPress={() => router.push({ pathname: '/practice', params: { topicOverride: wa.name, tab: 'adaptive' } })}
                >
                  <Text style={styles.weakCardBtnText}>Practice →</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <View style={{ padding: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined }}>Practice more questions to identify weak areas.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Recent Test Scores */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardTitle}>Recent Test Scores</Text>
            <TouchableOpacity onPress={() => router.push('/coming_soon')}>
              <Text style={styles.viewDetailedLink}>View All Tests</Text>
            </TouchableOpacity>
          </View>

          {/* Empty Test Scores State (no tests integrated yet) */}
          <View style={{ padding: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#94A3B8', fontSize: 13, fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined }}>No mock tests taken recently.</Text>
          </View>
        </View>

        {/* AI Insight Box */}
        <View style={styles.aiInsightCard}>
          <View style={styles.aiInsightLeft}>
            <Sparkles color="#FF693D" size={24} />
          </View>
          <View style={styles.aiInsightContent}>
            <View style={styles.aiInsightBadgeRow}>
              <Text style={styles.aiInsightTitle}>AI Insight</Text>
              <View style={styles.betaBadge}>
                <Text style={styles.betaBadgeText}>Beta</Text>
              </View>
            </View>
            <Text style={styles.aiInsightText}>
              You're performing well in Biology! Focus more on Thermodynamics and Chemical Bonding to improve your overall score.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.exploreBtn}
            onPress={() => router.push('/question_bank')}
          >
            <Text style={styles.exploreBtnText}>Explore Topics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    maxWidth: 280,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconButton: {
    padding: 6,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  topStatsContainer: {
    gap: 12,
    paddingBottom: 18,
  },
  statCard: {
    width: 146,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 14,
    padding: 14,
  },
  statCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  statTrendGreen: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  statTrendGray: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  timeframeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  timeframeDropdown: {
    position: 'absolute',
    top: 42,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 8,
    zIndex: 99,
    width: 130,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  timeframeDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.03)',
  },
  timeframeDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  heatmapScrollContainer: {
    paddingBottom: 10,
  },
  heatmapOuterWrapper: {
    flexDirection: 'column',
    position: 'relative',
  },
  monthLabelRow: {
    flexDirection: 'row',
    height: 18,
    marginBottom: 6,
    position: 'relative',
    marginLeft: 36, // Match weekday offset
  },
  monthLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  heatmapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekdayColumn: {
    width: 30,
    justifyContent: 'space-between',
    height: 122,
    marginRight: 6,
    paddingVertical: 2,
  },
  weekdayText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'right',
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  heatmapWeekColumn: {
    flexDirection: 'column',
    gap: 4,
  },
  heatmapCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
  },
  heatmapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.03)',
    paddingTop: 10,
  },
  legendCaptionText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendScaleText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewDetailedLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366F1',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subjectIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  subjectName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    width: 76,
    marginLeft: 10,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subjectPercent: {
    fontSize: 12,
    fontWeight: '800',
    width: 36,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectRatio: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    width: 76,
    textAlign: 'right',
    marginRight: 6,
  },
  weakTrayContainer: {
    gap: 12,
  },
  weakAreaCard: {
    width: 136,
    backgroundColor: '#FDFBFB',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    padding: 12,
  },
  weakChapterName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  weakChapterAccuracy: {
    fontSize: 11,
    color: '#F43F5E',
    fontWeight: '800',
    marginBottom: 2,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  weakChapterQuestions: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 10,
  },
  weakCardBtn: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
    borderRadius: 6,
    paddingVertical: 5,
    alignItems: 'center',
  },
  weakCardBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F43F5E',
  },
  testScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  testScoreIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testScoreTitleBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  testScoreTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  testScoreDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  testScoreCol: {
    width: 65,
    alignItems: 'center',
  },
  testScoreVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  testScoreValLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },
  testScoreColLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  testDivider: {
    height: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.03)',
  },
  aiInsightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F6',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 61, 0.12)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
  },
  aiInsightLeft: {
    marginRight: 12,
  },
  aiInsightContent: {
    flex: 1,
    marginRight: 12,
  },
  aiInsightBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiInsightTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF693D',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  betaBadge: {
    backgroundColor: 'rgba(255, 105, 61, 0.12)',
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  betaBadgeText: {
    fontSize: 9,
    color: '#FF693D',
    fontWeight: '800',
  },
  aiInsightText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  exploreBtn: {
    backgroundColor: '#FF693D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
