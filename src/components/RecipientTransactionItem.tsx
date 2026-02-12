import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LedgerTransaction } from '../models/types';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { formatAmountFromCents, formatDate } from '../utils/format';

interface RecipientTransactionItemProps {
  item: LedgerTransaction;
}

export default function RecipientTransactionItem({
  item,
}: RecipientTransactionItemProps) {
  const isSent = item.direction === 'SENT';
  const txnDate = item.txnAt?.toDate?.();

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.type}>{isSent ? 'Sent' : 'Received'}</Text>
        <Text style={[styles.amount, isSent ? styles.send : styles.receive]}>
          {formatAmountFromCents(item.amountCents)}
        </Text>
      </View>
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
  type: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  send: {
    color: colors.primary,
  },
  receive: {
    color: colors.danger,
  },
  date: {
    marginTop: spacing.xs,
    fontSize: 12,
    color: colors.muted,
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.text,
  },
});
