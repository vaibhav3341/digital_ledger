import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { Transaction } from '../models/types';
import { formatAmount, formatDate } from '../utils/format';

interface LedgerItemProps {
  item: Transaction;
  onPress?: () => void;
}

export default function LedgerItem({ item, onPress }: LedgerItemProps) {
  const isPaid = item.type === 'PAID_TO_COWORKER';

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.row}>
        <View>
          <Text style={styles.type}>{isPaid ? 'Paid' : 'Received'}</Text>
          <Text style={styles.date}>{formatDate(item.timestamp.toDate())}</Text>
        </View>
        <Text style={[styles.amount, isPaid ? styles.amountPaid : styles.amountReceived]}>
          {formatAmount(item.amount)}
        </Text>
      </View>
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
      {item.paymentMode ? (
        <Text style={styles.meta}>Mode: {item.paymentMode}</Text>
      ) : null}
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
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  date: {
    fontSize: 12,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountPaid: {
    color: colors.primary,
  },
  amountReceived: {
    color: colors.danger,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
  meta: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
});
