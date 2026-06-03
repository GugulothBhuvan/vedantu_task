export const COLORS = {
  background: '#F8FAFC',     // Light Slate/Grey background
  backgroundCard: '#FFFFFF', // Pure White Cards
  backgroundCardAlt: '#F1F5F9', // Light Grey Sub-panels
  borderGlass: 'rgba(15, 23, 42, 0.08)',
  borderGlassHover: 'rgba(15, 23, 42, 0.15)',
  
  // Neon accents (Vedantu Outrageous Orange primary)
  primary: '#FF693D',       // Outrageous Orange
  primaryLight: '#FF8A65',
  primaryDark: '#D84B20',
  secondary: '#0F172A',
  accent: '#FFB299',
  
  // Correct / Incorrect states
  correct: '#10B981',
  correctLight: 'rgba(16, 185, 129, 0.06)',
  correctBorder: 'rgba(16, 185, 129, 0.25)',
  
  incorrect: '#F43F5E',
  incorrectLight: 'rgba(244, 63, 94, 0.06)',
  incorrectBorder: 'rgba(244, 63, 94, 0.25)',
  
  // Auxiliary
  gold: '#D97706',          // Darker amber gold for readability
  goldLight: 'rgba(217, 119, 6, 0.1)',
  
  // Text
  textPrimary: '#0F172A',   // Deep slate
  textSecondary: '#475569', // Muted slate
  textMuted: '#94A3B8',
  
  // Custom elements
  cardText: '#0F172A',
  paragraphText: '#334155',
  optionText: '#1E293B',
  borderCustom: 'rgba(255, 105, 61, 0.18)',
};

// Return standard white theme colors directly for all platforms
export function useThemeColors() {
  return COLORS;
}
