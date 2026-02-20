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

export interface SegmentedControlOption<OptionValue extends string> {
  value: OptionValue;
  label: string;
}

interface SegmentedControlProps<OptionValue extends string> {
  value: OptionValue;
  options: SegmentedControlOption<OptionValue>[];
  onChange: (nextValue: OptionValue) => void;
  style?: StyleProp<ViewStyle>;
  equalWidth?: boolean;
}

export default function SegmentedControl<OptionValue extends string>({
  value,
  options,
  onChange,
  style,
  equalWidth = false,
}: SegmentedControlProps<OptionValue>) {
  return (
    <View style={[styles.track, style]}>
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              equalWidth ? styles.optionEqualWidth : null,
              index < options.length - 1 ? styles.optionSpacing : null,
              selected ? styles.optionSelected : null,
              pressed ? styles.optionPressed : null,
            ]}
          >
            <Text
              style={[
                styles.optionLabel,
                selected ? styles.optionLabelSelected : null,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accent,
    padding: spacing.xs,
  },
  option: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  optionEqualWidth: {
    flex: 1,
  },
  optionSpacing: {
    marginRight: spacing.xs,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionPressed: {
    opacity: 0.86,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  optionLabelSelected: {
    color: '#FFFFFF',
  },
});
