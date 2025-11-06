import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type CardProps = ViewProps & {
  variant?: 'default' | 'muted' | 'overlay';
  padded?: boolean;
};

const Card: React.FC<CardProps> = ({ variant = 'default', style, padded = true, ...props }) => {
  const { theme } = usePreferences();
  const backgroundColor =
    variant === 'muted' ? theme.colors.cardMuted : theme.colors.card;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, shadowColor: theme.colors.shadow },
        padded && styles.padded,
        style
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(12, 20, 33, 0.04)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3
  },
  padded: {
    padding: 20
  }
});

export default Card;
