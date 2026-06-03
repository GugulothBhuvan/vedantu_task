import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react-native';
import { Question } from '../store/useQuizStore';
import { useThemeColors } from '../constants/colors';

interface QuestionCardProps {
  question: Question;
  selectedOptionIndex: number | null;
  isEvaluated: boolean;
  onSelectOption: (index: number) => void;
}

export function QuestionCard({
  question,
  selectedOptionIndex,
  isEvaluated,
  onSelectOption,
}: QuestionCardProps) {
  const colors = useThemeColors();

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'hard':
        return colors.incorrect;
      case 'medium':
        return colors.gold;
      default:
        return colors.correct;
    }
  };

  const diffColor = getDifficultyColor(question.difficulty);
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      {/* Question Header Metadata */}
      <View style={styles.header}>
        <View style={styles.topicBadge}>
          <HelpCircle color={colors.primaryLight} size={14} style={styles.helpIcon} />
          <Text style={styles.topicText}>{question.topic}</Text>
        </View>
        <View
          style={[
            styles.diffBadge,
            { backgroundColor: `${diffColor}15`, borderColor: `${diffColor}30` },
          ]}
        >
          <Text
            style={[
              styles.diffText,
              { color: diffColor },
            ]}
          >
            {question.difficulty.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Question Body */}
      <Text style={styles.questionText}>{question.questionText}</Text>

      {/* Options Stack */}
      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
          const isSelected = selectedOptionIndex === index;
          const isCorrect = question.correctOptionIndex === index;
          
          let optionStyle: any = styles.optionNormal;
          let textStyle: any = styles.optionTextNormal;
          let prefixBadgeStyle: any = styles.prefixNormal;
          let prefixTextStyle: any = styles.prefixTextNormal;
          let icon = null;

          if (isEvaluated) {
            if (isCorrect) {
              optionStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
              prefixBadgeStyle = styles.prefixCorrect;
              prefixTextStyle = styles.prefixTextCorrect;
              icon = <CheckCircle2 color={colors.correct} size={20} />;
            } else if (isSelected) {
              optionStyle = styles.optionIncorrect;
              textStyle = styles.optionTextIncorrect;
              prefixBadgeStyle = styles.prefixIncorrect;
              prefixTextStyle = styles.prefixTextIncorrect;
              icon = <XCircle color={colors.incorrect} size={20} />;
            } else {
              optionStyle = styles.optionFaded;
              textStyle = styles.optionTextFaded;
              prefixBadgeStyle = styles.prefixFaded;
              prefixTextStyle = styles.prefixTextFaded;
            }
          } else if (isSelected) {
            optionStyle = styles.optionSelected;
            textStyle = styles.optionTextSelected;
            prefixBadgeStyle = styles.prefixSelected;
            prefixTextStyle = styles.prefixTextSelected;
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionBase, optionStyle]}
              onPress={() => !isEvaluated && onSelectOption(index)}
              disabled={isEvaluated}
              activeOpacity={0.75}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[styles.prefixBadge, prefixBadgeStyle]}>
                    <Text style={[styles.prefixText, prefixTextStyle]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionBody, textStyle]}>{option}</Text>
                </View>
                {icon}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: colors.background === '#121212' ? 0.4 : 0.08,
    shadowRadius: 24,
    elevation: 10,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  topicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight + '25',
  },
  helpIcon: {
    marginRight: 6,
  },
  topicText: {
    color: colors.primaryLight,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 24,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  optionsContainer: {
    gap: 12,
  },
  optionBase: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    ...Platform.select({
      web: {
        transitionProperty: 'all',
        transitionDuration: '150ms',
      },
    }),
  },
  optionNormal: {
    backgroundColor: colors.backgroundCardAlt,
    borderColor: colors.borderGlass,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight + '1C',
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionCorrect: {
    backgroundColor: colors.correctLight,
    borderColor: colors.correctBorder,
    shadowColor: colors.correct,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionIncorrect: {
    backgroundColor: colors.incorrectLight,
    borderColor: colors.incorrectBorder,
    shadowColor: colors.incorrect,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionFaded: {
    backgroundColor: colors.backgroundCardAlt,
    borderColor: 'rgba(0, 0, 0, 0.02)',
    opacity: 0.45,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  prefixBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  prefixNormal: {
    backgroundColor: colors.background === '#121212' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderColor: colors.borderGlass,
  },
  prefixSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  prefixCorrect: {
    backgroundColor: colors.correct,
    borderColor: colors.correctBorder,
  },
  prefixIncorrect: {
    backgroundColor: colors.incorrect,
    borderColor: colors.incorrectBorder,
  },
  prefixFaded: {
    backgroundColor: colors.background === '#121212' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
    borderColor: 'transparent',
  },
  prefixText: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  prefixTextNormal: {
    color: colors.textSecondary,
  },
  prefixTextSelected: {
    color: '#FFF',
  },
  prefixTextCorrect: {
    color: '#FFF',
  },
  prefixTextIncorrect: {
    color: '#FFF',
  },
  prefixTextFaded: {
    color: colors.textMuted,
  },
  optionBody: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  optionTextNormal: {
    color: colors.optionText,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: colors.correct,
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: colors.incorrect,
    fontWeight: '600',
  },
  optionTextFaded: {
    color: colors.textMuted,
  },
});
