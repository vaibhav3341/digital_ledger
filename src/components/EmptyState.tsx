import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from 'react-native-paper';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function EmptyState({
  title,
  subtitle,
  icon = 'inbox-outline',
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Avatar.Icon
          icon={icon}
          size={32}
          color={colors.primary}
          style={styles.iconAvatar}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onActionPress ? (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          size="compact"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    marginHorizontal: spacing.xs,
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    marginBottom: spacing.sm,
  },
  iconAvatar: {
    backgroundColor: colors.accent,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    color: colors.muted,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.md,
    minWidth: 160,
  },
});
