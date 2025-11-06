import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type SectionTitleProps = {
  title: string;
  caption?: string;
  style?: ViewStyle;
  action?: React.ReactNode;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ title, caption, style, action }) => {
  const { theme } = usePreferences();

  return (
    <View style={[styles.container, style]}>
      <View>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {caption ? (
          <Text style={[styles.caption, { color: theme.colors.textMuted }]}>{caption}</Text>
        ) : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700'
  },
  caption: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500'
  }
});

export default SectionTitle;
