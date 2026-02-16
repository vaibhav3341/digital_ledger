import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface InputProps {
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  prefixText?: string;
  maxLength?: number;
}

export default function Input({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry,
  prefixText,
  maxLength,
}: InputProps) {
  return (
    <View style={styles.wrapper}>
      <PaperTextInput
        mode="outlined"
        label={label}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        style={styles.input}
        outlineStyle={styles.outline}
        left={
          prefixText ? <PaperTextInput.Affix text={prefixText} /> : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
  },
  outline: {
    borderRadius: 10,
  },
});
