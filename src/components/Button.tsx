import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import AnimatedButton from './AnimatedButton';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

const modeMap = {
  primary: 'contained',
  secondary: 'outlined',
  danger: 'contained',
  ghost: 'text',
} as const;

export default function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  style,
}: ButtonProps) {
  const buttonColor =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : undefined;

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? colors.text
        : colors.primary;

  return (
    <AnimatedButton
      mode={modeMap[variant]}
      onPress={onPress}
      disabled={disabled}
      containerStyle={style}
      buttonColor={buttonColor}
      textColor={textColor}
      labelStyle={styles.label}
      contentStyle={styles.content}
      style={[
        styles.base,
        variant === 'secondary' ? styles.secondary : null,
      ]}
    >
      {label}
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  content: {
    minHeight: 44,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: colors.card,
  },
});
