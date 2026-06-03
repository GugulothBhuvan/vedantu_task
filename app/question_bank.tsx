import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore, Question } from '../store/useQuizStore';
import { useThemeColors } from '../constants/colors';
import {
  Search,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  Filter,
  Bookmark,
  Star,
  Bell,
  Mic,
  Languages,
  Trophy,
  SlidersHorizontal,
  FileText,
  Leaf,
  Activity,
  Compass,
  Sprout,
  Zap,
  Magnet,
  Eye,
  Target,
  Globe,
  Flame,
  Sparkles,
  Heart,
  ArrowLeft,
} from 'lucide-react-native';
import questionsData from '../data/questions.json';
import { fetchAIExplanation } from '../services/aiService';
import TopBar from '../components/TopBar';

// Topic to unit information mapper for dynamic NEET unit grouping
const getTopicUnitInfo = (topic: string, subject: string) => {
  if (subject === 'Biology') {
    if (['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom'].includes(topic)) {
      return { unit: 'Unit I', name: 'Diversity in Living World', color: '#10B981', type: 'leaf' };
    }
    if (['Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals'].includes(topic)) {
      return { unit: 'Unit II', name: 'Structural Organisation in Animals', color: '#F97316', type: 'bone' };
    }
    if (['Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division'].includes(topic)) {
      return { unit: 'Unit III', name: 'Cell Structure and Functions', color: '#8B5CF6', type: 'cell' };
    }
    if (['Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development', 'Transport in Plants', 'Mineral Nutrition'].includes(topic)) {
      return { unit: 'Unit IV', name: 'Plant Physiology', color: '#3B82F6', type: 'plant' };
    }
    if (['Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution'].includes(topic)) {
      return { unit: 'Unit V', name: 'Genetics and Evolution', color: '#EAB308', type: 'dna' };
    }
    if (['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health'].includes(topic)) {
      return { unit: 'Unit VI', name: 'Reproduction', color: '#EC4899', type: 'heart' };
    }
    if (['Human Health and Disease', 'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes', 'Biotechnology and its Applications'].includes(topic)) {
      return { unit: 'Unit VII', name: 'Biology and Human Welfare', color: '#14B8A6', type: 'sparkles' };
    }
    return { unit: 'Unit VIII', name: 'Ecology and Environment', color: '#059669', type: 'leaf' };
  }

  if (subject === 'Physics') {
    if (['Electrostatics', 'Capacitance'].includes(topic)) {
      return { unit: 'Unit I', name: 'Electrostatics & Capacitance', color: '#6366F1', type: 'atom' };
    }
    if (['Current Electricity'].includes(topic)) {
      return { unit: 'Unit II', name: 'Current Electricity', color: '#3B82F6', type: 'zap' };
    }
    if (['Magnetism and Moving Charges', 'Electromagnetic Induction and AC'].includes(topic)) {
      return { unit: 'Unit III', name: 'Electromagnetism', color: '#EC4899', type: 'magnet' };
    }
    if (['Ray Optics', 'Wave Optics'].includes(topic)) {
      return { unit: 'Unit IV', name: 'Optics', color: '#F97316', type: 'eye' };
    }
    if (['Modern Physics', 'Semiconductors and Electronics'].includes(topic)) {
      return { unit: 'Unit V', name: 'Modern Physics & Electronics', color: '#8B5CF6', type: 'atom' };
    }
    if (['Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy, and Power'].includes(topic)) {
      return { unit: 'Unit VI', name: 'Mechanics I (Kinematics & Laws)', color: '#06B6D4', type: 'target' };
    }
    if (['Rotational Motion', 'Gravitation'].includes(topic)) {
      return { unit: 'Unit VII', name: 'Mechanics II (Rotation & Gravity)', color: '#10B981', type: 'orbit' };
    }
    return { unit: 'Unit VIII', name: 'Thermal Physics & Waves', color: '#EF4444', type: 'flame' };
  }

  // Chemistry
  if (['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding and Molecular Structure'].includes(topic)) {
    return { unit: 'Unit I', name: 'Inorganic Chemistry & Structure', color: '#8B5CF6', type: 'flask' };
  }
  if (['States of Matter', 'Chemical Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry'].includes(topic)) {
    return { unit: 'Unit II', name: 'Physical Chemistry & Kinetics', color: '#3B82F6', type: 'beaker' };
  }
  if (['General Principles of Isolation of Elements', 'Hydrogen', 'The s-Block Elements', 'The p-Block Elements (Group 13 & 14)', 'The p-Block Elements (Group 15 to 18)', 'The d- and f-Block Elements', 'Coordination Compounds'].includes(topic)) {
    return { unit: 'Unit III', name: 'Coordination & p-Block Elements', color: '#10B981', type: 'flask' };
  }
  return { unit: 'Unit IV', name: 'Organic Chemistry & Biomolecules', color: '#F97316', type: 'dna' };
};

// Generates high-quality offline explanation for study mode instantly
const generateLocalExplanation = (question: Question): string => {
  const correctOptionText = question.options[question.correctOptionIndex];
  
  return `### 💡 Conceptual Explanation
  
#### 📘 Core Concept: **${question.topic}**
This question evaluates core principles of **${question.topic}** under **${question.subject}** (${question.difficulty.toUpperCase()} level).
Key tags associated with this concept: *${question.conceptualTags.join(', ')}*.

---

#### 🔍 Step-by-Step Solution:
1. **Analyze the Question:** The problem statement asks: 
   *"${question.questionText}"*
2. **Identify the Correct Relationship:** 
   The accurate answer corresponds to option **[${String.fromCharCode(65 + question.correctOptionIndex)}]: "${correctOptionText}"**.
3. **NEET Relevance:** For topics like **${question.topic}**, ensure you align the variables correctly, verify units (SI vs. standard units), and check that you haven't made sign convention errors.

---

#### 🧠 NEET Mnemonic / Quick Tip:
> [!TIP]
> **Study Aid:** Double check the conceptual tags: *${question.conceptualTags.join(' & ')}*. Under exam pressure, write out intermediate formulas to minimize simple calculation errors.`;
};

export default function QuestionBankScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { solvedQuestionIds, streak } = useProgressStore();
  const { setCurrentQuestion } = useQuizStore();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Physics' | 'Chemistry' | 'Biology'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'Solved' | 'Unsolved'>('All');
  const [activeCategory, setActiveCategory] = useState<'all' | 'pyq' | 'ncert' | 'saved'>('all');
  
  // High-fidelity UI layout states
  const [viewBy, setViewBy] = useState<'Topics' | 'Questions'>('Topics');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Study Mode states
  const [studyQuestions, setStudyQuestions] = useState<Question[] | null>(null);
  const [studyIndex, setStudyIndex] = useState<number>(0);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const stored = await AsyncStorage.getItem('bookmarked_questions');
        if (stored) {
          setBookmarks(JSON.parse(stored));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookmarks();
  }, []);

  const toggleBookmark = async (id: string) => {
    try {
      let updated = [...bookmarks];
      if (updated.includes(id)) {
        updated = updated.filter(b => b !== id);
      } else {
        updated.push(id);
      }
      setBookmarks(updated);
      await AsyncStorage.setItem('bookmarked_questions', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

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

  const getSubjectIcon = (sub: string) => {
    switch (sub) {
      case 'Physics': return <Atom color={colors.primary} size={14} />;
      case 'Chemistry': return <FlaskConical color="#3B82F6" size={14} />;
      default: return <Dna color="#10B981" size={14} />;
    }
  };

  const getSubjectBorderColor = (sub: string) => {
    switch (sub) {
      case 'Physics': return `${colors.primary}20`;
      case 'Chemistry': return '#3B82F620';
      default: return '#10B98120';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'hard': return colors.incorrect;
      case 'medium': return colors.gold;
      default: return colors.correct;
    }
  };

  const getDifficultyBg = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'hard': return colors.incorrectLight;
      case 'medium': return colors.goldLight;
      default: return colors.correctLight;
    }
  };

  const renderUnitIcon = (type: string, color: string) => {
    switch (type) {
      case 'leaf':
        return <Leaf size={20} color={color} />;
      case 'bone':
        return <Activity size={20} color={color} />;
      case 'cell':
        return <Compass size={20} color={color} />;
      case 'plant':
        return <Sprout size={20} color={color} />;
      case 'dna':
        return <Dna size={20} color={color} />;
      case 'atom':
        return <Atom size={20} color={color} />;
      case 'zap':
        return <Zap size={20} color={color} />;
      case 'magnet':
        return <Magnet size={20} color={color} />;
      case 'eye':
        return <Eye size={20} color={color} />;
      case 'target':
        return <Target size={20} color={color} />;
      case 'orbit':
        return <Globe size={20} color={color} />;
      case 'flame':
        return <Flame size={20} color={color} />;
      case 'flask':
        return <FlaskConical size={20} color={color} />;
      default:
        return <BookOpen size={20} color={color} />;
    }
  };

  // Launch direct practice for the selected question
  const launchQuestionPractice = (q: Question) => {
    setCurrentQuestion(q);
    router.push('/practice');
  };

  // Dynamic Grouping of Questions into Units
  const getGroupedUnits = () => {
    const unitsMap: { [key: string]: {
      id: string;
      unitCode: string;
      unitName: string;
      subject: string;
      totalQuestions: number;
      solvedQuestions: number;
      pyqsCount: number;
      difficulty: 'Easy' | 'Medium' | 'Hard';
      color: string;
      type: string;
      topics: string[];
    }} = {};

    (questionsData as Question[]).forEach((q) => {
      // Filter by selected subject
      if (selectedSubject !== 'All' && q.subject !== selectedSubject) return;

      const info = getTopicUnitInfo(q.topic, q.subject);
      const key = `${q.subject}-${info.unit}`;

      // Check if solved
      const isSolved = solvedQuestionIds.includes(q.id);

      // Check if PYQ
      const isPYQ = q.conceptualTags.some(t => /^(19|20)\d{2}$/.test(t)) || q.id.includes('pyq') || q.questionText.includes('NEET');

      if (!unitsMap[key]) {
        // Match standard difficulties (mockup styled values)
        let diff: 'Easy' | 'Medium' | 'Hard' = 'Medium';
        if (info.unit === 'Unit I') diff = 'Easy';
        else if (info.unit === 'Unit IV') diff = 'Hard';
        else if (info.unit === 'Unit V') diff = 'Medium';

        unitsMap[key] = {
          id: key,
          unitCode: info.unit,
          unitName: info.name,
          subject: q.subject,
          totalQuestions: 0,
          solvedQuestions: 0,
          pyqsCount: 0,
          difficulty: diff,
          color: info.color,
          type: info.type,
          topics: [],
        };
      }

      unitsMap[key].totalQuestions += 1;
      if (isSolved) unitsMap[key].solvedQuestions += 1;
      if (isPYQ) unitsMap[key].pyqsCount += 1;
      if (!unitsMap[key].topics.includes(q.topic)) {
        unitsMap[key].topics.push(q.topic);
      }
    });

    return Object.values(unitsMap).sort((a, b) => {
      if (a.subject !== b.subject) {
        return a.subject.localeCompare(b.subject);
      }
      return a.unitCode.localeCompare(b.unitCode);
    });
  };

  const startStudyMode = (questionsList: Question[], startIndex: number = 0) => {
    setStudyQuestions(questionsList);
    setStudyIndex(startIndex);
  };

  const handleUnitPress = (unit: any) => {
    // Gather all questions belonging to this unit
    const unitQuestions = (questionsData as Question[]).filter((q) => {
      if (q.subject !== unit.subject) return false;
      const info = getTopicUnitInfo(q.topic, q.subject);
      return `${q.subject}-${info.unit}` === unit.id;
    });

    if (unitQuestions.length > 0) {
      startStudyMode(unitQuestions, 0);
    }
  };

  // Launch study mode for the specific question
  const launchQuestionStudy = (q: Question) => {
    // Find all questions in the same topic or unit to build the study list
    const siblingQuestions = (questionsData as Question[]).filter((item) => item.topic === q.topic && item.subject === q.subject);
    const idx = siblingQuestions.findIndex((item) => item.id === q.id);
    
    if (idx !== -1) {
      startStudyMode(siblingQuestions, idx);
    } else {
      startStudyMode([q], 0);
    }
  };

  // Run filters
  const filteredQuestions = (questionsData as Question[]).filter((q) => {
    // 1. Subject filter
    if (selectedSubject !== 'All' && q.subject !== selectedSubject) return false;

    // 2. Unit filter
    if (selectedUnitId) {
      const info = getTopicUnitInfo(q.topic, q.subject);
      const key = `${q.subject}-${info.unit}`;
      if (key !== selectedUnitId) return false;
    }

    // 3. Search Query
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      const matchText = q.questionText.toLowerCase().includes(query);
      const matchTopic = q.topic.toLowerCase().includes(query);
      if (!matchText && !matchTopic) return false;
    }

    // 4. Difficulty filter
    if (selectedDifficulty !== 'All' && q.difficulty.toLowerCase() !== selectedDifficulty.toLowerCase()) return false;

    // 5. Status filter
    const isSolved = solvedQuestionIds.includes(q.id);
    if (selectedStatus === 'Solved' && !isSolved) return false;
    if (selectedStatus === 'Unsolved' && isSolved) return false;

    // 6. Category filter preset (PYQ, NCERT, Saved)
    if (activeCategory === 'pyq') {
      const hasYear = q.conceptualTags.some(t => /^(19|20)\d{2}$/.test(t)) || q.id.includes('pyq') || q.questionText.includes('NEET');
      if (!hasYear) return false;
      if (selectedYear !== 'All') {
        const yearMatch = q.conceptualTags.includes(selectedYear) || q.questionText.includes(selectedYear);
        if (!yearMatch) return false;
      }
    } else if (activeCategory === 'ncert') {
      const isNCERT = q.conceptualTags.some(t => t.toLowerCase().includes('ncert')) || q.topic.toLowerCase().includes('ncert');
      if (!isNCERT) return false;
    } else if (activeCategory === 'saved') {
      if (!bookmarks.includes(q.id)) return false;
    }

    return true;
  });

  // Recently Practiced list builder
  const getRecentlyPracticed = (): Question[] => {
    // Try to gather questions that are solved in the progress store
    const solved = (questionsData as Question[]).filter(q => solvedQuestionIds.includes(q.id));
    if (solved.length >= 3) {
      return solved.slice(0, 5);
    }
    
    // Fallback to high-quality mockup aligned samples if solved history is empty
    return [
      {
        id: 'bio_sample_1',
        subject: 'Biology',
        topic: 'Animal Kingdom',
        difficulty: 'easy',
        questionText: 'Which of the following is not a characteristic of phylum Arthropoda?',
        options: ['Chitinous exoskeleton', 'Metameric segmentation', 'Jointed appendages', 'Parapodia'],
        correctOptionIndex: 3,
        conceptualTags: ['NEET 2022', 'Arthropoda', 'Characteristics']
      },
      {
        id: 'bio_sample_2',
        subject: 'Biology',
        topic: 'Transport in Plants',
        difficulty: 'medium',
        questionText: 'The permeability of water through a partially permeable membrane is called osmosis. It depends on:',
        options: ['Concentration gradient', 'Pressure gradient', 'Both gradient and pressure', 'None of these'],
        correctOptionIndex: 2,
        conceptualTags: ['NEET 2021', 'Osmosis', 'Plant Water Relations']
      },
      {
        id: 'chem_sample_1',
        subject: 'Chemistry',
        topic: 'Chemical Bonding and Molecular Structure',
        difficulty: 'hard',
        questionText: 'Identify the incorrect statement regarding sp hybridization.',
        options: ['The orbitals are oriented at 180 degrees', 'It has 50% s character', 'BeCl2 is an example', 'It has a tetrahedral geometry'],
        correctOptionIndex: 3,
        conceptualTags: ['NEET 2020', 'Hybridization', 'Chemical Bonding']
      }
    ] as Question[];
  };

  const isAllFilterDefault = activeCategory === 'all' && selectedStatus === 'All' && selectedDifficulty === 'All' && selectedYear === 'All' && !selectedUnitId;

  if (studyQuestions !== null && studyQuestions[studyIndex]) {
    const q = studyQuestions[studyIndex];
    const diffColor = getDifficultyColor(q.difficulty);
    const diffBg = getDifficultyBg(q.difficulty);
    const isSaved = bookmarks.includes(q.id);

    return (
      <View style={styles.studyContainer}>
        {/* Study Header */}
        <View style={styles.studyHeader}>
          <TouchableOpacity
            style={styles.studyBackBtn}
            onPress={() => setStudyQuestions(null)}
            activeOpacity={0.7}
          >
            <ArrowLeft color={colors.textSecondary} size={20} />
          </TouchableOpacity>
          <View style={styles.studyHeaderTitleBox}>
            <Text style={styles.studyHeaderTitle} numberOfLines={1}>{q.topic}</Text>
            <Text style={styles.studyHeaderSubtitle}>{q.subject} • Study Mode</Text>
          </View>
          <TouchableOpacity
            onPress={() => toggleBookmark(q.id)}
            style={styles.studyBookmarkBtn}
          >
            <Bookmark
              color={isSaved ? colors.gold : colors.textSecondary}
              fill={isSaved ? colors.gold : 'none'}
              size={20}
            />
          </TouchableOpacity>
        </View>

        {/* Study Content Body */}
        <ScrollView style={styles.studyScroll} contentContainerStyle={styles.studyScrollContent} showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.studyProgressContainer}>
            <View style={styles.studyProgressHeader}>
              <Text style={styles.studyProgressText}>Question {studyIndex + 1} of {studyQuestions.length}</Text>
            </View>
            <View style={styles.studyProgressBarBg}>
              <View
                style={[
                  styles.studyProgressBarFill,
                  { width: `${((studyIndex + 1) / studyQuestions.length) * 100}%` }
                ]}
              />
            </View>
          </View>

          {/* Badges */}
          <View style={styles.studyBadgesRow}>
            <View style={[styles.studyBadgeItem, { backgroundColor: `${getTopicUnitInfo(q.topic, q.subject).color}15` }]}>
              <BookOpen color={getTopicUnitInfo(q.topic, q.subject).color} size={13} />
              <Text style={[styles.studyBadgeText, { color: getTopicUnitInfo(q.topic, q.subject).color }]}>
                {getTopicUnitInfo(q.topic, q.subject).unit}
              </Text>
            </View>
            <View style={[styles.studyBadgeItem, { backgroundColor: `${diffBg}` }]}>
              <Text style={[styles.studyBadgeText, { color: diffColor, fontWeight: '700' }]}>
                {q.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Question Card */}
          <View style={styles.studyQuestionCard}>
            <Text style={styles.studyQuestionText}>{q.questionText}</Text>

            {/* Options List - Answer is pre-selected and highlighted in green (read-only) */}
            <View style={styles.studyOptionsStack}>
              {q.options.map((option, index) => {
                const isCorrect = q.correctOptionIndex === index;
                const alphabet = String.fromCharCode(65 + index);

                let optionStyle = styles.studyOptionNormal;
                let badgeStyle = styles.studyPrefixNormal;
                let badgeTextStyle = styles.studyPrefixTextNormal;
                let optionTextStyle = styles.studyOptionTextNormal;
                let rightIcon = null;

                if (isCorrect) {
                  optionStyle = styles.studyOptionCorrect;
                  badgeStyle = styles.studyPrefixCorrect;
                  badgeTextStyle = styles.studyPrefixTextCorrect;
                  optionTextStyle = styles.studyOptionTextCorrect;
                  rightIcon = <CheckCircle2 color={colors.correct} size={20} />;
                } else {
                  optionStyle = styles.studyOptionDisabled;
                  badgeStyle = styles.studyPrefixDisabled;
                  badgeTextStyle = styles.studyPrefixTextDisabled;
                  optionTextStyle = styles.studyOptionTextDisabled;
                }

                return (
                  <View key={index} style={[styles.studyOptionBase, optionStyle]}>
                    <View style={styles.studyOptionLeft}>
                      <View style={[styles.studyPrefixBadge, badgeStyle]}>
                        <Text style={[styles.studyPrefixBadgeText, badgeTextStyle]}>{alphabet}</Text>
                      </View>
                      <Text style={[styles.studyOptionContentText, optionTextStyle]}>{option}</Text>
                    </View>
                    {rightIcon}
                  </View>
                );
              })}
            </View>
          </View>

          {/* AI Explanation Card */}
          <View style={styles.studyExplanationCard}>
            <View style={styles.studyExpCardHeader}>
              <View style={styles.studyExpHeaderLeft}>
                <Compass color="#6366F1" size={18} />
                <Text style={styles.studyExpTitle}>Conceptual Explanation</Text>
              </View>
              <View style={styles.studyExpAITag}>
                <Text style={styles.studyExpAIText}>EXPLANATION</Text>
              </View>
            </View>
            
            <View style={styles.studyExpContent}>
              {renderFormattedExplanation(generateLocalExplanation(q))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Navigation Bar */}
        <View style={styles.studyFooterBar}>
          <TouchableOpacity
            style={[styles.studyFooterBtn, studyIndex === 0 && styles.studyFooterBtnDisabled]}
            disabled={studyIndex === 0}
            onPress={() => setStudyIndex(studyIndex - 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.studyFooterBtnText, studyIndex === 0 && styles.studyFooterBtnTextDisabled]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.studyFooterFilledBtn]}
            onPress={() => {
              if (studyIndex < studyQuestions.length - 1) {
                setStudyIndex(studyIndex + 1);
              } else {
                setStudyQuestions(null); // Finish study and go back
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.studyFooterFilledText}>
              {studyIndex < studyQuestions.length - 1 ? 'Next Question' : 'Finish Session'}
            </Text>
            <ChevronRight color="#FFFFFF" size={16} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <TopBar
        title="Question Bank"
        subtitle="Explore and practice from the best NEET question bank"
        onBellPress={() => setShowNotificationsModal(true)}
      />

      {/* Main Body */}
      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        
        {/* Search & Action Bar Row */}
        <View style={styles.searchRowContainer}>
          <View style={styles.searchContainer}>
            <Search color={colors.textMuted} size={18} style={styles.searchLeftIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics, chapters, questions or keywords..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim().length > 0 && viewBy === 'Topics') {
                  setViewBy('Questions');
                }
              }}
            />
            <TouchableOpacity style={styles.searchMicIcon}>
              <Mic color={colors.textMuted} size={18} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.searchUtilityBtn}>
            <Languages color={colors.textPrimary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.searchUtilityBtn}>
            <Trophy color={colors.textPrimary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.searchUtilityBtn, !isAllFilterDefault && { backgroundColor: `${colors.primary}15` }]}
            onPress={() => setShowFiltersPanel(!showFiltersPanel)}
            activeOpacity={0.7}
          >
            <SlidersHorizontal color={!isAllFilterDefault ? colors.primary : colors.textPrimary} size={18} />
            {!isAllFilterDefault && <View style={styles.headerIconBadgeDot} />}
          </TouchableOpacity>
        </View>

        {/* Subjects Selector tabs */}
        <View style={styles.tabsOuterContainer}>
          {(['All', 'Physics', 'Chemistry', 'Biology'] as const).map((sub) => {
            const isSelected = selectedSubject === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[styles.tabButton, isSelected && styles.tabButtonActive]}
                onPress={() => {
                  setSelectedSubject(sub);
                  setSelectedUnitId(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filter Pills Tray */}
        <View style={styles.filterPillsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsContainer}
          >
            {/* All Questions Pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                isAllFilterDefault && styles.filterPillActiveAll
              ]}
              onPress={() => {
                setActiveCategory('all');
                setSelectedStatus('All');
                setSelectedDifficulty('All');
                setSelectedYear('All');
                setSelectedUnitId(null);
              }}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={14} color={isAllFilterDefault ? '#FFF' : '#6366F1'} />
              <Text style={[styles.filterPillText, isAllFilterDefault && styles.filterPillTextActiveAll]}>
                All Questions
              </Text>
            </TouchableOpacity>

            {/* Standalone Filter Toggle icon */}
            <TouchableOpacity
              style={[styles.filterIconOnlyBtn, showFiltersPanel && styles.filterIconOnlyBtnActive]}
              onPress={() => setShowFiltersPanel(!showFiltersPanel)}
              activeOpacity={0.8}
            >
              <Filter size={14} color={showFiltersPanel ? '#6366F1' : '#64748B'} />
            </TouchableOpacity>

            {/* Unsolved Pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedStatus === 'Unsolved' && styles.filterPillActiveUnsolved
              ]}
              onPress={() => setSelectedStatus(selectedStatus === 'Unsolved' ? 'All' : 'Unsolved')}
              activeOpacity={0.8}
            >
              <View style={[styles.pillEmptyCircle, selectedStatus === 'Unsolved' && styles.pillEmptyCircleActive]} />
              <Text style={[styles.filterPillText, selectedStatus === 'Unsolved' && styles.filterPillTextActiveUnsolved]}>
                Unsolved
              </Text>
            </TouchableOpacity>

            {/* Solved Pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                selectedStatus === 'Solved' && styles.filterPillActiveSolved
              ]}
              onPress={() => setSelectedStatus(selectedStatus === 'Solved' ? 'All' : 'Solved')}
              activeOpacity={0.8}
            >
              <CheckCircle2 size={14} color={selectedStatus === 'Solved' ? '#10B981' : '#64748B'} />
              <Text style={[styles.filterPillText, selectedStatus === 'Solved' && styles.filterPillTextActiveSolved]}>
                Solved
              </Text>
            </TouchableOpacity>

            {/* Bookmarked Pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                activeCategory === 'saved' && styles.filterPillActiveSaved
              ]}
              onPress={() => setActiveCategory(activeCategory === 'saved' ? 'all' : 'saved')}
              activeOpacity={0.8}
            >
              <Bookmark size={14} color={activeCategory === 'saved' ? colors.gold : '#64748B'} fill={activeCategory === 'saved' ? colors.gold : 'transparent'} />
              <Text style={[styles.filterPillText, activeCategory === 'saved' && styles.filterPillTextActiveSaved]}>
                Bookmarked
              </Text>
            </TouchableOpacity>

            {/* Filters Dropdown/Expand Pill */}
            <TouchableOpacity
              style={[
                styles.filterPill,
                showFiltersPanel && styles.filterPillActivePanelToggle
              ]}
              onPress={() => setShowFiltersPanel(!showFiltersPanel)}
              activeOpacity={0.8}
            >
              <SlidersHorizontal size={14} color={showFiltersPanel ? '#FFF' : '#64748B'} />
              <Text style={[styles.filterPillText, showFiltersPanel && styles.filterPillTextActivePanelToggle]}>
                Filters
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Collapsible Filters Drawer */}
        {showFiltersPanel && (
          <View style={styles.expandedFiltersContainer}>
            {/* Difficulty Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <View style={styles.filterPillsRow}>
                {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    style={[
                      styles.filterSubPill,
                      selectedDifficulty === diff && styles.filterSubPillActive
                    ]}
                    onPress={() => setSelectedDifficulty(diff)}
                  >
                    <Text style={[styles.filterSubPillText, selectedDifficulty === diff && styles.filterSubPillTextActive]}>
                      {diff}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Preset Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterPillsRow}>
                {(['all', 'pyq', 'ncert'] as const).map((cat) => {
                  const label = cat === 'all' ? 'All Questions' : cat === 'pyq' ? 'PYQs' : 'NCERT-Based';
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.filterSubPill,
                        activeCategory === cat && styles.filterSubPillActive
                      ]}
                      onPress={() => {
                        setActiveCategory(cat);
                        if (cat !== 'pyq') setSelectedYear('All');
                      }}
                    >
                      <Text style={[styles.filterSubPillText, activeCategory === cat && styles.filterSubPillTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Year Filter (only if PYQ is selected) */}
            {activeCategory === 'pyq' && (
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>NEET Year</Text>
                <View style={styles.filterPillsRow}>
                  {(['All', '2024', '2023', '2022', '2021', '2020'] as const).map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={[
                        styles.filterSubPill,
                        selectedYear === yr && styles.filterSubPillActive
                      ]}
                      onPress={() => setSelectedYear(yr)}
                    >
                      <Text style={[styles.filterSubPillText, selectedYear === yr && styles.filterSubPillTextActive]}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Reset Button */}
            <TouchableOpacity
              style={styles.resetFiltersBtn}
              onPress={() => {
                setActiveCategory('all');
                setSelectedStatus('All');
                setSelectedDifficulty('All');
                setSelectedYear('All');
                setSelectedUnitId(null);
                setShowFiltersPanel(false);
              }}
            >
              <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Selected Unit Indicator */}
        {selectedUnitId && (
          <View style={styles.activeUnitBanner}>
            <Text style={styles.activeUnitBannerText}>
              Filtering Unit: <Text style={styles.boldText}>{getGroupedUnits().find(u => u.id === selectedUnitId)?.unitName || selectedUnitId}</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setSelectedUnitId(null)}
              style={styles.clearUnitBtn}
            >
              <Text style={styles.clearUnitBtnText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section Header with Segment Toggle */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {viewBy === 'Topics' ? 'Topics / Chapters' : 'Questions List'}
          </Text>
          <View style={styles.viewByToggle}>
            <TouchableOpacity
              style={[styles.viewByBtn, viewBy === 'Topics' && styles.viewByBtnActive]}
              onPress={() => setViewBy('Topics')}
            >
              <Text style={[styles.viewByBtnText, viewBy === 'Topics' && styles.viewByBtnTextActive]}>
                Topics
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewByBtn, viewBy === 'Questions' && styles.viewByBtnActive]}
              onPress={() => setViewBy('Questions')}
            >
              <Text style={[styles.viewByBtnText, viewBy === 'Questions' && styles.viewByBtnTextActive]}>
                Questions
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main List Render Branch */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : viewBy === 'Topics' ? (
          /* Topics/Chapters list */
          <View style={styles.topicsListContainer}>
            {getGroupedUnits().map((unit) => {
              const percent = unit.totalQuestions > 0 ? Math.round((unit.solvedQuestions / unit.totalQuestions) * 100) : 0;
              const diffColor = getDifficultyColor(unit.difficulty);
              const diffBg = getDifficultyBg(unit.difficulty);

              return (
                <TouchableOpacity
                  key={unit.id}
                  style={styles.unitCard}
                  onPress={() => handleUnitPress(unit)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.unitIconContainer, { backgroundColor: `${unit.color}10` }]}>
                    {renderUnitIcon(unit.type, unit.color)}
                  </View>

                  <View style={styles.unitContent}>
                    <Text style={styles.unitTitle} numberOfLines={1}>{unit.unitName}</Text>
                    <Text style={styles.unitSubtitle}>{unit.subject} • {unit.unitCode}</Text>
                    
                    <View style={styles.unitStatsRow}>
                      <View style={styles.unitStatItem}>
                        <FileText size={12} color="#94A3B8" />
                        <Text style={styles.unitStatText}>{unit.totalQuestions} Questions</Text>
                      </View>
                      <View style={styles.unitStatItem}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.unitStatText}>{unit.solvedQuestions} Solved ({percent}%)</Text>
                      </View>
                      <View style={styles.unitStatItem}>
                        <Star size={12} color="#D97706" fill="#D97706" />
                        <Text style={styles.unitStatText}>{unit.pyqsCount} PYQs</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.unitRight}>
                    <View style={[styles.difficultyBadge, { backgroundColor: diffBg }]}>
                      <Text style={[styles.difficultyBadgeText, { color: diffColor }]}>
                        {unit.difficulty}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          /* Plain Question Cards list */
          <View style={styles.questionsListContainer}>
            {filteredQuestions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <HelpCircle color={colors.textMuted} size={40} />
                <Text style={styles.emptyTitle}>No matching questions</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your filters or search query.</Text>
              </View>
            ) : (
              filteredQuestions.map((q) => {
                const isSolved = solvedQuestionIds.includes(q.id);
                const isSaved = bookmarks.includes(q.id);
                const subBorder = getSubjectBorderColor(q.subject);
                const diffColor = getDifficultyColor(q.difficulty);
                const diffBg = getDifficultyBg(q.difficulty);

                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.questionCard, { borderColor: subBorder }]}
                    onPress={() => launchQuestionStudy(q)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        {isSolved ? (
                          <CheckCircle2 color={colors.correct} size={15} style={{ marginRight: 6 }} />
                        ) : (
                          <View style={styles.unsolvedCircle} />
                        )}
                        <View style={styles.tagRow}>
                          <View style={styles.subjectBadge}>
                            {getSubjectIcon(q.subject)}
                            <Text style={styles.subjectBadgeText}>{q.subject}</Text>
                          </View>
                          <Text style={styles.topicBadgeText}>{q.topic}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {isSaved && <Bookmark color={colors.gold} fill={colors.gold} size={12} />}
                        <View style={[styles.difficultyBadge, { backgroundColor: diffBg }]}>
                          <Text style={[styles.difficultyBadgeText, { color: diffColor }]}>
                            {q.difficulty.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    <Text style={styles.questionTextPreview} numberOfLines={2}>
                      {q.questionText}
                    </Text>

                    <View style={styles.cardActionRow}>
                      <Text style={styles.cardActionText}>View Explanation</Text>
                      <ChevronRight color={colors.primary} size={12} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Recently Practiced Section (only in Topics view) */}
        {viewBy === 'Topics' && !isLoading && (
          <View style={styles.recentPracticedContainer}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentTitle}>Recently Practiced</Text>
              <TouchableOpacity onPress={() => setViewBy('Questions')}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {getRecentlyPracticed().map((q) => {
              const isSaved = bookmarks.includes(q.id);
              const diffColor = getDifficultyColor(q.difficulty);
              const diffBg = getDifficultyBg(q.difficulty);
              
              // Bubble theme based on difficulty
              let qBgColor = 'rgba(16, 185, 129, 0.1)';
              let qTextColor = '#10B981';
              if (q.difficulty.toLowerCase() === 'medium') {
                qBgColor = 'rgba(249, 115, 22, 0.1)';
                qTextColor = '#F97316';
              } else if (q.difficulty.toLowerCase() === 'hard') {
                qBgColor = 'rgba(244, 63, 94, 0.1)';
                qTextColor = '#F43F5E';
              }

              return (
                <View key={q.id} style={styles.recentQuestionCard}>
                  {/* Q Icon Bubble */}
                  <View style={[styles.qBubble, { backgroundColor: qBgColor }]}>
                    <Text style={[styles.qBubbleText, { color: qTextColor }]}>Q</Text>
                  </View>

                  {/* Question and details */}
                  <View style={styles.recentQContent}>
                    <Text style={styles.recentQText} numberOfLines={2}>
                      {q.questionText}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {q.conceptualTags.find(t => /^(19|20)\d{2}$/.test(t)) || q.id.includes('pyq') || q.questionText.includes('NEET') ? q.conceptualTags[0] || 'NEET' : 'NEET'} •{' '}
                      <Text style={{ color: diffColor, fontWeight: '700' }}>
                        {q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}
                      </Text>{' '}
                      • {q.options.length} Options • +4 / -1
                    </Text>
                  </View>

                  {/* Practice action & bookmark */}
                  <View style={styles.recentActions}>
                    <TouchableOpacity 
                      onPress={() => toggleBookmark(q.id)}
                      style={styles.bookmarkActionBtn}
                    >
                      <Bookmark 
                        size={18} 
                        color={isSaved ? colors.gold : '#94A3B8'} 
                        fill={isSaved ? colors.gold : 'transparent'} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.practiceBtn}
                      onPress={() => launchQuestionStudy(q)}
                    >
                      <Text style={styles.practiceBtnText}>Study</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
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
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF693D',
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
  headerIconButton: {
    padding: 6,
    position: 'relative',
  },
  headerIconBadgeDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
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
  mainScroll: {
    paddingBottom: 40,
  },
  searchRowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchLeftIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    height: '100%',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  searchMicIcon: {
    padding: 4,
  },
  searchUtilityBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsOuterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  tabButton: {
    paddingVertical: 12,
    alignItems: 'center',
    flex: 1,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  tabTextActive: {
    color: '#6366F1',
    fontWeight: '700',
  },
  filterPillsWrapper: {
    marginBottom: 8,
  },
  filterPillsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterPillActiveAll: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  filterPillTextActiveAll: {
    color: '#FFFFFF',
  },
  filterIconOnlyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconOnlyBtnActive: {
    borderColor: '#6366F1',
  },
  filterPillActiveUnsolved: {
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
  },
  filterPillTextActiveUnsolved: {
    color: '#1E293B',
  },
  pillEmptyCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#64748B',
  },
  pillEmptyCircleActive: {
    borderColor: '#1E293B',
  },
  filterPillActiveSolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  filterPillTextActiveSolved: {
    color: '#10B981',
  },
  filterPillActiveSaved: {
    backgroundColor: 'rgba(217, 119, 6, 0.08)',
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  filterPillTextActiveSaved: {
    color: '#D97706',
  },
  filterPillActivePanelToggle: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterPillTextActivePanelToggle: {
    color: '#FFFFFF',
  },
  expandedFiltersContainer: {
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    gap: 12,
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterSubPill: {
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
  },
  filterSubPillActive: {
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  filterSubPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterSubPillTextActive: {
    color: '#6366F1',
  },
  resetFiltersBtn: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.15)',
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F43F5E',
  },
  activeUnitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  activeUnitBannerText: {
    fontSize: 12,
    color: '#6366F1',
  },
  clearUnitBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  clearUnitBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366F1',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  viewByToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 8,
    padding: 3,
  },
  viewByBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewByBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  viewByBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  viewByBtnTextActive: {
    color: '#6366F1',
    fontWeight: '800',
  },
  topicsListContainer: {
    paddingHorizontal: 20,
  },
  unitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
    padding: 16,
    marginBottom: 12,
  },
  unitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  unitContent: {
    flex: 1,
  },
  unitTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  unitSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  unitStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  unitStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  unitStatText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  unitRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  questionsListContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  loadingContainer: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 50,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unsolvedCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginRight: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  subjectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  subjectBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  topicBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  difficultyBadge: {
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  questionTextPreview: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
  },
  cardActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  recentPracticedContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366F1',
  },
  recentQuestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.05)',
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  qBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  qBubbleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  recentQContent: {
    flex: 1,
    marginRight: 8,
  },
  recentQText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  recentMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  recentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkActionBtn: {
    padding: 6,
  },
  practiceBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  practiceBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  boldText: {
    fontWeight: '800',
    color: '#1E293B',
  },
  
  // Study Mode Styles
  studyContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  studyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingTop: Platform.OS === 'ios' ? 36 : 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    backgroundColor: '#FFFFFF',
  },
  studyBackBtn: {
    padding: 6,
  },
  studyHeaderTitleBox: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  studyHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyHeaderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyBookmarkBtn: {
    padding: 6,
  },
  studyScroll: {
    flex: 1,
  },
  studyScrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  studyProgressContainer: {
    marginBottom: 16,
  },
  studyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  studyProgressText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyProgressBarBg: {
    height: 6,
    backgroundColor: colors.backgroundCardAlt,
    borderRadius: 3,
    overflow: 'hidden',
  },
  studyProgressBarFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  studyBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  studyBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 4,
  },
  studyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  studyQuestionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyOptionsStack: {
    gap: 10,
  },
  studyOptionBase: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studyOptionNormal: {
    backgroundColor: colors.backgroundCardAlt,
    borderColor: colors.borderGlass,
  },
  studyOptionCorrect: {
    backgroundColor: colors.correctLight,
    borderColor: colors.correctBorder,
  },
  studyOptionDisabled: {
    backgroundColor: colors.backgroundCardAlt,
    borderColor: 'transparent',
    opacity: 0.5,
  },
  studyOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studyPrefixBadge: {
    width: 22,
    height: 22,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  studyPrefixNormal: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.borderGlass,
  },
  studyPrefixCorrect: {
    backgroundColor: colors.correct,
    borderColor: colors.correct,
  },
  studyPrefixDisabled: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
  },
  studyPrefixBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyPrefixTextNormal: {
    color: colors.textSecondary,
  },
  studyPrefixTextCorrect: {
    color: '#FFFFFF',
  },
  studyPrefixTextDisabled: {
    color: colors.textMuted,
  },
  studyOptionContentText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyOptionTextNormal: {
    color: colors.textPrimary,
  },
  studyOptionTextCorrect: {
    color: colors.correct,
  },
  studyOptionTextDisabled: {
    color: colors.textMuted,
  },
  studyExplanationCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  studyExpCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    paddingBottom: 10,
    marginBottom: 12,
  },
  studyExpHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studyExpTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F1',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyExpAITag: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  studyExpAIText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyExpContent: {
    paddingBottom: 5,
  },
  studyLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  studyLoadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderGlass,
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 76 : 60,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  studyFooterBtn: {
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  studyFooterBtnDisabled: {
    borderColor: 'transparent',
    backgroundColor: '#F8FAFC',
    opacity: 0.5,
  },
  studyFooterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  studyFooterBtnTextDisabled: {
    color: colors.textMuted,
  },
  studyFooterFilledBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  studyFooterFilledText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  expHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6366F1',
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
    color: '#6366F1',
    fontSize: 12,
    marginRight: 4,
    lineHeight: 14,
  },
  expNumber: {
    color: '#6366F1',
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
});
