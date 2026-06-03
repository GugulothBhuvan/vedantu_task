import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { Sparkles, Lightbulb, GraduationCap } from 'lucide-react-native';
import { useThemeColors } from '../constants/colors';

interface AIExplanationCardProps {
  explanation: string | null;
  isLoading: boolean;
}

const LOADING_TIPS = [
  "Biology represents 50% of the NEET score. Target NCERT direct lines.",
  "Eliminate options first! Crossing out two obvious distractors raises odds to 50%.",
  "In Chemistry, watch out for configuration exceptions (e.g., Chromium and Copper).",
  "Under high stress, write out intermediate values step-by-step to prevent simple math errors.",
  "Read the question carefully. Watch out for 'NOT', 'EXCEPT', or 'INCORRECT' traps.",
  "Double check if units match. Convert centimeters to meters before applying formulas!",
  "Active recall beats passive reading. Explain concepts out loud to test your depth."
];

export function AIExplanationCard({ explanation, isLoading }: AIExplanationCardProps) {
  const colors = useThemeColors();
  const [tipIndex, setTipIndex] = useState(0);
  const styles = getStyles(colors);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <View style={styles.header}>
          <Sparkles color={colors.primaryLight} size={20} />
          <Text style={styles.headerTitle}>AI Conceptual Reinforcement</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryLight} style={styles.loader} />
          <Text style={styles.loadingText}>Analyzing your choice & crafting custom reasoning...</Text>
          <View style={styles.tipBubble}>
            <GraduationCap color={colors.gold} size={16} />
            <Text style={styles.tipBubbleHeader}>HIGH-YIELD NEET TIP</Text>
            <Text style={styles.loadingTip}>"{LOADING_TIPS[tipIndex]}"</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!explanation) return null;

  // Simple, ultra-clean custom parser for markdown to guarantee cross-platform support without external library bloat
  const renderFormattedContent = (text: string) => {
    const lines = text.split('\n');
    let inTipBlock = false;
    let tipContent: string[] = [];

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Handle TIP block boundaries
      if (trimmed.startsWith('> [!TIP]')) {
        inTipBlock = true;
        return null;
      }
      if (inTipBlock) {
        if (trimmed.startsWith('>') || trimmed.startsWith(']')) {
          const innerText = trimmed.replace(/^>\s*/, '');
          if (innerText) tipContent.push(innerText);
          return null;
        } else {
          inTipBlock = false;
          const displayTip = tipContent.join(' ');
          tipContent = [];
          return (
            <View key={`tip-${idx}`} style={styles.tipContainer}>
              <Lightbulb color={colors.gold} size={18} style={styles.tipIcon} />
              <Text style={styles.tipText}>{displayTip}</Text>
            </View>
          );
        }
      }

      // Handle Headers
      if (trimmed.startsWith('###')) {
        const headerText = trimmed.replace(/^###\s*/, '');
        return (
          <Text key={idx} style={styles.sectionHeader}>
            {headerText}
          </Text>
        );
      }

      if (trimmed.startsWith('####')) {
        const headerText = trimmed.replace(/^####\s*/, '');
        return (
          <Text key={idx} style={styles.subSectionHeader}>
            {headerText}
          </Text>
        );
      }

      // Handle Bullet Lists
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        const bulletText = trimmed.replace(/^[\*\-]\s*/, '');
        return (
          <View key={idx} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{bulletText}</Text>
          </View>
        );
      }

      // Handle Numbered Lists
      if (/^\d+\./.test(trimmed)) {
        const listText = trimmed.replace(/^\d+\.\s*/, '');
        const number = trimmed.match(/^\d+/)?.[0] || '1';
        return (
          <View key={idx} style={styles.bulletRow}>
            <View style={styles.numberBadge}>
              <Text style={styles.numberBadgeText}>{number}</Text>
            </View>
            <Text style={styles.bulletText}>{listText}</Text>
          </View>
        );
      }

      // Handle Horizontal Rule
      if (trimmed === '---') {
        return <View key={idx} style={styles.divider} />;
      }

      // Handle standard paragraph text with basic bolding
      if (trimmed.length > 0) {
        // Detect bold markers "**"
        const parts = trimmed.split('**');
        return (
          <Text key={idx} style={styles.paragraphText}>
            {parts.map((part, pIdx) => {
              const isBold = pIdx % 2 === 1;
              return (
                <Text key={pIdx} style={isBold ? styles.boldText : null}>
                  {part}
                </Text>
              );
            })}
          </Text>
        );
      }

      return null;
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Sparkles color={colors.primaryLight} size={20} />
        <Text style={styles.headerTitle}>AI Conceptual Reinforcement</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {renderFormattedContent(explanation)}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderCustom, // Dynamic Accent colored border
    padding: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.background === '#121212' ? 0.15 : 0.05,
    shadowRadius: 20,
    elevation: 8,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    marginVertical: 12,
  },
  loadingCard: {
    borderColor: colors.borderGlass,
    shadowColor: '#000',
    shadowOpacity: colors.background === '#121212' ? 0.3 : 0.06,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    paddingBottom: 12,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  tipBubble: {
    width: '100%',
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.gold + '25',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  tipBubbleHeader: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  loadingTip: {
    color: colors.paragraphText,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  scroll: {
    maxHeight: 500,
  },
  sectionHeader: {
    color: colors.primaryLight,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subSectionHeader: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  paragraphText: {
    color: colors.paragraphText,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingLeft: 4,
  },
  bulletDot: {
    color: colors.primaryLight,
    fontSize: 18,
    marginRight: 10,
    lineHeight: 18,
  },
  numberBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: colors.primaryLight + '25',
    borderColor: colors.primaryLight + '40',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  numberBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  bulletText: {
    color: colors.paragraphText,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  tipContainer: {
    backgroundColor: colors.goldLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gold + '25',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 14,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderGlass,
    marginVertical: 18,
  },
});
