import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type SectionTitleProps = {
  title: string;
  caption?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  captionStyle?: TextStyle;
  action?: React.ReactNode;
};

const SectionTitle: React.FC<SectionTitleProps> = ({ title, caption, style, titleStyle, captionStyle, action }) => {
  const { theme } = usePreferences();

  return (
    <View style={[styles.container, style]}>
      <View>
        <Text style={[styles.title, { color: theme.colors.text }, titleStyle]}>{title}</Text>
        {caption ? (
          <Text style={[styles.caption, { color: theme.colors.textMuted }, captionStyle]}>{caption}</Text>
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
