import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle
} from 'react-native';

import { usePreferences } from '@/context/PreferencesContext';

type TextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
};

const TextField: React.FC<TextFieldProps> = ({ label, error, containerStyle, style, ...props }) => {
  const { theme } = usePreferences();

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            color: theme.colors.text,
            borderColor: error ? theme.colors.danger : theme.colors.border
          },
          style
        ]}
        placeholderTextColor={theme.colors.inputPlaceholder}
        {...props}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600'
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600'
  }
});

export default TextField;
