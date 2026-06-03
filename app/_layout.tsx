import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, StyleSheet } from 'react-native';
import { useThemeColors } from '../constants/colors';
import { Home, Sparkles, BookOpen, TrendingUp } from 'lucide-react-native';

export default function AppLayout() {
  const colors = useThemeColors();
  const styles = getStyles(colors);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <SafeAreaProvider style={styles.safeArea}>
      <StatusBar style={colors.background === '#121212' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.backgroundCard,
            borderTopColor: colors.borderGlass,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 88 : 68,
            paddingBottom: Platform.OS === 'ios' ? 30 : 12,
            paddingTop: 12,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: colors.background === '#121212' ? 0.15 : 0.04,
            shadowRadius: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: Platform.OS === 'web' ? 'Outfit, sans-serif' : undefined,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Home color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color, size }) => (
              <Sparkles color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="question_bank"
          options={{
            title: 'Question Bank',
            tabBarIcon: ({ color, size }) => (
              <BookOpen color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, size }) => (
              <TrendingUp color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            href: null, // Hide settings from bottom tabs but keep it routeable
          }}
        />
        <Tabs.Screen
          name="coming_soon"
          options={{
            href: null, // Hide from bottom tabs but keep it routeable
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
