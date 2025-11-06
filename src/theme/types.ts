export type ThemeMode = 'light' | 'dark';

export type FontWeights = 'regular' | 'medium' | 'semibold' | 'bold';

export type TypographyScale = {
  fontSize: number;
  lineHeight: number;
  fontWeight: FontWeights;
};

export interface MedusaTheme {
  name: ThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    card: string;
    cardMuted: string;
    border: string;
    borderStrong: string;
    headerBackground: string;
    headerTint: string;
    primary: string;
    primaryAlt: string;
    success: string;
    danger: string;
    warning: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    tabBarBackground: string;
    tabBarInactive: string;
    tabBarActive: string;
    divider: string;
    inputBackground: string;
    inputPlaceholder: string;
    overlay: string;
    shadow: string;
  };
  spacing: (multiplier?: number) => number;
  radii: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    pill: number;
  };
  typography: {
    xs: TypographyScale;
    sm: TypographyScale;
    md: TypographyScale;
    lg: TypographyScale;
    xl: TypographyScale;
    hero: TypographyScale;
  };
  elevation: {
    sm: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    md: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}
