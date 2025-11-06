import React from 'react';
import { StyleSheet, Switch, Text, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  style?: ViewStyle;
};

const ToggleRow: React.FC<ToggleRowProps> = ({ label, description, value, onValueChange, style }) => {
  const { theme } = usePreferences();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textGroup}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? '#ffffff' : '#f5f5f5'}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12
  },
  textGroup: {
    flex: 1,
    paddingRight: 12
  },
  label: {
    fontSize: 16,
    fontWeight: '600'
  },
  description: {
    marginTop: 4,
    fontSize: 13
  }
});

export default ToggleRow;
