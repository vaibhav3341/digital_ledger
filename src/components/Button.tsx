import React from 'react';
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import AnimatedButton from './AnimatedButton';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'large' | 'compact';

interface ButtonProps {
  label: string;
  onPress: (event?: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  loading?: boolean;
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
  size = 'large',
  icon,
  loading,
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

  const minHeight = size === 'large' ? 48 : 44;

  return (
    <AnimatedButton
      mode={modeMap[variant]}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      containerStyle={style}
      buttonColor={buttonColor}
      textColor={textColor}
      labelStyle={styles.label}
      contentStyle={[styles.content, { minHeight }]}
      style={[
        styles.base,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
      ]}
    >
      {label}
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  content: {
    minHeight: 48,
  },
  label: {
    ...typography.bodyStrong,
  },
  secondary: {
    backgroundColor: colors.card,
  },
  ghost: {
    borderRadius: 10,
  },
});
