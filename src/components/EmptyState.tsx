import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { usePreferences } from '@/context/PreferencesContext';

type EmptyStateProps = {
  title?: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Nada por aqui ainda',
  subtitle = 'Assim que chegarem dados novos eles aparecem automaticamente.',
  icon = 'analytics-outline'
}) => {
  const { theme } = usePreferences();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      <Ionicons name={icon} size={28} color={theme.colors.textMuted} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center'
  }
});

export default EmptyState;
