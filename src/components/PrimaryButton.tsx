import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type PrimaryButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
};

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  style,
  disabled = false,
  loading = false,
  variant = 'primary'
}) => {
  const { theme } = usePreferences();

  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const backgroundColor = (() => {
    if (isOutline) return 'transparent';
    if (isSecondary) return theme.colors.surface;
    return theme.colors.primary;
  })();

  const borderColor = isOutline ? theme.colors.primary : 'transparent';
  const textColor = isOutline
    ? theme.colors.primary
    : isSecondary
    ? theme.colors.text
    : theme.colors.headerTint;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.6 : 1,
          shadowColor: theme.colors.shadow
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1.5,
    elevation: 3
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3
  }
});

export default PrimaryButton;
