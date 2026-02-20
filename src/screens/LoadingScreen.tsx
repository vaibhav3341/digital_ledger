import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.brandCircle}>
        <Text style={styles.brandInitials}>SL</Text>
      </View>
      <Text style={styles.brandName}>Shared Ledger</Text>
      <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      <Text style={styles.statusText}>Syncing ledger...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.screenHorizontal,
  },
  brandCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.border,
  },
  brandInitials: {
    ...typography.subtitle,
    color: colors.primary,
  },
  brandName: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.md,
  },
  loader: {
    marginTop: spacing.lg,
  },
  statusText: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.sm,
  },
});
