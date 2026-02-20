import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Menu } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

interface OverflowMenuItem {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  triggerLabel?: string;
}

export default function OverflowMenu({
  items,
  triggerLabel = 'Actions',
}: OverflowMenuProps) {
  const [visible, setVisible] = React.useState(false);
  const isTriggerDisabled = items.every((item) => item.disabled);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={triggerLabel}
          disabled={isTriggerDisabled}
          onPress={() => setVisible(true)}
          style={({ pressed }) => [
            styles.trigger,
            pressed ? styles.triggerPressed : null,
            isTriggerDisabled ? styles.triggerDisabled : null,
          ]}
        >
          <Text style={styles.triggerText}>{triggerLabel}</Text>
          <View style={styles.caretWrap}>
            <Text style={styles.caret}>v</Text>
          </View>
        </Pressable>
      }
    >
      {items.map((item, index) => (
        <Menu.Item
          key={`${item.label}-${index}`}
          title={item.label}
          onPress={() => {
            setVisible(false);
            item.onPress();
          }}
          disabled={item.disabled}
        />
      ))}
    </Menu>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  triggerPressed: {
    backgroundColor: colors.accent,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerText: {
    ...typography.bodyStrong,
    color: colors.text,
  },
  caretWrap: {
    marginLeft: spacing.xs,
  },
  caret: {
    ...typography.bodyStrong,
    color: colors.muted,
  },
});
