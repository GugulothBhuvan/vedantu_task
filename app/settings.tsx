import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useProgressStore } from '../store/useProgressStore';
import { useQuizStore } from '../store/useQuizStore';
import { useThemeColors } from '../constants/colors';
import { Settings as SettingsIcon, Save, RotateCcw, AlertTriangle, Check } from 'lucide-react-native';

export default function SettingsScreen() {
  const progress = useProgressStore();
  const quiz = useQuizStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [name, setName] = useState(progress.username);
  const [score, setScore] = useState(progress.targetScore.toString());
  const [subject, setSubject] = useState(progress.preferredSubject);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [scoreFocused, setScoreFocused] = useState(false);

  const handleSave = () => {
    if (!name.trim()) return;
    
    // Save to store
    progress.onboardUser(name, parseInt(score) || 650, subject);
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetData = () => {
    const performReset = () => {
      progress.resetProgress();
      quiz.resetSession();
    };

    if (Platform.OS === 'web') {
      const confirmReset = window.confirm(
        'Are you absolutely sure you want to reset all progress? This will delete your streaks, score goals, and topic mastery history.'
      );
      if (confirmReset) performReset();
    } else {
      Alert.alert(
        'Reset Practice Progress',
        'Are you absolutely sure? This will permanently delete your streaks, score targets, and topic mastery history.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset Everything', style: 'destructive', onPress: performReset },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Page Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <SettingsIcon color={colors.primaryLight} size={22} />
          <Text style={styles.title}>Practice Preferences</Text>
        </View>
        <Text style={styles.subtitle}>
          Configure your personal goals, name, and adaptive parameters.
        </Text>
      </View>

      <View style={styles.formCard}>
        {/* Username */}
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={[styles.input, nameFocused && styles.inputFocused]}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          value={name}
          onChangeText={setName}
          placeholder="Enter name"
          placeholderTextColor={colors.textMuted}
        />

        {/* Target Score */}
        <Text style={styles.label}>NEET Target Score (out of 720)</Text>
        <TextInput
          style={[styles.input, scoreFocused && styles.inputFocused]}
          onFocus={() => setScoreFocused(true)}
          onBlur={() => setScoreFocused(false)}
          value={score}
          onChangeText={setScore}
          keyboardType="numeric"
          placeholder="e.g. 680"
          placeholderTextColor={colors.textMuted}
        />

        {/* Preferred Subject */}
        <Text style={styles.label}>Preferred Subject</Text>
        <View style={styles.subjectSelector}>
          {['Biology', 'Chemistry', 'Physics'].map((sub) => {
            const isSelected = subject === sub;
            return (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.subjectButton,
                  isSelected && styles.subjectButtonSelected,
                ]}
                onPress={() => setSubject(sub)}
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

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
          <Save color="#FFF" size={16} />
          <Text style={styles.saveBtnText}>Save Preferences</Text>
        </TouchableOpacity>

        {saveSuccess && (
          <View style={styles.successBanner}>
            <Check color={colors.correct} size={15} />
            <Text style={styles.successText}>Preferences updated successfully!</Text>
          </View>
        )}
      </View>

      {/* Danger Zone */}
      <Text style={styles.sectionHeader}>Danger Zone</Text>
      <View style={[styles.formCard, styles.dangerCard]}>
        <View style={styles.dangerHeaderRow}>
          <AlertTriangle color={colors.incorrect} size={18} />
          <Text style={styles.dangerTitle}>Reset Local Progress Cache</Text>
        </View>
        <Text style={styles.dangerSubtitle}>
          This will wipe your active practice streak, clear all recorded correct/incorrect answers, and revert you back to onboarding.
        </Text>
        
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetData}
          activeOpacity={0.8}
        >
          <RotateCcw color="#FFF" size={16} />
          <Text style={styles.resetBtnText}>Clear Practice Cache</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  formCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    padding: 24,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: colors.background === '#121212' ? 0.2 : 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  input: {
    backgroundColor: colors.backgroundCardAlt,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 14,
    color: colors.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        transitionProperty: 'all',
        transitionDuration: '200ms',
      },
    }),
  },
  inputFocused: {
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  subjectSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  subjectButton: {
    flex: 1,
    backgroundColor: colors.backgroundCardAlt,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        transitionProperty: 'all',
        transitionDuration: '150ms',
      },
    }),
  },
  subjectButtonSelected: {
    backgroundColor: colors.primaryLight + '1F',
    borderColor: colors.primaryLight,
  },
  subjectButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subjectButtonTextSelected: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    ...Platform.select({
      web: {
        transitionProperty: 'all',
        transitionDuration: '150ms',
      },
    }),
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  successBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.correctLight,
    borderWidth: 1,
    borderColor: colors.correctBorder,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 16,
    gap: 8,
  },
  successText: {
    color: colors.correct,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  dangerCard: {
    borderColor: colors.incorrectBorder,
    shadowColor: colors.incorrect,
    shadowOpacity: 0.1,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dangerTitle: {
    color: colors.incorrect,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  dangerSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  resetBtn: {
    backgroundColor: colors.incorrect,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    ...Platform.select({
      web: {
        transitionProperty: 'all',
        transitionDuration: '150ms',
      },
    }),
  },
  resetBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
});
