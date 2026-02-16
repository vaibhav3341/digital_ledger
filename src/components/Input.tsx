import React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';
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
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {prefixText ? (
        <View style={styles.prefixedInput}>
          <Text style={styles.prefixText}>{prefixText}</Text>
          <TextInput
            style={styles.prefixedInputField}
            value={value}
            placeholder={placeholder}
            placeholderTextColor={colors.muted}
            onChangeText={onChangeText}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            maxLength={maxLength}
          />
        </View>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  prefixedInput: {
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefixText: {
    color: colors.text,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  prefixedInputField: {
    flex: 1,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
});
