import { DefaultTheme, DarkTheme, Theme as NavigationTheme } from '@react-navigation/native';

import { MedusaTheme } from './types';

const spacingUnit = 8;

const baseTheme = {
  spacing: (multiplier = 1) => spacingUnit * multiplier,
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 32
  },
  typography: {
    xs: { fontSize: 12, lineHeight: 16, fontWeight: 'regular' as const },
    sm: { fontSize: 14, lineHeight: 20, fontWeight: 'regular' as const },
    md: { fontSize: 16, lineHeight: 22, fontWeight: 'medium' as const },
    lg: { fontSize: 20, lineHeight: 26, fontWeight: 'semibold' as const },
    xl: { fontSize: 24, lineHeight: 32, fontWeight: 'bold' as const },
    hero: { fontSize: 30, lineHeight: 38, fontWeight: 'bold' as const }
  },
  elevation: {
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 6
    }
  }
};

export const lightTheme: MedusaTheme = {
  name: 'light',
  isDark: false,
  colors: {
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceAlt: '#F2F2F2',
    card: '#FFFFFF',
    cardMuted: '#E7E7E7',
    border: '#E1E1E1',
    borderStrong: '#C8C8C8',
    headerBackground: '#000000',
    headerTint: '#FFFFFF',
    primary: '#06A852',
    primaryAlt: '#018E45',
    success: '#06A852',
    danger: '#D93025',
    warning: '#FFA000',
    text: '#121212',
    textSecondary: '#4A4A4A',
    textMuted: '#7A7A7A',
    accent: '#06A852',
    tabBarBackground: '#FFFFFF',
    tabBarInactive: '#7A7A7A',
    tabBarActive: '#06A852',
    divider: '#E5E5E5',
    inputBackground: '#FFFFFF',
    inputPlaceholder: '#9E9E9E',
    overlay: 'rgba(0,0,0,0.35)',
    shadow: 'rgba(16, 24, 40, 0.08)'
  },
  ...baseTheme
};

export const darkTheme: MedusaTheme = {
  name: 'dark',
  isDark: true,
  colors: {
    background: '#101010',
    surface: '#181818',
    surfaceAlt: '#202020',
    card: '#181818',
    cardMuted: '#242424',
    border: '#2E2E2E',
    borderStrong: '#3A3A3A',
    headerBackground: '#000000',
    headerTint: '#FFFFFF',
    primary: '#06A852',
    primaryAlt: '#03A04A',
    success: '#06A852',
    danger: '#FF6459',
    warning: '#FFC857',
    text: '#F7F7F7',
    textSecondary: '#D0D0D0',
    textMuted: '#9E9E9E',
    accent: '#06A852',
    tabBarBackground: '#101010',
    tabBarInactive: '#7A7A7A',
    tabBarActive: '#06A852',
    divider: '#262626',
    inputBackground: '#1F1F1F',
    inputPlaceholder: '#9E9E9E',
    overlay: 'rgba(0,0,0,0.55)',
    shadow: 'rgba(0, 0, 0, 0.45)'
  },
  ...baseTheme
};

export const buildNavigationTheme = (theme: MedusaTheme): NavigationTheme => {
  const base = theme.isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.isDark,
    colors: {
      ...base.colors,
      background: theme.colors.background,
      border: theme.colors.border,
      card: theme.colors.card,
      primary: theme.colors.primary,
      text: theme.colors.text
    }
  };
};

export type { MedusaTheme } from './types';
