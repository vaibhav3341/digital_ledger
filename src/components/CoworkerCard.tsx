import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatAmount, formatDate } from '../utils/format';

interface CoworkerCardProps {
  name: string;
  balance: number;
  lastActivity?: Date | null;
  onPress: () => void;
}

export default function CoworkerCard({
  name,
  balance,
  lastActivity,
  onPress,
}: CoworkerCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.balance}>{formatAmount(balance)}</Text>
      </View>
      <Text style={styles.meta}>
        Last entry: {lastActivity ? formatDate(lastActivity) : 'No entries'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  balance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.muted,
    fontSize: 12,
  },
});
