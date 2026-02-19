import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import Button, { ButtonVariant } from './Button';

interface StickyAction {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
}

interface StickyActionBarProps {
  actions: StickyAction[];
}

export default function StickyActionBar({ actions }: StickyActionBarProps) {
  const insets = useSafeAreaInsets();
  const horizontal = actions.length <= 2;

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={[styles.row, horizontal ? styles.rowHorizontal : styles.rowVertical]}>
        {actions.map((action, index) => (
          <Button
            key={`${action.label}-${index}`}
            label={action.label}
            onPress={action.onPress}
            variant={action.variant || 'primary'}
            disabled={action.disabled}
            loading={action.loading}
            icon={action.icon}
            style={[
              horizontal ? styles.actionHorizontal : styles.actionVertical,
              horizontal && index > 0 ? styles.actionHorizontalGap : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.stickyBarVertical,
  },
  row: {
    width: '100%',
  },
  rowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowVertical: {
    flexDirection: 'column',
  },
  actionHorizontal: {
    flex: 1,
  },
  actionHorizontalGap: {
    marginLeft: spacing.sm,
  },
  actionVertical: {
    marginTop: spacing.xs,
  },
});
