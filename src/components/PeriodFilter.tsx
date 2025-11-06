import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';
import { PeriodFilter } from '@/types/api';

type FilterOption = {
  label: string;
  value: PeriodFilter;
};

type PeriodSelectorProps = {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
  options?: FilterOption[];
  style?: ViewStyle;
};

const DEFAULT_OPTIONS: FilterOption[] = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: 'Últimos 90', value: '90d' },
  { label: '1 ano', value: '1y' }
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  style
}) => {
  const { theme } = usePreferences();

  return (
    <View style={[styles.container, style]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: isActive ? theme.colors.primary : theme.colors.border
                }
              ]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.label,
                  { color: isActive ? theme.colors.headerTint : theme.colors.textSecondary }
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4
  },
  content: {
    gap: 12,
    paddingHorizontal: 4
  },
  pill: {
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10
  },
  label: {
    fontSize: 13,
    fontWeight: '600'
  }
});

export default PeriodSelector;
