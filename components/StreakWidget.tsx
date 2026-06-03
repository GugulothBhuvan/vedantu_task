import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Flame } from 'lucide-react-native';
import { useThemeColors } from '../constants/colors';

interface StreakWidgetProps {
  streak: number;
}

export function StreakWidget({ streak }: StreakWidgetProps) {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Flame color="#FFF" size={14} fill="#FFF" />
        <Text style={styles.streakText}>{streak}</Text>
      </View>
      <Text style={styles.labelText}>
        {streak === 1 ? 'DAY' : 'DAYS'} STREAK
      </Text>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.goldLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gold + '40', // 25% opacity
    paddingRight: 14,
    paddingLeft: 4,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  streakText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  labelText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
});
