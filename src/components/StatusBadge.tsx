import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type StatusBadgeProps = {
  status: string;
  label?: string;
  style?: ViewStyle;
};

const statusPalette = {
  paid: { background: '#E6F7ED', text: '#06A852' },
  pending: { background: '#FFF4E5', text: '#FF9800' },
  canceled: { background: '#FDE8E8', text: '#E53935' },
  failed: { background: '#FDE8E8', text: '#E53935' },
  processing: { background: '#E8F0FE', text: '#1E88E5' }
} as const;

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, style }) => {
  const { theme } = usePreferences();
  const key = status.toLowerCase() as keyof typeof statusPalette;
  const palette = statusPalette[key] ?? {
    background: `${theme.colors.primary}1A`,
    text: theme.colors.primary
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.background,
          borderColor: `${palette.text}33`
        },
        style
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{label ?? status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize'
  }
});

export default StatusBadge;
