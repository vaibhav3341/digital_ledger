import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import EmptyState from './EmptyState';

type FeedbackVariant = 'loading' | 'empty' | 'error';

interface FeedbackStateProps {
  variant: FeedbackVariant;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export default function FeedbackState({
  variant,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: FeedbackStateProps) {
  if (variant === 'loading') {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>{title}</Text>
        {subtitle ? <Text style={styles.loadingSubtext}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <EmptyState
      title={title}
      subtitle={subtitle}
      icon={variant === 'error' ? 'alert-circle-outline' : 'inbox-outline'}
      actionLabel={actionLabel}
      onActionPress={onActionPress}
    />
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.sm,
  },
  loadingSubtext: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
