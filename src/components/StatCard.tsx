import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Card from '@/components/Card';
import { usePreferences } from '@/context/PreferencesContext';

type StatCardProps = {
  label: string;
  value: string;
  caption?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

const StatCard: React.FC<StatCardProps> = ({ label, value, caption, icon = 'stats-chart-outline' }) => {
  const { theme } = usePreferences();

  return (
    <Card style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: `${theme.colors.primary}1A` }]}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {caption ? (
        <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{caption}</Text>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 8,
    flex: 1
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 13,
    fontWeight: '600'
  },
  value: {
    fontSize: 20,
    fontWeight: '700'
  },
  caption: {
    fontSize: 12,
    fontWeight: '500'
  }
});

export default StatCard;
