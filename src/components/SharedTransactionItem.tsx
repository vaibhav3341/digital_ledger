import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LedgerTransaction } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatAmountFromCents, formatDate } from '../utils/format';

interface SharedTransactionItemProps {
  item: LedgerTransaction;
}

export default function SharedTransactionItem({
  item,
}: SharedTransactionItemProps) {
  const txnDate = item.txnAt?.toDate?.();
  const directionLabel = item.direction === 'SENT' ? 'Sent' : 'Received';
  const directionStyle =
    item.direction === 'SENT' ? styles.directionSent : styles.directionReceived;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.recipientNameSnapshot || 'Recipient'}</Text>
        <Text style={styles.amount}>{formatAmountFromCents(item.amountCents)}</Text>
      </View>
      <Text style={[styles.direction, directionStyle]}>{directionLabel}</Text>
      <Text style={styles.date}>
        {txnDate ? formatDate(txnDate) : 'Saving...'}
      </Text>
      {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
    </View>
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  date: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  direction: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
  },
  directionSent: {
    color: colors.primary,
  },
  directionReceived: {
    color: colors.danger,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
});
