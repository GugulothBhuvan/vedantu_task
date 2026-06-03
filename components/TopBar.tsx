import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame, Bell } from 'lucide-react-native';
import { useProgressStore } from '../store/useProgressStore';
import { useThemeColors } from '../constants/colors';

interface TopBarProps {
  title: string;
  subtitle: string;
  onBellPress?: () => void;
  onAvatarPress?: () => void;
}

export default function TopBar({ title, subtitle, onBellPress, onAvatarPress }: TopBarProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const { streak } = useProgressStore();

  return (
    <View style={styles.header}>
      <View style={styles.leftCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.rightRow}>
        {/* Streak Badge */}
        <TouchableOpacity
          style={styles.streakBadge}
          onPress={() => router.push('/analytics')}
          activeOpacity={0.7}
        >
          <Flame color="#FF693D" size={16} fill="#FF693D" />
          <Text style={styles.streakText}>{streak}</Text>
        </TouchableOpacity>

        {/* Bell / Notifications */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onBellPress}
          activeOpacity={0.7}
        >
          <Bell color={colors.textPrimary} size={20} />
          <View style={styles.notifDot} />
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={onAvatarPress || (() => router.push('/settings'))}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/avatar.png')}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(15, 23, 42, 0.05)',
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 61, 0.08)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF693D',
    fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
});
