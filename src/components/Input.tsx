import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface InputProps {
  label?: string;
  value: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;
  prefixText?: string;
  maxLength?: number;
  helperText?: string;
  errorText?: string;
  disabled?: boolean;
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
  helperText,
  errorText,
  disabled,
}: InputProps) {
  const isError = Boolean(errorText);

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
        disabled={disabled}
        style={styles.input}
        outlineStyle={[styles.outline, isError ? styles.outlineError : null]}
        activeOutlineColor={isError ? colors.danger : colors.primary}
        left={
          prefixText ? <PaperTextInput.Affix text={prefixText} /> : undefined
        }
      />
      {isError ? <Text style={styles.errorText}>{errorText}</Text> : null}
      {!isError && helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    minHeight: 48,
  },
  outline: {
    borderRadius: 12,
  },
  outlineError: {
    borderColor: colors.danger,
  },
  helperText: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
    marginHorizontal: spacing.xs,
  },
});
