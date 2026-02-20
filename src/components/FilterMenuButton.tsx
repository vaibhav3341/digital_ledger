import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface FilterMenuButtonProps {
  label: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function FilterMenuButton({
  label,
  value,
  onPress,
  style,
}: FilterMenuButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed ? styles.buttonPressed : null,
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text numberOfLines={1} style={styles.value}>
          {value}
        </Text>
      </View>
      <Text style={styles.caret}>v</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    minHeight: 48,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonPressed: {
    opacity: 0.86,
    backgroundColor: colors.accent,
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  caret: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.muted,
  },
});
